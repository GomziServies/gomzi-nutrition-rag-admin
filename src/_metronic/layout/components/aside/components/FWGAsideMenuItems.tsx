/* eslint-disable react/jsx-no-target-blank */
import {
	faBriefcase,
	faCartArrowDown,
	faComment,
	faCreditCard,
	faDumbbell,
	faEdit,
	faHandHoldingUsd,
	faHeadset,
	faHome,
	faMapMarkerAlt,
	faMusic,
	faPaperPlane,
	faShop,
	faStar,
	faUser,
	faUserTie,
	faUtensils,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function FWGAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/fwg/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>
			<div className='menu-item'>
				<div className='menu-content pt-8 pb-2'>
					<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Finance</span>
				</div>
			</div>
			<AsideMenuItem
				to='/fwg/sales-list'
				Icon={faHandHoldingUsd}
				title='Total Sales'
			/>
			<AsideMenuItem
				to='/fwg/create-invoice'
				Icon={faEdit}
				title='Generate Invoice'
			/>
			<AsideMenuItem
				to='/fwg/expense'
				Icon={faCreditCard}
				title='Expense'
			/>

			<div className='menu-item'>
				<div className='menu-content pt-8 pb-2'>
					<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Automation</span>
				</div>
			</div>

			<AsideMenuItemWithSub
				to=''
				title='Automation System'
				Icon={faPaperPlane}>
				<AsideMenuItem
					to='automation/broadcast/list'
					title='Broadcast List'
					hasBullet={true}
				/>
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
				<AsideMenuItem
					to='automation/broadcast/active-chats'
					title='Active Chats'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			<div className='menu-item'>
				<div className='menu-content pt-8 pb-2'>
					<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Chat</span>
				</div>
			</div>
			<AsideMenuItem
				to='/fwg/chat'
				Icon={faComment}
				title='Chat'
			/>

			<div className='menu-item'>
				<div className='menu-content pt-8 pb-2'>
					<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Member Details</span>
				</div>
			</div>

			<AsideMenuItem
				to='users/admin'
				title='Admin'
				Icon={faUserTie}
			/>
			<AsideMenuItem
				to='users/user'
				title='User'
				Icon={faUser}
			/>
			<AsideMenuItem
				to='users/franchise'
				title='Franchise'
				Icon={faShop}
			/>

			{/* <div className='menu-item'>
			<div className='menu-content pt-8 pb-2'>
				<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Commission</span>
			</div>
		</div>
		<AsideMenuItemWithSub
			to='/crafted/pages'
			title='Member'
			Icon={faUsersGear}>
			<AsideMenuItem
				to='trainer-list-table'
				title='Trainer List'
				hasBullet={true}
			/>
			<AsideMenuItem
				to='general-client-list'
				title='General Clients'
				hasBullet={true}
			/>
			<AsideMenuItem
				to='pt-client-list'
				title='PT Clients'
				hasBullet={true}
			/>
		</AsideMenuItemWithSub> */}

			{/* Fitness */}
			<div className='menu-item'>
				<div className='menu-content pt-8 pb-2'>
					<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Fitness</span>
				</div>
			</div>
			<AsideMenuItem
				to='/fwg/membership-order'
				Icon={faCartArrowDown}
				title='Membership Orders'
			/>
			<AsideMenuItem
				to='/fwg/membership-abandoned-checkout'
				Icon={faCartArrowDown}
				title='Abandoned Checkouts'
			/>
			<AsideMenuItem
				to='/fwg/add-to-cart'
				Icon={faCartArrowDown}
				title='User Cart'
			/>
			<AsideMenuItem
				to='/fwg/all-order'
				Icon={faCartArrowDown}
				title='Orders'
			/>

			<AsideMenuItemWithSub
				to='/crafted/pages'
				title='Feature & plan'
				Icon={faBriefcase}>
				<AsideMenuItem
					to='features'
					title='Features'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='plan-bundle-list'
					title='Plan Bundle'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='membership-plan'
					title='Membership Plan'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			<AsideMenuItemWithSub
				to=''
				title='General Diet'
				Icon={faUtensils}>
				<AsideMenuItem
					to='food-details'
					title='Food'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='food-time'
					title='Food Time'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='food-category'
					title='Food Category'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='food-bundle'
					title='Food Bundle'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='diet-details'
					title='Diet'
					hasBullet={true}
				/>
				{/* <AsideMenuItem
				to='feedback-diet'
				title='Diet Feedback'
				hasBullet={true}
			/> */}
			</AsideMenuItemWithSub>

			<AsideMenuItemWithSub
				to='/crafted/pages'
				title='General Exercise'
				Icon={faDumbbell}>
				<AsideMenuItem
					to='exercise-details'
					title='Exercise'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='exercise-bundle'
					title='Exercise Bundle'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='exercise-plan'
					title='Exercise Plan'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='exercise-approve'
					title='Exercise Approve'
					hasBullet={true}
				/>
				{/* <AsideMenuItem
				to='exercise-feedback'
				title='Exercise Feedback'
				hasBullet={true}
			/> */}
			</AsideMenuItemWithSub>

			<div className='menu-item'>
				<div className='menu-content pt-8 pb-2'>
					<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Tele Member</span>
				</div>
			</div>

			<AsideMenuItem
				to='/fwg/follow-up-report-dashboard'
				Icon={faBriefcase}
				title='Follow Up Report '
			/>

			<div className='menu-item'>
				<div className='menu-content pt-8 pb-2'>
					<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Other</span>
				</div>
			</div>

			<AsideMenuItem
				to='/fwg/complaint-assistant-fwg'
				Icon={faHeadset}
				title='Complaint or Assistant'
			/>
			<AsideMenuItem
				Icon={faStar}
				to='app-feedback-fwg'
				title='App Feedback'
			/>
			<AsideMenuItem
				Icon={faMusic}
				to='song'
				title='Song'
			/>

			<AsideMenuItem
				Icon={faMapMarkerAlt}
				to='user-location'
				title='User Location'
			/>

			{/* Feedback */}
			{/* <div className='menu-item'>
			<div className='menu-content pt-8 pb-2'>
				<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Feedback</span>
			</div>
		</div>

		<AsideMenuItemWithSub
			to=''
			title='Feedbacks'
			Icon={faComments}>
			<AsideMenuItem
				to='user-feedback'
				title='User Feedback'
				hasBullet={true}
			/>
			<AsideMenuItem
				to='trainer-feedback'
				title='Trainer Feedback'
				hasBullet={true}
			/>
		</AsideMenuItemWithSub>

		<AsideMenuItemWithSub
			to='body-analysis'
			title='Body Analysis'
			Icon={faBriefcase}>
			<AsideMenuItem
				to='create-analysis'
				title='Create Analysis'
				hasBullet={true}
			/>
			<AsideMenuItem
				to='view-analysis'
				title='View Analysis'
				hasBullet={true}
			/>
		</AsideMenuItemWithSub> */}
			{/* Fitness End */}
		</>
	)
}
