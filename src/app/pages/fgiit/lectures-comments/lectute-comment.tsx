import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import SearchFilter from '../../../components/SearchFilter'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetLecture, GetLectureComments } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const LectureComment: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [commentData, setCommentData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [replyFilter, setReplyFilter] = useState('')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const fetchUserData = async () => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			} else {
				// If no date range is selected, set to null to fetch all data
				startDate = null
				endDate = null
			}

			// Adjust endDate to the end of the day for inclusive range if set
			if (endDate) {
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			}

			const commentsResponse = await GetLectureComments()
			const commentsData: any = commentsResponse.data

			const lectureResponse = await GetLecture()
			const lectureData: any = lectureResponse.data

			// Add lecture title to each comment
			const enrichedComments = commentsData.map((comment: any) => {
				const lecture = lectureData.find((lecture: any) => lecture._id === comment.lecture._id)
				return {
					...comment,
					lectureTitle: lecture ? lecture.title : 'No Title',
				}
			})

			// Flatten the comments data
			const flattenedComments = enrichedComments.flatMap((data: any) =>
				data.comments.map((c: any) => ({
					...c,
					lectureTitle: data?.lecture?.title,
					createdAt: data.createdAt,
					lectureId: data._id,
				}))
			)

			flattenedComments.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setCommentData(flattenedComments)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchUserData()
	}, [selectedDateRange])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const filteredCommentData = commentData.filter((data: any) => {
		const matchesSearchTerm = data.lectureTitle.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesReplyFilter =
			replyFilter === ''
				? true
				: replyFilter === 'yes'
				? data.is_replied_by_admin
				: !data.is_replied_by_admin
		return matchesSearchTerm && matchesReplyFilter
	})

	const paginatedCommentData = filteredCommentData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	let globalIndex = (pagination.page - 1) * pagination.itemsPerPage + 1

	return (
		<>
			<PageTitle breadcrumbs={[]}>Lecture Comments</PageTitle>
			<KTCard>
				<div className='row'>
					<div className='col-md-7'>
						<div className='d-flex align-items-center justify-content-between mx-5 mt-5'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
					</div>
					<div className='col-md-5 text-right d-flex justify-content-between'>
						<div className='col-md-6 mt-md-5 mt-2 me-5'>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<SelectFieldManual
							className='fv-row mx-5 mt-5'
							label='Filter'
							showLabel={false}
							name='filter'
							value={replyFilter}
							onChange={(e) => setReplyFilter(e.target.value)}
							htmlFor='filter'
							marginRemove={true}
							options={[
								{
									value: '',
									name: 'All',
								},
								{ value: 'yes', name: 'Replied' },
								{
									value: 'No',
									name: 'Not Replied',
								},
							]}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
							<thead>
								<tr className='fw-bold text-muted'>
									<th>No.</th>
									<th>Lecture Name</th>
									<th>Comment</th>
									<th>Reply by Admin</th>
									<th>Create Date</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={12}
											className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									paginatedCommentData.map((data: any) => (
										<tr key={data._id}>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{globalIndex++}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.lectureTitle}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.comment}
												</span>
											</td>
											<td>
												{data.is_replied_by_admin ? (
													<span className='fs-6 btn btn-light-success btn-sm'>Yes</span>
												) : (
													<span className='fs-6 btn btn-light-danger btn-sm'>No</span>
												)}
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												</span>
											</td>
											<td>
												<TableButton
													action='view'
													to={`/fgiit/lectures-view?lecture_id=${data.lectureId}`}
												/>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
					{filteredCommentData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{filteredCommentData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredCommentData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}
export default LectureComment
