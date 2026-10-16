import { faCheck, faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
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

	const handleKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>, id: string) => {
		if (event.key === 'Enter' || event.key === ' ') {
			handleCopy(id)
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

	const deleteReply = (stock_id: any) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'You want to remove this Reply',
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Remove',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveProductStock({
						stock_id: stock_id,
					})
					toast.success('Comment reply removed successfully')
					fetchData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Gomzi Nutrition Products</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='card-branch_code d-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<LengthMenu
								expenseData={productData}
								handleItemsPerPageChange={handleItemsPerPageChange}
								value={pagination.itemsPerPage}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							onClick={() => setShowModal(true)}
							text='Add Product Stock'
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={productData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
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
												{product?.item_id?.name}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<img
													src={`https://files.fggroup.in/` + product?.item_id?.display_image}
													alt={product?.item_id?.name}
													style={{ width: '80px', height: '80px', borderRadius: '10px' }}
												/>
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{product?.stock}
											</span>
										</td>
										<td>
											<TableButton
												action='edit'
												onClick={() => {
													setUpdateShowModal(true)
													setFormData({
														stock_id: product?._id,
														stock: product?.stock,
														item_id: product?.item_id?.name,
													})
												}}
											/>
											<TableButton
												action='remove'
												onClick={() => deleteReply(product?._id)}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong> {product?.item_id?.name}
													<br />
													<strong>{sortableFields[2].title}: </strong> ₹ {product?.stock}
													<br />
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
					{productData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{productData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
							totalRecords={metaData?.totalRecords || productData.length}
							itemsPerPage={pagination.itemsPerPage}
							entityName='products'
						/>
					)}
				</div>
			</KTCard>
			{/* Add Modal */}
			<Modal
				centered
				show={showModal}
				onHide={closeAddModal}
				contentClassName='border-0 shadow-lg'
				style={{ borderRadius: '12px' }}>
				<div className='modal-header border-bottom py-4 px-6 d-flex align-items-center justify-content-between'>
					<h3 className='modal-title fw-bolder text-gray-900 fs-4 m-0'>Add Product Stock</h3>
					<button
						type='button'
						className='btn btn-sm btn-icon btn-active-light-primary rounded-circle'
						onClick={closeAddModal}
						aria-label='Close'
						style={{ width: '32px', height: '32px' }}>
						<FontAwesomeIcon icon={faXmark} className='fs-4 text-gray-500' />
					</button>
				</div>
				<div className='modal-body px-6 py-5'>
					<div className='mb-4'>
						<label className='form-label required fw-bold text-gray-800 fs-7 mb-1'>Product</label>
						<SelectField
							className='w-100'
							label=''
							name='item_id'
							options={product.map((item: any) => item?.label)}
							value={formData.item_id}
							onChange={handleInputChange}
							showLabel={false}
							marginRemove
						/>
					</div>
					<div>
						<label className='form-label required fw-bold text-gray-800 fs-7 mb-1'>Stock Quantity</label>
						<input
							placeholder='Enter stock quantity'
							type='number'
							name='stock'
							min='0'
							className='form-control'
							autoComplete='off'
							value={formData.stock}
							onChange={handleInputChange}
							style={{
								border: '1px solid #DFE7F0',
								borderRadius: '8px',
								height: '40px',
								fontSize: '14px',
								fontWeight: 600,
							}}
						/>
					</div>
				</div>
				<div className='modal-footer border-top py-3 px-6 d-flex justify-content-end gap-2'>
					<button
						type='button'
						className='btn btn-light btn-active-light-primary fw-semibold px-4'
						style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
						onClick={closeAddModal}>
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
						onClick={handleAddStock}>
						<FontAwesomeIcon icon={faCheck} />
						Add Stock
					</button>
				</div>
			</Modal>

			{/* Update Modal */}
			<Modal
				centered
				show={updateShowModal}
				onHide={closeUpdateModal}
				contentClassName='border-0 shadow-lg'
				style={{ borderRadius: '12px' }}>
				<div className='modal-header border-bottom py-4 px-6 d-flex align-items-center justify-content-between'>
					<h3 className='modal-title fw-bolder text-gray-900 fs-4 m-0'>Update Product Stock</h3>
					<button
						type='button'
						className='btn btn-sm btn-icon btn-active-light-primary rounded-circle'
						onClick={closeUpdateModal}
						aria-label='Close'
						style={{ width: '32px', height: '32px' }}>
						<FontAwesomeIcon icon={faXmark} className='fs-4 text-gray-500' />
					</button>
				</div>
				<div className='modal-body px-6 py-5'>
					{/* Product (Read-Only) */}
					<div className='mb-4'>
						<label className='form-label fw-bold text-gray-700 fs-7 mb-1'>Product</label>
						<input
							type='text'
							name='item_id'
							className='form-control form-control-solid fw-semibold fs-7 text-gray-700'
							value={formData.item_id}
							readOnly
							style={{
								backgroundColor: '#F8FAFC',
								border: '1px solid #E2E8F0',
								borderRadius: '8px',
								height: '40px',
							}}
						/>
					</div>

					{/* Stock Quantity */}
					<div>
						<label className='form-label required fw-bold text-gray-800 fs-7 mb-1'>Stock Quantity</label>
						<input
							placeholder='Enter stock quantity'
							type='number'
							name='stock'
							min='0'
							className='form-control'
							autoComplete='off'
							value={formData.stock}
							onChange={handleInputChange}
							style={{
								border: '1px solid #DFE7F0',
								borderRadius: '8px',
								height: '40px',
								fontSize: '14px',
								fontWeight: 600,
							}}
						/>
					</div>
				</div>
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

export default GomziNutritionProductStock
