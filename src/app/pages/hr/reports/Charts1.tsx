import React, { useEffect, useRef, useState } from 'react'
import ApexCharts, { ApexOptions } from 'apexcharts'
import { useThemeMode } from '../../../../_metronic/partials'
import { getCSS, getCSSVariableValue } from '../../../../_metronic/assets/ts/_utils'

type Props = {
	className?: string
	rattingData?: any
}

const Charts1: React.FC<Props> = ({ className = '', rattingData }) => {
	const chartRef = useRef<HTMLDivElement | null>(null)
	const { mode } = useThemeMode()

	useEffect(() => {
		if (!chartRef.current) return

		// Clear previous chart DOM if any
		chartRef.current.innerHTML = ''

		const height = 300
		const chart = new ApexCharts(chartRef.current, getChartOptions(height, rattingData))
		chart.render()

		return () => {
			chart.destroy()
		}
	}, [chartRef, mode, rattingData])

	return (
		<div className={`${className}`}>
			<div ref={chartRef} id='kt_charts_widget_7_chart' style={{ height: '300px' }}></div>
		</div>
	)
}

export { Charts1 }

function getChartOptions(height: number, rattingData: any): ApexOptions {
	const lateCompleted = parseInt(rattingData?.late_completed) || 0
	const completed = parseInt(rattingData?.completed_task) || 0
	const total = parseInt(rattingData?.total_task) || 0
	const pending = parseInt(rattingData?.pending_task) || Math.max(0, total - completed - lateCompleted)
	const rejected = parseInt(rattingData?.rejected_task) || 0

	const allZero = lateCompleted === 0 && completed === 0 && pending === 0 && rejected === 0

	return {
		series: allZero ? [0, 0, 0, 0] : [completed, lateCompleted, pending, rejected],
		chart: {
			fontFamily: 'Inter, system-ui, sans-serif',
			type: 'donut',
			height: height,
			toolbar: {
				show: false,
			},
		},
		plotOptions: {
			pie: {
				donut: {
					size: '72%',
					labels: {
						show: true,
						name: {
							show: true,
							fontSize: '13px',
							fontWeight: 600,
							color: '#71809A',
							offsetY: -6,
						},
						value: {
							show: true,
							fontSize: '24px',
							fontWeight: 800,
							color: '#142447',
							offsetY: 4,
							formatter: (val) => val,
						},
						total: {
							show: true,
							label: 'Total Tasks',
							fontSize: '12px',
							fontWeight: 600,
							color: '#71809A',
							formatter: () => `${total}`,
						},
					},
				},
			},
		},
		labels: ['Completed on Time', 'Late Completed', 'Pending Task', 'Rejected Task'],
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
			horizontalAlign: 'center',
			fontSize: '12px',
			fontWeight: 500,
			markers: {
				size: 5,
			},
			itemMargin: {
				horizontal: 10,
				vertical: 4,
			},
		},
		colors: ['#16a34a', '#f59e0b', '#dc2626', '#94a3b8'],
		stroke: {
			colors: ['#ffffff'],
			width: 2,
		},
		noData: {
			text: 'No task data available',
			align: 'center',
			verticalAlign: 'middle',
			style: {
				color: '#71809A',
				fontSize: '13px',
				fontFamily: 'Inter, system-ui, sans-serif',
			},
		},
		tooltip: {
			style: {
				fontSize: '12px',
			},
			y: {
				formatter: function (val) {
					return `${val} tasks`
				},
			},
		},
	}
}
