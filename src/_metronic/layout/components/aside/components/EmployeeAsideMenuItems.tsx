/* eslint-disable react/jsx-no-target-blank */
import React, { useEffect, useState } from 'react'
import { GetEmployees } from '../../../../../app/Functions/FGGroup/Employee'
import { GetTask } from '../../../../../app/Functions/FGGroup/TaskManagement'
import { AsideMenuItem } from '../AsideMenuItem'
import { AsideMenuItemWithSub } from '../AsideMenuItemWithSub'
import {
	BarChart3Icon,
	BookOpenIcon,
	CalendarDaysIcon,
	CheckSquareIcon,
	ClipboardListIcon,
	FolderIcon,
	LayoutGridIcon,
	MailIcon,
	MessageSquareIcon,
	ReceiptIcon,
	TargetIcon,
	UserPlusIcon,
	UsersIcon,
	WalletIcon,
} from '../AnimatedAsideIcons'

export function EmployeeAsideMenuItems() {
	const [isManager, setIsManager] = useState(false)
	const [isSalesPerson, setIsSalesPerson] = useState(false)
	const [employeeId, setEmployeeId] = useState('')
	const [pendingTaskCount, setPendingTaskCount] = useState<number | null>(null)

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

					// Fetch real pending tasks count
					try {
						const taskRes: any = await GetTask({ task_id: _id } as any)
						if (taskRes?.status === 200 && Array.isArray(taskRes.data)) {
							const pending = taskRes.data.filter(
								(t: any) =>
									t.status !== 'COMPLETED' &&
									t.status !== 'DONE' &&
									t.employee_status !== 'DONE' &&
									t.employee_status !== 'COMPLETED'
							).length
							setPendingTaskCount(pending)
						}
					} catch (e) {
						console.warn('Could not fetch task count for sidebar', e)
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
				Icon={LayoutGridIcon}
				title='Dashboard'
			/>
			<AsideMenuItem
				to='/employee/employee-chat'
				Icon={MessageSquareIcon}
				title='Chat'
			/>
			<AsideMenuItem
				to='/employee/report'
				Icon={BarChart3Icon}
				title='Report'
			/>
			<AsideMenuItem
				to='/employee/daily-report'
				Icon={ClipboardListIcon}
				title='Daily Report'
			/>

			<AsideMenuItem
				to='/employee/expenses-list'
				Icon={ReceiptIcon}
				title='Expenses'
			/>
			{isSalesPerson && (
				<AsideMenuItemWithSub
					to=''
					Icon={WalletIcon}
					title='Wallet'>
					<AsideMenuItem
						to='/employee/transactions'
						title='Transactions'
						hasBullet={true}
					/>
					<AsideMenuItem
						to='/employee/auto-commission'
						title='Auto Commission'
						hasBullet={true}
					/>
				</AsideMenuItemWithSub>
			)}
			<AsideMenuItem
				to='/employee/task'
				Icon={CheckSquareIcon}
				title='Task'
				badge={pendingTaskCount !== null && pendingTaskCount > 0 ? pendingTaskCount : undefined}
			/>
			{isManager && (
				<>
					<AsideMenuItem
						to={`/employee/manager-details-view?id=${employeeId}`}
						Icon={UsersIcon}
						title='Team Management'
					/>
					<AsideMenuItem
						to='/employee/hiring-request'
						Icon={UserPlusIcon}
						title='Hiring Request'
					/>
				</>
			)}
			<AsideMenuItem
				to='/employee/document'
				Icon={FolderIcon}
				title='Document'
			/>
			<AsideMenuItem
				to='/employee/sop'
				Icon={BookOpenIcon}
				title='SOP'
			/>

			<AsideMenuItem
				to='/employee/target'
				Icon={TargetIcon}
				title='Target'
			/>
			<AsideMenuItem
				to='/employee/leave-manager'
				Icon={CalendarDaysIcon}
				title='Leave Manager'
			/>
			<AsideMenuItem
				to='/rag/contact-inquiry/contact'
				Icon={MailIcon}
				title='Contact Inquiry'
			/>
		</>
	)
}
