/* eslint-disable react/jsx-no-target-blank */
import { faCalendarCheck, faHome, faMoneyBillTransfer, faHandHoldingDollar, faTableCells } from '@fortawesome/free-solid-svg-icons'
import { AsideMenuItem } from '../AsideMenuItem'

export function InvestorAsideMenuItems() {
    return (
        <>
            <AsideMenuItem
                to='/investor/dashboard'
                Icon={faHome}
                title='Dashboard'
            />
            <AsideMenuItem
                to='/investor/total-sales'
                Icon={faMoneyBillTransfer}
                title='Total Sales'
            />
            <AsideMenuItem
                to='/investor/attendance/list'
                Icon={faCalendarCheck}
                title='Attendance'
            />
            <AsideMenuItem
                to='/investor/expense/list'
                Icon={faHandHoldingDollar}
                title='Expenses'
            />
            <AsideMenuItem
                to='/investor/matrix/list'
                Icon={faTableCells}
                title='Matrix'
            />
        </>
    )
}
