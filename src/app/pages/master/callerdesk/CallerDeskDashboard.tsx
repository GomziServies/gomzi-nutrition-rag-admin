import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { FC, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import SelectFieldManual from '../../../components/SelectFieldManual'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import { GetFgiitAdmissionReport } from '../../../Functions/FGGroup/FgiitFollowUpReport'
import { GetGnSampleSelectedReports } from '../../../Functions/FGGroup/GnFollowUpReport'
import { getDashboardSummary, getMemberList } from '../../../Functions/FGGroup/IVR'
import SampleSelectedReportsTable from './SampleSelectedReportsTable'

// Panel deskphone → friendly name map
const DESKPHONE_MAP: Record<string, string> = {
	'08062985216': 'FGIIT',
	'08069247707': 'FWG',
	'08069220266': 'GN / GLS',
	'08062986681': 'Callback',
	'08062985138': 'New Outgoing',
}

const COMPANY_OPTIONS = [
	{ name: 'FGIIT', value: '08062985216' },
	{ name: 'FWG', value: '08069247707' },
	{ name: 'GLS', value: '08069220266' },
]

const COMPANY_MEMBERS: Record<string, { name: string; value: string }[]> = {
	'08062985216': [
		{ name: 'Ravi FGIIT', value: '08758759658' },
		{ name: 'FGIIT AZAZ', value: '8347383007' },
	],
	'08069247707': [
		{ name: 'Kaushik FWG', value: '09104984354' },
		{ name: 'Chirag', value: '07874601000' },
	],
	'08069220266': [
		{ name: 'Siddharth GLS', value: '08780127993' },
		{ name: 'Sahid GLS', value: '09924291998' },
	],
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface KpiCardProps {
	label: string
	value: string | number
	unit: string
	accentColor: string
}

interface SmallMetricCardProps {
	icon: React.ReactNode
	value: string | number
	label: string
	iconBg: string
	iconColor: string
}

interface ProgressBarProps {
	label: string
	pct: number
	barColor: string
	numColor: string
}

interface AgentRowProps {
	initials: string
	name: string
	pct: number
	calls: number
	avatarBg: string
	avatarColor: string
	barColor: string
	valColor: string
}

// ─── Dashboard Summary Type ────────────────────────────────────────────────────────────────
interface TopPerformer {
	name: string
	calls: number
	answered: number
	pct: number
}
interface DashboardSummary {
	total_calls?: number
	answered_calls?: number
	not_answered_calls?: number
	not_assigned_calls?: number
	voice_mail?: number
	welcome_sound?: number
	click_to_call?: number
	transferred_calls?: number
	total_talk_duration?: number
	total_queue_duration?: number
	unique_calls?: number
	live_calls?: number
	members_added?: number
	hours_efficiency?: {
		business_hours_pct: number
		non_business_hours_pct: number
		business_hours_calls: number
		non_business_hours_calls: number
	}
	top_performers?: TopPerformer[]
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IncomingCallIcon = () => (
	<svg
		width='20'
		height='20'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2'
		strokeLinecap='round'
		strokeLinejoin='round'>
		<path d='M16 2v4h4' />
		<path d='M21 2l-5 5' />
		<path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' />
	</svg>
)

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: FC<KpiCardProps> = ({ label, value, unit, accentColor }) => (
	<div
		style={{
			background: '#fff',
			border: '1px solid #e2e8f0',
			borderRadius: 14,
			padding: '24px 20px',
			position: 'relative',
			overflow: 'hidden',
			flex: 1,
			boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
		}}>
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: 4,
				height: '100%',
				borderRadius: '4px 0 0 4px',
				background: accentColor,
			}}
		/>
		<div
			style={{
				fontSize: 12,
				color: '#94a3b8',
				fontWeight: 600,
				textTransform: 'uppercase',
				letterSpacing: '0.4px',
				marginBottom: 8,
			}}>
			{label}
		</div>
		<div
			style={{
				fontFamily: "'JetBrains Mono', monospace",
				fontSize: 32,
				fontWeight: 500,
				color: '#1e293b',
				lineHeight: 1,
			}}>
			{value}
			<span style={{ fontSize: 14, color: '#94a3b8', marginLeft: 4, fontWeight: 400 }}>{unit}</span>
		</div>
	</div>
)

// ─── Small Metric Card ────────────────────────────────────────────────────────
const SmallMetricCard: FC<SmallMetricCardProps> = ({ icon, value, label, iconBg, iconColor }) => (
	<div
		style={{
			background: '#fff',
			border: '1px solid #f1f5f9',
			borderRadius: 12,
			padding: '16px',
			display: 'flex',
			alignItems: 'center',
			gap: 14,
			boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
		}}>
		<div
			style={{
				width: 34,
				height: 34,
				borderRadius: '50%',
				background: iconBg,
				color: iconColor,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}>
			<div style={{ transform: 'scale(0.9)' }}>{icon}</div>
		</div>
		<div style={{ display: 'flex', flexDirection: 'column' }}>
			<div
				style={{
					fontFamily: "'Inter', sans-serif",
					fontSize: 22,
					fontWeight: 700,
					color: '#1e293b',
					lineHeight: 1,
					marginBottom: 3,
				}}>
				{value}
			</div>
			<div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{label}</div>
		</div>
	</div>
)

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar: FC<ProgressBarProps> = ({ label, pct, barColor, numColor }) => (
	<div style={{ marginBottom: 16 }}>
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: 6,
			}}>
			<span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{label}</span>
			<span
				style={{
					fontFamily: "'JetBrains Mono', monospace",
					fontSize: 11,
					fontWeight: 500,
					color: numColor,
				}}>
				{pct}%
			</span>
		</div>
		<div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
			<div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: barColor }} />
		</div>
	</div>
)

