import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost, APIPut } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetGnClient(
    query?: { 
        id?: string
        start_date?: string
        end_date?: string
        status?: boolean
    } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetGnClient, getAPIHeaders('fg_group'), query)
}


export function UpdateLabelStatus(
    data: {
        clientId: string
        is_outsourced: boolean
    }
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.UpdateLabelStatus, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateLabReportStatus(
    data: {
        clientId: string
        is_skipped: boolean
    }
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.UpdateLabReportStatus, getAPIHeaders('fg_group'), undefined, data)
}