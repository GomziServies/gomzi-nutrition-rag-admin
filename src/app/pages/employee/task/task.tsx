import { faPlusCircle, faStar } from '@fortawesome/free-solid-svg-icons'
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
import LengthMenu from '../../../components/LengthMenu'
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

const getStoredEmployee = () => {
	try {
		const raw =
			localStorage.getItem('fg_group_user_info') ||
			localStorage.getItem('fg_group_info') ||
			localStorage.getItem('auth_fg_group')
		return raw ? JSON.parse(raw) : {}
	} catch {
		return {}
	}
}

const EmployeeTask: React.FC = () => {
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
		const employee = getStoredEmployee()
		if (!employee?._id) return

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
			const formatDate = (date: Date) => {
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			}

			const response = await GetTask({
				admin_id: employee._id,
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
		const employee = getStoredEmployee()
		if (!employee?._id) return

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

			const response = await GetEmployeeRating({
				admin_id: employee._id,
				from_date: startDate,
				to_date: endDate,
			})

			const data: any = response.data
			setRattingData(data)
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

			const employee = getStoredEmployee()
			const payload: any = {
				task_title: taskName,
				remark_by_employee: remark,
				start_date: start_date,
				end_date: end_date,
				file_url: fileUrls,
				admin_id: employee._id,
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

	const rawRating = Array.isArray(rattingData) ? rattingData[0]?.rating : rattingData?.rating
	const ratingNum =
		rawRating !== undefined && rawRating !== null && rawRating !== '' && !isNaN(Number(rawRating))
			? Number(rawRating)
			: null
	const starCount =
		ratingNum !== null
			? ratingNum <= 5
				? Math.round(ratingNum)
				: Math.max(0, Math.min(5, Math.round((ratingNum / 100) * 5)))
			: 0

	return (
		<>
			<PageTitle breadcrumbs={[]}>Task Assignment</PageTitle>
			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				{/* Modern Header */}
				<div className='card-header border-0 pt-6 d-flex flex-column gap-4'>
					{/* Header Top: Title & Right Add Button */}
					<div className='d-flex align-items-center justify-content-between flex-wrap gap-3 w-100'>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h2 className='fw-bolder text-gray-900 mb-0'>Tasks Assignment</h2>
								<span className='badge badge-light-primary fw-bold fs-8'>
									{metaData?.totalDocs || assignTaskData.length} tasks
								</span>
							</div>
							<span className='text-muted fs-7 fw-semibold mt-1'>
								Review assigned tasks, submit completions, and track manager feedback
							</span>
						</div>

						<button
							type='button'
							onClick={() => setShowModal(true)}
							className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '10px' }}>
							<i className='bi bi-plus-lg fs-6'></i>
							<span>Add Task</span>
						</button>
					</div>

					{/* Header Bottom: Filter Bar */}
					<div className='d-flex align-items-center flex-wrap gap-3 w-100 pb-2'>
						<div style={{ minWidth: '220px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search tasks...'
							/>
						</div>

						<LengthMenu
							expenseData={assignTaskData}
							handleItemsPerPageChange={(val) =>
								setPagination((prev) => ({ ...prev, itemsPerPage: val, page: 1 }))
							}
						/>

						{/* Task Rating Widget */}
						<div
							className='d-flex align-items-center rounded-3 px-3 py-1 border'
							style={{ height: '38px', background: '#faf8f5', borderColor: '#ded8d2' }}>
							<div className='d-flex align-items-center gap-1'>
								{[1, 2, 3, 4, 5].map((star) => (
									<FontAwesomeIcon
										key={star}
										icon={faStar as any}
										className='fs-7'
										style={{ color: star <= starCount ? '#f59e0b' : '#d1d5db' }}
									/>
								))}
							</div>
							<span className='ms-2 fs-8 fw-bold text-gray-800'>
								{ratingNum !== null
									? `${ratingNum <= 5 ? ratingNum : Math.round(ratingNum / 20)}/5`
									: 'No rating'}
							</span>
						</div>

						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							rightValue='0'
							storageKey='emp_task_selectedDateRange'
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
															className='btn btn-icon btn-sm btn-light-info ms-2'
															style={{ width: '22px', height: '22px', borderRadius: '6px' }}
															title='Extension Info'
															onClick={(e) => {
																e.stopPropagation()
																const approvedExtensions = task.extends_dates.filter(
																	(ext: any) => ext.status === 'accepted'
																)
																if (approvedExtensions.length > 0) {
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
															<i className='bi bi-info-circle fs-8'></i>
														</button>
													)}
											</div>
										</td>
										<td>
											{task.status === 'PENDING' ? (
												task.employee_status === 'accepted' ? (
													<span className='badge badge-light-success px-2 py-1 fs-7 fw-semibold'>Accepted</span>
												) : task.employee_status === 'rejected' ? (
													<div className='d-flex align-items-center gap-1'>
														<span className='badge badge-light-danger px-2 py-1 fs-7 fw-semibold'>Rejected</span>
														{task.reject_reason && (
															<button
																className='btn btn-icon btn-sm btn-light-danger'
																style={{ width: '22px', height: '22px', borderRadius: '6px' }}
																title='View Reason'
																onClick={(e) => {
																	e.stopPropagation()
																	Swal.fire({
																		title: 'Rejection Reason',
																		text: task.reject_reason || 'No reason provided.',
																		icon: 'info',
																		confirmButtonText: 'Close',
																	})
																}}>
																<i className='bi bi-eye fs-8'></i>
															</button>
														)}
													</div>
												) : (
													<span className='badge badge-light-warning px-2 py-1 fs-7 fw-semibold'>Pending</span>
												)
											) : (
												<span className='badge badge-light-primary px-2 py-1 fs-7 fw-semibold'>
													{task.status.charAt(0).toUpperCase() + task.status.slice(1).toLowerCase()}
												</span>
											)}
										</td>

										<td>
											<span
												className={`badge px-2 py-1 fs-7 fw-semibold ${
													task.hr_status === 'complete' ? 'badge-light-success' : 'badge-light-warning'
												}`}>
												{task.hr_status ? task.hr_status.charAt(0).toUpperCase() + task.hr_status.slice(1).toLowerCase() : 'Pending'}
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
													className='btn btn-icon btn-sm btn-light-primary'
													style={{ width: '34px', height: '34px', borderRadius: '8px' }}
													title='View Details'
													onClick={() => handlenavigate(task._id)}>
													<i className='bi bi-eye fs-6'></i>
												</button>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div className='p-3 bg-light rounded-3'>
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
						<div className='d-flex flex-column align-items-center justify-content-center text-center py-10 w-100'>
							<div
								className='rounded-circle d-flex align-items-center justify-content-center mb-3'
								style={{ width: '56px', height: '56px', background: '#eff6ff' }}>
								<i className='bi bi-inbox fs-2' style={{ color: '#2563EB' }}></i>
							</div>
							<span className='fw-bold text-gray-700 fs-6'>No tasks found</span>
							<span className='text-muted fs-7'>No running tasks match the selected date range.</span>
						</div>
					)}

					{paginatedTaskData.length > 0 && (
						<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
							<div className='text-muted fs-7 fw-semibold'>
								Showing {Math.min((pagination.page - 1) * pagination.itemsPerPage + 1, metaData?.totalDocs || paginatedTaskData.length)} to{' '}
								{Math.min(pagination.page * pagination.itemsPerPage, metaData?.totalDocs || paginatedTaskData.length)} of {metaData?.totalDocs || paginatedTaskData.length} records
							</div>
							<UsersListPagination
								totalPages={metaData?.totalPages || 1}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						</div>
					)}
				</div>
			</div>

			<Modal
				show={showModal}
				onHide={() => setShowModal(false)}
				centered
				size='lg'>
				<Modal.Header closeButton className='border-0 pb-0 pt-6 px-6'>
					<div>
						<Modal.Title className='fw-bolder text-gray-900 fs-4 mb-1'>Add Task</Modal.Title>
						<span className='text-muted fs-7'>Create a new self-assigned or reported task</span>
					</div>
				</Modal.Header>
				<Modal.Body className='px-6 py-4'>
					<Form>
						<Form.Group className='mb-4' controlId='taskTitle'>
							<Form.Label className='fw-bold text-gray-700 fs-7'>
								Task Title <span className='text-danger'>*</span>
							</Form.Label>
							<Form.Control
								type='text'
								placeholder='Enter task title'
								name='taskName'
								value={taskFormData.taskName}
								onChange={handleInputTask}
								style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
								required
							/>
						</Form.Group>

						<Form.Group className='mb-4' controlId='remark'>
							<Form.Label className='fw-bold text-gray-700 fs-7'>Remarks / Description</Form.Label>
							<Form.Control
								as='textarea'
								rows={3}
								placeholder='Type your remarks here (optional)'
								name='remark'
								value={taskFormData.remark}
								onChange={handleInputTask}
								style={{ borderRadius: '8px', borderColor: '#ded8d2' }}
							/>
						</Form.Group>

						<div className='row g-4 mb-4'>
							<div className='col-12 col-md-6'>
								<Form.Group controlId='start_date'>
									<Form.Label className='fw-bold text-gray-700 fs-7'>
										Start Date <span className='text-danger'>*</span>
									</Form.Label>
									<Form.Control
										type='date'
										name='start_date'
										value={taskFormData.start_date ? taskFormData.start_date : ''}
										onChange={handleInputTask}
										style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
										required
									/>
								</Form.Group>
							</div>

							<div className='col-12 col-md-6'>
								<Form.Group controlId='end_date'>
									<Form.Label className='fw-bold text-gray-700 fs-7'>
										End Date <span className='text-danger'>*</span>
									</Form.Label>
									<Form.Control
										type='date'
										name='end_date'
										value={taskFormData.end_date ? taskFormData.end_date : ''}
										onChange={handleInputTask}
										style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
										required
									/>
								</Form.Group>
							</div>
						</div>

						<Form.Group controlId='uploadOption' className='mb-3'>
							<Form.Label className='fw-bold text-gray-700 fs-7 d-block mb-2'>Attachment Type</Form.Label>
							<div className='d-flex gap-4'>
								<Form.Check
									type='radio'
									label='File Upload'
									name='uploadOption'
									id='fileUpload'
									checked={selectedOption === 'fileUpload'}
									onChange={() => setSelectedOption('fileUpload')}
								/>
								<Form.Check
									type='radio'
									label='Voice Note (Audio)'
									name='uploadOption'
									id='sendAudio'
									checked={selectedOption === 'sendAudio'}
									onChange={() => setSelectedOption('sendAudio')}
								/>
							</div>
						</Form.Group>

						{selectedOption === 'fileUpload' && (
							<Form.Group className='mb-3' controlId='file'>
								<Form.Control
									type='file'
									name='file'
									onChange={handleInputTask}
									style={{ borderRadius: '8px' }}
									required
								/>
							</Form.Group>
						)}

						{selectedOption === 'sendAudio' && (
							<div className='p-3 bg-light rounded-3 border mb-3'>
								<div className='d-flex gap-2 flex-wrap'>
									<button
										type='button'
										className='btn btn-sm btn-success'
										style={{ borderRadius: '8px' }}
										onClick={startRecording}
										disabled={isRecording}>
										<i className='bi bi-mic me-1'></i> Record Audio
									</button>
									<button
										type='button'
										className='btn btn-sm btn-info'
										style={{ borderRadius: '8px' }}
										onClick={startAudio}
										disabled={!audioURL || isPlaying}>
										<i className='bi bi-play me-1'></i> Play Audio
									</button>
									<button
										type='button'
										className='btn btn-sm btn-danger'
										style={{ borderRadius: '8px' }}
										onClick={isRecording ? stopRecording : stopAudio}
										disabled={!isRecording && !isPlaying}>
										<i className='bi bi-stop me-1'></i> {isRecording ? 'Stop Recording' : 'Stop Audio'}
									</button>
								</div>
								{audioURL && (
									<audio controls src={audioURL} className='mt-3 w-100'>
										Your browser does not support the audio element.
									</audio>
								)}
							</div>
						)}
					</Form>
				</Modal.Body>
				<Modal.Footer className='border-0 pt-0 pb-6 px-6'>
					<Button
						variant='light'
						style={{ borderRadius: '8px' }}
						onClick={() => setShowModal(false)}>
						Cancel
					</Button>
					<Button
						variant='primary'
						style={{ borderRadius: '8px', minWidth: '130px' }}
						onClick={handleSubmit}
						disabled={submitLoading}>
						{submitLoading ? 'Saving...' : 'Add Task'}
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
