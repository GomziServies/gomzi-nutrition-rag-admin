import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { PageLink, PageTitle } from '../../../../_metronic/layout/core'
import { UsersListWrapper } from './users-list/UsersList'

const usersBreadcrumbs: Array<PageLink> = [
	{
		title: 'Admin User',
		path: '/admin-user',
		isSeparator: false,
		isActive: false,
	},
	{
		title: '',
		path: '',
		isSeparator: true,
		isActive: false,
	},
]

const UsersPage = () => {
	return (
		<Routes>
			<Route element={<Outlet />}>
				<Route
					path='users'
					element={
						<>
							<PageTitle breadcrumbs={usersBreadcrumbs}>Admin</PageTitle>
							<UsersListWrapper />
						</>
					}
				/>
			</Route>
			<Route
				index
				element={<Navigate to='/admin-user' />}
			/>
		</Routes>
	)
}

export default UsersPage
