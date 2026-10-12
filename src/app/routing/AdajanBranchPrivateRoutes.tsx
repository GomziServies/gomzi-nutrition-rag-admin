import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import AdajanBranchClientAdd from '../pages/adajan-branch/client/adajan-branch-client-add'
import AdajanBranchClientEdit from '../pages/adajan-branch/client/adajan-branch-client-edit'
import AdajanBranchClientList from '../pages/adajan-branch/client/adajan-branch-client-list'
import AdajanBranchCLientView from '../pages/adajan-branch/client/adajan-branch-client-view'
import { DashboardAdajanBranch } from '../pages/adajan-branch/dashboard/adajan-branch-dashboard'
import { AdajanBranchEmployeeAdd } from '../pages/adajan-branch/employee/adajan-branch-employee-add'
// import AdajanBranchTrainerAssign from '../pages/adajan-branch/trainer-assign/adajan-branch-trainer-assign'
import AdajanBranchEmployeeList from '../pages/adajan-branch/employee/adajan-branch-employee-list'
import { AdajanBranchEmployeeView } from '../pages/adajan-branch/employee/adajan-branch-employee-view'
import { AdajanBranchEmployeeSalary } from '../pages/adajan-branch/salary/adajan-branch-salary'
import { AdajanBranchEmployeeSalaryView } from '../pages/adajan-branch/salary/adajan-branch-salary-view'
import AdajanBranchTrainerAssign from '../pages/adajan-branch/trainer/adajan-branch-trainer-assign'
import AdajanBranchTrainerList from '../pages/adajan-branch/trainer/adajan-branch-trainer-list'
import { AdajanBranchExpenseList } from '../pages/adajan-branch/expense/expense-list'
import { AdajanBranchExpenseAdd } from '../pages/adajan-branch/expense/expense-add'
import { AdajanBranchExpenseEdit } from '../pages/adajan-branch/expense/expense-edit'
import { AdajanBranchAttendenceList } from '../pages/adajan-branch/attendance/attendence-list'
import AdajanBranchAttendenceView from '../pages/adajan-branch/attendance/attendence-view'
import CreateInvoicePage from '../pages/adajan-branch/total-sales/create-invoice'
import UpdateInvoicePage from '../pages/adajan-branch/total-sales/update-invoice'
import TotalSalesList from '../pages/adajan-branch/total-sales/totalsales-list'

// import AdajanBranchTrainerList from '../pages/adajan-branch/trainer-assign/adajan-branch-trainer-list'
// Adajan branch private routes

const AdajanBranchPrivateRoutes: React.FC = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<DashboardAdajanBranch />}
				/>
				<Route
					path='client/list'
					element={<AdajanBranchClientList />}
				/>
				<Route
					path='client/add'
					element={<AdajanBranchClientAdd />}
				/>
				<Route
					path='client/view'
					element={<AdajanBranchCLientView />}
				/>
				<Route
					path='client/edit'
					element={<AdajanBranchClientEdit />}
				/>
				<Route
					path='trainer/list'
					element={<AdajanBranchTrainerList />}
				/>
				<Route
					path='trainer/assign'
					element={<AdajanBranchTrainerAssign />}
				/>
				<Route
					path='attendance/list'
					element={<AdajanBranchAttendenceList />}
				/>
				<Route
					path='attendance/view'
					element={<AdajanBranchAttendenceView />}
				/>

				<Route
					path='employee/list'
					element={<AdajanBranchEmployeeList />}
				/>
				<Route
					path='employee/add'
					element={<AdajanBranchEmployeeAdd />}
				/>

				<Route
					path='employee/view'
					element={<AdajanBranchEmployeeView />}
				/>

				<Route
					path='employee-salary'
					element={<AdajanBranchEmployeeSalary />}
				/>

				<Route
					path='employee-salary-view'
					element={<AdajanBranchEmployeeSalaryView />}
				/>

				<Route
					path='expense/list'
					element={<AdajanBranchExpenseList />}
				/>
				<Route
					path='expense/add'
					element={<AdajanBranchExpenseAdd />}
				/>
				<Route
					path='expense/edit'
					element={<AdajanBranchExpenseEdit />}
				/>
				<Route
					path='create-invoice'
					element={<CreateInvoicePage />}
				/>
				<Route
					path='sales-list/update-invoice'
					element={<UpdateInvoicePage />}
				/>
				<Route
					path='sales-list'
					element={<TotalSalesList />}
				/>
			</Route>
		</Routes>
	)
}

export default AdajanBranchPrivateRoutes
