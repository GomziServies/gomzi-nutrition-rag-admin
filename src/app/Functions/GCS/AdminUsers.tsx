import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIPost } from '../../../_metronic/helpers/Utils'
import * as GCSEndpoints from '../../constants/gcs_endpoints'

// export function GetAdminUsers(): Promise<GCS_APIResponse> {
// 	return APIGet(GCSEndpoints.GetAdminUser, getAPIHeaders('gcs'))
// }

export function CreateAdmin(body: {
	full_name: string
	mobile: string
	email: string
	password: string
}): Promise<GCS_APIResponse> {
	return APIPost(GCSEndpoints.CreateAdminAccount, getAPIHeaders('gcs'), undefined, body)
}
