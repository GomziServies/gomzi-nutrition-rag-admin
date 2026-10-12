import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { getAutoCommissionRequests, updateAutoCommissionRequest } from '../../../Functions/FGGroup'

// ─── Commission Slab Reference (for frontend bonus counting) ──────────────────
const COMMISSION_SLABS: Record<string, Array<{ min: number; max: number; amount: number }>> = {
	FWG: [
		{ min: 14500, max: 15500, amount: 150 },
		{ min: 26500, max: 27500, amount: 300 },
		{ min: 60500, max: 61500, amount: 600 },
		{ min: 299500, max: 300500, amount: 3000 },
	],
	'FG GROUP': [
		{ min: 17900, max: 18900, amount: 300 },
		{ min: 28900, max: 29900, amount: 540 },
		{ min: 42500, max: 43500, amount: 630 },
		{ min: 68900, max: 69900, amount: 900 },
	],
	'GOMZI NUTRITION': [
		{ min: 249500, max: 250500, amount: 1500 },
		{ min: 499500, max: 500500, amount: 3000 },
		{ min: 999500, max: 1000500, amount: 6000 },
		{ min: 1499500, max: 1500500, amount: 9000 },
		{ min: 2999500, max: 3000500, amount: 18000 },
	],
}

// Bonus config: { branch, count, bonusAmount }
const BONUS_CONFIG: Record<string, { count: number; bonusAmount: number }> = {
	'FG GROUP': { count: 5, bonusAmount: 3000 },
	FGIIT: { count: 5, bonusAmount: 3000 },
	'GOMZI NUTRITION': { count: 3, bonusAmount: 5000 },
	FWG: { count: 5, bonusAmount: 6000 },
}

function isBonusTriggered(
	requests: any[],
	salespersonId: string,
	branch: string,
	targetDate: string
): boolean {
	const branchUpper = (branch || '').toUpperCase()
	const config = BONUS_CONFIG[branchUpper] || BONUS_CONFIG['FG GROUP']
	if (!config) return false

	const sameDay = requests.filter((r: any) => {
		const rDate = new Date(r.createdAt).toDateString()
		const tDate = new Date(targetDate).toDateString()
		return (
			r.sales_person_employee_id === salespersonId &&
			(r.branch || '').toUpperCase() === branchUpper &&
			rDate === tDate
		)
	})
	return sameDay.length >= config.count
}

const statusBadge = (status: string) => {
	const map: Record<string, string> = {
		Pending: 'badge-light-warning',
		Approved: 'badge-light-success',
		Rejected: 'badge-light-danger',
	}
	return (
		<span className={`badge ${map[status] || 'badge-light-secondary'} fw-bold fs-7 px-3 py-2`}>
			{status}
		</span>
	)
}

