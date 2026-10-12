import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { GetInvoice, UpdateInvoice } from '../../../Functions/GCS'
import logo from './gcs-logo.png'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const UpdateInvoicePageGcs: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoice_id: string | null = searchParams.get('invoice_id')

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

	const [dueAmount, setDueAmount] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		invoice_number: '',
		date: '',
		fullName: '',
		invoiceAddress: '',
		phoneNumber: '',
		email: '',
		productName: '',
		paymentMethod: '',
		bankDetail: '',
		totalPayment: '',
		paidPayment: '',
		invoiceNotes: '',
		termCondition: '',
		items: [
			{
				item_name: '',
				amount: '',
				totalAmount: '',
				quantity: '',
				delete: false,
				inputField: false,
			},
		],
	})
	const [invoiceData, setInvoiceData] = useState({
		invoice_number: '',
		date: '',
		fullName: '',
		invoiceAddress: '',
		phoneNumber: '',
		email: '',
		items: [],
		paymentMethod: '',
		totalPayment: '',
		paidPayment: '',
		invoiceNotes: '',
		termCondition: '',
	})
	const [plans, setPlans] = useState([
		{
			items: '',
			quantity: '',
			amount: '',
			totalPayment: '',
		},
	])

	const fetchInvoiceData = async () => {
		try {
			const response: any = await GetInvoice({ id: invoice_id })
			const data = response.data[0]

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

			const plansData = data.productName.map((plan: any) => ({
				_id: plan._id,
				item_name: plan.item_name,
				amount: plan.amount,
				totalAmount: plan.totalAmount,
				quantity: plan.quantity,
				inputField: !predefinedOptions.includes(plan.item_name),
			}))

			const setData = {
				invoice_number: data.invoice_number,
				date: DayJS(data.date).format('YYYY-MM-DD'),
				fullName: data.fullName,
				invoiceAddress: data?.invoiceAddress || '',
				phoneNumber: data.phoneNumber,
				email: data.email,
				productName: data.productName[0]?.item_name || '',
				paymentMethod: data.payment_method,
				bankDetail: data.bankDetail,
				totalPayment: data.totalPayment,
				paidPayment: data.paidPayment,
				invoiceNotes: data.invoiceNotes,
				termCondition: data.termCondition,
				items: plansData,
			}
			setInvoiceData(setData)
			setFormData(setData)
			const due = data.totalPayment - data.paidPayment
			setDueAmount(due.toString())
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchInvoiceData()
	}, [invoice_id])

	const handleUpdateInvoice = async () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

		if (!emailRegex.test(formData.email)) {
			toast.error('Please enter a valid email address')
			return
		}

		const plansData = formData.items.map((plan: any) => ({
			_id: plan._id,
			item_name: plan.item_name,
			amount: plan.amount,
			totalAmount: plan.totalAmount,
			quantity: plan.quantity,
			delete: plan.delete,
		}))

		try {
			setIsSubmitting(true)
			const payload: any = {
				id: invoice_id,
				invoice_number: Number(formData.invoice_number),
				date: DayJS(formData.date).format('YYYY/MM/DD'),
				fullName: formData.fullName,
				email: formData.email,
				phoneNumber: formData.phoneNumber,
				billing_address: formData.invoiceAddress || '',
				payment_method: formData.paymentMethod,
				totalPayment: Number(formData.totalPayment),
				paidPayment: Number(formData.paidPayment),
				invoiceNotes: formData.invoiceNotes,
				termCondition: formData.termCondition,
				invoiceAddress: formData.invoiceAddress,
				items: plansData,
			}

			await UpdateInvoice(payload)
			toast.success('Invoice Updated Successfully')

			const due = payload.totalPayment - payload.paidPayment
			setDueAmount(due.toString())
			fetchInvoiceData()
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
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

		if (name === 'quantity' || name === 'amount') {
			const quantity = parseFloat(updatedPlans[index].quantity) || 0
			const amount = parseFloat(updatedPlans[index].amount) || 0
			updatedPlans[index].totalAmount = (quantity * amount).toString()
		}

		setFormData((prevFormData) => ({
			...prevFormData,
			items: updatedPlans,
			totalPayment: calculateTotalPayment(updatedPlans).toString(),
		}))
	}

	const calculateTotalPayment = (plans: any) => {
		return plans.reduce((total: any, plan: any) => {
			if (!plan.delete) {
				const quantity = parseFloat(plan.quantity) || 0
				const amount = parseFloat(plan.amount) || 0
				return total + quantity * amount
			}
			return total
		}, 0)
	}

	const addPlan = (event: any) => {
		event.preventDefault()
		const newPlans = [
			...formData.items,
			{
				item_name: '',
				quantity: '',
				amount: '',
				totalAmount: '',
				delete: false,
				inputField: false,
			},
		]
		setFormData({ ...formData, items: newPlans })
	}

	const removePlan = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		handleDeleteFeature(index)
	}

	const handleDeleteFeature = async (index: any) => {
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
					const newPlans = [...formData.items]
					newPlans[index].delete = true // Mark the item as deleted

					// Recalculate the totalPayment for the form excluding deleted items
					const newTotalPayment = calculateTotalPayment(newPlans)

					setFormData((prevFormData) => ({
						...prevFormData,
						items: newPlans,
						totalPayment: newTotalPayment.toString(),
					}))

					toast.success('Plan Deleted Successfully')
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const generatePDF = (name: any) => {
		const invoiceContent = document.getElementById('invoiceContent')

		if (invoiceContent) {
			invoiceContent.classList.add('pdf-font-black')

			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			const margin = 10
			const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
			const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin

			html2canvas(invoiceContent, { scale: 2, useCORS: true }).then((canvas) => {
				const imgData = canvas.toDataURL('image/jpeg', 1)

				invoiceContent.classList.remove('pdf-font-black')

				doc.addImage(imgData, 'jpeg', margin, margin, contentWidth, contentHeight)

				const pdfName = `${name || 'demoName'}.pdf`
				doc.save(pdfName)
			})
		} else {
			console.error('Invoice content not found.')
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Invoice</PageTitle>
			<div className='row'>
				<div className='col-md-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-4'>Update Invoice</p>
							<form>
								<div className='row'>
									<div className='col-12 row'>
										<InputField
											className='col-md-6 fv-row'
											label='Invoice Number'
											placeholder="Invoice Number'"
											type='number'
											name='invoice_number'
											htmlFor='invoice_number'
											value={formData.invoice_number}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-6 fv-row'
											label='Date'
											placeholder="Date'"
											type='date'
											name='date'
											htmlFor='date'
											value={formData.date}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-3 fv-row'
											label='Full Name'
											placeholder='Enter Full Name'
											type='text'
											name='fullName'
											htmlFor='fullName'
											value={formData.fullName}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-3 fv-row'
											label='Address'
											placeholder='Enter Address'
											type='text'
											name='invoiceAddress'
											htmlFor='invoiceAddress'
											value={formData.invoiceAddress}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-3 fv-row'
											label='Phone No.'
											placeholder='Enter Phone No.'
											type='Number'
											name='phoneNumber'
											htmlFor='phoneNumber'
											value={formData.phoneNumber}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-3 fv-row'
											label='Email'
											placeholder='Enter Email'
											type='email'
											name='email'
											htmlFor='email'
											value={formData.email}
											onChange={handleInputChange}
										/>
									</div>

									<h1 className='mb-4'>Plans:</h1>
									{formData.items.map(
										(plan, index) =>
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
															{plan.inputField ? (
																<InputField
																	className='col-md-3 fv-row'
																	label='Plan Name'
																	placeholder='Enter Plan Name'
																	type='text'
																	name='item_name'
																	htmlFor='item_name'
																	value={plan.item_name == 'Other' ? '' : plan.item_name}
																	onChange={(e: any) => handlePlanInputChange(index, e)}
																/>
															) : (
																<SelectField
																	className='col-md-3 fv-row mb-7'
																	label='Plan Name'
																	name='item_name'
																	value={plan.item_name}
																	onChange={(e: any) => handlePlanInputChange(index, e)}
																	htmlFor='txt_company'
																	options={[
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
																		'Other',
																	]}
																/>
															)}
															<InputField
																className='col-md-3 fv-row'
																label='Quantity'
																placeholder='Enter Quantity'
																type='number'
																name='quantity'
																htmlFor='quantity'
																value={plan.quantity}
																onChange={(e: any) => handlePlanInputChange(index, e)}
															/>
															<InputField
																className='col-md-3 fv-row'
																label='Amount'
																placeholder='Enter Amount'
																type='number'
																name='amount'
																htmlFor='amount'
																value={plan.amount}
																onChange={(e: any) => handlePlanInputChange(index, e)}
															/>
															<InputField
																className='col-md-3 fv-row'
																label='Total'
																placeholder='Total'
																type='Number'
																name='totalAmount'
																htmlFor='totalAmount'
																value={plan.totalAmount}
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
											className='col-md-4 fv-row'
											label='Total Amount'
											placeholder='Enter Total Amount'
											type='Number'
											name='totalPayment'
											htmlFor='totalPayment'
											value={formData.totalPayment}
											disabled
										/>
										<InputField
											className='col-md-4 fv-row'
											label='Paid Amount'
											placeholder='Enter Paid Amount'
											type='Number'
											name='paidPayment'
											htmlFor='paidPayment'
											value={formData.paidPayment}
											onChange={handleInputChange}
										/>
										<SelectField
											className='col-md-4 fv-row mb-7'
											label='Payment Method'
											name='paymentMethod'
											value={formData.paymentMethod}
											onChange={handleInputChange}
											htmlFor='txt_company'
											options={[
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
											]}
										/>
										<TextareaField
											className='col-md-6 fv-row'
											label='Description'
											placeholder='Write description'
											name='invoiceNotes'
											htmlFor='invoiceNotes'
											value={formData.invoiceNotes}
											onChange={handleNotesChange}
										/>
										<TextareaField
											className='col-md-6 fv-row'
											label='Terms and Conditions'
											placeholder='Write termCondition'
											name='termCondition'
											htmlFor='termCondition'
											value={formData.termCondition}
											onChange={handleNotesChange}
										/>
									</div>
									<div className='col-md-12 fv-row mb-7'>
										<button
											type='button'
											className={`btn btn-primary btn-block mb-4 w-100 ${
												isSubmitting ? 'disabled' : ''
											}`}
											onClick={handleUpdateInvoice}
											disabled={isSubmitting}>
											{isSubmitting ? 'Please wait, updating invoice...' : 'Update Invoice'}
										</button>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>

				<div className='col-md-6 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<div id='invoiceContent'>
								<p className='fw-bold fs-5 text-center mb-2'>INVOICE</p>
								<div className='border'>
									<div className='invoice-header row mt-2 p-3'>
										<div className='col-md-8'>
											<p className='fs-4 mb-1'>
												<b>Gomzi Consulting Services Private Limited</b>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mt-1 mb-1'>
												2, Abhushan Bunglows, Near Alkapuri Char Rasta, Katargam, Surat - 395004
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												Phone no.: <strong>+91 97731 74522</strong>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												Email: <strong id='emailLabel'>gomziconsultingservices@gmail.com</strong>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												State: <strong id='emailLabel'>Gujarat</strong>
											</p>
										</div>
										<div className='col-md-4'>
											<div className='text-center'>
												<img
													src={logo}
													width='80%'
													alt='Company Logo'
												/>
											</div>
										</div>
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-md-5 border px-0'>
											<div className='bill-to'>Bill To</div>
											<strong>
												<p
													className='mt-2 px-2'
													style={{ fontSize: '14px' }}
													id='inv-name'>
													{invoiceData.fullName || 'Name'}
												</p>
											</strong>
											<strong>
												<p
													className='px-2'
													style={{ fontSize: '14px' }}
													id='inv-email'>
													{invoiceData.email || '-'}
												</p>
											</strong>
										</div>
										<div className='col-md-7 border text-right'>
											<div className='bill-name-date px-2'>
												<p>
													<strong>Invoice No. :</strong>
													<span id='inv-n'>{invoiceData.invoice_number || '-'}</span>
												</p>
												<p className=''>
													<strong>Date :-</strong>
													<span id='inv-date'>{invoiceData.date || '-'}</span>
												</p>
												<p className=''>
													<strong>Phone No. :-</strong>
													<span id='inv-mobile'>{invoiceData.phoneNumber || '7474478574'}</span>
												</p>
												<p className=''>
													<strong>Address :-</strong>
													<span id='inv-address'>
														{invoiceData.invoiceAddress || '502, tree house'}
													</span>
												</p>
											</div>
										</div>
									</div>
									<div className='invoice-items'>
										<table>
											<thead>
												<tr>
													<th>Services</th>
													<th>Quantity</th>
													<th>Amount</th>
													<th>Total</th>
												</tr>
											</thead>
											<tbody>
												{invoiceData.items.map((item: any, index: any) => {
													return (
														<tr>
															<td>
																<div id='inv-product'>{item.item_name}</div>
															</td>
															<td>
																<span className='inv-paid'>{item.quantity || '1'}</span>
															</td>
															<td>
																<span className='inv-total'>{item.amount || '5000'}</span>
															</td>
															<td>
																<span className='inv-total'>
																	{item.totalAmount ? item.totalAmount : '5000'}
																</span>
															</td>
														</tr>
													)
												})}
											</tbody>
										</table>
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-md-6 border px-0'>
											<div className='bill-to px-2'>Description :-</div>
											<p
												style={{ fontSize: '16px' }}
												className='px-2'>
												<b></b> <span id='inv-notes'> {invoiceData.invoiceNotes || '-'}</span>{' '}
											</p>
										</div>
										<div className='col-md-6 border px-0'>
											<div className='bill-to px-2'>Amount :-</div>
											<div className='bill-name-date px-2'>
												<p>
													<strong>Paid Amount :-</strong>
													<span className='inv-paid'> {invoiceData.paidPayment || '4000'}</span>
												</p>
												<p className=''>
													<strong>Due Amount :-</strong>
													<span id='inv-due'> {dueAmount || '-'}</span>
												</p>
												<p className=''>
													<strong>Total Amount :-</strong>
													<span className='inv-total'> {invoiceData.totalPayment || '5000'}</span>
												</p>
											</div>
										</div>
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-md-12 border px-0'>
											<div className='bill-to px-2'>Terms and Conditions :-</div>
											<div className='px-2'>
												<p
													style={{
														fontSize: '13px',
													}}
													className='mt-1'>
													<strong>*</strong> Payment neither refundable nor transferable.
												</p>
												<p
													style={{
														fontSize: '13px',
													}}
													className='mt-1'>
													<strong>*</strong> {invoiceData.termCondition}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className='col-md-12 fv-row mt-10 text-center'>
								<button
									type='button'
									className='btn btn-success'
									onClick={() => generatePDF(invoiceData.fullName)}>
									Download Invoice
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default UpdateInvoicePageGcs
