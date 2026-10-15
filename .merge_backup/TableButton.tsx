import {
	faArrowLeft,
	faBell,
	faCheck,
	faCompass,
	faDownload,
	faEye,
	faFileLines,
	faFileSignature,
	faPaperPlane,
	faPencil,
	faPhone,
	faPlay,
	faPlus,
	faQrcode,
	faStar,
	faTrash,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CSSProperties, FC } from 'react'
import { Link } from 'react-router-dom'

type Props = {
	action:
		| 'add'
		| 'edit'
		| 'remove'
		| 'view'
		| 'assign'
		| 'approve'
		| 'send'
		| 'call'
		| 'reminder'
		| 'resume'
		| 'play'
		| 'download'
		| 'explore'
		| 'back'
		| 'document'
		| 'agreement'
		| 'signature'
		| 'qr'
		| 'qrcode'
		| 'star'
		| 'rating'
		| 'performance'
		| string
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
	to?: string
	className?: string
	text?: string
	showIcon?: boolean
	backgroundDark?: boolean
	disabled?: boolean
	state?: any
	style?: CSSProperties
	iconStyle?: CSSProperties
	title?: string
	customIcon?: any
	loading?: boolean
}

const TableButton: FC<Props> = ({
	action,
	onClick,
	to,
	state,
	className,
	text,
	showIcon = true,
	backgroundDark = false,
	disabled = false,
	loading = false,
	style,
	iconStyle,
	title,
	customIcon,
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
				case 'qr':
				case 'qrcode':
					return 'btn-info'
				case 'star':
				case 'rating':
				case 'performance':
					return 'btn-warning'
				case 'call':
					return 'btn-primary'
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
				case 'qr':
				case 'qrcode':
					return 'btn-light-info'
				case 'star':
				case 'rating':
				case 'performance':
					return 'btn-light-warning'
				case 'call':
					return 'btn-light-primary'
				default:
					return 'btn-light-primary'
			}
		}
	}

	const getIcon = (action: string) => {
		if (customIcon) return customIcon
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
			case 'qrcode':
				return faQrcode
			case 'star':
			case 'rating':
			case 'performance':
				return faStar
			case 'call':
				return faPhone
			case 'reminder':
				return faBell
			case 'resume':
			case 'play':
				return faPlay
			case 'download':
				return faDownload
			case 'explore':
				return faCompass
			case 'back':
				return faArrowLeft
			case 'document':
				return faFileLines
			case 'agreement':
			case 'signature':
				return faFileSignature
			default:
				return faPlus
		}
	}

	const buttonClass = `btn gap-2 ${getButtonClass(action, backgroundDark)} mx-2 btn-sm me-1 ${
		className || ''
	} ${disabled || loading ? 'disabled' : ''}`
	const icon = getIcon(action)

	const handleClick = onClick
		? (e: React.MouseEvent<HTMLButtonElement>) => {
				e.currentTarget.blur()
				onClick(e)
		  }
		: undefined

	return to ? (
		<Link
			to={to}
			state={state}
			className={buttonClass}
			style={style}
			title={title}>
			{loading ? (
				<span
					className='spinner-border spinner-border-sm me-1'
					style={{ width: '13px', height: '13px' }}
				/>
			) : (
				showIcon && (
					<FontAwesomeIcon
						icon={icon as any}
						className='fs-3'
						style={iconStyle}
					/>
				)
			)}
			{text && <span className={`${showIcon ? 'ms-3' : ''} fw-bolder fs-5`}>{text}</span>}
		</Link>
	) : (
		<button
			type='button'
			className={buttonClass}
			onClick={handleClick}
			disabled={disabled || loading}
			style={style}
			title={title}>
			{loading ? (
				<span
					className='spinner-border spinner-border-sm me-1'
					style={{ width: '13px', height: '13px' }}
				/>
			) : (
				showIcon && (
					<FontAwesomeIcon
						icon={icon as any}
						className='fs-3'
						style={iconStyle}
					/>
				)
			)}
			{text && <span className={`${showIcon ? 'ms-3' : ''} fw-bolder fs-5`}>{text}</span>}
		</button>
	)
}

export default TableButton
