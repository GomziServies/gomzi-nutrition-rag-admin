import { MapPin, Package, Plus, Trash2, UserRound } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { GetGnSampleBooking, UpdateGnSampleBooking } from '../../../Functions/FGGroup'
import './sample-booking.css'

const SampleBookingUpdate = () => {
	const location = useLocation()
	const navigate = useNavigate()
	const queryParams = new URLSearchParams(location.search)
	const bookingId = queryParams.get('id')

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
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

	const [products, setProducts] = useState([{ product_name: '', rating: 0, remarks: '' }])

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
		} finally {
			setLoadingCountries(false)
		}
	}

	const fetchStates = async (countryName: string) => {
		if (!countryName) return
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
		} finally {
			setLoadingStates(false)
		}
	}

	const fetchCities = async (countryName: string, stateName: string) => {
		if (!countryName || !stateName) return
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
		} finally {
			setLoadingCities(false)
		}
	}

	const fetchBookingDetails = async () => {
		if (!bookingId) return
		setIsLoading(true)
		try {
			const response: any = await GetGnSampleBooking({ id: bookingId })
			if (response.status === 200 && response.data) {
				const booking = response.data[0]
				setFormData({
					customer_name: booking.customer_name || '',
					mobile: booking.mobile || '',
					address: booking.address?.address_line_1 || '',
					city: booking.address?.city || '',
					state: booking.address?.state || '',
					country: booking.address?.country || '',
					pincode: booking.address?.pin_code?.toString() || '',
					order_id: booking.order_id || '',
					courier: booking.courier_name || 'Delhivery',
					awb: booking.awb || '',
					tracking_id: booking.tracking_id || '',
					tracking_link: booking.tracking_link || '',
				})

				if (booking.products && booking.products.length > 0) {
					setProducts(
						booking.products.map((p: any) => ({
							product_name: p.product_name || '',
							rating: p.rating || 0,
							remarks: p.remarks || '',
						}))
					)
				}

				if (booking.address?.country) {
					await fetchStates(booking.address.country)
					if (booking.address?.state) {
						await fetchCities(booking.address.country, booking.address.state)
					}
				}
			}
		} catch (error) {
			console.error('Error fetching booking details:', error)
			toast.error('Failed to load booking details')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchCountries()
		fetchBookingDetails()
	}, [bookingId])

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

		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleProductChange = (index: number, field: string, value: any) => {
		const updated = [...products]
		updated[index] = { ...updated[index], [field]: value }
		setProducts(updated)
	}

	const addProduct = () => {
		setProducts([...products, { product_name: '', rating: 0, remarks: '' }])
	}

	const removeProduct = (index: number) => {
		const updated = products.filter((_, i) => i !== index)
		setProducts(updated.length ? updated : [{ product_name: '', rating: 0, remarks: '' }])
	}

	const handleUpdateButtonClick = async () => {
		if (!formData.customer_name || !formData.mobile) {
			toast.error('Please fill mandatory fields')
			return
		}

		try {
			setIsSubmitting(true)

			const payload = {
				id: bookingId,
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

			const response: any = await UpdateGnSampleBooking(payload)

			if (response.status === 200) {
				toast.success('Sample Booking Updated Successfully')
				navigate('/rag/sample-booking')
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to update sample booking')
		} finally {
			setIsSubmitting(false)
		}
	}

	if (isLoading) {
		return (
			<div
				className='d-flex justify-content-center align-items-center'
				style={{ height: '320px' }}>
				<div
					className='spinner-border'
					style={{ color: '#172B4D', width: '2.5rem', height: '2.5rem' }}
					role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Edit Sample Booking</PageTitle>

			{/* Page Heading */}
			<div className='sb-page-header'>
				<div>
					<div className='sb-breadcrumb'>
						<span>Sample Bookings</span>
						<span className='sb-breadcrumb-separator'>/</span>
						<span>Edit Booking</span>
					</div>
					<h1 className='sb-page-title'>Edit Sample Booking</h1>
					<p className='sb-page-subtitle'>
						Update customer shipping information, products, and courier tracking details.
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
								<p className='sb-section-subtitle'>Customer contact details and delivery location</p>
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
								<p className='sb-section-subtitle'>Shipment identifiers, products, and courier tracking details</p>
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
										onChange={(e) =>
											handleProductChange(index, 'product_name', e.target.value)
										}
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
								placeholder='Enter Order ID'
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
								placeholder='Enter Tracking Link'
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

				{/* Section 3: Update Action */}
				<div className='sb-section-card'>
					<div className='d-flex justify-content-end align-items-center'>
						<button
							type='button'
							className='sb-btn-primary'
							onClick={handleUpdateButtonClick}
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
								<span>Update Booking</span>
							)}
						</button>
					</div>
				</div>
			</form>
		</>
	)
}

export default SampleBookingUpdate
