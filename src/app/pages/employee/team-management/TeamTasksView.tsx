import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import {
	ActionTask,
	CreateTask,
	DeleteTask,
	GetTask,
	UpdateTask,
} from '../../../Functions/FGGroup/TaskManagement'

type TaskFormData = {
	taskName: string
	remark: string
	start_date: Date | any
	end_date: Date | any
	file: File | null
}

const TeamTasksView: React.FC = () => {
	const intl = useIntl()
	const location = useLocation()
	const [searchParams] = useSearchParams()
	const ids = searchParams.get('ids')
	const teamPosition = searchParams.get('position') || 'Team'

	const [searchTerm, setSearchTerm] = useState('')
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
	const [hrStatus, setHrStatus] = useState<'Select' | 'Pending' | 'Employee Done' | 'HR Done'>(
		'Select'
	)

	const [showModal, setShowModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)

	// Recording
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [audioURL, setAudioURL] = useState<string | null>(null)
	const [audioFile, setAudioFile] = useState<File | null>(null)
	const [isRecording, setIsRecording] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)

	let navigate = useNavigate()
	const [selectedOption, setSelectedOption] = useState('fileUpload')
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [editTaskData, setEditTaskData] = useState<any>({})
	const [employeeData, setEmployeeData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)

	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		const now = new Date()
		const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
		return [start, end]
	})

	const [submitLoading, setSubmitLoading] = useState(false)
	const [taskFormData, setTaskFormData] = useState<TaskFormData>({
		taskName: '',
		remark: '',
		start_date: null,
		end_date: null,
		file: null,
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	// State for bulk task operations
	const [selectedTasks, setSelectedTasks] = useState<string[]>([])
	const [selectAll, setSelectAll] = useState(false)

	const fetchAssignTaskData = async (page?: number) => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			}

			const formatDate = (date: Date) => {
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			}

			const idList = selectedEmployee?.id ? [selectedEmployee.id] : ids ? ids.split(',') : []

			if (idList.length === 0) {
				setAssignTaskData([])
				setLoading(false)
				return
			}

			// For simplicity and consistency with TeamTasksView logic:
			const responses = await Promise.all(
				idList.map((id) =>
					GetTask({
						admin_id: id,
						start_date: startDate ? formatDate(startDate) : undefined,
						end_date: endDate ? formatDate(endDate) : undefined,
						// Fetching more per person to combined and then paginate frontend-style for now
						// to maintain the "AssignTaskList" feel with combined view
						limit: 1000,
					})
				)
			)

			let combinedTasks = responses.flatMap((res: any) => res.data || [])

			// Apply HR Status filter
			if (hrStatus !== 'Select') {
				if (hrStatus === 'Pending') {
					combinedTasks = combinedTasks.filter((task: any) => task.status === 'PENDING')
				} else if (hrStatus === 'Employee Done') {
					combinedTasks = combinedTasks.filter(
						(task: any) => task.status === 'COMPLETED' && task.hr_status === 'pending'
					)
				} else if (hrStatus === 'HR Done') {
					combinedTasks = combinedTasks.filter(
						(task: any) => task.status === 'COMPLETED' && task.hr_status === 'complete'
					)
				}
			}

			// Apply Search Term filterx
			if (searchTerm) {
				const lowerSearch = searchTerm.toLowerCase()
				combinedTasks = combinedTasks.filter((task: any) =>
					task.task_title?.toLowerCase().includes(lowerSearch)
				)
			}

			// Sort
			combinedTasks.sort((a: any, b: any) => {
				const valA = a[sort] || ''
				const valB = b[sort] || ''
				if (sortOrder === 'asc') return valA > valB ? 1 : -1
				return valA < valB ? 1 : -1
			})

			setAssignTaskData(combinedTasks)
			setMetaData({
				totalPages: Math.ceil(combinedTasks.length / pagination.itemsPerPage) || 1,
				totalItems: combinedTasks.length,
			})
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchEmployeeData = async () => {
		try {
			const response = await GetEmployees()
			if (response.data && Array.isArray(response.data)) {
				const idList = ids ? ids.split(',') : []
				const filteredData = response.data.filter((emp: any) => idList.includes(emp._id))
				setEmployeeData(filteredData.map((el: any) => ({ name: el.full_name, id: el._id })))
			}
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [ids])

	useEffect(() => {
		fetchAssignTaskData()
	}, [
		selectedDateRange,
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedEmployee,
		hrStatus,
		searchTerm,
	])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleEmployeeSelect = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		if (event.target instanceof HTMLSelectElement) {
			const selectedName = event.target.value
			if (selectedName === 'Select Employee') {
				setSelectedEmployee(null)
			} else {
				const emp = employeeData.find((el: any) => el.name === selectedName)
				setSelectedEmployee(emp)
			}
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}

	const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		if (event.target instanceof HTMLSelectElement) {
			const status = event.target.value as any
			setHrStatus(status)
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		setSubmitLoading(true)
		try {
			const { taskName, remark, start_date, end_date, file } = taskFormData

			let fileUrl = ''
			if (file) {
				const response: any = await FileUploadToFGGroup([file], {
					directory: 'files',
				})
				fileUrl = response.data?.fileURLs[0]
				toast.success('File uploaded successfully')
			}

			const payload: any = {
				task_title: taskName,
				remark_by_hr: remark,
				start_date: start_date,
				end_date: end_date,
				file_url: fileUrl ? [fileUrl] : [],
				admin_id: selectedEmployee.id,
			}

			await CreateTask(payload)

			setShowModal(false)
			toast.success('Task Created Successfully')
			fetchAssignTaskData()
			setTaskFormData({
				taskName: '',
				remark: '',
				start_date: null,
				end_date: null,
				file: null,
			})
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setSubmitLoading(false)
	}

	const handleUpdate = async (e: React.FormEvent) => {
		setSubmitLoading(true)
		try {
			const { id, taskName, remark, start_date, end_date, status, file } = editTaskData

			let fileUrl = editTaskData.file_url || ''
			if (file instanceof File) {
				const response: any = await FileUploadToFGGroup([file], {
					directory: 'files',
				})
				fileUrl = response.data?.fileURLs[0]
				toast.success('File uploaded successfully')
			}

			const payload: any = {
				task_id: id,
				task_title: taskName,
				remark_by_hr: remark,
				start_date: start_date,
				end_date: end_date,
				file_url: fileUrl ? [fileUrl] : [],
				status: status,
				admin_id: editTaskData.admin_id,
			}

			await UpdateTask(payload)

			setShowUpdateModal(false)
			toast.success('Task Updated Successfully')
			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setSubmitLoading(false)
	}

	const deleteTask = async () => {
		try {
			const { id } = editTaskData
			await DeleteTask({ task_id: id })
			fetchAssignTaskData()
			setShowUpdateModal(false)
			toast.success('Task removed successfully')
		} catch (error) {
			console.error(error)
		}
	}

	const handleInputTask = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, files } = e.target
		if (name === 'file' && files) {
			setTaskFormData((prevState) => ({ ...prevState, file: files[0] }))
		} else {
			setTaskFormData((prevState) => ({ ...prevState, [name]: value }))
		}
	}

	const handleInputEditTask = (e: React.ChangeEvent<HTMLInputElement | any>) => {
		const { name, value, files } = e.target
		if (name === 'file' && files) {
			setEditTaskData((prevState: any) => ({ ...prevState, file: files[0] }))
		} else {
			setEditTaskData((prevState: any) => ({ ...prevState, [name]: value }))
		}
	}

	const startRecording = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		const recorder = new MediaRecorder(stream)
		setMediaRecorder(recorder)
		recorder.ondataavailable = (event) => {
			const blob = event.data
			setAudioBlob(blob)
			setAudioURL(URL.createObjectURL(blob))
			const file = new File([blob], 'recording.mp3', { type: 'audio/mp3' })
			setAudioFile(file)
			setTaskFormData((prevState) => ({ ...prevState, file: file }))
		}
		recorder.start()
		setIsRecording(true)
	}

	const stopRecording = () => {
		mediaRecorder?.stop()
		setIsRecording(false)
	}

	const startAudio = (e: any) => {
		const audio = new Audio(audioURL || '')
		audio.play()
		setIsPlaying(true)
		audio.onended = () => setIsPlaying(false)
	}

	const stopAudio = () => setIsPlaying(false)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSortChange = (newSort: string, newSortOrder: any) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const openActionModal = (id: string) => {
		Swal.fire({
			icon: 'warning',
			title: 'Are you sure?',
			text: 'Please provide a remark for this task.',
			input: 'text',
			inputPlaceholder: 'Enter Remark (optional)',
			showCancelButton: true,
			confirmButtonText: 'Ok',
		}).then(async (result) => {
			if (result.isConfirmed) {
				const payload: any = {
					task_id: id,
					status: 'PENDING',
					remark_by_hr: result.value,
				}
				await ActionTask(payload)
				toast.success('Task Reassigned Successfully')
				fetchAssignTaskData()
			}
		})
	}

	const handleNavigate = (page: string, viewData?: any) => {
		if (page === 'add') {
			if (!selectedEmployee) {
				toast.error('Please select an employee first')
				return
			}
			navigate(`/employee/team-task-add?employeeId=${selectedEmployee?.id}`)
		} else if (page === 'view') {
			navigate(`/employee/task-view?id=${viewData.id}&adminId=${viewData.admin_id}`, {
				state: viewData,
			})
		}
	}

	const paginatedTaskData = assignTaskData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const sortableFields = [
		{ title: 'Select', field: 'select' },
		...(!selectedEmployee ? [{ title: 'Name', field: 'employee_name' }] : []),
		{ title: 'Task', field: 'task_title' },
		{ title: 'Start Date', field: 'start_date' },
		{ title: 'End Date', field: 'end_date' },
		{ title: 'Employee Status', field: 'employee_status' },
		{ title: 'HR Status', field: 'status' },
		{ title: 'Completed Date', field: 'completed_date' },
	]

	const handleRowClick = (id: string) => {
		setVisibleDetails(visibleDetails === id ? null : id)
	}

	const ShowDocument = (document: any) => {
		const downloadUrl = `https://files.fggroup.in/${document}`
		window.open(downloadUrl)
	}

	const handleTaskSelection = (taskId: string, isChecked: boolean) => {
		if (isChecked) setSelectedTasks((prev) => [...prev, taskId])
		else {
			setSelectedTasks((prev) => prev.filter((id) => id !== taskId))
			setSelectAll(false)
		}
	}

	const handleSelectAll = (isChecked: boolean) => {
		setSelectAll(isChecked)
		if (isChecked) {
			const completableTaskIds = assignTaskData
				.filter((task) => task.status === 'COMPLETED' && task.hr_status === 'pending')
				.map((task) => task._id)
			setSelectedTasks(completableTaskIds)
		} else setSelectedTasks([])
	}

	const handleBulkTaskCompletion = async () => {
		if (selectedTasks.length === 0) return
		const result = await Swal.fire({
			icon: 'question',
			title: 'Are you sure?',
			text: `Do you want to complete ${selectedTasks.length} task(s)?`,
			showCancelButton: true,
			confirmButtonText: 'Yes',
		})
		if (result.isConfirmed) {
			try {
				setSubmitLoading(true)
				const promises = selectedTasks.map((taskId) => {
					const taskData = assignTaskData.find((t) => t._id === taskId)
					return UpdateTask({
						task_id: taskId,
						hr_status: 'complete',
						admin_id: taskData.admin_id,
						task_title: taskData.task_title,
						start_date: taskData.start_date,
						end_date: taskData.end_date,
					})
				})
				await Promise.all(promises)
				toast.success(`${selectedTasks.length} task(s) completed successfully!`)
				setSelectedTasks([])
				setSelectAll(false)
				fetchAssignTaskData()
			} catch (error: any) {
				toast.error('Error completing tasks: ' + error.message)
			} finally {
				setSubmitLoading(false)
			}
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>{`Team Tasks: ${teamPosition}`}</PageTitle>
			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div>
						<h3 className='fw-bolder text-gray-900 m-0'>Currently Running Tasks</h3>
						<span className='text-muted fs-7'>Monitor and review tasks across your team members</span>
					</div>
					<div className='d-flex align-items-center gap-3 flex-wrap'>
						<button
							onClick={() => handleNavigate('add')}
							className='btn btn-primary rounded-pill px-5 fw-bold d-inline-flex align-items-center gap-2'>
							<KTIcon iconName='plus' className='fs-2' />
							<span>Add Task</span>
						</button>
					</div>

					<div className='w-100 mt-2 pt-3 border-top border-gray-100'>
						<div className='d-flex align-items-center justify-content-between flex-wrap gap-3'>
							<div className='d-flex align-items-center flex-wrap gap-3'>
								<div className='w-220px'>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={setSearchTerm}
									/>
								</div>

								<div className='w-200px'>
									<SelectField
										className='fv-row m-0'
										name='employee'
										label='Employee'
										showLabel={false}
										value={selectedEmployee?.name}
										onChange={handleEmployeeSelect}
										htmlFor='employee'
										options={['All Members', ...employeeData.map((el: any) => el.name)]}
										marginRemove={true}
									/>
								</div>

								<div className='w-160px'>
									<SelectField
										className='fv-row m-0'
										name='hrStatus'
										label='HR Status'
										showLabel={false}
										value={hrStatus}
										onChange={handleStatusChange}
										htmlFor='hrStatus'
										options={['Select', 'Pending', 'Employee Done', 'HR Done']}
										marginRemove={true}
									/>
								</div>

								<div className='w-220px'>
									<DateFilter
										onDateRangeChange={handleDateRangeChange}
										leftValue='-270px'
									/>
								</div>

								<LengthMenu
									expenseData={assignTaskData}
									handleItemsPerPageChange={(pageSize) =>
										setPagination((prev) => ({ ...prev, itemsPerPage: pageSize }))
									}
								/>
							</div>
						</div>
					</div>
				</div>

				{assignTaskData.some(
					(task) => task.status === 'COMPLETED' && task.hr_status === 'pending'
				) && (
					<div className='mx-6 my-3 p-3 bg-light-warning rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-3'>
						<div className='d-flex align-items-center'>
							<input
								type='checkbox'
								id='selectAll'
								checked={selectAll}
								onChange={(e) => handleSelectAll(e.target.checked)}
								className='form-check-input me-3'
							/>
							<label
								htmlFor='selectAll'
								className='form-check-label fw-bold text-gray-800 fs-7'>
								Select All Pending Completion (
								{
									assignTaskData.filter(
										(t) => t.status === 'COMPLETED' && t.hr_status === 'pending'
									).length
								}
								)
							</label>
						</div>
						<div>
							<button
								onClick={handleBulkTaskCompletion}
								className={`btn btn-success btn-sm rounded-pill px-4 fw-bold ${selectedTasks.length > 0 ? '' : 'invisible'}`}
								disabled={submitLoading}>
								<KTIcon iconName='check' className='fs-2 me-1' />
								Complete {selectedTasks.length} Task(s)
							</button>
						</div>
					</div>
				)}

				<div className='card-body py-4 px-6'>
					<div className='table-responsive'>
						<Table
							data={paginatedTaskData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							disableSortFields={[
								'task_title',
								'start_date',
								'end_date',
								'employee_name',
								'select',
								'employee_status',
								'status',
							]}
							renderRow={(task: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={task._id}>
									<tr
										onClick={() => handleRowClick(task._id)}
										className='data-row'
										style={{ verticalAlign: 'middle', borderBottom: '1px solid #f1f1f4' }}>
										<td className='text-center py-3' style={{ width: '60px' }}>
											<span className='badge badge-light-secondary fw-bolder px-2 py-1' style={{ borderRadius: '6px' }}>{actualIndex}</span>
										</td>
										<td className='text-center py-3'>
											{task.status === 'COMPLETED' && task.hr_status === 'pending' ? (
												<input
													type='checkbox'
													checked={selectedTasks.includes(task._id)}
													onChange={(e) => handleTaskSelection(task._id, e.target.checked)}
													className='form-check-input'
												/>
											) : (
												<span className='text-muted'>-</span>
											)}
										</td>
										{!selectedEmployee && (
											<td className='py-3'>
												<span className='text-gray-900 fw-bold fs-7'>
													{employeeData.find((emp) => emp.id === task.admin_id)?.name || '-'}
												</span>
											</td>
										)}
										<td className='py-3'>
											<span className='text-gray-900 fw-bold fs-7'>{task.task_title}</span>
										</td>
										<td className='py-3 text-muted fs-8'>
											{DayJS(task.start_date).format('DD/MM/YYYY')}
										</td>
										<td className='py-3 text-muted fs-8'>
											{DayJS(task.end_date).format('DD/MM/YYYY')}
										</td>
										<td className='py-3'>
											<span
												className={`badge badge-light-${
													task.status === 'PENDING' ? 'warning' : 'success'
												} fw-bold px-2 py-1 fs-8`}
												style={{ borderRadius: '6px' }}>
												{task.status.charAt(0).toUpperCase() + task.status.slice(1).toLowerCase()}
											</span>
										</td>
										<td className='py-3'>
											<span
												className={`badge badge-light-${
													task.hr_status === 'complete' ? 'success' : 'warning'
												} fw-bold px-2 py-1 fs-8`}
												style={{ borderRadius: '6px' }}>
												{task.hr_status.charAt(0).toUpperCase() +
													task.hr_status.slice(1).toLowerCase()}
											</span>
										</td>
										<td className='py-3 text-muted fs-8'>
											{task.completed_date
												? DayJS(task.completed_date).format('DD/MM/YYYY')
												: '-'}
										</td>
										<td className='py-3 text-end pe-4'>
											<div className='d-flex gap-2 justify-content-end'>
												<TableButton
													action='view'
													onClick={() =>
														handleNavigate('view', {
															id: task._id,
															taskId: task._id,
															admin_id: task.admin_id,
															taskName: task.task_title,
															remark: task.remark_by_hr,
															start_date: task.start_date,
															end_date: task.end_date,
														})
													}
												/>
												{task.status === 'COMPLETED' && (
													<TableButton
														action='assign'
														text='Re-assign'
														onClick={() => openActionModal(task._id)}
														className='ms-2 d-flex'
														showIcon={false}
													/>
												)}
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr
											className='detail-row is-visible shadow-sm'
											style={{ background: '#f9f9f9' }}>
											<td
												colSpan={13}
												className='p-6'>
												<div className='row'>
													<div className='col-md-6'>
														<p className='mb-1'>
															<strong>Task Title:</strong> {task.task_title}
														</p>
														<p className='mb-1'>
															<strong>Remark by Employee:</strong> {task.remark_by_employee || '-'}
														</p>
														<p className='mb-1'>
															<strong>Remark by HR:</strong> {task.remark_by_hr || '-'}
														</p>
													</div>
													<div className='col-md-6'>
														<p className='mb-1'>
															<strong>Status:</strong> {task.status}
														</p>
														<p className='mb-1'>
															<strong>Period:</strong> {DayJS(task.start_date).format('DD/MM/YYYY')}{' '}
															to {DayJS(task.end_date).format('DD/MM/YYYY')}
														</p>
														<p className='mb-0'>
															<strong>File:</strong>{' '}
															{task.file_url ? (
																<Button
																	variant='link'
																	className='p-0'
																	onClick={() => ShowDocument(task.file_url)}>
																	View Attachment
																</Button>
															) : (
																'None'
															)}
														</p>
													</div>
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

					{assignTaskData.length === 0 && !loading && (
						<div className='d-flex flex-column align-items-center justify-content-center py-12 text-center'>
							<div className='symbol symbol-60px mb-4'>
								<span className='symbol-label bg-light-primary text-primary fs-2'>📋</span>
							</div>
							<h5 className='fw-bold text-gray-800 mb-1'>No Team Tasks Found</h5>
							<p className='text-muted fs-7 mb-0'>No running tasks found matching the filter criteria.</p>
						</div>
					)}

					<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
						<div className='text-muted fs-7 fw-semibold'>
							Showing {assignTaskData.length === 0 ? 0 : (pagination.page - 1) * pagination.itemsPerPage + 1} to{' '}
							{Math.min(pagination.page * pagination.itemsPerPage, assignTaskData.length)} of {assignTaskData.length} records
						</div>
						{assignTaskData.length > 0 && (
							<UsersListPagination
								totalPages={Math.ceil(assignTaskData.length / pagination.itemsPerPage) || 1}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

export default TeamTasksView
