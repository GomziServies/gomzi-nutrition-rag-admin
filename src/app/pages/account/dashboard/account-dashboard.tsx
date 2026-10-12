import { ApexOptions } from 'apexcharts'
import React, { useEffect, useState } from 'react'
import Chart from 'react-apexcharts'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import UsersListPagination from '../../../components/TablePagination'
import { GetDashboardStats } from '../../../Functions/FGGroup/AccountFunctions'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'

const balanceChartOptions: ApexOptions = {
	chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
	plotOptions: {
		bar: {
			horizontal: false,
			columnWidth: '40%',
			borderRadius: 6,
			colors: {
				backgroundBarColors: [
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
					'#f4f5fa',
				],
				backgroundBarRadius: 6,
			},
		},
	},
	dataLabels: { enabled: false },
	stroke: { show: false },
	xaxis: {
		categories: [
			'JAN',
			'FEB',
			'MAR',
			'APR',
			'MAY',
			'JUN',
			'JUL',
			'AUG',
			'SEP',
			'OCT',
			'NOV',
			'DEC',
		],
		axisBorder: { show: false },
		axisTicks: { show: false },
		labels: { style: { colors: '#A1A5B7', fontSize: '10px', fontWeight: 'bold' } },
	},
	yaxis: {
		labels: {
			style: { colors: '#A1A5B7', fontSize: '10px', fontWeight: 'bold' },
			formatter: (val) => '₹' + val + 'k',
		},
		tickAmount: 3,
		min: 0,
		max: 150,
	},
	fill: { opacity: 1, colors: ['#6B50FF'] },
	grid: { show: false },
	legend: { show: false },
	tooltip: { style: { fontSize: '12px' }, y: { formatter: (val) => '₹' + val + ',000' } },
}

const balanceChartSeries = [
	{ name: 'Balance', data: [70, 40, 110, 50, 140, 100, 30, 140, 70, 120, 40, 80] },
]

