import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateTeam(body: {
	manager_id: string
	leader_id: string
	members: string[]
	position: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateTeam, getAPIHeaders('fg_group'), undefined, body)
}

export function GetTeams(params?: {
	id?: string
	manager_id?: string
	leader_id?: string
	position?: string
	search?: string
	page?: number
	limit?: number
	sort?: string
	sortOrder?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetTeams, getAPIHeaders('fg_group'), params)
}

export function RemoveTeam(body: { team_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveTeam, getAPIHeaders('fg_group'), undefined, body)
}

export function AddManagerRating(body: {
	manager_id: string
	kra_scores: {
		productivity: number
		organizational_skills: number
		attendance_punctuality: number
		communications: number
		initiatives: number
		cooperation: number
		interpersonal_relations: number
		specific_job_skills: number
		judgment: number
		dependability: number
	}
	remarks?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.AddManagerRating, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateManagerRating(body: {
	id: string
	kra_scores: {
		productivity: number
		organizational_skills: number
		attendance_punctuality: number
		communications: number
		initiatives: number
		cooperation: number
		interpersonal_relations: number
		specific_job_skills: number
		judgment: number
		dependability: number
	}
	remarks?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateManagerRating, getAPIHeaders('fg_group'), undefined, body)
}

export function GetManagerRatings(params?: {
	manager_id?: string
	team_id?: string
	member_id?: string
	type?: string
	start_date?: string
	end_date?: string
	page?: number
	limit?: number
	sort?: string
	sortOrder?: 'asc' | 'desc'
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetManagerRatings, getAPIHeaders('fg_group'), params)
}
