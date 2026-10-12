import { ObjectId } from 'bson'
import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateSubscriptionPlan(body: {
	period: string
	interval: number
	notes: object
	name: string
	amount: number
	currency: string
	description: string
	course_id: string
	payment_gateway: PaymentGateway
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateSubscriptionPlan,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetSubscriptionPlan(
	query?: {
		id?: string
		razorpay_plan_id?: string
		from_date?: Date
		to_date?: Date
		name?: string
		gateway?: PaymentGateway
		course_id?: ObjectId
		plan_id?: ObjectId
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSubscriptionPlan, getAPIHeaders('fg_group'), query)
}
