import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface PromoBannerItem {
	_id?: string
	id?: string
	brand?: string
	title: string
	subtitle?: string
	priceText?: string
	priceValue?: string
	image?: string
	bgGradient?: string
	url?: string
	order?: number
	status?: boolean
	createdAt?: string
	updatedAt?: string
}

export function GetPromoBannersAdmin(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetPromoBanners, getAPIHeaders('fg_group'))
}

export function CreatePromoBannerAdmin(data: Partial<PromoBannerItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManagePromoBanner, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdatePromoBannerAdmin(data: Partial<PromoBannerItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManagePromoBanner, getAPIHeaders('fg_group'), undefined, data)
}

export function DeletePromoBannerAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManagePromoBanner, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}

export function ReorderPromoBannersAdmin(banners: PromoBannerItem[]): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManagePromoBanner, getAPIHeaders('fg_group'), undefined, {
		action: 'reorder',
		banners,
	})
}
