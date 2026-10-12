import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetFGIITMatrixData(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFGIITMatrixData, getAPIHeaders('fg_group'))
}