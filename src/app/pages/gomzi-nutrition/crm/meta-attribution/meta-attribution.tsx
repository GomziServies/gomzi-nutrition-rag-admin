import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faChartPie,
	faFileExcel,
	faSync,
	faBullhorn,
	faCheckCircle,
	faIndianRupeeSign,
	faArrowTrendUp,
	faFire,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { faMeta, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import SearchFilter from '../../../../components/SearchFilter'
import { GetFacebookLeads } from '../../../../Functions/FGGroup'
import toast from 'react-hot-toast'
import '../crm-theme.css'

export const MetaAttribution: React.FC = () => {
	const [leads, setLeads] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')

	const fetchAdAttribution = async () => {
		setLoading(true)
		try {
			const res = await GetFacebookLeads({
				tag: 'rag_nutrition',
				limit: 3000,
			})
			setLeads(res?.data?.leads || [])
		} catch (err) {
			console.error('Error fetching ad attribution data:', err)
			toast.error('Failed to load Meta Ads attribution data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAdAttribution()
	}, [])

	// Group Leads by Campaign
	const campaignBreakdown = useMemo(() => {
		const groups: Record<string, any> = {}

		leads.forEach((l: any) => {
			const campaignKey = l.campaign_name || l.ad_name || (l.source === 'Meta Ads' ? 'Meta Ad Set General' : l.source || 'Website Organic')
			if (!groups[campaignKey]) {
				groups[campaignKey] = {
					campaignName: campaignKey,
					platform: l.source === 'Meta Ads' ? 'Meta Ads' : l.platform || 'Website',
					totalLeads: 0,
					qualifiedLeads: 0,
					confirmedOrders: 0,
					attributedRevenue: 0,
				}
			}

			const g = groups[campaignKey]
			g.totalLeads += 1
			if (['Follow-up', 'Potential', 'Order Confirm'].includes(l.stage)) {
				g.qualifiedLeads += 1
			}
			if (l.stage === 'Order Confirm') {
				g.confirmedOrders += 1
				g.attributedRevenue += Number(l.estimated_order_value || 2500)
			}
		})

		const list = Object.values(groups).map((c: any) => {
			const convRate = c.totalLeads > 0 ? ((c.confirmedOrders / c.totalLeads) * 100).toFixed(1) : '0'
			return {
				...c,
				conversionRate: Number(convRate),
			}
		})

		list.sort((a, b) => b.totalLeads - a.totalLeads)
		return list
	}, [leads])

	// Filtered by Search
	const filteredCampaigns = useMemo(() => {
		if (!searchTerm || !searchTerm.trim()) return campaignBreakdown
		const term = searchTerm.toLowerCase().trim()
		return campaignBreakdown.filter((c: any) => c.campaignName.toLowerCase().includes(term))
	}, [campaignBreakdown, searchTerm])

	// Aggregate Totals
	const totals = useMemo(() => {
		const totalLeads = leads.length
		const qualified = leads.filter((l) => ['Follow-up', 'Potential', 'Order Confirm'].includes(l.stage)).length
		const orders = leads.filter((l) => l.stage === 'Order Confirm').length
		const revenue = leads
			.filter((l) => l.stage === 'Order Confirm')
			.reduce((sum, l) => sum + Number(l.estimated_order_value || 2500), 0)
		return { totalLeads, qualified, orders, revenue }
	}, [leads])

	// Export Excel
	const downloadExcel = () => {
		const rows = filteredCampaigns.map((c, idx) => ({
			'#': idx + 1,
			Campaign: c.campaignName,
			Platform: c.platform,
			'Total Leads': c.totalLeads,
			'Qualified Leads': c.qualifiedLeads,
			'Orders Converted': c.confirmedOrders,
			'Conversion Rate (%)': `${c.conversionRate}%`,
			'Attributed Revenue (₹)': c.attributedRevenue,
		}))

		const ws = XLSX.utils.json_to_sheet(rows)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Campaign_Attribution')
		XLSX.writeFile(wb, `RAG_Meta_Attribution_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	return (
		<div className='crm-container'>
			<PageTitle breadcrumbs={[]}>Meta Ads Attribution & ROAS</PageTitle>

			{/* Breadcrumb */}
			<div className='crm-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/crm/leads'>CRM & Leads</Link>
				<span className='sep'>/</span>
				<span className='current'>Meta Ads Attribution</span>
			</div>

			{/* Header */}
			<div className='crm-header'>
				<div>
					<h1 className='crm-title'>
						<FontAwesomeIcon icon={faMeta} style={{ color: '#0668E1' }} />
						Meta Ads Attribution & Campaign ROAS
					</h1>
					<p className='crm-subtitle'>
						Track campaigns from ad impression and instant form submission down to confirmed sales and revenue.
					</p>
				</div>
				<div className='crm-actions'>
					<button className='crm-btn-secondary' onClick={downloadExcel} title='Download Excel'>
						<FontAwesomeIcon icon={faFileExcel} style={{ color: '#107C41' }} />
						Export Excel
					</button>
					<button className='crm-btn-secondary' onClick={fetchAdAttribution} title='Refresh Data'>
						<FontAwesomeIcon icon={faSync} />
						Refresh
					</button>
				</div>
			</div>

			{/* Metrics */}
			<div className='crm-metrics-grid'>
				<div className='crm-stat-card'>
					<div className='crm-stat-icon blue'>
						<FontAwesomeIcon icon={faBullhorn} />
					</div>
					<div>
						<div className='crm-stat-value'>{totals.totalLeads}</div>
						<div className='crm-stat-label'>Total Captured Leads</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon purple'>
						<FontAwesomeIcon icon={faFire} />
					</div>
					<div>
						<div className='crm-stat-value'>{totals.qualified}</div>
						<div className='crm-stat-label'>High-Intent Qualified</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon green'>
						<FontAwesomeIcon icon={faCheckCircle} />
					</div>
					<div>
						<div className='crm-stat-value'>{totals.orders}</div>
						<div className='crm-stat-label'>Ad Orders Confirmed</div>
					</div>
				</div>

				<div className='crm-stat-card'>
					<div className='crm-stat-icon amber'>
						<FontAwesomeIcon icon={faIndianRupeeSign} />
					</div>
					<div>
						<div className='crm-stat-value'>₹{totals.revenue.toLocaleString('en-IN')}</div>
						<div className='crm-stat-label'>Attributed Revenue</div>
					</div>
				</div>
			</div>

			{/* Search */}
			<div className='crm-filters-card'>
				<div className='crm-filters-left'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						placeholder='Search campaigns or ad sets...'
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
								<th>Campaign / Source Name</th>
								<th>Channel</th>
								<th>Total Leads</th>
								<th>Qualified Leads</th>
								<th>Confirmed Orders</th>
								<th>Conversion Rate</th>
								<th>Attributed Revenue</th>
								<th>ROAS Status</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
										<div className='spinner-border spinner-border-sm text-primary me-2' role='status' />
										Aggregating ad performance and attribution...
									</td>
								</tr>
							) : filteredCampaigns.length === 0 ? (
								<tr>
									<td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
										<FontAwesomeIcon icon={faBullhorn} style={{ fontSize: '32px', color: '#CBD5E1', marginBottom: '12px' }} />
										<div style={{ fontWeight: 600, color: '#1E293B' }}>No campaigns recorded yet</div>
										<p style={{ fontSize: '13px', margin: '4px 0 0' }}>
											Leads generated from Meta Ads or website inquiries will appear here automatically.
										</p>
									</td>
								</tr>
							) : (
								filteredCampaigns.map((c: any, idx: number) => (
									<tr key={idx}>
										<td>
											<span style={{ fontWeight: 600, color: '#94A3B8', fontSize: '12.5px' }}>
												{idx + 1}
											</span>
										</td>

										{/* Campaign Name */}
										<td>
											<div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13.5px' }}>
												{c.campaignName}
											</div>
										</td>

										{/* Platform */}
										<td>
											<span className='crm-source-pill meta'>
												<FontAwesomeIcon icon={faMeta} style={{ marginRight: '4px' }} />
												{c.platform}
											</span>
										</td>

										{/* Leads */}
										<td>
											<span style={{ fontWeight: 700, color: '#1E293B' }}>{c.totalLeads}</span>
										</td>

										{/* Qualified */}
										<td>
											<span style={{ color: '#475569' }}>{c.qualifiedLeads}</span>
										</td>

										{/* Orders */}
										<td>
											<span style={{ fontWeight: 700, color: '#059669' }}>{c.confirmedOrders}</span>
										</td>

										{/* Conversion Rate */}
										<td>
											<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
												<span style={{ fontWeight: 600, color: c.conversionRate >= 10 ? '#059669' : '#334155' }}>
													{c.conversionRate}%
												</span>
											</div>
										</td>

										{/* Attributed Revenue */}
										<td>
											<span style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>
												₹{c.attributedRevenue.toLocaleString('en-IN')}
											</span>
										</td>

										{/* Status */}
										<td>
											{c.confirmedOrders > 0 ? (
												<span className='crm-stage-pill order-confirm'>
													🔥 Revenue Generating
												</span>
											) : c.totalLeads > 5 ? (
												<span className='crm-stage-pill potential'>
													🟡 In Nurturing
												</span>
											) : (
												<span className='crm-stage-pill new-lead'>
													🟢 Active Lead Capture
												</span>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

export default MetaAttribution
