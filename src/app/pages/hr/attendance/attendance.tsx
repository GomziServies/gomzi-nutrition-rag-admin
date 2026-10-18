import { faSync } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { clampPage } from '../../../components/paginationMeta'
import { GetEmployees } from '../../../Functions/FGGroup'
import { GetSalary, GetSyncAttendance } from '../../../Functions/FGGroup/Attendance'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const HRAttendance = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [attendanceData, setAttendanceData] = useState<any[]>([])
	const [isRotating, setIsRotating] = useState(false)
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('Name')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('asc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const fetchAttendanceData = async () => {
		setLoading(true)
		let startDate: any
		let endDate: any

		if (selectedDateRange) {
			startDate = new Date(selectedDateRange[0])
			startDate.setHours(0, 0, 0, 0)

			endDate = new Date(selectedDateRange[1])
			endDate.setHours(23, 59, 59, 999)
		} else {
			const now = new Date()
			startDate = new Date(now.getFullYear(), now.getMonth(), 1)
			endDate = new Date()
		}

		try {
			const [response, employeeResponse]: [any, any] = await Promise.all([
				GetSalary({
					from_date: startDate,
					to_date: endDate,
				}),
				GetEmployees({
					limit: 1000,
				}),
			])

			const salaryData = response?.data || []
			const employeeData = employeeResponse?.data || []

			const mergedData = employeeData.map((emp: any) => {
				const employeeAttendance = salaryData.filter(
					(salary: any) => salary.employee_code == emp?.employee?.employee_code
				)

				return {
					_id: emp?._id || emp?.employee?.employee_code,
					mobile: emp?.mobile || '',
					photo: emp?.employee?.photo || '',
					total_present: employeeAttendance?.[0]?.total_present || 0,
					total_absent: employeeAttendance?.[0]?.total_absent || 0,
					half_day: employeeAttendance?.[0]?.half_day_salary?.[0]?.halfDay || 0,
					Name: emp?.full_name || '',
					employee_code: emp?.employee?.employee_code || '',
				}
			})

			setAttendanceData(mergedData)
		} catch (error) {
			console.error('Error fetching attendance data:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchSyncAttendance = async () => {
		setIsRotating(true)
		try {
			await GetSyncAttendance()
			await fetchAttendanceData()
		} catch (error) {
			console.error('Error syncing attendance:', error)
		} finally {
			setIsRotating(false)
		}
	}

	useEffect(() => {
		fetchAttendanceData()
	}, [selectedDateRange])

	const handleSyncButton = () => {
		fetchSyncAttendance()
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const sortableFields = [
		{ title: 'Employee', field: 'Name' },
		{ title: 'Employee Code', field: 'employee_code' },
		{ title: 'Total Present', field: 'total_present' },
		{ title: 'Total Absent', field: 'total_absent' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleSearchChange = (term: React.SetStateAction<string>) => {
		setSearchTerm((prev) => {
			const next = typeof term === 'function' ? term(prev) : term
			return next
		})
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	// 1. Filtered data across all records
	const filteredAttendanceData = React.useMemo(() => {
		if (!searchTerm.trim()) return attendanceData
		const term = searchTerm.toLowerCase().trim()
		return attendanceData.filter((item: any) =>
			(item?.Name || '').toLowerCase().includes(term) ||
			(item?.employee_code || '').toLowerCase().includes(term) ||
			(item?.mobile || '').toLowerCase().includes(term)
		)
	}, [attendanceData, searchTerm])

	// 2. Sorted data across all filtered records
	const sortedAttendanceData = React.useMemo(() => {
		if (!filteredAttendanceData || filteredAttendanceData.length === 0 || !sort) {
			return filteredAttendanceData || []
		}

		return [...filteredAttendanceData].sort((a: any, b: any) => {
			let aVal = a?.[sort]
			let bVal = b?.[sort]

			if (aVal === undefined || aVal === null) aVal = ''
			if (bVal === undefined || bVal === null) bVal = ''

			// Numeric fields (total_present, total_absent, half_day)
			const aNum = Number(aVal)
			const bNum = Number(bVal)
			if (
				!isNaN(aNum) &&
				!isNaN(bNum) &&
				aVal !== '' &&
				bVal !== '' &&
				typeof aVal !== 'boolean' &&
				typeof bVal !== 'boolean'
			) {
				return sortOrder === 'asc' ? aNum - bNum : bNum - aNum
			}

			return sortOrder === 'asc'
				? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
				: String(bVal).localeCompare(String(aVal), undefined, { numeric: true, sensitivity: 'base' })
		})
	}, [filteredAttendanceData, sort, sortOrder])

	// 3. Paginated slice for current page
	const paginatedAttendanceData = React.useMemo(() => {
		const startIndex = (pagination.page - 1) * pagination.itemsPerPage
		return sortedAttendanceData.slice(startIndex, startIndex + pagination.itemsPerPage)
	}, [sortedAttendanceData, pagination.page, pagination.itemsPerPage])

	const totalPages = Math.ceil(sortedAttendanceData.length / pagination.itemsPerPage) || 1

	// Guard against page out of bounds if items change
	useEffect(() => {
		if (pagination.page > totalPages && totalPages > 0) {
			setPagination((prev) => ({ ...prev, page: clampPage(prev.page, totalPages) }))
		}
	}, [totalPages, pagination.page])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Attendance</PageTitle>

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<div className='d-flex align-items-center gap-2'>
						<h2 className='text-gray-900 fw-bold fs-2 m-0'>Employee Attendance</h2>
						{sortedAttendanceData?.length > 0 && (
							<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
								{sortedAttendanceData.length} Employees
							</span>
						)}
					</div>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Track punch logs, total present days, half days, and absences across the team
					</span>
				</div>
			</div>

			{/* Filter Toolbar (Order: SearchFilter -> LengthMenu -> Sync -> Spacer -> DateFilter) */}
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
					<div style={{ minWidth: '240px', maxWidth: '360px', flex: '1 1 240px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={handleSearchChange}
							placeholder='Search employee name...'
							className='me-0'
						/>
					</div>

					{/* 2. Page Size / Length Menu */}
					<div>
						<LengthMenu
							data={sortedAttendanceData}
							itemsPerPage={pagination.itemsPerPage}
							handleItemsPerPageChange={handleItemsPerPageChange}
							className='me-0'
						/>
					</div>

					{/* 3. Download Excel Button */}
					<div>
						<DownloadExcelButton
							data={sortedAttendanceData}
							columns={sortableFields}
							filename='Attendance_List'
						/>
					</div>

					{/* 4. Sync Action Button */}
					<div>
						<button
							type='button'
							className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '8px' }}
							onClick={handleSyncButton}
							disabled={isRotating}>
							<FontAwesomeIcon
								icon={faSync}
								className={`fs-6 text-white ${isRotating ? 'rotate' : ''}`}
							/>
							<span className='fw-semibold'>Sync</span>
						</button>
					</div>

					{/* Spacer */}
					<div className='d-none d-md-block' style={{ flexGrow: 1 }}></div>

					{/* 5. Date Filter (at last) */}
					<div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
						/>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
				<Table
					data={paginatedAttendanceData}
					columns={sortableFields}
					sort={sort}
					sortOrder={sortOrder}
					onSortChange={handleSortChange}
					renderRow={(
						attendance: any,
						index: number,
						actualIndex: number,
						isVisible: boolean
					) => (
						<React.Fragment key={attendance?._id || index}>
							<tr
								onClick={() => handleRowClick(attendance?._id)}
								className='data-row'
								style={{ transition: 'background-color 0.15s ease' }}>
								<td className='text-center ps-4'>
									<span className='text-muted fw-bold fs-7'>
										{actualIndex}
									</span>
								</td>
								<td>
									<div className='d-flex align-items-center gap-3'>
										<div
											className='symbol symbol-circle overflow-hidden flex-shrink-0'
											style={{
												width: '42px',
												height: '42px',
												minWidth: '42px',
												minHeight: '42px',
												maxWidth: '42px',
												maxHeight: '42px',
												borderRadius: '50%',
												border: '2px solid #e2e8f0',
											}}>
											<img
												src={
													attendance?.photo
														? `https://files.fggroup.in/${attendance?.photo}`
														: toAbsoluteUrl('/media/logos/fgiit-logo.png')
												}
												alt={attendance?.Name}
												style={{
													width: '100%',
													height: '100%',
													objectFit: 'cover',
													display: 'block',
												}}
											/>
										</div>
										<div className='d-flex flex-column'>
											<span className='text-gray-900 fw-bold fs-6'>{attendance?.Name}</span>
											<span className='text-muted fs-7'>
												{attendance?.mobile || 'No contact'}
											</span>
										</div>
									</div>
								</td>
								<td>
									<span className='badge badge-light-secondary text-dark fw-bold fs-7 px-3 py-2'>
										{attendance?.employee_code ? attendance?.employee_code : 'N/A'}
									</span>
								</td>
								<td>
									<span className='badge badge-light-success fw-bold fs-7 px-3 py-2'>
										{attendance?.half_day === 0
											? attendance?.total_present || '0'
											: `${attendance?.total_present || 0} (${attendance?.half_day} Half Day)`}
									</span>
								</td>
								<td>
									<span className='badge badge-light-danger fw-bold fs-7 px-3 py-2'>
										{attendance?.total_absent ? attendance?.total_absent : '0'}
									</span>
								</td>

								<td style={{ textAlign: 'center' }}>
									<TableButton
										action='view'
										title='View Details'
										onClick={() => {
											if (selectedDateRange) {
												localStorage.setItem(
													'selectedDateRange',
													JSON.stringify({
														from: DayJS(selectedDateRange[0]).format('YYYY-MM-DD'),
														to: DayJS(selectedDateRange[1]).format('YYYY-MM-DD'),
													})
												)
											}
											window.location.href = `/hr/attendance-view?employee_code=${attendance?.employee_code}`
										}}
									/>
								</td>
							</tr>
							{isVisible && (
								<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
									<td colSpan={12} className='bg-light-subtle p-4'>
										<div className='d-flex align-items-center gap-4'>
											<div
												className='symbol symbol-circle overflow-hidden flex-shrink-0'
												style={{
													width: '48px',
													height: '48px',
													minWidth: '48px',
													minHeight: '48px',
													borderRadius: '50%',
													border: '2px solid #e2e8f0',
												}}>
												<img
													src={
														attendance?.photo
															? `https://files.fggroup.in/${attendance?.photo}`
															: toAbsoluteUrl('/media/logos/fgiit-logo.png')
													}
													alt={attendance?.Name}
													style={{
														width: '100%',
														height: '100%',
														objectFit: 'cover',
														display: 'block',
													}}
												/>
											</div>
											<div>
												<div className='fw-bold fs-6 text-gray-900'>{attendance?.Name}</div>
												<div className='text-muted fs-7'>Code: {attendance?.employee_code} | Contact: {attendance?.mobile}</div>
												<div className='mt-2 d-flex gap-2'>
													<span className='badge badge-light-success'>Present: {attendance?.total_present || 0}</span>
													<span className='badge badge-light-danger'>Absent: {attendance?.total_absent || 0}</span>
												</div>
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

				{sortedAttendanceData.length === 0 && !loading && (
					<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center py-12'>
						<i className='bi bi-calendar-x text-muted fs-2x mb-2'></i>
						<span className='text-gray-700 fw-bold fs-6'>No attendance records found</span>
						<span className='text-muted fs-7'>Try selecting another date range or employee search</span>
					</div>
				)}

				{sortedAttendanceData.length > 0 && (
					<UsersListPagination
						totalPages={totalPages}
						currentPage={pagination.page}
						totalRecords={sortedAttendanceData.length}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
						entityName='employees'
					/>
				)}
			</div>
		</>
	)
}

export { HRAttendance }
