import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { MultiSelect } from 'react-multi-select-component'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import {
	CreateJobPlacement,
	FileUploadToFGGroup,
	GetFitnessCourse,
} from '../../../Functions/FGGroup'

const JobPlacementAdd = () => {
	const [jobData, setJobData] = useState({
		title: '',
		contact_person: '',
		website: '',
		contact_email: '',
		contact_mobile: '',
		company_name: '',
		vacancies: '',
		start_date: '',
		banner_image: '',
		end_date: '',
		related_course: [],
		city: '',
		state: '',
		country: '',
		address: '',
		google_map_link: '',
		category: '',
	})
	const navigate = useNavigate()

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [countries, setCountries] = useState<string[]>([])
	const [states, setStates] = useState<string[]>([])
	const [cities, setCities] = useState<string[]>([])
	const [displayImg, setDisplayImg] = useState<string | null>(null)

	const handleInputChange = async (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]

			setJobData((prevData) => ({
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

			toast.success('User profile update successfully')
		} else {
			// Handle cascading dropdowns for address fields
			if (name === 'country') {
				// When country changes, fetch states
				fetchStates(value)
				// Reset state and city
				setJobData((prevData) => ({
					...prevData,
					country: value,
					state: '',
					city: '',
				}))
			} else if (name === 'state') {
				// When state changes, fetch cities
				fetchCities(jobData?.country, value)
				// Update state and reset city
				setJobData((prevData) => ({
					...prevData,
					state: value,
					city: '',
				}))
			} else {
				// For all other fields, update normally
				setJobData((prevData) => ({
					...prevData,
					[name]: value,
				}))
			}
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handleAddButtonClick = async () => {
		// const { error } = jobPlacementSchema.validate(jobData, { abortEarly: false })

		// if (error) {
		// 	error.details.forEach((detail) => toast.error(detail.message))
		// 	return
		// }
		try {
			setIsSubmitting(true)

			const course = jobData?.related_course.map((el: any) => {
				return el.id
			})

			const payload: any = {
				title: jobData?.title,
				contact_person: jobData?.contact_person,
				website: jobData?.website,
				email: jobData?.contact_email,
				mobile: jobData?.contact_mobile,
				company_name: jobData?.company_name,
				vacancies: parseInt(jobData?.vacancies),
				start_date: jobData?.start_date,
				end_date: jobData?.end_date,
				banner_image: displayImg,
				related_course: course,
				city: jobData?.city || '',
				state: jobData?.state || '',
				country: jobData?.country || '',
				address: jobData?.address,
				google_map_link: jobData?.google_map_link,
				category: jobData?.category,
			}

			await CreateJobPlacement(payload)

			navigate('/fgiit/job-placement')

			toast.success('Placement Created Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleMultiSelectChange = (selected: any) => {
		setJobData((prevData) => ({
			...prevData,
			related_course: selected,
		}))
	}

	const [courseData, setCourseData] = useState<any>([])

	const fetchUserData = async () => {
		try {
			const response = await GetFitnessCourse()
			let filteredData: any = response.data
			filteredData = filteredData
				.filter(
					(course: any, index: number, self: any[]) =>
						index === self.findIndex((c: any) => c.course_name === course.course_name)
				)
				.map((course: any) => ({
					value: course.course_name,
					label: `${course.course_name} - ${course.course_category}`,
					id: course._id,
				}))
			setCourseData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
	}, [])

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

	return (
		<>
			<PageTitle breadcrumbs={[]}>Job & Placement View</PageTitle>
			<>
				<div className='row'>
					<div className='col-12 mt-3'>
						<div className='card py-10'>
							<div className='card-body'>
								<div className='row justify-content-end'>
									<div className='col-md-3 text-center'>
										<img
											alt='Photos'
											src={jobData?.banner_image || '/media/logos/rag-favicon-logo.png'}
											style={{ borderRadius: '10px', width: '70%' }}
										/>
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
													value={jobData?.title}
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
													value={jobData?.contact_person}
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
													value={jobData?.contact_mobile}
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
													value={jobData?.contact_email}
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
													value={jobData?.company_name}
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
													value={`${jobData?.vacancies}`}
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
													value={jobData?.website}
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
													value={jobData?.start_date}
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
													value={jobData?.end_date}
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
													value={jobData?.country}
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
													value={jobData?.state}
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
													value={jobData?.city}
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
													value={jobData?.address}
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
													value={jobData?.google_map_link}
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
													value={jobData?.related_course}
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
													value={jobData?.category}
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
										</div>
									</div>
									<div className='col-2 fv-row mt-4 mb-2 d-flex justify-content-end'>
										<TableButton
											action='add'
											onClick={handleAddButtonClick}
											text={isSubmitting ? 'Please wait, Adding Job...' : 'Add Job'}
											showIcon={false}
											disabled={isSubmitting}
											className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		</>
	)
}
export { JobPlacementAdd }
