import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import TableButton from '../../../../components/TableButton'
import { GetGnProduction, UpdateGnProduction } from '../../../../Functions/FGGroup/GnProduction'
import { GetGnRawMaterialProduct } from '../../../../Functions/FGGroup/GNRawMaterialDetails'

interface PlanState {
	item_id: string
	item_weight: string
	item_weight_type: string
}

const GNInventoryProductionDetailsUpdate: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const productionId = searchParams.get('id')

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [rawMaterialProducts, setRawMaterialProducts] = useState<any[]>([])
	const [clientId, setClientId] = useState<string>('')

	const [formData, setFormData] = useState({
		production_itemName: '',
		batch_no: '',
		total_product_weight: '',
	})

	const [plans, setPlans] = useState<PlanState[]>([
		{
			item_id: '',
			item_weight: '',
			item_weight_type: 'kg',
		},
	])

	const [totalRawWeight, setTotalRawWeight] = useState(0)
	const [totalRawVolume, setTotalRawVolume] = useState(0)

	// Recalculate total raw weight whenever plans change
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

	// Fetch existing production + raw materials
	useEffect(() => {
		const fetchData = async () => {
			if (!productionId) {
				toast.error('Production ID is missing.')
				navigate('/rag/inventory')
				return
			}

			setIsLoading(true)
			try {
				// Fetch raw material products
				const rawRes = await GetGnRawMaterialProduct()
				const rawList = rawRes.data && Array.isArray(rawRes.data) ? rawRes.data : []
				setRawMaterialProducts(rawList)

				// Fetch production by id
				const prodRes = await GetGnProduction({ id: productionId })
				const prodData =
					prodRes.data && Array.isArray(prodRes.data) ? prodRes.data[0] : prodRes.data

				if (!prodData) {
					toast.error('Production record not found.')
					navigate('/rag/inventory')
					return
				}

				// Extract clientId safely (it might be a populated object)
				const rawClientId = prodData.clientId
				const extractedClientId =
					typeof rawClientId === 'object' && rawClientId !== null
						? rawClientId._id || rawClientId.id
						: rawClientId

				setClientId(extractedClientId || '')

				setFormData({
					production_itemName: prodData.production_itemId?.item_name || '',
					batch_no: prodData.batch_no || '',
					total_product_weight: prodData.total_product_weight?.toString() || '',
				})

				if (
					prodData.productionRawItems &&
					Array.isArray(prodData.productionRawItems) &&
					prodData.productionRawItems.length > 0
				) {
					setPlans(
						prodData.productionRawItems.map((item: any) => {
							const unit = item.item_weight_type?.toLowerCase() || 'kg'
							const weight = Number(item.item_weight) || 0
							return {
								item_id: item.item_id?._id || item.item_id || '',
								item_weight:
									(unit === 'kg' || unit === 'ltr' ? weight / 1000 : weight).toString() || '',
								item_weight_type: unit,
							}
						})
					)
				}
			} catch (error: any) {
				toast.error(error?.message || 'Failed to fetch data')
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [productionId, navigate])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handlePlanChange = (index: number, field: keyof PlanState, value: string) => {
		const updated = [...plans]
		updated[index] = { ...updated[index], [field]: value }
		setPlans(updated)
	}

	const addPlan = (event: any) => {
		event.preventDefault()
		setPlans([...plans, { item_id: '', item_weight: '', item_weight_type: 'kg' }])
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
				const updated = [...plans]
				updated.splice(index, 1)
				setPlans(updated)
				toast.success('Item Removed')
			}
		})
	}

	const handleSubmit = async () => {
		try {
			if (!productionId) {
				toast.error('Production ID is missing')
				return
			}

			// Validate
			if (!formData.batch_no) {
				toast.error('Batch No is required')
				return
			}
			if (!formData.total_product_weight) {
				toast.error('Total Product Weight is required')
				return
			}
			const hasInvalidItem = plans.some((p) => !p.item_id || !p.item_weight)
			if (hasInvalidItem) {
				toast.error('Please fill all raw material items')
				return
			}

			setIsSubmitting(true)

			const payload = {
				production_id: productionId,
				batch_no: formData.batch_no,
				total_product_weight: Number(formData.total_product_weight),
				productionRawItems: plans.map((plan) => ({
					item_id: plan.item_id,
					item_weight: Number(plan.item_weight),
					item_weight_type: plan.item_weight_type,
				})),
			}

			const res = await UpdateGnProduction(payload)

			if (res.status === 200 || res.status === 201 || res.status) {
				toast.success('Production Updated Successfully')
				navigate(`/rag/inventory/view/list?clientId=${clientId}`)
			} else {
				toast.error(res.message || 'Failed to update production')
			}
		} catch (error: any) {
			toast.error(error.message || 'Something went wrong')
			console.error(error)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (isLoading) {
		return (
			<div className='text-center py-20'>
				<div
					className='spinner-border text-primary'
					role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
				<p className='text-gray-600 fs-6 mt-3'>Loading production details...</p>
			</div>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update GN Production Details</PageTitle>

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
												{/* Read-only product name */}
												<InputField
													className='col-md-4 fv-row'
													label='Production Name'
													placeholder='Production Name'
													type='text'
													name='production_itemName'
													htmlFor='production_itemName'
													value={formData.production_itemName}
													readOnly
												/>

												<InputField
													className='col-md-4 fv-row'
													label='Batch No'
													placeholder='Enter Batch No'
													type='text'
													name='batch_no'
													htmlFor='batch_no'
													value={formData.batch_no}
													onChange={handleInputChange}
												/>

												<InputField
													className='col-md-4 fv-row'
													label='Total Product Weight'
													placeholder='Enter Total Product Weight'
													type='number'
													name='total_product_weight'
													htmlFor='total_product_weight'
													value={formData.total_product_weight}
													onChange={handleInputChange}
												/>
											</div>
										</div>

										{/* Raw Material Items */}
										<h2 className='mb-4'>Raw Material Items:</h2>
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
														{/* Raw Material Dropdown */}
														<div className='col-md-6 fv-row mb-7'>
															<label className='fw-bold fs-6 mb-5'>Product Raw Type</label>
															<select
																className='form-select form-select-solid'
																value={plan.item_id}
																onChange={(e) =>
																	handlePlanChange(index, 'item_id', e.target.value)
																}>
																<option value=''>Select Raw Material</option>
																{rawMaterialProducts
																	.filter((rm) => rm.unit !== 'pcs')
																	.map((rm) => (
																		<option
																			key={rm._id}
																			value={rm._id}>
																			{rm.name}
																		</option>
																	))}
															</select>
														</div>

														{/* Weight input + unit */}
														<div className='col-md-6 fv-row mb-7'>
															<label className='fw-bold fs-6 mb-md-5 mb-2'>Weight</label>
															<div className='d-flex align-items-center'>
																<input
																	type='number'
																	value={plan.item_weight}
																	onChange={(e) =>
																		handlePlanChange(index, 'item_weight', e.target.value)
																	}
																	placeholder='Enter Weight'
																	className='form-control rounded-end-0 border-end-0 inputfield-bg'
																	style={{
																		borderTopRightRadius: 0,
																		borderBottomRightRadius: 0,
																		borderRight: 'none',
																	}}
																/>
																<select
																	value={plan.item_weight_type}
																	onChange={(e) =>
																		handlePlanChange(index, 'item_weight_type', e.target.value)
																	}
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

													{/* Add / Remove buttons */}
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

										{/* Total Raw Weight (read-only) */}
										<div className='col-12 row'>
											<div className='col-md-6 fv-row'>
												<InputField
													label='Total Raw Weight (KG)'
													placeholder='Total'
													type='text'
													name='total_raw_weight'
													htmlFor='total_raw_weight'
													value={Number(totalRawWeight.toFixed(2)).toString()}
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

										{/* Submit Button */}
										<div className='col-md-12 fv-row mb-7'>
											<div className='d-flex justify-content-end'>
												<button
													type='button'
													className={`btn btn-primary btn-block mb-4 ${
														isSubmitting ? 'disabled' : ''
													}`}
													onClick={handleSubmit}
													disabled={isSubmitting}>
													{isSubmitting ? 'Please wait, updating...' : 'Update Details'}
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

export default GNInventoryProductionDetailsUpdate
