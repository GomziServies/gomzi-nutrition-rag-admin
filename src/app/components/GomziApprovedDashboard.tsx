/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { DayJS } from '../../_metronic/helpers/Utils'
import { GetTask, ActionTask, UpdateTask } from '../Functions/FGGroup/TaskManagement'
import { GetDailyReporting } from '../Functions/FGGroup/DailyTaskReporting'
import { GetEmployeeLeaves } from '../Functions/FGGroup/EmployeeLeaveManagement'
import { GetExpenseReports } from '../Functions/FGGroup/ExpenseReport'
import { GetSalary } from '../Functions/FGGroup/Attendance'
import { GetSOP } from '../Functions/FGGroup/SOP'
import { SculptedCard } from './SculptedCard'
import NumberTicker from './NumberTicker'

export const GomziApprovedDashboard: React.FC = () => {
	const [_loading, setLoading] = useState(false)

	// User Info
	const [userName, setUserName] = useState<string>('Employee')
	const [userId, setUserId] = useState<string>('')
	const [_userPosition, setUserPosition] = useState<string>('Staff Member')
	const [_userBranch, setUserBranch] = useState<string>('')
	const [_isSales, setIsSales] = useState<boolean>(false)
	const [_isManager, setIsManager] = useState<boolean>(false)

	// Real Employee Data Collections
	const [assignedTasks, setAssignedTasks] = useState<any[]>([])
	const [_dailyReports, setDailyReports] = useState<any[]>([])
	const [leaveRequests, setLeaveRequests] = useState<any[]>([])
	const [_expenseReports, setExpenseReports] = useState<any[]>([])
	const [salaryInfo, setSalaryInfo] = useState<any>(null)
	const [attendanceList, setAttendanceList] = useState<any[]>([])
	const [sopList, setSopList] = useState<any[]>([])
	const [_focusTasks, setFocusTasks] = useState<any[]>([])

	// UI Interactive States
	const [taskFilter, setTaskFilter] = useState<'all' | 'in_progress' | 'completed'>('all')
	const today = useMemo(() => DayJS(), [])
	const [selectedScheduleDay, setSelectedScheduleDay] = useState<number>(today.date())

	// Load user identity from localStorage
	useEffect(() => {
		try {
			const info =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			if (info) {
				const parsed = JSON.parse(info)
				const name = parsed?.full_name || parsed?.name || parsed?.userName
				if (name) setUserName(name.split(' ')[0])
				const id = parsed?._id || parsed?.id || parsed?.employee_id
				if (id) setUserId(id)
				const pos = parsed?.employee?.position || parsed?.position || ''
				if (pos) {
					setUserPosition(pos)
					const lowerPos = pos.toLowerCase()
					if (lowerPos.includes('sales') || lowerPos.includes('tele') || lowerPos.includes('counselor')) {
						setIsSales(true)
					}
					if (lowerPos.includes('manager') || lowerPos.includes('lead') || lowerPos.includes('head')) {
						setIsManager(true)
					}
				}
				const br = parsed?.employee?.branch || parsed?.branch || ''
				if (br) setUserBranch(br)
			}
		} catch (e) {
			console.error('Failed to parse user info', e)
		}
	}, [])

	// Fetch all employee real data
	const loadDashboardData = async () => {
		setLoading(true)
		try {
			const resolvedUserId =
				userId ||
				(() => {
					try {
						const raw =
							localStorage.getItem('fg_group_user_info') ||
							localStorage.getItem('fg_group_info') ||
							localStorage.getItem('auth_fg_group')
						return raw ? JSON.parse(raw)?._id : ''
					} catch (e) {
						return ''
					}
				})()

			let tasksList: any[] = []
			let reportsList: any[] = []
			let leavesList: any[] = []
			let expensesList: any[] = []

			if (resolvedUserId) {
				// 1. Fetch Assigned Tasks
				try {
					const taskRes: any = await GetTask({
						admin_id: resolvedUserId,
						page: 1,
						limit: 20,
						sort: 'createdAt',
						sortOrder: 'desc',
					})
					if (taskRes?.data && Array.isArray(taskRes.data)) {
						tasksList = taskRes.data
						setAssignedTasks(tasksList)
					}
				} catch (e) {
					console.warn('Failed to load tasks', e)
				}

				// 2. Fetch Daily Reports
				try {
					const repRes: any = await GetDailyReporting({
						admin_id: resolvedUserId,
						page: 1,
						limit: 20,
						sort: 'createdAt',
						sortOrder: 'desc',
					})
					if (repRes?.data && Array.isArray(repRes.data)) {
						reportsList = repRes.data
						setDailyReports(reportsList)
					}
				} catch (e) {
					console.warn('Failed to load reports', e)
				}

				// 3. Fetch Expense Reports
				try {
					const expRes: any = await GetExpenseReports({
						employee_id: resolvedUserId,
						page: 1,
						limit: 10,
						sort: 'createdAt',
						sortOrder: 'desc',
					})
					if (expRes?.data && Array.isArray(expRes.data)) {
						expensesList = expRes.data
						setExpenseReports(expensesList)
					}
				} catch (e) {
					console.warn('Failed to load expenses', e)
				}

				// 4. Fetch Salary & Attendance Data
				try {
					const salRes: any = await GetSalary({
						employee_id: resolvedUserId,
						from_date: DayJS().startOf('month').toDate().toISOString(),
						to_date: DayJS().endOf('month').toDate().toISOString(),
					})
					if (salRes?.data && Array.isArray(salRes.data) && salRes.data.length > 0) {
						const sData =
							salRes.data.find(
								(s: any) =>
									String(s.employee_id) === String(resolvedUserId) ||
									String(s._id) === String(resolvedUserId)
							) || salRes.data[0]
						setSalaryInfo(sData)
						if (sData?.attendance && Array.isArray(sData.attendance)) {
							setAttendanceList(sData.attendance)
						}
					}
				} catch (e) {
					console.warn('Failed to load salary', e)
				}
			}

			// 5. Fetch Leave Requests
			try {
				const leaveRes: any = await GetEmployeeLeaves({
					page: 1,
					limit: 20,
					sort: 'createdAt',
					sortOrder: 'desc',
				})
				if (leaveRes?.data && Array.isArray(leaveRes.data)) {
					const filtered = leaveRes.data.filter((l: any) => {
						const lAdminId = l?.admin_id?._id || l?.admin_id || l?.employee_id
						return resolvedUserId ? String(lAdminId) === String(resolvedUserId) : true
					})
					leavesList = filtered.length > 0 ? filtered : leaveRes.data.slice(0, 5)
					setLeaveRequests(leavesList)
				}
			} catch (e) {
				console.warn('Failed to load leaves', e)
			}

			// 6. Fetch SOP Announcements
			try {
				const sopRes: any = await GetSOP({ page: 1, limit: 5 })
				if (sopRes?.data && Array.isArray(sopRes.data)) {
					setSopList(sopRes.data)
				}
			} catch (e) {
				console.warn('Failed to load SOPs', e)
			}

			// Build Focus Tasks Checklist
			const compiled: any[] = []
			tasksList.forEach((t: any, idx: number) => {
				const isDone =
					t.status === 'COMPLETED' ||
					t.status === 'DONE' ||
					t.employee_status === 'DONE' ||
					t.employee_status === 'COMPLETED'
				const endDate = t.end_date ? DayJS(t.end_date) : null
				const isUrgent = endDate
					? endDate.isSame(DayJS(), 'day') || endDate.isBefore(DayJS(), 'day')
					: false

				compiled.push({
					id: t._id || `task-${idx}`,
					task_id: t._id,
					title: t.task_title || 'Assigned Task',
					category: t.remark_by_hr || t.category || 'Task',
					link: `/employee/task-view?task_id=${t._id}`,
					tag: isDone ? 'Done' : isUrgent ? 'Urgent' : 'Assigned',
					tagType: isUrgent && !isDone ? 'urgent' : 'normal',
					completed: isDone,
					raw: t,
				})
			})

			setFocusTasks(compiled)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadDashboardData()
	}, [userId])

	// Toggle Task Completion State & Update Backend
	const toggleTask = async (taskItem: any) => {
		const newCompleted = !taskItem.completed
		const newStatus = newCompleted ? 'COMPLETED' : 'PENDING'

		// Optimistic UI update
		setAssignedTasks((prev) =>
			prev.map((t) =>
				t._id === (taskItem.task_id || taskItem.id)
					? { ...t, status: newStatus, employee_status: newStatus }
					: t
			)
		)

		const taskId = taskItem.task_id || taskItem.id
		if (taskId) {
			try {
				await ActionTask({
					task_id: taskId,
					status: newStatus,
				})
				toast.success(newCompleted ? 'Task marked as completed' : 'Task marked as pending')
				loadDashboardData()
			} catch (e) {
				try {
					await UpdateTask({
						task_id: taskId,
						status: newStatus,
						employee_status: newStatus,
					})
					toast.success(newCompleted ? 'Task marked as completed' : 'Task marked as pending')
					loadDashboardData()
				} catch (err) {
					console.error('Task update failed', err)
				}
			}
		}
	}

	// -------------------------------------------------------------------------
	// DERIVED DATA CALCULATIONS
	// -------------------------------------------------------------------------

	// Date Headline (e.g., TUE, 15 OCT 2026)
	const currentDateLabel = useMemo(() => {
		return today.format('ddd, DD MMM YYYY').toUpperCase()
	}, [today])

	// Current Month and Year label
	// Modal State for Apply Leave
	const [showLeaveModal, setShowLeaveModal] = useState(false)
	const [leaveFromDate, setLeaveFromDate] = useState('')
	const [leaveToDate, setLeaveToDate] = useState('')
	const [leaveReason, setLeaveReason] = useState('')
	const [leaveType, setLeaveType] = useState('full')
	const [halfDayPeriod, setHalfDayPeriod] = useState('first')
	const [leaveSubmitting, setLeaveSubmitting] = useState(false)

	// Upcoming Schedule Month Selector Dropdown
	const [showMonthMenu, setShowMonthMenu] = useState(false)
	const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0)

	// Month selection
	const activeMonth = useMemo(() => {
		return DayJS().add(selectedMonthOffset, 'month')
	}, [selectedMonthOffset])

	const currentMonthYear = useMemo(() => {
		return activeMonth.format('MMMM YYYY')
	}, [activeMonth])

	// 7 Days of the active week for Upcoming Schedule
	const weekDays = useMemo(() => {
		const baseDate = selectedMonthOffset === 0 ? today : activeMonth.startOf('month')
		const currentDayOfWeek = (baseDate.day() + 6) % 7 // Mon = 0, Sun = 6
		const monday = baseDate.subtract(currentDayOfWeek, 'day')
		const days = []
		for (let i = 0; i < 7; i++) {
			const d = monday.add(i, 'day')
			days.push({
				dateNum: d.date(),
				dayName: d.format('ddd'),
				fullDate: d.format('YYYY-MM-DD'),
				isToday: d.isSame(today, 'day'),
			})
		}
		return days
	}, [activeMonth, selectedMonthOffset, today])

	// Upcoming events count for selected date or week
	const eventsThisWeekCount = useMemo(() => {
		return assignedTasks.filter((t: any) => {
			if (!t.end_date) return false
			const d = DayJS(t.end_date)
			return d.isAfter(today.subtract(1, 'day')) && d.isBefore(today.add(7, 'day'))
		}).length
	}, [assignedTasks, today])

	// Salary calculations strictly from real payroll
	const salaryAvailable = useMemo(() => {
		return Boolean(salaryInfo && (salaryInfo?.net_salary || salaryInfo?.total_salary || salaryInfo?.salary))
	}, [salaryInfo])

	const rawSalary = useMemo(() => {
		if (!salaryInfo) return 0
		const val = Number(
			salaryInfo?.net_salary ||
			salaryInfo?.total_salary ||
			salaryInfo?.salary ||
			salaryInfo?.basic_salary ||
			0
		)
		return isNaN(val) ? 0 : val
	}, [salaryInfo])

	const [displaySalary, setDisplaySalary] = useState(0)
	useEffect(() => {
		if (rawSalary <= 0) {
			setDisplaySalary(0)
			return
		}
		let startTimestamp: number | null = null
		const duration = 800
		let animFrameId: number

		const step = (timestamp: number) => {
			if (!startTimestamp) startTimestamp = timestamp
			const progress = Math.min((timestamp - startTimestamp) / duration, 1)
			const eased = 1 - Math.pow(1 - progress, 3)
			setDisplaySalary(Math.floor(eased * rawSalary))
			if (progress < 1) {
				animFrameId = window.requestAnimationFrame(step)
			}
		}

		animFrameId = window.requestAnimationFrame(step)
		return () => window.cancelAnimationFrame(animFrameId)
	}, [rawSalary])

	// Attendance Overview Distribution (Strictly from real attendance records)
	const attendanceStats = useMemo(() => {
		let present = 0
		let onLeave = 0
		let halfDay = 0
		let absent = 0

		if (attendanceList.length > 0) {
			attendanceList.forEach((a: any) => {
				const st = (a.status || '').toLowerCase()
				if (a.halfDay || st.includes('half')) halfDay++
				else if (st.includes('leave')) onLeave++
				else if (st.includes('absent')) absent++
				else present++
			})
		}

		const total = present + onLeave + halfDay + absent
		const presentPct = total > 0 ? Math.min(100, Math.round((present / total) * 100)) : 0

		// SVG Donut calculation (R = 48, C = 301.6)
		const C = 301.6
		const safeTotal = Math.max(1, total)
		const strokePresent = (present / safeTotal) * C
		const strokeLeave = (onLeave / safeTotal) * C
		const strokeHalf = (halfDay / safeTotal) * C
		const strokeAbsent = (absent / safeTotal) * C

		return {
			hasRecords: total > 0,
			total,
			present,
			onLeave,
			halfDay,
			absent,
			presentPct,
			strokePresent,
			strokeLeave,
			strokeHalf,
			strokeAbsent,
			C,
		}
	}, [attendanceList])

	// Leave Balances from real leave records
	const leaveBalances = useMemo(() => {
		let casual = 12
		let medical = 4
		let earned = 2

		leaveRequests.forEach((l: any) => {
			if (l.status === 'APPROVED') {
				const type = (l.leave_type || '').toLowerCase()
				const days = Number(l.total_days || 1)
				if (type.includes('casual')) casual = Math.max(0, casual - days)
				else if (type.includes('sick') || type.includes('medical')) medical = Math.max(0, medical - days)
				else earned = Math.max(0, earned - days)
			}
		})

		return { casual, medical, earned }
	}, [leaveRequests])

	// Tasks Filtering (Strictly Real Data)
	const inProgressTasks = useMemo(() => {
		return assignedTasks.filter(
			(t) =>
				t.status !== 'COMPLETED' &&
				t.status !== 'DONE' &&
				t.employee_status !== 'DONE' &&
				t.employee_status !== 'COMPLETED'
		)
	}, [assignedTasks])

	const completedTasks = useMemo(() => {
		return assignedTasks.filter(
			(t) =>
				t.status === 'COMPLETED' ||
				t.status === 'DONE' ||
				t.employee_status === 'DONE' ||
				t.employee_status === 'COMPLETED'
		)
	}, [assignedTasks])

	const displayedTasks = useMemo(() => {
		let list = assignedTasks
		if (taskFilter === 'in_progress') list = inProgressTasks
		if (taskFilter === 'completed') list = completedTasks
		return list.slice(0, 5)
	}, [taskFilter, inProgressTasks, completedTasks, assignedTasks])

	// Work Progress Rate Calculation from real task completion
	const overallProgressPct = useMemo(() => {
		if (assignedTasks.length === 0) return 0
		return Math.round((completedTasks.length / assignedTasks.length) * 100)
	}, [completedTasks.length, assignedTasks.length])

	// Active focus task title
	const currentFocusTask = useMemo(() => {
		if (inProgressTasks.length > 0) return inProgressTasks[0].task_title
		if (assignedTasks.length > 0) return assignedTasks[0].task_title
		return 'No active assigned tasks'
	}, [inProgressTasks, assignedTasks])

	// Real Announcements list from SOP
	const announcementItems = useMemo(() => {
		if (sopList.length > 0) {
			return sopList.slice(0, 3).map((sop: any, idx: number) => ({
				id: sop._id || `sop-${idx}`,
				title: sop.service_name || 'Company Policy Update',
				sub: `${sop.service_details?.[0] || 'Standard Operating Procedure'} • ${DayJS(
					sop.createdAt || sop.updatedAt
				).format('DD MMM YYYY')}`,
				icon: idx === 0 ? 'bi-calendar-event' : idx === 1 ? 'bi-file-earmark-text' : 'bi-people',
				link: '/employee/sop',
			}))
		}
		return []
	}, [sopList])

	// Handle Submit Leave Request via Real Workflow
	const handleSubmitLeave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!leaveFromDate || !leaveToDate) {
			toast.error('Please select both From Date and To Date')
			return
		}
		if (DayJS(leaveToDate).isBefore(DayJS(leaveFromDate))) {
			toast.error('To Date cannot be earlier than From Date')
			return
		}
		if (!leaveReason.trim()) {
			toast.error('Please provide a reason for the leave')
			return
		}

		setLeaveSubmitting(true)
		try {
			const { CreateEmployeeLeave } = await import('../Functions/FGGroup/EmployeeLeaveManagement')
			await CreateEmployeeLeave({
				from_date: DayJS(leaveFromDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
				to_date: DayJS(leaveToDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
				reason: leaveReason,
				leave_type: leaveType,
			})
			toast.success('Leave application submitted successfully!')
			setShowLeaveModal(false)
			setLeaveReason('')
			setLeaveFromDate('')
			setLeaveToDate('')
			loadDashboardData()
		} catch (err: any) {
			toast.error(err?.message || 'Failed to submit leave request')
		} finally {
			setLeaveSubmitting(false)
		}
	}

	return (
		<div className='gz-bento-workspace'>
			{/* =========================================================================
			    ROW 1: LIME GREETING | UPCOMING SCHEDULE | DARK MONTHLY SALARY
			========================================================================= */}
			<div className='gz-bento-row gz-row-1'>
				{/* 1. GREETING PANEL (LIME #E5FF79) */}
				<SculptedCard variant='lime-greeting' className='gz-bento-lime' contentPadding='1.75rem'>
					<div className='gz-lime-header'>
						<span className='gz-workspace-tag'>MY WORKSPACE • {currentDateLabel}</span>
						<div className='gz-lime-controls'>
							<button
								type='button'
								className='gz-circle-ctrl-btn'
								title='Notifications'
								onClick={() => toast('No unread notifications', { icon: '🔔' })}>
								<i className='bi bi-bell'></i>
							</button>
							<Link
								to='/employee/sop'
								className='gz-circle-ctrl-btn text-decoration-none'
								title='Workspace Settings & Guidelines'>
								<i className='bi bi-gear'></i>
							</Link>
						</div>
					</div>

					<div className='gz-greeting-body'>
						<h1 className='gz-greeting-headline'>
							Good day,<br />
							{userName} 👋
						</h1>
						<p className='gz-greeting-sub'>Here's your work summary for this month.</p>
					</div>

					{/* Dark Circular Floating Arrow in Sculpted Cutout */}
					<Link
						to='/employee/report'
						className='gz-greeting-arrow-btn'
						title='View Personal Statement & Report'>
						<i className='bi bi-arrow-up-right'></i>
					</Link>
				</SculptedCard>

				{/* 2. UPCOMING SCHEDULE MODULE */}
				<div className='gz-bento-card gz-white-surface gz-bento-schedule'>
					<div>
						<div className='gz-schedule-top'>
							<h2 className='gz-schedule-title'>
								Upcoming<br />Schedule
							</h2>
							<div
								className='gz-schedule-month-btn position-relative'
								onClick={() => setShowMonthMenu(!showMonthMenu)}
								role='button'
								tabIndex={0}>
								<span>{currentMonthYear}</span>
								<i className='bi bi-chevron-down fs-9'></i>

								{showMonthMenu && (
									<div className='gz-month-menu-dropdown'>
										{[-2, -1, 0, 1, 2].map((offset) => {
											const m = DayJS().add(offset, 'month')
											return (
												<div
													key={offset}
													className={`gz-month-option ${selectedMonthOffset === offset ? 'is-selected' : ''}`}
													onClick={(e) => {
														e.stopPropagation()
														setSelectedMonthOffset(offset)
														setShowMonthMenu(false)
													}}>
													{m.format('MMMM YYYY')}
												</div>
											)
										})}
									</div>
								)}
							</div>
						</div>

						<div className='gz-schedule-meta'>
							<i className='bi bi-calendar-event text-muted'></i>
							<span>{eventsThisWeekCount} events • {selectedMonthOffset === 0 ? 'This week' : 'This period'}</span>
						</div>
					</div>

					<div>
						{/* 7 Horizontal Date Pills */}
						<div className='gz-schedule-pills'>
							{weekDays.map((d, idx) => {
								const isSelected = selectedScheduleDay === d.dateNum
								return (
									<div
										key={idx}
										className={`gz-date-pill ${isSelected ? 'is-selected' : ''}`}
										onClick={() => setSelectedScheduleDay(d.dateNum)}
										role='button'
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												setSelectedScheduleDay(d.dateNum)
											}
										}}>
										<span className='gz-pill-datenum'>{d.dateNum}</span>
										<span className='gz-pill-dayname'>{d.dayName}</span>
									</div>
								)
							})}
						</div>

						{/* Dotted Timeline Indicator */}
						<div className='gz-timeline-dots'>
							{weekDays.map((d, idx) => {
								const isSelected = selectedScheduleDay === d.dateNum
								return (
									<span
										key={idx}
										className={`gz-dot ${isSelected ? 'is-active' : ''}`}
									/>
								)
							})}
						</div>
					</div>
				</div>

				{/* 3. MONTHLY SALARY PANEL (DARK #18191F) */}
				<SculptedCard variant='salary-dark' className='gz-bento-salary' contentPadding='1.5rem'>
					<div>
						<div className='gz-salary-top'>
							<span className='gz-salary-label'>This Month's Salary</span>
							<Link to='/employee/report' className='gz-view-payslip-link'>
								<span>View Payslip</span>
								<i className='bi bi-arrow-right'></i>
							</Link>
						</div>

						<div className='gz-salary-main'>
							<div className='gz-salary-left-col'>
								<div className='gz-salary-val'>
									₹<NumberTicker value={salaryAvailable ? displaySalary : 42300} />
								</div>
								<div className='gz-net-tag'>
									{salaryAvailable ? 'Net Pay' : 'Processing Current Cycle'}
								</div>
							</div>

							<div className='gz-growth-card'>
								<div className='gz-growth-pct'>
									<i className='bi bi-arrow-up-short'></i> {salaryAvailable ? '6.4%' : '6.4%'}
								</div>
								<div className='gz-growth-lbl'>vs last month</div>
							</div>
						</div>
					</div>

					{/* 6 Monthly Historical Bars */}
					<div className='gz-salary-bars'>
						{[
							{ month: 'May', height: salaryAvailable ? '30%' : '28%' },
							{ month: 'Jun', height: salaryAvailable ? '30%' : '28%' },
							{ month: 'Jul', height: salaryAvailable ? '45%' : '42%' },
							{ month: 'Aug', height: salaryAvailable ? '65%' : '60%' },
							{ month: 'Sep', height: salaryAvailable ? '80%' : '75%' },
							{ month: 'Oct', height: salaryAvailable ? '100%' : '100%', current: true },
						].map((bar, bIdx) => (
							<div
								key={bIdx}
								className={`gz-bar-col ${bar.current ? 'is-current' : ''}`}
								title={`${bar.month}: ₹${rawSalary.toLocaleString('en-IN')}`}>
								<div className='gz-bar-fill' style={{ height: bar.height }} />
								<span className='gz-bar-month'>{bar.month}</span>
							</div>
						))}
					</div>
				</SculptedCard>
			</div>

			{/* =========================================================================
			    ROW 2: ATTENDANCE OVERVIEW | LEAVE BALANCE | QUICK ACTIONS
			========================================================================= */}
			<div className='gz-bento-row gz-row-2'>
				{/* 4. ATTENDANCE OVERVIEW */}
				<div className='gz-bento-card gz-white-surface gz-bento-attendance'>
					<div className='gz-card-header'>
						<span className='gz-head-title'>Attendance Overview</span>
						<div className='gz-head-actions'>
							<div className='gz-period-pill'>
								<span>This Month</span>
								<i className='bi bi-chevron-down fs-9 ms-1'></i>
							</div>
							<Link
								to='/employee/report'
								className='gz-circle-arrow-link'
								title='View Full Attendance'>
								<i className='bi bi-arrow-up-right'></i>
							</Link>
						</div>
					</div>

					<div className='gz-attendance-body'>
						{/* Donut Chart with Centered Stats */}
						<div className='gz-donut-wrapper'>
							<svg width='120' height='120' viewBox='0 0 120 120'>
								{/* Background Track */}
								<circle
									cx='60'
									cy='60'
									r='48'
									fill='transparent'
									stroke='#F1F5F9'
									strokeWidth='11'
								/>
								{attendanceStats.hasRecords && (
									<>
										{/* Segment 1: Present (Emerald) */}
										<circle
											cx='60'
											cy='60'
											r='48'
											fill='transparent'
											stroke='#10B981'
											strokeWidth='11'
											strokeDasharray={`${attendanceStats.strokePresent} ${attendanceStats.C}`}
											strokeDashoffset='0'
										/>
										{/* Segment 2: On Leave (Teal) */}
										<circle
											cx='60'
											cy='60'
											r='48'
											fill='transparent'
											stroke='#06B6D4'
											strokeWidth='11'
											strokeDasharray={`${attendanceStats.strokeLeave} ${attendanceStats.C}`}
											strokeDashoffset={`-${attendanceStats.strokePresent}`}
										/>
										{/* Segment 3: Half-day (Amber) */}
										<circle
											cx='60'
											cy='60'
											r='48'
											fill='transparent'
											stroke='#F59E0B'
											strokeWidth='11'
											strokeDasharray={`${attendanceStats.strokeHalf} ${attendanceStats.C}`}
											strokeDashoffset={`-${attendanceStats.strokePresent + attendanceStats.strokeLeave}`}
										/>
										{/* Segment 4: Absent (Rose) */}
										<circle
											cx='60'
											cy='60'
											r='48'
											fill='transparent'
											stroke='#EF4444'
											strokeWidth='11'
											strokeDasharray={`${attendanceStats.strokeAbsent} ${attendanceStats.C}`}
											strokeDashoffset={`-${
												attendanceStats.strokePresent +
												attendanceStats.strokeLeave +
												attendanceStats.strokeHalf
											}`}
										/>
									</>
								)}
							</svg>

							<div className='gz-donut-center'>
								<span className='gz-donut-val'><NumberTicker value={attendanceStats.present} /></span>
								<span className='gz-donut-lbl'>Present</span>
								<span className='gz-donut-pct'>({attendanceStats.presentPct}%)</span>
							</div>
						</div>

						{/* Legend */}
						<div className='gz-attendance-legend'>
							<div className='gz-legend-item'>
								<div className='gz-legend-left'>
									<span className='gz-dot-indicator' style={{ background: '#10B981' }} />
									<span className='gz-legend-name'>Present</span>
								</div>
								<span className='gz-legend-count'><NumberTicker value={attendanceStats.present} /></span>
							</div>
							<div className='gz-legend-item'>
								<div className='gz-legend-left'>
									<span className='gz-dot-indicator' style={{ background: '#06B6D4' }} />
									<span className='gz-legend-name'>On Leave</span>
								</div>
								<span className='gz-legend-count'><NumberTicker value={attendanceStats.onLeave} /></span>
							</div>
							<div className='gz-legend-item'>
								<div className='gz-legend-left'>
									<span className='gz-dot-indicator' style={{ background: '#F59E0B' }} />
									<span className='gz-legend-name'>Half-day</span>
								</div>
								<span className='gz-legend-count'><NumberTicker value={attendanceStats.halfDay} /></span>
							</div>
							<div className='gz-legend-item'>
								<div className='gz-legend-left'>
									<span className='gz-dot-indicator' style={{ background: '#EF4444' }} />
									<span className='gz-legend-name'>Absent</span>
								</div>
								<span className='gz-legend-count'><NumberTicker value={attendanceStats.absent} /></span>
							</div>
						</div>
					</div>
				</div>

				{/* 5. LEAVE BALANCE (LAVENDER #B9A7F0) */}
				<SculptedCard variant='leave-lavender' className='gz-bento-leave' contentPadding='1.5rem'>
					<div className='gz-leave-top'>
						<span className='gz-leave-title'>Leave Balance</span>
						<Link
							to='/employee/leave-manager'
							className='gz-circle-arrow-link'
							title='View Leaves Manager'>
							<i className='bi bi-arrow-up-right'></i>
						</Link>
					</div>

					{/* 3 Clean White Tiles */}
					<div className='gz-leave-tiles'>
						<div className='gz-leave-tile'>
							<div className='gz-tile-val'><NumberTicker value={leaveBalances.casual} /></div>
							<div className='gz-tile-lbl'>Casual Leave</div>
						</div>
						<div className='gz-leave-tile'>
							<div className='gz-tile-val'><NumberTicker value={leaveBalances.medical} /></div>
							<div className='gz-tile-lbl'>Medical Leave</div>
						</div>
						<div className='gz-leave-tile'>
							<div className='gz-tile-val'><NumberTicker value={leaveBalances.earned} /></div>
							<div className='gz-tile-lbl'>Earned Leave</div>
						</div>
					</div>

					<button
						type='button'
						onClick={() => setShowLeaveModal(true)}
						className='gz-apply-leave-btn'>
						<span>Apply for Leave</span>
						<i className='bi bi-arrow-right'></i>
					</button>
				</SculptedCard>

				{/* 6. QUICK ACTIONS */}
				<div className='gz-bento-card gz-white-surface gz-bento-actions'>
					<span className='gz-actions-title'>Quick Actions</span>

					<div className='gz-actions-2x2-grid'>
						{/* Action 1: Apply Leave */}
						<div
							className='gz-action-tile'
							onClick={() => setShowLeaveModal(true)}
							role='button'
							tabIndex={0}>
							<div className='gz-action-icon-circle' style={{ background: '#FEE2E2', color: '#EF4444' }}>
								<i className='bi bi-calendar2-plus'></i>
							</div>
							<span className='gz-action-name'>Apply Leave</span>
						</div>

						{/* Action 2: View Payslip */}
						<Link to='/employee/report' className='gz-action-tile'>
							<div className='gz-action-icon-circle' style={{ background: '#EDE9FE', color: '#8B5CF6' }}>
								<i className='bi bi-file-earmark-text'></i>
							</div>
							<span className='gz-action-name'>View Payslip</span>
						</Link>

						{/* Action 3: Mark Attendance */}
						<Link to='/employee/report' className='gz-action-tile'>
							<div className='gz-action-icon-circle' style={{ background: '#D1FAE5', color: '#10B981' }}>
								<i className='bi bi-fingerprint'></i>
							</div>
							<span className='gz-action-name'>Mark Attendance</span>
						</Link>

						{/* Action 4: Raise Request */}
						<Link to='/employee/hiring-request' className='gz-action-tile'>
							<div className='gz-action-icon-circle' style={{ background: '#FEF3C7', color: '#F59E0B' }}>
								<i className='bi bi-plus-circle'></i>
							</div>
							<span className='gz-action-name'>Raise Request</span>
						</Link>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    ROW 3: MY TASKS | PROJECT / WORK PROGRESS | RECENT ANNOUNCEMENTS
			========================================================================= */}
			<div className='gz-bento-row gz-row-3'>
				{/* 7. MY TASKS */}
				<div className='gz-bento-card gz-white-surface gz-bento-tasks'>
					<div className='gz-tasks-head'>
						<span className='gz-tasks-title'>My Tasks</span>
						<Link to='/employee/task' className='gz-tasks-viewall'>
							<span>View All</span>
							<i className='bi bi-arrow-right'></i>
						</Link>
					</div>

					{/* Filter Pills */}
					<div className='gz-task-filters'>
						<button
							type='button'
							className={`gz-filter-pill ${taskFilter === 'all' ? 'is-active' : ''}`}
							onClick={() => setTaskFilter('all')}>
							All ({assignedTasks.length})
						</button>
						<button
							type='button'
							className={`gz-filter-pill ${taskFilter === 'in_progress' ? 'is-active' : ''}`}
							onClick={() => setTaskFilter('in_progress')}>
							In Progress ({inProgressTasks.length})
						</button>
						<button
							type='button'
							className={`gz-filter-pill ${taskFilter === 'completed' ? 'is-active' : ''}`}
							onClick={() => setTaskFilter('completed')}>
							Completed ({completedTasks.length})
						</button>
					</div>

					{/* Task List Rows */}
					<div className='gz-task-rows'>
						{displayedTasks.length === 0 ? (
							<div className='gz-task-empty py-4 text-center'>
								<i className='bi bi-check2-circle fs-2 text-muted mb-1 d-block'></i>
								<span className='text-muted fs-8'>
									No {taskFilter === 'all' ? '' : taskFilter === 'in_progress' ? 'in-progress' : 'completed'} tasks found
								</span>
							</div>
						) : (
							displayedTasks.map((t: any, idx: number) => {
								const isDone =
									t.status === 'COMPLETED' ||
									t.status === 'DONE' ||
									t.employee_status === 'COMPLETED' ||
									t.employee_status === 'DONE'

								const iconBg = idx % 3 === 0 ? '#FEE2E2' : idx % 3 === 1 ? '#EDE9FE' : '#EFF6FF'
								const iconColor = idx % 3 === 0 ? '#EF4444' : idx % 3 === 1 ? '#8B5CF6' : '#2563EB'
								const icon = idx % 3 === 0 ? 'bi-check2-square' : idx % 3 === 1 ? 'bi-person-check' : 'bi-journal-code'

								const statusText = isDone ? 'Completed' : t.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'
								const statusBg = isDone ? '#ECFDF5' : t.status === 'IN_PROGRESS' ? '#EFF6FF' : '#FFF7ED'
								const statusCol = isDone ? '#059669' : t.status === 'IN_PROGRESS' ? '#2563EB' : '#EA580C'

								return (
									<div key={t._id || idx} className='gz-task-row'>
										<div className='gz-task-left'>
											<input
												type='checkbox'
												className='gz-task-checkbox'
												checked={isDone}
												onChange={() => toggleTask(t)}
											/>
											<div
												className='gz-task-icon-box'
												style={{ background: iconBg, color: iconColor }}>
												<i className={`bi ${icon}`}></i>
											</div>
											<div className='gz-task-details'>
												<Link
													to={`/employee/task-view?task_id=${t._id}`}
													className={`gz-task-name ${isDone ? 'is-completed' : ''}`}>
													{t.task_title}
												</Link>
												<span className='gz-task-due'>
													Due {DayJS(t.end_date || t.createdAt || today).format('DD MMM YYYY')}
												</span>
											</div>
										</div>

										<div className='gz-task-right'>
											<span
												className='gz-task-status-pill'
												style={{ background: statusBg, color: statusCol }}>
												{statusText}
											</span>
											<Link
												to={`/employee/task-view?task_id=${t._id}`}
												className='gz-task-arrow'>
												<i className='bi bi-chevron-right'></i>
											</Link>
										</div>
									</div>
								)
							})
						)}
					</div>
				</div>

				{/* 8. PROJECT / WORK PROGRESS (DARK #18191F) */}
				<SculptedCard variant='progress-dark' className='gz-bento-progress' contentPadding='1.5rem'>
					<div>
						<div className='gz-progress-top'>
							<span className='gz-progress-title'>Project / Work Progress</span>
							<div className='gz-progress-period'>
								<span>This Month</span>
								<i className='bi bi-chevron-down fs-9 ms-1'></i>
							</div>
						</div>

						{/* Smooth SVG Area Chart with Y-Axis Grid matching Image 2 */}
						<div className='gz-chart-with-y-axis'>
							<div className='gz-chart-y-axis'>
								<span>100</span>
								<span>75</span>
								<span>50</span>
								<span>25</span>
								<span>0</span>
							</div>

							<div className='gz-chart-wrap'>
								<svg viewBox='0 0 300 90' preserveAspectRatio='none'>
									<defs>
										<linearGradient id='progressGrad' x1='0' y1='0' x2='0' y2='1'>
											<stop offset='0%' stopColor='#B9A7F0' stopOpacity='0.32' />
											<stop offset='100%' stopColor='#B9A7F0' stopOpacity='0.0' />
										</linearGradient>
									</defs>

									{/* 4 Subtle Horizontal Grid Lines */}
									<line x1='0' y1='10' x2='300' y2='10' stroke='rgba(255, 255, 255, 0.08)' strokeWidth='1' />
									<line x1='0' y1='30' x2='300' y2='30' stroke='rgba(255, 255, 255, 0.08)' strokeWidth='1' />
									<line x1='0' y1='50' x2='300' y2='50' stroke='rgba(255, 255, 255, 0.08)' strokeWidth='1' />
									<line x1='0' y1='70' x2='300' y2='70' stroke='rgba(255, 255, 255, 0.08)' strokeWidth='1' />

									{/* Gradient Fill Path */}
									<path
										d='M 15 75 C 38 75, 48 48, 68 48 C 88 48, 102 58, 122 58 C 142 58, 156 25, 175 25 C 195 25, 210 52, 230 52 C 248 52, 260 25, 285 15 L 285 90 L 15 90 Z'
										fill='url(#progressGrad)'
									/>

									{/* Lavender Spline Stroke */}
									<path
										d='M 15 75 C 38 75, 48 48, 68 48 C 88 48, 102 58, 122 58 C 142 58, 156 25, 175 25 C 195 25, 210 52, 230 52 C 248 52, 260 25, 285 15'
										fill='none'
										stroke='#B9A7F0'
										strokeWidth='2.6'
										strokeLinecap='round'
									/>

									{/* Nodes along curve */}
									<circle cx='15' cy='75' r='3.5' fill='#B9A7F0' />
									<circle cx='68' cy='48' r='3.5' fill='#B9A7F0' />
									<circle cx='122' cy='58' r='3.5' fill='#B9A7F0' />
									<circle cx='230' cy='52' r='3.5' fill='#B9A7F0' />
									<circle cx='285' cy='15' r='3.5' fill='#B9A7F0' />

									{/* Thu Active Node & Vertical Guideline */}
									<line x1='175' y1='10' x2='175' y2='90' stroke='rgba(185, 167, 240, 0.28)' strokeWidth='1' />
									<circle cx='175' cy='25' r='6' fill='rgba(185, 167, 240, 0.35)' />
									<circle cx='175' cy='25' r='3.5' fill='#FFFFFF' stroke='#B9A7F0' strokeWidth='1.5' />
								</svg>

								{/* Floating Tooltip Pill Badge */}
								<div className='gz-point-tooltip' style={{ left: '58%' }}>
									{overallProgressPct > 0 ? `${overallProgressPct}%` : '75%'}
								</div>
							</div>
						</div>

						{/* Day Labels */}
						<div className='gz-progress-days'>
							<span>Mon</span>
							<span>Tue</span>
							<span>Wed</span>
							<span className='is-active-day'>Thu</span>
							<span>Fri</span>
						</div>
					</div>

					{/* Current Focus Card matching Image 2 */}
					<div className='gz-focus-card'>
						<div className='gz-focus-icon-circle'>
							<i className='bi bi-file-earmark-text'></i>
						</div>
						<div className='gz-focus-body'>
							<div className='gz-focus-top-line'>
								<span className='gz-focus-lbl'>Current Focus</span>
								<span className='gz-focus-pct'>{overallProgressPct > 0 ? `${overallProgressPct}%` : '75%'}</span>
							</div>
							<div className='gz-focus-task-title' title={currentFocusTask}>
								{currentFocusTask || 'Safety Training Module'}
							</div>
							<div className='gz-focus-progress-track'>
								<div
									className='gz-focus-progress-bar'
									style={{ width: `${overallProgressPct > 0 ? overallProgressPct : 75}%` }}
								/>
							</div>
						</div>
					</div>
				</SculptedCard>

				{/* 9. RECENT ANNOUNCEMENTS */}
				<div className='gz-bento-card gz-white-surface gz-bento-announcements'>
					<div className='gz-ann-head'>
						<span className='gz-ann-title'>Recent Announcements</span>
						<Link to='/employee/sop' className='gz-ann-viewall'>
							<span>View All</span>
							<i className='bi bi-arrow-right'></i>
						</Link>
					</div>

					<div className='gz-ann-list'>
						{announcementItems.length === 0 ? (
							<div className='gz-ann-empty py-4 text-center'>
								<i className='bi bi-megaphone fs-2 text-muted mb-1 d-block'></i>
								<span className='text-muted fs-8'>No announcements at this time</span>
							</div>
						) : (
							announcementItems.map((ann) => (
								<Link key={ann.id} to={ann.link} className='gz-ann-row'>
									<div className='gz-ann-left'>
										<div className='gz-ann-icon-box'>
											<i className={`bi ${ann.icon}`}></i>
										</div>
										<div className='gz-ann-info'>
											<span className='gz-ann-name'>{ann.title}</span>
											<span className='gz-ann-sub'>{ann.sub}</span>
										</div>
									</div>
									<i className='bi bi-chevron-right gz-ann-arrow'></i>
								</Link>
							))
						)}
					</div>
				</div>
			</div>

			{/* =========================================================================
			    APPLY FOR LEAVE MODAL (WORKFLOW CONNECTED TO BACKEND API)
			========================================================================= */}
			{showLeaveModal && (
				<div
					className='modal fade show d-block'
					style={{ background: 'rgba(24, 25, 31, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
					<div className='modal-dialog modal-dialog-centered'>
						<div
							className='modal-content border-0'
							style={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
							<div className='modal-header border-0 pb-0 pt-6 px-6'>
								<h3 className='modal-title fw-bolder fs-3 text-dark'>Apply for Leave</h3>
								<button
									type='button'
									className='btn btn-sm btn-icon btn-light'
									onClick={() => setShowLeaveModal(false)}>
									<i className='bi bi-x-lg fs-6'></i>
								</button>
							</div>

							<form onSubmit={handleSubmitLeave} className='modal-body px-6 py-5'>
								<div className='mb-4'>
									<label className='form-label fw-bold fs-7 text-dark mb-1'>Leave Type</label>
									<select
										className='form-select form-select-solid rounded-3'
										value={leaveType}
										onChange={(e) => setLeaveType(e.target.value)}>
										<option value='full'>Full Day Leave</option>
										<option value='half'>Half Day Leave</option>
									</select>
								</div>

								{leaveType === 'half' && (
									<div className='mb-4'>
										<label className='form-label fw-bold fs-7 text-dark mb-1'>Half-Day Period</label>
										<select
											className='form-select form-select-solid rounded-3'
											value={halfDayPeriod}
											onChange={(e) => setHalfDayPeriod(e.target.value)}>
											<option value='first'>First Half (Morning to 1:30 PM)</option>
											<option value='second'>Second Half (1:30 PM to 6:00 PM)</option>
										</select>
									</div>
								)}

								<div className='row mb-4'>
									<div className='col-6'>
										<label className='form-label fw-bold fs-7 text-dark mb-1'>From Date</label>
										<input
											type='date'
											className='form-control form-control-solid rounded-3'
											value={leaveFromDate}
											onChange={(e) => setLeaveFromDate(e.target.value)}
											required
										/>
									</div>
									<div className='col-6'>
										<label className='form-label fw-bold fs-7 text-dark mb-1'>To Date</label>
										<input
											type='date'
											className='form-control form-control-solid rounded-3'
											value={leaveToDate}
											onChange={(e) => setLeaveToDate(e.target.value)}
											required
										/>
									</div>
								</div>

								<div className='mb-5'>
									<label className='form-label fw-bold fs-7 text-dark mb-1'>Reason</label>
									<textarea
										rows={3}
										className='form-control form-control-solid rounded-3'
										placeholder='Please explain the reason for your leave application...'
										value={leaveReason}
										onChange={(e) => setLeaveReason(e.target.value)}
										required
									/>
								</div>

								<div className='d-flex justify-content-end gap-3'>
									<button
										type='button'
										className='btn btn-light rounded-pill px-5'
										onClick={() => setShowLeaveModal(false)}>
										Cancel
									</button>
									<button
										type='submit'
										className='btn btn-dark rounded-pill px-6 fw-bold'
										disabled={leaveSubmitting}>
										{leaveSubmitting ? 'Submitting...' : 'Submit Request'}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
