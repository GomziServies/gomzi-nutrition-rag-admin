import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	AddExerciseBundle,
	GetExerciseBundle,
	GetExercisePlan,
	RemoveExercisePlanBundle,
	UpdateAssignedExercisePlan,
} from '../../../Functions/FWG'

type User = {
	user_id: string
	firstName?: string
	lastName?: string
	_id?: string
}

type UserAssignExercise = {
	user: User
}

type ExerciseData = {
	user_assign_exercise: UserAssignExercise[]
}

const AddExerciseBundles: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const exercise_plan_id: any = searchParams.get('exercise_plan_id')
	const exercise_approve = searchParams.get('exercise_approve') === 'true'
	const [searchTerm, setSearchTerm] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [showApproveModal, setApproveShowModal] = useState(false)
	const [userData, setUserData] = useState<any>([])
	const [exerciseData, setExerciseData] = useState<ExerciseData[]>([])
	const [selectedId, setSelectedId] = useState('')
	const [startDate, setStartDate] = useState('')
	const [meetingTime, setMeetingTime] = useState('')
	const [loading, setLoading] = useState(false)
	const [exerciseUserData, setExerciseUserData] = useState<{
		user_id?: string
		user?: User
		createdAt?: string
		_id: string
	}>({
		_id: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [formData, setFormData] = useState({
		day: '',
		time: '',
		exercise_bundle_id: '',
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleModalOpen = (id: string) => {
		setApproveShowModal(true)
		setSelectedId(id)
	}

	const fetchBundleData = async (exercise_plan_id: any) => {
		setLoading(true)
		try {
			const response: any = await GetExercisePlan({ search: exercise_plan_id })
			const exercisePlan = response.data
			
			const exerciseBundle = exercisePlan[0].exercise_plan_bundles
			const userApprove = exercisePlan.map((item: any) => item.user_assign_exercise).flat()
			const filteredData: any = userApprove.filter((item: any) => !item.is_active)
			setExerciseUserData(filteredData[0])
			setUserData(exerciseBundle)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchExerciseName = async () => {
		try {
			const response: any = await GetExerciseBundle()
			const exerciseDatas = response.data

			setExerciseData(exerciseDatas)
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
	}

	useEffect(() => {
		fetchBundleData(exercise_plan_id)
		fetchExerciseName()
	}, [pagination.page, pagination.itemsPerPage, searchTerm, exercise_plan_id])

	const handleApproveAssign = async () => {
		if (!startDate) {
			toast.error('Please select start date')
			return
		}

		const payload: any = {
			assigned_exercise_plan_id: selectedId,
			is_active: true,
			start_date: startDate,
		}

		function convertTimeTo12HourFormat(time: string) {
			const [hours, minutes] = time.split(':')
			let parsedHours = parseInt(hours)
			const suffix = parsedHours >= 12 ? 'PM' : 'AM'
			parsedHours = parsedHours % 12 || 12
			return `${parsedHours}:${minutes} ${suffix}`
		}

		if (meetingTime) {
			payload.live_meeting_time = convertTimeTo12HourFormat(meetingTime)
		}
		try {
			await UpdateAssignedExercisePlan(payload)
			toast.success('Exercise Approve successfully')
			setApproveShowModal(false)
			fetchBundleData(exercise_plan_id)
			setTimeout(() => {
				navigate('/fwg/exercise-approve')
			}, 1000)
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const filteredexerciseBundle = userData.filter(
		(exercisePlan: any) =>
			exercisePlan.day && exercisePlan.day.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedexerciseBundle = filteredexerciseBundle.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleAddExercisePlan = async () => {
		try {
			const payload: any = {
				exercise_bundle_id: formData.exercise_bundle_id,
				exercise_plan_id: exercise_plan_id,
				day: formData.day,
				time: formData.time,
			}
			await AddExerciseBundle(payload)
			toast.success('Exercise Plan Created Successfully')
			setShowModal(false)
			fetchBundleData(exercise_plan_id)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const removeUserFromExam = (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
		}).then((result) => {
			if (result.isConfirmed) {
				const payload: any = {
					plan_item_id: id,
				}

				RemoveExercisePlanBundle(payload)
					.then(() => {
						Swal.fire('Success!', `Exercise Plan remove successfully!.`, 'success')
						fetchBundleData(exercise_plan_id)
						fetchExerciseName()
					})
					.catch((error) => {
						Swal.fire('Error!', 'There was an error removing Exercise Plan.', 'error')
						console.error(error)
					})
			}
		})
	}

	const option = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

	const exerciseOption = exerciseData.map((data: any) => ({
		value: data._id,
		name: data.title,
	}))

	return (
		<>
			<PageTitle breadcrumbs={[]}>Exercise Plan Details</PageTitle>

			{exercise_approve == true ? (
				<div className='row'>
					<KTCard>
						<div className='card-body mt-4 mb-4'>
							<h1 className='fw-bold text-dark fs-1 m-8 mt-0 ms-0 '>User Data</h1>
							<div className='row'>
								<InputField
									placeholder='User ID'
									type='text'
									className='col-md-4 fv-row mb-7'
									name='user_id'
									label='Enter User ID'
									htmlFor='user_id'
									value={exerciseUserData?.user_id}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='User Name'
									type='text'
									className='col-md-3 fv-row mb-7'
									name='user_name'
									label='User Name'
									htmlFor='user_name'
									value={`${exerciseUserData?.user?.firstName || ''} ${
										exerciseUserData?.user?.lastName || ''
									}`}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='Assigned On'
									type='text'
									className='col-md-3 fv-row mb-7'
									name='assigned_on'
									label='Assigned On'
									htmlFor='assigned_on'
									value={exerciseUserData?.createdAt}
									onChange={handleInputChange}
								/>
							</div>
							<div className='text-end'>
								<button
									onClick={() => handleModalOpen(exerciseUserData?._id)}
									className='btn gap-2 btn-light-success mx-2 btn-sm me-1'>
									<FontAwesomeIcon
										icon={faCheck}
										className='fs-3'
									/>{' '}
									Approve
								</button>
								{/* <button
									onClick={() => handleWithdrawAssign(exerciseUserData?._id)}
									className='btn gap-2 btn-light-danger mx-2 btn-sm me-1'>
									<FontAwesomeIcon
										icon={faXmark}
										className='fs-3'
									/>{' '}
									Cancle
								</button> */}
							</div>
						</div>
					</KTCard>
				</div>
			) : (
				''
			)}

			<div className='card mt-10 pt-5'>
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
						<button
							onClick={() => setShowModal(true)}
							className='btn btn-primary'>
							Add Exercise Bundle
						</button>
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
									<th>Day</th>
									<th>Bundle Name</th>
									<th>Time</th>
									<th>Action</th>
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
									paginatedexerciseBundle.map((bundleData: any, index: number) => {
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
														{bundleData.day}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{bundleData.bundle_details?.title}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{bundleData.time}
													</span>
												</td>
												<td>
													<TableButton
														action='remove'
														onClick={() => removeUserFromExam(bundleData._id)}
													/>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{paginatedexerciseBundle.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedexerciseBundle.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(userData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>

			{/* Exercise Approve Modal */}
			<Modal
				centered
				show={showApproveModal}
				onHide={() => setApproveShowModal(false)}
				className='modal fade'>
				<div className='modal-content border-0'>
					<div className='modal-header border-0 justify-content-end'>
						<button
							type='button'
							onClick={() => setApproveShowModal(false)}
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
							<div className='col-12 mt-6'>
								<label
									htmlFor='dd'
									className='required fw-bold mb-2'
									style={{ fontSize: '15px' }}>
									Exercise Meeting Link Time
								</label>
								<input
									placeholder='Enter Exercise Meeting Link Time'
									type='time'
									name='meeting_link_time'
									className='form-control form-control-lg'
									autoComplete='off'
									value={meetingTime}
									onChange={(e) => setMeetingTime(e.target.value)}
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
			<Modal
				show={showModal}
				centered
				onHide={() => setShowModal(false)}
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y mx-3 pt-0 pb-15'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Exercise Plan</h2>
						</div>
						<div>
							<div className='mb-5'>
								<SelectFieldManual
									className='col-md-12 fv-row mb-7 '
									label='Exercise Name'
									name='exercise_bundle_id'
									value={formData.exercise_bundle_id}
									onChange={handleInputChange}
									htmlFor='exercise_bundle_id'
									options={exerciseOption}
									// disabled
								/>
							</div>
							<div className='mb-5'>
								<SelectField
									className='col-md-12 fv-row'
									label='Day'
									name='day'
									value={formData.day}
									onChange={handleInputChange}
									htmlFor='day'
									options={option}
								/>
							</div>
							<div className='mb-5'>
								<InputField
									placeholder='Enter Description'
									type='time'
									className='mb-7 w-100 fv-row'
									name='time'
									label='Time'
									htmlFor='time'
									value={formData.time}
									onChange={handleInputChange}
								/>
							</div>
						</div>
						<div className='mt-7 text-center'>
							<TableButton
								action='add'
								onClick={() => handleAddExercisePlan()}
								text='Add'
							/>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default AddExerciseBundles
