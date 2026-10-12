import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetGnProcurement(
    query?: {
        id?: string
        clientId?: string
        item_id?: string
        status?: boolean
    } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetGnProcurement, getAPIHeaders('fg_group'), query)
}

export function AddGnProcurement(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.AddGnProcurement, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateGnProcurement(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.UpdateGnProcurement, getAPIHeaders('fg_group'), undefined, data)
}

