import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPatch, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function AddMedicalProduct(body: {
	name: string
	description: string
	display_image?: string
	unit?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.AddMedicalProduct, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateMedicalProduct(body: {
	id: string
	name: string
	description: string
	display_image?: string
	unit?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateMedicalProduct, getAPIHeaders('fg_group'), undefined, body)
}

export function GetMedicalProduct(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetMedicalProduct, getAPIHeaders('fg_group'), query)
}
