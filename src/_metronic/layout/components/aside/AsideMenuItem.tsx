import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { FC } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useLocation } from 'react-router'
import { Link } from 'react-router-dom'
import { checkIsActive, WithChildren } from '../../../helpers'

type Props = {
	to: string
	title: string
	Icon?: any
	fontIcon?: string
	hasBullet?: boolean
	isActive?: boolean
	badge?: string | number
}

const AsideMenuItem: FC<Props & WithChildren> = ({
	children,
	to,
	title,
	Icon,
	fontIcon,
	hasBullet = false,
	isActive: isActiveOverride,
	badge,
}) => {
	const { pathname } = useLocation()
	const isActive = isActiveOverride !== undefined ? isActiveOverride : checkIsActive(pathname, to)

	const isEmployeeLogin = localStorage.getItem('is_employee_login') === 'true'
	const currentPanel = localStorage.getItem('admin')

	const isContactInquiry =
		to?.includes('contact-inquiry') ||
		title?.trim().toLowerCase() === 'contact inquiry' ||
		title?.trim().toLowerCase() === 'contact inquery'

	if (!isContactInquiry && isEmployeeLogin && currentPanel && currentPanel !== 'Employee') {
		const cachedAuths = localStorage.getItem('employee_authorities')
		if (cachedAuths) {
			try {
				const authorities = JSON.parse(cachedAuths)
				const panelAuth = authorities.find(
					(auth: any) => auth.panel_id?.name?.trim().toUpperCase() === currentPanel.toUpperCase()
				)
				if (panelAuth) {
					const hasAccess = panelAuth.menu_ids?.some(
						(m: any) => m.title?.trim().toLowerCase() === title?.trim().toLowerCase()
					)
					if (!hasAccess) {
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

	const tipId = `aside-tip-${(to || title).replace(/[^a-zA-Z0-9_-]/g, '')}`

	return (
		<div className='menu-item'>
			<OverlayTrigger
				placement='right'
				delay={{ show: 120, hide: 50 }}
				overlay={
					<Tooltip id={tipId} className='gz-aside-tooltip'>
						{title}
					</Tooltip>
				}>
				<Link
					className={clsx('menu-link without-sub', { active: isActive })}
					to={to}>
					{hasBullet && (
						<span className='menu-bullet'>
							<span className='bullet bullet-dot'></span>
						</span>
					)}
					{Icon && (
						<span className='menu-icon'>
							<FontAwesomeIcon
								icon={Icon as any}
								className='fs-2'
							/>
						</span>
					)}
					{fontIcon && <i className={clsx('bi fs-3', fontIcon)}></i>}
					<span className='menu-title'>{title}</span>
					{badge !== undefined && badge !== null && (
						<span className='gz-menu-badge'>{badge}</span>
					)}
				</Link>
			</OverlayTrigger>
			{children}
		</div>
	)
}

export { AsideMenuItem }
