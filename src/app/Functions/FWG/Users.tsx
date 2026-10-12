import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPatch, APIPost } from '../../../_metronic/helpers/Utils'
import { Gender } from '../../constants/fwg.constants'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function GetUserHeight(query?: { user_id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.UserGetHeight, getAPIHeaders('fwg'), query)
}

export function UpdateUserHeight(data: {
	height: number
	user_id: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UserUpdateHeight, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveUserHeight(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UserRemoveHeight, getAPIHeaders('fwg'), undefined, data)
}

export function GetUserWeight(query?: { user_id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.UserGetWeight, getAPIHeaders('fwg'), query)
}

export function UpdateUserWeight(data: {
	weight: number
	user_id: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UserUpdateWeight, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveUserWeight(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UserRemoveWeight, getAPIHeaders('fwg'), undefined, data)
}

export function GetUserWaterCount(query?: {
	user_id?: string
	all: boolean
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUserWaterCount, getAPIHeaders('fwg'), query)
}

export function CreateUser(data: {
	firstName: string
	lastName: string
	email?: string
	password?: string
	mobile?: string
	profile_image?: string
	gender?: string
	birthdate?: string // YYYY/MM/DD
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateUser, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveUser(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveUser, getAPIHeaders('fwg'), undefined, data)
}

export function DeactivateUser(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.DeactivateUser, getAPIHeaders('fwg'), undefined, data)
}

export function ActivateUser(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.ActivateUser, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateUser(data: {
	id: string
	first_name?: string
	last_name?: string
	email?: string
	mobile?: string
	profile_image?: string
	birth_date?: string
	gender?: string
	goal_title?: GoalTypeValue
	workout_start?: string
	workout_end?: string
	sleep_start?: string
	sleep_end?: string
	typicalDay?: string
	medical_condition?: string
	physical_activity?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateUser, getAPIHeaders('fwg'), undefined, data)
}

export function GetUser(
	query?: {
		id?: string
	} & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUser, getAPIHeaders('fwg'), query)
}

export function ChangeUserPassword(data: {
	id: string
	password: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.ChangeUserPassword, getAPIHeaders('fwg'), undefined, data)
}

export function UnlockUser(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UnlockUser, getAPIHeaders('fwg'), undefined, data)
}

export function GetUserDietFeedback(query?: {
	user_id?: string
	from_date?: string
	to_date?: string
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUserDietFeedback, getAPIHeaders('fwg'), query)
}

export function GetUserDietFeedbackStats(query?: { user_id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUserDietFeedbackStats, getAPIHeaders('fwg'), query)
}

export function UserAssignFeature(data: {
	user_id: string
	feature_id: string
	timeUnit: string
	duration: string
	note?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddUserAssignFeature, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateUserAssignFeature(data: {
	user_assign_id: string
	status: string
	end_time?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateUserAssignFeature, getAPIHeaders('fwg'), undefined, data)
}

export function GetUserAssignFeature(
	query?: {
		user_id?: string
		id?: string
		order_status?: [string]
	} & FWGSortOptions &
		FWGPaginationOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUserAssignFeature, getAPIHeaders('fwg'), query)
}

export function AssignFranchise(data: {
	user_id: string
	franchise_assign_plan_id: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AssignFranchise, getAPIHeaders('fwg'), undefined, data)
}

export function WithdrawFranchise(data: {
	user_assign_franchise_id: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.WithdrawFranchise, getAPIHeaders('fwg'), undefined, data)
}

export function GetAssignFranchise(): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetAssignFranchise, getAPIHeaders('fwg'))
}

export function GetUserExerciseFeedback(query?: {
	user_id?: string
	from_date?: string
	to_date?: string
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUserExerciseFeedback, getAPIHeaders('fwg'), query)
}

export function GetUserExerciseFeedbackStats(query?: {
	user_id?: string
	date?: string
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUserExerciseFeedbackStats, getAPIHeaders('fwg'), query)
}

