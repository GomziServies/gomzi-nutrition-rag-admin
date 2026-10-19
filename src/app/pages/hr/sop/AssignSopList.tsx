import {
	faCheckCircle,
	faClock,
	faEdit,
	faFileAlt,
	faPlus,
	faSearch,
	faTrash,
	faUserCheck,
	faUsers,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { MultiSelect } from 'react-multi-select-component'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectFieldManual from '../../../components/SelectFieldManual'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { CreateSOP, DeleteSOP, GetSOP, UpdateSOP } from '../../../Functions/FGGroup/SOP'

// Distinct deterministic avatar pastel colors for initial fallbacks
const AVATAR_COLORS = [
	{ bg: '#E0F2FE', text: '#0369A1' }, // sky
	{ bg: '#FEF3C7', text: '#B45309' }, // amber
	{ bg: '#DCFCE7', text: '#15803D' }, // green
	{ bg: '#EDE9FE', text: '#6D28D9' }, // purple
	{ bg: '#FCE7F3', text: '#BE185D' }, // pink
	{ bg: '#FEE2E2', text: '#B91C1C' }, // red
	{ bg: '#E2E8F0', text: '#334155' }, // slate
]

const getAvatarColor = (name?: string) => {
	if (!name) return AVATAR_COLORS[0]
	let hash = 0
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash)
	}
	const index = Math.abs(hash) % AVATAR_COLORS.length
	return AVATAR_COLORS[index]
}

// Modern overlapping employee avatar component with tooltip & initials fallback
const EmployeeAvatar: React.FC<{ emp: any; index: number; enableHoverScale?: boolean }> = ({
	emp,
	index,
	enableHoverScale = true,
}) => {
	const [imgError, setImgError] = useState(false)
	const fullName = emp.full_name || emp.name || 'Employee'
	const photoUrl = emp.photo || emp.employee?.photo
	const hasPhoto = Boolean(photoUrl) && !imgError

	const initials = useMemo(() => {
		const parts = fullName.trim().split(/\s+/)
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase()
		}
		return fullName.slice(0, 2).toUpperCase()
	}, [fullName])

	const color = useMemo(() => getAvatarColor(fullName), [fullName])

	const tooltip = `${fullName}${emp.employee?.employee_code ? ` [Code: ${emp.employee.employee_code}]` : ''}${
		emp.employee?.position ? ` • ${emp.employee.position}` : ''
	}`

	return (
		<div
			className='symbol symbol-circle'
			style={{
				width: '34px',
				height: '34px',
				marginLeft: index === 0 ? '0px' : '-10px',
				borderRadius: '50%',
				border: '2px solid #ffffff',
				boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
				overflow: 'hidden',
				cursor: 'pointer',
				position: 'relative',
				zIndex: index + 1,
				transition: 'transform 0.15s ease, z-index 0.15s ease, box-shadow 0.15s ease',
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: color.bg,
				color: color.text,
				fontSize: '11px',
				fontWeight: 700,
				flexShrink: 0,
			}}
			onMouseEnter={(e) => {
				if (enableHoverScale) {
					e.currentTarget.style.transform = 'scale(1.15)'
					e.currentTarget.style.zIndex = '25'
					e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.18)'
				}
			}}
			onMouseLeave={(e) => {
				if (enableHoverScale) {
					e.currentTarget.style.transform = 'scale(1)'
					e.currentTarget.style.zIndex = String(index + 1)
					e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
				}
			}}
			title={tooltip}>
			{hasPhoto ? (
				<img
					src={`https://files.fggroup.in/${photoUrl}`}
					alt={fullName}
					style={{ width: '100%', height: '100%', objectFit: 'cover' }}
					onError={() => setImgError(true)}
				/>
			) : (
				<span>{initials}</span>
			)}
		</div>
	)
}

// Robust employee completion matching helper for SOP execution
export const getEmployeeSopCompletion = (emp: any, completedBy: any[]): any | null => {
	if (!Array.isArray(completedBy) || completedBy.length === 0) {
		return null
	}
	const empIds = [
		emp?._id,
		emp?.id,
		emp?.admin_id,
		emp?.employee?._id,
		emp?.employee?.id,
		emp?.employee?.admin_id,
	]
		.filter(Boolean)
		.map(String)

	const empCode = String(emp?.employee?.employee_code || emp?.employee_code || '').trim().toLowerCase()
	const empEmail = String(emp?.email || emp?.employee?.email || '').trim().toLowerCase()

	const match = completedBy.find((c: any) => {
		if (!c) return false
		if (typeof c === 'string') {
			const cStr = String(c).trim()
			return empIds.includes(cStr) || (empCode && cStr.toLowerCase() === empCode)
		}
		const cIds = [
			c.admin_id,
			c.employee_id,
			c.user_id,
			c.id,
			c._id,
			c.employee?._id,
		]
			.filter(Boolean)
			.map(String)

		const hasIdMatch = empIds.some((id) => cIds.includes(id))
		if (hasIdMatch) return true

		const cCode = String(c.employee_code || c.employee?.employee_code || '').trim().toLowerCase()
		if (empCode && cCode && empCode === cCode) return true

		const cEmail = String(c.email || c.employee?.email || '').trim().toLowerCase()
		if (empEmail && cEmail && empEmail === cEmail) return true

		return false
	})

	return match || null
}

// Interactive Popover displaying all assigned employees for an SOP
interface PopoverProps {
	sopTitle?: string
	employees: any[]
	completedBy: any[]
	anchorRect: { top: number; left: number; bottom: number; right: number; width: number; height: number }
	onClose: () => void
}

