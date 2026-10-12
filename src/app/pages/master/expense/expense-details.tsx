import { faHandHoldingDollar } from '@fortawesome/free-solid-svg-icons'
import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { StatisticsWidget2 } from '../../../../_metronic/partials/widgets'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetExpenseInsights } from '../../../Functions/FGGroup'
import { getExpense } from '../../../Functions/FGGroup/Expense'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const ExpenseListDetailsMaster: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [expenseData, setExpenseData] = useState<any>([])
	const [ExpenseInsightData, setExpenseInsightData] = useState<any>({})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	useEffect(() => {
		fetchInvoiceData()
	}, [selectedDateRange, pagination.page, pagination.itemsPerPage])

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const fetchInvoiceData = async () => {
		let startDate: Date
		let endDate: Date

		if (selectedDateRange) {
			;[startDate, endDate] = selectedDateRange
		} else {
			startDate = new Date(0)
			endDate = new Date()
		}
		try {
			const response: any = await getExpense({
				expense_company: 'Private',
				from_date: startDate,
				to_date: endDate,
			})
			let filteredData = response.data

			// Sort the filteredData array by createdAt date in descending order
			filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setExpenseData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchExpenseInsightData = async () => {
		try {
			const response: any = await GetExpenseInsights({
				expense_company: 'Private',
			})
			let filteredData = response.data
			setExpenseInsightData(filteredData[0])
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchExpenseInsightData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const filteredExpenseData = expenseData.filter(
		(invoice: any) =>
			invoice.expense_category &&
			invoice.expense_category.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedExpenseData = filteredExpenseData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const adsExpenses = expenseData.filter((expense: any) => expense.expenseName === 'Ads')
	const counsellingExpenses = expenseData.filter(
		(expense: any) => expense.expenseName === 'Counselling'
	)

	// Calculate total amount for Ads
	const totalAdsAmount = adsExpenses.reduce(
		(sum: number, expense: any) => sum + parseFloat(expense.expenseAmount || 0),
		0
	)

	// Calculate total amount for Counselling
	const totalCounsellingAmount = counsellingExpenses.reduce(
		(sum: number, expense: any) => sum + parseFloat(expense.expenseAmount || 0),
		0
	)

	const totalAmount = expenseData.reduce(
		(sum: number, invoice: any) => sum + parseFloat(invoice.expenseAmount || 0),
		0
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Expenses Details</PageTitle>

			<div className='row g-5 g-xl-8'>
				<div className='col-lg-4'>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faHandHoldingDollar}
						color='primary'
						title={ExpenseInsightData?.total_amount || 0}
						description='Total Expenses'
					/>
				</div>
			</div>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='col-12 row mb-5'>
						<div className='col-md-9'>
							<h1 className='fw-bold text-dark fs-1 mb-6 '>Expenses Details</h1>
						</div>
						<div className='col-md-3 text-end'>
							<TableButton
								action='add'
								to={'/master/master-create-expense'}
								text='Add Expense'
							/>
						</div>
					</div>

					<div className='mt-9'>
						<div className='d-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
					</div>

					<div className='row mt-9'>
						<div className='col-9'>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<div className='col-3'>
							<LengthMenu
								expenseData={expenseData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
							<thead>
								<tr className='fw-bold text-muted'>
									<th>No.</th>
									<th>Expenses No.</th>
									<th>Expenses Category</th>
									<th>Payment Method</th>
									<th>Total Amount</th>
									<th>Date</th>
									<th>Notes</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
								{paginatedExpenseData.map((expenseData: any, index: number) => {
									const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
									return (
										<tr key={actualIndex}>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{actualIndex}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{expenseData.expense_number}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{expenseData.expense_category}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{expenseData.payment_method}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{expenseData?.total_amount || 0}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{DayJS(expenseData.date).format('YYYY/MM/DD h:mm A')}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{expenseData.note}
												</span>
											</td>
											<td>
												<TableButton
													action='edit'
													to={`/master/master-expense-update?expense_id=` + expenseData._id}
												/>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
					{expenseData && expenseData.length > 0 ? (
						<UsersListPagination
							totalPages={Math.ceil(filteredExpenseData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					) : (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default ExpenseListDetailsMaster
