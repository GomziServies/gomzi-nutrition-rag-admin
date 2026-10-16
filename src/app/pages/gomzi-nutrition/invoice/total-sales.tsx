/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPlus,
	faEye,
	faPenToSquare,
	faChevronDown,
	faFileInvoice,
	faWallet,
	faClock,
	faDownload,
	faAngleLeft,
	faAngleRight,
} from '@fortawesome/free-solid-svg-icons'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import SearchFilter from '../../../components/SearchFilter'
import LengthMenu from '../../../components/LengthMenu'
import NumberTicker from '../../../components/NumberTicker'
import {
	getInvoice,
	getInvoiceBranches,
	GetInvoiceInsights,
	GetTrainers,
} from '../../../Functions/FGGroup'
import './invoice-theme.css'

const NutritionTotalSalesList: React.FC = () => {
	const navigate = useNavigate()
	const masterData = localStorage.getItem('admin_type')
	const adminType = localStorage.getItem('admin')

	// State
	const [searchTerm, setSearchTerm] = useState('')
	const [invoiceData, setInvoiceData] = useState<any[]>([])
	const [branchesData, setBranchesData] = useState<string[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort] = useState('createdAt')
	const [sortOrder] = useState<QuerySortOptions>('desc')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [loading, setLoading] = useState(true)
	const [dataInsight, setDataInsight] = useState<any>({})
	const [selectedFilter, setSelectedFilter] = useState<string>('All')
	const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
	const statusDropdownRef = useRef<HTMLDivElement>(null)

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [selectedBranch, setSelectedBranch] = useState<string>('default')
	const [selectedSalesPerson] = useState<string>('default')
	const [salesPersonList, setSalesPersonList] = useState<any[]>([])

	// Close dropdowns on outside click
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				statusDropdownRef.current &&
				!statusDropdownRef.current.contains(event.target as Node)
			) {
				setStatusDropdownOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const getDateRange = (): [Date, Date] => {
		if (!selectedDateRange) {
			return [new Date(0), new Date()]
		}
		const [selectedStart, selectedEnd] = selectedDateRange
		const startDate = new Date(selectedStart)
		startDate.setHours(0, 0, 0, 0)
		const endDate = new Date(selectedEnd)
		endDate.setHours(23, 59, 59, 999)
		return [startDate, endDate]
	}

	const fetchInvoiceData = async (page?: number, store?: any) => {
		setLoading(true)
		try {
			const category = adminType === 'Store' ? adminType : 'Gomzi Nutrition'
			const [startDate, endDate] = getDateRange()

			const response: any = await getInvoice({
				invoice_category: category,
				page: page || pagination.page,
				branch_name: store !== undefined ? (store === 'default' ? undefined : store) : (selectedBranch === 'default' ? undefined : selectedBranch),
				limit: pagination.itemsPerPage,
				...(searchTerm && {
					search: searchTerm,
				}),
				from_date: startDate,
				to_date: endDate,
				...(selectedSalesPerson !== 'default' && {
					sales_person: selectedSalesPerson,
				}),
				sort,
				sortOrder,
			})

			const meta: any = response?.metadata
			if (meta?.pagination) {
				setMetaData(meta.pagination)
			}

			let filteredData = response?.data || []

			// Filter based on Status
			if (selectedFilter === 'Paid') {
				filteredData = filteredData.filter((inv: any) => {
					const net = Number(inv?.net_amount || 0)
					const paid = Number(inv?.paid_amount || 0)
					return paid >= net && net > 0
				})
			} else if (selectedFilter === 'Pending') {
				filteredData = filteredData.filter((inv: any) => {
					const net = Number(inv?.net_amount || 0)
					const paid = Number(inv?.paid_amount || 0)
					return paid < net
				})
			} else if (selectedFilter === 'Overdue') {
				filteredData = filteredData.filter((inv: any) => {
					const net = Number(inv?.net_amount || 0)
					const paid = Number(inv?.paid_amount || 0)
					return paid < net
				})
			}

			setInvoiceData(filteredData)
		} catch (error) {
			console.error('Error fetching invoice data:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchInvoiceInsightData = async () => {
		const [startDate, endDate] = getDateRange()
		try {
			const category = adminType === 'Store' ? adminType : 'Gomzi Nutrition'
			const response: any = await GetInvoiceInsights({
				invoice_category: category,
				from_date: startDate,
				to_date: endDate,
			})
			if (response?.data?.[0]) {
				setDataInsight(response.data[0])
			}
		} catch (error) {
			console.error('Error fetching invoice insights:', error)
		}
	}

	const fetchSalesPersons = async () => {
		try {
			const response: any = await GetTrainers({ limit: 1000 })
			if (response?.data) {
				setSalesPersonList(response.data)
			}
		} catch (error) {
			console.error('Error fetching sales persons:', error)
		}
	}

	const fetchInvoiceBranches = async () => {
		try {
			const response: any = await getInvoiceBranches()
			if (response?.data) {
				const branches = response.data.map((item: any) => item.branch_name)
				setBranchesData(branches)
			}
		} catch (error) {
			console.error('Error fetching branches:', error)
		}
	}

	useEffect(() => {
		fetchInvoiceInsightData()
		fetchSalesPersons()
		fetchInvoiceBranches()
	}, [])

	useEffect(() => {
		fetchInvoiceData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedFilter,
		selectedSalesPerson,
		selectedBranch,
	])

	const isFirstRender = useRef(true)
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		const timer = setTimeout(() => {
			setPagination((prev) => ({ ...prev, page: 1 }))
			fetchInvoiceData(1)
		}, 300)
		return () => clearTimeout(timer)
	}, [searchTerm])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const getPaginationItems = (currentPage: number, total: number): (number | '...')[] => {
		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1)
		}
		if (currentPage <= 4) {
			return [1, 2, 3, 4, 5, '...', total]
		}
		if (currentPage >= total - 3) {
			return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
		}
		return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total]
	}

	const handleItemsPerPageChange = (pageSize: number) => {
		setPagination((prev) => ({ ...prev, page: 1, itemsPerPage: pageSize }))
	}

	const downloadExcel = async () => {
		try {
			setLoading(true)
			const [startDate, endDate] = getDateRange()
			const category = adminType === 'Store' ? adminType : 'Gomzi Nutrition'

			const response: any = await getInvoice({
				invoice_category: category,
				page: 1,
				limit: 100000,
				...(selectedBranch !== 'default' && { branch_name: selectedBranch }),
				...(searchTerm && { search: searchTerm }),
				from_date: startDate,
				to_date: endDate,
				...(selectedSalesPerson !== 'default' && { sales_person: selectedSalesPerson }),
				sort,
				sortOrder,
			})

			const exportData = response?.data || []
			if (exportData.length === 0) {
				Swal.fire('No Data', 'There is no invoice data to export.', 'info')
				return
			}

			const worksheetData = exportData.map((invoice: any) => {
				const due = (invoice?.net_amount || 0) - (invoice?.paid_amount || 0)
				return {
					'Invoice No.': invoice?.invoice_number ? `#INV-${invoice.invoice_number}` : 'N/A',
					'User Name': invoice?.fullName || invoice?.name || 'N/A',
					Mobile: invoice?.phoneNumber || invoice?.mobile || 'N/A',
					Email: invoice?.email || 'N/A',
					'Total Amount': invoice?.net_amount ?? 0,
					'Paid Amount': invoice?.paid_amount ?? 0,
					'Due Amount': due,
					'Purchase Date': invoice?.date ? DayJS(invoice.date).format('YYYY-MM-DD') : 'N/A',
					'Sales Person':
						salesPersonList.find((e: any) => e._id === invoice?.sales_person)?.full_name ||
						invoice?.sales_person ||
						'N/A',
				}
			})

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices')
			XLSX.writeFile(workbook, `Gomzi_Invoices_${DayJS(new Date()).format('DD-MM-YYYY')}.xlsx`)

			Swal.fire('Export Successful!', `${exportData.length} invoices exported successfully.`, 'success')
		} catch (error: any) {
			console.error('Export error:', error)
			Swal.fire('Export Failed!', 'Unable to export invoice data.', 'error')
		} finally {
			setLoading(false)
		}
	}

	// Financial Summary calculation
	const totalAmount = dataInsight?.total_amount || invoiceData.reduce((acc, curr) => acc + (Number(curr?.net_amount) || 0), 0)
	const paidAmount = dataInsight?.total_paid_amount || invoiceData.reduce((acc, curr) => acc + (Number(curr?.paid_amount) || 0), 0)
	const unpaidAmount = dataInsight?.total_unpaid_amount !== undefined ? dataInsight?.total_unpaid_amount : Math.max(0, totalAmount - paidAmount)

	const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
	const pendingRate = totalAmount > 0 ? Math.round((unpaidAmount / totalAmount) * 100) : 0

	// Pagination calculations
	const totalRecords = metaData?.totalDocs || metaData?.totalCount || invoiceData.length || 0
	const totalPages = metaData?.totalPages || Math.ceil(totalRecords / pagination.itemsPerPage) || 1
	const currentStart = totalRecords === 0 ? 0 : (pagination.page - 1) * pagination.itemsPerPage + 1
	const currentEnd = Math.min(pagination.page * pagination.itemsPerPage, totalRecords)

	return (
		<div className='gz-inv-container'>
			<PageTitle breadcrumbs={[]}>Invoices</PageTitle>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-inv-header'>
				<div>
					<h1 className='gz-inv-title'>Invoices</h1>
					<p className='gz-inv-subtitle'>Manage client billing and collections</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					{masterData === 'MASTER' && (
						<button
							type='button'
							className='gz-inv-btn-outline'
							onClick={downloadExcel}
							disabled={loading}
							title='Export to Excel'>
							<FontAwesomeIcon icon={faDownload} />
							<span>Export</span>
						</button>
					)}
					<Link to='/rag/create-invoice' className='gz-inv-btn-primary'>
						<FontAwesomeIcon icon={faPlus} />
						<span>Create Invoice</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    FINANCIAL SUMMARY MODULES (3 CARDS WITH NUMBER TICKER)
			    ========================================================================= */}
			<div className='gz-inv-metrics-grid'>
				{/* Total Invoiced */}
				<div className='gz-inv-metric-card soft-blue'>
					<div className='gz-inv-metric-content'>
						<span className='gz-inv-metric-label'>Total Invoiced</span>
						<span className='gz-inv-metric-amount'>
							{loading ? (
								<span className='gz-inv-skeleton' style={{ width: '130px', height: '26px', borderRadius: '6px' }}></span>
							) : (
								<>₹ <NumberTicker value={totalAmount} /></>
							)}
						</span>
						<span className='gz-inv-metric-subtext green'>
							<span>↑ Real-time billing insight</span>
						</span>
					</div>
					<div className='gz-inv-metric-icon blue'>
						<FontAwesomeIcon icon={faFileInvoice} />
					</div>
				</div>

				{/* Collected */}
				<div className='gz-inv-metric-card pale-mint'>
					<div className='gz-inv-metric-content'>
						<span className='gz-inv-metric-label'>Collected</span>
						<span className='gz-inv-metric-amount'>
							{loading ? (
								<span className='gz-inv-skeleton' style={{ width: '120px', height: '26px', borderRadius: '6px' }}></span>
							) : (
								<>₹ <NumberTicker value={paidAmount} /></>
							)}
						</span>
						<span className='gz-inv-metric-subtext green'>
							<span><NumberTicker value={collectionRate} />% collection rate</span>
						</span>
					</div>
					<div className='gz-inv-metric-icon green'>
						<FontAwesomeIcon icon={faWallet} />
					</div>
				</div>

				{/* Outstanding */}
				<div className='gz-inv-metric-card soft-pink'>
					<div className='gz-inv-metric-content'>
						<span className='gz-inv-metric-label'>Outstanding</span>
						<span className='gz-inv-metric-amount'>
							{loading ? (
								<span className='gz-inv-skeleton' style={{ width: '120px', height: '26px', borderRadius: '6px' }}></span>
							) : (
								<>₹ <NumberTicker value={unpaidAmount} /></>
							)}
						</span>
						<span className='gz-inv-metric-subtext red'>
							<span><NumberTicker value={pendingRate} />% pending</span>
						</span>
					</div>
					<div className='gz-inv-metric-icon red'>
						<FontAwesomeIcon icon={faClock} />
					</div>
				</div>
			</div>

			{/* =========================================================================
			    FILTER TOOLBAR (EMPLOYEE DASHBOARD SPECIFIC SEQUENCE & NO OVERLAPPING SEARCH ICON)
			    1. Searchbar -> 2. LengthMenu -> 3. Status -> 4. Store -> 5. DateFilter
			    ========================================================================= */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center flex-wrap gap-3'>
					{/* 1. Searchbar (Fixed padding & flex layout, no overlap) */}
					<div style={{ minWidth: '240px', maxWidth: '360px', flex: '1 1 240px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search by invoice no., client name...'
						/>
					</div>

					{/* 2. Page Size / Length Menu */}
					<div>
						<LengthMenu
							data={invoiceData}
							itemsPerPage={pagination.itemsPerPage}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>

					{/* 3. Status Filter Dropdown */}
					<div className='position-relative' ref={statusDropdownRef}>
						<button
							type='button'
							className={`gz-inv-dropdown-btn ${statusDropdownOpen ? 'active' : ''}`}
							style={{ height: '38px', borderRadius: '8px' }}
							onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}>
							<span>{selectedFilter === 'All' ? 'Status' : selectedFilter}</span>
							<FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '11px', opacity: 0.7 }} />
						</button>

						{statusDropdownOpen && (
							<div className='gz-inv-dropdown-menu' style={{ zIndex: 10000 }}>
								{['All', 'Paid', 'Pending'].map((st) => (
									<div
										key={st}
										className={`gz-inv-dropdown-item ${selectedFilter === st ? 'selected' : ''}`}
										onClick={() => {
											setSelectedFilter(st)
											setStatusDropdownOpen(false)
											setPagination((prev) => ({ ...prev, page: 1 }))
										}}>
										<span>{st === 'All' ? 'All Statuses' : st}</span>
									</div>
								))}
							</div>
						)}
					</div>

					{/* 4. Store / Branch Dropdown */}
					{adminType !== 'Store' && branchesData.length > 0 && (
						<select
							className='gz-inv-select'
							style={{ width: 'auto', minWidth: '150px', height: '38px', borderRadius: '8px' }}
							value={selectedBranch}
							onChange={(e) => {
								setSelectedBranch(e.target.value)
								setPagination((prev) => ({ ...prev, page: 1 }))
							}}>
							<option value='default'>All Stores</option>
							{branchesData.map((branch: any) => (
								<option key={branch} value={branch}>
									{branch}
								</option>
							))}
						</select>
					)}

					{/* Spacer */}
					<div className='d-none d-md-block' style={{ flexGrow: 1 }}></div>

					{/* 5. Date Filter (at last) */}
					<div>
						<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0' />
					</div>
				</div>
			</div>

			{/* =========================================================================
			    INVOICES TABLE
			    ========================================================================= */}
			<div className='gz-inv-table-card'>
				<div className='table-responsive'>
					<table className='gz-inv-table'>
						<thead>
							<tr>
								<th style={{ width: '48px', textAlign: 'center' }}>#</th>
								<th>Invoice No.</th>
								<th>Client / Company</th>
								<th>Invoice Date</th>
								<th style={{ textAlign: 'right' }}>Amount</th>
								<th style={{ textAlign: 'center' }}>Status</th>
								<th style={{ textAlign: 'center', width: '110px' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 6 }).map((_, sIdx) => (
									<tr key={`inv-skel-${sIdx}`} className='gz-inv-skeleton-row'>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-inv-skeleton' style={{ width: '20px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-inv-skeleton' style={{ width: '90px', height: '16px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<div className='d-flex flex-column gap-1'>
												<span className='gz-inv-skeleton' style={{ width: `${140 - sIdx * 8}px`, height: '15px', borderRadius: '4px' }}></span>
												<span className='gz-inv-skeleton' style={{ width: '95px', height: '12px', borderRadius: '4px' }}></span>
											</div>
										</td>
										<td>
											<span className='gz-inv-skeleton' style={{ width: '85px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td style={{ textAlign: 'right' }}>
											<span className='gz-inv-skeleton' style={{ width: '75px', height: '16px', borderRadius: '4px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-inv-skeleton' style={{ width: '60px', height: '22px', borderRadius: '999px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<div className='d-flex align-items-center justify-content-center gap-2'>
												<span className='gz-inv-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }}></span>
												<span className='gz-inv-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }}></span>
											</div>
										</td>
									</tr>
								))
							) : invoiceData.length === 0 ? (
								<tr>
									<td colSpan={7} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap'>
											{!searchTerm ? (
												<Link to='/rag/create-invoice' className='gz-empty-plus-btn' title='Create Invoice'>
													<FontAwesomeIcon icon={faPlus} />
												</Link>
											) : (
												<div className='gz-prod-empty-icon'>
													<FontAwesomeIcon icon={faFileInvoice} />
												</div>
											)}
											<h4 className='gz-empty-state-title'>
												No invoices found
											</h4>
											<p className='gz-empty-state-desc'>
												{searchTerm ? 'No invoices matched your search criteria.' : 'Create your first invoice to begin tracking client billing.'}
											</p>
										</div>
									</td>
								</tr>
							) : (
								invoiceData.map((item: any, index: number) => {
									const net = Number(item?.net_amount || 0)
									const paid = Number(item?.paid_amount || 0)
									const isPaid = paid >= net && net > 0

									const formattedDate = item?.date ? DayJS(item.date).format('DD MMM YYYY') : '-'
									const invNumber = item?.invoice_number ? `#INV-${item.invoice_number}` : (item?.id || '-')

									return (
										<tr key={item._id || index}>
											<td style={{ textAlign: 'center', color: '#71809A', fontSize: '12.5px' }}>
												{currentStart + index}
											</td>
											<td>
												<span style={{ fontWeight: 600, color: '#172B4D' }}>
													{invNumber}
												</span>
											</td>
											<td>
												<div className='d-flex flex-column'>
													<span style={{ fontWeight: 600, color: '#142447', fontSize: '13.5px' }}>
														{item?.name || 'Walk-in Customer'}
													</span>
													{item?.mobile && (
														<span style={{ color: '#71809A', fontSize: '12px' }}>
															{item.mobile}
														</span>
													)}
												</div>
											</td>
											<td>
												<span style={{ color: '#71809A', fontSize: '13px' }}>
													{formattedDate}
												</span>
											</td>
											<td style={{ textAlign: 'right', fontWeight: 700, color: '#172B4D', fontVariantNumeric: 'tabular-nums' }}>
												₹{net.toLocaleString('en-IN')}
											</td>
											<td style={{ textAlign: 'center' }}>
												{isPaid ? (
													<span className='gz-inv-badge paid'>Paid</span>
												) : paid > 0 ? (
													<span className='gz-inv-badge pending'>Partial</span>
												) : (
													<span className='gz-inv-badge due'>Pending</span>
												)}
											</td>
											<td style={{ textAlign: 'center' }}>
												<div className='d-flex align-items-center justify-content-center gap-2'>
													{/* View Action Button */}
													<button
														type='button'
														className='gz-inv-action-btn view'
														title='View invoice'
														onClick={() => navigate(`/rag/view-invoice?invoice_id=${item._id}`)}>
														<FontAwesomeIcon icon={faEye} />
													</button>

													{/* Edit Action Button */}
													<button
														type='button'
														className='gz-inv-action-btn edit'
														title='Edit invoice'
														onClick={() => navigate(`/rag/update-invoice?invoice_id=${item._id}`)}>
														<FontAwesomeIcon icon={faPenToSquare} />
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

				{/* =========================================================================
				    PAGINATION FOOTER
				    ========================================================================= */}
				{invoiceData.length > 0 && (
					<div className='gz-inv-pagination'>
						{/* Count info */}
						<div>
							Showing {currentStart}-{currentEnd} of {totalRecords} invoices
						</div>

						{/* Numbered pages */}
						<div className='gz-inv-pages-group'>
							<button
								type='button'
								className='gz-inv-page-num'
								disabled={pagination.page <= 1}
								onClick={() => handlePageChange(pagination.page - 1)}>
								<FontAwesomeIcon icon={faAngleLeft} />
							</button>

							{getPaginationItems(pagination.page, totalPages).map((item, idx) => {
								if (item === '...') {
									return (
										<span
											key={`dots-${idx}`}
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												minWidth: '24px',
												height: '34px',
												color: '#94A3B8',
												fontWeight: 700,
												fontSize: '14px',
												userSelect: 'none',
											}}>
											…
										</span>
									)
								}
								return (
									<button
										key={item}
										type='button'
										className={`gz-inv-page-num ${pagination.page === item ? 'active' : ''}`}
										onClick={() => handlePageChange(item)}>
										{item}
									</button>
								)
							})}

							<button
								type='button'
								className='gz-inv-page-num'
								disabled={pagination.page >= totalPages}
								onClick={() => handlePageChange(pagination.page + 1)}>
								<FontAwesomeIcon icon={faAngleRight} />
							</button>
						</div>

						{/* Quick record count indicator */}
						<div style={{ color: '#71809A', fontSize: '13px', fontWeight: 500 }}>
							Page {pagination.page} of {totalPages}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default NutritionTotalSalesList
