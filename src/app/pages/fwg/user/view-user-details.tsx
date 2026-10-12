import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { AssignDietData } from '../../../components/fwg/AssignDietData'
import { AssignExerciseData } from '../../../components/fwg/AssignExerciseData'
import { AssignFeaturesData } from '../../../components/fwg/AssignFeaturesData'
import { UserWaterIntact } from '../../../components/fwg/UserWaterIntact'
import { UserWeightAndHeightData } from '../../../components/fwg/UserWeightAndHeightData'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import {
	ChangeUserPassword,
	FileUploadToFWG,
	GetUser,
	GetUserSelectedFood,
	RemoveUser,
	UpdateUser,
} from '../../../Functions/FWG'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const ViewUserDetails = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const user_id: string | any = searchParams.get('user_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [updatePassword, setUpdatePassword] = useState({
		password: '',
		co_password: '',
	})
	const [formData, setFormData] = useState<any>({
		firstName: '',
		lastName: '',
		email: '',
		mobile: '',
		country_code: '',
		gender: '',
		birthdate: '',
		goal_title: '',
		workout_start: '',
		workout_end: '',
		sleep_start: '',
		sleep_end: '',
		typicalDay: '',
		medical_condition: '',
		physical_activity: '',
		profile_image: '',
		target: '',
		selectedFile: null as File | null,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setFormData((prevData: any) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}))
		} else {
			setFormData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleInputPasswordChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdatePassword((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handleUpdateButtonClick = async () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		// Validate email
		if (!emailRegex.test(formData.email)) {
			toast.error('Please enter a valid email address')
			return
		}
		setIsSubmitting(true)
		let imageUrl = formData.profile_image
		if (formData.selectedFile) {
			try {
				const formDataToUpload = new FormData()
				formDataToUpload.append('file', formData.selectedFile)

				const imageResponse: any = await FileUploadToFWG([formDataToUpload.get('file')], {
					directory: 'documents',
				})
				imageUrl = imageResponse.data?.fileURLs[0]
				toast.success('Profile image uploaded successfully')
			} catch (error) {
				toast.error('Error uploading image')
				console.error('Error uploading image:', error)
				setIsSubmitting(false)
				return
			}
		}
		try {
			const payload: any = {
				id: user_id,
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				mobile: formData.mobile,
				country_code: formData.country_code,
				gender: formData.gender,
				birthdate: formData.birthdate,
				workout_start: formData.workout_start,
				workout_end: formData.workout_end,
				sleep_start: formData.sleep_start,
				sleep_end: formData.sleep_end,
				typicalDay: formData.typicalDay,
				medical_condition: formData.medical_condition,
				physical_activity: formData.physical_activity,
				profile_image: imageUrl,
			}
			await UpdateUser(payload)

			toast.success('User Updated Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleUpdatePasswordButtonClick = async () => {
		if (!updatePassword.password || !updatePassword.co_password) {
			toast.error('Password and confirm Password Required')
			return
		}

		if (updatePassword.password !== updatePassword.co_password) {
			toast.error('Password and confirm password do not match')
			return
		}

		try {
			setIsSubmittingPassword(true)

			const payload: any = {
				id: user_id,
				password: updatePassword.password,
			}

			await ChangeUserPassword(payload)
			setUpdatePassword({
				password: '',
				co_password: '',
			})
			toast.success('Password Update Successfully')
			setIsSubmittingPassword(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmittingPassword(false)
			console.error(error)
		}
	}

	const fetchUserData = async () => {
		try {
			const response: FWG_APIResponse | undefined = await GetUser({ id: user_id })
			const data: any = response.data[0]
			const goal = data.goal[0] || ''
			setFormData({ goal_title: goal.goal_title, target: goal.target, ...data })
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
	}, [])

	const removeUser = async (userID: string) => {
		try {
			Swal.fire({
				title: 'Are you sure?',
				text: 'You are about Remove this User.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			}).then(async (result) => {
				if (result.isConfirmed) {
					const response: any = await RemoveUser({ id: userID })
					if (response.status === 200) {
						toast.success('User Removed successfully')
						navigate('/fwg/users/user')
					} else {
						toast.error('Failed to deactivate user')
					}
				}
			})
		} catch (error: any) {
			console.error('Error deactivating user:', error)
			toast.error(error.message)
		}
	}

	// User Food

	const [foodData, setFoodData] = useState<any>('')

	useEffect(() => {
		const fetchUserFoodData = async () => {
			try {
				const response: any = await GetUserSelectedFood({ user_id: user_id })
				setFoodData(response.data)
			} catch (error) {
				console.error(error)
			}
		}

		fetchUserFoodData()
	}, [])

	const renderCheckboxes = (category: string, items: string[]) => {
		return items.map((item: string, index: number) => (
			<div
				className='col-md-3'
				key={index}>
				<input
					type='checkbox'
					className='btn-check'
					name={category.toLowerCase()}
					value={item.toLowerCase()}
					id={`${item.toLowerCase()}_${index}`}
				/>
				<label
					className='btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center'
					htmlFor={`${item.toLowerCase()}_${index}`}>
					<img
						src={toAbsoluteUrl(`/media/images/${item.toLowerCase()}.png`)}
						style={{ width: '64px' }}
						alt={item}
					/>
					<span className='d-block fw-bold mx-3 text-start'>
						<span className='text-dark fw-bolder d-block fs-4 mb-2'>{item}</span>
					</span>
				</label>
			</div>
		))
	}

	const renderNoDataMessage = () => {
		return (
			<div className='text-center'>
				<p className='fs-2 mb-0'>
					<b>No data available</b>
				</p>
			</div>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-3 text-center'>
									<div className='symbol symbol-100px mb-5 symbol-lg-160px symbol-fixed position-relative'>
										{formData.profile_image ? (
											<img
												alt='User'
												src={formData.profile_image || '/media/avatars/300-1.jpg'}
												style={{ borderRadius: '10px', width: '90%' }}
											/>
										) : (
											<img
												alt='User'
												src={'/media/avatars/300-1.jpg'}
												style={{ borderRadius: '10px', width: '90%' }}
											/>
										)}
									</div>
									<div>
										<button
											type='button'
											className='mt-5 px-2 py-1 mb-2 btn btn-success'
											onClick={handleFileButtonClick}>
											Upload Photo
										</button>
										<input
											type='file'
											id='fileInput'
											className='d-none'
											onChange={handleInputChange}
										/>
									</div>
									<p
										className='mt-lg-2 text-danger fs-6'
										style={{ fontWeight: '600' }}>
										Note: Photo/Image Size Limit only 1 MB
									</p>
								</div>
								<div className='col-md-9'>
									<div className='row justify-content-end'>
										<div className='col-12'>
											<div className='row'>
												<InputField
													placeholder='Enter First name'
													type='text'
													className='col-md-6 fv-row'
													name='firstName'
													label='First name'
													htmlFor='firstName'
													value={formData.firstName}
													onChange={handleInputChange}
												/>
												<InputField
													placeholder='Enter Last name'
													type='text'
													className='col-md-6 fv-row'
													name='lastName'
													label='Last Name'
													htmlFor='Last Name'
													value={formData.lastName}
													onChange={handleInputChange}
												/>
												<InputField
													placeholder='Enter Email'
													type='email'
													className='col-md-6 fv-row'
													name='email'
													label='Email'
													htmlFor='Email'
													value={formData.email}
													onChange={handleInputChange}
												/>
												<InputField
													placeholder='Enter country code'
													type='text'
													className='col-md-2 fv-row'
													name='country_code'
													label='Country Code'
													htmlFor='country_code'
													value={formData.country_code}
													onChange={handleInputChange}
												/>
												<InputField
													placeholder='Enter Mobile No.'
													type='number'
													className='col-md-4 fv-row'
													name='mobile'
													label='Mobile'
													htmlFor='Mobile'
													value={formData.mobile}
													onChange={handleInputChange}
												/>
												<SelectField
													className='col-md-6 fv-row mb-7'
													label='Gender'
													name='gender'
													value={formData.gender}
													onChange={handleInputChange}
													htmlFor='gender'
													options={['MALE', 'FEMALE', 'OTHER']}
												/>
												<InputField
													placeholder='Enter Date'
													type='date'
													className='col-md-6 fv-row'
													name='birthdate'
													label='Birth Date'
													htmlFor='birthdate'
													value={DayJS(formData.birthdate).format('YYYY-MM-DD')}
													onChange={handleInputChange}
												/>
												<InputField
													placeholder='Workout Start'
													type='time'
													className='col-md-6 fv-row'
													name='workout_start'
													label='Workout Start'
													htmlFor='workout_start'
													value={formData.workout_start}
													onChange={handleInputChange}
												/>
												<InputField
													placeholder='Workout End'
													type='time'
													className='col-md-6 fv-row'
													name='workout_end'
													label='Workout End'
													htmlFor='workout_end'
													value={formData.workout_end}
													onChange={handleInputChange}
												/>
												<InputField
													placeholder='Sleep Start'
													type='time'
													className='col-md-6 fv-row'
													name='sleep_start'
													label='Sleep Start'
													htmlFor='sleep_start'
													value={formData.sleep_start}
													onChange={handleInputChange}
												/>
												<InputField
													placeholder='Sleep End'
													type='time'
													className='col-md-6 fv-row'
													name='sleep_end'
													label='Sleep End'
													htmlFor='sleep_end'
													value={formData.sleep_end}
													onChange={handleInputChange}
												/>
												<SelectField
													className='col-md-6 fv-row mb-7'
													label='Typical Day'
													name='typicalDay'
													value={formData.typicalDay}
													onChange={handleInputChange}
													htmlFor='typicalDay'
													options={[
														'At The Office',
														'At The Office But I Go Out On A Regular Basis',
														'I Spent The Better Of The Day On Foot',
														'Manual Worker',
														'I Mostly Stay At Home',
													]}
												/>
												<SelectField
													className='col-md-6 fv-row mb-7'
													label='Medical Condition'
													name='medical_condition'
													value={formData.medical_condition}
													onChange={handleInputChange}
													htmlFor='medical_condition'
													options={[
														'DIABETES',
														'THYROID',
														'CANCER',
														'POLYCYSTIC OVARY SYNDROME',
														'URIC ACID',
														'BACK PAIN',
														'KNEE PAIN',
														'NECK PAIN',
													]}
												/>
												<SelectField
													className='col-md-6 fv-row mb-7'
													label='Goal'
													name='goal_title'
													value={formData.goal_title}
													onChange={handleInputChange}
													htmlFor='goal_title'
													options={['FAT LOSS', 'MUSCLE GAIN']}
												/>
												<InputField
													placeholder='Enter Target'
													type='text'
													className='col-md-6 fv-row  mb-7'
													name='target'
													label='Target (in KG)'
													htmlFor='target'
													value={formData.target}
													onChange={handleInputChange}
												/>
												{/* <div className='col-md-6 fv-row mb-7'>
											<label
												htmlFor='dfsf'
												className='required fw-bold fs-6 mb-2'>
												User Category
											</label>
											<select
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'>
												<option>Select User Category</option>
												<option>Normal User</option>
												<option>Personal Training</option>
											</select>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<label
												htmlFor='dfsf'
												className='required fw-bold fs-6 mb-2'>
												Personal Training Price
											</label>
											<input
												placeholder='Enter Price if Personal Training'
												type='number'
												className='form-control form-control-solid mb-3 mb-lg-0'
												autoComplete='off'
											/>
										</div> */}
											</div>
										</div>
										<div className='col-md-12 mt-5 mb-7'>
											<div className='d-flex justify-content-end'>
												{/* <TableButton
													action='assign'
													to={'/fwg/users/user-assign-plan?user_id=' + user_id}
													text='Plan Assign'
													backgroundDark={true}
												/> */}
												<TableButton
													action='edit'
													onClick={handleUpdateButtonClick}
													text={isSubmitting ? 'Please wait, Saving...' : 'Save'}
													disabled={isSubmitting}
													backgroundDark={true}
													className={`${isSubmitting ? 'disabled' : ''}`}
												/>
												<TableButton
													action='remove'
													onClick={() => removeUser(user_id)}
													text='Remove'
													backgroundDark={true}
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
			<div className='row mb-5 mb-xl-10'>
				<div className='col-12 mt-5'>
					<div className='card'>
						<div className='card-body'>
							<h2 className='fw-bold text-dark fs-1 mb-6  mt-5'>Update Password</h2>
							<div className='row'>
								<div className='col-md-12'>
									<div className='row'>
										<InputField
											placeholder='Enter Password'
											type={showPassword ? 'text' : 'password'}
											className='col-md-6 fv-row mb-7'
											name='password'
											label='Password'
											htmlFor='password'
											value={updatePassword.password}
											onChange={handleInputPasswordChange}
										/>
										<InputField
											placeholder='Re-Enter Password'
											type={showPassword ? 'text' : 'password'}
											className='col-md-6 fv-row'
											name='co_password'
											label='Re-Enter Password'
											htmlFor='co_password'
											value={updatePassword.co_password}
											onChange={handleInputPasswordChange}
										/>
										<div className='col'></div>
										<div className='col-md-3 text-end fv-row mb-7'>
											<TableButton
												action='edit'
												onClick={handleUpdatePasswordButtonClick}
												text={
													isSubmitting ? 'Please wait, Updating Password...' : 'Update Password'
												}
												showIcon={false}
												disabled={isSubmitting}
												backgroundDark={true}
												className={`mx-2 ${isSubmitting ? 'disabled' : ''}`}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* User Food */}
			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_food'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Food</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_food'
					className='collapse'>
					<div className='card-body border-top p-9'>
						<div className='p-6'>
							{foodData && foodData.protein && foodData.protein.length > 0 ? (
								<div className='w-100 my-5'>
									<div className='pb-5'>
										<h2 className='fw-bolder d-flex align-items-center text-dark'>Protein</h2>
									</div>
									<div className='fv-row'>
										<div className='row'>{renderCheckboxes('Protein', foodData.protein)}</div>
									</div>
								</div>
							) : (
								renderNoDataMessage()
							)}

							{foodData && foodData.carbohydrates && foodData.carbohydrates.length > 0 && (
								<div className='w-100 my-5'>
									<div className='pb-5'>
										<h2 className='fw-bolder d-flex align-items-center text-dark'>Carbohydrates</h2>
									</div>
									<div className='fv-row'>
										<div className='row'>
											{renderCheckboxes('Carbohydrates', foodData.carbohydrates)}
										</div>
									</div>
								</div>
							)}

							{foodData && foodData.fat && foodData.fat.length > 0 ? (
								<div className='w-100 my-5'>
									<div className='pb-5'>
										<h2 className='fw-bolder d-flex align-items-center text-dark'>Fat</h2>
									</div>
									<div className='fv-row'>
										<div className='row'>{renderCheckboxes('Fat', foodData.fat)}</div>
									</div>
								</div>
							) : null}
						</div>
					</div>
				</div>
			</div>

			{/* User Weight and Height */}
			<UserWeightAndHeightData user_id={user_id} />

			{/* User Water */}
			<UserWaterIntact user_id={user_id} />

			{/* Assign Plans */}
			<AssignFeaturesData user_id={user_id} />

			{/* Assign Diet Plans */}
			<AssignDietData user_id={user_id} />

			{/* Assign Exercise Plans */}
			<AssignExerciseData user_id={user_id} />
		</>
	)
}

export { ViewUserDetails }
