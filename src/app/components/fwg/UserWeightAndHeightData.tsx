import { faAngleDown, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ApexCharts, { ApexOptions } from 'apexcharts'
import { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { getCSS, getCSSVariableValue } from '../../../_metronic/assets/ts/_utils'
import { KTIcon, toAbsoluteUrl } from '../../../_metronic/helpers'
import { useThemeMode } from '../../../_metronic/partials'
import {
	GetUser,
	GetUserHeight,
	GetUserWeight,
	RemoveUserHeight,
	RemoveUserWeight,
	UpdateUserHeight,
	UpdateUserWeight,
} from '../../Functions/FWG'
import DateFilter from '../DateRangePicker'
import InputField from '../InputField'
import TableButton from '../TableButton'
import UsersListPagination from '../TablePagination'
import { DayJS } from '../../../_metronic/helpers/Utils'

type Props = {
	user_id?: string | any
}

const UserWeightAndHeightData: React.FC<Props> = ({ user_id }) => {
	const [userHeightIsSubmitting, setUserHeightIsSubmitting] = useState(false)
	const [userHeightSearchTerm, setUserHeightSearchTerm] = useState('')
	const [userHeightData, setUserHeightData] = useState<any>('')
	const [heightData, setHeightData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [loadingHeight, setLoadingHeight] = useState(false)
	const [userHeightShowModal, setUserHeightShowModal] = useState(false)
	const [updateHeight, setUpdateHeight] = useState({
		height: '',
	})
	const chartRef = useRef<HTMLDivElement | null>(null)
	const { mode } = useThemeMode()
	const [isSubmittingWeigth, setIsSubmittingWeigth] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [userData, setUserData] = useState<any>('')
	const [weightData, setWeightData] = useState<any>([])
	const [showModal, setShowModal] = useState(false)
	const [chart, setChart] = useState<any>(null)
	const [updateWeight, setUpdateWeight] = useState({
		weight: '',
	})

	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [maxMinData, setMaxMinData] = useState<any>({
		highestWeight: '',
		minWeight: '',
		difference: '',
	})

	const handleInputWeigthChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target

		setUpdateWeight((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const fetchUserWeightData = async () => {
		setLoading(true)
		try {
			const response: any = await GetUserWeight({ user_id: user_id })
			let data = response.data

			if (selectedDateRange && Array.isArray(selectedDateRange)) {
				const [startDate, endDate] = selectedDateRange
				data = data.filter((weight: any) => {
					const createdAtDate = new Date(weight.createdAt)
					return createdAtDate >= startDate && createdAtDate <= endDate
				})
			}

			data.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
			setWeightData(data)

			if (data.length > 0) {
				const max = Math.max(...data.map((item: any) => item.weight))
				const min = Math.min(...data.map((item: any) => item.weight))
				const difference = (data[data.length - 1]?.weight || 0) - (data[0]?.weight || 0)

				setMaxMinData({
					highestWeight: max,
					minWeight: min,
					difference: difference,
				})
			} else {
				setMaxMinData({
					highestWeight: 0,
					minWeight: 0,
					difference: 0,
				})
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchWeightUserData = async () => {
		setLoading(true)
		try {
			const response: any = await GetUser({ id: user_id })
			setUserData(response.data[0])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		if (selectedDateRange) {
			fetchWeightUserData()
			fetchUserWeightData()
		}
	}, [selectedDateRange])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredWeightData = weightData.filter((sale: any) =>
		sale.weight.toString().includes(searchTerm)
	)

	const paginatedWeightData = filteredWeightData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const refreshChart = () => {
		if (!chartRef.current) {
			return
		}

		const height = parseInt(getCSS(chartRef.current, 'height'))

		const newChart = new ApexCharts(chartRef.current, getChartOptions(height, weightData))
		newChart.render()

		return newChart
	}

	useEffect(() => {
		const chartInstance = refreshChart()
		setChart(chartInstance)

		return () => {
			if (chartInstance) {
				chartInstance.destroy()
			}
		}
	}, [])

	useEffect(() => {
		if (chart) {
			chart.updateSeries([
				{
					name: 'User Weight',
					data: weightData.map((item: any) => ({
						x: DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
						y: item.weight,
					})),
				},
			])
		}
	}, [weightData])

	useEffect(() => {
		const chart = refreshChart()

		return () => {
			if (chart) {
				chart.destroy()
			}
		}
	}, [chartRef, mode])

	const handleDeleteWeight = async (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'You want to remove this User Weight',
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Remove',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveUserWeight({ id: id })
					toast.success('User-Weight removed successfully')
					fetchUserWeightData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const handleUpdateWeight = async () => {
		const weightValue: any = updateWeight.weight

		if (!weightValue) {
			return toast.error('Weight Required')
		}
		if (isNaN(weightValue)) {
			return toast.error('Weight must be numbers')
		}
		if (weightValue <= 0) {
			return toast.error('Weight must be positive numbers')
		}
		try {
			setIsSubmittingWeigth(true)
			const payload = {
				weight: Number(updateWeight.weight),
				user_id: user_id,
			}

			await UpdateUserWeight(payload)

			toast.success('User-weight Updated successfully')
			fetchUserWeightData()
			setShowModal(false)
			setIsSubmittingWeigth(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmittingWeigth(false)
			console.error(error)
		}
	}

	const [selectedHeightDateRange, setSelectedHeightDateRange] = useState<[Date, Date] | null>(null)

	const handleHeightInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target

		setUpdateHeight((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const fetchUserHeightData = async () => {
		setLoadingHeight(true)
		try {
			const response: any = await GetUserHeight({ user_id: user_id })
			let data = response.data

			if (selectedHeightDateRange && Array.isArray(selectedHeightDateRange)) {
				const [startDate, endDate] = selectedHeightDateRange
				data = data.filter((weight: any) => {
					const createdAtDate = new Date(weight.createdAt)
					return createdAtDate >= startDate && createdAtDate <= endDate
				})
			}

			data.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
			setHeightData(data)
		} catch (error) {
			console.error(error)
		}
		setLoadingHeight(false)
	}

	const fetchHeightUserData = async () => {
		setLoadingHeight(true)
		try {
			const response: any = await GetUser({ id: user_id })
			setUserHeightData(response.data[0])
		} catch (error) {
			console.error(error)
		}
		setLoadingHeight(false)
	}

	useEffect(() => {
		if (selectedHeightDateRange) {
			fetchHeightUserData()
			fetchUserHeightData()
		}
	}, [selectedHeightDateRange])

	const [paginationHeight, setPaginationHeight] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleHeightPageChange = (page: number) => {
		setPaginationHeight({ ...paginationHeight, page })
	}

	const filteredHeightData = heightData.filter((sale: any) =>
		sale.height.toString().includes(userHeightSearchTerm)
	)

	const paginatedHeightData = filteredHeightData.slice(
		(paginationHeight.page - 1) * paginationHeight.itemsPerPage,
		paginationHeight.page * paginationHeight.itemsPerPage
	)

	const handleHeightDelete = async (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'You want to remove this User Height',
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Remove',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveUserHeight({ id: id })
					toast.success('User-Height removed successfully')
					fetchUserHeightData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const handleHeightDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedHeightDateRange(dateRange)
		setPaginationHeight({ ...paginationHeight, page: 1 })
	}

	const handleUpdateWeightHeight = async () => {
		const heightValue: any = updateHeight.height

		if (!heightValue) {
			return toast.error('Height Required')
		}
		if (isNaN(heightValue)) {
			return toast.error('Height must be numbers')
		}
		if (heightValue <= 0) {
			return toast.error('Height must be positive numbers')
		}
		try {
			setUserHeightIsSubmitting(true)
			const payload = {
				height: Number(updateHeight.height),
				user_id: user_id,
			}

			await UpdateUserHeight(payload)

			toast.success('User-weight Updated successfully')
			fetchUserHeightData()
			setUserHeightShowModal(false)
			setUserHeightIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setUserHeightIsSubmitting(false)
			console.error(error)
		}
	}

	const fetchAllDataWeight = async () => {
		fetchWeightUserData()
		fetchUserWeightData()
	}

	const fetchAllDataHeight = async () => {
		fetchHeightUserData()
		fetchUserHeightData()
	}

	return (
		<>
			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					onClick={() => {
						fetchAllDataWeight()
					}}
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_user_weight_view'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Weight</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_user_weight_view'
					className='collapse'>
					{!loading ? (
						<>
							<div className='border-top p-9'>
								<div className='d-flex flex-wrap flex-sm-nowrap mb-3'>
									<div className='me-7 mb-4'>
										<div className='symbol symbol-100px symbol-fixed position-relative'>
											<img
												src={userData.profile_image || toAbsoluteUrl('/media/avatars/300-1.jpg')}
												alt='Metronic'
											/>
											<div className='position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px'></div>
										</div>
									</div>
									<div className='flex-grow-1'>
										<div className='d-flex justify-content-between align-items-start flex-wrap mb-2'>
											<div className='d-flex flex-column'>
												<div className='d-flex align-items-center mb-2'>
													<span className='text-gray-800  fs-2 fw-bolder me-1'>
														{userData.firstName + userData.lastName}
													</span>
												</div>
											</div>
										</div>
										<div className='d-flex flex-wrap flex-stack'>
											<div className='d-flex flex-column flex-grow-1 pe-8'>
												<div className='d-flex flex-wrap'>
													<div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
														<div className='d-flex align-items-center'>
															<KTIcon
																iconName='arrow-up'
																className='fs-3 text-success me-2'
															/>
															<div className='fs-2 fw-bolder'>{maxMinData.highestWeight}</div>
														</div>

														<div className='fw-bold fs-6 text-gray-400'>Highest</div>
													</div>

													<div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
														<div className='d-flex align-items-center'>
															<KTIcon
																iconName='arrow-down'
																className='fs-3 text-danger me-2'
															/>
															<div className='fs-2 fw-bolder'>{maxMinData.minWeight}</div>
														</div>

														<div className='fw-bold fs-6 text-gray-400'>Lowest</div>
													</div>

													<div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
														<div className='d-flex align-items-center'>
															<KTIcon
																iconName='arrow-up'
																className='fs-3 text-success me-2'
															/>
															<div className='fs-2 fw-bolder'>{maxMinData.difference}</div>
														</div>

														<div className='fw-bold fs-6 text-gray-400'>Difference</div>
													</div>
												</div>
											</div>
											<div className='d-flex align-items-center w-200px w-sm-300px flex-column mt-3'>
												<div className='d-flex justify-content-between w-100 mt-auto mb-2'>
													<span className='fw-bold fs-6 text-gray-400'>Progress</span>
													<span className='fw-bolder fs-6'>
														{Math.round(maxMinData.difference) + '%'}
													</span>
												</div>
												<div className='h-5px mx-3 w-100 bg-light mb-3'>
													<div
														className='bg-success rounded h-5px'
														role='progressbar'
														style={{ width: Math.round(maxMinData.difference) + '%' }}></div>
												</div>
											</div>
										</div>
									</div>
								</div>
								{/* <div className=' mt-10 pt-5'>
							<h2 className='mb-8'>User Weight Graph</h2>
							<div className='row my-5'>
								<div className='col-md-6'>
									<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
								</div>
								
							</div>
							<div className=' border-0'>
								<h3 className=' align-items-start flex-column'>
									<span className='card-label fw-bold fs-3 my-1'>Week wise chart</span>
								</h3>
							</div>
							<div className=''>
								<div
									ref={chartRef}
									id='kt_charts_widget_8_chart'
									style={{ height: '400px' }}
									className='card-rounded-bottom'></div>
							</div>
						</div> */}
								<div className=' mt-5 pt-5'>
									<h2 className='mb-4'>Weight Table</h2>
									<div className='border-0 pt-6'>
										<div className='card-title'>
											<div className='row'>
												<div className='col-6'>
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
															value={searchTerm}
															onChange={(e) => setSearchTerm(e.target.value)}
														/>
													</div>
												</div>
												<div className='col-md-6 text-end'>
													<TableButton
														action='edit'
														onClick={() => setShowModal(true)}
														text='Update Weight'
														backgroundDark={true}
													/>
												</div>
											</div>
										</div>
									</div>
									<div className='py-4 '>
										<div className='table-responsive'>
											<table
												id='kt_table_users'
												className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
												<thead>
													<tr className='fw-bold text-muted bg-light border-bottom-0'>
														<th className='ps-4 rounded-start'>No.</th>
														<th>Weight</th>
														<th>Date</th>
														<th className='ps-4 rounded-end'>Action</th>
													</tr>
												</thead>
												<tbody className='text-gray-600 fw-bold'>
													{paginatedWeightData.map((data: any, index: number) => {
														const actualIndex =
															(pagination.page - 1) * pagination.itemsPerPage + index + 1
														return (
															<tr key={data._id}>
																<td>
																	<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																		{actualIndex}
																	</span>
																</td>
																<td>
																	<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																		{data.weight}
																	</span>
																</td>
																<td>
																	<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																		{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
																	</span>
																</td>
																<td>
																	<TableButton
																		action='remove'
																		onClick={() => handleDeleteWeight(data._id)}
																	/>
																</td>
															</tr>
														)
													})}
												</tbody>
											</table>
										</div>
										{weightData.length === 0 && (
											<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
												<b>No records found</b>
											</div>
										)}
										{weightData.length > 0 && (
											<UsersListPagination
												totalPages={Math.ceil(weightData.length / pagination.itemsPerPage)}
												currentPage={pagination.page}
												onPageChange={handlePageChange}
											/>
										)}
									</div>
								</div>
								<Modal
									centered
									show={showModal}
									onHide={() => setShowModal(false)}>
									<div className='modal-content'>
										<div className='modal-header pb-0 border-0 justify-content-between'>
											<div className='text-center'>
												<h2 className='mb-3'>Update (in kg)</h2>
											</div>
											<button
												className='btn btn-sm btn-icon btn-active-color-primary'
												onClick={() => setShowModal(false)}>
												<FontAwesomeIcon
													className='fs-1 position-absolute ms-3'
													icon={faXmark}
												/>
											</button>
										</div>
										<div className='modal-body scroll-y mx-3 pt-0 mt-3'>
											<div>
												<div className='border-bottom mb-10'></div>
												<div className='row'>
													<InputField
														className='col-md-12 fv-row'
														label='Weight'
														placeholder='Enter Weight(in kg)'
														type='number'
														name='weight'
														htmlFor='weight'
														value={updateWeight.weight}
														onChange={handleInputWeigthChange}
													/>
												</div>
											</div>
											<div className='mt-7 text-center'>
												<TableButton
													action='assign'
													onClick={handleUpdateWeight}
													text={isSubmittingWeigth ? 'Please wait, Update Weight...' : 'Update'}
													showIcon={false}
													disabled={isSubmittingWeigth}
													backgroundDark={true}
													className={`mb-4 w-100 btn-block ${isSubmittingWeigth ? 'disabled' : ''}`}
												/>
											</div>
										</div>
									</div>
								</Modal>
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

			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					onClick={() => fetchAllDataHeight()}
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_height'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Height</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_height'
					className='collapse'>
					{!loadingHeight ? (
						<>
							<div className='card-body border-top p-9'>
								<div className='card-body pt-9 pb-0'>
									<div className='d-flex flex-wrap flex-sm-nowrap mb-3'>
										<div className='me-7 mb-4'>
											<div className='symbol symbol-100px symbol-fixed position-relative'>
												<img
													src={
														userHeightData.profile_image ||
														toAbsoluteUrl('/media/avatars/300-1.jpg')
													}
													alt='Metronic'
												/>
												<div className='position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px'></div>
											</div>
										</div>
										<div className='flex-grow-1'>
											<div className='d-flex justify-content-between align-items-start flex-wrap mb-2'>
												<div className='d-flex flex-column'>
													<div className='d-flex align-items-center mb-2'>
														<span className='text-gray-800  fs-2 fw-bolder me-1'>
															{userHeightData.firstName + userHeightData.lastName}
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className=' mt-10 pt-5'>
									<h2 className='mb-6'>Height Table</h2>
									<div className=''>
										<div className='row'>
											<div className='col-md-8'>
												<div className='d-flex'>
													<div className='d-flex align-items-center position-relative ms-0 mx-3'>
														<KTIcon
															iconName='magnifier'
															className='fs-1 position-absolute ms-6'
														/>
														<input
															type='text'
															data-kt-user-table-filter='search'
															className='form-control form-control-solid w-250px ps-14'
															placeholder='Search user'
															value={userHeightSearchTerm}
															onChange={(e) => setUserHeightSearchTerm(e.target.value)}
														/>
													</div>
													<DateFilter onDateRangeChange={handleHeightDateRangeChange} />
												</div>
											</div>
											<div className='col-md-4 text-end'>
												<TableButton
													action='edit'
													onClick={() => setUserHeightShowModal(true)}
													text='Update Weight'
													backgroundDark={true}
												/>
											</div>
										</div>
									</div>
									<div className=''>
										<div className='py-4'>
											<div className='table-responsive'>
												<table
													id='kt_table_users'
													className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
													<thead>
														<tr className='fw-bold text-muted bg-light border-bottom-0'>
															<th className='ps-4 rounded-start'>No.</th>
															<th>Height</th>
															<th>Date</th>
															<th className='ps-4 rounded-end'>Action</th>
														</tr>
													</thead>
													<tbody className='text-gray-600 fw-bold'>
														{paginatedHeightData.map((data: any, index: number) => {
															const actualIndex =
																(paginationHeight.page - 1) * paginationHeight.itemsPerPage +
																index +
																1
															return (
																<tr key={data._id}>
																	<td>
																		<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																			{actualIndex}
																		</span>
																	</td>
																	<td>
																		<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																			{data.height}
																		</span>
																	</td>
																	<td>
																		<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																			{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
																		</span>
																	</td>
																	<td>
																		<TableButton
																			action='remove'
																			onClick={() => handleHeightDelete(data._id)}
																		/>
																	</td>
																</tr>
															)
														})}
													</tbody>
												</table>
											</div>
											{heightData.length === 0 && (
												<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
													<b>No records found</b>
												</div>
											)}
											{heightData.length > 0 && (
												<UsersListPagination
													totalPages={Math.ceil(heightData.length / paginationHeight.itemsPerPage)}
													currentPage={paginationHeight.page}
													onPageChange={handleHeightPageChange}
												/>
											)}
										</div>
									</div>
								</div>
								<Modal
									centered
									show={userHeightShowModal}
									onHide={() => setUserHeightShowModal(false)}>
									<div className='modal-content'>
										<div className='modal-header pb-0 border-0 justify-content-between'>
											<div className='text-center'>
												<h2 className='mb-3'>Update (in cm)</h2>
											</div>
											<button
												className='btn btn-sm btn-icon btn-active-color-primary'
												onClick={() => setUserHeightShowModal(false)}>
												<FontAwesomeIcon
													className='fs-1 position-absolute ms-3'
													icon={faXmark}
												/>
											</button>
										</div>
										<div className='modal-body scroll-y mx-3 pt-0 mt-3'>
											<div>
												<div className='border-bottom mb-10'></div>
												<div className='row'>
													<InputField
														className='col-md-12 fv-row'
														label='Height'
														placeholder='Enter Height(in cm)'
														type='number'
														name='height'
														htmlFor='height'
														value={updateHeight.height}
														onChange={handleHeightInputChange}
													/>
												</div>
											</div>
											<div className='mt-7 text-center'>
												<TableButton
													action='assign'
													onClick={handleUpdateWeightHeight}
													text={
														userHeightIsSubmitting
															? 'Please wait, assign plan/feature...'
															: 'Assign'
													}
													showIcon={false}
													disabled={userHeightIsSubmitting}
													backgroundDark={true}
													className={`mb-4 w-100 btn-block ${
														userHeightIsSubmitting ? 'disabled' : ''
													}`}
												/>
											</div>
										</div>
									</div>
								</Modal>
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

export { UserWeightAndHeightData }

function getChartOptions(height: number, weightData: any): ApexOptions {
	const labelColor = getCSSVariableValue('--bs-gray-500')
	const borderColor = getCSSVariableValue('--bs-gray-200')
	const strokeColor = getCSSVariableValue('--bs-gray-300')

	const color2 = getCSSVariableValue('--bs-success')
	const color2Light = getCSSVariableValue('--bs-success-light')

	return {
		series: [
			{
				name: 'User Weight',
				data: weightData.map((item: any) => ({
					x: DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
					y: item.weight,
				})),
			},
		],
		chart: {
			fontFamily: 'inherit',
			type: 'area',
			height: height,
			toolbar: {
				show: false,
			},
			zoom: {
				enabled: true,
			},
			sparkline: {
				enabled: false,
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
			width: 2,
			colors: [color2],
		},
		xaxis: {
			offsetX: 1,
			offsetY: 1,
			categories: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
			axisBorder: {
				show: true,
			},
			axisTicks: {
				show: true,
			},
			labels: {
				show: true,
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
			max: 160,
			tickAmount: 8,
			labels: {
				show: true,
				style: {
					colors: labelColor,
					fontSize: '12px',
				},
				formatter: function (val) {
					return val.toFixed(0)
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
					return val.toFixed(0)
				},
			},
		},
		colors: [color2Light],
		grid: {
			borderColor: borderColor,
			strokeDashArray: 4,
			padding: {
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
			},
		},
		markers: {
			colors: [color2],
			strokeColors: [color2],
			strokeWidth: 3,
		},
	}
}
