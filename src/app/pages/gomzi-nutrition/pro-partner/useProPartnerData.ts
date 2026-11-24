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
const normalizeEmail = (value: any) =>
	String(value || '')
		.trim()
		.toLowerCase()
const recordId = (value: any) => String(value?._id || value || '')

const belongsToAccount = (coupon: any, account: any) => {
	const inquiry = coupon.partner_inquiry_id
	const accountId = recordId(account?._id || account?.id)
	if (accountId && recordId(inquiry?.details?.partner_account?.admin_id) === accountId) return true
	const email = normalizeEmail(account?.email)
	if (!email) return false
	const ownerEmails =
		inquiry && typeof inquiry === 'object'
			? [inquiry.email, inquiry.details?.email]
			: [coupon.partner_email]
	return ownerEmails.some((ownerEmail) => normalizeEmail(ownerEmail) === email)
}

// Single line from order totals, for API responses that predate per-product coupon lines.
function buildFallbackLine(ord: any) {
	const net = Number(
		ord?.calculated_paid ?? ord?.payment_breakdowns?.paid_amount ?? ord?.amount ?? 0
	)
	const discount = Number(ord?.calculated_discount ?? ord?.notes?.discount_amount ?? 0)
	const gross = Number(ord?.calculated_gross ?? net + discount)
	const credit = Number(
		ord?.commission_amount ?? Math.round(net * DEFAULT_COMMISSION_PERCENT) / 100
	)
	return {
		product_id: ord?.order_item_id || ord?.multiple_items?.[0]?.item_id || '',
		name: ord?.multiple_items?.[0]?.notes?.product_name,
		quantity: Number(ord?.multiple_items?.[0]?.quantity || 1),
		gross_amount: gross,
		discount_amount: discount,
		discount_percent: gross > 0 ? Math.round((discount / gross) * 10000) / 100 : 0,
		net_amount: net,
		credit_amount: credit,
		credit_percent: net > 0 ? Math.round((credit / net) * 10000) / 100 : DEFAULT_COMMISSION_PERCENT,
	}
}

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
			setCoupons([])
			setOrders([])
			setPartnerInfo(null)
			setProfileUser(null)
			setCatalogMap({})
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
				// Never load another account's data when identity cannot be resolved.
				if (!isMounted || !currentUser) return
				const isPartner = currentUser.type === 'RAG_Pro_Partner'
				const previewPartnerId = ['MASTER', 'Admin'].includes(currentUser.type)
					? partnerIdParam
					: null
				const selfOnly = !previewPartnerId

				// 2. Fetch Coupons
				let partnerCoupons: any[] = []
				try {
					const couponRes: any = await GetReferralCoupon({
						coupon_type: 'pro_partner',
						self_only: selfOnly,
						...(previewPartnerId ? { partner_inquiry_id: previewPartnerId } : {}),
					})
					const rawCoupons: any[] = Array.isArray(couponRes?.data) ? couponRes.data : []
					partnerCoupons = [...rawCoupons].sort(
						(a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
					)
				} catch (err) {
					console.error('Error fetching partner coupons:', err)
				}
				if (!isMounted) return

				// 3. Fetch Partner Inquiries
				let matchedPartner: ApprovedPartnerInfo | null = null
				try {
					// Partner accounts cannot list all applications. Their own inquiry
					// is already populated on the coupons returned by the API.
					const inqRes: any = isPartner
						? null
						: await GetContactInquiry({
								page: 1,
								limit: 100,
								source: RAG_CONTACT_SOURCE_FILTER,
						  })
					const inqList: any[] = isPartner
						? partnerCoupons
								.filter((c) => belongsToAccount(c, currentUser))
								.map((c) => c.partner_inquiry_id)
								.filter((inquiry) => inquiry && typeof inquiry === 'object')
						: Array.isArray(inqRes?.data)
						? inqRes.data
						: []

					// Only administrators can select a different partner to preview.
					const found = inqList.find((item: any) => {
						if (previewPartnerId) {
							return String(item._id) === String(previewPartnerId)
						}
						const d = item.details || {}
						const email = (d.email || item.email || '').toLowerCase().trim()
						const userEmail = (currentUser?.email || '').toLowerCase().trim()

						if (userEmail && [email, normalizeEmail(item.email)].includes(userEmail)) return true
						const accountId = recordId(currentUser._id || currentUser.id)
						if (accountId && recordId(item.details?.partner_account?.admin_id) === accountId)
							return true
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
				if (!isMounted) return

				const relevantCoupons = partnerCoupons.filter((coupon) => {
					if (previewPartnerId) {
						return (
							recordId(coupon.partner_inquiry_id || coupon.assign_trainer?.trainer_id) ===
							previewPartnerId
						)
					}
					return belongsToAccount(coupon, currentUser)
				})
				if (isMounted) setCoupons(relevantCoupons)

				// 4. Products Catalog
				const pMap: Record<string, any> = {}
				try {
					const prodRes: any =
						isPartner || relevantCoupons.length === 0
							? null
							: await GetProduct({ limit: 500, page: 1 })
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
				const txList: PartnerOrderTransaction[] = []
				for (const coupon of relevantCoupons) {
					if (!isMounted) return
					if (!coupon?._id) continue
					try {
						const usageRes: any = await GetReferralCouponUsage({
							coupon_id: coupon._id,
							self_only: selfOnly,
						})
						if (!isMounted) return
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

							// The API returns one line per coupon product with its own discount % and credit %.
							// Older API responses only have order totals, so fall back to a single line.
							const lines: any[] =
								Array.isArray(ord?.coupon_lines) && ord.coupon_lines.length > 0
									? ord.coupon_lines
									: [buildFallbackLine(ord)]

							lines.forEach((line: any, itemIdx: number) => {
								const pId = String(line?.product_id?._id || line?.product_id || '')
								const matchedCatalogProduct = pMap[pId] || {}

								const productName =
									line?.name ||
									matchedCatalogProduct?.title ||
									matchedCatalogProduct?.name ||
									'Nutrition Product'

								const productImage =
									matchedCatalogProduct?.thumbnail_image ||
									matchedCatalogProduct?.featured_image ||
									(Array.isArray(matchedCatalogProduct?.displayImages)
										? matchedCatalogProduct.displayImages[0]
										: '') ||
									(Array.isArray(matchedCatalogProduct?.images)
										? matchedCatalogProduct.images[0]
										: '') ||
									''

								const qty = Number(line?.quantity || 1)
								const originalTotal = Number(line?.gross_amount || 0)
								const discountVal = Number(line?.discount_amount || 0)
								const paidVal = Number(line?.net_amount ?? Math.max(0, originalTotal - discountVal))
								const commissionVal = Number(line?.credit_amount || 0)
								const commissionRate = Number(line?.credit_percent || 0)
								const couponDiscountPercent = Number(line?.discount_percent || 0)
								const unitPrice = qty > 0 ? originalTotal / qty : originalTotal

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
									creditTime:
										ord?.created_at ||
										ord?.createdAt ||
										coupon.createdAt ||
										new Date().toISOString(),
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
		// Rows are per product; an order with two coupon products is still one order.
		const totalOrders = new Set(orders.map((o) => o.orderId)).size
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
