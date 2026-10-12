import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetGeneralDashboard(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GeneralDashboardStats, getAPIHeaders('fg_group'))
}

/**
 * @deprecated
 * @see Insights.GetStudentsStats
 */
export function GetStudentDashboard(): Promise<FGGroupAPIResponse> {
	console.warn(
		'[DEPRECATED] Use Insights.GetStudentsStats() instead of Dashboard.GetStudentDashboard()'
	)
	return APIGet(FGGroupEndpoints.StudentDashboardStats, getAPIHeaders('fg_group'))
}
