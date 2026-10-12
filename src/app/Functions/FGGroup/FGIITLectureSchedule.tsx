import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface FGIITLectureSchedule {
	_id: string
	batch_id?: string
	mentor_id?: string
	syllabus_id?: string
	lecture_name: string
	lecture_no?: number
	lecture_status?: 'pending' | 'complete'
	scheduled_date: string
	scheduled_time: string
	zoom_link?: string
	short_notes?: string
	pdf_url?: string
	is_reminder?: boolean
	status: boolean
	createdAt: string
	updatedAt: string
}

export interface CreateFGIITLectureScheduleParams {
	batch_id?: string
	mentor_id?: string
	syllabus_id?: string
	lecture_name: string
	lecture_no?: number
	lecture_status?: 'pending' | 'complete'
	scheduled_date: string
	scheduled_time: string
	zoom_link?: string
	short_notes?: string
	pdf_url?: string
}

export interface GetFGIITLectureScheduleParams {
	id?: string
	page?: number
	limit?: number
	search?: string
	status?: boolean
	sort?: string
	sortOrder?: string
	syllabus_id?: string
	batch_id?: string
}

export interface UpdateFGIITLectureScheduleParams {
	id: string
	batch_id?: string
	mentor_id?: string
	syllabus_id?: string
	lecture_name?: string
	lecture_no?: number
	lecture_status?: 'pending' | 'complete'
	scheduled_date?: string
	scheduled_time?: string
	zoom_link?: string
	short_notes?: string
	pdf_url?: string
	status?: boolean
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export const createFGIITLectureSchedule = async (
	data: CreateFGIITLectureScheduleParams
): Promise<FGGroupAPIResponse> => {
	return APIPost(
		FGGroupEndpoints.CreateFGIITLectureSchedule,
		getAPIHeaders('fg_group'),
		undefined,
		data
	)
}

export const getFGIITLectureSchedule = async (
	params?: GetFGIITLectureScheduleParams
): Promise<FGGroupAPIResponse> => {
	return APIGet(FGGroupEndpoints.GetFGIITLectureSchedule, getAPIHeaders('fg_group'), params)
}

export const updateFGIITLectureSchedule = async (
	data: UpdateFGIITLectureScheduleParams
): Promise<FGGroupAPIResponse> => {
	return APIPost(
		FGGroupEndpoints.UpdateFGIITLectureSchedule,
		getAPIHeaders('fg_group'),
		undefined,
		data
	)
}

export const removeFGIITLectureSchedule = async (
	lecture_id: string
): Promise<FGGroupAPIResponse> => {
	return APIPost(
		FGGroupEndpoints.RemoveFGIITLectureSchedule,
		getAPIHeaders('fg_group'),
		undefined,
		{ lecture_id }
	)
}

export const toggleFGIITLectureReminder = async (
	lecture_schedule_id: string,
	is_reminder: boolean
): Promise<FGGroupAPIResponse> => {
	return APIPost(
		FGGroupEndpoints.ToggleFGIITLectureReminder,
		getAPIHeaders('fg_group'),
		undefined,
		{ lecture_schedule_id, is_reminder }
	)
}
