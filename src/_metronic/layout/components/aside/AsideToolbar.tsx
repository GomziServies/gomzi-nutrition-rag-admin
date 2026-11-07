import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfile } from '../../../../app/Functions/FGGroup'
import { getProfile as profile } from '../../../../app/Functions/FWG'
import { isProPartnerOnlyUser } from '../../../../app/modules/auth'
import { toAbsoluteUrl } from '../../../helpers'

/* eslint-disable jsx-a11y/anchor-is-valid */
const AsideToolbar = () => {
	const [userProfile, setUserProfile] = useState<any>(null)

	const fetchProfile = async () => {
		try {
			const data: any = await getProfile()
			if (data?.data) {
				setUserProfile(data.data)
				localStorage.setItem('fg_group_info', JSON.stringify(data.data))
				localStorage.setItem('admin_type', data?.data?.type)
			}
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchPortalProfile = async () => {
		try {
			const data: any = await profile()
			if (data?.data) {
				setUserProfile(data.data)
				localStorage.setItem('portal_info', JSON.stringify(data.data))
				localStorage.setItem('admin_type', data?.data?.type)
			}
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

	const [isMinimized, setIsMinimized] = useState(() => {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('sidebar_minimized')
			if (stored === 'true') {
				document.body.classList.add('aside-minimize')
				document.body.classList.add('gz-aside-collapsed')
				return true
			} else if (stored === 'false') {
				document.body.classList.remove('aside-minimize')
				document.body.classList.remove('gz-aside-collapsed')
				return false
			}
		}
		return typeof document !== 'undefined' && document.body.classList.contains('aside-minimize')
	})

	const toggleSidebar = () => {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new Event('gz-close-floating-submenus'))
		}
		const nextState = !document.body.classList.contains('aside-minimize')
		if (nextState) {
			document.body.classList.add('aside-minimize')
			document.body.classList.add('gz-aside-collapsed')
			document.body.removeAttribute('data-kt-aside-minimize')
			localStorage.setItem('sidebar_minimized', 'true')
		} else {
			document.body.classList.remove('aside-minimize')
			document.body.classList.remove('gz-aside-collapsed')
			document.body.removeAttribute('data-kt-aside-minimize')
			localStorage.setItem('sidebar_minimized', 'false')
		}
		setIsMinimized(nextState)
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new Event('resize'))
			setTimeout(() => {
				window.dispatchEvent(new Event('resize'))
			}, 250)
		}
	}

	const isPartner = isProPartnerOnlyUser(userProfile)
	const brandTarget = isPartner ? '/rag/pro-partner/coupons' : '/rag/dashboard'
	const brandTitle = isPartner
		? 'RAG Pro Partner Portal'
		: isMinimized
		? 'Click to expand sidebar'
		: 'RAG Admin'

	return (
		<div className={`gz-aside-top ${isMinimized ? 'gz-aside-top-minimized' : ''}`}>
			<Link
				to={brandTarget}
				className='gz-brand-lockup d-flex align-items-center'
				onClick={
					isMinimized
						? (e) => {
								e.preventDefault()
								toggleSidebar()
						  }
						: undefined
				}
				title={brandTitle}
				style={{ cursor: isMinimized ? 'pointer' : 'default', textDecoration: 'none' }}>
				<img
					alt={isPartner ? 'RAG Pro Partner Logo' : 'RAG Logo'}
					src={toAbsoluteUrl('/media/logos/rag-logo.webp')}
					className='gz-brand-logo'
					style={{
						height: isMinimized ? '28px' : '38px',
						maxWidth: isMinimized ? '28px' : '170px',
						objectFit: 'contain',
					}}
				/>
			</Link>
			<button
				type='button'
				className='gz-aside-collapse-btn'
				aria-label={isMinimized ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-expanded={!isMinimized}
				title={isMinimized ? 'Expand sidebar' : 'Collapse sidebar'}
				onClick={toggleSidebar}>
				<i className={`bi ${isMinimized ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
			</button>
		</div>
	)
}

export { AsideToolbar }
