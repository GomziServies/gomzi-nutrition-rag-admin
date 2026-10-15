import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
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
			const rawInfo =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			let employeeId = null
			if (rawInfo) {
				try {
					const parsedInfo = JSON.parse(rawInfo)
					employeeId = parsedInfo._id || parsedInfo.employee_id
				} catch (e) {
					console.error('Error parsing employee info:', e)
				}
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
		localStorage.setItem('emp_expense_report_searchTerm', searchTerm)
	}, [searchTerm])

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
				return 'badge badge-light-success px-3 py-2 fs-7 fw-semibold'
			case 'Rejected':
				return 'badge badge-light-danger px-3 py-2 fs-7 fw-semibold'
			case 'Pending':
				return 'badge badge-light-warning px-3 py-2 fs-7 fw-semibold'
			default:
				return 'badge badge-light-secondary px-3 py-2 fs-7 fw-semibold'
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>My Expense Reports</PageTitle>

			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				{/* Modern Header */}
				<div className='card-header border-0 pt-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div>
						<div className='d-flex align-items-center gap-2'>
							<h2 className='fw-bolder text-gray-900 mb-0'>My Expense Reports</h2>
							<span className='badge badge-light-primary fw-bold fs-8'>
								{metaData?.totalDocs || expenseReports.length} records
							</span>
						</div>
						<span className='text-muted fs-7 fw-semibold mt-1'>
							Submit expense claims, track reimbursement approvals, and review disbursements
						</span>
					</div>

					<div className='d-flex align-items-center flex-wrap gap-3'>
						<LengthMenu
							expenseData={expenseReports}
							handleItemsPerPageChange={(val) =>
								setPagination((prev) => ({ ...prev, itemsPerPage: val, page: 1 }))
							}
						/>

						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							leftValue='-270px'
							storageKey='emp_expense_report_selectedDateRange'
						/>

						<div style={{ minWidth: '220px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search expense reports...'
							/>
						</div>

						<button
							type='button'
							className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '10px' }}
							onClick={handleCreateReport}>
							<i className='bi bi-plus-lg fs-6'></i>
							<span>Create Report</span>
						</button>
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
											<span className='text-dark fw-bolder d-block mb-1 fs-6 text-primary'>
												₹{Number(report.total_amount || 0).toLocaleString('en-IN', {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
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
										<td className='text-center py-4'>
											<div className='d-flex align-items-center justify-content-center gap-2'>
												<TableButton
													action='view'
													onClick={(e) => {
														e.stopPropagation()
														handleViewReport(report._id)
													}}
												/>
												{report.status === 'Pending' && (
													<>
														<TableButton
															action='edit'
															onClick={(e) => {
																e.stopPropagation()
																navigate(`/employee/expense-edit?id=${report._id}`)
															}}
														/>
														<TableButton
															action='remove'
															onClick={(e) => {
																e.stopPropagation()
																handleDeleteReport(report._id, report.purpose)
															}}
														/>
													</>
												)}
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div className='p-3 bg-light rounded-3'>
													<div className='row g-3'>
														<div className='col-md-4'>
															<strong className='text-gray-700'>Purpose:</strong>
															<div className='text-gray-900'>{report.purpose}</div>
														</div>
														<div className='col-md-4'>
															<strong className='text-gray-700'>Total Amount:</strong>
															<div className='text-primary fw-bold'>
																₹{Number(report.total_amount || 0).toLocaleString('en-IN', {
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																})}
															</div>
														</div>
														<div className='col-md-4'>
															<strong className='text-gray-700'>Status:</strong>
															<div>
																<span className={getStatusBadgeClass(report.status || 'Pending')}>
																	{report.status || 'Pending'}
																</span>
															</div>
														</div>
														<div className='col-md-4'>
															<strong className='text-gray-700'>Created At:</strong>
															<div className='text-gray-800'>
																{DayJS(report.createdAt).format('DD/MM/YYYY HH:mm')}
															</div>
														</div>
														{report.remarks && (
															<div className='col-md-8'>
																<strong className='text-gray-700'>Remarks:</strong>
																<div className='text-gray-800'>{report.remarks}</div>
															</div>
														)}
														{report.rejected_reason && (
															<div className='col-12'>
																<strong className='text-danger'>Rejection Reason:</strong>
																<div className='text-danger'>{report.rejected_reason}</div>
															</div>
														)}
													</div>
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
						<div className='d-flex flex-column align-items-center justify-content-center text-center py-10 w-100'>
							<div
								className='rounded-circle d-flex align-items-center justify-content-center mb-3'
								style={{ width: '56px', height: '56px', background: '#eff6ff' }}>
								<i className='bi bi-receipt fs-2' style={{ color: '#2563EB' }}></i>
							</div>
							<span className='fw-bold text-gray-700 fs-6'>No expense reports found</span>
							<span className='text-muted fs-7'>No expense reports recorded for the selected date range.</span>
						</div>
					)}

					{expenseReports.length > 0 && (
						<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
							<div className='text-muted fs-7 fw-semibold'>
								Showing {Math.min((pagination.page - 1) * pagination.itemsPerPage + 1, metaData?.totalDocs || expenseReports.length)} to{' '}
								{Math.min(pagination.page * pagination.itemsPerPage, metaData?.totalDocs || expenseReports.length)} of {metaData?.totalDocs || expenseReports.length} records
							</div>
							{metaData && (
								<UsersListPagination
									totalPages={metaData.totalPages}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default EmployeeExpenseReportsList
