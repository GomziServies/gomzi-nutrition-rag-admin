import React, { useEffect, useRef, useState } from 'react'
import { MultiSelect, Option } from 'react-multi-select-component'

type Props = {
	className?: string
	label?: string
	name: string
	value: string | string[]
	htmlFor?: string
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
	className = '',
	label = '',
	value,
	name,
	onChange,
	htmlFor = '',
	options,
	disabled,
	showLabel = true,
	multiSelect = false,
	marginRemove,
	defaultOpening,
	defaultClosing,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const dropdownRef = useRef<HTMLDivElement>(null)

	const formattedOptions = options.map((option) =>
		typeof option === 'string' ? { label: option, value: option } : option
	)

	// Build full options array including defaults
	const allOptions: { label: string; value: string }[] = []
	if (defaultOpening) {
		allOptions.push({ label: 'Opening Time', value: 'Opening Time' })
	} else if (defaultClosing) {
		allOptions.push({ label: 'Closing Time', value: 'Closing Time' })
	} else if (!formattedOptions.some((opt) => opt.value === 'Select' || opt.value === '')) {
		allOptions.push({ label: 'Select', value: '' })
	}
	formattedOptions.forEach((opt) => {
		allOptions.push(opt)
	})

	const selectedValues = typeof value === 'string' ? value.split(',') : []
	const selectedOptions = formattedOptions.filter((option) => selectedValues.includes(option.value))

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

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

	const handleOptionSelect = (optionValue: string) => {
		const syntheticEvent = {
			target: {
				name: name,
				value: optionValue,
			},
		} as unknown as React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
		onChange(syntheticEvent)
		setIsOpen(false)
		setSearchTerm('')
	}

	// Current label to show in trigger
	const currentVal = typeof value === 'string' ? value : ''
	const currentOption = allOptions.find((opt) => opt.value === currentVal)
	const displayLabel = currentOption
		? currentOption.label
		: currentVal || (defaultOpening ? 'Opening Time' : defaultClosing ? 'Closing Time' : 'Select')

	const filteredOptions = allOptions.filter((opt) => {
		if (!searchTerm) return true
		return opt.label.toLowerCase().includes(searchTerm.toLowerCase())
	})

	return (
		<div className={`fv-row ${marginRemove ? `mb-0` : `mb-md-7 mb-3`} ${className}`}>
			{showLabel && (
				<label
					htmlFor={htmlFor}
					className='fw-bold fs-6 mb-md-5 mb-2'>
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
				<div
					ref={dropdownRef}
					className='gz-custom-select-wrap selectfield-bg mb-3 mb-lg-0'>
					{/* Hidden native input for form compatibility */}
					<input
						type='hidden'
						name={name}
						value={currentVal}
					/>

					{/* Custom Dropdown Trigger */}
					<div
						className={`gz-custom-select-trigger ${isOpen ? 'is-open' : ''} ${
							disabled ? 'is-disabled' : ''
						}`}
						onClick={() => {
							if (!disabled) setIsOpen(!isOpen)
						}}
						role='button'
						tabIndex={0}>
						<span
							className={`gz-select-trigger-text ${
								!currentVal || currentVal === 'Select' ? 'is-placeholder' : ''
							}`}>
							{displayLabel}
						</span>
						<i className='bi bi-chevron-down gz-select-chevron'></i>
					</div>

					{/* Custom Dropdown Popup Menu */}
					{isOpen && !disabled && (
						<div className='gz-custom-select-dropdown'>
							{allOptions.length > 6 && (
								<div className='gz-select-search-box'>
									<i className='bi bi-search'></i>
									<input
										type='text'
										placeholder='Search...'
										value={searchTerm}
										autoFocus
										onChange={(e) => setSearchTerm(e.target.value)}
										onClick={(e) => e.stopPropagation()}
									/>
								</div>
							)}
							<div className='gz-select-options-list'>
								{filteredOptions.length > 0 ? (
									filteredOptions.map((opt, idx) => {
										const isSelected = opt.value === currentVal
										return (
											<div
												key={opt.value + idx}
												className={`gz-select-option ${isSelected ? 'is-selected' : ''}`}
												onClick={(e) => {
													e.stopPropagation()
													handleOptionSelect(opt.value)
												}}>
												<span>{opt.label}</span>
												{isSelected && <i className='bi bi-check2'></i>}
											</div>
										)
									})
								) : (
									<div className='gz-select-empty'>No options found</div>
								)}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default SelectField

