/* eslint-disable jsx-a11y/anchor-is-valid */
import { FC, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getProfile } from '../../../../app/Functions/FGGroup'
import { getProfile as portalProfile } from '../../../../app/Functions/FWG'
import { GetMyAuthority } from '../../../../app/Functions/FGGroup/RBAC'
import { toAbsoluteUrl } from '../../../helpers'

export interface PanelDef {
	id: string
	name: string
	code: string
	path: string
	icon: string
	color: string
	category: string
}

export const ALL_PANELS: PanelDef[] = [
	{
		id: 'employee',
		name: 'Employee Portal',
		code: 'Employee',
		path: '/employee/dashboard',
		icon: 'bi-person-badge',
		color: '#2563eb',
		category: 'Staff & Tasks',
	},
	{
		id: 'rag',
		name: 'Gomzi Nutrition (RAG)',
		code: 'Gomzi_Nutrition',
		path: '/rag/dashboard',
		icon: 'bi-capsule',
		color: '#8b523c',
		category: 'Invoices & Sales',
	},
	/*
	{
		id: 'master',
		name: 'Master Admin',
		code: 'Master',
		path: '/master/dashboard',
		icon: 'bi-shield-shaded',
		color: '#7c3aed',
		category: 'Central Control',
	},
	{
		id: 'fwg',
		name: 'FWG Portal',
		code: 'FWG',
		path: '/fwg/dashboard',
		icon: 'bi-heart-pulse',
		color: '#059669',
		category: 'Fitness & Clients',
	},
	{
		id: 'fgiit',
		name: 'FGIIT Academy',
		code: 'FGIIT',
		path: '/fgiit/dashboard',
		icon: 'bi-mortarboard',
		color: '#d97706',
		category: 'Courses & Students',
	},
	*/
	{
		id: 'hr',
		name: 'HR Portal',
		code: 'HR',
		path: '/hr/dashboard',
		icon: 'bi-people',
		color: '#dc2626',
		category: 'Payroll & Team',
	},
	/*
	{
		id: 'investor',
		name: 'Investor Portal',
		code: 'Investor',
		path: '/investor/dashboard',
		icon: 'bi-cash-coin',
		color: '#10b981',
		category: 'Financial Insights',
	},
	{
		id: 'helix',
		name: 'Helix Automation',
		code: 'Helix',
		path: '/helix/dashboard',
		icon: 'bi-diagram-3',
		color: '#6366f1',
		category: 'Broadcast & CRM',
	},
	{
		id: 'account',
		name: 'Accounts & Finance',
		code: 'Account',
		path: '/account/dashboard',
		icon: 'bi-receipt-cutoff',
		color: '#0891b2',
		category: 'Billing & Vouchers',
	},
	{
		id: 'adajan-branch',
		name: 'Adajan Branch',
		code: 'Adajan-Branch',
		path: '/adajan-branch/dashboard',
		icon: 'bi-shop',
		color: '#f59e0b',
		category: 'Branch Store',
	},
	{
		id: 'automation',
		name: 'Automation',
		code: 'Automation',
		path: '/automation/broadcast/list',
		icon: 'bi-broadcast-pin',
		color: '#8b5cf6',
		category: 'Tele-Sales',
	},
	{
		id: 'matrices',
		name: 'Matrices',
		code: 'Matrices',
		path: '/matrices/gls-report',
		icon: 'bi-grid-3x3-gap',
		color: '#3b82f6',
		category: 'GLS Reports',
	},
	*/
]

