import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import { GetGnClient } from '../../../../Functions/FGGroup/GnClients'
import { AddGnProduction, GetGnProduction } from '../../../../Functions/FGGroup/GnProduction'
import { GetGnRawMaterialProduct } from '../../../../Functions/FGGroup/GNRawMaterialDetails'

interface ProductionItem {
	itemId: string
	itemName: string
	useWeight: number
	pendingWeight: number
	createdAt: string
}

interface PlanState {
	items: string
	item_type?: string
	item_weight: string
	item_weight_type: string
	quantity: string
	amount: string
	gst: string
	discount: string
	totalPayment: string
	duration_number: string
	duration: string
	inputField: boolean
	isDiscountPercentage: boolean
}

const GNInventoryProductionDetailsAdd: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const clientId = searchParams.get('clientId')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isDiscountPercentage, setIsDiscountPercentage] = useState(true)

	const [clientProducts, setClientProducts] = useState<any[]>([])
	const [rawMaterialProducts, setRawMaterialProducts] = useState<any[]>([])

	useEffect(() => {
		const fetchData = async () => {
			if (!clientId) {
				toast.error('Client ID is missing. Please select a client first.')
				navigate('/rag/inventory')
				return
			}

			setIsLoading(true)
			try {
				// Fetch raw material products
				const rawMaterialsRes = await GetGnRawMaterialProduct()
				if (rawMaterialsRes.data) {
					setRawMaterialProducts(Array.isArray(rawMaterialsRes.data) ? rawMaterialsRes.data : [])
				}

				// Fetch client details to get products
				const clientRes = await GetGnClient({ id: clientId })
				if (clientRes.data) {
					const clientData = Array.isArray(clientRes.data) ? clientRes.data[0] : clientRes.data
					let products: any[] = []
					if (clientData?.items && Array.isArray(clientData.items)) {
						products = clientData.items
					}

					// Fetch existing productions for this client
					const productionsRes = await GetGnProduction({ clientId: clientId })
					let existingProductionItemIds: string[] = []
					if (productionsRes.data && Array.isArray(productionsRes.data)) {
						existingProductionItemIds = productionsRes.data.map(
							(p: any) => p.production_itemId?._id || p.production_itemId
						)
					}

					// Filter out products that already have a production record
					const availableProducts = products.filter(
						(product) => !existingProductionItemIds.includes(product._id)
					)
					setClientProducts(availableProducts)
				}
			} catch (error: any) {
				toast.error(error?.message || 'Failed to fetch data')
			} finally {
				setIsLoading(false)
			}
		}
		fetchData()
	}, [clientId, navigate])

	const [productionItems, setProductionItems] = useState<ProductionItem[]>([])

	const [formData, setFormData] = useState({
		production_itemId: '',
		batch_no: '',
		total_product_weight: '',
	})

	const [totalRawWeight, setTotalRawWeight] = useState(0)
	const [totalRawVolume, setTotalRawVolume] = useState(0)

	const [plans, setPlans] = useState<PlanState[]>([
		{
			items: '',
			item_type: '',
			item_weight: '',
			item_weight_type: 'kg',
			quantity: '',
			amount: '',
			gst: '',
			discount: '',
			totalPayment: '',
			duration_number: '',
			duration: '',
			inputField: false,
			isDiscountPercentage: true,
		},
	])

	useEffect(() => {
		let weightKG = 0
		let volumeLtr = 0
		const weightParts: string[] = []
		const volumeParts: string[] = []

		plans.forEach((plan) => {
			const val = parseFloat(plan.item_weight) || 0
			if (val === 0) return

			const type = plan.item_weight_type?.toLowerCase() || 'kg'
			const part = `${val} ${type}`

			if (type === 'kg') {
				weightKG += val
				weightParts.push(part)
			} else if (type === 'gm') {
				weightKG += val / 1000
				weightParts.push(part)
			} else if (type === 'ltr') {
				volumeLtr += val
				volumeParts.push(part)
			} else if (type === 'ml') {
				volumeLtr += val / 1000
				volumeParts.push(part)
			}
		})

		setTotalRawWeight(weightKG)
		setTotalRawVolume(volumeLtr)
	}, [plans])

	const handleSubmit = async () => {
		try {
			if (!clientId) {
				toast.error('Client ID is missing')
				return
			}

			setIsSubmitting(true)

			const payload: any = {
				clientId: clientId,
				production_itemId: formData?.production_itemId,
				batch_no: formData?.batch_no,
				total_product_weight: Number(formData?.total_product_weight),

				productionRawItems: plans.map((plan) => ({
					item_id: rawMaterialProducts.find((rm) => rm.name === plan.item_type)?._id || '',
					item_weight: plan?.item_weight ? Number(plan?.item_weight) : 0,
					item_weight_type: plan?.item_weight_type || 'kg',
				})),
			}

			const res = await AddGnProduction(payload)

			if (res.status === 200 || res.status === 201 || res.status) {
				toast.success('Production Added Successfully')
				setIsSubmitting(false)
				navigate(`/rag/inventory/view/list?clientId=${clientId}`)
			} else {
				toast.error(res.message || 'Failed to add production')
				setIsSubmitting(false)
			}
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handlePlanInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		const newPlans: PlanState[] = [...plans]

		if (name === 'items') {
			newPlans[index].inputField = value === 'Other'
		}

		switch (name) {
			case 'items':
				newPlans[index].items = value
				break
			case 'item_type':
				newPlans[index].item_type = value
				break
			case 'item_weight':
				newPlans[index].item_weight = value
				break
			case 'item_weight_type':
				newPlans[index].item_weight_type = value
				break
			case 'quantity':
				newPlans[index].quantity = value
				break
			case 'amount':
				newPlans[index].amount = value
				break
			case 'gst':
				newPlans[index].gst = value
				break
			case 'discount':
				newPlans[index].discount = value
				break
			case 'duration_number':
				newPlans[index].duration_number = value
				break
			case 'duration':
				newPlans[index].duration = value
				break
			default:
				break
		}

		const quantity = parseFloat(newPlans[index].quantity) || 0
		const amount = parseFloat(newPlans[index].amount) || 0
		const gst = parseFloat(newPlans[index].gst) || 0
		let discount = parseFloat(newPlans[index].discount) || 0

		const isDiscountPercentage =
			newPlans[index].isDiscountPercentage !== undefined
				? newPlans[index].isDiscountPercentage
				: true
		let discountForCalculation = discount
		if (discount > 0) {
			const baseAmount = quantity * amount
			if (isDiscountPercentage) {
				discountForCalculation = (baseAmount * discount) / 100
			}
		}

		let total = quantity * amount

		if (gst) {
			total += (total * gst) / 100
		}

		if (discountForCalculation) {
			total -= discountForCalculation
		}

		newPlans[index].totalPayment = total.toFixed(0)
		setPlans(newPlans)
	}

	const addPlan = (event: any) => {
		event.preventDefault()
		setPlans([
			...plans,
			{
				items: '',
				item_type: '',
				item_weight: '',
				item_weight_type: 'kg',
				quantity: '',
				amount: '',
				gst: '',
				discount: '',
				totalPayment: '',
				duration_number: '',
				duration: '',
				inputField: false,
				isDiscountPercentage: true,
			},
		])
	}

	const removePlan = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then((result) => {
			if (result.isConfirmed) {
				try {
					const newPlans = [...plans]
					newPlans.splice(index, 1)
					setPlans(newPlans)
					toast.success('Product Deleted Successfully')
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>GN Production Details</PageTitle>

			<div className='row'>
				<div className='col-md-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<form>
								<div className='row'>
									<div className='col-12 row'>
										{/* Production Information Section */}
										<h1 className='mb-4 mt-6'>Production Information:</h1>
										<div className='col-12 mb-5'>
											<div className='row py-5 pb-0'>
												<div className='col-md-4 fv-row'>
													<label className='fw-bold fs-6 mb-5'>Production Name</label>
													<select
														name='production_itemId'
														className='form-select form-select-solid'
														value={formData?.production_itemId}
														onChange={handleInputChange}>
														<option value=''>Select Product</option>
														{clientProducts.map((p) => (
															<option
																key={p._id}
																value={p._id}>
																{p.item_name}
															</option>
														))}
													</select>
												</div>
												<InputField
													className='col-md-4 fv-row'
													label='Batch No'
													placeholder='Enter Batch No'
													type='text'
													name='batch_no'
													htmlFor='batch_no'
													value={formData?.batch_no}
													onChange={handleInputChange}
												/>
												<InputField
													className='col-md-4 fv-row'
													label='Total Product Weight'
													placeholder='Enter Total Product Weight'
													type='number'
													name='total_product_weight'
													htmlFor='total_product_weight'
													value={formData?.total_product_weight}
													onChange={handleInputChange}
												/>
											</div>
										</div>
										<h2 className='mb-4'>Supplements:</h2>
										{plans.map((plan, index) => (
											<div
												key={index}
												className='col-12 mb-5'>
												<div
													className='row'
													style={{
														border: '1px solid #00000008',
														borderRadius: '10px',
														backgroundColor: '#00000008',
													}}>
													<div className='col-10 row py-5 pb-0'>
														<SelectField
															className='col-md-6 fv-row mb-7'
															label='Product Raw Type'
															name='item_type'
															value={plan.item_type || ''}
															onChange={(e: any) => handlePlanInputChange(index, e)}
															htmlFor='item_type'
															options={rawMaterialProducts
																.filter((p) => p.unit !== 'pcs')
																.map((p) => p.name)}
														/>

														<div className='col-md-6 fv-row mb-7'>
															<label className='fw-bold fs-6 mb-md-5 mb-2'>Weight</label>
															<div className='d-flex align-items-center '>
																<input
																	type='number'
																	name='item_weight'
																	value={plan.item_weight}
																	onChange={(e: any) => handlePlanInputChange(index, e)}
																	placeholder='Enter Weight'
																	className='form-control rounded-end-0 border-end-0 inputfield-bg'
																	style={{
																		borderTopRightRadius: 0,
																		borderBottomRightRadius: 0,
																		borderRight: 'none',
																	}}
																/>
																<select
																	name='item_weight_type'
																	value={plan.item_weight_type || 'kg'}
																	onChange={(e: any) => handlePlanInputChange(index, e)}
																	className='form-select rounded-start-0'
																	style={{
																		borderTopLeftRadius: 0,
																		borderBottomLeftRadius: 0,
																		width: 'auto',
																		minWidth: '80px',
																	}}>
																	<option value='gm'>gm</option>
																	<option value='kg'>kg</option>
																	<option value='ml'>ml</option>
																	<option value='ltr'>ltr</option>
																</select>
															</div>
														</div>
													</div>
													<div className='col-2'>
														<div className='mt-17 d-flex justify-content-end'>
															{plans.length > 1 && (
																<TableButton
																	action='remove'
																	backgroundDark={true}
																	onClick={(e) => removePlan(index, e)}
																/>
															)}
															<TableButton
																action='add'
																backgroundDark={true}
																onClick={(e) => addPlan(e)}
															/>
														</div>
													</div>
												</div>
											</div>
										))}

										{/* Only Total Field - Updated */}
										<div className='col-12 row'>
											<div className='col-md-6 fv-row'>
												<InputField
													label='Total Raw Weight (KG)'
													placeholder='Total'
													type='text'
													name='total_raw_weight'
													htmlFor='total_raw_weight'
													value={Number(totalRawWeight.toFixed(2)).toString()}
													// value={totalRawWeight}
													readOnly
												/>
											</div>
											<div className='col-md-6 fv-row'>
												<InputField
													label='Total Raw Volume (Ltr)'
													placeholder='Total'
													type='text'
													name='total_raw_volume'
													htmlFor='total_raw_volume'
													value={Number(totalRawVolume.toFixed(2)).toString()}
													readOnly
												/>
											</div>
										</div>
										<div className='col-md-12 fv-row mb-7'>
											<div className='d-flex justify-content-end'>
												<button
													type='button'
													className={`btn btn-primary btn-block mb-4 ${
														isSubmitting || isLoading ? 'disabled' : ''
													}`}
													onClick={handleSubmit}
													disabled={isSubmitting || isLoading}>
													{isSubmitting ? 'Please wait, adding details...' : 'Add Details'}
												</button>
											</div>
										</div>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default GNInventoryProductionDetailsAdd
