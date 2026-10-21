import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetGlsAttendance, GetGlsEmployees, SyncGlsAttendance } from '../../../Functions/FGGroup'
import '../common-management.css'

const AttendenceList = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [attendanceData, setAttendanceData] = useState<any>([])
	const [isRotating, setIsRotating] = useState(false)
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [sort, setSort] = useState('DateString')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
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
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange])

	const isFirstRender = useRef(true)

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

	const filteredEmployeeData = attendanceData.filter(
		(employee: any) =>
			(employee?.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(employee?.mobile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(employee?.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const downloadExcel = async () => {
		try {
			setExporting(true)
			const toastId = toast.loading('Exporting attendance to Excel...')

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

			const [attendanceRes, employeeRes]: [any, any] = await Promise.all([
				GetGlsAttendance({
					from_date: DayJS(startDate).format('YYYY-MM-DD'),
					to_date: DayJS(endDate).format('YYYY-MM-DD'),
					limit: 10000,
				}),
				GetGlsEmployees({
					page: 1,
					limit: 10000,
					search: searchTerm,
					sort,
					sortOrder,
				}),
			])

			const salaryData = attendanceRes?.data || []
			const employeeData = employeeRes?.data || []

			if (employeeData.length === 0) {
				toast.dismiss(toastId)
				toast.error('No attendance data found to export')
				return
			}

			const worksheetData = employeeData.map((emp: any, index: number) => {
				const empCode = String(emp?.employee_code || '').trim()
				const empAttendance = salaryData.filter(
					(salary: any) => String(salary.employee_code || '').trim() === empCode
				)
				const total_present = empAttendance.filter((att: any) => att.Status === 'P').length
				const total_absent = empAttendance.filter((att: any) => att.Status === 'A').length
				const half_day = empAttendance.filter((att: any) => att.halfDay === true).length

				return {
					No: index + 1,
					'Employee Code': emp.employee_code || '-',
					'Employee Name': emp.full_name || emp.name || '-',
					Mobile: emp.mobile || '-',
					'Total Present': total_present,
					'Total Absent': total_absent,
					'Half Day': half_day,
					'Date Range': `${DayJS(startDate).format('DD/MM/YYYY')} - ${DayJS(endDate).format('DD/MM/YYYY')}`,
				}
			})

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const columnWidths = Object.keys(worksheetData[0]).map((key) => {
				const maxLength = Math.max(
					key.length,
					...worksheetData.map((row: any) => String(row[key] ?? '').length)
				)
				return { wch: Math.min(maxLength + 2, 40) }
			})
			worksheet['!cols'] = columnWidths

			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')
			XLSX.writeFile(
				workbook,
				`Attendance_${DayJS(startDate).format('DD-MM-YYYY')}_to_${DayJS(endDate).format('DD-MM-YYYY')}.xlsx`
			)

			toast.dismiss(toastId)
			toast.success(`${employeeData.length} records exported successfully`)
		} catch (error: any) {
			console.error('Export error:', error)
			toast.error('Failed to export attendance data')
		} finally {
			setExporting(false)
		}
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Employee Attendance</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Staff Management</span>
				<span className='sep'>/</span>
				<span className='current'>Attendance</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Staff Attendance</h1>
					<p className='gz-mgmt-subtitle'>Monthly punch records, presence tallies, half-days, and biometric synchronization</p>
				</div>
				<button
					type='button'
					className='gz-mgmt-btn-secondary d-inline-flex align-items-center'
					onClick={handleSyncButton}
					disabled={isRotating}>
					<i className={`bi bi-arrow-repeat me-2 ${isRotating ? 'spinner-border spinner-border-sm' : ''}`}></i>
					{isRotating ? 'Syncing...' : 'Sync Biometric Data'}
				</button>
			</div>

			<div className='gz-mgmt-card'>
				<div className='gz-mgmt-toolbar'>
					<div className='gz-mgmt-toolbar-left'>
						{/* 1. Searchbar */}
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							className='me-0'
						/>

						{/* 2. Dropdown (show entries per page) */}
						<LengthMenu
							expenseData={attendanceData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>

						{/* 3. Download Excel */}
						<div>
							<DownloadExcelButton
								onClick={downloadExcel}
								disabled={exporting}
								loading={exporting}
								title='Download Excel'
							/>
						</div>

						{/* 4. Datefilter */}
						<div className='d-flex align-items-center flex-shrink-0'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>

				<div className='card-body p-0'>
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
								<React.Fragment key={attendance?._id}>
									<tr
										onClick={() => handleRowClick(attendance?._id)}
										className='data-row'>
										<td className='text-center'>
											<div className='d-flex align-items-center justify-content-center'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-1 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='fw-bold d-block mb-1 fs-6' style={{ color: '#172B4D' }}>{actualIndex}</span>
											</div>
										</td>
										<td>
											<div className='gz-mgmt-identity-cell'>
												<img
													src={
														attendance?.photo
															? `https://files.fggroup.in/${attendance?.photo}`
															: toAbsoluteUrl('/media/logos/fgiit-logo.png')
													}
													alt={attendance?.Name}
													className='gz-mgmt-avatar'
												/>
												<div className='gz-mgmt-identity-info'>
													<span className='name'>{attendance?.Name || 'Staff Member'}</span>
													<span className='sub'>
														{attendance?.mobile || '-'}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='gz-mgmt-pill info'>
												{attendance?.employee_code ? attendance?.employee_code : 'N/A'}
											</span>
										</td>
										<td>
											<span className='gz-mgmt-pill success'>
												P: {attendance?.total_present ?? 0}
												{attendance?.half_day ? ` (${attendance?.half_day} Half)` : ''}
											</span>
										</td>
										<td>
											<span className='gz-mgmt-pill danger'>
												A: {attendance?.total_absent ?? 0}
											</span>
										</td>

										<td>
											<TableButton
												action='view'
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
													window.location.href = `/rag/attendance-view?employee_code=${attendance?.employee_code}`
												}}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div className='p-3' style={{ background: '#F8FAFC', borderRadius: '8px' }}>
													<strong>Employee:</strong> {attendance?.Name}
													<br />
													<strong>{sortableFields[1].title}:</strong>{' '}
													{attendance?.employee_code ? attendance?.employee_code : 'N/A'}
													<br />
													<strong>Total Present:</strong> {attendance?.total_present || 0}
													<br />
													<strong>Total Absent:</strong> {attendance?.total_absent || 0}
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
						<div className='d-flex text-center w-100 align-content-center justify-content-center py-10 text-muted'>
							<b>No attendance records found</b>
						</div>
					)}
					{attendanceData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages || metaData?.total_pages || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
							totalRecords={metaData?.totalDocs ?? metaData?.totalRecords ?? metaData?.totalCount ?? attendanceData.length}
							itemsPerPage={pagination.itemsPerPage}
							entityName='attendance records'
						/>
					)}
				</div>
			</div>
		</div>
	)
}

export default AttendenceList
