import {
	faCheck,
	faCompass,
	faEye,
	faPaperPlane,
	faPencil,
	faPlus,
	faQrcode,
	faStar,
	faTrash,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CSSProperties, FC } from 'react'
import { Link } from 'react-router-dom'

type ActionType =
	| 'add'
	| 'edit'
	| 'remove'
	| 'view'
	| 'assign'
	| 'approve'
	| 'send'
	| 'qr'
	| 'star'
	| 'explore'

type Props = {
	action: ActionType
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
	to?: string
	className?: string
	text?: string
	title?: string
	showIcon?: boolean
	backgroundDark?: boolean
	disabled?: boolean
	style?: CSSProperties
	iconStyle?: CSSProperties
}

const TableButton: FC<Props> = ({
	action,
	onClick,
	to,
	className,
	text,
	title,
	showIcon = true,
	backgroundDark = false,
	disabled = false,
	style,
	iconStyle,
}) => {
	const getButtonClass = (action: string, hasText: boolean) => {
		if (hasText) {
			switch (action) {
				case 'add':
					return 'btn-primary gz-table-text-btn'
				case 'edit':
					return 'btn-light-info gz-table-text-btn'
				case 'remove':
					return 'btn-light-danger gz-table-text-btn'
				case 'view':
					return 'btn-light-primary gz-table-text-btn'
				case 'assign':
					return 'btn-light-warning gz-table-text-btn'
				case 'approve':
					return 'btn-light-success gz-table-text-btn'
				case 'send':
					return 'btn-light-success gz-table-text-btn'
				case 'qr':
					return 'btn-light-dark gz-table-text-btn'
				case 'star':
					return 'btn-light-warning gz-table-text-btn'
				case 'explore':
					return 'btn-light-info gz-table-text-btn'
				default:
					return 'btn-light-primary gz-table-text-btn'
			}
		}

		return `gz-table-action-btn is-${action}`
	}

	const getIcon = (action: string) => {
		switch (action) {
			case 'add':
				return faPlus
			case 'edit':
				return faPencil
			case 'remove':
				return faTrash
			case 'view':
				return faEye
			case 'assign':
				return faUsers
			case 'approve':
				return faCheck
			case 'send':
				return faPaperPlane
			case 'qr':
				return faQrcode
			case 'star':
				return faStar
			case 'explore':
				return faCompass
			default:
				return faPlus
		}
	}

	const getTitle = (action: string, text?: string, customTitle?: string) => {
		if (customTitle) return customTitle
		if (text) return text
		switch (action) {
			case 'add':
				return 'Add'
			case 'edit':
				return 'Edit'
			case 'remove':
				return 'Delete'
			case 'view':
				return 'View'
			case 'assign':
				return 'Assign'
			case 'approve':
				return 'Approve'
			case 'send':
				return 'Send'
			case 'qr':
				return 'QR Code'
			case 'star':
				return 'Rating'
			case 'explore':
				return 'Explore'
			default:
				return 'Action'
		}
	}

	const hasText = Boolean(text)
	const buttonClass = `${getButtonClass(action, hasText)} ${className || ''} ${
		disabled ? 'disabled' : ''
	}`
	const icon = getIcon(action)
	const titleText = getTitle(action, text, title)

	const handleClick = onClick ? (e: React.MouseEvent<HTMLButtonElement>) => onClick(e) : undefined

	return to ? (
		<Link
			to={to}
			className={buttonClass}
			style={style}
			title={titleText}>
			{showIcon && (
				<FontAwesomeIcon
					icon={icon as any}
					style={{ fontSize: hasText ? '12px' : '13px', ...iconStyle }}
				/>
			)}
			{text && <span className='fs-7 fw-semibold'>{text}</span>}
		</Link>
	) : (
		<button
			type='button'
			className={buttonClass}
			onClick={handleClick}
			disabled={disabled}
			style={style}
			title={titleText}>
			{showIcon && (
				<FontAwesomeIcon
					icon={icon as any}
					style={{ fontSize: hasText ? '12px' : '13px', ...iconStyle }}
				/>
			)}
			{text && <span className='fs-7 fw-semibold'>{text}</span>}
		</button>
	)
}

export default TableButton
