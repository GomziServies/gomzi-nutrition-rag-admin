import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateGlsEmployee(body: {
	employee_code: string
	name: string
	position: string
	salary: number
	account_details: {
		bank_name: string
		account_number: string
		IFSC: string
	}
	mobile: string
	address: string
	photo: string
	proof: string
	blood_group: string
	in_time: string
	out_time: string
	joining_date?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateGlsEmployee, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateGlsEmployee(body: {
	id: string
	employee_code?: string
	name?: string
	mobile?: string
	position?: string
	salary?: number
	account_details?: {
		bank_name: string
		account_number: string
		IFSC: string
	}
	address?: string
	photo?: string
	proof?: string
	blood_group?: string
	in_time?: string
	out_time?: string
	joining_date?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateGlsEmployee, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveGlsEmployee(body: { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveGlsEmployee, getAPIHeaders('fg_group'), undefined, body)
}

export function GetGlsEmployees(
	query?: { id?: string; start_date?: string | Date; end_date?: string | Date } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGlsEmployees, getAPIHeaders('fg_group'), query)
}

export function GetNextGlsEmployeeCode(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetNextGlsEmployeeCode, getAPIHeaders('fg_group'))
}
