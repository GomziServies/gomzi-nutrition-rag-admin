import { faCheck, faEdit, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import DateFilter from '../../../components/DateRangePicker'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { CreateHiringRequest, GetHiringRequests, UpdateHiringRequest } from '../../../Functions/FGGroup/HiringRequest'
import InputField from '../../../components/InputField'
import TextareaField from '../../../components/TextareaField'

const HiringRequest: React.FC = () => {
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

	const getStoredEmployee = () => {
		try {
			const raw =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			return raw ? JSON.parse(raw) : {}
		} catch {
			return {}
		}
	}

	const fetchHiringRequests = async () => {
		setLoading(true)
		try {
			const employee = getStoredEmployee()
			const empId = employee?.employee_id || employee?._id || employee?.id

			const response: any = await GetHiringRequests({
				page: pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
				employee_id: empId,
				start_date: selectedDateRange ? DayJS(selectedDateRange[0]).format('YYYY-MM-DD') : undefined,
				end_date: selectedDateRange ? DayJS(selectedDateRange[1]).format('YYYY-MM-DD') : undefined,
			} as any)
			if (response?.data) {
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
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
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
			const employee = getStoredEmployee()
			const empId = employee?.employee_id || employee?._id || employee?.id

			if (editingId) {
				await UpdateHiringRequest({
					id: editingId,
					...formData,
				})
				toast.success('Hiring Request Updated Successfully')
			} else {
				const payload = {
					...formData,
					employee_id: empId,
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

	const totalCount = metaData?.totalCount || hiringRequests.length

	return (
		<>
			<PageTitle breadcrumbs={[]}>Hiring Requests</PageTitle>

			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-column gap-4'>
					{/* Header Top: Title & Right Add Request Button */}
					<div className='d-flex align-items-center justify-content-between flex-wrap gap-3 w-100'>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h2 className='fw-bolder text-gray-900 mb-0'>Hiring Requests</h2>
								<span className='badge badge-light-primary fw-bold fs-8'>
									{totalCount} records
								</span>
							</div>
							<span className='text-muted fs-7 fw-semibold mt-1'>
								Submit requisition requests for new team members and track approval status
							</span>
						</div>

						<button
							className='btn btn-primary d-inline-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '10px' }}
							onClick={() => {
								setEditingId(null)
								setFormData({
									position: '',
									budget: '',
									experience: '',
									employee_remarks: '',
								})
								setShowModal(true)
							}}>
							<FontAwesomeIcon icon={faPlus} />
							<span>Add Request</span>
						</button>
					</div>

					{/* Header Bottom: Filter Bar */}
					<div className='d-flex align-items-center flex-wrap gap-3 w-100 pb-2'>
						<div style={{ minWidth: '220px' }}>
							<SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
						</div>
						<LengthMenu
							expenseData={hiringRequests}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
						<DateFilter 
							onDateRangeChange={handleDateRangeChange} 
							rightValue='0'
						/>
					</div>
				</div>

				<div className='card-body py-4 px-6'>
					<div className='table-responsive'>
						<Table
							data={hiringRequests}
							columns={columns}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number) => (
								<tr key={item._id} className='data-row' style={{ verticalAlign: 'middle', borderBottom: '1px solid #f1f1f4' }}>
									<td className='text-center py-3' style={{ width: '60px' }}>
										<span className='badge badge-light-secondary fw-bolder px-2 py-1' style={{ borderRadius: '6px' }}>
											{actualIndex}
										</span>
									</td>
									<td className='py-3'>
										<span className='text-gray-900 fw-bold fs-6'>{item.position}</span>
									</td>
									<td className='py-3'>
										<span className='text-gray-800 fw-semibold fs-7'>₹{item.budget}</span>
									</td>
									<td className='py-3'>
										<span className='badge badge-light-info fw-semibold px-2 py-1' style={{ borderRadius: '6px' }}>
											{item.experience}
										</span>
									</td>
									<td className='py-3'>
										<span
											className={`badge badge-light-${
												item.request_status?.toLowerCase() === 'approved'
													? 'success'
													: item.request_status?.toLowerCase() === 'rejected'
													? 'danger'
													: item.request_status?.toLowerCase() === 'completed'
													? 'primary'
													: 'warning'
											} fw-bold fs-7 px-3 py-1`}
											style={{ borderRadius: '6px' }}>
											{item.request_status?.toUpperCase() || 'PENDING'}
										</span>
									</td>
									<td className='py-3'>
										<span 
											className='text-gray-700 fs-7 d-block text-truncate' 
											style={{ maxWidth: '180px' }} 
											title={item.employee_remarks}>
											{item.employee_remarks || '-'}
										</span>
									</td>
									<td className='py-3'>
										<span 
											className='text-gray-700 fs-7 d-block text-truncate' 
											style={{ maxWidth: '180px' }} 
											title={item.remarks}>
											{item.request_status?.toLowerCase() !== 'pending' && item.remarks ? item.remarks : '-'}
										</span>
									</td>
									<td className='py-3 text-muted fs-7'>
										{DayJS(item.updatedAt).format('DD/MM/YYYY, hh:mm A')}
									</td>
									<td className='py-3 text-end pe-4'>
										<div className='d-flex gap-2 justify-content-end'>
											{item.request_status === 'Pending' && (
												<button
													className='btn btn-icon btn-sm btn-light-success'
													style={{ width: '34px', height: '34px', borderRadius: '8px' }}
													onClick={() => handleEdit(item)}
													title='Edit Request'>
													<FontAwesomeIcon icon={faEdit} />
												</button>
											)}
											{item.request_status === 'Approved' && (
												<button
													className='btn btn-sm btn-light-primary fw-semibold px-3 py-1 d-inline-flex align-items-center gap-1'
													style={{ borderRadius: '8px' }}
													onClick={() => handleMarkAsDone(item._id)}>
													<FontAwesomeIcon icon={faCheck} />
													<span>Done</span>
												</button>
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
						<div className='d-flex flex-column align-items-center justify-content-center py-12 text-center'>
							<div className='symbol symbol-60px mb-4'>
								<span className='symbol-label bg-light-primary text-primary fs-2'>👥</span>
							</div>
							<h5 className='fw-bold text-gray-800 mb-1'>No Hiring Requests Found</h5>
							<p className='text-muted fs-7 mb-0'>Submit a request when you need team reinforcements.</p>
						</div>
					)}

					<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
						<div className='text-muted fs-7 fw-semibold'>
							Showing {totalCount === 0 ? 0 : (pagination.page - 1) * pagination.itemsPerPage + 1} to{' '}
							{Math.min(pagination.page * pagination.itemsPerPage, totalCount)} of {totalCount} records
						</div>
						{totalCount > 0 && (
							<UsersListPagination
								totalPages={metaData?.totalPages || Math.ceil(totalCount / pagination.itemsPerPage) || 1}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				</div>

				<Modal
					show={showModal}
					onHide={() => setShowModal(false)}
					centered
					dialogClassName='mw-600px'>
					<div className='modal-content border-0 shadow' style={{ borderRadius: '16px', overflow: 'hidden' }}>
						<div className='modal-header border-bottom border-gray-200 px-6 py-4 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder text-gray-900 m-0'>{editingId ? 'Edit' : 'Create'} Hiring Request</h3>
							<button
								type='button'
								className='btn btn-sm btn-icon btn-light-danger rounded-circle'
								onClick={() => setShowModal(false)}>
								<FontAwesomeIcon icon={faXmark} />
							</button>
						</div>
						<form onSubmit={handleSubmit}>
							<div className='modal-body p-6'>
								<div className='row g-4'>
									<div className='col-12'>
										<InputField
											label='Position / Role Title'
											placeholder='e.g. Senior Frontend Developer'
											type='text'
											name='position'
											htmlFor='position'
											value={formData.position}
											onChange={handleInputChange as any}
										/>
									</div>
									<div className='col-md-6'>
										<InputField
											label='Allocated Budget (₹)'
											placeholder='e.g. 45000'
											type='text'
											name='budget'
											htmlFor='budget'
											value={formData.budget}
											onChange={handleInputChange as any}
										/>
									</div>
									<div className='col-md-6'>
										<InputField
											label='Experience Required'
											placeholder='e.g. 2+ Years'
											type='text'
											name='experience'
											htmlFor='experience'
											value={formData.experience}
											onChange={handleInputChange as any}
										/>
									</div>
									<div className='col-12'>
										<TextareaField
											className=''
											label='Job Remarks / Requirements'
											placeholder='Enter job description, requirements or notes for HR'
											name='employee_remarks'
											htmlFor='employee_remarks'
											value={formData.employee_remarks}
											onChange={handleInputChange as any}
										/>
									</div>
								</div>
							</div>
							<div className='modal-footer border-top border-gray-200 px-6 py-4'>
								<button
									type='button'
									className='btn btn-light rounded-pill px-5 fw-semibold'
									onClick={() => setShowModal(false)}>
									Cancel
								</button>
								<button
									className='btn btn-primary rounded-pill px-6 fw-bold'
									type='submit'
									disabled={loading}>
									{loading ? 'Submitting...' : editingId ? 'Update Request' : 'Submit Request'}
								</button>
							</div>
						</form>
					</div>
				</Modal>
			</div>
		</>
	)
}

export default HiringRequest
