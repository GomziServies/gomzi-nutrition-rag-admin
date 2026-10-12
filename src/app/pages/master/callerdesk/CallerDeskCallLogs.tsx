import {
	faEye,
	faPhoneAlt,
	faSearch,
	faSpinner,
	faSync,
	faTimes,
	faVolumeUp,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { errorToast, successToast } from '../../../../_metronic/helpers/Utils'
import { getIVRNumbers, listCallReports, syncReports } from '../../../Functions/FGGroup/IVR'

// ─── CallerDesk call_list_v2 actual field shape ───────────────────────────────
interface CDRecord {
	id?: string
	sid_id?: string
	caller_num?: string
	deskphone?: string
	member_name?: string
	member_num?: string
	group_name?: string
	callresult?: string // "Answered", "No Answer", "Click-to-call"
	callstatus?: string // "ANSWER", "CANCEL", "AbandonedCall"
	total_duration?: string | number
	talk_duration?: string | number
	ringing_duration?: number
	startdatetime?: string
	enddatetime?: string
	call_date?: string
	file?: string // recording URL
	caller_name?: string | null
	Flow_type?: string // "IVR" | "WEBOBD"
	circle?: string | null
	key_pressed?: string
	block?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DESKPHONE_MAP: Record<string, string> = {
	'08062985216': 'FGIIT — 07600023468',
	'08069247707': 'FWG — 09510557783',
	'08069220266': 'GLS — 07878262098',
	'08062986681': 'Callback — 07878262098',
	'08062985138': 'New Outgoing — 07878262098',
}

const STATUS_OPTIONS = [
	{ label: 'All Status', value: '' },
	{ label: 'Answered', value: 'answered' },
	{ label: 'No Answer', value: 'no_answer' },
	{ label: 'Click-to-call', value: 'click_to_call' },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const getDeskphoneName = (num?: string) => (num ? DESKPHONE_MAP[num] || num : '—')

// ─── Main Component ───────────────────────────────────────────────────────────
interface CallerDeskCallLogsProps {
	defaultDeskphone?: string // If set, locks to this deskphone and hides dropdown
}

const CallerDeskCallLogs: FC<CallerDeskCallLogsProps> = ({ defaultDeskphone }) => {
	const [records, setRecords] = useState<CDRecord[]>([])
	const [total, setTotal] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(10)
	const [isLoading, setIsLoading] = useState(false)
	const [isSyncing, setIsSyncing] = useState(false)

	// Filters — if defaultDeskphone is passed, lock to it
	const [statusFilter, setStatusFilter] = useState('')
	const [deskphoneFilter, setDeskphoneFilter] = useState(defaultDeskphone || '')
	const [deskphoneOptions, setDeskphoneOptions] = useState<{ label: string; value: string }[]>([])

	// Recording modal
	const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
	const audioRef = useRef<HTMLAudioElement>(null)

	// ── Fetch from CallerDesk via list-reports ────────────────────────────────
	const fetchRecords = useCallback(
		async (pg = 1, lim = 10, status = '', deskphone = '') => {
			setIsLoading(true)
			try {
				const body: Record<string, any> = {
					current_page: pg,
					per_page: lim,
				}
				if (status) {
					if (status === 'answered') {
						body.callresult = 'Answered'
						body.callstatus = 'ANSWER'
						body.Flow_type = 'IVR'
					} else if (status === 'no_answer') {
						body.callresult = 'No Answer'
						body.callstatus = 'AbandonedCall'
					} else if (status === 'click_to_call') {
						body.callresult = 'Click-to-call'
						body.Flow_type = 'WEBOBD'
					}
				}
				if (deskphone) body.deskphone = deskphone

				const res = (await listCallReports(body)) as any

				// CallerDesk call_list_v2 returns records under "result" key
				const data: CDRecord[] = Array.isArray(res?.result)
					? res.result
					: Array.isArray(res?.data)
					? res.data
					: Array.isArray(res?.call_list)
					? res.call_list
					: Array.isArray(res?.calls)
					? res.calls
					: []

				const tot = parseInt(res?.total) || data.length
				const pages = parseInt(res?.total_page) || Math.max(1, Math.ceil(tot / lim))

				setRecords(data)
				setTotal(tot)
				setTotalPages(pages)
				setPage(pg)
			} catch (err: any) {
				errorToast(err?.message || 'Failed to load call logs')
			} finally {
				setIsLoading(false)
			}
		},
		[]
	)

	const loadDeskphones = async () => {
		try {
			const res = (await getIVRNumbers()) as any
			// Actual response key is "getdeskphone"
			const rawData = res?.getdeskphone || res?.result || res?.data || res
			const data = Array.isArray(rawData) ? rawData : []

			if (data.length > 0) {
				const options = data.map((item: any) => ({
					// Use existing DESKPHONE_MAP for friendly names
					label: DESKPHONE_MAP[item.deskphone] || item.deskphone || 'Unknown',
					value: item.deskphone || '',
				}))
				setDeskphoneOptions([{ label: 'All Deskphones', value: '' }, ...options])
			}
		} catch (err) {
			console.error('Failed to load deskphones:', err)
		}
	}

	useEffect(() => {
		// If a defaultDeskphone is set, always pass it on first load
		fetchRecords(1, limit, '', defaultDeskphone || '')
		if (!defaultDeskphone) loadDeskphones()
	}, []) // eslint-disable-line

	// ── Sync ──────────────────────────────────────────────────────────────────
	const handleSync = async () => {
		setIsSyncing(true)
		try {
			await syncReports({})
			successToast('Synced successfully!')
			fetchRecords(page, limit, statusFilter, deskphoneFilter)
		} catch (err: any) {
			errorToast(err?.message || 'Sync failed')
		} finally {
			setIsSyncing(false)
		}
	}

	// ── Filter handlers ───────────────────────────────────────────────────────
	const applyStatus = (val: string) => {
		setStatusFilter(val)
		fetchRecords(1, limit, val, deskphoneFilter)
	}
	const applyDeskphone = (val: string) => {
		setDeskphoneFilter(val)
		fetchRecords(1, limit, statusFilter, val)
	}
	const applyLimit = (val: number) => {
		setLimit(val)
		fetchRecords(1, val, statusFilter, deskphoneFilter)
	}
	const goPage = (pg: number) => {
		fetchRecords(pg, limit, statusFilter, deskphoneFilter)
	}

	// ── Helpers ───────────────────────────────────────────────────────────────
	const formatDuration = (sec?: string | number) => {
		const n = typeof sec === 'string' ? parseInt(sec) : sec ?? 0
		if (!n || isNaN(n)) return '—'
		if (n < 60) return `${n}s`
		return `${Math.floor(n / 60)}m ${n % 60}s`
	}

	const formatDateTime = (dateStr?: string) => {
		if (!dateStr || dateStr.startsWith('0000')) return { date: '—', time: '' }
		try {
			const d = new Date(dateStr.replace(' ', 'T'))
			if (isNaN(d.getTime())) return { date: dateStr, time: '' }
			return {
				date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
				time: d.toLocaleTimeString('en-IN', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
				}),
			}
		} catch {
			return { date: '—', time: '' }
		}
	}

	// Status badge: uses callresult ("Answered", "No Answer") or callstatus ("ANSWER", "CANCEL")
	const getStatusStyles = (callresult?: string) => {
		const s = (callresult || '').toLowerCase()
		if (s === 'answered' || s === 'answer') return { bg: '#e6fff4', color: '#17c964' }
		if (s === 'no answer' || s === 'noanswer') return { bg: '#fff7ed', color: '#f59e0b' }
		if (s === 'cancel' || s.includes('cancel')) return { bg: '#fff1f4', color: '#f31260' }
		if (s.includes('abandon')) return { bg: '#fff7ed', color: '#f59e0b' }
		if (s.includes('click') || s.includes('c2c')) return { bg: '#eef2ff', color: '#4361ee' }
		return { bg: '#f4f4f5', color: '#71717a' }
	}

	const openRecording = (url: string) => setRecordingUrl(url)
	const closeRecording = () => {
		audioRef.current?.pause()
		if (audioRef.current) audioRef.current.currentTime = 0
		setRecordingUrl(null)
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Friendly label for locked deskphone
	const lockedDeskphoneLabel = defaultDeskphone ? getDeskphoneName(defaultDeskphone) : null

	return (
		<div
			className='card'
			style={{
				borderRadius: '12px',
				border: '1px solid #f0f0f0',
				boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
			}}>
			{/* ── Header — Single horizontal row ── */}
			<div
				className='card-header border-0 px-6'
				style={{
					minHeight: 'unset',
					paddingTop: 16,
					paddingBottom: 16,
					borderBottom: '1px solid #f3f4f6',
				}}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 12,
						flexWrap: 'wrap',
					}}>
					{/* Left — all filters inline */}
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
						{/* Status */}
						<select
							style={{ ...selectStyle, width: '150px' }}
							value={statusFilter}
							onChange={(e) => applyStatus(e.target.value)}>
							{STATUS_OPTIONS.map((o) => (
								<option
									key={o.value}
									value={o.value}>
									{o.label}
								</option>
							))}
						</select>

						{/* Deskphone — show badge if locked, dropdown if not */}
						{lockedDeskphoneLabel ? (
							<span style={{
								height: '42px',
								display: 'inline-flex',
								alignItems: 'center',
								padding: '0 14px',
								borderRadius: '10px',
								background: '#eff6ff',
								border: '1px solid #bfdbfe',
								color: '#1d4ed8',
								fontSize: '13px',
								fontWeight: 600,
								whiteSpace: 'nowrap',
							}}>
								📞 {lockedDeskphoneLabel}
							</span>
						) : (
							<select
								style={{ ...selectStyle, width: '380px' }}
								value={deskphoneFilter}
								onChange={(e) => applyDeskphone(e.target.value)}>
								{deskphoneOptions.length > 0 ? (
									deskphoneOptions.map((o) => {
										const parts = o.label.split(' — ')
										const name = parts[0]
										const sim = parts[1] || ''
										const display = o.value
											? `${name} → ${o.value} ${sim ? `- ${sim}` : ''}`
											: o.label
										return (
											<option key={o.value} value={o.value}>
												{display}
											</option>
										)
									})
								) : (
									<option value=''>All Deskphones</option>
								)}
							</select>
						)}
					</div>

					{/* Right controls */}
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<select
							style={{ ...selectStyle, width: '72px' }}
							value={limit}
							onChange={(e) => applyLimit(Number(e.target.value))}>
							{PAGE_SIZE_OPTIONS.map((s) => (
								<option
									key={s}
									value={s}>
									{s}
								</option>
							))}
						</select>

						<button
							onClick={handleSync}
							disabled={isSyncing}
							style={{
								height: '36px',
								borderRadius: '8px',
								fontSize: '13px',
								fontWeight: 600,
								padding: '0 14px',
								background: '#eff6ff',
								color: '#2563eb',
								border: '1px solid #bfdbfe',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: 6,
							}}>
							<FontAwesomeIcon
								icon={faSync}
								spin={isSyncing}
								style={{ fontSize: '11px' }}
							/>
							{isSyncing ? 'Syncing...' : 'Sync'}
						</button>

						<span
							style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
							Total: <strong style={{ color: '#111827' }}>{total}</strong> records
						</span>
					</div>
				</div>
			</div>

			{/* ── Table ── */}
			<div className='card-body p-0'>
				<div style={{ overflowX: 'auto' }}>
					<table
						className='table align-middle mb-0'
						style={{ minWidth: '900px' }}>
						<thead>
							<tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
								<th style={thStyle}>No.</th>
								<th style={thStyle}>Deskphone</th>
								<th style={thStyle}>Caller</th>
								<th style={thStyle}>Member</th>
								<th style={thStyle}>Call Group</th>
								<th style={thStyle}>Date ↕</th>
								<th style={thStyle}>Duration</th>
								<th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
								<th style={thStyle}>Call Status</th>
								<th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr>
									<td
										colSpan={10}
										className='text-center py-12'>
										<FontAwesomeIcon
											icon={faSpinner}
											spin
											className='text-primary me-2'
										/>
										<span className='text-muted'>Loading call logs...</span>
									</td>
								</tr>
							) : records.length === 0 ? (
								<tr>
									<td
										colSpan={10}
										className='text-center py-12'>
										<div className='text-muted fs-6 mb-1'>No call logs found</div>
										<div className='text-muted fs-8'>
											Try changing your filters or click <strong>Sync</strong>
										</div>
									</td>
								</tr>
							) : (
								records.map((rec, idx) => {
									const sno = (page - 1) * limit + idx + 1
									const key = rec.id || rec.sid_id || String(sno)
									const caller = rec.caller_num || '—'
									const desk = rec.deskphone
									const member = rec.member_name || '—'
									const memberNum = rec.member_num || ''
									const group = rec.group_name || '—'
									// callresult = "Answered" / "No Answer" / "Click-to-call"
									const status = rec.callresult || rec.callstatus || '—'
									// callstatus = "ANSWER" / "CANCEL" / "AbandonedCall"
									const callStat = rec.callstatus || '—'
									const duration = rec.total_duration
									const recUrl = rec.file
									const dt = formatDateTime(rec.startdatetime || rec.call_date)
									const ss = getStatusStyles(rec.callresult || rec.callstatus)

									return (
										<tr
											key={`${key}-${idx}`}
											style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
											onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbff')}
											onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
											{/* No */}
											<td style={tdStyle}>
												<span className='text-muted fw-semibold fs-8'>{sno}</span>
											</td>

											{/* Deskphone */}
											<td style={tdStyle}>
												<div className='d-flex flex-column'>
													<span className='fw-bold text-gray-800 fs-8'>
														{getDeskphoneName(desk)}
													</span>
													<span className='text-muted fs-9'>{desk || ''}</span>
												</div>
											</td>

											{/* Caller */}
											<td style={tdStyle}>
												<div className='d-flex align-items-center gap-2'>
													<span
														style={{
															width: 28,
															height: 28,
															borderRadius: '50%',
															background: '#eef2ff',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															flexShrink: 0,
														}}>
														<FontAwesomeIcon
															icon={faPhoneAlt}
															style={{ fontSize: 11, color: '#4361ee' }}
														/>
													</span>
													<span className='fw-bold text-primary fs-8'>{caller}</span>
												</div>
											</td>

											{/* Member */}
											<td style={tdStyle}>
												<div className='d-flex flex-column'>
													<span className='fw-bold text-gray-800 fs-8'>{member}</span>
													{memberNum && <span className='text-muted fs-9'>{memberNum}</span>}
												</div>
											</td>

											{/* Call Group */}
											<td style={tdStyle}>
												<span className='fw-semibold text-gray-700 fs-8'>{group}</span>
											</td>

											{/* Date */}
											<td style={tdStyle}>
												<div className='d-flex flex-column'>
													<span className='fw-bold text-gray-800 fs-8'>{dt.date}</span>
													<span className='text-muted fs-9'>{dt.time}</span>
												</div>
											</td>

											{/* Duration */}
											<td style={tdStyle}>
												<span className='fw-semibold text-gray-700 fs-8'>
													{formatDuration(duration)}
												</span>
											</td>

											{/* Status badge — shows callresult */}
											<td style={{ ...tdStyle, textAlign: 'center' }}>
												<span
													style={{
														display: 'inline-block',
														padding: '3px 10px',
														borderRadius: '20px',
														fontSize: '11px',
														fontWeight: 600,
														whiteSpace: 'nowrap',
														background: ss.bg,
														color: ss.color,
													}}>
													{status}
												</span>
											</td>

											{/* Call Status — shows callstatus */}
											<td style={tdStyle}>
												<span className='text-gray-600 fs-8'>{callStat}</span>
											</td>

											{/* Action */}
											<td style={{ ...tdStyle, textAlign: 'center' }}>
												{recUrl ? (
													<button
														onClick={() => openRecording(recUrl)}
														title='Play Recording'
														style={{
															width: 34,
															height: 34,
															borderRadius: '50%',
															background: '#e8fff3',
															border: 'none',
															cursor: 'pointer',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}>
														<FontAwesomeIcon
															icon={faEye}
															style={{ fontSize: 13, color: '#17c964' }}
														/>
													</button>
												) : (
													<span
														style={{
															width: 34,
															height: 34,
															borderRadius: '50%',
															background: '#f4f4f5',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}>
														<FontAwesomeIcon
															icon={faEye}
															style={{ fontSize: 13, color: '#ccc' }}
														/>
													</span>
												)}
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* ── Pagination ── */}
			{!isLoading && totalPages >= 1 && (
				<div className='card-footer border-0 d-flex align-items-center justify-content-between px-6 py-4'>
					<span className='text-muted fs-8'>
						Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of{' '}
						{total} records
					</span>
					<div className='d-flex align-items-center gap-1'>
						<button
							className='btn btn-sm btn-light'
							style={pgBtnStyle}
							disabled={page <= 1}
							onClick={() => goPage(page - 1)}>
							‹
						</button>
						{(() => {
							const pages: number[] = []
							if (totalPages <= 3) {
								for (let i = 1; i <= totalPages; i++) pages.push(i)
							} else if (page === 1) {
								pages.push(1, 2, 3)
							} else if (page === totalPages) {
								pages.push(totalPages - 2, totalPages - 1, totalPages)
							} else {
								pages.push(page - 1, page, page + 1)
							}
							return pages.map((p) => (
								<button
									key={p}
									className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-light'}`}
									style={pgBtnStyle}
									onClick={() => goPage(p)}>
									{p}
								</button>
							))
						})()}
						<button
							className='btn btn-sm btn-light'
							style={pgBtnStyle}
							disabled={page >= totalPages}
							onClick={() => goPage(page + 1)}>
							›
						</button>
					</div>
				</div>
			)}

			{/* ── Recording Modal ── */}
			{recordingUrl && (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 9999,
						background: 'rgba(0,0,0,0.45)',
						backdropFilter: 'blur(4px)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
					onClick={closeRecording}>
					<div
						style={{
							background: '#fff',
							borderRadius: '16px',
							padding: '28px 32px',
							minWidth: '380px',
							maxWidth: '520px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
						}}
						onClick={(e) => e.stopPropagation()}>
						<div className='d-flex align-items-center justify-content-between mb-4'>
							<div className='d-flex align-items-center gap-3'>
								<div
									style={{
										width: 40,
										height: 40,
										borderRadius: '50%',
										background: '#e8fff3',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}>
									<FontAwesomeIcon
										icon={faVolumeUp}
										style={{ color: '#17c964', fontSize: 16 }}
									/>
								</div>
								<div>
									<div className='fw-bold text-gray-800 fs-6'>Call Recording</div>
									<div className='text-muted fs-8'>Tap play to listen</div>
								</div>
							</div>
							<button
								onClick={closeRecording}
								style={{
									background: '#f4f4f5',
									border: 'none',
									borderRadius: '50%',
									width: 32,
									height: 32,
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}>
								<FontAwesomeIcon
									icon={faTimes}
									style={{ color: '#71717a', fontSize: 13 }}
								/>
							</button>
						</div>
						<audio
							ref={audioRef}
							src={recordingUrl}
							controls
							style={{ width: '100%', borderRadius: '10px', outline: 'none' }}
						/>
						<div className='d-flex justify-content-end mt-4'>
							<a
								href={recordingUrl}
								target='_blank'
								rel='noreferrer'
								className='btn btn-sm btn-light-primary'
								style={{ fontSize: '12px', borderRadius: '8px' }}>
								Open in new tab
							</a>
						</div>
					</div>
				</div>
			)}

			<style>{`.table > tbody > tr:last-child td { border-bottom: none; }`}</style>
		</div>
	)
}

// ── Styles ────────────────────────────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
	height: '42px',
	borderRadius: '10px',
	fontSize: '14px',
	fontWeight: 600,
	border: '1px solid #e4e6ef',
	background: '#fff',
	color: '#111827',
	padding: '0 14px',
	cursor: 'pointer',
	outline: 'none',
	appearance: 'auto',
	boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
	transition: 'all 0.2s',
}

const thStyle: React.CSSProperties = {
	padding: '12px 14px',
	fontSize: '12px',
	fontWeight: 600,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	color: '#6b7280',
	whiteSpace: 'nowrap',
	borderBottom: '2px solid #f0f0f0',
}

const tdStyle: React.CSSProperties = {
	padding: '12px 14px',
	verticalAlign: 'middle',
	whiteSpace: 'nowrap',
}

const pgBtnStyle: React.CSSProperties = {
	borderRadius: '6px',
	height: '32px',
	minWidth: '32px',
	fontSize: '13px',
	padding: '0 10px',
}

export default CallerDeskCallLogs