/* eslint-disable jsx-a11y/anchor-is-valid */
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import { CreateDietPlan, GetDietPlan, GetFoodCategory, RemoveDietPlan } from '../../../Functions/FWG'
import { useNavigate } from 'react-router-dom'

type Category = {
	_id: string
	category: string
}

const DietsDetails: React.FC = () => {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [dietData, setDietData] = useState([])
	const [metaData, setMetaData] = useState<any>()
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [loading, setLoading] = useState(false)
	const [showDietModal, setShowDietModal] = useState(false)
	const [categories, setCategories] = useState<Category[]>([])
	const [dietFormData, setDietFormData] = useState({
		plan_name: '',
		category_id: '',
		food_type: '' as FoodTypeValue,
		days: '',
	})

	const adminType = localStorage.getItem('admin_type')

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const portalInfo = localStorage.getItem('portal_info')
			const fgGroupInfo = localStorage.getItem('fg_group_info')

			let adminInfo: any = null

			let dietPlansData: any

			if (portalInfo) {
				adminInfo = JSON.parse(portalInfo)

				if (searchTerm) {
					dietPlansData = await GetDietPlan({
						page: page || pagination.page,
						limit: pagination.itemsPerPage,
						search: searchTerm,
						sort,
						// createdById: adminInfo._id,
						sortOrder,
					})
				} else {
					dietPlansData = await GetDietPlan({
						page: page || pagination.page,
						limit: pagination.itemsPerPage,
						sort,
						// createdById: adminInfo._id,
						sortOrder,
					})
				}
			} else if (fgGroupInfo) {
				adminInfo = JSON.parse(fgGroupInfo)
				if (searchTerm) {
					dietPlansData = await GetDietPlan({
						page: page || pagination.page,
						limit: pagination.itemsPerPage,
						search: searchTerm,
						sort,
						sortOrder,
					})
				} else {
					dietPlansData = await GetDietPlan({
						page: page || pagination.page,
						limit: pagination.itemsPerPage,
						sort,
						sortOrder,
					})
				}
			}

			const metaData: any = dietPlansData.metadata
			setMetaData(metaData.pagination)
			setDietData(dietPlansData.data)
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
	
	useEffect(() => {
		fetchData()
		fetchCategories()
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

	const deleteDietBundle = async (dietID: string) => {
		try {
			Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to Remove This Diet.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			}).then(async (result) => {
				if (result.isConfirmed) {
					const response: any = await RemoveDietPlan({ id: dietID })
					if (response.status === 200) {
						setDietData(dietData.filter((diet: any) => diet._id !== dietID))
						toast.success('Diet Remove successfully')
					} else {
						toast.error('Failed to Remove Diet')
					}
				}
			})
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const sortableFields = [
		{ title: 'ID', field: '_id' },
		{ title: 'Diet Plan', field: 'plan_name' },
		{ title: 'Food Category', field: 'category' },
		{ title: 'Diet Type', field: 'food_type' },
		{ title: 'Diet Duration', field: 'days' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleCopy = (id: string) => {
		navigator.clipboard
			.writeText(id)
			.then(() => {
				toast.success('ID copied to clipboard!')
			})
			.catch((err) => {
				console.error('Failed to copy ID: ', err)
				toast.success('Failed to copy ID!')
			})
	}

	const handleKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>, id: string) => {
		if (event.key === 'Enter' || event.key === ' ') {
			handleCopy(id)
		}
	}

	const openDietModal = () => {
		setShowDietModal(true)
	}

	const closeDietModal = () => {
		setShowDietModal(false)
		setDietFormData({
			plan_name: '',
			category_id: '',
			food_type: '' as FoodTypeValue,
			days: '',
		})
	}

	const handleDietFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setDietFormData({
			...dietFormData,
			[name]: name === 'food_type' ? value as FoodTypeValue : value,
		})
	}

	const handleDietFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const formData = {
				...dietFormData,
				days: parseInt(dietFormData.days, 10), // Convert string to number
				food_type: dietFormData.food_type as FoodTypeValue
			}
			const response: any = await CreateDietPlan(formData)
			toast.success('Diet Created Successfully')
			closeDietModal()
			
			// Redirect to assign-food page with the newly created diet ID
			if (response && response.data && response.data._id) {
				navigate(`/fwg/diet-details/assign-food?diet_id=${response.data._id}`)
			} else {
				// Refresh data if there's no ID to redirect with
				fetchData()
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to create diet')
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Diets Details</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<LengthMenu
							expenseData={dietData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='card-toolbar'>
						<button 
							type='button' 
							className='btn btn-sm btn-light-primary' 
							onClick={openDietModal}
						>
							<i className='ki-duotone ki-plus fs-2'></i>Create
						</button>
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
									dietData.map((data: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td
													onClick={() => handleCopy(data._id)}
													onKeyPress={(event) => handleKeyPress(event, data._id)}
													role='button'
													tabIndex={0}>
													<span className='text-dark d-flex fw-bold  d-block mb-1 fs-6'>
														<FontAwesomeIcon
															icon={faCopy}
															className='fs-3 me-2 text-success'
														/>
														{data._id}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.plan_name}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.diet_food_category?.category}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.food_type}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.days}
													</span>
												</td>
												<td>
													<div className='d-flex'>
														<TableButton
															action='edit'
															className='d-flex align-items-center'
															to={`/fwg/diet-details/diet-edit?diet_id=${data._id}`}
														/>

														<TableButton
															action='assign'
															text='Assign'
															className='d-flex align-items-center'
															to={'/fwg/diet-details/assign-food?diet_id=' + data._id}
														/>

														<TableButton
															action='remove'
															onClick={() => deleteDietBundle(data._id)}
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
					{dietData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{dietData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			{/* Diet Creation Modal */}
			{showDietModal && (
				<div className='modal fade show d-block' tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
					<div className='modal-dialog modal-dialog-centered mw-650px'>
						<div className='modal-content'>
							<div className='modal-header pb-0 border-0 mb-10'>
								<h2 className='fw-bold'>Diet</h2>
							</div>

							<div className='modal-body scroll-y px-10 px-lg-15 pt-0 pb-15'>
								<form className='form' onSubmit={handleDietFormSubmit}>
									<div className='mb-7'>
										{/* Two column layout for all fields */}
										<div className='row'>
											{/* Diet Plan */}
											<div className='col-md-6 mb-10'>
												<label className='required form-label'>Diet Plan</label>
												<input
													type='text'
													className='form-control form-control-solid'
													placeholder='Enter Diet Plan'
													name='plan_name'
													value={dietFormData.plan_name}
													onChange={handleDietFormChange}
													required
												/>
											</div>

											{/* Category */}
											<div className='col-md-6 mb-10'>
												<label className='required form-label'>Category</label>
												<select
													className='form-select form-select-solid'
													name='category_id'
													value={dietFormData.category_id}
													onChange={handleDietFormChange}
													required
												>
													<option value=''>Select Category</option>
													{categories.map((category) => (
														<option key={category._id} value={category._id}>
															{category.category}
														</option>
													))}
												</select>
											</div>

											{/* Food Type */}
											<div className='col-md-6 mb-10'>
												<label className='required form-label'>Food Type</label>
												<select
													className='form-select form-select-solid'
													name='food_type'
													value={dietFormData.food_type}
													onChange={handleDietFormChange}
													required
												>
													<option value=''>Select</option>
													<option value='VEGETARIAN'>VEGETARIAN</option>
													<option value='NON-VEGETARIAN'>NON-VEGETARIAN</option>
													<option value='VEGAN'>VEGAN</option>
												</select>
											</div>

											{/* Total Day (Duration) */}
											<div className='col-md-6 mb-10'>
												<label className='required form-label'>Total Day (Duration)</label>
												<input
													type='number'
													className='form-control form-control-solid'
													placeholder='Duration'
													name='days'
													value={dietFormData.days}
													onChange={handleDietFormChange}
													required
												/>
											</div>
										</div>
									</div>

									{/* Action buttons */}
									<div className='text-end'>
										<button 
											type='button' 
											className='btn btn-light me-3' 
											onClick={closeDietModal}
										>
											Cancel
										</button>
										<button 
											type='submit' 
											className='btn btn-primary'
										>
											<span className='indicator-label'>Create</span>
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default DietsDetails
