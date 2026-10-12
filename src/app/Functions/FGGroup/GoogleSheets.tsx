import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function AppendGoogleSheets(body: {
	sheet_id: string
	range: string
	data: [string[]]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.AppendGoogleSheets, getAPIHeaders('fg_group'), undefined, body)
}

export function GetGoogleSheets(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGoogleSheets, getAPIHeaders('fg_group'))
}

export function GetGoogleSubSheets(
	query?: {
		sheet_id?: string
	}
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGoogleSubSheets, getAPIHeaders('fg_group'), query)
}
