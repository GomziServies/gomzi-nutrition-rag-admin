import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost, APIPut } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateAdajanBranchEmployee(body: any): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateAdajanBranchEmployee,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetAdajanBranchEmployees(query?: any): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAdajanBranchEmployees, getAPIHeaders('fg_group'), query)
}

export function UpdateAdajanBranchEmployee(body: any): Promise<FGGroupAPIResponse> {
	return APIPut(
		FGGroupEndpoints.UpdateAdajanBranchEmployee,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function DeleteAdajanBranchEmployee(body: { id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(
		FGGroupEndpoints.DeleteAdajanBranchEmployee,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}
