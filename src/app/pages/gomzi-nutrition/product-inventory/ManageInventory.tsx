import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
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

	const handleUpdateStock = async () => {
		try {
			await UpdateSingleProductStock({
				product_id: updateData.product_id,
				variant_id: updateData.variant_id,
				stock: Number(updateData.stock),
				isAvailable: updateData.isAvailable,
			})

			toast.success('Stock Updated Successfully')

			setShowUpdateModal(false)

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
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
		sessionStorage.setItem('currentPage', page.toString())
	}
	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
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

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchInventory()
		}
	}, [searchTerm])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Inventory Management</PageTitle>

			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='card-branch_code d-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<LengthMenu
								expenseData={inventoryData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<select
							name='Select status'
							className='form-select'
							value={selectedStockStatus}
							onChange={(e) => setSelectedStockStatus(e.target.value)}>
							<option value=''>Select Stock Status</option>
							<option value='IN_STOCK'>In Stock</option>
							<option value='LOW_STOCK'>Low Stock</option>
							<option value='OUT_OF_STOCK'>Out of Stock</option>
						</select>
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
													item.stock === 0
														? 'badge-light-danger'
														: item.stock <= 10
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
				onHide={() => setShowUpdateModal(false)}>
				<div className='modal-content'>
					<div className='modal-header'>
						<h3>Update Stock</h3>
					</div>

					<div className='modal-body'>
						<InputField
							htmlFor='Product'
							name='product_name'
							type='text'
							label='Product'
							value={updateData.product_name}
							readOnly
						/>

						<InputField
							type='text'
							name='variant_name'
							htmlFor='variant_name'
							label='Variant'
							value={updateData.variant_name || 'Base Product'}
							readOnly
						/>

						<InputField
							htmlFor='stock'
							label='Stock'
							type='number'
							name='stock'
							value={updateData.stock}
							onChange={(e) =>
								setUpdateData({
									...updateData,
									stock: e.target.value,
								})
							}
						/>

						<div className='mt-4'>
							<label>Availability</label>

							<div className='d-flex gap-5'>
								<label>
									<input
										type='radio'
										checked={updateData.isAvailable === true}
										onChange={() =>
											setUpdateData({
												...updateData,
												isAvailable: true,
											})
										}
									/>
									Available
								</label>

								<label>
									<input
										type='radio'
										checked={updateData.isAvailable === false}
										onChange={() =>
											setUpdateData({
												...updateData,
												isAvailable: false,
											})
										}
									/>
									Out Of Stock
								</label>
							</div>
						</div>
					</div>

					<div className='modal-footer'>
						<TableButton
							action='edit'
							text='Update Stock'
							onClick={handleUpdateStock}
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default ManageInventory
