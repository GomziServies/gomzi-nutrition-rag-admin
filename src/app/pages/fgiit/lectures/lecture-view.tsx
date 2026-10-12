import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { MultiSelect } from 'react-multi-select-component'
import { useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import {
	CreateComment,
	DeleteComment,
	DeleteLecture,
	FileUploadToFGGroup,
	GetFitnessCourse,
	GetLecture,
	GetLectureComments,
	UpdateComment,
	UpdateLecture,
} from '../../../Functions/FGGroup'
import { default as bookCover, default as tumbnailImage } from './fwg-logo.png'

const LectureView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const lecture_id: string | any = searchParams.get('lecture_id')
	const navigate = useNavigate()
	const [isSubmitting, setIsSubmitting] = useState<{ [key: string]: boolean }>({})
	const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false)
	const [isSubmittingRemove, setIsSubmittingRemove] = useState<boolean>(false)
	const [pdfFile, setPdfFile] = useState<string | null>(null)
	const [isPdf, setIsPdf] = useState<boolean>(false)
	const [thumbnailFile, setThumbnailFile] = useState<string | null>(null)
	const [isThumbnail, setIsThumbnail] = useState<boolean>(false)
	const [courseData, setCourseData] = useState<any>([])
	const [commentData, setCommentData] = useState<{ [key: string]: string }>({})
	const [lectureCommentData, setLectureCommentData] = useState<any[]>([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [commentId, setCommentId] = useState<any>('')
	const [selectedComment, setSelectedComment] = useState<any>({})
	const [lectureData, setLectureData] = useState({
		thumbnail_image: '',
		title: '',
		lecture_index: '',
		video_url: '',
		description: '',
		related_courses: [],
		createdAt: '',
		updatedAt: '',
		pdf_files: '',
		editImage: false,
	})

	const openModal = (reply: any, commentId: any) => {
		setIsModalOpen(true)
		setSelectedComment(reply)
		setCommentId(commentId)
	}

	const closeModal = () => {
		setIsModalOpen(false)
		setSelectedComment(null)
	}

	const fetchUserData = async () => {
		try {
			const response = await GetLecture({ lecture_id })
			if (Array.isArray(response.data) && response.data.length > 0) {
				const filteredData: any = response.data[0]

				const course = filteredData.related_courses.map((el: any) => {
					return { label: el.course_name, value: el._id, id: el._id }
				})

				filteredData.related_courses = course

				setLectureData(filteredData)
			} else {
				console.error('No lecture data found')
			}

			const course_response = await GetFitnessCourse()
			let course_filteredData: any = course_response.data
			course_filteredData = course_filteredData.map((course: any) => {
				return {
					value: course._id,
					label: `${course?.course_name} - ${course?.course_category}`,
					id: course._id,
				}
			})
			setCourseData(course_filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchCommentData = async () => {
		try {
			const response: any = await GetLectureComments({ lecture_id })
			const filteredData: any = response.data
			setLectureCommentData(filteredData[0]?.comments || [])
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
		fetchCommentData()
	}, [])

	useEffect(() => {
		return () => {
			if (lectureData.thumbnail_image) {
				URL.revokeObjectURL(lectureData.thumbnail_image)
			}
			if (lectureData.pdf_files) {
				URL.revokeObjectURL(lectureData.pdf_files)
			}
		}
	}, [lectureData.thumbnail_image, lectureData.pdf_files])

	const handleUpdateButtonClick = async () => {
		try {
			setIsSubmitting({ ...isSubmitting, updateLecture: true })

			const course = lectureData.related_courses.map((el: any) => el.value)
			const payload: any = {
				lecture_id: lecture_id,
				thumbnail_image: thumbnailFile,
				title: lectureData.title,
				lecture_index: lectureData.lecture_index,
				video_url: lectureData.video_url[0],
				description: lectureData.description,
				related_courses: course,
				pdf_files: pdfFile,
			}

			await UpdateLecture(payload)
			toast.success('Lecture Updated Successfully')
			setLectureData((prevData) => ({
				...prevData,
				editImage: false,
			}))
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		} finally {
			setIsSubmitting({ ...isSubmitting, updateLecture: false })
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handleInputChange = async (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			const objectURL = URL.createObjectURL(file)

			setLectureData((prevData) => ({
				...prevData,
				selectedFile: file,
				thumbnail_image: objectURL,
				editImage: true,
			}))

			const imageUrl: any = await FileUploadToFGGroup([file], {
				directory: 'lecture',
			})

			const imgUrl = imageUrl.data?.fileURLs[0]
			setThumbnailFile(imgUrl)
			setIsThumbnail(true)

			toast.success('Lecture cover uploaded successfully')
		} else {
			if (name === 'video_url') {
				setLectureData((prevData: any) => ({
					...prevData,
					video_url: [value],
				}))
			} else {
				setLectureData((prevData) => ({
					...prevData,
					[name]: value,
				}))
			}
		}
	}

	const handlePdfButtonClick = () => {
		const fileInput = document.getElementById('filePdfInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handlePdfInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.id === 'filePdfInput' && event.target.files) {
			const file = event.target.files[0]

			if (!file || file.type !== 'application/pdf') {
				toast.error('Please upload a valid PDF file.')
				return
			}

			try {
				const objectURL = URL.createObjectURL(file)

				setLectureData((prevData) => ({
					...prevData,
					selectedFile: file,
					pdf_files: objectURL,
				}))

				const pdfFiles: any = await FileUploadToFGGroup([file], {
					directory: 'lecture',
				})

				const pdf_Files = pdfFiles.data?.fileURLs[0]
				setPdfFile(pdf_Files)
				setIsPdf(true)
				toast.success('Lecture PDF uploaded successfully')
			} catch (error) {
				toast.error('Error uploading PDF')
			} finally {
				if (file) {
					URL.revokeObjectURL(URL.createObjectURL(file))
				}
			}
		}
	}

	const handleMultiSelectChange = (selected: any) => {
		setLectureData((prevData) => ({
			...prevData,
			related_courses: selected,
		}))
	}

	const handleInputCommentChange = (e: any, commentId: any) => {
		setCommentData({
			...commentData,
			[commentId]: e.target.value,
		})
	}

	const handleAddButtonClick = async (comment_id: string) => {
		if (!commentData[comment_id]) {
			toast.error('Comment is Required')
			return
		}

		try {
			setIsSubmitting({ ...isSubmitting, [comment_id]: true })

			const payload = {
				lecture_id: lecture_id,
				comment_id: comment_id,
				comment: commentData[comment_id],
			}

			await CreateComment(payload)

			fetchUserData()
			setCommentData({ ...commentData, [comment_id]: '' })

			toast.success('Comment Send Successfully')
			fetchCommentData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		} finally {
			setIsSubmitting({ ...isSubmitting, [comment_id]: false })
		}
	}

	const deleteLecture = async () => {
		try {
			await DeleteLecture({ lecture_id })
			fetchUserData()
			fetchCommentData()
			toast.success('Lecture remove successfully')
			navigate('/fgiit/lectures')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleUpdateReply = async () => {
		try {
			const payload = {
				lecture_id: lecture_id,
				reply_id: selectedComment._id,
				comment_id: commentId,
				comment: selectedComment.comment,
			}

			await UpdateComment(payload)
			toast.success('Comment updated successfully')
			fetchCommentData()
			setIsModalOpen(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsModalOpen(false)
		}
	}

	const deleteReply = (replyId?: any, comment_id?: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'You want to remove this Reply',
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Remove',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					setIsSubmittingRemove(true)
					await DeleteComment({
						lecture_id: lecture_id,
						comment_id: comment_id,
						reply_id: replyId,
					})
					toast.success('Comment reply removed successfully')
					fetchCommentData()
					setIsSubmittingRemove(false)
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
					setIsSubmittingRemove(false)
				}
			}
		})
		setIsSubmittingRemove(false)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Lecture View</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-2 text-center'>
									<img
										alt='Photos'
										src={
											lectureData.thumbnail_image
												? lectureData.thumbnail_image.includes('blob:')
													? lectureData.thumbnail_image
													: `https://files.fggroup.in/${lectureData.thumbnail_image}`
												: tumbnailImage
										}
										style={{ borderRadius: '10px', width: '70%' }}
									/>

									<div>
										<button
											type='button'
											className='mt-5 px-2 py-1 mb-2 btn btn-success'
											onClick={handleFileButtonClick}>
											Upload Photo
										</button>
										<input
											type='file'
											id='fileInput'
											className='d-none'
											onChange={handleInputChange}
										/>
									</div>
								</div>
								<div className='col-md-10'>
									<div className='row'>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Lecture Index'
												type='text'
												className='col-12 fv-row mb-7'
												name='lecture_index'
												label='Lecture Index'
												htmlFor='lecture_index'
												value={`${lectureData.lecture_index}`}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Title'
												type='text'
												className='col-12 fv-row mb-7'
												name='title'
												label='Title'
												htmlFor='title'
												value={lectureData.title}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Video URL'
												type='text'
												className='col-12 fv-row mb-7'
												name='video_url'
												label='Video URL'
												htmlFor='video_url'
												value={lectureData.video_url}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<label
												className='fw-bold fs-6 mb-2'
												htmlFor='Select'>
												Courses
											</label>
											<MultiSelect
												options={courseData}
												value={lectureData.related_courses}
												onChange={handleMultiSelectChange}
												labelledBy='Select'
												className='fv-row mt-3'
											/>
										</div>
										<div className='col-md-12 fv-row mb-7'>
											<TextareaField
												placeholder='Lecture Description'
												className='col-12 fv-row mb-7'
												name='description'
												label='Lecture Description'
												htmlFor='description'
												value={lectureData.description}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label
												className='required fw-bold fs-6 mb-2'
												htmlFor='file_pdf_preview'>
												Update PDF
											</label>
											{isPdf && pdfFile ? (
												<embed
													src={`https://files.fggroup.in/${pdfFile ?? undefined}`}
													id='file_pdf_preview'
													width='100%'
													height='200px'
													type='application/pdf'
												/>
											) : lectureData.pdf_files ? (
												lectureData.pdf_files.length > 0 ? (
													<embed
														src={`https://files.fggroup.in/${lectureData.pdf_files ?? undefined}`}
														id='file_pdf_preview'
														width='100%'
														height='200px'
														type='application/pdf'
													/>
												) : (
													<p>No PDf Found</p>
												)
											) : (
												''
											)}
											<div>
												<button
													type='button'
													className='px-2 mb-2 btn btn-success'
													onClick={handlePdfButtonClick}>
													Upload PDF
												</button>
												<input
													type='file'
													id='filePdfInput'
													className='d-none'
													onChange={handlePdfInputChange}
												/>
											</div>
										</div>
										<div className='col-md-12 fv-row mt-4 mb-2 d-flex justify-content-end'>
											<TableButton
												action='edit'
												onClick={handleUpdateButtonClick}
												text={
													isSubmitting['updateLecture']
														? 'Please wait, Update Lecture...'
														: 'Update Lecture'
												}
												showIcon={false}
												disabled={isSubmitting['updateLecture']}
												backgroundDark={true}
												className={`btn-block ${isSubmitting['updateLecture'] ? 'disabled' : ''}`}
											/>
											<div
												data-bs-toggle='modal'
												data-bs-target='#kt_modal_exercise'>
												<TableButton
													action='remove'
													showIcon={false}
													text='Remove Lecture'
													backgroundDark={true}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div
				className='card mb-5 mb-xl-10 mt-10'
				id='commentSection'>
				<div
					className='card-header border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_comment_view'>
					<div className='card-title m-0'>
						<h3 className='fw-bolder m-0'>Lecture Comment</h3>
					</div>
				</div>
				<div
					id='kt_comment_view'
					className='collapse show'>
					{lectureCommentData.length === 0 ? (
						<p className='text-center my-5 mb-10 fw-bold fs-3'>No Comment found</p>
					) : (
						lectureCommentData?.map((comment, index) => (
							<div
								key={comment._id || index}
								className='card mt-4'>
								<div className='card-body pb-0'>
									<div className='d-flex align-items-center mb-3'>
										<div className='d-flex align-items-center flex-grow-1'>
											<div className='symbol symbol-45px me-5 mb-5'>
												<img
													src={
														comment.profile_image
															? `https://files.fggroup.in/${comment.profile_image}`
															: toAbsoluteUrl('/media/logos/fgiit-logo.png')
													}
													alt=''
												/>
											</div>
											<div className='d-flex flex-column'>
												<p className='text-gray-800  fs-6 mb-0 fw-bold'>
													{comment.full_name || ''}
												</p>
												<span className='text-gray-400 fw-semibold'>
													{DayJS(comment.createdAt).format('MMMM D, YYYY h:mm A')}
												</span>
											</div>
										</div>
									</div>
									<div className='mb-3 border-bottom'>
										<div className='text-gray-800 mb-5'>
											<p className='fs-4 fw-bold'>{comment.comment || ''}</p>
										</div>
									</div>
									<div className='mt-2'>
										<p className='fs-6 text-gray-800 fw-bold mb-4'>Replies:</p>
									</div>
									<div className='mb-7 ps-10'>
										{comment.replies?.length === 0 ? (
											<p>No replies found</p>
										) : (
											comment.replies?.map((reply: any, replyIndex: any) => (
												<div
													key={reply._id || replyIndex}
													className='d-flex mb-5'>
													<div className='symbol symbol-45px me-5'>
														<img
															src={
																reply.profile_image
																	? `https://files.fggroup.in/${reply.profile_image}`
																	: toAbsoluteUrl('/media/logos/fgiit-logo.png')
															}
															alt='admin'
														/>
													</div>
													<div className='d-flex flex-column flex-row-fluid'>
														<div className='d-flex align-items-center flex-wrap mb-1'>
															<p className='mb-0 text-gray-800  fw-bold me-2'>{reply.full_name}</p>
															<span className='text-gray-400 fw-semibold fs-7'>
																{DayJS(reply.createdAt).format('MMMM D, YYYY h:mm A')}
															</span>
														</div>
														<span className='text-gray-800 fs-7 fw-normal pt-1'>
															{reply.comment}
														</span>
														<div className='d-flex mt-2'>
															<a
																onClick={() => openModal(reply, comment._id)}
																className={`${isSubmittingEdit ? 'disabled' : ''} `}
																style={{ cursor: 'pointer', fontSize: '14px' }}>
																Edit
															</a>
															<a
																onClick={() => deleteReply(reply._id, comment._id)}
																className={`${isSubmittingRemove ? 'disabled' : ''} mx-3`}
																style={{ cursor: 'pointer', color: 'red', fontSize: '14px' }}>
																Delete
															</a>
														</div>
													</div>
												</div>
											))
										)}
									</div>
									<div className='separator mb-4'></div>
									<form className='mb-6 row'>
										<div className='col-md-10'>
											<textarea
												className='form-control px-3'
												name='comment'
												rows={1}
												value={commentData[comment._id] || ''}
												onChange={(e) => handleInputCommentChange(e, comment._id)}
												placeholder='Reply..'></textarea>
										</div>

										<div className='col-md-2 mt-md-0 mt-3'>
											<TableButton
												action='add'
												onClick={() => handleAddButtonClick(comment._id)}
												text={isSubmitting[comment._id] ? 'Sending...' : 'Send'}
												showIcon={false}
												disabled={isSubmitting[comment._id]}
												className={`btn-block mb-4 w-100 ${isSubmitting[comment._id] ? 'disabled' : ''
													}`}
											/>
										</div>
									</form>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			<div
				className='modal fade'
				id='kt_modal_exercise'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-600px'>
					<div className='modal-content border-0'>
						<div className='modal-header border-0 justify-content-end'>
							<button
								type='button'
								className='btn-close'
								data-bs-dismiss='modal'
								aria-label='Close'></button>
						</div>
						<div className='text-center mb-4'>
							<img
								src={bookCover}
								alt='Question Mark'
								style={{ width: '80px', height: '80px' }}
							/>
							<h2
								className='fw-bold mt-3'
								style={{ fontSize: '25px' }}>
								Are you sure?
							</h2>
						</div>
						<div className='modal-body p-5'>
							<h3 className='text-center fw-20'>
								This user will be removed from the portal and will no longer access
							</h3>
						</div>
						<div className='modal-footer border-0 d-flex justify-content-center'>
							<button
								className='btn btn-danger me-3 fs-24'
								onClick={() => deleteLecture()}
								style={{ padding: '12px 24px', fontSize: '20px' }}>
								<FontAwesomeIcon
									className='me-2'
									icon={faCheck}
								/>
								Okay
							</button>
							<button
								className='btn btn-success fs-29'
								data-bs-dismiss='modal'
								style={{ padding: '12px 24px', fontSize: '20px' }}>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
			<Modal
				centered
				show={isModalOpen}
				onHide={() => setIsModalOpen(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Edit Reply</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<div>
						<label htmlFor='comment'>Comment</label>
						<textarea
							value={selectedComment?.comment || ''}
							className='form-control mt-4'
							onChange={(e) => setSelectedComment({ ...selectedComment, comment: e.target.value })}
						/>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<button
						className='btn btn-primary me-2'
						onClick={handleUpdateReply}>
						Update
					</button>
					<button
						className='btn btn-secondary'
						onClick={closeModal}>
						Cancel
					</button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
export { LectureView }
