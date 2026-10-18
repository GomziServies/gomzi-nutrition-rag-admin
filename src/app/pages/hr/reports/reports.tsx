import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faChevronDown, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
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

/* ==========================================================================
   Custom Dropdown 1: Employee Selector (Inspired by LengthMenu Dropdown UI)
   ========================================================================== */
interface EmployeeSelectDropdownProps {
	selectedEmployee: EmployeeOption | null
	employeeList: EmployeeOption[]
	loading: boolean
	onSelect: (emp: EmployeeOption | null) => void
}

const EmployeeSelectDropdown: React.FC<EmployeeSelectDropdownProps> = ({
	selectedEmployee,
	employeeList,
	loading,
	onSelect,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
		top: 0,
		left: 0,
		width: 340,
	})
	const buttonRef = useRef<HTMLButtonElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

	const updateCoords = () => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect()
			const dropdownHeight = 360
			const spaceBelow = window.innerHeight - rect.bottom
			const openUp = spaceBelow < dropdownHeight && rect.top >= dropdownHeight
			setCoords({
				top: openUp ? Math.max(8, rect.top - dropdownHeight - 4) : rect.bottom + 6,
				left: rect.left,
				width: Math.max(rect.width, 340),
			})
		}
	}

	const toggleDropdown = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!isOpen) {
			updateCoords()
		}
		setIsOpen((prev) => !prev)
	}

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => {
				searchInputRef.current?.focus()
			}, 50)
		} else {
			setSearchTerm('')
		}
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}
		const handleScroll = () => {
			if (isOpen) updateCoords()
		}
		window.addEventListener('scroll', handleScroll, true)
		window.addEventListener('resize', handleScroll)
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			window.removeEventListener('scroll', handleScroll, true)
			window.removeEventListener('resize', handleScroll)
		}
	}, [isOpen])

	const filteredList = useMemo(() => {
		if (!searchTerm.trim()) return employeeList
		const term = searchTerm.toLowerCase().trim()
		return employeeList.filter(
			(emp) =>
				emp.name.toLowerCase().includes(term) ||
				(emp.employee_code || '').toLowerCase().includes(term) ||
				(emp.position || '').toLowerCase().includes(term) ||
				(emp.email || '').toLowerCase().includes(term) ||
				(emp.mobile || '').toLowerCase().includes(term)
		)
	}, [employeeList, searchTerm])

	return (
		<div className='position-relative w-100'>
			<button
				ref={buttonRef}
				type='button'
				onClick={toggleDropdown}
				disabled={loading}
				style={{
					width: '100%',
					height: '40px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '10px',
					backgroundColor: '#FFFFFF',
					border: `1.5px solid ${isOpen ? '#172B4D' : '#DFE7F0'}`,
					borderRadius: '10px',
					padding: '6px 14px',
					fontSize: '13px',
					fontWeight: 600,
					color: '#111827',
					cursor: loading ? 'not-allowed' : 'pointer',
					boxShadow: isOpen
						? '0 0 0 0.22rem rgba(23, 43, 77, 0.14)'
						: '0 1px 2px rgba(0, 0, 0, 0.04)',
					transition: 'all 0.18s ease',
					outline: 'none',
				}}>
				<div className='d-flex align-items-center gap-2 overflow-hidden text-truncate'>
					{selectedEmployee ? (
						<>
							<div
								style={{
									width: '24px',
									height: '24px',
									minWidth: '24px',
									borderRadius: '50%',
									background: '#172B4D',
									color: '#FFFFFF',
									fontSize: '11px',
									fontWeight: 700,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}>
								{selectedEmployee.name ? selectedEmployee.name.charAt(0).toUpperCase() : 'E'}
							</div>
							{selectedEmployee.employee_code && (
								<span
									style={{
										color: '#1D4ED8',
										backgroundColor: '#EFF6FF',
										border: '1px solid #BFDBFE',
										borderRadius: '4px',
										padding: '1px 5px',
										fontSize: '11px',
										fontWeight: 700,
									}}>
									#{selectedEmployee.employee_code}
								</span>
							)}
							<span className='fw-bold text-truncate' style={{ color: '#172B4D' }}>
								{selectedEmployee.name}
							</span>
							<span className='text-muted fs-8 text-truncate d-none d-sm-inline'>
								— {selectedEmployee.position || 'Staff'} {selectedEmployee.source === 'GLS' ? '(GLS)' : ''}
							</span>
						</>
					) : (
						<span style={{ color: '#94A3B8', fontWeight: 500 }}>
							Select an employee to audit...
						</span>
					)}
				</div>

				<FontAwesomeIcon
					icon={faChevronDown}
					style={{
						fontSize: '11px',
						color: '#172B4D',
						transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
						transition: 'transform 0.2s ease',
						flexShrink: 0,
					}}
				/>
			</button>

			{isOpen &&
				createPortal(
					<div
						ref={dropdownRef}
						onClick={(e) => e.stopPropagation()}
						style={{
							position: 'fixed',
							top: coords.top,
							left: coords.left,
							width: coords.width,
							backgroundColor: '#FFFFFF',
							border: '1.5px solid #DFE7F0',
							borderRadius: '12px',
							boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)',
							padding: '6px',
							zIndex: 999999,
							boxSizing: 'border-box',
						}}>
						{/* Search Input inside Dropdown */}
						<div
							style={{
								padding: '4px 6px 8px 6px',
								borderBottom: '1px solid #F1F5F9',
								marginBottom: '4px',
							}}>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									backgroundColor: '#F8FAFD',
									border: '1px solid #E2E8F0',
									borderRadius: '8px',
									padding: '0 10px',
									height: '34px',
								}}>
								<FontAwesomeIcon
									icon={faSearch}
									style={{ fontSize: '11px', color: '#94A3B8', marginRight: '8px' }}
								/>
								<input
									ref={searchInputRef}
									type='text'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder='Search by name, code, role...'
									style={{
										width: '100%',
										border: 'none',
										backgroundColor: 'transparent',
										fontSize: '12.5px',
										color: '#172B4D',
										outline: 'none',
									}}
								/>
								{searchTerm && (
									<button
										type='button'
										onClick={() => setSearchTerm('')}
										style={{
											border: 'none',
											background: 'transparent',
											color: '#94A3B8',
											cursor: 'pointer',
											padding: 0,
										}}>
										<FontAwesomeIcon icon={faTimes} style={{ fontSize: '11px' }} />
									</button>
								)}
							</div>
						</div>

						{/* Option to return to All Employees Directory Table */}
						<button
							type='button'
							onClick={() => {
								onSelect(null)
								setIsOpen(false)
							}}
							style={{
								width: '100%',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '8px 12px',
								border: 'none',
								borderRadius: '8px',
								backgroundColor: !selectedEmployee ? '#172B4D' : '#F8FAFC',
								color: !selectedEmployee ? '#FFFFFF' : '#172B4D',
								fontSize: '12.5px',
								fontWeight: 600,
								cursor: 'pointer',
								marginBottom: '4px',
								transition: 'all 0.15s ease',
							}}
							onMouseEnter={(e) => {
								if (selectedEmployee) {
									e.currentTarget.style.backgroundColor = '#E8F0F8'
								}
							}}
							onMouseLeave={(e) => {
								if (selectedEmployee) {
									e.currentTarget.style.backgroundColor = '#F8FAFC'
								}
							}}>
							<i className='bi bi-arrow-left-circle fs-6'></i>
							<span>← Back to All Employees Table</span>
						</button>

						<div style={{ maxHeight: '260px', overflowY: 'auto' }}>
							{filteredList.length === 0 ? (
								<div
									style={{
										padding: '16px 12px',
										textAlign: 'center',
										color: '#94A3B8',
										fontSize: '12.5px',
									}}>
									No employees matched "{searchTerm}"
								</div>
							) : (
								filteredList.map((emp) => {
									const isSelected = selectedEmployee?.id === emp.id
									return (
										<button
											key={emp.id}
											type='button'
											onClick={() => {
												onSelect(emp)
												setIsOpen(false)
											}}
											style={{
												width: '100%',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												gap: '8px',
												padding: '8px 10px',
												border: 'none',
												borderRadius: '8px',
												backgroundColor: isSelected ? '#172B4D' : 'transparent',
												color: isSelected ? '#FFFFFF' : '#1E293B',
												fontSize: '12.5px',
												cursor: 'pointer',
												marginBottom: '2px',
												textAlign: 'left',
												transition: 'all 0.12s ease',
											}}
											onMouseEnter={(e) => {
												if (!isSelected) {
													e.currentTarget.style.backgroundColor = '#E8F0F8'
													e.currentTarget.style.color = '#172B4D'
												}
											}}
											onMouseLeave={(e) => {
												if (!isSelected) {
													e.currentTarget.style.backgroundColor = 'transparent'
													e.currentTarget.style.color = '#1E293B'
												}
											}}>
											<div className='d-flex align-items-center gap-2 overflow-hidden text-truncate'>
												<div
													style={{
														width: '24px',
														height: '24px',
														minWidth: '24px',
														borderRadius: '50%',
														background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
														color: isSelected ? '#FFFFFF' : '#172B4D',
														fontSize: '11px',
														fontWeight: 700,
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}>
													{emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
												</div>
												<div className='overflow-hidden text-truncate'>
													<div className='d-flex align-items-center gap-1.5'>
														{emp.employee_code && (
															<span
																style={{
																	fontSize: '10px',
																	fontWeight: 700,
																	color: isSelected ? '#93C5FD' : '#1D4ED8',
																}}>
																[{emp.employee_code}]
															</span>
														)}
														<span className='fw-bold text-truncate'>{emp.name}</span>
													</div>
													<div
														style={{
															fontSize: '11px',
															color: isSelected ? 'rgba(255,255,255,0.7)' : '#64748B',
														}}>
														{emp.position || 'Staff'} {emp.source === 'GLS' ? '• GLS' : ''}
													</div>
												</div>
											</div>

											{isSelected && (
												<FontAwesomeIcon
													icon={faCheck}
													style={{ fontSize: '11px', color: '#10B981', flexShrink: 0 }}
												/>
											)}
										</button>
									)
								})
							)}
						</div>
					</div>,
					document.body
				)}
		</div>
	)
}

