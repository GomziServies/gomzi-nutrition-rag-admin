import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import { CreateGnRawMaterialSupplier, FileUploadToFGGroup } from '../../../../Functions/FGGroup'

// Add interfaces for location data
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
	const [isSubmitting, setIsSubmitting] = useState(false)
	// Add state variables for location data
	const [countries, setCountries] = useState<Country[]>([])
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [loadingCountries, setLoadingCountries] = useState(false)
	const [loadingStates, setLoadingStates] = useState(false)
	const [loadingCities, setLoadingCities] = useState(false)

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
			setFormData((prevData) => ({
				...prevData,
				selectedFile: file,
				supplier_logo: URL.createObjectURL(file),
			}))
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

	// Add API functions for fetching location data
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
				const statesData = data.data.states.map((state: any, index: number) => ({
					id: index,
					name: state.name,
					country_id: 0,
					country_code: countryCode,
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

	const fetchCities = async (countryCode: string, stateName: string) => {
		if (!countryCode || !stateName) {
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
					country: countryCode,
					state: stateName,
				}),
			})
			const data = await response.json()
			if (data && data.data) {
				const citiesData = data.data.map((city: string, index: number) => ({
					id: index,
					name: city,
					state_id: 0,
					state_code: '',
					country_id: 0,
					country_code: countryCode,
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

	// Load countries on component mount
	useEffect(() => {
		fetchCountries()
	}, [])

	const handleAddButtonClick = async () => {
		try {
			// Basic required field validation
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
				toast.success('image uploaded successfully')
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

			toast.success('Supplier Add Successfully')

			setFormData({
				name: '',
				number: '',
				email: '',
				address_line_1: '',
				city: '',
				state: '',
				pin_code: '',
				country: '',
				supplier_logo: '',
				selectedFile: null,
			})
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Supplier Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-3 text-center'>
									<img
										alt='Photos'
										src={formData.supplier_logo || '/media/logos/rag-favicon-logo.png'}
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
									<div className='row justify-content-end'>
										<div className='col-12'>
											<div className='row'>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Enter Supplier Name'
														type='text'
														className='fv-row'
														name='name'
														label='Supplier Name'
														htmlFor='name'
														value={formData.name}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Enter Email'
														type='email'
														className='fv-row'
														name='email'
														label='Email'
														htmlFor='email'
														value={formData.email}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Enter Mobile Number'
														type='number'
														className='fv-row'
														name='number'
														label='Mobile Number'
														htmlFor='number'
														value={formData.number}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-12 fv-row mb-7'>
													<InputField
														placeholder='Enter Address'
														type='text'
														className='fv-row'
														name='address_line_1'
														label='Address'
														htmlFor='address_line_1'
														value={formData.address_line_1}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<SelectField
														className='fv-row'
														label='Country'
														name='country'
														value={formData.country}
														onChange={handleInputChange}
														htmlFor='country'
														options={countries.map((country) => country.name)}
														disabled={loadingCountries}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<SelectField
														className='fv-row'
														label='State'
														name='state'
														value={formData.state}
														onChange={handleInputChange}
														htmlFor='state'
														options={states.map((state) => state.name)}
														disabled={loadingStates || !formData.country}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<SelectField
														className='fv-row'
														label='City'
														name='city'
														value={formData.city}
														onChange={handleInputChange}
														htmlFor='city'
														options={cities.map((city) => city.name)}
														disabled={loadingCities || !formData.state}
													/>
												</div>
												<div className='col-md-12 fv-row mb-7'>
													<InputField
														placeholder='Enter Pin Code'
														type='text'
														className='fv-row'
														name='pin_code'
														label='Pin Code'
														htmlFor='pin_code'
														value={formData.pin_code}
														onChange={handleInputChange}
													/>
												</div>
											</div>
										</div>
										<div className='col-md-2 fv-row mb-7'>
											<TableButton
												action='add'
												onClick={handleAddButtonClick}
												text={isSubmitting ? 'Please wait, Adding Supplier...' : 'Add Supplier'}
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
				</div>
			</div>
		</>
	)
}

export { GomziNutritionMaterialSuppliersAdd }
