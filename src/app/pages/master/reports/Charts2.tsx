import ApexCharts, { ApexOptions } from 'apexcharts';
import React, { useEffect, useRef } from 'react';
import { getCSS, getCSSVariableValue } from '../../../../_metronic/assets/ts/_utils';
import { useThemeMode } from '../../../../_metronic/partials';

type ExpenseDataItem = {
    expense_category: string;
    total_amount: number;
};

type Props = {
    className: string;
    expenseData?: ExpenseDataItem[]; // Array of expense data items
};

const NutritionCharts2: React.FC<Props> = ({ className, expenseData }) => {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const { mode } = useThemeMode();

    const refreshChart = () => {
        if (!chartRef.current || !expenseData) {
            return;
        }

        const height = parseInt(getCSS(chartRef.current, 'height'), 10);

        // Transform the expenseData for the chart
        const categories = expenseData.map(item => item.expense_category);
        const data = expenseData.map(item => item.total_amount);

        const chart = new ApexCharts(chartRef.current, getChartOptions(height, data, categories));
        chart.render();

        return chart;
    };

    useEffect(() => {
        const chart = refreshChart();
        return () => {
            if (chart) {
                chart.destroy();
            }
        };
    }, [expenseData, mode]); // Added expenseData to dependencies

    return (
        <div className={`${className}`}>
            <h2 className='m-6 mb-0'>Total Cost</h2>
            <div className='card-body'>
                <div
                    ref={chartRef}
                    id='kt_charts_widget_7_chart'
                    style={{ height: '300px' }}
                    className='card-rounded-bottom'></div>
            </div>
        </div>
    );
};

export { NutritionCharts2 };

function getChartOptions(height: number, data: number[], categories: string[]): ApexOptions {
    const labelColor = getCSSVariableValue('--bs-gray-500');
    const colorInfo = getCSSVariableValue('--bs-primary');

    return {
        series: [
            {
                name: 'Amount',
                data: data, // Total amount values
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
                columnWidth: '50%',
            },
        },
        stroke: {
            curve: 'smooth',
            colors: [colorInfo],
            width: 2,
        },
        xaxis: {
            categories: categories, // Expense categories
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
    };
}
