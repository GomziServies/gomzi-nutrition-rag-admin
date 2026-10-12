import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { GetWithdrawalRequests, UpdateWithdrawalRequest } from '../../../Functions/FGGroup/AccountFunctions'

export const WithdrawalRequests: React.FC = () => {
	const [requests, setRequests] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [selectedAction, setSelectedAction] = useState<{ id: string; action: 'Approve' | 'Reject' } | null>(null)
	const [rejectMessage, setRejectMessage] = useState('')
	const [searchQuery, setSearchQuery] = useState('')
	const [employeeNameFilter, setEmployeeNameFilter] = useState('All')
	const [statusFilter, setStatusFilter] = useState('All')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [sort, setSort] = useState('requestDate')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })

	const buildRequestParams = (page: number, limit: number) => {
		const params: any = {
			page,
			limit,
			sort,
			sortOrder,
		}

		if (searchQuery.trim()) {
			params.search = searchQuery.trim()
		}

		if (statusFilter !== 'All') {
			params.status = statusFilter
		}

		if (employeeNameFilter !== 'All') {
			params.employeeName = employeeNameFilter
		}

		if (selectedDateRange) {
			params.from_date = selectedDateRange[0].toISOString()
			params.to_date = selectedDateRange[1].toISOString()
		}

		return params
	}

	const columns = [
		{ title: 'Employee Name', field: 'employeeName' },
		{ title: 'Amount', field: 'amount' },
		{ title: 'Date', field: 'requestDate' },
		{ title: 'Status', field: 'status' },
		{ title: 'Message (Reason)', field: 'reason' },
	]

	const fetchRequests = async () => {
		setLoading(true)
		try {
			const pageSize = 100
			const firstResponse: any = await GetWithdrawalRequests(buildRequestParams(1, pageSize))
			if (firstResponse.status === 200) {
				const paginationMeta = firstResponse?.metadata?.pagination || {}
				const totalPages = Number(paginationMeta.totalPages || 1)
				let allRows = Array.isArray(firstResponse.data) ? [...firstResponse.data] : []

				for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
					const nextResponse: any = await GetWithdrawalRequests(buildRequestParams(currentPage, pageSize))
					if (Array.isArray(nextResponse.data)) {
						allRows = allRows.concat(nextResponse.data)
					}
				}

				allRows.sort((a: any, b: any) => {
					const aTime = new Date(a?.requestDate || 0).getTime()
					const bTime = new Date(b?.requestDate || 0).getTime()
					return bTime - aTime
				})

				setRequests(allRows)
			}
		} catch (error) {
			console.error('Error fetching withdrawal requests:', error)
			toast.error('Failed to load withdrawal requests')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchRequests()
	}, [searchQuery, employeeNameFilter, statusFilter, selectedDateRange, sort, sortOrder])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [statusFilter, employeeNameFilter, selectedDateRange])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchQuery.trim() || searchQuery === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}, [searchQuery])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [employeeNameFilter])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const getSortValue = (req: any, field: string) => {
		switch (field) {
			case 'employeeName':
				return req.employeeName || ''
			case 'employeeCode':
				return req.employeeCode || ''
			case 'amount':
				return Number(req.amount || 0)
			case 'requestDate':
				return new Date(req.requestDate).getTime()
			case 'status':
				return req.status || ''
			case 'reason':
				return req.reason || ''
			default:
				return ''
		}
	}

	const filteredRequests = requests
		.filter((req: any) => {
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase()
				const matchesSearch =
					(req.employeeName || '').toLowerCase().includes(query) ||
					(req.employeeCode || '').toLowerCase().includes(query) ||
					(req.reason || '').toLowerCase().includes(query) ||
					(req.status || '').toLowerCase().includes(query)
				if (!matchesSearch) return false
			}

			if (statusFilter !== 'All' && req.status !== statusFilter) return false

			if (employeeNameFilter !== 'All' && req.employeeName !== employeeNameFilter) return false

			if (selectedDateRange) {
				const requestDate = new Date(req.requestDate)
				const [startDate, endDate] = selectedDateRange
				if (requestDate < startDate || requestDate > endDate) return false
			}

			return true
		})
		.sort((a: any, b: any) => {
			const aValue = getSortValue(a, sort)
			const bValue = getSortValue(b, sort)

			if (typeof aValue === 'string') {
				return sortOrder === 'desc'
					? (bValue as string).localeCompare(aValue as string)
					: (aValue as string).localeCompare(bValue as string)
			}

			return sortOrder === 'desc'
				? (bValue as number) - (aValue as number)
				: (aValue as number) - (bValue as number)
		})

	const paginatedRequests = filteredRequests.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const totalPages = Math.ceil(filteredRequests.length / pagination.itemsPerPage)
	const employeeNameOptions = Array.from(
		new Set(
			requests
				.map((req: any) => req.employeeName)
				.filter((name: string | undefined | null): name is string => Boolean(name))
		)
	).sort((a, b) => a.localeCompare(b))

	const downloadExcel = () => {
		setExporting(true)
		try {
			const worksheetData = filteredRequests.map((req: any) => ({
				'Employee Name': req.employeeName || 'N/A',
				Amount: req.amount ?? 'N/A',
				Date: new Date(req.requestDate).toLocaleString('en-GB', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					hour12: true,
				}),
				Status: req.status || 'N/A',
				Reason: req.reason || '-',
			}))

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Withdrawal Requests')
			XLSX.writeFile(workbook, 'WithdrawalRequests.xlsx')
			toast.success('Excel file downloaded successfully')
		} catch (error) {
			console.error('Error exporting withdrawal requests:', error)
			toast.error('Failed to export withdrawal requests')
		} finally {
			setExporting(false)
		}
	}

	const openConfirmModal = (id: string, action: 'Approve' | 'Reject') => {
		setSelectedAction({ id, action })
		setRejectMessage('')
		setShowModal(true)
	}

	const handleConfirm = async () => {
		if (selectedAction?.action === 'Reject' && !rejectMessage.trim()) {
			toast.error('Please provide a reason for rejecting this request.')
			return
		}

		if (selectedAction) {
			try {
				const data = {
					id: selectedAction.id,
					status: selectedAction.action === 'Approve' ? 'Approved' : 'Rejected',
					reason: selectedAction.action === 'Reject' ? rejectMessage : '',
				}
				const response: any = await UpdateWithdrawalRequest(data)
				if (response.status === 200) {
					toast.success(response.message || `Request ${selectedAction.action.toLowerCase()}d successfully`)
					fetchRequests()
				} else {
					toast.error(response.message || 'Failed to update request')
				}
			} catch (error: any) {
				toast.error(error?.response?.data?.message || 'Something went wrong')
			}
		}
		setShowModal(false)
		setSelectedAction(null)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Withdrawal Requests</PageTitle>

			<KTCard>
				<div className='card-header border-0 pt-5 d-flex flex-column align-items-start'>
					<div className='d-flex align-items-end justify-content-between w-100 mb-4 flex-wrap gap-3'>
						<div className='d-flex align-items-end flex-wrap gap-3'>
							<div className='w-250px'>
								<SearchFilter
									searchTerm={searchQuery}
									setSearchTerm={setSearchQuery}
								/>
							</div>
							<button
								className='btn btn-primary btn-icon'
								onClick={downloadExcel}
								disabled={loading || exporting}>
								<FontAwesomeIcon
									icon={faDownload}
									className='fs-3'
								/>
							</button>
							<LengthMenu
								expenseData={filteredRequests}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
							<div className='w-200px'>
								<select
									className='form-select form-select-solid w-200px'
									value={employeeNameFilter}
									onChange={(e) => setEmployeeNameFilter(e.target.value)}>
									<option value='All'>All Employees</option>
									{employeeNameOptions.map((name) => (
										<option
											key={name}
											value={name}>
											{name}
										</option>
									))}
								</select>
							</div>
							<div className='w-200px'>
								<select
									className='form-select form-select-solid w-200px'
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}>
									<option value='All'>All Status</option>
									<option value='Pending'>Pending</option>
									<option value='Approved'>Approved</option>
									<option value='Rejected'>Rejected</option>
								</select>
							</div>
							<div className='w-250px'>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='card-body py-3'>
					<div className='table-responsive'>
						<Table
							data={paginatedRequests}
							columns={columns}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={(field, order) => {
								setSort(field)
								setSortOrder(order)
							}}
							loading={loading}
							pagination={pagination}
							setPagination={setPagination}
							visibleDetails={null}
							removeAction={false}
							renderRow={(req, index, actualIndex) => (
								<tr key={req.id}>
									<td className='text-center'>{actualIndex}</td>
									<td>
										<span className='text-dark fw-bold text-hover-primary fs-6'>
											{req.employeeName}
										</span>
									</td>
									<td>
										<span className='text-dark fw-bold d-block fs-6'>₹ {req.amount}</span>
									</td>
									<td>
										<span className='text-dark fw-semibold d-block fs-7'>
											{new Date(req.requestDate).toLocaleString('en-GB', {
												day: '2-digit',
												month: 'short',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
												hour12: true,
											})}
										</span>
									</td>
									<td>
										<span
											className={`badge badge-light-${
												req.status === 'Approved'
													? 'success'
													: req.status === 'Rejected'
													? 'danger'
													: 'warning'
											}`}>
											{req.status}
										</span>
									</td>
									<td>
										<span
											className='text-muted fs-7 d-block'
											style={{ maxWidth: '250px', whiteSpace: 'normal' }}>
											{req.reason ? req.reason : '-'}
										</span>
									</td>
									<td className='text-start'>
										{req.status === 'Pending' ? (
											<>
												<button
													onClick={() => openConfirmModal(req._id, 'Approve')}
													className='btn btn-icon btn-bg-light btn-active-color-success btn-sm me-2'
													title='Approve'>
													<i className='bi bi-check-lg fs-3 text-success'></i>
												</button>
												<button
													onClick={() => openConfirmModal(req._id, 'Reject')}
													className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
													title='Reject'>
													<i className='bi bi-x-lg fs-3 text-danger'></i>
												</button>
											</>
										) : (
											<span className='text-muted fs-7 fw-semibold'>Processed</span>
										)}
									</td>
								</tr>
							)}
						/>
					</div>
					{filteredRequests.length > 0 && (
						<UsersListPagination
							totalPages={totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
					{filteredRequests.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
				</div>
			</KTCard>

			{/* Confirmation Modal */}
			{showModal && (
				<div
					className='modal fade show d-block'
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title fw-bold'>Confirm Action</h5>
								<div
									className='btn btn-icon btn-sm btn-active-light-primary ms-auto'
									onClick={() => setShowModal(false)}>
									<i className='ki-duotone ki-cross fs-2x'>
										<span className='path1'></span>
										<span className='path2'></span>
									</i>
								</div>
							</div>
							<div className='modal-body'>
								<p>
									Are you sure you want to{' '}
									<strong
										className={
											selectedAction?.action === 'Reject' ? 'text-danger' : 'text-success'
										}>
										{selectedAction?.action}
									</strong>{' '}
									the request?
								</p>

								{selectedAction?.action === 'Reject' && (
									<div className='mt-5'>
										<label className='form-label fw-semibold text-gray-700'>
											Reason for Rejection <span className='text-danger'>*</span>
										</label>
										<textarea
											className='form-control form-control-solid'
											rows={3}
											placeholder='Type a message to inform the employee why their request was rejected...'
											value={rejectMessage}
											onChange={(e) => setRejectMessage(e.target.value)}></textarea>
										<div className='text-muted fs-8 mt-2'>
											This message will be sent to the employee.
										</div>
									</div>
								)}
							</div>
							<div className='modal-footer'>
								<button
									type='button'
									className='btn btn-light'
									onClick={() => setShowModal(false)}>
									Cancel
								</button>
								<button
									type='button'
									className={`btn btn-${
										selectedAction?.action === 'Approve' ? 'success' : 'danger'
									}`}
									onClick={handleConfirm}>
									Yes, {selectedAction?.action}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default WithdrawalRequests
