import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetPlacementRequest(
	query?: { user_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetPlacementRequest, getAPIHeaders('fg_group'), query)
}

export function SchedulePlacementInterview(body: {
	placement_request_id: string
	interview_scheduled_at: string
	contact_person_name: string
	contact_person_mobile: string
	contact_person_email: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.SchedulePlacementInterview, getAPIHeaders('fg_group'), undefined, body)
}
