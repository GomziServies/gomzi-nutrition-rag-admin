/* eslint-disable jsx-a11y/anchor-is-valid */
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import {
	AddFoodCategory,
	GetFoodCategory,
	RemoveFoodCategory,
	UpdateFoodCategory,
} from '../../../Functions/FWG'
import TableButton from '../../../components/TableButton'

const FoodCategory: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [foodcategoryData, setFoodCategoryData] = useState([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)

	const fetchData = async () => {
		setLoading(true)
		try {
			const foodcategory: any = await GetFoodCategory()
			setFoodCategoryData(foodcategory.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const [foodcategory, setFoodCategory] = useState<{
		id: string
		category: string
	}>({
		id: '',
		category: '',
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFoodCategory({ ...foodcategory, [name]: value })
	}

	const [isEditMode, setIsEditMode] = useState(false)
	const AddCategory = async () => {
		try {
			if (isEditMode) {
				await UpdateFoodCategory(foodcategory)
				toast.success('Category Updated Successfully')
				setShowModal(false)
			} else {
				await AddFoodCategory(foodcategory)
				toast.success('Category Added Successfully')
				setShowModal(false)
			}
			setFoodCategory({ id: '', category: '' })
			fetchData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleEditCategory = (id: string, category: string) => {
		setShowModal(true)
		setFoodCategory({ id, category })
		setIsEditMode(true)
	}

	const handleDeleteCategory = async (_id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover! this category!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveFoodCategory({ id: _id })
					toast.success('Category Deleted Successfully')
					fetchData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const filteredFoodCategoryData = foodcategoryData.filter(
		(foodcategoryData: any) =>
			foodcategoryData.category &&
			foodcategoryData.category.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedFoodCategoryData = filteredFoodCategoryData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	useEffect(() => {
		fetchData()
	}, [])
	return (
		<>
			<PageTitle>Food Category</PageTitle>
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
							onClick={() => setShowModal(true)}
							text="Add"
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
									<th>Category</th>
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
									paginatedFoodCategoryData.map((foodcategoryData: any, index: number) => {
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
														{foodcategoryData.category}
													</span>
												</td>
												<td>
													<TableButton
														action="edit"
														onClick={() => handleEditCategory(foodcategoryData._id, foodcategoryData.category)}
													/>

													<TableButton
														action="remove"
														onClick={() => handleDeleteCategory(foodcategoryData._id)}
													/>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{paginatedFoodCategoryData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedFoodCategoryData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredFoodCategoryData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			{/* Food  Time add Modal*/}
			<Modal
				show={showModal}
				centered
				onHide={() => setShowModal(false)}
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>{isEditMode ? 'Edit Category' : 'Add Category'}</h2>
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
					<div className='modal-body scroll-y'>
						<InputField
							placeholder='Enter Food Category'
							type='text'
							className='fv-row mb-7'
							name='category'
							label='Enter Food Category'
							htmlFor='category'
							value={foodcategory.category}
							onChange={handleInputChange}
						/>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action={isEditMode ? 'edit' : 'add'}
							onClick={AddCategory}
							text={loading ? 'Processing...' : isEditMode ? 'Update' : 'Add'}
							disabled={loading}
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default FoodCategory
