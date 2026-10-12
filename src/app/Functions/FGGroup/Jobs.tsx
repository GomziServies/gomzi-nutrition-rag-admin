import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateJobPlacement(body: {
	company_name: string
	title: string
	related_course: string[] | string
	contact_name: string
	mobile: string
	email: string
	website: string
	vacancies: number
	start_date: string
	end_date: string
	banner_image: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateJobPlacement, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateJobPlacement(body: {
	post_id: string
	company_name?: string
	title?: string
	related_course?: string[] | string
	contact_name?: string
	mobile?: string
	email?: string
	website?: string
	vacancies?: number
	start_date?: string
	end_date?: string
	banner_image?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateJobPlacement, getAPIHeaders('fg_group'), undefined, body)
}

export function GetJobPlacement(
	query?: { post_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetJobPlacement, getAPIHeaders('fg_group'), query)
}

export function DeleteJobPlacement(query: { post_id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.RemoveFranchise, getAPIHeaders('fg_group'), query)
}

export function RemoveJobPostClick(body: {
	post_id: string
	cv_id: string
	deleted_reason: string
	deleted_description?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveJobPostClick, getAPIHeaders('fg_group'), undefined, body)
}