// ─── Agent Row ────────────────────────────────────────────────────────────────
const AgentRow: FC<AgentRowProps> = ({
	initials,
	name,
	pct,
	calls,
	avatarBg,
	avatarColor,
	barColor,
	valColor,
}) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			gap: 10,
			padding: 10,
			background: '#f8fafc',
			borderRadius: 10,
			border: '1px solid #f1f5f9',
		}}>
		<div
			style={{
				width: 34,
				height: 34,
				borderRadius: '50%',
				flexShrink: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: 12,
				fontWeight: 700,
				background: avatarBg,
				color: avatarColor,
			}}>
			{initials}
		</div>

		<div style={{ flex: 1 }}>
			<div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{name}</div>
			<div
				style={{
					height: 4,
					background: '#e2e8f0',
					borderRadius: 99,
					marginTop: 5,
					overflow: 'hidden',
				}}>
				<div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 99 }} />
			</div>
		</div>

		<div
			style={{
				fontFamily: "'JetBrains Mono', monospace",
				fontSize: 12,
				fontWeight: 500,
				color: valColor,
			}}>
			{pct}%
		</div>

		<div
			style={{
				fontSize: 10,
				color: '#94a3b8',
				background: '#fff',
				padding: '2px 7px',
				borderRadius: 5,
				border: '1px solid #e2e8f0',
			}}>
			{calls} calls
		</div>
	</div>
)

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
	<div
		style={{
			background: '#fff',
			border: '1px solid #e2e8f0',
			borderRadius: 14,
			padding: '24px 20px',
			flex: 1,
			animation: 'pulse 1.5s ease-in-out infinite',
		}}>
		<div
			style={{ height: 12, background: '#f1f5f9', borderRadius: 6, marginBottom: 12, width: '60%' }}
		/>
		<div style={{ height: 32, background: '#f1f5f9', borderRadius: 6, width: '40%' }} />
	</div>
)

// ─── Main Dashboard ───────────────────────────────────────────────────────────
interface CallerDeskDashboardProps {
	defaultDeskphone?: string // If set, locks to this panel's deskphone
}

