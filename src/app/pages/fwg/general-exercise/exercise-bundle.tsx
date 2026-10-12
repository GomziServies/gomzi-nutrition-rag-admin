import { faUpRightFromSquare, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import TextareaField from '../../../components/TextareaField'
import {
	CreateExerciseBundle,
	GetExerciseBundle,
	RemoveExerciseBundle,
	UpdateExerciseBundle,
} from '../../../Functions/FWG'

const ExerciseBundle: React.FC = () => {
	const [metaData, setMetaData] = useState<any>()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [exerciseBundle, setExerciseBundle] = useState([])
	const [show, setShow] = useState(false)
	const [updateShow, setUpdateShow] = useState(false)
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [updateData, setUpdateData] = useState({
		id: '',
		title: '',
		description: '',
	})

	const [formData, setFormData] = useState({
		title: '',
		description: '',
	})
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const exerciseResponse: any = await GetExerciseBundle({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			const metaData: any = exerciseResponse.metadata
			setMetaData(metaData.pagination)
			setExerciseBundle(exerciseResponse.data)
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

	const handleDeleteExerciseBundle = async (_id: string) => {
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
					await RemoveExerciseBundle({ id: _id })
					toast.success('Exercise Bundle Deleted Successfully')
					fetchData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const handleSetData = (data: any) => {
		setUpdateShow(true)
		setUpdateData(data)
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleNotesUpdate = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleCreateExercisebundle = async () => {
		try {
			setIsSubmitting(true)
			const formDataWith: any = formData
			const data = await CreateExerciseBundle(formDataWith)
			toast.success('Exercise Bundle Created Successfully')

			setFormData({
				title: '',
				description: '',
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
			setIsSubmitting(true)
			const formDataWith: any = updateData
			const payload: { id: string; description: string; title: string } = {
				id: formDataWith._id,
				description: formDataWith.description,
				title: formDataWith.title,
			}
			await UpdateExerciseBundle(payload)
			toast.success('Exercise-bundle Update Successfully')
			setIsSubmitting(false)
			setUpdateShow(false)
			fetchData()
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const sortableFields = [
		{ title: 'Bundle-Name', field: 'title' },
		{ title: 'Bundle-Item', field: 'item_title' },
		{ title: 'Description', field: 'description' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
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
			<PageTitle breadcrumbs={[]}>Exercise-Bundle Details</PageTitle>
			<div className='card mt-10 pt-5'>
				<div className='card-header border-0'>
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
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<TableSort
								sortableFields={sortableFields}
								sort={sort}
								sortOrder={sortOrder}
								onSortChange={handleSortChange}
								disableSortFields={['item_title']}
							/>
							<tbody className='text-gray-600 fw-bold'>
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
									exerciseBundle
										.slice()
										.reverse()
										.map((data: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											const foodItems = data.bundle_item.map((item: any) => ({
												title: item.exercise_info?.title,
												id: item.exercise_info?._id,
											}))
											return (
												<tr key={actualIndex}>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{actualIndex}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.title}
														</span>
													</td>
													<td className='foobundle-item'>
														<ul>
															{foodItems.map(
																(item: { title: string; id: string }, itemIndex: number) => (
																	<Link
																		key={item.id}
																		to={`/fwg/exercise-details?exercise_id=${item.id}`}
																		className='d-flex'>
																		<FontAwesomeIcon
																			icon={faUpRightFromSquare}
																			className='me-7 fs-5'
																		/>
																		<li className='text-dark fw-bold  mb-1 fs-6'>{item.title}</li>
																	</Link>
																)
															)}
														</ul>
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
														<div className='d-flex'>
															<TableButton
																action='edit'
																onClick={() => handleSetData(data)}
															/>

															<TableButton
																action='view'
																to={'/fwg/exercise-bundle-item?bundle_id=' + data._id}
															/>

															<TableButton
																action='remove'
																onClick={() => handleDeleteExerciseBundle(data._id)}
															/>
														</div>
													</td>
												</tr>
											)
										})
								)}
							</tbody>
						</table>
					</div>
					{exerciseBundle.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{exerciseBundle.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
			<Modal
				centered
				show={show}
				onHide={() => setShow(false)}
				id='kt_modal_exercise_bundle'>
				<div className='modal-header pb-0 border-0 justify-content-end'>
					<button
						className='btn btn-sm btn-icon btn-active-color-primary'
						onClick={() => setShow(false)}>
						<FontAwesomeIcon
							className='fs-1 position-absolute ms-3'
							icon={faXmark}
						/>
					</button>
				</div>
				<div className='modal-body scroll-y mx-3 pt-0 pb-5'>
					<div className='text-center mb-13'>
						<h2 className='mb-3'>Add Exercise-Bundle</h2>
					</div>
					<div>
						<div className='mb-5'>
							<InputField
								placeholder='Enter Bundle Name'
								type='text'
								className='mb-7 w-100 fv-row'
								name='title'
								label='Enter Bundle Name'
								htmlFor='title'
								value={formData.title}
								onChange={handleInputChange}
							/>
						</div>
						<div className='mb-5'>
							<TextareaField
								className='w-100 fv-row'
								label='Description'
								placeholder='Write Description'
								name='description'
								htmlFor='description'
								value={formData.description}
								onChange={handleNotesChange}
							/>
						</div>
					</div>
					<div className='text-center'>
						<TableButton
							action='add'
							onClick={handleCreateExercisebundle}
							text={isSubmitting ? 'Please wait, Save Exercise Bundle...' : 'Add Exercise Bundle'}
							showIcon={false}
							disabled={isSubmitting}
							className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
						/>
					</div>
				</div>
			</Modal>
			<Modal
				show={updateShow}
				centered
				onHide={() => setUpdateShow(false)}
				id='kt_modal_exercise_edit'>
				<div className='modal-header pb-0 border-0 justify-content-end'>
					<button
						className='btn btn-sm btn-icon btn-active-color-primary'
						onClick={() => setUpdateShow(false)}>
						<FontAwesomeIcon
							className='fs-1 position-absolute ms-3'
							icon={faXmark}
						/>
					</button>
				</div>
				<div className='modal-body scroll-y mx-3 pt-0 pb-5'>
					<div className='text-center mb-13'>
						<h2 className='mb-3'>Edit Exercise-Bundle</h2>
					</div>
					<div>
						<div className='mb-5'>
							<InputField
								placeholder='Enter Bundle Name'
								type='text'
								className='mb-7 w-100 fv-row'
								name='title'
								label='Enter Bundle Name'
								htmlFor='title'
								value={updateData.title}
								onChange={handleInputUpdateChange}
							/>
						</div>
						<div className='mb-5'>
							<TextareaField
								className='w-100 fv-row'
								label='Description'
								placeholder='Write Description'
								name='description'
								htmlFor='description'
								value={updateData.description}
								onChange={handleNotesUpdate}
							/>
						</div>
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
						className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
					/>
				</div>
			</Modal>
		</>
	)
}

export default ExerciseBundle
