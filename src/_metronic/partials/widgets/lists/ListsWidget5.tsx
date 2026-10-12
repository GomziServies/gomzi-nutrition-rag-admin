/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { KTIcon } from '../../../helpers'
import { Dropdown1 } from '../../content/dropdown/Dropdown1'

type Props = {
	className: string
}

const ListsWidget5: React.FC<Props> = ({ className }) => {
	return (
		<div className={`card ${className}`}>
			{/* begin::Header */}
			<div className='card-header align-items-center border-0 px-4 pt-0'>
				<h3 className='card-title align-items-start flex-column px-0'>
					<span className='fw-bold mb-2 text-dark'>Monthly Target</span>
				</h3>
				<div className='card-toolbar'>
					{/* begin::Menu */}
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
					<Dropdown1 />
					{/* end::Menu */}
				</div>
			</div>
			{/* end::Header */}
			{/* begin::Body */}
			<div className='card-body pt-5'>
				{/* begin::Timeline */}
				<div className='timeline-label'>
					{/* begin::Item */}
					<div className='timeline-item'>
						{/* begin::Label */}
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week 1</div>
						{/* end::Label */}
						{/* begin::Badge */}
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-danger fs-1'></i>
						</div>
						{/* end::Badge */}
						{/* begin::Desc */}
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>₹25,000/-</h4>
						</div>
						{/* end::Desc */}
					</div>
					{/* end::Item */}
					{/* begin::Item */}
					<div className='timeline-item'>
						{/* begin::Label */}
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week 2</div>
						{/* end::Label */}
						{/* begin::Badge */}
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-primary fs-1'></i>
						</div>
						{/* end::Badge */}
						{/* begin::Text */}
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>₹10,000/-</h4>
						</div>
						{/* end::Text */}
					</div>
					{/* end::Item */}
					{/* begin::Item */}
					<div className='timeline-item'>
						{/* begin::Label */}
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week 3</div>
						{/* end::Label */}
						{/* begin::Badge */}
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-danger fs-1'></i>
						</div>
						{/* end::Badge */}
						{/* begin::Desc */}
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>₹25,000/-</h4>
						</div>
						{/* end::Desc */}
					</div>
					{/* end::Item */}
					{/* begin::Item */}
					<div className='timeline-item'>
						{/* begin::Label */}
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week- 4</div>
						{/* end::Label */}
						{/* begin::Badge */}
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-primary fs-1'></i>
						</div>
						{/* end::Badge */}
						{/* begin::Text */}
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>₹95,000/-</h4>
						</div>
						{/* end::Text */}
					</div>
					{/* end::Item */}
					{/* begin::Item */}
					<div className='timeline-item'>
						{/* begin::Label */}
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week- 5</div>
						{/* end::Label */}
						{/* begin::Badge */}
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-primary fs-1'></i>
						</div>
						{/* end::Badge */}
						{/* begin::Text */}
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>₹95,000/-</h4>
						</div>
						{/* end::Text */}
					</div>
					{/* end::Item */}
					{/* begin::Item */}
					<div className='timeline-item'>
						{/* begin::Label */}
						<div className='timeline-label fw-bold text-gray-800 fs-6'>Week- 6</div>
						{/* end::Label */}
						{/* begin::Badge */}
						<div className='timeline-badge'>
							<i className='fa fa-genderless text-primary fs-1'></i>
						</div>
						{/* end::Badge */}
						{/* begin::Text */}
						<div className='timeline-content fw-bold text-gray-800 ps-3'>
							<h4>₹95,000/-</h4>
						</div>
						{/* end::Text */}
					</div>
					{/* end::Item */}
				</div>
				{/* end::Timeline */}
				{/* Display target at the end */}
				<div className='target-progress d-flex mt-10 pt-5'>
					<div className='bar-value'>
						<h2 className='mb-0'>Target: ₹2,00,000/-</h2>
					</div>
				</div>
			</div>
			{/* end: Card Body */}
		</div>
	)
}

export { ListsWidget5 }
