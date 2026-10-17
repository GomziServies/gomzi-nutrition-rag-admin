/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faExternalLinkAlt,
	faEye,
	faMoneyBillWave,
	faPercent,
	faPhoneAlt,
	faReceipt,
	faShoppingBag,
	faTag,
	faUser,
} from '@fortawesome/free-solid-svg-icons'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import CopyButton from '../../../components/motion/CopyButton'
import { GetProduct, GetReferralCouponUsage } from '../../../Functions/FGGroup'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'

const Reference: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const coupon_id: string | any = searchParams.get('id')
	const coupon_discount: string | any = searchParams.get('coupon_discount')
	const [searchTerm, setSearchTerm] = useState('')
	const [referenceData, setReferenceData] = useState<any>([])
	const [discountPercentage, setDiscountPercentage] = useState<number>(0)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)
	const [productData, setProductData] = useState<{ [key: string]: any }>({})

	const fetchUserData = async () => {
		setLoading(true)
		try {
			const response: any = await GetReferralCouponUsage({ coupon_id: coupon_id })
			const filteredData: any = response.data[0]
			const order = filteredData?.orders || []
			setReferenceData(order)
		} catch (error) {
			console.error('Error fetching referral coupon usage:', error)
		} finally {
			setLoading(false)
		}
	}

	const getProductData = async (id: string) => {
		if (!productData[id] && id) {
			try {
				const response: any = await GetProduct({ id })
				const filteredData: any = response.data?.[0]
				if (filteredData) {
					setProductData((prevData) => ({
						...prevData,
						[id]: filteredData,
					}))
				}
			} catch (error) {
				console.error('Error fetching product data:', error)
			}
		}
	}

	useEffect(() => {
		if (coupon_discount) {
			setDiscountPercentage(parseFloat(coupon_discount))
		}
	}, [coupon_discount])

	useEffect(() => {
		if (coupon_id) {
			fetchUserData()
		}
	}, [coupon_id])

	useEffect(() => {
		if (referenceData && referenceData.length > 0) {
			referenceData.forEach((data: any) => {
				if (data.order_item_id) {
					getProductData(data.order_item_id)
				}
			})
		}
	}, [referenceData])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredData = referenceData.filter((data: any) => {
		const customerName = `${data?.user?.first_name || ''} ${data?.user?.last_name || ''}`.toLowerCase()
		const mobile = (data?.user?.mobile || '').toString()
		const itemType = (data.order_item_type || '').toLowerCase()
		const search = searchTerm.toLowerCase()

		return itemType.includes(search) || customerName.includes(search) || mobile.includes(search)
	})

	const paginatedData = filteredData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const calculateDiscountedAmount = (price: number, discount: number) => {
		if (!price) return 0
		return price - (price * discount) / 100
	}

	// Financial Aggregates
	let totalDiscountSum = 0
	let totalPaidSum = 0
	referenceData.forEach((item: any) => {
		const prodPrice = productData[item.order_item_id]?.price
		if (prodPrice) {
			const discVal = (prodPrice * discountPercentage) / 100
			totalDiscountSum += discVal
			totalPaidSum += calculateDiscountedAmount(prodPrice, discountPercentage)
		}
	})

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Coupon Reference Details</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/manage-coupon'>Manage Coupons</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Reference Usage Details</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<div className='d-flex align-items-center gap-3 flex-wrap mb-1'>
						<h1 className='gz-prod-title'>Coupon Reference Details</h1>
						{discountPercentage > 0 && (
							<span className='gz-status-pill success'>
								{discountPercentage}% Discount Active
							</span>
						)}
					</div>
					<p className='gz-prod-subtitle'>
						Review all customer orders, item allocations, discount deductions, and paid amounts.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link
						to='/rag/manage-coupon'
						className='gz-prod-btn-cancel'
						title='Back to Coupons'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Coupons</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    SUMMARY METRICS CARDS
			    ========================================================================= */}
			<div className='gz-prod-summary-grid mb-6'>
				<div className='gz-prod-summary-card'>
					<div className='title'>Total Referral Orders</div>
					<div className='value'>{referenceData.length}</div>
					<div className='subtext'>Purchases tied to coupon</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='title'>Discount Percentage</div>
					<div className='value' style={{ color: '#2563EB' }}>
						{discountPercentage ? `${discountPercentage}%` : '0%'}
					</div>
					<div className='subtext'>Applied on eligible items</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='title'>Total Discount Granted</div>
					<div className='value' style={{ color: '#D97706' }}>
						₹{totalDiscountSum.toFixed(2)}
					</div>
					<div className='subtext'>Aggregate customer savings</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='title'>Total Net Paid Revenue</div>
					<div className='value' style={{ color: '#059669' }}>
						₹{totalPaidSum.toFixed(2)}
					</div>
					<div className='subtext'>Calculated net order intake</div>
				</div>
			</div>

			{/* =========================================================================
			    ORDERS TABLE CARD
			    ========================================================================= */}
			<div className='gz-prod-card'>
				{/* Toolbar */}
				<div className='gz-prod-toolbar'>
					<div className='d-flex align-items-center gap-3 flex-wrap flex-grow-1'>
						<div style={{ minWidth: '280px', maxWidth: '420px', flexGrow: 1 }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
					</div>
					<div className='d-flex align-items-center gap-2'>
						<span className='fs-8 fw-semibold text-muted'>
							Showing {paginatedData.length} of {filteredData.length} referral orders
						</span>
					</div>
				</div>

				{/* Table */}
				<div className='table-responsive'>
					<table className='gz-prod-table mb-0'>
						<thead>
							<tr>
								<th style={{ width: '56px', textAlign: 'center' }}>No.</th>
								<th style={{ minWidth: '220px' }}>Customer Name</th>
								<th style={{ minWidth: '150px' }}>Contact Mobile</th>
								<th style={{ minWidth: '140px' }}>Discount Given</th>
								<th style={{ minWidth: '140px' }}>Paid Amount</th>
								<th style={{ minWidth: '150px' }}>Module / Item Type</th>
								<th style={{ minWidth: '120px', textAlign: 'center' }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={7} className='text-center py-10'>
										<div className='d-flex justify-content-center align-items-center my-6'>
											<div
												className='spinner-border'
												style={{ color: '#172B4D', width: '2.5rem', height: '2.5rem' }}
												role='status'>
												<span className='visually-hidden'>Loading...</span>
											</div>
										</div>
									</td>
								</tr>
							) : paginatedData.length > 0 ? (
								paginatedData
									.slice()
									.reverse()
									.map((data: any, index: number) => {
										const actualIndex =
											(pagination.page - 1) * pagination.itemsPerPage + index + 1
										const prodPrice = productData[data.order_item_id]?.price || 0
										const discountVal = (prodPrice * discountPercentage) / 100
										const paidVal = calculateDiscountedAmount(prodPrice, discountPercentage)
										const customerName =
											data?.user?.first_name || data?.user?.last_name
												? `${data?.user?.first_name || ''} ${data?.user?.last_name || ''}`.trim()
												: 'N/A'
										const initials = customerName
											.split(' ')
											.map((n: string) => n[0])
											.slice(0, 2)
											.join('')
											.toUpperCase() || 'U'

										return (
											<tr key={data._id || actualIndex}>
												<td style={{ textAlign: 'center', fontWeight: 700, color: '#71809A' }}>
													{actualIndex}
												</td>
												<td>
													<div className='d-flex align-items-center gap-3'>
														<div
															style={{
																width: '36px',
																height: '36px',
																borderRadius: '10px',
																background: '#EAF1F8',
																color: '#172B4D',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																fontSize: '12.5px',
																fontWeight: 700,
																flexShrink: 0,
															}}>
															{initials}
														</div>
														<div>
															<div
																style={{
																	fontWeight: 700,
																	color: '#172B4D',
																	fontSize: '13.5px',
																}}>
																{customerName}
															</div>
															{data?._id && (
																<div
																	style={{
																		fontSize: '11px',
																		color: '#71809A',
																		fontFamily: 'monospace',
																	}}>
																	Order #{data._id.slice(0, 8)}...
																</div>
															)}
														</div>
													</div>
												</td>
												<td>
													{data?.user?.mobile ? (
														<a
															href={`tel:${data.user.mobile}`}
															style={{
																fontWeight: 600,
																color: '#172B4D',
																fontSize: '13px',
																textDecoration: 'none',
																display: 'inline-flex',
																alignItems: 'center',
																gap: '6px',
															}}>
															<FontAwesomeIcon
																icon={faPhoneAlt}
																style={{ fontSize: '11px', color: '#71809A' }}
															/>
															<span>{data.user.mobile}</span>
														</a>
													) : (
														<span style={{ color: '#A0ABC0', fontSize: '13px' }}>—</span>
													)}
												</td>
												<td>
													<div>
														<span
															style={{
																fontWeight: 700,
																color: '#D97706',
																fontSize: '13.5px',
															}}>
															₹{discountVal.toFixed(2)}
														</span>
														<span
															style={{
																fontSize: '11px',
																color: '#71809A',
																marginLeft: '2px',
															}}>
															/-
														</span>
													</div>
												</td>
												<td>
													<div>
														<span
															style={{
																fontWeight: 700,
																color: '#059669',
																fontSize: '13.5px',
															}}>
															₹{paidVal.toFixed(2)}
														</span>
														<span
															style={{
																fontSize: '11px',
																color: '#71809A',
																marginLeft: '2px',
															}}>
															/-
														</span>
													</div>
												</td>
												<td>
													<span className='gz-status-pill primary'>
														{data.order_item_type || 'STANDARD'}
													</span>
												</td>
												<td style={{ textAlign: 'center' }}>
													<Link
														to={`/rag/all-order/view-order?order_id=${data._id}`}
														className='gz-prod-btn-icon text-decoration-none'
														title='View Full Order'
														style={{
															width: '32px',
															height: '32px',
															borderRadius: '8px',
															border: '1px solid #E4EAF2',
															background: '#FFFFFF',
															color: '#172B4D',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}>
														<FontAwesomeIcon icon={faEye} style={{ fontSize: '13px' }} />
													</Link>
												</td>
											</tr>
										)
									})
							) : (
								<tr>
									<td colSpan={7} className='text-center py-10'>
										<div className='d-flex flex-column align-items-center justify-content-center my-6'>
											<div
												className='d-inline-flex align-items-center justify-content-center mb-3'
												style={{
													width: '48px',
													height: '48px',
													borderRadius: '50%',
													background: '#F5F7FB',
													color: '#71809A',
												}}>
												<FontAwesomeIcon icon={faReceipt} style={{ fontSize: '20px' }} />
											</div>
											<h4 className='fw-bold mb-1' style={{ color: '#172B4D' }}>
												No Referral Orders Found
											</h4>
											<p className='text-muted fs-7 mb-0'>
												{searchTerm
													? 'No orders match your search criteria.'
													: 'No customers have used this coupon code yet.'}
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{filteredData.length > 0 && (
					<div
						className='px-6 py-4'
						style={{ borderTop: '1px solid #EEF2F7', background: '#FFFFFF' }}>
						<UsersListPagination
							totalPages={Math.ceil(filteredData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default Reference
