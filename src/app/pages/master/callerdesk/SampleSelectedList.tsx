import React, { FC, useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { errorToast } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetGnSampleSelectedReports } from '../../../Functions/FGGroup/GnFollowUpReport'
import { getCallLogs } from '../../../Functions/FGGroup/IVR'

const STYLES = `
	.recording-table thead th {
		padding-top: 1rem !important;
		padding-bottom: 1rem !important;
		letter-spacing: 0.05rem;
		font-size: 13px !important;
		font-weight: 600 !important;
		color: #A1A5B7 !important;
		text-transform: uppercase;
	}
	.recording-table thead tr {
		background: #f5f8fa;
		border-radius: 0.625rem;
		overflow: hidden;
	}
	.recording-table thead th:first-child {
		border-top-left-radius: 0.625rem;
		border-bottom-left-radius: 0.625rem;
		padding-left: 1.5rem !important;
	}
	.recording-table thead th:last-child {
		border-top-right-radius: 0.625rem;
		border-bottom-right-radius: 0.625rem;
		padding-right: 1.5rem !important;
	}
	.recording-table tbody td {
		padding-top: 1rem !important;
		padding-bottom: 1rem !important;
		vertical-align: middle;
	}
	.audio-player-custom {
		height: 32px;
		width: 350px;
		border-radius: 30px;
		background: #f1f3f9;
	}
	.sample-badge {
		background-color: #f1f5f9;
		border-radius: 6px;
		padding: 4px 10px;
		display: flex;
		alignItems: center;
		gap: 6px;
		color: #1e293b;
		font-weight: 600;
		font-size: 11px;
		border: 1px solid #e2e8f0;
	}
	.sample-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: #3b82f6;
	}
`

