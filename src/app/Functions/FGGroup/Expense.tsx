import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

type item = {
	_id?: string
	item_name: string
	amount: string
	delete?: boolean
}

export function createExpense(body: {
	expense_company: string
	expense_category: string
	expense_number?: string
	date: string
	payment_method?: string
	total_amount: number
	note?: string
	items: item[]
	reference_document: {
		name: string
		url: string
		mime_type: string
	}
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateExpense, getAPIHeaders('fg_group'), undefined, body)
}

export function updateExpense(body: {
	id: string
	expense_category?: string
	expense_number?: string
	date?: string
	payment_method?: string
	total_amount?: number
	note?: string
	items?: item[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateExpense, getAPIHeaders('fg_group'), undefined, body)
}

export function deleteExpense(query: { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.DeleteExpense, getAPIHeaders('fg_group'), query)
}

export function getExpense(
	query?: {
		id?: string
		expense_company?: string
		from_date?: Date
		to_date?: Date
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetExpense, getAPIHeaders('fg_group'), query)
}

export function getNextExpenseSequence(query?: {
	expense_company: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetNextExpenseSequence, getAPIHeaders('fg_group'), query)
}
