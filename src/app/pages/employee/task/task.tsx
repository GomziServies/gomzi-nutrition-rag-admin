import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { FileUploadToFGGroup, GetEmployeeRating } from '../../../Functions/FGGroup'
import {
	ActionTask,
	CreateTask,
	GetTask,
	UpdateTask,
} from '../../../Functions/FGGroup/TaskManagement'

interface PaginationState {
	page: number
	itemsPerPage: number
}

type TaskFormData = {
	taskName: string
	remark: string
	start_date: Date | any
	end_date: Date | any
	file: File | null
}

const EmployeeTask: React.FC = () => {
	let employeeData: any = localStorage.getItem('fg_group_info')
	const [searchTerm, setSearchTerm] = useState(
		() => localStorage.getItem('emp_task_searchTerm') || ''
	)
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		const storedRange =
			localStorage.getItem('emp_task_selectedDateRange') ||
			localStorage.getItem('selectedDateRange')
		if (storedRange) {
			try {
				const parsed = JSON.parse(storedRange)
				return [new Date(parsed[0]), new Date(parsed[1])]
			} catch (e) {
				return null
			}
		}
		return null
	})
	const [showModal, setShowModal] = useState(false)
	const [selectedOption, setSelectedOption] = useState('fileUpload')
	const [showActionModal, setShowActionModal] = useState(false)
	const [actionTaskId, setActionTaskId] = useState<string | null>(null)
	const [selectedStatus, setSelectedStatus] = useState('PENDING')
	const [remark, setRemark] = useState('')
	const [completeTaskFile, setCompleteTaskFile] = useState<File | null>(null)
	// Recording
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [audioURL, setAudioURL] = useState<string | null>(null)
	const [audioFile, setAudioFile] = useState<File | null>(null)
	const [isRecording, setIsRecording] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)
	const [submitLoading, setSubmitLoading] = useState(false)
	const [employeeStatuses, setEmployeeStatuses] = useState<{ [key: string]: string }>({})
	const [rejectionReasons, setRejectionReasons] = useState<{ [key: string]: string }>({})
	let navigate = useNavigate()

	const isFirstDateRangeCall = useRef(true)

	const [pagination, setPagination] = useState<PaginationState>(() => {
		try {
			const saved = localStorage.getItem('emp_task_pagination')
			return saved ? JSON.parse(saved) : { page: 1, itemsPerPage: 10 }
		} catch (e) {
			return { page: 1, itemsPerPage: 10 }
		}
	})
	const [taskFormData, setTaskFormData] = useState<TaskFormData>({
		taskName: '',
		remark: '',
		start_date: null,
		end_date: null,
		file: null,
	})

	const fetchAssignTaskData = async (page?: number) => {
		let employeeData: any = localStorage.getItem('fg_group_info')
		employeeData = JSON.parse(employeeData)
		setLoading(true)
		let startDate: Date | null = null
		let endDate: Date | null = null

		if (selectedDateRange) {
			;[startDate, endDate] = selectedDateRange
			endDate = new Date(endDate.setHours(23, 59, 59, 999))
		} else {
			const now = new Date()
			startDate = new Date(now.getFullYear(), now.getMonth(), 1)
			endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
		}

		try {
			let startDate: any = null
			let endDate: any = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			}

			const formatDate = (date: Date) => {
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			}

			const response = await GetTask({
				admin_id: employeeData._id,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
				start_date: startDate ? formatDate(startDate) : undefined,
				end_date: endDate ? formatDate(endDate) : undefined,
			})

			setAssignTaskData(response.data || [])

			const metadata: any = response.metadata
			if (metadata && metadata.pagination) {
				setMetaData(metadata.pagination)
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		employeeData = JSON.parse(employeeData)
		fetchAssignTaskData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange, searchTerm])

	useEffect(() => {
		if (selectedDateRange) {
			localStorage.setItem('emp_task_selectedDateRange', JSON.stringify(selectedDateRange))
		} else {
			localStorage.removeItem('emp_task_selectedDateRange')
		}
	}, [selectedDateRange])

	useEffect(() => {
		localStorage.setItem('emp_task_pagination', JSON.stringify(pagination))
	}, [pagination])

	const [rattingData, setRattingData] = useState<any>([])
	const fetchRattingData = async () => {
		let employeeData: any = localStorage.getItem('fg_group_info')
		employeeData = JSON.parse(employeeData)
		setLoading(true)
		try {
			let startDate: any = null
			let endDate: any = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			} else {
				const now = new Date()
				startDate = new Date(now.getFullYear(), now.getMonth(), 1)
				endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
			}

			if (employeeData._id) {
				const response = await GetEmployeeRating({
					admin_id: employeeData._id,
					from_date: startDate,
					to_date: endDate,
				})

				const data: any = response.data
				setRattingData(data)
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchRattingData()
	}, [selectedDateRange])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		localStorage.setItem('emp_task_searchTerm', searchTerm)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	const handleSubmit = async (e: React.FormEvent) => {
		setSubmitLoading(true)
		try {
			const { taskName, remark, start_date, end_date, file } = taskFormData

			let fileUrls: string[] = []
			if (file) {
				const response: any = await FileUploadToFGGroup([file], {
					directory: 'files',
				})
				if (response.data?.fileURLs && response.data.fileURLs.length > 0) {
					fileUrls = [response.data.fileURLs[0]]
				}
				toast.success('File uploaded successfully')
			}

			const payload: any = {
				task_title: taskName,
				remark_by_employee: remark,
				start_date: start_date,
				end_date: end_date,
				file_url: fileUrls,
				admin_id: JSON.parse(employeeData)._id,
			}

			await CreateTask(payload)

			setShowModal(false)
			toast.success('Task Created Successfully')
			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setSubmitLoading(false)
	}

	const handleInputTask = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, files } = e.target

		if (name === 'file' && files && files.length > 0) {
			const file = files[0]
			const lowerName = file.name.toLowerCase()
			let selectedFile = file

			if (
				lowerName.includes('spreadsheetml.sheet') ||
				lowerName.includes('ms-excel') ||
				file.type.includes('spreadsheetml') ||
				file.type.includes('ms-excel')
			) {
				if (
					!lowerName.endsWith('.xlsx') &&
					!lowerName.endsWith('.xls') &&
					!lowerName.endsWith('.csv')
				) {
					selectedFile = new File([file], file.name + '.xlsx', { type: file.type })
				}
			}

			setTaskFormData((prevState) => ({
				...prevState,
				file: selectedFile,
			}))
		} else {
			setTaskFormData((prevState) => ({
				...prevState,
				[name]: name === 'endDate' ? new Date(value) : value,
			}))
		}
	}

	const startRecording = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault() // Prevent form submission
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		const recorder = new MediaRecorder(stream)
		setMediaRecorder(recorder)
		recorder.ondataavailable = (event) => {
			const blob = event.data
			setAudioBlob(blob)
			setAudioURL(URL.createObjectURL(blob)) // Update audioURL with the recorded audio

			const file = new File([blob], 'recording.mp3', { type: 'audio/mp3' })
			setAudioFile(file)

			setTaskFormData((prevState) => ({
				...prevState,
				file: file,
			}))
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
		audio.onended = () => {
			setIsPlaying(false)
		}
	}

	const stopAudio = () => {
		const audio = new Audio(audioURL || '')
		audio.pause()
		setIsPlaying(false)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const sortableFields = [
		{ title: 'Task', field: 'task_title' },
		{ title: 'Start Date', field: 'start_date' },
		{ title: 'End Date', field: 'end_date' },
		{ title: 'Employee status', field: 'employee_status' },
		{ title: 'HR Status', field: 'status' },
		{ title: 'Completed Date', field: 'completed_date' },
	]

	const handleSortChange = (newSort: string, newSortOrder: any) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const openActionModal = (task_id: string) => {
		setActionTaskId(task_id)
		setShowActionModal(true)
	}

	// Function to handle the action
	const handleActionSubmit = async () => {
		try {
			let fileUrl = ''
			if (completeTaskFile) {
				const response: any = await FileUploadToFGGroup([completeTaskFile], {
					directory: 'files',
				})
				fileUrl = response.data?.fileURLs[0]
				toast.success('File uploaded successfully')
			}

			const payload: any = {
				task_id: actionTaskId,
				status: selectedStatus,
				remark_by_employee: remark,
				file_url: fileUrl,
			}

			await ActionTask(payload)
			toast.success('Task Completed Successfully')
			fetchAssignTaskData()
			fetchRattingData()
			setShowActionModal(false)
			setCompleteTaskFile(null)
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const ShowDocument = (document: any) => {
		const downloadUrl = `https://files.fggroup.in/${document}`
		window.open(downloadUrl)
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		if (isFirstDateRangeCall.current) {
			isFirstDateRangeCall.current = false
			const saved =
				localStorage.getItem('emp_task_selectedDateRange') ||
				localStorage.getItem('selectedDateRange')
			if (saved) return
		}

		const isSame =
			(!range && !selectedDateRange) ||
			(range &&
				selectedDateRange &&
				range[0].getTime() === selectedDateRange[0].getTime() &&
				range[1].getTime() === selectedDateRange[1].getTime())

		if (!isSame) {
			setSelectedDateRange(range)
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}

	const paginatedTaskData = assignTaskData

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

	const handleAccept = (taskId: any) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'You want to accept this task?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, accept it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					const task = assignTaskData.find((t: any) => t._id === taskId)
					if (!task) return

					await UpdateTask({
						task_id: taskId,
						employee_status: 'accepted',
						task_title: task.task_title,
						start_date: task.start_date,
						end_date: task.end_date,
						admin_id: task.admin_id,
					})

					setEmployeeStatuses((prev) => ({
						...prev,
						[taskId]: 'ACCEPTED',
					}))

					toast.success('Task accepted successfully')
					fetchAssignTaskData()
				} catch (error: any) {
					toast.error(error.message || 'Failed to accept task')
					console.error(error)
				}
			}
		})
	}

	const handleReject = (taskId: any) => {
		Swal.fire({
			title: 'Reject Task?',
			input: 'textarea',
			inputLabel: 'Reason for rejection',
			inputPlaceholder: 'Type your reason here...',
			inputAttributes: {
				'aria-label': 'Type your reason here',
			},
			showCancelButton: true,
			confirmButtonText: 'Submit',
			cancelButtonText: 'Cancel',
			preConfirm: (value) => {
				if (!value.trim()) {
					Swal.showValidationMessage('Reason is required!')
				}
				return value
			},
		}).then(async (result) => {
			if (result.isConfirmed) {
				const reason = result.value
				try {
					const task = assignTaskData.find((t: any) => t._id === taskId)
					if (!task) return

					await UpdateTask({
						task_id: taskId,
						employee_status: 'rejected',
						reject_reason: reason,
						task_title: task.task_title,
						start_date: task.start_date,
						end_date: task.end_date,
						admin_id: task.admin_id,
					})

					setEmployeeStatuses((prev) => ({
						...prev,
						[taskId]: 'REJECTED',
					}))

					setRejectionReasons((prev) => ({
						...prev,
						[taskId]: reason,
					}))

					toast.success('Task rejected successfully')
					fetchAssignTaskData()
				} catch (error: any) {
					toast.error(error.message || 'Failed to reject task')
					console.error(error)
				}
			}
		})
	}

	const handleViewReason = (taskId: any) => {
		const reason = rejectionReasons[taskId]
		Swal.fire({
			title: 'Rejection Reason',
			text: reason || 'No reason provided.',
			icon: 'info',
			confirmButtonText: 'Close',
		})
	}

	const handlenavigate = (taskId: any) => {
		navigate(`/employee/task-view?id=${taskId}`)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Task Assignment</PageTitle>
			<KTCard>
				<h2 className='m-6 mb-0'>Currently Running Tasks</h2>
				<div className='row card-header border-0 pt-0 align-items-center ms-0 mx-md-6 p-0'>
					<div className='col-md-9'>
						<div className='row mt-3 justify-content-between'>
							<div className='col-md-12 mt-md-7 d-flex justify-content-between align-items-center card-toolbar'>
								<div className='col-md-2 fv-row'>
									<InputField
										placeholder='Enter remark'
										type='text'
										className='col-12 fv-row'
										name='remark'
										label='Task Rating'
										htmlFor='Remark'
										labelMarginRemove={true}
										value={rattingData?.rating + '%'}
									/>
								</div>
								<div className='d-md-flex'>
									{assignTaskData?.length > 0 && (
										<select
											className='form-select form-select-sm mx-3'
											style={{ width: '80px' }}
											value={pagination.itemsPerPage}
											onChange={(e) =>
												setPagination((prev) => ({
													...prev,
													itemsPerPage: Number(e.target.value),
													page: 1,
												}))
											}>
											<option value='10'>10</option>
											<option value='50'>50</option>
											<option value='100'>100</option>
										</select>
									)}
									<DateFilter
										onDateRangeChange={handleDateRangeChange}
										leftValue='-270px'
										storageKey='emp_task_selectedDateRange'
									/>
									<div className='mt-md-0 mt-4 me-md-3 me-0'>
										<button
											onClick={() => setShowModal(true)}
											className='ms-md-3 mt-md-1 btn btn-primary btn-sm w-md-20 w-100'>
											<KTIcon
												iconName='plus'
												className='fs-2'
											/>
											Add Task
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className='col-md-3 mt-md-7 mt-2 d-flex align-items-center position-relative ps-0'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>

				{submitLoading && (
					<div className='loader-background'>
						<div
							className='spinner-border spinner-border-1 text-white'
							style={{ width: '50px', height: '50px' }}
							role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				)}

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={paginatedTaskData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							disableSortFields={[
								'task_title',
								'remark_by_employee',
								'remark_by_hr',
								'file_url',
								'start_date',
								'end_date',
								'employee_status',
								'status',
								'completed_date',
								'financial_worth',
								'social_worth',
							]}
							onSortChange={handleSortChange}
							renderRow={(task: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={task._id}>
									<tr
										onClick={() => handleRowClick(task._id)}
										className='data-row'>
										<td className='text-center'>
											<div className='d-flex'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
													{actualIndex}
												</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{task.task_title}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{DayJS(task.start_date).format('DD/MM/YYYY')}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
													{DayJS(task.end_date).format('DD/MM/YYYY')}
												</span>
												{task.extends_dates &&
													task.extends_dates.some((ext: any) => ext.status === 'accepted') && (
														<button
															className='btn btn-sm btn-info mb-1 py-1 ms-2 rounded-circle d-flex align-items-center justify-content-center'
															style={{ width: '16px', height: '16px', padding: '0' }}
															onClick={(e) => {
																e.stopPropagation()
																// Find the latest approved extension date
																const approvedExtensions = task.extends_dates.filter(
																	(ext: any) => ext.status === 'accepted'
																)
																if (approvedExtensions.length > 0) {
																	// Sort by date to get the latest
																	approvedExtensions.sort(
																		(a: any, b: any) =>
																			new Date(b.date).getTime() - new Date(a.date).getTime()
																	)
																	const latestExtension = approvedExtensions[0]
																	Swal.fire({
																		title: 'Extended Date',
																		html: `
																		<p><strong>Original End Date:</strong> ${DayJS(task.end_date).format('DD/MM/YYYY')}</p>
																		<p><strong>Extended To:</strong> ${DayJS(latestExtension.date).format('DD/MM/YYYY')}</p>
																		<p><strong>Reason:</strong> ${latestExtension.reason || 'N/A'}</p>
																	`,
																		icon: 'info',
																		confirmButtonText: 'Close',
																	})
																}
															}}>
															<i
																className='fas fa-info pt-0 px-0'
																style={{ fontSize: '8px', paddingBottom: '2px' }}></i>
														</button>
													)}
											</div>
										</td>
										<td>
											{task.status === 'PENDING' ? (
												task.employee_status === 'accepted' ? (
													<span className='text-success fw-bold fs-6'>Accepted</span>
												) : task.employee_status === 'rejected' ? (
													<>
														<span className='text-danger fw-bold mb-1 d-block fs-6'>Rejected</span>
														{task.reject_reason && (
															<button
																className='btn btn-sm btn-info py-1'
																onClick={() => {
																	Swal.fire({
																		title: 'Rejection Reason',
																		text: task.reject_reason || 'No reason provided.',
																		icon: 'info',
																		confirmButtonText: 'Close',
																	})
																}}>
																<i className='fas fa-eye p-0 px-1'></i>
															</button>
														)}
													</>
												) : (
													<span className='text-warning fw-bold fs-6'>Pending</span>
												)
											) : (
												<span className='text-success fw-bold text-hover-primary d-block mb-1 fs-6'>
													{task.status.charAt(0).toUpperCase() + task.status.slice(1).toLowerCase()}
												</span>
											)}
										</td>

										<td>
											<span
												className={`fw-bold text-hover-primary d-block mb-1 fs-6 ${
													task.hr_status === 'complete' ? 'text-success' : 'text-warning'
												}`}>
												{task.hr_status.charAt(0).toUpperCase() +
													task.hr_status.slice(1).toLowerCase()}
											</span>
										</td>

										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{task.completed_date && task.status === 'COMPLETED'
													? DayJS(task.completed_date).format('DD/MM/YYYY')
													: '-'}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center gap-2'>
												<button
													className='btn btn-info btn-sm'
													onClick={() => handlenavigate(task._id)}>
													<i className='fas fa-eye p-0'></i>
												</button>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}:</strong> {task.task_title}
													<br />
													<strong>{sortableFields[1].title}:</strong> {task.remark_by_employee}
													<br />
													<strong>{sortableFields[2].title}:</strong> {task.remark_by_hr}
													<br />
													<strong>{sortableFields[3].title}:</strong>{' '}
													{task.file_url ? (
														task.file_url.endsWith('.mp3') ? (
															<audio
																controls
																src={`https://files.fggroup.in/${task.file_url}`}
															/>
														) : (
															<img
																onClick={() => ShowDocument(task.file_url)}
																src={`https://files.fggroup.in/${task.file_url}`}
																alt='task file'
																style={{ width: '150px', height: 'auto' }}
																role='button'
															/>
														)
													) : (
														'No file'
													)}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{DayJS(task.start_date).format('DD/MM/YYYY')}
													<br />
													<strong>{sortableFields[5].title}:</strong>{' '}
													{DayJS(task.end_date).format('DD/MM/YYYY')}
													<br />
													<strong>{sortableFields[6].title}:</strong> {task.status}
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
					{paginatedTaskData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}

					{paginatedTaskData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>

			<Modal
				show={showModal}
				onHide={() => setShowModal(false)}
				centered>
				<Modal.Header closeButton>
					<Modal.Title>Add Task</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{/* Form fields */}
					<Form>
						<Form.Group
							className='mb-3'
							controlId='taskTitle'>
							<Form.Label>Task Title</Form.Label>
							<Form.Control
								type='text'
								placeholder='Enter task title'
								name='taskName'
								value={taskFormData.taskName}
								onChange={handleInputTask}
								required
							/>
						</Form.Group>

						<Form.Group
							className='mb-3'
							controlId='remark'>
							<Form.Label>Remark</Form.Label>
							<Form.Control
								type='text'
								placeholder='Type your remark here (optional)'
								name='remark'
								value={taskFormData.remark}
								onChange={handleInputTask}
								required
							/>
						</Form.Group>

						<Form.Group
							className='mb-3'
							controlId='start_date'>
							<Form.Label>Start Date</Form.Label>
							<Form.Control
								type='date'
								name='start_date'
								value={taskFormData.start_date ? taskFormData.start_date : ''}
								onChange={handleInputTask}
								required
							/>
						</Form.Group>

						<Form.Group
							className='mb-3'
							controlId='end_date'>
							<Form.Label>End Date</Form.Label>
							<Form.Control
								type='date'
								name='end_date'
								value={taskFormData.end_date ? taskFormData.end_date : ''}
								onChange={handleInputTask}
								required
							/>
						</Form.Group>

						<Form.Group controlId='uploadOption'>
							<Form.Label className=' mt-5'>Select File / Audio</Form.Label>
							<div className='d-flex mb-4'>
								<Form.Check
									type='radio'
									label='File Upload'
									name='uploadOption'
									id='fileUpload'
									checked={selectedOption === 'fileUpload'}
									onChange={() => setSelectedOption('fileUpload')}
									className='me-4'
								/>
								<Form.Check
									type='radio'
									label='Send Audio'
									name='uploadOption'
									id='sendAudio'
									checked={selectedOption === 'sendAudio'}
									onChange={() => setSelectedOption('sendAudio')}
								/>
							</div>
						</Form.Group>

						{selectedOption === 'fileUpload' && (
							<Form.Group
								className='mb-3'
								controlId='file'>
								<Form.Label>File Upload</Form.Label>
								<Form.Control
									type='file'
									name='file'
									onChange={handleInputTask}
									required
								/>
							</Form.Group>
						)}

						{selectedOption === 'sendAudio' && (
							<Form.Group
								className='mb-3'
								controlId='audio'>
								<Form.Label>Send Audio</Form.Label>
								<br />
								<Button
									variant='success'
									size='sm'
									onClick={startRecording}
									disabled={isRecording}>
									Record Audio
								</Button>
								<Button
									variant='info'
									size='sm'
									className='mx-3'
									onClick={startAudio}
									disabled={!audioURL || isPlaying}>
									Start Audio
								</Button>
								<Button
									variant='danger'
									size='sm'
									onClick={isRecording ? stopRecording : stopAudio}
									disabled={!isRecording && !isPlaying}>
									{isRecording ? 'Stop Recording' : 'Stop Audio'}
								</Button>
								{audioURL && (
									<audio
										controls
										src={audioURL}
										className='mt-5'>
										<track
											kind='captions'
											srcLang='en'
											label='English captions'
											default
										/>
										Your browser does not support the audio element.
									</audio>
								)}
							</Form.Group>
						)}
					</Form>
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
						Add Task
					</Button>
				</Modal.Footer>
			</Modal>

			{/* <Modal
				show={showActionModal}
				centered
				onHide={() => setShowActionModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Complete Task</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form.Group controlId='status'>
						<Form.Label>Status:</Form.Label>
						<div>
							<Form.Check
								type='radio'
								label='PENDING'
								name='taskStatus1'
								id='taskStatus1'
								value='PENDING'
								checked={selectedStatus === 'PENDING'}
								onChange={(e) => setSelectedStatus(e.target.value)}
								className='mb-3'
							/>
							<Form.Check
								type='radio'
								label='COMPLETED'
								name='taskStatus2'
								id='taskStatus2'
								value='COMPLETED'
								checked={selectedStatus === 'COMPLETED'}
								onChange={(e) => setSelectedStatus(e.target.value)}
								className='mb-5'
							/>
						</div>
					</Form.Group>
					<Form.Group controlId='remark'>
						<Form.Label>Remark:</Form.Label>
						<Form.Control
							type='text'
							placeholder='Enter Remark'
							value={remark}
							onChange={(e) => setRemark(e.target.value)}
						/>
					</Form.Group>

					<Form.Group className='mt-3' controlId='completeTaskFile'>
						<Form.Label>Attachment (optional):</Form.Label>
						<Form.Control
							type='file'
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								if (e.target.files && e.target.files[0]) {
									setCompleteTaskFile(e.target.files[0])
								}
							}}
						/>
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={() => setShowActionModal(false)}>
						Cancel
					</Button>
					<Button
						variant='primary'
						onClick={handleActionSubmit}>
						Confirm
					</Button>
				</Modal.Footer>
			</Modal> */}
		</>
	)
}

export default EmployeeTask
