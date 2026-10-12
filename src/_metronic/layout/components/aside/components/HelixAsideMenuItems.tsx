/* eslint-disable react/jsx-no-target-blank */
import {
	faHome,
	faUser,
	faHeadset,
	faPaperPlane,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function HelixAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/helix/follow-up-report-list'
				title='Follow Up Report'
				Icon={faHeadset}
			/>

			<AsideMenuItem
				to='/helix/contact-inquiry/contact'
				Icon={faUser}
				title='Contact Inquiry'
			/>

			<AsideMenuItemWithSub
				to=''
				title='Automation System'
				Icon={faPaperPlane}>
				<AsideMenuItem
					to='/helix/automation/broadcast/list'
					title='Broadcast List'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/helix/automation/contact/list'
					title='Contact List'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/helix/automation/group-management'
					title='Brands & Groups'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/helix/automation/broadcast/active-chats'
					title='Active Chats'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
		</>
	)
}
