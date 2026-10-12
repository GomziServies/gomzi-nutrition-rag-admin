import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import { FetchRazorpayPaymentDetails } from '../../../Functions/FGGroup'
import { GetOrders } from '../../../Functions/FWG/orders'

const OrderViewFWG = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const order_id: any = searchParams.get('order_id')
	const [userData, setUserData] = useState<any>('')
	const [itemData, setItemData] = useState<any>('')
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

			setShowDiv(!!data.gateway_transaction_id)
			setItemData(data)
			setUserData(data.user || {})
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

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Order View</PageTitle>

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
														{(userData.firstName || '-') + ' ' + (userData.lastName || '')}
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
												<th>Item Type:</th>
												{itemData?.plan && <th>Amount:</th>}
												<th>Paid Amount:</th>
												<th>Action:</th>
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
												<tr>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{itemData?.feature
																? itemData?.feature?._id || '-'
																: itemData?.plan?._id || '-'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{itemData?.feature
																? itemData?.feature?.title || '-'
																: itemData?.plan?.plan_title || '-'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{itemData?.order_item_type || '-'}
														</span>
													</td>
													{itemData?.plan?.amount && (
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{Number(itemData?.plan?.amount || 0).toFixed(0) + ' ' + 'INR'}
															</span>
														</td>
													)}
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{Number(itemData?.amount || 0).toFixed(0) + ' ' + 'INR'}
														</span>
													</td>
													<td>
														{itemData?.feature ? (
															<TableButton
																action='view'
																to={`/fwg/feature-view?plan_id=${itemData?.feature?._id}`}
															/>
														) : (
															<TableButton
																action='view'
																to={`/fwg/plan-bundle-view?plan_id=${itemData?.plan?._id}`}
															/>
														)}
													</td>
												</tr>
											)}
										</tbody>
									</table>
									{itemData?.length === 0 && !loading && (
										<div className='d-flex text-center w-100 align-content-center justify-content-center mt-7 mb-2'>
											<b>No records found</b>
										</div>
									)}
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
												Modification: {DayJS(orderData.updatedAt).format('MMMM D, YYYY h:mm A')}
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
export { OrderViewFWG }
