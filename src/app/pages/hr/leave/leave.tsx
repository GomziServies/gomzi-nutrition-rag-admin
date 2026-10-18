import {
	faCalendarAlt,
	faCalendarCheck,
	faCheck,
	faCheckCircle,
	faClock,
	faInfoCircle,
	faPlusCircle,
	faQuoteLeft,
	faSort,
	faSortDown,
	faSortUp,
	faSpinner,
	faTimes,
	faTimesCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import duration from 'dayjs/plugin/duration'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	ActionEmployeeLeave,
	GetEmployeeLeaves,
} from '../../../Functions/FGGroup/EmployeeLeaveManagement'
import './leave.css'
DayJS.extend(duration)

const calculateLeaveDuration = (from_date?: string, to_date?: string) => {
	if (!from_date || !to_date) return '—'
	const fromDate = DayJS(from_date)
	let toDate = DayJS(to_date)

	const diff = DayJS.duration(toDate.diff(fromDate))
	let days = diff.days()
	const hours = diff.hours()
	const minutes = diff.minutes()

	if (toDate.format('HH:mm') === '00:00') {
		days += 1
	}

	if (days === 0 && hours === 0 && minutes === 0) {
		return '0 hours'
	} else if (days === 0) {
		return `${hours}:${minutes < 10 ? '0' + minutes : minutes} hrs`
	} else if (hours === 0 && minutes === 0) {
		return `${days} day${days !== 1 ? 's' : ''}`
	} else {
		return `${days} day${days !== 1 ? 's' : ''} ${hours}:${minutes < 10 ? '0' + minutes : minutes} hrs`
	}
}

