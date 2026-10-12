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
			<div className='card'>
				<div className='row justify-content-between mt-7 mx-6'>
					<div className='col-md-9'>
						<h3 className='card-title align-items-start flex-column'>
							<span className='card-label fw-bold fs-3 mb-1'>Employee Sheet</span>
						</h3>
					</div>
				</div>

				<div className='card-header row border-0 pt-6'>
					<div className='col-md-12 d-flex justify-content-between'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<div className='d-flex'>
							<div>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									leftValue='-600px'
								/>
							</div>
							<div className='d-md-flex d-none'>
								<LengthMenu
									expenseData={attendanceData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
							<div className='col-md-3 d-md-flex d-none'>
								<div>
									<button
										className='btn btn-sm ms-8 bg-primary d-flex py-3'
										onClick={handleSyncButton}
										disabled={isRotating}>
										<FontAwesomeIcon
											icon={faSync}
											className={` fs-3 text-white my-1 ${isRotating ? 'rotate' : ''}`}
										/>
										<span className='text-white ms-2 my-1'>Sync</span>
									</button>
								</div>
							</div>
						</div>
					</div>
					<div className='col-md-3 d-flex d-md-none justify-content-between p-0 mt-3'>
						<LengthMenu
							expenseData={attendanceData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
						<button
							className='btn btn-sm ms-md-8 ms-4 bg-primary w-50'
							onClick={handleSyncButton}
							disabled={isRotating}>
							<FontAwesomeIcon
								icon={faSync}
								className={`fs-3 text-white ${isRotating ? 'rotate' : ''}`}
							/>
							<span className='text-white ms-2 mb-3'>Sync</span>
						</button>
					</div>
				</div>

				<div className='card-body py-3'>
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
								<React.Fragment key={attendance?._id}>
									<tr
										onClick={() => handleRowClick(attendance?._id)}
										className='data-row'>
										<td className='text-center'>
											<div className='d-flex'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													<img
														src={
															attendance?.photo
																? `https://files.fggroup.in/${attendance?.photo}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt={attendance?.Name}
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>{attendance?.Name}</span>
													<span className='text-muted fw-semibold text-muted d-block fs-7'>
														{attendance?.mobile}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{attendance?.employee_code ? attendance?.employee_code : 'N/A'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{attendance?.half_day === 0
													? attendance?.total_present
														? attendance?.total_present
														: '0'
													: attendance?.total_present
													? attendance?.total_present + ` ( ${attendance?.half_day} Half Day )`
													: '0'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{attendance?.total_absent ? attendance?.total_absent : '0'}
											</span>
										</td>

										<td>
											<TableButton
												action='view'
												// to={`/hr/attendance-view?employee_code=${attendance?.employee_code}`}
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
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-5'>
															<img
																src={
																	attendance?.profile_image
																		? `https://files.fggroup.in/${attendance?.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt={attendance?.Name}
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{attendance?.Name}</span>
															<span className='text-muted fw-semibold text-muted d-block fs-7'>
																{attendance?._id}
															</span>
														</div>
													</div>
													<strong>{sortableFields[1].title}:</strong>{' '}
													{attendance?.employee_code ? attendance?.employee_code : 'N/A'}
													<br />
													<strong>{sortableFields[2].title}:</strong>{' '}
													{attendance?.INTime ? attendance?.INTime : 'N/A'}
													<br />
													<strong>{sortableFields[3].title}:</strong>{' '}
													{attendance?.OUTTime ? attendance?.OUTTime : 'N/A'}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{attendance?.OverTime ? attendance?.OverTime : 'N/A'}
													<br />
													<strong>{sortableFields[5].title}:</strong>{' '}
													{attendance?.Late_In ? attendance?.Late_In : 'N/A'}
													<br />
													<strong>{sortableFields[7].title}:</strong>{' '}
													{attendance?.createdAt
														? DayJS(attendance?.createdAt).format('DD/MM/YYYY hh:mm:ss A')
														: 'N/A'}
													<br />
													<div className='d-flex my-1'>
														<strong className='mt-2 me-2'>{sortableFields[6].title}:</strong>{' '}
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{attendance?.halfDay ? (
																attendance?.Status === 'Leave' || attendance?.Status === 'A' ? (
																	<span className='badge badge-light-danger py-3 px-4 fs-7'>
																		Half Day{' / '}
																		{attendance?.Status}
																	</span>
																) : (
																	<span className='badge badge-light-success py-3 px-4 fs-7'>
																		Half Day{' / '}
																		{attendance?.Status}
																	</span>
																)
															) : attendance?.Status === 'Leave' || attendance?.Status === 'A' ? (
																<span className='badge badge-light-danger py-3 px-4 fs-7'>
																	{attendance?.Status}
																</span>
															) : (
																<span className='badge badge-light-success py-3 px-4 fs-7'>
																	{attendance?.Status}
																</span>
															)}
														</span>
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
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedEmployeeData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(attendanceData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
		</>
	)
}

export { HRAttendance }
