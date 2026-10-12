/**
 *   Meta Marketing Dashboard - Premium Clean Design
 *   GET /insights/facebook-pages                             → getFacebookPageList()
 *   GET /insights/facebook-pages/:page_id/insights           → getFacebookPageInsights()
 *   GET /insights/facebook-businesses                        → GetFBBusiness()
 *   GET /insights/facebook-businesses/ad-accounts            → GetUserOwnedAdAccounts()
 *   GET /insights/facebook-businesses/:biz_id/ad-accounts    → GetBusinessOwnAdAccounts()
 *   GET /insights/facebook-businesses/:acc_id/insights       → GetBusinessAdAccountInsights()
 *   GET /insights/facebook-businesses/:acc_id/campaigns      → GetAdCampaign()
 *   GET /insights/facebook-businesses/:camp_id/insights      → GetAdCampaignInsights()
 *   GET /insights/facebook-businesses/:camp_id/ad-sets       → GetAdSet()
 *   GET /insights/facebook-businesses/:adset_id/insights     → GetAdSetInsights()
 *   GET /insights/facebook-businesses/:adset_id/ads          → GetAds()
 *   GET /insights/facebook-businesses/:ad_id/insights        → GetAdInsights()
 *   GET /insights/facebook-businesses/:ad_id/leads           → GetAdLeads()
 *   GET /insights/facebook-businesses/lead/:lead_id          → GetLeadGenForms()
 */

