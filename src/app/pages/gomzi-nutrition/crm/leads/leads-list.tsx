import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faBullseye,
	faPhone,
	faEnvelope,
	faCalendarAlt,
	faUserTie,
	faPlus,
	faFileExcel,
	faCommentDots,
	faTrash,
	faFilter,
	faCheckCircle,
	faClock,
	faTimesCircle,
	faFire,
	faTags,
	faSync,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faMeta } from '@fortawesome/free-brands-svg-icons'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import SearchFilter from '../../../../components/SearchFilter'
import GomziTablePagination from '../../../../components/GomziTablePagination'
import {
	GetFacebookLeads,
	CreateManualFacebookLead,
	UpdateFacebookLead,
	DeleteFacebookLead,
	GetEmployees,
} from '../../../../Functions/FGGroup'
import toast from 'react-hot-toast'
import '../crm-theme.css'
import { cleanWhatsAppNumber } from '../crm-utils'

const STAGES = [
	{ id: 'all', label: 'All Leads' },
	{ id: 'New Lead', label: 'New Lead' },
	{ id: 'Follow-up', label: 'Follow-up' },
	{ id: 'Potential', label: 'Potential' },
	{ id: 'Order Confirm', label: 'Order Confirm' },
	{ id: 'Lost', label: 'Lost' },
]

// Color styles & status indicators for Stage dropdown
const STAGE_STYLES: Record<string, { bg: string; color: string; border: string; dot: string; glow: string }> = {
	'New Lead': {
		bg: '#EFF6FF',
		color: '#1D4ED8',
		border: '#93C5FD',
		dot: '🔵',
		glow: 'rgba(59, 130, 246, 0.25)',
	},
	'Follow-up': {
		bg: '#FFFBEB',
		color: '#B45309',
		border: '#FCD34D',
		dot: '🟡',
		glow: 'rgba(245, 158, 11, 0.25)',
	},
	'Potential': {
		bg: '#FAF5FF',
		color: '#7E22CE',
		border: '#D8B4FE',
		dot: '🟣',
		glow: 'rgba(168, 85, 247, 0.25)',
	},
	'Order Confirm': {
		bg: '#ECFDF5',
		color: '#047857',
		border: '#6EE7B7',
		dot: '🟢',
		glow: 'rgba(16, 185, 129, 0.25)',
	},
	'Lost': {
		bg: '#FEF2F2',
		color: '#B91C1C',
		border: '#FCA5A5',
		dot: '🔴',
		glow: 'rgba(239, 68, 68, 0.25)',
	},
}

const SOURCES = [
	{ id: 'all', label: 'All Sources' },
	{ id: 'Website Inquiry', label: 'Website Inquiry' },
	{ id: 'Wholesale B2B', label: 'Wholesale B2B' },
	{ id: 'Meta Ads', label: 'Meta Ads' },
	{ id: 'Incomplete Checkout', label: 'Incomplete Checkout' },
	{ id: 'Pull_marketing', label: 'Manual Entry' },
]

