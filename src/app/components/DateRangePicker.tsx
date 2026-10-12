import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { addDays, endOfMonth, startOfMonth, subDays } from 'date-fns'
import React, { useEffect, useRef, useState } from 'react'
import { DateRangePicker } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { useLocation } from 'react-router-dom'

type DateRange = [Date, Date]

type DateFilterProps = {
	onDateRangeChange: (dateRange: DateRange | null) => void
	leftValue?: string
	rightValue?: string
	setMonth?: boolean
	lastMonth?: boolean
	storageKey?: string
}

const DateFilter: React.FC<DateFilterProps> = ({
	onDateRangeChange,
	leftValue,
	rightValue,
	setMonth,
	lastMonth,
	storageKey,
}) => {
	const location = useLocation()
	const key = storageKey || `selectedDateRange_${location.pathname}`

	// Set default to current month's start and end
	let defaultRange: DateRange
	lastMonth
		? (defaultRange = [
				startOfMonth(subDays(new Date(), new Date().getDate())),
				endOfMonth(subDays(new Date(), new Date().getDate())),
		  ])
		: (defaultRange = [startOfMonth(new Date()), endOfMonth(new Date())])
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [selectedRange, setSelectedRange] = useState<DateRange>(defaultRange)
	const [tempRange, setTempRange] = useState<DateRange | null>(null)
	const datePickerRef = useRef<HTMLDivElement>(null)

	// Predefined ranges (optional)
	const predefinedRanges = [
		{
			label: 'All Dates',
			range: {
				startDate: new Date(2015, 0, 1), // Start from January 1, 2015
				endDate: new Date(),
				key: 'selection',
			},
		},
	]

	const staticRanges = [
		{
			label: 'All Dates',
			range: () => ({
				startDate: new Date(2015, 0, 1),
				endDate: new Date(),
			}),
			isSelected: (range: any) => {
				const allDatesStart = new Date(2015, 0, 1)
				const today = new Date()
				return (
					range.startDate.getTime() === allDatesStart.getTime() &&
					range.endDate.toDateString() === today.toDateString()
				)
			},
		},
		{
			label: 'Today',
			range: () => ({
				startDate: new Date(),
				endDate: new Date(),
			}),
			isSelected: (range: any) => {
				const today = new Date()
				return (
					range.startDate.toDateString() === today.toDateString() &&
					range.endDate.toDateString() === today.toDateString()
				)
			},
		},
		{
			label: 'Yesterday',
			range: () => ({
				startDate: subDays(new Date(), 1),
				endDate: subDays(new Date(), 1),
			}),
			isSelected: (range: any) => {
				const yesterday = subDays(new Date(), 1)
				return (
					range.startDate.toDateString() === yesterday.toDateString() &&
					range.endDate.toDateString() === yesterday.toDateString()
				)
			},
		},
		{
			label: 'This Week',
			range: () => ({
				startDate: addDays(new Date(), -new Date().getDay()),
				endDate: addDays(new Date(), 6 - new Date().getDay()),
			}),
			isSelected: (range: any) => {
				const weekStart = addDays(new Date(), -new Date().getDay())
				const weekEnd = addDays(new Date(), 6 - new Date().getDay())
				return (
					range.startDate.toDateString() === weekStart.toDateString() &&
					range.endDate.toDateString() === weekEnd.toDateString()
				)
			},
		},
		{
			label: 'Last Week',
			range: () => ({
				startDate: addDays(new Date(), -new Date().getDay() - 7),
				endDate: addDays(new Date(), 6 - new Date().getDay() - 7),
			}),
			isSelected: (range: any) => {
				const lastWeekStart = addDays(new Date(), -new Date().getDay() - 7)
				const lastWeekEnd = addDays(new Date(), 6 - new Date().getDay() - 7)
				return (
					range.startDate.toDateString() === lastWeekStart.toDateString() &&
					range.endDate.toDateString() === lastWeekEnd.toDateString()
				)
			},
		},
		{
			label: 'This Month',
			range: () => ({
				startDate: startOfMonth(new Date()),
				endDate: endOfMonth(new Date()),
			}),
			isSelected: (range: any) => {
				const monthStart = startOfMonth(new Date())
				const monthEnd = endOfMonth(new Date())
				return (
					range.startDate.toDateString() === monthStart.toDateString() &&
					range.endDate.toDateString() === monthEnd.toDateString()
				)
			},
		},
		{
			label: 'Last Month',
			range: () => ({
				startDate: startOfMonth(subDays(new Date(), 30)),
				endDate: endOfMonth(subDays(new Date(), 30)),
			}),
			isSelected: (range: any) => {
				const lastMonthStart = startOfMonth(subDays(new Date(), 30))
				const lastMonthEnd = endOfMonth(subDays(new Date(), 30))
				return (
					range.startDate.toDateString() === lastMonthStart.toDateString() &&
					range.endDate.toDateString() === lastMonthEnd.toDateString()
				)
			},
		},
	]

	const inputRanges: any[] = []

	// Format date range for input display
	const formatDateRange = (range: DateRange | null): string => {
		if (!range || !range[0] || !range[1]) return 'Select Date'
		const start = range[0].toLocaleDateString()
		const end = range[1].toLocaleDateString()
		return `${start} - ${end}`
	}

	const handleSelectRange = (range: any) => {
		setSelectedRange([range.startDate, range.endDate])
		onDateRangeChange([range.startDate, range.endDate])
		// Persistence is now handled by a dedicated useEffect
		setShowDatePicker(false)
	}

	// Handle date range change from the picker
	const handleDateRangeChange = (ranges: any) => {
		const { selection } = ranges
		if (selection) {
			const startDate = selection.startDate
			const endDate = selection.endDate
			setTempRange([startDate, endDate])
			if (startDate && endDate && startDate !== endDate) {
				setSelectedRange([startDate, endDate])
				onDateRangeChange([startDate, endDate])
				setShowDatePicker(false)
			}
		} else {
			setSelectedRange(defaultRange)
			onDateRangeChange(defaultRange)
			setShowDatePicker(false)
		}
	}

	// Toggle date picker visibility
	const toggleDatePicker = () => {
		setShowDatePicker((prev) => !prev)
	}

	// Close picker if clicked outside
	const handleClickOutside = (event: MouseEvent) => {
		if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
			setShowDatePicker(false)
		}
	}

	useEffect(() => {
		// Set up click outside handler
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	useEffect(() => {
		const storedDateRange = localStorage.getItem(key)
		if (storedDateRange) {
			try {
				const [startStr, endStr] = JSON.parse(storedDateRange)
				const startDate = new Date(startStr)
				const endDate = new Date(endStr)

				if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
					setSelectedRange([startDate, endDate])
					setTempRange([startDate, endDate])
					onDateRangeChange([startDate, endDate])
				}
			} catch (error) {
				console.error('Error parsing stored date range:', error)
			}
		} else {
			// If nothing stored, notify parent of default
			onDateRangeChange(defaultRange)
		}
	}, [key])

	// Automatically persist selectedRange whenever it changes
	useEffect(() => {
		if (selectedRange) {
			localStorage.setItem(
				key,
				JSON.stringify([selectedRange[0].toISOString(), selectedRange[1].toISOString()])
			)
		}
	}, [selectedRange, key])

	return (
		<div
			ref={datePickerRef}
			style={{ position: 'relative' }}>
			<div
				role='button'
				onClick={toggleDatePicker}
				style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
				<input
					className='form-control'
					style={{ paddingRight: '2.5rem' }}
					readOnly
					placeholder='Select Date'
					value={formatDateRange(selectedRange)} // Show default or selected date range
				/>
				<FontAwesomeIcon
					icon={faCalendarDays}
					style={{
						position: 'absolute',
						right: '0.75rem',
						pointerEvents: 'none',
						color: '#999',
					}}
				/>
			</div>
			{showDatePicker && (
				<div
					style={{
						position: 'absolute',
						top: 'calc(100% + 5px)',
						...(rightValue ? { right: rightValue } : { left: leftValue ? leftValue : '-500px' }),
						zIndex: 1000,
						backgroundColor: 'white',
						boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
						borderRadius: '8px',
					}}>
					<DateRangePicker
						ranges={[
							{
								startDate: tempRange ? tempRange[0] : defaultRange[0],
								endDate: tempRange ? tempRange[1] : defaultRange[1],
								key: 'selection',
							},
						]}
						onChange={handleDateRangeChange}
						months={2}
						direction='horizontal'
						staticRanges={staticRanges}
						inputRanges={inputRanges}
					/>
				</div>
			)}
		</div>
	)
}

export default DateFilter
