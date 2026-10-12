/* eslint-disable react/jsx-no-target-blank */
import {
	faBook,
	faBuildingCircleCheck,
	faCalendarDays,
	faCartArrowDown,
	faCartShopping,
	faChartLine,
	faFileInvoice,
	faHeadset,
	faHome,
	faJar,
	faMapMarkerAlt,
	faPaperPlane,
	faStar,
	faUser,
	faUserCog,
	faUsers,
	faWandMagic,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function FgiitLoginAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/fgiit/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>
			<AsideMenuItem
				to='student-dashboard'
				Icon={faUser}
				title='Student Dashboard'
			/>
			{/* Automation System */}
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
					to='automation/brand-and-group-management'
					title='Brands & Groups'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='automation/broadcast/active-chats'
					title='Active Chats'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			<AsideMenuItemWithSub
				to=''
				title='Lecture Management'
				Icon={faFileInvoice}>
				<AsideMenuItem
					to='lecture-overview'
					title='Syllabus'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			<AsideMenuItem
				to='admin-user'
				Icon={faUserCog}
				title='Admin User'
			/>
			<AsideMenuItem
				to='franchise/franchise-list'
				Icon={faMapMarkerAlt}
				title='Franchise'
			/>
			<AsideMenuItem
				to='contact-inquiry/contact'
				Icon={faUser}
				title='Contact Inquery'
			/>
			<AsideMenuItem
				to='business-list/business'
				Icon={faUser}
				title='Business List '
			/>
			<AsideMenuItem
				to='inpta/tp-listing'
				Icon={faUser}
				title='INPTA TP List '
			/>
			<AsideMenuItem
				to='inpta/tc-listing'
				Icon={faUser}
				title='INPTA TC List '
			/>
			<AsideMenuItem
				to='iptna/inquiry-list'
				Icon={faUser}
				title='IPTNA Inquiry List'
			/>

			{/* Invoice */}
			<AsideMenuItemWithSub
				to=''
				title='Invoice'
				Icon={faFileInvoice}>
				<AsideMenuItem
					to='invoice/create'
					title='Create Invoice'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='invoice/list'
					title='Invoice List'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* Subscription */}
			<AsideMenuItemWithSub
				to=''
				title='Subscription'
				Icon={faCalendarDays}>
				<AsideMenuItem
					to='plan'
					title='Plan'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='subscription'
					title='Subscription'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			<AsideMenuItem
				Icon={faChartLine}
				to='expense-details'
				title='Expense'
			/>

			{/* FGIIT */}
			<AsideMenuItemWithSub
				to=''
				title='FGIIT'
				Icon={faBook}>
				<AsideMenuItem
					to='fitness-courses'
					title='Fitness Course'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='scholarship-result'
					title='Scholarship Result'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='books'
					title='Books'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='e-book'
					title='E-Book'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='lectures'
					title='Lectures'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='lecture-comment'
					title='Lecture Comment'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='job-placement'
					title='Job & Placement'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='student-batch'
					title='Students Batch'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='exam'
					title='Exams'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='project-submission'
					title='Project Submission'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='student-placement'
					title='Student Placement'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* Users */}
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

			{/* Orders */}
			<AsideMenuItemWithSub
				to=''
				title='Orders'
				Icon={faCartArrowDown}>
				<AsideMenuItem
					to='all-order'
					title='All Orders'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='fitness-course-order'
					title='Fitness Course'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='book-order'
					title='Book'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* Cart */}
			<AsideMenuItemWithSub
				to=''
				title='Cart'
				Icon={faCartArrowDown}>
				<AsideMenuItem
					to='/fgiit/cart/add-to-cart'
					title='User Cart'
					Icon={faCartShopping}
				/>
				<AsideMenuItem
					to='/fgiit/cart/abandoned-list'
					title='Abandoned Checkout'
					Icon={faJar}
				/>
			</AsideMenuItemWithSub>

			{/* Training & Placement */}
			<AsideMenuItemWithSub
				to=''
				title='Training & Placement'
				Icon={faBuildingCircleCheck}>
				<AsideMenuItem
					to='employee-inquiry'
					title='Employee Application'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='employer-inquiry'
					title='Employer Application'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>

			{/* Follow Up Report*/}
{/* 
			<AsideMenuItem
				to='/fgiit/follow-up-report-dashboard'
				Icon={faHeadset}
				title='Follow Up Report'
			/> */}


			<AsideMenuItem
				Icon={faWandMagic}
				to='complaint-assistant'
				title='Complaint or Assistant'
			/>
			<AsideMenuItem
				Icon={faStar}
				to='app-feedback'
				title='App Feedback'
			/>
			<AsideMenuItem
				Icon={faMapMarkerAlt}
				to='user-location'
				title='User Location'
			/>
		</>
	)
}
