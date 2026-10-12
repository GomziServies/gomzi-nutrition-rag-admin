/* eslint-disable react/jsx-no-target-blank */
import { faChartLine, faFileInvoice, faHome, faJar } from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function StoreNutritionAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/rag/dashboard'
				Icon={faHome}
				title='Dashboard'
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
			<AsideMenuItem
				to='expense'
				title='Expense'
				Icon={faChartLine}
			/>
			<AsideMenuItem
				to='product-stock-management'
				title='Product Stock'
				Icon={faJar}
			/>
		</>
	)
}
