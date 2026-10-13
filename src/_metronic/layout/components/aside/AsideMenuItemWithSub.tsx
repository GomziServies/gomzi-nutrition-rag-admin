import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useLocation } from 'react-router'
import { checkIsActive, WithChildren } from '../../../helpers'

type Props = {
	to: string
	title: string
	Icon?: any
	fontIcon?: string
	hasBullet?: boolean
}

const AsideMenuItemWithSub: React.FC<Props & WithChildren> = ({
	children,
	to,
	title,
	Icon,
	fontIcon,
	hasBullet,
}) => {
	const { pathname } = useLocation()
	const isActive = checkIsActive(pathname, to)

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

	const tipId = `aside-sub-tip-${(to || title).replace(/[^a-zA-Z0-9_-]/g, '')}`

	return (
		<div
			className={clsx('menu-item', { 'here show': isActive }, 'menu-accordion')}
			data-kt-menu-trigger='click'>
			<OverlayTrigger
				placement='right'
				delay={{ show: 120, hide: 50 }}
				overlay={
					<Tooltip id={tipId} className='gz-aside-tooltip'>
						{title}
					</Tooltip>
				}>
				<span className='menu-link'>
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
		</div>
	)
}

export { AsideMenuItemWithSub }
