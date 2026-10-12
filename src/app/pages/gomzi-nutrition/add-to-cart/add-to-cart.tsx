import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetOrderCart } from '../../../Functions/FGGroup'

const AddToCart: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [cartDataWithUser, setCartDataWithUser] = useState<any[]>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)

	// const fetchCartData = async () => {
	// 	setLoading(true)
	// 	try {
	// 		const response = await GetOrderCart({item_type: 'FG_MEAL_PRODUCT'})
	// 		let filteredData: any[] = response?.data || []

	// 		filteredData.sort((a, b) => {
	// 			const dateA = new Date(a.createdAt)
	// 			const dateB = new Date(b.createdAt)
	// 			return dateB.getTime() - dateA.getTime()
	// 		})

	// 		const allItems = filteredData.flatMap((item: any) =>
	// 			item.items.map((cartItem: any) => {
	// 				const itemDetail = item.items_details.find(
	// 					(detail: any) => detail._id === cartItem.item_id
	// 				)
	// 				return {
	// 					...cartItem,
	// 					display_image: itemDetail?.display_image || [],
	// 					name: itemDetail?.name || 'Unknown',
	// 					price: itemDetail?.price || 0,
	// 					user_id: item.user_id,
	// 					user: item.user,
	// 				}
	// 			})
	// 		)

	// 		setCartDataWithUser(allItems)
	// 	} catch (error) {
	// 		console.error('Error fetching cart data:', error)
	// 	} finally {
	// 		setLoading(false)
	// 	}
	// }

	const fetchCartData = async () => {
		setLoading(true)
		try {
			const [fgResponse, pureGoResponse] = await Promise.all([
				GetOrderCart({ item_type: 'FG_MEAL_PRODUCT' }),
				GetOrderCart({ item_type: 'PURE_GO_MEAL_PRODUCT' }),
			])

			let filteredData: any[] = [...(fgResponse?.data || []), ...(pureGoResponse?.data || [])]

			filteredData.sort((a, b) => {
				const dateA = new Date(a.createdAt)
				const dateB = new Date(b.createdAt)
				return dateB.getTime() - dateA.getTime()
			})

			const allItems = filteredData.flatMap((item: any) =>
				item.items.map((cartItem: any) => {
					const itemDetail = item.items_details.find(
						(detail: any) => detail._id === cartItem.item_id
					)
					return {
						...cartItem,
						display_image: itemDetail?.displayImages[0] || [],
						name: itemDetail?.name || 'Unknown',
						price: itemDetail?.price || 0,
						user_id: item.user_id,
						user: item.user,
					}
				})
			)

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

	const filteredCartData = cartDataWithUser.filter((item) =>
		item?.name?.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedCartData = filteredCartData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Products</PageTitle>
			<KTCard>
				<div className='d-flex justify-content-between mx-3 m-5'>
					<div className='d-flex pt-1 mx-2'>
						<LengthMenu
							expenseData={cartDataWithUser}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
					/>
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
									<th>Image</th>
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
									paginatedCartData
										.sort((a, b) => {
											const dateA = new Date(a.createdAt)
											const dateB = new Date(b.createdAt)
											return dateB.getTime() - dateA.getTime()
										})
										.map((data: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											return (
												<tr key={actualIndex}>
													<td>
														<span className='text-dark ms-6 fw-bold  mb-1 fs-6'>{actualIndex}</span>
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
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{data.name || 'N/A'}
														</span>
													</td>
													<td>
														<span className='d-inline-block align-middle'>
															<img
																src={`https://files.fggroup.in/${data?.display_image}`}
																alt={data.name}
																className='fs-3 text-primary'
																style={{ width: '55px', height: '55px', borderRadius: '20%' }}
															/>
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>{data.quantity}</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>₹{data.price}</span>
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
