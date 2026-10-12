import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { components } from 'react-select'
import { AsyncPaginate } from 'react-select-async-paginate'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { loadUserOptionsFWG } from '../../../components/loadUserOptionsFWG'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { GetInvoice, GetUser, UpdateInvoice } from '../../../Functions/FWG'
import UserImg from '../../../pages/adajan-branch/total-sales/300-1.jpg'

const UpdateInvoicePage: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoice_id: any = searchParams.get('invoice_id')
	const [selectedCompany, setSelectedCompany] = useState<string>('FGIIT')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [value, onChange] = useState<any>(null)
	const [isDiscountPercentage, setIsDiscountPercentage] = useState(true)
	const [formData, setFormData] = useState({
		invoice_number: '',
		date: '',
		user_id: '',
		fullName: '',
		branch_name: 'Adajan',
		invoiceAddress: '',
		phoneNumber: '',
		email: '',
		productName: '',
		paymentMethod: '',
		bankDetail: '',
		amount: '',
		gst: '',
		discount: '',
		totalPayment: '',
		paidPayment: '',
		invoiceNotes: '',
		invoice_category: 'FWG',
	})
	const [invoiceData, setInvoiceData] = useState<any>({
		invoice_number: '',
		date: '',
		fullName: '',
		invoiceAddress: '',
		phoneNumber: '',
		email: '',
		branch_name: 'Adajan',
		productName: '',
		paymentMethod: '',
		bankDetail: '',
		amount: '',
		gst: '',
		discount: '',
		totalPayment: '',
		paidPayment: '',
		invoiceNotes: '',
		invoice_category: 'FWG',
	})
	const [dueAmount, setDueAmount] = useState('')

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		const data = { ...formData, [name]: value }

		const amt = +data.amount
		const gst = +data.gst
		let dis = +data.discount

		// Calculate discount based on type (percentage or rupee)
		if (name === 'discount' || name === 'amount' || name === 'gst') {
			if (!isDiscountPercentage) {
				// If in rupee mode, use the value as is
				dis = +data.discount
			} else {
				// If in percentage mode, convert to rupee
				dis = (amt * dis) / 100
			}
			data.totalPayment = (amt * (1 + gst / 100) - dis).toFixed(0)
		}

		setFormData(data)
	}

	const toggleDiscountType = () => {
		const newIsPercentage = !isDiscountPercentage
		setIsDiscountPercentage(newIsPercentage)

		const amt = +formData.amount
		const gst = +formData.gst

		const totalPayment = (amt * (1 + gst / 100)).toFixed(0)

		setFormData({
			...formData,
			discount: '',
			totalPayment: totalPayment,
		})
	}

	// Separate event handler for textarea
	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleUpdateInvoice = async (event: any) => {
		event.preventDefault()
		// Validate bank detail
		if (!formData.bankDetail || formData.bankDetail === 'Select Bank Account') {
			toast.error('Please select a bank detail')
			return
		}

		if (formData.amount === '' || isNaN(Number(formData.amount)) || Number(formData.amount) < 0) {
			toast.error('Please enter a valid amount')
			return
		}

		if (formData.gst === '' || isNaN(Number(formData.gst)) || Number(formData.gst) < 0) {
			toast.error('Please enter a valid GST value')
			return
		}

		if (
			formData.discount === '' ||
			isNaN(Number(formData.discount)) ||
			Number(formData.discount) < 0
		) {
			toast.error(
				`Please enter a valid discount value in ${isDiscountPercentage ? 'percentage' : 'rupees'}`
			)
			return
		}

		if (isDiscountPercentage && Number(formData.discount) > 100) {
			toast.error('Discount percentage cannot exceed 100%')
			return
		}
		if (!isDiscountPercentage && Number(formData.discount) > Number(formData.amount)) {
			toast.error('Discount in rupees cannot exceed the total amount')
			return
		}

		if (!formData.branch_name) {
			toast.error('Please select a Branch Name')
		} else {
			try {
				setIsSubmitting(true)

				const payload: any = {
					selectedCompany,
					invoice_number: Number(formData.invoice_number),
					date: DayJS(formData.date).format('YYYY/MM/DD'),
					fullName: formData.fullName,
					branch_name: formData.branch_name,
					user_id: value?.value ? value?.value : formData.user_id,
					email: formData.email,
					phoneNumber: formData.phoneNumber,
					invoiceAddress: formData.invoiceAddress,
					bankDetail: formData.bankDetail,
					paymentMethod: formData.paymentMethod,
					amount: Number(formData.amount),
					gst: Number(formData.gst),
					discount: Number(formData.discount),
					totalPayment: Number(formData.totalPayment),
					paidPayment: Number(formData.paidPayment),
					invoiceNotes: formData.invoiceNotes,
					productName: formData.productName,
					discount_type: isDiscountPercentage ? 'percentage' : 'rupee',
					invoice_category: formData.invoice_category || 'FWG',
				}

				await UpdateInvoice({ id: invoice_id }, payload)
				toast.success('Invoice Updated Successfully')

				setInvoiceData(payload)

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
	}
	const fetchInvoiceData = async () => {
		try {
			const response: any = await GetInvoice({
				...(invoice_id && { search: invoice_id }),
			})
			const data = response.data[0]
			setInvoiceData(data)
			setFormData((prev) => ({
				...prev,
				...data,
				invoice_category: data?.invoice_category || prev.invoice_category || 'FWG',
			}))

			// Determine discount type based on the value
			if (data?.discount !== undefined) {
				const discountValue = +data.discount
				const amountValue = +data.amount
				if (!isNaN(discountValue) && !isNaN(amountValue) && amountValue > 0) {
					// Set discount type based on value: < 100 = percentage, >= 100 = rupee
					setIsDiscountPercentage(discountValue < 100)
				}
			}

			if (data.user_id) {
				const userRes: any = await GetUser({ id: data.user_id })
				const user = userRes?.data?.[0]

				if (user) {
					const selectedUser = {
						value: user._id,
						label: `${user.firstName} ${user.lastName} ${user.mobile ? `- ${user.mobile}` : ''} ${
							user.email ? `- ${user.email}` : ''
						}`,
						avatar: user.profile_image ? `https://files.fggroup.in/${user.profile_image}` : UserImg,
					}

					onChange(selectedUser)
				}
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

	const CustomOption = (props: any) => {
		const { data } = props

		return (
			<components.Option {...props}>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<img
						src={data.avatar}
						alt={data.label}
						style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 10 }}
					/>
					<span>{data.label}</span>
				</div>
			</components.Option>
		)
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
							<form>
								<div className='row'>
									<InputField
										className='col-md-6 fv-row'
										label='Invoice Number'
										placeholder="Invoice Number'"
										type='number'
										name='invoice_number'
										htmlFor='invoice_number'
										value={formData?.invoice_number}
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
									<div className='mb-7'>
										<label
											htmlFor='select'
											className={`fw-bold fs-6 mb-md-5 mb-2`}>
											User
										</label>
										<AsyncPaginate
											debounceTimeout={1000}
											value={value}
											loadOptions={loadUserOptionsFWG}
											closeMenuOnSelect={true}
											onChange={onChange}
											components={{ Option: CustomOption }}
											// isMulti
										/>
									</div>
									<InputField
										className='col-md-6 fv-row'
										label='Full Name'
										placeholder='Enter Full Name'
										type='text'
										name='fullName'
										htmlFor='fullName'
										value={formData.fullName}
										onChange={handleInputChange}
									/>
									<InputField
										className='col-md-6 fv-row mb-7'
										label='Branch Name'
										name='branch_name'
										value={formData.branch_name}
										htmlFor='txt_company'
										type='text'
										disabled={true}
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
											'Phase 1 - 21 Day habit building plan',
											'Phase 2 - RTP plan',
											'Phase 3 - Ellite Goal program',
											'Phase 4 - Career Building plan',
											'RTP-1.0_ Weight Loss Program',
											'RTP-2.0 Weight Management Program',
											'RTP-3.0 Clinical Illness',
											'RTP-4.0 Corporate Event',
											'RTP-5.0 Prep Coaching',
											'Gym Membership Plan',
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
											'None',
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
										className='col-md-4 fv-row'
										label='Amount'
										placeholder='Amount'
										type='number'
										name='amount'
										htmlFor='amount'
										value={formData.amount}
										onChange={handleInputChange}
									/>
									<InputField
										className='col-md-4 fv-row'
										label='GST'
										placeholder='GST'
										type='number'
										name='gst'
										htmlFor='gst'
										value={formData.gst}
										onChange={handleInputChange}
									/>
									<div className='col-md-4 fv-row'>
										<div className='d-flex align-items-center mb-2'>
											<label
												htmlFor='discount'
												className='fw-bold fs-6 mb-3'>
												Discount
											</label>
											<div className='form-check form-switch form-check-custom form-check-solid mb-2 ms-2'>
												<input
													className='form-check-input w-25px h-15px'
													type='checkbox'
													id='discountTypeSwitch'
													checked={isDiscountPercentage}
													onChange={toggleDiscountType}
												/>
												<label
													className='form-check-label fw-bold fs-8 ms-1'
													htmlFor='discountTypeSwitch'>
													{isDiscountPercentage ? '(%)' : '(₹)'}
												</label>
											</div>
										</div>
										<input
											type='number'
											className='form-control'
											id='discount'
											name='discount'
											placeholder={`Discount in ${isDiscountPercentage ? 'percentage' : 'rupees'}`}
											value={formData.discount}
											onChange={handleInputChange}
										/>
									</div>
									<InputField
										className='col-md-6 fv-row'
										label='Total Amount'
										placeholder='Enter Total Amount'
										type='text'
										name='totalPayment'
										htmlFor='totalPayment'
										value={formData.totalPayment}
										onChange={handleInputChange}
									/>
									<InputField
										className='col-md-6 fv-row'
										label='Paid Amount'
										placeholder='Enter Paid Amount'
										type='text'
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
												<b>FitnessWithGomzi</b>
											</p>

											{formData.branch_name == 'Vesu' ? (
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
											) : formData.branch_name == 'Adajan' ? (
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
											) : formData.branch_name == 'Katargam' ? (
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
												<strong>8866842520</strong>
											</p>
											<p
												style={{ fontSize: '10px' }}
												className='mb-1'>
												Email:
												<strong id='emailLabel'>fitnesswithgomzi@gmail.com</strong>
											</p>
											<p
												style={{ fontSize: '10px' }}
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
													<span id='inv-n'>{invoiceData?.invoice_number || '001'}</span>
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
													<th>Amount</th>
													{invoiceData.gst != '0' ? <th>GST</th> : ''}
													{invoiceData.discount != '0' ? <th>Dis</th> : ''}
													{invoiceData.gst != '0' ? <th>Total Amount</th> : ''}
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
													{invoiceData.gst != '0' ? (
														<td>
															<span className='inv-paid'>{invoiceData.gst || '0 '}%</span>
														</td>
													) : (
														''
													)}
													{invoiceData.discount != '0' ? (
														<td>
															<span className='inv-paid'>
																{invoiceData.discount || '0'} {isDiscountPercentage ? '%' : '₹'}
															</span>
														</td>
													) : (
														''
													)}
													{invoiceData.gst != '0' ? (
														<td>
															<span className='inv-paid'>{invoiceData.totalPayment || '5000'}</span>
														</td>
													) : (
														''
													)}
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
													<span id='inv-due'>
														{' '}
														{dueAmount
															? dueAmount
															: invoiceData.totalPayment - invoiceData.paidPayment || '-'}
													</span>
												</p>
												{invoiceData.discount != '0' ? (
													<p className=''>
														<strong>Discount Amount :-</strong>
														<span id='inv-due'>
															{' '}
															{invoiceData.discount || '-'} {isDiscountPercentage ? '%' : '₹'}
														</span>
													</p>
												) : (
													''
												)}
												<p className=''>
													<strong>Total Amount :-</strong>
													<span className='inv-total'> {invoiceData.totalPayment || '5000'}</span>
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
									onClick={() => generatePDF(invoiceData.fullName)}>
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
									FWG - Rules & Guidelines for Clients
								</p>
								<div className='border'>
									<div className='invoice-details d-flex'>
										<div className='col-md-12 border px-0'>
											<div className='bill-to px-2'>Terms and Conditions :-</div>
											<div className='px-2'>
												<p
													style={{ fontSize: '10px' }}
													className='mt-1'>
													Welcome to FITNESS WITH GOMZI! We're here to give you real results, but
													that only works with your full dedication and discipline. Please go
													through these important rules to ensure your transformation journey goes
													smooth and effective:
												</p>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>1. Payment Policy</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Full payment is compulsory in advance for any
														transformation plan.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> However, if you're allowed to start with 50% advance,
														then the remaining 50% must be paid within 15 days or on the date
														provided by your trainer or counselor.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Failure to pay within the timeline may result in:
														<ul>
															<li>Paused services (diet/exercise plans).</li>
															<li>No communication from our side.</li>
															<li>
																No eligibility for result guarantee or transformation certificate.
															</li>
														</ul>
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>
															IMPORTANT: NO REFUND POLICY - Once the payment is made, it is
															non-refundable in any case.
														</strong>
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>2. Daily Updates are Compulsory</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Daily diet update is strictly compulsory. If you
														forget or skip sending your meals, we will not be responsible for your
														results.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Daily exercise update is also mandatory if you've
														taken a plan that includes workouts.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Consistency = Results. No excuses.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>3. Weekly Weight Update</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Every Wednesday, you must share your weight update
														with your coach to track progress correctly.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Delayed or missed updates can affect the
														customization of your plan.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>4. Communication Rules</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> For any queries related to diet or exercise, please
														drop your question in the official WhatsApp group only.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> If you don't receive a reply within 24 hours, then
														you may call your coach.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> In case of emergency, you are allowed to call
														directly.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>5. Plan Validity & Freeze Policy</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Each transformation plan is valid only for the
														duration you signed up for (e.g., 1 month, 3 months, etc.).
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> No pause/freeze in plan is allowed unless there is a
														valid medical emergency (with proof).
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Inactivity from your side does not extend the plan.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>6. Result Guarantee Conditions</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> To be eligible for result guarantee or certificate
														(if applicable), you must:
														<ul>
															<li>Follow 100% of the given diet and workout plans.</li>
															<li>Submit daily updates without fail.</li>
															<li>Update weekly weight every Wednesday.</li>
															<li>
																Maintain clear communication with your coach and be punctual with
																check-ins.
															</li>
														</ul>
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Failing to meet any of the above will void the result
														guarantee from our side.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>7. Sharing & Privacy Policy</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Do not share your personalized plans, transformation
														strategies, or any inside information with others.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Everything provided is tailored for you only and
														sharing it may lead to termination of services.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Your progress and data are safe with us and will not
														be shared without your permission.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>8. Respect & Team Culture</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Respect your coach and fellow members in all group
														interactions.
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Negative behavior, rude messages, or lack of
														seriousness can lead to removal from the group and program without
														refund.
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

export default UpdateInvoicePage
