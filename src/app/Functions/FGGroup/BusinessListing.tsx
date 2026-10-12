import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPatch, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function AddListing(body?: {
	business_type?: string
	business_name?: string
	description?: string
	business_category?: [string]
	business_logo?: string
	business_images?: [string]
	services?: [string]
	tags?: [string]
	social_media?: [
		{
			social_media_type: string
			link: string
		}
	]
	locations?: [
		{
			location_name: string
			address_line_1: string
			address_line_2: string
			city: string
			state: string
			country: string
			pin_code: string
			landmark: string
			direction_link: string
			contact: {
				contact_type: string
				value: string
			}
		}
	]
	contacts?: [
		{
			contact_type: string
			value: string
		}
	]
	faqs?: [
		{
			question: string
			answer: string
			additional_links: [string]
		}
	]
	timings?: [
		{
			title: string
			timings: [
				{
					from_time: string
					to_time: string
				}
			]
		}
	]
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.AddListing, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateListing(body?: {
	listing_id?: string
	owner_id?: string
	business_type?: string
	business_name?: string
	description?: string
	business_category?: [string]
	business_logo?: string
	business_images?: [string]
	services?: [string]
	tags?: [string]
	social_media?: [
		{
			social_media_type: string
			link: string
		}
	]
	locations?: [
		{
			location_name: string
			address_line_1: string
			address_line_2: string
			city: string
			state: string
			country: string
			pin_code: string
			landmark: string
			direction_link: string
			contact: {
				contact_type: string
				value: string
			}
		}
	]
	contacts?: [
		{
			contact_type: string
			value: string
		}
	]
	faqs?: [
		{
			question: string
			answer: string
			additional_links: [string]
		}
	]
	timings?: [
		{
			title: string
			timings: [
				{
					from_time: string
					to_time: string
				}
			]
		}
	]
}): Promise<FGGroupAPIResponse> {
	return APIPatch(FGGroupEndpoints.UpdateListing, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveListing(query: { listing_id: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.RemoveListing, getAPIHeaders('fg_group'), undefined, query)
}

export function GetListingForAdmin(
	query?: {
		listing_id?: string
		page?: number
		limit?: number
		approval_status?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAdminBusinessListing, getAPIHeaders('fg_group'), query)
}

export function GetBusinessListing(
	query?: {
		listing_id?: string
		page?: number
		limit?: number
		approval_status?: string
	} & FGGroupSearchOptions &
		FGGroupPaginationOptions &
		FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetBusinessListing, getAPIHeaders('fg_group'), query)
}

export function ListingAction(body: {
	listing_id: string
	approval_status: string
	comment?: string
}): Promise<FGGroupAPIResponse> {
	return APIPatch(FGGroupEndpoints.ListingAction, getAPIHeaders('fg_group'), undefined, body)
}
