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

const TaskNotification: React.FC<Props> = ({ className }) => {
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
				return task
			})

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
			toast.success(`Leave ${status === 'approved' || status === 'APPROVED' ? 'Approved' : 'Rejected'} Successfully`)
			setStatus('APPROVED')
			setRemarks('')
			fetchLeaveData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		handleModalClose()
	}

	const totalPending = assignTaskData.length + leaveData.length

	return (
		<>
			<div className={`card ${className || ''}`}>
				{/* Header */}
				<div className='card-header border-0 pt-5 pb-3 px-6 d-flex align-items-center justify-content-between'>
					<div className='d-flex align-items-center gap-3'>
						<span
							className='symbol symbol-40px'
							style={{
								background: '#ecfdf5',
								color: '#059669',
								borderRadius: '10px',
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '18px',
							}}>
							<i className='bi bi-lightning-charge-fill'></i>
						</span>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h3 className='card-title fw-bold fs-4 m-0 text-dark'>Action Center</h3>
								<span className='badge badge-light-success fw-bold fs-8 px-2 py-1'>
									{totalPending} Pending
								</span>
							</div>
							<span className='text-muted fw-semibold fs-7'>Leaves & task queue</span>
						</div>
					</div>
				</div>

				<div className='card-body py-2 px-6'>
					{/* SECTION 1: LEAVE APPROVALS */}
					<div className='mb-4'>
						<div className='d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-gray-100'>
							<div className='d-flex align-items-center gap-2'>
								<i className='bi bi-calendar2-check text-success fs-6'></i>
								<span className='fw-bold text-dark fs-7'>Leave Requests</span>
								<span className='badge badge-light-success py-0 px-2 fs-9 fw-bold'>
									{leaveData.length}
								</span>
							</div>
							<Link
								to='/hr/manual-leave'
								className='text-primary text-hover-primary fw-semibold fs-8'>
								View All <i className='bi bi-arrow-right fs-9'></i>
							</Link>
						</div>

						<div style={{ maxHeight: '230px', overflowY: 'auto' }}>
							{loading && leaveData.length === 0 ? (
								<div className='text-center py-4 text-muted fs-8'>Loading leaves...</div>
							) : leaveData.length > 0 ? (
								leaveData.map((leave: any, index: any) => {
									const adminName = leave?.admin_id?.full_name || 'Employee'
									const fromDate = DayJS(leave.from_date)
									const toDate = DayJS(leave.to_date)
									const diffDays = Math.max(1, toDate.diff(fromDate, 'day') + 1)

									return (
										<div
											key={leave._id || index}
											onClick={() => handleApproveAndRejectLeave(leave._id)}
											className='gz-hr-leave-item'
											title='Click to Approve or Reject'>
											<div className='symbol symbol-35px me-3'>
												<span className='symbol-label bg-light-success text-success fw-bold fs-7 rounded-circle'>
													{adminName.charAt(0).toUpperCase()}
												</span>
											</div>
											<div className='flex-grow-1 overflow-hidden me-2'>
												<div className='d-flex align-items-center justify-content-between gap-1'>
													<span className='text-dark fw-bold fs-7 text-truncate'>
														{adminName}
													</span>
													<span className='badge badge-light-warning py-0 px-1 fs-9 fw-bold'>
														{diffDays}d
													</span>
												</div>
												<span className='text-muted fs-8 fw-semibold d-block text-truncate'>
													{leave.reason || 'Leave requested'}
												</span>
												<span className='text-muted fs-9 d-block'>
													{fromDate.format('DD MMM')} - {toDate.format('DD MMM YYYY')}
												</span>
											</div>
											<button
												type='button'
												className='btn btn-xs btn-light-success px-2 py-1 fs-9 fw-bold flex-shrink-0'
												onClick={(e) => {
													e.stopPropagation()
													handleApproveAndRejectLeave(leave._id)
												}}>
												Review
											</button>
										</div>
									)
								})
							) : (
								<div className='text-center py-4 text-muted fs-8'>
									<i className='bi bi-check-circle me-1 text-success'></i>
									No pending leave requests
								</div>
							)}
						</div>
					</div>

					{/* SECTION 2: TASK MANAGEMENT */}
					<div>
						<div className='d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-gray-100'>
							<div className='d-flex align-items-center gap-2'>
								<i className='bi bi-list-task text-warning fs-6'></i>
								<span className='fw-bold text-dark fs-7'>Pending Tasks</span>
								<span className='badge badge-light-warning py-0 px-2 fs-9 fw-bold'>
									{assignTaskData.length}
								</span>
							</div>
							<Link
								to='/hr/task-list'
								className='text-primary text-hover-primary fw-semibold fs-8'>
								View All <i className='bi bi-arrow-right fs-9'></i>
							</Link>
						</div>

						<div style={{ maxHeight: '230px', overflowY: 'auto' }}>
							{loading && assignTaskData.length === 0 ? (
								<div className='text-center py-4 text-muted fs-8'>Loading tasks...</div>
							) : assignTaskData.length > 0 ? (
								assignTaskData.map((task: any, index: any) => (
									<Link
										to='/hr/task-list'
										key={task._id || index}
										className='text-decoration-none'>
										<div className='gz-hr-task-item'>
											<div className='symbol symbol-35px me-3'>
												<span className='symbol-label bg-light-warning text-warning fw-bold fs-7 rounded-circle'>
													<i className='bi bi-check2-circle fs-6 text-warning'></i>
												</span>
											</div>
											<div className='flex-grow-1 overflow-hidden me-2'>
												<span className='text-dark fw-bold fs-7 d-block text-truncate'>
													{task.task_title || 'Assigned Task'}
												</span>
												<span className='text-muted fs-8 fw-semibold d-block text-truncate'>
													{task.full_name || 'Assigned member'}
												</span>
												<span className='text-muted fs-9 d-block'>
													Due: {DayJS(task.end_date).format('DD MMM YYYY')}
												</span>
											</div>
											<span className='badge badge-light-warning py-1 px-2 fs-9 fw-bold flex-shrink-0'>
												Pending
											</span>
										</div>
									</Link>
								))
							) : (
								<div className='text-center py-4 text-muted fs-8'>
									<i className='bi bi-check-circle me-1 text-success'></i>
									No pending tasks in queue
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Modal for Approve/Reject Leave */}
			<Modal
				show={showModal}
				centered
				onHide={handleModalClose}>
				<Modal.Header closeButton className='border-0 pb-0'>
					<Modal.Title className='fw-bold fs-4'>Review Employee Leave</Modal.Title>
				</Modal.Header>
				<Modal.Body className='pt-3'>
					<Form>
						<Form.Group className='mb-4' controlId='status'>
							<Form.Label className='fw-bold fs-7 text-dark mb-2'>Decision</Form.Label>
							<div className='d-flex gap-3'>
								<label
									htmlFor='approve'
									className={`flex-fill p-3 rounded border d-flex align-items-center gap-2 cursor-pointer transition ${
										status === 'APPROVED'
											? 'border-success bg-light-success text-success fw-bold'
											: 'border-gray-200 text-muted'
									}`}
									style={{ cursor: 'pointer' }}>
									<Form.Check
										type='radio'
										name='status'
										id='approve'
										value='APPROVED'
										checked={status === 'APPROVED'}
										onChange={(e) => setStatus(e.target.value)}
										className='me-1'
									/>
									<FontAwesomeIcon icon={faCheck} className='fs-6' />
									<span>Approve Request</span>
								</label>

								<label
									htmlFor='reject'
									className={`flex-fill p-3 rounded border d-flex align-items-center gap-2 cursor-pointer transition ${
										status === 'REJECTED'
											? 'border-danger bg-light-danger text-danger fw-bold'
											: 'border-gray-200 text-muted'
									}`}
									style={{ cursor: 'pointer' }}>
									<Form.Check
										type='radio'
										name='status'
										id='reject'
										value='REJECTED'
										checked={status === 'REJECTED'}
										onChange={(e) => setStatus(e.target.value)}
										className='me-1'
									/>
									<FontAwesomeIcon icon={faX} className='fs-6' />
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
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
								className='fs-7'
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer className='border-0 pt-0'>
					<Button
						variant='light'
						size='sm'
						onClick={handleModalClose}>
						Cancel
					</Button>
					<Button
						variant={status === 'APPROVED' ? 'success' : 'danger'}
						size='sm'
						onClick={handleModalSubmit}>
						Confirm {status === 'APPROVED' ? 'Approval' : 'Rejection'}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export { TaskNotification }
