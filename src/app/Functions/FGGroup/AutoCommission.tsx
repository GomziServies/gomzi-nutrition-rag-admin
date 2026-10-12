import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function getAutoCommissionRequests(
	query?: {
		status?: 'Pending' | 'Approved' | 'Rejected'
		branch?: string
		from_date?: Date
		to_date?: Date
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAutoCommissionRequests, getAPIHeaders('fg_group'), query)
}

export function updateAutoCommissionRequest(body: {
	id: string
	status: 'Approved' | 'Rejected'
	reason?: string
	commission_amount?: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateAutoCommissionRequest, getAPIHeaders('fg_group'), undefined, body)
}
