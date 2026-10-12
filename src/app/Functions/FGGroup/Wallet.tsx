import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function getWalletInvoices(
	query?: {
		invoice_category?: string
		from_date?: Date
		to_date?: Date
		unpaid_only?: boolean
		paid_only?: boolean
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetWalletInvoices, getAPIHeaders('fg_group'), query)
}
