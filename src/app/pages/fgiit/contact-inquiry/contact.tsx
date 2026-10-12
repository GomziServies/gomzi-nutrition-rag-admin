import {
	faDownload,
	faEnvelope,
	faEnvelopeOpen,
	faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
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

const ContactInquiry: React.FC = () => {
	const hideSourcePrefix = 'https://www.gomzilifesciences.in/'

	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [contactInquiry, setContactInquiry] = useState<any>([])
	const [allContactInquiry, setAllContactInquiry] = useState<any>([])
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [subject, setSubject] = useState('')

	const shouldHideInquiry = (item: any) => {
		const sourceValue = (item?.source || item?.Source || '').toString().trim().toLowerCase()
		const pageValue = (item?.page || item?.Page || '').toString().trim().toLowerCase()
		return sourceValue.startsWith(hideSourcePrefix) || pageValue.startsWith(hideSourcePrefix)
	}

	const fetchData = async () => {
		setLoading(true)
		try {
			const pageSize = 100
			const firstResponse: any = await GetContactInquiry({
				page: 1,
				limit: pageSize,
				search: searchTerm,
				sort,
				sortOrder,
				unread_only: showUnreadOnly,
				subject: subject,
			})

			const paginationMeta: any = firstResponse?.metadata?.pagination || {}
			setMetaData(paginationMeta)
			const totalPages = Number(paginationMeta.totalPages || 1)
			let allData = Array.isArray(firstResponse?.data)
				? firstResponse.data.filter((item: any) => !shouldHideInquiry(item))
				: []

			for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
				const nextResponse: any = await GetContactInquiry({
					page: currentPage,
					limit: pageSize,
					search: searchTerm,
					sort,
					sortOrder,
					unread_only: showUnreadOnly,
					subject: subject,
				})
				if (Array.isArray(nextResponse?.data)) {
					allData = allData.concat(
						nextResponse.data.filter((item: any) => !shouldHideInquiry(item))
					)
				}
			}

			setAllContactInquiry(allData)
			setContactInquiry(allData)
		} catch (error: any) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm, sort, sortOrder, showUnreadOnly, subject])

	useEffect(() => {
		fetchData()
	}, [searchTerm, sort, sortOrder, showUnreadOnly, subject])

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, page: 1, itemsPerPage: value }))
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setSubject(event.target.value)
	}

	const subjectOptions = useMemo(() => {
		const s = new Set<string>()
		// derive from full dataset if available, otherwise from current page
		const source = allContactInquiry.length > 0 ? allContactInquiry : contactInquiry
		source.forEach((it: any) => {
			if (it && it.subject) s.add(it.subject.toString())
		})
		const arr = Array.from(s).sort()
		return arr
	}, [allContactInquiry, contactInquiry])

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

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	const filteredContactInquiry = contactInquiry.filter((item: any) => {
		if (!item) return false
		if (subject && subject !== '') {
			if ((item.subject || '').toString() !== subject) return false
		}
		if (showUnreadOnly) {
			if (item.read_receipt !== false) return false
		}
		if (!selectedDateRange) return true
		const [startDate, endDate] = selectedDateRange
		const itemDate = new Date(item.createdAt)
		return itemDate >= startDate && itemDate <= endDate
	})

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

	return (
		<>
			<PageTitle breadcrumbs={[]}>Contact Inquiry</PageTitle>
			<KTCard>
				<div className='w-100 px-5 border-0 pt-6 row'>
					<div className='w-100 d-flex flex-wrap align-items-end gap-3'>
						<div className='me-auto col-md-4 pe-0'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>

						<div className='col-auto'>
							<button
								className='btn btn-primary btn-icon'
								onClick={downloadExcel}
								disabled={loading || exporting || filteredContactInquiry.length === 0}>
								<FontAwesomeIcon
									icon={faDownload}
									className='fs-3'
								/>
							</button>
						</div>

						<div className='col-auto'>
							<LengthMenu
								expenseData={filteredContactInquiry}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>

						<div className='col-md-3'>
							<SelectField
								className='fv-row'
								label='Subject'
								name='Filter Subject'
								value={subject || 'All'}
								onChange={handleSelectChange}
								htmlFor='Filter Subject'
								marginRemove={true}
								options={subjectOptions}
							/>
						</div>

						<div
							style={{ minWidth: '250px' }}
							className='col-auto'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
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
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item.subject}</span>
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
												to={`/fgiit/contact-inquiry/contact-inquiry-view?contactInquiry_id=${item._id}`}
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
					{contactInquiry.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{contactInquiry.length > 0 && (
						<UsersListPagination
							totalPages={paginationTotalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}
export default ContactInquiry
