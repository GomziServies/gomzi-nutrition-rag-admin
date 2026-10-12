import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateHiringRequest(body: {
	position: string
	budget: string
	experience: string
	employee_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateHiringRequest, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateHiringRequest(body: {
	id: string
	position?: string
	budget?: string
	experience?: string
	employee_remarks?: string
	request_status?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateHiringRequest, getAPIHeaders('fg_group'), undefined, body)
}

export function ActionHiringRequest(body: {
	id: string
	status: string
	remarks?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ActionHiringRequest, getAPIHeaders('fg_group'), undefined, body)
}

export function GetHiringRequests(
	query?: {
		start_date?: string
		end_date?: string
		request_status?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetHiringRequests, getAPIHeaders('fg_group'), query)
}

export function RemoveHiringRequest(query: { id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.RemoveHiringRequest, getAPIHeaders('fg_group'), query)
}
