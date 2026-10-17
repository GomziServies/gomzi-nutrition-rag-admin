import React, { useEffect, useRef, useState } from 'react'
import { MultiSelect, Option } from 'react-multi-select-component'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons'

type Props = {
	className?: string
	label?: string
	name?: string
	value?: any
	htmlFor?: string
	onChange?: (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement> | any) => void
	options: (string | { label: any; value: any })[] | any
	showLabel?: boolean
	multiSelect?: boolean
	marginRemove?: boolean
	defaultOpening?: boolean
	defaultClosing?: boolean
	disabled?: boolean | undefined
	searchable?: boolean
	hideDefaultOption?: boolean
	defaultLabel?: string
	height?: string
}

const SelectField: React.FC<Props> = ({
	className = '',
	label = '',
	value,
	name = '',
	onChange,
	htmlFor = '',
	options = [],
	disabled,
	showLabel = true,
	multiSelect = false,
	marginRemove,
	defaultOpening,
	defaultClosing,
	searchable,
	hideDefaultOption = false,
	defaultLabel,
	height,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const dropdownRef = useRef<HTMLDivElement>(null)

	const rawOptions = Array.isArray(options) ? options : []
	const formattedOptions: { label: string; value: string }[] = rawOptions.map((option) => {
		if (typeof option === 'string' || typeof option === 'number') {
			return { label: String(option), value: String(option) }
		}
		if (option && typeof option === 'object') {
			return {
				label: String(option.label ?? option.name ?? option.value ?? ''),
				value: String(option.value ?? option.id ?? option._id ?? option.label ?? ''),
			}
		}
		return { label: '', value: '' }
	})

	// Build full options array including defaults
	const allOptions: { label: string; value: string }[] = []
	if (defaultOpening) {
		allOptions.push({ label: 'Opening Time', value: 'Opening Time' })
	} else if (defaultClosing) {
		allOptions.push({ label: 'Closing Time', value: 'Closing Time' })
	} else if (
		!hideDefaultOption &&
		!formattedOptions.some((opt) => opt.value === 'Select' || opt.value === '')
	) {
		allOptions.push({ label: defaultLabel || 'Select', value: '' })
	}
	formattedOptions.forEach((opt) => {
		allOptions.push(opt)
	})

	const selectedValues = typeof value === 'string' ? value.split(',').map((v) => v.trim()) : []
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
		if (onChange) {
			onChange(syntheticEvent)
		}
	}

	const handleOptionSelect = (optionValue: string) => {
		const syntheticEvent = {
			target: {
				name: name,
				value: optionValue,
			},
		} as unknown as React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
		if (onChange) {
			onChange(syntheticEvent)
		}
		setIsOpen(false)
		setSearchTerm('')
	}

	// Current label to show in trigger
	const currentVal = value !== undefined && value !== null ? String(value) : ''
	const currentOption = allOptions.find((opt) => opt.value === currentVal)
	const placeholderText = defaultOpening
		? 'Opening Time'
		: defaultClosing
		? 'Closing Time'
		: defaultLabel || 'Select'

	const displayLabel = currentOption
		? currentOption.label
		: currentVal || placeholderText

	const showSearch = searchable !== false && (searchable === true || allOptions.length > 6)

	const filteredOptions = allOptions.filter((opt) => {
		if (!searchTerm) return true
		return opt.label.toLowerCase().includes(searchTerm.toLowerCase())
	})

	const triggerStyle: React.CSSProperties = height
		? { height, minHeight: height }
		: {}

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
						style={triggerStyle}
						onClick={() => {
							if (!disabled) setIsOpen(!isOpen)
						}}
						role='button'
						tabIndex={0}>
						<span
							className={`gz-select-trigger-text ${
								!currentVal || currentVal === 'Select' || (Boolean(defaultLabel) && displayLabel === defaultLabel)
									? 'is-placeholder'
									: ''
							}`}>
							{displayLabel}
						</span>
						<FontAwesomeIcon
							icon={faChevronDown}
							className='gz-select-chevron'
						/>
					</div>

					{/* Custom Dropdown Popup Menu */}
					{isOpen && !disabled && (
						<div className='gz-custom-select-dropdown'>
							{showSearch && (
								<div
									className='gz-select-search-box'
									style={{
										padding: '6px 8px',
										borderBottom: '1px solid #F1F5F9',
										position: 'relative',
										display: 'flex',
										alignItems: 'center',
										boxSizing: 'border-box',
									}}>
									<FontAwesomeIcon
										icon={faSearch}
										className='gz-select-search-icon'
										style={{
											position: 'absolute',
											left: '18px',
											top: '50%',
											transform: 'translateY(-50%)',
											fontSize: '12px',
											color: '#71809A',
											pointerEvents: 'none',
											zIndex: 5,
										}}
									/>
									<input
										type='text'
										placeholder='Search...'
										value={searchTerm}
										autoFocus
										onChange={(e) => setSearchTerm(e.target.value)}
										onClick={(e) => e.stopPropagation()}
										style={{
											width: '100%',
											height: '34px',
											minHeight: '34px',
											lineHeight: 'normal',
											backgroundColor: '#F8FAFD',
											border: '1px solid #DFE7F0',
											borderRadius: '6px',
											padding: '0 10px 0 34px',
											fontSize: '12.5px',
											fontWeight: 500,
											color: '#142447',
											outline: 'none',
											boxSizing: 'border-box',
										}}
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
												{isSelected && (
													<FontAwesomeIcon
														icon={faCheck}
														className='gz-select-check-icon'
													/>
												)}
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
