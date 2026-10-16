import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

export type SculptedCardVariant =
	| 'lime-greeting'
	| 'hero-powder-blue'
	| 'salary-dark'
	| 'sales-navy'
	| 'leave-lavender'
	| 'invoice-lavender'
	| 'expense-pink'
	| 'progress-dark'
	| 'standard'

type SculptedCardProps = {
	variant: SculptedCardVariant
	fill?: string
	className?: string
	style?: React.CSSProperties
	children: React.ReactNode
	contentPadding?: string
	stroke?: string
}

/**
 * Generates mathematically continuous cubic Bézier SVG path silhouettes
 * for GOMZI Bento Dashboard cards.
 */
function buildCardPath(variant: SculptedCardVariant, w: number, h: number): string {
	if (w <= 0 || h <= 0) return ''

	const r = 26 // Standard corner radius

	// Mobile fallback to clean rounded card if viewport is very compact
	if (w < 340) {
		return `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`
	}

	switch (variant) {
		case 'lime-greeting':
		case 'hero-powder-blue': {
			// Top edge has a subtle, elegant organic rise toward the right
			// Bottom-right corner has a tangential concave cut-out notch for the dark floating arrow button
			const topLift = 8
			const notchSize = 72

			return [
				// Top-left corner starting at y = topLift
				`M ${r} ${topLift}`,
				// Gentle upward cubic Bézier wave along top edge to y = 0
				`L ${Math.round(w * 0.42)} ${topLift}`,
				`C ${Math.round(w * 0.55)} ${topLift}, ${Math.round(w * 0.65)} 0, ${Math.round(w * 0.78)} 0`,
				`L ${w - r} 0`,
				// Top-right corner
				`A ${r} ${r} 0 0 1 ${w} ${r}`,
				// Right edge dropping down toward the notch
				`L ${w} ${h - notchSize}`,
				// Concave notch fillet in
				`C ${w} ${h - 58}, ${w - 8} ${h - 48}, ${w - 22} ${h - 48}`,
				// Concave notch inner curve
				`C ${w - 38} ${h - 48}, ${w - 48} ${h - 38}, ${w - 48} ${h - 22}`,
				// Concave notch fillet out to bottom edge
				`C ${w - 48} ${h - 8}, ${w - 58} ${h}, ${w - notchSize} ${h}`,
				// Bottom edge to bottom-left corner
				`L ${r} ${h}`,
				`A ${r} ${r} 0 0 1 0 ${h - r}`,
				// Left edge going up
				`L 0 ${topLift + r}`,
				`A ${r} ${r} 0 0 1 ${r} ${topLift}`,
				'Z',
			].join(' ')
		}

		case 'salary-dark':
		case 'sales-navy': {
			// Asymmetrical stepped top-edge silhouette:
			// High on left (y = 0), smooth S-curve dip in the middle, lower on right (stepDown = 18px)
			// All 4 corners remain clean, smooth rounded corners
			const stepDown = 18
			const dipStart = Math.round(w * 0.48)
			const dipEnd = Math.round(w * 0.62)

			return [
				// Start at top-left corner
				`M ${r} 0`,
				// High flat top edge over left side
				`L ${dipStart} 0`,
				// Smooth organic S-curve flowing down to lower right shelf
				`C ${dipStart + 24} 0, ${dipEnd - 24} ${stepDown}, ${dipEnd} ${stepDown}`,
				// Flat top edge over right side
				`L ${w - r} ${stepDown}`,
				// Top-right corner rounded down to right edge
				`A ${r} ${r} 0 0 1 ${w} ${stepDown + r}`,
				// Right edge to bottom-right corner
				`L ${w} ${h - r}`,
				`A ${r} ${r} 0 0 1 ${w - r} ${h}`,
				// Bottom edge to bottom-left corner
				`L ${r} ${h}`,
				`A ${r} ${r} 0 0 1 0 ${h - r}`,
				// Left edge up to top-left corner
				`L 0 ${r}`,
				`A ${r} ${r} 0 0 1 ${r} 0`,
				'Z',
			].join(' ')
		}

		case 'leave-lavender': {
			// Flowing organic indentation along the lower-right edge matching greeting card's curvature style
			const notchY = h - 68
			const notchX = w - 96

			return [
				`M ${r} 0`,
				`L ${w - r} 0`,
				`A ${r} ${r} 0 0 1 ${w} ${r}`,
				`L ${w} ${notchY}`,
				// Smooth organic indentation curving inward and flowing into lower edge
				`C ${w} ${h - 50}, ${w - 12} ${h - 36}, ${w - 30} ${h - 32}`,
				`C ${w - 48} ${h - 28}, ${w - 62} ${h - 20}, ${w - 70} ${h - 10}`,
				`C ${w - 76} ${h - 3}, ${w - 84} ${h}, ${notchX} ${h}`,
				`L ${r} ${h}`,
				`A ${r} ${r} 0 0 1 0 ${h - r}`,
				`L 0 ${r}`,
				`A ${r} ${r} 0 0 1 ${r} 0`,
				'Z',
			].join(' ')
		}

		case 'progress-dark': {
			// Sculpted upper edge matching Image 2:
			// Flat on left (y = 0), smooth flowing dip (depth 18px) between title and dropdown,
			// rises gently over the dropdown shelf (y = 6px), and smoothly rounds down
			const dipStart = Math.round(w * 0.54)
			const dipTrough = Math.round(w * 0.70)
			const dipDepth = 18
			const dipEnd = w - r

			return [
				`M ${r} 0`,
				`L ${dipStart} 0`,
				// Smooth downward curve to trough
				`C ${dipStart + 22} 0, ${dipTrough - 24} ${dipDepth}, ${dipTrough} ${dipDepth}`,
				// Gentle return curve rising toward the dropdown shelf
				`C ${dipTrough + 24} ${dipDepth}, ${dipEnd - 22} 6, ${dipEnd} 6`,
				// Smoothly rounded top-right corner
				`A ${r} ${r} 0 0 1 ${w} ${6 + r}`,
				`L ${w} ${h - r}`,
				`A ${r} ${r} 0 0 1 ${w - r} ${h}`,
				`L ${r} ${h}`,
				`A ${r} ${r} 0 0 1 0 ${h - r}`,
				`L 0 ${r}`,
				`A ${r} ${r} 0 0 1 ${r} 0`,
				'Z',
			].join(' ')
		}

		case 'invoice-lavender':
		case 'expense-pink':
		case 'standard':
		default: {
			return `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`
		}
	}
}

