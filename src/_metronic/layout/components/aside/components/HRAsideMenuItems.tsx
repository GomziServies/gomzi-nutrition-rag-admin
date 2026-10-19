/* eslint-disable react/jsx-no-target-blank */
import {
	faAddressBook,
	faBarsProgress,
	faCalendarCheck,
	faChartSimple,
	faCheck,
	faComment,
	faDollar,
	faEnvelope,
	faFileLines,
	faHome,
	faListUl,
	faMoneyBills,
	faPersonWalking,
	faShieldHalved,
	faUserPlus,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function HRAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/hr/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>
			<AsideMenuItem
				to='/hr/employee-detail'
				Icon={faListUl}
				title='Employee Detail'
			/>

			<AsideMenuItem
				to='/hr/attendance'
				Icon={faAddressBook}
				title='Attendance Detail'
			/>
			<AsideMenuItemWithSub
				to=''
				title='Gls-Employee-detail'
				Icon={faUsers}>
				<AsideMenuItem
					to='/hr/gls-employees'
					title='GlsEmployee Detail'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/hr/gls-attendance'
					title='Attendance'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/hr/gls-employee-salary'
					title='Gls Employee Salary'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItem
				to='/hr/employee-salary'
				Icon={faDollar}
				title='Employee Salary'
			/>
			<AsideMenuItem
				to='/hr/salary-data'
				Icon={faDollar}
				title='Salary Data'
			/>
			<AsideMenuItem
				to='/hr/salary-slip'
				Icon={faMoneyBills}
				title='Salary Slip'
			/>

			{/* <AsideMenuItem
				to='/hr/attendance'
				Icon={faAddressBook}
				title='Attendance Detail'
			/> */}
			<AsideMenuItem
				to='/hr/hr-chat'
				Icon={faComment}
				title='Chat'
			/>
			<AsideMenuItem
				to='/hr/task-list'
				Icon={faCheck}
				title='Assign task'
			/>
			<AsideMenuItem
				to='/hr/team-management'
				Icon={faUsers}
				title='Team Management'
			/>
			<AsideMenuItem
				to='/hr/hiring-request'
				Icon={faUserPlus}
				title='Hiring Request'
			/>
			<AsideMenuItem
				to='/hr/reports'
				Icon={faFileLines}
				title='Reports'
			/>
			<AsideMenuItem
				to='/hr/daily-report'
				Icon={faBarsProgress}
				title='Daily Report'
			/>
			<AsideMenuItem
				to='/hr/contact-inquiry/contact'
				Icon={faEnvelope}
				title='Contact Inquiry'
			/>
			<AsideMenuItem
				to='/hr/expenses-list'
				Icon={faMoneyBills}
				title='Expenses'
			/>
			{/* <AsideMenuItem
						to='/hr/lead'
						Icon={faUserPlus}
						title='Leads'
						/> */}
			<AsideMenuItem
				to='/hr/sop-list'
				Icon={faChartSimple}
				title='SOP'
			/>
			<AsideMenuItem
				to='/hr/leave'
				Icon={faPersonWalking}
				title='Leave'
			/>
			<AsideMenuItem
				to='/hr/manual-leave'
				Icon={faPersonWalking}
				title='Add Manual leave'
			/>
			<AsideMenuItem
				to='/hr/target'
				Icon={faCalendarCheck}
				title='Target'
			/>
			{/* Authority Management */}
			<AsideMenuItemWithSub
				to=''
				title='Authority Management'
				Icon={faShieldHalved}>
				<AsideMenuItem
					to='/hr/authority-setup'
					title='Panel & Menu Setup'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/hr/authority-management'
					title='Assign Authority'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
			<AsideMenuItemWithSub
				to=''
				title='Memo'
				Icon={faFileLines}>
				<AsideMenuItem
					to='/hr/create-memo'
					title='Create Memo'
					hasBullet={true}
				/>
				<AsideMenuItem
					to='/hr/memo-list'
					title='Memo List'
					hasBullet={true}
				/>
			</AsideMenuItemWithSub>
		</>
	)
}
