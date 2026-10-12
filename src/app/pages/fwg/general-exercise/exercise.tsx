/* eslint-disable jsx-a11y/anchor-is-valid */
import { faEye, faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import ReactPlayer from 'react-player/youtube'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TextareaField from '../../../components/TextareaField'
import {
	AddExercise,
	FileUploadToFWG,
	GetExercise,
	RemoveExercise,
	UpdateExercise,
} from '../../../Functions/FWG'

const Exercise: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const exercise_id = searchParams.get('exercise_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [featuresData, setFeaturesData] = useState([])
	const [videoData, setVideoData] = useState<any>('')
	const [show, setShow] = useState(false)
	const [updateShow, setUpdateShow] = useState(false)
	const [videoModal, setVideoModal] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [updateData, setUpdateData] = useState({
		id: '',
		title: '',
		video_url: '',
		image_url: '',
		description: '',
		calories_burn: '',
		feedback: {
			reps: false,
			set: true,
			weight: true,
		},
		selectedFile: null as File | null,
	})
	const [formData, setFormData] = useState({
		title: '',
		video_url: '',
		image_url: '',
		description: '',
		calories_burn: '',
		feedback_weight: false,
		feedback_sets: false,
		feedback_reps: false,
		profile_image: '',
		selectedFile: null as File | null,
	})

	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleSetData = (data: any) => {
		setUpdateShow(true)
		setUpdateData(data)
	}

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const skip = (pagination.page - 1) * pagination.itemsPerPage
			const exerciseResponse: any = await GetExercise({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			const metaData: any = exerciseResponse.metadata
			setMetaData(metaData.pagination)
			const filteredData: any = exerciseResponse.data
			setFeaturesData(filteredData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleVideo = (video_url: string) => {
		setVideoData(video_url)
		setVideoModal(true)
	}

	const RemoveHandleExercise = async (_id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveExercise({ id: _id })
					toast.success('Exercise Deleted Successfully')
					fetchData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value, type } = event.target

		if (type === 'checkbox') {
			const checkboxValue = (event.target as HTMLInputElement).checked
			setFormData((prevData) => ({
				...prevData,
				[name]: checkboxValue,
			}))
		} else if (
			id === 'fileInput' &&
			event.target instanceof HTMLInputElement &&
			event.target.files
		) {
			const file = event.target.files[0]
			setFormData((prevData) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}))
		} else {
			setFormData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const fetchCourseDataById = async (id: string) => {
		setLoading(true)
		try {
			const response: any = await GetExercise({ id })
			setUpdateData(response.data[0])
			setLoading(false)
			setUpdateShow(true)
		} catch (error) {
			console.error(error)
			setLoading(false)
		}
	}

	useEffect(() => {
		if (exercise_id) {
			fetchCourseDataById(exercise_id)
		}
	}, [exercise_id])

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleNotesUpdate = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value, type } = event.target

		if (type === 'checkbox') {
			const checkboxValue = (event.target as HTMLInputElement).checked
			setUpdateData((prevData) => ({
				...prevData,
				[name]: checkboxValue,
			}))
		} else if (
			id === 'fileInput' &&
			event.target instanceof HTMLInputElement &&
			event.target.files
		) {
			const file = event.target.files[0]
			setUpdateData((prevData) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}))
		} else {
			setUpdateData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleCreateExercise = async () => {
		try {
			let img_url = ''
			setIsSubmitting(true)
			const imageUrl: any = await FileUploadToFWG([formData.selectedFile], {
				directory: 'documents',
			})
			img_url = imageUrl.data?.fileURLs[0]
			toast.success('Image uploaded successfully')

			const formDataWith: any = formData
			const payload: any = {
				id: formDataWith._id,
				title: formDataWith.title,
				video_url: formDataWith.video_url,
				image_url: img_url,
				description: formDataWith.description,
				calories_burn: Number(formDataWith.calories_burn),
				feedback_weight: formDataWith.feedback_weight,
				feedback_sets: formDataWith.feedback_sets,
				feedback_reps: formDataWith.feedback_reps,
			}
			await AddExercise(payload)
			toast.success('Exercise Created Successfully')

			setFormData({
				title: '',
				video_url: '',
				image_url: '',
				description: '',
				calories_burn: '',
				feedback_weight: false,
				feedback_sets: false,
				feedback_reps: false,
				profile_image: '',
				selectedFile: null as File | null,
			})
			setIsSubmitting(false)
			setShow(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
		fetchData()
	}

	const handleUpdateData = async () => {
		try {
			let img_url = ''
			setIsSubmitting(true)

			if (updateData.selectedFile) {
				const imageUrl: any = await FileUploadToFWG([updateData.selectedFile], {
					directory: 'documents',
				})
				img_url = imageUrl.data?.fileURLs[0]
				toast.success('Image uploaded successfully')
			}

			const formDataWith: any = updateData
			const payload: any = {
				id: formDataWith._id,
				title: formDataWith.title,
				video_url: formDataWith.video_url,
				description: formDataWith.description,
				image_url: img_url,
				calories_burn: Number(formDataWith.calories_burn),
				feedback: {
					weight: formDataWith.feedback_weight,
					reps: formDataWith.feedback_reps,
					set: formDataWith.feedback_sets,
				},
			}

			await UpdateExercise(payload)
			toast.success('Exercise Update Successfully')
			setIsSubmitting(false)
			setUpdateShow(false)
			fetchData()
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const isYouTubeURL = (url: string): boolean => {
		const youtubeRegex =
			/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/).+$/
		return youtubeRegex.test(url)
	}

	const sortableFields = [
		{ title: 'Exercise Name', field: 'title' },
		{ title: 'Image', field: 'image_url' },
		{ title: 'Description', field: 'description' },
		{ title: 'Calories Burn', field: 'calories_burn' },
		{ title: 'Video', field: 'video_url' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const [expandedDescription, setExpandedDescription] = useState<{ [key: number]: boolean }>({})

	const toggleDescription = (index: number) => {
		setExpandedDescription((prevState) => ({
			...prevState,
			[index]: !prevState[index],
		}))
	}

	const truncateString = (str: any, num: any) => {
		if (!str || typeof str !== 'string') {
			return ''
		}
		if (str.length <= num) {
			return str
		}
		return str.slice(0, num) + '...'
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Exercise Details</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							onClick={() => setShow(true)}
							text='Add'
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={featuresData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							disableSortFields={['image_url']}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={data._id}>
									<tr
										onClick={() => handleRowClick(data._id)}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{data.title}</span>
										</td>
										<td>
											<span className='d-inline-block align-middle'>
												<img
													src={data.image_url}
													alt={data.title}
													className='fs-3 text-primary'
													style={{ width: '55px', height: '55px', borderRadius: '20%' }}
												/>
											</span>
										</td>
										<td>
											<span
												className='text-dark fw-bold  d-md-block d-none mb-1 fs-6'
												onClick={() => toggleDescription(index)}
												title={data.description}
												style={{ cursor: 'pointer' }}>
												{expandedDescription[index]
													? data.description
													: truncateString(data.description, 100)}
											</span>
											<span
												className='text-dark fw-bold  d-md-none d-block mb-1 fs-6'
												style={{ cursor: 'pointer' }}
												title={data.description}
												onClick={() => toggleDescription(index)}>
												{expandedDescription[index]
													? data.description
													: truncateString(data.description, 20)}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{data.calories_burn}
											</span>
										</td>
										<td>
											<button
												className='btn gap-2 btn-light-success mx-2 btn-sm me-1'
												onClick={() => handleVideo(data.video_url)}>
												<FontAwesomeIcon
													icon={faEye}
													className='fs-3'
												/>{' '}
												View Video
											</button>
										</td>
										<td>
											{/* Actions */}
											<div className='d-flex'>
												<TableButton
													action='edit'
													onClick={() => handleSetData(data)}
												/>

												<TableButton
													action='remove'
													onClick={() => RemoveHandleExercise(data._id)}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong> {data.title}
													<br />
													<strong>{sortableFields[1].title}: </strong>{' '}
													<img
														src={data.image_url}
														alt={data.title}
														className='fs-3 text-primary'
														style={{ width: '55px', height: '55px', borderRadius: '20%' }}
													/>
													<br />
													<strong>{sortableFields[2].title}: </strong> {data.description}
													<br />
													<strong>{sortableFields[3].title}: </strong> {data.calories_burn}
													<br />
													<strong>{sortableFields[4].title}: </strong>{' '}
													<button
														className='btn gap-2 btn-light-success mx-2 btn-sm me-1'
														onClick={() => handleVideo(data.video_url)}>
														<FontAwesomeIcon
															icon={faEye}
															className='fs-3'
														/>{' '}
														View Video
													</button>
													<br />
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{featuresData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{featuresData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			{/* Food  Time add Modal*/}
			<Modal
				centered
				size='lg'
				show={show}
				onHide={() => setShow(false)}>
				<div className='modal-header justify-content-between'>
					<h2 className='fw-bolder'>Add Exercise</h2>
					<button
						className='btn btn-sm btn-icon btn-active-color-primary'
						onClick={() => setShow(false)}>
						<FontAwesomeIcon
							className='fs-1 position-absolute ms-3'
							icon={faXmark}
						/>
					</button>
				</div>
				<div className='modal-body scroll-y'>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Enter Title'
							type='text'
							className='mb-7 w-100 fv-row'
							name='title'
							label='Exercise Name'
							htmlFor='title'
							value={formData.title}
							onChange={handleInputChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Enter YouTube Video URL'
							type='text'
							className='mb-7 w-100 fv-row'
							name='video_url'
							label='YouTube Video URL'
							htmlFor='YouTube Video URL'
							value={formData.video_url}
							onChange={handleInputChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Enter Calories Burn'
							type='number'
							className='mb-7 w-100 fv-row'
							name='calories_burn'
							label='Calories Burn'
							htmlFor='Calories Burn'
							value={formData.calories_burn}
							onChange={handleInputChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<TextareaField
							className='mb-7 w-100 fv-row'
							label='Description'
							placeholder='Write Description'
							name='description'
							htmlFor='description'
							value={formData.description}
							onChange={handleNotesChange}
						/>
					</div>
					<div
						className='checkbox-flex'
						style={{ display: 'flex' }}>
						<div
							className='fv-row mb-7'
							style={{ width: '33.33%' }}>
							<label
								htmlFor='dfsf'
								className='fw-bold fs-6 mb-5'>
								Feedback Weight
							</label>
							<div className='form-check'>
								<input
									type='checkbox'
									id='feedback_weight_checkbox'
									name='feedback_weight'
									className='form-check-input'
									checked={formData.feedback_weight}
									onChange={handleInputChange}
								/>
								<label
									htmlFor='feedback_weight_checkbox'
									className='form-check-label'>
									feedback weight
								</label>
							</div>
						</div>
						<div
							className='fv-row mb-7'
							style={{ width: '33.33%' }}>
							<label
								htmlFor='dfsf'
								className='fw-bold fs-6 mb-5'>
								Feedback Sets
							</label>
							<div className='form-check'>
								<input
									type='checkbox'
									id='feedback_sets_checkbox'
									name='feedback_sets'
									className='form-check-input'
									checked={formData.feedback_sets}
									onChange={handleInputChange}
								/>
								<label
									htmlFor='feedback_sets_checkbox'
									className='form-check-label'>
									feedback sets
								</label>
							</div>
						</div>
						<div
							className='fv-row mb-7'
							style={{ width: '33.33%' }}>
							<label
								htmlFor='dfsf'
								className='fw-bold fs-6 mb-5'>
								Feedback Reps
							</label>
							<div className='form-check'>
								<input
									type='checkbox'
									id='feedback_reps_checkbox'
									name='feedback_reps'
									className='form-check-input'
									checked={formData.feedback_reps}
									onChange={handleInputChange}
								/>
								<label
									htmlFor='feedback_reps_checkbox'
									className='form-check-label'>
									feedback reps
								</label>
							</div>
						</div>
					</div>
					<div className='fv-row mb-7'>
						<label
							htmlFor='dfsf'
							className='fw-bold fs-6 mb-5'>
							Image
						</label>
						<input
							type='file'
							name='image'
							accept='image/*'
							className='form-control form-control-solid mb-3 mb-lg-0'
							autoComplete='off'
							id='fileInput'
							onChange={handleInputChange}
						/>
						<span style={{ fontSize: '12px', color: '#6e707e' }}>Max file size: 100KB</span>
					</div>
				</div>
				<div className='modal-footer justify-content-end'>
					<TableButton
						action='add'
						onClick={handleCreateExercise}
						text={isSubmitting ? 'Please wait, creating Exercise...' : 'Add Exercise'}
						showIcon={false}
						disabled={isSubmitting}
						className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
					/>
				</div>
			</Modal>

			{/* Update Exercise */}
			<Modal
				centered
				size='lg'
				show={updateShow}
				onHide={() => setUpdateShow(false)}>
				<div className='modal-header justify-content-between'>
					<h2 className='fw-bolder'>Edit Exercise</h2>
					<button
						className='btn btn-sm btn-icon btn-active-color-primary'
						onClick={() => setUpdateShow(false)}>
						<FontAwesomeIcon
							className='fs-1 position-absolute ms-3'
							icon={faXmark}
						/>
					</button>
				</div>
				<div className='modal-body scroll-y'>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Enter Title'
							type='text'
							className='mb-7 w-100 fv-row'
							name='title'
							label='Exercise Name'
							htmlFor='title'
							value={updateData.title}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Enter YouTube Video URL'
							type='text'
							className='mb-7 w-100 fv-row'
							name='video_url'
							label='YouTube Video URL'
							htmlFor='YouTube Video URL'
							value={updateData.video_url}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Enter Calories Burn'
							type='number'
							className='mb-7 w-100 fv-row'
							name='calories_burn'
							label='Calories Burn'
							htmlFor='Calories Burn'
							value={updateData.calories_burn}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<TextareaField
							className='mb-7 w-100 fv-row'
							label='Description'
							placeholder='Write Description'
							name='description'
							htmlFor='description'
							value={updateData.description}
							onChange={handleNotesUpdate}
						/>
					</div>
					<div
						className='checkbox-flex'
						style={{ display: 'flex' }}>
						<div
							className='fv-row mb-7'
							style={{ width: '33.33%' }}>
							<label
								htmlFor='dfsf'
								className='fw-bold fs-6 mb-5'>
								Feedback Weight
							</label>
							<div className='form-check'>
								<input
									type='checkbox'
									id='feedback_weight_checkbox'
									name='weight'
									className='form-check-input'
									checked={updateData.feedback?.weight}
									onChange={handleInputUpdateChange}
								/>
								<label
									htmlFor='feedback_weight_checkbox'
									className='form-check-label'>
									feedback weight
								</label>
							</div>
						</div>
						<div
							className='fv-row mb-7'
							style={{ width: '33.33%' }}>
							<label
								htmlFor='dfsf'
								className='fw-bold fs-6 mb-5'>
								Feedback Sets
							</label>
							<div className='form-check'>
								<input
									type='checkbox'
									id='feedback_sets_checkbox'
									name='set'
									className='form-check-input'
									checked={updateData.feedback?.set}
									onChange={handleInputChange}
								/>
								<label
									htmlFor='feedback_sets_checkbox'
									className='form-check-label'>
									feedback sets
								</label>
							</div>
						</div>
						<div
							className='fv-row mb-7'
							style={{ width: '33.33%' }}>
							<label
								htmlFor='dfsf'
								className='fw-bold fs-6 mb-5'>
								Feedback Reps
							</label>
							<div className='form-check'>
								<input
									type='checkbox'
									id='feedback_reps_checkbox'
									name='reps'
									className='form-check-input'
									checked={updateData.feedback?.reps}
									onChange={handleInputUpdateChange}
								/>
								<label
									htmlFor='feedback_reps_checkbox'
									className='form-check-label'>
									feedback reps
								</label>
							</div>
						</div>
					</div>
					<div className='fv-row mb-7'>
						<label
							htmlFor='dfsf'
							className='fw-bold fs-6 mb-5'>
							Image
						</label>
						<input
							type='file'
							name='image'
							accept='image/*'
							className='form-control form-control-solid mb-3 mb-lg-0'
							autoComplete='off'
							id='fileInput'
							onChange={handleInputUpdateChange}
						/>
						<span style={{ fontSize: '12px', color: '#6e707e' }}>Max file size: 100KB</span>
					</div>
				</div>
				<div className='modal-footer justify-content-end'>
					<TableButton
						action='edit'
						onClick={() => handleUpdateData()}
						text={isSubmitting ? 'Please wait, Updating Exercise...' : 'Update Exercise'}
						showIcon={false}
						disabled={isSubmitting}
						backgroundDark={true}
						className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
					/>
				</div>
			</Modal>

			{/* Video Modal */}
			<Modal
				centered
				show={videoModal}
				onHide={() => setVideoModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Video</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setVideoModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='p-4'>
						{isYouTubeURL(videoData) ? (
							<ReactPlayer
								url={videoData}
								width={'100%'}
							/>
						) : (
							<p className='text-center fs-2 mb-0 p-3'>Video not found</p>
						)}
					</div>
				</div>
			</Modal>
		</>
	)
}

export default Exercise