const AssignedEmployeesPopover: React.FC<PopoverProps> = ({
	sopTitle,
	employees,
	completedBy = [],
	anchorRect,
	onClose,
}) => {
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All')
	const popoverRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

	const [isSearchFocused, setIsSearchFocused] = useState(false)

	// Dynamic calculation of completed vs pending counts
	const { completedCount, pendingCount } = useMemo(() => {
		let completed = 0
		let pending = 0
		employees.forEach((emp: any) => {
			if (getEmployeeSopCompletion(emp, completedBy)) {
				completed++
			} else {
				pending++
			}
		})
		return { completedCount: completed, pendingCount: pending }
	}, [employees, completedBy])

	// Filter employees by status tab and search term
	const filteredEmployees = useMemo(() => {
		let list = employees

		// Filter by completion status
		if (statusFilter === 'Completed') {
			list = list.filter((emp: any) => Boolean(getEmployeeSopCompletion(emp, completedBy)))
		} else if (statusFilter === 'Pending') {
			list = list.filter((emp: any) => !getEmployeeSopCompletion(emp, completedBy))
		}

		// Filter by search query
		if (searchTerm.trim()) {
			const q = searchTerm.toLowerCase().trim()
			list = list.filter((emp: any) => {
				const name = (emp.full_name || emp.name || '').toLowerCase()
				const code = (emp.employee?.employee_code || emp.employee_code || '').toLowerCase()
				const pos = (emp.employee?.position || emp.position || '').toLowerCase()
				return name.includes(q) || code.includes(q) || pos.includes(q)
			})
		}

		return list
	}, [employees, completedBy, statusFilter, searchTerm])

	// Auto-focus search input on display
	useEffect(() => {
		const timer = setTimeout(() => {
			searchInputRef.current?.focus()
		}, 60)
		return () => clearTimeout(timer)
	}, [])

	// Viewport-safe coordinates calculation with strict vertical collision prevention
	const [positioning] = useState(() => {
		const POPOVER_WIDTH = 420
		const SAFE_MARGIN = 16
		const GAP = 8

		const availableBelow = window.innerHeight - anchorRect.bottom - GAP - SAFE_MARGIN
		const availableAbove = anchorRect.top - GAP - SAFE_MARGIN

		// Open upwards if space below is limited (< 400px) and space above has more clearance
		const openUp = availableBelow < 400 && availableAbove > availableBelow
		const maxPossible = openUp ? availableAbove : availableBelow
		const maxHeight = Math.min(Math.max(maxPossible, 240), 500)

		let left = anchorRect.left + anchorRect.width / 2 - POPOVER_WIDTH / 2
		if (left + POPOVER_WIDTH > window.innerWidth - SAFE_MARGIN) {
			left = window.innerWidth - POPOVER_WIDTH - SAFE_MARGIN
		}
		if (left < SAFE_MARGIN) {
			left = SAFE_MARGIN
		}

		return {
			openUp,
			left,
			maxHeight,
			top: openUp ? undefined : anchorRect.bottom + GAP,
			bottom: openUp ? window.innerHeight - anchorRect.top + GAP : undefined,
		}
	})

	// Keyboard (Esc), click-outside, and scroll listener
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		const handleMouseDown = (e: MouseEvent) => {
			if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
				onClose()
			}
		}

		const handleScroll = (e: Event) => {
			if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
				return
			}
			onClose()
		}

		document.addEventListener('keydown', handleKeyDown)
		document.addEventListener('mousedown', handleMouseDown)
		window.addEventListener('scroll', handleScroll, true)
		window.addEventListener('resize', onClose)

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('mousedown', handleMouseDown)
			window.removeEventListener('scroll', handleScroll, true)
			window.removeEventListener('resize', onClose)
		}
	}, [onClose])

	return createPortal(
		<div
			ref={popoverRef}
			onClick={(e) => e.stopPropagation()}
			style={{
				position: 'fixed',
				top: positioning.top,
				bottom: positioning.bottom,
				left: positioning.left,
				width: '420px',
				maxWidth: 'calc(100vw - 32px)',
				maxHeight: `${positioning.maxHeight}px`,
				backgroundColor: '#FFFFFF',
				borderRadius: '14px',
				border: '1px solid #E2E8F0',
				boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.28), 0 8px 16px -4px rgba(0, 0, 0, 0.1)',
				zIndex: 999999,
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				boxSizing: 'border-box',
				animation: 'sopPopoverFadeIn 0.15s ease-out',
			}}>
			<style>{`
				@keyframes sopPopoverFadeIn {
					from {
						opacity: 0;
						transform: translateY(-4px) scale(0.98);
					}
					to {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
				}
				.custom-sop-popover-scroll::-webkit-scrollbar {
					width: 5px;
				}
				.custom-sop-popover-scroll::-webkit-scrollbar-track {
					background: #F8FAFD;
				}
				.custom-sop-popover-scroll::-webkit-scrollbar-thumb {
					background: #CBD5E1;
					border-radius: 4px;
				}
				.custom-sop-popover-scroll::-webkit-scrollbar-thumb:hover {
					background: #94A3B8;
				}
			`}</style>

			{/* Header */}
			<div
				className='d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0'
				style={{
					background: '#172B4D',
					color: '#FFFFFF',
					borderBottom: '1px solid rgba(255,255,255,0.08)',
				}}>
				<div className='d-flex flex-column'>
					<div className='d-flex align-items-center gap-2'>
						<FontAwesomeIcon icon={faUsers} style={{ fontSize: '13px', color: '#93C5FD' }} />
						<span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px' }}>
							Assigned Employees ({employees.length})
						</span>
					</div>
					<div className='d-flex align-items-center gap-2 mt-0.5' style={{ fontSize: '11px' }}>
						<span style={{ color: '#86EFAC', fontWeight: 600 }}>
							● {completedCount} Completed
						</span>
						<span style={{ color: '#94A3B8' }}>•</span>
						<span style={{ color: '#FDE047', fontWeight: 600 }}>
							● {pendingCount} Pending
						</span>
					</div>
				</div>
				<button
					type='button'
					onClick={(e) => {
						e.stopPropagation()
						onClose()
					}}
					style={{
						background: 'rgba(255,255,255,0.12)',
						border: 'none',
						width: '26px',
						height: '26px',
						borderRadius: '6px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#FFFFFF',
						cursor: 'pointer',
						transition: 'background 0.15s ease',
					}}
					onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
					onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
					title='Close'>
					<FontAwesomeIcon icon={faXmark} style={{ fontSize: '13px' }} />
				</button>
			</div>

			{/* Search Filter - Clean Integrated Search Bar */}
			<div
				className='px-3 pt-3 pb-2 flex-shrink-0'
				style={{ background: '#FFFFFF' }}>
				<div
					className='selectfield-search-wrapper'
					style={{
						position: 'relative',
						display: 'flex',
						alignItems: 'center',
						background: '#F8FAFD',
						border: isSearchFocused ? '1px solid #142447' : '1px solid #DFE7F0',
						borderRadius: '8px',
						padding: '0 10px',
						height: '36px',
						minHeight: '36px',
						boxShadow: isSearchFocused
							? '0 0 0 3px rgba(20, 36, 71, 0.08)'
							: 'none',
						transition: 'all 0.15s ease',
						boxSizing: 'border-box',
						gap: '8px',
					}}>
					<FontAwesomeIcon
						icon={faSearch}
						style={{
							color: isSearchFocused ? '#142447' : '#94A3B8',
							fontSize: '12px',
							flexShrink: 0,
							transition: 'color 0.15s ease',
						}}
					/>
					<input
						ref={searchInputRef}
						type='search'
						value={searchTerm}
						onFocus={() => setIsSearchFocused(true)}
						onBlur={() => setIsSearchFocused(false)}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder='Search employees by name or ID...'
						className='selectfield-search-input gz-top-search-input'
						autoComplete='off'
						spellCheck={false}
						style={{
							border: 'none',
							outline: 'none',
							boxShadow: 'none',
							width: '100%',
							height: '100%',
							minHeight: 0,
							fontSize: '12.5px',
							fontWeight: 500,
							color: '#142447',
							background: 'transparent',
							padding: 0,
							margin: 0,
						}}
					/>
					{searchTerm && (
						<button
							type='button'
							onClick={() => setSearchTerm('')}
							style={{
								background: '#E2E8F0',
								border: 'none',
								color: '#475569',
								width: '18px',
								height: '18px',
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								fontSize: '9px',
								padding: 0,
								flexShrink: 0,
							}}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					)}
				</div>
			</div>

			{/* Status Filter Tabs - Sleek Segmented Pill Control */}
			<div
				className='px-3 pb-2 flex-shrink-0'
				style={{ background: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
				<div
					className='d-flex align-items-center p-1 '
					style={{
						background: '#F1F5F9',
						gap: '4px',
						borderRadius:"5px"
					}}>
					{(['All', 'Completed', 'Pending'] as const).map((tab) => {
						const isSelected = statusFilter === tab
						const count =
							tab === 'All'
								? employees.length
								: tab === 'Completed'
								? completedCount
								: pendingCount

						const badgeBg = isSelected
							? tab === 'Completed'
								? '#DCFCE7'
								: tab === 'Pending'
								? '#FEF3C7'
								: '#E2E8F0'
							: '#E2E8F0'

						const badgeColor = isSelected
							? tab === 'Completed'
								? '#15803D'
								: tab === 'Pending'
								? '#B45309'
								: '#142447'
							: '#64748B'

						return (
							<button
								key={tab}
								type='button'
								onClick={() => setStatusFilter(tab)}
								className='btn btn-sm d-flex align-items-center justify-content-center gap-1 flex-grow-1'
								style={{
									fontSize: '12px',
									fontWeight: isSelected ? 700 : 500,
									borderRadius: '20px',
									border: 'none',
									background: isSelected ? '#FFFFFF' : 'transparent',
									color: isSelected ? '#142447' : '#64748B',
									padding: '5px 10px',
									transition: 'all 0.15s ease',
									cursor: 'pointer',
									boxShadow: isSelected ? '0 1px 3px rgba(15, 23, 42, 0.1)' : 'none',
								}}>
								<span>{tab}</span>
								<span
									style={{
										fontSize: '10.5px',
										fontWeight: 700,
										padding: '1px 6px',
										borderRadius: '10px',
										background: badgeBg,
										color: badgeColor,
										lineHeight: 1.2,
									}}>
									{count}
								</span>
							</button>
						)
					})}
				</div>
			</div>

			{/* Employee List with Enhanced Padding & Clean Cards */}
			<div
				className='custom-sop-popover-scroll'
				style={{
					flex: '1 1 auto',
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					gap: '8px',
					padding: '14px 14px',
					minHeight: '80px',
					background: '#F8FAFD',
				}}>
				{filteredEmployees.length === 0 ? (
					<div className='text-center py-7 px-3'>
						<div
							style={{
								width: '38px',
								height: '38px',
								borderRadius: '50%',
								background: '#F1F5F9',
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#94A3B8',
								marginBottom: '8px',
							}}>
							<FontAwesomeIcon icon={faSearch} style={{ fontSize: '13px' }} />
						</div>
						<div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
							No employees found
						</div>
						<div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
							{searchTerm
								? `No matches for "${searchTerm}" in ${statusFilter}`
								: `No employees with status "${statusFilter}"`}
						</div>
					</div>
				) : (
					filteredEmployees.map((emp: any) => {
						const fullName = emp.full_name || emp.name || 'Employee'
						const code = emp.employee?.employee_code || emp.employee_code || ''
						const position = emp.employee?.position || emp.position || ''
						const completion = getEmployeeSopCompletion(emp, completedBy)
						const isDone = Boolean(completion)

						return (
							<div
								key={emp._id || emp.id}
								className='d-flex align-items-center justify-content-between rounded-3'
								style={{
									background: '#FFFFFF',
									border: '1px solid #E8EEF5',
									boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
									padding: '10px 12px',
									cursor: 'default',
									transition: 'all 0.15s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.borderColor = '#CBD5E1'
									e.currentTarget.style.boxShadow = '0 4px 10px rgba(15, 23, 42, 0.08)'
									e.currentTarget.style.transform = 'translateY(-1px)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.borderColor = '#E8EEF5'
									e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)'
									e.currentTarget.style.transform = 'translateY(0)'
								}}>
								<div className='d-flex align-items-center gap-2 text-truncate' style={{ flexGrow: 1 }}>
									{/* Circular Avatar */}
									<div style={{ flexShrink: 0 }}>
										<EmployeeAvatar emp={emp} index={0} enableHoverScale={false} />
									</div>

									{/* Name & ID */}
									<div className='d-flex flex-column text-truncate'>
										<span
											style={{
												fontSize: '13px',
												fontWeight: 700,
												color: '#142447',
												lineHeight: 1.3,
											}}
											className='text-truncate'>
											{fullName}
										</span>
										<div className='d-flex align-items-center gap-1' style={{ marginTop: '2px' }}>
											{code && (
												<span
													style={{
														fontSize: '10.5px',
														fontWeight: 700,
														color: '#142447',
														background: '#F1F5F9',
														border: '1px solid #E2E8F0',
														padding: '1px 6px',
														borderRadius: '4px',
													}}>
													{code}
												</span>
											)}
											{code && position && (
												<span style={{ fontSize: '9px', color: '#CBD5E1' }}>•</span>
											)}
											{position && (
												<span
													style={{
														fontSize: '11px',
														color: '#64748B',
														fontWeight: 500,
													}}
													className='text-truncate'>
													{position}
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Completion Status Badge */}
								<div className='flex-shrink-0 ms-2 text-end'>
									{isDone ? (
										<div className='d-flex flex-column align-items-end'>
											<span
												className='badge fw-bold d-inline-flex align-items-center gap-1'
												style={{
													fontSize: '11px',
													padding: '4px 8px',
													borderRadius: '6px',
													background: '#DCFCE7',
													color: '#15803D',
													border: '1px solid #BBF7D0',
												}}>
												<FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '10px' }} />
												Completed
											</span>
											{completion.completed_at && (
												<span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
													{DayJS(completion.completed_at).format('DD/MM/YYYY')}
												</span>
											)}
										</div>
									) : (
										<span
											className='badge fw-bold d-inline-flex align-items-center gap-1'
											style={{
												fontSize: '11px',
												padding: '4px 8px',
												borderRadius: '6px',
												background: '#FEF3C7',
												color: '#B45309',
												border: '1px solid #FDE68A',
											}}>
											<FontAwesomeIcon icon={faClock} style={{ fontSize: '10px' }} />
											Pending
										</span>
									)}
								</div>
							</div>
						)
					})
				)}
			</div>

			{/* Footer */}
			<div
				className='px-4 py-2 flex-shrink-0'
				style={{
					background: '#FFFFFF',
					borderTop: '1px solid #EEF2F6',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					fontSize: '11.5px',
					color: '#64748B',
					fontWeight: 600,
				}}>
				<span>
					{filteredEmployees.length === employees.length
						? `Showing all ${employees.length} assigned employees`
						: `Showing ${filteredEmployees.length} of ${employees.length} assigned employees`}
				</span>
			</div>
		</div>,
		document.body
	)
}

