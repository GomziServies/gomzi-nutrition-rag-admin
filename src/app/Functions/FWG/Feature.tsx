import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function AddFeature(data: { title: string; feature: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddFeature, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateFeature(data: {
	id: string
	title: string
	feature: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateFeature, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveFeature(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveFeature, getAPIHeaders('fwg'), undefined, data)
}

export function GetFeatures(query?: { id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetFeature, getAPIHeaders('fwg'), query)
}
