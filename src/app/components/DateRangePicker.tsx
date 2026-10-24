import { faCalendarDays, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { addDays, endOfMonth, startOfMonth, subDays } from 'date-fns'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
	customIcon?: React.ReactNode
	defaultAllDates?: boolean
}

const DateFilter: React.FC<DateFilterProps> = ({
	onDateRangeChange,
	setMonth,
	lastMonth,
	storageKey,
	customIcon,
	defaultAllDates,
}) => {
	const location = useLocation()
	const key = storageKey || `selectedDateRange_${location.pathname}`

	// Set default range
	let defaultRange: DateRange
	if (defaultAllDates) {
		const allDatesStart = new Date(2015, 0, 1)
		allDatesStart.setHours(0, 0, 0, 0)
		const allDatesEnd = new Date()
		allDatesEnd.setHours(23, 59, 59, 999)
		defaultRange = [allDatesStart, allDatesEnd]
	} else if (lastMonth) {
		defaultRange = [
			startOfMonth(subDays(new Date(), new Date().getDate())),
			endOfMonth(subDays(new Date(), new Date().getDate())),
		]
	} else {
		defaultRange = [startOfMonth(new Date()), endOfMonth(new Date())]
	}
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [selectedRange, setSelectedRange] = useState<DateRange>(defaultRange)
	const [tempRange, setTempRange] = useState<DateRange | null>(null)
	const [shownDate, setShownDate] = useState<Date>(() => {
		return defaultRange[0] || new Date()
	})
	const datePickerRef = useRef<HTMLDivElement>(null)

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

	const isAllDates = (range: DateRange | null): boolean => {
		if (!range || !range[0] || !range[1]) return true
		const start = new Date(range[0])
		return start.getFullYear() <= 2015
	}

	// Format date range for input display
	const formatDateRange = (range: DateRange | null): string => {
		if (!range || !range[0] || !range[1]) return 'All Date'
		if (isAllDates(range)) return 'All Date'
		const start = range[0].toLocaleDateString()
		const end = range[1].toLocaleDateString()
		return `${start} - ${end}`
	}

	const handleResetToAllDates = (e: React.MouseEvent) => {
		e.stopPropagation()
		const allDatesStart = new Date(2015, 0, 1)
		allDatesStart.setHours(0, 0, 0, 0)
		const now = new Date()
		now.setHours(23, 59, 59, 999)
		const allRange: DateRange = [allDatesStart, now]
		setSelectedRange(allRange)
		setTempRange(allRange)
		onDateRangeChange(allRange)
		if (key) {
			localStorage.setItem(
				key,
				JSON.stringify([allDatesStart.toISOString(), now.toISOString()])
			)
		}
	}

	// Handle date range change from the picker
	const handleDateRangeChange = (ranges: any) => {
		const { selection } = ranges
		if (selection) {
			const startDate = selection.startDate
			const endDate = selection.endDate
			setTempRange([startDate, endDate])
			if (startDate) {
				setShownDate(startDate)
			}
		} else {
			setTempRange(defaultRange)
		}
	}

	const handleApplyRange = () => {
		const finalRange = tempRange || selectedRange
		setSelectedRange(finalRange)
		onDateRangeChange(finalRange)
		setShowDatePicker(false)
	}

	// Toggle date picker visibility
	const toggleDatePicker = () => {
		if (!showDatePicker) {
			setTempRange(selectedRange)
			const initialShown =
				selectedRange && selectedRange[0] && !isAllDates(selectedRange)
					? selectedRange[0]
					: new Date()
			setShownDate(initialShown)
		}
		setShowDatePicker((prev) => !prev)
	}

	useEffect(() => {
		const storedDateRange = localStorage.getItem(key)
		if (storedDateRange) {
			try {
				const parsed = JSON.parse(storedDateRange)
				let startDate: Date | null = null
				let endDate: Date | null = null

				if (Array.isArray(parsed) && parsed.length >= 2) {
					startDate = new Date(parsed[0])
					endDate = new Date(parsed[1])
				} else if (parsed && typeof parsed === 'object') {
					const s = parsed.startDate || parsed.start || parsed[0]
					const e = parsed.endDate || parsed.end || parsed[1]
					if (s) startDate = new Date(s)
					if (e) endDate = new Date(e)
				}

				if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
					setSelectedRange([startDate, endDate])
					setTempRange([startDate, endDate])
					onDateRangeChange([startDate, endDate])
				} else {
					onDateRangeChange(defaultRange)
				}
			} catch (error) {
				console.error('Error parsing stored date range:', error)
				onDateRangeChange(defaultRange)
			}
		} else {
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

	const activeRangeDisplay = tempRange ? tempRange : selectedRange

	const memoizedRanges = useMemo(() => {
		return [
			{
				startDate: activeRangeDisplay[0],
				endDate: activeRangeDisplay[1],
				key: 'selection',
			},
		]
	}, [activeRangeDisplay[0]?.getTime(), activeRangeDisplay[1]?.getTime()])

	return (
		<div
			ref={datePickerRef}
			style={{ position: 'relative' }}>
			<div
				role='button'
				onClick={toggleDatePicker}
				style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
				<input
					className='form-control gz-filter-date-input'
					style={{ paddingRight: '3.4rem', cursor: 'pointer' }}
					readOnly
					placeholder='Select Date'
					value={formatDateRange(selectedRange)}
				/>
				<div
					style={{
						position: 'absolute',
						right: '0.85rem',
						top: '50%',
						transform: 'translateY(-50%)',
						display: 'inline-flex',
						alignItems: 'center',
						gap: '6px',
					}}>
					{!isAllDates(selectedRange) && (
						<button
							type='button'
							onClick={handleResetToAllDates}
							title='Reset to All Date'
							aria-label='Reset to All Date'
							style={{
								border: 'none',
								background: 'transparent',
								padding: '2px 4px',
								cursor: 'pointer',
								color: '#94a3b8',
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '12px',
								borderRadius: '4px',
								lineHeight: 1,
							}}
							onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
							onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}>
							<FontAwesomeIcon icon={faXmark as any} />
						</button>
					)}
					{customIcon ? (
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								pointerEvents: 'none',
							}}>
							{customIcon}
						</div>
					) : (
						<FontAwesomeIcon
							icon={faCalendarDays as any}
							style={{
								color: '#94a3b8',
								fontSize: '13.5px',
								pointerEvents: 'none',
							}}
						/>
					)}
				</div>
			</div>

			{/* Centered Modal Backdrop via createPortal */}
			{showDatePicker &&
				createPortal(
					<div
						className='gz-datepicker-overlay'
						onClick={() => setShowDatePicker(false)}>
						<div
							className='gz-datepicker-modal'
							onClick={(e) => e.stopPropagation()}>
							{/* Modal Header */}
							<div className='d-flex align-items-center justify-content-between px-5 py-3 border-bottom border-gray-200 bg-light'>
								<div className='d-flex align-items-center gap-2'>
									<span
										className='symbol symbol-30px'
										style={{
											background: '#eff6ff',
											color: '#172B4D',
											borderRadius: '8px',
											display: 'inline-flex',
											alignItems: 'center',
											justifyContent: 'center',
											width: '32px',
											height: '32px',
										}}>
										{customIcon || <FontAwesomeIcon icon={faCalendarDays as any} />}
									</span>
									<div>
										<h5 className='m-0 fw-bold fs-6 text-dark'>Select Date Range</h5>
										<span className='text-muted fs-8'>Filter data by predefined or custom date range</span>
									</div>
								</div>
								<button
									type='button'
									className='btn btn-icon btn-sm btn-light'
									onClick={() => setShowDatePicker(false)}>
									<FontAwesomeIcon icon={faXmark as any} />
								</button>
							</div>

							{/* Modal Body with DateRangePicker */}
							<div
								className='p-2'
								style={{ overflowX: 'auto', overflowY: 'auto' }}>
								<DateRangePicker
									ranges={memoizedRanges}
									onChange={handleDateRangeChange}
									months={2}
									direction='horizontal'
									shownDate={shownDate}
									onShownDateChange={(date: Date) => setShownDate(date)}
									preventSnapRefocus={true}
									staticRanges={staticRanges}
									inputRanges={inputRanges}
								/>
							</div>

							{/* Modal Footer with Actions */}
							<div className='d-flex align-items-center justify-content-between px-5 py-3 border-top border-gray-200 bg-light flex-wrap gap-2'>
								<div className='d-flex align-items-center gap-1'>
									<span className='text-muted fs-7'>Selected Range:</span>
									<span className='badge badge-light-primary fw-bold fs-7 px-2 py-1'>
										{formatDateRange(activeRangeDisplay)}
									</span>
								</div>
								<div className='d-flex gap-2'>
									<button
										type='button'
										className='btn btn-sm btn-light'
										onClick={() => setShowDatePicker(false)}>
										Cancel
									</button>
									<button
										type='button'
										className='btn btn-sm btn-primary'
										onClick={handleApplyRange}>
										Apply Filter
									</button>
								</div>
							</div>
						</div>
					</div>,
					document.body
				)}
		</div>
	)
}

export default DateFilter
