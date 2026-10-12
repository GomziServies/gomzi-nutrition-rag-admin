import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPatch, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

/**
 * Fetch salary slips (list all or fetch by ID using query)
 */
export function GetSalarySlips(query?: any): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.SalarySlipGet, getAPIHeaders('fg_group'), query)
}

/**
 * Add a new salary slip
 */
export function AddSalarySlip(body: any): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.SalarySlipAdd, getAPIHeaders('fg_group'), undefined, body)
}

/**
 * Update an existing salary slip
 */
export function UpdateSalarySlip(id: string, body: any): Promise<FGGroupAPIResponse> {
	return APIPatch(FGGroupEndpoints.SalarySlipEdit, getAPIHeaders('fg_group'), { id }, body)
}

/**
 * Remove a salary slip
 */
export function RemoveSalarySlip(id: string): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.SalarySlipRemove, getAPIHeaders('fg_group'), { id })
}
