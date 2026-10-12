import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { MultiSelect } from 'react-multi-select-component'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { AddLecture, FileUploadToFGGroup, GetFitnessCourse } from '../../../Functions/FGGroup'
import tumbnailImage from './fwg-logo.png'

const LecturesAdd = () => {
	const navigate = useNavigate()
	const [courseData, setCourseData] = useState<any>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [pdfFile, setPdfFile] = useState<string | null>(null)
	const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null)
	const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
	const [lectureAddData, setLectureAddData] = useState({
		thumbnail_image: '',
		title: '',
		lecture_index: '',
		video_url: '',
		description: '',
		related_courses: [],
		pdf_files: '',
		editImage: false,
		selectedFile: null as File | null,
	})

	const fetchUserData = async () => {
	try {
		const response = await GetFitnessCourse()
		let filteredData: any = response.data

		// Filter karo only (International) or Flexible Learning vala courses
		filteredData = filteredData.filter(
			(course: any) =>
				course.coaching_mode === 'VIRTUAL' &&
				(course.course_name.includes('(International)') ||
					course.course_name.includes('Flexible Learning'))
		)

		// Map kari dropdown format ma convert karo
		filteredData = filteredData.map((course: any) => {
			return {
				value: course._id,
				label: `${course?.course_name} - ${course?.course_category}`,
				id: course._id,
			}
		})

		setCourseData(filteredData)
	} catch (error) {
		console.error(error)
	}
}


	const handleAddButtonClick = async () => {
		if (
			!lectureAddData.title ||
			!lectureAddData.lecture_index ||
			!lectureAddData.video_url ||
			!lectureAddData.description ||
			!lectureAddData.related_courses
		) {
			toast.error('All Fields Required')
			return
		}

		try {
			setIsSubmitting(true)

			let imgUrl = ''
			if (selectedThumbnailFile) {
				const imageUrl: any = await FileUploadToFGGroup([selectedThumbnailFile], {
					directory: 'lecture',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Lecture cover uploaded successfully')
			}

			let pdf_Files = ''
			if (selectedPdfFile) {
				const pdfFiles: any = await FileUploadToFGGroup([selectedPdfFile], {
					directory: 'lecture',
				})
				pdf_Files = pdfFiles.data?.fileURLs[0]
				toast.success('Lecture PDF uploaded successfully')
			}

			const courses = lectureAddData.related_courses.map((course: any) => course.value)

			const payload: any = {
				thumbnail_image: imgUrl,
				title: lectureAddData.title,
				lecture_index: parseInt(lectureAddData.lecture_index),
				video_url: lectureAddData.video_url,
				description: lectureAddData.description,
				related_courses: courses,
				pdf_files: pdf_Files,
			}

			await AddLecture(payload)

			toast.success('Lecture Created Successfully')
			setIsSubmitting(false)

			navigate('/fgiit/lectures')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
	}, [])

	useEffect(() => {
		return () => {
			if (lectureAddData.thumbnail_image) {
				URL.revokeObjectURL(lectureAddData.thumbnail_image)
			}
			if (lectureAddData.pdf_files) {
				URL.revokeObjectURL(lectureAddData.pdf_files)
			}
		}
	}, [lectureAddData.thumbnail_image, lectureAddData.pdf_files])

	const handleInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setSelectedThumbnailFile(file)
			setLectureAddData((prevData) => ({
				...prevData,
				thumbnail_image: URL.createObjectURL(file),
				editImage: true,
			}))
			toast.success('Thumbnail image updated successfully')
		} else {
			setLectureAddData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handlePdfInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.id === 'filePdfInput' && event.target.files) {
			const file = event.target.files[0]
			setSelectedPdfFile(file)
			setLectureAddData((prevData) => ({
				...prevData,
				pdf_files: URL.createObjectURL(file),
			}))
			setPdfFile(URL.createObjectURL(file))
			toast.success('PDF file updated successfully')
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handlePdfButtonClick = () => {
		const fileInput = document.getElementById('filePdfInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handleMultiSelectChange = (selected: any) => {
		setLectureAddData((prevData) => ({
			...prevData,
			related_courses: selected,
		}))
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Lecture View</PageTitle>
			<>
				<div className='row'>
					<div className='col-12 mt-3'>
						<div className='card py-10'>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-2 text-center'>
										<img
											alt='Photos'
											src={lectureAddData.thumbnail_image || tumbnailImage}
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
										<div className='row justify-content-end'>
											<div className='col-12'>
												<div className='row'>
													<div className='col-md-6 fv-row mb-7'>
														<InputField
															placeholder='Title'
															type='text'
															className='col-12 fv-row mb-7'
															name='title'
															label='Title'
															htmlFor='title'
															value={lectureAddData.title}
															onChange={(e) => handleInputChange(e)}
														/>
													</div>
													<div className='col-md-6 fv-row mb-7'>
														<InputField
															placeholder='Lecture Index'
															type='text'
															className='col-12 fv-row mb-7'
															name='lecture_index'
															label='Lecture Index'
															htmlFor='lecture_index'
															value={`${lectureAddData.lecture_index}`}
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
															value={lectureAddData.video_url}
															onChange={(e) => handleInputChange(e)}
														/>
													</div>
													<div className='col-md-6 fv-row mb-7'>
														<TextareaField
															placeholder='Lecture Description'
															className='col-12 fv-row mb-7'
															name='description'
															label='Lecture Description'
															htmlFor='description'
															value={lectureAddData.description}
															onChange={(e) => handleInputChange(e)}
														/>
													</div>
													<div className='col-md-6 fv-row mb-7'>
														<label
															className='required fw-bold fs-6 mb-2'
															htmlFor='Select'>
															Courses
														</label>
														<MultiSelect
															options={courseData}
															value={lectureAddData.related_courses}
															onChange={handleMultiSelectChange}
															labelledBy='Select'
															className='fv-row'
														/>
													</div>
													<div className='col-md-6 fv-row mb-7'>
														<label
															className='fw-bold fs-6 mb-2'
															htmlFor='file_pdf_preview'>
															Update PDF
														</label>
														{pdfFile ? (
															<embed
																src={pdfFile}
																id='file_pdf_preview'
																width='100%'
																height='200px'
																type='application/pdf'
															/>
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
												</div>
											</div>
											<div className='col-md-2 fv-row mt-4 mb-2 d-flex justify-content-end'>
												<TableButton
													action='add'
													onClick={handleAddButtonClick}
													text={isSubmitting ? 'Please wait, Adding Lecture...' : 'Add Lecture'}
													showIcon={false}
													disabled={isSubmitting}
													className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		</>
	)
}
export { LecturesAdd }
