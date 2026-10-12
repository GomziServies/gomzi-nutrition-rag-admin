import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { AsyncPaginate } from 'react-select-async-paginate'
import Swal from 'sweetalert2'
import { KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { loadExerciseOptions } from '../../../components/LoadExerciseOption'
import SelectField from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	AddExerciseBundleItem,
	GetExercise,
	GetExerciseBundle,
	RemoveExerciseBundleItem,
	UpdateExerciseBundleItem,
} from '../../../Functions/FWG'

type Exercise = {
	_id: string
	exercise: string
	title: string
}

const ExerciseBundleItem: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const bundle_id: string | any = searchParams.get('bundle_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [bundleName, setBundleName] = useState<string>('')
	const [exercise, setExercise] = useState<Exercise[]>([])
	const [exerciseBundle, setExerciseBundle] = useState<any>([])
	const [viewexerciseBundle, setViewExerciseBundle] = useState<any>([])
	const [showModal, setShowModal] = useState(false)
	const [updateShow, setUpdateShow] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [value, onChange] = useState<any>(null)
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [formData, setFormData] = useState({
		exercise_id: '',
		title: '',
		description: '',
		restTime: '',
		sets: '',
		repetition: '',
		drop_set: '',
	})

	const [updateData, setUpdateData] = useState({
		_id: '',
		exercise_id: '',
		rest_time: '',
		set: '',
		reps: '',
		dropSet: '',
	})

	const handleUpdate = async (bundle_id: string) => {
		setShowUpdateModal(true)
		const bundleItem = exerciseBundle.find((item: { _id: string }) => item?._id === bundle_id)
		setUpdateData(bundleItem)
	}

	const handleSetData = (title: any, repetition: any, set: any, rest_time: any, drop_set: any) => {
		setViewExerciseBundle({ title, repetition, set, rest_time, drop_set })

		setUpdateShow(true)
	}

	const fetchData = async () => {
		setLoading(true)
		try {
			if (!bundle_id) {
				console.error('Bundle ID is missing.')
				return
			}

			const bundleResponse: any = await GetExerciseBundle({ id: bundle_id })
			if (
				!bundleResponse ||
				!bundleResponse.data ||
				!Array.isArray(bundleResponse.data[0]?.bundle_item)
			) {
				console.error('Invalid data structure.')
				return
			}
			setBundleName(bundleResponse.data[0].title)
			const data: any[] = bundleResponse.data[0].bundle_item
			const filteredData = data.filter((item: any) => item && item.exercise_info)

			const reversedData: any = filteredData.reverse()
			setExerciseBundle(reversedData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	const Option = [
		{ value: 'YES', name: 'Yes' },
		{ value: 'NO', name: 'No' },
	]

	const fetchExercise = async () => {
		try {
			const response: any = await GetExercise()
			setExercise(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const handleDeleteExerciseBundleItem = async (_id: string) => {
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
					await RemoveExerciseBundleItem({ id: _id })
					toast.success('Item Deleted Successfully')
					fetchData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	useEffect(() => {
		fetchData()
		fetchExercise()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredexerciseBundle = exerciseBundle.filter(
		(exerciseBundle: any) =>
			exerciseBundle.exercise_info &&
			exerciseBundle.exercise_info?.title.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedexerciseBundle = filteredexerciseBundle.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		if (['repetition', 'sets', 'restTime'].includes(name) && Number(value) < 0) {
			return
		}
		setFormData((prevData) => ({ ...prevData, [name]: value }))
	}

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		if (['reps', 'set', 'rest_time'].includes(name) && Number(value) < 0) {
			return
		}
		setUpdateData((prevData) => ({ ...prevData, [name]: value }))
	}

	const handleCreateExerciseBundle = async () => {
		try {
			const payload: any = {
				exercise_id: value.value,
				exercise_bundle_id: bundle_id,
				reps: Number(formData.repetition),
				sets: Number(formData.sets),
				dropSet: formData.drop_set,
				rest_time: Number(formData.restTime),
			}

			await AddExerciseBundleItem(payload)

			setShowModal(false)
			toast.success('Exercise Added Successfully')

			setFormData({
				exercise_id: '',
				title: '',
				description: '',
				restTime: '',
				sets: '',
				repetition: '',
				drop_set: '',
			})
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}

		fetchData()
	}

	const handleUpdateExerciseBundle = async () => {
		try {
			const payload: any = {
				id: updateData._id,
				reps: Number(updateData.reps),
				set: Number(updateData.set),
				dropSet: updateData.dropSet,
				rest_time: Number(updateData.rest_time),
			}
			await UpdateExerciseBundleItem(payload)
			toast.success('Exercise Bundle Updated Successfully')

			setShowUpdateModal(false)

			setUpdateData({
				_id: '',
				exercise_id: '',
				rest_time: '',
				set: '',
				reps: '',
				dropSet: '',
			})
		} catch (error: any) {
			toast.error(error.message)

			console.error(error)
		}
		fetchData()
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Exercise Details</PageTitle>
			<div className='card mt-10 pt-5'>
				<div className='card-header border-0'>
					<div className='card-title'>
						<div className='d-flex align-items-center position-relative my-1'>
							<KTIcon
								iconName='magnifier'
								className='fs-1 position-absolute ms-6'
							/>
							<input
								type='text'
								data-kt-user-table-filter='search'
								className='form-control form-control-solid w-250px ps-14'
								placeholder='Search user'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							onClick={() => setShowModal(true)}
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
									<th>Exercise Name</th>
									<th>Repetition</th>
									<th>Set</th>
									<th>Rest-Time</th>
									<th>DropSet</th>
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
									paginatedexerciseBundle
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
													<td
														onClick={() =>
															handleSetData(
																data.exercise_info?.title,
																data.reps,
																data.set,
																data.rest_time,
																data.dropSet
															)
														}
														onKeyDown={(e) => {
															if (e.key === 'Enter' || e.key === ' ')
																handleSetData(
																	data.exercise_info?.title,
																	data.reps,
																	data.set,
																	data.rest_time,
																	data.dropSet
																)
														}}
														role='button'
														tabIndex={0}>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.exercise_info?.title}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.reps || 'N/A'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.set || 'N/A'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.rest_time || 'N/A'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.dropSet || 'N/A'}
														</span>
													</td>
													<td>
														<TableButton
															action='edit'
															onClick={() => handleUpdate(data._id)}
														/>

														<TableButton
															action='remove'
															onClick={() => handleDeleteExerciseBundleItem(data._id)}
														/>
													</td>
												</tr>
											)
										})
								)}
							</tbody>
						</table>
					</div>
					{paginatedexerciseBundle.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedexerciseBundle.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(exerciseBundle.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
			{/* Add Bundle  */}
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
					<div className='modal-body scroll-y mx-3 pt-0 pb-5'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Exercise-Bundle</h2>
						</div>
						<div>
							<div className='mb-5'>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Bundle Name
								</label>
								<input
									placeholder='Bundle Name'
									type='text'
									disabled
									value={bundleName}
									className='form-control form-control-solid mb-3 mb-lg-0'
								/>
							</div>
							<div className='mb-5'>
								<label
									htmlFor='select'
									className='text-bold form-label'>
									Exercise
								</label>
								<AsyncPaginate
									value={value}
									loadOptions={loadExerciseOptions}
									closeMenuOnSelect={false}
									onChange={onChange}
								/>
							</div>
							<div className='row'>
								<InputField
									className='col-md-6 fv-row'
									label='Repetition'
									placeholder='Enter Repetition'
									type='number'
									name='repetition'
									htmlFor='repetition'
									value={formData.repetition}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Sets'
									placeholder='Enter Sets'
									type='number'
									name='sets'
									htmlFor='sets'
									value={formData.sets}
									onChange={handleInputChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Rest-Time'
									placeholder='Enter in second'
									type='number'
									name='restTime'
									htmlFor='restTime'
									value={formData.restTime}
									onChange={handleInputChange}
								/>
								<SelectField
									className='col-md-6 fv-row'
									label='Drop Set'
									name='drop_set'
									value={formData.drop_set}
									onChange={handleInputChange}
									htmlFor='drop_set'
									options={Option}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='my-7 text-end'>
					<TableButton
						action='add'
						onClick={() => handleCreateExerciseBundle()}
						text='Add'
					/>
				</div>
			</Modal>
			{/* Update bundle  */}
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
					<div className='modal-body scroll-y mx-3 pt-0 pb-5'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Update Exercise-Bundle</h2>
						</div>
						<div>
							<div className='mb-5'>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Bundle Name
								</label>
								<input
									placeholder='Bundle Name'
									type='text'
									disabled
									value={bundleName}
									className='form-control form-control-solid mb-3 mb-lg-0'
								/>
							</div>
							<div className='mb-5'>
								<SelectField
									className='col-md-12 fv-row mb-7'
									label='Exercise Name'
									name='exercise_id'
									value={updateData.exercise_id}
									onChange={handleInputUpdateChange}
									htmlFor='exercise_id'
									options={exercise.map((exercise) => ({
										value: exercise._id,
										name: exercise.title,
									}))}
									disabled
								/>
							</div>
							<div className='row'>
								<InputField
									className='col-md-6 fv-row'
									label='Repetition'
									placeholder='Enter Repetition'
									type='number'
									name='reps'
									htmlFor='reps'
									value={updateData.reps}
									onChange={handleInputUpdateChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Sets'
									placeholder='Enter Sets'
									type='number'
									name='set'
									htmlFor='set'
									value={updateData.set}
									onChange={handleInputUpdateChange}
								/>
								<InputField
									className='col-md-6 fv-row'
									label='Rest-Time'
									placeholder='Enter in second'
									type='number'
									name='rest_time'
									htmlFor='rest_time'
									value={updateData.rest_time}
									onChange={handleInputUpdateChange}
								/>
								<SelectField
									className='col-md-6 fv-row'
									label='Drop Set'
									name='dropSet'
									value={updateData.dropSet}
									onChange={handleInputUpdateChange}
									htmlFor='dropSet'
									options={Option}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='my-7 text-end'>
					<TableButton
						action='edit'
						onClick={() => handleUpdateExerciseBundle()}
						text='Update'
					/>
				</div>
			</Modal>
			{/* View Exercise Details */}
			<Modal
				centered
				size='lg'
				show={updateShow}>
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
							label='Title'
							htmlFor='title'
							value={viewexerciseBundle.title}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Rest Time'
							type='text'
							className='mb-7 w-100 fv-row'
							name='rest_time'
							label='Rest Time'
							htmlFor='rest_time'
							value={viewexerciseBundle.rest_time}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Enter Set'
							type='text'
							className='mb-7 w-100 fv-row'
							name='set'
							label='Set'
							htmlFor='set'
							value={viewexerciseBundle.set ? viewexerciseBundle.set : 'N/A'}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Enter Repetition'
							type='text'
							className='mb-7 w-100 fv-row'
							name='repetition'
							label='Repetition'
							htmlFor='repetition'
							value={viewexerciseBundle.repetition}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='fv-row mb-7'>
						<InputField
							placeholder='Enter Drop Set'
							type='text'
							className='mb-7 w-100 fv-row'
							name='drop_set'
							label='Drop Set'
							htmlFor='drop_set'
							value={viewexerciseBundle.drop_set}
							onChange={handleInputUpdateChange}
						/>
					</div>
				</div>
				<div className='modal-footer justify-content-end'>
					<button
						type='button'
						className='btn btn-primary btn-block mb-4 w-100'>
						Back
					</button>
				</div>
			</Modal>
		</>
	)
}

export default ExerciseBundleItem
