import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface StudentBatch {
    _id: string
    course_id: string
    batch_name: string
    batch_time: string
    batch_days: string[]
    batch_start_date: string
    batch_end_date: string
}

export function CreateStudentBatch(body: any): Promise<FGGroupAPIResponse> {
    return APIPost(
        FGGroupEndpoints.CreateStudentBatch,
        getAPIHeaders('fg_group'),
        undefined,
        body
    )
}

export function UpdateStudentBatch(body: any): Promise<FGGroupAPIResponse> {
    return APIPost(
        FGGroupEndpoints.UpdateStudentBatch,
        getAPIHeaders('fg_group'),
        undefined,
        body
    )
}

export function RemoveStudentBatch(body: { batch_id: string }): Promise<FGGroupAPIResponse> {
    return APIPost(
        FGGroupEndpoints.RemoveStudentBatch,
        getAPIHeaders('fg_group'),
        undefined,
        body
    )
}

export function GetStudentBatches(query?: { course_id?: string, search?: string, page?: number, limit?: number }): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetStudentBatches, getAPIHeaders('fg_group'), query)
}
