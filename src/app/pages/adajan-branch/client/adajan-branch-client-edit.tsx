import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import {
	GetAdajanBranchClient,
	UpdateAdajanBranchClient,
} from '../../../Functions/FGGroup/AdajanBranchClient'

// Type definitions
interface Country {
	id: string
	name: string
	iso2: string
}

interface State {
	id: number
	name: string
	country_code: string
	state_code: string
}

interface City {
	id: number
	name: string
}

// Client Interface
interface Client {
	_id: string
	clientCode: string
	name: string
	phone: string
	email: string
	bloodGroup: string
	address: string
	expiryDate: string
	joiningDate: string
	image?: string
	country?: string
	state?: string
	city?: string
	pincode?: string
	workoutTime?: string
}

const TIME_SLOTS = [
	'5:00 AM - 6:00 AM',
	'6:00 AM - 7:00 AM',
	'7:00 AM - 8:00 AM',
	'8:00 AM - 9:00 AM',
	'9:00 AM - 10:00 AM',
	'10:00 AM - 11:00 AM',
	'4:00 PM - 5:00 PM',
	'5:00 PM - 6:00 PM',
	'6:00 PM - 7:00 PM',
	'7:00 PM - 8:00 PM',
	'8:00 PM - 9:00 PM',
	'9:00 PM - 10:00 PM',
	'10:00 PM - 11:00 PM',
	'11:00 PM - 12:00 AM',
]

