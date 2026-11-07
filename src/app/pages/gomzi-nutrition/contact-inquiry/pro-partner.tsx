/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faAward,
	faBriefcase,
	faCheckCircle,
	faChevronDown,
	faChevronUp,
	faClock,
	faDownload,
	faEnvelope,
	faEye,
	faFileAlt,
	faGraduationCap,
	faIdCard,
	faMapMarkerAlt,
	faPhone,
	faTimesCircle,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import { GetContactInquiry } from '../../../Functions/FGGroup'
import { isProPartnerApplication } from './contactInquiryUtils'
import PartnerApplicationActions, {
	getPartnerApplicationStatus,
	PartnerStatusBadge,
	PartnerPolicyRecord,
	handleViewPartnerAgreement,
} from './PartnerApplicationActions'
import './PartnerApplicationActions.css'
import './pro-partner.css'
import './contact-inquiry.css'

export { isProPartnerApplication } from './contactInquiryUtils'

const RAG_CONTACT_SOURCE_FILTER =
	'gomzilifesciences|ragnutrition|contact-us|5173|whey|rag'

const ProPartnerInquiry: React.FC = () => {
	const location = useLocation()
	const basePath = location.pathname.startsWith('/hr') ? '/hr' : '/rag'

	const [searchTerm, setSearchTerm] = useState('')
	const [allPartnerInquiries, setAllPartnerInquiries] = useState<any[]>([])
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)
	const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
	const [statusFilter, setStatusFilter] = useState('')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	// Strict single pure white background enforcement across Metronic wrappers
	useEffect(() => {
		const applyWhiteCanvas = () => {
			const ids = ['kt_wrapper', 'kt_content', 'kt_post', 'kt_content_container']
			ids.forEach((id) => {
				const el = document.getElementById(id)
				if (el) {
					el.style.backgroundColor = '#FFFFFF'
					el.style.background = '#FFFFFF'
				}
			})
		}
		applyWhiteCanvas()
		const timer = setTimeout(applyWhiteCanvas, 200)
		return () => clearTimeout(timer)
	}, [])

	const fetchData = async () => {
		setLoading(true)
		try {
			const pageSize = 100
			const firstResponse: any = await GetContactInquiry({
				page: 1,
				limit: pageSize,
				source: RAG_CONTACT_SOURCE_FILTER,
				sort: 'createdAt',
				sortOrder: 'desc',
			})

			const paginationMeta: any = firstResponse?.metadata?.pagination || {}
			const totalPages = Number(paginationMeta.totalPages || 1)
			let rawList: any[] = Array.isArray(firstResponse?.data) ? [...firstResponse.data] : []

			for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
				const nextResponse: any = await GetContactInquiry({
					page: currentPage,
					limit: pageSize,
					source: RAG_CONTACT_SOURCE_FILTER,
					sort: 'createdAt',
					sortOrder: 'desc',
				})
				if (Array.isArray(nextResponse?.data)) {
					rawList = rawList.concat(nextResponse.data)
				}
			}

			// Exclusively filter for Pro Partner applications
			const partnerApplications = rawList.filter((item: any) => isProPartnerApplication(item))

			partnerApplications.sort((a: any, b: any) => {
				const aTime = new Date(a?.createdAt || 0).getTime()
				const bTime = new Date(b?.createdAt || 0).getTime()
				return bTime - aTime
			})

			setAllPartnerInquiries(partnerApplications)
		} catch (error: any) {
			console.error('Error fetching pro partner applications:', error)
			toast.error('Failed to load Pro Partner applications')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm, showUnreadOnly, employmentTypeFilter, statusFilter])

	const handleItemsPerPageChange = (val: number) => {
		setPagination((prev) => ({ ...prev, page: 1, itemsPerPage: val }))
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const employmentOptions = useMemo(() => {
		const s = new Set<string>()
		allPartnerInquiries.forEach((item: any) => {
			const emp = item?.details?.employment_type
			if (emp && typeof emp === 'string') {
				s.add(emp.trim())
			}
		})
		return Array.from(s).sort()
	}, [allPartnerInquiries])

	const filteredApplications = useMemo(() => {
		return allPartnerInquiries.filter((item: any) => {
			if (!item || !isProPartnerApplication(item)) return false

			const details = item.details || {}
			if (statusFilter && getPartnerApplicationStatus(item) !== statusFilter) return false

			if (searchTerm) {
				const q = searchTerm.toLowerCase().trim()
				const matches =
					(item.name || '').toLowerCase().includes(q) ||
					(item.email || '').toLowerCase().includes(q) ||
					(item.mobile || '').toLowerCase().includes(q) ||
					(details.full_name || '').toLowerCase().includes(q) ||
					(details.city || '').toLowerCase().includes(q) ||
					(details.state || '').toLowerCase().includes(q) ||
					(details.employment_type || '').toLowerCase().includes(q) ||
					(details.sales_potential || '').toLowerCase().includes(q)
				if (!matches) return false
			}

			if (employmentTypeFilter) {
				if ((details.employment_type || '').trim() !== employmentTypeFilter) {
					return false
				}
			}

			if (showUnreadOnly && item.read_receipt !== false) {
				return false
			}

			return true
		})
	}, [allPartnerInquiries, searchTerm, employmentTypeFilter, statusFilter, showUnreadOnly])

	const paginatedApplications = useMemo(() => {
		const start = (pagination.page - 1) * pagination.itemsPerPage
		return filteredApplications.slice(start, start + pagination.itemsPerPage)
	}, [filteredApplications, pagination.page, pagination.itemsPerPage])

	const totalPages = Math.ceil(filteredApplications.length / pagination.itemsPerPage) || 1

	// KPI Metrics
	const kpiMetrics = useMemo(() => {
		const total = allPartnerInquiries.length
		const pending = allPartnerInquiries.filter((i) => getPartnerApplicationStatus(i) === 'pending').length
		const approved = allPartnerInquiries.filter((i) => getPartnerApplicationStatus(i) === 'approved').length
		const rejected = allPartnerInquiries.filter((i) => getPartnerApplicationStatus(i) === 'rejected').length
		return { total, pending, approved, rejected }
	}, [allPartnerInquiries])

	// Export Excel
	const downloadExcel = () => {
		setExporting(true)
		try {
			const rows = filteredApplications.map((item: any, idx: number) => {
				const d = item.details || {}
				return {
					'#': idx + 1,
					'Applicant Name': d.full_name || item.name || '',
					'Email Address': d.email || item.email || '',
					'Mobile Number': d.mobile || item.mobile || '',
					City: d.city || '',
					State: d.state || '',
					'Employment Type': d.employment_type || '',
					'Experience (Years)': d.experience_years || '',
					'Active Clients': d.active_clients || '',
					'Sales Potential': d.sales_potential || '',
					'Application Status': getPartnerApplicationStatus(item).toUpperCase(),
					'Policy Version': item.partner_policy?.version || 'N/A',
					'Policy Accepted At': item.partner_policy?.accepted_at
						? DayJS(item.partner_policy.accepted_at).format('DD/MM/YYYY hh:mm A')
						: 'Pending',
					'Submission Date': item.createdAt
						? DayJS(item.createdAt).format('DD/MM/YYYY hh:mm A')
						: '',
				}
			})

			const worksheet = XLSX.utils.json_to_sheet(rows)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Pro Partner Applications')
			XLSX.writeFile(
				workbook,
				`RAG_Pro_Partner_Applications_${DayJS().format('YYYY-MM-DD')}.xlsx`
			)
			toast.success('Applications exported to Excel')
		} catch (error) {
			console.error('Excel export error:', error)
			toast.error('Failed to export applications')
		} finally {
			setExporting(false)
		}
	}

	return (
		<div className='gz-page-wrapper gz-pro-partner-page'>
			<PageTitle breadcrumbs={[]}>RAG Pro Partner Applications</PageTitle>

			{/* 1. Header Card */}
			<div className='gz-header-card'>
				<div className='gz-header-left'>
					<div className='gz-header-icon-box'>
						<FontAwesomeIcon icon={faBriefcase} />
					</div>
					<div>
						<h1 className='gz-header-title'>RAG Pro Partner Applications</h1>
						<div className='gz-header-subtitle'>
							Review fitness professional onboarding, credentials, coaching channels, and digital agreement policies.
						</div>
					</div>
				</div>

				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<button
						type='button'
						className='gz-btn-brown-outline'
						onClick={downloadExcel}
						disabled={exporting || filteredApplications.length === 0}>
						<FontAwesomeIcon icon={faDownload} />
						<span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
					</button>
				</div>
			</div>

			{/* 2. KPI Summary Cards */}
			<div className='gz-kpi-grid'>
				<div className='gz-kpi-card total'>
					<div className='gz-kpi-header'>
						<span className='gz-kpi-title'>Total Applications</span>
						<div className='gz-kpi-icon-box total'>
							<FontAwesomeIcon icon={faUsers} />
						</div>
					</div>
					<div className='gz-kpi-value'>{kpiMetrics.total}</div>
					<div className='gz-kpi-desc'>All fitness professional partner submissions</div>
				</div>

				<div className='gz-kpi-card partner'>
					<div className='gz-kpi-header'>
						<span className='gz-kpi-title'>Pending Review</span>
						<div className='gz-kpi-icon-box partner'>
							<FontAwesomeIcon icon={faClock} />
						</div>
					</div>
					<div className='gz-kpi-value'>{kpiMetrics.pending}</div>
					<div className='gz-kpi-desc'>Awaiting review & policy invitation</div>
				</div>

				<div className='gz-kpi-card active'>
					<div className='gz-kpi-header'>
						<span className='gz-kpi-title'>Accepted Partners</span>
						<div className='gz-kpi-icon-box active'>
							<FontAwesomeIcon icon={faCheckCircle} />
						</div>
					</div>
					<div className='gz-kpi-value'>{kpiMetrics.approved}</div>
					<div className='gz-kpi-desc'>Approved for coupon creation & referral</div>
				</div>

				<div className='gz-kpi-card expired'>
					<div className='gz-kpi-header'>
						<span className='gz-kpi-title'>Declined Applications</span>
						<div className='gz-kpi-icon-box expired'>
							<FontAwesomeIcon icon={faTimesCircle} />
						</div>
					</div>
					<div className='gz-kpi-value'>{kpiMetrics.rejected}</div>
					<div className='gz-kpi-desc'>Applications rejected with notice</div>
				</div>
			</div>

			{/* 3. Filter Toolbar */}
			<div className='gz-filter-row'>
				{/* Search Bar with zero duplicate border and properly positioned icon */}
				<div
					className='gz-search-bar-box'
					style={{ flex: '1 1 280px', minWidth: '240px' }}>
					<i className='bi bi-search'></i>
					<input
						type='text'
						className='gz-search-bar-input'
						placeholder='Search by applicant, mobile, email, city...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{
							border: 'none',
							outline: 'none',
							background: 'transparent',
							boxShadow: 'none',
							width: '100%',
							height: '100%',
							padding: '0 4px',
						}}
					/>
				</div>

				{/* Status Filter */}
				<select
					className='gz-select'
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					style={{ minWidth: '150px' }}>
					<option value=''>All Status</option>
					<option value='pending'>Pending Review</option>
					<option value='approved'>Accepted Partners</option>
					<option value='rejected'>Declined Applications</option>
				</select>

				{/* Employment Type Filter */}
				<select
					className='gz-select'
					value={employmentTypeFilter}
					onChange={(e) => setEmploymentTypeFilter(e.target.value)}
					style={{ minWidth: '170px' }}>
					<option value=''>All Employment Types</option>
					{employmentOptions.map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</select>

				{/* Unread Toggle */}
				<button
					type='button'
					className={`gz-btn-brown-outline ${showUnreadOnly ? 'active' : ''}`}
					onClick={() => setShowUnreadOnly(!showUnreadOnly)}
					style={{
						background: showUnreadOnly ? '#78350F' : '#FFFFFF',
						color: showUnreadOnly ? '#FFFFFF' : '#78350F',
						borderColor: '#78350F',
					}}>
					<FontAwesomeIcon icon={faClock} />
					<span>Unread Only</span>
				</button>

				{/* Items Per Page */}
				<div className='d-flex align-items-center gap-2'>
					<span style={{ fontSize: '12.5px', color: '#82756E', fontWeight: 600 }}>Show:</span>
					<select
						className='gz-select'
						value={pagination.itemsPerPage}
						onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
						style={{ width: '80px', height: '40px' }}>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
				</div>
			</div>

			{/* 4. Luxury Applications Table */}
			<div className='gz-table-card'>
				<div className='table-responsive'>
					<table className='gz-table'>
						<thead>
							<tr>
								<th style={{ width: '48px', textAlign: 'center' }}>#</th>
								<th>Applicant Profile</th>
								<th>Contact Details</th>
								<th>Role & Experience</th>
								<th>Client Reach</th>
								<th>Sales Potential</th>
								<th>Applied Date</th>
								<th style={{ textAlign: 'center' }}>Status</th>
								<th className='gz-sticky-actions'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={9} className='text-center py-5 text-muted'>
										<div className='spinner-border spinner-border-sm text-warning me-2' role='status' />
										Loading Pro Partner applications...
									</td>
								</tr>
							) : paginatedApplications.length === 0 ? (
								<tr>
									<td colSpan={9} className='text-center py-5 text-muted'>
										No Pro Partner applications matched your filters.
									</td>
								</tr>
							) : (
								paginatedApplications.map((item: any, idx: number) => {
									const details = item.details || {}
									const applicantName = (details.full_name || item.name || 'Anonymous Applicant').trim()
									const email = (details.email || item.email || '').trim()
									const mobile = (details.mobile || item.mobile || '').trim()
									const whatsapp = (details.whatsapp || mobile).trim()
									const city = (details.city || '').trim()
									const state = (details.state || '').trim()
									const locationStr = [city, state].filter(Boolean).join(', ')
									const empType = (details.employment_type || 'Trainer').trim()
									const exp = details.experience_years ? `${details.experience_years} yrs exp` : ''
									const activeClients = details.active_clients || 'N/A'
									const potential = details.sales_potential || 'N/A'
									const isExpanded = visibleDetails === item._id
									const formattedDate = item.createdAt
										? DayJS(item.createdAt).format('DD MMM YYYY')
										: 'N/A'

									return (
										<React.Fragment key={item._id}>
											<tr
												style={{ cursor: 'pointer' }}
												onClick={() => setVisibleDetails(isExpanded ? null : item._id)}>
												{/* 1. Index & Expand Toggle */}
												<td style={{ textAlign: 'center' }}>
													<div className='d-flex align-items-center justify-content-center gap-1'>
														<span style={{ fontSize: '11px', color: '#82756E', fontWeight: 600 }}>
															{(pagination.page - 1) * pagination.itemsPerPage + idx + 1}
														</span>
														<FontAwesomeIcon
															icon={isExpanded ? faChevronUp : faChevronDown}
															style={{ fontSize: '10px', color: '#94A3B8' }}
														/>
													</div>
												</td>

												{/* 2. Applicant Profile */}
												<td>
													<div className='fw-bold fs-7' style={{ color: '#261E1A' }}>
														{applicantName}
													</div>
													{locationStr && (
														<div
															className='d-flex align-items-center gap-1 mt-1'
															style={{ color: '#82756E', fontSize: '11.5px' }}>
															<FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#94A3B8', fontSize: '10px' }} />
															<span>{locationStr}</span>
														</div>
													)}
													{whatsapp && (
														<a
															href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
															target='_blank'
															rel='noreferrer'
															className='gz-wa-btn mt-1'
															onClick={(e) => e.stopPropagation()}>
															<FontAwesomeIcon icon={faWhatsapp} />
															<span>Chat</span>
														</a>
													)}
												</td>

												{/* 3. Contact */}
												<td>
													{email && (
														<div className='d-flex align-items-center gap-1' style={{ fontSize: '12px', color: '#443B35' }}>
															<FontAwesomeIcon icon={faEnvelope} style={{ color: '#82756E', fontSize: '11px' }} />
															<span>{email}</span>
														</div>
													)}
													{mobile && (
														<div className='d-flex align-items-center gap-1 mt-1' style={{ fontSize: '12px', color: '#443B35' }}>
															<FontAwesomeIcon icon={faPhone} style={{ color: '#82756E', fontSize: '11px' }} />
															<span>{mobile}</span>
														</div>
													)}
												</td>

												{/* 4. Role & Experience */}
												<td>
													<span className='gz-badge-emp'>{empType}</span>
													{exp && (
														<div style={{ color: '#82756E', fontSize: '11.5px', marginTop: '3px' }}>
															{exp}
														</div>
													)}
												</td>

												{/* 5. Client Reach */}
												<td>
													<div className='fw-bold fs-7' style={{ color: '#261E1A' }}>
														{activeClients}
													</div>
													<div style={{ color: '#82756E', fontSize: '11px' }}>
														{details.coaching_mode || 'Coaching clients'}
													</div>
												</td>

												{/* 6. Sales Potential */}
												<td>
													<span className='gz-badge-potential'>
														<span>{potential}</span>
													</span>
												</td>

												{/* 7. Applied Date */}
												<td>
													<div style={{ fontSize: '12.5px', color: '#261E1A', fontWeight: 600 }}>
														{formattedDate}
													</div>
													<div style={{ color: '#82756E', fontSize: '11px' }}>
														{item.createdAt ? DayJS(item.createdAt).format('hh:mm A') : ''}
													</div>
												</td>

												{/* 8. Status */}
												<td style={{ textAlign: 'center' }}>
													<PartnerStatusBadge inquiry={item} />
													{item.partner_policy?.version && (
														<div>
															<button
																type='button'
																className='gz-btn-pdf-accepted'
																onClick={(e) => {
																	e.stopPropagation()
																	handleViewPartnerAgreement(item._id)
																}}
																title='View Digitally Signed Partner Policy'>
																<FontAwesomeIcon icon={faFileAlt} />
																<span>Agreement PDF</span>
															</button>
														</div>
													)}
												</td>

												{/* 9. Actions (Sticky) */}
												<td
													className='gz-sticky-actions'
													onClick={(e) => e.stopPropagation()}>
													<PartnerApplicationActions
														inquiry={item}
														onUpdated={(updated) => {
															setAllPartnerInquiries((prev) =>
																prev.map((i) => (i._id === updated._id ? updated : i))
															)
														}}
														compact>
														<Link
															className='gz-partner-button gz-partner-button-view'
															to={`${basePath}/contact-inquiry/contact-inquiry-view?contactInquiry_id=${item._id}`}
															title='Open Full Applicant Dossier'>
															<FontAwesomeIcon icon={faEye} aria-hidden='true' className='gz-partner-btn-icon' />
															<span>View</span>
														</Link>
													</PartnerApplicationActions>
												</td>
											</tr>

											{/* Expandable Dossier Drawer */}
											{isExpanded && (
												<tr className='gz-expanded-row'>
													<td colSpan={9}>
														<div className='row g-3'>
															{/* Dossier Card 1: Applicant Profile */}
															<div className='col-md-4'>
																<div className='gz-dossier-card'>
																	<div className='gz-dossier-header'>
																		<FontAwesomeIcon icon={faIdCard} />
																		<span>Applicant Profile</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Full Name:</strong>
																		<span>{applicantName}</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Education:</strong>
																		<span>{details.higher_education || 'Not Specified'}</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Experience:</strong>
																		<span>{details.experience_years ? `${details.experience_years} Years` : 'Not Specified'}</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Gender / DOB:</strong>
																		<span>{[details.gender, details.dob].filter(Boolean).join(' • ') || 'N/A'}</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Address:</strong>
																		<span>{details.address || locationStr || 'N/A'}</span>
																	</div>
																</div>
															</div>

															{/* Dossier Card 2: Coaching & Sales */}
															<div className='col-md-4'>
																<div className='gz-dossier-card'>
																	<div className='gz-dossier-header'>
																		<FontAwesomeIcon icon={faBriefcase} />
																		<span>Coaching & Sales</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Gym / Studio:</strong>
																		<span>{details.gym_name || details.current_gym || 'Independent / Freelance'}</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Active Clients:</strong>
																		<span>{details.active_clients || 'N/A'}</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Coaching Mode:</strong>
																		<span>{details.coaching_mode || 'In-Person & Online'}</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Instagram:</strong>
																		{details.instagram ? (
																			<a
																				href={`https://instagram.com/${details.instagram.replace(/^@/, '')}`}
																				target='_blank'
																				rel='noreferrer'
																				style={{ color: '#78350F', fontWeight: 600 }}>
																				@{details.instagram.replace(/^@/, '')}
																			</a>
																		) : (
																			<span>N/A</span>
																		)}
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Monthly Sales:</strong>
																		<span>{details.sales_potential || 'N/A'}</span>
																	</div>
																</div>
															</div>

															{/* Dossier Card 3: Verification & Docs */}
															<div className='col-md-4'>
																<div className='gz-dossier-card'>
																	<div className='gz-dossier-header'>
																		<FontAwesomeIcon icon={faGraduationCap} />
																		<span>Verification & Docs</span>
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Certification:</strong>
																		{details.certification_url ? (
																			<a
																				href={details.certification_url}
																				target='_blank'
																				rel='noreferrer'
																				className='fw-bold text-decoration-underline'
																				style={{ color: '#78350F' }}>
																				View Certificate
																			</a>
																		) : (
																			<span>No File Attached</span>
																		)}
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Photo ID:</strong>
																		{details.photo_id_url ? (
																			<a
																				href={details.photo_id_url}
																				target='_blank'
																				rel='noreferrer'
																				className='fw-bold text-decoration-underline'
																				style={{ color: '#78350F' }}>
																				View Photo ID
																			</a>
																		) : (
																			<span>Not Attached</span>
																		)}
																	</div>
																	<div className='gz-dossier-item'>
																		<strong>Bio / Pitch:</strong>
																		<span style={{ fontStyle: 'italic', color: '#5B270A', wordBreak: 'break-word' }}>
																			{details.bio ||
																			details.pitch ||
																			details.personal_pitch ||
																			(item.message &&
																			!item.message.includes('=== RAG PRO PARTNER') &&
																			!item.message.includes('[SECTION')
																				? `"${item.message}"`
																				: 'Official partner application submitted via web portal.')}
																		</span>
																	</div>
																</div>
															</div>

															{/* Partner Policy & Acceptance Record */}
															<div className='col-12'>
																<PartnerPolicyRecord inquiry={item} />
															</div>
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* 5. Pagination */}
				<div className='gz-pagination-wrapper'>
					<UsersListPagination
						totalPages={totalPages}
						totalRecords={filteredApplications.length}
						itemsPerPage={pagination.itemsPerPage}
						entityName='applications'
						onPageChange={handlePageChange}
						currentPage={pagination.page}
					/>
				</div>
			</div>
		</div>
	)
}

export default ProPartnerInquiry
