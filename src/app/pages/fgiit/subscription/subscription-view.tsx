import { faAngleDown, faCopy } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	cancelSubscription,
	getSubscription,
	getSubscriptionById,
	getSubscriptionInvoiceById,
	pauseSubscription,
	resumeSubscription,
} from '../../../Functions/FGGroup/Subscription'
import { GetSubscriptionPlan } from '../../../Functions/FGGroup/SubscriptionPlan'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const statusBadgeMap: { [key: string]: string } = {
	created: 'badge badge-secondary',
	authenticated: 'badge badge-info',
	active: 'badge badge-success',
	pending: 'badge badge-warning',
	halted: 'badge badge-dark',
	cancelled: 'badge badge-danger',
	completed: 'badge badge-primary',
	expired: 'badge badge-light',
	paused: 'badge badge-warning',
}

const SubscriptionView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const plan_id: string | null = searchParams.get('plan_id')
	const subscription_id: string | any = searchParams.get('subscription_id')

	const [copiedText, setCopiedText] = useState('')
	const [subscriptionData, setSubscriptionData] = useState<any>({})
	const [subscriptionInvoiceData, setSubscriptionInvoiceData] = useState<any[]>([])
	const [planData, setPlanData] = useState<any>({})
	const [razorpayData, setRazorpayData] = useState<any>({})
	const [loading, setLoading] = useState<boolean>(false)

	const fetchSubscriptionData = async () => {
		try {
			setLoading(true)
			const response: any = await getSubscription({ id: String(plan_id) })
			const data: any = response.data[0]

			const razorpayResponse: any = await getSubscriptionById({
				subscription_id: subscription_id
			})
			setRazorpayData(razorpayResponse.data)
			fetchPlanData(data.plan_id)
			setSubscriptionData(data)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchPlanData = async (plan_id: string) => {
		try {
			const response: any = await GetSubscriptionPlan({
				razorpay_plan_id: plan_id,
			})
			const data = response.data[0]
			setPlanData(data)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchSubscriptionInvoiceData = async () => {
		try {
			const response: any = await getSubscriptionInvoiceById({
				subscription_id: String(subscription_id),
			})
			setSubscriptionInvoiceData(response?.data?.items)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		if (plan_id) {
			fetchSubscriptionData()
		}
	}, [plan_id])

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text)
		setCopiedText(text)
		setTimeout(() => setCopiedText(''), 2000)
	}

	const handleAction = (action: string) => {
		Swal.fire({
			title: `Are you sure you want to ${action}?`,
			text: `This action will ${action} the subscription.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: `Yes, ${action}`,
			cancelButtonText: 'No, keep it',
		}).then((result) => {
			if (result.isConfirmed) {
				performSubscriptionAction(action)
			}
		})
	}

	const performSubscriptionAction = async (action: string) => {
		try {
			let response: any
			if (action === 'cancel') {
				response = await cancelSubscription({
					subscription_id: subscription_id,
					cancel_at_cycle_end: 0,
				})
			} else if (action === 'pause') {
				response = await pauseSubscription({
					subscription_id: subscription_id,
				})
			} else if (action === 'resume') {
				response = await resumeSubscription({
					subscription_id: subscription_id,
				})
			}
			if (response) {
				toast.success(`Subscription ${action}d successfully!`)
				fetchSubscriptionData()
			}
		} catch (error: any) {
			toast.error(`Error while trying to ${action} the subscription :- `+ error.message)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Subscription Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-4'>
					<div className='card shadow-sm rounded-lg'>
						<div className='card-body p-4'>
							{loading ? (
								<div
									style={{ height: '300px' }}
									className='d-flex justify-content-center align-items-center'>
									<div className='d-flex justify-content-center align-items-center'>
										<div
											className='spinner-border'
											role='status'>
											<span className='visually-hidden'>Loading...</span>
										</div>
									</div>
								</div>
							) : (
								<>
									<div className='mb-4'>
										<div className='d-block'>
											<h4 className='fw-bold text-dark mb-1'>Subscription ID</h4>
											<div className='w-100 d-flex justify-content-between align-items-center'>
												<p className='text-primary fs-5 mb-0 me-2'>
													{subscriptionData.razorpay_subscription_id}
												</p>
												<button
													className='btn btn-primary btn-sm'
													onClick={() => handleCopy(subscriptionData.razorpay_subscription_id)}>
													<FontAwesomeIcon
														icon={faCopy}
														className='me-2'
													/>
													{copiedText === subscriptionData.razorpay_subscription_id
														? 'Copied!'
														: 'Copy'}
												</button>
											</div>
										</div>
									</div>
									<hr />

									<div className='row gy-3'>
										<div className='col-md-6'>
											<div className='row'>
												<div className='col-md-12'>
													<strong>Customer:</strong>
													<p className='text-muted my-0'>
														{subscriptionData?.user_id?.first_name +
															' ' +
															subscriptionData?.user_id?.last_name}
													</p>
													<p className='text-muted my-0'>{subscriptionData?.user_id?.mobile}</p>
													<p className='text-muted my-0 mb-4'>{subscriptionData?.user_id?.email}</p>
												</div>

												<div className='col-md-12'>
													<strong>Recurring Billing:</strong>
													<p className='text-dark'>
														₹{planData.amount}/-{' '}
														<span className='text-muted'>(1 x ₹{planData.amount} per unit)</span>
													</p>
												</div>

												<div className='col-md-12 mb-4'>
													<strong>Status:</strong>
													<div className='d-flex align-items-center mt-1'>
														<button
															className={`fw-bold btn-sm btn mb-1 fs-8 p-4 mx-2 ${
																statusBadgeMap[subscriptionData?.status]
															} text-uppercase`}>
															{subscriptionData?.status}
														</button>

														{/* Conditionally render buttons based on status */}
														{subscriptionData.status === 'created' && (
															<button
																className='btn btn-danger btn-sm'
																onClick={() => handleAction('cancel')}>
																Cancel
															</button>
														)}

														{subscriptionData.status === 'active' && (
															<>
																<button
																	className='btn btn-secondary btn-sm me-2'
																	onClick={() => handleAction('pause')}>
																	Pause
																</button>
																<button
																	className='btn btn-danger btn-sm'
																	onClick={() => handleAction('cancel')}>
																	Cancel
																</button>
															</>
														)}

														{subscriptionData.status === 'paused' && (
															<>
																<button
																	className='btn btn-info btn-sm me-2'
																	onClick={() => handleAction('resume')}>
																	Resume
																</button>
																<button
																	className='btn btn-danger btn-sm'
																	onClick={() => handleAction('cancel')}>
																	Cancel
																</button>
															</>
														)}

														{subscriptionData.status === 'expired' && (
															<p className='text-muted'>Subscription has expired.</p>
														)}

														{subscriptionData.status === 'authenticated' && (
															<button
																className='btn btn-danger btn-sm'
																onClick={() => handleAction('cancel')}>
																Cancel
															</button>
														)}
													</div>
												</div>
												<div className='col-md-12'>
													<strong>Payment Method:</strong>
													<p className='text-dark'>{razorpayData.payment_method}</p>
												</div>
												<div className='col-md-12'>
													<strong>Created At:</strong>
													<p className='text-dark'>
														{DayJS(subscriptionData.createdAt).format('DD MMM YYYY, hh:mm:ss A')}
													</p>
												</div>

												{/* Next Due Date */}
												<div className='col-md-12'>
													<strong>Next Due on:</strong>
													<p className='text-dark'>
														{razorpayData.end_at
															? DayJS(razorpayData.end_at * 1000).format('DD MMM YYYY, hh:mm:ss A')
															: '--'}
													</p>
												</div>
											</div>
										</div>
										<div className='col-md-6'>
											<div className='row'>
												<div className='col-md-12 mb-3'>
													<strong>Plan:</strong>
													<p className='mb-1'>
														<a
															href='#'
															className='text-primary fw-semibold'>
															{subscriptionData.plan_id}
														</a>
													</p>
													<p className='text-dark fw-bold mb-0'>{planData.name || '-'}</p>
													<p className='text-muted mb-0'>{planData.description || '-'}</p>
													<p className='text-muted'>
														Billed Every {planData.interval || '1'} {planData.period || 'Monthly'}
													</p>
												</div>

												{/* Subscription Link and Billing Details */}
												<div className='col-md-12'>
													<strong>Subscription Link:</strong>
													<div className='d-flex align-items-center'>
														<a
															href={subscriptionData.short_url}
															className='text-primary fw-semibold me-2'>
															{subscriptionData.short_url}
														</a>
														<button
															className='btn btn-primary btn-sm'
															onClick={() => handleCopy(subscriptionData.short_url)}>
															<FontAwesomeIcon
																icon={faCopy}
																className='me-2'
															/>
															{copiedText === subscriptionData.short_url ? 'Copied!' : 'Copy'}
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className='card mt-5 mt-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					onClick={() => fetchSubscriptionInvoiceData()}
					data-bs-toggle='collapse'
					data-bs-target='#kt_user_assign_plan'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Invoices detail</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>

				<div
					id='kt_user_assign_plan'
					className='collapse'>
					<div className='card-body border-top'>
						{/* Invoices Details */}
						<div className='d-flex justify-content-between mb-4'>
							<div>
								{razorpayData?.paid_count || 0} of {razorpayData?.total_count || 3} invoices charged
							</div>
						</div>

						{razorpayData?.remaining_count > 0 && (
							<div className='d-flex justify-content-between align-items-center mb-4'>
								<div>
									<strong>Upcoming Invoice</strong>
									<p className='text-muted mb-1'>
										{razorpayData.end_at
											? DayJS(razorpayData.end_at * 1000).format('DD MMM YYYY, hh:mm:ss A')
											: 'Recurring payment # 1'}
									</p>
								</div>
								<div className='text-end d-flex flex-column'>
									<div className='badge bg-light-secondary fs-6'>Next Due</div>
								</div>
							</div>
						)}

						{/* Paid Invoice */}
						<div>
							{subscriptionInvoiceData
								.filter((invoice: any) => invoice.amount_paid > 0)
								.map((invoice: any, index: number) => (
									<div
										key={index}
										className='d-flex justify-content-between align-items-center mb-3'>
										<div>
											<strong>
												{invoice.paid_at
													? DayJS(invoice.paid_at * 1000).format('DD MMM YYYY, hh:mm:ss A')
													: '--'}
											</strong>
											<p className='text-muted mb-1'>Recurring payment #{index + 1}</p>
										</div>
										<div className='text-end d-flex flex-column'>
											<strong className='mb-1'>₹{invoice.amount_paid / 100 || '-'}/-</strong>
											<div
												className={`badge ${
													invoice.status === 'paid' ? 'bg-success' : 'bg-warning'
												} d-flex text-center fs-6 px-4 py-2`}>
												{invoice.status}
											</div>
										</div>
									</div>
								))}
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default SubscriptionView
