import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

/* =============================================================================
   GOMZI PREMIUM ONE-TIME INTERNAL ANIMATED SVG ICON SYSTEM
   Consolidated Icon System for Sidebar Navigation & Add/Create Buttons
   Brand: Navy #172B4D | Inactive: Slate Blue-Gray | Active/Hover: White
   ============================================================================= */

export type DashboardVariant = 'tiles' | 'house'

export const iconConfig: { dashboardVariant: DashboardVariant } = {
	dashboardVariant: 'tiles', // Switch to 'house' as needed
}

export const setDashboardVariant = (variant: DashboardVariant) => {
	iconConfig.dashboardVariant = variant
}

export interface AnimatedIconProps extends React.SVGProps<SVGSVGElement> {
	size?: number | string
	strokeWidth?: number
	className?: string
	isAnimating?: boolean
	title?: string
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
	size = 20,
	strokeWidth = 1.85,
	className = '',
	isAnimating: controlledAnimating,
	title,
	children,
	style,
	...rest
}) => {
	const svgRef = useRef<SVGSVGElement>(null)
	const [internalAnimating, setInternalAnimating] = useState(false)
	const isAnimating = controlledAnimating !== undefined ? controlledAnimating : internalAnimating
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		const el = svgRef.current
		if (!el) return

		// Find the closest interactive parent trigger (sidebar link, button, etc.)
		const trigger =
			el.closest<HTMLElement>(
				'.menu-link, .gz-table-text-btn, .gz-prod-btn-primary, .gz-inv-btn-primary, .btn, a, button, [tabindex]'
			) || el

		const startAnimation = () => {
			if (timerRef.current) return // Already running, allow full completion
			setInternalAnimating(true)

			// Hold animating state for the full duration so early mouseleave doesn't snap
			timerRef.current = setTimeout(() => {
				setInternalAnimating(false)
				timerRef.current = null
			}, 1050)
		}

		trigger.addEventListener('mouseenter', startAnimation)
		trigger.addEventListener('focusin', startAnimation)

		return () => {
			trigger.removeEventListener('mouseenter', startAnimation)
			trigger.removeEventListener('focusin', startAnimation)
			if (timerRef.current) {
				clearTimeout(timerRef.current)
				timerRef.current = null
			}
		}
	}, [])

	const iconStyle: React.CSSProperties = {
		width: size,
		height: size,
		minWidth: size,
		minHeight: size,
		display: 'inline-block',
		verticalAlign: 'middle',
		flexShrink: 0,
		overflow: 'visible',
		...style,
	}

	return (
		<svg
			ref={svgRef}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={strokeWidth}
			strokeLinecap='round'
			strokeLinejoin='round'
			className={`gz-anim-icon ${isAnimating ? 'is-animating' : ''} ${className}`}
			style={iconStyle}
			aria-hidden={title ? undefined : 'true'}
			role={title ? 'img' : undefined}
			{...rest}>
			{title && <title>{title}</title>}
			{children}
		</svg>
	)
}

/* =============================================================================
   1. PLUS ICON (Add / Create Buttons)
   Thick Plus: strokeWidth 3.6 on 24x24 viewBox, rounded stroke caps.
   Sequence: Vertical enters from above (780ms), Horizontal enters from left (510ms, delay 280ms)
   Total sequence: ~800ms
   ============================================================================= */
export const PlusIcon: React.FC<AnimatedIconProps> = ({
	size = 14,
	strokeWidth = 3.6,
	style,
	...props
}) => {
	return (
		<AnimatedIcon
			size={size}
			strokeWidth={strokeWidth}
			style={{ overflow: 'hidden', ...style }}
			{...props}>
			{/* Vertical stroke enters from above */}
			<line
				x1='12'
				y1='4.5'
				x2='12'
				y2='19.5'
				className='gz-plus-v'
			/>
			{/* Horizontal stroke enters from left */}
			<line
				x1='4.5'
				y1='12'
				x2='19.5'
				y2='12'
				className='gz-plus-h'
			/>
		</AnimatedIcon>
	)
}

/* =============================================================================
   2. DASHBOARD TILES ICON (Default: 4-Tile Smooth Inward Docking)
   Sequential settling with 1.5 SVG unit offsets, staggered 100ms.
   Duration: ~850ms
   ============================================================================= */
