import { faCopy, faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import {
	CreateGnRawMaterialProduct,
	GetGnRawMaterialProduct,
	RemoveGnRawMaterialProduct,
	UpdateGnRawMaterialProduct,
} from '../../../../Functions/FGGroup'

const GNInventoryItem: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [productData, setProductData] = useState([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [showModal, setShowModal] = useState(false)

	const [isEditMode, setIsEditMode] = useState(false)
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState<{ name: string; max_stock: string; unit: string }>({
		name: '',
		max_stock: '',
		unit: 'kg',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const currentPage = page || pagination.page
			const response: any = await GetGnRawMaterialProduct({
				page: currentPage,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})

			const data = response.data || []
			if (data.length === 0 && currentPage > 1) {
				handlePageChange(1)
				return
			}

			const activeProducts = response.data || []
			setProductData(activeProducts)

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
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Product ID', field: '_id' },
		{ title: 'Product Name', field: 'name' },
		{ title: 'Max Stock', field: 'max_stock' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const openAddModal = () => {
		setIsEditMode(false)
		setSelectedItemId(null)
		setFormData({ name: '', max_stock: '0', unit: '' })
		setShowModal(true)
	}

	const openEditModal = (product: any) => {
		setIsEditMode(true)
		setSelectedItemId(product._id)
		setFormData({
			name: product.name || '',
			max_stock: String(product.max_stock || 0),
			unit: product.unit,
		})
		setShowModal(true)
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

	const handleFormInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleAddItem = async () => {
		try {
			setIsSubmitting(true)

			if (isEditMode && selectedItemId) {
				const payload: any = {
					id: selectedItemId,
					name: formData.name,
					max_stock: Number(formData.max_stock),
					unit: formData.unit,
				}

				await UpdateGnRawMaterialProduct(payload)
				toast.success('Item updated successfully')
			} else {
				const payload: any = {
					name: formData.name,
					max_stock: Number(formData.max_stock),
					unit: formData.unit,
				}

				await CreateGnRawMaterialProduct(payload)
				toast.success('Item added successfully')
			}

			setFormData({ name: '', max_stock: '0', unit: '' })
			setSelectedItemId(null)
			setShowModal(false)
			fetchData()
		} catch (error: any) {
			console.error(error)
			toast.error(error.message || 'Failed to add item')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleRemoveItem = async (id: string) => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: "You won't be able to revert this!",
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes, delete it!',
			})

			if (result.isConfirmed) {
				setIsSubmitting(true)
				await RemoveGnRawMaterialProduct(id)
				Swal.fire('Deleted!', 'Item has been removed.', 'success')
				fetchData()
			}
		} catch (error: any) {
			console.error(error)
			toast.error(error.message || 'Failed to remove item')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Inventory Item</PageTitle>
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
							onClick={openAddModal}
							text='Add Product'
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

										<td
											onClick={() => handleCopy(product._id)}
											onKeyPress={(event) => handleKeyPress(event, product._id)}
											role='button'
											tabIndex={0}>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<div className='d-flex'>
													<FontAwesomeIcon
														icon={faCopy}
														className='fs-2 me-2 text-success'
													/>
													{product._id}
												</div>
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{product.name}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{product.max_stock || 0} {product.unit || ''}
											</span>
										</td>

										<td>
											<div className='d-flex'>
												<TableButton
													action='edit'
													onClick={() => openEditModal(product)}
												/>
												<TableButton
													action='remove'
													onClick={() => handleRemoveItem(product._id)}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong> {product.book_title}
													<br />
													<strong>{sortableFields[2].title}: </strong> ₹ {product.amount}
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
			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>{isEditMode ? 'Edit' : 'Add'} Inventory Item</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body'>
						<div className=''>
							<InputField
								placeholder='Enter Item Name'
								type='text'
								className='fv-row mb-3'
								name='name'
								label='Item Name'
								htmlFor='name'
								value={formData.name}
								onChange={handleFormInputChange}
							/>
							<div className='fv-row mb-3'>
								<label
									htmlFor='max_stock'
									className='fw-bold fs-6 mb-2'>
									Max Stock
								</label>
								<div className='input-group'>
									<input
										type='number'
										name='max_stock'
										className='form-control inputfield-bg'
										placeholder='Enter Max Stock'
										value={formData.max_stock}
										onChange={(e) => {
											if (parseFloat(e.target.value) < 0) return
											handleFormInputChange(e)
										}}
										min={0}
									/>
									<select
										name='unit'
										className='form-select inputfield-bg'
										style={{ width: '140px', flex: 'none' }}
										value={formData.unit}
										onChange={handleFormInputChange}>
										<option value=''>Select Unit</option>
										<option value='kg'>kg</option>
										<option value='ltr'>ltr</option>
										<option value='pcs'>pcs</option>
									</select>
								</div>
							</div>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action={isEditMode ? 'edit' : 'add'}
							onClick={handleAddItem}
							text={
								isSubmitting
									? isEditMode
										? 'Please wait, Updating Item...'
										: 'Please wait, Adding Item...'
									: isEditMode
									? 'Edit Item'
									: 'Add Item'
							}
							showIcon={false}
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default GNInventoryItem
