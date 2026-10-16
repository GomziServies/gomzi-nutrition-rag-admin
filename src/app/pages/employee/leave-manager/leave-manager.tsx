import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import {
	CreateEmployeeLeave,
	GetEmployeeLeaves,
} from '../../../Functions/FGGroup/EmployeeLeaveManagement'

interface PaginationState {
	page: number
	itemsPerPage: number
}

const EmployeeLeaveManager: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState(
		() => localStorage.getItem('emp_leave_manager_searchTerm') || ''
	)
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [leaveData, setLeaveData] = useState<any[]>([])
	const [showModal, setShowModal] = useState(false)
	const [fromDate, setFromDate] = useState('')
	const [toDate, setToDate] = useState('')
	const [reason, setReason] = useState('')
	const [leaveType, setLeaveType] = useState('full')
	const [halfDayPeriod, setHalfDayPeriod] = useState('')
	const [submitLoading, setSubmitLoading] = useState(false)

	const [pagination, setPagination] = useState<PaginationState>(() => {
		try {
			const saved = localStorage.getItem('emp_leave_manager_pagination')
			return saved ? JSON.parse(saved) : { page: 1, itemsPerPage: 10 }
		} catch (e) {
			return { page: 1, itemsPerPage: 10 }
		}
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const fetchLeaveData = async () => {
		const raw =
			localStorage.getItem('fg_group_user_info') ||
			localStorage.getItem('fg_group_info') ||
			localStorage.getItem('auth_fg_group')
		let employeeId: any = null
		if (raw) {
			try {
				const parsed = JSON.parse(raw)
				employeeId = parsed._id || parsed.employee_id
			} catch (e) {
				console.error(e)
			}
		}

		if (!employeeId) return

		setLoading(true)
		try {
			const response = await GetEmployeeLeaves()
			let filteredData: any = response.data || []
			filteredData = filteredData
				.filter((el: any) => el?.admin_id?._id == employeeId || el?.admin_id == employeeId)
				.reverse()
			setLeaveData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchLeaveData()
	}, [sort, sortOrder, searchTerm])

	const isFirstRender = React.useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		localStorage.setItem('emp_leave_manager_searchTerm', searchTerm)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	useEffect(() => {
		localStorage.setItem('emp_leave_manager_pagination', JSON.stringify(pagination))
	}, [pagination])

	const handleAddLeave = async () => {
		setSubmitLoading(true)
		let formattedFromDate: any
		let formattedToDate: any
		if (leaveType === 'full') {
			formattedFromDate = DayJS(fromDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss')
			formattedToDate = DayJS(toDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss')

			if (DayJS(toDate).isBefore(DayJS(fromDate))) {
				toast.error('To Date cannot be earlier than From Date')
				setSubmitLoading(false)
				return
			}
		} else if (leaveType === 'half') {
			if (
				halfDayPeriod === 'first' &&
				!DayJS(toDate).isSame(
					DayJS(fromDate).startOf('day').set('hour', 13).set('minute', 30),
					'minute'
				)
			) {
				toast.error('For First Half leave, To Date must be 1:30 PM of the same day')
				setSubmitLoading(false)
				return
			}
			if (
				halfDayPeriod === 'second' &&
				!DayJS(toDate).isSame(
					DayJS(fromDate).startOf('day').set('hour', 18).set('minute', 0),
					'minute'
				)
			) {
				toast.error('For Second Half leave, To Date must be 18:00 PM of the next day')
				setSubmitLoading(false)
				return
			}
		}

		try {
			const payload = {
				from_date: formattedFromDate || fromDate,
				to_date: formattedToDate || toDate,
				reason,
				leave_type: leaveType,
			}

			await CreateEmployeeLeave(payload)
			toast.success('Leave Added Successfully')
			fetchLeaveData()
			setShowModal(false)
			setReason('')
			setFromDate('')
			setToDate('')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setSubmitLoading(false)
	}

	const sortableFields = [
		{ title: 'Name', field: 'name' },
		{ title: 'Start Date', field: 'from_date' },
		{ title: 'End Date', field: 'to_date' },
		{ title: 'Reason', field: 'reason' },
		{ title: 'Remark', field: 'remark' },
		{ title: 'Status', field: 'status' },
	]

	const handleSortChange = (newSort: string, newSortOrder: any) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const getNestedValue = (obj: any, path: string) => {
		return path.split('.').reduce((acc, part) => acc && acc[part], obj)
	}

	const filteredData = leaveData.filter((item) => {
		if (!searchTerm) return true
		return sortableFields.some((column) => {
			const value = getNestedValue(item, column.field)
			return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
		})
	})

	const paginatedData = filteredData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

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

	useEffect(() => {
		if (leaveType === 'half') {
			if (halfDayPeriod === 'first') {
				setFromDate(
					DayJS().startOf('day').set('hour', 9).set('minute', 0).format('YYYY-MM-DDTHH:mm')
				)
				setToDate(
					DayJS().startOf('day').set('hour', 13).set('minute', 30).format('YYYY-MM-DDTHH:mm')
				)
			} else if (halfDayPeriod === 'second') {
				setFromDate(
					DayJS().startOf('day').set('hour', 13).set('minute', 30).format('YYYY-MM-DDTHH:mm')
				)
				setToDate(
					DayJS().startOf('day').set('hour', 18).set('minute', 0).format('YYYY-MM-DDTHH:mm')
				)
			}
		}
	}, [leaveType, halfDayPeriod])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Leave</PageTitle>

			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				{/* Modern Header */}
				<div className='card-header border-0 pt-6 d-flex flex-column gap-4'>
					{/* Header Top: Title & Right Apply Button */}
					<div className='d-flex align-items-center justify-content-between flex-wrap gap-3 w-100'>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h2 className='fw-bolder text-gray-900 mb-0'>My Leave Requests</h2>
								<span className='badge badge-light-primary fw-bold fs-8'>
									{filteredData.length} records
								</span>
							</div>
							<span className='text-muted fs-7 fw-semibold mt-1'>
								Apply for leaves, track approval status, and review HR remarks
							</span>
						</div>

						<button
							type='button'
							onClick={() => setShowModal(true)}
							className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '10px' }}>
							<i className='bi bi-plus-lg fs-6'></i>
							<span>Apply Leave</span>
						</button>
					</div>

					{/* Header Bottom: Filter Bar */}
					<div className='d-flex align-items-center flex-wrap gap-3 w-100 pb-2'>
						<div style={{ minWidth: '220px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search leaves...'
							/>
						</div>

						<LengthMenu
							expenseData={filteredData}
							handleItemsPerPageChange={(val) =>
								setPagination((prev) => ({ ...prev, itemsPerPage: val, page: 1 }))
							}
						/>
					</div>
				</div>

				{submitLoading && (
					<div className='loader-background'>
						<div
							className='spinner-border spinner-border-1 text-white'
							style={{ width: '50px', height: '50px' }}
							role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				)}

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={paginatedData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
							manualSearch={searchTerm}
							removeAction={true}
							visibleDetails={visibleDetails}
							renderRow={(
								leave: any,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => (
								<React.Fragment key={leave._id}>
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
												<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
													{actualIndex}
												</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{leave?.admin_id?.full_name || 'Me'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{DayJS(leave.from_date).format('DD/MM/YYYY hh:mm A')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{DayJS(leave.to_date).format('DD/MM/YYYY hh:mm A')}
											</span>
										</td>
										<td>
											<span
												className='text-dark fw-bold text-hover-primary d-md-block d-none mb-1 fs-6'
												onClick={() => toggleDescription(index)}
												title={leave.reason}
												style={{ cursor: 'pointer' }}>
												{expandedDescription[index]
													? leave.reason
													: truncateString(leave.reason, 100)}
											</span>
											<span
												className='text-dark fw-bold text-hover-primary d-md-none d-block mb-1 fs-6'
												style={{ cursor: 'pointer' }}
												title={leave.reason}
												onClick={() => toggleDescription(index)}>
												{expandedDescription[index]
													? leave.reason
													: truncateString(leave.reason, 20)}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{leave.status === 'PENDING' ? (
													<span className='text-muted fs-7'>Decision Pending</span>
												) : (
													<>
														<span
															className='text-dark fw-bold text-hover-primary d-md-block d-none mb-1 fs-6'
															onClick={() => toggleDescription(index)}
															title={leave.remarks}
															style={{ cursor: 'pointer' }}>
															{expandedDescription[index]
																? leave.remarks
																: truncateString(leave.remarks, 100)}
														</span>
														<span
															className='text-dark fw-bold text-hover-primary d-md-none d-block mb-1 fs-6'
															style={{ cursor: 'pointer' }}
															title={leave.remarks}
															onClick={() => toggleDescription(index)}>
															{expandedDescription[index]
																? leave.remarks
																: truncateString(leave.remarks, 20)}
														</span>
													</>
												)}
											</span>
										</td>
										<td>
											{leave.status === 'APPROVED' ? (
												<span className='badge badge-light-success px-3 py-2 fs-7 fw-semibold'>
													Approved
												</span>
											) : leave.status === 'REJECTED' ? (
												<span className='badge badge-light-danger px-3 py-2 fs-7 fw-semibold'>
													Rejected
												</span>
											) : (
												<span className='badge badge-light-warning px-3 py-2 fs-7 fw-semibold'>
													Pending
												</span>
											)}
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div className='p-3 bg-light rounded-3'>
													<strong>{sortableFields[0].title}:</strong>{' '}
													{leave?.admin_id?.full_name || 'Me'}
													<br />
													<strong>{sortableFields[1].title}:</strong>{' '}
													{DayJS(leave.from_date).format('DD/MM/YYYY hh:mm A')}
													<br />
													<strong>{sortableFields[2].title}:</strong>{' '}
													{DayJS(leave.to_date).format('DD/MM/YYYY hh:mm A')}
													<br />
													<div className='d-flex'>
														<strong>{sortableFields[3].title}:</strong>
														<span
															className='text-dark fw-bold text-hover-primary d-md-none d-block mb-2 ms-1 fs-6'
															style={{ cursor: 'pointer' }}
															title={leave.reason}
															onClick={() => toggleDescription(index)}>
															{expandedDescription[index]
																? leave.reason
																: truncateString(leave.reason, 55)}
														</span>
													</div>
													<div className='d-flex'>
														<strong>{sortableFields[4].title}:</strong>{' '}
														<span className='text-dark fw-bold text-hover-primary d-block mb-3 ms-1 fs-6'>
															{leave.status === 'PENDING' ? (
																'Decision Pending'
															) : (
																<>
																	<span
																		className='text-dark fw-bold text-hover-primary d-md-none d-block fs-6'
																		style={{ cursor: 'pointer' }}
																		title={leave.remarks}
																		onClick={() => toggleDescription(index)}>
																		{expandedDescription[index]
																			? leave.remarks
																			: truncateString(leave.remarks, 55)}
																	</span>
																</>
															)}
														</span>
													</div>
													<div className='d-flex'>
														<strong className='mt-1'>{sortableFields[5].title}:</strong>{' '}
														<span className='text-dark fw-bold text-hover-primary d-block mb-1 ms-1 fs-6'>
															{leave.status === 'APPROVED' ? (
																<span className='badge badge-light-success px-3 py-2 fs-7'>
																	Approved
																</span>
															) : leave.status === 'REJECTED' ? (
																<span className='badge badge-light-danger px-3 py-2 fs-7'>
																	Rejected
																</span>
															) : (
																<span className='badge badge-light-warning px-3 py-2 fs-7'>
																	Pending
																</span>
															)}
														</span>
													</div>
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
						/>
					</div>

					{leaveData.length === 0 && !loading && (
						<div className='d-flex flex-column align-items-center justify-content-center text-center py-10 w-100'>
							<div
								className='rounded-circle d-flex align-items-center justify-content-center mb-3'
								style={{ width: '56px', height: '56px', background: '#eff6ff' }}>
								<i className='bi bi-calendar-check fs-2' style={{ color: '#2563EB' }}></i>
							</div>
							<span className='fw-bold text-gray-700 fs-6'>No leave records found</span>
							<span className='text-muted fs-7'>You have not submitted any leave applications yet.</span>
						</div>
					)}

					{filteredData.length > 0 && (
						<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
							<div className='text-muted fs-7 fw-semibold'>
								Showing {Math.min((pagination.page - 1) * pagination.itemsPerPage + 1, filteredData.length)} to{' '}
								{Math.min(pagination.page * pagination.itemsPerPage, filteredData.length)} of {filteredData.length} records
							</div>
							<UsersListPagination
								totalPages={Math.ceil(filteredData.length / pagination.itemsPerPage)}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						</div>
					)}
				</div>
			</div>

			<Modal
				show={showModal}
				centered
				size='lg'
				onHide={() => setShowModal(false)}>
				<Modal.Header closeButton className='border-0 pb-0 pt-6 px-6'>
					<div>
						<Modal.Title className='fw-bolder text-gray-900 fs-4 mb-1'>Apply for Leave</Modal.Title>
						<span className='text-muted fs-7'>Submit your leave request for manager / HR review</span>
					</div>
				</Modal.Header>
				<Modal.Body className='px-6 py-4'>
					<Form>
						<Form.Group controlId='leave_type' className='mb-4'>
							<Form.Label className='fw-bold text-gray-700 fs-7 d-block mb-2'>Leave Duration</Form.Label>
							<div className='d-flex gap-4'>
								<Form.Check
									type='radio'
									label='Full Day'
									name='leaveType'
									value='full'
									checked={leaveType === 'full'}
									onChange={(e) => {
										setLeaveType(e.target.value)
										setHalfDayPeriod('')
										setFromDate('')
										setToDate('')
									}}
								/>
								<Form.Check
									type='radio'
									label='Half Day'
									name='leaveType'
									value='half'
									checked={leaveType === 'half'}
									onChange={(e) => {
										setLeaveType(e.target.value)
										setFromDate('')
										setToDate('')
									}}
								/>
							</div>
						</Form.Group>

						{leaveType === 'half' && (
							<>
								<Form.Group controlId='half_day_period' className='mb-4 p-3 bg-light rounded-3 border'>
									<Form.Label className='fw-bold text-gray-700 fs-7 d-block mb-2'>Select Half Day Period</Form.Label>
									<Form.Check
										type='radio'
										label='First Half (9:00 AM - 1:30 PM)'
										name='halfDayPeriod'
										value='first'
										checked={halfDayPeriod === 'first'}
										onChange={(e) => {
											setHalfDayPeriod(e.target.value)
											setFromDate(
												DayJS()
													.startOf('day')
													.set('hour', 9)
													.set('minute', 0)
													.format('YYYY-MM-DDTHH:mm')
											)
											setToDate(
												DayJS()
													.startOf('day')
													.set('hour', 13)
													.set('minute', 30)
													.format('YYYY-MM-DDTHH:mm')
											)
										}}
									/>
									<Form.Check
										type='radio'
										label='Second Half (1:30 PM - 5:00 PM)'
										name='halfDayPeriod'
										value='second'
										style={{ marginTop: '10px' }}
										checked={halfDayPeriod === 'second'}
										onChange={(e) => {
											setHalfDayPeriod(e.target.value)
											setFromDate(
												DayJS()
													.startOf('day')
													.set('hour', 13)
													.set('minute', 30)
													.format('YYYY-MM-DDTHH:mm')
											)
											setToDate(
												DayJS()
													.startOf('day')
													.add(1, 'day')
													.set('hour', 9)
													.set('minute', 0)
													.format('YYYY-MM-DDTHH:mm')
											)
										}}
									/>
								</Form.Group>

								<div className='row g-4 mb-4'>
									<div className='col-12 col-md-6'>
										<Form.Group controlId='from_date'>
											<Form.Label className='fw-bold text-gray-700 fs-7'>From Date & Time</Form.Label>
											<Form.Control
												type='datetime-local'
												value={fromDate}
												style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
												onChange={(e) => setFromDate(e.target.value)}
											/>
										</Form.Group>
									</div>
									<div className='col-12 col-md-6'>
										<Form.Group controlId='to_date'>
											<Form.Label className='fw-bold text-gray-700 fs-7'>To Date & Time</Form.Label>
											<Form.Control
												type='datetime-local'
												value={toDate}
												style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
												onChange={(e) => setToDate(e.target.value)}
											/>
										</Form.Group>
									</div>
								</div>
							</>
						)}

						{leaveType === 'full' && (
							<div className='row g-4 mb-4'>
								<div className='col-12 col-md-6'>
									<Form.Group controlId='from_date'>
										<Form.Label className='fw-bold text-gray-700 fs-7'>From Date</Form.Label>
										<Form.Control
											type='date'
											value={DayJS(fromDate).format('YYYY-MM-DD')}
											style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
											onChange={(e) => {
												const selectedDate = DayJS(e.target.value).startOf('day').format('YYYY-MM-DD')
												setFromDate(selectedDate)
												setToDate(DayJS(e.target.value).endOf('day').format('YYYY-MM-DD'))
											}}
										/>
									</Form.Group>
								</div>
								<div className='col-12 col-md-6'>
									<Form.Group controlId='to_date'>
										<Form.Label className='fw-bold text-gray-700 fs-7'>To Date</Form.Label>
										<Form.Control
											type='date'
											value={DayJS(toDate).format('YYYY-MM-DD')}
											style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
											onChange={(e) => {
												const selectedDate = DayJS(e.target.value).endOf('day').format('YYYY-MM-DD')
												setToDate(selectedDate)
											}}
										/>
									</Form.Group>
								</div>
							</div>
						)}

						<Form.Group controlId='reason' className='mb-4'>
							<Form.Label className='fw-bold text-gray-700 fs-7'>
								Reason for Leave <span className='text-danger'>*</span>
							</Form.Label>
							<Form.Control
								as='textarea'
								rows={4}
								placeholder='Please specify reason for your leave request...'
								value={reason}
								style={{ borderRadius: '8px', borderColor: '#ded8d2' }}
								onChange={(e) => setReason(e.target.value)}
								required
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer className='border-0 pt-0 pb-6 px-6'>
					<Button
						variant='light'
						style={{ borderRadius: '8px' }}
						onClick={() => setShowModal(false)}>
						Cancel
					</Button>
					<Button
						variant='primary'
						style={{ borderRadius: '8px', minWidth: '130px' }}
						onClick={handleAddLeave}
						disabled={submitLoading || !reason.trim()}>
						{submitLoading ? 'Submitting...' : 'Submit Request'}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default EmployeeLeaveManager
