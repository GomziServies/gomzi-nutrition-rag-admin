import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateTarget(body: {
	target_title: string
	from_date: string
	to_date: string
	target_description: string
	position: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateTarget, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateTarget(body: {
	target_id: string
	target_title?: string
	from_date?: string
	to_date?: string
	target_description?: string
	position?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateTarget, getAPIHeaders('fg_group'), undefined, body)
}

export function GetTarget(
	query?: { target_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetTargets, getAPIHeaders('fg_group'), query)
}

export function DeleteTarget(query: { target_id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.RemoveTarget, getAPIHeaders('fg_group'), query)
}

