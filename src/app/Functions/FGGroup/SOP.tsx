import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateSOP(body: {
	service_name: string
	service_details: string[]
	admin_ids: string[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateSOP, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateSOP(body: {
	sop_id: string
	service_name?: string
	service_details?: string[]
	admin_ids?: string[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateSOP, getAPIHeaders('fg_group'), undefined, body)
}

export function GetSOP(
	query?: { admin_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSOPs, getAPIHeaders('fg_group'), query)
}

export function DeleteSOP(body: { sop_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveSOP, getAPIHeaders('fg_group'), undefined, body)
}

export function CompleteSOP(body: {
	sop_id: string
	service_id: string
	remarks?: string
	description?: string
	file_url?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CompleteSOPs, getAPIHeaders('fg_group'), undefined, body)
}
