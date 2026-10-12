import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../../_metronic/layout/core'
import CopyableInput from '../../../../components/CopyableInput'
import InputField from '../../../../components/InputField'
import TableButton from '../../../../components/TableButton'
import { FileUploadToFGGroup } from '../../../../Functions/FGGroup'
import {
	GetGnRawMaterialProduct,
	GetGnRawMaterialSupplier,
	GetGnRawMaterialSupplierInvoice,
	UpdateGnRawMaterialSupplierInvoice,
} from '../../../../Functions/FGGroup/GNRawMaterialDetails'

interface PlanState {
	product_id: string
	item_weight: string
	item_weight_type: string
	rate: string
	gst: string
	totalPayment: string
}

const GomziNutritionMaterialSuppliersInvoiceEdit: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoice_id: string | any = searchParams.get('invoice_id')
	const [displayImg, setDisplayImg] = useState<string>('')
	const [suppliers, setSuppliers] = useState<any[]>([])
	const [products, setProducts] = useState<any[]>([])
	const [loading, setLoading] = useState(false)

	const [formData, setFormData] = useState({
		_id: '',
		supplier_id: '',
		issue_date: '',
		total_amount: '',
		total_charges: '',
		bill_image: '',
		selectedFile: null as File | null,
	})

	const [plans, setPlans] = useState<PlanState[]>([
		{
			product_id: '',
			item_weight: '',
			item_weight_type: 'kg',
			rate: '',
			gst: '',
			totalPayment: '',
		},
	])

	useEffect(() => {
		fetchSuppliers()
		fetchProducts()
		fetchInvoiceData()
	}, [])

	const fetchInvoiceData = async () => {
		try {
			const response: any = await GetGnRawMaterialSupplierInvoice({ id: invoice_id })

			// Handle different response structures
			let invoice = null
			if (response?.data?.invoices && response.data.invoices.length > 0) {
				invoice = response.data.invoices[0]._doc || response.data.invoices[0]
			} else if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
				invoice = response.data[0]._doc || response.data[0]
			} else if (response?.data && !Array.isArray(response.data)) {
				invoice = response.data._doc || response.data
			}

			if (invoice) {
				// Format date for input field (YYYY-MM-DD)
				let formattedDate = ''
				if (invoice.issue_date) {
					const date = new Date(invoice.issue_date)
					if (!isNaN(date.getTime())) {
						formattedDate = date.toISOString().split('T')[0]
					}
				} else if (invoice.createdAt) {
					// Fallback to createdAt if issue_date doesn't exist
					const date = new Date(invoice.createdAt)
					if (!isNaN(date.getTime())) {
						formattedDate = date.toISOString().split('T')[0]
					}
				}

				setFormData({
					_id: invoice._id || '',
					supplier_id: invoice.supplier_id || '',
					issue_date: formattedDate,
					total_amount: invoice.total_amount?.toString() || '',
					total_charges: invoice.charges?.toString() || '',
					bill_image: invoice.bill_image || '',
					selectedFile: null,
				})
				if (invoice.bill_image) {
					setDisplayImg(`https://files.fggroup.in/${invoice.bill_image}`)
				}
				if (invoice.items && invoice.items.length > 0) {
					const loadedPlans = invoice.items.map((item: any) => {
						return {
							product_id: item.product_id || '',
							item_weight:
								item.weight_type?.toLowerCase().includes('kg') ||
								item.weight_type?.toLowerCase().includes('ltr')
									? (item.weight / 1000).toString()
									: item.weight?.toString() || '',
							item_weight_type: item.weight_type || 'kg',
							rate: item.rate?.toString() || '',
							gst: item.gst?.toString() || '',
							totalPayment: '',
						}
					})
					setPlans(loadedPlans)
				}
				toast.success('Invoice data loaded successfully')
			} else {
				toast.error('Invoice not found')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch invoice data')
		}
	}

	const fetchSuppliers = async () => {
		try {
			const response: any = await GetGnRawMaterialSupplier({})
			if (response?.data) {
				const activeSuppliers = (response.data || []).filter(
					(supplier: any) => supplier.status === true
				)
				setSuppliers(activeSuppliers)
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch suppliers')
		}
	}

	const fetchProducts = async () => {
		try {
			const response: any = await GetGnRawMaterialProduct({})
			if (response?.data) {
				const activeProducts = (response.data || []).filter(
					(product: any) => product.status === true
				)
				setProducts(activeProducts)
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch products')
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleFileButtonClick = () => {
		const input = document.getElementById('fileInput') as HTMLInputElement | null
		if (input) {
			input.click()
		}
	}

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files && event.target.files[0]
		if (file) {
			const objectUrl = URL.createObjectURL(file)
			setDisplayImg(objectUrl)

			try {
				const imageUrl: any = await FileUploadToFGGroup([file], {
					directory: 'supplier-invoices',
				})
				const imgUrl = imageUrl.data?.fileURLs[0]
				setFormData((prev) => ({ ...prev, bill_image: imgUrl, selectedFile: file }))
				setDisplayImg(`https://files.fggroup.in/${imgUrl}`)
				toast.success('Bill image uploaded successfully')
			} catch (error: any) {
				toast.error('Failed to upload image')
			}
		}
	}

	const handlePlanInputChange = (
		index: number,
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		const newPlans: PlanState[] = [...plans]

		switch (name) {
			case 'product_id':
				newPlans[index].product_id = value
				break
			case 'item_weight':
				newPlans[index].item_weight = value
				break
			case 'item_weight_type':
				newPlans[index].item_weight_type = value
				break
			case 'rate':
				newPlans[index].rate = value
				break
			case 'gst':
				newPlans[index].gst = value
				break
			default:
				break
		}

		const rate = parseFloat(newPlans[index].rate) || 0
		const gst = parseFloat(newPlans[index].gst) || 0
		const weight = parseFloat(newPlans[index].item_weight) || 0

		let total = rate * weight

		if (gst) {
			total += (total * gst) / 100
		}

		newPlans[index].totalPayment = total.toFixed(2)
		setPlans(newPlans)
	}

	const addPlan = (event: any) => {
		event.preventDefault()
		setPlans([
			...plans,
			{
				product_id: '',
				item_weight: '',
				item_weight_type: 'kg',
				rate: '',
				gst: '',
				totalPayment: '',
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
				}
			}
		})
	}

	const handleSubmit = async () => {
		if (!formData.supplier_id) {
			toast.error('Please select a supplier')
			return
		}

		if (plans.length === 0 || !plans[0].product_id) {
			toast.error('Please add at least one product')
			return
		}

		setLoading(true)
		try {
			const items = plans.map((plan) => ({
				product_id: plan.product_id,
				rate: parseFloat(plan.rate),
				weight: parseFloat(plan.item_weight),
				weight_type: plan.item_weight_type,
				gst: parseFloat(plan.gst) || 0,
			}))

			const payload: any = {
				id: invoice_id,
				supplier_id: formData.supplier_id,
				items,
				bill_image: formData.bill_image,
				charges: parseFloat(formData.total_charges) || 0,
				total_amount: parseFloat(formData.total_amount) || 0,
			}

			const response = await UpdateGnRawMaterialSupplierInvoice(payload)
			if (response?.status === 200) {
				toast.success('Invoice updated successfully')
				navigate('/rag/inventory/suppliers/invoice/list')
			} else {
				toast.error(response?.message || 'Failed to update invoice')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to update invoice')
		} finally {
			setLoading(false)
		}
	}

	const handleGoBack = () => {
		navigate('/rag/inventory/suppliers/invoice/list')
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Gomzi Nutrition Suppliers Invoice Edit</PageTitle>

			<div className='row'>
				<div className='col-md-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<form>
								{/* Supplier Details Section */}
								<h1 className='mb-4 mt-6'>Supplier Details</h1>
								<div className='row'>
									<div className='col-md-3 text-center'>
										{displayImg ? (
											formData.selectedFile?.type === 'application/pdf' ||
											formData.selectedFile?.name.toLowerCase().endsWith('.pdf') ||
											formData.bill_image?.toLowerCase().endsWith('.pdf') ||
											displayImg.toLowerCase().includes('.pdf') ? (
												<div
													style={{
														borderRadius: '10px',
														width: '70%',
														height: '200px',
														backgroundColor: '#f8f9fa',
														display: 'flex',
														flexDirection: 'column',
														alignItems: 'center',
														justifyContent: 'center',
														border: '1px solid #dee2e6',
													}}>
													<i
														className='bi bi-file-earmark-pdf text-danger'
														style={{ fontSize: '3rem' }}></i>
													<span className='mt-2 text-muted small text-center px-2'>
														{formData.selectedFile?.name || 'Invoice PDF'}
													</span>
												</div>
											) : (
												<img
													alt='supplier'
													src={displayImg}
													style={{ borderRadius: '10px', width: '70%' }}
												/>
											)
										) : (
											<div
												style={{
													borderRadius: '10px',
													width: '70%',
													height: '200px',
													backgroundColor: '#f0f0f0',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}>
												No Image / PDF
											</div>
										)}
										<div>
											<button
												type='button'
												className='mt-5 px-2 py-1 mb-2 btn btn-success'
												onClick={handleFileButtonClick}>
												Upload Photo
											</button>
											<input
												type='file'
												id='fileInput'
												className='d-none'
												accept='image/*,.pdf'
												onChange={handleFileChange}
											/>
										</div>
									</div>
									<div className='col-md-9'>
										<div className='row'>
											<div className='col-md-6 fv-row mb-7'>
												<CopyableInput
													value={formData._id}
													label={'Invoice ID'}
													className='fv-row'
													htmlFor={'_id'}
													placeholder='Invoice ID'
													type='text'
													name='_id'
													onChange={handleInputChange}
													disabled={true}
												/>
											</div>
											<div className='col-md-6 fv-row mb-7'>
												<label className='fw-bold fs-6 mb-5'>Supplier Name</label>
												<select
													name='supplier_id'
													value={formData.supplier_id}
													onChange={handleInputChange}
													className='form-select'>
													<option value=''>Select Supplier</option>
													{suppliers.map((supplier) => (
														<option
															key={supplier._id}
															value={supplier._id}>
															{supplier.name}
														</option>
													))}
												</select>
											</div>
											<InputField
												className='col-md-6 fv-row'
												label='Issue Date'
												placeholder='Enter Issue Date'
												type='date'
												name='issue_date'
												htmlFor='issue_date'
												value={formData?.issue_date}
												onChange={handleInputChange}
											/>
											<InputField
												className='col-md-6 fv-row'
												label='Total Amount'
												placeholder='Enter Amount'
												type='number'
												name='total_amount'
												htmlFor='total_amount'
												value={formData?.total_amount}
												onChange={handleInputChange}
											/>
											<InputField
												className='col-md-6 fv-row'
												label='Total Charges'
												placeholder='Enter Charges'
												type='number'
												name='total_charges'
												htmlFor='total_charges'
												value={formData?.total_charges}
												onChange={handleInputChange}
											/>
										</div>
									</div>
								</div>
								<div className='row mt-5'>
									<div className='col-12 row'>
										<h2 className='mb-4'>Raw Material Details:</h2>
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
														<div className='col-md-6 fv-row mb-7'>
															<label className='fw-bold fs-6 mb-2'>Product Raw Type</label>
															<select
																name='product_id'
																value={plan.product_id}
																onChange={(e: any) => handlePlanInputChange(index, e)}
																className='form-select'>
																<option value=''>Select Product</option>
																{products.map((product) => (
																	<option
																		key={product._id}
																		value={product._id}>
																		{product.name}
																	</option>
																))}
															</select>
														</div>

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
																	<option value='pcs'>pcs</option>
																</select>
															</div>
														</div>
														<InputField
															className='col-md-6 fv-row'
															label='Rate'
															placeholder='Enter Rate'
															type='number'
															name='rate'
															htmlFor='rate'
															value={plan.rate}
															onChange={(e: any) => handlePlanInputChange(index, e)}
														/>
														<InputField
															className='col-md-6 fv-row'
															label='GST (%)'
															placeholder='Enter GST'
															type='number'
															name='gst'
															htmlFor='gst'
															value={plan.gst}
															onChange={(e: any) => handlePlanInputChange(index, e)}
														/>
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
										<div className='col-md-12 fv-row mb-7'>
											<div className='d-flex justify-content-end gap-3'>
												<button
													type='button'
													className='btn btn-secondary btn-block mb-4'
													onClick={handleGoBack}
													disabled={loading}>
													Cancel
												</button>
												<button
													type='button'
													className='btn btn-primary btn-block mb-4'
													onClick={handleSubmit}
													disabled={loading}>
													{loading ? 'Updating...' : 'Update Invoice'}
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

export default GomziNutritionMaterialSuppliersInvoiceEdit
