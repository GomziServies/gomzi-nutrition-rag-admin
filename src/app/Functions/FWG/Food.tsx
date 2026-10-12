import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost, APIPatch } from '../../../_metronic/helpers/Utils'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

// Food
export function AddFood(data: {
	food_name: string
	calories: number
	carbs: number
	protein: number
	fat: number
	quantity: number
	quantity_unit: number
	video_url: string
	thumbnail_url: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddFood, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateFood(data: {
	id: string
	food_name: string
	calories: number
	carbs: number
	protein: number
	fat: number
	quantity: number
	quantity_unit: string
	video_url: string
	thumbnail_url: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateFood, getAPIHeaders('fwg'), undefined, data)
}

export function GetFood(
	query?: { id?: string } & FWGSearchOptions & FWGPaginationOptions & FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetFood, getAPIHeaders('fwg'), query)
}

export function RemoveFood(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveFood, getAPIHeaders('fwg'), undefined, data)
}

// Food Time
export function AddFoodTime(data: { food_time: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddFoodTime, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateFoodTime(data: { id: string; food_time: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateFoodTime, getAPIHeaders('fwg'), undefined, data)
}

export function GetFoodTime(): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetFoodTime, getAPIHeaders('fwg'))
}

export function RemoveFoodTime(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveFoodTime, getAPIHeaders('fwg'), undefined, data)
}

// Food Category
export function AddFoodCategory(data: { category: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddFoodCategory, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateFoodCategory(data: {
	id: string
	category: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateFoodCategory, getAPIHeaders('fwg'), undefined, data)
}

export function GetFoodCategory(): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetFoodCategory, getAPIHeaders('fwg'))
}

export function RemoveFoodCategory(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveFoodCategory, getAPIHeaders('fwg'), undefined, data)
}

// Food Bundle
export function AddFoodBundle(data: {
	bundle_name: string
	food_category_id: string
	food_time_id: string
	video_url: string
	thumbnail_url: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddFoodBundle, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateFoodBundle(data: {
	id: string
	bundle_name: string
	food_category_id: string
	food_time_id: string
	video_url: string
	thumbnail_url: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateFoodBundle, getAPIHeaders('fwg'), undefined, data)
}

export function GetFoodBundle(
	query?: { id?: string; food_time_id?: string } & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetFoodBundle, getAPIHeaders('fwg'), query)
}

export function RemoveFoodBundle(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveFoodBundle, getAPIHeaders('fwg'), undefined, data)
}

export function AddFoodBundleItem(data: {
	bundle_id: string
	food_id: string
	quantity?: number
	quantity_unit?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddFoodBundleItem, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveFoodBundleItem(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveFoodBundleItem, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateFoodBundleItem(data: {
	id: string
	bundle_id: string
	food_id: string
	quantity?: number
	quantity_unit?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateFoodBundleItem, getAPIHeaders('fwg'), undefined, data)
}

// Diet Plan
export function CreateDietPlan(data: {
	plan_name: string
	category_id: string
	days: number
	previous_diet_id?: string
	food_type: FoodTypeValue
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateDietPlan, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateDietPlan(data: {
	diet_id: string
	plan_name: string
	category_id: string
	days: number
	previous_diet_id?: string
	food_type: FoodTypeValue
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateDietPlan, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateDietPlanSortIndex(data: Array<{
	diet_id: string
	diet_item_id: string
	sort_index: number
}>): Promise<FWG_APIResponse> {
	return APIPatch(FWGEndpoints.UpdateDietPlanSortIndex, getAPIHeaders('fwg'), undefined, data)
}

export function GetDietPlan(
	query?: { id?: string; createdById?: string | null; user_id?: string | null } & FWGSearchOptions &
		FWGPaginationOptions &
		FWGSortOptions
): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetDietPlan, getAPIHeaders('fwg'), query)
}

export function RemoveDietPlan(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveDietPlan, getAPIHeaders('fwg'), undefined, data)
}

export function AddDietPlanItem(data: {
	diet_id: string
	food_bundle_id: string
	time: number
	food_time_id: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddDietPlanItem, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateDietPlanItem(data: {
	diet_plan_item_id: string
	food_bundle_id: string
	food_time_id: string
	time: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateDietPlanItem, getAPIHeaders('fwg'), undefined, data)
}

export function RemoveDietPlanItem(data: { diet_plan_item_id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveDietPlanItem, getAPIHeaders('fwg'), undefined, data)
}

export function AssignDietPlan(data: {
	diet_id: string
	users: string[]
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AssignDietPlan, getAPIHeaders('fwg'), undefined, data)
}

export function WithdrawDietPlan(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.WithdrawDietPlan, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateAssignedDietPlan(data: {
	diet_assigned_id: string
	status: boolean
	start_date: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateAssignedDietPlan, getAPIHeaders('fwg'), undefined, data)
}

export function GetFoodBundleInfo(id: string): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetFoodBundle, getAPIHeaders('fwg'), { id })
}
