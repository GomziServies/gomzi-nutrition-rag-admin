import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { MultiSelect } from 'react-multi-select-component'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import LengthMenu from '../../../../components/LengthMenu'
import DownloadExcelButton from '../../../../components/DownloadExcelButton'
import SearchFilter from '../../../../components/SearchFilter'
import SelectField from '../../../../components/SelectField'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { GetOrders } from '../../../../Functions/FGGroup'

const NutritionAllOrder: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const user_id: any = searchParams.get('employee_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [orderData, setOrderData] = useState<any>([])
	const [sort, setSort] = useState('')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [formData, setFormData] = useState<any>({
		itemName: '',
		itemType: [],
		from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
		to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
		order_status: 'SUCCESS',
	})

	const fetchOrderData = async (page?: number) => {
		setLoading(true)
		try {
			const filterQuery: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				searchTerm,
			}

			if (formData.order_status) {
				filterQuery.order_status = formData.order_status || 'SUCCESS'
			}
			if (formData.from_date && formData.to_date) {
				filterQuery.from_date = formData.from_date
				filterQuery.to_date = formData.to_date
			}
			if (formData.itemType.length > 0) {
				filterQuery.item_type = formData.itemType.map((el: any) => el.value)
			}
			if (formData.itemName) {
				filterQuery.item_name = formData.itemName
			}
			// Ensure user_id is not cleared if it's already set
			if (user_id) {
				filterQuery.user_id = user_id
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
	}, [
		formData.order_status,
		formData.from_date,
		formData.to_date,
		formData.itemType,
		formData.itemName,
		sort,
		sortOrder,
		pagination.page,
		pagination.itemsPerPage,
		user_id,
	])

	const downloadExcel = () => {
		const worksheetData = orderData.map((order: any) => {
			const itemType = String(order.order_item_type).split('_').join(' ')
			let itemName = '-'
			switch (order.order_item_type) {
				case 'FG_MEAL_PRODUCT':
					itemName = order.product?.name || 'N/A'
					break
				case 'PT_PLAN':
					itemName = order.fitness_plan?.plan_name || 'N/A'
					break
				case 'FITNESS_COURSE':
					itemName = order.fitness_course?.course_name || 'N/A'
					break
				case 'DIGITAL_PLAN':
					itemName = order.digital_plan?.plan_name || 'N/A'
					break
				case 'BOOKS':
					itemName = order.book?.book_title || 'N/A'
					break
				case 'EBOOKS':
					itemName = order.ebook?.ebook_title || 'N/A'
					break
			}

			return {
				'Receipt ID': order.receipt_id || 'N/A',
				'Gateway ID': order.gateway_order_id || 'N/A',
				'User Name': `${order?.user_info?.first_name || '-'} ${order?.user_info?.last_name || ''}`,
				Mobile: order?.user_info?.mobile || 'N/A',
				'Item Name': itemName,
				'Item Type': itemType,
				Amount: `${order.amount} ${order.currency || 'INR'}`,
				'Paid Amount': `${
					!isNaN(order?.payment_breakdowns?.paid_amount)
						? order.payment_breakdowns.paid_amount
						: order.amount
				} ${order.currency || 'INR'}`,
				'Order Created At': DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
				'Order Status': order.status || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
		XLSX.writeFile(workbook, 'OrderData.xlsx')
	}

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
		if (pagination.page === 1) fetchOrderData()
	}, [searchTerm, user_id])

	const handleInputChange = (
		event:
			| React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
			| { target: { name: string; value: any } }
	) => {
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
					itemNamesSet.add(order.book?.book_title || 'N/A')
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
			value: 'FG_MEAL_PRODUCT',
			label: 'FG Meal Product',
		},
		{
			value: 'PT_PLAN',
			label: 'PT Plan',
		},
		{
			value: 'FITNESS_COURSE',
			label: 'Fitness Course',
		},
		{
			value: 'DIGITAL_PLAN',
			label: 'Digital Plan',
		},
		{
			value: 'BOOKS',
			label: 'Books',
		},
		{
			value: 'EBOOKS',
			label: 'Ebooks',
		},
	]

	const orderStatusOption = ['SUCCESS', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED']

	const sortableFields = [
		{ title: 'User', field: 'user_info.first_name' },
		{ title: 'Receipt ID', field: 'receipt_id' },
		{ title: 'Gateway ID', field: 'gateway_order_id' },
		{ title: 'Item Name', field: 'itemName' },
		{ title: 'Item Type', field: 'itemType' },
		{ title: 'Amount', field: 'amount' },
		{ title: 'Paid Amount', field: 'payment_breakdowns.paid_amount' },
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
					<div className='row'>
						<SelectField
							className='col-md-2 fv-row'
							name='itemName'
							label='Item Name'
							htmlFor='itemName'
							value={formData.itemName}
							options={itemNameOption}
							onChange={handleInputChange}
						/>
						<div className='col-2'>
							<label
								className='fw-bold fs-6 mb-5'
								htmlFor='Select'>
								Item Type
							</label>
							<MultiSelect
								options={itemTypeOption}
								value={formData.itemType}
								hasSelectAll={true}
								onChange={(selected: any) =>
									handleInputChange({ target: { name: 'itemType', value: selected } })
								}
								labelledBy='Select'
								className='col-md-12 fv-row'
							/>
						</div>
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
							className='col-md-2 fv-row'
							name='order_status'
							label='Order Status'
							htmlFor='orderStatus'
							value={formData.order_status}
							onChange={handleInputChange}
							options={orderStatusOption}
							multiSelect
						/>
					</div>
				</div>
				<div className='d-flex align-items-center flex-wrap gap-3 mx-3 m-5'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						className='me-0'
					/>
					<LengthMenu handleItemsPerPageChange={handleItemsPerPageChange} className='me-0' />
					<div>
						<DownloadExcelButton
							onClick={downloadExcel}
							disabled={loading}
							title='Export to Excel'
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
								let currentPlanData: any
								let itemName: any = '-'
								const itemType: string = String(order.order_item_type).split('_').join(' ')

								switch (order.order_item_type) {
									case 'FG_MEAL_PRODUCT':
										currentPlanData = order.product
										itemName = currentPlanData?.name || 'N/A'
										break
									case 'PT_PLAN':
										currentPlanData = order.fitness_plan
										itemName = currentPlanData?.plan_name || 'N/A'
										break
									case 'FITNESS_COURSE':
										currentPlanData = order.fitness_course
										itemName = currentPlanData?.course_name || 'N/A'
										break
									case 'DIGITAL_PLAN':
										currentPlanData = order.digital_plan
										itemName = currentPlanData?.plan_name || 'N/A'
										break
									case 'BOOKS':
										currentPlanData = order.book
										itemName = currentPlanData?.book_title || 'N/A'
										break
									case 'EBOOKS':
										currentPlanData = order.ebook
										itemName = currentPlanData?.ebook_title || 'N/A'
										break
								}

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
													{order.receipt_id || 'N/A'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{order.gateway_order_id || 'N/A'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{itemName}</span>
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
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{(!isNaN(order?.payment_breakdowns?.paid_amount)
														? order.payment_breakdowns.paid_amount
														: order.amount) +
														' ' +
														(order.currency || 'INR')}
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
													to={'/rag/all-order/view-order?order_id=' + order._id}
												/>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div>
														<strong>{sortableFields[0].title}: </strong> {order.receipt_id || 'N/A'}
														<br />
														<strong>{sortableFields[1].title}: </strong>{' '}
														{order.gateway_order_id || 'N/A'}
														<br />
														<strong>{sortableFields[2].title}: </strong>{' '}
														{(order?.user_info?.first_name || '-') +
															' ' +
															(order?.user_info?.last_name || '')}
														<br />
														<strong>{sortableFields[3].title}: </strong>{' '}
														{order?.user_info?.mobile || 'N/A'}
														<br />
														<strong>{sortableFields[4].title}: </strong> {itemName}
														<br />
														<strong>{sortableFields[5].title}: </strong> {itemType}
														<br />
														<strong>{sortableFields[6].title}: </strong>{' '}
														{order.amount + ' ' + (order.currency || 'INR')}
														<br />
														<strong>{sortableFields[7].title}: </strong>{' '}
														{(!isNaN(order?.payment_breakdowns?.paid_amount)
															? order.payment_breakdowns.paid_amount
															: order.amount) +
															' ' +
															(order.currency || 'INR')}
														<br />
														<strong>{sortableFields[8].title}: </strong>{' '}
														{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
														<br />
														<strong>{sortableFields[9].title}: </strong> {order.status || 'N/A'}
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
							totalRecords={metaData?.totalDocs ?? metaData?.totalRecords ?? metaData?.totalCount ?? orderData.length}
							itemsPerPage={pagination.itemsPerPage}
							entityName='orders'
						/>
					</div>
				)}
			</KTCard>
		</>
	)
}

export default NutritionAllOrder
