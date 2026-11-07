import { useEffect, useMemo, useState } from 'react'
import {
	GetContactInquiry,
	GetProduct,
	GetReferralCoupon,
	GetReferralCouponUsage,
} from '../../../Functions/FGGroup'
import { getProfile } from '../../../Functions/FGGroup/AccountFunctions'

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

export interface ApprovedPartnerInfo {
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
	bankDetails?: {
		accountHolderName?: string
		bankName?: string
		accountNumber?: string
		ifscCode?: string
		upiId?: string
	}
}

const RAG_CONTACT_SOURCE_FILTER = 'gomzilifesciences|ragnutrition|contact-us|5173|whey|rag'
const DEFAULT_COMMISSION_PERCENT = 10

export function useProPartnerData(partnerIdParam?: string | null) {
	const [loading, setLoading] = useState(true)
	const [coupons, setCoupons] = useState<any[]>([])
	const [orders, setOrders] = useState<PartnerOrderTransaction[]>([])
	const [partnerInfo, setPartnerInfo] = useState<ApprovedPartnerInfo | null>(null)
	const [catalogMap, setCatalogMap] = useState<Record<string, any>>({})
	const [profileUser, setProfileUser] = useState<any>(null)

	useEffect(() => {
		let isMounted = true

		const loadAll = async () => {
			setLoading(true)
			try {
				// 1. Logged in profile user
				let currentUser: any = null
				try {
					const profileRes: any = await getProfile()
					currentUser = profileRes?.data || null
					if (isMounted) setProfileUser(currentUser)
				} catch (err) {
					console.error('Error fetching profile:', err)
				}

				// 2. Fetch Coupons
				let partnerCoupons: any[] = []
				try {
					const couponRes: any = await GetReferralCoupon({ coupon_type: 'pro_partner' })
					const rawCoupons: any[] = Array.isArray(couponRes?.data) ? couponRes.data : []
					partnerCoupons = [...rawCoupons].sort(
						(a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
					)
					if (isMounted) setCoupons(partnerCoupons)
				} catch (err) {
					console.error('Error fetching partner coupons:', err)
				}

				// 3. Fetch Partner Inquiries
				let matchedPartner: ApprovedPartnerInfo | null = null
				try {
					const inqRes: any = await GetContactInquiry({
						page: 1,
						limit: 100,
						source: RAG_CONTACT_SOURCE_FILTER,
					})
					const inqList: any[] = Array.isArray(inqRes?.data) ? inqRes.data : []

					// Match against partnerIdParam or current user email/mobile
					const found = inqList.find((item: any) => {
						if (partnerIdParam) {
							return String(item._id) === String(partnerIdParam)
						}
						const d = item.details || {}
						const email = (d.email || item.email || '').toLowerCase().trim()
						const mobile = (d.mobile || item.mobile || '').trim()
						const userEmail = (currentUser?.email || '').toLowerCase().trim()
						const userMobile = (currentUser?.phone || currentUser?.mobile || '').trim()

						if (userEmail && email && userEmail === email) return true
						if (userMobile && mobile && userMobile.endsWith(mobile.slice(-10))) return true
						return false
					})

					if (found) {
						const d = found.details || {}
						matchedPartner = {
							id: found._id,
							name: (d.full_name || found.name || 'Pro Partner').trim(),
							email: (d.email || found.email || '').trim(),
							mobile: (d.mobile || found.mobile || '').trim(),
							city: d.city || '',
							state: d.state || '',
							partner_status: found.partner_status || 'approved',
							hasAcceptedPolicy: Boolean(found.partner_policy?.accepted_at),
							policyAcceptedAt: found.partner_policy?.accepted_at,
							policyVersion: found.partner_policy?.version || 'v1.0',
							policyAcceptedName: found.partner_policy?.accepted_name || found.name,
							existingCouponCode: d.assigned_coupon_code || '',
							rawInquiry: found,
							bankDetails: d.bank_details || d.payout_details || {},
						}
						if (isMounted) setPartnerInfo(matchedPartner)
					}
				} catch (err) {
					console.error('Error fetching partner inquiry:', err)
				}

				// 4. Products Catalog
				const pMap: Record<string, any> = {}
				try {
					const prodRes: any = await GetProduct({ limit: 500, page: 1 })
					const pList: any[] = Array.isArray(prodRes?.data?.data || prodRes?.data)
						? prodRes?.data?.data || prodRes?.data
						: []
					pList.forEach((p: any) => {
						if (p?._id) pMap[String(p._id)] = p
					})
					if (isMounted) setCatalogMap(pMap)
				} catch (err) {
					console.error('Error fetching products catalog:', err)
				}

				// 5. Orders / Usage Transactions
				// Filter coupons relevant to this partner if specified
				const relevantCoupons = partnerIdParam
					? partnerCoupons.filter(
							(c) =>
								String(c.partner_inquiry_id?._id || c.partner_inquiry_id || '') ===
									String(partnerIdParam) ||
								String(c.assign_trainer?.trainer_id || '') === String(partnerIdParam)
					  )
					: partnerCoupons

				const activeCouponList = relevantCoupons.length > 0 ? relevantCoupons : partnerCoupons

				const txList: PartnerOrderTransaction[] = []
				for (const coupon of activeCouponList) {
					if (!coupon?._id) continue
					try {
						const usageRes: any = await GetReferralCouponUsage({ coupon_id: coupon._id })
						const usageData = usageRes?.data?.[0] || usageRes?.data || {}
						const ords: any[] = Array.isArray(usageData?.orders)
							? usageData.orders
							: Array.isArray(usageData)
							? usageData
							: []

						const partnerName =
							coupon.partner_name ||
							coupon.assign_trainer?.name ||
							coupon.partner_inquiry_id?.name ||
							matchedPartner?.name ||
							'Pro Partner'
						const partnerEmail =
							coupon.partner_email ||
							coupon.partner_inquiry_id?.email ||
							matchedPartner?.email ||
							''
						const partnerMobile =
							coupon.partner_mobile ||
							coupon.partner_inquiry_id?.mobile ||
							matchedPartner?.mobile ||
							''

						const couponDiscountPercent =
							coupon.discount_type === 'percent' ? Number(coupon.discount || 10) : 10
						const commissionRate = DEFAULT_COMMISSION_PERCENT

						ords.forEach((ord: any, idx: number) => {
							const userObj = ord?.user || ord?.user_id || {}
							const customerName =
								`${userObj?.first_name || ''} ${userObj?.last_name || ''}`.trim() ||
								ord?.shipping_address?.name ||
								ord?.notes?.customer_name ||
								'Customer'
							const customerMobile =
								userObj?.mobile || userObj?.phone_number || ord?.shipping_address?.mobile || 'N/A'
							const customerEmail = userObj?.email || ord?.shipping_address?.email || ''

							const items: any[] = Array.isArray(ord?.items)
								? ord.items
								: Array.isArray(ord?.products)
								? ord.products
								: [ord]

							items.forEach((itemObj: any, itemIdx: number) => {
								const pId = String(
									itemObj?.product_id?._id || itemObj?.product_id || itemObj?.product || ''
								)
								const matchedCatalogProduct = pMap[pId] || {}

								const productName =
									itemObj?.title ||
									itemObj?.name ||
									itemObj?.product_name ||
									matchedCatalogProduct?.title ||
									matchedCatalogProduct?.name ||
									'Authentic Nutrition Product'

								const productImage =
									itemObj?.image ||
									itemObj?.thumbnail ||
									matchedCatalogProduct?.thumbnail_image ||
									matchedCatalogProduct?.featured_image ||
									(Array.isArray(matchedCatalogProduct?.images)
										? matchedCatalogProduct.images[0]
										: '') ||
									''

								const qty = Number(itemObj?.quantity || itemObj?.qty || 1)
								const unitPrice = Number(
									itemObj?.price ||
										itemObj?.unit_price ||
										matchedCatalogProduct?.price ||
										matchedCatalogProduct?.discount_price ||
										999
								)
								const originalTotal = unitPrice * qty
								const discountVal =
									Math.round(originalTotal * (couponDiscountPercent / 100)) ||
									Number(ord?.discount_amount || 0)
								const paidVal = Math.max(0, originalTotal - discountVal)
								const commissionVal = Math.round(paidVal * (commissionRate / 100))

								txList.push({
									id: `${ord?._id || ord?.id || 'ORD'}-${idx}-${itemIdx}`,
									orderId: ord?.order_id || ord?._id || `ORD-${idx + 1}`,
									receiptId: ord?.receipt_id || ord?.receipt || `RCPT-${idx + 1001}`,
									couponCode: coupon.coupon_code || 'PRO10',
									couponTitle: coupon.title || '10% Pro Partner Discount',
									partnerName,
									partnerEmail,
									partnerMobile,
									customerName,
									customerMobile,
									customerEmail,
									productId: pId,
									productName,
									productImage,
									productCategory:
										matchedCatalogProduct?.category?.name ||
										matchedCatalogProduct?.category ||
										'Supplements',
									productPrice: unitPrice,
									quantity: qty,
									orderAmount: originalTotal,
									discountAmount: discountVal,
									discountPercent: couponDiscountPercent,
									paidAmount: paidVal,
									commissionAmount: commissionVal,
									commissionRate,
									creditTime: ord?.created_at || ord?.createdAt || coupon.createdAt || new Date().toISOString(),
									orderStatus: (ord?.order_status || ord?.status || 'COMPLETED').toUpperCase(),
									commissionStatus: 'CREDITED',
								})
							})
						})
					} catch (err) {
						console.error('Error fetching coupon usage for coupon:', coupon.coupon_code, err)
					}
				}

				if (isMounted) setOrders(txList)
			} catch (globalErr) {
				console.error('Global error in useProPartnerData:', globalErr)
			} finally {
				if (isMounted) setLoading(false)
			}
		}

		loadAll()

		return () => {
			isMounted = false
		}
	}, [partnerIdParam])

	// Computed Metrics
	const metrics = useMemo(() => {
		const totalOrders = orders.length
		const totalRevenue = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0)
		const totalOriginal = orders.reduce((sum, o) => sum + (o.orderAmount || 0), 0)
		const totalDiscount = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0)
		const totalCommission = orders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0)
		const paidCommission = 0 // Available for payout
		const pendingCommission = totalCommission - paidCommission
		const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

		return {
			totalOrders,
			totalRevenue,
			totalOriginal,
			totalDiscount,
			totalCommission,
			paidCommission,
			pendingCommission,
			avgOrderValue,
		}
	}, [orders])

	const primaryCoupon = coupons[0] || null

	return {
		loading,
		coupons,
		orders,
		primaryCoupon,
		partnerInfo,
		catalogMap,
		profileUser,
		metrics,
	}
}

