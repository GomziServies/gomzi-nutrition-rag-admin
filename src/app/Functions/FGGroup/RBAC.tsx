import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

// ------------------------ Panels ----------------------------
export const GetPanels = async (): Promise<FGGroupAPIResponse> => {
	return APIGet(FGGroupEndpoints.GetPanels, getAPIHeaders('fg_group'))
}

export const CreatePanel = async (body: any): Promise<FGGroupAPIResponse> => {
	return APIPost(FGGroupEndpoints.CreatePanel, getAPIHeaders('fg_group'), undefined, body)
}

export const RemovePanel = async (body: any): Promise<FGGroupAPIResponse> => {
	return APIPost(FGGroupEndpoints.RemovePanel, getAPIHeaders('fg_group'), undefined, body)
}

export const UpdatePanel = async (body: any): Promise<FGGroupAPIResponse> => {
	return APIPost(FGGroupEndpoints.UpdatePanel, getAPIHeaders('fg_group'), undefined, body)
}

// ------------------------ Menus ----------------------------

export const GetMenus = async (query?: { panel_id?: string }): Promise<FGGroupAPIResponse> => {
	return APIGet(FGGroupEndpoints.GetMenus, getAPIHeaders('fg_group'), query)
}

export const CreateMenu = async (body: any): Promise<FGGroupAPIResponse> => {
	return APIPost(FGGroupEndpoints.CreateMenu, getAPIHeaders('fg_group'), undefined, body)
}

export const RemoveMenu = async (body: any): Promise<FGGroupAPIResponse> => {
	return APIPost(FGGroupEndpoints.RemoveMenu, getAPIHeaders('fg_group'), undefined, body)
}

// ------------------------ Sub Menus ----------------------------

export const CreateSubMenu = async (body: any): Promise<FGGroupAPIResponse> => {
	return APIPost(FGGroupEndpoints.CreateSubMenu, getAPIHeaders('fg_group'), undefined, body)
}

export const RemoveSubMenu = async (body: any): Promise<FGGroupAPIResponse> => {
	return APIPost(FGGroupEndpoints.RemoveSubMenu, getAPIHeaders('fg_group'), undefined, body)
}

// ------------------------ Assign Authority ----------------------------

export const AssignAuthority = async (body: any): Promise<FGGroupAPIResponse> => {
	return APIPost(FGGroupEndpoints.AssignAuthority, getAPIHeaders('fg_group'), undefined, body)
}

export const GetAuthority = async (query?: {
	employee_id: string
}): Promise<FGGroupAPIResponse> => {
	return APIGet(FGGroupEndpoints.GetAuthority, getAPIHeaders('fg_group'), query)
}

export const GetMyAuthority = async (): Promise<FGGroupAPIResponse> => {
	return APIGet(FGGroupEndpoints.GetMyAuthority, getAPIHeaders('fg_group'))
}

export const RemoveAuthority = async (body: any): Promise<FGGroupAPIResponse> => {
	return APIPost(FGGroupEndpoints.RemoveAuthority, getAPIHeaders('fg_group'), undefined, body)
}
