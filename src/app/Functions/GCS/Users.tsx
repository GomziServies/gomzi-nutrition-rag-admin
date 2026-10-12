import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as GCSEndpoints from '../../constants/gcs_endpoints'

export function RemoveUser(data: { id: string }): Promise<GCS_APIResponse> {
	return APIPost(GCSEndpoints.RemoveUser, getAPIHeaders('gcs'), undefined, data)
}

export function GetUser(query?: {
	id?: string
	page?: number
	limit?: number
	skip?: number
	search?: string | number | boolean
	sort?: string
	sortOrder?: QuerySortOptions
}): Promise<GCS_APIResponse> {
	return APIGet(GCSEndpoints.GetUser, getAPIHeaders('gcs'), query)
}
