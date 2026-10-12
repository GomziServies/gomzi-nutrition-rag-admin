/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { KTIcon } from '../../../helpers'
import { Dropdown1 } from '../../content/dropdown/Dropdown1'

type Props = {
	className: string
	color: string
}

const TargetWidget: React.FC<Props> = ({ className, color }) => {
	const targetAmount = 25000

	const weeks = [
		{ week: 'Week 1', amount: 10000 },
		{ week: 'Week 2', amount: 20000 },
		{ week: 'Week 3', amount: 21000 },
		{ week: 'Week 4', amount: 25000 },
	]

	return (
		<div className={`card ${className}`}>
			{/* begin::Body */}
			<div className='card-body p-0'>
				{/* begin::Header */}
				<div className={`card-rounded w-100`}>
					{/* begin::Heading */}
					<div className='d-flex flex-stack'>
						<h3 className='m-0 fw-bold fs-3'>Target</h3>
						<div className='ms-1'>
							{/* begin::Menu */}
							<button
								type='button'
								className={`btn btn-sm btn-icon btn-active-color-${color} border-0 me-n3`}
								data-kt-menu-trigger='click'
								data-kt-menu-placement='bottom-end'
								data-kt-menu-flip='top-end'>
								<KTIcon
									iconName='category'
									className='fs-2'
								/>
							</button>
							<Dropdown1 />
							{/* end::Menu */}
						</div>
					</div>
					{/* end::Heading */}
				</div>
				{/* end::Header */}
				{/* begin::Items */}
				{/* begin::Item */}
				<div className='mb-6 mt-5'>
					{weeks.map((week, index) => (
						<div
							className='target-progress d-flex'
							key={index}>
							<div
								className='progress-bar'
								style={{
									position: 'relative',
									backgroundColor: '#85a0ff',
									borderRadius: '5px',
									width: `10px`,
									height: '100px',
									marginRight: '20px',
									transition: 'width 0.5s ease-in-out',
								}}>
								{/* Progress bar */}
								<div
									className='progress'
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										backgroundColor: '#0038ff',
										width: '15px',
										borderRadius: '5px',
										animation: 'progressAnimation 1s forwards', // Add animation for smooth progress
									}}></div>
							</div>

							{/* Target value and week label */}
							<div className='bar-value'>
								<h4 className='mb-0'>₹{week.amount}/-</h4>
								<p>{week.week}</p>
							</div>
						</div>
					))}
					{/* Display target at the end */}
					<div className='target-progress d-flex mt-5'>
						<div className='bar-value'>
							<h4 className='mb-0'>Target: ₹{targetAmount}/-</h4>
						</div>
					</div>
				</div>
				{/* end::Item */}
			</div>
			{/* end::Items */}
		</div>
	)
}

export { TargetWidget }
