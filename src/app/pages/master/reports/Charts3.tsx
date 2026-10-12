import ApexCharts, { ApexOptions } from 'apexcharts'
import React, { useEffect, useRef } from 'react'
import { getCSS, getCSSVariableValue } from '../../../../_metronic/assets/ts/_utils'
import { useThemeMode } from '../../../../_metronic/partials'

type Props = {
	className: string
	rattingData?: any
}

const NutritionCharts3: React.FC<Props> = ({ className, rattingData }) => {
	if (!rattingData || rattingData.length === 0) {
		return <div>No data available</div>
	}
	const chartRef = useRef<HTMLDivElement | null>(null)
	const { mode } = useThemeMode()

	const refreshChart = () => {
		if (!chartRef.current) {
			return
		}

		const height = parseInt(getCSS(chartRef.current, 'height'))

		const chart = new ApexCharts(chartRef.current, getChartOptions(height, rattingData))
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
	}, [chartRef, mode, rattingData])

	return (
		<div className={`${className} py-md-4`}>
			<div className='card-body'>
				<div
					ref={chartRef}
					id='kt_charts_widget_7_chart'
					style={{ height: '350px' }}
					className='card-rounded-bottom'></div>
			</div>
		</div>
	)
}

export { NutritionCharts3 }

function getChartOptions(height: number, rattingData: any): ApexOptions {
	const strokeColor = getCSSVariableValue('--bs-gray-300')

	const colorInfo = getCSSVariableValue('--bs-info')
	const colorSuccess = getCSSVariableValue('--bs-success')
	const colorDanger = getCSSVariableValue('--bs-danger')

	// Define a set of colors for remaining items
	const colorPalette = [
		'#64B5F6',
		'#4DB6AC',
		'#FFD54F',
		'#FF8A65',
		'#A1887F',
		'#90A4AE',
		'#DCE775',
		'#FF7043',
		'#7986CB',
		'#4FC3F7',
		'#64DD17',
		'#F57F17',
	]

	// Ensure rattingData is properly processed
	const filteredData =
		rattingData?.filter((item: any) => !isNaN(item.total_amount) && item.total_amount > 0) || []

	// Sort data based on total_amount in descending order
	const sortedData = filteredData.sort((a: any, b: any) => b.total_amount - a.total_amount)
	const series = sortedData.map((item: any) => item.total_amount)
	const labels = sortedData.map((item: any) => item.item_name)

	// Assign colors, first three get specific colors, rest get from colorPalette
	const colors = sortedData.map((_: any, index: any) => {
		if (index === 0) return colorInfo
		if (index === 1) return colorSuccess
		if (index === 2) return colorDanger
		return colorPalette[(index - 3) % colorPalette.length]
	})

	// Provide default data if series is empty
	if (series.length === 0) {
		series.push(100)
		labels.push('No Data')
		colors.push('#CCCCCC') // Default grey color
	}

	const screenWidth = window.innerWidth
    const chartWidth = screenWidth < 768 ? '350px' : '450px'

	return {
		series: series,
		chart: {
			fontFamily: 'inherit',
			type: 'donut',
			// height: height,
			width: chartWidth,
			toolbar: {
				show: false,
			},
		},
		plotOptions: {
			pie: {
				donut: {
					size: '65%',
				},
			},
		},
		// labels: labels,
		labels: labels,
		dataLabels: {
			enabled: true,
		},
		fill: {
			type: 'solid',
			opacity: 1,
		},
		legend: {
			show: false,
			position: 'right',
		},
		colors: colors,
		stroke: {
			colors: [strokeColor],
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
	}
}
