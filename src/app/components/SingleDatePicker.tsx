import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Calendar } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { DayJS } from '../../_metronic/helpers/Utils'

type DateFilterProps = {
	onDateChange: (date: Date | null) => void
	leftValue?: string
}

const SingleDatePicker: React.FC<DateFilterProps> = ({ onDateChange, leftValue }) => {
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const datePickerRef = useRef<HTMLDivElement>(null)

	const formatDate = (date: Date | null): string => {
		return date ? date.toLocaleDateString() : 'Select Date'
	}

	const handleDateChange = (date: Date) => {
		setSelectedDate(date)
		onDateChange(date)
		setShowDatePicker(false)
	}

	const toggleDatePicker = () => {
		setShowDatePicker((prev) => !prev)
	}

	const handleClickOutside = (event: MouseEvent) => {
		if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
			setShowDatePicker(false)
		}
	}

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const today = DayJS().toDate()

	return (
		<div
			ref={datePickerRef}
			style={{ position: 'relative' }}>
			<div
				role='button'
				onClick={toggleDatePicker}
				style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
				<input
					className='form-control py-2'
					style={{ paddingRight: '2.5rem', fontSize: '14px' }}
					readOnly
					placeholder='Select Date'
					value={formatDate(selectedDate)}
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
						left: `${leftValue ? leftValue : '-500px'}`,
						zIndex: 1000,
						backgroundColor: 'white',
						boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
						maxWidth: '500%',
						overflowX: 'auto',
					}}>
					<Calendar
						date={selectedDate || new Date()}
						maxDate={today}
						onChange={(date) => handleDateChange(date)}
					/>
				</div>
			)}
		</div>
	)
}

export default SingleDatePicker
