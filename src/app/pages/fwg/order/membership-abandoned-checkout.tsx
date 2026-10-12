import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { MultiSelect } from 'react-multi-select-component'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetOrders } from '../../../Functions/FGGroup/Orders'

const MembershipAbandonedCheckoutFWG: React.FC = () => {
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
	const [statusData, setStatusData] = useState<any>([{ value: 'PENDING', label: 'PENDING' }])
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
				item_type: ['PT_PLAN'] // Filter specifically for Membership Plans
			}

			if (Array.isArray(statusData) && statusData.length > 0) {
				filterQuery.order_status = statusData.map((item) => item?.value).filter(Boolean)
			}

			if (startDate && endDate) {
				filterQuery.from_date = DayJS(startDate).format('YYYY-MM-DD')
				filterQuery.to_date = DayJS(endDate).format('YYYY-MM-DD')
			}
			if (user_id) {
				filterQuery.user_id = user_id
			}

			const response: any = await GetOrders({ ...filterQuery })
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
		statusData,
	])

	const downloadExcel = () => {
		const worksheetData = orderData.map((order: any) => {
			return {
				'Receipt ID': order.receipt_id || 'N/A',
				'User Name': `${order?.user_info?.first_name || '-'} ${order?.user_info?.last_name || ''}`,
				Mobile: order?.user_info?.mobile || 'N/A',
				'Plan Name': order?.fitness_plan?.plan_name || '-',
				Amount: `${order.amount} ${order.currency || 'INR'}`,
				'Order Created At': DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
				'Order Status': order.status || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Abandoned Checkouts')
		XLSX.writeFile(workbook, 'MembershipAbandonedCheckoutData.xlsx')
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

	const handleOrderInputChange = (
		event:
			| React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
			| { target: { name: string; value: any } }
	) => {
		setPagination((prev) => ({ ...prev, page: 1 }))
		const { value } = event.target
		setStatusData(value)
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

	const sortableFields = [
		{ title: 'User', field: 'user_info.first_name' },
		{ title: 'Receipt ID', field: 'receipt_id' },
		{ title: 'Plan Name', field: 'fitness_plan.plan_name' },
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
			case 'SUCCESS': return 'success'
			case 'FAILED': return 'danger'
			case 'CANCELLED': return 'secondary'
			case 'PENDING': return 'warning'
			case 'REFUNDED': return 'primary'
			default: return 'dark'
		}
	}

	return (
		<>
			<PageTitle>Membership Abandoned Checkouts</PageTitle>
			<KTCard className='py-5'>
				<div className='row justify-content-between align-items-center mx-3 m-5 mt-0 me-0 px-2'>
					<div className='col-md-8 d-flex align-items-center justify-content-md-start justify-content-center pt-md-1 pt-0'>
						<SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
						<select
							className='form-select form-select-sm mx-3'
							style={{ width: '80px' }}
							onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}>
							<option value='10'>10</option>
							<option value='25'>25</option>
							<option value='50'>50</option>
						</select>
					</div>
					<div className='col-md-4 mt-md-0 mt-5 d-flex justify-content-end align-items-center'>
						<button className='btn btn-primary btn-sm' onClick={downloadExcel} disabled={loading}>
							<FontAwesomeIcon icon={faDownload} className='me-2' /> Excel
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
							renderRow={(order: any, index: number, actualIndex: number, isVisible: boolean) => (
								<tr key={order._id} onClick={() => handleRowClick(order._id)} className='data-row'>
									<td>
										<span className='text-dark ms-6 fw-bold  d-block mb-1 fs-6'>
											{actualIndex}
										</span>
									</td>
									<td>
										<div className='d-flex align-items-center'>
											<div className='symbol symbol-45px me-5'>
												<img
													src={
														order?.user_info?.profile_image
															? order?.user_info?.profile_image.startsWith('http')
																? order?.user_info?.profile_image
																: `${FG_GROUP_FILE_BASE_URL}/${order?.user_info?.profile_image}`
															: toAbsoluteUrl('/media/logos/fgiit-logo.png')
													}
													alt='User'
													style={{ width: '40px', height: '40px', borderRadius: '50%' }}
												/>
											</div>
											<div className='d-flex justify-content-start flex-column'>
												<span className='text-dark fw-bold fs-6'>
													{(order?.user_info?.first_name || '-') + ' ' + (order?.user_info?.last_name || '')}
												</span>
												<span className='text-muted fw-semibold d-block fs-7'>
													{order?.user_info?.mobile || 'N/A'}
												</span>
											</div>
										</div>
									</td>
									<td><span className='text-dark fw-bold d-block fs-6'>{order.receipt_id || 'N/A'}</span></td>
									<td><span className='text-dark fw-bold d-block fs-6'>{order?.fitness_plan?.plan_name || '-'}</span></td>
									<td><span className='text-dark fw-bold d-block fs-6'>{order.amount} {order.currency || 'INR'}</span></td>
									<td><span className='text-dark fw-bold d-block fs-6'>{DayJS(order.createdAt).format('DD/MM/YYYY hh:mm A')}</span></td>
									<td>
										<span className={`badge badge-light-${getStatusColor(order.status)} fw-bold fs-7`}>
											{order.status || 'N/A'}
										</span>
									</td>
									<td>
										<TableButton action='view' to={'/fwg/all-order/view-order?order_id=' + order._id} />
									</td>
								</tr>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
				</div>
				{orderData?.length > 0 && (
					<div className='px-5 flex justify-end'>
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

export default MembershipAbandonedCheckoutFWG