export const AccountDashboard: React.FC = () => {
	const [stats, setStats] = useState<any>(null)
	const [recentTransactions, setRecentTransactions] = useState<any[]>([])
	const [pendingRequests, setPendingRequests] = useState<any[]>([])
	const [transactionPagination, setTransactionPagination] = useState({
		total: 0,
		totalPages: 1,
		currentPage: 1,
		itemsPerPage: 10,
	})
	const [chartData, setChartData] = useState<{ categories: string[]; series: number[] }>({
		categories: [],
		series: [],
	})
	const [loading, setLoading] = useState(false)
	const [selectedBrand, setSelectedBrand] = useState(
		localStorage.getItem('accountDashboardSelectedBrand') || 'All'
	)
	const [selectedEmployee, setSelectedEmployee] = useState(
		localStorage.getItem('accountDashboardSelectedEmployee') || 'All'
	)
	const [allEmployees, setAllEmployees] = useState<any[]>([])
	const [filteredEmployees, setFilteredEmployees] = useState<any[]>([])
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const brands = [
		{ label: 'FGIIT', value: 'FG Group' },
		{ label: 'FWG', value: 'FWG' },
		{ label: 'Gomzi Nutrition', value: 'Gomzi Nutrition' },
	]

	// Helpers for employee data
	const getEmpId = (emp: any) =>
		emp?.employee_id || emp?.employee?._id || emp?._id || emp?.id || emp?.user_id || ''
	const getEmpName = (emp: any) => {
		return (
			emp?.full_name ||
			emp?.employee?.full_name ||
			emp?.employee?.user?.full_name ||
			emp?.user?.full_name ||
			emp?.name ||
			''
		)
	}

	const fetchEmployees = async () => {
		try {
			const response: any = await GetEmployees({ limit: 1000 })
			if (response.data) {
				setAllEmployees(response.data)
			}
		} catch (error) {
			console.error('Error fetching employees:', error)
		}
	}

	useEffect(() => {
		fetchEmployees()
	}, [])

	useEffect(() => {
		const alwaysIncludeIds = ['66acad0e22824731edcbbd9c', '68808c9eb47cd661ba04812d']
		if (selectedBrand === 'All') {
			setFilteredEmployees(allEmployees)
		} else {
			const filtered = allEmployees.filter((emp: any) => {
				const branch = (emp.employee?.branch_name || '').toLowerCase()
				const selectedB = selectedBrand.toLowerCase()

				if (selectedB === 'fg group' && (branch === 'fg group' || branch === 'fgiit')) return true
				if (selectedB === 'gomzi nutrition' && branch === 'gomzi nutrition') return true
				if (selectedB === 'fwg' && branch === 'fwg') return true

				return branch === selectedB
			})

			const alwaysIncluded = allEmployees.filter((emp: any) =>
				alwaysIncludeIds.includes(getEmpId(emp))
			)

			const merged = [
				...filtered,
				...alwaysIncluded.filter((a) => !filtered.some((f) => getEmpId(f) === getEmpId(a))),
			]

			setFilteredEmployees(merged)
		}
		if (selectedEmployee !== 'All') {
			const stillExists = allEmployees.some((emp) => getEmpId(emp) === selectedEmployee)
			if (!stillExists) setSelectedEmployee('All')
		}
	}, [selectedBrand, allEmployees])

	const fetchStats = async () => {
		setLoading(true)
		try {
			const params: any = {
				page: transactionPagination.currentPage,
				limit: transactionPagination.itemsPerPage,
			}
			if (selectedBrand !== 'All') params.branch_name = selectedBrand
			if (selectedEmployee !== 'All') params.employee_id = selectedEmployee
			if (selectedDateRange) {
				params.from_date = selectedDateRange[0].toISOString()
				params.to_date = selectedDateRange[1].toISOString()
			}

			const response: any = await GetDashboardStats(params)
			if (response.status === 200) {
				setStats(response.data.stats)
				setRecentTransactions(response.data.recentTransactions)
				setPendingRequests(response.data.pendingRequestsList)

				if (response.data.pagination) {
					setTransactionPagination((prev: any) => ({
						...prev,
						total: response.data.pagination.total,
						totalPages: response.data.pagination.totalPages,
						currentPage: response.data.pagination.currentPage,
					}))
				}

				if (response.data.monthlyEarnings) {
					setChartData({
						categories: response.data.monthlyEarnings.map((m: any) => m.month),
						series: response.data.monthlyEarnings.map((m: any) => m.total),
					})
				}
			}
		} catch (error) {
			console.error('Error fetching dashboard stats:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchStats()
		localStorage.setItem('accountDashboardSelectedBrand', selectedBrand)
		localStorage.setItem('accountDashboardSelectedEmployee', selectedEmployee)
	}, [
		selectedBrand,
		selectedEmployee,
		selectedDateRange,
		transactionPagination.currentPage,
		transactionPagination.itemsPerPage,
	])

	const handlePageChange = (p: number) => {
		setTransactionPagination((prev: any) => ({ ...prev, currentPage: p }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setTransactionPagination((prev: any) => ({ ...prev, itemsPerPage: value, currentPage: 1 }))
	}

	const dynamicChartOptions: ApexOptions = {
		...balanceChartOptions,
		xaxis: {
			...balanceChartOptions.xaxis,
			categories: chartData.categories,
		},
		yaxis: {
			...balanceChartOptions.yaxis,
			max: Math.max(...chartData.series, 100) * 1.2, // Dynamic max with padding
		},
	}

	const dynamicChartSeries = [{ name: 'Earnings', data: chartData.series }]

	const formatCurrency = (val: number) => {
		if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)}L`
		if (val >= 1000) return `₹ ${(val / 1000).toFixed(1)}K`
		return `₹ ${val}`
	}

	return (
		<div
			style={{
				margin: '-30px',
				padding: '40px',
				minHeight: '100vh',
				fontFamily: "'Inter', sans-serif",
			}}>
			<PageTitle breadcrumbs={[]}>Account Dashboard</PageTitle>

			{/* Filters */}
			<div
				className='card border-0 shadow-sm mb-8'
				style={{ borderRadius: '20px' }}>
				<div className='card-body px-8 py-5'>
					<div className='d-flex align-items-center justify-content-between flex-wrap gap-4'>
						<div className='d-flex align-items-center flex-wrap gap-4 w-100'>
							<div className='flex-grow-1 min-w-150px max-w-250px'>
								<select
									className='form-select form-select-solid'
									value={selectedBrand}
									onChange={(e) => {
										setSelectedBrand(e.target.value)
										setSelectedEmployee('All')
									}}>
									<option value='All'>All Brands</option>
									{brands.map((b) => (
										<option
											key={b.value}
											value={b.value}>
											{b.label}
										</option>
									))}
								</select>
							</div>
							<div className='flex-grow-1 min-w-150px max-w-250px'>
								<select
									className='form-select form-select-solid'
									value={selectedEmployee}
									onChange={(e) => setSelectedEmployee(e.target.value)}>
									<option value='All'>All Employee</option>
									{filteredEmployees.map((emp) => (
										<option
											key={getEmpId(emp)}
											value={getEmpId(emp)}>
											{getEmpName(emp)}
										</option>
									))}
								</select>
							</div>
							<div className='flex-grow-1 min-w-250px max-w-300px'>
								<DateFilter
									onDateRangeChange={(range) => setSelectedDateRange(range)}
									rightValue='0'
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Row 1: Cards & Credit Card */}
			<div className='row g-5 g-xl-6 mb-8'>
				{[
					{
						value: formatCurrency(stats?.totalCredit || 0),
						icon: 'bi-credit-card-2-front',
						label: 'Wallet Debit &\nCredit Balance',
					},
					{
						value: formatCurrency(stats?.totalDebit || 0),
						icon: 'bi-arrow-left-right',
						label: 'Transfer\nPaid Out',
					},
					{
						value: stats?.pendingRequestsCount || 0,
						icon: 'bi-shield-check',
						label: 'Pending\nRequests',
					},
					{
						value: stats?.totalTransactionsCount || 0,
						icon: 'bi-mortarboard',
						label: 'Total\nTransactions',
					},
				].map((item, idx) => (
					<div
						className='col-md-3 col-6'
						key={idx}>
						<div
							className='card border-0 shadow-sm text-center h-100'
							style={{ borderRadius: '20px' }}>
							<div className='card-body p-6 d-flex flex-column justify-content-center align-items-center'>
								<h2
									className='text-dark fw-bolder mb-5'
									style={{ fontSize: '1.7rem' }}>
									{item.value}
								</h2>
								<i
									className={`bi ${item.icon} mb-5`}
									style={{ fontSize: '2.5rem', color: '#6B50FF' }}></i>
								<span
									className='text-muted fw-semibold fs-8 text-center'
									style={{ whiteSpace: 'pre-line', lineHeight: '1.4' }}>
									{item.label}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Row 2: Transactions & Pending Requests */}
			<div className='row g-5 g-xl-6 mb-6'>
				<div className='col-xl-8'>
					{/* Transaction History */}
					<div
						className='card border-0 shadow-sm h-100'
						style={{ borderRadius: '20px' }}>
						<div className='card-header border-0 pt-8 pb-2 px-8'>
							<div className='d-flex align-items-center justify-content-between w-100 flex-wrap gap-2'>
								<div>
									<h3 className='card-title fw-bold text-dark fs-3 mb-1'>Transaction History</h3>
									<div className='text-muted fs-7 fw-semibold'>Recent Activity</div>
								</div>
								<div>
									<LengthMenu
										expenseData={recentTransactions}
										handleItemsPerPageChange={handleItemsPerPageChange}
									/>
								</div>
							</div>
						</div>
						<div className='card-body px-8 py-4'>
							<div className='table-responsive'>
								<table className='table table-borderless align-middle gs-0 gy-4'>
									<tbody>
										{recentTransactions.map((row, i) => (
											<tr key={i}>
												<td className='w-50px'>
													<div className='symbol symbol-40px symbol-circle'>
														<div
															className='symbol-label'
															style={{
																backgroundColor: '#b5b5c3',
																color: 'white',
																fontWeight: 'bold',
																fontSize: '12px',
															}}>
															{row.name.charAt(0)}
														</div>
													</div>
												</td>
												<td className='min-w-150px'>
													<span className='text-dark fw-bold d-block fs-7'>{row.name}</span>
												</td>
												<td className='min-w-150px'>
													<span className='text-dark fw-bold d-block fs-7'>{row.cat}</span>
												</td>
												<td className='min-w-100px'>
													<span className='text-dark fw-bold d-block fs-7'>
														{new Date(row.date).toLocaleDateString('en-GB', {
															day: '2-digit',
															month: 'short',
															year: 'numeric',
														})}
													</span>
												</td>
												<td className='min-w-100px'>
													<span
														className={`fw-bold d-block fs-7 ${
															row.type === 'Credit' ? 'text-success' : 'text-danger'
														}`}>
														{row.type === 'Credit' ? '+' : '-'} ₹ {row.amt.toLocaleString()}
													</span>
												</td>
												<td className='text-end'>
													<span className='fw-bold fs-7'>{row.status}</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{recentTransactions.length > 0 && (
								<div className='justify-content-end mt-4'>
									<UsersListPagination
										totalPages={transactionPagination.totalPages}
										currentPage={transactionPagination.currentPage}
										onPageChange={handlePageChange}
									/>
								</div>
							)}
							{recentTransactions.length === 0 && !loading && (
								<div className='text-center text-muted py-10'>No records found</div>
							)}
						</div>
					</div>
				</div>

				<div className='col-xl-4'>
					{/* Pending Requests */}
					<div
						className='card border-0 shadow-sm h-100'
						style={{ borderRadius: '20px' }}>
						<div className='card-header border-0 pt-8 pb-2 px-8'>
							<div>
								<h3 className='card-title fw-bold text-dark fs-3 mb-1'>Pending Requests</h3>
								<div className='text-muted fs-7 fw-semibold'>Active submissions</div>
							</div>
						</div>
						<div className='card-body px-8 py-5'>
							{pendingRequests.map((item, i) => (
								<div
									className='d-flex align-items-center mb-7'
									key={i}>
									<div
										className='symbol symbol-45px me-4 shadow-sm'
										style={{ borderRadius: '12px' }}>
										<div
											className='symbol-label'
											style={{ backgroundColor: '#f4f0ff' }}>
											<i
												className={`bi ${item.icon} fs-3`}
												style={{ color: '#6B50FF' }}></i>
										</div>
									</div>
									<div className='flex-grow-1'>
										<span className='text-dark fw-bold fs-6 d-block'>{item.title}</span>
										<span className='text-muted fw-semibold fs-8'>{item.sub}</span>
									</div>
									<span className='text-dark fw-bold fs-5'>₹ {item.amt.toLocaleString()}</span>
								</div>
							))}
							{pendingRequests.length === 0 && (
								<div className='text-center text-muted py-10'>No pending requests</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Row 3: Balance Chart & Recent Payouts */}
			<div className='row g-5 g-xl-6'>
				<div className='col-xl-8'>
					{/* Balance Chart */}
					<div
						className='card border-0 shadow-sm h-100'
						style={{ borderRadius: '20px' }}>
						<div className='card-header border-0 pt-8 pb-0 px-8'>
							<div>
								<h3 className='card-title fw-bold text-dark fs-3 mb-1'>Balance</h3>
								<div className='text-muted fs-7 fw-semibold'>Last 12 Months</div>
							</div>
						</div>
						<div className='card-body p-0 px-5 pb-5 d-flex flex-column justify-content-end'>
							<Chart
								options={dynamicChartOptions}
								series={dynamicChartSeries}
								type='bar'
								height={220}
							/>
						</div>
					</div>
				</div>

				<div className='col-xl-4'>
					{/* Recent Payouts */}
					<div
						className='card border-0 shadow-sm h-100'
						style={{ borderRadius: '20px' }}>
						<div className='card-header border-0 pt-8 pb-2 px-8'>
							<div>
								<h3 className='card-title fw-bold text-dark fs-3 mb-1'>Recent Payouts</h3>
								<div className='text-muted fs-7 fw-semibold'>Last 30 Days</div>
							</div>
						</div>
						<div className='card-body px-8 py-5'>
							{recentTransactions
								.filter((t: any) => t.type === 'Debit')
								.slice(0, 3)
								.map((item: any, i: number) => (
									<div
										className='d-flex align-items-center mb-7'
										key={i}>
										<div className='symbol symbol-40px me-4'>
											<div className='symbol-label bg-transparent'>
												<i
													className='bi bi-arrow-down-left-circle fs-2'
													style={{ color: '#f1416c' }}></i>
											</div>
										</div>
										<div className='flex-grow-1'>
											<span className='text-dark fw-bold fs-6 d-block'>{item.name}</span>
											<span className='text-muted fw-semibold fs-8'>
												{new Date(item.date).toLocaleDateString('en-GB')} - {item.status}
											</span>
										</div>
										<span className='text-dark fw-bold fs-5'>₹ {item.amt.toLocaleString()}</span>
									</div>
								))}
							{recentTransactions.filter((t: any) => t.type === 'Debit').length === 0 && (
								<div className='text-center text-muted py-10'>No recent payouts</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AccountDashboard
