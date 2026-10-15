/* eslint-disable jsx-a11y/anchor-is-valid */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC } from 'react'
import { toAbsoluteUrl } from '../../../helpers'
import NumberTicker from '../../../../app/components/NumberTicker'

type Props = {
	className?: string
	title: any | number
	description: string
	Icon?: any
	color?: string
	badgeText?: string
	onClick?: () => void
}

const StatisticsWidget2: FC<Props> = ({
	className = '',
	title,
	description,
	Icon,
	color = 'primary',
	badgeText,
	onClick,
}) => {
	const rawAmount =
		typeof title === 'string'
			? parseFloat(title.replace(/[^0-9.-]+/g, '')) || 0
			: typeof title === 'number'
			? title
			: 0

	// Curated color map following modern slate navy identity
	const colorMap: Record<string, { bg: string; text: string }> = {
		primary: { bg: '#EFF6FF', text: '#2563EB' },
		success: { bg: '#ECFDF5', text: '#059669' },
		danger: { bg: '#FFF1F2', text: '#E11D48' },
		warning: { bg: '#FFFBEB', text: '#D97706' },
		info: { bg: '#F0F9FF', text: '#0284C7' },
	}

	const themeColor = colorMap[color] || colorMap.primary

	return (
		<div
			className={`gz-stat-kpi-card ${className}`}
			onClick={onClick}>
			{/* Watermark Brand Logo */}
			<img
				src={toAbsoluteUrl('/media/logos/rag-favicon-logo.png')}
				alt=''
				className='gz-stat-kpi-watermark'
			/>

			{/* Top Header: Label & Modern Icon Pill */}
			<div
				className='d-flex align-items-center justify-content-between mb-3 position-relative'
				style={{ zIndex: 1 }}>
				<div className='d-flex align-items-center gap-2'>
					<span className='gz-stat-kpi-label'>{description}</span>
					{badgeText && (
						<span
							className='gz-stat-kpi-badge'
							style={{ backgroundColor: themeColor.bg, color: themeColor.text }}>
							{badgeText}
						</span>
					)}
				</div>
				{Icon && (
					<div
						className='gz-stat-kpi-icon-wrap'
						style={{ backgroundColor: themeColor.bg, color: themeColor.text }}>
						<FontAwesomeIcon icon={Icon as any} />
					</div>
				)}
			</div>

			{/* Main Amount with rolling NumberTicker */}
			<div
				className='gz-stat-kpi-value position-relative'
				style={{ zIndex: 1 }}>
				<span className='gz-stat-kpi-currency'>₹</span>
				<NumberTicker value={rawAmount} />
			</div>

			{/* Bottom subtle indicator */}
			<div
				className='d-flex align-items-center justify-content-between mt-3 pt-2 border-top border-light position-relative'
				style={{ zIndex: 1 }}>
				<span className='gz-stat-kpi-sub'>
					{description.toLowerCase().includes('total') ? (
						<span className='text-primary fw-semibold'>• Overall Gross</span>
					) : description.toLowerCase().includes('paid') ? (
						<span className='text-success fw-semibold'>• Realized Revenue</span>
					) : (
						<span className='text-danger fw-semibold'>• Pending Collection</span>
					)}
				</span>
				<span className='gz-stat-kpi-hint'>Click to filter</span>
			</div>
		</div>
	)
}

export { StatisticsWidget2 }
