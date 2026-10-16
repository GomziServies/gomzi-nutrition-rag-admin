import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface BlogItem {
	_id?: string
	id?: string
	title: string
	slug: string
	category: string
	date?: string
	desc?: string
	image?: string
	readTime?: string
	reviewer?: string
	author?: string
	tags?: string[]
	metaTitle?: string
	metaDescription?: string
	content?: any
	order?: number
	status?: boolean
	featured?: boolean
	views?: number
	createdAt?: string
	updatedAt?: string
}

export function GetBlogsAdmin(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetBlogs, getAPIHeaders('fg_group'))
}

export function CreateBlogAdmin(data: Partial<BlogItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageBlog, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateBlogAdmin(data: Partial<BlogItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageBlog, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteBlogAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageBlog, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}
