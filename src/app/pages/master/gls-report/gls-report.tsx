import {faArrowUp,	faBoxes,faCalendarAlt,faChartPie,faCity,faFileInvoiceDollar,faMoneyBillWave,faSync,faUser,} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState, useRef } from 'react'
import { KTCard, KTCardBody } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import {
	getGlsCityWiseReport,
	getGlsPartyWiseReport,
	getGlsProductWiseReport,
	getGlsYearlyReport,
} from '../../../Functions/FGGroup'
import './gls-report.css'

const SALES_PERSONS = ['Smit Bhai', 'Miku Bhai', 'Tejas bhai', 'Tushar Bhai']
const METRIC_ROWS = [
	{ id: 'new_visits', label: 'New Visits' },
	{ id: 'new_visits_orders', label: 'Orders' },
	{ id: 'new_visits_amount', label: 'Amount' },
	{ id: 'new_calls', label: 'New Calls' },
	{ id: 'new_calls_orders', label: 'Orders' },
	{ id: 'new_calls_amount', label: 'Amount' },
	{ id: 'repeat_visits', label: 'Repeat Visits' },
	{ id: 'repeat_visits_orders', label: 'Orders' },
	{ id: 'repeat_visits_amount', label: 'Amount' },
	{ id: 'regular_calls', label: 'Regular Calls' },
	{ id: 'regular_calls_orders', label: 'Orders' },
	{ id: 'regular_calls_amount', label: 'Amount' },
]

const TOTAL_ROWS = [
	{ id: 'total_visits', label: 'Total Visits' },
	{ id: 'total_calls', label: 'Total Calls' },
	{ id: 'total_orders', label: 'Total Orders' },
	{ id: 'total_amount', label: 'Total Amount' },
]


