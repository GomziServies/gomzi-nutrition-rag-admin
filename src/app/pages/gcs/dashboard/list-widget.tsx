/* eslint-disable jsx-a11y/anchor-is-valid */
import {
	faBook,
	faBuildingColumns,
	faComments,
	faFileLines,
	faPenToSquare,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'
import { KTIcon } from '../../../../_metronic/helpers'

type Props = {
	className: string
	items?: number
}

const ListsWidgetGCS: React.FC<Props> = () => {
	return (
		<div className='card card-xl-stretch mb-xl-8'>
			<div>
				<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-dark'>Inquiry</span>
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
					<Link to='/gcs/contact'>
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
									<a
										href='#'
										className='text-gray-800  fs-6 fw-bold'>
										GCS
									</a>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/gcs/contact'>
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
									<a
										href='#'
										className='text-gray-800  fs-6 fw-bold'>
										Takshak
									</a>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/gcs/contact'>
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
									<a
										href='#'
										className='text-gray-800  fs-6 fw-bold'>
										A To Z
									</a>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/gcs/contact'>
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
									<a
										href='#'
										className='text-gray-800  fs-6 fw-bold'>
										FitIT
									</a>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/gcs/contact'>
						<div className='d-flex align-items-sm-center mb-7'>
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
									<a
										href='#'
										className='text-gray-800  fs-6 fw-bold'>
										Stallon
									</a>
								</div>
							</div>
						</div>
					</Link>
				</div>
			</div>
		</div>
	)
}

export { ListsWidgetGCS }
