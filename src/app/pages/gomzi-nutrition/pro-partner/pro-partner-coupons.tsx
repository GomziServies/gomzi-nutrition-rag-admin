/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faCheckCircle,
	faDownload,
	faEdit,
	faFileAlt,
	faFilePdf,
	faHandHoldingUsd,
	faLink,
	faPlus,
	faReceipt,
	faShoppingBag,
	faTag,
	faUser,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import CopyButton from '../../../components/motion/CopyButton'
import {
	CreateReferralCoupon,
	GetContactInquiry,
	GetProduct,
	GetReferralCoupon,
	GetReferralCouponUsage,
	UpdateReferralCoupon,
} from '../../../Functions/FGGroup'
import { getProfile } from '../../../Functions/FGGroup/AccountFunctions'
import { isProPartnerApplication } from '../contact-inquiry/contactInquiryUtils'
import {
	getPartnerApplicationStatus,
	handleViewPartnerAgreement,
} from '../contact-inquiry/PartnerApplicationActions'
import { isUserAdmin, isProPartnerOnlyUser } from '../../../modules/auth'
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
	policyAcceptedAt?: string
	policyVersion?: string
	policyAcceptedName?: string
	existingCouponCode?: string
	rawInquiry?: any
}

export interface PartnerOrderTransaction {
	id: string
	orderId: string
	receiptId: string
	couponCode: string
	couponTitle: string
	partnerName: string
	partnerEmail: string
	partnerMobile: string
	customerName: string
	customerMobile: string
	customerEmail: string
	productId: string
	productName: string
	productImage: string
	productCategory: string
	productPrice: number
	quantity: number
	orderAmount: number
	discountAmount: number
	discountPercent: number
	paidAmount: number
	commissionAmount: number
	commissionRate: number
	creditTime: string
	orderStatus: string
	commissionStatus: 'CREDITED' | 'PAID' | 'PENDING'
}

const RAG_CONTACT_SOURCE_FILTER = 'gomzilifesciences|ragnutrition|contact-us|5173|whey|rag'
const DEFAULT_COMMISSION_PERCENT = 10

