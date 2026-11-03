/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowRight,
	faArrowLeft,
	faPlus,
	faTrash,
	faCheck,
	faFilePdf,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	createInvoice,
	getInvoiceBranches,
	getNextInvoiceSequence,
	GetProductStocks,
	GetTrainers,
} from '../../../Functions/FGGroup'
import {
	CompanyInvoiceDocument,
	generateCompanyInvoicePDF,
} from './CompanyInvoiceDocument'
import SelectField from '../../../components/SelectField'
import './invoice-theme.css'

interface PlanState {
	product_id?: string
	variant_id?: string
	type?: string
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

const NutritionCreateInvoice: React.FC = () => {
	const navigate = useNavigate()
	const adminType = localStorage.getItem('admin')

	// Stepper: 1: Client & Details, 2: Items & Pricing, 3: Review & Create
	const [currentStep, setCurrentStep] = useState<number>(1)
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

	// Form Data
	const [formData, setFormData] = useState({
		invoice_number: '',
		date: DayJS().format('YYYY-MM-DD'),
		due_date: DayJS().add(15, 'day').format('YYYY-MM-DD'),
		payment_terms: 'Net 15 Days',
		name: '',
		branch_name: '',
		custom_branch_name: '',
		sales_person: '',
		other_sales_person: '',
		billing_address_line_1: '',
		billing_country: 'India',
		billing_state: '',
		billing_city: '',
		billing_pin_code: '',
		mobile: '',
		gst_number: '',
		pan_number: '',
		email: '',
		payment_method: 'UPI',
		gst: '0',
		discount: '0',
		net_amount: '0',
		paid_amount: '0',
		note: '',
		reference_name: '',
	})

	const [plans, setPlans] = useState<PlanState[]>([
		{
			items: '',
			item_type: '',
			type: '',
			product_id: '',
			variant_id: '',
			item_weight: '',
			item_weight_type: 'kg',
			quantity: '1',
			amount: '',
			gst: '0',
			discount: '0',
			totalPayment: '',
			duration_number: '',
			duration: '',
			inputField: false,
			isDiscountPercentage: true,
		},
	])

	const [salesPersonList, setSalesPersonList] = useState<any[]>([])
	const [branchesData, setBranchesData] = useState<string[]>([])
	const [productList, setProductList] = useState<any[]>([])

	// Load Initial Data
	const fetchInitialData = async () => {
		try {
			// Next Invoice Number
			const category: any = adminType === 'Store' ? adminType : 'Gomzi Nutrition'
			const seqRes: any = await getNextInvoiceSequence({ invoice_category: category })
			if (seqRes?.data?.next_invoice_number) {
				setFormData((prev) => ({
					...prev,
					invoice_number: String(seqRes.data.next_invoice_number),
				}))
			}

			// Sales Persons
			const trainersRes: any = await GetTrainers({ limit: 1000 })
			if (trainersRes?.data) {
				setSalesPersonList(trainersRes.data)
			}

			// Branches
			const branchRes: any = await getInvoiceBranches()
			if (branchRes?.data) {
				const branches = branchRes.data.map((item: any) => item.branch_name)
				setBranchesData([...branches, 'Other'])
			}

			// Products
			const prodRes: any = await GetProductStocks({ limit: 1000 })
			if (prodRes?.data) {
				setProductList(prodRes.data)
			}
		} catch (err) {
			console.error('Error fetching initial invoice data:', err)
		}
	}

	useEffect(() => {
		fetchInitialData()
	}, [])

	// Recalculate totals whenever plans change
	useEffect(() => {
		const totalAmount: number = plans.reduce((sum: number, plan: PlanState): number => {
			return sum + (parseFloat(plan.totalPayment) || 0)
		}, 0)

		const totalDiscount: number = plans.reduce((sum: number, plan: PlanState): number => {
			const planDiscount = parseFloat(plan.discount) || 0
			const planQuantity = parseFloat(plan.quantity) || 0
			const planAmount = parseFloat(plan.amount) || 0
			const baseAmount = planQuantity * planAmount

			let discountValue = planDiscount
			if (plan.isDiscountPercentage && planDiscount > 0) {
				discountValue = (baseAmount * planDiscount) / 100
			}
			return sum + discountValue
		}, 0)

		setFormData((prev) => ({
			...prev,
			net_amount: String(totalAmount),
			discount: String(totalDiscount),
		}))
	}, [plans])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	// Product selection in plan item
	const handleProductChange = (index: number, selectedName: string) => {
		const newPlans = [...plans]
		if (selectedName === 'Other / Manual' || selectedName === 'manual') {
			newPlans[index].type = 'manual'
			newPlans[index].product_id = ''
			newPlans[index].variant_id = ''
			newPlans[index].items = ''
			newPlans[index].amount = ''
			newPlans[index].inputField = true
			setPlans(newPlans)
			return
		}

		const product = productList.find((x) => x.product_name === selectedName)
		if (product) {
			newPlans[index].type = 'product'
			newPlans[index].product_id = product.product_id
			newPlans[index].variant_id = product.variant_id
			newPlans[index].items = product.product_name
			newPlans[index].amount = String(product.price || product.amount || 0)
			newPlans[index].inputField = false

			if (product.weight) {
				if (typeof product.weight === 'object') {
					if (product.weight.amount !== undefined && product.weight.amount !== null) {
						newPlans[index].item_weight = String(product.weight.amount);
					}
					if (product.weight.unit) {
						const u = String(product.weight.unit).toLowerCase();
						newPlans[index].item_weight_type = u === 'g' ? 'gm' : u;
					}
				} else if (typeof product.weight === 'number') {
					newPlans[index].item_weight = String(product.weight);
				} else if (typeof product.weight === 'string') {
					const str = String(product.weight).trim();
					const match = str.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
					if (match) {
						newPlans[index].item_weight = match[1];
						if (match[2]) {
							const u = match[2].toLowerCase();
							newPlans[index].item_weight_type = u === 'g' ? 'gm' : u;
						}
					} else {
						newPlans[index].item_weight = str;
					}
				}
			}

			const q = parseFloat(newPlans[index].quantity) || 1
			const amt = parseFloat(newPlans[index].amount) || 0
			const gst = parseFloat(newPlans[index].gst) || 0
			let tot = q * amt
			if (gst) tot += (tot * gst) / 100
			newPlans[index].totalPayment = tot.toFixed(0)
		}
		setPlans(newPlans)
	}

	const handlePlanChange = (index: number, field: keyof PlanState, value: any) => {
		const newPlans = [...plans]
		;(newPlans[index] as any)[field] = value

		const quantity = parseFloat(newPlans[index].quantity) || 0
		const amount = parseFloat(newPlans[index].amount) || 0
		const gst = parseFloat(newPlans[index].gst) || 0
		const discount = parseFloat(newPlans[index].discount) || 0

		let discountForCalc = discount
		if (discount > 0 && newPlans[index].isDiscountPercentage) {
			discountForCalc = (quantity * amount * discount) / 100
		}

		let total = quantity * amount
		if (gst) total += (total * gst) / 100
		if (discountForCalc) total -= discountForCalc

		newPlans[index].totalPayment = Math.max(0, total).toFixed(0)
		setPlans(newPlans)
	}

	const addPlanItem = () => {
		setPlans([
			...plans,
			{
				items: '',
				item_type: '',
				type: '',
				product_id: '',
				variant_id: '',
				item_weight: '',
				item_weight_type: 'kg',
				quantity: '1',
				amount: '',
				gst: '0',
				discount: '0',
				totalPayment: '',
				duration_number: '',
				duration: '',
				inputField: false,
				isDiscountPercentage: true,
			},
		])
	}

	const removePlanItem = (index: number) => {
		if (plans.length === 1) {
			toast.error('Invoice must contain at least one line item')
			return
		}
		const newPlans = [...plans]
		newPlans.splice(index, 1)
		setPlans(newPlans)
	}

	const handleNextToItems = () => {
		if (!formData.name.trim()) {
			toast.error('Please enter Client / Company Name')
			return
		}
		if (!formData.sales_person) {
			toast.error('Please select Sales Person')
			return
		}
		if (formData.sales_person === 'N/A' && !formData.other_sales_person.trim()) {
			toast.error('Please enter salesperson name')
			return
		}
		setCurrentStep(2)
	}

	const handleNextToReview = () => {
		const invalidItem = plans.find((p) => !p.items.trim() || !p.amount)
		if (invalidItem) {
			toast.error('Please provide a valid product name and amount for all items')
			return
		}
		setCurrentStep(3)
	}

	const handleCreateInvoice = async () => {
		setIsSubmitting(true)
		try {
			const finalBranch =
				formData.branch_name === 'Other' ? formData.custom_branch_name : formData.branch_name

			const plansData = plans.map((plan) => ({
				product_id: plan.type === 'product' ? plan.product_id : undefined,
				variant_id: plan.type === 'product' ? plan.variant_id : undefined,
				item_name: plan.items,
				item_type: plan.item_type,
				item_weight: plan.item_weight ? Number(plan.item_weight) : 0,
				item_weight_type: plan.item_weight_type || 'kg',
				amount: Number(plan.amount),
				gst: Number(plan.gst || 0),
				discount: Number(plan.discount || 0),
				totalAmount: plan.totalPayment,
				quantity: plan.quantity,
				duration: plan.duration_number ? `${plan.duration_number} ${plan.duration}` : '1 Days',
				isDiscountPercentage: plan.isDiscountPercentage,
			}))

			const payload: any = {
				invoice_category: adminType === 'Store' ? adminType : 'Gomzi Nutrition',
				invoice_number: isNaN(Number(formData.invoice_number)) ? formData.invoice_number : Number(formData.invoice_number),
				date: DayJS(formData.date).format('YYYY/MM/DD'),
				name: formData.name,
				branch_name: finalBranch,
				sales_person: formData.sales_person,
				other_sales_person: formData.other_sales_person,
				email: formData.email,
				mobile: formData.mobile,
				gst_number: formData.gst_number,
				pan_number: formData.pan_number,
				amount: Number(formData.net_amount),
				gst: Number(plans[0]?.gst || 0),
				discount: Number(formData.discount),
				billing_address: {
					address_line_1: formData.billing_address_line_1,
					city: formData.billing_city,
					state: formData.billing_state,
					pin_code: formData.billing_pin_code,
					country: formData.billing_country,
				},
				payment_method: formData.payment_method,
				net_amount: Number(formData.net_amount),
				paid_amount: Number(formData.paid_amount),
				note: formData.note,
				items: plansData,
				reference_name: formData.reference_name,
			}

			await createInvoice(payload)
			toast.success('Invoice created successfully!')

			setTimeout(async () => {
				try {
					await generateCompanyInvoicePDF(formData.name || 'Invoice')
				} catch (pdfErr) {
					console.error('PDF export note:', pdfErr)
				}
				navigate('/rag/invoice-list')
			}, 800)
		} catch (error: any) {
			console.error('Create invoice error:', error)
			toast.error(error?.message || 'Failed to create invoice')
			setIsSubmitting(false)
		}
	}

	const netAmount = Number(formData.net_amount || 0)
	const paidAmount = Number(formData.paid_amount || 0)
	const dueAmount = Math.max(0, netAmount - paidAmount)

	return (
		<div className='gz-inv-container'>
			<PageTitle breadcrumbs={[]}>Create Invoice</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-inv-breadcrumb'>
				<Link to='/rag/invoice-list'>Invoices</Link>
				<span>&gt;</span>
				<span>Create Invoice</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-inv-header mb-4'>
				<div>
					<h1 className='gz-inv-title'>Create Invoice</h1>
					<p className='gz-inv-subtitle'>Prepare a new billing document for your client</p>
				</div>
			</div>

			{/* =========================================================================
			    SPLIT VIEW: STEPPER & FORM ON LEFT, LIVE INVOICE TEMPLATE PREVIEW ON RIGHT
			    ========================================================================= */}
			<div className='row g-4 align-items-start'>
				{/* LEFT COLUMN: Stepper + Form */}
				<div className='col-12 col-xl-6'>
					{/* Stepper */}
					<div className='gz-inv-stepper mb-4' style={{ maxWidth: '100%', margin: '0 0 24px 0' }}>
						<div
							className={`gz-inv-step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
							onClick={() => setCurrentStep(1)}>
							<div className='gz-inv-step-circle'>
								{currentStep > 1 ? <FontAwesomeIcon icon={faCheck} /> : 1}
							</div>
							<span className='gz-inv-step-label'>Client & Details</span>
						</div>

						<div className='gz-inv-step-line' />

						<div
							className={`gz-inv-step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
							onClick={() => {
								if (formData.name.trim() && formData.sales_person) setCurrentStep(2)
							}}>
							<div className='gz-inv-step-circle'>
								{currentStep > 2 ? <FontAwesomeIcon icon={faCheck} /> : 2}
							</div>
							<span className='gz-inv-step-label'>Items & Pricing</span>
						</div>

						<div className='gz-inv-step-line' />

						<div
							className={`gz-inv-step-item ${currentStep === 3 ? 'active' : ''}`}
							onClick={() => {
								if (formData.name.trim() && formData.sales_person) setCurrentStep(3)
							}}>
							<div className='gz-inv-step-circle'>3</div>
							<span className='gz-inv-step-label'>Review & Create</span>
						</div>
					</div>

					{/* STEP 1: CLIENT & DETAILS */}
					{currentStep === 1 && (
						<div>
							{/* Client Information */}
							<div className='gz-inv-form-card'>
								<h3 className='gz-inv-form-card-title'>Client Information</h3>
								<div className='row g-3'>
									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>
											Client Name <span className='required'>*</span>
										</label>
										<input
											type='text'
											name='name'
											className='gz-inv-input'
											placeholder='Enter client name'
											value={formData.name}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>GSTIN</label>
										<input
											type='text'
											name='gst_number'
											className='gz-inv-input'
											placeholder='Enter GSTIN (optional)'
											value={formData.gst_number}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>Email</label>
										<input
											type='email'
											name='email'
											className='gz-inv-input'
											placeholder='Enter client email'
											value={formData.email}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>Phone</label>
										<input
											type='tel'
											name='mobile'
											className='gz-inv-input'
											placeholder='Enter phone number'
											value={formData.mobile}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12'>
										<label className='gz-inv-label'>Billing Address</label>
										<input
											type='text'
											name='billing_address_line_1'
											className='gz-inv-input'
											placeholder='Street address / Office building'
											value={formData.billing_address_line_1}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-6'>
										<label className='gz-inv-label'>City</label>
										<input
											type='text'
											name='billing_city'
											className='gz-inv-input'
											placeholder='City'
											value={formData.billing_city}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-6'>
										<label className='gz-inv-label'>Pin Code</label>
										<input
											type='text'
											name='billing_pin_code'
											className='gz-inv-input'
											placeholder='Pin code'
											value={formData.billing_pin_code}
											onChange={handleInputChange}
										/>
									</div>
								</div>
							</div>

							{/* Invoice Details */}
							<div className='gz-inv-form-card'>
								<h3 className='gz-inv-form-card-title'>Invoice Details</h3>
								<div className='row g-3'>
									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>
											Invoice Date <span className='required'>*</span>
										</label>
										<input
											type='date'
											name='date'
											className='gz-inv-input'
											value={formData.date}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>
											Due Date <span className='required'>*</span>
										</label>
										<input
											type='date'
											name='due_date'
											className='gz-inv-input'
											value={formData.due_date}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>Payment Terms</label>
										<SelectField
											name='payment_terms'
											value={formData.payment_terms}
											onChange={handleInputChange}
											options={[
												{ label: 'Net 15 Days', value: 'Net 15 Days' },
												{ label: 'Net 30 Days', value: 'Net 30 Days' },
												{ label: 'Due on Receipt', value: 'Due on Receipt' },
												{ label: 'Advance Payment', value: 'Advance' },
											]}
											showLabel={false}
											marginRemove={true}
											hideDefaultOption={true}
											searchable={false}
										/>
									</div>

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>Reference (Optional)</label>
										<input
											type='text'
											name='reference_name'
											className='gz-inv-input'
											placeholder='Enter reference'
											value={formData.reference_name}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>
											Sales Person <span className='required'>*</span>
										</label>
										<SelectField
											name='sales_person'
											value={formData.sales_person}
											onChange={handleInputChange}
											options={[
												...salesPersonList.map((emp) => ({
													label: emp.full_name || emp.employee?.full_name || emp.name || 'Unnamed',
													value: emp.employee_id || emp._id,
												})),
												{ label: 'N/A / Other', value: 'N/A' },
											]}
											defaultLabel='Select Sales Person'
											showLabel={false}
											marginRemove={true}
											searchable={true}
										/>
									</div>

									{formData.sales_person === 'N/A' && (
										<div className='col-12 col-md-6'>
											<label className='gz-inv-label'>
												Other Sales Person <span className='required'>*</span>
											</label>
											<input
												type='text'
												name='other_sales_person'
												className='gz-inv-input'
												placeholder='Enter name'
												value={formData.other_sales_person}
												onChange={handleInputChange}
											/>
										</div>
									)}

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>Store / Branch</label>
										<SelectField
											name='branch_name'
											value={formData.branch_name}
											onChange={handleInputChange}
											options={branchesData.map((branch) => ({
												label: branch,
												value: branch,
											}))}
											defaultLabel='Select Store / Branch'
											showLabel={false}
											marginRemove={true}
											searchable={true}
										/>
									</div>

									<div className='col-12'>
										<label className='gz-inv-label'>Notes (Optional)</label>
										<textarea
											name='note'
											className='gz-inv-textarea'
											placeholder='Add any notes or terms for this invoice...'
											value={formData.note}
											onChange={handleInputChange}
										/>
									</div>
								</div>
							</div>

							{/* Step 1 Actions */}
							<div className='d-flex align-items-center justify-content-between pt-2 mb-4'>
								<button
									type='button'
									className='gz-inv-btn-cancel'
									onClick={() => navigate('/rag/invoice-list')}>
									Cancel
								</button>
								<button
									type='button'
									className='gz-inv-btn-primary'
									onClick={handleNextToItems}>
									<span>Next: Add Items</span>
									<FontAwesomeIcon icon={faArrowRight} />
								</button>
							</div>
						</div>
					)}

					{/* STEP 2: ITEMS & PRICING */}
					{currentStep === 2 && (
						<div>
							<div className='gz-inv-form-card'>
								<div className='d-flex align-items-center justify-content-between mb-4'>
									<h3 className='gz-inv-form-card-title mb-0'>Line Items & Products</h3>
									<button
										type='button'
										className='gz-inv-btn-outline'
										style={{ height: '36px', padding: '4px 14px', fontSize: '13px' }}
										onClick={addPlanItem}>
										<FontAwesomeIcon icon={faPlus} />
										<span>Add Item</span>
									</button>
								</div>

								{/* Items List */}
								<div className='d-flex flex-column gap-3'>
									{plans.map((plan, idx) => (
										<div
											key={idx}
											className='p-3 rounded-3'
											style={{ background: '#F8FAFD', border: '1px solid #E4EAF2' }}>
											<div className='row g-2 align-items-end'>
												{/* Product Selector */}
												<div className='col-12 col-md-5'>
													<label className='gz-inv-label'>Product</label>
													<SelectField
														value={plan.items}
														onChange={(e: any) => handleProductChange(idx, e.target.value)}
														options={[
															...productList.map((p) => ({
																label: `${p.product_name} (₹${p.price || p.amount || 0})`,
																value: p.product_name,
															})),
															{ label: 'Other / Custom Item', value: 'manual' },
														]}
														defaultLabel='Select Product'
														showLabel={false}
														marginRemove={true}
														searchable={true}
													/>
												</div>

												{plan.inputField && (
													<div className='col-12'>
														<label className='gz-inv-label'>Custom Item Name</label>
														<input
															type='text'
															className='gz-inv-input'
															placeholder='Item description'
															value={plan.items}
															onChange={(e) => handlePlanChange(idx, 'items', e.target.value)}
														/>
													</div>
												)}

												{/* Weight */}
												<div className='col-6 col-md-3'>
													<label className='gz-inv-label'>Weight</label>
													<div className='gz-inv-weight-group'>
														<input
															type='number'
															step='any'
															min='0'
															className='gz-inv-input gz-inv-weight-input'
															placeholder='1'
															value={plan.item_weight}
															onChange={(e) => handlePlanChange(idx, 'item_weight', e.target.value)}
														/>
														<select
															className='gz-inv-select gz-inv-weight-select'
															value={plan.item_weight_type || 'kg'}
															onChange={(e) => handlePlanChange(idx, 'item_weight_type', e.target.value)}
														>
															<option value='kg'>kg</option>
															<option value='gm'>gm</option>
															<option value='ml'>ml</option>
															<option value='ltr'>ltr</option>
															<option value='servings'>servings</option>
															<option value='capsules'>capsules</option>
															<option value='tablets'>tablets</option>
															<option value='pcs'>pcs</option>
														</select>
													</div>
												</div>

												{/* Rate */}
												<div className='col-6 col-md-4'>
													<label className='gz-inv-label'>Rate (₹)</label>
													<input
														type='number'
														className='gz-inv-input'
														placeholder='Price'
														value={plan.amount}
														onChange={(e) => handlePlanChange(idx, 'amount', e.target.value)}
													/>
												</div>

												{/* Qty */}
												<div className='col-4 col-md-3'>
													<label className='gz-inv-label'>Qty</label>
													<input
														type='number'
														className='gz-inv-input'
														value={plan.quantity}
														min='1'
														onChange={(e) => handlePlanChange(idx, 'quantity', e.target.value)}
													/>
												</div>

												{/* GST */}
												<div className='col-4 col-md-3'>
													<label className='gz-inv-label'>GST%</label>
													<input
														type='number'
														className='gz-inv-input'
														placeholder='0'
														value={plan.gst}
														onChange={(e) => handlePlanChange(idx, 'gst', e.target.value)}
													/>
												</div>

												{/* Row Total */}
												<div className='col-4 col-md-4 text-end'>
													<label className='gz-inv-label'>Total</label>
													<div className='pt-2' style={{ fontWeight: 700, color: '#172B4D', fontSize: '15px' }}>
														₹{plan.totalPayment || 0}
													</div>
												</div>

												{/* Delete button */}
												<div className='col-12 col-md-2 text-end'>
													<button
														type='button'
														className='btn btn-sm btn-outline-danger'
														title='Remove item'
														onClick={() => removePlanItem(idx)}>
														<FontAwesomeIcon icon={faTrash} />
													</button>
												</div>
											</div>
										</div>
									))}
								</div>

								{/* Payment Fields */}
								<div className='row mt-4 pt-3 border-top g-3'>
									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>Payment Method</label>
										<SelectField
											name='payment_method'
											value={formData.payment_method}
											onChange={handleInputChange}
											options={['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque'].map(
												(m) => ({ label: m, value: m })
											)}
											showLabel={false}
											marginRemove={true}
											hideDefaultOption={true}
											searchable={false}
										/>
									</div>

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>Paid Amount (₹)</label>
										<input
											type='number'
											name='paid_amount'
											className='gz-inv-input'
											value={formData.paid_amount}
											onChange={handleInputChange}
										/>
									</div>
								</div>
							</div>

							{/* Step 2 Actions */}
							<div className='d-flex align-items-center justify-content-between pt-2 mb-4'>
								<button
									type='button'
									className='gz-inv-btn-outline'
									onClick={() => setCurrentStep(1)}>
									<FontAwesomeIcon icon={faArrowLeft} />
									<span>Back to Details</span>
								</button>
								<button
									type='button'
									className='gz-inv-btn-primary'
									onClick={handleNextToReview}>
									<span>Next: Review & Create</span>
									<FontAwesomeIcon icon={faArrowRight} />
								</button>
							</div>
						</div>
					)}

					{/* STEP 3: REVIEW & CREATE */}
					{currentStep === 3 && (
						<div>
							<div className='gz-inv-form-card'>
								<h3 className='gz-inv-form-card-title'>Review Invoice Summary</h3>

								<div className='p-3 rounded-3 mb-3' style={{ background: '#F8FAFD', border: '1px solid #E4EAF2' }}>
									<div className='d-flex flex-column gap-1' style={{ fontSize: '13px' }}>
										<div><strong>Client:</strong> {formData.name} ({formData.mobile || 'No phone'})</div>
										<div><strong>Date:</strong> {formData.date} • <strong>Due:</strong> {formData.due_date}</div>
										<div><strong>Payment Method:</strong> {formData.payment_method}</div>
										<div><strong>Terms:</strong> {formData.payment_terms}</div>
									</div>
								</div>

								{/* Items summary */}
								<div className='table-responsive mb-3'>
									<table className='gz-inv-table'>
										<thead>
											<tr>
												<th>Item</th>
												<th>Qty</th>
												<th style={{ textAlign: 'right' }}>Total</th>
											</tr>
										</thead>
										<tbody>
											{plans.map((p, idx) => (
												<tr key={idx}>
													<td style={{ fontWeight: 600 }}>{p.items}</td>
													<td>{p.quantity}</td>
													<td style={{ textAlign: 'right', fontWeight: 700 }}>₹{p.totalPayment}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								{/* Grand Total */}
								<div
									className='d-flex justify-content-between align-items-center p-3 rounded-3'
									style={{ background: '#EAF1F8' }}>
									<div>
										<span style={{ fontSize: '13px', color: '#71809A' }}>Total Amount:</span>
										<h3 style={{ fontSize: '20px', fontWeight: 800, color: '#172B4D', margin: 0 }}>
											₹ {netAmount.toLocaleString('en-IN')}
										</h3>
									</div>
									<div className='text-end'>
										<span style={{ fontSize: '12px', color: '#71809A' }}>Paid: ₹{paidAmount}</span>
										<div style={{ fontWeight: 700, color: dueAmount > 0 ? '#D94A62' : '#168064' }}>
											Due: ₹{dueAmount.toLocaleString('en-IN')}
										</div>
									</div>
								</div>
							</div>

							{/* Step 3 Actions */}
							<div className='d-flex align-items-center justify-content-between pt-2 mb-4'>
								<button
									type='button'
									className='gz-inv-btn-outline'
									onClick={() => setCurrentStep(2)}>
									<FontAwesomeIcon icon={faArrowLeft} />
									<span>Back to Items</span>
								</button>
								<button
									type='button'
									className='gz-inv-btn-primary'
									onClick={handleCreateInvoice}
									disabled={isSubmitting}>
									<span>{isSubmitting ? 'Creating Invoice...' : 'Create Invoice'}</span>
									<FontAwesomeIcon icon={faCheck} />
								</button>
							</div>
						</div>
					)}
				</div>

				{/* RIGHT COLUMN: LIVE INVOICE TEMPLATE PREVIEW */}
				<div className='col-12 col-xl-6'>
					<div style={{ position: 'sticky', top: '24px' }}>
						<div className='d-flex align-items-center justify-content-between mb-3 px-1'>
							<div className='d-flex align-items-center gap-2'>
								<div
									className='rounded-3 d-flex align-items-center justify-content-center'
									style={{ width: '32px', height: '32px', background: '#DCE8F8', color: '#172B4D' }}>
									<FontAwesomeIcon icon={faFilePdf} style={{ fontSize: '14px' }} />
								</div>
								<div>
									<h4 style={{ fontSize: '15px', fontWeight: 700, color: '#172B4D', margin: 0 }}>
										Invoice Document Preview
									</h4>
									<span style={{ fontSize: '12px', color: '#71809A' }}>
										Live preview of official company billing template
									</span>
								</div>
							</div>
							<span className='gz-inv-badge paid' style={{ fontSize: '11px', padding: '4px 10px' }}>
								Live Preview
							</span>
						</div>

						<div
							style={{
								background: '#FFFFFF',
								borderRadius: '16px',
								border: '1px solid #E4EAF2',
								padding: '20px',
								boxShadow: '0 4px 20px rgba(16, 31, 56, 0.05)',
								maxHeight: 'calc(100vh - 120px)',
								overflowY: 'auto',
							}}>
							<CompanyInvoiceDocument
								invoiceData={{
									name: formData.name,
									email: formData.email,
									mobile: formData.mobile,
									gst_number: formData.gst_number,
									pan_number: formData.pan_number,
									invoice_number: formData.invoice_number,
									date: formData.date ? DayJS(formData.date).format('YYYY/MM/DD') : '',
									billing_address_line_1: formData.billing_address_line_1,
									billing_city: formData.billing_city,
									billing_state: formData.billing_state,
									billing_pin_code: formData.billing_pin_code,
									billing_country: formData.billing_country,
									sales_person: formData.sales_person,
									discount: formData.discount,
									net_amount: formData.net_amount,
									paid_amount: formData.paid_amount,
									note: formData.note,
								}}
								items={plans.map((p) => ({
									item_name: p.items,
									item_weight: p.item_weight,
									item_weight_type: p.item_weight_type,
									amount: p.amount,
									quantity: p.quantity,
									gst: p.gst,
									discount: p.discount,
									isDiscountPercentage: p.isDiscountPercentage,
									totalAmount: p.totalPayment,
								}))}
								dueAmount={dueAmount}
								showTerms={false}
								containerId='invoiceContent'
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default NutritionCreateInvoice
