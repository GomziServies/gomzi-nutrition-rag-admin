import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface NutritionPromoBannerItem {
	_id?: string
	id?: string
	brand?: string
	title: string
	badge?: string
	discount?: string
	terms?: string
	image?: string
	bgGradient?: string
	url?: string
	order?: number
	status?: boolean
	createdAt?: string
	updatedAt?: string
}

export function GetNutritionPromoBannersAdmin(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetNutritionPromoBanners, getAPIHeaders('fg_group'))
}

export function CreateNutritionPromoBannerAdmin(data: Partial<NutritionPromoBannerItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageNutritionPromoBanner, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateNutritionPromoBannerAdmin(data: Partial<NutritionPromoBannerItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageNutritionPromoBanner, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteNutritionPromoBannerAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageNutritionPromoBanner, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}

export function ReorderNutritionPromoBannersAdmin(banners: NutritionPromoBannerItem[]): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageNutritionPromoBanner, getAPIHeaders('fg_group'), undefined, {
		action: 'reorder',
		banners,
	})
}
