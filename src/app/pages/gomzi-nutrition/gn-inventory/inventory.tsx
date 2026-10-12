import React, { useCallback, useEffect, useState } from 'react'
import Card from 'react-bootstrap/Card'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import UsersListPagination from '../../../components/TablePagination'
import { GetGnStock } from '../../../Functions/FGGroup'
import { GetGnClient } from '../../../Functions/FGGroup/GnClients'
import './gn-inventory.css'

interface QuickFeature {
	id: string
	title: string
	description: string
	icon: string
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
		description: 'Manage product items',
		icon: 'bi-box-seam',
	},
	{
		id: 'supplier',
		title: 'Supplier',
		description: 'Supplier records',
		icon: 'bi-building',
	},
	{
		id: 'stock',
		title: 'Stock',
		description: 'Stock availability & movement',
		icon: 'bi-bar-chart',
	},
	{
		id: 'purchase',
		title: 'Purchase Billing',
		description: 'Purchase invoices & bills',
		icon: 'bi-receipt',
	},
]

const Inventory: React.FC = () => {
	const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

	const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
	const [showLowStockAlert, setShowLowStockAlert] = useState(true)

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [searchTerm, setSearchTerm] = useState('')

	const [clientProcesses, setClientProcesses] = React.useState<ClientProcess[]>([])
	const [isLoadingClients, setIsLoadingClients] = React.useState(false)
	const [totalPages, setTotalPages] = React.useState(1)
	const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)

	const navigate = useNavigate()

	const fetchClients = useCallback(async () => {
		setIsLoadingClients(true)
		try {
			const response: FGGroupAPIResponse = await GetGnClient({
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
				toast.error('No client data found')
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
	}, [pagination.page, pagination.itemsPerPage, searchTerm, dateRange])

	// Reset to first page when search term changes
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

	//  Stock Alert Severity Helper Function
	const getStockAlertSeverity = (stock: number, maxStock: number) => {
		const percentage = (stock / maxStock) * 100
		if (percentage < 50) {
			return {
				text: 'Critical',
				color: '#ef4444',
				bg: '#fee2e2',
				icon: 'bi-exclamation-octagon-fill',
			}
		} else if (percentage < 100) {
			return {
				text: 'Low',
				color: '#f59e0b',
				bg: '#fef3c7',
				icon: 'bi-exclamation-triangle-fill',
			}
		}
		return null
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Inventory</PageTitle>
			<div className='inventory-container'>
				{/* LOW STOCK ALERT BANNER */}
				{showLowStockAlert && (
					<Card
						className={`mb-4 mx-2 low-stock-alert-card ${
							lowStockItems.length === 0 ? 'border-success-subtle' : ''
						}`}>
						<div className='low-stock-alert-top-border bg-danger' />
						<Card.Body className='low-stock-alert-body'>
							<div className='low-stock-alert-content'>
								<div className='low-stock-alert-main'>
									<div
										className={`low-stock-alert-icon ${
											lowStockItems.length === 0 ? 'bg-light-success' : 'bg-light-danger'
										}`}>
										<i
											className={`bi ${
												lowStockItems.length > 0
													? 'bi-exclamation-triangle-fill text-danger'
													: 'bi-shield-check text-success'
											} fs-1`}
										/>
									</div>
									<div className='low-stock-alert-text'>
										<div className='low-stock-alert-header'>
											<h5 className='low-stock-alert-title'>Low Stock Alert</h5>
											<div className='low-stock-alert-badge'>
												{lowStockItems.length} {lowStockItems.length === 1 ? 'Item' : 'Items'}
											</div>
										</div>
										{lowStockItems.length > 0 ? (
											<>
												<p className='low-stock-alert-description'>
													Following items need immediate attention. Click to view stock details and
													reorder.
												</p>
												<div className='low-stock-items-grid'>
													{lowStockItems.slice(0, 6).map((item) => {
														const severity = getStockAlertSeverity(item.stock, item.max_stock)
														const stockPercentage = (item.stock / item.max_stock) * 100
														return (
															<div
																key={item._id}
																className='low-stock-item'
																style={{
																	border: `1.5px solid ${severity?.color}30`,
																	boxShadow: `0 4px 12px ${severity?.color}20`,
																}}
																onClick={() => navigate('/rag/inventory/gn-stock/list')}>
																<div className='low-stock-item-content'>
																	<div className='low-stock-item-name'>{item.item_name}</div>
																	<div className='low-stock-item-stock'>
																		<span>
																			Stock:{' '}
																			<strong style={{ color: severity?.color }}>
																				{item.stock}
																			</strong>{' '}
																			/ {item.max_stock} {item.unit}
																		</span>
																	</div>
																	<div className='low-stock-progress-bar'>
																		<div
																			className='low-stock-progress-fill'
																			style={{
																				width: `${Math.min(stockPercentage, 100)}%`,
																				background: severity?.color,
																			}}
																		/>
																	</div>
																</div>
																<div
																	className='low-stock-item-badge'
																	style={{
																		background: severity?.bg,
																		border: `1px solid ${severity?.color}40`,
																		color: severity?.color,
																	}}>
																	<i className={severity?.icon} />
																	{severity?.text}
																</div>
															</div>
														)
													})}
												</div>
											</>
										) : (
											<div className='mt-2 py-2'>
												<div className='d-flex align-items-center mb-1'>
													<span className='text-dark fw-bold fs-6'>Stock Status</span>
												</div>
												<p className='text-muted fs-7 mb-0'>
													Currently, all items have enough stock. No action is needed at this time.
												</p>
											</div>
										)}
										{lowStockItems.length > 6 && (
											<button
												onClick={() => navigate('/rag/inventory/gn-stock/list')}
												className='low-stock-view-all-btn'>
												View All {lowStockItems.length} Low Stock Items
												<i className='bi bi-arrow-right' />
											</button>
										)}
									</div>
								</div>
							</div>
						</Card.Body>
					</Card>
				)}

				{/* CLIENT PRODUCTION PROCESS TABLE */}
				<Card className='mb-5 mx-2 client-process-card'>
					<Card.Body className='client-process-body'>
						<div className='client-process-header w-100 d-flex justify-content-between align-items-center mb-6'>
							<div className='d-flex align-items-center'>
								<div className='client-process-icon'>
									<i className='bi bi-diagram-3-fill text-white' />
								</div>
								<h5 className='client-process-title mb-0'>Client Production Process</h5>
							</div>

							<div className='d-flex justify-content-end align-items-center'>
								<div className='d-flex align-items-center position-relative me-3'>
									<i className='fa fa-search position-absolute ms-4 fs-3 text-gray-400'></i>
									<input
										type='text'
										data-kt-table-filter='search'
										className='form-control form-control-solid w-250px ps-14'
										placeholder='Search...'
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
									{searchTerm && (
										<button
											className='btn btn-sm btn-icon btn-active-color-gray-500 position-absolute end-0 me-2'
											onClick={() => setSearchTerm('')}>
											<i className='fa fa-close fs-6'></i>
										</button>
									)}
								</div>
								<div
									className='d-flex align-items-center me-3'
									style={{ width: '250px' }}>
									<DateFilter onDateRangeChange={handleDateRangeChange} />
								</div>
								<div className='d-flex align-items-center'>
									<LengthMenu
										expenseData={clientProcesses}
										handleItemsPerPageChange={(value) => {
											setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
										}}
									/>
								</div>
							</div>
						</div>

						<div className='client-process-table-wrapper'>
							<table className='client-process-table'>
								<thead>
									<tr>
										<th style={{ width: '120px', paddingLeft: '1.5rem' }}>Invoice No.</th>
										<th>Client Details</th>
										<th>Formulation</th>
										<th>Label & Sticker</th>
										<th>Procurement</th>
										<th>Production</th>
										<th>Lab Report</th>
										<th>Dispatch</th>
										<th>Action</th>
									</tr>
								</thead>
								<tbody>
									{isLoadingClients ? (
										<tr>
											<td
												colSpan={9}
												className='text-center py-10'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</td>
										</tr>
									) : clientProcesses.length > 0 ? (
										clientProcesses.map((client, index) => {
											return (
												<tr key={client.id}>
													<td
														style={{
															padding: '1.25rem',
															paddingLeft: '1.5rem',
															borderRadius: '12px 0 0 12px',
															verticalAlign: 'middle',
															fontWeight: 600,
															color: '#000',
														}}>
														{client.invoiceNo}
													</td>
													<td
														className='client-details-cell'
														style={{ borderRadius: 0 }}>
														<div className='client-name'>{client.clientName}</div>
														<div className='client-info'>
															<i className='bi bi-envelope' />
															{client.email}
														</div>
														<div className='client-info'>
															<i className='bi bi-telephone' />
															{client.phone}
														</div>
													</td>

													<td className='process-status-cell'>
														<div
															className={`process-status-badge ${
																client.nutritionTable.completed ? 'completed' : 'pending'
															}`}>
															<span>{client.nutritionTable.completed ? 'Done' : 'Pending'}</span>
														</div>
														{client.nutritionTable.date && (
															<div className='process-status-date'>
																{new Date(client.nutritionTable.date).toLocaleDateString('en-GB', {
																	year: 'numeric',
																	month: '2-digit',
																	day: '2-digit',
																})}
															</div>
														)}
													</td>

													<td className='process-status-cell'>
														{client.label.skipped ? (
															<div className='process-status-badge skipped'>
																<span>Skipped</span>
															</div>
														) : client.label.completed ? (
															<>
																<div className='process-status-badge completed'>
																	<span>Done</span>
																</div>
																{client.label.date && (
																	<div className='process-status-date'>
																		{new Date(client.label.date).toLocaleDateString('en-GB', {
																			year: 'numeric',
																			month: '2-digit',
																			day: '2-digit',
																		})}
																	</div>
																)}
															</>
														) : (
															<div
																className='process-status-badge pending'
																style={{
																	opacity: !client.nutritionTable.completed ? 0.5 : 1,
																}}>
																<span>Pending</span>
															</div>
														)}
													</td>

													<td className='process-status-cell'>
														<div
															className={`process-status-badge ${
																client.procurement.completed ? 'completed' : 'pending'
															}`}
															style={{
																opacity: !client.nutritionTable.completed ? 0.5 : 1,
															}}>
															<span>{client.procurement.completed ? 'Done' : 'Pending'}</span>
														</div>
														{client.procurement.date && (
															<div className='process-status-date'>
																{new Date(client.procurement.date).toLocaleDateString('en-GB', {
																	year: 'numeric',
																	month: '2-digit',
																	day: '2-digit',
																})}
															</div>
														)}
													</td>

													<td className='process-status-cell'>
														<div
															className={`process-status-badge ${
																client.production.completed ? 'completed' : 'pending'
															}`}
															style={{
																opacity:
																	!client.nutritionTable.completed ||
																	(!client.label.skipped && !client.label.completed)
																		? 0.5
																		: 1,
															}}>
															<span>{client.production.completed ? 'Done' : 'Pending'}</span>
														</div>
														{client.production.date && (
															<div className='process-status-date'>
																{new Date(client.production.date).toLocaleDateString('en-GB', {
																	year: 'numeric',
																	month: '2-digit',
																	day: '2-digit',
																})}
															</div>
														)}
													</td>

													<td className='process-status-cell'>
														{client.labReport.skipped ? (
															<div className='process-status-badge skipped'>
																<span>Skipped</span>
															</div>
														) : client.labReport.completed ? (
															<>
																<div className='process-status-badge completed'>
																	<span>Done</span>
																</div>
																{client.labReport.date && (
																	<div className='process-status-date'>
																		{new Date(client.labReport.date).toLocaleDateString('en-GB', {
																			year: 'numeric',
																			month: '2-digit',
																			day: '2-digit',
																		})}
																	</div>
																)}
															</>
														) : (
															<div
																className='process-status-badge pending'
																style={{
																	opacity: !client.production.completed ? 0.5 : 1,
																}}>
																<span>Pending</span>
															</div>
														)}
													</td>

													<td className='process-status-cell'>
														<div
															className={`process-status-badge ${
																client.dispatch.completed ? 'completed' : 'pending'
															}`}
															style={{
																opacity:
																	!client.labReport.completed && !client.labReport.skipped
																		? 0.5
																		: 1,
															}}>
															<span>{client.dispatch.completed ? 'Done' : 'Pending'}</span>
														</div>
														{client.dispatch.date && (
															<div className='process-status-date'>
																{new Date(client.dispatch.date).toLocaleDateString('en-GB', {
																	year: 'numeric',
																	month: '2-digit',
																	day: '2-digit',
																})}
															</div>
														)}
													</td>

													<td className='action-cell'>
														<button
															onClick={() => handleViewDetails(client)}
															className='view-details-btn'>
															<i className='bi bi-eye-fill' />
															View Details
														</button>
													</td>
												</tr>
											)
										})
									) : (
										<tr>
											<td
												colSpan={9}
												className='text-center py-12'>
												<div className='d-flex flex-column align-items-center justify-content-center'>
													<div
														className='mb-3 d-flex align-items-center justify-content-center'
														style={{
															width: '50px',
															height: '50px',
															borderRadius: '12px',
															background: '#f8f9fa',
															border: '1px dashed #dee2e6',
														}}>
														<i
															className='bi bi-people text-muted'
															style={{ fontSize: '1.4rem' }}
														/>
													</div>
													<span className='text-muted fw-bold fs-7'>
														No active production processes found
													</span>
												</div>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
						{clientProcesses.length > 0 && (
							<UsersListPagination
								totalPages={totalPages}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</Card.Body>
				</Card>

				{/* INVENTORY CARDS */}
				<div className='mb-5 mx-2'>
					<div className='row g-4'>
						{quickFeatures.map((feature, index) => {
							const colors = [
								{ bar: '#6366f1', bg: '#f5f7ff' },
								{ bar: '#06b6d4', bg: '#f2fcff' },
								{ bar: '#22c55e', bg: '#f3fdf7' },
								{ bar: '#f59e0b', bg: '#fffcf3' },
								{ bar: '#ec4899', bg: '#fff5fa' },
							]

							const theme = colors[index % colors.length]

							const isLastOdd = quickFeatures.length % 2 === 1 && index === quickFeatures.length - 1

							return (
								<div
									key={feature.id}
									className={`col-12 ${!isLastOdd ? 'col-md-6' : ''}`}>
									<div
										onClick={() => handleCardClick(feature.title)}
										onMouseEnter={() => setHoveredFeature(feature.id)}
										onMouseLeave={() => setHoveredFeature(null)}
										className='inventory-card'
										style={{
											background: `linear-gradient(180deg, #ffffff 0%, ${theme.bg} 160%)`,
										}}>
										{/* Left color bar */}
										<div
											className='inventory-card-bar'
											style={{
												background: theme.bar,
											}}
										/>

										<div className='inventory-card-content'>
											{/* Icon */}
											<div
												className='inventory-card-icon'
												style={{
													background: theme.bg,
													color: theme.bar,
												}}>
												<i className={`bi ${feature.icon}`} />
											</div>

											{/* Content */}
											<div className='inventory-card-text'>
												<div className='inventory-card-title'>{feature.title}</div>

												<div className='inventory-card-description'>{feature.description}</div>

												<div className='inventory-card-arrow-wrapper'>
													<i
														className={`bi bi-arrow-right inventory-card-arrow`}
														style={{
															color: theme.bar,
														}}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</>
	)
}

export default Inventory
