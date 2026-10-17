import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface CompanyAdItem {
	_id?: string
	id?: string
	company: string
	companyId?: string
	title: string
	subtitle?: string
	badge?: string
	discountText?: string
	couponCode?: string
	image: string
	mobileImage?: string
	url?: string
	buttonText?: string
	bgGradient?: string
	order?: number
	status?: boolean
	createdAt?: string
	updatedAt?: string
}

export function GetCompanyAdsAdmin(query?: { company?: string; search?: string; status?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetCompanyAds, getAPIHeaders('fg_group'), query)
}

export function CreateCompanyAdAdmin(data: Partial<CompanyAdItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCompanyAd, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateCompanyAdAdmin(data: Partial<CompanyAdItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCompanyAd, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteCompanyAdAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCompanyAd, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}

export function ReorderCompanyAdsAdmin(ads: { _id?: string; id?: string }[]): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCompanyAd, getAPIHeaders('fg_group'), undefined, {
		action: 'reorder',
		ads,
	})
}
