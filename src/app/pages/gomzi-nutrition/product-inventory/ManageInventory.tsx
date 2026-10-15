import { faCheck, faDownload, faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetProductStocks, UpdateSingleProductStock } from '../../../Functions/FGGroup'

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

			// Fetch all stock data matching the current search and status filters
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

			// Auto-size columns
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
		<>
			<PageTitle breadcrumbs={[]}>Inventory Management</PageTitle>

			<KTCard>
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 w-100'>
						{/* 1. Search Filter */}
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								className='me-0'
							/>
						</div>

						{/* 2. Show Entries Per Page Dropdown */}
						<div>
							<LengthMenu
								expenseData={inventoryData}
								handleItemsPerPageChange={handleItemsPerPageChange}
								value={pagination.itemsPerPage}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button (beside show entries per page dropdown) */}
						<div>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center justify-content-center'
								onClick={downloadExcel}
								disabled={loading || inventoryData.length === 0}
								style={{
									width: '38px',
									height: '38px',
									padding: 0,
									borderRadius: '8px',
									fontSize: '14px',
								}}
								title='Download Excel'>
								<FontAwesomeIcon icon={faDownload} />
							</button>
						</div>

						{/* 4. Select Stock Status Filter (beside download excel button) */}
						<div style={{ width: '180px', minWidth: '160px' }}>
							<SelectField
								name='Select status'
								showLabel={false}
								marginRemove
								value={selectedStockStatus}
								onChange={(e) => handleStockStatusChange(e.target.value)}
								options={[
									{ label: 'Select Stock Status', value: '' },
									{ label: 'In Stock', value: 'IN_STOCK' },
									{ label: 'Low Stock', value: 'LOW_STOCK' },
									{ label: 'Out of Stock', value: 'OUT_OF_STOCK' },
								]}
								searchable={false}
								hideDefaultOption
							/>
						</div>
					</div>
				</div>

				<div className='card-body py-4'>
					<div className='table-responsive'>
						<Table
							data={inventoryData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={item._id}>
									<tr key={index}>
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

										<td>{item.product_name}</td>

										<td>{item.flavour || '-'}</td>

										<td>{item.stock}</td>
										<td>{item.price}</td>

										<td>
											<span
												className={`badge ${
													item.status === 'OUT_OF_STOCK' || item.stock === 0
														? 'badge-light-danger'
														: item.status === 'LOW_STOCK' || item.stock <= 10
														? 'badge-light-warning'
														: 'badge-light-success'
												}`}>
												{item.status}
											</span>
										</td>

										<td>
											<TableButton
												action='view'
												to={`/rag/inventory-history?product_id=${item.product_id}${
													item.variant_id ? `&variant_id=${item.variant_id}` : ''
												}`}
											/>
											<TableButton
												action='edit'
												onClick={() => handleUpdateModal(item)}
											/>
										</td>
									</tr>
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{inventoryData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{inventoryData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<Modal
				centered
				show={showUpdateModal}
				onHide={closeUpdateModal}
				contentClassName='border-0 shadow-lg'
				style={{ borderRadius: '12px' }}>
				{/* Modal Header with Close Button */}
				<div className='modal-header border-bottom py-4 px-6 d-flex align-items-center justify-content-between'>
					<h3 className='modal-title fw-bolder text-gray-900 fs-4 m-0'>Update Stock</h3>
					<button
						type='button'
						className='btn btn-sm btn-icon btn-active-light-primary rounded-circle'
						onClick={closeUpdateModal}
						aria-label='Close'
						style={{ width: '32px', height: '32px' }}>
						<FontAwesomeIcon icon={faXmark} className='fs-4 text-gray-500' />
					</button>
				</div>

				{/* Modal Body */}
				<div className='modal-body px-6 py-5'>
					{/* Product and Variant (Read-Only) */}
					<div className='row g-3 mb-4'>
						<div className='col-12 col-md-6'>
							<label className='form-label fw-bold text-gray-700 fs-7 mb-1'>Product</label>
							<input
								type='text'
								className='form-control form-control-solid fw-semibold fs-7 text-gray-700'
								value={updateData.product_name}
								readOnly
								style={{
									backgroundColor: '#F8FAFC',
									border: '1px solid #E2E8F0',
									borderRadius: '8px',
									height: '40px',
								}}
							/>
						</div>

						<div className='col-12 col-md-6'>
							<label className='form-label fw-bold text-gray-700 fs-7 mb-1'>Variant</label>
							<input
								type='text'
								className='form-control form-control-solid fw-semibold fs-7 text-gray-700'
								value={updateData.variant_name || 'Base Product'}
								readOnly
								style={{
									backgroundColor: '#F8FAFC',
									border: '1px solid #E2E8F0',
									borderRadius: '8px',
									height: '40px',
								}}
							/>
						</div>
					</div>

					{/* Stock Quantity */}
					<div className='mb-4'>
						<label className='form-label required fw-bold text-gray-800 fs-7 mb-1'>Stock Quantity</label>
						<input
							type='number'
							name='stock'
							min='0'
							className='form-control'
							placeholder='Enter stock quantity'
							value={updateData.stock}
							onChange={(e) =>
								setUpdateData({
									...updateData,
									stock: e.target.value,
								})
							}
							style={{
								border: '1px solid #DFE7F0',
								borderRadius: '8px',
								height: '40px',
								fontSize: '14px',
								fontWeight: 600,
							}}
						/>
					</div>

					{/* Availability Selection Cards */}
					<div>
						<label className='form-label fw-bold text-gray-800 fs-7 mb-2 d-block'>Availability</label>
						<div className='d-flex align-items-center gap-3'>
							<label
								className={`d-flex align-items-center gap-2 px-4 py-2 rounded-3 cursor-pointer ${
									updateData.isAvailable === true
										? 'border border-primary bg-light-primary text-primary fw-bold'
										: 'border border-gray-300 text-gray-700 bg-white'
								}`}
								style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}>
								<input
									type='radio'
									name='modal_isAvailable'
									className='form-check-input m-0'
									checked={updateData.isAvailable === true}
									onChange={() =>
										setUpdateData({
											...updateData,
											isAvailable: true,
										})
									}
								/>
								<span className='fs-7'>Available</span>
							</label>

							<label
								className={`d-flex align-items-center gap-2 px-4 py-2 rounded-3 cursor-pointer ${
									updateData.isAvailable === false
										? 'border border-danger bg-light-danger text-danger fw-bold'
										: 'border border-gray-300 text-gray-700 bg-white'
								}`}
								style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}>
								<input
									type='radio'
									name='modal_isAvailable'
									className='form-check-input m-0'
									checked={updateData.isAvailable === false}
									onChange={() =>
										setUpdateData({
											...updateData,
											isAvailable: false,
										})
									}
								/>
								<span className='fs-7'>Out Of Stock</span>
							</label>
						</div>
					</div>
				</div>

				{/* Modal Footer */}
				<div className='modal-footer border-top py-3 px-6 d-flex justify-content-end gap-2'>
					<button
						type='button'
						className='btn btn-light btn-active-light-primary fw-semibold px-4'
						style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
						onClick={closeUpdateModal}>
						Cancel
					</button>

					<button
						type='button'
						className='btn btn-primary fw-bold px-5 d-flex align-items-center gap-2'
						style={{
							height: '38px',
							borderRadius: '8px',
							fontSize: '13px',
							backgroundColor: '#0F172A',
							borderColor: '#0F172A',
						}}
						onClick={handleUpdateStock}>
						<FontAwesomeIcon icon={faCheck} />
						Update Stock
					</button>
				</div>
			</Modal>
		</>
	)
}

export default ManageInventory
