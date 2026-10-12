import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPatch, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface ProductPayload {
	name: string
	displayImages: string[]
	price: number
	discountPrice?: number | null
	shortDescription?: string
	description?: string
	categories?: string[]
	tags?: string[]
	highlights?: string[]
	benefits?: string[]
	ingredients?: string[]
	nutrition?: any[]
	usageInstructions?: string
	storageInstructions?: string
	variations?: {
		name: string
		price: number
	}[]
	private_note?: string
}

export function AddProduct(body: ProductPayload): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.AddProduct, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateProduct(body: {
	id: string
	name?: string
	display_image?: string
	price?: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateProduct, getAPIHeaders('fg_group'), undefined, body)
}

export function GetProduct(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetProduct, getAPIHeaders('fg_group'), query)
}

export function DeleteProduct(body: { id: string }): Promise<any> {
	return APIPost(FGGroupEndpoints.DeleteProduct, getAPIHeaders('fg_group'), undefined, body)
}

export function GetProductStocks(
	query?: FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetProductStock, getAPIHeaders('fg_group'), query)
}

export function GetInventoryHistory(
	query?: InventorySearchOption & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetInventoryHistory, getAPIHeaders('fg_group'), query)
}

export function UpdateSingleProductStock(body: {
	product_id: string
	variant_id: string
	stock: number
	isAvailable: boolean
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateProductStock, getAPIHeaders('fg_group'), undefined, body)
}

export function AddProductVariation(body: {
	product_id: string
	name: string
	price: number
	discountPrice: number
	description: string
	display_image: string[]
	stock: number
	isAvailable: boolean
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.AddProductVariation, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateProductVariation(body: {
	product_id: string
	variant_id: string
	name: string
	price: number
	discountPrice: number
	description: string
	display_image: string[]
	stock: number
	isAvailable: boolean
}): Promise<FGGroupAPIResponse> {
	return APIPatch(
		FGGroupEndpoints.UpdateProductVariation,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function RemoveProductVariation(body: {
	product_id?: string
	variant_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIDelete(
		FGGroupEndpoints.RemoveProductVariation,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function SetProductTrackingStatus(body: {
	user_product_id: string
	status: boolean
	shipment_status: ShipmentStatusValue
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.SetProductTrackingStatus,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

/**
 *
 * @deprecated
 * @see GetProductFeedback
 */
export function GetProductReviews(
	query?: FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	console.warn('[DEPRECATED] Use GetProductFeedback() instead of GetProductReviews()')
	return APIGet(FGGroupEndpoints.GetProductReviews, getAPIHeaders('fg_group'), query)
}

/**
 * @deprecated The method should not be used
 * @see UpdateProductFeedback
 */
export function UpdateProductReview(body: {
	id: string
	status: boolean
}): Promise<FGGroupAPIResponse> {
	console.warn('[DEPRECATED] Use UpdateProductFeedback() instead of UpdateProductReview()')
	return APIPost(FGGroupEndpoints.UpdateProductReview, getAPIHeaders('fg_group'), undefined, body)
}

export function GetProductFeedback(
	query?: { feedback_id?: string } & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetProductFeedback, getAPIHeaders('fg_group'), query)
}

export function UpdateProductFeedback(body: {
	feedback_id: string
	status: FeedbackStatusValue
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.GetProductFeedback, getAPIHeaders('fg_group'), undefined, body)
}

/**
 *
 * @deprecated The method must not be used
 */
export function GetProductCart(): Promise<FGGroupAPIResponse> {
	console.error('[DEPRECATED] Use GetOrderCart() instead of GetProductCart()')
	return APIGet(FGGroupEndpoints.GetProductCart, getAPIHeaders('fg_group'))
}

export function GetProductStock(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetStockManagement, getAPIHeaders('fg_group'), query)
}

export function CreateProductStock(body: {
	item_id: string
	stock: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateStockManagement, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateProductStock(body: {
	stock_id: string
	item_id: string
	stock: number
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateStockManagement, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveProductStock(body: { stock_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveStockManagement, getAPIHeaders('fg_group'), undefined, body)
}
