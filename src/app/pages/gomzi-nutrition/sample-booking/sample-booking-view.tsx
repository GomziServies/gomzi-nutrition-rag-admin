/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faBox,
	faCalendarAlt,
	faCheckCircle,
	faClock,
	faEdit,
	faExternalLinkAlt,
	faMapMarkerAlt,
	faPaperPlane,
	faPhoneAlt,
	faStar,
	faTag,
	faTruck,
	faUser,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyButton from '../../../components/motion/CopyButton'
import { GetGnSampleBooking } from '../../../Functions/FGGroup'
import '../products-theme.css'
import '../orders-theme.css'
import './sample-booking.css'

const SampleBookingView: React.FC = () => {
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

	if (!bookingData) {
		return (
			<div className='gz-prod-container'>
				<div className='gz-prod-card text-center p-12 my-6'>
					<div
						className='d-inline-flex align-items-center justify-content-center mb-3'
						style={{
							width: '56px',
							height: '56px',
							borderRadius: '50%',
							background: '#F5F7FB',
							color: '#71809A',
						}}>
						<FontAwesomeIcon icon={faBox} style={{ fontSize: '24px' }} />
					</div>
					<h3 className='fw-bold mb-2' style={{ color: '#172B4D' }}>
						No Booking Data Found
					</h3>
					<p className='text-muted fs-7 mb-4'>
						The requested sample booking record could not be loaded or may have been removed.
					</p>
					<Link to='/rag/sample-booking' className='gz-prod-btn-primary d-inline-flex'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Sample Bookings</span>
					</Link>
				</div>
			</div>
		)
	}

	let sampleUpdateLink = ''
	if (typeof window !== 'undefined') {
		if (window.location.hostname === 'localhost') {
			sampleUpdateLink = `http://localhost:3001/rag/sample-booking-update?id=${bookingData?._id}`
		} else {
			sampleUpdateLink = `https://www.gomzilifesciences.in/rag/sample-booking-update?id=${bookingData?._id}`
		}
	}

	const hasRating = bookingData.products?.some((p: any) => Number(p.rating) > 0)
	const isDispatched = Boolean(bookingData.awb || bookingData.tracking_id || bookingData.tracking_link)
	const initials = (bookingData.customer_name || 'SB')
		.split(' ')
		.map((part: string) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase()

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Sample Booking View</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/sample-booking'>Sample Bookings</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>
					{bookingData.customer_name ? `${bookingData.customer_name}'s Booking` : 'Booking Details'}
				</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<div className='d-flex align-items-center gap-3 flex-wrap mb-1'>
						<h1 className='gz-prod-title'>Sample Booking Details</h1>
						{isDispatched ? (
							<span className='gz-status-pill dispatched'>Dispatched</span>
						) : (
							<span className='gz-status-pill pending'>Pending Dispatch</span>
						)}
						{hasRating ? (
							<span className='gz-status-pill success'>Rated</span>
						) : (
							<span className='gz-status-pill secondary'>Awaiting Review</span>
						)}
					</div>
					<p className='gz-prod-subtitle'>
						Review customer profile, sample request items, courier tracking, and submitted reviews.
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
					<Link
						to={`/rag/sample-booking-update?id=${bookingData?._id}`}
						className='gz-prod-btn-primary'
						title='Edit this booking'>
						<FontAwesomeIcon icon={faEdit} />
						<span>Edit Booking</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    MAIN 2-COLUMN DASHBOARD LAYOUT
			    ========================================================================= */}
			<div className='gz-order-grid-layout'>
				{/* LEFT COLUMN: MAIN DETAILS */}
				<div>
					{/* CARD 1: CLIENT INFORMATION & DELIVERY ADDRESS */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faUser} className='icon' />
								<span>Client Profile & Delivery Location</span>
							</h3>
						</div>
						<div className='gz-order-card-body'>
							{/* Client Identity Header */}
							<div className='gz-order-user-card'>
								<div className='gz-order-user-avatar'>{initials}</div>
								<div className='gz-order-user-details flex-grow-1'>
									<div className='gz-order-user-name'>
										{bookingData.customer_name || 'Customer Name Not Provided'}
									</div>
									<div className='gz-order-user-meta mt-1'>
										<FontAwesomeIcon icon={faPhoneAlt} style={{ fontSize: '11px', color: '#71809A' }} />
										<a
											href={`tel:${bookingData.mobile}`}
											style={{ color: '#172B4D', fontWeight: 600, textDecoration: 'none' }}>
											{bookingData.mobile || 'No mobile number'}
										</a>
									</div>
								</div>
							</div>

							{/* Delivery Address Grid */}
							<div className='gz-order-info-grid'>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Street Address</span>
									<span className='gz-order-info-value'>
										{bookingData.address?.address_line_1 || '—'}
									</span>
								</div>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>City</span>
									<span className='gz-order-info-value'>
										{bookingData.address?.city || '—'}
									</span>
								</div>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>State</span>
									<span className='gz-order-info-value'>
										{bookingData.address?.state || '—'}
									</span>
								</div>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Country</span>
									<span className='gz-order-info-value'>
										{bookingData.address?.country || '—'}
									</span>
								</div>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Pincode / ZIP</span>
									<span className='gz-order-info-value'>
										{bookingData.address?.pin_code ? (
											<span
												style={{
													fontFamily: 'monospace',
													fontWeight: 700,
													background: '#F5F7FB',
													padding: '2px 8px',
													borderRadius: '6px',
													border: '1px solid #E4EAF2',
												}}>
												{bookingData.address.pin_code}
											</span>
										) : (
											'—'
										)}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* CARD 2: REQUESTED SAMPLES & CUSTOMER REVIEWS */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faBox} className='icon' />
								<span>Sample Products ({bookingData.products?.length || 0})</span>
							</h3>
						</div>
						<div className='p-0'>
							{bookingData.products && bookingData.products.length > 0 ? (
								<div className='table-responsive'>
									<table className='gz-prod-table mb-0'>
										<thead>
											<tr>
												<th style={{ width: '56px', textAlign: 'center' }}>#</th>
												<th style={{ minWidth: '220px' }}>Product Name</th>
												<th style={{ minWidth: '150px' }}>Customer Rating</th>
												<th style={{ minWidth: '260px' }}>Feedback / Remarks</th>
											</tr>
										</thead>
										<tbody>
											{bookingData.products.map((product: any, index: number) => {
												const ratingNum = Number(product.rating) || 0
												return (
													<tr key={index}>
														<td style={{ textAlign: 'center', fontWeight: 700, color: '#71809A' }}>
															{index + 1}
														</td>
														<td>
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
																	{index + 1}
																</span>
																<span
																	style={{
																		fontWeight: 600,
																		color: '#172B4D',
																		fontSize: '13.5px',
																	}}>
																	{product.product_name || 'Unnamed Sample Item'}
																</span>
															</div>
														</td>
														<td>
															{ratingNum > 0 ? (
																<div className='d-flex align-items-center gap-1'>
																	{[1, 2, 3, 4, 5].map((star) => (
																		<FontAwesomeIcon
																			key={star}
																			icon={faStar}
																			style={{
																				fontSize: '13px',
																				color: star <= ratingNum ? '#D97706' : '#E2E8F0',
																			}}
																		/>
																	))}
																	<span
																		style={{
																			fontWeight: 700,
																			fontSize: '12.5px',
																			color: '#172B4D',
																			marginLeft: '6px',
																		}}>
																		{ratingNum}/5
																	</span>
																</div>
															) : (
																<span
																	style={{
																		fontSize: '12px',
																		color: '#71809A',
																		background: '#F5F7FB',
																		padding: '3px 8px',
																		borderRadius: '6px',
																		border: '1px solid #E4EAF2',
																		fontWeight: 500,
																	}}>
																	Not Rated Yet
																</span>
															)}
														</td>
														<td>
															{product.remarks ? (
																<span
																	style={{
																		fontSize: '13px',
																		color: '#172B4D',
																		fontWeight: 500,
																	}}>
																	"{product.remarks}"
																</span>
															) : (
																<span style={{ fontSize: '12.5px', color: '#A0ABC0' }}>
																	No remarks submitted
																</span>
															)}
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							) : (
								<div className='p-8 text-center text-muted fs-7'>
									No sample products attached to this booking.
								</div>
							)}
						</div>
					</div>

					{/* CARD 3: FULFILLMENT & COURIER LOGISTICS */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faTruck} className='icon' />
								<span>Fulfillment & Courier Logistics</span>
							</h3>
						</div>
						<div className='gz-order-card-body'>
							<div className='gz-order-info-grid'>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Courier Partner</span>
									<span className='gz-order-info-value'>
										{bookingData.courier_name || 'Delhivery (Default)'}
									</span>
								</div>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Client Order ID</span>
									<span className='gz-order-info-value'>
										{bookingData.order_id ? (
											<div className='d-inline-flex align-items-center gap-2'>
												<span
													style={{
														fontFamily: 'monospace',
														background: '#F5F7FB',
														padding: '2px 8px',
														borderRadius: '6px',
														border: '1px solid #E4EAF2',
													}}>
													{bookingData.order_id}
												</span>
												<CopyButton
													text={bookingData.order_id}
													title='Copy Order ID'
													customMessage='Order ID copied!'
													className='sb-link-copy-btn'
													iconSize={13}
												/>
											</div>
										) : (
											'—'
										)}
									</span>
								</div>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>AWB Number</span>
									<span className='gz-order-info-value'>
										{bookingData.awb ? (
											<div className='d-inline-flex align-items-center gap-2'>
												<span
													style={{
														fontFamily: 'monospace',
														fontWeight: 700,
														background: '#F5F7FB',
														padding: '2px 8px',
														borderRadius: '6px',
														border: '1px solid #E4EAF2',
														color: '#172B4D',
													}}>
													{bookingData.awb}
												</span>
												<CopyButton
													text={bookingData.awb}
													title='Copy AWB'
													customMessage='AWB copied!'
													className='sb-link-copy-btn'
													iconSize={13}
												/>
											</div>
										) : (
											'—'
										)}
									</span>
								</div>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Tracking ID</span>
									<span className='gz-order-info-value'>
										{bookingData.tracking_id ? (
											<div className='d-inline-flex align-items-center gap-2'>
												<span
													style={{
														fontFamily: 'monospace',
														background: '#F5F7FB',
														padding: '2px 8px',
														borderRadius: '6px',
														border: '1px solid #E4EAF2',
													}}>
													{bookingData.tracking_id}
												</span>
												<CopyButton
													text={bookingData.tracking_id}
													title='Copy Tracking ID'
													customMessage='Tracking ID copied!'
													className='sb-link-copy-btn'
													iconSize={13}
												/>
											</div>
										) : (
											'—'
										)}
									</span>
								</div>
							</div>

							{bookingData.tracking_link && (
								<div
									className='mt-4 pt-4'
									style={{ borderTop: '1px solid #EEF2F7' }}>
									<div className='d-flex align-items-center justify-content-between flex-wrap gap-2'>
										<div>
											<span className='gz-order-info-label d-block'>Live Tracking URL</span>
											<span
												style={{
													fontSize: '13px',
													color: '#556987',
													wordBreak: 'break-all',
												}}>
												{bookingData.tracking_link}
											</span>
										</div>
										<a
											href={bookingData.tracking_link}
											target='_blank'
											rel='noopener noreferrer'
											className='sb-add-product-btn text-decoration-none'
											title='Open live tracking link'>
											<FontAwesomeIcon icon={faExternalLinkAlt} />
											<span>Track Package</span>
										</a>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* RIGHT COLUMN: SIDEBAR OVERVIEW CARDS */}
				<div>
					{/* CARD 1: BOOKING SUMMARY */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faTag} className='icon' />
								<span>Booking Overview</span>
							</h3>
						</div>
						<div className='gz-order-card-body'>
							<div className='d-flex flex-column gap-3'>
								<div className='d-flex justify-content-between align-items-center pb-3 border-bottom'>
									<span className='gz-order-info-label'>Booking ID</span>
									<div className='d-inline-flex align-items-center gap-2'>
										<span
											style={{
												fontFamily: 'monospace',
												fontSize: '12px',
												color: '#172B4D',
												fontWeight: 600,
											}}>
											{bookingData._id ? `${bookingData._id.slice(0, 10)}...` : '—'}
										</span>
										{bookingData._id && (
											<CopyButton
												text={bookingData._id}
												title='Copy Full Booking ID'
												customMessage='Booking ID copied!'
												className='sb-link-copy-btn'
												iconSize={12}
											/>
										)}
									</div>
								</div>

								{bookingData.createdAt && (
									<div className='d-flex justify-content-between align-items-center pb-3 border-bottom'>
										<span className='gz-order-info-label'>Booked On</span>
										<span
											style={{
												fontSize: '13px',
												fontWeight: 600,
												color: '#172B4D',
											}}>
											{DayJS(bookingData.createdAt).format('DD MMM YYYY, hh:mm A')}
										</span>
									</div>
								)}

								<div className='d-flex justify-content-between align-items-center pb-3 border-bottom'>
									<span className='gz-order-info-label'>Sample Items</span>
									<span
										style={{
											fontSize: '13.5px',
											fontWeight: 700,
											color: '#172B4D',
										}}>
										{bookingData.products?.length || 0} Product(s)
									</span>
								</div>

								<div className='d-flex justify-content-between align-items-center pb-3 border-bottom'>
									<span className='gz-order-info-label'>Fulfillment</span>
									<div>
										{isDispatched ? (
											<span className='gz-status-pill dispatched'>Dispatched</span>
										) : (
											<span className='gz-status-pill pending'>Pending</span>
										)}
									</div>
								</div>

								<div className='d-flex justify-content-between align-items-center'>
									<span className='gz-order-info-label'>Review Status</span>
									<div>
										{hasRating ? (
											<span className='gz-status-pill success'>Feedback Received</span>
										) : (
											<span className='gz-status-pill secondary'>Awaiting Review</span>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* CARD 2: CUSTOMER FEEDBACK LINK STRIP */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faPaperPlane} className='icon' />
								<span>Customer Feedback Link</span>
							</h3>
						</div>
						<div className='gz-order-card-body'>
							<p
								style={{
									fontSize: '12.5px',
									color: '#71809A',
									margin: '0 0 12px 0',
									lineHeight: 1.5,
								}}>
								Share this direct feedback link with the customer to submit ratings and product reviews.
							</p>

							<div className='d-flex align-items-center gap-2 mb-3'>
								<input
									type='text'
									className='form-control form-control-solid bg-white pe-2'
									value={sampleUpdateLink}
									readOnly
									style={{
										height: '40px',
										backgroundColor: '#F8FAFD',
										color: '#172B4D',
										borderRadius: '10px',
										border: '1px solid #E4EAF2',
										fontSize: '12px',
										fontFamily: 'monospace',
									}}
								/>
								<CopyButton
									text={sampleUpdateLink}
									title='Copy Link'
									customMessage='Link copied to clipboard!'
									className='sb-link-copy-btn'
									iconSize={15}
								/>
							</div>

							<a
								href={sampleUpdateLink}
								target='_blank'
								rel='noopener noreferrer'
								className='gz-prod-btn-cancel w-100 justify-content-center text-decoration-none'
								style={{ fontSize: '13px', padding: '9px 14px' }}>
								<FontAwesomeIcon icon={faExternalLinkAlt} />
								<span>Open Feedback Page</span>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SampleBookingView