const AutoCommissionRequestsPage: React.FC = () => {
	const [requests, setRequests] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>({ totalPages: 1 })
	const [adminType, setAdminType] = useState('')

	useEffect(() => {
		const storedAdmin = localStorage.getItem('admin')
		if (storedAdmin) setAdminType(storedAdmin)
	}, [])
	const [searchTerm, setSearchTerm] = useState(localStorage.getItem('auto_comm_searchTerm') || '')
	const [currentPage, setCurrentPage] = useState(
		Number(localStorage.getItem('auto_comm_currentPage')) || 1
	)
	const [itemsPerPage, setItemsPerPage] = useState(
		Number(localStorage.getItem('auto_comm_itemsPerPage')) || 10
	)
	const [statusFilter, setStatusFilter] = useState(
		localStorage.getItem('auto_comm_statusFilter') || 'All'
	)
	const [salesPersonFilter, setSalesPersonFilter] = useState(
		localStorage.getItem('auto_comm_salesPersonFilter') || 'All'
	)
	const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)
	const [loading, setLoading] = useState(false)

	// Persist filters to localStorage
	useEffect(() => {
		localStorage.setItem('auto_comm_searchTerm', searchTerm)
		localStorage.setItem('auto_comm_currentPage', String(currentPage))
		localStorage.setItem('auto_comm_itemsPerPage', String(itemsPerPage))
		localStorage.setItem('auto_comm_statusFilter', statusFilter)
		localStorage.setItem('auto_comm_salesPersonFilter', salesPersonFilter)
	}, [searchTerm, currentPage, itemsPerPage, statusFilter, salesPersonFilter])

	// Modal states
	const [approveModal, setApproveModal] = useState<any>(null)
	const [rejectModal, setRejectModal] = useState<any>(null)
	const [rejectReason, setRejectReason] = useState('')
	const [editAmount, setEditAmount] = useState<number | string>('')
	const [submitting, setSubmitting] = useState(false)

	const fetchRequests = async () => {
		setLoading(true)
		try {
			const query: any = {
				limit: 10000, // Fetch all requests for client-side filtering
			}

			const res: any = await getAutoCommissionRequests(query)
			if (res.data) {
				setRequests(res.data)
			}
		} catch (err: any) {
			toast.error(err?.message || 'Failed to fetch requests')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchRequests()
	}, [])

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1)
	}, [statusFilter, salesPersonFilter, dateRange])

	const resetFilters = () => {
		setSearchTerm('')
		setStatusFilter('All')
		setSalesPersonFilter('All')
		setDateRange(null)
		setCurrentPage(1)
		localStorage.removeItem('auto_comm_searchTerm')
		localStorage.removeItem('auto_comm_statusFilter')
		localStorage.removeItem('auto_comm_salesPersonFilter')
		localStorage.removeItem('auto_comm_currentPage')
	}

	const handleExport = async () => {
		try {
			setLoading(true)
			const query: any = {
				limit: 10000, // Export all
				search: searchTerm || undefined,
			}
			if (statusFilter !== 'All') query.status = statusFilter
			if (dateRange) {
				query.from_date = dateRange[0].toISOString()
				query.to_date = dateRange[1].toISOString()
			}

			const res: any = await getAutoCommissionRequests(query)
			if (res.data && res.data.length > 0) {
				const exportData = res.data.map((req: any, index: number) => ({
					'Sr No.': index + 1,
					'Invoice #': req.invoice_number,
					'Sales Person': req.sales_person_name,
					Branch: req.branch,
					'Invoice Amount': req.invoice_amount,
					'Client Name': req.client_name || '-',
					'Client Mobile': req.client_mobile || '-',
					'Commission Amount': req.commission_amount,
					Status: req.status,
					Date: new Date(req.createdAt).toLocaleDateString(),
					Reason: req.reason || '-',
				}))

				const ws = XLSX.utils.json_to_sheet(exportData)
				const wb = XLSX.utils.book_new()
				XLSX.utils.book_append_sheet(wb, ws, 'Commission Requests')
				XLSX.writeFile(wb, `Commission_Requests_${new Date().getTime()}.xlsx`)
				toast.success('Excel exported successfully')
			} else {
				toast.error('No data found to export')
			}
		} catch (err: any) {
			toast.error('Failed to export excel')
		} finally {
			setLoading(false)
		}
	}

	// Filter requests based on search and filters
	const filteredRequests = useMemo(() => {
		return requests.filter((req: any) => {
			if (searchTerm.trim()) {
				const query = searchTerm.toLowerCase()
				const matchesSearch =
					(req.invoice_number || '').toLowerCase().includes(query) ||
					(req.sales_person_name || '').toLowerCase().includes(query) ||
					(req.client_name || '').toLowerCase().includes(query) ||
					(req.branch || '').toLowerCase().includes(query)
				if (!matchesSearch) return false
			}

			if (statusFilter !== 'All' && req.status !== statusFilter) return false
			if (salesPersonFilter !== 'All' && req.sales_person_name !== salesPersonFilter) return false

			if (dateRange) {
				const reqDate = new Date(req.createdAt)
				const [startDate, endDate] = dateRange
				if (reqDate < startDate || reqDate > endDate) return false
			}

			return true
		})
	}, [requests, searchTerm, statusFilter, salesPersonFilter, dateRange])

	// Paginate filtered requests
	const paginatedRequests = useMemo(() => {
		return filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	}, [filteredRequests, currentPage, itemsPerPage])

	const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)

	const handleApprove = async () => {
		if (!approveModal) return
		setSubmitting(true)
		try {
			await updateAutoCommissionRequest({
				id: approveModal._id,
				status: 'Approved',
				commission_amount: Number(editAmount),
			})
			toast.success('Commission request approved! Employee wallet credited.')
			setApproveModal(null)
			fetchRequests()
		} catch (err: any) {
			toast.error(err?.message || 'Failed to approve')
		} finally {
			setSubmitting(false)
		}
	}

	const handleReject = async () => {
		if (!rejectModal) return
		if (!rejectReason.trim()) {
			toast.error('Please enter a rejection reason')
			return
		}
		setSubmitting(true)
		try {
			await updateAutoCommissionRequest({
				id: rejectModal._id,
				status: 'Rejected',
				reason: rejectReason,
			})
			toast.success('Commission request rejected.')
			setRejectModal(null)
			setRejectReason('')
			fetchRequests()
		} catch (err: any) {
			toast.error(err?.message || 'Failed to reject')
		} finally {
			setSubmitting(false)
		}
	}

	// Count today's approved requests by salesperson for bonus indicator
	const bonusMap = useMemo(() => {
		const map: Record<string, boolean> = {}
		requests.forEach((r: any) => {
			const key = `${r.sales_person_employee_id}_${r.branch}_${new Date(
				r.createdAt
			).toDateString()}`
			if (!map[key]) {
				map[key] = isBonusTriggered(requests, r.sales_person_employee_id, r.branch, r.createdAt)
			}
		})
		return map
	}, [requests])

	// Dynamic sales person options from actual data
	const salesPersonOptions = Array.from(
		new Set(
			requests
				.map((req: any) => req.sales_person_name)
				.filter((name: string | undefined | null): name is string => Boolean(name))
		)
	).sort((a, b) => a.localeCompare(b))

	const columns = [
		{ title: 'Inv. #', field: 'invoice_number' },
		{ title: 'Sales P.', field: 'sales_person_name' },
		{ title: 'Brand', field: 'branch' },
		{ title: 'Inv. Amt', field: 'invoice_amount' },
		{ title: 'Client Detail', field: 'client_name' },
		{ title: 'Comm.', field: 'commission_amount' },
		{ title: 'Sts.', field: 'status' },
		{ title: 'Date', field: 'date' },
		{ title: 'Action', field: 'action' },
	]

	// Pending count badge
	const pendingCount = filteredRequests.filter((r: any) => r.status === 'Pending').length

	return (
		<>
			<PageTitle breadcrumbs={[]}>Auto Commission Requests</PageTitle>

			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title d-flex align-items-center gap-3'>
						<h3 className='card-label fw-bold text-dark mb-0'>Auto Commission Requests</h3>
						{pendingCount > 0 && (
							<span className='badge badge-danger rounded-pill fs-8'>{pendingCount} Pending</span>
						)}
					</div>
					<div className='card-toolbar'>{/* Optional: Add export buttons here if needed */}</div>
				</div>

				<div className='card-body py-4'>
					<div className='d-flex align-items-center mb-4 flex-wrap gap-2'>
						<div className='w-250px'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>

						<button
							className='btn btn-primary btn-icon w-35px h-35px'
							onClick={handleExport}
							title='Download Excel'
							disabled={loading}>
							<FontAwesomeIcon icon={faDownload} />
						</button>

						<div className='w-250px'>
							<DateFilter
								onDateRangeChange={(val: any) => {
									setDateRange(val)
									setCurrentPage(1)
								}}
							/>
						</div>

						<LengthMenu
							expenseData={requests}
							handleItemsPerPageChange={(val: number) => {
								setItemsPerPage(val)
								setCurrentPage(1)
							}}
						/>

						{/* Status Filter */}
						<select
							className='form-select form-select-sm w-150px inputfield-bg'
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value)
								setCurrentPage(1)
							}}>
							<option value='All'>All Status</option>
							<option value='Pending'>Pending</option>
							<option value='Approved'>Approved</option>
							<option value='Rejected'>Rejected</option>
						</select>

						{/* Sales Person Filter */}
						<select
							className='form-select form-select-sm w-200px inputfield-bg'
							value={salesPersonFilter}
							onChange={(e) => {
								setSalesPersonFilter(e.target.value)
								setCurrentPage(1)
							}}>
							<option value='All'>All Sales Persons</option>
							{salesPersonOptions.map((name) => (
								<option
									key={name}
									value={name}>
									{name}
								</option>
							))}
						</select>
					</div>

					<div className='table-responsive'>
						<Table
							data={paginatedRequests}
							columns={columns}
							sort={'createdAt'}
							sortOrder={'desc'}
							onSortChange={() => {}}
							loading={loading}
							pagination={{ page: currentPage, itemsPerPage }}
							setPagination={() => {}}
							removeAction={true}
							visibleDetails={null}
							renderRow={(req: any, _index: number, actualIndex: number) => {
								const bonusKey = `${req.sales_person_employee_id}_${req.branch}_${new Date(
									req.createdAt
								).toDateString()}`
								const hasBonus = bonusMap[bonusKey]
								const displayIndex = (currentPage - 1) * itemsPerPage + _index + 1
								return (
									<tr key={req._id || actualIndex}>
										<td className='text-center'>
											<span className='text-dark fw-bold d-block fs-7'>{displayIndex}</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-7'>
												{req.invoice_number || '—'}
											</span>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-dark fw-bold fs-7'>
													{req.sales_person_name || '—'}
												</span>
												{hasBonus && (
													<span className='badge badge-light-primary fs-9 w-fit-content'>
														🎯 Bonus Eligible
													</span>
												)}
											</div>
										</td>
										<td>
											<span className='badge badge-light-info fw-semibold'>
												{req.branch || '—'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-7'>
												₹{(req.invoice_amount || 0).toLocaleString('en-IN')}
											</span>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-dark fw-bold fs-7'>
													{req.client_name || req.invoice?.name || '—'}
												</span>
												<span className='text-muted fs-8'>
													{req.client_mobile || req.invoice?.mobile || '—'}
												</span>
											</div>
										</td>
										<td>
											<span className='text-success fw-bold d-block fs-7'>
												₹{(req.commission_amount || 0).toLocaleString('en-IN')}
											</span>
										</td>
										<td>
											<div className='d-flex flex-column align-items-center'>
												{statusBadge(req.status)}
											</div>
										</td>
										<td>
											<span className='text-muted fw-semibold d-block fs-8'>
												{new Date(req.createdAt).toLocaleDateString('en-IN', {
													day: '2-digit',
													month: 'short',
													year: 'numeric',
												})}
												<br />
												<span className='fs-9 opacity-75'>
													{new Date(req.createdAt).toLocaleTimeString('en-IN', {
														hour: '2-digit',
														minute: '2-digit',
														hour12: true,
													})}
												</span>
											</span>
										</td>
										<td className='text-end'>
											{/* Admin Actions */}
											{req.status === 'Pending' && adminType !== 'Employee' ? (
												<div className='d-flex gap-2 justify-content-end'>
													<button
														className='btn btn-icon btn-bg-light btn-active-color-success btn-sm w-30px h-30px'
														onClick={() => {
															setApproveModal(req)
															setEditAmount(req.commission_amount)
														}}
														title='Approve'>
														<i className='bi bi-check-lg fs-4'></i>
													</button>
													<button
														className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm w-30px h-30px'
														onClick={() => {
															setRejectModal(req)
															setRejectReason('')
														}}
														title='Reject'>
														<i className='bi bi-x-lg fs-4'></i>
													</button>
												</div>
											) : (
												<div className='d-flex flex-column align-items-end justify-content-center h-100'>
													{req.reason ? (
														<span className='text-danger fs-7 fw-bold me-2'>{req.reason}</span>
													) : (
														<span className='text-muted fs-7 me-4'>—</span>
													)}
												</div>
											)}
										</td>
									</tr>
								)
							}}
						/>
					</div>

					{requests.length === 0 && !loading && (
						<div className='text-center py-10 text-muted'>
							<i className='bi bi-inbox fs-1 d-block mb-2'></i>
							No commission requests found
						</div>
					)}

					<UsersListPagination
						totalPages={totalPages}
						currentPage={currentPage}
						onPageChange={setCurrentPage}
					/>
				</div>
			</KTCard>

			{/* ── Approve Confirmation Modal ─────────────────────────────────────── */}
			{approveModal && (
				<div
					className='modal fade show d-block'
					style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content shadow-lg border-0'>
							<div className='modal-header border-0 pb-0'>
								<h3 className='modal-title fw-bolder text-gray-800 fs-3'>
									<i className='bi bi-shield-check text-success fs-2 me-2'></i>
									Approve Commission
								</h3>
								<div
									className='btn btn-icon btn-sm btn-active-light-primary ms-2'
									onClick={() => setApproveModal(null)}>
									<i className='bi bi-x fs-1'></i>
								</div>
							</div>
							<div className='modal-body py-5'>
								<div className='bg-light-primary rounded-4 p-5 mb-6 border border-dashed border-primary'>
									<div className='d-flex flex-stack mb-3 border-bottom border-gray-200 pb-2'>
										<span className='text-gray-600 fw-bold fs-7'>Invoice:</span>
										<span className='text-gray-900 fw-bolder fs-6'>
											#{approveModal.invoice_number}
										</span>
									</div>
									<div className='d-flex flex-stack mb-3 border-bottom border-gray-200 pb-2'>
										<span className='text-gray-600 fw-bold fs-7'>Sales Person:</span>
										<span className='text-gray-900 fw-bolder fs-6'>
											{approveModal.sales_person_name}
										</span>
									</div>
									<div className='d-flex flex-stack mb-3 border-bottom border-gray-200 pb-2'>
										<span className='text-gray-600 fw-bold fs-7'>Branch:</span>
										<span className='text-gray-900 fw-bolder fs-6'>{approveModal.branch}</span>
									</div>
									<div className='d-flex flex-stack'>
										<span className='text-gray-600 fw-bold fs-7'>Invoice Amount:</span>
										<span className='text-gray-900 fw-bolder fs-6 text-primary'>
											₹{(approveModal.invoice_amount || 0).toLocaleString('en-IN')}
										</span>
									</div>
								</div>

								<div className='fv-row'>
									<label className='form-label fw-bolder text-dark fs-6 mb-2'>
										Final Commission Amount (₹)
									</label>
									<div className='input-group input-group-solid border border-success rounded'>
										<span className='input-group-text bg-success-light'>
											<i className='bi bi-currency-rupee text-success fs-3'></i>
										</span>
										<input
											type='number'
											className='form-control form-control-solid fw-bold fs-3 text-success'
											value={editAmount}
											onChange={(e) => setEditAmount(e.target.value)}
											placeholder='0'
										/>
									</div>
									<p className='text-muted fs-8 mt-2 ms-1'>
										<i className='bi bi-info-circle fs-9 me-1'></i>
										Review or adjust the automated calculation if necessary.
									</p>
								</div>
							</div>
							<div className='modal-footer border-0 pt-0'>
								<button
									className='btn btn-light fw-bold px-6 py-3'
									onClick={() => setApproveModal(null)}
									disabled={submitting}>
									Cancel
								</button>
								<button
									className='btn btn-success fw-bold px-8 py-3'
									onClick={handleApprove}
									disabled={submitting}>
									{!submitting ? (
										<span>Confirm & Approve</span>
									) : (
										<span className='indicator-progress d-block'>
											Processing...
											<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
										</span>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ── Reject Modal ───────────────────────────────────────────────────── */}
			{rejectModal && (
				<div
					className='modal fade show d-block'
					style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content shadow-lg border-0'>
							<div className='modal-header border-0 pb-0'>
								<h3 className='modal-title fw-bolder text-gray-800 fs-3'>
									<i className='bi bi-shield-x text-danger fs-2 me-2'></i>
									Reject Commission
								</h3>
								<div
									className='btn btn-icon btn-sm btn-active-light-primary ms-2'
									onClick={() => setRejectModal(null)}>
									<i className='bi bi-x fs-1'></i>
								</div>
							</div>
							<div className='modal-body py-5'>
								<div className='bg-light-danger rounded-4 p-5 mb-6 border border-dashed border-danger'>
									<div className='d-flex flex-stack mb-3 border-bottom border-gray-200 pb-2'>
										<span className='text-gray-600 fw-bold fs-7'>Sales Person:</span>
										<span className='text-gray-900 fw-bolder fs-6'>
											{rejectModal.sales_person_name}
										</span>
									</div>
									<div className='d-flex flex-stack'>
										<span className='text-gray-600 fw-bold fs-7'>Commission:</span>
										<span className='text-gray-900 fw-bolder fs-6 text-danger'>
											₹{(rejectModal.commission_amount || 0).toLocaleString('en-IN')}
										</span>
									</div>
								</div>

								<div className='fv-row'>
									<label className='form-label fw-bolder text-dark fs-6 mb-2 required'>
										Reason for Rejection
									</label>
									<textarea
										className='form-control form-control-solid border-danger border-opacity-25'
										rows={4}
										placeholder='Please provide a reason for rejecting this commission...'
										value={rejectReason}
										onChange={(e) => setRejectReason(e.target.value)}
									/>
									<p className='text-muted fs-8 mt-2 ms-1'>
										<i className='bi bi-exclamation-triangle fs-9 me-1'></i>
										This reason will be visible to the employee.
									</p>
								</div>
							</div>
							<div className='modal-footer border-0 pt-0'>
								<button
									className='btn btn-light fw-bold px-6 py-3'
									onClick={() => setRejectModal(null)}
									disabled={submitting}>
									Cancel
								</button>
								<button
									className='btn btn-danger fw-bold px-8 py-3'
									onClick={handleReject}
									disabled={submitting}>
									{!submitting ? (
										<span>Reject Request</span>
									) : (
										<span className='indicator-progress d-block'>
											Processing...
											<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
										</span>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default AutoCommissionRequestsPage