const SampleSelectedList: FC = () => {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [sampleReports, setSampleReports] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [sampleDateRange, setSampleDateRange] = useState<[Date, Date] | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [totalDocs, setTotalDocs] = useState(0)
	const [totalPages, setTotalPages] = useState(1)

	// Call Recordings Modal State
	const [showLogsModal, setShowLogsModal] = useState(false)
	const [selectedMobile, setSelectedMobile] = useState('')
	const [callLogs, setCallLogs] = useState<any[]>([])
	const [isLogsLoading, setIsLogsLoading] = useState(false)

	const fetchSampleReports = async (
		range?: [Date, Date] | null,
		page = 1,
		limit = 10,
		search = '',
		s = sort,
		so = sortOrder
	) => {
		setLoading(true)
		try {
			const fmt = (d: Date) => {
				const y = d.getFullYear()
				const m = String(d.getMonth() + 1).padStart(2, '0')
				const day = String(d.getDate()).padStart(2, '0')
				return `${y}-${m}-${day}`
			}
			const r = range ?? sampleDateRange
			const query: any = {
				page: page,
				limit: limit,
				search: search,
				sort: s,
				sortOrder: so,
			}
			if (r) {
				query.start_date = fmt(r[0])
				query.end_date = fmt(r[1])
			}
			const res: any = await GetGnSampleSelectedReports(query)
			if (res) {
				setSampleReports(res.data ?? [])
				const paginationInfo = res.pagination || res.metadata?.pagination
				setTotalDocs(paginationInfo?.totalDocs || paginationInfo?.total_docs || 0)
				setTotalPages(paginationInfo?.totalPages || paginationInfo?.total_pages || 1)
			}
		} catch (err: any) {
			errorToast(err?.message || 'Failed to load sample reports')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			fetchSampleReports(
				sampleDateRange,
				pagination.page,
				pagination.itemsPerPage,
				searchTerm,
				sort,
				sortOrder
			)
		}, 500)
		return () => clearTimeout(delayDebounceFn)
	}, [searchTerm, pagination.page, pagination.itemsPerPage, sampleDateRange, sort, sortOrder])

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSampleDateRange(range)
		setPagination({ ...pagination, page: 1 })
	}

	const fetchCallLogs = async (mobile: string) => {
		setIsLogsLoading(true)
		try {
			const res = (await getCallLogs({ search: mobile, limit: 100 })) as any
			if (res && res.data) {
				const logs = Array.isArray(res.data) ? res.data : res.data.data || []
				setCallLogs(logs)
			} else if (Array.isArray(res)) {
				setCallLogs(res)
			} else {
				setCallLogs([])
			}
		} catch (err: any) {
			errorToast('Failed to load call recordings')
		} finally {
			setIsLogsLoading(false)
		}
	}

	const handleOpenLogs = (mobile: string) => {
		setSelectedMobile(mobile)
		setShowLogsModal(true)
		fetchCallLogs(mobile)
	}

	const columns = [
		{ title: 'Client Name', field: 'personalDetails.client_name' },
		{ title: 'Mobile', field: 'personalDetails.mobile' },
		{ title: 'Selected Samples', field: 'callHistory.sampleSelection.selected_samples' },
		{ title: 'Last Call Date', field: 'callHistory.callDate' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Selected Samples List</PageTitle>
			<KTCard>
				<style>{STYLES}</style>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='d-flex align-items-center gap-4'>
							<div className='d-flex align-items-center position-relative my-1'>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
								<LengthMenu
									expenseData={sampleReports}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
						</div>
					</div>
					<div className='card-toolbar'>
						<div className='d-flex justify-content-end align-items-center gap-4'>
							<div style={{ width: '240px' }}>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
								/>
							</div>
						</div>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={sampleReports}
							columns={columns}
							loading={loading}
							pagination={pagination}
							setPagination={setPagination}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							visibleDetails={visibleDetails}
							disableSortFields={['no', 'samples', 'action']}
							renderRow={(report: any, index: number, actualIndex: number) => {
								const lastCallWithSamples = [...report.callHistory]
									.reverse()
									.find(
										(call) =>
											call.sampleSelection?.selected_samples &&
											call.sampleSelection.selected_samples.length > 0
									)

								const samples = lastCallWithSamples?.sampleSelection?.selected_samples || []
								const callDate = lastCallWithSamples?.callDate
									? new Date(lastCallWithSamples.callDate).toLocaleDateString('en-GB')
									: '—'

								return (
									<tr key={report._id || index}>
										<td>
											<span className='text-gray-600 fw-bold ms-6'>{actualIndex}</span>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-dark fw-bold mb-1 fs-6'>
													{report.personalDetails?.client_name || '---'}
												</span>
											</div>
										</td>
										<td>
											<span className='text-gray-700 fw-bold'>
												{report.personalDetails?.mobile || '---'}
											</span>
										</td>
										<td style={{ padding: '12px 30px 12px 10px', minWidth: '280px' }}>
											<div
												style={{
													display: 'grid',
													gridTemplateColumns: 'repeat(2, 1fr)',
													gap: 8,
												}}>
												{samples.map((s: string, i: number) => (
													<div
														key={i}
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: 6,
															fontSize: 11,
															fontWeight: 600,
															background: '#f1f5f9',
															color: '#334155',
															padding: '4px 8px',
															borderRadius: 6,
															border: '1px solid #e2e8f0',
															whiteSpace: 'nowrap',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
														}}>
														<div
															style={{
																width: 5,
																height: 5,
																borderRadius: '50%',
																background: '#3b82f6',
																flexShrink: 0,
															}}
														/>
														<span title={s}>{s}</span>
													</div>
												))}
											</div>
										</td>
										<td>
											<span className='text-gray-600 fw-bold'>{callDate}</span>
										</td>
										<td>
											<div className='d-flex justify-content-center'>
												<TableButton
													action='view'
													onClick={() => handleOpenLogs(report.personalDetails?.mobile)}
												/>
											</div>
										</td>
									</tr>
								)
							}}
						/>
					</div>
					{sampleReports.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{sampleReports.length > 0 && (
						<UsersListPagination
							totalPages={totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			{/* ── Call Recordings Modal ── */}
			<Modal
				show={showLogsModal}
				onHide={() => setShowLogsModal(false)}
				size='xl'
				centered>
				<Modal.Header
					closeButton
					style={{ borderBottom: '1px solid #f1f5f9', padding: '1.25rem 1.5rem' }}>
					<div className='d-flex align-items-center'>
						<div
							className='symbol symbol-40px me-4'
							style={{
								width: 40,
								height: 40,
								borderRadius: '12px',
								background: '#f1f5f9',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							<i className='bi bi-telephone-outbound fs-2 text-primary'></i>
						</div>
						<Modal.Title style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
							Call Recordings
						</Modal.Title>
					</div>
				</Modal.Header>
				<Modal.Body style={{ padding: '0 20px', minHeight: '350px' }}>
					<div className='table-responsive'>
						<table className='table table-flush align-middle table-row-bordered table-row-gray-200 gs-10 gy-6 mb-0 recording-table'>
							<thead>
								<tr className='bg-light fw-bold text-muted'>
									<th className='min-w-50px ps-9'>No.</th>
									<th className='min-w-50px'>Dir.</th>
									<th className='min-w-150px'>Date & Time</th>
									<th className='min-w-125px'>Agent Name</th>
									<th className='min-w-125px'>Status</th>
									<th className='min-w-100px'>Duration</th>
									<th className='min-w-250px text-center pe-9'>Recording Player</th>
								</tr>
							</thead>
							<tbody>
								{isLogsLoading ? (
									<tr>
										<td
											colSpan={7}
											className='text-center py-20'>
											<div
												className='spinner-border text-primary'
												role='status'>
												<span className='visually-hidden'>Loading...</span>
											</div>
										</td>
									</tr>
								) : callLogs.length === 0 ? (
									<tr>
										<td
											colSpan={7}
											className='text-center py-20'>
											<div className='d-flex flex-column align-items-center'>
												<i className='bi bi-telephone-x fs-3x text-warning mb-4'></i>
												<span className='text-gray-600 fw-bold fs-5'>No recordings found</span>
												<span className='text-muted fw-semibold fs-7'>
													Calls with this number haven't been recorded yet
												</span>
											</div>
										</td>
									</tr>
								) : (
									callLogs.map((log, idx) => {
										const isAnswered =
											log.call_status === 'Answered' ||
											log.status === 'ANSWER' ||
											log.raw_payload?.Status === 'ANSWER'
										const statusColor = isAnswered ? 'success' : 'danger'

										return (
											<tr key={log._id}>
												<td className='ps-9'>
													<span className='fw-bold text-gray-600'>{idx + 1}</span>
												</td>
												<td>
													{log.direction === 'WEBOBD' ? (
														<span
															className='badge badge-light-primary btn-icon btn-sm w-30px h-30px rounded-circle'
															title='Outgoing'>
															<i className='bi bi-telephone-outbound fs-6'></i>
														</span>
													) : (
														<span
															className='badge badge-light-success btn-icon btn-sm w-30px h-30px rounded-circle'
															title='Incoming'>
															<i className='bi bi-telephone-inbound fs-6'></i>
														</span>
													)}
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-gray-900 fw-bold fs-7'>
															{new Date(log.createdAt).toLocaleDateString('en-IN', {
																day: '2-digit',
																month: 'short',
																year: 'numeric',
															})}
														</span>
														<span className='text-muted fw-semibold fs-8 mt-1'>
															<i className='bi bi-clock me-1'></i>
															{new Date(log.createdAt).toLocaleTimeString('en-IN', {
																hour: '2-digit',
																minute: '2-digit',
																hour12: true,
															})}
														</span>
													</div>
												</td>
												<td>
													<span className='text-gray-700 fw-bold fs-6'>
														{log.member_name ||
															log.raw_payload?.receiver_name ||
															log.raw_payload?.DialWhomNumber ||
															'—'}
													</span>
												</td>
												<td>
													<span
														className={`badge badge-light-${statusColor} rounded-pill px-4 py-3 fw-bold fs-8`}>
														{isAnswered
															? 'Answered'
															: log.call_status || log.status || log.raw_payload?.Status}
													</span>
												</td>
												<td>
													<span className='text-gray-700 fw-bold fs-6'>
														{log.duration || log.raw_payload?.CallDuration || 0}s
													</span>
												</td>
												<td className='text-center pe-9'>
													{log.recording_url ||
													log.original_recording_url ||
													log.raw_payload?.recording_url ||
													log.file ||
													log.original_file ||
													log.recording_path ? (
														<div className='d-inline-block p-1 bg-light rounded-pill'>
															<audio
																controls
																className='audio-player-custom'
																onPlay={(e: any) => {
																	const audios = document.getElementsByTagName('audio')
																	for (let i = 0; i < audios.length; i++) {
																		if (audios[i] !== e.target) {
																			audios[i].pause()
																		}
																	}
																}}>
																<source
																	src={
																		log.recording_url ||
																		log.original_recording_url ||
																		log.raw_payload?.recording_url ||
																		log.file ||
																		log.original_file ||
																		log.recording_path
																	}
																/>
																Your browser does not support the audio element.
															</audio>
														</div>
													) : (
														<span className='text-muted fs-8'>No recording</span>
													)}
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
				</Modal.Body>
			</Modal>
		</>
	)
}

export default SampleSelectedList
