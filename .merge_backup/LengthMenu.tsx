import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

type LengthMenuProps = {
	expenseData?: any[]
	data?: any[]
	handleItemsPerPageChange?: (value: number) => void
	setItemsPerPage?: (value: number) => void
	onChange?: (value: number) => void
	itemsPerPage?: number
	value?: number
	options?: number[]
	className?: string
}

const LengthMenu: React.FC<LengthMenuProps> = ({
	expenseData,
	data,
	handleItemsPerPageChange,
	setItemsPerPage,
	onChange,
	itemsPerPage: propItemsPerPage,
	value: propValue,
	options: customOptions,
	className,
}) => {
	const currentList = expenseData || data
	const options = customOptions && customOptions.length > 0 ? customOptions : [10, 25, 50, 100]

	// Internal state so selecting a value always immediately updates the UI,
	// even when parent doesn't pass back a controlled value prop!
	const [selectedSize, setSelectedSize] = useState<number>(() => {
		return propValue ?? propItemsPerPage ?? 10
	})

	// Keep in sync if parent explicitly passes a controlled value
	useEffect(() => {
		if (propValue !== undefined) {
			setSelectedSize(propValue)
		} else if (propItemsPerPage !== undefined) {
			setSelectedSize(propItemsPerPage)
		}
	}, [propValue, propItemsPerPage])

	const onPageSizeChange = (size: number) => {
		setSelectedSize(size)
		if (onChange) onChange(size)
		if (handleItemsPerPageChange) handleItemsPerPageChange(size)
		if (setItemsPerPage) setItemsPerPage(size)
	}

	const [isOpen, setIsOpen] = useState(false)
	const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
		top: 0,
		left: 0,
		width: 80,
	})
	const buttonRef = useRef<HTMLButtonElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)

	const updateCoords = () => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect()
			const dropdownHeight = options.length * 36 + 16
			const spaceBelow = window.innerHeight - rect.bottom
			const openUp = spaceBelow < dropdownHeight && rect.top >= dropdownHeight
			setCoords({
				top: openUp ? Math.max(8, rect.top - dropdownHeight - 4) : rect.bottom + 4,
				left: rect.left,
				width: Math.max(rect.width, 85),
			})
		}
	}

	const toggleDropdown = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!isOpen) {
			updateCoords()
		}
		setIsOpen((prev) => !prev)
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}
		const handleScroll = () => {
			if (isOpen) updateCoords()
		}
		document.addEventListener('mousedown', handleClickOutside)
		window.addEventListener('scroll', handleScroll, true)
		window.addEventListener('resize', handleScroll)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			window.removeEventListener('scroll', handleScroll, true)
			window.removeEventListener('resize', handleScroll)
		}
	}, [isOpen])

	return (
		<div className={`d-inline-block ${className !== undefined ? className : 'me-3'}`} style={{ minWidth: '80px' }}>
			<button
				ref={buttonRef}
				type='button'
				onClick={toggleDropdown}
				style={{
					width: '100%',
					height: '38px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '8px',
					backgroundColor: '#ffffff',
					border: `1px solid ${isOpen ? '#1E3A5F' : '#DFE7F0'}`,
					borderRadius: '8px',
					padding: '6px 12px',
					fontSize: '13px',
					fontWeight: 600,
					color: '#111827',
					cursor: 'pointer',
					boxShadow: isOpen
						? '0 0 0 0.22rem rgba(30, 58, 95, 0.15)'
						: '0 1px 2px rgba(0, 0, 0, 0.04)',
					transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
					outline: 'none',
				}}>
				<span>{selectedSize}</span>
				<FontAwesomeIcon
					icon={faChevronDown}
					style={{
						fontSize: '11px',
						color: '#1E3A5F',
						transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
						transition: 'transform 0.2s ease',
						pointerEvents: 'none',
					}}
				/>
			</button>

			{isOpen &&
				createPortal(
					<div
						ref={dropdownRef}
						onClick={(e) => e.stopPropagation()}
						style={{
							position: 'fixed',
							top: coords.top,
							left: coords.left,
							width: coords.width,
							backgroundColor: '#ffffff',
							border: '1px solid #DFE7F0',
							borderRadius: '10px',
							boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08)',
							padding: '4px',
							zIndex: 999999,
						}}>
						{options.map((opt) => {
							const isSelected = opt === selectedSize
							return (
								<button
									key={opt}
									type='button'
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										onPageSizeChange(opt)
										setIsOpen(false)
									}}
									style={{
										width: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										padding: '7px 10px',
										border: 'none',
										borderRadius: '6px',
										backgroundColor: isSelected ? '#1E3A5F' : 'transparent',
										color: isSelected ? '#ffffff' : '#475569',
										fontSize: '13px',
										fontWeight: isSelected ? 700 : 500,
										cursor: 'pointer',
										transition: 'background-color 0.12s ease, color 0.12s ease',
										marginBottom: '2px',
									}}
									onMouseEnter={(e) => {
										if (!isSelected) {
											e.currentTarget.style.backgroundColor = 'rgba(30, 58, 95, 0.1)'
											e.currentTarget.style.color = '#1E3A5F'
										}
									}}
									onMouseLeave={(e) => {
										if (!isSelected) {
											e.currentTarget.style.backgroundColor = 'transparent'
											e.currentTarget.style.color = '#475569'
										}
									}}>
									{opt}
								</button>
							)
						})}
					</div>,
					document.body
				)}
		</div>
	)
}

export default LengthMenu
