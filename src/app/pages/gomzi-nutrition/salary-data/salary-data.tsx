import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetGlsSalaryData } from '../../../Functions/FGGroup/GlsSalary'
import '../common-management.css'

const EmployeeSalary = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [salaryData, setSalaryData] = useState<any>([])
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [selectedSubject, setSelectedSubject] = useState('')
	const [selectedStatus, setSelectedStatus] = useState('')
	const [isRotating, setIsRotating] = useState(false)
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
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
			const response: any = await GetGlsSalaryData({
				period: period,
			})

			const filteredData = response.data

			setSalaryData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
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

	const filteredAdminData = (salaryData || []).filter(
		(admin: any) =>
			(admin.employee_name || admin.employee_id?.full_name || '')
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			(admin.mobile || admin.employee_id?.mobile || '')
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			(admin.employee_email || admin.employee_id?.email || '')
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			(admin.employee_code || admin.employee_id?.employee_code || '')
				.toLowerCase()
				.includes(searchTerm.toLowerCase())
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

			const response: any = await GetGlsSalaryData({
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

	const downloadExcel = async () => {
		try {
			setExporting(true)
			const toastId = toast.loading('Exporting salary data to Excel...')

			const dataToExport = filteredAdminData || []
			if (dataToExport.length === 0) {
				toast.dismiss(toastId)
				toast.error('No salary records found to export')
				return
			}

			const worksheetData = dataToExport.map((salary: any, index: number) => ({
				No: index + 1,
				'Employee Code': salary.employee_id?.employee_code || salary.employee_code || '-',
				'Employee Name': salary.employee_name || salary.employee_id?.full_name || '-',
				Email: salary.employee_email || salary.employee_id?.email || '-',
				'Account Number':
					salary.employee_id?.account_details?.account_number || salary.bank_account_number || '-',
				'IFSC Code': salary.employee_id?.account_details?.IFSC || salary.ifsc_code || '-',
				'Total Salary': salary.total_salary ?? '-',
				'Final Salary': salary.final_salary ?? '-',
				Period: salary.period || '-',
			}))

			const XLSX = await import('xlsx')
			const worksheet = XLSX.utils.json_to_sheet(worksheetData)
			const columnWidths = Object.keys(worksheetData[0]).map((key) => {
				const maxLength = Math.max(
					key.length,
					...worksheetData.map((row: any) => String(row[key] ?? '').length)
				)
				return { wch: Math.min(maxLength + 2, 40) }
			})
			worksheet['!cols'] = columnWidths

			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Salary Data')
			XLSX.writeFile(workbook, `Salary_Data_${selectedYear}_${selectedMonth}.xlsx`)

			toast.dismiss(toastId)
			toast.success(`${dataToExport.length} salary records exported successfully`)
		} catch (error: any) {
			console.error('Export error:', error)
			toast.error('Failed to export salary data')
		} finally {
			setExporting(false)
		}
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Employee Salary</PageTitle>

			<nav className='gz-mgmt-breadcrumb'>
				<a href='/rag/dashboard'>Dashboard</a>
				<span>/</span>
				<a href='/rag/employees'>Staff Management</a>
				<span>/</span>
				<span>Salary Data</span>
			</nav>

			<div className='gz-mgmt-header mb-6'>
				<div>
					<h1 className='gz-mgmt-title'>Staff Salary Master Registry</h1>
					<p className='gz-mgmt-subtitle'>
						Disbursement records, net payables, attendance days, and corporate banking export files
					</p>
				</div>
			</div>

			{/* Main Salary Table Card */}
			<div className='gz-mgmt-card mb-6'>
				<div className='gz-mgmt-toolbar flex-wrap gap-3'>
					<div className='gz-mgmt-toolbar-left flex-wrap gap-3'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							className='me-0'
						/>
						<LengthMenu
							expenseData={salaryData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>
						<div>
							<DownloadExcelButton
								onClick={downloadExcel}
								disabled={exporting}
								loading={exporting}
								title='Download Excel'
							/>
						</div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
							lastMonth={true}
						/>
					</div>
				</div>

				<div className='card-body p-0'>
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
										className='data-row'
									>
										<td className='text-center'>
											<div className='d-flex justify-content-center align-items-center'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 d-md-none'
													style={{ color: '#607D8B', fontSize: '14px' }}
												/>
												<span className='fw-bold text-muted fs-7'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<div className='gz-mgmt-identity-cell'>
												<img
													src={
														salary?.employee_photo || salary?.photo || salary?.employee_id?.photo
															? `https://files.fggroup.in/${salary?.employee_photo || salary?.photo || salary?.employee_id?.photo}`
															: toAbsoluteUrl('/media/logos/fgiit-logo.png')
													}
													alt={salary?.employee_name || salary?.employee_id?.full_name}
													className='gz-mgmt-avatar'
													onError={(e) => {
														const target = e.currentTarget
														target.style.display = 'none'
														if (target.nextElementSibling) {
															(target.nextElementSibling as HTMLElement).style.display = 'flex'
														}
													}}
												/>
												<div
													className='gz-mgmt-avatar-fallback'
													style={{ display: 'none' }}
												>
													{(salary?.employee_name || salary?.employee_id?.full_name || 'E').charAt(0).toUpperCase()}
												</div>
												<div className='gz-mgmt-identity-info'>
													<span className='gz-mgmt-identity-name'>
														{salary?.employee_name || salary?.employee_id?.full_name || 'Unnamed Employee'}
													</span>
													<span className='gz-mgmt-identity-sub'>
														{salary?.employee_code || salary?.employee_id?.employee_code || salary?.employee_email || 'No code'}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='fw-bold' style={{ color: '#0F172A' }}>
												{salary?.total_salary ? `₹${Number(salary.total_salary).toLocaleString('en-IN')}` : '-'}
											</span>
										</td>
										<td>
											<span className='fw-bold' style={{ color: '#16A34A' }}>
												{salary?.final_salary !== undefined ? `₹${Number(salary.final_salary).toLocaleString('en-IN')}` : '-'}
											</span>
										</td>
										<td>
											<span className='gz-mgmt-pill success'>
												{salary?.total_present !== undefined ? `${salary.total_present} Days` : '-'}
											</span>
										</td>
										<td>
											<span className='gz-mgmt-pill danger'>
												{salary?.total_absent !== undefined ? `${salary.total_absent} Days` : '0 Days'}
											</span>
										</td>
										<td>
											<span className='gz-mgmt-pill info'>
												{salary?.month && salary?.year ? `${salary?.month} ${salary?.year}` : salary?.period || '-'}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												onClick={() => {
													window.location.href = `/rag/salary-data-view?employee_id=${salary?.employee_id?._id || salary?.employee_id}&period=${salary?.period}`
												}}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div className='p-4' style={{ background: '#F8FAFC', borderRadius: '8px' }}>
													<strong>Employee:</strong> {salary?.employee_name || salary?.employee_id?.full_name} ({salary?.employee_id?.employee_code})<br />
													<strong>Base Salary:</strong> ₹{salary?.total_salary || 0}<br />
													<strong>Final Salary:</strong> ₹{salary?.final_salary || 0}<br />
													<strong>Present Days:</strong> {salary?.total_present || 0}<br />
													<strong>Absent Days:</strong> {salary?.total_absent || 0}<br />
													<strong>Period:</strong> {salary?.month && salary?.year ? `${salary?.month} ${salary?.year}` : salary?.period || '-'}
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
						<div className='d-flex text-center w-100 align-content-center justify-content-center py-10 text-muted'>
							<b>No salary records found</b>
						</div>
					)}
					{paginatedAdminData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredAdminData.length / pagination.itemsPerPage) || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>

			{/* Banking Batch Disbursement XL Generator Card */}
			<div className='gz-mgmt-form-card'>
				<div className='gz-mgmt-section-header mb-6'>
					<div className='gz-mgmt-section-badge'>
						<i className='bi bi-bank fs-5'></i>
					</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Corporate Bank Batch Sheet (XL)</h3>
						<p className='gz-mgmt-section-subtitle'>
							Generate standardized IMPS / NEFT / RTGS salary disbursement template for bank upload
						</p>
					</div>
				</div>

				<div className='row g-4'>
					<div className='col-md-6'>
						<label className='gz-mgmt-form-label'>Debit Account Number</label>
						<input
							type='text'
							className='form-control form-control-solid'
							value='923020001798197'
							readOnly
							style={{ background: '#F1F5F9', fontWeight: 600 }}
						/>
					</div>
					<div className='col-md-3'>
						<SelectField
							label='Disbursement Month'
							name='month'
							value={selectedMonth}
							onChange={(e) => setSelectedMonth(e.target.value)}
							options={[
								{ label: 'Select Month', value: '' },
								{ label: 'January', value: '01' },
								{ label: 'February', value: '02' },
								{ label: 'March', value: '03' },
								{ label: 'April', value: '04' },
								{ label: 'May', value: '05' },
								{ label: 'June', value: '06' },
								{ label: 'July', value: '07' },
								{ label: 'August', value: '08' },
								{ label: 'September', value: '09' },
								{ label: 'October', value: '10' },
								{ label: 'November', value: '11' },
								{ label: 'December', value: '12' },
							]}
							hideDefaultOption={true}
							marginRemove={true}
						/>
					</div>
					<div className='col-md-3'>
						<SelectField
							label='Disbursement Year'
							name='year'
							value={selectedYear}
							onChange={(e) => setSelectedYear(e.target.value)}
							options={[
								{ label: 'Select Year', value: '' },
								{ label: '2023', value: '2023' },
								{ label: '2024', value: '2024' },
								{ label: '2025', value: '2025' },
								{ label: '2026', value: '2026' },
							]}
							hideDefaultOption={true}
							marginRemove={true}
						/>
					</div>
					<div className='col-md-6'>
						<label className='gz-mgmt-form-label'>Transaction Execution Date</label>
						<input
							type='date'
							className='form-control form-control-solid'
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
						/>
					</div>
					<div className='col-md-6'>
						<SelectField
							label='Transaction Transfer Mode'
							name='transactionType'
							value={transactionType}
							onChange={(e) => setTransactionType(e.target.value)}
							options={[
								{ label: 'IMPS (Immediate Payment)', value: 'IMPS' },
								{ label: 'RTGS (Real Time Gross)', value: 'RTGS' },
								{ label: 'NEFT (National Electronic Fund Transfer)', value: 'NEFT' },
							]}
							hideDefaultOption={true}
							marginRemove={true}
						/>
					</div>
					<div className='col-12 mt-6 d-flex justify-content-end'>
						<button
							type='button'
							className='gz-mgmt-btn-primary'
							onClick={downloadXL}
						>
							<i className='bi bi-file-earmark-excel me-2'></i>
							Generate & Download Banking XL
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default EmployeeSalary
