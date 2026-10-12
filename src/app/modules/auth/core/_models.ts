export type AuthModel = {
	api_token: string
	refreshToken?: string
}

export type UserAddressModel = {
	addressLine: string
	city: string
	state: string
	postCode: string
}

export type UserCommunicationModel = {
	email: boolean
	sms: boolean
	phone: boolean
}

export type UserEmailSettingsModel = {
	emailNotification?: boolean
	sendCopyToPersonalEmail?: boolean
	activityRelatesEmail?: {
		youHaveNewNotifications?: boolean
		youAreSentADirectMessage?: boolean
		someoneAddsYouAsAsAConnection?: boolean
		uponNewOrder?: boolean
		newMembershipApproval?: boolean
		memberRegistration?: boolean
	}
	updatesFromKeenthemes?: {
		newsAboutKeenthemesProductsAndFeatureUpdates?: boolean
		tipsOnGettingMoreOutOfKeen?: boolean
		thingsYouMissedSindeYouLastLoggedIntoKeen?: boolean
		newsAboutStartOnPartnerProductsAndOtherServices?: boolean
		tipsOnStartBusinessProducts?: boolean
	}
}

export type UserSocialNetworksModel = {
	linkedIn: string
	facebook: string
	twitter: string
	instagram: string
}

export type UserModel = {
	id: number
	username: string
	password: string | undefined
	email: string
	first_name: string
	last_name: string
	fullname?: string
	occupation?: string
	companyName?: string
	phone?: string
	roles?: Array<number>
	pic?: string
	language?: 'en' | 'de' | 'es' | 'fr' | 'ja' | 'zh' | 'ru'
	timeZone?: string
	website?: 'https://keenthemes.com'
	emailSettings?: UserEmailSettingsModel
	auth?: AuthModel
	communication?: UserCommunicationModel
	address?: UserAddressModel
	socialNetworks?: UserSocialNetworksModel
}
