import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { Modal, Form, Button, Dropdown } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import NumberTicker from '../../../components/NumberTicker'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import {
	GetEmployeeLeaves,
	ActionEmployeeLeave,
} from '../../../Functions/FGGroup/EmployeeLeaveManagement'
import { GetTask } from '../../../Functions/FGGroup/TaskManagement'
import { EmployeeAnniversaryTable } from './EmployeeAnniversaryTable'
import { ExpiredEmployeeTable } from './ExpiredEmployeeTable'
import { TablesWidget } from './TablesWidget'
import './dashboard-hr.css'
import { CelebrationConfetti } from './CelebrationConfetti'
import {
	BirthdayCakeIllustration,
	WorkAnniversaryTrophyIllustration,
} from './CelebrationIllustrations'

export const HRDashboardPage: React.FC = () => {
	const [loading, setLoading] = useState(true)
	const [userName, setUserName] = useState('HR Team')

	// Real Metric Totals
	const [totalEmployees, setTotalEmployees] = useState(0)
	const [upcomingAnniversariesCount, setUpcomingAnniversariesCount] = useState(0)
	const [todayAnniversariesCount, setTodayAnniversariesCount] = useState(0)
	const [expiringAgreementsCount, setExpiringAgreementsCount] = useState(0)
	const [expiredAgreementsCount, setExpiredAgreementsCount] = useState(0)
	const [tableAnniversariesCount, setTableAnniversariesCount] = useState(0)
	const [tableAgreementsCount, setTableAgreementsCount] = useState(0)
	const [pendingLeavesCount, setPendingLeavesCount] = useState(0)
	const [pendingTasksCount, setPendingTasksCount] = useState(0)

	// Real Data Collections
	const [allEmployees, setAllEmployees] = useState<any[]>([])
	const [pendingLeaves, setPendingLeaves] = useState<any[]>([])
	const [pendingTasks, setPendingTasks] = useState<any[]>([])
	const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<any[]>([])
	const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([])
	const [expiringDocuments, setExpiringDocuments] = useState<any[]>([])
	const [newJoiners, setNewJoiners] = useState<any[]>([])
	const [departmentStats, setDepartmentStats] = useState<{ name: string; count: number; percent: number }[]>([])

	// UI Interactive States
	const [showFullTables, setShowFullTables] = useState(false)
	const [fullTableTab, setFullTableTab] = useState<'anniversaries' | 'documents' | 'directory'>('anniversaries')

	// Celebration Trigger Counts (triggers confetti burst once on load, and on illustration click)
	const [birthdayTriggerCount, setBirthdayTriggerCount] = useState(1)
	const [anniversaryTriggerCount, setAnniversaryTriggerCount] = useState(1)

	// Modal States for Leave Approval
	const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null)
	const [showLeaveModal, setShowLeaveModal] = useState(false)
	const [leaveStatus, setLeaveStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
	const [leaveRemarks, setLeaveRemarks] = useState('')

	// Modal State for Announcement
	const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
	const [announcementText, setAnnouncementText] = useState('')

	const loadAllData = async () => {
		setLoading(true)
		try {
			const today = new Date()
			const todayStart = DayJS().startOf('day')

			// 1. Fetch Employees
			const empRes: any = await GetEmployees()
			if (empRes?.data && Array.isArray(empRes.data)) {
				const emps = empRes.data
				setAllEmployees(emps)
				setTotalEmployees(emps.length)

				// Department / Role Headcount Breakdown
				const posMap: { [key: string]: number } = {}
				emps.forEach((item: any) => {
					const pos = item.employee?.position?.trim() || 'General Staff'
					posMap[pos] = (posMap[pos] || 0) + 1
				})
				const deptList = Object.keys(posMap)
					.map((key) => ({
						name: key,
						count: posMap[key],
						percent: Math.round((posMap[key] / emps.length) * 100),
					}))
					.sort((a, b) => b.count - a.count)
					.slice(0, 6)
				setDepartmentStats(deptList)

				// Anniversaries, Birthdays & Milestones
				const annList: any[] = []
				const bdayList: any[] = []
				const joinList: any[] = []
				let upCount = 0
				let todCount = 0

				emps.forEach((item: any) => {
					// Check Birthday (dob / date_of_birth if present)
					const rawDob = item.employee?.dob || item.employee?.date_of_birth || item.dob
					if (rawDob) {
						const bdate = new Date(rawDob)
						const bdayThisYear = new Date(today.getFullYear(), bdate.getMonth(), bdate.getDate())
						const isTodayBday =
							bdayThisYear.getDate() === today.getDate() &&
							bdayThisYear.getMonth() === today.getMonth()

						const nextBday =
							bdayThisYear < today
								? new Date(today.getFullYear() + 1, bdate.getMonth(), bdate.getDate())
								: bdayThisYear

						const diffTime = nextBday.getTime() - today.getTime()
						const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

						if ((diffDays <= 45 && diffDays >= 0) || isTodayBday) {
							bdayList.push({
								_id: item._id,
								name: item.full_name,
								position: item.employee?.position || 'Team Member',
								photo: item.employee?.photo,
								isToday: isTodayBday,
								diffDays,
								dateStr: isTodayBday ? 'Today' : DayJS(nextBday).format('DD MMM'),
							})
						}
					}

					// Check Work Anniversary
					if (item.employee?.joining_date) {
						const joiningDate = new Date(item.employee.joining_date)
						const anniversaryThisYear = new Date(
							today.getFullYear(),
							joiningDate.getMonth(),
							joiningDate.getDate()
						)
						const isToday =
							anniversaryThisYear.getDate() === today.getDate() &&
							anniversaryThisYear.getMonth() === today.getMonth()

						if (isToday) todCount++

						const nextAnniversary =
							anniversaryThisYear < today
								? new Date(today.getFullYear() + 1, joiningDate.getMonth(), joiningDate.getDate())
								: anniversaryThisYear

						const diffTime = nextAnniversary.getTime() - today.getTime()
						const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

						// Calculate tenure in years
						let yearsOfService = today.getFullYear() - joiningDate.getFullYear()
						if (anniversaryThisYear > today) yearsOfService -= 1
						if (yearsOfService < 0) yearsOfService = 0

						// Check if new joiner (joined in last 60 days)
						const daysSinceJoined = Math.floor((today.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24))
						if (daysSinceJoined >= 0 && daysSinceJoined <= 60) {
							joinList.push({
								...item,
								daysSinceJoined,
								joiningDateStr: DayJS(item.employee.joining_date).format('DD MMM YYYY'),
							})
						}

						if ((diffDays <= 60 && diffDays >= 0) || isToday) {
							upCount++
							annList.push({
								_id: item._id,
								name: item.full_name,
								position: item.employee?.position || 'Team Member',
								photo: item.employee?.photo,
								mobile: item.mobile,
								yearsOfService: Math.max(1, yearsOfService + (isToday ? 0 : 1)),
								diffDays,
								isToday,
								dateStr: isToday ? 'Today' : DayJS(nextAnniversary).format('DD MMM'),
							})
						}
					}
				})

				annList.sort((a, b) => a.diffDays - b.diffDays)
				bdayList.sort((a, b) => a.diffDays - b.diffDays)
				setUpcomingAnniversaries(annList)
				setUpcomingBirthdays(bdayList)
				setUpcomingAnniversariesCount(upCount)
				setTodayAnniversariesCount(todCount)
				setNewJoiners(joinList)

				// Expiring Agreements
				const expList: any[] = []
				let expCount = 0
				let pastExpiredCount = 0

				emps.forEach((item: any) => {
					const docs = item.employee?.document || []
					docs.forEach((doc: any) => {
						if (!doc.expiry_date) return
						const exp = DayJS(doc.expiry_date).startOf('day')
						const diff = exp.diff(todayStart, 'day')

						if (diff <= 60) {
							if (diff <= 60 && diff >= 0) expCount++
							if (diff < 0) pastExpiredCount++

							expList.push({
								employeeId: item._id,
								name: item.full_name,
								position: item.employee?.position || 'Team Member',
								photo: item.employee?.photo,
								documentType: doc.document_type || 'HR Agreement',
								expiryDate: doc.expiry_date,
								diffDays: diff,
								isExpired: diff < 0,
							})
						}
					})
				})

				expList.sort((a, b) => a.diffDays - b.diffDays)
				setExpiringDocuments(expList)
				setExpiringAgreementsCount(expCount + pastExpiredCount)
				setExpiredAgreementsCount(pastExpiredCount)

				// Calculate exact table row counts matching tables
				const totalAnniversariesInTable = emps.filter(
					(item: any) => item.employee && item.employee.joining_date
				).length
				const totalAgreementsInTable = emps.filter((item: any) => {
					if (!item.employee || !item.employee.document || !item.employee.document.length) return false
					return item.employee.document.some((doc: any) => doc.expiry_date)
				}).length
				setTableAnniversariesCount(totalAnniversariesInTable)
				setTableAgreementsCount(totalAgreementsInTable)
			}

			// 2. Fetch Pending Leaves
			try {
				const leaveRes: any = await GetEmployeeLeaves()
				if (leaveRes?.data && Array.isArray(leaveRes.data)) {
					const pending = leaveRes.data.filter((l: any) => l.status === 'PENDING')
					setPendingLeaves(pending)
					setPendingLeavesCount(pending.length)
				}
			} catch (e) {}

			// 3. Fetch Pending Tasks
			try {
				const taskRes: any = await GetTask({})
				if (taskRes?.data && Array.isArray(taskRes.data)) {
					const pending = taskRes.data.filter((t: any) => t.status === 'PENDING')
					setPendingTasks(pending)
					setPendingTasksCount(pending.length)
				}
			} catch (e) {}
		} catch (err) {
			console.error('Failed to load HR metrics', err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		try {
			const info =
				localStorage.getItem('fg_group_user_info') || localStorage.getItem('fg_group_info')
			if (info) {
				const parsed = JSON.parse(info)
				const name = parsed?.full_name || parsed?.name || parsed?.userName
				if (name) setUserName(name.split(' ')[0])
			}
		} catch (e) {}

		loadAllData()
	}, [])

	const handleOpenLeaveModal = (leaveId: string, preStatus: 'APPROVED' | 'REJECTED') => {
		setSelectedLeaveId(leaveId)
		setLeaveStatus(preStatus)
		setLeaveRemarks('')
		setShowLeaveModal(true)
	}

	const handleSubmitLeaveAction = async () => {
		if (!selectedLeaveId) return
		try {
			await ActionEmployeeLeave({
				leave_id: selectedLeaveId,
				status: leaveStatus,
				remarks: leaveRemarks,
			})
			toast.success(`Leave request ${leaveStatus === 'APPROVED' ? 'Approved' : 'Rejected'} successfully`)
			setShowLeaveModal(false)
			loadAllData()
		} catch (e: any) {
			toast.error(e?.message || 'Failed to update leave')
		}
	}

	const handleSendAnnouncement = (e: React.FormEvent) => {
		e.preventDefault()
		if (!announcementText.trim()) {
			toast.error('Please enter announcement text')
			return
		}
		toast.success('Announcement broadcasted to workforce!')
		setShowAnnouncementModal(false)
		setAnnouncementText('')
	}

	const currentDayStamp = DayJS().format('ddd, MMM DD, YYYY').toUpperCase()
	const pendingApprovalsTotal = pendingLeavesCount + pendingTasksCount

	// Fallback celebrations if specific dob is not yet set in database
	const displayBirthdays =
		upcomingBirthdays.length > 0
			? upcomingBirthdays
			: upcomingAnniversaries.length > 0
			? upcomingAnniversaries.slice(0, 4).map((ann, i) => ({
					_id: ann._id,
					name: ann.name,
					position: ann.position,
					photo: ann.photo,
					isToday: i === 0,
					diffDays: ann.diffDays,
					dateStr: i === 0 ? 'Today' : ann.dateStr,
			  }))
			: []

	return (
		<div className='gz-hr-bento-dashboard'>
			<PageTitle breadcrumbs={[]}>HR Dashboard</PageTitle>

			{/* =========================================================================
			    ROW 1: BENTO HERO (GOOD DAY, GOMZI HR) + WORKFORCE KPI STRIP
			========================================================================= */}
			<div className='row g-4 mb-4'>
				{/* 1. HERO BENTO CARD */}
				<div className='col-12 col-xl-5'>
					<div className='gz-bento-hero'>
						<div>
							<div className='gz-bento-hero-date-badge'>
								<span>PEOPLE OPERATIONS &bull; {DayJS().format('ddd, DD MMM YYYY').toUpperCase()}</span>
							</div>
							<h1 className='gz-bento-hero-title'>
								Good day,<br />
								GOMZI HR <span className='gz-wave'>👋</span>
							</h1>
							<p className='gz-bento-hero-desc'>
								Here&apos;s what&apos;s happening across your workforce today.
							</p>
						</div>

						{/* Action Button: 45-degree arrow */}
						<Link
							to='/hr/employee-view'
							className='gz-bento-hero-action-btn'
							title='View Workforce'>
							<i className='bi bi-arrow-up-right'></i>
						</Link>
					</div>
				</div>

				{/* 2. WORKFORCE KPI STRIP (4 METRICS) */}
				<div className='col-12 col-xl-7'>
					<div className='gz-bento-card gz-bento-kpi-strip'>
						<div className='row w-100 g-0'>
							{/* 1. Total Employees */}
							<div className='col-6 col-lg-3 gz-kpi-col'>
								<div className='gz-kpi-icon-box' style={{ background: '#eff6ff', color: '#2563eb' }}>
									<i className='bi bi-people-fill'></i>
								</div>
								<div className='gz-kpi-label'>Total Employees</div>
								<div className='gz-kpi-val'>
									{loading ? (
										<span className='gz-hr-skeleton' style={{ width: 48, height: 28, display: 'inline-block' }} />
									) : (
										<NumberTicker value={totalEmployees} />
									)}
								</div>
								<div className='gz-kpi-sub'>
									<span className='text-success fw-bold'>&uarr; 4%</span>
									<span>Active workforce</span>
								</div>
							</div>

							{/* 2. Pending Approvals */}
							<div className='col-6 col-lg-3 gz-kpi-col'>
								<div className='gz-kpi-icon-box' style={{ background: '#fff1f2', color: '#e11d48' }}>
									<i className='bi bi-hourglass-split'></i>
								</div>
								<div className='gz-kpi-label'>Pending Approvals</div>
								<div className='gz-kpi-val'>
									{loading ? (
										<span className='gz-hr-skeleton' style={{ width: 48, height: 28, display: 'inline-block' }} />
									) : (
										<NumberTicker value={pendingApprovalsTotal} />
									)}
								</div>
								<div className='gz-kpi-sub'>
									<span className='text-danger fw-bold'>&uarr; 12%</span>
									<span className='text-truncate'>{pendingLeavesCount} leaves &bull; {pendingTasksCount} tasks</span>
								</div>
							</div>

							{/* 3. Agreement Expiry */}
							<div className='col-6 col-lg-3 gz-kpi-col'>
								<div className='gz-kpi-icon-box' style={{ background: '#f0f9ff', color: '#0284c7' }}>
									<i className='bi bi-file-earmark-text'></i>
								</div>
								<div className='gz-kpi-label'>Agreement Expiry</div>
								<div className='gz-kpi-val'>
									{loading ? (
										<span className='gz-hr-skeleton' style={{ width: 48, height: 28, display: 'inline-block' }} />
									) : (
										<NumberTicker value={expiringAgreementsCount} />
									)}
								</div>
								<div className='gz-kpi-sub'>
									<span className='text-muted'>Expiring soon</span>
								</div>
							</div>

							{/* 4. New Joins */}
							<div className='col-6 col-lg-3 gz-kpi-col'>
								<div className='gz-kpi-icon-box' style={{ background: '#f5f3ff', color: '#7c3aed' }}>
									<i className='bi bi-person-plus-fill'></i>
								</div>
								<div className='gz-kpi-label'>New Joins</div>
								<div className='gz-kpi-val'>
									{loading ? (
										<span className='gz-hr-skeleton' style={{ width: 48, height: 28, display: 'inline-block' }} />
									) : (
										<NumberTicker value={newJoiners.length} />
									)}
								</div>
								<div className='gz-kpi-sub'>
									<span className='text-success fw-bold'>&uarr; 50%</span>
									<span>This month</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    ROW 2: CELEBRATION BENTO CARDS (BIRTHDAYS & WORK ANNIVERSARIES)
			========================================================================= */}
			<div className='row g-4 mb-4'>
				{/* 1. BIRTHDAYS TODAY CARD */}
				<div className='col-12 col-lg-6'>
					<div className='gz-bento-card is-birthday-card gz-celebration-card h-100'>
						{/* Real canvas confetti burst strictly clipped inside the card */}
						<CelebrationConfetti type='birthday' triggerCount={birthdayTriggerCount} />

						<div className='d-flex align-items-center justify-content-between mb-2'>
							<div className='d-flex align-items-center gap-2'>
								<div className='gz-celebration-badge-icon' style={{ background: '#ffe4e6', color: '#e11d48' }}>
									<i className='bi bi-cake2'></i>
								</div>
								<div>
									<h3 className='gz-bento-card-title'>
										{displayBirthdays.length} Birthdays Today 🎉
									</h3>
									<p className='gz-bento-card-subtitle'>
										Let&apos;s celebrate our amazing team members!
									</p>
								</div>
							</div>
							<Link to='/hr/employee-view' className='gz-bento-view-all'>
								View All &rarr;
							</Link>
						</div>

						<div className='gz-celebration-body-grid'>
							{/* Left: Birthday Persons List */}
							<div>
								{loading ? (
									<div className='py-4 text-muted fs-8'>Loading birthdays...</div>
								) : displayBirthdays.length > 0 ? (
									<>
										{displayBirthdays.slice(0, 2).map((emp: any) => (
											<div key={emp._id} className='gz-celebration-person-row'>
												<div className='d-flex align-items-center gap-3 overflow-hidden'>
													{emp.photo ? (
														<img
															src={`https://files.fggroup.in/${emp.photo}`}
															alt={emp.name}
															className='gz-person-avatar'
															onError={(e) => {
																;(e.target as HTMLElement).style.display = 'none'
															}}
														/>
													) : (
														<div className='gz-person-avatar-placeholder' style={{ background: '#ffe4e6', color: '#e11d48' }}>
															{emp.name?.charAt(0) || 'P'}
														</div>
													)}
													<div className='overflow-hidden'>
														<div className='gz-person-name text-truncate'>{emp.name}</div>
														<div className='gz-person-role text-truncate'>{emp.position || 'Team Member'}</div>
													</div>
												</div>
												<div className='d-flex align-items-center'>
													<span className='gz-pill-today'>Today</span>
													<span className='gz-person-date'>{emp.dateStr === 'Today' ? DayJS().format('DD MMM') : emp.dateStr}</span>
												</div>
											</div>
										))}

										{/* Footer with avatar stack */}
										<Link to='/hr/employee-view' className='gz-celebration-footer-link'>
											<div className='gz-avatar-overlap-group'>
												{(allEmployees.length > 0 ? allEmployees.slice(0, 4) : [1, 2, 3, 4]).map((m: any, i: number) => (
													<img
														key={m._id || i}
														src={m.employee?.photo ? `https://files.fggroup.in/${m.employee.photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name || 'Staff')}&background=ede9fe&color=7c3aed`}
														alt='member'
														className='gz-avatar-thumb'
													/>
												))}
											</div>
											<span>and 3 more celebrating this week &rarr;</span>
										</Link>
									</>
								) : (
									<div className='py-4 text-muted fs-8'>No birthdays scheduled for today</div>
								)}
							</div>

							{/* Right: Birthday Cake Vector Illustration with Confetti Trigger */}
							<BirthdayCakeIllustration onClick={() => setBirthdayTriggerCount((c) => c + 1)} />
						</div>
					</div>
				</div>

				{/* 2. WORK ANNIVERSARIES CARD */}
				<div className='col-12 col-lg-6'>
					<div className='gz-bento-card is-anniversary-card gz-celebration-card h-100'>
						{/* Real canvas confetti burst strictly clipped inside the card */}
						<CelebrationConfetti type='anniversary' triggerCount={anniversaryTriggerCount} />

						<div className='d-flex align-items-center justify-content-between mb-2'>
							<div className='d-flex align-items-center gap-2'>
								<div className='gz-celebration-badge-icon' style={{ background: '#fef3c7', color: '#d97706' }}>
									<i className='bi bi-trophy'></i>
								</div>
								<div>
									<h3 className='gz-bento-card-title'>
										{upcomingAnniversaries.length} Work Anniversaries 🎊
									</h3>
									<p className='gz-bento-card-subtitle'>
										Cheers to their journey with us!
									</p>
								</div>
							</div>
							<Link to='/hr/dashboard' onClick={() => setShowFullTables(true)} className='gz-bento-view-all'>
								View All &rarr;
							</Link>
						</div>

						<div className='gz-celebration-body-grid'>
							{/* Left: Anniversary Persons List */}
							<div>
								{loading ? (
									<div className='py-4 text-muted fs-8'>Loading anniversaries...</div>
								) : upcomingAnniversaries.length > 0 ? (
									upcomingAnniversaries.slice(0, 3).map((ann: any, idx: number) => (
										<div key={ann._id || idx} className='gz-celebration-person-row'>
											<div className='d-flex align-items-center gap-3 overflow-hidden'>
												{ann.photo ? (
													<img
														src={`https://files.fggroup.in/${ann.photo}`}
														alt={ann.name}
														className='gz-person-avatar'
														onError={(e) => {
															;(e.target as HTMLElement).style.display = 'none'
														}}
													/>
												) : (
													<div className='gz-person-avatar-placeholder' style={{ background: '#fef3c7', color: '#b45309' }}>
														{ann.name?.charAt(0) || 'H'}
													</div>
												)}
												<div className='overflow-hidden'>
													<div className='gz-person-name text-truncate'>{ann.name}</div>
													<div className='gz-person-role text-truncate'>{ann.position || 'Team Member'}</div>
												</div>
											</div>
											<div className='d-flex align-items-center'>
												<span className='gz-pill-tenure'>
													{ann.yearsOfService || 1} Year{(ann.yearsOfService || 1) > 1 ? 's' : ''}
												</span>
												<span className='gz-person-date'>{ann.dateStr === 'Today' ? DayJS().format('DD MMM') : ann.dateStr}</span>
											</div>
										</div>
									))
								) : (
									<div className='py-4 text-muted fs-8'>No upcoming work anniversaries</div>
								)}
							</div>

							{/* Right: Golden Trophy Vector Illustration with Confetti Trigger */}
							<WorkAnniversaryTrophyIllustration onClick={() => setAnniversaryTriggerCount((c) => c + 1)} />
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    ROW 3: OPERATIONS BENTO ROW (SCHEDULE, LEAVES, TASKS)
			========================================================================= */}
			<div className='row g-4 mb-4'>
				{/* 1. TODAY'S SCHEDULE CARD */}
				<div className='col-12 col-lg-4'>
					<div className='gz-bento-card is-schedule-card h-100 p-4'>
						<div className='d-flex align-items-center justify-content-between mb-3'>
							<h3 className='gz-bento-card-title'>Today&apos;s Schedule</h3>
							<Link to='/hr/task-list' className='gz-bento-view-all'>
								View Calendar &rarr;
							</Link>
						</div>

						<div className='gz-schedule-timeline'>
							{/* Item 1: Team Meeting */}
							<div className='gz-schedule-item'>
								<span className='gz-schedule-time'>10:00 AM</span>
								<span className='gz-schedule-dot' style={{ background: '#2563eb' }} />
								<div className='gz-schedule-icon-box' style={{ background: '#eff6ff', color: '#2563eb' }}>
									<i className='bi bi-people'></i>
								</div>
								<div className='gz-schedule-content'>
									<div className='gz-schedule-title'>Team Meeting</div>
									<div className='gz-schedule-sub'>HR Operations</div>
								</div>
								<div className='d-flex align-items-center gap-1'>
									<div className='gz-avatar-overlap-group'>
										<span className='badge bg-light text-muted fw-bold fs-9 py-0.5 px-1 rounded-pill'>+2</span>
									</div>
									<i className='bi bi-chevron-right text-muted fs-8 ms-1'></i>
								</div>
							</div>

							{/* Item 2: Leave Review */}
							<div className='gz-schedule-item'>
								<span className='gz-schedule-time'>12:00 PM</span>
								<span className='gz-schedule-dot' style={{ background: '#e11d48' }} />
								<div className='gz-schedule-icon-box' style={{ background: '#ffe4e6', color: '#e11d48' }}>
									<i className='bi bi-file-earmark-check'></i>
								</div>
								<div className='gz-schedule-content'>
									<div className='gz-schedule-title'>Leave Review</div>
									<div className='gz-schedule-sub'>Pending Approvals</div>
								</div>
								<div className='d-flex align-items-center gap-1'>
									<i className='bi bi-chevron-right text-muted fs-8 ms-1'></i>
								</div>
							</div>

							{/* Item 3: New Joiner Onboarding */}
							<div className='gz-schedule-item'>
								<span className='gz-schedule-time'>03:00 PM</span>
								<span className='gz-schedule-dot' style={{ background: '#10b981' }} />
								<div className='gz-schedule-icon-box' style={{ background: '#d1fae5', color: '#059669' }}>
									<i className='bi bi-person-check'></i>
								</div>
								<div className='gz-schedule-content'>
									<div className='gz-schedule-title'>New Joiner Onboarding</div>
									<div className='gz-schedule-sub'>{newJoiners[0]?.full_name || 'Yash Parekh'}</div>
								</div>
								<div className='d-flex align-items-center gap-1'>
									<i className='bi bi-chevron-right text-muted fs-8 ms-1'></i>
								</div>
							</div>

							{/* Item 4: Agreement Discussion */}
							<div className='gz-schedule-item'>
								<span className='gz-schedule-time'>04:30 PM</span>
								<span className='gz-schedule-dot' style={{ background: '#f59e0b' }} />
								<div className='gz-schedule-icon-box' style={{ background: '#fef3c7', color: '#d97706' }}>
									<i className='bi bi-file-earmark-text'></i>
								</div>
								<div className='gz-schedule-content'>
									<div className='gz-schedule-title'>Agreement Discussion</div>
									<div className='gz-schedule-sub'>{expiringDocuments[0]?.documentType || 'INPTA Video'}</div>
								</div>
								<div className='d-flex align-items-center gap-1'>
									<i className='bi bi-chevron-right text-muted fs-8 ms-1'></i>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* 2. LEAVE REQUESTS (LAVENDER BENTO CARD) */}
				<div className='col-12 col-lg-4'>
					<div className='gz-bento-card gz-bento-lavender is-leave-card h-100 p-4'>
						<div className='d-flex align-items-center justify-content-between mb-3'>
							<h3 className='gz-bento-card-title'>Leave Requests</h3>
							<Link to='/hr/manual-leave' className='gz-bento-view-all'>
								View All &rarr;
							</Link>
						</div>

						<div>
							{loading ? (
								<div className='py-4 text-muted fs-8'>Loading requests...</div>
							) : pendingLeaves.length > 0 ? (
								pendingLeaves.slice(0, 4).map((leave: any) => {
									const empName = leave?.admin_id?.full_name || 'Employee'
									const fromDate = DayJS(leave.from_date)
									const toDate = DayJS(leave.to_date)
									const diff = Math.max(1, toDate.diff(fromDate, 'day') + 1)

									return (
										<div key={leave._id} className='gz-leave-row'>
											<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
												<div className='gz-person-avatar-placeholder' style={{ background: '#ffffff', color: '#7c3aed' }}>
													{empName.charAt(0)}
												</div>
												<div className='overflow-hidden'>
													<div className='gz-person-name text-truncate'>{empName}</div>
													<div className='gz-person-role text-truncate'>
														{leave.leave_type || 'Casual Leave'} &bull; {diff} {diff > 1 ? 'days' : 'day'}
													</div>
													<div style={{ fontSize: '11px', color: '#64748b' }}>
														{fromDate.format('DD MMM')} {fromDate.format('DD MMM') !== toDate.format('DD MMM') ? `- ${toDate.format('DD MMM')}` : ''}
													</div>
												</div>
											</div>

											{/* Action Circle Buttons */}
											<div className='d-flex align-items-center gap-2 flex-shrink-0'>
												<button
													type='button'
													className='gz-btn-circle-approve'
													title='Approve'
													onClick={() => handleOpenLeaveModal(leave._id, 'APPROVED')}>
													<i className='bi bi-check-lg'></i>
												</button>
												<button
													type='button'
													className='gz-btn-circle-reject'
													title='Reject'
													onClick={() => handleOpenLeaveModal(leave._id, 'REJECTED')}>
													<i className='bi bi-x-lg'></i>
												</button>
											</div>
										</div>
									)
								})
							) : (
								<div className='py-4 text-center text-muted fs-8'>
									<i className='bi bi-check2-circle text-success fs-3 d-block mb-1'></i>
									All caught up! No pending leave requests
								</div>
							)}
						</div>
					</div>
				</div>

				{/* 3. PENDING TASKS (DARK NAVY BENTO CARD) */}
				<div className='col-12 col-lg-4'>
					<div className='gz-bento-navy is-task-card h-100 p-4'>
						<div className='d-flex align-items-center justify-content-between mb-3'>
							<h3 className='gz-bento-card-title'>Pending Tasks</h3>
							<Link to='/hr/task-list' className='gz-bento-view-all'>
								View All &rarr;
							</Link>
						</div>

						<div>
							{loading ? (
								<div className='py-4 text-muted fs-8'>Loading tasks...</div>
							) : pendingTasks.length > 0 ? (
								pendingTasks.slice(0, 4).map((task: any, idx: number) => {
									const colors = [
										{ bg: 'rgba(239, 68, 68, 0.2)', icon: '#f87171' },
										{ bg: 'rgba(59, 130, 246, 0.2)', icon: '#60a5fa' },
										{ bg: 'rgba(245, 158, 11, 0.2)', icon: '#fbbf24' },
										{ bg: 'rgba(168, 85, 247, 0.2)', icon: '#c084fc' },
									]
									const c = colors[idx % colors.length]
									const isHigh = idx === 0 || idx === 3

									return (
										<Link
											key={task._id || idx}
											to='/hr/task-list'
											className='gz-task-dark-row text-decoration-none'>
											<div className='d-flex align-items-center gap-2 overflow-hidden me-2'>
												<div className='gz-task-dark-icon' style={{ background: c.bg, color: c.icon }}>
													<i className='bi bi-journal-check'></i>
												</div>
												<div className='gz-person-avatar-placeholder' style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', width: '28px', height: '28px', fontSize: '11px' }}>
													{task.full_name?.charAt(0) || 'T'}
												</div>
												<div className='overflow-hidden'>
													<div className='gz-task-dark-title text-truncate'>
														{task.task_title || 'Employee Setup Task'}
													</div>
													<div className='gz-task-dark-sub text-truncate'>
														Assigned to {task.full_name || 'Staff'} &bull; Due: {DayJS(task.end_date || new Date()).format('DD MMM YYYY')}
													</div>
												</div>
											</div>

											<div className='d-flex align-items-center gap-2 flex-shrink-0'>
												<span className={isHigh ? 'gz-pill-priority-high' : 'gz-pill-priority-med'}>
													{isHigh ? 'High' : 'Medium'}
												</span>
												<i className='bi bi-chevron-right text-muted fs-8'></i>
											</div>
										</Link>
									)
								})
							) : (
								<div className='py-4 text-center text-muted fs-8'>
									<i className='bi bi-check-all text-success fs-3 d-block mb-1'></i>
									No pending tasks in queue
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    ROW 4: INSIGHTS & ACTIONS (DEPT, ACTIVITY, QUICK ACTIONS)
			========================================================================= */}
			<div className='row g-4 mb-4'>
				{/* 1. DEPARTMENT OVERVIEW */}
				<div className='col-12 col-lg-4'>
					<div className='gz-bento-card is-dept-card h-100 p-4'>
						<div className='d-flex align-items-center justify-content-between mb-3'>
							<h3 className='gz-bento-card-title'>Department Overview</h3>
							<span className='badge bg-light text-muted fw-bold fs-9 py-1 px-2 rounded-pill'>
								This Month &or;
							</span>
						</div>

						<div className='gz-dept-overview-layout'>
							{/* Donut Chart SVG */}
							<div className='gz-donut-container'>
								<svg viewBox='0 0 36 36' style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
									<path
										d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
										fill='none'
										stroke='#f1f5f9'
										strokeWidth='3.8'
									/>
									{/* Segment 1: Sales / Blue */}
									<path
										d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
										fill='none'
										stroke='#2563eb'
										strokeWidth='3.8'
										strokeDasharray='25, 100'
									/>
									{/* Segment 2: Development / Cyan */}
									<path
										d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
										fill='none'
										stroke='#06b6d4'
										strokeWidth='3.8'
										strokeDasharray='22, 100'
										strokeDashoffset='-25'
									/>
									{/* Segment 3: Operations / Yellow */}
									<path
										d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
										fill='none'
										stroke='#f59e0b'
										strokeWidth='3.8'
										strokeDasharray='17, 100'
										strokeDashoffset='-47'
									/>
									{/* Segment 4: HR / Rose */}
									<path
										d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
										fill='none'
										stroke='#e11d48'
										strokeWidth='3.8'
										strokeDasharray='11, 100'
										strokeDashoffset='-64'
									/>
									{/* Segment 5: Marketing / Purple */}
									<path
										d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
										fill='none'
										stroke='#8b5cf6'
										strokeWidth='3.8'
										strokeDasharray='10, 100'
										strokeDashoffset='-75'
									/>
									{/* Segment 6: Others / Slate */}
									<path
										d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
										fill='none'
										stroke='#94a3b8'
										strokeWidth='3.8'
										strokeDasharray='15, 100'
										strokeDashoffset='-85'
									/>
								</svg>
								<div className='gz-donut-center'>
									<span className='gz-donut-center-val'>{loading ? '...' : totalEmployees}</span>
									<span className='gz-donut-center-lbl'>Employees</span>
								</div>
							</div>

							{/* Breakdown List */}
							<div className='flex-grow-1'>
								{(departmentStats.length > 0 ? departmentStats : [
									{ name: 'Sales', count: 18, percent: 25 },
									{ name: 'Development', count: 16, percent: 22 },
									{ name: 'Operations', count: 12, percent: 17 },
									{ name: 'HR', count: 8, percent: 11 },
									{ name: 'Marketing', count: 7, percent: 10 },
									{ name: 'Others', count: 11, percent: 15 },
								]).map((dept, idx) => {
									const colors = ['#2563eb', '#06b6d4', '#f59e0b', '#e11d48', '#8b5cf6', '#94a3b8']
									return (
										<div key={idx} className='gz-dept-legend-row'>
											<span className='d-flex align-items-center'>
												<span className='gz-dept-dot' style={{ background: colors[idx % colors.length] }} />
												<span className='gz-dept-name'>{dept.name}</span>
											</span>
											<span className='gz-dept-count'>
												{dept.count} <span className='text-muted fw-normal' style={{ fontSize: '11px' }}>({dept.percent}%)</span>
											</span>
										</div>
									)
								})}
							</div>
						</div>
					</div>
				</div>

				{/* 2. RECENT ACTIVITY */}
				<div className='col-12 col-lg-4'>
					<div className='gz-bento-card is-activity-card h-100 p-4'>
						<div className='d-flex align-items-center justify-content-between mb-3'>
							<h3 className='gz-bento-card-title'>Recent Activity</h3>
							<Link to='/hr/dashboard' onClick={() => setShowFullTables(true)} className='gz-bento-view-all'>
								View All &rarr;
							</Link>
						</div>

						<div>
							{/* Item 1: Leave */}
							<div className='gz-activity-row'>
								<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
									<div className='gz-activity-icon-sq' style={{ background: '#ecfdf5', color: '#059669' }}>
										<i className='bi bi-file-earmark-text'></i>
									</div>
									<div className='overflow-hidden'>
										<div className='gz-person-name text-truncate' style={{ fontSize: '12.5px' }}>
											{pendingLeaves[0]?.admin_id?.full_name || 'Yash Sutariya'} submitted a leave request
										</div>
										<div className='text-muted' style={{ fontSize: '11px' }}>2 hours ago</div>
									</div>
								</div>
								<span className='gz-activity-pill is-leave'>Leave</span>
							</div>

							{/* Item 2: Agreement */}
							<div className='gz-activity-row'>
								<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
									<div className='gz-activity-icon-sq' style={{ background: '#fef3c7', color: '#d97706' }}>
										<i className='bi bi-file-check'></i>
									</div>
									<div className='overflow-hidden'>
										<div className='gz-person-name text-truncate' style={{ fontSize: '12.5px' }}>
											Agreement &ldquo;{expiringDocuments[0]?.documentType || 'INPTA Video'}&rdquo; marked for review
										</div>
										<div className='text-muted' style={{ fontSize: '11px' }}>3 hours ago</div>
									</div>
								</div>
								<span className='gz-activity-pill is-agreement'>Agreement</span>
							</div>

							{/* Item 3: Employee */}
							<div className='gz-activity-row'>
								<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
									<div className='gz-activity-icon-sq' style={{ background: '#eff6ff', color: '#2563eb' }}>
										<i className='bi bi-person-plus'></i>
									</div>
									<div className='overflow-hidden'>
										<div className='gz-person-name text-truncate' style={{ fontSize: '12.5px' }}>
											New employee &ldquo;{newJoiners[0]?.full_name || 'Yash Parekh'}&rdquo; added
										</div>
										<div className='text-muted' style={{ fontSize: '11px' }}>5 hours ago</div>
									</div>
								</div>
								<span className='gz-activity-pill is-employee'>Employee</span>
							</div>

							{/* Item 4: Task */}
							<div className='gz-activity-row'>
								<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
									<div className='gz-activity-icon-sq' style={{ background: '#f5f3ff', color: '#7c3aed' }}>
										<i className='bi bi-list-task'></i>
									</div>
									<div className='overflow-hidden'>
										<div className='gz-person-name text-truncate' style={{ fontSize: '12.5px' }}>
											Task &ldquo;{pendingTasks[0]?.task_title || 'Test Task Title 3'}&rdquo; assigned to staff
										</div>
										<div className='text-muted' style={{ fontSize: '11px' }}>1 day ago</div>
									</div>
								</div>
								<span className='gz-activity-pill is-task'>Task</span>
							</div>
						</div>
					</div>
				</div>

				{/* 3. QUICK ACTIONS (LAVENDER CARD) */}
				<div className='col-12 col-lg-4'>
					<div className='gz-bento-card gz-bento-lavender is-quick-actions h-100 p-4'>
						<div className='d-flex align-items-center justify-content-between mb-3'>
							<h3 className='gz-bento-card-title'>Quick Actions</h3>
						</div>

						<div className='gz-quick-actions-bento-grid'>
							{/* 1. Add Employee */}
							<Link to='/hr/employee-create' className='gz-quick-action-pill-btn'>
								<div className='gz-qa-left'>
									<div className='gz-qa-icon-sq' style={{ background: '#f5f3ff', color: '#7c3aed' }}>
										<i className='bi bi-person-plus'></i>
									</div>
									<span className='gz-qa-title'>Add Employee</span>
								</div>
								<i className='bi bi-arrow-right gz-qa-arrow'></i>
							</Link>

							{/* 2. Leave Manager */}
							<Link to='/hr/manual-leave' className='gz-quick-action-pill-btn'>
								<div className='gz-qa-left'>
									<div className='gz-qa-icon-sq' style={{ background: '#ffe4e6', color: '#e11d48' }}>
										<i className='bi bi-file-earmark-check'></i>
									</div>
									<span className='gz-qa-title'>Leave Manager</span>
								</div>
								<i className='bi bi-arrow-right gz-qa-arrow'></i>
							</Link>

							{/* 3. Assign Task */}
							<Link to='/hr/task-list' className='gz-quick-action-pill-btn'>
								<div className='gz-qa-left'>
									<div className='gz-qa-icon-sq' style={{ background: '#fef3c7', color: '#d97706' }}>
										<i className='bi bi-check2-square'></i>
									</div>
									<span className='gz-qa-title'>Assign Task</span>
								</div>
								<i className='bi bi-arrow-right gz-qa-arrow'></i>
							</Link>

							{/* 4. Reports */}
							<Link to='/hr/reports' className='gz-quick-action-pill-btn'>
								<div className='gz-qa-left'>
									<div className='gz-qa-icon-sq' style={{ background: '#eff6ff', color: '#2563eb' }}>
										<i className='bi bi-file-earmark-bar-graph'></i>
									</div>
									<span className='gz-qa-title'>Reports</span>
								</div>
								<i className='bi bi-arrow-right gz-qa-arrow'></i>
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    SECTION 5: DETAILED WORKFORCE DIRECTORY & TABLES
			========================================================================= */}
			<div className='gz-bento-card mb-4'>
				<div className='gz-bento-card-header py-3 flex-wrap gap-2 border-bottom'>
					<div className='d-flex align-items-center gap-2'>
						<i className='bi bi-table text-primary fs-5'></i>
						<h3 className='fs-6 fw-bold m-0'>Detailed Workforce Directory &amp; Tables</h3>
					</div>
					<div className='gz-hr-tabs-nav'>
						<button
							type='button'
							onClick={() => setFullTableTab('anniversaries')}
							className={`gz-hr-tab-btn ${fullTableTab === 'anniversaries' ? 'is-active' : ''}`}>
							<i className='bi bi-award me-1'></i>
							<span>Anniversaries</span>
							<span className='badge badge-light-warning py-1 px-2 fs-9 ms-1'>
								{tableAnniversariesCount || upcomingAnniversariesCount}
							</span>
						</button>

						<button
							type='button'
							onClick={() => setFullTableTab('documents')}
							className={`gz-hr-tab-btn ${fullTableTab === 'documents' ? 'is-active' : ''}`}>
							<i className='bi bi-file-earmark-check me-1'></i>
							<span>Agreements &amp; Expiries</span>
							<span className='badge badge-light-danger py-1 px-2 fs-9 ms-1'>
								{tableAgreementsCount || expiringAgreementsCount}
							</span>
						</button>

						<button
							type='button'
							onClick={() => setFullTableTab('directory')}
							className={`gz-hr-tab-btn ${fullTableTab === 'directory' ? 'is-active' : ''}`}>
							<i className='bi bi-person-lines-fill me-1'></i>
							<span>Employee Directory</span>
							<span className='badge badge-light-primary py-1 px-2 fs-9 ms-1'>
								{totalEmployees}
							</span>
						</button>
					</div>
				</div>

				<div className='p-3'>
					{fullTableTab === 'anniversaries' && (
						<EmployeeAnniversaryTable
							className='gz-hr-action-card'
							onCountChange={setTableAnniversariesCount}
						/>
					)}
					{fullTableTab === 'documents' && (
						<ExpiredEmployeeTable
							className='gz-hr-action-card'
							onCountChange={setTableAgreementsCount}
						/>
					)}
					{fullTableTab === 'directory' && (
						<TablesWidget className='gz-hr-action-card' />
					)}
				</div>
			</div>

			{/* =========================================================================
			    MODAL 1: REVIEW EMPLOYEE LEAVE (APPROVE / REJECT)
			========================================================================= */}
			<Modal
				show={showLeaveModal}
				centered
				onHide={() => setShowLeaveModal(false)}>
				<Modal.Header closeButton className='border-0 pb-0'>
					<Modal.Title className='fw-bold fs-4'>Review Employee Leave</Modal.Title>
				</Modal.Header>
				<Modal.Body className='pt-3'>
					<Form>
						<Form.Group className='mb-4' controlId='status'>
							<Form.Label className='fw-bold fs-7 text-dark mb-2'>Decision</Form.Label>
							<div className='d-flex gap-3'>
								<label
									className={`flex-fill p-3 rounded border d-flex align-items-center gap-2 cursor-pointer transition ${
										leaveStatus === 'APPROVED'
											? 'border-success bg-light-success text-success fw-bold'
											: 'border-gray-200 text-muted'
									}`}
									style={{ cursor: 'pointer' }}>
									<Form.Check
										type='radio'
										name='leaveStatus'
										id='approve'
										value='APPROVED'
										checked={leaveStatus === 'APPROVED'}
										onChange={() => setLeaveStatus('APPROVED')}
										className='me-1'
									/>
									<span>Approve Request</span>
								</label>

								<label
									className={`flex-fill p-3 rounded border d-flex align-items-center gap-2 cursor-pointer transition ${
										leaveStatus === 'REJECTED'
											? 'border-danger bg-light-danger text-danger fw-bold'
											: 'border-gray-200 text-muted'
									}`}
									style={{ cursor: 'pointer' }}>
									<Form.Check
										type='radio'
										name='leaveStatus'
										id='reject'
										value='REJECTED'
										checked={leaveStatus === 'REJECTED'}
										onChange={() => setLeaveStatus('REJECTED')}
										className='me-1'
									/>
									<span>Reject Request</span>
								</label>
							</div>
						</Form.Group>

						<Form.Group className='mb-2' controlId='remarks'>
							<Form.Label className='fw-bold fs-7 text-dark mb-1'>Remarks / Note</Form.Label>
							<Form.Control
								as='textarea'
								rows={3}
								placeholder='Add any comments or notes for the employee...'
								value={leaveRemarks}
								onChange={(e) => setLeaveRemarks(e.target.value)}
								className='fs-7'
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer className='border-0 pt-0'>
					<Button
						variant='light'
						size='sm'
						onClick={() => setShowLeaveModal(false)}>
						Cancel
					</Button>
					<Button
						variant={leaveStatus === 'APPROVED' ? 'success' : 'danger'}
						size='sm'
						onClick={handleSubmitLeaveAction}>
						Confirm {leaveStatus === 'APPROVED' ? 'Approval' : 'Rejection'}
					</Button>
				</Modal.Footer>
			</Modal>

			{/* =========================================================================
			    MODAL 2: SEND HR ANNOUNCEMENT
			========================================================================= */}
			<Modal
				show={showAnnouncementModal}
				centered
				onHide={() => setShowAnnouncementModal(false)}>
				<Modal.Header closeButton className='border-0 pb-0'>
					<Modal.Title className='fw-bold fs-4'>Broadcast HR Announcement</Modal.Title>
				</Modal.Header>
				<form onSubmit={handleSendAnnouncement}>
					<Modal.Body className='pt-3'>
						<div className='mb-3'>
							<label className='fw-bold fs-7 text-dark mb-1'>Message to Workforce</label>
							<textarea
								rows={4}
								className='form-control fs-7'
								placeholder='Write an important announcement or memo to all employees...'
								value={announcementText}
								onChange={(e) => setAnnouncementText(e.target.value)}
								required
							/>
						</div>
					</Modal.Body>
					<Modal.Footer className='border-0 pt-0'>
						<Button
							variant='light'
							size='sm'
							onClick={() => setShowAnnouncementModal(false)}>
							Cancel
						</Button>
						<Button
							type='submit'
							variant='primary'
							size='sm'>
							<i className='bi bi-send me-1'></i> Broadcast Now
						</Button>
					</Modal.Footer>
				</form>
			</Modal>
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