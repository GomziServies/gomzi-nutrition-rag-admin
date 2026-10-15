import { FC } from 'react'

type Props = {
	className?: string
	label: string
	placeholder: string
	name: string
	value: string
	htmlFor?: string
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
	readOnly?: boolean
	disabled?: boolean
	rows?: number
}

const TextareaField: FC<Props> = ({
	className = '',
	label,
	placeholder,
	value,
	name,
	onChange,
	htmlFor = '',
	readOnly,
	disabled,
	rows = 4,
}) => {
	return (
		<div className={`fv-row mb-7 ${className}`}>
			<label
				htmlFor={htmlFor}
				className='fw-bold fs-6 mb-2'>
				{label}
			</label>
			<textarea
				name={name}
				value={value}
				onChange={onChange}
				readOnly={readOnly}
				rows={rows}
				className={`${disabled ? `textareafield-bg1` : `textareafield-bg`} form-control form-control-solid mb-3 mb-lg-0`}
				placeholder={placeholder}
				disabled={disabled}></textarea>
		</div>
	)
}

export default TextareaField
