import React, { useEffect, useRef, useState } from 'react'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import InputField from '../../../../components/InputField'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import TableSort from '../../../../components/TableSort'
import { GetBooks, GetOrders } from '../../../../Functions/FGGroup'
import { DayJS } from '../../../../../_metronic/helpers/Utils'

const BookOrder: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [bookName, setBookName] = useState('')
	const [shipmentStatus, setShipmentStatus] = useState('')
	const [orderData, setOrderData] = useState<any>([])
	const [bookData, setBookData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [metaData, setMetaData] = useState<any>()
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchOrderData = async (page?: number) => {
		setLoading(true)
		try {
			const filterQuery: any = {
				order_status: 'SUCCESS',
				item_type: 'BOOKS',
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

	const fetchBookData = async () => {
		setLoading(true)
		try {
			const response = await GetBooks()
			const data: any = response.data

			setBookData(data)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchOrderData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		shipmentStatus,
		bookName,
		selectedDateRange,
	])
	useEffect(() => {
		fetchBookData()
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

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	// const filteredOrderData = orderData.filter((order: any) => {
	// 	const userMatch =
	// 		order?.user_info?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
	// 		order?.user_info?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
	// 		order?.user_info?.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
	// 		searchTerm === ''

	// 	const bookMatch = bookName
	// 		? order.order_item_type === 'BOOKS' &&
	// 		  order.books?.book_title?.toLowerCase().includes(bookName.toLowerCase())
	// 		: true
	// 	const shipmentMatch = shipmentStatus
	// 		? order?.book_subscription?.tracking?.some(
	// 				(tracking: { shipment_status: string; status: boolean }) =>
	// 					tracking.status && tracking.shipment_status === shipmentStatus
	// 		  )
	// 		: true

	// 	return userMatch && bookMatch && shipmentMatch
	// })

	// const paginatedOrderData = filteredOrderData.slice(
	// 	(pagination.page - 1) * pagination.itemsPerPage,
	// 	pagination.page * pagination.itemsPerPage
	// )

	const orderStatusOption = ['PLACED', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURN']

	const sortableFields = [
		{ title: 'User', field: 'first_name' },
		{ title: 'Receipt ID', field: 'receipt_id' },
		{ title: 'Item Name', field: 'itemName' },
		{ title: 'Price', field: 'amount' },
		{ title: 'Purchased On', field: 'createdAt' },
		{ title: 'Shipment Status', field: 'shipment_status' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Book Subscription</PageTitle>
			<KTCard>
				<div className='col-md-12 mt-5 px-5'>
					<div className='row'>
						<InputField
							placeholder='Enter Book Name'
							type='text'
							className='col-md-3 fv-row'
							name='bookName'
							label='Book Name'
							htmlFor='bookName'
							value={bookName}
							onChange={(e) => setBookName(e.target.value)}
						/>
						<div className='col-4'>
							<label
								className='fw-bold fs-6 mb-5'
								htmlFor='Select'>
								Select Date
							</label>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<SelectField
							className='col-md-3 fv-row'
							name='shipmentStatus'
							label='Shipment Status'
							htmlFor='shipmentStatus'
							value={shipmentStatus}
							onChange={(e) => setShipmentStatus(e.target.value)}
							options={orderStatusOption}
						/>
					</div>
				</div>
				<div className='d-flex justify-content-between mx-6 m-5'>
					<div className='d-flex pt-1 mx-2'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
					<div className='me-3'>
						<LengthMenu
							expenseData={orderData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<TableSort
								sortableFields={sortableFields}
								sort={sort}
								sortOrder={sortOrder}
								onSortChange={handleSortChange}
							/>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={12}
											className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									orderData.map((order: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										const shipment_status =
											order?.book_subscription?.tracking?.find(
												(tracking: { shipment_status: string; status: boolean }) =>
													tracking.status && tracking.shipment_status === 'DELIVERED'
											)?.shipment_status ||
											order?.book_subscription?.tracking?.find(
												(tracking: { shipment_status: string; status: boolean }) =>
													tracking.status && tracking.shipment_status === 'DISPATCHED'
											)?.shipment_status ||
											order?.book_subscription?.tracking?.find(
												(tracking: { shipment_status: string; status: boolean }) =>
													tracking.status && tracking.shipment_status === 'PLACED'
											)?.shipment_status

										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark ms-6 fw-bold   mb-1 fs-6'>
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
														{order?.books ? (
															order?.books?.book_title + ` (×${order?.notes?.quantity})`
														) : (
															<ul>
																{order?.multiple_items?.map((item: any) => {
																	const itemsData = bookData.find(
																		(book: any) => book._id == item?.item_id
																	)
																	return (
																		<li>
																			{itemsData?.book_title} (× {item?.quantity})
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
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{shipment_status}
													</span>
												</td>
												<td>
													<div className='d-flex'>
														<TableButton
															action='view'
															to={'/fgiit/book-order-view?order_id=' + order._id}
															text='View'
															showIcon={false}
															backgroundDark={true}
														/>
														<TableButton
															action='assign'
															to={'/fgiit/all-order/view-order?order_id=' + order._id}
															text='Explore'
															showIcon={false}
															backgroundDark={true}
															// className='my-2'
														/>
													</div>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
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

export default BookOrder
