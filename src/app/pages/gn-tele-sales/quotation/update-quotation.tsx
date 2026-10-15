import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { getQuotation, updateQuotation } from '../../../Functions/FGGroup/Quotation'

interface QuotationItem {
	item_name: string
	item_type?: string
	amount: number
	gst: number
	discount: number
	totalAmount: number
	quantity: number
	isDiscountPercentage: boolean
	_id?: string
	item_weight?: number
	item_weight_type?: string
}

const NutritionUpdateQuotation: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [downloadBtn, setDownloadBtn] = useState(false)
	const [quotationId, setQuotationId] = useState('')
	const [formData, setFormData] = useState({
		date: '',
		name: '',
		branch_name: '',
		billing_address: '',
		mobile: '',
		email: '',
		items: [] as QuotationItem[],
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
		branch_name: '',
		billing_address: '',
		mobile: '',
		email: '',
		items: [] as QuotationItem[],
		payment_method: '',
		net_amount: '',
		paid_amount: '',
		note: '',
		gst: '',
		discount: '',
	})
	const [quotationPlanData, setQuotationPlanData] = useState<QuotationItem[]>([])

	const [plans, setPlans] = useState<QuotationItem[]>([
		{
			item_name: '',
			item_type: '',
			quantity: 1,
			amount: 0,
			gst: 0,
			discount: 0,
			totalAmount: 0,
			isDiscountPercentage: true,
			item_weight: 0,
			item_weight_type: 'kg',
		},
	])
	const [dueAmount, setDueAmount] = useState('')
	const adminType = localStorage.getItem('admin')

	const fetchQuotationData = async () => {
		try {
			const urlParams = new URLSearchParams(window.location.search)
			const id = urlParams.get('id')

			if (id) {
				setQuotationId(id)
				const response: any = await getQuotation({ id })

				if (response.data) {
					const quotation = response.data[0]
					const plansData: QuotationItem[] = quotation.items.map((item: any) => ({
						item_name: item.item_name,
						item_type: item.item_type || '',
						amount: item.amount,
						gst: item.gst,
						discount: item.discount,
						totalAmount: item.totalAmount,
						quantity: item.quantity,
						isDiscountPercentage:
							item.isDiscountPercentage !== undefined ? item.isDiscountPercentage : true,
						_id: item._id,
						item_weight: item.item_weight || 0,
						item_weight_type: item.item_weight_type || 'kg',
					}))

					const data = {
						date: DayJS(quotation.date).format('YYYY-MM-DD'),
						name: quotation.name,
						branch_name: quotation.branch_name,
						email: quotation.email,
						mobile: quotation.mobile,
						billing_address: quotation.billing_address?.address_line_1 || '',
						payment_method: quotation.payment_method,
						net_amount: String(quotation.net_amount),
						paid_amount: String(quotation.paid_amount),
						note: quotation.note,
						gst: String(quotation.gst || ''),
						discount: String(quotation.discount || ''),
						items: plansData,
					}

					setFormData(data)
					setQuotationData(data)
					setPlans(plansData)
					setQuotationPlanData(plansData)

					const due = quotation.net_amount - quotation.paid_amount
					setDueAmount(due.toString())
				}
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	useEffect(() => {
		fetchQuotationData()
	}, [])

	const handleUpdateQuotation = async () => {
		const plansData: any = plans.map((plan: QuotationItem) => ({
			item_name: plan?.item_name,
			item_type: plan?.item_type || undefined,
			amount: Number(plan?.amount),
			gst: Number(plan?.gst),
			discount: Number(plan?.discount),
			totalAmount: plan?.totalAmount,
			quantity: plan?.quantity,
			isDiscountPercentage: plan?.isDiscountPercentage,
			item_weight: plan?.item_weight ? Number(plan?.item_weight) : 0,
			item_weight_type: plan?.item_weight_type || undefined,
		}))

		try {
			setIsSubmitting(true)
			const payload: any = {
				id: quotationId,
				quotation_category: adminType == 'Store' ? adminType : 'Gomzi Nutrition',
				date: DayJS(formData?.date).format('YYYY/MM/DD'),
				name: formData?.name,
				branch_name: formData.branch_name,
				email: formData?.email,
				mobile: formData?.mobile,
				billing_address: { address_line_1: formData?.billing_address },
				payment_method: formData?.payment_method,
				net_amount: Number(formData?.net_amount),
				paid_amount: Number(formData?.paid_amount),
				note: formData?.note,
				items: plansData,
			}

			await updateQuotation(payload)
			toast.success('Quotation Updated Successfully')

			setQuotationData(formData)
			setQuotationPlanData(plansData)
			setDownloadBtn(true)

			const due = payload?.net_amount - payload?.paid_amount
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

	const calculateTotalPayment = (plans: QuotationItem[]) => {
		return plans.reduce((total: number, plan: QuotationItem) => {
			const quantity = plan.quantity || 0
			const amount = plan.amount || 0
			const gst = plan.gst || 0
			const discount = plan.discount || 0

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

	const handlePlanInputChange = (
		index: number,
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		const newPlans: QuotationItem[] = [...plans]

		// Type-safe assignment
		switch (name) {
			case 'item_name':
				newPlans[index].item_name = value
				break
			case 'item_type':
				newPlans[index].item_type = value
				break
			case 'quantity':
				newPlans[index].quantity = Number(value) || 0
				break
			case 'amount':
				newPlans[index].amount = Number(value) || 0
				break
			case 'gst':
				newPlans[index].gst = Number(value) || 0
				break
			case 'discount':
				newPlans[index].discount = Number(value) || 0
				break
			case 'item_weight':
				newPlans[index].item_weight = Number(value) || 0
				break
			case 'item_weight_type':
				newPlans[index].item_weight_type = value
				break
			default:
				break
		}

		const quantity = newPlans[index].quantity || 0
		const amount = newPlans[index].amount || 0
		const gst = newPlans[index].gst || 0
		let discount = newPlans[index].discount || 0

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

		newPlans[index].totalAmount = total

		setPlans(newPlans)

		// Recalculate full form's net amount
		const totalAmount: number = newPlans.reduce((sum: number, plan: QuotationItem): number => {
			return sum + (plan.totalAmount || 0)
		}, 0)

		const totalDiscount: number = newPlans.reduce((sum: number, plan: QuotationItem): number => {
			const planDiscount = plan.discount || 0
			const planQuantity = plan.quantity || 0
			const planAmount = plan.amount || 0
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
			gst: String(newPlans[index].gst),
			discount: String(totalDiscount),
		})
	}

	const addPlan = (event: any) => {
		event.preventDefault()
		setPlans([
			...plans,
			{
				item_name: '',
				item_type: '',
				quantity: 1,
				amount: 0,
				gst: 0,
				discount: 0,
				totalAmount: 0,
				isDiscountPercentage: true,
				item_weight: 0,
				item_weight_type: 'gm',
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

					const totalDiscount: number = newPlans.reduce((sum: number, plan: QuotationItem) => {
						const planDiscount = plan.discount || 0
						const planQuantity = plan.quantity || 0
						const planAmount = plan.amount || 0
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
						net_amount: newNetAmount.toFixed(2),
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

	const toggleDiscountType = (index: number) => {
		const newPlans = [...plans]
		const currentIsPercentage =
			newPlans[index].isDiscountPercentage !== undefined
				? newPlans[index].isDiscountPercentage
				: true
		const newIsPercentage = !currentIsPercentage

		// Convert discount value when switching types
		let discountValue = newPlans[index].discount || 0
		const quantity = newPlans[index].quantity || 0
		const amount = newPlans[index].amount || 0
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
		newPlans[index].discount = discountValue
		setPlans(newPlans)
	}

	// Separate event handler for textarea
	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const generatePDF = async (name: any) => {
		const quotationContent = document.getElementById('quotationContent')

		if (quotationContent) {
			// Temporarily show the quotation content
			// quotationContent.classList.remove('d-none')
			// quotationContent.classList.add('pdf-font-black')

			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			// Add margins
			const margin = 10
			const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
			const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin

			html2canvas(quotationContent, { scale: 2, useCORS: true }).then((canvas) => {
				const imgData = canvas.toDataURL('image/jpeg', 1)

				// Restore the visibility of the quotation content
				// quotationContent.classList.add('d-none')
				// quotationContent.classList.remove('pdf-font-black')

				doc.addImage(imgData, 'jpeg', margin, margin, contentWidth, contentHeight)

				const pdfName = `${name || 'demoName'}_quotation.pdf`
				doc.save(pdfName)
			})
		} else {
			console.error('Quotation content not found.')
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Quotation</PageTitle>

			{/* <h1 className='fw-bold text-dark fs-1 mb-6 '>Update Quotation</h1> */}
			<div className='row'>
				<div className='col-md-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-4'>Update Quotation</p>
							<form>
								<div className='row'>
									<div className='col-12 row'>
										{' '}
										<InputField
											className='col-md-6 fv-row'
											label='Date'
											placeholder="Date'"
											type='date'
											name='date'
											htmlFor='date'
											value={formData?.date}
											onChange={handleInputChange}
										/>{' '}
										<SelectField
											className='col-md-6 fv-row mb-7'
											label='Branch Name'
											name='branch_name'
											value={formData.branch_name}
											onChange={handleInputChange}
											htmlFor='txt_company'
											options={['Adajan', 'Katargam']}
										/>
										<InputField
											className='col-md-3 fv-row'
											label='Full Name'
											placeholder='Enter Full Name'
											type='text'
											name='name'
											htmlFor='name'
											value={formData?.name}
											onChange={handleInputChange}
										/>{' '}
										<InputField
											className='col-md-3 fv-row'
											label='Address'
											placeholder='Enter Address'
											type='text'
											name='billing_address'
											htmlFor='billing_address'
											value={formData?.billing_address}
											onChange={handleInputChange}
										/>{' '}
										<InputField
											className='col-md-3 fv-row'
											label='Phone No.'
											placeholder='Enter Phone No.'
											type='text'
											name='mobile'
											htmlFor='mobile'
											value={formData?.mobile}
											onChange={handleInputChange}
										/>{' '}
										<InputField
											className='col-md-3 fv-row'
											label='Email'
											placeholder='Enter Email'
											type='email'
											name='email'
											htmlFor='email'
											value={formData?.email}
											onChange={handleInputChange}
										/>
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
													<InputField
														className='col-md-6 fv-row'
														label='Product'
														placeholder='Enter Product'
														type='text'
														name='item_name'
														htmlFor='item_name'
														value={plan?.item_name}
														onChange={(e: any) => handlePlanInputChange(index, e)}
													/>
													{/* Item Weight Fields */}
													<div className='col-md-4 fv-row mb-7'>
														<label className='fw-bold fs-6 mb-md-5 mb-2'>Weight</label>
														<div className='d-flex align-items-center'>
															<input
																type='number'
																name='item_weight'
																value={(plan.item_weight || '').toString()}
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
														className='col-md-4 fv-row'
														label='Rate'
														placeholder='Enter Rate'
														type='number'
														name='amount'
														htmlFor='amount'
														value={(plan?.amount || '').toString()}
														onChange={(e: any) => handlePlanInputChange(index, e)}
													/>{' '}
													<InputField
														className='col-md-4 fv-row'
														label='Quantity'
														placeholder='Enter Quantity'
														type='number'
														name='quantity'
														htmlFor='quantity'
														value={(plan?.quantity || '').toString()}
														onChange={(e: any) => handlePlanInputChange(index, e)}
													/>{' '}
													<InputField
														className='col-md-4 fv-row'
														label='Amount'
														placeholder='Amount'
														type='number'
														name='totalAmount'
														htmlFor='totalAmount'
														value={`${(Number(plan?.amount) || 0) * (Number(plan?.quantity) || 0)}`}
														disabled
													/>
													<InputField
														className='col-md-4 fv-row'
														label='GST'
														placeholder='GST'
														type='number'
														name='gst'
														htmlFor='gst'
														value={(plan.gst || '').toString()}
														onChange={(e: any) => handlePlanInputChange(index, e)}
													/>
													<div className='col-md-4 fv-row'>
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
																	onChange={() => toggleDiscountType(index)}
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
															value={(plan.discount || '').toString()}
															onChange={(e: any) => handlePlanInputChange(index, e)}
														/>
													</div>
													<InputField
														className='col-md-4 fv-row'
														label='Total'
														placeholder='Total'
														type='number'
														name='totalAmount'
														htmlFor='totalAmount'
														value={(plan?.totalAmount || '').toString()}
														disabled
													/>
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

									<div className='col-12 row'>
										{' '}
										<InputField
											className='col-md-3 fv-row'
											label='Total Amount'
											placeholder='Enter Total Amount'
											type='number'
											name='net_amount'
											htmlFor='net_amount'
											value={(formData?.net_amount || '').toString()}
											onChange={handleInputChange}
										/>{' '}
									</div>
									<div className='col-md-12 fv-row mb-7'>
										<div className='d-flex justify-content-end'>
											{downloadBtn ? (
												<button
													type='button'
													className='btn btn-success mb-4 me-3'
													onClick={() => generatePDF(quotationData?.name)}>
													Download Quotation
												</button>
											) : (
												''
											)}
											<button
												type='button'
												className={`btn btn-primary btn-block mb-4 ${
													isSubmitting ? 'disabled' : ''
												}`}
												onClick={handleUpdateQuotation}
												disabled={isSubmitting}>
												{isSubmitting ? 'Please wait, updating quotation...' : 'Update Quotation'}
											</button>
										</div>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
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
									<div className='col-md-8'>
										<p className='fs-4 mb-1'>
											<b>{adminType == 'Store' ? 'Gomzi Nutrition ' : 'Gomzi Lifesciences LLP'}</b>
										</p>
										{formData.branch_name == 'Adajan' ? (
											<>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1 mb-1'>
													{adminType == 'Store'
														? 'G-23-TIME SQUARE, Gaurav Path Road, TP 10 Main Rd, Surat, Gujarat, Opp. Shree Bharti Residency, Surat, Gujarat 394510'
														: '547,548, FIRST FLOOR, RJD TEXTILES PARK, Hazira Rd, Ichchhapor, PAL, Surat, Gujarat 394510'}
												</p>
											</>
										) : formData.branch_name == 'Katargam' ? (
											<>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1 mb-1'>
													{adminType == 'Store'
														? 'G-23-TIME SQUARE, Gaurav Path Road, TP 10 Main Rd, Surat, Gujarat, Opp. Shree Bharti Residency, Surat, Gujarat 394510'
														: "323 3'rd floor, Laxmi Enclave-1, opp. Gajera School, Chitrakut Society, Katargam, Surat, Gujarat 395004"}
												</p>
											</>
										) : (
											<>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1 mb-1'>
													Address:
												</p>
											</>
										)}
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											Phone no.:
											<strong>
												{adminType == 'Store' ? '8866465275 / 9081091068' : '8320077993'}
											</strong>
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											Email:
											<strong id='emailLabel'>
												{adminType == 'Store'
													? 'gomzinutrition.palshop@gmail.com'
													: 'Sales@Gomzilifesciences.In'}
											</strong>
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											GSTIN:
											<strong>{adminType == 'Store' ? '-' : '24ABBFG3336P1Z9'}</strong>
											{adminType == 'Store' ? '' : ' , State: Gujarat'}
										</p>
									</div>
									<div className='col-md-4'>
										<div className='text-center'>
											<img
												src='/media/logos/rag-logo.webp'
												width='60%'
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
																<span className='inv-total'>
																	{item.discount || '0'}
																	{item.isDiscountPercentage !== undefined
																		? item.isDiscountPercentage
																			? '%'
																			: '₹'
																		: '%'}
																</span>
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
									<div className='col-md-7 border border-black px-0'>
										<div className='quotation-bill-to px-2 border-bottom border-black'>
											Terms and Conditions :-
										</div>
										<div className='px-2'>
											<p
												style={{ fontSize: '13px' }}
												className='mt-1'>
												<strong>*</strong> GST will be applicable additionally on all payments.
											</p>
											<p style={{ fontSize: '13px' }}>
												<strong>*</strong> Courier charges will be borne by the customer
												additionally.
											</p>
											<p style={{ fontSize: '13px' }}>
												<strong>*</strong> Payment made is non-refundable, non-transferable, and
												non-cancellable.
											</p>
											<p style={{ fontSize: '13px' }}>
												<strong>*</strong> 70% advance payment is required to confirm the order, and
												the balance 30% payment is due upon delivery, which will be verified through
												a video shared with the customer.
											</p>
										</div>
									</div>
									<div className='col-md-5 border border-black px-0'>
										<div className='quotation-bill-to px-2 border-bottom border-black'>
											Administrator :-
										</div>
										<div className='px-2'>
											<img
												src={
													adminType == 'Store'
														? '/media/sign/chirag.png'
														: '/media/sign/goutam_sir.png'
												}
												alt='sign'
												width='100%'
											/>
										</div>
									</div>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-12 border border-black px-0'>
										<div className='bill-to px-2 border-bottom border-black'>Payment Details</div>
										<div className='d-flex'>
											<div className='px-2'>
												<img
													src={
														adminType == 'Store'
															? '/media/gomzi-nutrition/payment_scan.png'
															: '/media/gomzi-nutrition/payment_scan.png'
													}
													alt='sign'
													width='120px'
												/>
											</div>
											<div className='bill-name-date px-2'>
												<p className='my-1'>
													<strong>Bank Name: Axis Bank Adajan</strong>
												</p>
												<p className='my-1'>
													<strong>Account Holder Name: Gomzi life Science LLP</strong>
												</p>
												<p className='my-1'>
													<strong>Account Number: 924020043956068</strong>
												</p>
												<p className='my-1'>
													<strong>IFSC: UTIB0000566</strong>
												</p>
												<p className='my-1'>
													<strong>Account Type: Current Account</strong>
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default NutritionUpdateQuotation
