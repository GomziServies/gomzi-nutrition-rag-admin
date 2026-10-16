import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface HeroBannerSlide {
	_id?: string
	id?: string
	title?: string
	subtitle?: string
	desktop_image: string
	mobile_image?: string
	alt_text?: string
	shop_link?: string
	brochure_url?: string
	order?: number
	status?: boolean
}

export function GetHeroBanner(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetHeroBanner, getAPIHeaders('fg_group'))
}

export function UpdateHeroBanner(data: any): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateHeroBanner, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteHeroBanner(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateHeroBanner, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}