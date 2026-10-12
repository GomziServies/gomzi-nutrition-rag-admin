import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateComplaint(body: {
	complaint: string
	user_id: string
	company_name: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateComplaint, getAPIHeaders('fg_group'), undefined, body)
}

export function ActionComplaint(body: {
	complaint_id: string
	reply_message: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ActionComplaint, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateComplaint(body: {
	complaint_id: string
	complaint?: string
	user_id?: string
	company_name?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateComplaint, getAPIHeaders('fg_group'), undefined, body)
}

export function GetComplaint(
	query?: { complaint_id?: string, user_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetComplaint, getAPIHeaders('fg_group'), query)
}

export function DeleteComplaint(query: { complaint_id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.RemoveComplaint, getAPIHeaders('fg_group'), query)
}