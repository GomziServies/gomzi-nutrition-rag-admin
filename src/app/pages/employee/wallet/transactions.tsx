import {
	faBuildingColumns,
	faCoins,
	faDownload,
	faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import {
	CreateWithdrawalRequest,
	getProfile,
	GetWalletTransactions,
} from '../../../Functions/FGGroup/AccountFunctions'

export const Transactions: React.FC = () => {
	const [transactions, setTransactions] = useState<any[]>([])
	const [totalBalance, setTotalBalance] = useState(0)
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [typeFilter, setTypeFilter] = useState('All')
	const [statusFilter, setStatusFilter] = useState('All')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [sort, setSort] = useState('date')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [withdrawAmount, setWithdrawAmount] = useState('')
	const [withdrawDate, setWithdrawDate] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [bankDetails, setBankDetails] = useState({
		bankName: '',
		accountNumber: '',
		ifscCode: '',
	})

	const fetchProfileData = async () => {
		try {
			const response: any = await getProfile()
			// APIGet resolves with response.data (the body), so 'response' here is the body
			// The body has a 'data' field which contains the admin/employee record
			const rawData = response?.data || response
			const profile = Array.isArray(rawData) ? rawData[0] : rawData
			const emp = profile?.employee || profile
			const details = emp?.account_details || emp

			if (details && (details.bank_name || details.account_number || details.IFSC)) {
				setBankDetails({
					bankName: details.bank_name || 'N/A',
					accountNumber: details.account_number || 'N/A',
					ifscCode: details.IFSC || 'N/A',
				})
			} else {
				setBankDetails({
					bankName: 'N/A',
					accountNumber: 'N/A',
					ifscCode: 'N/A',
				})
			}
		} catch (error) {
			console.error('Error fetching profile:', error)
			setBankDetails({
				bankName: 'Error',
				accountNumber: 'Error',
				ifscCode: 'Error',
			})
		}
	}

	const fetchTransactions = async () => {
		setLoading(true)
		try {
			const pageSize = 100
			const params: any = {
				page: 1,
				limit: pageSize,
			}

			const firstResponse: any = await GetWalletTransactions(params)
			if (firstResponse.status === 200) {
				const paginationMeta = firstResponse?.metadata?.pagination || {}
				const totalPages = Number(paginationMeta.totalPages || 1)
				let allTransactions = Array.isArray(firstResponse.data) ? [...firstResponse.data] : []

				for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
					const nextResponse: any = await GetWalletTransactions({
						page: currentPage,
						limit: pageSize,
					})
					if (Array.isArray(nextResponse.data)) {
						allTransactions = allTransactions.concat(nextResponse.data)
					}
				}

				allTransactions.sort((a: any, b: any) => {
					const aTime = new Date(a?.date || 0).getTime()
					const bTime = new Date(b?.date || 0).getTime()
					return bTime - aTime
				})

				setTransactions(allTransactions)
				setTotalBalance(firstResponse.metadata?.total_balance || 0)
			}
		} catch (error) {
			console.error('Error fetching transactions:', error)
			toast.error('Failed to load transactions')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchProfileData()
		fetchTransactions()
	}, [])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [typeFilter, statusFilter, selectedDateRange])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}, [searchTerm])

	const sortableFields = [
		{ title: 'Type', field: 'type' },
		{ title: 'Amount', field: 'amount' },
		{ title: 'Date', field: 'date' },
		{ title: 'Description', field: 'description' },
		{ title: 'Reason', field: 'reason' },
		{ title: 'Status', field: 'status' },
	]

	const getSortValue = (txn: any, field: string) => {
		switch (field) {
			case 'type':
				return txn.type || ''
			case 'amount':
				return Number(txn.amount || 0)
			case 'date':
				return new Date(txn.date).getTime()
			case 'description':
				return txn.description || ''
			case 'reason':
				return txn.reason || ''
			case 'status':
				return txn.status || ''
			default:
				return ''
		}
	}

	const filteredTransactions = transactions
		.filter((txn: any) => {
			if (searchTerm.trim()) {
				const query = searchTerm.toLowerCase()
				const matchesSearch =
					(txn.description || '').toLowerCase().includes(query) ||
					(txn.reason || '').toLowerCase().includes(query) ||
					(txn.status || '').toLowerCase().includes(query) ||
					(txn.type || '').toLowerCase().includes(query)
				if (!matchesSearch) return false
			}

			if (typeFilter !== 'All' && txn.type !== typeFilter) return false

			if (statusFilter !== 'All' && txn.status !== statusFilter) return false

			if (selectedDateRange) {
				const txnDate = new Date(txn.date)
				const [startDate, endDate] = selectedDateRange
				if (txnDate < startDate || txnDate > endDate) return false
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

	const paginatedTransactions = filteredTransactions.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const totalPages = Math.ceil(filteredTransactions.length / pagination.itemsPerPage)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const downloadExcel = () => {
		setExporting(true)
		try {
			const worksheetData = filteredTransactions.map((txn: any) => ({
				Type: txn.type || 'N/A',
				Amount: txn.amount ?? 'N/A',
				Date: new Date(txn.date).toLocaleString('en-GB', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					hour12: true,
				}),
				Description: txn.description || 'N/A',
				Reason: txn.reason || '-',
				Status: txn.status || 'N/A',
			}))

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
			XLSX.writeFile(workbook, 'Transactions.xlsx')
			toast.success('Excel file downloaded successfully')
		} catch (error) {
			console.error('Error exporting transactions:', error)
			toast.error('Failed to export transactions')
		} finally {
			setExporting(false)
		}
	}

	const handleWithdrawalRequest = async () => {
		if (!withdrawAmount || Number(withdrawAmount) <= 0) {
			toast.error('Please enter a valid amount')
			return
		}

		if (totalBalance <= 0) {
			toast.error('No balance available for withdrawal')
			return
		}

		if (Number(withdrawAmount) > totalBalance) {
			toast.error(`Maximum withdrawable amount is ₹${Math.max(0, totalBalance)}`)
			return
		}

		setIsSubmitting(true)
		try {
			const data = {
				amount: Number(withdrawAmount),
				date: new Date().toISOString(),
			}
			const response: any = await CreateWithdrawalRequest(data)
			if (response.status === 200) {
				toast.success(response.message || 'Withdrawal request submitted successfully')
				setIsModalOpen(false)
				setWithdrawAmount('')
				setWithdrawDate('')
				fetchTransactions() // Refresh transactions and balance
			} else {
				toast.error(response.message || 'Failed to submit request')
			}
		} catch (error: any) {
			toast.error(error?.response?.data?.message || 'Something went wrong')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Transactions</PageTitle>
			<div className='row g-5 g-xl-8 mb-5'>
				{/* Balance Card UI */}
				<div className='col-md-6 col-xl-5'>
					<div
						className='card border-0 mb-xl-8 shadow-sm h-100'
						style={{
							background: 'linear-gradient(135deg, #7A5AF8 0%, #4E36C5 100%)',
							color: '#fff',
							borderRadius: '16px',
							position: 'relative',
							overflow: 'hidden',
						}}>
						{/* Decorative circles */}
						<div
							style={{
								position: 'absolute',
								top: '-20px',
								right: '-20px',
								width: '150px',
								height: '150px',
								borderRadius: '50%',
								background: 'rgba(255, 255, 255, 0.1)',
							}}></div>
						<div
							style={{
								position: 'absolute',
								bottom: '-40px',
								right: '40px',
								width: '100px',
								height: '100px',
								borderRadius: '50%',
								background: 'rgba(255, 255, 255, 0.1)',
							}}></div>

						<div
							className='card-body d-flex flex-column justify-content-center p-8'
							style={{ zIndex: 1 }}>
							<div className='d-flex align-items-center mb-5'>
								<div className='symbol symbol-50px me-5'>
									<span className='symbol-label bg-white bg-opacity-10'>
										<FontAwesomeIcon
											icon={faCoins}
											className='text-white fs-2x'
										/>
									</span>
								</div>
								<span className='text-white fw-semibold fs-4'>Available Balance</span>
							</div>

							<div>
								<span className='text-white fw-bolder fs-2x ps-7'>
									₹ {totalBalance.toLocaleString()}
								</span>
							</div>
						</div>
					</div>
				</div>
				{/* Bank Details UI */}
				<div className='col-md-6 col-xl-7'>
					<div className='card h-100 mb-xl-8 shadow-sm'>
						<div className='card-header border-0 pt-5'>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold fs-3 mb-1'>Bank Details</span>
								<span className='text-muted mt-1 fw-semibold fs-7'>
									Where you receive your payouts
								</span>
							</h3>
						</div>
						<div className='card-body d-flex flex-column justify-content-center'>
							<div className='d-flex flex-stack mb-7'>
								<div className='d-flex align-items-center me-3'>
									<div className='symbol symbol-50px symbol-light-info me-5'>
										<span className='symbol-label'>
											<FontAwesomeIcon
												icon={faBuildingColumns}
												className='text-info fs-1'
											/>
										</span>
									</div>
									<div className='d-flex flex-column'>
										<span className='text-gray-800 fw-bold fs-4'>
											{bankDetails.bankName || 'Loading...'}
										</span>
										<span className='text-muted fw-semibold fs-6 mt-1'>Bank Name</span>
									</div>
								</div>
							</div>

							<div className='row g-0'>
								<div className='col-6'>
									<div className='d-flex flex-column'>
										<span className='text-muted fw-semibold fs-7 mb-1'>Account Number</span>
										<span className='text-gray-800 fw-bold fs-5'>
											{bankDetails.accountNumber || 'Loading...'}
										</span>
									</div>
								</div>
								<div className='col-6'>
									<div className='d-flex flex-column text-end'>
										<span className='text-muted fw-semibold fs-7 mb-1'>IFSC Code</span>
										<span className='text-gray-800 fw-bold fs-5'>
											{bankDetails.ifscCode || 'Loading...'}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<KTCard>
				<div className='card-header border-0 pt-6 flex-wrap'>
					<div className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold fs-3 mb-1'>All Transactions</span>
						<span className='text-muted mt-1 fw-semibold fs-7'>
							Complete ledger of all credits, debits, and payouts
						</span>
					</div>
					<div className='card-toolbar'>
						<button
							className='btn btn-light-primary fw-bold'
							onClick={() => setIsModalOpen(true)}>
							<FontAwesomeIcon
								icon={faMoneyBillWave}
								className='me-2'
							/>
							Withdrawal
						</button>
					</div>
					<div className='card-toolbar w-100 mt-4'>
						<div className='d-flex align-items-end justify-content-between w-100 flex-wrap gap-3'>
							<div className='d-flex align-items-end flex-wrap gap-3'>
								<div className='w-250px'>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={setSearchTerm}
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
									expenseData={filteredTransactions}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
								<div className='w-200px'>
									<select
										className='form-select form-select-solid w-200px'
										value={typeFilter}
										onChange={(e) => setTypeFilter(e.target.value)}>
										<option value='All'>All Types</option>
										<option value='Credit'>Credit</option>
										<option value='Debit'>Debit</option>
									</select>
								</div>
								<div className='w-200px'>
									<select
										className='form-select form-select-solid w-200px'
										value={statusFilter}
										onChange={(e) => setStatusFilter(e.target.value)}>
										<option value='All'>All Status</option>
										<option value='Completed'>Completed</option>
										<option value='Pending'>Pending</option>
										<option value='Failed'>Failed</option>
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
					</div>{' '}
				</div>{' '}
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={paginatedTransactions}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(txn: any, index: number) => (
								<tr key={txn._id || index}>
									<td className='text-center'>
										<span className='text-dark fw-bold d-block fs-7'>
											{(pagination.page - 1) * pagination.itemsPerPage + index + 1}
										</span>
									</td>
									<td>
										<span
											className={`badge badge-light-${
												txn.type === 'Credit' ? 'success' : 'danger'
											}`}>
											{txn.type}
										</span>
									</td>
									<td>
										<span
											className={`fw-bold d-block fs-6 ${
												txn.type === 'Credit' ? 'text-success' : 'text-danger'
											}`}>
											{txn.type === 'Credit' ? '+' : '-'} ₹ {txn.amount.toLocaleString()}
										</span>
									</td>
									<td>
										<span className='text-dark fw-semibold d-block fs-7'>
											{new Date(txn.date).toLocaleString('en-GB', {
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
										<span className='text-muted fw-semibold d-block fs-7'>{txn.description}</span>
									</td>
									<td>
										<span className='text-muted fw-semibold d-block fs-7'>
											{txn.reason ? txn.reason : '-'}
										</span>
									</td>
									<td>
										<span
											className={`badge badge-light-${
												txn.status === 'Completed'
													? 'success'
													: txn.status === 'Failed'
													? 'danger'
													: 'warning'
											}`}>
											{txn.status}
										</span>
									</td>
								</tr>
							)}
							visibleDetails={null}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
							removeAction={true}
						/>
					</div>
					{filteredTransactions.length > 0 && (
						<UsersListPagination
							totalPages={totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
					{filteredTransactions.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No transactions found</b>
						</div>
					)}
				</div>
			</KTCard>

			{isModalOpen && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h3 className='modal-title fw-bold'>Withdrawal Request</h3>
								<button
									type='button'
									className='btn-close'
									onClick={() => setIsModalOpen(false)}></button>
							</div>
							<div className='modal-body'>
								<div className='mb-5'>
									<label className='form-label fw-bold'>Amount (₹)</label>
									<input
										type='number'
										className='form-control form-control-solid'
										placeholder='Enter withdrawal amount'
										value={withdrawAmount}
										onChange={(e) => setWithdrawAmount(e.target.value)}
									/>
									<div className='text-danger fs-7 mt-2'>
										{totalBalance > 0 ? (
											<>
												You can withdraw up to{' '}
												<b className='text-danger'>₹ {totalBalance.toLocaleString()}</b>.
											</>
										) : (
											<b className='text-danger'>
												You cannot withdraw because your wallet balance is ₹0.
											</b>
										)}
									</div>
								</div>
							</div>
							<div className='modal-footer'>
								<button
									type='button'
									className='btn btn-light'
									onClick={() => setIsModalOpen(false)}
									disabled={isSubmitting}>
									Cancel
								</button>
								<button
									type='button'
									className='btn btn-primary'
									onClick={handleWithdrawalRequest}
									disabled={isSubmitting}>
									{isSubmitting ? (
										<span
											className='indicator-progress'
											style={{ display: 'block' }}>
											Please wait...{' '}
											<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
										</span>
									) : (
										'Submit Request'
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

export default Transactions
