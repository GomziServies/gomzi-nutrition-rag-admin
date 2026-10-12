import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateFitnessPlan(body: {
	plan_name: string
	amount: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateFitnessPlan, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateFitnessPlan(body: {
	id: string
	amount?: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateFitnessPlan, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveFitnessPlan(body: { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveFitnessPlan, getAPIHeaders('fg_group'), undefined, body)
}

export function GetFitnessPlans(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFitnessPlans, getAPIHeaders('fg_group'), query)
}

export function GetUserFitnessPlans(query?: { id?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetUserFitnessPlan, getAPIHeaders('fg_group'), query)
}
