import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetOrders } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const GlsInvestorProductOrder: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [productName, setProductName] = useState('')
	const [shipmentStatus, setShipmentStatus] = useState('')
	const [formData, setFormData] = useState<any>({
		from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
		to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
	})
	const [orderData, setOrderData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const adminType = localStorage.getItem('admin')

	const fetchOrderData = async (page?: number) => {
		setLoading(true)
		try {
			const filterQuery: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm ? searchTerm : null,
				item_type: ['FG_MEAL_PRODUCT'],
				order_status: 'SUCCESS',
			}

			if (formData.from_date && formData.to_date) {
				filterQuery.from_date = formData.from_date
				filterQuery.to_date = formData.to_date
			}

            const minDateStr = '2024-06-05'
            const minDate = new Date(`${minDateStr}T00:00:00Z`).getTime()
            if (!filterQuery.from_date || new Date(filterQuery.from_date).getTime() < minDate) {
                filterQuery.from_date = minDateStr
            }
			
			const response = await GetOrders(filterQuery)
			const data: any = response.data
			
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			
			setOrderData(data)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchOrderData()
	}, [formData.from_date, formData.to_date, shipmentStatus, productName, pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true);

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

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setFormData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const filteredOrderData = orderData.filter((order: any) => {
		const userMatch =
			order?.user_info?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order?.user_info?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order?.user_info?.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			searchTerm === ''

		const productMatch = productName
			? order.order_item_type === 'CART' ||
			  (order.order_item_type === 'FG_MEAL_PRODUCT' &&
					order.product?.name?.toLowerCase().includes(productName.toLowerCase()))
			: true

		return userMatch && productMatch
	})

	const paginatedOrderData = filteredOrderData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const orderStatusOption = ['PLACED', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURN']

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'User', field: 'user_info.first_name' },
		{ title: 'Receipt ID', field: 'receipt_id' },
		{ title: 'Items with Quantity', field: 'product.name' },
		{ title: 'Total Price', field: 'amount' },
		{ title: 'Purchased On', field: 'createdAt' },
		{ title: 'Shipment Status', field: 'order_status' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Product Order</PageTitle>
			<KTCard>
				<div className='col-md-12 mt-5 px-5'>
					<div className='row'>
						<InputField
							placeholder='Enter Product Name'
							type='text'
							className='col-md-3 fv-row'
							name='productName'
							label='Product Name'
							htmlFor='productName'
							value={productName}
							onChange={(e) => setProductName(e.target.value)}
						/>
						<InputField
							placeholder='From Date'
							type='date'
							className='col-md-2 fv-row'
							name='from_date'
							label='From Date'
							htmlFor='from_date'
							value={formData.from_date}
							onChange={handleInputChange}
						/>
						<InputField
							placeholder='To Date'
							type='date'
							className='col-md-2 fv-row'
							name='to_date'
							label='To Date'
							htmlFor='to_date'
							value={formData.to_date}
							onChange={handleInputChange}
						/>
						<SelectField
							className='col-md-3 fv-row'
							name='shipmentStatus'
							label='Shipment Status'
							htmlFor='shipmentStatus'
							value={shipmentStatus}
							onChange={(e) => setShipmentStatus(e.target.value)}
							options={orderStatusOption}
						/>
					</div>
				</div>
				<div className='d-flex justify-content-between mx-3 m-5'>
					<div className='d-flex pt-1 mx-2'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
					<div className='me-5'>
						<LengthMenu
							expenseData={orderData}
							handleItemsPerPageChange={handleItemsPerPageChange}
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
							onSortChange={handleSortChange}
							renderRow={(order: any, index: number, actualIndex: number, isVisible: boolean) => {
								let currentPlanData: any
								let itemName: any = []

								switch (order.order_item_type) {
									case 'CART':
										const cartItems = order.CART || []
										const multipleItems = order.multiple_items || []

										itemName = multipleItems
											.map((multiItem: any) => {
												const cartItem = cartItems.find(
													(cart: any) => cart?._id === multiItem?.item_id
												)

												if (cartItem) {
													return {
														name: `${cartItem.name || 'N/A'} (x ${multiItem.quantity || 1})`, // Properly group the expression
													}
												}
												return null
											})
											.filter(Boolean)
										break

									case 'FG_MEAL_PRODUCT':
										currentPlanData = order.product
										itemName = [currentPlanData || 'N/A']
										break

									default:
										itemName = []
										break
								}
								const trackingSource =
									order.order_item_type === 'CART'
										? order?.user_meal_product?.tracking || []
										: order?.product_subscription?.tracking || []

								const shipment_status =
									trackingSource.find(
										(tracking: { shipment_status: string; status: boolean }) =>
											tracking.status && tracking.shipment_status === 'DELIVERED'
									)?.shipment_status ||
									trackingSource.find(
										(tracking: { shipment_status: string; status: boolean }) =>
											tracking.status && tracking.shipment_status === 'DISPATCHED'
									)?.shipment_status ||
									trackingSource.find(
										(tracking: { shipment_status: string; status: boolean }) =>
											tracking.status && tracking.shipment_status === 'PLACED'
									)?.shipment_status ||
									'No Status Available'

								return (
									<React.Fragment key={order?._id}>
										<tr
											onClick={() => handleRowClick(order?._id)}
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
																order?.user_info?.profile_image
																	? `https://files.fggroup.in/${order?.user_info?.profile_image}`
																	: toAbsoluteUrl('/media/logos/fgiit-logo.png')
															}
															alt='User'
															style={{ width: '50px', height: '50px' }}
														/>
													</div>
													<div className='d-flex justify-content-start flex-column'>
														<span className='text-dark fw-bold fs-6'>
															{(order?.user_info?.first_name || 'DELETED USER') +
																' ' +
																(order?.user_info?.last_name || ' ') || 'N/A'}
														</span>
														<span className='text-muted fw-semibold text-muted d-flex fs-7'>
															{order?.user_info?.mobile || 'N/A'}
														</span>
													</div>
												</div>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{order.receipt_id || 'N/A'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													<ul>
														{itemName.map((name: any, index: number) => (
															<li key={index}>{name.name}</li>
														))}
													</ul>
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{order.amount + ' ' + (order.currency || 'INR')}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>
													{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  mb-1 fs-6'>
													{shipment_status || 'N/A'}
												</span>
											</td>
											<td>
												<div className='d-flex'>
													<TableButton
														action='view'
														to={'/gls-investor/product-order-view?order_id=' + order?._id}
														text='View'
														showIcon={false}
														backgroundDark={true}
													/>
												</div>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div>
														<strong>{sortableFields[1].title}: </strong>{' '}
														<img
															src={`https://files.fggroup.in/${order.cover_image}`}
															alt={order.book_title}
															className='fs-3 text-primary'
															style={{ width: '65px', height: '65px', borderRadius: '20%' }}
														/>
														<br />
														<strong>{sortableFields[0].title}: </strong> {order.book_title}
														<br />
														<strong>{sortableFields[2].title}: </strong> ₹ {order.amount}
														<br />
														<strong>{sortableFields[3].title}: </strong>{' '}
														{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
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
					{orderData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{orderData.length > 0 && (
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

export default GlsInvestorProductOrder
