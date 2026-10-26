import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import duration from 'dayjs/plugin/duration'
import { PageTitle } from '../../../../_metronic/layout/core'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { GetEmployeeLeaves } from '../../../Functions/FGGroup/EmployeeLeaveManagement'
import { GetTask } from '../../../Functions/FGGroup/TaskManagement'
import { GetJobPlacement } from '../../../Functions/FGGroup/Jobs'
import { EmployeeAnniversaryTable } from './EmployeeAnniversaryTable'
import { ExpiredEmployeeTable } from './ExpiredEmployeeTable'
import { TablesWidget } from './TablesWidget'
import './dashboard-hr.css'

DayJS.extend(duration)

const calculateLeaveDuration = (from_date?: string, to_date?: string) => {
	if (!from_date || !to_date) return '—'
	const fromDate = DayJS(from_date)
	let toDate = DayJS(to_date)

	const diff = DayJS.duration(toDate.diff(fromDate))
	let days = diff.days()
	const hours = diff.hours()
	const minutes = diff.minutes()

	if (toDate.format('HH:mm') === '00:00') {
		days += 1
	}

	if (days === 0 && hours === 0 && minutes === 0) {
		return '0 hours'
	} else if (days === 0) {
		return `${hours}:${minutes < 10 ? '0' + minutes : minutes} hrs`
	} else if (hours === 0 && minutes === 0) {
		return `${days} day${days !== 1 ? 's' : ''}`
	} else {
		return `${days} day${days !== 1 ? 's' : ''} ${hours}:${minutes < 10 ? '0' + minutes : minutes} hrs`
	}
}

const getLeaveEmployeeName = (l: any) => {
	if (l?.admin_id && typeof l.admin_id === 'object' && l.admin_id.full_name) {
		return l.admin_id.full_name
	}
	if (l?.employee?.full_name) {
		return l.employee.full_name
	}
	return 'Team Member'
}

