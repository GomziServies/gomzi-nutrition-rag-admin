import {
	faBoxesStacked,
	faCheck,
	faTrashCan,
	faTriangleExclamation,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { PlusIcon } from '../../../components/animated-icons'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SelectField from '../../../components/SelectField'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	CreateProductStock,
	GetProduct,
	GetProductStock,
	RemoveProductStock,
	UpdateProductStock,
} from '../../../Functions/FGGroup'
import '../product-inventory/inventory-theme.css'

const GomziNutritionProductStock: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState<any>('')
	const [productData, setProductData] = useState([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [product, setProduct] = useState([])
	const [updateShowModal, setUpdateShowModal] = useState(false)
	const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
	const [deleteModal, setDeleteModal] = useState<{
		show: boolean
		stockId: string | null
		productName?: string
		loading?: boolean
	}>({
		show: false,
		stockId: null,
		productName: '',
		loading: false,
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [formData, setFormData] = useState({
		stock_id: '',
		stock: '',
		item_id: '',
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetProductStock({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm ? searchTerm : null,
				sort,
				sortOrder,
			})

			setProductData(response.data)

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
		sessionStorage.setItem('currentPage', '1')
	}

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
		sessionStorage.setItem('currentPage', page.toString())
	}

	useEffect(() => {
		const storedPage = sessionStorage.getItem('currentPage')
		if (storedPage) {
			setPagination((prev) => ({ ...prev, page: parseInt(storedPage, 10) }))
		}
	}, [])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
		setPagination((prev) => ({ ...prev, page: 1 }))
		sessionStorage.setItem('currentPage', '1')
	}

	const sortableFields = [
		{ title: 'Product Name', field: 'name' },
		{ title: 'Image', field: 'display_image' },
		{ title: 'Stock', field: 'stock' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const closeUpdateModal = () => {
		setUpdateShowModal(false)
		if (typeof document !== 'undefined') {
			;(document.activeElement as HTMLElement)?.blur()
		}
	}

	const closeAddModal = () => {
		setShowModal(false)
		setFormData({
			stock_id: '',
			stock: '',
			item_id: '',
		})
		if (typeof document !== 'undefined') {
			;(document.activeElement as HTMLElement)?.blur()
		}
	}

	const handleAddStock = async () => {
		try {
			const productData: any = product.find((item: any) => item?.label == formData?.item_id)
			const payload: any = {
				item_id: productData?.value,
				stock: parseInt(formData?.stock),
			}
			await CreateProductStock(payload)
			toast.success('Stock Added Successfully')
			fetchData()
			closeAddModal()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleUpdateStock = async () => {
		try {
			const productData: any = product.find((item: any) => item?.label == formData?.item_id)
			const payload: any = {
				item_id: productData?.value,
				stock: parseInt(formData?.stock),
				stock_id: formData?.stock_id,
			}
			await UpdateProductStock(payload)
			toast.success('Stock Updated Successfully')
			fetchData()
			closeUpdateModal()
			setFormData({
				stock_id: '',
				stock: '',
				item_id: '',
			})
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const fetchProduct = async () => {
		try {
			const response: any = await GetProduct()
			const filteredProduct = response.data

			const formattedProduct = filteredProduct.map((product: any) => ({
				label: `${product.name}`,
				value: product._id,
			}))
			setProduct(formattedProduct)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchProduct()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const openDeleteModal = (item: any) => {
		setDeleteModal({
			show: true,
			stockId: item?._id,
			productName: item?.item_id?.name || 'this stock record',
			loading: false,
		})
	}

	const closeDeleteModal = () => {
		setDeleteModal({
			show: false,
			stockId: null,
			productName: '',
			loading: false,
		})
	}

	const handleConfirmDelete = async () => {
		if (!deleteModal.stockId) return

		try {
			setDeleteModal((prev) => ({ ...prev, loading: true }))
			await RemoveProductStock({
				stock_id: deleteModal.stockId,
			})
			toast.success('Stock record removed successfully')
			closeDeleteModal()
			fetchData()
		} catch (error: any) {
			toast.error(error.message || 'Failed to remove stock record')
			setDeleteModal((prev) => ({ ...prev, loading: false }))
		}
	}

	return (
		<div className='gz-inv-container'>
			<PageTitle breadcrumbs={[]}>Stock List</PageTitle>

			{/* Breadcrumbs */}
			<div className='gz-inv-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Inventory & Stock</span>
				<span className='sep'>/</span>
				<span className='current'>Stock List</span>
			</div>

			{/* Header */}
			<div className='gz-inv-header'>
				<div className='gz-inv-title-wrap'>
					<h1 className='gz-inv-title'>Stock List</h1>
					<p className='gz-inv-subtitle'>Manage product stock records and availability.</p>
				</div>

				{/* Add Product Stock Button */}
				<button
					type='button'
					className='gz-inv-primary-btn'
					onClick={() => setShowModal(true)}>
					<PlusIcon size={14} strokeWidth={3.6} />
					<span>Add Product Stock</span>
				</button>
			</div>

			{/* Main Content Card */}
			<div className='gz-inv-card'>
				{/* Toolbar */}
				<div className='gz-inv-toolbar'>
					<div className='gz-inv-toolbar-left'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search products...'
							className='me-0'
						/>

						{/* LengthMenu directly rendered without double background */}
						<LengthMenu
							expenseData={productData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>

						{/* Download Excel Button */}
						<div>
							<DownloadExcelButton
								data={productData}
								columns={sortableFields}
								filename='Product_Stock'
							/>
						</div>
					</div>
				</div>

				{/* Table Area */}
				<div className='gz-inv-table-wrap'>
					<Table
						data={productData}
						columns={sortableFields}
						sort={sort}
						sortOrder={sortOrder}
						onSortChange={handleSortChange}
						renderRow={(product: any, index: number, actualIndex: number, isVisible: boolean) => {
							const hasImage =
								product?.item_id?.display_image && !imageErrors[product?._id]

							return (
								<React.Fragment key={product._id || index}>
									<tr
										onClick={() => handleRowClick(product._id)}
										style={{ cursor: 'pointer' }}>
										<td className='text-center' style={{ width: '60px' }}>
											<span className='fw-bold' style={{ color: '#64748B', fontSize: '13px' }}>
												{actualIndex}
											</span>
										</td>

										<td>
											<span className='gz-inv-product-name'>
												{product?.item_id?.name || '—'}
											</span>
										</td>

										<td>
											{hasImage ? (
												<img
													src={`https://files.fggroup.in/${product?.item_id?.display_image}`}
													alt={product?.item_id?.name || 'Product'}
													className='gz-inv-thumb'
													onError={() =>
														setImageErrors((prev) => ({ ...prev, [product?._id]: true }))
													}
												/>
											) : (
												<div className='gz-inv-thumb-fallback'>
													<FontAwesomeIcon icon={faBoxesStacked} />
												</div>
											)}
										</td>

										<td>
											<span className='gz-inv-stock-value'>{product?.stock ?? 0}</span>
										</td>

										<td>
											<div className='gz-inv-actions'>
												<TableButton
													action='edit'
													className='table-action-btn-square'
													onClick={() => {
														setUpdateShowModal(true)
														setFormData({
															stock_id: product?._id,
															stock: product?.stock,
															item_id: product?.item_id?.name,
														})
													}}
													title='Edit Stock'
												/>
												<TableButton
													action='remove'
													className='table-action-btn-square'
													onClick={() => openDeleteModal(product)}
													title='Delete Stock'
												/>
											</div>
										</td>
									</tr>

									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12} className='bg-light-subtle p-4'>
												<div className='d-flex flex-column gap-1'>
													<div>
														<strong className='text-gray-700'>{sortableFields[0].title}: </strong>
														<span className='text-gray-900 fw-semibold'>{product?.item_id?.name}</span>
													</div>
													<div>
														<strong className='text-gray-700'>{sortableFields[2].title}: </strong>
														<span className='text-gray-900 fw-bold'>{product?.stock}</span>
													</div>
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

				{/* Empty State */}
				{productData.length === 0 && !loading && (
					<div className='gz-inv-empty-state'>
						<div className='gz-inv-empty-icon'>
							<FontAwesomeIcon icon={faBoxesStacked} />
						</div>
						<h3 className='gz-inv-empty-title'>No product stock records found</h3>
						<p className='gz-inv-empty-desc'>
							{searchTerm
								? 'No stock records match your search query. Try another keyword.'
								: 'Click "Add Product Stock" above to create your first stock entry.'}
						</p>
					</div>
				)}

				{/* Pagination */}
				{productData.length > 0 && (
					<UsersListPagination
						totalPages={metaData?.totalPages}
						currentPage={pagination.page}
						onPageChange={handlePageChange}
						totalRecords={metaData?.totalDocs ?? metaData?.totalRecords ?? metaData?.totalCount ?? productData.length}
						itemsPerPage={pagination.itemsPerPage}
						entityName='products'
					/>
				)}
			</div>

			{/* Add Product Stock Modal */}
			<Modal
				centered
				show={showModal}
				onHide={closeAddModal}
				dialogClassName='gz-inv-modal'
				contentClassName='border-0 shadow-lg'
				style={{ borderRadius: '16px' }}>
				<div className='gz-inv-modal-header'>
					<h3 className='gz-inv-modal-title'>Add Product Stock</h3>
					<button
						type='button'
						className='gz-inv-modal-close'
						onClick={closeAddModal}
						aria-label='Close'>
						<FontAwesomeIcon icon={faXmark} />
					</button>
				</div>

				<div className='gz-inv-modal-body'>
					<div className='mb-4'>
						<label className='gz-inv-form-label required'>Product</label>
						<SelectField
							name='item_id'
							value={formData.item_id}
							onChange={handleInputChange}
							options={product.map((item: any) => ({
								label: item?.label,
								value: item?.label,
							}))}
							defaultLabel='Select Product'
							showLabel={false}
							marginRemove={true}
							searchable={true}
						/>
					</div>

					<div>
						<label className='gz-inv-form-label required'>Stock Quantity</label>
						<input
							placeholder='Enter stock quantity'
							type='number'
							name='stock'
							min='0'
							className='gz-inv-form-control'
							autoComplete='off'
							value={formData.stock}
							onChange={handleInputChange}
						/>
					</div>
				</div>

				<div className='gz-inv-modal-footer'>
					<button
						type='button'
						className='gz-inv-btn-cancel'
						onClick={closeAddModal}>
						Cancel
					</button>
					<button
						type='button'
						className='gz-inv-btn-submit'
						onClick={handleAddStock}>
						<FontAwesomeIcon icon={faCheck} />
						<span>Add Stock</span>
					</button>
				</div>
			</Modal>

			{/* Update Product Stock Modal */}
			<Modal
				centered
				show={updateShowModal}
				onHide={closeUpdateModal}
				dialogClassName='gz-inv-modal'
				contentClassName='border-0 shadow-lg'
				style={{ borderRadius: '16px' }}>
				<div className='gz-inv-modal-header'>
					<h3 className='gz-inv-modal-title'>Update Product Stock</h3>
					<button
						type='button'
						className='gz-inv-modal-close'
						onClick={closeUpdateModal}
						aria-label='Close'>
						<FontAwesomeIcon icon={faXmark} />
					</button>
				</div>

				<div className='gz-inv-modal-body'>
					{/* Product (Read-Only) */}
					<div className='mb-4'>
						<label className='gz-inv-form-label'>Product</label>
						<input
							type='text'
							name='item_id'
							className='gz-inv-form-control'
							value={formData.item_id}
							readOnly
						/>
					</div>

					{/* Stock Quantity */}
					<div>
						<label className='gz-inv-form-label required'>Stock Quantity</label>
						<input
							placeholder='Enter stock quantity'
							type='number'
							name='stock'
							min='0'
							className='gz-inv-form-control'
							autoComplete='off'
							value={formData.stock}
							onChange={handleInputChange}
						/>
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

			{/* Delete Confirmation Modal */}
			<Modal
				centered
				show={deleteModal.show}
				onHide={closeDeleteModal}
				dialogClassName='gz-inv-modal'
				contentClassName='border-0 shadow-lg'
				style={{ borderRadius: '16px', maxWidth: '440px' }}>
				<div className='gz-inv-modal-header'>
					<h3 className='gz-inv-modal-title'>Delete Stock Record</h3>
					<button
						type='button'
						className='gz-inv-modal-close'
						onClick={closeDeleteModal}
						aria-label='Close'>
						<FontAwesomeIcon icon={faXmark} />
					</button>
				</div>

				<div className='gz-inv-modal-body text-center py-5'>
					<div className='gz-inv-delete-icon-box'>
						<FontAwesomeIcon icon={faTriangleExclamation} />
					</div>
					<h4 style={{ fontSize: '16.5px', fontWeight: 700, color: '#172B4D', marginBottom: '8px' }}>
						Are you sure you want to delete this stock?
					</h4>
					<p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
						This will permanently remove the stock record for{' '}
						<strong style={{ color: '#172B4D' }}>{deleteModal.productName}</strong>. This action cannot be undone.
					</p>
				</div>

				<div className='gz-inv-modal-footer'>
					<button
						type='button'
						className='gz-inv-btn-cancel'
						onClick={closeDeleteModal}
						disabled={deleteModal.loading}>
						Cancel
					</button>
					<button
						type='button'
						className='gz-inv-btn-delete-confirm'
						onClick={handleConfirmDelete}
						disabled={deleteModal.loading}>
						<FontAwesomeIcon icon={faTrashCan} />
						<span>{deleteModal.loading ? 'Deleting...' : 'Delete Stock'}</span>
					</button>
				</div>
			</Modal>
		</div>
	)
}

export default GomziNutritionProductStock
