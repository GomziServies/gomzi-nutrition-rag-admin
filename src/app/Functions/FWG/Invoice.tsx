import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function CreateInvoice(body: {
	invoice_number: string
	date: string
	branch_name: string
	fullName: string
	invoiceAddress: string
	phoneNumber: string
	email: string
	productName: string
	paymentMethod: string
	bankDetail: string
	totalPayment: string
	paidPayment: string
	invoiceNotes: string
	selectedCompany: string
	invoice_category: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.InvoiceCreate, getAPIHeaders('fwg'), undefined, body)
}

export function UpdateInvoice(
	query?: { id?: string | null },
	body?: {
		invoice_number?: string
		date?: string
		branch_name?: string
		fullName?: string
		invoiceAddress?: string
		phoneNumber?: string
		email?: string
		productName?: string
		paymentMethod?: string
		bankDetail?: string
		totalPayment?: string
		paidPayment?: string
		invoiceNotes?: string
		selectedCompany?: string
		invoice_category?: string
	}
): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.InvoiceUpdate, getAPIHeaders('fwg'), query, body)
}

export function GetInvoice(
	query?: {
		id?: string | null
		createdById?: string | null
		from_date?: Date
		to_date?: Date
		invoice_category?: string | null
	} & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.InvoiceGet, getAPIHeaders('fwg'), query)
}

export function GetNextInvoiceNumber(): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.NextInvoiceNumber, getAPIHeaders('fwg'))
}

export function GetInvoiceStats(query?: {
	selected_company?: string | string[]
	email?: string | string[]
	phone_number?: string | string[]
	payment_method?: string | string[]
	invoice_from_date?: Date
	invoice_to_date?: Date
	createdAt_from?: Date
	createdAt_to?: Date
	reset_cache?: boolean
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.InvoiceStats, getAPIHeaders('fwg'), query)
}
