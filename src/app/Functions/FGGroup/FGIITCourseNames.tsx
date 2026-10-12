import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface FGIITCourseName {
  _id: string
  lectureName: string
  createdAt: string
  updatedAt: string
  updatedBy: string
  createdBy: string
  isDeleted: boolean
}

export interface GetFGIITCourseNamesResponse {
  status: number
  message: string
  data: FGIITCourseName[]
  metadata?: {
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    search_fields: string[]
  }
}

export interface CreateFGIITCourseNameRequest {
  lectureName: string
}

export interface CreateFGIITCourseNameResponse {
  status: number
  message: string
  data: FGIITCourseName
}

// Get all FGIIT course names
export async function getFGIITCourseNames(
  query?: { 
    course_id?: string,
    search?: string, 
    page?: number, 
    limit?: number, 
    sort?: string, 
    sortOrder?: 'asc' | 'desc' 
  }
): Promise<GetFGIITCourseNamesResponse> {
  const response = await APIGet(FGGroupEndpoints.GetFGIITCourseNames, getAPIHeaders('fg_group'), query);
  return response as GetFGIITCourseNamesResponse;
}

// Create a new FGIIT course name
export async function createFGIITCourseName(
  data: CreateFGIITCourseNameRequest
): Promise<CreateFGIITCourseNameResponse> {
  const response = await APIPost(FGGroupEndpoints.CreateFGIITCourseName, getAPIHeaders('fg_group'), undefined, data);
  return response as CreateFGIITCourseNameResponse;
}

// Update a FGIIT course name
export async function updateFGIITCourseName(
  data: { id: string } & CreateFGIITCourseNameRequest
): Promise<any> {
  const response = await APIPost(FGGroupEndpoints.UpdateFGIITCourseName, getAPIHeaders('fg_group'), undefined, data);
  return response;
}

// Remove a FGIIT course name
export async function removeFGIITCourseName(
  id: string
): Promise<any> {
  const response = await APIPost(FGGroupEndpoints.RemoveFGIITCourseName, getAPIHeaders('fg_group'), undefined, { id });
  return response;
}
