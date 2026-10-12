import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fg_group_endpoints'

export function CreateFwgFollowUpReport(body: any): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateFwgFollowUpReport, getAPIHeaders('fg_group'), undefined, body)
}

export function GetFwgFollowUpReport(
	query?: { id?: string; mobile?: string } & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetFwgFollowUpReport, getAPIHeaders('fg_group'), query)
}

export function AddFwgCallEntry(query: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddFwgCallEntry, getAPIHeaders('fg_group'), query)
}

export function UpdateFwgCallEntry(
	query: { id: string; callHistoryId: string },
	body: any
): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateFwgCallEntry, getAPIHeaders('fg_group'), query, body)
}
