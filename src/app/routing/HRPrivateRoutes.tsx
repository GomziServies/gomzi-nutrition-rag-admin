import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import { HRAttendance } from '../pages/hr/attendance/attendance'
import AttendanceViewUser from '../pages/hr/attendance/attendance-view'
import HRChatPage from '../pages/hr/chat/ChatPage'
import DailyReportList from '../pages/hr/daily reporting/daily-report-list'
import { DailyReportView } from '../pages/hr/daily reporting/daily-report-view'
import { DashboardHR } from '../pages/hr/dashboard/dashboard-hr'
import { HREmployeeAdd } from '../pages/hr/employee/employee-add'
import HREmployeeDetail from '../pages/hr/employee/employee-detail'
import { HREmployeeMemo } from '../pages/hr/employee/employee-memo'
import { HREmployeeRatting } from '../pages/hr/employee/employee-rating'
import { HRMemberDetail } from '../pages/hr/employee/employee-view'
import ExpenseReportsList from '../pages/hr/expenses/expenseReportsList'
import ExpenseView from '../pages/hr/expenses/expenseView'
import GlsAttendenceList from '../pages/hr/gls-employee-detail/attendance/attendence-list'
import GlsAttendenceView from '../pages/hr/gls-employee-detail/attendance/attendence-view'
import GlsEmployeeSalary from '../pages/hr/gls-employee-detail/employee-salary/employee-salary'
import GlsEmployeeSalaryView from '../pages/hr/gls-employee-detail/employee-salary/employee-salary-view'
import GlsEmployeeAdd from '../pages/hr/gls-employee-detail/employee/employee-add'
import GlsEmployeeDetail from '../pages/hr/gls-employee-detail/employee/employee-detail'
import GlsEmployeeView from '../pages/hr/gls-employee-detail/employee/employee-view'
import HiringRequest from '../pages/hr/hiring-request/HiringRequest'
import HRLead from '../pages/hr/leads/leads'
import HRLeave from '../pages/hr/leave/leave'
import HRManualLeave from '../pages/hr/manual-leave/manualLeave'
import CreateMemo from '../pages/hr/memo/create-memo'
import MemoList from '../pages/hr/memo/memo-list'
import RBACManagement from '../pages/hr/rbac/RBACManagement'
import RBACSetup from '../pages/hr/rbac/RBACSetup'
import HRReports from '../pages/hr/reports/reports'
import { HREmployeeSalary as HRSalaryData } from '../pages/hr/salary-data/salary-data'
import HRSalaryDataView from '../pages/hr/salary-data/salary-data-view'
import { SalarySlipAdd } from '../pages/hr/salary-slip/salary-slip-add'
import { SalarySlipEdit } from '../pages/hr/salary-slip/salary-slip-edit'
import { SalarySlipList } from '../pages/hr/salary-slip/salary-slip-list'
import { SalarySlipView } from '../pages/hr/salary-slip/salary-slip-view'
import { HREmployeeSalary } from '../pages/hr/salary/employee-salary'
import HREmployeeSalaryView from '../pages/hr/salary/employee-salary-view'
import HRAssignSopList from '../pages/hr/sop/AssignSopList'
import HRTarget from '../pages/hr/target/target'
import HRAssignTaskList from '../pages/hr/task/AssignTaskList'
import HRTaskAdd from '../pages/hr/task/TaskAdd'
import HRTaskView from '../pages/hr/task/TaskView'
import ManagerDetailsView from '../pages/hr/team-management/ManagerDetailsView'
import ManagerRatingView from '../pages/hr/team-management/ManagerRatingView'
import ManagerTasksView from '../pages/hr/team-management/ManagerTasksView'
import TaskAdd from '../pages/hr/team-management/TaskAdd'
import TeamManagement from '../pages/hr/team-management/TeamManagement'
import TeamRatingView from '../pages/hr/team-management/TeamRatingView'
import TeamTasksView from '../pages/hr/team-management/TeamTasksView'
import ContactInquiry from '../pages/gomzi-nutrition/contact-inquiry/contact'
import ContactInquiryView from '../pages/gomzi-nutrition/contact-inquiry/contact-inquiry-view'
import ProPartnerInquiry from '../pages/gomzi-nutrition/contact-inquiry/pro-partner'

const HRPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<DashboardHR />}
				/>
				<Route
					path='employee-detail'
					element={<HREmployeeDetail />}
				/>
				<Route
					path='employee-add'
					element={<HREmployeeAdd />}
				/>
				<Route
					path='employee-view'
					element={<HRMemberDetail />}
				/>
				<Route
					path='employee-memo'
					element={<HREmployeeMemo />}
				/>
				<Route
					path='employee-ratting'
					element={<HREmployeeRatting />}
				/>
				<Route
					path='task-list'
					element={<HRAssignTaskList />}
				/>
				<Route
					path='task-add'
					element={<HRTaskAdd />}
				/>
				<Route
					path='task-view'
					element={<HRTaskView />}
				/>
				<Route
					path='sop-list'
					element={<HRAssignSopList />}
				/>
				<Route
					path='reports'
					element={<HRReports />}
				/>
				<Route
					path='lead'
					element={<HRLead />}
				/>
				<Route
					path='leave'
					element={<HRLeave />}
				/>
				<Route
					path='target'
					element={<HRTarget />}
				/>
				<Route
					path='attendance'
					element={<HRAttendance />}
				/>
				<Route
					path='attendance-view'
					element={<AttendanceViewUser />}
				/>
				<Route
					path='expenses-list'
					element={<ExpenseReportsList />}
				/>
				<Route
					path='expense-view'
					element={<ExpenseView />}
				/>
				<Route
					path='employee-salary'
					element={<HREmployeeSalary />}
				/>
				<Route
					path='employee-salary-view'
					element={<HREmployeeSalaryView />}
				/>
				<Route
					path='salary-data'
					element={<HRSalaryData />}
				/>
				<Route
					path='salary-data-view'
					element={<HRSalaryDataView />}
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
					path='manual-leave'
					element={<HRManualLeave />}
				/>
				<Route
					path='create-memo'
					element={<CreateMemo />}
				/>
				<Route
					path='memo-list'
					element={<MemoList />}
				/>

				{/* contact-inquiry */}
				<Route
					path='contact-inquiry/contact'
					element={<ContactInquiry />}
				/>
				<Route
					path='contact-inquiry/contact-inquiry-view'
					element={<ContactInquiryView />}
				/>
				<Route
					path='contact-inquiry/pro-partner'
					element={<ProPartnerInquiry />}
				/>
				<Route
					path='pro-partner'
					element={<ProPartnerInquiry />}
				/>

				{/* Page Not Found */}
				<Route
					path='*'
					element={<Navigate to='/error/404' />}
				/>

				{/* GLS Employee Routes */}
				<Route
					path='gls-employees'
					element={<GlsEmployeeDetail />}
				/>
				<Route
					path='gls-employees-add'
					element={<GlsEmployeeAdd />}
				/>
				<Route
					path='gls-employees-view'
					element={<GlsEmployeeView />}
				/>

				{/* GLS Attendance Routes */}
				<Route
					path='gls-attendance'
					element={<GlsAttendenceList />}
				/>
				<Route
					path='gls-attendance-view'
					element={<GlsAttendenceView />}
				/>

				{/* GLS Salary Routes */}
				<Route
					path='gls-employee-salary'
					element={<GlsEmployeeSalary />}
				/>
				<Route
					path='gls-employees-salary-view'
					element={<GlsEmployeeSalaryView />}
				/>

				{/* Salary Slip Routes */}
				<Route
					path='salary-slip'
					element={<SalarySlipList />}
				/>
				<Route
					path='salary-slip-add'
					element={<SalarySlipAdd />}
				/>
				<Route
					path='salary-slip-view'
					element={<SalarySlipView />}
				/>
				<Route
					path='salary-slip-edit'
					element={<SalarySlipEdit />}
				/>

				{/* Team Management */}
				<Route
					path='team-management'
					element={<TeamManagement />}
				/>
				<Route
					path='manager-details'
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
					path='manager-tasks-view'
					element={<ManagerTasksView />}
				/>
				<Route
					path='manager-rating'
					element={<ManagerRatingView />}
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
				{/* Authority Management */}
				<Route
					path='authority-management'
					element={<RBACManagement />}
				/>
				<Route
					path='authority-setup'
					element={<RBACSetup />}
				/>
			</Route>

			<Route
				path='hr-chat'
				element={<HRChatPage />}
			/>
		</Routes>
	)
}

export { HRPrivateRoutes }
