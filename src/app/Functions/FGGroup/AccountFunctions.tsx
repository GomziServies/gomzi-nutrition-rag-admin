import { HttpStatusCode } from 'axios'
import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'
import { isProPartnerToken, setProPartnerSessionTokens } from '../../modules/auth/core/ProPartnerAuth'

// FG Group
export async function LoginFGGroup(data: {
	email: string
	password: string
	authenticator_token?: string
}): Promise<FGGroupAPIResponse> {
	return await APIPost(FGGroupEndpoints.Login, undefined, undefined, data)
		.then(async (response: any) => {
			if (response.status === HttpStatusCode.Ok) {
				const token = response.data?.authorization
				localStorage.setItem('@fggroup+auth', token)
				if (isProPartnerToken(token)) {
					localStorage.setItem('auth_fg_group', token)
					setProPartnerSessionTokens()
					return response
				}
				return await GetUniversalAccessTokens()
			} else {
				return response
			}
		})
		.catch((error) => error)
}

// Login with Email-Password and OTP
export function LoginWithEmailPasswordOTP(data: {
	email: string
	password: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.LoginWithEmailOTP, undefined, undefined, data)
}

export function InvestorLoginWithEmailPasswordOTP(data: {
	email: string
	password: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.LoginWithEmailOTP, undefined, undefined, data)
}

export async function AutomationLogin(data: {
	email: string
	password: string
}): Promise<FGGroupAPIResponse> {
	return await APIPost(FGGroupEndpoints.TeleLogin, undefined, undefined, data)
		.then((response: any) => {
			if (response.status === HttpStatusCode.Ok) {
				localStorage.setItem('auth_fg_group', response.data.authorization)
				localStorage.setItem('admin', 'Automation')
			}
			return response
		})
		.catch((error) => error)
}

export async function VerifyEmailOTP(data: {
	verification_id: string
	otp: string
}): Promise<FGGroupAPIResponse> {
	return await APIPost(FGGroupEndpoints.VerifyEmailOTP, undefined, undefined, data)
		.then(async (response: any) => {
			if (response.status === HttpStatusCode.Ok) {
				const token = response.data?.authorization
				localStorage.setItem('@fggroup+auth', token)
				if (isProPartnerToken(token)) {
					localStorage.setItem('auth_fg_group', token)
					setProPartnerSessionTokens()
					return response
				}
				return await GetUniversalAccessTokens()
			} else {
				return response
			}
		})
		.catch((error) => error)
}

export async function VerifyInvestorEmailOTP(data: {
	verification_id: string
	otp: string
}): Promise<FGGroupAPIResponse> {
	return await APIPost(FGGroupEndpoints.VerifyEmailOTP, undefined, undefined, data)
		.then(async (response: any) => {
			if (response.status === HttpStatusCode.Ok) {
				const token = response.data?.authorization
				localStorage.setItem('@fggroup+auth', token)
				if (isProPartnerToken(token)) {
					localStorage.setItem('auth_fg_group', token)
					setProPartnerSessionTokens()
					return response
				}
				return await GetUniversalAccessTokens()
			} else {
				return response
			}
		})
		.catch((error) => error)
}

export async function GetUniversalAccessTokens(): Promise<FGGroupAPIResponse> {
	const authVal = localStorage.getItem('@fggroup+auth') || localStorage.getItem('auth_fg_group')
	if (isProPartnerToken(authVal)) {
		setProPartnerSessionTokens()
		return { status: HttpStatusCode.Ok, message: 'Pro Partner session bypass', data: [] } as any
	}
	return await APIGet(FGGroupEndpoints.GetUniversalAccessToken, {
		Authorization: localStorage.getItem('@fggroup+auth'),
	})
		.then((response: any) => {
			if (response.status !== 200) throw response
			if (response?.data?.length) {
				const currentUrl = window.location.pathname
				response?.data.forEach((item: { platform: string; access: string }) => {
					if (item.platform && item.access) {
						localStorage.setItem('auth_' + item.platform, item.access)
						if (currentUrl === '/employee/login') {
							localStorage.setItem('admin', 'Employee')
						} else if (currentUrl === '/master/login') {
							localStorage.setItem('admin', 'Master')
						} else if (currentUrl === '/rag/login') {
							localStorage.setItem('admin', 'Gomzi_Nutrition_Login')
						} else if (currentUrl === '/gn-tele-sales/login') {
							localStorage.setItem('admin', 'Gomzi_Nutrition_Tele_Sales')
						} else if (currentUrl === '/fgiit-tele-sales/login') {
							localStorage.setItem('admin', 'Fgiit_Tele_Sales')
						} else if (currentUrl === '/fwg-tele-sales/login') {
							localStorage.setItem('admin', 'Fwg_Tele_Sales')
						} else if (currentUrl === '/fwg-master/login') {
							localStorage.setItem('admin', 'Vesu-Master')
						} else if (currentUrl === '/portal/login') {
							localStorage.setItem('admin', 'FWG')
						} else if (currentUrl === '/trainer/login') {
							localStorage.setItem('admin', 'Trainer')
						} else if (currentUrl === '/gomzi-medical-doctor/login') {
							localStorage.setItem('admin', 'Gomzi_Medical_Doctor')
						} else if (currentUrl === '/gomzi-medical-pharmacy/login') {
							localStorage.setItem('admin', 'Gomzi_Medical_Pharmacy')
						} else if (currentUrl === '/adajan-branch/login') {
							localStorage.setItem('admin', 'Adajan-Branch')
						} else if (currentUrl.startsWith('/tele/login')) {
							localStorage.setItem('admin', 'Automation')
						} else if (currentUrl === '/fwg/login') {
							localStorage.setItem('admin', 'FWG_LOGIN_PORTAL')
							localStorage.setItem('fwg_login_portal', 'fwg_login_portal')
						} else if (currentUrl === '/investor/login') {
							localStorage.setItem('admin', 'Investor')
						} else if (currentUrl === '/hr/login') {
							localStorage.setItem('admin', 'HR')
							localStorage.setItem('admin_type', 'HR')
							localStorage.setItem('is_hr_portal', 'true')
						} else if (currentUrl === '/fgiit/login') {
							localStorage.setItem('admin', 'FGIIT_LOGIN_PORTAL')
							localStorage.setItem('fgiit_login_portal', 'fgiit_login_portal')
						} else {
							localStorage.setItem('admin', 'Gomzi_Nutrition')
						}
					}
				})
				window.location.href = '/'
			}
			return response
		})
		.catch((error) => error)
		.finally(() => {
			localStorage.removeItem('@fggroup+auth')
		})
}

