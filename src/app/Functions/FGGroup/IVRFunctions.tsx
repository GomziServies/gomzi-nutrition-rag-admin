import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import {APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function InitiateCall(body: {
	party_a?: string
	party_b: string
	deskphone?: string
}): Promise<any> {
	return APIPost(
		FGGroupEndpoints.InitiateCall,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetIVRMembers(query?: { page?: number }): Promise<any> {
	return APIGet(
		FGGroupEndpoints.GetIVRMembers,
		getAPIHeaders('fg_group'),
		query
	)
}

export function GetIVRCallLogs(query?: { 
	page?: number, 
	limit?: number, 
	status?: string, 
	search?: string 
}): Promise<any> {
	return APIGet(
		FGGroupEndpoints.GetIVRCallLogs,
		getAPIHeaders('fg_group'),
		query
	)
}
