import {
	faBox,
	faCheckCircle,
	faClock,
	faDownload,
	faEye,
	faExternalLinkAlt,
	faTruck,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SelectField from '../../../components/SelectField'
import NumberTicker from '../../../components/NumberTicker'
import SearchFilter from '../../../components/SearchFilter'
import GomziTablePagination from '../../../components/GomziTablePagination'
import toast from 'react-hot-toast'
import { GetOrders, UpdateOrder } from '../../../Functions/FGGroup'
import '../orders-theme.css'
import '../products-theme.css'
import { getOrderContact } from './order-contact'

const ProductOrder: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [shipmentStatus, setShipmentStatus] = useState('')
	const [orderStatus, setOrderStatus] = useState('')
	const [formData, setFormData] = useState<any>({
		from_date: '',
		to_date: '',
	})
	const [orderData, setOrderData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort] = useState('createdAt')
	const [loading, setLoading] = useState(false)
	const [loadError, setLoadError] = useState('')
	const requestId = useRef(0)
	const [sortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchOrderData = async (page?: number) => {
		const currentRequest = ++requestId.current
		setLoading(true)
		setLoadError('')
		try {
			const filterQuery: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm ? searchTerm : null,
				item_type: ['FG_MEAL_PRODUCT', 'PURE_GO_MEAL_PRODUCT', 'PURE_GO_SAMPLE_MEAL_PRODUCT'],
			}
			if (orderStatus) filterQuery.order_status = orderStatus

			if (formData.from_date && formData.to_date) {
				filterQuery.from_date = formData.from_date
				filterQuery.to_date = formData.to_date
			}

			if (shipmentStatus) {
				filterQuery.shipment_status = shipmentStatus
			}

			const response = await GetOrders(filterQuery)
			if (currentRequest !== requestId.current) return
			const data: any = response?.data || []
			const metaDataResp: any = response?.metadata || {}
			setMetaData(metaDataResp.pagination)
			setOrderData(data)
		} catch (error: any) {
			if (currentRequest !== requestId.current) return
			setOrderData([])
			setMetaData(undefined)
			setLoadError(error?.message || 'Unable to load orders. Please try again.')
			console.error('Error fetching orders:', error)
		} finally {
			if (currentRequest === requestId.current) setLoading(false)
		}
	}

	useEffect(() => {
		fetchOrderData()
	}, [
		formData.from_date,
		formData.to_date,
		shipmentStatus,
		orderStatus,
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

	const getOrderItemsList = (order: any): { name: string }[] => {
		let items: { name: string }[] = []
		switch (order?.order_item_type) {
			case 'CART': {
				const cartItems = order.CART || []
				const multipleItems = order.multiple_items || []
				items = multipleItems
					.map((multiItem: any) => {
						const cartItem = cartItems.find((cart: any) => cart?._id === multiItem?.item_id)
						const itemName = cartItem?.name || multiItem?.notes?.product_name || multiItem?.name
						if (itemName) {
							const flavour = multiItem?.notes?.flavour ? ` - ${multiItem.notes.flavour}` : ''
							return {
								name: `${itemName}${flavour} (x ${multiItem.quantity || 1})`,
							}
						}
						return null
					})
					.filter(Boolean) as { name: string }[]
				if (items.length === 0 && cartItems.length > 0) {
					items = cartItems.filter(Boolean).map((c: any) => ({ name: c.name || 'N/A' }))
				}
				break
			}
			case 'FG_MEAL_PRODUCT':
			case 'PURE_GO_MEAL_PRODUCT':
			case 'PURE_GO_SAMPLE_MEAL_PRODUCT': {
				const prod = order.product
				const prodName = prod?.name || prod?.item_name || order?.notes?.product_name || order?.notes?.plan_name
				const flavour = order?.notes?.flavour ? ` (${order.notes.flavour})` : ''
				items = prodName ? [{ name: `${prodName}${flavour}` }] : [{ name: 'N/A' }]
				break
			}
			default:
				if (order?.items && Array.isArray(order.items)) {
					items = order.items.map((it: any) => ({ name: it.name || it.item_name || 'N/A' }))
				} else if (order?.notes?.product_name) {
					const flavour = order?.notes?.flavour ? ` (${order.notes.flavour})` : ''
					items = [{ name: `${order.notes.product_name}${flavour}` }]
				} else {
					items = []
				}
				break
		}
		if (items.length === 0 && order?.notes?.product_name) {
			const flavour = order?.notes?.flavour ? ` (${order.notes.flavour})` : ''
			items = [{ name: `${order.notes.product_name}${flavour}` }]
		}
		return items
	}

	const getShipmentStatus = (order: any): string => {
		if (order?.status === 'CANCELLED') return 'CANCELLED'
		const trackingSource = order?.user_meal_product?.tracking || []
		return ['RETURN', 'CANCELLED', 'DELIVERED', 'DISPATCHED', 'PLACED'].find((status) =>
			trackingSource.some((tracking: any) => tracking.status && tracking.shipment_status === status)
		) || 'PLACED'
	}

	// Filter by search (user, receipt id, item) and shipment status
	const filteredOrderData = useMemo(() => {
		return orderData.filter((order: any) => {
			if (!searchTerm || !searchTerm.trim()) return true
			const term = searchTerm.toLowerCase().trim()

			const contact = getOrderContact(order)
			const firstName = contact.first_name || ''
			const lastName = contact.last_name || ''
			const fallbackName = order?.shipping_address?.name || order?.notes?.name || order?.notes?.full_name || ''
			const fullName = `${firstName} ${lastName} ${fallbackName}`.toLowerCase()
			const mobile = (contact.mobile || '').toString().toLowerCase()
			const email = (contact.email || '').toLowerCase()
			const userId = (order?.user_info?.user_id || '').toLowerCase()
			const userMatch =
				fullName.includes(term) ||
				firstName.toLowerCase().includes(term) ||
				lastName.toLowerCase().includes(term) ||
				mobile.includes(term) ||
				email.includes(term) ||
				userId.includes(term)

			const receiptId = (order?.receipt_id || '').toString().toLowerCase()
			const gatewayId = (order?.gateway_order_id || '').toString().toLowerCase()
			const receiptMatch = receiptId.includes(term) || gatewayId.includes(term)

			const items = getOrderItemsList(order)
			const itemNamesText = items.map((i) => i.name).join(' ').toLowerCase()
			const itemMatch = itemNamesText.includes(term)

			return userMatch || receiptMatch || itemMatch
		})
	}, [orderData, shipmentStatus, searchTerm])

	// Derived metrics for summary cards
	const totalOrdersCount = metaData?.totalDocs ?? metaData?.totalRecords ?? metaData?.totalCount ?? metaData?.total ?? orderData.length
	const metrics = useMemo(() => {
		const total = totalOrdersCount
		let placed = 0
		let dispatched = 0
		let delivered = 0

		orderData.forEach((order) => {
			const status = getShipmentStatus(order)
			if (status === 'DELIVERED') delivered++
			else if (status === 'DISPATCHED') dispatched++
			else if (status === 'PLACED') placed++
		})

		return { total, placed, dispatched, delivered }
	}, [orderData, totalOrdersCount])

	const downloadExcel = () => {
		const worksheetData = filteredOrderData.map((order: any, idx: number) => {
			const contact = getOrderContact(order)
			const items = getOrderItemsList(order)
			const itemNamesStr = items.map((i) => i.name).join(', ')
			const shipmentStatusText = getShipmentStatus(order)

			return {
				'No.': idx + 1,
				'User Name': (
					order?.shipping_address?.name ||
					order?.notes?.name ||
					order?.notes?.full_name ||
					`${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
					'Customer'
				),
				Mobile: contact.mobile || 'N/A',
				'Receipt ID': order.receipt_id || 'N/A',
				'Items with Quantity': itemNamesStr || 'N/A',
				'Total Price': `${order.amount || 0} ${order.currency || 'INR'}`,
				'Purchased On': DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
				'Shipment Status': shipmentStatusText,
				'Order Status': order.status || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Orders')
		XLSX.writeFile(workbook, `Product_Orders_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	const getInitials = (first?: string, last?: string) => {
		const f = (first || '').trim().charAt(0).toUpperCase()
		const l = (last || '').trim().charAt(0).toUpperCase()
		return f || l ? `${f}${l}` : 'U'
	}

	const renderStatusBadge = (status: string) => {
		const s = status.toUpperCase()
		if (s === 'DELIVERED') {
			return <span className='gz-prod-badge delivered'>Delivered</span>
		}
		if (s === 'DISPATCHED') {
			return <span className='gz-prod-badge dispatched'>Dispatched</span>
		}
		if (s === 'CANCELLED' || s === 'RETURN') {
			return <span className='gz-prod-badge cancelled'>{s === 'CANCELLED' ? 'Cancelled' : 'Returned'}</span>
		}
		return <span className='gz-prod-badge placed'>{status || 'Placed'}</span>
	}

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Product Orders</PageTitle>

			{/* Breadcrumb */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Products & Orders</span>
				<span className='sep'>/</span>
				<span className='current'>Product Orders</span>
			</div>

			{/* Page Header */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Product Orders</h1>
					<p className='gz-prod-subtitle'>View and manage customer orders.</p>
				</div>
			</div>

			{/* Summary KPI Cards */}
			<div className='gz-prod-summary-grid'>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-blue'>
						<FontAwesomeIcon icon={faBox} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Total Orders</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={metrics.total} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-amber'>
						<FontAwesomeIcon icon={faClock} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Placed / Pending</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={metrics.placed} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-blue'>
						<FontAwesomeIcon icon={faTruck} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Dispatched</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={metrics.dispatched} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-green'>
						<FontAwesomeIcon icon={faCheckCircle} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Delivered</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={metrics.delivered} />
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Main Card with Toolbar & Table */}
			<div className='gz-prod-card'>
				{/* Standard Toolbar Placement: Search -> LengthMenu -> DownloadExcel -> Status -> DateFilter */}
				<div className='gz-prod-toolbar'>
					<div className='gz-prod-toolbar-left'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search by customer, receipt, or item...'
							className='me-0'
						/>
						<LengthMenu
							expenseData={filteredOrderData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							className='me-0'
						/>
						<div>
							<DownloadExcelButton
								onClick={downloadExcel}
								disabled={loading || filteredOrderData.length === 0}
								title='Export Records to Excel'
							/>
						</div>
						<div style={{ minWidth: '150px' }}>
							<SelectField
								value={orderStatus}
								onChange={(e: any) => {
									setOrderStatus(e.target.value)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}
								options={[
									{ label: 'All Payment Statuses', value: '' },
									{ label: 'Successful', value: 'SUCCESS' },
									{ label: 'Pending Payment', value: 'PENDING' },
									{ label: 'Failed', value: 'FAILED' },
									{ label: 'Cancelled', value: 'CANCELLED' },
									{ label: 'Refunded', value: 'REFUNDED' },
								]}
								showLabel={false}
								marginRemove={true}
								hideDefaultOption={true}
								searchable={false}
							/>
						</div>
						<div style={{ minWidth: '150px' }}>
							<SelectField
								value={shipmentStatus}
								onChange={(e: any) => {
									setShipmentStatus(e.target.value)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}
								options={[
									{ label: 'All Status', value: '' },
									{ label: 'Placed', value: 'PLACED' },
									{ label: 'Dispatched', value: 'DISPATCHED' },
									{ label: 'Delivered', value: 'DELIVERED' },
									{ label: 'Cancelled', value: 'CANCELLED' },
									{ label: 'Return', value: 'RETURN' },
								]}
								showLabel={false}
								marginRemove={true}
								hideDefaultOption={true}
								searchable={false}
								defaultLabel='All Status'
							/>
						</div>
						<div>
							<DateFilter
								defaultAllDates={true}
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>

				{/* Orders Table */}
				<div className='table-responsive' style={{ overflowX: 'auto' }}>
					<table className='gz-prod-table'>
						<thead>
							<tr>
								<th style={{ width: '60px' }}>No.</th>
								<th>Customer</th>
								<th>Receipt ID</th>
								<th>Items with Quantity</th>
								<th>Total Amount</th>
								<th>Purchased On</th>
								<th>Payment Status</th>
								<th>Shipment Status</th>
								<th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 6 }).map((_, idx) => (
									<tr key={`skeleton-${idx}`} className='gz-prod-skeleton-row'>
										<td><span className='gz-prod-skeleton' style={{ width: '24px', height: '16px' }} /></td>
										<td>
											<div className='gz-prod-user-cell'>
												<span className='gz-prod-skeleton' style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
												<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
													<span className='gz-prod-skeleton' style={{ width: '120px', height: '14px' }} />
													<span className='gz-prod-skeleton' style={{ width: '80px', height: '12px' }} />
												</div>
											</div>
										</td>
										<td><span className='gz-prod-skeleton' style={{ width: '100px', height: '22px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '160px', height: '14px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '70px', height: '14px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '130px', height: '14px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '80px', height: '22px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '80px', height: '22px', borderRadius: '999px' }} /></td>
										<td style={{ textAlign: 'center' }}><span className='gz-prod-skeleton' style={{ width: '64px', height: '32px', borderRadius: '8px' }} /></td>
									</tr>
								))
							) : loadError ? (
								<tr>
									<td colSpan={9}>
										<div role='alert' className='gz-empty-state-wrap'>
											<p>{loadError}</p>
											<button type='button' className='btn btn-light-primary' onClick={() => fetchOrderData()}>
												Retry loading orders
											</button>
										</div>
									</td>
								</tr>
							) : filteredOrderData.length === 0 ? (
								<tr>
									<td colSpan={9} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap'>
											<div className='gz-prod-empty-icon'>
												<FontAwesomeIcon icon={faBox} />
											</div>
											<h4 className='gz-empty-state-title'>No orders found</h4>
											<p className='gz-empty-state-desc'>
												{searchTerm || shipmentStatus || orderStatus || formData.from_date
													? 'No orders match your filter criteria. Try clearing filters.'
													: 'There are currently no customer orders in the system.'}
											</p>
										</div>
									</td>
								</tr>
							) : (
								filteredOrderData.map((order: any, index: number) => {
									const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
									const items = getOrderItemsList(order)
									const shipment_status = getShipmentStatus(order)
									const user = getOrderContact(order)
									const fullName = (
										order?.shipping_address?.name ||
										order?.notes?.name ||
										order?.notes?.full_name ||
										(user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') ||
										'Customer'
									)
									const contactInfo = (
										user?.mobile ||
										order?.notes?.mobile ||
										order?.notes?.phone ||
										order?.shipping_address?.mobile ||
										user?.email ||
										order?.notes?.email ||
										'No contact info'
									)
									const profileImg = user?.profile_image
										? `https://files.fggroup.in/${user.profile_image}`
										: null

									return (
										<tr key={order?._id || index}>
											<td>
												<span style={{ fontWeight: 600, color: '#64748B' }}>{actualIndex}</span>
											</td>
											<td>
												<div className='gz-prod-user-cell'>
													{profileImg ? (
														<img
															src={profileImg}
															alt={fullName}
															className='gz-prod-avatar'
															onError={(e) => {
																;(e.target as HTMLElement).style.display = 'none'
															}}
														/>
													) : (
														<div className='gz-prod-avatar-fallback'>
															{getInitials(user?.first_name || fullName.split(' ')[0], user?.last_name || fullName.split(' ')[1])}
														</div>
													)}
													<div>
														<div style={{ fontWeight: 600, color: '#172B4D', fontSize: '14px' }}>
															{fullName}
														</div>
														<div style={{ fontSize: '12px', color: '#71809A', marginTop: '2px' }}>
															{contactInfo}
														</div>
													</div>
												</div>
											</td>
											<td>
												<span className='gz-prod-receipt-id'>
													{order.receipt_id || 'N/A'}
												</span>
											</td>
											<td>
												<div className='gz-prod-items-summary'>
													{items.length === 0 ? (
														<span style={{ color: '#94A3B8', fontSize: '12.5px' }}>N/A</span>
													) : (
														items.map((it: any, itemIdx: number) => (
															<div key={itemIdx} className='gz-prod-item-row'>
																<span className='gz-prod-item-bullet' />
																<span>{it.name}</span>
															</div>
														))
													)}
												</div>
											</td>
											<td>
												<span style={{ fontWeight: 600, color: '#142447', fontSize: '14px' }}>
													₹{(order.amount || 0).toLocaleString('en-IN')}
												</span>
											</td>
											<td>
												<span style={{ fontSize: '13px', color: '#475569' }}>
													{DayJS(order.createdAt).format('DD MMM YYYY, hh:mm A')}
												</span>
											</td>
											<td>
												<select
													className={`gz-status-select gz-status-pill ${
														(order.status || '').toLowerCase() === 'success'
															? 'success'
															: (order.status || '').toLowerCase() === 'pending'
															? 'pending'
															: (order.status || '').toLowerCase() === 'failed' || (order.status || '').toLowerCase() === 'cancelled'
															? 'danger'
															: (order.status || '').toLowerCase() === 'refunded'
															? 'primary'
															: 'secondary'
													}`}
													style={{ fontSize: '12px', padding: '3px 8px', height: 'auto', border: '1px solid rgba(0,0,0,0.1)' }}
													aria-label={`Payment status for ${order.receipt_id || order._id}`}
													value={order.status || 'PENDING'}
													onClick={(e) => e.stopPropagation()}
													onChange={(e) => handleQuickStatusChange(order._id, e.target.value)}
													title='Click to change order status'
												>
													<option value='SUCCESS'>SUCCESS</option>
													<option value='PENDING'>PENDING</option>
													<option value='CANCELLED'>CANCELLED</option>
													<option value='FAILED'>FAILED</option>
													<option value='REFUNDED'>REFUNDED</option>
												</select>
											</td>
											<td>
												{renderStatusBadge(shipment_status)}
											</td>
											<td>
												<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
													<Link
														to={`/rag/product-order-view?order_id=${order?._id}`}
														className='gz-prod-action-btn view'
														title='View Order Details'>
														<FontAwesomeIcon icon={faEye} />
													</Link>
													<Link
														to={`/rag/all-order/view-order?order_id=${order?._id}`}
														className='gz-prod-action-btn edit'
														title='Explore Order'>
														<FontAwesomeIcon icon={faExternalLinkAlt} />
													</Link>
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				{filteredOrderData.length > 0 && (
					<GomziTablePagination
						totalRecords={metaData?.totalDocs ?? metaData?.totalRecords ?? metaData?.totalCount ?? filteredOrderData.length}
						page={pagination.page}
						itemsPerPage={pagination.itemsPerPage}
						totalPages={metaData?.totalPages || Math.ceil((metaData?.totalDocs ?? metaData?.totalRecords ?? metaData?.totalCount ?? filteredOrderData.length) / pagination.itemsPerPage) || 1}
						onPageChange={handlePageChange}
						entityName='orders'
					/>
				)}
			</div>
		</div>
	)
}

export default ProductOrder
