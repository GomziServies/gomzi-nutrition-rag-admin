import { faDownload, faHandHoldingDollar, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { StatisticsWidget2 } from '../../../../_metronic/partials/widgets'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetExpenseInsights } from '../../../Functions/FGGroup'
import { getExpense } from '../../../Functions/FGGroup/Expense'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const ExpenseListDetailsFgiit: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [expenseData, setExpenseData] = useState<any>([])
	const [ExpenseInsightData, setExpenseInsightData] = useState<any>({})
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [metaData, setMetaData] = useState<any>()
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	useEffect(() => {
		fetchExpenseData()
	}, [selectedDateRange, pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchExpenseData()
		}
	}, [searchTerm])

	const fetchExpenseData = async (page?: number) => {
		setLoading(true)
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
				expense_company: 'FG Group',
				from_date: startDate,
				to_date: endDate,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				...(searchTerm && { search: searchTerm }),
				sort,
				sortOrder,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			
			let filteredData = response.data
			filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
			setExpenseData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}
	
	useEffect(() => {
		if (selectedDateRange) {
			fetchExpenseInsightData()
		}
	}, [selectedDateRange])

	const fetchExpenseInsightData = async () => {
		let startDate: Date
		let endDate: Date

		if (selectedDateRange) {
			;[startDate, endDate] = selectedDateRange
		} else {
			startDate = new Date(0)
			endDate = new Date()
		}
		try {
			const response: any = await GetExpenseInsights({
				expense_company: 'FG Group',
				from_date: startDate,
				to_date: endDate,
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

	const downloadExcel = () => {
		const worksheetData = expenseData.map((invoice: any, index: number) => {
			return {
				'No.': index + 1,
				'Expenses No.': invoice.expense_number || 'N/A',
				'Expenses Category': invoice.expense_category || 'N/A',
				'Payment Method': invoice.payment_method || 'N/A',
				'Total Amount': invoice.total_amount || 'N/A',
				Date: invoice.date || 'N/A',
				'Expense Notes': invoice.note || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
		XLSX.writeFile(workbook, 'ExpenseData.xlsx')
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Expenses No.', field: 'expense_number' },
		{ title: 'Expenses Category', field: 'expense_category' },
		{ title: 'Payment Method', field: 'payment_method' },
		{ title: 'Total Amount', field: 'total_amount' },
		{ title: 'Date', field: 'date' },
		{ title: 'Notes', field: 'note' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Expenses Details</PageTitle>

			<div className='row g-5 g-xl-8'>
				<div className='col-lg-3'>
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
								to={'/fgiit/create-expense'}
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
						<div className='col-6'>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<div className='col-3'>
							<LengthMenu
								expenseData={expenseData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
						<div className='col-3'>
							<button
								className='btn btn-success'
								onClick={downloadExcel}
								disabled={loading}>
								<FontAwesomeIcon
									icon={faDownload}
									className='fs-3'
								/>
							</button>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={expenseData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(expense: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={expense._id}>
									<tr
										onClick={() => handleRowClick(expense._id)}
										className='data-row'>
										<td className='text-center'>
											<FontAwesomeIcon
												icon={faPlusCircle}
												className='mx-1 mb-1 plus-icon'
												style={{ color: '#607D8B', fontSize: '18px' }}
											/>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense.expense_number}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense.expense_category}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense.payment_method}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense.total_amount}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(expense.date).format('YYYY/MM/DD h:mm A')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense.note}
											</span>
										</td>
										<td>
											<TableButton
												action='edit'
												to={`/fgiit/expense-update?expense_id=` + expense._id}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}:</strong> {expense.expense_number}
													<br />
													<strong>{sortableFields[1].title}:</strong> {expense.expense_category}
													<br />
													<strong>{sortableFields[2].title}:</strong> {expense.payment_method}
													<br />
													<strong>{sortableFields[3].title}:</strong> {expense.total_amount}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{DayJS(expense.date).format('YYYY/MM/DD h:mm A')}
													<br />
													<strong>{sortableFields[5].title}:</strong>
													{expense.note}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{expenseData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{expenseData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default ExpenseListDetailsFgiit
