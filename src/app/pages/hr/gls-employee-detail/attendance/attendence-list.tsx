/* eslint-disable jsx-a11y/anchor-is-valid */
import { faEye, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import DownloadExcelButton from '../../../../components/DownloadExcelButton'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { GetGlsAttendance, GetGlsEmployees, SyncGlsAttendance } from '../../../../Functions/FGGroup'

interface PaginationState {
	page: number
	itemsPerPage: number
}

const AttendenceList = () => {
	const [searchTerm, setSearchTerm] = useState(
		() => localStorage.getItem('hr_gls_attendance_searchTerm') || ''
	)
	const [attendanceData, setAttendanceData] = useState<any>([])
	const [isRotating, setIsRotating] = useState(false)
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('DateString')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState<PaginationState>(() => {
		try {
			const saved = localStorage.getItem('hr_gls_attendance_pagination')
			return saved ? JSON.parse(saved) : { page: 1, itemsPerPage: 10 }
		} catch (e) {
			return { page: 1, itemsPerPage: 10 }
		}
	})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		const storedRange = localStorage.getItem('hr_gls_attendance_selectedDateRange')
		if (storedRange) {
			try {
				const parsed = JSON.parse(storedRange)
				return [new Date(parsed.from || parsed[0]), new Date(parsed.to || parsed[1])]
			} catch (e) {
				return null
			}
		}
		// Default for Attendance is This Month
		const now = new Date()
		return [new Date(now.getFullYear(), now.getMonth(), 1), now]
	})
	const [metaData, setMetaData] = useState<any>()

	const fetchAttendanceData = async (page?: number) => {
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
			const response: any = await GetGlsAttendance({
				from_date: DayJS(startDate).format('YYYY-MM-DD'),
				to_date: DayJS(endDate).format('YYYY-MM-DD'),
				limit: 10000,
			})

			const employeeResponse: any = await GetGlsEmployees({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort: sort === 'Name' ? 'full_name' : sort,
				sortOrder,
				search: searchTerm,
			})

			const salaryData = response.data
			const employeeData = employeeResponse.data

			const mergedData = employeeData.map((emp: any) => {
				const empCode = String(emp?.employee_code || '').trim()
				const employeeAttendance = salaryData.filter(
					(salary: any) => String(salary.employee_code || '').trim() === empCode
				)

				const total_present = employeeAttendance.filter((att: any) => att.Status === 'P').length
				const total_absent = employeeAttendance.filter((att: any) => att.Status === 'A').length
				const half_day = employeeAttendance.filter((att: any) => att.halfDay === true).length

				return {
					mobile: emp?.mobile || '',
					photo: emp?.photo || '',
					total_present: total_present || 0,
					total_absent: total_absent || 0,
					half_day: half_day || 0,
					Name: emp?.full_name || emp?.name || '',
					employee_code: emp?.employee_code || '',
				}
			})

			setAttendanceData(mergedData)
			setMetaData(employeeResponse?.metadata?.pagination || employeeResponse?.metadata || {})
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchSyncAttendance = async (page?: number) => {
		setIsRotating(true)
		try {
			const response: any = await SyncGlsAttendance()
			const syncFilteredData = response.data
			fetchAttendanceData()
		} catch (error) {
			console.error(error)
		}
		setIsRotating(false)
	}

	useEffect(() => {
		fetchAttendanceData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange, searchTerm])

	useEffect(() => {
		if (selectedDateRange) {
			localStorage.setItem(
				'hr_gls_attendance_selectedDateRange',
				JSON.stringify({
					from: DayJS(selectedDateRange[0]).format('YYYY-MM-DD'),
					to: DayJS(selectedDateRange[1]).format('YYYY-MM-DD'),
				})
			)
			localStorage.setItem(
				'selectedDateRange',
				JSON.stringify({
					from: DayJS(selectedDateRange[0]).format('YYYY-MM-DD'),
					to: DayJS(selectedDateRange[1]).format('YYYY-MM-DD'),
				})
			)
		} else {
			localStorage.removeItem('hr_gls_attendance_selectedDateRange')
			localStorage.removeItem('selectedDateRange')
		}
	}, [selectedDateRange])

	useEffect(() => {
		localStorage.setItem('hr_gls_attendance_pagination', JSON.stringify(pagination))
	}, [pagination])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		localStorage.setItem('hr_gls_attendance_searchTerm', searchTerm)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	const handleSyncButton = () => {
		fetchSyncAttendance()
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
	}

	const sortableFields = [
		{ title: 'Employee', field: 'Name' },
		{ title: 'Employee Code', field: 'employee_code' },
		{ title: 'Total Present', field: 'total_present' },
		{ title: 'Total Absent', field: 'total_absent' },
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

	const filteredEmployeeData = attendanceData.filter(
		(employee: any) =>
			(employee?.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(employee?.mobile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(employee?.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		const isSame =
			(!dateRange && !selectedDateRange) ||
			(dateRange &&
				selectedDateRange &&
				dateRange[0].getTime() === selectedDateRange[0].getTime() &&
				dateRange[1].getTime() === selectedDateRange[1].getTime())

		if (!isSame) {
			setSelectedDateRange(dateRange)
			if (!isFirstRender.current) {
				setPagination((prev) => ({ ...prev, page: 1 }))
			}
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Attendance</PageTitle>
			{/* Filter Toolbar */}
			<div className='gz-filter-card mb-5'>
				<div className='d-flex align-items-center flex-wrap gap-3 w-100'>
					{/* 1. Search */}
					<div style={{ flex: '1 1 240px', maxWidth: '360px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search employee name...'
							className='me-0'
						/>
					</div>

					{/* 2. Page Size */}
					<div>
						<LengthMenu
							data={attendanceData}
							itemsPerPage={pagination.itemsPerPage}
							handleItemsPerPageChange={handleItemsPerPageChange}
							className='me-0'
						/>
					</div>

					{/* 3. Download Excel Button */}
					<div>
						<DownloadExcelButton
							data={attendanceData}
							columns={sortableFields}
							filename='GLS_Attendance'
						/>
					</div>

					{/* 4. Sync Button */}
					<div>
						<button
							type='button'
							className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '8px' }}
							onClick={handleSyncButton}
							disabled={isRotating}>
							<i className={`bi bi-arrow-repeat fs-6 text-white ${isRotating ? 'rotate' : ''}`}></i>
							<span className='fw-semibold'>Sync</span>
						</button>
					</div>

					{/* Spacer */}
					<div className='d-none d-md-block' style={{ flexGrow: 1 }}></div>

					{/* 5. Date Filter */}
					<div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
						/>
					</div>
				</div>
			</div>

			{/* Table Card */}
			<div className='gz-inv-table-card'>
				<div className='card-body py-2 px-6'>
					<div className='table-responsive'>
						<Table
							data={attendanceData}
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

										<td>
											<button
												type='button'
												className='gz-inv-action-btn view'
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
													window.location.href = `/hr/gls-attendance-view?employee_code=${attendance?.employee_code}`
												}}>
												<FontAwesomeIcon icon={faEye} />
											</button>
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
					</div>
					{attendanceData.length === 0 && !loading && (
						<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center py-12'>
							<i className='bi bi-calendar-x text-muted fs-2x mb-2'></i>
							<span className='text-gray-700 fw-bold fs-6'>No attendance records found</span>
							<span className='text-muted fs-7'>Try selecting another date range or employee search</span>
						</div>
					)}
					{attendanceData.length > 0 && (
						<UsersListPagination
							totalPages={
								metaData?.totalPages ||
								metaData?.total_pages ||
								Math.ceil(
									(metaData?.totalEmployees || metaData?.totalDocs || attendanceData.length) /
										pagination.itemsPerPage
								)
							}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
							totalRecords={metaData?.totalEmployees || metaData?.totalDocs || attendanceData.length}
							itemsPerPage={pagination.itemsPerPage}
						/>
					)}
				</div>
			</div>
		</>
	)
}

export default AttendenceList
