import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import TableButton from '../../../../components/TableButton'
import { FetchRazorpayPaymentDetails, GetOrders } from '../../../../Functions/FGGroup'
import { DayJS } from '../../../../../_metronic/helpers/Utils'

const OrderView = () => {
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

	const fetchRazorpayData = async (payment_id: string, gateway: any) => {
		try {
			const response: any = await FetchRazorpayPaymentDetails({
				razorpay_id: payment_id,
				gateway: gateway,
			})
			setRezorpayData(response.data)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchOrderData = async () => {
		setLoading(true)
		try {
			const response: any = await GetOrders({ order_id: order_id })
			const data: any = response.data?.[0]

			if (!data) {
				console.error('No data found')
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
			const item =
				data.fitness_course ||
				data.fitness_plan ||
				data.digital_plan ||
				data?.books ||
				data.product ||
				data.ebook
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
						const data = productData.find((product: any) =>
							CheckProductData
								? product.fitness_course_subscription[0]._id
									? product.fitness_course_subscription[0]._id
									: product.book_subscription._id
								: product.submission_id == sub._id
						)
						return { ...sub, item_data: data }
					})
				} else {
					const CheckProductData = productData.find(
						(product: any) => product.fitness_course_subscription || product.book_subscription
					)
					const data = productData.find((product: any) =>
						CheckProductData
							? product.fitness_course_subscription[0]?._id
								? product.fitness_course_subscription[0]?._id
								: product.book_subscription?._id
							: product.submission_id == subscription?._id
					)
					newSubscription = { ...subscription, item_data: data }
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
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchOrderData()
	}, [])

	const statusShow = (status: string) => {
		switch (status) {
			case 'SUCCESS':
				return <span className='text-white fw-bold btn btn-success p-2 mb-1 fs-6'>Success</span>
			case 'PENDING':
				return <span className='text-dark fw-bold btn btn-warning p-2 mb-1 fs-6'>PENDING</span>
			case 'FAILED':
				return <span className='text-white fw-bold btn btn-danger p-2 mb-1 fs-6'>FAILED</span>
			case 'CANCELLED':
				return <span className='text-dark fw-bold btn btn-info p-2 mb-1 fs-6'>CANCELLED</span>
			case 'REFUNDED':
				return <span className='text-white fw-bold btn btn-primary p-2 mb-1 fs-6'>REFUNDED</span>
			default:
				return null
		}
	}

	const handleButtonClick = (id: string, type: string) => {
		switch (type) {
			case 'book':
				window.open(`/fgiit/book-order-view?order_id=${id}`)
				break
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
		return `<a href="/fgiit/scholarship-result/submissionResult?user_id=${userID}&submission_id=${submissionID}" target="_blank">${submissionID}</a>`
	}

	const getJSONObjectListHTML = (object: any, userID?: any) => {
		const listItems = []
		if (typeof object === 'object') {
			for (const key in object) {
				if (Object.prototype.hasOwnProperty.call(object, key)) {
					let value = object[key]
					if (key === 'scholarship_submission_id') {
						value = getSubmissionResultPage(value, userID)
					}
					listItems.push(
						<li key={key}>
							<strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong>{' '}
							<span dangerouslySetInnerHTML={{ __html: value }} />
						</li>
					)
				}
			}
		}
		return listItems
	}

	const formatOrderItemType = (orderItemType: string) => {
		return orderItemType
			?.toLowerCase()
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ')
	}

	function viewFitnessOrder(
		fitness_course_id: string,
		order_id: string,
		type?: string,
		book_order_id?: any
	) {
		if (type == 'BOOKS') {
			window.open(`/fgiit/book-order-view?order_id=${book_order_id}`)
		} else {
			window.open(
				`/fgiit/user/user-fitness-course-view?user_fitness_course_id=${fitness_course_id}&order_id=${order_id}`
			)
		}
	}

	function viewItemOrder(item_id: string, type?: string) {
		if (type == 'BOOKS') {
			window.open(`/fgiit/books/book-view?book_id=${item_id}`)
		} else {
			window.open(`/fgiit/fitness-courses?course_id=${item_id}`)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Order View</PageTitle>

			{/* <div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Order Overview</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view'
					className='collapse show'>
					<div className='card-body border-top p-9'>
						<div className='row'>
							<div className='col-md-12 fv-row mb-7'>
								<div className='table-responsive d-md-block d-none'>
									<table
										id='kt_table_users'
										className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
										<thead>
											<tr className='fw-bold text-muted'>
												<th>Order ID:</th>
												<th>Receipt ID:</th>
												<th>Order Date/Time:</th>
												<th>Gateway:</th>
												<th>Status:</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{orderData?._id || 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{orderData.receipt_id || 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														Create: {DayJS(orderData.createdAt).format('MMMM D, YYYY h:mm A')}
													</span>
													<br />
													<span className='text-dark fw-bold   mb-1 fs-6'>
														Modification: {DayJS(orderData.updateAt).format('MMMM D, YYYY h:mm A')}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{orderData.gateway}
													</span>
												</td>
												<td>{statusShow(orderData.status)}</td>
											</tr>
										</tbody>
									</table>
								</div>

								<div className='table-responsive d-md-none d-block'>
									<div className='fw-bold text-muted'>
										<div className='mb-3'>
											<div>
												<b>Order ID:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{orderData?._id || 'N/A'}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Receipt ID:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{orderData.receipt_id || 'N/A'}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Order Date/Time:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												<b>Create:</b> {DayJS(orderData.createdAt).format('MMMM D, YYYY h:mm A')}
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												<b>Modification:</b>{' '}
												{DayJS(orderData.updateAt).format('MMMM D, YYYY h:mm A')}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Gateway:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{orderData.gateway}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Status:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{statusShow(orderData.status)}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div> */}

			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_user_view'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>User Details</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_user_view'
					className='collapse show'>
					<div className='card-body border-top mt-4 mb-4'>
						<div className='row'>
							<div className='col-md-12 fv-row mb-7'>
								<div className='table-responsive d-md-block d-none'>
									<table
										id='kt_table_users'
										className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
										<thead>
											<tr className='fw-bold text-muted'>
												<th>ID:</th>
												<th>Full Name:</th>
												<th>
													Email
													{userData.emailVerified ? (
														<i
															className='fas fa-check-circle text-success mx-1'
															title='Verified'></i>
													) : (
														<i
															className='fa-solid fa-circle-xmark text-danger mx-1'
															title='Verification Pending'></i>
													)}
													:
												</th>
												<th>
													Mobile
													{userData.mobileVerified ? (
														<i
															className='fas fa-check-circle text-success mx-1'
															title='Verified'></i>
													) : (
														<i
															className='fa-solid fa-circle-xmark text-danger mx-1'
															title='Verification Pending'></i>
													)}
													:
												</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{userData?._id || '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{(userData.first_name || '-') + ' ' + (userData.last_name || '')}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{userData.email || '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{(userData.country_code || '') + ' ' + (userData.mobile || '-')}
													</span>
												</td>
											</tr>
										</tbody>
									</table>
								</div>

								<div className='table-responsive d-md-none d-block'>
									<div className='fw-bold text-muted'>
										<div className='mb-3'>
											<div>
												<b>ID:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>{userData?._id || '-'}</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Full Name:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{(userData.first_name || '-') + ' ' + (userData.last_name || '')}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>
													Email
													{userData.emailVerified ? (
														<i
															className='fas fa-check-circle text-success mx-1'
															title='Verified'></i>
													) : (
														<i
															className='fa-solid fa-circle-xmark text-danger mx-1'
															title='Verification Pending'></i>
													)}
													:
												</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>{userData.email || '-'}</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>
													Mobile
													{userData.mobileVerified ? (
														<i
															className='fas fa-check-circle text-success mx-1'
															title='Verified'></i>
													) : (
														<i
															className='fa-solid fa-circle-xmark text-danger mx-1'
															title='Verification Pending'></i>
													)}
													:
												</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{(userData.country_code || '') + ' ' + (userData.mobile || '-')}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className='col-md-12 fv-row mt-5 mb-2 d-flex justify-content-end'>
							<TableButton
								action='view'
								to='/fgiit/users/view-user'
								text='View User'
								backgroundDark={true}
							/>
						</div>
					</div>
				</div>
			</div>

			{subscriptionData?.book_id || subscriptionData?.length > 0 ? (
				<div className='card mb-5 mb-xl-10'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_user_s'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bold'>Subscription Details</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_user_s'
						className='collapse show'>
						<div className='card-body border-top mt-4 mb-4'>
							<div className='row'>
								<div className='col-md-12 fv-row mb-7'>
									<div className='table-responsive'>
										{subscriptionData && subscriptionData.type ? (
											subscriptionData.type === 'error' ? (
												<span>Data not found or Payment failed</span>
											) : (
												<button
													className='btn btn-primary btn-md'
													onClick={() =>
														handleButtonClick(subscriptionData.id, subscriptionData.type)
													}>
													Track Order
												</button>
											)
										) : (
											<table
												id='kt_table_users'
												className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
												<thead>
													<tr className='fw-bold text-muted'>
														<th>Subscription ID:</th>
														<th>Item:</th>
														<th>Item Type:</th>
														{Array.isArray(subscriptionData) &&
															subscriptionData[0].duration?.duration && <th>Duration:</th>}
														<th>
															{Array.isArray(subscriptionData) &&
															subscriptionData[0].duration?.duration
																? 'Start '
																: 'Puchased '}{' '}
															Date:
														</th>
														{Array.isArray(subscriptionData) &&
															subscriptionData[0].duration?.duration && (
																<th>End Date: (Expected/Fixed):</th>
															)}
														<th>Action:</th>
													</tr>
												</thead>
												<tbody>
													{Array.isArray(subscriptionData) ? (
														subscriptionData.map((subscription) => (
															<tr key={subscription?._id}>
																<td>
																	<span className='text-dark fw-bold  mb-1 fs-6'>
																		{subscription?._id || '-'}
																	</span>
																</td>
																<td>
																	<span className='text-dark fw-bold  mb-1 fs-6'>
																		{subscription?.item_data?.books?.book_title
																			? subscription?.item_data?.books?.book_title || '-'
																			: subscription?.item_data?.fitness_course?.course_name
																			? subscription?.item_data?.fitness_course?.course_name || '-'
																			: subscription?.item_data?.name || '-'}
																	</span>
																	<br />
																	<span className='text-dark fw-bold  mb-1 fs-6'>
																		ID:{' '}
																		{subscription?.item_data?.id
																			? subscription?.item_data?.id || '-'
																			: subscription?.item_data?.fitness_course?._id
																			? subscription?.item_data?.fitness_course?._id || '-'
																			: subscription?.item_data?.books?._id || '-'}
																	</span>
																</td>
																<td>
																	<span className='text-dark fw-bold  mb-1 fs-6'>
																		{subscription?.item_data?.fitness_course
																			? String(subscription?.item_data?.order_item_type)
																					.split('_')
																					.join(' ') || '-'
																			: String(subscription?.item_data?.type)
																					.split('_')
																					.join(' ') || '-'}
																	</span>
																</td>
																{subscription.duration?.duration && (
																	<td>
																		<span className='text-dark fw-bold  mb-1 fs-6'>
																			{subscription.duration?.duration +
																				' ' +
																				subscription.duration?.unit}
																		</span>
																	</td>
																)}
																<td>
																	<span className='text-dark fw-bold  mb-1 fs-6'>
																		{DayJS(
																			subscription.start_date || subscription.createdAt
																		).format('DD/MM/YYYY, hh:mm:ss A') || '-'}
																	</span>
																</td>
																{subscription.duration?.duration && (
																	<td>
																		<span className='text-dark fw-bold  mb-1 fs-6'>
																			{DayJS(subscription.end_date).format(
																				'DD/MM/YYYY, hh:mm:ss A'
																			) || '-'}
																		</span>
																	</td>
																)}
																<td>
																	{(itemData?.length > 0 &&
																		itemData?.[0]?.order_item_type == 'FITNESS_COURSE') ||
																	itemData?.[0]?.order_item_type == 'BOOKS' ? (
																		// <TableButton
																		// 	action='view'
																		// 	onClick={() =>
																		// 		viewFitnessOrder(
																		// 			subscription?.item_data?.fitness_course_subscription?.[0]
																		// 				?._id,
																		// 			subscription?.item_data?.id
																		// 		)
																		// 	}
																		// />
																		<div className='d-flex'>
																			<TableButton
																				action='view'
																				text='View Item'
																				backgroundDark={true}
																				showIcon={false}
																				onClick={() =>
																					viewItemOrder(
																						subscription?.book_id
																							? subscription?.book_id
																							: subscription?.course_id,
																						subscription?.item_data?.type
																					)
																				}
																			/>
																			<TableButton
																				action='view'
																				text='View Subscription'
																				backgroundDark={true}
																				showIcon={false}
																				onClick={() =>
																					viewFitnessOrder(
																						subscription?.item_data?.submission_id
																							? subscription?.item_data?.submission_id
																							: subscription?._id,
																						subscription?.item_data?.id,
																						subscription?.item_data?.type,
																						order_id
																					)
																				}
																			/>
																		</div>
																	) : itemData?.[0]?.type == 'FITNESS_COURSE' ||
																	  itemData?.[0]?.type == 'BOOKS' ? (
																		<div className='d-flex'>
																			<TableButton
																				action='view'
																				text='View Item'
																				backgroundDark={true}
																				showIcon={false}
																				onClick={() =>
																					viewItemOrder(
																						subscription?.book_id
																							? subscription?.book_id
																							: subscription?.course_id,
																						subscription?.item_data?.type
																					)
																				}
																			/>
																			<TableButton
																				action='view'
																				text='View Subscription'
																				backgroundDark={true}
																				showIcon={false}
																				onClick={() =>
																					viewFitnessOrder(
																						subscription?.item_data?.submission_id,
																						subscription?.item_data?.id,
																						subscription?.item_data?.type,
																						order_id
																					)
																				}
																			/>
																		</div>
																	) : (
																		''
																	)}
																</td>
															</tr>
														))
													) : (
														<tr>
															<td>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	{subscriptionData?._id || '-'}
																</span>
															</td>
															<td>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	{subscriptionData?.item_data?.books?.book_title
																		? subscriptionData?.item_data?.books?.book_title || '-'
																		: subscriptionData?.item_data?.fitness_course?.course_name
																		? subscriptionData?.item_data?.fitness_course?.course_name ||
																		  '-'
																		: subscriptionData?.item_data?.name || '-'}
																</span>
																<br />
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	ID:{' '}
																	{subscriptionData?.item_data?.id
																		? subscriptionData?.item_data?.id || '-'
																		: subscriptionData?.item_data?.fitness_course?._id
																		? subscriptionData?.item_data?.fitness_course?._id || '-'
																		: subscriptionData?.item_data?.books?._id || '-'}
																</span>
															</td>
															<td>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	{subscriptionData?.item_data?.order_item_type
																		? String(subscriptionData?.item_data?.order_item_type)
																				.split('_')
																				.join(' ') || '-'
																		: String(subscriptionData?.item_data?.type)
																				.split('_')
																				.join(' ') || '-'}
																</span>
															</td>
															{subscriptionData.duration?.duration && (
																<td>
																	<span className='text-dark fw-bold  mb-1 fs-6'>
																		{subscriptionData.duration?.duration +
																			' ' +
																			subscriptionData.duration?.unit}
																	</span>
																</td>
															)}
															<td>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	{DayJS(
																		subscriptionData.start_date || subscriptionData.createdAt
																	).format('DD/MM/YYYY, hh:mm:ss A') || '-'}
																</span>
															</td>
															<td>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	{DayJS(subscriptionData.end_date).format(
																		'DD/MM/YYYY, hh:mm:ss A'
																	) || '-'}
																</span>
															</td>
															<td>
																{(itemData?.length > 0 &&
																	itemData?.[0]?.order_item_type == 'FITNESS_COURSE') ||
																itemData?.[0]?.order_item_type == 'BOOKS' ? (
																	<div className='d-flex'>
																		<TableButton
																			action='view'
																			text='View Item'
																			backgroundDark={true}
																			showIcon={false}
																			onClick={() =>
																				viewItemOrder(
																					subscriptionData?.item_data?.books?._id
																						? subscriptionData?.item_data?.books?._id
																						: subscriptionData?.item_data?.id,
																					subscriptionData?.item_data?.order_item_type
																				)
																			}
																		/>
																		<TableButton
																			action='view'
																			text='View Subscription'
																			backgroundDark={true}
																			showIcon={false}
																			onClick={() =>
																				viewFitnessOrder(
																					subscriptionData?.item_data?.book_subscription?._id,
																					subscriptionData?.item_data?.id,
																					subscriptionData?.item_data?.order_item_type,
																					order_id
																				)
																			}
																		/>
																	</div>
																) : itemData?.[0]?.type == 'FITNESS_COURSE' ||
																  itemData?.[0]?.type == 'BOOKS' ? (
																	<div className='d-flex'>
																		<TableButton
																			action='view'
																			text='View Item'
																			backgroundDark={true}
																			showIcon={false}
																			onClick={() =>
																				viewItemOrder(
																					subscriptionData?.item_data?.id
																						? subscriptionData?.item_data?.id
																						: subscriptionData?.item_data?.fitness_course?._id,
																					subscriptionData?.item_data?.type
																				)
																			}
																		/>
																		<TableButton
																			action='view'
																			text='View Subscription'
																			backgroundDark={true}
																			showIcon={false}
																			onClick={() =>
																				viewFitnessOrder(
																					subscriptionData?.item_data?.submission_id,
																					subscriptionData?.item_data?.id,
																					subscriptionData?.item_data?.type,
																					order_id
																				)
																			}
																		/>
																	</div>
																) : (
																	''
																)}
															</td>
														</tr>
													)}
												</tbody>
											</table>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className='card mb-5 mb-xl-10'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_item_data'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Item Details</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_item_data'
						className='collapse show'>
						<div className='card-body border-top mt-4 mb-4'>
							<div className='row'>
								<div className='col-md-12 fv-row mb-7'>
									<div className='table-responsive'>
										<table
											id='kt_table_users'
											className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
											<thead>
												<tr className='fw-bold text-muted'>
													<th>Item ID:</th>
													<th>Item Name:</th>
													{(itemData?.length > 0 &&
														itemData?.[0]?.order_item_type == 'FITNESS_COURSE') ||
													itemData?.[0]?.type == 'FITNESS_COURSE' ||
													itemData?.[0]?.order_item_type == 'PT_PLAN' ||
													itemData?.[0]?.order_item_type == 'EBOOKS' ? (
														''
													) : (
														<th>Quantity:</th>
													)}
													<th>Item Type:</th>
													<th>Amount/Price:</th>
													{(itemData?.length > 0 &&
														itemData?.[0]?.order_item_type == 'FITNESS_COURSE') ||
													itemData?.[0]?.type == 'FITNESS_COURSE' ? (
														<th>Action:</th>
													) : (
														''
													)}
												</tr>
											</thead>
											<tbody>
												{loading ? (
													<tr>
														<td
															colSpan={12}
															className='text-center'>
															<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
																<div
																	className='spinner-border text-primary'
																	role='status'>
																	<span className='visually-hidden'>Loading...</span>
																</div>
															</div>
														</td>
													</tr>
												) : (
													itemData?.length > 0 &&
													itemData.map((item: any, index: number) => (
														<tr key={index}>
															<td>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	{item?.id || '-'}
																</span>
															</td>
															<td>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	{item?.books
																		? item?.books?.book_title || '-'
																		: item?.fitness_course
																		? item?.fitness_course?.course_name || '-'
																		: item?.fitness_plan
																		? item?.fitness_plan?.plan_name || '-'
																		: item?.ebook
																		? item?.ebook?.ebook_title || '-'
																		: item?.name || '-'}
																</span>
															</td>
															{(itemData?.length > 0 &&
																itemData?.[0]?.order_item_type == 'FITNESS_COURSE') ||
															item?.type == 'FITNESS_COURSE' ||
															itemData?.[0]?.order_item_type == 'PT_PLAN' ||
															itemData?.[0]?.order_item_type == 'EBOOKS' ? (
																''
															) : (
																<td>
																	<span className='text-dark fw-bold  mb-1 fs-6'>
																		{item?.books ? item?.notes?.quantity || '-' : item?.qty || '-'}
																	</span>
																</td>
															)}
															<td>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	{item?.books ||
																	item?.fitness_course ||
																	item?.fitness_plan ||
																	item?.ebook
																		? String(item?.order_item_type).split('_').join(' ') || '-'
																		: String(item?.type).split('_').join(' ') || '-'}
																</span>
															</td>
															<td>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	{item?.books
																		? Number(item?.amount || 0).toFixed(2) + ' ' + 'INR'
																		: Number(item?.amount || 0).toFixed(2) + ' ' + 'INR'}
																</span>
															</td>
															<td>
																<div className='d-flex'>
																	{/* <TableButton
																		action='view'
																		text='View Item'
																		backgroundDark={true}
																		showIcon={false}
																		onClick={() =>
																			viewItemOrder(
																				item?.book_id
																					? item?.book_id
																					: item?.course_id,
																				item?.item_data?.type
																			)
																		}
																	/> */}
																	{itemData?.length > 0 &&
																	itemData?.[0]?.order_item_type == 'FITNESS_COURSE' ? (
																		<TableButton
																			action='view'
																			onClick={() =>
																				viewFitnessOrder(
																					item?.fitness_course_subscription?.[0]?._id,
																					item?.id
																				)
																			}
																		/>
																	) : itemData?.[0]?.type == 'FITNESS_COURSE' ? (
																		<TableButton
																			action='view'
																			onClick={() =>
																				viewFitnessOrder(item?.submission_id, item?.id)
																			}
																		/>
																	) : (
																		''
																	)}
																</div>
															</td>
														</tr>
													))
												)}
											</tbody>
										</table>
										{itemData?.length === 0 && !loading && (
											<div className='d-flex text-center w-100 align-content-center justify-content-center mt-7 mb-2'>
												<b>No records found</b>
											</div>
										)}
									</div>

									{/* <div className='table-responsive d-md-none d-block'>
									<div className='fw-bold text-muted'>
										<div className='mb-3'>
											<div>
												<b>Item ID:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{itemData?._id ? itemData?._id : '-'}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Item Name:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{itemData?.plan_name ||
													itemData?.course_name ||
													itemData?.book_title ||
													itemData?.name ||
													itemData?.ebook_title ||
													'err#CheckResponse'}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Item Type:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{orderData.order_item_type
													? formatOrderItemType(orderData.order_item_type)
													: 'N/A'}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Amount/Price:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{Number(itemData?.amount || itemData?.price).toFixed(2) +
													' ' +
													(itemData?.currency || 'INR')}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Duration (in days):</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{itemData?.duration ? itemData?.duration_days + ' Days' : '-'}
											</div>
										</div>
									</div>
								</div> */}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_user_payment'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bold'>Order & Payment Overview</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					className='collapse show'
					id='kt_user_payment'>
					<div className='card-body border-top mt-4 mb-4'>
						<div className='col-md-12 fv-row mb-7'>
							{/* <div className='table-responsive d-md-block d-none'>
								<table
									id='kt_table_users'
									className='table table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th>ID:</th>
											<th>Purchase mode:</th>
											<th>Receipt:</th>
											<th>Price:</th>
											<th>Order Date/Time:</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													{orderData?._id}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													{orderData.purchase_mode}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													{orderData.receipt_id}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													₹ {orderData.amount}
												</span>
											</td>
											<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														Create: {DayJS(orderData.createdAt).format('MMMM D, YYYY h:mm A')}
													</span>
													<br />
													<span className='text-dark fw-bold   mb-1 fs-6'>
														Modification: {DayJS(orderData.updateAt).format('MMMM D, YYYY h:mm A')}
													</span>
												</td>
										</tr>
									</tbody>
								</table>
								<div className='border-bottom mt-3'></div>
								<div className='border-top'></div>
								<div className='border-top'></div>
								<div className='border-top mb-3'></div>
								<table
									id='kt_table_users'
									className='table table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th>Status:</th>
											<th>Gateway:</th>
											<th>Gateway Order ID:</th>
											<th>Gateway Payment ID:</th>
											<th>Notes:</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<span className='text-dark fw-bold mb-1 fs-6'>
													{statusShow(orderData.status)}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													{orderData.gateway}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													{orderData.gateway_order_id}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													{orderData.gateway_transaction_id}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													{getJSONObjectListHTML(orderData.notes, orderData.user_id) || 'N/A'}
												</span>
											</td>
										</tr>
									</tbody>
								</table>
							</div> */}

							<div className='fw-bold text-muted'>
								<div className='row'>
									<div className='col-md-6 border-right'>
										<div className='mb-3'>
											<div>
												<b>ID:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>{orderData?._id}</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Purchase mode:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>{orderData.purchase_mode}</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Receipt:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>{orderData.receipt_id}</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Price:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>₹ {orderData.amount}</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Order Date/Time:</b>
											</div>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												Create: {DayJS(orderData.createdAt).format('MMMM D, YYYY h:mm A')}
											</span>
											<br />
											<span className='text-dark fw-bold   mb-1 fs-6'>
												Modification: {DayJS(orderData.updateAt).format('MMMM D, YYYY h:mm A')}
											</span>
										</div>
										<div className='mb-3'>
											<div>
												<b>Status:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{statusShow(orderData.status)}
											</div>
										</div>
									</div>
									<div className='col-md-6'>
										<div className='mb-3'>
											<div>
												<b>Gateway:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>{orderData.gateway}</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Gateway Order ID:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{orderData.gateway_order_id}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Gateway Payment ID:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{orderData.gateway_transaction_id}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Notes:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{getJSONObjectListHTML(orderData.notes, orderData.user_id) || 'N/A'}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{showDiv && (
				<div className='card mb-5 mb-xl-10'>
					<button
						className='card-header row border-0 cursor-pointer'
						data-bs-toggle='collapse'
						data-bs-target='#kt_user_raz'
						onClick={() => fetchRazorpayData(orderData.gateway_transaction_id, orderData.gateway)}>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bold'>Razorpay Payment Data</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</button>
					<div
						className='collapse'
						id='kt_user_raz'>
						<div className='card-body border-top mt-4 mb-4'>
							{razorpayData ? (
								<div className='col-md-12 fv-row mb-7'>
									<div className='row'>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Payment ID'
												type='text'
												className='col-12 fv-row mb-2'
												name='PaymentID'
												label='Payment ID'
												htmlFor='PaymentID'
												value={razorpayData.id || 'N/A'}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Price'
												type='number'
												className='col-12 fv-row mb-2'
												name='Price'
												label='Price'
												htmlFor='Price'
												value={(parseInt(razorpayData.amount) / 100).toString()}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Currency'
												type='text'
												className='col-12 fv-row mb-2'
												name='Currency'
												label='Currency'
												htmlFor='Currency'
												value={razorpayData.currency || 'N/A'}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Status'
												type='text'
												className='col-12 fv-row mb-2'
												name='Status'
												label='Status'
												htmlFor='Status'
												value={razorpayData.status}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Created At'
												type='date'
												className='col-12 fv-row mb-2'
												name='CreatedAt'
												label='Created At'
												htmlFor='CreatedAt'
												value={DayJS(orderData.createdAt).format('YYYY-MM-DD')}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Description'
												type='text'
												className='col-12 fv-row mb-2'
												name='Description'
												label='Description'
												htmlFor='Description'
												value={razorpayData.description || 'N/A'}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Method'
												type='text'
												className='col-12 fv-row mb-2'
												name='Method'
												label='Method'
												htmlFor='Method'
												value={razorpayData.method || 'N/A'}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Bank'
												type='text'
												className='col-12 fv-row mb-2'
												name='Bank'
												label='Bank'
												htmlFor='Bank'
												value={razorpayData.bank || '-'}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Wallet'
												type='text'
												className='col-12 fv-row mb-2'
												name='Wallet'
												label='Wallet'
												htmlFor='Wallet'
												value={razorpayData.wallet || '-'}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='VPA'
												type='text'
												className='col-12 fv-row mb-2'
												name='VPA'
												label='VPA'
												htmlFor='VPA'
												value={razorpayData.vpa || '-'}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='Card ID'
												type='text'
												className='col-12 fv-row mb-2'
												name='CardID'
												label='Card ID'
												htmlFor='CardID'
												value={razorpayData.card_id || '-'}
												disabled
											/>
										</div>
										<div className='col-md-3 fv-row mb-2'>
											<InputField
												placeholder='International'
												type='text'
												className='col-12 fv-row mb-2'
												name='International'
												label='International'
												htmlFor='International'
												value={razorpayData.international || '-'}
												disabled
											/>
										</div>
									</div>
									<div className=''>
										<div className='border-top'>
											<p className='fw-bold text-dark fs-5 mt-10'>Notes:</p>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												<ul className='text-dark fw-bold  mb-1 fs-6'>
													{getJSONObjectListHTML(razorpayData.notes, orderData.user_id)}
												</ul>
											</span>
										</div>

										<div className='border-top pt-3 mt-8'>
											<h4>Payment User Details</h4>
											<div className='row'>
												<div className='col-md-3'>
													<p>Email:</p>
													<p>{razorpayData.email || 'N/A'}</p>
												</div>
												<div className='col-md-3'>
													<p>Mobile:</p>
													<p>{razorpayData.contact || 'N/A'}</p>
												</div>
											</div>
										</div>

										<div className='border-top pt-3 mt-8'>
											<h4>Payment Fees/Charges</h4>
											<div className='row'>
												<div className='col-md-3'>
													<p>Fees Amount:</p>
													<p>{razorpayData.amount / 100 || 'N/A'}</p>
												</div>
												<div className='col-md-3'>
													<p>Tax Amount:</p>
													<p>{razorpayData.tax / 100 || 'N/A'}</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className='col-md-12 fv-row mb-7'>
									<p>No data found</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	)
}
export { OrderView }
