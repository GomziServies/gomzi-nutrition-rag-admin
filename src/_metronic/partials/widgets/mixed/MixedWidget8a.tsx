/* eslint-disable jsx-a11y/anchor-is-valid */
import { faDollar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ApexCharts, { ApexOptions } from 'apexcharts'
import React, { useEffect, useRef, useState } from 'react'
import { GetInvoice } from '../../../../app/Functions/FWG'
import { getCSSVariableValue } from '../../../assets/ts/_utils'
import { KTIcon } from '../../../helpers'
import { InvoiceDropdown } from '../../content/dropdown/InvoiceDropdown'
import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'

type Props = {
	className: string
	chartColor: string
	chartHeight: string
}

const MixedWidget8a: React.FC<Props> = ({ className, chartColor, chartHeight }) => {
	const chartRef = useRef<HTMLDivElement | null>(null)
	const { mode } = useThemeMode()
	const refreshChart = () => {
		if (!chartRef.current) {
			return
		}

		const chart1 = new ApexCharts(chartRef.current, chart1Options(chartColor, chartHeight))
		if (chart1) {
			chart1.render()
		}

		return chart1
	}

	useEffect(() => {
		const chart1 = refreshChart()

		return () => {
			if (chart1) {
				chart1.destroy()
			}
		}
	}, [chartRef, mode])

	const [totalInvoicesFGIIT, setTotalInvoicesFGIIT] = useState<number>(0)
	const [totalInvoicesFWG, setTotalInvoicesFWG] = useState<number>(0)

	const fetchData = async () => {
		try {
			const response: any = await GetInvoice()
			const invoicesFGIIT = response.data.filter(
				(invoice: any) => invoice.selectedCompany === 'FGIIT'
			)
			const invoicesFWG = response.data.filter((invoice: any) => invoice.selectedCompany === 'FWG')
			setTotalInvoicesFGIIT(invoicesFGIIT.length)
			setTotalInvoicesFWG(invoicesFWG.length)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	return (
		<div className={`card ${className}`}>
			{/* begin::Beader */}
			<div className='card-header border-0 px-3'>
				<h3 className='card-title align-items-start flex-column'>
					<span className='card-label fw-bold fs-3 mb-1'>Invoice Data</span>
				</h3>

				<div className='card-toolbar'>
					{/* begin::Menu */}
					<button
						type='button'
						className='btn btn-sm btn-icon btn-color-info btn-active-light-info'
						data-kt-menu-trigger='click'
						data-kt-menu-placement='bottom-end'
						data-kt-menu-flip='top-end'>
						<KTIcon
							iconName='category'
							className='fs-2'
						/>
					</button>
					<InvoiceDropdown />
					{/* end::Menu */}
				</div>
			</div>
			{/* end::Header */}

			<div className='card-body d-flex flex-column'>
				<div
					ref={chartRef}
					className='mixed-widget-5-chart card-rounded-top'></div>
				<div className='mt-9'>
					<div className='d-flex flex-stack mb-5'>
						<div className='d-flex align-items-center me-2'>
							<div className='symbol symbol-50px me-3'>
								<div className='symbol-label bg-light'>
									<FontAwesomeIcon
										icon={faDollar}
										className='h-50'
									/>
								</div>
							</div>
							<div>
								<a
									href='#'
									className='fs-6 text-gray-800 text-hover-primary fw-bold'>
									Total FGIIT Invoice
								</a>
							</div>
						</div>
						<div className='badge badge-info fw-semibold py-4 px-3'>{totalInvoicesFGIIT}</div>
					</div>
					<div className='d-flex flex-stack mb-5'>
						<div className='d-flex align-items-center me-2'>
							<div className='symbol symbol-50px me-3'>
								<div className='symbol-label bg-light'>
									<FontAwesomeIcon
										icon={faDollar}
										className='h-50'
									/>
								</div>
							</div>
							<div>
								<a
									href='#'
									className='fs-6 text-gray-800 text-hover-primary fw-bold'>
									Total FWG Invoice
								</a>
							</div>
						</div>
						<div className='badge badge-info fw-semibold py-4 px-3'>{totalInvoicesFWG}</div>
					</div>
				</div>
			</div>
		</div>
	)
}

const chart1Options = (chartColor: string, chartHeight: string): ApexOptions => {
	const labelColor = getCSSVariableValue('--bs-gray-800')
	const strokeColor = getCSSVariableValue('--bs-gray-300')
	const baseColor = getCSSVariableValue('--bs-' + chartColor) as string
	const lightColor = getCSSVariableValue('--bs-' + chartColor + '-light')

	return {
		series: [
			{
				name: 'Net Profit',
				data: [30, 30, 60, 25, 25, 40],
			},
		],
		chart: {
			fontFamily: 'inherit',
			type: 'bar',
			height: chartHeight,
			toolbar: {
				show: false,
			},
			zoom: {
				enabled: true,
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
			categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
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
					color: strokeColor,
					width: 1,
					dashArray: 3,
				},
			},
			tooltip: {
				enabled: true,
				formatter: undefined,
				offsetY: 0,
				style: {
					fontSize: '12px',
				},
			},
		},
		yaxis: {
			min: 0,
			max: 65,
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

export { MixedWidget8a }

