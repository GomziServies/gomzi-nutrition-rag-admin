/* eslint-disable */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faDownload,
	faEye,
	faPenToSquare,
	faTrash,
	faBuilding,
	faPhone,
	faEnvelope,
	faLocationDot,
	faXmark,
	faBoxesStacked,
	faCheckCircle,
	faImage,
	faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { PageTitle } from '../../../../../_metronic/layout/core'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import DownloadExcelButton from '../../../../components/DownloadExcelButton'
import GomziTablePagination from '../../../../components/GomziTablePagination'
import CopyButton from '../../../../components/motion/CopyButton'
import { PlusIcon } from '../../../../components/animated-icons'
import NumberTicker from '../../../../components/NumberTicker'
import {
	GetGnRawMaterialSupplier,
	RemoveGnRawMaterialSupplier,
} from '../../../../Functions/FGGroup'
import '../../products-theme.css'
import '../../orders-theme.css'
import '../../common-management.css'

const GomziNutritionMaterialSuppliersList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [supplierData, setSupplierData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
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

			const meta: any = response.metadata
			setMetaData(meta?.pagination)
		} catch (error: any) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		const delayDebounceFn = setTimeout(() => {
			setPagination((prev) => ({ ...prev, page: 1 }))
			fetchData(1)
		}, 400)

		return () => clearTimeout(delayDebounceFn)
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const openViewModal = (supplier: any) => {
		setSelectedSupplier(supplier)
		setShowModal(true)
	}

	const handleRemoveItem = async (id: string) => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: "You won't be able to revert this supplier!",
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#172B4D',
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

	const summaryStats = useMemo(() => {
		const total = metaData?.totalDocs ?? supplierData.length
		const activeCount = supplierData.filter((s) => s.status !== false).length
		const withLogo = supplierData.filter((s) => !!s.logo).length
		const states = new Set(
			supplierData
				.map((s) => s.address?.state)
				.filter((val) => typeof val === 'string' && val.trim().length > 0)
		).size

		return {
			total,
			activeCount,
			withLogo,
			states,
		}
	}, [supplierData, metaData])

	const downloadExcel = async () => {
		setExporting(true)
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
			setExporting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Raw Material Suppliers</PageTitle>

			<div className='gz-prod-container'>
				{/* BREADCRUMB */}
				<div className='gz-prod-breadcrumb'>
					<Link to='/rag/dashboard'>Dashboard</Link>
					<span className='sep'>/</span>
					<span>Manufacturing & Inventory</span>
					<span className='sep'>/</span>
					<span className='current'>Raw Material Suppliers</span>
				</div>

				{/* HEADER */}
				<div className='gz-prod-header'>
					<div className='gz-prod-header-left'>
						<h1 className='gz-prod-title'>Raw Material Suppliers</h1>
						<p className='gz-prod-subtitle'>
							Manage authorized raw material vendors, supply channels, contact profiles, and warehouse locations.
						</p>
					</div>

					<div className='gz-prod-header-right'>
						<Link
							to='/rag/inventory/suppliers/add'
							className='gz-prod-btn-primary'
							id='btn-add-supplier'>
							<PlusIcon size={16} />
							<span>Add Supplier</span>
						</Link>
					</div>
				</div>

				{/* METRICS SUMMARY */}
				<div className='gz-prod-summary-grid'>
					<div className='gz-prod-summary-card blue'>
						<div className='gz-prod-summary-icon'>
							<FontAwesomeIcon icon={faBuilding} />
						</div>
						<div className='gz-prod-summary-info'>
							<span className='gz-prod-summary-label'>Total Suppliers</span>
							<span className='gz-prod-summary-value'>
								{loading ? (
									<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
								) : (
									<NumberTicker value={summaryStats.total} />
								)}
							</span>
						</div>
					</div>

					<div className='gz-prod-summary-card green'>
						<div className='gz-prod-summary-icon'>
							<FontAwesomeIcon icon={faCheckCircle} />
						</div>
						<div className='gz-prod-summary-info'>
							<span className='gz-prod-summary-label'>Active Vendors</span>
							<span className='gz-prod-summary-value'>
								{loading ? (
									<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
								) : (
									<NumberTicker value={summaryStats.activeCount} />
								)}
							</span>
						</div>
					</div>

					<div className='gz-prod-summary-card orange'>
						<div className='gz-prod-summary-icon'>
							<FontAwesomeIcon icon={faImage} />
						</div>
						<div className='gz-prod-summary-info'>
							<span className='gz-prod-summary-label'>Verified Logos</span>
							<span className='gz-prod-summary-value'>
								{loading ? (
									<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
								) : (
									<NumberTicker value={summaryStats.withLogo} />
								)}
							</span>
						</div>
					</div>

					<div className='gz-prod-summary-card purple'>
						<div className='gz-prod-summary-icon'>
							<FontAwesomeIcon icon={faMapMarkerAlt} />
						</div>
						<div className='gz-prod-summary-info'>
							<span className='gz-prod-summary-label'>States / Regions</span>
							<span className='gz-prod-summary-value'>
								{loading ? (
									<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
								) : (
									<NumberTicker value={summaryStats.states} />
								)}
							</span>
						</div>
					</div>
				</div>

				{/* TOOLBAR */}
				<div className='gz-prod-toolbar'>
					<div className='gz-prod-toolbar-left'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search by supplier name, email, phone...'
							className='me-0'
						/>
						<LengthMenu
							expenseData={supplierData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>
						<DownloadExcelButton onClick={downloadExcel} />
					</div>
				</div>

				{/* SUPPLIERS TABLE */}
				<div className='gz-prod-table-card'>
					<div className='table-responsive'>
						<table className='gz-prod-table'>
							<thead>
								<tr>
									<th style={{ width: '56px', textAlign: 'center' }}>#</th>
									<th>Supplier / Brand</th>
									<th>Email Address</th>
									<th>Contact No</th>
									<th>Location</th>
									<th style={{ textAlign: 'center' }}>Status</th>
									<th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									Array.from({ length: 5 }).map((_, i) => (
										<tr key={`skel-${i}`}>
											<td style={{ textAlign: 'center' }}>
												<span className='gz-prod-skeleton' style={{ width: '20px', height: '14px', borderRadius: '4px' }}></span>
											</td>
											<td>
												<div className='d-flex align-items-center gap-3'>
													<span className='gz-prod-skeleton' style={{ width: '44px', height: '44px', borderRadius: '8px' }}></span>
													<div className='d-flex flex-column gap-1'>
														<span className='gz-prod-skeleton' style={{ width: '130px', height: '14px', borderRadius: '4px' }}></span>
														<span className='gz-prod-skeleton' style={{ width: '80px', height: '10px', borderRadius: '4px' }}></span>
													</div>
												</div>
											</td>
											<td>
												<span className='gz-prod-skeleton' style={{ width: '150px', height: '14px', borderRadius: '4px' }}></span>
											</td>
											<td>
												<span className='gz-prod-skeleton' style={{ width: '100px', height: '14px', borderRadius: '4px' }}></span>
											</td>
											<td>
												<span className='gz-prod-skeleton' style={{ width: '120px', height: '14px', borderRadius: '4px' }}></span>
											</td>
											<td style={{ textAlign: 'center' }}>
												<span className='gz-prod-skeleton' style={{ width: '60px', height: '22px', borderRadius: '12px' }}></span>
											</td>
											<td style={{ textAlign: 'center' }}>
												<span className='gz-prod-skeleton' style={{ width: '70px', height: '28px', borderRadius: '6px' }}></span>
											</td>
										</tr>
									))
								) : supplierData.length === 0 ? (
									<tr>
										<td colSpan={7}>
											<div className='gz-prod-empty'>
												<div className='gz-prod-empty-icon'>
													<FontAwesomeIcon icon={faBuilding} />
												</div>
												<div className='gz-prod-empty-title'>No Suppliers Found</div>
												<div className='gz-prod-empty-text'>
													{searchTerm
														? `No raw material suppliers match your search "${searchTerm}".`
														: 'There are currently no raw material suppliers registered.'}
												</div>
											</div>
										</td>
									</tr>
								) : (
									supplierData.map((supplier: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										const fullAddress = formatAddress(supplier.address)
										const logoSrc = supplier.logo
											? supplier.logo.startsWith('http')
												? supplier.logo
												: `https://files.fggroup.in/${supplier.logo}`
											: null

										return (
											<tr key={supplier._id || index}>
												<td style={{ textAlign: 'center', color: '#71809A', fontWeight: 600 }}>
													{actualIndex}
												</td>

												{/* Supplier Identity */}
												<td>
													<div className='d-flex align-items-center gap-3'>
														<div
															style={{
																width: '46px',
																height: '46px',
																borderRadius: '10px',
																backgroundColor: '#F8FAFC',
																border: '1px solid #E2E8F0',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																overflow: 'hidden',
																flexShrink: 0,
															}}>
															{logoSrc ? (
																<img
																	src={logoSrc}
																	alt={supplier.name}
																	style={{ width: '100%', height: '100%', objectFit: 'cover' }}
																	onError={(e) => {
																		;(e.target as HTMLElement).style.display = 'none'
																	}}
																/>
															) : (
																<FontAwesomeIcon icon={faBuilding} style={{ color: '#94A3B8', fontSize: '18px' }} />
															)}
														</div>

														<div className='d-flex flex-column'>
															<span
																style={{
																	fontSize: '13.5px',
																	fontWeight: 700,
																	color: '#172B4D',
																	cursor: 'pointer',
																}}
																onClick={() => openViewModal(supplier)}>
																{supplier.name || 'Unnamed Supplier'}
															</span>
															{supplier._id && (
																<div className='d-flex align-items-center gap-1 mt-1'>
																	<span
																		style={{
																			fontSize: '11px',
																			fontFamily: 'monospace',
																			color: '#64748B',
																		}}>
																		{supplier._id.slice(-8)}
																	</span>
																	<CopyButton text={supplier._id} />
																</div>
															)}
														</div>
													</div>
												</td>

												{/* Email */}
												<td>
													<div className='d-flex align-items-center gap-2'>
														<FontAwesomeIcon icon={faEnvelope} style={{ color: '#94A3B8', fontSize: '12px' }} />
														<span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>
															{supplier.email || '—'}
														</span>
													</div>
												</td>

												{/* Phone */}
												<td>
													<div className='d-flex align-items-center gap-2'>
														<FontAwesomeIcon icon={faPhone} style={{ color: '#94A3B8', fontSize: '12px' }} />
														<span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>
															{supplier.number || '—'}
														</span>
													</div>
												</td>

												{/* Location */}
												<td>
													<div className='d-flex align-items-center gap-2'>
														<FontAwesomeIcon icon={faLocationDot} style={{ color: '#94A3B8', fontSize: '12px' }} />
														<span
															style={{
																fontSize: '12.5px',
																color: '#475569',
																maxWidth: '220px',
																display: 'inline-block',
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
															}}
															title={fullAddress}>
															{supplier.address?.city && supplier.address?.state
																? `${supplier.address.city}, ${supplier.address.state}`
																: supplier.address?.city || supplier.address?.state || fullAddress}
														</span>
													</div>
												</td>

												{/* Status */}
												<td style={{ textAlign: 'center' }}>
													<span
														style={{
															display: 'inline-flex',
															alignItems: 'center',
															gap: '5px',
															padding: '4px 10px',
															borderRadius: '12px',
															fontSize: '11.5px',
															fontWeight: 600,
															backgroundColor: '#DEF7EC',
															color: '#03543F',
														}}>
														<span
															style={{
																width: '6px',
																height: '6px',
																borderRadius: '50%',
																backgroundColor: '#31C48D',
															}}
														/>
														Active
													</span>
												</td>

												{/* Actions */}
												<td style={{ textAlign: 'center' }}>
													<div className='gz-prod-actions-group' style={{ justifyContent: 'center' }}>
														<button
															type='button'
															className='gz-prod-action-btn view'
															onClick={() => openViewModal(supplier)}
															title='Quick View Details'>
															<FontAwesomeIcon icon={faEye} />
														</button>

														<Link
															to={`/rag/inventory/suppliers/edit?supplier_id=${supplier._id}`}
															className='gz-prod-action-btn edit'
															title='Edit Supplier'>
															<FontAwesomeIcon icon={faPenToSquare} />
														</Link>

														<button
															type='button'
															className='gz-prod-action-btn delete'
															onClick={() => handleRemoveItem(supplier._id)}
															title='Delete Supplier'>
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

					{/* PAGINATION */}
					{metaData && metaData.totalPages > 1 && (
						<GomziTablePagination
							page={pagination.page}
							totalPages={metaData.totalPages}
							totalRecords={metaData.totalDocs ?? supplierData.length}
							itemsPerPage={pagination.itemsPerPage}
							onPageChange={handlePageChange}
							entityName='suppliers'
						/>
					)}
				</div>
			</div>

			{/* QUICK VIEW MODAL */}
			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(false)}
				size='lg'>
				<div
					style={{
						borderRadius: '14px',
						overflow: 'hidden',
						border: 'none',
						boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
						backgroundColor: '#FFFFFF',
					}}>
					{/* Modal Header */}
					<div
						style={{
							backgroundColor: '#172B4D',
							padding: '20px 28px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							color: '#FFFFFF',
						}}>
						<div className='d-flex align-items-center gap-3'>
							<div
								style={{
									width: '38px',
									height: '38px',
									borderRadius: '8px',
									backgroundColor: 'rgba(255, 255, 255, 0.12)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: '#FFFFFF',
								}}>
								<FontAwesomeIcon icon={faBuilding} />
							</div>
							<div>
								<h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
									Supplier Details
								</h3>
								<span style={{ fontSize: '12px', color: '#CBD5E1' }}>
									Overview of registered raw material vendor credentials
								</span>
							</div>
						</div>

						<button
							type='button'
							onClick={() => setShowModal(false)}
							style={{
								background: 'transparent',
								border: 'none',
								color: '#CBD5E1',
								cursor: 'pointer',
								fontSize: '18px',
								padding: '4px',
							}}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					</div>

					{/* Modal Body */}
					<div style={{ padding: '24px 28px' }}>
						{selectedSupplier && (
							<div>
								{/* Vendor Profile Top Card */}
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '20px',
										padding: '20px',
										backgroundColor: '#F8FAFC',
										borderRadius: '12px',
										border: '1px solid #E2E8F0',
										marginBottom: '24px',
									}}>
									<div
										style={{
											width: '80px',
											height: '80px',
											borderRadius: '12px',
											backgroundColor: '#FFFFFF',
											border: '1px solid #CBD5E1',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											overflow: 'hidden',
											flexShrink: 0,
										}}>
										{selectedSupplier.logo ? (
											<img
												src={
													selectedSupplier.logo.startsWith('http')
														? selectedSupplier.logo
														: `https://files.fggroup.in/${selectedSupplier.logo}`
												}
												alt={selectedSupplier.name}
												style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
											/>
										) : (
											<FontAwesomeIcon icon={faBuilding} style={{ fontSize: '32px', color: '#94A3B8' }} />
										)}
									</div>

									<div style={{ flex: 1 }}>
										<div className='d-flex align-items-center gap-2 flex-wrap'>
											<h4 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#172B4D' }}>
												{selectedSupplier.name}
											</h4>
											<span
												style={{
													fontSize: '11px',
													padding: '2px 8px',
													borderRadius: '6px',
													backgroundColor: '#DEF7EC',
													color: '#03543F',
													fontWeight: 600,
												}}>
												Active Supplier
											</span>
										</div>

										<p style={{ margin: '4px 0 8px 0', fontSize: '13px', color: '#64748B' }}>
											GOMZI Nutrition Raw Materials Partner
										</p>

										{selectedSupplier._id && (
											<div className='d-flex align-items-center gap-2'>
												<span style={{ fontSize: '12px', color: '#64748B' }}>ID:</span>
												<code
													style={{
														fontSize: '12px',
														backgroundColor: '#FFFFFF',
														padding: '2px 8px',
														borderRadius: '4px',
														border: '1px solid #E2E8F0',
														color: '#172B4D',
													}}>
													{selectedSupplier._id}
												</code>
												<CopyButton text={selectedSupplier._id} />
											</div>
										)}
									</div>
								</div>

								{/* Details Grid */}
								<div className='row g-4'>
									<div className='col-12 col-md-6'>
										<div
											style={{
												padding: '16px',
												borderRadius: '10px',
												backgroundColor: '#F8FAFC',
												border: '1px solid #E2E8F0',
												display: 'flex',
												alignItems: 'flex-start',
												gap: '12px',
											}}>
											<div
												style={{
													width: '36px',
													height: '36px',
													borderRadius: '8px',
													backgroundColor: '#E0E7FF',
													color: '#4338CA',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													flexShrink: 0,
												}}>
												<FontAwesomeIcon icon={faEnvelope} />
											</div>
											<div>
												<span style={{ display: 'block', fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
													Email Address
												</span>
												<span style={{ fontSize: '13.5px', color: '#172B4D', fontWeight: 600 }}>
													{selectedSupplier.email || '—'}
												</span>
											</div>
										</div>
									</div>

									<div className='col-12 col-md-6'>
										<div
											style={{
												padding: '16px',
												borderRadius: '10px',
												backgroundColor: '#F8FAFC',
												border: '1px solid #E2E8F0',
												display: 'flex',
												alignItems: 'flex-start',
												gap: '12px',
											}}>
											<div
												style={{
													width: '36px',
													height: '36px',
													borderRadius: '8px',
													backgroundColor: '#DCFCE7',
													color: '#15803D',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													flexShrink: 0,
												}}>
												<FontAwesomeIcon icon={faPhone} />
											</div>
											<div>
												<span style={{ display: 'block', fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
													Contact Number
												</span>
												<span style={{ fontSize: '13.5px', color: '#172B4D', fontWeight: 600 }}>
													{selectedSupplier.number || '—'}
												</span>
											</div>
										</div>
									</div>

									<div className='col-12'>
										<div
											style={{
												padding: '16px',
												borderRadius: '10px',
												backgroundColor: '#F8FAFC',
												border: '1px solid #E2E8F0',
												display: 'flex',
												alignItems: 'flex-start',
												gap: '12px',
											}}>
											<div
												style={{
													width: '36px',
													height: '36px',
													borderRadius: '8px',
													backgroundColor: '#FEF3C7',
													color: '#B45309',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													flexShrink: 0,
												}}>
												<FontAwesomeIcon icon={faLocationDot} />
											</div>
											<div style={{ flex: 1 }}>
												<span style={{ display: 'block', fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
													Registered Address
												</span>
												<span style={{ fontSize: '13.5px', color: '#172B4D', fontWeight: 500, lineHeight: 1.5 }}>
													{formatAddress(selectedSupplier.address)}
												</span>
											</div>
										</div>
									</div>
								</div>

								{/* Action Footer in Modal */}
								<div
									style={{
										marginTop: '24px',
										paddingTop: '16px',
										borderTop: '1px solid #E2E8F0',
										display: 'flex',
										justifyContent: 'flex-end',
										gap: '10px',
									}}>
									<button
										type='button'
										className='btn btn-light'
										onClick={() => setShowModal(false)}
										style={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
										Close
									</button>
									<Link
										to={`/rag/inventory/suppliers/edit?supplier_id=${selectedSupplier._id}`}
										className='gz-prod-btn-primary'
										style={{ height: '38px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none' }}>
										<FontAwesomeIcon icon={faPenToSquare} />
										<span>Edit Profile</span>
									</Link>
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
