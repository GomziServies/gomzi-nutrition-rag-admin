import {
	faAward,
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
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetContactInquiry } from '../../../Functions/FGGroup'
import { isOrderInquiry } from './contactInquiryUtils'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'
import './contact-inquiry.css'

export const isProPartnerApplication = (item: any): boolean => {
	if (!item || isOrderInquiry(item)) return false
	const subject = (item.subject || '').toString().toLowerCase()
	const details = item.details || {}
	return (
		subject.includes('partner') ||
		details.inquiryType === 'partner' ||
		Boolean(
			details.higher_education ||
			details.experience_years ||
			details.employment_type ||
			details.sales_potential ||
			details.certification_url
		)
	)
}

const ProPartnerInquiry: React.FC = () => {
	const location = useLocation()
	const basePath = location.pathname.startsWith('/hr') ? '/hr' : '/rag'
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [allPartnerInquiries, setAllPartnerInquiries] = useState<any[]>([])
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)
	const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
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
	}, [searchTerm, sort, sortOrder, showUnreadOnly, employmentTypeFilter, selectedDateRange])

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
	]

	const handleRowClick = (id: string) => {
		setVisibleDetails(visibleDetails === id ? null : id)
	}

	const filteredApplications = useMemo(() => {
		const filtered = allPartnerInquiries.filter((item: any) => {
			if (!item || !isProPartnerApplication(item)) return false

			const details = item.details || {}

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
	}, [allPartnerInquiries, searchTerm, employmentTypeFilter, showUnreadOnly, selectedDateRange, sort, sortOrder])

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
					'Status': item.read_receipt ? 'Reviewed' : 'Pending',
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
		const unread = allPartnerInquiries.filter((i: any) => i.read_receipt === false).length
		const reviewed = total - unread
		const highPotential = allPartnerInquiries.filter((i: any) => {
			const pot = (i?.details?.sales_potential || '').toLowerCase()
			return pot.includes('15') || pot.includes('30') || pot.includes('products')
		}).length
		return { total, unread, reviewed, highPotential }
	}, [allPartnerInquiries])

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>RAG Pro Partner Applications</PageTitle>

			<style>{`
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
					<div className='gz-prod-summary-val text-danger'>{stats.unread}</div>
					<div className='gz-prod-summary-sub'>Awaiting action</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>Reviewed &amp; Verified</div>
					<div className='gz-prod-summary-val text-success'>{stats.reviewed}</div>
					<div className='gz-prod-summary-sub'>Evaluated</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>High Potential Tier</div>
					<div className='gz-prod-summary-val text-primary'>{stats.highPotential}</div>
					<div className='gz-prod-summary-sub'>Active sales drivers</div>
				</div>
			</div>

			{/* Main Management Card */}
			<div className='gz-mgmt-card mb-6'>
				<div className='gz-mgmt-toolbar'>
					<div className='d-flex flex-wrap align-items-center gap-3'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							className='me-0'
						/>

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

						<div style={{ minWidth: '240px', maxWidth: '320px' }}>
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

						<div style={{ minWidth: '250px' }}>
							<DateFilter
								onDateRangeChange={(r) => setSelectedDateRange(r)}
								rightValue='0'
							/>
						</div>

						<button
							type='button'
							className={`btn btn-sm ${showUnreadOnly ? 'btn-danger' : 'btn-light'} fw-bold`}
							style={{ height: '38px', borderRadius: '8px' }}
							onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
							{showUnreadOnly ? 'Showing Unread' : 'Filter Unread'}
						</button>
					</div>
				</div>

				<div className='p-6 pt-0 partner-table'>
					<div className='table-responsive'>
						<Table
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
														onClick={(e) => e.stopPropagation()}>
														{email}
													</a>
												)}
												{mobile && (
													<div className='d-flex align-items-center gap-2 mt-1'>
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
														{d.active_clients ? `${d.active_clients} Active` : 'N/A'}
													</span>
												</div>
												{d.instagram_followers && (
													<span className='text-muted fs-8 d-block'>
														<FontAwesomeIcon icon={faInstagram} className='text-danger me-1' />
														{d.instagram_followers}
													</span>
												)}
											</td>

											{/* Sales Potential */}
											<td>
												{d.sales_potential ? (
													<span className='gz-badge-potential'>
														<FontAwesomeIcon icon={faAward} />
														{d.sales_potential}
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

											{/* View Details Action */}
											<td>
												<TableButton
													action='view'
													to={`${basePath}/contact-inquiry/contact-inquiry-view?contactInquiry_id=${item._id}`}
												/>
											</td>
										</tr>

										{/* Expandable Quick Details Drawer */}
										{isVisible && (
											<tr className='detail-row is-visible'>
												<td colSpan={8}>
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