const HeaderUserMenu: FC = () => {
	const location = useLocation()
	const [userProfile, setUserProfile] = useState<any>(null)
	const [authorities, setAuthorities] = useState<any[]>([])

	const getActivePanelId = (): string => {
		const path = (location.pathname || window.location.pathname || '').toLowerCase()
		if (path.startsWith('/rag') || path.startsWith('/nutrition')) return 'rag'
		if (path.startsWith('/employee')) return 'employee'
		/*
		if (path.startsWith('/master')) return 'master'
		if (path.startsWith('/fwg')) return 'fwg'
		if (path.startsWith('/fgiit')) return 'fgiit'
		*/
		if (path.startsWith('/hr')) return 'hr'
		/*
		if (path.startsWith('/investor') || path.startsWith('/gls-investor')) return 'investor'
		if (path.startsWith('/helix')) return 'helix'
		if (path.startsWith('/account')) return 'account'
		if (path.startsWith('/adajan-branch')) return 'adajan-branch'
		if (path.startsWith('/automation') || path.startsWith('/tele')) return 'automation'
		if (path.startsWith('/matrices')) return 'matrices'
		*/

		const admin = (localStorage.getItem('admin') || '').toLowerCase()
		if (admin === 'employee') return 'employee'
		/*
		if (admin === 'master') return 'master'
		*/
		if (admin === 'hr') return 'hr'
		/*
		if (admin === 'fwg') return 'fwg'
		if (admin === 'fgiit') return 'fgiit'
		*/
		return 'rag'
	}

	const activePanelId = getActivePanelId()
	const activePanel = ALL_PANELS.find((p) => p.id === activePanelId) || ALL_PANELS[1]

	useEffect(() => {
		// 1. Load user profile
		const portalAdminType = localStorage.getItem('fwg_portal')
		const adminData = localStorage.getItem('fg_group_info')
		const portalData = localStorage.getItem('portal_info')

		if (adminData) {
			try {
				setUserProfile(JSON.parse(adminData))
			} catch (e) {
				console.error(e)
			}
		} else if (portalData) {
			try {
				setUserProfile(JSON.parse(portalData))
			} catch (e) {
				console.error(e)
			}
		}

		// Fresh profile fetch
		const fetchFreshProfile = async () => {
			try {
				if (portalAdminType === 'fwg_portal') {
					const data: any = await portalProfile()
					if (data?.data) {
						setUserProfile(data.data)
						localStorage.setItem('portal_info', JSON.stringify(data.data))
					}
				} else {
					const data: any = await getProfile()
					if (data?.data) {
						setUserProfile(data.data)
						localStorage.setItem('fg_group_info', JSON.stringify(data.data))
					}
				}
			} catch (err) {
				console.error('Error fetching profile', err)
			}
		}
		fetchFreshProfile()

		// 2. Load authorities
		const cachedAuths = localStorage.getItem('employee_authorities')
		if (cachedAuths) {
			try {
				setAuthorities(JSON.parse(cachedAuths))
			} catch (e) {
				console.error(e)
			}
		}

		const fetchAuths = async () => {
			try {
				const res: any = await GetMyAuthority()
				if (res?.status === 200 && Array.isArray(res.data)) {
					setAuthorities(res.data)
					localStorage.setItem('employee_authorities', JSON.stringify(res.data))
				}
			} catch (err) {
				console.error('Error fetching authorities', err)
			}
		}
		fetchAuths()
	}, [])

	const handleSwitchPanel = (panel: PanelDef) => {
		localStorage.setItem('admin', panel.code)
		localStorage.setItem('admin_type', panel.code)
		if (panel.id === 'employee') {
			localStorage.setItem('is_employee_login', 'true')
		}
		window.location.href = panel.path
	}

	const handleLogout = () => {
		localStorage.clear()
		const currentActive = getActivePanelId()
		if (currentActive === 'employee') {
			window.location.href = '/employee/login'
		} else if (currentActive === 'rag') {
			window.location.href = '/rag/login'
		/*
		} else if (currentActive === 'master') {
			window.location.href = '/master/login'
		*/
		} else if (currentActive === 'hr') {
			window.location.href = '/hr/login'
		/*
		} else if (currentActive === 'fwg') {
			window.location.href = '/fwg/login'
		} else if (currentActive === 'fgiit') {
			window.location.href = '/fgiit/login'
		} else if (currentActive === 'investor') {
			window.location.href = '/investor/login'
		*/
		} else {
			window.location.href = '/login'
		}
	}

	const getAccessiblePanels = (): PanelDef[] => {
		const storedAdmin = (localStorage.getItem('admin') || '').toLowerCase()
		const userType = (userProfile?.type || '').toLowerCase()

		// Master / SuperAdmin has full access to active panels
		if (storedAdmin === 'master' || userType === 'master' || userType === 'superadmin') {
			return ALL_PANELS
		}

		const map = new Map<string, PanelDef>()

		// Default: All employees have access to Employee portal
		const emp = ALL_PANELS.find((p) => p.id === 'employee')
		if (emp) map.set(emp.id, emp)

		// Always ensure the active panel is shown
		if (activePanel) map.set(activePanel.id, activePanel)

		// Match panels granted via RBAC authorities
		if (Array.isArray(authorities) && authorities.length > 0) {
			authorities.forEach((auth: any) => {
				const rawName = (auth.panel_id?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
				if (!rawName) return

				const found = ALL_PANELS.find((p) => {
					const codeKey = p.code.toLowerCase().replace(/[^a-z0-9]/g, '')
					const nameKey = p.name.toLowerCase().replace(/[^a-z0-9]/g, '')
					return (
						rawName.includes(codeKey) ||
						codeKey.includes(rawName) ||
						rawName.includes(nameKey) ||
						nameKey.includes(rawName)
					)
				})

				if (found) {
					map.set(found.id, found)
				} /* else {
					const customId = auth.panel_id?._id || auth.panel_id?.name
					if (customId && !map.has(customId)) {
						map.set(customId, {
							id: customId,
							name: auth.panel_id?.name || 'Assigned Panel',
							code: auth.panel_id?.name || 'Assigned',
							path: '/employee/dashboard',
							icon: 'bi-grid-fill',
							color: '#0d9488',
							category: 'Assigned Department',
						})
					}
				} */
			})
		}

		return Array.from(map.values()).filter((p) => ['employee', 'rag', 'hr'].includes(p.id))
	}

	const accessiblePanels = getAccessiblePanels()
	const userName = userProfile?.full_name || 'chiragFWG'
	const userRole = userProfile?.type || 'Employee'
	const userEmail = userProfile?.email || 'chirag@fg.com'

	return (
		<div>
			{/* User Profile Header */}
			<div className='gz-user-menu-header'>
				<div className='d-flex align-items-center gap-3'>
					<div className='gz-user-menu-avatar-wrap'>
						<img
							src={toAbsoluteUrl('/media/avatars/300-1.jpg')}
							alt={userName}
							className='gz-user-menu-avatar'
						/>
						<span className='gz-user-online-dot' title='Online'></span>
					</div>
					<div className='d-flex flex-column text-start overflow-hidden'>
						<div className='d-flex align-items-center gap-2'>
							<span className='fw-bold text-gray-900 text-truncate fs-6'>{userName}</span>
							<span className='badge badge-light-primary fw-bolder fs-8 px-2 py-0'>{userRole}</span>
						</div>
						<span className='text-muted text-truncate fs-7'>{userEmail}</span>
					</div>
				</div>
			</div>

			{/* Accessible Panels List */}
			<div className='gz-panels-section-label'>
				<span>Your Panel Access</span>
				<span className='badge badge-light-primary fs-8'>{accessiblePanels.length} Panels</span>
			</div>

			<div className='gz-panels-list'>
				{accessiblePanels.map((panel) => {
					const isActive = panel.id === activePanel.id

					return (
						<button
							key={panel.id}
							type='button'
							onClick={() => handleSwitchPanel(panel)}
							className={`gz-panel-item-btn ${isActive ? 'is-active' : ''}`}
							title={isActive ? `Currently viewing ${panel.name}` : `Switch to ${panel.name}`}>
							<div className='d-flex align-items-center overflow-hidden'>
								<div
									className='gz-panel-item-icon'
									style={{
										backgroundColor: isActive ? '#dbeafe' : `${panel.color}15`,
										color: isActive ? '#2563eb' : panel.color,
										border: `1px solid ${isActive ? '#bfdbfe' : `${panel.color}30`}`,
									}}>
									<i className={`bi ${panel.icon}`}></i>
								</div>
								<div className='d-flex flex-column text-start overflow-hidden'>
									<span className='gz-panel-item-name text-truncate'>{panel.name}</span>
									<span className='gz-panel-item-desc text-truncate'>{panel.category}</span>
								</div>
							</div>
							<div className='ms-2 flex-shrink-0'>
								{isActive ? (
									<i className='bi bi-check-lg gz-panel-active-check'></i>
								) : (
									<i className='bi bi-arrow-right-short gz-panel-item-arrow'></i>
								)}
							</div>
						</button>
					)
				})}
			</div>

			{/* Quick Utilities & Logout Footer */}
			<div className='gz-user-menu-footer'>
				<button
					type='button'
					onClick={handleLogout}
					className='gz-user-menu-logout-btn'
					title='Log out of session'>
					<i className='bi bi-box-arrow-right'></i>
					<span>Logout</span>
				</button>
			</div>
		</div>
	)
}

export { HeaderUserMenu }
