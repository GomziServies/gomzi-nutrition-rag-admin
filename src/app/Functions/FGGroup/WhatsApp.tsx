import axios from 'axios'
import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

export const getSenderNumber = () => {
	const adminType = (localStorage.getItem('admin') || '').toUpperCase()
	if (adminType.includes('FWG')) return '917016009065'
	if (adminType.includes('GOMZI_NUTRITION') || adminType.includes('STORE')) return '917990969639'
	return '918758391809' // Default FGIIT
}
export const getPhoneNumberId = () => {
	const adminType = (localStorage.getItem('admin') || '').toUpperCase()
	if (adminType.includes('FWG')) return '1105579372633861'
	if (adminType.includes('GOMZI_NUTRITION') || adminType.includes('STORE'))
		return '1066760079858286'
	return '825851353954724' // Default FGIIT
}

export function getWhatsAppTemplates(
	query?: FGGroupPaginationOptions & FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetWhatsAppTemplates, getAPIHeaders('fg_group'), {
		...query,
		senderNumber: getSenderNumber(),
		sender_phone: getSenderNumber(),
		phoneNumberId: getPhoneNumberId(),
	})
}

export function deleteWhatsAppTemplate(query?: { name: string }): Promise<FGGroupAPIResponse> {
	return APIDelete(FGGroupEndpoints.DeleteWhatsAppTemplate, getAPIHeaders('fg_group'), {
		...query,
		senderNumber: getSenderNumber(),
		sender_phone: getSenderNumber(),
		phoneNumberId: getPhoneNumberId(),
	})
}

export function createWhatsAppTemplate(data: any): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateWhatsAppTemplate, getAPIHeaders('fg_group'), undefined, {
		...data,
		senderNumber: getSenderNumber(),
		sender_phone: getSenderNumber(),
		phoneNumberId: getPhoneNumberId(),
	})
}

export function sendWhatsAppTemplateMessage(data: any): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.SendWhatsAppTemplateMessage,
		getAPIHeaders('fg_group'),
		undefined,
		{
			...data,
			senderNumber: getSenderNumber(),
			sender_phone: getSenderNumber(),
			phoneNumberId: getPhoneNumberId(),
		}
	)
}

export function sendWhatsAppTemplateMessageMultiple(data: any): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.SendWhatsAppTemplateMessageMultiple,
		getAPIHeaders('fg_group'),
		undefined,
		{
			...data,
			senderNumber: getSenderNumber(),
			sender_phone: getSenderNumber(),
			phoneNumberId: getPhoneNumberId(),
		}
	)
}

export function createScheduleMessage(data: any): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.CreateScheduleMessage, getAPIHeaders('fg_group'), undefined, {
		...data,
		senderNumber: getSenderNumber(),
		sender_phone: getSenderNumber(),
		phoneNumberId: getPhoneNumberId(),
	})
}

export function getWhatsAppChatHistory(
	wa_id: string,
	query?: { limit?: number; before?: string }
): Promise<FGGroupAPIResponse> {
	return APIGet(`${FGGroupEndpoints.GetWhatsAppChatHistory}/${wa_id}`, getAPIHeaders('fg_group'), {
		...query,
		phoneNumberId: getPhoneNumberId(),
	})
}

export function getWhatsAppContactList(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetWhatsAppContactList, getAPIHeaders('fg_group'), {
		senderNumber: getSenderNumber(),
		sender_phone: getSenderNumber(),
		phoneNumberId: getPhoneNumberId(),
	})
}

export async function uploadFile(file: File): Promise<string> {
	const formData = new FormData()
	formData.append('files', file, file.name)
	formData.append('phoneNumberId', getPhoneNumberId())

	const headers = getAPIHeaders('fg_group')
	// Remove Content-Type header so browser can set it with proper boundary for multipart/form-data
	delete (headers as any)['Content-Type']

	try {
		const response = await axios.post(FGGroupEndpoints.FileUpload, formData, {
			headers: headers,
		})

		if (response?.data?.status === 200 && response?.data?.data?.fileURLs) {
			// Return the first file URL
			const fileUrl = response.data.data.fileURLs[0]
			if (fileUrl && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
				return `https://files.fggroup.in/${fileUrl}`
			}
			return fileUrl
		} else {
			throw new Error('File upload failed - unexpected response format')
		}
	} catch (error) {
		console.error('File upload error:', error)
		throw error
	}
}

export function sendWhatsAppTextMessage(data: {
	message: string
	phoneNumber: string
	mediaType?: 'image' | 'video' | 'document' | 'audio'
	mediaLink?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.SendWhatsAppTextMessage, getAPIHeaders('fg_group'), undefined, {
		...data,
		senderNumber: getSenderNumber(),
		sender_phone: getSenderNumber(),
		phoneNumberId: getPhoneNumberId(),
	})
}

export function markWhatsAppMessagesAsRead(data: { wa_id: string }): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.MarkWhatsAppMessagesAsRead,
		getAPIHeaders('fg_group'),
		undefined,
		{
			...data,
			senderNumber: getSenderNumber(),
			sender_phone: getSenderNumber(),
			phoneNumberId: getPhoneNumberId(),
		}
	)
}
