/* eslint-disable */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faDownload,
	faEye,
	faBoxesStacked,
	faCheckCircle,
	faClock,
	faBan,
	faBoxOpen,
	faReceipt,
} from '@fortawesome/free-solid-svg-icons'
import { MultiSelect } from 'react-multi-select-component'
import * as XLSX from 'xlsx'
import { toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import SearchFilter from '../../../../components/SearchFilter'
import LengthMenu from '../../../../components/LengthMenu'
import NumberTicker from '../../../../components/NumberTicker'
import GomziTablePagination from '../../../../components/GomziTablePagination'
import { GetBooks, GetOrders } from '../../../../Functions/FGGroup'
import '../../../gomzi-nutrition/products-theme.css'
import '../../../gomzi-nutrition/orders-theme.css'

const AllOrder: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const user_id: any = searchParams.get('user_id')

	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [loading, setLoading] = useState(false)
	const [orderData, setOrderData] = useState<any[]>([])
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [bookData, setBookData] = useState<any>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [formData, setFormData] = useState<any>({
		itemName: '',
		itemType: [],
		from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
		to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
		order_status: 'SUCCESS',
	})

	const fetchOrderData = async (page?: number) => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange.map((dateStr) => new Date(dateStr))
				startDate = new Date(startDate.setHours(0, 0, 0, 0))
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			}

			const filterQuery: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm ? searchTerm : null,
			}

			if (formData.order_status && formData.order_status !== 'ALL') {
				filterQuery.order_status = formData.order_status
			}
			if (startDate && endDate) {
				filterQuery.from_date = DayJS(startDate).format('YYYY-MM-DD')
				filterQuery.to_date = DayJS(endDate).format('YYYY-MM-DD')
			}
			if (formData.itemType.length > 0) {
				filterQuery.item_type = formData.itemType.map((el: any) => el.value)
			}
			if (user_id) {
				filterQuery.user_id = user_id
			}

			const response = await GetOrders(filterQuery)
			const data: any = response?.data || []
			const meta: any = response?.metadata || {}
			setMetaData(meta.pagination)

			const filteredData = data.map((AllData: any) => {
				const cartItems = AllData.CART || []
				const multipleItems = AllData.multiple_items || []

				let productData
				if (AllData.order_item_type === 'CART') {
					productData = multipleItems
						.map((multiItem: any) => {
							const cartItem = cartItems.find((cart: any) => cart._id === multiItem.item_id)
							if (cartItem) {
								return {
									name:
										multiItem.item_type === 'BOOKS'
											? cartItem.book_title
											: multiItem.item_type === 'FG_MEAL_PRODUCT'
											? cartItem.name
											: cartItem.course_name,
									amount: multiItem.amount || 0,
									type: multiItem.item_type || 'Unknown',
									quantity: multiItem.quantity || 1,
									id: multiItem._id || 'Unknown',
								}
							}
							return null
						})
						.filter(Boolean)
				}

				return {
					...AllData,
					productData,
				}
			})

			setOrderData(filteredData)
		} catch (error) {
			console.error('Error fetching orders:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchOrderData()
	}, [
		formData.order_status,
		formData.from_date,
		formData.to_date,
		formData.itemType,
		sort,
		sortOrder,
		pagination.page,
		pagination.itemsPerPage,
		user_id,
		selectedDateRange,
	])

	const fetchBookData = async () => {
		try {
			const response = await GetBooks()
			setBookData(response?.data || [])
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchBookData()
	}, [])

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

	const handleInputChange = (
		event:
			| React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
			| { target: { name: string; value: any } }
	) => {
		setPagination((prev) => ({ ...prev, page: 1 }))
		const { name, value } = event.target
		setFormData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const downloadExcel = () => {
		const worksheetData = orderData.map((order: any) => {
			const itemType = String(order.order_item_type).split('_').join(' ')
			let itemName = '-'
			switch (order.order_item_type) {
				case 'FG_MEAL_PRODUCT':
					itemName = order.product?.name || 'N/A'
					break
				case 'PT_PLAN':
					itemName = order.fitness_plan?.plan_name || 'N/A'
					break
				case 'FITNESS_COURSE':
					itemName = order.fitness_course?.course_name || 'N/A'
					break
				case 'DIGITAL_PLAN':
					itemName = order.digital_plan?.plan_name || 'N/A'
					break
				case 'BOOKS':
					itemName = order.book?.book_title || 'N/A'
					break
				case 'EBOOKS':
					itemName = order.ebook?.ebook_title || 'N/A'
					break
			}

			return {
				'Receipt ID': order.receipt_id || 'N/A',
				'Gateway ID': order.gateway_order_id || 'N/A',
				'User Name': `${order?.user_info?.first_name || '-'} ${order?.user_info?.last_name || ''}`.trim(),
				Mobile: order?.user_info?.mobile || 'N/A',
				'Item Name': itemName,
				'Item Type': itemType,
				Amount: `${order.amount} ${order.currency || 'INR'}`,
				'Paid Amount': `${
					!isNaN(order?.payment_breakdowns?.paid_amount)
						? order.payment_breakdowns.paid_amount
						: order.amount
				} ${order.currency || 'INR'}`,
				'Order Created At': DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
				'Order Status': order.status || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
		XLSX.writeFile(workbook, `All_Orders_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	const itemTypeOption = [
		{ value: 'FG_MEAL_PRODUCT', label: 'FG Meal Product' },
		{ value: 'PT_PLAN', label: 'PT Plan' },
		{ value: 'FITNESS_COURSE', label: 'Fitness Course' },
		{ value: 'DIGITAL_PLAN', label: 'Digital Plan' },
		{ value: 'BOOKS', label: 'Books' },
		{ value: 'EBOOKS', label: 'Ebooks' },
	]

	const orderStatusOption = ['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED']

	const renderStatusBadge = (status: string) => {
		const s = (status || '').toUpperCase()
		if (s === 'SUCCESS') return <span className='gz-status-pill success'>Success</span>
		if (s === 'PENDING') return <span className='gz-status-pill pending'>Pending</span>
		if (s === 'FAILED') return <span className='gz-status-pill danger'>Failed</span>
		if (s === 'CANCELLED') return <span className='gz-status-pill secondary'>Cancelled</span>
		if (s === 'REFUNDED') return <span className='gz-status-pill primary'>Refunded</span>
		return <span className='gz-status-pill secondary'>{status || 'N/A'}</span>
	}

	// Derived metrics for summary cards
	const summaryStats = useMemo(() => {
		const total = metaData?.totalRecords || orderData.length
		let successCount = 0
		let pendingCount = 0
		let failedCount = 0

		orderData.forEach((order) => {
			const st = (order.status || order.order_status || '').toUpperCase()
			if (st === 'SUCCESS') successCount++
			else if (st === 'PENDING') pendingCount++
			else failedCount++
		})

		return { total, successCount, pendingCount, failedCount }
	}, [orderData, metaData])

	const viewBasePath = location.pathname.startsWith('/rag')
		? '/rag/all-order/view-order'
		: location.pathname.startsWith('/fgiit')
		? '/fgiit/all-order/view-order'
		: '/all-order/view-order'

	const currentStart = (pagination.page - 1) * pagination.itemsPerPage + 1
	const totalItems = metaData?.totalRecords || orderData.length
	const totalPages = metaData?.totalPages || Math.ceil(totalItems / pagination.itemsPerPage) || 1

	return (
		<div className='gz-prod-container'>
			<PageTitle>Customer Orders</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<span>Order Management</span>
				<span className='sep'>&gt;</span>
				<span className='current'>All Orders</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>All Customer Orders</h1>
					<p className='gz-prod-subtitle'>
						Centralized directory of all customer transactions, purchases, and subscriptions
					</p>
				</div>
			</div>

			{/* =========================================================================
			    SUMMARY METRICS CARDS
			    ========================================================================= */}
			<div className='gz-prod-summary-grid'>
				<div className='gz-prod-summary-card blue'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faBoxesStacked} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Total Orders</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.total} />
							)}
						</span>
					</div>
				</div>

				<div className='gz-prod-summary-card green'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faCheckCircle} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Successful Orders</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.successCount} />
							)}
						</span>
					</div>
				</div>

				<div className='gz-prod-summary-card amber'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faClock} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Pending</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.pendingCount} />
							)}
						</span>
					</div>
				</div>

				<div className='gz-prod-summary-card red'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faBan} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Failed / Cancelled</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.failedCount} />
							)}
						</span>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    FILTER ROW
			    ========================================================================= */}
			<div className='gz-order-card mb-4'>
				<div className='p-4'>
					<div className='row g-3 align-items-center'>
						<div className='col-lg-4 col-md-6'>
							<label className='gz-prod-label mb-1'>Item Type Filter</label>
							<MultiSelect
								options={itemTypeOption}
								value={formData.itemType}
								hasSelectAll={true}
								onChange={(selected: any) =>
									handleInputChange({ target: { name: 'itemType', value: selected } })
								}
								labelledBy='Filter by Item Type'
							/>
						</div>

						<div className='col-lg-4 col-md-6'>
							<label className='gz-prod-label mb-1'>Date Range</label>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0' />
						</div>

						<div className='col-lg-4 col-md-12'>
							<label className='gz-prod-label mb-1'>Order Status</label>
							<select
								name='order_status'
								className='gz-prod-input'
								value={formData.order_status}
								onChange={handleInputChange}>
								{orderStatusOption.map((status) => (
									<option key={status} value={status}>
										{status === 'ALL' ? 'All Statuses' : status}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    TOOLBAR (SEARCHBAR -> LENGTHMENU -> EXPORT)
			    ========================================================================= */}
			<div className='gz-prod-toolbar'>
				<div className='gz-prod-toolbar-left'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						className='me-0'
					/>
					<LengthMenu
						expenseData={orderData}
						handleItemsPerPageChange={handleItemsPerPageChange}
						className='me-0'
					/>
				</div>

				<div className='gz-prod-toolbar-right'>
					<button
						type='button'
						className='gz-prod-btn-icon-export'
						onClick={downloadExcel}
						disabled={loading || orderData.length === 0}
						title='Export Orders to Excel'>
						<FontAwesomeIcon icon={faDownload} />
					</button>
				</div>
			</div>

			{/* =========================================================================
			    ORDERS TABLE
			    ========================================================================= */}
			<div className='gz-prod-table-card'>
				<div className='table-responsive'>
					<table className='gz-prod-table'>
						<thead>
							<tr>
								<th style={{ width: '48px', textAlign: 'center' }}>#</th>
								<th>Customer</th>
								<th>Receipt ID</th>
								<th>Gateway Order ID</th>
								<th>Item Name &amp; Qty</th>
								<th>Item Type</th>
								<th>Amount</th>
								<th>Paid Amount</th>
								<th>Created At</th>
								<th style={{ textAlign: 'center' }}>Status</th>
								<th style={{ textAlign: 'center', width: '80px' }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 5 }).map((_, sIdx) => (
									<tr key={`skel-${sIdx}`} className='gz-prod-skeleton-row'>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-prod-skeleton' style={{ width: '18px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<div className='gz-prod-identity-cell'>
												<span className='gz-prod-skeleton' style={{ width: '40px', height: '40px', borderRadius: '10px' }}></span>
												<div className='d-flex flex-column gap-1'>
													<span className='gz-prod-skeleton' style={{ width: '110px', height: '15px', borderRadius: '4px' }}></span>
													<span className='gz-prod-skeleton' style={{ width: '80px', height: '12px', borderRadius: '4px' }}></span>
												</div>
											</div>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '70px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '90px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '130px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '80px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '65px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '65px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '85px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-prod-skeleton' style={{ width: '65px', height: '22px', borderRadius: '999px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-prod-skeleton' style={{ width: '34px', height: '34px', borderRadius: '10px' }}></span>
										</td>
									</tr>
								))
							) : orderData.length === 0 ? (
								<tr>
									<td colSpan={11} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap'>
											<div className='gz-prod-empty-icon'>
												<FontAwesomeIcon icon={faBoxOpen} />
											</div>
											<h4 className='gz-empty-state-title'>No orders found</h4>
											<p className='gz-empty-state-desc'>
												{searchTerm || formData.itemType?.length > 0 || formData.order_status !== 'ALL'
													? 'No orders matched your filter criteria.'
													: 'Orders placed by customers will appear here.'}
											</p>
										</div>
									</td>
								</tr>
							) : (
								orderData.map((order: any, index: number) => {
									const actualIndex = currentStart + index
									const itemType =
										order?.order_item_type === 'CART'
											? String(order?.productData?.[0]?.type || 'Cart')
													.split('_')
													.join(' ')
											: String(order?.order_item_type || '-')
													.split('_')
													.join(' ')

									const userInitials = `${(order?.user_info?.first_name || '').charAt(0)}${(order?.user_info?.last_name || '').charAt(0)}`.toUpperCase() || 'U'

									const paidAmount = !isNaN(order?.payment_breakdowns?.paid_amount)
										? order.payment_breakdowns.paid_amount
										: order.amount

									return (
										<tr key={order._id || index}>
											<td style={{ textAlign: 'center', color: '#71809A', fontSize: '12.5px' }}>
												{actualIndex}
											</td>
											<td>
												<div className='gz-prod-identity-cell'>
													<div className='gz-order-item-thumb' style={{ width: '40px', height: '40px' }}>
														{order?.user_info?.profile_image ? (
															<img
																src={`https://files.fggroup.in/${order.user_info.profile_image}`}
																alt='User'
																onError={(e) => {
																	;(e.target as HTMLElement).style.display = 'none'
																}}
															/>
														) : (
															<span style={{ fontWeight: 700, fontSize: '13px', color: '#172B4D' }}>
																{userInitials}
															</span>
														)}
													</div>
													<div className='gz-prod-identity-info'>
														<span className='gz-prod-name'>
															{`${order?.user_info?.first_name || '-'} ${order?.user_info?.last_name || ''}`.trim() || 'Customer'}
														</span>
														<span className='gz-prod-subtext'>
															{order?.user_info?.mobile || 'N/A'}
														</span>
													</div>
												</div>
											</td>
											<td>
												<span className='font-monospace' style={{ color: '#172B4D', fontWeight: 600, fontSize: '13px' }}>
													{order.receipt_id || 'N/A'}
												</span>
											</td>
											<td>
												<span className='font-monospace' style={{ color: '#71809A', fontSize: '12.5px' }}>
													{order.gateway_order_id || 'N/A'}
												</span>
											</td>
											<td>
												<div style={{ maxWidth: '240px', color: '#172B4D', fontSize: '13px', fontWeight: 500 }}>
													{order?.productData?.length > 0 ? (
														<div className='d-flex flex-column gap-1'>
															{order.productData.slice(0, 2).map((prod: any, pIdx: number) => (
																<span key={pIdx}>
																	{prod?.name} <span className='text-muted'>(×{prod?.quantity})</span>
																</span>
															))}
															{order.productData.length > 2 && (
																<span className='text-muted fs-8'>
																	+{order.productData.length - 2} more items
																</span>
															)}
														</div>
													) : order?.order_item_type === 'FG_MEAL_PRODUCT' ? (
														`${order?.product?.name || 'Meal Product'} (×${order?.notes?.quantity || 1})`
													) : order?.order_item_type === 'FITNESS_COURSE' ? (
														order?.fitness_course?.course_name || 'Fitness Course'
													) : order?.order_item_type === 'BOOKS' ? (
														`${order?.books?.book_title || 'Book'} (×${order?.notes?.quantity || 1})`
													) : order?.order_item_type === 'EBOOKS' ? (
														`${order?.ebook?.ebook_title || 'Ebook'} (×${order?.notes?.quantity || 1})`
													) : order?.order_item_type === 'PT_PLAN' ? (
														order?.fitness_plan?.plan_name || 'PT Plan'
													) : (
														order?.fitness_course?.course_name || '-'
													)}
												</div>
											</td>
											<td>
												<span className='badge bg-light text-dark fw-semibold'>
													{itemType}
												</span>
											</td>
											<td style={{ fontWeight: 600, color: '#172B4D', fontVariantNumeric: 'tabular-nums' }}>
												₹{Number(order.amount || 0).toLocaleString('en-IN')}
											</td>
											<td style={{ fontWeight: 600, color: '#168064', fontVariantNumeric: 'tabular-nums' }}>
												₹{Number(paidAmount || 0).toLocaleString('en-IN')}
											</td>
											<td style={{ color: '#71809A', fontSize: '12.5px' }}>
												{DayJS(order.createdAt).format('DD/MM/YYYY, hh:mm A')}
											</td>
											<td style={{ textAlign: 'center' }}>
												{renderStatusBadge(order.status)}
											</td>
											<td style={{ textAlign: 'center' }}>
												<Link
													to={`${viewBasePath}?order_id=${order._id}`}
													className='gz-prod-action-btn view'
													title='View Order Details'>
													<FontAwesomeIcon icon={faEye} />
												</Link>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{orderData.length > 0 && (
					<GomziTablePagination
						totalRecords={totalItems}
						page={pagination.page}
						totalPages={totalPages}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
						entityName='orders'
					/>
				)}
			</div>
		</div>
	)
}

export default AllOrder