export const DashboardTilesIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<rect x='3.5' y='3.5' width='6.5' height='6.5' rx='1.8' className='gz-dash-tile-tl' />
			<rect x='14' y='3.5' width='6.5' height='6.5' rx='1.8' className='gz-dash-tile-tr' />
			<rect x='3.5' y='14' width='6.5' height='6.5' rx='1.8' className='gz-dash-tile-bl' />
			<rect x='14' y='14' width='6.5' height='6.5' rx='1.8' className='gz-dash-tile-br' />
		</AnimatedIcon>
	)
}

/* 2b. DASHBOARD HOUSE ICON (Approved Alternative)
   Restrained door reveal animation without separating roof.
   ============================================================================= */
export const DashboardHouseIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			{/* House Outline (Roof & Walls fixed) */}
			<path d='M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20V9.5z' />
			{/* Door with subtle upward reveal */}
			<path d='M9 21.5V13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8.5' className='gz-house-door' />
		</AnimatedIcon>
	)
}

/* Dashboard Switcher Component */
export const DashboardIcon: React.FC<AnimatedIconProps & { variant?: DashboardVariant }> = ({
	variant = iconConfig.dashboardVariant,
	...props
}) => {
	if (variant === 'house') {
		return <DashboardHouseIcon {...props} />
	}
	return <DashboardTilesIcon {...props} />
}

/* =============================================================================
   3. HERO BANNER ICON (Landscape / Image)
   Fixed outer frame, landscape detail & sun reveal smoothly.
   Duration: ~800ms
   ============================================================================= */
export const HeroBannerIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<rect x='3' y='3' width='18' height='18' rx='3' />
			<circle cx='8.5' cy='8.5' r='1.5' className='gz-hero-sun' />
			<path d='M21 16.5l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L4 20' className='gz-hero-mtn1' />
			<path d='M14 14.5l1.5-1.5a1.5 1.5 0 0 1 2.12 0L21 16.5' className='gz-hero-mtn2' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   4. BLOGS & JOURNAL ICON (Open Book)
   Fixed book outline, internal page lines reveal sequentially.
   Duration: ~880ms
   ============================================================================= */
export const BlogsIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' />
			<path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' />
			<line x1='12' y1='7' x2='12' y2='21' />
			<path d='M6 8h3' className='gz-blog-line1' />
			<path d='M6 12h3' className='gz-blog-line2' />
			<path d='M15 8h3' className='gz-blog-line3' />
			<path d='M15 12h3' className='gz-blog-line4' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   5. TRENDING DEALS ICON (Discount Price Tag)
   Tiny, smooth tilt around attachment hole (7px, 7px).
   Duration: ~850ms
   ============================================================================= */
export const TrendingDealsIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<g className='gz-deal-group'>
				<path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
				<circle cx='7' cy='7' r='1.5' className='gz-deal-hole' />
				<line x1='11' y1='15' x2='15' y2='11' className='gz-deal-line' />
			</g>
		</AnimatedIcon>
	)
}

/* =============================================================================
   6. PROMO SLIDERS ICON (Settings Adjustments)
   Fixed horizontal tracks, two slider knobs slide smoothly along tracks.
   Duration: ~850ms
   ============================================================================= */
export const PromoSlidersIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			{/* Fixed horizontal tracks */}
			<line x1='4' y1='8' x2='20' y2='8' />
			<line x1='4' y1='16' x2='20' y2='16' />
			{/* Knobs moving along their tracks */}
			<circle cx='9' cy='8' r='2.5' fill='currentColor' className='gz-slider-knob1' data-fill='true' />
			<circle cx='15' cy='16' r='2.5' fill='currentColor' className='gz-slider-knob2' data-fill='true' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   7. DISCOUNT STRIP BANNER ICON (Banner Ribbon / Image)
   Fixed frame, internal ribbon bookmark & discount detail reveals.
   Duration: ~800ms
   ============================================================================= */
export const DiscountStripIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<rect x='3' y='5' width='18' height='14' rx='2.5' />
			<line x1='3' y1='12' x2='21' y2='12' strokeDasharray='2.5 2' />
			<path d='M7 5v9l2.5-1.8L12 14V5' className='gz-strip-badge' />
			<circle cx='17' cy='8.5' r='1.2' fill='currentColor' className='gz-strip-dot' data-fill='true' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   8. BANK OFFERS BANNER ICON (Payment Card)
   Card outline & magnetic strip fixed, card chip & detail slide from left.
   Duration: ~820ms
   ============================================================================= */
