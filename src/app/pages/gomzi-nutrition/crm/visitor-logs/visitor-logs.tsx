import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faCookieBite,
	faMobileAlt,
	faDesktop,
	faMapMarkerAlt,
	faFileExcel,
	faSync,
	faCheckCircle,
	faTimesCircle,
	faUserCheck,
	faPhone,
	faGlobe,
} from '@fortawesome/free-solid-svg-icons'
import { faMeta, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import SearchFilter from '../../../../components/SearchFilter'
import GomziTablePagination from '../../../../components/GomziTablePagination'
import { GetVisitorCookieLogs } from '../../../../Functions/FGGroup'
import '../crm-theme.css'
import { cleanWhatsAppNumber } from '../crm-utils'

export const VisitorCookieLogs: React.FC = () => {
	const [logs, setLogs] = useState<any[]>([])
	const [stats, setStats] = useState<any>({
		totalVisitors: 0,
		acceptedCount: 0,
		rejectedCount: 0,
		acceptanceRate: 0,
		identifiedCount: 0,
		mobileCount: 0,
		desktopCount: 0,
		topAdSource: 'Meta Ads',
	})
	const [loading, setLoading] = useState(false)
	const [activeTab, setActiveTab] = useState<'all' | 'identified' | 'accepted' | 'rejected'>('all')
	const [deviceFilter, setDeviceFilter] = useState('all')
	const [searchTerm, setSearchTerm] = useState('')

	// Pagination
	const [page, setPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(25)

	// Date Range (default: past 90 days)
	const [dateRange, setDateRange] = useState<any>({
		from_date: DayJS().subtract(90, 'days').format('YYYY-MM-DD'),
		to_date: DayJS().format('YYYY-MM-DD'),
	})

	const fetchLogs = async () => {
		setLoading(true)
		try {
			const query: any = {
				consent: activeTab === 'accepted' || activeTab === 'rejected' ? activeTab : undefined,
				identified: activeTab === 'identified' ? 'yes' : undefined,
				device_type: deviceFilter,
				search: searchTerm || undefined,
				limit: 1000,
			}
			if (dateRange.from_date && dateRange.to_date) {
				query.from_date = dateRange.from_date
				query.to_date = dateRange.to_date
			}

			const res = await GetVisitorCookieLogs(query)
			if (res?.data) {
				setLogs(res.data.logs || [])
				if (res.data.stats) {
					setStats(res.data.stats)
				}
			}
		} catch (err) {
			console.error('Error fetching visitor cookie logs:', err)
			toast.error('Failed to load visitor traffic logs')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchLogs()
		setPage(1)
	}, [activeTab, deviceFilter, dateRange.from_date, dateRange.to_date])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		if (range && range[0] && range[1]) {
			setDateRange({
				from_date: DayJS(range[0]).format('YYYY-MM-DD'),
				to_date: DayJS(range[1]).format('YYYY-MM-DD'),
			})
		} else {
			setDateRange({ from_date: '', to_date: '' })
		}
	}

	// Filtered by search
	const filteredLogs = useMemo(() => {
		if (!searchTerm || !searchTerm.trim()) return logs
		const term = searchTerm.toLowerCase().trim()
		return logs.filter((l: any) => {
			return (
				(l.session_id || '').toLowerCase().includes(term) ||
				(l.full_name || '').toLowerCase().includes(term) ||
				(l.phone_number || '').toLowerCase().includes(term) ||
				(l.email || '').toLowerCase().includes(term) ||
				(l.city || '').toLowerCase().includes(term) ||
				(l.state || '').toLowerCase().includes(term) ||
				(l.browser || '').toLowerCase().includes(term) ||
				(l.utm_source || '').toLowerCase().includes(term) ||
				(l.utm_campaign || '').toLowerCase().includes(term) ||
				(l.landing_page || '').toLowerCase().includes(term)
			)
		})
	}, [logs, searchTerm])

	// Paginated
	const paginatedLogs = useMemo(() => {
		const start = (page - 1) * itemsPerPage
		return filteredLogs.slice(start, start + itemsPerPage)
	}, [filteredLogs, page, itemsPerPage])

	// WhatsApp Direct URL directly to the customer's phone
	const getWhatsAppUrl = (log: any) => {
		const phone = cleanWhatsAppNumber(log.phone_number)
		if (!phone) return ''

		const name = log.full_name || 'Fitness Enthusiast'

		const text = `Hi ${name}! 👋\n\nThank you for visiting RAG Nutrition (www.ragnutrition.in)! 💪\n\nWe noticed you were browsing our health and workout supplements. If you have any questions about which products match your training goals best, our team is here to assist.\n\n🎁 Here is an exclusive 5% welcome discount code: WELCOME5\n👉 Explore supplements: https://www.ragnutrition.in\n\nFeel free to ask us any questions!`

		return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
	}

	// Export to Excel
	const downloadExcel = () => {
		const rows = filteredLogs.map((l: any, idx: number) => ({
			'#': idx + 1,
			'Session ID': l.session_id,
			'Identified Customer': l.is_identified ? 'YES' : 'NO',
			'Customer Name': l.full_name || 'Anonymous',
			Phone: l.phone_number || 'N/A',
			Email: l.email || 'N/A',
			'Cookie Consent': l.cookie_consent,
			City: l.city || 'Surat',
			State: l.state || 'Gujarat',
			Country: l.country || 'India',
			'Device Type': l.device_type || 'Desktop',
			Browser: l.browser || 'Chrome',
			OS: l.os || 'Windows',
			'Ad / Traffic Source': l.utm_source || 'Direct',
			Campaign: l.utm_campaign || 'N/A',
			'Landing Page': l.landing_page || '/',
			'First Seen': DayJS(l.createdAt).format('DD/MM/YYYY hh:mm A'),
		}))

		const ws = XLSX.utils.json_to_sheet(rows)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Visitor_Cookie_Logs')
		XLSX.writeFile(wb, `RAG_Visitor_Traffic_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	return (
		<div className='crm-container'>
			<PageTitle breadcrumbs={[]}>Anonymous Visitors & Cookie Logs</PageTitle>

			{/* Breadcrumb */}
			<div className='crm-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/crm/leads'>CRM & Leads</Link>
				<span className='sep'>/</span>
				<span className='current'>Anonymous Visitors & Cookies</span>
			</div>

			{/* Page Header */}
			<div className='crm-header'>
				<div>
					<h1 className='crm-title'>
						<FontAwesomeIcon icon={faCookieBite} style={{ color: '#F59E0B' }} />
						Anonymous Website Visitors & Cookie Telemetry
					</h1>
					<p className='crm-subtitle'>
						Monitor non-logged-in visitor traffic, cookie consent choices, and identity-stitched returning customers.
					</p>
				</div>
				<div className='crm-actions'>
					<button className='crm-btn-secondary' onClick={downloadExcel} title='Export to Excel'>
						<FontAwesomeIcon icon={faFileExcel} style={{ color: '#107C41' }} />
						Export Excel
					</button>
					<button className='crm-btn-secondary' onClick={fetchLogs} title='Refresh Data'>
						<FontAwesomeIcon icon={faSync} />
						Refresh
					</button>
				</div>
			</div>

			{/* Metrics */}
			<div className='crm-metrics-grid'>
				<div className='crm-stat-card'>
					<div className='crm-stat-icon blue'>
						<FontAwesomeIcon icon={faGlobe} />
					</div>
					<div>
						<div className='crm-stat-value'>{stats.totalVisitors || logs.length}</div>
						<div className='crm-stat-label'>Total Tracked Visitors</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon purple'>
						<FontAwesomeIcon icon={faUserCheck} />
					</div>
					<div>
						<div className='crm-stat-value'>{stats.identifiedCount || 0}</div>
						<div className='crm-stat-label'>Stitched Returning Profiles</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon green'>
						<FontAwesomeIcon icon={faCheckCircle} />
					</div>
					<div>
						<div className='crm-stat-value'>
							{stats.acceptedCount}{' '}
							<span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
								({stats.acceptanceRate}%)
							</span>
						</div>
						<div className='crm-stat-label'>Accepted Cookies</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon red'>
						<FontAwesomeIcon icon={faTimesCircle} />
					</div>
					<div>
						<div className='crm-stat-value'>{stats.rejectedCount}</div>
						<div className='crm-stat-label'>Rejected Non-Essential</div>
					</div>
				</div>
			</div>

			{/* Filter Tabs */}
			<div className='crm-stage-tabs'>
				<button
					className={`crm-stage-tab ${activeTab === 'all' ? 'active' : ''}`}
					onClick={() => setActiveTab('all')}>
					<span>All Traffic</span>
					<span className='badge'>{stats.totalVisitors || logs.length}</span>
				</button>
				<button
					className={`crm-stage-tab ${activeTab === 'identified' ? 'active' : ''}`}
					onClick={() => setActiveTab('identified')}>
					<span>👑 Identified Profiles</span>
					<span className='badge'>{stats.identifiedCount || 0}</span>
				</button>
				<button
					className={`crm-stage-tab ${activeTab === 'accepted' ? 'active' : ''}`}
					onClick={() => setActiveTab('accepted')}>
					<span>🟢 Cookies Accepted</span>
					<span className='badge'>{stats.acceptedCount}</span>
				</button>
				<button
					className={`crm-stage-tab ${activeTab === 'rejected' ? 'active' : ''}`}
					onClick={() => setActiveTab('rejected')}>
					<span>🔴 Cookies Rejected</span>
					<span className='badge'>{stats.rejectedCount}</span>
				</button>
			</div>

			{/* Filters Bar */}
			<div className='crm-filters-card'>
				<div className='crm-filters-left'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						placeholder='Search session, name, phone, city...'
					/>
					<select
						className='crm-select'
						value={deviceFilter}
						onChange={(e) => setDeviceFilter(e.target.value)}>
						<option value='all'>All Devices</option>
						<option value='Mobile'>Mobile Phones</option>
						<option value='Desktop'>Desktop / PC</option>
						<option value='Tablet'>Tablets</option>
					</select>
					<DateFilter
						startDate={dateRange.from_date ? new Date(dateRange.from_date) : null}
						endDate={dateRange.to_date ? new Date(dateRange.to_date) : null}
						onDateRangeChange={handleDateRangeChange}
					/>
				</div>
			</div>

			{/* Table Card */}
			<div className='crm-table-card'>
				<div className='crm-table-container'>
					<table className='crm-table'>
						<thead>
							<tr>
								<th>#</th>
								<th>Visitor & Identity</th>
								<th>Cookie Consent</th>
								<th>Location</th>
								<th>Device & Browser</th>
								<th>Ad / Traffic Source</th>
								<th>Landing Page</th>
								<th style={{ textAlign: 'center' }}>Connect</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
										<div className='spinner-border spinner-border-sm text-primary me-2' role='status' />
										Loading visitor cookie telemetry...
									</td>
								</tr>
							) : paginatedLogs.length === 0 ? (
								<tr>
									<td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
										<FontAwesomeIcon icon={faCookieBite} style={{ fontSize: '32px', color: '#CBD5E1', marginBottom: '12px' }} />
										<div style={{ fontWeight: 600, color: '#1E293B' }}>No visitor sessions found</div>
										<p style={{ fontSize: '13px', margin: '4px 0 0' }}>
											Sessions log automatically when visitors interact with the storefront cookie banner.
										</p>
									</td>
								</tr>
							) : (
								paginatedLogs.map((item: any, idx: number) => {
									const actualIndex = (page - 1) * itemsPerPage + idx + 1
									const isMobile = item.device_type === 'Mobile'
									const customerPhone = cleanWhatsAppNumber(item.phone_number)
									const isIdentified = item.is_identified || Boolean(customerPhone)
									const waUrl = customerPhone ? getWhatsAppUrl(item) : ''

									return (
										<tr key={item._id || idx}>
											<td>
												<span style={{ fontWeight: 600, color: '#94A3B8', fontSize: '12.5px' }}>
													{actualIndex}
												</span>
											</td>

											{/* Identity & Session */}
											<td>
												{isIdentified ? (
													<div className='crm-user-cell'>
														<div
															className='crm-user-avatar'
															style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
															<FontAwesomeIcon icon={faUserCheck} />
														</div>
														<div>
															<div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>
																{item.full_name || 'Stitched Customer'}
															</div>
															<div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>
																{item.phone_number}
															</div>
															{item.email && (
																<div style={{ fontSize: '11px', color: '#64748B' }}>{item.email}</div>
															)}
														</div>
													</div>
												) : (
													<div>
														<span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A', fontSize: '12.5px' }}>
															{item.session_id}
														</span>
														<div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
															Anonymous Visitor {item.ip_address ? `• IP: ${item.ip_address}` : ''}
														</div>
													</div>
												)}
											</td>

											{/* Consent Status */}
											<td>
												{item.cookie_consent === 'ACCEPTED' ? (
													<span className='crm-stage-pill order-confirm'>
														🟢 Accepted
													</span>
												) : item.cookie_consent === 'REJECTED' ? (
													<span className='crm-stage-pill lost'>
														🔴 Rejected
													</span>
												) : (
													<span className='crm-stage-pill follow-up'>
														🟡 Pending
													</span>
												)}
											</td>

											{/* Location */}
											<td>
												<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
													<FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#EF4444', fontSize: '12px' }} />
													<span style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px' }}>
														{item.city || 'Surat'}, {item.state || 'Gujarat'}
													</span>
												</div>
												<div style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '18px' }}>
													{item.country || 'India'}
												</div>
											</td>

											{/* Device & Browser */}
											<td>
												<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
													<FontAwesomeIcon
														icon={isMobile ? faMobileAlt : faDesktop}
														style={{ color: isMobile ? '#2563EB' : '#64748B', fontSize: '14px' }}
													/>
													<div>
														<div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
															{item.device_type} • {item.browser}
														</div>
														<div style={{ fontSize: '11px', color: '#64748B' }}>
															{item.os} {item.screen_resolution ? `(${item.screen_resolution})` : ''}
														</div>
													</div>
												</div>
											</td>

											{/* Referral / Ad Campaign */}
											<td>
												<div>
													<span
														className={`crm-source-pill ${
															item.utm_source === 'Meta Ads' ? 'meta' : 'website'
														}`}>
														{item.utm_source === 'Meta Ads' && (
															<FontAwesomeIcon icon={faMeta} style={{ marginRight: '4px' }} />
														)}
														{item.utm_source || 'Direct Traffic'}
													</span>
													{item.utm_campaign && (
														<div style={{ fontSize: '11.5px', color: '#475569', marginTop: '3px' }}>
															Campaign: {item.utm_campaign}
														</div>
													)}
												</div>
											</td>

											{/* Landing Page */}
											<td>
												<span style={{ fontSize: '12.5px', color: '#475569', fontFamily: 'monospace' }}>
													{item.landing_page || '/'}
												</span>
											</td>

											{/* Connect (1-Click WhatsApp + Direct Call to Visitor) */}
											<td style={{ textAlign: 'center' }}>
												<div className='crm-action-group' style={{ justifyContent: 'center' }}>
													{customerPhone ? (
														<>
															<a
																href={waUrl}
																target='_blank'
																rel='noopener noreferrer'
																className='crm-btn-wa'
																title={`Open WhatsApp Chat with ${item.full_name || 'Visitor'} (${customerPhone})`}>
																<FontAwesomeIcon icon={faWhatsapp} />
																Chat
															</a>
															<a href={`tel:${customerPhone}`} className='crm-btn-call' title={`Call Visitor: ${customerPhone}`}>
																<FontAwesomeIcon icon={faPhone} />
															</a>
														</>
													) : (
														<span style={{ color: '#CBD5E1', fontSize: '12px' }}>Unidentified</span>
													)}
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
					<div style={{ fontSize: '13px', color: '#64748B' }}>
						Showing {paginatedLogs.length} of {filteredLogs.length} visitor sessions
					</div>
					<GomziTablePagination
						totalCount={filteredLogs.length}
						currentPage={page}
						pageSize={itemsPerPage}
						onPageChange={(p: number) => setPage(p)}
					/>
				</div>
			</div>
		</div>
	)
}

export default VisitorCookieLogs
