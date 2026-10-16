import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateEmployeeLeave(body: {
	from_date: string
	to_date: string
	reason: string
	leave_type?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateEmployeeLeave, getAPIHeaders('fg_group'), undefined, body)
}

export function ActionEmployeeLeave(body: {
	leave_id: string
	status: string
	remarks: string
	from_date?: string
	to_date?: string
	reason?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ActionEmployeeLeave, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveEmployeeLeave(body: { leave_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveEmployeeLeave, getAPIHeaders('fg_group'), undefined, body)
}

export function GetEmployeeLeaves(
	query?: { leave_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetEmployeeLeaves, getAPIHeaders('fg_group'), query)
}
