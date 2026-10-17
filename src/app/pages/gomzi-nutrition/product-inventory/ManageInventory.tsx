import { faBoxesStacked, faCheck, faDownload, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetProductStocks, UpdateSingleProductStock } from '../../../Functions/FGGroup'
import './inventory-theme.css'

const ManageInventory = () => {
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [inventoryData, setInventoryData] = useState<any[]>([])
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [sort, setSort] = useState('createdAt')
	const [selectedStockStatus, setSelectedStockStatus] = useState<string>('')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [updateData, setUpdateData] = useState<any>({
		product_id: '',
		variant_id: '',
		product_name: '',
		variant_name: '',
		stock: 0,
		isAvailable: true,
	})

	const fetchInventory = async () => {
		try {
			setLoading(true)

			const response: any = await GetProductStocks({
				search: searchTerm,
				status: selectedStockStatus,
				page: pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
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

	const handleUpdateModal = (data: any) => {
		setUpdateData({
			product_id: data.product_id,
			variant_id: data.variant_id,
			product_name: data.product_name,
			variant_name: data.variant_name,
			stock: data.stock,
			isAvailable: data.isAvailable,
		})

		setShowUpdateModal(true)
	}

	const closeUpdateModal = () => {
		setShowUpdateModal(false)
		if (typeof document !== 'undefined') {
			;(document.activeElement as HTMLElement)?.blur()
		}
	}

	const handleUpdateStock = async () => {
		try {
			await UpdateSingleProductStock({
				product_id: updateData.product_id,
				variant_id: updateData.variant_id,
				stock: Number(updateData.stock),
				isAvailable: updateData.isAvailable,
			})

			toast.success('Stock Updated Successfully')

			closeUpdateModal()

			fetchInventory()
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const sortableFields = [
		{ title: 'Product Name', field: 'product_name' },
		{ title: 'Flavour', field: 'flavour' },
		{ title: 'Stock', field: 'stock' },
		{ title: 'Price', field: 'price' },
		{ title: 'Status', field: 'status' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
		setPagination((prev) => ({ ...prev, page: 1 }))
		sessionStorage.setItem('currentPage', '1')
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
		sessionStorage.setItem('currentPage', page.toString())
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
		sessionStorage.setItem('currentPage', '1')
	}

	const handleStockStatusChange = (status: string) => {
		setSelectedStockStatus(status)
		setPagination((prev) => ({ ...prev, page: 1 }))
		sessionStorage.setItem('currentPage', '1')
	}

	useEffect(() => {
		const storedPage = sessionStorage.getItem('currentPage')
		if (storedPage) {
			setPagination((prev) => ({ ...prev, page: parseInt(storedPage, 10) }))
		}
	}, [])

	useEffect(() => {
		fetchInventory()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, selectedStockStatus])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		setPagination((prev) => ({ ...prev, page: 1 }))
		sessionStorage.setItem('currentPage', '1')
	}, [searchTerm])

	const downloadExcel = async () => {
		try {
			setLoading(true)

			const response: any = await GetProductStocks({
				search: searchTerm,
				status: selectedStockStatus,
				page: 1,
				limit: 100000,
				sort,
				sortOrder,
			})

			const exportData = response?.data && response.data.length > 0 ? response.data : inventoryData

			if (!exportData || exportData.length === 0) {
				toast.error('No inventory data to export')
				return
			}

			const worksheetData = exportData.map((item: any, idx: number) => ({
				'No.': idx + 1,
				'Product Name': item.product_name || 'N/A',
				'Variant / Flavour': item.flavour || item.variant_name || '-',
				Stock: item.stock ?? 0,
				Price: item.price ?? 0,
				Status:
					item.status ||
					(item.stock === 0 ? 'OUT_OF_STOCK' : item.stock <= 10 ? 'LOW_STOCK' : 'IN_STOCK'),
			}))

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)

			const columnWidths = Object.keys(worksheetData[0]).map((key) => {
				const maxLength = Math.max(
					key.length,
					...worksheetData.map((row: any) => String(row[key] ?? '').length)
				)
				return { wch: Math.min(maxLength + 3, 40) }
			})
			worksheet['!cols'] = columnWidths

			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Stock')
			XLSX.writeFile(workbook, `Inventory_Stock_${DayJS().format('YYYY-MM-DD')}.xlsx`)
			toast.success(`${exportData.length} inventory records exported successfully`)
		} catch (error: any) {
			console.error('Export error:', error)
			toast.error('Failed to export inventory data')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='gz-inv-container'>
			<PageTitle breadcrumbs={[]}>Manage Inventory</PageTitle>

			{/* Breadcrumbs */}
			<div className='gz-inv-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Inventory & Stock</span>
				<span className='sep'>/</span>
				<span className='current'>Manage Inventory</span>
			</div>

			{/* Header */}
			<div className='gz-inv-header'>
				<div className='gz-inv-title-wrap'>
					<h1 className='gz-inv-title'>Manage Inventory</h1>
					<p className='gz-inv-subtitle'>Monitor product availability and manage stock levels.</p>
				</div>
			</div>

			{/* Main Content Card */}
			<div className='gz-inv-card'>
				{/* Toolbar */}
				<div className='gz-inv-toolbar'>
					<div className='gz-inv-toolbar-left'>
						{/* 1. Search Filter */}
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search products or flavours...'
							className='me-0'
						/>

						{/* 2. Show Entries Per Page Dropdown */}
						<LengthMenu
							expenseData={inventoryData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>

						{/* 3. Stock Status Dropdown Filter */}
						<select
							className='gz-prod-select'
							value={selectedStockStatus}
							onChange={(e) => handleStockStatusChange(e.target.value)}
							title='Select Stock Status'>
							<option value=''>All Stock Statuses</option>
							<option value='IN_STOCK'>In Stock</option>
							<option value='LOW_STOCK'>Low Stock</option>
							<option value='OUT_OF_STOCK'>Out of Stock</option>
						</select>
					</div>

					<div className='gz-inv-toolbar-right'>
						{/* Download Excel Button */}
						<button
							type='button'
							className='gz-inv-export-btn'
							onClick={downloadExcel}
							disabled={loading || inventoryData.length === 0}
							title='Export to Excel'>
							<FontAwesomeIcon icon={faDownload} />
						</button>
					</div>
				</div>

				{/* Table Container */}
				<div className='gz-inv-table-wrap'>
					<Table
						data={inventoryData}
						columns={sortableFields}
						sort={sort}
						sortOrder={sortOrder}
						onSortChange={handleSortChange}
						renderRow={(item: any, index: number, actualIndex: number) => {
							const isOutOfStock = item.status === 'OUT_OF_STOCK' || item.stock === 0
							const isLowStock = !isOutOfStock && (item.status === 'LOW_STOCK' || item.stock <= 10)
							const statusLabel = isOutOfStock
								? 'OUT OF STOCK'
								: isLowStock
								? 'LOW STOCK'
								: 'IN STOCK'
							const statusClass = isOutOfStock
								? 'out-of-stock'
								: isLowStock
								? 'low-stock'
								: 'in-stock'

							return (
								<React.Fragment key={item._id || index}>
									<tr>
										<td className='text-center' style={{ width: '60px' }}>
											<span className='fw-bold' style={{ color: '#64748B', fontSize: '13px' }}>
												{actualIndex}
											</span>
										</td>

										<td>
											<span className='gz-inv-product-name'>{item.product_name || '—'}</span>
										</td>

										<td>
											<span className='gz-inv-variant-text'>{item.flavour || item.variant_name || '—'}</span>
										</td>

										<td>
											<span className='gz-inv-stock-value'>{item.stock ?? 0}</span>
										</td>

										<td>
											<span className='gz-inv-price-value'>
												₹{Number(item.price || 0).toLocaleString('en-IN')}
											</span>
										</td>

										<td>
											<span className={`gz-inv-status-pill ${statusClass}`}>{statusLabel}</span>
										</td>

										<td>
											<div className='gz-inv-actions'>
												<TableButton
													action='view'
													className='table-action-btn-square'
													to={`/rag/inventory-history?product_id=${item.product_id}${
														item.variant_id ? `&variant_id=${item.variant_id}` : ''
													}`}
													title='View Inventory History'
												/>
												<TableButton
													action='edit'
													className='table-action-btn-square'
													onClick={() => handleUpdateModal(item)}
													title='Update Stock'
												/>
											</div>
										</td>
									</tr>
								</React.Fragment>
							)
						}}
						visibleDetails={visibleDetails}
						pagination={pagination}
						setPagination={setPagination}
						loading={loading}
					/>
				</div>

				{/* Empty State */}
				{inventoryData.length === 0 && !loading && (
					<div className='gz-inv-empty-state'>
						<div className='gz-inv-empty-icon'>
							<FontAwesomeIcon icon={faBoxesStacked} />
						</div>
						<h3 className='gz-inv-empty-title'>No inventory records found</h3>
						<p className='gz-inv-empty-desc'>
							{searchTerm || selectedStockStatus
								? 'Try adjusting your search query or stock status filter to find products.'
								: 'Product inventory records will appear here once products are created.'}
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

			{/* Update Stock Modal */}
			<Modal
				centered
				show={showUpdateModal}
				onHide={closeUpdateModal}
				dialogClassName='gz-inv-modal'
				contentClassName='border-0 shadow-lg'
				style={{ borderRadius: '16px' }}>
				<div className='gz-inv-modal-header'>
					<h3 className='gz-inv-modal-title'>Update Stock</h3>
					<button
						type='button'
						className='gz-inv-modal-close'
						onClick={closeUpdateModal}
						aria-label='Close'>
						<FontAwesomeIcon icon={faXmark} />
					</button>
				</div>

				<div className='gz-inv-modal-body'>
					<div className='row g-3 mb-4'>
						<div className='col-12 col-md-6'>
							<label className='gz-inv-form-label'>Product</label>
							<input
								type='text'
								className='gz-inv-form-control'
								value={updateData.product_name}
								readOnly
							/>
						</div>

						<div className='col-12 col-md-6'>
							<label className='gz-inv-form-label'>Variant</label>
							<input
								type='text'
								className='gz-inv-form-control'
								value={updateData.variant_name || 'Base Product'}
								readOnly
							/>
						</div>
					</div>

					<div className='mb-4'>
						<label className='gz-inv-form-label required'>Stock Quantity</label>
						<input
							type='number'
							name='stock'
							min='0'
							className='gz-inv-form-control'
							placeholder='Enter stock quantity'
							value={updateData.stock}
							onChange={(e) =>
								setUpdateData({
									...updateData,
									stock: e.target.value,
								})
							}
						/>
					</div>

					<div>
						<label className='gz-inv-form-label mb-2'>Availability</label>
						<div className='gz-inv-segmented-group'>
							<label
								className={`gz-inv-segmented-option ${
									updateData.isAvailable === true ? 'active-available' : ''
								}`}>
								<input
									type='radio'
									name='modal_isAvailable'
									checked={updateData.isAvailable === true}
									onChange={() =>
										setUpdateData({
											...updateData,
											isAvailable: true,
										})
									}
								/>
								<FontAwesomeIcon icon={faCheck} style={{ fontSize: '12px' }} />
								<span>Available</span>
							</label>

							<label
								className={`gz-inv-segmented-option ${
									updateData.isAvailable === false ? 'active-out' : ''
								}`}>
								<input
									type='radio'
									name='modal_isAvailable'
									checked={updateData.isAvailable === false}
									onChange={() =>
										setUpdateData({
											...updateData,
											isAvailable: false,
										})
									}
								/>
								<FontAwesomeIcon icon={faXmark} style={{ fontSize: '12px' }} />
								<span>Out Of Stock</span>
							</label>
						</div>
					</div>
				</div>

				<div className='gz-inv-modal-footer'>
					<button
						type='button'
						className='gz-inv-btn-cancel'
						onClick={closeUpdateModal}>
						Cancel
					</button>

					<button
						type='button'
						className='gz-inv-btn-submit'
						onClick={handleUpdateStock}>
						<FontAwesomeIcon icon={faCheck} />
						<span>Update Stock</span>
					</button>
				</div>
			</Modal>
		</div>
	)
}

export default ManageInventory
