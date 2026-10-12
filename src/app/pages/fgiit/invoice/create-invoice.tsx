import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { components } from 'react-select'
import { AsyncPaginate } from 'react-select-async-paginate'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { loadUserOptionsFGIIT } from '../../../components/loadUserOptionsFGIIT'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import {
	createInvoice,
	GetEmployees,
	getNextInvoiceSequence,
	GetUsers,
} from '../../../Functions/FGGroup'

const CreateInvoiceFGIIT: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [branchName, setBranchName] = useState('')
	const [userData, setUserData] = useState<any>({})
	const [isDiscountPercentage, setIsDiscountPercentage] = useState(true)
	const [employees, setEmployees] = useState<any[]>([])
	const [formData, setFormData] = useState({
		invoice_number: '',
		sales_person: '',
		date: '',
		name: '',
		branch_name: '',
		duration: '',
		duration_number: '',
		billing_address: '',
		mobile: '',
		email: '',
		items: '',
		payment_method: '',
		bank_details: '',
		amount: '',
		gst: '',
		discount: '',
		discount_type: 'percentage',
		net_amount: '',
		paid_amount: '',
		note: '',
		other_sales_person: '',
	})
	const [invoiceData, setInvoiceData] = useState({
		invoice_number: '',
		sales_person: '',
		date: '',
		name: '',
		billing_address: '',
		duration: '',
		duration_number: '',
		branch_name: '',
		mobile: '',
		email: '',
		items: '',
		payment_method: '',
		bank_details: '',
		amount: '',
		gst: '',
		discount: '',
		discount_type: 'percentage',
		net_amount: '',
		paid_amount: '',
		note: '',
		other_sales_person: '',
	})
	const [dueAmount, setDueAmount] = useState('')
	const [value, onChange] = useState<any>(null)

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		const data = { ...formData, [name]: value }

		const amt = +data.amount
		const gst = +data.gst
		let dis = +data.discount

		// Calculate discount based on type (percentage or rupee)
		if (name === 'discount' || name === 'amount' || name === 'gst') {
			if (isDiscountPercentage) {
				dis = (amt * dis) / 100
			} else {
				dis = +data.discount
			}
			data.net_amount = (amt * (1 + gst / 100) - dis).toFixed(0)

			data.discount_type = isDiscountPercentage ? 'percentage' : 'rupee'
		}

		setFormData(data)
	}

	const toggleDiscountType = () => {
		const newIsPercentage = !isDiscountPercentage
		const newDiscountType = newIsPercentage ? 'percentage' : 'rupee'
		setIsDiscountPercentage(newIsPercentage)

		// Clear discount value and recalculate total when switching types
		const amt = +formData.amount
		const gst = +formData.gst

		// Calculate new total with cleared discount
		let net_amount = ''
		if (!isNaN(amt) && !isNaN(gst) && amt > 0) {
			// When discount is cleared, total = amount + GST amount
			net_amount = (amt * (1 + gst / 100)).toFixed(0)
		}

		setFormData({
			...formData,
			discount: '',
			discount_type: newDiscountType,
			net_amount,
		})
	}

	// Separate event handler for textarea
	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleCreateInvoice = async (event: any) => {
		event.preventDefault()
		const ignoredFields: string[] = []

		if (userData?.first_name) {
			ignoredFields.push('name')
		}
		if (userData?.email) {
			ignoredFields.push('email')
		}
		if (userData?.mobile) {
			ignoredFields.push('mobile')
		}
		if (userData?.address?.address_line_1) {
			ignoredFields.push('billing_address')
		}

		// Validate sales person
		if (!formData.sales_person) {
			toast.error('Please select a sales person')
			return
		}

		if (formData.sales_person === 'N/A' && !formData.other_sales_person) {
			toast.error('Please enter sales person name')
			return
		}

		// Validate bank detail
		if (!formData.bank_details || formData.bank_details === 'Select Bank Account') {
			toast.error('Please select a bank detail')
			return
		}

		if (!formData.sales_person) {
			toast.error('Please select Sales Person')
			return
		}

		if (formData.sales_person === 'N/A' && !formData.other_sales_person) {
			toast.error('Please enter sales person name')
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

		setBranchName(formData.branch_name)
		try {
			setIsSubmitting(true)
			const payload: any = {
				invoice_category: 'FG Group',
				invoice_number: Number(formData.invoice_number),
				sales_person: formData.sales_person,
				other_sales_person: formData.other_sales_person,
				date: DayJS(formData.date).format('YYYY/MM/DD'),
				name: userData?.first_name
					? userData?.first_name + ' ' + userData?.last_name
					: formData.name,
				branch_name: formData.branch_name,
				user_id: value?.value,
				email: userData?.email ? userData?.email : formData.email,
				mobile:
					userData?.mobile && parseInt(userData?.mobile)
						? String(parseInt(userData?.mobile))
						: formData.mobile,
				billing_address: {
					address_line_1: userData?.address?.address_line_1
						? `${userData?.address?.address_line_1}, ${userData?.address?.address_line_2}, ${userData?.address?.city}, ${userData?.address?.state}, ${userData?.address?.country} - ${userData?.address?.pin_code}`
						: formData.billing_address,
				},
				bank_details: {
					account_type: formData.bank_details,
				},
				payment_method: formData.payment_method,
				amount: Number(formData.amount),
				gst: Number(formData.gst),
				discount: Number(formData.discount),
				net_amount: Number(formData.net_amount),
				paid_amount: Number(formData.paid_amount),
				note: formData.note,
				items: [
					{
						item_name: formData.items,
						amount: Number(formData.net_amount),
						quantity: 1,
						duration: formData?.duration_number + ' ' + formData?.duration,
						totalAmount: Number(formData.net_amount),
						gst: Number(formData.gst),
						discount: Number(formData.discount),
						discount_type: formData.discount_type,
					},
				],
				discount_type: formData.discount_type,
			}
			await createInvoice(payload)
			toast.success('Invoice Created Successfully')

			setInvoiceData({
				...formData,
				sales_person:
					formData.sales_person === 'N/A'
						? formData.other_sales_person
						: employees.find((e: any) => e.employee_id === formData.sales_person)?.full_name ||
						  formData.sales_person,
				name: userData?.first_name
					? userData?.first_name + ' ' + userData?.last_name
					: formData.name,
				email: userData?.email ? userData?.email : formData.email,
				mobile:
					userData?.mobile && parseInt(userData?.mobile)
						? String(parseInt(userData?.mobile))
						: formData.mobile,
				billing_address: userData?.address?.address_line_1
					? `${userData?.address?.address_line_1}, ${userData?.address?.address_line_2}, ${userData?.address?.city}, ${userData?.address?.state}, ${userData?.address?.country} - ${userData?.address?.pin_code}`
					: formData.billing_address,
				discount_type: isDiscountPercentage ? 'percentage' : 'rupee',
			})

			const due = payload.net_amount - payload.paid_amount
			setDueAmount(due.toString())

			setFormData({
				invoice_number: '',
				sales_person: '',
				date: '',
				name: '',
				branch_name: '',
				billing_address: '',
				duration: '',
				duration_number: '',
				mobile: '',
				email: '',
				items: '',
				payment_method: '',
				bank_details: '',
				amount: '',
				gst: '',
				discount: '',
				discount_type: 'percentage',
				net_amount: '',
				paid_amount: '',
				note: '',
				other_sales_person: '',
			})
			setUserData({
				first_name: '',
				last_name: '',
				mobile: '',
				email: '',
				billing_address: '',
			})
			onChange('')

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

	const fetchEmployees = async () => {
		try {
			// Allowed sales person admin IDs (environment-based)
			const hostname = window.location.hostname
			let ALLOWED_IDS: string[] = []

			if (hostname === 'admin.fggroup.in') {
				ALLOWED_IDS = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d'] // Live
			} else if (hostname === 'admin-dev.fggroup.in') {
				ALLOWED_IDS = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d'] // Dev
			} else {
				ALLOWED_IDS = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d'] // Local
			}

			const response: any = await GetEmployees({ limit: 1000 })
			if (response.data && Array.isArray(response.data)) {
				const salesPersons = response.data.filter((emp: any) => {
					const adminId = String(emp._id || '')
					const employeeDocId = String(emp.employee?._id || '')

					const isAllowedId = ALLOWED_IDS.includes(adminId) || ALLOWED_IDS.includes(employeeDocId)
					const isSalesPerson = emp.employee?.position === 'Sales Person'
					const branchName = (emp.employee?.branch_name || '').toUpperCase()
					const isFGGroup = branchName === 'FG GROUP' || branchName === 'FGIIT'

					// Show if (Sales Person in FG Group) OR (Specially allowed ID)
					return (isSalesPerson && isFGGroup) || isAllowedId
				})
				setEmployees(salesPersons)
			}
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchInvoiceData()
		fetchEmployees()
	}, [])

	useEffect(() => {
		if (isDiscountPercentage === undefined) {
			setIsDiscountPercentage(true)
		}
	}, [])

	const fetchUserData = async () => {
		try {
			const response: FGGroupAPIResponse | any = await GetUsers({
				id: value?.value,
			})
			if (response.data) {
				const allData = response.data?.[0]
				setUserData(allData)
			}
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		if (value?.value) {
			fetchUserData()
		}
	}, [value?.value])

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
								<div
									className={`${
										formData.sales_person === 'N/A' ? 'col-md-6' : 'col-md-12'
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
											{employees.map((emp: any) => (
												<option
													key={emp._id}
													value={emp.employee_id}>
													{emp.full_name}
												</option>
											))}
											<option value='N/A'>N/A</option>
										</select>
									</div>
								</div>
								{formData.sales_person === 'N/A' && (
									<InputField
										className='col-md-6 fv-row'
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
								<div className='mb-7'>
									<label
										htmlFor='select'
										className={`fw-bold fs-6 mb-md-5 mb-2`}>
										User
									</label>
									<AsyncPaginate
										debounceTimeout={1000}
										value={value}
										loadOptions={loadUserOptionsFGIIT}
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
									name='name'
									htmlFor='name'
									value={
										userData?.first_name
											? userData?.first_name + ' ' + userData?.last_name
											: formData.name
									}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Phone No.'
									placeholder='Enter Phone No.'
									type='Number'
									name='mobile'
									htmlFor='mobile'
									value={
										userData?.mobile && parseInt(userData?.mobile)
											? String(parseInt(userData?.mobile))
											: formData.mobile
									}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-12 fv-row'
									label='Address'
									placeholder='Enter Address'
									type='text'
									name='billing_address'
									htmlFor='billing_address'
									value={
										userData?.address?.address_line_1
											? `${userData?.address?.address_line_1}, ${userData?.address?.address_line_2}, ${userData?.address?.city}, ${userData?.address?.state}, ${userData?.address?.country} - ${userData?.address?.pin_code}`
											: formData.billing_address
									}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Email'
									placeholder='Enter Email'
									type='email'
									name='email'
									htmlFor='email'
									value={userData?.email ? userData?.email : formData.email}
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
									className='col-md-6 fv-row'
									label='Duration In Number'
									placeholder='Enter Duration'
									type='number'
									name='duration_number'
									htmlFor='duration_number'
									value={formData.duration_number}
									onChange={handleInputChange}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Select Duration'
									name='duration'
									value={formData.duration}
									onChange={handleInputChange}
									htmlFor='duration'
									options={['Days', 'Month', 'Year']}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Plan Name'
									name='items'
									value={formData.items}
									onChange={handleInputChange}
									htmlFor='txt_company'
									options={[
										'Nutri Trainer Course',
										'Diploma In Personal Training course',
										'Diploma In Nutrition course',
										'Anabolic Androgenic Steroids',
										'Injury Rehabilitation Workshop',
										'Powerlifting Coach Workshop',
										'Advance Clinical Nutrition Workshop',
										'Group Instructor Workshop',
										'Health and Fitness Book',
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
												<p>
													<strong>Sales Person :</strong>
													<span>{invoiceData.sales_person || '-'}</span>
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
													{invoiceData.gst != '0' || invoiceData.discount != '0' ? (
														<th>Amount</th>
													) : (
														''
													)}
													{invoiceData.gst != '0' ? <th>GST</th> : ''}
													{invoiceData.discount != '0' ? <th>Dis</th> : ''}
													<th>Total Amount</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td>
														<div id='inv-product'>{invoiceData.items}</div>
													</td>
													{invoiceData.gst != '0' || invoiceData.discount != '0' ? (
														<td>
															<span className='inv-paid'>{invoiceData.amount || '-'}</span>
														</td>
													) : (
														''
													)}
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
																{invoiceData.discount || '0'}
																{invoiceData.discount_type === 'percentage' ? '%' : '₹'}
															</span>
														</td>
													) : (
														''
													)}
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
												{invoiceData.discount != '0' ? (
													<p className=''>
														<strong>Discount Amount :-</strong>
														<span id='inv-due'>
															{' '}
															{invoiceData.discount
																? invoiceData.discount +
																  (invoiceData.discount_type === 'percentage' ? '%' : '₹')
																: '-'}
														</span>
													</p>
												) : (
													''
												)}
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

export default CreateInvoiceFGIIT

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
