import {
	faDownload,
	faEnvelope,
	faLocationDot,
	faPhone,
	faPlusCircle,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import {
	GetGnRawMaterialSupplier,
	RemoveGnRawMaterialSupplier,
} from '../../../../Functions/FGGroup'

const GomziNutritionMaterialSuppliersList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [supplierData, setSupplierData] = useState([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetGnRawMaterialSupplier({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			const activeSuppliers = (response.data || []).filter(
				(supplier: any) => supplier.status === true
			)
			setSupplierData(activeSuppliers)

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
		{ title: 'Logo', field: 'logo' },
		{ title: 'Brand Name', field: 'name' },
		{ title: 'Email', field: 'email' },
		{ title: 'Contact No.', field: 'number' },
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

	const openViewModal = (supplier: any) => {
		setSelectedSupplier(supplier)
		setShowModal(true)
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
				await RemoveGnRawMaterialSupplier(id)
				Swal.fire('Deleted!', 'Supplier has been removed.', 'success')
				fetchData()
			}
		} catch (error: any) {
			console.error(error)
			toast.error(error.message || 'Failed to remove supplier')
		} finally {
			setIsSubmitting(false)
		}
	}
	const formatAddress = (address: any) => {
		if (!address) return '-'

		const parts = [
			address.address_line_1,
			address.city,
			address.state,
			address.pin_code,
			address.country,
		].filter(Boolean)

		return parts.join(', ')
	}

	const downloadExcel = async () => {
		setLoading(true)
		try {
			let exportData = supplierData
			try {
				const allResp: any = await GetGnRawMaterialSupplier({
					limit: 5000,
					search: searchTerm,
					sort,
					sortOrder,
				})
				if (allResp?.data && Array.isArray(allResp.data)) {
					const activeAll = allResp.data.filter((s: any) => s.status === true)
					if (activeAll.length > 0) {
						exportData = activeAll
					}
				}
			} catch (e) {
				console.warn('Fallback to current page supplier data', e)
			}

			if (exportData.length === 0) {
				toast.error('No supplier data to export')
				return
			}

			const worksheetData = exportData.map((supplier: any, index: number) => ({
				'Sr No': index + 1,
				'Supplier ID': supplier._id || '',
				'Brand / Supplier Name': supplier.name || '',
				'Email': supplier.email || '',
				'Contact No': supplier.number || '',
				'Address': formatAddress(supplier.address),
				'City': supplier.address?.city || '',
				'State': supplier.address?.state || '',
				'Pin Code': supplier.address?.pin_code || '',
				'Country': supplier.address?.country || '',
				'Status': supplier.status ? 'Active' : 'Inactive',
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
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers')
			XLSX.writeFile(workbook, `Suppliers_${DayJS().format('YYYY-MM-DD')}.xlsx`)
			toast.success(`${exportData.length} suppliers exported successfully`)
		} catch (error: any) {
			console.error('Export error:', error)
			toast.error('Failed to export supplier data')
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Gomzi Nutrition Suppliers List</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex align-items-center justify-content-between flex-nowrap w-100 gap-3'>
						{/* Left: Filter Controls */}
						<div
							className='d-flex align-items-center flex-nowrap overflow-auto gap-2 gap-md-3 py-1'
							style={{ scrollbarWidth: 'thin' }}>
							<div>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
									className='me-0'
								/>
							</div>
							<div>
								<LengthMenu
									expenseData={supplierData}
									handleItemsPerPageChange={handleItemsPerPageChange}
									value={pagination.itemsPerPage}
									className='me-0'
								/>
							</div>
							<div>
								<button
									type='button'
									className='btn btn-primary d-flex align-items-center justify-content-center'
									onClick={downloadExcel}
									disabled={loading || supplierData.length === 0}
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
						</div>

						{/* Right: Add Supplier Button pinned to end */}
						<div className='flex-shrink-0 ms-auto'>
							<TableButton
								action='add'
								to='/rag/inventory/suppliers/add'
								text='Add Supplier'
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={supplierData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(
								supplier: any,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => (
								<React.Fragment key={supplier._id}>
									<tr
										onClick={() => handleRowClick(supplier._id)}
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
													src={`https://files.fggroup.in/` + supplier.logo}
													alt={supplier.name}
													style={{ width: '80px', height: '80px', borderRadius: '3px' }}
												/>
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{supplier.name}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{supplier.email}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{supplier.number}
											</span>
										</td>
										<td>
											<div className='d-flex'>
												<TableButton
													action='view'
													onClick={() => openViewModal(supplier)}
												/>
												<TableButton
													action='edit'
													to={'/rag/inventory/suppliers/edit?supplier_id=' + supplier._id}
												/>
												<TableButton
													action='remove'
													onClick={() => handleRemoveItem(supplier._id)}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[1].title}: </strong> {supplier.name}
													<br />
													<strong>{sortableFields[2].title}: </strong> {supplier.email}
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
					{supplierData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{supplierData.length > 0 && (
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
				<div className='modal-content shadow-lg border-0 rounded-3 overflow-hidden'>
					<div className='modal-header justify-content-between border-0 pb-0 px-4 pt-4'>
						<h2 className='fw-bolder fs-2 mb-0'>Supplier Details</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body pt-0 px-0 pb-4'>
						{selectedSupplier && (
							<div>
								<div className='px-4 pt-4 pb-5'>
									<div className='d-flex align-items-center'>
										<div className='me-4 position-relative'>
											<div className=' overflow-hidden shadow-sm'>
												<img
													src={`https://files.fggroup.in/` + selectedSupplier.logo}
													alt={selectedSupplier.name}
													style={{ width: '80px', height: '80px', objectFit: 'cover' }}
												/>
											</div>
										</div>
										<div>
											<h3 className='fw-bold fs-2 mb-1'>{selectedSupplier.name}</h3>
											<p className='text-muted mb-0'>Gomzi Nutrition Supplier</p>
										</div>
									</div>
								</div>
								<div className='px-4 pt-4'>
									<div className='row g-4'>
										<div className='col-md-6'>
											<div className='d-flex align-items-center p-3 rounded-3'>
												<div className='btn btn-icon btn-sm btn-light-primary me-3'>
													<FontAwesomeIcon icon={faEnvelope} />
												</div>
												<div className='d-flex flex-column'>
													<span className='text-muted small'>Email</span>
													<span className='fw-semibold text-dark'>
														{selectedSupplier.email || '-'}
													</span>
												</div>
											</div>
										</div>
										<div className='col-md-6'>
											<div className='d-flex align-items-center p-3 rounded-3'>
												<div className='btn btn-icon btn-sm btn-light-success me-3'>
													<FontAwesomeIcon icon={faPhone} />
												</div>
												<div className='d-flex flex-column'>
													<span className='text-muted small'>Contact No.</span>
													<span className='fw-semibold text-dark'>
														{selectedSupplier.number || '-'}
													</span>
												</div>
											</div>
										</div>
										{selectedSupplier.address && (
											<div className='col-12'>
												<div className='d-flex align-items-center p-3 rounded-3'>
													<div className='btn btn-icon btn-sm btn-light-warning me-3'>
														<FontAwesomeIcon icon={faLocationDot} />
													</div>
													<div className='d-flex flex-column'>
														<span className='text-muted small'>Address</span>
														<span className='fw-semibold text-dark'>
															{formatAddress(selectedSupplier.address)}
														</span>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</Modal>
		</>
	)
}

export default GomziNutritionMaterialSuppliersList
