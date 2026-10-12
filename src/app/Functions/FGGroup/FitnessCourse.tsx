import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPatch, APIPost } from '../../../_metronic/helpers/Utils'
import { StudentBatchTimeTableType, TimeUnit } from '../../constants/fg_group.constants'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateFitnessCourse(body: {
	course_name: string
	amount: number
	currency: string
	coaching_mode: 'VIRTUAL' | 'PHYSICAL'
	duration: number
	course_category: FitnessCourseType
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateFitnessCourse, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateFitnessCourse(body: {
	id: string
	amount?: number
	currency?: string
	course_name?: string
	course_category?: FitnessCourseType
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateFitnessCourse, getAPIHeaders('fg_group'), undefined, body)
}
export type MaterialItem = {
	_id?: string
	title?: string
	description?: string
	file_url?: string
	thumbnail?: string
	language?: string[]
};
export function CreateMaterialOfFitnessCourse(body: {
	course_id: string
	material: MaterialItem[];
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateMaterialOfFitnessCourse, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateMaterialOfFitnessCourse(body: {
	course_id: string
	material_id: string
	title: string
	description: string
	file_url: string
	thumbnail?: string
	language: string[]
}): Promise<FGGroupAPIResponse> {
	return APIPatch(
		FGGroupEndpoints.UpdateMaterialOfFitnessCourse,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function DeleteMaterialOfFitnessCourse(course_id: string, material_id: string): Promise<FGGroupAPIResponse> {
	const fullUrl = `${FGGroupEndpoints.DeleteMaterialOfFitnessCourse}?course_id=${course_id}&material_id=${material_id}`;
	return APIDelete(fullUrl, getAPIHeaders('fg_group'));
}



export function RemoveFitnessCourse(body: { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveFitnessCourse, getAPIHeaders('fg_group'), undefined, body)
}

export function GetFitnessCourse(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFitnessCourse, getAPIHeaders('fg_group'), query)
}

// --- Fitness Course Lectures ---

export function AddLecture(body: {
	related_courses: string[]
	title: string
	video_url?: string
	pdf_files?: string
	description?: string
	lecture_index: number
	thumbnail_image?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.AddFitnessCourseLecture,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateLecture(body: {
	lecture_id: string
	related_courses?: string[]
	title?: string
	video_url?: string
	pdf_files?: string
	description?: string
	thumbnail_image?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateFitnessCourseLecture,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function DeleteLecture(body: { lecture_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.RemoveFitnessCourseLecture,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetLecture(
	query?: {
		lecture_id?: string
		course_id?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFitnessCourseLectures, getAPIHeaders('fg_group'), query)
}

// --- Fitness Course Exam ---

export function CreateExam(body: {
	title: string
	description?: string
	exam_language: 'English' | 'Hindi'
	exam_course?: string[]
	duration?: number
	delay_allowed?: number
	shuffle_questions?: boolean
	shuffle_options?: boolean
	can_start_anytime?: boolean
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateFitnessCourseExam,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateExam(body: {
	exam_id: string
	title?: string
	description?: string
	exam_language?: 'English' | 'Hindi'
	exam_course?: string[]
	duration?: number
	delay_allowed?: number
	shuffle_questions?: boolean
	shuffle_options?: boolean
	can_start_anytime?: boolean
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateFitnessCourseExam,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetExam(
	query?: { exam_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFitnessCourseExam, getAPIHeaders('fg_group'), query)
}

export function GetResultExam(
	query?: {
		user_id?: string
		exam_id?: string
		allocation_id?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFitnessCourseResultExam, getAPIHeaders('fg_group'), query)
}

export function DeleteExam(body: { exam_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.RemoveFitnessCourseExam,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateQuestion(body: {
	exam_id: string
	questions: {
		_id?: string
		question_index: number
		type: string
		question: string
		options: [{ _id?: string; option: string; is_correct: boolean }]
	}[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateFCEQuestion, getAPIHeaders('fg_group'), undefined, body)
}

export function DeleteQuestion(body: {
	exam_id: string
	question_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateFCEQuestion, getAPIHeaders('fg_group'), undefined, body)
}

export function AllocateExam(body: {
	exam_id: string
	attendees: { user_id: string; start_time: Date }[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.FCEAllocate, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateAllocation(body: {
	exam_id: string
	attendees: { _id: string; start_time: Date }
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateFCEAllocation, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveAllocation(body: {
	exam_id: string
	allocation_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveFCEAllocation, getAPIHeaders('fg_group'), undefined, body)
}

export function GetAllocation(
	query?: { exam_id?: string; search_user?: string } & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFCEAllocations, getAPIHeaders('fg_group'), query)
}

export function GetResult(
	query?: {
		exam_id?: string
		user_id?: string
		allocation_id?: string
	} & FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFCEResults, getAPIHeaders('fg_group'), query)
}

// --- Fitness Course Feedback ---
export function GetFeedback(
	query?: { feedback_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFitnessCourseFeedback, getAPIHeaders('fg_group'), query)
}

export function UpdateFeedback(body: {
	feedback_id: string
	status: FeedbackStatusValue
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateFitnessCourseFeedback,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

// --- Projects ---
export function CreateProject(body: {
	course_id: string
	project_title: string
	project_files?: string[]
	project_description?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateProject, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateProject(body: {
	project_id: string
	course_id?: string
	project_title?: string
	project_files?: string[]
	project_description?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateProject, getAPIHeaders('fg_group'), undefined, body)
}

export function DeleteProject(query: { project_id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.RemoveProject, getAPIHeaders('fg_group'), query)
}

export function GetProjects(query?: { project_id?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetProjects, getAPIHeaders('fg_group'), query)
}

export function GetProjectSubmissions(
	query?: {
		project_id?: string
		user_id?: string
		project_submission_id?: string
	} & FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetProjectSubmission, getAPIHeaders('fg_group'), query)
}

export function GetProjectSubmissionsUserData(query?: {
	project_id?: string
	user_id?: string
	project_submission_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSubmission, getAPIHeaders('fg_group'), query)
}

export function UpdateProjectSubmission(body: {
	project_submission_id: string
	status: ProjectSubmissionStatusValue
	additional_note?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateProjectSubmission,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

// --- Fitness Course Scholarship Quiz ---
export function GetScholarshipResultsList(query?: {
	user_id?: string
	submission_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetScholarshipResults, getAPIHeaders('fg_group'), query)
}

export function GetScholarshipResult(query: {
	user_id: string
	submission_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetScholarshipResultByID, getAPIHeaders('fg_group'), query)
}

export function UpdateReadReceiptOfScholarship(body: {
	submission_id: string
	read_receipt: boolean
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateReadResultReceipt,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

// --- Fitness Course Student Batch ---
export function CreateBatch(body: {
	batch_name: string
	batch_start_date: string
	batch_end_date: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateStudentBatch, getAPIHeaders('fg_group'), undefined, body)
}

export function GetStudentBatches(
	query?: { batch_id?: string } & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetStudentBatches, getAPIHeaders('fg_group'), query)
}

export function UpdateStudentBatch(body: {
	batch_id: string
	batch_name?: string
	timetable?: StudentBatchTimeTableType
	users?: string[]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateStudentBatch, getAPIHeaders('fg_group'), undefined, body)
}

export function DeleteStudentBatch(query: { batch_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveStudentBatch, getAPIHeaders('fg_group'), query)
}

export function RemoveUserFromBatch(body: {
	batch_id: string
	student_user_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveBatchUser, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveTimetableFromBatch(body: {
	batch_id: string
	timetable_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveBatchTimetable, getAPIHeaders('fg_group'), undefined, body)
}

// --- Fitness Course Lecture Comment ---
/**
 *
 * @param query
 * @param query.lecture_id
 * @param query.page This will fetch lectures wise pagination, so limit will be the number of lectures per page.
 * @param query.limit
 * @param query.comment_wise If true, will return comments in a thread wise format. Use comment_wise_* options to control the thread wise comments
 * @param query.comment_wise_sort
 * @param query.comment_wise_sortOrder
 * @param query.comment_wise_page
 * @param query.comment_wise_limit
 * @param query.comment_wise_skip
 * @param query.comment_wise_is_replied_by_admin
 */
export function GetLectureComments(query?: {
	lecture_id?: string
	page?: number
	limit?: number
	comment_wise?: boolean
	comment_wise_sort?: string
	comment_wise_sortOrder?: 'asc' | 'desc'
	comment_wise_page?: number
	comment_wise_limit?: number
	comment_wise_skip?: number
	comment_wise_is_replied_by_admin?: boolean
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.FitnessCourseLectureComments, getAPIHeaders('fg_group'), query)
}

export function UpdateComment(body: {
	lecture_id: string
	comment_id: string
	reply_id?: string // replying to a comment thread
	comment: string
}): Promise<FGGroupAPIResponse> {
	return APIPatch(
		FGGroupEndpoints.FitnessCourseLectureComments,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function CreateComment(body: {
	lecture_id: string
	comment_id?: string // Parent Comment ID if replying to a comment
	comment: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.FitnessCourseLectureComments,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function DeleteComment(query: {
	lecture_id: string
	comment_id?: string
	reply_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIDelete(
		FGGroupEndpoints.FitnessCourseLectureComments,
		getAPIHeaders('fg_group'),
		query,
		undefined
	)
}

// --- User Fitness Course ---
export function GetUserFitnessCourses(
	query?: {
		user_id?: string
		user_fitness_course_id?: string
	} & FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetUserFitnessCourse, getAPIHeaders('fg_group'), query)
}

export function AssignFitnessCourse(body: {
	user_id: string
	course_id: string
	amount?: number
	paid_amount?: number
	currency?: 'USD' | 'INR'
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.AssignFitnessCourseToUser,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function DeactivateAssignedFitnessCourse(query: {
	user_fitness_course_id: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.DeactivateFitnessCourse, getAPIHeaders('fg_group'), query)
}

export function ExtendFitnessCourseValidity(body: {
	user_fitness_course_id: string
	duration: string
	time_unit: TimeUnit
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.ExtendFitnessCourseValidity,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function RemoveExtendedValidity(body: {
	user_fitness_course_extend_validity_id: string
}): Promise<FGGroupAPIResponse> {
	return APIDelete(
		FGGroupEndpoints.ExtendFitnessCourseValidity,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function GetStudentCourseReviews(query?: {
	user_id?: string
	course_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetFitnessCourseStudentReview, getAPIHeaders('fg_group'), query)
}

// --- User Fitness Course Certificate ---
export function CreateCertificate(
	body: FitnessCourseCertificateOptions
): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateFitnessCourseCertificate,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateFitnessCourseCertificate(body: {
	certificate_id: string
	file_url?: string
	certificate_data?: FitnessCourseCertificateOptions['certificate_data']
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateFitnessCourseCertificate,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function DeleteCertificate(query?: { certificate_id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(
		FGGroupEndpoints.DeleteFitnessCourseCertificate,
		getAPIHeaders('fg_group'),
		query
	)
}

export function GenerateCertificate(query: {
	certificate_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GenerateFitnessCourseCertificate, getAPIHeaders('fg_group'), query)
}

export function GenerateQRCertificate(query: {
	certificate_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(
		FGGroupEndpoints.GenerateFitnessCourseQRCertificate,
		getAPIHeaders('fg_group'),
		query
	)
}

export function verifyCertificate(query: { certificate_id: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.VerifyCertificate, getAPIHeaders('fg_group'), query)
}
