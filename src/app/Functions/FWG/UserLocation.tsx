import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function GetUserLocation(
	query?: {} & FWGSearchOptions & FWGPaginationOptions & FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUserLocation, getAPIHeaders('fwg'), query)
}
