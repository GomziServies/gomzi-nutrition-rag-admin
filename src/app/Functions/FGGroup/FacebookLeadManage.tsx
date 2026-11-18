import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost, APIPatch, APIDelete } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateFacebookLead(body: any): Promise<any> {
	return APIPost(FGGroupEndpoints.CreateFacebookLead, getAPIHeaders('fg_group'), undefined, body)
}

export function GetFacebookLeads(query: any): Promise<any> {
	return APIGet(FGGroupEndpoints.GetFacebookLeads, getAPIHeaders('fg_group'), query)
}

export function CreateManualFacebookLead(body: any): Promise<any> {
	return APIPost(
		FGGroupEndpoints.CreateManualFacebookLead,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function BulkCreateFacebookLeads(body: any): Promise<any> {
	return APIPost(
		FGGroupEndpoints.BulkCreateFacebookLeads,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateFacebookLead(body: any): Promise<any> {
	return APIPatch(
		FGGroupEndpoints.UpdateFacebookLead,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function DeleteFacebookLead(leadId: string): Promise<any> {
	return APIDelete(
		`${FGGroupEndpoints.DeleteFacebookLead}/${leadId}`,
		getAPIHeaders('fg_group'),
		undefined
	)
}

export function GetVisitorCookieLogs(query: any): Promise<any> {
	return APIGet(FGGroupEndpoints.GetVisitorCookieLogs, getAPIHeaders('fg_group'), query)
}
