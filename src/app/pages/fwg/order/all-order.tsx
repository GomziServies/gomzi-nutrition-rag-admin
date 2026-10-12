import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { MultiSelect } from 'react-multi-select-component'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetOrders } from '../../../Functions/FWG/orders'

const AllOrderFWG: React.FC = () => {
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
	const [statusData, setStatusData] = useState<any>([])
	const [itemType, setItemType] = useState<any>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

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

			if (Array.isArray(itemType) && itemType.length > 0) {
				filterQuery.order_item_type = itemType.map((item) => item?.value).filter(Boolean)
			}

			if (Array.isArray(statusData) && statusData.length > 0) {
				filterQuery.status = statusData.map((item) => item?.value).filter(Boolean)
			}

			if (startDate && endDate) {
				filterQuery.from_date = DayJS(startDate).format('YYYY-MM-DD')
				filterQuery.to_date = DayJS(endDate).format('YYYY-MM-DD')
			}
			if (user_id) {
				filterQuery.user_id = user_id
			}

			const response = await GetOrders({ ...filterQuery })
			const data: any = response.data
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			setOrderData(data)
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchOrderData()
	}, [
		sort,
		sortOrder,
		pagination.page,
		pagination.itemsPerPage,
		user_id,
		selectedDateRange,
		itemType,
		statusData,
	])

	const downloadExcel = () => {
		const worksheetData = orderData.map((order: any) => {
			const itemType = String(order.order_item_type).split('_').join(' ')

			return {
				'Receipt ID': order.receipt_id || 'N/A',
				'User Name': `${order?.user?.firstName || '-'} ${order?.user?.lastName || ''}`,
				Mobile: order?.user?.mobile || 'N/A',
				'Item Name': order?.feature
					? order?.feature?.title
					: order?.plan
					? order?.plan?.plan_title
					: '-',
				'Item Type': itemType,
				Amount: `${order.amount} ${order.currency || 'INR'}`,
				'Order Created At': DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
				'Order Status': order.status || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
		XLSX.writeFile(workbook, 'OrderData.xlsx')
	}

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
		const { value } = event.target
		setItemType(value)
	}

	const handleOrderInputChange = (
		event:
			| React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
			| { target: { name: string; value: any } }
	) => {
		setPagination((prev) => ({ ...prev, page: 1 }))
		const { value } = event.target
		setStatusData(value)
	}

	// const handleOrderInputChange = (
	// 	event:
	// 		| React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	// 		| { target: { name: string; value: any } }
	// ) => {
	// 	const { name, value } = event.target

	// 	setFormData((prevData: any) => {
	// 		let selectedOptions = value
	// 		if (!Array.isArray(value)) {
	// 			selectedOptions = value.includes(',') ? value.split(',') : [value] // Split comma-separated values if needed
	// 		}
	// 		return {
	// 			...prevData,
	// 			[name]: selectedOptions.filter(Boolean), // Remove empty values
	// 		}
	// 	})
	// }

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const getItemNames = () => {
		const itemNamesSet: Set<string> = new Set()

		orderData.forEach((order: any) => {
			switch (order.order_item_type) {
				case 'FG_MEAL_PRODUCT':
					itemNamesSet.add(order.product?.name || 'N/A')
					break
				case 'PT_PLAN':
					itemNamesSet.add(order.fitness_plan?.plan_name || 'N/A')
					break
				case 'FITNESS_COURSE':
					itemNamesSet.add(order.fitness_course?.course_name || 'N/A')
					break
				case 'DIGITAL_PLAN':
					itemNamesSet.add(order.digital_plan?.plan_name || 'N/A')
					break
				case 'BOOKS':
					itemNamesSet.add(order.books?.book_title || 'N/A')
					break
				case 'EBOOKS':
					itemNamesSet.add(order.ebook?.ebook_title || 'N/A')
					break
				default:
					break
			}
		})

		// Convert set to array of strings
		const itemNamesOptions = Array.from(itemNamesSet)

		return itemNamesOptions
	}

	const itemNameOption: any[] = getItemNames()

	const itemTypeOption = [
		{
			value: 'FEATURE',
			label: 'Feature',
		},
		{
			value: 'PLAN',
			label: 'Plan',
		},
	]

	const orderStatusOption = [
		{
			value: 'SUCCESS',
			label: 'SUCCESS',
		},
		{
			value: 'WITHDRAW',
			label: 'WITHDRAW',
		},
		{
			value: 'PENDING',
			label: 'PENDING',
		},
		{
			value: 'FAILED',
			label: 'FAILED',
		},
		{
			value: 'CANCELLED',
			label: 'CANCELLED',
		},
		{
			value: 'REFUNDED',
			label: 'REFUNDED',
		},
	]

	// const orderStatusOption = ['SUCCESS', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED', 'WITHDRAW']

	const sortableFields = [
		{ title: 'User', field: 'user_info.first_name' },
		{ title: 'Receipt ID', field: 'receipt_id' },
		{ title: 'Item Name', field: 'itemName' },
		{ title: 'Item Type', field: 'itemType' },
		{ title: 'Amount', field: 'amount' },
		{ title: 'Order Created At', field: 'createdAt' },
		{ title: 'Order Status', field: 'status' },
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
			case 'FAILED':
				return 'danger'
			case 'CANCELLED':
				return 'Secondary'
			case 'PENDING':
				return 'warning'
			case 'REFUNDED':
				return 'primary'
			case 'WITHDRAW':
				return 'danger'
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
							<div className='row justify-content-between mb-5'>
								<div className='col-md-4'>
									<label
										className='fw-bold fs-6 mb-5'
										htmlFor='Select'>
										Item Type
									</label>
									<MultiSelect
										options={itemTypeOption}
										value={itemType}
										hasSelectAll={true}
										onChange={(selected: any) =>
											handleInputChange({ target: { name: 'itemType', value: selected } })
										}
										labelledBy='Select'
										className='col-md-12 fv-row'
									/>
								</div>
								<div className='col-md-4'>
									<label
										className='fw-bold fs-6 mb-5'
										htmlFor='Select'>
										Select Status
									</label>
									<MultiSelect
										options={orderStatusOption}
										value={statusData}
										hasSelectAll={true}
										onChange={(selected: any) =>
											handleOrderInputChange({ target: { name: 'order_status', value: selected } })
										}
										labelledBy='Select'
										className='col-md-12 fv-row'
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='row justify-content-between mx-3 m-5 mt-0 me-0'>
					<div className='col-md-8 d-flex justify-content-md-start justify-content-center pt-md-1 pt-0'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
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
					<div className='col-md-4 mt-md-0 mt-5 d-flex justify-content-end'>
						<button
							className='btn btn-primary ms-5 mx-2'
							onClick={downloadExcel}
							disabled={loading}>
							<FontAwesomeIcon
								icon={faDownload}
								className='fs-3'
								style={{ marginRight: '10px' }}
							/>
							Excel
						</button>
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
								const itemType: string =
									order?.order_item_type == 'CART'
										? String(order?.productData?.[0]?.type).split('_').join(' ')
										: String(order?.order_item_type).split('_').join(' ')

								return (
									<React.Fragment key={order._id}>
										<tr
											onClick={() => handleRowClick(order._id)}
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
																order?.user?.profile_image
																	? `${order?.user?.profile_image}`
																	: toAbsoluteUrl('/media/logos/fgiit-logo.png')
															}
															alt='User'
															style={{ width: '50px', height: '50px' }}
														/>
													</div>
													<div className='d-flex justify-content-start flex-column'>
														<span className='text-dark fw-bold  fs-6'>
															{(order?.user?.firstName || '-') +
																' ' +
																(order?.user?.lastName || '')}
														</span>
														<span className='text-muted fw-semibold text-muted d-block fs-7'>
															{order?.user?.mobile || 'N/A'}
														</span>
													</div>
												</div>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{order.receipt_id || 'N/A'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{order?.feature
														? order?.feature?.title
														: order?.plan
														? order?.plan?.plan_title
														: '-'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{itemType}</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{order.amount + ' ' + (order.currency || 'INR')}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
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
												<TableButton
													action='view'
													to={'/fwg/all-order/view-order?order_id=' + order._id}
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
														<br />
														{/* <strong>{sortableFields[3].title}: </strong> {itemName} */}
														<br />
														<strong>{sortableFields[4].title}: </strong> {itemType}
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
				{orderData?.length === 0 && !loading && (
					<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
						<b>No records found</b>
					</div>
				)}
				{orderData?.length > 0 && (
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

export default AllOrderFWG
