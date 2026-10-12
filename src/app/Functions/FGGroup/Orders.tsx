import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetOrders(
	query?: {
		order_id?: string
		user_id?: string
		receipt_id?: string
		from_date?: string
		to_date?: string
		order_status?: OrderStatusValue | OrderStatusValue[]
		item_type?: OrderItemTypeValue | OrderItemTypeValue[]
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetOrders, getAPIHeaders('fg_group'), query)
}

export function FetchRazorpayPaymentDetails(body?: {
	razorpay_id: string
	gateway?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.FetchPaymentDetails, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateOrder(body: {
	order_id: string
	amount?: number
	paid_amount?: number
	currency?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateOrder, getAPIHeaders('fg_group'), undefined, body)
}

export function SetBookOrderTrackingStatus(body: {
	user_book_id: string
	status: boolean
	shipment_status: ShipmentStatusValue
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.SetBookTrackingStatus, getAPIHeaders('fg_group'), undefined, body)
}

export function SetProductOrderTrackingStatus(body: {
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

// Order Cart
export function GetOrderCart(query?: {
	user_id?: string
	cart_id?: string
	item_type?: OrderItemTypeValue
	is_purchased?: boolean
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetOrderCart, getAPIHeaders('fg_group'), query)
}
