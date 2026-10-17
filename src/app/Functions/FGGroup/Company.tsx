import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost, APIDelete } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface CompanyItem {
	_id?: string
	id?: string
	name: string
	slug?: string
	tagline?: string
	logo?: string
	website?: string
	manufacturer?: string
	countryOfOrigin?: string
	fssaiLicense?: string
	supportEmail?: string
	supportPhone?: string
	order?: number
	status?: boolean
	isFeatured?: boolean
	productCount?: number
	createdAt?: string
	updatedAt?: string
}

export function GetCompaniesAdmin(query?: { search?: string; status?: string }): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetCompanies, getAPIHeaders('fg_group'), query)
}

export function CreateCompanyAdmin(data: Partial<CompanyItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCompany, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateCompanyAdmin(data: Partial<CompanyItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCompany, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteCompanyAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCompany, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}

export function ReorderCompaniesAdmin(companies: { _id?: string; id?: string }[]): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageCompany, getAPIHeaders('fg_group'), undefined, {
		action: 'reorder',
		companies,
	})
}
