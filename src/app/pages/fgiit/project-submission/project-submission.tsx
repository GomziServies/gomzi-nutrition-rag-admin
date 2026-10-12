import { faCheck, faCloudArrowDown, faEye, faUserCheck, faUserPen, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetProjectSubmissionsUserData, GetUserFitnessCourses, UpdateProjectSubmission } from '../../../Functions/FGGroup'
import Swal from 'sweetalert2'
import { useEffect, useRef, useState } from 'react'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { Link, useLocation } from 'react-router-dom'
import questionmark from './question-mark.png'

const ProjectSubmission = () => {
	// const [searchTerm, setSearchTerm] = useState('')
	// const [userData, setUserData] = useState<any>([])
	// const [selectedSubject, setSelectedSubject] = useState('')
	// const [pagination, setPagination] = useState({
	// 	page: 1,
	// 	itemsPerPage: 10,
	// })
	// const [loading, setLoading] = useState(false)

	// const fetchData = async () => {
	// 	setLoading(true)
	// 	try {
	// 		const response: FGGroupAPIResponse = await GetProjects()

	// 		let filteredData: any = response.data
	// 		if (selectedSubject) {
	// 			filteredData = filteredData.filter((lecture: any) => {
	// 				return lecture.course.course_name === selectedSubject
	// 			})
	// 		}
	// 		setUserData(filteredData)
	// 	} catch (error) {
	// 		console.error(error)
	// 	}
	// 	setLoading(false)
	// }

	// useEffect(() => {
	// 	fetchData()
	// }, [selectedSubject])

	// const handlePageChange = (page: number) => {
	// 	setPagination({ ...pagination, page })
	// }

	// const handleItemsPerPageChange = (value: number) => {
	// 	setPagination({ ...pagination, itemsPerPage: value })
	// }

	// const filteredUserData = userData.filter(
	// 	(user: any) =>
	// 		user.project_title && user.project_title.toLowerCase().includes(searchTerm.toLowerCase())
	// )

	// const paginatedUserData = filteredUserData.slice(
	// 	(pagination.page - 1) * pagination.itemsPerPage,
	// 	pagination.page * pagination.itemsPerPage
	// )

	// const handleDownload = (filePath: any) => {
	// 	const link = document.createElement('a')
	// 	link.href = 'https://files.fggroup.in/' + filePath
	// 	link.setAttribute('download', '')
	// 	document.body.appendChild(link)
	// 	link.click()
	// 	document.body.removeChild(link)
	// }

	// const location = useLocation()
	// const searchParams = new URLSearchParams(location.search)
	// const submission_id: any = searchParams.get('submission_id')
	// const course_id: any = searchParams.get('course_id')
	const [searchTerm, setSearchTerm] = useState('')
	const [submissionData, setSubmissionData] = useState([])
	const [userData, setUserData] = useState<any[]>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)

	const fetchData = async () => {
		setLoading(true)
		try {
			const response: any = await GetProjectSubmissionsUserData({
				project_id: '651b46158b86c420e2c3afc5',
			})
			let filteredData: any = response.data[0]?.project_submissions

			// Process data to add additional fields
			filteredData = filteredData.map((data: any) => {
				const lastSubmittedEntry = data?.submission_status
					.filter((entry: any) => entry.status === 'Submitted')
					.pop()

				const lastReassignedEntry = data?.submission_status
					.filter((entry: any) => entry.status === 'Reassigned')
					.pop()

				// Get the dates, or set to 'N/A' if not found
				const lastSubmittedDate = lastSubmittedEntry
					? DayJS(lastSubmittedEntry.createdAt).format('YYYY-MM-DD HH:mm')
					: 'N/A'
				const lastReassignedDate = lastReassignedEntry
					? DayJS(lastReassignedEntry.createdAt).format('YYYY-MM-DD HH:mm')
					: 'N/A'
				const submissionStatus = data?.submission_status[data.submission_status.length - 1].status

				return {
					...data,
					lastSubmittedEntry,
					lastReassignedEntry,
					lastSubmittedDate,
					lastReassignedDate,
					submissionStatus,
				}
			})

			// Filter out entries without 'createdAt'
			filteredData = filteredData.filter((entry: any) => entry.createdAt)

			// Sort data by 'createdAt' in descending order (newest to oldest)
			filteredData = filteredData.sort((a: any, b: any) => {
				return DayJS(b.createdAt).unix() - DayJS(a.createdAt).unix()
			})

			setSubmissionData(filteredData)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchUserFitnessCoursesData = async (user_id: any) => {
		setLoading(true)
		try {
			const fitness_response = await GetUserFitnessCourses({ user_id: user_id })

			let fitness_filteredData: any = fitness_response.data
			fitness_filteredData = fitness_filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			fitness_filteredData = fitness_filteredData.find(
				(fitness: any) => fitness.fitness_course._id == '62d33b670ac1b482c32bd442'
			)

			if (fitness_filteredData?.certificate) {
				window.open('https://files.fggroup.in/' + fitness_filteredData?.certificate?.[0]?.file_url)
			} else {
				Swal.fire('Error!', 'Certificate not Generated.', 'error')
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.itemsPerPage, pagination.page])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev: any) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const filteredUserData = submissionData.filter((data: any) =>
		data.user?.first_name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedUserData = filteredUserData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const updateStatus = (submission_id: string, status?: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'You want to ' + status + ' this project!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, ' + status + ' it!',
		}).then((result: any) => {
			if (result.isConfirmed) {
				const payload: any = {
					project_submission_id: submission_id,
					status,
				}

				UpdateProjectSubmission(payload)
					.then(() => {
						Swal.fire('Success!', `submission details updated successfully!.`, 'success')
					})
					.catch((error) => {
						Swal.fire('Error!', 'There was an error updating the status.', 'error')
					})
			}
		})
	}

	const handleDownload = (filePath: any) => {
		const link = document.createElement('a')
		link.href = 'https://files.fggroup.in/' + filePath
		link.setAttribute('target', '_blank')
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Project Submission</PageTitle>
			{/* <KTCard className='mt-4'>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<LengthMenu
							expenseData={userData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='card-toolbar d-flex'>
						<SelectField
							className='fv-row mb-7 me-2 mt-8'
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
				<div className='card-body py-4'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Title</th>
									<th>Project File</th>
									<th>Course</th>
									<th>Course method</th>
									<th>Category</th>
									<th className='ps-4 rounded-end'>Actions</th>
								</tr>
							</thead>
							<tbody>
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
									paginatedUserData
										.slice()
										.reverse()
										.map((user: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											return (
												<tr key={user.id}>
													<td>
														<span className='text-dark ms-6 fw-bold  d-block mb-1 fs-6'>
															{actualIndex}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{user.project_title}
														</span>
													</td>
													<td>
														<button
															className='btn gap-2 btn-light-primary mx-2 btn-sm me-1'
															onClick={() => handleDownload(user.project_files[0])}>
															<FontAwesomeIcon icon={faCloudArrowDown} />
														</button>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{user.course?.course_name}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{user.course?.coaching_mode}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{user.course?.course_category}
														</span>
													</td>
													<td>
														<TableButton
															action='view'
															to={`/fgiit/project-submission-details?submission_id=${user._id}&course_id=${user.course?._id}`}
														/>
													</td>
												</tr>
											)
										})
								)}
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
							totalPages={Math.ceil(userData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard> */}

			<KTCard className='mt-4'>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<LengthMenu
							expenseData={submissionData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='card-toolbar'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='card-body py-4'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Students Name</th>
									<th>Submitted Date</th>
									<th>Reassigned Date</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
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
									paginatedUserData.map((data: any, index: any) => {
										const buttons: any = (
											<>
												<div className='d-flex align-items-center'>
													<button
														className='btn btn-primary btn-sm py-4 me-2'
														onClick={() => handleDownload(data?.submission_files[0])}>
														<FontAwesomeIcon
															icon={faCloudArrowDown}
															className='fs-5 me-1'
														/>{' '}
														Download
													</button>
													{data.submissionStatus === 'Submitted' && (
														<>
															<button
																className='btn btn-success btn-sm me-2'
																style={{ marginLeft: '2%' }}
																onClick={() => updateStatus(data._id, 'Approved')}>
																<FontAwesomeIcon
																	icon={faUserCheck}
																	className='fs-5 me-1'
																/>{' '}
																Approve
															</button>
															<button
																className='btn btn-danger btn-sm me-2'
																style={{ marginLeft: '2%' }}
																onClick={() => updateStatus(data._id, 'Reassigned')}>
																<FontAwesomeIcon
																	icon={faUserPen}
																	className='fs-5 me-1'
																/>{' '}
																Reassign
															</button>
														</>
													)}
													{data.submissionStatus === 'Reassigned' && (
														<button
															className='btn btn-info py-4 me-2'
															onClick={() => updateStatus(data._id, 'Reassigned')}>
															<span>
																<FontAwesomeIcon
																	icon={faUserPen}
																	className='fs-5 me-1'
																/>{' '}
																Reassign
															</span>
														</button>
													)}
													<div>
														<Link
															to={`/fgiit/users/view-user?user_id=${data.user_id}`}
															className='btn btn-success btn-sm py-4'>
															<FontAwesomeIcon
																icon={faEye}
																className='fs-5 me-1'
															/>{' '}
															Certificate
														</Link>
													</div>
												</div>
											</>
										)
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										return (
											<tr key={data._id}>
												<td className='text-center'>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<Link to={`/fgiit/users/view-user?user_id=` + data.user_id}>
														<div className='d-flex align-items-center'>
															<div className='symbol symbol-45px me-5'>
																<img
																	src={
																		data?.user?.profile_image
																			? `https://files.fggroup.in/${data?.user?.profile_image}`
																			: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																	}
																	alt={data.first_name}
																	className='fs-3 text-primary'
																	style={{ width: '55px', height: '55px', borderRadius: '20%' }}
																/>
															</div>
															<div className='d-flex justify-content-start flex-column'>
																<span className='text-dark fw-bold  fs-6'>
																	{data.user?.first_name + ' ' + data.user?.last_name || 'N/A'}
																</span>
																<span className='text-muted fw-semibold text-muted d-block fs-7'>
																	{data.user?.mobile}
																</span>
															</div>
														</div>
													</Link>
												</td>
												<td>
													<div className='d-flex align-items-center'>
														<span className='text-dark fw-bold  fs-6'>
															{DayJS(data.lastSubmittedDate).format('DD/MM/YYYY hh:mm A')}
														</span>
													</div>
												</td>
												<td>
													<div className='d-flex align-items-center'>
														<span className='text-dark fw-bold  fs-6'>
															{data.lastReassignedDate == 'Invalid Date'
																? DayJS(data.lastReassignedDate).format('DD/MM/YYYY hh:mm A')
																: 'N/A'}
														</span>
													</div>
												</td>
												<td>{buttons}</td>
											</tr>
										)
									})
								)}
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
							totalPages={Math.ceil(submissionData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
			<div
				className='modal fade'
				id='kt_modal_exercise'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-500px'>
					<div className='modal-content border-0'>
						<div className='modal-header border-0 justify-content-end'>
							<button
								type='button'
								className='btn-close'
								data-bs-dismiss='modal'
								aria-label='Close'></button>
						</div>
						<div className='text-center mb-4'>
							<img
								src={questionmark}
								alt='Question Mark'
								style={{ width: '80px', height: '80px' }}
							/>
							<h2
								className='fw-bold mt-3'
								style={{ fontSize: '25px' }}>
								Are you sure?
							</h2>
						</div>
						<div className='modal-body p-5'>
							<h3 className='text-center fw-20'>You want to Approved this project!</h3>
						</div>
						<div className='modal-footer border-0 d-flex justify-content-center'>
							<button className='btn btn-primary me-3 fs-24'>
								<FontAwesomeIcon
									className='me-2'
									icon={faCheck}
								/>
								Approve
							</button>
							<button
								className='btn btn-danger fs-29'
								data-bs-dismiss='modal'>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
			<div
				className='modal fade'
				id='kt_modal-reasign'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-500px'>
					<div className='modal-content border-0'>
						<div className='modal-header border-0 justify-content-end'>
							<button
								type='button'
								className='btn-close'
								data-bs-dismiss='modal'
								aria-label='Close'></button>
						</div>
						<div className='text-center mb-4'>
							<img
								src={questionmark}
								alt='Question Mark'
								style={{ width: '80px', height: '80px' }}
							/>
							<h2
								className='fw-bold mt-3'
								style={{ fontSize: '25px' }}>
								Are you sure?
							</h2>
						</div>
						<div className='modal-body p-5'>
							<h3 className='text-center fw-20'>You want to Reassigned this project!</h3>
						</div>
						<div className='modal-footer border-0 d-flex justify-content-center'>
							<button className='btn btn-primary me-3 fs-24'>
								<FontAwesomeIcon
									className='me-2'
									icon={faCheck}
								/>
								Reasign
							</button>
							<button
								className='btn btn-danger fs-29'
								data-bs-dismiss='modal'>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
			<div
				className='modal fade'
				id='kt_modal_view_certificate'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-550px'>
					<div className='modal-content border-0'>
						<div className='modal-header justify-content-between'>
							<h2 className='fw-bolder'>Download Certificate</h2>
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
							<div className='mb-3 mt-3'>
								<div className='border-bottom py-3'>
									<span className='text-dark fw-bold  fs-4 me-3'>Diploma In Personal Trainer</span>
									<button className='btn btn-success btn-sm'>
										<FontAwesomeIcon
											icon={faCloudArrowDown}
											className='fs-5'
										/>
									</button>
								</div>
								<div className='border-bottom py-3'>
									<span className='text-dark fw-bold  fs-4 me-3'>Diploma In Personal Trainer</span>
									<button className='btn btn-success btn-sm'>
										<FontAwesomeIcon
											icon={faCloudArrowDown}
											className='fs-5'
										/>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export default ProjectSubmission
