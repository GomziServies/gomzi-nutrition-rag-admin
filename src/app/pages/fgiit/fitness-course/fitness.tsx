import { faCopy, faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	FileUploadToFGGroup,
	GetFitnessCourse,
	UpdateFitnessCourse,
} from '../../../Functions/FGGroup'

type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'

const FitnessCourses: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const course_id = searchParams.get('course_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [fitnessData, setFitnessData] = useState<any>([])
	const [sort, setSort] = useState('amount')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [selectedSubject, setSelectedSubject] = useState('')
	const [fitnessCourseData, setFitnessCourseData] = useState<any>({
		_id: '',
		course_name: '',
		image_url: '',
		description: '',
		currency: '',
		amount: '',
		editImage: false,
		selectedFile: null as File | null,
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchFitnessData = async (page?: number) => {
		setLoading(true)
		try {
			const response = await GetFitnessCourse({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: selectedSubject || searchTerm,
				sort,
				sortOrder,
			})
			let filteredData: any = response.data

			// if (selectedSubject) {
			// 	// filteredData = filteredData.filter((lecture: any) =>
			// 	// 	lecture.course_name.some((course: any) => course.course_name === selectedSubject)
			// 	// )
			// }
			setFitnessData(filteredData)
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setLoading(false)
	}

	const fetchCourseDataById = async (id: string) => {
		setLoading(true)
		try {
			const response: any = await GetFitnessCourse({ id })
			setFitnessCourseData(response.data[0])
			setLoading(false)
			setShowModal(true)
		} catch (error) {
			console.error(error)
			setLoading(false)
		}
	}

	useEffect(() => {
		if (course_id) {
			fetchCourseDataById(course_id)
		}
	}, [course_id])

	useEffect(() => {
		fetchFitnessData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedSubject])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchFitnessData()
		}
	}, [searchTerm])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		if (name === 'image_url' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setFitnessCourseData((prevData: any) => ({
				...prevData,
				selectedFile: file,
				image_url: URL.createObjectURL(file),
				editImage: true,
			}))
		} else {
			setFitnessCourseData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handleUpdateFitnessCourse = async () => {
		try {
			let imgUrl = ''

			if (fitnessCourseData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([fitnessCourseData.selectedFile], {
					directory: 'files',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Fitness Course Image uploaded successfully')
			}

			const payload: any = {
				id: fitnessCourseData._id,
				course_name: fitnessCourseData.course_name,
				image_url: imgUrl,
				description: fitnessCourseData.description,
				amount: fitnessCourseData.amount,
			}
			await UpdateFitnessCourse(payload)
			toast.success('Fitness Updated Successfully')
			fetchFitnessData()
			setShowModal(false)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const setViewData = (
		_id: any,
		course_name: any,
		currency: any,
		amount: any,
		image_url: any,
		description: any
	) => {
		const data = { _id, course_name, currency, amount, image_url, description }
		setFitnessCourseData(data)
		setShowModal(true)
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Course Name', field: 'course_name' },
		{ title: 'Course Image', field: 'image_url' },
		{ title: 'Description', field: 'description' },
		{ title: 'Category and Type', field: 'course_category' },
		{ title: 'Duration', field: 'duration_days' },
		{ title: 'Price', field: 'amount' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
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

	const getCurrencySymbol = (currency: CurrencyCode) => {
		const currencySymbols: Record<CurrencyCode, string> = {
			INR: '₹',
			USD: '$',
			EUR: '€',
			GBP: '£',
		}
		return currencySymbols[currency] || currency
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

	const navigate = useNavigate()

	const handleNavigate = (_id: string) => {
		navigate(`/fgiit/fitness-courses-view?course_id=${_id}`)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Fitness Courses</PageTitle>
			<KTCard>
				<div className='row mx-2 mt-5 align-items-center justify-content-between'>
					<div className='col-md-6 mt-md-1 mt-3 order-md-0 order-1'>
						<LengthMenu
							expenseData={fitnessData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='col-md-6 d-flex mt-8 justify-content-end order-md-1 order-0'>
						<SelectField
							className='col-7 fv-row mb-7 me-5'
							label='Subject'
							showLabel={false}
							name='Filter Subject'
							value={selectedSubject}
							onChange={(e) => setSelectedSubject(e.target.value)}
							htmlFor='Filter Subject'
							options={[
								'Anabolic Androgenic Steroids',
								'Diploma In Nutrition Course',
								'Nutri Trainer',
								'Injury Rehabilitation Masterclass',
								'Group Instructor Masterclass',
								'Diploma In Nutrition',
								'Advance Clinical Nutrition',
								'Mix Martial Arts Workshop',
								'Anabolic Androgenic Steroids Masterclass',
								'Functional Training Workshop',
								'Diploma In Personal Training',
								'Powerlifting Coach Workshop',
								'Diploma In Business Management',
								'Tabata Workshop',
								'Certified Nutrition Course',
								'TRX band workshop',
								'Python Programming',
								'Injury Rehabilitation Workshop',
								'Injury Rehab Course',
								'Certified Personal Trainer',
								'Flexible Learning',
								'Certified Wellness Consultant',
								'Gym Management Course',
								'Digital Marketing',
								'Tabata & Functional Trainer',
								'Tabata & Functional Workshop',
								'Group Instructor Workshop',
							]}
						/>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={fitnessData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={item._id}>
									<tr
										onClick={() => handleRowClick(item._id)}
										className='data-row'>
										<td className='text-center'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td
											onClick={() => handleCopy(item._id)}
											onKeyPress={(event) => handleKeyPress(event, item._id)}
											role='button'
											tabIndex={0}>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{item.course_name}
												</span>
												<div className='d-flex'>
													<FontAwesomeIcon
														icon={faCopy}
														className='fs-3 me-2 text-success'
													/>
													<span className='fs-6'>{item._id}</span>
												</div>
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												{item.image_url && (
													<div className='symbol symbol-45px me-5'>
														<img
															src={`https://files.fggroup.in/${item.image_url}`}
															alt={item.course_name}
															style={{ width: '50px', height: '50px' }}
														/>
													</div>
												)}
											</div>
										</td>
										<td>
											<span
												className='text-dark fw-bold text-hover-primary d-md-block d-none mb-1 fs-6'
												onClick={() => toggleDescription(index)}
												title={item.description}
												style={{ cursor: 'pointer' }}>
												{item.description
													? expandedDescription[index]
														? item.description
														: truncateString(item.description, 25)
													: '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.course_category + ' - ' + item.coaching_mode}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.duration_days} Days
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{getCurrencySymbol(item.currency)} {item.amount}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												// onClick={() =>
												// 	setViewData(
												// 		item._id,
												// 		item.course_name,
												// 		item.currency,
												// 		item.amount,
												// 		item.image_url,
												// 		item.description
												// 	)
												// }
												onClick={() => handleNavigate(item._id)}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong> {item._id}
													<br />
													<strong>{sortableFields[1].title}: </strong> {item.course_name}
													<br />
													<strong>{sortableFields[2].title}: </strong> {item.course_category}
													<br />
													<strong>{sortableFields[3].title}: </strong> {item.coaching_mode}
													<br />
													<strong>{sortableFields[4].title}: </strong> {item.duration_days}
													<br />
													<strong>{sortableFields[5].title}: </strong> ₹ {item.amount}{' '}
													{item.currency}
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
					{fitnessData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{fitnessData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<Modal
				show={showModal}
				centered
				onHide={() => setShowModal(false)}
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Fitness Course</h2>
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
							<CopyableInput
								placeholder='Course Id'
								type='text'
								className='col-12 fv-row mb-7'
								name='_id'
								label='Course Id'
								htmlFor='_id'
								value={fitnessCourseData._id}
							/>
							<InputField
								placeholder='Course Name'
								type='text'
								className='col-12 fv-row mb-7'
								name='course_name'
								label='Course Name'
								htmlFor='course_name'
								value={fitnessCourseData.course_name}
								onChange={(e) => handleInputChange(e)}
							/>
							<InputField
								placeholder='Description'
								type='text'
								className='col-12 fv-row mb-7'
								name='description'
								label='Description'
								htmlFor='description'
								value={fitnessCourseData.description}
								onChange={(e) => handleInputChange(e)}
							/>
							<InputField
								placeholder='Course Image'
								type='file'
								className='col-12 fv-row mb-7'
								name='image_url'
								label='Course Image'
								htmlFor='image_url'
								// value={fitnessCourseData.image_url}
								onChange={(e) => handleInputChange(e)}
							/>
							{/* <img
								alt='Users'
								src={
									fitnessCourseData.image_url
										? fitnessCourseData.editImage == true
											? fitnessCourseData.image_url
											: `https://files.fggroup.in/${fitnessCourseData.image_url}`
										: '/media/avatars/300-1.jpg'
								}
								style={{ borderRadius: '10px', width: '90%' }}
							/>
							<div>
								<button
									type='button'
									className='mt-5 px-2 py-1 mb-2 btn btn-success'
									onClick={handleFileButtonClick}>
									Change Image
								</button>
								<input
									id='fileInput'
									type='file'
									style={{ display: 'none' }}
									onChange={handleInputChange}
								/>
							</div> */}
							<InputField
								placeholder='Currency'
								type='text'
								className='col-12 fv-row mb-7'
								name='currency'
								label='Currency (Contact developer to change currency)'
								htmlFor='currency'
								value={fitnessCourseData.currency}
								onChange={(e) => handleInputChange(e)}
								disabled
							/>
							<InputField
								placeholder='Amount'
								type='number'
								className='col-12 fv-row mb-7'
								name='amount'
								label='Amount'
								htmlFor='amount'
								value={fitnessCourseData.amount}
								onChange={(e) => handleInputChange(e)}
							/>
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<div data-bs-dismiss='modal'>
							<TableButton
								action='edit'
								onClick={() => handleUpdateFitnessCourse()}
								text='Save Changes'
								backgroundDark={true}
							/>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}
export default FitnessCourses
