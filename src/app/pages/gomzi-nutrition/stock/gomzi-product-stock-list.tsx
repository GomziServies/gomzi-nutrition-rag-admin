import { faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
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
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const isFirstRender = useRef(true);

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
			setShowModal(false)
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
			setUpdateShowModal(false)
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
						/>
					)}
				</div>
			</KTCard>
			{/*add Modal*/}
			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Add Product Stock</h2>
						<button
							onClick={() => setShowModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'
							data-bs-dismiss='modal'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body'>
						<div className='row'>
							<div className='col-12 fv-row mb-7'>
								<label
									htmlFor='Product List'
									className='fw-bold fs-6 mb-md-5 mb-2'>
									Product List
								</label>
								<SelectField
									className='w-100 fv-row mb-7'
									label='Product'
									name='item_id'
									options={product.map((product: any) => product?.label)}
									value={formData.item_id}
									onChange={handleInputChange}
									htmlFor='user'
								/>
								<label
									htmlFor='Stock'
									className='required fw-bold fs-6 mb-5'>
									Stock
								</label>
								<input
									placeholder='Bundle Name'
									type='number'
									name='stock'
									className='w-100 form-control fv-row mb-7'
									autoComplete='off'
									value={formData.stock}
									onChange={handleInputChange}
								/>
							</div>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='add'
							onClick={() => handleAddStock()}
							text='Add'
						/>
					</div>
				</div>
			</Modal>

			{/*Update Modal*/}
			<Modal
				centered
				show={updateShowModal}
				onHide={() => setUpdateShowModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Update Product Stock</h2>
						<button
							onClick={() => setUpdateShowModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'
							data-bs-dismiss='modal'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body'>
						<div className='row'>
							<div className='col-12 fv-row mb-7'>
								<label
									htmlFor='Product List'
									className='fw-bold fs-6 mb-md-5 mb-2'>
									Product List
								</label>
								<input
									placeholder='Bundle Name'
									type='text'
									name='item_id'
									className='w-100 form-control fv-row mb-7'
									autoComplete='off'
									value={formData.item_id}
									onChange={handleInputChange}
									disabled
								/>
								<label
									htmlFor='Stock'
									className='required fw-bold fs-6 mb-5'>
									Stock
								</label>
								<input
									placeholder='Enter Stock'
									type='number'
									name='stock'
									className='w-100 form-control fv-row mb-7'
									autoComplete='off'
									value={formData.stock}
									onChange={handleInputChange}
								/>
							</div>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='edit'
							onClick={() => handleUpdateStock()}
							text='Update'
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default GomziNutritionProductStock
