/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faBox,
	faCheck,
	faCheckCircle,
	faClock,
	faExternalLinkAlt,
	faTimesCircle,
	faTruck,
	faUser,
	faReceipt,
	faCreditCard,
	faShieldAlt,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	GetOrders,
	SetProductOrderTrackingStatus,
	UpdateOrder,
	CreateShiprocketShipmentAdmin,
	TrackShiprocketShipmentAdmin,
	RequestShiprocketPickupAdmin,
	GetShiprocketLabelAdmin,
	CancelShiprocketOrderAdmin,
	ShiprocketData,
} from '../../../Functions/FGGroup'
import '../products-theme.css'
import '../orders-theme.css'
import { getOrderContact } from './order-contact'

const ProductOrderView: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const order_id: string | any = searchParams.get('order_id')
	const [userData, setUserData] = useState<any>('')
	const [activeStep, setActiveStep] = useState(0)
	const [productData, setProductData] = useState<any[]>([])
	const [orderData, setOrderData] = useState<any>([])
	const [showDiv, setShowDiv] = useState(false)
	const [loading, setLoading] = useState(true)
	const [updatingStatus, setUpdatingStatus] = useState(false)
	const [shiprocketBusy, setShiprocketBusy] = useState(false)
	const [shiprocketInfo, setShiprocketInfo] = useState<ShiprocketData | null>(null)

	const handleOrderStatusChange = async (newStatus: OrderStatusValue) => {
		const targetId = orderData?._id || order_id
		if (!targetId) return

		Swal.fire({
			title: 'Update Order Status?',
			text: `Change order status from "${orderData?.status || 'PENDING'}" to "${newStatus}"?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#172B4D',
			cancelButtonColor: '#71809A',
			confirmButtonText: 'Yes, change status',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				setUpdatingStatus(true)
				try {
					await UpdateOrder({
						order_id: targetId,
						status: newStatus,
					})
					toast.success(`Order status updated to ${newStatus}`)
					fetchOrderData()
				} catch (err: any) {
					toast.error(err.message || 'Failed to update order status')
					console.error(err)
				} finally {
					setUpdatingStatus(false)
				}
			}
		})
	}

	const steps: ShipmentStatusValue[] = [
		'PLACED',
		'CONFIRMED',
		'SHIPPED',
		'OUT FOR DELIVERY',
		'DELIVERED',
	]

	const handleStepClick = async (
		id: string,
		shipment_status: ShipmentStatusValue,
		status: boolean,
		step: number
	) => {
		const targetId =
			id ||
			orderData?.meal_product?._id ||
			orderData?.user_meal_product?._id ||
			orderData?._id ||
			order_id

		if (!targetId) {
			toast.error('Order ID or Product ID is missing')
			return
		}

		Swal.fire({
			title: 'Update Shipment Status?',
			text: `Are you sure you want to change shipment status to "${shipment_status}"?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#172B4D',
			cancelButtonColor: '#71809A',
			confirmButtonText: 'Yes, update',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				const payload = {
					user_product_id: targetId,
					order_id: orderData?._id || order_id,
					status: !status,
					shipment_status: shipment_status,
				}
				try {
					await SetProductOrderTrackingStatus(payload)
					toast.success('Order Status updated successfully')
					setActiveStep(step)
					fetchOrderData()
				} catch (error: any) {
					toast.error(error.message || 'Failed to update order status')
					console.error(error)
				}
			}
		})
	}

	const fetchOrderData = async () => {
		setLoading(true)
		try {
			const response: any = await GetOrders({ order_id })
			const data = response?.data?.[0] || {}
			const user = getOrderContact(data)

			if (data.ebook_purchase_info) {
				setShowDiv(false)
			} else {
				setShowDiv(true)
			}

			const cartItems = data.CART || []
			const multipleItems = data.multiple_items || []
			let pData: any[] = []

			if (data.order_item_type === 'CART') {
				pData = multipleItems
					.map((multiItem: any) => {
						const cartItem = cartItems.find((cart: any) => cart._id === multiItem.item_id)
						const itemName = cartItem?.name || multiItem?.notes?.product_name || multiItem?.name
						if (itemName) {
							const flavour = multiItem?.notes?.flavour ? ` (${multiItem.notes.flavour})` : ''
							return {
								name: `${itemName}${flavour}`,
								amount: multiItem.amount || cartItem?.price || 0,
								type: multiItem.item_type || 'Product',
								qty: multiItem.quantity || 1,
								id: multiItem._id || 'Unknown',
								image: cartItem?.displayImages?.[0] || cartItem?.display_image?.[0] || '',
							}
						}
						return null
					})
					.filter(Boolean)
				if (pData.length === 0 && cartItems.length > 0) {
					pData = cartItems.filter(Boolean).map((c: any) => ({
						name: c.name || 'N/A',
						amount: c.price || 0,
						type: 'Product',
						qty: 1,
						id: c._id || 'Unknown',
						image: c.displayImages?.[0] || c.display_image?.[0] || '',
					}))
				}
			} else if (
				data.order_item_type === 'FG_MEAL_PRODUCT' ||
				data.order_item_type === 'PURE_GO_MEAL_PRODUCT' ||
				data.order_item_type === 'PURE_GO_SAMPLE_MEAL_PRODUCT'
			) {
				if (data.product) {
					pData = [data.product]
				} else if (data.notes?.product_name) {
					const flavour = data.notes?.flavour ? ` (${data.notes.flavour})` : ''
					pData = [
						{
							name: `${data.notes.product_name}${flavour}`,
							amount: data.amount || 0,
							type: data.order_item_type,
							qty: 1,
						},
					]
				} else {
					pData = []
				}
			} else if (data.notes?.product_name) {
				const flavour = data.notes?.flavour ? ` (${data.notes.flavour})` : ''
				pData = [
					{
						name: `${data.notes.product_name}${flavour}`,
						amount: data.amount || 0,
						type: data.order_item_type || 'Product',
						qty: 1,
					},
				]
			}

			setProductData(pData)
			setUserData(user)
			setOrderData(data)

			const srData =
				data?.meal_product?.shiprocket ||
				data?.user_meal_product?.shiprocket ||
				(data?.notes?.shiprocket_order_id
					? {
							order_id: data.notes.shiprocket_order_id,
							shipment_id: data.notes.shiprocket_shipment_id,
							awb_code: data.notes.awb_code,
							courier_name: data.notes.courier_name,
							tracking_url: data.notes.tracking_url,
					  }
					: null)
			setShiprocketInfo(srData)

			const trackingList = data?.meal_product?.tracking || data?.user_meal_product?.tracking
			if (trackingList && Array.isArray(trackingList)) {
				let maxStepIndex = -1
				trackingList.forEach((elem: any) => {
					if (elem.status) {
						const statusName = elem.shipment_status === 'DISPATCHED' ? 'SHIPPED' : elem.shipment_status
						const stepIndex = steps.indexOf(statusName)
						if (stepIndex > maxStepIndex) {
							maxStepIndex = stepIndex
						}
					}
				})
				if (maxStepIndex > -1) {
					setActiveStep(maxStepIndex)
				}
			}
		} catch (error) {
			console.error('Error fetching order view:', error)
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

	const handlePushToShiprocket = async () => {
		const targetId = orderData?._id || order_id
		if (!targetId) return
		setShiprocketBusy(true)
		try {
			const res: any = await CreateShiprocketShipmentAdmin(targetId)
			if (res && res.status < 400) {
				toast.success('Shipment created in Shiprocket with AWB!')
				await fetchOrderData()
			} else {
				throw new Error(res?.message || 'Failed to push to Shiprocket')
			}
		} catch (err: any) {
			toast.error(err.message || 'Could not push to Shiprocket')
		} finally {
			setShiprocketBusy(false)
		}
	}

	const handleSyncShiprocketTracking = async () => {
		const targetId = orderData?._id || order_id
		if (!targetId) return
		if (!shiprocketInfo?.awb_code && !shiprocketInfo?.order_id) {
			toast.error('Order is not connected to Shiprocket yet.')
			return
		}
		setShiprocketBusy(true)
		try {
			const res: any = await TrackShiprocketShipmentAdmin(targetId, shiprocketInfo?.awb_code)
			if (res && res.status < 400) {
				if (res.data?.is_cancelled || res.data?.current_status === 'CANCELLED') {
					toast.error('Order was cancelled in Shiprocket. Local status updated to Cancelled.')
				} else {
					toast.success(`Live tracking synced: ${res.data?.current_status || 'Active'}`)
				}
				await fetchOrderData()
			} else {
				throw new Error(res?.message || 'Could not fetch tracking scans')
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to sync live tracking')
		} finally {
			setShiprocketBusy(false)
		}
	}

	const handleCancelOrder = async () => {
		const targetId = orderData?._id || order_id
		if (!targetId) return

		const result = await Swal.fire({
			title: 'Cancel this Order?',
			text: 'This will cancel the shipment in Shiprocket, cancel courier pickup, and return items to product stock.',
			icon: 'warning',
			input: 'text',
			inputPlaceholder: 'Reason for cancellation (optional)',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#6c757d',
			confirmButtonText: 'Yes, cancel order',
			cancelButtonText: 'No, keep order',
		})

		if (result.isConfirmed) {
			setShiprocketBusy(true)
			try {
				const res: any = await CancelShiprocketOrderAdmin(targetId, result.value || 'Cancelled by Admin')
				if (res && res.status < 400) {
					toast.success('Order and courier shipment cancelled successfully!')
					await fetchOrderData()
				} else {
					throw new Error(res?.message || 'Failed to cancel order')
				}
			} catch (err: any) {
				toast.error(err.message || 'Could not cancel order')
			} finally {
				setShiprocketBusy(false)
			}
		}
	}

	const handleRequestPickup = async () => {
		const targetId = orderData?._id || order_id
		if (!targetId) return
		if (!shiprocketInfo?.awb_code) {
			toast.error('Cannot schedule courier pickup until an AWB number is assigned.')
			return
		}
		setShiprocketBusy(true)
		try {
			const res: any = await RequestShiprocketPickupAdmin(targetId, shiprocketInfo?.shipment_id)
			if (res && res.status < 400) {
				toast.success('Courier pickup scheduled from Surat warehouse!')
				await fetchOrderData()
			} else {
				throw new Error(res?.message || 'Failed to schedule pickup')
			}
		} catch (err: any) {
			toast.error(err.message || 'Could not request courier pickup')
		} finally {
			setShiprocketBusy(false)
		}
	}

	const handleDownloadLabel = async () => {
		const targetId = orderData?._id || order_id
		if (!targetId) return
		if (!shiprocketInfo?.awb_code) {
			toast.error('Shipping label is not ready until courier and AWB are generated.')
			return
		}
		setShiprocketBusy(true)
		try {
			const res: any = await GetShiprocketLabelAdmin(targetId, shiprocketInfo?.shipment_id)
			if (res?.data?.label_url) {
				window.open(res.data.label_url, '_blank')
			} else {
				throw new Error(res?.message || 'Label URL not available')
			}
		} catch (err: any) {
			toast.error(err.message || 'Could not generate label')
		} finally {
			setShiprocketBusy(false)
		}
	}

	const formatOrderItemType = (orderItemType: string) => {
		if (!orderItemType) return 'N/A'
		return orderItemType
			.toLowerCase()
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ')
	}

	const renderStatusBadge = (status: string) => {
		const s = (status || '').toUpperCase()
		if (s === 'SUCCESS' || s === 'DELIVERED') {
			return <span className='gz-status-pill success'>{status || 'Success'}</span>
		}
		if (s === 'PENDING' || s === 'PLACED') {
			return <span className='gz-status-pill pending'>{status || 'Pending'}</span>
		}
		if (s === 'DISPATCHED') {
			return <span className='gz-status-pill dispatched'>Dispatched</span>
		}
		if (s === 'FAILED' || s === 'CANCELLED') {
			return <span className='gz-status-pill danger'>{status || 'Failed'}</span>
		}
		return <span className='gz-status-pill secondary'>{status || 'N/A'}</span>
	}

	const initials = `${(userData?.first_name || '').charAt(0)}${(userData?.last_name || '').charAt(0)}`.toUpperCase() || 'U'

	const trackingList = orderData?.meal_product?.tracking || orderData?.user_meal_product?.tracking || []

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Product Order View</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/product-order'>Product Orders</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Order #{orderData?.receipt_id || order_id || 'Details'}</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<div className='d-flex align-items-center gap-3 flex-wrap mb-1'>
						{loading ? (
							<div className='gz-skeleton rounded' style={{ width: '220px', height: '28px' }} />
						) : (
							<>
								<h1 className='gz-prod-title'>
									Order #{orderData?.receipt_id || order_id || 'Details'}
								</h1>
								<div className='d-flex align-items-center gap-2'>
									<select
										className={`gz-status-select gz-status-pill ${
											(orderData?.status || '').toLowerCase() === 'success'
												? 'success'
												: (orderData?.status || '').toLowerCase() === 'pending'
												? 'pending'
												: (orderData?.status || '').toLowerCase() === 'failed' || (orderData?.status || '').toLowerCase() === 'cancelled'
												? 'danger'
												: (orderData?.status || '').toLowerCase() === 'refunded'
												? 'primary'
												: 'secondary'
										}`}
										value={orderData?.status || 'PENDING'}
										disabled={updatingStatus}
										onChange={(e) => handleOrderStatusChange(e.target.value as OrderStatusValue)}
										title='Click to change order status'
									>
										<option value='SUCCESS'>SUCCESS</option>
										<option value='PENDING'>PENDING</option>
										<option value='CANCELLED'>CANCELLED</option>
										<option value='FAILED'>FAILED</option>
										<option value='REFUNDED'>REFUNDED</option>
									</select>
									{orderData?.order_status && orderData.order_status !== orderData.status && (
										renderStatusBadge(orderData.order_status)
									)}
								</div>
							</>
						)}
					</div>
					{loading ? (
						<div className='gz-skeleton rounded mt-1' style={{ width: '260px', height: '14px' }} />
					) : (
						<p className='gz-prod-subtitle'>
							Placed on {orderData?.createdAt ? DayJS(orderData.createdAt).format('DD MMMM YYYY, hh:mm A') : '-'}
							{orderData?.gateway ? ` via ${orderData.gateway}` : ''}
						</p>
					)}
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link
						to='/rag/product-order'
						className='gz-prod-btn-cancel'
						title='Back to Orders'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Orders</span>
					</Link>
					<Link
						to={`/rag/all-order/view-order?order_id=${order_id}`}
						className='gz-prod-btn-primary'
						title='Explore Complete Order Details'>
						<FontAwesomeIcon icon={faExternalLinkAlt} />
						<span>Explore Order</span>
					</Link>
				</div>
			</div>

      {orderData?.notes?.gym_access_offer?.qualified && <div className='gz-order-card p-5 mb-5'>
        <h2 className='fs-4'>{orderData.notes.gym_access_offer.gym_name} gym access · FREE</h2>
        <p className='mb-2'>{orderData.notes.gym_access_offer.months} month(s) included with this qualifying order. Gomzi subtotal: ₹{orderData.notes.gym_access_offer.eligible_amount}.</p>
        <p className='text-muted mb-0'>{orderData.notes.gym_access_offer.terms}</p>
        {orderData.status !== 'SUCCESS' && <p className='text-warning mt-2 mb-0'>Gym access becomes available when the order is successful.</p>}
      </div>}
			{/* =========================================================================
			    MAIN 2-COLUMN DASHBOARD LAYOUT
			    ========================================================================= */}
			{loading ? (
				<div className='gz-order-grid-layout'>
					{/* LEFT COLUMN SKELETON */}
					<div>
						{/* ITEMS CARD SKELETON */}
						<div className='gz-order-card'>
							<div className='gz-order-card-header'>
								<div className='gz-skeleton rounded' style={{ width: '180px', height: '20px' }} />
								<div className='gz-skeleton rounded' style={{ width: '100px', height: '16px' }} />
							</div>
							<div className='p-5'>
								{[...Array(3)].map((_, idx) => (
									<div key={`ord-skel-item-${idx}`} className='d-flex align-items-center justify-content-between py-3 border-bottom'>
										<div className='d-flex align-items-center gap-3'>
											<div className='gz-skeleton rounded-2' style={{ width: '48px', height: '48px', flexShrink: 0 }} />
											<div className='d-flex flex-column gap-1.5'>
												<div className='gz-skeleton rounded' style={{ width: '160px', height: '14px' }} />
												<div className='gz-skeleton rounded' style={{ width: '90px', height: '12px' }} />
											</div>
										</div>
										<div className='gz-skeleton rounded' style={{ width: '32px', height: '16px' }} />
										<div className='gz-skeleton rounded' style={{ width: '70px', height: '16px' }} />
									</div>
								))}
								<div className='d-flex justify-content-between align-items-center pt-4'>
									<div className='gz-skeleton rounded' style={{ width: '80px', height: '16px' }} />
									<div className='gz-skeleton rounded' style={{ width: '100px', height: '20px' }} />
								</div>
							</div>
						</div>

						{/* SHIPMENT TRACKING SKELETON */}
						<div className='gz-order-card'>
							<div className='gz-order-card-header'>
								<div className='gz-skeleton rounded' style={{ width: '220px', height: '20px' }} />
								<div className='gz-skeleton rounded' style={{ width: '80px', height: '18px' }} />
							</div>
							<div className='p-6'>
								<div className='gz-skeleton rounded mb-6' style={{ width: '60%', height: '14px' }} />
								<div className='d-flex justify-content-between align-items-center px-4 py-2'>
									{[...Array(3)].map((_, idx) => (
										<div key={`trk-skel-${idx}`} className='d-flex flex-column align-items-center gap-2'>
											<div className='gz-skeleton rounded-circle' style={{ width: '40px', height: '40px' }} />
											<div className='gz-skeleton rounded' style={{ width: '70px', height: '12px' }} />
											<div className='gz-skeleton rounded' style={{ width: '50px', height: '10px' }} />
										</div>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* RIGHT COLUMN SKELETON */}
					<div>
						{/* CUSTOMER CARD SKELETON */}
						<div className='gz-order-card'>
							<div className='gz-order-card-header'>
								<div className='gz-skeleton rounded' style={{ width: '140px', height: '20px' }} />
							</div>
							<div className='p-5'>
								<div className='d-flex align-items-center gap-3 mb-5'>
									<div className='gz-skeleton rounded-circle' style={{ width: '48px', height: '48px', flexShrink: 0 }} />
									<div className='d-flex flex-column gap-1.5'>
										<div className='gz-skeleton rounded' style={{ width: '120px', height: '16px' }} />
										<div className='gz-skeleton rounded' style={{ width: '80px', height: '12px' }} />
									</div>
								</div>
								<div className='d-flex flex-column gap-3'>
									<div className='d-flex justify-content-between align-items-center'>
										<div className='gz-skeleton rounded' style={{ width: '70px', height: '14px' }} />
										<div className='gz-skeleton rounded' style={{ width: '130px', height: '14px' }} />
									</div>
									<div className='d-flex justify-content-between align-items-center'>
										<div className='gz-skeleton rounded' style={{ width: '70px', height: '14px' }} />
										<div className='gz-skeleton rounded' style={{ width: '110px', height: '14px' }} />
									</div>
								</div>
							</div>
						</div>

						{/* PAYMENT OVERVIEW SKELETON */}
						<div className='gz-order-card'>
							<div className='gz-order-card-header'>
								<div className='gz-skeleton rounded' style={{ width: '160px', height: '20px' }} />
							</div>
							<div className='p-5'>
								<div className='d-flex flex-column gap-3'>
									{[...Array(5)].map((_, idx) => (
										<div key={`pay-skel-${idx}`} className='d-flex justify-content-between align-items-center'>
											<div className='gz-skeleton rounded' style={{ width: '85px', height: '14px' }} />
											<div className='gz-skeleton rounded' style={{ width: '110px', height: '14px' }} />
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className='gz-order-grid-layout'>
					{/* LEFT COLUMN: ORDER ITEMS + SHIPMENT TRACKING */}
					<div>
						{/* ORDER ITEMS CARD */}
						<div className='gz-order-card'>
							<div className='gz-order-card-header'>
								<h3 className='gz-order-card-title'>
									<FontAwesomeIcon icon={faBox} className='icon' />
									<span>Ordered Products ({productData?.length || 0})</span>
								</h3>
							<span className='gz-order-info-label'>
								Mode: {orderData?.purchase_mode || orderData?.order_item_type || 'Standard'}
							</span>
						</div>

						<div className='gz-order-card-body p-0'>
							{productData?.length > 0 ? (
								<div className='table-responsive'>
									<table className='gz-prod-table mb-0'>
										<thead>
											<tr>
												<th>Item</th>
												<th>Type</th>
												<th style={{ textAlign: 'center' }}>Qty</th>
												<th style={{ textAlign: 'right' }}>Amount</th>
											</tr>
										</thead>
										<tbody>
											{productData.map((item: any, index: number) => (
												<tr key={index}>
													<td>
														<div className='gz-prod-identity-cell'>
															<div className='gz-order-item-thumb'>
																{item.image ? (
																	<img
																		src={`https://files.fggroup.in/${item.image}`}
																		alt={item.name}
																		onError={(e) => {
																			;(e.target as HTMLElement).style.display = 'none'
																		}}
																	/>
																) : (
																	<FontAwesomeIcon icon={faBox} />
																)}
															</div>
															<div className='gz-prod-identity-info'>
																<span className='gz-prod-name'>{item.name || 'Product'}</span>
																<span className='gz-prod-subtext'>ID: {item.id || '-'}</span>
															</div>
														</div>
													</td>
													<td>
														<span className='badge bg-light text-dark fw-semibold'>
															{item.type ? formatOrderItemType(item.type) : 'Supplement'}
														</span>
													</td>
													<td style={{ textAlign: 'center' }}>
														<span className='gz-order-item-qty'>× {item.qty || 1}</span>
													</td>
													<td style={{ textAlign: 'right', fontWeight: 700, color: '#172B4D' }}>
														₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className='p-6 text-center text-muted'>
									{loading ? 'Loading order items...' : 'No products found for this order'}
								</div>
							)}

							{/* Summary totals box */}
							<div className='p-4 pt-0'>
								<div className='gz-order-summary-box'>
									<div className='gz-order-summary-row'>
										<span>Items Subtotal</span>
										<span>
											₹{Number(orderData?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
										</span>
									</div>
									<div className='gz-order-summary-row'>
										<span>Shipping &amp; Delivery</span>
										<span className='text-success fw-semibold'>Free / Included</span>
									</div>
									<div className='gz-order-summary-row total'>
										<span>Grand Total Paid</span>
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

					{/* SHIPMENT TRACKING CARD (IF SHOWDIV) */}
					{showDiv && (
						<div className='gz-order-card'>
							<div className='gz-order-card-header'>
								<h3 className='gz-order-card-title'>
									<FontAwesomeIcon icon={faTruck} className='icon' />
									<span>Shipment &amp; Delivery Tracking</span>
								</h3>
								<span className='badge bg-light text-dark'>
									Step {activeStep + 1} of {steps.length}
								</span>
							</div>

							<div className='gz-order-card-body'>
								<p className='text-muted fs-7 mb-4'>
									Click on any step below to advance or update order fulfillment status:
								</p>

								{/* Modern Stepper matching 5-step UI */}
								<div className='gz-order-tracker'>
									<div className='gz-order-tracker-line-bg' />
									<div
										className='gz-order-tracker-line-fill'
										style={{
											width: `${Math.max(0, Math.min(100, (activeStep / (steps.length - 1)) * 100))}%`,
										}}
									/>
									{steps.map((step, index) => {
										const isCompleted = activeStep >= index
										const trackInfo = trackingList?.find(
											(t: any) => t.shipment_status === step || (step === 'SHIPPED' && t.shipment_status === 'DISPATCHED')
										)
										const updatedTime = trackInfo?.updatedAt

										return (
											<div
												key={step}
												className={`gz-order-step ${isCompleted ? 'active' : ''}`}
												id={`${step.toLowerCase().replace(/\s+/g, '_')}_order`}>
												<button
													type='button'
													className='gz-order-step-btn'
													id={`btn_${step.toLowerCase().replace(/\s+/g, '_')}`}
													title={`Click to set status to ${step}`}
													onClick={() =>
														handleStepClick(
															orderData?.meal_product?._id ||
																orderData?.user_meal_product?._id ||
																orderData?._id ||
																order_id,
															step,
															false,
															index
														)
													}>
													<FontAwesomeIcon icon={faCheck} />
												</button>
												<span className='gz-order-step-label'>
													{step}
												</span>
												<span className='gz-order-step-time' id={`${step.toLowerCase().replace(/\s+/g, '_')}_order_date`}>
													{updatedTime
														? DayJS(updatedTime).format('DD MMM, hh:mm A')
														: isCompleted
														? 'Completed'
														: 'Pending'}
												</span>
											</div>
										)
									})}
								</div>
							</div>
						</div>
					)}

					{/* SHIPROCKET LOGISTICS & COURIER PARTNER CARD */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header d-flex justify-content-between align-items-center'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faTruck} className='icon text-primary' />
								<span>Shiprocket Logistics &amp; Courier Tracking</span>
							</h3>
							{orderData?.status === 'CANCELLED' || shiprocketInfo?.current_status === 'CANCELLED' ? (
								<span className='badge badge-light-danger fw-bold px-3 py-1'>
									Order Cancelled
								</span>
							) : shiprocketInfo?.awb_code ? (
								<span className='badge badge-light-success fw-bold px-3 py-1'>
									Courier Assigned: {shiprocketInfo.courier_name || 'Shiprocket'}
								</span>
							) : shiprocketInfo?.shipment_id ? (
								<span className='badge badge-light-info fw-bold px-3 py-1'>
									Shipment Created
								</span>
							) : (
								<span className='badge badge-light-warning fw-bold px-3 py-1'>
									Not Dispatched to Shiprocket
								</span>
							)}
						</div>

						<div className='gz-order-card-body'>
							{orderData?.status === 'CANCELLED' || shiprocketInfo?.current_status === 'CANCELLED' ? (
								<div className='alert alert-danger d-flex align-items-center justify-content-between p-4 mb-4 rounded'>
									<div className='d-flex align-items-center'>
										<FontAwesomeIcon icon={faTimesCircle} className='fs-2x me-3 text-danger' />
										<div>
											<div className='fw-bold text-danger fs-6'>Order &amp; Courier Shipment Cancelled</div>
											<div className='text-muted fs-8'>
												This order is cancelled in Shiprocket. Courier pickup is voided and product stock is restored.
												{orderData?.notes?.cancelled_reason && ` (Reason: ${orderData.notes.cancelled_reason})`}
											</div>
										</div>
									</div>
									<button
										type='button'
										disabled={shiprocketBusy}
										onClick={handleSyncShiprocketTracking}
										className='btn btn-sm btn-light-danger fw-bold text-nowrap ms-3'
									>
										{shiprocketBusy ? 'Syncing...' : 'Re-sync Shiprocket'}
									</button>
								</div>
							) : null}

							{shiprocketInfo?.awb_code || shiprocketInfo?.shipment_id ? (
								<div>
									<div className='row g-3 mb-4'>
										<div className='col-md-4'>
											<span className='text-muted fs-8 d-block mb-1'>Courier Partner</span>
											<span className='fw-bolder fs-6 text-dark d-block'>
												{shiprocketInfo.courier_name || 'Standard Courier'}
											</span>
										</div>

										<div className='col-md-4'>
											<span className='text-muted fs-8 d-block mb-1'>AWB Tracking Number</span>
											<span className='fw-bolder fs-6 text-primary d-block'>
												{shiprocketInfo.awb_code ? (
													<a
														href={
															shiprocketInfo.tracking_url ||
															`https://shiprocket.co/tracking/${shiprocketInfo.awb_code}`
														}
														target='_blank'
														rel='noopener noreferrer'
														className='text-primary text-decoration-underline'
														title='Open Live Courier Tracking'
													>
														{shiprocketInfo.awb_code} ↗
													</a>
												) : orderData?.status === 'CANCELLED' || shiprocketInfo?.current_status === 'CANCELLED' ? (
													<span className='text-danger'>Cancelled</span>
												) : (
													'Assigning AWB...'
												)}
											</span>
										</div>

										<div className='col-md-4'>
											<span className='text-muted fs-8 d-block mb-1'>Shiprocket Shipment ID</span>
											<span className='fw-bold fs-7 text-dark d-block'>
												#{shiprocketInfo.shipment_id || shiprocketInfo.order_id || 'N/A'}
											</span>
										</div>

										<div className='col-md-6'>
											<span className='text-muted fs-8 d-block mb-1'>Warehouse Pickup Location</span>
											<span className='fw-bold fs-7 text-dark d-block'>
												Surat Warehouse (G-23, Time Square)
											</span>
											<span className='badge badge-light-secondary fs-9 mt-1'>
												Status: {shiprocketInfo.pickup_status || 'PENDING SCHEDULE'}
											</span>
										</div>

										<div className='col-md-6'>
											<span className='text-muted fs-8 d-block mb-1'>Live Delivery Status</span>
											<span className={`badge fw-bolder fs-7 ${
												orderData?.status === 'CANCELLED' || shiprocketInfo?.current_status === 'CANCELLED'
													? 'badge-light-danger'
													: 'badge-light-primary'
											}`}>
												{orderData?.status === 'CANCELLED' || shiprocketInfo?.current_status === 'CANCELLED'
													? 'CANCELLED'
													: shiprocketInfo.current_status || 'IN TRANSIT'}
											</span>
										</div>
									</div>

									{!(orderData?.status === 'CANCELLED' || shiprocketInfo?.current_status === 'CANCELLED') && !shiprocketInfo.awb_code && (
										<div className='alert alert-warning d-flex align-items-center justify-content-between p-3 mb-4 rounded'>
											<div className='d-flex align-items-center'>
												<FontAwesomeIcon icon={faTruck} className='fs-3 me-3 text-warning' />
												<div>
													<div className='fw-bold text-dark fs-7'>Courier Allocation Pending (AWB Not Assigned Yet)</div>
													<div className='text-muted fs-8'>
														Shiprocket requires min ₹100 wallet balance to book a courier and generate an AWB. Once recharged, click the button to assign courier.
													</div>
												</div>
											</div>
											<button
												type='button'
												disabled={shiprocketBusy}
												onClick={handlePushToShiprocket}
												className='btn btn-sm btn-primary fw-bold text-nowrap ms-3'
											>
												<FontAwesomeIcon icon={faTruck} className='me-1' />
												{shiprocketBusy ? 'Allocating...' : 'Assign Courier / Generate AWB'}
											</button>
										</div>
									)}

									{/* Action buttons */}
									<div className='d-flex flex-wrap gap-2 pt-3 border-top'>
										{!(orderData?.status === 'CANCELLED' || shiprocketInfo?.current_status === 'CANCELLED') && !shiprocketInfo.awb_code && (
											<button
												type='button'
												disabled={shiprocketBusy}
												onClick={handlePushToShiprocket}
												className='btn btn-sm btn-primary fw-bold'
												title='Allocate courier and generate AWB'
											>
												<FontAwesomeIcon icon={faTruck} className='me-1' />
												{shiprocketBusy ? 'Allocating...' : 'Assign Courier / Generate AWB'}
											</button>
										)}

										<button
											type='button'
											disabled={shiprocketBusy}
											onClick={handleSyncShiprocketTracking}
											className='btn btn-sm btn-light-primary fw-bold'
											title='Sync real-time scans from courier partner'
										>
											<FontAwesomeIcon icon={faClock} className='me-1' />
											{shiprocketBusy ? 'Syncing...' : 'Sync Live Courier Status'}
										</button>

										{!(orderData?.status === 'CANCELLED' || shiprocketInfo?.current_status === 'CANCELLED') && (
											<>
												<button
													type='button'
													disabled={shiprocketBusy || !shiprocketInfo.awb_code}
													onClick={handleRequestPickup}
													className='btn btn-sm btn-light-success fw-bold'
													title='Request driver pickup from Surat warehouse'
												>
													<FontAwesomeIcon icon={faBox} className='me-1' />
													Request Warehouse Pickup
												</button>

												<button
													type='button'
													disabled={shiprocketBusy || !shiprocketInfo.awb_code}
													onClick={handleDownloadLabel}
													className='btn btn-sm btn-light fw-bold'
													title='Download thermal courier shipping label'
												>
													<FontAwesomeIcon icon={faReceipt} className='me-1' />
													Download Shipping Label (PDF)
												</button>

												<button
													type='button'
													disabled={shiprocketBusy}
													onClick={handleCancelOrder}
													className='btn btn-sm btn-light-danger fw-bold text-danger'
													title='Cancel order in Shiprocket and restore inventory'
												>
													<FontAwesomeIcon icon={faTimesCircle} className='me-1' />
													Cancel Order
												</button>
											</>
										)}

										{shiprocketInfo.awb_code && (
											<a
												href={
													shiprocketInfo.tracking_url ||
													`https://shiprocket.co/tracking/${shiprocketInfo.awb_code}`
												}
												target='_blank'
												rel='noopener noreferrer'
												className='btn btn-sm btn-light-info fw-bold ms-auto'
											>
												<FontAwesomeIcon icon={faExternalLinkAlt} className='me-1' />
												Live Courier Tracking
											</a>
										)}
									</div>
								</div>
							) : (
								<div className='d-flex flex-column align-items-start gap-3 py-2'>
									<p className='text-muted fs-7 mb-0'>
										This order has not been dispatched to Shiprocket yet. Click below to automatically create the shipment, assign a courier (Xpressbees, BlueDart, Delhivery), and generate the AWB tracking number.
									</p>
									<button
										type='button'
										disabled={shiprocketBusy}
										onClick={handlePushToShiprocket}
										className='btn btn-primary fw-bold'
									>
										<FontAwesomeIcon icon={faTruck} className='me-2' />
										{shiprocketBusy ? 'Pushing to Shiprocket...' : '🚀 Push Order to Shiprocket & Generate AWB'}
									</button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* RIGHT COLUMN: CUSTOMER & PAYMENT DETAILS */}
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
									to={`/rag/users/view-user?user_id=${userData._id}`}
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
											alt={userData?.first_name || 'Customer'}
										/>
									) : (
										<span>{initials}</span>
									)}
								</div>
								<div className='gz-order-user-details'>
									<div className='gz-order-user-name'>
										{userData?.first_name
											? `${userData.first_name} ${userData.last_name || ''}`.trim()
											: (orderData?.shipping_address?.name || orderData?.notes?.name || orderData?.notes?.full_name || 'Customer')}
									</div>
									<div className='gz-order-user-meta'>
										User ID: {userData?._id ? `${String(userData._id).slice(0, 8)}...` : '-'}
									</div>
								</div>
							</div>

							<div className='d-flex flex-column gap-3'>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Email Address</span>
									<span className='gz-order-info-value d-flex align-items-center gap-2'>
										<span>{userData?.email || orderData?.notes?.email || orderData?.shipping_address?.email || 'N/A'}</span>
										{userData?.emailVerified ? (
											<FontAwesomeIcon
												icon={faCheckCircle}
												className='text-success'
												title='Email Verified'
											/>
										) : (
											<FontAwesomeIcon
												icon={faTimesCircle}
												className='text-danger'
												title='Email Not Verified'
											/>
										)}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Phone / Mobile</span>
									<span className='gz-order-info-value d-flex align-items-center gap-2'>
										<span>
											{userData?.country_code ? `${userData.country_code} ` : ''}
											{userData?.mobile || orderData?.notes?.mobile || orderData?.notes?.phone || orderData?.shipping_address?.mobile || 'N/A'}
										</span>
										{userData?.mobileVerified ? (
											<FontAwesomeIcon
												icon={faCheckCircle}
												className='text-success'
												title='Mobile Verified'
											/>
										) : (
											<FontAwesomeIcon
												icon={faTimesCircle}
												className='text-danger'
												title='Mobile Not Verified'
											/>
										)}
									</span>
								</div>

								{(orderData?.notes?.address_line_1 || orderData?.notes?.address || orderData?.shipping_address) && (
									<div className='gz-order-info-item align-items-start'>
										<span className='gz-order-info-label'>Delivery Address</span>
										<span className='gz-order-info-value' style={{ maxWidth: '220px', textAlign: 'right', fontSize: '13px', lineHeight: 1.4 }}>
											{[
												orderData?.notes?.address_line_1 || orderData?.notes?.address,
												orderData?.notes?.address_line_2,
												orderData?.notes?.city,
												orderData?.notes?.state,
												orderData?.notes?.pin_code || orderData?.notes?.pincode,
											]
												.filter(Boolean)
												.join(', ') ||
												orderData?.shipping_address?.address ||
												'N/A'}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* PAYMENT & ORDER OVERVIEW CARD */}
					<div className='gz-order-card'>
						<div className='gz-order-card-header'>
							<h3 className='gz-order-card-title'>
								<FontAwesomeIcon icon={faReceipt} className='icon' />
								<span>Payment &amp; Gateway</span>
							</h3>
						</div>

						<div className='gz-order-card-body'>
							<div className='d-flex flex-column gap-3'>
								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Receipt ID</span>
									<span className='gz-order-info-value font-monospace'>
										{orderData?.receipt_id || 'N/A'}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Gateway Order ID</span>
									<span className='gz-order-info-value font-monospace' style={{ fontSize: '13px' }}>
										{orderData?.gateway_order_id || 'N/A'}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Payment Gateway</span>
									<span className='gz-order-info-value'>
										{orderData?.gateway || 'Direct'}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Order Type</span>
									<span className='gz-order-info-value'>
										{orderData?.order_item_type
											? formatOrderItemType(orderData.order_item_type)
											: 'Standard Product'}
									</span>
								</div>

								<div className='gz-order-info-item'>
									<span className='gz-order-info-label'>Created At</span>
									<span className='gz-order-info-value' style={{ fontSize: '13px' }}>
										{orderData?.createdAt
											? DayJS(orderData.createdAt).format('DD/MM/YYYY, hh:mm:ss A')
											: '-'}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			)}
		</div>
	)
}

export { ProductOrderView }
export default ProductOrderView
