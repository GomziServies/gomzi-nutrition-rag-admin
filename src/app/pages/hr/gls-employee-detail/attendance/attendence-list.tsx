/* eslint-disable jsx-a11y/anchor-is-valid */
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import SearchFilter from '../../../../components/SearchFilter'
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
				sort,
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
			setMetaData(employeeResponse.metadata?.pagination)
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
			<div className='card shadow-sm border-0' style={{ borderRadius: '14px' }}>
				{/* Card Header & Controls */}
				<div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div className='d-flex flex-column'>
						<div className='d-flex align-items-center gap-2'>
							<h3 className='card-title fw-bold text-gray-900 fs-3 m-0'>GLS Attendance Sheet</h3>
							{attendanceData?.length > 0 && (
								<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
									{attendanceData.length} Staff
								</span>
							)}
						</div>
						<span className='text-muted fs-7 fw-semibold mt-1'>
							Track GLS workforce presence, half days, absences, and attendance logs
						</span>
					</div>

					<div className='d-flex align-items-center flex-wrap gap-3'>
						<div style={{ minWidth: '220px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search employee name...'
							/>
						</div>

						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							leftValue='-600px'
						/>

						{attendanceData?.length > 0 && (
							<div className='d-flex align-items-center gap-2'>
								<span className='fs-8 text-muted fw-semibold d-none d-sm-inline'>Show:</span>
								<select
									className='form-select form-select-sm gz-pagination-select'
									style={{ width: '82px' }}
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
							</div>
						)}

						<button
							type='button'
							className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '10px' }}
							onClick={handleSyncButton}
							disabled={isRotating}>
							<i className={`bi bi-arrow-repeat fs-6 text-white ${isRotating ? 'rotate' : ''}`}></i>
							<span className='fw-semibold'>Sync</span>
						</button>
					</div>
				</div>

				{/* Table Body */}
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
													className='symbol symbol-45px symbol-circle overflow-hidden flex-shrink-0'
													style={{ border: '2px solid #e2e8f0' }}>
													<img
														src={
															attendance?.photo
																? `https://files.fggroup.in/${attendance?.photo}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt={attendance?.Name}
														className='w-100 h-100 object-fit-cover'
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
												className='btn btn-icon btn-sm btn-light-primary'
												style={{ width: '34px', height: '34px', borderRadius: '8px' }}
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
												<i className='bi bi-calendar2-check fs-5'></i>
											</button>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12} className='bg-light-subtle p-4'>
												<div className='d-flex align-items-center gap-4'>
													<div className='symbol symbol-50px symbol-circle'>
														<img
															src={
																attendance?.photo
																	? `https://files.fggroup.in/${attendance?.photo}`
																	: toAbsoluteUrl('/media/logos/fgiit-logo.png')
															}
															alt={attendance?.Name}
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
						<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
							<div className='text-muted fs-7 fw-semibold'>
								Showing {Math.min((pagination.page - 1) * pagination.itemsPerPage + 1, filteredEmployeeData.length)} to{' '}
								{Math.min(pagination.page * pagination.itemsPerPage, filteredEmployeeData.length)} of {filteredEmployeeData.length} records
							</div>
							<UsersListPagination
								totalPages={metaData?.totalPages || Math.ceil(filteredEmployeeData.length / pagination.itemsPerPage)}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default AttendenceList
