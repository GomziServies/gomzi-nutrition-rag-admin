import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetAdajanBranchAttendance(
	query?: {
		employee_code?: string
		client_code?: string
		status?: string
		from_date?: any
		to_date?: any
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAdajanBranchAttendance, getAPIHeaders('fg_group'), query)
}

export function GetAdajanBranchAttendanceSummary(query?: {
	from_date?: any
	to_date?: any
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAdajanBranchAttendanceSummary, getAPIHeaders('fg_group'), query)
}

export function SyncAdajanBranchAttendance(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.SyncAdajanBranchAttendance, getAPIHeaders('fg_group'))
}
