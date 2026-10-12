/* eslint-disable react/jsx-no-target-blank */
import { faCoins, faComments, faHeadset, faPhone } from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function GomziNutritionTeleSalesAsideMenuItems() {
	return (
		<>
			{/* Follow Up Report*/}
			<AsideMenuItem
				to='follow-up-report-list'
				title='Follow Up Report'
				Icon={faHeadset}></AsideMenuItem>

			{/* Quotation */}
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

			{/* Caller Desk */}
			<AsideMenuItemWithSub
				to=''
				title='Caller Desk'
				Icon={faPhone}>
				<AsideMenuItem
					to='caller-desk-dashboard'
					title='Dashboard'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='caller-desk-reports'
					title='Call Logs'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* Active Chats */}
			<AsideMenuItem
				to='automation/broadcast/active-chats'
				title='Active Chats'
				Icon={faComments}
			/>
		</>
	)
}
