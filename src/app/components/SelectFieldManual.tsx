import React from 'react'

type Option = {
	value: string
	name: string
}

type Props = {
	className: string
	label: string
	name: string
	value: string
	htmlFor: string
	onChange?: (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void
	options: Option[]
	disabled?: boolean | undefined
	showLabel?: boolean
	marginRemove?: boolean
	defaultOptionValue?: string
}

const SelectFieldManual: React.FC<Props> = ({
	className,
	label,
	value,
	name,
	onChange,
	htmlFor,
	options,
	disabled,
	showLabel = true,
	marginRemove,
	defaultOptionValue,
}) => {
	return (
		<div className={`fv-row ${marginRemove ? `mb-0` : `mb-md-7 mb-3`} ${className}`}>
			{showLabel && (
				<label
					htmlFor={htmlFor}
					className='fw-bold fs-6  mb-md-5 mb-2'>
					{label}
				</label>
			)}
			<select
				className={`form-control form-select form-control-solid ${
					disabled ? `inputfield-bg1` : `inputfield-bg`
				} mb-3 mb-lg-0`}
				autoComplete='off'
				name={name}
				value={value}
				disabled={disabled}
				onChange={onChange}>
				<option value={defaultOptionValue}>Select {label}</option>
				{options.map((option, index) => (
					<option
						key={index}
						value={option.value}>
						{option.name}
					</option>
				))}
			</select>
		</div>
	)
}

export default SelectFieldManual
