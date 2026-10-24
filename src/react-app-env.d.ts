/// <reference types="react-scripts" />

declare module 'lucide-react' {
	import * as React from 'react'

	export interface LucideProps extends React.SVGProps<SVGSVGElement> {
		size?: string | number
		color?: string
		strokeWidth?: string | number
		absoluteStrokeWidth?: boolean
		className?: string
	}

	export type Icon = React.ForwardRefExoticComponent<
		LucideProps & React.RefAttributes<SVGSVGElement>
	>

	export const Copy: Icon
	export const Check: Icon
	export const Link: Icon
	export const MapPin: Icon
	export const Package: Icon
	export const Plus: Icon
	export const Trash2: Icon
	export const UserRound: Icon
	export const CalendarDays: Icon
	export const Star: Icon
	export const MessageSquare: Icon

	const icons: Record<string, Icon>
	export default icons
}

declare module 'motion/react' {
	export * from 'framer-motion'
}

