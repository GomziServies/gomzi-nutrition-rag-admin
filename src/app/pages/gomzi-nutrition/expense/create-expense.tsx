import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import {
	createExpense,
	getExpense,
	getNextExpenseSequence,
	updateExpense,
} from '../../../Functions/FGGroup/Expense'
import '../common-management.css'

const AddExpenseNutrition = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const expense_id: string | any = searchParams.get('expense_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [referenceDocument, setReferenceDocument] = useState<File | null>(null)
	const [existingDocument, setExistingDocument] = useState<any>(null)
	const FILE_BASE_URL = 'https://files.fggroup.in/'
	const [formData, setFormData] = useState({
		expense_number: '',
		date: '',
		expensePaymentMethod: '',
		expenseAmount: '',
		expenseNotes: '',
		expense_company: '',
		expense_category: '',
		inputField: false,
	})
	const [isUpdateMode, setIsUpdateMode] = useState(false)
	const [plans, setPlans] = useState([
		{
			_id: '',
			item_name: '',
			amount: '',
		},
	])
	const adminType = localStorage.getItem('admin')

	const handleReferenceDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]

		if (!file) return

		setReferenceDocument(file)
	}
	const fetchExpenseData = async () => {
		try {
			const category: any = adminType == 'Store' ? adminType : 'Gomzi Nutrition'
			if (expense_id) {
				// Fetch data for update mode
				const response: any = await getExpense({
					id: expense_id,
					expense_company: category,
				})
				if (response.data && response.data.length > 0) {
					const expenseData: any = response.data[0]
					setFormData({
						expense_number: expenseData?.expense_number || '',
						date: DayJS(expenseData?.date).format('YYYY-MM-DD') || '',
						expensePaymentMethod: expenseData?.payment_method || '',
						expenseAmount: expenseData?.total_amount ? expenseData?.total_amount.toString() : '',
						expenseNotes: expenseData?.note || '',
						expense_company: category,
						expense_category: expenseData?.expense_category || '',
						inputField: false,
					})
					setPlans(expenseData?.items || [])
					setExistingDocument(expenseData?.reference_document || null)
					setReferenceDocument(null)
				} else {
					console.error('No expense data found')
				}
			} else {
				const response = await getNextExpenseSequence({
					expense_company: category,
				})
				if (response.data) {
					const allData: any = response.data
					setFormData((prevData: any) => ({
						...prevData,
						expense_number: parseInt(allData?.next_expense_number).toString(),
					}))
				}
			}
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchExpenseData()
	}, [expense_id])

	const handlePlanInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		const newPlans: any = [...plans]
		newPlans[index][name] = value

		setPlans(newPlans)

		const newTotalAmount = newPlans.reduce(
			(total: number, plan: any) => total + parseFloat(plan?.amount || 0),
			0
		)
		setFormData({ ...formData, expenseAmount: newTotalAmount.toString() })
	}

	const addPlan = (event: any) => {
		event.preventDefault()
		setPlans([...plans, { _id: '', item_name: '', amount: '' }])
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
					setPlans(newPlans)
					toast.success('Item Removed Successfully')

					// Recalculate expenseAmount after plan deletion
					const newTotalAmount = newPlans.reduce(
						(total: number, plan: any) => total + parseFloat(plan?.amount || 0),
						0
					)
					setFormData({ ...formData, expenseAmount: newTotalAmount.toString() })
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const getDocumentUrl = (url: string) => {
		if (!url) return ''

		if (url.startsWith('http://') || url.startsWith('https://')) {
			return url
		}

		return `${FILE_BASE_URL}${url}`
	}

	const handleInputChange = (event: any) => {
		const { name, value } = event.target
		const newFormData: any = { ...formData }

		if (name === 'expense_category') {
			if (value === 'Others') {
				newFormData.inputField = value === 'Others'
			}
		}
		newFormData[name] = value
		setFormData(newFormData)
	}

	// setFormData((prevData) => ({
	// 	...prevData,
	// 	[name]: value,
	// 	inputField: value === 'Other',
	// }))

	const handleNotesChange = (event: any) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const isImageDocument = (document: any) => {
		if (!document) return false

		if (document.mime_type) {
			return document.mime_type.startsWith('image/')
		}

		return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(document.name || '')
	}
	const handleSaveExpense = async () => {
		try {
			setIsSubmitting(true)

			const formDataWith: any = {
				id: expense_id,
				expense_number: formData?.expense_number,
				date: DayJS(formData?.date).format('YYYY/MM/DD'),
				payment_method: formData?.expensePaymentMethod,
				total_amount: parseInt(formData?.expenseAmount),
				note: formData?.expenseNotes,
				expense_company: adminType == 'Store' ? adminType : 'Gomzi Nutrition',
				expense_category: formData?.expense_category,
				items: plans.map((plan) => ({
					_id: plan?._id,
					item_name: plan?.item_name,
					amount: parseInt(plan?.amount),
				})),
			}

			// Upload reference document only if selected
			if (referenceDocument) {
				const response: any = await FileUploadToFGGroup([referenceDocument], {
					directory: 'expenses',
				})

				const documentUrl = response.data?.fileURLs?.[0]

				if (!documentUrl) {
					throw new Error('Reference document upload failed')
				}

				formDataWith.reference_document = {
					name: referenceDocument.name,
					url: documentUrl,
					mime_type: referenceDocument.type,
				}
			}

			if (expense_id) {
				await updateExpense(formDataWith)

				toast.success('Expense Updated Successfully')
				setIsUpdateMode(true)
				navigate('/rag/expense')
			} else {
				await createExpense(formDataWith)

				toast.success('Expense Created Successfully')

				setFormData({
					expense_number: '',
					date: '',
					expensePaymentMethod: '',
					expenseNotes: '',
					expenseAmount: '',
					expense_company: '',
					expense_category: '',
					inputField: false,
				})

				setReferenceDocument(null)

				setPlans([
					{
						_id: '',
						item_name: '',
						amount: '',
					},
				])

				fetchExpenseData()
				navigate('/rag/expense')
			}

			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	useEffect(() => {
		if (isUpdateMode) {
			fetchExpenseData()
			setIsUpdateMode(false)
		}
	}, [isUpdateMode])

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>{expense_id ? 'Update Expense' : 'Add Expense'}</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/expense'>Expenses</Link>
				<span className='sep'>/</span>
				<span className='current'>{expense_id ? 'Update Expense' : 'Create Expense'}</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>{expense_id ? 'Update Expense Record' : 'Record New Expense'}</h1>
					<p className='gz-mgmt-subtitle'>Specify expenditure particulars, payment mode, receipts and financial allocation</p>
				</div>
				<Link to='/rag/expense' className='gz-mgmt-btn-secondary text-decoration-none'>
					Back to Expenses
				</Link>
			</div>

			<div className='gz-mgmt-form-card'>
				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>1</div>
					<div>
						<h3 className='gz-mgmt-section-title'>General Information</h3>
						<p className='gz-mgmt-section-subtitle'>Basic identification and date for this expense voucher</p>
					</div>
				</div>

				<div className='row mb-8'>
					<InputField
						className='col-md-6 fv-row mb-4'
						label='Expenses No'
						placeholder='Expenses No'
						type='text'
						name='expense_number'
						htmlFor='expense_number'
						value={formData?.expense_number || ''}
						disabled={!!expense_id}
					/>
					<InputField
						className='col-md-6 fv-row mb-4'
						label='Date'
						placeholder='date'
						type='date'
						name='date'
						htmlFor='date'
						value={formData?.date || ''}
						onChange={handleInputChange}
					/>
				</div>

				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>2</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Expenditure Particulars</h3>
						<p className='gz-mgmt-section-subtitle'>List individual item breakdown or line items</p>
					</div>
				</div>

				<div className='mb-6'>
					{plans.map((plan, index) => (
						<div key={index} className='gz-mgmt-item-row'>
							<div className='row flex-grow-1'>
								<InputField
									className='col-md-7 fv-row'
									label={`Item #${index + 1} Name`}
									placeholder='e.g. Server hosting, Packaging supplies'
									type='text'
									name='item_name'
									htmlFor={`item_name-${index}`}
									value={plan?.item_name}
									onChange={(e: any) => handlePlanInputChange(index, e)}
								/>
								<InputField
									className='col-md-5 fv-row'
									label='Amount (₹)'
									placeholder='0.00'
									type='text'
									name='amount'
									htmlFor='amount'
									value={plan?.amount}
									onChange={(e: any) => handlePlanInputChange(index, e)}
								/>
							</div>
							{plans.length > 1 && (
								<div className='ms-3 d-flex align-items-center'>
									<TableButton
										action='remove'
										backgroundDark={true}
										onClick={(e) => removePlan(index, e)}
									/>
								</div>
							)}
						</div>
					))}

					{!expense_id && (
						<div className='d-flex justify-content-end mt-3'>
							<button
								type='button'
								className='gz-mgmt-btn-secondary'
								onClick={(e) => addPlan(e)}>
								<i className='bi bi-plus-lg me-1'></i> Add Particular Line
							</button>
						</div>
					)}
				</div>

				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>3</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Payment & Classification</h3>
						<p className='gz-mgmt-section-subtitle'>Define accounting category and disbursement channel</p>
					</div>
				</div>

				<div className='row mb-6'>
					<InputField
						className='col-md-4 fv-row mb-4'
						label='Total Amount (₹)'
						placeholder='Total Amount'
						type='text'
						name='expenseAmount'
						htmlFor='expenseAmount'
						value={formData?.expenseAmount}
						onChange={handleInputChange}
						disabled
					/>
					{formData.inputField ? (
						<InputField
							className='col-md-4 fv-row mb-4'
							label='Expenses category'
							placeholder='Enter Expenses category'
							type='text'
							name='expense_category'
							htmlFor='expense_category'
							value={formData.expense_category == 'Others' ? '' : formData.expense_category}
							onChange={handleInputChange}
						/>
					) : (
						<SelectField
							className='col-md-4 fv-row mb-4'
							label='Expenses category'
							name='expense_category'
							value={formData.expense_category}
							onChange={handleInputChange}
							htmlFor='expense_category'
							options={[
								'Ads',
								'Counselling',
								'Electricity',
								'Salary',
								'Petrol',
								'Transport',
								'Rent',
								'Fix cost',
								'Equipment',
								'Miscellaneous',
								'Others',
							]}
						/>
					)}

					<SelectField
						className='col-md-4 fv-row mb-4'
						label='Payment Method'
						name='expensePaymentMethod'
						value={formData?.expensePaymentMethod}
						onChange={handleInputChange}
						htmlFor='expensePaymentMethod'
						options={['Online', 'Cash', 'Cheque']}
					/>

					<TextareaField
						className='col-md-12 fv-row mb-4'
						label='Expense Notes / Remarks'
						placeholder='Add any references, internal tracking notes or narration...'
						name='expenseNotes'
						htmlFor='expenseNotes'
						value={formData?.expenseNotes}
						onChange={handleNotesChange}
					/>
				</div>

				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>4</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Receipt / Reference Document</h3>
						<p className='gz-mgmt-section-subtitle'>Attach proof of transaction, bill or voucher (optional)</p>
					</div>
				</div>

				<div className='mb-8'>
					{/* Existing document */}
					{expense_id && existingDocument && !referenceDocument && (
						<div className='p-4 mb-4' style={{ border: '1px solid #DFE7F0', borderRadius: '12px', background: '#F8FAFC' }}>
							<div className='d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2'>
								<div>
									<div className='fw-bold' style={{ color: '#172B4D' }}>Existing Document</div>
									<div className='text-muted fs-7'>{existingDocument.name}</div>
								</div>

								<div className='d-flex align-items-center gap-2'>
									<a
										href={getDocumentUrl(existingDocument.url)}
										target='_blank'
										rel='noopener noreferrer'
										className='gz-mgmt-btn-secondary text-decoration-none'>
										<i className='bi bi-eye me-1'></i>
										{isImageDocument(existingDocument) ? 'View Document' : 'Download / View'}
									</a>

									<label
										className='gz-mgmt-btn-primary mb-0 d-inline-flex align-items-center'
										style={{ cursor: 'pointer' }}>
										<i className='bi bi-arrow-repeat me-1'></i>
										Replace Document
										<input
											type='file'
											className='d-none'
											accept='.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
											onChange={handleReferenceDocumentChange}
										/>
									</label>
								</div>
							</div>

							{isImageDocument(existingDocument) && (
								<div className='mt-3 text-center'>
									<img
										src={getDocumentUrl(existingDocument.url)}
										alt={existingDocument.name}
										className='img-fluid rounded border'
										style={{
											maxHeight: '260px',
											maxWidth: '100%',
											objectFit: 'contain',
										}}
									/>
								</div>
							)}
						</div>
					)}

					{/* Upload / Replace document */}
					{(!expense_id || !existingDocument || referenceDocument) && (
						<div className='p-4' style={{ border: '1.5px dashed #CBD5E1', borderRadius: '12px', background: '#F8FAFC' }}>
							<input
								type='file'
								className='form-control'
								accept='.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
								onChange={handleReferenceDocumentChange}
							/>
							<div className='text-muted fs-8 mt-2'>
								Supported formats: PDF, PNG, JPG, WEBP, DOCX (Max 15MB)
							</div>
						</div>
					)}

					{/* Newly selected document */}
					{referenceDocument && (
						<div className='p-4 mt-3' style={{ border: '1px solid #DFE7F0', borderRadius: '12px', background: '#FFFFFF' }}>
							<div className='d-flex align-items-center justify-content-between'>
								<div>
									<div className='fw-bold' style={{ color: '#172B4D' }}>Selected New Document</div>
									<div className='text-muted fs-7'>{referenceDocument.name}</div>
								</div>
								<button
									type='button'
									className='btn btn-sm btn-light-danger'
									onClick={() => setReferenceDocument(null)}>
									Remove
								</button>
							</div>

							{referenceDocument.type.startsWith('image/') && (
								<div className='mt-3 text-center'>
									<img
										src={URL.createObjectURL(referenceDocument)}
										alt={referenceDocument.name}
										className='img-fluid rounded border'
										style={{
											maxHeight: '260px',
											maxWidth: '100%',
											objectFit: 'contain',
										}}
									/>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer Actions */}
				<div className='d-flex justify-content-end align-items-center gap-3 pt-4' style={{ borderTop: '1px solid #F1F5F9' }}>
					<Link to='/rag/expense' className='gz-mgmt-btn-secondary text-decoration-none'>
						Cancel
					</Link>
					<button
						type='button'
						className='gz-mgmt-btn-primary'
						onClick={handleSaveExpense}
						disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<span
									className='spinner-border spinner-border-sm me-2'
									role='status'
									aria-hidden='true'></span>
								Saving Record...
							</>
						) : (
							<>
								<i className={`bi ${expense_id ? 'bi-check2-circle' : 'bi-plus-circle'} me-2`}></i>
								{expense_id ? 'Update Expense' : 'Save Expense'}
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export { AddExpenseNutrition }
