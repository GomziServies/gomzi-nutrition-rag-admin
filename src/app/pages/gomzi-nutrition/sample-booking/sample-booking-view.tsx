import { Copy, Link as LinkIcon, MapPin, MessageSquare, Package, Star, UserRound } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import CopyButton from '../../../components/motion/CopyButton'
import { GetGnSampleBooking } from '../../../Functions/FGGroup'
import './sample-booking.css'

const SampleBookingView = () => {
	const location = useLocation()
	const queryParams = new URLSearchParams(location.search)
	const bookingId = queryParams.get('id')

	const [isLoading, setIsLoading] = useState(false)
	const [bookingData, setBookingData] = useState<any>(null)

	const fetchBookingDetails = async () => {
		if (!bookingId) return
		setIsLoading(true)
		try {
			const response: any = await GetGnSampleBooking({ id: bookingId })
			if (response.status === 200 && response.data) {
				setBookingData(response.data[0])
			}
		} catch (error) {
			console.error('Error fetching booking details:', error)
			toast.error('Failed to load booking details')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchBookingDetails()
	}, [bookingId])

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

	if (!bookingData) {
		return (
			<div className='sb-section-card p-10 text-center my-6'>
				<h4 className='fw-bold mb-2' style={{ color: '#172B4D' }}>No booking data found</h4>
				<p className='text-muted fs-7 m-0'>The requested sample booking record could not be loaded.</p>
			</div>
		)
	}

	let sampleUpdateLink = ''
	if (window.location.hostname === 'localhost') {
		sampleUpdateLink = `http://localhost:3001/rag/sample-booking-update?id=${bookingData?._id}`
	} else {
		sampleUpdateLink = `https://www.gomzilifesciences.in/rag/sample-booking-update?id=${bookingData?._id}`
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Sample Booking View</PageTitle>

			{/* Page Heading */}
			<div className='sb-page-header'>
				<div>
					<div className='sb-breadcrumb'>
						<span>Sample Bookings</span>
						<span className='sb-breadcrumb-separator'>/</span>
						<span>Booking Details</span>
					</div>
					<h1 className='sb-page-title'>Sample Booking Details</h1>
					<p className='sb-page-subtitle'>
						Review customer information, dispatch details, tracking, and customer reviews.
					</p>
				</div>
			</div>

			<div style={{ maxWidth: '1100px' }}>
				{/* Section 1: Client Information */}
				<div className='sb-section-card'>
					<div className='sb-section-header'>
						<div className='sb-section-title-wrap'>
							<span className='sb-section-icon-badge'>
								<UserRound size={18} />
							</span>
							<div>
								<h2 className='sb-section-title'>Client Information</h2>
								<p className='sb-section-subtitle'>Customer contact details and recipient address</p>
							</div>
						</div>
					</div>

					<div className='row'>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Customer Name'
								name='customer_name'
								value={bookingData.customer_name || ''}
								onChange={() => {}}
								placeholder=''
								type='text'
								htmlFor='customer_name'
								readOnly
								labelMarginRemove
							/>
						</div>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Mobile Number'
								name='mobile'
								value={bookingData.mobile || ''}
								onChange={() => {}}
								placeholder=''
								type='text'
								htmlFor='mobile'
								readOnly
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
								value={bookingData.address?.country || ''}
								onChange={() => {}}
								htmlFor='country'
								options={[bookingData.address?.country || '']}
								disabled
								marginRemove
							/>
						</div>
						<div className='col-md-4 mb-4'>
							<SelectField
								label='State'
								name='state'
								value={bookingData.address?.state || ''}
								onChange={() => {}}
								htmlFor='state'
								options={[bookingData.address?.state || '']}
								disabled
								marginRemove
							/>
						</div>
						<div className='col-md-4 mb-4'>
							<SelectField
								label='City'
								name='city'
								value={bookingData.address?.city || ''}
								onChange={() => {}}
								htmlFor='city'
								options={[bookingData.address?.city || '']}
								disabled
								marginRemove
							/>
						</div>
					</div>

					<div className='row mt-1'>
						<div className='col-md-8 mb-4'>
							<InputField
								label='Address'
								placeholder=''
								type='text'
								name='address'
								htmlFor='address'
								value={bookingData.address?.address_line_1 || ''}
								onChange={() => {}}
								readOnly
								labelMarginRemove
							/>
						</div>
						<div className='col-md-4 mb-4'>
							<InputField
								label='Pincode'
								placeholder=''
								type='text'
								name='pincode'
								htmlFor='pincode'
								value={bookingData.address?.pin_code?.toString() || ''}
								onChange={() => {}}
								readOnly
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
								<h2 className='sb-section-title'>Order & Shipping Information</h2>
								<p className='sb-section-subtitle'>Product samples sent, tracking numbers, and courier</p>
							</div>
						</div>
					</div>

					{/* Products */}
					<div className='mb-4'>
						<label className='sb-form-label'>Product Name(s)</label>
						<div className='d-flex flex-column gap-2'>
							{bookingData.products?.map((product: any, index: number) => (
								<div key={index} className='d-flex align-items-center gap-2'>
									<InputField
										showLabel={false}
										name={`product_name_${index}`}
										value={product.product_name}
										onChange={() => {}}
										placeholder=''
										type='text'
										htmlFor={`product_name_${index}`}
										readOnly
										marginRemove
										className='w-100'
									/>
								</div>
							))}
						</div>
					</div>

					<div className='row'>
						<div className='col-md-6 mb-4'>
							<InputField
								label='AWB Number'
								name='awb'
								value={bookingData.awb || ''}
								onChange={() => {}}
								placeholder=''
								type='text'
								htmlFor='awb'
								readOnly
								labelMarginRemove
							/>
						</div>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Client Order ID'
								name='order_id'
								value={bookingData.order_id || ''}
								onChange={() => {}}
								placeholder=''
								type='text'
								htmlFor='order_id'
								readOnly
								labelMarginRemove
							/>
						</div>
					</div>

					<div className='row'>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Tracking ID'
								name='tracking_id'
								value={bookingData.tracking_id || ''}
								onChange={() => {}}
								placeholder=''
								type='text'
								htmlFor='tracking_id'
								readOnly
								labelMarginRemove
							/>
						</div>
						<div className='col-md-6 mb-4'>
							<InputField
								label='Courier Tracking Link'
								name='tracking_link'
								value={bookingData.tracking_link || ''}
								onChange={() => {}}
								placeholder=''
								type='text'
								htmlFor='tracking_link'
								readOnly
								labelMarginRemove
							/>
						</div>
					</div>

					<div className='row'>
						<div className='col-md-12 mb-4'>
							<InputField
								label='Courier Name'
								name='courier'
								value={bookingData.courier_name || ''}
								onChange={() => {}}
								placeholder=''
								type='text'
								htmlFor='courier'
								readOnly
								labelMarginRemove
							/>
						</div>
					</div>

					{/* Sample Update Link */}
					<div className='sb-link-strip'>
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
				</div>

				{/* Section 3: Customer Feedback */}
				<div className='sb-section-card'>
					<div className='sb-section-header'>
						<div className='sb-section-title-wrap'>
							<span className='sb-section-icon-badge'>
								<MessageSquare size={18} />
							</span>
							<div>
								<h2 className='sb-section-title'>Customer Feedback</h2>
								<p className='sb-section-subtitle'>Detailed product ratings and customer remarks</p>
							</div>
						</div>
					</div>

					{bookingData.products?.some((p: any) => p.rating > 0) ? (
						<div className='table-responsive'>
							<table className='table table-row-dashed align-middle mb-0' style={{ borderCollapse: 'separate' }}>
								<thead>
									<tr
										style={{
											backgroundColor: '#F5F7FB',
											color: '#172B4D',
											fontWeight: 700,
											fontSize: '13px',
										}}>
										<th className='ps-4 py-3 min-w-50px rounded-start text-center'>No.</th>
										<th className='py-3 min-w-200px'>Product Name</th>
										<th className='py-3 min-w-150px'>Rating</th>
										<th className='pe-4 py-3 min-w-280px rounded-end'>Remarks / Feedback</th>
									</tr>
								</thead>
								<tbody>
									{bookingData.products?.map((product: any, index: number) => (
										<tr
											key={index}
											style={{
												borderBottom: '1px solid #E4EAF2',
												transition: 'background-color 0.15s ease',
											}}>
											<td className='text-center py-3.5'>
												<span className='fw-bold' style={{ color: '#172B4D' }}>
													{index + 1}
												</span>
											</td>
											<td className='py-3.5'>
												<span className='fw-bold fs-6' style={{ color: '#172B4D' }}>
													{product.product_name}
												</span>
											</td>
											<td className='py-3.5'>
												<div className='d-flex align-items-center gap-1'>
													{[...Array(5)].map((_, i) => {
														const starValue = i + 1
														const isFull = product.rating >= starValue
														return (
															<Star
																key={i}
																size={16}
																fill={isFull ? '#D97706' : '#E2E8F0'}
																color={isFull ? '#D97706' : '#CBD5E1'}
															/>
														)
													})}
													<span className='ms-2 fw-bold fs-7' style={{ color: '#172B4D' }}>
														{product.rating ? `${product.rating}/5` : 'Not rated'}
													</span>
												</div>
											</td>
											<td className='pe-4 py-3.5'>
												<span
													className='fs-7'
													style={{
														color: product.remarks ? '#172B4D' : '#71809A',
														fontWeight: product.remarks ? 500 : 400,
													}}>
													{product.remarks || 'No review remarks submitted'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className='p-8 text-center'>
							<div
								className='d-inline-flex align-items-center justify-content-center mb-3'
								style={{
									width: '52px',
									height: '52px',
									borderRadius: '50%',
									background: '#F5F7FB',
									color: '#71809A',
								}}>
								<MessageSquare size={24} />
							</div>
							<h5 className='fw-bold mb-1' style={{ color: '#172B4D' }}>No Reviews Submitted Yet</h5>
							<p className='text-muted fs-7 mb-0'>The customer has not submitted a rating or review for this sample order.</p>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default SampleBookingView