const CallerDeskDashboardV2: FC<CallerDeskDashboardProps> = ({ defaultDeskphone }) => {
	const navigate = useNavigate()
	// Session storage key — panel-specific so FGIIT/FWG/GLS each have their own saved state
	const SESSION_KEY = `callerdesk_filters_${defaultDeskphone || 'master'}`

	const restoreFilters = () => {
		try {
			const saved = sessionStorage.getItem(SESSION_KEY)
			if (saved) return JSON.parse(saved)
		} catch {
			/* ignore */
		}
		return null
	}

	const saved = restoreFilters()

	const [salesPerson, setSalesPerson] = useState(saved?.salesPerson || '')
	const [selectedCompany, setSelectedCompany] = useState(saved?.selectedCompany || '')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		if (saved?.dateRange) {
			try {
				const [s, e] = saved.dateRange
				return [new Date(s), new Date(e)]
			} catch {
				/* ignore */
			}
		}
		return null // Let DateFilter handle the default/restoration
	})
	const [summary, setSummary] = useState<DashboardSummary>({})
	const [isLoading, setIsLoading] = useState(true)
	const [membersCount, setMembersCount] = useState<number>(0)

	const [salesPersons, setSalesPersons] = useState<{ name: string; value: string }[]>([])
	const [allApiMembers, setAllApiMembers] = useState<{ name: string; value: string }[]>([])
	const [admissionData, setAdmissionData] = useState<any[]>([])
	const [admissionCount, setAdmissionCount] = useState<number>(0)
	const [sampleCount, setSampleCount] = useState<number>(0)
	const [isAdmissionLoading, setIsAdmissionLoading] = useState(false)
	const [isSampleLoading, setIsSampleLoading] = useState(false)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 5 })
	const isFirstRender = useRef(true)

	const days = [
		{ label: 'Mon', height: 30, active: false },
		{ label: 'Tue', height: 55, active: true },
		{ label: 'Wed', height: 40, active: false },
		{ label: 'Thu', height: 70, active: true },
		{ label: 'Fri', height: 45, active: false },
		{ label: 'Sat', height: 20, active: false },
		{ label: 'Sun', height: 15, active: false },
	]

	const fetchIdRef = useRef(0)

	const fetchDashboardData = async (dateRange?: [Date, Date] | null) => {
		const currentFetchId = ++fetchIdRef.current
		setIsLoading(true)
		try {
			// Format dates for CallerDesk API (YYYY-MM-DD) in local timezone
			const fmt = (d: Date) => {
				const y = d.getFullYear()
				const m = String(d.getMonth() + 1).padStart(2, '0')
				const day = String(d.getDate()).padStart(2, '0')
				return `${y}-${m}-${day}`
			}
			const range = dateRange ?? selectedDateRange
			const params: any = {}
			if (range) {
				params.start_date = fmt(range[0])
				params.end_date = fmt(range[1])
			}
			if (salesPerson) {
				// Strip leading 0 — CallerDesk member_num filter expects number without leading 0
				params.member_num = salesPerson.replace(/^0+/, '')
			}
			// If panel-specific, filter by deskphone. Otherwise use selectedCompany if available.
			if (defaultDeskphone) {
				params.deskphone = defaultDeskphone
			} else if (selectedCompany) {
				params.deskphone = selectedCompany
				// If company is selected and no specific member is chosen, restrict to company members
				if (!salesPerson && COMPANY_MEMBERS[selectedCompany]) {
					// Normalize numbers — strip leading 0s so CallerDesk member_num filter works
					params.allowed_members = COMPANY_MEMBERS[selectedCompany].map((m) =>
						m.value.replace(/^0+/, '')
					)
				}
			}

			const [summaryResult, membersResult] = await Promise.allSettled([
				getDashboardSummary(params),
				getMemberList(1),
			])

			if (currentFetchId !== fetchIdRef.current) return

			if (summaryResult.status === 'fulfilled') {
				const res = summaryResult.value as any
				// Backend get-summary now always returns: { data: { total_calls, ... } }
				const data = res?.data ?? res ?? {}
				setSummary(data)
			}

			let capturedMemberData: any[] = []
			if (membersResult.status === 'fulfilled') {
				const res = membersResult.value as any
				const memberData = res?.getmember ?? res?.data ?? (Array.isArray(res) ? res : [])
				const count = Array.isArray(memberData)
					? memberData.length
					: res?.total_record ?? res?.total ?? 0
				setMembersCount(count)

				if (Array.isArray(memberData)) {
					capturedMemberData = memberData
					const mappedMembers = memberData.map((m: any) => ({
						name: m.name || m.member_name || 'Unknown',
						value: m.number || m.member_num || m.num || m.id || m.name || 'unknown',
					}))
					// Store full API member list for cross-referencing later
					setAllApiMembers(mappedMembers)
				}
			}

			// Also refresh admission data whenever dashboard data is refreshed
			// Resolve member name here to ensure fetchAdmissionData has it immediately
			let memberName = ''
			if (salesPerson && capturedMemberData.length > 0) {
				const person = capturedMemberData.find(
					(m: any) => (m.number || m.member_num || m.num || m.id || m.name) === salesPerson
				)
				if (person) memberName = person.name || person.member_name
			}
			fetchAdmissionData(range, memberName)
			fetchSampleCount(range)
		} finally {
			if (currentFetchId === fetchIdRef.current) {
				setIsLoading(false)
			}
		}
	}

	const fetchAdmissionData = async (dateRange?: [Date, Date] | null, memberFilterName?: string) => {
		// Only fetch admissions if FGIIT is selected
		const isFgiit = selectedCompany === '08062985216' || defaultDeskphone === '08062985216'
		if (!isFgiit) {
			setAdmissionData([])
			setAdmissionCount(0)
			return
		}

		setIsAdmissionLoading(true)
		try {
			const range = dateRange ?? selectedDateRange
			const fmt = (d: Date) => {
				const y = d.getFullYear()
				const m = String(d.getMonth() + 1).padStart(2, '0')
				const day = String(d.getDate()).padStart(2, '0')
				return `${y}-${m}-${day}`
			}

			const queryArgs: any = {
				limit: 5,
				page: 1,
				sort: 'callDate',
				sortOrder: 'desc',
			}

			if (range) {
				queryArgs.start_date = fmt(range[0])
				queryArgs.end_date = fmt(range[1])
			}

			if (memberFilterName) {
				queryArgs.telecaller_name = memberFilterName
			} else if (salesPerson) {
				const selectedPerson = salesPersons.find((p) => p.value === salesPerson)
				if (
					selectedPerson &&
					selectedPerson.name !== 'All Members' &&
					selectedPerson.name !== 'All Sales Persons'
				) {
					queryArgs.telecaller_name = selectedPerson.name
				}
			}

			const res: any = await GetFgiitAdmissionReport(queryArgs)

			if (res.status === 200 && res.data) {
				const admissionEntries = Array.isArray(res.data?.data)
					? res.data.data
					: Array.isArray(res.data)
					? res.data
					: []
				setAdmissionData(admissionEntries)

				// Extract total count from pagination metadata
				const total =
					res.metadata?.pagination?.totalRecord ||
					res.metadata?.pagination?.totalDocs ||
					res.customCode?.pagination?.totalRecord ||
					res.data?.metadata?.pagination?.totalRecord ||
					res.data?.total ||
					admissionEntries.length

				setAdmissionCount(total)
			}
		} catch (err) {
			console.error('Error fetching admission data:', err)
		} finally {
			setIsAdmissionLoading(false)
		}
	}

	const fetchSampleCount = async (dateRange?: [Date, Date] | null) => {
		const isGls = selectedCompany === '08069220266' || defaultDeskphone === '08069220266'
		if (!isGls) {
			setSampleCount(0)
			return
		}

		setIsSampleLoading(true)
		try {
			const range = dateRange ?? selectedDateRange
			const fmt = (d: Date) => {
				const y = d.getFullYear()
				const m = String(d.getMonth() + 1).padStart(2, '0')
				const day = String(d.getDate()).padStart(2, '0')
				return `${y}-${m}-${day}`
			}

			const queryArgs: any = {
				limit: 100, // Fetch more to sum samples
				sort: 'callDate',
				sortOrder: 'desc',
			}

			if (range) {
				queryArgs.start_date = fmt(range[0])
				queryArgs.end_date = fmt(range[1])
			}

			if (salesPerson) {
				const selectedPerson = salesPersons.find((p) => p.value === salesPerson)
				if (
					selectedPerson &&
					selectedPerson.name !== 'All Members' &&
					selectedPerson.name !== 'All Sales Persons'
				) {
					queryArgs.search = selectedPerson.name
				}
			}

			const res: any = await GetGnSampleSelectedReports(queryArgs)

			if (res.status === 200 && res.data) {
				const reports = Array.isArray(res.data?.data)
					? res.data.data
					: Array.isArray(res.data)
					? res.data
					: []

				let total = 0
				reports.forEach((r: any) => {
					if (Array.isArray(r.callHistory) && range) {
						const start = new Date(range[0])
						start.setHours(0, 0, 0, 0)
						const end = new Date(range[1])
						end.setHours(23, 59, 59, 999)

						// Find the latest call within the range that has samples
						const latestCallWithSamples = [...r.callHistory].reverse().find((h: any) => {
							const callDate = new Date(h.callDate)
							return (
								callDate >= start &&
								callDate <= end &&
								Array.isArray(h.sampleSelection?.selected_samples) &&
								h.sampleSelection.selected_samples.length > 0
							)
						})

						if (latestCallWithSamples) {
							total += latestCallWithSamples.sampleSelection.selected_samples.length
						}
					}
				})
				setSampleCount(total)
			}
		} catch (err) {
			console.error('Error fetching sample count:', err)
		} finally {
			setIsSampleLoading(false)
		}
	}

	const formatDate = (date: any) => {
		if (!date) return '—'
		try {
			return new Date(date).toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
			})
		} catch (e) {
			return '—'
		}
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const sortableFields = [
		{ title: 'Full Name', field: 'admission.firstName' },
		{ title: 'Sales Person Name', field: 'salesPersonName' },
		{ title: 'Date', field: 'callDate' },
	]

	useEffect(() => {
		fetchDashboardData()
	}, [salesPerson, selectedCompany, selectedDateRange]) // Refetch when salesPerson, selectedCompany, or dateRange changes

	// Persist filters to sessionStorage whenever they change
	useEffect(() => {
		const toSave = {
			selectedCompany,
			salesPerson,
			dateRange: selectedDateRange
				? [selectedDateRange[0].toISOString(), selectedDateRange[1].toISOString()]
				: null,
		}
		try {
			sessionStorage.setItem(SESSION_KEY, JSON.stringify(toSave))
		} catch {
			/* ignore */
		}
	}, [selectedCompany, salesPerson, selectedDateRange])

	// When API members load or company/defaultDeskphone changes, populate the sales person dropdown
	useEffect(() => {
		if (allApiMembers.length === 0) return

		const normalizeNum = (n: string) => n.replace(/^0+/, '').replace(/^91/, '')

		// Determine which DID to filter by — defaultDeskphone takes priority
		const activeDeskphone = defaultDeskphone || selectedCompany

		if (activeDeskphone && COMPANY_MEMBERS[activeDeskphone]) {
			const companyNumbers = COMPANY_MEMBERS[activeDeskphone].map((m) => normalizeNum(m.value))
			const apiFiltered = allApiMembers.filter((m) =>
				companyNumbers.includes(normalizeNum(m.value))
			)
			const memberList = apiFiltered.length > 0 ? apiFiltered : COMPANY_MEMBERS[activeDeskphone]
			setSalesPersons(memberList)
		} else if (!selectedCompany) {
			// No company selected and no locked deskphone — show all API members
			setSalesPersons(allApiMembers)
		}
	}, [allApiMembers, selectedCompany, defaultDeskphone])

	// Reset sales person when company changes (skip on first render to keep restored filters)
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		setSalesPerson('')
	}, [selectedCompany])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	// Restore initial date for DateFilter from sessionStorage
	const restoredDateRange: [Date, Date] | null = (() => {
		if (saved?.dateRange) {
			try {
				const [s, e] = saved.dateRange
				return [new Date(s), new Date(e)] as [Date, Date]
			} catch {
				/* ignore */
			}
		}
		return null
	})()

	// Compute derived values
	const totalCalls = summary.total_calls ?? 0
	const answeredCalls = summary.answered_calls ?? 0
	const talkMinutes = summary.total_talk_duration ? Math.round(summary.total_talk_duration / 60) : 0
	const queueMinutes = summary.total_queue_duration
		? Math.round(summary.total_queue_duration / 60)
		: 0
	const uniqueCalls = summary.unique_calls ?? 0
	const slaCompliance = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0

	// Real hours efficiency from API — fallback to computed if not available
	const businessHoursPct =
		summary.hours_efficiency?.business_hours_pct ??
		(totalCalls > 0 ? Math.min(100, Math.round((answeredCalls / totalCalls) * 100)) : 0)
	const nonBusinessHoursPct =
		summary.hours_efficiency?.non_business_hours_pct ?? 100 - businessHoursPct

	// Real top performers from API — fallback to empty
	const topPerformers: TopPerformer[] = summary.top_performers ?? []

	return (
		<div
			style={{
				background: '#f8fafc',
				padding: 20,
				borderRadius: 16,
				fontFamily: "'Inter', sans-serif",
				minHeight: '100vh',
			}}>
			<PageTitle breadcrumbs={[]}>
				{defaultDeskphone
					? `Caller Desk — ${DESKPHONE_MAP[defaultDeskphone] || defaultDeskphone}`
					: 'Admin Dashboard'}
			</PageTitle>

			{/* Google Fonts */}
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.5; }
				}
			`}</style>

			{/* ── Header with Filters ── */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 24,
					flexWrap: 'wrap',
					gap: 16,
				}}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<span
						style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
						Call Analytics Dashboard
					</span>
					<span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
						Real-time overview · Insights based on filters
					</span>
				</div>

				<div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
					{/* Filters Section */}
					<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
						{!defaultDeskphone && (
							<div style={{ width: '190px' }}>
								<SelectFieldManual
									className='fv-row'
									label='Company'
									showLabel={false}
									name='selectedCompany'
									value={selectedCompany}
									onChange={(e) => setSelectedCompany(e.target.value)}
									htmlFor='selectedCompany'
									marginRemove={true}
									options={COMPANY_OPTIONS}
									defaultOptionValue=''
								/>
							</div>
						)}
						{(selectedCompany || defaultDeskphone) && (
							<div style={{ width: '190px' }}>
								<SelectFieldManual
									className='fv-row'
									label='Sales Person'
									showLabel={false}
									name='salesPerson'
									value={salesPerson}
									onChange={(e) => setSalesPerson(e.target.value)}
									htmlFor='salesPerson'
									marginRemove={true}
									options={salesPersons}
									defaultOptionValue=''
								/>
							</div>
						)}
						<div style={{ width: '240px' }}>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>

					<div style={{ display: 'flex', gap: 8 }}>
						<button
							onClick={() => fetchDashboardData()}
							style={{
								fontSize: 11,
								fontWeight: 600,
								padding: '7px 18px',
								borderRadius: 10,
								cursor: 'pointer',
								border: 'none',
								background: '#3b82f6',
								color: '#fff',
							}}>
							{isLoading ? 'Loading...' : 'Refresh'}
						</button>
					</div>
				</div>
			</div>

			{/* ── KPI Strip ── */}
			<div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
				{isLoading ? (
					<>
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
						{(selectedCompany === '08062985216' || defaultDeskphone === '08062985216') && (
							<SkeletonCard />
						)}
					</>
				) : (
					<>
						<KpiCard
							label='Total Calls'
							value={totalCalls}
							unit='calls'
							accentColor='#3b82f6'
						/>
						{(selectedCompany === '08069220266' || defaultDeskphone === '08069220266') && (
							<KpiCard
								label='Selected Samples'
								value={isSampleLoading ? '...' : sampleCount}
								unit='sample'
								accentColor='#ec4899'
							/>
						)}

						{(selectedCompany === '08062985216' || defaultDeskphone === '08062985216') && (
							<KpiCard
								label='Admission Form'
								value={isAdmissionLoading ? '...' : admissionCount}
								unit='forms'
								accentColor='#f472b6'
							/>
						)}

						<KpiCard
							label='Talk Duration'
							value={talkMinutes}
							unit='min'
							accentColor='#8b5cf6'
						/>
						<KpiCard
							label='Queue Duration'
							value={queueMinutes}
							unit='min'
							accentColor='#06b6d4'
						/>
						<KpiCard
							label='Unique Calls'
							value={uniqueCalls}
							unit='calls'
							accentColor='#10b981'
						/>
						<KpiCard
							label='Members'
							value={membersCount}
							unit='members'
							accentColor='#f59e0b'
						/>
					</>
				)}
			</div>

			{/* ── Overview Section ── */}
			<div style={{ marginBottom: 20 }}>
				{/* Detailed Grid */}
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: 12,
					}}>
					<SmallMetricCard
						icon={<IncomingCallIcon />}
						value={isLoading ? '—' : totalCalls}
						label='Total Calls'
						iconBg='#f5f3ff'
						iconColor='#7c3aed'
					/>
					<SmallMetricCard
						icon={<IncomingCallIcon />}
						value={isLoading ? '—' : answeredCalls}
						label='Answered'
						iconBg='#f0fdf4'
						iconColor='#16a34a'
					/>
					<SmallMetricCard
						icon={<IncomingCallIcon />}
						value={isLoading ? '—' : summary.not_answered_calls ?? 0}
						label='Not Answered'
						iconBg='#fff1f2'
						iconColor='#e11d48'
					/>
					<SmallMetricCard
						icon={<IncomingCallIcon />}
						value={isLoading ? '—' : summary.not_assigned_calls ?? 0}
						label='Not Assigned'
						iconBg='#fff7ed'
						iconColor='#d97706'
					/>

					<SmallMetricCard
						icon={<IncomingCallIcon />}
						value={isLoading ? '—' : summary.voice_mail ?? 0}
						label='Voice Mail'
						iconBg='#ecfeff'
						iconColor='#0891b2'
					/>
					<SmallMetricCard
						icon={<IncomingCallIcon />}
						value={isLoading ? '—' : summary.welcome_sound ?? 0}
						label='Welcome Sound'
						iconBg='#fdf2f8'
						iconColor='#db2777'
					/>
					<SmallMetricCard
						icon={<IncomingCallIcon />}
						value={isLoading ? '—' : summary.click_to_call ?? 0}
						label='Click to Call'
						iconBg='#fefce8'
						iconColor='#eab308'
					/>
					<SmallMetricCard
						icon={<IncomingCallIcon />}
						value={isLoading ? '—' : summary.transferred_calls ?? 0}
						label='Transferred'
						iconBg='#f0fdf4'
						iconColor='#15803d'
					/>
				</div>
			</div>

			{/* ── Bottom Grid ── */}
			<div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.4fr', gap: 12 }}>
				{/* SLA Breakdown */}
				<div
					style={{
						background: '#fff',
						border: '1px solid #e2e8f0',
						borderRadius: 16,
						padding: 20,
					}}>
					<div
						style={{
							fontSize: 11,
							fontWeight: 700,
							color: '#475569',
							textTransform: 'uppercase',
							letterSpacing: '0.5px',
							marginBottom: 16,
						}}>
						SLA Metrics
					</div>

					<div
						style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
						{[
							{
								num: answeredCalls,
								label: '✓ Answered',
								bg: '#f0fdf4',
								numColor: '#16a34a',
								txtColor: '#059669',
							},
							{
								num: summary.not_answered_calls ?? 0,
								label: '✗ Unanswered',
								bg: '#fef2f2',
								numColor: '#dc2626',
								txtColor: '#b91c1c',
							},
							{
								num: summary.not_assigned_calls ?? 0,
								label: '⊘ Not Assigned',
								bg: '#f8fafc',
								numColor: '#64748b',
								txtColor: '#475569',
							},
							{
								num: 0,
								label: '↩ Abandoned',
								bg: '#faf5ff',
								numColor: '#7c3aed',
								txtColor: '#6b21a8',
							},
						].map((s, i) => (
							<div
								key={i}
								style={{
									borderRadius: 12,
									padding: '14px 12px',
									background: s.bg,
									display: 'flex',
									flexDirection: 'column',
									gap: 6,
								}}>
								<div
									style={{
										fontFamily: "'JetBrains Mono', monospace",
										fontSize: 28,
										fontWeight: 500,
										lineHeight: 1,
										color: s.numColor,
									}}>
									{isLoading ? '—' : s.num}
								</div>
								<div style={{ fontSize: 10, fontWeight: 700, color: s.txtColor }}>{s.label}</div>
							</div>
						))}
					</div>

					<div>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 8,
							}}>
							<span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
								SLA Compliance
							</span>
							<span
								style={{
									fontFamily: "'JetBrains Mono', monospace",
									fontSize: 15,
									fontWeight: 600,
									color: '#3b82f6',
								}}>
								{isLoading ? '—' : `${slaCompliance}%`}
							</span>
						</div>
						<div
							style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
							<div
								style={{
									width: `${slaCompliance}%`,
									height: '100%',
									borderRadius: 99,
									background: '#3b82f6',
									transition: 'width 0.8s ease',
								}}
							/>
						</div>
					</div>
				</div>

				{/* Work Time + Bar Chart */}
				<div
					style={{
						background: '#fff',
						border: '1px solid #e2e8f0',
						borderRadius: 16,
						padding: 20,
					}}>
					<div
						style={{
							fontSize: 11,
							fontWeight: 700,
							color: '#475569',
							textTransform: 'uppercase',
							letterSpacing: '0.5px',
							marginBottom: 18,
						}}>
						Hours Efficiency
					</div>

					<ProgressBar
						label='Business Hours'
						pct={businessHoursPct}
						barColor='#3b82f6'
						numColor='#3b82f6'
					/>
					<ProgressBar
						label='Non-Business Hours'
						pct={nonBusinessHoursPct}
						barColor='#8b5cf6'
						numColor='#8b5cf6'
					/>

					<div
						style={{
							fontSize: 11,
							fontWeight: 700,
							color: '#475569',
							textTransform: 'uppercase',
							letterSpacing: '0.5px',
							margin: '18px 0 10px',
						}}>
						Daily Peak Load
					</div>

					{/* Bar Chart */}
					<div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
						{days.map((d) => (
							<div
								key={d.label}
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 6,
									flex: 1,
								}}>
								<div
									style={{
										width: '100%',
										height: d.height,
										borderRadius: '6px 6px 0 0',
										background: d.active ? '#3b82f6' : '#e2e8f0',
									}}
								/>
								<span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>{d.label}</span>
							</div>
						))}
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
						<span
							style={{
								fontSize: 10,
								fontWeight: 800,
								color: '#059669',
								background: '#ecfdf5',
								padding: '3px 8px',
								borderRadius: 6,
							}}>
							↑ 8.3%
						</span>
						<span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
							vs previous week
						</span>
					</div>
				</div>

				{/* Agent Performance */}
				<div
					style={{
						background: '#fff',
						border: '1px solid #e2e8f0',
						borderRadius: 16,
						padding: 20,
					}}>
					<div
						style={{
							fontSize: 11,
							fontWeight: 700,
							color: '#475569',
							textTransform: 'uppercase',
							letterSpacing: '0.5px',
							marginBottom: 16,
						}}>
						Top Performers
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
						{topPerformers.length === 0 ? (
							<div
								style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
								{isLoading ? 'Loading...' : 'No data available'}
							</div>
						) : (
							topPerformers.map((p, i) => {
								const palette = [
									{
										avatarBg: '#dbeafe',
										avatarColor: '#1e40af',
										barColor: '#10b981',
										valColor: '#059669',
									},
									{
										avatarBg: '#ede9fe',
										avatarColor: '#5b21b6',
										barColor: '#3b82f6',
										valColor: '#2563eb',
									},
									{
										avatarBg: '#f1f5f9',
										avatarColor: '#475569',
										barColor: '#f59e0b',
										valColor: '#b45309',
									},
									{
										avatarBg: '#fdf2f8',
										avatarColor: '#be185d',
										barColor: '#ec4899',
										valColor: '#be185d',
									},
									{
										avatarBg: '#f0fdf4',
										avatarColor: '#15803d',
										barColor: '#22c55e',
										valColor: '#15803d',
									},
								]
								const c = palette[i % palette.length]
								const initials = p.name
									.split(' ')
									.map((w: string) => w[0])
									.join('')
									.toUpperCase()
									.slice(0, 2)
								return (
									<AgentRow
										key={p.name}
										initials={initials}
										name={p.name}
										pct={p.pct}
										calls={p.calls}
										avatarBg={c.avatarBg}
										avatarColor={c.avatarColor}
										barColor={c.barColor}
										valColor={c.valColor}
									/>
								)
							})
						)}
					</div>
				</div>
			</div>

			{/* ── Latest Admissions Table (FGIIT only) ── */}
			{(selectedCompany === '08062985216' || defaultDeskphone === '08062985216') && (
				<div
					style={{
						marginTop: 20,
						background: '#fff',
						border: '1px solid #e2e8f0',
						borderRadius: 16,
						padding: 20,
					}}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 16,
						}}>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<span
								style={{
									fontSize: 11,
									fontWeight: 700,
									color: '#475569',
									textTransform: 'uppercase',
									letterSpacing: '0.5px',
								}}>
								Latest Admission Forms
							</span>
							<span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
								{salesPerson
									? `Recent entries for ${
											salesPersons.find((p) => p.value === salesPerson)?.name || 'selected member'
									  }`
									: 'Most recent 5 entries across all members'}
							</span>
						</div>
						<div className='d-flex align-items-center gap-2'>
							<button
								onClick={() =>
									navigate(
										defaultDeskphone === '08062985216'
											? '/fgiit-tele-sales/caller-desk-admission-form'
											: '/master/caller-desk-admission-form'
									)
								}
								style={{
									fontSize: 12,
									fontWeight: 600,
									padding: '8px 24px',
									borderRadius: 8,
									cursor: 'pointer',
									border: 'none',
									background: '#3E97FF',
									color: '#fff',
								}}>
								More
							</button>
						</div>
					</div>

					<div className='table-responsive'>
						<Table
							data={admissionData}
							columns={sortableFields}
							sort='callDate'
							sortOrder='desc'
							onSortChange={() => {}}
							removeAction={false}
							disableSortFields={['recordingUrl', 'mobile', 'salesPersonName']}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={index}>
									<tr
										className='data-row'
										onClick={() => handleRowClick(index.toString())}>
										<td className='text-center'>
											<div
												className='d-flex ms-8'
												role='button'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{item.clientName}
												</span>
												<span className='text-muted fs-7'>{item.mobile || '—'}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{item.salesPersonName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{formatDate(item.callDate || item.admission?.dateOfBirth)}
											</span>
										</td>

										<td>
											<TableButton
												action='view'
												to={`/master/caller-desk-admission-view?id=${item.reportId}`}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={7}>
												<div>
													<div className='d-flex align-items-center mb-2'>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold fs-6'>
																{item.admission?.firstName} {item.admission?.lastName}
															</span>
															<span className='text-muted fw-semibold d-flex fs-7'>
																{item.mobile}
															</span>
														</div>
													</div>
													<strong>{sortableFields[1].title}:</strong> {item.salesPersonName}
													<br />
													<strong>{sortableFields[2].title}:</strong>{' '}
													{formatDate(item.callDate || item.admission?.dateOfBirth)}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={isAdmissionLoading}
						/>
					</div>
				</div>
			)}

			{/* ── Sample Selected Reports Table (GLS only) ── */}
			{(selectedCompany === '08069220266' || defaultDeskphone === '08069220266') && (
				<SampleSelectedReportsTable />
			)}
		</div>
	)
}

const CallerDeskDashboardV2Wrapper: FC<{ defaultDeskphone?: string }> = ({ defaultDeskphone }) => (
	<CallerDeskDashboardV2 defaultDeskphone={defaultDeskphone} />
)

export { CallerDeskDashboardV2Wrapper }
