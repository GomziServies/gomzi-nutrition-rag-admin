import { Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import Transactions from '../pages/account/transactions/transactions'
import AutoCommissionRequestsPage from '../pages/employee/wallet/auto-commission-requests'
import FgroupInvoicePage from '../pages/employee/wallet/fgroup-invoice'
import InvoicePage from '../pages/employee/wallet/Invoice'
import NutritionInvoicePage from '../pages/employee/wallet/nutrition-invoice'
import { AddAdminUser } from '../pages/fgiit/admin-user/add-admin-user'
import { AdminProfileView } from '../pages/fgiit/admin-user/admin-profile-view'
import AdminUserList from '../pages/fgiit/admin-user/admin-user-list'
import { EditAdminUser } from '../pages/fgiit/admin-user/edit-admin-user'
import BroadcastActiveChats from '../pages/fgiit/broadcast-active-chats/broadcast-active-chats'
import GroupManagement from '../pages/fgiit/broadcast-contact/brand-and-group-management'
import BroadcastList from '../pages/fgiit/broadcast/broadcast-list'
import CreateBroadcastTemplate from '../pages/fgiit/broadcast/create-broadcast'
import SendBroadcastTemplate from '../pages/fgiit/broadcast/send-broadcast'
import AllOrder from '../pages/fgiit/orders/all-order/all-order'
import { OrderView } from '../pages/fgiit/orders/all-order/order-view'
import AddUserForm from '../pages/fgiit/users/users/add-user'
import Users from '../pages/fgiit/users/users/users'
import { UserView } from '../pages/fgiit/users/users/view-user'
import { TrainerDashboard } from '../pages/gomzi-nutrition-trainer/dashboard/DashboardWrapper'
import TrainerManageCoupon from '../pages/gomzi-nutrition-trainer/reference-coupon/manage-coupon'
import TrainerReference from '../pages/gomzi-nutrition-trainer/reference-coupon/reference'
import AbandonedList from '../pages/gomzi-nutrition/abandoned-list/abandoned-list'
import AddToCart from '../pages/gomzi-nutrition/add-to-cart/add-to-cart'
import AttendenceList from '../pages/gomzi-nutrition/attendance/attendence-list'
import AttendenceView from '../pages/gomzi-nutrition/attendance/attendence-view'
import ContactList from '../pages/gomzi-nutrition/broadcast-contact/contact-list'
import ContactInquiry from '../pages/gomzi-nutrition/contact-inquiry/contact'
import ContactInquiryView from '../pages/gomzi-nutrition/contact-inquiry/contact-inquiry-view'
import { GomziNutritionDashboard } from '../pages/gomzi-nutrition/dashboard/DashboardWrapper'
import EmployeeSalary from '../pages/gomzi-nutrition/employee-salary/employee-salary'
import EmployeeSalaryView from '../pages/gomzi-nutrition/employee-salary/employee-salary-view'
import EmployeeAdd from '../pages/gomzi-nutrition/employee/employee-add'
import EmployeeDetail from '../pages/gomzi-nutrition/employee/employee-detail'
import EmployeeView from '../pages/gomzi-nutrition/employee/employee-view'
import { AddExpenseNutrition } from '../pages/gomzi-nutrition/expense/create-expense'
import ExpenseListDetailsNutrition from '../pages/gomzi-nutrition/expense/expense-details'
import NutritionProductFeedback from '../pages/gomzi-nutrition/feedback/product-feedback'
import AddFollowUpReport from '../pages/gomzi-nutrition/follow-up-report/add-follow-up-report'
import FollowUpReportDashboard from '../pages/gomzi-nutrition/follow-up-report/follow-up-report-dashboard'
import FollowUpReportInnerList from '../pages/gomzi-nutrition/follow-up-report/follow-up-report-inner-list'
import FollowUpReportList from '../pages/gomzi-nutrition/follow-up-report/follow-up-report-list'
import UpdateFollowUpReport from '../pages/gomzi-nutrition/follow-up-report/update-follow-up-report'
import ViewFollowUpReport from '../pages/gomzi-nutrition/follow-up-report/view-follow-up-report'
import GnDesignApproveSystemCreate from '../pages/gomzi-nutrition/gn-inventory/gn-design-approve-system/gn-design-approve-system-create'
import GnDesignApproveSystemUpdate from '../pages/gomzi-nutrition/gn-inventory/gn-design-approve-system/gn-design-approve-system-update'
import GnDesignApproveSystemView from '../pages/gomzi-nutrition/gn-inventory/gn-design-approve-system/gn-design-approve-system-view'
import GNInventoryItem from '../pages/gomzi-nutrition/gn-inventory/gn-inventory-item/gn-inventory-item-list'
import GNInventoryStockList from '../pages/gomzi-nutrition/gn-inventory/gn-nutrition-inventory-stock/gn-nutriton-inventory-stock-list'
import GNNutritionTableCreate from '../pages/gomzi-nutrition/gn-inventory/gn-nutrition-table/gn-table-create'
import GNNutritionTableEdit from '../pages/gomzi-nutrition/gn-inventory/gn-nutrition-table/gn-table-edit'
import GNNutritionTableView from '../pages/gomzi-nutrition/gn-inventory/gn-nutrition-table/gn-table-view'
import { GomziNutritionProductDispatchDetailsAdd } from '../pages/gomzi-nutrition/gn-inventory/gn-order-dispatch-billing-details/gn-order-dispatch-billing-details-add'
import { GomziNutritionProductDispatchDetailsEdit } from '../pages/gomzi-nutrition/gn-inventory/gn-order-dispatch-billing-details/gn-order-dispatch-billing-details-edit'
import GNProcurementAdd from '../pages/gomzi-nutrition/gn-inventory/gn-procurement/gn-procurement-add'
import GNProcurementEdit from '../pages/gomzi-nutrition/gn-inventory/gn-procurement/gn-procurement-edit'
import GNProcurementView from '../pages/gomzi-nutrition/gn-inventory/gn-procurement/gn-procurement-view'
import GNInventoryProductionDetailsAdd from '../pages/gomzi-nutrition/gn-inventory/gn-production-details/gn-nutriton-inventory-production-details-add'
import GNInventoryProductionDetailsUpdate from '../pages/gomzi-nutrition/gn-inventory/gn-production-details/gn-nutriton-inventory-production-details-update'
import GNInventoryProductionDetailsView from '../pages/gomzi-nutrition/gn-inventory/gn-production-details/gn-nutriton-inventory-production-details-view'
import GomziNutritionMaterialSuppliersInvoiceAdd from '../pages/gomzi-nutrition/gn-inventory/gn-raw-material-suppliers-invoice/gn-raw-material-suppliers-invoice-add'
import GomziNutritionMaterialSuppliersInvoiceEdit from '../pages/gomzi-nutrition/gn-inventory/gn-raw-material-suppliers-invoice/gn-raw-material-suppliers-invoice-edit'
import GomziNutritionMaterialSuppliersInvoiceList from '../pages/gomzi-nutrition/gn-inventory/gn-raw-material-suppliers-invoice/gn-raw-material-suppliers-invoice-list'
import GomziNutritionMaterialSuppliersInvoiceView from '../pages/gomzi-nutrition/gn-inventory/gn-raw-material-suppliers-invoice/gn-raw-material-suppliers-invoice-view'
import { GomziNutritionMaterialSuppliersAdd } from '../pages/gomzi-nutrition/gn-inventory/gn-raw-material-suppliers/gn-raw-material-suppliers-add'
import { GomziNutritionMaterialSupplierEdit } from '../pages/gomzi-nutrition/gn-inventory/gn-raw-material-suppliers/gn-raw-material-suppliers-edit'
import GomziNutritionMaterialSuppliersList from '../pages/gomzi-nutrition/gn-inventory/gn-raw-material-suppliers/gn-raw-material-suppliers-list'
import Inventory from '../pages/gomzi-nutrition/gn-inventory/inventory'
import GnViewList from '../pages/gomzi-nutrition/gn-inventory/inventory-view'
import { AddGomziNutritionProduct } from '../pages/gomzi-nutrition/gomzi-nutrition/add-gomzi-nutrition-product'
import { AddGomziNutritionVariationProduct } from '../pages/gomzi-nutrition/gomzi-nutrition/add-product-variation'
import { EditGomziNutritionProduct } from '../pages/gomzi-nutrition/gomzi-nutrition/edit-gomzi-nutrition-product'
import { EditGomziNutritionVariationProduct } from '../pages/gomzi-nutrition/gomzi-nutrition/edit-product-variation'
import GomziNutritionProductList from '../pages/gomzi-nutrition/gomzi-nutrition/gomzi-nutrition-product-list'
import GomziNutritionProductVariationList from '../pages/gomzi-nutrition/gomzi-nutrition/product-variation-list'
import NutritionCreateInvoice from '../pages/gomzi-nutrition/invoice/create-invoice'
import NutritionTotalSalesList from '../pages/gomzi-nutrition/invoice/total-sales'
import NutritionUpdateInvoice from '../pages/gomzi-nutrition/invoice/update-invoice'
import NutritionViewInvoice from '../pages/gomzi-nutrition/invoice/view-invoice'
import InventoryLogList from '../pages/gomzi-nutrition/product-inventory/InventoryLogList'
import ManageInventory from '../pages/gomzi-nutrition/product-inventory/ManageInventory'
import { NutritionOrderView } from '../pages/gomzi-nutrition/product/all-order/order-view'
import ProductOrder from '../pages/gomzi-nutrition/product/product-order'
import { ProductOrderView } from '../pages/gomzi-nutrition/product/product-order-view'
import NutritionCreateQuotation from '../pages/gomzi-nutrition/quotation/create-quotation'
import QuotationList from '../pages/gomzi-nutrition/quotation/quotation-list'
import NutritionUpdateQuotation from '../pages/gomzi-nutrition/quotation/update-quotation'
import ManageCoupon from '../pages/gomzi-nutrition/reference-coupon/manage-coupon'
import Reference from '../pages/gomzi-nutrition/reference-coupon/reference'
import SalaryData from '../pages/gomzi-nutrition/salary-data/salary-data'
import SalaryDataView from '../pages/gomzi-nutrition/salary-data/salary-data-view'
import SampleBookingAdd from '../pages/gomzi-nutrition/sample-booking/sample-booking-add'
import SampleBookingList from '../pages/gomzi-nutrition/sample-booking/sample-booking-list'
import SampleBookingUpdate from '../pages/gomzi-nutrition/sample-booking/sample-booking-update'
import SampleBookingView from '../pages/gomzi-nutrition/sample-booking/sample-booking-view'
import GomziNutritionProductStock from '../pages/gomzi-nutrition/stock/gomzi-product-stock-list'
import { GomziNutritionAddTrainer } from '../pages/gomzi-nutrition/trainers/add-trainer'
import GomziNutritionTrainerDetail from '../pages/gomzi-nutrition/trainers/trainer-list'
import HeroBannerManage from '../pages/gomzi-nutrition/hero-banner/hero-banner-manage'
import CategoryManage from '../pages/gomzi-nutrition/categories/category-manage'
import BlogManage from '../pages/gomzi-nutrition/blogs/blog-manage'
import DealManage from '../pages/gomzi-nutrition/deals/deal-manage'
import PromoBannerManage from '../pages/gomzi-nutrition/promo-banners/promo-banner-manage'

const GomziNutritionPrivateRoutes = () => {
	return (
		<Routes>
			<Route element={<MasterLayout />}>
				<Route
					path='dashboard'
					element={<GomziNutritionDashboard />}
				/>
				<Route
					path='/hero-banner'
					element={<HeroBannerManage />}
				/>
				<Route
					path='/categories'
					element={<CategoryManage />}
				/>
				<Route
					path='/blogs'
					element={<BlogManage />}
				/>
				<Route
					path='/deals'
					element={<DealManage />}
				/>
				<Route
					path='/promo-banners'
					element={<PromoBannerManage />}
				/>
				<Route
					path='/users'
					element={<Users />}
				/>
				<Route
					path='users/view-user'
					element={<UserView />}
				/>
				<Route
					path='users/add-user'
					element={<AddUserForm />}
				/>
				<Route
					path='/product-list'
					element={<GomziNutritionProductList />}
				/>
				<Route
					path='/product-add'
					element={<AddGomziNutritionProduct />}
				/>
				<Route
					path='/all-order'
					element={<AllOrder />}
				/>
				<Route
					path='/all-order/view-order'
					element={<OrderView />}
				/>
				<Route
					path='/product-edit'
					element={<EditGomziNutritionProduct />}
				/>
				<Route
					path='/product-list/variation-list'
					element={<GomziNutritionProductVariationList />}
				/>
				<Route
					path='/product-list/variation-edit'
					element={<EditGomziNutritionVariationProduct />}
				/>
				<Route
					path='/product-list/variation-add'
					element={<AddGomziNutritionVariationProduct />}
				/>
				<Route
					path='/admin'
					element={<AdminUserList />}
				/>
				<Route
					path='/admin-user-edit'
					element={<EditAdminUser />}
				/>
				<Route
					path='/admin-user-add'
					element={<AddAdminUser />}
				/>
				<Route
					path='/admin-profile'
					element={<AdminProfileView />}
				/>
				<Route
					path='/add-to-cart'
					element={<AddToCart />}
				/>
				<Route
					path='/abandoned-list'
					element={<AbandonedList />}
				/>
				<Route
					path='/create-invoice'
					element={<NutritionCreateInvoice />}
				/>
				<Route
					path='update-invoice'
					element={<NutritionUpdateInvoice />}
				/>
				<Route
					path='/invoice-list'
					element={<NutritionTotalSalesList />}
				/>
				<Route
					path='/view-invoice'
					element={<NutritionViewInvoice />}
				/>
				<Route
					path='/invoice-view'
					element={<NutritionViewInvoice />}
				/>
				<Route
					path='/create-quotation'
					element={<NutritionCreateQuotation />}
				/>
				<Route
					path='/update-quotation'
					element={<NutritionUpdateQuotation />}
				/>
				<Route
					path='/quotation-list'
					element={<QuotationList />}
				/>
				<Route
					path='product-order'
					element={<ProductOrder />}
				/>
				<Route
					path='product-order-view'
					element={<ProductOrderView />}
				/>
				<Route
					path='/all-order/view-order'
					element={<NutritionOrderView />}
				/>
				<Route
					path='/product-feedback'
					element={<NutritionProductFeedback />}
				/>

				<Route
					path='/manage-coupon'
					element={<ManageCoupon />}
				/>
				<Route
					path='/manage-coupon/reference'
					element={<Reference />}
				/>
				<Route
					path='/manage-inventory'
					element={<ManageInventory />}
				/>

				<Route
					path='/inventory-history'
					element={<InventoryLogList />}
				/>

				<Route
					path='expense/create'
					element={<AddExpenseNutrition />}
				/>
				<Route
					path='expense'
					element={<ExpenseListDetailsNutrition />}
				/>
				<Route
					path='expense/update'
					element={<AddExpenseNutrition />}
				/>

				<Route
					path='trainer-list'
					element={<GomziNutritionTrainerDetail />}
				/>
				<Route
					path='add-trainer'
					element={<GomziNutritionAddTrainer />}
				/>
				<Route
					path='product-stock-management'
					element={<GomziNutritionProductStock />}
				/>
				<Route
					path='stock'
					element={<GomziNutritionProductStock />}
				/>

				{/* Contact list */}

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
				{/* Gn invantory routes */}

				<Route
					path='inventory'
					element={<Inventory />}
				/>
				<Route
					path='inventory/view/list'
					element={<GnViewList />}
				/>
				<Route
					path='inventory/item/list'
					element={<GNInventoryItem />}
				/>
				<Route
					path='inventory/suppliers/list'
					element={<GomziNutritionMaterialSuppliersList />}
				/>
				<Route
					path='inventory/suppliers/add'
					element={<GomziNutritionMaterialSuppliersAdd />}
				/>
				<Route
					path='inventory/suppliers/edit'
					element={<GomziNutritionMaterialSupplierEdit />}
				/>
				<Route
					path='inventory/suppliers/invoice/list'
					element={<GomziNutritionMaterialSuppliersInvoiceList />}
				/>
				<Route
					path='inventory/suppliers/invoice/add'
					element={<GomziNutritionMaterialSuppliersInvoiceAdd />}
				/>
				<Route
					path='inventory/suppliers/invoice/view'
					element={<GomziNutritionMaterialSuppliersInvoiceView />}
				/>
				<Route
					path='inventory/suppliers/invoice/edit'
					element={<GomziNutritionMaterialSuppliersInvoiceEdit />}
				/>
				<Route
					path='inventory/production-details/add'
					element={<GNInventoryProductionDetailsAdd />}
				/>
				<Route
					path='inventory/production-details/update'
					element={<GNInventoryProductionDetailsUpdate />}
				/>
				<Route
					path='inventory/production-details/view'
					element={<GNInventoryProductionDetailsView />}
				/>
				{/* <Route
					path='inventory/production-dispatch-details/list'
					element={<GomziNutritionProductDispatchDetailsList />}
				/> */}
				<Route
					path='inventory/production-dispatch-details/add'
					element={<GomziNutritionProductDispatchDetailsAdd />}
				/>
				<Route
					path='inventory/production-dispatch-details/edit'
					element={<GomziNutritionProductDispatchDetailsEdit />}
				/>
				<Route
					path='inventory/gn-label-design-approve/create'
					element={<GnDesignApproveSystemCreate />}
				/>
				<Route
					path='inventory/gn-label-design-approve/update'
					element={<GnDesignApproveSystemUpdate />}
				/>
				<Route
					path='inventory/gn-label-design-approve/view'
					element={<GnDesignApproveSystemView />}
				/>
				<Route
					path='inventory/gn-nutrition-table/add'
					element={<GNNutritionTableCreate />}
				/>
				<Route
					path='inventory/gn-nutrition-table/view'
					element={<GNNutritionTableView />}
				/>
				<Route
					path='inventory/gn-nutrition-table/edit'
					element={<GNNutritionTableEdit />}
				/>
				<Route
					path='inventory/gn-stock/list'
					element={<GNInventoryStockList />}
				/>
				<Route
					path='inventory/gn-procurement/add'
					element={<GNProcurementAdd />}
				/>
				<Route
					path='inventory/gn-procurement/edit'
					element={<GNProcurementEdit />}
				/>
				<Route
					path='inventory/gn-procurement/view'
					element={<GNProcurementView />}
				/>

				{/* gn-inventory direct & sidebar routes */}
				<Route
					path='gn-inventory/raw-material-suppliers'
					element={<GomziNutritionMaterialSuppliersList />}
				/>
				<Route
					path='gn-inventory/raw-material-suppliers-invoice'
					element={<GomziNutritionMaterialSuppliersInvoiceList />}
				/>
				<Route
					path='gn-inventory/table-view'
					element={<GNNutritionTableView />}
				/>
				<Route
					path='gn-inventory/procurement'
					element={<GNProcurementView />}
				/>
				<Route
					path='gn-inventory/production-details'
					element={<GNInventoryProductionDetailsView />}
				/>
				<Route
					path='gn-inventory/design-approve-system'
					element={<GnDesignApproveSystemView />}
				/>
				<Route
					path='gn-inventory/product-dispatch-billing-details'
					element={<GomziNutritionProductDispatchDetailsAdd />}
				/>
				{/* Employee */}
				<Route
					path='employees'
					element={<EmployeeDetail />}
				/>
				<Route
					path='employee-add'
					element={<EmployeeAdd />}
				/>
				<Route
					path='employee-view'
					element={<EmployeeView />}
				/>

				{/* Attendance */}
				<Route
					path='attendance'
					element={<AttendenceList />}
				/>
				<Route
					path='attendance-view'
					element={<AttendenceView />}
				/>

				{/* Salary */}
				<Route
					path='employee-salary'
					element={<EmployeeSalary />}
				/>
				<Route
					path='employee-salary-view'
					element={<EmployeeSalaryView />}
				/>
				<Route
					path='salary-data'
					element={<SalaryData />}
				/>
				<Route
					path='salary-data-view'
					element={<SalaryDataView />}
				/>

				{/* Sample Booking */}
				<Route
					path='sample-booking'
					element={<SampleBookingList />}
				/>
				<Route
					path='sample-booking-add'
					element={<SampleBookingAdd />}
				/>
				<Route
					path='sample-booking-view'
					element={<SampleBookingView />}
				/>
				<Route
					path='sample-booking-update'
					element={<SampleBookingUpdate />}
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
					path='/trainer/dashboard'
					element={<TrainerDashboard />}
				/>
				<Route
					path='/trainer-manage-coupon'
					element={<TrainerManageCoupon />}
				/>
				<Route
					path='/trainer-manage-coupon/reference'
					element={<TrainerReference />}
				/>
				{/* wallet */}
				<Route
					path='/trainer/invoice'
					element={<InvoicePage />}
				/>
				<Route
					path='/trainer/transactions'
					element={<Transactions />}
				/>
				<Route
					path='/trainer/wallet/gls-invoice'
					element={<NutritionInvoicePage />}
				/>
				<Route
					path='/trainer/wallet/fgiit-invoice'
					element={<FgroupInvoicePage />}
				/>
				<Route
					path='/trainer/auto-commission'
					element={<AutoCommissionRequestsPage />}
				/>
			</Route>
		</Routes>
	)
}

// const SuspensedView: FC<WithChildren> = ({ children }) => {
// 	const baseColor = getCSSVariableValue('--bs-primary')
// 	TopBarProgress.config({
// 		barColors: {
// 			'0': baseColor,
// 		},
// 		barThickness: 1,
// 		shadowBlur: 5,
// 	})
// 	return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>
// }

export { GomziNutritionPrivateRoutes }
