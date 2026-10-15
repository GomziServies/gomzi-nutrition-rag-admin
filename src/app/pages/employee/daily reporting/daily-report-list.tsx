import { faDownload, faPlusCircle, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { FileUploadToFGGroup, GetEmployeeRating } from '../../../Functions/FGGroup'
import {
	CreateDailyReporting,
	GetDailyReporting,
} from '../../../Functions/FGGroup/DailyTaskReporting'

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

interface PaginationState {
	page: number
	itemsPerPage: number
}

interface SavedState {
	searchTerm: string
	selectedDateRange: [Date, Date] | null
	pagination: PaginationState
	sort: string
	sortOrder: QuerySortOptions
}

let savedEmployeeDailyReportState: SavedState | null = null

type TaskFormData = {
	taskName: string
	remark: string
	files: File[]
}

const DailyReportList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState(savedEmployeeDailyReportState?.searchTerm || '')
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState(savedEmployeeDailyReportState?.sort || 'createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>(
		savedEmployeeDailyReportState?.sortOrder || 'desc'
	)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(
		savedEmployeeDailyReportState?.selectedDateRange || null
	)
	const [showModal, setShowModal] = useState(false)
	const [submitLoading, setSubmitLoading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	let navigate = useNavigate()

	const [pagination, setPagination] = useState<PaginationState>(
		savedEmployeeDailyReportState?.pagination || {
			page: 1,
			itemsPerPage: 10,
		}
	)
	const [taskFormData, setTaskFormData] = useState<TaskFormData>({
		taskName: '',
		remark: '',
		files: [],
	})

	// Add state for URLs
	const [urls, setUrls] = useState<Array<{ url_type: string; link: string }>>([])

	// Add functions for URL management
	const addNewUrl = () => {
		setUrls([...urls, { url_type: '', link: '' }])
	}

	const removeUrl = (index: number) => {
		const newUrls = urls.filter((_, i) => i !== index)
		setUrls(newUrls)
	}

	const handleUrlChange = (index: number, field: 'url_type' | 'link', value: string) => {
		const newUrls = urls.map((url, i) => {
			if (i === index) {
				return { ...url, [field]: value }
			}
			return url
		})
		setUrls(newUrls)
	}

	const fetchAssignTaskData = async (page?: number) => {
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
			const employee = getStoredEmployee()
			const adminId = employee._id || employee.employee_id || ''
			const response = await GetDailyReporting({
				admin_id: adminId,
				page: page || pagination?.page || 1,
				limit: pagination?.itemsPerPage || 10,
				search: searchTerm || '',
				sort: sort || 'createdAt',
				sortOrder: sortOrder || 'desc',
			})

			let filteredData: any = response?.data || []

			const now = new Date()
			let filterStartDate: Date
			let filterEndDate: Date

			// Set the filter dates based on whether a date range is selected
			if (selectedDateRange && startDate && endDate) {
				filterStartDate = startDate
				filterEndDate = endDate
			} else {
				// Default to current month if no date range selected
				filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
				filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
			}

			// Apply the filter
			filteredData = filteredData.filter((task: any) => {
				const taskStartDate = new Date(task.createdAt)
				return taskStartDate >= filterStartDate && taskStartDate <= filterEndDate
			})

			// Sort by createdAt date
			filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setAssignTaskData(filteredData)

			const apiMetadata: any = response?.metadata
			if (apiMetadata?.pagination) {
				setMetaData(apiMetadata.pagination)
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchAssignTaskData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedDateRange])

	const [rattingData, setRattingData] = useState<any>([])
	const fetchRattingData = async () => {
		const employeeData: any = getStoredEmployee()
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
	const isDateFilterInitialized = useRef(false)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		setPagination((prev) => {
			if (prev.page === 1) {
				fetchAssignTaskData(1)
				return prev
			}
			return { ...prev, page: 1 }
		})
	}, [searchTerm])

	useEffect(() => {
		savedEmployeeDailyReportState = {
			searchTerm,
			selectedDateRange,
			pagination,
			sort,
			sortOrder,
		}
	}, [searchTerm, selectedDateRange, pagination, sort, sortOrder])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Validation: Ensure at least one of taskName or remark is filled
		if (!taskFormData.taskName.trim()) {
			toast.error('Please fill Task Title')
			return
		}

		// Validation: Ensure at least one of files or URLs is provided
		if (taskFormData.files.length === 0 && urls.length === 0) {
			toast.error('Please upload at least one file or add at least one URL')
			return
		}

		setSubmitLoading(true)
		try {
			const { taskName, remark, files } = taskFormData

			let fileUrls: string[] = []
			if (files.length > 0) {
				const response: any = await FileUploadToFGGroup(files, {
					directory: 'files',
				})
				if (response.data?.fileURLs && Array.isArray(response.data.fileURLs)) {
					fileUrls = response.data.fileURLs
				}
				toast.success('Files uploaded successfully')
			}

			const payload: any = {
				task_title: taskName,
				remarks: remark,
				file_url: fileUrls,
				admin_id: getStoredEmployee()._id,
				url: urls, // urls array already contains objects with url_type and link
			}

			await CreateDailyReporting(payload)

			setShowModal(false)
			toast.success('Daily Report Created Successfully')
			fetchAssignTaskData()

			// Reset form
			setTaskFormData({
				taskName: '',
				remark: '',
				files: [],
			})
			setUrls([])

			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setSubmitLoading(false)
	}

	const handleInputTask = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, files } = e.target

		if (name === 'file' && files) {
			const selectedFiles = Array.from(files)
			setTaskFormData((prevState) => ({
				...prevState,
				files: selectedFiles,
			}))
		} else {
			setTaskFormData((prevState) => ({
				...prevState,
				[name]: value,
			}))
		}
	}

	const removeFile = (index: number) => {
		setTaskFormData((prevState) => {
			const newFiles = [...prevState.files]
			newFiles.splice(index, 1)
			return {
				...prevState,
				files: newFiles,
			}
		})

		// Update the file input to reflect the current selection
		if (fileInputRef.current) {
			const dataTransfer = new DataTransfer()
			const currentFiles = taskFormData.files.filter((_, i) => i !== index)
			currentFiles.forEach((file) => dataTransfer.items.add(file))
			fileInputRef.current.files = dataTransfer.files
		}
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const sortableFields = [
		{ title: 'Task', field: 'task_title' },
		{ title: 'Remarks', field: 'remarks' },
		{ title: 'Created At', field: 'createdAt' },
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

	const ShowDocument = (document: any) => {
		const downloadUrl = `https://files.fggroup.in/${document}`
		window.open(downloadUrl)
	}

	const DownloadDocument = async (fileName: string) => {
		let downloadName = fileName.split('/').pop() || fileName
		const lowerName = downloadName.toLowerCase()

		if (lowerName.includes('spreadsheetml.sheet') || lowerName.includes('ms-excel')) {
			if (
				!lowerName.endsWith('.xlsx') &&
				!lowerName.endsWith('.xls') &&
				!lowerName.endsWith('.csv')
			) {
				downloadName += '.xlsx'
			}
		}

		try {
			const response = await fetch(`https://files.fggroup.in/${fileName}`)
			if (!response.ok) throw new Error('Fetch failed')
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)

			const link = window.document.createElement('a')
			link.href = url
			link.setAttribute('download', downloadName)
			window.document.body.appendChild(link)
			link.click()

			window.document.body.removeChild(link)
			window.URL.revokeObjectURL(url)
		} catch (error) {
			console.error('Download failed, falling back to direct link', error)
			const link = window.document.createElement('a')
			link.href = `https://files.fggroup.in/${fileName}?response-content-disposition=attachment;%20filename="${encodeURIComponent(
				downloadName
			)}"`
			link.setAttribute('download', downloadName)
			window.document.body.appendChild(link)
			link.click()
			window.document.body.removeChild(link)
		}
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		if (!isDateFilterInitialized.current && savedEmployeeDailyReportState?.selectedDateRange) {
			isDateFilterInitialized.current = true
			return
		}
		isDateFilterInitialized.current = true
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const filteredTaskData = (assignTaskData || []).filter((data: any) =>
		data?.task_title?.toLowerCase()?.includes(searchTerm.toLowerCase())
	)
	const paginatedTaskData = filteredTaskData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

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

	const handlenavigate = (taskId: any) => {
		navigate(`/employee/daily-report-view?id=${taskId}`)
	}

	const handleExportExcel = () => {
		if (!filteredTaskData || filteredTaskData.length === 0) {
			toast.error('No reports found to export')
			return
		}
		const worksheetData = filteredTaskData.map((task: any, index: number) => {
			let filesCount = 0
			if (Array.isArray(task.file_url)) {
				filesCount = task.file_url.filter(Boolean).length
			} else if (task.file_url) {
				filesCount = 1
			}
			let urlsCount = 0
			if (Array.isArray(task.url)) {
				urlsCount = task.url.reduce((subAcc: number, item: any) => {
					return subAcc + (Array.isArray(item) ? item.length : 1)
				}, 0)
			}

			return {
				'No.': index + 1,
				'Task Title': task.task_title || '-',
				'Remarks': task.remarks || '-',
				'Created Date': task.createdAt ? DayJS(task.createdAt).format('DD/MM/YYYY hh:mm A') : '-',
				'Files Attached': filesCount,
				'Links Attached': urlsCount,
			}
		})
		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Work Reports')
		XLSX.writeFile(workbook, `Daily_Work_Reports_${DayJS().format('YYYY-MM-DD')}.xlsx`)
		toast.success('Excel downloaded successfully')
	}

	const rawRating = Array.isArray(rattingData) ? rattingData[0]?.rating : rattingData?.rating
	const ratingScore =
		rawRating !== undefined && rawRating !== null && rawRating !== '' && !isNaN(Number(rawRating))
			? Number(rawRating) <= 5
				? `${Number(rawRating).toFixed(1)} / 5`
				: `${(Number(rawRating) / 20).toFixed(1)} / 5`
			: 'N/A'

	const totalLinksAndFiles = (assignTaskData || []).reduce((acc: number, task: any) => {
		let filesCount = 0
		if (Array.isArray(task.file_url)) {
			filesCount = task.file_url.filter(Boolean).length
		} else if (task.file_url) {
			filesCount = 1
		}
		let urlsCount = 0
		if (Array.isArray(task.url)) {
			urlsCount = task.url.reduce((subAcc: number, item: any) => {
				return subAcc + (Array.isArray(item) ? item.length : 1)
			}, 0)
		}
		return acc + filesCount + urlsCount
	}, 0)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Daily Reporting</PageTitle>

			{/* Top Header Card */}
			<div className='card shadow-sm border-0 mb-6' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-body p-5 d-flex flex-wrap align-items-center justify-content-between gap-4'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='rounded-3 d-flex align-items-center justify-content-center'
							style={{
								width: '46px',
								height: '46px',
								backgroundColor: '#eff6ff',
								color: '#2563eb',
							}}>
							<i className='bi bi-file-earmark-text fs-2 text-primary'></i>
						</div>
						<div>
							<h3 className='fw-bold text-gray-900 fs-3 mb-1'>Daily Work Reports</h3>
							<span className='text-muted fs-7'>
								Log daily work summaries, submit proof of work, and track performance scores
							</span>
						</div>
					</div>

					<button
						onClick={() => setShowModal(true)}
						className='btn btn-primary d-flex align-items-center gap-2 px-5 py-2.5 fw-bold'
						style={{
							height: '38px',
							borderRadius: '10px',
							fontSize: '14px',
						}}>
						<i className='bi bi-plus-lg fs-6'></i>
						<span>Add Daily Report</span>
					</button>
				</div>
			</div>

			{/* Metric KPI Cards */}
			<div className='row g-4 mb-6'>
				<div className='col-12 col-md-4'>
					<div
						className='card border-0 shadow-sm h-100 p-5'
						style={{ borderRadius: '14px', background: '#ffffff' }}>
						<div className='d-flex align-items-center justify-content-between mb-2'>
							<span className='text-muted fs-8 fw-boldest text-uppercase letter-spacing-1'>Total Reports</span>
							<div
								className='rounded-3 d-flex align-items-center justify-content-center'
								style={{ width: '34px', height: '34px', backgroundColor: '#eff6ff' }}>
								<i className='bi bi-file-earmark-text fs-6 text-primary'></i>
							</div>
						</div>
						<div className='fs-2hx fw-boldest text-gray-900'>{assignTaskData?.length || 0}</div>
					</div>
				</div>

				<div className='col-12 col-md-4'>
					<div
						className='card border-0 shadow-sm h-100 p-5'
						style={{ borderRadius: '14px', background: '#ffffff' }}>
						<div className='d-flex align-items-center justify-content-between mb-2'>
							<span className='text-muted fs-8 fw-boldest text-uppercase letter-spacing-1'>Task Rating Score</span>
							<div
								className='rounded-3 d-flex align-items-center justify-content-center'
								style={{ width: '34px', height: '34px', backgroundColor: '#fffbeb' }}>
								<i className='bi bi-star-fill fs-6 text-warning'></i>
							</div>
						</div>
						<div className='fs-2hx fw-boldest text-gray-900'>{ratingScore}</div>
					</div>
				</div>

				<div className='col-12 col-md-4'>
					<div
						className='card border-0 shadow-sm h-100 p-5'
						style={{ borderRadius: '14px', background: '#ffffff' }}>
						<div className='d-flex align-items-center justify-content-between mb-2'>
							<span className='text-muted fs-8 fw-boldest text-uppercase letter-spacing-1'>Submitted Links/Files</span>
							<div
								className='rounded-3 d-flex align-items-center justify-content-center'
								style={{ width: '34px', height: '34px', backgroundColor: '#f0fdfa' }}>
								<i className='bi bi-link-45deg fs-5 text-info'></i>
							</div>
						</div>
						<div className='fs-2hx fw-boldest text-gray-900'>{totalLinksAndFiles}</div>
					</div>
				</div>
			</div>

			{/* Filter Toolbar Card with Specific Sequence */}
			<div className='card shadow-sm border-0 mb-6' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-body p-4 d-flex align-items-center flex-wrap gap-3'>
					{/* 1. Searchbar */}
					<div style={{ minWidth: '220px', maxWidth: '320px', flex: '1 1 220px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search...'
						/>
					</div>

					{/* 2. Pagination Dropdown */}
					<LengthMenu
						expenseData={filteredTaskData}
						handleItemsPerPageChange={(val) => setPagination((prev) => ({ ...prev, itemsPerPage: val, page: 1 }))}
					/>

					{/* 3. Excel Download Button */}
					<button
						type='button'
						className='gz-toolbar-icon-btn'
						title='Download Excel'
						onClick={handleExportExcel}>
						<FontAwesomeIcon icon={faDownload} />
					</button>

					{/* Spacer */}
					<div className='d-none d-md-block' style={{ flexGrow: 1 }}></div>

					{/* 5. Date Filter (at last) */}
					<div>
						<DateFilter
							onDateRangeChange={handleDateRangeChange}
							leftValue='-270px'
						/>
					</div>
				</div>
			</div>

			{/* Table Card */}
			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
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
							disableSortFields={['task_title', 'remarks', 'file_url', 'createdAt', 'url']}
							onSortChange={handleSortChange}
							renderRow={(task: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={task._id}>
									<tr
										onClick={() => handleRowClick(task._id)}
										className='data-row'
										style={{ verticalAlign: 'middle', borderBottom: '1px dashed #e4e6ef' }}>
										<td className='text-center py-4'>
											<span className='fw-bold text-gray-800 fs-7'>
												{actualIndex}
											</span>
										</td>
										<td className='py-4'>
											<span
												className='text-gray-900 fw-bold fs-7 cursor-pointer text-hover-primary'
												onClick={() => handlenavigate(task._id)}>
												{task.task_title || '-'}
											</span>
										</td>
										<td className='py-4'>
											<span className='text-muted fs-7' title={task.remarks} style={{ maxWidth: '420px', display: 'inline-block' }}>
												{truncateString(task.remarks, 75) || '-'}
											</span>
										</td>
										<td className='py-4 text-gray-700 fs-7'>
											{task.createdAt ? DayJS(task.createdAt).format('DD/MM/YYYY') : '-'}
										</td>
										<td className='text-center py-4'>
											<div className='d-flex align-items-center justify-content-center gap-2'>
												<TableButton
													action='view'
													onClick={(e) => {
														e.stopPropagation()
														handlenavigate(task._id)
													}}
												/>
												<TableButton
													action='edit'
													onClick={(e) => {
														e.stopPropagation()
														navigate(`/employee/daily-report-update?id=${task._id}`)
													}}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}:</strong> {task.task_title}
													<br />
													<strong>{sortableFields[1].title}:</strong> {task.remarks}
													<br />
													<strong>{sortableFields[2].title}:</strong>{' '}
													{task.file_url
														? (() => {
																const file = task.file_url
																const isExcelFile =
																	file.toLowerCase().match(/\.(xlsx|xls|csv)$/) ||
																	file.toLowerCase().includes('spreadsheetml.sheet') ||
																	file.toLowerCase().includes('ms-excel')
																const isPdfFile = file.toLowerCase().endsWith('.pdf')
																const isImageFile = file
																	.toLowerCase()
																	.match(/\.(jpg|jpeg|png|gif|svg)$/)
																const isWordFile = file.toLowerCase().match(/\.(doc|docx)$/)
																const isAudioFile = file.toLowerCase().endsWith('.mp3')

																if (isAudioFile) {
																	return (
																		<audio
																			controls
																			src={`https://files.fggroup.in/${file}`}
																		/>
																	)
																} else if (isExcelFile) {
																	return (
																		<div
																			className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-success bg-light-success'
																			style={{ width: '150px' }}
																			onClick={() => DownloadDocument(file)}>
																			<i className='fas fa-file-excel text-success fs-1 mb-2'></i>
																			<span
																				className='text-success fw-bold small text-center'
																				style={{
																					display: '-webkit-box',
																					WebkitLineClamp: 2,
																					WebkitBoxOrient: 'vertical',
																					overflow: 'hidden',
																					textOverflow: 'ellipsis',
																					width: '100%',
																				}}
																				title={file.split('/').pop()}>
																				{file.split('/').pop()}
																			</span>
																		</div>
																	)
																} else if (isPdfFile) {
																	return (
																		<div
																			className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-warning bg-light-warning'
																			style={{ width: '150px' }}
																			onClick={() => DownloadDocument(file)}>
																			<i className='fas fa-file-pdf text-warning fs-1 mb-2'></i>
																			<span
																				className='text-warning fw-bold small text-center'
																				style={{
																					display: '-webkit-box',
																					WebkitLineClamp: 2,
																					WebkitBoxOrient: 'vertical',
																					overflow: 'hidden',
																					textOverflow: 'ellipsis',
																					width: '100%',
																				}}
																				title={file.split('/').pop()}>
																				{file.split('/').pop()}
																			</span>
																		</div>
																	)
																} else if (isImageFile) {
																	return (
																		<img
																			onClick={() => ShowDocument(file)}
																			src={`https://files.fggroup.in/${file}`}
																			alt='task file'
																			style={{ width: '150px', height: 'auto' }}
																			role='button'
																		/>
																	)
																} else if (isWordFile) {
																	return (
																		<div
																			className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-primary bg-light-primary'
																			style={{ width: '150px' }}
																			onClick={() => ShowDocument(file)}>
																			<i className='fas fa-file-word text-primary fs-1 mb-2'></i>
																			<span
																				className='text-primary fw-bold small text-center'
																				style={{
																					display: '-webkit-box',
																					WebkitLineClamp: 2,
																					WebkitBoxOrient: 'vertical',
																					overflow: 'hidden',
																					textOverflow: 'ellipsis',
																					width: '100%',
																				}}
																				title={file.split('/').pop()}>
																				{file.split('/').pop()}
																			</span>
																		</div>
																	)
																} else {
																	return (
																		<div
																			className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-secondary bg-light'
																			style={{ width: '150px' }}
																			onClick={() => ShowDocument(file)}>
																			<i className='fas fa-file text-secondary fs-1 mb-2'></i>
																			<span
																				className='text-secondary fw-bold small text-center'
																				style={{
																					display: '-webkit-box',
																					WebkitLineClamp: 2,
																					WebkitBoxOrient: 'vertical',
																					overflow: 'hidden',
																					textOverflow: 'ellipsis',
																					width: '100%',
																				}}
																				title={file.split('/').pop()}>
																				{file.split('/').pop()}
																			</span>
																		</div>
																	)
																}
														  })()
														: 'No file'}
													<br />
													<strong>{sortableFields[3].title}:</strong>{' '}
													{DayJS(task.createdAt).format('DD/MM/YYYY')}
													<br />
													{/* URL Section */}
													{task.url && task.url.length > 0 && (
														<>
															<strong>URLs:</strong>
															<br />
															<ul className='list-group'>
																{task.url.map((urlArray: any, index: number) =>
																	Array.isArray(urlArray)
																		? urlArray.map((urlItem: any, subIndex: number) => (
																				<li
																					key={`url-${index}-${subIndex}`}
																					className='list-group-item'>
																					<strong>{urlItem.url_type}:</strong>{' '}
																					<a
																						href={urlItem.link}
																						target='_blank'
																						rel='noopener noreferrer'>
																						{urlItem.link}
																					</a>
																				</li>
																		  ))
																		: null
																)}
															</ul>
														</>
													)}
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
							<span className='fw-bold text-gray-700 fs-6'>No daily reports found</span>
							<span className='text-muted fs-7'>No daily reports recorded for the selected date range.</span>
						</div>
					)}

					{paginatedTaskData.length > 0 && (
						<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
							<div className='text-muted fs-7 fw-semibold'>
								Showing {Math.min((pagination.page - 1) * pagination.itemsPerPage + 1, filteredTaskData.length)} to{' '}
								{Math.min(pagination.page * pagination.itemsPerPage, filteredTaskData.length)} of {filteredTaskData.length} reports
							</div>
							<UsersListPagination
								totalPages={Math.ceil((filteredTaskData?.length || 0) / pagination.itemsPerPage)}
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
						<Modal.Title className='fw-bolder text-gray-900 fs-4 mb-1'>Add Daily Report</Modal.Title>
						<span className='text-muted fs-7'>Submit your daily deliverables, work progress notes, and proof files</span>
					</div>
				</Modal.Header>
				<Modal.Body className='px-6 py-4'>
					<Form onSubmit={handleSubmit}>
						<Form.Group className='mb-4' controlId='taskTitle'>
							<Form.Label className='fw-bold text-gray-700 fs-7'>
								Task Deliverable Title <span className='text-danger'>*</span>
							</Form.Label>
							<Form.Control
								type='text'
								placeholder='e.g., Completed API integration for expenses module'
								name='taskName'
								value={taskFormData.taskName}
								onChange={handleInputTask}
								style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
								required
							/>
						</Form.Group>

						<Form.Group className='mb-4' controlId='remark'>
							<Form.Label className='fw-bold text-gray-700 fs-7'>
								Remarks / Deliverables Summary <span className='text-danger'>*</span>
							</Form.Label>
							<Form.Control
								as='textarea'
								rows={5}
								placeholder='Type your remarks and deliverables summary here...'
								name='remark'
								value={taskFormData.remark}
								onChange={handleInputTask}
								style={{ borderRadius: '8px', borderColor: '#ded8d2' }}
								required
							/>
						</Form.Group>

						<Form.Group controlId='file' className='mb-4'>
							<Form.Label className='fw-bold text-gray-700 fs-7'>File Upload (Optional)</Form.Label>
							<Form.Control
								type='file'
								name='file'
								onChange={handleInputTask}
								multiple
								ref={fileInputRef}
								style={{ borderRadius: '8px' }}
							/>
							<small className='text-muted mt-1 d-block fs-8'>
								Upload only <strong>images (jpg, png)</strong> or <strong>PDF/docs/sheets</strong>.
							</small>
							{taskFormData.files.length > 0 && (
								<div className='mt-3'>
									<p className='fs-8 fw-bold text-gray-700 mb-2'>Selected Files ({taskFormData.files.length}):</p>
									<div className='d-flex flex-wrap gap-2'>
										{taskFormData.files.map((file, index) => (
											<div key={index} className='d-flex align-items-center bg-light border rounded px-3 py-1 gap-2'>
												<i className='bi bi-file-earmark-check text-primary'></i>
												<span className='fs-8 fw-semibold text-gray-800' style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
													{file.name}
												</span>
												<button
													type='button'
													className='btn btn-icon btn-xs btn-light-danger p-0'
													style={{ width: '20px', height: '20px', borderRadius: '4px' }}
													onClick={() => removeFile(index)}>
													<i className='bi bi-x fs-7'></i>
												</button>
											</div>
										))}
									</div>
								</div>
							)}
						</Form.Group>

						{/* URL Section */}
						<div className='mt-4 pt-3 border-top'>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<div>
									<Form.Label className='fw-bold text-gray-700 fs-7 mb-0'>Deliverable Web URLs</Form.Label>
									<span className='text-muted fs-8 d-block'>Attach PR links, Figma links, or cloud docs</span>
								</div>
								<button
									type='button'
									className='btn btn-sm btn-light-primary d-flex align-items-center gap-1 px-3'
									style={{ borderRadius: '8px' }}
									onClick={addNewUrl}>
									<i className='bi bi-plus-lg fs-7'></i>
									<span>Add URL</span>
								</button>
							</div>
							{urls.map((url, index) => (
								<div key={index} className='mb-3 border rounded-3 p-3 bg-light'>
									<div className='row g-2 align-items-end'>
										<div className='col-md-4'>
											<Form.Label className='fs-8 fw-bold text-gray-700 mb-1'>Link Label</Form.Label>
											<Form.Control
												type='text'
												placeholder='e.g., Figma, Pull Request'
												value={url.url_type}
												onChange={(e) => handleUrlChange(index, 'url_type', e.target.value)}
												style={{ height: '36px', borderRadius: '8px', borderColor: '#ded8d2' }}
											/>
										</div>
										<div className='col-md-7'>
											<Form.Label className='fs-8 fw-bold text-gray-700 mb-1'>URL</Form.Label>
											<Form.Control
												type='url'
												placeholder='https://...'
												value={url.link}
												onChange={(e) => handleUrlChange(index, 'link', e.target.value)}
												style={{ height: '36px', borderRadius: '8px', borderColor: '#ded8d2' }}
											/>
										</div>
										<div className='col-md-1 d-flex justify-content-end'>
											<button
												type='button'
												className='btn btn-icon btn-sm btn-light-danger'
												style={{ width: '36px', height: '36px', borderRadius: '8px' }}
												onClick={() => removeUrl(index)}>
												<i className='bi bi-trash fs-7'></i>
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
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
						style={{ borderRadius: '8px', minWidth: '150px' }}
						onClick={handleSubmit}
						disabled={submitLoading}>
						{submitLoading ? (
							<span className='d-flex align-items-center gap-2'>
								<span className='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span>
								<span>Saving...</span>
							</span>
						) : (
							'Add Daily Report'
						)}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default DailyReportList
