import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faShoppingCart,
	faPhone,
	faFileExcel,
	faSync,
	faEye,
	faCheckCircle,
	faExclamationTriangle,
	faIndianRupeeSign,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import SearchFilter from '../../../../components/SearchFilter'
import GomziTablePagination from '../../../../components/GomziTablePagination'
import { GetOrders } from '../../../../Functions/FGGroup'
import toast from 'react-hot-toast'
import '../crm-theme.css'
import { cleanWhatsAppNumber } from '../crm-utils'

export const AbandonedCheckouts: React.FC = () => {
	const [abandonedOrders, setAbandonedOrders] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [page, setPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(25)

	const [dateRange, setDateRange] = useState<any>({
		from_date: DayJS().subtract(60, 'days').format('YYYY-MM-DD'),
		to_date: DayJS().format('YYYY-MM-DD'),
	})

	const fetchAbandoned = async () => {
		setLoading(true)
		try {
			const query: any = {
				item_type: ['FG_MEAL_PRODUCT', 'PURE_GO_MEAL_PRODUCT', 'PURE_GO_SAMPLE_MEAL_PRODUCT'],
				order_status: 'PENDING',
				limit: 1000,
				sort: 'createdAt',
				sortOrder: 'desc',
			}
			if (dateRange.from_date && dateRange.to_date) {
				query.from_date = dateRange.from_date
				query.to_date = dateRange.to_date
			}

			const res = await GetOrders(query)
			let rawList = res?.data || []

			// Merge CART and multiple_items
			const enriched = rawList.map((cart: any) => ({
				...cart,
				merged_items: cart.CART?.map((cartItem: any) => {
					const matchingItem = (cart.multiple_items || []).find(
						(item: any) => item.item_id === cartItem?._id
					)
					return {
						...cartItem,
						amount: matchingItem?.amount || cartItem?.price || 0,
						quantity: matchingItem?.quantity || 1,
					}
				}) || (cart.product ? [{ ...cart.product, quantity: 1, amount: cart.amount }] : []),
			}))

			setAbandonedOrders(enriched)
		} catch (error) {
			console.error('Error fetching abandoned orders:', error)
			toast.error('Failed to load abandoned checkouts')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAbandoned()
	}, [dateRange.from_date, dateRange.to_date])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		if (range && range[0] && range[1]) {
			setDateRange({
				from_date: DayJS(range[0]).format('YYYY-MM-DD'),
				to_date: DayJS(range[1]).format('YYYY-MM-DD'),
			})
		} else {
			setDateRange({ from_date: '', to_date: '' })
		}
		setPage(1)
	}

	// Filtered by Search
	const filteredList = useMemo(() => {
		if (!searchTerm || !searchTerm.trim()) return abandonedOrders
		const term = searchTerm.toLowerCase().trim()
		return abandonedOrders.filter((order: any) => {
			const u = order.user_info
			const name = `${u?.first_name || ''} ${u?.last_name || ''}`.toLowerCase()
			const phone = (u?.mobile || '').toString()
			const email = (u?.email || '').toLowerCase()
			const receipt = (order.receipt_id || '').toLowerCase()
			const itemsStr = (order.merged_items || []).map((i: any) => i.name).join(' ').toLowerCase()
			return (
				name.includes(term) ||
				phone.includes(term) ||
				email.includes(term) ||
				receipt.includes(term) ||
				itemsStr.includes(term)
			)
		})
	}, [abandonedOrders, searchTerm])

	// Paginated
	const paginatedList = useMemo(() => {
		const start = (page - 1) * itemsPerPage
		return filteredList.slice(start, start + itemsPerPage)
	}, [filteredList, page, itemsPerPage])

	// Recovery Metrics
	const metrics = useMemo(() => {
		const totalCarts = filteredList.length
		const totalValue = filteredList.reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
		const avgValue = totalCarts > 0 ? Math.round(totalValue / totalCarts) : 0
		return { totalCarts, totalValue, avgValue }
	}, [filteredList])

	// Generate 1-Click WhatsApp Recovery Message directly to the customer's phone
	const getWhatsAppRecoveryUrl = (order: any) => {
		const u = order.user_info
		const phone = cleanWhatsAppNumber(u?.mobile || order.contact_number)
		if (!phone) return ''

		const name = u?.first_name || 'Fitness Champion'
		const itemNames = (order.merged_items || [])
			.map((i: any) => i.name)
			.filter(Boolean)
			.slice(0, 2)
			.join(', ') || 'your chosen supplements'

		const text = `Hi ${name}! 👋\n\nWe noticed you left ${itemNames} in your shopping cart at RAG Nutrition.\n\nYour fitness journey shouldn't wait! 💪 To help you complete your order today, here is an exclusive 5% discount code: RECOVER5.\n\n👉 Complete your checkout here: https://www.ragnutrition.in/checkout\n\nFeel free to reply if you need any assistance with your order!`

		return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
	}

	// Excel Download
	const downloadExcel = () => {
		const rows = filteredList.map((order: any, idx: number) => {
			const u = order.user_info
			const items = (order.merged_items || [])
				.map((i: any) => `${i.name} (x${i.quantity || 1})`)
				.join('; ')
			return {
				'#': idx + 1,
				'Customer Name': u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Customer',
				Phone: u?.mobile || 'N/A',
				Email: u?.email || 'N/A',
				'Receipt ID': order.receipt_id || 'N/A',
				Items: items || 'N/A',
				'Cart Value (₹)': order.amount || 0,
				'Checkout Date': DayJS(order.createdAt).format('DD/MM/YYYY hh:mm A'),
				Status: 'Abandoned Checkout',
			}
		})

		const ws = XLSX.utils.json_to_sheet(rows)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Abandoned_Carts')
		XLSX.writeFile(wb, `RAG_Abandoned_Checkouts_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	return (
		<div className='crm-container'>
			<PageTitle breadcrumbs={[]}>Abandoned Checkouts Recovery Pipeline</PageTitle>

			{/* Breadcrumb */}
			<div className='crm-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/crm/leads'>CRM & Leads</Link>
				<span className='sep'>/</span>
				<span className='current'>Abandoned Checkouts</span>
			</div>

			{/* Header */}
			<div className='crm-header'>
				<div>
					<h1 className='crm-title'>
						<FontAwesomeIcon icon={faShoppingCart} style={{ color: '#D97706' }} />
						Abandoned Checkouts Recovery Pipeline
					</h1>
					<p className='crm-subtitle'>
						Convert dropped shoppers with 1-click personalized WhatsApp messages and special discount incentives.
					</p>
				</div>
				<div className='crm-actions'>
					<button className='crm-btn-secondary' onClick={downloadExcel} title='Download Excel'>
						<FontAwesomeIcon icon={faFileExcel} style={{ color: '#107C41' }} />
						Export Excel
					</button>
					<button className='crm-btn-secondary' onClick={fetchAbandoned} title='Refresh data'>
						<FontAwesomeIcon icon={faSync} />
						Refresh
					</button>
				</div>
			</div>

			{/* Metrics */}
			<div className='crm-metrics-grid'>
				<div className='crm-stat-card'>
					<div className='crm-stat-icon amber'>
						<FontAwesomeIcon icon={faExclamationTriangle} />
					</div>
					<div>
						<div className='crm-stat-value'>{metrics.totalCarts}</div>
						<div className='crm-stat-label'>Total Abandoned Carts</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon green'>
						<FontAwesomeIcon icon={faIndianRupeeSign} />
					</div>
					<div>
						<div className='crm-stat-value'>₹{metrics.totalValue.toLocaleString('en-IN')}</div>
						<div className='crm-stat-label'>Recoverable Pipeline Value</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon blue'>
						<FontAwesomeIcon icon={faShoppingCart} />
					</div>
					<div>
						<div className='crm-stat-value'>₹{metrics.avgValue.toLocaleString('en-IN')}</div>
						<div className='crm-stat-label'>Average Cart Value</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon purple'>
						<FontAwesomeIcon icon={faCheckCircle} />
					</div>
					<div>
						<div className='crm-stat-value'>₹0</div>
						<div className='crm-stat-label'>WhatsApp Recovered Cost (100% Free)</div>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className='crm-filters-card'>
				<div className='crm-filters-left'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						placeholder='Search by customer, phone, product...'
					/>
					<DateFilter
						startDate={dateRange.from_date ? new Date(dateRange.from_date) : null}
						endDate={dateRange.to_date ? new Date(dateRange.to_date) : null}
						onDateRangeChange={handleDateRangeChange}
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
								<th>Receipt ID</th>
								<th>Abandoned Items</th>
								<th>Cart Value</th>
								<th>Dropped Time</th>
								<th style={{ textAlign: 'center' }}>1-Click Recovery</th>
								<th style={{ textAlign: 'center' }}>Details</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
										<div className='spinner-border spinner-border-sm text-primary me-2' role='status' />
										Loading abandoned checkouts...
									</td>
								</tr>
							) : paginatedList.length === 0 ? (
								<tr>
									<td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
										<FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '32px', color: '#10B981', marginBottom: '12px' }} />
										<div style={{ fontWeight: 600, color: '#1E293B' }}>No abandoned checkouts</div>
										<p style={{ fontSize: '13px', margin: '4px 0 0' }}>
											Great job! No dropped checkouts found for this timeframe.
										</p>
									</td>
								</tr>
							) : (
								paginatedList.map((item: any, idx: number) => {
									const actualIndex = (page - 1) * itemsPerPage + idx + 1
									const u = item.user_info
									const fullName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Guest Shopper'
									const customerPhone = cleanWhatsAppNumber(u?.mobile || item.contact_number)
									const displayPhone = u?.mobile || item.contact_number || ''
									const waRecoveryUrl = customerPhone ? getWhatsAppRecoveryUrl(item) : ''
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

											{/* Customer Cell */}
											<td>
												<div className='crm-user-cell'>
													<div className='crm-user-avatar' style={{ background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }}>
														{initials}
													</div>
													<div>
														<div className='crm-user-name'>{fullName}</div>
														<div className='crm-user-sub'>
															{displayPhone || 'No phone recorded'}
														</div>
														{u?.email && (
															<div style={{ fontSize: '11.5px', color: '#64748B' }}>
																{u.email}
															</div>
														)}
													</div>
												</div>
											</td>

											{/* Receipt */}
											<td>
												<span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569', fontSize: '12.5px' }}>
													{item.receipt_id || 'N/A'}
												</span>
											</td>

											{/* Items */}
											<td>
												<div style={{ maxWidth: '280px' }}>
													{(item.merged_items || []).length > 0 ? (
														item.merged_items.map((it: any, itIdx: number) => (
															<div key={itIdx} style={{ fontSize: '13px', color: '#1E293B', marginBottom: '2px' }}>
																• {it.name} <span style={{ color: '#64748B', fontSize: '11.5px' }}>(x{it.quantity || 1})</span>
															</div>
														))
													) : item.product ? (
														<span style={{ fontSize: '13px', color: '#1E293B' }}>{item.product.name}</span>
													) : (
														<span style={{ color: '#94A3B8', fontSize: '12px' }}>Unspecified items</span>
													)}
												</div>
											</td>

											{/* Amount */}
											<td>
												<span style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
													₹{Number(item.amount || 0).toLocaleString('en-IN')}
												</span>
											</td>

											{/* Dropped Time */}
											<td>
												<div style={{ fontSize: '13px', color: '#334155' }}>
													{DayJS(item.createdAt).format('DD MMM YYYY')}
												</div>
												<div style={{ fontSize: '11.5px', color: '#64748B' }}>
													{DayJS(item.createdAt).format('hh:mm A')} ({DayJS(item.createdAt).fromNow()})
												</div>
											</td>

											{/* 1-Click WhatsApp Recovery */}
											<td style={{ textAlign: 'center' }}>
												<div className='crm-action-group' style={{ justifyContent: 'center' }}>
													{customerPhone ? (
														<>
															<a
																href={waRecoveryUrl}
																target='_blank'
																rel='noopener noreferrer'
																className='crm-btn-wa'
																title={`Open WhatsApp Cart Recovery for ${fullName} (${customerPhone})`}>
																<FontAwesomeIcon icon={faWhatsapp} />
																Recover Cart
															</a>
															<a
																href={`tel:${customerPhone}`}
																className='crm-btn-call'
																title={`Call Customer: ${customerPhone}`}>
																<FontAwesomeIcon icon={faPhone} />
															</a>
														</>
													) : (
														<span style={{ color: '#CBD5E1', fontSize: '12px' }}>No Phone</span>
													)}
												</div>
											</td>

											{/* View Order Link */}
											<td style={{ textAlign: 'center' }}>
												<Link
													to={`/rag/product-order-view?order_id=${item._id}`}
													className='crm-btn-icon'
													title='View Checkout & Items'>
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
						Showing {paginatedList.length} of {filteredList.length} abandoned checkouts
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

export default AbandonedCheckouts
