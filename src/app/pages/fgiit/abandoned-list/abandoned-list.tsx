import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetOrders } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'

const FgiitAbandonedList: React.FC = () => {
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
	const [itemType, setItemType] = useState<any>({})

	const fetchAbandonedData = async (page?: number) => {
		setLoading(true)
		try {
			const filterQuery: any = {
				item_type: itemType.item_type ? [itemType.item_type] : ['FITNESS_COURSE', 'BOOKS', 'EBOOKS', 'CART'],
				order_status: 'PENDING',
			}
			const response = await GetOrders({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				...(searchTerm && { search: searchTerm }),
				sort,
				sortOrder,
				...filterQuery,
			})

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			// No need for client-side filtering if backend filtering is correct
			let filteredData: any = response.data

			// Map through the filtered data to add merged_items
			filteredData = filteredData?.map((cart: any) => {
				return {
					...cart,
					merged_items: cart.CART?.map((cartItem: any) => {
						const matchingItem = cart.multiple_items.find(
							(item: any) => item.item_id === cartItem?._id
						)
						return {
							...cartItem,
							name: cartItem?.course_name || cartItem?.book_title || cartItem?.ebook_title || cartItem?.name || 'N/A',
							amount: matchingItem?.amount || 0,
							quantity: matchingItem?.quantity || 0,
						}
					}),
				}
			})

			setAbandonedData(filteredData)
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAbandonedData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, itemType])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchAbandonedData()
		}
	}, [searchTerm])

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

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setPagination((prev) => ({ ...prev, page: 1 }))
		const { name, value } = event.target
		setItemType({ ...itemType, [name]: value })
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
				<div className='row justify-content-between mx-3 m-5'>
					<div className='col-md-4 pt-1 d-flex align-items-end'>
						<LengthMenu
							expenseData={abandonedData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='col-md-8'>
						<div className='row align-items-end justify-content-between'>
							<div className='col-md-6 my-md-0 my-4'>
								<SelectField
									className='fv-row m-0'
									label='Select Item Type'
									name='item_type'
									value={itemType.item_type}
									onChange={handleSelectChange}
									htmlFor='item_type'
									options={['FITNESS_COURSE', 'BOOKS']}
									marginRemove={true}
								/>
							</div>
							<div className='col-md-6 d-flex justify-content-end'>
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
						<Table
							data={abandonedData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							removeAction={true}
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
															data.user_info?.profile_image
																? data.user_info.profile_image.startsWith('http')
																	? data.user_info.profile_image
																	: `${FG_GROUP_FILE_BASE_URL}/${data.user_info.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '50px', height: '50px', borderRadius: '50%' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{(data?.user_info?.first_name || 'Deleted User') +
															' ' +
															(data?.user_info?.last_name || '')}
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
												{data?.fitness_course ? (
													data?.fitness_course?.course_name || 'N/A'
												) : data?.books ? (
													data?.books?.book_title || 'N/A'
												) : data?.ebook ? (
													data?.ebook?.ebook_title || 'N/A'
												) : (
													<ul>
														{data.merged_items?.map((item: any, idx: number) => (
															<li key={idx}>
																{item.name} {item.quantity > 1 ? `( × ${item.quantity})` : ''}
															</li>
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
																	data.user_info?.profile_image
																		? data.user_info.profile_image.startsWith('http')
																			? data.user_info.profile_image
																			: `${FG_GROUP_FILE_BASE_URL}/${data.user_info.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px', borderRadius: '50%' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>
																{(data?.user_info?.first_name || 'Deleted User') +
																	' ' +
																	(data?.user_info?.last_name || '')}
															</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{data.user_info?.mobile || '-'}
															</span>
														</div>
													</div>
													<br />
													<strong>{sortableFields[1].title}: </strong> {data?.receipt_id}
													<br />
													<strong>{sortableFields[2].title}: </strong>{' '}
													{data.merged_items && data.merged_items.length > 0 ? (
														<ul>
															{data.merged_items?.map((item: any, idx: number) => (
																<li key={idx}>
																	{item.name} {item.quantity > 1 ? `( × ${item.quantity})` : ''}
																</li>
															))}
														</ul>
													) : (
														<span>
															{data?.fitness_course?.course_name ||
																data?.books?.book_title ||
																data?.ebook?.ebook_title ||
																'N/A'}
														</span>
													)}
													<br />
													<strong>{sortableFields[3].title}: </strong> ₹ {data?.amount}
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

export default FgiitAbandonedList