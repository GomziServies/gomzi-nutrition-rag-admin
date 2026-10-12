import ApexCharts, { ApexOptions } from 'apexcharts'
import React, { useEffect, useRef } from 'react'
import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'

type Props = {
	className: string
}

const ChartsWidget1: React.FC<Props> = ({ className }) => {
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

		const height = 180
		const width = 150

		const chart = new ApexCharts(chartRef.current, getChartOptions(height, width))
		if (chart) {
			chart.render()
		}

		return chart
	}

	return (
		<div
			className={`card px-0 ${className} mt-6`}
			style={{ backgroundColor: '#000', width: '100%' }}>
			{/* begin::Body */}
			<div className='card-body text-center'>
				{/* begin::Chart */}
				<div
					ref={chartRef}
					id='kt_charts_widget_1_chart'
					style={{ width: '100%' }}
				/>
				{/* end::Chart */}
				<div className='d-flex justify-content-center mt-5 align-items-center'>
					<div
						style={{
							width: '35px',
							height: '7px',
							backgroundColor: '#008ffb',
							borderRadius: '3px',
							margin: '0px 5px 0px 0px',
						}}></div>
					<h4 className='mb-0'>Diet Update</h4>
				</div>
			</div>
			{/* end::Body */}
		</div>
	)
}

export { ChartsWidget1 }

function getChartOptions(height: number, width: number): ApexOptions {
	return {
		series: [30, 78],
		chart: {
			fontFamily: 'inherit',
			type: 'donut',
			width: width,
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
