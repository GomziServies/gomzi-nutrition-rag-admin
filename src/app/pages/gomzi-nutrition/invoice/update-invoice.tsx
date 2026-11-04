/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
	getInvoice,
	getInvoiceBranches,
	GetProductStocks,
	GetTrainers,
	updateInvoice,
} from '../../../Functions/FGGroup'
import {
	CompanyInvoiceDocument,
} from './CompanyInvoiceDocument'
import SelectField from '../../../components/SelectField'
import './invoice-theme.css'

interface PlanState {
	_id?: string
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

const NutritionUpdateInvoice: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoiceId = searchParams.get('invoice_id') || searchParams.get('id')

	const [loading, setLoading] = useState<boolean>(true)
	const [currentStep, setCurrentStep] = useState<number>(1)
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

	// Form Data
	const [formData, setFormData] = useState({
		invoice_number: '',
		date: '',
		due_date: '',
		payment_terms: 'Net 15 Days',
		name: '',
		branch_name: '',
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

	const [plans, setPlans] = useState<PlanState[]>([])
	const [salesPersonList, setSalesPersonList] = useState<any[]>([])
	const [branchesData, setBranchesData] = useState<string[]>([])
	const [productList, setProductList] = useState<any[]>([])

	// Load invoice data
	const fetchInvoiceData = async () => {
		if (!invoiceId) {
			setLoading(false)
			toast.error('No invoice ID provided')
			return
		}

		try {
			setLoading(true)

			// Load dependencies in parallel
			const [invoiceRes, trainersRes, branchesRes, productsRes]: any = await Promise.all([
				getInvoice({ id: String(invoiceId) }),
				GetTrainers({ limit: 1000 }).catch(() => ({ data: [] })),
				getInvoiceBranches().catch(() => ({ data: [] })),
				GetProductStocks({ limit: 1000 }).catch(() => ({ data: [] })),
			])

			if (trainersRes?.data) setSalesPersonList(trainersRes.data)
			if (branchesRes?.data) {
				const branches = branchesRes.data.map((item: any) => item.branch_name)
				setBranchesData(branches)
			}
			if (productsRes?.data) setProductList(productsRes.data)

			const data = invoiceRes?.data?.[0]
			if (!data) {
				toast.error('Invoice record not found')
				setLoading(false)
				return
			}

			const billingAddress = data?.billing_address || {}

			setFormData({
				invoice_number: String(data.invoice_number || ''),
				date: data.date ? DayJS(data.date).format('YYYY-MM-DD') : '',
				due_date: data.due_date
					? DayJS(data.due_date).format('YYYY-MM-DD')
					: data.date
					? DayJS(data.date).add(15, 'day').format('YYYY-MM-DD')
					: '',
				payment_terms: data.payment_terms || 'Net 15 Days',
				name: data.name || '',
				branch_name: data.branch_name || '',
				sales_person: data.sales_person || '',
				other_sales_person: data.other_sales_person || '',
				billing_address_line_1: billingAddress.address_line_1 || data.billing_address_line_1 || '',
				billing_country: billingAddress.country || data.billing_country || 'India',
				billing_state: billingAddress.state || data.billing_state || '',
				billing_city: billingAddress.city || data.billing_city || '',
				billing_pin_code: billingAddress.pin_code || data.billing_pin_code || '',
				mobile: data.mobile || data.phoneNumber || '',
				gst_number: data.gst_number || '',
				pan_number: data.pan_number || '',
				email: data.email || '',
				payment_method: data.payment_method || 'UPI',
				gst: String(data.gst || '0'),
				discount: String(data.discount || '0'),
				net_amount: String(data.net_amount || '0'),
				paid_amount: String(data.paid_amount || '0'),
				note: data.note || '',
				reference_name: data.reference_name || '',
			})

			// Prepopulate plans
			if (data.items && data.items.length > 0) {
				const mappedPlans = data.items.map((item: any) => ({
					_id: item._id,
					product_id: item.product_id,
					variant_id: item.variant_id,
					type: item.product_id ? 'product' : 'manual',
					items: item.item_name || '',
					item_type: item.item_type || '',
					item_weight: String(item.item_weight || ''),
					item_weight_type: item.item_weight_type || 'kg',
					quantity: String(item.quantity || '1'),
					amount: String(item.amount || '0'),
					gst: String(item.gst || '0'),
					discount: String(item.discount || '0'),
					totalPayment: String(item.totalAmount || '0'),
					duration_number: '',
					duration: '',
					inputField: !item.product_id,
					isDiscountPercentage: item.isDiscountPercentage !== undefined ? item.isDiscountPercentage : true,
				}))
				setPlans(mappedPlans)
			} else {
				setPlans([
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
		} catch (err: any) {
			console.error('Error fetching invoice for edit:', err)
			toast.error('Failed to load invoice')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchInvoiceData()
	}, [invoiceId])

	// Recalculate totals whenever plans change
	useEffect(() => {
		if (loading) return
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
			const discount = parseFloat(newPlans[index].discount) || 0
			let discountForCalc = discount
			if (discount > 0 && newPlans[index].isDiscountPercentage) {
				discountForCalc = (q * amt * discount) / 100
			}
			let tot = q * amt
			if (gst) tot += (tot * gst) / 100
			if (discountForCalc) tot -= discountForCalc
			newPlans[index].totalPayment = Math.max(0, tot).toFixed(0)
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

	const handleUpdateInvoice = async () => {
		setIsSubmitting(true)
		try {
						const plansData = plans.map((plan) => ({
				_id: plan._id && String(plan._id).trim() !== '' ? String(plan._id).trim() : undefined,
				product_id: plan.type === 'product' ? plan.product_id : undefined,
				variant_id: plan.type === 'product' ? plan.variant_id : undefined,
				item_name: plan.items,
				item_type: plan.item_type,
				item_weight: plan.item_weight ? Number(plan.item_weight) : 0,
				item_weight_type: plan.item_weight_type || 'kg',
				amount: Number(plan.amount),
				gst: Number(plan.gst || 0),
				discount: Number(plan.discount || 0),
				totalAmount: Number(plan.totalPayment),
				quantity: Number(plan.quantity),
				duration: plan.duration_number ? `${plan.duration_number} ${plan.duration}` : '1 Days',
				isDiscountPercentage: plan.isDiscountPercentage,
			}))

			const payload: any = {
				id: String(invoiceId),
				invoice_number: isNaN(Number(formData.invoice_number)) ? formData.invoice_number : Number(formData.invoice_number),
				date: DayJS(formData.date).format('YYYY/MM/DD'),
				name: formData.name,
				branch_name: formData.branch_name,
				sales_person: formData.sales_person,
				other_sales_person: formData.other_sales_person,
				email: formData.email,
				mobile: formData.mobile,
				gst_number: formData.gst_number,
				pan_number: formData.pan_number,
				payment_method: formData.payment_method,
				amount: Number(formData.net_amount),
				gst: Number(formData.gst || plans[0]?.gst || 0),
				discount: Number(formData.discount || 0),
				net_amount: Number(formData.net_amount),
				paid_amount: Number(formData.paid_amount || 0),
				note: formData.note,
				items: plansData,
				billing_address: {
					address_line_1: formData.billing_address_line_1,
					city: formData.billing_city,
					state: formData.billing_state,
					pin_code: formData.billing_pin_code,
					country: formData.billing_country,
				},
			}

			await updateInvoice(payload)
			toast.success('Invoice updated successfully!')

			setTimeout(() => {
				navigate(`/rag/view-invoice?invoice_id=${invoiceId}`)
			}, 600)
		} catch (error: any) {
			console.error('Update invoice error:', error)
			toast.error(error?.message || 'Failed to update invoice')
		} finally {
			setIsSubmitting(false)
		}
	}

	if (loading) {
		return (
			<div className='gz-inv-container'>
				<PageTitle breadcrumbs={[]}>Edit Invoice</PageTitle>

				{/* BREADCRUMBS */}
				<div className='gz-inv-breadcrumb'>
					<Link to='/rag/invoice-list'>Invoices</Link>
					<span>&gt;</span>
					<span>Edit Invoice</span>
				</div>

				<div className='gz-inv-header'>
					<div>
						<div className='gz-inv-skeleton mb-2' style={{ width: '200px', height: '32px', borderRadius: '8px' }}></div>
						<div className='gz-inv-skeleton' style={{ width: '280px', height: '14px', borderRadius: '4px' }}></div>
					</div>
				</div>

				<div className='gz-inv-stepper-card mb-4'>
					<div className='gz-inv-stepper'>
						<div className='gz-inv-step active'>
							<span className='gz-inv-step-num'>1</span>
							<span className='gz-inv-step-text'>Client & Details</span>
						</div>
						<div className='gz-inv-step-line'></div>
						<div className='gz-inv-step'>
							<span className='gz-inv-step-num'>2</span>
							<span className='gz-inv-step-text'>Items & Pricing</span>
						</div>
						<div className='gz-inv-step-line'></div>
						<div className='gz-inv-step'>
							<span className='gz-inv-step-num'>3</span>
							<span className='gz-inv-step-text'>Review & Update</span>
						</div>
					</div>
				</div>

				<div className='gz-inv-split-layout'>
					{/* Left Side: Form Skeleton */}
					<div className='gz-inv-form-side'>

						{/* Form Card 1 Skeleton */}
						<div className='gz-inv-form-card mb-4'>
							<h3 className='gz-inv-form-card-title'>Client Information</h3>
							<div className='row g-3'>
								{Array.from({ length: 4 }).map((_, idx) => (
									<div key={idx} className='col-12 col-md-6'>
										<div className='gz-inv-skeleton mb-2' style={{ width: '80px', height: '12px', borderRadius: '4px' }}></div>
										<div className='gz-inv-skeleton' style={{ width: '100%', height: '42px', borderRadius: '8px' }}></div>
									</div>
								))}
							</div>
						</div>

						{/* Form Card 2 Skeleton */}
						<div className='gz-inv-form-card'>
							<h3 className='gz-inv-form-card-title'>Invoice Details</h3>
							<div className='row g-3'>
								{Array.from({ length: 4 }).map((_, idx) => (
									<div key={idx} className='col-12 col-md-6'>
										<div className='gz-inv-skeleton mb-2' style={{ width: '80px', height: '12px', borderRadius: '4px' }}></div>
										<div className='gz-inv-skeleton' style={{ width: '100%', height: '42px', borderRadius: '8px' }}></div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Right Side: Preview Skeleton */}
					<div className='gz-inv-preview-side'>
						<div className='gz-inv-preview-sticky-wrap'>
							<div className='gz-inv-preview-header'>
								<div className='d-flex align-items-center gap-2'>
									<FontAwesomeIcon icon={faFilePdf} />
									<span>Invoice Preview</span>
								</div>
								<div className='gz-inv-skeleton' style={{ width: '80px', height: '22px', borderRadius: '999px' }}></div>
							</div>
							<div className='gz-inv-preview-card p-4'>
								<div className='d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom'>
									<div>
										<div className='gz-inv-skeleton mb-2' style={{ width: '140px', height: '20px', borderRadius: '4px' }}></div>
										<div className='gz-inv-skeleton' style={{ width: '90px', height: '12px', borderRadius: '4px' }}></div>
									</div>
									<div className='gz-inv-skeleton' style={{ width: '50px', height: '50px', borderRadius: '8px' }}></div>
								</div>
								<div className='d-flex flex-column gap-2 mb-4'>
									<div className='gz-inv-skeleton' style={{ width: '100%', height: '36px', borderRadius: '6px' }}></div>
									<div className='gz-inv-skeleton' style={{ width: '100%', height: '36px', borderRadius: '6px' }}></div>
									<div className='gz-inv-skeleton' style={{ width: '100%', height: '36px', borderRadius: '6px' }}></div>
								</div>
								<div className='d-flex justify-content-end'>
									<div className='gz-inv-skeleton' style={{ width: '160px', height: '28px', borderRadius: '6px' }}></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	const netAmount = Number(formData.net_amount || 0)
	const paidAmount = Number(formData.paid_amount || 0)
	const dueAmount = Math.max(0, netAmount - paidAmount)
	const invNumberDisplay = formData.invoice_number ? `#INV-${formData.invoice_number}` : ''

	return (
		<div className='gz-inv-container'>
			<PageTitle breadcrumbs={[]}>Edit Invoice</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-inv-breadcrumb'>
				<Link to='/rag/invoice-list'>Invoices</Link>
				<span>&gt;</span>
				<span>Edit Invoice</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-inv-header mb-4'>
				<div>
					<h1 className='gz-inv-title'>{`Edit Invoice ${invNumberDisplay}`}</h1>
					<p className='gz-inv-subtitle'>Update invoice details and items</p>
				</div>
			</div>

			{/* =========================================================================
			    STEPPER BAR (FULL WIDTH, CLEAN HORIZONTAL NAVIGATION)
			    ========================================================================= */}
			<div className='gz-inv-stepper-card mb-4'>
				<div className='gz-inv-stepper'>
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
						onClick={() => setCurrentStep(2)}>
						<div className='gz-inv-step-circle'>
							{currentStep > 2 ? <FontAwesomeIcon icon={faCheck} /> : 2}
						</div>
						<span className='gz-inv-step-label'>Items & Pricing</span>
					</div>

					<div className='gz-inv-step-line' />

					<div
						className={`gz-inv-step-item ${currentStep === 3 ? 'active' : ''}`}
						onClick={() => setCurrentStep(3)}>
						<div className='gz-inv-step-circle'>3</div>
						<span className='gz-inv-step-label'>Review & Update</span>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    SPLIT VIEW: FORM ON LEFT, LIVE INVOICE TEMPLATE PREVIEW ON RIGHT
			    ========================================================================= */}
			<div className='row g-4 align-items-start'>
				{/* LEFT COLUMN: Form Steps */}
				<div className='col-12 col-xl-6'>
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
											value={formData.billing_address_line_1}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12 col-md-4'>
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

									<div className='col-12 col-md-4'>
										<label className='gz-inv-label'>State</label>
										<input
											type='text'
											name='billing_state'
											className='gz-inv-input'
											placeholder='State'
											value={formData.billing_state}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12 col-md-4'>
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
											value={formData.reference_name}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>Sales Person</label>
										<SelectField
											name='sales_person'
											value={formData.sales_person}
											onChange={handleInputChange}
											options={[
												...salesPersonList.map((emp) => ({
													label: emp.full_name || emp.name || 'Unnamed',
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

									<div className='col-12 col-md-6'>
										<label className='gz-inv-label'>Store / Branch</label>
										<SelectField
											name='branch_name'
											value={formData.branch_name}
											onChange={handleInputChange}
											options={branchesData.map((b) => ({
												label: b,
												value: b,
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
									onClick={() => setCurrentStep(2)}>
									<span>Next: Edit Items</span>
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

								<div className='d-flex flex-column gap-3'>
									{plans.map((plan, idx) => (
										<div
											key={idx}
											className='p-3 rounded-3'
											style={{ background: '#F8FAFD', border: '1px solid #E4EAF2' }}>
											<div className='row g-2 align-items-end'>
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
															value={plan.items}
															onChange={(e) => handlePlanChange(idx, 'items', e.target.value)}
														/>
													</div>
												)}

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

												<div className='col-6 col-md-4'>
													<label className='gz-inv-label'>Rate (₹)</label>
													<input
														type='number'
														className='gz-inv-input'
														value={plan.amount}
														onChange={(e) => handlePlanChange(idx, 'amount', e.target.value)}
													/>
												</div>

												<div className='col-4 col-md-2'>
													<label className='gz-inv-label'>Qty</label>
													<input
														type='number'
														className='gz-inv-input'
														value={plan.quantity}
														min='1'
														onChange={(e) => handlePlanChange(idx, 'quantity', e.target.value)}
													/>
												</div>

												{/* Discount (% or ₹) */}
												<div className='col-8 col-md-3'>
													<label className='gz-inv-label'>Discount</label>
													<div className='gz-inv-weight-group'>
														<input
															type='number'
															min='0'
															step='any'
															className='gz-inv-input gz-inv-weight-input'
															placeholder='0'
															value={plan.discount}
															onChange={(e) => handlePlanChange(idx, 'discount', e.target.value)}
														/>
														<select
															className='gz-inv-select gz-inv-weight-select'
															value={plan.isDiscountPercentage ? '%' : '₹'}
															onChange={(e) => handlePlanChange(idx, 'isDiscountPercentage', e.target.value === '%')}
														>
															<option value='%'>%</option>
															<option value='₹'>₹ (Rs)</option>
														</select>
													</div>
												</div>

												<div className='col-4 col-md-2'>
													<label className='gz-inv-label'>GST%</label>
													<input
														type='number'
														className='gz-inv-input'
														value={plan.gst}
														onChange={(e) => handlePlanChange(idx, 'gst', e.target.value)}
													/>
												</div>

												<div className='col-5 col-md-3 text-end'>
													<label className='gz-inv-label'>Total</label>
													<div className='pt-2' style={{ fontWeight: 700, color: '#172B4D', fontSize: '15px' }}>
														₹{plan.totalPayment || 0}
													</div>
												</div>

												<div className='col-3 col-md-2 text-end'>
													<button
														type='button'
														className='btn btn-sm btn-outline-danger'
														onClick={() => removePlanItem(idx)}>
														<FontAwesomeIcon icon={faTrash} />
													</button>
												</div>
											</div>
										</div>
									))}
								</div>

								{/* Payment details */}
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
									onClick={() => setCurrentStep(3)}>
									<span>Next: Review & Update</span>
									<FontAwesomeIcon icon={faArrowRight} />
								</button>
							</div>
						</div>
					)}

					{/* STEP 3: REVIEW & UPDATE */}
					{currentStep === 3 && (
						<div>
							<div className='gz-inv-form-card'>
								<h3 className='gz-inv-form-card-title'>Review Updated Invoice</h3>

								<div className='p-3 rounded-3 mb-3' style={{ background: '#F8FAFD', border: '1px solid #E4EAF2' }}>
									<div className='d-flex flex-column gap-1' style={{ fontSize: '13px' }}>
										<div><strong>Client:</strong> {formData.name} ({formData.mobile || 'No phone'})</div>
										<div><strong>Date:</strong> {formData.date} • <strong>Due:</strong> {formData.due_date}</div>
										<div><strong>Payment Method:</strong> {formData.payment_method}</div>
									</div>
								</div>

								{/* Items table preview */}
								<div className='table-responsive mb-3'>
									<table className='gz-inv-table'>
										<thead>
											<tr>
												<th>Item</th>
												<th>Qty</th>
												<th>Rate</th>
												<th>Discount</th>
												<th style={{ textAlign: 'right' }}>Total</th>
											</tr>
										</thead>
										<tbody>
											{plans.map((p, idx) => (
												<tr key={idx}>
													<td style={{ fontWeight: 600 }}>{p.items}</td>
													<td>{p.quantity}</td>
													<td>₹{p.amount || 0}</td>
													<td>
														{Number(p.discount || 0) > 0
															? `${p.discount}${p.isDiscountPercentage ? '%' : '₹'}`
															: '-'}
													</td>
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
									onClick={handleUpdateInvoice}
									disabled={isSubmitting}>
									<span>{isSubmitting ? 'Updating Invoice...' : 'Save Changes'}</span>
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

						<div className='gz-inv-preview-sheet-container'>
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

export default NutritionUpdateInvoice
