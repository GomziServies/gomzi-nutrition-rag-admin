import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function CreateComplaint(body: {
	complaint: string
	message: string
	user_id: string
	company_name: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateComplaint, getAPIHeaders('fwg'), undefined, body)
}

export function UpdateComplaint(body: {
	complaint_id: string
	complaint?: string
	user_id?: string
	company_name?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateComplaint, getAPIHeaders('fwg'), undefined, body)
}

export function GetComplaint(
	query?: { complaint_id?: string, user_id?: string } & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetComplaint, getAPIHeaders('fwg'), query)
}

export function DeleteComplaint(query: { complaint_id: string }): Promise<FWG_APIResponse> {
	return APIDelete(FWGEndpoints.RemoveComplaint, getAPIHeaders('fwg'), query)
}