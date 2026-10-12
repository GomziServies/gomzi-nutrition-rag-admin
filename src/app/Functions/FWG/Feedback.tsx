import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function addFeedback(data: { message: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddFeedback, getAPIHeaders('fwg'), undefined, data)
}
