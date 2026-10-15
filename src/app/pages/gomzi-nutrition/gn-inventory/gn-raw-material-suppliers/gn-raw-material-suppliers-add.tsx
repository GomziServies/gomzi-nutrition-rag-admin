import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faBuilding,
	faCheck,
	faLocationDot,
	faUpload,
} from '@fortawesome/free-solid-svg-icons'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import { CreateGnRawMaterialSupplier, FileUploadToFGGroup } from '../../../../Functions/FGGroup'

interface Country {
	id: number | string
	name: string
	iso2: string
}

interface State {
	id: number
	name: string
	country_id: number
	country_code: string
	state_code: string
}

interface City {
	id: number
	name: string
	state_id: number
	state_code: string
	country_id: number
	country_code: string
	latitude: string
	longitude: string
}

const GomziNutritionMaterialSuppliersAdd = () => {
	const navigate = useNavigate()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [countries, setCountries] = useState<Country[]>([])
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [loadingCountries, setLoadingCountries] = useState(false)
	const [loadingStates, setLoadingStates] = useState(false)
	const [loadingCities, setLoadingCities] = useState(false)
	const [displayImg, setDisplayImg] = useState<string>('')

	const [formData, setFormData] = useState({
		name: '',
		number: '',
		email: '',
		address_line_1: '',
		city: '',
		state: '',
		pin_code: '',
		country: '',
		supplier_logo: '',
		selectedFile: null as File | null,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			if (file) {
				const objectUrl = URL.createObjectURL(file)
				setDisplayImg(objectUrl)
				setFormData((prevData) => ({
					...prevData,
					selectedFile: file,
					supplier_logo: objectUrl,
				}))
			}
			return
		}

		// Handle country change - fetch states when country changes
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

		// Handle state change - fetch cities when state changes
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

	const fetchStates = async (countryCode: string) => {
		if (!countryCode) {
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
				body: JSON.stringify({ country: countryCode }),
			})
			const data = await response.json()
			if (data && data.data && data.data.states) {
				setStates(data.data.states)
			}
		} catch (error) {
			console.error('Error fetching states:', error)
			toast.error('Failed to load states')
		} finally {
			setLoadingStates(false)
		}
	}

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
				body: JSON.stringify({ country: countryName, state: stateName }),
			})
			const data = await response.json()
			if (data && data.data) {
				const citiesData = data.data.map((cityName: string, index: number) => ({
					id: index,
					name: cityName,
					state_id: 0,
					state_code: '',
					country_id: 0,
					country_code: '',
					latitude: '',
					longitude: '',
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

	useEffect(() => {
		fetchCountries()
	}, [])

	const handleAddButtonClick = async () => {
		try {
			if (
				!formData.name ||
				!formData.email ||
				!formData.number ||
				!formData.address_line_1 ||
				!formData.city ||
				!formData.state ||
				!formData.pin_code ||
				!formData.country
			) {
				toast.error('Please fill all required fields before submitting')
				return
			}
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(formData.email)) {
				toast.error('Please enter a valid email address')
				return
			}
			const phoneRegex = /^[0-9]{10}$/
			if (!phoneRegex.test(formData.number)) {
				toast.error('Phone number must be 10 digits')
				return
			}

			setIsSubmitting(true)
			let imgUrl = ''

			if (formData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([formData.selectedFile], {
					directory: 'suppliers',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Logo uploaded successfully')
			}

			const payload: any = {
				name: formData.name,
				number: formData.number,
				email: formData.email,
				address: {
					address_line_1: formData.address_line_1,
					city: formData.city,
					state: formData.state,
					pin_code: formData.pin_code,
					country: formData.country,
				},
				logo: imgUrl,
			}

			await CreateGnRawMaterialSupplier(payload)
			toast.success('Supplier Added Successfully')
			navigate('/rag/gn-inventory/raw-material-suppliers')
		} catch (error: any) {
			toast.error(error?.message || 'Failed to add supplier')
			console.error(error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleGoBack = () => {
		navigate('/rag/gn-inventory/raw-material-suppliers')
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Supplier</PageTitle>

			<KTCard className='border-0 shadow-sm' style={{ borderRadius: '12px' }}>
				{/* 1. Header with Title & Back Button */}
				<div className='card-header border-bottom py-5 px-6 px-lg-8 d-flex align-items-center justify-content-between flex-wrap gap-3'>
					<div className='d-flex align-items-center gap-3'>
						<span
							className='d-inline-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '42px',
								height: '42px',
								backgroundColor: '#EEF2F6',
								color: '#1E3A5F',
							}}>
							<FontAwesomeIcon icon={faBuilding} className='fs-3' />
						</span>
						<div>
							<h3 className='card-title fw-bolder text-gray-900 fs-3 m-0'>Add Supplier</h3>
							<span className='text-muted fs-7 mt-1 d-block'>
								Register a new raw material vendor and address details
							</span>
						</div>
					</div>

					<div>
						<button
							type='button'
							className='btn btn-light btn-active-light-primary fw-semibold d-flex align-items-center gap-2'
							onClick={handleGoBack}
							style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}>
							<FontAwesomeIcon icon={faArrowLeft} />
							Back to Suppliers
						</button>
					</div>
				</div>

				{/* 2. Body */}
				<div className='card-body px-6 px-lg-8 py-7'>
					<div className='row g-7'>
						{/* Left Column: Photo Upload Card */}
						<div className='col-12 col-lg-4 col-xl-3'>
							<div
								className='p-5 rounded-4 text-center d-flex flex-column align-items-center'
								style={{
									backgroundColor: '#F8FAFC',
									border: '1px solid #E2E8F0',
								}}>
								<span className='fw-bold text-gray-800 fs-7 mb-3 d-block align-self-start'>
									Supplier Logo
								</span>

								{/* Image Preview Box */}
								<div
									className='d-flex align-items-center justify-content-center bg-white rounded-3 shadow-sm mb-4'
									style={{
										width: '100%',
										maxWidth: '220px',
										height: '180px',
										border: '1px solid #E2E8F0',
										overflow: 'hidden',
										position: 'relative',
									}}>
									{displayImg ? (
										<img
											alt='Supplier Logo'
											src={displayImg}
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'contain',
												padding: '8px',
											}}
										/>
									) : (
										<div className='text-muted d-flex flex-column align-items-center gap-2'>
											<FontAwesomeIcon icon={faBuilding} className='fs-1 text-gray-400' />
											<span className='fs-8 text-gray-500'>No Logo Uploaded</span>
										</div>
									)}
								</div>

								{/* Upload Button */}
								<button
									type='button'
									className='btn btn-sm btn-light-primary fw-bold w-100 d-flex align-items-center justify-content-center gap-2'
									onClick={handleFileButtonClick}
									style={{
										height: '38px',
										borderRadius: '8px',
										fontSize: '13px',
									}}>
									<FontAwesomeIcon icon={faUpload} />
									Upload Photo
								</button>
								<input
									type='file'
									id='fileInput'
									accept='image/*'
									className='d-none'
									onChange={handleInputChange}
								/>
								<span className='text-muted fs-8 mt-2 d-block'>
									Supported formats: PNG, JPG, WEBP
								</span>

								{/* Vendor Metadata Badges */}
								<div
									className='w-100 mt-5 pt-4 border-top text-start'
									style={{ borderColor: '#E2E8F0' }}>
									<div className='d-flex align-items-center justify-content-between mb-2'>
										<span className='text-muted fs-8 fw-semibold'>Vendor Type:</span>
										<span className='badge badge-light-primary fs-8 fw-bold'>
											Raw Material
										</span>
									</div>
									<div className='d-flex align-items-center justify-content-between'>
										<span className='text-muted fs-8 fw-semibold'>Status:</span>
										<span className='badge badge-light-success fs-8 fw-bold'>Active</span>
									</div>
								</div>
							</div>
						</div>

						{/* Right Column: Form Fields */}
						<div className='col-12 col-lg-8 col-xl-9'>
							{/* Section 1: Company Information */}
							<div className='mb-7'>
								<div className='d-flex align-items-center gap-2 mb-4 pb-2 border-bottom'>
									<FontAwesomeIcon icon={faBuilding} className='text-primary fs-6' />
									<h4 className='fw-bolder text-gray-900 fs-5 m-0'>Company Information</h4>
								</div>

								<div className='row g-4'>
									<div className='col-12 col-md-6'>
										<InputField
											placeholder='Enter Supplier Name'
											type='text'
											name='name'
											label='Supplier Name'
											htmlFor='name'
											value={formData.name}
											onChange={handleInputChange}
											required
											labelMarginRemove
											marginRemove
										/>
									</div>

									<div className='col-12 col-md-6'>
										<InputField
											placeholder='Enter Email'
											type='email'
											name='email'
											label='Email Address'
											htmlFor='email'
											value={formData.email}
											onChange={handleInputChange}
											required
											labelMarginRemove
											marginRemove
										/>
									</div>

									<div className='col-12 col-md-6'>
										<InputField
											placeholder='Enter 10-digit Mobile Number'
											type='number'
											name='number'
											label='Mobile Number'
											htmlFor='number'
											value={formData.number}
											onChange={handleInputChange}
											required
											labelMarginRemove
											marginRemove
										/>
									</div>
								</div>
							</div>

							{/* Section 2: Address Details */}
							<div>
								<div className='d-flex align-items-center gap-2 mb-4 pb-2 border-bottom'>
									<FontAwesomeIcon icon={faLocationDot} className='text-primary fs-6' />
									<h4 className='fw-bolder text-gray-900 fs-5 m-0'>Address Details</h4>
								</div>

								<div className='row g-4'>
									<div className='col-12'>
										<InputField
											placeholder='Enter Street Address, Building, Suite'
											type='text'
											name='address_line_1'
											label='Address Line 1'
											htmlFor='address_line_1'
											value={formData.address_line_1}
											onChange={handleInputChange}
											required
											labelMarginRemove
											marginRemove
										/>
									</div>

									<div className='col-12 col-md-4'>
										<SelectField
											label='Country'
											name='country'
											value={formData.country}
											onChange={handleInputChange}
											htmlFor='country'
											options={countries.map((country) => country.name)}
											disabled={loadingCountries}
											marginRemove
										/>
									</div>

									<div className='col-12 col-md-4'>
										<SelectField
											label='State'
											name='state'
											value={formData.state}
											onChange={handleInputChange}
											htmlFor='state'
											options={states.map((state) => state.name)}
											disabled={loadingStates || !formData.country}
											marginRemove
										/>
									</div>

									<div className='col-12 col-md-4'>
										<SelectField
											label='City'
											name='city'
											value={formData.city}
											onChange={handleInputChange}
											htmlFor='city'
											options={cities.map((city) => city.name)}
											disabled={loadingCities || !formData.state}
											marginRemove
										/>
									</div>

									<div className='col-12 col-md-4'>
										<InputField
											placeholder='Enter Postal / PIN Code'
											type='text'
											name='pin_code'
											label='Pin Code'
											htmlFor='pin_code'
											value={formData.pin_code}
											onChange={handleInputChange}
											required
											labelMarginRemove
											marginRemove
										/>
									</div>
								</div>
							</div>

							{/* Section 3: Bottom Action Bar */}
							<div
								className='d-flex align-items-center justify-content-end gap-3 mt-8 pt-5 border-top'
								style={{ borderColor: '#E2E8F0' }}>
								<button
									type='button'
									className='btn btn-light fw-bold'
									onClick={handleGoBack}
									disabled={isSubmitting}
									style={{
										height: '40px',
										borderRadius: '8px',
										fontSize: '13px',
									}}>
									Cancel
								</button>

								<button
									type='button'
									className='btn fw-bold d-flex align-items-center gap-2'
									onClick={handleAddButtonClick}
									disabled={isSubmitting}
									style={{
										backgroundColor: '#0F172A',
										color: '#ffffff',
										height: '40px',
										borderRadius: '8px',
										fontSize: '13px',
									}}>
									<FontAwesomeIcon icon={faCheck} />
									{isSubmitting ? 'Adding Supplier...' : 'Add Supplier'}
								</button>
							</div>
						</div>
					</div>
				</div>
			</KTCard>
		</>
	)
}

export { GomziNutritionMaterialSuppliersAdd }
