import { faDownload, faHandHoldingDollar, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
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

const ExpenseListDetailsNutrition: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [expenseData, setExpenseData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [metaData, setMetaData] = useState<any>()
	const [ExpenseInsightData, setExpenseInsightData] = useState<any>({})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const adminType = localStorage.getItem('admin')

	useEffect(() => {
		fetchExpenseData()
	}, [selectedDateRange, pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const isFirstRender = useRef(true)

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
				expense_company: adminType == 'Store' ? adminType : 'Gomzi Nutrition',
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

			// Sort the filteredData array by createdAt date in descending order
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
				expense_company: adminType == 'Store' ? adminType : 'Gomzi Nutrition',
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

	const filteredExpenseData = expenseData.filter(
		(invoice: any) =>
			invoice.expense_category &&
			invoice.expense_category.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedExpenseData = filteredExpenseData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const downloadExcel = async () => {
		try {
			setExporting(true)
			const toastId = toast.loading('Preparing expense export...')

			let exportData = expenseData

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
					expense_company: adminType == 'Store' ? adminType : 'Gomzi Nutrition',
					from_date: startDate,
					to_date: endDate,
					page: 1,
					limit: 5000,
					...(searchTerm && { search: searchTerm }),
					sort,
					sortOrder,
				})
				if (response?.data && response.data.length > 0) {
					exportData = response.data
				}
			} catch (e) {
				console.warn('Fallback to current page expense data', e)
			}

			if (exportData.length === 0) {
				toast.dismiss(toastId)
				toast.error('No expense data to export')
				return
			}

			const worksheetData = exportData.map((invoice: any, index: number) => {
				return {
					'No.': index + 1,
					'Expenses No.': invoice.expense_number || 'N/A',
					'Expenses Category': invoice.expense_category || 'N/A',
					'Payment Method': invoice.payment_method || 'N/A',
					'Total Amount': invoice?.total_amount || 0,
					'Date': invoice.date ? DayJS(invoice.date).format('DD/MM/YYYY') : 'N/A',
					'Expense Notes': invoice.note || 'N/A',
				}
			})

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')
			XLSX.writeFile(workbook, `ExpenseData_${DayJS().format('YYYY-MM-DD')}.xlsx`)
			toast.dismiss(toastId)
			toast.success(`${exportData.length} expenses exported successfully`)
		} catch (error) {
			console.error('Error exporting expenses:', error)
			toast.error('Failed to export expenses')
		} finally {
			setExporting(false)
		}
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
				<div className='col-lg-4'>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faHandHoldingDollar}
						color='primary'
						title={ExpenseInsightData?.total_amount}
						description='Total Expenses'
					/>
				</div>
			</div>
			<KTCard>
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex align-items-center justify-content-between flex-wrap w-100 gap-3'>
						<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
							{/* 1. Searchbar */}
							<div>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
									className='me-0'
								/>
							</div>

							{/* 2. Dropdown (show entries per page) */}
							<div>
								<LengthMenu
									expenseData={expenseData}
									handleItemsPerPageChange={handleItemsPerPageChange}
									value={pagination.itemsPerPage}
									className='me-0'
								/>
							</div>

							{/* 3. Download Excel Button */}
							<div>
								<button
									type='button'
									className='btn btn-icon d-flex align-items-center justify-content-center'
									onClick={downloadExcel}
									disabled={exporting}
									style={{
										width: '38px',
										height: '38px',
										minWidth: '38px',
										padding: 0,
										borderRadius: '8px',
										fontSize: '14px',
										backgroundColor: '#ffffff',
										border: '1px solid #DFE7F0',
										color: '#1E3A5F',
										boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
										transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
										cursor: exporting ? 'not-allowed' : 'pointer',
									}}
									onMouseEnter={(e) => {
										if (!exporting) {
											e.currentTarget.style.backgroundColor = '#1E3A5F'
											e.currentTarget.style.borderColor = '#1E3A5F'
											e.currentTarget.style.color = '#ffffff'
											e.currentTarget.style.boxShadow = '0 4px 10px rgba(30, 58, 95, 0.25)'
											e.currentTarget.style.transform = 'translateY(-1px)'
										}
									}}
									onMouseLeave={(e) => {
										if (!exporting) {
											e.currentTarget.style.backgroundColor = '#ffffff'
											e.currentTarget.style.borderColor = '#DFE7F0'
											e.currentTarget.style.color = '#1E3A5F'
											e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
											e.currentTarget.style.transform = 'translateY(0)'
										}
									}}
									title='Download Excel'>
									{exporting ? (
										<span
											className='spinner-border spinner-border-sm'
											role='status'
											aria-hidden='true'></span>
									) : (
										<FontAwesomeIcon icon={faDownload} />
									)}
								</button>
							</div>

							{/* 4. Datefilter */}
							<div className='d-flex align-items-center flex-shrink-0'>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
								/>
							</div>
						</div>

						{/* 5. End me right side Add Expense Button */}
						<div className='flex-shrink-0 ms-auto'>
							<TableButton
								action='add'
								to={'/rag/expense/create'}
								text='Add Expense'
							/>
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
										onClick={() => handleRowClick(expense?._id)}
										className='data-row'>
										<td className='text-center'>
											<FontAwesomeIcon
												icon={faPlusCircle}
												className='mx-1 mb-1 plus-icon'
												style={{ color: '#607D8B', fontSize: '18px' }}
											/>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense?.expense_number}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense?.expense_category}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense?.payment_method}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense?.total_amount}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(expense?.date).format('YYYY/MM/DD')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{expense?.note}</span>
										</td>
										<td>
											<TableButton
												action='edit'
												to={`/rag/expense/update?expense_id=` + expense?._id}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}:</strong> {expense?.expense_number}
													<br />
													<strong>{sortableFields[1].title}:</strong> {expense?.expense_category}
													<br />
													<strong>{sortableFields[2].title}:</strong> {expense?.payment_method}
													<br />
													<strong>{sortableFields[3].title}:</strong> {expense?.total_amount}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{DayJS(expense?.date).format('YYYY/MM/DD h:mm A')}
													<br />
													<strong>{sortableFields[5].title}:</strong>
													{expense?.note}
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

export default ExpenseListDetailsNutrition
