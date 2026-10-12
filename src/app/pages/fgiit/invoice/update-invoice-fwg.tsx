import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { GetInvoice, UpdateInvoice } from '../../../Functions/FWG'

const FWGUpdateInvoicePage: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoice_id: string | null = searchParams.get('invoice_id')
	const [selectedCompany, setSelectedCompany] = useState<string>('FGIIT')
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
	})
	const [invoiceData, setInvoiceData] = useState({
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

	const handleUpdateInvoice = async () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

		// Validate email
		if (!emailRegex.test(formData.email)) {
			toast.error('Please enter a valid email address')
			return
		}

		// Validate bank detail
		if (!formData.bankDetail || formData.bankDetail === 'Select Bank Account') {
			toast.error('Please select a bank detail')
			return
		}

		try {
			setIsSubmitting(true)
			const formDataWithCompany: any = { ...formData, selectedCompany }
			await UpdateInvoice({ id: invoice_id }, formDataWithCompany)
			toast.success('Invoice Updated Successfully')

			setInvoiceData(formDataWithCompany)

			const due = formDataWithCompany.totalPayment - formDataWithCompany.paidPayment
			setDueAmount(due.toString())
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
			const response: any = await GetInvoice({ id: invoice_id })
			const data = response.data[0]
			setInvoiceData(data)
			setFormData(data)
			const companyName = data.selectedCompany
			setSelectedCompany(companyName)
		} catch (error: any) {
			toast.error(error.message)
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
			<PageTitle breadcrumbs={[]}>Update Invoice</PageTitle>

			{/* <h1 className='fw-bold text-dark fs-1 mb-6 '>Create Invoice</h1> */}
			<div className='row'>
				<div className='col-md-6 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-4'>Update Invoice</p>
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
									className='col-md-12 fv-row'
									label='Full Name'
									placeholder='Enter Full Name'
									type='text'
									name='fullName'
									htmlFor='fullName'
									value={formData.fullName}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-12 fv-row'
									label='Address'
									placeholder='Enter Address'
									type='text'
									name='invoiceAddress'
									htmlFor='invoiceAddress'
									value={formData.invoiceAddress}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Phone No.'
									placeholder='Enter Phone No.'
									type='Number'
									name='phoneNumber'
									htmlFor='phoneNumber'
									value={formData.phoneNumber}
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
									name='productName'
									value={formData.productName}
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
										'Save In',
										'Cheque',
										'Cash',
									]}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Bank Detail'
									name='bankDetail'
									value={formData.bankDetail}
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
									type='Number'
									name='totalPayment'
									htmlFor='totalPayment'
									value={formData.totalPayment}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Paid Amount'
									placeholder='Enter Paid Amount'
									type='Number'
									name='paidPayment'
									htmlFor='paidPayment'
									value={formData.paidPayment}
									onChange={handleInputChange}
								/>
								<TextareaField
									className='col-md-12 fv-row'
									label='Notes'
									placeholder='Write Notes'
									name='invoiceNotes'
									htmlFor='invoiceNotes'
									value={formData.invoiceNotes}
									onChange={handleNotesChange}
								/>
								<div className='col-md-12 fv-row mb-7'>
									<TableButton
										action='edit'
										onClick={handleUpdateInvoice}
										text={isSubmitting ? 'Please wait, updating invoice...' : 'Update Invoice'}
										showIcon={false}
										disabled={isSubmitting}
										backgroundDark={true}
										className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
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
												<b>FitnessWithGomzi</b>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mt-1 mb-1'>
												A- 301, Ambrosia Business Hub, VIP Road, beside SMC Garden, Vesu, Surat,
												Gujarat 395007
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												Phone no.:
												<strong>8866842520</strong>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												Email:
												<strong id='emailLabel'>fitnesswithgomzi@gmail.com</strong>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												GSTIN:
												<strong>24AAGFF2816D1ZX</strong> , State: 24-Gujarat
											</p>
										</div>
										<div className='col-md-4'>
											<div className='text-center'>
												<img
													src={'/media/logos/fintess-with-gomzi-logo.png'}
													width='70%'
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
													<th>Paid Amount</th>
													<th>Total Amount</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td>
														<div id='inv-product'>{invoiceData.productName}</div>
													</td>
													<td>
														<span className='inv-paid'>{invoiceData.paidPayment || '4000'}</span>
													</td>
													<td>
														<span className='inv-total'>{invoiceData.totalPayment || '5000'}</span>
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
													style={{ fontSize: '13px' }}
													className='mt-1'>
													<strong>*</strong> Payment neither refundable nor transferable.
												</p>
												<p style={{ fontSize: '13px' }}>
													<strong>*</strong>
													Failure in Paying your fee in the due time or the allotted day can result
													in banning your course.
												</p>
												<p style={{ fontSize: '13px' }}>
													<strong>*</strong> In Case You Do Partial Payment then Second installment
													you have to pay in 15 Days
												</p>
												<p style={{ fontSize: '13px' }}>
													<strong>*</strong>
													Pausing the plan and asking for extension is strictly prohibited.
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

export default FWGUpdateInvoicePage
