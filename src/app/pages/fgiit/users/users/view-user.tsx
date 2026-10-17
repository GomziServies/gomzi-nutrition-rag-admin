import { faCamera, faCheck, faShoppingCart, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import CopyableInput from '../../../../components/CopyableInput'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import {
	AssignFitnessCourse,
	FileUploadToFGGroup,
	GetFitnessCourse,
	GetUserFitnessCourses,
	GetUsers,
	RemoveUser,
	UpdateOrder,
	UpdateUser,
} from '../../../../Functions/FGGroup'
import questionmark from './300-1.jpg'
import '../../../gomzi-nutrition/common-management.css'

type FitnessCourse = {
	_id: string
	course_name: string
	course_category: string
	amount: string
	currency: string
	updatedBy: string
}

const UserView = () => {
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

	// Address dropdown states
	const [countries, setCountries] = useState<string[]>([])
	const [states, setStates] = useState<string[]>([])
	const [cities, setCities] = useState<string[]>([])

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
		setLoading(true)
		try {
			const fitness_course_response: any = await GetFitnessCourse()

			const virtualCourses = fitness_course_response.data.filter(
				(course: any) =>
					course.coaching_mode === 'VIRTUAL' &&
					(course.course_name.includes('(International)') ||
						course.course_name.includes('Flexible Learning'))
			)
			setFitnessCourses(virtualCourses)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchUserData = async () => {
		setServiceLoading(true)
		try {
			const response: any = await GetUsers({ id: user_id })
			const filteredData: any = response.data[0]

			const profileData = filteredData?.document?.find((data: any) => data.label == 'profile')
			const aadharData = filteredData?.document?.find((data: any) => data.label == 'aadhar')
			const markSheetData = filteredData?.document?.find((data: any) => data.label == 'marksheet')

			const userData = {
				cover_image: filteredData?.profile_image || '',
				_id: filteredData?._id || '',
				uid: filteredData?.uid || '',
				app_version: filteredData?.app_data?.app_version || '',
				first_name: filteredData?.first_name || '',
				last_name: filteredData?.last_name || '',
				email: filteredData?.email || '',
				mobile: filteredData?.mobile || '',
				createdAt: filteredData?.createdAt || '',
				updatedAt: filteredData?.updatedAt || '',
				birth_date: filteredData?.birth_date || '',
				alumni: filteredData?.alumni || '',
				address_line_1: filteredData?.address?.address_line_1 || '',
				address_line_2: filteredData?.address?.address_line_2 || '',
				city: filteredData?.address?.city || '',
				state: filteredData?.address?.state || '',
				country: filteredData?.address?.country || '',
				pin_code: filteredData?.address?.pin_code || '',
				lock: filteredData?.lock || false,
				editImage: false,
				active_services: filteredData?.active_services || [],
				notes: filteredData?.notes || '',
				profile: profileData,
				aadhar: aadharData,
				marksheet: markSheetData,
			}

			setUserResponseData(userData)

			// If user has a country, fetch states for that country
			if (userData.country) {
				await fetchStates(userData.country)

				// If user has a state, fetch cities for that state
				if (userData.state) {
					await fetchCities(userData.country, userData.state)
				}
			}
		} catch (error) {
			console.error(error)
		}
		setServiceLoading(false)
	}
	const fetchUserFitnessCoursesData = async (page?: number) => {
		setLoading(true)
		try {
			const fitness_response = await GetUserFitnessCourses({
				user_id,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
			})

			let fitness_filteredData: any = fitness_response.data
			fitness_filteredData = fitness_filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setUserData(fitness_filteredData)

			const metaData: any = fitness_response.metadata
			setMetaData(metaData.pagination)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchUserFitnessCoursesData()
	}, [searchTerm, pagination.itemsPerPage, pagination.page, sort, sortOrder])

	useEffect(() => {
		const fetchData = async () => {
			await fetchUserData()
			fetchFitnessCourseData()
		}

		fetchData()
	}, [])

	// Fetch countries on component mount
	useEffect(() => {
		const fetchCountries = async () => {
			try {
				const response = await fetch('https://countriesnow.space/api/v0.1/countries')
				const data = await response.json()
				if (data && data.data) {
					const countryNames = data.data.map((country: any) => country.country)
					setCountries(countryNames)
				}
			} catch (error) {
				console.error('Error fetching countries:', error)
			}
		}

		fetchCountries()
	}, [])

	// Fetch states when country changes
	const fetchStates = async (country: string) => {
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ country }),
			})
			const data = await response.json()
			if (data && data.data && data.data.states) {
				const stateNames = data.data.states.map((state: any) => state.name)
				setStates(stateNames)
				// Reset cities when country changes
				setCities([])
			}
		} catch (error) {
			console.error('Error fetching states:', error)
		}
	}

	// Fetch cities when state changes
	const fetchCities = async (country: string, state: string) => {
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ country, state }),
			})
			const data = await response.json()
			if (data && data.data) {
				setCities(data.data)
			}
		} catch (error) {
			console.error('Error fetching cities:', error)
		}
	}
	const handleCourseSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedCourseId = event.target.value
		let selectedCourse = fitnessCourses.find((course) => course?.course_name === selectedCourseId)

		if (!selectedCourse) {
			selectedCourse = fitnessCourses.find(
				(course) => `${course?.course_name} - ${course?.course_category}` === selectedCourseId
			)
		}

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

				await AssignFitnessCourse(payload)
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
			// Handle cascading dropdowns for address fields
			if (name === 'country') {
				// When country changes, fetch states
				fetchStates(value)
				// Reset state and city
				setUserResponseData((prevData: any) => ({
					...prevData,
					country: value,
					state: '',
					city: '',
				}))
			} else if (name === 'state') {
				// When state changes, fetch cities
				fetchCities(userResponseData.country, value)
				// Update state and reset city
				setUserResponseData((prevData: any) => ({
					...prevData,
					state: value,
					city: '',
				}))
			} else {
				// For all other fields, update normally
				setUserResponseData((prevData: any) => ({
					...prevData,
					[name]: value,
				}))
			}
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

	// const handleSelectTypeChange = (
	// 	event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	// ) => {
	// 	const { id, name, value } = event.target

	// 	let courseName: any = []
	// 	const coachingData = fitnessCourses.filter((course: any) => course.coaching_mode === value)
	// 	courseName = coachingData.map((course: any) => course?.course_name)

	// 	setFitnessCoursesId(courseName)
	// }

	const handleSelectTypeChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { value } = event.target

		if (value === 'select') {
			setFitnessCoursesId([])
			return
		}

		const filteredCourseNames: any = fitnessCourses
			.filter((course: any) => course.coaching_mode === value)
			// .map((course: any) => `${course.course_name}`)
			.map((course: any) => `${course.course_name} - ${course.course_category}`)

		setFitnessCoursesId(filteredCourseNames)
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
			].filter(Boolean)

			const payload: any = {
				id: userResponseData._id,
				first_name: userResponseData.first_name,
				last_name: userResponseData.last_name,
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

			navigate('/rag/users')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
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
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>User Details</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/users'>Users</Link>
				<span className='sep'>/</span>
				<span className='current'>{userResponseData.first_name ? `${userResponseData.first_name} ${userResponseData.last_name || ''}` : 'User Profile'}</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>User Profile & Records</h1>
					<p className='gz-mgmt-subtitle'>View account profile, contact credentials, addresses, and order history</p>
				</div>
				<Link to='/rag/users' className='gz-mgmt-btn-secondary text-decoration-none'>
					Back to Users
				</Link>
			</div>

			<div className='gz-mgmt-form-card mb-8'>
				<div className='d-flex justify-content-between align-items-center flex-wrap gap-3 pb-6 mb-6' style={{ borderBottom: '1px solid #F1F5F9' }}>
					<div>
						<h2 className='fw-bold mb-1' style={{ fontSize: '18px', color: '#172B4D' }}>
							Personal & Contact Information
						</h2>
						<div className='text-muted fs-7'>
							Manage profile photo, contact channels, address details, and system IDs
						</div>
					</div>
					{userResponseData._id && (
						<span
							className='gz-mgmt-pill info'
							style={{ fontSize: '12.5px', padding: '6px 12px' }}>
							User ID: {userResponseData._id}
						</span>
					)}
				</div>
				<div>
					<div className='row'>
									<div className='col-md-2 text-center d-flex flex-column align-items-center mb-6 mb-md-0'>
										<div className='mb-3'>
											<label className='fw-bold fs-6 mb-3 d-block text-gray-800'>
												Profile Photo
											</label>
											<div className='position-relative d-inline-block'>
												<img
													alt='Users'
													src={
														isDocument.profile
															? `https://files.fggroup.in/${documentFile.profile}`
															: userResponseData?.profile?.file
															? `https://files.fggroup.in/${userResponseData?.profile?.file}`
															: '/media/avatars/300-1.jpg'
													}
													style={{
														width: '130px',
														height: '130px',
														borderRadius: '12px',
														objectFit: 'cover',
														border: '2px solid #DFE7F0',
														boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
													}}
												/>
											</div>
											<div className='mt-3'>
												<button
													type='button'
													className='btn btn-sm btn-primary d-inline-flex align-items-center gap-2 px-3 py-2'
													style={{
														fontSize: '12.5px',
														fontWeight: 600,
														borderRadius: '8px',
													}}
													onClick={() => handleFileButtonClick('fileInput')}>
													<FontAwesomeIcon icon={faCamera} />
													<span>Upload Profile</span>
												</button>
												<input
													type='file'
													id='fileInput'
													className='d-none'
													accept='image/*'
													onChange={(e) => handleFileUpload(e, 'profile')}
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
													name='uid'
													label='User ID'
													htmlFor='uid'
													value={userResponseData._id || ''}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='First Name'
													type='text'
													name='first_name'
													label='First Name'
													htmlFor='first_name'
													value={userResponseData.first_name || ''}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Last Name'
													type='text'
													name='last_name'
													label='Last Name'
													htmlFor='last_name'
													value={userResponseData.last_name || ''}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<CopyableInput
													placeholder='Email'
													type='email'
													name='email'
													label='Email'
													htmlFor='email'
													value={userResponseData.email || ''}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<CopyableInput
													placeholder='Mobile Number'
													type='text'
													name='mobile'
													label='Mobile Number'
													htmlFor='mobile'
													value={userResponseData.mobile || ''}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Registration Date'
													type='text'
													name='createdAt'
													label='Registration Date'
													htmlFor='createdAt'
													value={userResponseData.createdAt || ''}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Last Modification'
													type='text'
													name='updatedAt'
													label='Last Modification'
													htmlFor='updatedAt'
													value={userResponseData.updatedAt || ''}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Date of Birth'
													type='date'
													name='birth_date'
													label='Date of Birth'
													htmlFor='birth_date'
													value={userResponseData.birth_date || ''}
													onChange={handleInputChange}
													disabled
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Plot/House No.'
													type='text'
													name='address_line_1'
													label='Plot/House No.'
													htmlFor='address_line_1'
													value={userResponseData.address_line_1 || ''}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Address'
													type='text'
													name='address_line_2'
													label='Address'
													htmlFor='address_line_2'
													value={userResponseData.address_line_2 || ''}
													onChange={handleInputChange}
												/>
											</div>
											<SelectField
												className='col-md-4 fv-row mb-7'
												label='Country'
												name='country'
												value={userResponseData.country || ''}
												onChange={handleInputChange}
												htmlFor='country'
												options={countries.map((c) => ({ label: c, value: c }))}
												searchable={true}
												defaultLabel='Select Country'
											/>
											<SelectField
												className='col-md-4 fv-row mb-7'
												label='State'
												name='state'
												value={userResponseData.state || ''}
												onChange={handleInputChange}
												htmlFor='state'
												options={states.map((s) => ({ label: s, value: s }))}
												searchable={true}
												disabled={states.length === 0}
												defaultLabel='Select State'
											/>
											<SelectField
												className='col-md-4 fv-row mb-7'
												label='City'
												name='city'
												value={userResponseData.city || ''}
												onChange={handleInputChange}
												htmlFor='city'
												options={cities.map((ci) => ({ label: ci, value: ci }))}
												searchable={true}
												disabled={cities.length === 0}
												defaultLabel='Select City'
											/>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Pincode'
													type='text'
													name='pin_code'
													label='Pincode'
													htmlFor='pin_code'
													value={userResponseData.pin_code || ''}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<InputField
													placeholder='Notes'
													type='text'
													name='notes'
													label='Notes'
													htmlFor='notes'
													value={userResponseData.notes || ''}
													onChange={handleInputChange}
												/>
											</div>

											<div className='col-md-12 fv-row mt-6 pt-4 d-flex justify-content-end align-items-center gap-3' style={{ borderTop: '1px solid #F1F5F9' }}>
												<button
													type='button'
													className='btn btn-light-danger d-inline-flex align-items-center justify-content-center'
													data-bs-toggle='modal'
													data-bs-target='#kt_modal_exercise'
													style={{
														height: '42px',
														padding: '0 20px',
														borderRadius: '10px',
														fontSize: '13.5px',
														fontWeight: 600,
													}}>
													<i className='bi bi-trash me-2'></i>
													Remove User
												</button>
												<button
													type='button'
													className='gz-mgmt-btn-primary d-inline-flex align-items-center justify-content-center'
													onClick={handleUpdateUser}
													disabled={isSubmitting}>
													{isSubmitting ? (
														<>
															<span
																className='spinner-border spinner-border-sm me-2'
																role='status'
																aria-hidden='true'></span>
															Updating User...
														</>
													) : (
														<>
															<i className='bi bi-check2-circle me-2'></i>
															Update User Profile
														</>
													)}
												</button>
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
					<div className='modal-dialog modal-dialog-centered mw-450px'>
						<div
							className='modal-content border-0'
							style={{ borderRadius: '14px', overflow: 'hidden' }}>
							<div className='modal-header border-0 pb-0 justify-content-end'>
								<button
									type='button'
									className='btn-close'
									data-bs-dismiss='modal'
									aria-label='Close'></button>
							</div>
							<div className='modal-body text-center px-8 pt-2 pb-6'>
								<div
									className='d-inline-flex align-items-center justify-content-center mb-4'
									style={{
										width: '64px',
										height: '64px',
										borderRadius: '50%',
										backgroundColor: '#fee2e2',
										color: '#ef4444',
										fontSize: '24px',
									}}>
									<FontAwesomeIcon icon={faTrash} />
								</div>
								<h3
									className='fw-bolder text-gray-900 mb-2'
									style={{ fontSize: '1.25rem' }}>
									Remove User?
								</h3>
								<p className='text-muted fs-7 mb-6'>
									This user will be permanently removed from the portal and will no longer have access.
								</p>
								<div className='d-flex justify-content-center gap-3'>
									<button
										type='button'
										className='btn btn-light'
										data-bs-dismiss='modal'
										style={{
											borderRadius: '8px',
											padding: '9px 20px',
											fontWeight: 600,
											fontSize: '13.5px',
										}}>
										Cancel
									</button>
									<button
										type='button'
										className='btn btn-danger d-inline-flex align-items-center gap-2'
										data-bs-dismiss='modal'
										onClick={() => delete_user()}
										style={{
											borderRadius: '8px',
											padding: '9px 22px',
											fontWeight: 600,
											fontSize: '13.5px',
										}}>
										<FontAwesomeIcon icon={faCheck} />
										Confirm Remove
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='gz-mgmt-card mb-8'>
					<div className='p-6' style={{ borderBottom: '1px solid #F1F5F9' }}>
						<h3 className='fw-bold m-0' style={{ fontSize: '16px', color: '#172B4D' }}>
							User Records & Activity
						</h3>
					</div>
					<div className='card-body px-6 py-6'>
						<div className='row'>
							<div className='col-md-3 col-sm-6 my-2'>
								<Link
									className='text-decoration-none'
									to={'/rag/all-order?user_id=' + userResponseData._id}>
									<div
										className='d-flex align-items-center p-4'
										style={{
											backgroundColor: '#F8FAFD',
											border: '1px solid #DFE7F0',
											borderRadius: '12px',
											transition: 'all 0.2s ease',
											cursor: 'pointer',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.borderColor = '#1E3A5F'
											e.currentTarget.style.backgroundColor = '#FFFFFF'
											e.currentTarget.style.boxShadow =
												'0 6px 16px rgba(30, 58, 95, 0.08)'
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.borderColor = '#DFE7F0'
											e.currentTarget.style.backgroundColor = '#F8FAFD'
											e.currentTarget.style.boxShadow = 'none'
										}}>
										<div
											className='d-flex align-items-center justify-content-center me-3'
											style={{
												width: '42px',
												height: '42px',
												borderRadius: '10px',
												backgroundColor: '#EFF6FF',
												color: '#2563EB',
												fontSize: '18px',
												flexShrink: 0,
											}}>
											<FontAwesomeIcon icon={faShoppingCart} />
										</div>
										<div>
											<div
												className='fw-bold'
												style={{ fontSize: '14px', color: '#172B4D' }}>
												All Orders
											</div>
											<div className='text-muted fs-8'>View order history</div>
										</div>
									</div>
								</Link>
							</div>
						</div>
					</div>
				</div>
		</div>
	)
}
export { UserView }
