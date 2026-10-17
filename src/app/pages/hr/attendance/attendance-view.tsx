import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup'
import { GetAttendance } from '../../../Functions/FGGroup/Attendance'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import './attendance-view.css'

const AttendanceViewUser = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employee_code: string | any = searchParams.get('employee_code')
	const [employeeData, setEmployeeData] = useState<any>({})
	const [attendanceData, setAttendanceData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [selectedDateRange, setSelectedDateRange] = useState<any>(null)
	const [sort, setSort] = useState('DateString')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedStatus, setSelectedStatus] = useState('')
	const [selectedSubject, setSelectedSubject] = useState('')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchAttendanceViewData = async (page?: number) => {
		setLoading(true)

		let startDate: Date
		let endDate: Date

		const storedDateRange = localStorage.getItem('selectedDateRange')
		if (storedDateRange) {
			const parsedRange = JSON.parse(storedDateRange)
			startDate = new Date(parsedRange.from)
			startDate.setHours(0, 0, 0, 0)

			endDate = new Date(parsedRange.to)
			endDate.setHours(23, 59, 59, 999)
		} else if (selectedDateRange) {
			selectedDateRange[0] ? (
				startDate = new Date(selectedDateRange[0])
			) : (
				startDate = new Date(selectedDateRange.from)
			)
			startDate.setHours(0, 0, 0, 0)
			
			selectedDateRange[1] ? (
				endDate = new Date(selectedDateRange[1])
			) : (
				endDate = new Date(selectedDateRange.to)
			)
			endDate.setHours(23, 59, 59, 999)
		} else {
			const now = new Date()
			startDate = new Date(now.getFullYear(), now.getMonth(), 1)
			endDate = new Date()
		}

		try {
			const response: any = await GetAttendance({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: employee_code,
				sort,
				sortOrder,
				from_date: startDate.toISOString(),
				to_date: endDate.toISOString(),
				status: selectedSubject || undefined,
			})

			let filteredData = response.data

			const employeeResponse: any = await GetEmployees()
			const employeeFilteredResponse = employeeResponse.data

			const mergedData = filteredData.map((attendance: any) => {
				const employee = employeeFilteredResponse.find(
					(emp: any) => emp?.employee?.employee_code === attendance?.employee_code
				)
				return {
					...attendance,
					mobile: employee?.mobile || '',
					photo: employee?.employee?.photo || '',
				}
			})

			if(selectedSubject == 'A'){
				filteredData = filteredData.filter((attendance: any) => (
					DayJS(attendance.DateString).format('dddd') !== 'Sunday'
				))
			}

			setEmployeeData(mergedData[0])
			setAttendanceData(filteredData)

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchAttendanceViewData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedSubject,
	])

	const storedDateRange = localStorage.getItem('selectedDateRange')
	useEffect(() => {
		if (storedDateRange) {
			setStoredDateRange(storedDateRange)
		}
	}, [storedDateRange])
	
	const setStoredDateRange = (storedDateRange: any) => {
		setSelectedDateRange(JSON.parse(storedDateRange))
		localStorage.removeItem('selectedDateRange')
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setAttendanceData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Date', field: 'createdAt' },
		{ title: 'In Time', field: 'INTime' },
		{ title: 'Out Time', field: 'OUTTime' },
		{ title: 'Over Time', field: 'OverTime' },
		{ title: 'Late Time', field: 'Late_In' },
		{ title: 'Half Day', field: 'halfDay' },
		{ title: 'Status', field: 'Status' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, page: 1, itemsPerPage: value })
	}

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const handleChangeStatus = (event: any) => {
		setPagination({ ...pagination, page: 1 })
		let value = event.target.value
		setSelectedStatus(value)
		if (value == 'Absent') {
			value = 'A'
		} else if (value == 'Present') {
			value = 'P'
		} else if (value == 'Leave') {
			value = 'Leave'
		}
		setSelectedSubject(value)
	}

	const downloadExcel = () => {
		const worksheetData = attendanceData.map((attendance: any, index: number) => {
			return {
				Date: attendance?.DateString ? DayJS(attendance?.DateString).format('DD/MM/YYYY') : 'N/A',
				'In Time': attendance?.INTime
					? attendance?.INTime !== '--:--'
						? attendance?.INTime
						: '-'
					: 'N/A',
				'Out Time': attendance?.OUTTime
					? attendance?.OUTTime !== '--:--'
						? attendance?.OUTTime
						: '-'
					: 'N/A',
				'Over Time': attendance?.OverTime
					? attendance?.OverTime !== '00:00'
						? attendance?.OverTime
						: '-'
					: 'N/A',
				'Late Time': attendance?.Late_In
					? attendance?.Late_In !== '00:00'
						? attendance?.Late_In
						: '-'
					: 'N/A',
				Status: attendance?.halfDay
					? attendance?.Status === 'Leave' || attendance?.Status === 'A'
						? DayJS(attendance.DateString).format('dddd') == 'Sunday'
							? DayJS(attendance.DateString).format('dddd') + ' - Half Day / ' + attendance?.Status
							: 'Half Day / ' + attendance?.Status
						: DayJS(attendance.DateString).format('dddd') == 'Sunday'
						? DayJS(attendance.DateString).format('dddd') + ' - Half Day / ' + attendance?.Status
						: ' Half Day / ' + attendance?.Status
					: attendance?.Status === 'Leave' || attendance?.Status === 'A'
					? DayJS(attendance.DateString).format('dddd') == 'Sunday'
						? DayJS(attendance.DateString).format('dddd')
						: attendance?.Status
					: DayJS(attendance.DateString).format('dddd') == 'Sunday'
					? DayJS(attendance.DateString).format('dddd') + ' - ' + attendance?.status
					: attendance?.Status,
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
		XLSX.writeFile(workbook, 'AttendanceData.xlsx')
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Attendance Details</PageTitle>

			{/* Top Bar with Back Link */}
			<div className='d-flex flex-wrap align-items-center justify-content-between gap-3 mb-5'>
				<Link
					to='/hr/attendance'
					className='btn btn-sm d-inline-flex align-items-center gap-2 gz-att-back-btn'>
					<i className='bi bi-arrow-left fs-6'></i>
					<span className='fw-semibold'>Back to Attendance List</span>
				</Link>

				<div className='d-flex align-items-center gap-2'>
					{employeeData?.employee_code && (
						<span className='badge badge-light-secondary text-dark fw-bold px-3 py-2 fs-7'>
							{employeeData.employee_code}
						</span>
					)}
				</div>
			</div>

			{/* Employee Profile Header Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '14px',
					border: '1px solid #E4EAF2',
					background: '#ffffff',
					boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
				}}>
				<div className='card-body p-6'>
					<div className='d-flex flex-wrap align-items-center justify-content-between gap-4'>
						<div className='d-flex align-items-center gap-4'>
							<div
								className='symbol symbol-circle overflow-hidden flex-shrink-0'
								style={{
									width: '64px',
									height: '64px',
									minWidth: '64px',
									minHeight: '64px',
									borderRadius: '50%',
									border: '1px solid #E4EAF2',
									background: '#F5F7FB',
								}}>
								<img
									src={
										employeeData?.photo
											? `https://files.fggroup.in/${employeeData?.photo}`
											: toAbsoluteUrl('/media/logos/fgiit-logo.png')
									}
									alt={employeeData?.Name || 'Employee'}
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
										display: 'block',
									}}
								/>
							</div>
							<div>
								<h3 className='fw-bold fs-3 mb-1' style={{ color: '#142447' }}>
									{employeeData?.Name || 'Employee Attendance Log'}
								</h3>
								<div className='d-flex align-items-center gap-3 fs-7' style={{ color: '#71809A' }}>
									<span>
										<i className='bi bi-person-badge text-primary me-1'></i>
										{employeeData?.employee_code || '-'}
									</span>
									<span>•</span>
									<span>
										<i className='bi bi-telephone text-primary me-1'></i>
										{employeeData?.mobile || 'No contact'}
									</span>
								</div>
							</div>
						</div>

						<div className='d-flex align-items-center gap-2'>
							<button
								type='button'
								className='btn btn-sm d-flex align-items-center gap-2 px-4 gz-att-export-btn'
								onClick={downloadExcel}
								disabled={loading}>
								<i className='bi bi-file-earmark-excel-fill fs-5'></i>
								<span className='fw-semibold'>Export Excel</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Filter Toolbar */}
			<div className='gz-filter-card mb-5'>
				<div className='d-flex align-items-center flex-wrap gap-3 w-100'>
					{/* 1. Page Size / Length Menu */}
					<div>
						<LengthMenu
							expenseData={attendanceData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>

					{/* 2. Filter Status Dropdown */}
					<div style={{ minWidth: '160px' }}>
						<select
							className='form-select form-select-sm gz-inv-select'
							value={selectedStatus}
							onChange={handleChangeStatus}>
							<option value=''>All Statuses</option>
							<option value='Present'>Present</option>
							<option value='Absent'>Absent</option>
							<option value='Leave'>Leave</option>
						</select>
					</div>

					{/* Spacer */}
					<div className='d-none d-md-block' style={{ flexGrow: 1 }}></div>

					{/* 3. Date Filter */}
					<div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
						/>
					</div>
				</div>
			</div>

			{/* Attendance Logs Table Card */}
			<div className='gz-inv-table-card'>
				<div className='table-responsive'>
						<Table
							data={attendanceData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							removeAction={true}
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
											<span className='fw-bold fs-7' style={{ color: '#142447' }}>
												{attendance?.DateString
													? DayJS(attendance?.DateString).format('DD MMM YYYY')
													: 'N/A'}
											</span>
											<span className='text-muted fs-8 d-block'>
												{attendance?.DateString ? DayJS(attendance?.DateString).format('dddd') : ''}
											</span>
										</td>
										<td>
											<span className='badge badge-light-success text-success fw-bold fs-7 px-3 py-1.5'>
												{attendance?.INTime && attendance?.INTime !== '--:--'
													? attendance?.INTime
													: '-'}
											</span>
										</td>
										<td>
											<span className='badge badge-light-secondary text-dark fw-bold fs-7 px-3 py-1.5'>
												{attendance?.OUTTime && attendance?.OUTTime !== '--:--'
													? attendance?.OUTTime
													: '-'}
											</span>
										</td>
										<td>
											<span className='text-gray-800 fw-semibold fs-7'>
												{attendance?.OverTime && attendance?.OverTime !== '00:00'
													? attendance?.OverTime
													: '-'}
											</span>
										</td>
										<td>
											<span className='text-gray-800 fw-semibold fs-7'>
												{attendance?.Late_In && attendance?.Late_In !== '00:00'
													? attendance?.Late_In
													: '-'}
											</span>
										</td>
										<td>
											{attendance?.halfDay ? (
												<span className='badge badge-light-warning fw-bold fs-7 px-3 py-1.5'>
													Half Day
												</span>
											) : (
												<span className='text-muted fs-7'>-</span>
											)}
										</td>
										<td>
											{attendance?.Status === 'Leave' || attendance?.Status === 'A' ? (
												<span className='badge badge-light-danger fw-bold fs-7 px-3 py-1.5'>
													{DayJS(attendance.DateString).format('dddd') === 'Sunday' ? 'Sunday' : attendance?.Status || 'Absent'}
												</span>
											) : DayJS(attendance.DateString).format('dddd') === 'Sunday' ? (
												<span className='badge badge-light-info fw-bold fs-7 px-3 py-1.5'>
													Sunday
												</span>
											) : (
												<span className='badge badge-light-success fw-bold fs-7 px-3 py-1.5'>
													{attendance?.Status || 'Present'}
												</span>
											)}
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12} className='bg-light-subtle p-3'>
												<div className='d-flex flex-wrap gap-4 text-muted fs-7'>
													<div><strong>In:</strong> {attendance?.INTime || '-'}</div>
													<div><strong>Out:</strong> {attendance?.OUTTime || '-'}</div>
													<div><strong>Overtime:</strong> {attendance?.OverTime || '-'}</div>
													<div><strong>Late:</strong> {attendance?.Late_In || '-'}</div>
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
							<i className='bi bi-calendar-check text-muted fs-2x mb-2'></i>
							<span className='fw-bold fs-6' style={{ color: '#142447' }}>No attendance logs found for this period</span>
							<span className='text-muted fs-7'>Try selecting a different date range or status filter</span>
						</div>
					)}
					{attendanceData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages || Math.ceil(attendanceData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
							totalRecords={metaData?.totalRecords || attendanceData.length}
							itemsPerPage={pagination.itemsPerPage}
						/>
					)}
				</div>
		</>
	)
}

export default AttendanceViewUser
