import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost, APIPut } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'


export function GetGnLabelDesignApprove(
    query?: { id?: string; common_id?: string; clientId?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetGnLabelDesignApprove, getAPIHeaders('fg_group'), query)
}

export function CreateGnLabelDesignApprove(
    data: {
        common_id: string
        item_id: string
        brandName: string
        final_approval_by: string
        issueDate?: string
        final_approval_by_client?: boolean
        final_approval_image?: string
        label_preview_image?: string
        remarks?: string
        checklist?: Array<{ details: string; checkedBy: boolean; verifiedBy: boolean }>
    }
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.CreateGnLabelDesignApprove, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateGnLabelDesignApprove(
    data: {
        id: string
        brandName?: string
        issueDate?: string
        final_approval_by?: string
        final_approval_by_client?: boolean
        final_approval_image?: string
        label_preview_image?: string
        remarks?: string
        checklist?: Array<{ details: string; checkedBy: boolean; verifiedBy: boolean }>
    }
): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.UpdateGnLabelDesignApprove, getAPIHeaders('fg_group'), undefined, data)
}