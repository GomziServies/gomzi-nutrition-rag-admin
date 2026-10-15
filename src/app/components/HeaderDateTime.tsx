import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons'

/**
 * Common live date-time shown in the app header.
 * Displays bold current time on top, muted date with calendar icon below.
 */
export const HeaderDateTime: React.FC = () => {
	const [now, setNow] = useState(() => new Date())

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 1000)
		return () => clearInterval(timer)
	}, [])

	const formattedDate = now.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
	const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

	return (
		<div className='d-flex flex-column justify-content-center me-auto' aria-label='Current date and time'>
			<span className='text-dark fw-bolder fs-6 lh-1 mb-1' style={{ letterSpacing: '-0.3px' }}>
				{formattedTime}
			</span>
			<span className='text-muted fw-bold fs-8 d-flex align-items-center lh-1 d-none d-sm-flex'>
				<FontAwesomeIcon icon={faCalendarAlt} className='me-1' style={{ fontSize: '11px' }} />
				{formattedDate}
			</span>
		</div>
	)
}

export default HeaderDateTime
