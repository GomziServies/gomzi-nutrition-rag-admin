import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { AsyncPaginate } from 'react-select-async-paginate'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { loadUserOptions } from '../../../components/loadUserOptions'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import TextareaField from '../../../components/TextareaField'
import {
	AddPlanBundleItem,
	AssignUserPlan,
	GetFeatures,
	GetPlanBundle,
	GetUser,
	GetUserAssignFeature,
	RemoveUserAssignPlan,
	UpdatePlanBundle,
} from '../../../Functions/FWG'

const ViewPlanBundle: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isSubmittingAssign, setIsSubmittingAssign] = useState(false)
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const plan_id: string | any = searchParams.get('plan_id')
	const [planBundleData, setPlanBundleData] = useState<any>({})
	const [activeFeatureData, setActiveFeatureData] = useState<any>([])
	const [featuresData, setFeaturesData] = useState<any>({})
	const [formData, setFormData] = useState<any>({})
	const [formAssignData, setFormAssignData] = useState<any>([])
	const [formAssignAddData, setFormAssignAddData] = useState<any>({ duration_unit: '' })
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [searchTerm, setSearchTerm] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [showActiveModal, setShowActiveModal] = useState(false)
	const [loading, setLoading] = useState(false)
	const [loading1, setLoading1] = useState(false)
	const [value, onChange] = useState<any>(null)
	const [updateData, setUpdateData] = useState({
		plan_title: '',
		plan_description: '',
		videoURL: '',
		plan_type: '',
		amount: '',
	})
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setPlanBundleData({ ...planBundleData, [name]: value })
	}

	const handleNotesUpdate = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const fetchPlanBundle = async () => {
		setLoading1(true)
		try {
			const response: any = await GetPlanBundle({ id: plan_id })
			const data: any = response.data
			setPlanBundleData(data)
			setActiveFeatureData(data?.bundle_item)
		} catch (error) {
			console.error(error)
		}
		setLoading1(false)
	}

	const fetchFeatureData = async () => {
		try {
			const response: any = await GetFeatures()
			let data: any = response.data
			data = data.map((feature: any) => {
				return { value: feature?._id, name: feature?.feature }
			})
			setFeaturesData(data)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchAssignPlanBundle = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetUserAssignFeature({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				sort,
				sortOrder,
				order_status: ['SUCCESS'],
			})
			const bundleData = response.data

			const userResponse: any = await GetUser()

			const filteredData = bundleData.map((bundle: any) => {
				bundle.user_id = userResponse.data.find((user: any) => user._id === bundle.user_id)
				return bundle
			})

			setFormAssignData(filteredData)
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchPlanBundle()
		fetchFeatureData()
	}, [])

	useEffect(() => {
		fetchAssignPlanBundle()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const handleUpdateData = async () => {
		try {
			setIsSubmitting(true)
			const payload: any = {
				id: planBundleData._id,
				plan_title: planBundleData.plan_title,
				plan_description: planBundleData.plan_description,
				videoURL: planBundleData.videoURL,
				plan_type: planBundleData.plan_type,
				amount: Number(planBundleData.amount),
			}
			await UpdatePlanBundle(payload)
			toast.success('Plan Bundle Update Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleAssignUpdateData = async () => {
		try {
			const payload: any = {
				user_id: value[0].value,
				plan_bundle_id: plan_id,
				amount: parseInt(formData.amount),
			}
			await AssignUserPlan(payload)
			toast.success('Plan Bundle Assign Successfully')

			fetchAssignPlanBundle()
			setFormAssignAddData({ amount: '' })
			setShowModal(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmittingAssign(false)
			console.error(error)
		}
	}

	const handleActiveFeatureData = async () => {
		try {
			const payload: any = {
				plan_bundle_id: plan_id,
				feature_id: formData.feature_id,
				duration: parseInt(formData.duration),
				timeUnit: formData.timeUnit,
			}
			await AddPlanBundleItem(payload)
			toast.success('Feature active Successfully')

			fetchPlanBundle()
			setFormAssignAddData({ feature_id: '', duration: '', timeUnit: '' })
			setShowActiveModal(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmittingAssign(false)
			console.error(error)
		}
	}

	const handleDeleteAssign = async (_id: string) => {
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
					await RemoveUserAssignPlan({ order_id: _id })
					toast.success('Assigned Plan Bundle Remove Successfully')
					fetchAssignPlanBundle()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const calculateExpiryDate = (
		createdAt: string,
		duration: number,
		durationUnit: string
	): string => {
		let expiryDate = dayjs(createdAt)

		switch (durationUnit?.toUpperCase()) {
			case 'YEAR':
				expiryDate = expiryDate.add(duration, 'year')
				break
			case 'MONTH':
				expiryDate = expiryDate.add(duration, 'month')
				break
			case 'WEEK':
				expiryDate = expiryDate.add(duration, 'week')
				break
			case 'DAY':
				expiryDate = expiryDate.add(duration, 'day')
				break
			default:
				break
		}

		return expiryDate.format('DD/MM/YYYY hh:mm:ss A')
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setFormData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const timeOption = [
		{ value: 'DAY', name: 'Days' },
		{ value: 'WEEK', name: 'Week' },
		{ value: 'MONTH', name: 'Month' },
		{ value: 'YEAR', name: 'Year' },
	]

	const sortableFields = [
		{ title: 'User', field: 'firstName' },
		{ title: 'Email', field: 'email' },
		{ title: 'Amount', field: 'amount' },
		{ title: 'Start Date', field: 'createdAt' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Plan Bundle Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-6 fv-row'>
									<InputField
										placeholder='Plan Name'
										type='text'
										className='mb-7 w-100 fv-row'
										name='plan_title'
										label='Plan Name'
										htmlFor='plan_title'
										value={planBundleData.plan_title}
										onChange={handleInputUpdateChange}
									/>
								</div>
								<div className='col-md-6 fv-row'>
									<InputField
										placeholder='Video URL'
										type='text'
										className='mb-7 w-100 fv-row'
										name='videoURL'
										label='Video URL'
										htmlFor='videoURL'
										value={planBundleData.videoURL}
										onChange={handleInputUpdateChange}
									/>
								</div>
								<div className='col-md-6 fv-row'>
									<SelectField
										className='fv-row mb-7'
										label='Plan Type'
										name='plan_type'
										value={planBundleData.plan_type}
										onChange={handleInputUpdateChange}
										htmlFor='plan_type'
										options={['PAID', 'FREE']}
									/>
								</div>
								<div className='col-md-6 fv-row'>
									<InputField
										placeholder='Enter Amount'
										type='number'
										className='fv-row  mb-7'
										name='amount'
										label='Amount'
										htmlFor='amount'
										value={planBundleData.amount}
										onChange={handleInputUpdateChange}
									/>
								</div>
								<div className='col-md-12 fv-row'>
									<TextareaField
										className='mb-7 w-100 fv-row'
										label='Description'
										placeholder='Write Description'
										name='plan_description'
										htmlFor='plan_description'
										value={planBundleData.plan_description}
										onChange={handleNotesUpdate}
									/>
								</div>
								<div className='col-md-12 text-end fv-row'>
									<TableButton
										action='edit'
										onClick={() => handleUpdateData()}
										text={
											isSubmitting ? 'Please wait, Updating Plan Bundle...' : 'Update Plan Bundle'
										}
										showIcon={false}
										disabled={isSubmitting}
										backgroundDark={true}
										className={`mb-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
									/>
								</div>
								<div className='col'></div>
							</div>
						</div>
					</div>
				</div>

				<div className='card mt-10 pt-5'>
					<div className='card-toolbar m-5 ms-8'>
						<h1 className='fw-bold text-dark fs-1 '>Active Feature</h1>
					</div>
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
								onClick={() => setShowActiveModal(true)}
								text='Add Feature'
								showIcon={false}
							/>
						</div>
					</div>
					<div className='py-4 card-body'>
						<div className='table-responsive'>
							<table
								id='kt_table_users'
								className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
								<thead className='table-hide-th'>
									<tr className='fw-bold text-muted bg-light border-bottom-0'>
										<th className='text-center rounded-start'>No.</th>
										<th>Title</th>
										<th>Feature</th>
										<th>Duration</th>
										<th>Created Date</th>
										<th className='ps-4 rounded-end'>Action</th>
									</tr>
								</thead>
								<tbody className='text-gray-600 fw-bold'>
									{loading1 ? (
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
										activeFeatureData?.slice().map((data: any, index: number) => {
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
															{data?.feature_info?.title ? data?.feature_info?.title : '-'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data?.feature_info?.feature ? data?.feature_info?.feature : '-'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data?.duration + ' ' + data?.timeUnit}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{DayJS(data?.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
														</span>
													</td>
													<td>
														{data.status ? (
															<TableButton
																action='remove'
																onClick={() => handleDeleteAssign(data._id)}
															/>
														) : (
															<span className='btn gap-2 btn-light-warning mx-2 btn-sm me-1'>
																Pending
															</span>
														)}
													</td>
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</div>

						{activeFeatureData.length === 0 && !loading1 && (
							<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
								<b>No Active Feature found</b>
							</div>
						)}
					</div>
				</div>

				<div className='card mt-10 pt-5'>
					<div className='card-toolbar m-5 ms-8'>
						<h1 className='fw-bold text-dark fs-1 '>Plan Bundle Assign</h1>
					</div>
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
								text='New User'
								showIcon={false}
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
										formAssignData.slice().map((data: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											const { plan_info } = data
											const expiryDate = calculateExpiryDate(
												plan_info?.createdAt,
												plan_info?.duration,
												plan_info?.duration_unit
											)

											return (
												<tr key={actualIndex}>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{actualIndex}
														</span>
													</td>
													<td>
														<div className='d-flex align-items-center'>
															<div className='symbol symbol-45px me-5'>
																<img
																	src={data?.user_id?.profile_image || '/media/avatars/300-1.jpg'}
																	alt={data.username}
																	className='fs-3 text-primary'
																	style={{ width: '55px', height: '55px', borderRadius: '20%' }}
																/>
															</div>
															<div className='d-flex justify-content-start flex-column'>
																<span className='text-dark fw-bold  fs-6'>
																	{data?.user_id?.firstName + ' ' + data?.user_id?.lastName ||
																		'N/A'}
																</span>
																<span className='text-muted fw-semibold text-muted d-block fs-7'>
																	{data?.user_id?.country_code}{' '}
																	{data?.user_id?.mobile ? data?.user_id?.mobile : '-'}
																</span>
															</div>
														</div>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data?.user_id?.email ? data?.user_id?.email : '-'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data?.amount + ' INR' || '-'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{DayJS(data?.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
														</span>
													</td>
													<td>
														{data.status ? (
															<TableButton
																action='remove'
																onClick={() => handleDeleteAssign(data._id)}
															/>
														) : (
															<span className='btn gap-2 btn-light-warning mx-2 btn-sm me-1'>
																Pending
															</span>
														)}
													</td>
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</div>
						{formAssignData.length === 0 && !loading && (
							<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
								<b>No records found</b>
							</div>
						)}
						{formAssignData.length > 0 && (
							<UsersListPagination
								totalPages={metaData?.totalPages}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				</div>

				{/* <div className='col-12 mt-7'>
					<div className='card'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-6 fv-row'>
									<SelectFieldManual
										className='mb-7 w-100 fv-row'
										label='Assigned Plan'
										name='duration_unit'
										value={formAssignAddData?.duration_unit}
										onChange={handleInputAssignUpdateChange}
										htmlFor='duration_unit'
										options={planOptions}
									/>
								</div>
								<div className='col-md-6 mt-12 fv-row'>
									<TableButton
										action='edit'
										onClick={() => handleAssignUpdateData()}
										text={isSubmittingAssign ? 'Please wait, Assign...' : 'Assign'}
										showIcon={false}
										disabled={isSubmittingAssign}
										backgroundDark={true}
										className={`mb-4 btn-block ${isSubmittingAssign ? 'disabled' : ''}`}
									/>
								</div>
							</div>
							{formAssignData.map((assign: any, index: any) => {
								return (
									<div className='row'>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='Duration'
												type='text'
												className='w-100 fv-row'
												name='duration'
												htmlFor='duration'
												value={`${assign.franchise_user.firstName} ${assign.franchise_user.lastName}`}
												onChange={handleInputUpdateChange}
												disabled
											/>
										</div>
										<div className='col-md-6 mt-8 fv-row'>
											<TableButton
												action='remove'
												backgroundDark={true}
												onClick={() => handleDeleteAssign(assign._id)}
											/>
										</div>
									</div>
								)
							})}
						</div>
					</div>
				</div> */}
			</div>

			<Modal
				show={showModal}
				centered
				onHide={() => setShowModal(false)}
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							onClick={() => setShowModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body mx-3 pt-0 pb-15 overflow-visible'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Assign User</h2>
						</div>
						<div>
							<div className='mb-7'>
								<label
									htmlFor='select'
									className='form-label'>
									Name
								</label>
								<AsyncPaginate
									debounceTimeout={1000}
									value={value}
									loadOptions={loadUserOptions}
									closeMenuOnSelect={false}
									onChange={onChange}
									isMulti
								/>
							</div>
							<InputField
								className='col-md-12 fv-row'
								label='Amount'
								placeholder='Enter Amount'
								type='number'
								name='amount'
								htmlFor='amount'
								value={formData.amount}
								onChange={handleInputChange}
							/>
						</div>
						<div className='mt-7 text-center'>
							<button
								type='button'
								onClick={() => handleAssignUpdateData()}
								className='btn btn-primary w-50'>
								Add User
							</button>
						</div>
					</div>
				</div>
			</Modal>

			<Modal
				show={showActiveModal}
				centered
				onHide={() => setShowActiveModal(false)}
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							onClick={() => setShowActiveModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body mx-3 pt-0 pb-15 overflow-visible'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Active Feature</h2>
						</div>
						<div>
							<SelectFieldManual
								className='col-md-12 fv-row mb-7'
								label='Feature'
								name='feature_id'
								value={formData.feature_id}
								onChange={handleInputChange}
								htmlFor='feature_id'
								options={featuresData || []}
							/>
							<div className='row'>
								<InputField
									className='col-md-6 fv-row'
									label='Duration'
									placeholder='Enter Duration'
									type='number'
									name='duration'
									htmlFor='duration'
									value={formData.duration}
									onChange={handleInputChange}
								/>
								<SelectFieldManual
									className='col-md-6 fv-row mb-7'
									label='Time (unit)'
									name='timeUnit'
									value={formData.timeUnit}
									onChange={handleInputChange}
									htmlFor='timeUnit'
									options={timeOption}
								/>
							</div>
						</div>
						<div className='mt-7 text-center'>
							<button
								type='button'
								onClick={() => handleActiveFeatureData()}
								className='btn btn-primary w-50'>
								Submit
							</button>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export { ViewPlanBundle }
