import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowRight,
	faBoxes,
	faBuilding,
	faCheck,
	faClock,
	faEnvelope,
	faExclamationTriangle,
	faEye,
	faIndustry,
	faPhone,
	faReceipt,
	faWarehouse,
} from '@fortawesome/free-solid-svg-icons'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetGnStock } from '../../../Functions/FGGroup'
import { GetGnClient } from '../../../Functions/FGGroup/GnClients'

interface QuickFeature {
	id: string
	title: string
	description: string
	iconFa: any
}

interface ClientProcess {
	id: string
	clientName: string
	email: string
	phone: string
	invoiceNo?: string
	commonId?: string
	nutritionTable: { completed: boolean; date?: string }
	label: { completed: boolean; date?: string; skipped?: boolean }
	procurement: { completed: boolean; date?: string }
	production: { completed: boolean; date?: string }
	labReport: { completed: boolean; date?: string; skipped?: boolean }
	dispatch: { completed: boolean; date?: string }
}

interface StockItem {
	_id: string
	item_name: string
	stock: number
	max_stock: number
	unit: string
}

const quickFeatures: QuickFeature[] = [
	{
		id: 'item',
		title: 'Item',
		description: 'Manage product items & raw materials',
		iconFa: faBoxes,
	},
	{
		id: 'supplier',
		title: 'Supplier',
		description: 'Supplier records & active vendor contacts',
		iconFa: faBuilding,
	},
	{
		id: 'stock',
		title: 'Stock',
		description: 'Stock availability, movements & thresholds',
		iconFa: faWarehouse,
	},
	{
		id: 'purchase',
		title: 'Purchase Billing',
		description: 'Supplier invoices, charges & bill receipts',
		iconFa: faReceipt,
	},
]

