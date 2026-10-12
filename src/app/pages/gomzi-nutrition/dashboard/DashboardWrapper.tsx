import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { KTIcon } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import CurrencyFormatter from '../../../components/CurrencyFormatter'
import DateFilter from '../../../components/DateRangePicker'
import {
	GetExpenseInsights,
	GetInvoiceInsights,
	GetOrdersInsights,
} from '../../../Functions/FGGroup'
import { NutritionTotalProductOrder } from './NutritionTotalProductOrder'

const GomziNutritionDashboard = () => {
	const [totalAmountData, setTotalAmountData] = useState<any>({
		nutrition: '',
	})
	const [dataInsight, setDataInsight] = useState<any>({})
	const [adminType, setAdminType] = useState<any>(true)
	const [loading, setLoading] = useState(false)
	const [ExpenseInsightData, setExpenseInsightData] = useState<any>({})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const fetchOrderData = async () => {
		try {
			const startDate = selectedDateRange
				? DayJS(selectedDateRange[0]).format('YYYY-MM-DD')
				: DayJS().startOf('month').format('YYYY-MM-DD')

			const endDate = selectedDateRange
				? DayJS(selectedDateRange[1]).format('YYYY-MM-DD')
				: DayJS().endOf('month').format('YYYY-MM-DD')

			const response: any = await GetOrdersInsights({
				item_type: ['FG_MEAL_PRODUCT'],
				currency: 'INR',
				purchase_mode: ['ONLINE', 'Cash On Delivery'],
				gateway: 'RAZORPAY',
				order_status: 'SUCCESS',
				from_date: startDate,
				to_date: endDate,
			})

			const filteredData = response.data.filter((item: any) => item.item_type === 'FG_MEAL_PRODUCT')

			const fgMealProductTotal = filteredData.reduce(
				(acc: number, item: any) => acc + item.total_amount,
				0
			)

			const fgMealProductOrderCount = filteredData.reduce(
				(acc: number, item: any) => acc + item.order_count,
				0
			)

			setTotalAmountData({
				fgMealProduct: fgMealProductTotal,
				fgMealProductOrderCount,
				rawData: filteredData,
			})
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const fetchInvoiceInsightData = async () => {
		const admin: any = localStorage.getItem('admin')

		setAdminType(admin === 'Store')
		setLoading(true)

		try {
			const category: any = admin === 'Store' ? admin : 'Gomzi Nutrition'

			const startDate = selectedDateRange
				? DayJS(selectedDateRange[0]).format('YYYY-MM-DD')
				: DayJS().startOf('month').format('YYYY-MM-DD')

			const endDate = selectedDateRange
				? DayJS(selectedDateRange[1]).format('YYYY-MM-DD')
				: DayJS().endOf('month').format('YYYY-MM-DD')

			const response: any = await GetInvoiceInsights({
				invoice_category: category,
				from_date: startDate,
				to_date: endDate,
			})

			setDataInsight(response.data[0])

			const expenseResponse: any = await GetExpenseInsights({
				expense_company: category,
				from_date: startDate,
				to_date: endDate,
			})

			setExpenseInsightData(expenseResponse.data[0])
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchInvoiceInsightData()
			fetchOrderData()
		}, 300)

		return () => clearTimeout(timer)
	}, [selectedDateRange])
	return (
		<>
			<PageTitle breadcrumbs={[]}>Dashboard</PageTitle>
			<div className='d-flex justify-content-end mb-5'>
				<DateFilter
					onDateRangeChange={(range) => {
						setSelectedDateRange(range)
					}}
					rightValue='0'
				/>
			</div>
			<>
				<div className='row g-5 g-12'>
					{adminType ? (
						<>
							<div className='col-md-6'>{productOrder(dataInsight, ExpenseInsightData)}</div>
						</>
					) : (
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
					)}
				</div>
			</>
		</>
	)
}

export { GomziNutritionDashboard }

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
											<span className='fs-6 text-gray-800  fw-bold'>Paid Amount</span>
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
											<span className='fs-6 text-gray-800  fw-bold'>Due Amount</span>
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
											<span className='fs-6 text-gray-800  fw-bold'>Total Amount</span>
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
											<span className='fs-6 text-gray-800  fw-bold'>Total Amount</span>
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
