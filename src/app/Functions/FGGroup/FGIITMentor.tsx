import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface Mentor {
    id: string
    name: string
    email: string
    phone: string
    department: string
    specialization: string
    profileImage?: string
    otherDocuments?: { name: string; url: string; file?: File }[]
    coursesAssigned?: number
}

export interface MentorResponse {
    _id: string
    mentorName: string
    email: string
    mobileNo: string
    department: string
    specialization: string;
    image?: string
    document?: string
}

export function CreateFGIITMentor(body: any): Promise<FGGroupAPIResponse> {
    return APIPost(
        FGGroupEndpoints.CreateFGIITMentor,
        getAPIHeaders('fg_group'),
        undefined,
        body
    )
}

export function UpdateFGIITMentor(body: any): Promise<FGGroupAPIResponse> {
    return APIPost(
        FGGroupEndpoints.UpdateFGIITMentor,
        getAPIHeaders('fg_group'),
        undefined,
        body
    )
}

export function RemoveFGIITMentor(mentor_id: string): Promise<FGGroupAPIResponse> {
    return APIPost(
        FGGroupEndpoints.RemoveFGIITMentor,
        getAPIHeaders('fg_group'),
        undefined,
        { mentor_id }
    )
}

export function GetFGIITMentors(query?: string): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetFGIITMentors, getAPIHeaders('fg_group'), { query })
}
