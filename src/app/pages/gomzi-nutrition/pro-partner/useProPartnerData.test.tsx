import { act, renderHook, waitFor } from '@testing-library/react'
import {
	GetContactInquiry,
	GetProduct,
	GetReferralCoupon,
	GetReferralCouponUsage,
} from '../../../Functions/FGGroup'
import { getProfile } from '../../../Functions/FGGroup/AccountFunctions'
import { useProPartnerData } from './useProPartnerData'

jest.mock('../../../Functions/FGGroup', () => ({
	GetContactInquiry: jest.fn(),
	GetProduct: jest.fn(),
	GetReferralCoupon: jest.fn(),
	GetReferralCouponUsage: jest.fn(),
}))
jest.mock('../../../Functions/FGGroup/AccountFunctions', () => ({ getProfile: jest.fn() }))

const ownInquiry = { _id: 'own-partner', email: 'partner@example.com', name: 'Partner' }
const ownCoupon = { _id: 'own-coupon', coupon_code: 'OWN10', partner_inquiry_id: ownInquiry }
const yashCoupon = {
	_id: 'yash-coupon',
	coupon_code: 'YASH10',
	title: 'yash parekh - Special Discount Coupon',
	partner_email: 'yash@example.com',
	partner_inquiry_id: { _id: 'yash-partner', email: 'yash@example.com' },
}
const profile = { _id: 'account-id', type: 'RAG_Pro_Partner', email: 'PARTNER@example.com ' }

beforeEach(() => {
	jest.resetAllMocks()
	;(getProfile as jest.Mock).mockResolvedValue({ data: profile })
	;(GetReferralCoupon as jest.Mock).mockResolvedValue({ data: [yashCoupon, ownCoupon] })
	;(GetContactInquiry as jest.Mock).mockResolvedValue({
		data: [ownInquiry, yashCoupon.partner_inquiry_id],
	})
	;(GetProduct as jest.Mock).mockResolvedValue({ data: [] })
	;(GetReferralCouponUsage as jest.Mock).mockResolvedValue({
		data: [{ orders: [{ _id: 'order', amount: 100 }] }],
	})
})

test('shows only the signed-in partner coupon and loads usage only for that coupon', async () => {
	const { result } = renderHook(() => useProPartnerData())
	await waitFor(() => expect(result.current.loading).toBe(false))
	expect(result.current.coupons).toEqual([ownCoupon])
	expect(result.current.primaryCoupon).toEqual(ownCoupon)
	expect(result.current.partnerInfo?.id).toBe('own-partner')
	expect(result.current.orders.map((order) => order.couponCode)).toEqual(['OWN10'])
	expect(GetReferralCoupon).toHaveBeenCalledWith({ coupon_type: 'pro_partner', self_only: true })
	expect(GetReferralCouponUsage).toHaveBeenCalledTimes(1)
	expect(GetReferralCouponUsage).toHaveBeenCalledWith({ coupon_id: 'own-coupon', self_only: true })
	expect(GetContactInquiry).not.toHaveBeenCalled()
	expect(GetProduct).not.toHaveBeenCalled()
})

test('has no default coupon or earnings when only another partner has a coupon', async () => {
	;(GetReferralCoupon as jest.Mock).mockResolvedValue({ data: [yashCoupon] })
	const { result } = renderHook(() => useProPartnerData())
	await waitFor(() => expect(result.current.loading).toBe(false))
	expect(result.current.coupons).toEqual([])
	expect(result.current.primaryCoupon).toBeNull()
	expect(result.current.partnerInfo).toBeNull()
	expect(result.current.metrics.totalCommission).toBe(0)
	expect(GetReferralCouponUsage).not.toHaveBeenCalled()
})

test('ignores another partner ID supplied by a partner account', async () => {
	const { result } = renderHook(() => useProPartnerData('yash-partner'))
	await waitFor(() => expect(result.current.loading).toBe(false))
	expect(result.current.coupons).toEqual([ownCoupon])
	expect(GetReferralCoupon).toHaveBeenCalledWith({ coupon_type: 'pro_partner', self_only: true })
})

test('allows an administrator to preview a selected partner, without falling back on no match', async () => {
	;(getProfile as jest.Mock).mockResolvedValue({ data: { ...profile, type: 'Admin' } })
	const { result, rerender } = renderHook(({ id }) => useProPartnerData(id), {
		initialProps: { id: 'yash-partner' },
	})
	await waitFor(() => expect(result.current.loading).toBe(false))
	expect(result.current.coupons).toEqual([yashCoupon])
	expect(GetReferralCoupon).toHaveBeenCalledWith({
		coupon_type: 'pro_partner',
		self_only: false,
		partner_inquiry_id: 'yash-partner',
	})
	;(GetReferralCouponUsage as jest.Mock).mockClear()
	rerender({ id: 'no-coupons-partner' })
	await waitFor(() => expect(result.current.loading).toBe(false))
	expect(result.current.coupons).toEqual([])
	expect(result.current.orders).toEqual([])
	expect(result.current.partnerInfo).toBeNull()
	expect(GetReferralCouponUsage).not.toHaveBeenCalled()
})

test('does not request coupons if profile lookup fails', async () => {
	const log = jest.spyOn(console, 'error').mockImplementation(() => {})
	;(getProfile as jest.Mock).mockRejectedValue(new Error('Profile unavailable'))
	const { result } = renderHook(() => useProPartnerData())
	await waitFor(() => expect(result.current.loading).toBe(false))
	expect(result.current.coupons).toEqual([])
	expect(GetReferralCoupon).not.toHaveBeenCalled()
	expect(GetReferralCouponUsage).not.toHaveBeenCalled()
	log.mockRestore()
})

test('uses inquiry ownership ahead of a stale coupon email', async () => {
	;(GetReferralCoupon as jest.Mock).mockResolvedValue({
		data: [{ ...yashCoupon, partner_email: profile.email }],
	})
	const { result } = renderHook(() => useProPartnerData())
	await waitFor(() => expect(result.current.loading).toBe(false))
	expect(result.current.coupons).toEqual([])
	expect(GetReferralCouponUsage).not.toHaveBeenCalled()
})

test('ignores a previous partner response after changing the selected partner', async () => {
	;(getProfile as jest.Mock).mockResolvedValue({ data: { ...profile, type: 'Admin' } })
	let finishOldRequest: (value: any) => void = () => {}
	;(GetReferralCoupon as jest.Mock).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finishOldRequest = resolve
			})
	)
	const { result, rerender } = renderHook(({ id }) => useProPartnerData(id), {
		initialProps: { id: 'yash-partner' },
	})
	await waitFor(() => expect(GetReferralCoupon).toHaveBeenCalledTimes(1))
	rerender({ id: 'own-partner' })
	await waitFor(() => expect(result.current.loading).toBe(false))
	expect(result.current.coupons).toEqual([ownCoupon])
	await act(async () => {
		finishOldRequest({ data: [yashCoupon] })
	})
	expect(result.current.coupons).toEqual([ownCoupon])
	expect(result.current.partnerInfo?.id).toBe('own-partner')
})
