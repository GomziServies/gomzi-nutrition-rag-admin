import { FC, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TopBarProgress from 'react-topbar-progress-indicator'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import { GMUserView } from '../pages/gomzi-medical/admin/users/view-user'
import GMAddUserForm from '../pages/gomzi-medical/admin/users/add-user'
import GMUsers from '../pages/gomzi-medical/admin/users/users'
import GMAllOrder from '../pages/gomzi-medical/admin/orders/all-order'
import { GMOrderView } from '../pages/gomzi-medical/admin/orders/order-view'
import GMAdminUserList from '../pages/gomzi-medical/admin/admin-user/admin-user-list'
import { GMEditAdminUser } from '../pages/gomzi-medical/admin/admin-user/edit-admin-user'
import { GMAddAdminUser } from '../pages/gomzi-medical/admin/admin-user/add-admin-user'
import { GMAdminProfileView } from '../pages/gomzi-medical/admin/admin-user/admin-profile-view'
import GMCreateInvoice from '../pages/gomzi-medical/admin/invoice/create-invoice'
import GMUpdateInvoice from '../pages/gomzi-medical/admin/invoice/update-invoice'
import GMTotalSalesList from '../pages/gomzi-medical/admin/invoice/total-sales'
import GMAddToCart from '../pages/gomzi-medical/admin/add-to-cart/add-to-cart'
import GMMedicalProductList from '../pages/gomzi-medical/admin/products/product-list'
import { GMAddMedicalProduct } from '../pages/gomzi-medical/admin/products/add-product'
import { GMEditMedicalProduct } from '../pages/gomzi-medical/admin/products/edit-product'
import GMRequirementList from '../pages/gomzi-medical/admin/requirement/requirement-list'

const GomziMedicalPrivateRoutes = () => {
	const UsersPage = lazy(() => import('../modules/apps/user-management/UsersPage'))

	return (
		<Routes>
			<Route element={<MasterLayout />}>
				{/* <Route path='dashboard' element={<DashboardWrapper />} /> */}
				<Route
					path='users/view-user'
					element={<GMUserView />}
				/>
				<Route
					path='users/add-user'
					element={<GMAddUserForm />}
				/>

				{/*  */}
				<Route
					path='/users'
					element={<GMUsers />}
				/>
				<Route
					path='/all-order'
					element={<GMAllOrder />}
				/>
				<Route
					path='/all-order/view-order'
					element={<GMOrderView />}
				/>
				<Route
					path='admin-user'
					element={<GMAdminUserList />}
				/>
				<Route
					path='admin-user-edit'
					element={<GMEditAdminUser />}
				/>
				<Route
					path='admin-user-add'
					element={<GMAddAdminUser />}
				/>
				<Route
					path='admin-user/admin-profile'
					element={<GMAdminProfileView />}
				/>

				{/* Invoice  */}
				<Route
					path='/invoice/create'
					element={<GMCreateInvoice />}
				/>
				<Route
					path='/invoice/update'
					element={<GMUpdateInvoice />}
				/>
				<Route
					path='/invoice/list'
					element={<GMTotalSalesList />}
				/>

				<Route
					path='/cart/add-to-cart'
					element={<GMAddToCart />}
				/>
				<Route
					path='/product'
					element={<GMMedicalProductList />}
				/>
				<Route
					path='/product-add'
					element={<GMAddMedicalProduct />}
				/>
				<Route
					path='product-edit'
					element={<GMEditMedicalProduct />}
				/>
				<Route
					path='requirement-list'
					element={<GMRequirementList />}
				/>


				{/* Lazy Modules */}
				<Route
					path='admin-user'
					element={
						<SuspensedView>
							<UsersPage />
						</SuspensedView>
					}
				/>

				{/* Page Not Found */}
				<Route
					path='*'
					element={<Navigate to='/error/404' />}
				/>
			</Route>
		</Routes>
	)
}

const SuspensedView: FC<WithChildren> = ({ children }) => {
	const baseColor = getCSSVariableValue('--bs-primary')
	TopBarProgress.config({
		barColors: {
			'0': baseColor,
		},
		barThickness: 1,
		shadowBlur: 5,
	})
	return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>
}

export { GomziMedicalPrivateRoutes }
