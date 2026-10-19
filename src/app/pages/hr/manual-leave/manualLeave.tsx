import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	ActionEmployeeLeave,
	CreateEmployeeLeave,
	GetEmployeeLeaves,
	RemoveEmployeeLeave,
} from '../../../Functions/FGGroup/EmployeeLeaveManagement'

const HRManualLeave: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [leaveData, setLeaveData] = useState<any[]>([])
	const [showModal, setShowModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [fromDate, setFromDate] = useState('')
	const [toDate, setToDate] = useState('')
	const [reason, setReason] = useState('')
	const [notes, setNotes] = useState('')
	const [updateLeaveData, setUpdateLeaveData] = useState<any>({})
	const [leaveType, setLeaveType] = useState('full')
	const [halfDayPeriod, setHalfDayPeriod] = useState('')

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
			const adminData: any = localStorage.getItem('fg_group_info')
			const admin_id = JSON.parse(adminData)?._id

			const response = await GetEmployeeLeaves()
			let filteredData: any = response.data
			let adminLeave = filteredData
				.filter((data: any) => data?.admin_id?._id === admin_id)
				.map((data: any) => ({
					...data,
					name: data?.admin_id?.full_name || '',
				}))

			adminLeave.sort((a: any, b: any) => {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			})

			setLeaveData(adminLeave)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchLeaveData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			fetchLeaveData()
		}
	}, [searchTerm])

	const handleAddLeave = async () => {
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
				notes,
			}

			await CreateEmployeeLeave(payload)
			toast.success('Leave Added Successfully')
			fetchLeaveData()
			handleCloseAddModal()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const resetFormFields = () => {
		setFromDate('')
		setToDate('')
		setReason('')
		setNotes('')
		setLeaveType('full')
		setHalfDayPeriod('')
	}

	const handleShowAddModal = () => {
		resetFormFields()
		setShowModal(true)
	}

	const handleCloseAddModal = () => {
		resetFormFields()
		setShowModal(false)
	}

	const handleCloseUpdateModal = () => {
		resetFormFields()
		setShowUpdateModal(false)
	}

	const handleUpdateLeave = async (leave_id?: string) => {
		let formattedFromDate: any
		let formattedToDate: any

		if (leaveType === 'full') {
			formattedFromDate = DayJS(fromDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss')
			formattedToDate = DayJS(toDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss')

			if (DayJS(toDate).isBefore(DayJS(fromDate))) {
				toast.error('To Date cannot be earlier than From Date')
				return
			}
		} else if (leaveType === 'half') {
			if (
				halfDayPeriod === 'first' &&
				!DayJS(toDate).isSame(DayJS(fromDate).set('hour', 13).set('minute', 30), 'minute')
			) {
				toast.error('For First Half leave, To Date must be 1:30 PM of the same day')
				return
			}
			if (
				halfDayPeriod === 'second' &&
				!DayJS(toDate).isSame(DayJS(fromDate).set('hour', 18).set('minute', 0), 'minute')
			) {
				toast.error('For Second Half leave, To Date must be 18:00 PM of the next day')
				return
			}
		}

		try {
			const payload: any = {
				leave_id,
				from_date: formattedFromDate || fromDate,
				to_date: formattedToDate || toDate,
				reason,
				notes,
				status: 'PENDING',
			}

			await ActionEmployeeLeave(payload)
			toast.success('Leave Updated Successfully')
			fetchLeaveData()
			handleCloseUpdateModal()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleShowUpdateModal = (data: any) => {
		setUpdateLeaveData(data)
		setShowUpdateModal(true)

		setLeaveType(data.leave_type || 'full')
		setHalfDayPeriod(data.half_day_period || '')

		setFromDate(data.from_date || '')
		setToDate(data.to_date || '')

		setReason(data.reason || '')
		setNotes(data.notes || '')
	}

	const sortableFields = [
		{ title: 'Hr Name', field: 'name' },
		{ title: 'Start Date', field: 'from_date' },
		{ title: 'End Date', field: 'to_date' },
		{ title: 'Reason', field: 'reason' },
		{ title: 'Notes', field: 'notes' },
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

	const handleRemoveLeave = async (leave_id?: any) => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to remove this Leave.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			})

			if (result.isConfirmed) {
				const response: any = await RemoveEmployeeLeave({ leave_id: leave_id })
				if (response.status === 200) {
					fetchLeaveData()
					toast.success('leave removed successfully')
				} else {
					toast.error('Failed to remove Leave')
				}
			}
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const filteredAdminData = leaveData.filter((admin: any) => {
		return (
			admin?.admin_id?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			admin?.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			admin?.notes?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	})

	const paginatedAdminData = filteredAdminData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	const handleSearchChange = (term: React.SetStateAction<string>) => {
		setSearchTerm((prev) => {
			const next = typeof term === 'function' ? term(prev) : term
			if (next !== prev) {
				setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }))
			}
			return next
		})
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Festival Leave</PageTitle>

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<h2 className='text-gray-900 fw-bold fs-2 m-0'>Festival & Manual Leave</h2>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Manage official holiday calendars and company festival leave records
					</span>
				</div>
			</div>

			{/* Filter Toolbar (Order: Search -> LengthMenu -> DownloadExcel -> Filters -> Date -> Right Action) */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3'>
					<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
						{/* 1. Searchbar */}
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={handleSearchChange}
								placeholder='Search festival leave...'
								className='me-0'
							/>
						</div>

						{/* 2. Page Size / Length Menu */}
						<div>
							<LengthMenu
								data={leaveData}
								itemsPerPage={pagination.itemsPerPage}
								handleItemsPerPageChange={handleItemsPerPageChange}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<DownloadExcelButton
								data={leaveData}
								columns={sortableFields}
								filename='Festival_Leaves'
							/>
						</div>
					</div>

					{/* 6. End me right side Add Leave Button */}
					<div className='flex-shrink-0 ms-auto'>
						<TableButton
							action='add'
							text='Add Leave'
							onClick={handleShowAddModal}
						/>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
				<Table
									data={paginatedAdminData}
									columns={sortableFields}
									sort={sort}
									disableSortFields={[]}
									sortOrder={sortOrder}
									onSortChange={handleSortChange}
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
													<div className='d-flex justify-content-center'>
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
														<>
															<span
																className='text-dark fw-bold  d-md-block d-none mb-1 fs-6'
																onClick={() => toggleDescription(index)}
																title={leave.notes}
																style={{ cursor: 'pointer' }}>
																{expandedDescription[index]
																	? leave.notes
																	: truncateString(leave.notes, 100)}
															</span>
															<span
																className='text-dark fw-bold  d-md-none d-block mb-1 fs-6'
																style={{ cursor: 'pointer' }}
																title={leave.notes}
																onClick={() => toggleDescription(index)}>
																{expandedDescription[index]
																	? leave.notes
																	: truncateString(leave.notes, 20)}
															</span>
														</>
													</span>
												</td>
												<td>
													<div className='d-flex'>
														<TableButton
															action='edit'
															onClick={() => handleShowUpdateModal(leave)}
														/>
														<TableButton
															action='remove'
															onClick={() => handleRemoveLeave(leave._id)}
														/>
													</div>
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
																	className='text-dark fw-bold  d-md-none d-block mb-2 ms-1 fs-6'
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
																<span className='text-dark fw-bold  d-block mb-3 ms-1 fs-6'>
																	<>
																		<span
																			className='text-dark fw-bold  d-md-none d-block fs-6'
																			style={{ cursor: 'pointer' }}
																			title={leave.notes}
																			onClick={() => toggleDescription(index)}>
																			{expandedDescription[index]
																				? leave.notes
																				: truncateString(leave.notes, 55)}
																		</span>
																	</>
																</span>
															</div>
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									)}
									visibleDetails={visibleDetails}
									pagination={pagination}
									setPagination={setPagination}
									loading={loading}
								/>
				{paginatedAdminData.length === 0 && !loading && (
					<div className='d-flex text-center w-100 align-content-center justify-content-center py-12'>
						<b>No records found</b>
					</div>
				)}
				{paginatedAdminData.length > 0 && (
					<UsersListPagination
						totalPages={Math.ceil(filteredAdminData.length / pagination.itemsPerPage)}
						currentPage={pagination.page}
						totalRecords={filteredAdminData.length}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
					/>
				)}
			</div>

			<Modal
				show={showModal}
				centered
				onHide={handleCloseAddModal}>
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
									name='leaveType1'
									id='leaveType1'
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
									name='leaveType2'
									id='leaveType2'
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
										name='halfDayPeriod1'
										id='halfDayPeriod1'
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
										name='halfDayPeriod2'
										id='halfDayPeriod2'
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
							<Form.Label>Title</Form.Label>
							<Form.Control
								as='textarea'
								rows={3}
								value={reason}
								onChange={(e) => setReason(e.target.value)}
							/>
						</Form.Group>
						<Form.Group
							controlId='notes'
							className='mt-3'>
							<Form.Label>Notes(optional)</Form.Label>
							<Form.Control
								as='textarea'
								rows={1}
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={handleCloseAddModal}>
						Close
					</Button>
					<Button
						variant='primary'
						onClick={handleAddLeave}>
						Submit
					</Button>
				</Modal.Footer>
			</Modal>

			<Modal
				show={showUpdateModal}
				centered
				onHide={handleCloseUpdateModal}>
				<Modal.Header closeButton>
					<Modal.Title>Update Leave</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group controlId='from_date'>
							<Form.Label>From Date</Form.Label>
							<Form.Control
								type='date'
								value={DayJS(fromDate).format('YYYY-MM-DD')}
								onChange={(e) => {
									const selectedDate = DayJS(e.target.value)
										.startOf('day')
										.format('YYYY-MM-DDTHH:mm')
									setFromDate(selectedDate)
									setToDate(DayJS(e.target.value).endOf('day').format('YYYY-MM-DDTHH:mm')) // Set the ToDate to 11:59 PM of the same day
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
									const selectedDate = DayJS(e.target.value).endOf('day').format('YYYY-MM-DDTHH:mm')
									setToDate(selectedDate)
								}}
							/>
						</Form.Group>

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
						<Form.Group
							controlId='notes'
							className='mt-3'>
							<Form.Label>Notes (optional)</Form.Label>
							<Form.Control
								as='textarea'
								rows={1}
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={handleCloseUpdateModal}>
						Close
					</Button>
					<Button
						variant='primary'
						onClick={() => handleUpdateLeave(updateLeaveData._id)}>
						Update
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default HRManualLeave
