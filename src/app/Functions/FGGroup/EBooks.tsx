import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateEBook(body: {
	ebook_title: string
	description: string
	amount: number
	file_url: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateEBook, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateEBook(body: {
	ebook_id: string
	ebook_title: string
	description: string
	amount: number
	file_url: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateEBook, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveEBook(body: { ebook_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveEBook, getAPIHeaders('fg_group'), undefined, body)
}

export function GetEBooks(
	query?: { ebook_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetEBooks, getAPIHeaders('fg_group'), query)
}
