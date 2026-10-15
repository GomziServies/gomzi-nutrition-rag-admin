import { faCheck, faClose, faDownload, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetProductFeedback, UpdateProductFeedback } from '../../../Functions/FGGroup'

const NutritionProductFeedback: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [feedbackData, setFeedbackData] = useState<any>([])
	const fetchData = async () => {
		try {
			const courseFeedbackData: any = await GetProductFeedback()
			setFeedbackData(courseFeedbackData.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
	}

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	const filteredFeedback = feedbackData.filter((data: any) => {
		if (!searchTerm || !searchTerm.trim()) return true
		const term = searchTerm.toLowerCase().trim()
		const comment = (data?.feedback_comment || '').toLowerCase()
		const userName = `${data?.user?.first_name || ''} ${data?.user?.last_name || ''}`.toLowerCase()
		const productName = (data?.product?.name || data?.product_name || '').toLowerCase()

		return comment.includes(term) || userName.includes(term) || productName.includes(term)
	})

	const paginatedFeedback = filteredFeedback.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

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

	const updateReviewStatus = async (feedback_id: string, status: FeedbackStatusValue) => {
		try {
			Swal.fire({
				title: 'Are you sure?',
				text: "You won't be able to revert this!",
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			}).then(async (result) => {
				if (result.isConfirmed) {
					const response: any = await UpdateProductFeedback({
						feedback_id: feedback_id,
						status: status,
					})
					if (response.status === 200) {
						toast.success(`Review ${status} successfully`)
						fetchData()
					} else {
						toast.error('Failed to Update Review Status')
					}
				}
			})
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Product Feedback</PageTitle>
			<KTCard>
				{/* Filters Toolbar Row: Search, LengthMenu, Download Excel */}
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex flex-wrap align-items-center gap-3 w-100'>
						{/* 1. Search Filter */}
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								className='me-0'
							/>
						</div>

						{/* 2. Dropdown (show entries per page) */}
						<div>
							<LengthMenu
								expenseData={filteredFeedback}
								handleItemsPerPageChange={handleItemsPerPageChange}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center justify-content-center'
								style={{
									width: '38px',
									height: '38px',
									padding: 0,
									borderRadius: '8px',
									fontSize: '14px',
								}}
								onClick={downloadExcel}
								disabled={filteredFeedback.length === 0}
								title='Download Excel'>
								<FontAwesomeIcon icon={faDownload} />
							</button>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Product Name</th>
									<th>Comment (hover for full text)</th>
									<th>Star</th>
									<th>User Name</th>
									<th>Status</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody>
								{paginatedFeedback
									.slice()
									.reverse()
									.map((feedbackData: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1

										const rating = Math.max(0, Math.min(5, Number(feedbackData.feedback_point) || 0))
										const stars = Array.from({ length: 5 }, (_, i) => (
											<FontAwesomeIcon
												key={i}
												icon={faStar}
												className={`fs-7 me-1 ${i < rating ? 'text-warning' : 'text-gray-300'}`}
											/>
										))
										const statusBadge = () => {
											switch (feedbackData.status) {
												case 'APPROVED':
													return (
														<span className='badge badge-light-success fw-bold px-4 py-2'>
															Approved
														</span>
													)

												case 'PENDING':
													return (
														<span className='badge badge-light-warning fw-bold px-4 py-2'>
															Pending
														</span>
													)

												case 'REJECTED':
													return (
														<span className='badge badge-light-danger fw-bold px-4 py-2'>
															Rejected
														</span>
													)

												default:
													return (
														<span className='badge badge-light-secondary fw-bold px-4 py-2'>
															Unknown
														</span>
													)
											}
										}

										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>{actualIndex}</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{feedbackData?.product?.name || '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{
															<span
																title={feedbackData.feedback_comment || ''}
																style={{ cursor: 'pointer' }}>
																{feedbackData.feedback_comment.length > 100
																	? feedbackData.feedback_comment.slice(0, 100) + '...'
																	: feedbackData.feedback_comment || 'N/A'}{' '}
															</span>
														}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6 d-flex'>
														{stars}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{feedbackData?.user?.first_name + ' ' + feedbackData?.user?.last_name ||
															'-'}
													</span>
												</td>
												<td>{statusBadge()}</td>
												<td>
													<div className='d-flex'>
														{feedbackData.status !== 'APPROVED' && (
															<button
																className='btn gap-2 p-3 d-flex btn-light-success mx-2 btn-sm me-1'
																onClick={() => updateReviewStatus(feedbackData._id, 'APPROVED')}>
																<FontAwesomeIcon
																	icon={faCheck}
																	className='fs-3'
																/>
																Approve
															</button>
														)}

														{feedbackData.status !== 'REJECTED' && (
															<button
																onClick={() => updateReviewStatus(feedbackData._id, 'REJECTED')}
																className='btn gap-2 p-3 d-flex btn-light-danger mx-2 btn-sm me-1'>
																<FontAwesomeIcon
																	icon={faClose}
																	className='fs-3'
																/>
																Reject
															</button>
														)}
													</div>
												</td>
											</tr>
										)
									})}
							</tbody>
						</table>
					</div>
					{feedbackData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{feedbackData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredFeedback.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}
export default NutritionProductFeedback
