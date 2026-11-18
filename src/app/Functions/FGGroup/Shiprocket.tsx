import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export interface ShiprocketTrackingScan {
	date: string
	status: string
	activity: string
	location: string
	'sr-status'?: string
}

export interface ShiprocketData {
	order_id?: string
	shipment_id?: string
	awb_code?: string
	courier_name?: string
	courier_company_id?: number
	tracking_url?: string
	pickup_status?: string
	current_status?: string
	label_url?: string
	invoice_url?: string
	scans?: ShiprocketTrackingScan[]
}

export function CreateShiprocketShipmentAdmin(order_id: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ShiprocketCreateShipment, getAPIHeaders('fg_group'), undefined, {
		order_id,
	})
}

export function TrackShiprocketShipmentAdmin(order_id: string, awb_code?: string): Promise<FGGroupAPIResponse> {
	const url = `${FGGroupEndpoints.ShiprocketTrack}/${order_id}${awb_code ? `?awb_code=${encodeURIComponent(awb_code)}` : ''}`
	return APIGet(url, getAPIHeaders('fg_group'))
}

export function RequestShiprocketPickupAdmin(order_id: string, shipment_id?: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ShiprocketRequestPickup, getAPIHeaders('fg_group'), undefined, {
		order_id,
		shipment_id,
	})
}

export function GetShiprocketLabelAdmin(order_id: string, shipment_id?: string): Promise<FGGroupAPIResponse> {
	const url = `${FGGroupEndpoints.ShiprocketLabel}/${order_id}${shipment_id ? `?shipment_id=${encodeURIComponent(shipment_id)}` : ''}`
	return APIGet(url, getAPIHeaders('fg_group'))
}

export function CancelShiprocketOrderAdmin(order_id: string, reason?: string): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ShiprocketCancelOrder, getAPIHeaders('fg_group'), undefined, {
		order_id,
		reason: reason || 'Cancelled by Admin',
	})
}
