import { faArrowsToEye, faCircleUser, faEnvelopeCircleCheck, faUserLarge } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { GetDashboardStats } from '../../../../app/Functions/FWG'
import { KTIcon } from '../../../../_metronic/helpers';

type Props = {
	className?: string;
	chartColor?: string;
	chartHeight?: string;
};

type DashboardStats = {
	total_users: number;
	inactive_users: number;
	active_users: number;
	active_diet_plan_users: number;
}

const ListsWidgetGCSUser: React.FC<Props> = ({ className }) => {
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
	return (
		<div className={`card ${className}`}>
			<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-dark'>Total User</span>
					</h3>
					<div className='card-toolbar'>
						<button
							type='button'
							className='btn btn-sm btn-icon btn-color-primary btn-active-light-primary'
							data-kt-menu-trigger='click'
							data-kt-menu-placement='bottom-end'
							data-kt-menu-flip='top-end'>
							<KTIcon
								iconName='category'
								className='fs-2'
							/>
						</button>
					</div>
				</div>
			<div className='card-body d-flex flex-column'>

				<div className=''>
					<div className='d-flex flex-stack mb-5'>
						<div className='d-flex align-items-center me-2'>
							<div className='symbol symbol-50px me-3'>
								<div className='symbol-label bg-light'>
									<FontAwesomeIcon
										icon={faCircleUser}
										className='h-50 text-primary'
									/>
								</div>
							</div>
							<div>
								<div
									className='fs-6 text-gray-800  fw-bold'>
									Total User
								</div>
							</div>
						</div>
						<div className='badge badge-primary fw-semibold py-4 px-3'>{dashboardStats?.total_users}</div>
					</div>
					<div className='d-flex flex-stack mb-5'>
						<div className='d-flex align-items-center me-2'>
							<div className='symbol symbol-50px me-3'>
								<div className='symbol-label bg-light'>
									<FontAwesomeIcon
										icon={faUserLarge}
										className='h-50 text-success text-hover-success'
									/>
								</div>
							</div>
							<div>
								<div
									className='fs-6 text-gray-800 text-hover-success fw-bold'>
									Active User
								</div>
							</div>
						</div>
						<div className='badge badge-primary fw-semibold py-4 px-3'>{dashboardStats?.active_users}</div>
					</div>
					<div className='d-flex flex-stack mb-5'>
						<div className='d-flex align-items-center me-2'>
							<div className='symbol symbol-50px me-3'>
								<div className='symbol-label bg-light'>
                                <FontAwesomeIcon
										icon={faEnvelopeCircleCheck}
										className='h-50 text-primary'
									/>
								</div>
							</div>
							<div>
								<div
									className='fs-6 text-gray-800 text-hover-danger fw-bold'>
									Total Inquiry
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
export { ListsWidgetGCSUser }
