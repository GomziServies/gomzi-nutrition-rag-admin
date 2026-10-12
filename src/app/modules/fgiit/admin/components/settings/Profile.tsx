import React from 'react'
import { AddAuthApp } from './cards/AddAuthApp'
import { PasswordChange } from './cards/PasswordChange'
import { ProfileDetails } from './cards/ProfileDetails'

export function Profile() {
	return (
		<>
			<ProfileDetails />
			<PasswordChange />
			<AddAuthApp />
		</>
	)
}
