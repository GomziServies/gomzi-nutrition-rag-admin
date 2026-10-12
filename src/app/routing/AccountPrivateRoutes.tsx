import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import CommissionPage from '../pages/account/commission/create-commission'
import AccountDashboard from '../pages/account/dashboard/account-dashboard'
import FgiitTotalSales from '../pages/account/invoice/fgiit-total-sales'
import FwgTotalSales from '../pages/account/invoice/fwg-total-sales'
import GomziNutritionTotalSales from '../pages/account/invoice/gomzi-nutrition-total-sales'
import SalesPersonCoins from '../pages/account/sales-person-coins/sales-person-coins'
import Transactions from '../pages/account/transactions/transactions'
import WithdrawalRequests from '../pages/account/withdrawal-requests/withdrawal-requests'
import AutoCommissionRequestsPage from '../pages/employee/wallet/auto-commission-requests'

export const AccountPrivateRoutes: React.FC = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<AccountDashboard />}
				/>
				<Route
					path='withdrawal-requests'
					element={<WithdrawalRequests />}
				/>
				<Route
					path='transactions'
					element={<Transactions />}
				/>
				<Route
					path='sales-person-coins'
					element={<SalesPersonCoins />}
				/>
				<Route
					path='create-commission'
					element={<CommissionPage />}
				/>
				<Route
					path='auto-commission-requests'
					element={<AutoCommissionRequestsPage />}
				/>
				<Route path='invoice'>
					<Route
						index
						element={<Navigate to='/account/invoice/fgiit' />}
					/>
					<Route
						path='fgiit'
						element={<FgiitTotalSales />}
					/>
					<Route
						path='fwg'
						element={<FwgTotalSales />}
					/>
					<Route
						path='gomzi-nutrition'
						element={<GomziNutritionTotalSales />}
					/>
				</Route>
				<Route
					path='*'
					element={<Navigate to='/account/dashboard' />}
				/>
			</Route>
		</Routes>
	)
}
