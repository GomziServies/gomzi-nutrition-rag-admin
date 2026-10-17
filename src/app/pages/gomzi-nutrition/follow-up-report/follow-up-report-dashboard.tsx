/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faBullhorn,
	faCalendarAlt,
	faCalendarCheck,
	faCheckCircle,
	faCloudDownloadAlt,
	faEye,
	faLayerGroup,
	faList,
	faSyncAlt,
	faTag,
	faUserTie,
} from '@fortawesome/free-solid-svg-icons'
import { PageTitle } from '../../../../_metronic/layout/core'
import * as FGGroupAPIs from '../../../Functions/FGGroup'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'
import './follow-up-report.css'

const ACCOUNT_ID = 'act_2776739622489798'

const FollowUpReportDashboard: React.FC = () => {
	const [isLoading, setIsLoading] = useState(false)
	const [ads, setAds] = useState<any[]>([])
	const [campaigns, setCampaigns] = useState<any[]>([])
	const [isSavingLeads, setIsSavingLeads] = useState(false)
	const [showDateModal, setShowDateModal] = useState(false)
	const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'))

	const getField = (fieldData: any[], name: string): string => {
		if (!Array.isArray(fieldData)) return '-'
		const f = fieldData.find((d: any) => d.name === name)
		return f?.values?.[0] || '-'
	}

	const handleSaveLeads = async (dateStr: string) => {
		setIsSavingLeads(true)
		let totalSaved = 0

		try {
			for (const ad of ads) {
				if (ad.status !== 'ACTIVE') continue

				try {
					const res: any = await FGGroupAPIs.GetAdLeads(ad.id, {
						limit: '100',
						fields: 'ad_id,ad_name,created_time,field_data,id,is_organic,platform',
					})
					const rawLeads: any[] = res.data || []

					const filteredLeads = rawLeads.filter((lead: any) => {
						if (!lead.created_time) return false
						return new Date(lead.created_time).toLocaleDateString('en-CA') === dateStr
					})

					for (const lead of filteredLeads) {
						const title =
							getField(lead.field_data, 'full_name') || getField(lead.field_data, 'name') || '-'
						const email = getField(lead.field_data, 'email') || '-'
						const mobile =
							getField(lead.field_data, 'phone_number') ||
							getField(lead.field_data, 'phone') ||
							getField(lead.field_data, 'mobile_number') ||
							'-'
						const city = getField(lead.field_data, 'city') || '-'

						await FGGroupAPIs.CreateFacebookLead({
							ad_id: ad.id,
							ad_name: ad.name,
							lead_id: lead.id,
							full_name: title,
							phone_number: mobile,
							email: email,
							city: city,
							platform: lead.platform || undefined,
							tag: 'gn',
							created_time: lead.created_time,
						})
						totalSaved++
					}
				} catch (err) {
					console.error(`Failed to fetch/save leads for ad ${ad.id}:`, err)
				}
			}
			toast.success(`Successfully saved ${totalSaved} new leads for ${dateStr}!`)
			setShowDateModal(false)
		} catch (err) {
			console.error('Error during bulk save:', err)
			toast.error('An error occurred while saving leads.')
		}
		setIsSavingLeads(false)
	}

	const handleSaveTodaysLeads = () => {
		const todayStr = new Date().toLocaleDateString('en-CA')
		handleSaveLeads(todayStr)
	}

	useEffect(() => {
		fetchAllAds()
	}, [])

	const fetchAllAds = async () => {
		setIsLoading(true)
		try {
			// Step 1: Fetch campaigns for the account
			const campRes: any = await FGGroupAPIs.GetAdCampaign(ACCOUNT_ID, {
				fields: 'id,name,configured_status,objective',
			})
			const campaignList = campRes.data || []
			setCampaigns(campaignList)

			// Step 2: For each campaign fetch ad sets
			const adSetResults = await Promise.all(
				campaignList.map((camp: any) =>
					FGGroupAPIs.GetAdSet(camp.id, { fields: 'id,name,configured_status' })
						.then((res: any) =>
							(res.data || []).map((adSet: any) => ({
								...adSet,
								campaignName: camp.name,
								campaignId: camp.id,
							}))
						)
						.catch(() => [])
				)
			)
			const allAdSets: any[] = adSetResults.flat()

			// Step 3: For each ad set fetch ads
			const adResults = await Promise.all(
				allAdSets.map((adSet: any) =>
					FGGroupAPIs.GetAds(adSet.id, { fields: 'id,name,status' })
						.then((res: any) =>
							(res.data || []).map((ad: any) => ({
								...ad,
								adSetName: adSet.name,
								campaignName: adSet.campaignName,
								campaignId: adSet.campaignId,
							}))
						)
						.catch(() => [])
				)
			)
			setAds(adResults.flat())
		} catch (err) {
			console.error('Error fetching ads:', err)
		}
		setIsLoading(false)
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Follow Up Report Dashboard</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Follow-Up Ads Dashboard</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Follow-Up Ads & Performance Dashboard</h1>
					<p className='gz-mgmt-subtitle'>
						Sync ad campaign leads from Meta (Facebook & Instagram), review active ad sets, and monitor distribution.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link
						to='/rag/follow-up-report-list'
						className='gz-mgmt-btn-secondary'>
						<FontAwesomeIcon icon={faList} />
						<span>View All Saved Leads</span>
					</Link>

					<button
						type='button'
						className='gz-mgmt-btn-secondary'
						onClick={() => setShowDateModal(true)}
						disabled={isSavingLeads || ads.length === 0}
						style={{ color: '#2563EB', borderColor: '#BFDBFE' }}>
						<FontAwesomeIcon icon={faCalendarCheck} />
						<span>Save by Date</span>
					</button>

					<button
						type='button'
						className='gz-mgmt-btn-primary'
						onClick={handleSaveTodaysLeads}
						disabled={isSavingLeads || ads.length === 0}>
						{isSavingLeads ? (
							<>
								<span
									className='spinner-border spinner-border-sm me-2'
									role='status'
									aria-hidden='true'></span>
								<span>Saving Leads...</span>
							</>
						) : (
							<>
								<FontAwesomeIcon icon={faCloudDownloadAlt} />
								<span>Save Today's Leads</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* =========================================================================
			    STATS METRIC CARDS
			    ========================================================================= */}
			<div className='gz-mgmt-stats-grid mb-6'>
				<div className='gz-mgmt-stat-card'>
					<div className='gz-mgmt-stat-icon blue'>
						<FontAwesomeIcon icon={faBullhorn} />
					</div>
					<div className='gz-mgmt-stat-info'>
						<span className='gz-mgmt-stat-label'>Active Ads</span>
						<span className='gz-mgmt-stat-value'>{ads.length}</span>
					</div>
				</div>

				<div className='gz-mgmt-stat-card'>
					<div className='gz-mgmt-stat-icon purple'>
						<FontAwesomeIcon icon={faLayerGroup} />
					</div>
					<div className='gz-mgmt-stat-info'>
						<span className='gz-mgmt-stat-label'>Campaigns Synced</span>
						<span className='gz-mgmt-stat-value' style={{ color: '#9333EA' }}>
							{campaigns.length}
						</span>
					</div>
				</div>

				<div className='gz-mgmt-stat-card'>
					<div className='gz-mgmt-stat-icon green'>
						<FontAwesomeIcon icon={faTag} />
					</div>
					<div className='gz-mgmt-stat-info'>
						<span className='gz-mgmt-stat-label'>Ad Account</span>
						<span className='gz-mgmt-stat-value' style={{ fontSize: '18px', color: '#16A34A' }}>
							Gomzi Nutrition
						</span>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    ACTIVE ADS TABLE CARD
			    ========================================================================= */}
			<div className='gz-mgmt-card'>
				{/* Toolbar */}
				<div className='gz-mgmt-toolbar'>
					<div className='gz-mgmt-toolbar-left'>
						<h3 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '16px' }}>
							Active Ads Directory
						</h3>
						<span className='fs-8 fw-semibold text-muted'>
							{ads.length} advertising creative units synchronized
						</span>
					</div>
					<div className='gz-mgmt-toolbar-right'>
						{isLoading && (
							<div className='d-flex align-items-center gap-2'>
								<div
									className='spinner-border spinner-border-sm'
									style={{ color: '#172B4D' }}
									role='status'>
									<span className='visually-hidden'>Loading...</span>
								</div>
								<span className='fs-8 text-muted'>Syncing with Meta...</span>
							</div>
						)}
					</div>
				</div>

				{/* Table */}
				<div className='gz-mgmt-table-wrap'>
					<table className='table mb-0'>
						<thead>
							<tr>
								<th style={{ width: '56px', textAlign: 'center' }}>No.</th>
								<th style={{ minWidth: '220px' }}>Campaign Name</th>
								<th style={{ minWidth: '200px' }}>Ad Set</th>
								<th style={{ minWidth: '220px' }}>Creative / Ad Name</th>
								<th style={{ minWidth: '120px' }}>Status</th>
								<th style={{ minWidth: '100px', textAlign: 'center' }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr>
									<td colSpan={6} className='text-center py-10'>
										<div className='d-flex justify-content-center align-items-center my-6'>
											<div
												className='spinner-border'
												style={{ color: '#172B4D', width: '2.5rem', height: '2.5rem' }}
												role='status'>
												<span className='visually-hidden'>Loading...</span>
											</div>
										</div>
									</td>
								</tr>
							) : ads.length > 0 ? (
								ads.map((ad, index) => (
									<tr key={ad.id || index}>
										<td style={{ textAlign: 'center', fontWeight: 700, color: '#71809A' }}>
											{index + 1}
										</td>
										<td>
											<span style={{ fontWeight: 600, color: '#172B4D', fontSize: '13.5px' }}>
												{ad.campaignName || '—'}
											</span>
										</td>
										<td>
											<span style={{ color: '#556987', fontSize: '13px' }}>
												{ad.adSetName || '—'}
											</span>
										</td>
										<td>
											<span style={{ fontWeight: 600, color: '#172B4D', fontSize: '13px' }}>
												{ad.name || '—'}
											</span>
										</td>
										<td>
											{ad.status === 'ACTIVE' ? (
												<span className='gz-mgmt-pill success'>
													<FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '9px' }} />
													<span>ACTIVE</span>
												</span>
											) : ad.status === 'PAUSED' ? (
												<span className='gz-mgmt-pill warning'>PAUSED</span>
											) : (
												<span className='gz-mgmt-pill slate'>{ad.status || '—'}</span>
											)}
										</td>
										<td style={{ textAlign: 'center' }}>
											<Link
												to={`/rag/follow-up-report-list?ad=${ad.id}&name=${encodeURIComponent(
													ad.name || ''
												)}`}
												className='gz-mgmt-action-btn'
												title='View Leads for this Ad'>
												<FontAwesomeIcon icon={faEye} />
											</Link>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={6} className='text-center py-10'>
										<div className='d-flex flex-column align-items-center justify-content-center my-6'>
											<div
												className='d-inline-flex align-items-center justify-content-center mb-3'
												style={{
													width: '48px',
													height: '48px',
													borderRadius: '50%',
													background: '#F5F7FB',
													color: '#71809A',
												}}>
												<FontAwesomeIcon icon={faBullhorn} style={{ fontSize: '20px' }} />
											</div>
											<h4 className='fw-bold mb-1' style={{ color: '#172B4D' }}>
												No Ads Found
											</h4>
											<p className='text-muted fs-7 mb-0'>
												No active Facebook or Instagram ads currently found for this account.
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* =========================================================================
			    MODAL: SAVE LEADS BY DATE
			    ========================================================================= */}
			<Modal
				show={showDateModal}
				onHide={() => !isSavingLeads && setShowDateModal(false)}
				centered>
				<div
					className='modal-content'
					style={{
						borderRadius: '16px',
						border: '1px solid #E4EAF2',
						boxShadow: '0 10px 30px rgba(23, 43, 77, 0.12)',
						overflow: 'hidden',
					}}>
					<div
						className='modal-header d-flex justify-content-between align-items-center px-6 py-4'
						style={{ borderBottom: '1px solid #EEF2F7', background: '#FFFFFF' }}>
						<h3 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '18px' }}>
							Select Date to Save Leads
						</h3>
						{!isSavingLeads && (
							<button
								type='button'
								onClick={() => setShowDateModal(false)}
								className='btn-close'></button>
						)}
					</div>
					<div className='modal-body px-6 py-5'>
						<div className='mb-3'>
							<label className='fs-7 fw-bold mb-2 d-block' style={{ color: '#172B4D' }}>
								Lead Creation Date
							</label>
							<input
								type='date'
								className='form-control form-control-solid'
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								disabled={isSavingLeads}
								style={{
									height: '44px',
									backgroundColor: '#F8FAFD',
									borderColor: '#E4EAF2',
									borderRadius: '10px',
									color: '#172B4D',
								}}
							/>
						</div>
						<p className='fs-8 text-muted mb-0'>
							This will query Meta for all leads generated on the selected date across active ads and persist them to the database.
						</p>
					</div>
					<div
						className='modal-footer d-flex justify-content-end gap-2 px-6 py-4'
						style={{ borderTop: '1px solid #EEF2F7', background: '#F8FAFD' }}>
						<button
							type='button'
							className='gz-mgmt-btn-secondary'
							onClick={() => setShowDateModal(false)}
							disabled={isSavingLeads}>
							Cancel
						</button>
						<button
							type='button'
							className='gz-mgmt-btn-primary'
							onClick={() => handleSaveLeads(selectedDate)}
							disabled={isSavingLeads || !selectedDate}>
							{isSavingLeads ? (
								<>
									<span
										className='spinner-border spinner-border-sm me-2'
										role='status'
										aria-hidden='true'></span>
									<span>Saving Leads...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faCloudDownloadAlt} />
									<span>Save Leads</span>
								</>
							)}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default FollowUpReportDashboard
