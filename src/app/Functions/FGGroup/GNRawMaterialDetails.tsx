import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateGnRawMaterialProduct(body: {
	name: string
	max_stock?: number
	unit?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateGnRawMaterialProduct,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateGnRawMaterialProduct(body: {
	id: string
	name?: string
	max_stock?: number
	unit?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateGnRawMaterialProduct,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetGnRawMaterialProduct(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGnRawMaterialProduct, getAPIHeaders('fg_group'), query)
}

export function RemoveGnRawMaterialProduct(product_id: string): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.RemoveGnRawMaterialProduct,
		getAPIHeaders('fg_group'),
		undefined,
		{ product_id }
	)
}

export function GetGnRawMaterialSupplier(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGnRawMaterialSupplier, getAPIHeaders('fg_group'), query)
}

export function CreateGnRawMaterialSupplier(body: {
	name?: string
	number?: number
	email?: string
	supplier_logo?: string
	address?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateGnRawMaterialSupplier,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateGnRawMaterialSupplier(body: {
	id: string
	name?: string
	number?: number
	email?: string
	supplier_logo?: string
	address?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateGnRawMaterialSupplier,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function RemoveGnRawMaterialSupplier(supplier_id: string): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.RemoveGnRawMaterialSupplier,
		getAPIHeaders('fg_group'),
		undefined,
		{ supplier_id }
	)
}

export function GetGnRawMaterialSupplierInvoice(
	query?: {
		id?: string
		supplier_name?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGnRawMaterialSupplierInvoice, getAPIHeaders('fg_group'), query)
}

export function CreateGnRawMaterialSupplierInvoice(body: {
	supplier_id: string
	items: {
		product_id: string
		rate: number
		weight: number
		weight_type: string
		gst?: number
	}[]
	bill_image?: string
	charges?: number
	total_amount?: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateGnRawMaterialSupplierInvoice,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateGnRawMaterialSupplierInvoice(body: {
	id: string
	supplier_id?: string
	items?: {
		product_id: string
		rate: number
		weight: number
		weight_type: string
		gst?: number
	}[]
	bill_image?: string
	charges?: number
	total_amount?: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateGnRawMaterialSupplierInvoice,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function RemoveGnRawMaterialSupplierInvoice(
	invoice_id: string
): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.RemoveGnRawMaterialSupplierInvoice,
		getAPIHeaders('fg_group'),
		undefined,
		{ invoice_id }
	)
}

export function GetGnStock(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGnStock, getAPIHeaders('fg_group'), query)
}
