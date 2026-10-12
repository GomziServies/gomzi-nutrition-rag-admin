import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as GCSEndpoints from '../../constants/gcs_endpoints'

export function GetContactInquiry(
	query?: { inquiry_id?: string; subject?: string; unread_only?: boolean } & GCSSearchOptions &
		GCSPaginationOptions &
		GCSSortOptions
): Promise<GCS_APIResponse> {
	return APIGet(GCSEndpoints.GetContactInquiry, getAPIHeaders('gcs'), query)
}

export function UpdateReadReceipt(body: {
	inquiry_id: string
	read_receipt: boolean
	additional_note?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(GCSEndpoints.UpdateInquiryReadReceipt, getAPIHeaders('gcs'), undefined, body)
}
