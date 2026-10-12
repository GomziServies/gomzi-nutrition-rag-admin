import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface FGIITCourseSyllabus {
  _id: string
  courseId: string | { _id: string; lectureName: string }
  classNumber: number
  chapterName: string
  pdfFileName?: string
  pdfUrl?: string
  createdAt: string
  updatedAt: string
  updatedBy: string
  createdBy: string
  isDeleted: boolean
}

export interface GetFGIITCourseSyllabusResponse {
  status: number
  message: string
  data: FGIITCourseSyllabus[]
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

export interface CreateFGIITCourseSyllabusRequest {
  courseId: string
  classNumber: number
  chapterName: string
  pdfFileName?: string
  pdfUrl?: string
}

export interface CreateFGIITCourseSyllabusResponse {
  status: number
  message: string
  data: FGIITCourseSyllabus
}

export interface UpdateFGIITCourseSyllabusRequest {
  id: string
  classNumber?: number
  chapterName?: string
  pdfFileName?: string
  pdfUrl?: string
}

// Get all FGIIT course syllabus entries
export async function getFGIITCourseSyllabus(
  query?: { 
    courseId?: string
    search?: string
    page?: number
    limit?: number
    sort?: string
    sortOrder?: 'asc' | 'desc' 
  }
): Promise<GetFGIITCourseSyllabusResponse> {
  const response = await APIGet(FGGroupEndpoints.GetFGIITCourseSyllabus, getAPIHeaders('fg_group'), query);
  return response as GetFGIITCourseSyllabusResponse;
}

// Create a new FGIIT course syllabus entry
export async function createFGIITCourseSyllabus(
  data: CreateFGIITCourseSyllabusRequest
): Promise<CreateFGIITCourseSyllabusResponse> {
  // Extract courseId and pass it as query parameter
  const { courseId, ...bodyData } = data;
  const response = await APIPost(
    FGGroupEndpoints.CreateFGIITCourseSyllabus, 
    getAPIHeaders('fg_group'), 
    { courseId }, // Pass courseId as query parameter
    bodyData // Pass remaining data in body
  );
  return response as CreateFGIITCourseSyllabusResponse;
}

// Update a FGIIT course syllabus entry
export async function updateFGIITCourseSyllabus(
  data: UpdateFGIITCourseSyllabusRequest,
  courseId?: string
): Promise<any> {
  const queryParams = courseId ? { courseId } : undefined;
  const response = await APIPost(FGGroupEndpoints.UpdateFGIITCourseSyllabus, getAPIHeaders('fg_group'), queryParams, data);
  return response;
}

// Remove a FGIIT course syllabus entry
export async function removeFGIITCourseSyllabus(
  id: string,
  courseId?: string
): Promise<any> {
  const queryParams = courseId ? { courseId } : undefined;
  const response = await APIPost(FGGroupEndpoints.RemoveFGIITCourseSyllabus, getAPIHeaders('fg_group'), queryParams, { id });
  return response;
}
