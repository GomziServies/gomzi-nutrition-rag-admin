import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { endOfMonth, startOfMonth } from 'date-fns'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS, errorToast, successToast } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetSalarySlips, RemoveSalarySlip } from '../../../Functions/FGGroup/SalarySlip'

const SalarySlipList = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [salaryData, setSalaryData] = useState<any>([])
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		try {
			const savedDateRange = localStorage.getItem('selectedDateRange')
			if (savedDateRange && savedDateRange !== 'undefined') {
				const parsed = JSON.parse(savedDateRange)
				if (Array.isArray(parsed) && parsed.length === 2) {
					const [startStr, endStr] = parsed
					const start = new Date(startStr)
					const end = new Date(endStr)

					if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
						start.setHours(0, 0, 0, 0)
						end.setHours(23, 59, 59, 999)
						return [start, end]
					}
				}
			}
		} catch (error) {
			console.error('Error parsing saved date range:', error)
		}
		// Default to current month if no saved range
		return [startOfMonth(new Date()), endOfMonth(new Date())]
	})
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [totalRecords, setTotalRecords] = useState(0)
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
	const [printingData, setPrintingData] = useState<any>(null)
	const pdfTemplateRef = React.useRef<HTMLDivElement>(null)
	const isFirstDateLoad = React.useRef(true)

	const companyDetails: any = {
		GCS: {
			name: 'Gomzi Consulting Services Pvt Ltd',
			address:
				'2- Abhushan Bunglows, Alkapuri Charrasta, Sumul Dairy Road , 395004 , Surat , Gujarat , India',
			contact: 'info@gomzi.in | www.gomzi.in',
			logo: '/media/logos/gcs-logo.png',
		},
		GLS: {
			name: 'Gomzi Life Sciences LLP',
			address:
				'443,444,445, 1St Floor, RJD Textile Park, At.Ichchhapor, Hazira Road, SURAT. Gujarat 394510',
			contact: 'Sales@Gomzilifesciences.In | 83200 77993',
			logo: '/media/logos/rag-logo.webp',
		},
	}

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	]

	const fetchSalarySlips = async () => {
		setLoading(true)
		try {
			const query: any = {
				page: pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort: sort,
				sortOrder: sortOrder,
			}

			if (selectedDateRange) {
				query.startDate = DayJS(selectedDateRange[0]).format('YYYY-MM-DD')
				query.endDate = DayJS(selectedDateRange[1]).format('YYYY-MM-DD')
			}

			const response: any = await GetSalarySlips(query)
			if (response.status === 200) {
				setSalaryData(response.data || [])
				setTotalRecords(response.metadata?.total_count || 0)
			}
		} catch (err) {
			console.error('Error fetching slips:', err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchSalarySlips()
	}, [searchTerm, selectedDateRange, pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const handleDelete = async (id: string, name: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `You want to delete the salary slip for ${name}?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		})

		if (result.isConfirmed) {
			try {
				const response: any = await RemoveSalarySlip(id)
				if (response.status === 200) {
					successToast('Salary slip removed successfully')
					fetchSalarySlips()
				} else {
					errorToast(response.message || 'Failed to remove salary slip')
				}
			} catch (err: any) {
				errorToast(err.message || 'Something went wrong')
			}
		}
	}

	const paginatedData = salaryData

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		// If both are null, it's a reset
		if (!dateRange && !selectedDateRange) return

		// Use DayJS for a more robust comparison (ignores millisecond differences)
		if (dateRange && selectedDateRange) {
			const isSame =
				DayJS(dateRange[0]).isSame(selectedDateRange[0], 'day') &&
				DayJS(dateRange[1]).isSame(selectedDateRange[1], 'day')

			if (isSame) {
				// Even if it's the same, we mark first load as done
				isFirstDateLoad.current = false
				return
			}
		}

		// If this is the very first call from DateFilter mount, and we already
		// have a value from localStorage, ignore the mount call (which is usually a default reset)
		if (isFirstDateLoad.current && dateRange) {
			const saved = localStorage.getItem('selectedDateRange')
			if (saved && saved !== 'undefined') {
				isFirstDateLoad.current = false
				return
			}
		}

		isFirstDateLoad.current = false
		setSelectedDateRange(dateRange)
		if (dateRange) {
			localStorage.setItem(
				'selectedDateRange',
				JSON.stringify([dateRange[0].toISOString(), dateRange[1].toISOString()])
			)
		} else {
			localStorage.removeItem('selectedDateRange')
		}
		setPagination({ ...pagination, page: 1 })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleSearchChange = (term: React.SetStateAction<string>) => {
		setSearchTerm((prev) => {
			const next = typeof term === 'function' ? term(prev) : term
			if (next !== prev) {
				setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }))
			}
			return next
		})
	}

	const handleDirectDownload = async (id: string) => {
		setIsGeneratingPDF(true)
		const loadingId = toast.loading('Generating PDF...')

		try {
			const response: any = await GetSalarySlips({ id })
			if (response.status === 200 && response.data) {
				const slip = response.data
				const activeCompany =
					companyDetails[slip.company as keyof typeof companyDetails] || companyDetails.GCS

				const earningsList = [
					{ label: 'Basic Salary', amount: slip.earnings.basic },
					{ label: 'Dearness Allowance (DA)', amount: slip.earnings.da },
					{ label: 'HRA', amount: slip.earnings.hra },
					{ label: 'Conveyance Allowance', amount: slip.earnings.conveyance },
					{ label: 'Medical Allowance', amount: slip.earnings.medical },
					{ label: 'Special Allowance', amount: slip.earnings.special },
					{ label: 'Bonus', amount: slip.earnings.bonus },
					...(slip.earnings.customEarnings || []).map((e: any) => ({
						label: e.label,
						amount: e.value,
					})),
				]

				const deductionsList = [
					{ label: 'Provident Fund', amount: slip.deductions.pf },
					{ label: 'ESI', amount: slip.deductions.esi },
					{ label: 'Professional Tax (PT)', amount: slip.deductions.profTax },
					{ label: 'TDS', amount: slip.deductions.tds },
					{ label: 'Loan Deduction', amount: slip.deductions.loan },
					{ label: 'Others Deduction', amount: slip.deductions.other },
					...(slip.deductions.customDeductions || []).map((d: any) => ({
						label: d.label,
						amount: d.value,
					})),
				]

				setPrintingData({
					company: activeCompany,
					employee: {
						name: slip.employee_details?.full_name || 'N/A',
						id: slip.employee_details?.employee_code || 'N/A',
						email: slip.employee_details?.email || 'N/A',
						contact: slip.employee_details?.mobile || 'N/A',
						designation: slip.employee_details?.position || 'N/A',
						bankName: slip.employee_details?.account_details?.bank_name || 'N/A',
						bankAcc: slip.employee_details?.account_details?.account_number || 'N/A',
						paymentMode: slip.employee_details?.account_details?.mode || 'Online',
						payPeriod: `${monthNames[parseInt(slip.month) - 1]} ${slip.year}`,
					},
					earnings: earningsList,
					deductions: deductionsList,
					totals: {
						grossSalary: slip.total_earnings,
						totalDeductions: slip.total_deductions,
						netPay: slip.net_salary,
					},
				})

				// Wait for React to render the hidden template
				setTimeout(async () => {
					if (pdfTemplateRef.current) {
						const canvas = await html2canvas(pdfTemplateRef.current, {
							scale: 2,
							useCORS: true,
							logging: false,
						})
						const imgData = canvas.toDataURL('image/png')
						const pdf = new jsPDF('p', 'mm', 'a4')
						const imgProps = pdf.getImageProperties(imgData)
						const pdfWidth = pdf.internal.pageSize.getWidth()
						const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
						pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
						pdf.save(
							`SalarySlip_${slip.employee_details?.full_name}_${slip.month}_${slip.year}.pdf`
						)
						setPrintingData(null)
						toast.dismiss(loadingId)
						successToast('Salary slip downloaded successfully')
					}
				}, 500)
			} else {
				toast.dismiss(loadingId)
				errorToast('Failed to fetch salary slip data')
			}
		} catch (err) {
			console.error('Error generating PDF:', err)
			toast.dismiss(loadingId)
			errorToast('Failed to generate PDF')
		} finally {
			setIsGeneratingPDF(false)
		}
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const columns = [
		{ title: 'Employee Code', field: 'employee_details.employee_code' },
		{ title: 'Employee Name', field: 'employee_details.full_name' },
		{ title: 'Number', field: 'employee_details.mobile' },
		{ title: 'Position', field: 'employee_details.position' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Salary Slip List</PageTitle>

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<h2 className='text-gray-900 fw-bold fs-2 m-0'>Salary Slip Records</h2>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Generate, manage, and print monthly salary slips for employees
					</span>
				</div>
			</div>

			{/* Filter Toolbar (Order: Search -> LengthMenu -> DownloadExcel -> Filters -> Date -> Right Action) */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3'>
					<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
						{/* 1. Searchbar */}
						<div style={{ minWidth: '240px', maxWidth: '360px', flex: '1 1 240px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={handleSearchChange}
								placeholder='Search salary slip...'
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
								data={salaryData}
								columns={columns}
								filename='Salary_Slips'
							/>
						</div>

						{/* 4. Date Filter */}
						<div>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>

					{/* 6. End me right side Add Salary Slip Button */}
					<div className='flex-shrink-0 ms-auto'>
						<TableButton
							action='add'
							text='Add Salary Slip'
							onClick={() => (window.location.href = '/hr/salary-slip-add')}
						/>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
				<div className='table-responsive kesar-salary-slip-table'>
						<Table
							data={salaryData}
							columns={columns}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							manualSearch={searchTerm}
							renderRow={(slip: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={slip?._id}>
									<tr
										onClick={() => handleRowClick(slip?._id)}
										className='data-row'>
										<td className='text-center'>
											<div className='d-flex'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{slip?.employee_details?.employee_code}
											</span>
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
															slip?.employee_details?.photo
																? slip?.employee_details?.photo.startsWith('/media')
																	? toAbsoluteUrl(slip?.employee_details?.photo)
																	: `https://files.fggroup.in/${slip?.employee_details?.photo}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt={slip?.employee_details?.full_name}
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
													<span className='text-dark fw-bold fs-6'>
														{slip?.employee_details?.full_name}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{slip?.employee_details?.mobile}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{slip?.employee_details?.position || 'Staff'}
											</span>
										</td>
										<td className='d-flex gap-2'>
											<TableButton
												action='view'
												onClick={() => {
													window.location.href = `/hr/salary-slip-view?id=${slip?._id}`
												}}
											/>
											<TableButton
												action='download'
												title='Download Salary Slip'
												disabled={isGeneratingPDF}
												onClick={() => handleDirectDownload(slip?._id)}
											/>
											<TableButton
												action='edit'
												onClick={() => {
													window.location.href = `/hr/salary-slip-edit?id=${slip?._id}`
												}}
											/>
											<TableButton
												action='remove'
												onClick={() => handleDelete(slip?._id, slip?.employee_details?.full_name)}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div className='p-5'>
													<strong>Total Earnings:</strong> ₹{slip?.total_earnings?.toLocaleString()}
													<br />
													<strong>Total Deductions:</strong> ₹
													{slip?.total_deductions?.toLocaleString()}
													<br />
													<strong>Net Salary:</strong> ₹{slip?.net_salary?.toLocaleString()}
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
				{salaryData.length === 0 && !loading && (
					<div className='d-flex text-center w-100 align-content-center justify-content-center py-12'>
						<b>No records found</b>
					</div>
				)}
				{salaryData.length > 0 && (
					<UsersListPagination
						totalPages={Math.ceil(totalRecords / pagination.itemsPerPage)}
						currentPage={pagination.page}
						totalRecords={totalRecords}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
					/>
				)}
			</div>

			{/* Hidden PDF Template for Capture */}
			<div
				style={{
					position: 'absolute',
					left: '-9999px',
					top: 0,
					width: '1000px', // Matches the centered CSS width
				}}>
				{printingData && (
					<div
						ref={pdfTemplateRef}
						className='salary-slip-container'
						style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
						<div className='kesar-header'>
							<div className='d-flex align-items-center'>
								<div className='kesar-logo-section'>
									<img
										src={toAbsoluteUrl(printingData.company.logo)}
										alt='Logo'
										style={{ maxWidth: '120px' }}
									/>
								</div>
								<div className='kesar-company-section'>
									<h2 className='m-0 fw-bolder'>{printingData.company.name}</h2>
									<p className='m-0 fs-7 text-muted italic'>Masterminding the future</p>
									<p className='m-0 fs-8 mt-2 fw-bold'>{printingData.company.address}</p>
									<p className='m-0 fs-8 text-muted'>{printingData.company.contact}</p>
								</div>
							</div>
						</div>

						<div className='kesar-title-section mb-3 fs-2 mx-auto'>SALARY SLIP</div>
						<div className='kesar-banner'>
							<span>Employee Details</span>
							<span className='net-pay-text'>
								Net Pay{' '}
								<span className='ms-10'>
									₹
									{printingData.totals.netPay.toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</span>
							</span>
						</div>

						<table className='kesar-info-grid'>
							<tbody>
								<tr>
									<td>
										<div className='row'>
											<div className='col-5'>Employee Name :</div>
											<div className='col-7 val-bold'>{printingData.employee.name}</div>
										</div>
									</td>
									<td>
										<div className='row'>
											<div className='col-5'>Designation :</div>
											<div className='col-7 val-bold'>{printingData.employee.designation}</div>
										</div>
									</td>
								</tr>
								<tr>
									<td>
										<div className='row'>
											<div className='col-5'>Employee ID :</div>
											<div className='col-7 val-bold'>{printingData.employee.id}</div>
										</div>
									</td>
									<td>
										<div className='row'>
											{printingData.employee.paymentMode === 'Cash' ? (
												<>
													<div className='col-5'>Payment Method :</div>
													<div className='col-7 val-bold text-primary'>CASH</div>
												</>
											) : (
												<>
													<div className='col-5'>Payment Mode :</div>
													<div className='col-7 val-bold text-primary'>
														{printingData.employee.paymentMode}
													</div>
												</>
											)}
										</div>
									</td>
								</tr>
								<tr>
									<td>
										<div className='row'>
											<div className='col-5'>E-mail ID :</div>
											<div className='col-7 val-bold'>{printingData.employee.email}</div>
										</div>
									</td>
									<td>
										<div className='row'>
											{printingData.employee.paymentMode !== 'Cash' ? (
												<>
													<div className='col-5'>Bank Account No. :</div>
													<div className='col-7 val-bold'>{printingData.employee.bankAcc}</div>
												</>
											) : (
												<div className='col-12'></div>
											)}
										</div>
									</td>
								</tr>
								<tr>
									<td>
										<div className='row'>
											<div className='col-5'>Contact No :</div>
											<div className='col-7 val-bold'>{printingData.employee.contact}</div>
										</div>
									</td>
									<td>
										<div className='row'>
											{printingData.employee.paymentMode !== 'Cash' ? (
												<>
													<div className='col-5'>Bank Name :</div>
													<div className='col-7 val-bold'>{printingData.employee.bankName}</div>
												</>
											) : (
												<div className='col-12'></div>
											)}
										</div>
									</td>
								</tr>
								<tr>
									<td>
										<div className='row'>
											<div className='col-5'>Pay Period :</div>
											<div className='col-7 val-bold'>{printingData.employee.payPeriod}</div>
										</div>
									</td>
									<td></td>
								</tr>
							</tbody>
						</table>

						<table className='kesar-table'>
							<thead>
								<tr>
									<th
										style={{ width: '35%' }}
										className='text-center'>
										Earnings
									</th>
									<th
										style={{ width: '15%' }}
										className='text-center'>
										Amount
									</th>
									<th
										style={{ width: '35%' }}
										className='text-center border-divider'>
										Deductions
									</th>
									<th
										style={{ width: '15%' }}
										className='text-center'>
										Amount
									</th>
								</tr>
							</thead>
							<tbody>
								{Array.from({
									length: Math.max(printingData.earnings.length, printingData.deductions.length, 7),
								}).map((_, idx) => (
									<tr key={idx}>
										<td>{printingData.earnings[idx]?.label || ''}</td>
										<td className='text-right'>
											{printingData.earnings[idx]
												? '₹' +
												  printingData.earnings[idx].amount.toLocaleString(undefined, {
														minimumFractionDigits: 2,
												  })
												: ''}
										</td>
										<td className='border-divider'>{printingData.deductions[idx]?.label || ''}</td>
										<td className='text-right'>
											{printingData.deductions[idx]
												? '₹' +
												  printingData.deductions[idx].amount.toLocaleString(undefined, {
														minimumFractionDigits: 2,
												  })
												: ''}
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<div className='kesar-summary-bar'>
							<span
								style={{ width: '35%' }}
								className='ps-4'>
								Gross Salary
							</span>
							<span
								style={{ width: '15%' }}
								className='text-right pe-4'>
								₹
								{printingData.totals.grossSalary.toLocaleString(undefined, {
									minimumFractionDigits: 2,
								})}
							</span>
							<span
								style={{ width: '35%' }}
								className='border-divider ps-4'>
								Total Deductions
							</span>
							<span
								style={{ width: '15%' }}
								className='text-right pe-4'>
								₹
								{printingData.totals.totalDeductions.toLocaleString(undefined, {
									minimumFractionDigits: 2,
								})}
							</span>
						</div>
						<div
							className='kesar-summary-bar kesar-net-bar'
							style={{ justifyContent: 'space-between', padding: '10px 15px' }}>
							<span className='text-bold'>NET Salary</span>
							<span className='text-bold'>
								₹
								{printingData.totals.netPay.toLocaleString(undefined, {
									minimumFractionDigits: 2,
								})}
							</span>
						</div>

						<div className='kesar-signature-row'>
							<div className='kesar-sig-label'>Employee Signature :</div>
							<div className='kesar-sig-label'>Employer Signature :</div>
						</div>
					</div>
				)}
			</div>
		</>
	)
}

export { SalarySlipList }
