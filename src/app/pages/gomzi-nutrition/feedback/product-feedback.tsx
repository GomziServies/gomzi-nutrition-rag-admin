import {
	faCheck,
	faClose,
	faComments,
	faDownload,
	faImage,
	faStar,
	faThumbsDown,
	faThumbsUp,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import NumberTicker from '../../../components/NumberTicker'
import SearchFilter from '../../../components/SearchFilter'
import GomziTablePagination from '../../../components/GomziTablePagination'
import { GetProductFeedback, UpdateProductFeedback } from '../../../Functions/FGGroup'
import '../products-theme.css'

type ModerationTab = 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'

const NutritionProductFeedback: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [feedbackData, setFeedbackData] = useState<any[]>([])
	const [activeTab, setActiveTab] = useState<ModerationTab>('ALL')
	const [ratingFilter, setRatingFilter] = useState<string>('')
	const [statusFilter, setStatusFilter] = useState<string>('')
	const [loading, setLoading] = useState<boolean>(false)
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
	const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(new Set())

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async () => {
		setLoading(true)
		try {
			const courseFeedbackData: any = await GetProductFeedback()
			setFeedbackData(courseFeedbackData?.data || [])
		} catch (error: any) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
	}

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm, activeTab, ratingFilter, statusFilter])

	// Moderation counts
	const counts = useMemo(() => {
		const total = feedbackData.length
		let approved = 0
		let rejected = 0
		let pending = 0

		feedbackData.forEach((fb) => {
			const st = (fb.status || '').toUpperCase()
			if (st === 'APPROVED') approved++
			else if (st === 'REJECTED') rejected++
			else pending++
		})

		return { total, approved, rejected, pending }
	}, [feedbackData])

	// Filtered feedback
	const filteredFeedback = useMemo(() => {
		return feedbackData.filter((data: any) => {
			const st = (data?.status || 'PENDING').toUpperCase()

			// 1. Tab filter
			if (activeTab === 'APPROVED' && st !== 'APPROVED') return false
			if (activeTab === 'REJECTED' && st !== 'REJECTED') return false
			if (activeTab === 'PENDING' && st !== 'PENDING') return false

			// 2. Status dropdown filter
			if (statusFilter && st !== statusFilter.toUpperCase()) return false

			// 3. Rating filter
			if (ratingFilter) {
				const stars = Number(data?.feedback_point) || 0
				if (stars !== Number(ratingFilter)) return false
			}

			// 4. Search filter
			if (!searchTerm || !searchTerm.trim()) return true
			const term = searchTerm.toLowerCase().trim()
			const comment = (data?.feedback_comment || '').toLowerCase()
			const userName = `${data?.user?.first_name || ''} ${data?.user?.last_name || ''} ${data?.user_name || ''}`.toLowerCase()
			const productName = (data?.product?.name || data?.product_name || '').toLowerCase()

			return comment.includes(term) || userName.includes(term) || productName.includes(term)
		})
	}, [feedbackData, activeTab, statusFilter, ratingFilter, searchTerm])

	const paginatedFeedback = useMemo(() => {
		return filteredFeedback.slice(
			(pagination.page - 1) * pagination.itemsPerPage,
			pagination.page * pagination.itemsPerPage
		)
	}, [filteredFeedback, pagination])

	const toggleExpandComment = (id: string) => {
		setExpandedCommentIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const downloadExcel = () => {
		const worksheetData = filteredFeedback.map((data: any, idx: number) => {
			const userName = data?.user
				? `${data?.user?.first_name || ''} ${data?.user?.last_name || ''}`.trim()
				: data?.user_name || 'N/A'
			const productName = data?.product?.name || data?.product_name || 'N/A'
			const comment = data?.feedback_comment || 'N/A'
			const stars = data?.feedback_point ?? 'N/A'
			const status = data?.status || 'N/A'
			const date = data?.createdAt ? DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A') : 'N/A'

			return {
				'No.': idx + 1,
				'Product Name': productName,
				'User Name': userName,
				'Rating (Stars)': stars,
				Comment: comment,
				Status: status,
				Date: date,
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Feedback')
		XLSX.writeFile(workbook, `Product_Feedback_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	const updateReviewStatus = async (feedback_id: string, status: 'APPROVED' | 'REJECTED') => {
		try {
			const result = await Swal.fire({
				title: status === 'APPROVED' ? 'Approve Review?' : 'Reject Review?',
				text: `Are you sure you want to mark this review as ${status}?`,
				icon: status === 'APPROVED' ? 'question' : 'warning',
				showCancelButton: true,
				confirmButtonColor: status === 'APPROVED' ? '#168064' : '#D94A62',
				cancelButtonColor: '#71809A',
				confirmButtonText: `Yes, ${status.toLowerCase()}`,
				cancelButtonText: 'Cancel',
			})

			if (result.isConfirmed) {
				setActionLoadingId(feedback_id)
				const response: any = await UpdateProductFeedback({
					feedback_id,
					status,
				})
				if (response?.status === 200 || response?.data) {
					toast.success(`Review ${status.toLowerCase()} successfully`)
					// Optimistically update or refetch
					setFeedbackData((prev) =>
						prev.map((item) => (item._id === feedback_id ? { ...item, status } : item))
					)
				} else {
					toast.error('Failed to update review status')
				}
			}
		} catch (error: any) {
			toast.error(error.message || 'An error occurred')
		} finally {
			setActionLoadingId(null)
		}
	}

	const getInitials = (first?: string, last?: string) => {
		const f = (first || '').trim().charAt(0).toUpperCase()
		const l = (last || '').trim().charAt(0).toUpperCase()
		return f || l ? `${f}${l}` : 'U'
	}

	const renderRatingStars = (points: number) => {
		const rating = Math.max(0, Math.min(5, Number(points) || 0))
		return (
			<div className='gz-prod-stars-wrap' title={`${rating} out of 5 stars`}>
				{Array.from({ length: 5 }, (_, i) => (
					<FontAwesomeIcon
						key={i}
						icon={faStar}
						className={`fs-7 me-1 ${i < rating ? 'gz-prod-star-filled' : 'gz-prod-star-empty'}`}
					/>
				))}
			</div>
		)
	}

	const renderStatusBadge = (status: string) => {
		const s = (status || '').toUpperCase()
		if (s === 'APPROVED') {
			return <span className='gz-prod-badge approved'>Approved</span>
		}
		if (s === 'REJECTED') {
			return <span className='gz-prod-badge rejected'>Rejected</span>
		}
		return <span className='gz-prod-badge pending'>Pending</span>
	}

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Product Feedback</PageTitle>

			{/* Breadcrumbs */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Products & Orders</span>
				<span className='sep'>/</span>
				<span className='current'>Product Feedback</span>
			</div>

			{/* Page Header */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Product Feedback</h1>
					<p className='gz-prod-subtitle'>Manage customer reviews and moderation.</p>
				</div>
			</div>

			{/* Summary KPI Cards */}
			<div className='gz-prod-summary-grid'>
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-blue'>
						<FontAwesomeIcon icon={faComments} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Total Reviews</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={counts.total} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-green'>
						<FontAwesomeIcon icon={faThumbsUp} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Approved</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={counts.approved} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-pink'>
						<FontAwesomeIcon icon={faThumbsDown} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Rejected</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={counts.rejected} />
							)}
						</div>
					</div>
				</div>

				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon icon-amber'>
						<FontAwesomeIcon icon={faStar} />
					</div>
					<div className='gz-prod-summary-content'>
						<div className='gz-prod-summary-label'>Pending Review</div>
						<div className='gz-prod-summary-value'>
							{loading ? (
								<span className='gz-prod-skeleton' style={{ width: '48px', height: '24px' }} />
							) : (
								<NumberTicker value={counts.pending} />
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Main Card */}
			<div className='gz-prod-card'>
				{/* Standard Toolbar Placement: Moderation Tabs + Search + Dropdowns + Export */}
				<div className='gz-prod-toolbar'>
					<div className='gz-prod-toolbar-left'>
						{/* Filter Pills matching Image 3 */}
						<div className='gz-prod-filter-pills'>
							<button
								type='button'
								className={`gz-prod-pill-tab ${activeTab === 'ALL' ? 'active' : ''}`}
								onClick={() => setActiveTab('ALL')}>
								All Reviews
								<span className='gz-prod-pill-badge'>{counts.total}</span>
							</button>
							<button
								type='button'
								className={`gz-prod-pill-tab ${activeTab === 'APPROVED' ? 'active' : ''}`}
								onClick={() => setActiveTab('APPROVED')}>
								Approved
								<span className='gz-prod-pill-badge'>{counts.approved}</span>
							</button>
							<button
								type='button'
								className={`gz-prod-pill-tab ${activeTab === 'REJECTED' ? 'active' : ''}`}
								onClick={() => setActiveTab('REJECTED')}>
								Rejected
								<span className='gz-prod-pill-badge'>{counts.rejected}</span>
							</button>
						</div>

						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search by product or comment...'
							className='me-0'
						/>

						<LengthMenu
							expenseData={filteredFeedback}
							handleItemsPerPageChange={handleItemsPerPageChange}
							className='me-0'
						/>
					</div>

					<div className='gz-prod-toolbar-right'>
						{/* Rating filter */}
						<select
							className='gz-prod-select'
							value={ratingFilter}
							onChange={(e) => setRatingFilter(e.target.value)}
							aria-label='Filter by rating'>
							<option value=''>All Ratings</option>
							<option value='5'>5 Stars</option>
							<option value='4'>4 Stars</option>
							<option value='3'>3 Stars</option>
							<option value='2'>2 Stars</option>
							<option value='1'>1 Star</option>
						</select>

						{/* Status filter */}
						<select
							className='gz-prod-select'
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							aria-label='Filter by status'>
							<option value=''>All Status</option>
							<option value='APPROVED'>Approved</option>
							<option value='PENDING'>Pending</option>
							<option value='REJECTED'>Rejected</option>
						</select>

						<button
							type='button'
							className='gz-prod-btn-icon-export'
							onClick={downloadExcel}
							disabled={loading || filteredFeedback.length === 0}
							title='Export Feedback to Excel'>
							<FontAwesomeIcon icon={faDownload} />
						</button>
					</div>
				</div>

				{/* Table */}
				<div className='table-responsive' style={{ overflowX: 'auto' }}>
					<table className='gz-prod-table'>
						<thead>
							<tr>
								<th style={{ width: '50px' }}>#</th>
								<th>Product</th>
								<th style={{ width: '320px' }}>Comment</th>
								<th>Rating</th>
								<th>User</th>
								<th>Status</th>
								<th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 6 }).map((_, idx) => (
									<tr key={`skeleton-${idx}`} className='gz-prod-skeleton-row'>
										<td><span className='gz-prod-skeleton' style={{ width: '20px', height: '16px' }} /></td>
										<td>
											<div className='gz-prod-identity-cell'>
												<span className='gz-prod-skeleton' style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
												<span className='gz-prod-skeleton' style={{ width: '140px', height: '14px' }} />
											</div>
										</td>
										<td><span className='gz-prod-skeleton' style={{ width: '260px', height: '14px' }} /></td>
										<td><span className='gz-prod-skeleton' style={{ width: '80px', height: '14px' }} /></td>
										<td>
											<div className='gz-prod-user-cell'>
												<span className='gz-prod-skeleton' style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
												<span className='gz-prod-skeleton' style={{ width: '100px', height: '14px' }} />
											</div>
										</td>
										<td><span className='gz-prod-skeleton' style={{ width: '70px', height: '22px', borderRadius: '999px' }} /></td>
										<td style={{ textAlign: 'center' }}><span className='gz-prod-skeleton' style={{ width: '70px', height: '32px', borderRadius: '8px' }} /></td>
									</tr>
								))
							) : paginatedFeedback.length === 0 ? (
								<tr>
									<td colSpan={7} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap'>
											<div className='gz-prod-empty-icon'>
												<FontAwesomeIcon icon={faComments} />
											</div>
											<h4 className='gz-empty-state-title'>No feedback records found</h4>
											<p className='gz-empty-state-desc'>
												{searchTerm || activeTab !== 'ALL' || ratingFilter || statusFilter
													? 'No customer reviews match your active filter criteria.'
													: 'There are no reviews submitted for products yet.'}
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedFeedback.map((fb: any, index: number) => {
									const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
									const user = fb?.user
									const authorName = user
										? `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || fb?.user_name || 'Customer'
										: fb?.user_name || 'Customer'
									const authorImg = user?.profile_image
										? `https://files.fggroup.in/${user.profile_image}`
										: null
									const prodName = fb?.product?.name || fb?.product_name || 'Nutrition Product'
									const prodImg = fb?.product?.display_image?.[0] || fb?.product?.displayImages?.[0]
									const commentText = fb?.feedback_comment || 'No comment text provided.'
									const isLongComment = commentText.length > 90
									const isExpanded = expandedCommentIds.has(fb?._id)
									const isActionBusy = actionLoadingId === fb?._id

									return (
										<tr key={fb?._id || index}>
											<td>
												<span style={{ fontWeight: 600, color: '#64748B' }}>{actualIndex}</span>
											</td>
											<td>
												<div className='gz-prod-identity-cell'>
													{prodImg ? (
														<img
															src={`https://files.fggroup.in/${prodImg}`}
															alt={prodName}
															className='gz-prod-thumb'
															onError={(e) => {
																;(e.target as HTMLElement).style.display = 'none'
															}}
														/>
													) : (
														<div className='gz-prod-thumb-placeholder'>
															<FontAwesomeIcon icon={faImage} />
														</div>
													)}
													<div className='gz-prod-identity-info'>
														<span className='gz-prod-name'>{prodName}</span>
													</div>
												</div>
											</td>
											<td>
												<div className='gz-prod-comment-box'>
													{isExpanded || !isLongComment
														? commentText
														: `${commentText.slice(0, 90)}...`}
													{isLongComment && (
														<button
															type='button'
															className='gz-prod-comment-toggle'
															onClick={() => toggleExpandComment(fb?._id)}>
															{isExpanded ? 'Show less' : 'Read more'}
														</button>
													)}
												</div>
											</td>
											<td>
												{renderRatingStars(fb.feedback_point)}
											</td>
											<td>
												<div className='gz-prod-user-cell'>
													{authorImg ? (
														<img
															src={authorImg}
															alt={authorName}
															className='gz-prod-avatar'
															style={{ width: '32px', height: '32px' }}
															onError={(e) => {
																;(e.target as HTMLElement).style.display = 'none'
															}}
														/>
													) : (
														<div
															className='gz-prod-avatar-fallback'
															style={{ width: '32px', height: '32px', fontSize: '11px' }}>
															{getInitials(user?.first_name, user?.last_name)}
														</div>
													)}
													<span style={{ fontWeight: 600, color: '#172B4D', fontSize: '13.5px' }}>
														{authorName}
													</span>
												</div>
											</td>
											<td>
												{renderStatusBadge(fb.status)}
											</td>
											<td>
												<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
													{fb.status !== 'APPROVED' && (
														<button
															type='button'
															className='gz-prod-action-btn approve'
															onClick={() => updateReviewStatus(fb._id, 'APPROVED')}
															disabled={isActionBusy}
															title='Approve Review'>
															<FontAwesomeIcon icon={faCheck} />
														</button>
													)}
													{fb.status !== 'REJECTED' && (
														<button
															type='button'
															className='gz-prod-action-btn reject'
															onClick={() => updateReviewStatus(fb._id, 'REJECTED')}
															disabled={isActionBusy}
															title='Reject Review'>
															<FontAwesomeIcon icon={faClose} />
														</button>
													)}
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				{filteredFeedback.length > 0 && (
					<GomziTablePagination
						totalRecords={filteredFeedback.length}
						page={pagination.page}
						itemsPerPage={pagination.itemsPerPage}
						totalPages={Math.ceil(filteredFeedback.length / pagination.itemsPerPage) || 1}
						onPageChange={handlePageChange}
						entityName='reviews'
					/>
				)}
			</div>
		</div>
	)
}

export default NutritionProductFeedback
