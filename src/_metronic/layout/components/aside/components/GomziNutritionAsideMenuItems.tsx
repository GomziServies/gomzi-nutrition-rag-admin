/* eslint-disable react/jsx-no-target-blank */
import {
	faCartShopping,
	faChartLine,
	faCoins,
	faDumbbell,
	faEnvelope,
	faFileInvoice,
	faHome,
	faJar,
	faStar,
	faTags,
	faUser,
	faUserCog,
	faUsers,
	faWarehouse,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function GomziNutritionAsideMenuItems() {
	const currentPanel = localStorage.getItem('admin_type')
	const isMasterAdmin = currentPanel === 'MASTER'

	return (
		<>
			<AsideMenuItem
				to='/rag/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>
			{isMasterAdmin && (
				<AsideMenuItem
					to='/rag/admin'
					Icon={faUserCog}
					title='Admin User'
				/>
			)}
			<AsideMenuItemWithSub
				to=''
				title='Users'
				Icon={faUsers}>
				<AsideMenuItem
					to='users'
					title='All Users'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItem
				to='/rag/product-list'
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
			<AsideMenuItemWithSub
				to=''
				title='Quotation'
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
			<AsideMenuItem
				to='/rag/expense'
				title='Expense'
				Icon={faChartLine}
			/>
			<AsideMenuItem
				to='/rag/product-order'
				title='Product Order'
				Icon={faJar}
			/>
			<AsideMenuItem
				Icon={faStar}
				to='/rag/product-feedback'
				title='Product Feedback'
			/>
			<AsideMenuItem
				to='/rag/trainer-list'
				title='Trainer List'
				Icon={faDumbbell}
			/>
			<AsideMenuItem
				to='/rag/manage-inventory'
				title='Inventory'
				Icon={faWarehouse}
			/>
			<AsideMenuItemWithSub
				to=''
				title='Reference Coupon'
				Icon={faTags}>
				<AsideMenuItem
					to='/rag/manage-coupon'
					title='Manage Coupon'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItem
				to='/rag/contact-inquiry/contact'
				Icon={faEnvelope}
				title='Contact Inquiry'
			/>
		</>
	)
}
