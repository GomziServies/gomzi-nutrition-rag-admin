import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import {
	CreateExercisePlan,
	GetExercisePlan,
	RemoveExercisePlan,
	UpdateExercisePlan,
} from '../../../Functions/FWG'
import SearchFilter from '../../../components/SearchFilter'

const ExercisePlan: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [userData, setUserData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [formData, setFormData] = useState({
		plan_name: '',
		live_meeting_link: '',
		time_slot: '',
		description: '',
	})
	const [updateData, setUpdateData] = useState({
		_id: '',
		plan_name: '',
		live_meeting_link: '',
		time_slot: '',
		description: '',
	})
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleUpdateInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const fetchUserData = async (page?: number) => {
		setLoading(true)
		try {
			const portalInfo = localStorage.getItem('portal_info')

			let adminInfo: any = null
			let response: any

			if (portalInfo) {
				adminInfo = JSON.parse(portalInfo)
				response = await GetExercisePlan({
					page: page || pagination.page,
					limit: pagination.itemsPerPage,
					search: searchTerm,
					// createdById: adminInfo._id,
					sort,
					sortOrder,
				})
			} else {
				response = await GetExercisePlan({
					page: page || pagination.page,
					limit: pagination.itemsPerPage,
					search: searchTerm,
					sort,
					sortOrder,
				})
			}

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			const filteredData: any = response.data
			setUserData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
	}

	useEffect(() => {
		fetchUserData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchUserData()
		}
	}, [searchTerm])

	const handleAddExercisePlan = async () => {
		try {
			setIsSubmitting(true)

			const formDataWith: any = formData
			const payload: any = {
				plan_name: formDataWith.plan_name,
				description: formDataWith.description,
				time_slot: formDataWith.time_slot,
				live_meeting_link: formDataWith.live_meeting_link,
			}
			await CreateExercisePlan(payload)
			toast.success('Exercise Plan Created Successfully')
			setShowModal(false)
			setFormData({
				plan_name: '',
				live_meeting_link: '',
				time_slot: '',
				description: '',
			})
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
		fetchUserData()
	}

	const handleUpdateExercisePlan = async () => {
		try {
			setIsSubmitting(true)
			const payload: any = {
				plan_id: updateData._id,
				plan_name: updateData.plan_name,
				description: updateData.description,
				time_slot: updateData.time_slot,
				live_meeting_link: updateData.live_meeting_link,
			}
			await UpdateExercisePlan(payload)

			toast.success('Exercise Plan Updated Successfully')
			setShowUpdateModal(false)
			setUpdateData({
				_id: '',
				plan_name: '',
				live_meeting_link: '',
				time_slot: '',
				description: '',
			})
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
		fetchUserData()
	}

	const handleOpenEdit = (data: any) => {
		setShowUpdateModal(true)
		setUpdateData(data)
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
					await RemoveExercisePlan({ plan_id: _id })
					toast.success('Bundle Deleted Successfully')
					fetchUserData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const sortableFields = [
		{ title: 'Exercise Name', field: 'plan_name' },
		{ title: 'Description', field: 'description' },
		{ title: 'Time', field: 'time_slot' },
		{ title: 'Meeting Link', field: 'live_meeting_link' },
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
			<PageTitle breadcrumbs={[]}>Exercise plan Details</PageTitle>
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
							onClick={() => setShowModal(true)}
							text='Create Plan'
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
									userData.map((plan_exercise: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{plan_exercise.plan_name || 'N/A'}
													</span>
												</td>
												<td>
													<span
														className='text-dark fw-bold  d-md-block d-none mb-1 fs-6'
														onClick={() => toggleDescription(index)}
														title={plan_exercise.description}
														style={{ cursor: 'pointer' }}>
														{expandedDescription[index]
															? plan_exercise.description
															: truncateString(plan_exercise.description, 50)}
													</span>
													<span
														className='text-dark fw-bold  d-md-none d-block mb-1 fs-6'
														style={{ cursor: 'pointer' }}
														title={plan_exercise.description}
														onClick={() => toggleDescription(index)}>
														{expandedDescription[index]
															? plan_exercise.description
															: truncateString(plan_exercise.description, 20)}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{plan_exercise.time_slot || 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{plan_exercise.live_meeting_link || 'N/A'}
													</span>
												</td>
												<td>
													<div className='d-flex'>
														<TableButton
															action='assign'
															text='Assign'
															className='d-flex'
															to={'/fwg/exercise-bundle-assign?plan_id=' + plan_exercise._id}
														/>

														<TableButton
															action='edit'
															onClick={() => handleOpenEdit(plan_exercise)}
														/>

														<TableButton
															action='view'
															to={'/fwg/add-exercise-plan?exercise_plan_id=' + plan_exercise._id}
														/>

														<TableButton
															action='remove'
															onClick={() => RemoveHandleExercise(plan_exercise._id)}
														/>
													</div>
													<div className='d-flex'></div>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{userData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{userData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
			{/* Add Plan */}
			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(false)}>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y mx-3 pt-0 pb-15'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Exercise Plan</h2>
						</div>
						<div>
							<div className='mb-5'>
								<InputField
									placeholder='Enter Plan Name'
									type='text'
									className='mb-7 w-100 fv-row'
									name='plan_name'
									label='Plan Name'
									htmlFor='plan_name'
									value={formData.plan_name}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='Enter Description'
									type='text'
									className='mb-7 w-100 fv-row'
									name='description'
									label='Description'
									htmlFor='description'
									value={formData.description}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='Enter Time Slot'
									type='time'
									className='mb-7 w-100 fv-row'
									name='time_slot'
									label='Time Slot'
									htmlFor='time_slot'
									value={formData.time_slot}
									onChange={handleInputChange}
								/>
								<InputField
									placeholder='Enter Meeting Link'
									type='text'
									className='mb-7 w-100 fv-row'
									name='live_meeting_link'
									label='Meeting Link'
									htmlFor='live_meeting_link'
									value={formData.live_meeting_link}
									onChange={handleInputChange}
								/>
							</div>
						</div>
						<div className='mt-7 d-flex justify-content-center'>
							<TableButton
								action='add'
								onClick={() => handleAddExercisePlan()}
								text={isSubmitting ? 'Please wait, Adding Exercise Plan...' : 'Add Exercise Plan'}
								showIcon={false}
								disabled={isSubmitting}
								className={`btn-block text-center mb-4 w-50 ${isSubmitting ? 'disabled' : ''}`}
							/>
						</div>
					</div>
				</div>
			</Modal>
			{/* Update Plan  */}
			<Modal
				centered
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowUpdateModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y mx-3 pt-0 pb-15'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Update Exercise Plan</h2>
						</div>
						<div>
							<div className='mb-5'>
								<InputField
									placeholder='Enter Plan Name'
									type='text'
									className='mb-7 w-100 fv-row'
									name='plan_name'
									label='Plan Name'
									htmlFor='plan_name'
									value={updateData.plan_name}
									onChange={handleUpdateInputChange}
								/>
								<InputField
									placeholder='Enter Description'
									type='text'
									className='mb-7 w-100 fv-row'
									name='description'
									label='Description'
									htmlFor='description'
									value={updateData.description}
									onChange={handleUpdateInputChange}
								/>
								<InputField
									placeholder='Enter Time Slot'
									type='time'
									className='mb-7 w-100 fv-row'
									name='time_slot'
									label='Time Slot'
									htmlFor='time_slot'
									value={updateData.time_slot}
									onChange={handleUpdateInputChange}
								/>
								<InputField
									placeholder='Enter Meeting Link'
									type='text'
									className='mb-7 w-100 fv-row'
									name='live_meeting_link'
									label='Meeting Link'
									htmlFor='live_meeting_link'
									value={updateData.live_meeting_link}
									onChange={handleUpdateInputChange}
								/>
							</div>
						</div>
						<div className='mt-7 text-center'>
							<TableButton
								action='edit'
								onClick={() => handleUpdateExercisePlan()}
								text={
									isSubmitting ? 'Please wait, Updating Exercise Plan...' : 'Update Exercise Plan'
								}
								showIcon={false}
								backgroundDark={true}
								disabled={isSubmitting}
								className={`btn-block text-center mb-4 w-50 ${isSubmitting ? 'disabled' : ''}`}
							/>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default ExercisePlan
