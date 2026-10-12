import { useLocation } from 'react-router-dom'
import {
	faBox,
	faClipboardUser,
	faEdit,
	faHandHoldingDollar,
	faHandHoldingUsd,
	faHome,
	faMoneyBill,
	faUserCheck,
	faUsers,
	faUserTie,
} from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'

export function AdajanBranchAsideMenuItems() {
	const { pathname, search } = useLocation()
	const queryParams = new URLSearchParams(search)
	const type = queryParams.get('type')

	return (
		<>
			<AsideMenuItem
				to='/adajan-branch/dashboard'
				Icon={faHome}
				title='Dashboard'
				isActive={pathname === '/adajan-branch/dashboard'}
			/>
			<AsideMenuItem
				to='/adajan-branch/trainer/list'
				Icon={faUsers}
				title='Assign Trainer'
				isActive={pathname.includes('/adajan-branch/trainer')}
			/>
			<AsideMenuItem
				to='/adajan-branch/client/list'
				Icon={faBox}
				title='Client'
				isActive={pathname.includes('/adajan-branch/client')}
			/>
			<AsideMenuItem
				to='/adajan-branch/employee/list'
				Icon={faUserTie}
				title='Employee'
				isActive={
					pathname.includes('/adajan-branch/employee/') && !pathname.includes('/employee-salary')
				}
			/>
			<AsideMenuItem
				to='/adajan-branch/attendance/list?type=client'
				Icon={faUserCheck}
				title='Attendance Client'
				isActive={pathname.includes('/adajan-branch/attendance') && type === 'client'}
			/>
			<AsideMenuItem
				to='/adajan-branch/attendance/list?type=member'
				Icon={faClipboardUser}
				title='Attendance Member'
				isActive={pathname.includes('/adajan-branch/attendance') && type === 'member'}
			/>
			<AsideMenuItem
				to='/adajan-branch/employee-salary'
				Icon={faMoneyBill}
				title='Employee Salary'
				isActive={pathname.includes('/adajan-branch/employee-salary')}
			/>
			<AsideMenuItem
				to='/adajan-branch/expense/list'
				Icon={faHandHoldingDollar}
				title='Expense'
				isActive={pathname.includes('/adajan-branch/expense')}
			/>
			<div className='menu-item'>
				<div className='menu-content pt-8 pb-2'>
					<span className='menu-section text-muted text-uppercase fs-8 ls-1'>Finance</span>
				</div>
			</div>
			<AsideMenuItem
				to='/adajan-branch/sales-list'
				Icon={faHandHoldingUsd}
				title='Total Sales'
			/>
			<AsideMenuItem
				to='/adajan-branch/create-invoice'
				Icon={faEdit}
				title='Generate Invoice'
			/>
		</>
	)
}
