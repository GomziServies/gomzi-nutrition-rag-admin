import React from 'react'
import { MultiSelect, Option } from 'react-multi-select-component'

type Props = {
	className: string
	label: string
	name: string
	value: string | string[]
	htmlFor: string
	onChange: (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void
	options: (string | { label: string; value: string })[]
	showLabel?: boolean
	multiSelect?: boolean
	marginRemove?: boolean
	defaultOpening?: boolean
	defaultClosing?: boolean
	disabled?: boolean | undefined
}

const SelectField: React.FC<Props> = ({
	className,
	label,
	value,
	name,
	onChange,
	htmlFor,
	options,
	disabled,
	showLabel = true,
	multiSelect = false,
	marginRemove,
	defaultOpening,
	defaultClosing,
}) => {
	const formattedOptions = options.map((option) =>
		typeof option === 'string' ? { label: option, value: option } : option
	)

	const selectedValues = typeof value === 'string' ? value.split(',') : []
	const selectedOptions = formattedOptions.filter((option) => selectedValues.includes(option.value))

	const handleMultiSelectChange = (selected: Option[]) => {
		const selectedValues = selected.map((option) => option.value).join(',')
		const syntheticEvent = {
			target: {
				name: name,
				value: selectedValues,
			},
		} as unknown as React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
		onChange(syntheticEvent)
	}

	return (
		<div className={`fv-row ${marginRemove ? `mb-0` : `mb-md-7 mb-3`} ${className}`}>
			{showLabel && (
				<label
					htmlFor={htmlFor}
					className='fw-bold fs-6  mb-md-5 mb-2'>
					{label}
				</label>
			)}
			{multiSelect ? (
				<MultiSelect
					options={formattedOptions}
					value={selectedOptions}
					onChange={handleMultiSelectChange}
					labelledBy={`Select ${label}`}
					className='selectfield-bg mb-3 mb-lg-0'
					disabled={disabled}
				/>
			) : (
				<div className='selectfield-bg mb-3 mb-lg-0'>
					<select
						name={name}
						value={value}
						onChange={onChange}
						disabled={disabled}
						className={`form-select ${disabled ? `inputfield-bg1` : `inputfield-bg`}`}>
						{defaultOpening ? (
							<option value='Opening Time'>Opening Time</option>
						) : defaultClosing ? (
							<option value='Closing Time'>Closing Time</option>
						) : (
							!formattedOptions.some((opt) => opt.value === 'Select') && (
								<option value=''>Select</option>
							)
						)}
						{formattedOptions.map((option, index) => (
							<option
								key={option.value + index}
								value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
			)}
		</div>
	)
}

export default SelectField
