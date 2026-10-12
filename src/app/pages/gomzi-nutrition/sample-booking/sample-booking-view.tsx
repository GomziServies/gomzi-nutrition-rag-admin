import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
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
				style={{ height: '300px' }}>
				<div
					className='spinner-border text-primary'
					role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		)
	}

	if (!bookingData) {
		return <div className='p-10 text-center'>No booking data found</div>
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

			<div className='mt-2 px-4'>
				{/* Read-Only Form Card */}
				<div className='card mt-3'>
					<div className='card-body py-10'>
						<div className='row'>
							<div className='col-md-12 mb-5'>
								<h3 className='fw-bold mb-0'>Client Information</h3>
							</div>
							<div className='col-md-6 mb-5'>
								<InputField
									label='Customer Name'
									name='customer_name'
									value={bookingData.customer_name || ''}
									onChange={() => {}}
									placeholder=''
									type='text'
									htmlFor='customer_name'
									readOnly
								/>
							</div>
							<div className='col-md-6 mb-5'>
								<InputField
									label='Mobile Number'
									name='mobile'
									value={bookingData.mobile || ''}
									onChange={() => {}}
									placeholder=''
									type='text'
									htmlFor='mobile'
									readOnly
								/>
							</div>
							<div className='col-md-12 mb-7'>
								<h4 className='fw-bold mb-5'>Address:</h4>
								<div className='row py-5 pb-0'>
									<SelectField
										className='col-md-4 fv-row mb-7'
										label='Country'
										name='country'
										value={bookingData.address?.country || ''}
										onChange={() => {}}
										htmlFor='country'
										options={[bookingData.address?.country || '']}
										disabled
									/>
									<SelectField
										className='col-md-4 fv-row mb-7'
										label='State'
										name='state'
										value={bookingData.address?.state || ''}
										onChange={() => {}}
										htmlFor='state'
										options={[bookingData.address?.state || '']}
										disabled
									/>
									<SelectField
										className='col-md-4 fv-row mb-7'
										label='City'
										name='city'
										value={bookingData.address?.city || ''}
										onChange={() => {}}
										htmlFor='city'
										options={[bookingData.address?.city || '']}
										disabled
									/>
									<InputField
										className='col-md-8 fv-row mb-7'
										label='Address'
										placeholder=''
										type='text'
										name='address'
										htmlFor='address'
										value={bookingData.address?.address_line_1 || ''}
										onChange={() => {}}
										readOnly
									/>
									<InputField
										className='col-md-4 fv-row mb-7'
										label='Pincode'
										placeholder=''
										type='text'
										name='pincode'
										htmlFor='pincode'
										value={bookingData.address?.pin_code?.toString() || ''}
										onChange={() => {}}
										readOnly
									/>
								</div>
							</div>
							<div className='border-bottom w-100 my-5'></div>
							<div className='col-md-12 mb-8'>
								<h3 className='fw-bold mb-5'>Order Information</h3>
								<div className='d-flex flex-column'>
									<label className='fw-bold fs-6 mb-2'>Product Name</label>
									<div className='d-flex flex-wrap gap-5'>
										{bookingData.products?.map((product: any, index: number) => (
											<div
												key={index}
												style={{ minWidth: '300px' }}>
												<InputField
													label=''
													showLabel={false}
													name={`product_name_${index}`}
													value={product.product_name}
													onChange={() => {}}
													placeholder=''
													type='text'
													htmlFor={`product_name_${index}`}
													readOnly
													marginRemove
												/>
											</div>
										))}
									</div>
								</div>
							</div>
							<div className='col-md-6 mb-6'>
								<InputField
									label='AWB Number'
									name='awb'
									value={bookingData.awb || ''}
									onChange={() => {}}
									placeholder=''
									type='text'
									htmlFor='awb'
									readOnly
								/>
							</div>
							<div className='col-md-6 mb-6'>
								<InputField
									label='Client Order ID'
									name='order_id'
									value={bookingData.order_id || ''}
									onChange={() => {}}
									placeholder=''
									type='text'
									htmlFor='order_id'
									readOnly
								/>
							</div>

							<div className='col-md-6 mb-6'>
								<InputField
									label='Tracking ID'
									name='tracking_id'
									value={bookingData.tracking_id || ''}
									onChange={() => {}}
									placeholder=''
									type='text'
									htmlFor='tracking_id'
									readOnly
								/>
							</div>
							<div className='col-md-6 mb-6'>
								<InputField
									label='Courier Tracking Link'
									name='tracking_link'
									value={bookingData.tracking_link || ''}
									onChange={() => {}}
									placeholder=''
									type='text'
									htmlFor='tracking_link'
									readOnly
								/>
							</div>
							<div className='col-md-12 mb-6'>
								<InputField
									label='Courier Name'
									name='courier'
									value={bookingData.courier_name || ''}
									onChange={() => {}}
									placeholder=''
									type='text'
									htmlFor='courier'
									readOnly
								/>
							</div>
							<div className='col-md-12 mb-6'>
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
					</div>
				</div>

				{/* Customer Feedback Table */}
				<div className='row mt-5'>
					<div className='col-12'>
						{bookingData.products?.some((p: any) => p.rating > 0) ? (
							<div className='card card-flush shadow-sm'>
								<div className='card-header pt-5'>
									<h3 className='card-title align-items-start flex-column'>
										<span className='card-label fw-bolder text-dark fs-2'>Customer Feedback</span>
										<span className='text-muted mt-1 fw-bold fs-7'>
											Detailed product experience and reports
										</span>
									</h3>
								</div>
								<div className='card-body pt-2 pb-9'>
									<div className='table-responsive'>
										<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
											<thead>
												<tr className='fw-bolder text-muted bg-light'>
													<th className='ps-4 min-w-50px rounded-start text-center'>No.</th>
													<th className='min-w-200px'>Product Name</th>
													<th className='min-w-150px'>Rating</th>
													<th className='min-w-300px rounded-end'>Remarks / Feedback</th>
												</tr>
											</thead>
											<tbody>
												{bookingData.products?.map((product: any, index: number) => (
													<tr key={index}>
														<td className='text-center'>
															<span className='text-muted fw-bold ps-4'>{index + 1}</span>
														</td>
														<td>
															<div className='d-flex align-items-center ps-0'>
																<div className='d-flex justify-content-start flex-column'>
																	<span className='text-dark fw-bold fs-6'>
																		{product.product_name}
																	</span>
																</div>
															</div>
														</td>
														<td>
															<div className='d-flex gap-1'>
																{[...Array(5)].map((_, i) => {
																	const starValue = i + 1
																	let iconClass = 'bi bi-star-fill text-gray-300'
																	if (product.rating >= starValue) {
																		iconClass = 'bi bi-star-fill text-warning'
																	} else if (product.rating >= starValue - 0.5) {
																		iconClass = 'bi bi-star-half text-warning'
																	}
																	return (
																		<i
																			key={i}
																			className={`${iconClass} fs-6`}></i>
																	)
																})}
															</div>
														</td>
														<td>
															<span
																className={`fw-bold d-block fs-7 lh-base ${
																	product.remarks ? 'text-gray-800' : 'text-muted'
																}`}>
																{product.remarks || 'No Review'}
															</span>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						) : (
							<div className='card card-flush shadow-sm'>
								<div className='card-body p-10 text-center'>
									<i className='bi bi-chat-left-text fs-3x text-muted mb-5 d-block'></i>
									<span className='text-muted fs-4 fw-bold'>No Reviews Submitted Yet</span>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

export default SampleBookingView
