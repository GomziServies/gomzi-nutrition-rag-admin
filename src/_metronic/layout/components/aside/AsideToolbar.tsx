import { useEffect, useState } from 'react'
import { getProfile } from '../../../../app/Functions/FGGroup'
import { getProfile as profile } from '../../../../app/Functions/FWG'
import { KTIcon, toAbsoluteUrl } from '../../../helpers'
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

	const [isMinimized, setIsMinimized] = useState(() =>
		typeof document !== 'undefined' && document.body.classList.contains('aside-minimize')
	)

	const toggleSidebar = () => {
		const nextState = !document.body.classList.contains('aside-minimize')
		if (nextState) {
			document.body.classList.add('aside-minimize')
			document.body.classList.add('gz-aside-collapsed')
			document.body.removeAttribute('data-kt-aside-minimize')
		} else {
			document.body.classList.remove('aside-minimize')
			document.body.classList.remove('gz-aside-collapsed')
			document.body.removeAttribute('data-kt-aside-minimize')
		}
		setIsMinimized(nextState)
	}

	return (
		<div className={`gz-aside-top ${isMinimized ? 'gz-aside-top-minimized' : ''}`}>
			<a
				href='/rag/dashboard'
				className='gz-brand-lockup d-flex align-items-center'
				onClick={isMinimized ? (e) => { e.preventDefault(); toggleSidebar(); } : undefined}
				title={isMinimized ? 'Click to expand sidebar' : 'RAG Admin'}
				style={{ cursor: isMinimized ? 'pointer' : 'default', textDecoration: 'none' }}>
				<img
					alt='RAG Logo'
					src={toAbsoluteUrl('/media/logos/rag-logo.webp')}
					className='gz-brand-logo'
					style={{
						height: isMinimized ? '28px' : '38px',
						maxWidth: isMinimized ? '28px' : '170px',
						objectFit: 'contain',
					}}
				/>
			</a>
			<button
				type='button'
				className='gz-aside-collapse-btn'
				title={isMinimized ? 'Expand sidebar' : 'Collapse sidebar'}
				onClick={toggleSidebar}>
				<i className={`bi ${isMinimized ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`}></i>
			</button>
		</div>
	)
}

export { AsideToolbar }
