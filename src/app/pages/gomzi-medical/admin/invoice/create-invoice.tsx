import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import TextareaField from '../../../../components/TextareaField'
import { createInvoice, getNextInvoiceSequence } from '../../../../Functions/FGGroup'
import { invoiceSchema } from '../../../../modules/validation/validation'

const GMCreateInvoice: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [branchName, setBranchName] = useState('')
	const [formData, setFormData] = useState({
		invoice_number: '',
		date: '',
		name: '',
		branch_name: '',
		billing_address: '',
		mobile: '',
		email: '',
		items: '',
		payment_method: '',
		bank_details: '',
		net_amount: '',
		paid_amount: '',
		note: '',
	})
	const [invoiceData, setInvoiceData] = useState({
		invoice_number: '',
		date: '',
		name: '',
		billing_address: '',
		branch_name: '',
		mobile: '',
		email: '',
		items: '',
		payment_method: '',
		bank_details: '',
		net_amount: '',
		paid_amount: '',
		note: '',
	})
	const [dueAmount, setDueAmount] = useState('')

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	// Separate event handler for textarea
	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleCreateInvoice = async (event: any) => {
		event.preventDefault()
		const { error } = invoiceSchema.validate(formData, { abortEarly: false })

		if (error) {
			error.details.forEach((detail) => toast.error(detail.message))
			return
		}

		// Validate bank detail
		if (!formData.bank_details || formData.bank_details === 'Select Bank Account') {
			toast.error('Please select a bank detail')
			return
		}

		setBranchName(formData.branch_name)
		try {
			setIsSubmitting(true)
			const payload: any = {
				invoice_category: 'FG Group',
				invoice_number: Number(formData.invoice_number),
				date: DayJS(formData.date).format('YYYY/MM/DD'),
				name: formData.name,
				branch_name: formData.branch_name,
				email: formData.email,
				mobile: formData.mobile,
				billing_address: {
					address_line_1: formData.billing_address,
				},
				bank_details: {
					account_type: formData.bank_details,
				},
				payment_method: formData.payment_method,
				net_amount: Number(formData.net_amount),
				paid_amount: Number(formData.paid_amount),
				note: formData.note,
				items: [
					{
						item_name: formData.items,
						amount: Number(formData.net_amount),
						quantity: 1,
						totalAmount: Number(formData.net_amount),
					},
				],
			}
			await createInvoice(payload)
			toast.success('Invoice Created Successfully')

			setInvoiceData(formData)

			const due = payload.net_amount - payload.paid_amount
			setDueAmount(due.toString())

			setFormData({
				invoice_number: '',
				date: '',
				name: '',
				branch_name: '',
				billing_address: '',
				mobile: '',
				email: '',
				items: '',
				payment_method: '',
				bank_details: '',
				net_amount: '',
				paid_amount: '',
				note: '',
			})

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
			const response: FGGroupAPIResponse | any = await getNextInvoiceSequence({
				invoice_category: 'FG Group',
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

	useEffect(() => {
		fetchInvoiceData()
	}, [])

	const generatePDF = (name: any) => {
		const invoiceContent = document.getElementById('invoiceContent')
		const invoiceTermAndCondition = document.getElementById('invoiceTermAndCondition')

		if (invoiceContent && invoiceTermAndCondition) {
			invoiceContent.classList.add('pdf-font-black')
			invoiceTermAndCondition.classList.add('pdf-font-black')

			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			const margin = 10
			const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
			const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin

			Promise.all([
				html2canvas(invoiceContent, { scale: 2, useCORS: true }),
				html2canvas(invoiceTermAndCondition, { scale: 2, useCORS: true }),
			]).then(([invoiceCanvas, termsCanvas]) => {
				const invoiceImg = invoiceCanvas.toDataURL('image/jpeg', 1)
				const termsImg = termsCanvas.toDataURL('image/jpeg', 1)

				invoiceContent.classList.remove('pdf-font-black')
				invoiceTermAndCondition.classList.remove('pdf-font-black')

				// Page 1 - Invoice
				doc.addImage(invoiceImg, 'JPEG', margin, margin, contentWidth, contentHeight)

				// Page 2 - Terms and Conditions
				doc.addPage()
				doc.addImage(termsImg, 'JPEG', margin, margin, contentWidth, contentHeight)

				const pdfName = `${name || 'demoName'}.pdf`
				doc.save(pdfName)
			})
		} else {
			console.error('Invoice content or terms not found.')
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Create Invoice</PageTitle>

			{/* <h1 className='fw-bold text-dark fs-1 mb-6 '>Create Invoice</h1> */}
			<div className='row'>
				<div className='col-md-6 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-4'>Create Invoice</p>
							<div className='row'>
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
									className='col-md-6 fv-row'
									label='Full Name'
									placeholder='Enter Full Name'
									type='text'
									name='name'
									htmlFor='name'
									value={formData.name}
									onChange={handleInputChange}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Branch Name'
									name='branch_name'
									value={formData.branch_name}
									onChange={handleInputChange}
									htmlFor='txt_company'
									options={['Adajan', 'Vesu', 'Katargam']}
								/>
								<InputField
									className='col-md-12 fv-row'
									label='Address'
									placeholder='Enter Address'
									type='text'
									name='billing_address'
									htmlFor='billing_address'
									value={formData.billing_address}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Phone No.'
									placeholder='Enter Phone No.'
									type='Number'
									name='mobile'
									htmlFor='mobile'
									value={formData.mobile}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Email'
									placeholder='Enter Email'
									type='email'
									name='email'
									htmlFor='email'
									value={formData.email}
									onChange={handleInputChange}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Plan Name'
									name='items'
									value={formData.items}
									onChange={handleInputChange}
									htmlFor='txt_company'
									options={[
										'Flexible Course',
										'Health and Fitness Book',
										'Anabolic Androgenic Steroids',
										'Diploma In Personal Training course',
										'Diploma In Nutrition course',
										'Group Instructor Workshop',
										'Injury Rehabilitation Workshop',
										'Advance Clinical Nutrition Workshop',
										'Nutri Trainer Course',
										'RTP-1.0_ Weight Loss Program',
										'RTP-2.0 Weight Management Program',
										'RTP-3.0 Clinical Illness',
										'RTP-4.0 Corporate Event',
										'RTP-5.0 Prep Coaching',
										'Powerlifting Coach Workshop',
										'Other',
									]}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Payment Method'
									name='payment_method'
									value={formData.payment_method}
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
										'Save In',
										'Cheque',
										'Cash',
										'None',
									]}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Bank Detail'
									name='bank_details'
									value={formData.bank_details}
									onChange={handleInputChange}
									htmlFor='txt_company'
									options={[
										'Google Pay',
										'G Saving Account',
										'F Saving Account',
										'Current Account',
									]}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Total Amount'
									placeholder='Enter Total Amount'
									type='text'
									name='net_amount'
									htmlFor='net_amount'
									value={formData.net_amount}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Paid Amount'
									placeholder='Enter Paid Amount'
									type='text'
									name='paid_amount'
									htmlFor='paid_amount'
									value={formData.paid_amount}
									onChange={handleInputChange}
								/>
								<TextareaField
									className='col-md-12 fv-row'
									label='Notes'
									placeholder='Write Notes'
									name='note'
									htmlFor='note'
									value={formData.note}
									onChange={handleNotesChange}
								/>
								<div className='col-md-12 fv-row mb-7'>
									<TableButton
										action='add'
										onClick={handleCreateInvoice}
										text={isSubmitting ? 'Please wait, creating invoice...' : 'Create Invoice'}
										showIcon={false}
										disabled={isSubmitting}
										className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
									/>
								</div>
							</div>
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
												<b>Fitness with Gomzi International Institute of Teaching</b>
											</p>
											{branchName == 'Vesu' || formData.branch_name == 'Vesu' ? (
												<>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1 mb-1'>
														A- 301, Ambrosia Business Hub, VIP Road, beside SMC Garden, Vesu, Surat,
														Gujarat 395007
													</p>

													<p
														style={{ fontSize: '10px' }}
														className='mb-1'>
														Branch Name:
														<strong> Vesu</strong>
													</p>
												</>
											) : branchName == 'Adajan' || formData.branch_name == 'Adajan' ? (
												<>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1 mb-1'>
														228-TIME SQUARE, GauravPath Road, TP 10 Main Rd, opp. Shree Bharti
														Residency, Surat, Gujarat 394510
													</p>

													<p
														style={{ fontSize: '10px' }}
														className='mb-1'>
														Branch Name:
														<strong> Adajan</strong>
													</p>
												</>
											) : branchName == 'Katargam' || formData.branch_name == 'Katargam' ? (
												<>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1 mb-1'>
														323 3'rd floor, Laxmi Enclave-1, opp. Gajera School, Chitrakut Society,
														Katargam, Surat, Gujarat 395004
													</p>

													<p
														style={{ fontSize: '10px' }}
														className='mb-1'>
														Branch Name:
														<strong> Katargam</strong>
													</p>
												</>
											) : (
												<>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1 mb-1'>
														Address:
													</p>

													<p
														style={{ fontSize: '10px' }}
														className='mb-1'>
														Branch Name:
													</p>
												</>
											)}
											<p
												style={{ fontSize: '10px' }}
												className='mb-1'>
												Phone no.:
												<strong> 8866842520</strong>
											</p>
											<p
												style={{ fontSize: '10px' }}
												className='mb-1'>
												Email:
												<strong id='emailLabel'> fitnesswithgomzi@gmail.com</strong>
											</p>
											<p
												style={{ fontSize: '10px' }}
												className='mb-1'>
												GSTIN:
												<strong> 24AAGFF2816D1ZX</strong> , State: 24-Gujarat
											</p>
										</div>
										<div className='col-md-4'>
											<div className='text-center'>
												<img
													src='/media/logos/fgiit-logo.png'
													width='60%'
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
													{invoiceData.name || '-'}
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
													<span id='inv-mobile'>{invoiceData.mobile || '-'}</span>
												</p>
												<p className=''>
													<strong>Address :-</strong>
													<span id='inv-address'>{invoiceData.billing_address || '-'}</span>
												</p>
											</div>
										</div>
									</div>
									<div className='invoice-items'>
										<table>
											<thead>
												<tr>
													<th>Services</th>
													<th>Paid Amount</th>
													<th>Total Amount</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td>
														<div id='inv-product'>{invoiceData.items}</div>
													</td>
													<td>
														<span className='inv-paid'>{invoiceData.paid_amount || '-'}</span>
													</td>
													<td>
														<span className='inv-total'>{invoiceData.net_amount || '-'}</span>
													</td>
												</tr>
											</tbody>
										</table>
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-md-6 border px-0'>
											<div className='bill-to px-2'>Description :-</div>
											<p
												style={{ fontSize: '16px' }}
												className='px-2'>
												<b></b> <span id='inv-notes'> {invoiceData.note || '-'}</span>{' '}
											</p>
										</div>
										<div className='col-md-6 border px-0'>
											<div className='bill-to px-2'>Amount :-</div>
											<div className='bill-name-date px-2'>
												<p>
													<strong>Paid Amount :-</strong>
													<span className='inv-paid'> {invoiceData.paid_amount || '-'}</span>
												</p>
												<p className=''>
													<strong>Due Amount :-</strong>
													<span id='inv-due'> {dueAmount || '-'}</span>
												</p>
												<p className=''>
													<strong>Total Amount :-</strong>
													<span className='inv-total'> {invoiceData.net_amount || '-'}</span>
												</p>
											</div>
										</div>
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-md-6 border border-black px-0'>
											<div className='bill-to px-2 border-bottom border-black'>Sign:</div>
										</div>
										<div className='col-md-6 border border-black px-0'>
											<div className='bill-to px-2 border-bottom border-black'>Administrator:</div>
											<div className='px-2 d-flex justify-content-center'>
												<img
													src={'/media/sign/goutam_sir.png'}
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
									onClick={() => generatePDF(invoiceData.name)}>
									Download Invoice
								</button>
							</div>
						</div>
					</div>
				</div>
				<div
					className='col-md-6 mt-3'
					style={{ height: '0px', overflow: 'hidden' }}>
					<div className='card'>
						<div className='card-body'>
							<div id='invoiceTermAndCondition'>
								<p className='fw-bold fs-5 text-center mb-2'>
									FGIIT Academy - Rules & Regulations for Enrolled Students
								</p>
								<div className='border'>
									<div className='invoice-details d-flex'>
										<div className='col-md-12 border px-0'>
											<div className='bill-to px-2'>Terms and Conditions :-</div>
											<div className='px-2'>
												<p
													style={{ fontSize: '10px' }}
													className='mt-1'>
													Welcome to FGIIT Academy, where we are committed to delivering
													professional education with discipline, structure, and results. Kindly
													read and follow the rules below to ensure a smooth and successful learning
													journey:
												</p>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>1. Payment Terms</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Students can enroll by paying 50% of the course fee
														initially.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> The remaining 50% must be paid within 15 days of the
														first payment or as per the date given by your counselor.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Failure to pay on or before the due date will result
														in:
														<ul>
															<li>Immediate removal from official groups.</li>
															<li>Permanent block of your student ID and learning access.</li>
															<li>
																No further communication, support, or certification eligibility.
															</li>
														</ul>
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>2. Session Attendance & Learning Mode</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> If you miss a live session, you must complete the
														topic through pre-recorded sessions available in the FGIIT App.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Live sessions will not be repeated for any individual
														under any circumstances.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Regular attendance with 75% and active participation
														are mandatory for certification.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>3. Exam Policy</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> If you miss your scheduled exam without prior
														information or approval from the FGIIT team:
														<ul>
															<li>A re-exam fee of ₹2700 will be applicable to appear again.</li>
														</ul>
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Students are expected to be responsible for tracking
														exam schedules shared in groups or app.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>4. Batch Transfer Policy</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> If you do not attend the course or wish to transfer
														to a new batch, then:
														<ul>
															<li>
																You will be required to pay 55% of your original course fee again to
																enroll in the new batch.
															</li>
														</ul>
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Batch transfers are subject to approval and
														availability and are considered only once per student.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>5. Refund & Cancellation Policy</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> All fees paid are strictly non-refundable and
														non-transferable.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> No refunds will be granted under any circumstances,
														including withdrawal or dissatisfaction.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>6. Platform Access & Usage</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> All study material, videos, notes, and assessments
														are available only through the official FGIIT App.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Do not share your login credentials. Sharing or
														misuse may result in termination of your access & Legal Action.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>7. Group Etiquette & Professional Conduct</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Be respectful in all official groups and platforms.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Misbehavior, spamming, or any form of disrespect
														towards Faculty or staff will result in immediate removal from the
														course without notice.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>8. Certification Eligibility</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> To receive your certificate, you must:
														<ul>
															<li>Complete the course successfully</li>
															<li>Submit all assessments</li>
															<li>Clear the final exam</li>
															<li>Ensure full payment of your course fee</li>
														</ul>
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
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
			</div>
		</>
	)
}

export default GMCreateInvoice
