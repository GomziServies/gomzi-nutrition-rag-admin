import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface AdBannerItem {
	_id?: string
	id?: string
	title: string
	subtitle?: string
	image: string
	alt_text?: string
	url?: string
	order?: number
	status?: boolean
	createdAt?: string
	updatedAt?: string
}

export function GetAdBannersAdmin(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAdBanners, getAPIHeaders('fg_group'))
}

export function CreateAdBannerAdmin(data: Partial<AdBannerItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageAdBanner, getAPIHeaders('fg_group'), undefined, {
		action: 'create',
		...data,
	})
}

export function UpdateAdBannerAdmin(data: Partial<AdBannerItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageAdBanner, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteAdBannerAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageAdBanner, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}

export function SetPrimaryAdBannerAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageAdBanner, getAPIHeaders('fg_group'), undefined, {
		action: 'set-primary',
		id,
	})
}

export function ReorderAdBannersAdmin(banners: { _id?: string; id?: string }[]): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageAdBanner, getAPIHeaders('fg_group'), undefined, {
		action: 'reorder',
		banners,
	})
}

// Aliases for Static Banner naming
export const GetStaticBannerAdmin = GetAdBannersAdmin
export const CreateStaticBannerAdmin = CreateAdBannerAdmin
export const UpdateStaticBannerAdmin = UpdateAdBannerAdmin
export const DeleteStaticBannerAdmin = DeleteAdBannerAdmin
export const SetPrimaryStaticBannerAdmin = SetPrimaryAdBannerAdmin
export const ReorderStaticBannerAdmin = ReorderAdBannersAdmin
