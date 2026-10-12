import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import FwgAddFollowUpReport from '../pages/fwg-tele-sales/follow-up-report/add-follow-up-report'
import FwgFollowUpReportInnerList from '../pages/fwg-tele-sales/follow-up-report/follow-up-report-inner-list'
// FWG Automation Follow-Up Report
import FwgFollowUpReportList from '../pages/fwg-tele-sales/follow-up-report/follow-up-report-list'
import FwgUpdateFollowUpReport from '../pages/fwg-tele-sales/follow-up-report/update-follow-up-report'
import FwgViewFollowUpReport from '../pages/fwg-tele-sales/follow-up-report/view-follow-up-report'
import GnAddFollowUpReport from '../pages/gn-tele-sales/follow-up-report/add-follow-up-report'
import GnFollowUpReportInnerList from '../pages/gn-tele-sales/follow-up-report/follow-up-report-inner-list'
// GN Automation Follow-Up Report
import GnFollowUpReportList from '../pages/gn-tele-sales/follow-up-report/follow-up-report-list'
import GnUpdateFollowUpReport from '../pages/gn-tele-sales/follow-up-report/update-follow-up-report'
import GnViewFollowUpReport from '../pages/gn-tele-sales/follow-up-report/view-follow-up-report'
import BroadcastActiveChats from '../pages/fgiit/broadcast-active-chats/broadcast-active-chats'
import BrandAndGroupManagement from '../pages/fgiit/broadcast-contact/brand-and-group-management'
import ContactList from '../pages/fgiit/broadcast-contact/contact-list'
import BroadcastList from '../pages/fgiit/broadcast/broadcast-list'
import CreateBroadcastTemplate from '../pages/fgiit/broadcast/create-broadcast'
import SendBroadcastTemplate from '../pages/fgiit/broadcast/send-broadcast'
import ViewTeleReportInnerList from '../pages/fgiit/tele-report/tele-report-inner-list'
import ViewTeleReportList from '../pages/fgiit/tele-report/tele-report-list'
import ViewTeleReport from '../pages/fgiit/tele-report/view-tele-report'

const AutomationPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				{/* Broadcast */}
				<Route
					path='broadcast/list'
					element={<BroadcastList />}
				/>
				<Route
					path='broadcast/create-template'
					element={<CreateBroadcastTemplate />}
				/>
				<Route
					path='broadcast/send-template'
					element={<SendBroadcastTemplate />}
				/>
				<Route
					path='contact/list'
					element={<ContactList />}
				/>
				<Route
					path='brand-and-group-management'
					element={<BrandAndGroupManagement />}
				/>
				<Route
					path='broadcast/active-chats'
					element={<BroadcastActiveChats />}
				/>

				{/* Tele Report */}
				<Route
					path='tele-report-list'
					element={<ViewTeleReportList />}
				/>
				<Route
					path='tele-report-inner-list'
					element={<ViewTeleReportInnerList />}
				/>
				<Route
					path='view-tele-report'
					element={<ViewTeleReport />}
				/>

				{/* FWG Follow-Up Report */}
				<Route
					path='fwg/follow-up-report-list'
					element={<FwgFollowUpReportList />}
				/>
				<Route
					path='fwg/follow-up-report-inner-list'
					element={<FwgFollowUpReportInnerList />}
				/>
				<Route
					path='fwg/add-follow-up-report'
					element={<FwgAddFollowUpReport />}
				/>
				<Route
					path='fwg/update-follow-up-report'
					element={<FwgUpdateFollowUpReport />}
				/>
				<Route
					path='fwg/view-follow-up-report'
					element={<FwgViewFollowUpReport />}
				/>

				{/* GN Follow-Up Report */}
				<Route
					path='gn/follow-up-report-list'
					element={<GnFollowUpReportList />}
				/>
				<Route
					path='gn/follow-up-report-inner-list'
					element={<GnFollowUpReportInnerList />}
				/>
				<Route
					path='gn/add-follow-up-report'
					element={<GnAddFollowUpReport />}
				/>
				<Route
					path='gn/update-follow-up-report'
					element={<GnUpdateFollowUpReport />}
				/>
				<Route
					path='gn/view-follow-up-report'
					element={<GnViewFollowUpReport />}
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

export { AutomationPrivateRoutes }
