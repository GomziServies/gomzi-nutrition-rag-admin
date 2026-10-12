/* eslint-disable jsx-a11y/anchor-is-valid */
import { faChartLine, faChartSimple, faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip,
} from 'chart.js'
import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import DateFilter from '../../../../app/components/DateRangePicker'
import {
	GetGoogleSearchConsoleSites,
	RunGoogleSearchConsoleQuery,
} from '../../../../app/Functions/FGGroup'

// Register ChartJS modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

type Props = {
	className: string
	chartColor: string
	chartHeight: string
}

const WebsiteSeo: React.FC<Props> = ({ className }) => {
	const [webInsightData, setWebInsightData] = useState<any>({})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [chartData, setChartData] = useState<any>(null)

	const formatDate = (date: Date) => date.toISOString().split('T')[0]

	const getLastDayOfMonth = (year: number, month: number) => new Date(year, month + 1, 0)

	const fetchData = async () => {
		try {
			await GetGoogleSearchConsoleSites()

			if (selectedDateRange) {
				// If the admin has selected a date range
				const [startDate, endDate] = selectedDateRange
				const response: any = await fetchWebsiteInsightData(startDate, endDate)
				setWebInsightData(response)
				generateChartData(
					[response.date], // Date range labels
					[response.clicks], // Clicks data
					[response.impressions], // Impressions data
					[response.ctr] // CTR data
				)
			} else {
				// Default to the last 4 months if no date range is selected
				const today = new Date()
				const dataPromises = []

				for (let i = 3; i >= 0; i--) {
					const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
					const endDate = getLastDayOfMonth(today.getFullYear(), today.getMonth() - i)

					dataPromises.push(fetchWebsiteInsightData(startDate, endDate))
				}
				const monthlyData = await Promise.all(dataPromises)

				const aggregatedData = monthlyData.reduce(
					(acc: any, monthData: any) => {
						acc.clicks += monthData.clicks
						acc.impressions += monthData.impressions
						acc.ctr += (monthData.clicks / monthData.impressions) * 100
						acc.dates.push(monthData.date)
						acc.monthlyClicks.push(monthData.clicks)
						acc.monthlyImpressions.push(monthData.impressions)
						acc.monthlyCtr.push((monthData.clicks / monthData.impressions) * 100)
						return acc
					},
					{
						clicks: 0,
						impressions: 0,
						ctr: 0,
						dates: [],
						monthlyClicks: [],
						monthlyImpressions: [],
						monthlyCtr: [],
					}
				)

				setWebInsightData({
					clicks: aggregatedData.clicks,
					ctr: aggregatedData.ctr,
					impressions: aggregatedData.impressions,
				})

				generateChartData(
					aggregatedData.dates,
					aggregatedData.monthlyClicks,
					aggregatedData.monthlyImpressions,
					aggregatedData.monthlyCtr
				)
			}
		} catch (error) {
			console.error('Error fetching website insight data:', error)
		}
	}

	const fetchWebsiteInsightData = async (startDate: Date, endDate: Date) => {
		try {
			const response: any = await RunGoogleSearchConsoleQuery({
				siteUrl: 'https://fggroup.in/',
				requestBody: {
					startDate: formatDate(startDate),
					endDate: formatDate(endDate),
					filters: [
						{
							dimension: 'country',
							expression: 'ind',
						},
					],
				},
			})

			const monthData = {
				date: `${startDate.toLocaleString('default', {
					month: 'short',
				})} ${startDate.getFullYear()}`,
				clicks: response.data.rows.reduce((sum: number, row: any) => sum + row.clicks, 0),
				impressions: response.data.rows.reduce((sum: number, row: any) => sum + row.impressions, 0),
				ctr: response.data.rows.reduce((sum: number, row: any) => sum + row.ctr, 0),
			}

			return monthData
		} catch (error) {
			console.error('Error fetching data for the month:', error)
			return { date: '', clicks: 0, impressions: 0, ctr: 0 }
		}
	}

	const generateChartData = (
		labels: string[],
		clicks: number[],
		impressions: number[],
		ctr: number[]
	) => {
		// Format CTR to two decimal places
		const formattedCtr = ctr.map((value) => parseFloat(value.toFixed(2)))
		setChartData({
			labels,
			datasets: [
				{
					label: 'Clicks',
					data: clicks || [],
					borderColor: 'rgba(75, 192, 192, 1)',
					backgroundColor: 'rgba(75, 192, 192, 0.2)',
				},
				{
					label: 'Impressions',
					data: impressions || [],
					borderColor: 'rgba(153, 102, 255, 1)',
					backgroundColor: 'rgba(153, 102, 255, 0.2)',
				},
				{
					label: 'CTR',
					data: formattedCtr || [],
					borderColor: 'rgb(42 107 255)',
					backgroundColor: 'rgb(154 185 255)',
				},
			],
		})
	}

	useEffect(() => {
		fetchData()
	}, [selectedDateRange])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	return (
		<div className={`card ${className}`}>
			<div
				className='card-header border-0 px-3'
				style={{ minHeight: '0px' }}>
				<h3 className='card-title align-items-start flex-column'>
					<span className='card-label fw-bold fs-3 mb-1'>
						Website SEO -{' '}
						<a
							href='https://fggroup.in/'
							target='_blank'>
							fggroup.in
						</a>
					</span>
				</h3>
				<div className='mt-4 mx-2'>
					<DateFilter
						leftValue='-650px'
						onDateRangeChange={handleDateRangeChange}
					/>
				</div>
			</div>

			<div className='card-body d-flex flex-column'>
				<div className='row'>
					<div className='col-md-6'>
						{chartData && (
							<div className='mt-5'>
								<Line
									data={chartData}
									options={{
										responsive: true,
										plugins: {
											legend: {
												position: 'top',
											},
										},
										scales: {
											x: {
												type: 'category',
											},
											y: {
												beginAtZero: true,
											},
										},
									}}
								/>
							</div>
						)}
					</div>
					<div className='col-md-6'>
						{webInsightData && webInsightData.clicks && (
							<div>
								{[
									{
										icon: faEye,
										title: 'Visit',
										badge: `+${webInsightData.clicks}`,
										color: 'success',
									},
								].map((item, index) => (
									<div
										key={index}
										className='d-flex flex-stack mb-5 mt-5'>
										<div className='d-flex align-items-center me-2'>
											<div className='symbol symbol-50px me-3'>
												<div className={`symbol-label bg-light-${item.color}`}>
													<FontAwesomeIcon
														icon={item.icon}
														className={`h-50 text-${item.color}`}
													/>
												</div>
											</div>
											<div>
												<a
													href='#'
													className={`fs-4 text-gray-800 text-hover-${item.color} fw-bold`}>
													{item.title}
												</a>
											</div>
										</div>
										<div className={`badge badge-${item.color} fw-semibold py-4 px-3`}>
											{item.badge}
										</div>
									</div>
								))}
								{[
									{
										icon: faChartLine,
										title: 'Total Traffic',
										badge: `+${webInsightData.impressions}`,
										color: 'warning',
									},
									{
										icon: faChartSimple,
										title: 'CTR',
										badge: `${parseFloat(webInsightData?.ctr?.toFixed(2))}`,
										color: 'info',
									},
								].map((item, index) => (
									<div
										key={index}
										className='d-flex flex-stack mb-5'>
										<div className='d-flex align-items-center me-2'>
											<div className='symbol symbol-50px me-3'>
												<div className={`symbol-label bg-light-${item.color}`}>
													<FontAwesomeIcon
														icon={item.icon}
														className={`h-50 text-${item.color}`}
													/>
												</div>
											</div>
											<div>
												<a
													href='#'
													className={`fs-4 text-gray-800 text-hover-${item.color} fw-bold`}>
													{item.title}
												</a>
											</div>
										</div>
										<div className={`badge badge-${item.color} fw-semibold py-4 px-3`}>
											{item.badge}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default WebsiteSeo
