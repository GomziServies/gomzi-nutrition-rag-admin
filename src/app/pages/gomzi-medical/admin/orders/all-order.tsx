import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import SearchFilter from '../../../../components/SearchFilter'
import SelectField from '../../../../components/SelectField'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { GetMedicalOrders } from '../../../../Functions/FGGroup'

const GMAllOrder: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const user_id: any = searchParams.get('user_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [orderData, setOrderData] = useState<any>([])
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [formData, setFormData] = useState<any>({
		itemName: '',
		order_status: '',
		// itemType: [],
		// from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
		// to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
	})

	const fetchOrderData = async (page?: number) => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange.map((dateStr) => new Date(dateStr))
				startDate = new Date(startDate.setHours(0, 0, 0, 0))
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			}

			const filterQuery: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm ? searchTerm : null,
			}

			if (formData.order_status) {
				filterQuery.order_status = formData.order_status
			}
			// if (startDate && endDate) {
			// 	filterQuery.from_date = DayJS(startDate).format('YYYY-MM-DD')
			// 	filterQuery.to_date = DayJS(endDate).format('YYYY-MM-DD')
			// }
			// if (formData.itemType.length > 0) {
			// 	filterQuery.item_type = formData.itemType.map((el: any) => el.value)
			// }
			if (user_id) {
				filterQuery.user_id = user_id
			}

			const response = await GetMedicalOrders(filterQuery)
			const data: any = response.data
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			const filteredData = data.map((AllData: any) => {
				const cartItems = AllData.CART || []
				const multipleItems = AllData.multiple_items || []

				let productData
				productData = multipleItems
					.map((multiItem: any) => {
						const cartItem = cartItems.find((cart: any) => cart?._id === multiItem.item_id)
						if (cartItem) {
							return {
								name: cartItem.name,
								type: multiItem.item_type || 'Unknown',
								quantity: multiItem.quantity || 1,
								id: multiItem?._id || 'Unknown',
							}
						}
						return null
					})
					.filter(Boolean)

				return {
					...AllData,
					productData,
				}
			})

			setOrderData(filteredData)
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false) // Ensure loading is stopped in both success and error cases
		}
	}

	useEffect(() => {
		fetchOrderData()
	}, [
		formData.order_status,
		// formData.from_date,
		// formData.to_date,
		// formData.itemType,
		sort,
		sortOrder,
		pagination.page,
		pagination.itemsPerPage,
		user_id,
		// selectedDateRange,
	])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchOrderData()
		}
	}, [searchTerm])

	// useEffect(() => {
	// 	setPagination((prev) => ({ ...prev, page: 1 }))
	// 	if (pagination.page === 1) fetchOrderData()
	// }, [searchTerm, user_id])

	const handleInputChange = (
		event:
			| React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
			| { target: { name: string; value: any } }
	) => {
		setPagination((prev) => ({ ...prev, page: 1 }))
		const { name, value } = event.target
		setFormData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	// const handleDateRangeChange = (range: [Date, Date] | null) => {
	// 	setSelectedDateRange(range)
	// 	setPagination((prev) => ({ ...prev, page: 1 }))
	// }

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const orderStatusOption = ['SUCCESS', 'PENDING']

	const sortableFields = [
		{ title: 'User', field: 'user_info.first_name' },
		{ title: 'Item Name', field: 'itemName' },
		{ title: 'Disease', field: 'disease' },
		{ title: 'Order Status', field: 'status' },
		{ title: 'Doctor Status', field: 'status' },
		{ title: 'Pharmacy Status', field: 'status' },
		{ title: 'Order Created At', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'SUCCESS':
				return 'success'
			case 'PENDING':
				return 'warning'
			default:
				return 'dark'
		}
	}

	const filteredAdminData = orderData.filter((admin: any) =>
		admin?.user_info?.first_name.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedAdminData = filteredAdminData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle>User Orders</PageTitle>
			<KTCard className='py-5'>
				<div className='col-md-12 mt-8 px-5'>
					<div className='row justify-content-between'>
						<div className='col-md-12'>
							<div className='row'>
								{/* <div className='col-md-4 mt-md-0 mt-3'>
									<label
										className='fw-bold fs-6 mb-5'
										htmlFor='Select'>
										Select Date
									</label>
									<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
								</div> */}
							</div>
						</div>
					</div>
				</div>
				<div className='row justify-content-between mx-3 m-5 mt-0 me-0'>
					<div className='col-md-6 d-flex justify-content-md-start justify-content-center pt-md-1 pt-0'>
						<div className='d-flex align-items-center justify-content-between'>
							<div>
								<select
									className='form-select form-select mx-3'
									onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}>
									<option value='10'>10</option>
									<option value='25'>25</option>
									<option value='50'>50</option>
								</select>
							</div>
						</div>
					</div>
					<SelectField
						className='col-md-3 fv-row'
						name='order_status'
						label='Order Status'
						htmlFor='orderStatus'
						value={formData.order_status}
						onChange={handleInputChange}
						options={orderStatusOption}
						multiSelect
						marginRemove={true}
					/>
					<div className='col-md-3 mt-md-0 mt-5 d-flex align-items-end'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={orderData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							manualSearch={searchTerm}
							onSortChange={handleSortChange}
							renderRow={(order: any, index: number, actualIndex: number, isVisible: boolean) => {
								return (
									<React.Fragment key={index}>
										<tr
											onClick={() => handleRowClick(order?._id)}
											className='data-row'>
											<td>
												<span className='text-dark ms-6 fw-bold  d-block mb-1 fs-6'>
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
													<div className='symbol symbol-45px me-5'>
														<img
															src={
																order?.user_info?.profile_image
																	? `https://files.fggroup.in/${order?.user_info?.profile_image}`
																	: toAbsoluteUrl('/media/logos/fgiit-logo.png')
															}
															alt='User'
															style={{ width: '50px', height: '50px' }}
														/>
													</div>
													<div className='d-flex justify-content-start flex-column'>
														<span className='text-dark fw-bold  fs-6'>
															{(order?.user_info?.first_name || '-') +
																' ' +
																(order?.user_info?.last_name || '')}
														</span>
														<span className='text-muted fw-semibold text-muted d-block fs-7'>
															{order?.user_info?.mobile || 'N/A'}
														</span>
													</div>
												</div>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{order?.productData ? (
														<ul>
															{order?.productData &&
																order?.productData.map((product: any, index: any) => (
																	<li key={index}>
																		{product?.name} (×{product?.quantity})
																	</li>
																))}
														</ul>
													) : order?.order_item_type == 'FG_MEAL_PRODUCT' ? (
														order?.product?.name + ` (×${order?.notes?.quantity})`
													) : (
														''
													)}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{order.disease || '-'}
												</span>
											</td>
											<td>
												<span
													className={`fw-bold d-block mb-1 fs-6 text-${getStatusColor(
														order.status
													)}`}>
													{order.status || 'N/A'}
												</span>
											</td>
											<td>
												<span
													className={`fw-bold d-block mb-1 fs-6 text-${getStatusColor(
														order.doctor_approval.status
													)}`}>
													{order.doctor_approval.status || 'N/A'}
												</span>
											</td>
											<td>
												<span
													className={`fw-bold d-block mb-1 fs-6 text-${getStatusColor(
														order.pharmacy_approval.status
													)}`}>
													{order.pharmacy_approval.status || 'N/A'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</span>
											</td>
											<td>
												<TableButton
													action='view'
													to={`/gomzi-medical/all-order/view-order?order_id=` + order?._id}
												/>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div>
														<div className='d-flex align-items-center'>
															<div className='symbol symbol-45px me-5'>
																<img
																	src={
																		order?.user_info?.profile_image
																			? `https://files.fggroup.in/${order?.user_info?.profile_image}`
																			: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																	}
																	alt='User'
																	style={{ width: '50px', height: '50px' }}
																/>
															</div>
															<div className='d-flex justify-content-start flex-column'>
																<span className='text-dark fw-bold  fs-6'>
																	{(order?.user_info?.first_name || '-') +
																		' ' +
																		(order?.user_info?.last_name || '')}
																</span>
																<span className='text-muted fw-semibold text-muted d-block fs-7'>
																	{order?.user_info?.mobile || 'N/A'}
																</span>
															</div>
														</div>
														<br />
														<strong>{sortableFields[1].title}: </strong> {order.receipt_id || 'N/A'}
														<br />
														<strong>{sortableFields[2].title}: </strong>{' '}
														{order.gateway_order_id || 'N/A'}
														{/* <br />
														<strong>{sortableFields[3].title}: </strong> {itemName}
														<br />
														<strong>{sortableFields[4].title}: </strong> {itemType} */}
														<br />
														<strong>{sortableFields[5].title}: </strong>{' '}
														{order.amount + ' ' + (order.currency || 'INR')}
														<br />
														<strong>{sortableFields[6].title}: </strong>{' '}
														{(!isNaN(order?.payment_breakdowns?.paid_amount)
															? order.payment_breakdowns.paid_amount
															: order.amount) +
															' ' +
															(order.currency || 'INR')}
														<br />
														<strong>{sortableFields[7].title}: </strong>{' '}
														{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
														<br />
														<strong>{sortableFields[8].title}: </strong> {order.status || 'N/A'}
														<br />
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								)
							}}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
				</div>
				{orderData.length === 0 && !loading && (
					<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
						<b>No records found</b>
					</div>
				)}
				{orderData.length > 0 && (
					<div className='me-5'>
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</KTCard>
		</>
	)
}

export default GMAllOrder
