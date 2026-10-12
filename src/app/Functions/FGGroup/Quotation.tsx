import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost, APIDelete } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

type BillingAddress = {
	address_line_1?: string
	city?: string
	state?: string
	pin_code?: string
}

type item = {
	_id?: string
	item_name: string
	amount: number
	gst: number
	discount: number
	totalAmount: number
	quantity: number
	isDiscountPercentage: boolean
	item_weight?: number
	item_weight_type?: string
}

export function createQuotation(body: {
	quotation_category: string
	date: string
	branch_name?: string
	name: string
	user_id?: string
	email?: string
	mobile?: string
	billing_address?: BillingAddress
	payment_method?: string
	net_amount: number
	paid_amount: number
	gst?: number
	amount?: number
	discount?: number
	note?: string
	items: item[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateQuotation, getAPIHeaders('fg_group'), undefined, body)
}

export function updateQuotation(body: {
	id: string
	date?: string
	branch_name?: string
	name?: string
	user_id?: string
	email?: string
	mobile?: string
	billing_address?: BillingAddress
	payment_method?: string
	net_amount?: number
	paid_amount?: number
	gst?: number
	amount?: number
	discount?: number
	note?: string
	items?: item[]
}): Promise<FGGroupAPIResponse> {
	// Extract the ID from the body and pass it as a query parameter
	const { id, ...bodyWithoutId } = body;
	return APIPost(FGGroupEndpoints.UpdateQuotation, getAPIHeaders('fg_group'), { id }, bodyWithoutId)
}

export function deleteQuotation(query: { id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.DeleteQuotation, getAPIHeaders('fg_group'), query)
}

export function getQuotation(
	query?: {
		id?: string
		quotation_category?: string
		from_date?: Date
		to_date?: Date
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetQuotations, getAPIHeaders('fg_group'), query)
}