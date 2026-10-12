import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetGnLabReport(
    query?: {
        id?: string
        clientId?: string
        item_id?: string
        status?: boolean
    } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetGnLabReport, getAPIHeaders('fg_group'), query)
}

export function AddGnLabReport(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.AddGnLabReport, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateGnLabReport(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.UpdateGnLabReport, getAPIHeaders('fg_group'), undefined, data)
}

