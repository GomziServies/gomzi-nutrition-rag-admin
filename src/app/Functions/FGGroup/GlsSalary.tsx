import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

// GLS Branch Salary
export function GetGlsSalary(query?: { 
	from_date?: string
	to_date?: string
	employee_id?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGlsSalary, getAPIHeaders('fg_group'), query)
}

// GLS Branch Salary Data
export function GetGlsSalaryData(query?: { 
	employee_id?: string
	period?: string
}): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetGlsSalaryData, getAPIHeaders('fg_group'), query)
}
