import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import DownloadExcelButton from '../../../../components/DownloadExcelButton'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import {
	GetGnRawMaterialProduct,
	GetGnRawMaterialSupplier,
	GetGnRawMaterialSupplierInvoice,
	RemoveGnRawMaterialSupplierInvoice,
} from '../../../../Functions/FGGroup'

const GomziNutritionMaterialSuppliersInvoiceList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [supplierData, setSupplierData] = useState<any[]>([])
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
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const fetchData = useCallback(
		async (page?: number) => {
			setLoading(true)
			try {
				const queryPayload: any = {
					page: page || pagination.page,
					limit: pagination.itemsPerPage,
					supplier_name: searchTerm,
					sort,
					sortOrder,
				}

				if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
					const fromDateStr = DayJS(selectedDateRange[0]).format('YYYY-MM-DD')
					const toDateStr = DayJS(selectedDateRange[1]).format('YYYY-MM-DD')
					queryPayload.from_date = fromDateStr
					queryPayload.to_date = toDateStr
					queryPayload.startDate = fromDateStr
					queryPayload.endDate = toDateStr
				}

				const response: any = await GetGnRawMaterialSupplierInvoice(queryPayload)

				// Extract invoices from response.data.invoices and unwrap _doc
				let invoicesRaw: any[] = []
				if (Array.isArray(response?.data?.invoices)) {
					invoicesRaw = response.data.invoices.map((inv: any) => inv._doc || inv)
				} else if (Array.isArray(response?.data)) {
					invoicesRaw = response.data.map((inv: any) => inv._doc || inv)
				} else if (Array.isArray(response)) {
					invoicesRaw = response
				} else {
					invoicesRaw = []
				}

				let activeInvoices = invoicesRaw

				// Extract supplier IDs before mapping
				const supplierIds = activeInvoices
					.map((inv: any) => inv.supplier_id)
					.filter((id: any) => id)
				const uniqueSupplierIds = Array.from(new Set(supplierIds))

				// Extract product IDs before mapping
				const productIds = activeInvoices
					.flatMap((inv: any) => (inv.items || []).map((item: any) => item.product_id))
					.filter((id: any) => id)
				const uniqueProductIds = Array.from(new Set(productIds))

				// Format with date
				activeInvoices = activeInvoices.map((inv: any) => ({
					...inv,
					date: new Date(inv.issue_date || inv.createdAt || inv.updatedAt || Date.now()).toLocaleDateString('en-IN'),
				}))

				// Apply date range filter client-side as well to guarantee consistency
				if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
					const startTime = new Date(selectedDateRange[0]).setHours(0, 0, 0, 0)
					const endTime = new Date(selectedDateRange[1]).setHours(23, 59, 59, 999)
					activeInvoices = activeInvoices.filter((inv: any) => {
						const dateVal = inv.issue_date || inv.createdAt
						if (!dateVal) return true
						const invoiceTime = new Date(dateVal).getTime()
						return invoiceTime >= startTime && invoiceTime <= endTime
					})
				}

				if (uniqueSupplierIds.length > 0) {
					try {
						const supplierResp: any = await GetGnRawMaterialSupplier({ limit: 1000 })
						const suppliersArray = (supplierResp?.data || []).map((sup: any) => sup._doc || sup)
						const supplierMap = new Map()

						suppliersArray.forEach((sup: any) => {
							if (sup && sup._id && sup.name) {
								supplierMap.set(sup._id, sup.name)
							}
						})

						activeInvoices = activeInvoices.map((inv: any) => ({
							...inv,
							supplier_name: supplierMap.get(inv.supplier_id) || inv.supplier_id,
						}))
					} catch (err) {
						console.warn('Failed to fetch suppliers:', err)
					}
				}

				// Fetch product names and enrich items
				if (uniqueProductIds.length > 0) {
					try {
						const productResp: any = await GetGnRawMaterialProduct({ limit: 1000 })
						const productsArray = (productResp?.data || []).map((prod: any) => prod._doc || prod)
						const productMap = new Map()

						productsArray.forEach((prod: any) => {
							if (prod && prod._id && prod.name) {
								productMap.set(prod._id, prod.name)
							}
						})

						activeInvoices = activeInvoices.map((inv: any) => ({
							...inv,
							items: (inv.items || []).map((item: any) => ({
								...item,
								product_name: productMap.get(item.product_id) || item.product_id,
							})),
						}))
					} catch (err) {
						console.warn('Failed to fetch products:', err)
					}
				}

				setSupplierData(activeInvoices)
				setMetaData(
					response?.data?.pagination || {
						page: 1,
						totalPages: Math.ceil(activeInvoices.length / pagination.itemsPerPage),
						totalItems: activeInvoices.length,
					}
				)
			} catch (error: any) {
				toast.error('Failed to load invoices')
				setSupplierData([])
				setMetaData({
					page: 1,
					totalPages: 1,
					totalItems: 0,
				})
			}
			setLoading(false)
		},
		[pagination.page, pagination.itemsPerPage, searchTerm, sort, sortOrder, selectedDateRange]
	)

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, selectedDateRange])

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
		{ title: 'Supplier Name', field: 'name' },
		{ title: 'Items', field: 'items' },
		{ title: 'Rate', field: 'rate' },
		{ title: 'Total Amount', field: 'total_amount' },
		{ title: 'Date', field: 'createdAt' },
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

	const handleRemoveItem = async (invoice_id: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
		})

		if (result.isConfirmed) {
			try {
				setIsSubmitting(true)
				await RemoveGnRawMaterialSupplierInvoice(invoice_id)
				toast.success('Invoice removed successfully')
				fetchData()
			} catch (error: any) {
				toast.error(error.message || 'Failed to remove invoice')
			} finally {
				setIsSubmitting(false)
			}
		}
	}

	const downloadExcel = async () => {
		setLoading(true)
		try {
			let exportData = supplierData
			try {
				const queryPayload: any = {
					limit: 5000,
					supplier_name: searchTerm,
					sort,
					sortOrder,
				}
				if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
					const fromDateStr = DayJS(selectedDateRange[0]).format('YYYY-MM-DD')
					const toDateStr = DayJS(selectedDateRange[1]).format('YYYY-MM-DD')
					queryPayload.from_date = fromDateStr
					queryPayload.to_date = toDateStr
					queryPayload.startDate = fromDateStr
					queryPayload.endDate = toDateStr
				}
				const allResp: any = await GetGnRawMaterialSupplierInvoice(queryPayload)

				let raw: any[] = []
				if (Array.isArray(allResp?.data?.invoices)) {
					raw = allResp.data.invoices.map((inv: any) => inv._doc || inv)
				} else if (Array.isArray(allResp?.data)) {
					raw = allResp.data.map((inv: any) => inv._doc || inv)
				}

				if (raw.length > 0) {
					if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
						const startTime = new Date(selectedDateRange[0]).setHours(0, 0, 0, 0)
						const endTime = new Date(selectedDateRange[1]).setHours(23, 59, 59, 999)
						raw = raw.filter((inv: any) => {
							const d = inv.issue_date || inv.createdAt
							if (!d) return true
							const t = new Date(d).getTime()
							return t >= startTime && t <= endTime
						})
					}
					exportData = raw
				}
			} catch (e) {
				console.warn('Fallback to current page invoice data', e)
			}

			if (exportData.length === 0) {
				toast.error('No invoice data to export')
				return
			}

			const worksheetData = exportData.map((inv: any, index: number) => {
				const itemsStr = (inv.items || [])
					.map((item: any) => {
						const pName = item.product_name || item.product_id
						const weight =
							item.weight_type?.toLowerCase().includes('kg') ||
							item.weight_type?.toLowerCase().includes('ltr')
								? item.weight / 1000
								: item.weight
						return `${pName} (${weight} ${item.weight_type || ''}) @ ₹${item.rate || 0}`
					})
					.join('; ')

				return {
					'Sr No': index + 1,
					'Invoice ID': inv._id || '',
					'Supplier Name': inv.supplier_name || inv.supplier_id || '',
					'Items': itemsStr,
					'Delivery Charges (₹)': inv.charges || 0,
					'Total Amount (₹)': inv.total_amount || 0,
					'Date': inv.date || (inv.issue_date || inv.createdAt ? new Date(inv.issue_date || inv.createdAt).toLocaleDateString('en-IN') : ''),
				}
			})

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
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Supplier Invoices')
			XLSX.writeFile(workbook, `Supplier_Invoices_${DayJS().format('YYYY-MM-DD')}.xlsx`)
			toast.success(`${exportData.length} invoices exported successfully`)
		} catch (error: any) {
			console.error('Export error:', error)
			toast.error('Failed to export invoice data')
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Gomzi Nutrition Suppliers Invoice List</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex align-items-center justify-content-between flex-nowrap w-100 gap-3'>
						{/* Left: Filters & Search */}
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
								<DownloadExcelButton onClick={downloadExcel} />
							</div>

							<div className='d-flex align-items-center flex-shrink-0'>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
								/>
							</div>
						</div>

						{/* Right: Add Suppliers Invoice Button pinned to end */}
						<div className='flex-shrink-0 ms-auto'>
							<TableButton
								action='add'
								to='/rag/inventory/suppliers/invoice/add'
								text='Add Suppliers Invoice'
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
							renderRow={(invoice: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={invoice._id}>
									<tr
										onClick={() => handleRowClick(invoice._id)}
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
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{invoice.supplier_name || invoice.supplier_id}
											</span>
										</td>
										<td>
											{invoice.items && invoice.items.length > 0 && (
												<ul className='mb-0 ps-4'>
													{invoice.items.map((item: any, idx: number) => (
														<li
															key={idx}
															className='text-dark fw-bold mb-1 fs-6'>
															{item.product_name || item.product_id} -{' '}
															{item.weight_type?.toLowerCase().includes('kg') ||
															item.weight_type?.toLowerCase().includes('ltr')
																? item.weight / 1000
																: item.weight}{' '}
															{item.weight_type}
														</li>
													))}
												</ul>
											)}
										</td>
										<td>
											{invoice.items && invoice.items.length > 0 && (
												<ul className='mb-0 ps-4'>
													{invoice.items.map((item: any, idx: number) => (
														<li
															key={idx}
															className='text-dark fw-bold mb-1 fs-6'>
															₹{item.rate} (GST {item.gst}%)
														</li>
													))}
												</ul>
											)}
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												₹{invoice.total_amount}
											</span>
											<div className='text-muted fs-7'>Charges: ₹{invoice.charges}</div>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{new Date(invoice.createdAt).toLocaleDateString('en-CA')}
											</span>
										</td>
										<td>
											<div className='d-flex'>
												<TableButton
													action='view'
													to={`/rag/inventory/suppliers/invoice/view?invoice_id=${invoice._id}`}
												/>
												<TableButton
													action='edit'
													to={`/rag/inventory/suppliers/invoice/edit?invoice_id=${invoice._id}`}
												/>
												<TableButton
													action='remove'
													onClick={() => handleRemoveItem(invoice._id)}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[1].title} List:</strong>
													{invoice.items && invoice.items.length > 0 && (
														<ul className='mb-0 ps-4'>
															{invoice.items.map((item: any, idx: number) => (
																<li
																	key={idx}
																	className='fs-7'>
																	{item.product_name || item.product_id} -{' '}
																	{item.weight_type?.toLowerCase().includes('kg') ||
																	item.weight_type?.toLowerCase().includes('ltr')
																		? item.weight / 1000
																		: item.weight}{' '}
																	{item.weight_type} - ₹{item.rate} (GST {item.gst}%)
																</li>
															))}
														</ul>
													)}
													<br />
													<strong>{sortableFields[2].title}: </strong> ₹{invoice.total_amount}
													<span className='fs-7 text-muted'>(Charges: ₹{invoice.charges})</span>
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
							totalRecords={metaData?.totalDocs ?? metaData?.totalRecords ?? metaData?.totalCount ?? supplierData.length}
							itemsPerPage={pagination.itemsPerPage}
							entityName='invoices'
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default GomziNutritionMaterialSuppliersInvoiceList
