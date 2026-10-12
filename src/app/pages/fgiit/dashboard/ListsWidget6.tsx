/* eslint-disable jsx-a11y/anchor-is-valid */
import {
	faAddressBook,
	faAddressCard,
	faBook,
	faFile,
	faMoneyBillTransfer,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
	className: string
	items?: number
}

const ListsWidget6: React.FC<Props> = ({ className, items = 6 }) => {
	return (
		<div className='card card-xl-stretch mb-xl-8'>
			<div>
				<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-dark'>Applications & Forms</span>
					</h3>
					{/* <div className='card-toolbar'>
            <button
              type='button'
              className='btn btn-sm btn-icon btn-color-primary btn-active-light-primary'
              data-kt-menu-trigger='click'
              data-kt-menu-placement='bottom-end'
              data-kt-menu-flip='top-end'
            >
              <KTIcon iconName='category' className='fs-2' />
            </button>
          </div> */}
				</div>

				<div className='card-body pt-5'>
					<Link to='/fgiit/investment-contact-inquiry?search=INVESTMENT-STARTUP INQUIRY'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faMoneyBillTransfer}
										className='text-danger fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										Investment Applications
									</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/employee-inquiry'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faAddressBook}
										className='text-primary fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										Employee Applications
									</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/employer-inquiry'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faAddressCard}
										className='text-success fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										Employer Applications
									</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/rtp-session?search=Demo RTP Session'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faFile}
										className='text-warning fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										RTP Session Booking
									</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/book-bemo-session?search=Demo Lecture Registration'>
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
									<div className='text-gray-800  fs-6 fw-bold'>
										Book Demo Session Booking
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

export { ListsWidget6 }
