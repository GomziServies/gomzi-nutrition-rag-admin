import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { KTIcon } from '../../../_metronic/helpers'
import { GetUser, GetUserWaterCount, GetUserWeight } from '../../Functions/FWG'
import UsersListPagination from '../TablePagination'
import { DayJS } from '../../../_metronic/helpers/Utils'

type Props = {
	user_id?: string | any
}

const UserWaterIntact: React.FC<Props> = ({ user_id }) => {
	const [searchWaterTerm, setSearchWaterTerm] = useState('')
	const [userWaterData, setUserWaterData] = useState<any>('')
	const [waterIntakeData, setWaterIntakeData] = useState<any>([])
	const [glassPerDay, setGlassPerDay] = useState<any>('')
	const [loading, setLoading] = useState(false)

	const fetchUserWaterIntakeData = async () => {
		setLoading(true)
		try {
			const response: any = await GetUserWaterCount({ user_id: user_id, all: true })
			const data = response.data
			data.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
			setWaterIntakeData(data)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchUserWaterData = async () => {
		setLoading(true)

		try {
			const response: any = await GetUserWeight({ user_id: user_id })
			const data = response.data

			const lastData: any = data[data.length - 1] || 0
			calculateWaterIntake(lastData.weight || 0)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchWaterUserData = async () => {
		setLoading(true)
		try {
			const response: any = await GetUser({ id: user_id })
			setUserWaterData(response.data[0])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const calculateWaterIntake = async (userWeight: any) => {
		const litersPerKg = 0.033
		const recommendedWaterIntakeLiters = userWeight * litersPerKg

		const roundedRecommendedWaterIntake = parseFloat(recommendedWaterIntakeLiters.toFixed(2))

		const glassSizeInLiters = 0.25
		const glassesPerDay = roundedRecommendedWaterIntake / glassSizeInLiters

		setGlassPerDay(glassesPerDay)
	}

	const [paginationWater, setPaginationWater] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageWaterChange = (page: number) => {
		setPaginationWater({ ...paginationWater, page })
	}

	const filteredWaterIntakeData = waterIntakeData.filter((sale: any) =>
		sale.water_count.toString().includes(searchWaterTerm)
	)

	const paginatedWaterIntakeData = filteredWaterIntakeData.slice(
		(paginationWater.page - 1) * paginationWater.itemsPerPage,
		paginationWater.page * paginationWater.itemsPerPage
	)

	const fetchAllData = async () => {
		fetchUserWaterData()
		fetchWaterUserData()
		fetchUserWaterIntakeData()
	}

	return (
		<>
			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					onClick={() => fetchAllData()}
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_water'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Water-Intake</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_water'
					className='collapse'>
					<div className='card-body border-top p-9'>
						{!loading ? (
							<>
								<div className='card-body pt-9 pb-0'>
									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<label
												htmlFor='dfsf'
												className='required fw-bold fs-6 mb-2'>
												Full Name
											</label>
											<p className='form-control form-control-solid mb-3 mb-lg-0'>
												{userWaterData.firstName + ' ' + userWaterData.lastName}
											</p>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label
												htmlFor='dfsf'
												className='required fw-bold fs-6 mb-2'>
												Gender
											</label>
											<p className='form-control form-control-solid mb-3 mb-lg-0'>
												{userWaterData.gender}
											</p>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label
												htmlFor='dfsf'
												className='required fw-bold fs-6 mb-2'>
												Birth Date
											</label>
											<p className='form-control form-control-solid mb-3 mb-lg-0'>
												{DayJS(userWaterData.birthdate).format('YYYY-MM-DD')}
											</p>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<label
												htmlFor='dfsf'
												className='required fw-bold fs-6 mb-2'>
												Email
											</label>
											<p className='form-control form-control-solid mb-3 mb-lg-0'>
												{userWaterData.email}
											</p>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<label
												htmlFor='dfsf'
												className='required fw-bold fs-6 mb-2'>
												Mobile no.
											</label>
											<p className='form-control form-control-solid mb-3 mb-lg-0'>
												{userWaterData.mobile ? userWaterData.mobile : 'N/A'}
											</p>
										</div>
									</div>
								</div>

								<div className=' mt-0 pt-5'>
									<div className='card-header border-0 align-items-center justify-content-end'>
										<div className='card-title w-100'>
											<div className='row w-100 justify-content-between align-items-center'>
												<div className='col-6'>
													<h2 className='fw-bold text-dark fs-1 '>
														Water Intake by User
													</h2>
												</div>
												<div className='col-6 d-flex justify-content-end '>
													<div className='d-flex align-items-center position-relative my-1'>
														<KTIcon
															iconName='magnifier'
															className='fs-1 position-absolute ms-6'
														/>
														<input
															type='text'
															data-kt-user-table-filter='search'
															className='form-control form-control-solid w-250px ps-14'
															placeholder='Search user'
															value={searchWaterTerm}
															onChange={(e) => setSearchWaterTerm(e.target.value)}
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className='py-4 card-body'>
										<div className='table-responsive'>
											<table
												id='kt_table_users'
												className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
												<thead>
													<tr className='fw-bold text-muted bg-light border-bottom-0'>
														<th className='ps-4 rounded-start'>No.</th>
														<th>Water Target</th>
														<th className='ps-4 rounded-end'>Total Water Intake</th>
													</tr>
												</thead>
												<tbody className='text-gray-600 fw-bold'>
													{paginatedWaterIntakeData.map((data: any, index: number) => {
														const actualIndex =
															(paginationWater.page - 1) * paginationWater.itemsPerPage + index + 1
														return (
															<tr key={actualIndex}>
																<td>
																	<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																		{actualIndex}
																	</span>
																</td>
																<td>
																	<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																		{glassPerDay}
																	</span>
																</td>
																<td>
																	<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																		{data.water_count}
																	</span>
																</td>
															</tr>
														)
													})}
												</tbody>
											</table>
										</div>
										{waterIntakeData.length === 0 && (
											<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
												<b>No records found</b>
											</div>
										)}
										{waterIntakeData.length > 0 && (
											<UsersListPagination
												totalPages={Math.ceil(
													waterIntakeData.length / paginationWater.itemsPerPage
												)}
												currentPage={paginationWater.page}
												onPageChange={handlePageWaterChange}
											/>
										)}
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
			</div>
		</>
	)
}

export { UserWaterIntact }
