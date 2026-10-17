import React, { useEffect, useRef, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon, toAbsoluteUrl } from '../../../../_metronic/helpers'
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
import '../common-management.css'

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
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Trainer List</PageTitle>

			<nav className='gz-mgmt-breadcrumb'>
				<a href='/rag/dashboard'>Dashboard</a>
				<span>/</span>
				<a href='/rag/trainer-list'>Trainers</a>
				<span>/</span>
				<span>Trainer Directory</span>
			</nav>

			<div className='gz-mgmt-header mb-6'>
				<div>
					<h1 className='gz-mgmt-title'>Trainer Directory</h1>
					<p className='gz-mgmt-subtitle'>
						Manage certified fitness trainers, assigned gym affiliations, nutrition coaches, and credentials
					</p>
				</div>
				<Link to='/rag/add-trainer' style={{ textDecoration: 'none' }}>
					<button type='button' className='gz-mgmt-btn-primary'>
						<i className='bi bi-plus-lg me-2'></i>
						Add Trainer
					</button>
				</Link>
			</div>

			<div className='gz-mgmt-card'>
				<div className='gz-mgmt-toolbar flex-wrap gap-3'>
					<div className='gz-mgmt-toolbar-left flex-wrap gap-3'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							className='me-0'
						/>
						<LengthMenu
							expenseData={trainerData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							className='me-0'
						/>
					</div>
				</div>

				<div className='card-body p-0'>
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
										className='data-row'
									>
										<td className='text-center'>
											<span className='fw-bold text-muted fs-7'>{actualIndex}</span>
										</td>
										<td>
											<div className='gz-mgmt-identity-cell'>
												<img
													src={
														trainer?.profile_image
															? `https://files.fggroup.in/${trainer?.profile_image}`
															: toAbsoluteUrl('/media/avatars/300-1.jpg')
													}
													alt={trainer?.name}
													className='gz-mgmt-avatar'
													onError={(e) => {
														const target = e.currentTarget
														target.style.display = 'none'
														if (target.nextElementSibling) {
															(target.nextElementSibling as HTMLElement).style.display = 'flex'
														}
													}}
												/>
												<div
													className='gz-mgmt-avatar-fallback'
													style={{ display: 'none' }}
												>
													{(trainer?.name || 'T').charAt(0).toUpperCase()}
												</div>
												<div className='gz-mgmt-identity-info'>
													<span className='gz-mgmt-identity-name'>
														{trainer?.name || 'Unnamed Trainer'}
													</span>
													<span className='gz-mgmt-identity-sub'>
														{trainer?.email || 'No email provided'}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='fw-semibold text-dark fs-7'>
												{trainer?.mobile ? (
													<span className='d-inline-flex align-items-center gap-1'>
														<i className='bi bi-telephone text-primary fs-8'></i>
														{trainer.mobile}
													</span>
												) : '-'}
											</span>
										</td>
										<td>
											{trainer?.city ? (
												<span className='gz-mgmt-pill info'>
													{trainer.city}
												</span>
											) : (
												<span className='text-muted'>-</span>
											)}
										</td>
										<td>
											{trainer?.company ? (
												<span className='gz-mgmt-pill success'>
													{trainer.company}
												</span>
											) : (
												<span className='text-muted'>-</span>
											)}
										</td>
										<td>
											<div className='d-flex justify-content-center gap-2'>
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
												<div className='p-4' style={{ background: '#F8FAFC', borderRadius: '8px' }}>
													<strong>Name:</strong> {trainer.name}<br />
													<strong>Mobile:</strong> {trainer.mobile}<br />
													<strong>City:</strong> {trainer.city}<br />
													<strong>Company/Gym:</strong> {trainer.company}
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
						<div className='d-flex text-center w-100 align-content-center justify-content-center py-10 text-muted'>
							<b>No trainers found</b>
						</div>
					)}
					{trainerData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(trainerData.length / pagination.itemsPerPage) || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>

			{/* Edit Trainer Modal */}
			<Modal
				show={showModal}
				onHide={() => setShowModal(false)}
				size='lg'
				centered
			>
				<Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0', padding: '20px 24px' }}>
					<Modal.Title style={{ color: '#0F172A', fontWeight: 700, fontSize: '18px' }}>
						Edit Trainer Profile
					</Modal.Title>
				</Modal.Header>
				<Modal.Body style={{ padding: '24px' }}>
					<form>
						<div className='row g-4'>
							<div className='col-md-4 text-center'>
								<img
									alt={trainerViewData.name || 'Trainer photo'}
									src={
										trainerViewData.profile_image
											? trainerViewData.profile_image.startsWith('blob:')
												? trainerViewData.profile_image
												: `https://files.fggroup.in/${trainerViewData.profile_image}`
											: '/media/avatars/300-1.jpg'
									}
									style={{
										width: '120px',
										height: '120px',
										objectFit: 'cover',
										borderRadius: '16px',
										border: '2px solid #E2E8F0',
										boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
									}}
								/>
								<div className='mt-4'>
									<button
										type='button'
										className='gz-mgmt-btn-secondary'
										style={{ padding: '6px 14px', fontSize: '13px' }}
										onClick={handleFileButtonClick}
									>
										<i className='bi bi-camera me-1'></i> Change Photo
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
							<div className='col-md-8'>
								<div className='row g-3'>
									<div className='col-6'>
										<InputField
											placeholder='Name'
											type='text'
											className='col-12 fv-row'
											name='name'
											label='Name'
											htmlFor='name'
											labelMarginRemove
											value={trainerViewData.name}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-6'>
										<InputField
											placeholder='Mobile No.'
											type='number'
											className='col-12 fv-row'
											name='mobile'
											label='Mobile No.'
											htmlFor='mobile'
											labelMarginRemove
											value={trainerViewData.mobile}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-6'>
										<InputField
											placeholder='Email'
											type='text'
											className='col-12 fv-row'
											name='email'
											label='Email'
											htmlFor='email'
											labelMarginRemove
											value={trainerViewData.email}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-6'>
										<InputField
											placeholder='DOB'
											type='date'
											className='col-12 fv-row'
											name='birthdate'
											label='DOB'
											htmlFor='birthdate'
											labelMarginRemove
											value={trainerViewData.birthdate}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-6'>
										<InputField
											placeholder='City'
											type='text'
											className='col-12 fv-row'
											name='city'
											label='City'
											htmlFor='city'
											labelMarginRemove
											value={trainerViewData.city}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-6'>
										<InputField
											placeholder='Company / Gym'
											type='text'
											className='col-12 fv-row'
											name='company'
											label='Company / Gym'
											htmlFor='company'
											labelMarginRemove
											value={trainerViewData.company}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-12'>
										<InputField
											placeholder='Address'
											type='text'
											className='col-12 fv-row'
											name='address'
											label='Address'
											labelMarginRemove
											htmlFor='address'
											value={trainerViewData.address}
											onChange={handleInputChange}
										/>
									</div>
								</div>
							</div>
						</div>
					</form>
				</Modal.Body>
				<Modal.Footer style={{ borderTop: '1px solid #E2E8F0', padding: '16px 24px' }}>
					<button
						type='button'
						className='gz-mgmt-btn-secondary'
						onClick={() => setShowModal(false)}
					>
						Cancel
					</button>
					<button
						type='button'
						className='gz-mgmt-btn-primary'
						onClick={handleSubmit}
					>
						Save Changes
					</button>
				</Modal.Footer>
			</Modal>
		</div>
	)
}

export default GomziNutritionTrainerDetail
