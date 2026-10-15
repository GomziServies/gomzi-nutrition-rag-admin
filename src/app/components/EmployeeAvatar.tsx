import React, { useEffect, useState } from 'react'
import { FG_GROUP_FILE_BASE_URL } from '../constants/base_URL'

/**
 * Resolve an employee's real profile picture from whichever field the API
 * happens to populate.
 */
export const resolveEmployeePhoto = (employee: any): string => {
	if (!employee) return ''

	const candidates = [
		employee?.employee?.photo,
		employee?.photo,
		employee?.profile_image,
		employee?.profileImage,
		employee?.employee?.profile_image,
		employee?.image,
		employee?.avatar,
	]

	const raw = candidates.find((c) => typeof c === 'string' && c.trim() !== '')
	if (!raw) return ''

	const value = raw.trim()
	if (/(placeimg\.com|lorempixel\.com)/i.test(value)) return ''
	if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value

	return `${FG_GROUP_FILE_BASE_URL}/${value.replace(/^\/+/, '')}`
}

/** Up to two initials, used only when there is no picture to show. */
export const getInitials = (name?: string, fallback = 'U'): string => {
	const parts = String(name || '')
		.trim()
		.split(/\s+/)
		.filter(Boolean)
	if (parts.length === 0) return fallback
	return parts
		.slice(0, 2)
		.map((p) => p[0])
		.join('')
		.toUpperCase()
}

interface EmployeeAvatarProps {
	employee?: any
	photo?: string
	name?: string
	size?: number
	shape?: 'circle' | 'rounded'
	className?: string
	style?: React.CSSProperties
	linkToFull?: boolean
	title?: string
}

export const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
	employee,
	photo,
	name,
	size = 40,
	shape = 'circle',
	className = '',
	style,
	linkToFull = false,
	title,
}) => {
	const resolved = photo ? resolveEmployeePhoto({ photo }) : resolveEmployeePhoto(employee)
	const displayName =
		name || employee?.full_name || employee?.name || employee?.employee?.full_name || ''
	const initials = getInitials(displayName)

	const [failed, setFailed] = useState(false)

	useEffect(() => {
		setFailed(false)
	}, [resolved])

	const borderRadius = shape === 'circle' ? '50%' : `${Math.max(6, Math.round(size * 0.22))}px`

	const baseStyle: React.CSSProperties = {
		width: `${size}px`,
		height: `${size}px`,
		borderRadius,
		flexShrink: 0,
		objectFit: 'cover',
		...style,
	}

	const showPhoto = resolved && !failed

	const content = showPhoto ? (
		<img
			src={resolved}
			alt={displayName || 'User'}
			title={title || displayName}
			className={className}
			style={{
				...baseStyle,
				border: '1.5px solid #DFE7F0',
				background: '#F3F7FC',
				display: 'block',
			}}
			onError={() => setFailed(true)}
			loading='lazy'
		/>
	) : (
		<div
			className={className}
			title={title || displayName}
			aria-label={displayName || 'User'}
			style={{
				...baseStyle,
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'linear-gradient(135deg, #1E3A5F 0%, #152D4A 100%)',
				color: '#ffffff',
				fontWeight: 700,
				fontSize: `${Math.max(10, Math.round(size * 0.38))}px`,
				letterSpacing: '0.3px',
				lineHeight: 1,
				userSelect: 'none',
			}}>
			{initials}
		</div>
	)

	if (linkToFull && showPhoto) {
		return (
			<a
				href={resolved}
				target='_blank'
				rel='noopener noreferrer'
				style={{ flexShrink: 0, display: 'inline-block', lineHeight: 0 }}
				title='Open full size photo'>
				{content}
			</a>
		)
	}

	return content
}

export default EmployeeAvatar
