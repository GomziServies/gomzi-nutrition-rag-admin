import { faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Option = {
	value: string
	name: string
}

type Props = {
	className?: string
	label?: string
	name?: string
	value?: string
	htmlFor?: string
	onChange?: (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void
	options: Option[]
	disabled?: boolean | undefined
	showLabel?: boolean
	marginRemove?: boolean
	defaultOptionValue?: string
	searchable?: boolean
}

const SelectFieldManual: React.FC<Props> = ({
	className = '',
	label = '',
	value = '',
	name = '',
	onChange,
	htmlFor,
	options = [],
	disabled,
	showLabel = true,
	marginRemove,
	defaultOptionValue = '',
	searchable = true,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [coords, setCoords] = useState<{
		top?: number
		bottom?: number
		left: number
		width: number
		maxHeight: number
	}>({
		top: 0,
		left: 0,
		width: 200,
		maxHeight: 280,
	})
	const buttonRef = useRef<HTMLButtonElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (isOpen && searchable) {
			setTimeout(() => {
				searchInputRef.current?.focus()
			}, 30)
		}
	}, [isOpen, searchable])

	const portalTarget = typeof document !== 'undefined' ? document.body : null

	const allOptions = [
		{ name: `Select ${label}`, value: defaultOptionValue },
		...options,
	]

	const selectedStr = value !== undefined && value !== null ? String(value).trim() : ''
	const currentOption = selectedStr
		? allOptions.find((opt) => opt.value === selectedStr || opt.name.toLowerCase() === selectedStr.toLowerCase())
		: allOptions[0]
	const displayLabel = currentOption ? currentOption.name : selectedStr || `Select ${label}`

	const updateCoords = () => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect()
			const targetWidth = rect.width
			let left = rect.left
			if (typeof window !== 'undefined' && left + targetWidth > window.innerWidth - 10) {
				left = Math.max(10, window.innerWidth - targetWidth - 10)
			}
			if (left < 10) left = 10

			const GAP = 4
			const MAX_H = 280
			const spaceBelow =
				typeof window !== 'undefined' ? window.innerHeight - rect.bottom - GAP - 10 : MAX_H
			const spaceAbove = typeof window !== 'undefined' ? rect.top - GAP - 10 : 0
			const openAbove = spaceBelow < 160 && spaceAbove > spaceBelow

			if (openAbove) {
				setCoords({
					bottom: window.innerHeight - rect.top + GAP,
					left,
					width: targetWidth,
					maxHeight: Math.max(120, Math.min(MAX_H, spaceAbove)),
				})
			} else {
				setCoords({
					top: rect.bottom + GAP,
					left,
					width: targetWidth,
					maxHeight: Math.max(120, Math.min(MAX_H, spaceBelow)),
				})
			}
		}
	}

	const toggleDropdown = (e: React.MouseEvent) => {
		if (disabled) return
		e.preventDefault()
		e.stopPropagation()
		if (!isOpen) {
			setSearchTerm('')
			updateCoords()
		}
		setIsOpen((prev) => !prev)
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node
			if (
				containerRef.current &&
				!containerRef.current.contains(target) &&
				menuRef.current &&
				!menuRef.current.contains(target) &&
				buttonRef.current &&
				!buttonRef.current.contains(target)
			) {
				setIsOpen(false)
			}
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				setIsOpen(false)
				buttonRef.current?.focus()
			}
		}

		const handleScroll = () => {
			if (isOpen) updateCoords()
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleKeyDown)
		window.addEventListener('scroll', handleScroll, true)
		window.addEventListener('resize', handleScroll)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('scroll', handleScroll, true)
			window.removeEventListener('resize', handleScroll)
		}
	}, [isOpen])

	const handleOptionSelect = (optValue: string) => {
		const syntheticEvent = {
			target: {
				name: name,
				value: optValue,
			},
		} as unknown as React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
		if (onChange) {
			onChange(syntheticEvent)
		}
		setIsOpen(false)
	}

	const filteredOptions = allOptions.filter((opt) =>
		opt.name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	return (
		<div className={`fv-row ${marginRemove ? `mb-0` : `mb-md-7 mb-3`} ${className}`}>
			{showLabel && (
				<label
					htmlFor={htmlFor}
					className='fw-bold fs-6 mb-md-5 mb-2'>
					{label}
				</label>
			)}
			<div className={`${marginRemove ? 'mb-0' : 'mb-3 mb-lg-0'} position-relative`} ref={containerRef}>
				<button
					ref={buttonRef}
					type='button'
					disabled={disabled}
					onClick={toggleDropdown}
					style={{
						width: '100%',
						height: '38px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: '8px',
						backgroundColor: disabled ? '#F8FAFD' : '#ffffff',
						border: `1px solid ${isOpen ? '#1E3A5F' : '#DFE7F0'}`,
						borderRadius: '8px',
						padding: '6px 12px',
						fontSize: '13px',
						fontWeight: 500,
						color: disabled ? '#94a3b8' : '#172B4D',
						cursor: disabled ? 'not-allowed' : 'pointer',
						boxShadow: isOpen
							? '0 0 0 0.22rem rgba(30, 58, 95, 0.15)'
							: '0 1px 2px rgba(0, 0, 0, 0.04)',
						transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
						outline: 'none',
						textAlign: 'left',
					}}
					onMouseEnter={(e) => {
						if (!disabled && !isOpen) {
							e.currentTarget.style.borderColor = '#1E3A5F'
						}
					}}
					onMouseLeave={(e) => {
						if (!disabled && !isOpen) {
							e.currentTarget.style.borderColor = '#DFE7F0'
						}
					}}>
					<span
						style={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							flex: 1,
						}}>
						{displayLabel}
					</span>
					<FontAwesomeIcon
						icon={faChevronDown}
						style={{
							fontSize: '11px',
							color: '#1E3A5F',
							transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
							transition: 'transform 0.2s ease',
							pointerEvents: 'none',
							flexShrink: 0,
						}}
					/>
				</button>

				{isOpen &&
					portalTarget &&
					createPortal(
						<div
							ref={menuRef}
							onClick={(e) => e.stopPropagation()}
							onMouseDown={(e) => e.stopPropagation()}
							style={{
								position: 'fixed',
								top: coords.top,
								bottom: coords.bottom,
								left: coords.left,
								width: coords.width,
								maxHeight: coords.maxHeight,
								backgroundColor: '#ffffff',
								border: '1px solid #DFE7F0',
								borderRadius: '10px',
								boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(0, 0, 0, 0.06)',
								padding: '6px',
								zIndex: 999999,
								display: 'flex',
								flexDirection: 'column',
								animation: 'fadeIn 0.12s ease',
							}}>
							{searchable && allOptions.length > 5 && (
								<div
									style={{
										position: 'relative',
										padding: '4px',
										borderBottom: '1px solid #DFE7F0',
										marginBottom: '4px',
									}}>
									<div
										className='selectfield-search-wrapper'
										style={{
											display: 'flex',
											alignItems: 'center',
											width: '100%',
											height: '34px',
											border: '1px solid #DFE7F0',
											borderRadius: '6px',
											backgroundColor: '#F8FAFD',
											padding: '0 10px',
											gap: '8px',
											boxSizing: 'border-box',
										}}>
										<FontAwesomeIcon
											icon={faSearch}
											style={{
												fontSize: '12px',
												color: '#94a3b8',
												flexShrink: 0,
											}}
										/>
										<input
											ref={searchInputRef}
											type='search'
											placeholder='Search...'
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											onClick={(e) => e.stopPropagation()}
											onMouseDown={(e) => e.stopPropagation()}
											className='selectfield-search-input'
											autoComplete='off'
											spellCheck={false}
											style={{
												width: '100%',
												height: '100%',
												minHeight: '0',
												fontSize: '12.5px',
												fontWeight: 500,
												border: 'none',
												borderRadius: '0',
												outline: 'none',
												backgroundColor: 'transparent',
												color: '#172B4D',
												margin: 0,
												padding: 0,
												boxShadow: 'none',
											}}
										/>
									</div>
								</div>
							)}

							<div style={{ overflowY: 'auto', flex: 1, maxHeight: '230px' }}>
								{filteredOptions.length === 0 ? (
									<div
										style={{
											padding: '10px',
											fontSize: '12px',
											color: '#94a3b8',
											textAlign: 'center',
										}}>
										No options found
									</div>
								) : (
									filteredOptions.map((opt, idx) => {
										const isSelected =
											opt.value === selectedStr ||
											(opt.value && selectedStr && opt.value.toLowerCase() === selectedStr.toLowerCase()) ||
											(opt.name && selectedStr && opt.name.toLowerCase() === selectedStr.toLowerCase())
										return (
											<button
												key={`manual_opt_${idx}_${opt.value}`}
												type='button'
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													handleOptionSelect(opt.value)
												}}
												style={{
													width: '100%',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													padding: '8px 12px',
													border: 'none',
													borderRadius: '6px',
													backgroundColor: isSelected ? '#1E3A5F' : 'transparent',
													color: isSelected ? '#ffffff' : '#475569',
													fontSize: '13px',
													fontWeight: isSelected ? 700 : 500,
													cursor: 'pointer',
													transition: 'background-color 0.12s ease, color 0.12s ease',
													marginBottom: '2px',
													textAlign: 'left',
													outline: 'none',
													boxShadow: 'none',
													userSelect: 'none',
												}}
												onMouseEnter={(e) => {
													if (isSelected) {
														e.currentTarget.style.backgroundColor = '#152D4A'
													} else {
														e.currentTarget.style.backgroundColor = 'rgba(30, 58, 95, 0.1)'
														e.currentTarget.style.color = '#1E3A5F'
													}
												}}
												onMouseLeave={(e) => {
													if (isSelected) {
														e.currentTarget.style.backgroundColor = '#1E3A5F'
													} else {
														e.currentTarget.style.backgroundColor = 'transparent'
														e.currentTarget.style.color = '#475569'
													}
												}}>
												<span
													style={{
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}>
													{opt.name}
												</span>
												{isSelected && (
													<svg
														width='14'
														height='14'
														viewBox='0 0 24 24'
														fill='none'
														style={{ flexShrink: 0, marginLeft: '8px' }}>
														<path
															d='M20 6L9 17l-5-5'
															stroke='#ffffff'
															strokeWidth='2.5'
															strokeLinecap='round'
															strokeLinejoin='round'
														/>
													</svg>
												)}
											</button>
										)
									})
								)}
							</div>
						</div>,
						document.body
					)}
			</div>
		</div>
	)
}

export default SelectFieldManual
