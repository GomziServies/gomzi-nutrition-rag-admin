import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPatch, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateDailyReporting(body: {
	task_title: string
	file_url: string
	admin_id: string
	remarks?: string
	url?: Array<{ url_type: string; link: string }>
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateDailyReporting, getAPIHeaders('fg_group'), undefined, body)
}

export function GetDailyReporting(
	query?: { daily_reporting_id?: string; admin_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetDailyReporting, getAPIHeaders('fg_group'), query)
}

export function UpdateDailyReporting(body: {
	report_id: string
	task_title: string
	file_url?: string[]
	remarks?: string
	admin_id: string
	url?: Array<{ url_type: string; link: string }>
}): Promise<FGGroupAPIResponse> {
	return APIPatch(FGGroupEndpoints.UpdateDailyReporting, getAPIHeaders('fg_group'), undefined, body)
}