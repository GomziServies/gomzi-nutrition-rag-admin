import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost, APIPut } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateFgiitFollowUpReport(body: any): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateFgiitFollowUpReport,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetFgiitFollowUpReport(query?: {
	id?: string
	search?: string
	page?: number
	limit?: number
	mobile?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFgiitFollowUpReport, getAPIHeaders('fg_group'), query)
}

export function UpdateFgiitPersonalDetails(body: any): Promise<FGGroupAPIResponse> {
	const { id, ...restBody } = body
	return APIPut(
		FGGroupEndpoints.UpdateFgiitPersonalDetails,
		getAPIHeaders('fg_group'),
		{ id },
		restBody
	)
}

export function UpdateFgiitCourseDetails(body: any): Promise<FGGroupAPIResponse> {
	const { id, ...restBody } = body
	return APIPut(
		FGGroupEndpoints.UpdateFgiitCourseDetails,
		getAPIHeaders('fg_group'),
		{ id },
		restBody
	)
}

export function UpdateFgiitAdmissionForm(body: any): Promise<FGGroupAPIResponse> {
	const { id, ...restBody } = body
	return APIPut(
		FGGroupEndpoints.UpdateFgiitAdmissionForm,
		getAPIHeaders('fg_group'),
		{ id },
		restBody
	)
}

export function UpdateFgiitPitchReport(body: any): Promise<FGGroupAPIResponse> {
	const { id, ...restBody } = body
	return APIPut(
		FGGroupEndpoints.UpdateFgiitPitchReport,
		getAPIHeaders('fg_group'),
		{ id },
		restBody
	)
}

export function RemoveFgiitFollowUpReport(body: { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.RemoveFgiitFollowUpReport,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}
export function GetFgiitAdmissionReport(query?: {
	id?: string
	search?: string
	page?: number
	limit?: number
	mobile?: string
	start_date?: string
	end_date?: string
	sort?: string
	sortOrder?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFgiitAdmissionReport, getAPIHeaders('fg_group'), query)
}
