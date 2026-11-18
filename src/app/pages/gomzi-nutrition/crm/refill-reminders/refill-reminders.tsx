import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faRepeat,
	faPhone,
	faFileExcel,
	faSync,
	faCheckCircle,
	faClock,
	faExclamationCircle,
	faBoxOpen,
	faFire,
	faEye,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import SearchFilter from '../../../../components/SearchFilter'
import GomziTablePagination from '../../../../components/GomziTablePagination'
import { GetOrders } from '../../../../Functions/FGGroup'
import toast from 'react-hot-toast'
import '../crm-theme.css'
import { cleanWhatsAppNumber } from '../crm-utils'

export const RefillReminders: React.FC = () => {
	const [orders, setOrders] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<'due' | 'overdue' | 'all'>('due')
	const [page, setPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(25)

	// Fetch successful completed orders from past 120 days
	const fetchCompletedOrders = async () => {
		setLoading(true)
		try {
			const res = await GetOrders({
				item_type: ['FG_MEAL_PRODUCT', 'PURE_GO_MEAL_PRODUCT'],
				order_status: 'SUCCESS',
				from_date: DayJS().subtract(120, 'days').format('YYYY-MM-DD'),
				to_date: DayJS().format('YYYY-MM-DD'),
				limit: 1500,
				sort: 'createdAt',
				sortOrder: 'desc',
			})

			const rawList = res?.data || []
			// Enrich with days elapsed and refill status
			const enriched = rawList.map((order: any) => {
				const orderDate = DayJS(order.createdAt)
				const daysElapsed = DayJS().diff(orderDate, 'days')

				let refillStatus = 'recent'
				if (daysElapsed >= 25 && daysElapsed <= 45) {
					refillStatus = 'due'
				} else if (daysElapsed > 45) {
					refillStatus = 'overdue'
				}

				return {
					...order,
					daysElapsed,
					refillStatus,
				}
			})

			setOrders(enriched)
		} catch (err) {
			console.error('Failed to load completed orders for refill:', err)
			toast.error('Failed to fetch refill reminders')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchCompletedOrders()
	}, [])

	// Filter by refill status and search
	const filteredList = useMemo(() => {
		let list = orders
		if (statusFilter !== 'all') {
			list = list.filter((o) => o.refillStatus === statusFilter)
		}

		if (searchTerm && searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim()
			list = list.filter((order) => {
				const u = order.user_info
				const name = `${u?.first_name || ''} ${u?.last_name || ''}`.toLowerCase()
				const phone = (u?.mobile || '').toString()
				const email = (u?.email || '').toLowerCase()
				const product = (order.product?.name || '').toLowerCase()
				return name.includes(term) || phone.includes(term) || email.includes(term) || product.includes(term)
			})
		}

		return list
	}, [orders, statusFilter, searchTerm])

	// Paginated
	const paginatedList = useMemo(() => {
		const start = (page - 1) * itemsPerPage
		return filteredList.slice(start, start + itemsPerPage)
	}, [filteredList, page, itemsPerPage])

	// Key Metrics
	const metrics = useMemo(() => {
		const dueCount = orders.filter((o) => o.refillStatus === 'due').length
		const overdueCount = orders.filter((o) => o.refillStatus === 'overdue').length
		const potentialRevenue = orders
			.filter((o) => o.refillStatus === 'due' || o.refillStatus === 'overdue')
			.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
		return { dueCount, overdueCount, potentialRevenue, total: orders.length }
	}, [orders])

	// WhatsApp 1-Click Reminder directly to the customer's phone
	const getWhatsAppRefillUrl = (order: any) => {
		const u = order.user_info
		const phone = cleanWhatsAppNumber(u?.mobile)
		if (!phone) return ''

		const name = u?.first_name || 'Fitness Champion'
		const productName = order.product?.name || 'your supplement'
		const days = order.daysElapsed || 30

		const text = `Hi ${name}! 👋\n\nIt's been ${days} days since your order of ${productName} from RAG Nutrition.\n\nYour supplement tub is likely running low right about now! 💪 Don't let your workout momentum pause — refill your stack today.\n\n🎁 Enjoy an exclusive 5% refill discount with code: REFILL5\n👉 Order your refill: https://www.ragnutrition.in\n\nLet us know if you need any assistance or stack recommendations!`

		return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
	}

	// Export Excel
	const downloadExcel = () => {
		const rows = filteredList.map((order, idx) => {
			const u = order.user_info
			return {
				'#': idx + 1,
				'Customer Name': u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Customer',
				Phone: u?.mobile || 'N/A',
				Email: u?.email || 'N/A',
				Product: order.product?.name || 'N/A',
				'Order Amount (₹)': order.amount || 0,
				'Last Ordered Date': DayJS(order.createdAt).format('DD/MM/YYYY'),
				'Days Elapsed': order.daysElapsed,
				'Refill Status':
					order.refillStatus === 'due'
						? 'Due Now (25-45 Days)'
						: order.refillStatus === 'overdue'
						? 'Overdue (>45 Days)'
						: 'Recent (<25 Days)',
			}
		})

		const ws = XLSX.utils.json_to_sheet(rows)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Refill_Reminders')
		XLSX.writeFile(wb, `RAG_Refill_Reminders_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	return (
		<div className='crm-container'>
			<PageTitle breadcrumbs={[]}>Repeat Refill Reminders</PageTitle>

			{/* Breadcrumb */}
			<div className='crm-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/crm/leads'>CRM & Leads</Link>
				<span className='sep'>/</span>
				<span className='current'>Refill Reminders</span>
			</div>

			{/* Header */}
			<div className='crm-header'>
				<div>
					<h1 className='crm-title'>
						<FontAwesomeIcon icon={faRepeat} style={{ color: '#059669' }} />
						Repeat Supplement Refill Reminders
					</h1>
					<p className='crm-subtitle'>
						Retain recurring buyers by reminding customers whose 30/45-day supplement supply is running low.
					</p>
				</div>
				<div className='crm-actions'>
					<button className='crm-btn-secondary' onClick={downloadExcel} title='Download Excel'>
						<FontAwesomeIcon icon={faFileExcel} style={{ color: '#107C41' }} />
						Export Excel
					</button>
					<button className='crm-btn-secondary' onClick={fetchCompletedOrders} title='Refresh Data'>
						<FontAwesomeIcon icon={faSync} />
						Refresh
					</button>
				</div>
			</div>

			{/* Metrics */}
			<div className='crm-metrics-grid'>
				<div className='crm-stat-card'>
					<div className='crm-stat-icon amber'>
						<FontAwesomeIcon icon={faClock} />
					</div>
					<div>
						<div className='crm-stat-value'>{metrics.dueCount}</div>
						<div className='crm-stat-label'>Due for Refill (25–45 Days)</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon red'>
						<FontAwesomeIcon icon={faExclamationCircle} />
					</div>
					<div>
						<div className='crm-stat-value'>{metrics.overdueCount}</div>
						<div className='crm-stat-label'>Overdue (&gt;45 Days)</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon green'>
						<FontAwesomeIcon icon={faRepeat} />
					</div>
					<div>
						<div className='crm-stat-value'>₹{metrics.potentialRevenue.toLocaleString('en-IN')}</div>
						<div className='crm-stat-label'>Potential Reorder Revenue</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon blue'>
						<FontAwesomeIcon icon={faBoxOpen} />
					</div>
					<div>
						<div className='crm-stat-value'>{metrics.total}</div>
						<div className='crm-stat-label'>Active Customer Tubs</div>
					</div>
				</div>
			</div>

			{/* Refill Filter Tabs */}
			<div className='crm-stage-tabs'>
				<button
					className={`crm-stage-tab ${statusFilter === 'due' ? 'active' : ''}`}
					onClick={() => {
						setStatusFilter('due')
						setPage(1)
					}}>
					<span>Due for Refill Now (25–45 Days)</span>
					<span className='badge'>{metrics.dueCount}</span>
				</button>
				<button
					className={`crm-stage-tab ${statusFilter === 'overdue' ? 'active' : ''}`}
					onClick={() => {
						setStatusFilter('overdue')
						setPage(1)
					}}>
					<span>Overdue / Tub Finished (&gt;45 Days)</span>
					<span className='badge'>{metrics.overdueCount}</span>
				</button>
				<button
					className={`crm-stage-tab ${statusFilter === 'all' ? 'active' : ''}`}
					onClick={() => {
						setStatusFilter('all')
						setPage(1)
					}}>
					<span>All Delivered Customers</span>
					<span className='badge'>{metrics.total}</span>
				</button>
			</div>

			{/* Search */}
			<div className='crm-filters-card'>
				<div className='crm-filters-left'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						placeholder='Search by customer, phone, product...'
					/>
				</div>
			</div>

			{/* Table Card */}
			<div className='crm-table-card'>
				<div className='crm-table-container'>
					<table className='crm-table'>
						<thead>
							<tr>
								<th>#</th>
								<th>Customer</th>
								<th>Last Purchased Product</th>
								<th>Order Value</th>
								<th>Purchased On</th>
								<th>Days Elapsed</th>
								<th>Refill Status</th>
								<th style={{ textAlign: 'center' }}>Send Refill Reminder</th>
								<th style={{ textAlign: 'center' }}>Order</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
										<div className='spinner-border spinner-border-sm text-primary me-2' role='status' />
										Loading repeat refill orders...
									</td>
								</tr>
							) : paginatedList.length === 0 ? (
								<tr>
									<td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
										<FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '32px', color: '#10B981', marginBottom: '12px' }} />
										<div style={{ fontWeight: 600, color: '#1E293B' }}>No refill reminders needed</div>
										<p style={{ fontSize: '13px', margin: '4px 0 0' }}>
											No customers match this refill cycle timeframe.
										</p>
									</td>
								</tr>
							) : (
								paginatedList.map((item: any, idx: number) => {
									const actualIndex = (page - 1) * itemsPerPage + idx + 1
									const u = item.user_info
									const fullName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Customer'
									const customerPhone = cleanWhatsAppNumber(u?.mobile)
									const displayPhone = u?.mobile || ''
									const waUrl = customerPhone ? getWhatsAppRefillUrl(item) : ''
									const initials = fullName
										.split(' ')
										.map((n: string) => n.charAt(0).toUpperCase())
										.slice(0, 2)
										.join('') || 'C'

									return (
										<tr key={item._id || idx}>
											<td>
												<span style={{ fontWeight: 600, color: '#94A3B8', fontSize: '12.5px' }}>
													{actualIndex}
												</span>
											</td>

											{/* Customer */}
											<td>
												<div className='crm-user-cell'>
													<div className='crm-user-avatar' style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
														{initials}
													</div>
													<div>
														<div className='crm-user-name'>{fullName}</div>
														<div className='crm-user-sub'>{displayPhone || 'No mobile'}</div>
														{u?.email && <div style={{ fontSize: '11.5px', color: '#64748B' }}>{u.email}</div>}
													</div>
												</div>
											</td>

											{/* Product */}
											<td>
												<div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
													{item.product?.name || 'RAG Nutrition Product'}
												</div>
												<div style={{ fontSize: '11.5px', color: '#64748B' }}>
													{item.receipt_id || ''}
												</div>
											</td>

											{/* Value */}
											<td>
												<span style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>
													₹{Number(item.amount || 0).toLocaleString('en-IN')}
												</span>
											</td>

											{/* Purchase Date */}
											<td>
												<div style={{ fontSize: '13px', color: '#334155' }}>
													{DayJS(item.createdAt).format('DD MMM YYYY')}
												</div>
											</td>

											{/* Days Elapsed */}
											<td>
												<span style={{ fontWeight: 700, fontSize: '14px', color: item.daysElapsed > 45 ? '#DC2626' : '#D97706' }}>
													{item.daysElapsed} days ago
												</span>
											</td>

											{/* Status Badge */}
											<td>
												{item.refillStatus === 'due' ? (
													<span className='crm-stage-pill follow-up'>
														🟡 Refill Due Now
													</span>
												) : item.refillStatus === 'overdue' ? (
													<span className='crm-stage-pill lost'>
														🔴 Tub Finished / Overdue
													</span>
												) : (
													<span className='crm-stage-pill order-confirm'>
														🟢 Active Tub
													</span>
												)}
											</td>

											{/* WhatsApp Reminder Button */}
											<td style={{ textAlign: 'center' }}>
												<div className='crm-action-group' style={{ justifyContent: 'center' }}>
													{customerPhone ? (
														<>
															<a
																href={waUrl}
																target='_blank'
																rel='noopener noreferrer'
																className='crm-btn-wa'
																title={`Open WhatsApp Refill Offer for ${fullName} (${customerPhone})`}>
																<FontAwesomeIcon icon={faWhatsapp} />
																Send Refill Offer
															</a>
															<a href={`tel:${customerPhone}`} className='crm-btn-call' title={`Call Customer: ${customerPhone}`}>
																<FontAwesomeIcon icon={faPhone} />
															</a>
														</>
													) : (
														<span style={{ color: '#CBD5E1', fontSize: '12px' }}>No Phone</span>
													)}
												</div>
											</td>

											{/* View Order */}
											<td style={{ textAlign: 'center' }}>
												<Link
													to={`/rag/product-order-view?order_id=${item._id}`}
													className='crm-btn-icon'
													title='View Order'>
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
				<div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
					<div style={{ fontSize: '13px', color: '#64748B' }}>
						Showing {paginatedList.length} of {filteredList.length} refill opportunities
					</div>
					<GomziTablePagination
						totalCount={filteredList.length}
						currentPage={page}
						pageSize={itemsPerPage}
						onPageChange={(p: number) => setPage(p)}
					/>
				</div>
			</div>
		</div>
	)
}

export default RefillReminders
