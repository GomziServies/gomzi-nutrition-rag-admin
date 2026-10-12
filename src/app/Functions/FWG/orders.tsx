import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function GetOrders(
	query?: {
		order_item_id?: string | null
		order_item_type?: string | null
		order_id?: string | null
		receipt_id?: string | null
		status?: string | null
	} & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetOrders, getAPIHeaders('fwg'), query)
}
