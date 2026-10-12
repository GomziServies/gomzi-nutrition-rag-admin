import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetMedicalOrders(
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
	return APIGet(FGGroupEndpoints.GetMedicalOrders, getAPIHeaders('fg_group'), query)
}

export function UpdateMedicalDoctorOrder(body: {
	order_id: string
	sign: string
	stamp: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateMedicalDoctorOrder,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateMedicalPharmacyOrder(body: {
	order_id: string
	sign: string
	stamp: string
	items: [
		{
			item_id: string
			amount: number
		}
	]
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateMedicalPharmacyOrder,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetMedicalProductRequirement(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetMedicalProductRequirement, getAPIHeaders('fg_group'), query)
}
