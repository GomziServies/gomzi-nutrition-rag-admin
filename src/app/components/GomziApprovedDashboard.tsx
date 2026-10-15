import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { DayJS } from '../../_metronic/helpers/Utils'
import NumberTicker, { formatCurrencyCompact } from './NumberTicker'
import { GetTask, ActionTask, UpdateTask } from '../Functions/FGGroup/TaskManagement'
import { GetDailyReporting } from '../Functions/FGGroup/DailyTaskReporting'
import { GetEmployeeLeaves } from '../Functions/FGGroup/EmployeeLeaveManagement'
import { GetExpenseReports } from '../Functions/FGGroup/ExpenseReport'
import { GetTarget } from '../Functions/FGGroup/Target'

export const GomziApprovedDashboard: React.FC = () => {
	const [loading, setLoading] = useState(false)

	// User Info
	const [userName, setUserName] = useState<string>('Employee')
	const [userId, setUserId] = useState<string>('')
	const [userPosition, setUserPosition] = useState<string>('Staff Member')
	const [userBranch, setUserBranch] = useState<string>('')
	const [isSales, setIsSales] = useState<boolean>(false)
	const [isManager, setIsManager] = useState<boolean>(false)

	// Real Employee Data Collections
	const [assignedTasks, setAssignedTasks] = useState<any[]>([])
	const [dailyReports, setDailyReports] = useState<any[]>([])
	const [leaveRequests, setLeaveRequests] = useState<any[]>([])
	const [expenseReports, setExpenseReports] = useState<any[]>([])
	const [targets, setTargets] = useState<any[]>([])
	const [focusTasks, setFocusTasks] = useState<any[]>([])

	// Compliance & Summary metrics
	const [hasSubmittedReportToday, setHasSubmittedReportToday] = useState<boolean>(false)
	const [reportsThisWeek, setReportsThisWeek] = useState<number>(0)
	const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all')

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
			let targetsList: any[] = []

			// 1. Fetch Assigned Tasks
			if (resolvedUserId) {
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
				} catch (e) {}

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
				} catch (e) {}

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
				} catch (e) {}
			}

			// 4. Fetch Leave Requests
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
			} catch (e) {}

			// 5. Fetch Targets
			try {
				const targetRes: any = await GetTarget({ page: 1, limit: 5 })
				if (targetRes?.data && Array.isArray(targetRes.data)) {
					targetsList = targetRes.data
					setTargets(targetsList)
				}
			} catch (e) {}

			// Check today's daily report submission
			const submittedToday = reportsList.some((r: any) =>
				DayJS(r.createdAt || r.date).isSame(DayJS(), 'day')
			)
			setHasSubmittedReportToday(submittedToday)

			// Count weekly reports
			const weeklyCount = reportsList.filter((r: any) =>
				DayJS(r.createdAt || r.date).isAfter(DayJS().subtract(7, 'day'))
			).length
			setReportsThisWeek(weeklyCount)

			// Build Focus Tasks Checklist
			const compiled: any[] = []

			// Item 1: Daily report item
			compiled.push({
				id: 'daily-report-task',
				task_id: null,
				isDailyReport: true,
				title: submittedToday
					? 'Daily report submitted for today'
					: 'Submit today’s daily activity report',
				category: 'Daily Report',
				link: '/employee/daily-report',
				tag: submittedToday ? 'Completed' : 'Today',
				tagType: submittedToday ? 'normal' : 'urgent',
				completed: submittedToday,
			})

			// Items 2+: Real tasks
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
					isDailyReport: false,
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
		if (taskItem.isDailyReport) {
			if (taskItem.completed) {
				toast.success('Daily report already submitted for today')
			} else {
				toast('Please submit your activity report on the daily report page', { icon: '📝' })
			}
			return
		}

		const newCompleted = !taskItem.completed
		const newStatus = newCompleted ? 'COMPLETED' : 'PENDING'

		// Optimistic UI update
		setFocusTasks((prev) =>
			prev.map((t) => (t.id === taskItem.id ? { ...t, completed: newCompleted } : t))
		)

		if (taskItem.task_id) {
			try {
				await ActionTask({
					task_id: taskItem.task_id,
					status: newStatus,
				})
				toast.success(newCompleted ? 'Task marked as completed' : 'Task marked as pending')
				loadDashboardData()
			} catch (e) {
				try {
					await UpdateTask({
						task_id: taskItem.task_id,
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

	const currentDayStamp = DayJS().format('ddd, MMM DD, YYYY').toUpperCase()

	// Metrics derived from real employee state
	const pendingTasksCount = assignedTasks.filter(
		(t) =>
			t.status !== 'COMPLETED' &&
			t.status !== 'DONE' &&
			t.employee_status !== 'DONE' &&
			t.employee_status !== 'COMPLETED'
	).length
	const completedTasksCount = assignedTasks.length - pendingTasksCount
	const taskCompletionPct =
		assignedTasks.length > 0
			? Math.round((completedTasksCount / assignedTasks.length) * 100)
			: 100

	const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'PENDING').length
	const totalExpenseClaimed = expenseReports.reduce((acc, r) => acc + (r.total_amount || 0), 0)

	// Focus tasks filtered
	const completedFocusCount = focusTasks.filter((t) => t.completed).length
	const focusProgressPct =
		focusTasks.length > 0
			? Math.round((completedFocusCount / focusTasks.length) * 100)
			: 100
	const displayedFocusTasks = focusTasks.filter((t) => {
		if (taskFilter === 'pending') return !t.completed
		if (taskFilter === 'completed') return t.completed
		return true
	})

	return (
		<div className='gz-modern-emp-dash'>
			{/* =========================================================================
			    1. WORKSPACE HEADER: GREETING & COMMAND ACTIONS BAR
			========================================================================= */}
			<div className='gz-dash-header'>
				<div className='row align-items-center justify-content-between g-3'>
					<div className='col-12 col-lg-7'>
						<div className='d-flex align-items-center gap-2 mb-2'>
							<span
								style={{
									width: '8px',
									height: '8px',
									borderRadius: '50%',
									background: '#10B981',
									boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.15)',
								}}
							/>
							<span className='fs-8 fw-bold text-uppercase text-muted' style={{ letterSpacing: '0.06em' }}>
								GOMZI OS &bull; {currentDayStamp}
							</span>
							<span className='badge bg-light text-muted border px-2 py-0 fs-9 fw-semibold'>
								Active Session
							</span>
						</div>
						<h1 className='fs-2x fw-bolder text-gray-900 mb-1' style={{ letterSpacing: '-0.02em' }}>
							Welcome back, {userName}
						</h1>
						<p className='text-muted fs-7 mb-0'>
							{userPosition ? `${userPosition} ${userBranch ? `(${userBranch})` : ''} &bull; ` : ''}
							Real-time overview of daily work reporting, assigned deliverables, and workspace tools.
						</p>
					</div>

					<div className='col-12 col-lg-5 d-flex align-items-center justify-content-lg-end gap-2 flex-wrap'>
						<Link
							to='/employee/daily-report'
							className='btn btn-sm text-white fw-semibold d-inline-flex align-items-center gap-2 px-3'
							style={{ background: '#0F172A', borderRadius: '10px' }}>
							<i className='bi bi-file-earmark-plus fs-7'></i>
							<span>Log Daily Report</span>
						</Link>
						<Link
							to='/employee/task'
							className='btn btn-sm btn-light border text-gray-800 fw-semibold d-inline-flex align-items-center gap-2 px-3'
							style={{ borderRadius: '10px' }}>
							<i className='bi bi-check2-square fs-7 text-primary'></i>
							<span>My Tasks</span>
						</Link>
						<Link
							to='/employee/leave-manager'
							className='btn btn-sm btn-light border text-gray-800 fw-semibold d-inline-flex align-items-center gap-2 px-3'
							style={{ borderRadius: '10px' }}>
							<i className='bi bi-calendar-plus fs-7 text-success'></i>
							<span>Request Leave</span>
						</Link>
						<Link
							to='/employee/expenses-list'
							className='btn btn-sm btn-light border text-gray-800 fw-semibold d-inline-flex align-items-center gap-2 px-3'
							style={{ borderRadius: '10px' }}>
							<i className='bi bi-receipt fs-7 text-warning'></i>
							<span>File Expense</span>
						</Link>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    2. 5 MINIMAL KPI METRIC CARDS (Linear-Style Metric Strip)
			========================================================================= */}
			<div className='row g-3 mb-4'>
				{/* 1. Daily Report */}
				<div className='col-12 col-sm-6 col-xl'>
					<Link to='/employee/daily-report' className='text-decoration-none'>
						<div className='gz-modern-kpi-card'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<span className='fs-8 fw-bold text-uppercase text-muted' style={{ letterSpacing: '0.05em' }}>
									Daily Report
								</span>
								<div
									className='d-flex align-items-center justify-content-center rounded-2'
									style={{ width: '30px', height: '30px', background: '#EFF6FF', color: '#2563EB' }}>
									<i className='bi bi-file-earmark-check fs-6'></i>
								</div>
							</div>
							<div className='mb-2'>
								{hasSubmittedReportToday ? (
									<div className='d-flex align-items-center gap-2 text-success fw-bolder fs-4'>
										<i className='bi bi-check-circle-fill fs-5'></i>
										<span>Logged Today</span>
									</div>
								) : (
									<div className='d-flex align-items-center gap-2 text-warning fw-bolder fs-4'>
										<i className='bi bi-clock-history fs-5'></i>
										<span>Needs Entry</span>
									</div>
								)}
							</div>
							<div className='d-flex align-items-center justify-content-between pt-2 border-top fs-9 text-muted'>
								<span className={hasSubmittedReportToday ? 'text-success fw-semibold' : 'text-warning fw-semibold'}>
									{hasSubmittedReportToday ? '● Completed' : '○ Action Required'}
								</span>
								<span>{reportsThisWeek}/7 this week</span>
							</div>
						</div>
					</Link>
				</div>

				{/* 2. Active Tasks */}
				<div className='col-12 col-sm-6 col-xl'>
					<Link to='/employee/task' className='text-decoration-none'>
						<div className='gz-modern-kpi-card'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<span className='fs-8 fw-bold text-uppercase text-muted' style={{ letterSpacing: '0.05em' }}>
									Assigned Tasks
								</span>
								<div
									className='d-flex align-items-center justify-content-center rounded-2'
									style={{ width: '30px', height: '30px', background: '#F0FDF4', color: '#16A34A' }}>
									<i className='bi bi-check2-square fs-6'></i>
								</div>
							</div>
							<div className='mb-2'>
								<div className='fs-2x fw-bolder text-gray-900'>
									<NumberTicker value={pendingTasksCount} />
									<span className='fs-7 fw-normal text-muted ms-1'>pending</span>
								</div>
							</div>
							<div className='d-flex align-items-center justify-content-between pt-2 border-top fs-9 text-muted'>
								<span className='badge bg-light-primary text-primary px-2 py-0 fs-9 fw-semibold'>
									{taskCompletionPct}% Done
								</span>
								<span>{completedTasksCount} completed</span>
							</div>
						</div>
					</Link>
				</div>

				{/* 3. Leave Manager */}
				<div className='col-12 col-sm-6 col-xl'>
					<Link to='/employee/leave-manager' className='text-decoration-none'>
						<div className='gz-modern-kpi-card'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<span className='fs-8 fw-bold text-uppercase text-muted' style={{ letterSpacing: '0.05em' }}>
									Leave Manager
								</span>
								<div
									className='d-flex align-items-center justify-content-center rounded-2'
									style={{ width: '30px', height: '30px', background: '#EFF6FF', color: '#2563EB' }}>
									<i className='bi bi-calendar-check fs-6'></i>
								</div>
							</div>
							<div className='mb-2'>
								<div className='fs-2x fw-bolder text-gray-900'>
									<NumberTicker value={leaveRequests.length} />
									<span className='fs-7 fw-normal text-muted ms-1'>logged</span>
								</div>
							</div>
							<div className='d-flex align-items-center justify-content-between pt-2 border-top fs-9 text-muted'>
								<span className={`badge ${pendingLeavesCount > 0 ? 'bg-light-warning text-warning' : 'bg-light text-muted'} px-2 py-0 fs-9 fw-semibold`}>
									{pendingLeavesCount} Pending
								</span>
								<span>time off logged</span>
							</div>
						</div>
					</Link>
				</div>

				{/* 4. Expenses */}
				<div className='col-12 col-sm-6 col-xl'>
					<Link to='/employee/expenses-list' className='text-decoration-none'>
						<div className='gz-modern-kpi-card'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<span className='fs-8 fw-bold text-uppercase text-muted' style={{ letterSpacing: '0.05em' }}>
									My Expenses
								</span>
								<div
									className='d-flex align-items-center justify-content-center rounded-2'
									style={{ width: '30px', height: '30px', background: '#FFFBEB', color: '#D97706' }}>
									<i className='bi bi-receipt fs-6'></i>
								</div>
							</div>
							<div className='mb-2'>
								<div className='fs-2x fw-bolder text-gray-900'>
									<NumberTicker text={formatCurrencyCompact(totalExpenseClaimed)} />
								</div>
							</div>
							<div className='d-flex align-items-center justify-content-between pt-2 border-top fs-9 text-muted'>
								<span className='badge bg-light text-gray-700 border px-2 py-0 fs-9'>
									{expenseReports.length} Vouchers
								</span>
								<span>reimbursements</span>
							</div>
						</div>
					</Link>
				</div>

				{/* 5. Targets & Pacing */}
				<div className='col-12 col-sm-6 col-xl'>
					<Link to='/employee/target' className='text-decoration-none'>
						<div className='gz-modern-kpi-card'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<span className='fs-8 fw-bold text-uppercase text-muted' style={{ letterSpacing: '0.05em' }}>
									Targets &amp; SOP
								</span>
								<div
									className='d-flex align-items-center justify-content-center rounded-2'
									style={{ width: '30px', height: '30px', background: '#F1F5F9', color: '#475569' }}>
									<i className='bi bi-bullseye fs-6'></i>
								</div>
							</div>
							<div className='mb-2'>
								<div className='fs-2x fw-bolder text-gray-900'>
									<NumberTicker value={targets.length || 1} />
									<span className='fs-7 fw-normal text-muted ms-1'>active</span>
								</div>
							</div>
							<div className='d-flex align-items-center justify-content-between pt-2 border-top fs-9 text-muted'>
								<span className='badge bg-light-success text-success px-2 py-0 fs-9 fw-semibold'>
									● On Track
								</span>
								<span>quarterly pacing</span>
							</div>
						</div>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    3. MAIN CONTENT: 2-COLUMN MODERN SPLIT (8-COL / 4-COL)
			========================================================================= */}
			<div className='row g-4 mb-4 align-items-stretch'>
				{/* LEFT: Today's Focus Action Stream (8-col) */}
				<div className='col-12 col-xl-8 d-flex flex-column gap-4'>
					{/* Action Stream / Today's Focus */}
					<div className='gz-modern-card p-4'>
						<div className='d-flex flex-wrap align-items-center justify-content-between pb-3 mb-3 border-bottom gap-2'>
							<div>
								<div className='d-flex align-items-center gap-2'>
									<h2 className='fs-5 fw-bold text-gray-900 mb-0'>Today&apos;s Priority Focus</h2>
									<span className='badge bg-light-primary text-primary px-2 py-0 fs-9 fw-bold'>
										{completedFocusCount}/{focusTasks.length} Done
									</span>
								</div>
								<span className='text-muted fs-8 mt-1 d-block'>
									Interactive daily checklist of priority deliverables and reporting milestones
								</span>
							</div>

							{/* Segmented Filter Pills */}
							<div className='d-flex align-items-center gap-1 bg-light p-1 rounded-2'>
								{(['all', 'pending', 'completed'] as const).map((filter) => (
									<button
										key={filter}
										type='button'
										onClick={() => setTaskFilter(filter)}
										className={`btn btn-sm py-1 px-3 text-capitalize fs-8 ${
											taskFilter === filter
												? 'bg-white text-gray-900 shadow-sm fw-bold border-0'
												: 'text-muted border-0 bg-transparent'
										}`}
										style={{ borderRadius: '6px' }}>
										{filter}
									</button>
								))}
							</div>
						</div>

						{/* Task List */}
						<div className='d-flex flex-column gap-2 mb-3'>
							{displayedFocusTasks.length > 0 ? (
								displayedFocusTasks.map((t) => (
									<div
										key={t.id}
										className='d-flex align-items-center justify-content-between p-3 rounded-2 hover-bg-light transition-all'
										style={{
											border: '1px solid #f1f5f9',
											background: t.completed ? '#f8fafc' : '#ffffff',
										}}>
										<div className='d-flex align-items-center gap-3 flex-grow-1 me-3'>
											<input
												type='checkbox'
												className='form-check-input cursor-pointer'
												style={{ width: '18px', height: '18px', borderRadius: '4px' }}
												checked={t.completed}
												onChange={() => toggleTask(t)}
											/>
											<div className='d-flex flex-column'>
												<Link
													to={t.link}
													className={`fs-7 fw-bold text-decoration-none ${
														t.completed
															? 'text-muted text-decoration-line-through'
															: 'text-gray-900 hover-primary'
													}`}>
													{t.title}
												</Link>
												<span className='text-muted fs-9 mt-0.5'>{t.category}</span>
											</div>
										</div>

										<span
											className={`badge px-2 py-1 fs-9 fw-semibold ${
												t.completed
													? 'bg-light text-muted'
													: t.tagType === 'urgent'
													? 'bg-light-danger text-danger border border-danger-subtle'
													: 'bg-light text-gray-700 border'
											}`}>
											{t.tag}
										</span>
									</div>
								))
							) : (
								<div className='d-flex flex-column align-items-center justify-content-center text-muted py-5 fs-8'>
									<i className='bi bi-check2-circle fs-2 text-success mb-2'></i>
									<span className='fw-semibold text-gray-700'>
										{taskFilter === 'all'
											? 'All caught up! No tasks pending.'
											: 'No tasks matching this filter.'}
									</span>
								</div>
							)}
						</div>

						{/* Progress Bar Footer */}
						<div className='pt-3 mt-auto border-top d-flex align-items-center justify-content-between gap-3'>
							<div className='d-flex align-items-center gap-2'>
								<span className='text-muted fs-8'>Daily Completion:</span>
								<span className='fw-bold fs-8 text-primary'>{focusProgressPct}%</span>
							</div>
							<div
								className='progress flex-grow-1'
								style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '10px', maxWidth: '280px' }}>
								<div
									className='progress-bar bg-primary'
									style={{
										width: `${focusProgressPct}%`,
										borderRadius: '10px',
										transition: 'width 0.3s ease',
									}}
								/>
							</div>
						</div>
					</div>

					{/* Recent Activity Table Ledger */}
					<div className='gz-modern-card p-4'>
						<div className='d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom'>
							<div>
								<h2 className='fs-5 fw-bold text-gray-900 mb-0'>Recent Operational Logs</h2>
								<span className='text-muted fs-8 mt-1 d-block'>
									Central audit trail of reports, time-off requests, and deliverables
								</span>
							</div>
							<Link
								to='/employee/daily-report'
								className='btn btn-sm btn-link p-0 text-muted fs-8 text-decoration-none'>
								All Logs &rarr;
							</Link>
						</div>

						<div className='table-responsive'>
							<table className='table table-borderless align-middle mb-0 fs-8'>
								<thead>
									<tr className='text-muted fs-9 fw-semibold border-bottom'>
										<th style={{ width: '80px' }}>TYPE</th>
										<th>TITLE / DETAILS</th>
										<th>MODULE</th>
										<th className='text-center'>STATUS</th>
										<th className='text-center'>DATE</th>
										<th style={{ width: '32px' }}></th>
									</tr>
								</thead>
								<tbody>
									{/* Daily Reports */}
									{dailyReports.slice(0, 3).map((r, idx) => (
										<tr key={`rep-${r._id || idx}`} className='border-bottom'>
											<td>
												<span className='badge bg-light-primary text-primary px-2 py-0 fs-9'>
													Report
												</span>
											</td>
											<td className='fw-bold text-gray-900 text-truncate' style={{ maxWidth: '220px' }}>
												{r.task_title || 'Daily Activity Report'}
											</td>
											<td className='text-muted'>Daily Reporting</td>
											<td className='text-center'>
												<span className='badge bg-light-success text-success px-2 py-0 fs-9'>
													● Logged
												</span>
											</td>
											<td className='text-muted text-center'>
												{DayJS(r.createdAt || r.date).format('DD MMM')}
											</td>
											<td className='text-end'>
												<Link to='/employee/daily-report' className='text-gray-400 text-hover-primary'>
													<i className='bi bi-chevron-right fs-9'></i>
												</Link>
											</td>
										</tr>
									))}

									{/* Leave Requests */}
									{leaveRequests.slice(0, 2).map((l, idx) => {
										const isApproved = l.status === 'APPROVED'
										const isPending = l.status === 'PENDING'
										return (
											<tr key={`leave-${l._id || idx}`} className='border-bottom'>
												<td>
													<span className='badge bg-light-success text-success px-2 py-0 fs-9'>
														Leave
													</span>
												</td>
												<td className='fw-bold text-gray-900 text-truncate' style={{ maxWidth: '220px' }}>
													{l.reason || 'Leave Application'}
												</td>
												<td className='text-muted'>Leave Manager</td>
												<td className='text-center'>
													<span
														className={`badge ${
															isApproved
																? 'bg-light-success text-success'
																: isPending
																? 'bg-light-warning text-warning'
																: 'bg-light-danger text-danger'
														} px-2 py-0 fs-9`}>
														● {l.status || 'Pending'}
													</span>
												</td>
												<td className='text-muted text-center'>
													{DayJS(l.from_date || l.createdAt).format('DD MMM')}
												</td>
												<td className='text-end'>
													<Link to='/employee/leave-manager' className='text-gray-400 text-hover-primary'>
														<i className='bi bi-chevron-right fs-9'></i>
													</Link>
												</td>
											</tr>
										)
									})}

									{/* Assigned Tasks */}
									{assignedTasks.slice(0, 2).map((t, idx) => {
										const isDone = t.status === 'COMPLETED' || t.status === 'DONE'
										return (
											<tr key={`task-${t._id || idx}`} className='border-bottom'>
												<td>
													<span className='badge bg-light-info text-info px-2 py-0 fs-9'>
														Task
													</span>
												</td>
												<td className='fw-bold text-gray-900 text-truncate' style={{ maxWidth: '220px' }}>
													{t.task_title || 'Assigned Task'}
												</td>
												<td className='text-muted'>Task Board</td>
												<td className='text-center'>
													<span className={`badge ${isDone ? 'bg-light-success text-success' : 'bg-light-primary text-primary'} px-2 py-0 fs-9`}>
														● {isDone ? 'Done' : 'Active'}
													</span>
												</td>
												<td className='text-muted text-center'>
													{DayJS(t.createdAt).format('DD MMM')}
												</td>
												<td className='text-end'>
													<Link to={`/employee/task-view?task_id=${t._id}`} className='text-gray-400 text-hover-primary'>
														<i className='bi bi-chevron-right fs-9'></i>
													</Link>
												</td>
											</tr>
										)
									})}

									{dailyReports.length === 0 && leaveRequests.length === 0 && assignedTasks.length === 0 && (
										<tr>
											<td colSpan={6} className='text-center py-4 text-muted fs-8'>
												No recent operational logs recorded yet
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* RIGHT: Operations Hub & Compliance (4-col) */}
				<div className='col-12 col-xl-4 d-flex flex-column gap-4'>
					{/* 4 Core Module Tiles (2x2 Grid) */}
					<div className='gz-modern-card p-4'>
						<div className='d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom'>
							<div>
								<h2 className='fs-5 fw-bold text-gray-900 mb-0'>Operations Hub</h2>
								<span className='text-muted fs-8 mt-1 d-block'>Direct workspace module shortcuts</span>
							</div>
							<Link to='/employee/report' className='btn btn-sm btn-link p-0 text-muted fs-8 text-decoration-none'>
								Overview &rarr;
							</Link>
						</div>

						<div className='row g-3'>
							{/* Module 1: Daily Reporting */}
							<div className='col-6'>
								<Link to='/employee/daily-report' className='gz-module-tile'>
									<div>
										<div
											className='d-flex align-items-center justify-content-center rounded-2 mb-2'
											style={{ width: '32px', height: '32px', background: '#EFF6FF', color: '#2563EB' }}>
											<i className='bi bi-file-earmark-text fs-6'></i>
										</div>
										<div className='fw-bold text-gray-900 fs-7'>Daily Report</div>
										<div className='text-muted fs-9 mt-0.5'>
											{hasSubmittedReportToday ? 'Logged' : 'Pending'}
										</div>
									</div>
									<span className='text-primary fs-9 fw-semibold mt-2'>Open &rarr;</span>
								</Link>
							</div>

							{/* Module 2: Tasks */}
							<div className='col-6'>
								<Link to='/employee/task' className='gz-module-tile'>
									<div>
										<div
											className='d-flex align-items-center justify-content-center rounded-2 mb-2'
											style={{ width: '32px', height: '32px', background: '#F0FDF4', color: '#16A34A' }}>
											<i className='bi bi-list-check fs-6'></i>
										</div>
										<div className='fw-bold text-gray-900 fs-7'>Task Board</div>
										<div className='text-muted fs-9 mt-0.5'>
											{pendingTasksCount} Pending
										</div>
									</div>
									<span className='text-primary fs-9 fw-semibold mt-2'>Open &rarr;</span>
								</Link>
							</div>

							{/* Module 3: Leaves */}
							<div className='col-6'>
								<Link to='/employee/leave-manager' className='gz-module-tile'>
									<div>
										<div
											className='d-flex align-items-center justify-content-center rounded-2 mb-2'
											style={{ width: '32px', height: '32px', background: '#EFF6FF', color: '#2563EB' }}>
											<i className='bi bi-calendar-check fs-6'></i>
										</div>
										<div className='fw-bold text-gray-900 fs-7'>Leaves</div>
										<div className='text-muted fs-9 mt-0.5'>
											{leaveRequests.length} Logged
										</div>
									</div>
									<span className='text-primary fs-9 fw-semibold mt-2'>Open &rarr;</span>
								</Link>
							</div>

							{/* Module 4: Expenses */}
							<div className='col-6'>
								<Link to='/employee/expenses-list' className='gz-module-tile'>
									<div>
										<div
											className='d-flex align-items-center justify-content-center rounded-2 mb-2'
											style={{ width: '32px', height: '32px', background: '#FFFBEB', color: '#D97706' }}>
											<i className='bi bi-receipt fs-6'></i>
										</div>
										<div className='fw-bold text-gray-900 fs-7'>Expenses</div>
										<div className='text-muted fs-9 mt-0.5'>
											{expenseReports.length} Claims
										</div>
									</div>
									<span className='text-primary fs-9 fw-semibold mt-2'>Open &rarr;</span>
								</Link>
							</div>
						</div>
					</div>

					{/* Compliance & Benchmarks Card */}
					<div className='gz-modern-card p-4'>
						<div className='d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom'>
							<div>
								<h2 className='fs-5 fw-bold text-gray-900 mb-0'>Compliance &amp; Goals</h2>
								<span className='text-muted fs-8 mt-1 d-block'>Pacing against monthly benchmarks</span>
							</div>
							<Link to='/employee/target' className='btn btn-sm btn-link p-0 text-muted fs-8 text-decoration-none'>
								Targets &rarr;
							</Link>
						</div>

						<div className='d-flex flex-column gap-3'>
							{/* Weekly Report Submission */}
							{(() => {
								const reportPct = Math.min(100, Math.round((reportsThisWeek / 7) * 100))
								return (
									<div>
										<div className='d-flex align-items-center justify-content-between mb-1 fs-8'>
											<span className='text-gray-700 fw-semibold'>Weekly Reporting</span>
											<span className='text-gray-900 fw-bold'>{reportsThisWeek} / 7 Days ({reportPct}%)</span>
										</div>
										<div className='progress' style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '10px' }}>
											<div className='progress-bar bg-success' style={{ width: `${reportPct}%`, borderRadius: '10px' }} />
										</div>
									</div>
								)
							})()}

							{/* Task Velocity */}
							<div>
								<div className='d-flex align-items-center justify-content-between mb-1 fs-8'>
									<span className='text-gray-700 fw-semibold'>Task Completion Velocity</span>
									<span className='text-gray-900 fw-bold'>{taskCompletionPct}%</span>
								</div>
								<div className='progress' style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '10px' }}>
									<div className='progress-bar bg-primary' style={{ width: `${taskCompletionPct}%`, borderRadius: '10px' }} />
								</div>
							</div>

							{/* Active Target */}
							<div>
								<div className='d-flex align-items-center justify-content-between mb-1 fs-8'>
									<span className='text-gray-700 fw-semibold'>Quarterly Milestone</span>
									<span className='badge bg-light-success text-success px-2 py-0 fs-9'>On Track</span>
								</div>
								<span className='text-muted fs-9 d-block'>
									{targets.length > 0 && targets[0]?.target_title ? targets[0].target_title : 'Consistent Delivery Target'}
								</span>
							</div>
						</div>
					</div>

					{/* Workspace Shortcuts Card */}
					<div className='gz-modern-card p-4'>
						<h2 className='fs-6 fw-bold text-gray-900 mb-2'>Workspace Shortcuts</h2>
						<div className='d-flex align-items-center gap-2 flex-wrap'>
							<Link to='/employee/document' className='gz-shortcut-pill'>
								<i className='bi bi-folder2-open text-primary'></i>
								<span>Documents</span>
							</Link>
							<Link to='/employee/sop' className='gz-shortcut-pill'>
								<i className='bi bi-journal-text text-info'></i>
								<span>SOP</span>
							</Link>
							<Link to='/employee/target' className='gz-shortcut-pill'>
								<i className='bi bi-bullseye text-danger'></i>
								<span>Targets</span>
							</Link>
							<Link to='/employee/employee-chat' className='gz-shortcut-pill'>
								<i className='bi bi-chat-dots text-success'></i>
								<span>Chat</span>
							</Link>
							{isSales && (
								<Link to='/employee/transactions' className='gz-shortcut-pill'>
									<i className='bi bi-wallet text-primary'></i>
									<span>Wallet</span>
								</Link>
							)}
							{isManager && (
								<Link to='/employee/manager-details-view' className='gz-shortcut-pill'>
									<i className='bi bi-people text-primary'></i>
									<span>Team</span>
								</Link>
							)}
						</div>

						<div className='pt-3 mt-3 border-top d-flex align-items-center justify-content-between fs-9 text-muted'>
							<span>Emp ID: {userId ? userId.slice(-8).toUpperCase() : 'EMP-2026'}</span>
							<span className='text-success fw-semibold'>
								<i className='bi bi-shield-check me-1'></i> Verified Active
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
