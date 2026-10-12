import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as GCSEndpoints from '../../constants/gcs_endpoints'

type item = {
	_id?: string
	item_name: string
	amount: string
	totalAmount: string
	quantity: string
	delete?: boolean
}

export function CreateInvoice(body: {
	invoice_number: string
	date: string
	fullName: string
	invoiceAddress: string
	phoneNumber: string
	email: string
	items: item[]
	payment_method: string
	bankDetail: string
	totalPayment: string
	paidPayment: string
	invoiceNotes: string
	selectedCompany: string
	termCondition: string
}): Promise<FWG_APIResponse> {
	return APIPost(GCSEndpoints.InvoiceCreate, getAPIHeaders('gcs'), undefined, body)
}

export function UpdateInvoice(body?: {
	id: string | null
	invoice_number?: string
	date?: string
	fullName?: string
	invoiceAddress?: string
	phoneNumber?: string
	email?: string
	items: item[]
	productName?: item[]
	paymentMethod?: string
	bankDetail?: string
	totalPayment?: string
	paidPayment?: string
	invoiceNotes?: string
	termCondition?: string
	selectedCompany?: string
	payment_method: string
}): Promise<FWG_APIResponse> {
	return APIPost(GCSEndpoints.InvoiceUpdate, getAPIHeaders('gcs'), undefined, body)
}

export function GetInvoice(
	query?: {
		id?: string | null
		from_date?: Date
		to_date?: Date
	} & GCSSearchOptions &
		GCSPaginationOptions &
		GCSSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(GCSEndpoints.InvoiceGet, getAPIHeaders('gcs'), query)
}

export function GetInvoiceStats(): Promise<FWG_APIResponse> {
	return APIGet(GCSEndpoints.InvoiceStats, getAPIHeaders('gcs'))
}

export function GetInvoiceInsight(query?: {
	from_date?: Date
	to_date?: Date
}): Promise<FWG_APIResponse> {
	return APIGet(GCSEndpoints.InvocieInsight, getAPIHeaders('gcs'), query)
}