export function GetUserExerciseFeedbackStatsState(query?: {
	user_id?: string
	date?: string
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUserExerciseFeedbackStatsState, getAPIHeaders('fwg'), query)
}

export function AssignUserPlan(data: {
	user_id: string
	plan_bundle_id: string
	note?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AssignUserPlan, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveUserAssignPlan(data: { order_id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveUserAssignPlan, getAPIHeaders('fwg'), undefined, data)
}

export function GetUserSelectedFood(query?: { user_id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetUserSelectedFood, getAPIHeaders('fwg'), query)
}

export function GetAssignUserPlan(query?: { user_id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetAssignUserPlan, getAPIHeaders('fwg'), query)
}

export function AddUserSelectedFood(data: {
	user_id: string
	food_type: FoodTypeValue
	protein: [string]
	fat: [string]
	carbohydrate: [string]
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddUserSelectedFood, getAPIHeaders('fwg'), undefined, data)
}

type BodyCompositionAnalysis =
	| { _id?: string; metric?: string; sub_category?: string; value?: string }
	| { _id: string; metric?: string; sub_category?: string; value?: string; delete: boolean }

type BloodSugarTracking =
	| { _id?: string; metric?: string; sub_category?: string; value?: string }
	| { _id: string; metric?: string; sub_category?: string; value?: string; delete: boolean }

type BodyCompositionHistory =
	| {
			_id?: string
			food_preferences?: string
			unhealthy_habits?: string[]
			stress_and_tension?: string[]
			sugar_intake?: boolean
			salt_intake?: boolean
			running_medicine?: string[]
			systolic_blood_pressure?: string
			diastolic_blood_pressure?: string
			working_hours?: number
			sleeping_hours?: number
	  }
	| {
			_id: string
			food_preference?: string
			unhealthy_habits?: string[]
			stress_and_tension?: string[]
			sugar_intake?: boolean
			salt_intake?: boolean
			running_medicine?: string[]
			systolic_blood_pressure?: string
			diastolic_blood_pressure?: string
			working_hours?: number
			sleeping_hours?: number
			delete: boolean
	  }

type Pulses = {
	category?: string
	value?: string
}

type UserIdentifier = { user_id: string } | { first_name?: string; last_name?: string }

type BodyAnalysis = UserIdentifier & {
	age?: number
	gender?: Gender
	test_time?: Date
	weight?: number
	skeletal_muscle_mass?: number
	ideal_body_weight?: number
	body_mass_index?: number
	percent_body_fat?: number
	muscle_in_arms?: number
	muscle_in_legs?: number
	muscle_in_trunk?: number
	fat_in_arms?: number
	fat_in_legs?: number
	fat_in_trunk?: number
	medical_condition?: string[]
	food_allergies?: string[]
	previous_injuries?: string[]
	food_preferences?: string[]
	body_composition_analysis?: BodyCompositionAnalysis[]
	pulses?: Pulses
	blood_sugar_tracking?: BloodSugarTracking[]
	body_composition_history?: BodyCompositionHistory[]
}

// First name
// Last Name
// Test Date

export function BodyAnalysis(data: BodyAnalysis): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.BodyAnalysis, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateBodyAnalysis(
	analysis_id: string,
	data: BodyAnalysis
): Promise<FWG_APIResponse> {
	const endpoint: string = FWGEndpoints.BodyAnalysis + '/' + analysis_id
	return APIPatch(endpoint, getAPIHeaders('fwg'), undefined, data)
}

export function DeleteBodyAnalysis(analysis_id: string): Promise<FWG_APIResponse> {
	const endpoint: string = FWGEndpoints.BodyAnalysis + '/' + analysis_id
	return APIDelete(endpoint, getAPIHeaders('fwg'))
}

export function GetBodyAnalysis(
	query?: { user_id?: string; analysis_id?: string } & FWGPaginationOptions & FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.BodyAnalysis, getAPIHeaders('fwg'), query)
}

