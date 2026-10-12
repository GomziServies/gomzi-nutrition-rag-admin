import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TextareaField from '../../../components/TextareaField'
import { getExpense, updateExpense } from '../../../Functions/FGGroup/Expense'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import TableButton from '../../../components/TableButton'

const UpdateExpensePage = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const expense_id: string | null = searchParams.get('expense_id')
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

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleCreateInvoice = async () => {
		try {
			setIsSubmitting(true)
			await updateExpense({
				id: expense_id!,
				expense_category: formData.expenseName,
				payment_method: formData.expensePaymentMethod,
				total_amount: Number(formData.expenseAmount),
				note: formData.expenseNotes,
				items: [{ item_name: formData.expenseItemName, amount: formData.expenseAmount }],
			})
			toast.success('Expense Update Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	useEffect(() => {
		const fetchExpenseData = async () => {
			try {
				const response: any = await getExpense({
					id: expense_id!,
					expense_company: 'FWG',
				})
				if (response.data && response.data.length > 0) {
					const expData = response.data[0]
					setFormData({
						expense_number: expData.expense_number || '',
						date: DayJS(expData.date).format('YYYY-MM-DD') || '',
						expenseName: expData.expense_category || '',
						expensePaymentMethod: expData.payment_method || '',
						expenseItemName: expData.items?.[0]?.item_name || '',
						expenseAmount: expData.total_amount ? expData.total_amount.toString() : '',
						expenseNotes: expData.note || '',
					})
				}
			} catch (error) {
				console.error(error)
			}
		}
		fetchExpenseData()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Expense</PageTitle>
			<div className='row '>
				<div className='col-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<div className='row justify-content-end'>
								<div className='col-12'>
									<div className='row'>
										<InputField
											className='col-md-6 fv-row'
											label='Expenses No'
											placeholder='Expenses No'
											type='number'
											name='expense_number'
											htmlFor='expense_number'
											value={formData?.expense_number}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-6 fv-row'
											label='Date'
											placeholder='date'
											type='date'
											name='date'
											htmlFor='date'
											value={formData?.date}
											onChange={handleInputChange}
										/>
										<SelectField
											className='col-md-6 fv-row mb-7'
											label='Payment Method'
											name='expensePaymentMethod'
											value={formData?.expensePaymentMethod}
											onChange={handleInputChange}
											htmlFor='expensePaymentMethod'
											options={['Online', 'Cash', 'Cheque']}
										/>
										<SelectField
											className='col-md-6 fv-row mb-7'
											label='Expenses category'
											name='expenseName'
											value={formData?.expenseName}
											onChange={handleInputChange}
											htmlFor='expenseName'
											options={[
												'Ads',
												'Counselling',
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
											value={formData?.expenseItemName}
											onChange={handleInputChange}
										/>
										<InputField
											className='col-md-6 fv-row'
											label='Total Amount'
											placeholder='Total Amount'
											type='number'
											name='expenseAmount'
											htmlFor='expenseAmount'
											value={formData?.expenseAmount}
											onChange={handleInputChange}
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
									</div>
								</div>
								<div className='col-md-3 fv-row mb-7'>
									<TableButton
										action="edit"
										onClick={handleCreateInvoice}
										text={isSubmitting ? 'Please wait, updating Expense...' : 'Update Expense'}
										showIcon={false}
										backgroundDark={true}
										className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
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

export { UpdateExpensePage }
