/* eslint-disable */
import React, { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faCalendarAlt,
	faCheckCircle,
	faCopy,
	faEdit,
	faEye,
	faLink,
	faPercent,
	faPlus,
	faTag,
	faTimesCircle,
	faUserCheck,
	faUsers,
	faXmark,
	faExternalLinkAlt,
	faRupeeSign,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SearchFilter from '../../../components/SearchFilter'
import SelectFieldManual from '../../../components/SelectFieldManual'
import UsersListPagination from '../../../components/TablePagination'
import CopyButton from '../../../components/motion/CopyButton'
import {
	CreateReferralCoupon,
	GetReferralCoupon,
	GetProduct,
	GetContactInquiry,
	UpdateReferralCoupon,
} from '../../../Functions/FGGroup'
import { isProPartnerApplication } from '../contact-inquiry/contactInquiryUtils'
import { getPartnerApplicationStatus } from '../contact-inquiry/PartnerApplicationActions'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'
import './pro-partner-coupons.css'

interface ApprovedPartner {
	id: string
	name: string
	email: string
	mobile: string
	city: string
	state: string
	partner_status: string
	hasAcceptedPolicy: boolean
	existingCouponCode?: string
}

const RAG_CONTACT_SOURCE_FILTER = 'gomzilifesciences|ragnutrition|contact-us|5173|whey|rag'

const ProPartnerCoupons: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [referenceData, setReferenceData] = useState<any[]>([])
	const [approvedPartners, setApprovedPartners] = useState<ApprovedPartner[]>([])
	const [catalogProducts, setCatalogProducts] = useState<any[]>([])
	const [productSearch, setProductSearch] = useState('')
	const [loading, setLoading] = useState(true)
	const [partnersLoading, setPartnersLoading] = useState(false)

	// Selected partner for coupon creation/update
	const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')

	// Modals
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [showGenerateModal, setShowGenerateModal] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	// Form states
	const [couponAdd, setCouponAdd] = useState({
		title: '',
		coupon_code: '',
		max_usage_count: '1000',
		discount_type: 'percent',
		discount: '10',
		expired_at: DayJS().add(1, 'year').format('YYYY-MM-DD'),
		scope: 'ALL',
		applicable_products: [] as string[],
	})

	const [updateData, setUpdateData] = useState({
		_id: '',
		title: '',
		coupon_code: '',
		max_usage_count: '',
		discount_type: 'percent',
		discount: '',
		expired_at: '',
		scope: 'ALL',
		applicable_products: [] as string[],
		partner_inquiry_id: '',
		partner_name: '',
	})

	const [generateData, setGenerateData] = useState({
		ID: '',
		CouponCode: '',
		PasteURL: 'https://gomzinutrition.com/shop',
		GenerateLink: '',
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	// Reset page to 1 whenever search term changes
	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	// 1. Fetch Pro-Partner Coupons only
	const fetchProPartnerCoupons = async () => {
		setLoading(true)
		try {
			const response: FGGroupAPIResponse = await GetReferralCoupon({ coupon_type: 'pro_partner' })
			const rawList: any[] = Array.isArray(response?.data) ? response.data : []
			const sortedList = [...rawList].sort(
				(a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
			)
			setReferenceData(sortedList)
		} catch (error) {
			console.error('Error fetching pro-partner coupons:', error)
			toast.error('Failed to load pro-partner coupons')
		} finally {
			setLoading(false)
		}
	}

	// 2. Fetch Approved Pro-Partner applicants only from Applications
	const fetchApprovedPartners = async () => {
		setPartnersLoading(true)
		try {
			const pageSize = 100
			const firstRes: any = await GetContactInquiry({
				page: 1,
				limit: pageSize,
				source: RAG_CONTACT_SOURCE_FILTER,
			})
			const totalPages = Number(firstRes?.metadata?.pagination?.totalPages || 1)
			let rawList: any[] = Array.isArray(firstRes?.data) ? [...firstRes.data] : []

			for (let p = 2; p <= totalPages; p++) {
				const nextRes: any = await GetContactInquiry({
					page: p,
					limit: pageSize,
					source: RAG_CONTACT_SOURCE_FILTER,
				})
				if (Array.isArray(nextRes?.data)) {
					rawList = rawList.concat(nextRes.data)
				}
			}

			// Filter exclusively for Pro Partner applicants who are APPROVED
			const approvedList: ApprovedPartner[] = rawList
				.filter((item: any) => {
					if (!isProPartnerApplication(item)) return false
					return getPartnerApplicationStatus(item) === 'approved'
				})
				.map((item: any) => {
					const d = item.details || {}
					return {
						id: String(item._id),
						name: String(d.full_name || item.name || 'Unnamed Partner').trim(),
						email: String(d.email || item.email || '').trim(),
						mobile: String(d.mobile || item.mobile || '').trim(),
						city: String(d.city || '').trim(),
						state: String(d.state || '').trim(),
						partner_status: 'approved',
						hasAcceptedPolicy: Boolean(item.partner_policy?.accepted_at),
						existingCouponCode: d.assigned_coupon_code || '',
					}
				})

			setApprovedPartners(approvedList)
		} catch (error) {
			console.error('Error fetching approved pro-partners:', error)
		} finally {
			setPartnersLoading(false)
		}
	}

	// 3. Fetch Product Catalog for scope selector
	const fetchProductCatalog = async () => {
		try {
			const response: any = await GetProduct({ limit: 500, page: 1 })
			const raw = response?.data?.data || response?.data || []
			setCatalogProducts(Array.isArray(raw) ? raw : [])
		} catch (error) {
			console.error('Error fetching catalog products:', error)
		}
	}

	useEffect(() => {
		fetchProPartnerCoupons()
		fetchApprovedPartners()
		fetchProductCatalog()
	}, [])

	// Generates sequential order-wise coupon code: RAG[NAME]001, RAG[NAME]002...
	const computePartnerCouponCode = (partnerName: string) => {
		const cleanFirstName =
			partnerName.trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'PARTNER'
		const prefix = `RAG${cleanFirstName}`

		// Find highest sequence among existing coupons (RAG[NAME]001, RAG[NAME]002, etc.)
		const regex = new RegExp(`^${prefix}(\\d+)$`, 'i')
		let maxSeq = 0
		referenceData.forEach((c: any) => {
			const code = (c.coupon_code || '').trim().toUpperCase()
			const match = code.match(regex)
			if (match && match[1]) {
				const num = parseInt(match[1], 10)
				if (!isNaN(num) && num > maxSeq) {
					maxSeq = num
				}
			}
		})

		const nextSeq = String(maxSeq + 1).padStart(3, '0')
		return `${prefix}${nextSeq}`
	}

	const resetCreateForm = () => {
		setSelectedPartnerId('')
		setCouponAdd({
			title: '',
			coupon_code: '',
			max_usage_count: '1000',
			discount_type: 'percent',
			discount: '10',
			expired_at: DayJS().add(1, 'year').format('YYYY-MM-DD'),
			scope: 'ALL',
			applicable_products: [],
		})
	}

	// When partner is selected in modal, generate smart suggestions
	const handlePartnerSelect = (partnerId: string) => {
		setSelectedPartnerId(partnerId)
		if (!partnerId) {
			setCouponAdd((prev) => ({
				...prev,
				title: '',
				coupon_code: '',
			}))
			return
		}

		const partner = approvedPartners.find((p) => p.id === partnerId)
		if (partner) {
			const generatedCode = computePartnerCouponCode(partner.name)

			setCouponAdd((prev) => ({
				...prev,
				title: `${partner.name} - Pro Partner Referral`,
				coupon_code: generatedCode, // Always update to the newly selected partner's sequential code
			}))
		}
	}

	// Create Coupon Submission
	const handleCreateCoupon = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!selectedPartnerId) {
			toast.error('Please select an approved Pro-Partner')
			return
		}

		const partner = approvedPartners.find((p) => p.id === selectedPartnerId)
		if (!partner) {
			toast.error('Selected partner not found')
			return
		}

		const cleanCode = couponAdd.coupon_code.trim().toUpperCase()
		if (!cleanCode) {
			toast.error('Coupon code is required')
			return
		}

		if (!couponAdd.title.trim()) {
			toast.error('Coupon title is required')
			return
		}

		setSubmitting(true)
		try {
			const payload: any = {
				coupon_type: 'pro_partner',
				partner_inquiry_id: partner.id,
				partner_name: partner.name,
				partner_email: partner.email,
				partner_mobile: partner.mobile,
				coupon_code: cleanCode,
				title: couponAdd.title.trim(),
				discount_type: couponAdd.discount_type,
				discount: Number(couponAdd.discount),
				max_usage_count: Number(couponAdd.max_usage_count),
				expired_at: DayJS(couponAdd.expired_at).format('YYYY/MM/DD'),
				scope: couponAdd.scope,
				applicable_products:
					couponAdd.scope === 'SPECIFIC_PRODUCTS' ? couponAdd.applicable_products : [],
				assign_trainer: {
					trainer_id: partner.id,
					name: partner.name,
				},
			}

			await CreateReferralCoupon(payload)
			toast.success(`Coupon ${cleanCode} created! Activation email dispatched to ${partner.name}.`)
			setShowCreateModal(false)
			resetCreateForm()
			fetchProPartnerCoupons()
			fetchApprovedPartners()
		} catch (error: any) {
			console.error('Error creating pro partner coupon:', error)
			toast.error(error?.response?.data?.message || error?.message || 'Failed to create coupon')
		} finally {
			setSubmitting(false)
		}
	}

	// Update Modal Opener
	const handleOpenUpdateModal = (item: any) => {
		const applicableProductIds = Array.isArray(item.applicable_products)
			? item.applicable_products.map((p: any) => (p && p._id ? p._id : String(p)))
			: []

		setUpdateData({
			_id: item._id,
			title: item.title || '',
			coupon_code: item.coupon_code || '',
			max_usage_count: String(item.max_usage_count || 1000),
			discount_type: item.discount_type || 'percent',
			discount: String(item.discount || 0),
			expired_at: item.expired_at ? DayJS(item.expired_at).format('YYYY-MM-DD') : '',
			scope: item.scope || (applicableProductIds.length > 0 ? 'SPECIFIC_PRODUCTS' : 'ALL'),
			applicable_products: applicableProductIds,
			partner_inquiry_id: item.partner_inquiry_id?._id || item.partner_inquiry_id || item.assign_trainer?.trainer_id || '',
			partner_name: item.partner_name || item.assign_trainer?.name || '',
		})
		setShowUpdateModal(true)
	}

	// Update Coupon Submission
	const handleUpdateCoupon = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!updateData._id) return

		setSubmitting(true)
		try {
			const payload: any = {
				coupon_id: updateData._id,
				coupon_type: 'pro_partner',
				title: updateData.title.trim(),
				coupon_code: updateData.coupon_code.trim().toUpperCase(),
				discount_type: updateData.discount_type,
				discount: Number(updateData.discount),
				max_usage_count: Number(updateData.max_usage_count),
				expired_at: DayJS(updateData.expired_at).format('YYYY/MM/DD'),
				scope: updateData.scope,
				applicable_products:
					updateData.scope === 'SPECIFIC_PRODUCTS' ? updateData.applicable_products : [],
				partner_name: updateData.partner_name,
				partner_inquiry_id: updateData.partner_inquiry_id,
				assign_trainer: {
					trainer_id: updateData.partner_inquiry_id,
					name: updateData.partner_name,
				},
			}

			await UpdateReferralCoupon(payload)
			toast.success('Coupon updated successfully')
			setShowUpdateModal(false)
			fetchProPartnerCoupons()
		} catch (error: any) {
			console.error('Error updating coupon:', error)
			toast.error(error?.response?.data?.message || error?.message || 'Failed to update coupon')
		} finally {
			setSubmitting(false)
		}
	}

	// Share Link Generator Modal Opener
	const handleOpenGenerateModal = (item: any) => {
		setGenerateData({
			ID: item._id,
			CouponCode: item.coupon_code,
			PasteURL: 'https://gomzinutrition.com/shop',
			GenerateLink: `https://gomzinutrition.com/shop?coupon_code=${item.coupon_code}&ref=${item.partner_inquiry_id?._id || item.assign_trainer?.trainer_id || ''}`,
		})
		setShowGenerateModal(true)
	}

	const constructCustomLink = () => {
		if (!generateData.PasteURL) {
			toast.error('Base URL is required')
			return
		}
		try {
			const url = new URL(generateData.PasteURL)
			url.searchParams.set('coupon_code', generateData.CouponCode)
			setGenerateData((prev) => ({ ...prev, GenerateLink: url.toString() }))
			toast.success('Shareable partner link created!')
		} catch {
			toast.error('Please enter a valid URL')
		}
	}

	// Filtered Data with robust search
	const filteredCoupons = useMemo(() => {
		const q = searchTerm.trim().toLowerCase()
		if (!q) return referenceData

		return referenceData.filter((item: any) => {
			const code = (item.coupon_code || '').toLowerCase()
			const title = (item.title || '').toLowerCase()
			const partnerName = (
				item.partner_name ||
				item.assign_trainer?.name ||
				item.partner_inquiry_id?.name ||
				item.partner_inquiry_id?.details?.full_name ||
				''
			).toLowerCase()
			const email = (
				item.partner_email ||
				item.partner_inquiry_id?.email ||
				item.partner_inquiry_id?.details?.email ||
				''
			).toLowerCase()
			const mobile = (
				item.partner_mobile ||
				item.partner_inquiry_id?.mobile ||
				item.partner_inquiry_id?.details?.mobile ||
				''
			).toLowerCase()
			const discount = String(item.discount || '')

			return (
				code.includes(q) ||
				title.includes(q) ||
				partnerName.includes(q) ||
				email.includes(q) ||
				mobile.includes(q) ||
				discount.includes(q)
			)
		})
	}, [referenceData, searchTerm])

	// Pagination slice
	const paginatedCoupons = useMemo(() => {
		const start = (pagination.page - 1) * pagination.itemsPerPage
		return filteredCoupons.slice(start, start + pagination.itemsPerPage)
	}, [filteredCoupons, pagination])

	// Stats
	const totalCoupons = referenceData.length
	const activeCoupons = referenceData.filter((c: any) => {
		if (!c.expired_at) return true
		return new Date(c.expired_at).getTime() >= new Date().setHours(0, 0, 0, 0)
	}).length
	const approvedPartnersCount = approvedPartners.length

	return (
		<div className='gz-prod-container gz-pro-partner-coupons-wrapper'>
			<PageTitle breadcrumbs={[]}>Pro-Partner Coupons</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb d-flex align-items-center justify-content-between flex-wrap gap-2'>
				<div className='d-flex align-items-center gap-2'>
					<Link to='/rag/dashboard'>Dashboard</Link>
					<span className='sep'>&gt;</span>
					<Link to='/rag/pro-partner/applications'>Pro-Partner</Link>
					<span className='sep'>&gt;</span>
					<span className='current'>Coupons</span>
				</div>
				<div className='d-flex align-items-center gap-2'>
					<Link
						to='/rag/pro-partner/applications'
						className='btn btn-sm btn-outline-secondary d-flex align-items-center gap-2'
						style={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
					>
						<FontAwesomeIcon icon={faUsers} />
						View Applications
					</Link>
					<button
						type='button'
						onClick={() => setShowCreateModal(true)}
						className='btn btn-sm btn-primary d-flex align-items-center gap-2'
						style={{
							borderRadius: '8px',
							fontSize: '13px',
							fontWeight: 600,
							background: '#047857',
							borderColor: '#047857',
						}}
					>
						<FontAwesomeIcon icon={faPlus} />
						Create Partner Coupon
					</button>
				</div>
			</div>

			{/* =========================================================================
			    HEADER TITLE & DESCRIPTION
			    ========================================================================= */}
			<div className='mb-4'>
				<h2 className='fw-bold text-dark mb-1' style={{ fontSize: '22px' }}>
					RAG Pro-Partner Coupons
				</h2>
				<p className='text-muted fs-7 mb-0'>
					Generate and manage dedicated discount codes assigned exclusively to verified & approved Pro-Partners.
				</p>
			</div>

			{/* =========================================================================
			    KPI SUMMARY METRICS
			    ========================================================================= */}
			<div className='gz-prod-summary-grid mb-4'>
				<div className='gz-prod-summary-card'>
					<div className='title'>Total Partner Coupons</div>
					<div className='value' style={{ color: '#0F172A' }}>
						{loading ? (
							<div className='gz-skeleton' style={{ width: '40px', height: '28px', borderRadius: '4px' }} />
						) : (
							totalCoupons
						)}
					</div>
					<div className='subtext'>Configured in database</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='title'>Active Valid Coupons</div>
					<div className='value' style={{ color: '#059669' }}>
						{loading ? (
							<div className='gz-skeleton' style={{ width: '40px', height: '28px', borderRadius: '4px' }} />
						) : (
							activeCoupons
						)}
					</div>
					<div className='subtext'>Currently redeemable by clients</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='title'>Approved Partners Available</div>
					<div className='value' style={{ color: '#2563EB' }}>
						{partnersLoading ? (
							<div className='gz-skeleton' style={{ width: '40px', height: '28px', borderRadius: '4px' }} />
						) : (
							approvedPartnersCount
						)}
					</div>
					<div className='subtext'>Eligible for custom coupon assignment</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='title'>Standard Partner Discount</div>
					<div className='value' style={{ color: '#D97706' }}>
						10%
					</div>
					<div className='subtext'>Recommended partner reward rate</div>
				</div>
			</div>

			{/* =========================================================================
			    COUPONS DATA TABLE CARD
			    ========================================================================= */}
			<div className='gz-prod-card'>
				{/* Card Toolbar */}
				<div className='gz-prod-toolbar'>
					<div className='d-flex align-items-center gap-3 flex-wrap'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search by coupon code, partner name, email...'
							className='me-0'
						/>
						<LengthMenu
							expenseData={filteredCoupons}
							handleItemsPerPageChange={(itemsPerPage: number) =>
								setPagination((prev) => ({ ...prev, itemsPerPage, page: 1 }))
							}
							value={pagination.itemsPerPage}
							className='me-0'
						/>
						<div>
							<DownloadExcelButton
								data={filteredCoupons.map((c: any, index: number) => ({
									'#': index + 1,
									'Pro Partner': c.partner_name || c.assign_trainer?.name || 'N/A',
									'Partner Email': c.partner_email || 'N/A',
									'Partner Mobile': c.partner_mobile || 'N/A',
									'Coupon Code': c.coupon_code || '',
									Title: c.title || '',
									Discount: c.discount || '',
									'Discount Type': c.discount_type || 'percent',
									'Max Usage': c.max_usage_count || '',
									'Times Used': c.usage_count || 0,
									Scope: c.scope || 'ALL',
									'Expiry Date': c.expired_at ? DayJS(c.expired_at).format('DD-MM-YYYY') : 'Never',
									'Created Date': c.createdAt ? DayJS(c.createdAt).format('DD-MM-YYYY') : '',
								}))}
								filename='RAG_Pro_Partner_Coupons'
							/>
						</div>
					</div>
					<div className='d-flex align-items-center gap-2'>
						<span className='fs-8 fw-semibold text-muted'>
							Showing {paginatedCoupons.length} of {filteredCoupons.length} partner coupons
						</span>
					</div>
				</div>

				{/* Table */}
				<div className='table-responsive'>
					<table className='gz-prod-table mb-0'>
						<thead>
							<tr>
								<th style={{ width: '40px' }}>#</th>
								<th>Assigned Pro Partner</th>
								<th>Coupon Code</th>
								<th>Title / Campaign</th>
								<th>Discount</th>
								<th>Usage</th>
								<th>Scope</th>
								<th>Status / Expiry</th>
								<th className='text-end' style={{ width: '130px' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<tr key={`skel-${i}`}>
										<td colSpan={9} className='py-4'>
											<div className='gz-skeleton' style={{ width: '100%', height: '24px', borderRadius: '4px' }} />
										</td>
									</tr>
								))
							) : paginatedCoupons.length === 0 ? (
								<tr>
									<td colSpan={9} className='text-center py-5'>
										<div className='d-flex flex-column align-items-center justify-content-center'>
											<div
												className='mb-3 d-flex align-items-center justify-content-center'
												style={{
													width: '56px',
													height: '56px',
													borderRadius: '50%',
													background: '#F1F5F9',
													color: '#64748B',
													fontSize: '22px',
												}}
											>
												<FontAwesomeIcon icon={faTag} />
											</div>
											<h5 className='fw-bold text-dark mb-1'>
												{searchTerm ? 'No matching partner coupons' : 'No Pro-Partner Coupons Yet'}
											</h5>
											<p className='text-muted fs-7 mb-3' style={{ maxWidth: '420px' }}>
												{searchTerm
													? `No coupons match "${searchTerm}". Try searching by code, partner name, or clear the search filter.`
													: 'You have not created any Pro-Partner coupons yet. Click below to assign a personalized coupon code to an approved partner.'}
											</p>
											{searchTerm ? (
												<button
													type='button'
													onClick={() => setSearchTerm('')}
													className='btn btn-sm btn-outline-secondary'
												>
													Clear Search
												</button>
											) : (
												<button
													type='button'
													onClick={() => setShowCreateModal(true)}
													className='btn btn-sm btn-primary'
													style={{ background: '#047857', borderColor: '#047857' }}
												>
													<FontAwesomeIcon icon={faPlus} className='me-2' />
													Create First Partner Coupon
												</button>
											)}
										</div>
									</td>
								</tr>
							) : (
								paginatedCoupons.map((item: any, idx: number) => {
									const partnerName =
										item.partner_name ||
										item.assign_trainer?.name ||
										item.partner_inquiry_id?.name ||
										item.partner_inquiry_id?.details?.full_name ||
										'Pro Partner'
									const partnerEmail =
										item.partner_email ||
										item.partner_inquiry_id?.email ||
										item.partner_inquiry_id?.details?.email ||
										''
									const partnerMobile =
										item.partner_mobile ||
										item.partner_inquiry_id?.mobile ||
										item.partner_inquiry_id?.details?.mobile ||
										''
									const isExpired = item.expired_at
										? new Date(item.expired_at).getTime() < new Date().setHours(0, 0, 0, 0)
										: false

									return (
										<tr key={item._id || idx}>
											<td className='text-muted fs-8 fw-semibold'>
												{(pagination.page - 1) * pagination.itemsPerPage + idx + 1}
											</td>

											{/* Partner column */}
											<td>
												<div className='d-flex align-items-center gap-2'>
													<div
														className='d-flex align-items-center justify-content-center fw-bold'
														style={{
															width: '34px',
															height: '34px',
															borderRadius: '50%',
															background: '#E0F2FE',
															color: '#0369A1',
															fontSize: '13px',
															flexShrink: 0,
														}}
													>
														{partnerName.charAt(0).toUpperCase()}
													</div>
													<div>
														<div className='fw-bold text-dark fs-7 d-flex align-items-center gap-2'>
															<span>{partnerName}</span>
															<span
																className='badge'
																style={{
																	background: '#ECFDF5',
																	color: '#047857',
																	fontSize: '10px',
																	padding: '2px 6px',
																}}
															>
																Pro Partner
															</span>
														</div>
														<div className='text-muted fs-8 d-flex align-items-center gap-2'>
															{partnerEmail && <span>{partnerEmail}</span>}
															{partnerMobile && <span>• {partnerMobile}</span>}
														</div>
													</div>
												</div>
											</td>

											{/* Coupon Code */}
											<td>
												<div className='d-flex align-items-center gap-2'>
													<span
														className='badge font-monospace fw-bold'
														style={{
															background: '#F1F5F9',
															color: '#0F172A',
															fontSize: '13px',
															padding: '5px 8px',
															letterSpacing: '0.5px',
															border: '1px dashed #CBD5E1',
														}}
													>
														{item.coupon_code}
													</span>
													<CopyButton textToCopy={item.coupon_code} />
												</div>
											</td>

											{/* Title */}
											<td>
												<span className='fw-semibold text-dark fs-7'>
													{item.title || 'Untitled Campaign'}
												</span>
											</td>

											{/* Discount */}
											<td>
												<span
													className='badge fw-bold'
													style={{
														background: item.discount_type === 'percent' ? '#FEF3C7' : '#EFF6FF',
														color: item.discount_type === 'percent' ? '#92400E' : '#1E40AF',
														fontSize: '12px',
													}}
												>
													{item.discount_type === 'percent' ? `${item.discount}% OFF` : `₹${item.discount} OFF`}
												</span>
											</td>

											{/* Usage */}
											<td>
												<div className='fs-8 text-muted'>
													<span className='fw-bold text-dark'>{item.usage_count || 0}</span> / {item.max_usage_count || '∞'}
												</div>
											</td>

											{/* Scope */}
											<td>
												<span
													className='badge'
													style={{
														background: item.scope === 'SPECIFIC_PRODUCTS' ? '#F3E8FF' : '#F1F5F9',
														color: item.scope === 'SPECIFIC_PRODUCTS' ? '#7E22CE' : '#475569',
														fontSize: '11px',
													}}
												>
													{item.scope === 'SPECIFIC_PRODUCTS'
														? `Specific (${item.applicable_products?.length || 0})`
														: 'All Products'}
												</span>
											</td>

											{/* Expiry */}
											<td>
												<div className='d-flex flex-column'>
													<span
														className='badge mb-1'
														style={{
															width: 'fit-content',
															background: isExpired ? '#FEE2E2' : '#DCFCE7',
															color: isExpired ? '#991B1B' : '#166534',
															fontSize: '10px',
														}}
													>
														{isExpired ? 'Expired' : 'Active'}
													</span>
													<span className='text-muted fs-8'>
														{item.expired_at ? DayJS(item.expired_at).format('DD MMM YYYY') : 'Never'}
													</span>
												</div>
											</td>

											{/* Actions */}
											<td className='text-end'>
												<div className='d-flex align-items-center justify-content-end gap-1'>
													<button
														type='button'
														title='Generate Shareable Link'
														onClick={() => handleOpenGenerateModal(item)}
														className='btn btn-icon btn-sm btn-light'
														style={{ width: '32px', height: '32px', borderRadius: '6px' }}
													>
														<FontAwesomeIcon icon={faLink} className='text-primary' />
													</button>
													<button
														type='button'
														title='Edit Coupon'
														onClick={() => handleOpenUpdateModal(item)}
														className='btn btn-icon btn-sm btn-light'
														style={{ width: '32px', height: '32px', borderRadius: '6px' }}
													>
														<FontAwesomeIcon icon={faEdit} className='text-warning' />
													</button>
													<Link
														to='/rag/pro-partner/applications'
														title='View in Applications'
														className='btn btn-icon btn-sm btn-light'
														style={{ width: '32px', height: '32px', borderRadius: '6px' }}
													>
														<FontAwesomeIcon icon={faUsers} className='text-muted' />
													</Link>
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Table Footer with Pagination */}
				<div className='card-footer d-flex justify-content-between align-items-center flex-wrap py-3 px-4'>
					<span className='text-muted fs-8'>
						Total {filteredCoupons.length} coupons
					</span>
					<UsersListPagination
						totalPages={Math.ceil(filteredCoupons.length / pagination.itemsPerPage) || 1}
						pageIndex={pagination.page}
						onPageChange={(page: number) => setPagination((prev) => ({ ...prev, page }))}
					/>
				</div>
			</div>

			{/* =========================================================================
			    MODAL 1: CREATE PRO-PARTNER COUPON
			    ========================================================================= */}
			<Modal
				show={showCreateModal}
				onHide={() => {
					setShowCreateModal(false)
					resetCreateForm()
				}}
				size='lg'
				centered
				backdrop='static'
			>
				<form onSubmit={handleCreateCoupon}>
					<Modal.Header closeButton>
						<Modal.Title className='d-flex align-items-center gap-2'>
							<FontAwesomeIcon icon={faTag} className='text-success' />
							<span>Create Pro-Partner Coupon</span>
						</Modal.Title>
					</Modal.Header>

					<Modal.Body className='py-4'>
						{/* Notice Banner */}
						<div
							className='p-3 mb-4 rounded d-flex align-items-start gap-3'
							style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}
						>
							<FontAwesomeIcon icon={faCheckCircle} className='text-success mt-1' />
							<div className='fs-7' style={{ color: '#065F46' }}>
								<strong>Assigning to Approved Partners:</strong> Only applicants approved in{' '}
								<Link to='/rag/pro-partner/applications' className='text-success fw-bold text-decoration-underline'>
									Pro Partner Applications
								</Link>{' '}
								appear in this list. When created, this coupon will be bound exclusively to their partner record.
							</div>
						</div>

						{/* Step 1: Select Approved Partner */}
						<div className='mb-4'>
							<label className='form-label fw-bold required text-dark fs-7'>
								Assign Approved Pro Partner
							</label>
							<select
								className='form-select form-select-solid'
								value={selectedPartnerId}
								onChange={(e) => handlePartnerSelect(e.target.value)}
								required
								disabled={partnersLoading}
							>
								<option value=''>-- Select Approved Pro Partner --</option>
								{approvedPartners.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name} — {p.city ? `${p.city}, ` : ''}{p.email || p.mobile}
										{p.existingCouponCode ? ` [Current Coupon: ${p.existingCouponCode}]` : ''}
										{p.hasAcceptedPolicy ? ' (Policy Signed)' : ''}
									</option>
								))}
							</select>
							{approvedPartners.length === 0 && !partnersLoading && (
								<div className='text-danger fs-8 mt-1'>
									No approved partners found. Please review and accept applications in{' '}
									<Link to='/rag/pro-partner/applications' className='text-danger text-decoration-underline'>
										Pro Partner Applications
									</Link>{' '}
									first.
								</div>
							)}
						</div>

						{/* Step 2: Coupon Code & Title */}
						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Coupon Code
								</label>
								<input
									type='text'
									className='form-control form-control-solid font-monospace text-uppercase'
									placeholder='e.g. RAGPOONAM001'
									value={couponAdd.coupon_code}
									onChange={(e) =>
										setCouponAdd({
											...couponAdd,
											coupon_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
										})
									}
									required
								/>
								<div className='form-text fs-8 text-muted'>
									Auto-generated sequential code: RAG + Partner Name + 001 (e.g. RAGPOONAM001). Can be edited if needed.
								</div>
							</div>

							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Campaign / Reference Title
								</label>
								<input
									type='text'
									className='form-control form-control-solid'
									placeholder='e.g. Poonam Parekh - Pro Partner Referral'
									value={couponAdd.title}
									onChange={(e) => setCouponAdd({ ...couponAdd, title: e.target.value })}
									required
								/>
							</div>
						</div>

						{/* Step 3: Discount Type & Amount */}
						<div className='row g-3 mb-3'>
							<div className='col-md-4'>
								<label className='form-label fw-bold text-dark fs-7'>Discount Type</label>
								<select
									className='form-select form-select-solid'
									value={couponAdd.discount_type}
									onChange={(e) => setCouponAdd({ ...couponAdd, discount_type: e.target.value })}
								>
									<option value='percent'>Percentage (%)</option>
									<option value='rupees'>Fixed Rupees (₹)</option>
								</select>
							</div>

							<div className='col-md-4'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Discount Value
								</label>
								<div className='input-group input-group-solid'>
									<span className='input-group-text'>
										{couponAdd.discount_type === 'percent' ? '%' : '₹'}
									</span>
									<input
										type='number'
										min='1'
										max={couponAdd.discount_type === 'percent' ? '90' : '10000'}
										className='form-control'
										value={couponAdd.discount}
										onChange={(e) => setCouponAdd({ ...couponAdd, discount: e.target.value })}
										required
									/>
								</div>
							</div>

							<div className='col-md-4'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Max Usage Limit
								</label>
								<input
									type='number'
									min='1'
									className='form-control form-control-solid'
									value={couponAdd.max_usage_count}
									onChange={(e) => setCouponAdd({ ...couponAdd, max_usage_count: e.target.value })}
									required
								/>
							</div>
						</div>

						{/* Step 4: Expiry Date & Product Scope */}
						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Expiry Date
								</label>
								<input
									type='date'
									className='form-control form-control-solid'
									value={couponAdd.expired_at}
									min={DayJS().format('YYYY-MM-DD')}
									onChange={(e) => setCouponAdd({ ...couponAdd, expired_at: e.target.value })}
									required
								/>
							</div>

							<div className='col-md-6'>
								<label className='form-label fw-bold text-dark fs-7'>Applicable Scope</label>
								<select
									className='form-select form-select-solid'
									value={couponAdd.scope}
									onChange={(e) => setCouponAdd({ ...couponAdd, scope: e.target.value })}
								>
									<option value='ALL'>All Catalog Products (Recommended)</option>
									<option value='SPECIFIC_PRODUCTS'>Specific Selected Products Only</option>
								</select>
							</div>
						</div>

						{/* Product Selection if Specific Products */}
						{couponAdd.scope === 'SPECIFIC_PRODUCTS' && (
							<div
								className='p-3 rounded mb-3'
								style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
							>
								<label className='form-label fw-bold text-dark fs-7 mb-2'>
									Select Applicable Products ({couponAdd.applicable_products.length} selected)
								</label>
								<input
									type='text'
									className='form-control form-control-solid mb-2 fs-8'
									placeholder='Filter products by title...'
									value={productSearch}
									onChange={(e) => setProductSearch(e.target.value)}
								/>
								<div style={{ maxHeight: '180px', overflowY: 'auto' }}>
									{catalogProducts
										.filter((p: any) =>
											(p.name || '').toLowerCase().includes(productSearch.toLowerCase())
										)
										.map((p: any) => {
											const isSelected = couponAdd.applicable_products.includes(p._id)
											return (
												<label
													key={p._id}
													className='d-flex align-items-center gap-2 p-2 border-bottom cursor-pointer hover-bg-light'
												>
													<input
														type='checkbox'
														checked={isSelected}
														onChange={(e) => {
															if (e.target.checked) {
																setCouponAdd({
																	...couponAdd,
																	applicable_products: [...couponAdd.applicable_products, p._id],
																})
															} else {
																setCouponAdd({
																	...couponAdd,
																	applicable_products: couponAdd.applicable_products.filter(
																		(id) => id !== p._id
																	),
																})
															}
														}}
													/>
													<span className='fs-8 fw-semibold text-dark'>{p.name}</span>
													{p.flavour && (
														<span className='badge bg-light text-muted fs-9'>{p.flavour}</span>
													)}
												</label>
											)
										})}
								</div>
							</div>
						)}
					</Modal.Body>

					<Modal.Footer>
						<button
							type='button'
							className='btn btn-light'
							onClick={() => {
								setShowCreateModal(false)
								resetCreateForm()
							}}
							disabled={submitting}
						>
							Cancel
						</button>
						<button
							type='submit'
							className='btn btn-primary'
							style={{ background: '#047857', borderColor: '#047857' }}
							disabled={submitting || approvedPartners.length === 0}
						>
							{submitting ? 'Creating...' : 'Create Partner Coupon'}
						</button>
					</Modal.Footer>
				</form>
			</Modal>

			{/* =========================================================================
			    MODAL 2: UPDATE PRO-PARTNER COUPON
			    ========================================================================= */}
			<Modal
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}
				size='lg'
				centered
				backdrop='static'
			>
				<form onSubmit={handleUpdateCoupon}>
					<Modal.Header closeButton>
						<Modal.Title className='d-flex align-items-center gap-2'>
							<FontAwesomeIcon icon={faEdit} className='text-warning' />
							<span>Edit Coupon: {updateData.coupon_code}</span>
						</Modal.Title>
					</Modal.Header>

					<Modal.Body className='py-4'>
						<div className='mb-3'>
							<label className='form-label fw-bold text-dark fs-7'>Assigned Partner</label>
							<input
								type='text'
								className='form-control form-control-solid'
								value={updateData.partner_name || 'Pro Partner'}
								disabled
							/>
						</div>

						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Coupon Code
								</label>
								<input
									type='text'
									className='form-control form-control-solid font-monospace text-uppercase'
									value={updateData.coupon_code}
									onChange={(e) =>
										setUpdateData({
											...updateData,
											coupon_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
										})
									}
									required
								/>
							</div>

							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>Title</label>
								<input
									type='text'
									className='form-control form-control-solid'
									value={updateData.title}
									onChange={(e) => setUpdateData({ ...updateData, title: e.target.value })}
									required
								/>
							</div>
						</div>

						<div className='row g-3 mb-3'>
							<div className='col-md-4'>
								<label className='form-label fw-bold text-dark fs-7'>Discount Type</label>
								<select
									className='form-select form-select-solid'
									value={updateData.discount_type}
									onChange={(e) => setUpdateData({ ...updateData, discount_type: e.target.value })}
								>
									<option value='percent'>Percentage (%)</option>
									<option value='rupees'>Fixed Rupees (₹)</option>
								</select>
							</div>

							<div className='col-md-4'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Discount Value
								</label>
								<input
									type='number'
									className='form-control form-control-solid'
									value={updateData.discount}
									onChange={(e) => setUpdateData({ ...updateData, discount: e.target.value })}
									required
								/>
							</div>

							<div className='col-md-4'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Max Usage Limit
								</label>
								<input
									type='number'
									className='form-control form-control-solid'
									value={updateData.max_usage_count}
									onChange={(e) =>
										setUpdateData({ ...updateData, max_usage_count: e.target.value })
									}
									required
								/>
							</div>
						</div>

						<div className='row g-3 mb-3'>
							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Expiry Date
								</label>
								<input
									type='date'
									className='form-control form-control-solid'
									value={updateData.expired_at}
									onChange={(e) => setUpdateData({ ...updateData, expired_at: e.target.value })}
									required
								/>
							</div>

							<div className='col-md-6'>
								<label className='form-label fw-bold text-dark fs-7'>Scope</label>
								<select
									className='form-select form-select-solid'
									value={updateData.scope}
									onChange={(e) => setUpdateData({ ...updateData, scope: e.target.value })}
								>
									<option value='ALL'>All Catalog Products</option>
									<option value='SPECIFIC_PRODUCTS'>Specific Selected Products</option>
								</select>
							</div>
						</div>
					</Modal.Body>

					<Modal.Footer>
						<button
							type='button'
							className='btn btn-light'
							onClick={() => setShowUpdateModal(false)}
							disabled={submitting}
						>
							Cancel
						</button>
						<button type='submit' className='btn btn-primary' disabled={submitting}>
							{submitting ? 'Saving...' : 'Save Changes'}
						</button>
					</Modal.Footer>
				</form>
			</Modal>

			{/* =========================================================================
			    MODAL 3: GENERATE SHAREABLE LINK
			    ========================================================================= */}
			<Modal
				show={showGenerateModal}
				onHide={() => setShowGenerateModal(false)}
				size='md'
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title className='d-flex align-items-center gap-2'>
						<FontAwesomeIcon icon={faLink} className='text-primary' />
						<span>Generate Partner Referral Link</span>
					</Modal.Title>
				</Modal.Header>

				<Modal.Body className='py-4'>
					<p className='text-muted fs-7 mb-3'>
						Send this link to the Pro-Partner. Any customer visiting this URL will automatically have code{' '}
						<strong>{generateData.CouponCode}</strong> applied at checkout.
					</p>

					<div className='mb-3'>
						<label className='form-label fw-bold text-dark fs-7'>Store Page URL</label>
						<div className='input-group'>
							<input
								type='url'
								className='form-control form-control-solid'
								value={generateData.PasteURL}
								onChange={(e) =>
									setGenerateData({ ...generateData, PasteURL: e.target.value })
								}
								placeholder='https://gomzinutrition.com/shop'
							/>
							<button
								type='button'
								onClick={constructCustomLink}
								className='btn btn-secondary'
							>
								Update
							</button>
						</div>
					</div>

					<div className='mb-3'>
						<label className='form-label fw-bold text-dark fs-7'>
							Generated Partner Link
						</label>
						<div className='d-flex align-items-center gap-2'>
							<input
								type='text'
								readOnly
								className='form-control form-control-solid font-monospace fs-8'
								value={generateData.GenerateLink}
							/>
							<CopyButton textToCopy={generateData.GenerateLink} />
						</div>
					</div>
				</Modal.Body>

				<Modal.Footer>
					<button
						type='button'
						className='btn btn-light'
						onClick={() => setShowGenerateModal(false)}
					>
						Close
					</button>
				</Modal.Footer>
			</Modal>
		</div>
	)
}

export default ProPartnerCoupons
