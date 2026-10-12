import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetComplaint } from '../../../Functions/FGGroup/ComplaintAssistant'
import TableButton from '../../../components/TableButton'

const ComplaintAssistantGCS: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [complaintData, setComplaintData] = useState<any>([])
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [subject, setSubject] = useState('')

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response = await GetComplaint({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm ? searchTerm : 'gcs',
				sort,
				sortOrder,
			})

			const filteredData: any = response.data

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			setComplaintData(filteredData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		if (searchTerm) {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		} else {
			fetchData()
		}
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, subject, searchTerm])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setSubject(event.target.value)
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Tracking Id', field: 'tracking_id' },
		{ title: 'Name', field: 'name' },
		{ title: 'Email', field: 'email' },
		{ title: 'Complaint', field: 'complaint' },
		{ title: 'Message', field: 'message' },
		{ title: 'Message Reply', field: 'reply_message' },
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

	return (
		<>
			<PageTitle breadcrumbs={[]}>Complaint Assistant</PageTitle>
			<KTCard>
				<div className='w-100 px-5 border-0 pt-6 row'>
					{/* <SelectField
						className='col-md-4 fv-row'
						label='Subject'
						name='Filter Subject'
						value={subject}
						onChange={handleSelectChange}
						htmlFor='Filter Subject'
						marginRemove={true}
						options={[
							'FGIIT',
							'FWG',
						]}
					/> */}
					<div className='mt-5 col-md-2 col-4 mt-md-12'>
						<LengthMenu
							expenseData={complaintData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>

					<div className='col-md-4 d-flex justify-content-end mt-md-12 mt-6 ms-md-0 ms-3 pe-0'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={complaintData}
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
											{/* {item.read_receipt === false ? (
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
											)} */}
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.tracking_id}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.user_id.first_name + ' ' + item.user_id.last_name}
											</span>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.user_id.mobile}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.user_id.email}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item.complaint}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item?.message}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{item?.reply_message || "-"}</span>
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
												to={`/gcs/complaint-assistant-gcs-view?complaint_id=${item._id}`}
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
					{complaintData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{complaintData.length > 0 && (
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
export default ComplaintAssistantGCS
