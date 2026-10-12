import { faEnvelope, faEnvelopeOpen, faEye, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetContactInquiry } from '../../../Functions/GCS'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const GCSInquiryList: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const subjectParams: any = searchParams.get('subject')!
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [contactInquiry, setContactInquiry] = useState<any>([])
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [subject, setSubject] = useState('')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response = await GetContactInquiry({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				subject: subjectParams || subject,
				sortOrder,
				unread_only: showUnreadOnly,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			const filteredData: any = response.data
			setContactInquiry(filteredData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [
		pagination.page,
		pagination.itemsPerPage,
		sort,
		sortOrder,
		showUnreadOnly,
		subjectParams,
		subject,
	])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

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

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setSubject(event.target.value)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>GCS Contact Inquiry</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SelectField
							className='col-12 fv-row mb-7'
							label='Subject'
							name='Filter Subject'
							value={subject}
							onChange={handleSelectChange}
							htmlFor='Filter Subject'
							options={['Gcs', 'Fitit', 'Takshak', 'Atoz', 'Stallon']}
						/>
						<div className='mt-5 col-md-12'>
							<LengthMenu
								expenseData={contactInquiry}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<div className='form-check m-5'>
							<input
								className='form-check-input'
								type='checkbox'
								id='statusCheckbox'
								checked={showUnreadOnly}
								onChange={(e) => {
									setShowUnreadOnly(e.target.checked)
									fetchData()
								}}
							/>
							<label
								className='form-check-label'
								htmlFor='statusCheckbox'>
								Show Unread Only
							</label>
						</div>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={contactInquiry}
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
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{actualIndex}
											</span>
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
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.name}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.email}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.mobile}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.subject}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.message}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											<Link
												to={`/gcs/contact/contact-view?inquiry_id=${item._id}`}
												className='btn gap-2 btn-light-primary mx-2 btn-sm me-1'>
												<FontAwesomeIcon
													icon={faEye}
													className='fs-3'
												/>
											</Link>
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
													<strong>{sortableFields[4].title}:</strong> {item.message}
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
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}
export default GCSInquiryList
