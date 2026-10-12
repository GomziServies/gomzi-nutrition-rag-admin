import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function GetFranchiseUser(query?: { id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetFranchiseUser, getAPIHeaders('fwg'), query)
}

export function SetFranchiseUserAccess(data: {
	franchise_user_id: string
	user_profile: boolean
	membership_info: boolean
	exercise_update: true
	diet_update: true
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.SetFranchiseUserAccess, getAPIHeaders('fwg'), undefined, data)
}

export function DeleteFranchiseUser(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.DeleteFranchiseUser, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateFranchiseUserProfile(data: {
	id: string
	first_name?: string
	last_name?: string
	email?: string
	mobile?: string
	profile_image?: string
	qualification?: string[]
	commission?: number
	message?: string
	franchiseType?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateFranchiseUserProfile, getAPIHeaders('fwg'), undefined, data)
}

export function CreateFranchiseUser(data: {
	franchiseType?: string
	first_name: string
	last_name: string
	email: string
	mobile: string
	password: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateFranchiseUser, getAPIHeaders('fwg'), undefined, data)
}

export function ChangeFranchiseUserPassword(data: {
	id: string
	password: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.ChangeFranchiseUserPassword, getAPIHeaders('fwg'), undefined, data)
}
