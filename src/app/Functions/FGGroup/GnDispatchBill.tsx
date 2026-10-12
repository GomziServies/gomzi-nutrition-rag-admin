import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetGnDispatchBill(
    query?: {
        id?: string
        clientId?: string
        status?: boolean
    } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetGnDispatchBill, getAPIHeaders('fg_group'), query)
}

export function AddGnDispatchBill(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.AddGnDispatchBill, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateGnDispatchBill(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.UpdateGnDispatchBill, getAPIHeaders('fg_group'), undefined, data)
}
