import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import { DeleteLectureReminder, GetLectureReminder } from '../../../Functions/FGGroup'

interface LectureReminder {
	_id: string
	mentor_id: string
	lecture_topic: string
	lecture_pdf?: string
	lecture_date: string
	lecture_start_time: string
	mentor_name: string
	mentor_email: string
	createdAt: string
}

function LecturesList() {
	const [reminders, setReminders] = useState<LectureReminder[]>([])
	const [loading, setLoading] = useState(false)
	const [filters, setFilters] = useState({
		dateFrom: '',
		dateTo: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
		total: 0,
		pages: 1,
	})

	const pageSizeOptions = [10, 50, 100]
	const [showFilters, setShowFilters] = useState(false)

	const fetchReminders = async (newPage?: number, newItemsPerPage?: number) => {
		setLoading(true)

		try {
			const page = newPage || pagination.page
			const limit = newItemsPerPage || pagination.itemsPerPage

			const response: any = await GetLectureReminder({
				page,
				limit,
				sort: 'lecture_date',
				sortOrder: 'desc',
				...(filters.dateFrom && { dateFrom: filters.dateFrom }),
				...(filters.dateTo && { dateTo: filters.dateTo }),
			})

			if (response?.data) {
				// Read total from API metadata - your API uses totalDocs
				const apiTotal =
					response.metadata?.pagination?.totalDocs || response.metadata?.pagination?.total
				const dataLength = response.data.length
				const total = apiTotal || dataLength || 0
				const currentPage = response.metadata?.pagination?.page || page

				// Calculate pages - ensure we show pagination when there's more data than page size
				const totalPages = total > limit ? Math.ceil(total / limit) : 1

				setReminders(response.data)

				setPagination({
					page: currentPage,
					itemsPerPage: limit,
					total,
					pages: totalPages,
				})

				// Manual verification - force pagination if needed
				setTimeout(() => {
					setPagination((prev) => {
						const shouldBePages =
							prev.total > prev.itemsPerPage ? Math.ceil(prev.total / prev.itemsPerPage) : 1
						if (prev.pages !== shouldBePages) {
							return { ...prev, pages: shouldBePages }
						}
						return prev
					})
				}, 100)
			}
		} catch (error) {
			console.error('Error fetching lecture reminders:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async (id: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: 'This lecture reminder will be deleted permanently.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		})

		if (result.isConfirmed) {
			try {
				await DeleteLectureReminder({ reminder_id: id })
				toast.success('Lecture reminder deleted successfully')
				fetchReminders() // Refresh the list
			} catch (error: any) {
				console.error('Error deleting lecture reminder:', error)
				toast.error(error.message || 'Failed to delete lecture reminder')
			}
		}
	}

	useEffect(() => {
		fetchReminders()
	}, [pagination.page, pagination.itemsPerPage])

	// Debug pagination changes
	useEffect(() => {
	}, [pagination])

	const columns = [
		{ title: 'Topic', field: 'lecture_topic' },
		{ title: 'Mentor', field: 'mentor_name' },
		{ title: 'Date', field: 'lecture_date' },
		{ title: 'Time', field: 'lecture_start_time' },
		{ title: 'Created', field: 'createdAt' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Lecture Reminders</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<h3 className='fw-bolder m-0'>Lecture Reminders List</h3>
					</div>
					<div className='card-toolbar'>
						<button
							type='button'
							className={`btn btn-sm ${showFilters ? 'btn-light-primary' : 'btn-light'}`}
							onClick={() => setShowFilters(!showFilters)}>
							<i className='fas fa-filter me-2'></i>
							{showFilters ? 'Hide Filters' : 'Show Filters'}
						</button>
						<TableButton
							action='add'
							to='/fgiit/lectures-create'
							text='Add Reminder'
							className='ms-2'
						/>
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
									<div className='col-md-4'>
										<label className='form-label fw-semibold'>Date From</label>
										<input
											type='date'
											className='form-control form-control-solid'
											value={filters.dateFrom}
											onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
										/>
									</div>
									<div className='col-md-4'>
										<label className='form-label fw-semibold'>Date To</label>
										<input
											type='date'
											className='form-control form-control-solid'
											value={filters.dateTo}
											onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
										/>
									</div>
									<div className='col-md-4 d-flex align-items-end'>
										<div className='d-flex gap-2'>
											<button
												className='btn btn-primary'
												onClick={() => {
													setPagination((prev) => ({ ...prev, page: 1 }))
												}}>
												<i className='fas fa-search me-2'></i>
												Apply Filters
											</button>

											<button
												className='btn btn-light'
												onClick={() => {
													setFilters({ dateFrom: '', dateTo: '' })
													setPagination((prev) => ({ ...prev, page: 1 }))
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
							data={reminders}
							columns={columns}
							loading={loading}
							sort=''
							sortOrder='desc'
							onSortChange={() => {}}
							visibleDetails={null}
							pagination={pagination}
							setPagination={(newPagination) => {
								// Handle both function and object cases
								const newValues =
									typeof newPagination === 'function' ? newPagination(pagination) : newPagination

								// When page or itemsPerPage changes, fetch new data
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
								reminder: LectureReminder,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => {
								// Convert time to AM/PM format
								const timeParts = reminder.lecture_start_time.split(':')
								let hours = parseInt(timeParts[0])
								const minutes = timeParts[1]
								const ampm = hours >= 12 ? 'PM' : 'AM'
								hours = hours % 12
								hours = hours ? hours : 12 // the hour '0' should be '12'
								const formattedTime = `${hours}:${minutes} ${ampm}`

								return (
									<tr key={reminder._id}>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6 text-center'>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{reminder.lecture_topic}
											</span>
										</td>
										<td>
											<div>
												<span className='text-dark fw-bold d-block fs-6'>
													{reminder.mentor_name}
												</span>
												<span className='text-muted fs-7'>{reminder.mentor_email}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{DayJS(reminder.lecture_date).format('DD MMM YYYY')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>{formattedTime}</span>
										</td>

										<td>
											<span className='text-muted fw-semibold d-block fs-7'>
												{DayJS(reminder.createdAt).format('DD MMM YYYY hh:mm A')}
											</span>
										</td>
										<td>
											<div className='d-flex gap-2'>
												<TableButton
													action='edit'
													to={`/fgiit/lecture-edit?id=${reminder._id}`}
												/>
												<TableButton
													action='remove'
													onClick={() => handleDelete(reminder._id)}
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

					{reminders.length === 0 && !loading && (
						<div className='text-center py-10'>
							<span className='text-gray-500 fs-6'>No lecture reminders found</span>
						</div>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default LecturesList