const HRAssignSopList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All')
	const [showAddModal, setShowAddModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [sort, setSort] = useState('title')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [activePopover, setActivePopover] = useState<{
		sopId: string
		sopTitle?: string
		anchorRect: { top: number; left: number; bottom: number; right: number; width: number; height: number }
		employees: any[]
		completedBy: any[]
	} | null>(null)

	const [employeeData, setEmployeeData] = useState<any[]>([])
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
	const [assignSOPData, setAssignSOPData] = useState<any[]>([])

	const [selectedSop, setSelectedSop] = useState<any>({
		title: '',
		description: '',
		sop_id: '',
		service_name: '',
		admin_ids: [],
	})

	const [sopFormData, setSopFormData] = useState<any>({
		service_name: '',
		service_details: [
			{
				title: '',
				description: '',
			},
		],
		admin_ids: [],
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	// Fetch all employee directory (with limit to load all organization members)
	const fetchEmployeeData = async () => {
		try {
			const response = await GetEmployees({ limit: 1000 })
			const list: any = response?.data || []
			setEmployeeData(Array.isArray(list) ? list : [])
		} catch (error) {
			console.error('Error fetching employees:', error)
		}
	}

	// Fetch SOP data (optionally filtered by employee id)
	const fetchAssignSOPsData = async (admin_id?: string) => {
		setLoading(true)
		try {
			const query = admin_id ? { admin_id } : {}
			const response = await GetSOP(query)
			const rawData: any = response?.data || []
			const list = Array.isArray(rawData) ? rawData : []
			const combinedData: any[] = []

			list.forEach((el: any) => {
				const serviceDetails = Array.isArray(el?.service_details)
					? el.service_details
					: []

				serviceDetails.forEach((row: any, idx: number) => {
					combinedData.push({
						_id: row?._id || `${el._id}-${idx}`,
						detail_id: row?._id,
						title: row?.title || '',
						description: row?.description || '',
						completed_by: Array.isArray(row?.completed_by) ? row.completed_by : [],
						sop_id: el?._id,
						service_name: el?.service_name || 'General SOP',
						admin_ids: Array.isArray(el?.admin_ids) ? el.admin_ids : [],
						createdAt: el?.createdAt || el?.created_date || '',
					})
				})
			})

			setAssignSOPData(combinedData)
		} catch (error) {
			console.error('Error fetching SOP data:', error)
			setAssignSOPData([])
		} finally {
			setLoading(false)
		}
	}

	// Initial load: fetch employee list and ALL SOPs immediately
	useEffect(() => {
		fetchEmployeeData()
		fetchAssignSOPsData()
	}, [])

	// Handle employee selection from dropdown
	const handleEmployeeSelect = async (event: any) => {
		const selectedId = event?.target?.value ?? ''

		if (!selectedId || selectedId === 'Select Employee' || selectedId === 'all') {
			setSelectedEmployee(null)
			await fetchAssignSOPsData()
		} else {
			const matched = employeeData.find((el: any) => {
				const id = String(el._id || el.id || '')
				const adminId = String(el.admin_id || '')
				const subId = String(el.employee?._id || '')
				return id === selectedId || (adminId && adminId === selectedId) || (subId && subId === selectedId)
			})
			setSelectedEmployee(matched || { _id: selectedId })
			await fetchAssignSOPsData(selectedId)
		}
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	// Helper to get matching assigned employee objects for a given SOP row
	const getAssignedEmployeesForSop = (sop: any) => {
		const rawIds = sop.admin_ids || []
		if (!Array.isArray(rawIds) || rawIds.length === 0) return []
		const idSet = new Set(rawIds.map((id: any) => String(id?._id || id?.value || id)))
		return employeeData.filter((emp: any) => idSet.has(String(emp._id || emp.id)))
	}

	// Delete confirmation
	const notifyDelete = (sop_id: string, sopTitle: string) => {
		Swal.fire({
			icon: 'warning',
			title: 'Delete SOP?',
			text: `Are you sure you want to delete "${sopTitle}"? This action cannot be undone.`,
			showCancelButton: true,
			confirmButtonColor: '#172B4D',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it',
		}).then((result) => {
			if (result.isConfirmed) {
				handleDeleteSOP(sop_id)
			}
		})
	}

	const handleDeleteSOP = async (sop_id: string) => {
		try {
			await DeleteSOP({ sop_id })
			toast.success('SOP deleted successfully')
			fetchAssignSOPsData(selectedEmployee?._id)
		} catch (error: any) {
			toast.error(error.message || 'Failed to delete SOP')
			console.error(error)
		}
	}

	// Submit new SOP form
	const handleSubmitSop = async () => {
		if (!sopFormData.service_name.trim()) {
			toast.error('Please enter a service name')
			return
		}
		if (sopFormData.admin_ids.length === 0) {
			toast.error('Please assign at least one employee')
			return
		}
		const hasValidItems = sopFormData.service_details.some(
			(d: any) => d.title.trim() && d.description.trim()
		)
		if (!hasValidItems) {
			toast.error('Please enter a title and description for the SOP item')
			return
		}

		setSubmitting(true)
		try {
			const payload: any = {
				service_name: sopFormData.service_name.trim(),
				service_details: sopFormData.service_details.filter(
					(d: any) => d.title.trim() || d.description.trim()
				),
				admin_ids: sopFormData.admin_ids.map((admin: any) => admin.value),
			}

			await CreateSOP(payload)
			toast.success('SOP created and assigned successfully')
			setShowAddModal(false)

			setSopFormData({
				service_name: '',
				service_details: [
					{
						title: '',
						description: '',
					},
				],
				admin_ids: [],
			})

			fetchAssignSOPsData(selectedEmployee?._id)
		} catch (error: any) {
			toast.error(error.message || 'Error creating SOP')
			console.error(error)
		} finally {
			setSubmitting(false)
		}
	}

	// Update existing SOP
	const handleShowSOPUpdateModal = (sop_data: any) => {
		setSelectedSop(sop_data)
		setShowUpdateModal(true)
	}

	const handleUpdateSOP = async () => {
		if (!selectedSop.title?.trim()) {
			toast.error('Please enter an SOP title')
			return
		}

		setSubmitting(true)
		try {
			const payload: any = {
				sop_id: selectedSop.sop_id,
				service_name: selectedSop.service_name,
				service_details: [
					{
						title: selectedSop.title,
						description: selectedSop.description,
					},
				],
				admin_ids: Array.isArray(selectedSop.admin_ids)
					? selectedSop.admin_ids.map((a: any) => String(a?.value || a))
					: [selectedSop.admin_ids.toString()],
			}

			await UpdateSOP(payload)
			toast.success('SOP updated successfully')
			setShowUpdateModal(false)
			fetchAssignSOPsData(selectedEmployee?._id)
		} catch (error: any) {
			toast.error(error.message || 'Error updating SOP')
			console.error(error)
		} finally {
			setSubmitting(false)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleSortChange = (newSort: string, newSortOrder: any) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleMultiSelectChange = (selected: any) => {
		setSopFormData((prevData: any) => ({
			...prevData,
			admin_ids: selected,
		}))
	}

	const addNewSopInput = () => {
		setSopFormData((prevData: any) => ({
			...prevData,
			service_details: [
				...prevData.service_details,
				{
					title: '',
					description: '',
				},
			],
		}))
	}

	const removeSopInput = (index: number) => {
		if (sopFormData.service_details.length === 1) {
			toast.error('At least one SOP item is required')
			return
		}
		setSopFormData((prevData: any) => ({
			...prevData,
			service_details: prevData.service_details.filter((_: any, i: number) => i !== index),
		}))
	}

	// Employee select options for filter dropdown
	const employeeFilterOptions = useMemo(() => {
		return [
			{ name: 'All Employees (Entire Organization)', value: '' },
			...employeeData.map((data: any) => ({
				name: `${data.full_name || data.name}${
					data?.employee?.position ? ` — ${data.employee.position}` : ''
				}${data?.employee?.employee_code ? ` [${data.employee.employee_code}]` : ''}`,
				value: data._id,
			})),
		]
	}, [employeeData])

	// Employee select options for MultiSelect in Add SOP form
	const employeeMultiSelectOptions = useMemo(() => {
		return employeeData.map((data: any) => ({
			label: `${data.full_name || data.name}${
				data?.employee?.position ? ` (${data.employee.position})` : ''
			}`,
			value: data._id,
		}))
	}, [employeeData])

	// Base list of SOPs filtered by selected employee dropdown
	const baseEmployeeSOPs = useMemo(() => {
		if (!selectedEmployee) return assignSOPData

		const targetId = String(selectedEmployee._id || selectedEmployee.id || '')
		const targetAdminId = String(selectedEmployee.admin_id || '')
		const targetSubId = String(selectedEmployee.employee?._id || '')
		const targetCode = String(selectedEmployee.employee?.employee_code || selectedEmployee.employee_code || '').trim().toLowerCase()

		return assignSOPData.filter((sop) => {
			const assigned = getAssignedEmployeesForSop(sop)
			const isAssigned = assigned.some((emp: any) => {
				const empId = String(emp._id || emp.id || '')
				const empAdminId = String(emp.admin_id || '')
				const empSubId = String(emp.employee?._id || '')
				const empCode = String(emp.employee?.employee_code || emp.employee_code || '').trim().toLowerCase()

				return (
					(targetId && empId === targetId) ||
					(targetAdminId && empAdminId === targetAdminId) ||
					(targetSubId && empSubId === targetSubId) ||
					(targetCode && empCode && empCode === targetCode)
				)
			})

			if (isAssigned) return true

			const rawIds = (sop.admin_ids || []).map((id: any) => String(id?._id || id?.value || id))
			return (
				(targetId && rawIds.includes(targetId)) ||
				(targetAdminId && rawIds.includes(targetAdminId)) ||
				(targetSubId && rawIds.includes(targetSubId))
			)
		})
	}, [assignSOPData, selectedEmployee, employeeData])

	// Filtering logic across status, employee, and search keyword
	const filteredSOPData = useMemo(() => {
		let list = baseEmployeeSOPs

		if (statusFilter === 'Completed') {
			list = list.filter((s) => {
				if (selectedEmployee) {
					return Boolean(getEmployeeSopCompletion(selectedEmployee, s.completed_by))
				}
				const assigned = getAssignedEmployeesForSop(s)
				if (assigned.length === 0) {
					return s.completed_by && s.completed_by.length > 0
				}
				const doneCount = assigned.filter((emp: any) => getEmployeeSopCompletion(emp, s.completed_by)).length
				return doneCount === assigned.length
			})
		} else if (statusFilter === 'Pending') {
			list = list.filter((s) => {
				if (selectedEmployee) {
					return !getEmployeeSopCompletion(selectedEmployee, s.completed_by)
				}
				const assigned = getAssignedEmployeesForSop(s)
				if (assigned.length === 0) {
					return !s.completed_by || s.completed_by.length === 0
				}
				const doneCount = assigned.filter((emp: any) => getEmployeeSopCompletion(emp, s.completed_by)).length
				return doneCount < assigned.length
			})
		}

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim()
			list = list.filter((sop) => {
				const assignedEmps = getAssignedEmployeesForSop(sop)
				const empMatch = assignedEmps.some(
					(e: any) =>
						(e.full_name || e.name || '').toLowerCase().includes(term) ||
						(e.employee?.employee_code || e.employee_code || '').toLowerCase().includes(term) ||
						(e.employee?.position || e.position || '').toLowerCase().includes(term)
				)
				const titleMatch = (sop.title || '').toLowerCase().includes(term)
				const descMatch = (sop.description || '').toLowerCase().includes(term)
				const serviceMatch = (sop.service_name || '').toLowerCase().includes(term)
				const remarkMatch = (sop.completed_by?.[0]?.remarks || '').toLowerCase().includes(term)

				return titleMatch || descMatch || serviceMatch || empMatch || remarkMatch
			})
		}

		return list
	}, [baseEmployeeSOPs, statusFilter, searchTerm, employeeData, selectedEmployee])

	// Sorting
	const sortedSOPData = useMemo(() => {
		return [...filteredSOPData].sort((a, b) => {
			let aVal: any = a[sort] ?? ''
			let bVal: any = b[sort] ?? ''

			return sortOrder === 'asc'
				? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
				: String(bVal).localeCompare(String(aVal), undefined, { numeric: true, sensitivity: 'base' })
		})
	}, [filteredSOPData, sort, sortOrder])

	// Pagination
	const paginatedSOPData = useMemo(() => {
		const start = (pagination.page - 1) * pagination.itemsPerPage
		return sortedSOPData.slice(start, start + pagination.itemsPerPage)
	}, [sortedSOPData, pagination])

	const sortableFields = [
		{ title: 'Service / Category', field: 'service_name' },
		{ title: 'SOP Details', field: 'title' },
		{ title: 'Assigned To', field: 'admin_ids' },
		{ title: 'Feedback & Remarks', field: 'remark' },
		{ title: 'Status / Date', field: 'completed_at' },
	]

	const excelColumns = [
		{ title: 'Service Name', field: 'service_name' },
		{ title: 'SOP Title', field: 'title' },
		{ title: 'Description', field: 'description' },
		{ title: 'Assigned Employees', field: 'assigned_names' },
		{ title: 'Feedback Remark', field: 'feedback_remark' },
		{ title: 'Status', field: 'status_label' },
		{ title: 'Completed Date', field: 'formatted_date' },
	]

	const excelExportData = useMemo(() => {
		return sortedSOPData.map((sop) => {
			const assigned = getAssignedEmployeesForSop(sop)
			const doneCount = assigned.filter((emp: any) => getEmployeeSopCompletion(emp, sop.completed_by)).length
			const isDone = assigned.length > 0 ? doneCount === assigned.length : Boolean(sop.completed_by && sop.completed_by.length > 0)
			const statusLabel = isDone
				? `Completed (${doneCount}/${assigned.length})`
				: doneCount > 0
				? `In Progress (${doneCount}/${assigned.length} Completed)`
				: `Pending (0/${assigned.length})`

			return {
				...sop,
				assigned_names: assigned.map((e: any) => e.full_name || e.name).join(', ') || 'None',
				feedback_remark: sop.completed_by?.[0]?.remarks || '-',
				status_label: statusLabel,
				formatted_date: sop.completed_by?.[0]?.completed_at
					? DayJS(sop.completed_by[0].completed_at).format('DD/MM/YYYY hh:mm A')
					: '-',
			}
		})
	}, [sortedSOPData, employeeData])

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Standard Operating Procedures (SOPs)</PageTitle>

			{/* Top Header Bar */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<div className='d-flex align-items-center gap-2'>
						<h2 className='fw-bold fs-2 m-0' style={{ color: '#142447' }}>
							SOP Management & Assignments
						</h2>
						<span className='badge badge-light-primary fw-bold fs-8 px-2 py-1'>
							{selectedEmployee ? baseEmployeeSOPs.length : assignSOPData.length} Total SOPs
						</span>
					</div>
					<span className='fs-7 fw-semibold mt-1' style={{ color: '#71809A' }}>
						Manage organizational SOPs, track employee execution, and audit feedback records.
					</span>
				</div>

				<div className='d-flex align-items-center gap-2'>
					<button
						type='button'
						className='btn btn-primary d-flex align-items-center gap-2 px-4'
						style={{
							height: '40px',
							borderRadius: '10px',
							background: '#172B4D',
							borderColor: '#172B4D',
							fontWeight: 600,
							boxShadow: '0 2px 4px rgba(23, 43, 77, 0.15)',
						}}
						onClick={() => setShowAddModal(true)}>
						<FontAwesomeIcon icon={faPlus} className='fs-6' />
						<span>Create New SOP</span>
					</button>
				</div>
			</div>

			{/* Filter Toolbar Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3'>
					<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1 w-100'>
						{/* 1. Searchbar using project SearchFilter */}
						<div style={{ minWidth: '240px', maxWidth: '360px', flex: '1 1 240px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search SOP, service, remark, employee...'
								className='me-0'
							/>
						</div>

						{/* 2. Employee Selection Dropdown */}
						<div style={{ minWidth: '220px', maxWidth: '320px', flex: '1 1 220px' }}>
							<SelectFieldManual
								className='mb-0'
								label=''
								showLabel={false}
								marginRemove={true}
								name='employee'
								value={selectedEmployee?._id || ''}
								onChange={handleEmployeeSelect}
								htmlFor='employee'
								options={employeeFilterOptions}
							/>
						</div>

						{/* 3. Status Tabs (All, Completed, Pending) */}
						<div
							className='d-flex align-items-center bg-light rounded p-1'
							style={{ border: '1px solid #E4EAF2' }}>
							{(['All', 'Completed', 'Pending'] as const).map((status) => (
								<button
									key={status}
									type='button'
									onClick={() => {
										setStatusFilter(status)
										setPagination((p) => ({ ...p, page: 1 }))
									}}
									className={`btn btn-sm px-3 py-1.5 fw-semibold ${
										statusFilter === status
											? 'btn-white bg-white text-primary shadow-xs'
											: 'btn-color-gray-600 text-hover-primary'
									}`}
									style={{
										borderRadius: '6px',
										fontSize: '12px',
										transition: 'all 0.15s ease',
									}}>
									{status === 'All'
										? `All (${baseEmployeeSOPs.length})`
										: status === 'Completed'
										? 'Completed'
										: 'Pending'}
								</button>
							))}
						</div>

						{/* 4. Page Size */}
						<div>
							<LengthMenu
								data={sortedSOPData}
								itemsPerPage={pagination.itemsPerPage}
								handleItemsPerPageChange={(val) =>
									setPagination((prev) => ({ ...prev, itemsPerPage: val, page: 1 }))
								}
								className='me-0'
							/>
						</div>

						{/* 5. Download Excel Button */}
						<div>
							<DownloadExcelButton
								data={excelExportData}
								columns={excelColumns}
								filename='Employee_SOP_Assignments'
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Main SOP Table Card */}
			<div className='gz-inv-table-card'>
				<Table
					data={paginatedSOPData}
					columns={sortableFields}
					sort={sort}
					sortOrder={sortOrder}
					onSortChange={handleSortChange}
					disableSortFields={['admin_ids', 'remark', 'completed_at']}
					pagination={pagination}
					setPagination={setPagination}
					loading={loading}
					renderRow={(sop: any, index: number, actualIndex: number, isVisible: boolean) => {
						const assignedEmployees = getAssignedEmployeesForSop(sop)
						const completedByList = Array.isArray(sop.completed_by) ? sop.completed_by : []
						const totalAssigned = assignedEmployees.length
						const completedEmployeesCount = totalAssigned > 0
							? assignedEmployees.filter((emp: any) => getEmployeeSopCompletion(emp, completedByList)).length
							: (completedByList.length > 0 ? 1 : 0)

						const isAllCompleted = totalAssigned > 0
							? completedEmployeesCount === totalAssigned
							: completedByList.length > 0
						const isPartiallyCompleted = totalAssigned > 0 && completedEmployeesCount > 0 && completedEmployeesCount < totalAssigned
						const latestFeedback = completedByList[0]

						return (
							<React.Fragment key={sop._id || `${index}-${actualIndex}`}>
								<tr
									onClick={() => handleRowClick(sop._id)}
									className='data-row'
									style={{ transition: 'background-color 0.15s ease' }}>
									{/* Index */}
									<td className='text-center ps-4'>
										<span className='text-muted fw-bold fs-7'>{actualIndex}</span>
									</td>

									{/* Service Name */}
									<td>
										<span className='badge badge-light-primary fw-bold fs-7 px-3 py-2'>
											{sop.service_name || 'Standard'}
										</span>
									</td>

									{/* SOP Details (Title & Description) */}
									<td style={{ maxWidth: '300px' }}>
										<div className='d-flex flex-column'>
											<span className='text-gray-900 fw-bold fs-6 mb-1'>
												{sop.title}
											</span>
											<span
												className='text-muted fs-7'
												style={{
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
													lineHeight: '1.4',
												}}>
												{sop.description || 'No detailed instructions specified.'}
											</span>
										</div>
									</td>

									{/* Assigned Employees - Overlapping Avatar Stack */}
									<td style={{ minWidth: '130px', maxWidth: '190px' }}>
										{assignedEmployees.length === 0 ? (
											<span className='text-muted fs-7 fst-italic'>
												No employees mapped
											</span>
										) : (
											(() => {
												const MAX_VISIBLE = 3
												const visibleEmps = assignedEmployees.slice(0, MAX_VISIBLE)
												const overflowEmps =
													assignedEmployees.length > MAX_VISIBLE
														? assignedEmployees.slice(MAX_VISIBLE)
														: []

												const handleOpenPopover = (e: React.MouseEvent<HTMLElement>) => {
													e.preventDefault()
													e.stopPropagation()
													const rect = e.currentTarget.getBoundingClientRect()
													setActivePopover((prev) => {
														if (prev && prev.sopId === sop._id) {
															return null // Toggle close
														}
														return {
															sopId: sop._id,
															sopTitle: sop.title,
															anchorRect: {
																top: rect.top,
																left: rect.left,
																bottom: rect.bottom,
																right: rect.right,
																width: rect.width,
																height: rect.height,
															},
															employees: assignedEmployees,
															completedBy: completedByList,
														}
													})
												}

												return (
													<div
														className='symbol-group symbol-hover flex-nowrap align-items-center py-1'
														style={{ cursor: 'pointer' }}
														onClick={handleOpenPopover}
														title={`Click to view all ${assignedEmployees.length} assigned employees & completion status`}>
														{visibleEmps.map((emp: any, i: number) => (
															<EmployeeAvatar
																key={emp._id || emp.id || i}
																emp={emp}
																index={i}
															/>
														))}
														{overflowEmps.length > 0 && (
															<div
																className='symbol symbol-circle'
																style={{
																	width: '34px',
																	height: '34px',
																	marginLeft: '-10px',
																	borderRadius: '50%',
																	background:
																		activePopover?.sopId === sop._id ? '#172B4D' : '#F1F5F9',
																	color:
																		activePopover?.sopId === sop._id ? '#FFFFFF' : '#1E293B',
																	fontSize: '11px',
																	fontWeight: 700,
																	display: 'inline-flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																	border: '2px solid #ffffff',
																	boxShadow:
																		activePopover?.sopId === sop._id
																			? '0 0 0 2px #172B4D, 0 3px 8px rgba(23,43,77,0.3)'
																			: '0 2px 4px rgba(0,0,0,0.1)',
																	cursor: 'pointer',
																	position: 'relative',
																	zIndex: activePopover?.sopId === sop._id ? 30 : 10,
																	flexShrink: 0,
																	transition:
																		'transform 0.15s ease, z-index 0.15s ease, background 0.15s ease',
																}}
																onMouseEnter={(e) => {
																	e.currentTarget.style.transform = 'scale(1.15)'
																	e.currentTarget.style.zIndex = '35'
																}}
																onMouseLeave={(e) => {
																	e.currentTarget.style.transform = 'scale(1)'
																	e.currentTarget.style.zIndex =
																		activePopover?.sopId === sop._id ? '30' : '10'
																}}
																onClick={handleOpenPopover}
																title={`Click to view all ${assignedEmployees.length} assigned employees`}>
																+{overflowEmps.length}
															</div>
														)}
													</div>
												)
											})()
										)}
									</td>

									{/* Feedback & Remarks */}
									<td style={{ minWidth: '180px', maxWidth: '240px' }}>
										<div className='d-flex flex-column'>
											<span
												className='text-gray-800 fw-semibold fs-7'
												style={{
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
													lineHeight: '1.4',
												}}>
												{latestFeedback?.remarks || (
													<span className='text-muted fst-italic'>No remarks submitted</span>
												)}
											</span>
											{latestFeedback?.file_url && (
												<a
													href={`https://files.fggroup.in${latestFeedback.file_url}`}
													target='_blank'
													rel='noopener noreferrer'
													className='d-inline-flex align-items-center gap-1 mt-1 text-primary fs-8 fw-bold text-hover-underline'
													onClick={(e) => e.stopPropagation()}>
													<FontAwesomeIcon icon={faFileAlt} className='fs-8' />
													<span>View Attachment</span>
												</a>
											)}
										</div>
									</td>

									{/* Status & Date */}
									<td>
										<div className='d-flex flex-column'>
											{isAllCompleted ? (
												<span className='badge badge-light-success fw-bold fs-8 px-2 py-1 mb-1 d-inline-flex align-items-center gap-1 w-fit'>
													<FontAwesomeIcon icon={faCheckCircle} className='fs-8 text-success' />
													<span>Completed {totalAssigned > 0 ? `(${completedEmployeesCount}/${totalAssigned})` : ''}</span>
												</span>
											) : isPartiallyCompleted ? (
												<span
													className='badge badge-light-primary fw-bold fs-8 px-2 py-1 mb-1 d-inline-flex align-items-center gap-1 w-fit'
													style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
													<FontAwesomeIcon icon={faClock} className='fs-8 text-primary' />
													<span>In Progress ({completedEmployeesCount}/{totalAssigned})</span>
												</span>
											) : (
												<span className='badge badge-light-warning fw-bold fs-8 px-2 py-1 mb-1 d-inline-flex align-items-center gap-1 w-fit text-warning'>
													<FontAwesomeIcon icon={faClock} className='fs-8 text-warning' />
													<span>Pending {totalAssigned > 0 ? `(0/${totalAssigned})` : ''}</span>
												</span>
											)}
											<span className='text-muted fs-8'>
												{isAllCompleted
													? latestFeedback?.completed_at
														? DayJS(latestFeedback.completed_at).format('DD/MM/YYYY hh:mm A')
														: 'All employees completed'
													: isPartiallyCompleted
													? `${totalAssigned - completedEmployeesCount} of ${totalAssigned} pending`
													: 'Awaiting execution'}
											</span>
										</div>
									</td>

									{/* Actions */}
									<td className='text-center pe-4'>
										<div className='d-flex justify-content-center align-items-center gap-1.5'>
											<button
												type='button'
												className='btn btn-icon btn-sm btn-light-primary'
												style={{ width: '32px', height: '32px', borderRadius: '8px' }}
												onClick={(e) => {
													e.stopPropagation()
													handleShowSOPUpdateModal(sop)
												}}
												title='Edit SOP'>
												<FontAwesomeIcon icon={faEdit} className='fs-7 text-primary' />
											</button>
											<button
												type='button'
												className='btn btn-icon btn-sm btn-light-danger'
												style={{ width: '32px', height: '32px', borderRadius: '8px' }}
												onClick={(e) => {
													e.stopPropagation()
													notifyDelete(sop.sop_id, sop.title)
												}}
												title='Delete SOP'>
												<FontAwesomeIcon icon={faTrash} className='fs-7 text-danger' />
											</button>
										</div>
									</td>
								</tr>

								{/* Mobile Collapsible Detail Row */}
								{isVisible && (
									<tr className='detail-row is-visible bg-light-primary'>
										<td colSpan={7} className='p-4'>
											<div className='p-3 bg-white rounded border'>
												<div className='row g-3'>
													<div className='col-md-6'>
														<strong className='text-gray-800 fs-7 d-block mb-1'>
															Service Category:
														</strong>
														<span className='text-muted fs-7'>{sop.service_name}</span>
													</div>
													<div className='col-md-6'>
														<strong className='text-gray-800 fs-7 d-block mb-1'>
															SOP Title:
														</strong>
														<span className='text-muted fs-7'>{sop.title}</span>
													</div>
													<div className='col-12'>
														<strong className='text-gray-800 fs-7 d-block mb-1'>
															Full Description:
														</strong>
														<span className='text-muted fs-7'>{sop.description}</span>
													</div>
													<div className='col-12'>
														<strong className='text-gray-800 fs-7 d-block mb-1'>
															Assigned Personnel:
														</strong>
														<div className='d-flex flex-wrap gap-2'>
															{assignedEmployees.map((emp: any) => (
																<span
																	key={emp._id}
																	className='badge badge-light-secondary text-dark fw-bold'>
																	{emp.full_name || emp.name} ({emp.employee?.position || 'Staff'})
																</span>
															))}
														</div>
													</div>
												</div>
											</div>
										</td>
									</tr>
								)}
							</React.Fragment>
						)
					}}
				/>

				{/* Empty State */}
				{sortedSOPData.length === 0 && !loading && (
					<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center py-12'>
						<div
							style={{
								width: '64px',
								height: '64px',
								borderRadius: '16px',
								background: '#F8FAFD',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#71809A',
								marginBottom: '12px',
							}}>
							<FontAwesomeIcon icon={faFileAlt} className='fs-1' />
						</div>
						<span className='text-gray-800 fw-bold fs-5 mb-1'>No SOP records found</span>
						<span className='text-muted fs-7'>
							{selectedEmployee
								? `No SOPs currently assigned to ${selectedEmployee.full_name || selectedEmployee.name}.`
								: 'Try adjusting your search query, filter criteria, or click "Create New SOP" to add one.'}
						</span>
					</div>
				)}

				{/* Pagination */}
				{sortedSOPData.length > 0 && (
					<UsersListPagination
						totalPages={Math.ceil(sortedSOPData.length / pagination.itemsPerPage)}
						currentPage={pagination.page}
						totalRecords={sortedSOPData.length}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
					/>
				)}
			</div>

			{/* ======================= ADD SOP MODAL ======================= */}
			<Modal
				show={showAddModal}
				centered
				size='lg'
				onHide={() => setShowAddModal(false)}
				className='modal fade'>
				<div className='modal-content' style={{ borderRadius: '16px', overflow: 'hidden' }}>
					<div
						className='modal-header py-4 px-6'
						style={{ borderBottom: '1px solid #E4EAF2', background: '#FFFFFF' }}>
						<div className='d-flex align-items-center gap-3'>
							<div
								style={{
									width: '38px',
									height: '38px',
									borderRadius: '10px',
									background: '#EAF1FB',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: '#172B4D',
								}}>
								<FontAwesomeIcon icon={faPlus} className='fs-5' />
							</div>
							<div>
								<h5 className='modal-title fw-bold text-gray-900 m-0 fs-5'>
									Create & Assign New SOP
								</h5>
								<span className='text-muted fs-7'>
									Define procedure guidelines and assign them to employees
								</span>
							</div>
						</div>
						<button
							type='button'
							className='btn-close'
							onClick={() => setShowAddModal(false)}></button>
					</div>

					<div className='modal-body p-6'>
						<div className='row g-4'>
							{/* Service Name */}
							<div className='col-12 col-md-6'>
								<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
									Service / Category Name <span className='text-danger'>*</span>
								</label>
								<input
									type='text'
									className='form-control form-control-solid'
									style={{ borderRadius: '8px', height: '40px' }}
									placeholder='e.g. Warehouse Operations / Customer Support'
									value={sopFormData.service_name}
									onChange={(e) =>
										setSopFormData({ ...sopFormData, service_name: e.target.value })
									}
								/>
							</div>

							{/* Assign to Employees */}
							<div className='col-12 col-md-6'>
								<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
									Assign To Employees <span className='text-danger'>*</span>
								</label>
								<MultiSelect
									options={employeeMultiSelectOptions}
									value={sopFormData.admin_ids}
									onChange={handleMultiSelectChange}
									labelledBy='Select Employees'
									className='fv-row'
								/>
							</div>

							{/* Dynamic SOP Items */}
							<div className='col-12'>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<label className='form-label fw-bold text-gray-800 fs-7 m-0'>
										SOP Procedure Items <span className='text-danger'>*</span>
									</label>
									<button
										type='button'
										className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-1.5 px-3 py-1.5'
										style={{ borderRadius: '6px', fontSize: '12px' }}
										onClick={addNewSopInput}>
										<FontAwesomeIcon icon={faPlus} className='fs-8' />
										<span>Add Another Item</span>
									</button>
								</div>

								<div className='d-flex flex-column gap-3'>
									{sopFormData.service_details.map((service: any, index: number) => (
										<div
											key={index}
											className='p-3 rounded'
											style={{
												background: '#F8FAFD',
												border: '1px solid #E4EAF2',
											}}>
											<div className='d-flex align-items-center justify-content-between mb-2'>
												<span className='fw-bold text-gray-700 fs-8'>
													Item #{index + 1}
												</span>
												{sopFormData.service_details.length > 1 && (
													<button
														type='button'
														className='btn btn-sm btn-icon btn-light-danger'
														style={{ width: '24px', height: '24px', borderRadius: '6px' }}
														onClick={() => removeSopInput(index)}
														title='Remove item'>
														<FontAwesomeIcon icon={faTrash} className='fs-8' />
													</button>
												)}
											</div>
											<div className='row g-2'>
												<div className='col-12 col-md-5'>
													<input
														type='text'
														className='form-control form-control-solid'
														style={{ borderRadius: '6px', fontSize: '13px', height: '38px' }}
														placeholder='Procedure Title'
														value={service.title}
														onChange={(e) => {
															const next = [...sopFormData.service_details]
															next[index].title = e.target.value
															setSopFormData({ ...sopFormData, service_details: next })
														}}
													/>
												</div>
												<div className='col-12 col-md-7'>
													<input
														type='text'
														className='form-control form-control-solid'
														style={{ borderRadius: '6px', fontSize: '13px', height: '38px' }}
														placeholder='Detailed Instructions / Steps'
														value={service.description}
														onChange={(e) => {
															const next = [...sopFormData.service_details]
															next[index].description = e.target.value
															setSopFormData({ ...sopFormData, service_details: next })
														}}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>

					<div
						className='modal-footer py-3 px-6'
						style={{ borderTop: '1px solid #E4EAF2', background: '#FFFFFF' }}>
						<button
							type='button'
							className='btn btn-light'
							style={{ borderRadius: '8px', fontWeight: 600 }}
							onClick={() => setShowAddModal(false)}>
							Cancel
						</button>
						<button
							type='button'
							className='btn btn-primary d-flex align-items-center gap-2'
							style={{
								borderRadius: '8px',
								fontWeight: 600,
								background: '#172B4D',
								borderColor: '#172B4D',
							}}
							onClick={handleSubmitSop}
							disabled={submitting}>
							{submitting ? (
								<>
									<span className='spinner-border spinner-border-sm'></span>
									<span>Submitting...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faUserCheck} />
									<span>Save & Assign SOP</span>
								</>
							)}
						</button>
					</div>
				</div>
			</Modal>

			{/* ======================= UPDATE SOP MODAL ======================= */}
			<Modal
				show={showUpdateModal}
				centered
				onHide={() => setShowUpdateModal(false)}
				className='modal fade'>
				<div className='modal-content' style={{ borderRadius: '16px', overflow: 'hidden' }}>
					<div
						className='modal-header py-4 px-6'
						style={{ borderBottom: '1px solid #E4EAF2', background: '#FFFFFF' }}>
						<div className='d-flex align-items-center gap-3'>
							<div
								style={{
									width: '38px',
									height: '38px',
									borderRadius: '10px',
									background: '#EAF1FB',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: '#172B4D',
								}}>
								<FontAwesomeIcon icon={faEdit} className='fs-5' />
							</div>
							<div>
								<h5 className='modal-title fw-bold text-gray-900 m-0 fs-5'>
									Update SOP
								</h5>
								<span className='text-muted fs-7'>
									Edit procedure title and description
								</span>
							</div>
						</div>
						<button
							type='button'
							className='btn-close'
							onClick={() => setShowUpdateModal(false)}></button>
					</div>

					<div className='modal-body p-6'>
						<div className='mb-4'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
								Service / Category
							</label>
							<input
								type='text'
								className='form-control form-control-solid'
								style={{ borderRadius: '8px' }}
								value={selectedSop?.service_name || ''}
								onChange={(e) =>
									setSelectedSop({ ...selectedSop, service_name: e.target.value })
								}
							/>
						</div>

						<div className='mb-4'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
								SOP Title <span className='text-danger'>*</span>
							</label>
							<input
								type='text'
								className='form-control form-control-solid'
								style={{ borderRadius: '8px' }}
								value={selectedSop?.title || ''}
								onChange={(e) =>
									setSelectedSop({ ...selectedSop, title: e.target.value })
								}
							/>
						</div>

						<div className='mb-2'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
								SOP Description
							</label>
							<textarea
								rows={3}
								className='form-control form-control-solid'
								style={{ borderRadius: '8px', resize: 'vertical' }}
								value={selectedSop?.description || ''}
								onChange={(e) =>
									setSelectedSop({ ...selectedSop, description: e.target.value })
								}
							/>
						</div>
					</div>

					<div
						className='modal-footer py-3 px-6'
						style={{ borderTop: '1px solid #E4EAF2', background: '#FFFFFF' }}>
						<button
							type='button'
							className='btn btn-light'
							style={{ borderRadius: '8px', fontWeight: 600 }}
							onClick={() => setShowUpdateModal(false)}>
							Cancel
						</button>
						<button
							type='button'
							className='btn btn-primary d-flex align-items-center gap-2'
							style={{
								borderRadius: '8px',
								fontWeight: 600,
								background: '#172B4D',
								borderColor: '#172B4D',
							}}
							onClick={handleUpdateSOP}
							disabled={submitting}>
							{submitting ? (
								<>
									<span className='spinner-border spinner-border-sm'></span>
									<span>Updating...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faCheckCircle} />
									<span>Save Changes</span>
								</>
							)}
						</button>
					</div>
				</div>
			</Modal>

			{/* ======================= ASSIGNED EMPLOYEES POPOVER ======================= */}
			{activePopover && (
				<AssignedEmployeesPopover
					sopTitle={activePopover.sopTitle}
					employees={activePopover.employees}
					completedBy={activePopover.completedBy}
					anchorRect={activePopover.anchorRect}
					onClose={() => setActivePopover(null)}
				/>
			)}
		</>
	)
}

export default HRAssignSopList
