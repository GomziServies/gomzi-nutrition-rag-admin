/* eslint-disable jsx-a11y/anchor-is-valid */
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { AsyncPaginate } from 'react-select-async-paginate'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import InputField from '../../../components/InputField'
import { loadFoodOptions } from '../../../components/loadFoodOptions'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	AddFoodBundleItem,
	GetFood,
	GetFoodBundle,
	GetFoodCategory,
	GetFoodTime,
	RemoveFoodBundleItem,
	UpdateFoodBundle,
	UpdateFoodBundleItem,
} from '../../../Functions/FWG'
import SearchFilter from '../../../components/SearchFilter'

type Food = {
	_id: string
	food_name: string
}

type Category = {
	_id: string
	category: string
}

type Times = {
	_id: string
	food_time: string
}

const FoodBundleItem: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const bundle_id: string | any = searchParams.get('bundle_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [bundleName, setBundleName] = useState('')
	const [foodBundle, setFoodBundle] = useState<any>([])
	const [food, setFood] = useState<Food[]>([])
	const [showModal, setShowModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [updateFoodID, setUpdateFoodID] = useState('')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [foodData, setFoodData] = useState({
		quantity: '',
	})

	const [formData, setFormData] = useState({
		food_id: '',
		bundle_name: '',
		food_name: '',
	})
	const [loading, setLoading] = useState(false)

	const asyncPaginateRef = useRef<any>(null)

	const [value, setValue] = useState<any>(null)

	const handleChange = (selectedOption: any) => {
		setValue(selectedOption)

		if (asyncPaginateRef.current) {
			asyncPaginateRef.current.blur()
		}
	}

	const fetchData = async () => {
		setLoading(true)
		try {
			if (!bundle_id) {
				console.error('Bundle ID is missing.')
				return
			}

			const bundleResponse: any = await GetFoodBundle({ id: bundle_id })
			setBundleName(bundleResponse.data.bundle_name)
			const data: any[] = bundleResponse.data.bundle_items
			const filteredData = data.filter((item: any) => item && item.food)
			const reversedData: any = filteredData.reverse()
			setFoodBundle(reversedData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchFood = async () => {
		try {
			const response: any = await GetFood()
			setFood(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setFormData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleInputFoodChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target

		setFoodData((prevData) => ({
			...prevData,
			[name]: value,
		}))
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
					await RemoveFoodBundleItem({ id: _id })
					toast.success('Food Deleted Successfully')
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
		fetchFood()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredfoodBundle = foodBundle.filter(
		(foodBundle: any) =>
			foodBundle.food && foodBundle.food?.food_name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedFoodBundle = filteredfoodBundle.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	// Update the handleModalUpdateFood function
	const handleModalUpdateFood = (id: string) => {
		const selectedFoodItem = foodBundle.find((item: any) => item._id === id)

		if (selectedFoodItem) {
			setFormData({
				food_id: selectedFoodItem.food._id,
				bundle_name: bundleName,
				food_name: selectedFoodItem.food.food_name,
			})
			setFoodData({
				quantity: selectedFoodItem.quantity || '',
			})
			setValue({
				// Assuming 'value' is used to set the food item in AsyncPaginate
				value: selectedFoodItem.food._id,
				label: selectedFoodItem.food.food_name,
				quantity: selectedFoodItem.quantity || '',
				quantity_unit: selectedFoodItem.food?.quantity_unit || 'unit',
			})
		}

		setUpdateFoodID(id)
		setShowUpdateModal(true)
	}

	// Add a useEffect to populate the modal when updateFoodID changes
	useEffect(() => {
		if (updateFoodID) {
			const selectedFoodItem = foodBundle.find((item: any) => item._id === updateFoodID)

			if (selectedFoodItem) {
				setFormData({
					food_id: selectedFoodItem.food._id,
					bundle_name: bundleName,
					food_name: selectedFoodItem.food.food_name,
				})
				setFoodData({
					quantity: selectedFoodItem.quantity || '',
				})
				setValue({
					value: selectedFoodItem.food._id,
					label: selectedFoodItem.food.food_name,
					quantity: selectedFoodItem.quantity || '',
					quantity_unit: selectedFoodItem.food?.quantity_unit || 'unit',
				})
			}
		}
	}, [updateFoodID, foodBundle, bundleName])

	const handleAddFood = async () => {
		try {
			const payload: any = {
				bundle_id: bundle_id,
				food_id: value.value,
				quantity: foodData.quantity,
			}

			await AddFoodBundleItem(payload)
			toast.success('Food Added Successfully')

			setShowModal(false)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		fetchData()
	}

	const handleUpdateFood = async () => {
		try {
			const payload: any = {
				bundle_id: bundle_id,
				food_id: value.value,
				id: updateFoodID,
				quantity: foodData.quantity,
			}

			await UpdateFoodBundleItem(payload)
			toast.success('Food update Successfully')

			setShowUpdateModal(false)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		fetchData()
	}

	const [categories, setCategories] = useState<Category[]>([])
	const [times, setTimes] = useState<Times[]>([])
	const [editFoodBundle, setEditFoodBundle] = useState({
		bundle_name: '',
		list_category: '',
		list_time: '',
		video_url: '',
	})

	const fetchFoodBundleData = async () => {
		setLoading(true)
		try {
			const response = await GetFoodBundle({
				id: bundle_id,
			})
			setEditFoodBundle({
				bundle_name: response.data.bundle_name || '',
				list_category: response.data.food_time?.[0]?._id || '',
				list_time: response.data.food_category?._id || '',
				video_url: response.data.video_url || '',
			})
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchCategories = async () => {
		try {
			const response: any = await GetFoodCategory()
			setCategories(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchTime = async () => {
		try {
			const response: any = await GetFoodTime()
			setTimes(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchFoodBundleData()
		fetchCategories()
		fetchTime()
	}, [])

	const handleEditInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setEditFoodBundle({ ...editFoodBundle, [name]: value })
	}

	const handleEditFoodBundle = async (data: any) => {
		setEditFoodBundle({
			bundle_name: data.bundle_name || '',
			list_category: data.food_time?.[0]?._id || '',
			list_time: data.food_category?._id || '',
			video_url: data.video_url || '',
		})
		try {
			const payload: any = {
				bundle_name: editFoodBundle.bundle_name,
				food_category_id: editFoodBundle.list_time,
				food_time_id: editFoodBundle.list_category,
				video_url: editFoodBundle.video_url,
			}

			payload.id = bundle_id
			await UpdateFoodBundle(payload)
			toast.success('Bundle Updated Successfully')
			fetchFoodBundleData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const timeOption = times.map((data: any) => ({
		value: data._id,
		name: data.food_time,
	}))

	const categoriesOption = categories.map((data: any) => ({
		value: data._id,
		name: data.category,
	}))

	return (
		<>
			<PageTitle breadcrumbs={[]}>Food Bundle Details</PageTitle>

			<div className='row mx-0 mb-10'>
				<KTCard>
					<h1 className='fw-bold text-dark fs-1 m-6 '>Update Food Bundle</h1>
					<div className='card-body mb-4'>
						<div className='row'>
							<CopyableInput
								placeholder='Id'
								type='text'
								className='col-md-6 fv-row mb-7'
								name='bundle_id'
								label='Id'
								htmlFor='bundle_id'
								value={bundle_id}
								onChange={handleEditInputChange}
								disabled
							/>
							<InputField
								placeholder='Bundle Name'
								type='text'
								className='col-md-6 fv-row mb-7'
								name='bundle_name'
								label='Bundle Name'
								htmlFor='bundle_name'
								value={editFoodBundle.bundle_name}
								onChange={handleEditInputChange}
							/>
							<SelectFieldManual
								className='col-md-4 fv-row mb-7'
								label='Category'
								name='list_category'
								value={editFoodBundle.list_category}
								onChange={handleEditInputChange}
								htmlFor='list_category'
								options={timeOption}
							/>
							<SelectFieldManual
								className='col-md-4 fv-row mb-7'
								label='Time'
								name='list_time'
								value={editFoodBundle.list_time}
								onChange={handleEditInputChange}
								htmlFor='list_time'
								options={categoriesOption}
							/>
							<InputField
								placeholder='Video URL'
								type='text'
								className='col-md-4 fv-row mb-7'
								name='video_url'
								label='Video URL'
								htmlFor='video_url'
								value={editFoodBundle.video_url}
								onChange={handleEditInputChange}
							/>
						</div>
						<div className='text-end'>
							<TableButton
								action='edit'
								onClick={() => handleEditFoodBundle(editFoodBundle)}
								text='Update'
								backgroundDark={true}
							/>
						</div>
					</div>
				</KTCard>
			</div>

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
									<th className='min-w-300px'>Food Name</th>
									<th>Quantity</th>
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
									paginatedFoodBundle
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
															{data.food.food_name}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data?.quantity
																? `${data.quantity} ${data.food?.quantity_unit || 'unit'}`
																: '0'}
														</span>
													</td>
													<td>
														<TableButton
															action='edit'
															onClick={() => handleModalUpdateFood(data._id)}
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
					{paginatedFoodBundle.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedFoodBundle.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(foodBundle.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			{/*add Modal*/}
			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Food Bundle</h2>
						<button
							onClick={() => setShowModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'
							data-bs-dismiss='modal'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body'>
						<div className='row'>
							<div className='col-12 fv-row mb-7'>
								<label
									htmlFor='ddd'
									className='required fw-bold fs-6 mb-5'>
									Bundle Name
								</label>
								<input
									placeholder='Bundle Name'
									type='text'
									name='food_bundle_name'
									className='form-control form-control-solid mb-3 mb-lg-0'
									autoComplete='off'
									value={bundleName}
									readOnly
									disabled
								/>
							</div>
							<label
								htmlFor='Food'
								className='fw-bold fs-6 mb-md-5 mb-2'>
								Food
							</label>
							<AsyncPaginate
								value={value}
								loadOptions={loadFoodOptions}
								closeMenuOnSelect={true}
								onChange={(selectedOption: any) => {
									handleChange(selectedOption)
								}}
							/>
							<label
								htmlFor='quantity'
								className='fw-bold fs-6 mb-md-5 mb-2 mt-6'>
								Quantity
							</label>
							<div className='input-group'>
								<input
									placeholder='Enter quantity'
									type='text'
									id='quantity'
									name='quantity'
									value={foodData?.quantity}
									onChange={handleInputFoodChange}
									className='form-control mb-3 mb-lg-0 inputfield-bg'
								/>
								<span className='input-group-text'>{value?.quantity_unit || 'unit'}</span>
							</div>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='add'
							onClick={() => handleAddFood()}
							text='Add'
						/>
					</div>
				</div>
			</Modal>

			{/*Update Modal*/}
			<Modal
				centered
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Update Food Bundle</h2>
						<button
							onClick={() => setShowUpdateModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'
							data-bs-dismiss='modal'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body'>
						<div className='row'>
							<div className='col-12 fv-row mb-7'>
								<label
									htmlFor='ddd'
									className='required fw-bold fs-6 mb-5'>
									Bundle Name
								</label>
								<input
									placeholder='Bundle Name'
									type='text'
									name='food_bundle_name'
									className='form-control form-control-solid mb-3 mb-lg-0'
									autoComplete='off'
									value={bundleName}
									readOnly
									disabled
								/>
							</div>
							<label
								htmlFor='Food'
								className='fw-bold fs-6 mb-md-5 mb-2'>
								Food
							</label>
							<AsyncPaginate
								value={value}
								loadOptions={loadFoodOptions}
								closeMenuOnSelect={true}
								onChange={(selectedOption: any) => {
									handleChange(selectedOption)
								}}
							/>
							<label
								htmlFor='quantity'
								className='fw-bold fs-6 mb-md-5 mb-2 mt-6'>
								Quantity
							</label>
							<div className='input-group'>
								<input
									placeholder='Enter quantity'
									type='text'
									id='quantity'
									name='quantity'
									value={foodData?.quantity}
									onChange={handleInputFoodChange}
									className='form-control mb-3 mb-lg-0 inputfield-bg'
								/>
								<span className='input-group-text'>{value?.quantity_unit || 'unit'}</span>
							</div>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='edit'
							onClick={() => handleUpdateFood()}
							text='Update'
							backgroundDark={true}
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default FoodBundleItem
