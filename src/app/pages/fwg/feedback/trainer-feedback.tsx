import { faStar, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import UsersListPagination from '../../../components/TablePagination'
import { AddFeature, GetFeatures, GetUser, RemoveFeature, UpdateFeature } from '../../../Functions/FWG'
import TableButton from '../../../components/TableButton'

const TrainerFeedback: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [TrainerFeedbackData, setTrainerFeedbackData] = useState([])
	const [UserData, setUserData] = useState([])
	const [show, setShow] = useState(false)
	const [formData, setFormData] = useState({
		user: '',
		feedback: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async () => {
		setLoading(true)
		try {
			const trainerFeedbackResponse: any = await GetFeatures()
			setTrainerFeedbackData(trainerFeedbackResponse.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchUserData = async () => {
		setLoading(true)
		try {
			const response: any = await GetUser()
			const userResponseData = response.data.map((el: any) => `${el.firstName} ${el.lastName}`)
			setUserData(userResponseData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
		fetchUserData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredTrainerFeedbackData = TrainerFeedbackData.filter(
		(TrainerFeedbackData: any) =>
			TrainerFeedbackData.title && TrainerFeedbackData.title.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedTrainerFeedbackData = filteredTrainerFeedbackData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleDeleteTrainerFeedback = async (_id: string) => {
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
					await RemoveFeature({ id: _id })
					toast.success('User Feedback Deleted Successfully')
					fetchData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleCreateTrainerFeedback = async () => {
		try {
			setIsSubmitting(true)
			const formDataWith: any = formData
			await AddFeature(formDataWith)
			toast.success('User Feedback Created Successfully')

			setFormData({
				user: '',
				feedback: '',
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

	return (
		<>
			<PageTitle breadcrumbs={[]}>Trainer Feedback</PageTitle>
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
							action="add"
							onClick={() => setShow(true)}
							text='Add'
							backgroundDark={true}
						/>
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
									<th>Trainer</th>
									<th>User</th>
									<th>Trainer Feedback</th>
									<th>Rating</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
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
									paginatedTrainerFeedbackData
										.slice()
										.reverse()
										.map((data: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											return (
												<tr key={actualIndex}>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{actualIndex}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.feature}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.title}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.feature}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															<FontAwesomeIcon
																icon={faStar}
																className='text-warning fs-2'
															/>
															<FontAwesomeIcon
																icon={faStar}
																className='text-warning fs-2'
															/>
															<FontAwesomeIcon
																icon={faStar}
																className='text-warning fs-2'
															/>
															<FontAwesomeIcon
																icon={faStar}
																className='text-warning fs-2'
															/>
															<FontAwesomeIcon
																icon={faStar}
																className='text-warning fs-2'
															/>
														</span>
													</td>
													<td>
														<TableButton
															action='view'
															to={`/fwg/food-bundle-item?bundle_id=${data._id}`}
														/>
													</td>
												</tr>
											)
										})
								)}
							</tbody>
						</table>
					</div>
					{paginatedTrainerFeedbackData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedTrainerFeedbackData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(TrainerFeedbackData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

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
				<div className='modal-body scroll-y mx-3 pt-0 pb-15'>
					<div className='text-center mb-13'>
						<h2 className='fw-bolder'>Add Feedback</h2>
					</div>
					<SelectField
						className='w-100 fv-row mb-7'
						label='User'
						name='user'
						value={formData.user}
						onChange={handleInputChange}
						htmlFor='user'
						options={UserData}
					/>
					<InputField
						placeholder='Feedback'
						type='text'
						className='mb-7 w-100 fv-row'
						name='feedback'
						label='Feedback'
						htmlFor='feedback'
						value={formData.feedback}
						onChange={handleInputChange}
					/>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action="add"
							onClick={handleCreateTrainerFeedback}
							text={isSubmitting ? 'Please wait, creating Feedback...' : 'Add Feedback'}
							showIcon={false}
							className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default TrainerFeedback
