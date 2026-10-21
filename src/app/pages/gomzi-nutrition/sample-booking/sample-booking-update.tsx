/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faBox,
	faEye,
	faMapMarkerAlt,
	faPaperPlane,
	faPlus,
	faStar,
	faTrashAlt,
	faTruck,
	faUser,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import CopyButton from '../../../components/motion/CopyButton'
import { GetGnSampleBooking, UpdateGnSampleBooking } from '../../../Functions/FGGroup'
import '../products-theme.css'
import '../orders-theme.css'
import './sample-booking.css'

const COURIER_OPTIONS = [
	'Delhivery',
	'Blue Dart',
	'DTDC',
	'India Post',
	'Shiprocket',
	'Trackon',
	'Other',
]

const SampleBookingUpdate: React.FC = () => {
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
		country: 'India',
		pincode: '',
		order_id: '',
		courier: 'Delhivery',
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
					country: booking.address?.country || 'India',
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
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
			setFormData((prev) => ({ ...prev, pincode: value }))
			if (value.length === 6) {
				fetch(`https://api.postalpincode.in/pincode/${value}`)
					.then((res) => res.json())
					.then((data) => {
						if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
							const postOffice = data[0].PostOffice[0]
							setFormData((prev) => ({
								...prev,
								city: postOffice.District || postOffice.Division || prev.city,
								state: postOffice.State || prev.state,
								country: 'India',
							}))
							toast.success(`Location detected: ${postOffice.District}, ${postOffice.State}`)
						}
					})
					.catch((err) => console.error('Error fetching pincode details:', err))
			}
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
			toast.error('Please fill mandatory fields: Customer Name and Mobile Number')
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

	let sampleUpdateLink = ''
	if (typeof window !== 'undefined' && bookingId) {
		if (window.location.hostname === 'localhost') {
			sampleUpdateLink = `http://localhost:3001/rag/sample-booking-update?id=${bookingId}`
		} else {
			sampleUpdateLink = `https://www.gomzilifesciences.in/rag/sample-booking-update?id=${bookingId}`
		}
	}

	if (isLoading) {
		return (
			<div className='gz-prod-container'>
				<div
					className='d-flex justify-content-center align-items-center'
					style={{ minHeight: '380px' }}>
					<div
						className='spinner-border'
						style={{ color: '#172B4D', width: '2.5rem', height: '2.5rem' }}
						role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Edit Sample Booking</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/sample-booking'>Sample Bookings</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Edit Booking</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Edit Sample Booking</h1>
					<p className='gz-prod-subtitle'>
						Update customer shipping details, requested sample items, courier tracking, and ratings.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link
						to='/rag/sample-booking'
						className='gz-prod-btn-cancel'
						title='Back to Bookings'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Bookings</span>
					</Link>
					{bookingId && (
						<Link
							to={`/rag/sample-booking-view?id=${bookingId}`}
							className='gz-prod-btn-cancel'
							title='View Details'>
							<FontAwesomeIcon icon={faEye} />
							<span>View Details</span>
						</Link>
					)}
				</div>
			</div>

			{/* =========================================================================
			    FORM CONTENT
			    ========================================================================= */}
			<form onSubmit={(e) => e.preventDefault()}>
				{/* SECTION 1: CLIENT INFORMATION & DELIVERY ADDRESS */}
				<div className='gz-order-card'>
					<div className='gz-order-card-header'>
						<h3 className='gz-order-card-title'>
							<FontAwesomeIcon icon={faUser} className='icon' />
							<span>Client Information & Delivery Address</span>
						</h3>
						<span className='fs-8 fw-semibold text-muted'>* Mandatory fields</span>
					</div>
					<div className='gz-order-card-body'>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									label='Customer Name *'
									name='customer_name'
									value={formData.customer_name}
									onChange={handleInputChange}
									placeholder='e.g., Harsh Patel'
									type='text'
									htmlFor='customer_name'
									required
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									label='Mobile Number *'
									name='mobile'
									value={formData.mobile}
									onChange={handleInputChange}
									placeholder='e.g., 9876543210'
									type='text'
									htmlFor='mobile'
									required
									labelMarginRemove
								/>
							</div>

							<div className='col-12 mt-2'>
								<div className='d-flex align-items-center gap-2 mb-2'>
									<FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#172B4D', fontSize: '14px' }} />
									<span className='fw-bold' style={{ color: '#172B4D', fontSize: '13.5px' }}>
										Delivery Destination
									</span>
								</div>
								<div
									style={{
										height: '1px',
										background: '#EEF2F7',
										marginBottom: '16px',
									}}></div>
							</div>

							<div className='col-md-4'>
								<InputField
									label='Pincode / ZIP'
									placeholder='6-digit Pincode'
									type='text'
									name='pincode'
									htmlFor='pincode'
									value={formData.pincode}
									onChange={handleInputChange}
									labelMarginRemove
								/>
								<span className='fs-8 text-muted mt-1 d-block'>
									Auto-fills City & State upon 6 digits
								</span>
							</div>

							<div className='col-md-4'>
								{states.length > 0 ? (
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
								) : (
									<InputField
										label='State'
										name='state'
										value={formData.state}
										onChange={handleInputChange}
										placeholder='e.g., Gujarat'
										type='text'
										htmlFor='state'
										labelMarginRemove
									/>
								)}
							</div>

							<div className='col-md-4'>
								{cities.length > 0 ? (
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
								) : (
									<InputField
										label='City'
										name='city'
										value={formData.city}
										onChange={handleInputChange}
										placeholder='e.g., Surat'
										type='text'
										htmlFor='city'
										labelMarginRemove
									/>
								)}
							</div>

							<div className='col-md-8'>
								<InputField
									label='Full Street Address'
									placeholder='House / Flat No., Building, Street Area'
									type='text'
									name='address'
									htmlFor='address'
									value={formData.address}
									onChange={handleInputChange}
									labelMarginRemove
								/>
							</div>

							<div className='col-md-4'>
								<InputField
									label='Country'
									name='country'
									value={formData.country}
									onChange={handleInputChange}
									placeholder='India'
									type='text'
									htmlFor='country'
									labelMarginRemove
								/>
							</div>
						</div>
					</div>
				</div>

				{/* SECTION 2: REQUESTED SAMPLE PRODUCTS & REVIEWS */}
				<div className='gz-order-card'>
					<div className='gz-order-card-header'>
						<h3 className='gz-order-card-title'>
							<FontAwesomeIcon icon={faBox} className='icon' />
							<span>Requested Sample Products & Ratings</span>
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
						<p
							style={{
								fontSize: '12.5px',
								color: '#71809A',
								margin: '0 0 16px 0',
							}}>
							Edit sample items and inspect or record customer ratings (1 to 5 stars) and remarks.
						</p>

						<div className='d-flex flex-column gap-3'>
							{products.map((product, index) => (
								<div
									key={index}
									className='sb-product-row'
									style={{
										background: '#F8FAFD',
										border: '1px solid #E4EAF2',
										borderRadius: '12px',
										padding: '16px',
									}}>
									<div className='row g-3 align-items-center'>
										<div className='col-md-4'>
											<div className='d-flex align-items-center gap-2'>
												<span
													style={{
														width: '28px',
														height: '28px',
														borderRadius: '7px',
														background: '#EAF1FB',
														color: '#172B4D',
														display: 'inline-flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '12px',
														fontWeight: 700,
														flexShrink: 0,
													}}>
													#{index + 1}
												</span>
												<div className='flex-grow-1'>
													<InputField
														label={`Product Name #${index + 1}`}
														showLabel={false}
														name={`product_name_${index}`}
														value={product.product_name}
														onChange={(e) =>
															handleProductChange(index, 'product_name', e.target.value)
														}
														placeholder='e.g., Whey Protein Concentrate 500g'
														type='text'
														htmlFor={`product_name_${index}`}
														marginRemove
													/>
												</div>
											</div>
										</div>

										{/* Star Rating Selector */}
										<div className='col-md-3'>
											<label
												className='d-block fs-8 fw-bold mb-1'
												style={{ color: '#71809A', textTransform: 'uppercase' }}>
												Rating: {product.rating ? `${product.rating}/5` : 'None'}
											</label>
											<div className='d-flex align-items-center gap-1'>
												{[1, 2, 3, 4, 5].map((star) => (
													<button
														type='button'
														key={star}
														onClick={() =>
															handleProductChange(
																index,
																'rating',
																Number(product.rating) === star ? 0 : star
															)
														}
														style={{
															background: 'none',
															border: 'none',
															padding: '2px',
															cursor: 'pointer',
														}}
														title={`Set rating to ${star} star(s)`}>
														<FontAwesomeIcon
															icon={faStar}
															style={{
																fontSize: '17px',
																color: star <= Number(product.rating) ? '#D97706' : '#CBD5E1',
																transition: 'color 0.15s ease',
															}}
														/>
													</button>
												))}
											</div>
										</div>

										{/* Remarks Input */}
										<div className='col-md-4'>
											<InputField
												label='Customer Remarks'
												showLabel={false}
												name={`remarks_${index}`}
												value={product.remarks || ''}
												onChange={(e) =>
													handleProductChange(index, 'remarks', e.target.value)
												}
												placeholder='Customer review / feedback notes'
												type='text'
												htmlFor={`remarks_${index}`}
												marginRemove
											/>
										</div>

										<div className='col-md-1 d-flex justify-content-end'>
											{products.length > 1 && (
												<button
													type='button'
													className='sb-remove-btn'
													title='Remove this item'
													onClick={() => removeProduct(index)}>
													<FontAwesomeIcon icon={faTrashAlt} />
												</button>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* SECTION 3: FULFILLMENT & COURIER LOGISTICS */}
				<div className='gz-order-card'>
					<div className='gz-order-card-header'>
						<h3 className='gz-order-card-title'>
							<FontAwesomeIcon icon={faTruck} className='icon' />
							<span>Fulfillment & Courier Logistics</span>
						</h3>
					</div>
					<div className='gz-order-card-body'>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									label='Client Order ID'
									name='order_id'
									value={formData.order_id}
									onChange={handleInputChange}
									placeholder='e.g., GZ-SMP-8902'
									type='text'
									htmlFor='order_id'
									labelMarginRemove
								/>
							</div>

							<div className='col-md-6'>
								<label className='sb-form-label'>Courier Partner</label>
								<div className='d-flex gap-2'>
									<div className='flex-grow-1'>
										<SelectField
											name='courier'
											value={formData.courier}
											onChange={handleInputChange}
											options={COURIER_OPTIONS}
											showLabel={false}
											marginRemove={true}
											hideDefaultOption={true}
											searchable={false}
										/>
									</div>
									{formData.courier === 'Other' && (
										<input
											type='text'
											className='form-control form-control-solid'
											placeholder='Specify courier'
											value={formData.courier}
											onChange={(e) =>
												setFormData((prev) => ({ ...prev, courier: e.target.value }))
											}
											style={{
												height: '44px',
												backgroundColor: '#F8FAFD',
												borderColor: '#E4EAF2',
												borderRadius: '10px',
											}}
										/>
									)}
								</div>
							</div>

							<div className='col-md-6'>
								<InputField
									label='AWB Number'
									name='awb'
									value={formData.awb}
									onChange={handleInputChange}
									placeholder='e.g., DEL123456789'
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
									placeholder='e.g., TRK-987654321'
									type='text'
									htmlFor='tracking_id'
									labelMarginRemove
								/>
							</div>

							<div className='col-12'>
								<InputField
									label='Courier Tracking Link'
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

				{/* SECTION 4: CUSTOMER REVIEW & FEEDBACK LINK */}
				{sampleUpdateLink && (
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faPaperPlane} className='icon' />
								<span>Customer Review & Feedback Link</span>
							</h3>
						</div>
						<div className='gz-order-card-body'>
							<p
								style={{
									fontSize: '12.5px',
									color: '#71809A',
									margin: '0 0 10px 0',
								}}>
								Copy and send this direct link to the customer via WhatsApp or SMS so they can update ratings and remarks.
							</p>
							<div className='d-flex align-items-center gap-2'>
								<input
									type='text'
									className='form-control form-control-solid bg-white pe-3'
									value={sampleUpdateLink}
									readOnly
									style={{
										height: '42px',
										backgroundColor: '#F8FAFD',
										color: '#172B4D',
										borderRadius: '10px',
										border: '1px solid #E4EAF2',
										fontSize: '12.5px',
										fontFamily: 'monospace',
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
					</div>
				)}

				{/* SECTION 5: ACTION CONTROLS */}
				<div
					className='gz-order-card p-4 d-flex justify-content-between align-items-center flex-wrap gap-3'
					style={{ background: '#FFFFFF' }}>
					<button
						type='button'
						onClick={() => navigate('/rag/sample-booking')}
						className='gz-prod-btn-cancel'
						disabled={isSubmitting}>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Cancel</span>
					</button>

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
								<span>Updating Booking...</span>
							</>
						) : (
							<span>Update Sample Booking</span>
						)}
					</button>
				</div>
			</form>
		</div>
	)
}

export default SampleBookingUpdate
