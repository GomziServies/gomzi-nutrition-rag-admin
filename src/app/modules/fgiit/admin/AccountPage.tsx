import React from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { PageLink, PageTitle } from '../../../../_metronic/layout/core'
import { Profile } from './components/settings/Profile'

const accountBreadCrumbs: Array<PageLink> = [
	{
		title: 'Account',
		path: '/crafted/account/overview',
		isSeparator: false,
		isActive: false,
	},
]

const AccountPage: React.FC = () => {
	return (
		<Routes>
			<Route
				element={
					<>
						<Outlet />
					</>
				}>
				<Route
					path='overview'
					element={
						<>
							<PageTitle breadcrumbs={accountBreadCrumbs}>Overview</PageTitle>
						</>
					}
				/>
				<Route
					path='settings'
					element={
						<>
							<PageTitle breadcrumbs={accountBreadCrumbs}>Profile</PageTitle>
							<Profile />
						</>
					}
				/>
				<Route
					index
					element={<Navigate to='/crafted/account/overview' />}
				/>
			</Route>
		</Routes>
	)
}

export default AccountPage
