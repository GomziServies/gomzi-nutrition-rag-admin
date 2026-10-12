/* eslint-disable jsx-a11y/anchor-is-valid */
import { faDollarSign, faHandHoldingUsd, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import CurrencyFormatter from '../../../components/CurrencyFormatter'

type Props = {
	className?: string
	formattedTotalAmount: any
	exercisePlan: any
}

const FWGListsWidget1: React.FC<Props> = ({ className, formattedTotalAmount, exercisePlan }) => {
	return (
		<div className='card'>
			<div className='card-header border-0'>
				<h3 className='card-title fw-bold text-dark'>Fitness With Gomzi</h3>
			</div>

			<div className='card-body pt-0'>
				{/* Total Income */}
				<div className='d-flex align-items-center bg-light-danger rounded p-5 mb-7'>
					<span className=' text-danger me-5'>
						<FontAwesomeIcon
							icon={faDollarSign}
							className='text-danger fs-3 me-5'
						/>
					</span>
					<div className='flex-grow-1 me-2'>
						<div className='fw-bold text-gray-800 text-hover-danger fs-6'>Total Income</div>
					</div>
					<span className='fw-bold text-danger py-1'>
						<CurrencyFormatter amount={parseInt(formattedTotalAmount.totalAmount)} />
					</span>
				</div>

				{/* Total Order */}
				<div className='d-flex align-items-center bg-light-info rounded p-5 mb-7'>
					<span className=' text-info me-5'>
						<FontAwesomeIcon
							icon={faHandHoldingUsd}
							className='text-info fs-3 me-5'
						/>
					</span>
					<div className='flex-grow-1 me-2'>
						<div className='fw-bold text-gray-800 text-hover-info fs-6'>Total Cost</div>
					</div>
					<span className='fw-bold text-info py-1'>
						<CurrencyFormatter amount={parseInt(formattedTotalAmount.totalPaidAmount)} />
					</span>
				</div>

				{/* Due Amount */}
				<div className='d-flex align-items-center bg-light-success rounded p-5 mb-7'>
					<span className=' text-success me-5'>
						<FontAwesomeIcon
							icon={faWallet}
							className='text-success fs-3 me-5'
						/>
					</span>
					<div className='flex-grow-1 me-2'>
						<div className='fw-bold text-gray-800 text-hover-success fs-6'>Due Amount</div>
					</div>
					<span className='fw-bold text-success py-1'>
						<CurrencyFormatter amount={parseInt(formattedTotalAmount.totalExpenseAmount)} />
					</span>
				</div>
			</div>
		</div>
	)
}

export { FWGListsWidget1 }
