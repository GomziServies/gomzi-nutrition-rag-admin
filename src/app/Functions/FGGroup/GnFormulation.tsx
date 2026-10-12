import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'


export function GetGnFormulation(
    query?: { id?: string; common_id?: string; clientId?: string } & FGGroupSearchOptions & FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetGnFormulation, getAPIHeaders('fg_group'), query)
}
export function CreateGnFormulation(body: {
	common_id: string
	item_id: string
	scoopSize: number

	nutritionItems: Array<{
		itemName: string
		weight35gm: number
		weight100gm?: number
		rda?: number
	}>

	aminoAcidProfile?: Array<{
		title: string
		items?: Array<{
			name: string
			value: number
			unit?: string
		}>
		value?: number
		unit?: string
	}>
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateGnFormulation,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function UpdateGnFormulation(body: {
	formulation_id: string
	scoopSize: number

	nutritionItems: Array<{
		itemName: string
		weight35gm: number
		weight100gm?: number
		rda?: number
	}>

	aminoAcidProfile?: Array<{
		title: string
		items?: Array<{
			name: string
			value: number
			unit?: string
		}>
		value?: number
		unit?: string
	}>
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateGnFormulation,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}


