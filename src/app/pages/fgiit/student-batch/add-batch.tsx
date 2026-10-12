import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { AsyncPaginate } from 'react-select-async-paginate'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import { loadUserOptionsFGIITStudents } from '../../../components/loadUserOptionsFGIITStudents'
import SearchFilter from '../../../components/SearchFilter'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	GetStudentBatches,
	GetStudents,
	RemoveTimetableFromBatch,
	RemoveUserFromBatch,
	UpdateStudentBatch,
} from '../../../Functions/FGGroup'

const BatchView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const batch_id: any = searchParams.get('batch_id')!
	const [searchTerm, setSearchTerm] = useState('')
	const [studentSearchTerm, setStudentSearchTerm] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [showStudentModal, setShowStudentModal] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [userStudentData, setUserStudentData] = useState<any>([])
	const [timeTableData, setTimeTableData] = useState([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [value, onChange] = useState<any>(null)
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [batchData, setBatchData] = useState<any>({
		batch_id: '',
		batch_name: '',
		user: [],
		users: [],
		day: '',
		start_time: '',
		end_time: '',
		meeting_link: '',
		notes: '',
		meeting_platform: '',
		password: '',
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetStudentBatches({
				batch_id,
				search: studentSearchTerm,
			})
			if (response.data && response.data.length > 0) {
				const filteredData: any = response.data[0]

				const user = filteredData.users.map((el: any) => {
					return {
						label: el.user.first_name + ' ' + el.user.last_name,
						value: el.user_id,
						id: el.user_id,
					}
				})

				filteredData.user = user
				setBatchData({ ...filteredData, batch_id: filteredData._id })
				setTimeTableData(filteredData.timetable)
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchStudentData = async (page?: number) => {
		try {
			const response: any = await GetStudents({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: studentSearchTerm,
				sort,
				sortOrder,
			})
			setUserStudentData(response.data)

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error: any) {
			console.error(error)
		}
	}

	const notify = (batch_id: any, timetable_id: any) =>
		Swal.fire({
			icon: 'warning',
			title: 'Are you sure?',
			text: 'Once Completed, you will not be able to undone!',
			showCancelButton: true,
			confirmButtonText: 'Ok',
		}).then(async (result) => {
			if (result.isConfirmed) {
				await RemoveTimetableFromBatch({ batch_id, timetable_id })
				toast.success('Time Table Remove Successfully')
				fetchData()
			}
		})

	const studentNotify = (batch_id: any, student_user_id: any) =>
		Swal.fire({
			icon: 'warning',
			title: 'Are you sure?',
			text: 'Once Completed, you will not be able to undone!',
			showCancelButton: true,
			confirmButtonText: 'Ok',
		}).then(async (result) => {
			if (result.isConfirmed) {
				await RemoveUserFromBatch({ batch_id, student_user_id })
				toast.success('Student Remove Successfully')
				fetchData()
			}
		})

	useEffect(() => {
		fetchData()
	}, [batch_id])

	useEffect(() => {
		fetchStudentData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchStudentData()
		}
	}, [searchTerm])

	const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setBatchData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const filteredUserData = timeTableData.filter((user: any) =>
		user._id.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedUserData = filteredUserData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const filteredBatchData = batchData?.users?.filter((sale: any) =>
		sale?.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedBatchData = filteredBatchData?.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const studentOptions = userStudentData.map((student: any) => ({
		value: student._id,
		label: `${student.first_name} ${student.last_name}`,
	}))

	const handleMultiSelectChange = (selected: any) => {
		setBatchData((prevData: any) => ({
			...prevData,
			user: selected,
		}))
	}

	const handleUpdateBatchClick = async () => {
		try {
			setIsSubmitting(true)

			const payload: any = {
				batch_id: batch_id,
				batch_name: batchData.batch_name,
				batch_start_date: DayJS(batchData.batch_start_date).format('YYYY/MM/DD'),
				batch_end_date: DayJS(batchData.batch_end_date).format('YYYY/MM/DD'),
			}

			await UpdateStudentBatch(payload)
			toast.success('Updated Successfully')
			fetchData()

			setShowStudentModal(false)
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleUpdateButtonClick = async () => {
		try {
			setIsSubmitting(true)

			const course: any = batchData.user.map((el: any) => {
				return el.value
			})

			const payload: any = {
				batch_id: batch_id,
				batch_name: batchData.batch_name,
				users: course,
			}

			await UpdateStudentBatch(payload)
			toast.success('Updated Successfully')
			fetchData()

			setShowStudentModal(false)
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleAddTimeTable = async () => {
		try {
			setIsSubmitting(true)

			// Define required fields and error messages
			const requiredFields: { [key: string]: string } = {
				day: 'Date is required',
				start_time: 'Start Time is required',
				end_time: 'End Time is required',
				meeting_link: 'Meeting Link is required',
				meeting_platform: 'Meeting Platform is required',
				password: 'Password is required',
				notes: 'Notes are required',
			}

			// Check for missing fields
			for (const [key, message] of Object.entries(requiredFields)) {
				if (!batchData[key]) {
					toast.error(message)
					setIsSubmitting(false)
					return
				}
			}

			const payload: any = {
				batch_id: batch_id,
				timetable: [
					{
						date: batchData.day ? DayJS(batchData.day).format('YYYY/MM/DD') : '',
						...(batchData.end_date && { end_date: DayJS(batchData.end_date).format('YYYY/MM/DD') }),
						frequency_interval: batchData.frequency_interval,
						note: batchData.notes,
						time: {
							start_time: batchData.start_time,
							end_time: batchData.end_time,
						},
						meeting_link: {
							link: batchData.meeting_link,
							platform: batchData.meeting_platform,
							join_password: batchData.password,
						},
					},
				],
			}

			await UpdateStudentBatch(payload)

			setShowModal(false)
			fetchData()
			toast.success('Added Successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleMenuOpen = () => {
		setIsDropdownOpen((prevIsDropdownOpen) => !prevIsDropdownOpen)
	}

	// const handleMenuClose = () => {
	// };

	const Frequency = [
		{ value: 'daily', name: 'Daily' },
		{ value: 'weekly', name: 'Weekly' },
		{ value: 'biweekly', name: 'Biweekly' },
		{ value: 'monthly', name: 'Monthly' },
		{ value: 'yearly', name: 'Yearly' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Student Batch View</PageTitle>
			<div>
				<div className='row'>
					<div className='col-md-12 mt-3'>
						<div className='card py-10'>
							<h2 className='fw-bold text-dark m-6 mt-0 '>View Batch</h2>
							<div className='card-body row align-items-center justify-content-end'>
								<div className='col-md-4'>
									<InputField
										placeholder='Batch Name'
										type='text'
										className='fv-row mb-7'
										name='batch_name'
										label='Batch Name'
										htmlFor='batch_name'
										value={batchData.batch_name}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-4'>
									<InputField
										placeholder='Start Date'
										type='date'
										className='fv-row mb-7'
										name='batch_start_date'
										label='Start Date'
										htmlFor='batch_start_date'
										value={DayJS(batchData.batch_start_date).format('YYYY-MM-DD')}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-4'>
									<InputField
										placeholder='End Date'
										type='date'
										className='fv-row mb-7'
										name='batch_end_date'
										label='End Date'
										htmlFor='batch_end_date'
										value={DayJS(batchData.batch_end_date).format('YYYY-MM-DD')}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-2 mt-4'>
									<TableButton
										action='edit'
										onClick={handleUpdateBatchClick}
										text='Update'
										backgroundDark={true}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<KTCard className='mt-4'>
				<h2 className='fw-bold text-dark m-6 mb-3 '>Time Table</h2>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
					<div className='card-toolbar'>
						<LengthMenu
							expenseData={timeTableData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
						<TableButton
							action='add'
							onClick={() => setShowModal(true)}
							text='Add Timetable'
						/>
					</div>
				</div>
				<div className='card-body py-4'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
							<thead>
								<tr className='fw-bold text-muted'>
									<th>No</th>
									<th>Date</th>
									<th>Frequency</th>
									<th>End Date</th>
									<th>Time (Start - End)</th>
									<th>Meeting</th>
									<th>Notes</th>
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
									paginatedUserData
										// .slice()
										// .reverse()
										.map((TimeTableData: any, index: any) => (
											<tr key={index}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>{index + 1}</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{TimeTableData.date
															? DayJS(TimeTableData.date).format('DD/MM/YYYY (dddd)')
															: '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{TimeTableData.frequency_interval
															? Frequency.map((data: any) => {
																	if (data.value === TimeTableData.frequency_interval)
																		return data.name
																	return ''
															  })
															: '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{TimeTableData.end_date
															? DayJS(TimeTableData.end_date).format('DD/MM/YYYY (dddd)')
															: '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{DayJS(TimeTableData?.time?.start_time, 'HH:mm').format('hh:mm A') +
															' - ' +
															DayJS(TimeTableData?.time?.end_time, 'HH:mm').format('hh:mm A')}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<b>Platform: </b> {TimeTableData?.meeting_link?.platform || '-'}
													</span>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														<b>Link: </b> {TimeTableData?.meeting_link?.link || '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{TimeTableData.note || '-'}
													</span>
												</td>
												<td>
													<TableButton
														action='remove'
														onClick={() => notify(batchData.batch_id, TimeTableData._id)}
													/>
												</td>
											</tr>
										))
								)}
							</tbody>
						</table>
					</div>
					{paginatedUserData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{!loading && (
						<UsersListPagination
							totalPages={Math.ceil(filteredUserData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<KTCard className='mt-4'>
				<h2 className='fw-bold text-dark m-6 mb-3 '>Students Table</h2>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={studentSearchTerm}
							setSearchTerm={setStudentSearchTerm}
						/>
					</div>
					<div className='card-toolbar'>
						<LengthMenu
							expenseData={timeTableData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
						<TableButton
							action='add'
							onClick={() => setShowStudentModal(true)}
							text='Add Student'
						/>
					</div>
				</div>
				<div className='card-body py-4'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
							<thead>
								<tr className='fw-bold text-muted'>
									<th>No</th>
									<th>Student ID</th>
									<th>Full Name</th>
									<th>Email</th>
									<th>Mobile</th>
									<th>City</th>
									<th>Actions</th>
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
								) : paginatedBatchData && paginatedBatchData.length > 0 ? (
									paginatedBatchData
										.slice()
										.reverse()
										.map((student: any, index: any) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											return (
												<tr key={index}>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{actualIndex}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{student.user._id}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{student?.user?.first_name + ' ' + student?.user?.last_name || '-'}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{student?.user?.email}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{student.user.mobile}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{student?.user?.address?.city || 'N/A'}
														</span>
													</td>
													<td>
														<div className='d-flex'>
															<TableButton
																action='view'
																to={`/fgiit/users/view-user?user_id=${student.user._id}`}
															/>
															<TableButton
																action='remove'
																onClick={() => studentNotify(batchData.batch_id, student._id)}
															/>
														</div>
													</td>
												</tr>
											)
										})
								) : (
									<tr>
										<td
											colSpan={12}
											className='text-center'>
											<b>No records found</b>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
					{!loading && (
						<UsersListPagination
							totalPages={
								batchData.users ? Math.ceil(batchData.users.length / pagination.itemsPerPage) : 0
							}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<Modal
				centered
				show={showModal}
				onHide={() => setShowModal(true)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Student Batch</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body'>
						<div className='row'>
							<InputField
								placeholder='Batch Name'
								type='text'
								className='fv-row mb-7 col-md-6'
								name='batch_name'
								label='Batch Name'
								htmlFor='batch_name'
								value={batchData.batch_name}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Date'
								type='date'
								className='fv-row mb-7 col-md-6'
								name='day'
								label='Date'
								htmlFor='day'
								value={batchData.day}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Start Time'
								type='time'
								className='fv-row mb-7 col-md-6'
								name='start_time'
								label='Start Time'
								htmlFor='time'
								value={batchData.start_time}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='End Time'
								type='time'
								className='fv-row mb-7 col-md-6'
								name='end_time'
								label='End Time'
								htmlFor='end_time'
								value={batchData.end_time}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Meeting Link'
								type='text'
								className='fv-row mb-7 col-md-6'
								name='meeting_link'
								label='Meeting Link'
								htmlFor='meeting_link'
								value={batchData.meeting_link}
								onChange={handleInputChange}
							/>
							<SelectFieldManual
								className='fv-row m-0 col-md-6'
								label='Meeting Platform'
								name='meeting_platform'
								value={batchData.meeting_platform}
								onChange={handleInputChange}
								htmlFor='meeting_platform'
								options={[
									{ value: 'zoom', name: 'Zoom' },
									{ value: 'google_meet', name: 'Google Meet' },
									{ value: 'microsoft_teams', name: 'Microsoft Teams' },
								]}
							/>
							<InputField
								placeholder='Join Password'
								type='text'
								className='fv-row mb-7 col-md-6'
								name='password'
								label='Join Password'
								htmlFor='password'
								value={batchData.password}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='Notes'
								type='text'
								className='fv-row mb-7 col-md-6'
								name='notes'
								label='Notes'
								htmlFor='notes'
								value={batchData.notes}
								onChange={handleInputChange}
							/>
							<SelectFieldManual
								className='fv-row m-0 col-md-6'
								label='Frequency Interval'
								name='frequency_interval'
								value={batchData.frequency_interval}
								onChange={handleInputChange}
								htmlFor='frequency_interval'
								marginRemove={true}
								options={[
									{ value: 'daily', name: 'Daily' },
									{ value: 'weekly', name: 'Weekly' },
									{ value: 'biweekly', name: 'Biweekly' },
									{ value: 'monthly', name: 'Monthly' },
									{ value: 'yearly', name: 'Yearly' },
								]}
							/>
							{batchData.frequency_interval && (
								<InputField
									placeholder='End Date'
									type='date'
									className='fv-row mb-7 col-md-6'
									name='end_date'
									label='End Date'
									htmlFor='end_date'
									value={batchData.end_date}
									onChange={handleInputChange}
								/>
							)}
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='add'
							onClick={handleAddTimeTable}
							text={isSubmitting ? 'Please wait, Adding Timetable...' : 'Add Timetable'}
							showIcon={false}
							disabled={isSubmitting}
							className={`mx-2 ${isSubmitting ? 'disabled' : ''}`}
						/>
					</div>
				</div>
			</Modal>

			<Modal
				centered
				show={showStudentModal}
				onHide={() => setShowStudentModal(true)}>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Add Student</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowStudentModal(false)}>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body'>
						<div
							className='row'
							onClick={handleMenuOpen}
							role='button'
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleMenuOpen()
							}}>
							<label
								htmlFor='selected'
								className='fw-bold fs-6 mb-5'>
								Students
							</label>
							<AsyncPaginate
								debounceTimeout={1000}
								value={batchData.user}
								loadOptions={loadUserOptionsFGIITStudents}
								closeMenuOnSelect={false}
								onChange={handleMultiSelectChange}
								isMulti
							/>
							{/* <MultiSelect
								className='fv-row'
								options={studentOptions}
								value={batchData.user}
								onChange={handleMultiSelectChange}
								labelledBy='Select'
							/> */}
						</div>
					</div>
					<div className='modal-footer justify-content-end'>
						<TableButton
							action='add'
							onClick={handleUpdateButtonClick}
							text={isSubmitting ? 'Please wait, Adding Student...' : 'Add Student'}
							showIcon={false}
							disabled={isSubmitting}
							backgroundDark={true}
							className={`mx-2 ${isSubmitting ? 'disabled' : ''}`}
						/>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default BatchView
