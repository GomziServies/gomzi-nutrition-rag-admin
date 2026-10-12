import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { CreateExpense, GetExpenses, UpdateExpense } from '../../../Functions/GCS'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const AddExpenseGcs = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const expense_id: string | any = searchParams.get('expense_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		expense_number: '',
		date: '',
		expenseName: '',
		expensePaymentMethod: '',
		expenseItemName: '',
		expenseAmount: '',
		expenseNotes: '',
	})

	const fetchExpenseData = async () => {
		try {
			if (expense_id) {
				const response: any = await GetExpenses({ id: expense_id })
				const expenseData: any = response.data[0]
				setFormData({
					expense_number: expenseData.expense_number,
					date: DayJS(expenseData.date).format('YYYY-MM-DD'),
					expenseName: expenseData.expenseName,
					expensePaymentMethod: expenseData.expensePaymentMethod,
					expenseItemName: expenseData.expenseItemName,
					expenseAmount: expenseData.expenseAmount.toString(),
					expenseNotes: expenseData.expenseNotes,
				})
			} else {
				const response = await GetExpenses()
				if (response.data) {
					const allData: any = response.data
					const sortedExpenses = allData[allData.length - 1]
					setFormData((prevData: any) => ({
						...prevData,
						expense_number: parseInt(sortedExpenses.expense_number) + 1,
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
				expenseName: formData.expenseName,
				expensePaymentMethod: formData.expensePaymentMethod,
				expenseItemName: formData.expenseItemName,
				expenseAmount: Number(formData.expenseAmount),
				expenseNotes: formData.expenseNotes,
			}

			if (expense_id) {
				await UpdateExpense(formDataWith)
				toast.success('Expense Updated Successfully')
			} else {
				await CreateExpense(formDataWith)
				toast.success('Expense Created Successfully')
				setFormData({
					expense_number: '',
					date: '',
					expenseName: '',
					expensePaymentMethod: '',
					expenseItemName: '',
					expenseAmount: '',
					expenseNotes: '',
				})
			}
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

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
									value={formData.expense_number}
									disabled={expense_id !== undefined}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Date'
									placeholder='date'
									type='date'
									name='date'
									htmlFor='date'
									value={formData.date}
									onChange={handleInputChange}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Payment Method'
									name='expensePaymentMethod'
									value={formData.expensePaymentMethod}
									onChange={handleInputChange}
									htmlFor='expensePaymentMethod'
									options={['Online', 'Cash', 'Cheque']}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Expenses category'
									name='expenseName'
									value={formData.expenseName}
									onChange={handleInputChange}
									htmlFor='expenseName'
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
								<InputField
									className='col-md-6 fv-row'
									label='Item Name'
									placeholder='Item Name'
									type='text'
									name='expenseItemName'
									htmlFor='expenseItemName'
									value={formData.expenseItemName}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Total Amount'
									placeholder='Total Amount'
									type='number'
									name='expenseAmount'
									htmlFor='expenseAmount'
									value={formData.expenseAmount}
									onChange={handleInputChange}
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

export { AddExpenseGcs }
