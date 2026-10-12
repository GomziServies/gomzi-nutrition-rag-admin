import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface LectureReminderCreatePayload {
	mentor_id: string
	lecture_topic: string
	lecture_pdf?: string | null
	lecture_date: string
	lecture_start_time: string
	is_reminder_6am?: boolean
	is_reminder_1hour_before?: boolean
    course_id?: string
    batch_id?: string
    class_number?: number
    lecture_description?: string
    zoom_meeting_link?: string
}

export interface LectureReminderUpdatePayload {
	reminder_id: string
	mentor_id?: string
	lecture_topic?: string
	lecture_pdf?: string | null
	lecture_date?: string
	lecture_start_time?: string
	is_reminder_6am?: boolean
	is_reminder_1hour_before?: boolean
    course_id?: string
    batch_id?: string
    class_number?: number
    lecture_description?: string
    zoom_meeting_link?: string
}

export interface LectureReminderDeletePayload {
	reminder_id: string
}

export interface LectureReminderGetOptions {
	reminder_id?: string
	mentor_id?: string
	search?: string
	page?: number
	limit?: number
	sort?: string
	sortOrder?: 'asc' | 'desc'
	dateFrom?: string
	dateTo?: string
}

export function AddLectureReminder(body: LectureReminderCreatePayload): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.AddLectureReminder,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateLectureReminder(body: LectureReminderUpdatePayload): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateLectureReminder,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function DeleteLectureReminder(body: LectureReminderDeletePayload): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.DeleteLectureReminder,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetLectureReminder(query?: LectureReminderGetOptions): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetLectureReminder, getAPIHeaders('fg_group'), query)
}