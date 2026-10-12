import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import TableButton from '../../components/TableButton'
import UsersListPagination from '../../components/TablePagination'
import { GetDietPlan } from '../../Functions/FWG'
import { DayJS } from '../../../_metronic/helpers/Utils'

type Props = {
	user_id?: string | any
}

const AssignDietData: React.FC<Props> = ({ user_id }) => {
	const [assignDietData, setAssignDietData] = useState([])
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchDietAssignData = async () => {
		setLoading(true)

		try {
			const dietResponse: any = await GetDietPlan({
				sort: 'createdAt',
				sortOrder: 'asc'
			})

			const dietPlans = dietResponse?.data || []

			const filteredDietPlans = dietPlans.filter((plan: any) =>
				plan.diet_assigned_user.some((assignedUser: any) => assignedUser.user_id === user_id)
			);

			const parsedDietPlans = filteredDietPlans.map((plan: any) => {
				const matchingUser = plan.diet_assigned_user.find((user: any) => user.user_id === user_id);
				const assignedUsers = matchingUser ? [{
					name: `${matchingUser.user_info.firstName} ${matchingUser.user_info.lastName}`,
					email: matchingUser.user_info.email,
					mobile: matchingUser.user_info.mobile,
					status: matchingUser.status,
					startDate: matchingUser.start_date,
					user_id: matchingUser.user_id,
				}] : [];

				return {
					planName: plan.plan_name,
					createdAt: plan.createdAt,
					updatedAt: plan.updatedAt,
					_id: plan._id,
					category: plan.diet_food_category.category,
					days: plan.days,
					users: assignedUsers,
					diet_items: plan.diet_items,
					food_type: plan.food_type
				}
			})

			setAssignDietData(parsedDietPlans)
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	const paginatedAssignData = assignDietData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const fetchAllData = async () => {
		fetchDietAssignData()
	}

	return (
		<>
			{/* Assign Plans */ }
			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					onClick={ () => fetchAllData() }
					data-bs-toggle='collapse'
					data-bs-target='#kt_user_assign_diet_plan'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Diet Plans</h3>
						<FontAwesomeIcon
							icon={ faAngleDown }
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_user_assign_diet_plan'
					className='collapse'>
					{ !loading ? (
						<>
							<div className='card-body border-top'>
								<div className=' mt-0'>
									<div className=''>
										{/* <div className='card-title w-100'>
											<div className='row w-100 justify-content-between align-items-center'>
												<div className='col-6'>
													<h2 className='fw-bold text-dark fs-1 '>
														Assign Diet to users
													</h2>
												</div>
											</div>
										</div> */}
									</div>
									<div className='py-2'>
										<div className='table-responsive'>
											<div className='table-responsive'>
												<table
													id='kt_table_users'
													className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
													<thead>
														<tr className='fw-bold text-muted bg-light border-bottom-0'>
															<th className='ps-4 rounded-start'>No.</th>
															<th>Plan Name</th>
															<th>Days</th>
															<th>Start Date</th>
															<th>Expired On</th>
															<th className='ps-4 rounded-end'>Action</th>
														</tr>
													</thead>
													<tbody className='text-gray-600 fw-bold'>
														{ loading ? (
															<tr>
																<td
																	colSpan={ 12 }
																	className='text-center'>
																	<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
																		<div
																			className='spinner-border text-primary'
																			role='status'>
																			<span className='visually-hidden'>Loading...</span>
																		</div>
																	</div>
																</td>
															</tr>
														) : (
															paginatedAssignData.slice().map((data: any, index: number) => {
																const userFound = data.users.find(
																	(plan: any) => plan.user_id === user_id
																)
																const copyData = { ...data }
																copyData.users = userFound
																data = copyData

																const StartDate = data.users?.startDate
																const expiredOn =
																	DayJS(StartDate).isValid() && !isNaN(Number(data.days))
																		? DayJS(StartDate)
																			.add(Number(data.days), 'day')
																			.format('DD/MM/YYYY hh:mm:ss A')
																		: 'Invalid Date'

																const actualIndex =
																	(pagination.page - 1) * pagination.itemsPerPage + index + 1

																return (
																	<tr key={ actualIndex }>
																		<td className='text-center'>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{ actualIndex }
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{ data.planName || '-' }
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{ data.days ? data.days : '-' }
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{ DayJS(data.users?.startDate).format(
																					'DD/MM/YYYY hh:mm:ss A'
																				) }
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{ expiredOn }
																			</span>
																		</td>
																		<td>
																			<TableButton
																				action='view'
																				to={ '/fwg/diet-details/diet-assign?plan_id=' + data._id }
																				text='View Diet'
																				backgroundDark={ true }
																			/>
																		</td>
																	</tr>
																)
															})
														) }
													</tbody>
												</table>
											</div>
										</div>
										{ assignDietData.length === 0 && !loading && (
											<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
												<b>No records found</b>
											</div>
										) }
										{ assignDietData.length > 0 && (
											<UsersListPagination
												totalPages={ Math.ceil(assignDietData.length / pagination.itemsPerPage) }
												currentPage={ pagination.page }
												onPageChange={ handlePageChange }
											/>
										) }
									</div>
								</div>
							</div>
						</>
					) : (
						<>
							<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
								<div
									className='spinner-border text-primary'
									role='status'>
									<span className='visually-hidden'>Loading...</span>
								</div>
							</div>
						</>
					) }
				</div>
			</div>
		</>
	)
}

export { AssignDietData }
