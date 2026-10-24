import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTIcon } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import SearchFilter from '../../../components/SearchFilter'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { clampPage, resolvePaginationMeta, sanitizePaginationState } from '../../../components/paginationMeta'
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

const HRAssignTaskList: React.FC = () => {
	const intl = useIntl()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employeeId: any = searchParams.get('employeeId')
	const [searchTerm, setSearchTerm] = useState(() => {
		return localStorage.getItem('hr_assign_task_search') || ''
	})
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(() => {
		try {
			const savedEmployee = localStorage.getItem('hr_assign_task_employee')
			if (savedEmployee) {
				return JSON.parse(savedEmployee)
			}
		} catch (error) {
			console.error('Error parsing saved employee:', error)
		}
		return null
	})
	const [hrStatus, setHrStatus] = useState<'Select' | 'Pending' | 'Employee Done' | 'HR Done'>(
		() => {
			try {
				const savedStatus = localStorage.getItem('hr_assign_task_status')
				return savedStatus
					? (savedStatus as 'Select' | 'Pending' | 'Employee Done' | 'HR Done')
					: 'Select'
			} catch (error) {
				console.error('Error parsing saved status:', error)
				return 'Select'
			}
		}
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
	let Navigate = useNavigate()
	const [selectedOption, setSelectedOption] = useState('fileUpload')
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [editTaskData, setEditTaskData] = useState<any>({})
	const [employeeData, setEmployeeData] = useState<any>([{ name: '', id: '' }])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		try {
			const savedDateRange = localStorage.getItem('selectedDateRange')
			if (savedDateRange && savedDateRange !== 'undefined') {
				const parsed = JSON.parse(savedDateRange)
				if (Array.isArray(parsed) && parsed.length === 2) {
					const [startStr, endStr] = parsed
					const start = new Date(startStr)
					const end = new Date(endStr)

					if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
						// Reset time parts to avoid timezone issues
						start.setHours(0, 0, 0, 0)
						end.setHours(23, 59, 59, 999)
						return [start, end]
					}
				}
			}
		} catch (error) {
			console.error('Error parsing saved date range:', error)
			localStorage.removeItem('selectedDateRange')
		}

		// Default to current month if no saved range or invalid data
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
	const [pagination, setPagination] = useState(() => {
		const savedPage = localStorage.getItem('hr_assign_task_page')
		const savedLimit = localStorage.getItem('hr_assign_task_limit')
		return sanitizePaginationState({
			page: savedPage ? parseInt(savedPage, 10) : 1,
			itemsPerPage: savedLimit ? parseInt(savedLimit, 10) : 10,
		})
	})

	const filteredTaskData = React.useMemo(() => {
		if (!assignTaskData) return []
		if (!searchTerm) return assignTaskData
		return assignTaskData.filter((data: any) =>
			data?.task_title?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	}, [assignTaskData, searchTerm])

	const { totalPages, totalRecords } = React.useMemo(
		() => resolvePaginationMeta(metaData, filteredTaskData.length, pagination.itemsPerPage),
		[metaData, filteredTaskData.length, pagination.itemsPerPage]
	)

	// Keep the current page inside the valid range so the list can never get stuck
	// on an out-of-bounds page (after a delete, filter change or restored session).
	React.useEffect(() => {
		if (!loading && totalPages > 0 && pagination.page > totalPages) {
			setPagination((prev) => ({ ...prev, page: clampPage(prev.page, totalPages) }))
		}
	}, [loading, totalPages, pagination.page])

	// State for bulk task operations
	const [selectedTasks, setSelectedTasks] = useState<string[]>([])
	const [selectAll, setSelectAll] = useState(false)

	// Helper function to get task priority
	const getTaskPriority = (task: any) => {
		if (task.status === 'PENDING') return 1 // Highest priority
		if (task.status === 'COMPLETED' && task.hr_status === 'pending') return 2 // Medium priority
		if (task.status === 'COMPLETED' && task.hr_status === 'complete') return 3 // Lowest priority
		return 4 // Default
	}

	// Helper function to get priority label
	const getPriorityLabel = (priority: number) => {
		switch (priority) {
			case 1:
				return 'Priority 1 (Highest): Pending tasks'
			case 2:
				return 'Priority 2 (Medium): Employee done, HR pending'
			case 3:
				return 'Priority 3 (Lowest): Both complete'
			default:
				return 'Other tasks'
		}
	}

	// Helper function to get priority background color
	const getPriorityBgColor = (priority: number) => {
		switch (priority) {
			case 1:
				return 'bg-danger bg-opacity-10' // Light red for urgent
			case 2:
				return 'bg-warning bg-opacity-10' // Light yellow for medium
			case 3:
				return 'bg-success bg-opacity-10' // Light green for completed
			default:
				return 'bg-light'
		}
	}

	// Function to handle individual task selection
	const handleTaskSelection = (taskId: string, isChecked: boolean) => {
		if (isChecked) {
			setSelectedTasks((prev) => [...prev, taskId])
		} else {
			setSelectedTasks((prev) => prev.filter((id) => id !== taskId))
			setSelectAll(false)
		}
	}

	// Function to handle select all checkbox
	const handleSelectAll = (isChecked: boolean) => {
		setSelectAll(isChecked)
		if (isChecked) {
			// Select only tasks that are employee done and HR pending
			const completableTaskIds = filteredTaskData
				.filter((task) => task.status === 'COMPLETED' && task.hr_status === 'pending')
				.map((task) => task._id)
			setSelectedTasks(completableTaskIds)
		} else {
			setSelectedTasks([])
		}
	}

	// Function to handle bulk task completion
	const handleBulkTaskCompletion = async () => {
		if (selectedTasks.length === 0) {
			toast.error('Please select at least one task to complete.')
			return
		}

		// Show simple confirmation dialog
		const result = await Swal.fire({
			icon: 'question',
			title: 'Are you sure?',
			text: `Do you want to complete ${selectedTasks.length} task?`,
			showCancelButton: true,
			confirmButtonText: 'Yes',
			cancelButtonText: 'Cancel',
		})

		if (result.isConfirmed) {
			try {
				setSubmitLoading(true)

				// Process each selected task using UpdateTask API with actual task data
				const promises = selectedTasks.map((taskId) => {
					// Find the task data from assignTaskData
					const taskData = assignTaskData.find((task) => task._id === taskId)

					if (!taskData) {
						throw new Error(`Task with ID ${taskId} not found`)
					}

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

				toast.success(`${selectedTasks.length} task completed successfully!`)

				// Reset selections and refresh data
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

	const fetchAssignTaskData = async (page?: number) => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				if (Array.isArray(selectedDateRange)) {
					startDate = selectedDateRange[0] ? new Date(selectedDateRange[0]) : null
					endDate = selectedDateRange[1] ? new Date(selectedDateRange[1]) : null
				} else if (typeof selectedDateRange === 'object') {
					const s = (selectedDateRange as any).startDate || (selectedDateRange as any).start || (selectedDateRange as any)[0]
					const e = (selectedDateRange as any).endDate || (selectedDateRange as any).end || (selectedDateRange as any)[1]
					startDate = s ? new Date(s) : null
					endDate = e ? new Date(e) : null
				}
				if (endDate && !isNaN(endDate.getTime())) {
					endDate = new Date(endDate)
					endDate.setHours(23, 59, 59, 999)
				}
			}

			// Format dates in YYYY-MM-DD format without timezone conversion issues
			const formatDate = (date: Date) => {
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			}

			// Fetch tasks for selected employee or all tasks
			const response = await GetTask({
				task_id: employeeId,
				admin_id: selectedEmployee?.id, // Will be undefined if no employee selected
				start_date: startDate ? formatDate(startDate) : undefined,
				end_date: endDate ? formatDate(endDate) : undefined,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})

			if (response.data && Array.isArray(response.data)) {
				let taskData = response.data
				if (hrStatus !== 'Select') {
					if (hrStatus === 'Pending') {
						taskData = taskData.filter((task: any) => task.status === 'PENDING')
					} else if (hrStatus === 'Employee Done') {
						taskData = taskData.filter(
							(task: any) => task.status === 'COMPLETED' && task.hr_status === 'pending'
						)
					} else if (hrStatus === 'HR Done') {
						taskData = taskData.filter(
							(task: any) => task.status === 'COMPLETED' && task.hr_status === 'complete'
						)
					}
				}

				// Sort tasks by priority first, then by end date (nearest first)
				const sortedTasks = taskData.sort((a: any, b: any) => {
					// Define priority levels
					const getPriority = (task: any) => {
						if (task.status === 'PENDING') return 1 // Highest priority
						if (task.status === 'COMPLETED' && task.hr_status === 'pending') return 2 // Medium priority
						if (task.status === 'COMPLETED' && task.hr_status === 'complete') return 3 // Lowest priority
						return 4 // Default
					}

					const priorityA = getPriority(a)
					const priorityB = getPriority(b)

					// First sort by priority
					if (priorityA !== priorityB) {
						return priorityA - priorityB
					}

					// Within same priority, sort by end date (nearest first)
					return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
				})

				setAssignTaskData(sortedTasks)
			} else {
				setAssignTaskData([])
			}

			if (response?.metadata) {
				setMetaData(response.metadata as any)
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchEmployeeData = async (page?: number) => {
		try {
			const response = await GetEmployees()
			const filteredData: any = response.data
			setEmployeeData(filteredData.map((el: any) => ({ name: el.full_name, id: el._id })))
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchAssignTaskData()
		fetchEmployeeData()
	}, [
		selectedDateRange,
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedEmployee,
		hrStatus,
	])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchAssignTaskData()
		}
	}, [searchTerm])

	const isFirstDateRangeCall = useRef(true)

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		if (isFirstDateRangeCall.current) {
			isFirstDateRangeCall.current = false
			// DateRangePicker calls this unconditionally on mount with defaultRange.
			// If we already have a saved range in localStorage, ignore this first call to prevent overwriting it.
			const saved = localStorage.getItem('selectedDateRange')
			if (saved) return
		}

		let isDifferent = false
		if (range && selectedDateRange) {
			const start1 = new Date(range[0]).setHours(0, 0, 0, 0)
			const end1 = new Date(range[1]).setHours(23, 59, 59, 999)
			const start2 = new Date(selectedDateRange[0]).setHours(0, 0, 0, 0)
			const end2 = new Date(selectedDateRange[1]).setHours(23, 59, 59, 999)
			if (start1 !== start2 || end1 !== end2) {
				isDifferent = true
			}
		} else if (range !== selectedDateRange) {
			isDifferent = true
		}

		if (range) {
			const start = new Date(range[0])
			const end = new Date(range[1])

			start.setHours(0, 0, 0, 0)
			end.setHours(23, 59, 59, 999)

			// Update state
			setSelectedDateRange([start, end])

			// Store in localStorage in ISO format
			localStorage.setItem(
				'selectedDateRange',
				JSON.stringify([start.toISOString(), end.toISOString()])
			)
		} else {
			setSelectedDateRange(null)
			localStorage.removeItem('selectedDateRange')
		}

		if (isDifferent) {
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}

	// const handleAllDataClick = () => {
	// 	setSelectedDateRange(null)
	// 	localStorage.removeItem('selectedDateRange')
	// 	setPagination((prev) => ({ ...prev, page: 1 }))
	// }

	const handleEmployeeSelect = (event: any) => {
		const selectedName = typeof event === 'object' && event?.target ? event.target.value : event

		if (!selectedName || selectedName === 'Select Employee' || selectedName === 'Select') {
			setSelectedEmployee(null)
			localStorage.removeItem('hr_assign_task_employee')
		} else {
			const selectedEmployeeObj = employeeData.find((el: any) => el.name === selectedName)
			setSelectedEmployee(selectedEmployeeObj)
			localStorage.setItem('hr_assign_task_employee', JSON.stringify(selectedEmployeeObj))
		}
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleStatusChange = (event: any) => {
		const status = (typeof event === 'object' && event?.target ? event.target.value : event) as
			| 'Select'
			| 'Pending'
			| 'Employee Done'
			| 'HR Done'
		setHrStatus(status)
		localStorage.setItem('hr_assign_task_status', status)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	// Persist search term and pagination to localStorage
	useEffect(() => {
		localStorage.setItem('hr_assign_task_search', searchTerm)
	}, [searchTerm])

	useEffect(() => {
		localStorage.setItem('hr_assign_task_page', pagination.page.toString())
		localStorage.setItem('hr_assign_task_limit', pagination.itemsPerPage.toString())
	}, [pagination])

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
				file_url: fileUrl,
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

			let fileUrl = ''
			if (file) {
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
				file_url: fileUrl,
				status: status,
				admin_id: selectedEmployee.id,
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
			toast.success('Task remove successfully')
		} catch (error) {
			console.error(error)
		}
	}

	const handleInputTask = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, files } = e.target

		if (name === 'file' && files) {
			const selectedFile = files[0]
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

	const handleInputEditTask = (e: React.ChangeEvent<HTMLInputElement | any>) => {
		const { name, value, files } = e.target

		if (name === 'file' && files) {
			const selectedFile = files[0]
			setEditTaskData((prevState: any) => ({
				...prevState,
				file: selectedFile,
			}))
		} else {
			setEditTaskData((prevState: any) => ({
				...prevState,
				[name]: name === 'end_date' || name === 'start_date' ? new Date(value) : value,
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
		{ title: 'Select', field: 'select' },
		...(!selectedEmployee ? [{ title: 'Name', field: 'employee_name' }] : []),
		{ title: 'Task', field: 'task_title' },
		{ title: 'Start Date', field: 'start_date' },
		{ title: 'End Date', field: 'end_date' },
		{ title: 'Employee Status', field: 'employee_status' },
		{ title: 'HR Status', field: 'status' },
		{ title: 'Completed Date', field: 'completed_date' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
		setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }))
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
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
				toast.success('Task Reassign Successfully')
				fetchAssignTaskData()
			}
		})
	}


	// Group tasks by priority
	const groupTasksByPriority = () => {
		const grouped: { [key: number]: any[] } = {}
		filteredTaskData.forEach((task) => {
			const priority = getTaskPriority(task)
			if (!grouped[priority]) {
				grouped[priority] = []
			}
			grouped[priority].push(task)
		})
		return grouped
	}

	const groupedTasks = groupTasksByPriority()

	const paginatedTaskData = React.useMemo(() => {
		if (filteredTaskData && filteredTaskData.length > pagination.itemsPerPage) {
			const startIndex = (pagination.page - 1) * pagination.itemsPerPage
			return filteredTaskData.slice(startIndex, startIndex + pagination.itemsPerPage)
		}
		return filteredTaskData || []
	}, [filteredTaskData, pagination.page, pagination.itemsPerPage])

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

	const ShowDocument = (document: any) => {
		const downloadUrl = `https://files.fggroup.in/${document}`
		window.open(downloadUrl)
	}

	const handleRejectReason = (reason: any) => {
		Swal.fire({
			icon: 'error',
			title: 'Rejection Reason',
			text: reason || 'No reason provided.',
		})
	}

	const handleNavigate = (page: string, viewData?: any) => {
		let url = ''

		if (page === 'add') {
			url = `/hr/task-${page}?employeeId=${selectedEmployee?.id}`
		} else {
			// Use task's admin_id if selectedEmployee is not available
			const adminId = selectedEmployee?.id || viewData?.admin_id
			url = `/hr/task-${page}?taskId=${viewData?.taskId}&adminId=${adminId}`
		}

		if (viewData) {
			Navigate(url, { state: viewData })
		} else {
			Navigate(url)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Task Assignment</PageTitle>

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<h2 className='text-gray-900 fw-bold fs-2 m-0'>Task Assignment</h2>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Manage, assign, and track employee task workflows and deadlines
					</span>
				</div>
			</div>

			{/* Filter Toolbar (Order: Search -> LengthMenu -> DownloadExcel -> Filters -> Date -> Right Action Buttons) */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3'>
					<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
						{/* 1. Searchbar */}
						<div style={{ minWidth: '240px', maxWidth: '340px', flex: '1 1 240px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search tasks...'
								className='me-0'
							/>
						</div>

						{/* 2. Page Size / Length Menu */}
						<div>
							<LengthMenu
								data={assignTaskData}
								itemsPerPage={pagination.itemsPerPage}
								handleItemsPerPageChange={(value) =>
									setPagination((prev) => ({ ...prev, itemsPerPage: value, page: 1 }))
								}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<DownloadExcelButton
								data={assignTaskData}
								columns={sortableFields}
								filename='Assigned_Tasks'
							/>
						</div>

						{/* 4. Employee Dropdown */}
						<div style={{ minWidth: '190px' }}>
							<SelectField
								showLabel={false}
								marginRemove={true}
								className='mb-0'
								height='38px'
								name='employee'
								value={selectedEmployee?.name || ''}
								defaultLabel='All Employees'
								options={employeeData.map((el: any) => ({ label: el.name, value: el.name }))}
								onChange={handleEmployeeSelect}
							/>
						</div>

						{/* 5. Status Dropdown */}
						<div style={{ minWidth: '160px' }}>
							<SelectField
								showLabel={false}
								marginRemove={true}
								className='mb-0'
								height='38px'
								name='status'
								value={hrStatus === 'Select' ? '' : hrStatus}
								defaultLabel='All Statuses'
								options={[
									{ label: 'All Statuses', value: '' },
									{ label: 'Pending', value: 'Pending' },
									{ label: 'Employee Done', value: 'Employee Done' },
									{ label: 'HR Done', value: 'HR Done' },
								]}
								onChange={handleStatusChange}
							/>
						</div>

						{/* 6. Date Filter */}
						<div>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>

					{/* 7. End me right side Action Buttons */}
					<div className='d-flex align-items-center gap-2 flex-shrink-0 ms-auto'>
						{/* <button
							type='button'
							onClick={handleAllDataClick}
							className='btn btn-light-primary btn-sm text-nowrap'
							style={{ height: '38px', borderRadius: '8px' }}>
							All Data
						</button> */}
						{selectedEmployee && (
							<button
								onClick={() => handleNavigate('add')}
								className='btn btn-primary btn-sm text-nowrap d-flex align-items-center gap-2'
								style={{ height: '38px', borderRadius: '8px' }}>
								<KTIcon iconName='plus' className='fs-3' />
								<span>Add Task</span>
							</button>
						)}
					</div>
				</div>
			</div>

			<div className='gz-inv-table-card'>

				{/* Bulk Actions Section */}
				{filteredTaskData.some(
					(task) => task.status === 'COMPLETED' && task.hr_status === 'pending'
				) && (
					<div className='row align-items-center ms-0 mx-md-6 p-0 my-6'>
						<div className='col-md-6'>
							<div className='d-flex align-items-center mt-3'>
								<input
									type='checkbox'
									id='selectAll'
									checked={selectAll}
									onChange={(e) => handleSelectAll(e.target.checked)}
									className='form-check-input me-2'
								/>
								<label
									htmlFor='selectAll'
									className='form-check-label fw-bold'>
									Select All Pending Tasks (
									{
										filteredTaskData.filter(
											(task) => task.status === 'COMPLETED' && task.hr_status === 'pending'
										).length
									}
									)
								</label>
							</div>
						</div>
						<div className='col-md-6 text-end'>
							<button
								onClick={handleBulkTaskCompletion}
								className={`btn btn-success btn-sm ${selectedTasks.length > 0 ? '' : 'invisible'}`}
								disabled={submitLoading}>
								<KTIcon
									iconName='check'
									className='fs-2 me-1'
								/>
								Complete {selectedTasks.length} task
							</button>
						</div>
						{/* <div className='col-md-6 text-end'>
							{selectedTasks.length > 0 && (
								<button
									onClick={handleBulkTaskCompletion}
									className='btn btn-success btn-sm'
									disabled={submitLoading}>
									<KTIcon iconName='check' className='fs-2 me-1' />
									Complete {selectedTasks.length} task
								</button>
							)}
						</div> */}
					</div>
				)}

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
							onSortChange={handleSortChange}
							disableSortFields={['select', 'file_url']}
							renderRow={(task: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={task._id}>
									<tr
										onClick={() => handleRowClick(task._id)}
										className='data-row'>
										<td className='text-center'>
											<div className='d-flex align-items-center justify-content-center gap-1'>
												<span
													className={`badge badge-circle ${isVisible ? 'badge-primary' : 'badge-light-primary'} me-1`}
													style={{ width: '20px', height: '20px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
													<i className={`bi bi-${isVisible ? 'dash' : 'plus'} fs-7`}></i>
												</span>
												<span className='text-dark fw-bold fs-7'>{actualIndex}</span>
											</div>
										</td>

										{/* Checkbox column for tasks that can be completed */}
										<td className='text-center'>
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
											<td>
												<span className='text-dark fw-semibold fs-7'>
													{employeeData.find((emp: any) => emp.id === task.admin_id)?.name || '-'}
												</span>
											</td>
										)}
										<td>
											<span className='text-dark fw-bold fs-7'>
												{task.task_title}
											</span>
										</td>

										<td>
											<span className='text-dark fw-semibold fs-7'>
												{DayJS(task.start_date).format('DD/MM/YYYY')}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center gap-1'>
												<span className='text-dark fw-semibold fs-7'>
													{DayJS(task.end_date).format('DD/MM/YYYY')}
												</span>
												{task.extends_dates &&
													task.extends_dates.some((ext: any) => ext.status === 'accepted') && (
														<button
															type='button'
															className='btn btn-icon btn-xs btn-light-info rounded-circle ms-1'
															style={{ width: '20px', height: '20px' }}
															title='View Extension Details'
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
															<i className='fas fa-info' style={{ fontSize: '9px' }}></i>
														</button>
													)}
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center gap-1'>
												<span
													className={`badge fw-bold py-1 px-2 fs-8 ${
														task.status === 'PENDING' ? 'badge-light-warning' : 'badge-light-success'
													}`}
													style={{
														cursor: task.employee_status === 'rejected' ? 'pointer' : 'default',
													}}>
													{task.status.charAt(0).toUpperCase() + task.status.slice(1).toLowerCase()}
												</span>

												{task.employee_status === 'rejected' && (
													<button
														type='button'
														className='btn btn-icon btn-xs btn-light-danger rounded-circle'
														style={{ width: '20px', height: '20px' }}
														title='View Reject Reason'
														onClick={(e) => {
															e.stopPropagation()
															handleRejectReason(task.reject_reason)
														}}>
														<i className='fas fa-eye' style={{ fontSize: '9px' }}></i>
													</button>
												)}
											</div>
										</td>

										<td>
											<span
												className={`badge fw-bold py-1 px-2 fs-8 ${
													task.hr_status === 'complete'
														? 'badge-light-success'
														: task.hr_status === 'rejected'
														? 'badge-light-danger'
														: 'badge-light-warning'
												}`}>
												{task.hr_status.charAt(0).toUpperCase() +
													task.hr_status.slice(1).toLowerCase()}
											</span>
										</td>

										<td>
											<span className='text-dark fw-semibold fs-7'>
												{task.completed_date &&
													task.status == 'COMPLETED' &&
													DayJS(task.completed_date).format('DD/MM/YYYY')}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center gap-2'>
												<TableButton
													action='view'
													onClick={() =>
														handleNavigate('view', {
															id: task._id,
															taskId: task._id,
															admin_id: task.admin_id,
															taskName: task.task_title,
															remark: task.remark_by_hr,
															start_date: task.start_date ? task.start_date : null,
															end_date: task.end_date ? task.end_date : null,
														})
													}
												/>
												{task.status == 'COMPLETED' && (
													<TableButton
														action='assign'
														text='Re-assign'
														onClick={() => openActionModal(task._id)}
														showIcon={false}
													/>
												)}
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={13}>
												<div>
													<strong>{sortableFields[2].title}:</strong> {task.task_title}
													<br />
													<strong>Remark by Employee:</strong> {task.remark_by_employee}
													<br />
													<strong>Remark by HR:</strong> {task.remark_by_hr}
													<br />
													<strong>File:</strong>{' '}
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
													<strong>{sortableFields[3].title}:</strong>{' '}
													{DayJS(task.start_date).format('DD/MM/YYYY hh:mm:ss A')}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{DayJS(task.end_date).format('DD/MM/YYYY hh:mm:ss A')}
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
{paginatedTaskData.length === 0 && !loading && totalRecords === 0 && (
					<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
						<b>No records found</b>
					</div>
				)}

{paginatedTaskData.length > 0 && (
					<UsersListPagination
						totalPages={totalPages}
						currentPage={pagination.page}
						totalRecords={totalRecords}
						itemsPerPage={pagination.itemsPerPage}
						onPageChange={handlePageChange}
						entityName='tasks'
					/>
				)}
				</div>

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
				<Modal
					show={showUpdateModal}
					onHide={() => setShowUpdateModal(false)}
					centered>
					<Modal.Header closeButton>
						<Modal.Title>Edit Task</Modal.Title>
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
									value={editTaskData.taskName}
									onChange={handleInputEditTask}
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
									value={editTaskData.remark}
									onChange={handleInputEditTask}
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
									value={DayJS(editTaskData.start_date).format('YYYY-MM-DD')}
									onChange={handleInputEditTask}
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
									value={DayJS(editTaskData.end_date).format('YYYY-MM-DD')}
									onChange={handleInputEditTask}
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
										onChange={handleInputEditTask}
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
										</audio>
									)}
								</Form.Group>
							)}
						</Form>
					</Modal.Body>
					<div className='modal-footer d-flex justify-content-between'>
						<button
							type='button'
							className='btn btn-light'
							onClick={() => setShowUpdateModal(false)}>
							Close
						</button>
						<div>
							<button
								type='button'
								className='btn btn-danger me-2'
								onClick={deleteTask}
								data-bs-dismiss='modal'>
								Delete
							</button>
							<button
								className='btn btn-primary'
								onClick={handleUpdate}
								data-bs-dismiss='modal'>
								Save Changes
							</button>
						</div>
					</div>
				</Modal>
			</div>
		</>
	)
}

export default HRAssignTaskList