const getInitials = (name?: string) => {
	if (!name) return 'EM'
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const quickApprovalRemarks = [
	'Approved as per leave policy',
	'Approved with coverage arranged',
	'Leave request granted',
	'Half-day approved',
]

const quickRejectionRemarks = [
	'High project workload during this period',
	'Insufficient leave balance available',
	'Team coverage unavailable; please reschedule',
	'Please discuss dates with reporting manager',
]

const HRLeave: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [leaveData, setLeaveData] = useState<any[]>([])
	const [showModal, setShowModal] = useState(false)
	const [selectedLeave, setSelectedLeave] = useState<any | null>(null)
	const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null)
	const [remarks, setRemarks] = useState('')
	const [status, setStatus] = useState('')
	const [submitting, setSubmitting] = useState(false)
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

	const handleApproveAndRejectLeave = (leave: any) => {
		setSelectedLeave(leave)
		setSelectedLeaveId(leave?._id || null)
		const currentStatus = leave?.status?.toUpperCase()
		setStatus(currentStatus === 'APPROVED' || currentStatus === 'REJECTED' ? currentStatus : '')
		setRemarks(leave?.remarks || '')
		setShowModal(true)
	}

	const handleModalClose = () => {
		setShowModal(false)
		setSelectedLeave(null)
		setSelectedLeaveId(null)
		setRemarks('')
		setStatus('')
		setSubmitting(false)
	}

	const handleModalSubmit = async () => {
		if (!status) {
			toast.error('Please choose a decision: Approve or Reject')
			return
		}

		if (status === 'REJECTED' && !remarks.trim()) {
			toast.error('Please specify a reason or remark for rejection')
			return
		}

		setSubmitting(true)
		try {
			const payload: any = {
				leave_id: selectedLeaveId,
				status,
				remarks: remarks.trim(),
			}
			await ActionEmployeeLeave(payload)
			toast.success(`Leave request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`)
			fetchLeaveData()
			handleModalClose()
		} catch (error: any) {
			toast.error(error?.message || 'Failed to update leave request')
			console.error(error)
		} finally {
			setSubmitting(false)
		}
	}

	const applyQuickRemark = (chip: string) => {
		setRemarks((prev) => (prev ? `${prev.trim()} - ${chip}` : chip))
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

	const handleSearchChange = (term: React.SetStateAction<string>) => {
		setSearchTerm((prev) => {
			const next = typeof term === 'function' ? term(prev) : term
			if (next !== prev) {
				setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }))
			}
			return next
		})
	}

	const handleSort = (field: string) => {
		if (sort === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			setSort(field)
			setSortOrder('asc')
		}
	}

	const filteredData = leaveData.filter((sale: any) =>
		(sale?.admin_id?.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
		(sale?.reason || '').toLowerCase().includes((searchTerm || '').toLowerCase())
	)

	const sortedLeaveData = [...filteredData].sort((a: any, b: any) => {
		let aVal: any
		let bVal: any

		if (sort === 'name') {
			aVal = a?.admin_id?.full_name || ''
			bVal = b?.admin_id?.full_name || ''
		} else if (sort === 'from_date') {
			aVal = new Date(a?.from_date || 0).getTime()
			bVal = new Date(b?.from_date || 0).getTime()
		} else if (sort === 'to_date') {
			aVal = new Date(a?.to_date || 0).getTime()
			bVal = new Date(b?.to_date || 0).getTime()
		} else if (sort === 'reason') {
			aVal = a?.reason || ''
			bVal = b?.reason || ''
		} else if (sort === 'status') {
			aVal = a?.status || ''
			bVal = b?.status || ''
		} else {
			aVal = new Date(a?.from_date || a?.createdAt || 0).getTime()
			bVal = new Date(b?.from_date || b?.createdAt || 0).getTime()
		}

		if (typeof aVal === 'number' && typeof bVal === 'number') {
			return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
		}

		return sortOrder === 'asc'
			? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
			: String(bVal).localeCompare(String(aVal), undefined, { numeric: true, sensitivity: 'base' })
	})

	const paginatedData = sortedLeaveData.slice(
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

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<h2 className='text-gray-900 fw-bold fs-2 m-0'>Employee Leave Requests</h2>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Review, approve, and track employee leave applications and balances
					</span>
				</div>
			</div>

			{/* Filter Toolbar (Order: SearchFilter -> LengthMenu) */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center flex-wrap gap-3'>
					{/* 1. Searchbar */}
					<div style={{ minWidth: '240px', maxWidth: '360px', flex: '1 1 240px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={handleSearchChange}
							placeholder='Search by employee name or reason...'
							className='me-0'
						/>
					</div>

					{/* 2. Page Size / Length Menu */}
					<div>
						<LengthMenu
							data={leaveData}
							itemsPerPage={pagination.itemsPerPage}
							handleItemsPerPageChange={(value) =>
								setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
							}
							className='me-0'
						/>
					</div>

					{/* 3. Download Excel Button */}
					<div>
						<DownloadExcelButton
							data={leaveData}
							columns={[
								{ title: 'Employee Name', field: 'employee_details.full_name' },
								{ title: 'Start Date', field: 'start_date' },
								{ title: 'End Date', field: 'end_date' },
								{ title: 'Time', field: 'time' },
								{ title: 'Reason', field: 'reason' },
								{ title: 'Status', field: 'status' },
							]}
							filename='Leave_Requests'
						/>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
				<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
									<thead>
										<tr className='fw-bold text-muted bg-light border-bottom-0'>
											<th className='ps-4 rounded-start' style={{ width: '60px' }}>No.</th>
											<th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>Name</span>
													<FontAwesomeIcon icon={sort === 'name' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'name' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th onClick={() => handleSort('from_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>Start Date</span>
													<FontAwesomeIcon icon={sort === 'from_date' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'from_date' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th onClick={() => handleSort('to_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>End Date</span>
													<FontAwesomeIcon icon={sort === 'to_date' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'to_date' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th>Time</th>
											<th onClick={() => handleSort('reason')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>Reason</span>
													<FontAwesomeIcon icon={sort === 'reason' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'reason' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>Status</span>
													<FontAwesomeIcon icon={sort === 'status' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'status' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th className='ps-4 rounded-end text-center'>Action</th>
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
															<span className='text-dark fw-bold d-block mb-1 fs-6'>
																{calculateLeaveDuration(leave.from_date, leave.to_date)}
															</span>
														</td>
														<td>
															<span
																className='text-dark fw-bold d-md-block d-none mb-1 fs-6'
																onClick={() => toggleDescription(index)}
																title={leave.reason}
																style={{ cursor: 'pointer' }}>
																{expandedDescription[index]
																	? leave.reason
																	: truncateString(leave.reason, 100)}
															</span>
															<span
																className='text-dark fw-bold d-md-none d-block mb-1 fs-6'
																style={{ cursor: 'pointer' }}
																title={leave.reason}
																onClick={() => toggleDescription(index)}>
																{expandedDescription[index]
																	? leave.reason
																	: truncateString(leave.reason, 20)}
															</span>
														</td>
														<td>
															{leave.status?.toUpperCase() === 'APPROVED' ? (
																<span className='gz-leave-status-pill status-approved'>
																	<span className='gz-leave-status-dot' />
																	Approved
																</span>
															) : leave.status?.toUpperCase() === 'REJECTED' ? (
																<span className='gz-leave-status-pill status-rejected'>
																	<span className='gz-leave-status-dot' />
																	Rejected
																</span>
															) : (
																<span className='gz-leave-status-pill status-pending'>
																	<span className='gz-leave-status-dot' />
																	Pending
																</span>
															)}
														</td>
														<td className='text-center'>
															<div className='d-flex align-items-center justify-content-center gap-1.5'>
																{leave.status?.toUpperCase() === 'PENDING' ? (
																	<TableButton
																		action='edit'
																		onClick={(e) => {
																			e?.stopPropagation?.()
																			handleApproveAndRejectLeave(leave)
																		}}
																		title='Review Leave Request'
																	/>
																) : (
																	<>
																		<TableButton
																			action='view'
																			onClick={(e) => {
																				e?.stopPropagation?.()
																				handleApproveAndRejectLeave(leave)
																			}}
																			title='View Decision Details'
																		/>
																		<TableButton
																			action='edit'
																			onClick={(e) => {
																				e?.stopPropagation?.()
																				handleApproveAndRejectLeave(leave)
																			}}
																			title='Update Decision'
																		/>
																	</>
																)}
															</div>
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
					<div className='d-flex text-center w-100 align-content-center justify-content-center py-12'>
						<b>No records found</b>
					</div>
				)}
				{filteredData.length > 0 && (
					<UsersListPagination
						totalPages={Math.ceil(filteredData.length / pagination.itemsPerPage)}
						currentPage={pagination.page}
						totalRecords={filteredData.length}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
					/>
				)}
			</div>

			{/* Modal for Approve/Reject Leave */}
			<Modal
				show={showModal}
				centered
				backdrop='static'
				className='gz-leave-modal'
				onHide={handleModalClose}>
				{/* Custom Header */}
				<div className='gz-leave-modal-header'>
					<div className='d-flex align-items-center gap-3'>
						<div className='gz-leave-modal-header-icon'>
							<FontAwesomeIcon icon={faCalendarCheck} />
						</div>
						<div>
							<h4 className='gz-leave-modal-title'>Review Leave Request</h4>
							<p className='gz-leave-modal-subtitle'>
								Review employee request and record approval or rejection
							</p>
						</div>
					</div>
					<button
						type='button'
						className='gz-leave-modal-close'
						onClick={handleModalClose}
						title='Close Modal'
						aria-label='Close'>
						<FontAwesomeIcon icon={faTimes} />
					</button>
				</div>

				{/* Modal Body */}
				<div className='gz-leave-modal-body'>
					{/* Employee & Leave Context Card */}
					{selectedLeave && (
						<div className='gz-leave-summary-card'>
							<div className='d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2'>
								<div className='d-flex align-items-center gap-3'>
									<div className='gz-leave-summary-avatar'>
										{getInitials(selectedLeave?.admin_id?.full_name)}
									</div>
									<div>
										<div className='fw-bold text-dark fs-6'>
											{selectedLeave?.admin_id?.full_name || 'Employee'}
										</div>
										<div className='text-muted fs-8'>
											{selectedLeave?.admin_id?.email || 'Leave Applicant'}
										</div>
									</div>
								</div>
								<div>
									{selectedLeave?.status?.toUpperCase() === 'APPROVED' ? (
										<span className='gz-leave-status-pill status-approved'>
											<span className='gz-leave-status-dot' />
											Approved
										</span>
									) : selectedLeave?.status?.toUpperCase() === 'REJECTED' ? (
										<span className='gz-leave-status-pill status-rejected'>
											<span className='gz-leave-status-dot' />
											Rejected
										</span>
									) : (
										<span className='gz-leave-status-pill status-pending'>
											<span className='gz-leave-status-dot' />
											Pending Review
										</span>
									)}
								</div>
							</div>

							<div className='d-flex align-items-center flex-wrap gap-2 mb-3'>
								<div className='gz-leave-date-badge'>
									<FontAwesomeIcon icon={faCalendarAlt} className='text-primary' />
									<span>From: {DayJS(selectedLeave?.from_date).format('DD MMM YYYY, hh:mm A')}</span>
								</div>
								<div className='gz-leave-date-badge'>
									<FontAwesomeIcon icon={faCalendarAlt} className='text-primary' />
									<span>To: {DayJS(selectedLeave?.to_date).format('DD MMM YYYY, hh:mm A')}</span>
								</div>
								<div className='gz-leave-duration-badge'>
									<FontAwesomeIcon icon={faClock} />
									<span>Duration: {calculateLeaveDuration(selectedLeave?.from_date, selectedLeave?.to_date)}</span>
								</div>
							</div>

							{selectedLeave?.reason && (
								<div>
									<div className='text-muted fs-8 fw-semibold mb-1'>Employee Reason</div>
									<div className='gz-leave-reason-quote'>
										<FontAwesomeIcon icon={faQuoteLeft} className='text-muted me-2' />
										{selectedLeave.reason}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Decision Selection */}
					<div className='mb-4'>
						<div className='d-flex align-items-center justify-content-between mb-2'>
							<label className='fw-bold fs-7 text-dark mb-0'>
								Select Decision <span className='text-danger'>*</span>
							</label>
							{status && (
								<span
									className={`fs-8 fw-semibold ${
										status === 'APPROVED' ? 'text-success' : 'text-danger'
									}`}>
									{status === 'APPROVED' ? 'Marking as Approved' : 'Marking as Rejected'}
								</span>
							)}
						</div>

						<div className='gz-leave-decision-grid'>
							{/* Approve Card */}
							<div
								className={`gz-leave-decision-card card-approve ${
									status === 'APPROVED' ? 'is-active' : ''
								}`}
								onClick={() => setStatus('APPROVED')}>
								<div className='gz-leave-card-icon'>
									<FontAwesomeIcon icon={faCheck} />
								</div>
								<div className='gz-leave-card-text'>
									<div className='gz-leave-card-title'>Approve</div>
									<div className='gz-leave-card-desc'>Grant leave request</div>
								</div>
								<div className='gz-leave-radio-indicator'>
									{status === 'APPROVED' && <span className='gz-leave-radio-dot' />}
								</div>
							</div>

							{/* Reject Card */}
							<div
								className={`gz-leave-decision-card card-reject ${
									status === 'REJECTED' ? 'is-active' : ''
								}`}
								onClick={() => setStatus('REJECTED')}>
								<div className='gz-leave-card-icon'>
									<FontAwesomeIcon icon={faTimes} />
								</div>
								<div className='gz-leave-card-text'>
									<div className='gz-leave-card-title'>Reject</div>
									<div className='gz-leave-card-desc'>Decline leave request</div>
								</div>
								<div className='gz-leave-radio-indicator'>
									{status === 'REJECTED' && <span className='gz-leave-radio-dot' />}
								</div>
							</div>
						</div>
					</div>

					{/* Remarks / Comments Field */}
					<div className='mb-2'>
						<div className='d-flex align-items-center justify-content-between mb-1.5'>
							<label htmlFor='leaveRemarks' className='fw-bold fs-7 text-dark mb-0'>
								Remarks & Notes
								{status === 'REJECTED' ? (
									<span className='ms-2 badge badge-light-danger fs-8 fw-semibold'>
										Reason required for rejection
									</span>
								) : (
									<span className='ms-2 text-muted fs-8 fw-normal'>(Optional)</span>
								)}
							</label>
						</div>

						<textarea
							id='leaveRemarks'
							rows={3}
							className='form-control gz-leave-textarea w-100'
							placeholder={
								status === 'REJECTED'
									? 'Please specify why this leave request is being rejected...'
									: 'Add any remarks, approval conditions, or handover notes for the employee...'
							}
							value={remarks}
							onChange={(e) => setRemarks(e.target.value)}
						/>

						{/* Quick Suggestion Chips */}
						<div className='mt-2.5'>
							<div className='text-muted fs-8 fw-semibold mb-1.5'>Quick Remarks:</div>
							<div className='d-flex flex-wrap gap-1.5'>
								{(status === 'REJECTED' ? quickRejectionRemarks : quickApprovalRemarks).map(
									(chip, i) => (
										<button
											key={i}
											type='button'
											className='gz-leave-chip'
											onClick={() => applyQuickRemark(chip)}>
											+ {chip}
										</button>
									)
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Modal Footer */}
				<div className='gz-leave-modal-footer'>
					<div className='d-flex align-items-center'>
						{status ? (
							<span
								className={`fs-8 fw-semibold d-inline-flex align-items-center gap-1.5 ${
									status === 'APPROVED' ? 'text-success' : 'text-danger'
								}`}>
								<FontAwesomeIcon icon={status === 'APPROVED' ? faCheckCircle : faTimesCircle} />
								{status === 'APPROVED' ? 'Approving Leave' : 'Rejecting Leave'}
							</span>
						) : (
							<span className='text-muted fs-8 d-inline-flex align-items-center gap-1.5'>
								<FontAwesomeIcon icon={faInfoCircle} />
								Choose Approve or Reject above
							</span>
						)}
					</div>

					<div className='d-flex align-items-center gap-2'>
						<button
							type='button'
							className='gz-leave-cancel-btn'
							onClick={handleModalClose}
							disabled={submitting}>
							Cancel
						</button>

						<button
							type='button'
							className={`gz-leave-submit-btn ${
								status === 'APPROVED'
									? 'btn-approve'
									: status === 'REJECTED'
									? 'btn-reject'
									: 'btn-neutral'
							}`}
							onClick={handleModalSubmit}
							disabled={!status || submitting}>
							{submitting ? (
								<>
									<FontAwesomeIcon icon={faSpinner} spin className='me-1' />
									Processing...
								</>
							) : (
								<>
									<FontAwesomeIcon icon={status === 'REJECTED' ? faTimes : faCheck} className='me-1' />
									{status === 'APPROVED'
										? 'Confirm Approval'
										: status === 'REJECTED'
										? 'Confirm Rejection'
										: 'Select Action'}
								</>
							)}
						</button>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default HRLeave
