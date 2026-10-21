import { faDownload, faEye, faPlus, faSort, faSortDown, faSortUp, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { errorToast, successToast } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import UsersListPagination from '../../../components/TablePagination'
import DateFilter from '../../../components/DateRangePicker'
import { DeleteEmployeeMemo, GetEmployees } from '../../../Functions/FGGroup/Employee'
import { generateMemoPdf, MemoDocument } from './MemoDocument'
import './memo-letterhead.css'

function MemoList() {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [employees, setEmployees] = useState<any[]>([])
	const [filteredEmployees, setFilteredEmployees] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
	const [deleting, setDeleting] = useState(false)
	const [selectedEmployee, setSelectedEmployee] = useState<string>('')
	const [showPreview, setShowPreview] = useState(false)
	const [previewData, setPreviewData] = useState<{ employee: any; memo: any } | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [sort, setSort] = useState<string>('created_date')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setDateRange(range)
		setPagination((p) => ({ ...p, page: 1 }))
	}

	const handleSort = (field: string) => {
		if (sort === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			setSort(field)
			setSortOrder('asc')
		}
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

	// Fetch all employees with memos
	useEffect(() => {
		const fetchEmployees = async () => {
			setLoading(true)
			try {
				const response: any = await GetEmployees({ limit: 1000 })
				if (response.status === 200 && response.data) {
					// Filter employees who have valid memos
					const employeesWithMemos = response.data.filter(
						(emp: any) =>
							emp.employee?.memo &&
							Array.isArray(emp.employee.memo) &&
							emp.employee.memo.some(
								(m: any) => m && typeof m === 'object' && !Array.isArray(m)
							)
					)
					setEmployees(employeesWithMemos)
					setFilteredEmployees(employeesWithMemos)
				} else {
					errorToast('Failed to fetch employees')
				}
			} catch (error) {
				errorToast('Error fetching employees')
				console.error('Error fetching employees:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchEmployees()
	}, [])

	// Filter employees based on selected employee
	useEffect(() => {
		if (!selectedEmployee) {
			// Sort employees by latest memo date when no filter is applied
			const sortedEmployees = [...employees].sort((a, b) => {
				const aMemos = (a.employee?.memo || []).filter(
					(m: any) => m && typeof m === 'object' && !Array.isArray(m)
				)
				const bMemos = (b.employee?.memo || []).filter(
					(m: any) => m && typeof m === 'object' && !Array.isArray(m)
				)
				const aLatestMemo =
					aMemos.length > 0
						? new Date(aMemos[aMemos.length - 1].created_date).getTime()
						: 0
				const bLatestMemo =
					bMemos.length > 0
						? new Date(bMemos[bMemos.length - 1].created_date).getTime()
						: 0
				return bLatestMemo - aLatestMemo
			})
			setFilteredEmployees(sortedEmployees)
			return
		}

		const filtered = employees.filter((employee) => employee.employee_id === selectedEmployee)

		setFilteredEmployees(filtered)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [selectedEmployee, employees])

	// Format date as dd-mm-yyyy
	const formatDate = (dateString?: string) => {
		if (!dateString) return '-'
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return '-'
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = date.getFullYear()
		return `${day}-${month}-${year}`
	}

	// Get logged-in admin details from localStorage
	const getLoggedInAdminDetails = () => {
		const adminData = localStorage.getItem('fg_group_info')
		if (adminData) {
			try {
				return JSON.parse(adminData)
			} catch (error) {
				console.error('Error parsing admin data:', error)
				return null
			}
		}
		return null
	}

	// Generate PDF for a memo using the new corporate Navy Blue letterhead
	const generatePDF = async (employee: any, memo: any) => {
		const memoId = memo.id
		// Add this memo ID to the downloading set
		setDownloadingIds((prev) => new Set(prev).add(memoId))

		try {
			const adminDetails = getLoggedInAdminDetails()
			await generateMemoPdf(employee, memo, adminDetails?.full_name)
			successToast('Memo PDF downloaded successfully')
		} catch (error) {
			console.error('Error generating PDF:', error)
			errorToast('Error generating PDF')
		} finally {
			// Remove this memo ID from the downloading set
			setDownloadingIds((prev) => {
				const newSet = new Set(prev)
				newSet.delete(memoId)
				return newSet
			})
		}
	}

	// Handle view memo
	const handleViewMemo = (employee: any, memo: any) => {
		setPreviewData({ employee, memo })
		setShowPreview(true)
	}

	// Handle delete memo with SweetAlert
	const handleDeleteMemo = async (employee: any, memo: any) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		})

		if (result.isConfirmed) {
			setDeleting(true)
			try {
				// Get logged-in admin ID
				const adminData = localStorage.getItem('fg_group_info')
				let admin_id = null
				if (adminData) {
					try {
						const parsedData = JSON.parse(adminData)
						admin_id = parsedData._id
					} catch (error) {
						console.error('Error parsing admin data:', error)
					}
				}

				if (!admin_id) {
					errorToast('Unable to get logged-in user information')
					setDeleting(false)
					return
				}

				const response: any = await DeleteEmployeeMemo({
					admin_id,
					employee_id: employee.employee_id,
					memo_id: memo.id,
				})

				if (response.status === 200) {
					successToast('Memo deleted successfully')
					// Refresh the employee list
					const responseRefresh: any = await GetEmployees()
					if (responseRefresh.status === 200 && responseRefresh.data) {
						const employeesWithMemos = responseRefresh.data.filter(
							(emp: any) =>
								emp.employee?.memo &&
								Array.isArray(emp.employee.memo) &&
								emp.employee.memo.some(
									(m: any) => m && typeof m === 'object' && !Array.isArray(m)
								)
						)
						setEmployees(employeesWithMemos)
						setFilteredEmployees(employeesWithMemos)
					}
				} else {
					errorToast(response.message || 'Failed to delete memo')
				}
			} catch (error) {
				errorToast('Error deleting memo')
				console.error('Error deleting memo:', error)
			} finally {
				setDeleting(false)
			}
		}
	}

	// Render PDF preview with modern Navy Blue corporate letterhead
	const renderPdfPreview = () => {
		if (!previewData) return null

		const { employee, memo } = previewData
		const isDownloading = downloadingIds.has(memo.id)
		const adminDetails = getLoggedInAdminDetails()

		return (
			<div
				className='modal fade show d-block'
				tabIndex={-1}
				role='dialog'
				style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
				<div
					className='modal-dialog modal-dialog-centered gz-memo-modal-dialog'
					role='document'>
					<div
						className='modal-content'
						style={{
							borderRadius: '16px',
							overflow: 'hidden',
							border: 'none',
							boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
						}}>
						<div
							className='modal-header py-4 px-6'
							style={{ borderBottom: '1px solid #E4EAF2', background: '#FFFFFF' }}>
							<div className='d-flex align-items-center gap-3'>
								<div
									style={{
										width: '38px',
										height: '38px',
										borderRadius: '10px',
										background: '#EAF1FB',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: '#172B4D',
									}}>
									<i className='bi bi-file-earmark-text-fill fs-4'></i>
								</div>
								<div>
									<h5 className='modal-title fw-bold text-gray-900 m-0 fs-5'>
										Employee Memo Preview
									</h5>
									<span className='text-muted fs-7'>
										Executive Corporate Format • A4 Portrait
									</span>
								</div>
							</div>
							<button
								type='button'
								className='btn-close'
								onClick={() => setShowPreview(false)}></button>
						</div>
						<div className='modal-body gz-memo-modal-body p-4'>
							<div className='gz-memo-preview-container'>
								<MemoDocument
									employee={employee}
									memo={memo}
									adminName={adminDetails?.full_name}
								/>
							</div>
						</div>
						<div
							className='modal-footer py-3 px-6'
							style={{ borderTop: '1px solid #E4EAF2', background: '#FFFFFF' }}>
							<button
								type='button'
								className='btn btn-light'
								style={{ borderRadius: '8px', fontWeight: 600 }}
								onClick={() => setShowPreview(false)}>
								Close
							</button>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center gap-2'
								style={{
									borderRadius: '8px',
									fontWeight: 600,
									background: '#172B4D',
									borderColor: '#172B4D',
								}}
								onClick={() => generatePDF(employee, memo)}
								disabled={isDownloading}>
								{isDownloading ? (
									<>
										<span className='spinner-border spinner-border-sm'></span>
										<span>Generating PDF...</span>
									</>
								) : (
									<>
										<FontAwesomeIcon icon={faDownload} />
										<span>Download PDF</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Flatten and sort memos by created date (latest first)
	const getAllMemosSorted = () => {
		const allMemos: any[] = []

		filteredEmployees.forEach((employee) => {
			if (employee.employee?.memo?.length > 0) {
				employee.employee.memo.forEach((memo: any) => {
					// Guard against malformed or legacy string entries
					if (!memo || typeof memo !== 'object' || Array.isArray(memo)) {
						return
					}

					allMemos.push({
						employee,
						memo,
					})
				})
			}
		})

		// Filter by search term if provided
		let filtered = searchTerm
			? allMemos.filter((item) => {
					const term = searchTerm.toLowerCase()
					return (
						item.employee?.full_name?.toLowerCase().includes(term) ||
						item.employee?.employee?.employee_code?.toLowerCase().includes(term) ||
						item.memo?.subject?.toLowerCase().includes(term) ||
						item.memo?.reason?.toLowerCase().includes(term)
					)
			  })
			: allMemos

		// Filter by date range if provided
		if (dateRange && dateRange[0] && dateRange[1]) {
			const isAllDates = new Date(dateRange[0]).getFullYear() <= 2015
			if (!isAllDates) {
				const start = new Date(dateRange[0])
				start.setHours(0, 0, 0, 0)
				const end = new Date(dateRange[1])
				end.setHours(23, 59, 59, 999)

				filtered = filtered.filter((item) => {
					const memoDateStr = item.memo?.date || item.memo?.created_date
					if (!memoDateStr) return false
					const d = new Date(memoDateStr)
					return d >= start && d <= end
				})
			}
		}

		// Sort by selected field and order
		return filtered.sort((a, b) => {
			let aVal: any
			let bVal: any

			if (sort === 'employee') {
				aVal = a.employee?.full_name || ''
				bVal = b.employee?.full_name || ''
			} else if (sort === 'subject') {
				aVal = a.memo?.subject || ''
				bVal = b.memo?.subject || ''
			} else if (sort === 'date') {
				aVal = new Date(a.memo?.date || 0).getTime()
				bVal = new Date(b.memo?.date || 0).getTime()
			} else {
				aVal = new Date(a.memo?.created_date || 0).getTime()
				bVal = new Date(b.memo?.created_date || 0).getTime()
			}

			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
			}

			return sortOrder === 'asc'
				? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
				: String(bVal).localeCompare(String(aVal), undefined, { numeric: true, sensitivity: 'base' })
		})
	}

	const sortedMemos = getAllMemosSorted()

	// Exportable data structure for DownloadExcelButton
	const exportMemosData = sortedMemos.map((item) => ({
		'Employee Name': item.employee?.full_name || '-',
		'Employee Code': item.employee?.employee?.employee_code || '-',
		Subject: item.memo?.subject || '-',
		Date: item.memo?.date ? formatDate(item.memo.date) : '-',
		'Issued At': item.memo?.created_date ? formatDate(item.memo.created_date) : '-',
	}))

	// Pagination calculations
	const totalPages = Math.ceil(sortedMemos.length / pagination.itemsPerPage)
	const indexOfLastItem = pagination.page * pagination.itemsPerPage
	const indexOfFirstItem = indexOfLastItem - pagination.itemsPerPage
	const currentMemos = sortedMemos.slice(indexOfFirstItem, indexOfLastItem)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setPagination({ ...pagination, itemsPerPage, page: 1 })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Memos</PageTitle>

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<div className='d-flex align-items-center gap-2'>
						<h2 className='text-gray-900 fw-bold fs-2 m-0'>Employee Memos</h2>
						{sortedMemos.length > 0 && (
							<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
								{sortedMemos.length} Memos
							</span>
						)}
					</div>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Issue, review, and track formal employee notices, warnings, and official memos
					</span>
				</div>
			</div>

			{/* Filter Toolbar Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div
					className='card-body d-flex align-items-center justify-content-between flex-wrap gap-3'
					style={{ padding: '12px 18px' }}>
					<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3'>
						{/* 1. Searchbar */}
						<div style={{ minWidth: '240px', maxWidth: '360px', flex: '1 1 240px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={handleSearchChange}
								placeholder='Search employee or subject...'
								className='me-0'
							/>
						</div>

						{/* 2. Page Size / Length Menu */}
						<div>
							<LengthMenu
								data={sortedMemos}
								itemsPerPage={pagination.itemsPerPage}
								handleItemsPerPageChange={handleItemsPerPageChange}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<DownloadExcelButton
								data={exportMemosData}
								filename='Employee_Memos'
							/>
						</div>

						{/* 4. Employee Select Dropdown */}
						<div style={{ minWidth: '220px' }}>
							<SelectField
								showLabel={false}
								marginRemove={true}
								className='mb-0'
								height='38px'
								name='employee'
								value={selectedEmployee}
								defaultLabel='All Employees'
								options={employees.map((employee) => ({
									label: `${employee.full_name} (${employee.employee?.employee_code || ''})`,
									value: employee.employee_id,
								}))}
								onChange={(e: any) => {
									const val = e?.target?.value ?? e
									setSelectedEmployee(val || '')
								}}
							/>
						</div>

						{/* 5. Date Filter */}
						<div>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
								defaultAllDates={true}
								storageKey='hr_memo_date_range'
							/>
						</div>
					</div>

					{/* 6. End me right side Create Memo Button */}
					<div className='flex-shrink-0 ms-auto'>
						<button
							type='button'
							className='btn btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '8px' }}
							onClick={() => navigate('/hr/create-memo')}>
							<FontAwesomeIcon icon={faPlus} className='fs-6 text-white' />
							<span>Create Memo</span>
						</button>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
				<div className='card-body py-4'>

					{loading ? (
						<div
							className='d-flex justify-content-center align-items-center'
							style={{ height: '200px' }}>
							<div
								className='spinner-border'
								role='status'>
								<span className='visually-hidden'>Loading...</span>
							</div>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bold text-muted'>
										<th className='min-w-150px' onClick={() => handleSort('employee')} style={{ cursor: 'pointer', userSelect: 'none' }}>
											<div className='d-flex align-items-center gap-2'>
												<span>Employee</span>
												<FontAwesomeIcon icon={sort === 'employee' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'employee' ? 1 : 0.35, fontSize: '11px' }} />
											</div>
										</th>
										<th className='min-w-150px' onClick={() => handleSort('subject')} style={{ cursor: 'pointer', userSelect: 'none' }}>
											<div className='d-flex align-items-center gap-2'>
												<span>Subject</span>
												<FontAwesomeIcon icon={sort === 'subject' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'subject' ? 1 : 0.35, fontSize: '11px' }} />
											</div>
										</th>
										<th className='min-w-100px' onClick={() => handleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
											<div className='d-flex align-items-center gap-2'>
												<span>Date</span>
												<FontAwesomeIcon icon={sort === 'date' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'date' ? 1 : 0.35, fontSize: '11px' }} />
											</div>
										</th>
										<th className='min-w-100px' onClick={() => handleSort('created_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
											<div className='d-flex align-items-center gap-2'>
												<span>Created Date</span>
												<FontAwesomeIcon icon={sort === 'created_date' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} style={{ opacity: sort === 'created_date' ? 1 : 0.35, fontSize: '11px' }} />
											</div>
										</th>
										<th className='min-w-100px text-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{sortedMemos.length === 0 ? (
										<tr>
											<td
												colSpan={5}
												className='text-center'>
												<div className='py-10'>
													<h4>No memos found</h4>
													<p className='text-muted'>There are no employee memos to display.</p>
												</div>
											</td>
										</tr>
									) : (
										currentMemos.map(({ employee, memo }, idx) => (
											<tr key={`${employee.employee_id}-${memo?.id || `idx-${idx}`}`}>
												<td>
													<div className='d-flex align-items-center'>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold text-hover-primary fs-6'>
																{employee.full_name}
															</span>
															<span className='text-muted fw-semibold text-muted d-block fs-7'>
																{employee.employee?.employee_code}
															</span>
														</div>
													</div>
												</td>
												<td>
													<span className='text-dark fw-bold d-block fs-6'>{memo.subject}</span>
												</td>
												<td>
													<span className='text-muted fw-semibold d-block fs-7'>
														{formatDate(memo.date)}
													</span>
												</td>
												<td>
													<span className='text-muted fw-semibold d-block fs-7'>
														{formatDate(memo.created_date)}
													</span>
												</td>
												<td>
													<div className='d-flex align-items-center justify-content-end gap-2'>
														<button
															type='button'
															onClick={() => handleViewMemo(employee, memo)}
															className='gz-inv-action-btn view'
															title='View Memo'>
															<FontAwesomeIcon icon={faEye} />
														</button>
														<button
															type='button'
															onClick={() => generatePDF(employee, memo)}
															className='gz-inv-action-btn edit'
															title='Download PDF'
															disabled={downloadingIds.has(memo.id)}>
															{downloadingIds.has(memo.id) ? (
																<span className='spinner-border spinner-border-sm'></span>
															) : (
																<FontAwesomeIcon icon={faDownload} />
															)}
														</button>
														<button
															type='button'
															onClick={() => handleDeleteMemo(employee, memo)}
															disabled={deleting}
															className='gz-inv-action-btn delete'
															title='Delete Memo'>
															{deleting ? (
																<span className='spinner-border spinner-border-sm'></span>
															) : (
																<FontAwesomeIcon icon={faTrash} />
															)}
														</button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
				{sortedMemos.length > 0 && (
					<div className='card-footer p-0 border-0'>
						<UsersListPagination
							totalPages={totalPages}
							currentPage={pagination.page}
							totalRecords={sortedMemos.length}
							itemsPerPage={pagination.itemsPerPage}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</div>

			{/* PDF Preview Modal */}
			{showPreview && renderPdfPreview()}
		</>
	)
}

export default MemoList
