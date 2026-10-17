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
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import UsersListPagination from '../../../components/TablePagination'
import { DeleteEmployeeMemo, GetEmployees } from '../../../Functions/FGGroup/Employee'

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
					// Filter employees who have memos
					const employeesWithMemos = response.data.filter(
						(emp: any) => emp.employee?.memo && emp.employee.memo.length > 0
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
				const aLatestMemo =
					a.employee?.memo?.length > 0
						? new Date(a.employee.memo[a.employee.memo.length - 1].created_date).getTime()
						: 0
				const bLatestMemo =
					b.employee?.memo?.length > 0
						? new Date(b.employee.memo[b.employee.memo.length - 1].created_date).getTime()
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
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
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

	// Generate PDF for a memo - with larger text size and proper framing
	const generatePDF = async (employee: any, memo: any) => {
		const memoId = memo.id
		// Add this memo ID to the downloading set
		setDownloadingIds((prev) => new Set(prev).add(memoId))

		try {
			// Create a temporary HTML element for the PDF content
			const tempContainer = document.createElement('div')
			tempContainer.style.padding = '30px'
			tempContainer.style.fontFamily = 'Arial, sans-serif'
			tempContainer.style.maxWidth = '210mm'
			tempContainer.style.backgroundColor = '#fff'
			tempContainer.style.color = '#000'
			tempContainer.style.lineHeight = '1.6'
			tempContainer.style.fontSize = '14pt' // Increased text size
			tempContainer.style.border = '2px solid #000' // Added frame/border
			tempContainer.style.position = 'absolute'
			tempContainer.style.left = '-9999px' // Hide off-screen
			tempContainer.style.top = '-9999px' // Hide off-screen

			tempContainer.innerHTML = `
        <div class="text-center mb-4">
          <h3 class="fw-bold" style="font-size: 18pt;">Notice Regarding ${memo.subject}</h3>
        </div>
        
        <div class="mt-4">
          <p>Dear<strong> ${employee.full_name},</strong></p>
          
          <p class="mt-3">
            This is to formally notify you regarding your <strong>${memo.subject}${' '} 
            taken on ${formatDate(
							memo.date
						)}</strong>, during which no prior approval or timely communication was provided to 
            either your Reporting Manager or the HR Department.
          </p>
          
          <p class="mt-3">
            Your absence without authorization has caused disruption to workflow and has adversely 
            impacted team operations. As per company policy, all employees are required to obtain 
            prior approval for any leave of absence except in cases of genuine emergency, in which 
            immediate intimation is mandatory.
          </p>
          
          <p class="mt-3">
            You are hereby instructed to submit a written explanation for your unauthorized absence 
            within <strong>24/48 hours</strong> of receiving this notice. Failure to provide a satisfactory explanation 
            may result in disciplinary action as per company rules, which may include:
          </p>
          
          <ul class="mt-3" style="padding-left: 20px;">
            <li style="margin-bottom: 8px;">
              Deduction of salary for the unauthorized period of absence,
            </li>
            <li style="margin-bottom: 8px;">
              Issuance of a warning or show-cause notice,
            </li>
            <li style="margin-bottom: 8px;">
              Recording of misconduct in your employee file, and
            </li>
            <li style="margin-bottom: 8px;">
              Any further action as deemed appropriate under company policy.
            </li>
          </ul>
          
          <p class="mt-3">
            You are advised to ensure strict adherence to the leave policy henceforth to avoid further 
            consequences.
          </p>
          
          <div class="mt-5">
            <p class="mb-0"><strong>Sincerely,</strong></p>
            <br />
            <p class="mb-0">Yash Sutariya</p>
            <p class="mb-0">HR Manager</p>
            <p class="mb-0">FG Group</p>
          </div>
        </div>
      `

			document.body.appendChild(tempContainer)

			// Use html2canvas with optimized settings for text clarity
			const canvas = await html2canvas(tempContainer, {
				scale: 2, // Reduced scale to decrease file size while maintaining readability
				useCORS: true,
				logging: false,
				backgroundColor: '#ffffff',
				allowTaint: true,
				scrollX: 0,
				scrollY: 0,
			})

			const imgData = canvas.toDataURL('image/jpeg', 0.8) // Use JPEG with 80% quality to reduce file size

			// Create PDF with proper A4 dimensions
			const pdf = new jsPDF('p', 'mm', 'a4')
			const pdfWidth = pdf.internal.pageSize.getWidth()
			const pdfHeight = pdf.internal.pageSize.getHeight()

			// Calculate dimensions with proper margins
			const margin = 15
			const imgWidth = pdfWidth - margin * 2
			const imgHeight = (canvas.height * imgWidth) / canvas.width
			const xOffset = margin
			const yOffset = margin

			// Check if content fits on one page, otherwise adjust
			if (imgHeight > pdfHeight - margin * 2) {
				// Scale down to fit page
				const scaleFactor = (pdfHeight - margin * 2) / imgHeight
				const scaledWidth = imgWidth * scaleFactor
				const scaledHeight = imgHeight * scaleFactor
				const scaledXOffset = (pdfWidth - scaledWidth) / 2

				pdf.addImage(imgData, 'JPEG', scaledXOffset, yOffset, scaledWidth, scaledHeight)
			} else {
				// Content fits, center it
				const centerYOffset = (pdfHeight - imgHeight) / 2
				pdf.addImage(imgData, 'JPEG', xOffset, centerYOffset, imgWidth, imgHeight)
			}

			// Save the PDF with a meaningful name
			pdf.save(`Unplanned_Leave_Memo_${employee.full_name}_${formatDate(memo.date)}.pdf`)

			// Clean up
			document.body.removeChild(tempContainer)
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
							(emp: any) => emp.employee?.memo && emp.employee.memo.length > 0
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

	// Render PDF preview - with larger text size and proper framing
	const renderPdfPreview = () => {
		if (!previewData) return null

		const { employee, memo } = previewData

		// Check if this specific memo is downloading
		const isDownloading = downloadingIds.has(memo.id)

		return (
			<div
				className='modal fade show d-block'
				tabIndex={-1}
				role='dialog'
				style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
				<div
					className='modal-dialog modal-dialog-centered modal-lg'
					role='document'>
					<div className='modal-content'>
						<div className='modal-header'>
							<h5 className='modal-title'>Memo Preview</h5>
							<button
								type='button'
								className='btn-close'
								onClick={() => setShowPreview(false)}></button>
						</div>
						<div className='modal-body'>
							<div
								id='memoContent'
								className='p-4'
								style={{
									border: '2px solid #000', // Added frame/border
									fontFamily: 'Arial, sans-serif',
									maxWidth: '210mm', // A4 width
									margin: '0 auto',
									backgroundColor: '#fff',
									color: '#000',
									lineHeight: '1.6',
									fontSize: '14pt', // Increased text size
								}}>
								<div className='text-center mb-4'>
									<h3
										className='fw-bold'
										style={{ fontSize: '18pt' }}>
										Notice Regarding {memo.subject}
									</h3>
								</div>

								<div className='mt-4'>
									<p>
										Dear<strong> {employee.full_name},</strong>
									</p>

									<p className='mt-3'>
										This is to formally notify you regarding your{' '}
										<strong>
											{memo.subject} taken on {formatDate(memo.date)}
										</strong>
										, during which no prior approval or timely communication was provided to either
										your Reporting Manager or the HR Department.
									</p>

									<p className='mt-3'>
										Your absence without authorization has caused disruption to workflow and has
										adversely impacted team operations. As per company policy, all employees are
										required to obtain prior approval for any leave of absence except in cases of
										genuine emergency, in which immediate intimation is mandatory.
									</p>

									<p className='mt-3'>
										You are hereby instructed to submit a written explanation for your unauthorized
										absence within <strong>24/48 hours</strong> of receiving this notice. Failure to
										provide a satisfactory explanation may result in disciplinary action as per
										company rules, which may include:
									</p>

									<ul
										className='mt-3'
										style={{ paddingLeft: '20px' }}>
										<li style={{ marginBottom: '8px' }}>
											Deduction of salary for the unauthorized period of absence,
										</li>
										<li style={{ marginBottom: '8px' }}>
											Issuance of a warning or show-cause notice,
										</li>
										<li style={{ marginBottom: '8px' }}>
											Recording of misconduct in your employee file, and
										</li>
										<li style={{ marginBottom: '8px' }}>
											Any further action as deemed appropriate under company policy.
										</li>
									</ul>

									<p className='mt-3'>
										You are advised to ensure strict adherence to the leave policy henceforth to
										avoid further consequences.
									</p>

									<div className='mt-5'>
										<p className='mb-0'>
											<strong>Sincerely,</strong>
										</p>
										<br />
										<p className='mb-0'>Yash Sutariya</p>
										<p className='mb-0'>HR Manager</p>
										<p className='mb-0'>FG Group</p>
									</div>
								</div>
							</div>
						</div>
						<div className='modal-footer'>
							<button
								type='button'
								className='btn btn-secondary'
								onClick={() => setShowPreview(false)}>
								Close
							</button>
							<button
								type='button'
								className='btn btn-primary'
								onClick={() => {
									setShowPreview(false)
									generatePDF(employee, memo)
								}}
								disabled={isDownloading}>
								{isDownloading ? (
									<>
										<span className='spinner-border spinner-border-sm me-2'></span>
										Downloading...
									</>
								) : (
									'Download PDF'
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
					allMemos.push({
						employee,
						memo,
					})
				})
			}
		})

		// Filter by search term if provided
		const filtered = searchTerm
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
							<select
								className='gz-inv-select'
								style={{ width: '100%', height: '38px', borderRadius: '8px' }}
								value={selectedEmployee}
								onChange={(e) => setSelectedEmployee(e.target.value)}>
								<option value=''>All Employees</option>
								{employees.map((employee) => (
									<option
										key={employee.employee_id}
										value={employee.employee_id}>
										{employee.full_name} ({employee.employee?.employee_code})
									</option>
								))}
							</select>
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
										currentMemos.map(({ employee, memo }) => (
											<tr key={`${employee.employee_id}-${memo.id}`}>
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
