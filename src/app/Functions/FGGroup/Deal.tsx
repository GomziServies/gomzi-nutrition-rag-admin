import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface DealItem {
	_id?: string
	id?: string
	title: string
	subtitle?: string
	tag?: string
	originalPrice?: number
	dealPrice: number
	code?: string
	image: string
	bgGradient?: string
	url?: string
	order?: number
	status?: boolean
	createdAt?: string
	updatedAt?: string
}

export function GetDealsAdmin(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetDeals, getAPIHeaders('fg_group'))
}

export function CreateDealAdmin(data: Partial<DealItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageDeal, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateDealAdmin(data: Partial<DealItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageDeal, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteDealAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageDeal, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}

export function ReorderDealsAdmin(deals: DealItem[]): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageDeal, getAPIHeaders('fg_group'), undefined, {
		action: 'reorder',
		deals,
	})
}
