import {
	faBook,
	faFileInvoiceDollar,
	faFileSignature,
	faFileVideo,
	faHandHoldingDollar,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { SocialMedia } from '../../../../_metronic/partials/widgets/mixed/SocialMedia'
import WebsiteSeo from '../../../../_metronic/partials/widgets/mixed/WebsiteSeo'
import { LeadTable } from '../../../../_metronic/partials/widgets/tables/LeadTable'
import DateFilter from '../../../components/DateRangePicker'
import SelectField from '../../../components/SelectField'
import { GetInvoiceInsights, GetOrdersInsights } from '../../../Functions/FGGroup'
import { GetExpenses, GetInvoice } from '../../../Functions/FWG'
import { HRDashboardPage } from '../../hr/dashboard/dashboard-hr'
import { FWGMasterChart } from './FWGMasterChart'
import { MasterChart } from './MasterChart'
import { MasterListsWidget5 } from './MasterListsWidget5'
import { MAsterOperation } from './MasterOperation'
import { NutritionMasterChart } from './NutritionMasterChart'
var currencyFormatter = require('currency-formatter')

const DashboardPage = () => {
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
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	let startDate: any
	let endDate: any
	if (selectedDateRange) {
		;[startDate, endDate] = selectedDateRange
	}
	const fetchData = async (brand_name?: string) => {
		try {
			if (brand_name === 'Gomzi Nutrition') {
				const response = await GetInvoiceInsights({
					invoice_category: 'Gomzi Nutrition',
					...(startDate ? { from_date: startDate } : null),
					...(endDate ? { to_date: endDate } : null),
					// from_date: startDate,
					// to_date: endDate,
				})
				setTotalIncomeData(response.data[0])
			} else {
				const response = await GetOrdersInsights({
					item_type: [
						'FG_MEAL_PRODUCT',
						'PT_PLAN',
						'FITNESS_COURSE',
						'DIGITAL_PLAN',
						'BOOKS',
						'EBOOKS',
					],
					currency: 'INR',
					purchase_mode: ['ONLINE', 'Cash On Delivery'],
					order_status: 'SUCCESS',
					...(startDate ? { from_date: startDate } : null),
					...(endDate ? { to_date: endDate } : null),
				})
				const invoiceResponse = await GetInvoiceInsights({
					invoice_category: 'FG Group',
					...(startDate ? { from_date: startDate } : null),
					...(endDate ? { to_date: endDate } : null),
				})
				const invoiceData = invoiceResponse.data[0]
				const total_paid_amount = invoiceData.total_paid_amount
				const total_unpaid_amount = invoiceData.total_unpaid_amount

				const ids = [
					'BOOKS#SUCCESS#INR#ONLINE#RAZORPAY_FGIIT',
					'FITNESS_COURSE#SUCCESS#INR#ONLINE#RAZORPAY',
					'PT_PLAN#SUCCESS#INR#ONLINE#RAZORPAY',
					'FITNESS_COURSE#SUCCESS#INR#MANUAL',
					'FG_MEAL_PRODUCT#SUCCESS#INR#ONLINE#RAZORPAY',
				]

				const data = ids
					.map((id) => response.data.find((el: any) => el._id === id))
					.filter((el) => el !== undefined)

				const booksAndEbooks = response.data.filter(
					(item: any) => item.item_type === 'BOOKS' || item.item_type === 'EBOOKS'
				)
				const booksAndEbooksTotal = booksAndEbooks.reduce(
					(acc: any, item: any) => acc + item.total_amount,
					0
				)

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
					invoice: {
						total_unpaid_amount: total_unpaid_amount,
						total_paid_amount: total_paid_amount,
					},
					totalAmount:
						booksAndEbooksTotal +
						flexibleProductTotal +
						fitnessCourseTotal +
						offlineTotal +
						productTotal,
				})
			}
		} catch (error) {
			console.error(error)
		}
	}

	const fetchWeekAmountData = async (brand_name?: string) => {
		try {
			const weeksData = []
			let startOfMonth = new Date(startDate)
			let endOfMonth = new Date(startOfMonth)

			for (let i = 0; i <= 4; i++) {
				endOfMonth.setDate(startOfMonth.getDate() + 7)

				if (brand_name === 'Gomzi Nutrition') {
					const response = await GetInvoiceInsights({
						invoice_category: 'Gomzi Nutrition',
						// from_date: startOfMonth,
						// to_date: endOfMonth,
						...(startOfMonth ? { from_date: startOfMonth } : null),
						...(endOfMonth ? { to_date: endOfMonth } : null),
					})
					startOfMonth = new Date(endOfMonth)
				} else {
					const response = await GetOrdersInsights({
						item_type: [
							'FG_MEAL_PRODUCT',
							'PT_PLAN',
							'FITNESS_COURSE',
							'DIGITAL_PLAN',
							'BOOKS',
							'EBOOKS',
						],
						currency: 'INR',
						purchase_mode: ['ONLINE', 'MANUAL'],
						order_status: 'SUCCESS',
						...(startOfMonth ? { from_date: startOfMonth } : null),
						...(endOfMonth ? { to_date: endOfMonth } : null),
					})

					const ids = [
						'BOOKS#SUCCESS#INR#ONLINE#RAZORPAY_FGIIT',
						'FITNESS_COURSE#SUCCESS#INR#ONLINE#RAZORPAY',
						'PT_PLAN#SUCCESS#INR#ONLINE#RAZORPAY',
						'FITNESS_COURSE#SUCCESS#INR#MANUAL',
						'FG_MEAL_PRODUCT#SUCCESS#INR#ONLINE#RAZORPAY',
					]

					const data = ids
						.map((id) => response.data.find((el: any) => el._id === id))
						.filter((el) => el !== undefined)

					const totalAmount = data.reduce((acc, item) => acc + item.total_amount, 0)

					weeksData.push(totalAmount)

					startOfMonth = new Date(endOfMonth)
				}

				if (endOfMonth > endDate) {
					break
				}
			}

			setTotalWeekData({
				week1: weeksData[0] || 0,
				week2: weeksData[1] || 0,
				week3: weeksData[2] || 0,
				week4: weeksData[3] || 0,
			})
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData(selectedBranch)
		fetchWeekAmountData(selectedBranch)
	}, [selectedBranch, selectedDateRange])

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setSelectedBranch(event.target.value)
	}

	const [invoiceData, setInvoiceData] = useState<any>([])

	const fetchFWGData = async (brand_name?: string) => {
		try {
			let response: any

			if (brand_name === 'FWG-Vesu') {
				response = await GetInvoice()
			} else if (brand_name === 'FWG-Adajan') {
				response = await GetInvoice({
					createdById: '66a49d83cc78d7c499945d34',
				})
			} else if (brand_name === 'FWG-Baroda') {
				response = await GetInvoice({
					createdById: '66a49e08cc78d7c499945d73',
				})
			} else {
				response = await GetInvoice()
			}

			setInvoiceData(response.data)

			const matchingProducts = response.data.filter((el: any) =>
				['RTP-1.0', 'RTP-2.0', 'RTP-3.0', 'RTP-4.0', 'RTP-5.0'].some((substring) =>
					el.productName.includes(substring)
				)
			)

			const paymentSummary = matchingProducts.reduce((acc: any, el: any) => {
				const productKey = ['RTP-1.0', 'RTP-2.0', 'RTP-3.0', 'RTP-4.0', 'RTP-5.0'].find(
					(substring) => el.productName.includes(substring)
				)
				if (productKey) {
					if (!acc[productKey]) {
						acc[productKey] = 0
					}
					acc[productKey] += el.totalPayment
				}
				return acc
			}, {})

			if (Object.keys(paymentSummary).length > 0) {
				const invoiceData = {
					RTP1: paymentSummary['RTP-1.0'] || 0,
					RTP2: paymentSummary['RTP-2.0'] || 0,
					RTP3: paymentSummary['RTP-3.0'] || 0,
					RTP4: paymentSummary['RTP-4.0'] || 0,
					RTP5: paymentSummary['RTP-5.0'] || 0,
				}
				setFwgInvoiceData(invoiceData)
			} else {
				setFwgInvoiceData({})
			}
		} catch (error: any) {
			console.error('Error fetching FWG data:', error)
		}
	}

	const [expenseData, setExpenseData] = useState<any>([])

	const fetchExpenseData = async (brand_name?: string) => {
		try {
			let response: any
			if (brand_name === 'FWG-Vesu') {
				response = await GetExpenses({
					createdById: '602294b161bc8842e44328be',
				})
			} else if (brand_name === 'FWG-Adajan') {
				response = await GetExpenses({
					createdById: '623705ee33824c76dc5aba35',
				})
			} else if (brand_name === 'FWG-Baroda') {
				response = await GetExpenses({
					createdById: '669f7bd21ebfdd2592a5ff89',
				})
			} else {
				response = await GetExpenses()
			}
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
	const formattedTotalAmount: any = totalAmount.toLocaleString()
	const formattedTotalDueAmount: any = totalDueAmount.toLocaleString()
	const formattedTotalExpenseAmount: any = totalExpenseAmount.toLocaleString()

	useEffect(() => {
		if (selectedBranch == 'FWG Master') {
			fetchFWGData()
			fetchExpenseData()
		} else if (selectedBranch == 'FWG-Vesu') {
			fetchFWGData('FWG-Vesu')
			fetchExpenseData('FWG-Vesu')
		} else if (selectedBranch == 'FWG-Adajan') {
			fetchFWGData('FWG-Adajan')
			fetchExpenseData('FWG-Adajan')
		} else if (selectedBranch == 'FWG-Baroda') {
			fetchFWGData('FWG-Baroda')
			fetchExpenseData('FWG-Baroda')
		} else if (selectedBranch == 'Gomzi Nutrition') {
			fetchData('Gomzi Nutrition')
			fetchWeekAmountData('Gomzi Nutrition')
		} else {
			fetchData()
			fetchWeekAmountData()
		}
	}, [selectedBranch])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		fetchWeekAmountData()
	}

	return (
		<>
			<div className='row g-5 g-xl-5'>
				<div className='col-md-8'>
					<div className={`card`}>
						<div className='card-body p-0'>
							<div className='row justify-content-between'>
								<div className='col-md-4 d-flex align-items-start'>
									<h2 className='m-0 fw-bold my-5 fs-1'>Sales</h2>
								</div>
								{selectedBranch != 'FWG Master' &&
								selectedBranch != 'FWG-Vesu' &&
								selectedBranch != 'FWG-Adajan' &&
								selectedBranch != 'FWG-Baroda' ? (
									<div className='col-md-5'>
										<div className='row'>
											<span className='fw-bold fs-5 mb-4'>Date Filter</span>
											<DateFilter
												leftValue='0px'
												onDateRangeChange={handleDateRangeChange}
											/>
										</div>
									</div>
								) : (
									''
								)}
								<div className='col-3'>
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
											'FWG Master',
											'FWG-Vesu',
											'FWG-Adajan',
											'FWG-Baroda',
											'Gomzi Nutrition',
										]}
									/>
								</div>
							</div>
							{selectedBranch == 'FGIIT' && (
								<div className='row mt-4'>
									<div className='col-md-4'>
										<div className={`px-1 card-rounded h-250px w-100`}>
											<div className='d-flex flex-column pt-5'>
												<span className='fw-semibold fs-7'>Total Income</span>
												<span className='fw-bold fs-1 pt-1'>
													{currencyFormatter.format(totalIncomeData.totalAmount, { code: 'INR' })}
												</span>
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
														<Link
															to={'/fgiit/book-order'}
															style={{ cursor: 'pointer' }}
															target='_blank'>
															<p className='fs-5 m-0 text-gray-800  fw-bold'>
																Book and EBook
															</p>
														</Link>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>
															{currencyFormatter.format(totalIncomeData.booksAndEbooks, {
																code: 'INR',
															})}
															/-
														</div>
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
														<Link
															to={'/fgiit/fitness-course-order'}
															style={{ cursor: 'pointer' }}
															target='_blank'>
															<p className='fs-5 m-0 text-gray-800  fw-bold'>
																Course
															</p>
														</Link>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>
															{currencyFormatter.format(totalIncomeData.fitnessCourse, {
																code: 'INR',
															})}
															/-
														</div>
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
														<Link
															to={'/fgiit/fitness-course-order'}
															style={{ cursor: 'pointer' }}
															target='_blank'>
															<p className='fs-5 m-0 text-gray-800  fw-bold'>
																Flexible
															</p>
														</Link>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>
															{currencyFormatter.format(totalIncomeData.flexibleProduct, {
																code: 'INR',
															})}
															/-
														</div>
													</div>
												</div>
											</div>
											<div>
												<p>Invoice Data</p>
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
														<Link
															to={'/fgiit/invoice/list?filter=Due Amount'}
															style={{ cursor: 'pointer' }}
															target='_blank'>
															<p className='fs-5 m-0 text-gray-800  fw-bold'>
																Due Amount
															</p>
														</Link>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>
															{currencyFormatter.format(
																totalIncomeData?.invoice?.total_unpaid_amount || 0,
																{
																	code: 'INR',
																}
															)}
															/-
														</div>
													</div>
												</div>
											</div>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px w-40px me-5'>
													<span className='symbol-label bg-lighten'>
														<FontAwesomeIcon
															icon={faFileInvoiceDollar}
															className='fs-1'
														/>
													</span>
												</div>
												<div className='w-100'>
													<div className='pe-3 flex-grow-1'>
														<Link
															to={'/fgiit/invoice/list?filter=Paid Amount'}
															style={{ cursor: 'pointer' }}
															target='_blank'>
															<p className='fs-5 m-0 text-gray-800  fw-bold'>
																Paid Amount
															</p>
														</Link>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>
															{currencyFormatter.format(
																totalIncomeData?.invoice?.total_paid_amount || 0,
																{
																	code: 'INR',
																}
															)}
															/-
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className='col-md-8'>
										<MasterChart chartValue={totalIncomeData} />
									</div>
								</div>
							)}
							{selectedBranch == 'FWG Master' && (
								<div className='row mt-4'>
									<div className='col-md-4'>
										<div className={`px-1 card-rounded h-250px w-100`}>
											<div className='d-flex flex-column pt-5'>
												<span className='fw-semibold fs-7'>Total Income</span>
												<span className='fw-bold fs-1 pt-1'>
													{currencyFormatter.format(formattedTotalAmount, { code: 'INR' })}
												</span>
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
														<p className='fs-5 m-0 text-gray-800  fw-bold'>
															Total Cost
														</p>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>
															{currencyFormatter.format(formattedTotalExpenseAmount, {
																code: 'INR',
															})}
															/-
														</div>
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
														<p className='fs-5 m-0 text-gray-800  fw-bold'>
															Due Cost
														</p>
													</div>
													<div className='d-flex align-items-center'>
														<div className='fw-bold fs-5 text-gray-800 pe-1'>
															{currencyFormatter.format(formattedTotalDueAmount, { code: 'INR' })}/-
														</div>
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
							{selectedBranch == 'FWG-Vesu' && (
								<div className='row mt-4'>
									{formattedTotalAmount === '0' ||
									formattedTotalExpenseAmount === '0' ||
									formattedTotalDueAmount === '0' ? (
										<div className='col-md-12'>
											<div className='text-center mb-20 pb-5'>
												<img
													src='/media/auth/fixed-404.jpg'
													alt=''
													className='img-fluid w-50'
												/>
											</div>
										</div>
									) : (
										<>
											<div className='col-md-4'>
												<div className={`px-1 card-rounded h-250px w-100`}>
													<div className='d-flex flex-column pt-5'>
														<span className='fw-semibold fs-7'>Total Income</span>
														<span className='fw-bold fs-1 pt-1'>
															{currencyFormatter.format(formattedTotalAmount, { code: 'INR' })}
														</span>
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
																<p className='fs-5 m-0 text-gray-800  fw-bold'>
																	Total Cost
																</p>
															</div>
															<div className='d-flex align-items-center'>
																<div className='fw-bold fs-5 text-gray-800 pe-1'>
																	{currencyFormatter.format(formattedTotalExpenseAmount, {
																		code: 'INR',
																	})}
																	/-
																</div>
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
																<p className='fs-5 m-0 text-gray-800  fw-bold'>
																	Due Cost
																</p>
															</div>
															<div className='d-flex align-items-center'>
																<div className='fw-bold fs-5 text-gray-800 pe-1'>
																	{currencyFormatter.format(formattedTotalDueAmount, {
																		code: 'INR',
																	})}
																	/-
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div className='col-md-8'>
												<FWGMasterChart chartValue={fwgInvoiceData} />
											</div>
										</>
									)}
								</div>
							)}
							{selectedBranch == 'FWG-Adajan' && (
								<div className='row mt-4'>
									{formattedTotalAmount === '0' ||
									formattedTotalExpenseAmount === '0' ||
									formattedTotalDueAmount === '0' ? (
										<div className='col-md-12'>
											<div className='text-center mb-20 pb-5'>
												<img
													src='/media/auth/fixed-404.jpg'
													alt=''
													className='img-fluid w-50'
												/>
											</div>
										</div>
									) : (
										<>
											<div className='col-md-4'>
												<div className={`px-1 card-rounded h-250px w-100`}>
													<div className='d-flex flex-column pt-5'>
														<span className='fw-semibold fs-7'>Total Income</span>
														<span className='fw-bold fs-1 pt-1'>
															{currencyFormatter.format(formattedTotalAmount, { code: 'INR' })}
														</span>
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
																<p className='fs-5 m-0 text-gray-800  fw-bold'>
																	Total Cost
																</p>
															</div>
															<div className='d-flex align-items-center'>
																<div className='fw-bold fs-5 text-gray-800 pe-1'>
																	{currencyFormatter.format(formattedTotalExpenseAmount, {
																		code: 'INR',
																	})}
																	/-
																</div>
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
																<p className='fs-5 m-0 text-gray-800  fw-bold'>
																	Due Cost
																</p>
															</div>
															<div className='d-flex align-items-center'>
																<div className='fw-bold fs-5 text-gray-800 pe-1'>
																	{currencyFormatter.format(formattedTotalDueAmount, {
																		code: 'INR',
																	})}
																	/-
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div className='col-md-8'>
												<FWGMasterChart chartValue={fwgInvoiceData} />
											</div>
										</>
									)}
								</div>
							)}
							{selectedBranch == 'FWG-Baroda' && (
								<div className='row mt-4'>
									{formattedTotalAmount === '0' ||
									formattedTotalExpenseAmount === '0' ||
									formattedTotalDueAmount === '0' ? (
										<div className='col-md-12'>
											<div className='text-center mb-20 pb-5'>
												<img
													src='/media/auth/fixed-404.jpg'
													alt=''
													className='img-fluid w-50'
												/>
											</div>
										</div>
									) : (
										<>
											<div className='col-md-4'>
												<div className={`px-1 card-rounded h-250px w-100`}>
													<div className='d-flex flex-column pt-5'>
														<span className='fw-semibold fs-7'>Total Income</span>
														<span className='fw-bold fs-1 pt-1'>
															{currencyFormatter.format(formattedTotalAmount, { code: 'INR' })}
														</span>
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
																<p className='fs-5 m-0 text-gray-800  fw-bold'>
																	Total Cost
																</p>
															</div>
															<div className='d-flex align-items-center'>
																<div className='fw-bold fs-5 text-gray-800 pe-1'>
																	{currencyFormatter.format(formattedTotalExpenseAmount, {
																		code: 'INR',
																	})}
																	/-
																</div>
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
																<p className='fs-5 m-0 text-gray-800  fw-bold'>
																	Due Cost
																</p>
															</div>
															<div className='d-flex align-items-center'>
																<div className='fw-bold fs-5 text-gray-800 pe-1'>
																	{currencyFormatter.format(formattedTotalDueAmount, {
																		code: 'INR',
																	})}
																	/-
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div className='col-md-8'>
												<FWGMasterChart chartValue={fwgInvoiceData} />
											</div>
										</>
									)}
								</div>
							)}
							{selectedBranch == 'Gomzi Nutrition' && (
								<div className='row mt-4'>
									<div className='col-md-4'>
										<span className='fw-bolder fs-2 pt-5'>Gomzi Nutrition</span>
										<div className={`px-1 card-rounded w-100`}>
											<div className='d-flex flex-column pt-5'>
												<span className='fw-semibold fs-7'>Total Amount</span>
												<span className='fw-bold fs-3 pt-1'>
													{currencyFormatter.format(totalIncomeData.total_amount, { code: 'INR' })}
												</span>
											</div>
										</div>
										<div className={`px-1 card-rounded w-100`}>
											<div className='d-flex flex-column pt-5'>
												<span className='fw-semibold fs-7'>Total Paid Amount</span>
												<span className='fw-bold fs-3 pt-1'>
													{currencyFormatter.format(totalIncomeData.total_paid_amount, {
														code: 'INR',
													})}
												</span>
											</div>
										</div>
										<div className={`px-1 card-rounded w-100`}>
											<div className='d-flex flex-column pt-5'>
												<span className='fw-semibold fs-7'>Total Due Amount</span>
												<span className='fw-bold fs-3 pt-1'>
													{currencyFormatter.format(totalIncomeData.total_unpaid_amount, {
														code: 'INR',
													})}
												</span>
											</div>
										</div>
									</div>
									<div className='col-md-8'>
										<NutritionMasterChart chartValue={totalIncomeData} />
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				<div className='col-md-4'>
					<MasterListsWidget5
						fromDate={startDate}
						week1={totalWeekData.week1}
						week2={totalWeekData.week2}
						week3={totalWeekData.week3}
						week4={totalWeekData.week4}
						className='card-cl-stretch'
					/>
				</div>
				<div className='col-md-12'>
					<HRDashboardPage />
				</div>
				<div className='col-md-12'>
					<SocialMedia />
				</div>
				<div className='col-md-12'>
					<WebsiteSeo
						className=''
						chartColor='primary'
						chartHeight='200px'
					/>
				</div>
				<div className='col-md-12'>
					<LeadTable className='' />
				</div>
				<div className='col-md-8'>
					<MAsterOperation className='' />
				</div>
			</div>
		</>
	)
}

const DashboardWrapper = () => {
	const intl = useIntl()
	return (
		<>
			<PageTitle breadcrumbs={[]}>Master Dashboard</PageTitle>
			<DashboardPage />
		</>
	)
}

export { DashboardWrapper }
