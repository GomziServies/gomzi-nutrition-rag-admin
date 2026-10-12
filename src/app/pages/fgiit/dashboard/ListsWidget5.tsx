/* eslint-disable jsx-a11y/anchor-is-valid */
import {
	faBook,
	faBuildingColumns,
	faChartPie,
	faDumbbell,
	faFileLines,
	faPenToSquare,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
	className: string
	items?: number
	dashboardData: any
}

const ListsWidget5: React.FC<Props> = ({ className, items = 6, dashboardData }) => {
	return (
		<div className='card card-xl-stretch mb-xl-8'>
			<div>
				<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-dark'>FGIIT</span>
					</h3>
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

				<div className='card-body pt-5'>
					<Link to='/fgiit/student-dashboard'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faBuildingColumns}
										className='text-warning fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										Student Dashboard
									</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/scholarship-result'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faPenToSquare}
										className='text-info fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										Scholarship Result
									</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/books'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faBook}
										className='text-dark fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>Books</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/e-book'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faFileLines}
										className='text-primary fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>E-Books</div>
								</div>
							</div>
						</div>
					</Link>
				</div>
				<div
					className='card-header border-0 mb-2'
					style={{ minHeight: '0px' }}>
					<h3 className='card-title fw-bold text-dark m-0'>Product Specific Order</h3>
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
				</div>
			</div>
		</div>
	)
}

export { ListsWidget5 }
