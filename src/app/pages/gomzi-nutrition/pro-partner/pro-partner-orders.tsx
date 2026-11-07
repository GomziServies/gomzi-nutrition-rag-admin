/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faAward,
	faCalendarAlt,
	faCheckCircle,
	faDownload,
	faFileExcel,
	faHandHoldingUsd,
	faInfoCircle,
	faLink,
	faPercent,
	faReceipt,
	faShoppingBag,
	faStore,
	faTag,
	faUser,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import { useProPartnerData } from './useProPartnerData'
import './pro-partner-coupons.css'

const ProPartnerOrders: React.FC = () => {
	const [searchParams] = useSearchParams()
	const partnerIdParam = searchParams.get('partner_id')

	const {
		loading,
		coupons,
		orders,
		primaryCoupon,
		metrics,
	} = useProPartnerData(partnerIdParam)

	const [searchTerm, setSearchTerm] = useState('')
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [exporting, setExporting] = useState(false)

	// Enforce pure white canvas
	useEffect(() => {
		const applyWhiteCanvas = () => {
			const ids = ['kt_wrapper', 'kt_content', 'kt_post', 'kt_content_container']
			ids.forEach((id) => {
				const el = document.getElementById(id)
				if (el) {
					el.style.backgroundColor = '#FFFFFF'
					el.style.background = '#FFFFFF'
				}
			})
		}
		applyWhiteCanvas()
		const timer = setTimeout(applyWhiteCanvas, 200)
		return () => clearTimeout(timer)
	}, [])

	// Filter orders
	const filteredOrders = useMemo(() => {
		if (!searchTerm.trim()) return orders

		const term = searchTerm.toLowerCase().trim()
		return orders.filter((o) => {
			return (
				o.customerName.toLowerCase().includes(term) ||
				o.customerMobile.includes(term) ||
				o.receiptId.toLowerCase().includes(term) ||
				o.orderId.toLowerCase().includes(term) ||
				o.productName.toLowerCase().includes(term) ||
				o.couponCode.toLowerCase().includes(term)
			)
		})
	}, [orders, searchTerm])

	// Paginated
	const paginatedOrders = useMemo(() => {
		const start = (pagination.page - 1) * pagination.itemsPerPage
		return filteredOrders.slice(start, start + pagination.itemsPerPage)
	}, [filteredOrders, pagination])

	// Export Excel
	const exportToExcel = () => {
		setExporting(true)
		try {
			const rows = filteredOrders.map((ord, idx) => ({
				'#': idx + 1,
				'Order Date': DayJS(ord.creditTime).format('DD/MM/YYYY hh:mm A'),
				'Receipt ID': ord.receiptId,
				'Order ID': ord.orderId,
				'Coupon Code': ord.couponCode,
				'Customer Name': ord.customerName,
				'Customer Contact': ord.customerMobile,
				'Product Name': ord.productName,
				Category: ord.productCategory,
				Quantity: ord.quantity,
				'Retail Value (₹)': ord.orderAmount,
				'Discount Applied (₹)': ord.discountAmount,
				'Net Paid (₹)': ord.paidAmount,
				'Commission Credited (₹)': ord.commissionAmount,
				Status: ord.orderStatus,
			}))

			const worksheet = XLSX.utils.json_to_sheet(rows)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Referred Orders')
			XLSX.writeFile(
				workbook,
				`RAG_Pro_Partner_Orders_${DayJS().format('YYYY-MM-DD')}.xlsx`
			)
			toast.success('Referred orders exported to Excel!')
		} catch (error) {
			console.error('Export error:', error)
			toast.error('Failed to export orders')
		} finally {
			setExporting(false)
		}
	}

	return (
		<div className='gz-pro-partner-coupons-wrapper'>
			<PageTitle breadcrumbs={[]}>Referred Order History</PageTitle>

			{/* =========================================================================
			    1. HEADER CARD
			    ========================================================================= */}
			<div className='gz-partner-header-card'>
				<div className='gz-partner-header-left'>
					<div className='gz-partner-portal-logo-icon'>
						<FontAwesomeIcon icon={faShoppingBag} />
					</div>
					<div>
						<div className='d-flex align-items-center flex-wrap'>
							<h1 className='gz-partner-portal-title'>
								Referred Orders &amp; Customer History
							</h1>
							<span className='gz-partner-status-pill approved'>
								<FontAwesomeIcon icon={faCheckCircle} />
								<span>Live Checkout Log</span>
							</span>
						</div>
						<p className='gz-partner-portal-subtitle'>
							Complete breakdown of customer purchases placed using your exclusive Pro Partner discount code.
						</p>
					</div>
				</div>

				<div className='gz-partner-header-right'>
					<Link to='/rag/pro-partner/coupons' className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faTag} />
						<span>My Coupons</span>
					</Link>

					<Link to='/rag/pro-partner/commissions' className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faHandHoldingUsd} />
						<span>Commissions</span>
					</Link>

					<button
						type='button'
						onClick={exportToExcel}
						disabled={filteredOrders.length === 0 || exporting}
						className='gz-btn-brown'>
						<FontAwesomeIcon icon={faFileExcel} />
						<span>Export Orders</span>
					</button>
				</div>
			</div>

			{/* =========================================================================
			    2. 4 SIMPLE CLEAN KPI CARDS (NO COLORED TOP STRIPE)
			    ========================================================================= */}
			<div className='row g-3 mb-4'>
				<div className='col-sm-6 col-xl-3'>
					<div className='gz-kpi-card h-100'>
						<div className='gz-kpi-top'>
							<span className='gz-kpi-label'>Total Orders Referred</span>
							<div className='gz-kpi-icon'>
								<FontAwesomeIcon icon={faShoppingBag} />
							</div>
						</div>
						<div className='gz-kpi-value'>{metrics.totalOrders}</div>
						<div className='gz-kpi-desc'>Orders placed by referred clients</div>
					</div>
				</div>

				<div className='col-sm-6 col-xl-3'>
					<div className='gz-kpi-card h-100'>
						<div className='gz-kpi-top'>
							<span className='gz-kpi-label'>Gross Order Value</span>
							<div className='gz-kpi-icon'>
								<FontAwesomeIcon icon={faReceipt} />
							</div>
						</div>
						<div className='gz-kpi-value'>₹{metrics.totalOriginal.toLocaleString('en-IN')}</div>
						<div className='gz-kpi-desc'>Retail catalog value of purchases</div>
					</div>
				</div>

				<div className='col-sm-6 col-xl-3'>
					<div className='gz-kpi-card h-100'>
						<div className='gz-kpi-top'>
							<span className='gz-kpi-label'>Net Client Paid</span>
							<div className='gz-kpi-icon'>
								<FontAwesomeIcon icon={faHandHoldingUsd} />
							</div>
						</div>
						<div className='gz-kpi-value'>₹{metrics.totalRevenue.toLocaleString('en-IN')}</div>
						<div className='gz-kpi-desc'>Actual revenue collected post-discount</div>
					</div>
				</div>

				<div className='col-sm-6 col-xl-3'>
					<div className='gz-kpi-card h-100'>
						<div className='gz-kpi-top'>
							<span className='gz-kpi-label'>Average Order Value</span>
							<div className='gz-kpi-icon'>
								<FontAwesomeIcon icon={faPercent} />
							</div>
						</div>
						<div className='gz-kpi-value'>₹{metrics.avgOrderValue.toLocaleString('en-IN')}</div>
						<div className='gz-kpi-desc'>Mean cart size per referral checkout</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    3. REFERRED ORDERS TABLE
			    ========================================================================= */}
			<div className='gz-table-card'>
				{/* Search Toolbar */}
				<div className='p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3' style={{ background: '#FAF6F2' }}>
					<div className='d-flex align-items-center gap-2 flex-grow-1' style={{ maxWidth: '420px' }}>
						<div className='gz-search-bar-box w-100' style={{ height: '38px' }}>
							<i className='bi bi-search' style={{ fontSize: '13px' }}></i>
							<input
								type='text'
								className='gz-search-bar-input'
								placeholder='Search orders by client name, mobile, receipt ID, product...'
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}
								style={{
									border: 'none',
									outline: 'none',
									background: 'transparent',
									boxShadow: 'none',
									width: '100%',
									height: '100%',
									padding: '0 4px',
									fontSize: '12.5px',
								}}
							/>
						</div>
					</div>

					<div className='d-flex align-items-center gap-3'>
						<div className='d-flex align-items-center gap-1.5'>
							<span className='fs-8 fw-bold text-muted'>Show:</span>
							<select
								className='gz-select'
								style={{ width: '65px', height: '38px', paddingRight: '18px' }}
								value={pagination.itemsPerPage}
								onChange={(e) =>
									setPagination((prev) => ({ ...prev, itemsPerPage: Number(e.target.value), page: 1 }))
								}>
								<option value='10'>10</option>
								<option value='25'>25</option>
								<option value='50'>50</option>
							</select>
						</div>

						<span className='fs-8 fw-semibold text-muted'>
							Showing {paginatedOrders.length} of {filteredOrders.length} orders
						</span>
					</div>
				</div>

				{/* Table */}
				<div className='table-responsive'>
					<table className='gz-table w-100 mb-0'>
						<thead>
							<tr>
								<th style={{ width: '40px' }}>#</th>
								<th>Date &amp; Time</th>
								<th>Receipt ID</th>
								<th>Client Details</th>
								<th>Product Purchased</th>
								<th>Original Price</th>
								<th>Coupon Discount</th>
								<th>Discounted Paid</th>
								<th style={{ color: '#78350F' }}>Partner Commission</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<tr key={`skel-ord-${i}`}>
										<td colSpan={10} className='py-4 ps-4'>
											<div className='bg-light rounded' style={{ width: '100%', height: '24px' }} />
										</td>
									</tr>
								))
							) : paginatedOrders.length === 0 ? (
								<tr>
									<td colSpan={10} className='text-center py-5'>
										<div className='d-flex flex-column align-items-center justify-content-center py-4'>
											<div
												className='mb-2 d-flex align-items-center justify-content-center'
												style={{
													width: '48px',
													height: '48px',
													borderRadius: '10px',
													background: '#FAF6F2',
													color: '#78350F',
													fontSize: '20px',
												}}>
												<FontAwesomeIcon icon={faShoppingBag} />
											</div>
											<span className='fw-bold fs-6' style={{ color: '#261E1A' }}>
												No Orders Placed With Your Coupon Yet
											</span>
											<span className='fs-8 text-muted mt-1'>
												Share your referral link with clients. Their checkout details and your credited commission will appear here automatically.
											</span>
										</div>
									</td>
								</tr>
							) : (
								paginatedOrders.map((ord, idx) => {
									const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + idx + 1
									return (
										<tr key={ord.id || idx}>
											<td style={{ color: '#82756E', fontWeight: 600 }}>{actualIndex}</td>

											{/* Purchase Date */}
											<td>
												<div className='d-flex flex-column'>
													<span className='fw-bold fs-7' style={{ color: '#261E1A' }}>
														{DayJS(ord.creditTime).format('DD MMM YYYY')}
													</span>
													<span className='text-muted fs-8'>
														{DayJS(ord.creditTime).format('hh:mm A')}
													</span>
												</div>
											</td>

											{/* Receipt ID */}
											<td>
												<span className='badge font-monospace fs-8' style={{ background: '#FAF6F2', color: '#78350F', border: '1px solid #EFE4DC' }}>
													{ord.receiptId}
												</span>
											</td>

											{/* Client Details */}
											<td>
												<div>
													<div className='fw-bold fs-7' style={{ color: '#261E1A' }}>
														{ord.customerName}
													</div>
													<div className='text-muted fs-8'>{ord.customerMobile}</div>
												</div>
											</td>

											{/* Product Purchased */}
											<td>
												<div className='d-flex align-items-center gap-2'>
													{ord.productImage ? (
														<img
															src={ord.productImage}
															alt={ord.productName}
															style={{
																width: '32px',
																height: '32px',
																borderRadius: '6px',
																objectFit: 'cover',
																border: '1px solid #EFE4DC',
															}}
														/>
													) : (
														<div
															style={{
																width: '32px',
																height: '32px',
																borderRadius: '6px',
																background: '#FAF6F2',
																color: '#78350F',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																fontSize: '12px',
																border: '1px solid #EFE4DC',
															}}>
															<FontAwesomeIcon icon={faShoppingBag} />
														</div>
													)}
													<div>
														<div className='fw-bold fs-7 text-truncate' style={{ color: '#261E1A', maxWidth: '200px' }} title={ord.productName}>
															{ord.productName}
														</div>
														<div className='text-muted fs-8'>
															Qty: {ord.quantity} • {ord.productCategory}
														</div>
													</div>
												</div>
											</td>

											{/* Original Value */}
											<td>
												<span className='fw-bold fs-7' style={{ color: '#261E1A' }}>
													₹{ord.orderAmount.toLocaleString('en-IN')}
												</span>
											</td>

											{/* Discount */}
											<td>
												<span className='fs-8 fw-semibold text-danger'>
													-₹{ord.discountAmount.toLocaleString('en-IN')} ({ord.discountPercent}%)
												</span>
											</td>

											{/* Net Paid */}
											<td>
												<span className='fw-bold fs-7' style={{ color: '#261E1A' }}>
													₹{ord.paidAmount.toLocaleString('en-IN')}
												</span>
											</td>

											{/* Commission */}
											<td>
												<div
													className='px-2 py-1 rounded-2 d-inline-block fw-bold'
													style={{ background: '#FAF6F2', color: '#78350F', border: '1px solid #EFE4DC', fontSize: '13px' }}>
													+₹{ord.commissionAmount.toLocaleString('en-IN')}
												</div>
											</td>

											{/* Status */}
											<td>
												<span
													className='badge'
													style={{
														background: '#ECFDF5',
														color: '#047857',
														border: '1px solid #A7F3D0',
														fontWeight: 700,
														fontSize: '11px',
														padding: '4px 8px',
													}}>
													{ord.orderStatus}
												</span>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className='p-3 border-top d-flex justify-content-end' style={{ background: '#FAF6F2' }}>
					<UsersListPagination
						totalPages={Math.ceil(filteredOrders.length / pagination.itemsPerPage) || 1}
						currentPage={pagination.page}
						onPageChange={(page: number) => setPagination((prev) => ({ ...prev, page }))}
					/>
				</div>
			</div>
		</div>
	)
}

export default ProPartnerOrders

