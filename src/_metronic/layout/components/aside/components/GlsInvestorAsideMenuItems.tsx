/* eslint-disable react/jsx-no-target-blank */
import {
	faChartLine,
	faCoins,
	faFileInvoice,
	faHome,
	faJar,
	faTable,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function GlsInvestorAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/gls-investor/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>
			<AsideMenuItemWithSub
				to=''
				title='Invoice'
				Icon={faFileInvoice}>
				<AsideMenuItem
					to='/gls-investor/invoice-list'
					title='Invoice List'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItemWithSub
				to=''
				title='Quotation'
				Icon={faCoins}>
				<AsideMenuItem
					to='/gls-investor/quotation-list'
					title='Quotation List'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItem
				to='/gls-investor/expense'
				Icon={faChartLine}
				title='Expense'
			/>
			<AsideMenuItem
				to='/gls-investor/product-order'
				Icon={faJar}
				title='Product Order'
			/>
			<AsideMenuItem
				to='/gls-investor/matrix/list'
				Icon={faTable}
				title='Matrix List'
			/>
		</>
	)
}
