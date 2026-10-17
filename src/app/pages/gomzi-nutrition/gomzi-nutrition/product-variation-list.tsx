/* eslint-disable */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPlus,
	faPenToSquare,
	faTrash,
	faDownload,
	faBoxOpen,
	faBoxesStacked,
	faCheckCircle,
	faExclamationTriangle,
	faBan,
	faArrowLeft,
	faCopy,
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
import { GetProduct, RemoveProductVariation } from '../../../Functions/FGGroup'
import { PlusIcon } from '../../../components/animated-icons'
import '../products-theme.css'

const GomziNutritionProductVariationList: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const product_id: string = searchParams.get('product_id') || ''

	const [searchTerm, setSearchTerm] = useState('')
	const [productData, setProductData] = useState<any>({})
	const [variationData, setVariationData] = useState<any[]>([])
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
				id: product_id,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})

			const product = response?.data?.[0] || {}
			setProductData(product)
			setVariationData(product?.variations || [])

			const meta: any = response?.metadata
			if (meta?.pagination) {
				setMetaData(meta.pagination)
			}
		} catch (error: any) {
			console.error('Error fetching product variations:', error)
			toast.error('Failed to load variations')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (product_id) {
			fetchData()
		} else {
			setLoading(false)
		}
	}, [product_id, pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const isFirstRender = useRef(true)
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		setPagination((prev) => ({ ...prev, page: 1 }))
		if (pagination.page === 1 && product_id) {
			fetchData(1)
		}
	}, [searchTerm])

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, page: 1, itemsPerPage: value }))
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
		sessionStorage.setItem('variationCurrentPage', page.toString())
	}

	useEffect(() => {
		const storedPage = sessionStorage.getItem('variationCurrentPage')
		if (storedPage) {
			setPagination((prev) => ({ ...prev, page: parseInt(storedPage, 10) }))
		}
	}, [])

	const handleCopy = (id: string, label: string = 'ID') => {
		if (!id) return
		navigator.clipboard
			.writeText(id)
			.then(() => toast.success(`${label} copied to clipboard!`))
			.catch(() => toast.error('Failed to copy!'))
	}

	const handleRemoveVariation = (productId: string, variantId: string, variantName?: string) => {
		Swal.fire({
			title: 'Delete Variation?',
			text: `Are you sure you want to delete "${variantName || 'this variation'}"? This action cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DC2626',
			cancelButtonColor: '#71809A',
			confirmButtonText: 'Yes, delete',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveProductVariation({ product_id: productId, variant_id: variantId })
					toast.success('Product Variation removed successfully')
					fetchData()
				} catch (err: any) {
					toast.error(err?.message || 'Failed to remove product variation')
				}
			}
		})
	}

	// Filter variations by searchTerm
	const filteredVariations = useMemo(() => {
		if (!searchTerm.trim()) return variationData
		const term = searchTerm.toLowerCase().trim()
		return variationData.filter((v: any) => {
			const nameMatch = v?.name?.toLowerCase().includes(term)
			const flavourMatch = v?.flavour?.toLowerCase().includes(term)
			const skuMatch = v?.sku?.toLowerCase().includes(term)
			return nameMatch || flavourMatch || skuMatch
		})
	}, [variationData, searchTerm])

	// Client-side slice if backend returns array
	const paginatedVariations = useMemo(() => {
		if (metaData?.totalRecords && metaData.totalRecords > variationData.length) {
			return filteredVariations
		}
		const start = (pagination.page - 1) * pagination.itemsPerPage
		return filteredVariations.slice(start, start + pagination.itemsPerPage)
	}, [filteredVariations, pagination.page, pagination.itemsPerPage, metaData])

	// Summary stats
	const summaryStats = useMemo(() => {
		const total = variationData.length
		let inStock = 0
		let lowStock = 0
		let outOfStock = 0

		variationData.forEach((v: any) => {
			const stock = Number(v?.stock ?? 0)
			if (stock <= 0) outOfStock++
			else if (stock <= 10) lowStock++
			else inStock++
		})

		return { total, inStock, lowStock, outOfStock }
	}, [variationData])

	const downloadExcel = () => {
		if (!variationData || variationData.length === 0) {
			toast.error('No variation data to export')
			return
		}

		const exportRows = filteredVariations.map((v: any, idx: number) => ({
			'#': idx + 1,
			'Variant Name': v?.name || '',
			'Parent Product': productData?.name || '',
			'Flavor': v?.flavour || '-',
			'SKU': v?.sku || '-',
			'Stock': Number(v?.stock ?? 0),
			'Price (INR)': Number(v?.price ?? 0),
			'Discount Price (INR)': Number(v?.discountPrice ?? v?.price ?? 0),
			'Weight': `${v?.weight?.amount || ''} ${v?.weight?.unit || ''}`.trim() || '-',
			'Servings': v?.servings || '-',
			'Available': v?.isAvailable === false ? 'No' : 'Yes',
			'Created Date': v?.createdAt ? DayJS(v.createdAt).format('YYYY-MM-DD') : '-',
			'Updated Date': v?.updatedAt ? DayJS(v.updatedAt).format('YYYY-MM-DD') : '-',
		}))

		const ws = XLSX.utils.json_to_sheet(exportRows)
		const wb = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(wb, ws, 'Variations')
		const fileName = `${(productData?.name || 'Product').replace(/[^a-zA-Z0-9]/g, '_')}_Variations_${DayJS().format('YYYY-MM-DD')}.xlsx`
		XLSX.writeFile(wb, fileName)
		toast.success('Variations exported to Excel')
	}

	const currentStart = (pagination.page - 1) * pagination.itemsPerPage + 1
	const totalItems = metaData?.totalRecords || filteredVariations.length
	const totalPages = metaData?.totalPages || Math.ceil(totalItems / pagination.itemsPerPage) || 1

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>
				{productData?.name ? `${productData.name} — Variations` : 'Product Variations'}
			</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/product-list'>Products &amp; Orders</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>{productData?.name ? productData.name : 'Variations'}</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>
						{productData?.name ? `${productData.name} — Variations` : 'Product Variations'}
					</h1>
					<p className='gz-prod-subtitle'>
						Manage product variants, flavors, pricing, stock levels and packaging
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link
						to='/rag/product-list'
						className='gz-prod-btn-cancel'
						title='Back to Products'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Products</span>
					</Link>
					<Link
						to={`/rag/product-list/variation-add?product_id=${product_id || productData?._id}`}
						className='gz-prod-btn-primary'
						title='Add New Product Variation'>
						<PlusIcon size={14} strokeWidth={3.6} />
						<span>Add Variation</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    SUMMARY METRICS CARDS
			    ========================================================================= */}
			<div className='gz-prod-summary-grid'>
				{/* Total Variations */}
				<div className='gz-prod-summary-card blue'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faBoxesStacked} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Total Variations</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.total} />
							)}
						</span>
					</div>
				</div>

				{/* In Stock */}
				<div className='gz-prod-summary-card green'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faCheckCircle} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>In Stock</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.inStock} />
							)}
						</span>
					</div>
				</div>

				{/* Low Stock */}
				<div className='gz-prod-summary-card amber'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faExclamationTriangle} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Low Stock</span>
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
			    TOOLBAR (SEARCHBAR -> LENGTHMENU -> EXPORT)
			    ========================================================================= */}
			<div className='gz-prod-toolbar'>
				<div className='gz-prod-toolbar-left'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						className='me-0'
					/>
					<LengthMenu
						expenseData={variationData}
						handleItemsPerPageChange={handleItemsPerPageChange}
						className='me-0'
					/>
				</div>

				<div className='gz-prod-toolbar-right'>
					<button
						type='button'
						className='gz-prod-btn-icon-export'
						onClick={downloadExcel}
						disabled={loading || filteredVariations.length === 0}
						title='Export Variations to Excel'>
						<FontAwesomeIcon icon={faDownload} />
					</button>
				</div>
			</div>

			{/* =========================================================================
			    VARIATIONS TABLE
			    ========================================================================= */}
			<div className='gz-prod-table-card'>
				<div className='table-responsive'>
					<table className='gz-prod-table'>
						<thead>
							<tr>
								<th style={{ width: '48px', textAlign: 'center' }}>#</th>
								<th>Variation</th>
								<th>SKU</th>
								<th>Flavour</th>
								<th>Weight / Servings</th>
								<th>Stock</th>
								<th>Price</th>
								<th>Discount Price</th>
								<th style={{ textAlign: 'center' }}>Status</th>
								<th style={{ textAlign: 'center', width: '110px' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 4 }).map((_, sIdx) => (
									<tr key={`var-skel-${sIdx}`} className='gz-prod-skeleton-row'>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-prod-skeleton' style={{ width: '18px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<div className='gz-prod-identity-cell'>
												<span className='gz-prod-skeleton' style={{ width: '44px', height: '44px', borderRadius: '10px' }}></span>
												<div className='d-flex flex-column gap-1'>
													<span className='gz-prod-skeleton' style={{ width: '120px', height: '16px', borderRadius: '4px' }}></span>
													<span className='gz-prod-skeleton' style={{ width: '70px', height: '12px', borderRadius: '4px' }}></span>
												</div>
											</div>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '70px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '80px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '70px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '40px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '60px', height: '15px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '60px', height: '15px', borderRadius: '4px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-prod-skeleton' style={{ width: '70px', height: '22px', borderRadius: '999px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<div className='d-flex align-items-center justify-content-center gap-2'>
												<span className='gz-prod-skeleton' style={{ width: '34px', height: '34px', borderRadius: '10px' }}></span>
												<span className='gz-prod-skeleton' style={{ width: '34px', height: '34px', borderRadius: '10px' }}></span>
											</div>
										</td>
									</tr>
								))
							) : filteredVariations.length === 0 ? (
								<tr>
									<td colSpan={10} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap'>
											{!searchTerm ? (
												<Link
													to={`/rag/product-list/variation-add?product_id=${product_id || productData?._id}`}
													className='gz-empty-plus-btn'
													title='Add First Variation'>
													<FontAwesomeIcon icon={faPlus} />
												</Link>
											) : (
												<div className='gz-prod-empty-icon'>
													<FontAwesomeIcon icon={faBoxOpen} />
												</div>
											)}
											<h4 className='gz-empty-state-title'>No variations found</h4>
											<p className='gz-empty-state-desc'>
												{searchTerm
													? 'No variations matched your search criteria.'
													: 'Create a variation with custom flavour, weight, pricing, or stock for this product.'}
											</p>
											{!searchTerm && (
												<Link
													to={`/rag/product-list/variation-add?product_id=${product_id || productData?._id}`}
													className='gz-prod-btn-primary'>
													<PlusIcon size={14} strokeWidth={3.6} />
													<span>Add First Variation</span>
												</Link>
											)}
										</div>
									</td>
								</tr>
							) : (
								paginatedVariations.map((variant: any, index: number) => {
									const actualIndex = currentStart + index
									const stockVal = Number(variant?.stock ?? 0)
									const isLow = stockVal > 0 && stockVal <= 10
									const isOut = stockVal <= 0
									const primaryImg =
										variant?.displayImages?.[0] ||
										(Array.isArray(variant?.display_image) ? variant.display_image[0] : variant?.display_image)
									const skuDisplay = variant?.sku || `VAR-${String(variant?._id || '').slice(-4).toUpperCase()}`
									const weightDisplay = [
										variant?.weight?.amount ? `${variant.weight.amount} ${variant.weight.unit || 'g'}` : null,
										variant?.servings ? `${variant.servings} Servings` : null,
									].filter(Boolean).join(' • ') || '-'

									return (
										<tr key={variant._id || index}>
											<td style={{ textAlign: 'center', color: '#71809A', fontSize: '12.5px' }}>
												{actualIndex}
											</td>
											<td>
												<div className='gz-prod-identity-cell'>
													{primaryImg ? (
														<img
															src={
																primaryImg.startsWith('http')
																	? primaryImg
																	: `https://files.fggroup.in/${primaryImg}`
															}
															alt={variant.name}
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
														<span className='gz-prod-name'>{variant.name || productData?.name}</span>
														{variant.flavour && (
															<span className='gz-prod-subtext'>{variant.flavour}</span>
														)}
													</div>
												</div>
											</td>
											<td>
												<div className='d-flex align-items-center gap-2'>
													<span style={{ color: '#475569', fontWeight: 600, fontSize: '13px' }}>
														{skuDisplay}
													</span>
													{variant?.sku && (
														<button
															type='button'
															className='border-0 bg-transparent p-0 text-muted'
															onClick={() => handleCopy(variant.sku, 'SKU')}
															title='Copy SKU'
															style={{ cursor: 'pointer', fontSize: '11px' }}>
															<FontAwesomeIcon icon={faCopy} />
														</button>
													)}
												</div>
											</td>
											<td>
												<span style={{ color: '#172B4D', fontWeight: 500 }}>
													{variant.flavour || 'Standard'}
												</span>
											</td>
											<td style={{ color: '#71809A', fontSize: '13px' }}>
												{weightDisplay}
											</td>
											<td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
												{stockVal}
											</td>
											<td style={{ fontWeight: 600, color: '#172B4D', fontVariantNumeric: 'tabular-nums' }}>
												₹{Number(variant?.price || 0).toLocaleString('en-IN')}
											</td>
											<td style={{ fontWeight: 600, color: '#168064', fontVariantNumeric: 'tabular-nums' }}>
												₹{Number(variant?.discountPrice || variant?.price || 0).toLocaleString('en-IN')}
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
													{/* Edit Variation */}
													<button
														type='button'
														className='gz-prod-action-btn edit'
														title='Edit Variation'
														onClick={() =>
															navigate(
																`/rag/product-list/variation-edit?product_id=${productData._id || product_id}&variation_id=${variant._id}`
															)
														}>
														<FontAwesomeIcon icon={faPenToSquare} />
													</button>

													{/* Delete Variation */}
													<button
														type='button'
														className='gz-prod-action-btn delete'
														title='Delete Variation'
														onClick={() =>
															handleRemoveVariation(
																productData._id || product_id,
																variant._id,
																variant.name
															)
														}>
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

				{/* Pagination */}
				{filteredVariations.length > 0 && (
					<GomziTablePagination
						totalRecords={totalItems}
						page={pagination.page}
						totalPages={totalPages}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
						entityName='variations'
					/>
				)}
			</div>
		</div>
	)
}

export default GomziNutritionProductVariationList
