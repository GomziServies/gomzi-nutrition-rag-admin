import {
	faDownload,
	faEnvelope,
	faEnvelopeOpen,
	faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { endOfMonth, startOfMonth } from 'date-fns'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetContactInquiry } from '../../../Functions/FGGroup'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'

const ContactInquiry: React.FC = () => {
	const location = useLocation()
	const basePath = location.pathname.startsWith('/hr') ? '/hr' : '/rag'
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [contactInquiry, setContactInquiry] = useState<any>([])
	const [allContactInquiry, setAllContactInquiry] = useState<any>([])
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)
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
	const [subject, setSubject] = useState('')

	const RAG_CONTACT_SOURCE_FILTER =
		'gomzilifesciences|ragnutrition|contact-us|5173|whey|rag'

	const renderOriginBadge = (source?: string, subject?: string) => {
		const src = (source || '').toLowerCase()
		const sub = (subject || '').toLowerCase()
		if (src.includes('contact-us') || sub.includes('rag website') || src.includes('5173')) {
			return <span className='badge badge-light-success fw-bold fs-8 py-1 px-2 mt-1'>RAG Website</span>
		}
		if (src.includes('inquiry') || sub.includes('partner')) {
			return <span className='badge badge-light-primary fw-bold fs-8 py-1 px-2 mt-1'>Partner Program</span>
		}
		if (src.includes('whey')) {
			return <span className='badge badge-light-warning fw-bold fs-8 py-1 px-2 mt-1'>Whey Landing</span>
		}
		return null
	}

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
			let allData = Array.isArray(firstResponse?.data) ? [...firstResponse.data] : []

			for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
				const nextResponse: any = await GetContactInquiry({
					page: currentPage,
					limit: pageSize,
					source: RAG_CONTACT_SOURCE_FILTER,
				})
				if (Array.isArray(nextResponse?.data)) {
					allData = allData.concat(nextResponse.data)
				}
			}

			allData.sort((a: any, b: any) => {
				const aTime = new Date(a?.createdAt || 0).getTime()
				const bTime = new Date(b?.createdAt || 0).getTime()
				return bTime - aTime
			})

			setAllContactInquiry(allData)
			setContactInquiry(allData)
		} catch (error: any) {
			console.error(error)
			toast.error('Failed to load contact inquiries')
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm, sort, sortOrder, showUnreadOnly, subject, selectedDateRange])

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, page: 1, itemsPerPage: value }))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const val = event.target.value
		if (val === 'All') {
			setSubject('')
		} else {
			setSubject(val)
		}
	}

	const subjectOptions = useMemo(() => {
		const s = new Set<string>()
		allContactInquiry.forEach((it: any) => {
			if (it && it.subject) s.add(it.subject.toString())
		})
		const arr = Array.from(s).sort()
		return [...arr]
	}, [allContactInquiry])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Name', field: 'name' },
		{ title: 'Email', field: 'email' },
		{ title: 'Mobile Number', field: 'mobile' },
		{ title: 'Subject', field: 'subject' },
		{ title: 'Message', field: 'message' },
		{ title: 'Date/Time', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const [expandedDescription, setExpandedDescription] = useState<{ [key: number]: boolean }>({})

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

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	const filteredContactInquiry = useMemo(() => {
		const filtered = allContactInquiry.filter((item: any) => {
			// Apply client-side filters: search, subject, unread, date range
			if (!item) return false

			if (searchTerm && typeof searchTerm === 'string') {
				const q = searchTerm.toLowerCase().trim()
				const matchesSearch =
					(item.name || '').toString().toLowerCase().includes(q) ||
					(item.email || '').toString().toLowerCase().includes(q) ||
					(item.mobile || '').toString().toLowerCase().includes(q) ||
					(item.subject || '').toString().toLowerCase().includes(q) ||
					(item.source || '').toString().toLowerCase().includes(q) ||
					(item.message || '').toString().toLowerCase().includes(q)
				if (!matchesSearch) return false
			}

			if (subject && subject !== '') {
				if ((item.subject || '').toString() !== subject) return false
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
				let aVal = a[sort]
				let bVal = b[sort]

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
	}, [allContactInquiry, searchTerm, subject, showUnreadOnly, selectedDateRange, sort, sortOrder])

	const paginatedContactInquiry = filteredContactInquiry.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const totalPages = Math.ceil(filteredContactInquiry.length / pagination.itemsPerPage)
	const paginationTotalPages = Number(totalPages || metaData?.totalPages || 1)

	const downloadExcel = () => {
		setExporting(true)
		try {
			const worksheetData = filteredContactInquiry.map((item: any) => ({
				Name: item.name || 'N/A',
				Email: item.email || 'N/A',
				'Mobile Number': item.mobile || 'N/A',
				Subject: item.subject || 'N/A',
				Source: item.source || 'N/A',
				Message: item.message || 'N/A',
				Date: DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
			}))

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Contact Inquiry')
			XLSX.writeFile(workbook, 'ContactInquiry.xlsx')
			toast.success('Excel file downloaded successfully')
		} catch (error) {
			console.error('Error exporting contact inquiries:', error)
			toast.error('Failed to export contact inquiries')
		} finally {
			setExporting(false)
		}
	}

	const stats = useMemo(() => {
		const total = allContactInquiry.length
		const unread = allContactInquiry.filter((i: any) => i.read_receipt === false).length
		const read = total - unread
		const partner = allContactInquiry.filter((i: any) => {
			const sub = (i.subject || '').toLowerCase()
			const src = (i.source || '').toLowerCase()
			return sub.includes('partner') || src.includes('inquiry')
		}).length
		return { total, unread, read, partner }
	}, [allContactInquiry])

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Contact Inquiry</PageTitle>

			<style>{`
				.contact-table .data-row {
					cursor: pointer;
					border-bottom: 1px solid #EEF2F7;
					transition: background 0.15s ease;
				}
				.contact-table .data-row:hover {
					background: #F8FAFD;
				}
				.contact-table .data-row td {
					padding: 14px 12px;
					vertical-align: middle;
				}
				.status-indicator-badge {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 28px;
					height: 28px;
					border-radius: 8px;
				}
			`}</style>

			{/* Breadcrumb */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to={`${basePath}/dashboard`}>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Contact Inquiries</span>
			</div>

			{/* Header */}
			<div className='gz-mgmt-header mb-6'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Contact Inquiries</h1>
					<p className='gz-mgmt-subtitle'>
						Review customer questions, partnership requests, and website contact form submissions.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<button
						type='button'
						className='gz-mgmt-btn-secondary'
						onClick={downloadExcel}
						disabled={loading || exporting || filteredContactInquiry.length === 0}
						title='Download Excel'>
						<FontAwesomeIcon icon={faDownload} />
						<span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
					</button>
				</div>
			</div>

			{/* Summary KPI Cards */}
			<div className='gz-prod-summary-grid mb-6'>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>Total Inquiries</div>
					<div className='gz-prod-summary-val'>{stats.total}</div>
					<div className='gz-prod-summary-sub'>All submissions</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>Unread Inquiries</div>
					<div className='gz-prod-summary-val text-danger'>{stats.unread}</div>
					<div className='gz-prod-summary-sub'>Awaiting review</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>Reviewed Inquiries</div>
					<div className='gz-prod-summary-val text-success'>{stats.read}</div>
					<div className='gz-prod-summary-sub'>Marked as read</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-label'>Partner Program</div>
					<div className='gz-prod-summary-val text-primary'>{stats.partner}</div>
					<div className='gz-prod-summary-sub'>Applications received</div>
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
							expenseData={filteredContactInquiry}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>

						<div style={{ minWidth: '220px', maxWidth: '300px' }}>
							<SelectField
								className='fv-row mb-0'
								label='Subject'
								showLabel={false}
								defaultLabel='All Subjects'
								name='Filter Subject'
								value={subject}
								onChange={handleSelectChange}
								htmlFor='Filter Subject'
								marginRemove={true}
								height='38px'
								options={subjectOptions}
							/>
						</div>

						<div style={{ minWidth: '250px' }}>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>

				<div className='p-6 pt-0 contact-table'>
					<div className='table-responsive'>
						<Table
							data={paginatedContactInquiry}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
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
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											{item.read_receipt === false ? (
												<FontAwesomeIcon
													icon={faEnvelope}
													className=''
													style={{ color: '#f00000', fontSize: '18px' }}
												/>
											) : (
												<FontAwesomeIcon
													icon={faEnvelopeOpen}
													className=''
													style={{ color: '#50cd89', fontSize: '18px' }}
												/>
											)}
										</td>
										<td
											style={{
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												maxWidth: '100px',
											}}>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item.name}</span>
										</td>
										<td
											style={{
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												maxWidth: '100px',
											}}>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item.email}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item.mobile}</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>{item.subject}</span>
											{renderOriginBadge(item.source, item.subject)}
										</td>
										<td
											style={{
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												maxWidth: '400px',
											}}>
											<span
												className='text-dark fw-bold  d-md-block d-none mb-1 fs-6'
												onClick={() => toggleDescription(index)}
												style={{ cursor: 'pointer' }}
												title={item.message}>
												{expandedDescription[index]
													? item.message
													: truncateString(item.message, 40)}
											</span>
											<span
												className='text-dark fw-bold  d-md-none d-block mb-1 fs-6'
												style={{ cursor: 'pointer' }}
												title={item.message}
												onClick={() => toggleDescription(index)}>
												{expandedDescription[index]
													? item.message
													: truncateString(item.message, 20)}
											</span>
										</td>
										<td
											style={{
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												maxWidth: '100px',
											}}>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												to={`${basePath}/contact-inquiry/contact-inquiry-view?contactInquiry_id=${item._id}`}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}:</strong> {item.name}
													<br />
													<strong>{sortableFields[1].title}:</strong> {item.email}
													<br />
													<strong>{sortableFields[2].title}:</strong> {item.mobile}
													<br />
													<strong>{sortableFields[3].title}:</strong> {item.subject}
													<br />
													<strong>Source URL:</strong>{' '}
													<a
														href={item.source}
														target='_blank'
														rel='noreferrer'
														className='text-primary fw-semibold'>
														{item.source || 'N/A'}
													</a>
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													<span
														className='text-dark  mb-1 fs-6'
														style={{ cursor: 'pointer' }}
														title={item.message}
														onClick={() => toggleDescription(index)}>
														{expandedDescription[index]
															? item.message
															: truncateString(item.message, 40)}
													</span>
													<br />
													<strong>{sortableFields[5].title}:</strong>{' '}
													{DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{filteredContactInquiry.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center py-10'>
							<span className='text-muted fw-bold'>No records found</span>
						</div>
					)}
					{filteredContactInquiry.length > 0 && (
						<UsersListPagination
							totalPages={paginationTotalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
		</div>
	)
}
export default ContactInquiry
