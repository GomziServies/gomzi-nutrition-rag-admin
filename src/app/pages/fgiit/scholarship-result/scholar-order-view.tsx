import {
	faAngleDown,
	faCopy,
	faDownload,
	faEye,
	faPencil,
	faPlus,
	faTrash,
	faUpload,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { BASE_URL } from '../../../constants/fg_group_endpoints'
import {
	CreateCertificate,
	DeleteCertificate,
	ExtendFitnessCourseValidity,
	FileUploadToFGGroup,
	GenerateCertificate,
	GenerateQRCertificate,
	GetOrders,
	GetUserFitnessCourses,
	RemoveExtendedValidity,
	UpdateFitnessCourseCertificate,
} from '../../../Functions/FGGroup'

type User = {
	_id: string
	uid: string
	first_name: string
	last_name: string
	email: string
	mobile: string
}

type FitnessCourse = {
	course_name: string
	amount: number
	currency: string
	duration_days: number
}

type ValidityExtension = {
	fitness_course: FitnessCourse
	createdAt: string
	end_date: string
}

type UserData = {
	user: User
	fitness_course: FitnessCourse
	createdAt: string
	end_date: string
	certificate: any
	order_id: string
	validity_extension?: ValidityExtension[]
}

const ScholarOrderView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const user_fitness_course_id: string | undefined =
		searchParams.get('user_fitness_course_id') || undefined
	const order_id: string | undefined = searchParams.get('order_id') || undefined
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [userData, setUserData] = useState<any>(null)
	const [updateShow, setUpdateShow] = useState(false)
	const [updateCertificateShow, setUpdateCertificateShow] = useState(false)
	const [updateData, setUpdateData] = useState({
		duration: '',
	})
	const [certificateUpdate, setCertificateUpdate] = useState({
		name: '',
		passing_date: '',
		instructor: '',
		certificate: '',
	})
	const [certificateData, setCertificateData] = useState([])
	const [selectedFileURL, setSelectedFileURL] = useState<string | null>(null)
	const [certificateAddData, setCertificateAddData] = useState({
		choose_option: 'Upload Certificate',
		generate_type: '',
		name: '',
		passing_date: '',
		instructor: 'Dr. Gautam Jani',
		certificate_course: '',
	})
	const [certificateID, setCertificateID] = useState<any>('')
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)
	const [qrLoading, setQrLoading] = useState(false)
	const [addCertificateLoading, setAddCertificateLoading] = useState(false)

	const fetchUserData = async (page?: number) => {
		try {
			const response = await GetOrders({
				order_id,
			})
			const filteredData = response.data
		} catch (error) {
			console.error(error)
		}
	}

	const fetchCertificateData = async (page?: number) => {
		setAddCertificateLoading(true)
		try {
			const fitness_response = await GetUserFitnessCourses({
				user_fitness_course_id,
			})

			if (
				fitness_response.data &&
				Array.isArray(fitness_response.data) &&
				fitness_response.data.length > 0
			) {
				const fitness_filteredData = fitness_response.data[0]
				setUserData(fitness_filteredData)
				setCertificateData(fitness_filteredData.certificate || []) // Add null check
			} else {
				console.error('Unexpected response format', fitness_response.data)
			}
		} catch (error) {
			console.error(error)
		}
		setAddCertificateLoading(false)
	}

	useEffect(() => {
		fetchUserData()
	}, [])

	useEffect(() => {
		fetchCertificateData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setCertificateAddData({ ...certificateAddData, [name]: value })
	}

	const filteredUserData = certificateData.filter((user: any) =>
		user?.certificate_id?.toLowerCase()
	)
	const paginatedUserData = filteredUserData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleAddButtonClick = async () => {
		setAddCertificateLoading(true)
		try {
			let generateType
			if (certificateAddData.choose_option == 'Generate Certificate') {
				generateType = 'AUTO'
			} else if (certificateAddData.choose_option == 'Upload Certificate') {
				generateType = 'MANUAL'
			}

			const payload: any = {
				user_fitness_course_id: user_fitness_course_id,
				generate_type: generateType,
				certificate_data: {
					name: certificateAddData.name,
					passing_date: certificateAddData.passing_date,
					instructor: certificateAddData.instructor,
					certificate: certificateAddData.certificate_course,
				},
			}

			await CreateCertificate(payload)

			fetchCertificateData()
			toast.success('Certificate Created Successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setAddCertificateLoading(false)
	}

	const copyCertificateId = (certificateId: any) => {
		navigator.clipboard
			.writeText(certificateId)
			.then(() => {
				toast.success('Certificate ID copied to clipboard')
			})
			.catch((err) => {
				toast.error('Failed to copy Certificate ID')
				console.error('Could not copy text: ', err)
			})
	}

	const HOST = BASE_URL

	const generateCertificateFromData = async (certificate_id: any) => {
		setLoading(true)
		try {
			const certificate_download: any = await GenerateCertificate({
				certificate_id: certificate_id,
			})
			const URL = certificate_download.data?.fileURL
			if (URL) {
				window.open(HOST + URL)
				toast.success('Certificate Download Successfully')
			} else {
				toast.error('Error Downloading Certificate')
			}
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	const generateQRCertificateFromData = async (certificate_id: any) => {
		setQrLoading(true)
		try {
			const certificate_download: any = await GenerateQRCertificate({
				certificate_id: certificate_id,
			})
			const URL = certificate_download.data?.fileURL
			if (URL) {
				window.open(HOST + URL)
				toast.success('QR Code Download Successfully')
			} else {
				toast.error('Error Downloading QR Code')
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setQrLoading(false)
	}

	let uploadCertificateID = ''

	const uploadCertificate = async (certificate_id: any) => {
		uploadCertificateID = certificate_id
		document.getElementById('certificate_cover')?.click()
	}

	const certificateImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const file = e.target.files[0]
			setLoading(true)
			try {
				const fileImage = {
					selectedFile: file,
					profile_image: URL.createObjectURL(file),
				}
				const imageUrl: any = await FileUploadToFGGroup([fileImage.selectedFile], {
					directory: 'certificates',
				})
				const imgUrl = imageUrl.data?.fileURLs[0]
				if (imgUrl) {
					const updateImageUrl: any = await UpdateFitnessCourseCertificate({
						certificate_id: uploadCertificateID,
						file_url: imgUrl,
					})
					setSelectedFileURL(imgUrl)
					fetchCertificateData()
					toast.success('Certificate Upload Successfully')
				} else {
					throw new Error('File upload response did not contain a file URL')
				}
			} catch (error) {
				console.error('Error uploading file:', error)
			}
			setLoading(false)
		}
	}

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleInputCertificateUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setCertificateUpdate({ ...certificateUpdate, [name]: value })
	}

	const handleUpdateData = async () => {
		try {
			setIsSubmitting(true)
			const payload: any = {
				user_fitness_course_id: user_fitness_course_id,
				duration: updateData.duration,
				time_unit: 'DAY',
			}
			await ExtendFitnessCourseValidity(payload)
			toast.success('Extend Validity Successfully')
			setIsSubmitting(false)
			setUpdateShow(false)
			fetchCertificateData()
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const deleteExtend = async (user_fitness_course_extend_validity_id: string) => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to remove this Extension.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			})

			if (result.isConfirmed) {
				const response: any = await RemoveExtendedValidity({
					user_fitness_course_extend_validity_id,
				})
				if (response.status === 200) {
					fetchCertificateData()
					toast.success('Order Extension Removed Successfully')
				} else {
					toast.error('Failed to remove food')
				}
			}
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const handleCertificateUpdateData = async () => {
		try {
			setIsSubmitting(true)
			const payload: any = {
				certificate_id: certificateID,
				certificate_data: {
					name: certificateUpdate.name,
					passing_date: certificateUpdate.passing_date,
					instructor: certificateUpdate.instructor,
					certificate: certificateUpdate.certificate,
				},
			}
			await UpdateFitnessCourseCertificate(payload)
			toast.success('Update Certificate Successfully')
			setIsSubmitting(false)
			setUpdateCertificateShow(false)
			fetchCertificateData()
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const showCertificateModal = (data?: any, id?: string) => {
		setCertificateID(id)
		setCertificateUpdate(data)
		setUpdateCertificateShow(true)
	}

	const RemoveCertificate = async (certificate_id: any) => {
		try {
			const { value: confirmText } = await Swal.fire({
				title: `Are you sure?`,
				text: `Once Remove, you will not be able to undo! Write "confirm"`,
				icon: 'question',
				input: 'text',
				inputPlaceholder: 'Write "confirm" here to remove certificate',
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
				setLoading(true)
				const payload: any = {
					certificate_id,
				}
				await DeleteCertificate(payload)
				toast.success('Certificate Delete Successfully')
				fetchCertificateData()
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setLoading(false)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Order View</PageTitle>
			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header border-0 cursor-pointer row'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_user_view'>
					<div className='card-title my-5 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder my-6'>User Details</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_user_view'
					className='collapse show'>
					<div className='card-body border-top'>
						<div className='row'>
							<div className='col-md-12 fv-row mb-7'>
								<div className='table-responsive'>
									<table
										id='kt_table_users'
										className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
										<thead>
											<tr className='fw-bold text-muted'>
												<th>ID:</th>
												<th>Full Name:</th>
												<th>Email: </th>
												<th>Mobile:</th>
											</tr>
										</thead>
										<tbody>
											{userData && userData.user && (
												<tr>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{userData.user._id}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{userData.user.first_name} {userData.user.last_name}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{userData.user.email || '-'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{userData.user.mobile}
														</span>
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
								{userData && !userData.user && (
									<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
										<b>No records found</b>
									</div>
								)}
							</div>
						</div>
						<div className='col-md-12 fv-row mt-5 mb-2 d-flex justify-content-end'>
							<TableButton
								action='view'
								to={`/fgiit/users/view-user?user_id=${
									userData && userData.user && userData.user._id
								}`}
								text='View User'
								backgroundDark={true}
							/>
						</div>
					</div>
				</div>
			</div>

			<KTCard className='mt-5 mb-xl-10'>
				<div className='card-body'>
					<div
						className='card-header border-0 cursor-pointer p-0 row'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_order_Overview'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Order Overview</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						className='row'
						id='kt_order_Overview'>
						<div className='col-md-12 fv-row mb-7'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th>No</th>
											<th>Course Name</th>
											<th>Price</th>
											<th>Start date - End date</th>
											<th>Validity</th>
											<th className='ps-4 rounded-end'>Action</th>
										</tr>
									</thead>
									<tbody>
										{userData && userData.fitness_course && (
											<tr>
												<td>
													<span className='text-dark fw-bold  mb-1 fs-6'>1</span>
												</td>
												<td>
													<span className='text-dark fw-bold  mb-1 fs-6'>
														{userData.fitness_course.course_name}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  mb-1 fs-6'>
														{userData.fitness_course.amount} {userData.fitness_course.currency}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  mb-1 fs-6'>
														{DayJS(userData.createdAt).format('DD/MM/YYYY hh:mm:ss A')}{' '}
														<span className='fw-900 fs-3 mx-1'>to</span>{' '}
														{DayJS(userData.end_date).format('DD/MM/YYYY hh:mm:ss A')}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  mb-1 fs-6'>
														{userData.fitness_course.duration_days} Day
													</span>
												</td>
												<td>
													<button
														onClick={() => setUpdateShow(true)}
														className='text-white fw-bold btn btn-warning p-2 px-4 mb-1 fs-6'>
														Extend Validity
													</button>
												</td>
											</tr>
										)}

										{userData &&
											userData.validity_extension &&
											userData.validity_extension.map((extendData: any, index: number) => (
												<tr key={index}>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>{index + 1}</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>Extension</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>Extension</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{DayJS(extendData.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
															<span className='fw-900 fs-3 mx-1'>to</span>{' '}
															{DayJS(extendData.createdAt)
																.add(extendData.duration, 'day')
																.format('DD/MM/YYYY hh:mm:ss A')}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  mb-1 fs-6'>
															{extendData.duration} {extendData.unit}
														</span>
													</td>
													<td>
														<button
															onClick={() => deleteExtend(extendData._id)}
															className='text-white fw-bold btn btn-danger p-2 px-4 mb-1 fs-6'>
															Remove Extension
														</button>
													</td>
												</tr>
											))}
									</tbody>
								</table>
							</div>
							{userData && !userData.fitness_course && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
						</div>
						<div className='col-md-12 fv-row mb-2 d-flex justify-content-end'>
							<TableButton
								action='view'
								to={'/fgiit/all-order/view-order?order_id=' + userData?.order_id}
								text='View Order'
								backgroundDark={true}
							/>
						</div>
					</div>
				</div>
			</KTCard>

			<KTCard className='mt-5'>
				<div className='card-body'>
					<div
						className='card-header border-0 cursor-pointer p-0 row'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_certificate'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Certificate</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						className='row justify-content-end'
						id='kt_certificate'>
						<div
							className='col-md-4 fv-row mb-4 d-flex justify-content-end'
							data-bs-toggle='modal'
							data-bs-target='#kt_modal_exercise'>
							<TableButton
								action='add'
								text='Create Certificate'
							/>
						</div>
						<div className='col-md-12 fv-row mb-7'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th>No</th>
											<th>Certificate ID</th>
											<th>Last Modified</th>
											<th className='ps-4 rounded-end'>Action</th>
										</tr>
									</thead>
									<tbody>
										{loading || qrLoading || addCertificateLoading ? (
											<div className='loader-background'>
												<div
													className='spinner-border spinner-border-1 text-white'
													style={{ width: '50px', height: '50px' }}
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										) : (
											paginatedUserData.length > 0 &&
											paginatedUserData.map((certificate: any, index: any) => {
												const actualIndex =
													(pagination.page - 1) * pagination.itemsPerPage + index + 1
												return (
													<tr key={index}>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>{actualIndex}</span>
														</td>
														<td>
															<div className='d-flex justify-content-start flex-column'>
																<span className='text-dark fw-bold  mb-1 fs-6'>
																	<FontAwesomeIcon
																		icon={faCopy}
																		className='text-success mx-2 fs-3 btn m-0 p-0'
																		onClick={() => copyCertificateId(certificate.certificate_id)}
																	/>{' '}
																	{certificate.certificate_id}
																</span>
																<span className='text-muted fw-semibold text-muted d-block fs-7'>
																	{certificate._id}
																</span>
															</div>
														</td>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{DayJS(certificate.updatedAt).format('DD/MM/YYYY hh:mm:ss A')}
															</span>
														</td>
														<td style={{ width: '60%' }}>
															<div>
																{certificate.generate_type === 'AUTO' ? (
																	<div>
																		<button
																			className='fw-bold btn btn-warning p-2 px-4 mb-1 fs-6'
																			onClick={() => generateCertificateFromData(certificate._id)}>
																			<FontAwesomeIcon
																				icon={faDownload}
																				className='fs-3'
																			/>
																			<span className='ms-3'>Download Certificate</span>
																		</button>
																		<button
																			className='text-white fw-bold btn btn-info p-2 px-4 mb-1 fs-6 ms-md-3'
																			onClick={() =>
																				showCertificateModal(
																					certificate.certificate_data,
																					certificate._id
																				)
																			}>
																			<FontAwesomeIcon
																				icon={faPencil}
																				className='fs-3'
																			/>
																		</button>

																		<button
																			className='fw-bold btn btn-danger p-2 px-4 mb-1 fs-6 ms-md-3'
																			onClick={() => RemoveCertificate(certificate._id)}>
																			<FontAwesomeIcon
																				icon={faTrash}
																				className='fs-3'
																			/>
																		</button>
																	</div>
																) : (
																	<>
																		<div className='d-flex'>
																			<button
																				className='text-white fw-bold btn btn-info p-2 px-4 mb-1 fs-6'
																				onClick={() => uploadCertificate(certificate._id)}>
																				<FontAwesomeIcon
																					icon={faUpload}
																					className='fs-3'
																				/>
																				<span className='ms-3'>Upload Certificate</span>
																			</button>
																			<button
																				className='fw-bold btn btn-warning p-2 px-4 mb-1 fs-6 ms-md-3'
																				onClick={() =>
																					generateQRCertificateFromData(certificate._id)
																				}>
																				<FontAwesomeIcon
																					icon={faDownload}
																					className='fs-3'
																				/>
																				<span className='ms-3'>Download QR</span>
																			</button>
																			<Link
																				className='fw-bold btn btn-primary p-2 px-4 mb-1 fs-6 ms-md-3'
																				to={`/fgiit/create-certificate?certificate_id=${
																					certificate.certificate_id
																				}&user_name=${
																					userData &&
																					userData.user &&
																					userData.user.first_name + ' ' + userData.user.last_name
																				}`}
																				target='_black'>
																				<FontAwesomeIcon
																					icon={faPlus}
																					className='fs-3'
																				/>
																				<span className='ms-3'>Create Certificate</span>
																			</Link>
																		</div>
																		{certificate.file_url ? (
																			<button
																				className='text-white fw-bold btn btn-success p-2 px-4 mb-1 fs-6 mt-md-2 me-md-3'
																				onClick={() =>
																					window.open(
																						'https://files.fggroup.in/' + certificate.file_url
																					)
																				}>
																				<FontAwesomeIcon
																					icon={faEye}
																					className='fs-3'
																				/>
																			</button>
																		) : (
																			''
																		)}
																		<button
																			className='fw-bold btn btn-danger p-2 px-4 mb-1 fs-6 mt-md-2'
																			onClick={() => RemoveCertificate(certificate._id)}>
																			<FontAwesomeIcon
																				icon={faTrash}
																				className='fs-3'
																			/>
																		</button>
																	</>
																)}
															</div>
														</td>
													</tr>
												)
											})
										)}
										<input
											type='file'
											onChange={(e: any) => certificateImage(e)}
											hidden
											id='certificate_cover'
										/>
									</tbody>
								</table>
							</div>
							{paginatedUserData.length === 0 && !loading && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
							{paginatedUserData.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(certificateData.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					</div>
				</div>

				<div
					className='modal fade'
					id='kt_modal_exercise'
					aria-hidden='true'>
					<div className='modal-dialog modal-dialog-centered mw-550px'>
						<div className='modal-content border-0'>
							<div className='modal-header justify-content-between'>
								<h2 className='fw-bolder'>Generate Certificate</h2>
								<div
									className='btn btn-sm btn-icon btn-active-color-primary'
									data-bs-dismiss='modal'>
									<FontAwesomeIcon
										className='fs-1 position-absolute ms-3'
										icon={faXmark}
									/>
								</div>
							</div>
							<div className='modal-body p-5'>
								<div className='col-md-12 fv-row border-bottom'>
									<div className='col-md-12 fv-row mb-4'>
										<fieldset>
											<legend className='form-label'>Choose Option</legend>

											{userData &&
												userData?.createdAt &&
												DayJS(userData?.createdAt).isBefore(DayJS('2024-12-23')) && (
													<div>
														<input
															type='radio'
															name='choose_option'
															id='Generate'
															value='Generate Certificate'
															checked={certificateAddData.choose_option === 'Generate Certificate'}
															onChange={(e) => handleInputChange(e)}
														/>
														<label
															htmlFor='Generate'
															className='fs-3 ms-2 my-1 me-5'>
															Generate Certificate
														</label>
													</div>
												)}

											<div>
												<input
													type='radio'
													name='choose_option'
													id='Upload'
													value='Upload Certificate'
													checked={certificateAddData.choose_option === 'Upload Certificate'}
													onChange={(e) => handleInputChange(e)}
												/>
												<label
													htmlFor='Upload'
													className='fs-3 ms-2 my-1 me-3'>
													Upload Certificate
												</label>
											</div>
										</fieldset>
									</div>
								</div>
								{certificateAddData.choose_option === 'Generate Certificate' ? (
									<div className='mb-3 d-flex flex-wrap justify-content-center mt-3'>
										<h2>Generate Certificate</h2>
										<div className='col-md-12 fv-row'>
											<InputField
												placeholder='Enter Name'
												type='text'
												className='col-12 fv-row'
												name='name'
												label='Name:'
												htmlFor='name'
												value={certificateAddData.name}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-12 fv-row'>
											<InputField
												placeholder='Passing Date'
												type='date'
												className='col-12 fv-row'
												name='passing_date'
												label='Passing Date:'
												htmlFor='passing_date'
												value={certificateAddData.passing_date}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-12 fv-row'>
											<SelectField
												className='col-md-12 fv-row m-0'
												label='Instructor:'
												name='instructor'
												value={certificateAddData.instructor}
												onChange={(e) => handleInputChange(e)}
												htmlFor='instructor'
												options={['Dr. Gautam Jani']}
											/>
										</div>
										<div className='col-md-12 fv-row'>
											<SelectField
												className='col-md-12 fv-row m-0'
												label='Certificate Course:'
												name='certificate_course'
												value={certificateAddData.certificate_course}
												onChange={(e) => handleInputChange(e)}
												htmlFor='certificate_course'
												options={[
													'Certified Personal Trainer',
													'Certified Dietitian Course',
													'Anabolic Androgenic Steroids',
													'Injury Rehab Course',
													'Certified Wellness Consultant',
													'Diploma in Gym Management',
													'Python Programming',
													'Group Instructor Masterclass',
													'Tabata Workshop',
													'Diploma In Business Management',
												]}
											/>
										</div>
									</div>
								) : (
									<div className='mb-3 d-flex flex-wrap justify-content-center mt-15'>
										<h2>Click On Generate Certificate Below</h2>
									</div>
								)}
							</div>

							<div className='modal-footer border-0 d-flex justify-content-center'>
								<button
									className='btn btn-primary fs-29'
									onClick={handleAddButtonClick}
									data-bs-dismiss='modal'>
									Generate Certificate
								</button>
								<button
									className='btn btn-light fs-29'
									data-bs-dismiss='modal'>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			</KTCard>

			<Modal
				show={updateShow}
				onHide={() => setUpdateShow(false)}>
				<div className='modal-header justify-content-between'>
					<h2 className='fw-bolder'>Extend Validity</h2>
					<button
						className='btn btn-sm btn-icon btn-active-color-primary'
						onClick={() => setUpdateShow(false)}>
						<FontAwesomeIcon
							className='fs-1 position-absolute ms-3'
							icon={faXmark}
						/>
					</button>
				</div>
				<div className='modal-body scroll-y'>
					<div className='mb-3'>
						<InputField
							placeholder='Enter Days for extension'
							type='number'
							className='mb-7 w-100 fv-row'
							name='duration'
							label='Enter Days'
							htmlFor='duration'
							value={updateData.duration}
							onChange={handleInputUpdateChange}
						/>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='edit'
							onClick={() => handleUpdateData()}
							text={isSubmitting ? 'Please wait, extending validity' : 'Extend Validity'}
							showIcon={false}
							disabled={isSubmitting}
							backgroundDark={true}
							className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
						/>
					</div>
				</div>
			</Modal>
			<Modal
				centered
				show={updateCertificateShow}
				onHide={() => setUpdateCertificateShow(false)}>
				<div className='modal-header justify-content-between'>
					<h2 className='fw-bolder'>Update Certificate</h2>
					<button
						className='btn btn-sm btn-icon btn-active-color-primary'
						onClick={() => setUpdateCertificateShow(false)}>
						<FontAwesomeIcon
							className='fs-1 position-absolute ms-3'
							icon={faXmark}
						/>
					</button>
				</div>
				<div className='modal-body scroll-y'>
					<div className='mb-3'>
						<InputField
							placeholder='Enter Name'
							type='text'
							className='mb-7 w-100 fv-row'
							name='name'
							label='Name'
							htmlFor='name'
							value={certificateUpdate.name}
							onChange={handleInputCertificateUpdateChange}
						/>
						<InputField
							placeholder='Enter Passing Date'
							type='text'
							className='mb-7 w-100 fv-row'
							name='passing_date'
							label='Passing date'
							htmlFor='passing_date'
							value={certificateUpdate.passing_date}
							onChange={handleInputCertificateUpdateChange}
						/>
						<InputField
							placeholder='Enter Instructor Name'
							type='text'
							className='mb-7 w-100 fv-row'
							name='instructor'
							label='Instructor'
							htmlFor='instructor'
							value={certificateUpdate.instructor}
							onChange={handleInputCertificateUpdateChange}
						/>
						<SelectField
							className='col-md-12 fv-row m-0'
							label='Certificate Course:'
							name='certificate'
							value={certificateUpdate.certificate}
							onChange={handleInputCertificateUpdateChange}
							htmlFor='certificate'
							options={[
								'Certified Personal Trainer',
								'Certified Dietitian Course',
								'Anabolic Androgenic Steroids',
								'Injury Rehab Course',
								'Certified Wellness Consultant',
								'Diploma in Gym Management',
								'Python Programming',
								'Group Instructor Masterclass',
								'Tabata Workshop',
							]}
						/>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='edit'
							onClick={handleCertificateUpdateData}
							text={isSubmitting ? 'Please wait, Updating Certificate' : 'Update Certificate'}
							showIcon={false}
							disabled={isSubmitting}
							backgroundDark={true}
							className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}
export { ScholarOrderView }
