/* eslint-disable jsx-a11y/anchor-is-valid */
import { FC, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProfile } from '../../../../app/Functions/FGGroup'
import { getProfile as portalProfile } from '../../../../app/Functions/FWG'

const HeaderUserMenu: FC = () => {
	const navigate = useNavigate()
	const [userProfile, setUserProfile] = useState<any>(null)
	const [adminType, setAdminType] = useState('')
	const [portalAdminType, setPortalAdminType] = useState('')
	const [isAdajanBranch, setIsAdajanBranch] = useState(false)
	const [isInvestor, setIsInvestor] = useState(false)
	const [isHr, setIsHr] = useState(false)
	const [fwgLoginPortal, setFwgLoginPortal] = useState('')
	const [isGnTeleSales, setIsGnTeleSales] = useState(false)
	const [isFgiitTeleSales, setIsFgiitTeleSales] = useState(false)
	const [isFwgTeleSales, setIsFwgTeleSales] = useState(false)
	const [isMatrices, setIsMatrices] = useState(false)
	const [isFgiitLoginPortal, setIsFgiitLoginPortal] = useState(false)

	const adminData = localStorage.getItem('fg_group_info')
	let isEmployee = false
	if (userProfile?.type === 'Employee') {
		isEmployee = true
	} else if (adminData) {
		try {
			if (JSON.parse(adminData)?.type === 'Employee') {
				isEmployee = true
			}
		} catch {}
	}

	const logout = () => {
		localStorage.clear()
		window.location.href = '/login'
		// navigate('/login')
	}

	const employeeLogout = () => {
		localStorage.clear()
		window.location.href = '/employee/login'
		// navigate('/employee/login')
	}

	const masterLogout = () => {
		localStorage.clear()
		window.location.href = '/master/login'
	}

	const storeLogout = () => {
		localStorage.clear()
		window.location.href = '/rag/login'
	}

	const nutritionLoginLogout = () => {
		localStorage.clear()
		window.location.href = '/rag/login'
	}

	const gnTeleSalesLogout = () => {
		localStorage.clear()
		window.location.href = '/gn-tele-sales/login'
	}

	const fgiitTeleSalesLogout = () => {
		localStorage.clear()
		window.location.href = '/fgiit-tele-sales/login'
	}

	const fwgTeleSalesLogout = () => {
		localStorage.clear()
		window.location.href = '/fwg-tele-sales/login'
	}

	const vesuMasterLogout = () => {
		localStorage.clear()
		window.location.href = '/fwg-master/login'
	}

	const portalLogout = () => {
		localStorage.clear()
		window.location.href = '/portal/login'
	}

	const automationLogout = () => {
		localStorage.clear()
		window.location.href = '/tele/login'
	}

	const adajanBranchLogout = () => {
		localStorage.clear()
		window.location.href = '/adajan-branch/login'
	}

	const investorLogout = () => {
		localStorage.clear()
		window.location.href = '/investor/login'
	}

	const hrLogout = () => {
		localStorage.clear()
		window.location.href = '/hr/login'
	}

	const fwgLoginLogout = () => {
		localStorage.clear()
		window.location.href = '/fwg/login'
	}

	const fgiitLoginLogout = () => {
		localStorage.clear()
		window.location.href = '/fgiit/login'
	}

	const glsInvestorLogout = () => {
		localStorage.clear()
		window.location.href = '/gls-investor/login'
	}

	const matricesLogout = () => {
		localStorage.clear()
		window.location.href = '/matrices/login'
	}

	const accountLogout = () => {
		localStorage.clear()
		window.location.href = '/login'
	}
	const helixLogout = () => {
		localStorage.clear()
		window.location.href = '/helix/login'
	}
	const fetchProfileData = async () => {
		try {
			const storedPortalAdminType = localStorage.getItem('fwg_portal')
			if (storedPortalAdminType === 'fwg_portal') {
				const data: any = await portalProfile()
				setUserProfile(data.data)
				localStorage.setItem('portal_info', JSON.stringify(data.data))
			} else {
				const data: any = await getProfile()
				setUserProfile(data.data)
				localStorage.setItem('fg_group_info', JSON.stringify(data.data))
			}
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		const storedPortalAdminType = localStorage.getItem('fwg_portal')
		const storedPortalAdminData: any = localStorage.getItem('portal_info')
		const adminData: any = localStorage.getItem('fg_group_info')
		const storedAdminType = localStorage.getItem('admin')
		const storedAdajanBranch = localStorage.getItem('adajan_branch_portal')
		const storedInvestor = localStorage.getItem('investor_portal')
		const storedHr = localStorage.getItem('hr_portal')
		const fwgLoginPortal = localStorage.getItem('fwg_login_portal')
		const storedGnTeleSales = localStorage.getItem('tele_sales_portal')
		const storedFgiitTeleSales = localStorage.getItem('fgiit_tele_sales_portal')
		const storedFwgTeleSales = localStorage.getItem('fwg_tele_sales_portal')
		const storedFgiitLoginPortal = localStorage.getItem('fgiit_login_portal')
		const storedMatrices = localStorage.getItem('matrices_portal')

		if (storedAdajanBranch) {
			setIsAdajanBranch(true)
		}
		if (storedInvestor) {
			setIsInvestor(true)
		}
		if (storedHr) {
			setIsHr(true)
		}
		if (storedGnTeleSales) {
			setIsGnTeleSales(true)
		}
		if (storedFgiitTeleSales) {
			setIsFgiitTeleSales(true)
		}
		if (storedFwgTeleSales) {
			setIsFwgTeleSales(true)
		}
		if (storedMatrices) {
			setIsMatrices(true)
		}
		if (storedPortalAdminType) {
			setPortalAdminType(storedPortalAdminType)
		}
		if (storedAdminType) {
			setAdminType(storedAdminType)
		}

		// Set cached data first for instant display, then fetch fresh data
		if (adminData) {
			setUserProfile(JSON.parse(adminData))
		} else if (storedPortalAdminData) {
			setUserProfile(JSON.parse(storedPortalAdminData))
		}

		if (fwgLoginPortal) {
			setFwgLoginPortal(fwgLoginPortal)
		}

		if (storedFgiitLoginPortal || storedAdminType === 'FGIIT_LOGIN_PORTAL') {
			setIsFgiitLoginPortal(true)
		}
		// Fetch fresh profile data from API
		fetchProfileData()
	}, [])

	return (
		<div
			className='menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px'
			data-kt-menu='true'
			data-popper-placement='bottom-start'>
			<div className='menu-item px-3'>
				<div className='menu-content d-flex align-items-center px-3'>
					<div className='d-flex flex-column'>
						<div className='fw-bolder d-flex align-items-center fs-5'>
							{userProfile?.full_name}
							<span className='badge badge-light-success fw-bolder fs-8 px-2 py-1 ms-2'>
								{userProfile?.type}
							</span>
						</div>
						<p className='fw-bold text-muted text-hover-primary fs-7 mb-0'>{userProfile?.email}</p>
					</div>
				</div>
			</div>

			<div className='separator my-2'></div>

			{/* {fwgLoginPortal === 'fwg_login_portal' || adminType === 'FWG_LOGIN_PORTAL' ? ( */}
			{isEmployee ? (
				<div className='menu-item px-5'>
					<button
						onClick={employeeLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : fwgLoginPortal === 'fwg_login_portal' || adminType === 'FWG_LOGIN_PORTAL' ? (
				<div className='menu-item px-5'>
					<button
						onClick={fwgLoginLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType == 'Employee' ? (
				<>
					<div className='menu-item px-5'>
						<button
							onClick={employeeLogout}
							className='menu-link px-5 btn'>
							Logout
						</button>
					</div>
				</>
			) : adminType == 'Master' ? (
				<div className='menu-item px-5'>
					<button
						onClick={masterLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType === 'Gomzi_Nutrition_Login' ? (
				<div className='menu-item px-5'>
					<button
						onClick={nutritionLoginLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType == 'Gomzi_Nutrition_Tele_Sales' || isGnTeleSales ? (
				<div className='menu-item px-5'>
					<button
						onClick={gnTeleSalesLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType == 'Fgiit_Tele_Sales' || isFgiitTeleSales ? (
				<div className='menu-item px-5'>
					<button
						onClick={fgiitTeleSalesLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType == 'Fwg_Tele_Sales' || isFwgTeleSales ? (
				<div className='menu-item px-5'>
					<button
						onClick={fwgTeleSalesLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType == 'Store' ? (
				<div className='menu-item px-5'>
					<button
						onClick={storeLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType == 'Vesu-Master' ? (
				<div className='menu-item px-5'>
					<button
						onClick={vesuMasterLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType == 'Automation' ? (
				<div className='menu-item px-5'>
					<button
						onClick={automationLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : portalAdminType == 'fwg_portal' ? (
				<div className='menu-item px-5'>
					<button
						onClick={portalLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType === 'Adajan-Branch' && isAdajanBranch ? (
				<div className='menu-item px-5'>
					<button
						onClick={adajanBranchLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType === 'Investor' && isInvestor ? (
				<div className='menu-item px-5'>
					<button
						onClick={investorLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType === 'GLS_Investor' && isInvestor ? (
				<div className='menu-item px-5'>
					<button
						onClick={glsInvestorLogout}
						className='menu-link px-s btn'>
						Logout
					</button>
				</div>
			) : adminType === 'Matrices' || isMatrices ? (
				<div className='menu-item px-5'>
					<button
						onClick={matricesLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType === 'HR' && isHr ? (
				<div className='menu-item px-5'>
					<button
						onClick={hrLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType === 'Account' ? (
				<div className='menu-item px-5'>
					<button
						onClick={accountLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType === 'Helix' ? (
				<div className='menu-item px-5'>
					<button
						onClick={helixLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : adminType === 'FGIIT_LOGIN_PORTAL' || isFgiitLoginPortal ? (
				<div className='menu-item px-5'>
					<button
						onClick={fgiitLoginLogout}
						className='menu-link px-5 btn'>
						Logout
					</button>
				</div>
			) : (
				<>
					{/* <div className='menu-item px-5'>
						<Link
							to={'/fgiit/admin-user/admin-profile'}
							className='menu-link px-5'>
							My Profile
						</Link>
					</div> */}
					{adminType !== 'Adajan-Branch' &&
						adminType !== 'Investor' &&
						adminType !== 'HR' &&
						adminType !== 'Gomzi_Nutrition_Tele_Sales' &&
						adminType !== 'Fgiit_Tele_Sales' &&
						adminType !== 'Fwg_Tele_Sales' && (
							<div className='menu-item px-5'>
								<Link
									to={'/rag/admin-profile'}
									className='menu-link px-5'>
									My Profile
								</Link>
							</div>
						)}
					<div className='menu-item px-5'>
						<button
							onClick={logout}
							className='menu-link px-5 btn'>
							Logout
						</button>
					</div>
				</>
			)}
		</div>
	)
}

export { HeaderUserMenu }
