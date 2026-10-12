/* eslint-disable jsx-a11y/anchor-is-valid */
import {
	faBoxesPacking,
	faComments,
	faEnvelope,
	faMessage,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'
import { KTIcon } from '../../../../_metronic/helpers'

type Props = {
	className: string
	items?: number
}

const ListsWidget3: React.FC<Props> = ({ className, items = 6 }) => {
	return (
		<div>
			<div className='card card-xl-stretch mb-xl-8'>
				<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-dark'>Nutrition Product</span>
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
					<Link to='/fgiit/gomzi-nutrition-product'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faBoxesPacking}
										className='text-info fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>Products</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/product-feedback'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faMessage}
										className='text-success fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										Product Feedback
									</div>
								</div>
							</div>
						</div>
					</Link>
				</div>
			</div>

			<div className='card card-xl-stretch mb-xl-8 pb-12'>
				<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-dark'>Courses</span>
					</h3>
					<div className='card-toolbar'>
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
					</div>
				</div>

				<div className='card-body pt-5'>
					<Link to='/fgiit/contact-inquiry/contact'>
						<div className='d-flex align-items-sm-center'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faEnvelope}
										className='text-primary fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										Best And Affordable Fitness Center In India
									</div>
								</div>
							</div>
						</div>
					</Link>
				</div>

				<div className='card-body'>
					<Link to='/fgiit/course-feedback'>
						<div className='d-flex align-items-sm-center mb-15'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faComments}
										className='text-danger fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										Course feedback
									</div>
								</div>
							</div>
						</div>
					</Link>
				</div>
			</div>
		</div>
	)
}

export { ListsWidget3 }
