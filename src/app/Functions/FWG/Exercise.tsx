import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

// --- Exercise ---
export function AddExercise(data: {
	title: string
	video_url?: string
	image_url: string
	description?: string
	calories_burn?: number
	feedback_weight: boolean
	feedback_set: boolean
	feedback_reps: boolean
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddExercise, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateExercise(data: {
	id: string
	title: string
	video_url?: string
	image_url: string
	description?: string
	calories_burn?: number
	feedback_weight: boolean
	feedback_set: boolean
	feedback_reps: boolean
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateExercise, getAPIHeaders('fwg'), undefined, data)
}

export function GetExercise(
	query?: {
		id?: string
		createdById?: string | null
	} & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetExercise, getAPIHeaders('fwg'), query)
}

export function RemoveExercise(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveExercise, getAPIHeaders('fwg'), undefined, data)
}

// --- Exercise Plan ---
export function CreateExercisePlan(data: {
	plan_name: string
	description?: string
	time_slot: string
	live_meeting_link: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateExercisePlan, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateExercisePlan(data: {
	plan_id: string
	plan_name: string
	description?: string
	time_slot?: string
	live_meeting_link?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateExercisePlan, getAPIHeaders('fwg'), undefined, data)
}

export function GetExercisePlan(
	query?: {
		id?: string
		createdById?: string | null
		user_id?: string | null
	} & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetExercisePlan, getAPIHeaders('fwg'), query)
}

export function RemoveExercisePlan(data: { plan_id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveExercisePlan, getAPIHeaders('fwg'), undefined, data)
}

export function AddExerciseBundle(data: {
	exercise_bundle_id: string
	exercise_plan_id: string
	day: WeekdaysValue
	time: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddExerciseBundle, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveExercisePlanBundle(data: { plan_item_id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveExercisePlanBundle, getAPIHeaders('fwg'), undefined, data)
}

export function AssignExercisePlan(data: {
	exercise_plan_id: string
	users: string[]
	live_meeting_time: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AssignExercisePlan, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateAssignedExercisePlan(data: {
	assigned_exercise_plan_id: string
	live_meeting_time?: string
	start_date?: string
	is_active?: boolean
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateAssignedExercisePlan, getAPIHeaders('fwg'), undefined, data)
}

export function WithdrawExercisePlan(data: { plan_assign_id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.WithdrawExercisePlan, getAPIHeaders('fwg'), undefined, data)
}

// --- Exercise Bundle ---
export function CreateExerciseBundle(data: {
	title: string
	description?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateExerciseBundle, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateExerciseBundle(data: {
	id: string
	title: string
	description?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateExerciseBundle, getAPIHeaders('fwg'), undefined, data)
}

export function GetExerciseBundle(
	query?: { id?: string } & FWGSearchOptions & FWGPaginationOptions & FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetExerciseBundle, getAPIHeaders('fwg'), query)
}

export function RemoveExerciseBundle(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveExerciseBundle, getAPIHeaders('fwg'), undefined, data)
}

export function AddExerciseBundleItem(data: {
	exercise_bundle_id: string
	exercise_id: string
	day: WeekdaysValue
	reps?: number
	set?: number
	rest_time?: number
	dropSet?: 'YES' | 'NO'
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddExerciseBundleItem, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveExerciseBundleItem(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveExerciseBundleItem, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateExerciseBundleItem(data: {
	id: string
	reps?: number
	set?: number
	rest_time?: number
	dropSet?: 'YES' | 'NO'
	time?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateExerciseBundleItem, getAPIHeaders('fwg'), undefined, data)
}
