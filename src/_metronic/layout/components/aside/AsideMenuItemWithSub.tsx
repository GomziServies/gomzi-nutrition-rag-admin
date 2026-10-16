import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { checkIsActive, WithChildren } from '../../../helpers'

type Props = {
	to: string
	title: string
	Icon?: any
	fontIcon?: string
	hasBullet?: boolean
}

const isSidebarMinimized = () => {
	if (typeof document === 'undefined') return false
	return (
		document.body.classList.contains('aside-minimize') ||
		document.body.classList.contains('gz-aside-collapsed') ||
		document.body.getAttribute('data-kt-aside-minimize') === 'on'
	)
}

const AsideMenuItemWithSub: React.FC<Props & WithChildren> = ({
	children,
	to,
	title,
	Icon,
	fontIcon,
	hasBullet,
}) => {
	const navigate = useNavigate()
	const { pathname } = useLocation()
	const cleanPath = pathname.split(/[?#]/)[0]

	let hasActiveChild = false
	React.Children.forEach(children, (child: any) => {
		if (child && child.props && child.props.to) {
			const childTo = child.props.to
			if (childTo === cleanPath || (childTo !== '/rag' && cleanPath.startsWith(childTo + '/'))) {
				hasActiveChild = true
			}
		}
	})

	const isActive = (to ? checkIsActive(pathname, to) : false) || hasActiveChild

	const [isFloatingOpen, setIsFloatingOpen] = useState(false)
	const [floatingPos, setFloatingPos] = useState({ top: 0, left: 80, maxHeight: 400 })
	const triggerRef = useRef<HTMLSpanElement | null>(null)
	const panelRef = useRef<HTMLDivElement | null>(null)
	const menuId = useRef(`sub-menu-${Math.random().toString(36).slice(2, 9)}`).current

	const isEmployeeLogin = localStorage.getItem('is_employee_login') === 'true'
	const currentPanel = localStorage.getItem('admin')

	if (isEmployeeLogin && currentPanel && currentPanel !== 'Employee') {
		const cachedAuths = localStorage.getItem('employee_authorities')
		if (cachedAuths) {
			try {
				const authorities = JSON.parse(cachedAuths)
				const panelAuth = authorities.find(
					(auth: any) => auth.panel_id?.name?.trim().toUpperCase() === currentPanel.toUpperCase()
				)
				if (panelAuth) {
					const authTitles = (panelAuth.menu_ids || []).map((m: any) =>
						m.title?.trim().toLowerCase()
					)
					const hasTitleAccess = (itemTitle: string) =>
						authTitles.includes(itemTitle?.trim().toLowerCase())

					const parentHasAccess = hasTitleAccess(title)
					let anyChildHasAccess = false
					React.Children.forEach(children, (child: any) => {
						if (child && child.props && child.props.title) {
							if (hasTitleAccess(child.props.title)) {
								anyChildHasAccess = true
							}
						}
					})

					if (!parentHasAccess && !anyChildHasAccess) {
						return null
					}
				} else {
					return null
				}
			} catch (e) {
				console.error('Error parsing authorities', e)
			}
		}
	}

	const safeId = (to || title).replace(/[^a-zA-Z0-9_-]/g, '')
	const tipId = `aside-sub-tip-${safeId}`
	const floatingPanelId = `aside-float-${safeId}`

	const calculatePosition = () => {
		if (!triggerRef.current) return
		const rect = triggerRef.current.getBoundingClientRect()
		const viewportHeight = window.innerHeight
		const viewportWidth = window.innerWidth

		const left = Math.min(Math.round(rect.right + 10), Math.max(16, viewportWidth - 260))
		const maxHeight = Math.max(200, viewportHeight - 32)

		const childCount = React.Children.count(children)
		const estimatedHeight = Math.min(maxHeight, 52 + childCount * 42 + 20)

		let top = rect.top
		if (top + estimatedHeight > viewportHeight - 16) {
			top = Math.max(16, viewportHeight - estimatedHeight - 16)
		}

		setFloatingPos({ top, left, maxHeight })
	}

	useLayoutEffect(() => {
		if (isFloatingOpen && panelRef.current && triggerRef.current) {
			const rect = triggerRef.current.getBoundingClientRect()
			const actualHeight = panelRef.current.offsetHeight
			const viewportHeight = window.innerHeight

			let top = rect.top
			if (top + actualHeight > viewportHeight - 16) {
				top = Math.max(16, viewportHeight - actualHeight - 16)
				setFloatingPos((prev) => ({ ...prev, top }))
			}
		}
	}, [isFloatingOpen])

	// Automatically close floating submenu on route change
	useEffect(() => {
		setIsFloatingOpen(false)
	}, [pathname])

	// Manage outside clicks, Escape key, resize, and mutual exclusion
	useEffect(() => {
		if (!isFloatingOpen) return

		document.body.classList.add('gz-floating-sub-active')

		const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
			const target = e.target as Node | null
			if (!target) return
			if (panelRef.current && panelRef.current.contains(target)) return
			if (triggerRef.current && triggerRef.current.contains(target)) return
			setIsFloatingOpen(false)
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault()
				setIsFloatingOpen(false)
				triggerRef.current?.focus()
			}
		}

		const handleCloseOthers = (e: Event) => {
			const customEvent = e as CustomEvent
			if (customEvent.detail?.id !== menuId) {
				setIsFloatingOpen(false)
			}
		}

		const handleGlobalClose = () => {
			setIsFloatingOpen(false)
		}

		document.addEventListener('mousedown', handleOutsideClick)
		document.addEventListener('touchstart', handleOutsideClick)
		document.addEventListener('keydown', handleKeyDown)
		window.addEventListener('gz-close-other-floating-submenus', handleCloseOthers)
		window.addEventListener('gz-close-floating-submenus', handleGlobalClose)
		window.addEventListener('resize', handleGlobalClose)

		return () => {
			document.body.classList.remove('gz-floating-sub-active')
			document.removeEventListener('mousedown', handleOutsideClick)
			document.removeEventListener('touchstart', handleOutsideClick)
			document.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('gz-close-other-floating-submenus', handleCloseOthers)
			window.removeEventListener('gz-close-floating-submenus', handleGlobalClose)
			window.removeEventListener('resize', handleGlobalClose)
		}
	}, [isFloatingOpen, menuId])

	const handleLinkClick = (e: React.MouseEvent) => {
		const minimized = isSidebarMinimized()
		if (minimized) {
			e.preventDefault()
			e.stopPropagation()

			const childCount = React.Children.count(children)
			if (childCount === 0) {
				return
			}

			if (isFloatingOpen) {
				setIsFloatingOpen(false)
			} else {
				window.dispatchEvent(
					new CustomEvent('gz-close-other-floating-submenus', {
						detail: { id: menuId },
					})
				)
				calculatePosition()
				setIsFloatingOpen(true)
			}
		}
	}

	return (
		<div
			className={clsx('menu-item', { 'here show': isActive }, 'menu-accordion')}
			data-kt-menu-trigger='click'>
			<OverlayTrigger
				placement='right'
				show={isFloatingOpen ? false : undefined}
				delay={{ show: 120, hide: 50 }}
				overlay={
					<Tooltip id={tipId} className='gz-aside-tooltip'>
						{title}
					</Tooltip>
				}>
				<span
					ref={triggerRef}
					className={clsx('menu-link', {
						'gz-floating-trigger-active': isFloatingOpen,
					})}
					tabIndex={0}
					role='button'
					aria-haspopup='true'
					aria-expanded={isFloatingOpen}
					aria-controls={isFloatingOpen ? floatingPanelId : undefined}
					onClick={handleLinkClick}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							handleLinkClick(e as any)
						}
					}}>
					{hasBullet && (
						<span className='menu-bullet'>
							<span className='bullet bullet-dot'></span>
						</span>
					)}
					{Icon && (
						<span className='menu-icon'>
							<FontAwesomeIcon
								icon={Icon}
								className='fs-2'
							/>
						</span>
					)}
					{fontIcon && <i className={clsx('bi fs-3', fontIcon)}></i>}
					<span className='menu-title'>{title}</span>
					<span className='menu-arrow'></span>
				</span>
			</OverlayTrigger>
			<div className={clsx('menu-sub menu-sub-accordion', { 'menu-active-bg': isActive })}>
				{children}
			</div>

			{isFloatingOpen &&
				createPortal(
					<div
						id={floatingPanelId}
						ref={panelRef}
						className='gz-floating-sub-panel'
						style={{
							top: `${floatingPos.top}px`,
							left: `${floatingPos.left}px`,
							maxHeight: `${floatingPos.maxHeight}px`,
						}}
						role='menu'
						aria-label={`${title} Submenu`}>
						<div className='gz-floating-sub-header'>
							{Icon && (
								<span className='gz-floating-sub-icon'>
									<FontAwesomeIcon icon={Icon} />
								</span>
							)}
							{fontIcon && <i className={clsx('bi fs-4 me-2', fontIcon)}></i>}
							<span className='gz-floating-sub-title'>{title}</span>
						</div>
						<div className='gz-floating-sub-divider' />
						<div className='gz-floating-sub-body'>
							{React.Children.map(children, (child: any) => {
								if (!child || !child.props) return null
								const childTo = child.props.to
								const childTitle = child.props.title
								if (!childTitle) return null

								if (isEmployeeLogin && currentPanel && currentPanel !== 'Employee') {
									const cachedAuths = localStorage.getItem('employee_authorities')
									if (cachedAuths) {
										try {
											const authorities = JSON.parse(cachedAuths)
											const panelAuth = authorities.find(
												(auth: any) =>
													auth.panel_id?.name?.trim().toUpperCase() ===
													currentPanel.toUpperCase()
											)
											if (panelAuth) {
												const authTitles = (panelAuth.menu_ids || []).map((m: any) =>
													m.title?.trim().toLowerCase()
												)
												if (!authTitles.includes(childTitle.trim().toLowerCase())) {
													return null
												}
											}
										} catch (e) {}
									}
								}

								const isChildExact = cleanPath === childTo
								const isChildSub = Boolean(
									childTo &&
									childTo !== '/' &&
									childTo !== '/rag' &&
									cleanPath.startsWith(childTo + '/') &&
									!cleanPath.endsWith('/add-user') &&
									!cleanPath.endsWith('/create') &&
									!cleanPath.endsWith('/reference')
								)
								const isChildActive =
									child.props.isActive !== undefined
										? child.props.isActive
										: isChildExact || isChildSub

								return (
									<div
										key={childTo || childTitle}
										className='menu-item'
										style={{ cursor: 'pointer' }}
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											setIsFloatingOpen(false)
											if (childTo) {
												navigate(childTo)
											}
										}}>
										<span className={clsx('menu-link without-sub', { active: isChildActive })}>
											<span className='menu-bullet'>
												<span className='bullet bullet-dot'></span>
											</span>
											<span className='menu-title'>{childTitle}</span>
										</span>
									</div>
								)
							})}
						</div>
					</div>,
					document.body
				)}
		</div>
	)
}

export { AsideMenuItemWithSub }
