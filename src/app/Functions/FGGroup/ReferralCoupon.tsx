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
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetReferralCoupons, getAPIHeaders('fg_group'), query)
}

export function CreateReferralCoupon(body: {
	coupon_code: string
	title: string
	discount?: number
	max_usage_count?: string
	expired_at?: string
	assign_trainer?: AssignTrainer
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateReferralCoupon, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateReferralCoupon(body: {
	coupon_id: string
	coupon_code?: string
	title?: string
	discount?: number
	max_usage_count?: string
	expired_at?: string
	assign_trainer?: AssignTrainer
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateReferralCoupon, getAPIHeaders('fg_group'), undefined, body)
}

export function GetReferralCouponUsage(query?: {
	coupon_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetCouponUsage, getAPIHeaders('fg_group'), query)
}
