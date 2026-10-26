import React, { useEffect, useState } from 'react'
import TableButton from '../../../components/TableButton'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { KTIcon } from '../../../../_metronic/helpers'
import UsersListPagination from '../../../components/TablePagination'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import DateFilter from '../../../components/DateRangePicker'

type Props = {
	className: string
	onCountChange?: (count: number) => void
}

const ExpiredEmployeeTable: React.FC<Props> = ({ className, onCountChange }) => {
	const [employeeData, setEmployeeData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)

	const fetchEmployeeData = async () => {
		setLoading(true)
		try {
			const response: any = await GetEmployees()
			const today = DayJS().startOf('day')
			
			const filteredData: any = response.data
				.filter((item: any) => {
					if (!item.employee || !item.employee.document || !item.employee.document.length) return false
					return item.employee.document.some((doc: any) => doc.expiry_date)
				})
				.map((item: any) => {
					const documents = item.employee.document || []
					
					// Prioritize HR Agreement over Joining Letter
					let selectedDoc = documents.find((doc: any) => 
						doc.document_type.toLowerCase().includes('agreement') || 
						doc.document_type.toLowerCase().includes('aggriment')
					)
					
					if (!selectedDoc) {
						selectedDoc = documents.find((doc: any) => 
							doc.document_type.toLowerCase().includes('joining letter')
						)
					}
					
					// If neither specifically found, take the one with earliest expiry
					if (!selectedDoc) {
						const docsWithExpiry = documents
							.filter((doc: any) => doc.expiry_date)
							.sort((a: any, b: any) => DayJS(a.expiry_date).diff(DayJS(b.expiry_date)))
						selectedDoc = docsWithExpiry[0]
					}
					
					if (!selectedDoc) return null;

					const expiryMoment = DayJS(selectedDoc.expiry_date).startOf('day')
					const diffDays = expiryMoment.diff(today, 'day')
					
					return {
						_id: item._id,
						name: item.full_name,
						position: item.employee.position,
						joining_date: selectedDoc.joining_date || item.employee.joining_date,
						expiry_date: selectedDoc.expiry_date,
						document_type: selectedDoc.document_type,
						email: item.email,
						photo: item.employee.photo,
						mobile: item.mobile,
						days_diff: diffDays,
						is_expired: diffDays < 0,
					}
				})
				.filter((item: any) => item !== null)
			
			// Sort by most expired first
			filteredData.sort((a: any, b: any) => a.days_diff - b.days_diff)
			
			setEmployeeData(filteredData)
			onCountChange?.(filteredData.length)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [])

	const [searchTerm, setSearchTerm] = useState('')
	const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)

	useEffect(() => {
		setCurrentPage(1)
	}, [searchTerm])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setDateRange(range)
		setCurrentPage(1)
	}

	const filteredEmployees = employeeData.filter((emp: any) => {
		let matchesSearch = true
		if (searchTerm) {
			const q = searchTerm.toLowerCase()
			matchesSearch =
				emp.name?.toLowerCase().includes(q) ||
				emp.position?.toLowerCase().includes(q) ||
				emp.document_type?.toLowerCase().includes(q) ||
				emp.mobile?.toString().includes(q)
		}

		let matchesDate = true
		if (dateRange && dateRange[0] && dateRange[1]) {
			const isAllDates = new Date(dateRange[0]).getFullYear() <= 2015
			if (!isAllDates && emp.expiry_date) {
				const start = new Date(dateRange[0])
				start.setHours(0, 0, 0, 0)
				const end = new Date(dateRange[1])
				end.setHours(23, 59, 59, 999)

				const expDate = new Date(emp.expiry_date)
				matchesDate = expDate >= start && expDate <= end
			}
		}

		return matchesSearch && matchesDate
	})

	useEffect(() => {
		onCountChange?.(filteredEmployees.length)
	}, [filteredEmployees.length, onCountChange])

	const excelColumns = [
		{ title: 'Employee Name', field: 'name' },
		{ title: 'Position', field: 'position' },
		{ title: 'Document Type', field: 'document_type' },
		{ title: 'Expiry Date', field: 'formatted_expiry_date' },
		{ title: 'Email', field: 'email' },
		{ title: 'Mobile', field: 'mobile' },
		{ title: 'Status', field: 'expiry_status' },
	]

	const excelData = filteredEmployees.map((emp: any) => ({
		...emp,
		formatted_expiry_date: emp.expiry_date ? DayJS(emp.expiry_date).format('DD/MM/YYYY') : '-',
		expiry_status:
			emp.days_diff < 0
				? `Expired (${Math.abs(emp.days_diff)}d ago)`
				: emp.days_diff === 0
				? 'Expires Today'
				: `Expires in ${emp.days_diff}d`,
	}))

	const getDocStatusBadge = (daysDiff: number) => {
		if (daysDiff < 0) {
			return (
				<span className='badge badge-light-danger fw-bold fs-8 px-2 py-1'>
					Expired ({Math.abs(daysDiff)}d ago)
				</span>
			)
		}
		if (daysDiff === 0) {
			return <span className='badge badge-light-danger fw-bold fs-8 px-2 py-1'>Expires Today</span>
		}
		if (daysDiff <= 7) {
			return (
				<span className='badge badge-light-warning fw-bold fs-8 px-2 py-1'>
					Expires in {daysDiff}d
				</span>
			)
		}
		if (daysDiff <= 30) {
			return (
				<span className='badge badge-light-primary fw-bold fs-8 px-2 py-1'>
					Expires in {daysDiff}d
				</span>
			)
		}
		return (
			<span className='badge badge-light fw-bold fs-8 px-2 py-1 text-muted'>
				{daysDiff} days left
			</span>
		)
	}

	const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1
	const paginatedEmployees = filteredEmployees.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)

	return (
		<div className={`card ${className}`}>
			{/* Header */}
			<div className='card-header border-0 pt-5 pb-3 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
				<div className='d-flex align-items-center gap-3'>
					<span
						className='symbol symbol-40px'
						style={{
							background: '#fee2e2',
							color: '#dc2626',
							borderRadius: '10px',
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '18px',
						}}>
						<i className='bi bi-file-earmark-text-fill'></i>
					</span>
					<div>
						<div className='d-flex align-items-center gap-2'>
							<h3 className='card-title fw-bold fs-4 m-0 text-dark'>Agreement Expiries</h3>
							<span className='badge badge-light-danger fw-bold fs-8 px-2 py-1'>
								{filteredEmployees.length} Records
							</span>
						</div>
						<span className='text-muted fw-semibold fs-7'>
							Employment agreements, contracts & joining documentation status
						</span>
					</div>
				</div>

				{/* Toolbar: Search -> LengthMenu -> DownloadExcel -> DateFilter */}
				<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
					{/* 1. Search Filter */}
					<div style={{ width: '240px', minWidth: '180px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search employee or document...'
							className='me-0'
						/>
					</div>

					{/* 2. Dropdown (Show entries per page) */}
					<div style={{ flexShrink: 0 }}>
						<LengthMenu
							itemsPerPage={itemsPerPage}
							setItemsPerPage={(n) => {
								setItemsPerPage(n)
								setCurrentPage(1)
							}}
							className='me-0'
						/>
					</div>

					{/* 3. Excel Download Button */}
					<div style={{ flexShrink: 0 }}>
						<DownloadExcelButton
							data={excelData}
							columns={excelColumns}
							filename='Agreement_Expiries'
						/>
					</div>

					{/* 4. Date Filter */}
					<div style={{ flexShrink: 0 }}>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
							defaultAllDates={true}
							storageKey='hr_dashboard_expiry_range'
						/>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className='card-body py-2 px-6'>
				<div className='table-responsive'>
					<table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-3'>
						<thead>
							<tr className='fw-bolder text-muted text-uppercase fs-8 border-bottom border-gray-200'>
								<th className='ps-2 min-w-40px'>#</th>
								<th className='min-w-220px'>Employee</th>
								<th className='min-w-140px'>Position</th>
								<th className='min-w-160px'>Document Type</th>
								<th className='min-w-120px'>Expiry Date</th>
								<th className='min-w-150px text-center'>Status</th>
								<th className='min-w-80px text-end pe-2'>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								[1, 2, 3, 4, 5].map((i) => (
									<tr key={`skel-exp-${i}`}>
										<td className='ps-2'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '18px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='gz-hr-skeleton symbol symbol-40px symbol-circle me-3'></div>
												<div className='d-flex flex-column gap-1'>
													<span className='gz-hr-skeleton d-inline-block' style={{ width: '120px', height: '14px', borderRadius: '4px' }}></span>
													<span className='gz-hr-skeleton d-inline-block' style={{ width: '85px', height: '11px', borderRadius: '4px' }}></span>
												</div>
											</div>
										</td>
										<td>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '90px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '110px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '95px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td className='text-center'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '100px', height: '22px', borderRadius: '6px' }}></span>
										</td>
										<td className='text-end pe-2'>
											<span className='gz-hr-skeleton d-inline-block' style={{ width: '32px', height: '32px', borderRadius: '6px' }}></span>
										</td>
									</tr>
								))
							) : paginatedEmployees.length > 0 ? (
								paginatedEmployees.map((employee: any, index: number) => {
									const rowIndex = (currentPage - 1) * itemsPerPage + index + 1
									return (
										<tr key={employee._id} className='hover-elevate-up'>
											<td className='ps-2'>
												<span className='text-muted fw-semibold fs-7'>{rowIndex}</span>
											</td>
											<td>
												<div className='d-flex align-items-center'>
													<div className='symbol symbol-40px me-3'>
														{employee.photo ? (
															<img
																src={`https://files.fggroup.in/${employee.photo}`}
																alt={employee.name}
																onError={(e) => {
																	const target = e.target as HTMLImageElement
																	target.style.display = 'none'
																}}
																className='rounded-circle object-fit-cover'
															/>
														) : (
															<span className='symbol-label bg-light-primary text-primary fw-bold fs-6 rounded-circle'>
																{employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
															</span>
														)}
													</div>
													<div className='d-flex flex-column'>
														<span className='text-dark fw-bold text-hover-primary fs-6 mb-0'>
															{employee.name}
														</span>
														<span className='text-muted fs-8 fw-semibold'>
															{employee.mobile || employee.email || '-'}
														</span>
													</div>
												</div>
											</td>
											<td>
												<span className='text-dark fw-semibold fs-7'>
													{employee.position || 'Employee'}
												</span>
											</td>
											<td>
												<span className='badge badge-light fw-bold fs-8 px-2 py-1 text-gray-700'>
													{employee.document_type || 'Document'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-semibold fs-7'>
													{employee.expiry_date ? DayJS(employee.expiry_date).format('DD MMM YYYY') : '-'}
												</span>
											</td>
											<td className='text-center'>
												{getDocStatusBadge(employee.days_diff)}
											</td>
											<td className='text-end pe-2'>
												<TableButton
													action='view'
													to={`/hr/employee-view?employee_id=${employee._id}`}
												/>
											</td>
										</tr>
									)
								})
							) : (
								<tr>
									<td colSpan={7} className='text-center py-10'>
										<div className='text-muted fs-7'>
											<i className='bi bi-info-circle me-1'></i>
											{searchTerm ? 'No matching documents found' : 'No expired or expiring documents found'}
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination Footer */}
			{filteredEmployees.length > 0 && (
				<div className='card-footer border-0 p-0'>
					<UsersListPagination
						totalPages={totalPages}
						currentPage={currentPage}
						onPageChange={(page) => setCurrentPage(page)}
						totalRecords={filteredEmployees.length}
						itemsPerPage={itemsPerPage}
					/>
				</div>
			)}
		</div>
	)
}

export { ExpiredEmployeeTable }
