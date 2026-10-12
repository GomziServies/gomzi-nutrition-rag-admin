import { faCheck, faEye, faPencilAlt, faPlusCircle, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import DateFilter from '../../../components/DateRangePicker'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { CreateHiringRequest, GetHiringRequests, UpdateHiringRequest } from '../../../Functions/FGGroup/HiringRequest'
import { useAuth } from '../../../modules/auth'
import InputField from '../../../components/InputField'
import TextareaField from '../../../components/TextareaField'

const HiringRequest: React.FC = () => {
	const { currentUser } = useAuth()
	const [searchTerm, setSearchTerm] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [hiringRequests, setHiringRequests] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const [formData, setFormData] = useState({
		position: '',
		budget: '',
		experience: '',
		employee_remarks: '',
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchHiringRequests = async () => {
		const employeeData: any = localStorage.getItem('fg_group_info')
		const employee = JSON.parse(employeeData)

		setLoading(true)
		try {
			const response = await GetHiringRequests({
				page: pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
				employee_id: employee?.employee_id || employee?._id,
				start_date: selectedDateRange ? DayJS(selectedDateRange[0]).format('YYYY-MM-DD') : undefined,
				end_date: selectedDateRange ? DayJS(selectedDateRange[1]).format('YYYY-MM-DD') : undefined,
			} as any)
			if (response.data) {
				setHiringRequests(response.data)
				setMetaData((response.metadata as any)?.pagination)
			}
		} catch (error) {
			console.error('Error fetching hiring requests:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchHiringRequests()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, searchTerm, selectedDateRange])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.position || !formData.budget || !formData.experience || !formData.employee_remarks) {
			toast.error('Please fill all the fields')
			return
		}

		setLoading(true)
		try {
			const employeeData: any = localStorage.getItem('fg_group_info')
			const employee = JSON.parse(employeeData)

			if (editingId) {
				await UpdateHiringRequest({
					id: editingId,
					...formData,
				})
				toast.success('Hiring Request Updated Successfully')
			} else {
				const payload = {
					...formData,
					employee_id: employee?.employee_id || employee?._id,
				}
				await CreateHiringRequest(payload)
				toast.success('Hiring Request Submitted Successfully')
			}

			setShowModal(false)
			setFormData({
				position: '',
				budget: '',
				experience: '',
				employee_remarks: '',
			})
			setEditingId(null)
			fetchHiringRequests()
		} catch (error: any) {
			toast.error(error.message || 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}

	const handleMarkAsDone = async (id: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: 'You want to mark this request as completed?',
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, complete it!',
		})

		if (result.isConfirmed) {
			try {
				const response = await UpdateHiringRequest({ id, request_status: 'Completed' })
				if (response.status === 200) {
					toast.success('Hiring request marked as completed')
					fetchHiringRequests()
				} else {
					toast.error(response.message || 'Failed to update request')
				}
			} catch (error) {
				toast.error('An error occurred')
			}
		}
	}

	const handleEdit = (item: any) => {
		setEditingId(item._id)
		setFormData({
			position: item.position,
			budget: item.budget,
			experience: item.experience,
			employee_remarks: item.employee_remarks || '',
		})
		setShowModal(true)
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const columns = [
		{ title: 'Position', field: 'position' },
		{ title: 'Budget', field: 'budget' },
		{ title: 'Experience', field: 'experience' },
		{ title: 'Status', field: 'request_status' },
		{ title: 'Remarks', field: 'employee_remarks' },
		{ title: 'HR Remarks', field: 'remarks' },
		{ title: 'Date', field: 'updatedAt' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Hiring Requests</PageTitle>
			<KTCard>
				<div className='row mx-6 my-4 align-items-center justify-content-between'>
					<div className='col-md-6 col-12'>
						<div className='d-md-flex align-items-center'>
							<SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
							<div className='ms-md-3 mt-md-0 mt-3 d-md-block d-none'>
								<LengthMenu
									expenseData={hiringRequests}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
						</div>
					</div>
					<div className='col-md-6 col-12 px-0 d-flex justify-content-md-end justify-content-center align-items-center mb-md-0 mt-4'>
						<div className='me-3'>
							<DateFilter 
								onDateRangeChange={handleDateRangeChange} 
								rightValue='0'
							/>
						</div>
						<button
							className='btn btn-sm py-4 btn-primary'
							onClick={() => {
								setEditingId(null)
								setFormData({
									position: '',
									budget: '',
									experience: '',
									employee_remarks: '',
								})
								setShowModal(true)
							}}
						>
							<KTIcon iconName='plus' className='fs-2' />
							Add Request
						</button>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={hiringRequests}
							columns={columns}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number) => (
								<tr key={item._id} className='data-row'>
									<td className='text-center'>
										<div className='d-flex justify-content-center'>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
										</div>
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
											{item.request_status?.toLowerCase() !== 'pending' && item.remarks ? item.remarks : '-'}
										</span>
									</td>
									<td>
										<div className='d-flex flex-column'>
											<span className='text-dark fw-bold mb-1 fs-6'>
												{DayJS(item.updatedAt).format('DD MMM YYYY')}
											</span>
											<span className='text-muted fs-7'>
												{DayJS(item.updatedAt).format('hh:mm A')}
											</span>
										</div>
									</td>
									<td>
										<div className='d-flex gap-2 justify-content-start'>
											{item.request_status === 'Pending' && (
												<TableButton
													action='edit'
													onClick={() => handleEdit(item)}
												/>
											)}
											{item.request_status === 'Approved' && (
												<TableButton
													action='approve'
													onClick={() => handleMarkAsDone(item._id)}
													text='Done'
												/>
											)}
										</div>
									</td>
								</tr>
							)}
							visibleDetails={null}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
							removeAction={false}
						/>
					</div>
					{hiringRequests.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{hiringRequests.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>

				<Modal
					show={showModal}
					onHide={() => setShowModal(false)}
					centered
				>
					<Modal.Header closeButton>
						<Modal.Title>{editingId ? 'Edit' : 'Create'} Hiring Request</Modal.Title>
					</Modal.Header>
					<form onSubmit={handleSubmit}>
						<Modal.Body>
							<InputField
								label='Position'
								placeholder='Enter position'
								type='text'
								name='position'
								htmlFor='position'
								value={formData.position}
								onChange={handleInputChange as any}
								className='mb-7'
							/>
							<InputField
								label='Budget'
								placeholder='Enter budget'
								type='text'
								name='budget'
								htmlFor='budget'
								value={formData.budget}
								onChange={handleInputChange as any}
								className='mb-7'
							/>
							<InputField
								label='Experience'
								placeholder='e.g. 2+ Years'
								type='text'
								name='experience'
								htmlFor='experience'
								value={formData.experience}
								onChange={handleInputChange as any}
								className='mb-7'
							/>
							<div className='mb-n7'>
								<TextareaField
									label='Remarks'
									placeholder='Enter any specific requirements or remarks'
									name='employee_remarks'
									htmlFor='employee_remarks'
									value={formData.employee_remarks}
									onChange={handleInputChange as any}
									className='mb-0'
								/>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant='secondary' onClick={() => setShowModal(false)}>
								Cancel
							</Button>
							<Button variant='primary' type='submit' disabled={loading}>
								{loading ? 'Submitting...' : editingId ? 'Update Request' : 'Submit Request'}
							</Button>
						</Modal.Footer>
					</form>
				</Modal>
			</KTCard>
		</>
	)
}

export default HiringRequest
