/* eslint-disable react/jsx-no-target-blank */
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AsideMenuItem } from '../AsideMenuItem'

export function AutomationAsideMenuItems() {
	return (
		<>
			{/* Automation System start*/}
			<div className='menu-item'>
				<div className='menu-content pt-8 pb-2'>
					<span className='menu-section text-muted text-uppercase fs-8 ls-1 d-flex align-items-center gap-2'>
						<FontAwesomeIcon icon={faPaperPlane as any} />
						Automation System
					</span>
				</div>
			</div>
			<AsideMenuItem
				to='/automation/broadcast/list'
				title='Broadcast List'
			/>
			<AsideMenuItem
				to='/automation/contact/list'
				title='Contact List'
			/>
			<AsideMenuItem
				to='/automation/brand-and-group-management'
				title='Brands & Groups'
			/>
			<AsideMenuItem
				to='/automation/broadcast/active-chats'
				title='Active Chats'
			/>
			<AsideMenuItem
				to='/automation/fwg/follow-up-report-list'
				title='FWG Follow Up'
			/>
			<AsideMenuItem
				to='/automation/gn/follow-up-report-list'
				title='Nutrition Follow Up'
			/>
			{/* Automation System End*/}
		</>
	)
}
