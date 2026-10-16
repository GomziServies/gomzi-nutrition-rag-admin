import { Copy, Link as LinkIcon, MapPin, Package, Plus, Trash2, UserRound } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import CopyButton from '../../../components/motion/CopyButton'
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

			{/* Page Heading */}
			<div className='sb-page-header'>
				<div>
					<div className='sb-breadcrumb'>
						<span>Sample Bookings</span>
						<span className='sb-breadcrumb-separator'>/</span>
						<span>Add Booking</span>
					</div>
					<h1 className='sb-page-title'>New Sample Booking</h1>
					<p className='sb-page-subtitle'>
						Create a new sample delivery and generate a customer review link.
					</p>
				</div>
			</div>

			<form onSubmit={(e) => e.preventDefault()} style={{ maxWidth: '1100px' }}>
				{/* Section 1: Client Information & Address */}
				<div className='sb-section-card'>
					<div className='sb-section-header'>
						<div className='sb-section-title-wrap'>
							<span className='sb-section-icon-badge'>
								<UserRound size={18} />
							</span>
							<div>
								<h2 className='sb-section-title'>Client Information</h2>
								<p className='sb-section-subtitle'>Enter customer contact details and delivery location</p>
							</div>
						</div>
					</div>

					<div className='row'>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Customer Name'
								name='customer_name'
								value={formData.customer_name}
								onChange={handleInputChange}
								placeholder='Enter Customer Name'
								type='text'
								htmlFor='customer_name'
								required
								labelMarginRemove
							/>
						</div>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Mobile Number'
								name='mobile'
								value={formData.mobile}
								onChange={handleInputChange}
								placeholder='Enter Mobile Number'
								type='text'
								htmlFor='mobile'
								required
								labelMarginRemove
							/>
						</div>
					</div>

					<div className='sb-subsection-divider'></div>

					<div className='sb-subsection-title'>
						<MapPin size={16} color='#172B4D' />
						<span>Delivery Address</span>
					</div>

					<div className='row'>
						<div className='col-md-4 mb-4'>
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
						<div className='col-md-4 mb-4'>
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
						<div className='col-md-4 mb-4'>
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
					</div>

					<div className='row mt-1'>
						<div className='col-md-8 mb-4'>
							<InputField
								label='Address'
								placeholder='Enter Full Address'
								type='text'
								name='address'
								htmlFor='address'
								value={formData.address}
								onChange={handleInputChange}
								labelMarginRemove
							/>
						</div>
						<div className='col-md-4 mb-4'>
							<InputField
								label='Pincode'
								placeholder='Enter Pincode'
								type='text'
								name='pincode'
								htmlFor='pincode'
								value={formData.pincode}
								onChange={handleInputChange}
								labelMarginRemove
							/>
						</div>
					</div>
				</div>

				{/* Section 2: Order Information */}
				<div className='sb-section-card'>
					<div className='sb-section-header'>
						<div className='sb-section-title-wrap'>
							<span className='sb-section-icon-badge'>
								<Package size={18} />
							</span>
							<div>
								<h2 className='sb-section-title'>Order Information</h2>
								<p className='sb-section-subtitle'>Specify sample products, AWB, and courier tracking details</p>
							</div>
						</div>
						<button
							type='button'
							className='sb-add-product-btn'
							onClick={addProduct}>
							<Plus size={15} />
							<span>Add Product</span>
						</button>
					</div>

					{/* Dynamic Product Rows */}
					<div className='mb-4'>
						<label className='sb-form-label'>Product Name(s)</label>
						{products.map((product, index) => (
							<div
								key={index}
								className='d-flex align-items-center gap-2 mb-3'>
								<div className='flex-grow-1'>
									<InputField
										showLabel={false}
										name={`product_name_${index}`}
										value={product.product_name}
										onChange={(e) => handleProductChange(index, e.target.value)}
										placeholder={index === 0 ? 'e.g., Whey Protein 500g' : `Additional Product ${index + 1}`}
										type='text'
										htmlFor={`product_name_${index}`}
										marginRemove
									/>
								</div>
								{products.length > 1 && (
									<button
										type='button'
										className='sb-remove-btn'
										title='Remove product'
										onClick={() => removeProduct(index)}>
										<Trash2 size={16} />
									</button>
								)}
							</div>
						))}
					</div>

					<div className='row'>
						<div className='col-md-6 mb-4'>
							<InputField
								label='AWB Number'
								name='awb'
								value={formData.awb}
								onChange={handleInputChange}
								placeholder='Enter AWB Number'
								type='text'
								htmlFor='awb'
								labelMarginRemove
							/>
						</div>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Client Order ID'
								name='order_id'
								value={formData.order_id}
								onChange={handleInputChange}
								placeholder='e.g., ORD-100234'
								type='text'
								htmlFor='order_id'
								labelMarginRemove
							/>
						</div>
					</div>

					<div className='row'>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Tracking ID'
								name='tracking_id'
								value={formData.tracking_id}
								onChange={handleInputChange}
								placeholder='Enter Tracking ID'
								type='text'
								htmlFor='tracking_id'
								labelMarginRemove
							/>
						</div>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Courier Tracking Link'
								name='tracking_link'
								value={formData.tracking_link}
								onChange={handleInputChange}
								placeholder='https://track.courier.com/...'
								type='text'
								htmlFor='tracking_link'
								labelMarginRemove
							/>
						</div>
					</div>

					<div className='row'>
						<div className='col-md-12 mb-2'>
							<InputField
								label='Courier Name'
								name='courier'
								value={formData.courier}
								onChange={handleInputChange}
								placeholder='e.g., Delhivery, BlueDart, DTDC'
								type='text'
								htmlFor='courier'
								labelMarginRemove
							/>
						</div>
					</div>
				</div>

				{/* Section 3: Sample Update Link & Submit */}
				<div className='sb-section-card'>
					<div className='sb-section-header'>
						<div className='sb-section-title-wrap'>
							<span className='sb-section-icon-badge'>
								<LinkIcon size={18} />
							</span>
							<div>
								<h2 className='sb-section-title'>Sample Update Link & Submission</h2>
								<p className='sb-section-subtitle'>Copy feedback link and complete sample booking</p>
							</div>
						</div>
					</div>

					<div className='sb-link-strip mb-5'>
						<label className='sb-form-label'>Customer Update / Feedback Link</label>
						<div className='d-flex align-items-center gap-2'>
							<input
								type='text'
								className='form-control form-control-solid bg-white pe-3'
								value={sampleUpdateLink}
								readOnly
								style={{
									height: '42px',
									backgroundColor: '#FFFFFF',
									color: '#556987',
									borderRadius: '10px',
									border: '1px solid #E4EAF2',
									fontSize: '13px',
								}}
							/>
							<CopyButton
								text={sampleUpdateLink}
								title='Copy Link'
								customMessage='Link copied to clipboard!'
								className='sb-link-copy-btn'
								iconSize={16}
							/>
						</div>
					</div>

					<div className='d-flex justify-content-end align-items-center pt-2'>
						<button
							type='button'
							className='sb-btn-primary'
							onClick={handleAddButtonClick}
							disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<span
										className='spinner-border spinner-border-sm me-2'
										role='status'
										aria-hidden='true'></span>
									<span>Please wait...</span>
								</>
							) : (
								<span>Add Booking</span>
							)}
						</button>
					</div>
				</div>
			</form>
		</>
	)
}

export default SampleBookingAdd
