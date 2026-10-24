import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
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
		if (score >= 90) return { label: 'Outstanding', badgeClass: 'badge-light-success text-success' }
		if (score >= 75) return { label: 'Good Performance', badgeClass: 'badge-light-success text-success' }
		if (score >= 50) return { label: 'Average', badgeClass: 'badge-light-warning text-warning' }
		if (score > 0) return { label: 'Needs Improvement', badgeClass: 'badge-light-danger text-danger' }
		return { label: 'Not Rated', badgeClass: 'badge-light-secondary text-dark' }
	}
	const ratingTier = getRatingTier(ratingPercent)

	// Back URL target based on employee type
	const backLink =
		selectedEmployee?.source === 'GLS' ? '/hr/gls-employees' : '/hr/employee-detail'

	// Prepare options for SelectField dropdowns
	const employeeSelectOptions = useMemo(() => {
		return employeeList.map((emp) => ({
			label: `${emp.name}${emp.employee_code ? ` (#${emp.employee_code})` : ''} — ${emp.position || 'Staff'}${emp.source === 'GLS' ? ' (GLS)' : ''}`,
			value: emp.id,
		}))
	}, [employeeList])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Task Performance Reports</PageTitle>

			{selectedEmployee ? (
				/* ======================= INDIVIDUAL EMPLOYEE DETAIL VIEW ======================= */
				<>
					{/* Detail View Header Card */}
					<div
						className='card shadow-sm border-0 mb-6'
						style={{
							borderRadius: '16px',
							border: '1px solid #E4EAF2',
							background: '#ffffff',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
						}}>
						<div className='card-body p-5 p-lg-6 d-flex flex-wrap align-items-center justify-content-between gap-4'>
							<div className='d-flex align-items-center gap-3 gap-md-4 flex-wrap'>
								<button
									type='button'
									onClick={handleBackToAllEmployees}
									className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-2'
									style={{ height: '38px', borderRadius: '8px', fontWeight: 600 }}>
									<i className='bi bi-arrow-left fs-6'></i>
									<span>All Employees</span>
								</button>
								<div className='vr h-30px opacity-25 d-none d-sm-block' />
								<div
									className='d-none d-sm-flex align-items-center justify-content-center flex-shrink-0'
									style={{
										width: '46px',
										height: '46px',
										borderRadius: '12px',
										background: '#EAF1FB',
										border: '1px solid #DCE8F8',
									}}>
									<i className='bi bi-graph-up fs-3' style={{ color: '#172B4D' }}></i>
								</div>
								<div>
									<div className='d-flex align-items-center gap-2 flex-wrap'>
										<h2 className='fw-bold fs-3 m-0' style={{ color: '#142447' }}>
											{selectedEmployee.name}
										</h2>
										{selectedEmployee.employee_code && (
											<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
												#{selectedEmployee.employee_code}
											</span>
										)}
										<span className='badge badge-light-secondary text-dark fw-bold fs-8 px-2.5 py-1'>
											{selectedEmployee.source === 'GLS' ? 'GLS Staff' : 'Standard HR'}
										</span>
									</div>
									<span className='fs-7' style={{ color: '#71809A' }}>
										Performance report, task completion analytics & rating evaluation
									</span>
								</div>
							</div>

							<div className='d-flex align-items-center gap-2 ms-auto ms-sm-0'>
								<button
									type='button'
									onClick={fetchRattingData}
									className='btn btn-sm btn-light-secondary text-dark d-inline-flex align-items-center gap-2'
									style={{ height: '38px', borderRadius: '8px', border: '1px solid #DFE7F0', fontWeight: 600 }}
									title='Refresh Analytics'>
									<i className='bi bi-arrow-clockwise text-primary fs-6'></i>
									<span>Refresh</span>
								</button>
								<Link
									to={backLink}
									className='btn btn-sm btn-light-secondary text-dark d-inline-flex align-items-center gap-2'
									style={{ height: '38px', borderRadius: '8px', border: '1px solid #DFE7F0', fontWeight: 600 }}
									title='View Full Employee Profile'>
									<i className='bi bi-person-badge text-primary fs-6'></i>
									<span>Profile</span>
								</Link>
							</div>
						</div>
					</div>

					{/* Filter & Selector Toolbar Card for Detail View */}
					<div
						className='card shadow-sm border-0 mb-6'
						style={{
							borderRadius: '16px',
							background: '#ffffff',
							border: '1px solid #E4EAF2',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
							position: 'relative',
							zIndex: 20,
						}}>
						<div className='card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3'>
							{/* Employee Select */}
							<div style={{ minWidth: '280px', maxWidth: '420px', flex: '1 1 280px' }}>
								<SelectField
									showLabel={false}
									marginRemove={true}
									className='mb-0'
									height='38px'
									name='employee'
									value={selectedEmployee.id}
									defaultLabel='Select employee...'
									options={employeeSelectOptions}
									onChange={(e: any) => {
										const selectedId = e?.target?.value ?? e
										if (!selectedId) {
											handleBackToAllEmployees()
										} else {
											const matched = employeeList.find((el) => el.id === selectedId)
											if (matched) {
												handleViewEmployeeReport(matched)
											}
										}
									}}
								/>
							</div>

							{/* Date Range Filter */}
							<div className='ms-auto'>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
									lastMonth={true}
								/>
							</div>
						</div>
					</div>
				</>
			) : (
				/* ======================= ALL EMPLOYEES DIRECTORY TABLE VIEW ======================= */
				<>
					{/* Table View Header Card */}
					<div
						className='card shadow-sm border-0 mb-6'
						style={{
							borderRadius: '16px',
							border: '1px solid #E4EAF2',
							background: '#ffffff',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
						}}>
						<div className='card-body p-6 d-flex flex-wrap align-items-center justify-content-between gap-4'>
							<div className='d-flex align-items-center gap-4'>
								<div
									className='d-flex align-items-center justify-content-center flex-shrink-0'
									style={{
										width: '52px',
										height: '52px',
										borderRadius: '12px',
										background: '#EAF1FB',
										border: '1px solid #DCE8F8',
									}}>
									<i className='bi bi-graph-up fs-2' style={{ color: '#172B4D' }}></i>
								</div>
								<div>
									<div className='d-flex align-items-center gap-2'>
										<h2 className='fw-bold fs-3 m-0' style={{ color: '#142447' }}>
											Employee Performance Reports
										</h2>
										{filteredEmployees.length > 0 && (
											<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
												{filteredEmployees.length} Total
											</span>
										)}
									</div>
									<span className='fs-7' style={{ color: '#71809A' }}>
										Directory of employee performance evaluations, task analytics & audit records
									</span>
								</div>
							</div>

							<div className='d-flex align-items-center gap-2'>
								<Link
									to='/hr/employee-detail'
									className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-2'
									style={{ height: '38px', borderRadius: '8px', fontWeight: 600 }}>
									<i className='bi bi-people fs-6'></i>
									<span>Standard Employees</span>
								</Link>
								<Link
									to='/hr/gls-employees'
									className='btn btn-sm btn-light-secondary text-dark d-inline-flex align-items-center gap-2'
									style={{ height: '38px', borderRadius: '8px', border: '1px solid #DFE7F0', fontWeight: 600 }}>
									<i className='bi bi-building fs-6 text-primary'></i>
									<span>GLS Employees</span>
								</Link>
							</div>
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
							position: 'relative',
							zIndex: 20,
						}}>
						<div className='card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3'>
							<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
								{/* 1. Searchbar */}
								<div style={{ minWidth: '240px', maxWidth: '340px', flex: '1 1 240px' }}>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={handleSearchChange}
										placeholder='Search name, code, role...'
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

								{/* 4. Directory Filter using SelectField */}
								<div style={{ minWidth: '180px' }}>
									<SelectField
										showLabel={false}
										marginRemove={true}
										className='mb-0'
										height='38px'
										name='sourceFilter'
										value={sourceFilter}
										defaultLabel='All Directories'
										options={[
											{ label: `All Employees (${employeeList.length})`, value: 'All' },
											{
												label: `Standard HR (${employeeList.filter((e) => e.source === 'Standard').length})`,
												value: 'Standard',
											},
											{
												label: `GLS Staff (${employeeList.filter((e) => e.source === 'GLS').length})`,
												value: 'GLS',
											},
										]}
										onChange={(e: any) => {
											const val = e?.target?.value ?? e
											setSourceFilter(val || 'All')
											setPagination((prev) => ({ ...prev, page: 1 }))
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Content Area */}
			{loading ? (
				<div
					className='card shadow-sm border-0 mb-6 p-12 text-center'
					style={{
						borderRadius: '16px',
						background: '#ffffff',
						border: '1px solid #E4EAF2',
					}}>
					<div className='spinner-border text-primary mb-3' role='status' style={{ width: '3rem', height: '3rem' }}>
						<span className='visually-hidden'>Loading...</span>
					</div>
					<h5 className='fw-bold text-gray-800 m-0'>Fetching Task Analytics...</h5>
					<span className='text-muted fs-7'>Calculating completion ratios & performance ratings</span>
				</div>
			) : selectedEmployee ? (
				<>
					{/* 1. Executive Employee Profile Hero Card */}
					<div
						className='card shadow-sm border-0 mb-6'
						style={{
							borderRadius: '16px',
							background: '#ffffff',
							border: '1px solid #E4EAF2',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
						}}>
						<div className='card-body p-6 d-flex flex-wrap align-items-center justify-content-between gap-4'>
							<div className='d-flex align-items-center gap-4'>
								{/* Avatar */}
								<div
									style={{
										width: '64px',
										height: '64px',
										minWidth: '64px',
										minHeight: '64px',
										borderRadius: '50%',
										background: '#F1F5F9',
										border: '2px solid #E2E8F0',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										overflow: 'hidden',
									}}>
									{selectedEmployee.photo ? (
										<img
											src={`https://files.fggroup.in/${selectedEmployee.photo}`}
											alt={selectedEmployee.name}
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
											onError={(e: any) => {
												e.target.style.display = 'none'
												if (e.target.nextSibling) {
													e.target.nextSibling.style.display = 'flex'
												}
											}}
										/>
									) : null}
									<div
										style={{
											display: selectedEmployee.photo ? 'none' : 'flex',
											width: '100%',
											height: '100%',
											alignItems: 'center',
											justifyContent: 'center',
											color: '#172B4D',
											fontSize: '22px',
											fontWeight: 700,
											background: '#EAF1FB',
										}}>
										{selectedEmployee.name ? selectedEmployee.name.charAt(0).toUpperCase() : 'E'}
									</div>
								</div>

								{/* Details */}
								<div>
									<div className='d-flex align-items-center flex-wrap gap-2 mb-2'>
										<h3 className='fw-bold fs-3 m-0' style={{ color: '#142447' }}>
											{selectedEmployee.name}
										</h3>
										{selectedEmployee.employee_code && (
											<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
												#{selectedEmployee.employee_code}
											</span>
										)}
										<span className='badge badge-light-secondary text-dark fw-bold fs-8 px-2.5 py-1'>
											{selectedEmployee.source === 'GLS' ? 'GLS Staff' : 'Standard HR'}
										</span>
									</div>
									<div className='d-flex flex-wrap align-items-center gap-2'>
										<span
											className='badge badge-light-secondary text-dark fs-8 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5'
											style={{ border: '1px solid #DFE7F0' }}>
											<i className='bi bi-briefcase text-primary'></i>
											<span>{selectedEmployee.position || 'Staff'}</span>
										</span>
										{selectedEmployee.mobile && (
											<a
												href={`tel:${selectedEmployee.mobile}`}
												className='badge badge-light-secondary text-dark fs-8 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 text-hover-primary'
												style={{ border: '1px solid #DFE7F0', textDecoration: 'none' }}>
												<i className='bi bi-telephone text-success'></i>
												<span>{selectedEmployee.mobile}</span>
											</a>
										)}
										{selectedEmployee.email && (
											<a
												href={`mailto:${selectedEmployee.email}`}
												className='badge badge-light-secondary text-dark fs-8 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5 text-hover-primary'
												style={{ border: '1px solid #DFE7F0', textDecoration: 'none' }}>
												<i className='bi bi-envelope text-info'></i>
												<span>{selectedEmployee.email}</span>
											</a>
										)}
									</div>
								</div>
							</div>

							{/* Rating Score Box */}
							<div
								style={{
									background: '#F8FAFD',
									border: '1px solid #E4EAF2',
									borderRadius: '14px',
									padding: '16px 20px',
									minWidth: '240px',
								}}>
								<div className='d-flex align-items-center justify-content-between mb-2 gap-3'>
									<span
										className='fs-8 fw-bold text-uppercase d-flex align-items-center gap-1.5'
										style={{ color: '#71809A', letterSpacing: '0.04em' }}>
										<i className='bi bi-star-half text-warning fs-7'></i>
										Performance Rating
									</span>
									<span className={`badge ${ratingTier.badgeClass} fw-bold px-2.5 py-1 fs-8`}>
										{ratingTier.label}
									</span>
								</div>

								<div className='d-flex align-items-baseline gap-2 mt-1'>
									<span className='fs-2hx fw-bold' style={{ color: '#142447', lineHeight: 1 }}>
										{ratingPercent > 0 ? `${ratingPercent}%` : 'N/A'}
									</span>
									{ratingPercent > 0 ? (
										<div className='d-flex align-items-center gap-1 ms-1'>
											{Array.from({ length: 5 }).map((_, idx) => (
												<i
													key={idx}
													className={`bi bi-star-fill fs-7 ${
														idx < starsCount ? 'text-warning' : 'text-gray-300'
													}`}></i>
											))}
										</div>
									) : (
										<span className='text-muted fs-8 fw-semibold ms-1'>Not Evaluated</span>
									)}
								</div>

								<div className='progress h-6px w-100 bg-light-primary mt-3' style={{ borderRadius: '4px' }}>
									<div
										className={`progress-bar ${
											ratingPercent >= 75 ? 'bg-success' : ratingPercent >= 50 ? 'bg-warning' : 'bg-danger'
										}`}
										role='progressbar'
										style={{ width: `${Math.min(100, Math.max(0, ratingPercent))}%` }}></div>
								</div>
							</div>
						</div>
					</div>

					{/* 2. 4 Executive KPI Metric Cards */}
					<div className='row g-4 mb-6'>
						{/* Total Tasks */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div
								className='card shadow-sm border-0 h-100'
								style={{
									borderRadius: '16px',
									background: '#ffffff',
									border: '1px solid #E4EAF2',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
								}}>
								<div className='card-body p-6 d-flex flex-column justify-content-between'>
									<div className='d-flex align-items-center justify-content-between mb-3'>
										<span
											className='fs-8 fw-bold text-uppercase'
											style={{ color: '#71809A', letterSpacing: '0.04em' }}>
											Total Assigned
										</span>
										<div
											className='d-flex align-items-center justify-content-center'
											style={{
												width: '42px',
												height: '42px',
												borderRadius: '10px',
												background: '#EFF6FF',
												color: '#2563EB',
											}}>
											<i className='bi bi-list-task fs-3'></i>
										</div>
									</div>
									<div className='fs-2hx fw-bold mb-2' style={{ color: '#142447', lineHeight: 1 }}>
										{totalTasks}
									</div>
									<div className='d-flex align-items-center gap-1.5 fs-8 text-muted'>
										<i className='bi bi-calendar3 text-muted'></i>
										<span>Assigned for selected range</span>
									</div>
								</div>
							</div>
						</div>

						{/* Completed on Time */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div
								className='card shadow-sm border-0 h-100'
								style={{
									borderRadius: '16px',
									background: '#ffffff',
									border: '1px solid #E4EAF2',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
								}}>
								<div className='card-body p-6 d-flex flex-column justify-content-between'>
									<div className='d-flex align-items-center justify-content-between mb-3'>
										<span
											className='fs-8 fw-bold text-uppercase'
											style={{ color: '#71809A', letterSpacing: '0.04em' }}>
											Completed on Time
										</span>
										<div
											className='d-flex align-items-center justify-content-center'
											style={{
												width: '42px',
												height: '42px',
												borderRadius: '10px',
												background: '#ECFDF5',
												color: '#059669',
											}}>
											<i className='bi bi-check2-circle fs-3'></i>
										</div>
									</div>
									<div className='fs-2hx fw-bold mb-2' style={{ color: '#059669', lineHeight: 1 }}>
										{completedTasks}
									</div>
									<div className='d-flex align-items-center gap-1.5 fs-8'>
										<span className='badge badge-light-success fw-bold px-2 py-0.5'>{completedRate}%</span>
										<span className='text-muted'>completion efficiency</span>
									</div>
								</div>
							</div>
						</div>

						{/* Late Completed */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div
								className='card shadow-sm border-0 h-100'
								style={{
									borderRadius: '16px',
									background: '#ffffff',
									border: '1px solid #E4EAF2',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
								}}>
								<div className='card-body p-6 d-flex flex-column justify-content-between'>
									<div className='d-flex align-items-center justify-content-between mb-3'>
										<span
											className='fs-8 fw-bold text-uppercase'
											style={{ color: '#71809A', letterSpacing: '0.04em' }}>
											Late Completed
										</span>
										<div
											className='d-flex align-items-center justify-content-center'
											style={{
												width: '42px',
												height: '42px',
												borderRadius: '10px',
												background: '#FFFBEB',
												color: '#D97706',
											}}>
											<i className='bi bi-clock-history fs-3'></i>
										</div>
									</div>
									<div className='fs-2hx fw-bold mb-2' style={{ color: '#D97706', lineHeight: 1 }}>
										{lateCompletedTasks}
									</div>
									<div className='d-flex align-items-center gap-1.5 fs-8'>
										<span className='badge badge-light-warning fw-bold px-2 py-0.5'>{lateRate}%</span>
										<span className='text-muted'>delayed submissions</span>
									</div>
								</div>
							</div>
						</div>

						{/* Pending Tasks */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div
								className='card shadow-sm border-0 h-100'
								style={{
									borderRadius: '16px',
									background: '#ffffff',
									border: '1px solid #E4EAF2',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
								}}>
								<div className='card-body p-6 d-flex flex-column justify-content-between'>
									<div className='d-flex align-items-center justify-content-between mb-3'>
										<span
											className='fs-8 fw-bold text-uppercase'
											style={{ color: '#71809A', letterSpacing: '0.04em' }}>
											Pending Tasks
										</span>
										<div
											className='d-flex align-items-center justify-content-center'
											style={{
												width: '42px',
												height: '42px',
												borderRadius: '10px',
												background: '#FEF2F2',
												color: '#DC2626',
											}}>
											<i className='bi bi-hourglass-split fs-3'></i>
										</div>
									</div>
									<div className='fs-2hx fw-bold mb-2' style={{ color: '#DC2626', lineHeight: 1 }}>
										{pendingTasks}
									</div>
									<div className='d-flex align-items-center gap-1.5 fs-8'>
										<span className='badge badge-light-danger fw-bold px-2 py-0.5'>{pendingRate}%</span>
										<span className='text-muted'>unresolved or overdue</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* 3. Visual Analytics & Itemized Performance Scorecard */}
					<div className='row g-6 mb-6'>
						{/* Donut Chart Breakdown */}
						<div className='col-12 col-lg-5'>
							<div
								className='card shadow-sm border-0 h-100 d-flex flex-column justify-content-between'
								style={{
									borderRadius: '16px',
									background: '#ffffff',
									border: '1px solid #E4EAF2',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
								}}>
								<div className='p-6'>
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
										<div
											className='d-flex flex-column align-items-center justify-content-center p-8 my-4 text-center'
											style={{
												background: '#F8FAFD',
												borderRadius: '12px',
												border: '1px dashed #CBD5E1',
											}}>
											<div
												className='d-flex align-items-center justify-content-center mb-3'
												style={{
													width: '48px',
													height: '48px',
													borderRadius: '12px',
													background: '#EAF1FA',
													color: '#172B4D',
												}}>
												<i className='bi bi-pie-chart fs-3'></i>
											</div>
											<h6 className='fw-bold text-gray-800 mb-1 fs-6'>No Tasks Logged</h6>
											<span className='text-muted fs-8' style={{ maxWidth: '280px' }}>
												Task analytics and completion ratios will automatically generate once tasks are assigned.
											</span>
										</div>
									)}
								</div>

								{totalTasks > 0 && (
									<div className='border-top p-6 pt-4' style={{ borderColor: '#E4EAF2' }}>
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
							<div
								className='card shadow-sm border-0 h-100'
								style={{
									borderRadius: '16px',
									background: '#ffffff',
									border: '1px solid #E4EAF2',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
								}}>
								<div className='p-6'>
									<div className='d-flex align-items-center justify-content-between mb-4'>
										<div>
											<h4 className='fw-bold fs-5 m-0' style={{ color: '#142447' }}>
												Itemized Performance Scorecard
											</h4>
											<span className='text-muted fs-7'>Detailed metrics and quality index</span>
										</div>
										<span className='badge badge-light-secondary text-dark fs-8 fw-bold border'>
											Total: {totalTasks} Tasks
										</span>
									</div>

									<div className='table-responsive'>
										<table className='table align-middle table-row-dashed fs-7 gy-4 mb-0'>
											<thead>
												<tr className='text-start text-muted fw-bolder fs-8 text-uppercase gs-0 border-bottom' style={{ borderColor: '#E4EAF2' }}>
													<th className='min-w-150px' style={{ color: '#71809A' }}>Task Classification</th>
													<th className='text-center min-w-70px' style={{ color: '#71809A' }}>Volume</th>
													<th className='text-center min-w-70px' style={{ color: '#71809A' }}>Ratio</th>
													<th className='text-end min-w-100px pe-2' style={{ color: '#71809A' }}>Evaluation</th>
												</tr>
											</thead>
											<tbody className='text-gray-700 fw-semibold'>
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
													<td className='text-center fw-bold fs-6 text-gray-900'>{completedTasks}</td>
													<td className='text-center fw-semibold text-gray-700'>{completedRate}%</td>
													<td className='text-end pe-2'>
														<span className='badge badge-light-success text-success fw-bold px-3 py-1.5 fs-8'>
															<i className='bi bi-hand-thumbs-up me-1'></i> Excellent
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
													<td className='text-center fw-bold fs-6 text-gray-900'>{lateCompletedTasks}</td>
													<td className='text-center fw-semibold text-gray-700'>{lateRate}%</td>
													<td className='text-end pe-2'>
														<span className='badge badge-light-warning text-warning fw-bold px-3 py-1.5 fs-8'>
															<i className='bi bi-exclamation-triangle me-1'></i> Delayed
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
													<td className='text-center fw-bold fs-6 text-gray-900'>{pendingTasks}</td>
													<td className='text-center fw-semibold text-gray-700'>{pendingRate}%</td>
													<td className='text-end pe-2'>
														<span className='badge badge-light-danger text-danger fw-bold px-3 py-1.5 fs-8'>
															<i className='bi bi-exclamation-octagon me-1'></i> Overdue
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
														<td className='text-center fw-bold fs-6 text-gray-900'>{rejectedTasks}</td>
														<td className='text-center fw-semibold text-gray-700'>{rejectedRate}%</td>
														<td className='text-end pe-2'>
															<span className='badge badge-light-secondary text-dark fw-bold px-3 py-1.5 fs-8'>
																<i className='bi bi-arrow-counterclockwise me-1'></i> Revision
															</span>
														</td>
													</tr>
												)}

												{/* Summary Row */}
												<tr style={{ borderTop: '2px solid #E4EAF2', background: '#F8FAFD' }}>
													<td className='ps-2'>
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
													<td className='text-end pe-2'>
														<span className='badge badge-light-primary fw-bolder fs-8 px-3 py-1.5'>
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
					</div>
				</>
			) : (
				/* Directory Table Card rendered when no employee is selected */
				<div
					className='card shadow-sm border-0'
					style={{
						borderRadius: '16px',
						background: '#ffffff',
						border: '1px solid #E4EAF2',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
						overflow: 'hidden',
					}}>
					<div className='card-body p-0'>
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
										<div className='d-flex align-items-center justify-content-center'>
											<TableButton
												action='view'
												onClick={(e) => {
													e?.stopPropagation?.()
													handleViewEmployeeReport(employee)
												}}
												title='View Performance Report'
											/>
										</div>
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
							<div className='p-4 border-top' style={{ borderColor: '#E4EAF2' }}>
								<UsersListPagination
									totalPages={Math.ceil(sortedEmployees.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
									totalRecords={sortedEmployees.length}
									itemsPerPage={pagination.itemsPerPage}
								/>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	)
}

export default HRReports
