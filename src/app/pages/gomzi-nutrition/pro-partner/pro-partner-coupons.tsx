/* eslint-disable */
import {
	faArrowUpRightFromSquare,
	faBoxOpen,
	faCalendarAlt,
	faCheckCircle,
	faClockRotateLeft,
	faDownload,
	faFilter,
	faHandHoldingUsd,
	faLink,
	faMagnifyingGlass,
	faRotateLeft,
	faShoppingBag,
	faTag,
	faTicket,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyButton from '../../../components/motion/CopyButton'
import { handleViewPartnerAgreement } from '../contact-inquiry/PartnerApplicationActions'
import './pro-partner-coupons-list.css'
import './pro-partner-coupons.css'
import { useProPartnerData } from './useProPartnerData'

const STORE_BASE_URL = 'https://www.ragnutrition.in/shop?coupon_code='

type StatusFilter = 'all' | 'active' | 'inactive'
type SortKey = 'newest' | 'oldest' | 'earnings_desc' | 'earnings_asc' | 'orders_desc' | 'expiring'

const formatINR = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`

const isCouponExpired = (coupon: any) =>
	Boolean(coupon?.expired_at) && new Date(coupon.expired_at).getTime() < Date.now()

const ProPartnerCoupons: React.FC<{ defaultTab?: string }> = () => {
	const [searchParams] = useSearchParams()
	const partnerIdParam = searchParams.get('partner_id')

	const { loading, coupons, orders, partnerInfo, metrics } = useProPartnerData(partnerIdParam)

	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
	const [sortKey, setSortKey] = useState<SortKey>('newest')
	const [dateFrom, setDateFrom] = useState('')
	const [dateTo, setDateTo] = useState('')

	// Enforce pure white canvas
	useEffect(() => {
		const applyWhiteCanvas = () => {
			;['kt_wrapper', 'kt_content', 'kt_post', 'kt_content_container'].forEach((id) => {
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

	const partnerName = partnerInfo?.name || coupons[0]?.partner_name || 'RAG Pro Partner'

	// Earnings + order count per coupon code
	const statsByCode = useMemo(() => {
		const map: Record<string, { earnings: number; orders: number }> = {}
		orders.forEach((o) => {
			const key = o.couponCode
			if (!map[key]) map[key] = { earnings: 0, orders: 0 }
			map[key].earnings += o.commissionAmount || 0
			map[key].orders += 1
		})
		return map
	}, [orders])

	const kpis = useMemo(() => {
		const expired = coupons.filter(isCouponExpired).length
		return {
			total: coupons.length,
			active: coupons.length - expired,
			expired,
			earnings: metrics.totalCommission,
		}
	}, [coupons, metrics.totalCommission])

	const visibleCoupons = useMemo(() => {
		const q = searchTerm.trim().toLowerCase()
		const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
		const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null

		const list = coupons.filter((c) => {
			const expired = isCouponExpired(c)
			if (statusFilter === 'active' && expired) return false
			if (statusFilter === 'inactive' && !expired) return false

			if (q) {
				const hay = `${c.coupon_code || ''} ${c.title || ''}`.toLowerCase()
				if (!hay.includes(q)) return false
			}

			const created = c.createdAt ? new Date(c.createdAt).getTime() : null
			if (from !== null && (created === null || created < from)) return false
			if (to !== null && (created === null || created > to)) return false
			return true
		})

		const earningsOf = (c: any) => statsByCode[c.coupon_code]?.earnings || 0
		const ordersOf = (c: any) => statsByCode[c.coupon_code]?.orders || 0
		const createdOf = (c: any) => new Date(c.createdAt || 0).getTime()
		const expiryOf = (c: any) => (c.expired_at ? new Date(c.expired_at).getTime() : Infinity)

		return [...list].sort((a, b) => {
			switch (sortKey) {
				case 'oldest':
					return createdOf(a) - createdOf(b)
				case 'earnings_desc':
					return earningsOf(b) - earningsOf(a)
				case 'earnings_asc':
					return earningsOf(a) - earningsOf(b)
				case 'orders_desc':
					return ordersOf(b) - ordersOf(a)
				case 'expiring': {
					// Active coupons first, soonest expiry first
					const ae = isCouponExpired(a) ? 1 : 0
					const be = isCouponExpired(b) ? 1 : 0
					if (ae !== be) return ae - be
					return expiryOf(a) - expiryOf(b)
				}
				case 'newest':
				default:
					return createdOf(b) - createdOf(a)
			}
		})
	}, [coupons, searchTerm, statusFilter, sortKey, dateFrom, dateTo, statsByCode])

	const hasActiveFilters =
		Boolean(searchTerm) ||
		statusFilter !== 'all' ||
		sortKey !== 'newest' ||
		Boolean(dateFrom) ||
		Boolean(dateTo)

	const clearFilters = () => {
		setSearchTerm('')
		setStatusFilter('all')
		setSortKey('newest')
		setDateFrom('')
		setDateTo('')
	}

	const copyLink = (link: string) => {
		navigator.clipboard.writeText(link)
		toast.success('Shareable link copied!')
	}

	const handleDownloadDoc = () => {
		if (partnerInfo?.id) {
			handleViewPartnerAgreement(partnerInfo.id)
		} else {
			toast.error('Agreement document is not available yet')
		}
	}

	return (
		<div className='gz-pro-partner-coupons-wrapper'>
			<PageTitle breadcrumbs={[]}>My Assigned Coupons</PageTitle>

			{/* 1. HEADER */}
			<div className='gz-partner-header-card'>
				<div className='gz-partner-header-left'>
					<div className='gz-partner-portal-logo-icon'>
						<FontAwesomeIcon icon={faTicket} />
					</div>
					<div>
						<div className='d-flex align-items-center flex-wrap'>
							<h1 className='gz-partner-portal-title'>My Assigned Coupons</h1>
							<span className='gz-partner-status-pill approved'>
								<FontAwesomeIcon icon={faCheckCircle} />
								<span>Verified Pro Partner</span>
							</span>
						</div>
						<p className='gz-partner-portal-subtitle'>
							{partnerName} — your referral codes, direct share links and what each coupon has
							earned you.
						</p>
					</div>
				</div>

				<div className='gz-partner-header-right'>
					<Link
						to='/rag/pro-partner/commissions'
						className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faHandHoldingUsd} />
						<span>Commissions</span>
					</Link>
					<Link
						to='/rag/pro-partner/orders'
						className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faShoppingBag} />
						<span>Order History</span>
					</Link>
					<button
						type='button'
						onClick={handleDownloadDoc}
						className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faDownload} />
						<span>Agreement PDF</span>
					</button>
				</div>
			</div>

			{/* 2. KPI BOXES */}
			<div className='gz-pc-kpi-grid'>
				<div className='gz-pc-kpi'>
					<div className='gz-pc-kpi-top'>
						<span className='gz-pc-kpi-label'>Total Coupons</span>
						<span className='gz-pc-chip neutral'>
							<FontAwesomeIcon icon={faTag} />
						</span>
					</div>
					<div className='gz-pc-kpi-value'>{loading ? '…' : kpis.total}</div>
					<div className='gz-pc-kpi-desc'>Codes assigned to you</div>
				</div>

				<div className='gz-pc-kpi'>
					<div className='gz-pc-kpi-top'>
						<span className='gz-pc-kpi-label'>Active</span>
						<span className='gz-pc-chip green'>
							<FontAwesomeIcon icon={faCheckCircle} />
						</span>
					</div>
					<div className='gz-pc-kpi-value'>{loading ? '…' : kpis.active}</div>
					<div className='gz-pc-kpi-desc'>Valid right now at checkout</div>
				</div>

				<div className='gz-pc-kpi'>
					<div className='gz-pc-kpi-top'>
						<span className='gz-pc-kpi-label'>Expired</span>
						<span className='gz-pc-chip rose'>
							<FontAwesomeIcon icon={faClockRotateLeft} />
						</span>
					</div>
					<div className='gz-pc-kpi-value'>{loading ? '…' : kpis.expired}</div>
					<div className='gz-pc-kpi-desc'>Past their validity date</div>
				</div>

				<div className='gz-pc-kpi'>
					<div className='gz-pc-kpi-top'>
						<span className='gz-pc-kpi-label'>Total Earnings</span>
						<span className='gz-pc-chip amber'>
							<FontAwesomeIcon icon={faHandHoldingUsd} />
						</span>
					</div>
					<div className='gz-pc-kpi-value'>{loading ? '…' : formatINR(kpis.earnings)}</div>
					<div className='gz-pc-kpi-desc'>Commission across all coupons</div>
				</div>
			</div>

			{/* 3. FILTERS */}
			<div className='gz-pc-filter-card'>
				<div className='gz-pc-search'>
					<FontAwesomeIcon icon={faMagnifyingGlass} />
					<input
						type='text'
						placeholder='Search by coupon code or name…'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<button
							type='button'
							className='gz-pc-search-clear'
							onClick={() => setSearchTerm('')}
							title='Clear search'>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					)}
				</div>

				<div className='gz-pc-field'>
					<label>Status</label>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
						<option value='all'>All Coupons</option>
						<option value='active'>Active</option>
						<option value='inactive'>Inactive (Expired)</option>
					</select>
				</div>

				<div className='gz-pc-field'>
					<label>Sort By</label>
					<select
						value={sortKey}
						onChange={(e) => setSortKey(e.target.value as SortKey)}>
						<option value='newest'>Newest First</option>
						<option value='oldest'>Oldest First</option>
						<option value='earnings_desc'>Highest Earnings</option>
						<option value='earnings_asc'>Lowest Earnings</option>
						<option value='orders_desc'>Most Orders (Top Selling)</option>
						<option value='expiring'>Expiring Soon</option>
					</select>
				</div>

				<div className='gz-pc-field'>
					<label>Created From</label>
					<input
						type='date'
						value={dateFrom}
						max={dateTo || undefined}
						onChange={(e) => setDateFrom(e.target.value)}
					/>
				</div>

				<div className='gz-pc-field'>
					<label>Created To</label>
					<input
						type='date'
						value={dateTo}
						min={dateFrom || undefined}
						onChange={(e) => setDateTo(e.target.value)}
					/>
				</div>

				<button
					type='button'
					className='gz-pc-clear-btn'
					onClick={clearFilters}
					disabled={!hasActiveFilters}
					title='Reset all filters'>
					<FontAwesomeIcon icon={faRotateLeft} />
					<span>Reset</span>
				</button>
			</div>

			<div className='gz-pc-result-bar'>
				<FontAwesomeIcon icon={faFilter} />
				<span>
					Showing <strong>{visibleCoupons.length}</strong> of <strong>{coupons.length}</strong>{' '}
					coupons
				</span>
			</div>

			{/* 4. COUPON CARDS */}
			{loading ? (
				<div className='gz-pc-grid'>
					{[0, 1].map((i) => (
						<div
							key={i}
							className='gz-pc-card gz-pc-skeleton'
						/>
					))}
				</div>
			) : visibleCoupons.length === 0 ? (
				<div className='gz-pc-empty'>
					<span className='gz-pc-chip neutral large'>
						<FontAwesomeIcon icon={faTag} />
					</span>
					<h4>
						{coupons.length === 0 ? 'No coupons assigned yet' : 'No coupons match your filters'}
					</h4>
					<p>
						{coupons.length === 0
							? 'Once the RAG team assigns a referral coupon to your account it will appear here.'
							: 'Try changing the search, status or date range.'}
					</p>
					{hasActiveFilters && (
						<button
							type='button'
							className='gz-btn-brown-outline'
							onClick={clearFilters}>
							<FontAwesomeIcon icon={faRotateLeft} />
							<span>Reset Filters</span>
						</button>
					)}
				</div>
			) : (
				<div className='gz-pc-grid'>
					{visibleCoupons.map((c) => {
						const expired = isCouponExpired(c)
						const link = `${STORE_BASE_URL}${c.coupon_code}`
						const stat = statsByCode[c.coupon_code] || { earnings: 0, orders: 0 }
						const discountLabel =
							c.discount_type === 'percent' ? `${c.discount || 10}% OFF` : `₹${c.discount} FLAT OFF`
						const scopeLabel =
							c.scope === 'SPECIFIC_PRODUCTS'
								? `${c.applicable_products?.length || 0} selected products`
								: 'All store products'

						return (
							<div
								key={c._id || c.coupon_code}
								className={`gz-pc-card ${expired ? 'is-expired' : ''}`}>
								<div className='gz-pc-card-head'>
									<div className='gz-pc-code-wrap'>
										<span className='gz-pc-code'>{c.coupon_code}</span>
										<CopyButton
											text={c.coupon_code}
											title='Copy coupon code'
										/>
									</div>
									<span className={`gz-pc-status ${expired ? 'expired' : 'live'}`}>
										<span className='dot' />
										{expired ? 'Expired' : 'Active'}
									</span>
								</div>

								<div className='gz-pc-title-row'>
									<h3
										className='gz-pc-title'
										title={c.title}>
										{c.title || 'Official Pro Partner Discount'}
									</h3>
									<span className='gz-pc-discount'>{discountLabel}</span>
								</div>

								<div className='gz-pc-link-box'>
									<span className='gz-pc-link-label'>
										<FontAwesomeIcon icon={faLink} /> Direct shareable link
									</span>
									<div className='gz-pc-link-row'>
										<input
											type='text'
											readOnly
											value={link}
											onFocus={(e) => e.target.select()}
										/>
										<button
											type='button'
											className='gz-pc-icon-btn'
											title='Copy link'
											onClick={() => copyLink(link)}>
											<FontAwesomeIcon icon={faLink} />
										</button>
										<a
											className='gz-pc-icon-btn'
											href={link}
											target='_blank'
											rel='noreferrer'
											title='Open store link'>
											<FontAwesomeIcon icon={faArrowUpRightFromSquare} />
										</a>
									</div>
								</div>

								<div className='gz-pc-stats'>
									<div className='gz-pc-stat'>
										<span className='gz-pc-stat-label'>Total Earned</span>
										<span className='gz-pc-stat-value earn'>{formatINR(stat.earnings)}</span>
									</div>
									<div className='gz-pc-stat'>
										<span className='gz-pc-stat-label'>Orders</span>
										<span className='gz-pc-stat-value'>{stat.orders}</span>
									</div>
									<div className='gz-pc-stat'>
										<span className='gz-pc-stat-label'>
											{expired ? 'Expired On' : 'Valid Until'}
										</span>
										<span className='gz-pc-stat-value'>
											{c.expired_at ? DayJS(c.expired_at).format('DD MMM YYYY') : 'Lifetime'}
										</span>
									</div>
								</div>

								<div className='gz-pc-foot'>
									<span>
										<FontAwesomeIcon icon={faBoxOpen} /> {scopeLabel}
									</span>
									<span>
										<FontAwesomeIcon icon={faCalendarAlt} /> Created{' '}
										{c.createdAt ? DayJS(c.createdAt).format('DD MMM YYYY') : '—'}
									</span>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

export default ProPartnerCoupons
