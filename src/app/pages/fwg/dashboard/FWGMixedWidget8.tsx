import { faUserLarge } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GetDashboardStats } from '../../../../app/Functions/FWG'

type Props = {
	className: string
	chartColor: string
	chartHeight: string
}

type DashboardStats = {
	total_users: number
	inactive_users: number
	user_assigned_plan: number
	active_diet_plan_users: number
}

const FWGMixedWidget8: React.FC<Props> = ({ className, chartColor, chartHeight }) => {
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)

	const fetchData = async () => {
		try {
			const auth: any = await GetDashboardStats()
			setDashboardStats(auth.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	return (
		<>
			<div className={`card ${className} p-0`}>
				<div
					style={{ padding: '0!important' }}
					className='p-0'>
					<div className={`px-9 pt-7 card-rounded h-200px w-100 bg-info`}>
						<div className='d-flex text-center flex-column text-white pt-8'>
							<h3 className='m-0 text-white fw-bold fs-3'>Total User</h3>
						</div>
					</div>
					<div
						className='shadow-xs card-rounded mx-9 mb-9 px-6 py-2 pb-3 position-relative z-index-1 bg-body'
						style={{ marginTop: '-100px' }}>
						<div className='d-flex align-items-center mb-6 mt-3'>
							<div className='symbol symbol-45px w-40px me-5'>
								<span className='symbol-label bg-lighten'>
									<FontAwesomeIcon
										icon={faUserLarge}
										className='h-50 text-primary'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-wrap w-100'>
								<div className='mb-1 pe-3 flex-grow-1'>
									<Link
										to={'/fwg/users/user'}
										className='fs-5 text-gray-800  fw-bold'>
										Total User
									</Link>
								</div>
								<div className='d-flex align-items-center'>
									<div className='fw-bold fs-5 text-gray-800 pe-1'>
										{dashboardStats?.total_users ?? 0}
									</div>
								</div>
							</div>
						</div>

						<div className='d-flex align-items-center mb-6'>
							<div className='symbol symbol-45px w-40px me-5'>
								<span className='symbol-label bg-lighten'>
									<FontAwesomeIcon
										icon={faUserLarge}
										className='h-50 text-success text-hover-success'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-wrap w-100'>
								<div className='mb-1 pe-3 flex-grow-1'>
									<p className='fs-5 mb-0 text-gray-800 text-hover-success fw-bold'>
										Assigned User
									</p>
								</div>
								<div className='d-flex align-items-center'>
									<div className='fw-bold fs-5 text-gray-800 pe-1'>
										{dashboardStats?.user_assigned_plan ?? 0}
									</div>
								</div>
							</div>
						</div>

						<div className='d-flex align-items-center mb-3'>
							<div className='symbol symbol-45px w-40px me-5'>
								<span className='symbol-label bg-lighten'>
									<FontAwesomeIcon
										icon={faUserLarge}
										className='h-50 text-danger'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-wrap w-100'>
								<div className='mb-1 pe-3 flex-grow-1'>
									<p className='fs-5 mb-0 text-gray-800 text-hover-danger fw-bold'>
										Deactivate User
									</p>
								</div>
								<div className='d-flex align-items-center'>
									<div className='fw-bold fs-5 text-gray-800 pe-1'>
										{dashboardStats?.inactive_users ?? 0}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { FWGMixedWidget8 }