export const SculptedCard: React.FC<SculptedCardProps> = ({
	variant,
	fill,
	className = '',
	style,
	children,
	contentPadding = '1.5rem',
	stroke,
}) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
		width: 380,
		height: 240,
	})

	const rawId = useId()
	const filterId = useMemo(() => `gz-card-shadow-${rawId.replace(/:/g, '')}`, [rawId])

	// Dynamic color defaults matching the screenshot
	const cardFill = useMemo(() => {
		if (fill) return fill
		switch (variant) {
			case 'lime-greeting':
				return '#E5FF79'
			case 'hero-powder-blue':
				return '#DCE8F8'
			case 'leave-lavender':
				return '#B9A7F0'
			case 'invoice-lavender':
				return '#E8E6F8'
			case 'expense-pink':
				return '#FBECEF'
			case 'sales-navy':
				return '#101F38'
			case 'salary-dark':
			case 'progress-dark':
				return '#18191F'
			case 'standard':
			default:
				return '#FFFFFF'
		}
	}, [fill, variant])

	// Measure and track exact card dimensions with ResizeObserver
	useEffect(() => {
		if (!containerRef.current) return

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect
				if (width > 0 && height > 0) {
					setDimensions({
						width: Math.round(width),
						height: Math.round(height),
					})
				}
			}
		})

		observer.observe(containerRef.current)
		return () => observer.disconnect()
	}, [])

	const pathData = useMemo(() => {
		return buildCardPath(variant, dimensions.width, dimensions.height)
	}, [variant, dimensions.width, dimensions.height])

	// Shadow parameters tuned to screenshot surfaces
	const shadowProps = useMemo(() => {
		switch (variant) {
			case 'lime-greeting':
				return { dy: 6, blur: 14, color: '#D4F250', opacity: 0.35 }
			case 'hero-powder-blue':
				return { dy: 6, blur: 16, color: '#C2D6F2', opacity: 0.38 }
			case 'leave-lavender':
				return { dy: 6, blur: 14, color: '#B9A7F0', opacity: 0.32 }
			case 'invoice-lavender':
				return { dy: 4, blur: 12, color: '#D5D0F0', opacity: 0.3 }
			case 'expense-pink':
				return { dy: 4, blur: 12, color: '#F2D5DC', opacity: 0.3 }
			case 'sales-navy':
				return { dy: 8, blur: 18, color: '#101F38', opacity: 0.22 }
			case 'salary-dark':
			case 'progress-dark':
				return { dy: 8, blur: 18, color: '#18191F', opacity: 0.22 }
			default:
				return { dy: 4, blur: 12, color: '#18191F', opacity: 0.04 }
		}
	}, [variant])

	const cardStroke = stroke || (variant === 'standard' ? '#E8E9ED' : 'none')

	return (
		<div
			ref={containerRef}
			className={`gz-sculpted-card-container gz-variant-${variant} ${className}`}
			style={{
				position: 'relative',
				width: '100%',
				minHeight: '100%',
				...style,
			}}>
			{/* SVG Background Silhouette Layer (Sits behind content, clicks pass through) */}
			<svg
				className='gz-sculpted-svg-bg'
				width={dimensions.width}
				height={dimensions.height}
				viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
				preserveAspectRatio='none'
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					pointerEvents: 'none',
					zIndex: 0,
					overflow: 'visible',
				}}>
				<defs>
					<filter id={filterId} x='-10%' y='-10%' width='120%' height='125%'>
						<feDropShadow
							dx='0'
							dy={shadowProps.dy}
							stdDeviation={shadowProps.blur}
							floodColor={shadowProps.color}
							floodOpacity={shadowProps.opacity}
						/>
					</filter>
				</defs>

				{pathData && (
					<path
						d={pathData}
						fill={cardFill}
						filter={`url(#${filterId})`}
						stroke={cardStroke}
						strokeWidth={cardStroke !== 'none' ? 1 : 0}
					/>
				)}
			</svg>

			{/* HTML Content Layer (Fully interactive, never clipped) */}
			<div
				className='gz-sculpted-card-content'
				style={{
					position: 'relative',
					zIndex: 1,
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: contentPadding,
				}}>
				{children}
			</div>
		</div>
	)
}
