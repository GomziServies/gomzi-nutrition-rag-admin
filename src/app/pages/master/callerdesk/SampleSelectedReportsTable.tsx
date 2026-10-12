import React, { FC, useEffect, useState } from 'react'

import DateFilter from '../../../components/DateRangePicker'
import { GetGnSampleSelectedReports } from '../../../Functions/FGGroup/GnFollowUpReport'
import UsersListPagination from '../../../components/TablePagination'
import TableButton from '../../../components/TableButton'
import { getCallLogs } from '../../../Functions/FGGroup/IVR'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { Modal } from 'react-bootstrap'
import { errorToast } from '../../../../_metronic/helpers/Utils'
import { useNavigate } from 'react-router-dom'
import { faPhoneVolume, faTimes, faVolumeUp, faArrowRight } from '@fortawesome/free-solid-svg-icons'

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
	.modal-xl {
		max-width: 1140px;
	}
`

interface SampleSelectedReportsTableProps {
	// Add props if needed, e.g., salesPerson filter
}

const SampleSelectedReportsTable: FC<SampleSelectedReportsTableProps> = () => {
	const navigate = useNavigate()
	const [sampleReports, setSampleReports] = useState<any[]>([])
	const [isSampleLoading, setIsSampleLoading] = useState(false)
	const [sampleDateRange, setSampleDateRange] = useState<[Date, Date] | null>([
		new Date(new Date().setHours(0, 0, 0, 0)),
		new Date(new Date().setHours(23, 59, 59, 999)),
	])
	const [sampleCurrentPage, setSampleCurrentPage] = useState(1)
	const [sampleTotalDocs, setSampleTotalDocs] = useState(0)
	const sampleLimit = 5

	// Call Recordings Modal State
	const [showLogsModal, setShowLogsModal] = useState(false)
	const [selectedMobile, setSelectedMobile] = useState('')
	const [callLogs, setCallLogs] = useState<any[]>([])
	const [isLogsLoading, setIsLogsLoading] = useState(false)

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

	const fetchSampleReports = async (range?: [Date, Date] | null, page = 1) => {
		setIsSampleLoading(true)
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
				limit: sampleLimit,
			}
			if (r) {
				query.start_date = fmt(r[0])
				query.end_date = fmt(r[1])
			}
			const res: any = await GetGnSampleSelectedReports(query)
			setSampleReports(res?.data ?? [])
			setSampleTotalDocs(res?.metadata?.pagination?.totalDocs || 0)
			setSampleCurrentPage(page)
		} catch (err: any) {
			errorToast(err?.message || 'Failed to load sample reports')
		} finally {
			setIsSampleLoading(false)
		}
	}

	useEffect(() => {
		const today = new Date()
		const start = new Date(today.setHours(0, 0, 0, 0))
		const end = new Date(today.setHours(23, 59, 59, 999))
		fetchSampleReports([start, end], 1)
	}, [])

	return (
		<div className='card-body py-4'>
			<style>{STYLES}</style>
			<div
			style={{
				marginTop: 24,
				background: '#fff',
				border: '1px solid #e2e8f0',
				borderRadius: 16,
				padding: 20,
			}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 20,
				}}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
						Selected Samples Reports
					</span>
					<span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
						Clients who have successfully selected samples
					</span>
				</div>
				<div 
					onClick={() => navigate('/master/sample-list')}
					style={{ 
						cursor: 'pointer',
						padding: '8px 16px',
						background: '#eff6ff',
						color: '#2563eb',
						borderRadius: '8px',
						fontSize: '13px',
						fontWeight: 600,
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						transition: 'all 0.2s'
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = '#dbeafe'
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = '#eff6ff'
					}}
				>
					More
					<FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '12px' }} />
				</div>
			</div>

			<div style={{ overflowX: 'auto' }}>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr style={{ borderBottom: '1px solid #f1f5f9' }}>
							<th
								style={{
									textAlign: 'left',
									padding: '12px 8px',
									fontSize: 11,
									fontWeight: 700,
									color: '#64748b',
									textTransform: 'uppercase',
									width: '50px',
								}}>
								No.
							</th>
							<th
								style={{
									textAlign: 'left',
									padding: '12px 8px',
									fontSize: 11,
									fontWeight: 700,
									color: '#64748b',
									textTransform: 'uppercase',
								}}>
								Client Name
							</th>
							<th
								style={{
									textAlign: 'left',
									padding: '12px 8px',
									fontSize: 11,
									fontWeight: 700,
									color: '#64748b',
									textTransform: 'uppercase',
								}}>
								Mobile
							</th>
							<th
								style={{
									textAlign: 'left',
									padding: '12px 8px',
									fontSize: 11,
									fontWeight: 700,
									color: '#64748b',
									textTransform: 'uppercase',
								}}>
								Selected Samples
							</th>
							<th
								style={{
									textAlign: 'left',
									padding: '12px 8px',
									fontSize: 11,
									fontWeight: 700,
									color: '#64748b',
									textTransform: 'uppercase',
								}}>
								Last Call Date
							</th>
							<th
								style={{
									textAlign: 'center',
									padding: '12px 8px',
									fontSize: 11,
									fontWeight: 700,
									color: '#64748b',
									textTransform: 'uppercase',
									width: '80px',
								}}>
								Action
							</th>
						</tr>
					</thead>
					<tbody>
						{isSampleLoading ? (
							<tr>
								<td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>
									<div
										style={{
											display: 'inline-block',
											width: 24,
											height: 24,
											border: '3px solid #f3f3f3',
											borderTop: '3px solid #3b82f6',
											borderRadius: '50%',
											animation: 'spin 1s linear infinite',
										}}
									/>
									<style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
								</td>
							</tr>
						) : sampleReports.length === 0 ? (
							<tr>
								<td colSpan={6} style={{ padding: '60px 0' }}>
									<div className='d-flex flex-column align-items-center'>
										<div
											style={{
												width: '60px',
												height: '60px',
												background: '#f1f5f9',
												borderRadius: '50%',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												marginBottom: '16px',
											}}>
											<i className='bi bi-box-seam fs-1 text-muted'></i>
										</div>
										<span style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>
											No samples selected today
										</span>
										<span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
											New samples will appear here once clients make their selection.
										</span>
									</div>
								</td>
							</tr>
						) : (
							sampleReports.map((report, idx) => {
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
									<tr
										key={report._id || idx}
										style={{
											borderBottom: '1px solid #f8fafc',
											transition: 'background 0.2s ease',
										}}
										onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
										onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
										<td style={{ padding: '12px 8px' }}>
											<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
												{(sampleCurrentPage - 1) * sampleLimit + idx + 1}
											</span>
										</td>
										<td style={{ padding: '12px 8px' }}>
											<span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
												{report.personalDetails?.client_name || '—'}
											</span>
										</td>
										<td style={{ padding: '12px 8px' }}>
											<span
												style={{
													fontSize: 12,
													fontWeight: 600,
													color: '#1e293b',
												}}>
												{report.personalDetails?.mobile || '—'}
											</span>
										</td>
										<td style={{ padding: '12px 30px 12px 10px', minWidth: '300px' }}>
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
															fontSize: 10,
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
										<td style={{ padding: '12px 8px' }}>
											<span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{callDate}</span>
										</td>
										<td style={{ padding: '12px 8px', textAlign: 'center' }}>
											<TableButton
												action='view'
												onClick={() => handleOpenLogs(report.personalDetails?.mobile)}
											/>
										</td>
									</tr>
								)
							})
						)}
					</tbody>
				</table>
			</div>

			{/* ── Pagination ── */}
			{!isSampleLoading && sampleTotalDocs > 0 && (
				<UsersListPagination
					totalPages={Math.ceil(sampleTotalDocs / sampleLimit)}
					currentPage={sampleCurrentPage}
					onPageChange={(page) => fetchSampleReports(sampleDateRange, page)}
				/>
			)}

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
												<span className='text-gray-600 fw-bold fs-5'>
													No recordings found
												</span>
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
		</div>
		</div>
	)
}

export default SampleSelectedReportsTable
