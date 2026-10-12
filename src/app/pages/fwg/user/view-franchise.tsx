import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TextareaField from '../../../components/TextareaField'
import {
	AssignMembershipPlan,
	ChangeFranchiseUserPassword,
	DeleteFranchiseUser,
	FileUploadToFWG,
	GetAssignedMembershipPlan,
	GetFranchiseUser,
	GetMembershipPlan,
	SetFranchiseUserAccess,
	UpdateFranchiseUserProfile,
	WithdrawAssignedMembershipPlan,
} from '../../../Functions/FWG'
import { PageTitle } from '../../../../_metronic/layout/core'
import TableButton from '../../../components/TableButton'

const ViewFranchise = () => {
	const navigate = useNavigate();
	const location = useLocation()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const searchParams = new URLSearchParams(location.search)
	const franchiseId = searchParams.get('franchise_id')
	const [selectedPlanId, setSelectedPlanId] = useState('')
	const [franchiseData, setFranchiseData] = useState<any>({
		profile_image: '',
		franchiseType: '',
		firstName: '',
		lastName: '',
		email: '',
		mobile: '',
		qualification: '',
		commission: '',
		password: '',
		con_password: '',
		message: '',
		_id: '',
		user_access_permission: '',
	})
	const [permissions, setPermissions] = useState({
		user_profile: false,
		membership_info: false,
		exercise_update: false,
		diet_update: false,
	})
	const [changePassword, setChangePassword] = useState({
		newPassword: '',
		password: '',
	})
	const [membershipData, setMembershipData] = useState<any>([])
	const [plansData, setPlansData] = useState<any>([])
	const [showPassword, setShowPassword] = useState(false)

	const handleInputPasswordChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setChangePassword((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		if (event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setFranchiseData((prevData: any) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}))
		} else {
			setFranchiseData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFranchiseData({ ...franchiseData, [name]: value })
	}

	const handleUpdateFranchiseData = async () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

		// Validate email
		if (!emailRegex.test(franchiseData.email)) {
			toast.error('Please enter a valid email address')
			return
		}

		setIsSubmitting(true)
		let imageUrl = franchiseData.profile_image
		if (franchiseData.selectedFile) {
			try {
				const formData = new FormData()
				formData.append('file', franchiseData.selectedFile)

				const imageResponse: any = await FileUploadToFWG([formData.get('file')], {
					directory: 'documents',
				})
				imageUrl = imageResponse.data?.fileURLs[0]
				toast.success('Thumbnail image uploaded successfully')
			} catch (error: any) {
				toast.error(error.message)
				setIsSubmitting(false)
				return
			}
		}

		try {
			const payload: any = {
				franchiseType: franchiseData.franchiseType,
				first_name: franchiseData.firstName,
				last_name: franchiseData.lastName,
				email: franchiseData.email,
				mobile: franchiseData.mobile,
				qualification: franchiseData.qualification,
				commission: franchiseData.commission,
				message: franchiseData.message,
				id: franchiseId,
				profile_image: imageUrl,
			}

			if (franchiseId) {
				await UpdateFranchiseUserProfile(payload)
				toast.success('Franchise Data Updated Successfully')
				fetchFranchiseData()
			} else {
				console.error('Franchise ID is null')
				toast.error('Franchise ID is missing')
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error('Error Updating Franchise Data:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const updateFranchisePassword = async () => {
		try {
			if (changePassword.password !== changePassword.newPassword) {
				toast.error('Passwords do not match')
				return
			}

			const payload: any = {
				id: franchiseId,
				password: changePassword.password,
			}

			await ChangeFranchiseUserPassword(payload)

			toast.success('Franchise Password Updated Successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const fetchFranchiseData = async () => {
		try {
			if (franchiseId) {
				const response: any = await GetFranchiseUser({ id: franchiseId })
				if (response && response.data) {
					setFranchiseData(response.data)
					setPermissions(response.data.user_access_permission || {})
				} else {
					console.error('Invalid franchise data received:', response)
				}
			} else {
				console.error('Franchise ID is null')
			}
		} catch (error) {
			console.error('Error fetching franchise data:', error)
		}
	}

	const fetchFranchiseMembershipPlanData = async () => {
		try {
			if (franchiseId) {
				const response: any = await GetAssignedMembershipPlan({ franchise_id: franchiseId })
				if (response && response.data) {
					setMembershipData(response.data)
				} else {
					console.error('Invalid Membership data received:', response)
				}
			} else {
				console.error('Franchise ID is null')
			}
		} catch (error) {
			console.error('Error fetching franchise data:', error)
		}
	}

	const fetchMembershipPlanNamesData = async () => {
		try {
			const response: any = await GetMembershipPlan()
			if (response && response.data) {
				setPlansData(response.data)
			} else {
				console.error('Invalid Plan received:', response)
			}
		} catch (error) {
			console.error('Error fetching franchise data:', error)
		}
	}

	useEffect(() => {
		fetchFranchiseData()
		fetchFranchiseMembershipPlanData()
		fetchMembershipPlanNamesData()
	}, [franchiseId])

	useEffect(() => {
		setFranchiseData(franchiseData)
	}, [franchiseData])

	const handleCheckboxChange = (event: any) => {
		const { id, checked } = event.target
		setPermissions((prevPermissions) => ({
			...prevPermissions,
			[id]: checked,
		}))
	}

	const handleUpdatePermissions = async () => {
		try {
			const payload: any = {
				franchise_user_id: franchiseId,
				user_profile: permissions.user_profile,
				membership_info: permissions.membership_info,
				exercise_update: permissions.exercise_update,
				diet_update: permissions.diet_update,
			}
			const response: any = await SetFranchiseUserAccess(payload)
			if (response && response.data) {
				toast.success('Permission Updated successfully', {
					position: 'top-right',
				})
				fetchFranchiseData()
			} else {
				throw new Error('Invalid response')
			}
		} catch (error: any) {
			toast.error(`Error updating permissions: ${error.message}`, {
				position: 'top-right',
			})
		}
	}

	const handleDeleteFranchiseData = async () => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover! this data!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				if (franchiseId) {
					await DeleteFranchiseUser({ id: franchiseId })
					toast.success('Franchise Data Removed Successfully')

					navigate('/fwg/users/franchise')
				} else {
					toast.error('Franchise ID is missing')
					return
				}
			}
		})
	}

	const handleRemoveAssign = async (_id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await WithdrawAssignedMembershipPlan({ id: _id })
					toast.success('Plan Deleted Successfully')
					fetchFranchiseMembershipPlanData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const handleSelectChange = (event: any) => {
		setSelectedPlanId(event.target.value)
	}

	const AddMembershipPlan = async () => {
		try {
			if (franchiseId) {
				await AssignMembershipPlan({
					plan_id: selectedPlanId,
					franchise_id: franchiseId,
				})
				toast.success('Plan Assign Successfully')
				fetchFranchiseMembershipPlanData()
			} else {
				console.error('Franchise ID is null')
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>View Franchise</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10 mb-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-2 text-center'>
									<div className='symbol symbol-100px mb-5 symbol-lg-160px symbol-fixed position-relative'>
										{franchiseData.profile_image ? (
											<img
												alt='User'
												src={franchiseData.profile_image || '/media/avatars/300-1.jpg'}
												style={{ borderRadius: '10px', width: '90%' }}
											/>
										) : (
											<div className='no-image-text'>Image not found</div>
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
								<div className='col-lg-10'>
									<div className='row'>
										<SelectField
											className='col-md-12 fv-row mb-7'
											label='Franchise Type'
											name='franchiseType'
											value={franchiseData.franchiseType}
											onChange={handleInputChange}
											htmlFor='franchiseType'
											options={['Micro Franchise', 'Franchise']}
										/>
										<InputField
											placeholder='First Name'
											type='text'
											className='col-md-6 fv-row mb-7'
											name='first_name'
											label='First Name'
											htmlFor='expense_number'
											value={franchiseData.firstName}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Last Name'
											type='text'
											className='col-md-6 fv-row mb-7'
											name='last_name'
											label='Last Name'
											htmlFor='last_name'
											value={franchiseData.lastName}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Enter Email'
											type='email'
											className='col-md-6 fv-row mb-7'
											name='email'
											label='Email'
											htmlFor='email'
											value={franchiseData.email}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Mobile'
											type='number'
											className='col-md-6 fv-row mb-7'
											name='mobile'
											label='Mobile'
											htmlFor='Mobile'
											value={franchiseData.mobile}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Qualification'
											type='text'
											className='col-md-6 fv-row mb-7'
											name='qualification'
											label='Qualification'
											htmlFor='qualification'
											value={franchiseData.qualification}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Commission'
											type='number'
											className='col-md-6 fv-row mb-7'
											name='commission'
											label='Commission'
											htmlFor='commission'
											value={franchiseData.commission}
											onChange={handleInputChange}
										/>
										<TextareaField
											className='col-md-12 fv-row mb-7'
											label='Message'
											placeholder='Write Message'
											name='message'
											htmlFor='message'
											value={franchiseData.message}
											onChange={handleNotesChange}
										/>
										<div className='col'></div>
										<div className='col-12 fv-row text-end'>
											<TableButton
												action="edit"
												onClick={handleUpdateFranchiseData}
												text={isSubmitting ? 'Please wait, Updating...' : 'Update'}
												disabled={isSubmitting}
												backgroundDark={true}
												className={` ${isSubmitting ? 'disabled' : ''}`}
											/>
											<TableButton
												action="remove"
												onClick={() => handleDeleteFranchiseData()}
												text="Remove"
												backgroundDark={true}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className='card py-10 mb-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-12'>
									<div className='w-100 my-5'>
										<div className='pb-5'>
											<h2 className='fw-bolder d-flex align-items-center text-dark'>
												Assigned Plan
											</h2>
										</div>
										{membershipData.map((plan: any, index: any) => (
											<div
												className='d-flex mb-5'
												key={index}>
												<input
													placeholder='text'
													type='text'
													value={plan.plan_info.name}
													className='form-control form-control-solid mb-3 mb-lg-0'
													autoComplete='off'
												/>
												<TableButton
													action="remove"
													backgroundDark={true}
													onClick={() => handleRemoveAssign(plan._id)}
												/>
											</div>
										))}
										<div className="row">
											<div className='col-6'>
												<label
													className='required fw-bold fs-6 mb-2'
													id='assigned_plan'
													htmlFor='assign_plan'>
													Change Type
												</label>
												<select
													className='form-control form-select form-control-solid mb-3 w-100 mb-lg-0'
													id='assigned_plan'
													value={selectedPlanId}
													onChange={handleSelectChange}
													autoComplete='off'>
													<option value=''>Select Type</option>
													{plansData.map((plan: any) => (
														<option
															key={plan._id}
															value={plan._id}>
															{plan.name}
														</option>
													))}
												</select>
											</div>
											<div className='col-6 fv-row mt-9'>
												<TableButton
													action="assign"
													onClick={() => AddMembershipPlan()}
													text="Assign"
													backgroundDark={true}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className='card py-10 mb-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-12'>
									<div className='w-100 my-5'>
										<div className='pb-5'>
											<h2 className='fw-bolder d-flex align-items-center text-dark'>Permission</h2>
										</div>
										<div className='fv-row'>
											<div className='row'>
												<div className='col-md-3'>
													<input
														type='checkbox'
														className='btn-check'
														id='user_profile'
														checked={permissions.user_profile}
														onChange={handleCheckboxChange}
													/>
													<label
														className='btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center mb-10'
														htmlFor='user_profile'>
														<img
															src='/media/images/profile.png'
															style={{ width: '64px' }}
															alt='User Profile'
														/>
														<span className='d-block fw-bold mx-3 text-start'>
															<span className='text-dark fw-bolder d-block fs-4 mb-2'>
																User Profile
															</span>
														</span>
													</label>
												</div>
												<div className='col-md-3'>
													<input
														type='checkbox'
														className='btn-check'
														id='membership_info'
														checked={permissions.membership_info}
														onChange={handleCheckboxChange}
													/>
													<label
														className='btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center'
														htmlFor='membership_info'>
														<img
															src='/media/images/loyalty-program.png'
															style={{ width: '64px' }}
															alt='Membership Information'
														/>
														<span className='d-block fw-bold mx-3 text-start'>
															<span className='text-dark fw-bolder d-block fs-4 mb-2'>
																Membership Information
															</span>
														</span>
													</label>
												</div>
												<div className='col-md-3'>
													<input
														type='checkbox'
														className='btn-check'
														id='exercise_update'
														checked={permissions.exercise_update}
														onChange={handleCheckboxChange}
													/>
													<label
														className='btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center'
														htmlFor='exercise_update'>
														<img
															src='/media/images/report.png'
															style={{ width: '64px' }}
															alt='Exercise Update'
														/>
														<span className='d-block fw-bold mx-3 text-start'>
															<span className='text-dark fw-bolder d-block fs-4 mb-2'>
																Exercise Update
															</span>
														</span>
													</label>
												</div>
												<div className='col-md-3'>
													<input
														type='checkbox'
														className='btn-check'
														id='diet_update'
														checked={permissions.diet_update}
														onChange={handleCheckboxChange}
													/>
													<label
														className='btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center'
														htmlFor='diet_update'>
														<img
															src='/media/images/nutrition-plan.png'
															style={{ width: '64px' }}
															alt='Diet Update'
														/>
														<span className='d-block fw-bold mx-3 text-start'>
															<span className='text-dark fw-bolder d-block fs-4 mb-2'>
																Diet Update
															</span>
														</span>
													</label>
												</div>
												<div className='col-12 text-end'>
													<TableButton
														action="edit"
														onClick={() => handleUpdatePermissions()}
														text="Update"
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
					<div className='row mt-10 mb-10'>
						<div className='col-12 mt-3'>
							<div className='card pt-10'>
								<div className='card-body'>
									<h1 className='fw-bold text-dark fs-1 mb-10 '>
										Reset Password
									</h1>
									<div className='row'>
										<div className='col-12'>
											<div className='row'>
												<InputField
													placeholder='Enter New Password'
													type={showPassword ? 'text' : 'password'}
													className='col-12 fv-row mb-7'
													name='newPassword'
													label='New Password'
													htmlFor='newPassword'
													value={changePassword.newPassword}
													onChange={handleInputPasswordChange}
												/>
												<InputField
													placeholder='Enter Password'
													type={showPassword ? 'text' : 'password'}
													className='col-12 fv-row mb-7'
													name='password'
													label='Confirm Password'
													htmlFor='password'
													value={changePassword.password}
													onChange={handleInputPasswordChange}
												/>
												<div className='col-md-3 fv-row mb-7'>
													<TableButton
														action="edit"
														onClick={() => updateFranchisePassword()}
														text="Reset Password"
														showIcon={false}
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
			</div>
		</>
	)
}

export { ViewFranchise }
