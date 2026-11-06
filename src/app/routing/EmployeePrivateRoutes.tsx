import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import EmployeeChatPage from '../pages/employee/chat/ChatPage'
import DailyReportList from '../pages/employee/daily reporting/daily-report-list'
import DailyReportUpdate from '../pages/employee/daily reporting/daily-report-update'
import { DailyReportView } from '../pages/employee/daily reporting/daily-report-view'
import { DashboardEmployee } from '../pages/employee/dashboard/employee-dashboard'
import EmployeeDocument from '../pages/employee/document/document'
import EmployeeExpenseCreate from '../pages/employee/expenses/expenseCreate'
import EmployeeExpenseEdit from '../pages/employee/expenses/expenseEdit'
import EmployeeExpenseReportsList from '../pages/employee/expenses/expenseReportsList'
import EmployeeExpenseView from '../pages/employee/expenses/expenseView'
import HiringRequest from '../pages/employee/hiring-request/HiringRequest'
import EmployeeLead from '../pages/employee/lead/lead'
import EmployeeLeaveManager from '../pages/employee/leave-manager/leave-manager'
import EmployeeRatingManager from '../pages/employee/rating-manager/rating-manager'
import EmployeeReport from '../pages/employee/report/report'
import EmployeeSOP from '../pages/employee/sop/sop'
import EmployeeTarget from '../pages/employee/target/target'
import EmployeeTask from '../pages/employee/task/task'
import { TaskView } from '../pages/employee/task/task-view'
import ManagerDetailsView from '../pages/employee/team-management/ManagerDetailsView'
import TaskAdd from '../pages/employee/team-management/TaskAdd'
import TeamRatingView from '../pages/employee/team-management/TeamRatingView'
import TeamTasksView from '../pages/employee/team-management/TeamTasksView'
import AutoCommissionRequestsPage from '../pages/employee/wallet/auto-commission-requests'
import FgroupInvoicePage from '../pages/employee/wallet/fgroup-invoice'
import InvoicePage from '../pages/employee/wallet/Invoice'
import NutritionInvoicePage from '../pages/employee/wallet/nutrition-invoice'
import Transactions from '../pages/employee/wallet/transactions'
import { isProPartnerOnlyUser } from '../modules/auth'

const EmployeePrivateRoutes = () => {
	if (isProPartnerOnlyUser()) {
		return <Navigate to='/rag/pro-partner/coupons' replace />
	}
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<DashboardEmployee />}
				/>
				<Route
					path='report'
					element={<EmployeeReport />}
				/>
				<Route
					path='task'
					element={<EmployeeTask />}
				/>
				<Route
					path='task-view'
					element={<TaskView />}
				/>
				<Route
					path='lead'
					element={<EmployeeLead />}
				/>
				<Route
					path='document'
					element={<EmployeeDocument />}
				/>
				<Route
					path='sop'
					element={<EmployeeSOP />}
				/>
				<Route
					path='target'
					element={<EmployeeTarget />}
				/>
				<Route
					path='daily-report'
					element={<DailyReportList />}
				/>
				<Route
					path='daily-report-view'
					element={<DailyReportView />}
				/>
				<Route
					path='daily-report-update'
					element={<DailyReportUpdate />}
				/>
				<Route
					path='expenses-list'
					element={<EmployeeExpenseReportsList />}
				/>
				<Route
					path='expense-view'
					element={<EmployeeExpenseView />}
				/>
				<Route
					path='expense-create'
					element={<EmployeeExpenseCreate />}
				/>
				<Route
					path='expense-edit'
					element={<EmployeeExpenseEdit />}
				/>
				<Route
					path='leave-manager'
					element={<EmployeeLeaveManager />}
				/>
				<Route
					path='rating-manager'
					element={<EmployeeRatingManager />}
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

				{/* Team Management */}

				<Route
					path='manager-details-view'
					element={<ManagerDetailsView />}
				/>
				<Route
					path='team-tasks'
					element={<TeamTasksView />}
				/>
				<Route
					path='team-task-add'
					element={<TaskAdd />}
				/>
				<Route
					path='team-rating'
					element={<TeamRatingView />}
				/>
				{/* Hiring Request */}
				<Route
					path='hiring-request'
					element={<HiringRequest />}
				/>

				{/* Page Not Found */}
				<Route
					path='*'
					element={<Navigate to='/error/404' />}
				/>
			</Route>

			<Route
				path='employee-chat'
				element={<EmployeeChatPage />}
			/>
		</Routes>
	)
}

export { EmployeePrivateRoutes }
