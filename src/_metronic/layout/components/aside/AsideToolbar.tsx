import { useEffect, useState } from 'react'
import { getProfile } from '../../../../app/Functions/FGGroup'
import { getProfile as profile } from '../../../../app/Functions/FWG'
import { KTIcon } from '../../../helpers'
import { HeaderUserMenu } from '../../../partials'

/* eslint-disable jsx-a11y/anchor-is-valid */
const AsideToolbar = () => {
	const [userProfile, setUserProfile] = useState<any>(null)

	const fetchProfile = async () => {
		try {
			const data: any = await getProfile()
			setUserProfile(data.data)
			localStorage.setItem('fg_group_info', JSON.stringify(data.data))
			localStorage.setItem('admin_type', data?.data?.type)
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchPortalProfile = async () => {
		try {
			const data: any = await profile()
			setUserProfile(data.data)
			localStorage.setItem('portal_info', JSON.stringify(data.data))
			localStorage.setItem('admin_type', data?.data?.type)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		const portalAdminType = localStorage.getItem('fwg_portal')
		if (portalAdminType === 'fwg_portal') {
			fetchPortalProfile()
		} else {
			fetchProfile()
		}
	}, [])

	return (
		<>
			{/*begin::User*/}
			<div className='aside-user d-flex align-items-sm-center justify-content-center py-5'>
				{/*begin::Wrapper*/}
				<div className='aside-user-info flex-row-fluid flex-wrap ms-5'>
					{/*begin::Section*/}
					<div className='d-flex'>
						{/*begin::Info*/}
						<div className='flex-grow-1 me-2'>
							{/*begin::Username*/}
							<a
								href='#'
								className='text-white text-hover-primary fs-6 fw-bold'>
								{userProfile?.full_name || 'Demo'}
							</a>
							{/*end::Username*/}

							{/*begin::Label*/}
							<div className='d-flex align-items-center text-success fs-9'>
								<span className='bullet bullet-dot bg-success me-1'></span>
								{userProfile?.type}
							</div>
							{/*end::Label*/}
						</div>
						{/*end::Info*/}

						{/*begin::User menu*/}
						<div className='me-n2'>
							{/*begin::Action*/}
							<a
								href='#'
								className='btn btn-icon btn-sm btn-active-color-primary mt-n2'
								data-kt-menu-trigger='click'
								data-kt-menu-placement='bottom-start'
								data-kt-menu-overflow='false'>
								<KTIcon
									iconName='setting-2'
									className='text-muted fs-1'
								/>
							</a>

							<HeaderUserMenu />
							{/*end::Action*/}
						</div>
						{/*end::User menu*/}
					</div>
					{/*end::Section*/}
				</div>
				{/*end::Wrapper*/}
			</div>
			{/*end::User*/}

			<div className='aside-search'></div>
		</>
	)
}

export { AsideToolbar }
