import {
	faCalendarCheck,
	faCheckCircle,
	faPlusCircle,
	faSort,
	faSortDown,
	faSortUp,
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
import SelectField from '../../../components/SelectField'
import UsersListPagination from '../../../components/TablePagination'
import DateFilter from '../../../components/DateRangePicker'
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

	const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const filteredData = leaveData.filter((sale: any) => {
		const matchesSearch =
			(sale?.admin_id?.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
			(sale?.reason || '').toLowerCase().includes((searchTerm || '').toLowerCase())

		let matchesDate = true
		if (dateRange && dateRange[0] && dateRange[1]) {
			const isAllDates = new Date(dateRange[0]).getFullYear() <= 2015
			if (!isAllDates && (sale?.from_date || sale?.createdAt)) {
				const start = new Date(dateRange[0])
				start.setHours(0, 0, 0, 0)
				const end = new Date(dateRange[1])
				end.setHours(23, 59, 59, 999)

				const leaveDate = new Date(sale?.from_date || sale?.createdAt)
				matchesDate = leaveDate >= start && leaveDate <= end
			}
		}

		return matchesSearch && matchesDate
	})

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
							data={sortedLeaveData}
							columns={[
								{ title: 'Employee Name', field: 'admin_id.full_name' },
								{ title: 'Start Date', field: 'from_date' },
								{ title: 'End Date', field: 'to_date' },
								{ title: 'Time', field: 'time' },
								{ title: 'Reason', field: 'reason' },
								{ title: 'Status', field: 'status' },
							]}
							filename='Leave_Requests'
						/>
					</div>

					{/* 4. Date Filter */}
					<div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
							defaultAllDates={true}
							storageKey='hr_leave_date_range'
						/>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
				<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='gz-inv-table table-hover align-middle mb-0'
									style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
									<thead>
										<tr style={{ background: '#F8FAFD', borderBottom: '1px solid #E4EAF2' }}>
											<th className='text-center ps-4' style={{ width: '60px' }}>#</th>
											<th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>NAME</span>
													<FontAwesomeIcon icon={sort === 'name' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'name' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th onClick={() => handleSort('from_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>START DATE</span>
													<FontAwesomeIcon icon={sort === 'from_date' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'from_date' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th onClick={() => handleSort('to_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>END DATE</span>
													<FontAwesomeIcon icon={sort === 'to_date' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'to_date' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th>TIME</th>
											<th onClick={() => handleSort('reason')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>REASON</span>
													<FontAwesomeIcon icon={sort === 'reason' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'reason' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
												<div className='d-flex align-items-center gap-2'>
													<span>STATUS</span>
													<FontAwesomeIcon icon={sort === 'status' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'status' ? 1 : 0.35, fontSize: '11px' }} />
												</div>
											</th>
											<th className='text-center pe-4'>ACTIONS</th>
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
				onHide={handleModalClose}
				className='modal fade'>
				<div className='modal-content' style={{ borderRadius: '16px', overflow: 'hidden' }}>
					{/* Modal Header */}
					<div
						className='modal-header py-4 px-6'
						style={{ borderBottom: '1px solid #E4EAF2', background: '#FFFFFF' }}>
						<div className='d-flex align-items-center gap-3'>
							<div
								style={{
									width: '38px',
									height: '38px',
									borderRadius: '10px',
									background: '#EAF1FB',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: '#172B4D',
								}}>
								<FontAwesomeIcon icon={faCalendarCheck} className='fs-5' />
							</div>
							<div>
								<h5 className='modal-title fw-bold text-gray-900 m-0 fs-5'>
									Review Leave Request
								</h5>
								<span className='text-muted fs-7'>
									Review employee request and record approval or rejection
								</span>
							</div>
						</div>
						<button
							type='button'
							className='btn-close'
							onClick={handleModalClose}></button>
					</div>

					{/* Modal Body */}
					<div className='modal-body p-6'>
						{/* Employee Name */}
						<div className='mb-4'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
								Employee Name
							</label>
							<input
								type='text'
								readOnly
								className='form-control form-control-solid'
								style={{ borderRadius: '8px' }}
								value={
									selectedLeave?.admin_id?.full_name
										? `${selectedLeave.admin_id.full_name} (${selectedLeave.admin_id.email || ''})`
										: '—'
								}
							/>
						</div>

						{/* Leave Duration */}
						<div className='mb-4'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
								Leave Duration
							</label>
							<input
								type='text'
								readOnly
								className='form-control form-control-solid'
								style={{ borderRadius: '8px' }}
								value={
									selectedLeave
										? `${DayJS(selectedLeave?.from_date).format('DD MMM YYYY, hh:mm A')} to ${DayJS(selectedLeave?.to_date).format('DD MMM YYYY, hh:mm A')} (${calculateLeaveDuration(selectedLeave?.from_date, selectedLeave?.to_date)})`
										: '—'
								}
							/>
						</div>

						{/* Employee Reason */}
						<div className='mb-4'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
								Employee Reason
							</label>
							<textarea
								rows={2}
								readOnly
								className='form-control form-control-solid'
								style={{ borderRadius: '8px', resize: 'vertical' }}
								value={
									selectedLeave?.reason
										? selectedLeave.reason.replace(/\[Proof:\s*[^\]]+\]/gi, '').trim()
										: 'No reason provided'
								}
							/>
							{(() => {
								const proofMatch = selectedLeave?.reason?.match(/\[Proof:\s*([^\]]+)\]/i)
								const proofUrl = proofMatch
									? proofMatch[1].trim()
									: selectedLeave?.document || selectedLeave?.proof || ''
								if (!proofUrl) return null
								const fullFileUrl = proofUrl.startsWith('http')
									? proofUrl
									: `https://files.fggroup.in/${proofUrl.replace(/^\/+/, '')}`
								return (
									<div className='mt-2'>
										<a
											href={fullFileUrl}
											target='_blank'
											rel='noopener noreferrer'
											className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-1.5'
											style={{ borderRadius: '6px', fontWeight: 600 }}>
											<i className='bi bi-paperclip fs-6'></i>
											<span>View Attached Proof</span>
										</a>
									</div>
								)
							})()}
						</div>

						{/* Decision */}
						<div className='mb-4'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
								Decision <span className='text-danger'>*</span>
							</label>
							<SelectField
								value={status}
								onChange={(val: any) => {
									const value = typeof val === 'object' && val?.target ? val.target.value : val
									setStatus(value)
								}}
								options={[
									{ value: '', label: 'Select Decision...' },
									{ value: 'APPROVED', label: 'Approve' },
									{ value: 'REJECTED', label: 'Reject' },
								]}
							/>
						</div>

						{/* Remarks & Notes */}
						<div className='mb-2'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-1'>
								Remarks / Notes{' '}
								{status === 'REJECTED' && <span className='text-danger'>*</span>}
							</label>
							<textarea
								rows={3}
								className='form-control form-control-solid'
								style={{ borderRadius: '8px', resize: 'vertical' }}
								placeholder={
									status === 'REJECTED'
										? 'Reason required for rejection...'
										: 'Add remarks or notes (optional)...'
								}
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
							/>
						</div>
					</div>

					{/* Modal Footer */}
					<div
						className='modal-footer py-3 px-6'
						style={{ borderTop: '1px solid #E4EAF2', background: '#FFFFFF' }}>
						<button
							type='button'
							className='btn btn-light'
							style={{ borderRadius: '8px', fontWeight: 600 }}
							onClick={handleModalClose}
							disabled={submitting}>
							Cancel
						</button>
						<button
							type='button'
							className='btn btn-primary d-flex align-items-center gap-2'
							style={{
								borderRadius: '8px',
								fontWeight: 600,
								background: '#172B4D',
								borderColor: '#172B4D',
							}}
							onClick={handleModalSubmit}
							disabled={!status || submitting}>
							{submitting ? (
								<>
									<span className='spinner-border spinner-border-sm'></span>
									<span>Processing...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faCheckCircle} />
									<span>
										{status === 'REJECTED'
											? 'Reject Leave'
											: status === 'APPROVED'
											? 'Approve Leave'
											: 'Save Changes'}
									</span>
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
