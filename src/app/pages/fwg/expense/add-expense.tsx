import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { createExpense, getNextExpenseSequence } from '../../../Functions/FGGroup/Expense'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const AddExpense = () => {
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
			await createExpense({
				expense_company: 'FWG',
				expense_number: formData.expense_number.toString(),
				date: DayJS(formData.date).format('YYYY/MM/DD'),
				expense_category: formData.expenseName,
				payment_method: formData.expensePaymentMethod,
				total_amount: Number(formData.expenseAmount),
				note: formData.expenseNotes,
				items: [{ item_name: formData.expenseItemName, amount: formData.expenseAmount }],
			})
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
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	useEffect(() => {
		const fetchExpenseNumber = async () => {
			try {
				const response: any = await getNextExpenseSequence({ expense_company: 'FWG' })
				if (response.data) {
					const allData: any = response.data
					setFormData((prevData: any) => ({
						...prevData,
						expense_number: parseInt(allData.next_expense_number).toString(),
					}))
				}
			} catch (error) {
				console.error(error)
			}
		}
		fetchExpenseNumber()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Expense</PageTitle>
			<div className='row'>
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
											type='text'
											name='expense_number'
											htmlFor='expense_number'
											value={formData.expense_number}
											onChange={handleInputChange}
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
									</div>
								</div>
								<div className='col-md-2 fv-row mb-7'>
									<TableButton
										action='add'
										onClick={handleCreateInvoice}
										text={isSubmitting ? 'Please wait, creating Expense...' : 'Add Expense'}
										showIcon={false}
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

export { AddExpense }
