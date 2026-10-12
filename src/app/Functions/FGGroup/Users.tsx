import { HttpStatusCode } from 'axios'
import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetUsers(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetUsers, getAPIHeaders('fg_group'), query)
}

export function GetStudents(
	query?: {
		id?: string
		course_id?: string
		alumni?: boolean
		course_category?: FitnessCourseType
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetStudentUsers, getAPIHeaders('fg_group'), query)
}

export function UpdateUser(body: {
	id: string
	first_name?: string
	last_name?: string
	alumni?: boolean
	address_line_1?: string
	address_line_2?: string
	city?: string
	state?: string
	country?: string
	pin_code?: string
	notes?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateUser, getAPIHeaders('fg_group'), undefined, body)
}

export function LockUnlockUser(body: {
	user_id: string
	lock?: boolean
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.LockUnlockUser, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveUser(body: { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveUser, getAPIHeaders('fg_group'), undefined, body)
}

export function CreateUser(body: {
	first_name: string
	last_name: string
	mobile: string
	email: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateUser, getAPIHeaders('fg_group'), undefined, body)
}

export function GetUserDietPreferences(
	query?: { user_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetUserDietPreference, getAPIHeaders('fg_group'), query)
}

export function SendPushNotification(body: {
	user_id?: string
	email?: string
	mobile?: string
	message?: string
	title: string
	channelId?: string
	channelName?: string
}): Promise<FGGroupAPIResponse> {
	if (!body.user_id && !body.email && !body.mobile) {
		return Promise.reject({
			status: HttpStatusCode.BadRequest,
			response: 'Bad Request',
			message: 'At least one of user_id, email or mobile is required',
		})
	}

	return APIPost(FGGroupEndpoints.SendFCMNotification, getAPIHeaders('fg_group'), undefined, body)
}
