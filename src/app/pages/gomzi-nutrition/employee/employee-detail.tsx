import { faDownload, faEye, faPlusCircle, faQrcode, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { Link, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetGlsEmployees, RemoveGlsEmployee } from '../../../Functions/FGGroup'
import '../common-management.css'

const EmployeeDetail: React.FC = () => {
	const intl = useIntl()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employee_id = searchParams.get('employee_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [employeeData, setEmployeeData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [metaData, setMetaData] = useState<any>()
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [employeeViewData, setEmployeeViewData] = useState({
		admin_id: '',
		employee_code: '',
		name: '',
		position: '',
		mobile: '',
		bank_name: '',
		account_details: '',
		IFSC: '',
		salary: '',
		account_detail: '',
		address: '',
		document: {
			isPdf: '',
			fileUrl: '',
		},
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const fetchEmployeeData = async (page?: number) => {
		setLoading(true)
		try {
			const queryPayload: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm,
			}

			if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
				const start = new Date(selectedDateRange[0])
				start.setHours(0, 0, 0, 0)
				const end = new Date(selectedDateRange[1])
				end.setHours(23, 59, 59, 999)
				queryPayload.start_date = start.toISOString()
				queryPayload.end_date = end.toISOString()
			}

			const response: any = await GetGlsEmployees(queryPayload)

			const employee = response.data || []

			const filteredData: any = employee.map((item: any) => ({
				_id: item?._id,
				employee_code: item?.employee_code || (item?._id ? `EMP-${item._id.toString().slice(-4).toUpperCase()}` : '-'),
				name: item?.full_name || item?.name || 'N/A',
				email: item?.email || '-',
				type: item?.type || 'Staff',
				position: item?.position || item?.type || 'Employee',
				salary: item?.salary || '0',
				address: item?.address || '-',
				photo: item?.photo || '',
				mobile: item?.mobile || '-',
				bank_name: item?.account_details?.bank_name || '-',
				account_details: item?.account_details?.account_number || '-',
				IFSC: item?.account_details?.IFSC || '-',
				document: item.document || [],
			}))
			setEmployeeData(filteredData)

			const metaData: any = response.metadata
			setMetaData(metaData?.pagination)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const downloadExcel = async () => {
		try {
			setExporting(true)
			const toastId = toast.loading('Exporting employees to Excel...')

			const queryPayload: any = {
				page: 1,
				limit: 10000,
				search: searchTerm,
				sort,
				sortOrder,
			}

			if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
				const start = new Date(selectedDateRange[0])
				start.setHours(0, 0, 0, 0)
				const end = new Date(selectedDateRange[1])
				end.setHours(23, 59, 59, 999)
				queryPayload.start_date = start.toISOString()
				queryPayload.end_date = end.toISOString()
			}

			const response: any = await GetGlsEmployees(queryPayload)
			const employees = response?.data || []

			if (employees.length === 0) {
				toast.dismiss(toastId)
				toast.error('No employees found to export')
				return
			}

			const worksheetData = employees.map((emp: any, index: number) => ({
				'No': index + 1,
				'Employee Code': emp.employee_code || '-',
				'Full Name': emp.full_name || emp.name || '-',
				'Email': emp.email || '-',
				'Role': emp.type || '-',
				'Position': emp.position || '-',
				'Mobile': emp.mobile || '-',
				'Salary': emp.salary || '-',
				'Bank Name': emp.account_details?.bank_name || '-',
				'Account Number': emp.account_details?.account_number || '-',
				'IFSC Code': emp.account_details?.IFSC || '-',
				'Joining Date': emp.joining_date || '-',
				'Created At': emp.createdAt ? DayJS(emp.createdAt).format('DD/MM/YYYY hh:mm:ss A') : '-',
			}))

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
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees')
			XLSX.writeFile(workbook, `Employees_${DayJS(new Date()).format('DD-MM-YYYY')}.xlsx`)

			toast.dismiss(toastId)
			toast.success(`${employees.length} employees exported successfully`)
		} catch (error: any) {
			console.error('Export error:', error)
			toast.error('Unable to export employee data')
		} finally {
			setExporting(false)
		}
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [selectedDateRange, pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchEmployeeData()
		}
	}, [searchTerm])

	const fetchCourseDataById = async (id: string) => {
		setLoading(true)
		try {
			const response: any = await GetGlsEmployees({ id: id })
			const employee = response.data[0]

			let isPdf
			let fileUrl

			employee.document.map((member: any) => {
				isPdf = member.link.endsWith('.pdf')
				fileUrl = 'https://files.fggroup.in/' + member.link
			})

			setEmployeeViewData({
				admin_id: employee._id,
				employee_code: employee?.employee_code,
				name: employee.full_name,
				position: employee?.position,
				mobile: employee.mobile,
				bank_name: employee?.account_details?.bank_name,
				account_details: employee?.account_details?.account_number,
				IFSC: employee?.account_details?.IFSC,
				salary: employee.salary,
				account_detail: employee.account_detail,
				address: employee.address,
				document: {
					isPdf: isPdf || '',
					fileUrl: fileUrl || '',
				},
			})

			setLoading(false)
			setShowModal(true)
		} catch (error) {
			console.error(error)
			setLoading(false)
		}
	}

	const fetchEditEmployeeData = async (employee: any) => {
		setShowModal(true)

		let isPdf
		let fileUrl

		employee?.document.map((member: any) => {
			if (member.document_type == 'Google Pay QR Code') {
				isPdf = member.link.endsWith('.pdf')
				fileUrl = 'https://files.fggroup.in/' + member.link
			}
		})

		setEmployeeViewData({
			admin_id: employee?._id,
			employee_code: employee?.employee_code,
			name: employee?.name,
			position: employee?.position,
			mobile: employee?.mobile,
			bank_name: employee?.bank_name,
			account_details: employee?.account_details,
			IFSC: employee?.IFSC,
			salary: employee?.salary,
			account_detail: employee?.account_detail,
			address: employee?.address,
			document: {
				isPdf: isPdf || '',
				fileUrl: fileUrl || '',
			},
		})
	}

	useEffect(() => {
		if (employee_id) {
			fetchCourseDataById(employee_id)
		}
	}, [employee_id])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}
	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleDeleteFeature = async (_id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveGlsEmployee({ id: _id })
					toast.success('Employee Deleted Successfully')
					fetchEmployeeData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const sortableFields = [
		{ title: 'Employee Code', field: 'employee_code' },
		{ title: 'Name', field: 'name' },
		{ title: 'Position', field: 'position' },
		{ title: 'Image', field: 'image' },
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

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Team Members</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Staff Management</span>
				<span className='sep'>/</span>
				<span className='current'>Team Members</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Employee Directory</h1>
					<p className='gz-mgmt-subtitle'>Manage internal staff, designations, biometric QR credentials, and member profiles</p>
				</div>
				<TableButton
					action='add'
					to='/rag/employee-add'
					text='Add Employee'
				/>
			</div>

			<div className='gz-mgmt-card'>
				<div className='gz-mgmt-toolbar'>
					<div className='gz-mgmt-toolbar-left'>
						{/* 1. Searchbar */}
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							className='me-0'
						/>

						{/* 2. Dropdown (show entries per page) */}
						<LengthMenu
							expenseData={employeeData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>

						{/* 3. Download Excel */}
						<div>
							<DownloadExcelButton
								onClick={downloadExcel}
								disabled={exporting}
								loading={exporting}
								title='Download Excel'
							/>
						</div>

						{/* 4. Datefilter */}
						<div className='d-flex align-items-center flex-shrink-0'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>
				</div>

				<div className='card-body p-0'>
					<div className='table-responsive'>
						<Table
							data={employeeData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(
								employee: any,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => {
								return (
									<React.Fragment key={employee._id}>
										<tr
											onClick={() => handleRowClick(employee._id)}
											className='data-row'>
											<td className='text-center'>
												<div className='d-flex align-items-center justify-content-center'>
													<FontAwesomeIcon
														icon={faPlusCircle}
														className='mx-1 mb-1 plus-icon'
														style={{ color: '#607D8B', fontSize: '18px' }}
													/>
													<span className='fw-bold d-block mb-1 fs-6' style={{ color: '#172B4D' }}>
														{actualIndex}
													</span>
												</div>
											</td>
											<td>
												<span className='gz-mgmt-pill info'>
													{employee?.employee_code || '-'}
												</span>
											</td>
											<td>
												<div className='gz-mgmt-identity-cell'>
													<img
														src={employee.photo ? `https://files.fggroup.in/${employee.photo}` : '/media/avatars/300-1.jpg'}
														alt={employee.name}
														className='gz-mgmt-avatar'
													/>
													<div className='gz-mgmt-identity-info'>
														<span className='name'>{employee.name}</span>
														<span className='sub'>{employee.email && employee.email !== '-' ? `${employee.email} • ` : ''}{employee.mobile || '-'}</span>
													</div>
												</div>
											</td>
											<td>
												<span className='gz-mgmt-pill' style={{ background: '#F1F5F9', color: '#475569' }}>
													{employee?.position || 'Staff'}
												</span>
											</td>
											<td>
												<a
													href={`https://files.fggroup.in/` + employee.photo}
													target='_blank'
													rel='noopener noreferrer'
													className='text-decoration-none'>
													<img
														src={`https://files.fggroup.in/` + employee.photo}
														alt={employee.name}
														style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #DFE7F0' }}
													/>
												</a>
											</td>
											<td>
												<div className='d-flex justify-content-center align-items-center gap-1'>
													<TableButton
														action='view'
														to={`/rag/employee-view?employee_id=${employee._id}`}
														title='View Employee'
													/>
													<TableButton
														action='qr'
														onClick={() => {
															setShowModal(true)
															fetchEditEmployeeData(employee)
														}}
														title='Employee QR'
													/>
													<TableButton
														action='remove'
														onClick={() => handleDeleteFeature(employee._id)}
														title='Delete Employee'
													/>
													<TableButton
														action='star'
														text='Rating'
														to='/hr/reports'
														title='Employee Rating'
													/>
												</div>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div className='p-3' style={{ background: '#F8FAFC', borderRadius: '8px' }}>
														<img
															src={`https://files.fggroup.in/` + employee.photo}
															alt={employee.name}
															style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
														/>
														<br />
														<strong>Employee Code:</strong> {employee?.employee_code}
														<br />
														<strong>Name:</strong> {employee.name}
														<br />
														<strong>Position:</strong> {employee?.position}
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								)
							}}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{employeeData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center py-10 text-muted'>
							<b>No employee records found</b>
						</div>
					)}
					{employeeData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages || metaData?.total_pages || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
							totalRecords={metaData?.totalDocs ?? metaData?.totalRecords ?? metaData?.totalCount ?? employeeData.length}
							itemsPerPage={pagination.itemsPerPage}
							entityName='employees'
						/>
					)}
				</div>
			</div>

				{/* member view modal */}

				<Modal
					show={showModal}
					onHide={() => setShowModal(false)}
					centered>
					<Modal.Header closeButton>
						<Modal.Title>Employee Bank Details</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div className='row'>
							<div className='col-md-12 fv-row'>
								<CopyableInput
									placeholder='Bank Name'
									type='text'
									className='col-12 fv-row mb-7'
									name='bank_name'
									label='Bank Name'
									htmlFor='bank_name'
									value={employeeViewData.bank_name}
								/>
							</div>
							<div className='col-md-12 fv-row'>
								<CopyableInput
									placeholder='Account No.'
									type='text'
									className='col-12 fv-row mb-7'
									name='account_details'
									label='Account No.'
									htmlFor='account_details'
									value={employeeViewData.account_details}
								/>
							</div>
							<div className='col-md-12 fv-row'>
								<CopyableInput
									placeholder='IFSC Code'
									type='text'
									className='col-12 fv-row mb-7'
									name='IFSC'
									label='IFSC Code'
									htmlFor='IFSC'
									value={employeeViewData.IFSC}
								/>
							</div>
							<div className='col-md-12'>
								<div>
									<label
										htmlFor='qr'
										className=' mb-2'>
										<b>QR Code</b>
									</label>
								</div>

								{employeeViewData?.document?.isPdf ? (
									<a
										href={employeeViewData?.document?.fileUrl}
										target='_blank'
										rel='noopener noreferrer'>
										<embed
											src={employeeViewData?.document?.fileUrl}
											className='w-md-50 w-75'
										/>
									</a>
								) : (
									<a
										href={employeeViewData?.document?.fileUrl}
										target='_blank'
										rel='noopener noreferrer'>
										<img
											src={employeeViewData?.document?.fileUrl}
											className='w-md-50 w-75'
											alt='Image preview'
										/>
									</a>
								)}
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant='secondary'
							onClick={() => setShowModal(false)}>
							Close
						</Button>
					</Modal.Footer>
				</Modal>
		</div>
	)
}

export default EmployeeDetail
