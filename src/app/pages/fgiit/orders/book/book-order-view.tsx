import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import '../../../../../_metronic/assets/css/tracking.css'
import { PageTitle } from '../../../../../_metronic/layout/core'
import TableButton from '../../../../components/TableButton'
import { GetOrders, SetBookOrderTrackingStatus } from '../../../../Functions/FGGroup'
import { DayJS } from '../../../../../_metronic/helpers/Utils'

const BookOrderView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const order_id: string | any = searchParams.get('order_id')
	const [userData, setUserData] = useState<any>('')
	const [activeStep, setActiveStep] = useState(0)
	const [itemData, setItemData] = useState<any>('')
	const [orderData, setOrderData] = useState<any>([])
	const [showDiv, setShowDiv] = useState(false)
	const [productData, setProductData] = useState<any[]>([])

	const handleStepClick = async (
		id: string,
		shipment_status: ShipmentStatusValue,
		status: boolean,
		step: number
	) => {
		Swal.fire({
			title: 'Status Confirmation',
			text: 'Are you sure?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
		}).then(async (result) => {
			if (result.isConfirmed) {
				const payload = {
					user_book_id: id,
					status: !status,
					shipment_status: shipment_status,
				}
				try {
					await SetBookOrderTrackingStatus(payload)
					toast.success('Order Status Update successfully')
					setActiveStep(step)
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const steps: ShipmentStatusValue[] = ['PLACED', 'DISPATCHED', 'DELIVERED']

	const fetchOrderData = async () => {
		try {
			const response: any = await GetOrders({ order_id })
			const data = response.data[0]

			const user = data.user_info || {}
			const item =
				data.fitness_course ||
				data.fitness_plan ||
				data.digital_plan ||
				data.books ||
				data.product ||
				data.ebooks

			if (data.ebook_purchase_info) {
				setShowDiv(false)
			} else {
				setShowDiv(true)
			}

			setItemData(item)
			setUserData(user)
			setOrderData(data)

			const cartItems = data.CART || []
			const multipleItems = data.multiple_items || []
			let productData
			if (data.order_item_type === 'CART') {
				productData = multipleItems
					.map((multiItem: any) => {
						const cartItem = cartItems.find((cart: any) => cart._id === multiItem.item_id)
						if (cartItem) {
							return {
								name: multiItem.item_type == 'BOOKS' ? cartItem.book_title : cartItem.course_name,
								amount: multiItem.amount || 0,
								type: multiItem.item_type || 'Unknown',
								qty: multiItem.quantity || 1,
								id: multiItem._id || 'Unknown',
							}
						}
						return null
					})
					.filter(Boolean)
			} else if (data.order_item_type === 'BOOKS') {
				productData = [data]
			}

			setProductData(productData)

			if (data.book_subscription) {
				const tracking = data.book_subscription.tracking
				tracking.forEach((elem: any) => {
					if (elem.status) {
						const stepIndex = steps.indexOf(elem.shipment_status)
						if (stepIndex > -1) {
							setActiveStep(stepIndex)
						}
					}
				})
			}
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchOrderData()
	}, [])

	const formatOrderItemType = (orderItemType: string) => {
		return orderItemType
			?.toLowerCase()
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ')
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Book Subscription View</PageTitle>

			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_user_view'>
					<div className='card-title m-0 py-6 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>User Details</h3>
						<div>
							<TableButton
								action='view'
								to={'/fgiit/users/view-user?user_id=' + userData?._id}
								text='View User'
								backgroundDark={true}
								showIcon={false}
								className='me-5'
							/>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
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
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{userData?._id || '-'}
											</div>
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
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{userData.email || '-'}
											</div>
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
					</div>
				</div>
			</div>

			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_item_data'>
					<div className='card-title m-0 py-6 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Item Details</h3>
						<div>
							<TableButton
								action='view'
								to={'/fgiit/books/book-view?book_id=' + itemData?._id}
								text='View Book'
								backgroundDark={true}
								showIcon={false}
								className='me-5'
							/>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
				</div>
				<div
					id='kt_item_data'
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
												<th>Item ID:</th>
												<th>Item Name:</th>
												<th>Quantity:</th>
												<th>Item Type:</th>
												<th>Amount/Price:</th>
											</tr>
										</thead>
										<tbody>
											{productData?.length > 0 ? (
												productData.map((item: any, index: number) => (
													<tr key={index}>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{item?.id || '-'}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{item?.books ? item?.books?.book_title || '-' : item?.name || '-'}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{item?.books ? item?.notes?.quantity || '-' : item?.qty || '-'}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{item?.books
																	? item?.order_item_type || '-'
																	: formatOrderItemType(item?.type) || 'N/A'}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{item?.books
																	? Number(item?.amount || 0).toFixed(2) + ' ' + 'INR'
																	: Number(item?.amount || 0).toFixed(2) + ' ' + 'INR'}
															</span>
														</td>
													</tr>
												))
											) : (
												<tr>
													<td
														colSpan={5}
														className='text-center'>
														No products found
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>

								<div className='table-responsive d-md-none d-block'>
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
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{showDiv && (
				<div className='card mb-5 mb-xl-10'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_tracking_data'>
						<div className='card-title m-0 py-6 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Tracking Details</h3>
							<div className='d-flex align-items-center'>
								<TableButton
									action='assign'
									to={'/fgiit/all-order/view-order?order_id=' + order_id}
									text='Explore Order'
									backgroundDark={true}
									showIcon={false}
									className='me-5'
								/>
								<FontAwesomeIcon
									icon={faAngleDown}
									className='fs-3'
								/>
							</div>
						</div>
					</div>
					<div
						id='kt_tracking_data'
						className='collapse show'>
						<div className='card-body border-top mt-4 mb-4'>
							<div className='track'>
								{steps.map((step, index) => (
									<div
										key={step}
										className={`step ${activeStep >= index ? 'active' : ''}`}
										id={`${step?.toLowerCase()}_order`}>
										<button
											id={`btn_${step?.toLowerCase()}`}
											style={{ border: 'transparent', background: 'transparent' }}
											onClick={() =>
												handleStepClick(orderData?.book_subscription?._id, step, false, index)
											}>
											<span className='icon'>
												<i
													className={`fa ${
														index === 0 ? 'fa-check' : index === 1 ? 'fa-truck' : 'fa-box'
													} text-white`}></i>
											</span>
										</button>
										<span className='text'>{step.replace('_', ' ')}</span>
										<b id={`${step?.toLowerCase()}_order_date`}>
											{orderData?.book_subscription?.tracking?.find(
												(t: any) => t.shipment_status === step
											)?.updatedAt &&
											DayJS(
													orderData.book_subscription.tracking.find(
														(t: any) => t.shipment_status === step
													).updatedAt
												).format('DD-MM-YYYY hh:mm:ss A')}
										</b>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
export { BookOrderView }
