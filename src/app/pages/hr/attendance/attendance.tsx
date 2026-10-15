/* eslint-disable jsx-a11y/anchor-is-valid */
import { faPlusCircle, faSync } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup'
import { GetSalary, GetSyncAttendance } from '../../../Functions/FGGroup/Attendance'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const HRAttendance = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [attendanceData, setAttendanceData] = useState<any>([])
	const [isRotating, setIsRotating] = useState(false)
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('DateString')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

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
			const response: any = await GetSalary({
				from_date: startDate,
				to_date: endDate,
			})

			const employeeResponse: any = await GetEmployees({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
			})

			const salaryData = response.data
			const employeeData = employeeResponse.data

			const mergedData = employeeData.map((emp: any) => {
				const employeeAttendance = salaryData.filter(
					(salary: any) => salary.employee_code == emp?.employee?.employee_code
				)

				return {
					mobile: emp?.mobile || '',
					photo: emp?.employee?.photo || '',
					total_present: employeeAttendance?.[0]?.total_present,
					total_absent: employeeAttendance?.[0]?.total_absent,
					half_day: employeeAttendance?.[0]?.half_day_salary?.[0]?.halfDay,
					Name: emp?.full_name || '',
					employee_code: emp?.employee?.employee_code || '',
				}
			})

			setAttendanceData(mergedData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchSyncAttendance = async (page?: number) => {
		setIsRotating(true)
		try {
			const response: any = await GetSyncAttendance()
			const syncFilteredData = response.data
			fetchAttendanceData()
		} catch (error) {
			console.error(error)
		}
		setIsRotating(false)
	}

	useEffect(() => {
		fetchAttendanceData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchAttendanceData()
		}
	}, [searchTerm])

	const handleSyncButton = () => {
		fetchSyncAttendance()
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
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
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const filteredEmployeeData = attendanceData.filter((employee: any) =>
		employee?.Name?.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedEmployeeData = filteredEmployeeData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Attendance</PageTitle>
			<div className='card shadow-sm border-0' style={{ borderRadius: '14px' }}>
				{/* Card Header & Controls */}
				<div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div className='d-flex flex-column'>
						<div className='d-flex align-items-center gap-2'>
							<h3 className='card-title fw-bold text-gray-900 fs-3 m-0'>Attendance Records</h3>
							{attendanceData?.length > 0 && (
								<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
									{attendanceData.length} Employees
								</span>
							)}
						</div>
						<span className='text-muted fs-7 fw-semibold mt-1'>
							Track punch logs, total present days, half days, and absences across the team
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

						<LengthMenu
							expenseData={attendanceData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>

						<button
							type='button'
							className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '10px' }}
							onClick={handleSyncButton}
							disabled={isRotating}>
							<FontAwesomeIcon
								icon={faSync}
								className={`fs-6 text-white ${isRotating ? 'rotate' : ''}`}
							/>
							<span className='fw-semibold'>Sync</span>
						</button>
					</div>
				</div>

				{/* Table Body */}
				<div className='card-body py-2 px-6'>
					<div className='table-responsive'>
						<Table
							data={paginatedEmployeeData}
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
													window.location.href = `/hr/attendance-view?employee_code=${attendance?.employee_code}`
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
					{paginatedEmployeeData.length === 0 && !loading && (
						<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center py-12'>
							<i className='bi bi-calendar-x text-muted fs-2x mb-2'></i>
							<span className='text-gray-700 fw-bold fs-6'>No attendance records found</span>
							<span className='text-muted fs-7'>Try selecting another date range or employee search</span>
						</div>
					)}
					{paginatedEmployeeData.length > 0 && (
						<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
							<div className='text-muted fs-7 fw-semibold'>
								Showing {Math.min((pagination.page - 1) * pagination.itemsPerPage + 1, filteredEmployeeData.length)} to{' '}
								{Math.min(pagination.page * pagination.itemsPerPage, filteredEmployeeData.length)} of {filteredEmployeeData.length} records
							</div>
							<UsersListPagination
								totalPages={Math.ceil(filteredEmployeeData.length / pagination.itemsPerPage)}
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

export { HRAttendance }
