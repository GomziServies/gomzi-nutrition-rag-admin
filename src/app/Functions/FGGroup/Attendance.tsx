import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

// Attendance
export function GetAttendance(
	query?: { 
		attendance_id?: string
		from_date?: string
		to_date?: string
		status?: string
	 } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAttendance, getAPIHeaders('fg_group'), query)
}

export function GetSyncAttendance(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSyncAttendance, getAPIHeaders('fg_group'))
}

// Salary
export function GetSalary(query?: { 
	from_date?: string
	to_date?: string
	employee_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSalary, getAPIHeaders('fg_group'), query)
}

// New Salary Data API
export function GetSalaryData(query?: { 
	employee_id?: string
	period?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetSalaryData, getAPIHeaders('fg_group'), query)
}

export function SyncSalaryData(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.SyncSalaryData, getAPIHeaders('fg_group'))
}