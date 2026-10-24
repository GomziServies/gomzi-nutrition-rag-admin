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
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetAdminUsers } from '../../../Functions/FGGroup/AdminUsers'
import { GetGlsSalary } from '../../../Functions/FGGroup/GlsSalary'
import '../common-management.css'

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
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Employee Salary</PageTitle>

			<nav className='gz-mgmt-breadcrumb'>
				<a href='/rag/dashboard'>Dashboard</a>
				<span>/</span>
				<a href='/rag/employees'>Staff Management</a>
				<span>/</span>
				<span>Employee Salary</span>
			</nav>

			<div className='gz-mgmt-header mb-6'>
				<div>
					<h1 className='gz-mgmt-title'>Employee Salary Sheet</h1>
					<p className='gz-mgmt-subtitle'>
						Review monthly salary disbursements, attendance figures, deductions, and net payouts
					</p>
				</div>
			</div>

			<div className='gz-mgmt-card'>
				<div className='gz-mgmt-toolbar flex-wrap gap-3'>
					<div className='gz-mgmt-toolbar-left flex-wrap gap-3'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							className='me-0'
						/>
						<LengthMenu
							expenseData={salaryData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>
						<div>
							<DownloadExcelButton
								onClick={downloadExcel}
								disabled={exporting}
								loading={exporting}
								title='Download Excel'
							/>
						</div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
							lastMonth={true}
						/>
					</div>
				</div>

				<div className='card-body p-0'>
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
										className='data-row'
									>
										<td className='text-center'>
											<div className='d-flex justify-content-center align-items-center'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 d-md-none'
													style={{ color: '#607D8B', fontSize: '14px' }}
												/>
												<span className='fw-bold text-muted fs-7'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<div className='gz-mgmt-identity-cell'>
												<img
													src={
														salary?.employee_photo || salary?.photo
															? `https://files.fggroup.in/${salary?.employee_photo || salary?.photo}`
															: toAbsoluteUrl('/media/logos/fgiit-logo.png')
													}
													alt={salary?.employee_name || salary?.full_name}
													className='gz-mgmt-avatar'
													onError={(e) => {
														const target = e.currentTarget
														target.style.display = 'none'
														if (target.nextElementSibling) {
															(target.nextElementSibling as HTMLElement).style.display = 'flex'
														}
													}}
												/>
												<div
													className='gz-mgmt-avatar-fallback'
													style={{ display: 'none' }}
												>
													{(salary?.employee_name || salary?.full_name || 'E').charAt(0).toUpperCase()}
												</div>
												<div className='gz-mgmt-identity-info'>
													<span className='gz-mgmt-identity-name'>
														{salary?.employee_name || salary?.full_name || 'Unnamed Employee'}
													</span>
													<span className='gz-mgmt-identity-sub'>
														{salary?.mobile || salary?.employee_code || 'No contact'}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='fw-bold' style={{ color: '#0F172A' }}>
												{salary?.total_salary ? `₹${Number(salary.total_salary).toLocaleString('en-IN')}` : '-'}
											</span>
										</td>
										<td>
											<span className='fw-bold' style={{ color: '#16A34A' }}>
												{salary?.final_salary !== undefined ? `₹${Number(salary.final_salary).toLocaleString('en-IN')}` : '-'}
											</span>
										</td>
										<td>
											<span className='gz-mgmt-pill success'>
												{salary?.total_present !== undefined ? `${salary.total_present} Days` : '-'}
											</span>
										</td>
										<td>
											<span className='gz-mgmt-pill danger'>
												{salary?.total_absent !== undefined ? `${salary.total_absent} Days` : '0 Days'}
											</span>
										</td>
										<td>
											<span className='gz-mgmt-pill info'>
												{salary?.period ? salary?.period : '-'}
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
													window.location.href = `/rag/employee-salary-view?employee_id=${salary?.employee_id}`
												}}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div className='p-4' style={{ background: '#F8FAFC', borderRadius: '8px' }}>
													<strong>Employee:</strong> {salary?.employee_name || salary?.full_name} ({salary?.mobile})<br />
													<strong>Base Salary:</strong> ₹{salary?.total_salary || 0}<br />
													<strong>Final Salary:</strong> ₹{salary?.final_salary || 0}<br />
													<strong>Present:</strong> {salary?.total_present || 0} days<br />
													<strong>Absent:</strong> {salary?.total_absent || 0} days<br />
													<strong>Period:</strong> {salary?.period || '-'}
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
						<div className='d-flex text-center w-100 align-content-center justify-content-center py-10 text-muted'>
							<b>No salary records found</b>
						</div>
					)}
					{paginatedAdminData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredAdminData.length / pagination.itemsPerPage) || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
							totalRecords={filteredAdminData.length}
							itemsPerPage={pagination.itemsPerPage}
							entityName='salary records'
						/>
					)}
				</div>
			</div>
		</div>
	)
}

export default EmployeeSalary
