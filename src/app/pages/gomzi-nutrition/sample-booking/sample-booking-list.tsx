import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { endOfMonth, startOfMonth } from 'date-fns'
import { CalendarDays, Copy, Star } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import GomziTablePagination from '../../../components/GomziTablePagination'
import CopyButton from '../../../components/motion/CopyButton'
import { GetGnSampleBooking, RemoveGnSampleBooking } from '../../../Functions/FGGroup'
import './sample-booking.css'

const SampleBookingList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [bookingData, setBookingData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>([
		startOfMonth(new Date()),
		endOfMonth(new Date()),
	])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [totalPages, setTotalPages] = useState(1)
	const [totalDocs, setTotalDocs] = useState(0)

	const fetchBookings = async () => {
		setLoading(true)
		try {
			const queryPayload: any = {
				search: searchTerm,
				page: pagination.page,
				limit: pagination.itemsPerPage,
				sort: sort,
				sortOrder: sortOrder,
			}
			if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
				const start = new Date(selectedDateRange[0])
				start.setHours(0, 0, 0, 0)
				const end = new Date(selectedDateRange[1])
				end.setHours(23, 59, 59, 999)
				queryPayload.start_date = start.toISOString()
				queryPayload.end_date = end.toISOString()
			}

			const response: any = await GetGnSampleBooking(queryPayload)

			if (response.status === 200) {
				setBookingData(response.data || [])
				const metaPagination = response.metadata?.pagination || response.pagination || {}
				const docsCount = Number(
					metaPagination.totalDocs ??
					metaPagination.total_items ??
					metaPagination.total ??
					response.data?.length ??
					0
				)
				setTotalDocs(docsCount)

				const pages = Number(
					metaPagination.totalPages ??
					metaPagination.total_pages ??
					(docsCount > 0 ? Math.ceil(docsCount / pagination.itemsPerPage) : 1)
				)
				setTotalPages(pages > 0 ? pages : 1)
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
		}, 300)

		return () => clearTimeout(delayDebounceFn)
	}, [searchTerm, pagination.page, pagination.itemsPerPage, sort, sortOrder, selectedDateRange])

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const downloadExcel = async () => {
		try {
			setExporting(true)
			const toastId = toast.loading('Preparing sample bookings export...')

			let exportData: any[] = []
			try {
				const queryPayload: any = {
					search: searchTerm,
					page: 1,
					limit: 5000,
					sort: sort,
					sortOrder: sortOrder,
				}
				if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
					const start = new Date(selectedDateRange[0])
					start.setHours(0, 0, 0, 0)
					const end = new Date(selectedDateRange[1])
					end.setHours(23, 59, 59, 999)
					queryPayload.start_date = start.toISOString()
					queryPayload.end_date = end.toISOString()
				}
				const response: any = await GetGnSampleBooking(queryPayload)
				if (response.status === 200 && response.data && response.data.length > 0) {
					exportData = response.data
				}
			} catch (e) {
				console.warn('Fallback to current page sample bookings data', e)
			}

			if (exportData.length === 0) {
				exportData = bookingData
			}

			if (exportData.length === 0) {
				toast.dismiss(toastId)
				toast.error('No sample bookings to export')
				return
			}

			const worksheetData = exportData.map((booking: any, index: number) => {
				const sampleUpdateLink =
					window.location.hostname === 'localhost'
						? `http://localhost:3001/rag/sample-booking-update?id=${booking._id}`
						: `https://www.gomzilifesciences.in/rag/sample-booking-update?id=${booking._id}`

				const productsStr = (booking.products || [])
					.map((p: any) => p.product_name + (p.rating ? ` (${p.rating}★)` : ''))
					.filter(Boolean)
					.join('; ')

				const ratedProducts = booking.products?.filter((p: any) => p.rating > 0) || []
				const avgRating =
					ratedProducts.length > 0
						? (
								ratedProducts.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) /
								ratedProducts.length
						  ).toFixed(1)
						: '-'

				const addressParts = [
					booking.address?.address_line_1,
					booking.address?.city,
					booking.address?.state,
					booking.address?.pin_code,
					booking.address?.country,
				]
					.filter(Boolean)
					.join(', ')

				return {
					'Sr No': index + 1,
					'Customer Name': booking.customer_name || '---',
					'Mobile': booking.mobile || '---',
					'Order ID': booking.order_id || '---',
					'Courier': booking.courier_name || booking.courier || '---',
					'AWB': booking.awb || '---',
					'Tracking ID': booking.tracking_id || '---',
					'Tracking Link': booking.tracking_link || '---',
					'Products': productsStr || '---',
					'Average Rating': avgRating,
					'Sample Update Link': sampleUpdateLink,
					'Address': addressParts || '---',
					'Date': booking.createdAt
						? new Date(booking.createdAt).toLocaleDateString('en-GB')
						: '---',
				}
			})

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)

			const columnWidths = Object.keys(worksheetData[0]).map((key) => {
				const maxLength = Math.max(
					key.length,
					...worksheetData.map((row: any) => String(row[key] ?? '').length)
				)
				return { wch: Math.min(maxLength + 3, 40) }
			})
			worksheet['!cols'] = columnWidths

			const workbook = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Bookings')
			XLSX.writeFile(
				workbook,
				`Sample_Bookings_${new Date().toISOString().split('T')[0]}.xlsx`
			)
			toast.dismiss(toastId)
			toast.success(`${exportData.length} sample bookings exported successfully`)
		} catch (error: any) {
			console.error('Error exporting sample bookings to Excel:', error)
			toast.error('Failed to export sample bookings')
		} finally {
			setExporting(false)
		}
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

			{/* Page Heading */}
			<div className='sb-page-header'>
				<div>
					<div className='sb-breadcrumb'>
						<span>Sample Bookings</span>
						<span className='sb-breadcrumb-separator'>/</span>
						<span>Booking List</span>
					</div>
					<h1 className='sb-page-title'>Sample Bookings</h1>
					<p className='sb-page-subtitle'>
						Manage and track client product sample requests, dispatch status, and customer reviews.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					<TableButton
						action='add'
						to='/rag/sample-booking-add'
						text='Add Sample'
					/>
				</div>
			</div>

			{/* Main List Surface */}
			<div className='sb-main-card'>
				{/* Filter Toolbar */}
				<div className='sb-toolbar-wrap'>
					<div className='d-flex align-items-center justify-content-between flex-wrap w-100 gap-3'>
						<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
							<div>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
									className='me-0'
								/>
							</div>
							<div>
								<LengthMenu
									expenseData={bookingData}
									handleItemsPerPageChange={handleItemsPerPageChange}
									value={pagination.itemsPerPage}
									className='me-0'
								/>
							</div>
							<div>
								<button
									type='button'
									className='btn btn-icon d-flex align-items-center justify-content-center'
									onClick={downloadExcel}
									disabled={exporting}
									style={{
										width: '38px',
										height: '38px',
										minWidth: '38px',
										padding: 0,
										borderRadius: '10px',
										fontSize: '14px',
										backgroundColor: '#FFFFFF',
										border: '1px solid #E4EAF2',
										color: '#172B4D',
										boxShadow: '0 1px 2px rgba(23, 43, 77, 0.04)',
										transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
										cursor: exporting ? 'not-allowed' : 'pointer',
									}}
									onMouseEnter={(e) => {
										if (!exporting) {
											e.currentTarget.style.backgroundColor = '#172B4D'
											e.currentTarget.style.borderColor = '#172B4D'
											e.currentTarget.style.color = '#FFFFFF'
											e.currentTarget.style.boxShadow = '0 4px 10px rgba(23, 43, 77, 0.2)'
											e.currentTarget.style.transform = 'translateY(-1px)'
										}
									}}
									onMouseLeave={(e) => {
										if (!exporting) {
											e.currentTarget.style.backgroundColor = '#FFFFFF'
											e.currentTarget.style.borderColor = '#E4EAF2'
											e.currentTarget.style.color = '#172B4D'
											e.currentTarget.style.boxShadow = '0 1px 2px rgba(23, 43, 77, 0.04)'
											e.currentTarget.style.transform = 'translateY(0)'
										}
									}}
									title='Download Excel'>
									{exporting ? (
										<span
											className='spinner-border spinner-border-sm'
											role='status'
											aria-hidden='true'></span>
									) : (
										<FontAwesomeIcon icon={faDownload} />
									)}
								</button>
							</div>
							<div className='d-flex align-items-center flex-shrink-0'>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
									customIcon={<CalendarDays size={18} color='#172B4D' />}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Data Table */}
				<div className='p-0'>
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
											<span className='fw-bold ms-6 mb-1 fs-6' style={{ color: '#172B4D' }}>
												{actualIndex}
											</span>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='fw-bold mb-1 fs-6' style={{ color: '#172B4D' }}>
													{booking.customer_name || '---'}
												</span>
												<span className='fw-semibold fs-7' style={{ color: '#71809A' }}>
													{booking.mobile || '---'}
												</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center gap-1.5'>
												{booking.order_id && (
													<CopyButton
														text={booking.order_id}
														title='Copy Order ID'
														customMessage='Order ID copied!'
														style={{
															backgroundColor: '#F8FAFD',
															border: '1px solid #E4EAF2',
															borderRadius: '6px',
															width: '26px',
															height: '26px',
															color: '#172B4D',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}
													/>
												)}
												<span className='fw-semibold mb-1 fs-6' style={{ color: '#172B4D' }}>
													{booking.order_id || '---'}
												</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center gap-1.5'>
												{booking.tracking_id && (
													<CopyButton
														text={booking.tracking_id}
														title='Copy Tracking ID'
														customMessage='Tracking ID copied!'
														style={{
															backgroundColor: '#F8FAFD',
															border: '1px solid #E4EAF2',
															borderRadius: '6px',
															width: '26px',
															height: '26px',
															color: '#172B4D',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}
													/>
												)}
												<span className='fw-semibold mb-1 fs-6' style={{ color: '#172B4D' }}>
													{booking.tracking_id || '---'}
												</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center gap-1.5'>
												<CopyButton
													text={sampleUpdateLink}
													title='Copy Link'
													customMessage='Link copied!'
													style={{
														backgroundColor: '#F8FAFD',
														border: '1px solid #E4EAF2',
														borderRadius: '6px',
														width: '26px',
														height: '26px',
														color: '#172B4D',
														display: 'inline-flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}
												/>
												<div
													className='fw-medium mb-1 fs-6'
													title={sampleUpdateLink}
													style={{
														maxWidth: '140px',
														whiteSpace: 'nowrap',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														cursor: 'pointer',
														color: '#172B4D',
													}}>
													{sampleUpdateLink}
												</div>
											</div>
										</td>

										<td>
											<span className='fw-bold d-block mb-1 fs-6'>
												{(() => {
													const ratedProducts =
														booking.products?.filter((p: any) => p.rating > 0) || []
													if (ratedProducts.length === 0) return <span style={{ color: '#71809A' }}>-</span>
													const avgRating = (
														ratedProducts.reduce(
															(sum: number, p: any) => sum + (p.rating || 0),
															0
														) / ratedProducts.length
													).toFixed(1)
													return (
														<div
															className='d-inline-flex align-items-center gap-1.5 px-2 py-1'
															style={{
																background: '#FFFBEB',
																border: '1px solid #FDE68A',
																borderRadius: '6px',
															}}>
															<Star size={13} fill='#D97706' color='#D97706' />
															<span style={{ color: '#92400E', fontSize: '12.5px', fontWeight: 600 }}>
																{avgRating}
															</span>
														</div>
													)
												})()}
											</span>
										</td>
										<td>
											<span className='fw-semibold d-block mb-1 fs-6' style={{ color: '#172B4D' }}>
												{booking.createdAt
													? new Date(booking.createdAt).toLocaleDateString('en-GB')
													: '---'}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center gap-1'>
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
						<GomziTablePagination
							totalRecords={totalDocs}
							page={pagination.page}
							itemsPerPage={pagination.itemsPerPage}
							totalPages={totalPages}
							onPageChange={handlePageChange}
							entityName='sample bookings'
						/>
					)}
				</div>
			</div>
		</>
	)
}

export default SampleBookingList
