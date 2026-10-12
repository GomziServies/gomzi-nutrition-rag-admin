/* eslint-disable jsx-a11y/anchor-is-valid */
import { faCheck, faPersonWalking, faX } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import { KTIcon } from '../../../../_metronic/helpers'
import { GetEmployees } from '../../../Functions/FGGroup'
import {
	ActionEmployeeLeave,
	GetEmployeeLeaves,
} from '../../../Functions/FGGroup/EmployeeLeaveManagement'
import { GetTask } from '../../../Functions/FGGroup/TaskManagement'
import errorImg from './fixed-404.jpg'
import { DayJS } from '../../../../_metronic/helpers/Utils'

type Props = {
	className: string
}

const TaskNotification: React.FC<Props> = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employeeId: any = searchParams.get('employeeId')
	const [loading, setLoading] = useState(false)
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [leaveData, setLeaveData] = useState<any[]>([])
	const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [status, setStatus] = useState('APPROVED')
	const [remarks, setRemarks] = useState('')

	const fetchAssignTaskData = async (page?: number) => {
		setLoading(true)
		try {
			// Fetch employees data
			const employeeResponse = await GetEmployees()
			let filteredEmployeeData = employeeResponse.data

			// Fetch tasks data
			const response = await GetTask({
				task_id: employeeId,
			})
			let filteredData = response.data

			// Filter tasks with status 'PENDING'
			filteredData = filteredData.filter((el: any) => el.status === 'PENDING')

			// Map through the filtered data to find matching employee full_name
			const assignTaskData = filteredData.map((task: any) => {
				const employee = filteredEmployeeData.find((emp: any) => emp._id === task.admin_id)
				if (employee) {
					return {
						...task,
						full_name: employee.full_name,
					}
				}
				return task // Return the task as-is if no matching employee found
			})

			// Set the assignTaskData state
			setAssignTaskData(assignTaskData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const handleModalClose = () => {
		setShowModal(false)
		setSelectedLeaveId(null)
	}

	const fetchLeaveData = async () => {
		setLoading(true)
		try {
			const response = await GetEmployeeLeaves()
			let filteredData: any = response.data
			filteredData = filteredData.filter((el: any) => el.status == 'PENDING')

			setLeaveData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
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

	const handleApproveAndRejectLeave = (id: string) => {
		setSelectedLeaveId(id)
		setShowModal(true)
	}

	const handleModalSubmit = async () => {
		if (!status) {
			toast.error('Please select a status')
			return
		}

		try {
			const payload: any = {
				leave_id: selectedLeaveId,
				status,
				remarks,
			}
			await ActionEmployeeLeave(payload)
			toast.success(`Leave ${status === 'approved' ? 'Approved' : 'Rejected'} Successfully`)
			setStatus('APPROVED')
			setRemarks('')
			fetchLeaveData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		handleModalClose()
	}

	return (
		<>
			<div
				className='card mb-5 mb-xl-8'
				style={{ height: '524px' }}>
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
										className='fw-bold text-gray-800  fs-6'>
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

				{/* end::Body */}

				<div className=' border-top ms-6'>
					<h3 className='card-title my-4 mt-5 fw-bold text-dark'>Employee Leave</h3>
				</div>
				<div
					className='mx-4 px-4 mb-4'
					style={{ maxHeight: '250px', overflowY: 'auto' }}>
					<div className='my-4'>
						{leaveData.map((leave: any, index: any) => {
							const adminName = leave?.admin_id?.full_name || 'Unknown Employee'
							return (
							<div
								key={index}
								onClick={() => handleApproveAndRejectLeave(leave._id)}
								className='d-flex align-items-center bg-light-success rounded p-4 mb-7'
								style={{ cursor: 'pointer' }}>
								<span className='text-success me-5'>
									<FontAwesomeIcon
										icon={faPersonWalking}
										className='text-success fs-1 me-5'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<div
										className='fw-bold text-gray-800 d-md-block d-none  fs-6'
										onClick={(e) => {
											e.stopPropagation()
											toggleDescription(index)
											handleApproveAndRejectLeave(leave._id)
										}}
										title={adminName}>
										{expandedDescription[index]
											? adminName
											: truncateString(adminName, 15)}
									</div>
									<div
										className='text-gray-500 d-md-block d-none  fs-6'
										onClick={(e) => {
											e.stopPropagation() // Prevent click event propagation to the parent
											toggleDescription(index)
										}}
										title={leave.reason}>
										{expandedDescription[index] ? leave.reason : truncateString(leave.reason, 15)}
									</div>
									<div
										className='text-gray-500 d-md-none d-block  fs-6'
										onClick={(e) => {
											e.stopPropagation() // Prevent click event propagation to the parent
											toggleDescription(index)
										}}
										title={leave.reason}>
										{expandedDescription[index] ? leave.reason : truncateString(leave.reason, 10)}
									</div>
									<span className='text-muted fw-semibold d-block'></span>
									<span className='text-muted fw-semibold d-block'>
										{DayJS(leave.from_date).format('DD/MM/YYYY')} -{' '}
										{DayJS(leave.to_date).format('DD/MM/YYYY')} (
										{(() => {
											const fromDate = DayJS(leave.from_date)
											let toDate = DayJS(leave.to_date)

											const diff = DayJS.duration(toDate.diff(fromDate))

											let days = diff.days()
											const hours = diff.hours()
											const minutes = diff.minutes()

											// If the toDate was adjusted, count it as a full day
											if (toDate.format('HH:mm') === '00:00') {
												days += 1
											}

											if (days === 0 && hours === 0 && minutes === 0) {
												return '0 hours'
											} else if (days === 0) {
												return `${hours}:${minutes < 10 ? '0' + minutes : minutes} hours`
											} else if (hours === 0 && minutes === 0) {
												return `${days} day${days !== 1 ? 's' : ''}`
											} else {
												return `${days} day${days !== 1 ? 's' : ''} ${hours}:${
													minutes < 10 ? '0' + minutes : minutes
												} hours`
											}
										})()}
										)
									</span>
								</div>
								<span className='fw-bold text-success py-1'>Pending</span>
							</div>
							)
						})}

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
			{/* Modal for Approve/Reject Leave */}
			<Modal
				show={showModal}
				centered
				onHide={handleModalClose}>
				<Modal.Header closeButton>
					<Modal.Title>Approve/Reject Leave</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group
							className='mb-3'
							controlId='status'>
							<Form.Label>Status</Form.Label>
							<div className='d-flex mt-3'>
								<Form.Check
									type='radio'
									name='status'
									id='approve'
									value='APPROVED'
									checked={status === 'APPROVED'}
									onChange={(e) => setStatus(e.target.value)}
									className='d-none'
								/>
								<label
									htmlFor='approve'
									className='d-flex align-items-center'>
									<FontAwesomeIcon
										icon={faCheck}
										className={`fs-1 ${status === 'APPROVED' ? 'text-success' : 'text-muted'}`}
									/>
									<b
										className={`ms-2 me-9 ${status === 'APPROVED' ? 'text-success' : 'text-dark'}`}>
										{' '}
										Approve
									</b>
								</label>

								<Form.Check
									type='radio'
									name='status'
									id='reject'
									value='REJECTED'
									checked={status === 'REJECTED'}
									onChange={(e) => setStatus(e.target.value)}
									className='d-none'
								/>
								<label
									htmlFor='reject'
									className='d-flex align-items-center'>
									<FontAwesomeIcon
										icon={faX}
										className={`fs-2 ${status === 'REJECTED' ? 'text-danger' : 'text-muted'}`}
									/>
									<b className={`ms-2 me-5 ${status === 'REJECTED' ? 'text-danger' : 'text-dark'}`}>
										{' '}
										Reject
									</b>
								</label>
							</div>
						</Form.Group>
						<Form.Group
							className='my-3'
							controlId='remarks'>
							<Form.Label className='mt-3'>Remarks</Form.Label>
							<Form.Control
								as='textarea'
								rows={3}
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={handleModalClose}>
						Close
					</Button>
					<Button
						variant='primary'
						onClick={handleModalSubmit}>
						Submit
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export { TaskNotification }
