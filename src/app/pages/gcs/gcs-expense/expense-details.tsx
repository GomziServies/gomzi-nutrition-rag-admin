import {
	faDownload,
	faHandHoldingDollar,
	faHandshake,
	faPlusCircle,
	faRectangleAd,
} from '@fortawesome/free-solid-svg-icons'
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
import { GetExpenses } from '../../../Functions/GCS'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const ExpenseListDetails: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [expenseData, setExpenseData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [metaData, setMetaData] = useState<any>()
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	useEffect(() => {
		fetchExpenseData()
	}, [selectedDateRange, pagination.page, pagination.itemsPerPage, sort, sortOrder])

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

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

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
			const response: any = await GetExpenses({
				from_date: startDate,
				to_date: endDate,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm ? searchTerm : undefined,
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

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const filteredExpenseData = expenseData.filter(
		(invoice: any) =>
			invoice.expenseName && invoice.expenseName.toLowerCase().includes(searchTerm.toLowerCase())
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
		(sum: number, expense: any) => sum + parseFloat(expense.expenseAmount),
		0
	)

	// Calculate total amount for Counselling
	const totalCounsellingAmount = counsellingExpenses.reduce(
		(sum: number, expense: any) => sum + parseFloat(expense.expenseAmount),
		0
	)

	const totalAmount = expenseData.reduce(
		(sum: number, invoice: any) => sum + parseFloat(invoice.expenseAmount),
		0
	)
	const [adminData, setAdminData] = useState({
		name: '',
		email: '',
		password: '',
		branch: '',
		type: '',
		mobile: '',
	})
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setAdminData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}
	// Format amounts
	const formattedTotalAdsAmount = totalAdsAmount.toLocaleString()
	const formattedTotalCounsellingAmount = totalCounsellingAmount.toLocaleString()
	const formattedTotalAmount = totalAmount.toLocaleString()

	const downloadExcel = () => {
		const worksheetData = expenseData.map((invoice: any, index: number) => {
			return {
				'No.': index + 1,
				'Expenses Category': invoice.expenseName || 'N/A',
				'Payment Method': invoice.expensePaymentMethod || 'N/A',
				'Total Amount': invoice.expenseAmount || 'N/A',
				Date: invoice.date || 'N/A',
				'Expense Notes': invoice.expenseNotes || 'N/A',
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
		{ title: 'Expense No.', field: 'id' },
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
						title={formattedTotalAmount}
						description='Total Expenses'
					/>
				</div>

				<div className='col-lg-4'>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faRectangleAd}
						color='primary'
						title={formattedTotalAdsAmount}
						description='Total Ads'
					/>
				</div>

				<div className='col-lg-4'>
					<StatisticsWidget2
						className='card-xl-stretch mb-5 mb-xl-8'
						Icon={faHandshake}
						color='primary'
						title={formattedTotalCounsellingAmount}
						description='Total Consulting'
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
								to={'/gcs/gcs-create-expense'}
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
												{expense.expenseName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense.expensePaymentMethod}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense.expenseAmount}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(expense.date).format('YYYY/MM/DD h:mm A')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{expense.expenseNotes}
											</span>
										</td>
										<td>
											<TableButton
												action='edit'
												to={`/gcs/gcs-expense-update?expense_id=` + expense._id}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}:</strong> {expense.expense_number}
													<br />
													<strong>{sortableFields[1].title}:</strong> {expense.expenseName}
													<br />
													<strong>{sortableFields[2].title}:</strong> {expense.expensePaymentMethod}
													<br />
													<strong>{sortableFields[3].title}:</strong> {expense.expenseAmount}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{DayJS(expense.date).format('YYYY/MM/DD h:mm A')}
													<br />
													<strong>{sortableFields[5].title}:</strong>
													{expense.expenseNotes}
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

export default ExpenseListDetails
