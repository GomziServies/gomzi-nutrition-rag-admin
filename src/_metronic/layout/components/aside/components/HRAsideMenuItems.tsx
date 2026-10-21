/* eslint-disable react/jsx-no-target-blank */
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'
import {
	BarChart3Icon,
	BookOpenIcon,
	CalendarDaysIcon,
	CheckSquareIcon,
	ClipboardListIcon,
	FolderIcon,
	HandCoinsIcon,
	LayoutGridIcon,
	LayersIcon,
	MailIcon,
	MessageSquareIcon,
	ReceiptIcon,
	ShieldCheckIcon,
	TargetIcon,
	UserPlusIcon,
	UsersIcon,
	WalletIcon,
} from '../AnimatedAsideIcons'

export function HRAsideMenuItems() {
	return (
		<>
			<AsideMenuItem
				to='/hr/dashboard'
				Icon={LayoutGridIcon}
				title='Dashboard'
			/>
			<AsideMenuItem
				to='/hr/employee-detail'
				Icon={UsersIcon}
				title='Employee Detail'
			/>

			<AsideMenuItem
				to='/hr/attendance'
				Icon={CalendarDaysIcon}
				title='Attendance Detail'
			/>
			<AsideMenuItemWithSub
				to=''
				title='Gls-Employee-detail'
				Icon={LayersIcon}>
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
				Icon={WalletIcon}
				title='Employee Salary'
			/>
			<AsideMenuItem
				to='/hr/salary-data'
				Icon={HandCoinsIcon}
				title='Salary Data'
			/>
			<AsideMenuItem
				to='/hr/salary-slip'
				Icon={ReceiptIcon}
				title='Salary Slip'
			/>

			<AsideMenuItem
				to='/hr/hr-chat'
				Icon={MessageSquareIcon}
				title='Chat'
			/>
			<AsideMenuItem
				to='/hr/task-list'
				Icon={CheckSquareIcon}
				title='Assign task'
			/>
			<AsideMenuItem
				to='/hr/team-management'
				Icon={UsersIcon}
				title='Team Management'
			/>
			<AsideMenuItem
				to='/hr/hiring-request'
				Icon={UserPlusIcon}
				title='Hiring Request'
			/>
			<AsideMenuItem
				to='/hr/reports'
				Icon={BarChart3Icon}
				title='Reports'
			/>
			<AsideMenuItem
				to='/hr/daily-report'
				Icon={ClipboardListIcon}
				title='Daily Report'
			/>
			<AsideMenuItem
				to='/hr/contact-inquiry/contact'
				Icon={MailIcon}
				title='Contact Inquiry'
			/>
			<AsideMenuItem
				to='/hr/expenses-list'
				Icon={ReceiptIcon}
				title='Expenses'
			/>
			<AsideMenuItem
				to='/hr/sop-list'
				Icon={BookOpenIcon}
				title='SOP'
			/>
			<AsideMenuItem
				to='/hr/leave'
				Icon={CalendarDaysIcon}
				title='Leave'
			/>
			<AsideMenuItem
				to='/hr/manual-leave'
				Icon={CalendarDaysIcon}
				title='Add Manual leave'
			/>
			<AsideMenuItem
				to='/hr/target'
				Icon={TargetIcon}
				title='Target'
			/>
			{/* Authority Management */}
			<AsideMenuItemWithSub
				to=''
				title='Authority Management'
				Icon={ShieldCheckIcon}>
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
				Icon={FolderIcon}>
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
