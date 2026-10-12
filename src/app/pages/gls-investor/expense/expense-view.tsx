import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TextareaField from '../../../components/TextareaField'
import { getExpense } from '../../../../app/Functions/FGGroup/Expense'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const ExpenseView: React.FC = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const expense_id: any = searchParams.get('expense_id')

    const [expenseData, setExpenseData] = useState<any>({
        expense_category: '',
        payment_method: '',
        total_amount: '',
        date: '',
        note: '',
        expense_number: '',
        items: [],
    })

    const fetchExpenseData = async () => {
        try {
            const response: any = await getExpense({
                id: expense_id,
                expense_company: 'Adajan-Branch',
            })
            if (response.data && response.data.length > 0) {
                setExpenseData(response.data[0])
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchExpenseData()
    }, [])

    return (
        <>
            <PageTitle breadcrumbs={[]}>View Expense</PageTitle>
            <KTCard>
                <div className='card-body py-4'>
                    <div className='d-flex justify-content-between align-items-center mb-6'>
                        <h2 className='fw-bold fs-2 mb-0'>Expense Details</h2>
                    </div>
                    <div className='row'>
                        <InputField
                            className='col-md-6 fv-row'
                            label='Expense No'
                            placeholder='Expense No'
                            type='text'
                            name='expense_number'
                            htmlFor='expense_number'
                            value={expenseData.expense_number || ''}
                            onChange={() => { }}
                            disabled={true}
                        />
                        <InputField
                            className='col-md-6 fv-row'
                            label='Date'
                            placeholder='Date'
                            type='text'
                            name='date'
                            htmlFor='date'
                            value={expenseData.date ? DayJS(expenseData.date).format('YYYY/MM/DD h:mm A') : ''}
                            onChange={() => { }}
                            disabled={true}
                        />
                        <SelectField
                            className='col-md-6 fv-row mb-7'
                            label='Expense Category'
                            name='expense_category'
                            value={expenseData.expense_category}
                            onChange={() => { }}
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
                            disabled={true}
                        />
                        <SelectField
                            className='col-md-6 fv-row mb-7'
                            label='Payment Method'
                            name='payment_method'
                            value={expenseData.payment_method}
                            onChange={() => { }}
                            htmlFor='payment_method'
                            options={['Online', 'Cash', 'Cheque']}
                            disabled={true}
                        />
                        <InputField
                            className='col-md-6 fv-row'
                            label='Total Amount'
                            placeholder='Total Amount'
                            type='number'
                            name='total_amount'
                            htmlFor='total_amount'
                            value={expenseData.total_amount || ''}
                            onChange={() => { }}
                            disabled={true}
                        />
                        {expenseData.items && expenseData.items.length > 0 && (
                            <InputField
                                className='col-md-6 fv-row'
                                label='Item Name'
                                placeholder='Item Name'
                                type='text'
                                name='item_name'
                                htmlFor='item_name'
                                value={expenseData.items[0]?.item_name || ''}
                                onChange={() => { }}
                                disabled={true}
                            />
                        )}
                        <TextareaField
                            className='col-md-12 fv-row'
                            label='Notes'
                            placeholder='Notes'
                            name='note'
                            htmlFor='note'
                            value={expenseData.note || ''}
                            onChange={() => { }}
                            disabled={true}
                        />
                    </div>
                    <div className='d-flex justify-content-end align-items-center mb-6'>
                        <button
                            className='btn btn-primary btn-sm'
                            onClick={() => window.history.back()}>
                            &larr; Back
                        </button>
                    </div>
                </div>
            </KTCard>
        </>
    )
}

export default ExpenseView
