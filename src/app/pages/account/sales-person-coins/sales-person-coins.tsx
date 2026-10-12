import { faDownload } from '@fortawesome/free-solid-svg-icons'
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
import { GetAllSalesBalance } from '../../../Functions/FGGroup/AccountFunctions'

export const SalesPersonCoins: React.FC = () => {
	const [searchQuery, setSearchQuery] = useState('')
	const [branchFilter, setBranchFilter] = useState('All')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [sort, setSort] = useState('lastUpdated')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [salesBalances, setSalesBalances] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)

	const branches = [
		{ label: 'FGIIT', value: 'FG Group' },
		{ label: 'FWG', value: 'FWG' },
		{ label: 'Gomzi Life Sciences', value: 'Gomzi Nutrition' },
	]

	const getBranchLabel = (branch?: string) => {
		switch (branch) {
			case 'FG Group':
				return 'FGIIT'
			case 'Gomzi Nutrition':
				return 'Gomzi Life Sciences'
			default:
				return branch || 'N/A'
		}
	}

	const buildSalesParams = (page: number, limit: number) => {
		const params: any = {
			page,
			limit,
		}

		if (searchQuery.trim()) {
			params.search = searchQuery.trim()
		}

		if (branchFilter !== 'All') {
			params.branch_name = branchFilter
		}

		if (selectedDateRange) {
			params.from_date = selectedDateRange[0].toISOString()
			params.to_date = selectedDateRange[1].toISOString()
		}

		return params
	}

	const fetchSalesBalances = async () => {
		setLoading(true)
		try {
			const pageSize = 100
			const firstResponse: any = await GetAllSalesBalance(buildSalesParams(1, pageSize))
			if (firstResponse.status === 200) {
				const paginationMeta = firstResponse?.metadata?.pagination || {}
				const totalPages = Number(paginationMeta.totalPages || 1)
				let allRows = Array.isArray(firstResponse.data) ? [...firstResponse.data] : []

				for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
					const nextResponse: any = await GetAllSalesBalance(
						buildSalesParams(currentPage, pageSize)
					)
					if (Array.isArray(nextResponse.data)) {
						allRows = allRows.concat(nextResponse.data)
					}
				}

				allRows.sort((a: any, b: any) => {
					const aTime = new Date(a?.lastUpdated || 0).getTime()
					const bTime = new Date(b?.lastUpdated || 0).getTime()
					return bTime - aTime
				})

				setSalesBalances(allRows)
			}
		} catch (error) {
			console.error('Error fetching sales balances:', error)
			toast.error('Failed to load sales balances')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchSalesBalances()
	}, [searchQuery, branchFilter, selectedDateRange, sort, sortOrder])

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [branchFilter, selectedDateRange])

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

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage, page: 1 }))
	}

	const getSortValue = (item: any, field: string) => {
		switch (field) {
			case 'id':
				return item.id || ''
			case 'salesPersonName':
				return item.salesPersonName || ''
			case 'branch':
				return item.branch || ''
			case 'coinsEarned':
				return Number(item.coinsEarned || 0)
			case 'coinsRedeemed':
				return Number(item.coinsRedeemed || 0)
			case 'currentBalance':
				return Number(item.currentBalance || 0)
			case 'lastUpdated':
				return new Date(item.lastUpdated).getTime()
			default:
				return ''
		}
	}

	const filteredSalesBalances = salesBalances
		.filter((item: any) => {
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase()
				const matchesSearch =
					(item.salesPersonName || '').toLowerCase().includes(query) ||
					(item.id || '').toString().toLowerCase().includes(query)
				if (!matchesSearch) return false
			}

			if (branchFilter !== 'All' && item.branch !== branchFilter) return false

			if (selectedDateRange) {
				const itemDate = new Date(item.lastUpdated)
				const [startDate, endDate] = selectedDateRange
				if (itemDate < startDate || itemDate > endDate) return false
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

	const paginatedData = filteredSalesBalances.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const totalPages = Math.ceil(filteredSalesBalances.length / pagination.itemsPerPage)

	const downloadExcel = () => {
		setExporting(true)
		try {
			const worksheetData = filteredSalesBalances.map((item: any) => ({
				ID: item.id || 'N/A',
				'Sales Person': item.salesPersonName || 'N/A',
				Brand: getBranchLabel(item.branch),
				'Total Earned': item.coinsEarned ?? 'N/A',
				'Total Payouts': item.coinsRedeemed ?? 'N/A',
				'Current Balance': item.currentBalance ?? 'N/A',
				'Last Updated': new Date(item.lastUpdated).toLocaleString('en-GB', {
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
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Person Coins')
			XLSX.writeFile(workbook, 'SalesPersonCoins.xlsx')
			toast.success('Excel file downloaded successfully')
		} catch (error) {
			console.error('Error exporting sales balances:', error)
			toast.error('Failed to export data')
		} finally {
			setExporting(false)
		}
	}

	const columns = [
		{ title: 'Sales Person', field: 'salesPersonName' },
		{ title: 'Brand', field: 'branch' },
		{ title: 'Total Earned', field: 'coinsEarned' },
		{ title: 'Total Payouts', field: 'coinsRedeemed' },
		{ title: 'Current Balance', field: 'currentBalance' },
		{ title: 'Last Updated', field: 'lastUpdated' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>All Sales Balance</PageTitle>

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
								expenseData={filteredSalesBalances}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
							<select
								className='form-select form-select-solid w-175px'
								value={branchFilter}
								onChange={(e) => setBranchFilter(e.target.value)}>
								<option value='All'>All Brands</option>
								{branches.map((b) => (
									<option
										key={b.value}
										value={b.value}>
										{b.label}
									</option>
								))}
							</select>
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
							data={paginatedData}
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
							removeAction={true}
							renderRow={(item, index, actualIndex) => (
								<tr key={item.id + index}>
									<td className='text-center ps-4'>{actualIndex}</td>
									<td>
										<div className='d-flex flex-column'>
											<span className='text-dark fw-bold fs-6'>{item.salesPersonName}</span>
										</div>
									</td>
									<td>
										<span className='text-muted fw-semibold fs-7'>
											{getBranchLabel(item.branch)}
										</span>
									</td>
									<td>
										<span className='text-success fw-bold fs-6'>
											₹ {item.coinsEarned.toLocaleString()}
										</span>
									</td>
									<td>
										<span className='text-danger fw-bold fs-6'>
											₹ {item.coinsRedeemed.toLocaleString()}
										</span>
									</td>
									<td>
										<span className='text-primary fw-bolder fs-6'>
											₹ {item.currentBalance.toLocaleString()}
										</span>
									</td>
									<td>
										<span className='text-muted fw-semibold fs-7'>
											{new Date(item.lastUpdated).toLocaleString('en-GB', {
												day: '2-digit',
												month: 'short',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
												hour12: true,
											})}
										</span>
									</td>
								</tr>
							)}
						/>
					</div>
					{filteredSalesBalances.length > 0 && (
						<UsersListPagination
							totalPages={totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
					{filteredSalesBalances.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default SalesPersonCoins
