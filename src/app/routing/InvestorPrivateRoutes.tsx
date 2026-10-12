import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import { InvestorDashboard } from '../pages/Investor/dashboard/InvestorDashboard'
import TotalSalesList from '../pages/Investor/total-sales/totalsales-list'
import ViewInvoicePage from '../pages/Investor/total-sales/view-invoice'

import ExpenseList from '../pages/Investor/expense/expense-list'
import ExpenseView from '../pages/Investor/expense/expense-view'
import InvestorMatrixList from '../pages/Investor/matrix/matrix-list'
import { InvestorAttendenceList } from '../pages/Investor/attendance/attendence-list'
import { InvestorAttendenceView } from '../pages/Investor/attendance/attendence-view'


const InvestorPrivateRoutes: React.FC = () => {
    return (
        <Routes>
            <Route element={<MasterLayout />}>
                <Route
                    path='dashboard'
                    element={<InvestorDashboard />}
                />
                <Route
                    path='total-sales'
                    element={<TotalSalesList />}
                />
                <Route
                    path='sales-list/view-invoice'
                    element={<ViewInvoicePage />}
                />
                <Route
                    path='attendance/list'
                    element={<InvestorAttendenceList />}
                />
                <Route
                    path='attendance/view'
                    element={<InvestorAttendenceView />}
                />
                <Route
                    path='expense/list'
                    element={<ExpenseList />}
                />
                <Route
                    path='expense/view'
                    element={<ExpenseView />}
                />
                <Route
                    path='matrix/list'
                    element={<InvestorMatrixList />}
                />
            </Route>
        </Routes>
    )
}

export default InvestorPrivateRoutes
