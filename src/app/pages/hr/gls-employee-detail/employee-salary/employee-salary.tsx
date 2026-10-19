import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import DownloadExcelButton from '../../../../components/DownloadExcelButton'
import SelectField from '../../../../components/SelectField'
import UsersListPagination from '../../../../components/TablePagination'
import { GetAdminUsers } from '../../../../Functions/FGGroup/AdminUsers'
import { GetGlsSalary } from '../../../../Functions/FGGroup/GlsSalary'

interface PaginationState {
	page: number
	itemsPerPage: number
}

const GlsEmployeeSalary = () => {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState(
		() => localStorage.getItem('hr_gls_salary_searchTerm') || ''
	)
	const [salaryData, setSalaryData] = useState<any>([])
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		const storedRange =
			localStorage.getItem('hr_gls_salary_selectedDateRange') ||
			localStorage.getItem('selectedDateRange')
		if (storedRange) {
			try {
				const parsed = JSON.parse(storedRange)
				return [new Date(parsed.from || parsed[0]), new Date(parsed.to || parsed[1])]
			} catch (e) {
				return null
			}
		}
		return null
	})
	const [selectedSubject, setSelectedSubject] = useState('')
	const [selectedStatus, setSelectedStatus] = useState('')
	const [isRotating, setIsRotating] = useState(false)
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [metaData, setMetaData] = useState<any>()
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState<PaginationState>(() => {
		try {
			const saved = localStorage.getItem('hr_gls_salary_pagination')
			return saved ? JSON.parse(saved) : { page: 1, itemsPerPage: 10 }
		} catch (e) {
			return { page: 1, itemsPerPage: 10 }
		}
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
		searchTerm,
	])

	useEffect(() => {
		if (selectedDateRange) {
			localStorage.setItem(
				'hr_gls_salary_selectedDateRange',
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
			localStorage.removeItem('hr_gls_salary_selectedDateRange')
			localStorage.removeItem('selectedDateRange')
		}
	}, [selectedDateRange])

	useEffect(() => {
		localStorage.setItem('hr_gls_salary_pagination', JSON.stringify(pagination))
	}, [pagination])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		localStorage.setItem('hr_gls_salary_searchTerm', searchTerm)
		setPagination((prev) => ({ ...prev, page: 1 }))
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
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
	}

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

	const handleEmployeeChange = (event: any) => {
		const val = typeof event === 'object' && event?.target ? event.target.value : event
		setSelectedEmployee(val || '')
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

	const handleSortChange = (newSort: string, newSortOrder: any) => {
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

			{/* Filter Toolbar (Order: Search -> LengthMenu -> DownloadExcel -> Filters -> Date) */}
			<div className='gz-filter-card mb-5'>
				<div className='d-flex align-items-center flex-wrap gap-3 w-100'>
					{/* 1. Search */}
					<div style={{ flex: '1 1 240px', maxWidth: '360px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search employee name...'
						/>
					</div>

					{/* 2. Page Size */}
					<div>
						<LengthMenu
							data={filteredAdminData}
							itemsPerPage={pagination.itemsPerPage}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>

					{/* 3. Export to Excel */}
					<div>
						<DownloadExcelButton
							data={filteredAdminData}
							columns={[
								{ title: 'Employee', field: 'full_name' },
								{ title: 'Salary', field: 'total_salary' },
								{ title: 'Final Salary', field: 'final_salary' },
								{ title: 'Present', field: 'total_present' },
								{ title: 'Absent', field: 'total_absent' },
								{ title: 'Period', field: 'period' },
							]}
							filename='gls_employee_salary_report'
						/>
					</div>

					{/* 4. Employee Dropdown */}
					{employeeOptions.length > 0 && (
						<div style={{ minWidth: '220px' }}>
							<SelectField
								value={selectedEmployee || ''}
								onChange={handleEmployeeChange}
								options={[
									{ value: '', label: 'All Employees' },
									...employeeOptions.map((emp) => ({
										value: emp.value,
										label: emp.label,
									})),
								]}
							/>
						</div>
					)}

					{/* 5. Date Filter */}
					<div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
							lastMonth={true}
						/>
					</div>
				</div>
			</div>

			{/* Table Card */}
			<div className='gz-inv-table-card'>
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
												<div
													className='symbol symbol-circle overflow-hidden flex-shrink-0 me-4'
													style={{
														width: '42px',
														height: '42px',
														minWidth: '42px',
														minHeight: '42px',
														borderRadius: '10px',
													}}>
													<img
														src={
															salary?.employee_photo || salary?.photo
																? `https://files.fggroup.in/${
																		salary?.employee_photo || salary?.photo
																  }`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt={salary?.employee_name || salary?.full_name}
														style={{
															width: '42px',
															height: '42px',
															minWidth: '42px',
															minHeight: '42px',
															borderRadius: '10px',
															objectFit: 'cover',
															display: 'block',
														}}
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
												onClick={(e) => {
													e.stopPropagation()
													if (selectedDateRange) {
														localStorage.setItem(
															'selectedDateRange',
															JSON.stringify({
																from: DayJS(selectedDateRange[0]).format('YYYY-MM-DD'),
																to: DayJS(selectedDateRange[1]).format('YYYY-MM-DD'),
															})
														)
													}
													navigate(
														`/hr/gls-employees-salary-view?employee_id=${
															salary?.employee_id || salary?._id
														}`
													)
												}}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div
															className='symbol symbol-circle overflow-hidden flex-shrink-0 me-4'
															style={{
																width: '42px',
																height: '42px',
																minWidth: '42px',
																minHeight: '42px',
																borderRadius: '10px',
															}}>
															<img
																src={
																	salary?.photo
																		? `https://files.fggroup.in/${salary?.photo}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt={salary?.full_name}
																style={{
																	width: '42px',
																	height: '42px',
																	minWidth: '42px',
																	minHeight: '42px',
																	borderRadius: '10px',
																	objectFit: 'cover',
																	display: 'block',
																}}
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
							totalRecords={filteredAdminData.length}
							itemsPerPage={pagination.itemsPerPage}
						/>
					)}
				</div>
			</div>
		</>
	)
}

export default GlsEmployeeSalary