const Inventory: React.FC = () => {
	const navigate = useNavigate()
	const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [searchTerm, setSearchTerm] = useState('')
	const [clientProcesses, setClientProcesses] = useState<ClientProcess[]>([])
	const [isLoadingClients, setIsLoadingClients] = useState(false)
	const [totalPages, setTotalPages] = useState(1)
	const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)

	const fetchClients = useCallback(async () => {
		setIsLoadingClients(true)
		try {
			const response: any = await GetGnClient({
				status: true,
				page: pagination.page,
				limit: pagination.itemsPerPage,
				sort: 'createdAt',
				sortOrder: 'desc',
				search: searchTerm,
				...(dateRange
					? {
							start_date: dateRange[0].toISOString(),
							end_date: dateRange[1].toISOString(),
					  }
					: {}),
			})

			if (response?.data && Array.isArray(response.data)) {
				const mappedClients: ClientProcess[] = response.data.map((client: any) => ({
					id: client._id || client.common_id,
					commonId: client.common_id,
					clientName: client.name || 'N/A',
					email: client.email || 'N/A',
					phone: client.mobile || 'N/A',
					invoiceNo: client.invoice_number ? `INV-${client.invoice_number}` : 'N/A',

					nutritionTable: {
						completed: client.production_process?.formulation?.status === 'done',
						date: client.production_process?.formulation?.completed_date
							? new Date(client.production_process.formulation.completed_date).toISOString()
							: undefined,
					},

					label: {
						completed: client.production_process?.label_sticker?.status === 'done',
						skipped: client.production_process?.label_sticker?.status === 'skipped',
						date: client.production_process?.label_sticker?.completed_date
							? new Date(client.production_process.label_sticker.completed_date).toISOString()
							: undefined,
					},

					procurement: {
						completed: client.production_process?.procurement?.status === 'done',
						date: client.production_process?.procurement?.completed_date
							? new Date(client.production_process.procurement.completed_date).toISOString()
							: undefined,
					},

					production: {
						completed: client.production_process?.production?.status === 'done',
						date: client.production_process?.production?.completed_date
							? new Date(client.production_process.production.completed_date).toISOString()
							: undefined,
					},

					labReport: {
						completed: client.production_process?.lab_report?.status === 'done',
						skipped: client.production_process?.lab_report?.status === 'skipped',
						date: client.production_process?.lab_report?.completed_date
							? new Date(client.production_process.lab_report.completed_date).toISOString()
							: undefined,
					},

					dispatch: {
						completed: client.production_process?.dispatch?.status === 'done',
						date: client.production_process?.dispatch?.completed_date
							? new Date(client.production_process.dispatch.completed_date).toISOString()
							: undefined,
					},
				}))

				setClientProcesses(mappedClients)

				if (response?.metadata && typeof response.metadata === 'object') {
					const metadata = response.metadata as any
					if (metadata.pagination?.totalPages) {
						setTotalPages(metadata.pagination.totalPages)
					} else {
						setTotalPages(1)
					}
				} else {
					setTotalPages(1)
				}
			} else {
				setClientProcesses([])
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch clients')
			setClientProcesses([])
		} finally {
			setIsLoadingClients(false)
		}
	}, [pagination.page, pagination.itemsPerPage, searchTerm, dateRange])

	useEffect(() => {
		fetchClients()
	}, [fetchClients])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	const fetchLowStockItems = async () => {
		try {
			const response: any = await GetGnStock({ limit: 100 })
			if (response?.data && Array.isArray(response.data)) {
				const lowStock = response.data
					.filter((item: any) => item.max_stock > 0 && item.stock < item.max_stock)
					.map((item: any) => ({
						_id: item._id,
						item_name: item.item_name,
						stock: item.stock,
						max_stock: item.max_stock,
						unit: item.unit,
					}))
				setLowStockItems(lowStock)
			}
		} catch (error) {
			console.error('Error fetching low stock:', error)
		}
	}

	useEffect(() => {
		fetchLowStockItems()
	}, [])

	const handleCardClick = (title: string) => {
		if (title === 'Item') navigate('/rag/inventory/item/list')
		if (title === 'Supplier') navigate('/rag/inventory/suppliers/list')
		if (title === 'Stock') navigate('/rag/inventory/gn-stock/list')
		if (title === 'Purchase Billing') navigate('/rag/inventory/suppliers/invoice/list')
	}

	const handleViewDetails = (client: ClientProcess) => {
		const clientId = client.id
		navigate(`/rag/inventory/view/list?clientId=${clientId}`)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const getStockAlertSeverity = (stock: number, maxStock: number) => {
		const percentage = (stock / maxStock) * 100
		if (percentage < 50) {
			return {
				text: 'Critical',
				color: '#dc2626',
				bg: '#fee2e2',
			}
		} else if (percentage < 100) {
			return {
				text: 'Low',
				color: '#d97706',
				bg: '#fef3c7',
			}
		}
		return null
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Inventory</PageTitle>

			<div className='d-flex flex-column gap-6 pb-8'>
				{/* 1. Low Stock Alert Banner (conditionally displayed if items are low) */}
				{lowStockItems.length > 0 && (
					<div
						className='p-6 rounded-3'
						style={{
							backgroundColor: '#FEF2F2',
							border: '1px solid #FECACA',
							borderRadius: '12px',
						}}>
						<div className='d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4'>
							<div className='d-flex align-items-center gap-3'>
								<div
									className='d-inline-flex align-items-center justify-content-center rounded-3'
									style={{
										width: '42px',
										height: '42px',
										backgroundColor: '#FEE2E2',
										color: '#DC2626',
										flexShrink: 0,
									}}>
									<FontAwesomeIcon icon={faExclamationTriangle} className='fs-3' />
								</div>
								<div>
									<div className='d-flex align-items-center gap-2'>
										<h5 className='fw-bolder text-gray-900 fs-5 m-0'>Low Stock Alert</h5>
										<span className='badge badge-danger fw-bolder fs-8 px-2 py-1'>
											{lowStockItems.length} {lowStockItems.length === 1 ? 'Item' : 'Items'}
										</span>
									</div>
									<span className='text-muted fs-7 mt-1 d-block'>
										The following raw materials are below their minimum threshold and require
										reordering.
									</span>
								</div>
							</div>

							<button
								type='button'
								onClick={() => navigate('/rag/inventory/gn-stock/list')}
								className='btn btn-sm btn-danger fw-bold d-inline-flex align-items-center gap-2'
								style={{ height: '36px', borderRadius: '8px', fontSize: '13px' }}>
								View All Stock Ledger
								<FontAwesomeIcon icon={faArrowRight} />
							</button>
						</div>

						<div className='row g-3'>
							{lowStockItems.slice(0, 6).map((item) => {
								const severity = getStockAlertSeverity(item.stock, item.max_stock)
								const stockPercentage = Math.min((item.stock / item.max_stock) * 100, 100)
								return (
									<div key={item._id} className='col-12 col-md-6 col-lg-4'>
										<div
											className='p-4 bg-white rounded-3 h-100 d-flex flex-column justify-content-between'
											onClick={() => navigate('/rag/inventory/gn-stock/list')}
											style={{
												border: '1px solid #FEE2E2',
												cursor: 'pointer',
												transition: 'transform 0.15s ease, box-shadow 0.15s ease',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.transform = 'translateY(-2px)'
												e.currentTarget.style.boxShadow =
													'0 6px 14px rgba(239, 68, 68, 0.12)'
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.transform = 'none'
												e.currentTarget.style.boxShadow = 'none'
											}}>
											<div className='d-flex justify-content-between align-items-start mb-2'>
												<span
													className='fw-bold text-gray-900 fs-7 text-truncate'
													style={{ maxWidth: '180px' }}
													title={item.item_name}>
													{item.item_name}
												</span>
												<span
													className='badge fw-bold fs-9'
													style={{
														backgroundColor: severity?.bg,
														color: severity?.color,
													}}>
													{severity?.text}
												</span>
											</div>

											<div>
												<div className='d-flex justify-content-between align-items-center text-muted fs-8 mb-1'>
													<span>Available Stock</span>
													<span className='fw-bold' style={{ color: severity?.color }}>
														{item.stock} / {item.max_stock} {item.unit}
													</span>
												</div>
												<div
													className='rounded-pill overflow-hidden'
													style={{ height: '6px', backgroundColor: '#F1F5F9' }}>
													<div
														style={{
															width: `${stockPercentage}%`,
															backgroundColor: severity?.color,
															height: '100%',
															borderRadius: '999px',
														}}
													/>
												</div>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}

				{/* 2. Client Production Process Table (Primary Monitoring Card) */}
				<KTCard className='border-0 shadow-sm' style={{ borderRadius: '12px' }}>
					{/* Card Header & Toolbar */}
					<div className='card-header border-bottom py-5 px-6 px-lg-8 d-flex align-items-center justify-content-between flex-wrap gap-3'>
						<div className='d-flex align-items-center gap-3'>
							<span
								className='d-inline-flex align-items-center justify-content-center rounded-3'
								style={{
									width: '42px',
									height: '42px',
									backgroundColor: '#EEF2F6',
									color: '#1E3A5F',
								}}>
								<FontAwesomeIcon icon={faIndustry} className='fs-3' />
							</span>
							<div>
								<h3 className='card-title fw-bolder text-gray-900 fs-3 m-0'>
									Client Production Process
								</h3>
								<span className='text-muted fs-7 mt-1 d-block'>
									Track real-time workflow across formulation, label, procurement, production, lab
									& dispatch
								</span>
							</div>
						</div>

						{/* Right Toolbar: Search Filter, Date Filter, and Length Menu */}
						<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3'>
							{/* Fixed Search Filter using the standardized project component */}
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								className='me-0'
								style={{ width: '220px' }}
							/>

							{/* Date Filter */}
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0' />

							{/* Entries per page */}
							<LengthMenu
								expenseData={clientProcesses}
								handleItemsPerPageChange={(value) => {
									setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
								}}
								value={pagination.itemsPerPage}
								className='me-0'
							/>
						</div>
					</div>

					{/* Card Body: Table */}
					<div className='card-body p-0'>
						<div className='table-responsive'>
							<table className='table table-row-dashed table-hover align-middle gs-6 gy-4 mb-0'>
								<thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
									<tr className='fw-bolder text-gray-700 text-uppercase fs-8'>
										<th style={{ width: '130px' }} className='ps-6'>
											Invoice No.
										</th>
										<th style={{ width: '220px' }}>Client Details</th>
										<th className='text-center'>Formulation</th>
										<th className='text-center'>Label & Sticker</th>
										<th className='text-center'>Procurement</th>
										<th className='text-center'>Production</th>
										<th className='text-center'>Lab Report</th>
										<th className='text-center'>Dispatch</th>
										<th className='text-end pe-6' style={{ width: '130px' }}>
											Action
										</th>
									</tr>
								</thead>
								<tbody>
									{isLoadingClients ? (
										<tr>
											<td colSpan={9} className='text-center py-12'>
												<div
													className='spinner-border text-primary'
													role='status'
													style={{ width: '2.5rem', height: '2.5rem' }}>
													<span className='visually-hidden'>Loading...</span>
												</div>
												<span className='text-muted fs-7 d-block mt-3'>
													Loading production processes...
												</span>
											</td>
										</tr>
									) : clientProcesses.length > 0 ? (
										clientProcesses.map((client) => {
											return (
												<tr key={client.id}>
													<td className='ps-6'>
														<span className='fw-bold text-gray-900 fs-7 font-monospace'>
															{client.invoiceNo}
														</span>
													</td>

													<td>
														<div className='d-flex flex-column'>
															<span
																className='fw-bolder text-gray-900 fs-7 mb-1'
																title={client.clientName}>
																{client.clientName}
															</span>
															<div className='d-flex align-items-center gap-2 text-muted fs-8'>
																<FontAwesomeIcon
																	icon={faPhone}
																	className='fs-9 text-gray-400'
																/>
																<span>{client.phone}</span>
															</div>
															<div
																className='d-flex align-items-center gap-2 text-muted fs-8 text-truncate'
																style={{ maxWidth: '200px' }}
																title={client.email}>
																<FontAwesomeIcon
																	icon={faEnvelope}
																	className='fs-9 text-gray-400'
																/>
																<span className='text-truncate'>{client.email}</span>
															</div>
														</div>
													</td>

													{/* 1. Formulation */}
													<td className='text-center'>
														{client.nutritionTable.completed ? (
															<span className='badge badge-light-success fw-bold fs-8 px-3 py-1 d-inline-flex align-items-center gap-1'>
																<FontAwesomeIcon icon={faCheck} className='fs-9' />
																Done
															</span>
														) : (
															<span className='badge badge-light-warning fw-semibold fs-8 px-3 py-1'>
																Pending
															</span>
														)}
														{client.nutritionTable.date && (
															<div className='text-muted fs-9 mt-1'>
																{new Date(client.nutritionTable.date).toLocaleDateString(
																	'en-IN',
																	{ day: '2-digit', month: 'short' }
																)}
															</div>
														)}
													</td>

													{/* 2. Label & Sticker */}
													<td className='text-center'>
														{client.label.skipped ? (
															<span className='badge badge-light-secondary fw-semibold fs-8 px-3 py-1 text-muted'>
																Skipped
															</span>
														) : client.label.completed ? (
															<span className='badge badge-light-success fw-bold fs-8 px-3 py-1 d-inline-flex align-items-center gap-1'>
																<FontAwesomeIcon icon={faCheck} className='fs-9' />
																Done
															</span>
														) : (
															<span
																className='badge badge-light-warning fw-semibold fs-8 px-3 py-1'
																style={{
																	opacity: !client.nutritionTable.completed ? 0.5 : 1,
																}}>
																Pending
															</span>
														)}
														{client.label.date && (
															<div className='text-muted fs-9 mt-1'>
																{new Date(client.label.date).toLocaleDateString('en-IN', {
																	day: '2-digit',
																	month: 'short',
																})}
															</div>
														)}
													</td>

													{/* 3. Procurement */}
													<td className='text-center'>
														{client.procurement.completed ? (
															<span className='badge badge-light-success fw-bold fs-8 px-3 py-1 d-inline-flex align-items-center gap-1'>
																<FontAwesomeIcon icon={faCheck} className='fs-9' />
																Done
															</span>
														) : (
															<span
																className='badge badge-light-warning fw-semibold fs-8 px-3 py-1'
																style={{
																	opacity: !client.nutritionTable.completed ? 0.5 : 1,
																}}>
																Pending
															</span>
														)}
														{client.procurement.date && (
															<div className='text-muted fs-9 mt-1'>
																{new Date(client.procurement.date).toLocaleDateString(
																	'en-IN',
																	{ day: '2-digit', month: 'short' }
																)}
															</div>
														)}
													</td>

													{/* 4. Production */}
													<td className='text-center'>
														{client.production.completed ? (
															<span className='badge badge-light-success fw-bold fs-8 px-3 py-1 d-inline-flex align-items-center gap-1'>
																<FontAwesomeIcon icon={faCheck} className='fs-9' />
																Done
															</span>
														) : (
															<span
																className='badge badge-light-warning fw-semibold fs-8 px-3 py-1'
																style={{
																	opacity:
																		!client.nutritionTable.completed ||
																		(!client.label.skipped && !client.label.completed)
																			? 0.5
																			: 1,
																}}>
																Pending
															</span>
														)}
														{client.production.date && (
															<div className='text-muted fs-9 mt-1'>
																{new Date(client.production.date).toLocaleDateString('en-IN', {
																	day: '2-digit',
																	month: 'short',
																})}
															</div>
														)}
													</td>

													{/* 5. Lab Report */}
													<td className='text-center'>
														{client.labReport.skipped ? (
															<span className='badge badge-light-secondary fw-semibold fs-8 px-3 py-1 text-muted'>
																Skipped
															</span>
														) : client.labReport.completed ? (
															<span className='badge badge-light-success fw-bold fs-8 px-3 py-1 d-inline-flex align-items-center gap-1'>
																<FontAwesomeIcon icon={faCheck} className='fs-9' />
																Done
															</span>
														) : (
															<span
																className='badge badge-light-warning fw-semibold fs-8 px-3 py-1'
																style={{
																	opacity: !client.production.completed ? 0.5 : 1,
																}}>
																Pending
															</span>
														)}
														{client.labReport.date && (
															<div className='text-muted fs-9 mt-1'>
																{new Date(client.labReport.date).toLocaleDateString('en-IN', {
																	day: '2-digit',
																	month: 'short',
																})}
															</div>
														)}
													</td>

													{/* 6. Dispatch */}
													<td className='text-center'>
														{client.dispatch.completed ? (
															<span className='badge badge-light-success fw-bold fs-8 px-3 py-1 d-inline-flex align-items-center gap-1'>
																<FontAwesomeIcon icon={faCheck} className='fs-9' />
																Done
															</span>
														) : (
															<span
																className='badge badge-light-warning fw-semibold fs-8 px-3 py-1'
																style={{
																	opacity:
																		!client.labReport.completed && !client.labReport.skipped
																			? 0.5
																			: 1,
																}}>
																Pending
															</span>
														)}
														{client.dispatch.date && (
															<div className='text-muted fs-9 mt-1'>
																{new Date(client.dispatch.date).toLocaleDateString('en-IN', {
																	day: '2-digit',
																	month: 'short',
																})}
															</div>
														)}
													</td>

													{/* Action Button */}
													<td className='text-end pe-6'>
														<button
															type='button'
															onClick={() => handleViewDetails(client)}
															className='btn btn-sm btn-light-primary fw-bold d-inline-flex align-items-center gap-2'
															style={{
																height: '34px',
																borderRadius: '8px',
																fontSize: '12px',
															}}>
															<FontAwesomeIcon icon={faEye} />
															View Details
														</button>
													</td>
												</tr>
											)
										})
									) : (
										<tr>
											<td colSpan={9} className='text-center py-12'>
												<div className='d-flex flex-column align-items-center justify-content-center'>
													<div
														className='mb-3 d-flex align-items-center justify-content-center rounded-circle'
														style={{
															width: '52px',
															height: '52px',
															backgroundColor: '#F8FAFC',
															border: '1px dashed #CBD5E1',
														}}>
														<FontAwesomeIcon
															icon={faIndustry}
															className='text-muted fs-4'
														/>
													</div>
													<span className='text-gray-800 fw-bold fs-6'>
														No Active Production Processes Found
													</span>
													<span className='text-muted fs-8 mt-1'>
														Try adjusting your search criteria or date filter
													</span>
												</div>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination Footer */}
						{clientProcesses.length > 0 && (
							<div className='py-4 px-6 border-top' style={{ borderColor: '#E2E8F0' }}>
								<UsersListPagination
									totalPages={totalPages}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							</div>
						)}
					</div>
				</KTCard>

				{/* 3. Inventory Quick Feature Access Cards */}
				<div>
					<div className='mb-4'>
						<h4 className='fw-bolder text-gray-900 fs-5 m-0'>Inventory Quick Modules</h4>
						<span className='text-muted fs-7'>
							Direct access to core inventory master records and ledger operations
						</span>
					</div>

					<div className='row g-4'>
						{quickFeatures.map((feature) => (
							<div key={feature.id} className='col-12 col-sm-6 col-xl-3'>
								<div
									onClick={() => handleCardClick(feature.title)}
									className='p-6 bg-white rounded-3 h-100 d-flex flex-column justify-content-between'
									style={{
										border: '1px solid #E2E8F0',
										borderRadius: '12px',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
										boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.transform = 'translateY(-3px)'
										e.currentTarget.style.borderColor = '#1E3A5F'
										e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(30, 58, 95, 0.1)'
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = 'none'
										e.currentTarget.style.borderColor = '#E2E8F0'
										e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
									}}>
									<div>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-3 mb-4'
											style={{
												width: '44px',
												height: '44px',
												backgroundColor: '#EEF2F6',
												color: '#1E3A5F',
											}}>
											<FontAwesomeIcon icon={feature.iconFa} className='fs-4' />
										</div>
										<h4 className='fw-bolder text-gray-900 fs-5 mb-1'>{feature.title}</h4>
										<p className='text-muted fs-7 mb-0'>{feature.description}</p>
									</div>

									<div
										className='d-flex align-items-center justify-content-between mt-5 pt-3 border-top'
										style={{ borderColor: '#F1F5F9' }}>
										<span className='text-primary fw-bold fs-8'>Access Module</span>
										<FontAwesomeIcon icon={faArrowRight} className='text-primary fs-8' />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	)
}

export default Inventory
