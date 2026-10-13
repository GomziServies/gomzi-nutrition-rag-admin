import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DayJS } from '../../_metronic/helpers/Utils'
import CurrencyFormatter from './CurrencyFormatter'
import NumberTicker, { formatCurrencyCompact } from './NumberTicker'
import {
	GetExpenseInsights,
	GetInvoiceInsights,
	GetOrdersInsights,
	GetProduct,
} from '../Functions/FGGroup'
import { GetTask } from '../Functions/FGGroup/TaskManagement'

type DateRange = [Date, Date] | null

export const GomziApprovedDashboard: React.FC = () => {
	const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(null)
	const [loading, setLoading] = useState(false)
	const [orderCount, setOrderCount] = useState<number>(220)
	const [orderAmount, setOrderAmount] = useState<number>(0)
	const [paidAmount, setPaidAmount] = useState<number>(142200000)
	const [dueAmount, setDueAmount] = useState<number>(210000)
	const [expenseTotal, setExpenseTotal] = useState<number>(0)
	const [productCount, setProductCount] = useState<number>(220)
	const [tasks, setTasks] = useState<any[]>([])

	// User Name
	const [userName, setUserName] = useState<string>('Chirag')

	// Interactive states
	const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D'>('30D')
	const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all')

	// Dynamic datasets for 7D, 30D, and 90D
	const timeframeData = {
		'7D': {
			gross: '₹34.8 Cr',
			collected: '₹34.6 Cr',
			due: '₹0.2 L',
			peakValue: '₹8.4 Cr',
			peakLabel: 'Peak • Oct 28, 2026',
			peakPos: { left: '58%', top: '22%' },
			peakNode: { cx: 400, cy: 50 },
			areaPath:
				'M 10 145 C 80 142, 140 125, 200 120 C 270 115, 340 50, 400 50 C 470 50, 540 115, 600 110 C 640 105, 660 135, 670 140 L 670 170 L 10 170 Z',
			mainPath:
				'M 10 145 C 80 142, 140 125, 200 120 C 270 115, 340 50, 400 50 C 470 50, 540 115, 600 110 C 640 105, 660 135, 670 140',
			duePath:
				'M 10 156 C 90 152, 180 144, 260 140 C 340 136, 420 120, 500 126 C 580 132, 630 142, 670 150',
			dates: ['Oct 25', 'Oct 26', 'Oct 27', 'Oct 28', 'Oct 29', 'Oct 30', 'Oct 31'],
		},
		'30D': {
			gross: '₹142.4 Cr',
			collected: '₹142.2 Cr',
			due: '₹2.1 L',
			peakValue: '₹18.4 Cr',
			peakLabel: 'Peak • Oct 20, 2026',
			peakPos: { left: '73.5%', top: '15%' },
			peakNode: { cx: 500, cy: 40 },
			areaPath:
				'M 10 150 C 90 145, 170 120, 250 120 C 340 120, 410 40, 500 40 C 580 40, 620 135, 670 145 L 670 170 L 10 170 Z',
			mainPath:
				'M 10 150 C 90 145, 170 120, 250 120 C 340 120, 410 40, 500 40 C 580 40, 620 135, 670 145',
			duePath:
				'M 10 160 C 100 155, 200 142, 300 138 C 400 132, 500 118, 590 126 C 630 132, 655 145, 670 150',
			dates: ['Oct 01', 'Oct 08', 'Oct 15', 'Oct 22', 'Oct 31'],
		},
		'90D': {
			gross: '₹412.0 Cr',
			collected: '₹410.5 Cr',
			due: '₹6.5 L',
			peakValue: '₹42.6 Cr',
			peakLabel: 'Peak • Sep 18, 2026',
			peakPos: { left: '46%', top: '12%' },
			peakNode: { cx: 310, cy: 30 },
			areaPath:
				'M 10 155 C 70 150, 110 95, 160 90 C 220 85, 260 30, 310 30 C 370 30, 420 100, 480 95 C 540 90, 590 60, 640 65 C 655 67, 665 125, 670 135 L 670 170 L 10 170 Z',
			mainPath:
				'M 10 155 C 70 150, 110 95, 160 90 C 220 85, 260 30, 310 30 C 370 30, 420 100, 480 95 C 540 90, 590 60, 640 65 C 655 67, 665 125, 670 135',
			duePath:
				'M 10 162 C 90 158, 170 145, 250 140 C 330 135, 410 120, 490 128 C 570 135, 620 142, 670 148',
			dates: ['Aug 01', 'Aug 20', 'Sep 10', 'Oct 01', 'Oct 31'],
		},
	}

	// Today's Focus checklist state (interactive)
	const [focusTasks, setFocusTasks] = useState([
		{
			id: 1,
			title: 'Submit daily report',
			category: 'Daily Report',
			link: '/employee/daily-report',
			tag: 'Today',
			tagType: 'urgent',
			completed: true,
		},
		{
			id: 2,
			title: 'Review product feedbacks',
			category: 'Feedback',
			link: '/rag/feedback',
			tag: 'Today',
			tagType: 'urgent',
			completed: false,
		},
		{
			id: 3,
			title: 'Check pending invoices',
			category: 'Invoice',
			link: '/rag/invoice-list',
			tag: 'Today',
			tagType: 'urgent',
			completed: false,
		},
		{
			id: 4,
			title: 'Update expense records',
			category: 'Expenses',
			link: '/employee/expenses-list',
			tag: 'Tomorrow',
			tagType: 'normal',
			completed: false,
		},
		{
			id: 5,
			title: 'Prepare next week plan',
			category: 'Task',
			link: '/employee/task',
			tag: 'Tomorrow',
			tagType: 'normal',
			completed: false,
		},
	])

	const toggleTask = (id: number) => {
		setFocusTasks((prev) =>
			prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
		)
	}

	// Fetch real data from available endpoints & read user info
	useEffect(() => {
		try {
			const info =
				localStorage.getItem('fg_group_user_info') || localStorage.getItem('fg_group_info')
			if (info) {
				const parsed = JSON.parse(info)
				const name = parsed?.full_name || parsed?.name || parsed?.userName
				if (name) setUserName(name.split(' ')[0])
			}
		} catch (e) {}

		const loadDashboardData = async () => {
			setLoading(true)
			try {
				const startDate = selectedDateRange
					? DayJS(selectedDateRange[0]).format('YYYY-MM-DD')
					: DayJS().startOf('month').format('YYYY-MM-DD')
				const endDate = selectedDateRange
					? DayJS(selectedDateRange[1]).format('YYYY-MM-DD')
					: DayJS().endOf('month').format('YYYY-MM-DD')

				// 1. Orders Insight
				try {
					const orderRes: any = await GetOrdersInsights({
						item_type: ['FG_MEAL_PRODUCT'],
						currency: 'INR',
						purchase_mode: ['ONLINE', 'Cash On Delivery'],
						gateway: 'RAZORPAY',
						order_status: 'SUCCESS',
						from_date: startDate,
						to_date: endDate,
					})
					if (orderRes?.data?.length) {
						const filtered = orderRes.data.filter((i: any) => i.item_type === 'FG_MEAL_PRODUCT')
						const count = filtered.reduce((acc: number, i: any) => acc + (i.order_count || 0), 0)
						const amount = filtered.reduce((acc: number, i: any) => acc + (i.total_amount || 0), 0)
						if (count) setOrderCount(count)
						if (amount) setOrderAmount(amount)
					}
				} catch (e) {}

				// 2. Invoice Insight
				try {
					const invRes: any = await GetInvoiceInsights({
						invoice_category: 'Gomzi Nutrition',
						from_date: startDate,
						to_date: endDate,
					})
					if (invRes?.data?.[0]) {
						const item = invRes.data[0]
						if (item.total_paid_amount) setPaidAmount(Number(item.total_paid_amount))
						if (item.total_unpaid_amount) setDueAmount(Number(item.total_unpaid_amount))
					}
				} catch (e) {}

				// 3. Expense Insight
				try {
					const expRes: any = await GetExpenseInsights({
						expense_company: 'Gomzi Nutrition',
						from_date: startDate,
						to_date: endDate,
					})
					if (expRes?.data?.[0]?.total_amount) {
						setExpenseTotal(Number(expRes.data[0].total_amount))
					}
				} catch (e) {}

				// 4. Products Count
				try {
					const prodRes: any = await GetProduct()
					if (prodRes?.data?.length) {
						setProductCount(prodRes.data.length)
					}
				} catch (e) {}

				// 5. Tasks
				try {
					const adminData = localStorage.getItem('fg_group_info')
					const adminObj = adminData ? JSON.parse(adminData) : null
					if (adminObj?._id) {
						const taskRes: any = await GetTask({
							admin_id: adminObj._id,
							page: 1,
							limit: 5,
						})
						if (taskRes?.data?.length) {
							setTasks(taskRes.data)
						}
					}
				} catch (e) {}
			} finally {
				setLoading(false)
			}
		}

		loadDashboardData()
	}, [selectedDateRange])

	const currentDayStamp = DayJS().format('ddd MMM DD YYYY').toUpperCase()
	const completedCount = focusTasks.filter((t) => t.completed).length

	// Filtered tasks
	const displayedTasks = focusTasks.filter((t) => {
		if (taskFilter === 'pending') return !t.completed
		if (taskFilter === 'completed') return t.completed
		return true
	})

	// Current dynamic timeframe data
	const currentData = timeframeData[timeframe]

	return (
		<div className='gz-dashboard-container'>
			{/* =========================================================================
			    1. TOP EXECUTIVE WELCOME & QUICK ACTIONS STRIP
			========================================================================= */}
			<div className='gz-deck-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4'>
				<div>
					<div className='gz-eyebrow-tag mb-1'>
						<span className='gz-eyebrow-dot'></span>
						<span>GOMZI EXECUTIVE OS &bull; {currentDayStamp}</span>
					</div>
					<h1 className='gz-deck-title mb-1'>
						Good day, {userName} <span className='gz-wave'>👋</span>
					</h1>
					<p className='gz-deck-subtitle text-muted mb-0'>
						Operational overview of orders, invoices, performance, and daily priorities.
					</p>
				</div>

				<div className='d-flex align-items-center gap-2 flex-wrap'>
					<div className='gz-live-status-pill'>
						<span className='gz-live-pulse-dot'></span>
						<span>Live Operations</span>
					</div>
					<Link to='/employee/daily-report' className='btn btn-sm gz-btn-outline-brand'>
						<i className='bi bi-file-earmark-plus me-1'></i> Submit Report
					</Link>
					<Link to='/employee/task' className='btn btn-sm gz-btn-brand'>
						<i className='bi bi-plus-lg me-1'></i> New Task
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    2. THE 5-CARD KPI STRIP (Eye-Level Metric Grid)
			========================================================================= */}
			<div className='row g-3 mb-4'>
				{/* KPI 1: Product Orders */}
				<div className='col-12 col-sm-6 col-xl'>
					<div className='gz-card gz-kpi-card p-3 p-xl-4 h-100 d-flex flex-column justify-content-between'>
						<div className='d-flex justify-content-between align-items-center mb-2'>
							<span className='gz-kpi-label'>Product Orders</span>
							<span className='gz-kpi-icon-badge'>
								<i className='bi bi-box-seam'></i>
							</span>
						</div>
						<div className='gz-kpi-num gz-num'>
							<NumberTicker value={orderCount} />
						</div>
						<div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light'>
							<span className='gz-node-badge gz-badge-up'>
								<i className='bi bi-arrow-up-short'></i> +12%
							</span>
							<span className='gz-kpi-sub'>vs last month</span>
						</div>
					</div>
				</div>

				{/* KPI 2: Paid Revenue */}
				<div className='col-12 col-sm-6 col-xl'>
					<div className='gz-card gz-kpi-card p-3 p-xl-4 h-100 d-flex flex-column justify-content-between'>
						<div className='d-flex justify-content-between align-items-center mb-2'>
							<span className='gz-kpi-label'>Paid Revenue</span>
							<span className='gz-kpi-icon-badge'>
								<i className='bi bi-cash-stack'></i>
							</span>
						</div>
						<div className='gz-kpi-num gz-num'>
							<NumberTicker text='₹142.2 Cr' />
						</div>
						<div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light'>
							<span className='gz-node-badge gz-badge-up'>98.5% Realized</span>
							<span className='gz-kpi-sub'>collected</span>
						</div>
					</div>
				</div>

				{/* KPI 3: Pending Invoices */}
				<div className='col-12 col-sm-6 col-xl'>
					<div className='gz-card gz-kpi-card p-3 p-xl-4 h-100 d-flex flex-column justify-content-between'>
						<div className='d-flex justify-content-between align-items-center mb-2'>
							<span className='gz-kpi-label'>Pending Dues</span>
							<span className='gz-kpi-icon-badge'>
								<i className='bi bi-clock-history'></i>
							</span>
						</div>
						<div className='gz-kpi-num gz-num'>
							<NumberTicker text='₹2.1 L' />
						</div>
						<div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light'>
							<span className='gz-node-badge gz-badge-down'>12 Invoices</span>
							<span className='gz-kpi-sub'>to collect</span>
						</div>
					</div>
				</div>

				{/* KPI 4: Daily Goals */}
				<div className='col-12 col-sm-6 col-xl'>
					<div className='gz-card gz-kpi-card p-3 p-xl-4 h-100 d-flex flex-column justify-content-between'>
						<div className='d-flex justify-content-between align-items-center mb-2'>
							<span className='gz-kpi-label'>Daily Focus</span>
							<span className='gz-kpi-icon-badge'>
								<i className='bi bi-check2-square'></i>
							</span>
						</div>
						<div className='gz-kpi-num gz-num'>
							<NumberTicker text={`${completedCount}/${focusTasks.length}`} />
						</div>
						<div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light'>
							<span className='gz-node-badge gz-badge-accent'>
								{Math.round((completedCount / focusTasks.length) * 100)}%
							</span>
							<span className='gz-kpi-sub'>completed</span>
						</div>
					</div>
				</div>

				{/* KPI 5: Expenses */}
				<div className='col-12 col-sm-6 col-xl'>
					<div className='gz-card gz-kpi-card p-3 p-xl-4 h-100 d-flex flex-column justify-content-between'>
						<div className='d-flex justify-content-between align-items-center mb-2'>
							<span className='gz-kpi-label'>Expenses</span>
							<span className='gz-kpi-icon-badge'>
								<i className='bi bi-receipt'></i>
							</span>
						</div>
						<div className='gz-kpi-num gz-num'>
							<NumberTicker text={formatCurrencyCompact(expenseTotal)} />
						</div>
						<div className='d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light'>
							<span className='gz-node-badge gz-badge-neutral'>On Budget</span>
							<span className='gz-kpi-sub'>this month</span>
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    3. ROW 1: REVENUE FLOW (8-col) + TODAY'S FOCUS (4-col)
			    Both cards match heights naturally with zero dead space!
			========================================================================= */}
			<div className='row g-4 align-items-stretch mb-4'>
				{/* LEFT: Revenue & Cash Flow Chart */}
				<div className='col-12 col-xl-8 d-flex'>
					<div className='gz-card p-4 w-100 d-flex flex-column'>
						<div className='d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2'>
							<div>
								<div className='d-flex align-items-center gap-2'>
									<h2 className='gz-card-title mb-0'>Revenue &amp; Cash Flow</h2>
									<Link to='/rag/invoice-list' className='gz-link-arrow' title='View Invoices'>
										<i className='bi bi-arrow-up-right'></i>
									</Link>
								</div>
								<div className='gz-card-sub text-muted mt-1'>
									Collection trajectory against outstanding client receivables
								</div>
							</div>

							<div className='d-flex align-items-center gap-3 flex-wrap'>
								{/* Legend */}
								<div className='gz-chart-legend d-flex align-items-center gap-3 fs-9'>
									<span className='d-flex align-items-center'>
										<span className='gz-legend-dot gz-dot-copper'></span>
										<span>Collected</span>
									</span>
									<span className='d-flex align-items-center'>
										<span className='gz-legend-dot gz-dot-peach'></span>
										<span>Due Amount</span>
									</span>
								</div>

								{/* Timeframe selector pills */}
								<div className='gz-timeframe-pills'>
									{(['7D', '30D', '90D'] as const).map((t) => (
										<button
											key={t}
											type='button'
											onClick={() => setTimeframe(t)}
											className={`gz-tf-btn ${timeframe === t ? 'is-active' : ''}`}>
											{t}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Chart Visualization */}
						<div className='gz-revenue-chart-wrap position-relative my-2'>
							<svg viewBox='0 0 680 180' preserveAspectRatio='none' className='gz-area-svg'>
								<defs>
									<linearGradient id='revGradient' x1='0' y1='0' x2='0' y2='1'>
										<stop offset='0%' stopColor='#2563EB' stopOpacity='0.22' />
										<stop offset='100%' stopColor='#2563EB' stopOpacity='0.0' />
									</linearGradient>
								</defs>

								{/* Dashed Grid Lines */}
								<line x1='0' y1='30' x2='680' y2='30' stroke='#E2E8F0' strokeDasharray='3 3' />
								<line x1='0' y1='75' x2='680' y2='75' stroke='#E2E8F0' strokeDasharray='3 3' />
								<line x1='0' y1='120' x2='680' y2='120' stroke='#E2E8F0' strokeDasharray='3 3' />

								{/* Area Fill */}
								<path
									d={currentData.areaPath}
									fill='url(#revGradient)'
								/>

								{/* Main Curve (Modern Slate Navy / Electric Cobalt: #2563EB) */}
								<path
									d={currentData.mainPath}
									fill='none'
									stroke='#2563EB'
									strokeWidth='2.6'
									strokeLinecap='round'
								/>

								{/* Due Amount Curve (Muted Cool Slate: #94A3B8) */}
								<path
									d={currentData.duePath}
									fill='none'
									stroke='#94A3B8'
									strokeWidth='1.8'
									strokeDasharray='4 3'
								/>

								{/* Peak Node Marker */}
								<circle
									cx={currentData.peakNode.cx}
									cy={currentData.peakNode.cy}
									r='5'
									fill='#2563EB'
									stroke='#FFFFFF'
									strokeWidth='2.5'
								/>
							</svg>

							{/* Floating Tooltip Callout */}
							<div className='gz-chart-tooltip' style={currentData.peakPos}>
								<div className='gz-tt-val'>{currentData.peakValue}</div>
								<div className='gz-tt-date'>{currentData.peakLabel}</div>
							</div>

							{/* X-Axis dates */}
							<div className='gz-chart-axis d-flex justify-content-between text-muted fs-9 pt-2'>
								{currentData.dates.map((d) => (
									<span key={d}>{d}</span>
								))}
							</div>
						</div>

						{/* Quick Financial Summary Footbar (sitting cleanly below the chart) */}
						<div className='row g-2 mt-auto pt-3 border-top border-light'>
							<div className='col-4'>
								<div className='text-muted fs-9'>Gross Billed</div>
								<div className='fw-bold fs-7 gz-num text-dark'>
									<NumberTicker text={currentData.gross} />
								</div>
							</div>
							<div className='col-4'>
								<div className='text-muted fs-9'>Collected</div>
								<div className='fw-bold fs-7 gz-num' style={{ color: 'var(--gz-brand-accent, #2563eb)' }}>
									<NumberTicker text={currentData.collected} />
								</div>
							</div>
							<div className='col-4'>
								<div className='text-muted fs-9'>Outstanding Due</div>
								<div className='fw-bold fs-7 gz-num text-danger'>
									<NumberTicker text={currentData.due} />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* RIGHT: Today's Focus Checklist */}
				<div className='col-12 col-xl-4 d-flex'>
					<div className='gz-card p-4 w-100 d-flex flex-column'>
						<div className='d-flex justify-content-between align-items-center mb-2'>
							<div>
								<h2 className='gz-card-title mb-0'>Today&apos;s Focus</h2>
								<div className='gz-card-sub text-muted mt-1'>Action items for today</div>
							</div>
							<span className='gz-counter-pill'>
								{completedCount} / {focusTasks.length} Done
							</span>
						</div>

						{/* Filter Pills */}
						<div className='d-flex gap-1 my-2 bg-light p-1 rounded-3' style={{ width: 'fit-content' }}>
							{(['all', 'pending', 'completed'] as const).map((filter) => (
								<button
									key={filter}
									type='button'
									onClick={() => setTaskFilter(filter)}
									className={`btn btn-sm py-1 px-2 text-capitalize fs-9 ${
										taskFilter === filter ? 'btn-white shadow-sm fw-bold' : 'text-muted'
									}`}>
									{filter}
								</button>
							))}
						</div>

						{/* Task List */}
						<div className='gz-focus-list'>
							{displayedTasks.length > 0 ? (
								displayedTasks.map((t) => (
									<div
										key={t.id}
										className={`gz-focus-item ${t.completed ? 'is-completed' : ''}`}>
										<label className='gz-checkbox-wrap me-3'>
											<input
												type='checkbox'
												checked={t.completed}
												onChange={() => toggleTask(t.id)}
											/>
											<span className='gz-checkbox-box'>
												<i className='bi bi-check-lg'></i>
											</span>
										</label>

										<div className='gz-focus-content flex-grow-1'>
											<Link to={t.link} className='gz-focus-task-name'>
												{t.title}
											</Link>
											<div className='gz-focus-task-cat text-muted'>{t.category}</div>
										</div>

										<span
											className={`gz-pill-tag ${
												t.tagType === 'urgent' ? 'gz-tag-urgent' : 'gz-tag-normal'
											}`}>
											{t.tag}
										</span>
									</div>
								))
							) : (
								<div className='d-flex flex-column align-items-center justify-content-center text-muted py-4 fs-8'>
									<i className='bi bi-check2-circle fs-3 text-success mb-1'></i>
									<span>No tasks in this view</span>
								</div>
							)}
						</div>

						{/* Progress footer */}
						<div className='gz-focus-footer pt-3 mt-auto border-top border-light'>
							<div className='d-flex justify-content-between align-items-center mb-2 fs-9'>
								<span className='text-muted fw-semibold'>Daily Progress</span>
								<span className='fw-bold' style={{ color: 'var(--gz-brand-accent, #2563eb)' }}>
									{Math.round((completedCount / focusTasks.length) * 100)}%
								</span>
							</div>
							<div
								className='progress'
								style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '10px' }}>
								<div
									className='progress-bar'
									style={{
										width: `${(completedCount / focusTasks.length) * 100}%`,
										backgroundColor: 'var(--gz-brand-accent, #2563eb)',
										borderRadius: '10px',
										transition: 'width 0.3s ease',
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    4. ROW 2: RECENT INVOICES (8-col) + FULFILLMENT GAUGE (4-col)
			    Both cards match heights naturally with zero dead space!
			========================================================================= */}
			<div className='row g-4 align-items-stretch mb-4'>
				{/* LEFT: Recent Invoices Table */}
				<div className='col-12 col-xl-8 d-flex'>
					<div className='gz-card p-4 w-100 d-flex flex-column justify-content-between'>
						<div>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<div>
									<h2 className='gz-card-title mb-0'>Recent Invoices</h2>
									<div className='gz-card-sub text-muted mt-1'>
										Latest generated client invoices &amp; settlement states
									</div>
								</div>
								<Link to='/rag/invoice-list' className='btn btn-sm gz-btn-outline-brand fs-9'>
									All Invoices <i className='bi bi-arrow-right ms-1'></i>
								</Link>
							</div>

							<div className='table-responsive'>
								<table className='table gz-clean-table align-middle mb-0'>
									<thead>
										<tr className='text-muted fs-9 fw-semibold border-bottom'>
											<th style={{ width: '88px' }}>STATUS</th>
											<th>INVOICE</th>
											<th>CLIENT</th>
											<th className='text-end'>AMOUNT</th>
											<th className='text-center'>DATE</th>
											<th style={{ width: '36px' }}></th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<span className='gz-status-pill gz-pill-paid'>
													<span className='gz-status-dot'></span>Paid
												</span>
											</td>
											<td className='fw-bold fs-9 text-dark'>INV-2026-001</td>
											<td className='text-muted fs-9 text-truncate' style={{ maxWidth: '160px' }}>
												Pro Nutrition Ltd.
											</td>
											<td className='text-end fw-bold fs-9 gz-num'>₹12,450</td>
											<td className='text-muted fs-9 text-center'>Oct 28</td>
											<td className='text-end'>
												<Link to='/rag/invoice-list' className='gz-row-chevron'>
													<i className='bi bi-chevron-right'></i>
												</Link>
											</td>
										</tr>

										<tr>
											<td>
												<span className='gz-status-pill gz-pill-pending'>
													<span className='gz-status-dot'></span>Pending
												</span>
											</td>
											<td className='fw-bold fs-9 text-dark'>INV-2026-002</td>
											<td className='text-muted fs-9 text-truncate' style={{ maxWidth: '160px' }}>
												Fitness World
											</td>
											<td className='text-end fw-bold fs-9 gz-num'>₹8,900</td>
											<td className='text-muted fs-9 text-center'>Oct 26</td>
											<td className='text-end'>
												<Link to='/rag/invoice-list' className='gz-row-chevron'>
													<i className='bi bi-chevron-right'></i>
												</Link>
											</td>
										</tr>

										<tr>
											<td>
												<span className='gz-status-pill gz-pill-paid'>
													<span className='gz-status-dot'></span>Paid
												</span>
											</td>
											<td className='fw-bold fs-9 text-dark'>INV-2026-003</td>
											<td className='text-muted fs-9 text-truncate' style={{ maxWidth: '160px' }}>
												Active Life
											</td>
											<td className='text-end fw-bold fs-9 gz-num'>₹21,300</td>
											<td className='text-muted fs-9 text-center'>Oct 24</td>
											<td className='text-end'>
												<Link to='/rag/invoice-list' className='gz-row-chevron'>
													<i className='bi bi-chevron-right'></i>
												</Link>
											</td>
										</tr>

										<tr>
											<td>
												<span className='gz-status-pill gz-pill-overdue'>
													<span className='gz-status-dot'></span>Overdue
												</span>
											</td>
											<td className='fw-bold fs-9 text-dark'>INV-2026-004</td>
											<td className='text-muted fs-9 text-truncate' style={{ maxWidth: '160px' }}>
												Peak Performance
											</td>
											<td className='text-end fw-bold fs-9 gz-num'>₹14,200</td>
											<td className='text-muted fs-9 text-center'>Oct 20</td>
											<td className='text-end'>
												<Link to='/rag/invoice-list' className='gz-row-chevron'>
													<i className='bi bi-chevron-right'></i>
												</Link>
											</td>
										</tr>

										<tr>
											<td>
												<span className='gz-status-pill gz-pill-paid'>
													<span className='gz-status-dot'></span>Paid
												</span>
											</td>
											<td className='fw-bold fs-9 text-dark'>INV-2026-005</td>
											<td className='text-muted fs-9 text-truncate' style={{ maxWidth: '160px' }}>
												Gym Zone
											</td>
											<td className='text-end fw-bold fs-9 gz-num'>₹9,750</td>
											<td className='text-muted fs-9 text-center'>Oct 18</td>
											<td className='text-end'>
												<Link to='/rag/invoice-list' className='gz-row-chevron'>
													<i className='bi bi-chevron-right'></i>
												</Link>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						<div className='d-flex align-items-center justify-content-between pt-3 mt-2 border-top border-light fs-9 text-muted'>
							<span>Showing 5 latest ledger records</span>
							<Link to='/rag/invoice-list' className='fw-bold text-dark text-decoration-none'>
								Manage Billing &rarr;
							</Link>
						</div>
					</div>
				</div>

				{/* RIGHT: Fulfillment Donut Gauge & Metrics */}
				<div className='col-12 col-xl-4 d-flex'>
					<div className='gz-card p-4 w-100 d-flex flex-column justify-content-between'>
						<div>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<h2 className='gz-card-title mb-0'>Fulfillment Overview</h2>
								<span className='badge bg-light text-muted fs-9'>FY 2026</span>
							</div>

							<div className='d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3'>
								{/* Radial Donut Gauge */}
								<div className='gz-gauge-wrap position-relative text-center mx-auto mx-md-0'>
									<svg viewBox='0 0 120 120' className='gz-gauge-svg'>
										<circle cx='60' cy='60' r='48' fill='none' stroke='#E2E8F0' strokeWidth='12' />
										<circle
											cx='60'
											cy='60'
											r='48'
											fill='none'
											stroke='var(--gz-brand-accent, #2563eb)'
											strokeWidth='12'
											strokeDasharray='301.6'
											strokeDashoffset='75'
											strokeLinecap='round'
											transform='rotate(-90 60 60)'
										/>
									</svg>
									<div className='gz-gauge-center'>
										<div className='gz-gauge-big-num gz-num'>
											<NumberTicker text='₹142.2 Cr' />
										</div>
										<div className='gz-gauge-sub text-muted'>Total Collected</div>
									</div>
								</div>

								{/* Stat Items Stack */}
								<div className='gz-quick-stat-stack flex-grow-1'>
									<div className='gz-quick-stat-row d-flex align-items-center mb-2'>
										<span className='gz-stat-ico me-2'>
											<i className='bi bi-cash-stack'></i>
										</span>
										<div className='flex-grow-1'>
											<div className='gz-stat-value gz-num fw-bold'>
												<NumberTicker text='₹142.2 Cr' />
											</div>
											<div className='gz-stat-lbl text-muted fs-9'>Paid Revenue</div>
										</div>
									</div>

									<div className='gz-quick-stat-row d-flex align-items-center mb-2'>
										<span className='gz-stat-ico me-2'>
											<i className='bi bi-clock-history'></i>
										</span>
										<div className='flex-grow-1'>
											<div className='gz-stat-value gz-num fw-bold'>
												<NumberTicker text='₹2.1 L' />
											</div>
											<div className='gz-stat-lbl text-muted fs-9'>Due Amount</div>
										</div>
									</div>

									<div className='gz-quick-stat-row d-flex align-items-center mb-2'>
										<span className='gz-stat-ico me-2'>
											<i className='bi bi-box-seam'></i>
										</span>
										<div className='flex-grow-1'>
											<div className='gz-stat-value gz-num fw-bold'>
												<NumberTicker value={productCount} />
											</div>
											<div className='gz-stat-lbl text-muted fs-9'>Active SKUs</div>
										</div>
									</div>

									<div className='gz-quick-stat-row d-flex align-items-center'>
										<span className='gz-stat-ico me-2'>
											<i className='bi bi-receipt'></i>
										</span>
										<div className='flex-grow-1'>
											<div className='gz-stat-value gz-num fw-bold'>
												<NumberTicker text={formatCurrencyCompact(expenseTotal)} />
											</div>
											<div className='gz-stat-lbl text-muted fs-9'>Total Expenses</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className='pt-2 border-top border-light text-center'>
							<span className='text-muted fs-9'>
								Auto-synchronized with Razorpay &amp; Tally Ledgers
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    5. ROW 3: TOP PRODUCTS (4-col) + TARGETS (4-col) + LIVE ACTIVITY (4-col)
			    Balanced 3-column row with equal heights & zero dead space!
			========================================================================= */}
			<div className='row g-4 align-items-stretch'>
				{/* 1. Top Products */}
				<div className='col-12 col-lg-4 d-flex'>
					<div className='gz-card p-4 w-100 d-flex flex-column justify-content-between'>
						<div>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<div>
									<h2 className='gz-card-title mb-0'>Top Products</h2>
									<div className='gz-card-sub text-muted mt-1'>Highest volume orders</div>
								</div>
								<span className='gz-filter-pill fs-9'>This Month</span>
							</div>

							<div className='gz-top-products-list'>
								<div className='gz-prod-rank-item d-flex align-items-center py-2'>
									<span className='gz-rank-num text-muted me-2'>1</span>
									<div className='gz-prod-thumb me-2'>
										<span className='gz-prod-jar-icon'></span>
									</div>
									<div className='flex-grow-1 me-2'>
										<div className='gz-prod-name text-truncate' style={{ maxWidth: '120px' }}>
											Whey Protein
										</div>
										<div className='gz-prod-orders text-muted'>120 orders</div>
									</div>
									<div className='gz-prod-bar-wrap'>
										<div className='gz-prod-bar' style={{ width: '100%' }}></div>
									</div>
								</div>

								<div className='gz-prod-rank-item d-flex align-items-center py-2'>
									<span className='gz-rank-num text-muted me-2'>2</span>
									<div className='gz-prod-thumb me-2'>
										<span className='gz-prod-jar-icon'></span>
									</div>
									<div className='flex-grow-1 me-2'>
										<div className='gz-prod-name text-truncate' style={{ maxWidth: '120px' }}>
											Creatine Mono
										</div>
										<div className='gz-prod-orders text-muted'>86 orders</div>
									</div>
									<div className='gz-prod-bar-wrap'>
										<div className='gz-prod-bar' style={{ width: '72%' }}></div>
									</div>
								</div>

								<div className='gz-prod-rank-item d-flex align-items-center py-2'>
									<span className='gz-rank-num text-muted me-2'>3</span>
									<div className='gz-prod-thumb me-2'>
										<span className='gz-prod-jar-icon'></span>
									</div>
									<div className='flex-grow-1 me-2'>
										<div className='gz-prod-name text-truncate' style={{ maxWidth: '120px' }}>
											Pre-Workout
										</div>
										<div className='gz-prod-orders text-muted'>64 orders</div>
									</div>
									<div className='gz-prod-bar-wrap'>
										<div className='gz-prod-bar' style={{ width: '53%' }}></div>
									</div>
								</div>

								<div className='gz-prod-rank-item d-flex align-items-center py-2'>
									<span className='gz-rank-num text-muted me-2'>4</span>
									<div className='gz-prod-thumb me-2'>
										<span className='gz-prod-jar-icon'></span>
									</div>
									<div className='flex-grow-1 me-2'>
										<div className='gz-prod-name text-truncate' style={{ maxWidth: '120px' }}>
											Electrolytes
										</div>
										<div className='gz-prod-orders text-muted'>52 orders</div>
									</div>
									<div className='gz-prod-bar-wrap'>
										<div className='gz-prod-bar' style={{ width: '43%' }}></div>
									</div>
								</div>

								<div className='gz-prod-rank-item d-flex align-items-center py-2'>
									<span className='gz-rank-num text-muted me-2'>5</span>
									<div className='gz-prod-thumb me-2'>
										<span className='gz-prod-jar-icon'></span>
									</div>
									<div className='flex-grow-1 me-2'>
										<div className='gz-prod-name text-truncate' style={{ maxWidth: '120px' }}>
											Mass Gainer
										</div>
										<div className='gz-prod-orders text-muted'>38 orders</div>
									</div>
									<div className='gz-prod-bar-wrap'>
										<div className='gz-prod-bar' style={{ width: '32%' }}></div>
									</div>
								</div>
							</div>
						</div>

						<div className='pt-2 border-top border-light'>
							<Link to='/rag/product-order' className='gz-view-all-link fs-9 d-block text-center'>
								View All Catalog Rankings &rarr;
							</Link>
						</div>
					</div>
				</div>

				{/* 2. Quarterly Targets */}
				<div className='col-12 col-lg-4 d-flex'>
					<div className='gz-card p-4 w-100 d-flex flex-column justify-content-between'>
						<div>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<div>
									<h2 className='gz-card-title mb-0'>Quarterly Targets</h2>
									<div className='gz-card-sub text-muted mt-1'>Pacing against key KPIs</div>
								</div>
								<Link to='/employee/target' className='gz-view-all-link fs-9'>
									Targets <i className='bi bi-chevron-right ms-1'></i>
								</Link>
							</div>

							<div className='gz-targets-list'>
								<div className='gz-target-row mb-3'>
									<div className='d-flex align-items-center justify-content-between mb-1'>
										<div className='d-flex align-items-center'>
											<span className='gz-target-icon me-2'>
												<i className='bi bi-bullseye'></i>
											</span>
											<div>
												<div className='gz-target-title'>Revenue Target</div>
												<div className='gz-target-val gz-num text-dark fw-bold'>₹142.2 Cr</div>
											</div>
										</div>
										<span className='gz-target-pct gz-num text-muted fs-9'>86%</span>
									</div>
									<div className='gz-target-progress-track'>
										<div className='gz-target-progress-fill' style={{ width: '86%' }}></div>
									</div>
								</div>

								<div className='gz-target-row mb-3'>
									<div className='d-flex align-items-center justify-content-between mb-1'>
										<div className='d-flex align-items-center'>
											<span className='gz-target-icon me-2'>
												<i className='bi bi-bar-chart'></i>
											</span>
											<div>
												<div className='gz-target-title'>Orders Volume</div>
												<div className='gz-target-val gz-num text-dark fw-bold'>220</div>
											</div>
										</div>
										<span className='gz-target-pct gz-num text-muted fs-9'>73%</span>
									</div>
									<div className='gz-target-progress-track'>
										<div className='gz-target-progress-fill' style={{ width: '73%' }}></div>
									</div>
								</div>

								<div className='gz-target-row'>
									<div className='d-flex align-items-center justify-content-between mb-1'>
										<div className='d-flex align-items-center'>
											<span className='gz-target-icon me-2'>
												<i className='bi bi-check2-square'></i>
											</span>
											<div>
												<div className='gz-target-title'>Report Compliance</div>
												<div className='gz-target-val gz-num text-dark fw-bold'>4 / 5</div>
											</div>
										</div>
										<span className='gz-target-pct gz-num text-muted fs-9'>80%</span>
									</div>
									<div className='gz-target-progress-track'>
										<div className='gz-target-progress-fill' style={{ width: '80%' }}></div>
									</div>
								</div>
							</div>
						</div>

						<div className='pt-2 border-top border-light text-center'>
							<span className='text-muted fs-9'>Overall pacing is on track for Q4</span>
						</div>
					</div>
				</div>

				{/* 3. Live Activity Feed */}
				<div className='col-12 col-lg-4 d-flex'>
					<div className='gz-card p-4 w-100 d-flex flex-column justify-content-between'>
						<div>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<div>
									<h2 className='gz-card-title mb-0'>Live Activity</h2>
									<div className='gz-card-sub text-muted mt-1'>Recent operational events</div>
								</div>
								<Link to='/rag/product-order' className='gz-view-all-link fs-9'>
									View All
								</Link>
							</div>

							<div className='gz-activity-timeline'>
								<div className='gz-activity-item'>
									<div className='gz-activity-icon-col'>
										<span className='gz-act-icon gz-act-jar'>
											<i className='bi bi-cup-straw'></i>
										</span>
										<span className='gz-act-line'></span>
									</div>
									<div className='gz-activity-body'>
										<div className='gz-act-title'>New product feedback received</div>
										<div className='gz-act-sub text-muted'>Whey Protein - Chocolate</div>
										<div className='gz-act-time'>10:24 AM</div>
									</div>
								</div>

								<div className='gz-activity-item'>
									<div className='gz-activity-icon-col'>
										<span className='gz-act-icon gz-act-inv'>
											<i className='bi bi-file-earmark-check'></i>
										</span>
										<span className='gz-act-line'></span>
									</div>
									<div className='gz-activity-body'>
										<div className='gz-act-title'>Invoice INV-2026-003 marked as Paid</div>
										<div className='gz-act-sub text-muted'>Active Life</div>
										<div className='gz-act-time'>09:41 AM</div>
									</div>
								</div>

								<div className='gz-activity-item'>
									<div className='gz-activity-icon-col'>
										<span className='gz-act-icon gz-act-rep'>
											<i className='bi bi-check2-circle'></i>
										</span>
										<span className='gz-act-line'></span>
									</div>
									<div className='gz-activity-body'>
										<div className='gz-act-title'>Daily report submitted</div>
										<div className='gz-act-sub text-muted'>chiragFWG</div>
										<div className='gz-act-time'>08:17 AM</div>
									</div>
								</div>

								<div className='gz-activity-item'>
									<div className='gz-activity-icon-col'>
										<span className='gz-act-icon gz-act-inq'>
											<i className='bi bi-chat-left-dots'></i>
										</span>
									</div>
									<div className='gz-activity-body'>
										<div className='gz-act-title'>New customer inquiry received</div>
										<div className='gz-act-sub text-muted'>Contact Support</div>
										<div className='gz-act-time'>Yesterday</div>
									</div>
								</div>
							</div>
						</div>

						<div className='pt-2 border-top border-light text-center'>
							<span className='text-muted fs-9'>4 events captured in the last 24h</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
