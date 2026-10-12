import { faCheck, faPlusCircle, faX } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import duration from 'dayjs/plugin/duration'
import React, { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	ActionEmployeeLeave,
	GetEmployeeLeaves,
} from '../../../Functions/FGGroup/EmployeeLeaveManagement'
DayJS.extend(duration)

const HRLeave: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [leaveData, setLeaveData] = useState<any[]>([])
	const [showModal, setShowModal] = useState(false)
	const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null)
	const [remarks, setRemarks] = useState('')
	const [status, setStatus] = useState('')
	const [expandedDescription, setExpandedDescription] = useState<{ [key: number]: boolean }>({})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const fetchLeaveData = async () => {
		setLoading(true)
		try {
			const response = await GetEmployeeLeaves()
			const data: any = response.data

			const sortedData = data.sort((a: any, b: any) => {
				if (a.status?.toUpperCase() === 'PENDING' && b.status?.toUpperCase() !== 'PENDING')
					return -1
				if (a.status?.toUpperCase() !== 'PENDING' && b.status?.toUpperCase() === 'PENDING') return 1

				return new Date(b.from_date).getTime() - new Date(a.from_date).getTime()
			})

			setLeaveData(sortedData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchLeaveData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const handleApproveAndRejectLeave = (id: string) => {
		setSelectedLeaveId(id)
		setShowModal(true)
	}

	const handleModalClose = () => {
		setShowModal(false)
		setSelectedLeaveId(null)
		setRemarks('')
		setStatus('')
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
			toast.success(`Leave ${status === 'APPROVED' ? 'Approved' : 'Rejected'} Successfully`)
			fetchLeaveData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		handleModalClose()
	}

	const sortableFields = [
		{ title: 'Name', field: 'name' },
		{ title: 'Start Date', field: 'from_date' },
		{ title: 'End Date', field: 'to_date' },
		{ title: 'Time', field: 'time' },
		{ title: 'Reason', field: 'reason' },
		{ title: 'Status', field: 'status' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const filteredData = leaveData.filter((sale: any) =>
		(sale?.admin_id?.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
	)
	const paginatedData = filteredData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

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
		<>
			<PageTitle breadcrumbs={[]}>Employee Leave</PageTitle>
			<div
				className='accordion'
				id='kt_accordion_1'>
				<KTCard className='accordion-item mt-5'>
					<div
						id='kt_accordion_1_body_1'
						className='accordion-collapse collapse show'>
						<div className='row mx-6 my-4'>
							<div className='col-12'>
								<div className='row align-items-center justify-content-between'>
									<div className='col-md-6'>
										<SearchFilter
											searchTerm={searchTerm}
											setSearchTerm={setSearchTerm}
										/>
									</div>
									<div className='col-md-6 d-flex justify-content-end mt-md-0 mt-3'>
										<LengthMenu
											expenseData={leaveData}
											handleItemsPerPageChange={handlePageChange}
										/>
									</div>
								</div>
							</div>
						</div>
						<div className='py-4 card-body'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
									<thead>
										<tr className='fw-bold text-muted bg-light border-bottom-0'>
											<th className='ps-4 rounded-start'>No.</th>
											<th>Name</th>
											<th>Start Date</th>
											<th>End Date</th>
											<th>Time</th>
											<th>Reason</th>
											<th>Status</th>
											<th className='ps-4 rounded-end'>Action</th>
										</tr>
									</thead>
									<tbody>
										{paginatedData.map((leave: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1

											return (
												<>
													<tr
														onClick={() => handleRowClick(leave._id)}
														className='data-row'>
														<td className='text-center'>
															<div className='d-flex'>
																<FontAwesomeIcon
																	icon={faPlusCircle}
																	className='mx-2 ms-5 mb-1 plus-icon'
																	style={{ color: '#607D8B', fontSize: '18px' }}
																/>
																<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																	{actualIndex}
																</span>
															</div>
														</td>
														<td>
															<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																{leave?.admin_id?.full_name}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																{DayJS(leave.from_date).format('DD/MM/YYYY hh:mm A')}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																{DayJS(leave.to_date).format('DD/MM/YYYY hh:mm A')}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  d-block mb-1 fs-6'>
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
																		return `${hours}:${
																			minutes < 10 ? '0' + minutes : minutes
																		} hours`
																	} else if (hours === 0 && minutes === 0) {
																		return `${days} day${days !== 1 ? 's' : ''}`
																	} else {
																		return `${days} day${days !== 1 ? 's' : ''} ${hours}:${
																			minutes < 10 ? '0' + minutes : minutes
																		} hours`
																	}
																})()}
															</span>
														</td>
														<td>
															<span
																className='text-dark fw-bold  d-md-block d-none mb-1 fs-6'
																onClick={() => toggleDescription(index)}
																title={leave.reason}
																style={{ cursor: 'pointer' }}>
																{expandedDescription[index]
																	? leave.reason
																	: truncateString(leave.reason, 100)}
															</span>
															<span
																className='text-dark fw-bold  d-md-none d-block mb-1 fs-6'
																style={{ cursor: 'pointer' }}
																title={leave.reason}
																onClick={() => toggleDescription(index)}>
																{expandedDescription[index]
																	? leave.reason
																	: truncateString(leave.reason, 20)}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																{leave.status?.toUpperCase() === 'APPROVED' ? (
																	<span className='badge badge-light-success py-3 px-4 fs-7'>
																		Approved
																	</span>
																) : leave.status?.toUpperCase() === 'REJECTED' ? (
																	<span className='badge badge-light-danger py-3 px-4 fs-7'>
																		Rejected
																	</span>
																) : (
																	<span className='badge badge-light-warning py-3 px-4 fs-7'>
																		Pending
																	</span>
																)}
															</span>
														</td>
														<td>
															{leave.status?.toUpperCase() === 'APPROVED' ||
															leave.status?.toUpperCase() === 'REJECTED' ? (
																'Decision Made'
															) : (
																<TableButton
																	action='edit'
																	onClick={() => handleApproveAndRejectLeave(leave._id)}
																	text='Action'
																/>
															)}
														</td>
													</tr>
													{/* {isVisible && (
												<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
													<td colSpan={12}>
														<div>
															<strong>{sortableFields[0].title}:</strong>{' '}
															{leave?.admin_id?.full_name}
															<br />
															<strong>{sortableFields[1].title}:</strong>{' '}
															{DayJS(leave.from_date).format('DD/MM/YYYY hh:mm A')}
															<br />
															<strong>{sortableFields[2].title}:</strong>{' '}
															{DayJS(leave.to_date).format('DD/MM/YYYY hh:mm A')}
															<br />
															<strong>{sortableFields[3].title}:</strong>{' '}
															{(() => {
																const fromDate = DayJS(leave.from_date)
																const toDate = DayJS(leave.to_date)
																const diff = DayJS.duration(toDate.diff(fromDate))

																const days = diff.days()
																const hours = diff.hours()
																const minutes = diff.minutes()

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
															<br />
															<strong>{sortableFields[4].title}:</strong>
															<span
																className='text-dark  d-md-none d-block mb-3 fs-6'
																style={{ cursor: 'pointer' }}
																title={leave.reason}
																onClick={() => toggleDescription(index)}>
																{expandedDescription[index]
																	? leave.reason
																	: truncateString(leave.reason, 73)}
															</span>
															<strong>{sortableFields[5].title}:</strong>{' '}
															{leave.status === 'APPROVED' ? (
																<span className='badge badge-light-success py-3 px-4 fs-7'>
																	Approved
																</span>
															) : leave.status === 'REJECTED' ? (
																<span className='badge badge-light-danger py-3 px-4 fs-7'>
																	Rejected
																</span>
															) : (
																<span className='badge badge-light-warning py-3 px-4 fs-7'>
																	Pending
																</span>
															)}
														</div>
													</td>
												</tr>
											)} */}
												</>
											)
										})}
									</tbody>
								</table>
							</div>
							{filteredData.length === 0 && !loading && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
							{filteredData.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(filteredData.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					</div>
				</KTCard>
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

export default HRLeave
