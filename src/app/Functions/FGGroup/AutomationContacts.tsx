import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

// Automation Contacts

export function GetAutomationContacts(
	query?: {
		contact_id?: string
		brand_id?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAutomationContact, getAPIHeaders('fg_group'), query)
}

export function CreateAutomationContact(body: {
	full_name: string
	email: string
	country_code: string
	phone_number: number
	brand_id: string
	group_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateAutomationContact,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function BulkCreateAutomationContact(body: {
	contacts: Array<{
		full_name: string
		email: string
		country_code: string
		phone_number: string
		brand_id: string
	}>
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.BulkCreateAutomationContact,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateAutomationContact(body: {
	contact_id: string
	full_name?: string
	email?: string
	country_code?: string
	phone_number?: number
	brand_id?: string
	group_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateAutomationContact, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveAutomationContact(body: {
	contact_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveAutomationContact, getAPIHeaders('fg_group'), undefined, body)
}

// Automation Contacts Groups

export function GetAutomationContactGroups(
	query?: {
		group_id?: string
		brand_id?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAutomationContactGroup, getAPIHeaders('fg_group'), query)
}

export function CreateAutomationContactGroup(body: {
	group_name: string
	brand_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateAutomationContactGroup, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateAutomationContactGroup(body: {
	group_id: string
	group_name?: string
	brand_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateAutomationContactGroup, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveAutomationContactGroup(body: {
	group_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveAutomationContactGroup, getAPIHeaders('fg_group'), undefined, body)
}

// Automation Brands

export function GetAutomationBrands(
	query?: {
		brand_id?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAutomationBrand, getAPIHeaders('fg_group'), query)
}

export function CreateAutomationBrand(body: {
	brand_name: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateAutomationBrand, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateAutomationBrand(body: {
	brand_id: string
	brand_name?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateAutomationBrand, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveAutomationBrand(body: {
	brand_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveAutomationBrand, getAPIHeaders('fg_group'), undefined, body)
}