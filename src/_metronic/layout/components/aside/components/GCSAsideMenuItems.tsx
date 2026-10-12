/* eslint-disable react/jsx-no-target-blank */
import { faChartLine, faFile, faHeadset, faHome, faLaptop, faUsers } from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function GCSAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/gcs/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>
			<AsideMenuItem
				to='/gcs/lead'
				Icon={faUsers}
				title='Lead'
			/>
			<AsideMenuItem
				Icon={faChartLine}
				to='gcs-expense-details'
				title='Expense'
			/>

			<AsideMenuItemWithSub
				to='/gcs/pages'
				title='Invoice'
				Icon={faFile}>
				<AsideMenuItem
					to='gcs-invoice/create-invoice'
					title='Generate Invoice'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='gcs-invoice/total-sales'
					title='Total Sales'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItem
				to='/gcs/contact'
				Icon={faLaptop}
				title='Inquiry'
			/>
			<AsideMenuItem
				to='/gcs/users'
				Icon={faUsers}
				title='Users'
			/>
			<AsideMenuItem
				to='/gcs/users'
				Icon={faUsers}
				title='Users'
				/>
			<AsideMenuItem
				Icon={faHeadset}
				to='/gcs/complaint-assistant-gcs'
				title='Complaint or Assistant'
			/>
		</>
	)
}
