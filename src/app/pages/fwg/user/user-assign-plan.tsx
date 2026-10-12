import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TextareaField from '../../../components/TextareaField'
import {
	AssignUserPlan,
	GetPlanBundle,
	GetUserAssignFeature,
	UpdateUserAssignFeature,
	UserAssignFeature,
} from '../../../Functions/FWG'
import { GetFeatures } from '../../../Functions/FWG/Feature'

const UserAssignPlan: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const user_id: string | any = searchParams.get('user_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [assignData, setAssignData] = useState<any>([])
	const [planBundleData, setPlanBundleData] = useState<any>([])
	const [featureData, setFeatureData] = useState<any>([])
	const [orderTableData, setOrderTableData] = useState<any>([])
	const [formData, setFormData] = useState({
		selectedOption: '',
		selectedPlan: '',
		selectedFeature: '',
		notes: '',
		duration: '',
		amount: '',
		timeUnit: '',
	})
	const [orderData, setOrderData] = useState<any>('')
	const [show, setShow] = useState(false)
	const [addFeatureShow, setAddFeatureShow] = useState(false)
	const [loading, setLoading] = useState(false)

	const handleClose = () => setShow(false)
	const handleShow = () => setShow(true)

	const fetchUserAssignData = async () => {
		setLoading(true)
		try {
			const response: any = await GetUserAssignFeature({ user_id: user_id })
			const data: any = response.data

			const filteredData = data.filter(
				(item: any) => item.user_assign_feature && item.user_assign_feature.length > 0
			)
			setAssignData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchPlanBundleResult = async () => {
		try {
			const response: any = await GetPlanBundle()
			setPlanBundleData(response.data)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchFeatureResult = async () => {
		try {
			const response: any = await GetFeatures()
			setFeatureData(response.data)
		} catch (error) {
			console.error(error)
		}
	}

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setFormData((prevData) => ({
			...prevData,
			[name]: name === 'amount' ? parseFloat(value) || 0 : value,
		}))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredAssignData = assignData.filter((data: any) =>
		data.order_item_type.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedAssignData = filteredAssignData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	useEffect(() => {
		fetchFeatureResult()
		fetchUserAssignData()
		fetchPlanBundleResult()
	}, [])

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleAssignPlan = async () => {
		try {
			setIsSubmitting(true)

			if (formData.selectedOption === 'feature') {
				const featureData = {
					user_id: user_id,
					feature_id: formData.selectedFeature,
					timeUnit: formData.timeUnit,
					duration: formData.duration,
					amount: formData.amount,
					notes: formData.notes,
				}

				await UserAssignFeature(featureData)
			} else if (formData.selectedOption === 'plan-bundle') {
				const planData = {
					user_id: user_id,
					plan_bundle_id: formData.selectedPlan,
					amount: formData.amount,
					notes: formData.notes,
				}
				await AssignUserPlan(planData)
			}

			toast.success('Assign Plan/Feature Successfully')
			fetchUserAssignData()
			setAddFeatureShow(false)
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setAddFeatureShow(false)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const viewOrder = async (id: string) => {
		handleShow()
		const orderInfo = assignData.find((data: any) => data._id === id)
		if (!orderInfo) {
			return toast.error('Order Details not available')
		}

		setOrderData(orderInfo)

		if (!orderInfo.user_assign_feature || orderInfo.user_assign_feature.length == 0) {
			return
		}
		const userFeature: any = orderInfo.user_assign_feature

		setOrderTableData(userFeature)
	}

	const removeFeature = async (id: string, orderID: string) => {
		handleClose()
		try {
			const { value: confirmText } = await Swal.fire({
				title: `Are you sure?`,
				text: `This action cannot be undone. Plan Bundle will remove all features from the user.`,
				icon: 'question',
				input: 'text',
				inputPlaceholder: 'Write "confirm" here to remove plan',
				showCancelButton: true,
				confirmButtonText: 'Remove',
				showCloseButton: true,
				inputValidator: (value) => {
					if (!value || value.trim().toLowerCase() !== 'confirm') {
						return 'Please type "confirm" to remove the plan.'
					}
				},
			})
			if (confirmText && confirmText.trim().toLowerCase() === 'confirm') {
				handleShow()
				const payload: any = {
					user_assign_id: id,
					status: 'DELETED',
				}
				await UpdateUserAssignFeature(payload)
				toast.success('Feature removed successfully')
				if (orderData.order_item_type == 'PLAN' && orderData.user_assign_feature.length > 1) {
					return fetchUserAssignData().then(() => viewOrder(orderID))
				}
				if (orderData.user_assign_feature.length == 0 || orderData.order_item_type == 'PLAN') {
					fetchUserAssignData()
					setShow(false)
				}
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const options = [
		{ value: 'feature', name: 'Feature' },
		{ value: 'plan-bundle', name: 'Plan Bundle' },
	]

	const timeOption = [
		{ value: 'DAY', name: 'Days' },
		{ value: 'WEEK', name: 'Week' },
		{ value: 'MONTH', name: 'Month' },
		{ value: 'YEAR', name: 'Year' },
	]

	const planOptions = planBundleData.map((bundle: any) => ({
		value: bundle._id,
		name: bundle.plan_title,
	}))

	const featureOptions = featureData.map((bundle: any) => ({
		value: bundle._id,
		name: bundle.title,
	}))

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Assign Plan</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
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
							onClick={() => setAddFeatureShow(true)}
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
									<th>Receipt No</th>
									<th>Item Type</th>
									<th>Title</th>
									<th>Payment Mode</th>
									<th>Created On</th>
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
									paginatedAssignData.map((sale: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										let title = ''
										let itemType = ''
										if (sale.order_item_type === 'FEATURE') {
											title = sale.user_assign_feature[0]?.feature_info.title
											itemType = 'Feature'
										}

										if (sale.order_item_type === 'PLAN') {
											title = sale.plan_bundle?.plan_title
											itemType = 'Plan'
										}

										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{sale.receipt_id}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>{itemType}</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{title || 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{sale.purchase_mode}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{DayJS(sale.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
													</span>
												</td>
												<td>
													<TableButton
														action='view'
														onClick={() => viewOrder(sale._id)}
													/>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{paginatedAssignData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedAssignData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(assignData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
			<Modal
				centered
				size='lg'
				show={addFeatureShow}
				onHide={() => setAddFeatureShow(true)}>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-between'>
						<div className='text-center'>
							<h2 className='mb-3'>Choose Plan/Feature</h2>
						</div>
						<div
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setAddFeatureShow(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</div>
					</div>
					<div className='modal-body scroll-y mx-3 pt-0 pb-15 mt-10'>
						<div>
							<div className='mb-5'>
								<SelectFieldManual
									className='col-md-12 fv-row mb-7'
									label='Selected Option'
									name='selectedOption'
									value={formData.selectedOption}
									onChange={handleInputChange}
									htmlFor='selectedOption'
									options={options}
								/>
							</div>
							<div className='border-bottom mb-3'></div>
							<div
								id='plan-bundle'
								style={{ display: formData.selectedOption === 'plan-bundle' ? 'block' : 'none' }}>
								<div className='mb-5'>
									<SelectFieldManual
										className='col-md-12 fv-row mb-7'
										label='Select Plan'
										name='selectedPlan'
										value={formData.selectedPlan}
										onChange={handleInputChange}
										htmlFor='selectedPlan'
										options={planOptions}
									/>
								</div>
								<div className='mb-5'>
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
								<div className='mb-5'>
									<TextareaField
										className='col-md-12 fv-row'
										label='Notes'
										placeholder='Write Notes'
										name='notes'
										htmlFor='notes'
										value={formData.notes}
										onChange={handleNotesChange}
									/>
								</div>
							</div>
							<div
								id='feature'
								style={{ display: formData.selectedOption === 'feature' ? 'block' : 'none' }}>
								<div className='mb-5'>
									<SelectFieldManual
										className='col-md-12 fv-row mb-7'
										label='Select Feature'
										name='selectedFeature'
										value={formData.selectedFeature}
										onChange={handleInputChange}
										htmlFor='selectedFeature'
										options={featureOptions}
									/>
								</div>
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
								<div className='mb-5'>
									<TextareaField
										className='col-md-12 fv-row'
										label='Notes'
										placeholder='Write Notes'
										name='notes'
										htmlFor='notes'
										value={formData.notes}
										onChange={handleNotesChange}
									/>
								</div>
							</div>
						</div>
						<div className='mt-7 text-center'>
							<TableButton
								action='assign'
								onClick={handleAssignPlan}
								text={isSubmitting ? 'Please wait, assign plan/feature...' : 'Assign'}
								showIcon={false}
								disabled={isSubmitting}
								backgroundDark={true}
								className={`mb-4 col-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
							/>
						</div>
					</div>
				</div>
			</Modal>
			<Modal
				centered
				size='lg'
				show={show}
				onHide={handleClose}>
				<div className='modal-header pb-0 border-0 justify-content-between'>
					<div className='text-center'>
						<h2 className='mb-3'>View Feature</h2>
					</div>
					<button
						className='btn btn-sm btn-icon btn-active-color-primary'
						onClick={() => handleClose()}>
						<FontAwesomeIcon
							className='fs-1 position-absolute ms-3'
							icon={faXmark}
						/>
					</button>
				</div>
				<div className='modal-body scroll-y mx-3 mt-5'>
					<div className='row'>
						<div className='col-md-6'>
							<h4>Order Details</h4>
							<div>
								<p className='mb-0 fs-6'>Receipt ID:</p>
								<p className='font-bold fs-5'>
									<b>{orderData.receipt_id || 'N/A'}</b>
								</p>
							</div>
							<div>
								{orderData.order_item_type === 'PLAN' && (
									<>
										<p className='mb-0 fs-6'>Plan Name:</p>
										<p className='font-bold fs-5'>
											<b>{orderData.plan_bundle?.plan_title || 'N/A'}</b>
										</p>
									</>
								)}
							</div>
						</div>
						<div className='col-md-6'>
							<h4>Transaction Information</h4>
							<div>
								<p className='mb-0 fs-6'>Purchase Mode:</p>
								<p className='font-bold fs-5'>
									<b>{orderData.purchase_mode || 'N/A'}</b>
								</p>
							</div>
							<div>
								<p className='mb-0 fs-6'>Updated On:</p>
								<p className='font-bold fs-5'>
									<b>{DayJS(orderData.updatedAt).format('MMM D, YYYY h:mm A')}</b>
								</p>
							</div>
						</div>
					</div>
					<div className='border-bottom mb-3'></div>
					<div className=''>
						<div className='table-responsive'>
							<table
								id='kt_table_users'
								className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
								<thead>
									<tr className='fw-bold text-muted'>
										<th>No.</th>
										<th>Title</th>
										<th>Feature</th>
										<th>Started on</th>
										<th>Expire on</th>
										<th className='ps-4 rounded-end'>Action</th>
									</tr>
								</thead>
								<tbody className='text-gray-600 fw-bold'>
									{orderTableData.map((order: any, index: number) => {
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
														{order.feature_info?.title}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{order.feature_info?.feature}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{DayJS(order.start_time).format('MMM D, YYYY h:mm A')}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{DayJS(order.end_time).format('MMM D, YYYY h:mm A')}
													</span>
												</td>
												<td>
													<TableButton
														action='remove'
														onClick={() => removeFeature(order._id, orderData._id)}
													/>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</div>
					<div className='border-bottom mb-3'></div>
					<div className='row mt-5'>
						<div className='col'>
							<p className='fs-4'>
								Order_id: <b>{orderData._id}</b>
							</p>
						</div>
						<div className='col'>
							<div className='text-end'>
								<TableButton
									action='remove'
									onClick={() => removeFeature(orderData._id, orderData._id)}
									text={isSubmitting ? 'Please wait, Remove Planing...' : 'Remove Plan'}
									showIcon={false}
									disabled={isSubmitting}
									backgroundDark={true}
									className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
								/>
							</div>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default UserAssignPlan