export const BankOffersIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<rect x='2' y='5' width='20' height='14' rx='2.5' />
			<line x1='2' y1='10' x2='22' y2='10' />
			<rect x='5' y='13' width='3.5' height='2.5' rx='0.6' className='gz-card-chip' />
			<line x1='11' y1='14.5' x2='17' y2='14.5' className='gz-card-line' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   9. PRODUCTS & ORDERS ICON (3D Box with Vertically Lifting Lid)
   Lower box body stationary. Lid lifts straight upward, pauses, returns.
   Zero horizontal movement, zero rotation.
   Duration: ~1000ms
   ============================================================================= */
export const ProductsOrdersIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			{/* Lower box body with two visible faces & central seam */}
			<path d='M21 8.5v7.5a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8.5' />
			<line x1='12' y1='12.5' x2='12' y2='21.5' />
			{/* Separate top lid lifting vertically */}
			<path d='M12 2.5L20.5 7L12 11.5L3.5 7L12 2.5Z' className='gz-pkg-lid-v3' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   10. INVOICES ICON (Document with Sequential Text Lines)
   Fixed document outline, two internal lines draw smoothly into place.
   Duration: ~850ms
   ============================================================================= */
export const InvoicesIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
			<polyline points='14 2 14 8 20 8' />
			<line x1='8' y1='13' x2='16' y2='13' className='gz-inv-line1' />
			<line x1='8' y1='17' x2='13' y2='17' className='gz-inv-line2' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   11. QUOTATIONS ICON (Quotation Document)
   Document fixed, quotation marks pop with subtle emphasis.
   Duration: ~850ms
   ============================================================================= */
export const QuotationsIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
			<polyline points='14 2 14 8 20 8' />
			<path d='M8 12.5a1.5 1.5 0 0 1 1.5-1.5h.3v1.5a1.5 1.5 0 0 1-1.5 1.5' className='gz-quote-mark1' />
			<path d='M12 12.5a1.5 1.5 0 0 1 1.5-1.5h.3v1.5a1.5 1.5 0 0 1-1.5 1.5' className='gz-quote-mark2' />
			<line x1='8' y1='17' x2='16' y2='17' className='gz-quote-line' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   12. INVENTORY & STOCK ICON (3 Stacked Isometric Layers)
   Lower two layers stay fixed. Only top layer lifts slightly upward and returns.
   Duration: ~880ms
   ============================================================================= */
export const InventoryStockIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<path d='M12 2L2 7L12 12L22 7L12 2Z' className='gz-stack-top' />
			<path d='M2 12L12 17L22 12' />
			<path d='M2 17L12 22L22 17' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   13. RAW MATERIALS & SUPPLY ICON (Factory with Smoke Detail)
   Factory silhouette stationary. Smoke puffs float upward and reveal.
   Duration: ~880ms
   ============================================================================= */
export const RawMaterialsIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<line x1='2' y1='21' x2='22' y2='21' />
			<path d='M4 21V11l4 3V11l4 3V7h7a1 1 0 0 1 1 1v13' />
			<path d='M7 21v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3' />
			<path d='M16 4.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5' className='gz-fact-smoke1' />
			<path d='M17.5 1.5c0-.5.5-1 1-1' className='gz-fact-smoke2' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   14. SAMPLE BOOKINGS ICON (Calendar with Checkmark)
   Calendar frame fixed. Checkmark draws smoothly into place.
   Duration: ~850ms
   ============================================================================= */
export const SampleBookingsIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<rect x='3' y='4' width='18' height='18' rx='2.5' />
			<line x1='16' y1='2' x2='16' y2='6' />
			<line x1='8' y1='2' x2='8' y2='6' />
			<line x1='3' y1='10' x2='21' y2='10' />
			<path d='M9 15.5l2 2 4.5-4.5' className='gz-cal-check' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   15. EXPENSES ICON (3 Bars Growing Bottom to Top)
   Strictly anchored at bottom edge (y=20).
   Bars grow bottom -> top in sequence: shortest -> medium -> tallest.
   Stagger: ~180ms. Duration: ~840ms
   ============================================================================= */
