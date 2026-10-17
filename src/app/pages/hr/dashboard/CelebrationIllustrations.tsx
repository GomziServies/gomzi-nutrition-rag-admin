import React from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'

interface IllustrationProps {
	onClick?: () => void
}

/**
 * 3D-Styled Birthday Cake Vector / High-Resolution Illustration matching the approved reference
 */
export const BirthdayCakeIllustration: React.FC<IllustrationProps> = ({ onClick }) => {
	return (
		<div
			className='gz-illustration-container gz-cake-wrapper'
			onClick={onClick}
			role='button'
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					onClick?.()
				}
			}}
			title='Click to celebrate!'>
			<img
				src={toAbsoluteUrl('/media/illustrations/hr/birthday-cake.png')}
				alt='Birthday Cake Celebration'
				className='gz-celebration-cake-img'
				loading='eager'
				onError={(e) => {
					// Fallback if image fails
					const target = e.currentTarget
					target.style.display = 'none'
				}}
			/>
		</div>
	)
}

/**
 * 3D-Styled Golden Trophy Vector / High-Resolution Illustration matching the approved reference
 */
export const WorkAnniversaryTrophyIllustration: React.FC<IllustrationProps> = ({ onClick }) => {
	return (
		<div
			className='gz-illustration-container gz-trophy-wrapper'
			onClick={onClick}
			role='button'
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					onClick?.()
				}
			}}
			title='Click to celebrate milestone!'>
			<img
				src={toAbsoluteUrl('/media/illustrations/hr/anniversary-trophy.png')}
				alt='Happy Work Anniversary Trophy'
				className='gz-celebration-trophy-img'
				loading='eager'
				onError={(e) => {
					// Fallback if image fails
					const target = e.currentTarget
					target.style.display = 'none'
				}}
			/>
		</div>
	)
}
