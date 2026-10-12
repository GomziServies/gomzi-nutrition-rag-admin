/* eslint-disable react/jsx-no-target-blank */
import {
	faBarsProgress,
	faCalendarCheck,
	faChartBar,
	faChartSimple,
	faCheck,
	faComment,
	faFolder,
	faHome,
	faMoneyBills,
	faPersonWalking,
	faUserPlus,
	faUsers,
	faWallet,
} from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { GetEmployees } from '../../../../../app/Functions/FGGroup/Employee'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'

export function EmployeeAsideMenuItems() {
	const [isManager, setIsManager] = useState(false)
	const [isSalesPerson, setIsSalesPerson] = useState(false)
	const [employeeId, setEmployeeId] = useState('')

	useEffect(() => {
		const fetchEmployeeData = async () => {
			try {
				const adminData: any = localStorage.getItem('fg_group_info')
				if (adminData) {
					const { _id } = JSON.parse(adminData)
					setEmployeeId(_id)
					const response: any = await GetEmployees({ id: _id })
					if (response.status === 200 && response.data) {
						const employeeData = Array.isArray(response.data) ? response.data[0] : response.data
						if (employeeData?.employee?.position === 'Manager') {
							setIsManager(true)
						}
						if (employeeData?.employee?.position === 'Sales Person') {
							setIsSalesPerson(true)
						}
					}
				}
			} catch (error) {
				console.error('Error fetching employee position:', error)
			}
		}
		fetchEmployeeData()

		// Setting a small delay to ensure it shows up automatically if data was still loading
		const timer = setTimeout(() => {
			fetchEmployeeData()
		}, 1000)

		return () => clearTimeout(timer)
	}, [])

	return (
		<>
			<AsideMenuItem
				to='/employee/dashboard'
				Icon={faHome}
				title='Dashboard'
			/>
			<AsideMenuItem
				to='/employee/employee-chat'
				Icon={faComment}
				title='Chat'
			/>
			<AsideMenuItem
				to='/employee/report'
				Icon={faChartBar}
				title='Report'
			/>
			<AsideMenuItem
				to='/employee/daily-report'
				Icon={faBarsProgress}
				title='Daily Report'
			/>
			<AsideMenuItem
				to='/employee/expenses-list'
				Icon={faMoneyBills}
				title='Expenses'
			/>
			{isSalesPerson && (
				<AsideMenuItemWithSub
					to=''
					Icon={faWallet}
					title='Wallet'>
					<AsideMenuItem
						to='/employee/transactions'
						title='Transactions'
						hasBullet={true}
					/>
					{/*
					<AsideMenuItem
						to='/employee/invoice'
						title='Invoice'
						hasBullet={true}
					/> */}
					<AsideMenuItem
						to='/employee/auto-commission'
						title='Auto Commission'
						hasBullet={true}
					/>
				</AsideMenuItemWithSub>
			)}
			<AsideMenuItem
				to='/employee/task'
				Icon={faCheck}
				title='Task'
			/>
			{isManager && (
				<>
					<AsideMenuItem
						to={`/employee/manager-details-view?id=${employeeId}`}
						Icon={faUsers}
						title='Team Management'
					/>
					<AsideMenuItem
						to='/employee/hiring-request'
						Icon={faUserPlus}
						title='Hiring Request'
					/>
				</>
			)}
			{/* <AsideMenuItem
						to='/employee/lead'
						Icon={faUserPlus}
						title='Lead'
					/> */}
			<AsideMenuItem
				to='/employee/document'
				Icon={faFolder}
				title='Document'
			/>
			<AsideMenuItem
				to='/employee/sop'
				Icon={faChartSimple}
				title='SOP'
			/>
			<AsideMenuItem
				to='/employee/target'
				Icon={faCalendarCheck}
				title='Target'
			/>
			<AsideMenuItem
				to='/employee/leave-manager'
				Icon={faPersonWalking}
				title='Leave Manager'
			/>
			{/* <AsideMenuItem
				to='/employee/rating-manager'
				Icon={faStar}
				title='Rating Manager'
			/> */}
		</>
	)
}