/* ==========================================================================
   Custom Dropdown 2: Directory Filter (Inspired by LengthMenu Dropdown UI)
   ========================================================================== */
interface DirectoryFilterDropdownProps {
	sourceFilter: 'All' | 'Standard' | 'GLS'
	employeeList: EmployeeOption[]
	onChange: (source: 'All' | 'Standard' | 'GLS') => void
}

const DirectoryFilterDropdown: React.FC<DirectoryFilterDropdownProps> = ({
	sourceFilter,
	employeeList,
	onChange,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
		top: 0,
		left: 0,
		width: 180,
	})
	const buttonRef = useRef<HTMLButtonElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)

	const updateCoords = () => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect()
			setCoords({
				top: rect.bottom + 6,
				left: rect.left,
				width: Math.max(rect.width, 210),
			})
		}
	}

	const toggleDropdown = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!isOpen) {
			updateCoords()
		}
		setIsOpen((prev) => !prev)
	}

	useEffect(() => {
		if (!isOpen) return
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}
		const handleScroll = () => {
			if (isOpen) updateCoords()
		}
		window.addEventListener('scroll', handleScroll, true)
		window.addEventListener('resize', handleScroll)
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			window.removeEventListener('scroll', handleScroll, true)
			window.removeEventListener('resize', handleScroll)
		}
	}, [isOpen])

	const directoryOptions: { label: string; value: 'All' | 'Standard' | 'GLS'; count: number }[] = [
		{ label: 'All Directories', value: 'All', count: employeeList.length },
		{
			label: 'Standard HR',
			value: 'Standard',
			count: employeeList.filter((e) => e.source === 'Standard').length,
		},
		{
			label: 'GLS Staff',
			value: 'GLS',
			count: employeeList.filter((e) => e.source === 'GLS').length,
		},
	]

	const currentOption = directoryOptions.find((opt) => opt.value === sourceFilter) || directoryOptions[0]

	return (
		<div className='d-inline-block' style={{ minWidth: '180px' }}>
			<button
				ref={buttonRef}
				type='button'
				onClick={toggleDropdown}
				style={{
					width: '100%',
					height: '38px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '8px',
					backgroundColor: '#FFFFFF',
					border: `1px solid ${isOpen ? '#172B4D' : '#DFE7F0'}`,
					borderRadius: '8px',
					padding: '6px 12px',
					fontSize: '13px',
					fontWeight: 600,
					color: '#111827',
					cursor: 'pointer',
					boxShadow: isOpen
						? '0 0 0 0.22rem rgba(23, 43, 77, 0.14)'
						: '0 1px 2px rgba(0, 0, 0, 0.04)',
					transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
					outline: 'none',
				}}>
				<div className='d-flex align-items-center gap-2'>
					<i className='bi bi-folder2-open text-primary' style={{ fontSize: '13px' }}></i>
					<span>
						{currentOption.label} ({currentOption.count})
					</span>
				</div>
				<FontAwesomeIcon
					icon={faChevronDown}
					style={{
						fontSize: '11px',
						color: '#1E3A5F',
						transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
						transition: 'transform 0.2s ease',
						pointerEvents: 'none',
					}}
				/>
			</button>

			{isOpen &&
				createPortal(
					<div
						ref={dropdownRef}
						onClick={(e) => e.stopPropagation()}
						style={{
							position: 'fixed',
							top: coords.top,
							left: coords.left,
							width: coords.width,
							backgroundColor: '#FFFFFF',
							border: '1px solid #DFE7F0',
							borderRadius: '10px',
							boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08)',
							padding: '4px',
							zIndex: 999999,
						}}>
						{directoryOptions.map((opt) => {
							const isSelected = opt.value === sourceFilter
							return (
								<button
									key={opt.value}
									type='button'
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										onChange(opt.value)
										setIsOpen(false)
									}}
									style={{
										width: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '8px 12px',
										border: 'none',
										borderRadius: '6px',
										backgroundColor: isSelected ? '#172B4D' : 'transparent',
										color: isSelected ? '#FFFFFF' : '#475569',
										fontSize: '13px',
										fontWeight: isSelected ? 700 : 500,
										cursor: 'pointer',
										transition: 'all 0.12s ease',
										marginBottom: '2px',
									}}
									onMouseEnter={(e) => {
										if (!isSelected) {
											e.currentTarget.style.backgroundColor = '#E8F0F8'
											e.currentTarget.style.color = '#172B4D'
										}
									}}
									onMouseLeave={(e) => {
										if (!isSelected) {
											e.currentTarget.style.backgroundColor = 'transparent'
											e.currentTarget.style.color = '#475569'
										}
									}}>
									<span>{opt.label}</span>
									<span
										style={{
											fontSize: '11px',
											padding: '1px 6px',
											borderRadius: '10px',
											backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
											color: isSelected ? '#FFFFFF' : '#64748B',
											fontWeight: 600,
										}}>
										{opt.count}
									</span>
								</button>
							)
						})}
					</div>,
					document.body
				)}
		</div>
	)
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
								<i className='bi bi-arrow-left me-1'></i>
								<span>All Employees</span>
							</button>
							<div className='gz-rep-header-icon d-none d-sm-flex'>
								<i className='bi bi-graph-up-arrow fs-5 text-white'></i>
							</div>
							<div>
								<h2 className='fw-bold fs-2 m-0' style={{ color: '#172B4D' }}>
									Performance Report: {selectedEmployee.name}
								</h2>
								<span className='fs-7 fw-semibold' style={{ color: '#71809A' }}>
									Individual task completion breakdown, deadlines audit & rating evaluation
								</span>
							</div>
						</div>

						<div className='d-flex align-items-center gap-2'>
							<button
								type='button'
								onClick={fetchRattingData}
								className='gz-rep-secondary-btn'
								title='Refresh Analytics'>
								<i className='bi bi-arrow-clockwise text-primary'></i>
								<span>Refresh</span>
							</button>
							<Link
								to={backLink}
								className='gz-rep-secondary-btn'
								title='View Full Employee Profile'>
								<i className='bi bi-person-badge text-primary'></i>
								<span>Profile</span>
							</Link>
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
							{/* Employee Selection Dropdown (Custom LengthMenu-Style Portal Dropdown) */}
							<div className='col-12 col-md-6 col-lg-5'>
								<label
									className='form-label fs-8 fw-bold text-uppercase mb-1 d-flex align-items-center gap-1.5'
									style={{ color: '#71809A', letterSpacing: '0.04em' }}>
									<i className='bi bi-person-badge text-primary'></i>
									Select Employee
								</label>
								<EmployeeSelectDropdown
									selectedEmployee={selectedEmployee}
									employeeList={employeeList}
									loading={loadingEmployees}
									onSelect={(emp) => {
										if (!emp) {
											handleBackToAllEmployees()
										} else {
											handleViewEmployeeReport(emp)
										}
									}}
								/>
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

								{/* 4. Directory Filter (Custom LengthMenu-Style Portal Dropdown) */}
								<div>
									<DirectoryFilterDropdown
										sourceFilter={sourceFilter}
										employeeList={employeeList}
										onChange={(source) => {
											setSourceFilter(source)
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
					<div className='gz-rep-hero-card mb-6'>
						<div className='d-flex flex-wrap align-items-center justify-content-between gap-4'>
							<div className='d-flex align-items-center gap-4'>
								<div className='gz-rep-avatar-wrap'>
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
									<div className='d-flex align-items-center flex-wrap gap-2 mb-2'>
										<h3 className='fw-bold fs-3 m-0' style={{ color: '#172B4D' }}>
											{selectedEmployee.name}
										</h3>
										{selectedEmployee.employee_code && (
											<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
												#{selectedEmployee.employee_code}
											</span>
										)}
										<span className='gz-rep-badge is-neutral fs-8'>
											{selectedEmployee.source === 'GLS' ? 'GLS Staff' : 'Standard HR'}
										</span>
									</div>
									<div className='d-flex flex-wrap align-items-center gap-2'>
										<span className='gz-rep-meta-chip'>
											<i className='bi bi-briefcase text-primary'></i>
											<span>{selectedEmployee.position || 'Staff'}</span>
										</span>
										{selectedEmployee.mobile && (
											<a
												href={`tel:${selectedEmployee.mobile}`}
												className='gz-rep-meta-chip'>
												<i className='bi bi-telephone text-success'></i>
												<span>{selectedEmployee.mobile}</span>
											</a>
										)}
										{selectedEmployee.email && (
											<a
												href={`mailto:${selectedEmployee.email}`}
												className='gz-rep-meta-chip'>
												<i className='bi bi-envelope text-info'></i>
												<span>{selectedEmployee.email}</span>
											</a>
										)}
									</div>
								</div>
							</div>

							{/* Rating Score Box */}
							<div className='gz-rep-rating-box'>
								<div className='d-flex align-items-center justify-content-between mb-1 gap-2'>
									<span
										className='fs-8 fw-bold text-uppercase d-flex align-items-center gap-1.5'
										style={{ color: '#71809A', letterSpacing: '0.04em' }}>
										<i className='bi bi-star-half text-warning fs-7'></i>
										Performance Rating
									</span>
									<span className={`gz-rep-badge ${ratingTier.class}`}>{ratingTier.label}</span>
								</div>

								<div className='d-flex align-items-baseline gap-2 mt-2'>
									<span className='fs-2hx fw-bold' style={{ color: '#172B4D', lineHeight: 1 }}>
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

								<div className='gz-rep-rating-progress'>
									<div
										className='gz-rep-rating-bar'
										style={{
											width: `${Math.min(100, Math.max(0, ratingPercent))}%`,
											backgroundColor:
												ratingPercent >= 75 ? '#10B981' : ratingPercent >= 50 ? '#F59E0B' : '#EF4444',
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
										<div className='gz-rep-empty-state my-3'>
											<div className='gz-rep-empty-icon'>
												<i className='bi bi-pie-chart'></i>
											</div>
											<h6 className='fw-bold text-gray-800 mb-1 fs-6'>No Tasks Logged</h6>
											<span className='text-muted fs-8' style={{ maxWidth: '280px' }}>
												Task analytics and completion ratios will automatically generate once tasks are assigned.
											</span>
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
