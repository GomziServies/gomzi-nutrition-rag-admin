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
					font-size: 11.5px !important;
					font-weight: 700 !important;
					letter-spacing: 0.03em !important;
					color: #71809A !important;
					text-transform: uppercase !important;
					background: #F8FAFD !important;
					border-bottom: 1px solid #E4EAF2 !important;
				}
				.partner-table #kt_table_users thead th:nth-child(1) { width: 50px !important; min-width: 50px !important; text-align: center; }
				.partner-table #kt_table_users thead th:nth-child(2) { min-width: 150px; }
				.partner-table #kt_table_users thead th:nth-child(3) { min-width: 210px; }
				.partner-table #kt_table_users thead th:nth-child(4) { min-width: 170px; }
				.partner-table #kt_table_users thead th:nth-child(5) { min-width: 120px; }
				.partner-table #kt_table_users thead th:nth-child(6) { min-width: 180px; }
				.partner-table #kt_table_users thead th:nth-child(7) { min-width: 115px; }
				.partner-table #kt_table_users thead th:nth-child(8) { min-width: 190px; }
				.partner-table #kt_table_users thead th:nth-child(9),
				.partner-table #kt_table_users th:last-child {
					width: 200px !important;
					min-width: 200px !important;
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
				.partner-table .partner-actions-stack {
					width: 100%;
					min-width: 165px;
					max-width: 190px;
					margin: 0 auto;
				}
				.partner-table #kt_table_users .detail-row.is-visible { display: table-row !important; }
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

