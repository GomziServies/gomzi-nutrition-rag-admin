/* eslint-disable jsx-a11y/anchor-is-valid */
import {
	faUserLarge,
	faUserXmark,
	faUtensils,
	faWeight,
	faWeightHanging,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { GetDashboardStats } from '../../../../app/Functions/FWG'

type Props = {
	className: string
}

type DashboardStats = {
	total_users: number;
	inactive_users: number;
	active_users: number;
	active_diet_plan_users: number;
}

const GymMembersip: React.FC<Props> = ({ className }) => {

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
			<div className='border-0 px-3 pt-5'>
				<h3 className='card-title align-items-start flex-column'>
					<span className='card-label fw-bold fs-3 mb-1'>Total User</span>
				</h3>
			</div>
			<div className='card-body d-flex flex-column'>
				<div className='d-flex flex-stack mb-4'>
					<div className='d-flex align-items-center me-2'>
						<div className='symbol symbol-50px me-3'>
							<div className='symbol-label bg-light'>
								<FontAwesomeIcon
									icon={faUtensils}
									className='h-50 text-primary'
								/>
							</div>
						</div>
						<div>
							<a
								href='#'
								className='fs-6 text-gray-800 text-hover-primary fw-bold'>
								Active Diet Plans
							</a>
						</div>
					</div>
					<div className='badge badge-primary fw-semibold py-4 px-3'>{dashboardStats?.active_diet_plan_users}</div>
				</div>
				<div className='d-flex flex-stack mb-4'>
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
							<a
								href='#'
								className='fs-6 text-gray-800 text-hover-success fw-bold'>
								Active User
							</a>
						</div>
					</div>
					<div className='badge badge-success fw-semibold py-4 px-3'>{dashboardStats?.active_users}</div>
				</div>
				<div className='d-flex flex-stack mb-4'>
					<div className='d-flex align-items-center me-2'>
						<div className='symbol symbol-50px me-3'>
							<div className='symbol-label bg-light'>
								<FontAwesomeIcon
									icon={faUserXmark}
									className='h-50 text-danger'
								/>
							</div>
						</div>
						<div>
							<a
								href='#'
								className='fs-6 text-gray-800 text-hover-danger fw-bold'>
								Deactivate User
							</a>
						</div>
					</div>
					<div className='badge badge-danger fw-semibold py-4 px-3'>{dashboardStats?.inactive_users}</div>
				</div>
				<div className='d-flex flex-stack mb-4'>
					<div className='d-flex align-items-center me-2'>
						<div className='symbol symbol-50px me-3'>
							<div className='symbol-label bg-light'>
								<FontAwesomeIcon
									icon={faWeight}
									className='h-50 text-info'
								/>
							</div>
						</div>
						<div>
							<a
								href='#'
								className='fs-6 text-gray-800 text-hover-info fw-bold'>
								Weight-loss
							</a>
						</div>
					</div>
					<div className='badge badge-info fw-semibold py-4 px-3'>+1500</div>
				</div>
				<div className='d-flex flex-stack mb-0'>
					<div className='d-flex align-items-center me-2'>
						<div className='symbol symbol-50px me-3'>
							<div className='symbol-label bg-light'>
								<FontAwesomeIcon
									icon={faWeightHanging}
									className='h-50 text-warning'
								/>
							</div>
						</div>
						<div>
							<a
								href='#'
								className='fs-6 text-gray-800 text-hover-warning fw-bold'>
								Weight User
							</a>
						</div>
					</div>
					<div className='badge badge-warning fw-semibold py-4 px-3'>150</div>
				</div>
			</div>
			{/* end::Body */}
		</div>
	)
}

export { GymMembersip }
