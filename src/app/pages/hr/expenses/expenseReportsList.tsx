import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import SearchFilter from '../../../components/SearchFilter'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
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

	const handleStatusChange = (event: any) => {
		const status = (typeof event === 'object' && event?.target ? event.target.value : event) as
			| 'Select'
			| 'Pending'
			| 'Approved'
			| 'Rejected'
		setSelectedStatus(status || 'Select')
		setPagination((prev) => ({ ...prev, page: 1 }))
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
		fetchEmployeeData()
	}, [])

	useEffect(() => {
		fetchExpenseReports()
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

	const handleEmployeeSelect = (event: any) => {
		const selectedName = typeof event === 'object' && event?.target ? event.target.value : event

		if (!selectedName || selectedName === 'Select') {
			setSelectedEmployee(null)
		} else {
			const selectedEmployeeObj = employeeDataList.find((el: any) => el.name === selectedName)
			setSelectedEmployee(selectedEmployeeObj)
		}
		setPagination((prev) => ({ ...prev, page: 1 }))
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
				return 'badge badge-light-success text-success fw-bold px-3 py-1.5 fs-7'
			case 'Rejected':
				return 'badge badge-light-danger text-danger fw-bold px-3 py-1.5 fs-7'
			case 'Pending':
				return 'badge badge-light-warning text-warning fw-bold px-3 py-1.5 fs-7'
			default:
				return 'badge badge-light-secondary text-dark fw-bold px-3 py-1.5 fs-7'
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Expense Reports</PageTitle>

			{/* Page Header Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '14px',
					border: '1px solid #E4EAF2',
					background: '#ffffff',
					boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
				}}>
				<div className='card-body p-6 d-flex flex-wrap align-items-center justify-content-between gap-4'>
					<div className='d-flex align-items-center gap-4'>
						<div
							className='d-flex align-items-center justify-content-center flex-shrink-0'
							style={{
								width: '52px',
								height: '52px',
								borderRadius: '12px',
								background: '#EAF1FB',
								border: '1px solid #DCE8F8',
							}}>
							<i className='bi bi-receipt-cutoff fs-2' style={{ color: '#172B4D' }}></i>
						</div>
						<div>
							<h2 className='fw-bold fs-3 m-0' style={{ color: '#142447' }}>
								Expense Reports
							</h2>
							<span className='fs-7' style={{ color: '#71809A' }}>
								Manage employee expense submissions, receipts, and disbursement approvals
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Filter Toolbar (Order: SearchFilter -> LengthMenu -> Employee -> Status -> Spacer -> DateFilter) */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center flex-wrap gap-3'>
					{/* 1. Searchbar */}
					<div style={{ minWidth: '240px', maxWidth: '340px', flex: '1 1 240px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search by employee, purpose, description...'
							className='me-0'
						/>
					</div>

					{/* 2. Page Size / Length Menu */}
					<div>
						<LengthMenu
							data={expenseReports}
							itemsPerPage={pagination.itemsPerPage}
							handleItemsPerPageChange={(value) =>
								setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
							}
							className='me-0'
						/>
					</div>

					{/* 3. Download Excel Button */}
					<div>
						<DownloadExcelButton
							data={expenseReports}
							columns={sortableFields}
							filename='Expense_Reports'
						/>
					</div>

					{/* 4. Employee Select */}
					<div style={{ minWidth: '190px' }}>
						<SelectField
							showLabel={false}
							marginRemove={true}
							className='mb-0'
							height='38px'
							name='employee'
							value={selectedEmployee?.name || ''}
							defaultLabel='All Employees'
							options={employeeDataList.map((el: any) => ({ label: el.name, value: el.name }))}
							onChange={handleEmployeeSelect}
						/>
					</div>

					{/* 5. Status Select */}
					<div style={{ minWidth: '160px' }}>
						<SelectField
							showLabel={false}
							marginRemove={true}
							className='mb-0'
							height='38px'
							name='status'
							value={selectedStatus === 'Select' ? '' : selectedStatus}
							defaultLabel='All Statuses'
							options={[
								{ label: 'All Statuses', value: '' },
								{ label: 'Pending', value: 'Pending' },
								{ label: 'Approved', value: 'Approved' },
								{ label: 'Rejected', value: 'Rejected' },
							]}
							onChange={handleStatusChange}
						/>
					</div>

					{/* Spacer */}
					<div className='d-none d-md-block' style={{ flexGrow: 1 }}></div>

					{/* 6. Date Filter */}
					<div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
							storageKey='expense_report_selectedDateRange'
						/>
					</div>
				</div>
			</div>

			<div className='gz-inv-table-card'>
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
				{expenseReports.some((report) => report.status === 'Pending') && (
					<div
						className='d-flex align-items-center justify-content-between flex-wrap gap-3 mx-4 my-4 p-3 rounded-3'
						style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
						<div className='d-flex align-items-center gap-3'>
							<div className='form-check form-check-custom form-check-solid m-0'>
								<input
									className='form-check-input'
									type='checkbox'
									id='selectAll'
									checked={selectAll}
									onChange={(e) => handleSelectAll(e.target.checked)}
								/>
								<label
									className='form-check-label fw-bold text-dark fs-7 ms-2'
									htmlFor='selectAll'>
									Select All Pending Reports (
									{expenseReports.filter((report) => report.status === 'Pending').length})
								</label>
							</div>
						</div>
						<div>
							<button
								onClick={handleBulkApproval}
								className={`btn btn-sm d-inline-flex align-items-center gap-1.5 fw-bold ${
									selectedReports.length > 0 ? '' : 'invisible'
								}`}
								style={{
									background: '#059669',
									color: '#FFFFFF',
									border: 'none',
									borderRadius: '8px',
									padding: '6px 14px',
								}}
								disabled={submitLoading}>
								<i className='bi bi-check2-circle text-white'></i>
								Approve {selectedReports.length} Report{selectedReports.length !== 1 ? 's' : ''}
							</button>
						</div>
					</div>
				)}
				<Table
							data={expenseReports}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							disableSortFields={['select']}
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
											<span className='text-gray-800 fw-semibold d-block mb-1 fs-7'>
												{report.purpose}
											</span>
										</td>
										<td>
											<span className='fw-bold d-block mb-1 fs-6' style={{ color: '#142447' }}>
												₹{report.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
											</span>
										</td>
										<td>
											<span className={getStatusBadgeClass(report.status || 'Pending')}>
												{report.status || 'Pending'}
											</span>
										</td>
										<td>
											<span className='text-muted fw-semibold d-block mb-1 fs-7'>
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
					{expenseReports.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No expense reports found</b>
						</div>
					)}

					{expenseReports.length > 0 && (
						<UsersListPagination
							totalPages={
								metaData?.totalPages ||
								metaData?.total_pages ||
								Math.ceil(
									(metaData?.totalRecords || metaData?.totalDocs || metaData?.total || expenseReports.length) /
										pagination.itemsPerPage
								) ||
								1
							}
							currentPage={pagination.page}
							totalRecords={metaData?.totalRecords || metaData?.totalDocs || metaData?.total || expenseReports.length}
							itemsPerPage={pagination.itemsPerPage}
							onPageChange={handlePageChange}
						/>
					)}
			</div>
		</>
	)
}

export default ExpenseReportsList
