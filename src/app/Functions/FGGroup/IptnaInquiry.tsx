import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'



export function GetIptnaInquiry(
	query?: {
		_id?: string
		page?: number
		limit?: number
		approval_status?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetIptnaInquiry, getAPIHeaders('fg_group'), query)
}
