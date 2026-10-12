import { faXmark } from '@fortawesome/free-solid-svg-icons'
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
import { AddFeature, GetFeatures, RemoveFeature, UpdateFeature } from '../../../Functions/FWG'
import TableButton from '../../../components/TableButton'

const Features: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [featuresData, setFeaturesData] = useState([])
	const [show, setShow] = useState(false)
	const [updateShow, setUpdateShow] = useState(false)
	const [updateData, setUpdateData] = useState({
		id: '',
		title: '',
		feature: '',
	})
	const [formData, setFormData] = useState({
		title: '',
		feature: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)

	const handleSetData = (data: any) => {
		setUpdateShow(true)
		setUpdateData(data)
	}

	const fetchData = async () => {
		setLoading(true)
		try {
			const featureResponse: any = await GetFeatures()
			setFeaturesData(featureResponse.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredFeaturesData = featuresData.filter(
		(featuresData: any) =>
			featuresData.title && featuresData.title.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedFeaturesData = filteredFeaturesData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

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
					await RemoveFeature({ id: _id })
					toast.success('feature Deleted Successfully')
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

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleCreateFeature = async () => {
		try {
			setIsSubmitting(true)
			const formDataWith: any = formData
			await AddFeature(formDataWith)
			toast.success('Feature Created Successfully')

			setFormData({
				title: '',
				feature: '',
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
			const payload: { id: string; feature: string; title: string } = {
				id: formDataWith._id,
				feature: formDataWith.feature,
				title: formDataWith.title,
			}
			await UpdateFeature(payload)
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

	return (
		<>
			<PageTitle breadcrumbs={[]}>All Feature Details</PageTitle>
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
									<th>Title</th>
									<th>Feature</th>
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
															{data.title}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.feature}
														</span>
													</td>
													<td>
														<TableButton
															action="edit"
															onClick={() => handleSetData(data)}
														/>
														<TableButton
															action='assign'
															to={'/fwg/feature-view?plan_id=' + data._id}
														/>
														<TableButton
															action="remove"
															onClick={() => handleDeleteFeature(data._id)}
														/>
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
						<h2 className='fw-bolder'>Add Feature</h2>
					</div>
					<InputField
						placeholder='Enter Title'
						type='text'
						className='mb-7 w-100 fv-row'
						name='title'
						label='Food title'
						htmlFor='title'
						value={formData.title}
						onChange={handleInputChange}
					/>
					<SelectField
						className='w-100 fv-row mb-7'
						label='Feature'
						name='feature'
						value={formData.feature}
						onChange={handleInputChange}
						htmlFor='feature'
						options={[
							'E-BOOK',
							'YOUTUBE VIDEOS',
							'VOD CAST',
							'MOTIVATION SONG',
							'DIET PLANS',
							'EXERCISE',
							'STEPS COUNTER',
							'WATER REMINDER',
							'TRAINER BOOK',
							'POST DAILY DIET',
							'POST DAILY EXERCISE',
							'MACRO CALCULATION',
							'DIET KA PITARA',
							'BMI CALCULATOR',
							'BMI REPORT',
							'BMR REPORT',
							'GIVE FEEDBACK',
						]}
					/>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action="add"
							onClick={handleCreateFeature}
							text={isSubmitting ? 'Please wait, creating Feature...' : 'Add Feature'}
							showIcon={false}
							className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</Modal>
			<Modal
				centered
				show={updateShow}
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
				<div className='modal-body scroll-y mx-3 pt-0 pb-15'>
					<div className='text-center mb-13'>
						<h2 className='fw-bolder'>Update Feature</h2>
					</div>
					<InputField
						placeholder='Enter Title'
						type='text'
						className='mb-7 w-100 fv-row'
						name='title'
						label='Enter Food title'
						htmlFor='title'
						value={updateData.title}
						onChange={handleInputUpdateChange}
					/>
					<SelectField
						className='w-100 fv-row mb-7'
						label='Feature'
						name='feature'
						value={updateData.feature}
						onChange={handleInputUpdateChange}
						htmlFor='feature'
						options={[
							'E-BOOK',
							'YOUTUBE VIDEOS',
							'VOD CAST',
							'MOTIVATION SONG',
							'DIET PLANS',
							'EXERCISE',
							'STEPS COUNTER',
							'WATER REMINDER',
							'TRAINER BOOK',
							'POST DAILY DIET',
							'POST DAILY EXERCISE',
							'MACRO CALCULATION',
							'DIET KA PITARA',
							'BMI CALCULATOR',
							'BMI REPORT',
							'BMR REPORT',
							'GIVE FEEDBACK',
						]}
					/>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action="edit"
							onClick={() => handleUpdateData()}
							backgroundDark={true}
							text={isSubmitting ? 'Please wait, Updating Feature...' : 'Update Feature'}
							showIcon={false}
							className={`mb-4 w-100 btn-block`}
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default Features
