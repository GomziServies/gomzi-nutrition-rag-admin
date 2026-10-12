import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetGnSampleBooking, RemoveGnSampleBooking } from '../../../Functions/FGGroup'
import './sample-booking.css'

const SampleBookingList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [bookingData, setBookingData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [totalPages, setTotalPages] = useState(1)

	const fetchBookings = async () => {
		setLoading(true)
		try {
			const response: any = await GetGnSampleBooking({
				search: searchTerm,
				page: pagination.page,
				limit: pagination.itemsPerPage,
				sort: sort,
				sortOrder: sortOrder,
			})

			if (response.status === 200) {
				setBookingData(response.data || [])
				setTotalPages(response.pagination?.total_pages || 1)
			}
		} catch (error: any) {
			console.error('Error fetching sample bookings:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			fetchBookings()
		}, 500)

		return () => clearTimeout(delayDebounceFn)
	}, [searchTerm, pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRemove = async (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					const response: any = await RemoveGnSampleBooking({ id })
					if (response.status === 200) {
						toast.success('Sample booking removed successfully')
						fetchBookings()
					} else {
						toast.error(response.message || 'Failed to remove sample booking')
					}
				} catch (error: any) {
					toast.error(error.message || 'Failed to remove sample booking')
				}
			}
		})
	}

	const columns = [
		{ title: 'Customer', field: 'customer_name' },
		{ title: 'Order ID', field: 'order_id' },
		{ title: 'Tracking ID', field: 'tracking_id' },
		{ title: 'Sample Update Link', field: 'link', disableSort: true },
		{ title: 'Rating', field: 'rating' },
		{ title: 'Date', field: 'createdAt' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Sample Booking List</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='card-branch_code d-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<LengthMenu
								expenseData={bookingData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							to='/rag/sample-booking-add'
							text='Add Sample'
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={bookingData}
							columns={columns}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							visibleDetails={visibleDetails}
							disableSortFields={['rating', 'mobile']}
							renderRow={(booking: any, index: number, actualIndex: number) => {
								const sampleUpdateLink =
									window.location.hostname === 'localhost'
										? `http://localhost:3001/rag/sample-booking-update?id=${booking._id}`
										: `https://www.gomzilifesciences.in/rag/sample-booking-update?id=${booking._id}`

								return (
									<tr key={booking._id}>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{actualIndex}</span>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-dark fw-bold mb-1 fs-6'>
													{booking.customer_name || '---'}
												</span>
												<span className='text-muted fw-semibold fs-7'>
													{booking.mobile || '---'}
												</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center gap-1'>
												{booking.order_id && (
													<button
														type='button'
														className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm'
														onClick={() => {
															navigator.clipboard.writeText(booking.order_id)
															toast.success('Order ID copied!')
														}}
														title='Copy Order ID'
														style={{
															backgroundColor: 'transparent',
															width: '25px',
															height: '25px',
														}}>
														<i
															className='bi bi-files fs-5'
															style={{ color: '#50cd89' }}></i>
													</button>
												)}
												<span className='text-dark fw-bold mb-1 fs-6'>
													{booking.order_id || '---'}
												</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center gap-1'>
												{booking.tracking_id && (
													<button
														type='button'
														className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm'
														onClick={() => {
															navigator.clipboard.writeText(booking.tracking_id)
															toast.success('Tracking ID copied!')
														}}
														title='Copy Tracking ID'
														style={{
															backgroundColor: 'transparent',
															width: '25px',
															height: '25px',
														}}>
														<i
															className='bi bi-files fs-5'
															style={{ color: '#50cd89' }}></i>
													</button>
												)}
												<span className='text-dark fw-bold mb-1 fs-6'>
													{booking.tracking_id || '---'}
												</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center gap-1'>
												<button
													type='button'
													className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm'
													onClick={() => {
														navigator.clipboard.writeText(sampleUpdateLink)
														toast.success('Link copied!')
													}}
													title='Copy Link'
													style={{ backgroundColor: 'transparent', width: '25px', height: '25px' }}>
													<i
														className='bi bi-files fs-5'
														style={{ color: '#50cd89' }}></i>
												</button>
												<div
													className='text-dark fw-bold mb-1 fs-6'
													title={sampleUpdateLink}
													style={{
														maxWidth: '120px',
														whiteSpace: 'nowrap',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														cursor: 'pointer',
													}}>
													{sampleUpdateLink}
												</div>
											</div>
										</td>

										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{(() => {
													const ratedProducts =
														booking.products?.filter((p: any) => p.rating > 0) || []
													if (ratedProducts.length === 0) return '-'
													const avgRating = (
														ratedProducts.reduce(
															(sum: number, p: any) => sum + (p.rating || 0),
															0
														) / ratedProducts.length
													).toFixed(1)
													return (
														<div className='d-flex align-items-center'>
															<i className='bi bi-star-fill fs-4 me-2 text-warning'></i>
															<span>{avgRating}</span>
														</div>
													)
												})()}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{booking.createdAt
													? new Date(booking.createdAt).toLocaleDateString('en-GB')
													: '---'}
											</span>
										</td>
										<td>
											<div className='d-flex'>
												<TableButton
													action='view'
													to={'/rag/sample-booking-view?id=' + booking._id}
												/>
												<TableButton
													action='edit'
													to={'/rag/sample-booking-update?id=' + booking._id}
												/>
												<TableButton
													action='remove'
													onClick={() => handleRemove(booking._id)}
												/>
											</div>
										</td>
									</tr>
								)
							}}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{bookingData.length > 0 && (
						<UsersListPagination
							totalPages={totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default SampleBookingList
