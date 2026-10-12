import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function GetDashboardStats(): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetDashboardStats, getAPIHeaders('fwg'))
}
