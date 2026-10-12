import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetUserLocation(
	query?: {} & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetUserLocation, getAPIHeaders('fg_group'), query)
}
