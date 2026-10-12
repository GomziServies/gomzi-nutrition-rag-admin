/* eslint-disable jsx-a11y/anchor-is-valid */
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ApexCharts, { ApexOptions } from 'apexcharts'
import React, { useRef } from 'react'
import { getCSS, getCSSVariableValue } from '../../../assets/ts/_utils'
import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'

type Props = {
	className: string
	Icon: IconDefinition
	color: string
	title: string
}

const StatisticsWidget4: React.FC<Props> = ({ className, Icon, color, title }) => {
	const chartRef = useRef<HTMLDivElement | null>(null)
	const { mode } = useThemeMode()
	const refreshChart = () => {
		if (!chartRef.current) {
			return
		}

		const height = parseInt(getCSS(chartRef.current, 'height'))
		const labelColor = getCSSVariableValue('--bs-gray-800')
		const baseColor = getCSSVariableValue('--bs-' + color)
		const lightColor = getCSSVariableValue('--bs-' + color + '-light')

		const chart = new ApexCharts(
			chartRef.current,
			getChartOptions(height, labelColor, baseColor, lightColor)
		)
		if (chart) {
			chart.render()
		}

		return chart
	}

	return (
		<div className={`card ${className}`}>
			{/* begin::Body */}
			<div className='card-body p-0'>
				<div className='d-flex'>
					<span className='symbol symbol-50px me-2'>
						<span
							className='symbol-label bg-light-info'
							style={{ width: '60px', height: '60px' }}>
							<FontAwesomeIcon
								icon={Icon}
								className={`fs-3x text-${color}`}
							/>
						</span>
					</span>
					<div className='d-flex flex-column '>
						<span
							className='text-dark fs-4 mt-5 ml-7'
							style={{ fontWeight: '500' }}>
							{title}
						</span>
					</div>
				</div>
			</div>
			{/* end::Body */}
		</div>
	)
}

export { StatisticsWidget4 }

function getChartOptions(
	height: number,
	labelColor: string,
	baseColor: string,
	lightColor: string
): ApexOptions {
	return {
		series: [
			{
				name: 'Net Profit',
				data: [40, 40, 30, 30, 35, 35, 50],
			},
		],
		chart: {
			fontFamily: 'inherit',
			type: 'area',
			height: height,
			toolbar: {
				show: false,
			},
			zoom: {
				enabled: false,
			},
			sparkline: {
				enabled: true,
			},
		},
		plotOptions: {},
		legend: {
			show: false,
		},
		dataLabels: {
			enabled: false,
		},
		fill: {
			type: 'solid',
			opacity: 1,
		},
		stroke: {
			curve: 'smooth',
			show: true,
			width: 3,
			colors: [baseColor],
		},
		xaxis: {
			categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
			axisBorder: {
				show: false,
			},
			axisTicks: {
				show: false,
			},
			labels: {
				show: false,
				style: {
					colors: labelColor,
					fontSize: '12px',
				},
			},
			crosshairs: {
				show: false,
				position: 'front',
				stroke: {
					color: '#E4E6EF',
					width: 1,
					dashArray: 3,
				},
			},
			tooltip: {
				enabled: false,
			},
		},
		yaxis: {
			min: 0,
			max: 60,
			labels: {
				show: false,
				style: {
					colors: labelColor,
					fontSize: '12px',
				},
			},
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
		colors: [lightColor],
		markers: {
			colors: [lightColor],
			strokeColors: [baseColor],
			strokeWidth: 3,
		},
	}
}
