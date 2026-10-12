import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import CopyableInput from '../../../../components/CopyableInput'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import {
	FileUploadToFGGroup,
	GetGnRawMaterialSupplier,
	UpdateGnRawMaterialSupplier,
} from '../../../../Functions/FGGroup'

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

const GomziNutritionMaterialSupplierEdit = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const supplier_id: string | any = searchParams.get('supplier_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [displayImg, setDisplayImg] = useState<string | null>(null)
	// Add state variables for location data
	const [countries, setCountries] = useState<Country[]>([])
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [loadingCountries, setLoadingCountries] = useState(false)
	const [loadingStates, setLoadingStates] = useState(false)
	const [loadingCities, setLoadingCities] = useState(false)

	const [formData, setFormData] = useState({
		_id: '',
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

	const handleInputChange = async (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			const objectURL = URL.createObjectURL(file)

			setFormData((prevData) => ({
				...prevData,
				selectedFile: file,
				display_image: objectURL,
			}))

			const imageUrl: any = await FileUploadToFGGroup([file], {
				directory: 'suppliers',
			})
			const imgUrl = imageUrl.data?.fileURLs[0]
			setDisplayImg(imgUrl)
			toast.success('image uploaded successfully')
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
			toast.error('Failed to load cities')
		} finally {
			setLoadingCities(false)
		}
	}

	// Function to load location data for existing supplier
	const loadLocationDataForExistingSupplier = async (data: any) => {
		if (data?.address?.country) {
			await fetchStates(data?.address?.country)

			setTimeout(() => {
				if (data?.address?.state) {
					fetchCities(data?.address?.country, data?.address?.state)
				}
			}, 1000)
		}
	}

	useEffect(() => {
		const initializeData = async () => {
			await fetchCountries()
			await fetchSupplierData()
		}
		initializeData()
	}, [])

	const fetchSupplierData = async () => {
		try {
			const response: any = await GetGnRawMaterialSupplier({ id: supplier_id })
			const data = response.data[0]

			// Map the address object to individual fields
			const mappedData = {
				...data,
				address_line_1: data?.address?.address_line_1 || '',
				city: data?.address?.city || '',
				state: data?.address?.state || '',
				pin_code: data?.address?.pin_code || '',
				country: data?.address?.country || '',
				supplier_logo: data?.logo || '',
			}

			setFormData(mappedData)

			// Load states and cities based on the existing data
			setTimeout(() => {
				loadLocationDataForExistingSupplier(data)
			}, 1000)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleUpdateButtonClick = async () => {
		try {
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

			const payload: any = {
				id: supplier_id,
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
				logo: displayImg || formData.supplier_logo,
			}
			await UpdateGnRawMaterialSupplier(payload)

			toast.success('Supplier Updated Successfully')
			navigate('/rag/inventory/suppliers/list')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
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
									{displayImg ? (
										<img
											alt='supplier'
											src={`https://files.fggroup.in/${displayImg || '/media/avatars/300-1.jpg'}`}
											style={{ borderRadius: '10px', width: '70%' }}
										/>
									) : (
										<img
											alt='supplier'
											src={`https://files.fggroup.in/${
												formData.supplier_logo || '/media/avatars/300-1.jpg'
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
										<div className='col-md-6 fv-row mb-7'>
											<CopyableInput
												value={formData._id}
												label={'Supplier ID'}
												className='col-12 fv-row mb-7'
												htmlFor={'_id'}
												placeholder='Enter Supplier ID'
												type='text'
												name='_id'
												onChange={handleInputChange}
												disabled={true}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
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
										<div className='col-md-6 fv-row mb-7'>
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
										<div className='col-md-6 fv-row mb-7'>
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
												placeholder='Enter Address Line 1'
												type='text'
												className='fv-row'
												name='address_line_1'
												label='Address Line 1'
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
										<div className='col-md-12 fv-row text-end mb-7'>
											<TableButton
												action='edit'
												onClick={handleUpdateButtonClick}
												text={
													isSubmitting
														? 'Please wait, Updating Supplier Details...'
														: 'Update Supplier Details'
												}
												showIcon={false}
												disabled={isSubmitting}
												backgroundDark={true}
												className={`mb-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
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

export { GomziNutritionMaterialSupplierEdit }
