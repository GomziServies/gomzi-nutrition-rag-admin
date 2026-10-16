/* eslint-disable react/jsx-no-target-blank */
import {
	faBullhorn,
	faCartShopping,
	faChartLine,
	faClipboardCheck,
	faClipboardList,
	faCoins,
	faDumbbell,
	faEnvelope,
	faFileInvoice,
	faHeadset,
	faHome,
	faImage,
	faIndustry,
	faJar,
	faStar,
	faTags,
	faBookOpen,
	faUserCog,
	faUsers,
	faUserTie,
	faWarehouse,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function GomziNutritionAsideMenuItems() {
	const currentPanel = localStorage.getItem('admin_type')
	const isMasterAdmin = currentPanel === 'MASTER'

	return (
		<>
			{/* 1. Dashboard */}
			<AsideMenuItem
				to='/rag/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>

			<AsideMenuItem
				to='/rag/hero-banner'
				Icon={faImage}
				title='Hero Banner'
			/>

			<AsideMenuItem
				to='/rag/blogs'
				Icon={faBookOpen}
				title='Blogs & Journal'
			/>

			<AsideMenuItem
				to='/rag/deals'
				Icon={faTags}
				title='Trending Deals'
			/>

			<AsideMenuItem
				to='/rag/promo-banners'
				Icon={faSliders}
				title='Promo Sliders'
			/>

			{isMasterAdmin && (
				<AsideMenuItem
					to='/rag/admin'
					Icon={faUserCog}
					title='Admin User'
				/>
			)}

			{/* 2. Products & Catalog */}
			<AsideMenuItemWithSub
				to=''
				title='Products & Orders'
				Icon={faJar}>
				<AsideMenuItem
					to='/rag/product-list'
					title='All Products'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/categories'
					title='Product Categories'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/product-add'
					title='Add Product'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/product-order'
					title='Product Orders'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/add-to-cart'
					title='User Cart'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/abandoned-list'
					title='Abandoned Checkout'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/product-feedback'
					title='Product Feedback'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 3. Invoices */}
			<AsideMenuItemWithSub
				to=''
				title='Invoices'
				Icon={faFileInvoice}>
				<AsideMenuItem
					to='/rag/create-invoice'
					title='Create Invoice'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/invoice-list'
					title='Invoice List'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 4. Quotations */}
			<AsideMenuItemWithSub
				to=''
				title='Quotations'
				Icon={faCoins}>
				<AsideMenuItem
					to='/rag/create-quotation'
					title='Create Quotation'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/quotation-list'
					title='Quotation List'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 5. Inventory & Stock */}
			<AsideMenuItemWithSub
				to=''
				title='Inventory & Stock'
				Icon={faWarehouse}>
				<AsideMenuItem
					to='/rag/manage-inventory'
					title='Manage Inventory'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/inventory-history'
					title='Inventory History'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/stock'
					title='Stock List'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 6. Manufacturing & Procurement */}
			<AsideMenuItemWithSub
				to=''
				title='Raw Materials & Supply'
				Icon={faIndustry}>
				<AsideMenuItem
					to='/rag/gn-inventory/table-view'
					title='Production Formula'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/gn-inventory/raw-material-suppliers'
					title='Material Suppliers'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/gn-inventory/raw-material-suppliers-invoice'
					title='Supplier Invoices'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/gn-inventory/procurement'
					title='Procurement'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/gn-inventory/production-details'
					title='Production Batches'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/gn-inventory/design-approve-system'
					title='Design Approval'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/gn-inventory/product-dispatch-billing-details'
					title='Dispatch & Billing'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 7. Sample Bookings */}
			<AsideMenuItemWithSub
				to=''
				title='Sample Bookings'
				Icon={faClipboardCheck}>
				<AsideMenuItem
					to='/rag/sample-booking'
					title='Booking List'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/sample-booking-add'
					title='Add Booking'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 8. Expenses */}
			<AsideMenuItemWithSub
				to=''
				title='Expenses'
				Icon={faChartLine}>
				<AsideMenuItem
					to='/rag/expense'
					title='Expense Details'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/expense/create'
					title='Create Expense'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 9. Users & Customers */}
			<AsideMenuItemWithSub
				to=''
				title='Users'
				Icon={faUsers}>
				<AsideMenuItem
					to='/rag/users'
					title='All Users'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/users/add-user'
					title='Add User'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 10. Staff & Employees */}
			<AsideMenuItemWithSub
				to=''
				title='Staff Management'
				Icon={faUserTie}>
				<AsideMenuItem
					to='/rag/employees'
					title='Employee List'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/employee-add'
					title='Add Employee'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/attendance'
					title='Attendance'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/employee-salary'
					title='Employee Salary'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/salary-data'
					title='Salary Data'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 11. Trainers */}
			<AsideMenuItemWithSub
				to=''
				title='Trainers'
				Icon={faDumbbell}>
				<AsideMenuItem
					to='/rag/trainer-list'
					title='Trainer List'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/add-trainer'
					title='Add Trainer'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 12. Reference Coupons */}
			<AsideMenuItemWithSub
				to=''
				title='Reference Coupon'
				Icon={faTags}>
				<AsideMenuItem
					to='/rag/manage-coupon'
					title='Manage Coupons'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/manage-coupon/reference'
					title='Reference Details'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 13. Reports & Inquiries */}
			<AsideMenuItemWithSub
				to=''
				title='Follow Up & Helpdesk'
				Icon={faHeadset}>
				<AsideMenuItem
					to='/rag/follow-up-report-dashboard'
					title='Follow Up Dashboard'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/follow-up-report-list'
					title='Follow Up Reports'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/contact-inquiry/contact'
					title='Contact Inquiries'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* 14. Marketing & Broadcast */}
			<AsideMenuItemWithSub
				to=''
				title='Broadcast Marketing'
				Icon={faBullhorn}>
				<AsideMenuItem
					to='/rag/automation/broadcast/list'
					title='Broadcast List'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/automation/contact/list'
					title='Contact List'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/automation/broadcast/active-chats'
					title='Active Chats'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
		</>
	)
}