import {
	faAd,
	faArrowLeft,
	faBuilding,
	faChartBar,
	faChevronDown,
	faChevronRight,
	faChevronUp,
	faCoins,
	faCrosshairs,
	faDownload,
	faEye,
	faFileLines,
	faLayerGroup,
	faMousePointer,
	faPlus,
	faRotate,
	faSearch,
	faTimes,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap'
import * as XLSX from 'xlsx'
import { KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import UsersListPagination from '../../../components/TablePagination'
import * as FGGroupAPIs from '../../../Functions/FGGroup'
import './meta-marketing.css'

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

const extractValue = (fieldData: any[], name: string) => {
	if (!Array.isArray(fieldData)) return ''
	const f = fieldData.find((d: any) => d.name === name)
	return f?.values?.[0] ?? ''
}

const fmt = {
	inr: (v?: string | number) =>
		`₹${parseFloat(String(v || '0')).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
	num: (v?: string | number) => parseInt(String(v || '0')).toLocaleString('en-IN'),
	pct: (v?: string | number) => `${parseFloat(String(v || '0')).toFixed(2)}%`,
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const DATE_PRESETS = [
	{ value: 'today', label: 'Today' },
	{ value: 'yesterday', label: 'Yesterday' },
	{ value: 'last_7d', label: '7D' },
	{ value: 'last_14d', label: '14D' },
	{ value: 'last_30d', label: '30D' },
	{ value: 'this_month', label: 'Month' },
	{ value: 'last_month', label: 'Prev Month' },
]

const I_FIELDS =
	'account_name,impressions,spend,clicks,cpc,cpm,ctr,reach,frequency,unique_clicks,cost_per_unique_click'
const PAGE_METRICS = 'page_impressions_unique,page_impressions,page_engaged_users,page_fans'

type Level = 'overview' | 'campaigns' | 'adsets' | 'ads' | 'leads' | 'pages'

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES  (inline style objects – keeps everything in one file)
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   MICRO COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const Loader = ({ text = 'Loading…' }: { text?: string }) => (
	<div className='loader-container'>
		<div className='loader-spinner' />
		<span className='loader-text'>{text}</span>
		<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
	</div>
)

const NoData = ({ icon, title, sub }: { icon: any; title: string; sub: string }) => (
	<div className='nodata-container'>
		<div className='nodata-icon-box'>
			<FontAwesomeIcon
				icon={icon}
				className='text-slate-300 fs-4'
			/>
		</div>
		<h5 className='nodata-title'>{title}</h5>
		<p className='nodata-sub'>{sub}</p>
	</div>
)

const StatusDot = ({ status }: { status: string }) => {
	const map: Record<string, string> = {
		ACTIVE: '#22c55e',
		PAUSED: '#f59e0b',
		DELETED: '#ef4444',
		ARCHIVED: '#94a3b8',
	}
	return (
		<span className='status-wrap'>
			<span
				className='status-dot'
				style={{ background: map[status] || '#94a3b8' }}
			/>
			<span className='status-text'>{status?.toLowerCase()}</span>
		</span>
	)
}

const SearchBox = ({
	value,
	onChange,
	placeholder = 'Search…',
}: {
	value: string
	onChange: (v: string) => void
	placeholder?: string
}) => (
	<div className='search-wrap'>
		<FontAwesomeIcon
			icon={faSearch}
			className='search-icon'
		/>
		<input
			className='search-input'
			placeholder={placeholder}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
		{value && (
			<button
				onClick={() => onChange('')}
				className='search-clear-btn'>
				<FontAwesomeIcon
					icon={faTimes}
					className='fs-9'
				/>
			</button>
		)}
	</div>
)

const StatusSelector = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
	<select
		className='form-select form-select-sm br-10 border-slate-200 fs-13 fw-600 text-slate-700 bg-white outline-none ps-3 pe-10 min-w-120px'
		value={value}
		onChange={(e) => onChange(e.target.value)}>
		<option value='ACTIVE'>Active</option>
		<option value='PAUSED'>Paused</option>
		<option value='ALL'>All</option>
	</select>
)

/* ── Section Header ─────────────────────────────────────────────────────── */

const SectionHeader = ({
	icon,
	iconBg,
	iconColor,
	title,
	count,
	onBack,
	children,
}: {
	icon: any
	iconBg: string
	iconColor: string
	title: string
	count?: number
	onBack?: () => void
	children?: React.ReactNode
}) => (
	<div className='section-header-wrap'>
		<div className='section-header-left'>
			{onBack && (
				<button
					onClick={onBack}
					className='back-button'>
					<FontAwesomeIcon
						icon={faArrowLeft}
						className='fs-8'
					/>
				</button>
			)}
			<div
				className='section-icon-box'
				style={{ background: iconBg }}>
				<FontAwesomeIcon
					icon={icon}
					className='fs-6'
					style={{ color: iconColor }}
				/>
			</div>
			<div>
				<h3 className='section-header-title'>
					{title}
					{count !== undefined && <span className='section-header-count'>({count})</span>}
				</h3>
			</div>
		</div>
		<div className='section-header-right'>{children}</div>
	</div>
)

/* ── Insight Metrics Bar ────────────────────────────────────────────────── */

const InsightBar = ({ data }: { data: any }) => {
	if (!data) return null
	const metrics = [
		{ label: 'Spend', val: fmt.inr(data.spend), bg: '#eff6ff', color: '#3b82f6', icon: faCoins },
		{
			label: 'Impressions',
			val: fmt.num(data.impressions),
			bg: '#f0fdf4',
			color: '#22c55e',
			icon: faEye,
		},
		{ label: 'Reach', val: fmt.num(data.reach), bg: '#fefce8', color: '#eab308', icon: faUsers },
		{
			label: 'Clicks',
			val: fmt.num(data.clicks),
			bg: '#faf5ff',
			color: '#a855f7',
			icon: faMousePointer,
		},
		{ label: 'CPC', val: fmt.inr(data.cpc), bg: '#fff7ed', color: '#f97316', icon: faCoins },
		{ label: 'CTR', val: fmt.pct(data.ctr), bg: '#fdf2f8', color: '#ec4899', icon: faChartBar },
	]
	return (
		<div className='metrics-grid'>
			{metrics.map((m) => (
				<div
					key={m.label}
					className='metric-chip'
					style={{ background: m.bg }}>
					<div className='metric-item-header'>
						<FontAwesomeIcon
							icon={m.icon}
							className='fs-8'
							style={{ color: m.color }}
						/>
						<span className='metric-item-label'>{m.label}</span>
					</div>
					<div
						className='metric-item-value'
						style={{ color: m.color }}>
						{m.val}
					</div>
				</div>
			))}
			{data.date_start && (
				<div className='metric-date-info'>
					{data.date_start} → {data.date_stop}
				</div>
			)}
		</div>
	)
}

/* ── Clickable Card ─────────────────────────────────────────────────────── */

const ItemCard = ({
	selected,
	onClick,
	children,
}: {
	selected: boolean
	onClick: () => void
	children: React.ReactNode
}) => {
	return (
		<div
			onClick={onClick}
			className={`item-card ${selected ? 'selected' : ''}`}>
			{children}
		</div>
	)
}

/* ── Btn ────────────────────────────────────────────────────────────────── */

const Btn = ({
	children,
	onClick,
	variant = 'light',
	disabled,
	size = 'sm',
	className = '',
}: {
	children: React.ReactNode
	onClick?: () => void
	variant?: 'primary' | 'light' | 'success' | 'ghost'
	disabled?: boolean
	size?: 'sm' | 'md'
	className?: string
}) => {
	const colors = {
		primary: { bg: '#3b82f6', color: '#fff', border: 'none', hoverBg: '#2563eb' },
		light: { bg: '#f1f5f9', color: '#475569', border: 'none', hoverBg: '#e2e8f0' },
		success: { bg: '#dcfce7', color: '#16a34a', border: 'none', hoverBg: '#bbf7d0' },
		ghost: { bg: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', hoverBg: '#f8fafc' },
	}
	const c = colors[variant]
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`custom-btn ${size === 'md' ? 'custom-btn-md' : ''} ${className}`}
			style={{
				border: c.border,
				background: disabled ? '#f1f5f9' : c.bg,
				color: disabled ? '#94a3b8' : c.color,
			}}>
			{children}
		</button>
	)
}

/* ── Page Card ──────────────────────────────────────────────────────────── */

const PageCard = ({ page }: { page: any }) => {
	const [open, setOpen] = useState(false)
	const [insights, setInsights] = useState<any[]>([])
	const [loading, setLoading] = useState(false)

	const toggle = async () => {
		if (!open && insights.length === 0) {
			setLoading(true)
			try {
				const res: any = await FGGroupAPIs.getFacebookPageInsights(page.page_id, {
					metric: PAGE_METRICS,
				})
				setInsights(res.data || [])
			} catch {}
			setLoading(false)
		}
		setOpen(!open)
	}

	return (
		<div className='col-md-6 col-lg-4'>
			<div className='meta-dashboard-card p-24'>
				<div className='d-flex align-items-center gap-4 mb-4'>
					<div className='page-card-icon-box'>
						<FontAwesomeIcon
							icon={faFileLines}
							className='text-white fs-5'
						/>
					</div>
					<div className='flex-grow-1 min-w-0'>
						<h6 className='page-card-title'>{page.name}</h6>
						<span className='page-card-subtitle'>{page.category}</span>
					</div>
				</div>

				<div className='d-flex justify-content-between align-items-center mb-4'>
					<span className='page-card-id'>ID: {page.page_id}</span>
					{page.business && <span className='page-card-biz-badge'>{page.business.name}</span>}
				</div>

				<Btn
					onClick={toggle}
					variant='light'
					disabled={loading}>
					{loading ? (
						<span className='spinner-border spinner-border-sm w-14px h-14px' />
					) : (
						<FontAwesomeIcon
							icon={open ? faChevronUp : faChevronDown}
							className='fs-10'
						/>
					)}
					{open ? 'Hide Insights' : 'View Insights'}
				</Btn>

				{open && insights.length > 0 && (
					<div className='mt-4 bt-dashed pt-4'>
						{insights.map((ins: any) => (
							<div
								key={ins.name}
								className='insight-item'>
								<div className='insight-header'>
									<span className='insight-label'>{ins.title || ins.name}</span>
									<span className='insight-period-badge'>{ins.period}</span>
								</div>
								{ins.values?.slice(-3).map((v: any) => (
									<div
										key={v.end_time}
										className='insight-row'>
										<span className='insight-date'>
											{new Date(v.end_time).toLocaleDateString('en-IN', {
												day: '2-digit',
												month: 'short',
											})}
										</span>
										<span className='insight-val'>{fmt.num(v.value)}</span>
									</div>
								))}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const MetaMarketingDashboard = () => {
	const [currentLevel, setCurrentLevel] = useState<Level>('overview')
	const [datePreset, setDatePreset] = useState('last_30d')
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState('ACTIVE')

	// Data states
	const [businessList, setBusinessList] = useState<any[]>([])
	const [selectedBizId, setSelectedBizId] = useState('')
	const [allAdAccounts, setAllAdAccounts] = useState<any[]>([])
	const [bizAdAccounts, setBizAdAccounts] = useState<any[]>([])
	const [selectedAccount, setSelectedAccount] = useState<any>(null)
	const [selectedAccountId, setSelectedAccountId] = useState('')
	const [accountInsight, setAccountInsight] = useState<any>(null)
	const [loadingAccounts, setLoadingAccounts] = useState(false)

	const [campaigns, setCampaigns] = useState<any[]>([])
	const [selectedCampaignId, setSelectedCampaignId] = useState('')
	const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
	const [campaignInsight, setCampaignInsight] = useState<any>(null)
	const [loadingCampaigns, setLoadingCampaigns] = useState(false)
	const [campaignCursor, setCampaignCursor] = useState<string | null>(null)

	const [adSets, setAdSets] = useState<any[]>([])
	const [selectedAdSetId, setSelectedAdSetId] = useState('')
	const [selectedAdSet, setSelectedAdSet] = useState<any>(null)
	const [adSetInsight, setAdSetInsight] = useState<any>(null)
	const [loadingAdSets, setLoadingAdSets] = useState(false)
	const [adSetCursor, setAdSetCursor] = useState<string | null>(null)

	const [ads, setAds] = useState<any[]>([])
	const [selectedAdId, setSelectedAdId] = useState('')
	const [selectedAd, setSelectedAd] = useState<any>(null)
	const [adInsight, setAdInsight] = useState<any>(null)
	const [loadingAds, setLoadingAds] = useState(false)
	const [adCursor, setAdCursor] = useState<string | null>(null)

	const [leads, setLeads] = useState<any[]>([])
	const [leadCursor, setLeadCursor] = useState<string | null>(null)
	const [loadingLeads, setLoadingLeads] = useState(false)
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })

	const [showModal, setShowModal] = useState(false)
	const [selectedLead, setSelectedLead] = useState<any>({})
	const [leadDetail, setLeadDetail] = useState<any>(null)
	const [loadingDetail, setLoadingDetail] = useState(false)

	const [pages, setPages] = useState<any[]>([])

	const [kpiSpend, setKpiSpend] = useState(0)
	const [kpiImpressions, setKpiImpressions] = useState(0)
	const [kpiClicks, setKpiClicks] = useState(0)
	const [kpiReach, setKpiReach] = useState(0)

	/* ─── Init ──────────────────────────────────────────────────────────── */

	useEffect(() => {
		loadInitialData()
	}, [])

	const loadInitialData = async () => {
		setLoadingAccounts(true)
		try {
			// 1. Fetch businesses and user-owned accounts
			const [bizRes, userAccRes]: any[] = await Promise.allSettled([
				FGGroupAPIs.GetFBBusiness({ fields: 'id,name' }),
				FGGroupAPIs.GetUserOwnedAdAccounts({
					fields: 'name,account_id,business,business_name,account_status',
				}),
				FGGroupAPIs.getFacebookPageList().then((r: any) => setPages(r.data || [])),
			])

			let businesses = []
			if (bizRes.status === 'fulfilled') {
				businesses = bizRes.value.data || []
				setBusinessList(businesses)
			}

			let initialAccounts: any[] = []
			if (userAccRes.status === 'fulfilled') {
				initialAccounts = userAccRes.value.data || []
			}

			// 2. Fetch accounts for each business in parallel
			if (businesses.length > 0) {
				const bizAccPromises = businesses.map((b: any) =>
					FGGroupAPIs.GetBusinessOwnAdAccounts(
						{ fields: 'name,account_id,business_name,account_status' },
						b.id
					)
				)

				const bizAccsResults = await Promise.allSettled(bizAccPromises)
				bizAccsResults.forEach((res) => {
					if (res.status === 'fulfilled') {
						initialAccounts = [...initialAccounts, ...(res.value.data || [])]
					}
				})
			}

			// 3. De-duplicate by account_id
			const uniqueAccounts = Array.from(
				new Map(initialAccounts.map((a: any) => [a.id || `act_${a.account_id}`, a])).values()
			)

			setAllAdAccounts(uniqueAccounts)

			// 4. Calculate KPIs for top 5 active accounts
			const activeTop5 = uniqueAccounts.filter((a: any) => a.account_status === 1).slice(0, 5)

			let sp = 0,
				im = 0,
				cl = 0,
				re = 0
			if (activeTop5.length > 0) {
				await Promise.allSettled(
					activeTop5.map(async (acc: any) => {
						try {
							const ir: any = await FGGroupAPIs.GetBusinessAdAccountInsights(
								acc.id || `act_${acc.account_id}`,
								{ fields: 'spend,impressions,clicks,reach', date_preset: 'last_30d' }
							)
							if (ir.data?.[0]) {
								sp += parseFloat(ir.data[0].spend || '0')
								im += parseInt(ir.data[0].impressions || '0', 10)
								cl += parseInt(ir.data[0].clicks || '0', 10)
								re += parseInt(ir.data[0].reach || '0', 10)
							}
						} catch {}
					})
				)
			}
			setKpiSpend(sp)
			setKpiImpressions(im)
			setKpiClicks(cl)
			setKpiReach(re)
		} catch (error) {
			console.error('Error loading initial data:', error)
		}
		setLoadingAccounts(false)
	}

	/* ─── Reset ─────────────────────────────────────────────────────────── */

	const resetFrom = useCallback((from: 'account' | 'campaign' | 'adset' | 'ad') => {
		if (from === 'account') {
			setCampaigns([])
			setSelectedCampaignId('')
			setSelectedCampaign(null)
			setAdSets([])
			setSelectedAdSetId('')
			setSelectedAdSet(null)
			setAds([])
			setSelectedAdId('')
			setSelectedAd(null)
			setLeads([])
			setLeadCursor(null)
			setCampaignInsight(null)
			setAdSetInsight(null)
			setAdInsight(null)
		}
		if (from === 'campaign') {
			setAdSets([])
			setSelectedAdSetId('')
			setSelectedAdSet(null)
			setAds([])
			setSelectedAdId('')
			setSelectedAd(null)
			setLeads([])
			setLeadCursor(null)
			setAdSetInsight(null)
			setAdInsight(null)
		}
		if (from === 'adset') {
			setAds([])
			setSelectedAdId('')
			setSelectedAd(null)
			setLeads([])
			setLeadCursor(null)
			setAdInsight(null)
		}
		if (from === 'ad') {
			setLeads([])
			setLeadCursor(null)
			setAdInsight(null)
		}
	}, [])

	/* ─── Business ──────────────────────────────────────────────────────── */

	const handleBizChange = async (bizId: string) => {
		setSelectedBizId(bizId)
		setSelectedAccountId('')
		setSelectedAccount(null)
		resetFrom('account')
		if (!bizId) {
			setBizAdAccounts([])
			return
		}
		try {
			const r: any = await FGGroupAPIs.GetBusinessOwnAdAccounts(
				{ fields: 'name,account_id,account_status' },
				bizId
			)
			setBizAdAccounts(r.data || [])
		} catch {
			setBizAdAccounts([])
		}
	}

	/* ─── Account ───────────────────────────────────────────────────────── */

	const handleAccountSelect = async (acc: any) => {
		const id = acc.id || `act_${acc.account_id}`
		setSelectedAccountId(id)
		setSelectedAccount(acc)
		resetFrom('account')
		setAccountInsight(null)
		setCurrentLevel('campaigns')
		setSearchTerm('')

		setLoadingCampaigns(true)
		try {
			const [cR, iR]: any[] = await Promise.allSettled([
				FGGroupAPIs.GetAdCampaign(id, {
					fields: 'account_id,name,configured_status,bid_strategy,objective',
				}),
				FGGroupAPIs.GetBusinessAdAccountInsights(id, { fields: I_FIELDS, date_preset: datePreset }),
			])
			if (cR.status === 'fulfilled') {
				setCampaigns(cR.value.data || [])
				setCampaignCursor(cR.value.metadata?.cursor?.after || null)
			}
			if (iR.status === 'fulfilled') setAccountInsight(iR.value.data?.[0] || null)
		} catch {}
		setLoadingCampaigns(false)
	}

	const loadMoreCampaigns = async () => {
		if (!campaignCursor || !selectedAccountId) return
		try {
			const r: any = await FGGroupAPIs.GetAdCampaign(selectedAccountId, {
				fields: 'account_id,name,configured_status,bid_strategy,objective',
				after: campaignCursor,
			} as any)
			setCampaigns((p) => [...p, ...(r.data || [])])
			setCampaignCursor(r.metadata?.cursor?.after || null)
		} catch {}
	}

	/* ─── Campaign ──────────────────────────────────────────────────────── */

	const handleCampaignSelect = async (camp: any) => {
		setSelectedCampaignId(camp.id)
		setSelectedCampaign(camp)
		resetFrom('campaign')
		setCampaignInsight(null)
		setCurrentLevel('adsets')
		setSearchTerm('')

		setLoadingAdSets(true)
		try {
			const [aR, iR]: any[] = await Promise.allSettled([
				FGGroupAPIs.GetAdSet(camp.id, {
					fields: 'account_id,name,configured_status,bid_strategy,campaign',
				}),
				FGGroupAPIs.GetAdCampaignInsights(camp.id, { fields: I_FIELDS, date_preset: datePreset }),
			])
			if (aR.status === 'fulfilled') {
				setAdSets(aR.value.data || [])
				setAdSetCursor(aR.value.metadata?.cursor?.after || null)
			}
			if (iR.status === 'fulfilled') setCampaignInsight(iR.value.data?.[0] || null)
		} catch {}
		setLoadingAdSets(false)
	}

	const loadMoreAdSets = async () => {
		if (!adSetCursor || !selectedCampaignId) return
		try {
			const r: any = await FGGroupAPIs.GetAdSet(selectedCampaignId, {
				fields: 'account_id,name,configured_status,bid_strategy,campaign',
				after: adSetCursor,
			} as any)
			setAdSets((p) => [...p, ...(r.data || [])])
			setAdSetCursor(r.metadata?.cursor?.after || null)
		} catch {}
	}

	/* ─── Ad Set ────────────────────────────────────────────────────────── */

	const handleAdSetSelect = async (adSet: any) => {
		setSelectedAdSetId(adSet.id)
		setSelectedAdSet(adSet)
		resetFrom('adset')
		setAdSetInsight(null)
		setCurrentLevel('ads')
		setSearchTerm('')

		setLoadingAds(true)
		try {
			const [aR, iR]: any[] = await Promise.allSettled([
				FGGroupAPIs.GetAds(adSet.id, {
					fields: 'account_id,name,status,adset_id,adset,ad_active_time,tracking_specs',
				}),
				FGGroupAPIs.GetAdSetInsights(adSet.id, { fields: I_FIELDS, date_preset: datePreset }),
			])
			if (aR.status === 'fulfilled') {
				setAds(aR.value.data || [])
				setAdCursor(aR.value.metadata?.cursor?.after || null)
			}
			if (iR.status === 'fulfilled') setAdSetInsight(iR.value.data?.[0] || null)
		} catch {}
		setLoadingAds(false)
	}

	const loadMoreAds = async () => {
		if (!adCursor || !selectedAdSetId) return
		try {
			const r: any = await FGGroupAPIs.GetAds(selectedAdSetId, {
				fields: 'account_id,name,status,adset_id,adset,ad_active_time',
				after: adCursor,
			} as any)
			setAds((p) => [...p, ...(r.data || [])])
			setAdCursor(r.metadata?.cursor?.after || null)
		} catch {}
	}

	/* ─── Ad ────────────────────────────────────────────────────────────── */

	const handleAdSelect = async (ad: any) => {
		setSelectedAdId(ad.id)
		setSelectedAd(ad)
		setLeads([])
		setLeadCursor(null)
		setAdInsight(null)
		setPagination({ page: 1, itemsPerPage: 10 })
		setCurrentLevel('leads')
		setSearchTerm('')

		setLoadingLeads(true)
		try {
			const [lR, iR]: any[] = await Promise.allSettled([
				FGGroupAPIs.GetAdLeads(ad.id, { limit: '25' }),
				FGGroupAPIs.GetAdInsights(ad.id, { fields: I_FIELDS, date_preset: datePreset }),
			])
			if (lR.status === 'fulfilled') {
				setLeads(lR.value.data || [])
				setLeadCursor(lR.value.metadata?.cursor?.after || null)
			}
			if (iR.status === 'fulfilled') setAdInsight(iR.value.data?.[0] || null)
		} catch {}
		setLoadingLeads(false)
	}

	const loadMoreLeads = async () => {
		if (!leadCursor || !selectedAdId) return
		try {
			const r: any = await FGGroupAPIs.GetAdLeads(selectedAdId, { limit: '25', after: leadCursor })
			setLeads((p) => [...p, ...(r.data || [])])
			setLeadCursor(r.metadata?.cursor?.after || null)
		} catch {}
	}

	/* ─── Lead Modal ────────────────────────────────────────────────────── */

	const handleViewLead = async (lead: any) => {
		setSelectedLead(lead)
		setShowModal(true)
		setLeadDetail(null)
		setLoadingDetail(true)
		try {
			const r: any = await FGGroupAPIs.GetLeadGenForms(lead.id, {
				fields:
					'ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,created_time,field_data,form_id,id,is_organic,platform',
			} as any)
			setLeadDetail(r.data || null)
		} catch {}
		setLoadingDetail(false)
	}

	/* ─── Excel ─────────────────────────────────────────────────────────── */

	const downloadExcel = () => {
		const rows = leads.map((l: any) => {
			const row: any = { 'Lead ID': l.id }
			l.field_data?.forEach((f: any) => {
				row[f.name] = f.values?.[0] || ''
			})
			row['Created'] = new Date(l.created_time).toLocaleString()
			return row
		})
		const ws = XLSX.utils.json_to_sheet(rows)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Leads')
		XLSX.writeFile(wb, `Leads_${selectedAd?.name || 'export'}.xlsx`)
	}

	/* ─── Derived ───────────────────────────────────────────────────────── */

	const displayAccounts = (selectedBizId ? bizAdAccounts : allAdAccounts).filter((a) => {
		const statusMatch =
			statusFilter === 'ALL' ||
			(statusFilter === 'ACTIVE' ? a.account_status === 1 : a.account_status !== 1)
		return statusMatch
	})
	const filteredCampaigns = campaigns.filter(
		(c) =>
			c.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(statusFilter === 'ALL' || c.configured_status === statusFilter)
	)
	const filteredAdSets = adSets.filter(
		(a) =>
			a.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(statusFilter === 'ALL' || a.configured_status === statusFilter)
	)
	const filteredAds = ads.filter(
		(a) =>
			a.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(statusFilter === 'ALL' || a.status === statusFilter)
	)
	const paginatedLeads = leads.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)
	const uniqueFields = useMemo<string[]>(() => {
		const s = new Set<string>()
		leads.forEach((r) => {
			if (Array.isArray(r.field_data)) r.field_data.forEach((f: any) => s.add(f.name))
		})
		return Array.from(s)
	}, [leads])

	const breadcrumbs = useMemo(() => {
		const items: { label: string; level: Level }[] = [{ label: 'Overview', level: 'overview' }]
		if (selectedAccount)
			items.push({ label: selectedAccount.name || 'Account', level: 'campaigns' })
		if (selectedCampaign)
			items.push({ label: selectedCampaign.name || 'Campaign', level: 'adsets' })
		if (selectedAdSet) items.push({ label: selectedAdSet.name || 'Ad Set', level: 'ads' })
		if (selectedAd) items.push({ label: selectedAd.name || 'Ad', level: 'leads' })
		if (currentLevel === 'pages') items.push({ label: 'Pages', level: 'pages' })
		return items
	}, [selectedAccount, selectedCampaign, selectedAdSet, selectedAd, currentLevel])

	const goBack = () => {
		const order: Level[] = ['overview', 'campaigns', 'adsets', 'ads', 'leads']
		const i = order.indexOf(currentLevel)
		if (i > 0) {
			setCurrentLevel(order[i - 1])
			setSearchTerm('')
		}
	}

	/* ═══════════════════════════════════════════════════════════════════════
	   RENDER
	   ═══════════════════════════════════════════════════════════════════════ */

	return (
		<>
			<PageTitle breadcrumbs={[]}>Meta Marketing</PageTitle>

			{/* ── TOOLBAR ──────────────────────────────────────────────────────── */}
			<div className='meta-dashboard-toolbar'>
				{/* Breadcrumb */}
				<div className='d-flex align-items-center gap-1 flex-wrap mb-4'>
					{breadcrumbs.map((b, i) => (
						<div
							key={b.level}
							style={{ display: 'flex', alignItems: 'center' }}>
							{i > 0 && (
								<FontAwesomeIcon
									icon={faChevronRight}
									className='breadcrumb-sep'
								/>
							)}
							{b.level === currentLevel ? (
								<span className='text-primary fw-bold fs-7'>
									{b.label.length > 25 ? b.label.slice(0, 25) + '…' : b.label}
								</span>
							) : (
								<button
									className='breadcrumb-btn'
									onClick={() => {
										setCurrentLevel(b.level)
										setSearchTerm('')
									}}>
									{b.label.length > 20 ? b.label.slice(0, 20) + '…' : b.label}
								</button>
							)}
						</div>
					))}
				</div>

				{/* Date + Refresh */}
				<div className='d-flex align-items-center gap-2 flex-wrap'>
					{DATE_PRESETS.map((dp) => (
						<button
							key={dp.value}
							className={`date-pill ${datePreset === dp.value ? 'active' : ''}`}
							onClick={() => setDatePreset(dp.value)}>
							{dp.label}
						</button>
					))}
					<OverlayTrigger overlay={<Tooltip>Refresh all data</Tooltip>}>
						<button
							onClick={loadInitialData}
							className='refresh-btn'>
							<FontAwesomeIcon
								icon={faRotate}
								className='text-slate-500 fs-8'
							/>
						</button>
					</OverlayTrigger>
				</div>
			</div>

			{/* Tab switch: Accounts / Pages - Visible at top levels */}
			{(currentLevel === 'overview' || currentLevel === 'pages') && (
				<div className='d-flex gap-2 mb-4'>
					<Btn
						variant={currentLevel === 'overview' ? 'primary' : 'ghost'}
						className='tab-btn'
						onClick={() => setCurrentLevel('overview')}>
						<FontAwesomeIcon icon={faBuilding} /> Ad Accounts
					</Btn>
					<Btn
						variant={String(currentLevel) === 'pages' ? 'primary' : 'ghost'}
						className='tab-btn'
						onClick={() => setCurrentLevel('pages')}>
						<FontAwesomeIcon icon={faFileLines} /> Pages
					</Btn>
				</div>
			)}

			{/* ══════════════════════════════════════════════════════════════════
			    OVERVIEW
			    ══════════════════════════════════════════════════════════════════ */}
			{currentLevel === 'overview' && (
				<>
					{/* KPI Cards */}
					<div className='row g-4 mb-6'>
						{[
							{
								label: 'Total Spend',
								value: fmt.inr(kpiSpend),
								icon: faCoins,
								gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
							},
							{
								label: 'Impressions',
								value: fmt.num(kpiImpressions),
								icon: faEye,
								gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
							},
							{
								label: 'Clicks',
								value: fmt.num(kpiClicks),
								icon: faMousePointer,
								gradient: 'linear-gradient(135deg, #22c55e, #15803d)',
							},
							{
								label: 'Reach',
								value: fmt.num(kpiReach),
								icon: faUsers,
								gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
							},
						].map((kpi) => (
							<div
								key={kpi.label}
								className='col-6 col-lg-3'>
								<div
									className='meta-kpi-card'
									style={{ background: kpi.gradient }}>
									<div className='meta-kpi-circle' />
									<div className='meta-kpi-circle' />
									<FontAwesomeIcon
										icon={kpi.icon}
										className='fs-5 mb-3 opacity-75'
									/>
									<div className='fs-2 fw-bolder mb-1'>{kpi.value}</div>
									<div className='fs-7 fw-bold opacity-75'>{kpi.label}</div>
									<div className='fs-9 opacity-50 mt-2'>Top 5 accounts · Last 30 days</div>
								</div>
							</div>
						))}
					</div>

					{/* Accounts Grid */}
					<div className='meta-dashboard-card p-28'>
						<SectionHeader
							icon={faBuilding}
							iconBg='#eff6ff'
							iconColor='#3b82f6'
							title='Ad Accounts'
							count={displayAccounts.length}>
							<div className='d-flex align-items-center gap-2'>
								<StatusSelector
									value={statusFilter}
									onChange={setStatusFilter}
								/>
								<select
									className='form-select form-select-sm min-w-180 br-10 border-slate-200 fs-13 fw-500 text-slate-600 bg-slate-50 outline-none p-2'
									value={selectedBizId}
									onChange={(e) => handleBizChange(e.target.value)}>
									<option value=''>All Businesses</option>
									{businessList.map((b: any) => (
										<option
											key={b.id}
											value={b.id}>
											{b.name}
										</option>
									))}
								</select>
							</div>
						</SectionHeader>

						{loadingAccounts ? (
							<Loader text='Loading ad accounts…' />
						) : displayAccounts.length === 0 ? (
							<NoData
								icon={faBuilding}
								title='No Ad Accounts'
								sub='Connect your Facebook Business to get started.'
							/>
						) : (
							<div className='row g-3'>
								{displayAccounts.map((acc: any) => {
									const accId = acc.id || `act_${acc.account_id}`
									return (
										<div
											key={accId}
											className='col-md-4 col-lg-3'>
											<ItemCard
												selected={selectedAccountId === accId}
												onClick={() => handleAccountSelect(acc)}>
												<div className='d-flex align-items-center gap-3 mb-3'>
													<div
														className='section-icon-box br-12'
														style={{
															background:
																selectedAccountId === accId
																	? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
																	: '#f1f5f9',
															transition: 'all .2s',
														}}>
														<FontAwesomeIcon
															icon={faBuilding}
															className='fs-6'
															style={{
																color: selectedAccountId === accId ? '#fff' : '#64748b',
															}}
														/>
													</div>
													<div className='flex-grow-1 min-w-0'>
														<div
															className='fw-bold fs-7 text-slate-800 text-truncate-2 mb-1'
															style={{ lineHeight: '1.2' }}>
															{acc.name}
														</div>
														<div className='text-slate-400 fs-9'>{acc.account_id}</div>
													</div>
												</div>
												<div className='d-flex justify-content-between align-items-center'>
													<StatusDot status={acc.account_status === 1 ? 'ACTIVE' : 'PAUSED'} />
													{acc.business_name && (
														<span className='page-card-biz-badge text-truncate mw-100px'>
															{acc.business_name}
														</span>
													)}
												</div>
											</ItemCard>
										</div>
									)
								})}
							</div>
						)}
					</div>
				</>
			)}

			{/* ══════════════════════════════════════════════════════════════════
			    CAMPAIGNS
			    ══════════════════════════════════════════════════════════════════ */}
			{currentLevel === 'campaigns' && (
				<div className='meta-dashboard-card p-28'>
					{accountInsight && <InsightBar data={accountInsight} />}

					<SectionHeader
						icon={faChartBar}
						iconBg='#f0fdf4'
						iconColor='#22c55e'
						title='Campaigns'
						count={filteredCampaigns.length}
						onBack={goBack}>
						<div className='d-flex align-items-center gap-2'>
							<StatusSelector
								value={statusFilter}
								onChange={setStatusFilter}
							/>
							<SearchBox
								value={searchTerm}
								onChange={setSearchTerm}
								placeholder='Search campaigns…'
							/>
						</div>
					</SectionHeader>

					{loadingCampaigns ? (
						<Loader text='Loading campaigns…' />
					) : filteredCampaigns.length === 0 ? (
						<NoData
							icon={faChartBar}
							title='No Campaigns'
							sub='No campaigns found for this account.'
						/>
					) : (
						<>
							<div className='row g-3'>
								{filteredCampaigns.map((camp: any) => (
									<div
										key={camp.id}
										className='col-md-6 col-xl-4'>
										<ItemCard
											selected={selectedCampaignId === camp.id}
											onClick={() => handleCampaignSelect(camp)}>
											<div className='d-flex justify-content-between align-items-start mb-2'>
												<div className='flex-grow-1 min-w-0 me-2'>
													<div className='fw-bold fs-7 text-slate-800 mb-1 lh-sm text-truncate-2'>
														{camp.name}
													</div>
												</div>
												<StatusDot status={camp.configured_status} />
											</div>
											<div className='d-flex gap-2 flex-wrap'>
												{camp.objective && (
													<span className='badge badge-light-success px-3 py-2 fs-9 fw-bold br-6'>
														{camp.objective}
													</span>
												)}
												{camp.bid_strategy && (
													<span className='badge badge-light-warning px-3 py-2 fs-9 fw-bold br-6'>
														{camp.bid_strategy}
													</span>
												)}
											</div>
										</ItemCard>
									</div>
								))}
							</div>
							{campaignCursor && (
								<div className='d-flex justify-content-center mt-4'>
									<Btn
										variant='ghost'
										onClick={loadMoreCampaigns}>
										<FontAwesomeIcon icon={faPlus} /> Load More
									</Btn>
								</div>
							)}
						</>
					)}
				</div>
			)}

			{/* ══════════════════════════════════════════════════════════════════
			    AD SETS
			    ══════════════════════════════════════════════════════════════════ */}
			{currentLevel === 'adsets' && (
				<div className='meta-dashboard-card p-28'>
					{campaignInsight && <InsightBar data={campaignInsight} />}

					<SectionHeader
						icon={faLayerGroup}
						iconBg='#fefce8'
						iconColor='#eab308'
						title='Ad Sets'
						count={filteredAdSets.length}
						onBack={goBack}>
						<div className='d-flex align-items-center gap-2'>
							<StatusSelector
								value={statusFilter}
								onChange={setStatusFilter}
							/>
							<SearchBox
								value={searchTerm}
								onChange={setSearchTerm}
								placeholder='Search ad sets…'
							/>
						</div>
					</SectionHeader>

					{loadingAdSets ? (
						<Loader text='Loading ad sets…' />
					) : filteredAdSets.length === 0 ? (
						<NoData
							icon={faLayerGroup}
							title='No Ad Sets'
							sub='No ad sets in this campaign.'
						/>
					) : (
						<>
							<div className='overflow-auto'>
								<table className='w-100 border-collapse'>
									<thead>
										<tr>
											<th className='meta-table-th'>Name</th>
											<th className='meta-table-th'>Status</th>
											<th className='meta-table-th'>Bid Strategy</th>
											<th className='meta-table-th text-end'></th>
										</tr>
									</thead>
									<tbody>
										{filteredAdSets.map((adSet: any) => (
											<tr
												key={adSet.id}
												className={`meta-table-row ${
													selectedAdSetId === adSet.id ? 'selected' : ''
												}`}
												onClick={() => handleAdSetSelect(adSet)}>
												<td className='meta-table-td'>
													<div className='d-flex align-items-center gap-3'>
														<div className='section-icon-box br-8 bg-amber-50'>
															<FontAwesomeIcon
																icon={faLayerGroup}
																className='text-amber-500 fs-8'
															/>
														</div>
														<span className='fw-bold text-slate-800'>{adSet.name}</span>
													</div>
												</td>
												<td className='meta-table-td'>
													<StatusDot status={adSet.configured_status} />
												</td>
												<td className='meta-table-td text-slate-400'>
													{adSet.bid_strategy || '—'}
												</td>
												<td className='meta-table-td text-end'>
													<FontAwesomeIcon
														icon={faChevronRight}
														className='text-slate-300 fs-9'
													/>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{adSetCursor && (
								<div className='d-flex justify-content-center mt-4'>
									<Btn
										variant='ghost'
										onClick={loadMoreAdSets}>
										<FontAwesomeIcon icon={faPlus} /> Load More
									</Btn>
								</div>
							)}
						</>
					)}
				</div>
			)}

			{/* ══════════════════════════════════════════════════════════════════
			    ADS
			    ══════════════════════════════════════════════════════════════════ */}
			{currentLevel === 'ads' && (
				<div className='meta-dashboard-card p-28'>
					{adSetInsight && <InsightBar data={adSetInsight} />}

					<SectionHeader
						icon={faAd}
						iconBg='#fdf2f8'
						iconColor='#ec4899'
						title='Ads'
						count={filteredAds.length}
						onBack={goBack}>
						<div className='d-flex align-items-center gap-2'>
							<StatusSelector
								value={statusFilter}
								onChange={setStatusFilter}
							/>
							<SearchBox
								value={searchTerm}
								onChange={setSearchTerm}
								placeholder='Search ads…'
							/>
						</div>
					</SectionHeader>

					{loadingAds ? (
						<Loader text='Loading ads…' />
					) : filteredAds.length === 0 ? (
						<NoData
							icon={faAd}
							title='No Ads'
							sub='No ads found in this ad set.'
						/>
					) : (
						<>
							<div className='row g-3'>
								{filteredAds.map((ad: any) => (
									<div
										key={ad.id}
										className='col-md-6 col-xl-4'>
										<ItemCard
											selected={selectedAdId === ad.id}
											onClick={() => handleAdSelect(ad)}>
											<div className='d-flex justify-content-between align-items-start mb-2'>
												<div className='flex-grow-1 min-w-0 me-2'>
													<div className='fw-bold fs-7 text-slate-800 mb-1 text-truncate-2'>
														{ad.name}
													</div>
													<span className='text-slate-400 fs-9'>
														Active:{' '}
														{ad.ad_active_time
															? `${Math.floor(ad.ad_active_time / 86400)} days`
															: 'N/A'}
													</span>
												</div>
												<StatusDot status={ad.status} />
											</div>
											<div className='d-flex align-items-center gap-2 text-primary fs-7 fw-bold'>
												<FontAwesomeIcon
													icon={faUsers}
													className='fs-8'
												/>
												View Leads
											</div>
										</ItemCard>
									</div>
								))}
							</div>
							{adCursor && (
								<div className='d-flex justify-content-center mt-4'>
									<Btn
										variant='ghost'
										onClick={loadMoreAds}>
										<FontAwesomeIcon icon={faPlus} /> Load More
									</Btn>
								</div>
							)}
						</>
					)}
				</div>
			)}

			{/* ══════════════════════════════════════════════════════════════════
			    LEADS
			    ══════════════════════════════════════════════════════════════════ */}
			{currentLevel === 'leads' && (
				<>
					{/* Ad Insight */}
					{adInsight && (
						<div className='meta-dashboard-card p-28 mb-4'>
							<InsightBar data={adInsight} />
						</div>
					)}

					{/* Lead Summary Cards */}
					{leads.length > 0 && adInsight?.spend && (
						<div className='row g-4 mb-5'>
							{[
								{
									label: 'Total Leads',
									value: String(leads.length),
									gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
									icon: faUsers,
								},
								{
									label: 'Cost / Lead',
									value: fmt.inr(parseFloat(adInsight.spend) / leads.length),
									gradient: 'linear-gradient(135deg, #22c55e, #15803d)',
									icon: faCrosshairs,
								},
								{
									label: 'Total Spend',
									value: fmt.inr(adInsight.spend),
									gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
									icon: faCoins,
								},
							].map((s) => (
								<div
									key={s.label}
									className='col-md-4'>
									<div
										className='meta-kpi-card'
										style={{ background: s.gradient }}>
										<div className='meta-kpi-circle' />
										<FontAwesomeIcon
											icon={s.icon}
											className='fs-6 mb-2 opacity-75'
										/>
										<div className='fs-2 fw-800 mb-1'>{s.value}</div>
										<div className='fs-8 fw-500 opacity-75'>{s.label}</div>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Leads Table */}
					<div className='meta-dashboard-card p-28'>
						<SectionHeader
							icon={faUsers}
							iconBg='#ecfeff'
							iconColor='#06b6d4'
							title='Leads'
							count={leads.length}
							onBack={goBack}>
							{leadCursor && (
								<Btn
									variant='ghost'
									onClick={loadMoreLeads}>
									<FontAwesomeIcon icon={faRotate} /> Load More
								</Btn>
							)}
							<Btn
								variant='success'
								onClick={downloadExcel}
								disabled={leads.length === 0}>
								<FontAwesomeIcon icon={faDownload} /> Export
							</Btn>
						</SectionHeader>

						{loadingLeads ? (
							<Loader text='Loading leads…' />
						) : leads.length === 0 ? (
							<NoData
								icon={faUsers}
								title='No Leads'
								sub='This ad has no leads yet.'
							/>
						) : (
							<>
								<div className='overflow-auto'>
									<table className='w-100 border-collapse'>
										<thead>
											<tr>
												<th className='meta-table-th'>#</th>
												{uniqueFields.map((f) => (
													<th
														key={f}
														className='meta-table-th'>
														{f.replace(/_/g, ' ')}
													</th>
												))}
												<th className='meta-table-th'>Created</th>
												<th className='meta-table-th text-end'>Action</th>
											</tr>
										</thead>
										<tbody>
											{paginatedLeads.map((lead: any, i: number) => {
												const idx = (pagination.page - 1) * pagination.itemsPerPage + i + 1
												return (
													<tr
														key={lead.id}
														className='meta-table-row'>
														<td className='meta-table-td text-slate-400 fw-bold'>{idx}</td>
														{uniqueFields.map((field) => (
															<td
																key={field}
																className='meta-table-td'>
																<span className='fw-bold'>
																	{extractValue(lead.field_data, field) || '—'}
																</span>
															</td>
														))}
														<td className='meta-table-td text-slate-400 fs-9'>
															{lead.created_time
																? new Date(lead.created_time).toLocaleString('en-IN', {
																		day: '2-digit',
																		month: 'short',
																		year: 'numeric',
																		hour: '2-digit',
																		minute: '2-digit',
																  })
																: ''}
														</td>
														<td className='meta-table-td text-end'>
															<OverlayTrigger overlay={<Tooltip>View Details</Tooltip>}>
																<button
																	onClick={() => handleViewLead(lead)}
																	className='action-btn'>
																	<KTIcon
																		iconName='eye'
																		className='fs-5 text-primary'
																	/>
																</button>
															</OverlayTrigger>
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>

								{leads.length > pagination.itemsPerPage && (
									<div className='mt-4'>
										<UsersListPagination
											totalPages={Math.ceil(leads.length / pagination.itemsPerPage)}
											currentPage={pagination.page}
											onPageChange={(p) => setPagination({ ...pagination, page: p })}
										/>
									</div>
								)}
							</>
						)}
					</div>
				</>
			)}

			{/* ══════════════════════════════════════════════════════════════════
			    PAGES
			    ══════════════════════════════════════════════════════════════════ */}
			{currentLevel === 'pages' && (
				<div className='meta-dashboard-card p-28'>
					<SectionHeader
						icon={faFileLines}
						iconBg='#faf5ff'
						iconColor='#a855f7'
						title='Facebook Pages'
						count={pages.length}
						onBack={() => setCurrentLevel('overview')}
					/>
					{pages.length === 0 ? (
						<NoData
							icon={faFileLines}
							title='No Pages'
							sub='Connect Facebook to see pages.'
						/>
					) : (
						<div className='row g-4'>
							{pages.map((p: any) => (
								<PageCard
									key={p.page_id}
									page={p}
								/>
							))}
						</div>
					)}
				</div>
			)}

			{/* ══════════════════════════════════════════════════════════════════
			    LEAD DETAIL MODAL
			    ══════════════════════════════════════════════════════════════════ */}
			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(false)}
				size='lg'
				dialogClassName='modal-dialog-scrollable'>
				<Modal.Header
					closeButton
					className='border-0 modal-header-glass'>
					<Modal.Title>
						<div className='d-flex align-items-center gap-4'>
							<div className='section-icon-box section-icon-glass'>
								<FontAwesomeIcon
									icon={faUsers}
									className='text-white fs-4'
								/>
							</div>
							<div>
								<h4 className='fw-bolder text-dark m-0 fs-5'>
									{extractValue(selectedLead?.field_data, 'full_name') ||
										extractValue(selectedLead?.field_data, 'first_name') ||
										'Lead Details'}
								</h4>
								<div className='d-flex align-items-center gap-2 mt-2'>
									<span className='badge badge-light-dark px-2 py-1 fs-9 fw-bold'>
										ID: {selectedLead?.id?.slice(-8) || '—'}
									</span>
									{selectedLead?.created_time && (
										<span className='text-muted fs-8'>
											{new Date(selectedLead.created_time).toLocaleString('en-IN', {
												day: '2-digit',
												month: 'short',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</span>
									)}
								</div>
							</div>
						</div>
					</Modal.Title>
				</Modal.Header>

				<Modal.Body className='modal-body-custom'>
					<div className='modal-section'>
						<div className='d-flex align-items-center gap-2 mb-4'>
							<div className='section-icon-box section-icon-small bg-light-blue'>
								<FontAwesomeIcon
									icon={faUsers}
									className='text-primary fs-8'
								/>
							</div>
							<span className='fw-bold text-gray-800 fs-6'>Contact Information</span>
						</div>

						<div className='row g-3'>
							{uniqueFields.map((field) => {
								const val = extractValue(selectedLead?.field_data, field)
								const label = field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
								const isPhone = field === 'phone_number' || field === 'phone'

								return (
									<div
										key={field}
										className='col-md-6'>
										<div className='bg-white p-4 rounded-3 border border-gray-100'>
											<label className='text-muted fs-9 fw-bold text-uppercase ls-1 d-block mb-1'>
												{label}
											</label>
											{isPhone ? (
												<CopyableInput
													className='fv-row'
													label=''
													type='text'
													name='phone'
													htmlFor='phone'
													showLabel={false}
													value={val}
													disabled
												/>
											) : (
												<span className='fw-bold text-slate-800 fs-7 break-all'>{val || '—'}</span>
											)}
										</div>
									</div>
								)
							})}
						</div>
					</div>

					<div className='modal-section'>
						<div className='d-flex align-items-center gap-2 mb-4'>
							<div className='section-icon-box br-8 bg-light-pink'>
								<FontAwesomeIcon
									icon={faAd}
									className='text-pink fs-8'
								/>
							</div>
							<span className='fw-bold text-slate-700 fs-6'>Ad Information</span>
						</div>

						{loadingDetail ? (
							<Loader text='Loading…' />
						) : leadDetail ? (
							<div className='row g-3'>
								<div className='col-md-6'>
									<div className='bg-light-primary br-12 p-4'>
										<label className='text-primary fs-10 fw-700 text-uppercase ls-sm d-block mb-1'>
											Ad Name
										</label>
										<span className='fw-700 text-slate-800 fs-7'>{leadDetail.ad_name || '—'}</span>
									</div>
								</div>
								<div className='col-md-6'>
									<div className='bg-light-success br-12 p-4'>
										<label className='text-success fs-10 fw-700 text-uppercase ls-sm d-block mb-1'>
											Campaign
										</label>
										<span className='fw-700 text-slate-800 fs-7'>
											{leadDetail.campaign_name || '—'}
										</span>
									</div>
								</div>
								<div className='col-12'>
									<div className='d-flex gap-2 flex-wrap'>
										<span className='badge badge-light-dark px-3 py-2 fs-8 fw-600 br-8'>
											Platform:{' '}
											<strong className='ms-1'>{(leadDetail.platform || '—').toUpperCase()}</strong>
										</span>
										<span
											className={`badge px-3 py-2 fs-8 fw-600 br-8 ${
												leadDetail.is_organic ? 'badge-light-success' : 'badge-light-warning'
											}`}>
											{leadDetail.is_organic ? '🌱 Organic' : '💰 Paid'}
										</span>
									</div>
								</div>
								{leadDetail.form_id && (
									<div className='col-12'>
										<div className='bg-light-warning br-12 p-4'>
											<label className='text-warning fs-10 fw-700 text-uppercase ls-sm d-block mb-1'>
												Form ID
											</label>
											<CopyableInput
												className='fv-row'
												label=''
												type='text'
												name='form_id'
												htmlFor='form_id'
												showLabel={false}
												value={leadDetail.form_id}
												disabled
											/>
										</div>
									</div>
								)}
							</div>
						) : (
							<div className='bg-amber-50 br-12 p-4 d-flex align-items-center gap-3'>
								<FontAwesomeIcon
									icon={faAd}
									className='text-amber-500 fs-5'
								/>
								<span className='text-amber-800 fs-7 fw-500'>Ad detail not available.</span>
							</div>
						)}
					</div>
				</Modal.Body>

				<Modal.Footer className='border-0 modal-footer-slate'>
					<Btn
						variant='primary'
						size='md'
						onClick={() => setShowModal(false)}>
						Close
					</Btn>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export { MetaMarketingDashboard }
