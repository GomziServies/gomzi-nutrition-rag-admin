import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function getGlsYearlyReport(query: {
	invoice_category?: string
	from_date?: Date | string
	to_date?: Date | string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGlsYearlyReport, getAPIHeaders('fg_group'), query)
}

export function getGlsProductWiseReport(query: {
	invoice_category?: string
	from_date?: Date | string
	to_date?: Date | string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGlsProductWiseReport, getAPIHeaders('fg_group'), query)
}

export function getGlsCityWiseReport(query: {
	invoice_category?: string
	from_date?: Date | string
	to_date?: Date | string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGlsCityWiseReport, getAPIHeaders('fg_group'), query)
}

export function getGlsPartyWiseReport(query: {
	invoice_category?: string
	from_date?: Date | string
	to_date?: Date | string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGlsPartyWiseReport, getAPIHeaders('fg_group'), query)
}
