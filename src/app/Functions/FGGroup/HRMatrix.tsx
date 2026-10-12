import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetHRMatrixData(query?: { 
    month?: string
    year?: string
}): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetHRMatrixData, getAPIHeaders('fg_group'), query)
}

export function GetHRMatrixDataRaw(query?: { 
    month?: string
    year?: string
}): Promise<any> {
    return APIGet(FGGroupEndpoints.GetHRMatrixData, getAPIHeaders('fg_group'), query)
}