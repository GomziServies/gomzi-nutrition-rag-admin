import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faCrown,
	faRepeat,
	faUsers,
	faUserSlash,
	faPhone,
	faFileExcel,
	faSync,
	faIndianRupeeSign,
	faShoppingBag,
	faCalendarAlt,
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

export const CustomerSegments: React.FC = () => {
	const [customers, setCustomers] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [activeSegment, setActiveSegment] = useState<'all' | 'vip' | 'repeat' | 'first' | 'inactive'>('all')
	const [page, setPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(25)

	const fetchCustomerData = async () => {
		setLoading(true)
		try {
			const res = await GetOrders({
				item_type: ['FG_MEAL_PRODUCT', 'PURE_GO_MEAL_PRODUCT'],
				order_status: 'SUCCESS',
				limit: 2500,
				sort: 'createdAt',
				sortOrder: 'desc',
			})

			const rawOrders = res?.data || []
			// Aggregate by customer unique key (phone or email or user_id)
			const custMap: Record<string, any> = {}

			rawOrders.forEach((order: any) => {
				const u = order.user_info
				const key = u?.mobile || u?.email || order.user_id?._id || order._id
				if (!custMap[key]) {
					custMap[key] = {
						id: key,
						name: u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Valued Customer',
						phone: u?.mobile || '',
						email: u?.email || '',
						ordersCount: 0,
						totalSpend: 0,
						firstOrderDate: order.createdAt,
						lastOrderDate: order.createdAt,
						productsPurchased: new Set<string>(),
					}
				}

				const c = custMap[key]
				c.ordersCount += 1
				c.totalSpend += Number(order.amount || 0)
				if (new Date(order.createdAt) < new Date(c.firstOrderDate)) {
					c.firstOrderDate = order.createdAt
				}
				if (new Date(order.createdAt) > new Date(c.lastOrderDate)) {
					c.lastOrderDate = order.createdAt
				}
				if (order.product?.name) {
					c.productsPurchased.add(order.product.name)
				}
			})

			// Compute Segments and Recency
			const customerList = Object.values(custMap).map((c: any) => {
				const daysSinceLastOrder = DayJS().diff(DayJS(c.lastOrderDate), 'days')
				const aov = c.ordersCount > 0 ? Math.round(c.totalSpend / c.ordersCount) : 0

				let segment = 'first'
				if (c.totalSpend >= 10000 || c.ordersCount >= 3) {
					segment = 'vip'
				} else if (c.ordersCount >= 2) {
					segment = 'repeat'
				} else if (daysSinceLastOrder > 60) {
					segment = 'inactive'
				}

				return {
					...c,
					daysSinceLastOrder,
					aov,
					segment,
					productsList: Array.from(c.productsPurchased),
				}
			})

			// Sort by Lifetime Spend descending
			customerList.sort((a, b) => b.totalSpend - a.totalSpend)
			setCustomers(customerList)
		} catch (err) {
			console.error('Failed to load customer segments:', err)
			toast.error('Failed to calculate customer segments')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchCustomerData()
	}, [])

	// Filter by segment and search
	const filteredCustomers = useMemo(() => {
		let list = customers
		if (activeSegment !== 'all') {
			list = list.filter((c) => c.segment === activeSegment)
		}
		if (searchTerm && searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim()
			list = list.filter((c) => {
				return (
					c.name.toLowerCase().includes(term) ||
					c.phone.toLowerCase().includes(term) ||
					c.email.toLowerCase().includes(term)
				)
			})
		}
		return list
	}, [customers, activeSegment, searchTerm])

	// Paginated
	const paginatedCustomers = useMemo(() => {
		const start = (page - 1) * itemsPerPage
		return filteredCustomers.slice(start, start + itemsPerPage)
	}, [filteredCustomers, page, itemsPerPage])

	// Metrics
	const metrics = useMemo(() => {
		const totalCust = customers.length
		const vipCount = customers.filter((c) => c.segment === 'vip').length
		const repeatCount = customers.filter((c) => c.segment === 'repeat').length
		const inactiveCount = customers.filter((c) => c.segment === 'inactive').length
		const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpend, 0)
		const avgLtv = totalCust > 0 ? Math.round(totalRevenue / totalCust) : 0
		return { totalCust, vipCount, repeatCount, inactiveCount, avgLtv }
	}, [customers])

	// WhatsApp Segment Message Generator directly to the customer's phone
	const getSegmentWhatsAppUrl = (cust: any) => {
		const phone = cleanWhatsAppNumber(cust.phone)
		if (!phone) return ''

		const name = cust.name || 'Valued Athlete'

		let message = ''
		if (cust.segment === 'vip') {
			message = `Hi ${name}! 👑\n\nAs one of our top VIP athletes at RAG Nutrition, we want to thank you for your incredible support and dedication to fitness!\n\nTo celebrate you, here is an exclusive VIP reward: use code VIP10 for 10% OFF your next supplement order: https://www.ragnutrition.in\n\nLet us know if you'd like personalized stack advice from our team!`
		} else if (cust.segment === 'inactive') {
			message = `Hi ${name}! 👋\n\nWe noticed it's been a little while since your last workout order at RAG Nutrition.\n\nWe've just restocked fresh batches of our high-quality whey protein, BCAAs, and pre-workouts! 💪\n\nHere is a special welcome-back gift: use code COMEBACK5 for 5% OFF on your next order: https://www.ragnutrition.in\n\nWe'd love to help you reach your next fitness milestone!`
		} else {
			message = `Hi ${name}! 👋\n\nThank you for choosing RAG Nutrition for your fitness and supplement needs!\n\nHow is your workout and nutrition routine going? To show our appreciation, here is an exclusive loyalty code: LOYALTY5 for 5% OFF on your next order: https://www.ragnutrition.in\n\nFeel free to reach out anytime if you need help with your stack!`
		}

		return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
	}

	// Export Excel
	const downloadExcel = () => {
		const rows = filteredCustomers.map((c, idx) => ({
			'#': idx + 1,
			'Customer Name': c.name,
			Phone: c.phone || 'N/A',
			Email: c.email || 'N/A',
			'Lifetime Spend (₹)': c.totalSpend,
			'Total Orders': c.ordersCount,
			'Average Order Value (₹)': c.aov,
			Segment: c.segment.toUpperCase(),
			'Days Since Last Order': c.daysSinceLastOrder,
			'First Purchase Date': DayJS(c.firstOrderDate).format('DD/MM/YYYY'),
			'Latest Purchase Date': DayJS(c.lastOrderDate).format('DD/MM/YYYY'),
		}))

		const ws = XLSX.utils.json_to_sheet(rows)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Customer_LTV')
		XLSX.writeFile(wb, `RAG_Customer_Segmentation_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	return (
		<div className='crm-container'>
			<PageTitle breadcrumbs={[]}>Customer Segmentation & LTV</PageTitle>

			{/* Breadcrumb */}
			<div className='crm-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/crm/leads'>CRM & Leads</Link>
				<span className='sep'>/</span>
				<span className='current'>Customer Segmentation & LTV</span>
			</div>

			{/* Header */}
			<div className='crm-header'>
				<div>
					<h1 className='crm-title'>
						<FontAwesomeIcon icon={faCrown} style={{ color: '#F59E0B' }} />
						Customer Lifetime Value (LTV) & Segmentation
					</h1>
					<p className='crm-subtitle'>
						Identify high-value VIPs, repeat buyers, and re-engage inactive customers with segmented campaigns.
					</p>
				</div>
				<div className='crm-actions'>
					<button className='crm-btn-secondary' onClick={downloadExcel} title='Download Excel'>
						<FontAwesomeIcon icon={faFileExcel} style={{ color: '#107C41' }} />
						Export Excel
					</button>
					<button className='crm-btn-secondary' onClick={fetchCustomerData} title='Refresh Data'>
						<FontAwesomeIcon icon={faSync} />
						Refresh
					</button>
				</div>
			</div>

			{/* Metrics */}
			<div className='crm-metrics-grid'>
				<div className='crm-stat-card'>
					<div className='crm-stat-icon purple'>
						<FontAwesomeIcon icon={faUsers} />
					</div>
					<div>
						<div className='crm-stat-value'>{metrics.totalCust}</div>
						<div className='crm-stat-label'>Total Customer Base</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon green'>
						<FontAwesomeIcon icon={faIndianRupeeSign} />
					</div>
					<div>
						<div className='crm-stat-value'>₹{metrics.avgLtv.toLocaleString('en-IN')}</div>
						<div className='crm-stat-label'>Average Customer LTV</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon amber'>
						<FontAwesomeIcon icon={faCrown} />
					</div>
					<div>
						<div className='crm-stat-value'>{metrics.vipCount}</div>
						<div className='crm-stat-label'>VIP Champions (≥₹10k)</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon red'>
						<FontAwesomeIcon icon={faUserSlash} />
					</div>
					<div>
						<div className='crm-stat-value'>{metrics.inactiveCount}</div>
						<div className='crm-stat-label'>Inactive At-Risk (&gt;60 Days)</div>
					</div>
				</div>
			</div>

			{/* Segment Tabs */}
			<div className='crm-stage-tabs'>
				<button
					className={`crm-stage-tab ${activeSegment === 'all' ? 'active' : ''}`}
					onClick={() => {
						setActiveSegment('all')
						setPage(1)
					}}>
					<span>All Customers</span>
					<span className='badge'>{metrics.totalCust}</span>
				</button>
				<button
					className={`crm-stage-tab ${activeSegment === 'vip' ? 'active' : ''}`}
					onClick={() => {
						setActiveSegment('vip')
						setPage(1)
					}}>
					<span>👑 VIP Champions</span>
					<span className='badge'>{metrics.vipCount}</span>
				</button>
				<button
					className={`crm-stage-tab ${activeSegment === 'repeat' ? 'active' : ''}`}
					onClick={() => {
						setActiveSegment('repeat')
						setPage(1)
					}}>
					<span>🔁 Repeat Buyers</span>
					<span className='badge'>{metrics.repeatCount}</span>
				</button>
				<button
					className={`crm-stage-tab ${activeSegment === 'inactive' ? 'active' : ''}`}
					onClick={() => {
						setActiveSegment('inactive')
						setPage(1)
					}}>
					<span>💤 Inactive / At-Risk</span>
					<span className='badge'>{metrics.inactiveCount}</span>
				</button>
			</div>

			{/* Search */}
			<div className='crm-filters-card'>
				<div className='crm-filters-left'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						placeholder='Search customer by name, mobile, email...'
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
								<th>Customer Details</th>
								<th>Segment</th>
								<th>Lifetime Value (LTV)</th>
								<th>Orders</th>
								<th>Average Order (AOV)</th>
								<th>Last Purchased</th>
								<th style={{ textAlign: 'center' }}>Segment Campaign</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
										<div className='spinner-border spinner-border-sm text-primary me-2' role='status' />
										Calculating customer segments & LTV...
									</td>
								</tr>
							) : paginatedCustomers.length === 0 ? (
								<tr>
									<td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
										<FontAwesomeIcon icon={faUsers} style={{ fontSize: '32px', color: '#CBD5E1', marginBottom: '12px' }} />
										<div style={{ fontWeight: 600, color: '#1E293B' }}>No customers in this segment</div>
										<p style={{ fontSize: '13px', margin: '4px 0 0' }}>Try changing the segment filter above.</p>
									</td>
								</tr>
							) : (
								paginatedCustomers.map((cust: any, idx: number) => {
									const actualIndex = (page - 1) * itemsPerPage + idx + 1
									const customerPhone = cleanWhatsAppNumber(cust.phone)
									const waUrl = customerPhone ? getSegmentWhatsAppUrl(cust) : ''
									const initials = cust.name
										.split(' ')
										.map((n: string) => n.charAt(0).toUpperCase())
										.slice(0, 2)
										.join('') || 'C'

									return (
										<tr key={cust.id || idx}>
											<td>
												<span style={{ fontWeight: 600, color: '#94A3B8', fontSize: '12.5px' }}>
													{actualIndex}
												</span>
											</td>

											{/* Customer Details */}
											<td>
												<div className='crm-user-cell'>
													<div
														className='crm-user-avatar'
														style={{
															background: cust.segment === 'vip' ? '#FEF3C7' : '#F1F5F9',
															color: cust.segment === 'vip' ? '#D97706' : '#2563EB',
															borderColor: cust.segment === 'vip' ? '#FDE68A' : '#E2E8F0',
														}}>
														{initials}
													</div>
													<div>
														<div className='crm-user-name'>{cust.name}</div>
														<div className='crm-user-sub'>{cust.phone || 'No mobile'}</div>
														{cust.email && <div style={{ fontSize: '11.5px', color: '#64748B' }}>{cust.email}</div>}
													</div>
												</div>
											</td>

											{/* Segment Pill */}
											<td>
												{cust.segment === 'vip' ? (
													<span className='crm-stage-pill follow-up' style={{ background: '#FEF3C7', color: '#B45309', borderColor: '#FDE68A' }}>
														👑 VIP Champion
													</span>
												) : cust.segment === 'repeat' ? (
													<span className='crm-stage-pill potential'>
														🔁 Repeat Buyer
													</span>
												) : cust.segment === 'inactive' ? (
													<span className='crm-stage-pill lost'>
														💤 Inactive ({cust.daysSinceLastOrder}d)
													</span>
												) : (
													<span className='crm-stage-pill new-lead'>
														🛒 First-Time Buyer
													</span>
												)}
											</td>

											{/* LTV */}
											<td>
												<span style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
													₹{cust.totalSpend.toLocaleString('en-IN')}
												</span>
											</td>

											{/* Orders */}
											<td>
												<span style={{ fontWeight: 600, color: '#334155', fontSize: '13.5px' }}>
													{cust.ordersCount} orders
												</span>
											</td>

											{/* AOV */}
											<td>
												<span style={{ color: '#475569', fontSize: '13px' }}>
													₹{cust.aov.toLocaleString('en-IN')}
												</span>
											</td>

											{/* Last Purchased */}
											<td>
												<div style={{ fontSize: '13px', color: '#334155' }}>
													{DayJS(cust.lastOrderDate).format('DD MMM YYYY')}
												</div>
												<div style={{ fontSize: '11.5px', color: '#64748B' }}>
													{cust.daysSinceLastOrder} days ago
												</div>
											</td>

											{/* Segment WhatsApp Button */}
											<td style={{ textAlign: 'center' }}>
												<div className='crm-action-group' style={{ justifyContent: 'center' }}>
													{customerPhone ? (
														<>
															<a
																href={waUrl}
																target='_blank'
																rel='noopener noreferrer'
																className='crm-btn-wa'
																title={`Open WhatsApp Chat with ${cust.name} (${customerPhone})`}>
																<FontAwesomeIcon icon={faWhatsapp} />
																Send {cust.segment === 'vip' ? 'VIP Offer' : cust.segment === 'inactive' ? 'Win-Back' : 'Offer'}
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
						Showing {paginatedCustomers.length} of {filteredCustomers.length} customers
					</div>
					<GomziTablePagination
						totalCount={filteredCustomers.length}
						currentPage={page}
						pageSize={itemsPerPage}
						onPageChange={(p: number) => setPage(p)}
					/>
				</div>
			</div>
		</div>
	)
}

export default CustomerSegments
