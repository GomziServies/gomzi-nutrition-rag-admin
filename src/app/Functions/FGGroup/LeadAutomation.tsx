import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

type item = {
	name: string
	amount: number
	currency: string
}

export function CreateLeadAutomation(body: {
	fb_account_id?: string
	ads_id: string
	sheet_id?: string
	sub_sheet_id?: string
	category?: string
	sheets_headers?: string
	title: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateLeadAutomation, getAPIHeaders('fg_group'), undefined, body)
}

export function GetLeadAutomation(
	query?: {
		id?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetLeadAutomationRoute, getAPIHeaders('fg_group'), query)
}

export function RemoveLeadAutomation(body: {
	id: string
	status: boolean
}): Promise<FGGroupAPIResponse> {
	console.warn('[DEPRECATED] Use UpdateProductFeedback() instead of RemoveLeadAutomation()')
	return APIPost(
		FGGroupEndpoints.RemoveLeadAutomationRoute,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}
