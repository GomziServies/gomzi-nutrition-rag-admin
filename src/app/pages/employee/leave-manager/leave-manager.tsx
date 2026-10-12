import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
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
		const employeeData: any = localStorage.getItem('fg_group_info')
		const employee = JSON.parse(employeeData)

		setLoading(true)
		try {
			const response = await GetEmployeeLeaves()
			let filteredData: any = response.data
			filteredData = filteredData.filter((el: any) => el?.admin_id?._id == employee._id).reverse()
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
			<div
				className='accordion'
				id='kt_accordion_1'>
				<KTCard className='accordion-item mt-5'>
					<div
						id='kt_accordion_1_body_1'
						className='accordion-collapse collapse show'>
						<div className='row mx-6 my-4 align-items-center justify-content-between'>
							<div className='col-md-8 col-12'>
								<div className='d-md-flex'>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={setSearchTerm}
									/>
									<div className='d-md-block d-none'>
										{leaveData?.length > 0 && (
											<select
												className='form-select form-select-sm mx-3'
												style={{ width: '80px' }}
												value={pagination.itemsPerPage}
												onChange={(e) =>
													setPagination((prev) => ({
														...prev,
														itemsPerPage: Number(e.target.value),
														page: 1,
													}))
												}>
												<option value='10'>10</option>
												<option value='50'>50</option>
												<option value='100'>100</option>
											</select>
										)}
									</div>
								</div>
							</div>
							<div className='col-md-4 col-12 px-0 d-flex justify-content-end mb-md-0 mt-4'>
								<div className='d-md-none d-block me-md-3'>
									{leaveData?.length > 0 && (
										<select
											className='form-select form-select-sm'
											style={{ width: '80px' }}
											value={pagination.itemsPerPage}
											onChange={(e) =>
												setPagination((prev) => ({
													...prev,
													itemsPerPage: Number(e.target.value),
													page: 1,
												}))
											}>
											<option value='10'>10</option>
											<option value='50'>50</option>
											<option value='100'>100</option>
										</select>
									)}
								</div>
								<TableButton
									action='add'
									text='Add Leave'
									onClick={() => setShowModal(true)}
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
														{leave?.admin_id?.full_name}
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
															'Decision Pending'
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
													<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
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
													</span>
												</td>
											</tr>
											{isVisible && (
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

			<Modal
				show={showModal}
				centered
				onHide={() => setShowModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Add Leave</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group
							controlId='leave_type'
							className='mb-5'>
							<Form.Label>Leave Type</Form.Label>
							<div className='d-flex'>
								<Form.Check
									type='radio'
									label='Full Day'
									name='leaveType'
									value='full'
									style={{ marginRight: '10px' }}
									checked={leaveType === 'full'}
									onChange={(e) => {
										setLeaveType(e.target.value)
										setHalfDayPeriod('') // Reset half day period when switching to full day
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
								<Form.Group
									controlId='half_day_period'
									className='mb-5'>
									<Form.Label>Half Day Period</Form.Label>
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

								<Form.Group controlId='from_date'>
									<Form.Label>From Date</Form.Label>
									<Form.Control
										type='datetime-local'
										value={fromDate}
										onChange={(e) => setFromDate(e.target.value)}
									/>
								</Form.Group>
								<Form.Group
									controlId='to_date'
									className='mt-3'>
									<Form.Label>To Date</Form.Label>
									<Form.Control
										type='datetime-local'
										value={toDate}
										onChange={(e) => setToDate(e.target.value)}
									/>
								</Form.Group>
							</>
						)}

						{leaveType === 'full' && (
							<>
								<Form.Group controlId='from_date'>
									<Form.Label>From Date</Form.Label>
									<Form.Control
										type='date'
										value={DayJS(fromDate).format('YYYY-MM-DD')}
										onChange={(e) => {
											const selectedDate = DayJS(e.target.value).startOf('day').format('YYYY-MM-DD')
											setFromDate(selectedDate)
											setToDate(DayJS(e.target.value).endOf('day').format('YYYY-MM-DD')) // Set the ToDate to 11:59 PM of the same day
										}}
									/>
								</Form.Group>
								<Form.Group
									controlId='to_date'
									className='mt-3'>
									<Form.Label>To Date</Form.Label>
									<Form.Control
										type='date'
										value={DayJS(toDate).format('YYYY-MM-DD')}
										onChange={(e) => {
											const selectedDate = DayJS(e.target.value).endOf('day').format('YYYY-MM-DD')
											setToDate(selectedDate)
										}}
									/>
								</Form.Group>
							</>
						)}
						<Form.Group
							controlId='reason'
							className='mt-3'>
							<Form.Label>Reason</Form.Label>
							<Form.Control
								as='textarea'
								rows={3}
								value={reason}
								onChange={(e) => setReason(e.target.value)}
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={() => setShowModal(false)}>
						Close
					</Button>
					<Button
						variant='primary'
						onClick={handleAddLeave}>
						Submit
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default EmployeeLeaveManager
