import { FC, useEffect, useState } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { HeaderUserMenu } from '../../../partials'

export const AsideFooter: FC = () => {
	const [userProfile, setUserProfile] = useState<any>(null)
	const [showMenu, setShowMenu] = useState(false)

	useEffect(() => {
		const data = localStorage.getItem('fg_group_info')
		if (data) {
			try {
				setUserProfile(JSON.parse(data))
			} catch (e) {
				console.error(e)
			}
		}
	}, [])

	const name = userProfile?.full_name || 'chiragFWG'
	const role = userProfile?.type || 'Employee'
	const initials =
		name
			.split(' ')
			.map((n: string) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase() || 'CF'

	const asidePopperConfig = {
		strategy: 'fixed' as const,
		modifiers: [
			{
				name: 'offset',
				options: {
					offset: [0, 10],
				},
			},
			{
				name: 'preventOverflow',
				options: {
					boundary: 'viewport' as const,
					padding: 8,
				},
			},
		],
	}

	return (
		<div className='gz-aside-footer'>
			{/* Motivational Quote Card */}
			<div className='gz-aside-quote-card'>
				<div className='gz-quote-badge'>
					<span className='gz-quote-badge-icon'>
						<i className='bi bi-journal-bookmark-fill'></i>
					</span>
					<div className='gz-quote-badge-text'>
						<span className='gz-quote-tag'>KEEP</span>
						<span className='gz-quote-heading'>GOING.</span>
					</div>
				</div>
				<p className='gz-quote-quote'>&ldquo;Discipline today, stronger tomorrow.&rdquo;</p>
				<Link to='/employee/sop' className='gz-quote-arrow' title='View SOP'>
					<i className='bi bi-arrow-right'></i>
				</Link>
			</div>

			{/* Utility Links */}
			<div className='gz-aside-nav-utils'>
				<OverlayTrigger
					placement='right'
					popperConfig={asidePopperConfig}
					delay={{ show: 50, hide: 0 }}
					overlay={<Tooltip id='aside-tip-settings' className='gz-aside-tooltip'>Settings</Tooltip>}>
					<Link to='/employee/document' className='gz-aside-util-link'>
						<i className='bi bi-gear'></i>
						<span>Settings</span>
					</Link>
				</OverlayTrigger>
				<OverlayTrigger
					placement='right'
					popperConfig={asidePopperConfig}
					delay={{ show: 50, hide: 0 }}
					overlay={<Tooltip id='aside-tip-help' className='gz-aside-tooltip'>Help &amp; Support</Tooltip>}>
					<Link to='/employee/sop' className='gz-aside-util-link'>
						<i className='bi bi-question-circle'></i>
						<span>Help &amp; Support</span>
					</Link>
				</OverlayTrigger>
			</div>

			{/* User Profile Pill at Bottom */}
			<div className='gz-aside-user-widget'>
				<OverlayTrigger
					placement='right'
					popperConfig={asidePopperConfig}
					delay={{ show: 50, hide: 0 }}
					overlay={<Tooltip id='aside-tip-user' className='gz-aside-tooltip'>{name} ({role})</Tooltip>}>
					<div className='gz-aside-user-info'>
						<div className='gz-aside-avatar-circle'>{initials}</div>
						<div className='gz-aside-user-names'>
							<span className='gz-aside-username'>{name}</span>
							<span className='gz-aside-userrole'>{role}</span>
						</div>
					</div>
				</OverlayTrigger>
				<div className='gz-aside-user-actions position-relative'>
					<button
						type='button'
						className='gz-aside-dots-btn'
						onClick={() => setShowMenu(!showMenu)}
						title='User Menu'>
						<i className='bi bi-three-dots-vertical'></i>
					</button>
					{showMenu && (
						<div
							className='gz-aside-user-dropdown-popup'
							onClick={() => setShowMenu(false)}>
							<HeaderUserMenu />
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
