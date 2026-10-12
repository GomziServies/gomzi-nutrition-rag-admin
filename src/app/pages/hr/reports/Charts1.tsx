import React, { useEffect, useRef, useState } from 'react'
import ApexCharts, { ApexOptions } from 'apexcharts'
import { useThemeMode } from '../../../../_metronic/partials'
import { getCSS, getCSSVariableValue } from '../../../../_metronic/assets/ts/_utils'

type Props = {
	className: string
	rattingData?: string
}


const Charts1: React.FC<Props> = ({ className, rattingData }) => {
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
	}, [chartRef, mode])

	return (
		<div className={`${className}`}>
			<div className='card-body'>
				<div ref={chartRef} id='kt_charts_widget_7_chart' style={{ height: '350px' }} className='card-rounded-bottom'></div>
			</div>
		</div>
	)
}

export { Charts1 }

function getChartOptions(height: number, rattingData: any): ApexOptions {
	const labelColor = getCSSVariableValue('--bs-gray-500')
	const borderColor = getCSSVariableValue('--bs-gray-200')
	const strokeColor = getCSSVariableValue('--bs-gray-300')

	const colorInfo = getCSSVariableValue('--bs-info')
	const colorSuccess = getCSSVariableValue('--bs-success')
	const colorWarning = getCSSVariableValue('--bs-warning')
	const colorDanger = getCSSVariableValue('--bs-danger')

	return {
		series: [parseInt(rattingData?.late_completed), parseInt(rattingData?.completed_task), parseInt(rattingData?.total_task) - parseInt(rattingData?.completed_task), parseInt(rattingData?.rejected_task)],
		chart: {
			fontFamily: 'inherit',
			type: 'donut',
			height: height,
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
		labels: ['Late Completed Task', 'Completed Task', 'Pending Task', 'Rejected Task'],
		dataLabels: {
			enabled: true,
		},
		fill: {
			type: 'solid',
			opacity: 1,
		},
		legend: {
			show: true,
			position: 'bottom',
		},
		colors: [colorInfo, colorSuccess, colorDanger, colorWarning],
		stroke: {
			colors: [strokeColor],
		},
		tooltip: {
			style: {
				fontSize: '12px',
			},
			y: {
				formatter: function (val) {
					return val + ' tasks'
				},
			},
		},
	}
}
