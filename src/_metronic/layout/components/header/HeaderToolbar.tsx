/* eslint-disable jsx-a11y/anchor-is-valid */
import { useEffect, useState } from 'react'
import { GetMyAuthority } from '../../../../app/Functions/FGGroup/RBAC'
import { useLayout } from '../../core'
import { DefaultTitle } from './page-title/DefaultTitle'

const HeaderToolbar = () => {
	const { classes } = useLayout()
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

	return (
		<div className='toolbar d-flex align-items-stretch'>
			{/* begin::Toolbar container */}
			<div
				className={`${classes.headerContainer.join(
					' '
				)} py-6 py-lg-0 d-flex flex-row align-items-lg-stretch justify-content-between`}>
				<DefaultTitle />
				<div className='d-flex align-items-stretch pt-3 pt-lg-0'>
					{/* begin::Action wrapper */}
					{/* <div className='d-flex align-items-center'>
						<div className='bullet bg-secondary h-35px w-1px mx-5'></div>
					</div> */}
					{/* end::Action wrapper */}

					{/* begin::Action wrapper */}
					{/* <div className='d-flex align-items-center'>
						<span className='fs-7 text-gray-700 fw-bolder pe-3 d-none d-xxl-block'>Theme:</span>

						<div className='d-flex'>
							<div className='d-flex align-items-center'>
								<ThemeModeSwitcher toggleBtnClass='btn btn-sm btn-icon btn-icon-muted btn-active-icon-primary' />
							</div>
						</div>
					</div> */}

					<div className='d-flex align-items-center'>
						<div className='bullet bg-secondary h-35px w-1px mx-5'></div>

						<div className='d-flex align-items-center'></div>
					</div>
					{/* end::Action wrapper */}
				</div>
			</div>
			{/* end::Toolbar container */}
		</div>
	)
}

export { HeaderToolbar }
