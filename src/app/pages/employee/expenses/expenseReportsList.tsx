import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { DeleteExpenseReport, GetExpenseReports } from '../../../Functions/FGGroup/ExpenseReport'

interface PaginationState {
	page: number
	itemsPerPage: number
}

const EmployeeExpenseReportsList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState(
		() => localStorage.getItem('emp_expense_report_searchTerm') || ''
	)
	const [expenseReports, setExpenseReports] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		const storedRange =
			localStorage.getItem('emp_expense_report_selectedDateRange') ||
			localStorage.getItem('selectedDateRange')
		if (storedRange) {
			try {
				const parsed = JSON.parse(storedRange)
				return [new Date(parsed[0]), new Date(parsed[1])]
			} catch (e) {
				return null
			}
		}
		return null
	})

	let navigate = useNavigate()

	const [pagination, setPagination] = useState<PaginationState>(() => {
		try {
			const saved = localStorage.getItem('emp_expense_report_pagination')
			return saved ? JSON.parse(saved) : { page: 1, itemsPerPage: 10 }
		} catch (e) {
			return { page: 1, itemsPerPage: 10 }
		}
	})

	const fetchExpenseReports = async (page?: number) => {
		setLoading(true)
		try {
			const fgGroupInfo = localStorage.getItem('fg_group_info')
			let employeeId = null
			if (fgGroupInfo) {
				const parsedInfo = JSON.parse(fgGroupInfo)
				employeeId = parsedInfo._id
			}

			if (!employeeId) {
				console.error('Employee ID not found')
				setLoading(false)
				return
			}

			const queryParams: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
				employee_id: employeeId,
			}

			if (selectedDateRange) {
				queryParams.from_date = selectedDateRange[0].toISOString()
				queryParams.to_date = selectedDateRange[1].toISOString()
			}

			const response = await GetExpenseReports(queryParams)
			setExpenseReports(response.data || [])

			if (
				response.metadata &&
				typeof response.metadata === 'object' &&
				'pagination' in response.metadata
			) {
				const metadata = response.metadata as { pagination: any }
				setMetaData(metadata.pagination)
			}
		} catch (error) {
			console.error('Error fetching expense reports:', error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchExpenseReports()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange, searchTerm])

	const isFirstRender = React.useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		localStorage.setItem('emp_expense_report_searchTerm', searchTerm)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	useEffect(() => {
		if (selectedDateRange) {
			localStorage.setItem(
				'emp_expense_report_selectedDateRange',
				JSON.stringify(selectedDateRange)
			)
		} else {
			localStorage.removeItem('emp_expense_report_selectedDateRange')
		}
	}, [selectedDateRange])

	useEffect(() => {
		localStorage.setItem('emp_expense_report_pagination', JSON.stringify(pagination))
	}, [pagination])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const sortableFields = [
		{ title: 'Purpose', field: 'purpose' },
		{ title: 'Total Amount', field: 'total_amount' },
		{ title: 'Status', field: 'status' },
		{ title: 'Created At', field: 'createdAt' },
	]

	const handleSortChange = (newSort: string, newSortOrder: any) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		const isSame =
			(!range && !selectedDateRange) ||
			(range &&
				selectedDateRange &&
				range[0].getTime() === selectedDateRange[0].getTime() &&
				range[1].getTime() === selectedDateRange[1].getTime())

		if (!isSame) {
			setSelectedDateRange(range)
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}

	const handleViewReport = (reportId: string) => {
		navigate(`/employee/expense-view?id=${reportId}`)
	}

	const handleDeleteReport = async (reportId: string, reportName: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `Do you want to delete the expense report "${reportName}"?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		})

		if (result.isConfirmed) {
			try {
				await DeleteExpenseReport({ id: reportId })
				Swal.fire('Deleted!', 'The expense report has been deleted.', 'success')
				fetchExpenseReports()
			} catch (error) {
				console.error('Error deleting expense report:', error)
				Swal.fire('Error!', 'Failed to delete expense report.', 'error')
			}
		}
	}

	const handleCreateReport = () => {
		navigate('/employee/expense-create')
	}

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case 'Approved':
				return 'badge badge-success'
			case 'Rejected':
				return 'badge badge-danger'
			case 'Pending':
				return 'badge badge-warning'
			default:
				return 'badge badge-secondary'
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>My Expense Reports</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<h2>My Expense Reports</h2>
					</div>
					<div className='card-toolbar'>
						<button
							type='button'
							className='btn btn-primary'
							onClick={handleCreateReport}>
							<i className='fas fa-plus-circle me-2'></i>
							Create Expense Report
						</button>
					</div>
				</div>
				<div className='row card-header border-0 pt-0 align-items-center ms-0 mx-md-6 p-0'>
					<div className='col-md-12'>
						<div className='row mt-3 justify-content-between'>
							<div className='col-md-4 mt-md-7 mb-0 d-flex card-toolbar p-0'>
								<div className='d-md-flex'>
									<div className='d-md-flex me-3'>
										{expenseReports?.length > 0 && (
											<select
												className='form-select form-select-sm mx-3'
												style={{ width: '80px' }}
												value={pagination.itemsPerPage}
												onChange={(e) =>
													setPagination((prev) => ({
														...prev,
														itemsPerPage: Number(e.target.value),
														page: 1,
													}))
												}>
												<option value='10'>10</option>
												<option value='50'>50</option>
												<option value='100'>100</option>
											</select>
										)}
									</div>
									<DateFilter
										onDateRangeChange={handleDateRangeChange}
										leftValue='-270px'
										storageKey='emp_expense_report_selectedDateRange'
									/>
								</div>
							</div>
							<div className='col-md-3 mt-md-7 mt-2 mb-0 d-flex p-0 justify-content-end position-relative'>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={expenseReports}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							disableSortFields={['purpose', 'total_amount', 'status', 'createdAt']}
							onSortChange={handleSortChange}
							renderRow={(report: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={report._id}>
									<tr
										onClick={() => handleRowClick(report._id)}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{report.purpose}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												₹{report.total_amount?.toFixed(2) || '0.00'}
											</span>
										</td>
										<td>
											<span className={getStatusBadgeClass(report.status || 'Pending')}>
												{report.status || 'Pending'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{DayJS(report.createdAt).format('DD/MM/YYYY')}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center gap-2'>
												<button
													className='btn btn-info btn-sm'
													onClick={() => handleViewReport(report._id)}>
													<i className='fas fa-eye p-0'></i>
												</button>
												<button
													className='btn btn-danger btn-sm'
													onClick={(e) => {
														e.stopPropagation()
														handleDeleteReport(report._id, report.purpose)
													}}>
													<i className='fas fa-trash p-0'></i>
												</button>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>Purpose:</strong> {report.purpose}
													<br />
													<strong>Total Amount:</strong> ₹
													{report.total_amount?.toFixed(2) || '0.00'}
													<br />
													<strong>Status:</strong>
													<span className={getStatusBadgeClass(report.status || 'Pending')}>
														{report.status || 'Pending'}
													</span>
													<br />
													<strong>Created At:</strong>{' '}
													{DayJS(report.createdAt).format('DD/MM/YYYY HH:mm')}
													<br />
													{report.remarks && (
														<>
															<strong>Remarks:</strong> {report.remarks}
															<br />
														</>
													)}
													{report.rejected_reason && (
														<>
															<strong>Rejection Reason:</strong> {report.rejected_reason}
															<br />
														</>
													)}
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
					{expenseReports.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No expense reports found</b>
						</div>
					)}

					{metaData && expenseReports.length > 0 && (
						<UsersListPagination
							totalPages={metaData.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default EmployeeExpenseReportsList
