import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
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