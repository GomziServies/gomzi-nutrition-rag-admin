import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function CreateMotivationSong(body: {
	title: string
	url: string
	description: string
	thumbnail_url: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateMotivationSong, getAPIHeaders('fwg'), undefined, body)
}

export function UpdateMotivationSong(body: {
	id: string
	title?: string
	url?: string
	description?: string
	thumbnail_url?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateMotivationSong, getAPIHeaders('fwg'), undefined, body)
}

export function GetMotivationSong(query?: { id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetMotivationSong, getAPIHeaders('fwg'), query)
}

export function RemoveMotivationSong(body: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveMotivationSong, getAPIHeaders('fwg'), undefined, body)
}
