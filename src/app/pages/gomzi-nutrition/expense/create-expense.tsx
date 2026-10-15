import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
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
		<>
			<PageTitle breadcrumbs={[]}>{expense_id ? 'Update Expense' : 'Add Expense'}</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card'>
						<h1 className='fw-bold m-6 text-dark fs-1 mb-6 '>Expenses Details</h1>
						<div className='card-body'>
							<div className='row'>
								<InputField
									className='col-md-6 fv-row'
									label='Expenses No'
									placeholder='Expenses No'
									type='text'
									name='expense_number'
									htmlFor='expense_number'
									value={formData?.expense_number || ''}
									disabled={!!expense_id}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Date'
									placeholder='date'
									type='date'
									name='date'
									htmlFor='date'
									value={formData?.date || ''}
									onChange={handleInputChange}
								/>

								<h1 className='mb-4'>PARTICULAR:</h1>
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
												<InputField
													className='col-md-6 fv-row'
													label='Expense Name'
													placeholder='Expense Name'
													type='text'
													name='item_name'
													htmlFor={`item_name-${index}`}
													value={plan?.item_name}
													onChange={(e: any) => handlePlanInputChange(index, e)}
												/>
												<InputField
													className='col-md-6 fv-row'
													label='Amount'
													placeholder='Enter Amount'
													type='text'
													name='amount'
													htmlFor='amount'
													value={plan?.amount}
													onChange={(e: any) => handlePlanInputChange(index, e)}
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

								{!expense_id && (
									<div className='col-12 my-3 d-flex justify-content-end'>
										<button
											className='btn-primary btn gap-2 mx-2 btn-sm me-1'
											onClick={(e) => addPlan(e)}>
											Add
										</button>
									</div>
								)}

								<InputField
									className='col-md-4 fv-row'
									label='Total Amount'
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
										className='col-md-4 fv-row'
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
										className='col-md-4 fv-row mb-7'
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
									className='col-md-4 fv-row mb-7'
									label='Payment Method'
									name='expensePaymentMethod'
									value={formData?.expensePaymentMethod}
									onChange={handleInputChange}
									htmlFor='expensePaymentMethod'
									options={['Online', 'Cash', 'Cheque']}
								/>

								<TextareaField
									className='col-md-12 fv-row'
									label='Notes'
									placeholder='Write Notes'
									name='expenseNotes'
									htmlFor='expenseNotes'
									value={formData?.expenseNotes}
									onChange={handleNotesChange}
								/>

								<div className='col-md-12 fv-row mb-7'>
									<label className='form-label fw-bold'>
										Reference Document / Bill
										<span className='text-muted fw-normal ms-2'>(Optional)</span>
									</label>

									{/* Existing document */}
									{expense_id && existingDocument && !referenceDocument && (
										<div className='border rounded p-4 mb-4'>
											<div className='d-flex align-items-center justify-content-between mb-3'>
												<div>
													<div className='fw-bold text-gray-800'>Existing Document</div>

													<div className='text-muted fs-7'>{existingDocument.name}</div>
												</div>

												<div className='d-flex align-items-center gap-2'>
													<a
														href={getDocumentUrl(existingDocument.url)}
														target='_blank'
														rel='noopener noreferrer'
														className='btn btn-sm d-inline-flex align-items-center justify-content-center gap-2'
														style={{
															height: '38px',
															padding: '0 16px',
															borderRadius: '8px',
															fontSize: '13px',
															fontWeight: 600,
															backgroundColor: '#ffffff',
															border: '1px solid #DFE7F0',
															color: '#1E3A5F',
															boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
															transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
														}}
														onMouseEnter={(e) => {
															e.currentTarget.style.backgroundColor = '#1E3A5F'
															e.currentTarget.style.borderColor = '#1E3A5F'
															e.currentTarget.style.color = '#ffffff'
															e.currentTarget.style.boxShadow = '0 4px 10px rgba(30, 58, 95, 0.25)'
														}}
														onMouseLeave={(e) => {
															e.currentTarget.style.backgroundColor = '#ffffff'
															e.currentTarget.style.borderColor = '#DFE7F0'
															e.currentTarget.style.color = '#1E3A5F'
															e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
														}}>
														<i className='bi bi-eye fs-5'></i>
														{isImageDocument(existingDocument) ? 'View Document' : 'Download / View Document'}
													</a>

													<label
														className='btn btn-sm btn-primary mb-0 d-inline-flex align-items-center justify-content-center gap-2'
														style={{
															height: '38px',
															padding: '0 16px',
															borderRadius: '8px',
															fontSize: '13px',
															fontWeight: 600,
															cursor: 'pointer',
															boxShadow: '0 2px 6px rgba(30, 58, 95, 0.25)',
														}}>
														<i className='bi bi-arrow-repeat fs-5 text-white'></i>
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
												<div className='mt-3'>
													<img
														src={getDocumentUrl(existingDocument.url)}
														alt={existingDocument.name}
														className='img-fluid rounded border'
														style={{
															maxHeight: '300px',
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
										<>
											<input
												type='file'
												className='form-control'
												accept='.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
												onChange={handleReferenceDocumentChange}
											/>

											<div className='text-muted fs-8 mt-2'>
												Upload a bill, invoice, receipt or supporting document.
											</div>
										</>
									)}

									{/* Newly selected document */}
									{referenceDocument && (
										<div className='border rounded p-4 mt-3'>
											<div className='d-flex align-items-center justify-content-between'>
												<div>
													<div className='fw-bold text-gray-800'>New Document</div>

													<div className='text-muted fs-7'>{referenceDocument.name}</div>
												</div>

												<button
													type='button'
													className='btn btn-sm btn-light-danger'
													onClick={() => setReferenceDocument(null)}>
													Remove
												</button>
											</div>

											{/* New image preview */}
											{referenceDocument.type.startsWith('image/') && (
												<div className='mt-3'>
													<img
														src={URL.createObjectURL(referenceDocument)}
														alt={referenceDocument.name}
														className='img-fluid rounded border'
														style={{
															maxHeight: '300px',
															maxWidth: '100%',
															objectFit: 'contain',
														}}
													/>
												</div>
											)}
										</div>
									)}
								</div>

								{/* Add / Update Expense */}
								<div className='col-md-12 d-flex justify-content-end fv-row mb-7 mt-5'>
									<button
										type='button'
										className='btn btn-primary d-inline-flex align-items-center justify-content-center px-6'
										onClick={handleSaveExpense}
										disabled={isSubmitting}
										style={{
											height: '42px',
											fontSize: '14px',
											fontWeight: 600,
											borderRadius: '8px',
											minWidth: '160px',
											boxShadow: '0 2px 6px rgba(30, 58, 95, 0.28)',
											transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
										}}>
										{isSubmitting ? (
											<>
												<span
													className='spinner-border spinner-border-sm me-2'
													role='status'
													aria-hidden='true'></span>
												Please wait...
											</>
										) : (
											<>
												<i className={`bi ${expense_id ? 'bi-check2-circle' : 'bi-plus-circle'} fs-5 me-2`}></i>
												{expense_id ? 'Update Expense' : 'Add Expense'}
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { AddExpenseNutrition }
