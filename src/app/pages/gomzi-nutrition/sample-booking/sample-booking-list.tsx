/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faDownload,
	faEye,
	faPenToSquare,
	faTrash,
	faBoxOpen,
	faBoxesStacked,
	faTruck,
	faStar,
	faClock,
} from '@fortawesome/free-solid-svg-icons'
import { endOfMonth, startOfMonth } from 'date-fns'
import { CalendarDays, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import GomziTablePagination from '../../../components/GomziTablePagination'
import CopyButton from '../../../components/motion/CopyButton'
import { PlusIcon } from '../../../components/animated-icons'
import NumberTicker from '../../../components/NumberTicker'
import { GetGnSampleBooking, RemoveGnSampleBooking } from '../../../Functions/FGGroup'
import '../products-theme.css'
import '../orders-theme.css'
import './sample-booking.css'

const SampleBookingList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [bookingData, setBookingData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [exporting, setExporting] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
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
					Mobile: booking.mobile || '---',
					'Order ID': booking.order_id || '---',
					Courier: booking.courier_name || booking.courier || '---',
					AWB: booking.awb || '---',
					'Tracking ID': booking.tracking_id || '---',
					'Tracking Link': booking.tracking_link || '---',
					Products: productsStr || '---',
					'Average Rating': avgRating,
					'Sample Update Link': sampleUpdateLink,
					Address: addressParts || '---',
					Date: booking.createdAt
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
			title: 'Delete Sample Booking?',
			text: "Are you sure you want to delete this sample booking? You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DC2626',
			cancelButtonColor: '#71809A',
			confirmButtonText: 'Yes, delete',
			cancelButtonText: 'Cancel',
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

	// Derived metrics for summary cards
	const summaryStats = useMemo(() => {
		const total = totalDocs || bookingData.length
		let withTracking = 0
		let withRating = 0
		let withCourier = 0

		bookingData.forEach((b: any) => {
			if (b.tracking_id || b.awb) withTracking++
			if (b.products?.some((p: any) => p.rating > 0)) withRating++
			if (b.courier_name || b.courier) withCourier++
		})

		return { total, withTracking, withRating, withCourier }
	}, [bookingData, totalDocs])

	const currentStart = (pagination.page - 1) * pagination.itemsPerPage + 1

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Sample Booking List</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<span>Sample Bookings</span>
				<span className='sep'>&gt;</span>
				<span className='current'>Booking Directory</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Sample Bookings</h1>
					<p className='gz-prod-subtitle'>
						Manage and track client product sample requests, dispatch status, and customer reviews
					</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					<Link
						to='/rag/sample-booking-add'
						className='gz-prod-btn-primary'
						title='Create New Sample Booking'>
						<PlusIcon size={14} strokeWidth={3.6} />
						<span>Add Sample</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    SUMMARY METRICS CARDS
			    ========================================================================= */}
			<div className='gz-prod-summary-grid'>
				<div className='gz-prod-summary-card blue'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faBoxesStacked} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Total Bookings</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.total} />
							)}
						</span>
					</div>
				</div>

				<div className='gz-prod-summary-card green'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faTruck} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Dispatched / Tracked</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.withTracking} />
							)}
						</span>
					</div>
				</div>

				<div className='gz-prod-summary-card amber'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faStar} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Rated Samples</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.withRating} />
							)}
						</span>
					</div>
				</div>

				<div className='gz-prod-summary-card red'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faClock} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Courier Assigned</span>
						<span className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '45px', height: '24px', borderRadius: '4px' }}></span>
							) : (
								<NumberTicker value={summaryStats.withCourier} />
							)}
						</span>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    TOOLBAR (SEARCH -> LENGTH -> DATE -> EXPORT)
			    ========================================================================= */}
			<div className='gz-prod-toolbar'>
				<div className='gz-prod-toolbar-left'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						className='me-0'
					/>
					<LengthMenu
						expenseData={bookingData}
						handleItemsPerPageChange={handleItemsPerPageChange}
						value={pagination.itemsPerPage}
						className='me-0'
					/>
					<div className='d-flex align-items-center flex-shrink-0'>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
							customIcon={<CalendarDays size={18} color='#172B4D' />}
						/>
					</div>
				</div>

				<div className='gz-prod-toolbar-right'>
					<button
						type='button'
						className='gz-prod-btn-icon-export'
						onClick={downloadExcel}
						disabled={exporting || bookingData.length === 0}
						title='Export Sample Bookings to Excel'>
						{exporting ? (
							<span className='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span>
						) : (
							<FontAwesomeIcon icon={faDownload} />
						)}
					</button>
				</div>
			</div>

			{/* =========================================================================
			    BOOKINGS TABLE
			    ========================================================================= */}
			<div className='gz-prod-table-card'>
				<div className='table-responsive'>
					<table className='gz-prod-table'>
						<thead>
							<tr>
								<th style={{ width: '48px', textAlign: 'center' }}>#</th>
								<th>Customer</th>
								<th>Order ID</th>
								<th>Tracking ID</th>
								<th>Review / Update Link</th>
								<th style={{ textAlign: 'center' }}>Rating</th>
								<th>Booking Date</th>
								<th style={{ textAlign: 'center', width: '110px' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 5 }).map((_, sIdx) => (
									<tr key={`skel-${sIdx}`} className='gz-prod-skeleton-row'>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-prod-skeleton' style={{ width: '18px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<div className='gz-prod-identity-cell'>
												<span className='gz-prod-skeleton' style={{ width: '38px', height: '38px', borderRadius: '10px' }}></span>
												<div className='d-flex flex-column gap-1'>
													<span className='gz-prod-skeleton' style={{ width: '120px', height: '15px', borderRadius: '4px' }}></span>
													<span className='gz-prod-skeleton' style={{ width: '85px', height: '12px', borderRadius: '4px' }}></span>
												</div>
											</div>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '80px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '90px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '120px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<span className='gz-prod-skeleton' style={{ width: '50px', height: '22px', borderRadius: '6px' }}></span>
										</td>
										<td>
											<span className='gz-prod-skeleton' style={{ width: '75px', height: '14px', borderRadius: '4px' }}></span>
										</td>
										<td style={{ textAlign: 'center' }}>
											<div className='d-flex align-items-center justify-content-center gap-2'>
												<span className='gz-prod-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }}></span>
												<span className='gz-prod-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }}></span>
												<span className='gz-prod-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }}></span>
											</div>
										</td>
									</tr>
								))
							) : bookingData.length === 0 ? (
								<tr>
									<td colSpan={8} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap'>
											<div className='gz-prod-empty-icon'>
												<FontAwesomeIcon icon={faBoxOpen} />
											</div>
											<h4 className='gz-empty-state-title'>No sample bookings found</h4>
											<p className='gz-empty-state-desc'>
												{searchTerm
													? 'No sample bookings matched your search query.'
													: 'Create your first sample booking to start tracking dispatches and customer feedback.'}
											</p>
											{!searchTerm && (
												<Link to='/rag/sample-booking-add' className='gz-prod-btn-primary'>
													<PlusIcon size={14} strokeWidth={3.6} />
													<span>Add First Sample</span>
												</Link>
											)}
										</div>
									</td>
								</tr>
							) : (
								bookingData.map((booking: any, index: number) => {
									const actualIndex = currentStart + index
									const sampleUpdateLink =
										window.location.hostname === 'localhost'
											? `http://localhost:3001/rag/sample-booking-update?id=${booking._id}`
											: `https://www.gomzilifesciences.in/rag/sample-booking-update?id=${booking._id}`

									const initials = (booking.customer_name || 'C')
										.split(' ')
										.map((n: string) => n[0])
										.slice(0, 2)
										.join('')
										.toUpperCase()

									const ratedProducts = booking.products?.filter((p: any) => p.rating > 0) || []
									const avgRating =
										ratedProducts.length > 0
											? (
													ratedProducts.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) /
													ratedProducts.length
											  ).toFixed(1)
											: null

									return (
										<tr key={booking._id}>
											<td style={{ textAlign: 'center', color: '#71809A', fontSize: '12.5px' }}>
												{actualIndex}
											</td>
											<td>
												<div className='gz-prod-identity-cell'>
													<div
														className='gz-order-item-thumb'
														style={{
															width: '38px',
															height: '38px',
															background: '#EAF1F8',
															color: '#172B4D',
															fontWeight: 700,
															fontSize: '13px',
														}}>
														{initials}
													</div>
													<div className='gz-prod-identity-info'>
														<span className='gz-prod-name'>
															{booking.customer_name || '---'}
														</span>
														<span className='gz-prod-subtext'>
															{booking.mobile || '---'}
														</span>
													</div>
												</div>
											</td>
											<td>
												<div className='d-flex align-items-center gap-1'>
													{booking.order_id && (
														<CopyButton
															text={booking.order_id}
															title='Copy Order ID'
															customMessage='Order ID copied!'
															style={{
																backgroundColor: '#F8FAFD',
																border: '1px solid #E4EAF2',
																borderRadius: '6px',
																width: '24px',
																height: '24px',
																color: '#172B4D',
																display: 'inline-flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}
														/>
													)}
													<span className='font-monospace' style={{ color: '#172B4D', fontWeight: 600 }}>
														{booking.order_id || '---'}
													</span>
												</div>
											</td>
											<td>
												<div className='d-flex align-items-center gap-1'>
													{booking.tracking_id && (
														<CopyButton
															text={booking.tracking_id}
															title='Copy Tracking ID'
															customMessage='Tracking ID copied!'
															style={{
																backgroundColor: '#F8FAFD',
																border: '1px solid #E4EAF2',
																borderRadius: '6px',
																width: '24px',
																height: '24px',
																color: '#172B4D',
																display: 'inline-flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}
														/>
													)}
													<span className='font-monospace' style={{ color: '#71809A', fontSize: '13px' }}>
														{booking.tracking_id || '---'}
													</span>
												</div>
											</td>
											<td>
												<div className='d-flex align-items-center gap-1'>
													<CopyButton
														text={sampleUpdateLink}
														title='Copy Review Link'
														customMessage='Review link copied!'
														style={{
															backgroundColor: '#F8FAFD',
															border: '1px solid #E4EAF2',
															borderRadius: '6px',
															width: '24px',
															height: '24px',
															color: '#172B4D',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}
													/>
													<div
														title={sampleUpdateLink}
														style={{
															maxWidth: '140px',
															whiteSpace: 'nowrap',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															color: '#2563EB',
															fontSize: '12.5px',
															fontWeight: 500,
														}}>
														{sampleUpdateLink}
													</div>
												</div>
											</td>
											<td style={{ textAlign: 'center' }}>
												{avgRating ? (
													<div
														className='d-inline-flex align-items-center gap-1 px-2 py-0.5'
														style={{
															background: '#FFFBEB',
															border: '1px solid #FDE68A',
															borderRadius: '6px',
														}}>
														<Star size={12} fill='#D97706' color='#D97706' />
														<span style={{ color: '#92400E', fontSize: '12.5px', fontWeight: 600 }}>
															{avgRating}
														</span>
													</div>
												) : (
													<span style={{ color: '#94A3B8', fontSize: '13px' }}>-</span>
												)}
											</td>
											<td style={{ color: '#71809A', fontSize: '12.5px' }}>
												{booking.createdAt
													? new Date(booking.createdAt).toLocaleDateString('en-GB')
													: '---'}
											</td>
											<td style={{ textAlign: 'center' }}>
												<div className='d-flex align-items-center justify-content-center gap-1'>
													<Link
														to={'/rag/sample-booking-view?id=' + booking._id}
														className='gz-prod-action-btn view'
														title='View Sample Booking'>
														<FontAwesomeIcon icon={faEye} />
													</Link>
													<Link
														to={'/rag/sample-booking-update?id=' + booking._id}
														className='gz-prod-action-btn edit'
														title='Edit Sample Booking'>
														<FontAwesomeIcon icon={faPenToSquare} />
													</Link>
													<button
														type='button'
														className='gz-prod-action-btn delete'
														title='Delete Sample Booking'
														onClick={() => handleRemove(booking._id)}>
														<FontAwesomeIcon icon={faTrash} />
													</button>
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
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
	)
}

export default SampleBookingList
