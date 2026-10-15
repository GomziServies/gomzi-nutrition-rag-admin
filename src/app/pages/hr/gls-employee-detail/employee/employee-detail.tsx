import { faEye, faPlusCircle, faQrcode, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { Link, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import CopyableInput from '../../../../components/CopyableInput'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { GetGlsEmployees, RemoveGlsEmployee } from '../../../../Functions/FGGroup'

interface PaginationState {
	page: number
	itemsPerPage: number
}

const EmployeeDetail: React.FC = () => {
	const intl = useIntl()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employee_id = searchParams.get('employee_id')
	const [searchTerm, setSearchTerm] = useState(
		() => localStorage.getItem('hr_gls_employee_searchTerm') || ''
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
		salary: '',
		account_detail: '',
		address: '',
		document: {
			isPdf: '',
			fileUrl: '',
		},
	})

	const [pagination, setPagination] = useState<PaginationState>(() => {
		try {
			const saved = localStorage.getItem('hr_gls_employee_pagination')
			return saved ? JSON.parse(saved) : { page: 1, itemsPerPage: 10 }
		} catch (e) {
			return { page: 1, itemsPerPage: 10 }
		}
	})

	const fetchEmployeeData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetGlsEmployees({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				search: searchTerm,
			})

			const employee = response.data

			const filteredData: any = employee.map((item: any) => ({
				_id: item?._id,
				employee_code: item?.employee_code,
				name: item?.full_name,
				position: item?.position,
				salary: item?.salary,
				address: item?.address,
				photo: item?.photo,
				mobile: item?.mobile,
				bank_name: item?.account_details?.bank_name,
				account_details: item?.account_details?.account_number,
				IFSC: item?.account_details?.IFSC,
				document: item.document,
			}))
			setEmployeeData(filteredData)

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		localStorage.setItem('hr_gls_employee_searchTerm', searchTerm)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	useEffect(() => {
		localStorage.setItem('hr_gls_employee_pagination', JSON.stringify(pagination))
	}, [pagination])

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
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
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
			<KTCard>
				<div className='row mx-6 my-4 align-items-center justify-content-between'>
					<div className='col-md-8 col-12'>
						<div className='d-md-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<div className='d-md-block d-none'>
								{employeeData?.length > 0 && (
									<select
										className='form-select form-select-sm mx-3'
										style={{ width: '80px' }}
										value={pagination.itemsPerPage}
										onChange={(e) =>
											setPagination((prev) => ({
												...prev,
												itemsPerPage: Number(e.target.value),
												page: 1,
											}))
										}>
										<option value='10'>10</option>
										<option value='50'>50</option>
										<option value='100'>100</option>
									</select>
								)}
							</div>
						</div>
					</div>
					<div className='col-md-4 col-12 px-0 d-flex justify-content-md-end justify-content-center mb-md-0 mt-4'>
						<div className='d-md-none d-block me-3'>
							{employeeData?.length > 0 && (
								<select
									className='form-select form-select-sm'
									style={{ width: '80px' }}
									value={pagination.itemsPerPage}
									onChange={(e) =>
										setPagination((prev) => ({
											...prev,
											itemsPerPage: Number(e.target.value),
											page: 1,
										}))
									}>
									<option value='10'>10</option>
									<option value='50'>50</option>
									<option value='100'>100</option>
								</select>
							)}
						</div>
						<Link to='/hr/gls-employees-add'>
							<button className='btn btn-sm py-4 btn-primary'>
								<KTIcon
									iconName='plus'
									className='fs-2'
								/>
								Add Employee
							</button>
						</Link>
					</div>
				</div>

				<div className='py-4 card-body'>
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
												<div className='d-flex justify-content-center'>
													<FontAwesomeIcon
														icon={faPlusCircle}
														className='mx-2 ms-5 mb-1 plus-icon'
														style={{ color: '#607D8B', fontSize: '18px' }}
													/>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</div>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{employee?.employee_code}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{employee.name}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{employee?.position}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													<a
														href={`https://files.fggroup.in/` + employee.photo}
														target='_blank'
														rel='noopener noreferrer'>
														<img
															src={`https://files.fggroup.in/` + employee.photo}
															alt={employee.name}
															style={{ width: '80px', height: '80px', borderRadius: '10px' }}
														/>
													</a>
												</span>
											</td>
											<td>
												<div className='d-flex justify-content-center align-items-center gap-1'>
													<TableButton
														action='view'
														to={`/hr/gls-employees-view?employee_id=${employee._id}`}
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
													<div>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															<a
																href={`https://files.fggroup.in/` + employee.photo}
																target='_blank'
																rel='noopener noreferrer'>
																<img
																	src={`https://files.fggroup.in/` + employee.photo}
																	alt={employee.name}
																	style={{ width: '80px', height: '80px', borderRadius: '10px' }}
																/>
															</a>
														</span>
														<strong>{sortableFields[0].title}:</strong> {employee.name}
														<br />
														<strong>{sortableFields[1].title}:</strong> {employee?.position}
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
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{employeeData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
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
			</KTCard>
		</>
	)
}

export default EmployeeDetail
