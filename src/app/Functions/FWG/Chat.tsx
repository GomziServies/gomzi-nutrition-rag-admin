import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function GetChatHistory(query?: {
	to?: string
	from?: string
	participant?: string
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetChatHistory, getAPIHeaders('fwg'), query)
}

export function GetChatUsers(query?: {
	page?: number
	limit?: number
	skip?: number
	from?: string | string[]
	to?: string | string[]
	participant?: string | string[]
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetChatUsers, getAPIHeaders('fwg'), query)
}