export function getProfile(): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetProfile, getAPIHeaders('fg_group'))
}

export function UpdateProfile(data: {
	first_name?: string
	last_name?: string
	birth_date?: string
	email?: string
	phone?: string
	address_line_1?: string
	address_line_2?: string
	city?: string
	state?: string
	pin_code?: string
	country?: string
	fcm_token?: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.UpdateProfile, getAPIHeaders('fg_group'), undefined, data)
}

/**
 * Change the password for the user.
 * @param data - An object containing the new password and the old password.
 * @returns A Promise that resolves to the result of the API call.
 */
export function ChangePassword(data: {
	password: string
	old_password: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(FGGroupEndpoints.ChangePassword, getAPIHeaders('fg_group'), undefined, data)
}

export function AddAuthenticatorSecret(body: {
	secret: string
	remark: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.AddAuthenticatorSecret,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function RemoveAuthenticatorSecret(body: {
	secret_id: string
}): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.RemoveAuthenticatorSecret,
		getAPIHeaders('fg_group'),
		undefined,
		body
	)
}

export function FileUploadToFGGroup(
	files: any,
	body: { directory: string } = { directory: 'files' }
): Promise<FGGroupAPIResponse> | null {
	if (!files) {
		return null
	}

	const formData = new FormData()

	formData.append('directory', body.directory)

	if (!Array.isArray(files)) {
		files = [files]
	}

	files.forEach((file: any) => {
		file.fileURL = URL.createObjectURL(file)
		formData.append('files', file)
	})

	return APIPost(
		FGGroupEndpoints.FileUpload,
		getAPIHeaders('fg_group', { 'Content-Type': 'multipart/form-data' }),
		undefined,
		formData
	)
}

export function GetCommissions(params?: any): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetCommissionsEndpoint, getAPIHeaders('fg_group'), params)
}

export function AddCommission(data: any): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateCommissionEndpoint,
		getAPIHeaders('fg_group'),
		undefined,
		data
	)
}

export function UpdateCommission(data: any): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateCommissionEndpoint,
		getAPIHeaders('fg_group'),
		undefined,
		data
	)
}

export function GetWalletTransactions(params: any): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetWalletInvoices, getAPIHeaders('fg_group'), params)
}

export function GetAllTransactions(params: any): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAllTransactionsEndpoint, getAPIHeaders('fg_group'), params)
}

export function GetDashboardStats(params?: any): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetDashboardStatsEndpoint, getAPIHeaders('fg_group'), params)
}

export function GetAllSalesBalance(params: any): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetAllSalesBalanceEndpoint, getAPIHeaders('fg_group'), params)
}

export function CreateWithdrawalRequest(data: any): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.CreateWithdrawalRequest,
		getAPIHeaders('fg_group'),
		undefined,
		data
	)
}

export function GetWithdrawalRequests(params?: any): Promise<FGGroupAPIResponse> {
	return APIGet(FGGroupEndpoints.GetWithdrawalRequests, getAPIHeaders('fg_group'), params)
}

export function UpdateWithdrawalRequest(data: any): Promise<FGGroupAPIResponse> {
	return APIPost(
		FGGroupEndpoints.UpdateWithdrawalRequest,
		getAPIHeaders('fg_group'),
		undefined,
		data
	)
}
