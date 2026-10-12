/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { Link } from 'react-router-dom'
import { KTIcon } from '../../../../_metronic/helpers'
import CurrencyFormatter from '../../../components/CurrencyFormatter'

type Props = {
	className: string
	color: string
	dashboardData: any
	Amount: any
}

const TotalOrder: React.FC<Props> = ({ className, color, dashboardData, Amount }) => {
	return (
		<div className={`card ${className} p-0`}>
			{/* begin::Body */}
			<div
				style={{ padding: '0!important' }}
				className='p-0'>
				{/* begin::Header */}
				<div className={`px-9 pt-7 card-rounded h-275px w-100 bg-${color}`}>
					{/* begin::Heading */}
					<div className='d-flex flex-stack'>
						<h3 className='m-0 text-white fw-bold fs-3'>Books Orders</h3>
						<div className='ms-1'>
							{/* begin::Menu */}
							<Link
								to={'/fgiit/book-order'}
								className={`btn btn-sm btn-icon btn-color-white btn-active-white border-0 me-n3`}>
								<KTIcon
									iconName='category'
									className='fs-2'
								/>
							</Link>
							{/* end::Menu */}
						</div>
					</div>
					{/* end::Heading */}
					{/* begin::Balance */}
					<div className='d-flex text-center flex-column text-white pt-8'>
						<span className='fw-semibold fs-7'>Order Amount</span>
						<span className='fw-bold fs-2x pt-1'>
							<CurrencyFormatter amount={parseInt(Amount)} />
						</span>
					</div>
					{/* end::Balance */}
				</div>
				{/* end::Header */}
				{/* begin::Items */}
				<div
					className='shadow-xs card-rounded mx-9 mb-9 px-6 py-9 position-relative z-index-1 bg-body'
					style={{ marginTop: '-100px' }}>
					{/* begin::Item */}
					<div className='d-flex align-items-center mb-6'>
						{/* begin::Symbol */}
						<div className='symbol symbol-45px w-40px me-5'>
							<span className='symbol-label bg-lighten'>
								<KTIcon
									iconName='dollar'
									className='fs-1'
								/>
							</span>
						</div>
						{/* end::Symbol */}
						{/* begin::Description */}
						<div className='d-flex align-items-center flex-wrap w-100'>
							{/* begin::Title */}
							<div className='mb-1 pe-3 flex-grow-1'>
								<Link
									to={'/fgiit/book-order'}
									className='fs-5 text-gray-800  fw-bold'>
									Book Order
								</Link>
							</div>
							{/* end::Title */}
							{/* begin::Label */}
							<div className='d-flex align-items-center'>
								<div className='fw-bold fs-5 text-gray-800 pe-1'>
									{dashboardData?.booksCount || 0}
								</div>
							</div>
							{/* end::Label */}
						</div>
						{/* end::Description */}
					</div>
					{/* end::Item */}
					{/* begin::Item */}
					<div className='d-flex align-items-center mb-6'>
						{/* begin::Symbol */}
						<div className='symbol symbol-45px w-40px me-5'>
							<span className='symbol-label bg-lighten'>
								<KTIcon
									iconName='book'
									className='fs-1'
								/>
							</span>
						</div>
						{/* end::Symbol */}
						{/* begin::Description */}
						<div className='d-flex align-items-center flex-wrap w-100'>
							{/* begin::Title */}
							<div className='mb-1 pe-3 flex-grow-1'>
								<Link
									to={'/fgiit/e-book-order'}
									className='fs-5 text-gray-800  fw-bold'>
									E-Book Orders
								</Link>
							</div>
							{/* end::Title */}
							{/* begin::Label */}
							<div className='d-flex align-items-center'>
								<div className='fw-bold fs-5 text-gray-800 pe-1'>
									{dashboardData?.ebooksCount || 0}
								</div>
							</div>
							{/* end::Label */}
						</div>
						{/* end::Description */}
					</div>
					{/* end::Item */}
					{/* begin::Item */}
					<div className='d-flex align-items-center mb-0'>
						{/* begin::Symbol */}
						<div className='symbol symbol-45px w-40px me-5'>
							<span className='symbol-label bg-lighten'>
								<KTIcon
									iconName='messages'
									className='fs-1'
								/>
							</span>
						</div>
						{/* end::Symbol */}
						{/* begin::Description */}
						<div className='d-flex align-items-center flex-wrap w-100'>
							{/* begin::Title */}
							<div className='mb-1 pe-3 flex-grow-1'>
								<Link
									to={'/fgiit/book-feedback'}
									className='fs-5 text-gray-800  fw-bold'>
									Book Feedbacks
								</Link>
							</div>
							{/* end::Title */}
							{/* begin::Label */}
							{/* <div className='d-flex align-items-center'>
								<div className='fw-bold fs-5 text-gray-800 pe-1'>0</div>
							</div> */}
							{/* end::Label */}
						</div>
						{/* end::Description */}
					</div>
					{/* end::Item */}
				</div>
				{/* end::Items */}
			</div>
			{/* end::Body */}
		</div>
	)
}

export { TotalOrder }
