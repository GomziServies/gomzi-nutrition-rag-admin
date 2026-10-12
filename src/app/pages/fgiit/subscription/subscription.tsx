import { faCopy, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SelectFieldManual from '../../../components/SelectFieldManual'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { getSubscription } from '../../../Functions/FGGroup/Subscription'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const statusBadgeMap: { [key: string]: string } = {
	created: 'badge badge-secondary',
	authenticated: 'badge badge-info',
	active: 'badge badge-success',
	pending: 'badge badge-warning',
	halted: 'badge badge-dark',
	cancelled: 'badge badge-danger',
	completed: 'badge badge-primary',
	expired: 'badge badge-light',
	paused: 'badge badge-warning',
}

const SubscriptionList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [subscriptionBy, setSubscriptionBy] = useState('')
	const [bookData, setBookData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchSubscriptionData = async (page?: number) => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			}

			if (endDate) {
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			}

			const response = await getSubscription({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				...(searchTerm && {search: searchTerm}),
				...(subscriptionBy && {subscriptionBy: subscriptionBy}),
				sort,
				sortOrder,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			const filteredData: any = response.data.filter((book: any) => {
				const bookDate = new Date(book.createdAt)
				if (startDate && endDate) {
					return bookDate >= startDate && bookDate <= endDate
				}
				return true
			})

			setBookData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchSubscriptionData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange, subscriptionBy])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchSubscriptionData()
		}
	}, [searchTerm])

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'User', field: 'user' },
		{ title: 'Link', field: 'rezorpay_link' },
		{ title: 'Status', field: 'status' },
		{ title: 'Created date', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleCopy = (id: string) => {
		navigator.clipboard
			.writeText(id)
			.then(() => {
				toast.success('ID copied to clipboard!')
			})
			.catch((err) => {
				console.error('Failed to copy ID: ', err)
				toast.error('Failed to copy ID!')
			})
	}

	const handleKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>, id: string) => {
		if (event.key === 'Enter' || event.key === ' ') {
			handleCopy(id)
		}
	}
	return (
		<div>
			<PageTitle breadcrumbs={[]}>Subscription</PageTitle>
			<KTCard>
				<div className='row justify-content-between my-7 mx-5'>
					<div className='col-sm-6 col-12 d-flex'>
						<SelectFieldManual
							className='fv-row'
							label='Filter'
							showLabel={false}
							name='filter'
							value={subscriptionBy}
							onChange={(e) => setSubscriptionBy(e.target.value)}
							htmlFor='filter'
							marginRemove={true}
							options={[
								{ value: 'User', name: 'User' },
								{ value: 'Admin', name: 'Admin' },
							]}
						/>
						<div>
							<LengthMenu
								expenseData={bookData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='col-sm-6 col-12 mt-sm-0 mt-7 d-flex justify-content-end position-relative'>
						<div className='col-md-6 mt-md-0 mt-2 me-5'>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<div className='modal-footer justify-content-end'>
							<TableButton
								action='add'
								to='/fgiit/subscription/create'
								text='Create Subscription'
							/>
						</div>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={bookData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							disableSortFields={['rezorpay_plan_id', 'user_id', 'short_url']}
							renderRow={(
								subscriptionData: any,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => (
								<React.Fragment key={subscriptionData._id}>
									<tr
										onClick={() => handleRowClick(subscriptionData._id)}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold  ms-6 mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													<img
														src={
															subscriptionData?.user_id?.profile_image
																? `https://files.fggroup.in/${subscriptionData?.user_id?.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{subscriptionData?.user_id?.first_name +
															' ' +
															subscriptionData?.user_id?.last_name}
													</span>
													<span className='text-muted fw-semibold text-muted d-block fs-7'>
														{subscriptionData?.user_id?._id}
													</span>
												</div>
											</div>
										</td>
										<td
											onClick={() => handleCopy(subscriptionData?.short_url)}
											onKeyPress={(event) => handleKeyPress(event, subscriptionData?.short_url)}
											role='button'
											tabIndex={0}>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												<div className='d-flex'>
													<FontAwesomeIcon
														icon={faCopy}
														className='fs-3 me-2 text-success'
													/>
													{subscriptionData?.short_url}
												</div>
											</span>
										</td>
										<td>
											<span
												className={`fw-bold mb-1 fs-6 p-2 ${
													statusBadgeMap[subscriptionData?.status]
												} text-uppercase`}>
												{subscriptionData?.status}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold mb-1 fs-6'>
												{DayJS(subscriptionData?.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												to={`/fgiit/subscription/view?plan_id=${subscriptionData?._id}&subscription_id=${subscriptionData?.razorpay_subscription_id}`}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-5'>
															<img
																src={
																	subscriptionData?.user_id?.profile_image
																		? `https://files.fggroup.in/${subscriptionData?.user_id?.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>
																{subscriptionData?.user_id?.first_name +
																	' ' +
																	subscriptionData?.user_id?.last_name}
															</span>
															<span className='text-muted fw-semibold text-muted d-block fs-7'>
																{subscriptionData?.user_id?._id}
															</span>
														</div>
													</div>
													<div className='d-flex'>
														<strong>{sortableFields[1].title}: </strong>{' '}
														<span
															className='text-dark fw-bold d-block ms-3 mb-1 fs-6'
															onClick={() => handleCopy(subscriptionData?.short_url)}
															onKeyPress={(event) =>
																handleKeyPress(event, subscriptionData?.short_url)
															}
															role='button'
															tabIndex={0}>
															<div className='d-flex'>
																<FontAwesomeIcon
																	icon={faCopy}
																	className='fs-3 me-2 text-success'
																/>
																{subscriptionData?.short_url}
															</div>
														</span>
													</div>
													<strong>{sortableFields[2].title}: </strong>{' '}
													<span
														className={`fw-bold mb-1 fs-6 p-2 ${
															statusBadgeMap[subscriptionData?.status]
														} text-uppercase`}>
														{subscriptionData?.status}
													</span>
													<br />
													<strong>{sortableFields[3].title}: </strong>{' '}
													<span className='text-dark fw-bold mb-1 fs-6'>
														{DayJS(subscriptionData?.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
													</span>
													<br />
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
					{bookData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{bookData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</div>
	)
}

export default SubscriptionList
