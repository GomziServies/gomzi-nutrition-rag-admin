import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FC, useState } from 'react'

type Props = {
	className?: string
	label?: string
	placeholder?: string
	type: string
	name: string
	value?: string
	id?: string
	htmlFor: string
	onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
	readOnly?: boolean
	disabled?: boolean
	showLabel?: boolean
	marginRemove?: boolean
	labelMarginRemove?: boolean
	required?: boolean
}

const InputField: FC<Props> = ({
	className,
	label,
	placeholder,
	type,
	value,
	name,
	id,
	onChange,
	htmlFor,
	readOnly,
	disabled,
	showLabel = true,
	marginRemove,
	labelMarginRemove,
	required = false,
}) => {
	const [showPassword, setShowPassword] = useState(false)

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword)
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { type, value } = e.target
		if (type === 'number') {
			if (parseFloat(value) < 0) {
				return
			}
		}
		onChange?.(e)
	}

	return (
		<div className={`fv-row ${marginRemove ? `mb-0` : `mb-md-7 mb-3`} ${className}`}>
			{showLabel && (
				<label
					htmlFor={htmlFor}
					className={`fw-bold fs-6 ${labelMarginRemove ? `mb-2` : `mb-md-5 mb-2`} ${
						required ? `required` : ``
					}`}>
					{label}
				</label>
			)}
			<div className='input-group'>
				<input
					id={id}
					placeholder={placeholder}
					type={type === 'password' && showPassword ? 'text' : type}
					name={name}
					value={value}
					onChange={handleChange}
					readOnly={readOnly}
					className={`form-control mb-3 mb-lg-0 ${disabled ? `inputfield-bg1` : `inputfield-bg`}`}
					autoComplete='off'
					disabled={disabled}
					min={type === 'number' ? 0 : undefined}
				/>
				{type === 'password' && (
					<button
						className='btn bg-light-secondary'
						type='button'
						onClick={togglePasswordVisibility}>
						<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
					</button>
				)}
			</div>
		</div>
	)
}

export default InputField
