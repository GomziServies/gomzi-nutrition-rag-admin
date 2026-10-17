import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetInventoryHistory } from '../../../Functions/FGGroup'
import './inventory-theme.css'

const InventoryLogList = () => {
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [inventoryData, setInventoryData] = useState<any[]>([])
	const [searchParams] = useSearchParams()
	const product_id = searchParams.get('product_id') || undefined
	const variant_id = searchParams.get('variant_id') || undefined
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [selectedSource, setSelectedSource] = useState<string>('')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchInventoryLogs = async () => {
		try {
			setLoading(true)

			const response: any = await GetInventoryHistory({
				product_id,
				variant_id,
				...(selectedSource && { source: selectedSource }),
				page: pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm,
			})

			setInventoryData(response.data || [])

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			setLoading(false)
		}
	}

	const sortableFields = [
		{ title: 'Date', field: 'date' },
		{ title: 'Type', field: 'type' },
		{ title: 'Source', field: 'source' },
		{ title: 'Quantity', field: 'quantity' },
		{ title: 'Previous Stock', field: 'previous_stock' },
		{ title: 'Current Stock', field: 'current_stock' },
		{ title: 'Remarks', field: 'remarks' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
		sessionStorage.setItem('currentPage', page.toString())
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
		sessionStorage.setItem('currentPage', '1')
	}

	useEffect(() => {
		const storedPage = sessionStorage.getItem('currentPage')
		if (storedPage) {
			setPagination((prev) => ({ ...prev, page: parseInt(storedPage, 10) }))
		}
	}, [])

	useEffect(() => {
		fetchInventoryLogs()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, selectedSource])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchInventoryLogs()
		}
	}, [searchTerm])

	const renderStockMovement = (item: any) => {
		const qty = Math.abs(Number(item.quantity) || 0)
		const isStockIn =
			item.transaction_type === 'IN' ||
			(typeof item.current_stock === 'number' &&
				typeof item.previous_stock === 'number' &&
				item.current_stock > item.previous_stock)

		const isStockOut =
			item.transaction_type === 'OUT' ||
			(typeof item.current_stock === 'number' &&
				typeof item.previous_stock === 'number' &&
				item.current_stock < item.previous_stock)

		let sign = ''
		let badgeClass = 'neutral'

		if (isStockIn && !isStockOut) {
			sign = '+'
			badgeClass = 'positive'
		} else if (isStockOut) {
			sign = '−'
			badgeClass = 'negative'
		}

		return (
			<span className='gz-stock-movement-reveal'>
				<span className={`gz-movement-badge ${badgeClass}`}>
					{sign}
					{qty}
				</span>
			</span>
		)
	}

	return (
		<div className='gz-inv-container'>
			<PageTitle breadcrumbs={[]}>Inventory History</PageTitle>

			{/* Breadcrumbs */}
			<div className='gz-inv-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Inventory & Stock</span>
				<span className='sep'>/</span>
				<span className='current'>Inventory History</span>
			</div>

			{/* Header */}
			<div className='gz-inv-header'>
				<div className='gz-inv-title-wrap'>
					<h1 className='gz-inv-title'>Inventory History</h1>
					<p className='gz-inv-subtitle'>Track every recorded stock movement.</p>
				</div>
			</div>

			{/* Main Content Card */}
			<div className='gz-inv-card'>
				{/* Toolbar */}
				<div className='gz-inv-toolbar'>
					<div className='gz-inv-toolbar-left'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search history by remarks or source...'
							className='me-0'
						/>

						{/* LengthMenu directly rendered without double background */}
						<LengthMenu
							expenseData={inventoryData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>

						{/* Native Select Source Dropdown */}
						<select
							className='gz-prod-select'
							value={selectedSource}
							onChange={(e: any) => setSelectedSource(e.target.value)}
							title='Select Source'>
							<option value=''>All Sources</option>
							<option value='MANUAL'>MANUAL</option>
							<option value='ORDER'>ORDER</option>
							<option value='INVOICE'>INVOICE</option>
							<option value='RESET'>RESET</option>
							<option value='RETURN'>RETURN</option>
							<option value='PURCHASE'>PURCHASE</option>
						</select>
					</div>
				</div>

				{/* Table Area */}
				<div className='gz-inv-table-wrap'>
					<Table
						data={inventoryData}
						columns={sortableFields}
						sort={sort}
						sortOrder={sortOrder}
						removeAction
						onSortChange={handleSortChange}
						renderRow={(item: any, index: number, actualIndex: number) => {
							const isTypeIn = item.transaction_type === 'IN'

							return (
								<React.Fragment key={item._id || index}>
									<tr>
										<td className='text-center' style={{ width: '60px' }}>
											<span className='fw-bold' style={{ color: '#64748B', fontSize: '13px' }}>
												{actualIndex}
											</span>
										</td>

										<td>
											<span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>
												{moment(item.createdAt).format('DD MMM YYYY, hh:mm A')}
											</span>
										</td>

										<td>
											<span className={`gz-trans-badge ${isTypeIn ? 'in' : 'out'}`}>
												{item.transaction_type || '—'}
											</span>
										</td>

										<td>
											<span className='gz-source-badge'>{item.source || '—'}</span>
										</td>

										<td>{renderStockMovement(item)}</td>

										<td>
											<span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#475569' }}>
												{item.previous_stock ?? '—'}
											</span>
										</td>

										<td>
											<span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#172B4D' }}>
												{item.current_stock ?? '—'}
											</span>
										</td>

										<td>
											<div className='gz-remarks-cell' title={item.remarks || ''}>
												{item.remarks || '—'}
											</div>
										</td>
									</tr>
								</React.Fragment>
							)
						}}
						pagination={pagination}
						setPagination={setPagination}
						loading={loading}
					/>
				</div>

				{/* Empty State */}
				{inventoryData.length === 0 && !loading && (
					<div className='gz-inv-empty-state'>
						<div className='gz-inv-empty-icon'>
							<FontAwesomeIcon icon={faClockRotateLeft} />
						</div>
						<h3 className='gz-inv-empty-title'>No stock movement records</h3>
						<p className='gz-inv-empty-desc'>
							{searchTerm || selectedSource
								? 'No logs matched your current filters. Try resetting search or source.'
								: 'Stock history logs will be recorded as inventory levels change.'}
						</p>
					</div>
				)}

				{/* Pagination */}
				{inventoryData.length > 0 && (
					<UsersListPagination
						totalPages={metaData?.totalPages}
						currentPage={pagination.page}
						onPageChange={handlePageChange}
					/>
				)}
			</div>
		</div>
	)
}

export default InventoryLogList
