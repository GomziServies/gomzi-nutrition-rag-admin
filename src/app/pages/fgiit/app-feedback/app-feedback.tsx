import { faCheck, faClose } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetFeedback, UpdateFeedback } from '../../../Functions/FGGroup'

const AppFeedback: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [feedbackData, setFeedbackData] = useState<any>([])
	const fetchData = async () => {
		try {
			const courseFeedbackData: any = await GetFeedback()
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
		setPagination({ ...pagination, page })
	}

	const filteredFeedback = feedbackData.filter((data: any) => {
		const matchesSearchTerm = data.course?.course_name
			.toLowerCase()
			.includes(searchTerm.toLowerCase())

		return matchesSearchTerm
	})

	const paginatedFeedback = filteredFeedback.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

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
					const response: any = await UpdateFeedback({ feedback_id: feedback_id, status: status })
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
			<PageTitle breadcrumbs={[]}>App Feedback</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
					/>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>User</th>
									<th>Course Name</th>
									<th>Comment (hover for full text)</th>
									<th>Star</th>
								</tr>
							</thead>
							<tbody>
								{paginatedFeedback
									.slice()
									.reverse()
									.map((feedbackData: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1

										const stars = []
										for (let i = 0; i < feedbackData.feedback_point; i++) {
											stars.push(
												<i
													key={i}
													className='fas fa-star text-warning'></i>
											)
										}
										const status =
											feedbackData.status == 'APPROVED' ? (
												<p style={{ color: 'green' }}>APPROVED</p>
											) : feedbackData.status == 'PENDING' ? (
												<p style={{ color: 'goldenrod' }}>PENDING</p>
											) : (
												<p style={{ color: 'red' }}>REJECTED</p>
											)
										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark fw-bold mb-1 fs-6'>{actualIndex}</span>
												</td>
												<td>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{feedbackData?.user?.first_name + ' ' + feedbackData?.user?.last_name || '-'}
													</span>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{feedbackData?.user?.mobile || '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{feedbackData?.course?.course_name || '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
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
													<span className='text-dark fw-bold d-block mb-1 fs-6 d-flex'>
														{stars}
													</span>
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
export default AppFeedback
