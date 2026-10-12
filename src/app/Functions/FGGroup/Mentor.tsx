import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface MentorCreatePayload {
	name: string
	email: string
	mobile_number: string
}

export interface MentorUpdatePayload {
	mentor_id: string
	name?: string
	email?: string
	mobile_number?: string
}

export interface MentorDeletePayload {
	mentor_id: string
}

export interface MentorGetOptions {
	mentor_id?: string
	search?: string
	status?: 'active' | 'inactive'
	page?: number
	limit?: number
	sort?: string
	sortOrder?: 'asc' | 'desc'
}

export function AddMentor(body: MentorCreatePayload): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateFGIITMentor,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateMentor(body: MentorUpdatePayload): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateFGIITMentor,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function DeleteMentor(body: MentorDeletePayload): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.RemoveFGIITMentor,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetMentor(query?: MentorGetOptions): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFGIITMentors, getAPIHeaders('fg_group'), query)
}