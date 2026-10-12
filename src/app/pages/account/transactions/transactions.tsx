import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import Table from '../../../components/Table'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetAllTransactions } from '../../../Functions/FGGroup/AccountFunctions'

export const Transactions: React.FC = () => {
	const [typeFilter, setTypeFilter] = useState('All')
	const [employeeNameFilter, setEmployeeNameFilter] = useState('All')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [sort, setSort] = useState('date')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [transactions, setTransactions] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)

	const buildTransactionParams = (page: number, limit: number) => {
		const params: any = {
			page,
			limit,
			sort,
			sortOrder,
		}

		if (searchQuery.trim()) {
			params.search = searchQuery.trim()
		}

		if (selectedDateRange) {
			params.from_date = selectedDateRange[0].toISOString()
			params.to_date = selectedDateRange[1].toISOString()
		}

		if (typeFilter !== 'All') {
			params.type = typeFilter
		}

		if (employeeNameFilter !== 'All') {
			params.employeeName = employeeNameFilter
		}

		return params
	}

	const fetchTransactions = async () => {
		setLoading(true)
		try {
			const pageSize = 100
			const firstResponse: any = await GetAllTransactions(buildTransactionParams(1, pageSize))

			if (firstResponse.status === 200) {
				const paginationMeta = firstResponse?.metadata?.pagination || {}
				const totalPages = Number(paginationMeta.totalPages || 1)
				let allRows = Array.isArray(firstResponse.data) ? [...firstResponse.data] : []

				for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
					const nextResponse: any = await GetAllTransactions(
						buildTransactionParams(currentPage, pageSize)
					)
					if (Array.isArray(nextResponse.data)) {
						allRows = allRows.concat(nextResponse.data)
					}
				}

				// Keep newest rows on top by default.
				allRows.sort((a: any, b: any) => {
					const aTime = new Date(a?.date || 0).getTime()
					const bTime = new Date(b?.date || 0).getTime()
					return bTime - aTime
				})

				setTransactions(allRows)
			}
		} catch (error) {
			console.error('Error fetching transactions:', error)
			toast.error('Failed to load transactions')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchTransactions()
	}, [searchQuery, selectedDateRange, sort, sortOrder, typeFilter, employeeNameFilter])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [typeFilter, employeeNameFilter, selectedDateRange])

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

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const getSortValue = (txn: any, field: string) => {
		switch (field) {
			case 'employeeName':
				return txn.employeeName || ''
			case 'date':
				return new Date(txn.date).getTime()
			case 'amount':
				return Number(txn.amount || 0)
			case 'type':
				return txn.type || ''
			default:
				return ''
		}
	}

	const filteredTransactions = transactions
		.filter((txn: any) => {
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase()
				const matchesSearch =
					(txn.employeeName || '').toLowerCase().includes(query) ||
					(txn.type || '').toLowerCase().includes(query)
				if (!matchesSearch) return false
			}

			if (typeFilter !== 'All' && txn.type !== typeFilter) return false

			if (employeeNameFilter !== 'All' && txn.employeeName !== employeeNameFilter) return false

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
	const employeeNameOptions = Array.from(
		new Set(
			transactions
				.map((txn: any) => txn.employeeName)
				.filter((name: string | undefined | null): name is string => Boolean(name))
		)
	).sort((a, b) => a.localeCompare(b))

	const downloadExcel = () => {
		setExporting(true)
		try {
			const worksheetData = filteredTransactions.map((txn: any) => ({
				'Employee Name': txn.employeeName || 'N/A',
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
			}))

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
			XLSX.writeFile(workbook, 'AccountTransactions.xlsx')
			toast.success('Excel file downloaded successfully')
		} catch (error) {
			console.error('Error exporting transactions:', error)
			toast.error('Failed to export transactions')
		} finally {
			setExporting(false)
		}
	}

	const columns = [
		{ title: 'Employee Name', field: 'employeeName' },
		{ title: 'Date', field: 'date' },
		{ title: 'Amount', field: 'amount' },
		{ title: 'Type', field: 'type' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Transactions</PageTitle>

			<div className='d-flex flex-column gap-5'>
				<KTCard>
					<div className='card-header border-0 pt-5 d-flex flex-column align-items-start'>
						<div className='d-flex align-items-center justify-content-between w-100 mb-4 flex-wrap gap-3'>
							<div className='d-flex align-items-center flex-wrap gap-3'>
								<SearchFilter
									searchTerm={searchQuery}
									setSearchTerm={setSearchQuery}
								/>
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
								<select
									className='form-select form-select-solid w-125px'
									value={typeFilter}
									onChange={(e) => setTypeFilter(e.target.value)}>
									<option value='All'>All Types</option>
									<option value='Credit'>Credit</option>
									<option value='Debit'>Debit</option>
								</select>
								<select
									className='form-select form-select-solid w-200px'
									value={employeeNameFilter}
									onChange={(e) => setEmployeeNameFilter(e.target.value)}>
									<option value='All'>All Employees</option>
									{employeeNameOptions.map((name) => (
										<option key={name} value={name}>
											{name}
										</option>
									))}
								</select>
								<div className='w-250px'>
									<DateFilter
										onDateRangeChange={handleDateRangeChange}
										leftValue='-600px'
									/>
								</div>
							</div>
						</div>
					</div>
					<div className='card-body py-3'>
						<div className='table-responsive'>
							<Table
								data={paginatedTransactions}
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
								manualSearch={''}
								removeAction={true}
								renderRow={(txn, index, actualIndex) => (
									<tr key={txn.id + index}>
										<td className='text-center'>{actualIndex}</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary fs-6'>{txn.employeeName}</span>
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
											<span
												className={`fw-bold d-block fs-6 ${
													txn.type === 'Credit' ? 'text-success' : 'text-danger'
												}`}>
												{txn.type === 'Credit' ? '+' : '-'} ₹ {txn.amount}
											</span>
										</td>
										<td>
											<span className={`badge badge-light-${txn.type === 'Credit' ? 'success' : 'danger'}`}>
												{txn.type}
											</span>
										</td>
									</tr>
								)}
							/>
						</div>
						{filteredTransactions.length === 0 && !loading && (
							<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
								<b>No transactions found matching your criteria.</b>
							</div>
						)}
						{filteredTransactions.length > 0 && (
							<UsersListPagination
								totalPages={totalPages}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				</KTCard>
			</div>
		</>
	)
}

export default Transactions

