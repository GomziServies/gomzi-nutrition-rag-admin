import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

// Adajan Branch Salary
export function GetAdajanBranchSalary(query?: { 
	from_date?: string
	to_date?: string
	employee_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAdajanBranchSalary, getAPIHeaders('fg_group'), query)
}

// Adajan Branch Salary Data
export function GetAdajanBranchSalaryData(query?: { 
	employee_id?: string
	period?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAdajanBranchSalaryData, getAPIHeaders('fg_group'), query)
}
