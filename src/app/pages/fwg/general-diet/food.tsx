/* eslint-disable jsx-a11y/anchor-is-valid */
import { faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { AddFood, FileUploadToFWG, GetFood, RemoveFood, UpdateFood } from '../../../Functions/FWG'

const Food: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const food_id = searchParams.get('food_id')
	const [metaData, setMetaData] = useState<any>()
	const [searchTerm, setSearchTerm] = useState('')
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [foodData, setFoodData] = useState<any>([])
	const [isEditMode, setIsEditMode] = useState(false)
	const [editFoodId, setEditFoodId] = useState<string | null>(null)
	const [foodAddData, setFoodAddData] = useState({
		food_name: '',
		protein: '',
		carbs: '',
		calories: '',
		fats: '',
		quantity: '',
		quantity_unit: '',
		thumbnail_image: null,
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [sort, setSort] = useState('')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('asc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetFood({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			setFoodData(response.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

	const isFirstRender = useRef(true);

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

	const handleInputChange = (event: any) => {
		const { name, value, type, files } = event.target
		if (type === 'file') {
			setFoodAddData((prevData) => ({
				...prevData,
				[name]: files[0],
			}))
		} else {
			setFoodAddData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleAddFood = async () => {
		try {
			setLoading(true)
			let imageUrl = null
			if (foodAddData.thumbnail_image) {
				const formData = new FormData()
				formData.append('file', foodAddData.thumbnail_image)
				const imageResponse: any = await FileUploadToFWG([formData.get('file')], {
					directory: 'documents',
				})
				imageUrl = imageResponse.data?.fileURLs[0]
				toast.success('Thumbnail image uploaded successfully')
			}

			const data: any = {
				food_name: foodAddData.food_name,
				calories: foodAddData.calories.toString(),
				carbs: foodAddData.carbs.toString(),
				protein: foodAddData.protein.toString(),
				fats: foodAddData.fats.toString(),
				quantity: foodAddData.quantity.toString(),
				quantity_unit: foodAddData.quantity_unit === '' ? null : foodAddData.quantity_unit.toString(),
				thumbnail_image: imageUrl,
			}

			if (isEditMode && editFoodId) {
				data.id = editFoodId
				await UpdateFood(data)
				toast.success('Food Updated Successfully')
			} else {
				await AddFood(data)
				toast.success('Food Added Successfully')
			}

			setFoodAddData({
				food_name: '',
				protein: '',
				carbs: '',
				calories: '',
				fats: '',
				quantity: '',
				quantity_unit: '',
				thumbnail_image: null,
			})

			setIsEditMode(false)
			setEditFoodId(null)
			setShowUpdateModal(false)
			fetchData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	const fetchCourseDataById = async (id: string) => {
		setLoading(true)
		try {
			const response: any = await GetFood({ id: id })
			setFoodAddData(response.data[0])

			setLoading(false)
			setShowUpdateModal(true)
		} catch (error) {
			console.error(error)
			setLoading(false)
		}
	}

	useEffect(() => {
		if (food_id) {
			fetchCourseDataById(food_id)
		}
	}, [food_id])

	const handleEditClick = (data: any) => {
		setShowUpdateModal(true)
		setFoodAddData(data)
		setIsEditMode(true)
		setEditFoodId(data._id)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const deleteFood = async (foodID: string) => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to remove this food.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			})

			if (result.isConfirmed) {
				const response: any = await RemoveFood({ id: foodID })
				if (response.status === 200) {
					setFoodData(foodData.filter((food: any) => food._id !== foodID))
					toast.success('Food removed successfully')
				} else {
					toast.error('Failed to remove food')
				}
			}
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const sortableFields = [
		{ title: 'Thumbnail', field: 'thumbnail_image' },
		{ title: 'Food Name', field: 'food_name' },
		{ title: 'Fat', field: 'fats' },
		{ title: 'Calories', field: 'calories' },
		{ title: 'Carbohydrate', field: 'carbs' },
		{ title: 'Protein', field: 'protein' },
		{ title: 'Quantity', field: 'quantity' },
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

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	return (
		<div>
			<PageTitle breadcrumbs={[]}>Food Details</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<LengthMenu
							expenseData={foodData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							onClick={() => setShowUpdateModal(true)}
							text='Add'
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={foodData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							disableSortFields={['thumbnail_image']}
							renderRow={(
								foodData: any,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => (
								<React.Fragment key={foodData._id}>
									<tr
										onClick={() => handleRowClick(foodData._id)}
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
											<img
												src={foodData.thumbnail_image ? foodData.thumbnail_image : '-'}
												alt='thumbnail'
												style={{
													width: '80px',
													height: '80px',
													borderRadius: '10px',
												}}
											/>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodData?.food_name}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodData?.fats != null
													? Number(foodData.fats) % 1 === 0
														? Number(foodData.fats).toString()
														: Number(foodData.fats).toFixed(2)
													: ''}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodData?.calories != null
													? Number(foodData.calories) % 1 === 0
														? Number(foodData.calories).toString()
														: Number(foodData.calories).toFixed(2)
													: ''}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodData?.carbs != null
													? Number(foodData.carbs) % 1 === 0
														? Number(foodData.carbs).toString()
														: Number(foodData.carbs).toFixed(2)
													: ''}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodData?.protein != null
													? Number(foodData.protein) % 1 === 0
														? Number(foodData.protein).toString()
														: Number(foodData.protein).toFixed(2)
													: ''}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodData.quantity} {foodData.quantity_unit}
											</span>
										</td>
										<td>
											<TableButton
												action='edit'
												onClick={() => handleEditClick(foodData)}
											/>

											<TableButton
												action='remove'
												onClick={() => deleteFood(foodData._id)}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong>{' '}
													<img
														src={foodData.thumbnail_image ? foodData.thumbnail_image : '-'}
														alt='thumbnail'
														style={{
															width: '80px',
															height: '80px',
															borderRadius: '10px',
														}}
													/>
													<br />
													<strong>{sortableFields[1].title}: </strong> {foodData?.food_name}
													<br />
													<strong>{sortableFields[2].title}: </strong> {foodData.fats}
													<br />
													<strong>{sortableFields[3].title}: </strong> {foodData.calories}
													<br />
													<strong>{sortableFields[4].title}: </strong> {foodData.carbs}
													<br />
													<strong>{sortableFields[5].title}: </strong> {foodData.protein}
													<br />
													<strong>{sortableFields[6].title}: </strong> {foodData.quantity}{' '}
													{foodData.quantity_unit}
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
					{foodData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{foodData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<Modal
				centered
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Food</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowUpdateModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<div className='row'>
							<InputField
								placeholder='Food Name'
								type='text'
								className='col-12 fv-row mb-7'
								name='food_name'
								label='Food Name'
								htmlFor='food_name'
								value={foodAddData?.food_name}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Protein'
								type='number'
								className='col-md-6 fv-row mb-7'
								name='protein'
								label='Protein'
								htmlFor='protein'
								value={foodAddData?.protein}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Carbohydrates'
								type='number'
								className='col-md-6 fv-row mb-7'
								name='carbs'
								label='Carbohydrates'
								htmlFor='carbs'
								value={foodAddData?.carbs}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Calories'
								type='number'
								className='col-md-6 fv-row mb-7'
								name='calories'
								label='Calories'
								htmlFor='calories'
								value={foodAddData?.calories}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Fats'
								type='number'
								className='col-md-6 fv-row mb-7'
								name='fats'
								label='Fats'
								htmlFor='fats'
								value={foodAddData?.fats}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Quantity'
								type='number'
								className='col-md-6 fv-row mb-7'
								name='quantity'
								label='Quantity'
								htmlFor='quantity'
								value={foodAddData?.quantity}
								onChange={handleInputChange}
							/>
							<SelectField
								className='col-md-6 fv-row mb-7'
								label='Quantity Unit'
								name='quantity_unit'
								value={foodAddData?.quantity_unit}
								onChange={handleInputChange}
								htmlFor='quantity_unit'
								options={[
									'GRAM',
									'KILOGRAM',
									'NOS',
									'MILLIGRAM',
									'LITRE',
									'MILLILITER',
									'TABLESPOONS',
									'BOWL',
								]}
							/>
							<div className='col-md-12 fv-row mb-7'>
								<label
									htmlFor='thumbnail_image'
									className='required fw-bold fs-6 mb-5'>
									Upload Thumbnail Image
								</label>
								<input
									type='file'
									name='thumbnail_image'
									className='form-control form-control-solid mb-3 mb-lg-0'
									autoComplete='off'
									onChange={handleInputChange}
								/>
							</div>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action={isEditMode ? 'edit' : 'add'}
							onClick={handleAddFood}
							text={loading ? 'Processing...' : isEditMode ? 'Update' : 'Add'}
							disabled={loading}
						/>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default Food
