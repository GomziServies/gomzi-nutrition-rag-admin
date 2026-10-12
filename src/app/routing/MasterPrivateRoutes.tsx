import { Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import { DashboardWrapper } from '../pages/master/dashboard/DashboardWrapper'
import { AddExpenseMaster } from '../pages/master/expense/create-expense'
import ExpenseListDetailsMaster from '../pages/master/expense/expense-details'
import { MasterFacebook } from '../pages/master/facebook/facebook'
import { MasterFacebookConfiguration } from '../pages/master/facebook/facebook-configuration'
import { MasterFGGroup } from '../pages/master/fg-group/fg-group'
import MasterFWGDashboard from '../pages/master/fwg/fwg-dashboard'
import { MasterGoogleAnalytics } from '../pages/master/google-analytics/google-analytics'
import MasterReports from '../pages/master/reports/reports'
import MasterCreateInvoicePage from '../pages/master/total-sales/create-invoice'
import MasterTotalSalesList from '../pages/master/total-sales/totalsales-list'
import MasterUpdateInvoicePage from '../pages/master/total-sales/update-invoice'
import { WhatsappAutomationCreate } from '../pages/master/whatsapp-automation/whatsapp-automation-create'
import WhatsappAutomationList from '../pages/master/whatsapp-automation/whatsapp-automation-list'
import { WhatsappAutomationView } from '../pages/master/whatsapp-automation/whatsapp-automation-view'
import { FacebookAutomationCreate } from '../pages/master/facebook-automation/facebook-automation-create'
import FacebookAutomationList from '../pages/master/facebook-automation/facebook-automation-list'
import FwgMatrix from '../pages/master/matrix/fwgmatrix'
import FgiitMatrix from '../pages/master/matrix/fgiitmatrix'
import Gnmatrix from '../pages/master/matrix/gnmatrix'
import HrMatrix from '../pages/master/matrix/hrmatrix'
import { MetaMarketingDashboard } from '../pages/master/meta-marketing/meta-marketing'
import GlsReport from '../pages/master/gls-report/gls-report'
import { CallerDeskDashboardV2Wrapper } from '../pages/master/callerdesk/CallerDeskDashboard'
import CallerDeskCallLogs from '../pages/master/callerdesk/CallerDeskCallLogs'


const MasterPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<DashboardWrapper />}
				/>
				<Route
					path='facebook'
					element={<MasterFacebook />}
				/>
				<Route
					path='configuration'
					element={<MasterFacebookConfiguration />}
				/>
				<Route
					path='google-analytics'
					element={<MasterGoogleAnalytics />}
				/>
				<Route
					path='fg-group'
					element={<MasterFGGroup />}
				/>
				<Route
					path='fwg'
					element={<MasterFWGDashboard />}
				/>
				{/* Invoice  */}
				<Route
					path='/master-invoice/create'
					element={<MasterCreateInvoicePage />}
				/>
				<Route
					path='/master-invoice/update'
					element={<MasterUpdateInvoicePage />}
				/>
				<Route
					path='/master-invoice/list'
					element={<MasterTotalSalesList />}
				/>

				<Route
					path='master-create-expense'
					element={<AddExpenseMaster />}
				/>
				<Route
					path='master-expense-details'
					element={<ExpenseListDetailsMaster />}
				/>
				<Route
					path='master-expense-update'
					element={<AddExpenseMaster />}
				/>

				<Route
					path='report'
					element={<MasterReports />}
				/>
				<Route
					path='whatsapp-automation'
					element={<WhatsappAutomationList />}
				/>
				<Route
					path='whatsapp-automation-view'
					element={<WhatsappAutomationView />}
				/>
				<Route
					path='whatsapp-automation-create'
					element={<WhatsappAutomationCreate />}
				/>
				<Route
					path='facebook-automation'
					element={<FacebookAutomationList />}
				/>
				<Route
					path='facebook-automation-create'
					element={<FacebookAutomationCreate />}
				/>
				<Route
					path='matrix-fwg'
					element={<FwgMatrix />}
				/>
				<Route
					path='matrix-fgiit'
					element={<FgiitMatrix />}
				/>
				<Route
					path='matrix-gn'
					element={<Gnmatrix />}
				/>
				<Route
					path='matrix-hr'
					element={<HrMatrix />}
				/>
				<Route
					path='meta-marketing'
					element={<MetaMarketingDashboard />}
				/>
				<Route
					path='gls-report'
					element={<GlsReport />}
				/>
				<Route
					path='caller-desk-dashboard'
					element={<CallerDeskDashboardV2Wrapper />}
				/>
				<Route
					path='caller-desk-reports'
					element={<CallerDeskCallLogs />}
				/>

			</Route>
		</Routes>
	)
}

// const SuspensedView: FC<WithChildren> = ({ children }) => {
// 	const baseColor = getCSSVariableValue('--bs-primary')
// 	TopBarProgress.config({
// 		barColors: {
// 			'0': baseColor,
// 		},
// 		barThickness: 1,
// 		shadowBlur: 5,
// 	})
// 	return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>
// }

export { MasterPrivateRoutes }
