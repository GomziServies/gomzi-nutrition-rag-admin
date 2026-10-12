/* eslint-disable jsx-a11y/anchor-is-valid */
import { faDollar, faHandHoldingDollar, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { KTIcon } from '../../../helpers'
import { Dropdown1 } from '../../content/dropdown/Dropdown1'
import moment from 'moment';
import { GetInvoice } from '../../../../app/Functions/FWG'

type Props = {
	className: string
	color: string
}


type Invoice = {
	date: string;
	totalPayment: number;
	paidPayment: number;
}

const MixedWidget1: React.FC<Props> = ({ className, color }) => {
	const [totalIncome, setTotalIncome] = useState<number>(0);
	const [totalCost, setTotalCost] = useState<number>(0);
	const [dueAmount, setDueAmount] = useState<number>(0);

	const fetchInvoiceData = async () => {
		try {
			const result = await GetInvoice();

			if (!result || !Array.isArray(result.data)) {
				console.error('Invalid data received from API');
				return;
			}

			const totalData: Invoice[] = result.data.map((item: any) => ({
				date: item.date,
				totalPayment: item.totalPayment,
				paidPayment: item.paidPayment
			}));


			const currentMonth = moment().format('MM');
			// Filter data for the running month
			const runningMonthData = totalData.filter(invoice => {
				const invoiceMonth = moment(invoice.date).format('MM'); // Get the month of the invoice in MM format
				return invoiceMonth === currentMonth;
			});
			// Initialize total amount variables
			let totalIncome = 0;
			let totalCost = 0;
			// Loop through the invoices of the running month
			for (let i = 0; i < runningMonthData.length; i++) {
				const invoice = runningMonthData[i];
				const totalPayment = Number(invoice.totalPayment); // Convert to number
				const paidPayment = Number(invoice.paidPayment);
				totalIncome += totalPayment;
				totalCost += paidPayment;
			}
			const dueAmount = totalIncome - totalCost;
			setTotalIncome(totalIncome);
			setTotalCost(totalCost);
			setDueAmount(Math.max(dueAmount, 0));
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchInvoiceData();
	}, []);

	return (
		<div className={`card ${className}`}>
			{/* begin::Body */}
			<div className='card-body p-0'>
				{/* begin::Header */}
				<div className={`px-9 pt-7 card-rounded h-275px w-100 bg-${color}`}>
					{/* begin::Heading */}
					<div className='d-flex flex-stack'>
						<h3 className='m-0 text-white fw-bold fs-3'>Income/Cost Summary</h3>
						<div className='ms-1'>
							{/* begin::Menu */}
							<button
								type='button'
								className={`btn btn-sm btn-icon btn-color-white btn-active-white btn-active-color-${color} border-0 me-n3`}
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
					{/* begin::Balance */}
					<div className='d-flex text-center flex-column text-white pt-8'>
						<span className='fw-semibold fs-7'>Total Income</span>
						<span className='fw-bold fs-2x pt-1'>₹37,562.00</span>
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
								<FontAwesomeIcon
									icon={faDollar}
									className='fs-1'
								/>
							</span>
						</div>
						{/* end::Symbol */}
						{/* begin::Description */}
						<div className='d-flex align-items-center flex-wrap w-100'>
							{/* begin::Title */}
							<div className='mb-1 pe-3 flex-grow-1'>
								<a
									href='#'
									className='fs-5 text-gray-800 text-hover-primary fw-bold'>
									Paid Amount
								</a>
							</div>
							<div className='d-flex align-items-center'>
								<div className='fw-bold fs-5 text-gray-800 pe-1'>₹10,000,000/-</div>
							</div>
						</div>
					</div>
					<div className='d-flex align-items-center mb-6'>
						<div className='symbol symbol-45px w-40px me-5'>
							<span className='symbol-label bg-lighten'>
								<FontAwesomeIcon
									icon={faHandHoldingDollar}
									className='fs-1'
								/>
							</span>
						</div>
						<div className='align-items-center flex-wrap w-100'>
							<div className='mb-1 pe-3 flex-grow-1'>
								<a
									href='#'
									className='fs-5 text-gray-800 text-hover-primary fw-bold'>
									Due Amount
								</a>
							</div>
							<div className='d-flex align-items-center'>
								<div className='fw-bold fs-5 text-gray-800 pe-1'>₹10,000/-</div>
							</div>
						</div>
					</div>
					<div className='d-flex align-items-center'>
						<div className='symbol symbol-45px w-40px me-5'>
							<span className='symbol-label bg-lighten'>
								<FontAwesomeIcon
									icon={faWallet}
									className='fs-1'
								/>
							</span>
						</div>
						<div className=' align-items-center flex-wrap w-100'>
							<div className='mb-1 pe-3 flex-grow-1'>
								<a
									href='#'
									className='fs-5 text-gray-800 text-hover-primary fw-bold'>
									Total Cost
								</a>
							</div>
							<div className='d-flex align-items-center'>
								<div className='fw-bold fs-5 text-gray-800 pe-1'>₹10,500,00/-</div>
							</div>
						</div>
						
					</div>
				</div>
			</div>
		</div>
	)
}

export { MixedWidget1 }
