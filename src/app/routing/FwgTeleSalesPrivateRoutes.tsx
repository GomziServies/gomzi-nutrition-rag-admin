import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import BroadcastActiveChats from './../pages/fwg-tele-sales/broadcast-active-chats/broadcast-active-chats'
import AddFollowUpReport from '../pages/fwg-tele-sales/follow-up-report/add-follow-up-report'
import FollowUpReportInnerList from '../pages/fwg-tele-sales/follow-up-report/follow-up-report-inner-list'
import FollowUpReportList from '../pages/fwg-tele-sales/follow-up-report/follow-up-report-list'
import UpdateFollowUpReport from '../pages/fwg-tele-sales/follow-up-report/update-follow-up-report'
import ViewFollowUpReport from '../pages/fwg-tele-sales/follow-up-report/view-follow-up-report'
import FwgCallerDeskPage from '../pages/fwg-tele-sales/callerdesk/CallerDeskPage'
import { CallerDeskDashboardV2Wrapper } from '../pages/master/callerdesk/CallerDeskDashboard'

const FwgTeleSalesPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<FollowUpReportList />}
				/>
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
					element={<CallerDeskDashboardV2Wrapper defaultDeskphone='08069247707' />}
				/>
				<Route
					path='caller-desk-reports'
					element={<FwgCallerDeskPage />}
				/>
				{/* Updated redirect to skip dashboards */}
				<Route
					path='*'
					element={<Navigate to='follow-up-report-list' />}
				/>
			</Route>
		</Routes>
	)
}

export { FwgTeleSalesPrivateRoutes }
