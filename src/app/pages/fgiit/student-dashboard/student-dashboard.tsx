/* eslint-disable jsx-a11y/anchor-is-valid */
import {
	faArrowUpRightFromSquare,
	faCommentAlt,
	faDiagramProject,
	faDollarSign,
	faDumbbell,
	faFaceSmileBeam,
	faFileLines,
	faGraduationCap,
	faIdBadge,
	faIdCard,
	faPen,
	faUserCheck,
	faUserGraduate,
	faUserShield,
	faUserTimes,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetStudentsStats } from '../../../Functions/FGGroup'

type DashboardStats = {
	counts: {
		alumni: number
		flexible_learning_student: number
		non_alumni: number
		offline_course_student: number
		online_course_student: number
		student_user: number
	}
}

const StudentsDashboard: React.FC = () => {
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)

	const fetchData = async () => {
		try {
			const response: any = await GetStudentsStats()
			setDashboardStats(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Student Dashboard</PageTitle>
			<div className='row'>
				<div className='col-md-6 my-md-0 my-3'>
					<div className='card pt-2 h-100'>
						<div
							className='card-header border-0 pt-2'
							style={{ minHeight: '0px' }}>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold text-dark '>
									Students Overview
								</span>
							</h3>
						</div>
						<div className='card-body pt-3'>
							<Link to='/fgiit/student-user'>
								<div className='row align-items-center mb-7'>
									<div className='col-2 symbol symbol-50px me-5'>
										<span className='symbol-label bg-light-success'>
											<FontAwesomeIcon
												icon={faUserGraduate}
												className='fs-2x text-success'
											/>
										</span>
									</div>
									<div className='col-6 px-0'>
										<a
											href='#'
											className='text-dark  ms-3 fs-md-4 fs-6 fw-bold'>
											Total Students
										</a>
										{/* <br />
                                        <span className='text-muted fw-semibold'>Chirag Manager</span> */}
									</div>
									<div className='col-3 text-end'>
										{dashboardStats ? (
											<p className='text-dark  fs-4 fw-bold'>
												{dashboardStats.counts.student_user}
											</p>
										) : (
											<p>Loading...</p>
										)}
									</div>
								</div>
							</Link>
							<Link to='/fgiit/student-user?alumni=false'>
								<div className='row align-items-center mb-7'>
									<div className='col-2  symbol symbol-50px me-5'>
										<span className='symbol-label bg-light-warning'>
											<FontAwesomeIcon
												icon={faUserCheck}
												className='fs-2x text-warning'
											/>
										</span>
									</div>
									<div className='col-6 px-0'>
										<a
											href='#'
											className='text-dark  ms-3 fs-md-4 fs-6 fw-bold'>
											Active Students
										</a>
										{/* <br />
                                        <span className='text-muted fw-semibold'>Sales Team</span> */}
									</div>
									<div className='col-3 text-end'>
										{dashboardStats ? (
											<p className='text-dark  fs-4 fw-bold'>
												{dashboardStats.counts.non_alumni}
											</p>
										) : (
											<p>Loading...</p>
										)}
									</div>
								</div>
							</Link>
							<Link to='/fgiit/student-user?alumni=true'>
								<div className='row align-items-center mb-7'>
									<div className='col-2  symbol symbol-50px me-5'>
										<span className='symbol-label bg-light-primary'>
											<FontAwesomeIcon
												icon={faCommentAlt}
												className='fs-2x text-primary'
											/>
										</span>
									</div>
									<div className='col-6 px-0'>
										<a
											href='#'
											className='text-dark  ms-3 fs-md-4 fs-6 fw-bold'>
											Alumani Students
										</a>
										{/* <br />
                                        <span className='text-muted fw-semibold'>Video Team</span> */}
									</div>
									<div className='col-3 text-end'>
										{dashboardStats ? (
											<p className='text-dark  fs-4 fw-bold'>
												{dashboardStats.counts.alumni}
											</p>
										) : (
											<p>Loading...</p>
										)}
									</div>
								</div>
							</Link>
							<Link to='/fgiit/student-user?course_category=Online Course'>
								<div className='row align-items-center mb-7'>
									<div className='col-2 symbol symbol-50px me-5'>
										<span className='symbol-label bg-light-danger'>
											<FontAwesomeIcon
												icon={faIdBadge}
												className='fs-2x text-danger'
											/>
										</span>
									</div>
									<div className='col-6 px-0'>
										<a
											href='#'
											className='text-dark  ms-3 fs-md-4 fs-6 fw-bold'>
											Online Course <span className='ms-sm-0 ms-3'>Students</span>
										</a>
										{/* <br />
                                        <span className='text-muted fw-semibold'>Developer Team</span> */}
									</div>
									<div className='col-3 text-end'>
										{dashboardStats ? (
											<p className='text-dark  fs-4 fw-bold'>
												{dashboardStats.counts.online_course_student}
											</p>
										) : (
											<p>Loading...</p>
										)}
									</div>
								</div>
							</Link>
							<Link to='/fgiit/student-user?course_category=Offline Course'>
								<div className='row align-items-center mb-7'>
									<div className='col-2 symbol symbol-50px me-5'>
										<span className='symbol-label bg-light-info'>
											<FontAwesomeIcon
												icon={faUserShield}
												className='fs-2x text-info'
											/>
										</span>
									</div>
									<div className='col-6 px-0'>
										<a
											href='#'
											className='text-dark  ms-3 fs-md-4 fs-6 fw-bold'>
											Offline Students
										</a>
										{/* <br />
                                        <span className='text-muted fw-semibold'>Managers</span> */}
									</div>
									<div className='col-3 text-end'>
										{dashboardStats ? (
											<p className='text-dark  fs-4 fw-bold'>
												{dashboardStats.counts.offline_course_student}
											</p>
										) : (
											<p>Loading...</p>
										)}
									</div>
								</div>
							</Link>
							<Link to='/fgiit/student-user?course_category=Flexible Learning'>
								<div className='row align-items-center'>
									<div className='col-2 symbol symbol-50px me-5'>
										<span className='symbol-label bg-light-success'>
											<FontAwesomeIcon
												icon={faPen}
												className='fs-2x text-success'
											/>
										</span>
									</div>
									<div className='col-6 px-0'>
										<a
											href='#'
											className='text-dark  ms-3 fs-md-4 fs-6 fw-bold'>
											Flexible Students
										</a>
										{/* <br />
                                        <span className='text-muted fw-semibold'>Graphic  Designers</span> */}
									</div>
									<div className='col-3 text-end'>
										{dashboardStats ? (
											<p className='text-dark  fs-4 fw-bold'>
												{dashboardStats.counts.flexible_learning_student}
											</p>
										) : (
											<p>Loading...</p>
										)}
									</div>
								</div>
							</Link>
						</div>
					</div>
				</div>
				<div className='col-md-6 my-md-0 my-3'>
					<div className='card pt-2 h-100'>
						<div
							className='card-header border-0 pt-2'
							style={{ minHeight: '0px' }}>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold text-dark '>Management</span>
							</h3>
						</div>
						<div className='card-body pt-3'>
							<Link to='/fgiit/fitness-courses'>
								<div className='row align-items-center mb-7 px-6 p-3 py-7 bg-light-success rounded'>
									<div className='col-2 p-0'>
										<div className='symbol symbol-50px me-0'>
											<FontAwesomeIcon
												icon={faDumbbell}
												className='fs-2x text-success'
											/>
										</div>
									</div>
									<div className='col-8 px-0'>
										<div className='d-flex flex-column'>
											<a
												href='#'
												className='text-dark  fs-6 fw-bold'>
												Fitness Course
											</a>
										</div>
									</div>
									<div className='col-2 px-0 text-end'>
										<div className='symbol symbol-50px'>
											<FontAwesomeIcon
												icon={faArrowUpRightFromSquare}
												className='fs-2x text-success'
											/>
										</div>
									</div>
								</div>
							</Link>
							<Link to='/fgiit/student-user'>
								<div className='row align-items-center mb-7 px-6 p-3 py-7 bg-light-primary rounded'>
									<div className='col-2 px-0'>
										<div className='symbol symbol-50px me-5'>
											<FontAwesomeIcon
												icon={faUserGraduate}
												className='fs-2x text-primary'
											/>
										</div>
									</div>
									<div className='col-8 px-0'>
										<div className='d-flex flex-column'>
											<a
												href='#'
												className='text-dark  fs-6 fw-bold'>
												Students
											</a>
										</div>
									</div>
									<div className='col-2 px-0 text-end'>
										<div className='symbol symbol-50px'>
											<FontAwesomeIcon
												icon={faArrowUpRightFromSquare}
												className='fs-2x text-primary'
											/>
										</div>
									</div>
								</div>
							</Link>
							<Link to='/fgiit/exam'>
								<div className='row align-items-center mb-7 px-6 py-7 bg-light-warning p-3 rounded'>
									<div className='col-2 px-0'>
										<div className='symbol symbol-50px me-5'>
											<FontAwesomeIcon
												icon={faFaceSmileBeam}
												className='fs-2x text-warning'
											/>
										</div>
									</div>
									<div className='col-8 px-0'>
										<div className='d-flex flex-column'>
											<a
												href='#'
												className='text-dark  fs-6 fw-bold'>
												Exam
											</a>
										</div>
									</div>
									<div className='col-2 px-0 text-end'>
										<div className='symbol symbol-50px'>
											<FontAwesomeIcon
												icon={faArrowUpRightFromSquare}
												className='fs-2x text-warning'
											/>
										</div>
									</div>
								</div>
							</Link>
							<Link to='/fgiit/lectures'>
								<div className='row align-items-center mb-7 px-6 py-7 p-2 bg-light-danger rounded'>
									<div className='col-2 px-0'>
										<div className='symbol symbol-50px me-5'>
											<FontAwesomeIcon
												icon={faFileLines}
												className='fs-2x text-danger'
											/>
										</div>
									</div>
									<div className='col-8 px-0'>
										<div className='d-flex flex-column'>
											<a
												href='#'
												className='text-dark  fs-6 fw-bold'>
												Course Lecture
											</a>
										</div>
									</div>
									<div className='col-2 px-0 text-end'>
										<div className='symbol symbol-50px'>
											<FontAwesomeIcon
												icon={faArrowUpRightFromSquare}
												className='fs-2x text-danger'
											/>
										</div>
									</div>
								</div>
							</Link>
							<Link to='/fgiit/job-placement'>
								<div className='row align-items-center mb-7 px-6 py-7 p-2 bg-light-dark rounded'>
									<div className='col-2 px-0'>
										<div className='symbol symbol-50px me-5'>
											<FontAwesomeIcon
												icon={faGraduationCap}
												className='fs-2x text-dark'
											/>
										</div>
									</div>
									<div className='col-8 px-0'>
										<div className='d-flex flex-column'>
											<a
												href='#'
												className='text-dark  fs-6 fw-bold'>
												Job & Placements
											</a>
										</div>
									</div>
									<div className='col-2 px-0 text-end'>
										<div className='symbol symbol-50px'>
											<FontAwesomeIcon
												icon={faArrowUpRightFromSquare}
												className='fs-2x text-dark'
											/>
										</div>
									</div>
								</div>
							</Link>
							<Link to='/fgiit/student-batch'>
								<div className='row align-items-center mb-7 px-6 py-7 bg-light-primary p-2 rounded'>
									<div className='col-2 px-0'>
										<div className='symbol symbol-50px me-5'>
											<FontAwesomeIcon
												icon={faUserShield}
												className='fs-2x text-primary'
											/>
										</div>
									</div>
									<div className='col-8 px-0'>
										<div className='d-flex flex-column'>
											<a
												href='#'
												className='text-dark  fs-6 fw-bold'>
												Students Batch
											</a>
										</div>
									</div>
									<div className='col-2 px-0 text-end'>
										<div className='symbol symbol-50px'>
											<FontAwesomeIcon
												icon={faArrowUpRightFromSquare}
												className='fs-2x text-primary'
											/>
										</div>
									</div>
								</div>
							</Link>
							<Link to='/fgiit/project-submission'>
								<div className='row align-items-center mb-7 px-6 py-7 bg-light-success p-2 rounded'>
									<div className='col-2 px-0'>
										<div className='symbol symbol-50px me-5'>
											<FontAwesomeIcon
												icon={faDiagramProject}
												className='fs-2x text-success'
											/>
										</div>
									</div>
									<div className='col-8 px-0'>
										<div className='d-flex flex-column'>
											<a
												href='#'
												className='text-dark  fs-6 fw-bold'>
												Project Submission
											</a>
										</div>
									</div>
									<div className='col-2 px-0 text-end'>
										<div className='symbol symbol-50px'>
											<FontAwesomeIcon
												icon={faArrowUpRightFromSquare}
												className='fs-2x text-success'
											/>
										</div>
									</div>
								</div>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export default StudentsDashboard
