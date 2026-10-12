import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetEmployeeChatHistory(query?: {
	to?: string
	from?: string
	participant?: string
}): Promise<FWG_APIResponse> {
	return APIGet(FGGroupEndpoints.GetEmployeeChatHistory, getAPIHeaders('fg_group'), query)
}

export function GetChatEmployees(query?: {
	page?: number
	limit?: number
	skip?: number
	from?: string | string[]
	to?: string | string[]
	participant?: string | string[]
}): Promise<FWG_APIResponse> {
	return APIGet(FGGroupEndpoints.GetChatEmployees, getAPIHeaders('fg_group'), query)
}
