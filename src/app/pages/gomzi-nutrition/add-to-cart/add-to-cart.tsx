import {
	faDownload,
	faImage,
	faShoppingCart,
	faTag,
	faUserFriends,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import NumberTicker from '../../../components/NumberTicker'
import SearchFilter from '../../../components/SearchFilter'
import GomziTablePagination from '../../../components/GomziTablePagination'
import { GetOrderCart } from '../../../Functions/FGGroup'
import '../products-theme.css'

const AddToCart: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [cartDataWithUser, setCartDataWithUser] = useState<any[]>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)
	const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)

	const fetchCartData = async () => {
		setLoading(true)
		try {
			const [fgResponse, pureGoResponse] = await Promise.all([
				GetOrderCart({ item_type: 'FG_MEAL_PRODUCT' }),
				GetOrderCart({ item_type: 'PURE_GO_MEAL_PRODUCT' }),
			])

			const filteredData: any[] = [...(fgResponse?.data || []), ...(pureGoResponse?.data || [])]

			filteredData.sort((a, b) => {
				const dateA = new Date(a.createdAt)
				const dateB = new Date(b.createdAt)
				return dateB.getTime() - dateA.getTime()
			})

			const allItems = filteredData.flatMap((item: any) =>
				(item.items || []).map((cartItem: any) => {
					const itemDetail = (item.items_details || []).find(
						(detail: any) => detail._id === cartItem.item_id
					)
					return {
						...cartItem,
						display_image: itemDetail?.displayImages?.[0] || itemDetail?.display_image?.[0] || '',
						name: itemDetail?.name || itemDetail?.item_name || 'Unknown Item',
						price: itemDetail?.price || itemDetail?.discount_price || cartItem?.price || 0,
						user_id: item.user_id,
						user: item.user,
						createdAt: item.createdAt || cartItem.createdAt,
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

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
	}

	const filteredCartData = useMemo(() => {
		return cartDataWithUser.filter((item) => {
			if (dateRange && dateRange[0] && dateRange[1]) {
				const itemDate = new Date(item.createdAt).getTime()
				const startDate = new Date(dateRange[0]).setHours(0, 0, 0, 0)
				const endDate = new Date(dateRange[1]).setHours(23, 59, 59, 999)
				if (isNaN(itemDate) || itemDate < startDate || itemDate > endDate) {
					return false
				}
			}

			if (!searchTerm || !searchTerm.trim()) return true
			const term = searchTerm.toLowerCase().trim()
			const itemName = (item?.name || '').toLowerCase()
			const userName = `${item?.user?.first_name || ''} ${item?.user?.last_name || ''}`.toLowerCase()
			const mobile = (item?.user?.mobile || '').toString().toLowerCase()
			const email = (item?.user?.email || '').toLowerCase()

			return itemName.includes(term) || userName.includes(term) || mobile.includes(term) || email.includes(term)
		})
	}, [cartDataWithUser, dateRange, searchTerm])

	const paginatedCartData = useMemo(() => {
		return filteredCartData.slice(
			(pagination.page - 1) * pagination.itemsPerPage,
			pagination.page * pagination.itemsPerPage
		)
	}, [filteredCartData, pagination])

	// Derived metrics
	const metrics = useMemo(() => {
		const totalItems = filteredCartData.length
		const uniqueUsers = new Set(
			filteredCartData.map((it) => it.user_id || it.user?._id).filter(Boolean)
		).size
		const totalQuantity = filteredCartData.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)
		const totalValue = filteredCartData.reduce(
			(acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1),
			0
		)
		return { totalItems, uniqueUsers, totalQuantity, totalValue }
	}, [filteredCartData])

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
				'Total Value': (data?.price || 0) * (data?.quantity || 1),
				Date: data?.createdAt ? DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A') : 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'User Cart')
		XLSX.writeFile(workbook, `User_Cart_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	const getInitials = (first?: string, last?: string) => {
		const f = (first || '').trim().charAt(0).toUpperCase()
		const l = (last || '').trim().charAt(0).toUpperCase()
		return f || l ? `${f}${l}` : 'C'
	}

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>User Cart</PageTitle>

			{/* Breadcrumbs */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Products & Orders</span>
				<span className='sep'>/</span>
				<span className='current'>User Cart</span>
			</div>

			{/* Header */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>User Cart</h1>
					<p className='gz-prod-subtitle'>View customer carts and active cart items.</p>
				</div>
			</div>

			{/* Summary KPI Cards */}
			<div className='gz-prod-summary-grid'>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-blue'>
						<FontAwesomeIcon icon={faShoppingCart} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Cart Records</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={metrics.totalItems} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-green'>
						<FontAwesomeIcon icon={faUserFriends} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Active Shoppers</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={metrics.uniqueUsers} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-amber'>
						<FontAwesomeIcon icon={faTag} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Total Items Qty</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={metrics.totalQuantity} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-blue'>
						<span style={{ fontWeight: 800, fontSize: '18px' }}>₹</span>
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Est. Cart Value</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '60px', height: '24px' }} />
							) : (
								<>₹<NumberTicker value={metrics.totalValue} /></>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Main Card with Toolbar & Table */}
			<div className='gz-prod-card'>
				{/* Toolbar: SearchFilter -> LengthMenu -> DownloadExcel -> DateFilter */}
				<div className='gz-prod-toolbar'>
					<div className='gz-prod-toolbar-left'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search by customer or item name...'
							className='me-0'
						/>
						<LengthMenu
							expenseData={filteredCartData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							className='me-0'
						/>
						<div>
							<DownloadExcelButton
								onClick={downloadExcel}
								disabled={loading || filteredCartData.length === 0}
								title='Export Records to Excel'
							/>
						</div>
						<div>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>

				{/* Cart Table */}
				<div className='table-responsive' style={{ overflowX: 'auto' }}>
					<table className='gz-prod-table'>
						<thead>
							<tr>
								<th style={{ width: '60px' }}>No.</th>
								<th>Customer</th>
								<th>Product Item</th>
								<th style={{ textAlign: 'center' }}>Quantity</th>
								<th>Price (Per Item)</th>
								<th>Item Total</th>
								<th>Added Date</th>
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
													<span className='gz-prod-skeleton' style={{ width: '70px', height: '12px' }} />
												</div>
											</div>
										</td>
										<td>
											<div className='gz-prod-identity-cell'>
												<span className='gz-prod-skeleton' style={{ width: '44px', height: '44px', borderRadius: '10px' }} />
												<span className='gz-prod-skeleton' style={{ width: '130px', height: '14px' }} />
											</div>
										</td>
										<td style={{ textAlign: 'center' }}><span className='gz-prod-skeleton' style={{ width: '32px', height: '20px', borderRadius: '6px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '60px', height: '14px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '60px', height: '14px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '120px', height: '14px' }} /></td>
									</tr>
								))
							) : paginatedCartData.length === 0 ? (
								<tr>
									<td colSpan={7} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap'>
											<div className='gz-prod-empty-icon'>
												<FontAwesomeIcon icon={faShoppingCart} />
											</div>
											<h4 className='gz-empty-state-title'>No cart records found</h4>
											<p className='gz-empty-state-desc'>
												{searchTerm || dateRange
													? 'No cart records match your filter criteria. Try clearing search or date filter.'
													: 'There are currently no items in any customer cart.'}
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedCartData.map((data: any, index: number) => {
									const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
									const user = data?.user
									const fullName = user
										? `${user?.first_name || 'Customer'} ${user?.last_name || ''}`.trim()
										: 'Customer'
									const hasImg = !!data?.display_image
									const itemPrice = Number(data?.price) || 0
									const itemQty = Number(data?.quantity) || 1
									const totalAmount = itemPrice * itemQty

									return (
										<tr key={`cart-${actualIndex}-${data?._id || index}`}>
											<td>
												<span style={{ fontWeight: 600, color: '#64748B' }}>{actualIndex}</span>
											</td>
											<td>
												<div className='gz-prod-user-cell'>
													<div className='gz-prod-avatar-fallback'>
														{getInitials(user?.first_name, user?.last_name)}
													</div>
													<div>
														<div style={{ fontWeight: 600, color: '#172B4D', fontSize: '14px' }}>
															{fullName}
														</div>
														<div style={{ fontSize: '12px', color: '#71809A', marginTop: '2px' }}>
															{user?.mobile ? `${user?.country_code || '+91'} ${user?.mobile}` : user?.email || 'N/A'}
														</div>
													</div>
												</div>
											</td>
											<td>
												<div className='gz-prod-identity-cell'>
													{hasImg ? (
														<img
															src={`https://files.fggroup.in/${data.display_image}`}
															alt={data.name}
															className='gz-prod-thumb'
															onError={(e) => {
																;(e.target as HTMLElement).style.display = 'none'
															}}
														/>
													) : (
														<div className='gz-prod-thumb-placeholder'>
															<FontAwesomeIcon icon={faImage} />
														</div>
													)}
													<div className='gz-prod-identity-info'>
														<span className='gz-prod-name'>{data.name || 'Product Item'}</span>
													</div>
												</div>
											</td>
											<td style={{ textAlign: 'center' }}>
												<span
													style={{
														display: 'inline-flex',
														alignItems: 'center',
														justifyContent: 'center',
														minWidth: '28px',
														height: '24px',
														padding: '0 8px',
														borderRadius: '6px',
														background: '#F1F5F9',
														color: '#1E293B',
														fontWeight: 700,
														fontSize: '13px',
													}}>
													{itemQty}
												</span>
											</td>
											<td>
												<span style={{ fontWeight: 500, color: '#475569', fontSize: '13.5px' }}>
													₹{itemPrice.toLocaleString('en-IN')}
												</span>
											</td>
											<td>
												<span style={{ fontWeight: 600, color: '#142447', fontSize: '14px' }}>
													₹{totalAmount.toLocaleString('en-IN')}
												</span>
											</td>
											<td>
												<span style={{ fontSize: '13px', color: '#64748B' }}>
													{data?.createdAt ? DayJS(data.createdAt).format('DD MMM YYYY, hh:mm A') : 'N/A'}
												</span>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{filteredCartData.length > 0 && (
					<GomziTablePagination
						totalRecords={filteredCartData.length}
						page={pagination.page}
						itemsPerPage={pagination.itemsPerPage}
						totalPages={Math.ceil(filteredCartData.length / pagination.itemsPerPage) || 1}
						onPageChange={handlePageChange}
						entityName='cart items'
					/>
				)}
			</div>
		</div>
	)
}

export default AddToCart
