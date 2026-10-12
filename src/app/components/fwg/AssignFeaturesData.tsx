import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { GetUserAssignFeature } from '../../Functions/FWG'
import TableButton from '../TableButton'
import { DayJS } from '../../../_metronic/helpers/Utils'

type Props = {
	user_id?: string | any
}

const AssignFeaturesData: React.FC<Props> = ({ user_id }) => {
	const [orderData, setOrderData] = useState<any>({})
	const [orderTableData, setOrderTableData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchUserAssignData = async () => {
		setLoading(true)
		try {
			const response: any = await GetUserAssignFeature({ user_id })
			const data: any = response.data

			const filteredData = data.filter(
				(item: any) => item?.user_assign_feature && item?.user_assign_feature?.length > 0
			)

			if (!filteredData) {
				return toast.error('Order Details not available')
			}
			setOrderData(filteredData[0])
			const userFeature: any = filteredData[0]?.user_assign_feature || []
			setOrderTableData(userFeature)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchAllData = async () => {
		fetchUserAssignData()
	}

	return (
		<>
			{/* Assign Plans */}
			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					onClick={() => fetchAllData()}
					data-bs-toggle='collapse'
					data-bs-target='#kt_user_assign_plan'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Features Plans</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_user_assign_plan'
					className='collapse'>
					{!loading ? (
						<>
							<div className='card-body border-top'>
								<div className=' mt-0'>
									<div className=''>
										<div className='card-title w-100'>
											<div className='row w-100 justify-content-between align-items-center'>
												<div className='col-6'>
													<h2 className='fw-bold text-dark fs-1 '>
														Assign Features to users
													</h2>
												</div>
												<div className='col-6 d-flex justify-content-end '>
													<TableButton
														action='view'
														to={'/fwg/users/user-assign-plan?user_id=' + user_id}
														text='Assigned plan'
														backgroundDark={true}
													/>
												</div>
											</div>
										</div>
									</div>
									{orderTableData.length !== 0 ? (
										<>
											<div className='py-2'>
												<div className='row'>
													<div className='col-md-6'>
														<h4>Order Details</h4>
														<div>
															<p className='mb-0 fs-6'>Receipt ID:</p>
															<p className='font-bold fs-5'>
																<b>{orderData?.receipt_id || 'N/A'}</b>
															</p>
														</div>
														<div>
															{orderData?.order_item_type === 'PLAN' && (
																<>
																	<p className='mb-0 fs-6'>Plan Name:</p>
																	<p className='font-bold fs-5'>
																		<b>{orderData?.plan_bundle?.plan_title || 'N/A'}</b>
																	</p>
																</>
															)}
														</div>
													</div>
													<div className='col-md-6'>
														<h4>Transaction Information</h4>
														<div>
															<p className='mb-0 fs-6'>Purchase Mode:</p>
															<p className='font-bold fs-5'>
																<b>{orderData?.purchase_mode || 'N/A'}</b>
															</p>
														</div>
														<div>
															<p className='mb-0 fs-6'>Updated On:</p>
															<p className='font-bold fs-5'>
																<b>{DayJS(orderData?.updatedAt).format('MMM D, YYYY h:mm A')}</b>
															</p>
														</div>
													</div>
												</div>
												<div className='border-bottom mb-3'></div>
												<div className=''>
													<div className='table-responsive'>
														<table
															id='kt_table_users'
															className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
															<thead>
																<tr className='fw-bold text-muted'>
																	<th>No.</th>
																	<th>Title</th>
																	<th>Feature</th>
																	<th>Started on</th>
																	<th>Expire on</th>
																</tr>
															</thead>
															<tbody className='text-gray-600 fw-bold'>
																{orderTableData.map((order: any, index: number) => {
																	const actualIndex =
																		(pagination.page - 1) * pagination.itemsPerPage + index + 1
																	return (
																		<tr key={actualIndex}>
																			<td>
																				<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																					{actualIndex}
																				</span>
																			</td>
																			<td>
																				<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																					{order.feature_info?.title}
																				</span>
																			</td>
																			<td>
																				<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																					{order.feature_info?.feature}
																				</span>
																			</td>
																			<td>
																				<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																					{DayJS(order.start_time).format('MMM D, YYYY h:mm A')}
																				</span>
																			</td>
																			<td>
																				<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																					{DayJS(order.end_time).format('MMM D, YYYY h:mm A')}
																				</span>
																			</td>
																			<td>
																				{/* <TableButton
														action="remove"
														onClick={() => removeFeature(order._id, orderData._id)}
													/> */}
																			</td>
																		</tr>
																	)
																})}
															</tbody>
														</table>
													</div>
												</div>
												<div className='border-bottom mb-3'></div>
											</div>
										</>
									) : (
										<>
											<div className='mb-5 pb-5'>
												<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
													<b>No records found</b>
												</div>
											</div>
										</>
									)}
								</div>
							</div>
						</>
					) : (
						<>
							<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
								<div
									className='spinner-border text-primary'
									role='status'>
									<span className='visually-hidden'>Loading...</span>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	)
}

export { AssignFeaturesData }
