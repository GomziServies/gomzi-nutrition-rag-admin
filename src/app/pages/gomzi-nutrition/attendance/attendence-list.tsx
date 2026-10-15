/* eslint-disable jsx-a11y/anchor-is-valid */
import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetGlsAttendance, GetGlsEmployees, SyncGlsAttendance } from '../../../Functions/FGGroup'

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

				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex align-items-center justify-content-between flex-wrap w-100 gap-3'>
						<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
							{/* 1. Searchbar */}
							<div>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
									className='me-0'
								/>
							</div>

							{/* 2. Dropdown (show entries per page) */}
							<div>
								<LengthMenu
									expenseData={attendanceData}
									handleItemsPerPageChange={handleItemsPerPageChange}
									value={pagination.itemsPerPage}
									className='me-0'
								/>
							</div>

							{/* 3. Download Excel Button */}
							<div>
								<button
									type='button'
									className='btn btn-icon d-flex align-items-center justify-content-center'
									onClick={downloadExcel}
									disabled={exporting}
									style={{
										width: '38px',
										height: '38px',
										minWidth: '38px',
										padding: 0,
										borderRadius: '8px',
										fontSize: '14px',
										backgroundColor: '#ffffff',
										border: '1px solid #DFE7F0',
										color: '#1E3A5F',
										boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
										transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
										cursor: exporting ? 'not-allowed' : 'pointer',
									}}
									onMouseEnter={(e) => {
										if (!exporting) {
											e.currentTarget.style.backgroundColor = '#1E3A5F'
											e.currentTarget.style.borderColor = '#1E3A5F'
											e.currentTarget.style.color = '#ffffff'
											e.currentTarget.style.boxShadow = '0 4px 10px rgba(30, 58, 95, 0.25)'
											e.currentTarget.style.transform = 'translateY(-1px)'
										}
									}}
									onMouseLeave={(e) => {
										if (!exporting) {
											e.currentTarget.style.backgroundColor = '#ffffff'
											e.currentTarget.style.borderColor = '#DFE7F0'
											e.currentTarget.style.color = '#1E3A5F'
											e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
											e.currentTarget.style.transform = 'translateY(0)'
										}
									}}
									title='Download Excel'>
									{exporting ? (
										<span
											className='spinner-border spinner-border-sm'
											role='status'
											aria-hidden='true'></span>
									) : (
										<FontAwesomeIcon icon={faDownload} />
									)}
								</button>
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
				</div>

				<div className='card-body py-3'>
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
													window.location.href = `/rag/attendance-view?employee_code=${attendance?.employee_code}`
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
					{attendanceData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{attendanceData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages || metaData?.total_pages || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
		</>
	)
}

export default AttendenceList
