import { faEye, faPlusCircle, faQrcode, faStar, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { Link, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import SearchFilter from '../../../components/SearchFilter'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees, RemoveEmployee } from '../../../Functions/FGGroup/Employee'

interface PaginationState {
	page: number
	itemsPerPage: number
}

const HREmployeeDetail: React.FC = () => {
	const intl = useIntl()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employee_id = searchParams.get('employee_id')
	const [searchTerm, setSearchTerm] = useState(
		() => localStorage.getItem('hr_employee_searchTerm') || ''
	)
	const [showModal, setShowModal] = useState(false)
	const [employeeData, setEmployeeData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('desc')
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
		email: '',
		salary: '',
		account_detail: '',
		password: '',
		address: '',
		document: {
			isPdf: '',
			fileUrl: '',
		},
	})

	const [pagination, setPagination] = useState<PaginationState>(() => {
		try {
			const saved = localStorage.getItem('hr_employee_pagination')
			return saved ? JSON.parse(saved) : { page: 1, itemsPerPage: 10 }
		} catch (e) {
			return { page: 1, itemsPerPage: 10 }
		}
	})

	const fetchEmployeeData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetEmployees({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort: sort === 'name' ? 'full_name' : sort,
				sortOrder,
				search: searchTerm,
			})

			const employee = response?.data || []

			const filteredData: any = employee.map((item: any) => ({
				_id: item?._id,
				employee_code: item?.employee?.employee_code,
				name: item?.full_name,
				position: item?.employee?.position,
				salary: item?.employee?.salary,
				email: item?.email,
				address: item?.employee?.address,
				photo: item?.employee?.photo,
				mobile: item?.mobile,
				bank_name: item?.employee?.account_details?.bank_name,
				account_details: item?.employee?.account_details?.account_number,
				IFSC: item?.employee?.account_details?.IFSC,
				document: item.employee?.document,
			}))
			setEmployeeData(filteredData)

			const metaData: any = response?.metadata?.pagination || response?.metadata || {}
			setMetaData(metaData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		const timeout = setTimeout(() => {
			fetchEmployeeData()
		}, 300)
		return () => clearTimeout(timeout)
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, searchTerm])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		localStorage.setItem('hr_employee_searchTerm', searchTerm)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	useEffect(() => {
		localStorage.setItem('hr_employee_pagination', JSON.stringify(pagination))
	}, [pagination])

	const fetchCourseDataById = async (id: string) => {
		setLoading(true)
		try {
			const response: any = await GetEmployees({ id: id })
			const employee = response.data[0]

			let isPdf
			let fileUrl

			employee.employee.document.map((member: any) => {
				isPdf = member.link.endsWith('.pdf')
				fileUrl = 'https://files.fggroup.in/' + member.link
			})

			setEmployeeViewData({
				admin_id: employee._id,
				employee_code: employee?.employee?.employee_code,
				name: employee.full_name,
				position: employee?.employee?.position,
				mobile: employee.mobile,
				bank_name: employee?.employee?.account_details?.bank_name,
				account_details: employee?.employee?.account_details?.account_number,
				IFSC: employee?.employee?.account_details?.IFSC,
				email: employee.email,
				salary: employee.employee.salary,
				account_detail: employee.account_detail,
				password: '',
				address: employee.employee.address,
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
			email: employee?.email,
			salary: employee?.salary,
			account_detail: employee?.account_detail,
			password: '',
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
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
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
					await RemoveEmployee({ admin_id: _id })
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

	const handleSortChange = (newSort: string, newSortOrder: any) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Team Members</PageTitle>

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<div className='d-flex align-items-center gap-2'>
						<h2 className='text-gray-900 fw-bold fs-2 m-0'>Employee Directory</h2>
						{employeeData?.length > 0 && (
							<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
								{employeeData.length} Total
							</span>
						)}
					</div>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Manage active team members, designations, bank credentials & permissions
					</span>
				</div>
			</div>

			{/* Filter Toolbar (Order: Search -> LengthMenu -> DownloadExcel -> Filters -> Date -> Right-side Action Button) */}
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
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={handleSearchChange}
								placeholder='Search employee name, role...'
								className='me-0'
							/>
						</div>

						{/* 2. Page Size / Length Menu */}
						<div>
							<LengthMenu
								data={employeeData}
								itemsPerPage={pagination.itemsPerPage}
								handleItemsPerPageChange={handleItemsPerPageChange}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<DownloadExcelButton
								data={employeeData}
								columns={sortableFields}
								filename='Employee_List'
							/>
						</div>
					</div>

					{/* 6. End me right side Add Employee Button */}
					<div className='flex-shrink-0 ms-auto'>
						<Link to='/hr/employee-add'>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center gap-2 px-4'
								style={{ height: '38px', borderRadius: '8px' }}>
								<FontAwesomeIcon icon={faUserPlus} className='fs-6 text-white' />
								<span>Add Employee</span>
							</button>
						</Link>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
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
											className='data-row'
											style={{ transition: 'background-color 0.15s ease' }}>
											<td className='text-center ps-4'>
												<span className='text-muted fw-bold fs-7'>
													{actualIndex}
												</span>
											</td>
											<td>
												<span className='badge badge-light-secondary text-dark fw-bold fs-7 px-3 py-2' style={{ letterSpacing: '0.5px' }}>
													{employee?.employee_code || '-'}
												</span>
											</td>
											<td>
												<div className='d-flex flex-column'>
													<span className='text-gray-900 fw-bold fs-6'>
														{employee.name}
													</span>
													<span className='text-muted fs-7'>
														{employee.email || employee.mobile || 'No contact specified'}
													</span>
												</div>
											</td>
											<td>
												<span
													className='badge badge-light-primary fw-semibold fs-7 px-3 py-2'>
													{employee?.position || 'Staff'}
												</span>
											</td>
											<td>
												{employee.photo ? (
													<a
														href={`https://files.fggroup.in/` + employee.photo}
														target='_blank'
														rel='noopener noreferrer'
														className='d-inline-flex align-items-center justify-content-center'
														style={{ width: '42px', height: '42px' }}>
														<img
															src={`https://files.fggroup.in/` + employee.photo}
															alt={employee.name}
															style={{
																width: '42px',
																height: '42px',
																minWidth: '42px',
																maxWidth: '42px',
																minHeight: '42px',
																maxHeight: '42px',
																borderRadius: '10px',
																objectFit: 'cover',
																border: '1px solid #ded8d2',
																display: 'block',
																boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
															}}
														/>
													</a>
												) : (
													<div
														style={{
															width: '42px',
															height: '42px',
															minWidth: '42px',
															maxWidth: '42px',
															minHeight: '42px',
															maxHeight: '42px',
															borderRadius: '10px',
															background: '#f8fafc',
															color: '#64748b',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
															fontSize: '13px',
															fontWeight: 600,
															border: '1px solid #e2e8f0',
														}}>
														{employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
													</div>
												)}
											</td>
											<td>
												<div className='d-flex justify-content-center align-items-center gap-2'>
													<Link
														to={`/hr/employee-view?employee_id=${employee._id}`}
														className='gz-inv-action-btn view'
														title='View Profile'>
														<FontAwesomeIcon icon={faEye} />
													</Link>
													<button
														type='button'
														className='gz-inv-action-btn edit'
														onClick={(e) => {
															e.stopPropagation()
															setShowModal(true)
															fetchEditEmployeeData(employee)
														}}
														title='Bank & QR Details'>
														<FontAwesomeIcon icon={faQrcode} />
													</button>
													<Link
														to={`/hr/reports?employee_id=${employee._id}`}
														className='gz-inv-action-btn warning'
														title='Performance Rating'>
														<FontAwesomeIcon icon={faStar} />
													</Link>
													<button
														type='button'
														className='gz-inv-action-btn delete'
														onClick={(e) => {
															e.stopPropagation()
															handleDeleteFeature(employee._id)
														}}
														title='Delete Employee'>
														<FontAwesomeIcon icon={faTrash} />
													</button>
												</div>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12} className='bg-light-subtle p-4'>
													<div className='d-flex align-items-center gap-4'>
														{employee.photo && (
															<img
																src={`https://files.fggroup.in/` + employee.photo}
																alt={employee.name}
																style={{ width: '60px', height: '60px', borderRadius: '10px' }}
															/>
														)}
														<div>
															<div className='fw-bold fs-6 text-gray-900'>{employee.name}</div>
															<div className='text-muted fs-7'>{employee?.position}</div>
															<div className='text-muted fs-7 mt-1'>{employee?.email} | {employee?.mobile}</div>
														</div>
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

					{employeeData.length === 0 && !loading && (
						<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center py-12'>
							<i className='bi bi-people text-muted fs-2x mb-2'></i>
							<span className='text-gray-700 fw-bold fs-6'>No employees found</span>
							<span className='text-muted fs-7'>Try refining your search keyword</span>
						</div>
					)}
					{employeeData.length > 0 && (
						<UsersListPagination
							totalPages={
								metaData?.totalPages ||
								metaData?.total_pages ||
								Math.ceil(
									(metaData?.totalEmployees || metaData?.totalDocs || employeeData.length) /
										pagination.itemsPerPage
								)
							}
							currentPage={pagination.page}
							totalRecords={metaData?.totalEmployees || metaData?.totalDocs || employeeData.length}
							itemsPerPage={pagination.itemsPerPage}
							onPageChange={handlePageChange}
						/>
					)}
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
		</>
	)
}

export default HREmployeeDetail
