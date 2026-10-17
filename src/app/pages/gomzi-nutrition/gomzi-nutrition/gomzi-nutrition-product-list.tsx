/* eslint-disable */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPlus,
	faEye,
	faPenToSquare,
	faTrash,
	faDownload,
	faBoxOpen,
	faBoxesStacked,
	faCheckCircle,
	faExclamationTriangle,
	faBan,
	faAngleLeft,
	faAngleRight,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import LengthMenu from '../../../components/LengthMenu'
import NumberTicker from '../../../components/NumberTicker'
import GomziTablePagination from '../../../components/GomziTablePagination'
import { DeleteProduct, GetProduct } from '../../../Functions/FGGroup'
import '../products-theme.css'

const GomziNutritionProductList: React.FC = () => {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string>('All')
	const [selectedStatus, setSelectedStatus] = useState<string>('All')
	const [productData, setProductData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [loading, setLoading] = useState(true)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetProduct({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			setProductData(response?.data || [])

			const meta: any = response?.metadata
			if (meta?.pagination) {
				setMetaData(meta.pagination)
			}
		} catch (error: any) {
			console.error('Error fetching products:', error)
			toast.error('Failed to load products')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const isFirstRender = useRef(true)
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		setPagination((prev) => ({ ...prev, page: 1 }))
		if (pagination.page === 1) fetchData(1)
	}, [searchTerm])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, page: 1, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleDeleteProduct = async (id: string, name: string) => {
		const result = await Swal.fire({
			title: 'Delete Product?',
			text: `Are you sure you want to delete "${name || 'this product'}"? This action cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DC2626',
			cancelButtonColor: '#71809A',
			confirmButtonText: 'Yes, delete',
			cancelButtonText: 'Cancel',
		})

		if (!result.isConfirmed) return

		try {
			await DeleteProduct({ id })
			toast.success('Product deleted successfully')
			fetchData()
		} catch (error: any) {
			toast.error(error?.message || 'Failed to delete product')
		}
	}

	// Dynamic Category extraction from data
	const categoriesList = useMemo(() => {
		const cats = new Set<string>()
		productData.forEach((p) => {
			if (Array.isArray(p.categories)) {
				p.categories.forEach((c: string) => c && cats.add(c.trim()))
			} else if (p.category) {
				cats.add(String(p.category).trim())
			}
		})
		return Array.from(cats)
	}, [productData])

	// Filtered product records (client-side Category & Status filtering over fetched page)
	const filteredProducts = useMemo(() => {
		return productData.filter((item) => {
			// Category filter
			if (selectedCategory !== 'All') {
				const itemCats: string[] = Array.isArray(item.categories)
					? item.categories.map((c: any) => String(c).toLowerCase())
					: item.category
					? [String(item.category).toLowerCase()]
					: []
				if (!itemCats.includes(selectedCategory.toLowerCase())) {
					return false
				}
			}

			// Status filter
			const stockNum = Number(item.stock ?? 0)
			if (selectedStatus === 'in_stock' && stockNum <= 0) return false
			if (selectedStatus === 'low_stock' && (stockNum <= 0 || stockNum > 10)) return false
			if (selectedStatus === 'out_of_stock' && stockNum > 0) return false

			return true
		})
	}, [productData, selectedCategory, selectedStatus])

	// Summary KPI calculations
	const summaryStats = useMemo(() => {
		const total = metaData?.totalCount || productData.length || 0
		const inStock = productData.filter((p) => Number(p.stock ?? 0) > 10).length
		const lowStock = productData.filter((p) => {
			const s = Number(p.stock ?? 0)
			return s > 0 && s <= 10
		}).length
		const outOfStock = productData.filter((p) => Number(p.stock ?? 0) === 0).length

		return {
			total,
			active: inStock + lowStock,
			lowStock,
			outOfStock,
		}
	}, [productData, metaData])

	const downloadExcel = () => {
		const worksheetData = filteredProducts.map((product: any, idx: number) => {
			const stockVal = Number(product?.stock ?? 0)
			const statusLabel = stockVal > 10 ? 'In Stock' : stockVal > 0 ? 'Low Stock' : 'Out of Stock'
			const catDisplay = Array.isArray(product?.categories) ? product.categories.join(', ') : product?.category || 'General'

			return {
				'No.': idx + 1,
				'Product Name': product?.name || 'N/A',
				Company: product?.company || 'Gomzi Nutrition',
				Flavour: product?.flavour || 'N/A',
				Category: catDisplay,
				Stock: stockVal,
				'Price (₹)': product?.price ?? 'N/A',
				'Discount Price (₹)': product?.discountPrice ?? 'N/A',
				SKU: product?.sku || `NUT-${String(product?._id || '').slice(-4).toUpperCase()}`,
				Status: statusLabel,
				'Created At': product?.createdAt ? DayJS(product.createdAt).format('DD/MM/YYYY hh:mm A') : 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
		XLSX.writeFile(workbook, `Gomzi_Products_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	const totalPages = metaData?.totalPages || Math.ceil((metaData?.totalCount || productData.length) / pagination.itemsPerPage) || 1
	const currentStart = (pagination.page - 1) * pagination.itemsPerPage + 1
	const currentEnd = Math.min(pagination.page * pagination.itemsPerPage, metaData?.totalCount || productData.length)

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>All Products</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<span>Products & Orders</span>
				<span className='sep'>&gt;</span>
				<span className='current'>All Products</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>All Products</h1>
					<p className='gz-prod-subtitle'>Manage all products in your catalog</p>
				</div>
				<Link to='/rag/product-add' className='gz-prod-btn-primary'>
					<FontAwesomeIcon icon={faPlus} />
					<span>Add Product</span>
				</Link>
			</div>

			{/* =========================================================================
			    SUMMARY METRICS CARDS
			    ========================================================================= */}
			<div className='gz-prod-summary-grid'>
				{/* Total Products */}
				<div className='gz-prod-summary-card blue'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faBoxesStacked} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Total Products</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.total} />
							)}
						</span>
					</div>
				</div>

				{/* Active Products */}
				<div className='gz-prod-summary-card green'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faCheckCircle} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Active Products</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.active} />
							)}
						</span>
					</div>
				</div>

				{/* Low Stock Items */}
				<div className='gz-prod-summary-card amber'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faExclamationTriangle} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Low Stock Items</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '35px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.lowStock} />
							)}
						</span>
					</div>
				</div>

				{/* Out of Stock */}
				<div className='gz-prod-summary-card red'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faBan} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Out of Stock</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '35px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.outOfStock} />
							)}
						</span>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    TOOLBAR (SEARCHBAR -> LENGTHMENU -> CATEGORY -> STATUS -> EXPORT)
			    ========================================================================= */}
			<div className='gz-prod-toolbar'>
				<div className='gz-prod-toolbar-left'>
					{/* 1. Search Filter */}
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						className='me-0'
					/>

					{/* 2. Items Per Page */}
					<LengthMenu
						expenseData={productData}
						handleItemsPerPageChange={handleItemsPerPageChange}
						className='me-0'
					/>

					{/* 3. Category Filter */}
					<select
						className='gz-prod-select'
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						title='Filter by Category'>
						<option value='All'>All Categories</option>
						{categoriesList.map((cat, idx) => (
							<option key={idx} value={cat}>
								{cat}
							</option>
						))}
					</select>

					{/* 4. Status Filter */}
					<select
						className='gz-prod-select'
						value={selectedStatus}
						onChange={(e) => setSelectedStatus(e.target.value)}
						title='Filter by Stock Status'>
						<option value='All'>All Status</option>
						<option value='in_stock'>In Stock</option>
						<option value='low_stock'>Low Stock</option>
						<option value='out_of_stock'>Out of Stock</option>
					</select>
				</div>

				<div className='gz-prod-toolbar-right'>
					{/* 5. Download Excel */}
					<button
						type='button'
						className='gz-prod-btn-icon-export'
						onClick={downloadExcel}
						disabled={loading || filteredProducts.length === 0}
						title='Export Products to Excel'>
						<FontAwesomeIcon icon={faDownload} />
					</button>
				</div>
			</div>

			{/* =========================================================================
			    PRODUCTS TABLE
			    ========================================================================= */}
			<div className='gz-prod-table-card'>
				<div className='table-responsive'>
					<table className='gz-prod-table'>
						<thead>
							<tr>
								<th style={{ width: '48px', textAlign: 'center' }}>#</th>
								<th>Product</th>
								<th>SKU</th>
								<th>Category</th>
								<th>Stock</th>
								<th>Price</th>
								<th>Discount Price</th>
								<th style={{ textAlign: 'center' }}>Status</th>
								<th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 6 }).map((_, sIdx) => (
									<tr key={`prod-skel-${sIdx}`} className='gz-prod-skeleton-row'>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-prod-skeleton' style={{ width: '18px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<div className='gz-prod-identity-cell'>
												<span className='gz-prod-skeleton' style={{ width: '44px', height: '44px', borderRadius: '10px' }}></span>
												<div className='d-flex flex-column gap-1'>
													<span className='gz-prod-skeleton' style={{ width: `${140 - sIdx * 8}px`, height: '16px', borderRadius: '4px' }}></span>
													<span className='gz-prod-skeleton' style={{ width: '85px', height: '12px', borderRadius: '4px' }}></span>
												</div>
											</div>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '75px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '90px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '40px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '65px', height: '15px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '65px', height: '15px', borderRadius: '4px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-prod-skeleton' style={{ width: '70px', height: '22px', borderRadius: '999px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<div className='d-flex align-items-center justify-content-center gap-2'>
												<span className='gz-prod-skeleton' style={{ width: '34px', height: '34px', borderRadius: '10px' }}></span>
												<span className='gz-prod-skeleton' style={{ width: '34px', height: '34px', borderRadius: '10px' }}></span>
												<span className='gz-prod-skeleton' style={{ width: '34px', height: '34px', borderRadius: '10px' }}></span>
											</div>
										</td>
									</tr>
								))
							) : filteredProducts.length === 0 ? (
								<tr>
									<td colSpan={9} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap'>
											{!searchTerm && selectedCategory === 'All' && selectedStatus === 'All' ? (
												<Link to='/rag/product-add' className='gz-empty-plus-btn' title='Add Product'>
													<FontAwesomeIcon icon={faPlus} />
												</Link>
											) : (
												<div className='gz-prod-empty-icon'>
													<FontAwesomeIcon icon={faBoxOpen} />
												</div>
											)}
											<h4 className='gz-empty-state-title'>
												No products found
											</h4>
											<p className='gz-empty-state-desc'>
												{searchTerm || selectedCategory !== 'All' || selectedStatus !== 'All'
													? 'No products matched your search or filter criteria.'
													: 'Create your first product to begin managing your nutrition catalog.'}
											</p>
											{!searchTerm && selectedCategory === 'All' && selectedStatus === 'All' && (
												<Link to='/rag/product-add' className='gz-prod-btn-primary'>
													<FontAwesomeIcon icon={faPlus} />
													<span>Add Product</span>
												</Link>
											)}
										</div>
									</td>
								</tr>
							) : (
								filteredProducts.map((product: any, index: number) => {
									const actualIndex = currentStart + index
									const stockVal = Number(product?.stock ?? 0)
									const isLow = stockVal > 0 && stockVal <= 10
									const isOut = stockVal <= 0
									const skuDisplay = product?.sku || `NUT-${String(product?._id || '').slice(-4).toUpperCase()}`
									const categoryDisplay = Array.isArray(product?.categories)
										? product.categories[0] || 'General'
										: product?.category || 'General'
									const primaryImg = product?.displayImages?.[0]

									return (
										<tr key={product._id || index}>
											<td style={{ textAlign: 'center', color: '#71809A', fontSize: '12.5px' }}>
												{actualIndex}
											</td>
											<td>
												<div className='gz-prod-identity-cell'>
													{primaryImg ? (
														<img
															src={`https://files.fggroup.in/${primaryImg}`}
															alt={product.name}
															className='gz-prod-thumb'
															onError={(e) => {
																;(e.target as HTMLElement).style.display = 'none'
															}}
														/>
													) : (
														<div className='gz-prod-thumb-placeholder'>
															<FontAwesomeIcon icon={faBoxOpen} />
														</div>
													)}
													<div className='gz-prod-identity-info'>
														<span className='gz-prod-name'>{product.name}</span>
														<div className='d-flex align-items-center gap-1 flex-wrap mt-1'>
															{product.company && (
																<span
																	className='badge badge-light-primary fw-semibold'
																	style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
																	{product.company}
																</span>
															)}
															{product.flavour && (
																<span className='gz-prod-subtext'>{product.flavour}</span>
															)}
														</div>
													</div>
												</div>
											</td>
											<td style={{ color: '#71809A', fontWeight: 500, fontSize: '13px' }}>
												{skuDisplay}
											</td>
											<td>
												<span style={{ color: '#475569', fontWeight: 500 }}>
													{categoryDisplay}
												</span>
											</td>
											<td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
												{stockVal}
											</td>
											<td style={{ fontWeight: 600, color: '#172B4D', fontVariantNumeric: 'tabular-nums' }}>
												₹{Number(product?.price || 0).toLocaleString('en-IN')}
											</td>
											<td style={{ fontWeight: 600, color: '#168064', fontVariantNumeric: 'tabular-nums' }}>
												₹{Number(product?.discountPrice || product?.price || 0).toLocaleString('en-IN')}
											</td>
											<td style={{ textAlign: 'center' }}>
												{isOut ? (
													<span className='gz-prod-badge out-of-stock'>Out of Stock</span>
												) : isLow ? (
													<span className='gz-prod-badge low-stock'>Low Stock</span>
												) : (
													<span className='gz-prod-badge in-stock'>In Stock</span>
												)}
											</td>
											<td style={{ textAlign: 'center' }}>
												<div className='d-flex align-items-center justify-content-center gap-2'>
													{/* View Product Variations */}
													<button
														type='button'
														className='gz-prod-action-btn view'
														title='View Product Variations'
														onClick={() => navigate(`/rag/product-list/variation-list?product_id=${product._id}`)}>
														<FontAwesomeIcon icon={faEye} />
													</button>

													{/* Edit Product */}
													<button
														type='button'
														className='gz-prod-action-btn edit'
														title='Edit Product'
														onClick={() => navigate(`/rag/product-edit?product_id=${product._id}`)}>
														<FontAwesomeIcon icon={faPenToSquare} />
													</button>

													{/* Delete Product */}
													<button
														type='button'
														className='gz-prod-action-btn delete'
														title='Delete Product'
														onClick={() => handleDeleteProduct(product._id, product.name)}>
														<FontAwesomeIcon icon={faTrash} />
													</button>
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				{!loading && productData.length > 0 && (
					<GomziTablePagination
						totalRecords={metaData?.totalCount || productData.length}
						page={pagination.page}
						itemsPerPage={pagination.itemsPerPage}
						totalPages={totalPages}
						onPageChange={handlePageChange}
						entityName='products'
					/>
				)}
			</div>
		</div>
	)
}

export default GomziNutritionProductList
