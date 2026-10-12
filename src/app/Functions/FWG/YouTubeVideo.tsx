import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function AddYoutubeVideo(data: {
	title: string,
	url: string,
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddYoutubeVideo, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveYoutubeVideo(data: {
	id: string,
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveYoutubeVideo, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateYoutubeVideo(data: {
	id: string,
	title: string,
	url: string,
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateYoutubeVideo, getAPIHeaders('fwg'), undefined, data)
}

export function GetYoutubeVideo(query?: {
	id?: string
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetYoutubeVideo, getAPIHeaders('fwg'), query)
}
