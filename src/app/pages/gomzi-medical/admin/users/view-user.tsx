import {
	faBook,
	faCheck,
	faGraduationCap,
	faLock,
	faLockOpen,
	faRunning,
	faShoppingCart,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import CopyableInput from '../../../../components/CopyableInput'
import InputField from '../../../../components/InputField'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import {
	FileUploadToFGGroup,
	GetUsers,
	LockUnlockUser,
	RemoveUser,
	UpdateOrder,
	UpdateUser,
} from '../../../../Functions/FGGroup'
import questionmark from './300-1.jpg'

type FitnessCourse = {
	_id: string
	course_name: string
	course_category: string
	amount: string
	currency: string
	updatedBy: string
}

const GMUserView = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const user_id: string | any = searchParams.get('user_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [fitnessCourses, setFitnessCourses] = useState<any[]>([])
	const [fitnessCoursesData, setFitnessCoursesData] = useState<any>({})
	const [fitnessCoursesId, setFitnessCoursesId] = useState([])
	const [userData, setUserData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [serviceLoading, setServiceLoading] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [userResponseData, setUserResponseData] = useState<any>({
		cover_image: '',
		_id: '',
		uid: '',
		app_version: '',
		first_name: '',
		last_name: '',
		email: '',
		mobile: '',
		createdAt: '',
		updatedAt: '',
		birth_date: '',
		alumni: '',
		address_line_1: '',
		address_line_2: '',
		city: '',
		state: '',
		country: '',
		pin_code: '',
		lock: false,
		editImage: false,
		active_services: [],
		notes: '',
	})
	const [fitnessAddData, setFitnessAddData] = useState({
		_id: '',
		amount: '',
		course_id: '',
		currency: '',
		paid_amount: '',
		updatedBy: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [metaData, setMetaData] = useState<any>()

	const fetchFitnessCourseData = async () => {
		// setLoading(true)
		// try {
		// 	const fitness_course_response: any = await GetFitnessCourse()
		// 	setFitnessCourses(fitness_course_response.data)
		// } catch (error) {
		// 	console.error(error)
		// }
		// setLoading(false)
	}

	const fetchUserData = async () => {
		setServiceLoading(true)
		try {
			const response: any = await GetUsers({ id: user_id })
			const filteredData: any = response.data[0]

			const profileData = filteredData?.document?.find((data: any) => data.label == 'profile')
			const aadharData = filteredData?.document?.find((data: any) => data.label == 'aadhar')
			const markSheetData = filteredData?.document?.find((data: any) => data.label == 'marksheet')

			setUserResponseData({
				cover_image: filteredData.profile_image,
				_id: filteredData._id,
				uid: filteredData.uid,
				app_version: filteredData?.app_data?.app_version || '',
				first_name: filteredData.first_name,
				last_name: filteredData.last_name,
				email: filteredData.email,
				mobile: filteredData.mobile,
				createdAt: filteredData.createdAt,
				updatedAt: filteredData.updatedAt,
				birth_date: filteredData.birth_date,
				alumni: filteredData.alumni,
				address_line_1: filteredData?.address?.address_line_1 || '',
				address_line_2: filteredData?.address?.address_line_2 || '',
				city: filteredData?.address?.city || '',
				state: filteredData?.address?.state || '',
				country: filteredData?.address?.country || '',
				pin_code: filteredData?.address?.pin_code || '',
				lock: filteredData.lock,
				editImage: false,
				active_services: filteredData?.active_services,
				notes: filteredData?.notes,
				profile: profileData,
				aadhar: aadharData,
				marksheet: markSheetData,
			})
		} catch (error) {
			console.error(error)
		}
		setServiceLoading(false)
	}

	const fetchUserFitnessCoursesData = async (page?: number) => {
		// setLoading(true)
		// try {
		// 	const fitness_response = await GetUserFitnessCourses({
		// 		user_id,
		// 		page: page || pagination.page,
		// 		limit: pagination.itemsPerPage,
		// 		sort,
		// 		sortOrder,
		// 	})

		// 	let fitness_filteredData: any = fitness_response.data
		// 	fitness_filteredData = fitness_filteredData.sort(
		// 		(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		// 	)

		// 	setUserData(fitness_filteredData)

		// 	const metaData: any = fitness_response.metadata
		// 	setMetaData(metaData.pagination)
		// } catch (error) {
		// 	console.error(error)
		// }
		// setLoading(false)
	}

	useEffect(() => {
		fetchUserFitnessCoursesData()
	}, [searchTerm, pagination.itemsPerPage, pagination.page, sort, sortOrder])

	useEffect(() => {
		fetchUserData()
		fetchFitnessCourseData()
	}, [])

	const handleCourseSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedCourseId = event.target.value
		const selectedCourse = fitnessCourses.find((course) => course?.course_name === selectedCourseId)
		if (selectedCourse) {
			setFitnessAddData((prevData) => ({
				...prevData,
				amount: selectedCourse.amount,
				currency: selectedCourse.currency,
				paid_amount: selectedCourse.amount,
				course_id: selectedCourse?.course_name,
				updatedBy: selectedCourse.updatedBy,
			}))
		}
	}

	const handleAddCourse = async () => {
		try {
			const selectedCourse = fitnessCourses.find(
				(course) => course?.course_name === fitnessAddData.course_id
			)

			if (selectedCourse) {
				setFitnessAddData((prevData) => ({
					...prevData,
					amount: selectedCourse.amount,
					currency: selectedCourse.currency,
					paid_amount: selectedCourse.paid_amount,
					course_id: selectedCourse._id,
					updatedBy: selectedCourse.updatedBy,
				}))

				const payload: any = {
					amount: fitnessCoursesData.amount ? fitnessCoursesData.amount : selectedCourse.amount,
					course_id: selectedCourse._id,
					currency: fitnessCoursesData.currency
						? fitnessCoursesData.currency
						: selectedCourse.currency,
					paid_amount: fitnessCoursesData.paid_amount
						? parseInt(fitnessCoursesData.paid_amount)
						: selectedCourse.amount,
					user_id: user_id,
				}

				setFitnessAddData(() => ({
					_id: '',
					amount: '',
					course_id: '',
					currency: '',
					paid_amount: '',
					updatedBy: '',
				}))

				// await AssignFitnessCourse(payload)
				toast.success('Fitness Create Successfully')
				fetchUserFitnessCoursesData()
			} else {
				toast.error('Error: Selected course not found')
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const UpdateOrderData = async () => {
		try {
			const selectedCourse = userData.find(
				(user: any) => user?.fitness_course?._id === fitnessAddData.course_id
			)

			if (selectedCourse) {
				const payload: any = {
					order_id: selectedCourse.order_id,
					paid_amount: fitnessAddData.paid_amount,
				}

				await UpdateOrder(payload)
				toast.success('Course Amount Update Successfully')
				fetchUserData()
			} else {
				toast.error('Error: Selected course not found in user data')
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleUpdateOrderClick = (courseId: any) => {
		setFitnessAddData((prevData) => ({
			...prevData,
			course_id: courseId,
		}))
	}

	const handleFitnessAddInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		setFitnessAddData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]

			setUserResponseData((prevData: any) => ({
				...prevData,
				selectedFile: file,
				cover_image: URL.createObjectURL(file),
				editImage: true,
			}))

			toast.success('User profile update successfully')
		} else {
			setUserResponseData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}
	const handleCourseInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target

		setFitnessCoursesData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))

		// setFitnessAddData((prevData: any) => ({
		// 	...prevData,
		// 	[name]: value,
		// }))
	}

	const handleSelectTypeChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		let courseName: any = []
		const coachingData = fitnessCourses.filter((course: any) => course.coaching_mode === value)
		courseName = coachingData.map((course: any) => course?.course_name)
		setFitnessCoursesId(courseName)
	}

	const handleUpdateUser = async () => {
		try {
			setIsSubmitting(true)

			const documentFiles = [
				documentFile?.profile
					? {
							file: documentFile.profile,
							document_type: 'identity',
							label: 'profile',
					  }
					: userResponseData?.profile?.file
					? {
							_id: userResponseData?.profile?._id,
							file: userResponseData?.profile?.file,
							document_type: 'identity',
							label: 'profile',
					  }
					: '',
				documentFile?.aadhar
					? {
							file: documentFile.aadhar,
							document_type: 'identity',
							label: 'aadhar',
					  }
					: userResponseData?.aadhar?.file
					? {
							_id: userResponseData?.aadhar?._id,
							file: userResponseData?.aadhar?.file,
							document_type: 'identity',
							label: 'aadhar',
					  }
					: '',
				documentFile?.marksheet
					? {
							file: documentFile.marksheet,
							document_type: 'identity',
							label: 'marksheet',
					  }
					: userResponseData?.marksheet?.file
					? {
							_id: userResponseData?.marksheet?._id,
							file: userResponseData?.marksheet?.file,
							document_type: 'identity',
							label: 'marksheet',
					  }
					: '',
			].filter(Boolean)

			const payload: any = {
				id: userResponseData._id,
				first_name: userResponseData.first_name,
				last_name: userResponseData.last_name,
				alumni: userResponseData.alumni,
				address_line_1: userResponseData.address_line_1,
				address_line_2: userResponseData.address_line_2,
				city: userResponseData.city,
				state: userResponseData.state,
				country: userResponseData.country,
				pin_code: userResponseData.pin_code,
				notes: userResponseData.notes,
				...(documentFiles.length > 0 ? { document: documentFiles } : {}),
			}

			await UpdateUser(payload)
			toast.success('User Update Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
			setIsSubmitting(false)
		}
	}

	const delete_user = async () => {
		try {
			await RemoveUser({ id: user_id })
			fetchUserData()
			toast.success('User remove successfully')

			navigate('/fgiit/users')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleLockUnlock = (userId: string, isLocked?: boolean) => {
		Swal.fire({
			title: 'Are you sure?',
			text: `You are about to ${isLocked ? 'unlock' : 'lock'} the user.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
			cancelButtonText: 'Cancel',
		}).then((result) => {
			if (result.isConfirmed) {
				LockUnlockUser({ user_id: userId, lock: !isLocked })
					.then(() => {
						fetchUserData()
						Swal.fire(
							'Success!',
							`The user has been ${isLocked ? 'unlocked' : 'locked'}.`,
							'success'
						)
					})
					.catch((error) => {
						Swal.fire('Error!', 'There was an error updating the user status.', 'error')
					})
			}
		})
	}

	const removeCourseFromUser = (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: `You are about to remove this course from user`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
			cancelButtonText: 'Cancel',
		}).then((result) => {
			if (result.isConfirmed) {
				// DeactivateAssignedFitnessCourse({ user_fitness_course_id: id })
				// 	.then(() => {
				// 		fetchUserFitnessCoursesData()
				// 		Swal.fire('Success!', `The course has been removed.`, 'success')
				// 	})
				// 	.catch((error: any) => {
				// 		Swal.fire('Error!', error.message, 'error')
				// 	})
			}
		})
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleFileButtonClick = (id: any) => {
		const fileInput = document.getElementById(id) as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const [documentFile, setDocumentFile] = useState<any>({
		profile: null,
		aadhar: null,
		marksheet: null,
	})
	const [isDocument, setIsDocument] = useState<any>({
		profile: false,
		aadhar: false,
		marksheet: false,
	})

	const handleFileUpload = async (event: any, type: any) => {
		const file = event.target?.files?.[0]

		const imageUrl: any = await FileUploadToFGGroup([file], {
			directory: 'users',
		})
		const imgUrl = imageUrl.data?.fileURLs[0]

		if (type) {
			setDocumentFile({ ...documentFile, [type]: imgUrl })
			setIsDocument({ ...isDocument, [type]: true })
		}

		toast.success('image uploaded successfully')
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Details</PageTitle>
			<>
				<div className='row'>
					<div className='col-12 mt-3'>
						<div className='card py-10'>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-2 text-center'>
										<div className='mb-3'>
											<h4>Profile:</h4>
											<img
												alt='Users'
												src={
													isDocument.profile
														? `https://files.fggroup.in/${documentFile.profile}`
														: userResponseData?.profile?.file
														? `https://files.fggroup.in/${userResponseData?.profile?.file}`
														: '/media/avatars/300-1.jpg'
												}
												style={{ borderRadius: '10px', width: '90%' }}
											/>
											<div>
												<button
													type='button'
													className='mt-5 px-2 py-1 mb-2 btn btn-success'
													onClick={() => handleFileButtonClick('fileInput')}>
													Upload Profile
												</button>
												<input
													type='file'
													id='fileInput'
													className='d-none'
													onChange={(e) => handleFileUpload(e, 'profile')}
												/>
											</div>
										</div>
										<div className='mb-3'>
											<h4>Aadhar Card:</h4>
											<img
												alt='Users'
												src={
													isDocument.aadhar
														? `https://files.fggroup.in/${documentFile.aadhar}`
														: userResponseData?.aadhar?.file
														? `https://files.fggroup.in/${userResponseData?.aadhar?.file}`
														: '/media/avatars/300-1.jpg'
												}
												style={{ borderRadius: '10px', width: '90%' }}
											/>
											<div>
												<button
													type='button'
													className='mt-5 px-2 py-1 mb-2 btn btn-success'
													onClick={() => handleFileButtonClick('aadharUpload')}>
													Upload Aadhar
												</button>
												<input
													type='file'
													className='d-none'
													id='aadharUpload'
													onChange={(e) => handleFileUpload(e, 'aadhar')}
												/>
											</div>
										</div>
										<div>
											<h4>Mark Sheet:</h4>
											<img
												alt='Users'
												src={
													isDocument.marksheet
														? `https://files.fggroup.in/${documentFile.marksheet}`
														: userResponseData?.marksheet?.file
														? `https://files.fggroup.in/${userResponseData?.marksheet?.file}`
														: '/media/avatars/300-1.jpg'
												}
												style={{ borderRadius: '10px', width: '90%' }}
											/>
											<div>
												<button
													type='button'
													className='mt-5 px-2 py-1 mb-2 btn btn-success'
													onClick={() => handleFileButtonClick('marksheetUpload')}>
													Upload MarkSheet
												</button>
												<input
													type='file'
													className='d-none'
													id='marksheetUpload'
													onChange={(e) => handleFileUpload(e, 'marksheet')}
												/>
											</div>
										</div>
									</div>
									<div className='col-md-10'>
										<div className='row'>
											<div className='col-md-4 fv-row mb-7'>
												<CopyableInput
													placeholder='User ID'
													type='text'
													className='col-12 fv-row mb-7'
													name='uid'
													label='User ID'
													htmlFor='uid'
													value={userResponseData._id}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='First Name'
													type='text'
													className='col-12 fv-row mb-7'
													name='first_name'
													label='First Name'
													htmlFor='first_name'
													value={userResponseData.first_name}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Last Name'
													type='text'
													className='col-12 fv-row mb-7'
													name='last_name'
													label='Last Name'
													htmlFor='last_name'
													value={userResponseData.last_name}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='App Version'
													type='text'
													className='col-12 fv-row mb-7'
													name='app_version'
													label='App Version'
													htmlFor='app_version'
													value={userResponseData.app_version}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<CopyableInput
													placeholder='Email'
													type='email'
													className='col-12 fv-row mb-7'
													name='email'
													label='Email'
													htmlFor='email'
													value={userResponseData.email}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<CopyableInput
													placeholder='Mobile Number'
													type='text'
													className='col-12 fv-row mb-7'
													name='mobile'
													label='Mobile Number'
													htmlFor='mobile'
													value={userResponseData.mobile}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Registration Date'
													type='text'
													className='col-12 fv-row mb-7'
													name='createdAt'
													label='Registration Date'
													htmlFor='createdAt'
													value={userResponseData.createdAt}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Last Modification'
													type='text'
													className='col-12 fv-row mb-7'
													name='updatedAt'
													label='Last Modification'
													htmlFor='updatedAt'
													value={userResponseData.updatedAt}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Date of Birth'
													type='date'
													className='col-12 fv-row mb-7'
													name='birth_date'
													label='Date of Birth'
													htmlFor='birth_date'
													value={userResponseData.birth_date}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<label
													htmlFor='alumni'
													className='form-label fw-bold mb-2'>
													Alumni Status:
												</label>
												<div>
													<select
														className='mt-3 inputfield-bg form-select form-select-solid'
														id='alumni'
														name='alumni'
														onChange={handleInputChange}
														defaultValue={userResponseData.alumni}>
														<option value='Yes'>Yes</option>
														<option value='No'>No</option>
													</select>
												</div>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Plot/House No.'
													type='text'
													className='col-12 fv-row mb-7'
													name='address_line_1'
													label='Plot/House No.'
													htmlFor='address_line_1'
													value={userResponseData.address_line_1}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Address'
													type='text'
													className='col-12 fv-row mb-7'
													name='address_line_2'
													label='Address'
													htmlFor='address_line_2'
													value={userResponseData.address_line_2}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='City'
													type='text'
													className='col-12 fv-row mb-7'
													name='city'
													label='City'
													htmlFor='city'
													value={userResponseData.city}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='State'
													type='text'
													className='col-12 fv-row mb-7'
													name='state'
													label='State'
													htmlFor='state'
													value={userResponseData.state}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Country'
													type='text'
													className='col-12 fv-row mb-7'
													name='country'
													label='Country'
													htmlFor='country'
													value={userResponseData.country}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Pincode'
													type='text'
													className='col-12 fv-row mb-7'
													name='pin_code'
													label='Pincode'
													htmlFor='pin_code'
													value={userResponseData.pin_code}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Notes'
													type='text'
													className='col-12 fv-row mb-7'
													name='notes'
													label='Notes'
													htmlFor='notes'
													value={userResponseData.notes}
													onChange={handleInputChange}
												/>
											</div>

											<div className='col-md-12 fv-row mb-2 d-flex justify-content-end'>
												<div>
													{userResponseData?.lock ? (
														<button
															className={'btn gap-2 btn-danger mx-2 btn-sm me-1'}
															onClick={() =>
																handleLockUnlock(userResponseData._id, userResponseData.lock)
															}>
															<FontAwesomeIcon
																icon={faLock}
																className='fs-3'
															/>
														</button>
													) : (
														<button
															className={'btn gap-2 btn-success mx-2 btn-sm me-1'}
															onClick={() =>
																handleLockUnlock(userResponseData._id, userResponseData.lock)
															}>
															<FontAwesomeIcon
																icon={faLockOpen}
																className='fs-3'
															/>
														</button>
													)}
												</div>
												<div className='me-3'>
													<TableButton
														action='edit'
														onClick={handleUpdateUser}
														text={isSubmitting ? 'Please wait, Updating User...' : 'Update User'}
														showIcon={false}
														disabled={isSubmitting}
														backgroundDark={true}
														className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
													/>
												</div>
												<div
													data-bs-toggle='modal'
													data-bs-target='#kt_modal_exercise'>
													<TableButton
														action='remove'
														text='Remove user'
														backgroundDark={true}
														showIcon={false}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div
					className='modal fade'
					id='kt_modal_exercise'
					aria-hidden='true'>
					<div className='modal-dialog modal-dialog-centered mw-600px'>
						<div className='modal-content border-0'>
							<div className='modal-header border-0 justify-content-end'>
								<button
									type='button'
									className='btn-close'
									data-bs-dismiss='modal'
									aria-label='Close'></button>
							</div>
							<div className='text-center mb-4'>
								<img
									src={questionmark}
									alt='Question Mark'
									style={{ width: '80px', height: '80px' }}
								/>
								<h2
									className='fw-bold mt-3'
									style={{ fontSize: '25px' }}>
									Are you sure?
								</h2>
							</div>
							<div className='modal-body p-5'>
								<h3 className='text-center fw-20'>
									This user will be removed from the portal and will no longer access
								</h3>
							</div>
							<div className='modal-footer border-0 d-flex justify-content-center'>
								<button
									className='btn btn-danger me-3 fs-24'
									onClick={() => delete_user()}
									style={{ padding: '12px 24px', fontSize: '20px' }}>
									<FontAwesomeIcon
										className='me-2'
										icon={faCheck}
									/>
									Okay
								</button>
								<button
									className='btn btn-success fs-29'
									data-bs-dismiss='modal'
									style={{ padding: '12px 24px', fontSize: '20px' }}>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>

				<div className='card py-12  my-10'>
					<div className='card-body'>
						<h1 className='fw-bold text-dark fs-1 mb-6 '>View records</h1>

						<div className='row flex-column'>
							<div className='row'>
								<div className='col-md-3 my-2'>
									<Link
										className='text-dark'
										to={
											'/fgiit/scholarship-result/submissionResult?user_id=' + userResponseData._id
										}>
										<div
											className='category-box d-flex align-items-center'
											style={{
												backgroundColor: 'transparent',
												textAlign: 'center',
												padding: '15px 20px',
												borderRadius: '10px',
												border: '2px solid blue',
											}}>
											<FontAwesomeIcon
												icon={faGraduationCap}
												className='category-icon me-2'
												style={{ fontSize: '25px' }}
											/>
											<h3
												className='m-0'
												style={{ fontSize: '12px' }}>
												Scholarship
											</h3>
										</div>
									</Link>
								</div>
								<div className='col-md-3 my-2'>
									<Link
										className='text-dark'
										to={'/fgiit/fitness-courses?user_id=' + userResponseData._id}>
										<div
											className='category-box d-flex align-items-center'
											style={{
												backgroundColor: 'transparent',
												textAlign: 'center',
												padding: '15px 20px',
												borderRadius: '10px',
												border: '2px solid green',
											}}>
											<FontAwesomeIcon
												icon={faRunning}
												className='category-icon me-3'
												style={{ fontSize: '25px' }}
											/>
											<h3
												className='m-0'
												style={{ fontSize: '12px' }}>
												Fitness Course
											</h3>
										</div>
									</Link>
								</div>
							</div>

							<div className='row'>
								<div className='col-md-3 my-2'>
									<Link
										className='text-dark'
										to={'/fgiit/book-order?user_id=' + userResponseData._id}>
										<div
											className='category-box d-flex align-items-center'
											style={{
												backgroundColor: 'transparent',
												textAlign: 'center',
												padding: '15px 20px',
												borderRadius: '10px',
												border: '2px solid #dc3545',
											}}>
											<FontAwesomeIcon
												icon={faBook}
												className='category-icon me-3'
												style={{ fontSize: '25px' }}
											/>
											<h3
												className='m-0'
												style={{ fontSize: '12px' }}>
												Book
											</h3>
										</div>
									</Link>
								</div>
								<div className='col-md-3 my-2'>
									<Link
										className='text-dark'
										to={'/fgiit/all-order?user_id=' + userResponseData._id}>
										<div
											className='category-box d-flex align-items-center'
											style={{
												backgroundColor: 'transparent',
												textAlign: 'center',
												padding: '15px 20px',
												borderRadius: '10px',
												border: '2px solid #ffc107',
											}}>
											<FontAwesomeIcon
												icon={faShoppingCart}
												className='category-icon me-2'
												style={{ fontSize: '25px' }}
											/>
											<h3
												className='m-0'
												style={{ fontSize: '12px' }}>
												All Orders
											</h3>
										</div>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='card py-7  my-10'>
					<div className='card-body'>
						<h1
							className='fw-bold text-dark fs-1 mb-6 '
							style={{ display: 'inline' }}>
							Active Service
						</h1>
						<span style={{ marginLeft: '5px' }}>
							(This services are purchased or enabled by admin.)
						</span>
						<div style={{ marginTop: '15px' }}>
							{serviceLoading ? (
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
							) : userResponseData.active_services.length !== 0 ? (
								userResponseData.active_services.map((serviceData: any, index: number) => (
									<li
										key={index}
										className='fs-4'>
										{serviceData.service}
									</li>
								))
							) : (
								<div className='d-flex text-center align-content-center mt-7'>
									<b>No Data Found</b>
								</div>
							)}
						</div>
					</div>
				</div>
			</>

			<>
				<PageTitle breadcrumbs={[]}>Students User Details</PageTitle>
				<KTCard>
					<h1 className='fw-bold text-dark fs-1 m-6 mb-1'>Fitness Courses</h1>
					<div className='row align-items-center justify-content-between mx-4'>
						<div className='col-md-6'>
							<div className='d-flex align-items-center p-2'>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
								<div className='d-md-block d-none'>
									<LengthMenu
										expenseData={userData}
										handleItemsPerPageChange={handleItemsPerPageChange}
									/>
								</div>
							</div>
						</div>
						<div className='col-md-6'>
							<div className='d-flex justify-content-end border-0 pt-6'>
								<div className='d-md-none d-block'>
									<LengthMenu
										expenseData={userData}
										handleItemsPerPageChange={handleItemsPerPageChange}
									/>
								</div>
								<div
									data-bs-toggle='modal'
									data-bs-target='#kt_modal_invite_friendsssss'
									className='mt-md-0 mt-1'>
									<TableButton
										action='add'
										text='Add course'
									/>
								</div>
							</div>
						</div>
					</div>
					<div className='card-body py-4'>
						<div className='table-responsive'>
							<table
								id='kt_table_users'
								className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
								{' '}
								<thead>
									<tr className='fw-bold text-muted'>
										<th>No</th>
										<th>Course ID</th>
										<th>Course Name</th>
										<th>Mode</th>
										<th>Category</th>
										<th>Amount</th>
										<th>Paid Amount</th>
										<th>Start Date</th>
										<th>Validity</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
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
										userData.map((user: any, index: any) => (
											<tr key={index}>
												<td className='text-center'>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>{index + 1}</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user.fitness_course?._id}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user.fitness_course?.course_name}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user.fitness_course.coaching_mode}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user.fitness_course.course_category}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user?.order?.amount} {user.fitness_course.currency}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user?.order?.payment_breakdowns?.paid_amount
															? user?.order?.payment_breakdowns?.paid_amount +
															  ' ' +
															  user.fitness_course.currency
															: '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{DayJS(user.createdAt).format('DD/MM/YYYY hh:mm A')}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user.fitness_course.duration_days} Day
													</span>
												</td>
												<td>
													<div className='d-flex justify-content-center'>
														<TableButton
															action='view'
															to={`/fgiit/user/user-fitness-course-view?user_fitness_course_id=${user._id}`}
														/>

														<div
															data-bs-toggle='modal'
															data-bs-target='#kt_modal_invite_update'>
															<TableButton
																action='edit'
																onClick={() => handleUpdateOrderClick(user.fitness_course._id)}
															/>
														</div>
														<TableButton
															action='remove'
															onClick={() => removeCourseFromUser(user._id)}
														/>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
						{userData.length === 0 && !loading && (
							<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
								<b>No records found</b>
							</div>
						)}
						{userData.length > 0 && (
							<UsersListPagination
								totalPages={metaData?.totalPages}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</div>

					<div
						className='modal fade'
						id='kt_modal_invite_friendsssss'
						aria-hidden='true'>
						<div className='modal-dialog modal-dialog-centered mw-650px'>
							<div className='modal-content'>
								<div className='modal-header justify-content-between'>
									<h2 className='fw-bolder'>Fitness Course</h2>
									<div
										className='btn btn-sm btn-icon btn-active-color-primary'
										data-bs-dismiss='modal'>
										<FontAwesomeIcon
											className='fs-1 position-absolute ms-3'
											icon={faXmark}
										/>
									</div>
								</div>
								<div className='modal-body scroll-y'>
									<div className='row'>
										<label
											htmlFor='type'
											className='form-label fw-bold mb-2'>
											Choose Course Type:
										</label>
										<div>
											<select
												className='mt-3 mb-5 inputfield-bg form-select form-select-solid'
												style={{ borderColor: '#e1e3ea' }}
												id='type'
												name='type'
												onChange={handleSelectTypeChange}>
												<option value='select'>Select</option>
												<option value='VIRTUAL'>VIRTUAL</option>
												<option value='PHYSICAL'>PHYSICAL</option>
											</select>
										</div>
										<SelectField
											className='col-md-12 fv-row m-0'
											label='Choose Option'
											name='course_id'
											value={fitnessAddData.course_id}
											onChange={(e: any) => {
												handleInputChange(e)
												handleCourseSelection(e)
											}}
											htmlFor='course_id'
											options={
												fitnessCoursesId.length != 0
													? fitnessCoursesId
													: fitnessCourses.map(
															(course) => `${course?.course_name} - ${course?.course_category}`
													  )
											}
										/>
										<InputField
											placeholder='Amount'
											type='number'
											className='col-12 fv-row mb-7'
											name='amount'
											label='Amount'
											htmlFor='amount'
											value={
												fitnessCoursesData?.amount
													? fitnessCoursesData?.amount
													: fitnessAddData.amount
											}
											onChange={(e) => handleCourseInputChange(e)}
										/>
										<label
											htmlFor='currency'
											className='form-label fw-bold mb-2'>
											Choose Currency:
										</label>
										<div>
											<select
												className='mt-3 mb-5 disabled inputfield-bg form-select form-select-solid'
												style={{ borderColor: '#e1e3ea' }}
												id='currency'
												name='currency'
												value={
													fitnessCoursesData?.currency
														? fitnessCoursesData?.currency
														: fitnessAddData.currency
												}
												onChange={handleCourseInputChange}>
												<option value='select'>select</option>
												<option value='INR'>INR</option>
												<option value='USD'>USD</option>
											</select>
										</div>
										<InputField
											placeholder='Paid Amount'
											type='number'
											className='col-12 fv-row mb-7'
											name='paid_amount'
											label='Paid Amount'
											htmlFor='paid_amount'
											value={
												fitnessCoursesData?.paid_amount
													? fitnessCoursesData?.paid_amount
													: fitnessAddData.paid_amount
											}
											onChange={(e) => handleCourseInputChange(e)}
										/>
									</div>
								</div>
								<div className='modal-footer justify-content-end'>
									<div data-bs-dismiss='modal'>
										<TableButton
											action='add'
											onClick={() => handleAddCourse()}
											text='Add Course'
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div
						className='modal fade'
						id='kt_modal_invite_update'
						aria-hidden='true'>
						<div className='modal-dialog modal-dialog-centered mw-650px'>
							<div className='modal-content'>
								<div className='modal-header justify-content-between'>
									<h2 className='fw-bolder'>Fitness Course</h2>
									<div
										className='btn btn-sm btn-icon btn-active-color-primary'
										data-bs-dismiss='modal'>
										<FontAwesomeIcon
											className='fs-1 position-absolute ms-3'
											icon={faXmark}
										/>
									</div>
								</div>
								<div className='modal-body scroll-y'>
									<InputField
										placeholder='Paid Amount'
										type='number'
										className='col-12 fv-row mb-7'
										name='paid_amount'
										label='Paid Amount'
										htmlFor='paid_amount'
										value={fitnessAddData.paid_amount}
										onChange={(e) => handleFitnessAddInputChange(e)}
									/>
								</div>
								<div className='modal-footer justify-content-end'>
									<div data-bs-dismiss='modal'>
										<TableButton
											action='edit'
											onClick={() => UpdateOrderData()}
											text='Save Changes'
											backgroundDark={true}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</KTCard>
			</>
		</>
	)
}
export { GMUserView }