export const CRMLeadsList: React.FC = () => {
	const [leads, setLeads] = useState<any[]>([])
	const [stats, setStats] = useState<any>({})
	const [loading, setLoading] = useState(false)
	const [activeStage, setActiveStage] = useState('all')
	const [selectedSource, setSelectedSource] = useState('all')
	const [selectedStaff, setSelectedStaff] = useState('all')
	const [searchTerm, setSearchTerm] = useState('')
	const [employees, setEmployees] = useState<any[]>([])

	// Date Range (default: past 1 year to include all historical leads)
	const [dateRange, setDateRange] = useState<any>({
		from_date: DayJS().subtract(365, 'days').format('YYYY-MM-DD'),
		to_date: DayJS().format('YYYY-MM-DD'),
	})

	// Pagination
	const [page, setPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(25)

	// Modals
	const [showAddModal, setShowAddModal] = useState(false)
	const [showNotesModal, setShowNotesModal] = useState(false)
	const [activeLead, setActiveLead] = useState<any>(null)
	const [newNoteText, setNewNoteText] = useState('')

	// Add Lead Form State
	const [addForm, setAddForm] = useState({
		full_name: '',
		phone_number: '',
		email: '',
		city: '',
		source: 'Website Inquiry',
		stage: 'New Lead',
		assigned_to: '',
		product_interested: '',
		estimated_order_value: '',
		additional_note: '',
		tag: 'rag_nutrition',
	})

	// Fetch Employees for Assignment
	useEffect(() => {
		const loadEmployees = async () => {
			try {
				const res = await GetEmployees({ limit: 100 })
				const emps = res?.data?.employees || res?.data || []
				setEmployees(Array.isArray(emps) ? emps : [])
			} catch (err) {
				console.error('Failed to load staff employees:', err)
			}
		}
		loadEmployees()
	}, [])

	// Fetch Leads from Backend (Strictly RAG Nutrition)
	const fetchLeads = async () => {
		setLoading(true)
		try {
			const query: any = {
				tag: 'rag_nutrition',
				stage: activeStage,
				source: selectedSource,
				assigned_to: selectedStaff,
				search: searchTerm || undefined,
				limit: 2000,
			}
			if (dateRange.from_date && dateRange.to_date) {
				query.from_date = dateRange.from_date
				query.to_date = dateRange.to_date
			}

			const res = await GetFacebookLeads(query)
			if (res?.data) {
				const leadsList = res.data.leads || []
				setLeads(leadsList)
				if (res.data.stats) {
					setStats(res.data.stats)
				}
			}
		} catch (error) {
			console.error('Error fetching CRM leads:', error)
			toast.error('Failed to load CRM leads. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchLeads()
		setPage(1)
	}, [activeStage, selectedSource, selectedStaff, dateRange.from_date, dateRange.to_date])

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

	// Filtered leads
	const filteredLeads = useMemo(() => {
		if (!searchTerm || !searchTerm.trim()) return leads
		const term = searchTerm.toLowerCase().trim()
		return leads.filter((item: any) => {
			const name = (item.full_name || '').toLowerCase()
			const phone = (item.phone_number || '').toString()
			const email = (item.email || '').toLowerCase()
			const city = (item.city || '').toLowerCase()
			const product = (item.product_interested || '').toLowerCase()
			const ad = (item.ad_name || '').toLowerCase()
			return (
				name.includes(term) ||
				phone.includes(term) ||
				email.includes(term) ||
				city.includes(term) ||
				product.includes(term) ||
				ad.includes(term)
			)
		})
	}, [leads, searchTerm])

	// Paginated Leads
	const paginatedLeads = useMemo(() => {
		const start = (page - 1) * itemsPerPage
		return filteredLeads.slice(start, start + itemsPerPage)
	}, [filteredLeads, page, itemsPerPage])

	// Quick Stage Update
	const handleStageChange = async (leadId: string, newStage: string) => {
		try {
			await UpdateFacebookLead({
				lead_id: leadId,
				stage: newStage,
				note: `Stage changed to ${newStage}`,
			})
			toast.success(`Lead stage updated to ${newStage}`)
			// Update locally
			setLeads((prev) =>
				prev.map((lead) => (lead._id === leadId || lead.lead_id === leadId ? { ...lead, stage: newStage } : lead))
			)
			// Refresh stats
			fetchLeads()
		} catch (err: any) {
			toast.error(err?.message || 'Failed to update lead stage')
		}
	}

	// Quick Staff Assign Update
	const handleStaffAssign = async (leadId: string, staffId: string) => {
		try {
			await UpdateFacebookLead({
				lead_id: leadId,
				assigned_to: staffId || null,
			})
			toast.success('Assigned staff updated successfully')
			const assignedObj = employees.find((e) => e._id === staffId)
			setLeads((prev) =>
				prev.map((lead) =>
					lead._id === leadId || lead.lead_id === leadId ? { ...lead, assigned_to: assignedObj } : lead
				)
			)
		} catch (err: any) {
			toast.error(err?.message || 'Failed to reassign lead')
		}
	}

	// Next Follow Up Date Update
	const handleFollowUpDateChange = async (leadId: string, dateVal: string) => {
		try {
			await UpdateFacebookLead({
				lead_id: leadId,
				next_follow_up_date: dateVal ? new Date(dateVal) : null,
			})
			toast.success('Follow-up date scheduled')
			setLeads((prev) =>
				prev.map((lead) =>
					lead._id === leadId || lead.lead_id === leadId ? { ...lead, next_follow_up_date: dateVal } : lead
				)
			)
		} catch (err: any) {
			toast.error(err?.message || 'Failed to update follow-up date')
		}
	}

	// Add Note to Lead
	const handleAddNote = async () => {
		if (!newNoteText.trim() || !activeLead) return
		try {
			const notePayload = {
				lead_id: activeLead._id || activeLead.lead_id,
				additional_note: newNoteText.trim(),
			}
			await UpdateFacebookLead(notePayload)
			toast.success('Note added to lead timeline')
			setNewNoteText('')
			fetchLeads()
			setShowNotesModal(false)
		} catch (err: any) {
			toast.error(err?.message || 'Failed to save note')
		}
	}

	// Delete Lead
	const handleDeleteLead = async (leadId: string) => {
		if (!window.confirm('Are you sure you want to delete this lead?')) return
		try {
			await DeleteFacebookLead(leadId)
			toast.success('Lead deleted successfully')
			setLeads((prev) => prev.filter((l) => l._id !== leadId && l.lead_id !== leadId))
		} catch (err: any) {
			toast.error(err?.message || 'Failed to delete lead')
		}
	}

	// Create Lead Submit
	const handleCreateLead = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!addForm.full_name || !addForm.phone_number) {
			toast.error('Please enter full name and phone number')
			return
		}
		try {
			await CreateManualFacebookLead({
				...addForm,
				tag: 'rag_nutrition',
			})
			toast.success('New lead added to RAG CRM!')
			setShowAddModal(false)
			setAddForm({
				full_name: '',
				phone_number: '',
				email: '',
				city: '',
				source: 'Website Inquiry',
				stage: 'New Lead',
				assigned_to: '',
				product_interested: '',
				estimated_order_value: '',
				additional_note: '',
				tag: 'rag_nutrition',
			})
			fetchLeads()
		} catch (err: any) {
			toast.error(err?.message || 'Failed to create lead')
		}
	}

	// WhatsApp 1-Click Link Generator: Directly opens the customer's phone number with tailored prewritten message
	const getWhatsAppUrl = (lead: any) => {
		const phone = cleanWhatsAppNumber(lead.phone_number || lead.mobile)
		if (!phone) return ''

		const name = lead.full_name || lead.name || 'Valued Athlete'
		const productInterest = lead.product_interested ? ` regarding ${lead.product_interested}` : ''

		const text = `Hi ${name}! 👋\n\nThank you for reaching out to RAG Nutrition! 💪\nWe received your inquiry${productInterest}.\n\nOur team is here to assist you with our premium supplement range, exclusive deals, and fast doorstep delivery.\n\nHow can we help you achieve your fitness goals today?`

		return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
	}

	// Export to Excel
	const downloadExcel = () => {
		const data = filteredLeads.map((item: any, idx: number) => ({
			'#': idx + 1,
			'Full Name': item.full_name || 'N/A',
			Phone: item.phone_number || 'N/A',
			Email: item.email || 'N/A',
			City: item.city || 'N/A',
			Source: item.source || item.platform || 'Website',
			'Product Interested': item.product_interested || 'N/A',
			'Est. Value (₹)': item.estimated_order_value || 0,
			Stage: item.stage || 'New Lead',
			'Assigned Staff': item.assigned_to
				? `${item.assigned_to.first_name || ''} ${item.assigned_to.last_name || ''}`.trim()
				: 'Unassigned',
			'Next Follow-up': item.next_follow_up_date
				? DayJS(item.next_follow_up_date).format('DD/MM/YYYY')
				: 'Not Scheduled',
			'Created Date': DayJS(item.created_time || item.createdAt).format('DD/MM/YYYY hh:mm A'),
		}))

		const ws = XLSX.utils.json_to_sheet(data)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'RAG_Leads')
		XLSX.writeFile(wb, `RAG_Leads_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	// Render Stage Pill Class
	const getStageClass = (stage: string) => {
		switch (stage) {
			case 'New Lead':
				return 'new-lead'
			case 'Follow-up':
				return 'follow-up'
			case 'Potential':
				return 'potential'
			case 'Order Confirm':
				return 'order-confirm'
			case 'Lost':
				return 'lost'
			default:
				return 'new-lead'
		}
	}

	return (
		<div className='crm-container'>
			<PageTitle breadcrumbs={[]}>CRM & Leads Management</PageTitle>

			{/* Breadcrumb */}
			<div className='crm-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>CRM & Leads</span>
				<span className='sep'>/</span>
				<span className='current'>All Leads</span>
			</div>

			{/* Page Header */}
			<div className='crm-header'>
				<div>
					<h1 className='crm-title'>
						<FontAwesomeIcon icon={faBullseye} style={{ color: '#2563EB' }} />
						RAG Website CRM & Inquiries
					</h1>
					<p className='crm-subtitle'>
						Dedicated CRM for RAG website visitors, wholesale inquiries, meta campaigns, and follow-ups.
					</p>
				</div>
				<div className='crm-actions'>
					<button className='crm-btn-secondary' onClick={downloadExcel} title='Export leads to Excel'>
						<FontAwesomeIcon icon={faFileExcel} style={{ color: '#107C41' }} />
						Export Excel
					</button>
					<button className='crm-btn-secondary' onClick={fetchLeads} title='Refresh leads'>
						<FontAwesomeIcon icon={faSync} />
						Refresh
					</button>
					<button className='crm-btn-primary' onClick={() => setShowAddModal(true)}>
						<FontAwesomeIcon icon={faPlus} />
						Add New Lead
					</button>
				</div>
			</div>

			{/* Metrics Cards */}
			<div className='crm-metrics-grid'>
				<div className='crm-stat-card'>
					<div className='crm-stat-icon blue'>
						<FontAwesomeIcon icon={faBullseye} />
					</div>
					<div>
						<div className='crm-stat-value'>{stats.all ?? leads.length}</div>
						<div className='crm-stat-label'>Total RAG Leads</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon amber'>
						<FontAwesomeIcon icon={faClock} />
					</div>
					<div>
						<div className='crm-stat-value'>{stats['Follow-up'] ?? 0}</div>
						<div className='crm-stat-label'>Active Follow-ups</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon purple'>
						<FontAwesomeIcon icon={faFire} />
					</div>
					<div>
						<div className='crm-stat-value'>{stats['Potential'] ?? 0}</div>
						<div className='crm-stat-label'>High-Intent Potential</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon green'>
						<FontAwesomeIcon icon={faCheckCircle} />
					</div>
					<div>
						<div className='crm-stat-value'>{stats['Order Confirm'] ?? 0}</div>
						<div className='crm-stat-label'>Orders Confirmed</div>
					</div>
				</div>
			</div>

			{/* Stage Tabs */}
			<div className='crm-stage-tabs'>
				{STAGES.map((st) => (
					<button
						key={st.id}
						className={`crm-stage-tab ${activeStage === st.id ? 'active' : ''}`}
						onClick={() => setActiveStage(st.id)}>
						<span>{st.label}</span>
						<span className='badge'>{st.id === 'all' ? (stats.all ?? leads.length) : (stats[st.id] ?? 0)}</span>
					</button>
				))}
			</div>

			{/* Filters Bar */}
			<div className='crm-filters-card'>
				<div className='crm-filters-left'>
					{/* Search */}
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						placeholder='Search by name, phone, city...'
					/>

					{/* Source Filter */}
					<select
						className='crm-select'
						value={selectedSource}
						onChange={(e) => setSelectedSource(e.target.value)}>
						{SOURCES.map((s) => (
							<option key={s.id} value={s.id}>
								{s.label}
							</option>
						))}
					</select>

					{/* Staff Filter */}
					<select
						className='crm-select'
						value={selectedStaff}
						onChange={(e) => setSelectedStaff(e.target.value)}>
						<option value='all'>All Assigned Staff</option>
						{employees.map((emp) => (
							<option key={emp._id} value={emp._id}>
								{emp.first_name} {emp.last_name}
							</option>
						))}
					</select>

					{/* Date Range */}
					<DateFilter
						startDate={dateRange.from_date ? new Date(dateRange.from_date) : null}
						endDate={dateRange.to_date ? new Date(dateRange.to_date) : null}
						onDateRangeChange={handleDateRangeChange}
					/>
				</div>
			</div>

			{/* Main Table */}
			<div className='crm-table-card'>
				<div className='crm-table-container'>
					<table className='crm-table'>
						<thead>
							<tr>
								<th>#</th>
								<th>Lead Contact</th>
								<th>Source & Campaign</th>
								<th>Interest & Est. Value</th>
								<th>Stage</th>
								<th>Assigned Staff</th>
								<th>Next Follow-up</th>
								<th style={{ textAlign: 'center' }}>Connect</th>
								<th style={{ textAlign: 'center' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
										<div className='spinner-border spinner-border-sm text-primary me-2' role='status' />
										Loading RAG leads...
									</td>
								</tr>
							) : paginatedLeads.length === 0 ? (
								<tr>
									<td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
										<FontAwesomeIcon icon={faBullseye} style={{ fontSize: '32px', color: '#CBD5E1', marginBottom: '12px' }} />
										<div style={{ fontWeight: 600, color: '#1E293B' }}>No leads found</div>
										<p style={{ fontSize: '13px', margin: '4px 0 0' }}>
											No leads match your selected filters or search query.
										</p>
									</td>
								</tr>
							) : (
								paginatedLeads.map((item: any, idx: number) => {
									const actualIndex = (page - 1) * itemsPerPage + idx + 1
									const leadName = item.full_name || item.name || 'Unnamed Lead'
									const customerPhone = cleanWhatsAppNumber(item.phone_number || item.mobile)
									const displayPhone = item.phone_number || item.mobile || ''
									const waUrl = customerPhone ? getWhatsAppUrl(item) : ''
									const initials = leadName
										.split(' ')
										.map((n: string) => n.charAt(0).toUpperCase())
										.slice(0, 2)
										.join('')

									return (
										<tr key={item._id || item.lead_id || idx}>
											<td>
												<span style={{ fontWeight: 600, color: '#94A3B8', fontSize: '12.5px' }}>
													{actualIndex}
												</span>
											</td>

											{/* Contact Info */}
											<td>
												<div className='crm-user-cell'>
													<div className='crm-user-avatar'>{initials}</div>
													<div>
														<div className='crm-user-name'>{leadName}</div>
														<div className='crm-user-sub'>
															<span>{displayPhone || 'No Phone'}</span>
															{item.city && <span> • {item.city}</span>}
														</div>
														{item.email && (
															<div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
																{item.email}
															</div>
														)}
													</div>
												</div>
											</td>

											{/* Source & Campaign */}
											<td>
												<div>
													<span className={`crm-source-pill ${item.source === 'Meta Ads' ? 'meta' : item.source === 'Incomplete Checkout' ? 'checkout' : 'website'}`}>
														{item.source === 'Meta Ads' && <FontAwesomeIcon icon={faMeta} style={{ marginRight: '4px' }} />}
														{item.source || item.platform || 'Website'}
													</span>
													{item.campaign_name && (
														<div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
															{item.campaign_name}
														</div>
													)}
													{item.ad_name && (
														<div style={{ fontSize: '11px', color: '#94A3B8' }}>
															Ad: {item.ad_name}
														</div>
													)}
												</div>
											</td>

											{/* Product Interest & Est Value */}
											<td>
												<div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px' }}>
													{item.product_interested || 'General Nutrition'}
												</div>
												<div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
													₹{Number(item.estimated_order_value || 0).toLocaleString('en-IN')}
												</div>
											</td>

											{/* Stage Dropdown (Dynamic Color Coding) */}
											<td>
												{(() => {
													const currentStage = STAGES.some((s) => s.id === item.stage) ? item.stage : 'New Lead'
													const stageStyle = STAGE_STYLES[currentStage] || STAGE_STYLES['New Lead']
													return (
														<select
															className={`crm-stage-dropdown ${getStageClass(currentStage)}`}
															style={{
																backgroundColor: stageStyle.bg,
																color: stageStyle.color,
																border: `1.5px solid ${stageStyle.border}`,
																boxShadow: `0 1px 3px ${stageStyle.glow}`,
																padding: '5px 12px',
																borderRadius: '20px',
																fontSize: '12px',
																fontWeight: 700,
																cursor: 'pointer',
																outline: 'none',
																transition: 'all 0.2s ease',
															}}
															value={currentStage}
															onChange={(e) => handleStageChange(item._id || item.lead_id, e.target.value)}>
															{STAGES.filter((s) => s.id !== 'all').map((st) => {
																const optStyle = STAGE_STYLES[st.id] || STAGE_STYLES['New Lead']
																return (
																	<option
																		key={st.id}
																		value={st.id}
																		style={{
																			backgroundColor: '#FFFFFF',
																			color: optStyle.color,
																			fontWeight: 700,
																		}}>
																		{optStyle.dot} {st.label}
																	</option>
																)
															})}
														</select>
													)
												})()}
											</td>

											{/* Staff Assignment */}
											<td>
												<select
													className='crm-select'
													style={{ padding: '6px 8px', fontSize: '12px' }}
													value={item.assigned_to?._id || item.assigned_to || ''}
													onChange={(e) => handleStaffAssign(item._id || item.lead_id, e.target.value)}>
													<option value=''>Assign Staff...</option>
													{employees.map((emp) => (
														<option key={emp._id} value={emp._id}>
															{emp.first_name} {emp.last_name}
														</option>
													))}
												</select>
											</td>

											{/* Next Follow-up Date */}
											<td>
												<input
													type='date'
													className='crm-select'
													style={{ padding: '4px 8px', fontSize: '12px' }}
													value={
														item.next_follow_up_date
															? DayJS(item.next_follow_up_date).format('YYYY-MM-DD')
															: ''
													}
													onChange={(e) =>
														handleFollowUpDateChange(item._id || item.lead_id, e.target.value)
													}
												/>
											</td>

											{/* 1-Click WhatsApp & Call Connect */}
											<td style={{ textAlign: 'center' }}>
												<div className='crm-action-group' style={{ justifyContent: 'center' }}>
													{customerPhone ? (
														<>
															<a
																href={waUrl}
																target='_blank'
																rel='noopener noreferrer'
																className='crm-btn-wa'
																title={`Open WhatsApp Chat with ${leadName} (${customerPhone})`}>
																<FontAwesomeIcon icon={faWhatsapp} />
																Chat
															</a>
															<a
																href={`tel:${customerPhone}`}
																className='crm-btn-call'
																title={`Call Customer: ${customerPhone}`}>
																<FontAwesomeIcon icon={faPhone} />
															</a>
														</>
													) : (
														<span style={{ color: '#CBD5E1', fontSize: '12px' }}>No Phone</span>
													)}
												</div>
											</td>

											{/* Notes & Actions */}
											<td style={{ textAlign: 'center' }}>
												<div className='crm-action-group' style={{ justifyContent: 'center' }}>
													<button
														className='crm-btn-icon'
														title='View Timeline & Notes'
														onClick={() => {
															setActiveLead(item)
															setShowNotesModal(true)
														}}>
														<FontAwesomeIcon icon={faCommentDots} />
													</button>
													<button
														className='crm-btn-icon'
														style={{ color: '#EF4444' }}
														title='Delete Lead'
														onClick={() => handleDeleteLead(item._id || item.lead_id)}>
														<FontAwesomeIcon icon={faTrash} />
													</button>
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
						Showing {paginatedLeads.length} of {filteredLeads.length} leads
					</div>
					<GomziTablePagination
						totalCount={filteredLeads.length}
						currentPage={page}
						pageSize={itemsPerPage}
						onPageChange={(p: number) => setPage(p)}
					/>
				</div>
			</div>

			{/* Modal: Add New Lead */}
			{showAddModal && (
				<div className='crm-modal-backdrop' onClick={() => setShowAddModal(false)}>
					<div className='crm-modal-card' onClick={(e) => e.stopPropagation()}>
						<div className='crm-modal-header'>
							<h3 className='crm-modal-title'>Add New Lead (RAG Website)</h3>
							<button className='crm-btn-icon' onClick={() => setShowAddModal(false)}>✕</button>
						</div>
						<form onSubmit={handleCreateLead}>
							<div className='crm-modal-body'>
								<div className='row'>
									<div className='col-md-6 crm-form-group'>
										<label>Full Name *</label>
										<input
											type='text'
											required
											className='crm-form-control'
											placeholder='e.g. Rahul Sharma'
											value={addForm.full_name}
											onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
										/>
									</div>
									<div className='col-md-6 crm-form-group'>
										<label>Phone Number *</label>
										<input
											type='tel'
											required
											className='crm-form-control'
											placeholder='e.g. 9876543210'
											value={addForm.phone_number}
											onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
										/>
									</div>
								</div>

								<div className='row'>
									<div className='col-md-6 crm-form-group'>
										<label>Email Address</label>
										<input
											type='email'
											className='crm-form-control'
											placeholder='e.g. rahul@example.com'
											value={addForm.email}
											onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
										/>
									</div>
									<div className='col-md-6 crm-form-group'>
										<label>City / Location</label>
										<input
											type='text'
											className='crm-form-control'
											placeholder='e.g. Surat, Gujarat'
											value={addForm.city}
											onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
										/>
									</div>
								</div>

								<div className='row'>
									<div className='col-md-6 crm-form-group'>
										<label>Source</label>
										<select
											className='crm-form-control'
											value={addForm.source}
											onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}>
											<option value='Website Inquiry'>Website Inquiry</option>
											<option value='Wholesale B2B'>Wholesale B2B</option>
											<option value='Meta Ads'>Meta Ads</option>
											<option value='Pull_marketing'>Manual Entry / Inbound</option>
										</select>
									</div>
									<div className='col-md-6 crm-form-group'>
										<label>Initial Stage</label>
										<select
											className='crm-form-control'
											style={{
												backgroundColor: (STAGE_STYLES[addForm.stage] || STAGE_STYLES['New Lead']).bg,
												color: (STAGE_STYLES[addForm.stage] || STAGE_STYLES['New Lead']).color,
												border: `1.5px solid ${(STAGE_STYLES[addForm.stage] || STAGE_STYLES['New Lead']).border}`,
												fontWeight: 700,
											}}
											value={addForm.stage}
											onChange={(e) => setAddForm({ ...addForm, stage: e.target.value })}>
											<option value='New Lead'>🔵 New Lead</option>
											<option value='Follow-up'>🟡 Follow-up</option>
											<option value='Potential'>🟣 Potential</option>
											<option value='Order Confirm'>🟢 Order Confirm</option>
											<option value='Lost'>🔴 Lost</option>
										</select>
									</div>
								</div>

								<div className='row'>
									<div className='col-md-6 crm-form-group'>
										<label>Product Interested</label>
										<input
											type='text'
											className='crm-form-control'
											placeholder='e.g. Whey Protein Isolate 1kg'
											value={addForm.product_interested}
											onChange={(e) => setAddForm({ ...addForm, product_interested: e.target.value })}
										/>
									</div>
									<div className='col-md-6 crm-form-group'>
										<label>Estimated Order Value (₹)</label>
										<input
											type='number'
											className='crm-form-control'
											placeholder='e.g. 3500'
											value={addForm.estimated_order_value}
											onChange={(e) => setAddForm({ ...addForm, estimated_order_value: e.target.value })}
										/>
									</div>
								</div>

								<div className='crm-form-group'>
									<label>Assign Staff Representative</label>
									<select
										className='crm-form-control'
										value={addForm.assigned_to}
										onChange={(e) => setAddForm({ ...addForm, assigned_to: e.target.value })}>
										<option value=''>Select staff member...</option>
										{employees.map((emp) => (
											<option key={emp._id} value={emp._id}>
												{emp.first_name} {emp.last_name} ({emp.mobile || emp.email})
											</option>
										))}
									</select>
								</div>

								<div className='crm-form-group'>
									<label>Initial Conversation Note</label>
									<textarea
										rows={3}
										className='crm-form-control'
										placeholder='Customer inquired about delivery timeline and bulk discount...'
										value={addForm.additional_note}
										onChange={(e) => setAddForm({ ...addForm, additional_note: e.target.value })}
									/>
								</div>
							</div>
							<div className='crm-modal-footer'>
								<button type='button' className='crm-btn-secondary' onClick={() => setShowAddModal(false)}>
									Cancel
								</button>
								<button type='submit' className='crm-btn-primary'>
									Save & Add Lead
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Modal: Notes & Timeline History */}
			{showNotesModal && activeLead && (
				<div className='crm-modal-backdrop' onClick={() => setShowNotesModal(false)}>
					<div className='crm-modal-card' onClick={(e) => e.stopPropagation()}>
						<div className='crm-modal-header'>
							<div>
								<h3 className='crm-modal-title'>{activeLead.full_name || 'Lead Notes & History'}</h3>
								<div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
									{activeLead.phone_number} • {activeLead.source || 'Website'}
								</div>
							</div>
							<button className='crm-btn-icon' onClick={() => setShowNotesModal(false)}>✕</button>
						</div>
						<div className='crm-modal-body'>
							{/* Add Note Input */}
							<div className='crm-form-group'>
								<label>Add Follow-up / Calling Note</label>
								<textarea
									rows={3}
									className='crm-form-control'
									placeholder='Log customer response, promised callback date, discount discussed...'
									value={newNoteText}
									onChange={(e) => setNewNoteText(e.target.value)}
								/>
								<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
									<button type='button' className='crm-btn-primary' onClick={handleAddNote}>
										Post Note
									</button>
								</div>
							</div>

							{/* Notes Timeline */}
							<h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', marginTop: '20px' }}>
								Activity & Conversation Timeline
							</h4>
							<div className='crm-timeline'>
								{(activeLead.notes_history || []).length > 0 ? (
									activeLead.notes_history.map((n: any, i: number) => (
										<div key={i} className='crm-timeline-item'>
											<div className='crm-timeline-dot' />
											<div className='crm-timeline-note'>
												<div>{n.note}</div>
												<div className='crm-timeline-meta'>
													<span>By: {n.author_name || 'Staff'}</span>
													<span>•</span>
													<span>{DayJS(n.created_at).format('DD MMM YYYY, hh:mm A')}</span>
												</div>
											</div>
										</div>
									))
								) : activeLead.additional_note ? (
									<div className='crm-timeline-item'>
										<div className='crm-timeline-dot' />
										<div className='crm-timeline-note'>
											<div>{activeLead.additional_note}</div>
											<div className='crm-timeline-meta'>
												<span>Initial Note</span>
											</div>
										</div>
									</div>
								) : (
									<div style={{ fontSize: '12.5px', color: '#94A3B8', fontStyle: 'italic' }}>
										No conversation notes logged yet.
									</div>
								)}
							</div>
						</div>
						<div className='crm-modal-footer'>
							<button type='button' className='crm-btn-secondary' onClick={() => setShowNotesModal(false)}>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default CRMLeadsList
