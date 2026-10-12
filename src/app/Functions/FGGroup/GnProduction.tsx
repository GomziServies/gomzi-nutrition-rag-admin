import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetGnProduction(
    query?: {
        id?: string
        clientId?: string
        production_itemId?: string
        batch_no?: string
        status?: boolean
    } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetGnProduction, getAPIHeaders('fg_group'), query)
}

export function AddGnProduction(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.AddGnProduction, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateGnProduction(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.UpdateGnProduction, getAPIHeaders('fg_group'), undefined, data)
}

