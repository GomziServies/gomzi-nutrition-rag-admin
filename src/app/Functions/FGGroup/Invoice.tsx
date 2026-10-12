import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

type BillingAddress = {
	address_line_1?: string
	city?: string
	state?: string
	pin_code?: string
}

type BankDetails = {
	account_type?: string
	account_number?: string
	bank_name?: string
	branch_code?: string
}

type item = {
	_id?: string
	item_name: string
	amount: string
	totalAmount: string
	duration: string
	quantity: string
	delete?: boolean
}

export function createInvoice(body: {
	invoice_category: string
	invoice_number?: string
	date: string
	branch_name?: string
	name: string
	sales_person?: string
	user_id: string
	email?: string
	mobile?: string
	billing_address?: BillingAddress
	bank_details?: BankDetails
	payment_method?: string
	net_amount: number
	paid_amount: number
	note?: string
	items: item[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateInvoice, getAPIHeaders('fg_group'), undefined, body)
}

export function updateInvoice(body: {
	id: string
	invoice_number?: number
	date?: string
	branch_name?: string
	name?: string
	sales_person?: string
	user_id?: string
	email?: string
	mobile?: string
	billing_address?: BillingAddress
	bank_details?: BankDetails
	payment_method?: string
	net_amount?: number
	paid_amount?: number
	note?: string
	items?: item[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateInvoice, getAPIHeaders('fg_group'), undefined, body)
}

export function deleteInvoice(query: { id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.DeleteInvoice, getAPIHeaders('fg_group'), query)
}

export function getInvoice(
	query?: {
		id?: string
		invoice_category?: string
		from_date?: Date
		to_date?: Date
		unpaid_only?: boolean
		branch_name?: string
		paid_only?: boolean
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetInvoices, getAPIHeaders('fg_group'), query)
}

export function getNextInvoiceSequence(query?: {
	invoice_category: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetNextInvoiceSequence, getAPIHeaders('fg_group'), query)
}

/**
 * @deprecated Use Insights API (Insights/GetInvoiceInsights) instead
 * @see Insights.GetInvoiceInsights
 */
export function getInvoiceStats(query: { invoice_category: string }): Promise<FGGroupAPIResponse> {
	console.warn(
		`[DEPRECATED] Use Insights API (Insights/GetInvoiceInsights) instead of GetInvoiceStats()`
	)
	return APIGet(FGGroupEndpoints.GetInvoiceStats, getAPIHeaders('fg_group'), query)
}

export function getInvoiceBranches(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetInvoiceBranches, getAPIHeaders('fg_group'))
}