const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const GlsReport: React.FC = () => {
	const [loading, setLoading] = useState<boolean>(true)
	const [summary, setSummary] = useState({
		total_amount: 0,
		total_paid_amount: 0,
		total_unpaid_amount: 0,
		total_invoices: 0,
	})
	const [cityReport, setCityReport] = useState<any>({
		cities: [],
		months: [],
		month_totals: {},
		grand_total: 0,
		total_orders: 0,
	})
	const [partyReport, setPartyReport] = useState<any>({
		parties: [],
		months: [],
		month_totals: {},
		grand_total: 0,
		total_orders: 0,
		grand_total_paid: 0,
	})
	const [productReport, setProductReport] = useState<any>({
		products: [],
		months: [],
	}) 
	const [yearlyReport, setYearlyReport] = useState<any>({
		years: [],
		monthly_breakdown: [],
		year_totals: {},
	})
	const [salesPersonWiseReport, setSalesPersonWiseReport] = useState<any>({
		years: [],
		data_by_year: {},
	})
	const [salesPersonDetailedReport, setSalesPersonDetailedReport] = useState<any>({
		years: [],
		data_by_year: {},
	})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [selectedCategory, setSelectedCategory] = useState<string>('Gomzi Nutrition')
	const [activeTab, setActiveTab] = useState<string>('City')
	const [excelFilterMonth, setExcelFilterMonth] = useState<string>('All')
	const [excelFilterYear, setExcelFilterYear] = useState<string>('2025')

	const isFirstDateFilterCall = useRef(true)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		if (isFirstDateFilterCall.current) {
			isFirstDateFilterCall.current = false
			return
		}
		setSelectedDateRange(range)
	}


	const fetchGlsSalesData = async () => {
		setLoading(true)

		try {
			// Build query - same pattern as gnmatrix fetchLocationData
			const query: any = {
				invoice_category: selectedCategory,
				limit: 2000,
				is_all_year: true,
			}

			if (selectedDateRange) {
				query.from_date = DayJS(selectedDateRange[0]).format('YYYY-MM-DD')
				query.to_date = DayJS(selectedDateRange[1]).format('YYYY-MM-DD')
			}

			const yearlyQuery = { invoice_category: selectedCategory }

			const [cityRes, partyRes, productRes, yearlyRes]: any = await Promise.all([
				getGlsCityWiseReport(query),
				getGlsPartyWiseReport(query),
				getGlsProductWiseReport(query),
				getGlsYearlyReport(yearlyQuery),
			])


			if (cityRes.status === 200) {
				setCityReport(cityRes.data)
			}

			if (partyRes.status === 200) {
				setPartyReport(partyRes.data)
			}
			if (productRes.status === 200) {
				setProductReport(productRes.data)
			}
			if (yearlyRes.status === 200) {
				setYearlyReport(yearlyRes.data)

				const yearTotals = yearlyRes.data.year_totals || {}
				let allTimeAmount = 0
				let allTimePaid = 0
				let allTimeOrders = 0

				Object.values(yearTotals).forEach((yt: any) => {
					allTimeAmount += yt.total_amount || 0
					allTimePaid += yt.total_paid || 0
					allTimeOrders += yt.total_orders || 0
				})

				setSummary({
					total_amount: allTimeAmount,
					total_paid_amount: allTimePaid,
					total_unpaid_amount: allTimeAmount - allTimePaid,
					total_invoices: allTimeOrders,
				})
			}

			const fakeSalesPersons = ['Rahul Sharma', 'Anjali Gupta', 'Vikram Singh', 'Priya Patel', 'Suresh Kumar']
			const currentYear = new Date().getFullYear()
			const years = [currentYear, currentYear - 1]

			const spWiseData: any = { years, data_by_year: {} }
			years.forEach(yr => {
				const spList = fakeSalesPersons.map(name => {
					const spRow: any = { sales_person_name: name, total_amount: 0, total_paid: 0 }
					MONTHS.forEach(m => {
						const amount = Math.floor(Math.random() * 50000) + 10000
						spRow[m] = amount
						spRow.total_amount += amount
						spRow.total_paid += Math.floor(amount * 0.85)
					})
					return spRow
				})
				
				const monthTotals: any = {}
				MONTHS.forEach(m => {
					monthTotals[m] = spList.reduce((acc, sp) => acc + (sp[m] || 0), 0)
				})

				spWiseData.data_by_year[yr] = {
					sales_persons: spList,
					months: MONTHS,
					month_totals: monthTotals,
					grand_total: spList.reduce((acc, sp) => acc + sp.total_amount, 0),
					grand_total_paid: spList.reduce((acc, sp) => acc + sp.total_paid, 0)
				}
			})
			spWiseData.is_all_year = true
			setSalesPersonWiseReport(spWiseData)

			const spDetailedData: any = { 
				months: ['May', 'June', 'July', 'August', 'September'], 
				years: ['2025', '2024'],
				data: {} 
			}
			
			spDetailedData.years.forEach((yr: string) => {
				spDetailedData.data[yr] = {}
				spDetailedData.months.forEach((month: string) => {
					const monthData: any = {}
					SALES_PERSONS.forEach(sp => {
						const metrics: any = {
							new_visits: Math.floor(Math.random() * 20) + 10,
							new_visits_orders: Math.floor(Math.random() * 5),
							new_visits_amount: Math.floor(Math.random() * 10000),
							new_calls: Math.floor(Math.random() * 30),
							new_calls_orders: Math.floor(Math.random() * 8),
							new_calls_amount: Math.floor(Math.random() * 15000),
							repeat_visits: Math.floor(Math.random() * 10),
							repeat_visits_orders: Math.floor(Math.random() * 3),
							repeat_visits_amount: Math.floor(Math.random() * 8000),
							regular_calls: Math.floor(Math.random() * 40),
							regular_calls_orders: Math.floor(Math.random() * 10),
							regular_calls_amount: Math.floor(Math.random() * 20000),
						}
						metrics.total_visits = metrics.new_visits + metrics.repeat_visits
						metrics.total_calls = metrics.new_calls + metrics.regular_calls
						metrics.total_orders = metrics.new_visits_orders + metrics.new_calls_orders + metrics.repeat_visits_orders + metrics.regular_calls_orders
						metrics.total_amount = metrics.new_visits_amount + metrics.new_calls_amount + metrics.repeat_visits_amount + metrics.regular_calls_amount
						monthData[sp] = metrics
					})
					spDetailedData.data[yr][month] = monthData
				})
			})
			setSalesPersonDetailedReport(spDetailedData)
		} catch (error) {
			console.error('Error fetching GLS Sales Data:', error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchGlsSalesData()
	}, [selectedDateRange, selectedCategory])

	// ─── Shared Utilities ───────────────────────────────────────────────────────


	const tabs = [
		{ id: 'City', icon: faCity, label: 'City Wise' },
		{ id: 'Yearly', icon: faCalendarAlt, label: 'Yearly' },
		{ id: 'Product', icon: faBoxes, label: 'Product Wise' },
		{ id: 'Party', icon: faUser, label: 'Party Wise' },
		{ id: 'SalesPersonWise', icon: faChartPie, label: 'Sales Person Wise' },
		{ id: 'SalesPersonDetailed', icon: faFileInvoiceDollar, label: 'Sales Person Detailed' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Gls-Report</PageTitle>

			{/* ── Top Bar ── */}
			<div className='row align-items-center g-3 mb-7'>
				<div className='col-9'>
					<h2 className='fw-bold text-gray-900 mb-0 fs-4'>Sales Intelligence</h2>
				</div>

				<div className='col-3 text-end'>
					<DateFilter
						onDateRangeChange={handleDateRangeChange}
						leftValue='-650px'
					/>
				</div>
			</div>

			{/* ── KPI Cards ── */}
			<div className='row g-4 mb-7'>
				{[
					{
						label: 'Total Order Amount',
						value: `₹${summary.total_amount.toLocaleString()}`,
						icon: faMoneyBillWave,
						accent: '#1a73e8',
						iconBg: '#e8f0fe',
						iconColor: '#1a73e8',
					},
					{
						label: 'Total Paid Amount',
						value: `₹${summary.total_paid_amount.toLocaleString()}`,
						icon: faArrowUp,
						accent: '#1e8755',
						iconBg: '#e6f4ea',
						iconColor: '#1e8755',
					},
					{
						label: 'Total Remaining Amount',
						value: `₹${summary.total_unpaid_amount.toLocaleString()}`,
						icon: faFileInvoiceDollar,
						accent: '#b3a50f',
						iconBg: '#fdf7e3',
						iconColor: '#b3a50f',
					},
					{
						label: 'Total Orders',
						value: summary.total_invoices.toLocaleString(),
						icon: faChartPie,
						accent: '#7b5ea7',
						iconBg: '#f3e8fd',
						iconColor: '#7b5ea7',
					},
				].map((card, i) => (
					<div
						className='col-6 col-lg-3'
						key={i}>
						<div
							className='card border-0 shadow-sm h-100 overflow-hidden gls-kpi-card'
							style={{ borderRadius: 14 }}>
							{/* Colored top accent bar */}
							<div style={{ height: 4, background: card.accent, borderRadius: '14px 14px 0 0' }} />
							<div className='card-body px-5 pt-5 pb-5'>
								<div className='d-flex align-items-start justify-content-between mb-4'>
									<div
										className='rounded-3 d-flex align-items-center justify-content-center flex-shrink-0'
										style={{ width: 44, height: 44, background: card.iconBg }}>
										<FontAwesomeIcon
											icon={card.icon}
											style={{ color: card.iconColor, fontSize: 18 }}
										/>
									</div>
								</div>
								<div
									className='text-muted fs-8 fw-semibold mb-2 text-uppercase'
									style={{ letterSpacing: '0.5px' }}>
									{card.label}
								</div>
								<div
									className='fw-bolder text-gray-900 mb-1'
									style={{ fontSize: 24, lineHeight: 1 }}>
									{card.value}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* ── Main Card ── */}
			<KTCard className='shadow-sm'>
				{/* Tab Nav */}
				<div
					className='card-header border-bottom d-flex align-items-center gap-2 pt-0 pb-0 flex-wrap'
					style={{ minHeight: 56 }}>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`btn btn-sm fw-semibold px-4 py-3 border-0 border-bottom border-3 rounded-0 ${
								activeTab === tab.id
									? 'text-primary border-primary'
									: 'text-muted border-transparent'
							}`}
							style={{ transition: 'all 0.2s', background: 'none' }}>
							<FontAwesomeIcon
								icon={tab.icon}
								className='me-2'
							/>
							{tab.label}
						</button>
					))}
				</div>

				<KTCardBody className='p-0'>
					{loading ? (
						<div className='d-flex align-items-center justify-content-center py-20'>
							<div className='spinner-border text-primary me-3'></div>
							<span className='text-muted fw-semibold'>Fetching data…</span>
						</div>
					) : (
						<div className='table-responsive'>
							{/* ── CITY WISE ── */}
							{activeTab === 'City' && (
								<div>
									{cityReport.years?.map((yr: any) => (
										<CityMatrixTable
											key={yr}
											year={yr}
											data={cityReport.data_by_year[yr]}
										/>
									))}
								</div>
							)}

							{/* ── YEARLY ── Matrix View */}
							{activeTab === 'Yearly' && (
								<div className='mt-2'>
									<div className='px-6 pt-5 pb-3'>
										<h5
											className='fw-bold text-gray-900 mb-1'
											style={{ fontSize: 16 }}>
											Yearly Analysis 
										</h5>
										<p className='text-muted fs-8 mb-0'>
											Comparative sales breakdown by fiscal year
										</p>
									</div>
									<table
										className='table table-bordered align-middle mb-0 gls-table'>
										<thead>
											<tr style={{ background: '#e6f4ea' }}>
												<th
													className='fw-bold ps-4 py-3 yearly-sticky-col gls-sticky-column gls-sticky-header'>
													Month
												</th>
												{yearlyReport.years.map((yr: any) => (
													<th
														key={yr}
														className='fw-bold text-center py-3 yearly-header'>
														{yr}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{yearlyReport.monthly_breakdown.length === 0 ? (
												<tr>
													<td
														colSpan={yearlyReport.years.length + 1}
														className='text-center py-10 text-muted'>
														No data available
													</td>
												</tr>
											) : (
												yearlyReport.monthly_breakdown.map((row: any, i: number) => (
													<tr
														key={i}
														style={{ background: i % 2 === 0 ? '#fff' : '#f9fdfa' }}>
														<td
															className='ps-4 fw-bold text-gray-800 yearly-sticky-col gls-sticky-column'
															style={{
																background: i % 2 === 0 ? '#fff' : '#f9fdfa',
															}}>
															{row.month}
														</td>
														{yearlyReport.years.map((yr: any) => {
															const val = row[yr] || 0
															const totalYr = yearlyReport.year_totals[yr]?.total_amount || 1
															const opacity = Math.min(0.05 + (val / totalYr) * 0.7, 0.6)
															return (
																<td
																	key={yr}
																	className='text-center py-2'
																	style={{
																		background:
																			val > 0
																				? `rgba(30, 135, 85, ${opacity})`
																				: 'transparent',
																	}}>
																	{val > 0 ? (
																		<span
																			className='fw-semibold'
																			style={{ color: opacity > 0.35 ? '#fff' : '#145c3a' }}>
																			{val.toLocaleString()}
																		</span>
																	) : (
																		<span className='text-muted'>—</span>
																	)}
																</td>
															)
														})}
													</tr>
												))
											)}
											{/* Yearly Grand Totals */}
											{yearlyReport.years.length > 0 && (
												<tr style={{ background: '#e6f4ea', borderTop: '2px solid #c3e6cb' }}>
													<td
														className='ps-4 fw-bold text-gray-900'
														style={{
															position: 'sticky',
															left: 0,
															background: '#e6f4ea',
															zIndex: 1,
														}}>
														Total
													</td>
													{yearlyReport.years.map((yr: any) => (
														<td
															key={yr}
															className='text-center fw-bold text-dark'
															style={{ fontSize: 13 }}>
															₹{(yearlyReport.year_totals[yr]?.total_amount || 0).toLocaleString()}
														</td>
													))}
												</tr>
											)}
										</tbody>
									</table>
								</div>
							)}

							{/* ── PRODUCT ── Matrix View */}
							{activeTab === 'Product' && (
								<div>
									{productReport.years?.map((yr: any) => (
										<ProductMatrixTable
											key={yr}
											year={yr}
											data={productReport.data_by_year[yr]}
										/>
									))}
								</div>
							)}

							{/* ── PARTY ── */}
							{activeTab === 'Party' && (
								<div>
									{partyReport.is_all_year ? (
										partyReport.years.map((yr: number) => (
											<PartyMatrixTable
												key={yr}
												year={yr}
												data={partyReport.data_by_year[yr]}
											/>
										))
									) : (
										<PartyMatrixTable data={partyReport} />
									)}
								</div>
							)}

							{/* ── SALES PERSON WISE ── */}
							{activeTab === 'SalesPersonWise' && (
								<SalesPersonWiseExcelTable data={salesPersonWiseReport} title="Sales Person Wise Analysis" />
							)}

							{/* ── SALES PERSON DETAILED ── */}
							{activeTab === 'SalesPersonDetailed' && (
								<ExcelStyleSalesTable 
									data={salesPersonDetailedReport} 
									title="Sales Person Detailed Analysis" 
									filterMonth={excelFilterMonth}
									filterYear={excelFilterYear}
									setFilterMonth={setExcelFilterMonth}
									setFilterYear={setExcelFilterYear}
								/>
							)}
						</div>
					)}
				</KTCardBody>
			</KTCard>
		</>
	)
}

const CityMatrixTable = ({ data, year }: { data: any; year?: number }) => {
	const [searchTerm, setSearchTerm] = useState<string>('')
	if (!data) return null

	const filteredCities = (data.cities || []).filter((row: any) =>
		!searchTerm || (row.city_name || 'Direct / Online').toLowerCase().includes(searchTerm.toLowerCase())
	)

	return (
		<div className='mt-2 mb-8'>
			<div className='px-6 pt-5 pb-3 d-flex justify-content-between align-items-center'>
				<div>
					<h5
						className='fw-bold text-gray-900 mb-1'
						style={{ fontSize: 16 }}>
						{year ? `${year}` : ''}
					</h5>
					<p className='text-muted fs-8 mb-0'>Monthly revenue breakdown per city</p>
				</div>
				<div className='position-relative'>
					<FontAwesomeIcon
						icon={faCity}
						className='position-absolute top-50 translate-middle-y ms-4'
						style={{ color: '#1e8755' }}
					/>
					<input
						type='text'
						className='form-control form-control-sm ps-11'
						placeholder='Search cities...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{ width: '250px', backgroundColor: '#fff', border: '1px solid #a8dfbc', color: '#119273', borderRadius: '8px' }}
					/>
				</div>
			</div>
			<table
				className='table table-bordered align-middle mb-0 gls-table'>
				<thead>
					<tr style={{ background: '#e6f4ea' }}>
						<th
							className='fw-bold ps-4 py-3 city-sticky-col gls-sticky-column gls-sticky-header'>
							City Name
						</th>
						{data.months?.map((m: any) => (
							<th
								key={m}
								className='fw-bold text-center py-3 city-header'>
								{m}
							</th>
						))}
						<th
							className='fw-bold text-center py-3 city-header city-total-col'>
							Total amount
						</th>
						<th
							className='fw-bold text-center py-3 yearly-header'>
							Paid
						</th>
					</tr>
				</thead>
				<tbody>
					{!filteredCities || filteredCities.length === 0 ? (
						<tr>
							<td
								colSpan={(data.months?.length || 0) + 3}
								className='text-center py-10 text-muted'>
								No city data available
							</td>
						</tr>
					) : (
						filteredCities.map((row: any, i: number) => (
							<tr
								key={i}
								style={{ background: i % 2 === 0 ? '#fff' : '#f9fdfa' }}>
								<td
									className='ps-4 fw-semibold text-gray-800 city-sticky-col gls-sticky-column'
									style={{
										background: i % 2 === 0 ? '#fff' : '#f9fdfa',
									}}>
									{row.city_name || 'Direct / Online'}
								</td>
								{data.months?.map((m: any) => {
									const val = row[m] || 0
									const opacity = Math.min(0.1 + (val / (row.total_amount || 1)) * 0.55, 0.65)
									return (
										<td
											key={m}
											className='text-center py-2'
											style={{
												background: val > 0 ? `rgba(30, 135, 85, ${opacity})` : 'transparent',
											}}>
											{val > 0 ? (
												<span
													className='fw-semibold'
													style={{ color: opacity > 0.4 ? '#fff' : '#119273' }}>
													{val.toLocaleString()}
												</span>
											) : (
												<span className='text-muted'>—</span>
											)}
										</td>
									)
								})}
								<td
									className='text-center fw-bold py-2'
									style={{ background: '#e6f4ea', color: '#119273' }}>
									{row.total_amount.toLocaleString()}
								</td>
								<td
									className='text-center fw-bold py-2'
									style={{ background: '#e6f4ea', color: '#1e8755' }}>
									{row.total_paid.toLocaleString()}
								</td>
							</tr>
						))
					)}
					{filteredCities.length > 0 && data.months?.length > 0 && (
						<tr className='grand-total-row'>
							<td
								className='ps-4 fw-bold text-gray-900 gls-sticky-column'
								style={{ background: '#e6f4ea' }}>
								Grand Total
							</td>
							{data.months?.map((m: any) => {
								const total = filteredCities.reduce((acc: number, row: any) => acc + (row[m] || 0), 0)
								return (
									<td
										key={m}
										className='text-center fw-bold text-dark'>
										{total > 0 ? `₹${total.toLocaleString()}` : '—'}
									</td>
								)
							})}
							<td
								className='text-center fw-bold text-dark city-total-col'>
								₹{filteredCities.reduce((acc: number, row: any) => acc + (row.total_amount || 0), 0).toLocaleString()}
							</td>
							<td
								className='text-center fw-bold text-dark yearly-header'>
								₹{filteredCities.reduce((acc: number, row: any) => acc + (row.total_paid || 0), 0).toLocaleString()}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)
}

const ProductMatrixTable = ({ data, year }: { data: any; year?: number }) => {
	const [searchTerm, setSearchTerm] = useState<string>('')
	if (!data) return null

	const filteredProducts = (data.products || []).filter((row: any) =>
		!searchTerm || (row.product_name || row.category || '').toLowerCase().includes(searchTerm.toLowerCase())
	)

	return (
		<div className='mt-2 mb-8'>
			<div className='px-6 pt-5 pb-3 d-flex justify-content-between align-items-center'>
				<div>
					<h5
						className='fw-bold text-gray-900 mb-1'
						style={{ fontSize: 16 }}>
						{year ? `${year}` : ''}
					</h5>
					<p className='text-muted fs-8 mb-0'>Monthly sales performance per item</p>
				</div>
				<div className='position-relative'>
					<FontAwesomeIcon
						icon={faBoxes}
						className='position-absolute top-50 translate-middle-y ms-4'
						style={{ color: '#1e8755' }}
					/>
					<input
						type='text'
						className='form-control form-control-sm ps-11'
						placeholder='Search products...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{ width: '250px', backgroundColor: '#fff', border: '1px solid #a8dfbc', color: '#119273', borderRadius: '8px' }}
					/>
				</div>
			</div>
			<table
				className='table table-bordered align-middle mb-0 gls-table'>
				<thead>
					<tr style={{ background: '#e6f4ea' }}>
						<th
							className='fw-bold ps-4 py-3 product-sticky-col gls-sticky-column gls-sticky-header'>
							Product Name
						</th>
						{data.months?.map((m: any) => (
							<th
								key={m}
								className='fw-bold text-center py-3 product-header'>
								{m}
							</th>
						))}
						<th
							className='fw-bold text-center py-3 product-header product-total-col'>
							Total amount
						</th>
					</tr>
				</thead>
				<tbody>
					{!filteredProducts || filteredProducts.length === 0 ? (
						<tr>
							<td
								colSpan={(data.months?.length || 0) + 2}
								className='text-center py-10 text-muted'>
								No product data available
							</td>
						</tr>
					) : (
						filteredProducts.map((row: any, i: number) => (
							<tr
								key={i}
								style={{ background: i % 2 === 0 ? '#fff' : '#f9fdfa' }}>
								<td
									className='ps-4 fw-semibold text-gray-800 product-sticky-col gls-sticky-column'
									style={{
										background: i % 2 === 0 ? '#fff' : '#f9fdfa',
									}}>
									<div
										className='text-capitalize truncate-cell'
										title={row.product_name || row.category}>
										{row.product_name || row.category}
									</div>
								</td>
								{data.months?.map((m: any) => {
									const val = row[m] || 0
									const opacity = Math.min(0.1 + (val / (row.total_amount || 1)) * 0.55, 0.65)
									return (
										<td
											key={m}
											className='text-center py-2'
											style={{
												background: val > 0 ? `rgba(30, 135, 85, ${opacity})` : 'transparent',
											}}>
											{val > 0 ? (
												<span
													className='fw-semibold'
													style={{ color: opacity > 0.4 ? '#fff' : '#119273' }}>
													{val.toLocaleString()}
												</span>
											) : (
												<span className='text-muted'>—</span>
											)}
										</td>
									)
								})}
								<td
									className='text-center fw-bold py-2'
									style={{ background: '#e6f4ea', color: '#119273' }}>
									{(row.total_amount || 0).toLocaleString()}
								</td>
							</tr>
						))
					)}
					{filteredProducts.length > 0 && data.months?.length > 0 && (
						<tr className='grand-total-row'>
							<td
								className='ps-4 fw-bold text-gray-900 gls-sticky-column'
								style={{ background: '#e6f4ea' }}>
								Grand Total
							</td>
							{data.months?.map((m: any) => {
								const total = filteredProducts.reduce((acc: number, row: any) => acc + (row[m] || 0), 0)
								return (
									<td
										key={m}
										className='text-center fw-bold text-dark'>
										{total > 0 ? `₹${total.toLocaleString()}` : '—'}
									</td>
								)
							})}
							<td
								className='text-center fw-bold text-dark product-total-col'>
								₹{filteredProducts.reduce((acc: number, row: any) => acc + (row.total_amount || 0), 0).toLocaleString()}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)
}

const PartyMatrixTable = ({ data, year }: { data: any; year?: number }) => {
	const [searchTerm, setSearchTerm] = useState<string>('')
	if (!data) return null

	const filteredParties = (data.parties || []).filter((row: any) =>
		!searchTerm || (row.party_name || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase())
	)

	return (
		<div className='mt-2 mb-8'>
			<div className='px-6 pt-5 pb-3 d-flex justify-content-between align-items-center'>
				<div>
					<h5
						className='fw-bold text-gray-900 mb-1'
						style={{ fontSize: 16 }}>
						{year ? `${year}` : ''}
					</h5>
					<p className='text-muted fs-8 mb-0'>Monthly revenue breakdown per customer</p>
				</div>
				<div className='position-relative'>
					<FontAwesomeIcon
						icon={faUser}
						className='position-absolute top-50 translate-middle-y ms-4'
						style={{ color: '#1e8755' }}
					/>
					<input
						type='text'
						className='form-control form-control-sm ps-11'
						placeholder='Search clients...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{ width: '250px', backgroundColor: '#fff', border: '1px solid #a8dfbc', color: '#119273', borderRadius: '8px' }}
					/>
				</div>
			</div>
			<table
				className='table table-bordered align-middle mb-0 gls-table'>
				<thead>
					<tr style={{ background: '#e6f4ea' }}>
						<th
							className='fw-bold ps-4 py-3 party-sticky-col gls-sticky-column gls-sticky-header'>
							Party / Client
						</th>
						{data.months?.map((m: any) => (
							<th
								key={m}
								className='fw-bold text-center py-3 party-header'>
								{m}
							</th>
						))}
						<th
							className='fw-bold text-center py-3 party-header party-total-col'>
							Total amount
						</th>
						<th
							className='fw-bold text-center py-3 yearly-header'>
							Paid
						</th>
					</tr>
				</thead>
				<tbody>
					{!filteredParties || filteredParties.length === 0 ? (
						<tr>
							<td
								colSpan={(data.months?.length || 0) + 3}
								className='text-center py-10 text-muted'>
								No party data available
							</td>
						</tr>
					) : (
						filteredParties.map((row: any, i: number) => (
							<tr
								key={i}
								style={{ background: i % 2 === 0 ? '#fff' : '#f9fdfa' }}>
								<td
									className='ps-4 fw-semibold text-gray-800 party-sticky-col gls-sticky-column'
									style={{
										background: i % 2 === 0 ? '#fff' : '#f9fdfa',
									}}>
									{row.party_name || 'Unknown'}
								</td>
								{data.months?.map((m: any) => {
									const val = row[m] || 0
									const opacity = Math.min(0.1 + (val / (row.total_amount || 1)) * 0.55, 0.65)
									return (
										<td
											key={m}
											className='text-center py-2'
											style={{
												background: val > 0 ? `rgba(30, 135, 85, ${opacity})` : 'transparent',
											}}>
											{val > 0 ? (
												<span
													className='fw-semibold'
													style={{ color: opacity > 0.4 ? '#fff' : '#119273' }}>
													{val.toLocaleString()}
												</span>
											) : (
												<span className='text-muted'>—</span>
											)}
										</td>
									)
								})}
								<td
									className='text-center fw-bold py-2'
									style={{ background: '#e6f4ea', color: '#119273' }}>
									{row.total_amount.toLocaleString()}
								</td>
								<td
									className='text-center fw-bold py-2'
									style={{ background: '#e6f4ea', color: '#1e8755' }}>
									{row.total_paid.toLocaleString()}
								</td>
							</tr>
						))
					)}
					{filteredParties.length > 0 && data.months?.length > 0 && (
						<tr className='grand-total-row'>
							<td
								className='ps-4 fw-bold text-gray-900 gls-sticky-column'
								style={{ background: '#e6f4ea' }}>
								Grand Total
							</td>
							{data.months?.map((m: any) => {
								const total = filteredParties.reduce((acc: number, row: any) => acc + (row[m] || 0), 0)
								return (
									<td
										key={m}
										className='text-center fw-bold text-dark'>
										{total > 0 ? `₹${total.toLocaleString()}` : '—'}
									</td>
								)
							})}
							<td
								className='text-center fw-bold text-dark party-total-col'>
								₹{filteredParties.reduce((acc: number, row: any) => acc + (row.total_amount || 0), 0).toLocaleString()}
							</td>
							<td
								className='text-center fw-bold text-dark yearly-header'>
								₹{filteredParties.reduce((acc: number, row: any) => acc + (row.total_paid || 0), 0).toLocaleString()}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)
}

const ExcelStyleSalesTable = ({ 
	data, 
	title, 
	filterMonth = 'All', 
	filterYear = '2025',
	setFilterMonth,
	setFilterYear
}: { 
	data: any; 
	title: string, 
	filterMonth?: string, 
	filterYear?: string,
	setFilterMonth?: (m: string) => void,
	setFilterYear?: (y: string) => void
}) => {
	if (!data || !data.months) return null

	const displayedMonths = filterMonth === 'All' ? data.months : [filterMonth]
	const activeYearData = data.data?.[filterYear] || {}

	return (
		<div className='mt-2 mb-8 px-6'>
			<div className='d-flex justify-content-between align-items-center mb-4 py-4'>
				<div>
					<h5 className='fw-bold text-gray-900 mb-0'>{title}</h5>
					<p className='text-muted fs-8 mb-0'>Analysis for {filterMonth === 'All' ? 'All Months' : filterMonth} {filterYear}</p>
				</div>
				<div className='d-flex align-items-center gap-4'>
					{setFilterMonth && (
						<div className='d-flex align-items-center gap-2'>
							<label className='fs-8 fw-bold text-gray-700'>Month:</label>
							<select
								className='form-select form-select-sm'
								style={{ width: '130px', background: '#e6f4ea', border: '1px solid #a8dfbc', color: '#1e8755' }}
								value={filterMonth}
								onChange={(e) => setFilterMonth(e.target.value)}
							>
								<option value='All'>All Months</option>
								{data.months?.map((m: string) => (
									<option key={m} value={m}>{m}</option>
								))}
							</select>
						</div>
					)}
					{setFilterYear && (
						<div className='d-flex align-items-center gap-2'>
							<label className='fs-8 fw-bold text-gray-700'>Year:</label>
							<select
								className='form-select form-select-sm'
								style={{ width: '100px', background: '#e6f4ea', border: '1px solid #a8dfbc', color: '#1e8755' }}
								value={filterYear}
								onChange={(e) => setFilterYear(e.target.value)}
							>
								{data.years?.map((yr: string) => (
									<option key={yr} value={yr}>{yr}</option>
								))}
							</select>
						</div>
					)}
				</div>
			</div>
			<div className='table-responsive'>
				<table className='table table-bordered align-middle mb-0 gls-table'>
					<thead>
						{/* First Row: Months */}
						<tr style={{ background: '#e6f4ea' }}>
							<th className='fw-bolder yearly-header gls-sticky-column ps-6' style={{ top: 0, position: 'sticky', zIndex: 5, borderRight: '1px solid #a8dfbc', minWidth: '150px' }}>Metric</th>
							{displayedMonths.map((month: string) => (
								<th key={month} colSpan={SALES_PERSONS.length} className='fw-bold text-center py-3 yearly-header' style={{ borderBottom: '1px solid #a8dfbc' }}>
									{month} {filterYear}
								</th>
							))}
						</tr>
						{/* Second Row: Sales Persons */}
						<tr style={{ background: '#f8fcf9' }}>
							<th className='gls-sticky-column' style={{ top: '42px', position: 'sticky', zIndex: 5, background: '#f8fcf9', borderRight: '1px solid #dbe4ef' }}></th>
							{displayedMonths.map((month: string) => (
								<React.Fragment key={`${month}-names`}>
									{SALES_PERSONS.map(sp => (
										<th key={`${month}-${sp}`} className='text-center py-2 fw-semibold text-gray-700' style={{ minWidth: '110px', fontSize: '11px', background: '#f8fcf9' }}>
											{sp}
										</th>
									))}
								</React.Fragment>
							))}
						</tr>
					</thead>
					<tbody>
						{METRIC_ROWS.map((metric, idx) => {
							const isMainCategory = metric.label.includes('Visits') || metric.label.includes('Calls')
							const isAmountRow = metric.id.endsWith('_amount')
							const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fcf9'
							
							return (
								<React.Fragment key={metric.id}>
									<tr key={metric.id} style={{ background: rowBg }}>
										<td className='gls-sticky-column ps-6 fw-bolder text-dark' 
											style={{ position: 'sticky', left: 0, background: rowBg, zIndex: 2, borderRight: '1.5px solid #dbe4ef', minWidth: '150px' }}>
											{metric.label}
										</td>
										{displayedMonths.map((month: string) => (
											<React.Fragment key={`${month}-${metric.id}`}>
												{SALES_PERSONS.map(sp => {
													const val = activeYearData[month]?.[sp]?.[metric.id] || 0
													return (
														<td key={`${month}-${sp}-${metric.id}`} 
															className='text-center py-3'
															style={{ 
																background: isAmountRow ? 'rgba(30, 200, 145, 0.2)' : 'transparent' 
															}}>
															{val > 0 ? (
																<span className={isAmountRow ? 'fw-bold' : ''}>{val.toLocaleString()}</span>
															) : (
																<span className={isAmountRow ? 'fw-bold' : 'text-muted'}>—</span>
															)}
														</td>
													)
												})}
											</React.Fragment>
										))}
									</tr>
									{isAmountRow && (
										<tr style={{ height: '12px' }}>
											<td colSpan={1 + displayedMonths.length * SALES_PERSONS.length} className='border-0' style={{ background: 'transparent' }}></td>
										</tr>
									)}
								</React.Fragment>
							)
						})}
						{/* Spacer Row */}
						<tr style={{ height: '30px' }}>
							<td colSpan={1 + displayedMonths.length * SALES_PERSONS.length} className='border-0'></td>
						</tr>
						{/* Total Rows */}
						{TOTAL_ROWS.map(total => (
							<tr key={total.id} style={{ background: '#e6f4ea' }}>
								<td className='gls-sticky-column ps-6 fw-bolder text-dark' style={{ left: 0, position: 'sticky', background: '#e6f4ea', zIndex: 2, borderRight: '1px solid #a8dfbc', minWidth: '150px' }}>{total.label}</td>
								{displayedMonths.map((month: string) => (
									<React.Fragment key={`${month}-${total.id}`}>
										{SALES_PERSONS.map(sp => {
											const val = activeYearData[month]?.[sp]?.[total.id] || 0
											return (
												<td key={`${month}-${sp}-${total.id}`} className='text-center fw-bold text-dark'>
													{val > 0 ? val.toLocaleString() : '—'}
												</td>
											)
										})}
									</React.Fragment>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

const SalesPersonMatrixTable = ({ data, year }: { data: any; year?: number }) => {
	const [searchTerm, setSearchTerm] = useState<string>('')
	if (!data) return null

	const filteredSalesPersons = (data.sales_persons || []).filter((row: any) =>
		!searchTerm || (row.sales_person_name || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase())
	)

	return (
		<div className='mt-2 mb-8'>
			<div className='px-6 pt-5 pb-3 d-flex justify-content-between align-items-center'>
				<div>
					<h5
						className='fw-bold text-gray-900 mb-1'
						style={{ fontSize: 16 }}>
						{year ? `${year}` : ''}
					</h5>
					<p className='text-muted fs-8 mb-0'>Monthly performance per Sales Person</p>
				</div>
				<div className='position-relative'>
					<FontAwesomeIcon
						icon={faUser}
						className='position-absolute top-50 translate-middle-y ms-4'
						style={{ color: '#0095e8' }}
					/>
					<input
						type='text'
						className='form-control form-control-sm ps-11'
						placeholder='Search sales persons...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{ width: '250px', backgroundColor: '#fff', border: '1px solid #c0e1f7', color: '#005fa3', borderRadius: '8px' }}
					/>
				</div>
			</div>
			<table
				className='table table-bordered align-middle mb-0 gls-table'>
				<thead>
					<tr style={{ background: '#e6f4ea' }}>
						<th
							className='fw-bold ps-4 py-3 party-sticky-col gls-sticky-column gls-sticky-header'>
							Sales Person
						</th>
						{data.months?.map((m: any) => (
							<th
								key={m}
								className='fw-bold text-center py-3 party-header'>
								{m}
							</th>
						))}
						<th
							className='fw-bold text-center py-3 party-header party-total-col'>
							Total amount
						</th>
						<th
							className='fw-bold text-center py-3 yearly-header'>
							Paid
						</th>
					</tr>
				</thead>
				<tbody>
					{!filteredSalesPersons || filteredSalesPersons.length === 0 ? (
						<tr>
							<td
								colSpan={(data.months?.length || 0) + 3}
								className='text-center py-10 text-muted'>
								No sales person data available
							</td>
						</tr>
					) : (
						filteredSalesPersons.map((row: any, i: number) => (
							<tr
								key={i}
								style={{ background: i % 2 === 0 ? '#fff' : '#f0f9ff' }}>
								<td
									className='ps-4 fw-semibold text-gray-800 party-sticky-col gls-sticky-column'
									style={{
										background: i % 2 === 0 ? '#fff' : '#f0f9ff',
									}}>
									{row.sales_person_name || 'Unknown'}
								</td>
								{data.months?.map((m: any) => {
									const val = row[m] || 0
									const opacity = Math.min(0.1 + (val / (row.total_amount || 1)) * 0.55, 0.65)
									return (
										<td
											key={m}
											className='text-center py-2'
											style={{
												background: val > 0 ? `rgba(30, 200, 145, ${opacity})` : 'transparent',
											}}>
											{val > 0 ? (
												<span
													className='fw-semibold'
													style={{ color: opacity > 0.4 ? '#fff' : '#119273' }}>
													{val.toLocaleString()}
												</span>
											) : (
												<span className='text-muted'>—</span>
											)}
										</td>
									)
								})}
								<td
									className='text-center fw-bold py-2'
									style={{ background: '#e6f4ea', color: '#119273' }}>
									{(row.total_amount || 0).toLocaleString()}
								</td>
								<td
									className='text-center fw-bold py-2'
									style={{ background: '#e6f4ea', color: '#1e8755' }}>
									{(row.total_paid || 0).toLocaleString()}
								</td>
							</tr>
						))
					)}
					{filteredSalesPersons.length > 0 && data.months?.length > 0 && (
						<tr className='grand-total-row'>
							<td
								className='ps-4 fw-bold text-gray-900 gls-sticky-column'
								style={{ background: '#e6f4ea' }}>
								Grand Total
							</td>
							{data.months?.map((m: any) => {
								const total = filteredSalesPersons.reduce((acc: number, row: any) => acc + (row[m] || 0), 0)
								return (
									<td
										key={m}
										className='text-center fw-bold text-dark'>
										{total > 0 ? `₹${total.toLocaleString()}` : '—'}
									</td>
								)
							})}
							<td
								className='text-center fw-bold text-dark party-total-col'>
								₹{filteredSalesPersons.reduce((acc: number, row: any) => acc + (row.total_amount || 0), 0).toLocaleString()}
							</td>
							<td
								className='text-center fw-bold text-dark yearly-header'>
								₹{filteredSalesPersons.reduce((acc: number, row: any) => acc + (row.total_paid || 0), 0).toLocaleString()}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)
}

const SalesPersonDetailedTable = ({ data }: { data: any[] }) => {
	const [searchTerm, setSearchTerm] = useState<string>('')
	const filteredData = (data || []).filter((item: any) =>
		!searchTerm ||
		(item.sales_person_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
		(item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
		(item.invoice_number || '').toString().includes(searchTerm)
	)

	return (
		<KTCard className='mb-5 mb-xl-8 mt-5'>
			<KTCardBody className='py-3'>
				<div className='d-flex justify-content-between align-items-center mb-5 mt-3'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold fs-3 mb-1'>Detailed Sales List</span>
						<span className='text-muted mt-1 fw-semibold fs-7'>Granular invoice data by Sales Person</span>
					</h3>
					<div className='position-relative'>
						<FontAwesomeIcon
							icon={faSync}
							className='position-absolute top-50 translate-middle-y ms-4'
							style={{ color: '#5e6278' }}
						/>
						<input
							type='text'
							className='form-control form-control-sm ps-11'
							placeholder='Search invoices...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							style={{ width: '300px', borderRadius: '8px' }}
						/>
					</div>
				</div>
				<div className='table-responsive'>
					<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
						<thead>
							<tr className='fw-bold text-muted bg-light'>
								<th className='ps-4 min-w-100px rounded-start'>Invoice No</th>
								<th className='min-w-150px'>Date</th>
								<th className='min-w-200px'>Customer</th>
								<th className='min-w-150px'>Sales Person</th>
								<th className='min-w-120px'>Amount</th>
								<th className='min-w-120px'>Paid</th>
								<th className='min-w-100px text-end pe-4 rounded-end'>Status</th>
							</tr>
						</thead>
						<tbody>
							{filteredData.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										className='text-center py-10 text-muted'>
										No detailed data available
									</td>
								</tr>
							) : (
								filteredData.map((item: any, i: number) => (
									<tr key={i}>
										<td className='ps-4'>
											<span className='text-dark fw-bold hover-primary fs-6'>#{item.invoice_number}</span>
										</td>
										<td>
											<span className='text-muted fw-semibold d-block fs-7'>{DayJS(item.date).format('DD MMM YYYY')}</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>{item.name}</span>
											<span className='text-muted fw-semibold fs-7'>{item.branch_name}</span>
										</td>
										<td>
											<span className='badge badge-light-primary fw-bold px-4 py-3'>{item.sales_person_name}</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>₹{(item.net_amount || 0).toLocaleString()}</span>
										</td>
										<td>
											<span className='text-success fw-bold d-block fs-6'>₹{(item.paid_amount || 0).toLocaleString()}</span>
										</td>
										<td className='text-end pe-4'>
											<span className={`badge badge-light-${(item.paid_amount || 0) >= (item.net_amount || 0) ? 'success' : 'warning'} fw-bold`}>
												{(item.paid_amount || 0) >= (item.net_amount || 0) ? 'Paid' : 'Partial'}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</KTCardBody>
		</KTCard>
	)
}

const SalesPersonWiseExcelTable = ({ data, title }: { data: any; title: string }) => {
	if (!data || !data.years || data.years.length === 0) return null

	const currentYear = data.years[0]
	const yearData = data.data?.[currentYear] || data.data_by_year?.[currentYear]
	if (!yearData) return null

	return (
		<div className='mt-2 mb-8 px-6'>
			<div className='d-flex justify-content-between align-items-center mb-4 py-4'>
				<h5 className='fw-bold text-gray-900 mb-0'>{title}</h5>
			</div>
			<div className='table-responsive'>
				<table className='table table-bordered align-middle mb-0 gls-table'>
					<thead>
						<tr style={{ background: '#e6f4ea' }}>
							<th className='fw-bold ps-6 py-3 yearly-header text-start' style={{ borderRight: '1px solid #a8dfbc', minWidth: '180px' }}>Sales Person</th>
							{yearData.months?.map((m: string) => (
								<th key={m} className='fw-bold text-center py-3 yearly-header' style={{ minWidth: '100px' }}>{m}</th>
							))}
							<th className='fw-bold text-center py-3 yearly-header' style={{ background: '#c8e6d1', minWidth: '110px' }}>Total</th>
						</tr>
					</thead>
					<tbody>
						{yearData.sales_persons?.map((sp: any, idx: number) => {
							const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fcf9'
							return (
								<tr key={sp.sales_person_name} style={{ background: rowBg }}>
									<td className='ps-6 fw-semibold text-gray-800' style={{ borderRight: '1px solid #dbe4ef', minWidth: '180px' }}>{sp.sales_person_name}</td>
									{yearData.months?.map((m: string) => {
										const val = sp[m] || 0
										const opacity = Math.min(0.05 + (val / (sp.total_amount || 1)) * 0.45, 0.5)
										return (
											<td key={m} className='text-center py-3' style={{ background: val > 0 ? `rgba(30, 200, 145, ${opacity})` : 'transparent' }}>
												{val > 0 ? (
													<span className='fw-bold' style={{ color: opacity > 0.3 ? '#0a5a40' : '#119273' }}>{val.toLocaleString()}</span>
												) : (
													<span className='text-muted'>—</span>
												)}
											</td>
										)
									})}
									<td className='text-center fw-bold' style={{ background: '#e6f4ea', color: '#000' }}>
										{sp.total_amount?.toLocaleString() || '0'}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default GlsReport
