import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as GCSEndpoints from '../../constants/gcs_endpoints'

export function GetLead(
	query?: { id?: string | null } & GCSSearchOptions & GCSPaginationOptions & GCSSortOptions
): Promise<GCS_APIResponse> {
	return APIGet(GCSEndpoints.GetLead, getAPIHeaders('gcs'), query)
}

export function AddLead(body: {
	date: string
	fullName: string
	service: string
	industryOrCompany: string
	businessName: string
	goalOrAnnualIncome: string
	email: string
	phoneNumber: string
	leadAddress: string
	reference: string
	notes: string
	leadType: string
}): Promise<GCS_APIResponse> {
	return APIPost(GCSEndpoints.AddLead, getAPIHeaders('gcs'), undefined, body)
}

export function UpdateLead(body?: {
	id: string
	date?: string
	fullName?: string
	service?: string
	industryOrCompany?: string
	businessName?: string
	goalOrAnnualIncome?: string
	email?: string
	phoneNumber?: string
	leadAddress?: string
	reference?: string
	notes?: string
	leadType?: string
}) {
	return APIPost(GCSEndpoints.UpdateLead, getAPIHeaders('gcs'), undefined, body)
}

export function RemoveLead(query?: { id?: string | null }) {
	return APIDelete(GCSEndpoints.RemoveLead, getAPIHeaders('gcs'), query, undefined)
}
