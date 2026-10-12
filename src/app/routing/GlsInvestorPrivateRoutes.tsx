import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import { InvestorDashboard } from '../pages/gls-investor/dashboard/InvestorDashboard'
import ExpenseList from '../pages/gls-investor/expense/expense-list'
import ExpenseView from '../pages/gls-investor/expense/expense-view'
import InvestorDocumentView from '../pages/gls-investor/InvestorDocumentView'
import GlsInvestorInvoiceList from '../pages/gls-investor/invoice/invoice-list'
import { InvestorMatrixList } from '../pages/gls-investor/matrix/matrix-list'
import GlsInvestorProductOrder from '../pages/gls-investor/product-order/product-order'
import GlsInvestorQuotationList from '../pages/gls-investor/quotation/quotation-list'
import InvestorTotalSalesList from '../pages/gls-investor/total-sales/totalsales-list'
import { InvestorViewInvoice } from '../pages/gls-investor/total-sales/view-invoice'
import { ProductOrderView } from '../pages/gomzi-nutrition/product/product-order-view'

const GlsInvestorPrivateRoutes: React.FC = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<InvestorDashboard />}
				/>
				<Route
					path='invoice-list'
					element={<GlsInvestorInvoiceList />}
				/>
				<Route
					path='quotation-list'
					element={<GlsInvestorQuotationList />}
				/>
				<Route
					path='total-sales'
					element={<InvestorTotalSalesList />}
				/>
				<Route
					path='sales-list/view-invoice'
					element={<InvestorViewInvoice />}
				/>
				<Route
					path='expense'
					element={<ExpenseList />}
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
				<Route
					path='document-view'
					element={<InvestorDocumentView />}
				/>
				{/* Product Order paths mapped to Gomzi Nutrition components */}
				<Route
					path='product-order'
					element={<GlsInvestorProductOrder />}
				/>
				<Route
					path='product-order-view'
					element={<ProductOrderView />}
				/>
			</Route>
		</Routes>
	)
}

export default GlsInvestorPrivateRoutes
