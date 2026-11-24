import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function getProfile(): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetProfile, getAPIHeaders('fwg'))
}

export function UpdateProfile(data: { full_name?: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateProfile, getAPIHeaders('fwg'), undefined, data)
}

/**
 * Change the password for the user.
 * @param data - An object containing the new password and the old password.
 * @returns A Promise that resolves to the result of the API call.
 */
export function ChangePassword(data: {
	password: string
	old_password: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.ChangePassword, getAPIHeaders('fwg'), undefined, data)
}

export function FileUploadToFWG(
	files: any,
	body: { directory: string } = { directory: 'documents' }
) {
	if (!files) {
		return null
	}

	const formData = new FormData()

	formData.append('directory', body.directory)

	if (!Array.isArray(files)) {
		files = [files]
	}

	files.forEach((file: any) => {
		const blobOrFile = file instanceof Blob ? file : file?.file instanceof Blob ? file.file : null
		if (blobOrFile) {
			try {
				file.fileURL = URL.createObjectURL(blobOrFile)
			} catch (_) {}
			formData.append('files', blobOrFile)
		} else if (file) {
			formData.append('files', file)
		}
	})

	return APIPost(
		FWGEndpoints.FileUpload,
		getAPIHeaders('fwg', { 'Content-Type': 'multipart/form-data' }),
		undefined,
		formData
	)
}
