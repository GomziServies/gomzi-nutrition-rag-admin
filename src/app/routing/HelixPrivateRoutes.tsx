import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import BroadcastActiveChats from '../pages/helix/automation/broadcast-active-chats/broadcast-active-chats'
import GroupManagement from '../pages/helix/automation/broadcast-contact/brand-and-group-management'
import BroadcastList from '../pages/helix/automation/broadcast/broadcast-list'
import CreateBroadcastTemplate from '../pages/helix/automation/broadcast/create-broadcast'
import ContactList from '../pages/helix/automation/broadcast-contact/contact-list'
import AddFollowUpReport from '../pages/helix/follow-up-report/add-follow-up-report'
import FollowUpReportDashboard from '../pages/helix/follow-up-report/follow-up-report-dashboard'
import FollowUpReportInnerList from '../pages/helix/follow-up-report/follow-up-report-inner-list'
import FollowUpReportList from '../pages/helix/follow-up-report/follow-up-report-list'
import UpdateFollowUpReport from '../pages/helix/follow-up-report/update-follow-up-report'
import ViewFollowUpReport from '../pages/helix/follow-up-report/view-follow-up-report'
import ContactInquiry from '../pages/helix/contact-inquiry/contact'
import ContactInquiryView from '../pages/helix/contact-inquiry/contact-inquiry-view'
import SendBroadcastTemplate from '../pages/helix/automation/broadcast/send-broadcast'

const HelixPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>

				{/* Automation */}
				<Route
					path='/automation/contact/list'
					element={<ContactList />}
				/>
				<Route
					path='/automation/group-management'
					element={<GroupManagement />}
				/>
				<Route
					path='/automation/broadcast/list'
					element={<BroadcastList />}
				/>
				<Route
					path='/automation/broadcast/create-template'
					element={<CreateBroadcastTemplate />}
				/>
				<Route
					path='/automation/broadcast/send-template'
					element={<SendBroadcastTemplate />}
				/>
				<Route
					path='/automation/broadcast/active-chats'
					element={<BroadcastActiveChats />}
				/>

				{/* Follow Up Report */}
				<Route
					path='/follow-up-report-dashboard'
					element={<FollowUpReportDashboard />}
				/>
				<Route
					path='/follow-up-report-list'
					element={<FollowUpReportList />}
				/>
				<Route
					path='/add-follow-up-report'
					element={<AddFollowUpReport />}
				/>
				<Route
					path='/update-follow-up-report'
					element={<UpdateFollowUpReport />}
				/>
				<Route
					path='/follow-up-report-inner-list'
					element={<FollowUpReportInnerList />}
				/>
				<Route
					path='/view-follow-up-report'
					element={<ViewFollowUpReport />}
				/>

				{/* contact-inquiry  */}
				<Route
					path='contact-inquiry/contact'
					element={<ContactInquiry />}
				/>
				<Route
					path='contact-inquiry/contact-inquiry-view'
					element={<ContactInquiryView />}
				/>

				<Route
					path='*'
					element={<Navigate to='follow-up-report-list' />}
				/>
			</Route>
		</Routes>
	)
}

export { HelixPrivateRoutes }
