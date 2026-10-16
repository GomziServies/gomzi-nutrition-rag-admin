import { useEffect, useRef, useState } from 'react'
import DateFilter from '../../../../app/components/DateRangePicker'
import { GetMyAuthority } from '../../../../app/Functions/FGGroup/RBAC'
import { toAbsoluteUrl } from '../../../helpers'
import { HeaderUserMenu } from '../../../partials'
import { useLayout } from '../../core'

const HeaderToolbar = () => {
	const { classes } = useLayout()
	const [searchQuery, setSearchQuery] = useState('')
	const [showUserMenu, setShowUserMenu] = useState(false)
	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const [userProfile, setUserProfile] = useState<any>(null)
	const [selectedLogo, setSelectedLogo] = useState('')
	const [adminType, setAdminType] = useState('')
	const [masterShow, setMasterShow] = useState(false)
	const [fwgSubAdminShow, setFwgSubAdminShow] = useState('')
	const [isAdajanBranch, setIsAdajanBranch] = useState(false)
	const [isInvestor, setIsInvestor] = useState(false)
	const [isFwgLoginPortal, setIsFwgLoginPortal] = useState(false)
	const [isHr, setIsHr] = useState(false)
	const [isGnTeleSales, setIsGnTeleSales] = useState(false)
	const [isFgiitTeleSales, setIsFgiitTeleSales] = useState(false)
	const [isFwgTeleSales, setIsFwgTeleSales] = useState(false)
	const [isFgiitLoginPortal, setIsFgiitLoginPortal] = useState(false)

	const [employeeAuthorities, setEmployeeAuthorities] = useState<any[]>([])
	const [isEmployeeLogin, setIsEmployeeLogin] = useState(false)

	useEffect(() => {
		const storedAdmin = localStorage.getItem('admin')
		const storedAdminType = localStorage.getItem('admin_type')

		if (storedAdmin) {
			if (
				storedAdmin === 'Gomzi_Nutrition' ||
				storedAdmin === 'Gomzi_Nutrition_Tele_Sales' ||
				storedAdmin === 'Helix'
			) {
				setSelectedLogo('/media/logos/rag-white-logo.png')
			}
		}
		if (storedAdminType) {
			setAdminType(storedAdminType)
		}
		if (storedAdmin) {
			setAdminType(storedAdmin)
		}

		const adminInfo = localStorage.getItem('fg_group_info')
		if (adminInfo) {
			try {
				setUserProfile(JSON.parse(adminInfo))
			} catch (e) {
				console.error(e)
			}
		}

		const isEmp = localStorage.getItem('is_employee_login') === 'true' || storedAdmin === 'Employee'
		if (isEmp) {
			setIsEmployeeLogin(true)
			localStorage.setItem('is_employee_login', 'true')

			// Load from cache first
			const cached = localStorage.getItem('employee_authorities')
			if (cached) {
				try {
					setEmployeeAuthorities(JSON.parse(cached))
				} catch (e) {
					console.error(e)
				}
			}

			// Fetch fresh authorities
			const fetchAuths = async () => {
				try {
					const res: any = await GetMyAuthority()
					if (res.status === 200 && res.data) {
						setEmployeeAuthorities(res.data)
						localStorage.setItem('employee_authorities', JSON.stringify(res.data))
					}
				} catch (err) {
					console.error('Failed to fetch employee authorities', err)
				}
			}
			fetchAuths()
		}
	}, [])

	const handleSelection = (logo: string, value: string) => {
		setSelectedLogo(logo)
		localStorage.setItem('admin', value)

		if (value === 'Gomzi_Nutrition' || value === 'Store' || value === 'Gomzi_Nutrition_Login	') {
			window.location.href = '/rag/dashboard'
		}
	}

	useEffect(() => {
		const rangeSlider = document.querySelector('#kt_toolbar_slider')
		const rangeSliderValueElement = document.querySelector('#kt_toolbar_slider_value')

		if (!rangeSlider || !rangeSliderValueElement) {
			return
		}

		const handle = rangeSlider.querySelector('.noUi-handle')
		if (handle) {
			handle.setAttribute('tabindex', '0')
		}
	}, [])

	const userName = userProfile?.full_name || 'chiragFWG'
	const userRole = userProfile?.type || 'Employee'

	const userMenuRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault()
				searchInputRef.current?.focus()
			} else if (e.key === 'Escape') {
				setShowUserMenu(false)
				searchInputRef.current?.blur()
			}
		}

		const handleClickOutside = (e: MouseEvent) => {
			if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
				setShowUserMenu(false)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		document.addEventListener('mousedown', handleClickOutside)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	return (
		<div className='gz-topbar-wrapper d-flex align-items-center justify-content-between w-100 px-4'>
			{/* Left: Search anything... with ⌘ K */}
			<div className='gz-top-search-bar'>
				<i className='bi bi-search gz-top-search-icon'></i>
				<input
					ref={searchInputRef}
					type='text'
					className='gz-top-search-input'
					placeholder='Search anything...'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<span className='gz-top-search-kbd'>⌘ K</span>
			</div>

			{/* Right: Date range filter + Notification bell + Profile pill */}
			<div className='d-flex align-items-center gap-3'>
				{/* Date Range Picker Pill */}
				<div className='gz-top-date-wrap'>
					<DateFilter
						onDateRangeChange={() => {}}
						rightValue='0'
					/>
				</div>

				{/* Notifications Bell */}
				<button
					type='button'
					className='gz-top-btn-icon position-relative'
					title='Notifications'>
					<i className='bi bi-bell fs-5'></i>
					<span className='gz-bell-red-dot'></span>
				</button>

				{/* User Profile Pill */}
				<div
					ref={userMenuRef}
					className='gz-top-user-wrap position-relative'
					onMouseEnter={() => {
						if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
						setShowUserMenu(true)
					}}
					onMouseLeave={() => {
						hoverTimeoutRef.current = setTimeout(() => {
							setShowUserMenu(false)
						}, 250)
					}}>
					<button
						type='button'
						className='gz-top-user-btn'
						onClick={() => setShowUserMenu(!showUserMenu)}>
						<img
							src={toAbsoluteUrl('/media/avatars/300-1.jpg')}
							alt='User'
							className='gz-top-user-avatar'
						/>
						<div className='gz-top-user-info text-start d-none d-sm-flex flex-column'>
							<span className='gz-top-user-name'>{userName}</span>
							<span className='gz-top-user-role'>{userRole}</span>
						</div>
						<i className='bi bi-chevron-down gz-top-user-arrow ms-2'></i>
					</button>

					{showUserMenu && (
						<div
							className='gz-topbar-user-dropdown-menu'
							onClick={(e) => e.stopPropagation()}>
							<HeaderUserMenu />
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export { HeaderToolbar }
