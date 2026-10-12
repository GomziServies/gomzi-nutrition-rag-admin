import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import {
	createExpense,
	getExpense,
	getNextExpenseSequence,
	updateExpense,
} from '../../../Functions/FGGroup/Expense'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const AddExpenseMaster = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const expense_id: string | any = searchParams.get('expense_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		expense_number: '',
		date: '',
		expensePaymentMethod: '',
		expenseAmount: '',
		expenseNotes: '',
		expense_company: '',
		expense_category: '',
	})
	const [isUpdateMode, setIsUpdateMode] = useState(false)
	const [plans, setPlans] = useState([
		{
			_id: '',
			item_name: '',
			amount: '',
		},
	])

	const fetchExpenseData = async () => {
		try {
			if (expense_id) {
				// Fetch data for update mode
				const response: any = await getExpense({
					id: expense_id,
					expense_company: 'Private',
				})
				if (response.data && response.data.length > 0) {
					const expenseData: any = response.data[0]
					setFormData({
						expense_number: expenseData.expense_number || '',
						date: DayJS(expenseData.date).format('YYYY-MM-DD') || '',
						expensePaymentMethod: expenseData.payment_method || '',
						expenseAmount: expenseData.total_amount ? expenseData.total_amount.toString() : '',
						expenseNotes: expenseData.note || '',
						expense_company: 'Private',
						expense_category: expenseData.expense_category || '',
					})
					setPlans(expenseData.items || [])
				} else {
					console.error('No expense data found')
				}
			} else {
				const response = await getNextExpenseSequence({
					expense_company: 'Private',
				})
				if (response.data) {
					const allData: any = response.data
					setFormData((prevData: any) => ({
						...prevData,
						expense_number: parseInt(allData.next_expense_number).toString(),
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
			(total: number, plan: any) => total + parseFloat(plan.amount || 0),
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
					toast.success('Item remove successfully')

					// Recalculate expenseAmount after plan deletion
					const newTotalAmount = newPlans.reduce(
						(total: number, plan: any) => total + parseFloat(plan.amount || 0),
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

	const handleInputChange = (event: any) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleNotesChange = (event: any) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleSaveExpense = async () => {
		try {
			setIsSubmitting(true)
			const formDataWith: any = {
				id: expense_id,
				expense_number: formData.expense_number,
				date: DayJS(formData.date).format('YYYY/MM/DD'),
				payment_method: formData.expensePaymentMethod,
				total_amount: Number(formData.expenseAmount),
				note: formData.expenseNotes,
				expense_company: 'Private',
				expense_category: formData.expense_category,
				items: plans.map((plan) => ({
					_id: plan._id,
					item_name: plan.item_name,
					amount: plan.amount,
				})),
			}

			if (expense_id) {
				await updateExpense(formDataWith)
				toast.success('Expense Updated Successfully')
				setIsUpdateMode(true)
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
				})
				setPlans([
					{
						_id: '',
						item_name: '',
						amount: '',
					},
				])
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
									type='number'
									name='expense_number'
									htmlFor='expense_number'
									value={formData.expense_number || ''}
									disabled={!!expense_id}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Date'
									placeholder='date'
									type='date'
									name='date'
									htmlFor='date'
									value={formData.date || ''}
									onChange={handleInputChange}
								/>

								<h1 className='mb-4'>Items:</h1>
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
													label='Item Name'
													placeholder='Item Name'
													type='text'
													name='item_name'
													htmlFor={`item_name-${index}`}
													value={plan.item_name}
													onChange={(e: any) => handlePlanInputChange(index, e)}
												/>
												<InputField
													className='col-md-6 fv-row'
													label='Amount'
													placeholder='Enter Amount'
													type='number'
													name='amount'
													htmlFor='amount'
													value={plan.amount}
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
									type='number'
									name='expenseAmount'
									htmlFor='expenseAmount'
									value={formData.expenseAmount}
									onChange={handleInputChange}
									disabled
								/>
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
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Payment Method'
									name='expensePaymentMethod'
									value={formData.expensePaymentMethod}
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
									value={formData.expenseNotes}
									onChange={handleNotesChange}
								/>
								<div className='col-md-12 d-flex justify-content-end fv-row mb-7'>
									<TableButton
										action={expense_id ? 'edit' : 'add'}
										onClick={handleSaveExpense}
										text={
											isSubmitting
												? 'Please wait, saving Expense...'
												: expense_id
												? 'Update Expense'
												: 'Add Expense'
										}
										showIcon={false}
										disabled={isSubmitting}
										backgroundDark={true}
										className={`mb-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { AddExpenseMaster }
