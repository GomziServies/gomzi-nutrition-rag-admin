import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetGeneralDashboard, GetOrdersInsights } from '../../../Functions/FGGroup'
import { ListsWidget1 } from './ListsWidget1'
import { ListsWidget4 } from './ListsWidget4'
import { ListsWidget5 } from './ListsWidget5'
import { ListsWidget6 } from './ListsWidget6'
import { TotalFitnessOrder } from './TotalFitnessOrder'
import { TotalOrder } from './TotalOrder'
import { TotalProductOrder } from './TotalProductOrder'
import DateFilter from '../../../components/DateRangePicker'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const DashboardWrapper = () => {
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [formData, setFormData] = useState<any>({
		from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
		to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
	})
	const [totalData, setTotalData] = useState<any>({
		booksAndEbooks: {
			total: '',
			ebooksCount: '',
			booksCount: '',
		},
		fgMealProduct: {
			total: '',
			count: '',
		},
		fitnessCourse: {
			total: '',
			count: '',
		},
	})
	const [dashboardData, setDashboardData] = useState<any>([])
	const fetchUserData = async () => {
		try {
			const response = await GetGeneralDashboard()
			const DashboardResponse: any = response.data
			setDashboardData(DashboardResponse)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const fetchOrderData = async () => {

		let startDate: Date
		let endDate: Date

		if (selectedDateRange) {
			;[startDate, endDate] = selectedDateRange
		} else {
			startDate = new Date(0)
			endDate = new Date()
		}
		try {
			const response: any = await GetOrdersInsights({
				item_type: ['BOOKS', 'FG_MEAL_PRODUCT', 'FITNESS_COURSE', 'EBOOKS'],
				order_status: ['SUCCESS'],
				currency: 'INR',
				purchase_mode: ['ONLINE', 'Cash On Delivery'],
				gateway: ['RAZORPAY', 'RAZORPAY_FGIIT', 'RAZORPAY_FGMEALS'],
				from_date: startDate,
				to_date: endDate,
			})

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

			const fgMealProduct = response.data.filter(
				(item: any) => item.item_type === 'FG_MEAL_PRODUCT'
			)
			const fgMealProductTotal = fgMealProduct.reduce(
				(acc: any, item: any) => acc + item.total_amount,
				0
			)
			const fgMealProductCount = fgMealProduct.reduce(
				(acc: any, item: any) => acc + item.order_count,
				0
			)

			const fitnessCourse = response.data.filter((item: any) => item.item_type === 'FITNESS_COURSE')
			const fitnessCourseTotal = fitnessCourse.reduce(
				(acc: any, item: any) => acc + item.total_amount,
				0
			)
			const fitnessCourseCount = fitnessCourse.reduce(
				(acc: any, item: any) => acc + item.order_count,
				0
			)

			// Set the total amounts and order counts for each category
			setTotalData({
				booksAndEbooks: {
					total: booksAndEbooksTotal,
					booksCount: booksCount,
					ebooksCount: ebooksCount,
				},
				fgMealProduct: {
					total: fgMealProductTotal,
					count: fgMealProductCount,
				},
				fitnessCourse: {
					total: fitnessCourseTotal,
					count: fitnessCourseCount,
				},
			})
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
		fetchOrderData()
	}, [formData.from_date, formData.to_date, selectedDateRange])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setFormData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}
	return (
		<>
			<PageTitle breadcrumbs={[]}>Dashboard</PageTitle>
			<>
				<div className='row g-5 g-xl-8'>
					{/* FG Group */}
					<div className='col-xl-4'>
						<ListsWidget1
							dashboardData={dashboardData}
							className='card-xl-stretch mb-xl-8'
						/>
					</div>
					{/* end::FG Group */}
					{/* FGIIT */}
					<div className='col-xl-4'>
						<ListsWidget5
							className='card-xl-stretch mb-xl-8'
							dashboardData={dashboardData}
						/>
					</div>
					{/* end::FGIIT */}
					{/* Applications & Forms */}
					<div className='col-xl-4'>
						<ListsWidget6 className='card-xl-stretch mb-xl-8' />
					</div>
					{/* end::Applications & Forms */}
					{/* Inquiry Pages, FG Digital, FG Meals */}
					{/* <div className='col-xl-4'>
						<ListsWidget3 className='card-xl-stretch mb-xl-8' />
					</div> */}
					{/* end::Inquiry Pages, FG Digital, FG Meals */}
				</div>

				<div className='row g-5 g-xl-8'>
					{/* Product Specific Order */}
					{/* <div className='col-xl-4'>
						<ListsWidget2
							dashboardData={dashboardData}
							className='card-xl-stretch mb-xl-8'
						/>
					</div> */}
					{/* end::Product Specific Order */}
					<div className='col-md-12'>
						<div className='card p-5'>
							<div className='row mb-5 justify-content-between'>
								<div className='col-md-5'>
									<h2 className='mb-5'>Order Details</h2>
								</div>
								<div className='col-md-5 mt-md-0 mt-2'>
									<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
								</div>
							</div>
							<div className='row'>
								<div className='col-xl-4'>
									<TotalOrder
										dashboardData={totalData?.booksAndEbooks}
										className='mb-xl-8'
										color='primary'
										Amount={totalData?.booksAndEbooks?.total ? totalData?.booksAndEbooks?.total : 0}
									/>
								</div>
								<div className='col-xl-4'>
									<TotalProductOrder
										dashboardData={totalData?.fgMealProduct?.count}
										className='mb-xl-8'
										color='success'
										Amount={totalData?.fgMealProduct?.total ? totalData?.fgMealProduct?.total : 0}
									/>
								</div>
								<div className='col-xl-4'>
									<TotalFitnessOrder
										dashboardData={totalData?.fitnessCourse?.count}
										className='mb-xl-8'
										color='info'
										Amount={totalData?.fitnessCourse?.total ? totalData?.fitnessCourse?.total : 0}
									/>
								</div>
							</div>
						</div>
					</div>
					{/* FWG */}
					<div className='col-xl-4'>
						<ListsWidget4
							className='card-xl-stretch mb-xl-8'
							dashboardData={dashboardData}
						/>
					</div>
					{/* end::FWG */}
				</div>
			</>
		</>
	)
}

export { DashboardWrapper }
