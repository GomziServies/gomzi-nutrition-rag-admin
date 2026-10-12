import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import TableButton from '../../components/TableButton'
import UsersListPagination from '../../components/TablePagination'
import { GetExercisePlan } from '../../Functions/FWG'
import { DayJS } from '../../../_metronic/helpers/Utils'

type Props = {
	user_id?: string | any
}

const AssignExerciseData: React.FC<Props> = ({ user_id }) => {
	const [assignExerciseData, setAssignExerciseData] = useState([])
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchExerciseAssignData = async () => {
		setLoading(true)
		try {
			const exerciseResponse: any = await GetExercisePlan({ user_id })
			const exercisePlans = exerciseResponse?.data || []
			const parsedExercisePlans = exercisePlans.map((plan: any) => {
				const assignedUsers = plan.user_assign_exercise.map((user: any) => ({
					name: `${user.user.firstName} ${user.user.lastName}`,
					email: user.user.email,
					mobile: user.user.mobile,
					status: user.status,
					startDate: user.start_date,
				}))

				return {
					planName: plan.plan_name,
					createdAt: plan.createdAt,
					updatedAt: plan.updatedAt,
					time_slot: plan.time_slot,
					_id: plan._id,
					users: assignedUsers,
				}
			})

			setAssignExerciseData(parsedExercisePlans)
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}
	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const fetchAllData = async () => {
		fetchExerciseAssignData()
	}

	return (
		<>
			{/* Assign Plans */}
			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					onClick={() => fetchAllData()}
					data-bs-toggle='collapse'
					data-bs-target='#kt_user_assign_exercise_plan'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Exercise Plans</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_user_assign_exercise_plan'
					className='collapse'>
					{!loading ? (
						<>
							<div className='card-body border-top'>
								<div className=' mt-0'>
									<div className=''>
										{/* <div className='card-title w-100'>
											<div className='row w-100 justify-content-between align-items-center'>
												<div className='col-6'>
													<h2 className='fw-bold text-dark fs-1 '>
														Assign Exercise to users
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
															<th>Time Slot</th>
															<th>Assigned On</th>
															<th className='ps-4 rounded-end'>Action</th>
														</tr>
													</thead>
													<tbody className='text-gray-600 fw-bold'>
														{loading ? (
															<tr>
																<td
																	colSpan={12}
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
															assignExerciseData.slice().map((data: any, index: number) => {
																const actualIndex =
																	(pagination.page - 1) * pagination.itemsPerPage + index + 1
																return (
																	<tr key={actualIndex}>
																		<td className='text-center'>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{actualIndex}
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{data.planName || '-'}
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{data.time_slot || '-'}
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{DayJS(data.startDate).format('DD/MM/YYYY hh:mm:ss A')}
																			</span>
																		</td>
																		<td>
																			<TableButton
																				action='view'
																				to={'/fwg/exercise-approve'}
																				text='View Exercise'
																				backgroundDark={true}
																			/>
																		</td>
																	</tr>
																)
															})
														)}
													</tbody>
												</table>
											</div>
										</div>
										{assignExerciseData.length === 0 && !loading && (
											<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
												<b>No records found</b>
											</div>
										)}
										{assignExerciseData.length > 0 && (
											<UsersListPagination
												totalPages={Math.ceil(assignExerciseData.length / pagination.itemsPerPage)}
												currentPage={pagination.page}
												onPageChange={handlePageChange}
											/>
										)}
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
					)}
				</div>
			</div>
		</>
	)
}

export { AssignExerciseData }
