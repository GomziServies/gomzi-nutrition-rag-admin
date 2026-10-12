import { FC, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TopBarProgress from 'react-topbar-progress-indicator'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import GMPharmacyOrder from '../pages/gomzi-medical/pharmacy/order/pharmacy-order'
import GMPharmacyOrderView from '../pages/gomzi-medical/pharmacy/order/update-pharmacy-order'
import GMPharmacyProductList from '../pages/gomzi-medical/pharmacy/products/product-list'
import GMPharmacyRequirementList from '../pages/gomzi-medical/pharmacy/requirement/requirement-list'

const GomziMedicalPharmacyPrivateRoutes = () => {
	const UsersPage = lazy(() => import('../modules/apps/user-management/UsersPage'))

	return (
		<Routes>
			<Route element={<MasterLayout />}>
				{/* Product  */}
				<Route
					path='/product'
					element={<GMPharmacyProductList />}
				/>
				{/* Order  */}
				<Route
					path='/order'
					element={<GMPharmacyOrder />}
				/>
				<Route
					path='/order-update'
					element={<GMPharmacyOrderView />}
				/>
				<Route
					path='/requirement-list'
					element={<GMPharmacyRequirementList />}
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

export { GomziMedicalPharmacyPrivateRoutes }
