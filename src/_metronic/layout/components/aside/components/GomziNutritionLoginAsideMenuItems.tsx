/* eslint-disable react/jsx-no-target-blank */
import {
	faCartShopping,
	faChartLine,
	faClipboardList,
	faCoins,
	faEnvelope,
	faFileInvoice,
	faHome,
	faJar,
	faWarehouse,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function GomziNutritionLoginAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/rag/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>
			{/* <AsideMenuItemWithSub
				to=''
				title='Employee'
				Icon={faUsers}>
				<AsideMenuItem
					to='/rag/employees'
					title='Employee-detail'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/rag/attendance'
					title='Attendance'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub> */}
			{/* <AsideMenuItemWithSub
				to=''
				title='Salary'
				Icon={faCoins}>
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
			</AsideMenuItemWithSub> */}
			<AsideMenuItem
				to='gomzi-nutrition-product'
				title='All Products'
				Icon={faJar}
			/>
			<AsideMenuItem
				to='/rag/add-to-cart'
				title='User Cart'
				Icon={faCartShopping}
			/>
			<AsideMenuItem
				to='/rag/abandoned-list'
				title='Abandoned Checkout'
				Icon={faJar}
			/>
			<AsideMenuItemWithSub
				to=''
				title='Invoice'
				Icon={faFileInvoice}>
				<AsideMenuItem
					to='create-invoice'
					title='Create Invoice'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='invoice-list'
					title='Invoice List'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItemWithSub
				to=''
				title='Quotation'
				Icon={faCoins}>
				<AsideMenuItem
					to='create-quotation'
					title='Create Quotation'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='quotation-list'
					title='Quotation List'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItem
				to='expense'
				title='Expense'
				Icon={faChartLine}
			/>
			<AsideMenuItem
				to='product-order'
				title='Product Order'
				Icon={faJar}
			/>
			{/* <AsideMenuItem
				to='trainer-list'
				title='Trainer List'
				Icon={faDumbbell}
			/>
			<AsideMenuItemWithSub
				to=''
				title='Reference Coupon'
				Icon={faTags}>
				<AsideMenuItem
					to='manage-coupon'
					title='Manage Coupon'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub> */}

			{/* Tele Report*/}
			{/* <AsideMenuItemWithSub
						to=''
						title='Tele Report'
						Icon={faHeadset}>
						<AsideMenuItem
							to='view-tele-report'
							title='View Tele Report'
							hasBullet={true}
						/>
						<AsideMenuItem
							to='tele-report-list'
							title='Tele Report List'
							hasBullet={true}
						/>
					</AsideMenuItemWithSub> */}

			{/* <AsideMenuItemWithSub
						to=''
						title='Automation System'
						Icon={faPaperPlane}>
						<AsideMenuItem
							to='automation/contact/list'
							title='Contact List'
							hasBullet={true}
						/>
						<AsideMenuItem
							to='automation/group-management'
							title='Brands & Groups'
							hasBullet={true}
						/>
					</AsideMenuItemWithSub> */}
			<AsideMenuItem
				to='/rag/inventory'
				title='Inventory'
				Icon={faWarehouse}
			/>
			<AsideMenuItem
				to='/rag/sample-booking'
				title='Sample Booking'
				Icon={faClipboardList}
			/>
			<AsideMenuItem
				to='/rag/contact-inquiry/contact'
				title='Contact Inquiry'
				Icon={faEnvelope}
			/>
		</>
	)
}
