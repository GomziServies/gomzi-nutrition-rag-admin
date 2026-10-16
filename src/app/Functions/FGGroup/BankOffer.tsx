import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface BankOfferItem {
	_id?: string
	id?: string
	bankName: string
	heading: string
	subheading?: string
	terms?: string
	logo?: string
	bankPreset?: 'hsbc' | 'hdfc' | 'icici' | 'upi' | 'other' | string
	bgGradient?: string
	url?: string
	order?: number
	status?: boolean
	createdAt?: string
	updatedAt?: string
}

export function GetBankOffersAdmin(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetBankOffers, getAPIHeaders('fg_group'))
}

export function CreateBankOfferAdmin(data: Partial<BankOfferItem>): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageBankOffer, getAPIHeaders('fg_group'), undefined, data)
}

export function UpdateBankOfferAdmin(data: Partial<BankOfferItem> & { id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageBankOffer, getAPIHeaders('fg_group'), undefined, data)
}

export function DeleteBankOfferAdmin(id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageBankOffer, getAPIHeaders('fg_group'), undefined, {
		action: 'delete',
		id,
	})
}

export function ReorderBankOffersAdmin(offers: BankOfferItem[]): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ManageBankOffer, getAPIHeaders('fg_group'), undefined, {
		action: 'reorder',
		offers,
	})
}
