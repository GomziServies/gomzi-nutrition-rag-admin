import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateTrainer(body: {
	name: string
	city: string
	company: string
	email: string
	mobile: string
	password: string
	address?: string
	profile_image?: string
	birthdate?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateTrainer, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateTrainer(body: {
	admin_id: string
	name?: string
	email?: string
	mobile?: string
	city?: string
	company?: string | number
	address?: string
	profile_image?: string
	birthdate?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateTrainer, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveTrainer(body: { admin_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveTrainer, getAPIHeaders('fg_group'), undefined, body)
}

export function GetTrainers(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetTrainers, getAPIHeaders('fg_group'), query)
}
