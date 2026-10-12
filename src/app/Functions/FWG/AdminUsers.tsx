import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function GetAdminUsers(): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetAdminUser, getAPIHeaders('fwg'))
}

export function ChangeAdminUserPassword(body: {
	id: string
	password: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.ChangeAdminUserPassword, getAPIHeaders('fwg'), undefined, body)
}

export function CreateAdmin(body: {
	full_name: string
	mobile: string
	email: string
	password: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateAdminAccount, getAPIHeaders('fwg'), undefined, body)
}

export function SetAdminPermission(body: {
	access_list: ('diet' | 'diet_assign' | 'exercise_plan' | 'exercise_assign')[]
	admin_user_id: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.SetAdminUserPermission, getAPIHeaders('fwg'), undefined, body)
}

export function AssignUserToAdmin(body: {
	admin_user_id: string | null
	assigned_users: string[]
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AssignUser, getAPIHeaders('fwg'), undefined, body)
}
