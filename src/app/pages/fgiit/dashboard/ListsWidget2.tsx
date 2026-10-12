/* eslint-disable jsx-a11y/anchor-is-valid */
import { faChartPie, faDumbbell } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
	className: string
	dashboardData: any
}

const ListsWidget2: React.FC<Props> = ({ dashboardData, className }) => {
	return (
		<div className='card card-xl-stretch mb-5 mb-xl-8'>
			<div className='card-header border-0'>
				<h3 className='card-title fw-bold text-dark'>Product Specific Order</h3>
				{/* <div className='card-toolbar'>
					<button
						type='button'
						className='btn btn-sm btn-icon btn-color-primary btn-active-light-primary'
						data-kt-menu-trigger='click'
						data-kt-menu-placement='bottom-end'
						data-kt-menu-flip='top-end'>
						<KTIcon
							iconName='category'
							className='fs-2'
						/>
					</button>
				</div> */}
			</div>

			<div className='card-body pt-0'>
				{/* Digital Plan */}
				<Link to='/fgiit/digital-plan-order'>
					<div className='d-flex align-items-center bg-light-danger rounded p-5 mb-7'>
						<span className=' text-danger me-5'>
							<FontAwesomeIcon
								icon={faChartPie}
								className='text-danger fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800  fs-6'>Digital Plan</div>
						</div>
						<span className='fw-bold text-danger py-1'>
							{dashboardData.weekly_digital_plan_order}
						</span>
					</div>
				</Link>

				{/* PT Plan */}
				<Link to='/fgiit/fitness-plan'>
					<div className='d-flex align-items-center bg-light-success rounded p-5 mb-7'>
						<span className=' text-success me-5'>
							<FontAwesomeIcon
								icon={faDumbbell}
								className='text-success fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800 text-hover-success fs-6'>PT Plan</div>
						</div>
						<span className='fw-bold text-success py-1'>
							{dashboardData.weekly_pt_plan_registration}
						</span>
					</div>
				</Link>

				{/* <Link to='/fgiit/fitness-courses'>
					<div className='d-flex align-items-center bg-light-primary rounded p-5 mb-7'>
						<span className=' text-primary me-5'>
							<FontAwesomeIcon
								icon={faGraduationCap}
								className='text-primary fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800  fs-6'>Fitness Course</div>
						</div>
						<span className='fw-bold text-primary py-1'>
							{dashboardData.weekly_fitness_course_orders}
						</span>
					</div>
				</Link> */}

				{/* Book Order */}
				{/* <Link to='/fgiit/book-order'>
					<div className='d-flex align-items-center bg-light-secondary rounded p-5 mb-7'>
						<span className=' text-secondary me-5'>
							<FontAwesomeIcon
								icon={faBoxOpen}
								className='text-dark fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800  fs-6'>Book Order</div>
						</div>
						<span className='fw-bold text-dark py-1'>{dashboardData.weekly_book_orders}</span>
					</div>
				</Link> */}

				{/* E-Book Order */}
				{/* <Link to='/fgiit/e-book-order'>
					<div className='d-flex align-items-center bg-light-info rounded p-5 mb-7'>
						<span className=' text-info me-5'>
							<FontAwesomeIcon
								icon={faFileLines}
								className='text-info fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800 text-hover-info fs-6'>E-Book Order</div>
						</div>
						<span className='fw-bold text-info py-1'>{dashboardData.weekly_ebook_orders}</span>
					</div>
				</Link> */}

				{/* Product */}
				{/* <Link to='/fgiit/product-order'>
					<div className='d-flex align-items-center bg-light-warning rounded p-5 mb-5'>
						<span className=' text-warning me-5'>
							<FontAwesomeIcon
								icon={faBox}
								className='text-warning fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800  fs-6'>Meal Order</div>
						</div>
						<span className='fw-bold text-warning py-1'>{dashboardData.weekly_meal_orders}</span>
					</div>
				</Link> */}
			</div>
		</div>
	)
}

export { ListsWidget2 }
