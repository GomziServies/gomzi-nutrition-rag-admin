import {
	faAward,
	faChevronDown,
	faChevronUp,
	faBriefcase,
	faCheckCircle,
	faClock,
	faDownload,
	faEnvelope,
	faEnvelopeOpen,
	faEye,
	faFileAlt,
	faGraduationCap,
	faIdCard,
	faMapMarkerAlt,
	faPhone,
	faPlusCircle,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { endOfMonth, startOfMonth } from 'date-fns'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetContactInquiry } from '../../../Functions/FGGroup'
import { isProPartnerApplication } from './contactInquiryUtils'
import PartnerApplicationActions, { getPartnerApplicationStatus, PartnerStatusBadge, PartnerReviewDetails, PartnerPolicyRecord, handleViewPartnerAgreement } from './PartnerApplicationActions'
import './PartnerApplicationActions.css'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'
import './contact-inquiry.css'

export { isProPartnerApplication } from './contactInquiryUtils'

const ProPartnerInquiry: React.FC = () => {
	const location = useLocation()
	const basePath = location.pathname.startsWith('/hr') ? '/hr' : '/rag'
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [allPartnerInquiries, setAllPartnerInquiries] = useState<any[]>([])
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)
	const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
	const [statusFilter, setStatusFilter] = useState('')
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>([
		startOfMonth(new Date()),
		endOfMonth(new Date()),
	])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const RAG_CONTACT_SOURCE_FILTER =
		'gomzilifesciences|ragnutrition|contact-us|5173|whey|rag'

	const fetchData = async () => {
		setLoading(true)
		try {
			const pageSize = 100
			const firstResponse: any = await GetContactInquiry({
				page: 1,
				limit: pageSize,
				source: RAG_CONTACT_SOURCE_FILTER,
			})

			const paginationMeta: any = firstResponse?.metadata?.pagination || {}
			setMetaData(paginationMeta)
			const totalPages = Number(paginationMeta.totalPages || 1)
			let rawList: any[] = Array.isArray(firstResponse?.data) ? [...firstResponse.data] : []

			for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
				const nextResponse: any = await GetContactInquiry({
					page: currentPage,
					limit: pageSize,
					source: RAG_CONTACT_SOURCE_FILTER,
				})
				if (Array.isArray(nextResponse?.data)) {
					rawList = rawList.concat(nextResponse.data)
				}
			}

			// Filter exclusively for Pro Partner Program applications (ignoring orders & general contact forms)
			const partnerApplications = rawList.filter((item: any) => isProPartnerApplication(item))

			partnerApplications.sort((a: any, b: any) => {
				const aTime = new Date(a?.createdAt || 0).getTime()
				const bTime = new Date(b?.createdAt || 0).getTime()
				return bTime - aTime
			})

			setAllPartnerInquiries(partnerApplications)
		} catch (error: any) {
			console.error(error)
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
	}, [searchTerm, sort, sortOrder, showUnreadOnly, employmentTypeFilter, statusFilter, selectedDateRange])

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, page: 1, itemsPerPage: value }))
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleEmploymentTypeChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const val = event.target.value
		setEmploymentTypeFilter(val === 'All' ? '' : val)
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

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Applicant', field: 'name' },
		{ title: 'Contact', field: 'email' },
		{ title: 'Role & Experience', field: 'details.employment_type' },
		{ title: 'Client Reach', field: 'details.active_clients' },
		{ title: 'Sales Potential', field: 'details.sales_potential' },
		{ title: 'Date Applied', field: 'createdAt' },
		{ title: 'Application Status', field: 'partner_status' },
	]

	const handleRowClick = (id: string) => {
		setVisibleDetails(visibleDetails === id ? null : id)
	}

	const filteredApplications = useMemo(() => {
		const filtered = allPartnerInquiries.filter((item: any) => {
			if (!item || !isProPartnerApplication(item)) return false

			const details = item.details || {}
			if (statusFilter && getPartnerApplicationStatus(item) !== statusFilter) return false

			if (searchTerm && typeof searchTerm === 'string') {
				const q = searchTerm.toLowerCase().trim()
				const matches =
					(item.name || '').toString().toLowerCase().includes(q) ||
					(item.email || '').toString().toLowerCase().includes(q) ||
					(item.mobile || '').toString().toLowerCase().includes(q) ||
					(details.full_name || '').toString().toLowerCase().includes(q) ||
					(details.city || '').toString().toLowerCase().includes(q) ||
					(details.state || '').toString().toLowerCase().includes(q) ||
					(details.employment_type || '').toString().toLowerCase().includes(q) ||
					(details.sales_potential || '').toString().toLowerCase().includes(q) ||
					(details.higher_education || '').toString().toLowerCase().includes(q)
				if (!matches) return false
			}

			if (employmentTypeFilter && employmentTypeFilter !== '') {
				if ((details.employment_type || '').toString().trim() !== employmentTypeFilter) {
					return false
				}
			}

			if (showUnreadOnly) {
				if (item.read_receipt !== false) return false
			}

			if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
				const startTime = new Date(selectedDateRange[0]).setHours(0, 0, 0, 0)
				const endTime = new Date(selectedDateRange[1]).setHours(23, 59, 59, 999)
				const rawDate = item.createdAt || item.created_at || item.date
				if (!rawDate) return false
				const itemTime = new Date(rawDate).getTime()
				if (isNaN(itemTime) || itemTime < startTime || itemTime > endTime) {
					return false
				}
			}

			return true
		})

		if (sort) {
			filtered.sort((a: any, b: any) => {
				let aVal = a[sort] || a.details?.[sort.replace('details.', '')]
				let bVal = b[sort] || b.details?.[sort.replace('details.', '')]

				if (sort === 'createdAt' || sort === 'date') {
					const aTime = new Date(aVal || a.created_at || a.date || 0).getTime()
					const bTime = new Date(bVal || b.created_at || b.date || 0).getTime()
					return sortOrder === 'asc' ? aTime - bTime : bTime - aTime
				}

				aVal = (aVal || '').toString().toLowerCase()
				bVal = (bVal || '').toString().toLowerCase()

				if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
				if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
				return 0
			})
		}

		return filtered
	}, [allPartnerInquiries, searchTerm, employmentTypeFilter, statusFilter, showUnreadOnly, selectedDateRange, sort, sortOrder])

	const paginatedApplications = filteredApplications.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const totalPages = Math.ceil(filteredApplications.length / pagination.itemsPerPage)
	const paginationTotalPages = Number(totalPages || metaData?.totalPages || 1)

	const downloadExcel = () => {
		setExporting(true)
		try {
			const worksheetData = filteredApplications.map((item: any) => {
				const d = item.details || {}
				return {
					'Applicant Name': d.full_name || item.name || 'N/A',
					Email: d.email || item.email || 'N/A',
					Mobile: d.mobile || item.mobile || 'N/A',
					WhatsApp: d.whatsapp || 'N/A',
					Gender: d.gender || 'N/A',
					'Date of Birth': d.dob || 'N/A',
					City: d.city || 'N/A',
					State: d.state || 'N/A',
					Pincode: d.pincode || 'N/A',
					'Employment Type': d.employment_type || 'N/A',
					'Experience (Years)': d.experience_years || 'N/A',
					'Active Clients': d.active_clients || 'N/A',
					'Higher Education': d.higher_education || 'N/A',
					'Recommends Supplements': d.recommend_supplements ? 'Yes' : 'No',
					'Supplement Brands': d.supplement_brands || 'N/A',
					'Estimated Sales Potential': d.sales_potential || 'N/A',
					'Instagram Followers': d.instagram_followers || 'N/A',
					'Social Profile': d.instagram || d.social_link || 'N/A',
					'Application Status': getPartnerApplicationStatus(item),
					'Review Note': item.partner_review_reason || '',
					'Policy Version': item.partner_policy?.version || '',
					'Policy Accepted': item.partner_policy?.accepted_at ? 'Yes' : 'No',
					'Policy Accepted By': item.partner_policy?.accepted_name || '',
					'Policy Acceptance Date': item.partner_policy?.accepted_at ? DayJS(item.partner_policy.accepted_at).format('DD/MM/YYYY hh:mm:ss A') : '',
					'Decision Date': item.partner_reviewed_at ? DayJS(item.partner_reviewed_at).format('DD/MM/YYYY hh:mm:ss A') : '',
					'Read Status': item.read_receipt ? 'Read' : 'Unread',
					'Applied Date': DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
				}
			})

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Pro Partner Applications')
			XLSX.writeFile(workbook, 'RAG_Pro_Partner_Applications.xlsx')
			toast.success('Pro Partner report downloaded successfully')
		} catch (error) {
			console.error('Error exporting partner applications:', error)
			toast.error('Failed to export report')
		} finally {
			setExporting(false)
		}
	}

	const stats = useMemo(() => {
		const total = allPartnerInquiries.length
		const pending = allPartnerInquiries.filter((item) => getPartnerApplicationStatus(item) === 'pending').length
		const approved = allPartnerInquiries.filter((item) => getPartnerApplicationStatus(item) === 'approved').length
		const rejected = allPartnerInquiries.filter((item) => getPartnerApplicationStatus(item) === 'rejected').length
		return { total, pending, approved, rejected }
	}, [allPartnerInquiries])

	return (
		<div className='gz-mgmt-container partner-page'>
			<PageTitle breadcrumbs={[]}>RAG Pro Partner Applications</PageTitle>

			<style>{`
				.partner-table { min-width: 0; }
				.partner-table .table-responsive {
					overflow-x: auto !important;
					-webkit-overflow-scrolling: touch !important;
					scrollbar-width: thin;
				}
				.partner-table #kt_table_users {
					width: 100% !important;
					min-width: 1280px !important;
					table-layout: auto !important;
					border-collapse: separate !important;
					border-spacing: 0 !important;
				}
				.partner-table #kt_table_users thead th {
					padding: 14px 16px !important;
					white-space: nowrap !important;
					line-height: 1.4;
					font-size: 11px !important;
					font-weight: 700 !important;
					letter-spacing: 0.03em !important;
					color: #71809A !important;
					text-transform: uppercase !important;
					background: #F8FAFD !important;
					border-bottom: 1px solid #E4EAF2 !important;
				}
								.partner-table #kt_table_users {
					min-width: 1360px !important;
					width: 100% !important;
				}
				.partner-table #kt_table_users thead th:nth-child(1) { width: 44px !important; min-width: 44px !important; text-align: center; }
				.partner-table #kt_table_users thead th:nth-child(2) { min-width: 165px !important; width: 170px !important; }
				.partner-table #kt_table_users thead th:nth-child(3) { min-width: 195px !important; width: 200px !important; }
				.partner-table #kt_table_users thead th:nth-child(4) { min-width: 165px !important; width: 170px !important; }
				.partner-table #kt_table_users thead th:nth-child(5) { min-width: 130px !important; width: 135px !important; white-space: nowrap !important; }
				.partner-table #kt_table_users thead th:nth-child(6) { min-width: 165px !important; width: 170px !important; }
				.partner-table #kt_table_users thead th:nth-child(7) { min-width: 130px !important; width: 135px !important; white-space: nowrap !important; }
				.partner-table #kt_table_users thead th:nth-child(8) { min-width: 170px !important; width: 175px !important; }
				.partner-table #kt_table_users thead th:nth-child(9),
				.partner-table #kt_table_users th:last-child {
					width: 185px !important;
					min-width: 185px !important;
					position: sticky !important;
					right: 0 !important;
					z-index: 3 !important;
					background: #F8FAFD !important;
					border-left: 1px solid #E4EAF2 !important;
					box-shadow: -4px 0 10px -4px rgba(15, 23, 42, 0.08) !important;
					text-align: center !important;
				}
				.partner-table #kt_table_users .data-row > td {
					padding: 14px 16px !important;
					vertical-align: middle !important;
					background: #fff !important;
					border-bottom: 1px solid #EEF2F6 !important;
				}
				.partner-table #kt_table_users .data-row:hover > td {
					background: #F8FAFD !important;
				}
				.partner-table #kt_table_users th:last-child,
				.partner-table #kt_table_users td.partner-actions,
				.partner-table #kt_table_users td:last-child {
					position: sticky;
					right: 0;
					z-index: 2;
					background: #ffffff !important;
					border-left: 1px solid #EEF2F6 !important;
					box-shadow: -4px 0 10px -4px rgba(15, 23, 42, 0.06);
					width: 200px !important;
					min-width: 200px !important;
					box-sizing: border-box !important;
					padding: 10px 12px !important;
					vertical-align: middle !important;
				}
				.partner-table #kt_table_users th:last-child {
					z-index: 3;
					background: #F8FAFD !important;
				}
				.partner-table #kt_table_users .data-row:hover > td.partner-actions {
					background: #F8FAFD !important;
				}
				.partner-table #kt_table_users .detail-row.is-visible { display: table-row !important; }
				.partner-table .gz-partner-controls {
					display: grid !important;
					grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
					gap: 5px !important;
					width: 100% !important;
					min-width: 150px !important;
					max-width: 175px !important;
					margin: 0 auto !important;
					padding: 0 !important;
					box-sizing: border-box !important;
					align-items: center !important;
				}
				.partner-table .gz-partner-controls > .gz-partner-button {
					display: inline-flex !important;
					align-items: center !important;
					justify-content: center !important;
					gap: 5px !important;
					width: 100% !important;
					min-width: 0 !important;
					max-width: 100% !important;
					height: 27px !important;
					min-height: 27px !important;
					margin: 0 !important;
					padding: 2px 6px !important;
					box-sizing: border-box !important;
					border: 1px solid transparent !important;
					border-radius: 6px !important;
					font-family: inherit !important;
					font-size: 11px !important;
					font-weight: 600 !important;
					line-height: 1 !important;
					text-decoration: none !important;
					white-space: nowrap !important;
					overflow: hidden !important;
					text-overflow: ellipsis !important;
					cursor: pointer !important;
					box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04) !important;
				}
				.partner-table .gz-partner-controls > .gz-partner-button:last-child:nth-child(3),
				.partner-table .gz-partner-controls > .gz-partner-button:last-child:nth-child(5),
				.partner-table .gz-partner-controls > .gz-partner-button:only-child {
					grid-column: 1 / -1 !important;
				}
				.partner-table .partner-actions-stack {
					width: 100%;
					min-width: 150px;
					max-width: 190px;
					margin: 0 auto;
				}
				.partner-table .partner-status .mt-2 { margin-top: 6px !important; }
				.partner-table .partner-status .fs-8 { font-size: 11px !important; line-height: 1.5; }
				.partner-table .partner-status .badge { padding: 5px 9px; }
				.partner-table .gz-badge-emp { max-width: 100% !important; white-space: normal; }
				.partner-table .gz-badge-potential { max-width: 100%; align-items: flex-start; line-height: 1.5; overflow-wrap: normal; word-break: normal; }
				.partner-table .gz-badge-potential > span { min-width: 0; }
				.partner-table .gz-badge-potential svg { flex-shrink: 0; margin-top: 3px; }
				.partner-table .partner-contact-line { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
				.partner-page .partner-toolbar { gap: 12px !important; width: 100%; }
				.partner-page .partner-toolbar .gz-search-filter-box { flex: 1 1 220px; max-width: 320px; }
				.partner-page .partner-toolbar > select { min-height: 38px; }
				@media (max-width: 1199px) {
					.partner-table #kt_table_users { min-width: 1060px; }
					.partner-table #kt_table_users th:last-child,
					.partner-table #kt_table_users td.partner-actions {
						box-shadow: -4px 0 8px -6px rgba(23, 43, 77, .25);
					}
				}
				@media (max-width: 768px) {
					.partner-page .partner-table { padding: 0 12px 16px !important; }
					.partner-page .partner-toolbar .gz-search-filter-box { max-width: none; flex-basis: 100%; }
				}
				.partner-table .data-row {
					cursor: pointer;
					border-bottom: 1px solid #EEF2F7;
					transition: background 0.15s ease;
				}
				.partner-table .data-row:hover {
					background: #F8FAFD;
				}
				.partner-table .data-row td {
					padding: 14px 12px;
					vertical-align: middle;
				}
				.gz-badge-potential {
					display: inline-flex;
					align-items: center;
					gap: 4px;
					background: #EEF2FF;
					color: #4F46E5;
					border: 1px solid #C7D2FE;
					border-radius: 6px;
					padding: 3px 8px;
					font-size: 12px;
					font-weight: 600;
				}
				.gz-badge-emp {
					display: inline-flex;
					align-items: center;
					background: #F1F5F9;
					color: #334155;
					border-radius: 6px;
					padding: 3px 8px;
					font-size: 12px;
					font-weight: 600;
				}
				.partner-details-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
					gap: 12px;
					background: #F8FAFC;
					padding: 16px;
					border-radius: 10px;
					border: 1px solid #E2E8F0;
				}
			`}</style>

			{/* Breadcrumb */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to={`${basePath}/dashboard`}>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<span>Follow Up &amp; Helpdesk</span>
				<span className='sep'>&gt;</span>
				<span className='current'>Pro Partner</span>
			</div>

			{/* Header */}
			<div className='gz-mgmt-header mb-6'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title d-flex align-items-center gap-2'>
						<span>RAG Pro Partner Applications</span>
						<span className='badge badge-light-primary fs-8 px-3 py-1'>Verified Trainers &amp; Coaches</span>
					</h1>
					<p className='gz-mgmt-subtitle'>
						Review trainer applications, verify fitness credentials, and evaluate potential sales channels.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<button
						type='button'
						className='gz-mgmt-btn-secondary'
						onClick={downloadExcel}
						disabled={loading || exporting || filteredApplications.length === 0}
						title='Download Applications Excel'>
						<FontAwesomeIcon icon={faDownload} />
						<span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
					</button>
				</div>
			</div>

			{/* Summary KPI Cards */}
			<div className='gz-prod-summary-grid mb-6'>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>Total Applications</div>
					<div className='gz-prod-summary-val'>{stats.total}</div>
					<div className='gz-prod-summary-sub'>All submissions</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>Pending Review</div>
					<div className='gz-prod-summary-val text-warning'>{stats.pending}</div>
					<div className='gz-prod-summary-sub'>Awaiting action</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>Accepted Partners</div>
					<div className='gz-prod-summary-val text-success'>{stats.approved}</div>
					<div className='gz-prod-summary-sub'>Applications approved</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>Rejected Applications</div>
					<div className='gz-prod-summary-val text-danger'>{stats.rejected}</div>
					<div className='gz-prod-summary-sub'>Applications declined</div>
				</div>
			</div>

			{/* Main Management Card */}
			<div className='gz-mgmt-card mb-6'>
				<div className='gz-mgmt-toolbar px-6 py-5 border-bottom border-gray-200'>
					<div className='d-flex flex-wrap align-items-center justify-content-between gap-3 partner-toolbar'>
						{/* Search & Status Filters */}
						<div className='d-flex flex-wrap align-items-center gap-3' style={{ flex: '1 1 auto' }}>
							<div style={{ minWidth: '220px', maxWidth: '300px', flex: '1 1 240px' }}>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
									className='me-0 w-100'
								/>
							</div>

							<select
								className='form-select form-select-sm'
								style={{ height: '38px', minWidth: '160px', width: 'auto', borderRadius: '8px', fontSize: '12px' }}
								aria-label='Filter application status'
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value)}
							>
								<option value=''>All Application Statuses</option>
								<option value='pending'>Pending</option>
								<option value='approved'>Accepted</option>
								<option value='rejected'>Rejected</option>
							</select>

							<div style={{ minWidth: '180px', maxWidth: '220px' }}>
								<SelectField
									className='fv-row mb-0'
									label='Employment Type'
									showLabel={false}
									defaultLabel='All Employment Types'
									name='Filter Employment'
									value={employmentTypeFilter}
									onChange={handleEmploymentTypeChange}
									htmlFor='Filter Employment'
									marginRemove={true}
									height='38px'
									options={employmentOptions}
								/>
							</div>

							<button
								type='button'
								className={`btn btn-sm ${showUnreadOnly ? 'btn-danger' : 'btn-light-danger text-danger'} fw-semibold d-inline-flex align-items-center gap-1`}
								style={{ height: '38px', borderRadius: '8px', padding: '0 14px' }}
								onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
								<span className='bullet bullet-dot bg-danger me-1' />
								{showUnreadOnly ? 'Showing Unread' : 'Filter Unread'}
							</button>
						</div>

						{/* Range & Actions */}
						<div className='d-flex align-items-center gap-3 flex-wrap ms-auto'>
							<div style={{ minWidth: '230px' }}>
								<DateFilter
									onDateRangeChange={(r) => setSelectedDateRange(r)}
									rightValue='0'
								/>
							</div>

							<LengthMenu
								expenseData={filteredApplications}
								handleItemsPerPageChange={handleItemsPerPageChange}
								value={pagination.itemsPerPage}
								className='me-0'
							/>

							<div>
								<DownloadExcelButton
									onClick={downloadExcel}
									disabled={loading || exporting || filteredApplications.length === 0}
									loading={exporting}
									filename='RAG_Pro_Partner_Applications'
								/>
							</div>
						</div>
					</div>
				</div>

				<div className='p-6 pt-0 partner-table'>
					<div className='partner-table-content'>
						<Table
							actionsWidth='185px'
							data={paginatedApplications}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => {
								const d = item.details || {}
								const name = d.full_name || item.name || 'Unnamed Applicant'
								const mobile = d.mobile || item.mobile || ''
								const whatsapp = d.whatsapp || mobile
								const email = d.email || item.email || ''
								const city = d.city || ''
								const state = d.state || ''
								const locationStr = [city, state].filter(Boolean).join(', ')

								return (
									<React.Fragment key={item._id}>
										<tr
											onClick={() => handleRowClick(item._id)}
											className='data-row'>
											<td className='text-center'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-1 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
												{item.read_receipt === false ? (
													<FontAwesomeIcon
														icon={faEnvelope}
														style={{ color: '#f00000', fontSize: '18px' }}
														title='Unread application'
													/>
												) : (
													<FontAwesomeIcon
														icon={faEnvelopeOpen}
														style={{ color: '#50cd89', fontSize: '18px' }}
														title='Reviewed application'
													/>
												)}
											</td>

											{/* Applicant Name & Location */}
											<td>
												<span className='text-dark fw-bold d-block fs-6'>{name}</span>
												{locationStr && (
													<span className='text-muted fs-8 d-block'>
														<FontAwesomeIcon icon={faMapMarkerAlt} className='me-1' />
														{locationStr}
													</span>
												)}
											</td>

											{/* Contact Info with WhatsApp */}
											<td>
												{email && (
													<a
														href={`mailto:${email}`}
														className='text-primary fw-semibold d-block fs-7'
														title={email}
														onClick={(e) => e.stopPropagation()}>
														{email}
													</a>
												)}
												{mobile && (
													<div className='partner-contact-line mt-1'>
														<a
															href={`tel:${mobile}`}
															className='text-dark fw-semibold fs-7'
															onClick={(e) => e.stopPropagation()}>
															{mobile}
														</a>
														{whatsapp && (
															<a
																href={`https://wa.me/${String(whatsapp).replace(/[^0-9]/g, '')}`}
																target='_blank'
																rel='noreferrer'
																className='text-success'
																title='WhatsApp'
																onClick={(e) => e.stopPropagation()}>
																<FontAwesomeIcon icon={faWhatsapp} />
															</a>
														)}
													</div>
												)}
											</td>

											{/* Role & Experience */}
											<td>
												<span className='gz-badge-emp d-inline-block text-truncate' style={{ maxWidth: '200px' }}>
													{d.employment_type || 'Trainer'}
												</span>
												<span className='text-muted fs-8 d-block mt-1'>
													{d.experience_years ? `${d.experience_years} Yrs Exp` : 'Exp: N/A'}
													{d.higher_education ? ` • ${d.higher_education}` : ''}
												</span>
											</td>

											{/* Client Reach */}
											<td>
												<div className='d-flex align-items-center gap-1'>
													<FontAwesomeIcon icon={faUsers} className='text-muted fs-8' />
													<span className='text-dark fw-bold fs-7'>
														{d.active_clients ? String(d.active_clients).replace(/\s*clients?/i, '') : 'N/A'}
													</span>
													<span
														className='badge ms-1'
														style={{
															background: '#ECFDF5',
															color: '#059669',
															fontSize: '10px',
															fontWeight: 600,
															padding: '2px 5px',
														}}>
														Active
													</span>
												</div>
												{d.instagram_followers && (
													<span className='text-muted fs-8 d-inline-flex align-items-center mt-1'>
														<FontAwesomeIcon icon={faInstagram} className='text-danger me-1' style={{ fontSize: '11px' }} />
														{d.instagram_followers}
													</span>
												)}
											</td>

											{/* Sales Potential */}
											<td>
												{d.sales_potential ? (
													<span
														className='d-inline-flex align-items-center gap-1 px-2 py-1'
														style={{
															background: '#EEF2FF',
															color: '#4338CA',
															border: '1px solid #C7D2FE',
															borderRadius: '6px',
															fontSize: '12px',
															fontWeight: 600,
															lineHeight: 1.3,
															whiteSpace: 'normal',
															maxWidth: '180px',
														}}>
														<FontAwesomeIcon icon={faAward} className='flex-shrink-0' />
														<span>
															{String(d.sales_potential)
																.replace(/\s*clients?\s+clients?\s*@/i, ' Clients @')
																.replace(/\s*clients?\s*@/i, ' Clients @')}
														</span>
													</span>
												) : (
													<span className='text-muted fs-8'>Not Specified</span>
												)}
											</td>

											{/* Date Applied */}
											<td>
												<span className='text-dark fw-bold d-block fs-7'>
													{DayJS(item.createdAt).format('DD/MM/YYYY')}
												</span>
												<span className='text-muted fs-8'>
													{DayJS(item.createdAt).format('hh:mm A')}
												</span>
											</td>

											{/* Status & Review Details */}
											<td className='partner-status'>
												<PartnerStatusBadge inquiry={item} />
												<PartnerReviewDetails inquiry={item} />
												{item.partner_policy?.accepted_at && (
													<button
														type='button'
														className='d-inline-flex align-items-center gap-1 mt-2 border-0'
														style={{
															background: '#ECFDF5',
															color: '#047857',
															border: '1px solid #A7F3D0',
															borderRadius: '6px',
															fontSize: '11px',
															fontWeight: 600,
															padding: '3px 8px',
															cursor: 'pointer',
															transition: 'background 0.15s ease',
														}}
														onClick={(e) => {
															e.stopPropagation()
															handleViewPartnerAgreement(item._id)
														}}
														title='View Accepted Agreement PDF'>
														<FontAwesomeIcon icon={faDownload} /> Accepted PDF
													</button>
												)}
											</td>
											<td
												className='partner-actions'
												style={{
													width: '200px',
													minWidth: '200px',
													maxWidth: '220px',
													whiteSpace: 'normal',
													padding: '10px 12px',
													verticalAlign: 'middle',
													position: 'sticky',
													right: 0,
													background: '#ffffff',
													zIndex: 2,
												}}>
												<div className='partner-actions-stack' style={{ width: '100%', minWidth: '160px', maxWidth: '190px', margin: '0 auto' }}>
													<PartnerApplicationActions
														inquiry={item}
														compact
														onUpdated={(updated) => {
															setAllPartnerInquiries((items) =>
																items.map((entry) => (entry._id === updated._id ? updated : entry))
															)
														}}>
														<Link
															className='gz-partner-button gz-partner-button-view'
															to={`${basePath}/contact-inquiry/contact-inquiry-view?contactInquiry_id=${item._id}`}
															onClick={(event) => event.stopPropagation()}
															title='View Application Details'>
															<FontAwesomeIcon icon={faEye} aria-hidden='true' className='gz-partner-btn-icon' />
															<span>View</span>
														</Link>
													</PartnerApplicationActions>
												</div>
											</td>
										</tr>

										{/* Expandable Quick Details Drawer */}
										{isVisible && (
											<tr className='detail-row is-visible'>
												<td colSpan={9}>
													<PartnerPolicyRecord inquiry={item} onRefresh={fetchData} />
													<div className='partner-details-grid'>
														<div>
															<strong>Full Address:</strong> {d.address || 'N/A'} {d.pincode ? `(${d.pincode})` : ''}
															<br />
															<strong>Gender / DOB:</strong> {d.gender || 'N/A'} {d.dob ? `• ${d.dob}` : ''}
														</div>
														<div>
															<strong>Certifications:</strong> {d.additional_certifications || d.additional_qualifications || 'Standard'}
															<br />
															<strong>Recommends Supplements:</strong> {d.recommend_supplements ? 'Yes' : 'No'} {d.supplement_brands ? `(${d.supplement_brands})` : ''}
														</div>
														<div>
															<strong>Documents:</strong>{' '}
															{d.photo_url ? <span className='badge badge-light-success me-1'>Photo</span> : null}
															{d.id_proof_url ? <span className='badge badge-light-primary me-1'>Govt ID</span> : null}
															{d.certification_url ? <span className='badge badge-light-info me-1'>Certificate</span> : null}
															{d.portfolio_url ? <span className='badge badge-light-warning me-1'>Portfolio</span> : null}
															{!d.photo_url && !d.id_proof_url && !d.certification_url && !d.portfolio_url && 'None uploaded'}
															<br />
															<strong>Instagram / Social:</strong>{' '}
															{d.instagram || d.social_link ? (
																<a
																	href={String(d.instagram || d.social_link).startsWith('http') ? String(d.instagram || d.social_link) : `https://${d.instagram || d.social_link}`}
																	target='_blank'
																	rel='noreferrer'
																	className='text-primary fw-semibold'>
																	Open Profile
																</a>
															) : 'N/A'}
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								)
							}}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>

					{filteredApplications.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center py-10'>
							<span className='text-muted fw-bold'>No Pro Partner applications found</span>
						</div>
					)}

					{filteredApplications.length > 0 && (
						<UsersListPagination
							totalPages={paginationTotalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
							totalRecords={filteredApplications.length}
							itemsPerPage={pagination.itemsPerPage}
							entityName='applications'
						/>
					)}
				</div>
			</div>
		</div>
	)
}

export default ProPartnerInquiry

