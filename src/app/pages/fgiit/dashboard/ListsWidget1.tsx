/* eslint-disable jsx-a11y/anchor-is-valid */
import {
	faBoxOpen,
	faCalendarWeek,
	faFile,
	faInbox,
	faPenNib,
	faUserLarge,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
	className: string
	dashboardData: any
}

const ListsWidget1: React.FC<Props> = ({ dashboardData, className }) => {
	return (
		<div className='card card-xl-stretch mb-5 mb-xl-8'>
			<div className='card-header border-0'>
				<h3 className='card-title fw-bold text-dark'>FG Group</h3>
			</div>

			<div className='card-body pt-0'>
				{/* Registered Users */}
				<Link to='/fgiit/users'>
					<div className='d-flex align-items-center bg-light-warning rounded p-5 mb-7'>
						<span className=' text-warning me-5'>
							<FontAwesomeIcon
								icon={faUserLarge}
								className='text-warning fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800  fs-6'>Registered Users</div>
						</div>
						<span className='fw-bold text-warning py-1'>{dashboardData.active_user}</span>
					</div>
				</Link>

				{/* Scholarship Result */}
				<Link to='/fgiit/scholarship-result'>
					<div className='d-flex align-items-center bg-light-primary rounded p-5 mb-7'>
						<span className=' text-success me-5'>
							<FontAwesomeIcon
								icon={faPenNib}
								className='text-primary fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800  fs-6'>
								Scholarship Result
							</div>
						</div>
						<span className='fw-bold text-success py-1'>
							{dashboardData.weekly_scholarship_count}
						</span>
					</div>
				</Link>

				{/* Week Inquiry */}
				<Link to='/fgiit/contact-inquiry/contact'>
					<div className='d-flex align-items-center bg-light-danger rounded p-5 mb-7'>
						<span className=' text-danger me-5'>
							<FontAwesomeIcon
								icon={faInbox}
								className='text-danger fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800  fs-6'>Week Inquiry</div>
						</div>
						<span className='fw-bold text-primary py-1'>{dashboardData.contact_inquiry}</span>
					</div>
				</Link>

				{/* Total Order */}
				<Link to='/fgiit/all-order'>
					<div className='d-flex align-items-center bg-light-info rounded p-5 mb-7'>
						<span className=' text-info me-5'>
							<FontAwesomeIcon
								icon={faBoxOpen}
								className='text-info fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800  fs-6'>Total Order</div>
						</div>
						<span className='fw-bold text-info py-1'>{dashboardData.order_count}</span>
					</div>
				</Link>

				{/* RTP Consultancy */}
				<Link to='/fgiit/rtp-consultancy'>
					<div className='d-flex align-items-center bg-light-success rounded p-5 mb-7'>
						<span className=' text-info me-5'>
							<FontAwesomeIcon
								icon={faFile}
								className='text-success fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800 text-hover-success fs-6'>RTP Consultancy</div>
						</div>
						<span className='fw-bold text-info py-1'>{dashboardData.weekly_rtp_consultancy}</span>
					</div>
				</Link>

				{/* Seminar Registration */}
				<Link to='/fgiit/seminar-registration'>
					<div className='d-flex align-items-center bg-light-secondary rounded p-5 mb-5'>
						<span className=' text-info me-5'>
							<FontAwesomeIcon
								icon={faCalendarWeek}
								className='text-dark fs-3 me-5'
							/>
						</span>
						<div className='flex-grow-1 me-2'>
							<div className='fw-bold text-gray-800  fs-6'>
								Seminar Registration
							</div>
						</div>
						<span className='fw-bold text-dark py-1'>
							{dashboardData.weekly_seminar_registration}
						</span>
					</div>
				</Link>
			</div>
		</div>
	)
}

export { ListsWidget1 }
