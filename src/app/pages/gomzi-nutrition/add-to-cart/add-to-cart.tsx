import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
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
						display_image: itemDetail?.displayImages?.[0] || '',
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

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
	}

	const filteredCartData = cartDataWithUser.filter((item) => {
		// 1. Date Filter
		if (dateRange && dateRange[0] && dateRange[1]) {
			const itemDate = new Date(item.createdAt).getTime()
			const startDate = new Date(dateRange[0]).setHours(0, 0, 0, 0)
			const endDate = new Date(dateRange[1]).setHours(23, 59, 59, 999)
			if (isNaN(itemDate) || itemDate < startDate || itemDate > endDate) {
				return false
			}
		}

		// 2. Search Filter (Item Name, User Name, Mobile, Email)
		if (!searchTerm || !searchTerm.trim()) return true
		const term = searchTerm.toLowerCase().trim()
		const itemName = (item?.name || '').toLowerCase()
		const userName = `${item?.user?.first_name || ''} ${item?.user?.last_name || ''}`.toLowerCase()
		const mobile = (item?.user?.mobile || '').toString().toLowerCase()
		const email = (item?.user?.email || '').toLowerCase()

		return itemName.includes(term) || userName.includes(term) || mobile.includes(term) || email.includes(term)
	})

	const paginatedCartData = filteredCartData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const downloadExcel = () => {
		const worksheetData = filteredCartData.map((data: any, idx: number) => {
			const userName = data?.user
				? `${data?.user?.first_name || 'Deleted User'} ${data?.user?.last_name || ''}`.trim()
				: 'Deleted User'
			const mobile = data?.user?.mobile || 'N/A'
			const email = data?.user?.email || 'N/A'

			return {
				'No.': idx + 1,
				'User Name': userName,
				Mobile: mobile,
				Email: email,
				'Item Name': data?.name || 'N/A',
				Quantity: data?.quantity ?? 0,
				'Price (Per Item)': data?.price ?? 0,
				Date: data?.createdAt ? DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A') : 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'User Cart')
		XLSX.writeFile(workbook, `User_Cart_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Products</PageTitle>
			<KTCard>
				{/* Filters Toolbar Row: Search, LengthMenu, Download Excel, DateFilter */}
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex flex-wrap align-items-center gap-3 w-100'>
						{/* 1. Search Filter */}
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								className='me-0'
							/>
						</div>

						{/* 2. Dropdown (show entries per page) */}
						<div>
							<LengthMenu
								expenseData={filteredCartData}
								handleItemsPerPageChange={handleItemsPerPageChange}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center justify-content-center'
								style={{
									width: '38px',
									height: '38px',
									padding: 0,
									borderRadius: '8px',
									fontSize: '14px',
								}}
								onClick={downloadExcel}
								disabled={loading || filteredCartData.length === 0}
								title='Download Excel'>
								<FontAwesomeIcon icon={faDownload} />
							</button>
						</div>

						{/* 4. Date Filter */}
						<div className='d-flex align-items-center'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
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
