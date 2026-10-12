import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { GetOrders, GetUserFitnessCourses } from '../../../../Functions/FGGroup'
import { DayJS } from '../../../../../_metronic/helpers/Utils'

const FitnessOrder: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [orderData, setOrderData] = useState<any>([])
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [sort, setSort] = useState('createdAt')
	const [metaData, setMetaData] = useState<any>()
	const [shipmentStatus, setShipmentStatus] = useState('')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const fetchOrderData = async (page?: number) => {
		setLoading(true)
		try {
			const filterQuery: any = {
				order_status: 'SUCCESS',
				item_type: 'FITNESS_COURSE',
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm ? searchTerm : null,
			}

			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange.map((dateStr) => new Date(dateStr))
			} else {
				startDate = null
				endDate = null
			}

			if (startDate && endDate) {
				filterQuery.from_date = DayJS(startDate).format('YYYY-MM-DD')
				filterQuery.to_date = DayJS(endDate).format('YYYY-MM-DD')
			}

			const response = await GetOrders(filterQuery)
			const data: any = response.data
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			setOrderData(data)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchCourseData = async (page?: number) => {
		setLoading(true)
		try {
			const response = await GetUserFitnessCourses()
			const data: any = response.data
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchOrderData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange, shipmentStatus])

	useEffect(() => {
		fetchCourseData()
	}, [])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchOrderData()
		}
	}, [searchTerm])

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	function viewOrder(order_id: string) {
		window.open('/fgiit/all-order/view-order?order_id=' + order_id)
	}

	function viewFitnessOrder(fitness_course_id: string, order_id: string) {
		window.open(`/fgiit/user/user-fitness-course-view?user_fitness_course_id=${fitness_course_id}&order_id=${order_id}`)
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}
	const sortableFields = [
		{ title: 'User', field: 'first_name' },
		{ title: 'Receipt ID', field: 'receipt_id' },
		{ title: 'Item Name', field: 'course_name' },
		{ title: 'Price', field: 'amount' },
		{ title: 'Activated Date', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const orderStatusOption = ['PLACED', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURN']

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Fitness Course</PageTitle>
			<KTCard>
				<div className='d-flex justify-content-between mx-6 m-5 me-8'>
					<div className='d-flex mx-2 align-items-end'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
					<div className='d-flex align-items-end'>
						<div>
							<label
								className='fw-bold fs-6 mb-5'
								htmlFor='Select'>
								Select Date
							</label>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<LengthMenu
							expenseData={orderData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={orderData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(order: any, index: number, actualIndex: number, isVisible: boolean) => {
								const course_name = order?.fitness_course?.course_name

								return (
									<React.Fragment key={order._id}>
										<tr
											onClick={() => handleRowClick(order._id)}
											className='data-row'>
											<td className='text-center'>
												<span className='text-dark fw-bold   mb-1 fs-6'>
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
													<div className='symbol symbol-45px me-3'>
														<img
															src={
																order.profile_image
																	? `https://files.fggroup.in/${order.profile_image}`
																	: toAbsoluteUrl('/media/logos/fgiit-logo.png')
															}
															alt='User'
															style={{ width: '50px', height: '50px' }}
														/>
													</div>
													<div className='d-flex justify-content-start flex-column'>
														<span className='text-dark fw-bold  fs-6'>
															{(order?.user_info?.first_name || 'DELETED USER') +
																' ' +
																(order?.user_info?.last_name || ' ') || 'N/A'}
														</span>
														<span className='text-muted fw-semibold text-muted d-flex fs-7'>
															{order?.user_info?.mobile || 'N/A'}
														</span>
													</div>
												</div>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{order.receipt_id || 'N/A'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{order?.order_item_id ? (
														course_name
													) : (
														<ul>
															{order?.multiple_items?.map((item: any) => {
																const itemsData = order?.CART.find(
																	(course: any) => course._id == item?.item_id
																)
																return (
																	<li>
																		{itemsData?.course_name} (× {item?.quantity})
																	</li>
																)
															})}
														</ul>
													)}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{order.amount + ' ' + (order.currency || 'INR')}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</span>
											</td>
											<td>
												<div className='d-flex'>
													<TableButton
														action='view'
														onClick={() => viewOrder(order?._id)}
														text='View Order'
														showIcon={false}
														backgroundDark={true}
													/>
												</div>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div>
														<strong>{sortableFields[0].title}: </strong> {order?.receipt_id || '-'}
														<br />
														<br />
														<strong>{sortableFields[1].title}: </strong>{' '}
														{(order.user_info?.first_name || 'Deleted') +
															' ' +
															(order.user_info?.last_name || '')}
														<br />
														<strong>Mobile: </strong>{' '}
														{(order.user_info?.country_code || '-') +
															' ' +
															(order.user_info?.mobile || '')}
														<br />
														<strong>{sortableFields[2].title}: </strong>{' '}
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{order?.order_item_id ? (
																course_name
															) : (
																<ul>
																	{order?.multiple_items?.map((item: any) => {
																		const itemsData = order?.CART.find(
																			(course: any) => course._id == item?.item_id
																		)
																		return (
																			<li>
																				{itemsData?.course_name} (× {item?.quantity})
																			</li>
																		)
																	})}
																</ul>
															)}
														</span>
														<br />
														<strong>{sortableFields[3].title}: </strong>{' '}
														{order?.amount ? order?.amount + ' ' + (order?.currency || 'INR') : ''}{' '}
														<br />
														<strong>{sortableFields[4].title}: </strong>{' '}
														{DayJS(order?.createdAt).format('DD/MM/YYYY hh:mm:ss A')} <br />
														<strong>{sortableFields[5].title}: </strong>{' '}
														{order?.purchase_mode ? order?.purchase_mode : ''} <br />
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
					{orderData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{orderData.length > 0 && (
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

export default FitnessOrder
