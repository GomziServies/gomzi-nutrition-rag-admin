import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export function CreateEmployee(body: {
	employee_code: string
	name: string
	position: string
	salary: number
	account_details: {
		bank_name: string
		account_number: string
		IFSC: string
	}
	email: string
	mobile: string
	address: string
	photo: string
	proof: string
	documents: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateEmployee, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateEmployee(body: {
	admin_id: string
	type?: string
	employee_code?: string
	name?: string
	email?: string
	mobile?: string
	position?: string
	salary?: number
	account_details: {
		bank_name: string
		account_number: string
		IFSC: string
	}
	address?: string
	photo?: string
	proof?: string
	documents?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateEmployee, getAPIHeaders('fg_group'), undefined, body)
}

export function RemoveEmployee(body: { admin_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.RemoveEmployee, getAPIHeaders('fg_group'), undefined, body)
}

export function CreateEmployeeMemo(body: {
	admin_id: string
	employee_id: string
	memo: {
		subject: string
		date?: string
	}
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.AddEmployeeMemo, getAPIHeaders('fg_group'), undefined, body)
}

export function DeleteEmployeeMemo(body: {
	admin_id: string
	employee_id: string
	memo_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.DeleteEmployeeMemo, getAPIHeaders('fg_group'), undefined, body)
}

export function GetEmployees(
	query?: { id?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetEmployees, getAPIHeaders('fg_group'), query)
}

export function GetEmployeeRating(query?: {
	admin_id?: string
	from_date?: string
	to_date?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.RatingEmployee, getAPIHeaders('fg_group'), query)
}

export function GetNextEmployeeCode(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetNextEmployeeCode, getAPIHeaders('fg_group'))
}
