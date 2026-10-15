import clsx from 'clsx'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { KTIcon, toAbsoluteUrl } from '../../../helpers'
import { useLayout } from '../../core'
import { HeaderToolbar } from './HeaderToolbar'

export function HeaderWrapper() {
	const { config, classes, attributes } = useLayout()
	const { aside } = config
	const location = useLocation()
	const routesToCloseSidebar = [
		'/fwg/chat',
		'/hr/hr-chat',
		'/fgiit/all-order',
		'/fgiit/contact-inquiry/contact-inquiry-view',
		'/hr/attendance',
	]

	const shouldCloseSidebar = routesToCloseSidebar.includes(location.pathname)

	useEffect(() => {
		const asideToggle = document.getElementById('kt_aside_toggle')
		if (asideToggle) {
			const body = document.body
			const isActive = body.classList.contains('aside-minimize')

			if (shouldCloseSidebar && !isActive) {
				asideToggle.click()
			} else if (!shouldCloseSidebar && isActive) {
				asideToggle.click()
			}
		}
	}, [shouldCloseSidebar])

	return (
		<div
			id='kt_header'
			className={clsx('header', classes.header.join(' '), 'align-items-stretch')}
			{...attributes.headerMenu}>
			{/* begin::Brand (mobile only toggle & logo) */}
			<div className='header-brand d-lg-none d-flex align-items-center flex-shrink-0 px-4'>
				{/* begin::Logo */}
				<div className='d-flex align-items-center me-3'>
					<a
						href='/rag/dashboard'
						className='d-flex align-items-center'
						title='RAG Admin'>
						<img
							alt='RAG Logo'
							src={toAbsoluteUrl('/media/logos/rag-logo.webp')}
							className='h-30px'
							style={{ objectFit: 'contain' }}
						/>
					</a>
					<div className='ms-2'>
						{process.env.REACT_APP_NODE_ENV === 'development' && (
							<span className='badge badge-light-warning fs-8 m-2'>Test</span>
						)}
						{process.env.REACT_APP_NODE_ENV === 'production' && (
							<span className='badge badge-light-success fs-8 m-1'>
								Live <i className='fa-solid fa-2xs fa-circle fa-fade text-success ms-1'></i>
							</span>
						)}
					</div>
				</div>
				{/* end::Logo */}

				{/* begin::Aside mobile toggle */}
				<div
					className='d-flex align-items-center ms-auto me-1'
					title='Show aside menu'>
					<div
						className='btn btn-icon btn-active-color-primary w-30px h-30px'
						id='kt_aside_mobile_toggle'>
						<KTIcon
							iconName='abstract-14'
							className='fs-1'
						/>
					</div>
				</div>
				{/* end::Aside mobile toggle */}
			</div>
			{/* end::Brand */}
			<HeaderToolbar />
		</div>
	)
}
