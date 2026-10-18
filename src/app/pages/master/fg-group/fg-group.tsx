import {
	faBook,
	faFileSignature,
	faFileVideo,
	faHandHoldingDollar,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { PageTitle } from '../../../../_metronic/layout/core'
import { MasterListsWidget5 } from '../dashboard/MasterListsWidget5'
import { FWGMasterChart } from '../dashboard/FWGMasterChart'
import { MasterChart } from '../dashboard/MasterChart'
import SelectField from '../../../components/SelectField'
import InputField from '../../../components/InputField'
import { useEffect, useState } from 'react'
import { GetExpenses, GetInvoice } from '../../../Functions/FWG'
import { GetOrdersInsights } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import currencyFormatter from 'currency-formatter'

const MasterFGGroup = () => {
	const [totalIncomeData, setTotalIncomeData] = useState<any>({})
	const [fwgInvoiceData, setFwgInvoiceData] = useState<any>({
		RTP1: '',
		RTP2: '',
		RTP3: '',
		RTP4: '',
		RTP5: '',
	})
	const [totalWeekData, setTotalWeekData] = useState<any>({})
	const [selectedBranch, setSelectedBranch] = useState('FGIIT')
	const [formData, setFormData] = useState<any>({
		from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
		to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
	})

	const fetchData = async (page?: number) => {
		// const startOfMonth = DayJS().startOf('month').toDate()
		let startOfMonth: any
		let endOfMonth: any
		if (formData.from_date && formData.to_date) {
			startOfMonth = formData.from_date
			endOfMonth = formData.to_date
		}

		try {
			const response = await GetOrdersInsights({
				item_type: ["FG_MEAL_PRODUCT", "PT_PLAN", "FITNESS_COURSE", "DIGITAL_PLAN", "BOOKS", "EBOOKS"],
				currency: 'INR',
				purchase_mode: ['ONLINE', 'Cash On Delivery'],
				order_status: 'SUCCESS',
				from_date: startOfMonth,
				to_date: endOfMonth,
			})
			const ids = [
				//books and ebooks
				'BOOKS#SUCCESS#INR#ONLINE#RAZORPAY_FGIIT',

				//Fitness Course
				'FITNESS_COURSE#SUCCESS#INR#ONLINE#RAZORPAY',

				//Flexible
				'PT_PLAN#SUCCESS#INR#ONLINE#RAZORPAY',

				//Offline
				'FITNESS_COURSE#SUCCESS#INR#MANUAL',

				//Product
				'FG_MEAL_PRODUCT#SUCCESS#INR#ONLINE#RAZORPAY',
			]

			// Find matching data for each ID and filter out undefined values
			const data = ids
				.map((id) => response.data.find((el: any) => el._id === id))
				.filter((el) => el !== undefined)

			// Group, sum the amounts, and sum the order counts by category
			const booksAndEbooks = response.data.filter(
				(item: any) => item.item_type === 'BOOKS' || item.item_type === 'EBOOKS'
			)
			const booksAndEbooksTotal = booksAndEbooks.reduce(
				(acc: any, item: any) => acc + item.total_amount,
				0
			)
			const booksCount = booksAndEbooks
				.filter((item: any) => item.item_type === 'BOOKS')
				.reduce((acc: any, item: any) => acc + item.order_count, 0)

			const ebooksCount = booksAndEbooks
				.filter((item: any) => item.item_type === 'EBOOKS')
				.reduce((acc: any, item: any) => acc + item.order_count, 0)

			const flexibleProductTotal = data
				.filter((item) => item._id.includes('FG_MEAL_PRODUCT'))
				.reduce((acc, item) => acc + item.total_amount, 0)

			const fitnessCourseTotal = data
				.filter((item) => item._id.includes('FITNESS_COURSE'))
				.reduce((acc, item) => acc + item.total_amount, 0)

			const offlineTotal = data
				.filter((item) => item._id.includes('MANUAL'))
				.reduce((acc, item) => acc + item.total_amount, 0)

			const productTotal = data
				.filter((item) => item._id.includes('FG_MEAL_PRODUCT'))
				.reduce((acc, item) => acc + item.total_amount, 0)

			setTotalIncomeData({
				booksAndEbooks: booksAndEbooksTotal,
				flexibleProduct: flexibleProductTotal,
				fitnessCourse: fitnessCourseTotal,
				offline: offlineTotal,
				product: productTotal,
				totalAmount: booksAndEbooksTotal + flexibleProductTotal + fitnessCourseTotal + offlineTotal + productTotal,
			})

		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchWeekAmountData = async (page?: number) => {
		try {
			const weeksData = [];
			let startOfMonth = new Date(formData.from_date);
			let endOfMonth = new Date(startOfMonth);

			for (let i = 0; i <= 4; i++) {
				endOfMonth.setDate(startOfMonth.getDate() + 7);

				const response = await GetOrdersInsights({
					item_type: ["FG_MEAL_PRODUCT", "PT_PLAN", "FITNESS_COURSE", "DIGITAL_PLAN", "BOOKS", "EBOOKS"],
					currency: 'INR',
					purchase_mode: ["ONLINE", "MANUAL"],
					order_status: 'SUCCESS',
					from_date: startOfMonth,
					to_date: endOfMonth,
				});

				const ids = [
					'BOOKS#SUCCESS#INR#ONLINE#RAZORPAY_FGIIT',
					'FITNESS_COURSE#SUCCESS#INR#ONLINE#RAZORPAY',
					'PT_PLAN#SUCCESS#INR#ONLINE#RAZORPAY',
					'FITNESS_COURSE#SUCCESS#INR#MANUAL',
					'FG_MEAL_PRODUCT#SUCCESS#INR#ONLINE#RAZORPAY',
				];

				const data = ids
					.map((id) => response.data.find((el: any) => el._id === id))
					.filter((el) => el !== undefined);

				const totalAmount = data.reduce((acc, item) => acc + item.total_amount, 0);

				weeksData.push(totalAmount);

				startOfMonth = new Date(endOfMonth);
			}

			setTotalWeekData({
				week1: weeksData[0] || 0,
				week2: weeksData[1] || 0,
				week3: weeksData[2] || 0,
				week4: weeksData[3] || 0,
			});

		} catch (error) {
			console.error(error);
		}
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setFormData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	useEffect(() => {
		fetchData()
		fetchWeekAmountData()
	}, [formData.from_date, formData.to_date])

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setSelectedBranch(event.target.value)
	}

	const [invoiceData, setInvoiceData] = useState<any>([])

	const fetchFWGData = async (page?: number) => {
		try {
			const response = await GetInvoice();
			setInvoiceData(response.data)

			const matchingProducts = response.data.filter((el: any) =>
				["RTP-1.0", "RTP-2.0", "RTP-3.0", "RTP-4.0", "RTP-5.0"].some(substring => el.productName.includes(substring))
			);

			const paymentSummary = matchingProducts.reduce((acc: any, el: any) => {
				const productKey = ["RTP-1.0", "RTP-2.0", "RTP-3.0", "RTP-4.0", "RTP-5.0"].find(substring => el.productName.includes(substring));
				if (productKey) {
					if (!acc[productKey]) {
						acc[productKey] = 0;
					}
					acc[productKey] += el.totalPayment;
				}
				return acc;
			}, {});

			if (Object.keys(paymentSummary).length > 0) {
				const invoiceData = {
					RTP1: paymentSummary["RTP-1.0"] || 0,
					RTP2: paymentSummary["RTP-2.0"] || 0,
					RTP3: paymentSummary["RTP-3.0"] || 0,
					RTP4: paymentSummary["RTP-4.0"] || 0,
					RTP5: paymentSummary["RTP-5.0"] || 0,
				};
				setFwgInvoiceData(invoiceData);
			} else {
				setFwgInvoiceData({});
			}
		} catch (error: any) {
			console.error("Error fetching FWG data:", error);
		}
	}

	const [expenseData, setExpenseData] = useState<any>([])

	const fetchExpenseData = async () => {
		try {
			const response: any = await GetExpenses()
			setExpenseData(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const totalPaidAmount = invoiceData.reduce(
		(sum: any, invoice: any) => sum + parseFloat(invoice.paidPayment),
		0
	)

	const totalAmount = invoiceData.reduce(
		(sum: any, invoice: any) => sum + parseFloat(invoice.totalPayment),
		0
	)

	const totalExpenseAmount = expenseData.reduce(
		(sum: number, invoice: any) => sum + parseFloat(invoice.expenseAmount),
		0
	)

	const totalDueAmount = totalAmount - totalPaidAmount

	// Format the total amounts with commas
	const formattedTotalAmount = totalAmount.toLocaleString()
	const formattedTotalDueAmount = totalDueAmount.toLocaleString()
	const formattedTotalExpenseAmount = totalExpenseAmount.toLocaleString()

	useEffect(() => {
		if (selectedBranch == "FWG") {
			fetchFWGData()
			fetchExpenseData()
		}
	}, [selectedBranch])
	return (
		<>
			<PageTitle breadcrumbs={[]}>FG Group</PageTitle>
			<div className='row g-5 g-xl-5'>
				<div className='col-md-8'>
					<div className={`card`}>
						<div className='card-body p-0'>
							<div className="row justify-content-between">
								<div className='col-md-2 d-flex align-items-start'>
									<h2 className='m-0 fw-bold my-5 fs-1'>Sales</h2>
								</div>
								{
									selectedBranch != "FWG" ? (
										<div className='col-md-7'>
											<div className='row'>
												<InputField
													placeholder='From Date'
													type='date'
													className='col-md-6 fv-row'
													name='from_date'
													label='From Date'
													htmlFor='from_date'
													value={formData.from_date}
													onChange={handleInputChange}
												/>
												<InputField
													placeholder='To Date'
													type='date'
													className='col-md-6 fv-row'
													name='to_date'
													label='To Date'
													htmlFor='to_date'
													value={formData.to_date}
													onChange={handleInputChange}
												/>
											</div>
										</div>
									) : ''
								}
								<div className="col-3">
									<SelectField
										className='col-md-12 fv-row'
										label='Select Branch'
										name='branch'
										value={selectedBranch}
										onChange={handleSelectChange}
										htmlFor='Select Branch'
										marginRemove={true}
										options={[
											'FGIIT',
											'FWG',
										]}
									/>
								</div>
							</div>
							{selectedBranch != "FWG" ? (
								<div className='row'>
									<div className='col-md-4'>
										<div className={`px-1 card-rounded h-250px w-100`}>
											<div className='d-flex flex-column pt-5'>
												<span className='fw-semibold fs-7'>Total Income</span>
												<span className='fw-bold fs-1 pt-1'>{currencyFormatter.format(totalIncomeData.totalAmount, { code: 'INR' })}</span>
											</div>
										</div>
										<div
											className='px-6 py-9 position-relative z-index-1'
											style={{ marginTop: '-170px' }}>
											<div className='d-flex align-items-center mb-6'>
												<div className='symbol symbol-45px w-40px me-5'>
													<span className='symbol-label bg-lighten'>
														<FontAwesomeIcon
															icon={faBook}
															className='fs-1'
														/>
													</span>
												</div>
												<div className='w-100'>
													<div className='pe-3 flex-grow-1'>
														<p className='fs-5 m-0 text-gray-800  fw-bold'>Book</p>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>{currencyFormatter.format(totalIncomeData.booksAndEbooks, { code: 'INR' })}/-</div>
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
												<div className='w-100'>
													<div className='pe-3 flex-grow-1'>
														<p className='fs-5 m-0 text-gray-800  fw-bold'>Course</p>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>{currencyFormatter.format(totalIncomeData.fitnessCourse, { code: 'INR' })}/-</div>
													</div>
												</div>
											</div>
											<div className='d-flex align-items-center mb-6'>
												<div className='symbol symbol-45px w-40px me-5'>
													<span className='symbol-label bg-lighten'>
														<FontAwesomeIcon
															icon={faFileVideo}
															className='fs-1'
														/>
													</span>
												</div>
												<div className='w-100'>
													<div className='pe-3 flex-grow-1'>
														<p className='fs-5 m-0 text-gray-800  fw-bold'>Flexible</p>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>{currencyFormatter.format(totalIncomeData.flexibleProduct, { code: 'INR' })}/-</div>
													</div>
												</div>
											</div>
											<div className='d-flex align-items-center mb-6'>
												<div className='symbol symbol-45px w-40px me-5'>
													<span className='symbol-label bg-lighten'>
														<FontAwesomeIcon
															icon={faFileSignature}
															className='fs-1'
														/>
													</span>
												</div>
												<div className='w-100'>
													<div className='pe-3 flex-grow-1'>
														<p className='fs-5 m-0 text-gray-800  fw-bold'>Offline</p>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>{currencyFormatter.format(totalIncomeData.offline, { code: 'INR' })}/-</div>
													</div>
												</div>
											</div>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px w-40px me-5'>
													<span className='symbol-label bg-lighten'>
														<FontAwesomeIcon
															icon={faFileSignature}
															className='fs-1'
														/>
													</span>
												</div>
												<div className='w-100'>
													<div className='pe-3 flex-grow-1'>
														<p className='fs-5 m-0 text-gray-800  fw-bold'>Product</p>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>{currencyFormatter.format(totalIncomeData.product, { code: 'INR' })}/-</div>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className='col-md-8'>
										<MasterChart chartValue={totalIncomeData} />
									</div>
								</div>
							) : (
								<div className='row'>
									<div className='col-md-4'>
										<div className={`px-1 card-rounded h-250px w-100`}>
											<div className='d-flex flex-column pt-5'>
												<span className='fw-semibold fs-7'>Total Income</span>
												<span className='fw-bold fs-1 pt-1'>{currencyFormatter.format(formattedTotalAmount, { code: 'INR' })}</span>
											</div>
										</div>
										<div
											className='px-6 py-9 position-relative z-index-1'
											style={{ marginTop: '-170px' }}>
											<div className='d-flex align-items-center mb-6'>
												<div className='symbol symbol-45px w-40px me-5'>
													<span className='symbol-label bg-lighten'>
														<FontAwesomeIcon
															icon={faBook}
															className='fs-1'
														/>
													</span>
												</div>
												<div className='w-100'>
													<div className='pe-3 flex-grow-1'>
														<p className='fs-5 m-0 text-gray-800  fw-bold'>Total Cost</p>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>{currencyFormatter.format(formattedTotalExpenseAmount, { code: 'INR' })}/-</div>
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
												<div className='w-100'>
													<div className='pe-3 flex-grow-1'>
														<p className='fs-5 m-0 text-gray-800  fw-bold'>Due Cost</p>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>{currencyFormatter.format(formattedTotalDueAmount, { code: 'INR' })}/-</div>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className='col-md-8'>
										<FWGMasterChart chartValue={fwgInvoiceData} />
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				<div className='col-md-4'>
					<MasterListsWidget5
						fromDate={formData.from_date}
						week1={totalWeekData.week1}
						week2={totalWeekData.week2}
						week3={totalWeekData.week3}
						week4={totalWeekData.week4}
						className='card-cl-stretch'
					/>
				</div>
			</div>
		</>
	)
}

export { MasterFGGroup }
