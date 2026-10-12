import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateTask(body: {
	task_title: string
	start_date: string
	end_date: string
	remark_by_employee?: string
	remark_by_hr?: string
	file_url: string
	admin_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateTask, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateTask(body: {
	task_id: string
	task_title?: string
	start_date?: string
	end_date?: string
	remark_by_hr?: string
	file_url?: string[]
	admin_id?: string
	employee_status?: string
	reject_reason?: string
	hr_status?: string
	status?: string
	hr_reject_reason?: string
	financial_worth?: string
	social_worth?: string
	financial_worth_archive?: string
	social_worth_archive?: string
	extends_dates?: { date: string; reason?: string }[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateTask, getAPIHeaders('fg_group'), undefined, body)
}

export function ActionTask(body: {
	task_id?: string
	status?: string
	remark_by_employee?: string
	remark_by_hr?: string
	task_done_file?: string[]
	url?: Array<{ url_type: string; link: string }>
	social_worth_archive?: string
	financial_worth_archive?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ActionTask, getAPIHeaders('fg_group'), undefined, body)
}

export function GetTask(
	query?: { task_id?: string, admin_id?: string, start_date?: string, end_date?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetTasks, getAPIHeaders('fg_group'), query)
}

export function DeleteTask(body: { task_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveTask, getAPIHeaders('fg_group'), undefined, body)
}