import ApexCharts, { ApexOptions } from 'apexcharts'
import React, { useEffect, useRef } from 'react'
import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'

type Props = {
	className: string
}

const ExerciseChartsWidget: React.FC<Props> = ({ className }) => {
	const chartRef = useRef<HTMLDivElement | null>(null)
	const { mode } = useThemeMode()

	useEffect(() => {
		const chart = refreshChart()

		return () => {
			if (chart) {
				chart.destroy()
			}
		}
	}, [chartRef, mode])

	const refreshChart = () => {
		if (!chartRef.current) {
			return
		}

		const height = 200

		const chart = new ApexCharts(chartRef.current, getChartOptions(height))
		if (chart) {
			chart.render()
		}

		return chart
	}

	return (
		<div
			className={`px-0 ${className} mt-6`}
			style={{ width: '100%', textAlign: 'center' }}>
			{/* begin::Body */}
			<div className='text-center'>
				{/* begin::Chart */}
				<div
					ref={chartRef}
					id=''
					className='text-center'
				/>
				{/* end::Chart */}
			</div>
			{/* end::Body */}
		</div>
	)
}

export { ExerciseChartsWidget }

function getChartOptions(height: number): ApexOptions {
	return {
		series: [30, 78, 5],
		chart: {
			fontFamily: 'inherit',
			type: 'donut',
			height: height,
		},
		plotOptions: {},
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
		},
	}
}
