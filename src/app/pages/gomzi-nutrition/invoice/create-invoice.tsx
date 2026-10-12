import html2pdf from 'html2pdf.js'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TermAndCondition from '../../../components/TermAndCondition'
import TextareaField from '../../../components/TextareaField'
import {
	createInvoice,
	getInvoiceBranches,
	getNextInvoiceSequence,
	GetProductStocks,
	GetTrainers,
} from '../../../Functions/FGGroup'

interface InvoicePlanItem {
	item_name: string
	item_type?: string
	item_weight?: number
	item_weight_type?: string
	amount: number
	gst: number
	discount: number
	totalAmount: string
	quantity: string
	duration: string
	isDiscountPercentage: boolean
}

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

// Add interfaces for location data
interface Country {
	id: number
	name: string
	iso2: string
}

interface State {
	id: number
	name: string
	country_id: number
	country_code: string
	state_code: string
}

interface City {
	id: number
	name: string
	state_id: number
	state_code: string
	country_id: number
	country_code: string
	latitude: string
	longitude: string
}

const NutritionCreateInvoice: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [downloadBtn, setDownloadBtn] = useState(false)
	const [isDiscountPercentage, setIsDiscountPercentage] = useState(true)

	// Add state variables for location data
	const [formData, setFormData] = useState({
		invoice_number: '',
		date: '',
		name: '',
		branch_name: '',
		sales_person: '',
		// Update billing address fields
		billing_address_line_1: '',
		billing_country: 'India',
		billing_state: '',
		billing_city: '',
		billing_pin_code: '',
		mobile: '',
		gst_number: '',
		pan_number: '',
		email: '',
		items: [],
		payment_method: '',
		gst: '',
		discount: '',
		net_amount: '',
		paid_amount: '',
		note: '',
		other_sales_person: '',
		service_charge: [],
		freight_charges: [],
		reference_name: '',
		custom_branch_name: '',
	})
	const [invoiceData, setInvoiceData] = useState({
		invoice_number: '',
		date: '',
		name: '',
		branch_name: '',
		sales_person: '',
		other_sales_person: '',
		// Update billing address fields
		billing_address_line_1: '',
		billing_country: 'India',
		billing_state: '',
		billing_city: '',
		billing_pin_code: '',
		mobile: '',
		gst_number: '',
		pan_number: '',
		email: '',
		items: [],
		payment_method: '',
		gst: '',
		discount: '',
		net_amount: '',
		paid_amount: '',
		note: '',
		reference_name: '',
		service_charge: [],
		freight_charges: [],
	})
	const [invoicePlanData, setInvoicePlanData] = useState<InvoicePlanItem[]>([])
	const [salesPersonList, setSalesPersonList] = useState<any[]>([])
	const [branchesData, setBranchesData] = useState<string[]>([])
	const [productList, setProductList] = useState<any[]>([])

	const [plans, setPlans] = useState<PlanState[]>([
		{
			items: '',
			item_type: '',
			type: '',
			product_id: '',
			variant_id: '',
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
	const [dueAmount, setDueAmount] = useState('')
	const adminType = localStorage.getItem('admin')

	const fetchInvoiceBranches = async () => {
		try {
			const response: any = await getInvoiceBranches()

			const branches = response.data.map((item: any) => item.branch_name)

			setBranchesData([...branches, 'Other'])
		} catch (error) {
			console.error('Error fetching branches:', error)
		}
	}

	useEffect(() => {
		fetchInvoiceBranches()
	}, [])

	const handleCreateInvoice = async () => {
		if (!formData.sales_person) {
			toast.error('Please select Sales Person')
			return
		}

		if (formData.sales_person === 'N/A' && !formData.other_sales_person) {
			toast.error('Please enter sales person name')
			return
		}
		const plansData = plans.map((plan) => ({
			product_id: plan.type === 'product' ? plan.product_id : undefined,
			variant_id: plan.type === 'product' ? plan.variant_id : undefined,
			item_name: plan.items,
			item_type: plan.item_type,
			item_weight: plan.item_weight ? Number(plan.item_weight) : 0,
			item_weight_type: plan.item_weight_type,
			amount: Number(plan.amount),
			gst: Number(plan.gst),
			discount: Number(plan.discount),
			totalAmount: plan.totalPayment,
			quantity: plan.quantity,
			duration: plan.duration_number + ' ' + plan.duration,
			isDiscountPercentage: plan.isDiscountPercentage,
		}))

		const totalAmount: number = plans.reduce((sum: number, plan: PlanState): number => {
			return sum + (parseFloat(plan.totalPayment) || 0)
		}, 0)

		const totalDiscount: number = plans.reduce((sum: number, plan: PlanState): number => {
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
		const finalBranchName =
			formData.branch_name === 'Other' ? formData.custom_branch_name : formData.branch_name
		try {
			setIsSubmitting(true)
			const payload: any = {
				invoice_category: adminType == 'Store' ? adminType : 'Gomzi Nutrition',
				invoice_number: Number(formData?.invoice_number),
				date: DayJS(formData?.date).format('YYYY/MM/DD'),
				name: formData?.name,
				branch_name: finalBranchName,
				sales_person: formData?.sales_person,
				other_sales_person: formData?.other_sales_person,
				email: formData?.email,
				mobile: formData?.mobile,
				gst_number: formData?.gst_number,
				pan_number: formData?.pan_number,
				amount: Number(totalAmount),
				gst: Number(plans[0]?.gst),
				discount: Number(totalDiscount),
				// Update billing address structure to match backend model
				billing_address: {
					address_line_1: formData?.billing_address_line_1,
					city: formData?.billing_city,
					state: formData?.billing_state,
					pin_code: formData?.billing_pin_code,
					country: formData?.billing_country,
				},
				payment_method: formData?.payment_method,
				net_amount: Number(formData?.net_amount),
				paid_amount: Number(formData?.paid_amount),
				note: formData?.note,
				items: plansData,
				reference_name: formData?.reference_name,
			}

			await createInvoice(payload)
			toast.success('Invoice Created Successfully')

			setInvoiceData({
				...formData,
				sales_person:
					formData.sales_person === 'N/A'
						? formData.other_sales_person
						: salesPersonList.find((e: any) => e.employee_id === formData.sales_person)
								?.full_name || formData.sales_person,
			})
			setInvoicePlanData(plansData)
			setDownloadBtn(true)

			const due = Number(formData?.net_amount) - Number(formData?.paid_amount)
			setDueAmount(due.toString())
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

	const fetchInvoiceData = async () => {
		try {
			const category: any = adminType == 'Store' ? adminType : 'Gomzi Nutrition'
			const response: FGGroupAPIResponse | any = await getNextInvoiceSequence({
				invoice_category: category,
			})
			if (response.data) {
				const allData = response.data

				setFormData((prevData: any) => ({
					...prevData,
					invoice_number: parseInt(allData?.next_invoice_number),
				}))
			}
		} catch (error) {
			console.error(error)
		}
	}

	const fetchSalesPersons = async () => {
		try {
			const response: any = await GetTrainers({ limit: 1000 })
			if (response.data) {
				const salesPersons = response.data
				setSalesPersonList(salesPersons)
			}
		} catch (error) {
			console.error('Error fetching sales persons:', error)
		}
	}

	useEffect(() => {
		fetchInvoiceData()
		fetchSalesPersons()
		fetchInvoiceBranches()
		fetchProducts()
	}, [])

	const fetchProducts = async () => {
		try {
			const response: any = await GetProductStocks({
				limit: 1000,
			})

			setProductList(response.data || [])
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const productOptions = [
		...productList.map((item) => ({
			label: item.product_name,
			value: item.variant_id || item.product_id,

			product_id: item.product_id,
			variant_id: item.variant_id,

			amount: item.price,
			stock: item.stock,

			type: item.type,
		})),

		{
			label: 'Other / Manual',
			value: 'manual',
		},
	]

	// Update net amount when service charges or freight charges change
	useEffect(() => {
		// Calculate total amount from plans
		const totalAmount: number = plans.reduce((sum: number, plan: PlanState): number => {
			return sum + (parseFloat(plan.totalPayment) || 0)
		}, 0)

		// Calculate total discount from plans
		const totalDiscount: number = plans.reduce((sum: number, plan: PlanState): number => {
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

		// Update form data with new net amount including charges
		setFormData((prevFormData) => ({
			...prevFormData,
			net_amount: String(totalAmount),
			discount: String(totalDiscount),
		}))
	}, [plans])

	// Update the handleInputChange function to handle the new address fields
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		let { value } = event.target
		const { name } = event.target

		if (name === 'name') {
			value = value.replace(/\b\w/g, (char) => char.toUpperCase())
		}

		const data = { ...formData, [name]: value }

		// Calculate discount based on type (percentage or rupee)
		if (name === 'discount' || name === 'gst') {
			const amt = parseFloat(data.net_amount) || 0
			const gst = parseFloat(data.gst) || 0
			let dis = parseFloat(data.discount) || 0

			if (isDiscountPercentage) {
				dis = (amt * dis) / 100
			}

			// Calculate net amount: amount + GST - discount
			const netAmount = amt + (amt * gst) / 100 - dis
			data.net_amount = netAmount.toFixed(0)
		}

		setFormData(data)

		if (name === 'net_amount' || name === 'paid_amount') {
			const paidAmount = parseInt(data.paid_amount) || 0
			const netAmount = parseInt(data.net_amount) || 0
			const dueAmount = netAmount - paidAmount
			setDueAmount(dueAmount.toString())
		}
	}

	const calculateTotalPayment = (plans: any[]): number => {
		return plans.reduce((total: number, plan: any) => {
			const quantity = parseFloat(plan.quantity) || 0
			const amount = parseFloat(plan.amount) || 0
			const gst = parseFloat(plan.gst) || 0
			const discount = parseFloat(plan.discount) || 0

			// Apply discount type logic
			const isDiscountPercentage =
				plan.isDiscountPercentage !== undefined ? plan.isDiscountPercentage : true
			let discountForCalculation = discount
			if (discount > 0) {
				const baseAmount = quantity * amount
				if (isDiscountPercentage) {
					// For percentage, convert to rupee value for calculation
					discountForCalculation = (baseAmount * discount) / 100
				}
			}

			let planTotal = quantity * amount
			if (gst) {
				planTotal += (planTotal * gst) / 100
			}
			if (discountForCalculation) {
				planTotal -= discountForCalculation
			}

			return total + planTotal
		}, 0)
	}

	const handlePlanInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		const newPlans: PlanState[] = [...plans]

		if (name === 'items') {
			newPlans[index].inputField = value === 'Other'
		}

		// Type-safe assignment
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
		const discount = parseFloat(newPlans[index].discount) || 0

		// Apply discount type logic
		const isDiscountPercentage =
			newPlans[index].isDiscountPercentage !== undefined
				? newPlans[index].isDiscountPercentage
				: true
		let discountForCalculation = discount
		if (discount > 0) {
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
		// const newTotalPayment = calculateTotalPayment(newPlans);
		const totalAmount: number = newPlans.reduce((sum: number, plan: PlanState): number => {
			return sum + (parseFloat(plan.totalPayment) || 0)
		}, 0)

		const totalDiscount: number = newPlans.reduce((sum: number, plan: PlanState): number => {
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
			net_amount: String(totalAmount), // Include charges in total
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

					const newNetAmount = calculateTotalPayment(newPlans)

					const totalDiscount: number = newPlans.reduce((sum: number, plan: any) => {
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

					const paidAmount = parseFloat(formData.paid_amount) || 0
					const newDueAmount = newNetAmount - paidAmount

					setPlans(newPlans)
					setFormData({
						...formData,
						net_amount: newNetAmount.toFixed(2), // Include charges in total
						discount: totalDiscount.toFixed(2),
					})
					setDueAmount(newDueAmount.toFixed(2))

					toast.success('Plan Deleted Successfully')
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

	const generatePDF = async (name: string) => {
		const invoiceContent = document.getElementById('invoiceContent')
		const termsContent = document.getElementById('invoiceTermAndCondition')

		if (!invoiceContent || !termsContent) return

		invoiceContent.classList.add('pdf-font-black')
		termsContent.classList.add('pdf-font-black')

		const wrapper = document.createElement('div')

		wrapper.appendChild(invoiceContent.cloneNode(true))
		wrapper.appendChild(termsContent.cloneNode(true))

		const opt = {
			margin: [8, 8, 8, 8],
			filename: `${name || 'invoice'}.pdf`,
			image: {
				type: 'jpeg',
				quality: 1,
			},
			html2canvas: {
				scale: 2,
				useCORS: true,
				scrollX: 0,
				scrollY: 0,
			},
			jsPDF: {
				unit: 'mm',
				format: 'a4',
				orientation: 'portrait',
			},
			pagebreak: {
				mode: ['css', 'legacy'],
			},
		}

		await html2pdf().set(opt).from(wrapper).save()

		invoiceContent.classList.remove('pdf-font-black')
		termsContent.classList.remove('pdf-font-black')
	}

	// Calculate total product amount without discount and GST
	const calculateTotalProductAmount = (): number => {
		return invoicePlanData.reduce((sum, item: InvoicePlanItem) => {
			const quantity = parseFloat(item.quantity?.toString() || '-') || 0
			const amount = parseFloat(item.amount?.toString() || '-') || 0
			return sum + quantity * amount
		}, 0)
	}

	// Calculate total GST amount
	const calculateTotalGstAmount = (): number => {
		return invoicePlanData.reduce((sum, item: InvoicePlanItem) => {
			const quantity = parseFloat(item.quantity?.toString() || '-') || 0
			const amount = parseFloat(item.amount?.toString() || '-') || 0
			const gstPercent = parseFloat(item.gst?.toString() || '-') || 0
			const baseAmount = quantity * amount
			const gstAmount = (baseAmount * gstPercent) / 100
			return sum + gstAmount
		}, 0)
	}

	const handleProductChange = (index: number, selectedName: string) => {
		const newPlans = [...plans]
		if (selectedName === 'Other / Manual') {
			newPlans[index].type = 'manual'
			newPlans[index].product_id = ''
			newPlans[index].variant_id = ''
			newPlans[index].items = ''
			newPlans[index].amount = ''
			setPlans(newPlans)
			return
		}
		const product: any = productOptions.find((x) => x.label === selectedName)
		if (!product) return
		newPlans[index].type = 'product'
		newPlans[index].product_id = product.product_id
		newPlans[index].variant_id = product.variant_id
		newPlans[index].items = product.label
		newPlans[index].amount = String(product.amount)
		setPlans(newPlans)
	}

	const hasGst = invoicePlanData.some((item) => Number(item.gst) > 0)

	const hasDiscount = invoicePlanData.some((item) => Number(item.discount) > 0)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Create Invoice</PageTitle>

			{/* <h1 className='fw-bold text-dark fs-1 mb-6 '>Create Invoice</h1> */}
			<div className='row'>
				<div className='col-md-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-4'>Create Invoice</p>
							<form>
								<div className='row'>
									<div className='col-12 row'>
										{' '}
										<InputField
											className='col-md-4 fv-row'
											label='Invoice Number'
											placeholder="Invoice Number'"
											type='number'
											name='invoice_number'
											htmlFor='invoice_number'
											value={formData?.invoice_number}
											onChange={handleInputChange}
										/>{' '}
										<InputField
											className='col-md-4 fv-row'
											label='Date'
											placeholder="Date'"
											type='date'
											name='date'
											htmlFor='date'
											value={formData?.date}
											onChange={handleInputChange}
										/>{' '}
										<SelectField
											className='col-md-4 fv-row mb-7'
											label='Branch Name'
											name='branch_name'
											value={formData.branch_name}
											onChange={handleInputChange}
											htmlFor='txt_company'
											options={branchesData}
										/>
										{formData.branch_name === 'Other' && (
											<InputField
												className='col-md-4 fv-row mb-7'
												type='text'
												htmlFor='branch_name'
												label='Enter Branch Name'
												name='custom_branch_name'
												value={formData.custom_branch_name}
												onChange={handleInputChange}
												placeholder='Enter branch name'
											/>
										)}
										<div
											className={`${
												formData.sales_person === 'N/A' ? 'col-md-2' : 'col-md-4'
											} fv-row mb-7`}>
											<label
												htmlFor='sales_person'
												className='fw-bold fs-6 mb-md-5 mb-2'>
												Sales Person
											</label>
											<div className='selectfield-bg mb-3 mb-lg-0'>
												<select
													name='sales_person'
													value={formData.sales_person}
													onChange={handleInputChange}
													className='form-select inputfield-bg'>
													<option value=''>Select</option>
													{salesPersonList.map((emp: any) => (
														<option
															key={emp._id || emp.employee?._id || emp.employee_id}
															value={emp.employee_id || emp.employee?.employee_id || emp._id}>
															{emp.full_name ||
																emp.employee?.full_name ||
																emp.employee?.name ||
																'Unnamed'}
														</option>
													))}
													<option value='N/A'>N/A</option>
												</select>
											</div>
										</div>
										{formData.sales_person === 'N/A' && (
											<InputField
												className='col-md-2 fv-row'
												label='Sales Person Name *'
												placeholder='Enter Sales Person Name'
												type='text'
												name='other_sales_person'
												htmlFor='other_sales_person'
												value={formData.other_sales_person}
												onChange={handleInputChange}
											/>
										)}
										<InputField
											className='col-md-4 fv-row'
											label='Full Name'
											placeholder='Enter Full Name'
											type='text'
											name='name'
											htmlFor='name'
											value={formData?.name}
											onChange={handleInputChange}
										/>{' '}
										<InputField
											className='col-md-4 fv-row'
											label='Phone No.'
											placeholder='Enter Phone No.'
											type='text'
											name='mobile'
											htmlFor='mobile'
											value={formData?.mobile}
											onChange={handleInputChange}
										/>{' '}
										<InputField
											className='col-md-4 fv-row'
											label='Email'
											placeholder='Enter Email'
											type='email'
											name='email'
											htmlFor='email'
											value={formData?.email}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-4 fv-row'
											label='GST Number'
											placeholder='Enter GSTNumber'
											type='text'
											name='gst_number'
											htmlFor='gst_number'
											value={formData?.gst_number}
											onChange={handleInputChange}
										/>{' '}
										<InputField
											className='col-md-4 fv-row'
											label='PAN Number'
											placeholder='Enter PAN Number'
											type='text'
											name='pan_number'
											htmlFor='pan_number'
											value={formData?.pan_number}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-4 fv-row'
											label='Reference Name'
											placeholder='Enter Reference Name'
											type='text'
											name='reference_name'
											htmlFor='reference_name'
											value={formData.reference_name}
											onChange={handleInputChange}
										/>
										<h1 className='mb-4'>Billing Address:</h1>
										<div className='col-12 mb-5'>
											<div
												className='row py-5 pb-0'
												style={{
													border: '1px solid #00000008',
													borderRadius: '10px',
													backgroundColor: '#00000008',
												}}>
												<InputField
													className='col-md-4 fv-row mb-7'
													label='State'
													placeholder='Enter State'
													type='text'
													name='billing_state'
													htmlFor='billing_state'
													value={formData.billing_state}
													onChange={handleInputChange}
												/>
												<InputField
													className='col-md-4 fv-row mb-7'
													label='City'
													placeholder='Enter City'
													type='text'
													name='billing_city'
													htmlFor='billing_city'
													value={formData.billing_city}
													onChange={handleInputChange}
												/>
												<InputField
													className='col-md-4 fv-row'
													label='Postal/Zip Code'
													placeholder='Enter Postal/Zip Code'
													type='text'
													name='billing_pin_code'
													htmlFor='billing_pin_code'
													value={formData?.billing_pin_code}
													onChange={handleInputChange}
												/>{' '}
												<InputField
													className='col-md-12 fv-row'
													label='Address'
													placeholder='Enter Address'
													type='text'
													name='billing_address_line_1'
													htmlFor='billing_address_line_1'
													value={formData?.billing_address_line_1}
													onChange={handleInputChange}
												/>{' '}
											</div>
										</div>
									</div>

									<h1 className='mb-4'>Supplements:</h1>

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
												<div className='col-11 row py-5 pb-0'>
													<SelectField
														className='col-md-2 fv-row mb-7'
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
													/>{' '}
													<SelectField
														className='col-md-3'
														label='Product'
														htmlFor='product'
														name='items'
														value={plan.items}
														options={productOptions.map((x) => x.label)}
														onChange={(e) => handleProductChange(index, e.target.value)}
													/>
													{plan.type === 'manual' && (
														<InputField
															type='text'
															className='col-md-3'
															htmlFor='product_name'
															label='Product Name'
															name='items'
															value={plan.items}
															onChange={(e: any) => handlePlanInputChange(index, e)}
														/>
													)}
													<div className='col-md-3 fv-row mb-7'>
														<label
															className='fw-bold fs-6 mb-md-5 mb-2'
															htmlFor={`item_weight_${index}`}>
															Weight
														</label>
														<div className='d-flex align-items-center '>
															<input
																type='number'
																name='item_weight'
																id={`item_weight_${index}`}
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
													<InputField
														className='col-md-3 fv-row'
														label='Rate'
														placeholder='Enter Amount'
														type='text'
														name='amount'
														htmlFor='amount'
														value={plan?.amount}
														onChange={(e: any) => handlePlanInputChange(index, e)}
													/>{' '}
													<InputField
														className='col-md-3 fv-row'
														label='Quantity'
														placeholder='Enter Quantity'
														type='number'
														name='quantity'
														htmlFor='quantity'
														value={plan?.quantity}
														onChange={(e: any) => handlePlanInputChange(index, e)}
													/>{' '}
													<InputField
														className='col-md-3 fv-row'
														label='Amount'
														placeholder='Amount'
														type='text'
														name='totalPayment'
														htmlFor='totalPayment'
														value={`${(Number(plan?.amount) || 0) * (Number(plan?.quantity) || 0)}`}
														disabled
													/>
													<InputField
														className='col-md-3 fv-row'
														label='GST'
														placeholder='GST'
														type='number'
														name='gst'
														htmlFor='gst'
														value={plan.gst}
														onChange={(e: any) => handlePlanInputChange(index, e)}
													/>
													<div className='col-md-3 fv-row'>
														<div className='d-flex align-items-center mb-2'>
															<label
																htmlFor={`discount-${index}`}
																className='fw-bold fs-6 mb-3'>
																Discount
															</label>
															<div className='form-check form-switch form-check-custom form-check-solid mb-2 ms-2'>
																<input
																	className='form-check-input w-25px h-15px '
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

																		// Convert discount value when switching types
																		let discountValue = parseFloat(plan.discount) || 0
																		const quantity = parseFloat(plan.quantity) || 0
																		const amount = parseFloat(plan.amount) || 0
																		const baseAmount = quantity * amount

																		if (discountValue > 0 && baseAmount > 0) {
																			if (currentIsPercentage && !newIsPercentage) {
																				// Converting from percentage to rupee
																				discountValue = (baseAmount * discountValue) / 100
																			} else if (!currentIsPercentage && newIsPercentage) {
																				// Converting from rupee to percentage
																				discountValue = (discountValue / baseAmount) * 100
																			}
																		}

																		newPlans[index].isDiscountPercentage = newIsPercentage
																		newPlans[index].discount = discountValue.toString()
																		setPlans(newPlans)
																	}}
																/>
																<label
																	className='form-check-label fw-bold fs-8 ms-1'
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
															className='form-control inputfield-bg'
															id={`discount-${index}`}
															name='discount'
															placeholder={`Discount in ${
																plan.isDiscountPercentage !== undefined
																	? plan.isDiscountPercentage
																		? 'percentage'
																		: 'rupees'
																	: 'percentage'
															}`}
															value={plan.discount}
															onChange={(e: any) => handlePlanInputChange(index, e)}
														/>
													</div>
													<InputField
														className='col-md-4 fv-row'
														label='Total'
														placeholder='Total'
														type='text'
														name='totalPayment'
														htmlFor='totalPayment'
														value={plan?.totalPayment}
														disabled
													/>
													{/* <InputField
														className='col-md-4 fv-row'
														label='Duration In Number'
														placeholder='Enter Duration'
														type='number'
														name='duration_number'
														htmlFor='duration_number'
														value={plan?.duration_number}
														onChange={(e: any) => handlePlanInputChange(index, e)}
													/>
													<SelectField
														className='col-md-4 fv-row mb-7'
														label='Select Duration'
														name='duration'
														value={plan?.duration}
														onChange={(e: any) => handlePlanInputChange(index, e)}
														htmlFor='duration'
														options={['Days', 'Month', 'Year']}
													/> */}
												</div>
												<div className='col-1'>
													<div className='mt-17 d-flex justify-content-end'>
														<TableButton
															action='remove'
															backgroundDark={true}
															onClick={(e) => removePlan(index, e)}
														/>
													</div>
												</div>
											</div>
										</div>
									))}

									<div className='col-12 my-3 d-flex justify-content-end'>
										<button
											className='btn-primary btn gap-2 mx-2 btn-sm me-1'
											onClick={(e) => addPlan(e)}>
											Add
										</button>
									</div>

									{/* Service Charges Section */}
									{/* <h1 className='mb-4'>Service Charges:</h1>
									<div className='col-12 mb-5'>
										<div
											className='row py-5 pb-0'
											style={{
												border: '1px solid #00000008',
												borderRadius: '10px',
												backgroundColor: '#00000008',
											}}>
											{serviceCharges.length === 0 ? (
												<p className='text-center col-12'>No service charges added</p>
											) : (
												<>
													{serviceCharges.map((charge, index) => (
														<div
															key={index}
															className='col-12 mb-3'>
															<div className='row'>
																<div className='col-md-5'>
																	<InputField
																		label='Charge Name'
																		placeholder='Enter Charge Name'
																		type='text'
																		name='charge_name'
																		htmlFor={`service-charge-name-${index}`}
																		value={charge.charge_name}
																		onChange={(e) =>
																			handleServiceChargeChange(
																				index,
																				'charge_name',
																				e.target.value
																			)
																		}
																	/>
																</div>
																<div className='col-md-5'>
																	<InputField
																		label='Charge Amount'
																		placeholder='Enter Charge Amount'
																		type='number'
																		name='charge_amount'
																		htmlFor={`service-charge-amount-${index}`}
																		value={charge.charge_amount.toString()}
																		onChange={(e) =>
																			handleServiceChargeChange(
																				index,
																				'charge_amount',
																				e.target.value
																			)
																		}
																	/>
																</div>
																<div className='col-md-2 d-flex align-items-center'>
																	<button
																		className='btn btn-danger mt-4'
																		type='button'
																		onClick={() => removeServiceCharge(index)}>
																		Remove
																	</button>
																</div>
															</div>
														</div>
													))}
												</>
											)}
										</div>
										<div className='col-12 my-3 d-flex justify-content-end'>
											<button
												className='btn-primary btn gap-2 mx-2 btn-sm me-1'
												type='button'
												onClick={addServiceCharge}>
												Add
											</button>
										</div>
									</div> */}

									{/* Freight Charges Section */}
									{/* <h1 className='mb-4'>Freight Charges:</h1>
									<div className='col-12 mb-5'>
										<div
											className='row py-5 pb-0'
											style={{
												border: '1px solid #00000008',
												borderRadius: '10px',
												backgroundColor: '#00000008',
											}}>
											{freightCharges.length === 0 ? (
												<p className='text-center col-12'>No freight charges added</p>
											) : (
												<>
													{freightCharges.map((charge, index) => (
														<div
															key={index}
															className='col-12 mb-3'>
															<div className='row'>
																<div className='col-md-5'>
																	<InputField
																		label='Charge Name'
																		placeholder='Enter Charge Name'
																		type='text'
																		name='charge_name'
																		htmlFor={`freight-charge-name-${index}`}
																		value={charge.charge_name}
																		onChange={(e) =>
																			handleFreightChargeChange(
																				index,
																				'charge_name',
																				e.target.value
																			)
																		}
																	/>
																</div>
																<div className='col-md-5'>
																	<InputField
																		label='Charge Amount'
																		placeholder='Enter Charge Amount'
																		type='number'
																		name='charge_amount'
																		htmlFor={`freight-charge-amount-${index}`}
																		value={charge.charge_amount.toString()}
																		onChange={(e) =>
																			handleFreightChargeChange(
																				index,
																				'charge_amount',
																				e.target.value
																			)
																		}
																	/>
																</div>
																<div className='col-md-2 d-flex align-items-center'>
																	<button
																		className='btn btn-danger mt-4'
																		type='button'
																		onClick={() => removeFreightCharge(index)}>
																		Remove
																	</button>
																</div>
															</div>
														</div>
													))}
												</>
											)}
										</div>
										<div className='col-12 my-3 d-flex justify-content-end'>
											<button
												className='btn-primary btn gap-2 mx-2 btn-sm me-1'
												type='button'
												onClick={addFreightCharge}>
												Add
											</button>
										</div>
									</div> */}

									<div className='col-12 row'>
										{' '}
										<InputField
											className='col-md-3 fv-row'
											label='Total Amount'
											placeholder='Enter Total Amount'
											type='text'
											name='net_amount'
											htmlFor='net_amount'
											value={formData?.net_amount}
											onChange={handleInputChange}
										/>{' '}
										<InputField
											className='col-md-3 fv-row'
											label='Paid Amount'
											placeholder='Enter Paid Amount'
											type='text'
											name='paid_amount'
											htmlFor='paid_amount'
											value={formData?.paid_amount}
											onChange={handleInputChange}
										/>{' '}
										<InputField
											className='col-md-3 fv-row'
											label='Due Amount'
											placeholder='Enter Due Amount'
											type='text'
											name='due_amount'
											htmlFor='due_amount'
											value={dueAmount}
											onChange={handleInputChange}
										/>{' '}
										<SelectField
											className='col-md-3 fv-row mb-7'
											label='Payment Method'
											name='payment_method'
											value={formData?.payment_method}
											onChange={handleInputChange}
											htmlFor='txt_company'
											options={[
												'COD',
												'Save In',
												'EMI',
												'Google Pay',
												'Phone Pay',
												'Bharat Pay',
												'Paytm',
												'Freecharg',
												'Amazon pay',
												'UPI ID Pay',
												'MobikWik',
												'PayU',
												'Cred',
												'Paypal',
												'Bank Application Pay',
												'Credit Card',
												'Debit Card',
												'RTGS',
												'NEFT',
												'Cheque',
												'Cash',
												'None',
											]}
										/>{' '}
										<TextareaField
											className='col-md-12 fv-row'
											label='Description'
											placeholder='Write Description'
											name='note'
											htmlFor='note'
											value={formData?.note}
											onChange={handleNotesChange}
										/>
									</div>
									<div className='col-md-12 fv-row mb-7'>
										<div className='d-flex justify-content-end'>
											{downloadBtn ? (
												<button
													type='button'
													className='btn btn-success mb-4 me-3'
													onClick={() => generatePDF(invoiceData?.name)}>
													Download Invoice
												</button>
											) : (
												''
											)}
											<button
												type='button'
												className={`btn btn-primary btn-block mb-4 ${
													isSubmitting ? 'disabled' : ''
												}`}
												onClick={handleCreateInvoice}
												disabled={isSubmitting}>
												{isSubmitting ? 'Please wait, creating invoice...' : 'Create Invoice'}
											</button>
										</div>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
			<div className='col-md-6 mt-3'>
				<div id='invoiceContent'>
					<div className='card'>
						<div className='card-body'>
							<div>
								<p className='fw-bold fs-5 text-center mb-2'>TAX INVOICE</p>
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
										<div className='col-md-6  px-0'>
											<div
												className='bill-to border-bottom border-top border-black'
												style={{ fontSize: '13px' }}>
												Bill To
											</div>
											<strong>
												<p
													className='mt-2 px-2'
													style={{ fontSize: '12px' }}
													id='inv-name'>
													Name: {invoiceData.name || 'N/A'}
												</p>

												<p
													className='px-2'
													style={{ fontSize: '12px' }}
													id='inv-email'>
													Email: {invoiceData.email || 'N/A'}
												</p>
												{/* {invoiceData.gst_number && ( */}
												<p
													className='px-2'
													style={{ fontSize: '12px' }}
													id='inv-gst_number'>
													GST No: {invoiceData.gst_number || 'N/A'}
												</p>
												{/* )} */}
												{/* {invoiceData.pan_number && ( */}
												<p
													className='px-2'
													style={{ fontSize: '12px' }}
													id='inv-pan_number'>
													PAN No: {invoiceData.pan_number || 'N/A'}
												</p>
												{/* )} */}
											</strong>
										</div>
										<div className='col-md-6 border border-black border-bottom-0 border-end-0 text-right'>
											<div className='bill-name-date px-2'>
												<p style={{ fontSize: '12px' }}>
													<strong>Invoice No. :</strong>
													<span id='inv-n'>{invoiceData.invoice_number || 'N/A'}</span>
												</p>
												{/* <p style={{ fontSize: '12px' }}>
												<strong>Sales Person :</strong>
												<span>{invoiceData.sales_person || '-'}</span>
											</p> */}
												<p style={{ fontSize: '12px' }}>
													<strong>Date :-</strong>
													<span id='inv-date'>{invoiceData.date || 'N/A'}</span>
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>Phone No. :-</strong>
													<span id='inv-mobile'>{invoiceData.mobile || 'N/A'}</span>
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>Address :-</strong>
													<span id='inv-address'>
														{`${invoiceData.billing_address_line_1 || ''}${
															invoiceData.billing_address_line_1 &&
															(invoiceData.billing_city ||
																invoiceData.billing_state ||
																invoiceData.billing_pin_code ||
																invoiceData.billing_country)
																? ', '
																: ''
														}${invoiceData.billing_city || ''}${
															invoiceData.billing_city &&
															(invoiceData.billing_state || invoiceData.billing_pin_code)
																? ', '
																: ''
														}${invoiceData.billing_state || ''}${
															invoiceData.billing_state && invoiceData.billing_pin_code ? ', ' : ''
														}${invoiceData.billing_pin_code || ''}${
															(invoiceData.billing_city ||
																invoiceData.billing_state ||
																invoiceData.billing_pin_code) &&
															invoiceData.billing_country
																? ', '
																: ''
														}${invoiceData.billing_country || ''}`}
													</span>
												</p>
											</div>
										</div>
									</div>
									<div className='invoice-items'>
										<table className='border border-black'>
											<thead>
												<tr>
													<th
														className='border border-black'
														style={{ fontSize: '13px' }}>
														Product
													</th>
													<th
														className='border border-black'
														style={{ fontSize: '13px' }}>
														Weight
													</th>
													<th
														className='border border-black'
														style={{ fontSize: '13px' }}>
														Rate
													</th>
													<th
														className='border border-black'
														style={{ fontSize: '13px' }}>
														Qty.
													</th>
													<th
														className='border border-black'
														style={{ fontSize: '13px' }}>
														Amount
													</th>
													{hasGst && (
														<th
															className='border border-black'
															style={{ fontSize: '13px' }}>
															GST
														</th>
													)}
													{hasDiscount && (
														<th
															className='border border-black'
															style={{ fontSize: '13px' }}>
															Dis ({invoicePlanData[0]?.isDiscountPercentage ? '%' : '₹'})
														</th>
													)}
													<th
														className='border border-black'
														style={{ fontSize: '13px' }}>
														Total
													</th>
												</tr>
											</thead>
											<tbody>
												{invoicePlanData.length == 0 ? (
													<tr>
														<td className='border border-black'>
															<div id='inv-product'>-</div>
														</td>
														<td className='border border-black'>
															<span className='inv-total'>-</span>
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
													</tr>
												) : (
													invoicePlanData.map((item: any, index: any) => {
														return (
															<tr>
																<td>
																	<div
																		id='inv-product'
																		style={{ fontSize: '12px' }}>
																		{item.item_name}
																	</div>
																</td>
																<td>
																	<span
																		className='inv-total'
																		style={{ fontSize: '12px' }}>
																		{item.item_weight
																			? `${item.item_weight} ${item.item_weight_type || ''}`
																			: '-'}
																	</span>
																</td>
																<td>
																	<span
																		className='inv-total'
																		style={{ fontSize: '12px' }}>
																		₹{item.amount || '-'}/-
																	</span>
																</td>
																<td>
																	<span
																		className='inv-paid'
																		style={{ fontSize: '12px' }}>
																		{item.quantity || '-'}
																	</span>
																</td>
																<td>
																	<span
																		className='inv-total'
																		style={{ fontSize: '12px' }}>
																		₹{item.amount * item.quantity || '-'}/-
																	</span>
																</td>
																{hasGst && (
																	<td>
																		<span
																			className='inv-paid'
																			style={{ fontSize: '12px' }}>
																			{Number(item.gst) > 0 ? `${item.gst}%` : '-'}
																		</span>
																	</td>
																)}

																{hasDiscount && (
																	<td>
																		<span
																			className='inv-paid'
																			style={{ fontSize: '12px' }}>
																			{Number(item.discount) > 0
																				? `${item.discount}${item.isDiscountPercentage ? '%' : '₹'}`
																				: '-'}
																		</span>
																	</td>
																)}
																<td>
																	<span
																		className='inv-total'
																		style={{ fontSize: '12px' }}>
																		₹{item.totalAmount ? item.totalAmount : '-'}/-
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
										<div
											className='border border-black px-0 col-md-12'
											style={{ fontSize: '12px' }}>
											<div>
												<div
													className='bill-to px-2 border-bottom border-black'
													style={{ fontSize: '13px' }}>
													Amount :
												</div>

												<div className='px-2 py-1'>
													<div className='d-flex justify-content-between'>
														<span className='fw-bold'>Amount:</span>
														<span className='fw-bold'>₹{calculateTotalProductAmount()}/-</span>
													</div>
													{hasGst && (
														<div className='d-flex justify-content-between'>
															<span>GST:</span>
															<span>+{calculateTotalGstAmount()}/-</span>
														</div>
													)}

													{Number(invoiceData.discount) > 0 && (
														<div className='d-flex justify-content-between'>
															<span>Discount:</span>
															<span>-{invoiceData.discount}/-</span>
														</div>
													)}

													{/* {serviceCharges && serviceCharges.length > 0 && (
												<>
													<hr
														className='my-2 border-dark'
														style={{ borderStyle: 'dashed' }}
													/>
													<span className='fw-bold'>Service Charges:</span>
													{serviceCharges.map((charge, index) => (
														<div key={index}>
															<div className='d-flex justify-content-between'>
																<span>{charge.charge_name}:</span>
																<span>+{charge.charge_amount}/-</span>
															</div>
														</div>
													))}
												</>
											)}

											{freightCharges && freightCharges.length > 0 && (
												<>
													<hr
														className='my-2 border-dark'
														style={{ borderStyle: 'dashed' }}
													/>
													<span className='fw-bold'>Freight Charges:</span>
													{freightCharges.map((charge, index) => (
														<div key={index}>
															<div className='d-flex justify-content-between'>
																<span>{charge.charge_name}:</span>
																<span>+{charge.charge_amount}/-</span>
															</div>
														</div>
													))}
												</>
											)} */}

													<hr
														className='my-2 border-dark'
														style={{ borderStyle: 'dashed' }}
													/>

													<div className='d-flex justify-content-between fw-bold'>
														<span>Total Amount:</span>
														<span>₹{invoiceData.net_amount || '-'}/-</span>
													</div>
													<div className='d-flex justify-content-between fw-bold'>
														<span>Paid Amount:</span>
														<span>₹{invoiceData.paid_amount || '-'}/-</span>
													</div>

													<div className='d-flex justify-content-between fw-bold'>
														<span>Due Amount:</span>
														<span>₹{dueAmount || '-'}/-</span>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-8 border border-black px-0'>
											<div className='bill-to px-2 border-bottom border-black'>Payment Details</div>
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
										<div
											id='invoice-signature'
											className='invoice-details col-md-4'>
											<div className='bill-to px-2 border-bottom border-black'>Administrator:</div>
											<div className='px-2 py-3 text-center'>
												<img
													src='/media/sign/chirag-pandey-sign.webp'
													alt='sign'
													width='90%'
												/>
											</div>
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
						<div className='col-md-12 fv-row mt-10 text-center'>
							<button
								type='button'
								className='btn btn-success'
								onClick={() => generatePDF(invoiceData.name)}>
								Download Invoice
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default NutritionCreateInvoice
