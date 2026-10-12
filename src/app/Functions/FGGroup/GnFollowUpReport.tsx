import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPatch, APIPost, APIPut } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateGnFollowUpReport(body: any): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateGnFollowUpReport,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetGnFollowUpReport(
	query: { id?: string; mobile?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGnFollowUpReport, getAPIHeaders('fg_group'), query)
}

export function UpdateProductDetails(
	query: { id: string; callHistoryId?: string },
	body: any
): Promise<FGGroupAPIResponse> {
	return APIPut(FGGroupEndpoints.UpdateProductDetails, getAPIHeaders('fg_group'), query, body)
}

export function UpdateSampleSelection(
	query: { id: string; callHistoryId?: string },
	body: any
): Promise<FGGroupAPIResponse> {
	return APIPut(FGGroupEndpoints.UpdateSampleSelection, getAPIHeaders('fg_group'), query, body)
}

export function UpdateSampleUpdate(
	query: { id: string; callHistoryId?: string },
	body: any
): Promise<FGGroupAPIResponse> {
	return APIPut(FGGroupEndpoints.UpdateSampleUpdate, getAPIHeaders('fg_group'), query, body)
}

export function UpdatePitchReport(
	query: { id: string; callHistoryId?: string },
	body: any
): Promise<FGGroupAPIResponse> {
	return APIPatch(FGGroupEndpoints.UpdatePitchReport, getAPIHeaders('fg_group'), query, body)
}

export function UpdateGnPersonalDetails(
	query: { id: string },
	body: any
): Promise<FGGroupAPIResponse> {
	return APIPut(FGGroupEndpoints.UpdateGnPersonalDetails, getAPIHeaders('fg_group'), query, body)
}

export function GetGnSampleSelectedReports(
	query: FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGnSampleSelectedReports, getAPIHeaders('fg_group'), query)
}
