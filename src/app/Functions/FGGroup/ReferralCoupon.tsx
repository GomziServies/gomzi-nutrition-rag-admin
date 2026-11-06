import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

type AssignTrainer = {
	trainer_id?: string
	name?: string
}

export function GetReferralCoupon(query?: {
	coupon_id?: string
	coupon_code?: string
	coupon_type?: 'trainer' | 'pro_partner' | string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetReferralCoupons, getAPIHeaders('fg_group'), query)
}

export function CreateReferralCoupon(body: {
	coupon_code: string
	title: string
	discount?: number
	discount_type?: string
	max_usage_count?: string | number
	expired_at?: string
	assign_trainer?: AssignTrainer
	coupon_type?: 'trainer' | 'pro_partner'
	partner_inquiry_id?: string
	partner_name?: string
	partner_email?: string
	partner_mobile?: string
	scope?: 'ALL' | 'SPECIFIC_PRODUCTS'
	applicable_products?: string[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateReferralCoupon, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateReferralCoupon(body: {
	coupon_id: string
	coupon_code?: string
	title?: string
	discount?: number
	discount_type?: string
	max_usage_count?: string | number
	expired_at?: string
	assign_trainer?: AssignTrainer
	coupon_type?: 'trainer' | 'pro_partner'
	partner_inquiry_id?: string
	partner_name?: string
	partner_email?: string
	partner_mobile?: string
	scope?: 'ALL' | 'SPECIFIC_PRODUCTS'
	applicable_products?: string[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateReferralCoupon, getAPIHeaders('fg_group'), undefined, body)
}

export function GetReferralCouponUsage(query?: {
	coupon_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetCouponUsage, getAPIHeaders('fg_group'), query)
}
