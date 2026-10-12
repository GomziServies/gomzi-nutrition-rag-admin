import { FC, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TopBarProgress from 'react-topbar-progress-indicator'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import GMDoctorOrder from '../pages/gomzi-medical/doctor/order/doctor-order'
import GMDoctorOrderView from '../pages/gomzi-medical/doctor/order/update-doctor-order'
import GMDoctorProductList from '../pages/gomzi-medical/doctor/products/product-list'
import GMDoctorRequirementList from '../pages/gomzi-medical/doctor/requirement/requirement-list'

const GomziMedicalDoctorPrivateRoutes = () => {
	const UsersPage = lazy(() => import('../modules/apps/user-management/UsersPage'))

	return (
		<Routes>
			<Route element={<MasterLayout />}>
				{/* Product  */}
				<Route
					path='/product'
					element={<GMDoctorProductList />}
				/>
				{/* Order  */}
				<Route
					path='/order'
					element={<GMDoctorOrder />}
				/>
				<Route
					path='/order-update'
					element={<GMDoctorOrderView />}
				/>
				<Route
					path='/requirement-list'
					element={<GMDoctorRequirementList />}
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

export { GomziMedicalDoctorPrivateRoutes }
