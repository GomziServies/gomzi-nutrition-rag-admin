import { faCheck, faXmark, faEye, faFile, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { MultiSelect } from 'react-multi-select-component'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	DeleteJobPlacement,
	FileUploadToFGGroup,
	GetFitnessCourse,
	GetJobPlacement,
	GetUsers,
	RemoveJobPostClick,
	UpdateJobPlacement,
} from '../../../Functions/FGGroup'
import questionmark from './300-1.jpg'

const JobPlacementView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const post_id: string | any = searchParams.get('post_id')
	const [countries, setCountries] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [states, setStates] = useState<string[]>([])
	const [cities, setCities] = useState<string[]>([])
	const [courseData, setCourseData] = useState<any>([])
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [displayImg, setDisplayImg] = useState<string | null>(null)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const navigate = useNavigate()
	const [foodAddData, setFoodAddData] = useState({
		title: '',
		contact_person: '',
		website: '',
		contact_email: '',
		contact_mobile: '',
		company_name: '',
		vacancies: '',
		banner_image: '',
		start_date: '',
		end_date: '',
		related_course: [],
		city: '',
		state: '',
		country: '',
		address: '',
		google_map_link: '',
		category: '',
		cv_submissions: [],
	})
	const [cvSubmissionData, setCvSubmissionData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [currentClick, setCurrentClick] = useState<any>(null)
	const [removeStatus, setRemoveStatus] = useState('')
	const [removeReason, setRemoveReason] = useState('')
	const [showViewModal, setShowViewModal] = useState(false)
	const [currentViewClick, setCurrentViewClick] = useState<any>(null)

	const fetchUserData = async () => {
		setLoading(true)
		try {
			const response = await GetJobPlacement({ post_id })
			const filteredData: any = response.data[0]

			const userData = await Promise.all(
				filteredData.cv_submissions.map(async (submission: any) => {
					const user_response = await GetUsers({ id: submission.user })
					return { ...submission, userData: user_response.data[0] }
				})
			)
			setCvSubmissionData(userData)

			const course_response = await GetFitnessCourse()
			let coursefilterData: any = course_response.data
			coursefilterData = coursefilterData
				.filter(
					(course: any, index: number, self: any[]) =>
						index === self.findIndex((c: any) => c.course_name === course.course_name)
				)
				.map((course: any) => ({
					value: course.course_name,
					label: `${course.course_name} - ${course.course_category}`,
					id: course._id,
				}))
			setCourseData(coursefilterData)

			const coursesWithNames = filteredData.related_course.map((courseId: any) => {
				const matchingCourse = coursefilterData.find((course: any) => course.id === courseId)
				return matchingCourse
					? { label: matchingCourse.label, value: matchingCourse.value, id: matchingCourse.id }
					: { label: courseId, value: courseId, id: courseId }
			})
			filteredData.related_course = coursesWithNames

			setFoodAddData({
				...filteredData,
				start_date: filteredData.start_date
					? DayJS(filteredData.start_date).format('YYYY-MM-DD')
					: '',
				end_date: filteredData.end_date ? DayJS(filteredData.end_date).format('YYYY-MM-DD') : '',
			})
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchUserData()
	}, [])

	useEffect(() => {
		const fetchCountries = async () => {
			const res = await fetch('https://countriesnow.space/api/v0.1/countries')
			const json = await res.json()
			setCountries(json.data.map((c: any) => c.country))
		}
		fetchCountries()
	}, [])

	const fetchStates = async (country: string) => {
		const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ country }),
		})
		const json = await res.json()
		setStates(json.data?.states?.map((s: any) => s.name) || [])
	}

	const fetchCities = async (country: string, state: string) => {
		const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ country, state }),
		})
		const json = await res.json()
		setCities(json.data || [])
	}

	useEffect(() => {
		if (foodAddData?.country) {
			fetchStates(foodAddData?.country)
		}
	}, [foodAddData?.country])

	useEffect(() => {
		if (foodAddData?.country && foodAddData?.state) {
			fetchCities(foodAddData?.country, foodAddData?.state)
		}
	}, [foodAddData?.state])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchUserData()
		}
	}, [searchTerm])

	const handleInputChange = async (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]

			setFoodAddData((prevData) => ({
				...prevData,
				selectedFile: file,
				banner_image: URL.createObjectURL(file),
				editImage: true,
			}))
			const imageUrl: any = await FileUploadToFGGroup([file], {
				directory: 'products',
			})
			const imgUrl = imageUrl.data?.fileURLs[0]
			setDisplayImg(imgUrl)
			toast.success('image uploaded successfully')

			toast.success('User profile update successfully')
		} else {
			if (name === 'country') {
				fetchStates(value)
				setFoodAddData((prevData) => ({
					...prevData,
					country: value,
					state: '',
					city: '',
				}))
			} else if (name === 'state') {
				fetchCities(foodAddData?.country, value)
				setFoodAddData((prevData) => ({
					...prevData,
					state: value,
					city: '',
				}))
			} else {
				setFoodAddData((prevData) => ({
					...prevData,
					[name]: value,
				}))
			}
		}
	}

	const handleMultiSelectChange = (selected: any) => {
		setFoodAddData((prevData) => ({
			...prevData,
			related_course: selected,
		}))
	}

	const handleUpdateButtonClick = async () => {
		try {
			setIsSubmitting(true)

			const course = foodAddData?.related_course.map((el: any) => {
				return el.value
			})

			const payload: any = {
				post_id: post_id,
				title: foodAddData?.title,
				contact_person: foodAddData?.contact_person,
				website: foodAddData?.website,
				email: foodAddData?.contact_email,
				mobile: foodAddData?.contact_mobile,
				company_name: foodAddData?.company_name,
				vacancies: foodAddData?.vacancies,
				start_date: foodAddData?.start_date,
				end_date: foodAddData?.end_date,
				banner_image: displayImg,
				related_course: course,
				city: foodAddData?.city || '',
				state: foodAddData?.state || '',
				country: foodAddData?.country || '',
				address: foodAddData?.address,
				google_map_link: foodAddData?.google_map_link,
				category: foodAddData?.category,
			}

			await UpdateJobPlacement(payload)

			// navigate('/fgiit/job-placement')

			toast.success('Placement Updated Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const deleteLecture = async () => {
		try {
			await DeleteJobPlacement({ post_id })

			toast.success('Placement remove successfully')

			navigate('/fgiit/job-placement')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const filteredCvSubmissionData = cvSubmissionData.filter((submission: any) => {
		if (!searchTerm) return true

		const search = searchTerm.toLowerCase()

		return (
			submission?.user?.toLowerCase().includes(search) ||
			`${submission?.userData?.first_name ?? ''} ${submission?.userData?.last_name ?? ''}`
				.toLowerCase()
				.includes(search) ||
			submission?.userData?.email?.toLowerCase().includes(search) ||
			submission?.userData?.mobile?.toLowerCase().includes(search)
		)
	})

	const paginatedLeadData = filteredCvSubmissionData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const sortableFields = [
		{ field: 'user', title: 'User ID' },
		{ field: 'name', title: 'Name' },
		{ field: 'mobile', title: 'Mobile' },
		{ field: 'email', title: 'Email' },
		{ field: 'date', title: 'Date' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	return (
		<>
			<>
				<PageTitle breadcrumbs={[]}>Placement Details</PageTitle>
				<div className='row mb-9'>
					<div className='col-12 mt-3'>
						<div className='card py-10'>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-3 text-center'>
										{displayImg ? (
											<img
												alt='product'
												src={`https://files.fggroup.in/${displayImg || '/media/avatars/300-1.jpg'}`}
												style={{ borderRadius: '10px', width: '70%' }}
											/>
										) : (
											<img
												alt='product'
												src={`https://files.fggroup.in/${
													foodAddData?.banner_image || '/media/avatars/300-1.jpg'
												}`}
												style={{ borderRadius: '10px', width: '70%' }}
											/>
										)}
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
									</div>
									<div className='col-md-9'>
										<div className='row'>
											<div className='col-md-4 fv-row mb-2'>
												<InputField
													placeholder='Placement Title'
													type='text'
													className='col-12 fv-row mb-7'
													name='title'
													label='Placement Title'
													htmlFor='title'
													value={foodAddData?.title}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-2'>
												<InputField
													placeholder='Contact Person name'
													type='text'
													className='col-12 fv-row mb-7'
													name='contact_person'
													label='Contact Person name'
													htmlFor='contact_person'
													value={foodAddData?.contact_person}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-2'>
												<InputField
													placeholder='Mobile'
													type='number'
													className='col-12 fv-row mb-7'
													name='contact_mobile'
													label='Mobile'
													htmlFor='contact_mobile'
													value={foodAddData?.contact_mobile}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-2'>
												<InputField
													placeholder='Email'
													type='text'
													className='col-12 fv-row mb-7'
													name='contact_email'
													label='Email'
													htmlFor='contact_email'
													value={foodAddData?.contact_email}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-2'>
												<InputField
													placeholder='Company Name'
													type='text'
													className='col-12 fv-row mb-7'
													name='company_name'
													label='Company Name'
													htmlFor='company_name'
													value={foodAddData?.company_name}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-2'>
												<InputField
													placeholder='Vacancies'
													type='number'
													className='col-12 fv-row mb-7'
													name='vacancies'
													label='Vacancies'
													htmlFor='vacancies'
													value={`${foodAddData?.vacancies}`}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-2'>
												<InputField
													placeholder='Website'
													type='text'
													className='col-12 fv-row mb-7'
													name='website'
													label='Website'
													htmlFor='website'
													value={foodAddData?.website}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-2'>
												<InputField
													placeholder='Start Date'
													type='date'
													className='col-12 fv-row mb-7'
													name='start_date'
													label='Start Date'
													htmlFor='start_date'
													value={foodAddData?.start_date}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-2'>
												<InputField
													placeholder='End Date'
													type='date'
													className='col-12 fv-row mb-7'
													name='end_date'
													label='End Date'
													htmlFor='end_date'
													value={foodAddData?.end_date}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<label
													htmlFor='country'
													className='fw-bold fs-6 mb-5'>
													Country
												</label>
												<select
													name='country'
													value={foodAddData?.country}
													onChange={handleInputChange}
													className='form-select inputfield-bg'>
													<option value=''>Select Country</option>
													{countries.map((country, index) => (
														<option
															key={index}
															value={country}>
															{country}
														</option>
													))}
												</select>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<label
													htmlFor='state'
													className='fw-bold fs-6 mb-5'>
													State
												</label>
												<select
													name='state'
													value={foodAddData?.state}
													onChange={handleInputChange}
													className='form-select inputfield-bg'
													disabled={states.length === 0}>
													<option value=''>Select State</option>
													{states.map((state, index) => (
														<option
															key={index}
															value={state}>
															{state}
														</option>
													))}
												</select>
											</div>
											<div className='col-md-4 fv-row mb-7'>
												<label
													htmlFor='city'
													className='fw-bold fs-6 mb-5'>
													City
												</label>
												<select
													name='city'
													value={foodAddData?.city}
													onChange={handleInputChange}
													className='form-select inputfield-bg'
													disabled={cities.length === 0}>
													<option value=''>Select City</option>
													{cities.map((city, index) => (
														<option
															key={index}
															value={city}>
															{city}
														</option>
													))}
												</select>
											</div>
											<div className='col-md-6 fv-row mb-2'>
												<InputField
													placeholder='Address'
													type='text'
													className='col-12 fv-row mb-7'
													name='address'
													label='Address'
													htmlFor='address'
													value={foodAddData?.address}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-6 fv-row mb-2'>
												<InputField
													placeholder='Google Map Link'
													type='text'
													className='col-12 fv-row mb-7'
													name='google_map_link'
													label='Google Map Link'
													htmlFor='google_map_link'
													value={foodAddData?.google_map_link}
													onChange={handleInputChange}
												/>
											</div>
											<div className='col-md-6 fv-row mb-2'>
												<label
													className='required fw-bold fs-6 mb-5'
													htmlFor='Select'>
													Courses
												</label>
												<MultiSelect
													options={courseData}
													value={foodAddData?.related_course}
													onChange={handleMultiSelectChange}
													labelledBy='Select'
													className='fv-row'
												/>
											</div>
											<div className='col-md-6 fv-row mb-2'>
												<label
													htmlFor='category'
													className='required fw-bold fs-6 mb-5'>
													Category
												</label>
												<select
													name='category'
													id='category'
													value={foodAddData?.category}
													onChange={handleInputChange}
													className='form-select inputfield-bg col-12 fv-row mb-7'>
													<option value=''>Select Category</option>
													<option value='hospital'>Hospital</option>
													<option value='physio_center'>Physio Center</option>
													<option value='gym'>Gym</option>
													<option value='fitness_center'>Fitness Center</option>
													<option value='freelancer'>Freelancer</option>
												</select>
											</div>
											<div className='col-md-12 fv-row mt-4 mb-2 d-flex justify-content-end'>
												<TableButton
													action='edit'
													onClick={handleUpdateButtonClick}
													text={isSubmitting ? 'Please wait, Update...' : 'Update'}
													showIcon={false}
													disabled={isSubmitting}
													backgroundDark={true}
													className={`mb-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
												/>
												<div
													data-bs-toggle='modal'
													data-bs-target='#kt_modal_exercise'>
													<TableButton
														action='remove'
														text='Remove user'
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

				<KTCard>
					<h2 className='fw-bold text-dark fs-1 ms-9 mt-5 mb-2 '>CV Submissions Details</h2>
					<div className='d-flex justify-content-between mx-6 me-9'>
						<div className='d-flex pt-1 mx-2 m-5'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<div className='mt-1'>
								<LengthMenu
									expenseData={paginatedLeadData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
						</div>
					</div>
					<div className='py-4 card-body'>
						<div className='table-responsive'>
							<Table
								data={paginatedLeadData}
								columns={sortableFields}
								sort={sort}
								sortOrder={sortOrder}
								visibleDetails={visibleDetails}
								onSortChange={handleSortChange}
								pagination={pagination}
								setPagination={setPagination}
								loading={loading}
								renderRow={(submission: any, index: number, actualIndex: number) => (
									<tr onClick={() => handleRowClick(submission._id)}>
										<td>
											<span className='text-dark ms-6 fw-bold mb-1 fs-6'>{actualIndex}</span>
										</td>

										<td>
											<span className='text-dark fw-bold mb-1 fs-6'>{submission?.user}</span>
										</td>

										<td>
											<span className='text-dark fw-bold mb-1 fs-6'>
												{submission?.userData?.first_name} {submission?.userData?.last_name}
											</span>
										</td>

										<td>
											<span className='text-dark fw-bold mb-1 fs-6'>
												{submission?.userData?.country_code} {submission?.userData?.mobile}
											</span>
										</td>

										<td>
											<span className='text-dark fw-bold mb-1 fs-6'>{submission?.userData?.email}</span>
										</td>

										<td>
											<span className='text-dark fw-bold mb-1 fs-6'>
												{DayJS(submission?.date).format('DD/MM/YYYY hh:mm A')}
											</span>
										</td>
										<td>
											{submission.isDeleted ? (
												<>
													<button
														className='btn btn-light-primary btn-sm me-2'
														onClick={() => {
															const userCVs = (
																foodAddData.cv_submissions?.filter(
																	(cv: any) => cv.user === submission.user
																) as any[]
															).sort(
																(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
															)
															const cvSubmission = userCVs?.[0]
															if (cvSubmission?.cv_file) {
																window.open(cvSubmission.cv_file, '_blank')
															}
														}}>
														<FontAwesomeIcon icon={faFile} />
													</button>
													<button
														className='btn btn-light-info btn-sm'
														onClick={() => {
															setCurrentViewClick(submission)
															setShowViewModal(true)
														}}>
														<FontAwesomeIcon icon={faEye} />
													</button>
												</>
											) : (
												<>
													<button
														className='btn btn-light-primary btn-sm me-2'
														onClick={() => {
															const userCVs = (
																foodAddData.cv_submissions?.filter(
																	(cv: any) => cv.user === submission.user
																) as any[]
															).sort(
																(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
															)
															const cvSubmission = userCVs?.[0]
															if (cvSubmission?.cv_file) {
																window.open(cvSubmission.cv_file, '_blank')
															}
														}}>
														<FontAwesomeIcon icon={faFile} />
													</button>
													<button
														className='btn btn-light-danger btn-sm'
														onClick={() => {
															setCurrentClick(submission)
															setShowUpdateModal(true)
														}}>
														<FontAwesomeIcon icon={faTrash} />
													</button>
												</>
											)}
										</td>
									</tr>
								)}
							/>
						</div>

						{cvSubmissionData.length === 0 && !loading && (
							<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
								<b>No records found</b>
							</div>
						)}
						{filteredCvSubmissionData.length > 0 && (
							<UsersListPagination
								totalPages={Math.ceil(filteredCvSubmissionData.length / pagination.itemsPerPage)}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				</KTCard>

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
									onClick={() => deleteLecture()}
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
				<Modal
					centered
					show={showUpdateModal}
					onHide={() => {
						setShowUpdateModal(false)
						setCurrentClick(null)
						setRemoveStatus('')
						setRemoveReason('')
					}}
					id='edit'>
					<div className='modal-content'>
						<div className='modal-header justify-content-between'>
							<h2 className='fw-bolder'>Confirm CV Submission Removal</h2>
							<button
								onClick={() => setShowUpdateModal(false)}
								className='btn btn-sm btn-icon btn-active-color-primary'>
								<FontAwesomeIcon
									className='fs-1 position-absolute ms-3'
									icon={faXmark}
								/>
							</button>
						</div>

						<div className='modal-body scroll-y'>
							<div className='row'>
								<div className='col-12 mb-5'>
									<label className='fw-bold fs-6 mb-2'>Reason</label>
									<select
										name='remove_status'
										value={removeStatus}
										onChange={(e) => setRemoveStatus(e.target.value)}
										className='form-select inputfield-bg'>
										<option value=''>Select</option>
										<option value='not_interested'>Not Interested</option>
										<option value='interested'>Interested</option>
										<option value='got_job_at_another_place'>Got Job at Another Place</option>
									</select>
								</div>
								<div className='col-12'>
									<label className='fw-bold fs-6 mb-2'>Reason</label>
									<textarea
										name='remove_reason'
										value={removeReason}
										onChange={(e) => setRemoveReason(e.target.value)}
										className='form-control inputfield-bg'
										placeholder='Enter reason here...'
										style={{ minHeight: '150px', resize: 'vertical' }}
									/>
								</div>
							</div>
						</div>

						<div className='modal-footer justify-content-end'>
							<TableButton
								action='remove'
								text='Remove'
								backgroundDark={true}
								onClick={async () => {
									if (!currentClick || !removeStatus) return
									try {
										await RemoveJobPostClick({
											post_id: post_id,
											cv_id: currentClick._id,
											deleted_reason: removeStatus,
											deleted_description: removeReason,
										})
										toast.success('Click removed successfully')
										setShowUpdateModal(false)
										setCurrentClick(null)
										setRemoveStatus('')
										setRemoveReason('')
										fetchUserData() // refetch data
									} catch (error: any) {
										toast.error(error.message || 'Failed to remove click')
									}
								}}
							/>
						</div>
					</div>
				</Modal>
				<Modal
					centered
					show={showViewModal}
					onHide={() => {
						setShowViewModal(false)
						setCurrentViewClick(null)
					}}
					id='view'
					size='lg'>
					<div className='modal-content'>
						<div className='modal-header bg-light-primary text-white'>
							<h2 className='fw-bolder mb-0'>CV Submission Details</h2>
							<button
								onClick={() => setShowViewModal(false)}
								className='btn-close btn-close-dark'
								aria-label='Close'></button>
						</div>

						<div className='modal-body'>
							{currentViewClick && (
								<div className='container-fluid'>
									<div className='row'>
										<div className='col-12'>
											<h5 className='text-primary mb-3'>
												<i className='bi bi-person-circle me-2'></i>
												User Information
											</h5>
											<div className='row mb-3'>
												<div className='col-md-6'>
													<strong>User ID:</strong> {currentViewClick.user}
												</div>
												<div className='col-md-6'>
													<strong>Name:</strong> {currentViewClick.userData?.first_name}{' '}
													{currentViewClick.userData?.last_name}
												</div>
											</div>
											<div className='row mb-3'>
												<div className='col-md-6'>
													<strong>Email:</strong> {currentViewClick.userData?.email}
												</div>
												<div className='col-md-6'>
													<strong>Mobile:</strong> {currentViewClick.userData?.country_code}{' '}
													{currentViewClick.userData?.mobile}
												</div>
											</div>
										</div>
									</div>
									<hr />
									<div className='row'>
										<div className='col-12'>
											<h5 className='text-success mb-3'>
												<i className='bi bi-clock-history me-2'></i>
												Submission Information
											</h5>
											<div className='row mb-3'>
												<div className='col-md-6'>
													<strong>Submission Date:</strong>{' '}
													{DayJS(currentViewClick.date).format('DD/MM/YYYY hh:mm A')}
												</div>
												<div className='col-md-6'>
													<strong>CV File:</strong>{' '}
													{currentViewClick.cv_file ? (
														<a href={currentViewClick.cv_file} target='_blank' rel='noopener noreferrer'>
															View CV
														</a>
													) : (
														'N/A'
													)}
												</div>
											</div>
										</div>
									</div>
									<hr />
									<div className='row'>
										<div className='col-12'>
											<h5 className='text-danger mb-3'>
												<i className='bi bi-exclamation-triangle me-2'></i>
												Deletion Information
											</h5>
											<div className='row mb-3'>
												<div className='col-md-6'>
													<strong>Deleted Reason:</strong> {currentViewClick.deleted_reason}
												</div>
												<div className='col-md-6'>
													<strong>Deleted At:</strong>{' '}
													{currentViewClick.deleted_at
														? DayJS(currentViewClick.deleted_at).format('DD/MM/YYYY hh:mm A')
														: 'N/A'}
												</div>
											</div>
											<div className='row'>
												<div className='col-12'>
													<strong>Description:</strong>
													<p className='mt-2 text-muted'>{currentViewClick.deleted_description}</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</Modal>
			</>
		</>
	)
}
export { JobPlacementView }
