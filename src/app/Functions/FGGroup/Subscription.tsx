import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPatch, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

type item = {
	name: string
	amount: number
	currency: string
}

export function createSubscription(body: {
	plan_id: string
	total_count: number
	quantity: number
	start_at?: Date
	expire_by?: Date
	customer_notify: number
	notify_info: object
	addons?: item[]
	notes?: object
	user_id: string
	notification: object
	payment_gateway: PaymentGateway
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateSubscription, getAPIHeaders('fg_group'), undefined, body)
}

export function updateSubscription(body: {
	subscription_id: string
	plan_id?: string
	quantity?: number
	start_at?: Date
	remaining_count?: number
	customer_notify?: object
	schedule_change_at?: string
}): Promise<FGGroupAPIResponse> {
	return APIPatch(FGGroupEndpoints.UpdateSubscription, getAPIHeaders('fg_group'), undefined, body)
}

export function getSubscription(
	query?: {
		id?: string
		subscription_id?: string
		from_date?: Date
		to_date?: Date
		subscriptionBy?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSubscription, getAPIHeaders('fg_group'), query)
}

export function getSubscriptionById(
	query?: {
		subscription_id: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSubscriptionById, getAPIHeaders('fg_group'), query)
}

export function getSubscriptionInvoiceById(
	query?: {
		subscription_id: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSubscriptionInvoice, getAPIHeaders('fg_group'), query)
}

export function cancelSubscription(
	body: {
		subscription_id: string
		cancel_at_cycle_end: number
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CancelSubscription, getAPIHeaders('fg_group'), undefined, body)
}

export function pauseSubscription(query: { subscription_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.PauseSubscription, getAPIHeaders('fg_group'), query)
}

export function resumeSubscription(query: {
	subscription_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ResumeSubscription, getAPIHeaders('fg_group'), query)
}
