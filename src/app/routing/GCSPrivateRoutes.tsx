import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import { GcsDashboard } from '../pages/gcs/dashboard/dashboard-gcs'
import { AddExpenseGcs } from '../pages/gcs/gcs-expense/create-expense'
import ExpenseListDetails from '../pages/gcs/gcs-expense/expense-details'
import GCSInquiryList from '../pages/gcs/gcs-inquiry/gcs-inquiry-list'
import GCSInquiryView from '../pages/gcs/gcs-inquiry/gcs-inquiry-view'
import CreateInvoicePageGcs from '../pages/gcs/generate-invoice/create-invoice-gcs'
import TotalSalesListGcs from '../pages/gcs/generate-invoice/total-sales'
import UpdateInvoicePageGcs from '../pages/gcs/generate-invoice/update-invoice'
import GcsLead from '../pages/gcs/lead/lead'
import GCSUsers from '../pages/gcs/users/users'
import { GCSUserView } from '../pages/gcs/users/view-user'
import ComplaintAssistantGCS from '../pages/gcs/complaint-assistant/complaint-assistant'
import ComplaintAssistantViewGCS from '../pages/gcs/complaint-assistant/complaint-assistant-view'

const GCSPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<GcsDashboard />}
				/>
				<Route
					path='contact'
					element={<GCSInquiryList />}
				/>
				<Route
					path='contact/contact-view'
					element={<GCSInquiryView />}
				/>
				<Route
					path='gcs-create-expense'
					element={<AddExpenseGcs />}
				/>
				<Route
					path='gcs-expense-details'
					element={<ExpenseListDetails />}
				/>
				<Route
					path='gcs-invoice/create-invoice'
					element={<CreateInvoicePageGcs />}
				/>
				<Route
					path='gcs-expense-update'
					element={<AddExpenseGcs />}
				/>
				<Route
					path='gcs-invoice/total-sales'
					element={<TotalSalesListGcs />}
				/>
				<Route
					path='gcs-invoice/update-invoice'
					element={<UpdateInvoicePageGcs />}
				/>
				<Route
					path='lead'
					element={<GcsLead />}
				/>
				<Route
					path='users'
					element={<GCSUsers />}
				/>
				<Route
					path='users/view-user'
					element={<GCSUserView />}
				/>
				<Route
					path='complaint-assistant-gcs'
					element={<ComplaintAssistantGCS />}
				/>
				<Route
					path='complaint-assistant-gcs-view'
					element={<ComplaintAssistantViewGCS />}
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

export { GCSPrivateRoutes }
