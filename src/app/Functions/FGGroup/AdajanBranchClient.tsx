import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost, APIPut } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function GetNextCode(): Promise<FGGroupAPIResponse> {
    return APIGet(
        FGGroupEndpoints.GetNextCode,
        getAPIHeaders('fg_group')
    )
}

export function GetAdajanBranchClient(
    query?: { 
        id?: string
        status?: boolean
    } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetAdajanBranchClient, getAPIHeaders('fg_group'), query)
}


export function RemoveAdajanBranchClient(client_id: string): Promise<FGGroupAPIResponse> {
    return APIPost(
        FGGroupEndpoints.RemoveAdajanBranchClient,
        getAPIHeaders('fg_group'),
        undefined,
        { client_id }
    )
}

export function CreateAdajanBranchClient(body: {
	name?: string
	phone?: string
	email?: string
	image?: string
	bloodGroup?: string
	client_address?: {
		address_line_1?: string
		city?: string
		state?: string
		pin_code?: string
		country?: string
	}
	joiningDate?: string
	expiryDate?: string
	workoutTime?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateAdajanBranchClient, // Add this endpoint
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateAdajanBranchClient(body: {
    id?: string
	name?: string
	phone?: string
	email?: string
	image?: string
	bloodGroup?: string
	client_address?: {
		address_line_1?: string
		city?: string
		state?: string
		pin_code?: string
		country?: string
	}
	joiningDate?: string
	expiryDate?: string
	workoutTime?: string
    assignedTrainer?: string | null
    timeSlot?: string | null
    timeSlotId?: string | null
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateAdajanBranchClient, 
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function AssignAdajanBranchTrainer(body: {
    clientId: string
    trainerId: string
    timeSlotId: string
    timeSlot: string
}): Promise<FGGroupAPIResponse> {
    return APIPost(
        FGGroupEndpoints.AssignAdajanBranchTrainer,
        getAPIHeaders('fg_group'),
        undefined,
        body
    )
}

export function RenewAdajanBranchClient(body: {
	id: string
	joiningDate: string
	expiryDate: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.RenewAdajanBranchClient,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}