const ProPartnerCoupons: React.FC<{ defaultTab?: string }> = ({ defaultTab = 'coupons' }) => {
	const location = useLocation()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	// Active tab: 'coupons' | 'orders' | 'commissions'
	const [activeTab, setActiveTab] = useState<'coupons' | 'orders' | 'commissions'>(() => {
		const path = location.pathname.toLowerCase()
		if (path.includes('commissions')) return 'commissions'
		if (path.includes('orders')) return 'orders'
		if (defaultTab === 'commissions' || defaultTab === 'orders') return defaultTab
		return 'coupons'
	})

	useEffect(() => {
		const path = location.pathname.toLowerCase()
		if (path.includes('commissions')) {
			setActiveTab('commissions')
		} else if (path.includes('orders')) {
			setActiveTab('orders')
		} else {
			setActiveTab('coupons')
		}
	}, [location.pathname, defaultTab])

	// Logged-in user context
	const [currentUser, setCurrentUser] = useState<any>(() => {
		try {
			const raw = localStorage.getItem('fg_group_info') || localStorage.getItem('portal_info')
			return raw ? JSON.parse(raw) : null
		} catch {
			return null
		}
	})

	const isAdmin = isUserAdmin(currentUser)
	const isPartnerOnly = isProPartnerOnlyUser(currentUser)
	const canManageCoupons = isAdmin && !isPartnerOnly

	const [searchTerm, setSearchTerm] = useState('')
	const [productSearch, setProductSearch] = useState('')
	const [referenceData, setReferenceData] = useState<any[]>([])
	const [approvedPartners, setApprovedPartners] = useState<ApprovedPartner[]>([])
	const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
	const [catalogProducts, setCatalogProducts] = useState<any[]>([])
	const [productMap, setProductMap] = useState<Record<string, any>>({})
	const [loading, setLoading] = useState(true)
	const [ordersLoading, setOrdersLoading] = useState(false)

	// Orders placed for this user's coupon(s)
	const [allPartnerOrders, setAllPartnerOrders] = useState<PartnerOrderTransaction[]>([])

	// Modals
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [showAgreementModal, setShowAgreementModal] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	// Forms
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

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	// Reset page when search or tab changes
	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm, activeTab])

	// 1. Fetch Coupons
	const fetchProPartnerCoupons = async () => {
		setLoading(true)
		try {
			const response: any = await GetReferralCoupon({ coupon_type: 'pro_partner' })
			const rawList: any[] = Array.isArray(response?.data) ? response.data : []
			const sortedList = [...rawList].sort(
				(a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
			)
			setReferenceData(sortedList)
			return sortedList
		} catch (error) {
			console.error('Error fetching partner coupons:', error)
			return []
		} finally {
			setLoading(false)
		}
	}

	// 2. Fetch Approved Partners (for agreement docs)
	const fetchApprovedPartners = async () => {
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
						policyAcceptedAt: item.partner_policy?.accepted_at,
						policyVersion: item.partner_policy?.version || 'v1.0',
						policyAcceptedName: item.partner_policy?.accepted_name || item.name,
						existingCouponCode: d.assigned_coupon_code || '',
						rawInquiry: item,
					}
				})

			setApprovedPartners(approvedList)
			const qPid = searchParams.get('partner_id')
			if (qPid) {
				setSelectedPartnerId(qPid)
			} else if (isAdmin && approvedList.length > 0) {
				setSelectedPartnerId(approvedList[0].id)
			}
			return approvedList
		} catch (error) {
			console.error('Error fetching approved partners:', error)
			return []
		}
	}

	// 3. Fetch Products
	const fetchProductCatalog = async () => {
		try {
			const response: any = await GetProduct({ limit: 500, page: 1 })
			const raw = response?.data?.data || response?.data || []
			const list = Array.isArray(raw) ? raw : []
			setCatalogProducts(list)

			const map: Record<string, any> = {}
			list.forEach((p: any) => {
				if (p && p._id) map[String(p._id)] = p
			})
			setProductMap(map)
			return map
		} catch (error) {
			console.error('Error fetching product catalog:', error)
			return {}
		}
	}

	// 4. Fetch Coupon Usage & Orders FOR THIS USER'S COUPONS ONLY
	const fetchCouponUsageOrders = async (coupons: any[], pMap: Record<string, any>) => {
		if (!coupons || coupons.length === 0) {
			setAllPartnerOrders([])
			return
		}
		setOrdersLoading(true)

		try {
			const transactions: PartnerOrderTransaction[] = []

			const usagePromises = coupons.map(async (coupon: any) => {
				if (!coupon._id) return []
				try {
					const res: any = await GetReferralCouponUsage({ coupon_id: coupon._id })
					const usageData = res?.data?.[0] || res?.data || {}
					const ordersList: any[] = Array.isArray(usageData?.orders)
						? usageData.orders
						: Array.isArray(usageData)
						? usageData
						: []

					const partnerName =
						coupon.partner_name ||
						coupon.assign_trainer?.name ||
						coupon.partner_inquiry_id?.name ||
						coupon.partner_inquiry_id?.details?.full_name ||
						'Pro Partner'
					const partnerEmail =
						coupon.partner_email ||
						coupon.partner_inquiry_id?.email ||
						coupon.partner_inquiry_id?.details?.email ||
						''
					const partnerMobile =
						coupon.partner_mobile ||
						coupon.partner_inquiry_id?.mobile ||
						coupon.partner_inquiry_id?.details?.mobile ||
						''

					const couponDiscountPercent =
						coupon.discount_type === 'percent' ? Number(coupon.discount || 10) : 10
					const commissionRate = DEFAULT_COMMISSION_PERCENT

					return ordersList.map((ord: any, idx: number) => {
						const userObj = ord?.user || ord?.user_id || {}
						const customerName =
							`${userObj?.first_name || ''} ${userObj?.last_name || ''}`.trim() ||
							ord?.shipping_address?.name ||
							'Customer'
						const customerMobile =
							userObj?.phone_number || userObj?.mobile || ord?.shipping_address?.mobile || 'N/A'
						const customerEmail = userObj?.email || ord?.shipping_address?.email || ''

						const productId = String(ord.order_item_id || ord.product_id || '')
						const productObj = pMap[productId] || {}
						const productName =
							productObj?.title ||
							productObj?.name ||
							ord?.order_item_name ||
							ord?.product_name ||
							ord?.order_item_type?.replace(/_/g, ' ') ||
							'RAG Nutrition Product'
						const productImage =
							productObj?.images?.[0] || productObj?.thumbnail || productObj?.image || ''
						const productPrice = Number(productObj?.price || ord.amount || 0)

						const grossAmount = Number(ord.amount || productPrice || 0)
						const discountGiven = (grossAmount * couponDiscountPercent) / 100
						const netPaid = Math.max(0, grossAmount - discountGiven)
						const commissionAmount = Number(((grossAmount * commissionRate) / 100).toFixed(2))

						const creditTime = ord.createdAt || ord.updatedAt || new Date().toISOString()

						const transaction: PartnerOrderTransaction = {
							id: String(ord._id || `${coupon._id}-ord-${idx}`),
							orderId: String(ord._id || ord.order_id || ''),
							receiptId: String(
								ord.receipt_id ||
									ord.gateway_order_id ||
									`REC-${ord._id ? ord._id.slice(-6).toUpperCase() : 'N/A'}`
							),
							couponCode: coupon.coupon_code || '',
							couponTitle: coupon.title || '',
							partnerName,
							partnerEmail,
							partnerMobile,
							customerName,
							customerMobile,
							customerEmail,
							productId,
							productName,
							productImage,
							productCategory:
								productObj?.category?.title || productObj?.category?.name || 'Supplements',
							productPrice: productPrice || grossAmount,
							quantity: Number(ord.quantity || 1),
							orderAmount: grossAmount,
							discountAmount: discountGiven,
							discountPercent: couponDiscountPercent,
							paidAmount: netPaid,
							commissionAmount,
							commissionRate,
							creditTime,
							orderStatus: ord.status || ord.shipment_status || 'DELIVERED',
							commissionStatus: 'CREDITED',
						}
						return transaction
					})
				} catch (err) {
					console.error(`Error loading orders for coupon ${coupon.coupon_code}:`, err)
					return []
				}
			})

			const settled = await Promise.allSettled(usagePromises)
			settled.forEach((res) => {
				if (res.status === 'fulfilled' && Array.isArray(res.value)) {
					transactions.push(...res.value)
				}
			})

			transactions.sort((a, b) => new Date(b.creditTime).getTime() - new Date(a.creditTime).getTime())
			setAllPartnerOrders(transactions)
		} catch (error) {
			console.error('Error fetching partner orders:', error)
		} finally {
			setOrdersLoading(false)
		}
	}

	// 5. Initial Data Load & Profile Synchronization
	useEffect(() => {
		const init = async () => {
			// Always fetch fresh profile first to verify logged-in user identity
			let profile = currentUser
			try {
				const profRes: any = await getProfile()
				if (profRes?.data) {
					profile = profRes.data
					setCurrentUser(profRes.data)
					localStorage.setItem('fg_group_info', JSON.stringify(profRes.data))
				}
			} catch (e) {
				console.error('Failed to fetch profile', e)
			}

			const [coupons, pMap] = await Promise.all([
				fetchProPartnerCoupons(),
				fetchProductCatalog(),
				fetchApprovedPartners(),
			])

			// Filter only this user's coupon(s) to fetch usage
			const userEmail = (profile?.email || '').toLowerCase().trim()
			const userMobile = (profile?.mobile || profile?.phone_number || profile?.phone || '')
				.trim()
				.replace(/[^0-9]/g, '')
			const userId = String(profile?._id || profile?.id || '').trim()
			const directCode = (
				profile?.assigned_coupon ||
				profile?.coupon_code ||
				profile?.partner_coupon ||
				localStorage.getItem('assigned_coupon_code') ||
				''
			)
				.toUpperCase()
				.trim()

			const matchedUserCoupons = coupons.filter((c: any) => {
				const cCode = (c.coupon_code || '').toUpperCase().trim()
				if (directCode && cCode === directCode) return true

				const cEmail = (
					c.partner_email ||
					c.partner_inquiry_id?.email ||
					c.partner_inquiry_id?.details?.email ||
					''
				)
					.toLowerCase()
					.trim()
				if (userEmail && cEmail && cEmail === userEmail) return true

				const cMobile = (
					c.partner_mobile ||
					c.partner_inquiry_id?.mobile ||
					c.partner_inquiry_id?.details?.mobile ||
					''
				)
					.trim()
					.replace(/[^0-9]/g, '')
				if (userMobile && cMobile) {
					if (cMobile === userMobile) return true
					if (cMobile.length >= 10 && userMobile.length >= 10 && cMobile.slice(-10) === userMobile.slice(-10))
						return true
				}

				const inqId = String(c.partner_inquiry_id?._id || c.partner_inquiry_id || '').trim()
				if (userId && inqId && inqId === userId) return true

				const trainerId = String(c.assign_trainer?.trainer_id || '').trim()
				if (userId && trainerId && trainerId === userId) return true

				const createdBy = String(c.user_id || c.created_by || '').trim()
				if (userId && createdBy && createdBy === userId) return true

				return false
			})

			if (matchedUserCoupons.length > 0) {
				fetchCouponUsageOrders(matchedUserCoupons, pMap)
			} else {
				setAllPartnerOrders([])
			}
		}
		init()
	}, [])

	// =========================================================================
	// RESOLVE LOGGED-IN PARTNER USER IDENTITY (NO DROPDOWN, ONLY HIS DETAILS)
	// =========================================================================
	const loggedInUserName = useMemo(() => {
		return (
			currentUser?.full_name ||
			currentUser?.name ||
			`${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() ||
			'Pro Partner'
		)
	}, [currentUser])

	const loggedInUserEmail = useMemo(() => {
		return (currentUser?.email || '').toLowerCase().trim()
	}, [currentUser])

	const loggedInUserMobile = useMemo(() => {
		return (currentUser?.mobile || currentUser?.phone_number || currentUser?.phone || '')
			.trim()
			.replace(/[^0-9]/g, '')
	}, [currentUser])

	const loggedInUserId = useMemo(() => {
		return String(currentUser?._id || currentUser?.id || '').trim()
	}, [currentUser])

	// Match the partner inquiry for digital agreement document
	const matchedInquiry = useMemo(() => {
		if (!approvedPartners || approvedPartners.length === 0) return null

		return (
			approvedPartners.find((p) => {
				const pEmail = (p.email || '').toLowerCase().trim()
				if (loggedInUserEmail && pEmail && pEmail === loggedInUserEmail) return true

				const pMobile = (p.mobile || '').trim().replace(/[^0-9]/g, '')
				if (loggedInUserMobile && pMobile) {
					if (pMobile === loggedInUserMobile) return true
					if (pMobile.length >= 10 && loggedInUserMobile.length >= 10 && pMobile.slice(-10) === loggedInUserMobile.slice(-10))
						return true
				}

				const pId = String(p.id || p.rawInquiry?._id || '').trim()
				if (loggedInUserId && pId && pId === loggedInUserId) return true

				const pName = (p.name || '').toLowerCase().trim()
				if (loggedInUserName && pName && pName === loggedInUserName.toLowerCase()) return true

				return false
			}) || null
		)
	}, [
		approvedPartners,
		loggedInUserEmail,
		loggedInUserMobile,
		loggedInUserId,
		loggedInUserName,
	])

	// The active partner object:
	// For Pro Partner accounts: strictly the logged-in user.
	// For Administrators: the partner selected from the partner selector dropdown.
	const activePartner = useMemo(() => {
		if (isPartnerOnly) {
			return {
				id:
					matchedInquiry?.id ||
					loggedInUserId,
				name: loggedInUserName,
				email: loggedInUserEmail || matchedInquiry?.email || '',
				mobile: loggedInUserMobile || matchedInquiry?.mobile || '',
				city: matchedInquiry?.city || currentUser?.city || '',
				state: matchedInquiry?.state || currentUser?.state || '',
				hasAcceptedPolicy: Boolean(
					matchedInquiry?.hasAcceptedPolicy ||
						currentUser?.has_accepted_policy
				),
				policyAcceptedAt:
					matchedInquiry?.policyAcceptedAt ||
					'',
				policyVersion: matchedInquiry?.policyVersion || 'v1.0',
				policyAcceptedName: matchedInquiry?.policyAcceptedName || loggedInUserName,
				inquiryId:
					matchedInquiry?.id ||
					'',
				existingCouponCode: matchedInquiry?.existingCouponCode || '',
			}
		}

		// When Admin is viewing
		const partner = approvedPartners.find((p) => p.id === selectedPartnerId) || approvedPartners[0]
		if (partner) {
			return {
				id: partner.id,
				name: partner.name,
				email: partner.email,
				mobile: partner.mobile,
				city: partner.city,
				state: partner.state,
				hasAcceptedPolicy: partner.hasAcceptedPolicy,
				policyAcceptedAt: partner.policyAcceptedAt || '',
				policyVersion: partner.policyVersion || 'v1.0',
				policyAcceptedName: partner.policyAcceptedName || partner.name,
				inquiryId: partner.id,
				existingCouponCode: partner.existingCouponCode || '',
			}
		}

		return {
			id: loggedInUserId,
			name: loggedInUserName,
			email: loggedInUserEmail || '',
			mobile: loggedInUserMobile || '',
			city: '',
			state: '',
			hasAcceptedPolicy: false,
			policyAcceptedAt: '',
			policyVersion: 'v1.0',
			policyAcceptedName: loggedInUserName,
			inquiryId: '',
			existingCouponCode: '',
		}
	}, [
		isPartnerOnly,
		selectedPartnerId,
		approvedPartners,
		matchedInquiry,
		currentUser,
		loggedInUserName,
		loggedInUserEmail,
		loggedInUserMobile,
		loggedInUserId,
	])

	// Filter: ONLY COUPONS ASSIGNED TO THIS ACTIVE PARTNER
	const assignedCoupons = useMemo(() => {
		if (!referenceData || referenceData.length === 0) return []

		const partnerEmail = (activePartner.email || '').toLowerCase().trim()
		const partnerMobile = (activePartner.mobile || '').trim().replace(/[^0-9]/g, '')
		const partnerId = String(activePartner.id || activePartner.inquiryId || '').trim()
		const partnerName = (activePartner.name || '').toLowerCase().trim()

		const directCode = (
			activePartner?.existingCouponCode ||
			(isPartnerOnly
				? currentUser?.assigned_coupon ||
				  currentUser?.coupon_code ||
				  currentUser?.partner_coupon ||
				  localStorage.getItem('assigned_coupon_code') ||
				  ''
				: '')
		)
			.toUpperCase()
			.trim()

		return referenceData.filter((c: any) => {
			const cCode = (c.coupon_code || '').toUpperCase().trim()
			if (directCode && cCode === directCode) return true

			const cEmail = (
				c.partner_email ||
				c.partner_inquiry_id?.email ||
				c.partner_inquiry_id?.details?.email ||
				''
			)
				.toLowerCase()
				.trim()
			if (partnerEmail && cEmail && cEmail === partnerEmail) return true

			const cMobile = (
				c.partner_mobile ||
				c.partner_inquiry_id?.mobile ||
				c.partner_inquiry_id?.details?.mobile ||
				''
			)
				.trim()
				.replace(/[^0-9]/g, '')
			if (partnerMobile && cMobile) {
				if (cMobile === partnerMobile) return true
				if (cMobile.length >= 10 && partnerMobile.length >= 10 && cMobile.slice(-10) === partnerMobile.slice(-10))
					return true
			}

			const inqId = String(c.partner_inquiry_id?._id || c.partner_inquiry_id || '').trim()
			if (partnerId && inqId && inqId === partnerId) return true

			const trainerId = String(c.assign_trainer?.trainer_id || '').trim()
			if (partnerId && trainerId && trainerId === partnerId) return true

			const createdBy = String(c.user_id || c.created_by || '').trim()
			if (partnerId && createdBy && createdBy === partnerId) return true

			const cName = (
				c.partner_name ||
				c.assign_trainer?.name ||
				c.partner_inquiry_id?.name ||
				c.partner_inquiry_id?.details?.full_name ||
				''
			)
				.toLowerCase()
				.trim()
			if (partnerName && cName && cName === partnerName) return true

			return false
		})
	}, [referenceData, activePartner, currentUser, isPartnerOnly])

	// Automatically load coupon usage whenever assignedCoupons or productMap changes
	useEffect(() => {
		if (assignedCoupons.length > 0 && Object.keys(productMap).length > 0) {
			fetchCouponUsageOrders(assignedCoupons, productMap)
		} else if (assignedCoupons.length === 0) {
			setAllPartnerOrders([])
		}
	}, [assignedCoupons, productMap])

	// Primary Assigned Coupon for this partner
	const primaryCoupon = assignedCoupons[0] || null

	// The partner selected in the coupon creation dropdown (defaults to activePartner)
	const selectedPartner = useMemo(() => {
		return approvedPartners.find((p) => p.id === selectedPartnerId) || activePartner
	}, [approvedPartners, selectedPartnerId, activePartner])

	// Filter: ONLY ORDERS TIED TO THIS PARTNER'S ASSIGNED COUPON(S)
	const partnerOrders = useMemo(() => {
		if (!assignedCoupons || assignedCoupons.length === 0) return []
		const partnerCodes = new Set(
			assignedCoupons.map((c: any) => (c.coupon_code || '').toUpperCase().trim()).filter(Boolean)
		)
		return allPartnerOrders.filter(
			(ord) => partnerCodes.has((ord.couponCode || '').toUpperCase().trim())
		)
	}, [allPartnerOrders, assignedCoupons])

	// Filtered by Search inside order history
	const filteredOrders = useMemo(() => {
		const q = searchTerm.toLowerCase().trim()
		if (!q) return partnerOrders

		return partnerOrders.filter((ord) => {
			return (
				ord.receiptId.toLowerCase().includes(q) ||
				ord.customerName.toLowerCase().includes(q) ||
				ord.customerMobile.toLowerCase().includes(q) ||
				ord.productName.toLowerCase().includes(q)
			)
		})
	}, [partnerOrders, searchTerm])

	// Paginated Orders
	const paginatedOrders = useMemo(() => {
		const start = (pagination.page - 1) * pagination.itemsPerPage
		return filteredOrders.slice(start, start + pagination.itemsPerPage)
	}, [filteredOrders, pagination])

	// Coupon Specific Performance Aggregations
	const metrics = useMemo(() => {
		const totalOrders = partnerOrders.length
		const totalGrossSales = partnerOrders.reduce((sum, ord) => sum + ord.orderAmount, 0)
		const totalDiscounts = partnerOrders.reduce((sum, ord) => sum + ord.discountAmount, 0)
		const totalCommission = partnerOrders.reduce((sum, ord) => sum + ord.commissionAmount, 0)
		const totalNetPaid = partnerOrders.reduce((sum, ord) => sum + ord.paidAmount, 0)

		return {
			totalOrders,
			totalGrossSales,
			totalDiscounts,
			totalCommission,
			totalNetPaid,
		}
	}, [partnerOrders])

	// Download Excel for this Partner's Orders
	const downloadPartnerOrdersExcel = () => {
		if (!primaryCoupon) return
		const partnerName = activePartner.name || 'Partner'
		const worksheetData = filteredOrders.map((ord, idx) => ({
			'#': idx + 1,
			'Order Receipt ID': ord.receiptId,
			'Order Date & Time': DayJS(ord.creditTime).format('YYYY-MM-DD hh:mm A'),
			'Customer Name': ord.customerName,
			'Customer Phone': ord.customerMobile,
			'Product Name': ord.productName,
			'Product Category': ord.productCategory,
			'Quantity': ord.quantity,
			'Gross Order Value (INR)': ord.orderAmount,
			'Customer Discount (INR)': ord.discountAmount,
			'Net Paid Amount (INR)': ord.paidAmount,
			'Partner Commission Credited (INR)': ord.commissionAmount,
			'Commission Rate': `${ord.commissionRate}%`,
			'Commission Status': ord.commissionStatus,
		}))

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Referred Orders')
		XLSX.writeFile(
			workbook,
			`${partnerName.replace(/\s+/g, '_')}_Coupon_Orders_${DayJS().format('YYYY-MM-DD')}.xlsx`
		)
	}

	const handleDownloadDoc = () => {
		const inquiryId =
			activePartner.inquiryId ||
			matchedInquiry?.id ||
			primaryCoupon?.partner_inquiry_id?._id ||
			primaryCoupon?.partner_inquiry_id
		if (inquiryId) {
			handleViewPartnerAgreement(inquiryId)
		} else {
			toast.error('Partner policy agreement document is pending digital generation')
		}
	}

	// Generates sequential coupon code: RAG[NAME]001, RAG[NAME]002... and guarantees no duplicates
	const computePartnerCouponCode = (name: string) => {
		const cleanFirstName =
			name
				.trim()
				.split(' ')[0]
				.replace(/[^a-zA-Z0-9]/g, '')
				.toUpperCase() || 'PARTNER'
		const prefix = `RAG${cleanFirstName}`

		// Gather all existing coupon codes from referenceData and approvedPartners
		const existingCodes = new Set<string>()
		referenceData.forEach((c: any) => {
			if (c.coupon_code) existingCodes.add(c.coupon_code.trim().toUpperCase())
		})
		approvedPartners.forEach((p: any) => {
			if (p.existingCouponCode) existingCodes.add(p.existingCouponCode.trim().toUpperCase())
		})

		const regex = new RegExp(`^${prefix}(\\d+)$`, 'i')
		let maxSeq = 0
		existingCodes.forEach((code) => {
			const match = code.match(regex)
			if (match && match[1]) {
				const num = parseInt(match[1], 10)
				if (!isNaN(num) && num > maxSeq) maxSeq = num
			}
		})

		let nextSeq = maxSeq + 1
		let candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`
		while (existingCodes.has(candidate)) {
			nextSeq++
			candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`
		}

		return candidate
	}

	// Create Coupon (Admin assigning to selected accepted partner)
	const handleCreateCoupon = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!canManageCoupons) {
			toast.error('Only administrators are authorized to generate and assign coupons.')
			return
		}

		const targetPartner = approvedPartners.find((p) => p.id === selectedPartnerId) || activePartner
		if (!targetPartner || !targetPartner.id) {
			toast.error('Please select an accepted partner from applications')
			return
		}

		const cleanCode = couponAdd.coupon_code.trim().toUpperCase()
		if (!cleanCode) {
			toast.error('Coupon code is required')
			return
		}

		// Prevent duplicate coupon codes
		const codeExists = referenceData.some(
			(c: any) => (c.coupon_code || '').trim().toUpperCase() === cleanCode
		)
		if (codeExists) {
			toast.error(
				`Coupon code "${cleanCode}" already exists. Please enter a unique coupon code.`
			)
			return
		}

		setSubmitting(true)
		try {
			const targetInquiryId =
				targetPartner.rawInquiry?._id || targetPartner.id || targetPartner.inquiryId

			const payload: any = {
				coupon_type: 'pro_partner',
				partner_inquiry_id: targetInquiryId,
				partner_name: targetPartner.name,
				partner_email: targetPartner.email,
				partner_mobile: targetPartner.mobile,
				coupon_code: cleanCode,
				title: couponAdd.title.trim() || `${targetPartner.name} - Referral Discount`,
				discount_type: couponAdd.discount_type,
				discount: Number(couponAdd.discount),
				max_usage_count: Number(couponAdd.max_usage_count),
				expired_at: DayJS(couponAdd.expired_at).format('YYYY/MM/DD'),
				scope: couponAdd.scope,
				applicable_products:
					couponAdd.scope === 'SPECIFIC_PRODUCTS' ? couponAdd.applicable_products : [],
				assign_trainer: {
					trainer_id: targetInquiryId,
					name: targetPartner.name,
				},
			}

			await CreateReferralCoupon(payload)
			toast.success(`Coupon ${cleanCode} created and assigned to ${targetPartner.name}`)
			setShowCreateModal(false)
			localStorage.setItem('assigned_coupon_code', cleanCode)
			const freshCoupons = await fetchProPartnerCoupons()
			fetchApprovedPartners()
			fetchCouponUsageOrders(freshCoupons, productMap)
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Failed to create coupon')
		} finally {
			setSubmitting(false)
		}
	}

	// Update Coupon
	const handleUpdateCoupon = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!canManageCoupons || !updateData._id) return

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
			}

			await UpdateReferralCoupon(payload)
			toast.success('Assigned coupon updated successfully')
			setShowUpdateModal(false)
			const freshCoupons = await fetchProPartnerCoupons()
			fetchApprovedPartners()
			fetchCouponUsageOrders(freshCoupons, productMap)
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Failed to update coupon')
		} finally {
			setSubmitting(false)
		}
	}

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
				title: `${partner.name} - Referral Discount`,
				coupon_code: generatedCode,
			}))
		}
	}

	const openCreateModal = (targetPartnerId?: string) => {
		if (!canManageCoupons) return

		// Default to passed partnerId, or current active partner if found in approvedPartners, or first approved partner
		const partnerToSelect =
			(targetPartnerId && approvedPartners.find((p) => p.id === targetPartnerId)?.id) ||
			approvedPartners.find((p) => p.id === activePartner.id || p.id === activePartner.inquiryId)?.id ||
			(approvedPartners.length > 0 ? approvedPartners[0].id : '')

		setSelectedPartnerId(partnerToSelect)

		const target = approvedPartners.find((p) => p.id === partnerToSelect) || activePartner
		const targetName = target?.name || 'PARTNER'
		const generatedCode = computePartnerCouponCode(targetName)

		setCouponAdd({
			title: `${targetName} - Referral Discount`,
			coupon_code: generatedCode,
			max_usage_count: '1000',
			discount_type: 'percent',
			discount: '10',
			expired_at: DayJS().add(1, 'year').format('YYYY-MM-DD'),
			scope: 'ALL',
			applicable_products: [],
		})
		setProductSearch('')
		setShowCreateModal(true)
	}

	const openEditModal = (c: any) => {
		if (!canManageCoupons) return
		const applicableProductIds = Array.isArray(c.applicable_products)
			? c.applicable_products.map((p: any) => (p && p._id ? p._id : String(p)))
			: []

		setUpdateData({
			_id: c._id,
			title: c.title || '',
			coupon_code: c.coupon_code || '',
			max_usage_count: String(c.max_usage_count || 1000),
			discount_type: c.discount_type || 'percent',
			discount: String(c.discount || 10),
			expired_at: c.expired_at ? DayJS(c.expired_at).format('YYYY-MM-DD') : '',
			scope: c.scope || (applicableProductIds.length > 0 ? 'SPECIFIC_PRODUCTS' : 'ALL'),
			applicable_products: applicableProductIds,
			partner_inquiry_id: c.partner_inquiry_id?._id || c.partner_inquiry_id || '',
			partner_name: c.partner_name || '',
		})
		setProductSearch('')
		setShowUpdateModal(true)
	}

	const shareableLink = primaryCoupon
		? `https://gomzinutrition.com/shop?coupon_code=${primaryCoupon.coupon_code}&ref=${activePartner.id || ''}`
		: ''

	return (
		<div className='gz-prod-container gz-pro-partner-coupons-wrapper'>
			<PageTitle breadcrumbs={[]}>RAG Pro Partner - Assigned Coupon & Orders</PageTitle>

			{/* =========================================================================
			    HEADER BAR & ACTIONS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3'>
				<div className='d-flex align-items-center gap-2'>
					{!isPartnerOnly && (
						<>
							<Link to='/rag/dashboard'>Store Admin</Link>
							<span className='sep'>&gt;</span>
						</>
					)}
					<span className='fw-bold' style={{ color: '#047857' }}>
						💎 RAG Pro Partner Portal
					</span>
					<span className='sep'>&gt;</span>
					<span className='current'>{activePartner.name}</span>
				</div>

				{canManageCoupons && (
					<div className='d-flex align-items-center gap-3 flex-wrap'>
						{approvedPartners.length > 0 && (
							<div className='d-flex align-items-center gap-2'>
								<label className='fs-8 fw-bolder text-muted text-uppercase mb-0'>
									Partner:
								</label>
								<select
									className='form-select form-select-sm fw-semibold'
									style={{
										minWidth: '220px',
										height: '38px',
										borderRadius: '8px',
										background: '#FFFFFF',
										borderColor: '#CBD5E1',
										fontSize: '12.5px',
									}}
									value={selectedPartnerId}
									onChange={(e) => {
										const pid = e.target.value
										setSelectedPartnerId(pid)
										navigate(`/rag/pro-partner/coupons?partner_id=${pid}`, { replace: true })
									}}>
									{approvedPartners.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name} {p.email ? `(${p.email})` : ''} {p.existingCouponCode ? `• [${p.existingCouponCode}]` : ''}
										</option>
									))}
								</select>
							</div>
						)}

						<button
							type='button'
							onClick={() => openCreateModal()}
							className='btn btn-sm d-inline-flex align-items-center gap-2'
							style={{
								background: '#047857',
								borderColor: '#047857',
								color: '#ffffff',
								fontWeight: 600,
								padding: '8px 16px',
								borderRadius: '8px',
								boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
							}}>
							<FontAwesomeIcon icon={faPlus} />
							<span>+ Create Coupon</span>
						</button>
					</div>
				)}
			</div>

			{/* =========================================================================
			    1. ASSIGNED COUPON & OFFICIAL DOCUMENT HERO CARD (ONLY FOR THIS LOGGED-IN USER)
			    ========================================================================= */}
			<div className='gz-partner-hero-card'>
				<div className='row g-4 align-items-center'>
					{/* Left: Logged-in Partner & Their Assigned Coupon Code */}
					<div className='col-lg-6'>
						<div className='d-flex align-items-start gap-3'>
							<div
								className='d-flex align-items-center justify-content-center fw-bold text-white'
								style={{
									width: '56px',
									height: '56px',
									borderRadius: '14px',
									background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
									fontSize: '24px',
									boxShadow: '0 4px 14px rgba(5, 150, 105, 0.28)',
									flexShrink: 0,
								}}>
								{activePartner.name.charAt(0).toUpperCase()}
							</div>
							<div className='flex-grow-1'>
								<div className='d-flex align-items-center gap-2 flex-wrap mb-1'>
									<h2 className='fw-bolder text-dark mb-0' style={{ fontSize: '22px' }}>
										{activePartner.name}
									</h2>
									<span
										className='badge'
										style={{
											background: '#ECFDF5',
											color: '#047857',
											border: '1px solid #A7F3D0',
											fontSize: '11px',
											fontWeight: 700,
											padding: '3px 8px',
										}}>
										<FontAwesomeIcon icon={faCheckCircle} className='me-1' />
										Verified Pro Partner
									</span>
								</div>

								<div className='text-muted fs-8 d-flex align-items-center gap-2 mb-3'>
									{activePartner.email && <span>{activePartner.email}</span>}
									{activePartner.mobile && <span>• {activePartner.mobile}</span>}
									{activePartner.city && <span>• {activePartner.city}</span>}
								</div>

								{/* Assigned Coupon Display */}
								{primaryCoupon ? (
									<div>
										<div className='text-muted fs-8 fw-semibold text-uppercase mb-1'>
											Your Assigned Referral Coupon:
										</div>
										<div className='d-flex align-items-center gap-3 flex-wrap'>
											<div className='gz-coupon-code-pill'>
												<FontAwesomeIcon icon={faTag} style={{ color: '#059669', fontSize: '18px' }} />
												<span className='gz-coupon-code-text'>{primaryCoupon.coupon_code}</span>
												<CopyButton textToCopy={primaryCoupon.coupon_code} />
											</div>

											<span
												className='badge fw-bold'
												style={{
													background: '#FEF3C7',
													color: '#92400E',
													fontSize: '13px',
													padding: '8px 12px',
													borderRadius: '8px',
												}}>
												{primaryCoupon.discount}% Customer Discount
											</span>

											{canManageCoupons && (
												<div className='d-flex align-items-center gap-2'>
													<button
														type='button'
														onClick={() => openEditModal(primaryCoupon)}
														className='btn btn-sm btn-icon btn-light'
														title='Edit Coupon Settings'
														style={{ width: '36px', height: '36px', borderRadius: '8px' }}>
														<FontAwesomeIcon icon={faEdit} className='text-warning' />
													</button>
													<button
														type='button'
														onClick={() => openCreateModal()}
														className='btn btn-sm btn-light-success d-inline-flex align-items-center gap-1'
														title='Create Additional Coupon'
														style={{ height: '36px', padding: '0 12px', borderRadius: '8px', fontWeight: 600 }}>
														<FontAwesomeIcon icon={faPlus} />
														<span>New Coupon</span>
													</button>
												</div>
											)}
										</div>

										{assignedCoupons.length > 1 && (
											<div className='mt-2 d-flex align-items-center gap-2 flex-wrap'>
												<span className='fs-9 text-muted fw-bold text-uppercase'>
													Additional Codes:
												</span>
												{assignedCoupons.slice(1).map((c: any) => (
													<span
														key={c._id}
														className='badge d-inline-flex align-items-center gap-1.5'
														style={{
															background: '#F1F5F9',
															color: '#334155',
															border: '1px solid #CBD5E1',
															padding: '5px 8px',
															borderRadius: '6px',
															fontSize: '11px',
														}}>
														<span className='fw-bold font-monospace'>{c.coupon_code}</span>
														<span className='text-success fw-bold'>({c.discount}%)</span>
														{canManageCoupons && (
															<button
																type='button'
																onClick={() => openEditModal(c)}
																className='btn btn-xs btn-link p-0 text-muted ms-1'
																title='Edit Coupon'>
																<FontAwesomeIcon icon={faEdit} />
															</button>
														)}
													</span>
												))}
											</div>
										)}

										{/* Shareable Link */}
										{shareableLink && (
											<div
												className='d-flex align-items-center gap-2 mt-3 pt-2'
												style={{ borderTop: '1px dashed #E2E8F0' }}>
												<span className='text-muted fs-8 fw-bold text-nowrap'>
													<FontAwesomeIcon icon={faLink} className='me-1 text-primary' />
													Shareable Store Link:
												</span>
												<input
													type='text'
													readOnly
													className='form-control form-control-sm font-monospace text-truncate'
													style={{ maxWidth: '340px', background: '#F8FAFC', fontSize: '11.5px' }}
													value={shareableLink}
												/>
												<CopyButton textToCopy={shareableLink} />
											</div>
										)}
									</div>
								) : (
									<div
										className='p-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-3'
										style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
										<div>
											<div className='fw-bold text-warning-emphasis fs-7 mb-1'>
												Pending Coupon Assignment
											</div>
											<div className='text-muted fs-8'>
												No referral coupon has been assigned to your account ({activePartner.email || activePartner.mobile}) yet.
												{isPartnerOnly &&
													' Please contact the Gomzi Nutrition administration team to activate your partner code.'}
											</div>
										</div>
										{canManageCoupons && (
											<button
												type='button'
												onClick={() => openCreateModal()}
												className='btn btn-sm d-inline-flex align-items-center gap-2'
												style={{
													background: '#1e293b',
													borderColor: '#1e293b',
													color: '#ffffff',
													fontWeight: 600,
													padding: '7px 14px',
													borderRadius: '8px',
													whiteSpace: 'nowrap',
												}}>
												<FontAwesomeIcon icon={faPlus} />
												<span>+ Create Coupon</span>
											</button>
										)}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right: Partner Agreement Document */}
					<div className='col-lg-6'>
						<div
							className={`gz-partner-doc-block ${activePartner.hasAcceptedPolicy ? 'is-signed' : ''}`}>
							<div className='d-flex align-items-center gap-3'>
								<div className='gz-doc-icon-wrap'>
									<FontAwesomeIcon icon={faFilePdf} />
								</div>
								<div>
									<div className='fw-bold text-dark fs-6 d-flex align-items-center gap-2'>
										<span>Pro-Partner Policy Agreement</span>
										<span
											className='badge'
											style={{
												background: activePartner.hasAcceptedPolicy ? '#DCFCE7' : '#FEF3C7',
												color: activePartner.hasAcceptedPolicy ? '#166534' : '#92400E',
												fontSize: '10px',
												fontWeight: 700,
											}}>
											{activePartner.hasAcceptedPolicy ? 'Signed & Verified' : 'Draft Document'}
										</span>
									</div>

									<div className='text-muted fs-8 mt-1'>
										{activePartner.hasAcceptedPolicy ? (
											<span>
												Digital Agreement bound to <strong>{activePartner.policyAcceptedName || activePartner.name}</strong>
												{activePartner.policyAcceptedAt && (
													<> on {DayJS(activePartner.policyAcceptedAt).format('DD MMM YYYY, hh:mm A')}</>
												)}
											</span>
										) : (
											<span>Official Gomzi Nutrition Pro Partner Agreement Document.</span>
										)}
									</div>
								</div>
							</div>

							<div className='d-flex align-items-center gap-2 flex-wrap'>
								<button
									type='button'
									onClick={handleDownloadDoc}
									className='btn btn-sm btn-success d-flex align-items-center gap-2'
									style={{
										borderRadius: '8px',
										fontWeight: 600,
										fontSize: '12.5px',
										background: '#047857',
										borderColor: '#047857',
									}}>
									<FontAwesomeIcon icon={faDownload} />
									<span>
										{activePartner.hasAcceptedPolicy
											? 'View Signed Agreement (PDF)'
											: 'Download Agreement (PDF)'}
									</span>
								</button>

								<button
									type='button'
									onClick={() => setShowAgreementModal(true)}
									className='btn btn-sm btn-outline-secondary d-flex align-items-center gap-2'
									style={{ borderRadius: '8px', fontWeight: 600, fontSize: '12.5px' }}>
									<FontAwesomeIcon icon={faFileAlt} />
									<span>View Policy Terms</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    2. PERFORMANCE METRICS CARDS (FOR THIS PARTNER'S COUPON ONLY)
			    ========================================================================= */}
			<div className='gz-prod-summary-grid mb-4'>
				<div className='gz-prod-summary-card'>
					<div className='title'>Total Referred Orders</div>
					<div className='value' style={{ color: '#2563EB' }}>
						{ordersLoading ? (
							<div
								className='gz-skeleton'
								style={{ width: '40px', height: '28px', borderRadius: '4px' }}
							/>
						) : (
							metrics.totalOrders
						)}
					</div>
					<div className='subtext'>Purchases with coupon {primaryCoupon?.coupon_code || 'None'}</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='title'>Gross Sales Generated</div>
					<div className='value' style={{ color: '#0F172A' }}>
						{ordersLoading ? (
							<div
								className='gz-skeleton'
								style={{ width: '60px', height: '28px', borderRadius: '4px' }}
							/>
						) : (
							`₹${metrics.totalGrossSales.toLocaleString('en-IN')}`
						)}
					</div>
					<div className='subtext'>
						Customer discounts: ₹{metrics.totalDiscounts.toLocaleString('en-IN')}
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='title'>Net Revenue Intake</div>
					<div className='value' style={{ color: '#0F172A' }}>
						{ordersLoading ? (
							<div
								className='gz-skeleton'
								style={{ width: '60px', height: '28px', borderRadius: '4px' }}
							/>
						) : (
							`₹${metrics.totalNetPaid.toLocaleString('en-IN')}`
						)}
					</div>
					<div className='subtext'>Paid at checkout on website</div>
				</div>

				<div className='gz-prod-summary-card highlight-commission'>
					<div className='title' style={{ color: '#047857' }}>
						Partner Commission Credited
					</div>
					<div className='value' style={{ color: '#059669' }}>
						{ordersLoading ? (
							<div
								className='gz-skeleton'
								style={{ width: '60px', height: '28px', borderRadius: '4px' }}
							/>
						) : (
							`₹${metrics.totalCommission.toLocaleString('en-IN')}`
						)}
					</div>
					<div className='subtext' style={{ color: '#065F46' }}>
						Credited at {DEFAULT_COMMISSION_PERCENT}% standard partner commission rate
					</div>
				</div>
			</div>

			{/* =========================================================================
			    NAVIGATION TABS (COUPONS / ORDERS / COMMISSIONS)
			    ========================================================================= */}
			<div className='d-flex align-items-center gap-2 mb-3 border-bottom pb-2'>
				<button
					type='button'
					onClick={() => {
						setActiveTab('coupons')
						navigate('/rag/pro-partner/coupons')
					}}
					className={`btn btn-sm ${
						activeTab === 'coupons' ? 'btn-success fw-bold' : 'btn-light text-muted'
					}`}
					style={{
						borderRadius: '8px',
						background: activeTab === 'coupons' ? '#047857' : undefined,
						borderColor: activeTab === 'coupons' ? '#047857' : undefined,
					}}>
					<FontAwesomeIcon icon={faTag} className='me-2' />
					My Assigned Coupon & Agreement
				</button>

				<button
					type='button'
					onClick={() => {
						setActiveTab('orders')
						navigate('/rag/pro-partner/orders')
					}}
					className={`btn btn-sm ${
						activeTab === 'orders' ? 'btn-success fw-bold' : 'btn-light text-muted'
					}`}
					style={{
						borderRadius: '8px',
						background: activeTab === 'orders' ? '#047857' : undefined,
						borderColor: activeTab === 'orders' ? '#047857' : undefined,
					}}>
					<FontAwesomeIcon icon={faShoppingBag} className='me-2' />
					Referred Orders ({metrics.totalOrders})
				</button>

				<button
					type='button'
					onClick={() => {
						setActiveTab('commissions')
						navigate('/rag/pro-partner/commissions')
					}}
					className={`btn btn-sm ${
						activeTab === 'commissions' ? 'btn-success fw-bold' : 'btn-light text-muted'
					}`}
					style={{
						borderRadius: '8px',
						background: activeTab === 'commissions' ? '#047857' : undefined,
						borderColor: activeTab === 'commissions' ? '#047857' : undefined,
					}}>
					<FontAwesomeIcon icon={faHandHoldingUsd} className='me-2' />
					Commissions Ledger (₹{metrics.totalCommission.toLocaleString('en-IN')})
				</button>
			</div>

			{/* =========================================================================
			    3. ORDER HISTORY & COMMISSION LEDGER TABLE (FOR THIS ASSIGNED COUPON)
			    ========================================================================= */}
			<div className='gz-prod-card'>
				{/* Toolbar */}
				<div className='gz-prod-toolbar'>
					<div className='d-flex align-items-center gap-3 flex-wrap'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search orders by customer name, phone, receipt ID, product...'
							className='me-0'
						/>
						<LengthMenu
							expenseData={filteredOrders}
							handleItemsPerPageChange={(itemsPerPage: number) =>
								setPagination((prev) => ({ ...prev, itemsPerPage, page: 1 }))
							}
							value={pagination.itemsPerPage}
							className='me-0'
						/>
						<div>
							<button
								type='button'
								onClick={downloadPartnerOrdersExcel}
								disabled={filteredOrders.length === 0}
								className='btn btn-sm btn-outline-success d-flex align-items-center gap-2'
								style={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
								<FontAwesomeIcon icon={faReceipt} />
								Export Order History Excel
							</button>
						</div>
					</div>

					<div className='d-flex align-items-center gap-2'>
						<span className='fs-8 fw-semibold text-muted'>
							Showing {paginatedOrders.length} of {filteredOrders.length} orders for coupon{' '}
							<strong>{primaryCoupon?.coupon_code || 'N/A'}</strong>
						</span>
					</div>
				</div>

				{/* Orders Table */}
				<div className='table-responsive'>
					<table className='gz-prod-table mb-0'>
						<thead>
							<tr>
								<th style={{ width: '40px' }}>#</th>
								<th>Purchase Date & Credit Time</th>
								<th>Receipt ID</th>
								<th>Customer Details</th>
								<th>Product Purchased</th>
								<th>Order Value</th>
								<th>Customer Discount</th>
								<th>Net Paid</th>
								<th style={{ color: '#047857' }}>Commission Credited</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{ordersLoading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<tr key={`skel-ord-${i}`}>
										<td colSpan={10} className='py-4'>
											<div
												className='gz-skeleton'
												style={{ width: '100%', height: '24px', borderRadius: '4px' }}
											/>
										</td>
									</tr>
								))
							) : paginatedOrders.length === 0 ? (
								<tr>
									<td colSpan={10} className='text-center py-5'>
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
												}}>
												<FontAwesomeIcon icon={faShoppingBag} />
											</div>
											<h5 className='fw-bold text-dark mb-1'>No Orders Tied to this Coupon Yet</h5>
											<p className='text-muted fs-7 mb-3' style={{ maxWidth: '440px' }}>
												When customers enter coupon code{' '}
												<span className='badge bg-light text-dark font-monospace'>
													{primaryCoupon?.coupon_code || 'N/A'}
												</span>{' '}
												on the website checkout, order records and credited commission will appear here instantly.
											</p>
											{shareableLink && (
												<div className='d-flex align-items-center gap-2'>
													<button
														type='button'
														onClick={() => {
															navigator.clipboard.writeText(shareableLink)
															toast.success('Shareable partner link copied!')
														}}
														className='btn btn-sm btn-primary'
														style={{ background: '#047857', borderColor: '#047857' }}>
														<FontAwesomeIcon icon={faLink} className='me-2' />
														Copy Shareable Store Link
													</button>
												</div>
											)}
										</div>
									</td>
								</tr>
							) : (
								paginatedOrders.map((ord, idx) => {
									return (
										<tr key={ord.id || idx}>
											<td className='text-muted fs-8 fw-semibold'>
												{(pagination.page - 1) * pagination.itemsPerPage + idx + 1}
											</td>

											{/* Purchase Date & Credit Time */}
											<td>
												<div className='d-flex flex-column'>
													<span className='fw-bold text-dark fs-7'>
														{DayJS(ord.creditTime).format('DD MMM YYYY')}
													</span>
													<span className='text-muted fs-8'>
														{DayJS(ord.creditTime).format('hh:mm A')}
													</span>
												</div>
											</td>

											{/* Receipt ID */}
											<td>
												<span className='badge bg-light text-dark font-monospace fs-8'>
													{ord.receiptId}
												</span>
											</td>

											{/* Customer Details */}
											<td>
												<div>
													<div className='fw-semibold text-dark fs-7'>{ord.customerName}</div>
													<div className='text-muted fs-8'>{ord.customerMobile}</div>
												</div>
											</td>

											{/* Product Purchased */}
											<td>
												<div className='d-flex align-items-center gap-2'>
													{ord.productImage ? (
														<img
															src={ord.productImage}
															alt={ord.productName}
															className='gz-partner-product-thumb'
														/>
													) : (
														<div
															className='d-flex align-items-center justify-content-center gz-partner-product-thumb'
															style={{ background: '#F1F5F9', color: '#94A3B8' }}>
															<FontAwesomeIcon icon={faShoppingBag} />
														</div>
													)}
													<div>
														<div className='fw-bold text-dark fs-7'>{ord.productName}</div>
														<div className='text-muted fs-8'>
															Qty: {ord.quantity} • {ord.productCategory}
														</div>
													</div>
												</div>
											</td>

											{/* Order Value */}
											<td>
												<span className='fw-bold text-dark fs-7'>
													₹{ord.orderAmount.toLocaleString('en-IN')}
												</span>
											</td>

											{/* Customer Discount */}
											<td>
												<span className='text-danger fw-semibold fs-7'>
													-₹{ord.discountAmount.toLocaleString('en-IN')} ({ord.discountPercent}%)
												</span>
											</td>

											{/* Net Paid */}
											<td>
												<span className='fw-bold text-dark fs-7'>
													₹{ord.paidAmount.toLocaleString('en-IN')}
												</span>
											</td>

											{/* Commission Credited */}
											<td>
												<div className='d-flex align-items-center gap-1'>
													<span className='gz-commission-badge'>
														+₹{ord.commissionAmount.toLocaleString('en-IN')}
													</span>
												</div>
												<span className='text-muted fs-8'>
													({ord.commissionRate}% commission)
												</span>
											</td>

											{/* Status */}
											<td>
												<span className='gz-status-tag-credited'>
													{ord.commissionStatus}
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
				<div className='p-3 border-top d-flex justify-content-end'>
					<UsersListPagination
						totalPages={Math.ceil(filteredOrders.length / pagination.itemsPerPage) || 1}
						pageIndex={pagination.page}
						onPageChange={(page: number) => setPagination((prev) => ({ ...prev, page }))}
					/>
				</div>
			</div>

			{/* =========================================================================
			    MODAL: POLICY TERMS & CONDITIONS
			    ========================================================================= */}
			<Modal
				show={showAgreementModal}
				onHide={() => setShowAgreementModal(false)}
				size='lg'
				centered>
				<Modal.Header closeButton>
					<Modal.Title className='d-flex align-items-center gap-2'>
						<FontAwesomeIcon icon={faFileAlt} className='text-success' />
						<span>Pro-Partner Policy Agreement Details</span>
					</Modal.Title>
				</Modal.Header>

				<Modal.Body className='py-4'>
					<div className='d-flex align-items-center justify-content-between p-3 rounded-3 bg-light mb-4'>
						<div>
							<div className='fw-bold text-dark fs-6'>{activePartner.name}</div>
							<div className='text-muted fs-7'>
								Email: {activePartner.email} • Mobile: {activePartner.mobile}
							</div>
						</div>
						<span
							className='badge'
							style={{
								background: activePartner.hasAcceptedPolicy ? '#DCFCE7' : '#FEF3C7',
								color: activePartner.hasAcceptedPolicy ? '#166534' : '#92400E',
								fontSize: '12px',
								fontWeight: 700,
								padding: '6px 12px',
							}}>
							{activePartner.hasAcceptedPolicy
								? 'Agreement Accepted & Signed'
								: 'Awaiting Digital Signature'}
						</span>
					</div>

					<div className='card border p-4 mb-3'>
						<h5 className='fw-bold text-dark mb-3'>Key Policy & Agreement Summary:</h5>
						<ul className='list-unstyled d-flex flex-column gap-2 fs-7 text-dark mb-0'>
							<li className='d-flex align-items-start gap-2'>
								<FontAwesomeIcon icon={faCheckCircle} className='text-success mt-1' />
								<span>
									<strong>Assigned Referral Code:</strong>{' '}
									{primaryCoupon?.coupon_code || 'Pending assignment'} gives referred clients{' '}
									<strong>{primaryCoupon?.discount || 10}% instant discount</strong> at checkout.
								</span>
							</li>
							<li className='d-flex align-items-start gap-2'>
								<FontAwesomeIcon icon={faCheckCircle} className='text-success mt-1' />
								<span>
									<strong>Commission Rate:</strong> You earn{' '}
									<strong>{DEFAULT_COMMISSION_PERCENT}% partner commission</strong> on every completed product order placed with your code.
								</span>
							</li>
							<li className='d-flex align-items-start gap-2'>
								<FontAwesomeIcon icon={faCheckCircle} className='text-success mt-1' />
								<span>
									<strong>Attribution & Crediting:</strong> Commissions are automatically attributed to your partner ledger as soon as the order is placed on the website.
								</span>
							</li>
							<li className='d-flex align-items-start gap-2'>
								<FontAwesomeIcon icon={faCheckCircle} className='text-success mt-1' />
								<span>
									<strong>Contract Version:</strong> {activePartner.policyVersion || 'v1.0'} • Digitally bound to partner account: {activePartner.name}
								</span>
							</li>
						</ul>
					</div>
				</Modal.Body>

				<Modal.Footer>
					<button
						type='button'
						onClick={handleDownloadDoc}
						className='btn btn-success d-flex align-items-center gap-2'
						style={{ background: '#047857', borderColor: '#047857' }}>
						<FontAwesomeIcon icon={faDownload} />
						Download Agreement PDF
					</button>
					<button
						type='button'
						className='btn btn-light'
						onClick={() => setShowAgreementModal(false)}>
						Close
					</button>
				</Modal.Footer>
			</Modal>

			{/* =========================================================================
			    MODAL: CREATE / ASSIGN NEW COUPON (FOR ADMIN)
			    ========================================================================= */}
			<Modal
				show={showCreateModal && canManageCoupons}
				onHide={() => setShowCreateModal(false)}
				size='lg'
				centered
				backdrop='static'>
				<form onSubmit={handleCreateCoupon}>
					<Modal.Header closeButton>
						<Modal.Title className='d-flex align-items-center gap-2'>
							<FontAwesomeIcon icon={faTag} className='text-success' />
							<span>Assign Coupon to {selectedPartner?.name || activePartner.name}</span>
						</Modal.Title>
					</Modal.Header>

					<Modal.Body className='py-4'>
						{/* Select Approved Partner (Only Accepted Applications) */}
						<div className='mb-4'>
							<label className='form-label fw-bold required text-dark fs-7'>
								Select Partner (Accepted Applications Only)
							</label>
							<select
								className='form-select form-select-solid'
								value={selectedPartnerId}
								onChange={(e) => handlePartnerSelect(e.target.value)}
								required>
								<option value=''>-- Select Accepted Partner --</option>
								{approvedPartners.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name} {p.city ? `(${p.city})` : ''} — {p.email || p.mobile}
										{p.existingCouponCode ? ` [Current Coupon: ${p.existingCouponCode}]` : ''}
										{p.hasAcceptedPolicy ? ' ✓ Signed' : ''}
									</option>
								))}
							</select>
							{approvedPartners.length === 0 ? (
								<div className='text-danger fs-8 mt-1'>
									No accepted partners found. Please accept partner applications in{' '}
									<Link to='/rag/pro-partner/applications' className='text-danger text-decoration-underline fw-bold'>
										Applications
									</Link>{' '}
									first.
								</div>
							) : (
								<div className='text-muted fs-8 mt-1'>
									Only applicants accepted in{' '}
									<Link to='/rag/pro-partner/applications' className='text-primary fw-semibold text-decoration-none'>
										Pro Partner Applications
									</Link>{' '}
									are listed here.
								</div>
							)}
						</div>

						<div className='row g-3 mb-4'>
							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>Coupon Code</label>
								<input
									type='text'
									className='form-control form-control-solid font-monospace text-uppercase fw-bold'
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
									Auto-generated sequential code: RAG + Partner Name + 001 (e.g. RAGPOONAM001).
								</div>
							</div>

							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>Coupon Title</label>
								<input
									type='text'
									className='form-control form-control-solid'
									value={couponAdd.title}
									onChange={(e) => setCouponAdd({ ...couponAdd, title: e.target.value })}
									placeholder={`${selectedPartner?.name || activePartner.name} - Referral Discount`}
									required
								/>
							</div>
						</div>

						<div className='row g-3 mb-4'>
							<div className='col-md-4'>
								<label className='form-label fw-bold text-dark fs-7'>Discount Type</label>
								<select
									className='form-select form-select-solid'
									value={couponAdd.discount_type}
									onChange={(e) => setCouponAdd({ ...couponAdd, discount_type: e.target.value })}>
									<option value='percent'>Percentage (%)</option>
									<option value='rupees'>Fixed Rupees (₹)</option>
								</select>
							</div>

							<div className='col-md-4'>
								<label className='form-label fw-bold required text-dark fs-7'>
									Customer Discount Value
								</label>
								<input
									type='number'
									className='form-control form-control-solid'
									value={couponAdd.discount}
									onChange={(e) => setCouponAdd({ ...couponAdd, discount: e.target.value })}
									min='1'
									max={couponAdd.discount_type === 'percent' ? 90 : 100000}
									required
								/>
							</div>

							<div className='col-md-4'>
								<label className='form-label fw-bold required text-dark fs-7'>Max Usage Limit</label>
								<input
									type='number'
									className='form-control form-control-solid'
									value={couponAdd.max_usage_count}
									onChange={(e) => setCouponAdd({ ...couponAdd, max_usage_count: e.target.value })}
									min='1'
									required
								/>
							</div>
						</div>

						<div className='row g-3 mb-4'>
							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>Expiry Date</label>
								<input
									type='date'
									className='form-control form-control-solid'
									value={couponAdd.expired_at}
									onChange={(e) => setCouponAdd({ ...couponAdd, expired_at: e.target.value })}
									required
								/>
							</div>

							<div className='col-md-6'>
								<label className='form-label fw-bold text-dark fs-7'>Product Scope</label>
								<select
									className='form-select form-select-solid'
									value={couponAdd.scope}
									onChange={(e) => setCouponAdd({ ...couponAdd, scope: e.target.value })}>
									<option value='ALL'>All Store Products</option>
									<option value='SPECIFIC_PRODUCTS'>Specific Catalog Products</option>
								</select>
							</div>
						</div>

						{/* Product Selection if Specific Products */}
						{couponAdd.scope === 'SPECIFIC_PRODUCTS' && (
							<div
								className='p-3 rounded mb-3'
								style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<label className='form-label fw-bold text-dark fs-7 mb-0'>
										Select Applicable Products
									</label>
									<div className='d-flex align-items-center gap-2'>
										<button
											type='button'
											className='btn btn-xs btn-light-primary py-1 px-2 fs-9'
											onClick={() => {
												const allIds = catalogProducts.map((p: any) => String(p._id || p.id))
												setCouponAdd((prev) => ({ ...prev, applicable_products: allIds }))
											}}>
											Select All
										</button>
										<button
											type='button'
											className='btn btn-xs btn-light-secondary py-1 px-2 fs-9'
											onClick={() => setCouponAdd((prev) => ({ ...prev, applicable_products: [] }))}>
											Clear
										</button>
										<span className='badge bg-light-primary text-primary fs-8 fw-bold'>
											{couponAdd.applicable_products.length} Selected
										</span>
									</div>
								</div>
								<input
									type='text'
									className='form-control form-control-solid mb-2 fs-8'
									placeholder='Filter products by title...'
									value={productSearch}
									onChange={(e) => setProductSearch(e.target.value)}
								/>
								<div
									style={{
										maxHeight: '190px',
										overflowY: 'auto',
										border: '1px solid #E2E8F0',
										borderRadius: '6px',
										background: '#FFFFFF',
									}}>
									{catalogProducts.length === 0 ? (
										<div className='p-3 text-muted text-center fs-8'>Loading products...</div>
									) : (
										catalogProducts
											.filter((p: any) =>
												(p.title || p.name || '')
													.toLowerCase()
													.includes(productSearch.toLowerCase())
											)
											.map((p: any) => {
												const pId = String(p._id || p.id)
												const isSelected = couponAdd.applicable_products.includes(pId)
												return (
													<label
														key={pId}
														className='d-flex align-items-center justify-content-between p-2 border-bottom cursor-pointer hover-bg-light mb-0'
														style={{ cursor: 'pointer' }}>
														<div className='d-flex align-items-center gap-2'>
															<input
																type='checkbox'
																className='form-check-input'
																checked={isSelected}
																onChange={(e) => {
																	if (e.target.checked) {
																		setCouponAdd((prev) => ({
																			...prev,
																			applicable_products: [...prev.applicable_products, pId],
																		}))
																	} else {
																		setCouponAdd((prev) => ({
																			...prev,
																			applicable_products: prev.applicable_products.filter(
																				(id) => id !== pId
																			),
																		}))
																	}
																}}
															/>
															<span className='fs-8 fw-semibold text-dark'>
																{p.title || p.name}
															</span>
															{p.category?.title && (
																<span className='badge bg-light text-muted fs-9'>
																	{p.category.title}
																</span>
															)}
														</div>
														{p.price && (
															<span className='fs-8 text-muted fw-bold'>₹{p.price}</span>
														)}
													</label>
												)
											})
									)}
								</div>
							</div>
						)}
					</Modal.Body>

					<Modal.Footer>
						<button
							type='button'
							className='btn btn-light'
							style={{ borderRadius: '8px', fontWeight: 600 }}
							onClick={() => setShowCreateModal(false)}
							disabled={submitting}>
							Cancel
						</button>
						<button
							type='submit'
							className='btn'
							style={{
								background: '#1e293b',
								borderColor: '#1e293b',
								color: '#ffffff',
								fontWeight: 600,
								padding: '8px 20px',
								borderRadius: '8px',
							}}
							disabled={submitting}>
							{submitting ? 'Creating...' : 'Create & Assign Coupon'}
						</button>
					</Modal.Footer>
				</form>
			</Modal>

			{/* =========================================================================
			    MODAL: UPDATE COUPON (FOR ADMIN)
			    ========================================================================= */}
			<Modal
				show={showUpdateModal && canManageCoupons}
				onHide={() => setShowUpdateModal(false)}
				size='lg'
				centered
				backdrop='static'>
				<form onSubmit={handleUpdateCoupon}>
					<Modal.Header closeButton>
						<Modal.Title className='d-flex align-items-center gap-2'>
							<FontAwesomeIcon icon={faEdit} className='text-warning' />
							<span>Edit Coupon: {updateData.coupon_code}</span>
						</Modal.Title>
					</Modal.Header>

					<Modal.Body className='py-4'>
						<div className='row g-3 mb-4'>
							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>Coupon Code</label>
								<input
									type='text'
									className='form-control form-control-solid font-monospace text-uppercase fw-bold'
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
								<label className='form-label fw-bold required text-dark fs-7'>Coupon Title</label>
								<input
									type='text'
									className='form-control form-control-solid'
									value={updateData.title}
									onChange={(e) => setUpdateData({ ...updateData, title: e.target.value })}
									required
								/>
							</div>
						</div>

						<div className='row g-3 mb-4'>
							<div className='col-md-4'>
								<label className='form-label fw-bold text-dark fs-7'>Discount Type</label>
								<select
									className='form-select form-select-solid'
									value={updateData.discount_type}
									onChange={(e) => setUpdateData({ ...updateData, discount_type: e.target.value })}>
									<option value='percent'>Percentage (%)</option>
									<option value='rupees'>Fixed Rupees (₹)</option>
								</select>
							</div>

							<div className='col-md-4'>
								<label className='form-label fw-bold required text-dark fs-7'>Discount Value</label>
								<input
									type='number'
									className='form-control form-control-solid'
									value={updateData.discount}
									onChange={(e) => setUpdateData({ ...updateData, discount: e.target.value })}
									min='1'
									max={updateData.discount_type === 'percent' ? 90 : 100000}
									required
								/>
							</div>

							<div className='col-md-4'>
								<label className='form-label fw-bold required text-dark fs-7'>Max Usage Limit</label>
								<input
									type='number'
									className='form-control form-control-solid'
									value={updateData.max_usage_count}
									onChange={(e) => setUpdateData({ ...updateData, max_usage_count: e.target.value })}
									min='1'
									required
								/>
							</div>
						</div>

						<div className='row g-3 mb-4'>
							<div className='col-md-6'>
								<label className='form-label fw-bold required text-dark fs-7'>Expiry Date</label>
								<input
									type='date'
									className='form-control form-control-solid'
									value={updateData.expired_at}
									onChange={(e) => setUpdateData({ ...updateData, expired_at: e.target.value })}
									required
								/>
							</div>

							<div className='col-md-6'>
								<label className='form-label fw-bold text-dark fs-7'>Product Scope</label>
								<select
									className='form-select form-select-solid'
									value={updateData.scope}
									onChange={(e) => setUpdateData({ ...updateData, scope: e.target.value })}>
									<option value='ALL'>All Store Products</option>
									<option value='SPECIFIC_PRODUCTS'>Specific Catalog Products</option>
								</select>
							</div>
						</div>

						{/* Product Selection if Specific Products in Edit Modal */}
						{updateData.scope === 'SPECIFIC_PRODUCTS' && (
							<div
								className='p-3 rounded mb-3'
								style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<label className='form-label fw-bold text-dark fs-7 mb-0'>
										Select Applicable Products
									</label>
									<div className='d-flex align-items-center gap-2'>
										<button
											type='button'
											className='btn btn-xs btn-light-primary py-1 px-2 fs-9'
											onClick={() => {
												const allIds = catalogProducts.map((p: any) => String(p._id || p.id))
												setUpdateData((prev) => ({ ...prev, applicable_products: allIds }))
											}}>
											Select All
										</button>
										<button
											type='button'
											className='btn btn-xs btn-light-secondary py-1 px-2 fs-9'
											onClick={() => setUpdateData((prev) => ({ ...prev, applicable_products: [] }))}>
											Clear
										</button>
										<span className='badge bg-light-primary text-primary fs-8 fw-bold'>
											{updateData.applicable_products.length} Selected
										</span>
									</div>
								</div>
								<input
									type='text'
									className='form-control form-control-solid mb-2 fs-8'
									placeholder='Filter products by title...'
									value={productSearch}
									onChange={(e) => setProductSearch(e.target.value)}
								/>
								<div
									style={{
										maxHeight: '190px',
										overflowY: 'auto',
										border: '1px solid #E2E8F0',
										borderRadius: '6px',
										background: '#FFFFFF',
									}}>
									{catalogProducts.length === 0 ? (
										<div className='p-3 text-muted text-center fs-8'>Loading products...</div>
									) : (
										catalogProducts
											.filter((p: any) =>
												(p.title || p.name || '')
													.toLowerCase()
													.includes(productSearch.toLowerCase())
											)
											.map((p: any) => {
												const pId = String(p._id || p.id)
												const isSelected = updateData.applicable_products.includes(pId)
												return (
													<label
														key={pId}
														className='d-flex align-items-center justify-content-between p-2 border-bottom cursor-pointer hover-bg-light mb-0'
														style={{ cursor: 'pointer' }}>
														<div className='d-flex align-items-center gap-2'>
															<input
																type='checkbox'
																className='form-check-input'
																checked={isSelected}
																onChange={(e) => {
																	if (e.target.checked) {
																		setUpdateData((prev) => ({
																			...prev,
																			applicable_products: [...prev.applicable_products, pId],
																		}))
																	} else {
																		setUpdateData((prev) => ({
																			...prev,
																			applicable_products: prev.applicable_products.filter(
																				(id) => id !== pId
																			),
																		}))
																	}
																}}
															/>
															<span className='fs-8 fw-semibold text-dark'>
																{p.title || p.name}
															</span>
															{p.category?.title && (
																<span className='badge bg-light text-muted fs-9'>
																	{p.category.title}
																</span>
															)}
														</div>
														{p.price && (
															<span className='fs-8 text-muted fw-bold'>₹{p.price}</span>
														)}
													</label>
												)
											})
									)}
								</div>
							</div>
						)}
					</Modal.Body>

					<Modal.Footer>
						<button
							type='button'
							className='btn btn-light'
							style={{ borderRadius: '8px', fontWeight: 600 }}
							onClick={() => setShowUpdateModal(false)}
							disabled={submitting}>
							Cancel
						</button>
						<button
							type='submit'
							className='btn'
							style={{
								background: '#1e293b',
								borderColor: '#1e293b',
								color: '#ffffff',
								fontWeight: 600,
								padding: '8px 20px',
								borderRadius: '8px',
							}}
							disabled={submitting}>
							{submitting ? 'Saving...' : 'Save Changes'}
						</button>
					</Modal.Footer>
				</form>
			</Modal>
		</div>
	)
}

export default ProPartnerCoupons
