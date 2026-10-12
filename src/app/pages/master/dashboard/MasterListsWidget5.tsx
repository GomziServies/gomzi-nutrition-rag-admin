import React from 'react'
import InputField from '../../../components/InputField'
import { DayJS } from '../../../../_metronic/helpers/Utils'
var currencyFormatter = require('currency-formatter')

type Props = {
	className: string
	week1: any
	week2: any
	week3: any
	week4: any
	fromDate: any
}

const MasterListsWidget5: React.FC<Props> = ({ className, week1, week2, week3, week4, fromDate }) => {
	return (
		<div className={`card ${className}`} style={{minHeight: '567px'}}>
			<div className='card-header align-items-center border-0 px-4 pt-0'>
				<h3 className='card-title align-items-start flex-column px-0'>
					<span className='fw-bold mb-2 text-dark'>Monthly Total</span>
				</h3>
			</div>
			<div className='card-body pt-5'>
				<div className='mb-20'>
					<InputField
						placeholder='From Date'
						type='date'
						className='col-12 fv-row'
						name='from_date'
						label='From Date'
						htmlFor='from_date'
						value={DayJS(fromDate).format('YYYY-MM-DD')}
						disabled
					/>
				</div>
				<div className='timeline-label'>
					<div className='timeline-item'>
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week 1</div>
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-danger fs-1'></i>
						</div>
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>{currencyFormatter.format(week1, { code: 'INR' })}/-</h4>
						</div>
					</div>
					<div className='timeline-item'>
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week 2</div>
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-primary fs-1'></i>
						</div>
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>{currencyFormatter.format(week2, { code: 'INR' })}/-</h4>
						</div>
					</div>
					<div className='timeline-item'>
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week 3</div>
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-danger fs-1'></i>
						</div>
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>{currencyFormatter.format(week3, { code: 'INR' })}/-</h4>
						</div>
					</div>
					<div className='timeline-item'>
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week- 4</div>
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-primary fs-1'></i>
						</div>
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>{currencyFormatter.format(week4, { code: 'INR' })}/-</h4>
						</div>
					</div>
				</div>
				<div className='target-progress d-flex mt-15 pt-5'>
					<div className='bar-value'>
						<h2 className='mb-0'>Total: {currencyFormatter.format(week1 + week2 + week3 + week4, { code: 'INR' })}/-</h2>
					</div>
				</div>
			</div>
		</div>
	)
}

export { MasterListsWidget5 }
