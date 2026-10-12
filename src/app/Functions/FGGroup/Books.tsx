import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateBook(body: {
	book_title: string
	description: string
	amount: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateBook, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateBook(body: {
	book_id: string
	book_title: string
	description: string
	amount: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateBook, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveBook(body: { book_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveBook, getAPIHeaders('fg_group'), undefined, body)
}

export function GetBooks(
	query?: { book_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetBooks, getAPIHeaders('fg_group'), query)
}

export function GetBookFeedbacks(query?: { feedback_id: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetBooksFeedback, getAPIHeaders('fg_group'), query)
}

export function UpdateBookFeedback(body: {
	feedback_id: string
	status: FeedbackStatusValue
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.GetBooksFeedback, getAPIHeaders('fg_group'), undefined, body)
}
