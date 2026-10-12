import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import { TimeUnit } from '../../constants/fwg.constants'
import * as FWGEndpoints from '../../constants/fwg_endpoints'

export function CreatePlanBundle(data: {
	plan_title: string
	plan_description?: string
	plan_type: 'PAID' | 'FREE'
	amount?: number
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreatePlanBundle, getAPIHeaders('fwg'), undefined, data)
}

export function UpdatePlanBundle(data: {
	id: string
	plan_title: string
	plan_description?: string
	plan_type: 'PAID' | 'FREE'
	amount?: number
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdatePlanBundle, getAPIHeaders('fwg'), undefined, data)
}

export function GetPlanBundle(query?: { id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetPlanBundle, getAPIHeaders('fwg'), query)
}

export function RemovePlanBundle(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemovePlanBundle, getAPIHeaders('fwg'), undefined, data)
}

export function AddPlanBundleItem(data: {
	plan_bundle_id: string
	feature_id: string
	duration: number
	timeUnit: TimeUnit
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AddPlanBundleItem, getAPIHeaders('fwg'), undefined, data)
}

export function RemovePlanBundleItem(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemovePlanBundleItem, getAPIHeaders('fwg'), undefined, data)
}

export function CreateMembershipPlan(data: {
	name: string
	duration_unit: TimeUnit
	duration: number
	price: number
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.CreateMembershipPlan, getAPIHeaders('fwg'), undefined, data)
}

export function UpdateMembershipPlan(data: {
	id: string
	name: string
	duration_unit: TimeUnit
	duration: number
	price: number
	plan_bundle_id?: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.UpdateMembershipPlan, getAPIHeaders('fwg'), undefined, data)
}

export function GetMembershipPlan(query?: { id?: string }): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetMembershipPlan, getAPIHeaders('fwg'), query)
}

export function RemoveMembershipPlan(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.RemoveMembershipPlan, getAPIHeaders('fwg'), undefined, data)
}

export function AssignMembershipPlan(data: {
	plan_id: string
	franchise_id: string
}): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.AssignMembershipPlan, getAPIHeaders('fwg'), undefined, data)
}

export function WithdrawAssignedMembershipPlan(data: { id: string }): Promise<FWG_APIResponse> {
	return APIPost(FWGEndpoints.WithdrawMembershipPlan, getAPIHeaders('fwg'), undefined, data)
}

export function GetAssignedMembershipPlan(query?: {
	franchise_id?: string
}): Promise<FWG_APIResponse> {
	return APIGet(FWGEndpoints.GetAssignedMembershipPlan, getAPIHeaders('fwg'), query)
}
