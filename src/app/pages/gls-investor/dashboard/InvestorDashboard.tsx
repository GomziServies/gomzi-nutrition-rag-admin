import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CurrencyFormatter from '../../../components/CurrencyFormatter'
import { GetExpenseInsights, GetInvoiceInsights, GetOrdersInsights } from '../../../Functions/FGGroup'
import { NutritionTotalProductOrder } from '../../gomzi-nutrition/dashboard/NutritionTotalProductOrder'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const InvestorDashboard = () => {
	const [totalAmountData, setTotalAmountData] = useState<any>({
		nutrition: '',
	})
	const [dataInsight, setDataInsight] = useState<any>({})
	const [adminType, setAdminType] = useState<any>(false) // forcing it false so it shows nutrition block
	const [loading, setLoading] = useState(false)
	const [ExpenseInsightData, setExpenseInsightData] = useState<any>({})

	const minDate = new Date('2024-06-05T00:00:00Z')

	const fetchOrderData = async () => {
		let startOfMonth = DayJS().startOf('month').toDate()
		const endOfMonth = DayJS().endOf('month').toDate()

		if (startOfMonth < minDate) {
			startOfMonth = minDate
		}

		try {
			const response: any = await GetOrdersInsights({
				item_type: ['FG_MEAL_PRODUCT'],
				currency: 'INR',
				purchase_mode: ['ONLINE', 'Cash On Delivery'],
				gateway: 'RAZORPAY',
				order_status: 'SUCCESS',
				from_date: startOfMonth,
				to_date: endOfMonth,
			})

			const filteredData = response.data.filter((item: any) => item.item_type === 'FG_MEAL_PRODUCT')

			const fgMealProductTotal = filteredData.reduce(
				(acc: any, item: any) => acc + item.total_amount,
				0
			)
			const fgMealProductOrderCount = filteredData.reduce(
				(acc: any, item: any) => acc + item.order_count,
				0
			)

			// Set the total amounts and order counts for each category
			setTotalAmountData({
				fgMealProduct: fgMealProductTotal,
				fgMealProductOrderCount: fgMealProductOrderCount,
				rawData: filteredData,
			})
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const fetchInvoiceInsightData = async () => {
		setLoading(true)
		try {
			// Fetching 'Gomzi Nutrition' specifically to match the admin dashboard visually
			const category: any = 'Gomzi Nutrition'
			const response: any = await GetInvoiceInsights({
				invoice_category: category,
				from_date: minDate,
			})
			setDataInsight(response.data[0])

			const expenseResponse: any = await GetExpenseInsights({
				expense_company: category,
			})
			let filteredData = expenseResponse.data

			setExpenseInsightData(filteredData[0])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		setTimeout(() => {
			fetchInvoiceInsightData()
			fetchOrderData()
		}, 500)
	}, [])
	return (
		<>
			<PageTitle breadcrumbs={[]}>Investor Dashboard</PageTitle>
			<>
				<div className='row g-5 g-12'>
					<>
						<div className='col-md-4'>
							<NutritionTotalProductOrder
								dashboardData={totalAmountData.fgMealProductOrderCount}
								className='mb-xl-8'
								color='success'
								Amount={totalAmountData.fgMealProduct}
							/>
						</div>
						<div className='col-md-8'>{productOrder(dataInsight, ExpenseInsightData)}</div>
					</>
				</div>
			</>
		</>
	)
}

export { InvestorDashboard }

function productOrder(dataInsight: any, ExpenseInsightData: any) {
	return (
		<>
			<div className='row'>
				<div className='col-md-6'>
					<div className={`card p-0`}>
						<div
							style={{ padding: '0!important' }}
							className='p-0'>
							<div className={`px-9 pt-7 card-rounded h-200px w-100 bg-primary`}>
								<div className='d-flex text-center flex-column text-white pt-8'>
									<span className='fw-semibold fs-3'>Invoice</span>
								</div>
							</div>
							<div
								className='shadow-xs card-rounded mx-7 mb-9 px-6 pb-5 pt-14 position-relative z-index-1 bg-body'
								style={{ marginTop: '-100px' }}>
								<div className='d-flex align-items-center mb-6'>
									<div className='symbol symbol-35px w-30px me-4'>
										<span className='symbol-label bg-lighten'>
											<KTIcon
												iconName='dollar'
												className='fs-1'
											/>
										</span>
									</div>
									<div className='d-flex align-items-center flex-wrap w-100'>
										<div className='mb-1 pe-3 flex-grow-1'>
											<span className='fs-6 text-gray-800  fw-bold'>
												Paid Amount
											</span>
										</div>
										<div className='d-flex align-items-center'>
											<div className='fw-bold fs-5 text-gray-800 pe-1'>
												<CurrencyFormatter
													amount={parseInt(
														dataInsight?.total_paid_amount ? dataInsight?.total_paid_amount : 0
													)}
												/>
											</div>
										</div>
									</div>
								</div>
								<div className='d-flex align-items-center mb-6'>
									<div className='symbol symbol-35px w-30px me-4'>
										<span className='symbol-label bg-lighten'>
											<KTIcon
												iconName='dollar'
												className='fs-1'
											/>
										</span>
									</div>
									<div className='d-flex align-items-center flex-wrap w-100'>
										<div className='mb-1 pe-3 flex-grow-1'>
											<span className='fs-6 text-gray-800  fw-bold'>
												Due Amount
											</span>
										</div>
										<div className='d-flex align-items-center'>
											<div className='fw-bold fs-5 text-gray-800 pe-1'>
												<CurrencyFormatter
													amount={parseInt(
														dataInsight?.total_unpaid_amount ? dataInsight?.total_unpaid_amount : 0
													)}
												/>
											</div>
										</div>
									</div>
								</div>
								<div className='d-flex align-items-center mb-6'>
									<div className='symbol symbol-35px w-30px me-4'>
										<span className='symbol-label bg-lighten'>
											<KTIcon
												iconName='dollar'
												className='fs-1'
											/>
										</span>
									</div>
									<div className='d-flex align-items-center flex-wrap w-100'>
										<div className='mb-1 pe-3 flex-grow-1'>
											<span className='fs-6 text-gray-800  fw-bold'>
												Total Amount
											</span>
										</div>
										<div className='d-flex align-items-center'>
											<div className='fw-bold fs-5 text-gray-800 pe-1'>
												<CurrencyFormatter
													amount={parseInt(
														dataInsight?.total_amount ? dataInsight?.total_amount : 0
													)}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='col-md-6'>
					<div className={`card p-0`}>
						<div
							style={{ padding: '0!important' }}
							className='p-0'>
							<div className={`px-9 pt-7 card-rounded h-225px w-100 bg-info`}>
								<div className='d-flex text-center flex-column text-white pt-8'>
									<span className='fw-semibold fs-3'>Expense</span>
								</div>
							</div>
							<div
								className='shadow-xs card-rounded mx-9 mb-11 px-6 pb-7 pt-17 position-relative z-index-1 bg-body'
								style={{ marginTop: '-100px' }}>
								<div className='d-flex align-items-center mb-6'>
									<div className='symbol symbol-35px w-30px me-4'>
										<span className='symbol-label bg-lighten'>
											<KTIcon
												iconName='dollar'
												className='fs-1'
											/>
										</span>
									</div>
									<div className='d-flex align-items-center flex-wrap w-100'>
										<div className='mb-1 pe-3 flex-grow-1'>
											<span className='fs-6 text-gray-800  fw-bold'>
												Total Amount
											</span>
										</div>
										<div className='d-flex align-items-center'>
											<div className='fw-bold fs-5 text-gray-800 pe-1'>
												<CurrencyFormatter
													amount={parseInt(
														ExpenseInsightData?.total_amount ? ExpenseInsightData?.total_amount : 0
													)}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
