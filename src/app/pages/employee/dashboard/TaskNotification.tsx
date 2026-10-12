/* eslint-disable jsx-a11y/anchor-is-valid */
import { faPersonWalking } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { KTIcon } from '../../../../_metronic/helpers'
import { GetEmployees } from '../../../Functions/FGGroup'
import { GetEmployeeLeaves } from '../../../Functions/FGGroup/EmployeeLeaveManagement'
import { GetTask } from '../../../Functions/FGGroup/TaskManagement'
import errorImg from './fixed-404.jpg'
import { DayJS } from '../../../../_metronic/helpers/Utils'

type Props = {
	className: string
}

const TaskNotification: React.FC<Props> = ({ className }) => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employeeId: any = searchParams.get('employeeId')
	const [loading, setLoading] = useState(false)
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [leaveData, setLeaveData] = useState<any[]>([])
	const [showTaskSection, setShowTaskSection] = useState(true)

	const fetchAssignTaskData = async () => {
		setLoading(true)
		try {
			const employeeResponse = await GetEmployees()
			let filteredEmployeeData = employeeResponse.data
			const response = await GetTask({
				task_id: employeeId,
			})
			let filteredData = response.data

			filteredData = filteredData.filter((el: any) => el.status === 'PENDING')
			const assignTaskData = filteredData.map((task: any) => {
				const employee = filteredEmployeeData.find((emp: any) => emp.employee_id === task.admin_id)
				if (employee) {
					return {
						...task,
						full_name: employee.full_name,
					}
				}
				return task
			})

			setAssignTaskData(assignTaskData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchLeaveData = async () => {
		setLoading(true)
		try {
			const response = await GetEmployeeLeaves()
			const data: any = response.data
			const adminData: any = localStorage.getItem('fg_group_info')
			const filteredData = data.filter(
				(leave: any) => leave?.admin_id?._id == JSON.parse(adminData)?._id
			)
			setLeaveData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		const adminType: any = localStorage.getItem('admin')
		if (adminType === 'Employee') {
			setShowTaskSection(false)
		}
		fetchAssignTaskData()
		fetchLeaveData()
	}, [])

	const [expandedDescription, setExpandedDescription] = useState<{ [key: number]: boolean }>({})

	const toggleDescription = (index: number) => {
		setExpandedDescription((prevState) => ({
			...prevState,
			[index]: !prevState[index],
		}))
	}

	const truncateString = (str: any, num: any) => {
		if (!str || typeof str !== 'string') {
			return ''
		}
		if (str.length <= num) {
			return str
		}
		return str.slice(0, num) + '...'
	}

	return (
		<div
			className='card mb-5 mb-xl-8'
			style={{ height: '524px' }}>
			{showTaskSection && (
				<>
					<div className='my-6 mb-2 ms-2 px-4 border-0'>
						<h3 className='card-title m-0 fw-bold text-dark'>Task Management</h3>
					</div>
					<div
						className='card-body border-bottom pt-0'
						style={{ maxHeight: '210px', overflowY: 'auto' }}>
						{assignTaskData.map((task: any, index: any) => (
							<Link
								to={`/hr/task-list`}
								key={index}>
								<div className='d-flex align-items-center bg-light-warning rounded p-4 mb-7'>
									<span className=' text-warning me-5'>
										<KTIcon
											iconName='abstract-26'
											className='text-warning fs-1 me-5'
										/>
									</span>
									<div className='flex-grow-1 me-2'>
										<a
											href='#'
											className='fw-bold text-gray-800 text-hover-primary fs-6'>
											{task.full_name}
										</a>
										<span className='text-muted fw-semibold d-block text-gray-600'>
											{task.task_title}
										</span>
										<span className='text-muted fw-semibold d-block'>
											{DayJS(task.start_date).format('DD/MM/YYYY')} -{' '}
											{DayJS(task.end_date).format('DD/MM/YYYY')}
										</span>
									</div>
									<span className='fw-bold text-warning py-1'>Pending</span>
								</div>
							</Link>
						))}
						{assignTaskData.length === 0 && !loading && (
							<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center mt-5'>
								<div>
									<img
										src={errorImg}
										alt='demo'
										width='50%'
									/>
								</div>
								<h5>No records found</h5>
							</div>
						)}
					</div>
				</>
			)}

			{/* end::Body */}

			<div className=' border-top ms-6'>
				<h3 className='card-title my-4 mt-5 fw-bold text-dark'>Employee Leave</h3>
			</div>
			<div
				className='mx-4 px-4 mb-4'
				style={{ maxHeight: showTaskSection ? '250px' : '100%', overflowY: 'auto' }}>
				<div className='my-4'>
					{leaveData.map((leave: any, index: any) => (
						<Link
							to={`/hr/leave`}
							key={index}>
							<div className='d-flex align-items-center bg-light-success rounded p-4 mb-7'>
								<span className=' text-success me-5'>
									<FontAwesomeIcon
										icon={faPersonWalking}
										className='text-success fs-1 me-5'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<a
										href='#'
										className='fw-bold text-gray-800 d-md-block d-none text-hover-primary fs-6'
										onClick={() => toggleDescription(index)}
										title={leave.admin_id.full_name}
										style={{ cursor: 'pointer' }}>
										{expandedDescription[index]
											? leave.admin_id.full_name
											: truncateString(leave.admin_id.full_name, 15)}
									</a>
									<a
										href='#'
										className='text-gray-500 d-md-block d-none text-hover-primary fs-6'
										onClick={() => toggleDescription(index)}
										title={leave.reason}
										style={{ cursor: 'pointer' }}>
										{expandedDescription[index] ? leave.reason : truncateString(leave.reason, 15)}
									</a>
									<a
										href='#'
										className='text-gray-500 d-md-none d-block text-hover-primary fs-6'
										style={{ cursor: 'pointer' }}
										title={leave.reason}
										onClick={() => toggleDescription(index)}>
										{expandedDescription[index] ? leave.reason : truncateString(leave.reason, 10)}
									</a>
									<span className='text-muted fw-semibold d-block'>
										{DayJS(leave.to_date).format('DD/MM/YYYY')} -{' '}
										{DayJS(leave.from_date).format('DD/MM/YYYY')}
									</span>
								</div>
								<span className='fw-bold text-success py-1'>Pending</span>
							</div>
						</Link>
					))}
					{leaveData.length === 0 && !loading && (
						<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center mt-5'>
							<div>
								<img
									src={errorImg}
									alt='demo'
									width='50%'
								/>
							</div>
							<h5>No records found</h5>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export { TaskNotification }
