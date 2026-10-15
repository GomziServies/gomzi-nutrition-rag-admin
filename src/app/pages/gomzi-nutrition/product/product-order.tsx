import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetOrders } from '../../../Functions/FGGroup'

const ProductOrder: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [shipmentStatus, setShipmentStatus] = useState('')
	const [formData, setFormData] = useState<any>({
		from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
		to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
	})
	const [orderData, setOrderData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchOrderData = async (page?: number) => {
		setLoading(true)
		try {
			const filterQuery: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm ? searchTerm : null,
				item_type: ['FG_MEAL_PRODUCT'],
				order_status: 'SUCCESS',
			}

			if (formData.from_date && formData.to_date) {
				filterQuery.from_date = formData.from_date
				filterQuery.to_date = formData.to_date
			}

			if (shipmentStatus) {
				filterQuery.shipment_status = shipmentStatus
			}

			const response = await GetOrders(filterQuery)
			const data: any = response?.data || []
			const metaDataResp: any = response?.metadata || {}
			setMetaData(metaDataResp.pagination)
			setOrderData(data)
		} catch (error) {
			console.error('Error fetching orders:', error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchOrderData()
	}, [
		formData.from_date,
		formData.to_date,
		shipmentStatus,
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
	])

	const isFirstRender = useRef(true)

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

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		if (dateRange && dateRange[0] && dateRange[1]) {
			setFormData({
				from_date: DayJS(dateRange[0]).format('YYYY-MM-DD'),
				to_date: DayJS(dateRange[1]).format('YYYY-MM-DD'),
			})
		} else {
			setFormData({
				from_date: '',
				to_date: '',
			})
		}
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const getOrderItemsList = (order: any): { name: string }[] => {
		let items: { name: string }[] = []
		switch (order?.order_item_type) {
			case 'CART': {
				const cartItems = order.CART || []
				const multipleItems = order.multiple_items || []
				items = multipleItems
					.map((multiItem: any) => {
						const cartItem = cartItems.find((cart: any) => cart?._id === multiItem?.item_id)
						if (cartItem) {
							return {
								name: `${cartItem.name || 'N/A'} (x ${multiItem.quantity || 1})`,
							}
						}
						return null
					})
					.filter(Boolean) as { name: string }[]
				if (items.length === 0 && cartItems.length > 0) {
					items = cartItems.map((c: any) => ({ name: c.name || 'N/A' }))
				}
				break
			}
			case 'FG_MEAL_PRODUCT': {
				const prod = order.product
				items = prod ? [{ name: prod.name || prod.item_name || 'N/A' }] : [{ name: 'N/A' }]
				break
			}
			default:
				if (order?.items && Array.isArray(order.items)) {
					items = order.items.map((it: any) => ({ name: it.name || it.item_name || 'N/A' }))
				} else {
					items = []
				}
				break
		}
		return items
	}

	const getShipmentStatus = (order: any): string => {
		const trackingSource =
			order?.order_item_type === 'CART'
				? order?.user_meal_product?.tracking || []
				: order?.product_subscription?.tracking || []

		return (
			trackingSource.find(
				(tracking: { shipment_status: string; status: boolean }) =>
					tracking.status && tracking.shipment_status === 'DELIVERED'
			)?.shipment_status ||
			trackingSource.find(
				(tracking: { shipment_status: string; status: boolean }) =>
					tracking.status && tracking.shipment_status === 'DISPATCHED'
			)?.shipment_status ||
			trackingSource.find(
				(tracking: { shipment_status: string; status: boolean }) =>
					tracking.status && tracking.shipment_status === 'PLACED'
			)?.shipment_status ||
			'No Status Available'
		)
	}

	// Filter by search (user, receipt id, item) and shipment status
	const filteredOrderData = orderData.filter((order: any) => {
		// 1. Status Filter
		if (shipmentStatus) {
			const currentShipmentStatus = getShipmentStatus(order)
			const matchesStatus =
				order?.order_status === shipmentStatus ||
				currentShipmentStatus === shipmentStatus
			if (!matchesStatus) return false
		}

		// 2. Search Filter (user, receipt ID, item)
		if (!searchTerm || !searchTerm.trim()) return true
		const term = searchTerm.toLowerCase().trim()

		// User details
		const firstName = order?.user_info?.first_name || ''
		const lastName = order?.user_info?.last_name || ''
		const fullName = `${firstName} ${lastName}`.toLowerCase()
		const mobile = (order?.user_info?.mobile || '').toString().toLowerCase()
		const email = (order?.user_info?.email || '').toLowerCase()
		const userId = (order?.user_info?.user_id || '').toLowerCase()
		const userMatch =
			fullName.includes(term) ||
			firstName.toLowerCase().includes(term) ||
			lastName.toLowerCase().includes(term) ||
			mobile.includes(term) ||
			email.includes(term) ||
			userId.includes(term)

		// Receipt ID
		const receiptId = (order?.receipt_id || '').toString().toLowerCase()
		const gatewayId = (order?.gateway_order_id || '').toString().toLowerCase()
		const receiptMatch = receiptId.includes(term) || gatewayId.includes(term)

		// Items
		const items = getOrderItemsList(order)
		const itemNamesText = items.map((i) => i.name).join(' ').toLowerCase()
		const itemMatch = itemNamesText.includes(term)

		return userMatch || receiptMatch || itemMatch
	})

	const downloadExcel = () => {
		const worksheetData = filteredOrderData.map((order: any, idx: number) => {
			const items = getOrderItemsList(order)
			const itemNamesStr = items.map((i) => i.name).join(', ')
			const shipmentStatusText = getShipmentStatus(order)

			return {
				'No.': idx + 1,
				'User Name': `${order?.user_info?.first_name || 'DELETED USER'} ${order?.user_info?.last_name || ''}`.trim(),
				Mobile: order?.user_info?.mobile || 'N/A',
				'Receipt ID': order.receipt_id || 'N/A',
				'Items with Quantity': itemNamesStr || 'N/A',
				'Total Price': `${order.amount || 0} ${order.currency || 'INR'}`,
				'Purchased On': DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
				'Shipment Status': shipmentStatusText,
				'Order Status': order.order_status || order.status || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Orders')
		XLSX.writeFile(workbook, `Product_Orders_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	const orderStatusOption = [
		{ label: 'All Status', value: '' },
		{ label: 'Placed', value: 'PLACED' },
		{ label: 'Dispatched', value: 'DISPATCHED' },
		{ label: 'Delivered', value: 'DELIVERED' },
		{ label: 'Cancelled', value: 'CANCELLED' },
		{ label: 'Return', value: 'RETURN' },
	]

	const sortableFields = [
		{ title: 'User', field: 'user_info' },
		{ title: 'Receipt ID', field: 'receipt_id' },
		{ title: 'Items with Quantity', field: 'items' },
		{ title: 'Total Price', field: 'total_price' },
		{ title: 'Purchased On', field: 'createdAt' },
		{ title: 'Shipment Status', field: 'order_status' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Product Order</PageTitle>
			<KTCard>
				{/* Filters Toolbar Row: Search, Dropdown (show entries), Excel, Status, DateFilter */}
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex flex-wrap align-items-center gap-3 w-100'>
						{/* 1. Search Filter */}
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								className='me-0'
							/>
						</div>

						{/* 2. Entries per page dropdown */}
						<div>
							<LengthMenu
								expenseData={filteredOrderData}
								handleItemsPerPageChange={handleItemsPerPageChange}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center justify-content-center'
								style={{
									width: '38px',
									height: '38px',
									padding: 0,
									borderRadius: '8px',
									fontSize: '14px',
								}}
								onClick={downloadExcel}
								disabled={loading || filteredOrderData.length === 0}
								title='Download Excel'>
								<FontAwesomeIcon icon={faDownload} />
							</button>
						</div>

						{/* 4. Status Filter */}
						<div style={{ minWidth: '170px' }}>
							<SelectField
								showLabel={false}
								marginRemove
								name='shipmentStatus'
								value={shipmentStatus}
								onChange={(e) => {
									setShipmentStatus(e.target.value)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}
								options={orderStatusOption}
								searchable={false}
								hideDefaultOption={true}
							/>
						</div>

						{/* 5. Date Filter */}
						<div className='d-flex align-items-center'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>

				{/* Table Data */}
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={filteredOrderData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(order: any, index: number, actualIndex: number, isVisible: boolean) => {
								const items = getOrderItemsList(order)
								const shipment_status = getShipmentStatus(order)

								return (
									<React.Fragment key={order?._id}>
										<tr
											onClick={() => handleRowClick(order?._id)}
											className='data-row'>
											<td>
												<span className='text-dark fw-bold ms-6 mb-1 fs-6'>
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
																order?.user_info?.profile_image
																	? `https://files.fggroup.in/${order?.user_info?.profile_image}`
																	: toAbsoluteUrl('/media/logos/fgiit-logo.png')
															}
															alt='User'
															style={{ width: '50px', height: '50px' }}
														/>
													</div>
													<div className='d-flex justify-content-start flex-column'>
														<span className='text-dark fw-bold fs-6'>
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
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{order.receipt_id || 'N/A'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													<ul className='mb-0 ps-4'>
														{items.map((it: any, itemIdx: number) => (
															<li key={itemIdx}>{it.name}</li>
														))}
													</ul>
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{order.amount + ' ' + (order.currency || 'INR')}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold mb-1 fs-6'>
													{shipment_status || 'N/A'}
												</span>
											</td>
											<td>
												<div className='d-flex align-items-center'>
													<TableButton
														action='view'
														to={'/rag/product-order-view?order_id=' + order?._id}
														title='View Details'
														backgroundDark={true}
													/>
													<TableButton
														action='explore'
														to={'/rag/all-order/view-order?order_id=' + order?._id}
														title='Explore Order'
														backgroundDark={true}
													/>
												</div>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div>
														<strong>{sortableFields[1].title}: </strong>{' '}
														<img
															src={`https://files.fggroup.in/${order.cover_image}`}
															alt={order.book_title}
															className='fs-3 text-primary'
															style={{ width: '65px', height: '65px', borderRadius: '20%' }}
														/>
														<br />
														<strong>{sortableFields[0].title}: </strong> {order.book_title}
														<br />
														<strong>{sortableFields[2].title}: </strong> ₹ {order.amount}
														<br />
														<strong>{sortableFields[3].title}: </strong>{' '}
														{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
														<br />
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
					{filteredOrderData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{filteredOrderData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default ProductOrder
