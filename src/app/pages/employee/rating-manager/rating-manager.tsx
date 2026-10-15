import { faCheckCircle, faClock, faStar, faTasks } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import { GetEmployeeRating } from '../../../Functions/FGGroup/Employee'
import { Charts1 } from '../../hr/reports/Charts1'

const EmployeeRatingManager: React.FC = () => {
	const [rattingData, setRattingData] = useState<any>({})
	const [loading, setLoading] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	const getStoredEmployee = () => {
		try {
			const raw =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			return raw ? JSON.parse(raw) : {}
		} catch {
			return {}
		}
	}

	const fetchRatingData = async () => {
		setLoading(true)
		try {
			const employee = getStoredEmployee()
			const empId = employee?._id || employee?.id
			if (!empId) {
				setLoading(false)
				return
			}

			let startDate: any
			let endDate: any

			if (selectedDateRange) {
				startDate = new Date(selectedDateRange[0])
				startDate.setHours(0, 0, 0, 0)

				endDate = new Date(selectedDateRange[1])
				endDate.setHours(23, 59, 59, 999)
			} else {
				const now = new Date()
				startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
				endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
			}

			const response: any = await GetEmployeeRating({
				admin_id: empId,
				from_date: startDate,
				to_date: endDate,
			})
			const data: any = response?.data || []
			setRattingData(data[0] || {})
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchRatingData()
	}, [selectedDateRange])

	const totalTasks = parseInt(rattingData?.total_task || '0', 10)
	const completedTasks = parseInt(rattingData?.completed_task || '0', 10)
	const pendingTasks = Math.max(0, totalTasks - completedTasks)
	const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
	const ratingValue = Number(rattingData?.rating || 0)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Performance & Rating</PageTitle>

			<div className='card shadow-sm border-0 mb-6' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div>
						<h3 className='fw-bolder text-gray-900 m-0'>Performance Overview</h3>
						<span className='text-muted fs-7'>View your task completion metrics and manager ratings</span>
					</div>
					<div className='d-flex align-items-center gap-3'>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							leftValue='-270px'
							lastMonth={true}
						/>
					</div>
				</div>

				<div className='card-body py-4 px-6'>
					{loading ? (
						<div className='d-flex justify-content-center align-items-center py-12'>
							<div className='spinner-border text-primary' role='status'>
								<span className='visually-hidden'>Loading...</span>
							</div>
						</div>
					) : Object.keys(rattingData || {}).length === 0 ? (
						<div className='d-flex flex-column align-items-center justify-content-center py-12 text-center'>
							<div className='symbol symbol-60px mb-4'>
								<span className='symbol-label bg-light-warning text-warning fs-2'>⭐</span>
							</div>
							<h5 className='fw-bold text-gray-800 mb-1'>No Rating Records Found</h5>
							<p className='text-muted fs-7 mb-0'>Try selecting a different date range to view your rating report.</p>
						</div>
					) : (
						<>
							{/* Top Rating Banner */}
							<div className='p-5 mb-6 rounded-3' style={{ background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)', border: '1px solid #e0e7ff' }}>
								<div className='d-flex flex-wrap align-items-center justify-content-between gap-4'>
									<div className='d-flex align-items-center gap-4'>
										<div className='d-flex align-items-center justify-content-center bg-white shadow-sm' style={{ width: '64px', height: '64px', borderRadius: '14px' }}>
											<FontAwesomeIcon icon={faStar} className='text-warning fs-1' />
										</div>
										<div>
											<div className='fs-7 text-muted text-uppercase fw-bolder tracking-wider'>Manager Rating</div>
											<div className='d-flex align-items-center gap-2 mt-1'>
												<span className='fs-2hx fw-bolder text-gray-900'>{ratingValue > 0 ? ratingValue.toFixed(1) : 'N/A'}</span>
												<span className='fs-4 text-muted fw-bold'>/ 5.0</span>
												<div className='ms-3 d-flex align-items-center gap-1'>
													{ratingValue > 0 ? (
														Array.from({ length: Math.round(ratingValue) }).map((_, i) => (
															<FontAwesomeIcon key={i} icon={faStar} className='text-warning fs-4' />
														))
													) : (
														<span className='badge badge-light-secondary fs-8'>Unrated</span>
													)}
												</div>
											</div>
										</div>
									</div>
									<div className='d-flex align-items-center gap-3'>
										<div className='text-end'>
											<div className='fs-7 text-muted fw-semibold'>Overall Efficiency</div>
											<div className='fs-3 fw-bolder text-primary'>{completionRate}%</div>
										</div>
										<div className='progress w-100px bg-secondary' style={{ height: '8px', borderRadius: '4px' }}>
											<div
												className='progress-bar bg-primary'
												role='progressbar'
												style={{ width: `${completionRate}%` }}
												aria-valuenow={completionRate}
												aria-valuemin={0}
												aria-valuemax={100}
											/>
										</div>
									</div>
								</div>
							</div>

							{/* 3 KPI Metric Cards */}
							<div className='row g-4 mb-6'>
								<div className='col-md-4'>
									<div className='card border border-gray-200 shadow-none p-5 h-100' style={{ borderRadius: '12px' }}>
										<div className='d-flex align-items-center justify-content-between mb-3'>
											<span className='text-muted fs-7 fw-bolder text-uppercase'>Total Tasks</span>
											<span className='badge badge-light-primary p-2 rounded-circle'>
												<FontAwesomeIcon icon={faTasks} className='text-primary fs-5' />
											</span>
										</div>
										<div className='fs-2hx fw-bolder text-gray-900 mb-1'>{totalTasks}</div>
										<span className='text-muted fs-8'>Total assigned tasks in period</span>
									</div>
								</div>

								<div className='col-md-4'>
									<div className='card border border-gray-200 shadow-none p-5 h-100' style={{ borderRadius: '12px' }}>
										<div className='d-flex align-items-center justify-content-between mb-3'>
											<span className='text-muted fs-7 fw-bolder text-uppercase'>Completed Tasks</span>
											<span className='badge badge-light-success p-2 rounded-circle'>
												<FontAwesomeIcon icon={faCheckCircle} className='text-success fs-5' />
											</span>
										</div>
										<div className='fs-2hx fw-bolder text-success mb-1'>{completedTasks}</div>
										<span className='text-muted fs-8'>Successfully delivered</span>
									</div>
								</div>

								<div className='col-md-4'>
									<div className='card border border-gray-200 shadow-none p-5 h-100' style={{ borderRadius: '12px' }}>
										<div className='d-flex align-items-center justify-content-between mb-3'>
											<span className='text-muted fs-7 fw-bolder text-uppercase'>Pending Tasks</span>
											<span className='badge badge-light-warning p-2 rounded-circle'>
												<FontAwesomeIcon icon={faClock} className='text-warning fs-5' />
											</span>
										</div>
										<div className='fs-2hx fw-bolder text-warning mb-1'>{pendingTasks}</div>
										<span className='text-muted fs-8'>In progress or awaiting review</span>
									</div>
								</div>
							</div>

							{/* Chart Section */}
							<div className='card border border-gray-200 shadow-none p-5' style={{ borderRadius: '12px' }}>
								<h4 className='fw-bold text-gray-800 mb-4'>Task Completion Breakdown</h4>
								<div className='d-flex justify-content-center align-items-center'>
									<Charts1 rattingData={rattingData} className='w-100' />
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	)
}

export default EmployeeRatingManager
