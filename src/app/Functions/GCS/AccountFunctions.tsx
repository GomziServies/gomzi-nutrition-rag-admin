import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as GCSEndpoints from '../../constants/gcs_endpoints'

export function getProfile(): Promise<GCS_APIResponse> {
	return APIGet(GCSEndpoints.GetProfile, getAPIHeaders('gcs'))
}

export function UpdateProfile(data: { full_name?: string }): Promise<GCS_APIResponse> {
	return APIPost(GCSEndpoints.UpdateProfile, getAPIHeaders('gcs'), undefined, data)
}

/**
 * Change the password for the user.
 * @param data - An object containing the new password and the old password.
 * @returns A Promise that resolves to the result of the API call.
 */
export function ChangePassword(data: {
	password: string
	old_password: string
}): Promise<GCS_APIResponse> {
	return APIPost(GCSEndpoints.ChangePassword, getAPIHeaders('gcs'), undefined, data)
}
