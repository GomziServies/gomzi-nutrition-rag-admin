import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TermAndCondition from '../../../components/TermAndCondition'
import { PlusIcon } from '../../../components/animated-icons'
import { createQuotation } from '../../../Functions/FGGroup/Quotation'
import '../common-management.css'

const NutritionCreateQuotation: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [downloadBtn, setDownloadBtn] = useState(false)
	const [formData, setFormData] = useState({
		date: '',
		name: '',
		billing_address: '',
		mobile: '',
		email: '',
		items: [],
		payment_method: '',
		net_amount: '',
		paid_amount: '',
		note: '',
		gst: '',
		discount: '',
	})
	const [quotationData, setQuotationData] = useState({
		date: '',
		name: '',
		billing_address: '',
		mobile: '',
		email: '',
		items: [] as any[],
		payment_method: '',
		net_amount: '',
		paid_amount: '',
		note: '',
		gst: '',
		discount: '',
	})
	const [quotationPlanData, setQuotationPlanData] = useState<any[]>([])

	const [plans, setPlans] = useState([
		{
			items: '',
			quantity: '',
			amount: '',
			gst: '',
			discount: '',
			totalPayment: '',
			inputField: false,
			isDiscountPercentage: true,
			item_weight: '',
			item_weight_type: 'kg',
			item_type: '',
		},
	])

	const [dueAmount, setDueAmount] = useState('')
	const adminType = localStorage.getItem('admin')

	const handleCreateQuotation = async () => {
		const plansData: any = plans.map((plan: any) => ({
			item_name: plan?.items,
			item_type: plan?.item_type || undefined,
			amount: Number(plan?.amount),
			gst: Number(plan?.gst),
			discount: Number(plan?.discount),
			totalAmount: plan?.totalPayment,
			quantity: plan?.quantity,
			isDiscountPercentage: plan?.isDiscountPercentage,
			item_weight: plan?.item_weight ? Number(plan?.item_weight) : 0,
			item_weight_type: plan?.item_weight_type || undefined,
		}))

		try {
			setIsSubmitting(true)
			const payload: any = {
				quotation_category: adminType == 'Store' ? adminType : 'Gomzi Nutrition',
				date: DayJS(formData?.date).format('YYYY/MM/DD'),
				name: formData?.name,
				email: formData?.email,
				mobile: formData?.mobile,
				billing_address: { address_line_1: formData?.billing_address },
				payment_method: formData?.payment_method,
				net_amount: Number(formData?.net_amount),
				paid_amount: Number(formData?.paid_amount),
				note: formData?.note,
				items: plansData,
			}

			// Call the API to create the quotation
			const response = await createQuotation(payload)

			if (response.status === 200) {
				toast.success('Quotation Created Successfully')

				setQuotationData(formData)
				setQuotationPlanData(plansData)
				setDownloadBtn(true)

				const due = payload?.net_amount - payload?.paid_amount
				setDueAmount(due.toString())
			} else {
				toast.error(response.message || 'Failed to create quotation')
			}

			setIsSubmitting(false)

			setTimeout(() => {
				generatePDF(formData?.name)
			}, 1000)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		const updatedFormData = { ...formData, [name]: value }

		setFormData(updatedFormData)

		if (name === 'net_amount' || name === 'paid_amount') {
			const paidAmount = parseInt(updatedFormData.paid_amount) || 0
			const netAmount = parseInt(updatedFormData.net_amount) || 0
			const dueAmount = netAmount - paidAmount
			setDueAmount(dueAmount.toString())
		}
	}

	const calculateTotalPayment = (plans: any) => {
		return plans.reduce((total: any, plan: any) => {
			const quantity = parseFloat(plan.quantity) || 0
			const amount = parseFloat(plan.amount) || 0
			return total + quantity * amount
		}, 0)
	}

	const handlePlanInputChange = (
		index: number,
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		const newPlans: any = [...plans]

		if (name === 'items') {
			newPlans[index].inputField = value === 'Other'
		}
		newPlans[index][name] = value

		const quantity = parseFloat(newPlans[index].quantity) || 0
		const amount = parseFloat(newPlans[index].amount) || 0
		const gst = parseFloat(newPlans[index].gst) || 0
		const discount = parseFloat(newPlans[index].discount) || 0

		// Apply discount type logic
		const isDiscountPercentage =
			newPlans[index].isDiscountPercentage !== undefined
				? newPlans[index].isDiscountPercentage
				: true
		let discountForCalculation = discount
		if (name === 'discount' && discount > 0) {
			const baseAmount = quantity * amount
			if (isDiscountPercentage) {
				// For percentage, we use the value as is for display but convert for calculation
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

		// Recalculate full form's net amount
		const totalAmount: number = newPlans.reduce((sum: number, plan: any): number => {
			return sum + (parseFloat(plan.totalPayment) || 0)
		}, 0)

		const totalDiscount: number = newPlans.reduce((sum: number, plan: any): number => {
			const planDiscount = parseFloat(plan.discount) || 0
			const planQuantity = parseFloat(plan.quantity) || 0
			const planAmount = parseFloat(plan.amount) || 0
			const baseAmount = planQuantity * planAmount

			// Convert to rupee value for total calculation
			let discountValue = planDiscount
			const planIsDiscountPercentage =
				plan.isDiscountPercentage !== undefined ? plan.isDiscountPercentage : true
			if (planIsDiscountPercentage && planDiscount > 0) {
				discountValue = (baseAmount * planDiscount) / 100
			}

			return sum + discountValue
		}, 0)

		setFormData({
			...formData,
			net_amount: String(totalAmount),
			gst: newPlans[index].gst,
			discount: String(totalDiscount),
		})
	}

	const addPlan = (event: any) => {
		event.preventDefault()
		setPlans([
			...plans,
			{
				items: '',
				quantity: '',
				amount: '',
				gst: '',
				discount: '',
				totalPayment: '',
				inputField: false,
				isDiscountPercentage: true,
				item_weight: '',
				item_weight_type: 'kg',
				item_type: '',
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
					toast.success('Plan Deleted Successfully')

					// Recalculate net_amount after plan deletion
					const newTotalPayment = calculateTotalPayment(newPlans)

					const totalDiscount: number = newPlans.reduce((sum: number, plan: any): number => {
						const planDiscount = parseFloat(plan.discount) || 0
						const planQuantity = parseFloat(plan.quantity) || 0
						const planAmount = parseFloat(plan.amount) || 0
						const baseAmount = planQuantity * planAmount

						// Convert to rupee value for total calculation
						let discountValue = planDiscount
						const planIsDiscountPercentage =
							plan.isDiscountPercentage !== undefined ? plan.isDiscountPercentage : true
						if (planIsDiscountPercentage && planDiscount > 0) {
							discountValue = (baseAmount * planDiscount) / 100
						}

						return sum + discountValue
					}, 0)

					setFormData({
						...formData,
						net_amount: newTotalPayment.toString(),
						discount: totalDiscount.toString(),
					})
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	// Separate event handler for textarea
	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const generatePDF = async (name: any) => {
		const quotationContent = document.getElementById('quotationContent')
		const invoiceTermAndCondition = document.getElementById('invoiceTermAndCondition')

		if (quotationContent && invoiceTermAndCondition) {
			// Temporarily show the quotation content
			// quotationContent.classList.remove('d-none')
			quotationContent.classList.add('pdf-font-black')
			invoiceTermAndCondition.classList.add('pdf-font-black')

			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
				compress: true,
			})

			Promise.all([
				html2canvas(quotationContent, { scale: 2, useCORS: true }),
				html2canvas(invoiceTermAndCondition, { scale: 2, useCORS: true }),
			]).then(([invoiceCanvas, termsCanvas]) => {
				quotationContent.classList.remove('pdf-font-black')
				invoiceTermAndCondition.classList.remove('pdf-font-black')

				// Page 1 - Invoice
				// doc.addImage(invoiceImg, 'JPEG', margin, margin, contentWidth, contentHeight)

				addCanvasToPage(doc, invoiceCanvas)
				doc.addPage()
				addCanvasToPage(doc, termsCanvas)
				// doc.addImage(termsImg, 'JPEG', margin, margin, contentWidth, contentHeight)

				const pdfName = `${name || 'demoName'}.pdf`
				doc.save(pdfName)
			})
		} else {
			console.error('Quotation content not found.')
		}
	}

	const addCanvasToPage = (doc: jsPDF, canvas: HTMLCanvasElement) => {
		const imgData = canvas.toDataURL('image/png')

		const pageWidth = doc.internal.pageSize.getWidth()
		const pageHeight = doc.internal.pageSize.getHeight()
		const margin = 10
		const maxPdfWidth = pageWidth - margin * 2
		const pageHeightInner = pageHeight - margin * 2

		const imgWidth = canvas.width
		const imgHeight = canvas.height

		let pdfWidth = maxPdfWidth
		let pdfHeight = (imgHeight * pdfWidth) / imgWidth

		// Always scale down proportionally to fit the A4 page height if it exceeds pageHeightInner
		if (pdfHeight > pageHeightInner) {
			pdfHeight = pageHeightInner
			pdfWidth = (imgWidth * pdfHeight) / imgHeight
		}

		const xOffset = margin + (maxPdfWidth - pdfWidth) / 2
		doc.addImage(imgData, 'PNG', xOffset, margin, pdfWidth, pdfHeight)
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Create Quotation</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/quotation-list'>Quotations</Link>
				<span className='sep'>/</span>
				<span className='current'>Create Quotation</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Create Quotation</h1>
					<p className='gz-mgmt-subtitle'>Draft a formal commercial proposal, itemized supplements, and pricing estimate</p>
				</div>
				<Link to='/rag/quotation-list' className='gz-mgmt-btn-secondary text-decoration-none'>
					Back to Quotations
				</Link>
			</div>

			<div className='gz-mgmt-form-card mb-8'>
				<form>
					{/* SECTION 1: CLIENT INFORMATION */}
					<div className='gz-mgmt-section-header mb-6'>
						<div className='d-flex align-items-center gap-2'>
							<span className='bullet bullet-vertical h-20px bg-primary'></span>
							<h3 className='fw-bold mb-0' style={{ fontSize: '16px', color: '#172B4D' }}>
								Client & Proposal Information
							</h3>
						</div>
					</div>

					<div className='row g-5 mb-8'>
						<InputField
							className='col-md-4 fv-row'
							label='Quotation Date'
							placeholder='Select Date'
							type='date'
							name='date'
							htmlFor='date'
							value={formData?.date}
							onChange={handleInputChange}
						/>
						<InputField
							className='col-md-4 fv-row'
							label='Full Name'
							placeholder='Enter Full Name'
							type='text'
							name='name'
							htmlFor='name'
							value={formData?.name}
							onChange={handleInputChange}
						/>
						<InputField
							className='col-md-4 fv-row'
							label='Billing Address'
							placeholder='Enter Billing Address'
							type='text'
							name='billing_address'
							htmlFor='billing_address'
							value={formData?.billing_address}
							onChange={handleInputChange}
						/>
						<InputField
							className='col-md-6 fv-row'
							label='Phone Number'
							placeholder='Enter Phone Number'
							type='text'
							name='mobile'
							htmlFor='mobile'
							value={formData?.mobile}
							onChange={handleInputChange}
						/>
						<InputField
							className='col-md-6 fv-row'
							label='Email Address'
							placeholder='Enter Email Address'
							type='email'
							name='email'
							htmlFor='email'
							value={formData?.email}
							onChange={handleInputChange}
						/>
					</div>

					{/* SECTION 2: SUPPLEMENTS & PRODUCTS */}
					<div className='gz-mgmt-section-header mb-6 d-flex justify-content-between align-items-center'>
						<div className='d-flex align-items-center gap-2'>
							<span className='bullet bullet-vertical h-20px bg-primary'></span>
							<h3 className='fw-bold mb-0' style={{ fontSize: '16px', color: '#172B4D' }}>
								Supplements & Product Pricing
							</h3>
						</div>
						<button
							type='button'
							className='gz-mgmt-btn-secondary'
							style={{ height: '36px', fontSize: '13px' }}
							onClick={(e) => addPlan(e)}>
							<PlusIcon size={13} strokeWidth={3} />
							<span>Add Supplement</span>
						</button>
					</div>

					{plans.map((plan, index) => (
						<div
							key={index}
							className='p-6 mb-5 rounded-3'
							style={{
								backgroundColor: '#F8FAFC',
								border: '1px solid #E2E8F0',
								boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
							}}>
							<div
								className='d-flex justify-content-between align-items-center mb-4 pb-3'
								style={{ borderBottom: '1px solid #E2E8F0' }}>
								<span className='fw-bold text-dark fs-6 d-flex align-items-center gap-2'>
									<span
										className='badge badge-circle badge-light-primary fw-bolder fs-8'
										style={{ width: '22px', height: '22px' }}>
										{index + 1}
									</span>
									Item #{index + 1} {plan.items ? `— ${plan.items}` : ''}
								</span>
								{plans.length > 1 && (
									<button
										type='button'
										className='btn btn-icon btn-sm btn-light-danger'
										style={{ width: '30px', height: '30px' }}
										onClick={(e) => removePlan(index, e)}
										title='Remove Item'>
										<i className='bi bi-trash fs-6'></i>
									</button>
								)}
							</div>

							<div className='row g-4'>
								<SelectField
									className='col-md-3 fv-row'
									label='Product Type'
									name='item_type'
									value={plan.item_type || ''}
									onChange={(e: any) => handlePlanInputChange(index, e)}
									htmlFor='item_type'
									options={[
										'peanut butter',
										'mass gainer',
										'whey protein',
										'eaa',
										'bcaa',
										'pre-workout',
										'creatine',
										'energy drink',
									]}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Product Name / Description'
									placeholder='Enter Product Name'
									type='text'
									name='items'
									htmlFor='items'
									value={plan?.items}
									onChange={(e: any) => handlePlanInputChange(index, e)}
								/>
								<div className='col-md-3 fv-row'>
									<label
										className='fw-bold fs-6 mb-2'
										htmlFor={`item_weight_${index}`}>
										Weight / Pack Size
									</label>
									<div className='d-flex align-items-center gap-2'>
										<input
											type='number'
											name='item_weight'
											id={`item_weight_${index}`}
											value={(plan.item_weight || '').toString()}
											onChange={(e: any) => handlePlanInputChange(index, e)}
											placeholder='Weight'
											className='form-control flex-grow-1'
											style={{
												height: '38px',
												borderRadius: '8px',
												border: '1px solid #E2E8F0',
												minWidth: 0,
											}}
										/>
										<div style={{ width: '85px', flexShrink: 0 }}>
											<SelectField
												showLabel={false}
												marginRemove
												name='item_weight_type'
												value={plan.item_weight_type || 'kg'}
												onChange={(e: any) => handlePlanInputChange(index, e)}
												options={['gm', 'kg', 'ml', 'ltr']}
												searchable={false}
												hideDefaultOption={true}
											/>
										</div>
									</div>
								</div>

								<InputField
									className='col-md-3 fv-row'
									label='Rate (₹)'
									placeholder='Enter Rate'
									type='text'
									name='amount'
									htmlFor='amount'
									value={(plan?.amount || '').toString()}
									onChange={(e: any) => handlePlanInputChange(index, e)}
								/>
								<InputField
									className='col-md-2 fv-row'
									label='Quantity'
									placeholder='Enter Qty'
									type='text'
									name='quantity'
									htmlFor='quantity'
									value={(plan?.quantity || '').toString()}
									onChange={(e: any) => handlePlanInputChange(index, e)}
								/>
								<InputField
									className='col-md-2 fv-row'
									label='Base Amount (₹)'
									placeholder='Amount'
									type='text'
									name='totalPayment'
									htmlFor='totalPayment'
									value={`${(Number(plan?.amount) || 0) * (Number(plan?.quantity) || 0)}`}
									disabled
								/>
								<InputField
									className='col-md-2 fv-row'
									label='GST Rate (%)'
									placeholder='GST'
									type='number'
									name='gst'
									htmlFor='gst'
									value={(plan.gst || '').toString()}
									onChange={(e: any) => handlePlanInputChange(index, e)}
								/>
								<div className='col-md-3 fv-row'>
									<div className='d-flex align-items-center justify-content-between mb-2'>
										<label
											htmlFor={`discount-${index}`}
											className='fw-bold fs-6 mb-0'>
											Discount
										</label>
										<div className='d-flex align-items-center gap-1'>
											<input
												className='form-check-input w-25px h-15px'
												type='checkbox'
												id={`discountTypeSwitch-${index}`}
												checked={
													plan.isDiscountPercentage !== undefined
														? plan.isDiscountPercentage
														: true
												}
												onChange={() => {
													const newPlans = [...plans]
													const currentIsPercentage =
														plan.isDiscountPercentage !== undefined
															? plan.isDiscountPercentage
															: true
													const newIsPercentage = !currentIsPercentage

													let discountValue = parseFloat(plan.discount) || 0
													const quantity = parseFloat(plan.quantity) || 0
													const amount = parseFloat(plan.amount) || 0
													const baseAmount = quantity * amount

													if (discountValue > 0 && baseAmount > 0) {
														if (currentIsPercentage && !newIsPercentage) {
															discountValue = (baseAmount * discountValue) / 100
														} else if (!currentIsPercentage && newIsPercentage) {
															discountValue = (discountValue / baseAmount) * 100
														}
													}

													newPlans[index].isDiscountPercentage = newIsPercentage
													newPlans[index].discount = discountValue.toString()
													setPlans(newPlans)
												}}
											/>
											<label
												className='fw-bold fs-8 text-muted'
												htmlFor={`discountTypeSwitch-${index}`}>
												{plan.isDiscountPercentage !== undefined
													? plan.isDiscountPercentage
														? '(%)'
														: '(₹)'
													: '(%)'}
											</label>
										</div>
									</div>
									<input
										type='number'
										className='form-control'
										style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
										id={`discount-${index}`}
										name='discount'
										placeholder={`Discount in ${
											plan.isDiscountPercentage !== undefined
												? plan.isDiscountPercentage
													? 'percentage'
													: 'rupees'
												: 'percentage'
										}`}
										value={(plan.discount || '').toString()}
										onChange={(e: any) => handlePlanInputChange(index, e)}
									/>
								</div>

								<div className='col-12 text-end pt-2'>
									<span className='text-muted fs-7 me-2'>Item Net Total:</span>
									<span className='fw-bolder fs-5 text-dark'>
										₹{Number(plan?.totalPayment || 0).toLocaleString('en-IN')}
									</span>
								</div>
							</div>
						</div>
					))}

					<div className='d-flex justify-content-end mb-8'>
						<button
							type='button'
							className='gz-mgmt-btn-secondary'
							onClick={(e) => addPlan(e)}>
							<PlusIcon size={14} strokeWidth={3} />
							<span>Add Another Supplement</span>
						</button>
					</div>

					{/* SECTION 3: TOTAL & ACTIONS */}
					<div
						className='p-6 rounded-3 mb-8'
						style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
						<div className='row align-items-center g-4'>
							<div className='col-md-6'>
								<InputField
									className='col-12 fv-row'
									label='Calculated Grand Total'
									placeholder='Total Net Amount'
									type='text'
									name='net_amount'
									htmlFor='net_amount'
									value={(formData?.net_amount || '').toString()}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6 text-md-end'>
								<span className='text-muted fs-7 d-block mb-1 text-uppercase fw-bold'>
									Payable Estimate
								</span>
								<div className='fw-bolder fs-2x' style={{ color: '#172B4D' }}>
									₹{Number(formData?.net_amount || 0).toLocaleString('en-IN')}
								</div>
							</div>
						</div>
					</div>

					<div
						className='d-flex justify-content-between align-items-center flex-wrap gap-3 pt-6'
						style={{ borderTop: '1px solid #F1F5F9' }}>
						<Link
							to='/rag/quotation-list'
							className='gz-mgmt-btn-secondary text-decoration-none'>
							Cancel & Return
						</Link>
						<div className='d-flex align-items-center gap-3'>
							{downloadBtn && (
								<button
									type='button'
									className='btn btn-light-success d-inline-flex align-items-center gap-2'
									style={{ height: '42px', borderRadius: '10px', fontWeight: 600 }}
									onClick={() => generatePDF(quotationData?.name)}>
									<i className='bi bi-file-earmark-pdf fs-5'></i>
									Download PDF
								</button>
							)}
							<button
								type='button'
								className='gz-mgmt-btn-primary'
								onClick={handleCreateQuotation}
								disabled={isSubmitting}>
								<i className='bi bi-check2-circle me-1'></i>
								{isSubmitting ? 'Creating Quotation...' : 'Create Quotation'}
							</button>
						</div>
					</div>
				</form>
			</div>

			<div
				className='col-md-6 mt-3'
				id='quotationContent'>
				<div className='card'>
					<div className='card-body'>
						<div>
							<p className='fw-bold fs-5 text-center mb-2'>QUOTATION</p>
							<div className='border border-black'>
								<div className='invoice-header row mt-2 p-3 align-items-start'>
									<div className='col-md-7'>
										<p className='fs-6 mb-1'>
											<b>RAG STRENGTH AND NUTRITION</b>
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mt-1 mb-1'>
											G-23-TIME SQUARE, Gaurav Path Road, Nr. Galaxy Circle, Pal, Surat, Gujarat
											394510
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											Phone no.: +91 98752 70200
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											Email: info@ragnutrition.in
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											GSTIN: 24ABOFR2172H1Z2
										</p>
									</div>
									<div className='col-md-5'>
										<div className='text-end'>
											<img
												src='/media/logos/rag-logo.webp'
												width='90%'
												alt='Company Logo'
											/>
										</div>
									</div>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-md-5 border border-black px-0'>
										<div className='quotation-bill-to border-bottom border-black'>Bill To</div>
										<strong>
											<p
												className='mt-2 px-2'
												style={{ fontSize: '14px' }}
												id='inv-name'>
												{quotationData.name || '-'}
											</p>
										</strong>
										<strong>
											<p
												className='px-2'
												style={{ fontSize: '14px' }}
												id='inv-email'>
												{quotationData.email || '-'}
											</p>
										</strong>
									</div>
									<div className='col-md-7 border border-black text-right'>
										<div className='bill-name-date px-2'>
											<p className=''>
												<strong>Date :-</strong>
												<span id='inv-date'>{quotationData.date || '-'}</span>
											</p>
											<p className=''>
												<strong>Phone No. :-</strong>
												<span id='inv-mobile'>{quotationData.mobile || '-'}</span>
											</p>
											<p className=''>
												<strong>Address :-</strong>
												<span id='inv-address'>{quotationData.billing_address || '-'}</span>
											</p>
										</div>
									</div>
								</div>
								<div className='invoice-items quotation-items'>
									<table className='border border-black'>
										<thead>
											<tr>
												<th className='border border-black'>Product</th>
												<th className='border border-black'>Weight</th>
												<th className='border border-black'>Rate</th>
												<th className='border border-black'>Quantity</th>
												<th className='border border-black'>Amount</th>
												<th className='border border-black'>GST</th>
												<th className='border border-black'>Dis</th>
												<th className='border border-black'>Total</th>
											</tr>
										</thead>
										<tbody>
											{quotationPlanData.length == 0 ? (
												<tr>
													<td className='border border-black'>
														<div id='inv-product'>-</div>
													</td>
													<td className='border border-black'>
														<span className='inv-paid'>-</span>
													</td>
													<td className='border border-black'>
														<span className='inv-total'>-</span>
													</td>
													<td className='border border-black'>
														<span className='inv-total'>-</span>
													</td>
													<td className='border border-black'>
														<span className='inv-total'>-</span>
													</td>
													<td className='border border-black'>
														<span className='inv-total'>-</span>
													</td>
													<td className='border border-black'>
														<span className='inv-total'>-</span>
													</td>
													<td className='border border-black'>
														<span className='inv-total'>-</span>
													</td>
												</tr>
											) : (
												quotationPlanData.map((item: any, index: any) => {
													return (
														<tr>
															<td>
																<div id='inv-product'>{item.item_name}</div>
															</td>
															<td>
																<span className='inv-total'>
																	{item.item_weight
																		? `${item.item_weight} ${item.item_weight_type || ''}`
																		: '-'}
																</span>
															</td>
															<td>
																<span className='inv-total'>{item.amount || '-'}</span>
															</td>
															<td>
																<span className='inv-paid'>{item.quantity || '-'}</span>
															</td>
															<td>
																<span className='inv-total'>
																	{item.amount * item.quantity || '-'}
																</span>
															</td>
															<td>
																<span className='inv-total'>{item.gst ? item.gst + '%' : '-'}</span>
															</td>
															<td>
																<span className='inv-total'>{item.discount || '0'}</span>
															</td>
															<td>
																<span className='inv-total'>
																	{item.totalAmount ? item.totalAmount : '-'}
																</span>
															</td>
														</tr>
													)
												})
											)}
										</tbody>
									</table>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-md-12 border border-black px-0'>
										<div className='quotation-bill-to px-2 border-bottom border-black'>
											Amount :-
										</div>
										<div className='bill-name-date px-2'>
											<p className=''>
												<strong>Total Amount :-</strong>
												<span className='inv-total'> {quotationData.net_amount || '-'}</span>
											</p>
										</div>
									</div>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-8 border border-black px-0'>
										<div
											className='bill-to px-2 border-bottom border-black'
											style={{ fontSize: '13px' }}>
											Payment Details
										</div>
										<div className='d-flex align-items-center'>
											<div className='px-2'>
												<img
													src='/media/gomzi-nutrition/rag-qr-code.png'
													alt='sign'
													width='110px'
												/>
											</div>
											<div className='bill-name-date px-2'>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>UPI ID: bom260801350628@mahb</strong>
												</p>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>Bank Name: Bank of Maharashtra, Jahangirabad</strong>
												</p>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>Account Holder Name: RAG STRENGTH & NUTRITION</strong>
												</p>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>Account Number: 60587480966</strong>
												</p>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>IFSC: MAHB0002533</strong>
												</p>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>Account Type: Current Account</strong>
												</p>
											</div>
										</div>
									</div>
									<div className='col-md-4 border border-black px-0'>
										<div className='quotation-bill-to px-2 border-bottom border-black'>
											Administrator :-
										</div>
										<div className='px-2'>
											<img
												src='/media/sign/chirag-pandey-sign.webp'
												alt='sign'
												width='100%'
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div
				className='col-md-6 mt-3'
				style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '50%' }}>
				<div className='card'>
					<div className='card-body'>
						<TermAndCondition />
					</div>
				</div>
			</div>
			<div className='col-md-12 fv-row mt-10 text-center'>
				<button
					type='button'
					className='btn btn-success'
					onClick={() => generatePDF(quotationData.name)}>
					Download Invoice
				</button>
			</div>
		</div>
	)
}

export default NutritionCreateQuotation
