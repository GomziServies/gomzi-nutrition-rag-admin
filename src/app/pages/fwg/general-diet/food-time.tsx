/* eslint-disable jsx-a11y/anchor-is-valid */
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { AddFoodTime, GetFoodTime, RemoveFoodTime, UpdateFoodTime } from '../../../Functions/FWG'

const FoodTime: React.FC = () => {
	const intl = useIntl()
	const [searchTerm, setSearchTerm] = useState('')
	const [foodData, setFoodData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [foodAddData, setFoodAddData] = useState<any>({ food_time: '' })
	const [foodEditData, setFoodEditData] = useState<any>({ id: '', food_time: '' })

	useEffect(() => {
		fetchData()
	}, [])

	const fetchData = async () => {
		setLoading(true)
		try {
			const foodResponse: any = await GetFoodTime()
			setFoodData(foodResponse.data)
		} catch (error: any) {
			toast.error(error.message)
		}
		setLoading(false)
	}

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredfoodData = foodData.filter(
		(food: any) => food.food_time && food.food_time.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedfoodData = filteredfoodData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleDeleteData = async (id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover! this data!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveFoodTime({ id: id })
					toast.success('Food Data Removed Successfully')
					fetchData()
				} catch (error: any) {
					toast.error(error.message)
				}
			}
		})
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFoodEditData({ ...foodEditData, [name]: value })
	}

	const handleAddInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFoodAddData({ ...foodAddData, [name]: value })
	}

	const handleSubmit = async () => {
		try {
			await AddFoodTime(foodAddData)

			fetchData()
			toast.success('Food Time Added Successfully')
			setFoodAddData({ food_time: '' })
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleUpdate = async () => {
		try {
			await UpdateFoodTime(foodEditData)

			fetchData()
			toast.success('Food Time Update Successfully')
			setFoodEditData({ food_time: '' })
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Food time</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
					<div className='card-toolbar'>
						<div
							data-bs-toggle='modal'
							data-bs-target='#kt_modal_food_time'>
							<TableButton
								action='add'
								text='Add'
							/>
						</div>
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
									<th>Food-Time</th>
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
									paginatedfoodData.map((foodtime: any, index: number) => (
										<tr key={foodtime.id}>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{index + 1}</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{foodtime.food_time}
												</span>
											</td>
											<td>
												<div className='d-flex justify-content-center'>
													<div
														data-bs-toggle='modal'
														data-bs-target='#kt_modal_food_time_update'>
														<TableButton
															action='edit'
															onClick={() =>
																setFoodEditData({ id: foodtime._id, food_time: foodtime.food_time })
															}
														/>
													</div>

													<TableButton
														action='remove'
														onClick={() => handleDeleteData(foodtime._id)}
													/>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
					{paginatedfoodData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedfoodData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredfoodData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			{/* Food Time add Modal*/}
			<div
				className='modal fade'
				id='kt_modal_food_time'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-500px'>
					<div className='modal-content'>
						<div className='modal-header justify-content-between'>
							<h2 className='fw-bolder'>Add Food Time</h2>
							<div
								className='btn btn-sm btn-icon btn-active-color-primary'
								data-bs-dismiss='modal'>
								<FontAwesomeIcon
									className='fs-1 position-absolute ms-3'
									icon={faXmark}
								/>
							</div>
						</div>
						<div className='modal-body scroll-y'>
							<div className='fv-row mb-7'>
								<label
									htmlFor='food_time'
									className='required fw-bold fs-6 mb-5'>
									Food Time
								</label>
								<input
									placeholder='Enter Food Time'
									type='text'
									className='form-control form-control-solid mb-3 mb-lg-0'
									name='food_time'
									value={foodAddData.food_time}
									onChange={handleAddInputChange}
								/>
							</div>
						</div>
						<div
							className='modal-footer justify-content-end'
							data-bs-dismiss='modal'>
							<TableButton
								action='add'
								text='Add'
								onClick={handleSubmit}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Food Time update Modal*/}
			<div
				className='modal fade'
				id='kt_modal_food_time_update'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-500px'>
					<div className='modal-content'>
						<div className='modal-header justify-content-between'>
							<h2 className='fw-bolder'>Edit Food Time</h2>
							<div
								className='btn btn-sm btn-icon btn-active-color-primary'
								data-bs-dismiss='modal'>
								<FontAwesomeIcon
									className='fs-1 position-absolute ms-3'
									icon={faXmark}
								/>
							</div>
						</div>
						<div className='modal-body scroll-y'>
							<div className='fv-row mb-7'>
								<label
									htmlFor='food_time'
									className='required fw-bold fs-6 mb-5'>
									Food Time
								</label>
								<input
									placeholder='Enter Food Time'
									type='text'
									className='form-control form-control-solid mb-3 mb-lg-0'
									name='food_time'
									value={foodEditData.food_time}
									onChange={handleInputChange}
								/>
							</div>
						</div>
						<div className='modal-footer justify-content-end'>
							<div
								className='modal-footer justify-content-end'
								data-bs-dismiss='modal'>
								<TableButton
									action='edit'
									text='Update'
									onClick={handleUpdate}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default FoodTime