export const ExpensesIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			{/* Baseline */}
			<line x1='3' y1='20' x2='21' y2='20' />
			{/* 3 sequential rising bars anchored at baseline */}
			<rect x='4.5' y='13' width='3.5' height='7' rx='0.8' className='gz-exp-bar1' />
			<rect x='10.25' y='9' width='3.5' height='11' rx='0.8' className='gz-exp-bar2' />
			<rect x='16' y='4' width='3.5' height='16' rx='0.8' className='gz-exp-bar3' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   16. USERS ICON (Single Profile Icon)
   Single user only. Outer frame fixed. Head settles, torso reveals.
   Duration: ~880ms
   ============================================================================= */
export const UsersIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<circle cx='12' cy='12' r='10' />
			<circle cx='12' cy='8' r='3.5' className='gz-user-head' />
			<path d='M6 18.5a6 6 0 0 1 12 0' className='gz-user-body' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   17. STAFF MANAGEMENT ICON (Executive Employee with Collar & Tie)
   Head & shoulders stable. Collar reveals. Tie draws downward from knot.
   Duration: ~950ms
   ============================================================================= */
export const StaffManagementIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<circle cx='12' cy='7' r='3.5' className='gz-staff-head' />
			<path d='M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2' />
			<path d='M9.5 15l2.5 3 2.5-3' className='gz-staff-collar' />
			<polygon points='12,15.5 13.5,18.5 12,21.5 10.5,18.5' className='gz-staff-tie' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   18. TRAINERS ICON (Dumbbell)
   Central bar stable. Plates shift slightly inward and settle.
   Duration: ~850ms
   ============================================================================= */
export const TrainersIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<line x1='6' y1='12' x2='18' y2='12' />
			<line x1='5' y1='8' x2='5' y2='16' className='gz-dumb-l1' />
			<line x1='2' y1='10' x2='2' y2='14' className='gz-dumb-l2' />
			<line x1='19' y1='8' x2='19' y2='16' className='gz-dumb-r1' />
			<line x1='22' y1='10' x2='22' y2='14' className='gz-dumb-r2' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   19. REFERENCE COUPON ICON (Coupon Ticket)
   Recognizable ticket with perforated line, subtle controlled tilt.
   Duration: ~850ms
   ============================================================================= */
export const CouponsIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<g className='gz-coupon-group'>
				<path d='M2 9a3 3 0 0 1 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z' />
				<line x1='13' y1='4' x2='13' y2='20' strokeDasharray='2 2' className='gz-coupon-dash' />
				<circle cx='8.5' cy='12' r='1.5' className='gz-coupon-dot' />
			</g>
		</AnimatedIcon>
	)
}

/* =============================================================================
   20. FOLLOW UP & HELPDESK ICON (Support Headset)
   Headband & earcups stationary. Microphone boom rotates toward speaking position.
   Duration: ~850ms
   ============================================================================= */
export const HelpdeskIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<path d='M3 12a9 9 0 0 1 18 0' />
			<rect x='2' y='11' width='3.5' height='6' rx='1.75' />
			<rect x='18.5' y='11' width='3.5' height='6' rx='1.75' />
			<path d='M20 16v1.5a3 3 0 0 1-3 3h-4' className='gz-headset-mic' />
			<circle cx='11.5' cy='20.5' r='1.2' fill='currentColor' className='gz-headset-mictip' data-fill='true' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   21. BROADCAST MARKETING ICON (Megaphone)
   Body stationary. Two soundwaves reveal sequentially.
   Duration: ~900ms
   ============================================================================= */
export const BroadcastIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<path d='M3 11l13-4v10l-13-4z' />
			<path d='M6 13v4a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-4' />
			<path d='M18 9a4 4 0 0 1 0 6' className='gz-mega-wave1' />
			<path d='M21 7a7 7 0 0 1 0 10' className='gz-mega-wave2' />
		</AnimatedIcon>
	)
}

/* =============================================================================
   22. ADMIN USER ICON (Security Shield)
   Shield with smooth drawing inner checkmark.
   Duration: ~850ms
   ============================================================================= */
export const AdminUserIcon: React.FC<AnimatedIconProps> = (props) => {
	return (
		<AnimatedIcon {...props}>
			<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
			<path d='M9 12l2 2 4-4' className='gz-admin-check' />
		</AnimatedIcon>
	)
}
