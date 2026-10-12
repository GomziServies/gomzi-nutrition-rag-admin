import {
	faCheck,
	faEye,
	faPaperPlane,
	faPencil,
	faPlus,
	faTrash,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CSSProperties, FC } from 'react'
import { Link } from 'react-router-dom'

type Props = {
	action: 'add' | 'edit' | 'remove' | 'view' | 'assign' | 'approve' | 'send';
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
	to?: string
	className?: string
	text?: string
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
	showIcon = true,
	backgroundDark = false,
	disabled = false,
	style,
	iconStyle,
}) => {
	const getButtonClass = (action: string, backgroundDark: boolean) => {
		if (backgroundDark) {
			switch (action) {
				case 'add':
					return 'btn-primary'
				case 'edit':
					return 'btn-info'
				case 'remove':
					return 'btn-danger'
				case 'view':
					return 'btn-success'
				case 'assign':
					return 'btn-warning'
				case 'approve':
					return 'btn-success'
				case 'send':
					return 'btn-success'
				default:
					return 'btn-primary'
			}
		} else {
			switch (action) {
				case 'add':
					return 'btn-primary'
				case 'edit':
					return 'btn-light-info'
				case 'remove':
					return 'btn-light-danger'
				case 'view':
					return 'btn-light-success'
				case 'assign':
					return 'btn-light-warning'
				case 'approve':
					return 'btn-light-success'
				case 'send':
					return 'btn-light-success'
				default:
					return 'btn-light-primary'
			}
		}
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
			default:
				return faPlus
		}
	}

	const buttonClass = `btn gap-2 ${getButtonClass(action, backgroundDark)} mx-2 btn-sm me-1 ${
		className || ''
	} ${disabled ? 'disabled' : ''}`
	const icon = getIcon(action)

	const handleClick = onClick ? (e: React.MouseEvent<HTMLButtonElement>) => onClick(e) : undefined;

	return to ? (
		<Link
			to={to}
			className={buttonClass}
			style={style}>
			{showIcon && (
				<FontAwesomeIcon
					icon={icon}
					className='fs-3'
					style={iconStyle}
				/>
			)}
			{text && <span className={`${showIcon ? 'ms-3' : ''} fw-bolder fs-5`}>{text}</span>}
		</Link>
	) : (
		<button
			className={buttonClass}
			onClick={handleClick}
			disabled={disabled}
			style={style}>
			{showIcon && (
				<FontAwesomeIcon
					icon={icon}
					className='fs-3'
					style={iconStyle}
				/>
			)}
			{text && <span className={`${showIcon ? 'ms-3' : ''} fw-bolder fs-5`}>{text}</span>}
		</button>
	)
}

export default TableButton
