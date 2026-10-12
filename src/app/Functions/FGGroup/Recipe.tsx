import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetRecipes(query?: { user_id?: string; id?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetRecipes, getAPIHeaders('fg_group'), query)
}
