import {
	faClock,
	faDownload,
	faExclamationTriangle,
	faEye,
	faReceipt,
	faUserTimes,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import NumberTicker from '../../../components/NumberTicker'
import SearchFilter from '../../../components/SearchFilter'
import GomziTablePagination from '../../../components/GomziTablePagination'
import { GetOrders } from '../../../Functions/FGGroup'
import '../products-theme.css'

const AbandonedList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [abandonedData, setAbandonedData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort] = useState('createdAt')
	const [sortOrder] = useState<QuerySortOptions>('desc')
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [formData, setFormData] = useState<any>({
		from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
		to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
	})

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		if (range && range[0] && range[1]) {
			setFormData({
				from_date: DayJS(range[0]).format('YYYY-MM-DD'),
				to_date: DayJS(range[1]).format('YYYY-MM-DD'),
			})
		} else {
			setFormData({
				from_date: '',
				to_date: '',
			})
		}
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const fetchAbandonedData = async (page?: number) => {
		setLoading(true)
		try {
			const filterQuery: any = {
				item_type: ['FG_MEAL_PRODUCT'],
				order_status: 'PENDING',
			}
			if (formData.from_date && formData.to_date) {
				filterQuery.from_date = formData.from_date
				filterQuery.to_date = formData.to_date
			}
			const response = await GetOrders({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm ? searchTerm : null,
				sort,
				sortOrder,
				...filterQuery,
			})

			const metaDataResp: any = response?.metadata
			setMetaData(metaDataResp?.pagination)
			let filteredData: any = response?.data || []

			// Merge the CART and multiple_items arrays based on item_id
			filteredData = filteredData?.map((cart: any) => ({
				...cart,
				merged_items: cart.CART?.map((cartItem: any) => {
					const matchingItem = (cart.multiple_items || []).find(
						(item: any) => item.item_id === cartItem?._id
					)
					return {
						...cartItem,
						amount: matchingItem?.amount || 0,
						quantity: matchingItem?.quantity || 1,
					}
				}),
			}))
			setAbandonedData(filteredData)
		} catch (error) {
			console.error('Error fetching abandoned data:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAbandonedData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, formData.from_date, formData.to_date])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
	}

	const filteredAbandonedData = useMemo(() => {
		return abandonedData.filter((cart: any) => {
			if (!searchTerm || !searchTerm.trim()) return true
			const term = searchTerm.toLowerCase().trim()
			const firstName = cart?.user_info?.first_name || ''
			const lastName = cart?.user_info?.last_name || ''
			const fullName = `${firstName} ${lastName}`.toLowerCase()
			const mobile = (cart?.user_info?.mobile || '').toString().toLowerCase()
			const receiptId = (cart?.receipt_id || '').toString().toLowerCase()
			const product = (cart?.product?.name || '').toLowerCase()
			const merged = (cart?.merged_items || []).map((m: any) => m.name).join(' ').toLowerCase()

			return (
				fullName.includes(term) ||
				mobile.includes(term) ||
				receiptId.includes(term) ||
				product.includes(term) ||
				merged.includes(term)
			)
		})
	}, [abandonedData, searchTerm])

	// Derived metrics
	const metrics = useMemo(() => {
		const total = metaData?.totalRecords || abandonedData.length
		const totalValue = abandonedData.reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
		const avgValue = total > 0 ? Math.round(totalValue / total) : 0
		return { total, totalValue, avgValue }
	}, [abandonedData, metaData])

	const downloadExcel = () => {
		const worksheetData = filteredAbandonedData.map((data: any, idx: number) => {
			const userName = data?.user_info
				? `${data.user_info.first_name || 'Deleted User'} ${data.user_info.last_name || ''}`.trim()
				: 'Deleted User'
			const mobile = data?.user_info?.mobile || 'N/A'
			const receiptId = data?.receipt_id || 'N/A'
			const itemsList = data?.product
				? data.product.name
				: data.merged_items?.map((item: any) => `${item.name} (x${item.quantity})`).join(', ') || 'N/A'
			const price = data?.amount || 0
			const date = data?.createdAt ? DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A') : 'N/A'

			return {
				'No.': idx + 1,
				'User Name': userName,
				Mobile: mobile,
				'Receipt ID': receiptId,
				Items: itemsList,
				Price: price,
				Date: date,
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Abandoned List')
		XLSX.writeFile(workbook, `Abandoned_Checkout_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	const getInitials = (first?: string, last?: string) => {
		const f = (first || '').trim().charAt(0).toUpperCase()
		const l = (last || '').trim().charAt(0).toUpperCase()
		return f || l ? `${f}${l}` : 'U'
	}

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Abandoned Checkout</PageTitle>

			{/* Breadcrumb */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Products & Orders</span>
				<span className='sep'>/</span>
				<span className='current'>Abandoned Checkout</span>
			</div>

			{/* Page Header */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Abandoned Checkout</h1>
					<p className='gz-prod-subtitle'>
						View customers who started checkout but did not complete their purchase.
					</p>
				</div>
			</div>

			{/* Summary KPI Cards */}
			<div className='gz-prod-summary-grid'>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-pink'>
						<FontAwesomeIcon icon={faUserTimes} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Abandoned Checkouts</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={metrics.total} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-amber'>
						<span style={{ fontWeight: 800, fontSize: '18px' }}>₹</span>
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Unrealized Revenue</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '60px', height: '24px' }} />
							) : (
								<>₹<NumberTicker value={metrics.totalValue} /></>
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-blue'>
						<FontAwesomeIcon icon={faReceipt} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Avg. Abandoned Value</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '60px', height: '24px' }} />
							) : (
								<>₹<NumberTicker value={metrics.avgValue} /></>
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-amber'>
						<FontAwesomeIcon icon={faClock} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Status</div>
						<div className='gz-prod-summary-value' style={{ fontSize: '16px', color: '#A46A13' }}>
							Pending Completion
						</div>
					</div>
				</div>
			</div>

			{/* Main Card with Toolbar & Table */}
			<div className='gz-prod-card'>
				{/* Toolbar: SearchFilter -> LengthMenu -> DateFilter -> Export */}
				<div className='gz-prod-toolbar'>
					<div className='gz-prod-toolbar-left'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search customer, phone, or receipt...'
							className='me-0'
						/>
						<LengthMenu
							expenseData={filteredAbandonedData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							className='me-0'
						/>
					</div>

					<div className='gz-prod-toolbar-right'>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
						/>
						<button
							type='button'
							className='gz-prod-btn-icon-export'
							onClick={downloadExcel}
							disabled={loading || filteredAbandonedData.length === 0}
							title='Export Records to Excel'>
							<FontAwesomeIcon icon={faDownload} />
						</button>
					</div>
				</div>

				{/* Table */}
				<div className='table-responsive' style={{ overflowX: 'auto' }}>
					<table className='gz-prod-table'>
						<thead>
							<tr>
								<th style={{ width: '60px' }}>No.</th>
								<th>Customer</th>
								<th>Receipt ID</th>
								<th>Item(s)</th>
								<th>Amount</th>
								<th>Abandoned On</th>
								<th>Status</th>
								<th style={{ textAlign: 'center', width: '80px' }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 6 }).map((_, idx) => (
									<tr key={`skeleton-${idx}`} className='gz-prod-skeleton-row'>
										<td><span className='gz-prod-skeleton' style={{ width: '24px', height: '16px' }} /></td>
										<td>
											<div className='gz-prod-user-cell'>
												<span className='gz-prod-skeleton' style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
												<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
													<span className='gz-prod-skeleton' style={{ width: '110px', height: '14px' }} />
													<span className='gz-prod-skeleton' style={{ width: '80px', height: '12px' }} />
												</div>
											</div>
										</td>
										<td><span className='gz-prod-skeleton' style={{ width: '100px', height: '22px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '140px', height: '14px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '60px', height: '14px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '120px', height: '14px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '70px', height: '20px', borderRadius: '999px' }} /></td>
										<td style={{ textAlign: 'center' }}><span className='gz-prod-skeleton' style={{ width: '34px', height: '34px', borderRadius: '8px' }} /></td>
									</tr>
								))
							) : filteredAbandonedData.length === 0 ? (
								<tr>
									<td colSpan={8} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap'>
											<div className='gz-prod-empty-icon'>
												<FontAwesomeIcon icon={faExclamationTriangle} />
											</div>
											<h4 className='gz-empty-state-title'>No abandoned checkouts</h4>
											<p className='gz-empty-state-desc'>
												{searchTerm || formData.from_date
													? 'No records match your filter criteria. Try clearing filters.'
													: 'No incomplete customer checkouts recorded for this timeframe.'}
											</p>
										</div>
									</td>
								</tr>
							) : (
								filteredAbandonedData.map((data: any, index: number) => {
									const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
									const user = data?.user_info
									const fullName = user
										? `${user?.first_name || 'Customer'} ${user?.last_name || ''}`.trim()
										: 'Customer'
									const profileImg = data?.profile_image
										? `https://files.fggroup.in/${data.profile_image}`
										: null

									return (
										<tr key={data?._id || index}>
											<td>
												<span style={{ fontWeight: 600, color: '#64748B' }}>{actualIndex}</span>
											</td>
											<td>
												<div className='gz-prod-user-cell'>
													{profileImg ? (
														<img
															src={profileImg}
															alt={fullName}
															className='gz-prod-avatar'
															onError={(e) => {
																;(e.target as HTMLElement).style.display = 'none'
															}}
														/>
													) : (
														<div className='gz-prod-avatar-fallback'>
															{getInitials(user?.first_name, user?.last_name)}
														</div>
													)}
													<div>
														<div style={{ fontWeight: 600, color: '#172B4D', fontSize: '14px' }}>
															{fullName}
														</div>
														<div style={{ fontSize: '12px', color: '#71809A', marginTop: '2px' }}>
															{user?.mobile || user?.email || 'No contact info'}
														</div>
													</div>
												</div>
											</td>
											<td>
												<span className='gz-prod-receipt-id'>
													{data.receipt_id || 'N/A'}
												</span>
											</td>
											<td>
												{data?.product ? (
													<span style={{ fontWeight: 500, color: '#1E293B', fontSize: '13.5px' }}>
														{data.product.name}
													</span>
												) : (
													<div className='gz-prod-items-summary'>
														{(data.merged_items || []).length === 0 ? (
															<span style={{ color: '#94A3B8', fontSize: '12.5px' }}>N/A</span>
														) : (
															data.merged_items.map((item: any, itemIdx: number) => (
																<div key={itemIdx} className='gz-prod-item-row'>
																	<span className='gz-prod-item-bullet' />
																	<span>{item.name} {item.quantity ? `(x${item.quantity})` : ''}</span>
																</div>
															))
														)}
													</div>
												)}
											</td>
											<td>
												<span style={{ fontWeight: 600, color: '#142447', fontSize: '14px' }}>
													₹{Number(data.amount || 0).toLocaleString('en-IN')}
												</span>
											</td>
											<td>
												<span style={{ fontSize: '13px', color: '#475569' }}>
													{DayJS(data.createdAt).format('DD MMM YYYY, hh:mm A')}
												</span>
											</td>
											<td>
												<span className='gz-prod-badge pending'>
													Abandoned
												</span>
											</td>
											<td style={{ textAlign: 'center' }}>
												<Link
													to={`/rag/all-order/view-order?order_id=${data?._id}`}
													className='gz-prod-action-btn view'
													title='View Checkout Details'>
													<FontAwesomeIcon icon={faEye} />
												</Link>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				{filteredAbandonedData.length > 0 && (
					<GomziTablePagination
						totalRecords={metaData?.totalRecords || filteredAbandonedData.length}
						page={pagination.page}
						itemsPerPage={pagination.itemsPerPage}
						totalPages={metaData?.totalPages || Math.ceil((metaData?.totalRecords || filteredAbandonedData.length) / pagination.itemsPerPage) || 1}
						onPageChange={handlePageChange}
						entityName='checkouts'
					/>
				)}
			</div>
		</div>
	)
}

export default AbandonedList
