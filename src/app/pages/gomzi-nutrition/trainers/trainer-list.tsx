import React, { useEffect, useRef, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	FileUploadToFGGroup,
	GetTrainers,
	RemoveTrainer,
	UpdateTrainer,
} from '../../../Functions/FGGroup'

const GomziNutritionTrainerDetail: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const trainer_id = searchParams.get('trainer_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [trainerData, setTrainerData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [trainerViewData, setTrainerViewData] = useState({
		admin_id: '',
		name: '',
		mobile: '',
		email: '',
		company: '',
		city: '',
		address: '',
		profile_image: '',
		birthdate: '',
		selectedFile: null as File | null,
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const fetchTrainerData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetTrainers()
			const filteredData = response.data.map((item: any) => ({
				_id: item._id, // admin id
				trainer_id: item.trainer_id,

				name: item.full_name,
				city: item.trainer?.city || '',
				company: item.trainer?.company || '',

				email: item.email,
				mobile: item.mobile,

				address: item.trainer?.address || '',
				birthdate: item.trainer?.birthdate || '',
				profile_image: item.trainer?.profile_image || '',
			}))
			setTrainerData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchTrainerData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchTrainerData()
		}
	}, [searchTerm])

	const handleSubmit = async () => {
		try {
			const {
				admin_id,
				name,
				mobile,
				email,
				city,
				company,
				address,
				birthdate,
				selectedFile,
				profile_image,
			} = trainerViewData

			let imgUrl = ''

			if (selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([selectedFile], {
					directory: 'trainers',
				})

				imgUrl = imageUrl.data?.fileURLs?.[0] || ''

				toast.success('Trainer image uploaded successfully')
			}

			const payload = {
				admin_id,
				type: 'Trainer',
				name,
				mobile,
				email,
				city,
				company,
				address,
				birthdate,
				profile_image: imgUrl || profile_image,
			}

			console.log('UPDATE PAYLOAD', payload)

			await UpdateTrainer(payload)

			toast.success('Trainer Detail Updated Successfully')

			fetchTrainerData()
			setShowModal(false)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const fetchTrainerDataById = async (id: string) => {
		setLoading(true)
		try {
			const response: any = await GetTrainers({ id: id })
			const trainer = response.data[0]

			setTrainerViewData({
				admin_id: trainer.trainer_id,
				name: trainer.full_name || '',
				mobile: trainer.mobile || '',
				email: trainer.email || '',
				city: trainer.trainer?.city || '',
				company: trainer.trainer?.company || '',
				address: trainer.trainer?.address || '',
				profile_image: trainer.trainer?.profile_image || '',
				birthdate: trainer.trainer?.birthdate ? trainer.trainer.birthdate.split('T')[0] : '',
				selectedFile: null,
			})

			setLoading(false)
			setShowModal(true)
		} catch (error) {
			console.error(error)
			setLoading(false)
		}
	}

	useEffect(() => {
		if (trainer_id) {
			fetchTrainerDataById(trainer_id)
		}
	}, [trainer_id])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const target = event.target

		// File upload
		if (
			target instanceof HTMLInputElement &&
			target.type === 'file' &&
			target.files &&
			target.files.length > 0
		) {
			const file = target.files[0]

			console.log('SELECTED FILE:', file)

			setTrainerViewData((prev) => ({
				...prev,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}))

			return
		}

		// Normal fields
		const { name, value } = target

		setTrainerViewData((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}
	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleDeleteTrainer = async (_id: string) => {
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
					await RemoveTrainer({ admin_id: _id })
					toast.success('Trainer Deleted Successfully')
					fetchTrainerData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const sortableFields = [
		{ title: 'Name', field: 'name' },
		{ title: 'Mobile', field: 'mobile' },
		{ title: 'City', field: 'city' },
		{ title: 'Company/Gym', field: 'company' },
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

	return (
		<>
			<PageTitle breadcrumbs={[]}>Trainer List</PageTitle>
			<KTCard>
				<div className='row mx-6 my-4 align-items-center justify-content-between'>
					<div className='col-md-8 col-12'>
						<div className='d-md-flex'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
							<div className='d-md-block d-none'>
								<LengthMenu
									expenseData={trainerData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
						</div>
					</div>
					<div className='col-md-4 col-12 px-0 d-flex justify-content-md-end justify-content-center mb-md-0 mt-4'>
						<div className='d-md-none d-block me-3'>
							<LengthMenu
								expenseData={trainerData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
						<Link to='/rag/add-trainer'>
							<button className='btn btn-sm py-4 btn-primary'>
								<KTIcon
									iconName='plus'
									className='fs-2'
								/>
								Add Trainer
							</button>
						</Link>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={trainerData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(trainer: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={trainer._id}>
									<tr
										onClick={() => handleRowClick(trainer._id)}
										className='data-row'>
										<td className='text-center'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{trainer.name}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{trainer.mobile}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>{trainer.city}</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{trainer.company}
											</span>
										</td>
										<td>
											<div className='d-flex justify-content-center'>
												<TableButton
													action='edit'
													onClick={() => {
														fetchTrainerDataById(trainer._id)
													}}
												/>
												<TableButton
													action='remove'
													onClick={() => handleDeleteTrainer(trainer._id)}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}:</strong> {trainer.name}
													<br />
													<strong>{sortableFields[1].title}:</strong> {trainer.position}
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
					{trainerData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{trainerData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(trainerData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>

				{/* member view modal */}

				<Modal
					show={showModal}
					onHide={() => setShowModal(false)}
					size='lg'
					centered>
					<Modal.Header closeButton>
						<Modal.Title>Edit Trainer Details</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						{/* Form Fields */}
						<form>
							<div className='row'>
								<div className='col-md-4 mb-7'>
									<img
										alt='Photos'
										src={
											trainerViewData.profile_image
												? trainerViewData.profile_image.startsWith('blob:')
													? trainerViewData.profile_image
													: `https://files.fggroup.in/${trainerViewData.profile_image}`
												: '/media/avatars/300-1.jpg'
										}
										style={{ borderRadius: '10px', width: '90%' }}
									/>
									<div>
										<button
											type='button'
											className='mt-5 px-2 py-1 mb-2 btn btn-success'
											onClick={handleFileButtonClick}>
											Upload Photo
										</button>
										<input
											type='file'
											id='fileInput'
											accept='image/*'
											className='d-none'
											onChange={handleInputChange}
										/>
									</div>
								</div>
								<div className='col-md-8 mb-7'>
									<div className='row'>
										<InputField
											placeholder='Name'
											type='text'
											className='col-6 fv-row'
											name='name'
											label='Name'
											htmlFor='name'
											labelMarginRemove
											value={trainerViewData.name}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Mobile No.'
											type='number'
											className='col-6 fv-row'
											name='mobile'
											label='Mobile No.'
											htmlFor='mobile'
											labelMarginRemove
											value={trainerViewData.mobile}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Email'
											type='text'
											className='col-6 fv-row'
											name='email'
											label='Email'
											htmlFor='email'
											labelMarginRemove
											value={trainerViewData.email}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='DOB'
											type='date'
											className='col-6 fv-row'
											name='birthdate'
											label='DOB'
											htmlFor='birthdate'
											labelMarginRemove
											value={trainerViewData.birthdate}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Address'
											type='text'
											className='col-6 fv-row'
											name='address'
											label='Address'
											labelMarginRemove
											htmlFor='address'
											value={trainerViewData.address}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='City'
											type='text'
											className='col-6 fv-row'
											name='city'
											label='City'
											htmlFor='city'
											labelMarginRemove
											value={trainerViewData.city}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Company / Gym'
											type='text'
											className='col-6 fv-row'
											name='company'
											label='Company / Gym'
											htmlFor='company'
											labelMarginRemove
											value={trainerViewData.company}
											onChange={handleInputChange}
										/>
									</div>
								</div>
							</div>
						</form>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant='secondary'
							onClick={() => setShowModal(false)}>
							Close
						</Button>
						<Button
							variant='primary'
							onClick={handleSubmit}>
							Save Changes
						</Button>
					</Modal.Footer>
				</Modal>

				{/* <div
					className='modal fade'
					id='kt_modal_member_view'
					aria-hidden='true'>
					<div className='modal-dialog modal-dialog-centered mw-650px'>
						<div className='modal-content'>
							<div className='modal-header justify-content-between'>
								<h2 className='fw-bolder'>Details: </h2>
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
								<div className='col-md-12'>
									<div className='row'>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Name'
												type='text'
												className='col-12 fv-row mb-7'
												name='name'
												label='Name'
												htmlFor='name'
												value={trainerViewData.name}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<SelectField
												className='col-12 fv-row'
												name='position'
												label='Position'
												htmlFor='position'
												value={trainerViewData.position}
												onChange={(e) => handleInputChange(e)}
												options={[
													'Developer',
													'Marketing',
													'Franchise Owner',
													'Graphic Designer',
													'Sales Manager',
													'Video Editor',
													'Back Office',
													'Trainer',
													'Dietician',
													'Telecalling',
													'Branch Manager',
													'Human Resources',
													'Team Leader',
													'Manager',
													'Director',
													'Social Media Assistant',
												]}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Salary'
												type='text'
												className='col-12 fv-row mb-7'
												name='salary'
												label='Salary'
												htmlFor='salary'
												value={trainerViewData.salary}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Mobile No.'
												type='number'
												className='col-12 fv-row mb-7'
												name='mobile'
												label='Mobile No.'
												htmlFor='mobile'
												value={trainerViewData.mobile}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Address'
												type='text'
												className='col-12 fv-row mb-7'
												name='address'
												label='Address'
												htmlFor='address'
												value={trainerViewData.address}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Account Detail'
												type='number'
												className='col-12 fv-row mb-7'
												name='account_details'
												label='Account Detail'
												htmlFor='account_details'
												value={trainerViewData.account_details}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Email'
												type='text'
												className='col-12 fv-row mb-7'
												name='email'
												label='Email'
												htmlFor='email'
												value={trainerViewData.email}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Upload Photo'
												type='file'
												className='col-12 fv-row mb-7'
												name='photo'
												label='Upload Photo'
												htmlFor='photo'
												onChange={handleFileChange}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Upload Proof'
												type='file'
												className='col-12 fv-row mb-7'
												name='proof'
												label='Upload Proof'
												htmlFor='proof'
												onChange={handleFileChange}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Upload Pdf'
												type='file'
												className='col-12 fv-row mb-7'
												name='document'
												label='Upload Pdf'
												htmlFor='document'
												onChange={handleFileChange}
											/>
										</div>
									</div>
								</div>
							</div>
							<div className='modal-footer justify-content-end'>
								<button
									className='btn btn-primary'
									data-bs-dismiss='modal'
									onClick={handleSubmit}>
									Save Changes
								</button>
							</div>
						</div>
					</div>
				</div> */}
			</KTCard>
		</>
	)
}

export default GomziNutritionTrainerDetail
