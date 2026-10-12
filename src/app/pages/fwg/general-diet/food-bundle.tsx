/* eslint-disable jsx-a11y/anchor-is-valid */
import {
	faEye,
	faPlusCircle,
	faUpRightFromSquare,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import ReactPlayer from 'react-player'
import { Link, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectFieldManual from '../../../components/SelectFieldManual'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	AddFoodBundle,
	GetFoodBundle,
	GetFoodCategory,
	GetFoodTime,
	RemoveFoodBundle,
	UpdateFoodBundle,
} from '../../../Functions/FWG'

type Category = {
	_id: string
	category: string
}

type Times = {
	_id: string
	food_time: string
}

const FoodBundle: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const Bundle_id = searchParams.get('id')
	const [searchTerm, setSearchTerm] = useState('')
	const [foodData, setFoodData] = useState<any[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [times, setTimes] = useState<Times[]>([])
	const [isEditMode, setIsEditMode] = useState(false)
	const [editFoodId, setEditFoodId] = useState<string | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [formData, setFormData] = useState({
		bundle_name: '',
		list_category: '',
		list_time: '',
		video_url: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			let response: any
			if (searchTerm) {
				response = await GetFoodBundle({
					page: page || pagination.page,
					limit: pagination.itemsPerPage,
					search: searchTerm,
					sort,
					sortOrder,
				})
			} else {
				response = await GetFoodBundle({
					page: page || pagination.page,
					limit: pagination.itemsPerPage,
					sort,
					sortOrder,
				})
			}
			setFoodData(response.data)
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
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
		fetchData()
	}, [pagination.page, pagination.itemsPerPage, searchTerm])

	useEffect(() => {
		fetchCategories()
		fetchTime()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleAddBundle = async () => {
		try {
			const payload: any = {
				bundle_name: formData.bundle_name,
				food_category_id: formData.list_time,
				food_time_id: formData.list_category,
				video_url: formData.video_url,
			}

			if (isEditMode && editFoodId) {
				payload.id = editFoodId
				await UpdateFoodBundle(payload)
				toast.success('Bundle Updated Successfully')
			} else {
				await AddFoodBundle(payload)
				toast.success('Bundle Added Successfully')
			}

			setShowModal(false)
			setFormData({
				bundle_name: '',
				list_category: '',
				list_time: '',
				video_url: '',
			})
			fetchData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const deleteFoodBundle = async (foodID: string, bundleName: any) => {
		try {
			Swal.fire({
				title: 'Are you sure?',
				text: `You are about to remove ${bundleName} bundle.`,
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			}).then(async (result) => {
				if (result.isConfirmed) {
					const response: any = await RemoveFoodBundle({ id: foodID })
					if (response.status === 200) {
						setFoodData(foodData.filter((food: any) => food._id !== foodID))
						toast.success('Bundle Remove successfully')
					} else {
						toast.error('Failed to Remove Food Bundle')
					}
				}
			})
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const fetchCourseDataById = async (id: string) => {
		setLoading(true)
		try {
			const response: any = await GetFoodBundle({ id })
			setFormData({
				bundle_name: response.data.bundle_name || '',
				list_category: response.data.food_time?.[0]?._id || '',
				list_time: response.data.food_category?._id || '',
				video_url: response.data.video_url || '',
			})

			setEditFoodId(response.data._id)
			setLoading(false)
			setShowModal(true)
			setIsEditMode(true)
		} catch (error) {
			console.error(error)
			setLoading(false)
		}
	}

	useEffect(() => {
		if (Bundle_id) {
			fetchCourseDataById(Bundle_id)
		}
	}, [Bundle_id])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const timeOption = times.map((data: any) => ({
		value: data._id,
		name: data.food_time,
	}))

	const categoriesOption = categories.map((data: any) => ({
		value: data._id,
		name: data.category,
	}))

	const openModalWithData = (data: any) => {
		setFormData({
			bundle_name: data.bundle_name || '',
			list_category: data.food_time?.[0]?._id || '',
			list_time: data.food_category?._id || '',
			video_url: data.video_url || '',
		})
		setEditFoodId(data._id)
		setShowModal(true)
		setIsEditMode(true)
	}

	const sortableFields = [
		{ title: 'Bundle Name', field: 'bundle_name' },
		{ title: 'Bundle Item', field: 'foodName' },
		{ title: 'Category', field: 'category' },
		{ title: 'Time', field: 'food_time' },
		{ title: 'Video', field: 'video' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
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

	const [videoData, setVideoData] = useState<any>('')
	const [videoModal, setVideoModal] = useState(false)
	const [videoUrlMap, setVideoUrlMap] = useState<{ [key: string]: string }>({})

	const handleVideo = (video_url: string) => {
		setVideoData(video_url)
		setVideoModal(true)
	}

	const isYouTubeURL = (url: string): boolean => {
		const youtubeRegex =
			/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/).+$/
		return youtubeRegex.test(url)
	}

	const [editFoodBundle, setEditFoodBundle] = useState({
		bundle_name: '',
		list_category: '',
		list_time: '',
		video_url: '',
	})

	const bundle_id: string | any = searchParams.get('bundle_id')

	const handleEditFoodBundle = async (data: any, video_url: any) => {
		try {
			const payload: any = {
				bundle_name: data.bundle_name,
				food_category_id: data.food_category_id,
				food_time_id: data.food_time_id,
				video_url: video_url ? video_url : editFoodBundle.video_url,
			}

			payload.id = data._id
			await UpdateFoodBundle(payload)
			toast.success('Bundle Updated Successfully')

			setEditFoodBundle({
				bundle_name: '',
				list_category: '',
				list_time: '',
				video_url: '',
			})
			fetchData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleEditInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setEditFoodBundle((prevState) => ({
			...prevState,
			[name]: value,
		}))
	}

	const handleVideoUrlChange = (id: string, value: string) => {
		setVideoUrlMap((prev) => ({
			...prev,
			[id]: value, // Update the specific video URL for the corresponding item
		}))
	}

	return (
		<>
			<PageTitle>Food Bundle Details</PageTitle>
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
							onClick={() => {
								setIsEditMode(false)
								setShowModal(true)
							}}
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
							renderRow={(food: any, index: number, actualIndex: number, isVisible: boolean) => {
								const foodItems = food.bundle_items.map((item: any) => ({
									foodName: item.food?.food_name,
									id: item?.food?._id,
								}))
								return (
									<React.Fragment key={food._id}>
										<tr
											onClick={() => handleRowClick(food._id)}
											className='data-row'>
											<td className='text-center'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-1 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											</td>
											<td>
												<span
													className='text-dark fw-bold  d-md-block d-none mb-1 fs-6'
													onClick={() => toggleDescription(index)}
													title={food.bundle_name}
													style={{ cursor: 'pointer' }}>
													{expandedDescription[index]
														? food.bundle_name
														: truncateString(food.bundle_name, 30)}
												</span>
												<span
													className='text-dark fw-bold  d-md-none d-block mb-1 fs-6'
													style={{ cursor: 'pointer' }}
													title={food.bundle_name}
													onClick={() => toggleDescription(index)}>
													{expandedDescription[index]
														? food.bundle_name
														: truncateString(food.bundle_name, 30)}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													<ul>
														{foodItems.map(
															(item: { foodName: string; id: string }, itemIndex: number) => (
																<Link
																	key={item.id}
																	to={`/fwg/food-details?food_id=${item.id}`}
																	className='d-flex'>
																	<FontAwesomeIcon
																		icon={faUpRightFromSquare}
																		className='me-7 fs-5'
																	/>
																	<li
																		key={itemIndex}
																		className='text-dark fw-bold  mb-1 fs-6'>
																		{item.foodName}
																	</li>
																</Link>
															)
														)}
													</ul>
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{food.food_category?.category}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{food?.food_time[0]?.food_time}
												</span>
											</td>
											<td>
												<div className='d-flex align-items-center'>
													<div>
														{food.video_url ? (
															<button
																className='btn gap-2 btn-light-success mx-2 btn-sm me-1 d-flex align-items-center'
																onClick={() => handleVideo(food.video_url)}>
																<FontAwesomeIcon
																	icon={faEye}
																	className='fs-3'
																/>{' '}
																Watch Video
															</button>
														) : (
															'-'
														)}
													</div>
													{/* <InputField
														placeholder='Video URL'
														type='text'
														className='col-md-8 fv-row'
														name={`video_url_${food._id}`}
														showLabel={false}
														label='Video URL'
														htmlFor={`video_url_${food._id}`}
														value={videoUrlMap[food._id] || food.video_url || ''}
														onChange={(e) => handleVideoUrlChange(food._id, e.target.value)}
													/>
													<div>
														<TableButton
															action='edit'
															onClick={() =>
																handleEditFoodBundle(food, videoUrlMap[food._id] || food.video_url)
															}
															backgroundDark={true}
														/>
													</div> */}
												</div>
											</td>
											<td>
												<div className='d-flex'>
													<TableButton
														action='view'
														to={`/fwg/food-bundle-item?bundle_id=${food._id}`}
													/>

													<TableButton
														action='remove'
														onClick={() => deleteFoodBundle(food._id, food.bundle_name)}
													/>
												</div>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div>
														<strong>{sortableFields[0].title}:</strong> {food.name}
														<br />
														<strong>{sortableFields[1].title}:</strong> {food.email}
														<br />
														<strong>{sortableFields[2].title}:</strong> {food.mobile}
														<br />
														<strong>{sortableFields[3].title}:</strong> {food.subject}
														<br />
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								)
							}}
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

			{/* Food Bundle add Modal*/}
			<Modal
				show={showModal}
				centered
				onHide={() => setShowModal(false)}
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Food Bundle</h2>
						<button
							onClick={() => setShowModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<div className='row'>
							<InputField
								placeholder='Bundle Name'
								type='text'
								className='col-md-12 fv-row mb-7'
								name='bundle_name'
								label='Bundle Name'
								htmlFor='bundle_name'
								value={formData.bundle_name}
								onChange={handleInputChange}
							/>
							<SelectFieldManual
								className='col-md-6 fv-row mb-7'
								label='Time'
								name='list_category'
								value={formData.list_category}
								onChange={handleInputChange}
								htmlFor='list_category'
								options={timeOption}
							/>
							<SelectFieldManual
								className='col-md-6 fv-row mb-7'
								label='Categories'
								name='list_time'
								value={formData.list_time}
								onChange={handleInputChange}
								htmlFor='list_time'
								options={categoriesOption}
							/>
							<InputField
								placeholder='Video URL'
								type='text'
								className='col-md-12 fv-row mb-7'
								name='video_url'
								label='Video URL'
								htmlFor='video_url'
								value={formData.video_url}
								onChange={handleInputChange}
							/>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action={isEditMode ? 'edit' : 'add'}
							onClick={handleAddBundle}
							text={loading ? 'Processing...' : isEditMode ? 'Update' : 'Add'}
							disabled={loading}
						/>
					</div>
				</div>
			</Modal>

			{/* Video Modal */}
			<Modal
				centered
				show={videoModal}
				onHide={() => setVideoModal(false)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Video</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setVideoModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='p-4'>
						{isYouTubeURL(videoData) ? (
							<ReactPlayer
								url={videoData}
								width={'100%'}
							/>
						) : (
							<p className='text-center fs-2 mb-0 p-3'>Video not found</p>
						)}
					</div>
				</div>
			</Modal>
		</>
	)
}

export default FoodBundle
