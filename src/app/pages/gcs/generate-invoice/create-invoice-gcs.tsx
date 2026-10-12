import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { CreateInvoice, GetInvoice } from '../../../Functions/GCS'
import logo from './gcs-logo.png'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const CreateInvoicePageGcs: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [inputField, setInputField] = useState(false)
	const [formData, setFormData] = useState({
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
		quantity: '',
		amount: '',
		invoiceNotes: '',
		termCondition: '',
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
			inputField: false,
		},
	])
	const [dueAmount, setDueAmount] = useState('')

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const calculateTotalPayment = (plans: any) => {
		return plans.reduce((total: any, plan: any) => {
			const quantity = parseFloat(plan.quantity) || 0
			const amount = parseFloat(plan.amount) || 0
			return total + quantity * amount
		}, 0)
	}

	const handlePlanInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		const updatedPlans: any = [...plans]

		if (name === 'items') {
			if (value === 'Other') {
				updatedPlans[index].inputField = value === 'Other'
			}
		}
		updatedPlans[index][name] = value

		if (name === 'quantity' || name === 'amount') {
			const quantity = parseFloat(updatedPlans[index].quantity)
			const amount = parseFloat(updatedPlans[index].amount)
			updatedPlans[index].totalPayment = (quantity * amount).toString()
		}

		setPlans(updatedPlans)

		const newTotalPayment = calculateTotalPayment(updatedPlans)
		setFormData({ ...formData, totalPayment: newTotalPayment.toString() })
	}

	const addPlan = (event: any) => {
		event.preventDefault()
		setPlans([
			...plans,
			{ items: '', quantity: '', amount: '', totalPayment: '', inputField: false },
		])
	}

	const removePlan = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		handleDeleteFeature(index)
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
					const updatedPlans = [...plans]
					updatedPlans.splice(index, 1)
					setPlans(updatedPlans)

					const newTotalPayment = calculateTotalPayment(updatedPlans)
					setFormData({ ...formData, totalPayment: newTotalPayment.toString() })

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

	const handleCreateInvoice = async () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

		// Validate email
		if (!emailRegex.test(formData.email)) {
			toast.error('Please enter a valid email address')
			return
		}

		const plansData = plans.map((plan: any) => ({
			item_name: plan.items,
			amount: plan.amount,
			totalAmount: plan.totalPayment,
			quantity: plan.quantity,
		}))

		try {
			setIsSubmitting(true)
			const payload: any = {
				invoice_number: Number(formData.invoice_number),
				date: DayJS(formData.date).format('YYYY/MM/DD'),
				fullName: formData.fullName,
				email: formData.email,
				phoneNumber: formData.phoneNumber,
				invoiceAddress: formData.invoiceAddress,
				payment_method: formData.paymentMethod,
				totalPayment: Number(formData.totalPayment),
				paidPayment: Number(formData.paidPayment),
				invoiceNotes: formData.invoiceNotes,
				termCondition: formData.termCondition,
				items: plansData,
			}

			await CreateInvoice(payload)
			toast.success('Invoice Created Successfully')

			setInvoiceData(formData)

			const due = payload.totalPayment - payload.paidPayment
			setDueAmount(due.toString())
			setFormData({
				invoice_number: '',
				date: '',
				fullName: '',
				invoiceAddress: '',
				phoneNumber: '',
				email: '',
				items: [],
				paymentMethod: '',
				totalPayment: '',
				quantity: '',
				amount: '',
				paidPayment: '',
				invoiceNotes: '',
				termCondition: '',
			})
			setPlans([
				{
					items: '',
					quantity: '',
					amount: '',
					totalPayment: '',
					inputField: false,
				},
			])
			fetchInvoiceData()
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const fetchInvoiceData = async () => {
		try {
			const response: any = await GetInvoice()
			if (response.data) {
				const allData = response.data
				const sortedExpenses = allData[allData.length - 1]

				setFormData((prevData: any) => ({
					...prevData,
					invoice_number: parseInt(sortedExpenses.invoice_number) + 1,
				}))
			}
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchInvoiceData()
	}, [])

	const generatePDF = (name: any) => {
		const invoiceContent = document.getElementById('invoiceContent')

		if (invoiceContent) {
			invoiceContent.classList.add('pdf-font-black')

			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			// Add margins
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
												<div className='col-md-11 row py-5 pb-0'>
													{plan.inputField ? (
														<>
															<InputField
																className='col-md-3 fv-row'
																label='Plan Name'
																placeholder='Enter Plan Name'
																type='text'
																name='items'
																htmlFor='items'
																value={plan.items == 'Other' ? '' : plan.items}
																onChange={(e: any) => handlePlanInputChange(index, e)}
															/>
														</>
													) : (
														<SelectField
															className='col-md-3 fv-row mb-7'
															label='Plan Name'
															name='items'
															value={plan.items}
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
														name='totalPayment'
														htmlFor='totalPayment'
														value={plan.totalPayment}
														disabled
													/>
												</div>
												<div className='col-md-1 d-md-block d-none'>
													<div className='mt-17 d-flex justify-content-end'>
														<TableButton
															action='remove'
															backgroundDark={true}
															onClick={(e) => removePlan(index, e)}
														/>
													</div>
												</div>
												<div className='col-md-1 d-md-none d-block'>
													<div className='mb-4 d-flex justify-content-center'>
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
										<div className='d-flex justify-content-end'>
											<button
												type='button'
												className='btn btn-success mb-4 me-3'
												onClick={() => generatePDF(invoiceData.fullName)}>
												Download Invoice
											</button>
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

				<div className='col-md-6 mt-3'>
					<h1 className='mt-14 mb-5 text-center'>GCS Invoice</h1>
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
												{invoiceData.items.length == 0 ? (
													<tr>
														<td>
															<div id='inv-product'>Demo Plan</div>
														</td>
														<td>
															<span className='inv-paid'>1</span>
														</td>
														<td>
															<span className='inv-total'>5000</span>
														</td>
														<td>
															<span className='inv-total'>5000</span>
														</td>
													</tr>
												) : (
													invoiceData.items.map((item: any, index: any) => {
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
													})
												)}
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
												{invoiceData.termCondition ? (
													<p
														style={{
															fontSize: '13px',
														}}
														className='mt-1'>
														<strong>*</strong> {invoiceData.termCondition}
													</p>
												) : (
													''
												)}
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

export default CreateInvoicePageGcs
