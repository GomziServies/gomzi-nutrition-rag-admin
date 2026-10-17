import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployeeRating, GetEmployees } from '../../../Functions/FGGroup/Employee'
import { GetGlsEmployees } from '../../../Functions/FGGroup/GlsEmployee'
import { Charts1 } from './Charts1'
import './reports.css'

interface EmployeeOption {
	id: string
	name: string
	employee_code?: string
	position?: string
	email?: string
	mobile?: string
	photo?: string
	source?: 'Standard' | 'GLS'
}

const HRReports: React.FC = () => {
	const location = useLocation()
	const navigate = useNavigate()
	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
	const employeeIdParam = searchParams.get('employee_id')

	const [employeeList, setEmployeeList] = useState<EmployeeOption[]>([])
	const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [rattingData, setRattingData] = useState<any>(null)
	const [loading, setLoading] = useState(false)
	const [loadingEmployees, setLoadingEmployees] = useState(false)

	// Table view state (when viewing all employees)
	const [searchTerm, setSearchTerm] = useState('')
	const [sourceFilter, setSourceFilter] = useState<'All' | 'Standard' | 'GLS'>('All')
	const [tableSort, setTableSort] = useState<string>('name')
	const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc'>('asc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	// Fetch both Standard and GLS employees to support star button clicks from both directories
	const fetchAllEmployees = async () => {
		setLoadingEmployees(true)
		try {
			const [standardRes, glsRes] = await Promise.allSettled([
				GetEmployees({ limit: 1000 }),
				GetGlsEmployees({ limit: 1000 }),
			])

			const standardData: EmployeeOption[] =
				standardRes.status === 'fulfilled' && standardRes.value?.data
					? standardRes.value.data.map((el: any) => ({
							id: el?._id,
							name: el?.full_name || el?.name || 'Unnamed',
							employee_code: el?.employee_code || el?.employee?.employee_code || '',
							position: el?.employee?.position || el?.position || 'Employee',
							email: el?.email || '',
							mobile: el?.mobile || el?.employee?.mobile || '',
							photo: el?.employee?.photo || el?.photo || '',
							source: 'Standard',
					  }))
					: []

			const glsData: EmployeeOption[] =
				glsRes.status === 'fulfilled' && glsRes.value?.data
					? glsRes.value.data.map((el: any) => ({
							id: el?._id,
							name: el?.full_name || el?.name || 'Unnamed',
							employee_code: el?.employee_code || '',
							position: el?.position || 'GLS Staff',
							email: el?.email || '',
							mobile: el?.mobile || '',
							photo: el?.photo || '',
							source: 'GLS',
					  }))
					: []

			const map = new Map<string, EmployeeOption>()
			;[...standardData, ...glsData].forEach((emp) => {
				if (emp.id && !map.has(emp.id)) {
					map.set(emp.id, emp)
				}
			})

			const merged = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
			setEmployeeList(merged)

			// Resolve employee_id from query params if present
			if (employeeIdParam) {
				const match = merged.find(
					(el) => el.id === employeeIdParam || el.employee_code === employeeIdParam
				)
				if (match) {
					setSelectedEmployee(match)
				} else {
					// Fallback targeted single query if not present in the lists
					fetchSingleEmployee(employeeIdParam)
				}
			}
		} catch (error) {
			console.error('Error fetching employee directory:', error)
		} finally {
			setLoadingEmployees(false)
		}
	}

	// Targeted fallback for an exact employee ID
	const fetchSingleEmployee = async (id: string) => {
		try {
			const [empRes, glsRes] = await Promise.allSettled([
				GetEmployees({ id }),
				GetGlsEmployees({ id }),
			])

			let target: EmployeeOption | null = null

			if (empRes.status === 'fulfilled' && empRes.value?.data?.[0]) {
				const el = empRes.value.data[0]
				target = {
					id: el?._id,
					name: el?.full_name || el?.name || 'Unnamed',
					employee_code: el?.employee_code || el?.employee?.employee_code || '',
					position: el?.employee?.position || el?.position || 'Employee',
					email: el?.email || '',
					mobile: el?.mobile || el?.employee?.mobile || '',
					photo: el?.employee?.photo || el?.photo || '',
					source: 'Standard',
				}
			} else if (glsRes.status === 'fulfilled' && glsRes.value?.data?.[0]) {
				const el = glsRes.value.data[0]
				target = {
					id: el?._id,
					name: el?.full_name || el?.name || 'Unnamed',
					employee_code: el?.employee_code || '',
					position: el?.position || 'GLS Staff',
					email: el?.email || '',
					mobile: el?.mobile || '',
					photo: el?.photo || '',
					source: 'GLS',
				}
			}

			if (target) {
				setSelectedEmployee(target)
				setEmployeeList((prev) => [target!, ...prev.filter((p) => p.id !== target!.id)])
			}
		} catch (err) {
			console.error('Error fetching single employee details:', err)
		}
	}

	useEffect(() => {
		fetchAllEmployees()
	}, [])

	// Update selected employee when URL parameter changes
	useEffect(() => {
		if (employeeIdParam && employeeList.length > 0) {
			const match = employeeList.find(
				(el) => el.id === employeeIdParam || el.employee_code === employeeIdParam
			)
			if (match) {
				if (match.id !== selectedEmployee?.id) {
					setSelectedEmployee(match)
				}
			} else {
				fetchSingleEmployee(employeeIdParam)
			}
		} else if (!employeeIdParam) {
			setSelectedEmployee(null)
		}
	}, [employeeIdParam, employeeList])

	// Fetch rating and task stats whenever selected employee or date range changes
	const fetchRattingData = async () => {
		if (!selectedEmployee?.id) {
			setRattingData(null)
			return
		}

		setLoading(true)
		try {
			let startDate: any
			let endDate: any

			if (selectedDateRange) {
				startDate = new Date(selectedDateRange[0])
				startDate.setHours(0, 0, 0, 0)

				endDate = new Date(selectedDateRange[1])
				endDate.setHours(23, 59, 59, 999)
			} else {
				// Default to last month as per HR standard
				const now = new Date()
				startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
				endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
			}

			const response = await GetEmployeeRating({
				admin_id: selectedEmployee.id,
				from_date: startDate,
				to_date: endDate,
			})

			const raw = response.data
			const data: any = Array.isArray(raw) ? raw[0] : raw
			setRattingData(data || {})
		} catch (error) {
			console.error('Error fetching employee rating data:', error)
			setRattingData(null)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchRattingData()
	}, [selectedEmployee, selectedDateRange])

	const handleEmployeeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedId = event.target.value

		if (!selectedId) {
			setSelectedEmployee(null)
			navigate('/hr/reports')
		} else {
			const matched = employeeList.find((el) => el.id === selectedId)
			if (matched) {
				setSelectedEmployee(matched)
				navigate(`/hr/reports?employee_id=${matched.id}`)
			}
		}
	}

	const handleViewEmployeeReport = (emp: EmployeeOption) => {
		setSelectedEmployee(emp)
		navigate(`/hr/reports?employee_id=${emp.id}`)
	}

	const handleBackToAllEmployees = () => {
		setSelectedEmployee(null)
		navigate('/hr/reports')
	}

	const handleSearchChange = (term: React.SetStateAction<string>) => {
		setSearchTerm((prev) => {
			const next = typeof term === 'function' ? term(prev) : term
			if (next !== prev) {
				setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }))
			}
			return next
		})
	}

	const handleTableSortChange = (newSort: string, newSortOrder: any) => {
		setTableSort(newSort)
		setTableSortOrder(newSortOrder)
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage, page: 1 }))
	}

	const filteredEmployees = useMemo(() => {
		let list = employeeList

		if (sourceFilter !== 'All') {
			list = list.filter((emp) => emp.source === sourceFilter)
		}

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim()
			list = list.filter(
				(emp) =>
					(emp.name || '').toLowerCase().includes(term) ||
					(emp.employee_code || '').toLowerCase().includes(term) ||
					(emp.position || '').toLowerCase().includes(term) ||
					(emp.email || '').toLowerCase().includes(term) ||
					(emp.mobile || '').toLowerCase().includes(term)
			)
		}

		return list
	}, [employeeList, sourceFilter, searchTerm])

	const sortedEmployees = useMemo(() => {
		return [...filteredEmployees].sort((a, b) => {
			let aVal: any = a[tableSort as keyof EmployeeOption] ?? ''
			let bVal: any = b[tableSort as keyof EmployeeOption] ?? ''

			if (tableSort === 'employee_code') {
				const aNum = Number(String(aVal).replace(/\D/g, ''))
				const bNum = Number(String(bVal).replace(/\D/g, ''))
				if (!isNaN(aNum) && !isNaN(bNum) && aNum !== 0 && bNum !== 0) {
					return tableSortOrder === 'asc' ? aNum - bNum : bNum - aNum
				}
			}

			return tableSortOrder === 'asc'
				? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
				: String(bVal).localeCompare(String(aVal), undefined, { numeric: true, sensitivity: 'base' })
		})
	}, [filteredEmployees, tableSort, tableSortOrder])

	const paginatedEmployees = useMemo(() => {
		const start = (pagination.page - 1) * pagination.itemsPerPage
		return sortedEmployees.slice(start, start + pagination.itemsPerPage)
	}, [sortedEmployees, pagination])

	const tableColumns = [
		{ title: 'Employee', field: 'name' },
		{ title: 'Employee Code', field: 'employee_code' },
		{ title: 'Designation / Role', field: 'position' },
		{ title: 'Contact', field: 'mobile' },
		{ title: 'Directory', field: 'source' },
	]

	const excelColumns = [
		{ title: 'Employee Name', field: 'name' },
		{ title: 'Employee Code', field: 'employee_code' },
		{ title: 'Position', field: 'position' },
		{ title: 'Mobile', field: 'mobile' },
		{ title: 'Email', field: 'email' },
		{ title: 'Directory', field: 'source' },
	]

	// Computed metrics
	const totalTasks = parseInt(rattingData?.total_task || '0', 10) || 0
	const completedTasks = parseInt(rattingData?.completed_task || '0', 10) || 0
	const lateCompletedTasks = parseInt(rattingData?.late_completed || '0', 10) || 0
	const pendingTasks =
		parseInt(rattingData?.pending_task || '0', 10) ||
		Math.max(0, totalTasks - completedTasks - lateCompletedTasks)
	const rejectedTasks = parseInt(rattingData?.rejected_task || '0', 10) || 0

	const completedRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
	const lateRate = totalTasks > 0 ? Math.round((lateCompletedTasks / totalTasks) * 100) : 0
	const pendingRate = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0
	const rejectedRate = totalTasks > 0 ? Math.round((rejectedTasks / totalTasks) * 100) : 0

	// Rating score
	const ratingValue = Number(rattingData?.rating || 0)
	const isOutOfFive = ratingValue > 0 && ratingValue <= 5
	const ratingPercent = isOutOfFive ? Math.round(ratingValue * 20) : Math.round(ratingValue)
	const starsCount = Math.min(5, Math.max(0, Math.round(ratingPercent / 20)))

	const getRatingTier = (score: number) => {
		if (score >= 90) return { label: 'Outstanding', class: 'is-success' }
		if (score >= 75) return { label: 'Good Performance', class: 'is-success' }
		if (score >= 50) return { label: 'Average', class: 'is-warning' }
		if (score > 0) return { label: 'Needs Improvement', class: 'is-danger' }
		return { label: 'Not Rated', class: 'is-neutral' }
	}
	const ratingTier = getRatingTier(ratingPercent)

	// Back URL target based on employee type or default
	const backLink =
		selectedEmployee?.source === 'GLS' ? '/hr/gls-employees' : '/hr/employee-detail'

	return (
		<>
			<PageTitle breadcrumbs={[]}>Task Performance Reports</PageTitle>

			{selectedEmployee ? (
				/* ======================= INDIVIDUAL EMPLOYEE DETAIL VIEW ======================= */
				<>
					{/* Detail View Header Bar */}
					<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
						<div className='d-flex align-items-center gap-3'>
							<button
								type='button'
								onClick={handleBackToAllEmployees}
								className='gz-rep-back-btn'>
								<i className='bi bi-arrow-left me-2'></i>
								<span>All Employees</span>
							</button>
							<div className='vr h-25px my-auto d-none d-sm-block' style={{ color: '#E4EAF2' }}></div>
							<div>
								<h2 className='fw-bold fs-2 m-0' style={{ color: '#142447' }}>
									Performance Report: {selectedEmployee.name}
								</h2>
								<span className='fs-7 fw-semibold' style={{ color: '#71809A' }}>
									Individual task completion breakdown, deadlines audit & rating evaluation
								</span>
							</div>
						</div>

						<div className='d-flex align-items-center gap-2'>
							<span className='gz-rep-badge is-neutral'>
								<i className='bi bi-shield-check text-primary'></i>
								{selectedEmployee.source === 'GLS' ? 'GLS Staff' : 'Standard HR'}
							</span>
							{selectedEmployee.employee_code && (
								<span className='gz-rep-badge is-success'>
									<i className='bi bi-hash'></i>
									{selectedEmployee.employee_code}
								</span>
							)}
						</div>
					</div>

					{/* Filter & Selector Toolbar Card for Detail View */}
					<div className='gz-rep-card mb-6 px-4 py-3'>
						<div className='row g-3 align-items-center'>
							{/* Employee Selection Dropdown */}
							<div className='col-12 col-md-6 col-lg-5'>
								<label
									className='form-label fs-8 fw-bold text-uppercase mb-1'
									style={{ color: '#71809A', letterSpacing: '0.04em' }}>
									Select Employee
								</label>
								<select
									className='gz-rep-select w-100'
									value={selectedEmployee?.id || ''}
									onChange={handleEmployeeSelect}
									disabled={loadingEmployees}>
									<option value=''>← Back to All Employees Table</option>
									{employeeList.map((emp) => (
										<option key={emp.id} value={emp.id}>
											{emp.employee_code ? `[${emp.employee_code}] ` : ''}
											{emp.name} {emp.position ? `— ${emp.position}` : ''}{' '}
											{emp.source === 'GLS' ? '(GLS)' : ''}
										</option>
									))}
								</select>
							</div>

							{/* Date Range Filter */}
							<div className='col-12 col-md-6 col-lg-7 d-flex justify-content-md-end align-items-end'>
								<div>
									<label
										className='form-label fs-8 fw-bold text-uppercase mb-1 d-block'
										style={{ color: '#71809A', letterSpacing: '0.04em' }}>
										Reporting Period
									</label>
									<DateFilter
										onDateRangeChange={handleDateRangeChange}
										rightValue='0'
										lastMonth={true}
									/>
								</div>
							</div>
						</div>
					</div>
				</>
			) : (
				/* ======================= ALL EMPLOYEES DIRECTORY TABLE VIEW ======================= */
				<>
					{/* Table View Header Bar */}
					<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
						<div className='d-flex align-items-center gap-3'>
							<div className='d-flex flex-column'>
								<div className='d-flex align-items-center gap-2'>
									<h2 className='fw-bold fs-2 m-0' style={{ color: '#142447' }}>
										Employee Performance Reports
									</h2>
									{filteredEmployees.length > 0 && (
										<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
											{filteredEmployees.length} Total
										</span>
									)}
								</div>
								<span className='fs-7 fw-semibold mt-1' style={{ color: '#71809A' }}>
									Directory of employee performance evaluations, task analytics & audit records
								</span>
							</div>
						</div>

						<div className='d-flex align-items-center gap-2'>
							<Link to='/hr/employee-detail' className='gz-rep-back-btn'>
								<i className='bi bi-people me-2'></i>
								<span>Standard Employees</span>
							</Link>
							<Link to='/hr/gls-employees' className='gz-rep-back-btn'>
								<i className='bi bi-building me-2'></i>
								<span>GLS Employees</span>
							</Link>
						</div>
					</div>

					{/* Filter Toolbar for Table View */}
					<div
						className='card shadow-sm border-0 mb-6'
						style={{
							borderRadius: '16px',
							background: '#ffffff',
							border: '1px solid #E4EAF2',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
						}}>
						<div className='card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3'>
							<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
								{/* 1. Searchbar */}
								<div style={{ minWidth: '240px', maxWidth: '360px', flex: '1 1 240px' }}>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={handleSearchChange}
										placeholder='Search employee name, code, role...'
										className='me-0'
									/>
								</div>

								{/* 2. Page Size / Length Menu */}
								<div>
									<LengthMenu
										data={sortedEmployees}
										itemsPerPage={pagination.itemsPerPage}
										handleItemsPerPageChange={handleItemsPerPageChange}
										className='me-0'
									/>
								</div>

								{/* 3. Download Excel Button */}
								<div>
									<DownloadExcelButton
										data={sortedEmployees}
										columns={excelColumns}
										filename='Employee_Performance_Directory'
									/>
								</div>

								{/* 4. Directory Filter */}
								<div style={{ minWidth: '160px' }}>
									<select
										className='gz-rep-select'
										style={{ width: '100%', height: '38px', borderRadius: '8px' }}
										value={sourceFilter}
										onChange={(e) => {
											setSourceFilter(e.target.value as any)
											setPagination((prev) => ({ ...prev, page: 1 }))
										}}>
										<option value='All'>All Directories ({employeeList.length})</option>
										<option value='Standard'>
											Standard HR ({employeeList.filter((e) => e.source === 'Standard').length})
										</option>
										<option value='GLS'>
											GLS Staff ({employeeList.filter((e) => e.source === 'GLS').length})
										</option>
									</select>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Content Area */}
			{loading ? (
				<div className='gz-rep-card p-12 text-center'>
					<div className='spinner-border text-primary mb-3' role='status' style={{ width: '3rem', height: '3rem' }}>
						<span className='visually-hidden'>Loading...</span>
					</div>
					<h5 className='fw-bold text-gray-800 m-0'>Fetching Task Analytics...</h5>
					<span className='text-muted fs-7'>Calculating completion ratios & performance ratings</span>
				</div>
			) : selectedEmployee ? (
				<>
					{/* 1. Executive Employee Profile Hero Card */}
					<div className='gz-rep-card p-6 mb-6'>
						<div className='d-flex flex-wrap align-items-center justify-content-between gap-4'>
							<div className='d-flex align-items-center gap-4'>
								<div className='gz-rep-avatar'>
									{selectedEmployee.photo ? (
										<img
											src={`https://files.fggroup.in/${selectedEmployee.photo}`}
											alt={selectedEmployee.name}
											onError={(e: any) => {
												e.target.style.display = 'none'
												if (e.target.nextSibling) {
													e.target.nextSibling.style.display = 'flex'
												}
											}}
										/>
									) : null}
									<div
										className='gz-rep-avatar-fallback'
										style={{ display: selectedEmployee.photo ? 'none' : 'flex' }}>
										{selectedEmployee.name ? selectedEmployee.name.charAt(0).toUpperCase() : 'E'}
									</div>
								</div>

								<div>
									<div className='d-flex align-items-center gap-2 mb-1'>
										<h3 className='fw-bold fs-3 m-0' style={{ color: '#142447' }}>
											{selectedEmployee.name}
										</h3>
										{selectedEmployee.employee_code && (
											<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
												{selectedEmployee.employee_code}
											</span>
										)}
									</div>
									<div className='d-flex flex-wrap align-items-center gap-3 fs-7' style={{ color: '#71809A' }}>
										<span>
											<i className='bi bi-briefcase text-primary me-1'></i>
											{selectedEmployee.position || 'Staff'}
										</span>
										{selectedEmployee.mobile && (
											<>
												<span>•</span>
												<span>
													<i className='bi bi-telephone text-primary me-1'></i>
													<a
														href={`tel:${selectedEmployee.mobile}`}
														className='text-muted text-hover-primary text-decoration-none'>
														{selectedEmployee.mobile}
													</a>
												</span>
											</>
										)}
										{selectedEmployee.email && (
											<>
												<span>•</span>
												<span>
													<i className='bi bi-envelope text-primary me-1'></i>
													<a
														href={`mailto:${selectedEmployee.email}`}
														className='text-muted text-hover-primary text-decoration-none'>
														{selectedEmployee.email}
													</a>
												</span>
											</>
										)}
									</div>
								</div>
							</div>

							{/* Rating Score Box */}
							<div className='gz-rep-rating-box'>
								<div className='d-flex align-items-center justify-content-between mb-1'>
									<span className='fs-8 fw-bold text-uppercase' style={{ color: '#71809A', letterSpacing: '0.04em' }}>
										Performance Rating
									</span>
									<span className={`gz-rep-badge ${ratingTier.class}`}>{ratingTier.label}</span>
								</div>

								<div className='d-flex align-items-baseline gap-2 mt-2'>
									<span className='fs-2hx fw-bold' style={{ color: '#142447', lineHeight: 1 }}>
										{ratingPercent > 0 ? `${ratingPercent}%` : 'N/A'}
									</span>
									{ratingPercent > 0 && (
										<div className='d-flex align-items-center gap-1 ms-1'>
											{Array.from({ length: 5 }).map((_, idx) => (
												<i
													key={idx}
													className={`bi bi-star-fill fs-7 ${
														idx < starsCount ? 'text-warning' : 'text-gray-300'
													}`}></i>
											))}
										</div>
									)}
								</div>

								<div className='gz-rep-rating-progress'>
									<div
										className='gz-rep-rating-bar'
										style={{
											width: `${Math.min(100, Math.max(0, ratingPercent))}%`,
											backgroundColor:
												ratingPercent >= 75 ? '#16a34a' : ratingPercent >= 50 ? '#f59e0b' : '#dc2626',
										}}></div>
								</div>
							</div>
						</div>
					</div>

					{/* 2. 4 Executive KPI Metric Cards */}
					<div className='row g-4 mb-6'>
						{/* Total Tasks */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div className='gz-rep-kpi-card is-primary'>
								<div>
									<div className='kpi-icon-wrap'>
										<i className='bi bi-list-task'></i>
									</div>
									<span className='kpi-label'>Total Assigned</span>
									<div className='kpi-value'>{totalTasks}</div>
								</div>
								<div className='kpi-subtext'>
									<i className='bi bi-calendar3 text-muted'></i>
									<span>Assigned for selected range</span>
								</div>
							</div>
						</div>

						{/* Completed on Time */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div className='gz-rep-kpi-card is-success'>
								<div>
									<div className='kpi-icon-wrap'>
										<i className='bi bi-check2-circle'></i>
									</div>
									<span className='kpi-label'>Completed on Time</span>
									<div className='kpi-value'>{completedTasks}</div>
								</div>
								<div className='kpi-subtext'>
									<span className='fw-bold text-success'>{completedRate}%</span>
									<span>completion efficiency</span>
								</div>
							</div>
						</div>

						{/* Late Completed */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div className='gz-rep-kpi-card is-warning'>
								<div>
									<div className='kpi-icon-wrap'>
										<i className='bi bi-clock-history'></i>
									</div>
									<span className='kpi-label'>Late Completed</span>
									<div className='kpi-value'>{lateCompletedTasks}</div>
								</div>
								<div className='kpi-subtext'>
									<span className='fw-bold text-warning'>{lateRate}%</span>
									<span>delayed submissions</span>
								</div>
							</div>
						</div>

						{/* Pending Work */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div className='gz-rep-kpi-card is-danger'>
								<div>
									<div className='kpi-icon-wrap'>
										<i className='bi bi-hourglass-split'></i>
									</div>
									<span className='kpi-label'>Pending Tasks</span>
									<div className='kpi-value'>{pendingTasks}</div>
								</div>
								<div className='kpi-subtext'>
									<span className='fw-bold text-danger'>{pendingRate}%</span>
									<span>unresolved or overdue</span>
								</div>
							</div>
						</div>
					</div>

					{/* 3. Visual Analytics & Itemized Performance Scorecard */}
					<div className='row g-6 mb-6'>
						{/* Donut Chart Breakdown */}
						<div className='col-12 col-lg-5'>
							<div className='gz-rep-card p-6 h-100 d-flex flex-direction-column justify-content-between'>
								<div>
									<div className='d-flex align-items-center justify-content-between mb-4'>
										<div>
											<h4 className='fw-bold fs-5 m-0' style={{ color: '#142447' }}>
												Task Distribution
											</h4>
											<span className='text-muted fs-7'>Proportional audit of task delivery</span>
										</div>
										<span className='badge badge-light-primary fs-8 fw-semibold'>Apex Donut</span>
									</div>

									{totalTasks > 0 ? (
										<Charts1 rattingData={rattingData} className='mb-2' />
									) : (
										<div className='d-flex flex-column align-items-center justify-content-center py-10 text-center'>
											<i className='bi bi-pie-chart text-gray-400 fs-1 mb-2'></i>
											<span className='text-muted fs-7'>No task records logged in this period</span>
										</div>
									)}
								</div>

								{totalTasks > 0 && (
									<div className='border-top pt-4 mt-2' style={{ borderColor: '#E4EAF2' }}>
										<div className='d-flex align-items-center justify-content-between fs-8' style={{ color: '#71809A' }}>
											<span>On-time Rate: <strong className='text-success'>{completedRate}%</strong></span>
											<span>Late Rate: <strong className='text-warning'>{lateRate}%</strong></span>
											<span>Pending: <strong className='text-danger'>{pendingRate}%</strong></span>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Itemized Scorecard Audit Table */}
						<div className='col-12 col-lg-7'>
							<div className='gz-rep-card p-6 h-100'>
								<div className='d-flex align-items-center justify-content-between mb-4'>
									<div>
										<h4 className='fw-bold fs-5 m-0' style={{ color: '#142447' }}>
											Itemized Performance Scorecard
										</h4>
										<span className='text-muted fs-7'>Detailed metrics and quality index</span>
									</div>
									<span className='badge badge-light fs-8 text-gray-700 fw-bold border'>
										Total: {totalTasks} Tasks
									</span>
								</div>

								<div className='table-responsive'>
									<table className='gz-scorecard-table'>
										<thead>
											<tr>
												<th>Task Classification</th>
												<th className='text-center'>Volume</th>
												<th className='text-center'>Ratio</th>
												<th className='text-end'>Evaluation</th>
											</tr>
										</thead>
										<tbody>
											{/* Completed on Time */}
											<tr>
												<td>
													<div className='d-flex align-items-center gap-2'>
														<i className='bi bi-check-circle-fill text-success fs-5'></i>
														<div>
															<span className='fw-bold text-gray-900 d-block'>
																Completed on Time
															</span>
															<span className='text-muted fs-8'>Finished before deadline</span>
														</div>
													</div>
												</td>
												<td className='text-center fw-bold fs-6'>{completedTasks}</td>
												<td className='text-center fw-semibold text-gray-700'>{completedRate}%</td>
												<td className='text-end'>
													<span className='gz-rep-badge is-success'>
														<i className='bi bi-hand-thumbs-up'></i> Excellent
													</span>
												</td>
											</tr>

											{/* Late Completed */}
											<tr>
												<td>
													<div className='d-flex align-items-center gap-2'>
														<i className='bi bi-clock-history text-warning fs-5'></i>
														<div>
															<span className='fw-bold text-gray-900 d-block'>
																Late Completed
															</span>
															<span className='text-muted fs-8'>Finished after target date</span>
														</div>
													</div>
												</td>
												<td className='text-center fw-bold fs-6'>{lateCompletedTasks}</td>
												<td className='text-center fw-semibold text-gray-700'>{lateRate}%</td>
												<td className='text-end'>
													<span className='gz-rep-badge is-warning'>
														<i className='bi bi-exclamation-triangle'></i> Delayed
													</span>
												</td>
											</tr>

											{/* Pending Tasks */}
											<tr>
												<td>
													<div className='d-flex align-items-center gap-2'>
														<i className='bi bi-hourglass-split text-danger fs-5'></i>
														<div>
															<span className='fw-bold text-gray-900 d-block'>
																Pending Tasks
															</span>
															<span className='text-muted fs-8'>Awaiting completion or overdue</span>
														</div>
													</div>
												</td>
												<td className='text-center fw-bold fs-6'>{pendingTasks}</td>
												<td className='text-center fw-semibold text-gray-700'>{pendingRate}%</td>
												<td className='text-end'>
													<span className='gz-rep-badge is-danger'>
														<i className='bi bi-exclamation-octagon'></i> Overdue
													</span>
												</td>
											</tr>

											{/* Rejected Tasks if any */}
											{rejectedTasks > 0 && (
												<tr>
													<td>
														<div className='d-flex align-items-center gap-2'>
															<i className='bi bi-x-circle text-muted fs-5'></i>
															<div>
																<span className='fw-bold text-gray-900 d-block'>
																	Rejected Tasks
																</span>
																<span className='text-muted fs-8'>Returned by manager</span>
															</div>
														</div>
													</td>
													<td className='text-center fw-bold fs-6'>{rejectedTasks}</td>
													<td className='text-center fw-semibold text-gray-700'>{rejectedRate}%</td>
													<td className='text-end'>
														<span className='gz-rep-badge is-neutral'>
															<i className='bi bi-arrow-counterclockwise'></i> Revision
														</span>
													</td>
												</tr>
											)}

											{/* Summary Row */}
											<tr className='gz-scorecard-total-row'>
												<td>
													<span className='fw-bolder' style={{ color: '#142447' }}>
														Total Tasks Audit
													</span>
												</td>
												<td className='text-center fw-bolder fs-6' style={{ color: '#142447' }}>
													{totalTasks}
												</td>
												<td className='text-center fw-bolder' style={{ color: '#142447' }}>
													100%
												</td>
												<td className='text-end'>
													<span className='fw-bold text-primary'>
														Score: {ratingPercent}%
													</span>
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				</>
			) : (
				/* Table View rendered when no employee is selected */
				<div className='gz-inv-table-card'>
					<Table
						data={paginatedEmployees}
						columns={tableColumns}
						sort={tableSort}
						sortOrder={tableSortOrder}
						onSortChange={handleTableSortChange}
						disableSortFields={[]}
						pagination={pagination}
						setPagination={setPagination}
						loading={loadingEmployees}
						renderRow={(employee: EmployeeOption, index: number, actualIndex: number) => (
							<tr
								key={employee.id}
								className='data-row'
								onClick={() => handleViewEmployeeReport(employee)}
								style={{ transition: 'background-color 0.15s ease', cursor: 'pointer' }}>
								<td className='text-center ps-4'>
									<span className='text-muted fw-bold fs-7'>{actualIndex}</span>
								</td>
								<td>
									<div className='d-flex align-items-center gap-3'>
										<div
											className='symbol symbol-circle overflow-hidden flex-shrink-0'
											style={{
												width: '40px',
												height: '40px',
												minWidth: '40px',
												minHeight: '40px',
												borderRadius: '50%',
												background: '#F1F5F9',
												border: '2px solid #E2E8F0',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												overflow: 'hidden',
											}}>
											{employee.photo ? (
												<img
													src={`https://files.fggroup.in/${employee.photo}`}
													alt={employee.name}
													style={{ width: '100%', height: '100%', objectFit: 'cover' }}
													onError={(e: any) => {
														e.target.style.display = 'none'
													}}
												/>
											) : (
												<span className='fw-bold text-gray-700 fs-7'>
													{employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
												</span>
											)}
										</div>
										<div className='d-flex flex-column'>
											<span className='text-gray-900 fw-bold fs-6 text-hover-primary'>
												{employee.name}
											</span>
											<span className='text-muted fs-7'>
												{employee.email || employee.mobile || 'No email specified'}
											</span>
										</div>
									</div>
								</td>
								<td>
									<span
										className='badge badge-light-secondary text-dark fw-bold fs-7 px-3 py-2'
										style={{ letterSpacing: '0.5px' }}>
										{employee.employee_code || '-'}
									</span>
								</td>
								<td>
									<span className='badge badge-light-primary fw-semibold fs-7 px-3 py-2'>
										{employee.position || 'Staff'}
									</span>
								</td>
								<td>
									<span className='text-gray-700 fw-semibold fs-7'>
										{employee.mobile || '-'}
									</span>
								</td>
								<td>
									<span
										className={`badge ${
											employee.source === 'GLS'
												? 'badge-light-warning text-warning'
												: 'badge-light-success text-success'
										} fw-bold fs-7 px-3 py-2`}>
										{employee.source === 'GLS' ? 'GLS Staff' : 'Standard HR'}
									</span>
								</td>
								<td className='text-center pe-4'>
									<button
										type='button'
										className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-1.5 px-3 py-2'
										style={{ borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}
										onClick={(e) => {
											e.stopPropagation()
											handleViewEmployeeReport(employee)
										}}
										title='View Performance Report'>
										<i className='bi bi-eye-fill fs-6 text-primary'></i>
										<span>View</span>
									</button>
								</td>
							</tr>
						)}
					/>

					{sortedEmployees.length === 0 && !loadingEmployees && (
						<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center py-12'>
							<i className='bi bi-people text-muted fs-2x mb-2'></i>
							<span className='text-gray-700 fw-bold fs-6'>No employees found</span>
							<span className='text-muted fs-7'>Try refining your search keyword or directory filter</span>
						</div>
					)}

					{sortedEmployees.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(sortedEmployees.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
							totalRecords={sortedEmployees.length}
							itemsPerPage={pagination.itemsPerPage}
						/>
					)}
				</div>
			)}
		</>
	)
}

export default HRReports
