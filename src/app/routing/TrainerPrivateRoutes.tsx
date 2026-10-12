import { Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import AutoCommissionRequestsPage from '../pages/employee/wallet/auto-commission-requests'
import FgroupInvoicePage from '../pages/employee/wallet/fgroup-invoice'
import InvoicePage from '../pages/employee/wallet/Invoice'
import NutritionInvoicePage from '../pages/employee/wallet/nutrition-invoice'
import { Transactions } from '../pages/employee/wallet/transactions'
import { TrainerDashboard } from '../pages/gomzi-nutrition-trainer/dashboard/DashboardWrapper'
import TrainerManageCoupon from '../pages/gomzi-nutrition-trainer/reference-coupon/manage-coupon'
import TrainerReference from '../pages/gomzi-nutrition-trainer/reference-coupon/reference'

const TrainerPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<TrainerDashboard />}
				/>
				<Route
					path='/trainer-manage-coupon'
					element={<TrainerManageCoupon />}
				/>
				<Route
					path='/trainer-manage-coupon/reference'
					element={<TrainerReference />}
				/>
				{/* wallet */}
				<Route
					path='invoice'
					element={<InvoicePage />}
				/>
				<Route
					path='transactions'
					element={<Transactions />}
				/>
				<Route
					path='wallet/gls-invoice'
					element={<NutritionInvoicePage />}
				/>
				<Route
					path='wallet/fgiit-invoice'
					element={<FgroupInvoicePage />}
				/>
				<Route
					path='auto-commission'
					element={<AutoCommissionRequestsPage />}
				/>
			</Route>
		</Routes>
	)
}

export { TrainerPrivateRoutes }
