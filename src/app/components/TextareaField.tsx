import { FC } from 'react'

type Props = {
<<<<<<< src/app/components/TextareaField.tsx
	className?: string
=======
	className: string
>>>>>>> .merge_backup/TextareaField.tsx
	label: string
	placeholder: string
	name: string
	value: string
<<<<<<< src/app/components/TextareaField.tsx
	htmlFor?: string
=======
	htmlFor: string
>>>>>>> .merge_backup/TextareaField.tsx
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
	readOnly?: boolean
	disabled?: boolean
	rows?: number
}

const TextareaField: FC<Props> = ({
<<<<<<< src/app/components/TextareaField.tsx
	className = '',
=======
	className,
>>>>>>> .merge_backup/TextareaField.tsx
	label,
	placeholder,
	value,
	name,
	onChange,
<<<<<<< src/app/components/TextareaField.tsx
	htmlFor = '',
=======
	htmlFor,
>>>>>>> .merge_backup/TextareaField.tsx
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
<<<<<<< src/app/components/TextareaField.tsx
				value={value}
=======
				value={value ?? ''}
>>>>>>> .merge_backup/TextareaField.tsx
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
