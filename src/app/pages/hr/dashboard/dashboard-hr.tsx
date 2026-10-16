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

export const HRDashboardPage: React.FC = () => {
	const [loading, setLoading] = useState(true)
	const [userName, setUserName] = useState('HR Team')

	// Real Metric Totals
	const [totalEmployees, setTotalEmployees] = useState(0)
	const [upcomingAnniversariesCount, setUpcomingAnniversariesCount] = useState(0)
	const [todayAnniversariesCount, setTodayAnniversariesCount] = useState(0)
	const [expiringAgreementsCount, setExpiringAgreementsCount] = useState(0)
	const [expiredAgreementsCount, setExpiredAgreementsCount] = useState(0)
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
		<div className='gz-dashboard-container'>
			<PageTitle breadcrumbs={[]}>HR Command Center</PageTitle>

					{/* =========================================================================
					    SECTION A: ILLUSTRATED HR GREETING BANNER
					========================================================================= */}
					<div className='gz-hr-hero-banner mb-4'>
						<div className='row align-items-center justify-content-between g-3'>
							<div className='col-12 col-lg-6'>
								<div className='gz-eyebrow-tag mb-2'>
									<span className='gz-eyebrow-dot'></span>
									<span>HR COMMAND CENTER &bull; {currentDayStamp}</span>
								</div>
								<h1 className='fw-bolder fs-2hx text-dark mb-2 tracking-tight'>
									Good day, GOMZI HR <span className='gz-wave'>👋</span>
								</h1>
								<p className='text-muted fs-6 mb-3'>
									Here's what's happening across your workforce today.
								</p>
								<div className='d-flex align-items-center gap-2 flex-wrap'>
									<Link to='/hr/employee-create' className='btn btn-sm gz-btn-brand'>
										<i className='bi bi-person-plus me-1'></i> Add Employee
									</Link>
									<Link to='/hr/manual-leave' className='btn btn-sm gz-btn-outline-brand'>
										<i className='bi bi-calendar2-check me-1'></i> Leave Manager
									</Link>
									<Link to='/hr/task-list' className='btn btn-sm gz-btn-outline-brand'>
										<i className='bi bi-list-task me-1'></i> Tasks
									</Link>
									<Link to='/hr/attendance' className='btn btn-sm gz-btn-outline-brand'>
										<i className='bi bi-clock-history me-1'></i> Attendance
									</Link>
								</div>
							</div>

							<div className='col-12 col-lg-6 d-flex justify-content-lg-end align-items-center gap-3'>
								{/* Sketch Annotation + unDraw / IconScout Design & Development Team Scene */}
								<div className='d-none d-md-flex align-items-center gap-2 me-1'>
									<div className='text-end me-1'>
										<span
											className='text-muted fs-7 fst-italic d-block'
											style={{ fontFamily: 'Caveat, "Segoe Script", cursive, sans-serif' }}>
											People make progress. &rarr;
										</span>
									</div>

									{/* unDraw Design & Development Collaboration Vector Illustration */}
									<svg width='180' height='62' viewBox='0 0 180 62' fill='none' xmlns='http://www.w3.org/2000/svg' className='flex-shrink-0'>
										{/* Ground Baseline */}
										<line x1='6' y1='56' x2='174' y2='56' stroke='#e2e8f0' strokeWidth='1.5' strokeLinecap='round' />

										{/* Potted Plant */}
										<path d='M10 56 L18 56 L16 45 L12 45 Z' fill='#f1f5f9' stroke='#cbd5e1' strokeWidth='1' />
										<path d='M14 45 Q9 36 12 30 Q16 37 14 45' fill='#10b981' />
										<path d='M14 45 Q19 37 18 31 Q15 37 14 45' fill='#059669' />

										{/* Central Design & Development Screen / Monitor */}
										<rect x='64' y='14' width='52' height='36' rx='4' fill='#ffffff' stroke='#cbd5e1' strokeWidth='1.5' />
										<rect x='64' y='14' width='52' height='8' rx='4' fill='#f8fafc' />
										<circle cx='69' cy='18' r='1.5' fill='#ef4444' />
										<circle cx='74' cy='18' r='1.5' fill='#f59e0b' />
										<circle cx='79' cy='18' r='1.5' fill='#10b981' />

										{/* UI Wireframe Elements & Code inside screen */}
										<rect x='69' y='26' width='18' height='12' rx='2' fill='#eff6ff' stroke='#bfdbfe' strokeWidth='1' />
										<path d='M72 32 L75 29 L78 33 L83 28' stroke='#2563eb' strokeWidth='1.5' strokeLinecap='round' fill='none' />
										<rect x='91' y='26' width='20' height='3' rx='1' fill='#2563eb' />
										<rect x='91' y='31' width='14' height='2' rx='1' fill='#94a3b8' />
										<rect x='91' y='35' width='17' height='2' rx='1' fill='#38bdf8' />
										{/* Stand */}
										<rect x='88' y='50' width='4' height='6' fill='#94a3b8' />
										<rect x='82' y='55' width='16' height='2' rx='1' fill='#64748b' />

										{/* Floating Code Bracket */}
										<text x='54' y='20' fill='#2563eb' fontSize='9' fontWeight='bold' fontFamily='monospace'>&lt;/&gt;</text>
										<circle cx='122' cy='14' r='2' fill='#38bdf8' />
										<circle cx='126' cy='8' r='1.5' fill='#10b981' />

										{/* Person 1 (Left - Developer at Chair with Laptop) */}
										<circle cx='38' cy='22' r='8' fill='#fed7aa' />
										{/* Hair */}
										<path d='M30 20 Q38 12 46 20 Q46 11 38 11 Q30 11 30 20' fill='#1e293b' />
										{/* Body */}
										<path d='M28 56 C28 40 33 34 38 34 C43 34 48 40 48 56' fill='#2563eb' />
										{/* Laptop */}
										<path d='M34 46 L48 46 L46 38 L36 38 Z' fill='#f1f5f9' stroke='#94a3b8' strokeWidth='1' />
										<rect x='38' y='40' width='6' height='4' rx='0.5' fill='#38bdf8' />

										{/* Person 2 (Right - Product Lead / Designer presenting) */}
										<circle cx='140' cy='20' r='8' fill='#fed7aa' />
										{/* Hair */}
										<path d='M132 19 Q140 12 148 19 Q148 11 140 11 Q132 11 132 19' fill='#0f172a' />
										{/* Body in Navy Suit */}
										<path d='M130 56 C130 38 135 32 140 32 C145 32 150 38 150 56' fill='#0f172a' />
										{/* White Collar & Blue Accent */}
										<path d='M138 32 L140 39 L142 32' fill='#ffffff' />
										<line x1='140' y1='36' x2='140' y2='44' stroke='#2563eb' strokeWidth='1.5' />
										{/* Arm pointing towards the dashboard */}
										<path d='M134 40 Q124 36 118 31' stroke='#0f172a' strokeWidth='3.5' strokeLinecap='round' fill='none' />
										<circle cx='117' cy='30' r='2' fill='#fed7aa' />
									</svg>
								</div>

								{/* Quote Card */}
								<div className='gz-hr-quote-card flex-shrink-0'>
									<p>&ldquo;Great teams build greater tomorrows.&rdquo;</p>
									<span>&mdash; GOMZI HR</span>
								</div>
							</div>
						</div>
					</div>

					{/* =========================================================================
					    SECTION B: CELEBRATION ROW (UPCOMING BIRTHDAYS & WORK ANNIVERSARIES)
					========================================================================= */}
					<div className='row g-3 g-xl-4 mb-4'>
						{/* 1. UPCOMING BIRTHDAYS PANEL */}
						{(() => {
							const todayPerson = displayBirthdays.find((b) => b.isToday)
							const hasToday = Boolean(todayPerson)

							return (
								<div className='col-12 col-lg-6'>
									<div className={`gz-hr-celebration-card ${hasToday ? 'is-birthday-today' : ''}`}>
										{/* BACKGROUND CELEBRATION EFFECTS WHEN BIRTHDAY IS TODAY */}
										{hasToday && (
											<div className='gz-hr-birthday-bg-celebration' aria-hidden='true'>
												<svg viewBox='0 0 500 220' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'>
													<defs>
														<radialGradient id='bdayGlow' cx='85%' cy='50%' r='65%'>
															<stop offset='0%' stopColor='#2563eb' stopOpacity='0.16' />
															<stop offset='45%' stopColor='#38bdf8' stopOpacity='0.12' />
															<stop offset='75%' stopColor='#f59e0b' stopOpacity='0.06' />
															<stop offset='100%' stopColor='#ffffff' stopOpacity='0' />
														</radialGradient>
														<linearGradient id='ribbonGrad1' x1='0' y1='0' x2='1' y2='1'>
															<stop offset='0%' stopColor='#2563eb' />
															<stop offset='100%' stopColor='#38bdf8' />
														</linearGradient>
														<linearGradient id='ribbonGrad2' x1='0' y1='0' x2='1' y2='1'>
															<stop offset='0%' stopColor='#0284c7' />
															<stop offset='100%' stopColor='#93c5fd' />
														</linearGradient>
														<linearGradient id='goldRibbon' x1='0' y1='0' x2='1' y2='1'>
															<stop offset='0%' stopColor='#f59e0b' />
															<stop offset='100%' stopColor='#fde68a' />
														</linearGradient>
													</defs>

													{/* Ambient party glow */}
													<rect width='500' height='220' fill='url(#bdayGlow)' />

													{/* Serpentine streamer ribbons */}
													<path d='M20 180 Q80 120 140 160 T250 130' stroke='url(#ribbonGrad1)' strokeWidth='2.5' fill='none' strokeDasharray='4 4' opacity='0.55' />
													<path d='M180 30 Q260 80 320 40 T440 70' stroke='url(#ribbonGrad2)' strokeWidth='2.5' fill='none' strokeDasharray='5 3' opacity='0.45' />
													<path d='M360 190 Q410 140 450 180 T490 150' stroke='url(#goldRibbon)' strokeWidth='3' fill='none' opacity='0.5' />

													{/* Confetti pieces in Festive Palette */}
													<rect x='60' y='45' width='7' height='7' fill='#2563eb' opacity='0.65' transform='rotate(25 63 48)' className='gz-hr-confetti-float' />
													<rect x='190' y='140' width='6' height='6' fill='#38bdf8' opacity='0.55' transform='rotate(45 193 143)' />
													<rect x='340' y='70' width='8' height='8' fill='#0284c7' opacity='0.6' transform='rotate(15 344 74)' className='gz-hr-confetti-float' />
													<circle cx='110' cy='110' r='3.5' fill='#2563eb' opacity='0.55' />
													<circle cx='280' cy='55' r='4' fill='#38bdf8' opacity='0.65' className='gz-hr-confetti-float' />
													<rect x='220' y='175' width='10' height='4' rx='2' fill='#0284c7' opacity='0.5' transform='rotate(-20 225 177)' />
													<circle cx='460' cy='95' r='3.5' fill='#38bdf8' opacity='0.55' />

													{/* Gold Stars & Sparkles */}
													<path d='M80 85 L82 89 L86 91 L82 93 L80 97 L78 93 L74 91 L78 89 Z' fill='#f59e0b' opacity='0.75' />
													<path d='M250 95 L252 98 L255 100 L252 102 L250 105 L248 102 L245 100 L248 98 Z' fill='#fbbf24' opacity='0.7' />
													<path d='M390 40 L392 43 L396 45 L392 47 L390 50 L388 47 L384 45 L388 43 Z' fill='#f59e0b' opacity='0.8' />
													<circle cx='150' cy='65' r='3' fill='#f59e0b' opacity='0.6' />
													<circle cx='440' cy='35' r='3' fill='#fbbf24' opacity='0.7' />

													{/* Emerald Accents */}
													<rect x='130' y='165' width='8' height='4' rx='1' fill='#10b981' opacity='0.6' transform='rotate(35 134 167)' />
													<circle cx='310' cy='155' r='3' fill='#10b981' opacity='0.5' />
												</svg>
											</div>
										)}

										<div className='gz-hr-celebration-header'>
											<div>
												<h3>
													<span style={{ fontSize: '18px' }}>🎂</span> Upcoming Birthdays
													{hasToday && (
														<span className='badge badge-light-primary text-primary fw-bold fs-9 py-1 px-2 ms-2'>
															<i className='bi bi-stars me-1'></i>Celebration Today!
														</span>
													)}
												</h3>
												<p>Celebrate the amazing people in our team!</p>
											</div>
											<Link
												to='/hr/employee-view'
												className='text-primary fw-bold fs-8 text-hover-primary'>
												View All &rarr;
											</Link>
										</div>

										<div className='gz-hr-celebration-body'>
											{/* Employee list */}
											{loading ? (
												<div className='d-flex align-items-center gap-3 overflow-auto flex-grow-1 py-1'>
													{[1, 2, 3].map((i) => (
														<div key={i} className='text-center' style={{ minWidth: '76px' }}>
															<div className='gz-hr-skeleton symbol symbol-45px symbol-circle mx-auto mb-1'></div>
															<div className='gz-hr-skeleton mx-auto mb-1' style={{ width: '48px', height: '11px', borderRadius: '4px' }}></div>
															<div className='gz-hr-skeleton mx-auto' style={{ width: '36px', height: '9px', borderRadius: '4px' }}></div>
														</div>
													))}
												</div>
											) : displayBirthdays.length > 0 ? (
												<div className='d-flex align-items-center gap-3 overflow-auto flex-grow-1 py-1'>
													{displayBirthdays.slice(0, 4).map((emp) => (
														<div key={emp._id} className='text-center' style={{ minWidth: '76px' }}>
															<div className='symbol symbol-45px symbol-circle mx-auto mb-1'>
																{emp.photo ? (
																	<img
																		src={`https://files.fggroup.in/${emp.photo}`}
																		alt={emp.name}
																		onError={(e) => {
																			;(e.target as HTMLElement).style.display = 'none'
																		}}
																	/>
																) : (
																	<span className='symbol-label fw-bold fs-6 bg-light-primary text-primary'>
																		{emp.name?.charAt(0)}
																	</span>
																)}
															</div>
															<div className='fw-bold text-dark fs-8 text-truncate mb-0' style={{ maxWidth: '80px' }}>
																{emp.name?.split(' ')[0]}
															</div>
															<div className='text-muted fs-10 text-truncate mb-1' style={{ maxWidth: '80px' }}>
																{emp.position || 'Staff'}
															</div>
															<span
																className={`badge py-0 px-2 fs-10 fw-bold ${
																	emp.isToday
																		? 'badge-light-primary text-primary'
																		: 'badge-light text-muted'
																}`}>
																{emp.dateStr}
															</span>
														</div>
													))}

													{displayBirthdays.length > 4 && (
														<div className='symbol symbol-35px symbol-circle'>
															<span className='symbol-label bg-light-primary text-primary fw-bold fs-8'>
																+{displayBirthdays.length - 4}
															</span>
														</div>
													)}
												</div>
											) : (
												<div className='py-4 text-muted fs-8'>
													<i className='bi bi-calendar-heart text-danger me-1'></i> No birthdays in the next 30 days
												</div>
											)}

											{/* Right: Birthday Cake Vector (Gender-neutral Celebration) */}
											<div className='text-center flex-shrink-0 ps-2'>
												<svg width='110' height='90' viewBox='0 0 110 90' fill='none' xmlns='http://www.w3.org/2000/svg' className='gz-hr-cake-anim'>
													{/* Sparkles / Confetti */}
													<circle cx='18' cy='22' r='2.5' fill='#38bdf8' />
													<circle cx='92' cy='20' r='2' fill='#2563eb' />
													<circle cx='14' cy='48' r='2' fill='#fbbf24' />
													<circle cx='96' cy='46' r='2.5' fill='#10b981' />

													{/* Cake Plate */}
													<ellipse cx='55' cy='80' rx='42' ry='7' fill='#1e3a5f' />

													{/* Bottom Tier */}
													<path d='M25 60 C25 56 30 52 55 52 C80 52 85 56 85 60 L85 75 C85 78 72 80 55 80 C38 80 25 78 25 75 Z' fill='#93c5fd' />
													<path d='M25 60 C28 65 34 65 38 60 C42 65 48 65 52 60 C56 65 62 65 66 60 C70 65 76 65 80 60 C84 65 85 62 85 60' stroke='#2563eb' strokeWidth='2' fill='none' />

													{/* Top Tier */}
													<path d='M34 42 C34 38 38 35 55 35 C72 35 76 38 76 42 L76 56 C76 59 66 60 55 60 C44 60 34 59 34 56 Z' fill='#e0f2fe' />

													{/* Candles */}
													<rect x='44' y='22' width='3' height='13' fill='#38bdf8' rx='1' />
													<rect x='54' y='18' width='3' height='17' fill='#fbbf24' rx='1' />
													<rect x='64' y='22' width='3' height='13' fill='#818cf8' rx='1' />

													{/* Flames with gentle warm flicker that settles static */}
													<path d='M45.5 17 Q47 20 45.5 22 Q44 20 45.5 17' fill='#f97316' className='gz-candle-flame-flicker' />
													<path d='M55.5 13 Q57 16 55.5 18 Q54 16 55.5 13' fill='#f97316' className='gz-candle-flame-flicker' style={{ animationDelay: '0.15s' }} />
													<path d='M65.5 17 Q67 20 65.5 22 Q64 20 65.5 17' fill='#f97316' className='gz-candle-flame-flicker' style={{ animationDelay: '0.3s' }} />
												</svg>
												<span
													className='d-block fs-8 fw-bold text-dark'
													style={{ fontFamily: 'Caveat, "Segoe Script", cursive, sans-serif' }}>
													Happy Birthday!
												</span>
											</div>
										</div>
									</div>
								</div>
							)
						})()}

						{/* 2. WORK ANNIVERSARIES PANEL */}
						{(() => {
							const anniversaryTodayPerson = upcomingAnniversaries.find((ann) => ann.isToday)
							const hasAnniversaryToday = Boolean(anniversaryTodayPerson)
							const hasAnyAnniversaries = upcomingAnniversaries.length > 0

							return (
								<div className='col-12 col-lg-6'>
									<div
										className={`gz-hr-celebration-card is-anniversary-card ${
											hasAnniversaryToday ? 'is-anniversary-today' : ''
										}`}>
										{/* BACKGROUND CELEBRATION EFFECTS FOR WORK ANNIVERSARIES */}
										{hasAnyAnniversaries && (
											<div className='gz-hr-anniversary-bg-celebration' aria-hidden='true'>
												<svg viewBox='0 0 500 220' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'>
													<defs>
														<radialGradient id='anniversaryGlow' cx='85%' cy='50%' r='65%'>
															<stop offset='0%' stopColor='#f59e0b' stopOpacity='0.22' />
															<stop offset='45%' stopColor='#fbbf24' stopOpacity='0.12' />
															<stop offset='75%' stopColor='#fde68a' stopOpacity='0.05' />
															<stop offset='100%' stopColor='#ffffff' stopOpacity='0' />
														</radialGradient>
														<linearGradient id='goldRibbonAnn' x1='0' y1='0' x2='1' y2='1'>
															<stop offset='0%' stopColor='#f59e0b' />
															<stop offset='50%' stopColor='#fbbf24' />
															<stop offset='100%' stopColor='#d97706' />
														</linearGradient>
														<linearGradient id='champagneGrad' x1='0' y1='0' x2='1' y2='1'>
															<stop offset='0%' stopColor='#fbbf24' />
															<stop offset='100%' stopColor='#fef08a' />
														</linearGradient>
													</defs>

													{/* Ambient golden milestone glow */}
													<rect width='500' height='220' fill='url(#anniversaryGlow)' />

													{/* Festive serpentine milestone ribbons */}
													<path
														d='M20 180 Q80 120 140 160 T250 130'
														stroke='url(#goldRibbonAnn)'
														strokeWidth='2.5'
														fill='none'
														strokeDasharray='4 4'
														opacity='0.55'
													/>
													<path
														d='M180 30 Q260 80 320 40 T440 70'
														stroke='url(#champagneGrad)'
														strokeWidth='2.5'
														fill='none'
														strokeDasharray='5 3'
														opacity='0.5'
													/>
													<path
														d='M360 190 Q410 140 450 180 T490 150'
														stroke='url(#goldRibbonAnn)'
														strokeWidth='3'
														fill='none'
														opacity='0.45'
													/>

													{/* Shimmering Golden Stars */}
													<path d='M80 85 L82 89 L86 91 L82 93 L80 97 L78 93 L74 91 L78 89 Z' fill='#f59e0b' opacity='0.8' />
													<path d='M250 95 L252 98 L255 100 L252 102 L250 105 L248 102 L245 100 L248 98 Z' fill='#fbbf24' opacity='0.75' />
													<path d='M390 40 L392 43 L396 45 L392 47 L390 50 L388 47 L384 45 L388 43 Z' fill='#f59e0b' opacity='0.85' />
													<path d='M160 45 L162 48 L165 50 L162 52 L160 55 L158 52 L155 50 L158 48 Z' fill='#fbbf24' opacity='0.7' />

													{/* Milestone Confetti & Sparks */}
													<rect x='60' y='45' width='7' height='7' fill='#f59e0b' opacity='0.65' transform='rotate(25 63 48)' className='gz-hr-confetti-float' />
													<rect x='190' y='140' width='6' height='6' fill='#fbbf24' opacity='0.6' transform='rotate(45 193 143)' />
													<rect x='340' y='70' width='8' height='8' fill='#d97706' opacity='0.55' transform='rotate(15 344 74)' className='gz-hr-confetti-float' />
													<circle cx='110' cy='110' r='3.5' fill='#f59e0b' opacity='0.6' />
													<circle cx='280' cy='55' r='4' fill='#fbbf24' opacity='0.7' className='gz-hr-confetti-float' />
													<circle cx='460' cy='95' r='3.5' fill='#f59e0b' opacity='0.55' />
													<circle cx='440' cy='35' r='3' fill='#fbbf24' opacity='0.7' />
													<rect x='220' y='175' width='10' height='4' rx='2' fill='#f59e0b' opacity='0.5' transform='rotate(-20 225 177)' />
													<rect x='130' y='165' width='8' height='4' rx='1' fill='#10b981' opacity='0.55' transform='rotate(35 134 167)' />
													<circle cx='310' cy='155' r='3' fill='#10b981' opacity='0.5' />
												</svg>
											</div>
										)}

										<div className='gz-hr-celebration-header'>
											<div>
												<h3>
													<span style={{ fontSize: '18px' }}>🏆</span> Work Anniversaries
													{hasAnniversaryToday ? (
														<span className='badge badge-light-warning text-warning fw-bold fs-9 py-1 px-2 ms-2'>
															<i className='bi bi-award-fill me-1'></i>Milestone Celebration!
														</span>
													) : hasAnyAnniversaries ? (
														<span className='badge badge-light-warning text-warning fw-bold fs-9 py-1 px-2 ms-2'>
															<i className='bi bi-stars me-1'></i>Milestones Ahead
														</span>
													) : null}
												</h3>
												<p>Cheers to their journey with us!</p>
											</div>
											<Link
												to='/hr/dashboard'
												onClick={() => setShowFullTables(true)}
												className='text-primary fw-bold fs-8 text-hover-primary'>
												View All &rarr;
											</Link>
										</div>

										<div className='gz-hr-celebration-body'>
											{/* Employee list */}
											{loading ? (
												<div className='d-flex align-items-center gap-3 overflow-auto flex-grow-1 py-1'>
													{[1, 2, 3].map((i) => (
														<div key={i} className='text-center' style={{ minWidth: '82px' }}>
															<div className='gz-hr-skeleton symbol symbol-45px symbol-circle mx-auto mb-1'></div>
															<div className='gz-hr-skeleton mx-auto mb-1' style={{ width: '52px', height: '11px', borderRadius: '4px' }}></div>
															<div className='gz-hr-skeleton mx-auto' style={{ width: '40px', height: '9px', borderRadius: '4px' }}></div>
														</div>
													))}
												</div>
											) : upcomingAnniversaries.length > 0 ? (
												<div className='d-flex align-items-center gap-3 overflow-auto flex-grow-1 py-1'>
													{upcomingAnniversaries.slice(0, 3).map((ann) => (
														<div key={ann._id} className='text-center' style={{ minWidth: '82px' }}>
															<div
																className='symbol symbol-45px symbol-circle mx-auto mb-1 position-relative'
																style={{
																	boxShadow: '0 2px 8px rgba(245, 158, 11, 0.22)',
																	border: '2px solid #fde68a',
																}}>
																{ann.photo ? (
																	<img
																		src={`https://files.fggroup.in/${ann.photo}`}
																		alt={ann.name}
																		onError={(e) => {
																			;(e.target as HTMLElement).style.display = 'none'
																		}}
																	/>
																) : (
																	<span className='symbol-label bg-light-warning text-warning fw-bold fs-6'>
																		{ann.name?.charAt(0)}
																	</span>
																)}
																<span
																	className='position-absolute top-0 start-100 translate-middle badge badge-circle bg-warning text-white'
																	style={{
																		width: '16px',
																		height: '16px',
																		fontSize: '9px',
																		display: 'flex',
																		alignItems: 'center',
																		justifyContent: 'center',
																	}}
																	title='Milestone'>
																	⭐
																</span>
															</div>
															<div className='fw-bold text-dark fs-8 text-truncate mb-0' style={{ maxWidth: '85px' }}>
																{ann.name?.split(' ')[0]}
															</div>
															<div className='text-muted fs-10 text-truncate mb-0' style={{ maxWidth: '85px' }}>
																{ann.position || 'Staff'}
															</div>
															<div className='mb-1'>
																<span
																	className='badge badge-light-warning text-warning fw-bolder py-0.5 px-2 fs-10'
																	style={{ border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
																	🏅 {ann.yearsOfService} Year{ann.yearsOfService > 1 ? 's' : ''}
																</span>
															</div>
															<span
																className={`badge py-0 px-2 fs-10 fw-bold ${
																	ann.isToday
																		? 'badge-light-danger border border-danger-subtle'
																		: 'badge-light-warning border border-warning-subtle'
																}`}>
																{ann.dateStr}
															</span>
														</div>
													))}

													{upcomingAnniversaries.length > 3 && (
														<div className='symbol symbol-35px symbol-circle'>
															<span className='symbol-label bg-light-warning text-warning fw-bold fs-8'>
																+{upcomingAnniversaries.length - 3}
															</span>
														</div>
													)}
												</div>
											) : (
												<div className='py-4 text-muted fs-8'>
													<i className='bi bi-award text-warning me-1'></i> No anniversaries in the next 30 days
												</div>
											)}

											{/* Right: Golden Trophy Vector with Streamers */}
											<div className='text-center flex-shrink-0 ps-2' style={{ position: 'relative', overflow: 'hidden' }}>
												<svg width='110' height='90' viewBox='0 0 110 90' fill='none' xmlns='http://www.w3.org/2000/svg' className='gz-hr-trophy-anim'>
													{/* Ribbon Streamers / Confetti */}
													<circle cx='20' cy='20' r='2.5' fill='#f59e0b' />
													<circle cx='92' cy='22' r='2' fill='#ef4444' />
													<circle cx='16' cy='52' r='2' fill='#3b82f6' />
													<circle cx='94' cy='50' r='2.5' fill='#10b981' />

													{/* Red Floating Ribbon */}
													<path d='M18 42 Q30 35 34 48 Q38 60 28 66' stroke='#ef4444' strokeWidth='3.5' strokeLinecap='round' fill='none' />
													<path d='M92 40 Q80 34 76 46 Q72 58 82 64' stroke='#ef4444' strokeWidth='3.5' strokeLinecap='round' fill='none' />

													{/* Trophy Cup */}
													<path d='M38 24 L72 24 C72 44 65 52 55 52 C45 52 38 44 38 24 Z' fill='#f59e0b' />
													<path d='M42 27 L68 27 C68 42 63 48 55 48 C47 48 42 42 42 27 Z' fill='#fbbf24' />

													{/* Light glint running once across trophy cup */}
													<g className='gz-trophy-glint-bar'>
														<rect x='32' y='20' width='8' height='36' fill='#ffffff' opacity='0.55' rx='2' />
													</g>

													{/* Handles */}
													<path d='M38 28 C28 28 26 40 38 43' stroke='#f59e0b' strokeWidth='3.5' fill='none' strokeLinecap='round' />
													<path d='M72 28 C82 28 84 40 72 43' stroke='#f59e0b' strokeWidth='3.5' fill='none' strokeLinecap='round' />

													{/* Stem and Base */}
													<rect x='52' y='52' width='6' height='10' fill='#d97706' />
													<path d='M44 62 L66 62 L68 74 L42 74 Z' fill='#b45309' />
													<rect x='40' y='74' width='30' height='6' fill='#78350f' rx='1' />
												</svg>
												<span
													className='d-block fs-8 fw-bold text-dark'
													style={{ fontFamily: 'Caveat, "Segoe Script", cursive, sans-serif' }}>
													Great Milestone!
												</span>
											</div>
										</div>
									</div>
								</div>
							)
						})()}
					</div>

					{/* =========================================================================
					    SECTION C: COMPACT WORKFORCE METRIC ROW (4 CARDS)
					========================================================================= */}
					<div className='row g-3 g-xl-4 mb-4'>
						{/* 1. Total Employees */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div className='gz-hr-metric-card h-100 d-flex flex-column justify-content-between'>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<div
										className='gz-hr-metric-icon'
										style={{ background: '#eff6ff', color: '#2563eb' }}>
										<i className='bi bi-people-fill'></i>
									</div>
									<div className='gz-hr-sparkline'>
										<span className='gz-hr-spark-bar' style={{ height: '8px', background: '#3b82f6' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '12px', background: '#3b82f6' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '10px', background: '#3b82f6' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '16px', background: '#2563eb' }}></span>
									</div>
								</div>
								<div>
									<div className='gz-hr-metric-title'>Total Employees</div>
									<div className='d-flex align-items-baseline gap-2 my-1'>
										<div className='gz-hr-metric-val'>
											{loading ? (
												<span className='gz-hr-skeleton d-inline-block' style={{ width: '45px', height: '28px', borderRadius: '6px' }}></span>
											) : (
												<NumberTicker value={totalEmployees} />
											)}
										</div>
										<span className='text-success fs-8 fw-bold'>
											&uarr; 4% <span className='text-muted fw-normal fs-9'>vs last month</span>
										</span>
									</div>
								</div>
								<div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light'>
									<span className='text-muted fs-8 fw-semibold'>Active Workforce</span>
									<span className='text-muted fs-8'>&gt;</span>
								</div>
							</div>
						</div>

						{/* 2. Pending Approvals */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div className='gz-hr-metric-card h-100 d-flex flex-column justify-content-between'>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<div
										className='gz-hr-metric-icon'
										style={{ background: '#fff1f2', color: '#e11d48' }}>
										<i className='bi bi-clock-history'></i>
									</div>
									<div className='gz-hr-sparkline'>
										<span className='gz-hr-spark-bar' style={{ height: '7px', background: '#fb7185' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '14px', background: '#fb7185' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '11px', background: '#fb7185' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '17px', background: '#e11d48' }}></span>
									</div>
								</div>
								<div>
									<div className='gz-hr-metric-title'>Pending Approvals</div>
									<div className='d-flex align-items-baseline gap-2 my-1'>
										<div className='gz-hr-metric-val'>
											{loading ? (
												<span className='gz-hr-skeleton d-inline-block' style={{ width: '45px', height: '28px', borderRadius: '6px' }}></span>
											) : (
												<NumberTicker value={pendingApprovalsTotal} />
											)}
										</div>
										<span className='text-danger fs-8 fw-bold'>
											&uarr; 12% <span className='text-muted fw-normal fs-9'>vs last month</span>
										</span>
									</div>
								</div>
								<div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light'>
									<span className='text-muted fs-8 fw-semibold'>
										{loading ? 'Loading...' : `${pendingLeavesCount} Leaves \u2022 ${pendingTasksCount} Tasks`}
									</span>
									<span className='text-muted fs-8'>&gt;</span>
								</div>
							</div>
						</div>

						{/* 3. Agreement Expiry */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div className='gz-hr-metric-card h-100 d-flex flex-column justify-content-between'>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<div
										className='gz-hr-metric-icon'
										style={{ background: '#eff6ff', color: '#0284c7' }}>
										<i className='bi bi-file-earmark-text-fill'></i>
									</div>
									<div className='gz-hr-sparkline'>
										<span className='gz-hr-spark-bar' style={{ height: '12px', background: '#38bdf8' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '9px', background: '#38bdf8' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '15px', background: '#38bdf8' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '11px', background: '#0284c7' }}></span>
									</div>
								</div>
								<div>
									<div className='gz-hr-metric-title'>Agreement Expiry</div>
									<div className='gz-hr-metric-val my-1'>
										{loading ? (
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '45px', height: '28px', borderRadius: '6px' }}></span>
										) : (
											<NumberTicker value={expiringAgreementsCount} />
										)}
									</div>
								</div>
								<div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light'>
									<span
										className={`badge fw-bold fs-8 px-2 py-1 ${
											expiredAgreementsCount > 0 ? 'badge-light-danger' : 'badge-light-primary'
										}`}>
										{expiredAgreementsCount > 0 ? `${expiredAgreementsCount} Expired` : 'Agreements OK'}
									</span>
									<span className='text-muted fs-8'>&gt;</span>
								</div>
							</div>
						</div>

						{/* 4. New Joins */}
						<div className='col-12 col-sm-6 col-xl-3'>
							<div className='gz-hr-metric-card h-100 d-flex flex-column justify-content-between'>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<div
										className='gz-hr-metric-icon'
										style={{ background: '#f0fdf4', color: '#16a34a' }}>
										<i className='bi bi-person-plus-fill'></i>
									</div>
									<div className='gz-hr-sparkline'>
										<span className='gz-hr-spark-bar' style={{ height: '9px', background: '#4ade80' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '12px', background: '#4ade80' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '15px', background: '#4ade80' }}></span>
										<span className='gz-hr-spark-bar' style={{ height: '18px', background: '#16a34a' }}></span>
									</div>
								</div>
								<div>
									<div className='gz-hr-metric-title'>New Joins</div>
									<div className='gz-hr-metric-val my-1'>
										{loading ? (
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '45px', height: '28px', borderRadius: '6px' }}></span>
										) : (
											<NumberTicker value={newJoiners.length || 3} />
										)}
									</div>
								</div>
								<div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light'>
									<span className='text-muted fs-8 fw-semibold'>This Month</span>
									<span className='text-muted fs-8'>&gt;</span>
								</div>
							</div>
						</div>
					</div>

					{/* =========================================================================
					    SECTION D: MAIN OPERATIONAL WORKSPACE (3 COLUMNS)
					========================================================================= */}
					<div className='row g-3 g-xl-4 mb-4'>
						{/* LEFT: Today's Schedule */}
						<div className='col-12 col-lg-4'>
							<div className='gz-hr-card'>
								<div className='gz-hr-card-header'>
									<h3>Today's Schedule</h3>
									<Link to='/hr/task-list' className='text-primary fw-bold fs-8 text-hover-primary'>
										View Calendar &rarr;
									</Link>
								</div>

								<div className='gz-hr-card-body' style={{ maxHeight: '380px' }}>
									<div className='d-flex flex-column'>
										{/* Item 1 */}
										<div className='gz-hr-timeline-row'>
											<span className='gz-hr-time-stamp'>10:00 AM</span>
											<span className='gz-hr-time-dot' style={{ background: '#2563eb' }}></span>
											<div className='gz-hr-time-card'>
												<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
													<div className='gz-hr-item-icon-box' style={{ background: '#eff6ff', color: '#2563eb' }}>
														<i className='bi bi-people'></i>
													</div>
													<div className='overflow-hidden'>
														<span className='fw-bold text-dark fs-8 d-block text-truncate'>Team Meeting</span>
														<span className='text-muted fs-9 d-block text-truncate'>HR Operations</span>
													</div>
												</div>
												<div className='d-flex align-items-center gap-2'>
													<Link to='/hr/task-list' className='btn btn-xs btn-light-primary py-1 px-3 fs-9 fw-bold'>
														Join
													</Link>
													<Dropdown align='end'>
														<Dropdown.Toggle as='button' className='gz-btn-icon-options' title='Options'>
															<i className='bi bi-three-dots-vertical'></i>
														</Dropdown.Toggle>
														<Dropdown.Menu className='shadow-sm py-1 border-light'>
															<Dropdown.Item as={Link} to='/hr/task-list' className='fs-8'>
																<i className='bi bi-info-circle me-2 text-primary'></i>View Details
															</Dropdown.Item>
															<Dropdown.Item as={Link} to='/hr/task-list' className='fs-8'>
																<i className='bi bi-calendar-event me-2 text-muted'></i>Open in Calendar
															</Dropdown.Item>
															<Dropdown.Item onClick={() => toast.success('Meeting link copied!')} className='fs-8'>
																<i className='bi bi-link-45deg me-2 text-muted'></i>Copy Link
															</Dropdown.Item>
														</Dropdown.Menu>
													</Dropdown>
												</div>
											</div>
										</div>

										{/* Item 2 */}
										<div className='gz-hr-timeline-row'>
											<span className='gz-hr-time-stamp'>12:00 PM</span>
											<span className='gz-hr-time-dot' style={{ background: '#ef4444' }}></span>
											<div className='gz-hr-time-card'>
												<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
													<div className='gz-hr-item-icon-box' style={{ background: '#fef2f2', color: '#dc2626' }}>
														<i className='bi bi-file-earmark-check'></i>
													</div>
													<div className='overflow-hidden'>
														<span className='fw-bold text-dark fs-8 d-block text-truncate'>Leave Review</span>
														<span className='text-muted fs-9 d-block text-truncate'>Pending Approvals ({pendingLeavesCount})</span>
													</div>
												</div>
												<div className='d-flex align-items-center gap-2'>
													<Link to='/hr/manual-leave' className='btn btn-xs btn-light-primary py-1 px-3 fs-9 fw-bold'>
														Open
													</Link>
													<Dropdown align='end'>
														<Dropdown.Toggle as='button' className='gz-btn-icon-options' title='Options'>
															<i className='bi bi-three-dots-vertical'></i>
														</Dropdown.Toggle>
														<Dropdown.Menu className='shadow-sm py-1 border-light'>
															<Dropdown.Item as={Link} to='/hr/manual-leave' className='fs-8'>
																<i className='bi bi-calendar2-check me-2 text-primary'></i>Review Leaves
															</Dropdown.Item>
															<Dropdown.Item as={Link} to='/hr/manual-leave' className='fs-8'>
																<i className='bi bi-clock-history me-2 text-muted'></i>Leave History
															</Dropdown.Item>
														</Dropdown.Menu>
													</Dropdown>
												</div>
											</div>
										</div>

										{/* Item 3 */}
										<div className='gz-hr-timeline-row'>
											<span className='gz-hr-time-stamp'>03:00 PM</span>
											<span className='gz-hr-time-dot' style={{ background: '#16a34a' }}></span>
											<div className='gz-hr-time-card'>
												<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
													<div className='gz-hr-item-icon-box' style={{ background: '#f0fdf4', color: '#16a34a' }}>
														<i className='bi bi-person-check'></i>
													</div>
													<div className='overflow-hidden'>
														<span className='fw-bold text-dark fs-8 d-block text-truncate'>New Joiner Onboarding</span>
														<span className='text-muted fs-9 d-block text-truncate'>
															{newJoiners[0]?.full_name || 'Staff Member'}
														</span>
													</div>
												</div>
												<div className='d-flex align-items-center gap-2'>
													<Link to='/hr/employee-view' className='btn btn-xs btn-light-primary py-1 px-3 fs-9 fw-bold'>
														View
													</Link>
													<Dropdown align='end'>
														<Dropdown.Toggle as='button' className='gz-btn-icon-options' title='Options'>
															<i className='bi bi-three-dots-vertical'></i>
														</Dropdown.Toggle>
														<Dropdown.Menu className='shadow-sm py-1 border-light'>
															<Dropdown.Item as={Link} to='/hr/employee-view' className='fs-8'>
																<i className='bi bi-person me-2 text-primary'></i>View Employee
															</Dropdown.Item>
															<Dropdown.Item as={Link} to='/hr/employee-create' className='fs-8'>
																<i className='bi bi-person-plus me-2 text-muted'></i>Add Document
															</Dropdown.Item>
														</Dropdown.Menu>
													</Dropdown>
												</div>
											</div>
										</div>

										{/* Item 4 */}
										<div className='gz-hr-timeline-row'>
											<span className='gz-hr-time-stamp'>04:30 PM</span>
											<span className='gz-hr-time-dot' style={{ background: '#d97706' }}></span>
											<div className='gz-hr-time-card'>
												<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
													<div className='gz-hr-item-icon-box' style={{ background: '#fffbeb', color: '#d97706' }}>
														<i className='bi bi-file-earmark-text'></i>
													</div>
													<div className='overflow-hidden'>
														<span className='fw-bold text-dark fs-8 d-block text-truncate'>Agreement Discussion</span>
														<span className='text-muted fs-9 d-block text-truncate'>
															{expiringDocuments[0]?.documentType || 'Contract Review'}
														</span>
													</div>
												</div>
												<div className='d-flex align-items-center gap-2'>
													<Link to='/hr/dashboard' onClick={() => setShowFullTables(true)} className='btn btn-xs btn-light-primary py-1 px-3 fs-9 fw-bold'>
														Open
													</Link>
													<Dropdown align='end'>
														<Dropdown.Toggle as='button' className='gz-btn-icon-options' title='Options'>
															<i className='bi bi-three-dots-vertical'></i>
														</Dropdown.Toggle>
														<Dropdown.Menu className='shadow-sm py-1 border-light'>
															<Dropdown.Item onClick={() => setShowFullTables(true)} className='fs-8'>
																<i className='bi bi-file-text me-2 text-primary'></i>Open Documents Table
															</Dropdown.Item>
														</Dropdown.Menu>
													</Dropdown>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* CENTER: Leave Requests */}
						<div className='col-12 col-lg-4'>
							<div className='gz-hr-card'>
								<div className='gz-hr-card-header'>
									<div className='d-flex align-items-center gap-2'>
										<h3>Leave Requests</h3>
										<span className='badge badge-light-primary fw-bold fs-8 px-2 py-0'>
											{loading ? (
												<span className='gz-hr-skeleton d-inline-block' style={{ width: '16px', height: '12px', borderRadius: '3px' }}></span>
											) : (
												pendingLeavesCount
											)}
										</span>
									</div>
									<Link to='/hr/manual-leave' className='text-primary fw-bold fs-8 text-hover-primary'>
										View All &rarr;
									</Link>
								</div>

								<div className='gz-hr-card-body' style={{ maxHeight: '380px' }}>
									{loading ? (
										<div className='d-flex flex-column gap-2'>
											{[1, 2, 3].map((i) => (
												<div key={i} className='d-flex align-items-center justify-content-between py-2 border-bottom border-light'>
													<div className='d-flex align-items-center gap-3'>
														<div className='gz-hr-skeleton symbol symbol-38px symbol-circle flex-shrink-0'></div>
														<div>
															<div className='gz-hr-skeleton mb-1' style={{ width: '90px', height: '12px', borderRadius: '4px' }}></div>
															<div className='gz-hr-skeleton' style={{ width: '130px', height: '10px', borderRadius: '4px' }}></div>
														</div>
													</div>
													<div className='d-flex gap-2'>
														<div className='gz-hr-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
														<div className='gz-hr-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
													</div>
												</div>
											))}
										</div>
									) : pendingLeaves.length > 0 ? (
										pendingLeaves.slice(0, 5).map((leave: any) => {
											const empName = leave?.admin_id?.full_name || 'Employee'
											const fromDate = DayJS(leave.from_date)
											const toDate = DayJS(leave.to_date)
											const diff = Math.max(1, toDate.diff(fromDate, 'day') + 1)

											return (
												<div key={leave._id} className='gz-hr-approval-row d-flex align-items-center justify-content-between mb-2'>
													<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
														<div className='symbol symbol-38px symbol-circle flex-shrink-0'>
															<span className='symbol-label bg-light-primary text-primary fw-bold fs-7'>
																{empName.charAt(0)}
															</span>
														</div>
														<div className='overflow-hidden'>
															<span className='fw-bold text-dark fs-8 d-block text-truncate'>
																{empName}
															</span>
															<span className='text-muted fs-9 d-block text-truncate'>
																{leave.leave_type || 'Casual Leave'} &bull; {diff}d ({fromDate.format('DD MMM')} - {toDate.format('DD MMM')})
															</span>
														</div>
													</div>

													<div className='d-flex align-items-center gap-2 flex-shrink-0'>
														<span className='text-muted fs-10 fw-semibold d-none d-sm-inline'>
															{DayJS(leave.createdAt || leave.from_date).fromNow?.() || '2h ago'}
														</span>
														{/* Icon-Only Approve Button with crisp bold SVG checkmark */}
														<button
															type='button'
															className='gz-btn-icon-approve'
															title='Approve Leave'
															onClick={() => handleOpenLeaveModal(leave._id, 'APPROVED')}>
															<svg width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
																<polyline points='3.5 8.5 6.5 11.5 12.5 4.5' />
															</svg>
														</button>
														{/* Icon-Only Reject Button with crisp bold SVG cross */}
														<button
															type='button'
															className='gz-btn-icon-reject'
															title='Reject Leave'
															onClick={() => handleOpenLeaveModal(leave._id, 'REJECTED')}>
															<svg width='13' height='13' viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
																<line x1='3.5' y1='3.5' x2='12.5' y2='12.5' />
																<line x1='12.5' y1='3.5' x2='3.5' y2='12.5' />
															</svg>
														</button>
														{/* Functional 3-Dots Dropdown */}
														<Dropdown align='end'>
															<Dropdown.Toggle as='button' className='gz-btn-icon-options' title='Options'>
															<i className='bi bi-three-dots-vertical'></i>
														</Dropdown.Toggle>
														<Dropdown.Menu className='shadow-sm py-1 border-light'>
															<Dropdown.Item onClick={() => handleOpenLeaveModal(leave._id, 'APPROVED')} className='fs-8 text-success'>
																<i className='bi bi-check-lg me-2'></i>Approve Leave
															</Dropdown.Item>
															<Dropdown.Item onClick={() => handleOpenLeaveModal(leave._id, 'REJECTED')} className='fs-8 text-danger'>
																<i className='bi bi-x-lg me-2'></i>Reject Leave
															</Dropdown.Item>
															<Dropdown.Divider />
															<Dropdown.Item as={Link} to={`/hr/employee-view?employee_id=${leave.admin_id?._id || ''}`} className='fs-8'>
																<i className='bi bi-person me-2 text-primary'></i>View Employee
															</Dropdown.Item>
															<Dropdown.Item as={Link} to='/hr/manual-leave' className='fs-8'>
																<i className='bi bi-clock-history me-2 text-muted'></i>Leave History
															</Dropdown.Item>
														</Dropdown.Menu>
													</Dropdown>
												</div>
											</div>
										)
									})
								) : (
									<div className='text-center py-8 text-muted fs-8'>
										<i className='bi bi-check2-circle text-success fs-3 d-block mb-1'></i>
										All caught up! No pending leave requests
									</div>
								)}
							</div>
						</div>
					</div>

					{/* RIGHT: Pending Tasks */}
					<div className='col-12 col-lg-4'>
						<div className='gz-hr-card'>
							<div className='gz-hr-card-header'>
								<div className='d-flex align-items-center gap-2'>
									<h3>Pending Tasks</h3>
									<span className='badge badge-light-warning fw-bold fs-8 px-2 py-0'>
										{loading ? (
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '22px', height: '12px', borderRadius: '3px' }}></span>
										) : (
											pendingTasksCount
										)}
									</span>
								</div>
								<Link to='/hr/task-list' className='text-primary fw-bold fs-8 text-hover-primary'>
									View All &rarr;
								</Link>
							</div>

							<div className='gz-hr-card-body' style={{ maxHeight: '380px' }}>
								{loading ? (
									<div className='d-flex flex-column gap-2'>
										{[1, 2, 3].map((i) => (
											<div key={i} className='d-flex align-items-center justify-content-between py-2 border-bottom border-light'>
												<div className='d-flex align-items-center gap-3'>
													<div className='gz-hr-skeleton' style={{ width: '38px', height: '38px', borderRadius: '10px' }}></div>
													<div>
														<div className='gz-hr-skeleton mb-1' style={{ width: '110px', height: '12px', borderRadius: '4px' }}></div>
														<div className='gz-hr-skeleton' style={{ width: '140px', height: '10px', borderRadius: '4px' }}></div>
													</div>
												</div>
												<div className='d-flex gap-2'>
													<div className='gz-hr-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
													<div className='gz-hr-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
												</div>
											</div>
										))}
									</div>
								) : pendingTasks.length > 0 ? (
										pendingTasks.slice(0, 5).map((task: any, idx) => (
											<div key={task._id || idx} className='gz-hr-approval-row d-flex align-items-center justify-content-between mb-2'>
												<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
													<div
														className='gz-hr-item-icon-box'
														style={{
															background: idx % 2 === 0 ? '#fffbeb' : '#eff6ff',
															color: idx % 2 === 0 ? '#d97706' : '#2563eb',
														}}>
														<i className='bi bi-journal-text'></i>
													</div>
													<div className='overflow-hidden'>
														<span className='fw-bold text-dark fs-8 d-block text-truncate'>
															{task.task_title || 'Assigned Task'}
														</span>
														<span className='text-muted fs-9 d-block text-truncate'>
															Assigned to {task.full_name || 'Staff'} &bull; Due: {DayJS(task.end_date).format('DD MMM')}
														</span>
													</div>
												</div>

												<div className='d-flex align-items-center gap-2 flex-shrink-0'>
													<span className='text-muted fs-10 fw-semibold d-none d-sm-inline'>
														{DayJS(task.createdAt || task.start_date).fromNow?.() || '2h ago'}
													</span>
													<Link
														to='/hr/task-list'
														className='gz-btn-icon-approve'
														title='Complete / Review Task'>
														<svg width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
															<polyline points='3.5 8.5 6.5 11.5 12.5 4.5' />
														</svg>
													</Link>
													<Link
														to='/hr/task-list'
														className='gz-btn-icon-reject'
														title='Manage Task'>
														<svg width='13' height='13' viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
															<line x1='3.5' y1='3.5' x2='12.5' y2='12.5' />
															<line x1='12.5' y1='3.5' x2='3.5' y2='12.5' />
														</svg>
													</Link>
													{/* Functional 3-Dots Dropdown */}
													<Dropdown align='end'>
														<Dropdown.Toggle as='button' className='gz-btn-icon-options' title='Options'>
															<i className='bi bi-three-dots-vertical'></i>
														</Dropdown.Toggle>
														<Dropdown.Menu className='shadow-sm py-1 border-light'>
															<Dropdown.Item as={Link} to='/hr/task-list' className='fs-8'>
																<i className='bi bi-eye me-2 text-primary'></i>Review Task
															</Dropdown.Item>
															<Dropdown.Item as={Link} to='/hr/task-list' className='fs-8'>
																<i className='bi bi-pencil me-2 text-muted'></i>Edit Details
															</Dropdown.Item>
															<Dropdown.Item as={Link} to='/hr/task-list' className='fs-8 text-success'>
																<i className='bi bi-check2-circle me-2'></i>Mark Complete
															</Dropdown.Item>
														</Dropdown.Menu>
													</Dropdown>
												</div>
											</div>
										))
									) : (
										<div className='text-center py-8 text-muted fs-8'>
											<i className='bi bi-check2-circle text-success fs-3 d-block mb-1'></i>
											No pending tasks in queue
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* =========================================================================
					    SECTION E: BOTTOM DASHBOARD SECTIONS (3 COLUMNS)
					========================================================================= */}
					<div className='row g-3 g-xl-4 mb-4'>
						{/* LEFT: Department Overview */}
						<div className='col-12 col-lg-4'>
							<div className='gz-hr-card'>
								<div className='gz-hr-card-header'>
									<h3>Department Overview</h3>
									<span className='badge badge-light fw-bold fs-9 text-muted py-1 px-2'>
										This Month &or;
									</span>
								</div>

								<div className='gz-hr-card-body' style={{ maxHeight: '340px' }}>
									<div className='d-flex align-items-center justify-content-between gap-3 mb-2 p-2 bg-light rounded-3'>
										{/* Donut Chart */}
										<div
											style={{
												position: 'relative',
												width: '110px',
												height: '110px',
												flexShrink: 0,
											}}>
											<svg viewBox='0 0 36 36' style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
												<path
													d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
													fill='none'
													stroke='#f1f5f9'
													strokeWidth='4'
												/>
												{/* Segment 1: Sales / Top role (Blue) */}
												<path
													d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
													fill='none'
													stroke='#2563eb'
													strokeWidth='4'
													strokeDasharray='30, 100'
												/>
												{/* Segment 2: Development (Sky) */}
												<path
													d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
													fill='none'
													stroke='#0284c7'
													strokeWidth='4'
													strokeDasharray='25, 100'
													strokeDashoffset='-30'
												/>
												{/* Segment 3: Operations (Amber) */}
												<path
													d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
													fill='none'
													stroke='#f59e0b'
													strokeWidth='4'
													strokeDasharray='20, 100'
													strokeDashoffset='-55'
												/>
												{/* Segment 4: HR (Red) */}
												<path
													d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
													fill='none'
													stroke='#ef4444'
													strokeWidth='4'
													strokeDasharray='12, 100'
													strokeDashoffset='-75'
												/>
												{/* Segment 5: Marketing & Others (Green) */}
												<path
													d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
													fill='none'
													stroke='#10b981'
													strokeWidth='4'
													strokeDasharray='13, 100'
													strokeDashoffset='-87'
												/>
											</svg>
											<div
												style={{
													position: 'absolute',
													inset: 0,
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													justifyContent: 'center',
												}}>
												<span className='fw-bolder fs-3 text-dark lh-1'>{loading ? '...' : totalEmployees}</span>
												<span className='text-muted fs-10 fw-semibold text-center mt-1'>Employees</span>
											</div>
										</div>

										{/* Legend */}
										<div className='flex-grow-1 d-flex flex-column gap-1 pe-1'>
											{departmentStats.map((dept, idx) => {
												const colors = ['#2563eb', '#0284c7', '#f59e0b', '#ef4444', '#10b981', '#64748b']
												return (
													<div key={idx} className='d-flex align-items-center justify-content-between fs-8 py-0'>
														<span className='d-flex align-items-center gap-1 text-muted text-truncate me-1'>
															<span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[idx % colors.length] }}></span>
															<span className='text-truncate' style={{ maxWidth: '90px' }}>{dept.name}</span>
														</span>
														<span className='fw-bold text-dark fs-8'>
															{dept.count} <span className='text-muted fw-normal fs-9'>({dept.percent}%)</span>
														</span>
													</div>
												)
											})}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* CENTER: Recent Activity */}
						<div className='col-12 col-lg-4'>
							<div className='gz-hr-card'>
								<div className='gz-hr-card-header'>
									<h3>Recent Activity</h3>
									<Link to='/hr/dashboard' onClick={() => setShowFullTables(true)} className='text-primary fw-bold fs-8'>
										View All &rarr;
									</Link>
								</div>

								<div className='gz-hr-card-body' style={{ maxHeight: '340px' }}>
									<div className='d-flex flex-column gap-3'>
										{/* Activity 1: Leave */}
										<div className='d-flex align-items-center justify-content-between gap-2'>
											<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
												<div
													className='gz-hr-activity-bubble'
													style={{ background: '#ecfdf5', color: '#059669' }}>
													<i className='bi bi-calendar2-check'></i>
												</div>
												<div className='overflow-hidden'>
													<span className='fw-bold text-dark fs-8 d-block text-truncate'>
														{pendingLeaves[0]?.admin_id?.full_name || 'Staff'} submitted a leave request
													</span>
													<span className='text-muted fs-9'>
														2 hours ago
													</span>
												</div>
											</div>
											<div className='d-flex align-items-center gap-2 flex-shrink-0 ms-2'>
												<span className='gz-hr-activity-pill is-leave'>Leave</span>
												<button type='button' className='gz-btn-icon-options' title='Options'>
													<i className='bi bi-three-dots-vertical'></i>
												</button>
											</div>
										</div>

										{/* Activity 2: Agreement */}
										<div className='d-flex align-items-center justify-content-between gap-2'>
											<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
												<div
													className='gz-hr-activity-bubble'
													style={{ background: '#eff6ff', color: '#2563eb' }}>
													<i className='bi bi-file-earmark-check'></i>
												</div>
												<div className='overflow-hidden'>
													<span className='fw-bold text-dark fs-8 d-block text-truncate'>
														Agreement &ldquo;{expiringDocuments[0]?.documentType || 'Contract'}&rdquo; marked for review
													</span>
													<span className='text-muted fs-9'>
														3 hours ago
													</span>
												</div>
											</div>
											<div className='d-flex align-items-center gap-2 flex-shrink-0 ms-2'>
												<span className='gz-hr-activity-pill is-agreement'>Agreement</span>
												<button type='button' className='gz-btn-icon-options' title='Options'>
													<i className='bi bi-three-dots-vertical'></i>
												</button>
											</div>
										</div>

										{/* Activity 3: New Employee */}
										<div className='d-flex align-items-center justify-content-between gap-2'>
											<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
												<div
													className='gz-hr-activity-bubble'
													style={{ background: '#eff6ff', color: '#1e40af' }}>
													<i className='bi bi-person-plus'></i>
												</div>
												<div className='overflow-hidden'>
													<span className='fw-bold text-dark fs-8 d-block text-truncate'>
														New employee &ldquo;{newJoiners[0]?.full_name || 'Yash Parekh'}&rdquo; added
													</span>
													<span className='text-muted fs-9'>
														5 hours ago
													</span>
												</div>
											</div>
											<div className='d-flex align-items-center gap-2 flex-shrink-0 ms-2'>
												<span className='gz-hr-activity-pill is-employee'>Employee</span>
												<button type='button' className='gz-btn-icon-options' title='Options'>
													<i className='bi bi-three-dots-vertical'></i>
												</button>
											</div>
										</div>

										{/* Activity 4: Task */}
										<div className='d-flex align-items-center justify-content-between gap-2'>
											<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
												<div
													className='gz-hr-activity-bubble'
													style={{ background: '#fffbeb', color: '#d97706' }}>
													<i className='bi bi-list-task'></i>
												</div>
												<div className='overflow-hidden'>
													<span className='fw-bold text-dark fs-8 d-block text-truncate'>
														Task &ldquo;{pendingTasks[0]?.task_title || 'Operations Setup'}&rdquo; assigned to staff
													</span>
													<span className='text-muted fs-9'>
														1 day ago
													</span>
												</div>
											</div>
											<div className='d-flex align-items-center gap-2 flex-shrink-0 ms-2'>
												<span className='gz-hr-activity-pill is-task'>Task</span>
												<button type='button' className='gz-btn-icon-options' title='Options'>
													<i className='bi bi-three-dots-vertical'></i>
												</button>
											</div>
										</div>

										{/* Activity 5: Profile */}
										<div className='d-flex align-items-center justify-content-between gap-2'>
											<div className='d-flex align-items-center gap-3 overflow-hidden me-2'>
												<div
													className='gz-hr-activity-bubble'
													style={{ background: '#f5f3ff', color: '#7c3aed' }}>
													<i className='bi bi-person-badge'></i>
												</div>
												<div className='overflow-hidden'>
													<span className='fw-bold text-dark fs-8 d-block text-truncate'>
														Profile details updated for {allEmployees[0]?.full_name || 'Team member'}
													</span>
													<span className='text-muted fs-9'>
														1 day ago
													</span>
												</div>
											</div>
											<div className='d-flex align-items-center gap-2 flex-shrink-0 ms-2'>
												<span className='gz-hr-activity-pill is-profile'>Profile</span>
												<button type='button' className='gz-btn-icon-options' title='Options'>
													<i className='bi bi-three-dots-vertical'></i>
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* RIGHT: Quick Actions */}
						<div className='col-12 col-lg-4'>
							<div className='gz-hr-card'>
								<div className='gz-hr-card-header'>
									<h3>Quick Actions</h3>
									<span className='text-muted fs-8'>
										<i className='bi bi-gear fs-7'></i>
									</span>
								</div>

								<div className='gz-hr-card-body' style={{ maxHeight: '340px' }}>
									<div className='gz-hr-quick-actions-grid'>
										{/* 1. Add Employee */}
										<Link
											to='/hr/employee-create'
											className='gz-hr-quick-action-tile'
											style={{ background: '#eff6ff' }}>
											<div className='gz-hr-tile-icon' style={{ background: '#dbeafe', color: '#2563eb' }}>
												<i className='bi bi-person-plus'></i>
											</div>
											<span className='gz-hr-tile-title'>Add Employee</span>
										</Link>

										{/* 2. Leave Manager */}
										<Link
											to='/hr/manual-leave'
											className='gz-hr-quick-action-tile'
											style={{ background: '#fdf2f8' }}>
											<div className='gz-hr-tile-icon' style={{ background: '#fce7f3', color: '#db2777' }}>
												<i className='bi bi-calendar2-check'></i>
											</div>
											<span className='gz-hr-tile-title'>Leave Manager</span>
										</Link>

										{/* 3. Assign Task */}
										<Link
											to='/hr/task-list'
											className='gz-hr-quick-action-tile'
											style={{ background: '#fffbeb' }}>
											<div className='gz-hr-tile-icon' style={{ background: '#fef3c7', color: '#d97706' }}>
												<i className='bi bi-check2-square'></i>
											</div>
											<span className='gz-hr-tile-title'>Assign Task</span>
										</Link>

										{/* 4. Mark Attendance */}
										<Link
											to='/hr/attendance'
											className='gz-hr-quick-action-tile'
											style={{ background: '#f0fdf4' }}>
											<div className='gz-hr-tile-icon' style={{ background: '#dcfce7', color: '#16a34a' }}>
												<i className='bi bi-check-circle'></i>
											</div>
											<span className='gz-hr-tile-title'>Mark Attendance</span>
										</Link>

										{/* 5. Generate Report */}
										<Link
											to='/hr/employee-view'
											className='gz-hr-quick-action-tile'
											style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
											<div className='gz-hr-tile-icon' style={{ background: '#e2e8f0', color: '#475569' }}>
												<i className='bi bi-file-earmark-bar-graph'></i>
											</div>
											<span className='gz-hr-tile-title'>Generate Report</span>
										</Link>

										{/* 6. Send Announcement */}
										<div
											onClick={() => setShowAnnouncementModal(true)}
											className='gz-hr-quick-action-tile'
											style={{ background: '#f0f9ff' }}>
											<div className='gz-hr-tile-icon' style={{ background: '#e0f2fe', color: '#0284c7' }}>
												<i className='bi bi-megaphone'></i>
											</div>
											<span className='gz-hr-tile-title'>Send Announcement</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* =========================================================================
					    SECTION F: DETAILED WORKFORCE DIRECTORY & TABLES (DIRECT DISPLAY)
					========================================================================= */}
					<div className='gz-hr-card mb-4'>
						<div className='gz-hr-card-header py-3 flex-wrap gap-2'>
							<div className='d-flex align-items-center gap-2'>
								<i className='bi bi-table text-primary fs-5'></i>
								<h3 className='fs-6 m-0'>Detailed Workforce Directory &amp; Tables</h3>
							</div>
							<div className='gz-hr-tabs-nav'>
								<button
									type='button'
									onClick={() => setFullTableTab('anniversaries')}
									className={`gz-hr-tab-btn ${fullTableTab === 'anniversaries' ? 'is-active' : ''}`}>
									<i className='bi bi-award'></i>
									<span>Anniversaries</span>
									<span className='badge badge-light-warning py-0 px-2 fs-9 ms-1'>
										{upcomingAnniversariesCount}
									</span>
								</button>

								<button
									type='button'
									onClick={() => setFullTableTab('documents')}
									className={`gz-hr-tab-btn ${fullTableTab === 'documents' ? 'is-active' : ''}`}>
									<i className='bi bi-file-earmark-check'></i>
									<span>Agreements &amp; Expiries</span>
									<span className='badge badge-light-danger py-0 px-2 fs-9 ms-1'>
										{expiringAgreementsCount}
									</span>
								</button>

								<button
									type='button'
									onClick={() => setFullTableTab('directory')}
									className={`gz-hr-tab-btn ${fullTableTab === 'directory' ? 'is-active' : ''}`}>
									<i className='bi bi-person-lines-fill'></i>
									<span>Employee Directory</span>
									<span className='badge badge-light-primary py-0 px-2 fs-9 ms-1'>
										{totalEmployees}
									</span>
								</button>
							</div>
						</div>

						<div className='p-3'>
							{fullTableTab === 'anniversaries' && (
								<EmployeeAnniversaryTable className='gz-hr-action-card' />
							)}
							{fullTableTab === 'documents' && (
								<ExpiredEmployeeTable className='gz-hr-action-card' />
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