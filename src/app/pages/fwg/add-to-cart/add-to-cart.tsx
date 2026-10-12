import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetFitnessPlans, GetOrderCart } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const AddToCart: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [cartDataWithUser, setCartDataWithUser] = useState<any[]>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)

	const fetchCartData = async () => {
		setLoading(true)
		try {
			const response = await GetOrderCart({ item_type: 'GYM_MEMBERSHIP' })

			const allItems = (response.data || []).flatMap((item: any) =>
			item.items.map((cartItem: any) => ({
				...cartItem,
				item_type: item.item_type,
				user_id: item.user_id,
				user: item.user,
			}))
		)
			const plansResponse = await GetFitnessPlans()
			const planMap: Record<string, any> = {}
			;(plansResponse.data || []).forEach((plan: any) => {
				planMap[plan._id] = plan
			})

			allItems.forEach((cartItem: any) => {
				const plan = planMap[cartItem.item_id]
				cartItem.book_title = plan?.plan_name || 'Plan Deleted'
				cartItem.price = plan?.amount ?? plan?.price ?? 0
				cartItem.cover_image = plan?.cover_image || plan?.display_image
			})

			// Sort all items by createdAt date - latest first
			allItems.sort((a: any, b: any) => {
				const dateA = new Date(a.createdAt)
				const dateB = new Date(b.createdAt)
				return dateB.getTime() - dateA.getTime()
			})

			setCartDataWithUser(allItems)
		} catch (error) {
			console.error('Error fetching cart data:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchCartData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage: value }))
	}

const filteredCartData = cartDataWithUser.filter((item) => {
	const searchLower = searchTerm.toLowerCase()
	return (
		item?.book_title?.toLowerCase().includes(searchLower) ||
		item?.user?.first_name?.toLowerCase().includes(searchLower) ||
		item?.user?.last_name?.toLowerCase().includes(searchLower) ||
		item?.user?.mobile?.toString().includes(searchLower) ||
		item?.user?.email?.toLowerCase().includes(searchLower)
	)
})

	const paginatedCartData = filteredCartData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Products</PageTitle>
			<KTCard>
				<div className='row justify-content-between mx-3 m-5'>
					<div className='col-md-4 pt-1 d-flex align-items-end'>
						<LengthMenu
							expenseData={cartDataWithUser}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='col-md-8'>
						<div className='row align-items-end justify-content-between'>
							<div className='col-md-12 d-flex justify-content-end'>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
							</div>
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
									<th>Item Name</th>
									<th>Quantity</th>
									<th>Date</th>
									<th className='ps-4 rounded-end'>Price (Per Item)</th>
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
								paginatedCartData.map((data: any, index: number) => {
									const actualIndex =
										(pagination.page - 1) * pagination.itemsPerPage + index + 1
									return (
												<tr key={actualIndex}>
													<td>
														<span className='text-dark ms-6 fw-bold  mb-1 fs-6'>
															{actualIndex}
														</span>
													</td>
													<td>
														<div className='d-flex align-items-center'>
															<div className='d-flex justify-content-start flex-column'>
																<span className='text-dark fw-bold  fs-6'>
																	{data?.user
																		? `${data?.user?.first_name || 'Deleted User'} ${
																				data?.user?.last_name || ''
																		  }`
																		: 'Deleted User'}
																</span>
																<span className='text-muted fw-semibold d-block fs-7'>
																	{data?.user
																		? `${data?.user?.country_code || ''} ${
																				data?.user?.mobile || ''
																		  }`
																		: 'N/A'}
																</span>
																<span className='text-muted fw-semibold d-block fs-7'>
																	{data?.user?.email || 'N/A'}
																</span>
															</div>
														</div>
													</td>

													<td>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{data.book_title}</span>
														</div>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{data.quantity}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															₹{data.price}
														</span>
													</td>
												</tr>
											)
										})
								)}
							</tbody>
						</table>
					</div>
					{paginatedCartData?.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedCartData?.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredCartData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default AddToCart