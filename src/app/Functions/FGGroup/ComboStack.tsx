import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface ComboStackProductItem {
	product: any
	label?: string
}

export interface ComboStackItem {
	_id?: string
	id?: string
	name: string
	tagline?: string
	company?: string
	comboPrice: number
	originalPrice?: number
	products?: ComboStackProductItem[]
	categories?: string[]
	labels?: string[]
	order?: number
	status?: boolean
	createdAt?: string
	updatedAt?: string
}

export function GetComboStacksAdmin(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetComboStacks, getAPIHeaders('fg_group'))
}

export function CreateComboStackAdmin(data: Partial<ComboStackItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageComboStack, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateComboStackAdmin(data: Partial<ComboStackItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageComboStack, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteComboStackAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageComboStack, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}

export function ReorderComboStacksAdmin(comboStacks: ComboStackItem[]): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageComboStack, getAPIHeaders('fg_group'), undefined, {
		action: 'reorder',
		comboStacks,
	})
}
