import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import BroadcastActiveChats from '../pages/fgiit-tele-sales/broadcast-active-chats/broadcast-active-chats'
import AddFollowUpReport from '../pages/fgiit-tele-sales/follow-up-report/add-follow-up-report'
import FollowUpReportInnerList from '../pages/fgiit-tele-sales/follow-up-report/follow-up-report-inner-list'
import FollowUpReportList from '../pages/fgiit-tele-sales/follow-up-report/follow-up-report-list'
import UpdateFollowUpReport from '../pages/fgiit-tele-sales/follow-up-report/update-follow-up-report'
import ViewFollowUpReport from '../pages/fgiit-tele-sales/follow-up-report/view-follow-up-report'
import FgiitCallerDeskPage from '../pages/fgiit-tele-sales/callerdesk/CallerDeskPage'
import { CallerDeskDashboardV2Wrapper } from '../pages/master/callerdesk/CallerDeskDashboard'

const FgiitTeleSalesPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<FollowUpReportList />}
				/>
				{/* Follow Up Report */}
				{/* <Route
                    path='follow-up-report-dashboard'
                    element={<FollowUpReportDashboard />}
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
					path='follow-up-report-inner-list'
					element={<FollowUpReportInnerList />}
				/>
				<Route
					path='view-follow-up-report'
					element={<ViewFollowUpReport />}
				/>
				<Route
					path='update-follow-up-report'
					element={<UpdateFollowUpReport />}
				/>

				{/* Automation */}
				<Route
					path='/automation/broadcast/active-chats'
					element={<BroadcastActiveChats />}
				/>

				{/* Caller Desk */}
				<Route
					path='caller-desk-dashboard'
					element={<CallerDeskDashboardV2Wrapper defaultDeskphone='08062985216' />}
				/>
				<Route
					path='caller-desk-reports'
					element={<FgiitCallerDeskPage />}
				/>

				<Route
					path='*'
					element={<Navigate to='follow-up-report-list' />}
				/>
			</Route>
		</Routes>
	)
}

export { FgiitTeleSalesPrivateRoutes }
