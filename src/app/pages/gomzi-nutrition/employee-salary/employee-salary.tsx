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
import { GetAdminUsers } from '../../../Functions/FGGroup/AdminUsers'
import { GetGlsSalary } from '../../../Functions/FGGroup/GlsSalary'

const EmployeeSalary = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [salaryData, setSalaryData] = useState<any>([])
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [selectedSubject, setSelectedSubject] = useState('')
	const [selectedStatus, setSelectedStatus] = useState('')
	const [isRotating, setIsRotating] = useState(false)
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [metaData, setMetaData] = useState<any>()
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [employeeOptions, setEmployeeOptions] = useState<
		{ value: string; label: string; full_name: string }[]
	>([])
	const [selectedEmployee, setSelectedEmployee] = useState<string>('')

	const fetchEmployees = async () => {
		try {
			const response: any = await GetAdminUsers()
			const employees = response.data
				.filter((emp: any) => emp.type === 'employee' && emp.status === true)
				.map((emp: any) => ({
					value: emp.employee_id,
					label: `${emp.full_name} (${emp.employee?.employee_code})`,
					full_name: emp.full_name,
				}))
			setEmployeeOptions(employees)
		} catch (error) {
			console.error('Error fetching employees:', error)
		}
	}

	const fetchSalaryData = async (page?: number) => {
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
			// Get of This month
			// startDate = new Date(now.getFullYear(), now.getMonth(), 1)
			// endDate = new Date()

			// Get of last month
			startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
		}

		const query: any = {
			from_date: startDate,
			to_date: endDate,
		}

		if (selectedEmployee) {
			query.employee_id = selectedEmployee
		}

		try {
			const response: any = await GetGlsSalary(query)

			const filteredData = response.data

			setSalaryData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchEmployees()
	}, [])

	useEffect(() => {
		fetchSalaryData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedSubject,
		selectedEmployee,
	])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			fetchSalaryData()
		}
	}, [searchTerm])

	const filteredAdminData = salaryData.filter(
		(admin: any) =>
			(admin.employee_name || admin.full_name || '')
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			(admin.mobile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(admin.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(admin.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedAdminData = filteredAdminData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
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

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const downloadExcel = async () => {
		try {
			setExporting(true)
			const toastId = toast.loading('Exporting employee salary to Excel...')

			const dataToExport = filteredAdminData || []
			if (dataToExport.length === 0) {
				toast.dismiss(toastId)
				toast.error('No salary records found to export')
				return
			}

			const worksheetData = dataToExport.map((salary: any, index: number) => ({
				No: index + 1,
				'Employee Code': salary.employee_code || '-',
				'Employee Name': salary.full_name || salary.name || '-',
				Mobile: salary.mobile || '-',
				Email: salary.email || '-',
				'Total Salary': salary.total_salary ?? '-',
				'Final Salary': salary.final_salary ?? '-',
				'Total Present': salary.total_present ?? 0,
				'Total Absent': salary.total_absent ?? 0,
				Period: salary.period || '-',
			}))

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
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Salary')
			XLSX.writeFile(workbook, `Employee_Salary_${DayJS(new Date()).format('DD-MM-YYYY')}.xlsx`)

			toast.dismiss(toastId)
			toast.success(`${dataToExport.length} salary records exported successfully`)
		} catch (error: any) {
			console.error('Export error:', error)
			toast.error('Failed to export employee salary data')
		} finally {
			setExporting(false)
		}
	}

	const handleEmployeeChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		const selectedLabel = event.target.value

		const selectedEmployee = employeeOptions.find((emp) => emp.label === selectedLabel)
		const employeeId = selectedEmployee ? selectedEmployee.value : ''

		setSelectedEmployee(employeeId)
		setPagination({ ...pagination, page: 1 })
	}

	const sortableFields = [
		{ title: 'Employee', field: 'full_name' },
		{ title: 'Salary', field: 'total_salary' },
		{ title: 'Final Salary', field: 'final_salary' },
		{ title: 'Present', field: 'total_present' },
		{ title: 'Absent', field: 'total_absent' },
		{ title: 'Period', field: 'period' },
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

	const selectOptions = ['All Employees', ...employeeOptions.map((emp) => emp.label)]

	const selectedEmployeeLabel = selectedEmployee
		? employeeOptions.find((emp) => emp.value === selectedEmployee)?.label || 'All Employees'
		: 'All Employees'

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Salary</PageTitle>
			<div className='card'>
				<div className='row justify-content-between mt-7 mx-6'>
					<div className='col-md-9'>
						<h3 className='card-title align-items-start flex-column'>
							<span className='card-label fw-bold fs-3 mb-1'>Employee Salary Sheet</span>
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
									expenseData={salaryData}
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
									lastMonth={true}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className='card-body py-3'>
					<div className='table-responsive'>
						<Table
							data={paginatedAdminData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(salary: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={salary?._id}>
									<tr
										onClick={() => handleRowClick(salary?._id)}
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
															salary?.employee_photo || salary?.photo
																? `https://files.fggroup.in/${
																		salary?.employee_photo || salary?.photo
																  }`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt={salary?.employee_name || salary?.full_name}
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{salary?.employee_name || salary?.full_name}
													</span>
													<span className='text-muted fw-semibold text-muted d-block fs-7'>
														{salary?.mobile}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.total_salary ? salary?.total_salary : '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.final_salary !== undefined ? salary?.final_salary : '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.total_present !== undefined ? salary?.total_present : '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.total_absent !== undefined ? salary?.total_absent : '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.period ? salary?.period : '-'}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												// to={`/hr/employee-salary-view?employee_id=${salary?.employee_id}`}
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
													window.location.href = `/rag/employee-salary-view?employee_id=${salary?.employee_id}`
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
																	salary?.photo
																		? `https://files.fggroup.in/${salary?.photo}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt={salary?.full_name}
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{salary?.full_name}</span>
															<span className='text-muted fw-semibold text-muted d-block fs-7'>
																{salary?.mobile}
															</span>
														</div>
													</div>
													<strong>{sortableFields[1].title}:</strong>{' '}
													{salary?.total_salary ? salary?.total_salary : '-'}
													<br />
													<strong>{sortableFields[2].title}:</strong>{' '}
													{salary?.final_salary ? salary?.final_salary : '-'}
													<br />
													<strong>{sortableFields[3].title}:</strong>{' '}
													{salary?.halfDay
														? salary?.total_present
															? 'Half Day / ' + salary?.total_present
															: '-'
														: salary?.total_present
														? salary?.total_present
														: '-'}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{salary?.total_absent == 0
														? 0
														: salary?.total_absent
														? salary?.total_absent
														: '-'}
													<br />
													<strong>{sortableFields[5].title}:</strong>{' '}
													{salary?.period ? salary?.period : '-'}
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
					{paginatedAdminData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedAdminData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredAdminData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
		</>
	)
}

export default EmployeeSalary
