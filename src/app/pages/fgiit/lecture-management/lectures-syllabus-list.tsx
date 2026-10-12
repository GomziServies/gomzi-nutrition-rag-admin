import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'

interface LectureSyllabus {
	_id: string
	subject_name: string
	totalAvailableSchedule: number
	createdAt: string
}

function LecturesSyllabusList() {
	// Dummy data for lectures syllabus
	const dummyData: LectureSyllabus[] = [
		{
			_id: '1',
			subject_name: 'DPT Course',
			totalAvailableSchedule: 0,
			createdAt: '2024-02-14T10:00:00Z'
		},
		{
			_id: '2',
			subject_name: 'DNC Course',
			totalAvailableSchedule: 0,
			createdAt: '2024-02-14T10:15:00Z'
		},
		{
			_id: '3',
			subject_name: 'Anabolic Steroid Course',
			totalAvailableSchedule: 0,
			createdAt: '2024-02-14T10:30:00Z'
		},
		{
			_id: '4',
			subject_name: 'Group Instructor Course',
			totalAvailableSchedule: 0,
			createdAt: '2024-02-14T10:45:00Z'
		},
		{
			_id: '5',
			subject_name: 'Injury Rehabilitation Course',
			totalAvailableSchedule: 0,
			createdAt: '2024-02-14T11:00:00Z'
		},
		{
			_id: '6',
			subject_name: 'Powerlifting Course',
			totalAvailableSchedule: 0,
			createdAt: '2024-02-14T11:15:00Z'
		},
		{
			_id: '7',
			subject_name: 'Strength Training & Weight Management',
			totalAvailableSchedule: 5,
			createdAt: '2024-01-10T10:00:00Z'
		},
		{
			_id: '8',
			subject_name: 'Cardio & Fat Loss',
			totalAvailableSchedule: 8,
			createdAt: '2024-01-12T14:30:00Z'
		},
		{
			_id: '9',
			subject_name: 'Yoga & Flexibility',
			totalAvailableSchedule: 6,
			createdAt: '2024-01-15T08:00:00Z'
		},
		{
			_id: '10',
			subject_name: 'CrossFit & HIIT Training',
			totalAvailableSchedule: 7,
			createdAt: '2024-01-18T16:00:00Z'
		},
		{
			_id: '11',
			subject_name: 'Bodybuilding & Nutrition',
			totalAvailableSchedule: 4,
			createdAt: '2024-01-20T19:00:00Z'
		},
		{
			_id: '12',
			subject_name: 'Pilates & Core Strength',
			totalAvailableSchedule: 9,
			createdAt: '2024-01-22T07:30:00Z'
		}
	];

	const [syllabuses, setSyllabuses] = useState<LectureSyllabus[]>(dummyData)
	const [filteredSyllabuses, setFilteredSyllabuses] = useState<LectureSyllabus[]>(dummyData)
	const [loading, setLoading] = useState(false)
	const [filters, setFilters] = useState({
		subjectName: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
		total: 0,
		pages: 1,
	})
	
	// Modal states
	const [showAddModal, setShowAddModal] = useState(false)
	const [formData, setFormData] = useState({
		subject_name: '',
	})

	const pageSizeOptions = [10, 50, 100]
	const [showFilters, setShowFilters] = useState(false)

	// Apply filters to dummy data
	const applyFilters = () => {
		let filtered = [...dummyData]

		if (filters.subjectName) {
			filtered = filtered.filter(item => 
				item.subject_name.toLowerCase().includes(filters.subjectName.toLowerCase())
			)
		}

		setFilteredSyllabuses(filtered)
		
		// Update pagination
		const total = filtered.length
		const totalPages = total > pagination.itemsPerPage ? Math.ceil(total / pagination.itemsPerPage) : 1
		
		setPagination(prev => ({
			...prev,
			page: 1,
			total: total,
			pages: totalPages
		}))
	}

	// Get paginated data
	const getPaginatedData = () => {
		const startIndex = (pagination.page - 1) * pagination.itemsPerPage
		const endIndex = startIndex + pagination.itemsPerPage
		return filteredSyllabuses.slice(startIndex, endIndex)
	}

	// Initialize pagination on component mount
	useEffect(() => {
		const total = filteredSyllabuses.length
		const totalPages = total > pagination.itemsPerPage ? Math.ceil(total / pagination.itemsPerPage) : 1
		
		setPagination(prev => ({
			...prev,
			total: total,
			pages: totalPages
		}))
	}, [])

	// Update pagination when items per page changes
	useEffect(() => {
		const total = filteredSyllabuses.length
		const totalPages = total > pagination.itemsPerPage ? Math.ceil(total / pagination.itemsPerPage) : 1
		
		setPagination(prev => ({
			...prev,
			page: 1,
			total: total,
			pages: totalPages
		}))
	}, [pagination.itemsPerPage])

	const handleDelete = async (id: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: 'This lecture syllabus will be deleted permanently.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		})

		if (result.isConfirmed) {
			// Remove from filtered list
			const newFiltered = filteredSyllabuses.filter(item => item._id !== id)
			setFilteredSyllabuses(newFiltered)
			
			// Update pagination
			const total = newFiltered.length
			const totalPages = total > pagination.itemsPerPage ? Math.ceil(total / pagination.itemsPerPage) : 1
			
			setPagination(prev => ({
				...prev,
				total: total,
				pages: totalPages,
				page: prev.page > totalPages ? totalPages : prev.page
			}))
			
			toast.success('Lecture syllabus deleted successfully')
		}
	}

	const handleOpenAddModal = () => {
		setFormData({ subject_name: '' })
		setShowAddModal(true)
	}

	const handleCloseModals = () => {
		setShowAddModal(false)
		setFormData({ subject_name: '' })
	}

	const handleSubmitAdd = () => {
		if (!formData.subject_name) {
			toast.error('Please enter subject name')
			return
		}

		const newSyllabus: LectureSyllabus = {
			_id: (filteredSyllabuses.length + 1).toString(),
			subject_name: formData.subject_name,
			totalAvailableSchedule: 0, // Default value
			createdAt: new Date().toISOString(),
		}

		const updatedList = [...filteredSyllabuses, newSyllabus]
		setFilteredSyllabuses(updatedList)

		// Update pagination
		const total = updatedList.length
		const totalPages = total > pagination.itemsPerPage ? Math.ceil(total / pagination.itemsPerPage) : 1
		setPagination(prev => ({ ...prev, total: total, pages: totalPages }))

		toast.success('Lecture syllabus added successfully')
		handleCloseModals()
	}

	const columns = [
		{ title: 'Subject Name', field: 'subject_name' },
		{ title: 'Total Available Schedule', field: 'totalAvailableSchedule' },
		{ title: 'Created', field: 'createdAt' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Lectures Syllabus</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<h3 className='fw-bolder m-0'>Lectures Syllabus List</h3>
					</div>
					<div className='card-toolbar'>
						<button
							type='button'
							className={`btn btn-sm ${showFilters ? 'btn-light-primary' : 'btn-light'}`}
							onClick={() => setShowFilters(!showFilters)}>
							<i className='fas fa-filter me-2'></i>
							{showFilters ? 'Hide Filters' : 'Show Filters'}
						</button>
						<button
							type='button'
							className='btn btn-sm btn-primary ms-2'
							onClick={handleOpenAddModal}>
							<i className='fas fa-plus me-2'></i>
							Add Syllabus
						</button>
					</div>
				</div>
				<div className='card-body py-4'>
					{/* Page Size Selector */}
					<div className='d-flex justify-content-between align-items-center mb-5'>
						<div className='d-flex align-items-center'>
							<span className='me-3 fw-semibold'>Items per page:</span>
							<select
								className='form-select form-select-sm w-auto'
								value={pagination.itemsPerPage}
								onChange={(e) => {
									const newSize = parseInt(e.target.value)
									setPagination((prev) => ({
										...prev,
										page: 1,
										itemsPerPage: newSize,
									}))
								}}>
								{pageSizeOptions.map((size) => (
									<option
										key={size}
										value={size}>
										{size}
									</option>
								))}
							</select>
						</div>
						<div>
							<span className='text-muted'>
								Showing {(pagination.page - 1) * pagination.itemsPerPage + 1}-
								{Math.min(pagination.page * pagination.itemsPerPage, pagination.total)} of{' '}
								{pagination.total} items
							</span>
						</div>
					</div>

					{/* Filters Section */}
					{showFilters && (
						<div className='mb-7'>
							<div className='border rounded p-5 bg-light-primary'>
								<div className='row g-5'>
									<div className='col-md-8'>
										<label className='form-label fw-semibold'>Subject Name</label>
										<input
											type='text'
											className='form-control form-control-solid'
											placeholder='Enter subject name'
											value={filters.subjectName}
											onChange={(e) => setFilters({ subjectName: e.target.value })}
										/>
									</div>
									<div className='col-md-4 d-flex align-items-end'>
										<div className='d-flex gap-2'>
											<button
												className='btn btn-primary'
												onClick={() => {
													applyFilters()
												}}>
												<i className='fas fa-search me-2'></i>
												Apply Filters
											</button>

											<button
												className='btn btn-light'
												onClick={() => {
													setFilters({ subjectName: '' })
													setFilteredSyllabuses(dummyData)
													const total = dummyData.length
													const totalPages = total > pagination.itemsPerPage ? Math.ceil(total / pagination.itemsPerPage) : 1
													setPagination(prev => ({ ...prev, page: 1, total: total, pages: totalPages }))
												}}>
												<i className='fas fa-redo me-2'></i>
												Reset
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					<div className='table-responsive'>
						<Table
							data={getPaginatedData()}
							columns={columns}
							loading={loading}
							sort=''
							sortOrder='desc'
							onSortChange={() => {}}
							visibleDetails={null}
							pagination={pagination}
							setPagination={(newPagination) => {
								const newValues =
									typeof newPagination === 'function' ? newPagination(pagination) : newPagination

								if (
									newValues.page !== pagination.page ||
									newValues.itemsPerPage !== pagination.itemsPerPage
								) {
									setPagination((prev) => ({
										...prev,
										...newValues,
									}))
								} else {
									setPagination((prev) => ({
										...prev,
										...newValues,
									}))
								}
							}}
							renderRow={(
								syllabus: LectureSyllabus,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => {
								return (
									<tr key={syllabus._id}>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6 text-center'>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>
												{syllabus.subject_name}
											</span>
										</td>
										<td>
											<span className='badge badge-light-primary fs-6'>
												{syllabus.totalAvailableSchedule} Schedules
											</span>
										</td>
										<td>
											<span className='text-muted fw-semibold d-block fs-7'>
												{DayJS(syllabus.createdAt).format('DD MMM YYYY hh:mm A')}
											</span>
										</td>
										<td>
											<div className='d-flex gap-2'>
												<TableButton
													action='view'
													to={`/fgiit/courses-list/${syllabus._id}`}
												/>
												<TableButton
													action='remove'
													onClick={() => handleDelete(syllabus._id)}
												/>
											</div>
										</td>
									</tr>
								)
							}}
						/>
					</div>

					{/* Manual Pagination Controls */}
					{pagination.pages > 1 && (
						<div className='d-flex justify-content-between align-items-center mt-5'>
							<div className='text-muted'>
								Page {pagination.page} of {pagination.pages}
							</div>
							<div className='d-flex gap-2'>
								<button
									className='btn btn-light btn-sm'
									disabled={pagination.page === 1}
									onClick={() => {
										if (pagination.page > 1) {
											setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
										}
									}}>
									<i className='fas fa-chevron-left me-1'></i>
									Previous
								</button>

								{Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
									const pageNum = i + 1
									return (
										<button
											key={pageNum}
											className={`btn btn-sm ${
												pagination.page === pageNum ? 'btn-primary' : 'btn-light'
											}`}
											onClick={() => {
												setPagination((prev) => ({ ...prev, page: pageNum }))
											}}>
											{pageNum}
										</button>
									)
								})}

								<button
									className='btn btn-light btn-sm'
									disabled={pagination.page === pagination.pages}
									onClick={() => {
										if (pagination.page < pagination.pages) {
											setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
										}
									}}>
									Next
									<i className='fas fa-chevron-right ms-1'></i>
								</button>
							</div>
						</div>
					)}

					{filteredSyllabuses.length === 0 && !loading && (
						<div className='text-center py-10'>
							<span className='text-gray-500 fs-6'>No lecture syllabuses found</span>
						</div>
					)}
				</div>
			</KTCard>

			{/* Add Syllabus Modal */}
			{showAddModal && (
				<div className='modal fade show d-block' tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>Add New Syllabus</h5>
								<button
									type='button'
									className='btn-close'
									onClick={handleCloseModals}></button>
							</div>
							<div className='modal-body'>
								<div className='mb-4'>
									<label className='form-label fw-semibold required'>Subject Name</label>
									<input
										type='text'
										className='form-control'
										placeholder='Enter subject name'
										value={formData.subject_name}
										onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
									/>
								</div>
							</div>
							<div className='modal-footer'>
								<button
									type='button'
									className='btn btn-light'
									onClick={handleCloseModals}>
									Cancel
								</button>
								<button
									type='button'
									className='btn btn-primary'
									onClick={handleSubmitAdd}>
									<i className='fas fa-save me-2'></i>
									Save Syllabus
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default LecturesSyllabusList