/* eslint-disable jsx-a11y/anchor-is-valid */
import { faUserLarge } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import ApexCharts, { ApexOptions } from 'apexcharts'
import React, { useEffect, useState } from 'react'
// import { getCSSVariableValue } from '../../../assets/ts/_utils'
// import { useThemeMode } from '../../layout/theme-mode/ThemeModeProvider'
import { GetDashboardStats } from '../../../../app/Functions/FWG'

type Props = {
	className: string;
	chartColor: string;
	chartHeight: string;
};

type DashboardStats = {
	total_users: number;
	inactive_users: number;
	active_users: number;
	active_diet_plan_users: number;
}

const MixedWidget8: React.FC<Props> = ({ className, chartColor, chartHeight }) => {
	// const chartRef = useRef<HTMLDivElement | null>(null);
	// const { mode } = useThemeMode();

	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

	const fetchData = async () => {
		try {
			const auth: any = await GetDashboardStats();
			setDashboardStats(auth.data);
		} catch (error: any) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// const refreshChart = () => {
	// 	if (!chartRef.current || !dashboardStats) {
	// 		return;
	// 	}

	// 	const chart1 = new ApexCharts(chartRef.current, chart1Options(chartColor, chartHeight, dashboardStats));
	// 	chart1.render();

	// 	return chart1;
	// };

	// useEffect(() => {
	// 	const chart1 = refreshChart();

	// 	return () => {
	// 		if (chart1) {
	// 			chart1.destroy();
	// 		}
	// 	};
	// }, [dashboardStats, mode]);


	return (
		<div className={`card ${className}`}>
			{/* begin::Beader */}
			<div className='card-header border-0 px-3'>
				<h3 className='card-title align-items-start flex-column'>
					<span className='card-label fw-bold fs-3 mb-1'>Total User</span>
				</h3>
			</div>
			{/* end::Header */}

			{/* begin::Body */}
			<div className='card-body d-flex flex-column'>

				{/* <div
					ref={chartRef}
					className='mixed-widget-5-chart card-rounded-top'></div> */}

				{/* begin::Items */}
				<div className='mt-0'>
					{/* begin::Item */}
					<div className='d-flex flex-stack mb-5'>
						{/* begin::Section */}
						<div className='d-flex align-items-center me-2'>
							{/* begin::Symbol */}
							<div className='symbol symbol-50px me-3'>
								<div className='symbol-label bg-light'>
									<FontAwesomeIcon
										icon={faUserLarge}
										className='h-50 text-primary'
									/>
								</div>
							</div>
							{/* end::Symbol */}

							{/* begin::Title */}
							<div>
								<div
									className='fs-6 text-gray-800 text-hover-primary fw-bold'>
									Total User
								</div>
							</div>
							{/* end::Title */}
						</div>
						{/* end::Section */}

						{/* begin::Label */}
						<div className='badge badge-primary fw-semibold py-4 px-3'>{dashboardStats?.total_users}</div>
						{/* end::Label */}
					</div>
					{/* end::Item */}

					{/* begin::Item */}
					<div className='d-flex flex-stack mb-5'>
						{/* begin::Section */}
						<div className='d-flex align-items-center me-2'>
							{/* begin::Symbol */}
							<div className='symbol symbol-50px me-3'>
								<div className='symbol-label bg-light'>
									<FontAwesomeIcon
										icon={faUserLarge}
										className='h-50 text-success text-hover-success'
									/>
								</div>
							</div>
							{/* end::Symbol */}

							{/* begin::Title */}
							<div>
								<div
									className='fs-6 text-gray-800 text-hover-success fw-bold'>
									Active User
								</div>
							</div>
							{/* end::Title */}
						</div>
						{/* end::Section */}

						{/* begin::Label */}
						<div className='badge badge-primary fw-semibold py-4 px-3'>{dashboardStats?.active_users}</div>
						{/* end::Label */}
					</div>
					<div className='d-flex flex-stack mb-5'>
						<div className='d-flex align-items-center me-2'>
							<div className='symbol symbol-50px me-3'>
								<div className='symbol-label bg-light'>
									<FontAwesomeIcon
										icon={faUserLarge}
										className='h-50 text-danger'
									/>
								</div>
							</div>
							<div>
								<div
									className='fs-6 text-gray-800 text-hover-danger fw-bold'>
									Deactivate User
								</div>
							</div>
						</div>
						<div className='badge badge-primary fw-semibold py-4 px-3'>{dashboardStats?.inactive_users}</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// const chart1Options = (chartColor: string, chartHeight: string, dashboardStats: DashboardStats): ApexOptions => {

// 	const labelColor = getCSSVariableValue('--bs-gray-800');
// 	const strokeColor = getCSSVariableValue('--bs-gray-300');
// 	const baseColor = getCSSVariableValue('--bs-' + chartColor) as string;
// 	const lightColor = getCSSVariableValue('--bs-' + chartColor + '-light');

// 	const activeUsersData = dashboardStats ? [dashboardStats.active_users] : [];
// 	const totalUsersData = dashboardStats ? [dashboardStats.total_users] : [];
// 	const inactiveUsersData = dashboardStats ? [dashboardStats.inactive_users] : [];

// 	return {
// 		series: [
// 			{
// 				name: 'Active Users',
// 				data: activeUsersData,
// 			},
// 			{
// 				name: 'Total Users',
// 				data: totalUsersData,
// 			},
// 			{
// 				name: 'Inactive Users',
// 				data: inactiveUsersData,
// 			},
// 		],
// 		chart: {
// 			fontFamily: 'inherit',
// 			type: 'area',
// 			height: chartHeight,
// 			toolbar: {
// 				show: false,
// 			},
// 			zoom: {
// 				enabled: false,
// 			},
// 			sparkline: {
// 				enabled: true,
// 			},
// 		},
// 		plotOptions: {},
// 		legend: {
// 			show: false,
// 		},
// 		dataLabels: {
// 			enabled: false,
// 		},
// 		fill: {
// 			type: 'solid',
// 			opacity: 1,
// 		},
// 		stroke: {
// 			curve: 'smooth',
// 			show: true,
// 			width: 3,
// 			colors: [baseColor],
// 		},
// 		xaxis: {
// 			categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
// 			axisBorder: {
// 				show: false,
// 			},
// 			axisTicks: {
// 				show: false,
// 			},
// 			labels: {
// 				show: false,
// 				style: {
// 					colors: labelColor,
// 					fontSize: '12px',
// 				},
// 			},
// 			crosshairs: {
// 				show: false,
// 				position: 'front',
// 				stroke: {
// 					color: strokeColor,
// 					width: 1,
// 					dashArray: 3,
// 				},
// 			},
// 			tooltip: {
// 				enabled: true,
// 				formatter: undefined,
// 				offsetY: 0,
// 				style: {
// 					fontSize: '12px',
// 				},
// 			},
// 		},
// 		yaxis: {
// 			min: 0,
// 			max: 65,
// 			labels: {
// 				show: false,
// 				style: {
// 					colors: labelColor,
// 					fontSize: '12px',
// 				},
// 			},
// 		},
// 		states: {
// 			normal: {
// 				filter: {
// 					type: 'none',
// 					value: 0,
// 				},
// 			},
// 			hover: {
// 				filter: {
// 					type: 'none',
// 					value: 0,
// 				},
// 			},
// 			active: {
// 				allowMultipleDataPointsSelection: false,
// 				filter: {
// 					type: 'none',
// 					value: 0,
// 				},
// 			},
// 		},

// 		colors: [lightColor],
// 		markers: {
// 			colors: [lightColor],
// 			strokeColors: [baseColor],
// 			strokeWidth: 3,
// 		},
// 	}
// }

export { MixedWidget8 }
