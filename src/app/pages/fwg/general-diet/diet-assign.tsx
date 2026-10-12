import { faCopy, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { AsyncPaginate } from 'react-select-async-paginate'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { loadUserOptions } from '../../../components/loadUserOptions'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import { AssignDietPlan, GetDietPlan, WithdrawDietPlan } from '../../../Functions/FWG'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const DietAssign: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const plan_id: string | any = searchParams.get('plan_id')
	const [value, onChange] = useState<any>(null)
	const [showModal, setShowModal] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [assignUserData, setAssignUserData] = useState([])
	const [loading, setLoading] = useState(false)
	const [dietData, setDietData] = useState({
		plan_name: '',
		category_id: '',
		food_type: '',
		days: '',
	})
	const [dietApproveData, setDietApproveData] = useState([
		{
			diet_id: '',
			user_id: '',
			user_name: '',
			createdAt: '',
			plan_name: '',
		},
	])
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [approvePagination, setApprovePagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async () => {
		setLoading(true)
		try {
			const dietResponse: any = await GetDietPlan({ id: plan_id })
			setDietData(dietResponse.data[0])
			const userData = dietResponse.data[0]?.diet_assigned_user
			setAssignUserData(userData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredAssignData = assignUserData.filter((data: any) =>
		data?.user_info?.firstName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedAssignData = filteredAssignData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const withdrawDiet = async (userID: string) => {
		try {
			Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to Withdraw Diet plan.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			}).then(async (result) => {
				if (result.isConfirmed) {
					const response: any = await WithdrawDietPlan({ id: userID })
					if (response.status === 200) {
						fetchData()
						toast.success('Diet Withdraw Successfully')
					} else {
						toast.error('Failed to Withdraw Diet')
					}
				}
			})
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const handleCreateAssign = async () => {
		try {
			const userIds = value.map((item: any) => item.value)

			const payload: any = {
				diet_id: plan_id,
				users: userIds,
			}
			await AssignDietPlan(payload)
			setShowModal(false)
			toast.success('Diet Plan Assigned to Users Successfully')

			fetchApproveData()
		} catch (error: any) {
			toast.error(error.message)
		}
		fetchData()
	}
	const fetchApproveData = async (page?: number) => {
		setLoading(true)
		try {
			let dietResponse: any
			if (searchTerm) {
				dietResponse = await GetDietPlan({
					page: page || approvePagination.page,
					limit: approvePagination.itemsPerPage,
					sort,
					sortOrder,
					id: plan_id,
				})
			} else {
				dietResponse = await GetDietPlan({
					page: page || approvePagination.page,
					limit: approvePagination.itemsPerPage,
					sort,
					sortOrder,
					id: plan_id,
				})
			}

			const userApprove = dietResponse?.data.map((item: any) => item.diet_assigned_user).flat()

			const filteredData: any = userApprove.filter((item: any) => {
				if (!item.status) {
					return true
				} else {
					return false
				}
			})

			const dietDataList = filteredData.map((item: any) => ({
				diet_id: item.diet_id,
				user_id: item.user_id,
				user_name: item.user_info.firstName + ' ' + item.user_info.lastName,
				createdAt: item.createdAt,
				plan_name: dietResponse.data.find((diet: any) =>
					diet.diet_assigned_user.some((user: any) => user.user_id === item.user_id)
				).plan_name,
			}))

			setDietApproveData(dietDataList)
		} catch (error: any) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchApproveData()
	}, [approvePagination.page, approvePagination.itemsPerPage, sort, sortOrder])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchApproveData()
		}
	}, [searchTerm])

	const handleApprovePageChange = (page: number) => {
		setApprovePagination({ ...approvePagination, page })
	}

	const filteredDietData = dietApproveData.filter((diet: any) =>
		diet.user_name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedDietApproveData = filteredDietData.slice(
		(approvePagination.page - 1) * approvePagination.itemsPerPage,
		approvePagination.page * approvePagination.itemsPerPage
	)

	const sortableFields = [
		{ title: 'User ID', field: 'user_id' },
		{ title: 'User Name', field: 'firstName' },
		{ title: 'Plan Name', field: 'plan_name' },
		{ title: 'Start Date', field: 'createdAt' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleCopy = (id: string) => {
		navigator.clipboard
			.writeText(id)
			.then(() => {
				toast.success('ID copied to clipboard!')
			})
			.catch((err) => {
				console.error('Failed to copy ID: ', err)
				toast.success('Failed to copy ID!')
			})
	}

	const handleKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>, id: string) => {
		if (event.key === 'Enter' || event.key === ' ') {
			handleCopy(id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Diet Details</PageTitle>

			<div className='card p-5'>
				<div className='row'>
					<InputField
						placeholder='Diet Plan'
						type='text'
						className='col-md-3 fv-row mb-7'
						name='plan_name'
						label='Diet Plan'
						htmlFor='plan_name'
						value={dietData.plan_name}
						disabled
					/>
					<InputField
						placeholder='Diet Category'
						type='text'
						className='col-md-3 fv-row mb-7'
						name='category_id'
						label='Diet Category'
						htmlFor='category_id'
						value={dietData.category_id}
						disabled
					/>
					<InputField
						placeholder='Food Type'
						type='text'
						className='col-md-3 fv-row mb-7'
						name='food_type'
						label='Food Type'
						htmlFor='food_type'
						value={dietData.food_type}
						disabled
					/>
					<InputField
						placeholder='Diet Plan'
						type='number'
						className='col-md-3 fv-row mb-7'
						name='days'
						label='Total Day (Duration)'
						htmlFor='days'
						value={dietData.days}
						disabled
					/>
					<div className='text-end'>
						<TableButton
							action='view'
							text='View'
							backgroundDark={true}
							to={`/fwg/diet-details/diet-edit?diet_id=${plan_id}`}
						/>
					</div>
				</div>
			</div>
			<div className='card mt-10 pt-5'>
				<div className='card-toolbar m-5 ms-8'>
					<h1 className='fw-bold text-dark fs-1 '>Diet Assign</h1>
				</div>
				<div className='card-header border-0'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							onClick={() => setShowModal(true)}
							text='New User'
							showIcon={false}
						/>
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
									<th>User</th>
									<th>Email</th>
									<th>Start Date</th>
									<th>Expired On</th>
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
									paginatedAssignData.slice().map((data: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										const createdAt = data.start_date
										const expiredOn =
										DayJS(createdAt).isValid() && !isNaN(Number(dietData.days))
												? DayJS(createdAt)
														.add(Number(dietData.days), 'day')
														.format('DD/MM/YYYY hh:mm:ss A')
												: 'Invalid Date'
										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-5'>
															<img
																src={data.user_info?.profile_image || '/media/avatars/300-1.jpg'}
																alt={data.username}
																className='fs-3 text-primary'
																style={{ width: '55px', height: '55px', borderRadius: '20%' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>
																{data.user_info?.firstName + ' ' + data.user_info?.lastName ||
																	'N/A'}
															</span>
															<span className='text-muted fw-semibold text-muted d-block fs-7'>
																{data.user_info?.country_code}{' '}
																{data.user_info?.mobile ? data.user_info?.mobile : '-'}
															</span>
														</div>
													</div>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.user_info?.email ? data.user_info?.email : '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{DayJS(data.start_date).format('DD/MM/YYYY hh:mm:ss A')}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{expiredOn}
													</span>
												</td>
												<td>
													{data.status ? (
														<TableButton
															action='remove'
															onClick={() => withdrawDiet(data._id)}
														/>
													) : (
														<span className='btn gap-2 btn-light-warning mx-2 btn-sm me-1'>
															Pending
														</span>
													)}
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{paginatedAssignData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedAssignData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(assignUserData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>

			<KTCard className='mt-12'>
				<div className='card-header border-0 pt-6'>
					<div className='card-toolbar'>
						<h1 className='fw-bold text-dark fs-1 mb-6 '>Diet Approval</h1>
					</div>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<TableSort
								sortableFields={sortableFields}
								sort={sort}
								sortOrder={sortOrder}
								onSortChange={handleSortChange}
							/>
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
									paginatedDietApproveData.map((dietData: any, index: number) => {
										const actualIndex =
											(approvePagination.page - 1) * approvePagination.itemsPerPage + index + 1
										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td
													onClick={() => handleCopy(dietData.user_id)}
													onKeyPress={(event) => handleKeyPress(event, dietData.user_id)}
													role='button'
													tabIndex={0}>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<FontAwesomeIcon
															icon={faCopy}
															className='fs-3 me-2 text-success'
														/>
														{dietData.user_id}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{dietData.user_name}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{dietData.plan_name}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{DayJS(dietData.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
													</span>
												</td>
												<td>
													<TableButton
														action='view'
														to={`/fwg/diet-details/diet-edit?diet_id=${dietData.diet_id}&user_id=${dietData.user_id}&diet_approve=true`}
													/>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{paginatedDietApproveData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedDietApproveData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredDietData.length / approvePagination.itemsPerPage)}
							currentPage={approvePagination.page}
							onPageChange={handleApprovePageChange}
						/>
					)}
				</div>
			</KTCard>
			<Modal
				show={showModal}
				centered
				onHide={() => setShowModal(false)}
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							onClick={() => setShowModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body mx-3 pt-0 pb-15 overflow-visible'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Assign User</h2>
						</div>
						<div>
							<label
								htmlFor='select'
								className='form-label'>
								Name
							</label>
							<AsyncPaginate
								debounceTimeout={1000}
								value={value}
								loadOptions={loadUserOptions}
								closeMenuOnSelect={false}
								onChange={onChange}
								isMulti
							/>
							{/* <MultiSelect
								options={userOptions}
								value={selected}
								onChange={setSelected}
								labelledBy='Select'
							/> */}
						</div>
						<div className='mt-7 text-center'>
							<button
								type='button'
								onClick={() => handleCreateAssign()}
								className='btn btn-primary w-50'>
								Add User
							</button>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default DietAssign
