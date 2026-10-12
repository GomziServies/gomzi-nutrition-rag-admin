import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function UpdateDigitalPlan(body: {
	id: string
	amount: number
	plan_name: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateDigitalPlan, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveDigitalPlan(body: { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveDigitalPlan, getAPIHeaders('fg_group'), undefined, body)
}

export function GetDigitalPlans(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetDigitalPlans, getAPIHeaders('fg_group'), query)
}

// --- User Digital Plan ---
export function GetUserDigitalPlans(
	query?: { user_id?: string } & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetUserDigitalPlans, getAPIHeaders('fg_group'), query)
}
