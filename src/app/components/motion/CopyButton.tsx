import React, { CSSProperties } from 'react'
import { Copy, Check } from 'lucide-react'
import { useCopyFeedback } from './useCopyFeedback'

interface CopyButtonProps {
	text: string
	title?: string
	customMessage?: string
	className?: string
	style?: CSSProperties
	iconSize?: number
	children?: React.ReactNode
}

export const CopyButton: React.FC<CopyButtonProps> = ({
	text,
	title = 'Copy',
	customMessage,
	className = '',
	style,
	iconSize = 13,
	children,
}) => {
	const { copied, copyToClipboard } = useCopyFeedback({
		timeout: 1200,
		successMessage: customMessage || 'Copied!',
	})

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		e.preventDefault()
		copyToClipboard(text, customMessage)
	}

	return (
		<button
			type='button'
			className={`gz-copy-btn-feedback ${copied ? 'is-copied' : ''} ${className}`}
			onClick={handleClick}
			title={copied ? 'Copied!' : title}
			style={style}
			aria-label={title}>
			{copied ? (
				<Check size={iconSize} className='gz-success-check-icon' />
			) : (
				<Copy size={iconSize} />
			)}
			{children}
		</button>
	)
}

export default CopyButton
