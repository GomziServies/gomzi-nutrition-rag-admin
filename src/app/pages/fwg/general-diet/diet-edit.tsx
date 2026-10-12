import { faCheck, faUpRightFromSquare, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import InputField from '../../../components/InputField'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	AddDietPlanItem,
	GetDietPlan,
	GetFoodBundle,
	GetFoodCategory,
	GetFoodTime,
	RemoveDietPlanItem,
	UpdateAssignedDietPlan,
	UpdateDietPlan,
	UpdateDietPlanItem,
	WithdrawDietPlan,
} from '../../../Functions/FWG'
import { DayJS } from '../../../../_metronic/helpers/Utils'

type Category = {
	_id: string
	category: string
}

type Times = {
	_id: string
	food_time: string
}

type FoodBundle = {
	food_bundle_id: string
	bundle_name: string
	food_time: string
	category: string
}

const DietEdit: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const diet_id: string | any = searchParams.get('diet_id')
	const user_approve_id: string | any = searchParams.get('user_id')
	const diet_approve = searchParams.get('diet_approve') === 'true'
	const [searchTerm, setSearchTerm] = useState('')
	const [dietfoodsearchTerm, setDietFoodSearchTerm] = useState('')
	const [categories, setCategories] = useState<Category[]>([])
	const [showModal, setShowModal] = useState(false)
	const [selectedId, setSelectedId] = useState('')
	const [times, setTimes] = useState<Times[]>([])
	const [listTime, setListTime] = useState('')
	const [filteredFoodBundleData, setFilteredFoodBundleData] = useState<FoodBundle[]>([])
	const [dietItems, setDietItems] = useState<any[]>([])
	const [startDate, setStartDate] = useState('')
	const [openModal, setOpenModal] = useState(false)
	const [loading, setLoading] = useState(false)
	const [editFoodId, setEditFoodId] = useState<string | null>(null)
	const [metaData, setMetaData] = useState<any>()
	const [contactInquiry, setContactInquiry] = useState<any>([])
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [dietItemID, setDietItemID] = useState('')
	const [dietName, setDietName] = useState('')
	const [openDietItemModal, setOpenDietItemModal] = useState(false)
	const [userData, setUserData] = useState<any>({
		user_id: '',
		user_name: '',
		assigned_on: '',
		id: '',
	})
	const [dietData, setDietData] = useState({
		_id: '',
		plan_name: '',
		category_id: '',
		food_type: '',
		days: '',
	})
	const [newFoodBundleData, setNewFoodBundleData] = useState({
		diet_id: '',
		food_bundle_id: '',
		time: '',
		food_time_id: '',
	})
	const [updateDietItemData, setUpdateDietItemData] = useState({
		dietName: '',
		time: '',
		food_time_id: '',
		food_bundle_id: '',
		diet_plan_item_id: '',
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 20,
	})

	const handleModalOpen = (id: string) => {
		setShowModal(true)
		setSelectedId(id)
	}

	const fetchCategories = async () => {
		try {
			const response: any = await GetFoodCategory()
			setCategories(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchTime = async () => {
		try {
			const diet_response: any = await GetDietPlan({ id: diet_id })
			const userApprove = diet_response?.data.map((item: any) => item.diet_assigned_user).flat()
			const filteredData: any = userApprove.filter((item: any) => !item.status)
			const diet_items = diet_response?.data[0]?.diet_items
			const response: any = await GetFoodTime()
			setTimes(response.data)
			setDietItems(diet_items)

			setDietData(diet_response.data[0])
			const userDataFilter = filteredData.filter((user: any) => user.user_id === user_approve_id)
			setUserData({
				id: userDataFilter[0]?._id || '',
				user_id: userDataFilter[0]?.user_id || '',
				user_name:
					userDataFilter[0]?.user_info.firstName + ' ' + userDataFilter[0]?.user_info.lastName,
				assigned_on: DayJS(userDataFilter[0]?.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
			})
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchFoodBundleData = async (food_time_id: string, page?: number) => {
		setLoading(true)
		try {
			let response
			if (searchTerm) {
				response = await GetFoodBundle({
					food_time_id: food_time_id,
					page: page || pagination.page,
					limit: pagination.itemsPerPage,
					search: searchTerm,
					sort,
					sortOrder,
				})
			} else {
				response = await GetFoodBundle({
					food_time_id: food_time_id,
					page: page || pagination.page,
					limit: pagination.itemsPerPage,
					sort,
					sortOrder,
				})
			}
			setFilteredFoodBundleData(response.data)

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchCategories()
		fetchTime()
	}, [])

	const handleUpdateClick = async () => {
		try {
			const formDataWith: any = {
				diet_id: diet_id,
				_id: dietData._id,
				plan_name: dietData.plan_name,
				category_id: dietData.category_id,
				days: dietData.days,
				food_type: dietData.food_type,
			}
			await UpdateDietPlan(formDataWith)
			fetchTime()
			toast.success('Diet Data Update Successfully')

			setDietData({
				_id: '',
				plan_name: '',
				category_id: '',
				food_type: '',
				days: '',
			})
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleApproveAssign = async () => {
		if (!startDate) {
			toast.error('Please select start date')
			return
		}

		const payload: any = {
			diet_assigned_id: selectedId,
			status: true,
			start_date: startDate,
		}
		try {
			await UpdateAssignedDietPlan(payload)
			toast.success('Diet Approve successfully')
			setShowModal(false)
			fetchTime()
			setTimeout(() => {
				navigate('/fwg/diet-details/diet-edit')
			}, 1000)
		} catch (error: any) {
			console.error(error)
			toast.error(error.message)
		}
	}

	useEffect(() => {
		if (listTime) {
			fetchFoodBundleData(listTime)
		}
	}, [pagination.itemsPerPage, pagination.page, searchTerm])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		if (name === 'list_time') {
			setListTime(value)
			fetchFoodBundleData(value)
		} else {
			setDietData((prevDietData) => ({ ...prevDietData, [name]: value }))
		}
	}

	const handleWithdrawAssign = async (id: string) => {
		try {
			Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to Withdraw Diet plan.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			}).then(async (result: any) => {
				if (result.isConfirmed) {
					const response: any = await WithdrawDietPlan({ id: id })
					if (response.status === 200) {
						toast.success('Diet Withdraw Successfully')
						fetchTime()
						setTimeout(() => {
							navigate('/fwg/diet-details/diet-edit')
						}, 1000)
					} else {
						toast.error('Failed to Withdraw Diet')
					}
				}
			})
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleNewFoodBundleInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setNewFoodBundleData({ ...newFoodBundleData, [name]: value })
	}

	const handleUpdateFoodBundleInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateDietItemData({ ...updateDietItemData, [name]: value })
	}

	const handleAddDietPlanItem = async () => {
		try {
			const formattedTime = newFoodBundleData.time.includes(':')
				? newFoodBundleData.time
				: `${newFoodBundleData.time}:00`
			const data: any = {
				diet_id: diet_id,
				food_bundle_id: dietItemID,
				time: formattedTime,
				food_time_id: newFoodBundleData.food_time_id,
			}
			await AddDietPlanItem(data)
			fetchTime()
			setOpenModal(false)
			toast.success('Food Bundle Item Added Successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const removeDietItem = async (dietItemId: string) => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to remove this food.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			})

			if (result.isConfirmed) {
				const response: any = await RemoveDietPlanItem({ diet_plan_item_id: dietItemId })
				if (response.status === 200) {
					fetchTime()
					toast.success('Food removed successfully')
				} else {
					toast.error('Failed to remove food')
				}
			}
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const handleUpdateDietItem = async () => {
		try {
			const formattedTime = updateDietItemData.time.includes(':')
				? updateDietItemData.time
				: `${updateDietItemData.time}:00`
			const payload: any = {
				diet_plan_item_id: updateDietItemData.diet_plan_item_id,
				food_bundle_id: updateDietItemData.food_bundle_id,
				time: formattedTime,
				food_time_id: updateDietItemData.food_time_id,
			}
			payload.id = editFoodId
			await UpdateDietPlanItem(payload)
			toast.success('Diet Item Updated Successfully')

			setOpenDietItemModal(false)
			fetchTime()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const openModalWithData = async (id: string, name: string) => {
		setDietName(name)
		setDietItemID(id)
		setOpenModal(true)
	}

	const openItemModal = async (data: any) => {
		setUpdateDietItemData({
			dietName: data?.food_bundle?.bundle_name,
			time: data.time,
			food_time_id: data.food_time_id,
			food_bundle_id: data.food_bundle_id,
			diet_plan_item_id: data._id,
		})
		setEditFoodId(data._id)
		setOpenDietItemModal(true)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Diets Details</PageTitle>

			{diet_approve == true ? (
				<div className='row mx-0 mt-5'>
					<KTCard>
						<h1 className='fw-bold text-dark fs-1 m-6 '>User Data</h1>
						<div className='card-body mb-4'>
							<div className='row'>
								<CopyableInput
									placeholder='User ID'
									type='text'
									className='col-md-4 fv-row mb-7'
									name='user_id'
									label='Enter User ID'
									htmlFor='user_id'
									value={userData.user_id}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='User Name'
									type='text'
									className='col-md-3 fv-row mb-7'
									name='user_name'
									label='User Name'
									htmlFor='user_name'
									value={userData.user_name}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='Start Date'
									type='text'
									className='col-md-3 fv-row mb-7'
									name='assigned_on'
									label='Start Date'
									htmlFor='assigned_on'
									value={userData.assigned_on}
									onChange={handleInputChange}
								/>
							</div>
							<div className='text-end'>
								<button
									onClick={() => handleModalOpen(userData.id)}
									className='btn gap-2 btn-light-success mx-2 btn-sm me-1'>
									<FontAwesomeIcon
										icon={faCheck}
										className='fs-3'
									/>{' '}
									Approve
								</button>
								<button
									onClick={() => handleWithdrawAssign(userData.id)}
									className='btn gap-2 btn-light-danger mx-2 btn-sm me-1'>
									<FontAwesomeIcon
										icon={faXmark}
										className='fs-3'
									/>{' '}
									Reject
								</button>
							</div>
						</div>
						<Modal
							centered
							show={showModal}
							onHide={() => setShowModal(false)}
							className='modal fade'>
							<div className='modal-content border-0'>
								<div className='modal-header border-0 justify-content-end'>
									<button
										type='button'
										onClick={() => setShowModal(false)}
										className='btn-close'></button>
								</div>
								<div className='text-center mb-4'>
									<img
										src={toAbsoluteUrl('/media/images/question-mark.png')}
										alt='Question Mark'
										style={{ width: '80px', height: '80px' }}
									/>
									<h2
										className='fw-bold mt-3'
										style={{ fontSize: '25px' }}>
										Are you sure?
									</h2>
								</div>
								<div className='modal-body'>
									<div className='row g-3 mb-4'>
										<div className='col-12 mt-6'>
											<label
												htmlFor='dd'
												className='required fw-bold mb-2'
												style={{ fontSize: '15px' }}>
												Start Date
											</label>
											<input
												type='date'
												name='start_date'
												className='form-control form-control-lg'
												autoComplete='off'
												value={startDate}
												onChange={(e) => setStartDate(e.target.value)}
											/>
										</div>
									</div>
								</div>
								<div className='modal-footer border-0 d-flex justify-content-flex-end'>
									<button
										className='btn btn-primary me-3'
										onClick={handleApproveAssign}>
										<FontAwesomeIcon
											className='me-2'
											icon={faCheck}
										/>
										Approve & Assign
									</button>
									<button
										className='btn btn-secondary'
										data-bs-dismiss='modal'
										onClick={() => setShowModal(false)}>
										Cancel
									</button>
								</div>
							</div>
						</Modal>
					</KTCard>
				</div>
			) : (
				''
			)}

			<div className='row mx-0 mt-10'>
				<KTCard>
					<h1 className='fw-bold text-dark fs-1 m-6 '>Update Diet Plan</h1>
					<div className='card-body mb-4'>
						<div className='row'>
							<CopyableInput
								placeholder='Id'
								type='text'
								className='col-md-4 fv-row mb-7'
								name='_id'
								label='Id'
								htmlFor='_id'
								value={dietData._id}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Diet Plan'
								type='text'
								className='col-md-4 fv-row mb-7'
								name='plan_name'
								label='Diet Plan'
								htmlFor='plan_name'
								value={dietData.plan_name}
								onChange={handleInputChange}
							/>
							<SelectFieldManual
								className='col-md-4 fv-row mb-7'
								label='Category'
								name='category_id'
								value={dietData.category_id}
								onChange={handleInputChange}
								htmlFor='category_id'
								options={categories.map((category) => ({
									value: category._id,
									name: category.category,
								}))}
							/>
							<SelectField
								className='col-md-4 fv-row mb-7'
								label='Food Type'
								name='food_type'
								value={dietData.food_type}
								onChange={handleInputChange}
								htmlFor='food_type'
								options={['VEGETARIAN', 'NON-VEGETARIAN', 'VEGAN']}
							/>
							<InputField
								placeholder='Diet Plan'
								type='number'
								className='col-md-4 fv-row mb-7'
								name='days'
								label='Total Day (Duration)'
								htmlFor='days'
								value={dietData.days}
								onChange={handleInputChange}
							/>
						</div>
						<div className='text-end'>
							<button
								className='btn btn-primary'
								onClick={handleUpdateClick}>
								Update
							</button>
						</div>
					</div>
				</KTCard>
			</div>
			<div className='row mt-15'>
				<div className='col-md-6'>
					<KTCard className='pb-3'>
						<div className='card-header border-0 pt-6'>
							<div className='card-toolbar'>
								<h2 className='fw-bold text-dark fs-1 '>All Food Bundles</h2>
							</div>
						</div>
						<div className='card-header border-0'>
							<div className='col-md-10'>
								<div className='row'>
									<div className='col-md-6'>
										<select
											className='form-control form-select form-control-solid mb-3 mb-lg-0'
											name='list_time'
											value={listTime}
											onChange={handleInputChange}>
											<option>Select Food Time</option>
											{times.map((time: any) => (
												<option
													key={time._id}
													value={time?._id}>
													{time?.food_time}
												</option>
											))}
										</select>
									</div>
									<div className='col-md-6'>
										<SearchFilter
											style={{ margin: '0!important' }}
											searchTerm={searchTerm}
											setSearchTerm={setSearchTerm}
										/>
									</div>
								</div>
							</div>
						</div>
						<div className='card-body h-458px'>
							<table
								id='kt_table_users'
								className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
								<thead>
									<tr className='fw-bold text-muted bg-light border-bottom-0'>
										<th className='ps-4 rounded-start'>No.</th>
										<th>Food Bundle</th>
										<th>Category</th>
										<th>Time</th>
										<th className='ps-4 rounded-end'>Action</th>
									</tr>
								</thead>
								<tbody className='text-gray-600 fw-bold'>
									{loading ? (
										<tr>
											<td
												colSpan={12}
												className='text-center'>
												<div className='d-flex justify-content-center align-items-center my-7'>
													<div
														className='spinner-border text-primary'
														role='status'>
														<span className='visually-hidden'>Loading...</span>
													</div>
												</div>
											</td>
										</tr>
									) : filteredFoodBundleData.length > 0 ? (
										filteredFoodBundleData.map((foodtime: any, index: any) => (
											<tr key={index}>
												<td className='text-center'>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>{index + 1}</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{foodtime.bundle_name}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{foodtime.food_category.category}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{foodtime?.food_time[0]?.food_time}
													</span>
												</td>
												<td>
													<TableButton
														action='add'
														onClick={() => openModalWithData(foodtime._id, foodtime.bundle_name)}
													/>
												</td>
											</tr>
										))
									) : (
										!listTime && (
											<tr>
												<td
													colSpan={5}
													className='text-center'>
													<span className='text-gray-600'>Select Food Time</span>
												</td>
											</tr>
										)
									)}
								</tbody>
							</table>
						</div>
						{filteredFoodBundleData.length === 0 && listTime && !loading && (
							<div className='d-flex mb-5 text-center w-100 align-content-center justify-content-center'>
								<b>No records found</b>
							</div>
						)}
						{filteredFoodBundleData.length > 0 && (
							<div className='pe-3'>
								<UsersListPagination
									totalPages={metaData?.totalPages}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							</div>
						)}
					</KTCard>
				</div>

				<div className='col-md-6'>
					<KTCard>
						<div className='card-header border-0 pt-6'>
							<div className='card-toolbar'>
								<h2 className='fw-bold text-dark fs-1 '>Diet Food Bundles</h2>
							</div>
							<div className='card-title'>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
							</div>
						</div>
						<div className='card-body mt-4 mb-4 h-456px'>
							<table
								id='kt_table_users'
								className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
								<thead>
									<tr className='fw-bold text-muted'>
										<th>No.</th>
										<th>Food Bundle</th>
										<th>Food Time</th>
										<th>Time</th>
										<th className='ps-4 rounded-end'>Action</th>
									</tr>
								</thead>
								<tbody className='text-gray-600 fw-bold'>
									{dietItems.length > 0 ? (
										dietItems.map((data: any, index: any) => (
											<tr key={index}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>{index + 1}</span>
												</td>
												<td>
													<Link to={`/fwg/food-bundle-item?bundle_id=${data?.food_bundle?._id}`}>
														<div className='d-flex'>
															<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																{data?.food_bundle?.bundle_name}
															</span>
															<FontAwesomeIcon
																icon={faUpRightFromSquare}
																className='ms-3 fs-5'
															/>
														</div>
													</Link>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data?.diet_items_time_info?.food_time}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.time && DayJS(data.time, 'HH:mm').format('hh:mm A')}
													</span>
												</td>
												<td>
													<div className='d-flex'>
														<TableButton
															action='view'
															onClick={() => openItemModal(data)}
														/>
														<TableButton
															action='remove'
															onClick={() => removeDietItem(data._id)}
														/>
													</div>
												</td>
											</tr>
										))
									) : (
										<tr>
											<td
												colSpan={5}
												className='text-center'>
												<span className='text-gray-600'>Data Not Found</span>
											</td>
										</tr>
									)}
								</tbody>
							</table>
							{dietItems.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(dietItems.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					</KTCard>
					{/*add Modal*/}
					<Modal
						centered
						show={openModal}
						onHide={() => setOpenModal(false)}
						className='modal fade'>
						<div className='modal-content'>
							<div className='modal-header justify-content-between'>
								<h2 className='fw-bolder'>Food Bundle Item : {dietName}</h2>
								<button
									onClick={() => setOpenModal(false)}
									className='btn btn-sm btn-icon btn-active-color-primary'
									data-bs-dismiss='modal'>
									<FontAwesomeIcon
										className='fs-1 position-absolute ms-3'
										icon={faXmark}
									/>
								</button>
							</div>
							<div className='modal-body scroll-y'>
								<div className='row'>
									<div className='col-md-6 fv-row mb-7'>
										<label
											htmlFor='foodTime'
											className='required fw-bold fs-6 mb-5'>
											Food Time
										</label>
										<select
											name='food_time_id'
											className='form-control form-select form-control-solid mb-3 mb-lg-0'
											autoComplete='off'
											onChange={handleNewFoodBundleInputChange}>
											<option value=''>Choose</option>
											{times.map((time) => (
												<option
													key={time._id}
													value={time._id}>
													{time.food_time}
												</option>
											))}
										</select>
									</div>
									<div className='col-md-6 fv-row mb-7'>
										<label
											htmlFor='food_time'
											className='required fw-bold fs-6 mb-5'>
											Time (24-Hour)
										</label>
										<input
											type='time'
											name='time'
											className='form-control form-control-solid mb-3 mb-lg-0'
											autoComplete='off'
											onChange={handleNewFoodBundleInputChange}
										/>
									</div>
								</div>
							</div>
							<div className='modal-footer justify-content-end'>
								<button
									onClick={handleAddDietPlanItem}
									className='btn btn-primary'>
									<KTIcon
										iconName='plus'
										className='fs-2'
									/>
									Add
								</button>
							</div>
						</div>
					</Modal>

					{/* Update View Bundle Modal  */}
					<Modal
						show={openDietItemModal}
						centered
						onHide={() => setOpenDietItemModal(false)}
						className='modal fade'>
						<div className='modal-content'>
							<div className='modal-header justify-content-between'>
								<h2 className='fw-bolder'>Food Bundle Item : {updateDietItemData.dietName}</h2>
								<button
									onClick={() => setOpenDietItemModal(false)}
									className='btn btn-sm btn-icon btn-active-color-primary'>
									<FontAwesomeIcon
										className='fs-1 position-absolute ms-3'
										icon={faXmark}
									/>
								</button>
							</div>
							<div className='modal-body scroll-y'>
								<div className='row'>
									<div className='col-md-6 fv-row mb-7'>
										<label
											htmlFor='foodTime'
											className='required fw-bold fs-6 mb-5'>
											Food Time
										</label>
										<select
											name='food_time_id'
											className='form-control form-select form-control-solid mb-3 mb-lg-0'
											autoComplete='off'
											value={updateDietItemData.food_time_id}
											onChange={handleUpdateFoodBundleInputChange}>
											<option value=''>Choose</option>
											{times.map((time) => (
												<option
													key={time._id}
													value={time._id}>
													{time.food_time}
												</option>
											))}
										</select>
									</div>
									<div className='col-md-6 fv-row mb-7'>
										<label
											htmlFor='food_time'
											className='required fw-bold fs-6 mb-5'>
											Time (24-Hour)
										</label>
										<input
											type='time'
											name='time'
											value={updateDietItemData.time}
											className='form-control form-control-solid mb-3 mb-lg-0'
											autoComplete='off'
											onChange={handleUpdateFoodBundleInputChange}
										/>
									</div>
								</div>
							</div>
							<div className='modal-footer justify-content-end'>
								<button
									onClick={handleUpdateDietItem}
									className='btn btn-primary'>
									Update
								</button>
							</div>
						</div>
					</Modal>
				</div>
			</div>
		</>
	)
}

export default DietEdit
