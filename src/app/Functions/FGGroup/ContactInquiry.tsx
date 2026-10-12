import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetContactInquiry(
	query?: { inquiry_id?: string; subject?: string; unread_only?: boolean; source?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetContactInquiry, getAPIHeaders('fg_group'), query)
}

export function GetRTPConsultancy(
	query?: { booking_id?: string } & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetRTPConsultancyInquiry, getAPIHeaders('fg_group'), query)
}

export function UpdateReadReceipt(body: {
	inquiry_id: string
	read_receipt: boolean
	additional_note?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateInquiryReadReceipt,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function FreeSessionRegistration(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFreeSessionRegistrations, getAPIHeaders('fg_group'), query)
}

export function GetSeminarRegistrations(query?: {
	registration_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSeminarRegistrations, getAPIHeaders('fg_group'), query)
}