import { faPlusCircle, faSync } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import SelectField from '../../../components/SelectField'
import UsersListPagination from '../../../components/TablePagination'
import { GetSalaryData, SyncSalaryData } from '../../../Functions/FGGroup/Attendance'

const HREmployeeSalary = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [salaryData, setSalaryData] = useState<any>([])
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [selectedSubject, setSelectedSubject] = useState('')
	const [selectedStatus, setSelectedStatus] = useState('')
	const [isRotating, setIsRotating] = useState(false)
	const [loading, setLoading] = useState(false)
	const [loadingSync, setLoadingSync] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [metaData, setMetaData] = useState<any>()
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const currentMonth = ('0' + new Date().getMonth()).slice(-2)
	const currentYear = new Date().getFullYear().toString()
	const [selectedMonth, setSelectedMonth] = useState(currentMonth)
	const [selectedYear, setSelectedYear] = useState(currentYear)
	const [selectedDate, setSelectedDate] = useState('')
	const [transactionType, setTransactionType] = useState('IMPS')

	const fetchSalaryData = async (page?: number) => {
		setLoading(true)
		let period: string | null = null

		if (selectedDateRange) {
			// Format the period as "YYYY-MM" from the selected date range
			// Using the start date to determine the period
			const startDate = new Date(selectedDateRange[0])
			period = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
		} else {
			// Default to previous month if no date range selected
			const now = new Date()
			const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			period = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(
				2,
				'0'
			)}`
		}

		try {
			const response: any = await GetSalaryData({
				period: period,
			})

			const filteredData = response.data

			setSalaryData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const handleSyncData = async () => {
		setLoadingSync(true)
		try {
			const response: any = await SyncSalaryData()
			if (response.status === 200 || response.success) {
				toast.success(response.message || 'Salary synced successfully')
				fetchSalaryData()
			} else {
				toast.error(response.message || 'Error syncing salary')
			}
		} catch (error: any) {
			toast.error(error.message || 'Error syncing salary')
		}
		setLoadingSync(false)
	}

	useEffect(() => {
		fetchSalaryData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedSubject,
	])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			fetchSalaryData()
		}
	}, [searchTerm])

	const filteredAdminData = salaryData.filter((admin: any) =>
		admin.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedAdminData = filteredAdminData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleChangeStatus = (event: any) => {
		setPagination({ ...pagination, page: 1 })
		let value = event.target.value
		setSelectedStatus(value)
		if (value == 'Absent') {
			value = 'A'
		} else if (value == 'Present') {
			value = 'P'
		} else if (value == 'Leave') {
			value = 'Leave'
		}
		setSelectedSubject(value)
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const sortableFields = [
		{ title: 'Employee', field: 'employee_name' },
		{ title: 'Salary', field: 'total_salary' },
		{ title: 'Final Salary', field: 'final_salary' },
		{ title: 'Present', field: 'total_present' },
		{ title: 'Absent', field: 'total_absent' },
		{ title: 'Period', field: 'period' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const downloadXL = async () => {
		// Validate that month and year are selected
		if (!selectedMonth || !selectedYear) {
			toast.error('Please select both month and year')
			return
		}

		// Validate that date is selected
		if (!selectedDate) {
			toast.error('Please select transaction date')
			return
		}

		try {
			// Fetch salary data for the selected period
			// Format as "YYYY-MM" as per project specification
			const period = `${selectedYear}-${selectedMonth}`

			const response: any = await GetSalaryData({
				period: period,
			})

			// Filter out entries with negative final salary
			const salaryData = response.data.filter((employee: any) => {
				return employee.final_salary >= 0
			})

			// Check if there are any valid entries left
			if (salaryData.length === 0) {
				toast.error('No valid salary data found for export')
				return
			}

			// Dynamically import xlsx library
			const XLSX = await import('xlsx')

			// Create worksheet data
			const worksheetData = []

			// Add header row (Column1 to Column29)
			const headers = []
			for (let i = 1; i <= 29; i++) {
				headers.push(`Column${i}`)
			}
			worksheetData.push(headers)

			// Format the selected date as dd/mm/yyyy
			let formattedDate = ''
			if (selectedDate) {
				const dateObj = new Date(selectedDate)
				const day = String(dateObj.getDate()).padStart(2, '0')
				const month = String(dateObj.getMonth() + 1).padStart(2, '0')
				const year = dateObj.getFullYear()
				formattedDate = `${day}/${month}/${year}`
			}

			// Add data rows
			salaryData.forEach((employee: any) => {
				const row = []

				// Column1: Fixed account number
				row.push('923020001798197')

				// Column2: Final salary from API
				row.push(employee.final_salary || '')

				// Column3: Fixed "INR"
				row.push('INR')

				// Column4: Employee name from API
				row.push(employee.employee_name || '')

				// Column5: Employee account number from API
				const accountNumber =
					employee.employee_id?.account_details?.account_number ||
					employee.bank_account_number ||
					''
				row.push(accountNumber)

				// Column6: Employee IFSC code from API
				const ifscCode = employee.employee_id?.account_details?.IFSC || employee.ifsc_code || ''
				row.push(ifscCode)

				// Column7: Selected date from card body (formatted as dd/mm/yyyy)
				row.push(formattedDate || '')

				// Column8: Transaction type from card body
				row.push(transactionType || '')

				// Column9: Employee code from API
				const employeeCode = employee.employee_id?.employee_code || employee.employee_code || ''
				row.push(employeeCode)

				// Column10: Employee code from API (again as per requirements)
				row.push(employeeCode)

				// Column11 to Column29: Empty values (as not specified in requirements)
				for (let i = 11; i <= 29; i++) {
					row.push('')
				}

				worksheetData.push(row)
			})

			// Create workbook and worksheet
			const ws = XLSX.utils.aoa_to_sheet(worksheetData)
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, 'Salary Data')

			// Download Excel file
			XLSX.writeFile(wb, `salary_data_${selectedYear}_${selectedMonth}.xlsx`)

			// Show success message
			toast.success('Excel file downloaded successfully')
		} catch (error) {
			console.error('Error downloading XL sheet:', error)
			toast.error('Error downloading XL sheet. Please try again.')
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Salary</PageTitle>

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<h2 className='text-gray-900 fw-bold fs-2 m-0'>Employee Salary Sheet</h2>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Manage finalized employee salary data, adjustments, and payout sheets
					</span>
				</div>
			</div>

			{/* Filter Toolbar (Order: Search -> LengthMenu -> DownloadExcel -> Filters -> Date) */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center flex-wrap gap-3'>
					{/* 1. Searchbar */}
					<div style={{ minWidth: '240px', maxWidth: '360px', flex: '1 1 240px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search employee name...'
							className='me-0'
						/>
					</div>

					{/* 2. Page Size / Length Menu */}
					<div>
						<LengthMenu
							data={salaryData}
							itemsPerPage={pagination.itemsPerPage}
							handleItemsPerPageChange={handleItemsPerPageChange}
							className='me-0'
						/>
					</div>

					{/* 3. Download Excel Button */}
					<div>
						<DownloadExcelButton
							onClick={downloadXL}
							title='Download Salary Sheet'
						/>
					</div>

					{/* 4. Sync Button */}
					<div>
						<button
							type='button'
							className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '8px' }}
							onClick={handleSyncData}
							disabled={loadingSync || loading}>
							<FontAwesomeIcon
								icon={faSync}
								className={`fs-6 text-white ${loadingSync ? 'fa-spin' : ''}`}
							/>
							<span className='fw-semibold'>Sync</span>
						</button>
					</div>

					{/* Spacer */}
					<div className='d-none d-md-block' style={{ flexGrow: 1 }}></div>

					{/* 5. Date Filter (at last) */}
					<div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
							lastMonth={true}
						/>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
					<div className='table-responsive'>
						<Table
							data={paginatedAdminData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(salary: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={salary?._id}>
									<tr
										onClick={() => handleRowClick(salary?._id)}
										className='data-row'>
										<td className='text-center'>
											<div className='d-flex'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div
													className='symbol symbol-circle overflow-hidden flex-shrink-0 me-4'
													style={{
														width: '42px',
														height: '42px',
														minWidth: '42px',
														minHeight: '42px',
														borderRadius: '10px',
													}}>
													<img
														src={
															salary?.employee_photo
																? `https://files.fggroup.in/${salary?.employee_photo}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt={salary?.employee_name}
														style={{
															width: '42px',
															height: '42px',
															minWidth: '42px',
															minHeight: '42px',
															borderRadius: '10px',
															objectFit: 'cover',
															display: 'block',
														}}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>{salary?.employee_name}</span>
													<span className='text-muted fw-semibold text-muted d-block fs-7'>
														{salary?.employee_email}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.total_salary ? salary?.total_salary : '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.final_salary ? salary?.final_salary : '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.total_present ? salary?.total_present : '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.total_absent ? salary?.total_absent : '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.month && salary?.year ? `${salary?.month} ${salary?.year}` : '-'}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												onClick={() => {
													window.location.href = `/hr/salary-data-view?employee_id=${salary?.employee_id?._id}`
												}}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div
															className='symbol symbol-circle overflow-hidden flex-shrink-0 me-4'
															style={{
																width: '42px',
																height: '42px',
																minWidth: '42px',
																minHeight: '42px',
																borderRadius: '10px',
															}}>
															<img
																src={
																	salary?.employee_photo
																		? `https://files.fggroup.in/${salary?.employee_photo}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt={salary?.employee_name}
																style={{
																	width: '42px',
																	height: '42px',
																	minWidth: '42px',
																	minHeight: '42px',
																	borderRadius: '10px',
																	objectFit: 'cover',
																	display: 'block',
																}}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>
																{salary?.employee_name}
															</span>
															<span className='text-muted fw-semibold text-muted d-block fs-7'>
																{salary?.employee_email}
															</span>
														</div>
													</div>
													<strong>{sortableFields[1].title}:</strong>{' '}
													{salary?.total_salary ? salary?.total_salary : '-'}
													<br />
													<strong>{sortableFields[2].title}:</strong>{' '}
													{salary?.final_salary ? salary?.final_salary : '-'}
													<br />
													<strong>{sortableFields[3].title}:</strong>{' '}
													{salary?.total_present ? salary?.total_present : '-'}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{salary?.total_absent ? salary?.total_absent : '-'}
													<br />
													<strong>{sortableFields[5].title}:</strong>{' '}
													{salary?.month && salary?.year ? `${salary?.month} ${salary?.year}` : '-'}
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
				{paginatedAdminData.length === 0 && !loading && (
					<div className='d-flex text-center w-100 align-content-center justify-content-center py-12'>
						<b>No records found</b>
					</div>
				)}
				{paginatedAdminData.length > 0 && (
					<UsersListPagination
						totalPages={Math.ceil(salaryData.length / pagination.itemsPerPage)}
						currentPage={pagination.page}
						totalRecords={salaryData.length}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
					/>
				)}
			</div>
			{/* XL Sheet Card */}
			<div className='card mt-6'>
				<div className='card-header'>
					<h3 className='card-title'>XL Sheet</h3>
				</div>
				<div className='card-body'>
					<div className='row'>
						<div className='col-md-6 mb-4'>
							<label className='form-label'>Account Number</label>
							<input
								type='text'
								className='form-control'
								value='923020001798197'
								readOnly
							/>
						</div>
						<div className='col-md-3 mb-4'>
							<label className='form-label'>Month</label>
							<SelectField
								value={selectedMonth}
								onChange={(val: any) => {
									const value = typeof val === 'object' && val?.target ? val.target.value : val
									setSelectedMonth(value)
								}}
								options={[
									{ value: '', label: 'Select Month' },
									{ value: '01', label: 'January' },
									{ value: '02', label: 'February' },
									{ value: '03', label: 'March' },
									{ value: '04', label: 'April' },
									{ value: '05', label: 'May' },
									{ value: '06', label: 'June' },
									{ value: '07', label: 'July' },
									{ value: '08', label: 'August' },
									{ value: '09', label: 'September' },
									{ value: '10', label: 'October' },
									{ value: '11', label: 'November' },
									{ value: '12', label: 'December' },
								]}
							/>
						</div>
						<div className='col-md-3 mb-4'>
							<label className='form-label'>Year</label>
							<SelectField
								value={selectedYear}
								onChange={(val: any) => {
									const value = typeof val === 'object' && val?.target ? val.target.value : val
									setSelectedYear(value)
								}}
								options={[
									{ value: '', label: 'Select Year' },
									{ value: '2023', label: '2023' },
									{ value: '2024', label: '2024' },
									{ value: '2025', label: '2025' },
									{ value: '2026', label: '2026' },
								]}
							/>
						</div>
					</div>
					<div className='row'>
						<div className='col-md-6 mb-4'>
							<label className='form-label'>Transaction Date</label>
							<input
								type='date'
								className='form-control'
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
							/>
						</div>
						<div className='col-md-6 mb-4'>
							<label className='form-label'>Transaction Type</label>
							<SelectField
								value={transactionType}
								onChange={(val: any) => {
									const value = typeof val === 'object' && val?.target ? val.target.value : val
									setTransactionType(value)
								}}
								options={[
									{ value: 'IMPS', label: 'IMPS' },
									{ value: 'RTGS', label: 'RTGS' },
									{ value: 'NEFT', label: 'NEFT' },
								]}
							/>
						</div>
					</div>
					<div className='col-12'>
						<div className='d-flex justify-content-end flex-direction-column'>
							<div>
								<button
									className='btn btn-primary d-block'
									onClick={downloadXL}>
									Download XL
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { HREmployeeSalary }
