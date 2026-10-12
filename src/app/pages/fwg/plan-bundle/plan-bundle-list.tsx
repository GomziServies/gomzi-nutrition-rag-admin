import { faEye, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TextareaField from '../../../components/TextareaField'
import {
	CreatePlanBundle,
	GetPlanBundle,
	RemovePlanBundle,
	UpdatePlanBundle,
} from '../../../Functions/FWG'

const PlanBundleList: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [featuresData, setFeaturesData] = useState([])
	const [show, setShow] = useState(false)
	const [updateShow, setUpdateShow] = useState(false)
	const [formData, setFormData] = useState({
		plan_title: '',
		plan_description: '',
		videoURL: '',
		plan_type: '',
		amount: '',
	})
	const [loading, setLoading] = useState(false)
	const [updateData, setUpdateData] = useState({
		plan_title: '',
		plan_description: '',
		videoURL: '',
		plan_type: '',
		amount: '',
	})
	const fetchData = async () => {
		setLoading(true)
		try {
			const bundleResponse: any = await GetPlanBundle()
			setFeaturesData(bundleResponse.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSetData = (data: any) => {
		setUpdateShow(true)
		setUpdateData(data)
	}

	const filteredFeaturesData = featuresData.filter(
		(featuresData: any) =>
			featuresData.plan_title &&
			featuresData.plan_title.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedFeaturesData = filteredFeaturesData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleNotesUpdate = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleCreateFeature = async () => {
		try {
			setIsSubmitting(true)
			const payload: any = {
				plan_title: formData.plan_title,
				plan_description: formData.plan_description,
				videoURL: formData.videoURL,
				plan_type: formData.plan_type,
				amount: Number(formData.amount),
			}
			await CreatePlanBundle(payload)

			toast.success('Plan Bundle Updated Successfully')

			setFormData({
				plan_title: '',
				plan_description: '',
				videoURL: '',
				plan_type: '',
				amount: '',
			})
			setIsSubmitting(false)
			setShow(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			setShow(false)
			console.error(error)
		}
		fetchData()
	}

	const handleUpdateData = async () => {
		try {
			setIsSubmitting(true)
			const formDataWith: any = updateData
			const payload: any = {
				id: formDataWith._id,
				plan_title: formDataWith.plan_title,
				plan_description: formDataWith.plan_description,
				videoURL: formDataWith.videoURL,
				plan_type: formDataWith.plan_type,
				amount: Number(formDataWith.amount),
			}
			await UpdatePlanBundle(payload)
			toast.success('Plan-bundle Update Successfully')
			setIsSubmitting(false)
			setUpdateShow(false)
			fetchData()
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleDeleteFeature = async (_id: string) => {
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
					await RemovePlanBundle({ id: _id })
					toast.success('Plan-Bundle Deleted Successfully')
					fetchData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
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
			<PageTitle breadcrumbs={[]}>Plan Bundle Details</PageTitle>
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
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Plan Name</th>
									<th>Description</th>
									<th>YouTube Video</th>
									<th>Plan Type</th>
									<th>Price</th>
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
									paginatedFeaturesData
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
															{data.plan_title}
														</span>
													</td>
													<td>
														<span
															className='text-dark fw-bold  d-md-block d-none mb-1 fs-6'
															onClick={() => toggleDescription(index)}
															style={{ cursor: 'pointer' }}>
															{expandedDescription[index]
																? data.plan_description
																: truncateString(data.plan_description, 200)}
														</span>
														<span
															className='text-dark fw-bold  d-md-none d-block mb-1 fs-6'
															style={{ cursor: 'pointer' }}
															title={data.plan_description}>
															{expandedDescription[index]
																? data.plan_description
																: truncateString(data.plan_description, 40)}
														</span>
													</td>
													<td>
														<button
															className='btn gap-2 btn-light-primary d-flex mx-2 btn-sm me-1'
															data-bs-toggle='modal'
															data-bs-target='#kt_modal_video'>
															<FontAwesomeIcon
																icon={faEye}
																className='fs-3'
															/>{' '}
															View Video
														</button>
													</td>
													<td>
														<span className='badge bg-success text-white px-4 py-2 fw-bold mb-1 fs-6'>
															{data.plan_type}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															₹ {data.amount}
														</span>
													</td>
													<td>
														<div className='d-flex'>
															<TableButton
																action='edit'
																onClick={() => handleSetData(data)}
															/>
															<TableButton
																action='assign'
																to={'/fwg/plan-bundle-view?plan_id=' + data._id}
															/>
															<TableButton
																action='remove'
																onClick={() => handleDeleteFeature(data._id)}
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
					{paginatedFeaturesData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedFeaturesData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(featuresData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
			<Modal
				centered
				size='lg'
				show={show}
				onHide={() => setShow(false)}>
				<div className='modal-header justify-content-between'>
					<h2 className='fw-bolder'>Add Plan Bundle</h2>
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
					<div className='mb-3'>
						<InputField
							placeholder='Plan Name'
							type='text'
							className='mb-7 w-100 fv-row'
							name='plan_title'
							label='Plan Name'
							htmlFor='plan_title'
							value={formData.plan_title}
							onChange={handleInputChange}
						/>
					</div>
					<div className='mb-3'>
						<InputField
							placeholder='Video URL'
							type='text'
							className='mb-7 w-100 fv-row'
							name='videoURL'
							label='Video URL'
							htmlFor='videoURL'
							value={formData.videoURL}
							onChange={handleInputChange}
						/>
					</div>
					<div className='row'>
						<div className='col-md-6'>
							<div className='mb-3'>
								<SelectField
									className='fv-row mb-7'
									label='Plan Type'
									name='plan_type'
									value={formData.plan_type}
									onChange={handleInputChange}
									htmlFor='plan_type'
									options={['PAID', 'FREE']}
								/>
							</div>
						</div>
						<div className='col-md-6'>
							<div className='mb-3'>
								<InputField
									placeholder='Enter Amount'
									type='number'
									className='fv-row  mb-7'
									name='amount'
									label='Amount'
									htmlFor='amount'
									value={formData.amount}
									onChange={handleInputChange}
								/>
							</div>
						</div>
					</div>
					<div className='mb-3'>
						<TextareaField
							className='mb-7 w-100 fv-row'
							label='Description'
							placeholder='Write Description'
							name='plan_description'
							htmlFor='plan_description'
							value={formData.plan_description}
							onChange={handleNotesChange}
						/>
					</div>
					<TableButton
						action='add'
						onClick={handleCreateFeature}
						text={isSubmitting ? 'Please wait, creating Plan Bundle...' : 'Add Plan Bundle'}
						showIcon={false}
						disabled={isSubmitting}
						className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
					/>
				</div>
			</Modal>
			<Modal
				centered
				size='lg'
				show={updateShow}
				onHide={() => setUpdateShow(false)}
				id='kt_modal_exercise_edit'>
				<div className='modal-header justify-content-between'>
					<h2 className='fw-bolder'>Edit Plan Bundle</h2>
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
					<div className='mb-3'>
						<InputField
							placeholder='Plan Name'
							type='text'
							className='mb-7 w-100 fv-row'
							name='plan_title'
							label='Plan Name'
							htmlFor='plan_title'
							value={updateData.plan_title}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='mb-3'>
						<InputField
							placeholder='Video URL'
							type='text'
							className='mb-7 w-100 fv-row'
							name='videoURL'
							label='Video URL'
							htmlFor='videoURL'
							value={updateData.videoURL}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='row'>
						<div className='col-md-6'>
							<div className='mb-3'>
								<SelectField
									className='fv-row mb-7'
									label='Plan Type'
									name='plan_type'
									value={updateData.plan_type}
									onChange={handleInputUpdateChange}
									htmlFor='plan_type'
									options={['PAID', 'FREE']}
								/>
							</div>
						</div>
						<div className='col-md-6'>
							<div className='mb-3'>
								<InputField
									placeholder='Enter Amount'
									type='number'
									className='fv-row  mb-7'
									name='amount'
									label='Amount'
									htmlFor='amount'
									value={updateData.amount}
									onChange={handleInputUpdateChange}
								/>
							</div>
						</div>
					</div>
					<div className='mb-3'>
						<TextareaField
							className='mb-7 w-100 fv-row'
							label='Description'
							placeholder='Write Description'
							name='plan_description'
							htmlFor='plan_description'
							value={updateData.plan_description}
							onChange={handleNotesUpdate}
						/>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='edit'
							onClick={() => handleUpdateData()}
							text={isSubmitting ? 'Please wait, Updating Plan Bundle...' : 'Update Plan Bundle'}
							showIcon={false}
							disabled={isSubmitting}
							backgroundDark={true}
							className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
						/>
					</div>
				</div>
			</Modal>
			<div
				className='modal fade'
				id='kt_modal_video'
				aria-hidden='true'>
				<div className='modal-dialog mw-650px'>
					<div className='modal-content'>
						<div className='modal-header pb-0 border-0 justify-content-end'>
							<div
								className='btn btn-sm btn-icon btn-active-color-primary'
								data-bs-dismiss='modal'>
								<FontAwesomeIcon
									className='fs-1 position-absolute ms-3'
									icon={faXmark}
								/>
							</div>
						</div>
						<div className='modal-body scroll-y mx-2 pt-0 pb-15'>
							<iframe
								width='100%'
								height='350px'
								src='https://www.youtube.com/embed/oD9Pxi6v_pY?si=ZMVWtRVB5EF5HFQq'
								title='YouTube video player'
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'></iframe>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default PlanBundleList
