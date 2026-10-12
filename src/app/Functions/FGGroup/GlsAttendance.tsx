import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetGlsAttendance(
	query?: { 
		attendance_id?: string
		status?: string
		from_date?: string
		to_date?: string
	 } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGlsAttendance, getAPIHeaders('fg_group'), query)
}

export function SyncGlsAttendance(query?: {
    from_date?: string
    to_date?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.SyncGlsAttendance, getAPIHeaders('fg_group'), query)
}
