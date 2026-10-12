import { faCheck, faX } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import { ActionHiringRequest, GetHiringRequests } from '../../../Functions/FGGroup/HiringRequest'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import UsersListPagination from '../../../components/TablePagination'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'

const HiringRequest: React.FC = () => {
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [status, setStatus] = useState('')
	const [remarks, setRemarks] = useState('')
	const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

	const [requests, setRequests] = useState<any[]>([])
	const [employees, setEmployees] = useState<any[]>([])
	const [totalItems, setTotalItems] = useState(0)
	const [metaData, setMetaData] = useState<any>()
	const [requestStatus, setRequestStatus] = useState('')

	const sortableFields = [
		{ title: 'Manager Name', field: 'employee_id' },
		{ title: 'Position', field: 'position' },
		{ title: 'Budget', field: 'budget' },
		{ title: 'Experience', field: 'experience' },
		{ title: 'Status', field: 'request_status' },
		{ title: 'Manager Remarks', field: 'employee_remarks' },
		{ title: 'HR Remarks', field: 'remarks' },
	]

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const [requestsRes, employeesRes] = await Promise.all([
				GetHiringRequests({
					page: page || pagination.page,
					limit: pagination.itemsPerPage,
					sort: sort,
					sortOrder: sortOrder,
					search: searchTerm,
					request_status: requestStatus || undefined,			
				}),
				GetEmployees({ limit: 1000 }), // Fetch all employees for mapping
			])

			if (requestsRes.status === 200) {
				setRequests(requestsRes.data)
				setMetaData(requestsRes.metadata)
				if ((requestsRes.metadata as any)?.pagination) {
					setTotalItems((requestsRes.metadata as any).pagination.totalDocs)
				}
			}
			if (employeesRes.status === 200) {
				setEmployees(employeesRes.data)
			}
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, requestStatus])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const getEmployeeName = (id: string) => {
		const emp = employees.find((e) => e.employee_id === id || e.employee?._id === id)
		return emp ? emp.full_name : 'Unknown'
	}

	const handleActionClick = (id: string) => {
		setSelectedRequestId(id)
		setShowModal(true)
	}

	const handleModalClose = () => {
		setShowModal(false)
		setStatus('')
		setRemarks('')
		setSelectedRequestId(null)
	}

	const handleModalSubmit = async () => {
		if (!selectedRequestId || !status) {
			toast.error('Please select a status')
			return
		}

		setLoading(true)
		try {
			const res = await ActionHiringRequest({
				id: selectedRequestId,
				status: status,
				remarks: remarks,
			})

			if (res.status === 200) {
				toast.success(res.message || 'Hiring request updated')
				handleModalClose()
				fetchData()
			} else {
				toast.error(res.message || 'Failed to update hiring request')
			}
		} catch (error: any) {
			toast.error(error.message || 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}

	const handleSortChange = (field: string, order: 'asc' | 'desc') => {
		setSort(field)
		setSortOrder(order)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Hiring Request</PageTitle>
			<KTCard>
				<div className='row mx-6 my-4 align-items-center justify-content-between'>
					<div className='col-md-8 col-12'>
						<div className='d-md-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<div className='ms-md-3 mt-md-0 mt-3 d-md-block d-none'>
								<LengthMenu
									expenseData={requests}
									handleItemsPerPageChange={(limit) =>
										setPagination({ ...pagination, itemsPerPage: limit, page: 1 })
									}
								/>
							</div>
							<div className='ms-md-3 mt-md-0 mt-3'>
								<Form.Select
									value={requestStatus}
									onChange={(e) => setRequestStatus(e.target.value)}
									className='form-select form-select-sm form-select-solid'
									style={{ width: '150px' }}
								>
									<option value=''>All Status</option>
									<option value='Pending'>Pending</option>
									<option value='Approved'>Approved</option>
									<option value='Rejected'>Rejected</option>
									<option value='Completed'>Completed</option>
								</Form.Select>
							</div>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<style>{`
						.hiring-request-table thead tr th {
							vertical-align: middle !important;
							white-space: nowrap !important;
						}
					`}</style>
					<div className='table-responsive hiring-request-table'>
						<Table
							data={requests}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<tr key={item._id}>
									<td className='text-center'>
										<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
									</td>
									<td>
										<span className='text-dark fw-bold d-block mb-1 fs-6'>
											{getEmployeeName(item.employee_id)}
										</span>
									</td>
									<td>
										<span className='text-dark fw-bold d-block mb-1 fs-6'>{item.position}</span>
									</td>
									<td>
										<span className='text-dark fw-bold d-block mb-1 fs-6'>{item.budget}</span>
									</td>
									<td>
										<span className='text-dark fw-bold d-block mb-1 fs-6'>{item.experience}</span>
									</td>
									<td>
										<span
											className={`badge badge-light-${
												item.request_status?.toLowerCase() === 'approved'
													? 'success'
													: item.request_status?.toLowerCase() === 'rejected'
													? 'danger'
													: item.request_status?.toLowerCase() === 'completed'
													? 'primary'
													: 'warning'
											} fw-bold fs-7 px-3 py-2`}>
											{item.request_status?.toUpperCase()}
										</span>
									</td>
									<td>
										<span 
											className='text-dark fw-bold d-block mb-1 fs-6 text-truncate' 
											style={{ maxWidth: '150px' }} 
											title={item.employee_remarks}
										>
											{item.employee_remarks || '-'}
										</span>
									</td>
									<td>
										<span 
											className='text-dark fw-bold d-block mb-1 fs-6 text-truncate' 
											style={{ maxWidth: '150px' }} 
											title={item.remarks}
										>
											{item.remarks || '-'}
										</span>
									</td>
									<td>
										{item.request_status === 'Pending' ? (
											<TableButton
												action='edit'
												onClick={() => handleActionClick(item._id)}
												text='Action'
											/>
										) : (
											<span className='text-dark fw-normal d-block fs-7 ps-4'>Decision Made</span>
										)}
									</td>
								</tr>
							)}
							visibleDetails={visibleDetails}
							loading={loading}
							pagination={pagination}
							setPagination={setPagination}
						/>
					</div>
					{requests.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(totalItems / pagination.itemsPerPage) || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			{/* Modal for Approve/Reject Hiring Request */}
			<Modal
				show={showModal}
				centered
				onHide={handleModalClose}>
				<Modal.Header closeButton>
					<Modal.Title>Approve/Reject Hiring Request</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group
							className='mb-3'
							controlId='status'>
							<Form.Label>Status</Form.Label>
							<div className='d-flex mt-3'>
								<Form.Check
									type='radio'
									name='status'
									id='approve'
									value='Approved'
									checked={status === 'Approved'}
									onChange={(e) => setStatus(e.target.value)}
									className='d-none'
								/>
								<label
									htmlFor='approve'
									className='d-flex align-items-center'>
									<FontAwesomeIcon
										icon={faCheck}
										className={`fs-1 ${status === 'Approved' ? 'text-success' : 'text-muted'}`}
									/>
									<b
										className={`ms-2 me-9 ${status === 'Approved' ? 'text-success' : 'text-dark'}`}>
										{' '}
										Approve
									</b>
								</label>

								<Form.Check
									type='radio'
									name='status'
									id='reject'
									value='Rejected'
									checked={status === 'Rejected'}
									onChange={(e) => setStatus(e.target.value)}
									className='d-none'
								/>
								<label
									htmlFor='reject'
									className='d-flex align-items-center'>
									<FontAwesomeIcon
										icon={faX}
										className={`fs-2 ${status === 'Rejected' ? 'text-danger' : 'text-muted'}`}
									/>
									<b className={`ms-2 me-5 ${status === 'Rejected' ? 'text-danger' : 'text-dark'}`}>
										{' '}
										Reject
									</b>
								</label>
							</div>
						</Form.Group>
						<Form.Group
							className='my-3'
							controlId='remarks'>
							<Form.Label className='mt-3'>Remarks</Form.Label>
							<Form.Control
								as='textarea'
								rows={3}
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={handleModalClose}>
						Close
					</Button>
					<Button
						variant='primary'
						onClick={handleModalSubmit}>
						Submit
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default HiringRequest
