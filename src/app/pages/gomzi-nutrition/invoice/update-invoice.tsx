import html2pdf from 'html2pdf.js'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TermAndCondition from '../../../components/TermAndCondition'
import TextareaField from '../../../components/TextareaField'
import {
	getInvoice,
	GetProductStocks,
	GetTrainers,
	updateInvoice,
} from '../../../Functions/FGGroup'
import './style.css'

// Add interfaces for location data

interface ChargeItem {
	charge_name: string
	charge_amount: number
}

const predefinedOptions = [
	'All plan',
	'Marketing Guru',
	'Portfolio management service',
	'Management Consultation',
	'Business management course',
	'Digital marketing course',
	'Stock market course',
	'Content shoot & Edit',
	'Graphics designing',
	'Social Media marketing',
	'Website designing and development',
	'Paid Advertisement',
	'Content writing',
	'SEO- Search engine optimization',
	'SEM- Search engine management',
	'GMB- Google my business profile maintain',
	'ERP setup and service',
	'Business solution',
	'Logo design',
]

const NutritionUpdateInvoice: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoice_id: string | null = searchParams.get('invoice_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState<any>({
		invoice_number: '',
		date: '',
		name: '',
		// Update billing address fields
		billing_address_line_1: '',
		billing_country: '',
		billing_state: '',
		billing_city: '',
		billing_pin_code: '',
		mobile: '',
		gst_number: '',
		pan_number: '',
		email: '',
		duration: '',
		duration_number: '',
		items: [
			{
				product_id: '',
				variant_id: '',
				item_name: '',
				item_type: '',
				item_weight: '',
				item_weight_type: 'kg',
				amount: '',
				totalAmount: '',
				quantity: '',
				duration: '',
				duration_number: '',
				delete: false,
				inputField: false,
				isDiscountPercentage: true,
			},
		],
		payment_method: '',
		gst: '',
		discount: '',
		net_amount: '',
		paid_amount: '',
		note: '',
		branch_name: '',
		sales_person: '',
		other_sales_person: '',
		service_charge: [],
		freight_charges: [],
	})
	const [invoiceData, setInvoiceData] = useState<any>({
		invoice_number: '',
		date: '',
		name: '',
		// Update billing address fields
		billing_address_line_1: '',
		billing_country: '',
		billing_state: '',
		billing_city: '',
		billing_pin_code: '',
		duration: '',
		duration_number: '',
		mobile: '',
		gst_number: '',
		pan_number: '',
		email: '',
		items: [],
		payment_method: '',
		amount: '',
		gst: '',
		discount: '',
		net_amount: '',
		paid_amount: '',
		note: '',
		item_weight: '',
		item_type: '',
		item_weight_type: '',
		branch_name: '',
		sales_person: '',
		other_sales_person: '',
		service_charge: [],
		freight_charges: [],
	})
	const [dueAmount, setDueAmount] = useState('')
	const [serviceCharges, setServiceCharges] = useState<ChargeItem[]>([])
	const [freightCharges, setFreightCharges] = useState<ChargeItem[]>([])
	const [salesPersonList, setSalesPersonList] = useState<any[]>([])
	const [productList, setProductList] = useState<any[]>([])

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

	const fetchInvoiceData = async () => {
		try {
			const response: any = await getInvoice({ id: String(invoice_id) })
			const data = response.data[0]


			const parseDuration = (durationString: string) => {
				if (!durationString) return { duration_number: '', duration: '' }
				const [number, unit] = durationString.split(' ')
				return {
					duration_number: parseInt(number),
					duration: unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase(), // e.g., "days" → "Days"
				}
			}

			const plansData = data.items.map((plan: any) => {
				const { duration_number, duration } = parseDuration(plan.duration)

				// Use the isDiscountPercentage field from the plan if available, otherwise determine based on value
				const isDiscountPercentage =
					plan?.isDiscountPercentage !== undefined
						? plan.isDiscountPercentage
						: (() => {
								// Determine discount type based on value: < 100 = percentage, >= 100 = rupee
								const discountValue = parseFloat(plan?.discount) || 0
								const amountValue = parseFloat(plan?.amount) || 0
								return amountValue > 0 ? discountValue < 100 : true
						  })()

				return {
					_id: plan?._id,
					product_id: plan?.product_id,
					variant_id: plan?.variant_id,
					item_name: plan?.item_name,
					item_type: plan?.item_type || '',
					item_weight: plan?.item_weight || '',
					item_weight_type: plan?.item_weight_type || 'kg',
					amount: plan?.amount,
					totalAmount: plan?.totalAmount,
					quantity: plan?.quantity,
					gst: plan?.gst || '',
					discount: plan?.discount || '',
					inputField: !predefinedOptions.includes(plan.item_name),
					duration_number,
					duration,
					isDiscountPercentage,
				}
			})

			const setData = {
				invoice_number: data?.invoice_number,
				date: DayJS(data?.date).format('YYYY-MM-DD'),
				name: data?.name,
				// Update billing address fields to match new structure
				billing_address_line_1: data?.billing_address?.address_line_1 || '',
				billing_country: data?.billing_address?.country || '',
				billing_state: data?.billing_address?.state || '',
				billing_city: data?.billing_address?.city || '',
				billing_pin_code: data?.billing_address?.pin_code || '',
				mobile: data?.mobile,
				gst_number: data?.gst_number,
				pan_number: data?.pan_number,
				email: data?.email,
				items: plansData,
				payment_method: data?.payment_method,
				net_amount: data?.net_amount,
				paid_amount: data?.paid_amount,
				note: data?.note,
				gst: data?.gst || '',
				discount: data?.discount || '',
				service_charge: data?.service_charge || [],
				freight_charges: data?.freight_charges || [],
				branch_name: data?.branch_name || '',
				sales_person: data?.sales_person || '',
				other_sales_person: data?.other_sales_person || '',
			}
			setFormData(setData)
			setInvoiceData({
				...setData,
				sales_person:
					data?.sales_person === 'N/A'
						? data?.other_sales_person
						: salesPersonList.find((e: any) => e.employee_id === data?.sales_person)?.full_name ||
						  data?.sales_person,
			})

			const due = data?.net_amount - data?.paid_amount
			setDueAmount(due.toString())
			setServiceCharges(data?.service_charge || [])
			setFreightCharges(data?.freight_charges || [])
		} catch (error) {
			console.error(error)
		}
	}

	// Update net amount when service charges or freight charges change
	useEffect(() => {
		// Calculate total amount from items
		const totalAmount: number = formData.items.reduce((sum: number, item: any): number => {
			if (!item.delete) {
				return sum + (parseFloat(item.totalAmount) || 0)
			}
			return sum
		}, 0)

		// Update form data with new net amount including charges
		setFormData((prevFormData: any) => ({
			...prevFormData,
			net_amount: String(totalAmount + serviceChargeTotal + freightChargeTotal),
		}))

		// Update due amount
		const paidAmount = parseFloat(formData.paid_amount) || 0
		const newDueAmount = totalAmount + serviceChargeTotal + freightChargeTotal - paidAmount
		setDueAmount(newDueAmount.toString())
	}, [serviceCharges, freightCharges, formData.items, formData.paid_amount])

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

	useEffect(() => {
		const initializeData = async () => {
			fetchSalesPersons()
			// Then load invoice data
			await fetchInvoiceData()
			fetchProducts()
		}

		initializeData()
	}, [])

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

	const handleUpdateInvoice = async () => {
		if (!formData.sales_person) {
			toast.error('Please select Sales Person')
			return
		}

		if (formData.sales_person === 'N/A' && !formData.other_sales_person) {
			toast.error('Please enter sales person name')
			return
		}
		const plansData = formData.items.map((plan: any) => ({
			_id: plan?._id,
			product_id: plan?.product_id,
			variant_id: plan?.variant_id,
			item_name: plan?.item_name,
			item_type: plan?.item_type || undefined,
			item_weight: plan?.item_weight ? Number(plan?.item_weight) : 0,
			item_weight_type: plan?.item_weight_type || undefined,
			amount: Number(plan?.amount),
			gst: Number(plan?.gst),
			discount: Number(plan?.discount),
			totalAmount: plan?.totalAmount,
			quantity: plan?.quantity,
			duration: plan?.duration_number + ' ' + plan?.duration,
			delete: plan?.delete,
			isDiscountPercentage: plan?.isDiscountPercentage,
		}))

		const totalAmount: number = plansData.reduce((sum: number, plan: any): number => {
			return sum + (parseFloat(plan.totalAmount) || 0)
		}, 0)

		const totalDiscount: number = plansData.reduce((sum: number, plan: any): number => {
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

		try {
			setIsSubmitting(true)
			const payload: any = {
				id: invoice_id,
				invoice_number: Number(formData?.invoice_number),
				date: DayJS(formData?.date).format('YYYY/MM/DD'),
				name: formData?.name,
				email: formData?.email,
				mobile: formData?.mobile,
				gst_number: formData?.gst_number,
				pan_number: formData?.pan_number,
				// Update billing address structure to match backend model
				billing_address: {
					address_line_1: formData?.billing_address_line_1,
					city: formData?.billing_city,
					state: formData?.billing_state,
					pin_code: formData?.billing_pin_code,
					country: formData?.billing_country,
				},
				payment_method: formData?.payment_method,
				amount: Number(totalAmount),
				gst: Number(plansData[0]?.gst),
				discount: Number(totalDiscount),
				net_amount: Number(formData?.net_amount),
				paid_amount: parseInt(formData?.paid_amount),
				note: formData?.note,
				items: plansData,
				branch_name: formData?.branch_name,
				sales_person: formData?.sales_person,
				other_sales_person: formData?.other_sales_person,
				service_charge: serviceCharges.filter(
					(charge) => charge.charge_name && charge.charge_amount
				),
				freight_charges: freightCharges.filter(
					(charge) => charge.charge_name && charge.charge_amount
				),
			}
			await updateInvoice(payload)
			toast.success('Invoice Updated Successfully')
			const due = payload?.net_amount - payload?.paid_amount
			setDueAmount(due.toString())
			fetchInvoiceData()
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
			margin: [8, 8, 8, 8] as [number, number, number, number],
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

	const handleDeleteFeature = async (index: number) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					const updatedPlans = [...formData.items]
					updatedPlans[index].delete = true // Soft-delete

					// Filter out deleted items for calculation
					const activePlans = updatedPlans.filter((plan) => !plan.delete)

					const totalAmount: number = activePlans.reduce((sum, plan) => {
						return sum + (parseFloat(plan.totalAmount) || 0)
					}, 0)

					const totalDiscount: number = activePlans.reduce((sum, plan) => {
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
					const totalWithCharges = totalAmount + serviceChargeTotal + freightChargeTotal
					const due = totalWithCharges - paidAmount

					setFormData((prevFormData: any) => ({
						...prevFormData,
						items: updatedPlans,
						net_amount: totalWithCharges.toFixed(0),
						discount: totalDiscount.toFixed(0),
					}))

					setDueAmount(due.toFixed(0))
					toast.success('Plan Deleted Successfully')
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	// Update the handleInputChange function to handle the new address fields
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

	const handlePlanInputChange = (
		index: number,
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		const updatedPlans: any = [...formData.items]

		if (name === 'item_name') {
			if (predefinedOptions.includes(value)) {
				updatedPlans[index].inputField = value === 'Other'
			} else {
				updatedPlans[index].inputField = true
			}
		}

		updatedPlans[index][name] = value

		const quantity = parseFloat(updatedPlans[index].quantity) || 0
		const amount = parseFloat(updatedPlans[index].amount) || 0
		const gst = parseFloat(updatedPlans[index].gst) || 0
		const discount = parseFloat(updatedPlans[index].discount) || 0

		// Apply discount type logic
		const isDiscountPercentage =
			updatedPlans[index].isDiscountPercentage !== undefined
				? updatedPlans[index].isDiscountPercentage
				: true
		// We only convert for calculation, not for display
		let discountForCalculation = discount
		if (name === 'discount' && discount > 0) {
			const baseAmount = quantity * amount
			if (isDiscountPercentage) {
				// For percentage, convert to rupee value for calculation but keep the percentage value for display
				discountForCalculation = (baseAmount * discount) / 100
			}
		}

		let total = quantity * amount

		if (gst) {
			total += (total * gst) / 100
		}

		if (discountForCalculation) {
			// Apply discount based on type
			const baseAmount = quantity * amount
			if (isDiscountPercentage) {
				// Convert percentage to rupee value for calculation
				const discountRupee = (baseAmount * discount) / 100
				total -= discountRupee
			} else {
				// Already in rupee value
				total -= discount
			}
		}

		updatedPlans[index].totalAmount = total.toFixed(0)

		const totalAmount: number = updatedPlans.reduce((sum: number, plan: any) => {
			return sum + (parseFloat(plan.totalAmount) || 0)
		}, 0)

		setFormData((prevFormData: any) => ({
			...prevFormData,
			items: updatedPlans,
			net_amount: String(totalAmount + serviceChargeTotal + freightChargeTotal),
		}))
	}

	// Calculate total product amount without discount and GST
	const calculateTotalProductAmount = (): number => {
		return invoiceData.items.reduce((sum: number, item: any) => {
			const quantity = parseFloat(item.quantity?.toString() || '0') || 0
			const amount = parseFloat(item.amount?.toString() || '0') || 0
			return sum + quantity * amount
		}, 0)
	}

	const removePlan = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		handleDeleteFeature(index)
	}

	// Separate event handler for textarea
	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	// Calculate totals for charges
	const serviceChargeTotal = serviceCharges.reduce(
		(sum, charge) => sum + (charge.charge_amount || 0),
		0
	)
	const freightChargeTotal = freightCharges.reduce(
		(sum, charge) => sum + (charge.charge_amount || 0),
		0
	)
	const totalCharges = serviceChargeTotal + freightChargeTotal

	const hasGst = invoiceData.items.some((item: any) => Number(item.gst) > 0)

	const hasDiscount = invoiceData.items.some((item: any) => Number(item.discount) > 0)

	const handleProductChange = (index: number, selectedName: string) => {
		const updatedPlans = [...formData.items]

		if (selectedName === 'Other / Manual') {
			updatedPlans[index].product_id = ''
			updatedPlans[index].variant_id = ''
			updatedPlans[index].item_name = ''
			updatedPlans[index].amount = ''

			setFormData({
				...formData,
				items: updatedPlans,
			})

			return
		}

		const product: any = productOptions.find((x) => x.label === selectedName)

		if (!product) return

		updatedPlans[index].product_id = product.product_id
		updatedPlans[index].variant_id = product.variant_id
		updatedPlans[index].item_name = product.label
		updatedPlans[index].amount = String(product.amount)

		setFormData({
			...formData,
			items: updatedPlans,
		})
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Invoice</PageTitle>

			{/* <h1 className='fw-bold text-dark fs-1 mb-6 '>Create Invoice</h1> */}
			<div className='row'>
				<div className='col-md-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-4'>Update Invoice</p>

							<form>
								<div className='row'>
									<div className='col-12 row'>
										<InputField
											className='col-md-4 fv-row'
											label='Invoice Number'
											placeholder="Invoice Number'"
											type='number'
											name='invoice_number'
											htmlFor='invoice_number'
											value={formData?.invoice_number}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-4 fv-row'
											label='Branch Name'
											placeholder="Branch Name'"
											type='text'
											name='branch_name'
											htmlFor='branch_name'
											value={formData?.branch_name}
											onChange={handleInputChange}
										/>
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
															key={emp._id}
															value={emp._id}>
															{emp.full_name}
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
											label='Date'
											placeholder="Date'"
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
											label='Phone No.'
											placeholder='Enter Phone No.'
											type='Number'
											name='mobile'
											htmlFor='mobile'
											value={formData?.mobile}
											onChange={handleInputChange}
										/>
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
											placeholder='Enter GST Number'
											type='text'
											name='gst_number'
											htmlFor='gst_number'
											value={formData?.gst_number}
											onChange={handleInputChange}
										/>
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

										<h1 className='mb-4'>Billing Address:</h1>
										<div className='col-12 mb-5'>
											<div
												className='row py-5 pb-0'
												style={{
													border: '1px solid #00000008',
													borderRadius: '10px',
													backgroundColor: '#00000008',
												}}>
												{/* <SelectField
													className='col-md-4 fv-row mb-7'
													label='Country'
													name='billing_country'
													value={formData.billing_country}
													onChange={handleInputChange}
													htmlFor='billing_country'
													options={countries.map((country) => country.name)}
													disabled={loadingCountries}
												/> */}
												<InputField
													className='col-md-4 fv-row mb-7'
													label='State'
													placeholder='Enter State'
													type='text'
													name='billing_state'
													htmlFor='billing_state'
													value={formData?.billing_state}
													onChange={handleInputChange}
												/>

												<InputField
													className='col-md-4 fv-row mb-7'
													label='City'
													placeholder='Enter City'
													type='text'
													name='billing_city'
													htmlFor='billing_city'
													value={formData?.billing_city}
													onChange={handleInputChange}
												/>
												<InputField
													className='col-md-8 fv-row'
													label='Address'
													placeholder='Enter Address'
													type='text'
													name='billing_address_line_1'
													htmlFor='billing_address_line_1'
													value={formData?.billing_address_line_1}
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
												/>
											</div>
										</div>
									</div>

									<h1 className='mb-4'>Product:</h1>
									{formData.items.map(
										(plan: any, index: any) =>
											!plan.delete && (
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
														<div className='col-md-11 row py-5 pb-0'>
															<SelectField
																className='col-md-2 fv-row mb-7'
																label='Product Type'
																name='item_type'
																value={plan?.item_type || ''}
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
															{(plan.product_id || plan.variant_id) && (
																<SelectField
																	className='col-md-3'
																	label='Product'
																	htmlFor='product'
																	name='items'
																	value={
																		productOptions.find(
																			(x: any) =>
																				x.product_id === plan.product_id &&
																				x.variant_id === plan.variant_id
																		)?.label || ''
																	}
																	options={productOptions.map((x) => x.label)}
																	onChange={(e) => handleProductChange(index, e.target.value)}
																/>
															)}
															{!plan.product_id && !plan.variant_id && (
																<InputField
																	className='col-md-4 fv-row'
																	label='Product'
																	placeholder='Enter Product'
																	type='text'
																	name='item_name'
																	htmlFor='item_name'
																	value={plan?.item_name}
																	onChange={(e: any) => handlePlanInputChange(index, e)}
																/>
															)}
															<div className='col-md-3 fv-row mb-7'>
																<label
																	className='fw-bold fs-6 mb-md-5 mb-2'
																	htmlFor={`item_weight_${index}`}>
																	Weight
																</label>
																<div className='d-flex align-items-center'>
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
																type='number'
																name='amount'
																htmlFor='amount'
																value={plan?.amount}
																onChange={(e: any) => handlePlanInputChange(index, e)}
															/>
															<InputField
																className='col-md-3 fv-row'
																label='Quantity'
																placeholder='Enter Quantity'
																type='number'
																name='quantity'
																htmlFor='quantity'
																value={plan?.quantity}
																onChange={(e: any) => handlePlanInputChange(index, e)}
															/>
															<InputField
																className='col-md-3 fv-row'
																label='Amount'
																placeholder='Amount'
																type='Number'
																name='totalPayment'
																htmlFor='totalPayment'
																value={`${
																	(Number(plan?.amount) || 0) * (Number(plan?.quantity) || 0)
																}`}
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
																			className='form-check-input w-25px h-15px'
																			type='checkbox'
																			id={`discountTypeSwitch-${index}`}
																			checked={
																				plan.isDiscountPercentage !== undefined
																					? plan.isDiscountPercentage
																					: true
																			}
																			onChange={() => {
																				const updatedPlans = [...formData.items]
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

																				updatedPlans[index].isDiscountPercentage = newIsPercentage
																				updatedPlans[index].discount = discountValue.toString()
																				setFormData({
																					...formData,
																					items: updatedPlans,
																				})
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
																type='Number'
																name='totalPayment'
																htmlFor='totalPayment'
																value={plan?.totalAmount}
																disabled
															/>
														</div>
														<div className='col-md-1'>
															<div className='mt-md-17 mb-md-0 mb-5 d-flex justify-content-md-end justify-content-center'>
																<TableButton
																	action='remove'
																	backgroundDark={true}
																	onClick={(e) => removePlan(index, e)}
																/>
															</div>
														</div>
													</div>
												</div>
											)
									)}

									<div className='col-12 row'>
										<InputField
											className='col-md-3 fv-row'
											label='Total Amount'
											placeholder='Enter Total Amount'
											type='text'
											name='net_amount'
											htmlFor='net_amount'
											value={formData?.net_amount}
											onChange={handleInputChange}
											disabled
										/>
										<InputField
											className='col-md-3 fv-row'
											label='Paid Amount'
											placeholder='Enter Paid Amount'
											type='text'
											name='paid_amount'
											htmlFor='paid_amount'
											value={formData?.paid_amount}
											onChange={handleInputChange}
										/>
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
										/>
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
											<button
												type='button'
												className='btn btn-success mb-4 me-3'
												onClick={() => generatePDF(invoiceData?.name)}>
												Download Invoice
											</button>
											<button
												type='button'
												className={`btn btn-primary btn-block mb-4 ${
													isSubmitting ? 'disabled' : ''
												}`}
												onClick={handleUpdateInvoice}
												disabled={isSubmitting}>
												{isSubmitting ? 'Please wait, updating invoice...' : 'Update Invoice'}
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
				<div className='card'>
					<div className='card-body'>
						<div id='invoiceContent'>
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
									<div className='col-md-6 border border-black px-0'>
										<div
											className='bill-to border-bottom border-black'
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
									<div className='col-md-6 border border-black text-right'>
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
												{/* <th
													className='border border-black'
													style={{ fontSize: '13px' }}>
													Flavor
												</th> */}
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
														Dis
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
											{invoiceData.items.length == 0 ? (
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
												invoiceData.items.map((item: any, index: any) => {
													return (
														<tr key={index}>
															<td>
																<div
																	id='inv-product'
																	style={{ fontSize: '12px' }}>
																	{item.item_name}
																</div>
															</td>
															{/* <td>
																<div
																	id='inv-product'
																	style={{ fontSize: '12px' }}>
																	{item.flavor}
																</div>
															</td> */}
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
																	className='inv-paid'
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
									<div className={'border border-black px-0 col-md-12'}>
										<div>
											{invoiceData.note && (
												<>
													<div
														className='bill-to px-2 border-bottom border-black'
														style={{ fontSize: '13px' }}>
														Description :-
													</div>
													<p
														style={{ fontSize: '12px' }}
														className='px-2'>
														<span id='inv-notes'>{invoiceData.note}</span>
													</p>
												</>
											)}
											<div
												className='bill-to px-2 border-bottom border-black'
												style={{ fontSize: '13px' }}>
												Amount :-
											</div>
											<div className='bill-name-date px-2 py-1'>
												<div className='d-flex justify-content-between'>
													<span
														className='fw-bold'
														style={{ fontSize: '12px' }}>
														Amount:
													</span>
													<span
														className='fw-bold'
														style={{ fontSize: '12px' }}>
														₹{calculateTotalProductAmount()}/-
													</span>
												</div>
												{hasGst && (
													<div className='d-flex justify-content-between'>
														<span style={{ fontSize: '12px' }}>GST:</span>
														<span style={{ fontSize: '12px' }}>
															+
															{invoiceData.items.reduce((sum: number, item: any) => {
																const itemGst = parseFloat(item.gst) || 0
																const itemAmount = parseFloat(item.amount) || 0
																const itemQuantity = parseFloat(item.quantity) || 0
																const baseAmount = itemAmount * itemQuantity
																const gstAmount = (baseAmount * itemGst) / 100

																return sum + gstAmount
															}, 0)}
															/-
														</span>
													</div>
												)}

												{hasDiscount && (
													<div className='d-flex justify-content-between'>
														<span style={{ fontSize: '12px' }}>Discount:</span>
														<span style={{ fontSize: '12px' }}>
															-{invoiceData.discount || '-'}/-
														</span>
													</div>
												)}

												<hr
													className='my-2 border-dark'
													style={{ borderStyle: 'dashed' }}
												/>

												<div className='d-flex justify-content-between fw-bold'>
													<span style={{ fontSize: '12px' }}>Total Amount:</span>
													<span style={{ fontSize: '12px' }}>
														₹{invoiceData.net_amount || '-'}/-
													</span>
												</div>
												<div className='d-flex justify-content-between fw-bold'>
													<span style={{ fontSize: '12px' }}>Paid Amount:</span>
													<span style={{ fontSize: '12px' }}>
														{invoiceData.paid_amount || '-'}/-
													</span>
												</div>

												<div className='d-flex justify-content-between fw-bold'>
													<span style={{ fontSize: '12px' }}>Due Amount:</span>
													<span style={{ fontSize: '12px' }}>₹{dueAmount || '-'}/-</span>
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
						<div className='col-md-12 fv-row mt-10 text-center'>
							<button
								type='button'
								className='btn btn-success'
								onClick={() => generatePDF(invoiceData?.name)}>
								Download Invoice
							</button>
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
		</>
	)
}

export default NutritionUpdateInvoice
