import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost, APIDelete } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface CategoryItem {
	_id?: string
	id?: string
	title: string
	slug: string
	subtitle?: string
	tag?: string
	spec?: string
	image: string
	bg?: string
	accent?: string
	url?: string
	order?: number
	status?: boolean
	productCount?: number
	createdAt?: string
	updatedAt?: string
}

export function GetCategoriesAdmin(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetCategories, getAPIHeaders('fg_group'))
}

export function CreateCategoryAdmin(data: Partial<CategoryItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCategory, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateCategoryAdmin(data: Partial<CategoryItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCategory, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteCategoryAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCategory, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}

export function ReorderCategoriesAdmin(categories: { _id?: string; id?: string }[]): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCategory, getAPIHeaders('fg_group'), undefined, {
		action: 'reorder',
		categories,
	})
}
