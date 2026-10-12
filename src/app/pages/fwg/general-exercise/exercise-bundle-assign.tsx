import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { AsyncPaginate } from 'react-select-async-paginate'
import Swal from 'sweetalert2'
import { KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { loadUserOptions } from '../../../components/loadUserOptions'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	AssignExercisePlan,
	GetExercisePlan,
	GetUser,
	WithdrawExercisePlan,
} from '../../../Functions/FWG'

const ExerciseBundleAssign: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const plan_id: string | any = searchParams.get('plan_id')
	const [value, onChange] = useState<any>(null)
	const [showModal, setShowModal] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [exercisePlanName, setExercisePlanName] = useState('')
	const [assignUserData, setAssignUserData] = useState([])
	const [userData, setUserData] = useState([])
	const [selected, setSelected] = useState<any>([])
	const [formData, setFormData] = useState({
		user_id: '',
		live_meeting_time: '',
	})

	const fetchData = async () => {
		try {
			const exerciseResponse: any = await GetExercisePlan({ id: plan_id })
			setExercisePlanName(exerciseResponse.data[0].plan_name)
			const userData = exerciseResponse.data[0]?.user_assign_exercise
			setAssignUserData(userData)
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchUserData = async () => {
		try {
			const response = await GetUser()

			const filteredData: any = response.data
			setUserData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData()
		fetchUserData()
	}, [])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredAssignData = assignUserData.filter((sale: any) =>
		sale?.user?.firstName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedSalesData = filteredAssignData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const withdrawExercise = async (userID: string) => {
		try {
			Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to Withdraw Exercise.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			}).then(async (result) => {
				if (result.isConfirmed) {
					const response: any = await WithdrawExercisePlan({ plan_assign_id: userID })
					if (response.status === 200) {
						fetchData()
						toast.success('Exercise Withdraw Successfully')
					} else {
						toast.error('Failed to Withdraw Exercise')
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
				exercise_plan_id: plan_id,
				users: userIds,
				live_meeting_time: formData.live_meeting_time,
			}
			await AssignExercisePlan(payload)
			setShowModal(false)
			toast.success('Exercise Plan Assigned to Users Successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		fetchData()
	}

	const userOptions = userData.map((user: any) => ({
		label: user.firstName + ' ' + user.lastName,
		value: user._id,
	}))

	return (
		<>
			<PageTitle breadcrumbs={[]}>Exercise Details</PageTitle>
			<div className='card mt-10 pt-5'>
				<h1 className='fw-bold text-dark fs-1 m-6 '>
					Bundle Name : {exercisePlanName || 'N/A'}
				</h1>
				<div className='card-header border-0'>
					<div className='card-title'>
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
					<div className='card-toolbar'>
						<TableButton
							action='add'
							onClick={() => setShowModal(true)}
							text='New User'
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
									<th>User ID</th>
									<th>User Name</th>
									<th>Profile Image</th>
									<th>Meeting Time</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
								{paginatedSalesData
									.slice()
									.reverse()
									.map((data: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.user?._id}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.user?.firstName + ' ' + data.user?.lastName}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<img
															src={data.user?.profile_image}
															alt='user profile'
															style={{ width: '80px', height: '80px', borderRadius: '10px' }}
														/>
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.live_meeting_time}
													</span>
												</td>
												<td>
													{data.is_active ? (
														<TableButton
															action='remove'
															onClick={() => withdrawExercise(data._id)}
														/>
													) : (
														<span className='btn gap-2 btn-light-warning mx-2 btn-sm me-1'>
															Pending
														</span>
													)}
												</td>
											</tr>
										)
									})}
							</tbody>
						</table>
					</div>
					{paginatedSalesData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedSalesData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(assignUserData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
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
					<div className='modal-body mx-3 pt-0 pb-15'>
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
							<div className='mb-5'>
								<InputField
									placeholder='Time'
									type='time'
									className='mb-5 mt-5 w-100 fv-row'
									name='live_meeting_time'
									label='Time'
									htmlFor='live_meeting_time'
									value={formData.live_meeting_time}
									onChange={handleInputChange}
								/>
							</div>
						</div>
						<div className='mt-7 text-center'>
							<TableButton
								action='add'
								onClick={() => handleCreateAssign()}
								text='Add User'
							/>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default ExerciseBundleAssign
