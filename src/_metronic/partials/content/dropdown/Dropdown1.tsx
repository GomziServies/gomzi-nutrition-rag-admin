import { Dayjs } from 'dayjs'
import React from 'react'
import 'react-date-range/dist/styles.css' // main style file
import 'react-date-range/dist/theme/default.css' // theme css file
import { DayJS } from '../../../helpers/Utils'


export function Dropdown1() {
	// const handleSelect = (ranges: Range[]) => {
	// 	const rangesByKey: RangeKeyDict = {}
	// 	ranges.forEach((range, index) => {
	// 		const key = `range${index}`
	// 		rangesByKey[key] = range
	// 	})
	// }

	const [value, setValue] = React.useState<Dayjs | null>(DayJS('2022-04-17'))

	return (
		<div
			className='menu menu-sub menu-sub-dropdown w-250px w-md-300px'
			data-kt-menu='true'>
			<div className='px-7 py-5'>
				<div className='fs-5 text-dark fw-bolder'>Filter Options</div>
			</div>

			<div className='separator border-gray-200'></div>

			<div className='px-7 py-5'>
				<div className='mb-10'>
					<label
						htmlFor='dfsf'
						className='form-label fw-bold'>
						Brand:
					</label>
					<div>
						<select
							className='form-select form-select-solid'
							data-kt-select2='true'
							data-placeholder='Select option'
							data-allow-clear='true'
							defaultValue={'17841423812698385'}>
							<option value='17841423812698385'>FGIIT</option>
							<option value='17841405942376183'>FWG</option>
						</select>
					</div>
				</div>

				{/* Date Range Filter */}
				{/* <div className='mb-10'>
					<label
						htmlFor='dfsf'
						className='form-label fw-bold mb-4'>
						Date Range:
					</label>
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<DatePicker
							label='Select Date'
							defaultValue={DayJS('2022-04-17')}
						/>
						<DatePicker
							className='mt-4'
							label='Controlled picker'
							value={value}
							onChange={(newValue) => setValue(newValue)}
						/>
					</LocalizationProvider>
				</div> */}

				<div className='d-flex justify-content-end'>
					<button
						type='reset'
						className='btn btn-sm btn-light btn-active-light-primary me-2'
						data-kt-menu-dismiss='true'>
						Reset
					</button>

					<button
						type='submit'
						className='btn btn-sm btn-primary'
						data-kt-menu-dismiss='true'>
						Apply
					</button>
				</div>
			</div>
		</div>
	)
}
