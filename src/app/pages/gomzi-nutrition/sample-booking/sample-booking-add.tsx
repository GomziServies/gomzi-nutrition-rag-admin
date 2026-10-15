import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { AddGnSampleBooking } from '../../../Functions/FGGroup'
import './sample-booking.css'

const SampleBookingAdd = () => {
	const navigate = useNavigate()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		customer_name: '',
		mobile: '',
		address: '',
		city: '',
		state: '',
		country: '',
		pincode: '',
		order_id: '',
		courier: '',
		awb: '',
		tracking_id: '',
		tracking_link: '',
	})

	const [createdId, setCreatedId] = useState('')

	let sampleUpdateLink = ''
	if (window.location.hostname === 'localhost') {
		sampleUpdateLink = `http://localhost:3001/rag/sample-booking-update?id=${
			createdId ? createdId : 'SAMPLE_ID'
		}`
	} else {
		sampleUpdateLink = `https://www.gomzilifesciences.in/rag/sample-booking-update?id=${
			createdId ? createdId : 'SAMPLE_ID'
		}`
	}

	const [countries, setCountries] = useState<any[]>([])
	const [states, setStates] = useState<any[]>([])
	const [cities, setCities] = useState<any[]>([])
	const [loadingCountries, setLoadingCountries] = useState(false)
	const [loadingStates, setLoadingStates] = useState(false)
	const [loadingCities, setLoadingCities] = useState(false)

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
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ country: countryName }),
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
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ country: countryName, state: stateName }),
			})
			const data = await response.json()
			if (data && data.data) {
				setCities(data.data.map((city: string) => ({ name: city })))
			}
		} catch (error) {
			console.error('Error fetching cities:', error)
			toast.error('Failed to load cities')
		} finally {
			setLoadingCities(false)
		}
	}

	const fetchDetailsByPincode = async (pincode: string) => {
		try {
			const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
			const data = await response.json()
			if (data && data[0] && data[0].Status === 'Success') {
				const postOffice = data[0].PostOffice[0]
				const stateName = postOffice.State
				const cityName = postOffice.District

				// Update form data
				setFormData((prev) => ({
					...prev,
					country: 'India',
					state: stateName,
					city: cityName,
				}))

				// Synchronize dropdowns
				await fetchStates('India')
				setCities([{ name: cityName }])

				toast.success(`Address found for ${pincode}`)
			}
		} catch (error) {
			console.error('Pincode fetch error:', error)
		}
	}

	useEffect(() => {
		fetchCountries()
	}, [])

	const handleInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value } = event.target

		if (name === 'country') {
			setFormData((prev) => ({ ...prev, country: value, state: '', city: '' }))
			fetchStates(value)
			return
		}

		if (name === 'state') {
			setFormData((prev) => ({ ...prev, state: value, city: '' }))
			fetchCities(formData.country, value)
			return
		}

		if (name === 'pincode') {
			setFormData((prev) => ({ ...prev, [name]: value }))
			if (value.length === 6) {
				fetchDetailsByPincode(value)
			}
			return
		}

		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const [products, setProducts] = useState([{ product_name: '' }])

	const handleProductChange = (index: number, value: string) => {
		const updated = [...products]
		updated[index].product_name = value
		setProducts(updated)
	}

	const addProduct = () => {
		setProducts([...products, { product_name: '' }])
	}

	const removeProduct = (index: number) => {
		const updated = products.filter((_, i) => i !== index)
		setProducts(updated.length ? updated : [{ product_name: '' }])
	}

	const handleAddButtonClick = async () => {
		if (!formData.customer_name || !formData.mobile) {
			toast.error('Please fill mandatory fields')
			return
		}

		try {
			setIsSubmitting(true)

			const payload = {
				customer_name: formData.customer_name,
				mobile: formData.mobile,
				address: {
					address_line_1: formData.address,
					city: formData.city,
					state: formData.state,
					pin_code: Number(formData.pincode),
					country: formData.country,
				},
				order_id: formData.order_id,
				courier_name: formData.courier,
				awb: formData.awb,
				tracking_id: formData.tracking_id,
				tracking_link: formData.tracking_link,
				products: products,
			}

			const response: any = await AddGnSampleBooking(payload)

			if (response.status === 200) {
				toast.success('Sample Booking Added Successfully')
				setCreatedId(response.data?._id || '')
				// Reset form
				setFormData({
					customer_name: '',
					mobile: '',
					address: '',
					city: '',
					state: '',
					country: '',
					pincode: '',
					order_id: '',
					courier: 'Delhivery',
					awb: '',
					tracking_id: '',
					tracking_link: '',
				})
				setProducts([{ product_name: '' }])
				setStates([])
				setCities([])
				navigate('/rag/sample-booking')
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to add sample booking')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Sample Booking</PageTitle>
			<div className='card mt-3'>
				<div className='card-body py-10'>
					<div className='row'>
						<div className='col-md-12 mb-5'>
							<h3 className='fw-bold mb-0'>Client Information</h3>
						</div>
						<div className='col-md-6 mb-7'>
							<InputField
								label='Customer Name'
								name='customer_name'
								value={formData.customer_name}
								onChange={handleInputChange}
								placeholder='Enter Customer Name'
								type='text'
								htmlFor='customer_name'
							/>
						</div>
						<div className='col-md-6 mb-7'>
							<InputField
								label='Mobile Number'
								name='mobile'
								value={formData.mobile}
								onChange={handleInputChange}
								placeholder='Enter Mobile Number'
								type='text'
								htmlFor='mobile'
							/>
						</div>
						<div className='col-md-12 mb-7'>
							<h4 className='fw-bold mb-5'>Address:</h4>
							<div className='row py-5 pb-0'>
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
								<InputField
									className='col-md-8 fv-row mb-7'
									label='Address'
									placeholder='Enter Full Address'
									type='text'
									name='address'
									htmlFor='address'
									value={formData.address}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-4 fv-row mb-7'
									label='Pincode'
									placeholder='Enter Pincode'
									type='text'
									name='pincode'
									htmlFor='pincode'
									value={formData.pincode}
									onChange={handleInputChange}
								/>
							</div>
						</div>
						<div className='border-bottom w-100 my-5'></div>
						<div className='col-md-12 mb-5'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<h3 className='fw-bold mb-0'>Order Information</h3>
								<button
									type='button'
									className='btn btn-sm btn-primary'
									onClick={addProduct}>
									+ Add Product
								</button>
							</div>
							<div className='row'>
								{products.map((product, index) => (
									<div
										key={index}
										className={`${products.length === 1 ? 'col-md-12' : 'col-md-6'} mb-7`}>
										<div className='d-flex align-items-end gap-3'>
											<div className='flex-grow-1'>
												<InputField
													label={index === 0 || index === 1 ? 'Product Name' : ''}
													name={`product_name_${index}`}
													value={product.product_name}
													onChange={(e) => handleProductChange(index, e.target.value)}
													placeholder='e.g., Whey Protein'
													type='text'
													htmlFor={`product_name_${index}`}
													marginRemove
												/>
											</div>
											<div className='d-flex gap-2'>
												{products.length > 1 && (
													<button
														type='button'
														className='btn btn-light-danger d-grid p-0'
														style={{ height: '40px', width: '40px', placeItems: 'center' }}
														onClick={() => removeProduct(index)}>
														<i
															className='bi bi-trash fs-3 m-0 p-0'
															style={{ lineHeight: '1' }}></i>
													</button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
						<div className='col-md-6 mb-7'>
							<InputField
								label='AWB Number'
								name='awb'
								value={formData.awb}
								onChange={handleInputChange}
								placeholder='Enter AWB Number'
								type='text'
								htmlFor='awb'
							/>
						</div>
						<div className='col-md-6 mb-7'>
							<InputField
								label='Client Order ID'
								name='order_id'
								value={formData.order_id}
								onChange={handleInputChange}
								placeholder='e.g., Whey Protein'
								type='text'
								htmlFor='order_id'
							/>
						</div>

						<div className='col-md-6 mb-7'>
							<InputField
								label='Tracking ID'
								name='tracking_id'
								value={formData.tracking_id}
								onChange={handleInputChange}
								placeholder='Enter Tracking ID'
								type='text'
								htmlFor='tracking_id'
							/>
						</div>
						<div className='col-md-6 mb-7'>
							<InputField
								label='Courier Tracking Link'
								name='tracking_link'
								value={formData.tracking_link}
								onChange={handleInputChange}
								placeholder='Enter Tracking Link'
								type='text'
								htmlFor='tracking_link'
							/>
						</div>
						<div className='col-md-12 mb-7'>
							<InputField
								label='Courier Name'
								name='courier'
								value={formData.courier}
								onChange={handleInputChange}
								placeholder='e.g., Delhivery'
								type='text'
								htmlFor='courier'
							/>
						</div>
						<div className='col-md-12 mb-7'>
							<div className='d-flex flex-column'>
								<label className='form-label fw-bold text-dark fs-6'>Sample Update Link</label>
								<div className='input-group position-relative d-flex align-items-center'>
									<input
										type='text'
										className='form-control form-control-solid bg-light pe-12'
										value={sampleUpdateLink}
										readOnly
										style={{ backgroundColor: '#f5f8fa', color: '#7e8299', borderRadius: '8px' }}
									/>
									<button
										type='button'
										className='btn btn-icon btn-sm position-absolute end-0 me-1'
										onClick={() => {
											navigator.clipboard.writeText(sampleUpdateLink)
											toast.success('Link copied to clipboard!')
										}}
										style={{
											backgroundColor: '#e8fff3',
											color: '#50cd89',
											zIndex: 5,
											height: '30px',
											width: '30px',
											borderRadius: '6px',
										}}>
										<i className='bi bi-files fs-5 text-success'></i>
									</button>
								</div>
							</div>
						</div>
					</div>
					<div className='row justify-content-end mt-5'>
						<div className='col-md-2 mb-7'>
							<TableButton
								action='add'
								onClick={handleAddButtonClick}
								text={isSubmitting ? 'Please wait...' : 'Add Booking'}
								showIcon={false}
								disabled={isSubmitting}
								className={`w-90 btn-primary ${isSubmitting ? 'disabled' : ''}`}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default SampleBookingAdd
