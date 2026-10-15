import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetGnSampleBooking(
    query?: {
        id?: string
        status?: boolean
        start_date?: string | Date
        end_date?: string | Date
    } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetGnSampleBooking, getAPIHeaders('fg_group'), query)
}

export function AddGnSampleBooking(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.AddGnSampleBooking, getAPIHeaders('fg_group'), undefined, data)
}
export function UpdateGnSampleBooking(
    data: any
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.UpdateGnSampleBooking, getAPIHeaders('fg_group'), undefined, data)
}

export function RemoveGnSampleBooking(
    query?: {
        id?: string
    }
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.RemoveGnSampleBooking, getAPIHeaders('fg_group'), query)
}
