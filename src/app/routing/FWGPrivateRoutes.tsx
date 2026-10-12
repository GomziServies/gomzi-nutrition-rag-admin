import { FC, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TopBarProgress from 'react-topbar-progress-indicator'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import BroadcastActiveChats from '../pages/fgiit/broadcast-active-chats/broadcast-active-chats'
import GroupManagement from '../pages/fgiit/broadcast-contact/brand-and-group-management'
import BroadcastList from '../pages/fgiit/broadcast/broadcast-list'
import CreateBroadcastTemplate from '../pages/fgiit/broadcast/create-broadcast'
import SendBroadcastTemplate from '../pages/fgiit/broadcast/send-broadcast'
import AddToCart from '../pages/fwg/add-to-cart/add-to-cart'
import AppFeedbackFWG from '../pages/fwg/app-feedback/app-feedback'
import { CreateAnalysis } from '../pages/fwg/body-analysis/create-analysis'
import { EditAnalysis } from '../pages/fwg/body-analysis/edit-analysis'
import ViewAnalysis from '../pages/fwg/body-analysis/view-analysis'
import BookOrder from '../pages/fwg/book/book-order'
import { BookOrderView } from '../pages/fwg/book/book-order-view'
import { BookUserOrderView } from '../pages/fwg/book/book-user-order-view'
import { OrderView } from '../pages/fwg/book/order-view'
import ContactList from '../pages/fwg/broadcast-contact/contact-list'
import ChatPage from '../pages/fwg/chat/ChatPage'
import ComplaintAssistantFWG from '../pages/fwg/complaint-assistant/complaint-assistant'
import ComplaintAssistantViewFWG from '../pages/fwg/complaint-assistant/complaint-assistant-view'
import { DashboardWrapper } from '../pages/fwg/dashboard/DashboardWrapper'
import { AddExpense } from '../pages/fwg/expense/add-expense'
import ExpenseList from '../pages/fwg/expense/expense-list'
import { UpdateExpensePage } from '../pages/fwg/expense/update-expense'
import Features from '../pages/fwg/features/features'
import { ViewFeatures } from '../pages/fwg/features/view-features'
import TrainerFeedback from '../pages/fwg/feedback/trainer-feedback'
import UserFeedback from '../pages/fwg/feedback/user-feedback'
import AddFollowUpReport from '../pages/fwg/follow-up-report/add-follow-up-report'
import FollowUpReportDashboard from '../pages/fwg/follow-up-report/follow-up-report-dashboard'
import FollowUpReportInnerList from '../pages/fwg/follow-up-report/follow-up-report-inner-list'
import FollowUpReportList from '../pages/fwg/follow-up-report/follow-up-report-list'
import UpdateFollowUpReport from '../pages/fwg/follow-up-report/update-follow-up-report'
import ViewFollowUpReport from '../pages/fwg/follow-up-report/view-follow-up-report'
import GeneralClientList from '../pages/fwg/general-client/general-client-list'
import AssignFood from '../pages/fwg/general-diet/assign-food'
import DietsDetails from '../pages/fwg/general-diet/diet'
import DietAssign from '../pages/fwg/general-diet/diet-assign'
import DietCreate from '../pages/fwg/general-diet/diet-create'
import DietEdit from '../pages/fwg/general-diet/diet-edit'
import DietFeedback from '../pages/fwg/general-diet/diet-feedback'
import Food from '../pages/fwg/general-diet/food'
import FoodBundle from '../pages/fwg/general-diet/food-bundle'
import FoodBundleItem from '../pages/fwg/general-diet/food-bundle-item'
import FoodCategory from '../pages/fwg/general-diet/food-category'
import FoodTime from '../pages/fwg/general-diet/food-time'
import AddExerciseBundle from '../pages/fwg/general-exercise/add-exercise-plan'
import Exercise from '../pages/fwg/general-exercise/exercise'
import ExerciseApprove from '../pages/fwg/general-exercise/exercise-approve'
import ExerciseBundle from '../pages/fwg/general-exercise/exercise-bundle'
import ExerciseBundleAssign from '../pages/fwg/general-exercise/exercise-bundle-assign'
import ExerciseBundleItem from '../pages/fwg/general-exercise/exercise-bundle-item'
import ExerciseFeedback from '../pages/fwg/general-exercise/exercise-feedback'
import ExercisePlan from '../pages/fwg/general-exercise/exercise-plan'
import { AddMembershipPlan } from '../pages/fwg/membership-plan/add-membership-plan'
import MembershipPlan from '../pages/fwg/membership-plan/membership-plan'
import { ViewMembershipPlan } from '../pages/fwg/membership-plan/view-membership-plan'
import AllOrderFWG from '../pages/fwg/order/all-order'
import MembershipAbandonedCheckoutFWG from '../pages/fwg/order/membership-abandoned-checkout'
import MembershipOrderFWG from '../pages/fwg/order/membership-order'
import { OrderViewFWG } from '../pages/fwg/order/order-view'
import PlanBundleList from '../pages/fwg/plan-bundle/plan-bundle-list'
import { ViewPlanBundle } from '../pages/fwg/plan-bundle/view-plan-bundle'
import PTClientList from '../pages/fwg/pt-clients/pt-client-list'
import SongPage from '../pages/fwg/song/song'
import CreateInvoice from '../pages/fwg/total-sales/create-invoice'
import TotalSalesList from '../pages/fwg/total-sales/totalsales-list'
import UpdateInvoice from '../pages/fwg/total-sales/update-invoice'
import { AddTrainer } from '../pages/fwg/trainer-list/add-trainer'
import TrainerListTable from '../pages/fwg/trainer-list/trainer-list-table'
import FWGUserLocationList from '../pages/fwg/user-location/user-location-list'
import { AddFranchise } from '../pages/fwg/user/add-franchise'
import { AddUser } from '../pages/fwg/user/add-user'
import { AddUserAdmin } from '../pages/fwg/user/admin/admin-add'
import AdminAssign from '../pages/fwg/user/admin/admin-assign'
import { AdminDetails } from '../pages/fwg/user/admin/admin-details'
import AdminList from '../pages/fwg/user/admin/admin-list'
import FranchiseList from '../pages/fwg/user/franchise-list'
import FranchiseUser from '../pages/fwg/user/franchise-user'
import UserAssignPlan from '../pages/fwg/user/user-assign-plan'
import UserListTable from '../pages/fwg/user/user-list'
import { ViewFranchise } from '../pages/fwg/user/view-franchise'
import { ViewUserDetails } from '../pages/fwg/user/view-user-details'
import { MenuTestPage } from '../pages/MenuTestPage'
const FWGPrivateRoutes = () => {
	const UsersPage = lazy(() => import('../modules/apps/user-management/UsersPage'))

	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<DashboardWrapper />}
				/>
				<Route
					path='expense'
					element={<ExpenseList />}
				/>
				<Route
					path='expense-update'
					element={<UpdateExpensePage />}
				/>
				<Route
					path='create-invoice'
					element={<CreateInvoice />}
				/>
				<Route
					path='sales-list/update-invoice'
					element={<UpdateInvoice />}
				/>
				<Route
					path='sales-list'
					element={<TotalSalesList />}
				/>
				<Route
					path='expense-add'
					element={<AddExpense />}
				/>
				<Route
					path='menu-test'
					element={<MenuTestPage />}
				/>
				<Route
					path='trainer-list-table'
					element={<TrainerListTable />}
				/>
				<Route
					path='add-trainer'
					element={<AddTrainer />}
				/>
				<Route
					path='general-client-list'
					element={<GeneralClientList />}
				/>
				<Route
					path='pt-client-list'
					element={<PTClientList />}
				/>
				<Route
					path='features'
					element={<Features />}
				/>
				<Route
					path='feature-view'
					element={<ViewFeatures />}
				/>
				<Route
					path='plan-bundle-list'
					element={<PlanBundleList />}
				/>
				<Route
					path='plan-bundle-view'
					element={<ViewPlanBundle />}
				/>
				<Route
					path='membership-plan'
					element={<MembershipPlan />}
				/>
				<Route
					path='add-membership-plan'
					element={<AddMembershipPlan />}
				/>
				<Route
					path='view-membership-plan'
					element={<ViewMembershipPlan />}
				/>
				{/* user list start */}
				<Route
					path='users/user'
					element={<UserListTable />}
				/>
				<Route
					path='users/user-add'
					element={<AddUser />}
				/>
				<Route
					path='users/user-view-details'
					element={<ViewUserDetails />}
				/>
				<Route
					path='users/user-assign-plan'
					element={<UserAssignPlan />}
				/>
				<Route
					path='users/admin'
					element={<AdminList />}
				/>
				<Route
					path='users/admin-assign'
					element={<AdminAssign />}
				/>
				<Route
					path='users/admin-details'
					element={<AdminDetails />}
				/>
				<Route
					path='users/admin-add'
					element={<AddUserAdmin />}
				/>
				{/* user list end */}
				{/* exercise list start */}
				<Route
					path='exercise-bundle'
					element={<ExerciseBundle />}
				/>
				<Route
					path='exercise-plan'
					element={<ExercisePlan />}
				/>
				<Route
					path='exercise-bundle-item'
					element={<ExerciseBundleItem />}
				/>
				<Route
					path='exercise-bundle-assign'
					element={<ExerciseBundleAssign />}
				/>
				<Route
					path='add-exercise-plan'
					element={<AddExerciseBundle />}
				/>
				<Route
					path='exercise-feedback'
					element={<ExerciseFeedback />}
				/>
				{/* exercise list end */}
				{/* franchise list start */}
				<Route
					path='users/franchise'
					element={<FranchiseList />}
				/>
				<Route
					path='users/franchise-add'
					element={<AddFranchise />}
				/>
				<Route
					path='users/franchise-view'
					element={<ViewFranchise />}
				/>
				<Route
					path='users/franchise-user'
					element={<FranchiseUser />}
				/>
				{/* franchise list end */}
				<Route
					path='food-time'
					element={<FoodTime />}
				/>
				<Route
					path='food-category'
					element={<FoodCategory />}
				/>
				<Route
					path='food-details'
					element={<Food />}
				/>
				<Route
					path='food-bundle'
					element={<FoodBundle />}
				/>
				<Route
					path='food-bundle-item'
					element={<FoodBundleItem />}
				/>
				<Route
					path='diet-details'
					element={<DietsDetails />}
				/>
				<Route
					path='diet-details/assign-food'
					element={<AssignFood />}
				/>
				<Route
					path='diet-details/diet-create'
					element={<DietCreate />}
				/>
				<Route
					path='diet-details/diet-edit'
					element={<DietEdit />}
				/>
				<Route
					path='diet-details/diet-assign'
					element={<DietAssign />}
				/>
				<Route
					path='feedback-diet'
					element={<DietFeedback />}
				/>
				{/* exercise list start */}
				<Route
					path='exercise-bundle'
					element={<ExerciseBundle />}
				/>
				<Route
					path='exercise-plan'
					element={<ExercisePlan />}
				/>
				<Route
					path='exercise-bundle-item'
					element={<ExerciseBundleItem />}
				/>
				<Route
					path='exercise-bundle-assign'
					element={<ExerciseBundleAssign />}
				/>
				<Route
					path='add-exercise-plan'
					element={<AddExerciseBundle />}
				/>
				<Route
					path='exercise-details'
					element={<Exercise />}
				/>
				<Route
					path='exercise-approve'
					element={<ExerciseApprove />}
				/>
				{/* Chat */}
				{/* <Route
					path='chat'
					element={<ChatPage />}
				/> */}
				{/* Feddback list */}
				<Route
					path='user-feedback'
					element={<UserFeedback />}
				/>
				<Route
					path='trainer-feedback'
					element={<TrainerFeedback />}
				/>
				<Route
					path='create-analysis'
					element={<CreateAnalysis />}
				/>
				<Route
					path='edit-analysis'
					element={<EditAnalysis />}
				/>
				<Route
					path='view-analysis'
					element={<ViewAnalysis />}
				/>
				{/* FGIIT Route Added */}
				<Route
					path='/book-order'
					element={<BookOrder />}
				/>
				<Route
					path='/book-order-view'
					element={<BookOrderView />}
				/>
				<Route
					path='/book-user-order-view'
					element={<BookUserOrderView />}
				/>
				<Route
					path='/book/all-order/view-order'
					element={<OrderView />}
				/>
				<Route
					path='/complaint-assistant-fwg'
					element={<ComplaintAssistantFWG />}
				/>
				<Route
					path='/complaint-assistant-view-fwg'
					element={<ComplaintAssistantViewFWG />}
				/>
				<Route
					path='/app-feedback-fwg'
					element={<AppFeedbackFWG />}
				/>
				<Route
					path='/song'
					element={<SongPage />}
				/>
				<Route
					path='/all-order'
					element={<AllOrderFWG />}
				/>
				<Route
					path='/all-order/view-order'
					element={<OrderViewFWG />}
				/>
				<Route
					path='/membership-order'
					element={<MembershipOrderFWG />}
				/>
				<Route
					path='/membership-abandoned-checkout'
					element={<MembershipAbandonedCheckoutFWG />}
				/>
				<Route
					path='user-location'
					element={<FWGUserLocationList />}
				/>
				{/* Broadcast Contact */}
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
					path='/add-follow-up-report'
					element={<AddFollowUpReport />}
				/>
				<Route
					path='/follow-up-report-dashboard'
					element={<FollowUpReportDashboard />}
				/>
				<Route
					path='/follow-up-report-list'
					element={<FollowUpReportList />}
				/>
				<Route
					path='/follow-up-report-inner-list'
					element={<FollowUpReportInnerList />}
				/>
				<Route
					path='/view-follow-up-report'
					element={<ViewFollowUpReport />}
				/>
				<Route
					path='/update-follow-up-report'
					element={<UpdateFollowUpReport />}
				/>
				{/* Cart */}
				<Route
					path='/add-to-cart'
					element={<AddToCart />}
				/>
				{/* Lazy Modules */}
				<Route
					path='apps/user-management/*'
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

			{/* Chat */}

			<Route
				path='chat'
				element={<ChatPage />}
			/>
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

export { FWGPrivateRoutes }