const AdajanBranchClientEdit: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const client_id = searchParams.get('id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [displayImg, setDisplayImg] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	// Location data states
	const [countries, setCountries] = useState<Country[]>([])
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [loadingCountries, setLoadingCountries] = useState(false)
	const [loadingStates, setLoadingStates] = useState(false)
	const [loadingCities, setLoadingCities] = useState(false)

	const [formData, setFormData] = useState({
		_id: '',
		clientCode: '',
		name: '',
		phone: '',
		email: '',
		bloodGroup: '',
		address: '',
		city: '',
		state: '',
		pincode: '',
		country: '',
		workoutTime: '',
		expiryDate: '',
		joiningDate: '',
		client_image: '',
		selectedFile: null as File | null,
	})

	// Fetch Countries
	const fetchCountries = async () => {
		setLoadingCountries(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries')
			const data = await response.json()
			if (data && data.data) {
				const countriesData = data.data.map((country: any) => ({
					id: country.iso2,
					name: country.country,
					iso2: country.iso2,
				}))
				setCountries(countriesData)
			}
		} catch (error) {
			console.error('Error fetching countries:', error)
			toast.error('Failed to load countries')
		} finally {
			setLoadingCountries(false)
		}
	}

	// Fetch States
	const fetchStates = async (countryName: string) => {
		if (!countryName) {
			setStates([])
			setCities([])
			return
		}

		setLoadingStates(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ country: countryName }),
			})
			const data = await response.json()
			if (data && data.data && data.data.states) {
				const statesData = data.data.states.map((state: any, index: number) => ({
					id: index,
					name: state.name,
					country_code: countryName,
					state_code: state.state_code || '',
				}))
				setStates(statesData)
			}
		} catch (error) {
			console.error('Error fetching states:', error)
			toast.error('Failed to load states')
		} finally {
			setLoadingStates(false)
		}
	}

	// Fetch Cities
	const fetchCities = async (countryName: string, stateName: string) => {
		if (!countryName || !stateName) {
			setCities([])
			return
		}

		setLoadingCities(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					country: countryName,
					state: stateName,
				}),
			})
			const data = await response.json()
			if (data && data.data) {
				const citiesData = data.data.map((city: string, index: number) => ({
					id: index,
					name: city,
				}))
				setCities(citiesData)
			}
		} catch (error) {
			console.error('Error fetching cities:', error)
			toast.error('Failed to load cities')
		} finally {
			setLoadingCities(false)
		}
	}

	// Function to load location data for existing client
	const loadLocationDataForExistingClient = async (data: any) => {
		if (data?.client_address?.country) {
			await fetchStates(data?.client_address?.country)
			setTimeout(() => {
				if (data?.client_address?.state) {
					fetchCities(data?.client_address?.country, data?.client_address?.state)
				}
			}, 1000)
		}
	}

	// Fetch Client Data
	const fetchClientData = async () => {
		if (!client_id) {
			toast.error('Client ID is missing')
			navigate('/adajan-branch/client/list')
			return
		}

		try {
			setLoading(true)
			const response: any = await GetAdajanBranchClient({ id: client_id })
			const data = response.data[0]

			if (!data) {
				toast.error('Client not found')
				navigate('/adajan-branch/client/list')
				return
			}

			// Map the client_address object to individual fields
			const mappedData = {
				_id: data._id || '',
				clientCode: data.clientCode ? String(data.clientCode).padStart(4, '0') : '',
				name: data.name || '',
				phone: data.phone || '',
				email: data.email || '',
				bloodGroup: data.bloodGroup || '',
				address: data.client_address?.address_line_1 || '',
				city: data.client_address?.city || '',
				state: data.client_address?.state || '',
				pincode: data.client_address?.pin_code || '',
				country: data.client_address?.country || '',
				workoutTime: data.workoutTime || '',
				expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().split('T')[0] : '',
				joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : '',
				client_image: data.image || '',
				selectedFile: null,
			}

			setFormData(mappedData)

			// Load states and cities based on the existing data
			setTimeout(() => {
				loadLocationDataForExistingClient(data)
			}, 1000)

			setLoading(false)
		} catch (error: any) {
			toast.error(error.message || 'Failed to load client data')
			console.error(error)
			setLoading(false)
			navigate('/adajan-branch/client/list')
		}
	}

	// Initialize data on mount
	useEffect(() => {
		const initializeData = async () => {
			await fetchCountries()
			await fetchClientData()
		}
		initializeData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleInputChange = async (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		// Handle file input
		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]

			if (file.size > 2 * 1024 * 1024) {
				toast.error('Image size must be less than 2MB')
				return
			}

			if (!file.type.startsWith('image/')) {
				toast.error('Please select a valid image file')
				return
			}

			setIsSubmitting(true)
			const imageUrl: any = await FileUploadToFGGroup(file, { directory: 'client' })
			setFormData((prevData) => ({
				...prevData,
				selectedFile: file,
				client_image: imageUrl.data?.fileURLs[0],
			}))
			const imgUrl = imageUrl.data?.fileURLs[0]
			setDisplayImg(imgUrl)
			toast.success('Image uploaded successfully')
			setIsSubmitting(false)
			return
		}

		// Handle country change
		if (name === 'country') {
			setFormData((prev) => ({
				...prev,
				country: value,
				state: '',
				city: '',
			}))
			fetchStates(value)
			setStates([])
			setCities([])
			return
		}

		// Handle state change
		if (name === 'state') {
			setFormData((prev) => ({
				...prev,
				state: value,
				city: '',
			}))
			const selectedState = states.find((s) => s.name === value)
			if (selectedState && formData.country) {
				fetchCities(formData.country, selectedState.name)
			}
			setCities([])
			return
		}

		setFormData((prevData) => ({
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
		try {
			// Validation
			if (!formData.name || !formData.phone || !formData.email) {
				toast.error('Please fill all required fields')
				return
			}

			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(formData.email)) {
				toast.error('Please enter a valid email address')
				return
			}

			const phoneRegex = /^[0-9]{10}$/
			if (!phoneRegex.test(formData.phone)) {
				toast.error('Phone number must be 10 digits')
				return
			}

			// Date validation
			if (formData.expiryDate && formData.joiningDate) {
				const expiryDate = new Date(formData.expiryDate)
				const joiningDate = new Date(formData.joiningDate)
				if (expiryDate <= joiningDate) {
					toast.error('Expiry date must be after joining date')
					return
				}
			}

			setIsSubmitting(true)

			const payload: any = {
				id: client_id,
				clientCode: formData.clientCode,
				name: formData.name,
				phone: formData.phone,
				email: formData.email,
				bloodGroup: formData.bloodGroup || null,
				client_address: {
					address_line_1: formData.address,
					city: formData.city,
					state: formData.state,
					pin_code: formData.pincode,
					country: formData.country,
				},
				joiningDate: formData.joiningDate,
				expiryDate: formData.expiryDate,
				workoutTime: formData.workoutTime,
			}

			// Add image only if it exists
			const imageUrl = displayImg || formData.client_image
			if (imageUrl && imageUrl.trim() !== '') {
				payload.image = imageUrl
			}

			await UpdateAdajanBranchClient(payload)

			toast.success('Client Updated Successfully')
			navigate('/adajan-branch/client/list')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message || 'Failed to update client')
			setIsSubmitting(false)
		}
	}

	const handleBack = () => {
		navigate('/adajan-branch/client/list')
	}

	if (loading) {
		return (
			<>
				<PageTitle breadcrumbs={[]}>Edit Client</PageTitle>
				<div className='text-center py-10'>
					<div
						className='spinner-border'
						role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Edit Client</PageTitle>

			<div className='row'>
				<div className='col-md-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-4'>Edit Client Details</p>

							<form>
								<div className='row'>
									{/* Image left, Full Name / Email / Phone right */}
									<div className='col-12 mb-5 d-flex flex-wrap gap-4 align-items-start'>
										{/* Image Upload Section */}
										<div className='text-center p-3'>
											<img
												alt='Client Photo'
												src={
													displayImg
														? displayImg.startsWith('blob:') || displayImg.startsWith('http')
															? displayImg
															: `https://files.fggroup.in/${displayImg}`
														: formData.client_image
														? formData.client_image.startsWith('blob:') ||
														  formData.client_image.startsWith('http')
															? formData.client_image
															: `https://files.fggroup.in/${formData.client_image}`
														: '/media/logos/rag-favicon-logo.png'
												}
												style={{
													borderRadius: '12px',
													width: '200px',
													height: '200px',
													objectFit: 'cover',
													display: 'inline-block',
													boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
													border: '1px solid #eee',
												}}
											/>
											<div>
												<button
													type='button'
													className='mt-3 px-4 py-2 btn btn-success'
													onClick={handleFileButtonClick}>
													Upload Photo
												</button>
												<input
													type='file'
													id='fileInput'
													className='d-none'
													accept='image/*'
													onChange={handleInputChange}
												/>
											</div>
										</div>

										<div
											className='flex-grow-1 ms-3'
											style={{ minWidth: '260px' }}>
											<div className='row'>
												{/* Client Code & Full Name */}
												<InputField
													className='col-md-6 fv-row mb-7'
													label='Client Code'
													placeholder='Enter Client Code'
													type='text'
													name='clientCode'
													htmlFor='clientCode'
													value={formData.clientCode}
													onChange={handleInputChange}
													labelMarginRemove={true}
												/>

												<InputField
													className='col-md-6 fv-row mb-7'
													label='Full Name'
													placeholder='Enter Full Name'
													type='text'
													name='name'
													htmlFor='name'
													value={formData.name}
													onChange={handleInputChange}
													labelMarginRemove={true}
												/>
											</div>

											<div className='row'>
												<InputField
													className='col-md-6 fv-row mb-7'
													label='Phone Number'
													placeholder='Enter Phone Number'
													type='tel'
													name='phone'
													htmlFor='phone'
													value={formData.phone}
													onChange={handleInputChange}
													labelMarginRemove={true}
												/>

												<InputField
													className='col-md-6 fv-row mb-7'
													label='Email'
													placeholder='Enter Email Address'
													type='email'
													name='email'
													htmlFor='email'
													value={formData.email}
													onChange={handleInputChange}
													labelMarginRemove={true}
												/>
											</div>
										</div>
									</div>

									{/* Address Section */}
									<h3 className='col-12 mb-4 mt-3'>Address Details:</h3>

									<div className='col-12 mb-3'>
										<div className='row'>
											{/* Country, State, City in one row (3 fields) */}
											<SelectField
												className='col-md-4 fv-row mb-7'
												label='Country'
												name='country'
												value={formData.country}
												onChange={handleInputChange}
												htmlFor='country'
												options={countries.map((country) => country.name)}
												disabled={loadingCountries}
											/>

											<SelectField
												className='col-md-4 fv-row mb-7'
												label='State'
												name='state'
												value={formData.state}
												onChange={handleInputChange}
												htmlFor='state'
												options={states.map((state) => state.name)}
												disabled={loadingStates || !formData.country}
											/>

											<SelectField
												className='col-md-4 fv-row mb-7'
												label='City'
												name='city'
												value={formData.city}
												onChange={handleInputChange}
												htmlFor='city'
												options={cities.map((city) => city.name)}
												disabled={loadingCities || !formData.state}
											/>

											{/* Address - Full width */}
											<InputField
												className='col-md-8 fv-row mb-7'
												label='Address'
												placeholder='Enter Full Address'
												type='text'
												name='address'
												htmlFor='address'
												value={formData.address}
												onChange={handleInputChange}
												labelMarginRemove={true}
											/>

											{/* Pincode */}
											<InputField
												className='col-md-4 fv-row mb-7'
												label='Postal/Zip Code'
												placeholder='Enter Postal/Zip Code'
												type='text'
												name='pincode'
												htmlFor='pincode'
												value={formData.pincode}
												onChange={handleInputChange}
												labelMarginRemove={true}
											/>
										</div>
									</div>

									{/* Joining Date & Expiry Date in one row (2 fields) */}
									<div className='col-md-6 fv-row mb-md-7 mb-3'>
										<label className='fw-bold fs-6 mb-2'>Joining Date</label>
										<input
											type='date'
											name='joiningDate'
											className='form-control inputfield-bg'
											value={formData.joiningDate}
											onChange={handleInputChange}
										/>
									</div>

									<div className='col-md-6 fv-row mb-md-7 mb-3'>
										<label className='fw-bold fs-6 mb-2'>Expiry Date</label>
										<input
											type='date'
											name='expiryDate'
											className='form-control inputfield-bg'
											value={formData.expiryDate}
											onChange={handleInputChange}
											min={new Date().toISOString().split('T')[0]}
										/>
									</div>

									{/* Blood Group, In Time & Workout Time in one row (3 fields) */}
									<SelectField
										className='col-md-6 fv-row mb-7'
										label='Blood Group'
										name='bloodGroup'
										value={formData.bloodGroup}
										onChange={handleInputChange}
										htmlFor='bloodGroup'
										options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
									/>

									<SelectField
										className='col-md-6 fv-row mb-7'
										label='Workout Time'
										name='workoutTime'
										value={formData.workoutTime}
										onChange={handleInputChange}
										htmlFor='workoutTime'
										options={TIME_SLOTS}
									/>

									{/* Action Buttons */}
									<div className='col-md-12 fv-row mb-7 mt-5'>
										<div className='d-flex justify-content-end gap-3'>
											<button
												type='button'
												className='btn btn-secondary'
												onClick={handleBack}
												disabled={isSubmitting}>
												Back
											</button>
											<button
												type='button'
												className={`btn btn-primary ${isSubmitting ? 'disabled' : ''}`}
												disabled={isSubmitting}
												onClick={handleUpdateButtonClick}>
												{isSubmitting ? (
													<>
														<span
															className='spinner-border spinner-border-sm me-2'
															role='status'
															aria-hidden='true'></span>
														Please wait...
													</>
												) : (
													'Update Client'
												)}
											</button>
										</div>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default AdajanBranchClientEdit
