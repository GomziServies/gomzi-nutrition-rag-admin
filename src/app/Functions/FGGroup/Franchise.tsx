import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateFranchise(body: {
	franchise_name: string
	branch_code: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateFranchise, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateFranchise(body: {
	franchise_id: string
	franchise_name: string
	branch_code: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateFranchise, getAPIHeaders('fg_group'), undefined, body)
}

export function GetFranchise(query?: { franchise_id?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFranchise, getAPIHeaders('fg_group'), query)
}

export function DeleteFranchise(query: { franchise_id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.RemoveFranchise, getAPIHeaders('fg_group'), query)
}
