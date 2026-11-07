/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faAward,
	faBank,
	faCalendarAlt,
	faCheckCircle,
	faDownload,
	faFileExcel,
	faHandHoldingUsd,
	faInfoCircle,
	faReceipt,
	faShoppingBag,
	faTag,
	faUser,
	faWallet,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import { useProPartnerData } from './useProPartnerData'
import './pro-partner-coupons.css'

const ProPartnerCommissions: React.FC = () => {
	const [searchParams] = useSearchParams()
	const partnerIdParam = searchParams.get('partner_id')

	const {
		loading,
		coupons,
		orders,
		partnerInfo,
		metrics,
	} = useProPartnerData(partnerIdParam)

	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [exporting, setExporting] = useState(false)

	// Enforce pure white background across parent wrappers
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
	const filteredTransactions = useMemo(() => {
		let list = [...orders]

		if (statusFilter !== 'ALL') {
			list = list.filter((t) => t.commissionStatus === statusFilter)
		}

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim()
			list = list.filter((t) => {
				return (
					t.customerName.toLowerCase().includes(term) ||
					t.customerMobile.includes(term) ||
					t.receiptId.toLowerCase().includes(term) ||
					t.orderId.toLowerCase().includes(term) ||
					t.productName.toLowerCase().includes(term) ||
					t.couponCode.toLowerCase().includes(term)
				)
			})
		}

		return list
	}, [orders, searchTerm, statusFilter])

	// Paginated
	const paginatedList = useMemo(() => {
		const start = (pagination.page - 1) * pagination.itemsPerPage
		return filteredTransactions.slice(start, start + pagination.itemsPerPage)
	}, [filteredTransactions, pagination])

	// Export Excel
	const exportToExcel = () => {
		setExporting(true)
		try {
			const rows = filteredTransactions.map((tx, idx) => ({
				'#': idx + 1,
				'Credit Date': DayJS(tx.creditTime).format('DD/MM/YYYY hh:mm A'),
				'Receipt ID': tx.receiptId,
				'Order ID': tx.orderId,
				'Coupon Code': tx.couponCode,
				'Customer Name': tx.customerName,
				'Customer Contact': tx.customerMobile,
				'Product Purchased': tx.productName,
				Quantity: tx.quantity,
				'Gross Order Amount (₹)': tx.orderAmount,
				'Client Discount (₹)': tx.discountAmount,
				'Net Paid (₹)': tx.paidAmount,
				'Commission Rate': `${tx.commissionRate}%`,
				'Commission Earned (₹)': tx.commissionAmount,
				Status: tx.commissionStatus,
			}))

			const worksheet = XLSX.utils.json_to_sheet(rows)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Commissions Ledger')
			XLSX.writeFile(
				workbook,
				`RAG_Pro_Partner_Commissions_${DayJS().format('YYYY-MM-DD')}.xlsx`
			)
			toast.success('Commissions ledger exported to Excel!')
		} catch (error) {
			console.error('Export error:', error)
			toast.error('Failed to export commissions')
		} finally {
			setExporting(false)
		}
	}

	const bankDetails = partnerInfo?.bankDetails || {}

	return (
		<div className='gz-pro-partner-coupons-wrapper'>
			<PageTitle breadcrumbs={[]}>Commissions & Payouts</PageTitle>

			{/* =========================================================================
			    1. HEADER CARD
			    ========================================================================= */}
			<div className='gz-partner-header-card'>
				<div className='gz-partner-header-left'>
					<div className='gz-partner-portal-logo-icon'>
						<FontAwesomeIcon icon={faHandHoldingUsd} />
					</div>
					<div>
						<div className='d-flex align-items-center flex-wrap'>
							<h1 className='gz-partner-portal-title'>
								Commissions Ledger &amp; Payouts
							</h1>
							<span className='gz-partner-status-pill approved'>
								<FontAwesomeIcon icon={faCheckCircle} />
								<span>10% Standard Rate</span>
							</span>
						</div>
						<p className='gz-partner-portal-subtitle'>
							Track your earnings generated from referral sales, commission disbursement ledger, and bank settlement status.
						</p>
					</div>
				</div>

				<div className='gz-partner-header-right'>
					<Link to='/rag/pro-partner/coupons' className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faTag} />
						<span>My Coupons</span>
					</Link>

					<Link to='/rag/pro-partner/orders' className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faShoppingBag} />
						<span>Order History</span>
					</Link>

					<button
						type='button'
						onClick={exportToExcel}
						disabled={filteredTransactions.length === 0 || exporting}
						className='gz-btn-brown'>
						<FontAwesomeIcon icon={faFileExcel} />
						<span>Export Ledger</span>
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
							<span className='gz-kpi-label'>Total Commission Accrued</span>
							<div className='gz-kpi-icon'>
								<FontAwesomeIcon icon={faWallet} />
							</div>
						</div>
						<div className='gz-kpi-value'>₹{metrics.totalCommission.toLocaleString('en-IN')}</div>
						<div className='gz-kpi-desc'>Gross lifetime earnings from referrals</div>
					</div>
				</div>

				<div className='col-sm-6 col-xl-3'>
					<div className='gz-kpi-card h-100'>
						<div className='gz-kpi-top'>
							<span className='gz-kpi-label'>Available For Payout</span>
							<div className='gz-kpi-icon'>
								<FontAwesomeIcon icon={faHandHoldingUsd} />
							</div>
						</div>
						<div className='gz-kpi-value text-success'>₹{metrics.pendingCommission.toLocaleString('en-IN')}</div>
						<div className='gz-kpi-desc'>Eligible for next settlement cycle</div>
					</div>
				</div>

				<div className='col-sm-6 col-xl-3'>
					<div className='gz-kpi-card h-100'>
						<div className='gz-kpi-top'>
							<span className='gz-kpi-label'>Settled & Disbursed</span>
							<div className='gz-kpi-icon'>
								<FontAwesomeIcon icon={faCheckCircle} />
							</div>
						</div>
						<div className='gz-kpi-value'>₹{metrics.paidCommission.toLocaleString('en-IN')}</div>
						<div className='gz-kpi-desc'>Paid to bank or UPI destination</div>
					</div>
				</div>

				<div className='col-sm-6 col-xl-3'>
					<div className='gz-kpi-card h-100'>
						<div className='gz-kpi-top'>
							<span className='gz-kpi-label'>Referred Orders Basis</span>
							<div className='gz-kpi-icon'>
								<FontAwesomeIcon icon={faReceipt} />
							</div>
						</div>
						<div className='gz-kpi-value'>{metrics.totalOrders}</div>
						<div className='gz-kpi-desc'>Net orders earning commission</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    3. PAYOUT DESTINATION SUMMARY BANNER
			    ========================================================================= */}
			<div className='gz-payout-destination-card'>
				<div className='d-flex align-items-center gap-3'>
					<div
						style={{
							width: '42px',
							height: '42px',
							borderRadius: '10px',
							background: '#78350F',
							color: '#FFFFFF',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '18px',
							boxShadow: '0 2px 6px rgba(120, 53, 15, 0.2)',
							flexShrink: 0,
						}}>
						<FontAwesomeIcon icon={faBank} />
					</div>
					<div>
						<div className='fw-bold fs-6' style={{ color: '#261E1A' }}>
							Commission Payout Destination:
						</div>
						<div className='fs-8 text-muted mt-0.5'>
							{bankDetails.accountNumber ? (
								<>
									Bank: <strong style={{ color: '#261E1A' }}>{bankDetails.bankName || 'Verified Bank'}</strong> • Acc: <strong style={{ color: '#261E1A' }}>••••{String(bankDetails.accountNumber).slice(-4)}</strong> • IFSC: <strong style={{ color: '#261E1A' }}>{bankDetails.ifscCode || 'Verified'}</strong>
								</>
							) : bankDetails.upiId ? (
								<>
									UPI ID: <strong style={{ color: '#261E1A' }}>{bankDetails.upiId}</strong>
								</>
							) : (
								<span className='fw-semibold' style={{ color: '#B45309' }}>
									No payout destination configured yet. Please configure your bank account or UPI ID to receive disbursements.
								</span>
							)}
						</div>
					</div>
				</div>

				<Link
					to='/rag/pro-partner/settings'
					className='gz-btn-brown-outline'
					style={{ padding: '7px 16px', fontSize: '12.5px' }}>
					<FontAwesomeIcon icon={faUser} />
					<span>{bankDetails.accountNumber || bankDetails.upiId ? 'Update Bank / UPI' : 'Configure Payout Details'}</span>
				</Link>
			</div>

			{/* =========================================================================
			    4. COMMISSIONS LEDGER TABLE
			    ========================================================================= */}
			<div className='gz-table-card'>
				{/* Filter & Search Toolbar */}
				<div className='p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3' style={{ background: '#FAF6F2' }}>
					<div className='d-flex align-items-center gap-3 flex-grow-1' style={{ maxWidth: '420px' }}>
						<div className='gz-search-bar-box w-100' style={{ height: '38px' }}>
							<i className='bi bi-search' style={{ fontSize: '13px' }}></i>
							<input
								type='text'
								className='gz-search-bar-input'
								placeholder='Search ledger by client, receipt, order ID, product...'
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

					<div className='d-flex align-items-center gap-2 flex-wrap'>
						<span className='fs-8 text-muted fw-semibold d-none d-sm-inline me-1'>
							{filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}
						</span>

						<select
							className='gz-select'
							style={{ width: '150px', height: '38px' }}
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value)
								setPagination((prev) => ({ ...prev, page: 1 }))
							}}>
							<option value='ALL'>All Statuses</option>
							<option value='CREDITED'>Credited</option>
							<option value='PAID'>Paid Out</option>
							<option value='PENDING'>Pending Verification</option>
						</select>

						<div className='d-flex align-items-center gap-1.5 ms-1'>
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
								<th>Referred Client</th>
								<th>Purchased Product</th>
								<th>Gross Value</th>
								<th>Client Discount</th>
								<th>Net Paid</th>
								<th style={{ color: '#78350F' }}>Commission (10%)</th>
								<th>Payout Status</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<tr key={`skel-comm-${i}`}>
										<td colSpan={10} className='py-4 ps-4'>
											<div className='bg-light rounded' style={{ width: '100%', height: '24px' }} />
										</td>
									</tr>
								))
							) : paginatedList.length === 0 ? (
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
												<FontAwesomeIcon icon={faHandHoldingUsd} />
											</div>
											<span className='fw-bold fs-6' style={{ color: '#261E1A' }}>
												No Commission Entries Found
											</span>
											<span className='fs-8 text-muted mt-1'>
												When clients complete orders with your coupon, credited commissions appear here automatically.
											</span>
										</div>
									</td>
								</tr>
							) : (
								paginatedList.map((tx, idx) => {
									const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + idx + 1
									return (
										<tr key={tx.id || idx}>
											<td style={{ color: '#82756E', fontWeight: 600 }}>{actualIndex}</td>

											{/* Date */}
											<td>
												<div className='d-flex flex-column'>
													<span className='fw-bold fs-7' style={{ color: '#261E1A' }}>
														{DayJS(tx.creditTime).format('DD MMM YYYY')}
													</span>
													<span className='text-muted fs-8'>
														{DayJS(tx.creditTime).format('hh:mm A')}
													</span>
												</div>
											</td>

											{/* Receipt */}
											<td>
												<span className='badge font-monospace fs-8' style={{ background: '#FAF6F2', color: '#78350F', border: '1px solid #EFE4DC' }}>
													{tx.receiptId}
												</span>
											</td>

											{/* Client Details */}
											<td>
												<div>
													<div className='fw-bold fs-7' style={{ color: '#261E1A' }}>
														{tx.customerName}
													</div>
													<div className='text-muted fs-8'>{tx.customerMobile}</div>
												</div>
											</td>

											{/* Product */}
											<td>
												<div className='d-flex align-items-center gap-2'>
													{tx.productImage ? (
														<img
															src={tx.productImage}
															alt={tx.productName}
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
														<div className='fw-bold fs-7 text-truncate' style={{ color: '#261E1A', maxWidth: '200px' }} title={tx.productName}>
															{tx.productName}
														</div>
														<div className='text-muted fs-8'>Qty: {tx.quantity}</div>
													</div>
												</div>
											</td>

											{/* Gross */}
											<td>
												<span className='fw-bold fs-7' style={{ color: '#261E1A' }}>
													₹{tx.orderAmount.toLocaleString('en-IN')}
												</span>
											</td>

											{/* Discount */}
											<td>
												<span className='fs-8 fw-semibold text-danger'>
													-₹{tx.discountAmount.toLocaleString('en-IN')} ({tx.discountPercent}%)
												</span>
											</td>

											{/* Paid */}
											<td>
												<span className='fw-bold fs-7' style={{ color: '#261E1A' }}>
													₹{tx.paidAmount.toLocaleString('en-IN')}
												</span>
											</td>

											{/* Commission Amount */}
											<td>
												<div
													className='px-2 py-1 rounded-2 d-inline-block fw-bold'
													style={{ background: '#FAF6F2', color: '#78350F', border: '1px solid #EFE4DC', fontSize: '13px' }}>
													+₹{tx.commissionAmount.toLocaleString('en-IN')}
												</div>
											</td>

											{/* Status */}
											<td>
												<span
													className='badge'
													style={{
														background: tx.commissionStatus === 'PAID' ? '#ECFDF5' : '#FEF3C7',
														color: tx.commissionStatus === 'PAID' ? '#047857' : '#B45309',
														border: `1px solid ${tx.commissionStatus === 'PAID' ? '#A7F3D0' : '#FDE68A'}`,
														fontWeight: 700,
														fontSize: '11px',
														padding: '4px 8px',
													}}>
													{tx.commissionStatus}
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
						totalPages={Math.ceil(filteredTransactions.length / pagination.itemsPerPage) || 1}
						currentPage={pagination.page}
						onPageChange={(page: number) => setPagination((prev) => ({ ...prev, page }))}
					/>
				</div>
			</div>
		</div>
	)
}

export default ProPartnerCommissions

