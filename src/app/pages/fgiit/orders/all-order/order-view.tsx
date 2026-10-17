/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faBox,
	faCreditCard,
	faReceipt,
	faUser,
	faCheckCircle,
	faTimesCircle,
	faExternalLinkAlt,
	faShieldAlt,
	faChevronDown,
	faChevronUp,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import { FetchRazorpayPaymentDetails, GetOrders } from '../../../../Functions/FGGroup'
import '../../../gomzi-nutrition/products-theme.css'
import '../../../gomzi-nutrition/orders-theme.css'

const OrderView: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const order_id: any = searchParams.get('order_id')
	const [userData, setUserData] = useState<any>('')
	const [itemData, setItemData] = useState<any>('')
	const [fitnessCourseData, setFitnessCourseData] = useState<any>([])
	const [subscriptionData, setSubscriptionData] = useState<any>('')
	const [orderData, setOrderData] = useState<any>([])
	const [razorpayData, setRezorpayData] = useState<any>('')
	const [showDiv, setShowDiv] = useState(false)
	const [loading, setLoading] = useState(false)
	const [razorpayOpen, setRazorpayOpen] = useState(false)

	const fetchRazorpayData = async (payment_id: string, gateway: any) => {
		try {
			const response: any = await FetchRazorpayPaymentDetails({
				razorpay_id: payment_id,
				gateway: gateway,
			})
			setRezorpayData(response?.data)
		} catch (error) {
			console.error('Error fetching Razorpay details:', error)
		}
	}

	const fetchOrderData = async () => {
		setLoading(true)
		try {
			const response: any = await GetOrders({ order_id: order_id })
			const data: any = response?.data?.[0]

			if (!data) {
				console.error('No order data found')
				setLoading(false)
				return
			}

			const cartItems = data.CART || []
			const multipleItems = data.multiple_items || []
			const fitnessSubscription =
				data.fitness_course_subscription?.length > 0
					? data.fitness_course_subscription
					: data.fitness_plan_subscription?.length > 0
					? data.fitness_plan_subscription
					: data.digital_plan_subscription?.length > 0
					? data.digital_plan_subscription
					: data.user_meal_product?.length > 0
					? data.user_meal_product
					: data.book_subscription
			let productData: any = []

			if (data.order_item_type === 'CART') {
				productData = multipleItems
					.map((multiItem: any) => {
						const cartItem = cartItems?.find((cart: any) => cart?._id === multiItem.item_id)

						if (cartItem) {
							let courseData = fitnessSubscription?.books
								? fitnessSubscription?.books?.find(
										(fitness: any) => fitness.book_id === cartItem?._id
								  )
								: fitnessSubscription?.find((fitness: any) => fitness.course_id === cartItem?._id)

							return {
								name:
									multiItem.item_type === 'BOOKS'
										? cartItem.book_title
										: multiItem.item_type === 'FITNESS_COURSE'
										? cartItem.course_name
										: cartItem.name,
								amount: multiItem.amount || 0,
								type: multiItem.item_type || 'Unknown',
								qty: multiItem.quantity || 1,
								id: multiItem?._id || 'Unknown',
								submission_id: courseData?._id || null,
							}
						}
						return null
					})
					.filter(Boolean)
			} else if (['BOOKS', 'FITNESS_COURSE', 'PT_PLAN', 'EBOOKS'].includes(data.order_item_type)) {
				productData = [data]
			}

			const user = data.user_info || {}
			let subscription: any

			if (data.fitness_course_subscription?.length > 0) {
				subscription = data.fitness_course_subscription
			} else if (data.book_subscription) {
				if (data.book_subscription?.books?.length > 0) {
					subscription = data.book_subscription?.books
				} else {
					subscription = data.book_subscription
				}
			} else if (data.fitness_plan_subscription?.length > 0) {
				subscription = data.fitness_plan_subscription
			} else if (data.digital_plan_subscription?.length > 0) {
				subscription = data.digital_plan_subscription
			} else if (data.user_meal_product?.length > 0) {
				subscription = data.user_meal_product
			} else if (data.book_subscription?.length > 0) {
				subscription = data.book_subscription
			} else {
				if (data.book_subscription?.books) {
					subscription = data.book_subscription?.books
				} else {
					subscription = data.book_subscription
				}
			}

			if (subscription) {
				let newSubscription: any
				if (subscription && subscription?.length > 0) {
					newSubscription = subscription.map((sub: any) => {
						const CheckProductData = productData.find(
							(product: any) => product.fitness_course_subscription || product.book_subscription
						)
						const pData = productData.find((product: any) =>
							CheckProductData
								? product.fitness_course_subscription[0]._id
									? product.fitness_course_subscription[0]._id
									: product.book_subscription._id
								: product.submission_id == sub._id
						)
						return { ...sub, item_data: pData }
					})
				} else {
					const CheckProductData = productData.find(
						(product: any) => product.fitness_course_subscription || product.book_subscription
					)
					const pData = productData.find((product: any) =>
						CheckProductData
							? product.fitness_course_subscription[0]?._id
								? product.fitness_course_subscription[0]?._id
								: product.book_subscription?._id
							: product.submission_id == subscription?._id
					)
					newSubscription = { ...subscription, item_data: pData }
				}
				setSubscriptionData(newSubscription)
			} else if (data.book_subscription) {
				setSubscriptionData({ type: 'book', id: data?._id })
			} else if (data.ebook_purchase_info) {
				setSubscriptionData({ type: 'ebook', id: data?._id })
			} else if (data.meal_product) {
				setSubscriptionData({ type: 'meal', id: data?._id })
			} else {
				setSubscriptionData({ type: 'error' })
			}

			setShowDiv(!!data.gateway_transaction_id)
			setItemData(productData)
			setFitnessCourseData(data.fitness_course_subscription)
			setUserData(user)
			setOrderData(data)
		} catch (error) {
			console.error('Error fetching order data:', error)
			toast.error('Failed to load order details')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (order_id) {
			fetchOrderData()
		}
	}, [order_id])

	const statusShow = (status: string) => {
		const s = (status || '').toUpperCase()
		if (s === 'SUCCESS') return <span className='gz-status-pill success'>Success</span>
		if (s === 'PENDING') return <span className='gz-status-pill pending'>Pending</span>
		if (s === 'FAILED') return <span className='gz-status-pill danger'>Failed</span>
		if (s === 'CANCELLED') return <span className='gz-status-pill secondary'>Cancelled</span>
		if (s === 'REFUNDED') return <span className='gz-status-pill primary'>Refunded</span>
		return <span className='gz-status-pill secondary'>{status || 'N/A'}</span>
	}

	const handleButtonClick = (id: string, type: string) => {
		switch (type) {
			case 'book':
			case 'ebook':
				window.open(`/fgiit/book-order-view?order_id=${id}`)
				break
			case 'meal':
				window.open(`/fgiit/product-order-view?order_id=${id}`)
				break
			default:
				toast.error('Invalid subscription type')
		}
	}

	const getSubmissionResultPage = (submissionID: any, userID: string) => {
		if (!userID) {
			return submissionID
		}
		return `<a href="/fgiit/scholarship-result/submissionResult?user_id=${userID}&submission_id=${submissionID}" target="_blank" style="color: #2563EB; font-weight: 600;">${submissionID}</a>`
	}

	const getJSONObjectListHTML = (object: any, userID?: any) => {
		const listItems = []
		if (typeof object === 'object' && object !== null) {
			for (const key in object) {
				if (Object.prototype.hasOwnProperty.call(object, key)) {
					let value = object[key]
					if (key === 'scholarship_submission_id') {
						value = getSubmissionResultPage(value, userID)
					}
					listItems.push(
						<li key={key} style={{ marginBottom: '6px' }}>
							<strong style={{ color: '#172B4D' }}>{key.replace(/_/g, ' ').toUpperCase()}:</strong>{' '}
							<span dangerouslySetInnerHTML={{ __html: String(value) }} />
						</li>
					)
				}
			}
		}
		return listItems
	}

	function viewFitnessOrder(
		fitness_course_id: string,
		orderId: string,
		type?: string,
		book_order_id?: any
	) {
		if (type === 'BOOKS') {
			window.open(`/fgiit/book-order-view?order_id=${book_order_id}`)
		} else {
			window.open(
				`/fgiit/user/user-fitness-course-view?user_fitness_course_id=${fitness_course_id}&order_id=${orderId}`
			)
		}
	}

	function viewItemOrder(item_id: string, type?: string) {
		if (type === 'BOOKS') {
			window.open(`/fgiit/books/book-view?book_id=${item_id}`)
		} else {
			window.open(`/fgiit/fitness-courses?course_id=${item_id}`)
		}
	}

	const backUrl = location.pathname.startsWith('/rag') ? '/rag/all-order' : '/fgiit/all-order'
	const userProfileUrl = location.pathname.startsWith('/rag')
		? `/rag/users/view-user?user_id=${userData?._id}`
		: `/fgiit/users/view-user?user_id=${userData?._id}`

	const initials = `${(userData?.first_name || '').charAt(0)}${(userData?.last_name || '').charAt(0)}`.toUpperCase() || 'U'

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Customer Order Details</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to={backUrl}>All Customer Orders</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Order #{orderData?.receipt_id || order_id || 'Details'}</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<div className='d-flex align-items-center gap-3 flex-wrap mb-1'>
						<h1 className='gz-prod-title'>
							Order #{orderData?.receipt_id || order_id || 'Details'}
						</h1>
						{orderData?.status && statusShow(orderData.status)}
					</div>
					<p className='gz-prod-subtitle'>
						Created: {orderData?.createdAt ? DayJS(orderData.createdAt).format('DD MMMM YYYY, hh:mm A') : '-'}
						{orderData?.updateAt ? ` • Modified: ${DayJS(orderData.updateAt).format('DD MMM YYYY, hh:mm A')}` : ''}
					</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					<Link to={backUrl} className='gz-prod-btn-cancel' title='Back to Orders'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Orders</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    2-COLUMN DASHBOARD GRID
			    ========================================================================= */}
			<div className='gz-order-grid-layout'>
				{/* LEFT COLUMN: ITEMS / SUBSCRIPTION + PAYMENT + RAZORPAY */}
				<div>
					{/* SUBSCRIPTION DETAILS OR ITEM DETAILS */}
					{subscriptionData?.book_id || subscriptionData?.length > 0 ? (
						<div className='gz-order-card'>
							<div className='gz-order-card-header'>
								<h3 className='gz-order-card-title'>
									<FontAwesomeIcon icon={faBox} className='icon' />
									<span>Subscription &amp; Enrollment Details</span>
								</h3>
							</div>

							<div className='gz-order-card-body p-0'>
								{subscriptionData && subscriptionData.type ? (
									<div className='p-5 text-center'>
										{subscriptionData.type === 'error' ? (
											<span className='text-danger fw-semibold'>Data not found or payment failed</span>
										) : (
											<button
												className='gz-prod-btn-primary'
												onClick={() =>
													handleButtonClick(subscriptionData.id, subscriptionData.type)
												}>
												<span>Track Fulfillment Order</span>
											</button>
										)}
									</div>
								) : (
									<div className='table-responsive'>
										<table className='gz-prod-table mb-0'>
											<thead>
												<tr>
													<th>Subscription ID</th>
													<th>Item / Course</th>
													<th>Type</th>
													{Array.isArray(subscriptionData) && subscriptionData[0]?.duration?.duration && (
														<th>Duration</th>
													)}
													<th>Start / Purchase Date</th>
													{Array.isArray(subscriptionData) && subscriptionData[0]?.duration?.duration && (
														<th>End Date</th>
													)}
													<th style={{ textAlign: 'center' }}>Action</th>
												</tr>
											</thead>
											<tbody>
												{Array.isArray(subscriptionData) &&
													subscriptionData.map((sub: any) => (
														<tr key={sub?._id}>
															<td>
																<span className='font-monospace' style={{ color: '#172B4D', fontWeight: 600 }}>
																	{sub?._id || '-'}
																</span>
															</td>
															<td>
																<div className='d-flex flex-column'>
																	<span style={{ fontWeight: 600, color: '#172B4D' }}>
																		{sub?.item_data?.books?.book_title ||
																			sub?.item_data?.fitness_course?.course_name ||
																			sub?.item_data?.name ||
																			'-'}
																	</span>
																	<span className='text-muted fs-8'>
																		ID: {sub?.item_data?.id || sub?.item_data?.fitness_course?._id || sub?.item_data?.books?._id || '-'}
																	</span>
																</div>
															</td>
															<td>
																<span className='badge bg-light text-dark fw-semibold'>
																	{sub?.item_data?.fitness_course
																		? String(sub?.item_data?.order_item_type || '-').split('_').join(' ')
																		: String(sub?.item_data?.type || '-').split('_').join(' ')}
																</span>
															</td>
															{sub.duration?.duration && (
																<td>
																	<span style={{ fontWeight: 600, color: '#172B4D' }}>
																		{sub.duration.duration} {sub.duration.unit}
																	</span>
																</td>
															)}
															<td>
																<span style={{ color: '#71809A', fontSize: '13px' }}>
																	{DayJS(sub.start_date || sub.createdAt).format('DD/MM/YYYY, hh:mm A')}
																</span>
															</td>
															{sub.duration?.duration && (
																<td>
																	<span style={{ color: '#71809A', fontSize: '13px' }}>
																		{DayJS(sub.end_date).format('DD/MM/YYYY, hh:mm A')}
																	</span>
																</td>
															)}
															<td style={{ textAlign: 'center' }}>
																{(itemData?.length > 0 &&
																	itemData?.[0]?.order_item_type === 'FITNESS_COURSE') ||
																itemData?.[0]?.order_item_type === 'BOOKS' ? (
																	<div className='d-flex gap-2 justify-content-center'>
																		<button
																			type='button'
																			className='btn btn-sm btn-light-primary'
																			onClick={() =>
																				viewItemOrder(sub?.book_id || sub?.course_id, sub?.item_data?.type)
																			}>
																			View Item
																		</button>
																		<button
																			type='button'
																			className='btn btn-sm btn-primary'
																			onClick={() =>
																				viewFitnessOrder(
																					sub?.item_data?.fitness_course_subscription?.[0]?._id,
																					sub?.item_data?.id,
																					sub?.item_data?.type,
																					order_id
																				)
																			}>
																			Subscription
																		</button>
																	</div>
																) : itemData?.[0]?.type === 'FITNESS_COURSE' ||
																  itemData?.[0]?.type === 'BOOKS' ? (
																	<div className='d-flex gap-2 justify-content-center'>
																		<button
																			type='button'
																			className='btn btn-sm btn-light-primary'
																			onClick={() =>
																				viewItemOrder(
																					sub?.item_data?.id || sub?.item_data?.fitness_course?._id,
																					sub?.item_data?.type
																				)
																			}>
																			View Item
																		</button>
																		<button
																			type='button'
																			className='btn btn-sm btn-primary'
																			onClick={() =>
																				viewFitnessOrder(
																					sub?.item_data?.submission_id,
																					sub?.item_data?.id,
																					sub?.item_data?.type,
																					order_id
																				)
																			}>
																			Subscription
																		</button>
																	</div>
																) : null}
															</td>
														</tr>
													))}
											</tbody>
										</table>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className='gz-order-card'>
							<div className='gz-order-card-header'>
								<h3 className='gz-order-card-title'>
									<FontAwesomeIcon icon={faBox} className='icon' />
									<span>Order Items ({itemData?.length || 0})</span>
								</h3>
							</div>

							<div className='gz-order-card-body p-0'>
								{loading ? (
									<div className='p-6 text-center text-muted'>Loading order items...</div>
								) : itemData?.length > 0 ? (
									<div className='table-responsive'>
										<table className='gz-prod-table mb-0'>
											<thead>
												<tr>
													<th>Item</th>
													{!(
														(itemData?.length > 0 && itemData?.[0]?.order_item_type === 'FITNESS_COURSE') ||
														itemData?.[0]?.type === 'FITNESS_COURSE' ||
														itemData?.[0]?.order_item_type === 'PT_PLAN' ||
														itemData?.[0]?.order_item_type === 'EBOOKS'
													) && <th style={{ textAlign: 'center' }}>Qty</th>}
													<th>Type</th>
													<th style={{ textAlign: 'right' }}>Amount</th>
													{((itemData?.length > 0 && itemData?.[0]?.order_item_type === 'FITNESS_COURSE') ||
														itemData?.[0]?.type === 'FITNESS_COURSE') && (
														<th style={{ textAlign: 'center' }}>Action</th>
													)}
												</tr>
											</thead>
											<tbody>
												{itemData.map((item: any, index: number) => {
													const itemName =
														item?.books?.book_title ||
														item?.fitness_course?.course_name ||
														item?.fitness_plan?.plan_name ||
														item?.ebook?.ebook_title ||
														item?.name ||
														'-'

													const typeDisplay =
														item?.books || item?.fitness_course || item?.fitness_plan || item?.ebook
															? String(item?.order_item_type || '-').split('_').join(' ')
															: String(item?.type || '-').split('_').join(' ')

													const hideQty =
														(itemData?.length > 0 && itemData?.[0]?.order_item_type === 'FITNESS_COURSE') ||
														item?.type === 'FITNESS_COURSE' ||
														itemData?.[0]?.order_item_type === 'PT_PLAN' ||
														itemData?.[0]?.order_item_type === 'EBOOKS'

													return (
														<tr key={index}>
															<td>
																<div className='d-flex flex-column'>
																	<span style={{ fontWeight: 600, color: '#172B4D' }}>{itemName}</span>
																	<span className='text-muted fs-8'>ID: {item?.id || '-'}</span>
																</div>
															</td>
															{!hideQty && (
																<td style={{ textAlign: 'center' }}>
																	<span className='gz-order-item-qty'>
																		× {item?.books ? item?.notes?.quantity || 1 : item?.qty || 1}
																	</span>
																</td>
															)}
															<td>
																<span className='badge bg-light text-dark fw-semibold'>
																	{typeDisplay}
																</span>
															</td>
															<td style={{ textAlign: 'right', fontWeight: 700, color: '#172B4D' }}>
																₹{Number(item?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
															</td>
															{((itemData?.length > 0 && itemData?.[0]?.order_item_type === 'FITNESS_COURSE') ||
																item?.type === 'FITNESS_COURSE') && (
																<td style={{ textAlign: 'center' }}>
																	<button
																		type='button'
																		className='btn btn-sm btn-primary'
																		onClick={() =>
																			viewFitnessOrder(
																				item?.fitness_course_subscription?.[0]?._id || item?.submission_id,
																				item?.id
																			)
																		}>
																		View Course
																	</button>
																</td>
															)}
														</tr>
													)
												})}
											</tbody>
										</table>
									</div>
								) : (
									<div className='p-6 text-center text-muted'>No items recorded for this order</div>
								)}

								{/* Order Totals Box */}
								<div className='p-4 pt-0'>
									<div className='gz-order-summary-box'>
										<div className='gz-order-summary-row'>
											<span>Subtotal</span>
											<span>
												₹{Number(orderData?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
											</span>
										</div>
										<div className='gz-order-summary-row total'>
											<span>Total Order Value</span>
											<span style={{ color: '#168064' }}>
												₹{Number(orderData?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
												<span style={{ fontSize: '13px', color: '#71809A' }}>
													{orderData?.currency || 'INR'}
												</span>
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* ORDER OVERVIEW & GATEWAY CARD */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faReceipt} className='icon' />
								<span>Order &amp; Payment Overview</span>
							</h3>
						</div>

						<div className='gz-order-card-body'>
							<div className='gz-order-info-grid mb-4'>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Order ID</span>
									<span className='gz-order-info-value font-monospace' style={{ fontSize: '13px' }}>
										{orderData?._id || 'N/A'}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Receipt ID</span>
									<span className='gz-order-info-value font-monospace'>
										{orderData?.receipt_id || 'N/A'}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Purchase Mode</span>
									<span className='gz-order-info-value'>
										{orderData?.purchase_mode || 'Online'}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Payment Gateway</span>
									<span className='gz-order-info-value'>
										{orderData?.gateway || 'Direct'}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Gateway Order ID</span>
									<span className='gz-order-info-value font-monospace' style={{ fontSize: '13px' }}>
										{orderData?.gateway_order_id || 'N/A'}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Gateway Transaction ID</span>
									<span className='gz-order-info-value font-monospace' style={{ fontSize: '13px' }}>
										{orderData?.gateway_transaction_id || 'N/A'}
									</span>
								</div>
							</div>

							{/* Notes Section if any */}
							{orderData?.notes && (
								<div className='pt-3 border-top'>
									<span className='gz-order-info-label mb-2 d-block'>Order Metadata &amp; Notes:</span>
									<ul className='mb-0 ps-4' style={{ fontSize: '13.5px' }}>
										{getJSONObjectListHTML(orderData.notes, orderData.user_id)}
									</ul>
								</div>
							)}
						</div>
					</div>

					{/* RAZORPAY PAYMENT DATA COLLAPSIBLE CARD (IF SHOWDIV) */}
					{showDiv && (
						<div className='gz-order-card'>
							<div
								className='gz-order-card-header'
								style={{ cursor: 'pointer' }}
								onClick={() => {
									const next = !razorpayOpen
									setRazorpayOpen(next)
									if (next && !razorpayData) {
										fetchRazorpayData(orderData.gateway_transaction_id, orderData.gateway)
									}
								}}>
								<h3 className='gz-order-card-title'>
									<FontAwesomeIcon icon={faCreditCard} className='icon' />
									<span>Razorpay Gateway Verification</span>
								</h3>
								<button type='button' className='btn btn-sm btn-light' style={{ pointerEvents: 'none' }}>
									<FontAwesomeIcon icon={razorpayOpen ? faChevronUp : faChevronDown} />
								</button>
							</div>

							{razorpayOpen && (
								<div className='gz-order-card-body'>
									{razorpayData ? (
										<div>
											<div className='gz-order-info-grid mb-4'>
												<div className='gz-order-info-item'>
													<span className='gz-order-info-label'>Payment ID</span>
													<span className='gz-order-info-value font-monospace' style={{ fontSize: '13px' }}>
														{razorpayData.id || 'N/A'}
													</span>
												</div>

												<div className='gz-order-info-item'>
													<span className='gz-order-info-label'>Gateway Amount</span>
													<span className='gz-order-info-value'>
														₹{(parseInt(razorpayData.amount || 0) / 100).toFixed(2)} {razorpayData.currency || 'INR'}
													</span>
												</div>

												<div className='gz-order-info-item'>
													<span className='gz-order-info-label'>Status</span>
													<span className='gz-order-info-value'>
														{statusShow(razorpayData.status)}
													</span>
												</div>

												<div className='gz-order-info-item'>
													<span className='gz-order-info-label'>Payment Method</span>
													<span className='gz-order-info-value text-capitalize'>
														{razorpayData.method || 'N/A'}
													</span>
												</div>

												<div className='gz-order-info-item'>
													<span className='gz-order-info-label'>Bank / Issuer</span>
													<span className='gz-order-info-value'>
														{razorpayData.bank || '-'}
													</span>
												</div>

												<div className='gz-order-info-item'>
													<span className='gz-order-info-label'>UPI / VPA</span>
													<span className='gz-order-info-value'>
														{razorpayData.vpa || '-'}
													</span>
												</div>

												<div className='gz-order-info-item'>
													<span className='gz-order-info-label'>Fees Deducted</span>
													<span className='gz-order-info-value'>
														₹{razorpayData.amount ? (razorpayData.amount / 100).toFixed(2) : '-'}
													</span>
												</div>

												<div className='gz-order-info-item'>
													<span className='gz-order-info-label'>Tax on Fees</span>
													<span className='gz-order-info-value'>
														₹{razorpayData.tax ? (razorpayData.tax / 100).toFixed(2) : '-'}
													</span>
												</div>
											</div>

											{/* Gateway Payer Contact */}
											<div className='pt-3 border-top'>
												<div className='row'>
													<div className='col-md-6'>
														<span className='gz-order-info-label'>Payer Email</span>
														<span className='gz-order-info-value d-block'>{razorpayData.email || 'N/A'}</span>
													</div>
													<div className='col-md-6'>
														<span className='gz-order-info-label'>Payer Contact</span>
														<span className='gz-order-info-value d-block'>{razorpayData.contact || 'N/A'}</span>
													</div>
												</div>
											</div>
										</div>
									) : (
										<div className='text-center py-4 text-muted'>
											Fetching Razorpay transaction details...
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>

				{/* RIGHT COLUMN: CUSTOMER DETAILS & QUICK STATS */}
				<div>
					{/* CUSTOMER CARD */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faUser} className='icon' />
								<span>Customer Details</span>
							</h3>
							{userData?._id && (
								<Link
									to={userProfileUrl}
									className='btn btn-sm btn-light-primary py-1 px-3'
									title='View Full User Profile'>
									Profile
								</Link>
							)}
						</div>

						<div className='gz-order-card-body'>
							<div className='gz-order-user-card'>
								<div className='gz-order-user-avatar'>
									{userData?.profile_image ? (
										<img
											src={`https://files.fggroup.in/${userData.profile_image}`}
											alt={userData?.first_name}
										/>
									) : (
										<span>{initials}</span>
									)}
								</div>
								<div className='gz-order-user-details'>
									<div className='gz-order-user-name'>
										{userData?.first_name || 'Customer'}{' '}
										{userData?.last_name || ''}
									</div>
									<div className='gz-order-user-meta'>
										ID: {userData?._id ? `${String(userData._id).slice(0, 8)}...` : '-'}
									</div>
								</div>
							</div>

							<div className='d-flex flex-column gap-3'>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Email Address</span>
									<span className='gz-order-info-value d-flex align-items-center gap-2'>
										<span>{userData?.email || 'N/A'}</span>
										{userData?.emailVerified ? (
											<FontAwesomeIcon
												icon={faCheckCircle}
												className='text-success'
												title='Verified'
											/>
										) : (
											<FontAwesomeIcon
												icon={faTimesCircle}
												className='text-danger'
												title='Unverified'
											/>
										)}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Mobile Number</span>
									<span className='gz-order-info-value d-flex align-items-center gap-2'>
										<span>
											{userData?.country_code ? `${userData.country_code} ` : ''}
											{userData?.mobile || 'N/A'}
										</span>
										{userData?.mobileVerified ? (
											<FontAwesomeIcon
												icon={faCheckCircle}
												className='text-success'
												title='Verified'
											/>
										) : (
											<FontAwesomeIcon
												icon={faTimesCircle}
												className='text-danger'
												title='Unverified'
											/>
										)}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* QUICK OVERVIEW SUMMARY CARD */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faShieldAlt} className='icon' />
								<span>Transaction Summary</span>
							</h3>
						</div>

						<div className='gz-order-card-body'>
							<div className='d-flex flex-column gap-3'>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Amount Charged</span>
									<span className='gz-order-info-value fs-4' style={{ color: '#168064' }}>
										₹{Number(orderData?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Paid Amount</span>
									<span className='gz-order-info-value' style={{ color: '#172B4D' }}>
										₹{Number(
											!isNaN(orderData?.payment_breakdowns?.paid_amount)
												? orderData.payment_breakdowns.paid_amount
												: orderData.amount || 0
										).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Order Status</span>
									<span className='gz-order-info-value'>
										{statusShow(orderData?.status)}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Gateway Mode</span>
									<span className='gz-order-info-value'>
										{orderData?.gateway || 'Online'}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export { OrderView }
export default OrderView
