import ApexCharts, { ApexOptions } from 'apexcharts'
import React, { useEffect, useRef } from 'react'
import { getCSS, getCSSVariableValue } from '../../../../_metronic/assets/ts/_utils'
import { useThemeMode } from '../../../../_metronic/partials'

type Props = {
	className: string
	invoiceData?: any
	categoryName?: any
}

const NutritionCharts1: React.FC<Props> = ({ className, invoiceData, categoryName }) => {
	const chartRef = useRef<HTMLDivElement | null>(null)
	const { mode } = useThemeMode()

	const refreshChart = () => {
		if (!chartRef.current) {
			console.error('Chart container not found')
			return
		}

		const height = parseInt(getCSS(chartRef.current, 'height'), 10)

		const validData = Array.isArray(invoiceData)
			? invoiceData
			: [
					categoryName === 'Fwg'
						? invoiceData?.total_net_amount | 0
						: categoryName === 'Gcs'
						? invoiceData?.total_totalPayment ?? 0
						: invoiceData?.total_amount ?? 0,
					categoryName === 'Fwg'
						? invoiceData?.total_paid_amount | 0
						: categoryName === 'Gcs'
						? invoiceData?.total_paidPayment ?? 0
						: invoiceData?.total_paid_amount ?? 0,
					categoryName === 'Fwg'
						? invoiceData?.total_due_amount | 0
						: categoryName === 'Gcs'
						? invoiceData?.total_due_amount ?? 0
						: invoiceData?.total_unpaid_amount ?? 0,
			  ]

		try {
			const chart = new ApexCharts(chartRef.current, getChartOptions(height, validData))
			chart.render()
			return chart
		} catch (error) {
			console.error('Error rendering chart:', error)
		}
	}

	useEffect(() => {
		const chart = refreshChart()
		return () => {
			if (chart) {
				chart.destroy()
			}
		}
	}, [invoiceData, mode]) // Added invoiceData to dependencies

	return (
		<div className={`${className}`}>
			<h2 className='m-6 mb-0'>Total Invoice</h2>
			<div className='card-body'>
				<div
					ref={chartRef}
					id='kt_charts_widget_7_chart'
					style={{ height: '300px' }}
					className='card-rounded-bottom'></div>
			</div>
		</div>
	)
}

export { NutritionCharts1 }

function getChartOptions(height: number, invoiceData: any): ApexOptions {
	const labelColor = getCSSVariableValue('--bs-gray-500')

	const colorInfo = getCSSVariableValue('--bs-info')

	return {
		series: [
			{
				name: 'Amount',
				data: invoiceData, // Ensure this is an array
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
				borderRadius: 5,
				columnWidth: '40%',
			},
		},
		stroke: {
			curve: 'smooth',
			colors: [colorInfo],
			width: 2,
		},
		xaxis: {
			categories: ['Total Amount', 'Paid Amount', 'Due Amount'],
			labels: {
				style: {
					colors: labelColor,
				},
			},
		},
		yaxis: {
			labels: {
				style: {
					colors: labelColor,
				},
			},
		},
		dataLabels: {
			enabled: false,
		},
		fill: {
			type: 'solid',
			opacity: 1,
		},
		legend: {
			show: true,
			position: 'bottom',
		},
		tooltip: {
			style: {
				fontSize: '12px',
			},
			y: {
				formatter: function (val) {
					return '₹' + val
				},
			},
		},
		colors: [colorInfo], // Adjust colors based on data
	}
}
