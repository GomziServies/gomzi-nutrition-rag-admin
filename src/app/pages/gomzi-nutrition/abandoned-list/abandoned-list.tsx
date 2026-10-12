import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetOrders } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const AbandonedList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [abandonedData, setAbandonedData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [loading, setLoading] = useState(false)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchAbandonedData = async (page?: number) => {
		setLoading(true)
		try {
			const filterQuery: any = {
				item_type: ['FG_MEAL_PRODUCT'],
				order_status: 'PENDING',
			}
			const response = await GetOrders({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm ? searchTerm : null,
				sort,
				sortOrder,
				...filterQuery,
			})

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			let filteredData: any = response.data

			// Merge the CART and multiple_items arrays based on item_id
			filteredData = filteredData
				// .filter((cart: any) => cart.gateway !== "RAZORPAY_FGIIT")
				?.map((cart: any) => ({
					...cart,
					merged_items: cart.CART?.map((cartItem: any) => {
						const matchingItem = cart.multiple_items.find(
							(item: any) => item.item_id === cartItem?._id
						)
						return {
							...cartItem,
							amount: matchingItem?.amount || 0, // Add amount from multiple_items
							quantity: matchingItem?.quantity || 0, // Add quantity from multiple_items
						}
					}),
				}))
			setAbandonedData(filteredData)
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAbandonedData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const sortableFields = [
		{ title: 'User', field: 'book_title' },
		{ title: 'Receipt ID', field: 'cover_image' },
		{ title: 'Item Name', field: 'amount' },
		{ title: 'Price', field: 'createdAt' },
		{ title: 'Date', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Abandoned List</PageTitle>
			<KTCard>
				<div className='d-flex justify-content-between mx-3 m-5'>
					<div className='d-flex pt-1 mx-2'>
						<LengthMenu
							expenseData={abandonedData}
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
						<Table
							data={abandonedData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							disableSortFields={['cover_image']}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={data._id}>
									<tr
										onClick={() => handleRowClick(data._id)}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold  ms-6 mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-3'>
													<img
														src={
															data.profile_image
																? `https://files.fggroup.in/${data.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{(data.user_info.first_name || 'Deleted User') +
															' ' +
															(data.user_info.last_name || '')}
													</span>
													<span className='text-muted fw-semibold text-muted d-flex fs-7'>
														{data.user_info?.mobile || '-'}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  mb-1 fs-6'>
												{data.receipt_id}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  mb-1 fs-6'>
												{data?.product ? (
													data?.product?.name
												) : (
													<ul>
														{data.merged_items?.map((name: any, index: number) => (
															<li key={index}>{name.name + `( × ${name.quantity})` || '-'}</li>
														))}
													</ul>
												)}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  mb-1 fs-6'>
												₹{data.amount}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  mb-1 fs-6'>
												{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={
																	data.profile_image
																		? `https://files.fggroup.in/${data.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>
																{(data.user_info.first_name || 'Deleted User') +
																	' ' +
																	(data.user_info.last_name || '')}
															</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{data.user_info?.mobile || '-'}
															</span>
														</div>
													</div>
													<br />
													<strong>{sortableFields[1].title}: </strong> {data.receipt_id}
													<br />
													<strong>{sortableFields[2].title}: </strong>{' '}
													<ul>
														{data.merged_items?.map((name: any, index: number) => (
															<li key={index}>{name.name + `( × ${name.quantity})` || '-'}</li>
														))}
													</ul>
													<br />
													<strong>{sortableFields[3].title}: </strong> ₹ {data.amount}
													<br />
													<strong>{sortableFields[4].title}: </strong>{' '}
													{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{abandonedData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{abandonedData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default AbandonedList
