import ApexCharts, { ApexOptions } from 'apexcharts'
import React, { useEffect, useRef } from 'react'
import { useThemeMode } from '../../../../_metronic/partials'
import { getCSS, getCSSVariableValue } from '../../../../_metronic/assets/ts/_utils'

type Props = {
  className?: string
  chartValue: any
}

const NutritionMasterChart: React.FC<Props> = ({ className, chartValue }) => {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const { mode } = useThemeMode()

  const labelColor = getCSSVariableValue('--bs-gray-500')
  const borderColor = getCSSVariableValue('--bs-gray-200')
  const baseColor = getCSSVariableValue('--bs-success')
  const secondaryColor = getCSSVariableValue('--bs-gray-300')

  const refreshChart = () => {
    if (!chartRef.current) {
      return
    }

    const height = parseInt(getCSS(chartRef.current, 'height'))
    const allZero = chartValue?.booksAndEbooks === 0 && chartValue?.fitnessCourse === 0 &&
      chartValue?.flexibleProduct === 0 && chartValue?.offline === 0 &&
      chartValue?.product === 0

    const chart = new ApexCharts(chartRef.current, {
      series: [
        {
          name: 'Sales',
          data: allZero ? [
            0, 0, 0
          ] : [
            chartValue?.total_amount || 5,
            chartValue?.total_paid_amount || 5,
            chartValue?.total_unpaid_amount || 5,
          ],
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
        categories: ['Total Amount', 'Paid Amount', 'Due Amount'],
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
          formatter: function (val: any) {
            return '₹' + val
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
    })
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
  }, [chartRef, mode, chartValue])

  return (
    <div className={`card ${className}`}>
      <div className='card-header border-0 pt-5'>
        <h3 className='card-title align-items-start flex-column'>
          <span className='card-label fw-bold fs-3 mb-1'>Recent Orders</span>
        </h3>
      </div>
      <div className='card-body'>
        <div
          ref={chartRef}
          id='kt_charts_widget_2_chart'
          style={{ height: '350px' }}
        ></div>
      </div>
    </div>
  )
}

export { NutritionMasterChart }
