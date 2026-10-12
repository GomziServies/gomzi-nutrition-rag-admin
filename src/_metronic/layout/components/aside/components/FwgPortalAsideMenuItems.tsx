/* eslint-disable react/jsx-no-target-blank */
import {
	faBriefcase,
	faComment,
	faCreditCard,
	faDumbbell,
	faEdit,
	faHandHoldingUsd,
	faHome,
	faUsers,
	faUtensils,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function FwgPortalAsideMenuItems() {
	return (
		<>
			<>
				<AsideMenuItem
					to='/fwg/dashboard'
					Icon={faHome}
					title='Dashboard'
				/>
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
				</AsideMenuItemWithSub>
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
				<AsideMenuItemWithSub
					to=''
					title='User Pages'
					Icon={faUsers}>
					<AsideMenuItem
						to='users/user'
						title='User'
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
				</AsideMenuItemWithSub>

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
					</AsideMenuItemWithSub> */}
				{/* Fitness End */}
			</>
		</>
	)
}
