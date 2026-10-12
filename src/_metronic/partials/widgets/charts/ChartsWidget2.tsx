/* eslint-disable jsx-a11y/anchor-is-valid */
import ApexCharts, { ApexOptions } from 'apexcharts'
import React, { useEffect, useRef } from 'react'
import { getCSS, getCSSVariableValue } from '../../../assets/ts/_utils'
import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'

type Props = {
	className: string
}

const ChartsWidget2: React.FC<Props> = ({ className }) => {
	const chartRef = useRef<HTMLDivElement | null>(null)
	const { mode } = useThemeMode()

	const refreshChart = () => {
		if (!chartRef.current) {
			return
		}

		const height = parseInt(getCSS(chartRef.current, 'height'))

		const chart = new ApexCharts(chartRef.current, getChartOptions(height))
		if (chart) {
			chart.render()
		}

		return chart
	}

	useEffect(() => {
		const chart = refreshChart()
		return () => {
			if (chart) {
				chart.destroy()
			}
		}
	}, [chartRef, mode])

	return (
		<div className={`card ${className}`}>
			{/* begin::Header */}
			<div className='card-header border-0 pt-5'>
				<h3 className='card-title align-items-start flex-column'>
					<span className='card-label fw-bold fs-3 mb-1'>Recent Orders</span>

					<span className='text-muted fw-semibold fs-7'>Yesterday Total is 650 orders</span>
				</h3>
			</div>
			{/* end::Header */}

			{/* begin::Body */}
			<div className='card-body'>
				{/* begin::Chart */}
				<div
					ref={chartRef}
					id='kt_charts_widget_2_chart'
					style={{ height: '350px' }}></div>
				{/* end::Chart */}
			</div>
			{/* end::Body */}
		</div>
	)
}

export { ChartsWidget2 }

function getChartOptions(height: number): ApexOptions {
	const labelColor = getCSSVariableValue('--bs-gray-500')
	const borderColor = getCSSVariableValue('--bs-gray-200')
	const baseColor = getCSSVariableValue('--bs-success')
	const secondaryColor = getCSSVariableValue('--bs-gray-300')

	return {
		series: [
			{
				name: 'Sales',
				data: [44, 55, 57, 56, 71, 88],
			},
		],
		chart: {
			fontFamily: 'inherit',
			type: 'bar',
			height: height,
			toolbar: {
				show: false,
			},
		},
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: '50%',
				borderRadius: 5,
			},
		},
		legend: {
			show: false,
		},
		dataLabels: {
			enabled: false,
		},
		stroke: {
			show: true,
			width: 2,
			colors: ['transparent'],
		},
		xaxis: {
			categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
			axisBorder: {
				show: false,
			},
			axisTicks: {
				show: false,
			},
			labels: {
				style: {
					colors: labelColor,
					fontSize: '12px',
				},
			},
		},
		yaxis: {
			labels: {
				style: {
					colors: labelColor,
					fontSize: '12px',
				},
			},
		},
		fill: {
			opacity: 1,
		},
		states: {
			normal: {
				filter: {
					type: 'none',
					value: 0,
				},
			},
			hover: {
				filter: {
					type: 'none',
					value: 0,
				},
			},
			active: {
				allowMultipleDataPointsSelection: false,
				filter: {
					type: 'none',
					value: 0,
				},
			},
		},
		tooltip: {
			style: {
				fontSize: '12px',
			},
			y: {
				formatter: function (val) {
					return '$' + val + ' thousands'
				},
			},
		},
		colors: [baseColor, secondaryColor],
		grid: {
			borderColor: borderColor,
			strokeDashArray: 4,
			yaxis: {
				lines: {
					show: true,
				},
			},
		},
	}
}
