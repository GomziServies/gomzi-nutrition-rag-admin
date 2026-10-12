import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import BroadcastActiveChats from '../pages/gn-tele-sales/broadcast-active-chats/broadcast-active-chats'

import NutritionCreateQuotation from '../pages/gn-tele-sales/quotation/create-quotation'
import QuotationList from '../pages/gn-tele-sales/quotation/quotation-list'
import NutritionUpdateQuotation from '../pages/gn-tele-sales/quotation/update-quotation'
import AddFollowUpReport from '../pages/gn-tele-sales/follow-up-report/add-follow-up-report'
import FollowUpReportInnerList from '../pages/gn-tele-sales/follow-up-report/follow-up-report-inner-list'
import FollowUpReportList from '../pages/gn-tele-sales/follow-up-report/follow-up-report-list'
import UpdateFollowUpReport from '../pages/gn-tele-sales/follow-up-report/update-follow-up-report'
import ViewFollowUpReport from '../pages/gn-tele-sales/follow-up-report/view-follow-up-report'
import GnCallerDeskPage from '../pages/gn-tele-sales/callerdesk/CallerDeskPage'
import { CallerDeskDashboardV2Wrapper } from '../pages/master/callerdesk/CallerDeskDashboard'

const GomziNutritionTeleSalesPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<FollowUpReportList />}
				/>
				{/* Quotation */}
				<Route
					path='create-quotation'
					element={<NutritionCreateQuotation />}
				/>
				<Route
					path='update-quotation'
					element={<NutritionUpdateQuotation />}
				/>
				<Route
					path='quotation-list'
					element={<QuotationList />}
				/>
				{/* Follow Up Report */}
				{/* <Route
					path='follow-up-report-dashboard'
					element={<FollowUpReportList />}
				/> */}
				<Route
					path='follow-up-report-list'
					element={<FollowUpReportList />}
				/>
				<Route
					path='add-follow-up-report'
					element={<AddFollowUpReport />}
				/>
				<Route
					path='update-follow-up-report'
					element={<UpdateFollowUpReport />}
				/>
				<Route
					path='follow-up-report-inner-list'
					element={<FollowUpReportInnerList />}
				/>
				<Route
					path='view-follow-up-report'
					element={<ViewFollowUpReport />}
				/>

				{/* Automation */}
				<Route
					path='/automation/broadcast/active-chats'
					element={<BroadcastActiveChats />}
				/>

				{/* Caller Desk */}
				<Route
					path='caller-desk-dashboard'
					element={<CallerDeskDashboardV2Wrapper defaultDeskphone='08069220266' />}
				/>
				<Route
					path='caller-desk-reports'
					element={<GnCallerDeskPage />}
				/>
				<Route
					path='*'
					element={<Navigate to='follow-up-report-list' />}
				/>
			</Route>
		</Routes>
	)
}

export { GomziNutritionTeleSalesPrivateRoutes }