export const HRDashboardPage: React.FC = () => {
	const [loading, setLoading] = useState(true)

	// Section 1: 8 KPI Metric Counts
	const [totalEmployees, setTotalEmployees] = useState(0)
	const [activeEmployees, setActiveEmployees] = useState(0)
	const [inactiveEmployees, setInactiveEmployees] = useState(0)
	const [onLeaveTodayCount, setOnLeaveTodayCount] = useState(0)
	const [kpiTasksCount, setKpiTasksCount] = useState(0)
	const [p1TasksCount, setP1TasksCount] = useState(0)
	const [careersCount, setCareersCount] = useState(0)
	const [overdueTasksCount, setOverdueTasksCount] = useState(0)

	// Section 2: Team Birthday Celebrations
	const [todayBirthdays, setTodayBirthdays] = useState<any[]>([])
	const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([])
	const [birthdayTab, setBirthdayTab] = useState<'all' | 'today' | 'upcoming'>('all')

	// Section 3: Team Leave Status
	const [todayLeaves, setTodayLeaves] = useState<any[]>([])
	const [upcomingLeaves, setUpcomingLeaves] = useState<any[]>([])
	const [pendingLeaves, setPendingLeaves] = useState<any[]>([])
	const [pendingLeavesCount, setPendingLeavesCount] = useState(0)
	const [leaveTab, setLeaveTab] = useState<'all' | 'today' | 'upcoming' | 'pending'>('all')

	// Section 4: Memo Watchlist
	const [memoList, setMemoList] = useState<any[]>([])

	// Detail tables toggle if needed
	const [showFullTables, setShowFullTables] = useState(false)

	// Scope state: default to 'rag'
	const [dataScope, setDataScope] = useState<'rag' | 'all'>('rag')

	const loadDashboardData = async (scopeOverride?: 'rag' | 'all') => {
		const currentScope = scopeOverride || dataScope
		setLoading(true)
		try {
			const today = new Date()
			const todayStr = DayJS().format('YYYY-MM-DD')

			// Helper to check if an employee belongs to RAG (Gomzi Nutrition / RAG)
			const isRagEmployee = (item: any) => {
				const branch = (item.employee?.branch_name || item.branch_name || '').toLowerCase()
				if (branch.includes('gomzi') || branch.includes('rag') || branch.includes('nutrition')) {
					return true
				}
				const authorities = item.employee?.authorities || item.authorities || []
				if (Array.isArray(authorities)) {
					const hasRagPanel = authorities.some((a: any) => {
						const pName = (a.panel_id?.name || a.panel_name || a.name || '').toLowerCase()
						return pName.includes('gomzi') || pName.includes('rag')
					})
					if (hasRagPanel) return true
				}
				const email = (item.email || '').toLowerCase()
				if (email.includes('rag') || email.includes('gomzi') || email.includes('nutrition')) {
					return true
				}
				return false
			}

			// 1. Fetch Employees (aligned with /hr/employee-detail)
			let ragAdminIds = new Set<string>()
			const empRes: any = await GetEmployees({ limit: 1000 })
			if (empRes?.data && Array.isArray(empRes.data)) {
				const rawEmps = empRes.data
				rawEmps.forEach((e: any) => {
					if (isRagEmployee(e) && e._id) {
						ragAdminIds.add(e._id.toString())
					}
				})

				const emps = currentScope === 'rag' ? rawEmps.filter(isRagEmployee) : rawEmps
				const totalCount = emps.length
				setTotalEmployees(totalCount)

				const active = emps.filter(
					(e: any) => e.status === 'Active' || e.is_active === true || e.employee?.status === 'Active'
				).length
				const inactive = totalCount >= active ? totalCount - active : 0
				setActiveEmployees(active)
				setInactiveEmployees(inactive)

				// Calculate Birthdays
				const todayBdays: any[] = []
				const upBdays: any[] = []

				emps.forEach((item: any) => {
					const rawDob = item.employee?.dob || item.employee?.date_of_birth || item.dob
					if (rawDob) {
						const bdate = new Date(rawDob)
						const bdayThisYear = new Date(today.getFullYear(), bdate.getMonth(), bdate.getDate())
						const isToday =
							bdayThisYear.getDate() === today.getDate() &&
							bdayThisYear.getMonth() === today.getMonth()

						const nextBday =
							bdayThisYear < today
								? new Date(today.getFullYear() + 1, bdate.getMonth(), bdate.getDate())
								: bdayThisYear

						const diffTime = nextBday.getTime() - today.getTime()
						const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

						const bdayObj = {
							_id: item._id,
							name: item.full_name || 'Team Member',
							position: item.employee?.position || 'Team Member',
							photo: item.employee?.photo,
							dateStr: DayJS(nextBday).format('DD MMM'),
							diffDays,
							inDaysStr: `In ${diffDays}d`,
						}

						if (isToday) {
							todayBdays.push(bdayObj)
						} else if (diffDays <= 90 && diffDays > 0) {
							upBdays.push(bdayObj)
						}
					}
				})

				upBdays.sort((a, b) => a.diffDays - b.diffDays)
				setUpcomingBirthdays(upBdays)
				setTodayBirthdays(todayBdays)

				// Extract Memos
				const extractedMemos: any[] = []
				emps.forEach((emp: any) => {
					if (emp.employee?.memo && Array.isArray(emp.employee.memo) && emp.employee.memo.length > 0) {
						extractedMemos.push({
							_id: emp._id,
							name: emp.full_name,
							position: emp.employee?.position || 'Team Member',
							rating: emp.employee?.rating ? `rating ${emp.employee.rating}` : 'Memo Issued',
							count: emp.employee.memo.length,
						})
					}
				})

				setMemoList(extractedMemos)
			}

			// 2. Fetch Leaves (aligned with http://localhost:3000/hr/leave)
			try {
				const leaveRes: any = await GetEmployeeLeaves({ limit: 1000 })
				if (leaveRes?.data && Array.isArray(leaveRes.data)) {
					const rawLeaves = leaveRes.data
					const getLeaveAdminId = (l: any) => {
						if (!l.admin_id) return ''
						if (typeof l.admin_id === 'object' && l.admin_id._id) {
							return l.admin_id._id.toString()
						}
						return l.admin_id.toString()
					}

					const allLeaves =
						currentScope === 'rag'
							? rawLeaves.filter((l: any) => {
								const admId = getLeaveAdminId(l)
								return admId && ragAdminIds.has(admId)
							})
							: rawLeaves

					const pending = allLeaves.filter(
						(l: any) => (l.status || '').toUpperCase() === 'PENDING'
					)
					setPendingLeavesCount(pending.length)
					setPendingLeaves(pending)

					const approvedToday = allLeaves.filter((l: any) => {
						if ((l.status || '').toUpperCase() !== 'APPROVED') return false
						const from = DayJS(l.from_date).format('YYYY-MM-DD')
						const to = DayJS(l.to_date || l.from_date).format('YYYY-MM-DD')
						return todayStr >= from && todayStr <= to
					})
					setOnLeaveTodayCount(approvedToday.length)
					setTodayLeaves(approvedToday)

					const upcoming = allLeaves.filter((l: any) => {
						if ((l.status || '').toUpperCase() !== 'APPROVED') return false
						const from = DayJS(l.from_date).format('YYYY-MM-DD')
						return from > todayStr
					})
					setUpcomingLeaves(upcoming)
				}
			} catch (e) {
				console.error('Error fetching leaves from /hr/leave source:', e)
			}

			// 3. Fetch Tasks (filtered strictly to RAG data)
			try {
				const taskRes: any = await GetTask({ limit: 1000 })
				if (taskRes?.data && Array.isArray(taskRes.data)) {
					const rawTasks = taskRes.data

					// Helper to check if task is RAG related
					const isRagTask = (task: any) => {
						if (task.admin_id && ragAdminIds.has(task.admin_id.toString())) {
							return true
						}
						const title = (task.task_title || '').toLowerCase()
						const remark = (task.remark_by_hr || task.remark_by_employee || '').toLowerCase()
						const text = `${title} ${remark}`
						return (
							text.includes('rag') ||
							text.includes('gomzi') ||
							text.includes('gn ') ||
							text.includes('gn-') ||
							text.includes('nutrition') ||
							text.includes('supplement') ||
							text.includes('protein') ||
							text.includes('creatine') ||
							text.includes('whey') ||
							text.includes('b2b')
						)
					}

					const allTasks = currentScope === 'rag' ? rawTasks.filter(isRagTask) : rawTasks

					// Priority 1 (Highest): Pending tasks in /hr/task-list
					const p1 = allTasks.filter(
						(t: any) =>
							t.status === 'PENDING' ||
							t.status === 'pending' ||
							t.priority === 'P1' ||
							t.priority === 'High' ||
							t.priority === 1
					).length

					// KPI Tasks: Key Performance Indicator tasks
					const kpi = allTasks.filter(
						(t: any) =>
							t.is_kpi ||
							t.kpi ||
							t.priority === 'KPI' ||
							t.financial_worth ||
							t.social_worth
					).length

					// Overdue Tasks: Pending tasks past deadline
					const overdue = allTasks.filter((t: any) => {
						if (t.status === 'COMPLETED' || t.status === 'DONE' || t.hr_status === 'complete')
							return false
						return t.end_date && DayJS(t.end_date).isBefore(DayJS())
					}).length

					setKpiTasksCount(kpi)
					setP1TasksCount(p1)
					setOverdueTasksCount(overdue)
				}
			} catch (e) {
				console.error('Error fetching tasks from task-list source:', e)
			}

			// 4. Fetch Careers
			try {
				const jobRes: any = await GetJobPlacement({ limit: 100 })
				if (jobRes?.data && Array.isArray(jobRes.data)) {
					const rawJobs = jobRes.data
					const isRagJob = (j: any) => {
						const text = `${j.company_name || ''} ${j.title || ''}`.toLowerCase()
						return text.includes('rag') || text.includes('gomzi') || text.includes('nutrition')
					}
					const allJobs = currentScope === 'rag' ? rawJobs.filter(isRagJob) : rawJobs
					setCareersCount(allJobs.length)
				}
			} catch (e) {
				console.error('Error fetching careers:', e)
			}
		} catch (err) {
			console.error('Failed to load simple HR dashboard data', err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadDashboardData('rag')
	}, [])

	return (
		<div className='gz-hr-simple-dashboard'>
			{/* View Full Tables Toggle Bar if user drilled down */}
			{showFullTables && (
				<div className='d-flex align-items-center justify-content-between mb-4 bg-white p-4 rounded-3 border'>
					<div className='d-flex align-items-center gap-2'>
						<button
							type='button'
							className='btn btn-sm btn-outline-secondary'
							onClick={() => setShowFullTables(false)}>
							&larr; Back to Dashboard
						</button>
						<span className='fw-bold text-dark fs-5 ms-2'>HR Tables Directory</span>
					</div>
				</div>
			)}

			{showFullTables ? (
				<div>
					<EmployeeAnniversaryTable className='card-cl-stretch mb-5' />
					<ExpiredEmployeeTable className='card-cl-stretch mb-5' />
					<TablesWidget className='card-cl-stretch mb-5' />
				</div>
			) : (
				<>
					{/* Scope Banner: Clearly indicating RAG (Gomzi Nutrition) filtering */}
					<div className='d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 p-3 bg-white border rounded-3 shadow-xs'>
						<div className='d-flex align-items-center gap-2'>
							<span className='badge badge-success px-3 py-2 fs-7 fw-bold d-inline-flex align-items-center gap-2'>
								<i className='bi bi-shield-check fs-6'></i>
								<span>Scope: {dataScope === 'rag' ? 'RAG (Gomzi Nutrition) Data' : 'All FG Group Data'}</span>
							</span>
							<span className='text-muted fs-8'>
								{dataScope === 'rag'
									? 'Metrics strictly filtered to Gomzi Nutrition RAG workforce, tasks & operations'
									: 'Showing all group branches, FGIIT, FWG, GLS, and entities'}
							</span>
						</div>
						<div className='btn-group btn-group-sm' role='group'>
							<button
								type='button'
								className={`btn btn-sm ${dataScope === 'rag' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
								onClick={() => {
									setDataScope('rag')
									loadDashboardData('rag')
								}}>
								RAG Data Only
							</button>
							<button
								type='button'
								className={`btn btn-sm ${dataScope === 'all' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
								onClick={() => {
									setDataScope('all')
									loadDashboardData('all')
								}}>
								All Group Data
							</button>
						</div>
					</div>

					{/* =========================================================================
					    SECTION 1: 8 KPI METRIC CARDS (2 ROWS OF 4 CARDS)
					========================================================================= */}
					<div className='gz-stats-grid'>
						{/* Card 1: All Employees */}
						<div className='gz-stat-card'>
							<div>
								<div className='gz-stat-icon-wrap'>
									<i className='bi bi-people'></i>
								</div>
								<div className='gz-stat-label'>All Employees</div>
								<div className='gz-stat-value'>{totalEmployees}</div>
							</div>
							<div className='gz-stat-footer'>
								<span className='gz-stat-subtext'>Total on record</span>
								<Link to={`/hr/employee-detail${dataScope === 'rag' ? '?scope=rag' : ''}`} className='gz-stat-link'>
									View &#8599;
								</Link>
							</div>
						</div>

						{/* Card 2: Active Employees */}
						<div className='gz-stat-card'>
							<div>
								<div className='gz-stat-icon-wrap'>
									<i className='bi bi-person-check'></i>
								</div>
								<div className='gz-stat-label'>Active Employees</div>
								<div className='gz-stat-value'>{activeEmployees}</div>
							</div>
							<div className='gz-stat-footer'>
								<span className='gz-stat-subtext'>Currently working</span>
								<Link to={`/hr/employee-detail${dataScope === 'rag' ? '?scope=rag' : ''}`} className='gz-stat-link'>
									View &#8599;
								</Link>
							</div>
						</div>

						{/* Card 3: Inactive Employees */}
						<div className='gz-stat-card'>
							<div>
								<div className='gz-stat-icon-wrap'>
									<i className='bi bi-person-dash'></i>
								</div>
								<div className='gz-stat-label'>Inactive Employees</div>
								<div className='gz-stat-value'>{inactiveEmployees}</div>
							</div>
							<div className='gz-stat-footer'>
								<span className='gz-stat-subtext'>Not active</span>
								<Link to={`/hr/employee-detail${dataScope === 'rag' ? '?scope=rag' : ''}`} className='gz-stat-link'>
									View &#8599;
								</Link>
							</div>
						</div>

						{/* Card 4: On Leave */}
						<div className='gz-stat-card'>
							<div>
								<div className='gz-stat-icon-wrap'>
									<i className='bi bi-person-walking'></i>
								</div>
								<div className='gz-stat-label'>On Leave</div>
								<div className='gz-stat-value'>{onLeaveTodayCount}</div>
							</div>
							<div className='gz-stat-footer'>
								<span className='gz-stat-subtext'>Approved, today</span>
								<Link to='/hr/leave' className='gz-stat-link'>
									View &#8599;
								</Link>
							</div>
						</div>

						{/* Card 5: KPI Tasks */}
						<div className='gz-stat-card'>
							<div>
								<div className='gz-stat-icon-wrap'>
									<i className='bi bi-bullseye'></i>
								</div>
								<div className='gz-stat-label'>KPI Tasks</div>
								<div className='gz-stat-value'>{kpiTasksCount}</div>
							</div>
							<div className='gz-stat-footer'>
								<span className='gz-stat-subtext'>Flagged as KPI</span>
								<Link to={`/hr/task-list?filter=kpi&scope=${dataScope}&all=true`} className='gz-stat-link'>
									View &#8599;
								</Link>
							</div>
						</div>

						{/* Card 6: P1 Tasks */}
						<div className='gz-stat-card'>
							<div>
								<div className='gz-stat-icon-wrap'>
									<i className='bi bi-list-check'></i>
								</div>
								<div className='gz-stat-label'>P1 Tasks</div>
								<div className='gz-stat-value'>{p1TasksCount}</div>
							</div>
							<div className='gz-stat-footer'>
								<span className='gz-stat-subtext'>High priority</span>
								<Link to={`/hr/task-list?status=Pending&filter=p1&scope=${dataScope}&all=true`} className='gz-stat-link'>
									View &#8599;
								</Link>
							</div>
						</div>

						{/* Card 7: Careers */}
						<div className='gz-stat-card'>
							<div>
								<div className='gz-stat-icon-wrap'>
									<i className='bi bi-briefcase'></i>
								</div>
								<div className='gz-stat-label'>Careers</div>
								<div className='gz-stat-value'>{careersCount}</div>
							</div>
							<div className='gz-stat-footer'>
								<span className='gz-stat-subtext'>Open positions</span>
								<Link to='/hr/career' className='gz-stat-link'>
									View &#8599;
								</Link>
							</div>
						</div>

						{/* Card 8: Overdue Tasks */}
						<div className='gz-stat-card'>
							<div>
								<div className='gz-stat-icon-wrap'>
									<i className='bi bi-clock-history'></i>
								</div>
								<div className='gz-stat-label'>Overdue Tasks</div>
								<div className='gz-stat-value'>{overdueTasksCount}</div>
							</div>
							<div className='gz-stat-footer'>
								<span className='gz-stat-subtext'>Past deadline</span>
								<Link to={`/hr/task-list?filter=overdue&scope=${dataScope}&all=true`} className='gz-stat-link'>
									View &#8599;
								</Link>
							</div>
						</div>
					</div>

					{/* =========================================================================
					    SECTION 2: TEAM BIRTHDAY CELEBRATIONS
					========================================================================= */}
					<div className='gz-section-card'>
						<div className='gz-section-header'>
							<div className='gz-section-title-wrap'>
								<div className='gz-section-icon-box'>
									<i className='bi bi-cake2'></i>
								</div>
								<h2 className='gz-section-title'>Team Birthday Celebrations</h2>
							</div>

							{/* Segmented Filter Tabs */}
							<div className='gz-pill-tabs'>
								<button
									type='button'
									className={`gz-pill-tab ${birthdayTab === 'all' ? 'active' : ''}`}
									onClick={() => setBirthdayTab('all')}>
									All (Today &amp; Upcoming)
								</button>
								<button
									type='button'
									className={`gz-pill-tab ${birthdayTab === 'today' ? 'active' : ''}`}
									onClick={() => setBirthdayTab('today')}>
									Today <span className='gz-pill-badge'>{todayBirthdays.length}</span>
								</button>
								<button
									type='button'
									className={`gz-pill-tab ${birthdayTab === 'upcoming' ? 'active' : ''}`}
									onClick={() => setBirthdayTab('upcoming')}>
									Upcoming <span className='gz-pill-badge'>{upcomingBirthdays.length}</span>
								</button>
							</div>
						</div>

						{/* 2-Column Split */}
						<div className='gz-card-grid-2'>
							{/* Left Column: Today's Birthdays Box */}
							{(birthdayTab === 'all' || birthdayTab === 'today') && (
								<div className='gz-empty-box-dashed'>
									{todayBirthdays.length === 0 ? (
										<>
											<div className='gz-empty-icon'>
												<i className='bi bi-gift'></i>
											</div>
											<h3 className='gz-empty-title'>No Birthdays Today</h3>
											<p className='gz-empty-desc'>
												No team members are celebrating a birthday today. Check upcoming
												birthdays to plan team celebrations!
											</p>
										</>
									) : (
										<div className='w-100 text-start'>
											<h4 className='fw-bold mb-3 text-dark fs-6'>Today&apos;s Celebrants 🎉</h4>
											{todayBirthdays.map((bday: any) => (
												<div key={bday._id} className='gz-person-item'>
													<div className='d-flex align-items-center gap-3'>
														{bday.photo ? (
															<img
																src={`https://files.fggroup.in/${bday.photo}`}
																alt={bday.name}
																className='gz-person-avatar'
															/>
														) : (
															<div className='gz-person-avatar-placeholder'>
																{bday.name?.charAt(0) || 'U'}
															</div>
														)}
														<div>
															<div className='gz-person-name'>{bday.name}</div>
															<div className='gz-person-role'>{bday.position}</div>
														</div>
													</div>
													<span className='gz-days-badge'>Today 🎂</span>
												</div>
											))}
										</div>
									)}
								</div>
							)}

							{/* Right Column: Upcoming Birthdays List */}
							{(birthdayTab === 'all' || birthdayTab === 'upcoming') && (
								<div className='gz-list-box-bordered'>
									<div className='gz-list-box-header'>
										<h3 className='gz-list-box-title'>
											<i className='bi bi-calendar-event'></i> Upcoming Birthdays
										</h3>
										<span className='gz-list-badge'>{upcomingBirthdays.length} upcoming</span>
									</div>

									<div className='gz-list-scroll'>
										{upcomingBirthdays.length > 0 ? (
											upcomingBirthdays.map((bday: any) => (
												<div key={bday._id} className='gz-person-item'>
													<div className='d-flex align-items-center gap-3'>
														{bday.photo ? (
															<img
																src={`https://files.fggroup.in/${bday.photo}`}
																alt={bday.name}
																className='gz-person-avatar'
															/>
														) : (
															<div className='gz-person-avatar-placeholder'>
																{bday.name?.charAt(0) || 'U'}
															</div>
														)}
														<div>
															<Link
																to={`/hr/employee-detail?employee_id=${bday._id}`}
																className='gz-person-name text-dark text-hover-primary text-decoration-none'>
																{bday.name}
															</Link>
															<div className='gz-person-role'>{bday.position}</div>
														</div>
													</div>

													<div className='gz-person-meta'>
														<span className='gz-person-date'>{bday.dateStr}</span>
														<span className='gz-days-badge'>{bday.inDaysStr}</span>
													</div>
												</div>
											))
										) : (
											<div className='text-center py-5 text-muted fs-7'>
												No upcoming birthdays found.
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* =========================================================================
					    SECTION 3: TEAM LEAVE STATUS
					========================================================================= */}
					<div className='gz-section-card'>
						<div className='gz-section-header'>
							<div className='gz-section-title-wrap'>
								<div className='gz-section-icon-box is-teal'>
									<i className='bi bi-calendar2-check'></i>
								</div>
								<div className='d-flex align-items-center gap-2'>
									<h2 className='gz-section-title mb-0'>Team Leave Status</h2>
									<Link
										to='/hr/leave'
										className='gz-stat-link ms-2 fs-8 text-decoration-none'
										title='Open full Leave Ledger at /hr/leave'>
										Leave Ledger &#8599;
									</Link>
								</div>
							</div>

							{/* Segmented Filter Tabs */}
							<div className='gz-pill-tabs'>
								<button
									type='button'
									className={`gz-pill-tab ${leaveTab === 'all' ? 'active' : ''}`}
									onClick={() => setLeaveTab('all')}>
									All (Today &amp; Upcoming)
								</button>
								<button
									type='button'
									className={`gz-pill-tab ${leaveTab === 'today' ? 'active' : ''}`}
									onClick={() => setLeaveTab('today')}>
									Today <span className='gz-pill-badge'>{todayLeaves.length}</span>
								</button>
								<button
									type='button'
									className={`gz-pill-tab ${leaveTab === 'upcoming' ? 'active' : ''}`}
									onClick={() => setLeaveTab('upcoming')}>
									Upcoming <span className='gz-pill-badge'>{upcomingLeaves.length}</span>
								</button>
								<button
									type='button'
									className={`gz-pill-tab ${leaveTab === 'pending' ? 'active' : ''}`}
									onClick={() => setLeaveTab('pending')}>
									Pending{' '}
									<span className='gz-pill-badge is-warning'>{pendingLeavesCount}</span>
								</button>
							</div>
						</div>

						{/* 2-Column Split */}
						<div className='gz-card-grid-2'>
							{/* Left Column: Today's Leaves Box */}
							{(leaveTab === 'all' || leaveTab === 'today') && (
								<div className='gz-empty-box-dashed'>
									{todayLeaves.length === 0 ? (
										<>
											<div className='gz-empty-icon'>
												<i className='bi bi-person'></i>
											</div>
											<h3 className='gz-empty-title'>No Leaves Today</h3>
											<p className='gz-empty-desc'>
												No team members are on leave today. All employees are scheduled and
												active!
											</p>
										</>
									) : (
										<div className='w-100 text-start'>
											<div className='d-flex align-items-center justify-content-between mb-3'>
												<h4 className='fw-bold text-dark fs-6 mb-0'>On Leave Today</h4>
												<Link to='/hr/leave' className='text-muted fs-8 text-hover-primary text-decoration-none'>
													View all &rarr;
												</Link>
											</div>
											<div className='gz-list-scroll'>
												{todayLeaves.map((leave: any) => (
													<div key={leave._id} className='gz-person-item'>
														<div className='d-flex align-items-center gap-3'>
															<div
																className='gz-person-avatar-placeholder'
																style={{ background: '#DCFCE7', color: '#16A34A' }}>
																{getLeaveEmployeeName(leave).charAt(0) || 'L'}
															</div>
															<div>
																<div className='gz-person-name'>
																	{getLeaveEmployeeName(leave)}
																</div>
																<div className='gz-person-role'>
																	{leave.reason || 'Approved Leave'}
																	{' · '}
																	<span className='fw-medium text-muted'>
																		{calculateLeaveDuration(leave.from_date, leave.to_date)}
																	</span>
																</div>
															</div>
														</div>
														<div className='d-flex align-items-center gap-2'>
															<span
																className='gz-days-badge'
																style={{ background: '#DCFCE7', color: '#15803D' }}>
																On Leave
															</span>
															<Link
																to='/hr/leave'
																className='text-muted fs-8 text-hover-primary text-decoration-none'>
																View &rarr;
															</Link>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}

							{/* Right Column: Upcoming / Pending Leaves Box */}
							{(leaveTab === 'all' || leaveTab === 'upcoming' || leaveTab === 'pending') && (
								<div className='gz-list-box-bordered'>
									<div className='gz-list-box-header'>
										<h3 className='gz-list-box-title is-teal'>
											<i className='bi bi-calendar2-range'></i>{' '}
											{leaveTab === 'pending' ? 'Pending Leave Requests' : 'Upcoming Leaves'}
										</h3>
										<div className='d-flex align-items-center gap-2'>
											<span className='gz-list-badge'>
												{leaveTab === 'pending'
													? `${pendingLeaves.length} pending`
													: `${upcomingLeaves.length} upcoming`}
											</span>
											<Link
												to={`/hr/leave${leaveTab === 'pending' ? '?status=PENDING' : ''}`}
												className='text-muted fs-8 text-hover-primary text-decoration-none'>
												Ledger &rarr;
											</Link>
										</div>
									</div>

									{leaveTab === 'pending' ? (
										pendingLeaves.length === 0 ? (
											<div className='d-flex flex-column align-items-center justify-content-center text-center my-auto py-4'>
												<div className='gz-empty-icon is-teal'>
													<i className='bi bi-check2-circle'></i>
												</div>
												<h3 className='gz-empty-title'>No Pending Requests</h3>
												<p className='gz-empty-desc'>
													All leave requests have been reviewed and processed!
												</p>
											</div>
										) : (
											<div className='gz-list-scroll'>
												{pendingLeaves.map((item: any) => (
													<div key={item._id} className='gz-person-item'>
														<div className='d-flex align-items-center gap-3'>
															<div
																className='gz-person-avatar-placeholder'
																style={{ background: '#FEF3C7', color: '#D97706' }}>
																{getLeaveEmployeeName(item).charAt(0) || 'L'}
															</div>
															<div>
																<div className='gz-person-name'>
																	{getLeaveEmployeeName(item)}
																</div>
																<div className='gz-person-role'>
																	{item.reason || 'Pending Approval'}
																	{' · '}
																	<span className='fw-medium text-muted'>
																		{calculateLeaveDuration(item.from_date, item.to_date)}
																	</span>
																</div>
															</div>
														</div>
														<div className='d-flex align-items-center gap-2'>
															<span
																className='gz-days-badge'
																style={{ background: '#FEF3C7', color: '#B45309' }}>
																{DayJS(item.from_date).format('DD MMM')}
															</span>
															<Link
																to='/hr/leave?status=PENDING'
																className='btn btn-xs btn-light-warning fw-semibold px-2 py-1 fs-8 text-decoration-none'>
																Review
															</Link>
														</div>
													</div>
												))}
											</div>
										)
									) : upcomingLeaves.length === 0 ? (
										<div className='d-flex flex-column align-items-center justify-content-center text-center my-auto py-4'>
											<div className='gz-empty-icon is-teal'>
												<i className='bi bi-calendar-check'></i>
											</div>
											<h3 className='gz-empty-title'>No Upcoming Leaves</h3>
											<p className='gz-empty-desc'>
												All upcoming employee approved leave requests will appear right here.
											</p>
										</div>
									) : (
										<div className='gz-list-scroll'>
											{upcomingLeaves.map((item: any) => (
												<div key={item._id} className='gz-person-item'>
													<div className='d-flex align-items-center gap-3'>
														<div
															className='gz-person-avatar-placeholder'
															style={{ background: '#EFF6FF', color: '#2563EB' }}>
															{getLeaveEmployeeName(item).charAt(0) || 'L'}
														</div>
														<div>
															<div className='gz-person-name'>
																{getLeaveEmployeeName(item)}
															</div>
															<div className='gz-person-role'>
																{item.reason || 'Scheduled Leave'}
																{' · '}
																<span className='fw-medium text-muted'>
																	{calculateLeaveDuration(item.from_date, item.to_date)}
																</span>
															</div>
														</div>
													</div>
													<div className='d-flex align-items-center gap-2'>
														<span className='gz-person-date'>
															{DayJS(item.from_date).format('DD MMM')}
														</span>
														<Link
															to='/hr/leave'
															className='text-muted fs-8 text-hover-primary text-decoration-none'>
															View &rarr;
														</Link>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* =========================================================================
					    SECTION 4: MEMO WATCHLIST
					========================================================================= */}
					<div className='gz-memo-section'>
						<div className='gz-memo-header'>
							<h3 className='gz-memo-title'>Memo Watchlist</h3>
							<Link to='/hr/memo' className='gz-memo-view-all'>
								View all
							</Link>
						</div>

						{/* Memo Items List */}
						<div>
							{memoList.length > 0 ? (
								memoList.map((memo: any) => (
									<div key={memo._id} className='gz-memo-item'>
										<div>
											<Link
												to={`/hr/employee-detail?employee_id=${memo._id}`}
												className='gz-memo-name text-dark text-hover-primary text-decoration-none'>
												{memo.name}
											</Link>
											<div className='gz-memo-sub'>
												{memo.position} &middot; {memo.rating}
											</div>
										</div>
										<div className='gz-memo-count'>
											{memo.count} memo{memo.count > 1 ? 's' : ''}
										</div>
									</div>
								))
							) : (
								<div className='text-center py-4 bg-white border rounded-3 text-muted fs-7'>
									No active memos recorded on staff accounts.
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	)
}

const DashboardHR = () => {
	const intl = useIntl()
	return (
		<>
			<PageTitle breadcrumbs={[]}>HR Dashboard</PageTitle>
			<HRDashboardPage />
		</>
	)
}

export { DashboardHR }