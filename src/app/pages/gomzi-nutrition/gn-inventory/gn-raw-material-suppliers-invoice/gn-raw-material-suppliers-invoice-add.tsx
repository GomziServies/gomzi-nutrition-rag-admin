import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faBuilding,
	faCheck,
	faFileInvoice,
	faFilePdf,
	faPlus,
	faTrash,
	faUpload,
} from '@fortawesome/free-solid-svg-icons'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import { FileUploadToFGGroup } from '../../../../Functions/FGGroup'
import {
	CreateGnRawMaterialSupplierInvoice,
	GetGnRawMaterialProduct,
	GetGnRawMaterialSupplier,
} from '../../../../Functions/FGGroup/GNRawMaterialDetails'

interface PlanState {
	product_id: string
	item_weight: string
	item_weight_type: string
	rate: string
	gst: string
	totalPayment: string
}

const GomziNutritionMaterialSuppliersInvoiceAdd: React.FC = () => {
	const navigate = useNavigate()
	const [displayImg, setDisplayImg] = useState<string>('')
	const [suppliers, setSuppliers] = useState<any[]>([])
	const [products, setProducts] = useState<any[]>([])
	const [loading, setLoading] = useState(false)

	// Form data for supplier + production
	const [formData, setFormData] = useState({
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
	}, [])

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

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files && event.target.files[0]
		if (file) {
			const objectUrl = URL.createObjectURL(file)
			setDisplayImg(objectUrl)
			setFormData((prev) => ({ ...prev, selectedFile: file }))
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
		if (!formData.issue_date) {
			toast.error('Please select issue date')
			return
		}

		if (!formData.total_amount || Number(formData.total_amount) <= 0) {
			toast.error('Please enter valid total amount')
			return
		}

		if (!formData.total_charges || Number(formData.total_charges) < 0) {
			toast.error('Please enter valid total charges')
			return
		}
		if (plans.length === 0 || !plans[0].product_id) {
			toast.error('Please add at least one product')
			return
		}

		setLoading(true)
		try {
			let imgUrl = ''

			// Upload bill image if selected
			if (formData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([formData.selectedFile], {
					directory: 'supplier-invoices',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Bill image uploaded successfully')
			}

			const items = plans.map((plan) => ({
				product_id: plan.product_id,
				rate: parseFloat(plan.rate),
				weight: parseFloat(plan.item_weight),
				weight_type: plan.item_weight_type,
				gst: parseFloat(plan.gst) || 0,
			}))

			const payload = {
				supplier_id: formData.supplier_id,
				items,
				bill_image: imgUrl,
				charges: parseFloat(formData.total_charges) || 0,
				total_amount: parseFloat(formData.total_amount) || 0,
			}

			const response = await CreateGnRawMaterialSupplierInvoice(payload)
			if (response?.status === 200) {
				toast.success('Invoice created successfully')
				navigate('/rag/inventory/suppliers/invoice/list')
			} else {
				toast.error(response?.message || 'Failed to create invoice')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to create invoice')
		} finally {
			setLoading(false)
		}
	}

	const handleGoBack = () => {
		navigate('/rag/inventory/suppliers/invoice/list')
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Supplier Invoice</PageTitle>

			<KTCard className='border-0 shadow-sm' style={{ borderRadius: '12px' }}>
				{/* 1. Card Header */}
				<div className='card-header border-bottom py-5 px-6 px-lg-8 d-flex align-items-center justify-content-between flex-wrap gap-3'>
					<div className='d-flex align-items-center gap-3'>
						<span
							className='d-inline-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '42px',
								height: '42px',
								backgroundColor: '#EEF2F6',
								color: '#1E3A5F',
							}}>
							<FontAwesomeIcon icon={faFileInvoice} className='fs-3' />
						</span>
						<div>
							<h3 className='card-title fw-bolder text-gray-900 fs-3 m-0'>
								Create Supplier Invoice
							</h3>
							<span className='text-muted fs-7 mt-1 d-block'>
								Record raw material purchase invoice, bill attachment, and items breakdown
							</span>
						</div>
					</div>

					<div>
						<button
							type='button'
							className='btn btn-light btn-active-light-primary fw-semibold d-flex align-items-center gap-2'
							onClick={handleGoBack}
							style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}>
							<FontAwesomeIcon icon={faArrowLeft} />
							Back to Invoices
						</button>
					</div>
				</div>

				{/* 2. Card Body */}
				<div className='card-body px-6 px-lg-8 py-7'>
					{/* Top Section: Bill Document Upload & Invoice Metadata */}
					<div className='row g-7 mb-8'>
						{/* Left Column: Bill Document Preview & Upload */}
						<div className='col-12 col-lg-4 col-xl-3'>
							<div
								className='p-5 rounded-4 text-center d-flex flex-column align-items-center'
								style={{
									backgroundColor: '#F8FAFC',
									border: '1px solid #E2E8F0',
								}}>
								<span className='fw-bold text-gray-800 fs-7 mb-3 d-block align-self-start'>
									Invoice Bill / Receipt
								</span>

								{/* Document Preview Box */}
								<div
									className='d-flex align-items-center justify-content-center bg-white rounded-3 shadow-sm mb-3'
									style={{
										width: '100%',
										maxWidth: '220px',
										height: '180px',
										border: '1px solid #E2E8F0',
										overflow: 'hidden',
										position: 'relative',
									}}>
									{displayImg ? (
										formData.selectedFile?.type === 'application/pdf' ||
										formData.selectedFile?.name.toLowerCase().endsWith('.pdf') ||
										formData.bill_image?.toLowerCase().endsWith('.pdf') ||
										displayImg.toLowerCase().includes('.pdf') ? (
											<div className='d-flex flex-column align-items-center justify-content-center p-3 text-center'>
												<FontAwesomeIcon icon={faFilePdf} className='text-danger fs-1 mb-2' />
												<span
													className='text-gray-800 fw-bold fs-8 text-truncate'
													style={{ maxWidth: '180px' }}>
													{formData.selectedFile?.name || 'Invoice Document.pdf'}
												</span>
												<span className='badge badge-light-danger fs-9 mt-1'>PDF Attached</span>
											</div>
										) : (
											<img
												alt='Invoice Receipt'
												src={displayImg}
												style={{
													width: '100%',
													height: '100%',
													objectFit: 'contain',
													padding: '6px',
												}}
											/>
										)
									) : (
										<div className='text-muted d-flex flex-column align-items-center gap-2 p-3 text-center'>
											<FontAwesomeIcon icon={faFileInvoice} className='fs-1 text-gray-400' />
											<span className='fs-8 text-gray-500'>No Document Uploaded</span>
										</div>
									)}
								</div>

								{/* Upload Button */}
								<button
									type='button'
									className='btn btn-sm btn-light-primary fw-bold w-100 d-flex align-items-center justify-content-center gap-2'
									onClick={handleFileButtonClick}
									style={{
										height: '38px',
										borderRadius: '8px',
										fontSize: '13px',
									}}>
									<FontAwesomeIcon icon={faUpload} />
									Upload Invoice File
								</button>
								<input
									type='file'
									id='fileInput'
									className='d-none'
									accept='image/*,.pdf'
									onChange={handleFileChange}
								/>
								<span className='text-muted fs-8 mt-2 d-block'>
									Supported formats: PDF, PNG, JPG (Max 10MB)
								</span>
							</div>
						</div>

						{/* Right Column: Invoice Details Form */}
						<div className='col-12 col-lg-8 col-xl-9'>
							<div className='d-flex align-items-center gap-2 mb-4 pb-2 border-bottom'>
								<FontAwesomeIcon icon={faBuilding} className='text-primary fs-6' />
								<h4 className='fw-bolder text-gray-900 fs-5 m-0'>Supplier & Bill Details</h4>
							</div>

							<div className='row g-4'>
								{/* Supplier Dropdown */}
								<div className='col-12 col-md-6'>
									<label className='form-label required fw-bold text-gray-800 fs-7 mb-1'>
										Supplier Name
									</label>
									<SelectField
										name='supplier_id'
										value={formData.supplier_id}
										onChange={handleInputChange}
										options={suppliers.map((supplier) => ({
											label: supplier.name,
											value: supplier._id,
										}))}
										defaultLabel='Select Supplier'
										showLabel={false}
										marginRemove
										searchable
										height='40px'
									/>
								</div>

								{/* Issue Date */}
								<div className='col-12 col-md-6'>
									<InputField
										label='Issue Date'
										placeholder='Select Issue Date'
										type='date'
										name='issue_date'
										htmlFor='issue_date'
										value={formData?.issue_date}
										onChange={handleInputChange}
										required
										labelMarginRemove
										marginRemove
									/>
								</div>

								{/* Total Amount */}
								<div className='col-12 col-md-6'>
									<InputField
										label='Total Invoice Amount (₹)'
										placeholder='Enter Total Bill Amount'
										type='number'
										name='total_amount'
										htmlFor='total_amount'
										value={formData?.total_amount}
										onChange={handleInputChange}
										required
										labelMarginRemove
										marginRemove
									/>
								</div>

								{/* Total Delivery / Freight Charges */}
								<div className='col-12 col-md-6'>
									<InputField
										label='Delivery & Other Charges (₹)'
										placeholder='Enter Freight / Additional Charges'
										type='number'
										name='total_charges'
										htmlFor='total_charges'
										value={formData?.total_charges}
										onChange={handleInputChange}
										labelMarginRemove
										marginRemove
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Bottom Section: Raw Material Items Breakdown */}
					<div className='mt-8 pt-6 border-top' style={{ borderColor: '#E2E8F0' }}>
						<div className='d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2'>
							<div>
								<h4 className='fw-bolder text-gray-900 fs-5 m-0'>Raw Material Items</h4>
								<span className='text-muted fs-7'>Specify products, weights, rates, and tax breakdown</span>
							</div>

							<button
								type='button'
								className='btn btn-sm btn-light-primary fw-bold d-flex align-items-center gap-2'
								onClick={addPlan}
								style={{ height: '36px', borderRadius: '8px', fontSize: '12px' }}>
								<FontAwesomeIcon icon={faPlus} />
								Add Another Item
							</button>
						</div>

						<div className='d-flex flex-column gap-4'>
							{plans.map((plan, index) => (
								<div
									key={index}
									className='p-5 rounded-3 position-relative'
									style={{
										backgroundColor: '#F8FAFC',
										border: '1px solid #E2E8F0',
									}}>
									{/* Item Card Header */}
									<div
										className='d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom'
										style={{ borderColor: '#E2E8F0' }}>
										<div className='d-flex align-items-center gap-2'>
											<span className='badge badge-primary fw-bolder fs-8 px-3 py-1'>
												Item #{index + 1}
											</span>
											{plan.totalPayment && Number(plan.totalPayment) > 0 ? (
												<span className='badge badge-light-success fs-8 fw-bold'>
													Est. Total: ₹{plan.totalPayment}
												</span>
											) : null}
										</div>

										{plans.length > 1 && (
											<button
												type='button'
												className='btn btn-sm btn-icon btn-light-danger rounded-circle'
												onClick={(e) => removePlan(index, e)}
												title='Remove Item'
												style={{ width: '32px', height: '32px' }}>
												<FontAwesomeIcon icon={faTrash} className='fs-6' />
											</button>
										)}
									</div>

									{/* Item Form Controls */}
									<div className='row g-4'>
										{/* Product Selector */}
										<div className='col-12 col-md-4'>
											<label className='form-label required fw-bold text-gray-800 fs-7 mb-1'>
												Raw Material Product
											</label>
											<SelectField
												name='product_id'
												value={plan.product_id}
												onChange={(e: any) => handlePlanInputChange(index, e)}
												options={products.map((product) => ({
													label: product.name,
													value: product._id,
												}))}
												defaultLabel='Select Raw Material'
												showLabel={false}
												marginRemove
												searchable
												height='40px'
											/>
										</div>

										{/* Weight with Unit Dropdown */}
										<div className='col-12 col-md-3'>
											<label className='form-label required fw-bold text-gray-800 fs-7 mb-1'>
												Weight / Quantity
											</label>
											<div className='d-flex align-items-center gap-2'>
												<input
													type='number'
													name='item_weight'
													min='0'
													step='any'
													value={plan.item_weight}
													onChange={(e: any) => handlePlanInputChange(index, e)}
													placeholder='Qty'
													className='form-control'
													style={{
														border: '1px solid #DFE7F0',
														borderRadius: '8px',
														height: '40px',
														fontSize: '13px',
														fontWeight: 500,
													}}
												/>
												<div style={{ width: '90px', flexShrink: 0 }}>
													<SelectField
														name='item_weight_type'
														value={plan.item_weight_type || 'kg'}
														onChange={(e: any) => handlePlanInputChange(index, e)}
														options={[
															{ label: 'kg', value: 'kg' },
															{ label: 'gm', value: 'gm' },
															{ label: 'ltr', value: 'ltr' },
															{ label: 'ml', value: 'ml' },
															{ label: 'pcs', value: 'pcs' },
														]}
														hideDefaultOption
														showLabel={false}
														marginRemove
														searchable={false}
														height='40px'
													/>
												</div>
											</div>
										</div>

										{/* Rate */}
										<div className='col-12 col-md-3'>
											<InputField
												label='Rate per Unit (₹)'
												placeholder='Enter Rate'
												type='number'
												name='rate'
												htmlFor={`rate_${index}`}
												value={plan.rate}
												onChange={(e: any) => handlePlanInputChange(index, e)}
												required
												labelMarginRemove
												marginRemove
											/>
										</div>

										{/* GST */}
										<div className='col-12 col-md-2'>
											<InputField
												label='GST (%)'
												placeholder='e.g. 18'
												type='number'
												name='gst'
												htmlFor={`gst_${index}`}
												value={plan.gst}
												onChange={(e: any) => handlePlanInputChange(index, e)}
												labelMarginRemove
												marginRemove
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Action Buttons Footer */}
					<div
						className='d-flex align-items-center justify-content-end gap-3 mt-8 pt-5 border-top'
						style={{ borderColor: '#E2E8F0' }}>
						<button
							type='button'
							className='btn btn-light btn-active-light-primary fw-semibold px-5'
							onClick={handleGoBack}
							disabled={loading}
							style={{ height: '40px', borderRadius: '8px', fontSize: '13px' }}>
							Cancel
						</button>

						<button
							type='button'
							className='btn btn-primary fw-bold px-6 d-flex align-items-center gap-2'
							onClick={handleSubmit}
							disabled={loading}
							style={{
								height: '40px',
								borderRadius: '8px',
								fontSize: '13px',
								backgroundColor: '#0F172A',
								borderColor: '#0F172A',
							}}>
							{loading ? (
								<>
									<span
										className='spinner-border spinner-border-sm me-1'
										role='status'
										aria-hidden='true'></span>
									Creating Invoice...
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faCheck} />
									Create Invoice
								</>
							)}
						</button>
					</div>
				</div>
			</KTCard>
		</>
	)
}

export default GomziNutritionMaterialSuppliersInvoiceAdd
