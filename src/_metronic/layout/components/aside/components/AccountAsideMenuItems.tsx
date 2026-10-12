import {
	faCoins,
	faExchangeAlt,
	faFileInvoice,
	faHandHoldingUsd,
	faHome,
	faListCheck,
} from '@fortawesome/free-solid-svg-icons'
import { useLocation } from 'react-router-dom'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function AccountAsideMenuItems() {
	const { pathname } = useLocation()

	return (
		<>
			<AsideMenuItem
				to='/account/dashboard'
				Icon={faHome}
				title='Dashboard'
				isActive={pathname === '/account/dashboard'}
			/>
			<AsideMenuItem
				to='/account/withdrawal-requests'
				Icon={faHandHoldingUsd}
				title='Withdrawal Requests'
				isActive={pathname === '/account/withdrawal-requests'}
			/>
			<AsideMenuItem
				to='/account/transactions'
				Icon={faExchangeAlt}
				title='Transactions'
				isActive={pathname === '/account/transactions'}
			/>
			<AsideMenuItem
				to='/account/sales-person-coins'
				Icon={faCoins}
				title='All Sales Balance'
				isActive={pathname === '/account/sales-person-coins'}
			/>
			<AsideMenuItem
				to='/account/create-commission'
				Icon={faHandHoldingUsd}
				title='Create Commission'
				isActive={pathname === '/account/create-commission'}
			/>
			<AsideMenuItem
				to='/account/auto-commission-requests'
				Icon={faListCheck}
				title='Auto Commission'
				isActive={pathname === '/account/auto-commission-requests'}
			/>
			<AsideMenuItemWithSub
				to='/account/invoice'
				title='Invoices'
				Icon={faFileInvoice}>
				<AsideMenuItem
					to='/account/invoice/fgiit'
					title='FGIIT'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/account/invoice/fwg'
					title='FWG'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/account/invoice/gomzi-nutrition'
					title='Gomzi Nutrition'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
		</>
	)
}
