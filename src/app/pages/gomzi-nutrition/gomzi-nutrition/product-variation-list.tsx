import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetProduct, RemoveProductVariation } from '../../../Functions/FGGroup'

const GomziNutritionProductVariationList: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const product_id: string | any = searchParams.get('product_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [productData, setProductData] = useState<any>({})
	const [variationData, setVariationData] = useState([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [expandedDescription, setExpandedDescription] = useState<{ [key: number]: boolean }>({})
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
			// Provide default values
			setVariationData(response?.data?.[0]?.variations || [])
			setProductData(response?.data?.[0] || {})

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
		setPagination({ ...pagination, itemsPerPage: value })
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
	}

	const sortableFields = [
		// { title: 'variation ID', field: '_id' },
		{ title: 'Image', field: 'display_image' },
		{ title: 'Product Name', field: 'name' },
		{ title: 'Flavour', field: 'flavour' },
		{ title: 'Price', field: 'price' },
		{ title: 'Stock', field: 'stock' },
		{ title: 'Discount Price', field: 'discountPrice' },
		{ title: 'Created Date', field: 'createdAt' },
		{ title: 'Updated Date', field: 'updatedAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleCopy = (id: string) => {
		navigator.clipboard
			.writeText(id)
			.then(() => {
				toast.success('ID copied to clipboard!')
			})
			.catch((err) => {
				console.error('Failed to copy ID: ', err)
				toast.success('Failed to copy ID!')
			})
	}

	const truncateString = (str: any, num: any) => {
		if (!str || typeof str !== 'string') {
			return ''
		}
		if (str?.length <= num) {
			return str
		}
		return str.slice(0, num) + '...'
	}

	const handleRemoveVariation = (product_id: any, variant_id: any) => {
		Swal.fire({
			icon: 'warning',
			title: 'Are you sure?',
			text: 'Once Completed, you will not be able to undone!',
			showCancelButton: true,
			confirmButtonText: 'Ok',
		}).then(async (result) => {
			if (result.isConfirmed) {
				await RemoveProductVariation({ product_id, variant_id })
				toast.success('Product Variation Remove Successfully')
				fetchData()
			}
		})
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Gomzi Nutrition Products</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<h1>{productData?.name}</h1>
				</div>
				<div className='card-header border-0'>
					<div className='card-title'>
						<div className='card-branch_code d-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<div className='d-md-block d-none'>
								<LengthMenu
									expenseData={variationData.length ? variationData : []}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
						</div>
					</div>
					<div className='card-toolbar'>
						<div>
							<TableButton
								action='add'
								to={`/rag/product-list/variation-add?product_id=${productData._id}`}
								text='Add Product'
							/>
						</div>
						<div className='d-md-none d-block mt-4'>
							<LengthMenu
								expenseData={variationData.length ? variationData : []}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={variationData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							disableSortFields={[
								'display_image',
								'name',
								'flavour',
								'price',
								'stock',
								'discountPrice',
								'createdAt',
								'updatedAt',
							]}
							onSortChange={handleSortChange}
							renderRow={(product: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={product._id}>
									<tr
										onClick={() => handleRowClick(product._id)}
										className='data-row'>
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
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<img
													src={
														`https://files.fggroup.in/` +
														(product?.displayImages?.length ? product.displayImages[0] : '')
													}
													alt={product.name}
													style={{ width: '80px', height: '80px', borderRadius: '10px' }}
												/>
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{product.name}</span>
										</td>

										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{product.flavour || '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												₹{product.price}/-
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{product.stock}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												₹{product.discountPrice}/-
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(product.createdAt).format('YYYY-MM-DD')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(product.updatedAt).format('YYYY-MM-DD')}
											</span>
										</td>
										<td>
											<TableButton
												action='edit'
												to={`/rag/product-list/variation-edit?product_id=${productData._id}&variation_id=${product._id}`}
											/>
											<TableButton
												action='remove'
												onClick={() => handleRemoveVariation(productData._id, product._id)}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<strong>{sortableFields[0].title}: </strong>
														{product.name}
														<br />
													</span>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<strong>{sortableFields[1].title}: </strong>
														<img
															src={`https://files.fggroup.in/` + product?.display_image?.[0]}
															alt={product.name}
															style={{ width: '80px', height: '80px', borderRadius: '10px' }}
														/>
														<br />
													</span>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<strong>{sortableFields[2].title}: </strong>₹ {product.price}
														<br />
													</span>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<strong>{sortableFields[3].title}: </strong>
														{product.stock}
														<br />
													</span>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<strong>{sortableFields[4].title}: </strong>
														{product.discountPrice}
														<br />
													</span>
													<span
														className='text-dark fw-bold  d-block mb-1 fs-6'
														title={product.description}>
														<strong>{sortableFields[5].title}: </strong>
														{expandedDescription[index]
															? product.description
															: truncateString(product.description, 100)}
														<br />
													</span>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<strong>{sortableFields[6].title}: </strong>
														{product.createdAt}
														<br />
													</span>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<strong>{sortableFields[7].title}: </strong>
														{product.updatedAt}
														<br />
													</span>
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{variationData?.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{variationData?.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
							totalRecords={metaData?.totalRecords || variationData?.length}
							itemsPerPage={pagination.itemsPerPage}
							entityName='variations'
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default GomziNutritionProductVariationList
