import { faEye, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { CreateComment, GetLectureComments } from '../../../Functions/FGGroup'
import TableButton from '../../../components/TableButton'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const LectureCommentView: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const lecture_id: string | any = searchParams.get('comment_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [selectedComment, setSelectedComment] = useState<any>(null)
	const [lectureCommentData, setLectureCommentData] = useState([])
	const [commentData, setCommentData] = useState({
		comment: '',
	})

	const fetchUserData = async () => {
		try {
			const response = await GetLectureComments({ lecture_id })
			const filteredData: any = response.data

			setLectureCommentData(filteredData[0].comments)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
	}, [])

	const handleInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { id, name, value } = event.target
		setCommentData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleAddButtonClick = async () => {
		if (!commentData.comment) {
			toast.error('Comment is Required')
			return
		}
		try {
			setIsSubmitting(true)

			const payload: any = {
				lecture_id: lecture_id,
				comment_id: selectedComment._id,
				comment: commentData.comment,
			}

			await CreateComment(payload)

			fetchUserData()
			setCommentData({ comment: '' })

			toast.success('Comment Send Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredFoodTimeData = lectureCommentData.filter((foodtime: any) =>
		foodtime.full_name.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedFoodTimeData = filteredFoodTimeData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}
	return (
		<>
			<PageTitle breadcrumbs={[]}>Lecture Comments View</PageTitle>
			<KTCard>
				<div className='row'>
					<div className='col-12'>
						<div className='d-flex align-items-center justify-content-between mt-5'>
							<div className='ms-5 d-flex'>
								<LengthMenu
									expenseData={lectureCommentData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
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
									<th>User</th>
									<th>Comment</th>
									<th>Total Reply</th>
									<th>Create Date</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody>
								{paginatedFoodTimeData
								.slice()
								.reverse()
								.map((foodtime: any, index: any) => (
									<tr key={foodtime.no}>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{index + 1}
											</span>
										</td>
										<td>
											<span
												className='text-dark fw-bold  d-block mb-1 fs-6'
												data-bs-toggle='modal'
												data-bs-target='#kt_modal_food_time'>
												{foodtime.createdBy}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodtime.full_name}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodtime.replies.length}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(foodtime.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											<div data-bs-toggle='modal'
												data-bs-target='#kt_modal_food_time'>
												<TableButton
													action="view"
													onClick={() => setSelectedComment(foodtime)}
												/>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{lectureCommentData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{lectureCommentData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(lectureCommentData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<div
				className='modal fade'
				id='kt_modal_food_time'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-650px'>
					<div className='modal-content'>
						<div className='modal-header justify-content-between'>
							<h2 className='fw-bolder'>Replies</h2>
							<div
								className='btn btn-sm btn-icon btn-active-color-primary'
								data-bs-dismiss='modal'>
								<FontAwesomeIcon
									className='fs-1 position-absolute ms-3'
									icon={faXmark}
								/>
							</div>
						</div>

						<div className='modal-body scroll-y'>
							<div className='row'>
								<div className='col-md-12 fv-row mb-3'>
									<label
										htmlFor='Comment'
										className='required fw-bold fs-6 mb-2'>
										Comment:
									</label>
									<span
										className='ms-3'
										id='Comment'>
										{selectedComment ? selectedComment.comment : 'No Comment'}
									</span>
								</div>
								<div className='col-md-12 fv-row mb-0'>
									<div>
										<label
											htmlFor='Replier'
											className='required fw-bold fs-6 mb-3'>
											Replier:
										</label>
									</div>
									{selectedComment && selectedComment.replies && selectedComment.replies.length > 0
										? selectedComment.replies.map((reply: any, index: number) => (
											<div
												className='my-2'
												key={index}>
												<span
													className='bg-success m-0 px-2 py-1 me-4 rounded text-white my-5'
													id='Replier'>
													{reply.full_name}
												</span>
												{reply.comment}
												<br />
											</div>
										))
										: 'No Reply'}
								</div>
							</div>
						</div>
						<div className='modal-footer justify-content-end'>
							<div className='col-md-12 fv-row mb-7'>
								<input
									placeholder='Add Comment'
									type='text'
									className='form-control form-control-solid mb-3 mb-lg-0'
									name='comment'
									value={commentData.comment}
									onChange={(e) => handleInputChange(e)}
								/>
							</div>
							<TableButton
								action="add"
								onClick={handleAddButtonClick}
								text={isSubmitting ? 'Please wait, Adding Comment...' : 'Add Comment'}
								showIcon={false}
								disabled={isSubmitting}
								className={`btn-block mb-4 ${isSubmitting ? 'disabled' : ''}`}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export default LectureCommentView
