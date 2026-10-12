import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetEmployeeApplication(query?: { id?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetEmployeeApplications, getAPIHeaders('fg_group'), query)
}

export function GetEmployerApplications(query?: { id?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetEmployerApplications, getAPIHeaders('fg_group'), query)
}
