import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetReferralCouponUsage } from '../../../Functions/FGGroup'

const TrainerReference: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const coupon_id: string | any = searchParams.get('coupon_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [referenceData, setReferenceData] = useState<any>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)

	const fetchUserData = async () => {
		setLoading(true)
		try {
			const response: any = await GetReferralCouponUsage({ coupon_id: coupon_id })
			const filteredData: any = response.data[0]

			const order = filteredData
			setReferenceData(order)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchUserData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	// const filteredData = referenceData?.filter((data: any) =>
	// 	data?.orders.order_item_type.toLowerCase().includes(searchTerm.toLowerCase())
	// )
	// const paginatedData = filteredData.slice(
	// 	(pagination.page - 1) * pagination.itemsPerPage,
	// 	pagination.page * pagination.itemsPerPage
	// )
	return (
		<>
			<PageTitle breadcrumbs={[]}>Reference</PageTitle>
			<KTCard>
				<div className='row'>
					<div className='col-12'>
						<div className='d-flex align-items-center justify-content-end mt-5'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>User</th>
									<th>Amount</th>
									<th>Discount Amount</th>
									<th>Order Status</th>
									<th>Date</th>
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
									referenceData.orders?.map((data: any, index: number) => {
										const discountAmount = (data.amount * referenceData.discount) / 100
										return (
											<tr key={index}>
												<td>
													<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6 text-center'>
														{index + 1}
													</span>
												</td>
												<td>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={
																	data?.user?.profile_image
																		? `https://files.fggroup.in/${data?.user?.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold fs-6'>
																{(data?.user?.first_name || 'DELETED USER') +
																	' ' +
																	(data?.user?.last_name || ' ') || 'N/A'}
															</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{data?.user?.email || 'N/A'}
															</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{data?.user?.mobile || 'N/A'}
															</span>
														</div>
													</div>
												</td>
												<td>
													<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
														₹{data.amount}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
														₹{discountAmount.toFixed(2)}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.status === 'SUCCESS' ? (
															<span className='badge badge-light-success py-3 px-4 fs-7'>
																Success
															</span>
														) : data.status === 'FAILED' ? (
															<span className='badge badge-light-danger py-3 px-4 fs-7'>
																Failed
															</span>
														) : data.status === 'PENDING' ? (
															<span className='badge badge-light-warning py-3 px-4 fs-7'>
																Pending
															</span>
														) : (
															''
														)}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
														{referenceData.updatedAt
															? DayJS(referenceData.updatedAt).format('DD/MM/YYYY hh:mm:ss A')
															: '-'}
													</span>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{referenceData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{referenceData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(referenceData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}
export default TrainerReference
