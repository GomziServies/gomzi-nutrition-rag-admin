import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import {
	ActionExpenseReport,
	DeleteExpenseReport,
	GetExpenseReports,
} from '../../../Functions/FGGroup/ExpenseReport'

interface PaginationState {
	page: number
	itemsPerPage: number
}

const ExpenseReportsList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState(
		() => localStorage.getItem('expense_report_searchTerm') || ''
	)
	const [expenseReports, setExpenseReports] = useState<any[]>([])
	const [employeeDataList, setEmployeeDataList] = useState<any[]>([])
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(() => {
		try {
			const saved = localStorage.getItem('expense_report_selectedEmployee')
			return saved ? JSON.parse(saved) : null
		} catch (e) {
			return null
		}
	})
	const [selectedStatus, setSelectedStatus] = useState<
		'Select' | 'Pending' | 'Approved' | 'Rejected'
	>(() => (localStorage.getItem('expense_report_selectedStatus') as any) || 'Select')
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		const storedRange =
			localStorage.getItem('expense_report_selectedDateRange') ||
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
	const [selectedReports, setSelectedReports] = useState<string[]>([])
	const [selectAll, setSelectAll] = useState(false)
	const [submitLoading, setSubmitLoading] = useState(false)
	const isDateFilterInitialRender = React.useRef(true)

	let navigate = useNavigate()

	const [pagination, setPagination] = useState<PaginationState>(() => {
		try {
			const saved = localStorage.getItem('expense_report_pagination')
			return saved ? JSON.parse(saved) : { page: 1, itemsPerPage: 10 }
		} catch (e) {
			return { page: 1, itemsPerPage: 10 }
		}
	})

	const handleReportSelection = (reportId: string, isChecked: boolean) => {
		if (isChecked) {
			setSelectedReports((prev) => [...prev, reportId])
		} else {
			setSelectedReports((prev) => prev.filter((id) => id !== reportId))
			setSelectAll(false)
		}
	}

	const handleSelectAll = (isChecked: boolean) => {
		setSelectAll(isChecked)
		if (isChecked) {
			const pendingReportIds = expenseReports
				.filter((report) => report.status === 'Pending')
				.map((report) => report._id)
			setSelectedReports(pendingReportIds)
		} else {
			setSelectedReports([])
		}
	}

	const handleBulkApproval = async () => {
		if (selectedReports.length === 0) {
			toast.error('Please select at least one expense report to approve.')
			return
		}

		const result = await Swal.fire({
			icon: 'question',
			title: 'Are you sure?',
			text: `Do you want to approve ${selectedReports.length} expense report(s)?`,
			showCancelButton: true,
			confirmButtonText: 'Yes, approve them!',
			cancelButtonText: 'Cancel',
		})

		if (result.isConfirmed) {
			try {
				setSubmitLoading(true)
				const promises = selectedReports.map((reportId) => {
					return ActionExpenseReport({
						id: reportId,
						action: 'Approved',
					})
				})

				await Promise.all(promises)

				toast.success(`${selectedReports.length} expense report(s) approved successfully!`)

				setSelectedReports([])
				setSelectAll(false)
				fetchExpenseReports()
			} catch (error: any) {
				console.error('Error approving expense reports:', error)
				toast.error('Error approving expense reports: ' + (error.message || 'Unknown error'))
			} finally {
				setSubmitLoading(false)
			}
		}
	}

	const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		if (event.target instanceof HTMLSelectElement) {
			const status = event.target.value as 'Select' | 'Pending' | 'Approved' | 'Rejected'
			setSelectedStatus(status)
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}

	const fetchExpenseReports = async (page?: number) => {
		setLoading(true)
		try {
			const queryParams: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			}

			if (selectedEmployee?.id) {
				queryParams.employee_id = selectedEmployee.id
			}

			if (selectedStatus !== 'Select') {
				queryParams.status = selectedStatus
			}

			if (selectedDateRange) {
				queryParams.from_date = selectedDateRange[0].toISOString()
				queryParams.to_date = selectedDateRange[1].toISOString()
			}

			const response = await GetExpenseReports(queryParams)

			const sortedReports = [...(response.data || [])].sort((a, b) => {
				const statusPriority: Record<string, number> = {
					Pending: 1,
					Approved: 2,
					Rejected: 3,
				}

				const priorityA = statusPriority[a.status] || 4
				const priorityB = statusPriority[b.status] || 4

				return priorityA - priorityB
			})

			setExpenseReports(sortedReports)

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

	const fetchEmployeeData = async () => {
		try {
			const response = await GetEmployees()
			const filteredData: any = response.data || []
			setEmployeeDataList(filteredData.map((el: any) => ({ name: el.full_name, id: el._id })))
		} catch (error) {
			console.error('Error fetching employees:', error)
		}
	}

	useEffect(() => {
		fetchExpenseReports()
		fetchEmployeeData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedEmployee,
		selectedStatus,
		searchTerm,
	])

	const isFirstRender = React.useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		localStorage.setItem('expense_report_searchTerm', searchTerm)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	useEffect(() => {
		localStorage.setItem('expense_report_selectedEmployee', JSON.stringify(selectedEmployee))
	}, [selectedEmployee])

	useEffect(() => {
		localStorage.setItem('expense_report_selectedStatus', selectedStatus)
	}, [selectedStatus])

	useEffect(() => {
		if (selectedDateRange) {
			localStorage.setItem('expense_report_selectedDateRange', JSON.stringify(selectedDateRange))
		} else {
			localStorage.removeItem('expense_report_selectedDateRange')
		}
	}, [selectedDateRange])

	useEffect(() => {
		localStorage.setItem('expense_report_pagination', JSON.stringify(pagination))
	}, [pagination])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const sortableFields = [
		{ title: 'Select', field: 'select' },
		{ title: 'Employee Name', field: 'employee_name' },
		{ title: 'Purpose', field: 'purpose' },
		{ title: 'Total Amount', field: 'total_amount' },
		{ title: 'Status', field: 'status' },
		{ title: 'Created At', field: 'createdAt' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
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

	const handleEmployeeSelect = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		if (event.target instanceof HTMLSelectElement) {
			const selectedName = event.target.value

			if (selectedName === 'Select') {
				setSelectedEmployee(null)
			} else {
				const selectedEmployeeObj = employeeDataList.find((el: any) => el.name === selectedName)
				setSelectedEmployee(selectedEmployeeObj)
			}
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}

	const handleViewReport = (reportId: string) => {
		navigate(`/hr/expense-view?id=${reportId}`)
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
			<PageTitle breadcrumbs={[]}>Expense Reports</PageTitle>
			<KTCard>
				{submitLoading && (
					<div className='loader-background'>
						<div
							className='spinner-border spinner-border-1 text-white'
							style={{ width: '50px', height: '50px' }}
							role='status'>
							<span className='visually-hidden'>Processing...</span>
						</div>
					</div>
				)}

				<h2 className='m-6 mb-0'>Expense Reports</h2>
				<div className='row card-header border-0 pt-0 align-items-center ms-0 mx-md-6 p-0'>
					<div className='col-md-12'>
						<div className='row mt-3 justify-content-between'>
							<div className='col-md-3 fv-row ps-md-0'>
								<SelectField
									className='fv-row m-0'
									label='Select Employee'
									name='employee'
									value={selectedEmployee?.name || 'Select'}
									onChange={handleEmployeeSelect}
									htmlFor='employee'
									options={['Select', ...employeeDataList.map((el: any) => el.name)]}
									marginRemove={true}
								/>
							</div>
							<div className='col-md-2 fv-row ps-md-2'>
								<SelectField
									className='fv-row m-0'
									label='Select Status'
									name='status'
									value={selectedStatus}
									onChange={handleStatusChange}
									htmlFor='status'
									options={['Select', 'Pending', 'Approved', 'Rejected']}
									marginRemove={true}
								/>
							</div>
							<div className='col-md-4 mt-md-7 mb-0 d-flex justify-content-end align-items-end card-toolbar'>
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
										rightValue='-60px'
										storageKey='expense_report_selectedDateRange'
									/>
								</div>
							</div>
							<div className='col-md-3 mt-md-7 mt-2 mb-0 d-flex align-items-end justify-content-end position-relative p-0'>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
							</div>
						</div>
					</div>
				</div>
				{expenseReports.some((report) => report.status === 'Pending') && (
					<div className='row align-items-center ms-0 mx-md-6 p-0 my-6'>
						<div className='col-md-6'>
							<div className='d-flex align-items-center mt-3'>
								<div className='form-check form-check-custom form-check-solid me-3'>
									<input
										className='form-check-input'
										type='checkbox'
										id='selectAll'
										checked={selectAll}
										onChange={(e) => handleSelectAll(e.target.checked)}
									/>
									<label
										className='form-check-label fw-bold'
										htmlFor='selectAll'>
										Select All Pending Reports (
										{expenseReports.filter((report) => report.status === 'Pending').length})
									</label>
								</div>
							</div>
						</div>
						<div className='col-md-6 text-end'>
							<button
								onClick={handleBulkApproval}
								className={`btn btn-success btn-sm ${
									selectedReports.length > 0 ? '' : 'invisible'
								}`}
								disabled={submitLoading}>
								<i className='fas fa-check-circle me-1'></i>
								Approve {selectedReports.length} Report{selectedReports.length !== 1 ? 's' : ''}
							</button>
						</div>
					</div>
				)}
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={expenseReports}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							disableSortFields={[
								'select',
								'employee_name',
								'purpose',
								'total_amount',
								'status',
								'createdAt',
							]}
							onSortChange={handleSortChange}
							renderRow={(report: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={report._id}>
									<tr
										onClick={() => handleRowClick(report._id)}
										className='data-row'>
										<td className='text-center'>
											<div className='d-flex align-items-center justify-content-center'>
												<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
													{actualIndex}
												</span>
											</div>
										</td>
										<td className='text-center'>
											{report.status === 'Pending' ? (
												<div className='form-check form-check-custom form-check-solid d-flex align-items-center justify-content-center'>
													<input
														className='form-check-input'
														type='checkbox'
														checked={selectedReports.includes(report._id)}
														onChange={(e) => handleReportSelection(report._id, e.target.checked)}
														onClick={(e) => e.stopPropagation()}
													/>
												</div>
											) : (
												<span className='text-muted'>-</span>
											)}
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{report.employee_name || 'Unknown Employee'}
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
										<td className='text-center py-4'>
											<div className='d-flex align-items-center justify-content-center gap-2'>
												<TableButton
													action='view'
													onClick={(e) => {
														e.stopPropagation()
														handleViewReport(report._id)
													}}
												/>
												<TableButton
													action='remove'
													onClick={(e) => {
														e.stopPropagation()
														handleDeleteReport(report._id, report.purpose)
													}}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={13}>
												<div>
													<strong>Employee Name:</strong>{' '}
													{report.employee_name || 'Unknown Employee'}
													<br />
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

export default ExpenseReportsList
