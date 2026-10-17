/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faBox,
	faPlus,
	faTrash,
	faTruck,
	faUser,
	faMapMarkerAlt,
	faCircleNotch,
	faLink,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import CopyButton from '../../../components/motion/CopyButton'
import { AddGnSampleBooking } from '../../../Functions/FGGroup'
import '../products-theme.css'
import '../orders-theme.css'
import './sample-booking.css'

const SampleBookingAdd: React.FC = () => {
	const navigate = useNavigate()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		customer_name: '',
		mobile: '',
		address: '',
		city: '',
		state: '',
		country: 'India',
		pincode: '',
		order_id: '',
		courier: 'Delhivery',
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
				await fetchCities('India', stateName)
			} else {
				toast.error('Invalid Pincode')
			}
		} catch (error) {
			console.error('Error fetching pincode details:', error)
			toast.error('Failed to fetch details for this pincode')
		}
	}

	useEffect(() => {
		fetchCountries()
		fetchStates('India')
	}, [])

	const [products, setProducts] = useState([{ product_name: '' }])

	const handleProductChange = (index: number, value: string) => {
		const updatedProducts = [...products]
		updatedProducts[index].product_name = value
		setProducts(updatedProducts)
	}

	const addProduct = () => {
		setProducts([...products, { product_name: '' }])
	}

	const removeProduct = (index: number) => {
		if (products.length === 1) {
			toast.error('At least one product is required')
			return
		}
		const updatedProducts = products.filter((_, i) => i !== index)
		setProducts(updatedProducts)
	}

	const handleInputChange = (e: any) => {
		const { name, value } = e.target

		setFormData((prev) => ({
			...prev,
			[name]: value,
		}))

		if (name === 'country') {
			fetchStates(value)
			setFormData((prev) => ({ ...prev, state: '', city: '' }))
			setCities([])
		} else if (name === 'state') {
			fetchCities(formData.country, value)
			setFormData((prev) => ({ ...prev, city: '' }))
		} else if (name === 'pincode' && value.length === 6) {
			fetchDetailsByPincode(value)
		}
	}

	const handleAddButtonClick = async () => {
		if (!formData.customer_name || !formData.mobile) {
			toast.error('Please fill mandatory fields: Customer Name and Mobile')
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
				navigate('/rag/sample-booking')
			} else {
				toast.error(response?.message || 'Failed to add sample booking')
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to add sample booking')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Add Sample Booking</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/sample-booking'>Sample Bookings</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Add Sample Booking</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Add Sample Booking</h1>
					<p className='gz-prod-subtitle'>
						Register client contact details, requested sample supplements, and dispatch tracking
					</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					<button
						type='button'
						className='gz-prod-btn-cancel'
						onClick={() => navigate('/rag/sample-booking')}>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Cancel</span>
					</button>
					<button
						type='button'
						className='gz-prod-btn-primary'
						onClick={handleAddButtonClick}
						disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<FontAwesomeIcon icon={faCircleNotch} spin />
								<span>Saving Booking...</span>
							</>
						) : (
							<>
								<FontAwesomeIcon icon={faPlus} />
								<span>Save Sample Booking</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* =========================================================================
			    STRUCTURED FORM CARDS
			    ========================================================================= */}
			<div style={{ maxWidth: '1050px' }}>
				{/* CARD 1: CLIENT INFORMATION & DELIVERY ADDRESS */}
				<div className='gz-order-card'>
					<div className='gz-order-card-header'>
						<h3 className='gz-order-card-title'>
							<FontAwesomeIcon icon={faUser} className='icon' />
							<span>Customer Details &amp; Recipient Address</span>
						</h3>
					</div>

					<div className='gz-order-card-body'>
						<div className='row g-4 mb-4'>
							<div className='col-md-6'>
								<InputField
									label='Customer Name'
									name='customer_name'
									value={formData.customer_name}
									onChange={handleInputChange}
									placeholder='Enter Customer Full Name'
									type='text'
									htmlFor='customer_name'
									required
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									label='Mobile Number'
									name='mobile'
									value={formData.mobile}
									onChange={handleInputChange}
									placeholder='Enter 10-digit Mobile Number'
									type='text'
									htmlFor='mobile'
									required
									labelMarginRemove
								/>
							</div>
						</div>

						<div className='sb-subsection-divider'></div>

						<div className='d-flex align-items-center gap-2 mb-3'>
							<FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#172B4D', fontSize: '15px' }} />
							<span style={{ fontSize: '14px', fontWeight: 700, color: '#172B4D' }}>
								Delivery Address
							</span>
						</div>

						<div className='row g-4'>
							<div className='col-md-3'>
								<InputField
									label='Pincode'
									name='pincode'
									value={formData.pincode}
									onChange={handleInputChange}
									placeholder='6-digit Pincode'
									type='number'
									htmlFor='pincode'
									labelMarginRemove
								/>
							</div>

							<div className='col-md-3'>
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

							<div className='col-md-3'>
								<SelectField
									label='State'
									name='state'
									value={formData.state}
									onChange={handleInputChange}
									htmlFor='state'
									options={states.map((state) => state.name)}
									disabled={loadingStates}
									marginRemove
								/>
							</div>

							<div className='col-md-3'>
								<SelectField
									label='City'
									name='city'
									value={formData.city}
									onChange={handleInputChange}
									htmlFor='city'
									options={cities.map((city) => city.name)}
									disabled={loadingCities}
									marginRemove
								/>
							</div>

							<div className='col-md-12'>
								<InputField
									label='Street Address / Landmark'
									name='address'
									value={formData.address}
									onChange={handleInputChange}
									placeholder='House / Flat number, building, street, area, landmark'
									type='text'
									htmlFor='address'
									labelMarginRemove
								/>
							</div>
						</div>
					</div>
				</div>

				{/* CARD 2: SAMPLE PRODUCTS */}
				<div className='gz-order-card'>
					<div className='gz-order-card-header'>
						<h3 className='gz-order-card-title'>
							<FontAwesomeIcon icon={faBox} className='icon' />
							<span>Requested Sample Products ({products.length})</span>
						</h3>
						<button
							type='button'
							className='sb-add-product-btn'
							onClick={addProduct}>
							<FontAwesomeIcon icon={faPlus} />
							<span>Add Another Product</span>
						</button>
					</div>

					<div className='gz-order-card-body'>
						<div className='d-flex flex-column gap-3'>
							{products.map((product, index) => (
								<div key={index} className='sb-product-row d-flex align-items-center gap-3'>
									<div
										style={{
											width: '32px',
											height: '32px',
											borderRadius: '8px',
											background: '#EAF1FB',
											color: '#172B4D',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontWeight: 700,
											fontSize: '12.5px',
											flexShrink: 0,
										}}>
										#{index + 1}
									</div>

									<div className='flex-grow-1'>
										<InputField
											label={`Sample Product Name #${index + 1}`}
											name={`product_name_${index}`}
											value={product.product_name}
											onChange={(e: any) => handleProductChange(index, e.target.value)}
											placeholder='e.g. Whey Protein Isolate - Chocolate 30g sachet'
											type='text'
											htmlFor={`product_name_${index}`}
											labelMarginRemove
										/>
									</div>

									{products.length > 1 && (
										<div className='align-self-end mb-1'>
											<button
												type='button'
												className='sb-remove-btn'
												onClick={() => removeProduct(index)}
												title='Remove Product'>
												<FontAwesomeIcon icon={faTrash} />
											</button>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* CARD 3: SHIPPING & DISPATCH DETAILS */}
				<div className='gz-order-card'>
					<div className='gz-order-card-header'>
						<h3 className='gz-order-card-title'>
							<FontAwesomeIcon icon={faTruck} className='icon' />
							<span>Fulfillment &amp; Courier Logistics</span>
						</h3>
					</div>

					<div className='gz-order-card-body'>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									label='Order ID'
									name='order_id'
									value={formData.order_id}
									onChange={handleInputChange}
									placeholder='e.g. ORD-2026-9871'
									type='text'
									htmlFor='order_id'
									labelMarginRemove
								/>
							</div>

							<div className='col-md-6'>
								<SelectField
									label='Courier Partner'
									name='courier'
									value={formData.courier}
									onChange={handleInputChange}
									htmlFor='courier'
									options={['Delhivery', 'Blue Dart', 'DTDC', 'India Post', 'Shiprocket', 'Other']}
									marginRemove
								/>
							</div>

							<div className='col-md-6'>
								<InputField
									label='AWB Number'
									name='awb'
									value={formData.awb}
									onChange={handleInputChange}
									placeholder='Enter AWB consignment number'
									type='text'
									htmlFor='awb'
									labelMarginRemove
								/>
							</div>

							<div className='col-md-6'>
								<InputField
									label='Tracking ID'
									name='tracking_id'
									value={formData.tracking_id}
									onChange={handleInputChange}
									placeholder='Enter tracking identifier'
									type='text'
									htmlFor='tracking_id'
									labelMarginRemove
								/>
							</div>

							<div className='col-md-12'>
								<InputField
									label='Public Tracking URL'
									name='tracking_link'
									value={formData.tracking_link}
									onChange={handleInputChange}
									placeholder='https://www.delhivery.com/track/package/...'
									type='text'
									htmlFor='tracking_link'
									labelMarginRemove
								/>
							</div>
						</div>
					</div>
				</div>

				{/* CARD 4: SAMPLE REVIEW LINK STRIP */}
				<div className='gz-order-card'>
					<div className='gz-order-card-header'>
						<h3 className='gz-order-card-title'>
							<FontAwesomeIcon icon={faLink} className='icon' />
							<span>Customer Review &amp; Feedback Link</span>
						</h3>
					</div>

					<div className='gz-order-card-body'>
						<p className='text-muted fs-7 mb-3'>
							Once created, share this direct portal link with the client to collect product ratings and reviews:
						</p>

						<div className='sb-link-strip d-flex align-items-center justify-content-between gap-3'>
							<div
								style={{
									fontFamily: 'monospace',
									fontSize: '13px',
									color: '#172B4D',
									wordBreak: 'break-all',
									fontWeight: 600,
								}}>
								{sampleUpdateLink}
							</div>
							<CopyButton
								text={sampleUpdateLink}
								title='Copy Review Link'
								customMessage='Review link copied to clipboard!'
							/>
						</div>
					</div>
				</div>

				{/* BOTTOM ACTIONS */}
				<div className='d-flex justify-content-end align-items-center gap-3 py-3 mb-6'>
					<button
						type='button'
						className='gz-prod-btn-cancel'
						onClick={() => navigate('/rag/sample-booking')}>
						Cancel
					</button>
					<button
						type='button'
						className='gz-prod-btn-primary'
						onClick={handleAddButtonClick}
						disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<FontAwesomeIcon icon={faCircleNotch} spin />
								<span>Saving Booking...</span>
							</>
						) : (
							<>
								<FontAwesomeIcon icon={faPlus} />
								<span>Save Sample Booking</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export default SampleBookingAdd
