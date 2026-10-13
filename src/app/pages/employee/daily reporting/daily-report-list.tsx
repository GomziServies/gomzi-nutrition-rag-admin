import { faPlusCircle, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
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
	CreateDailyReporting,
	GetDailyReporting,
} from '../../../Functions/FGGroup/DailyTaskReporting'

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
			const response = await GetDailyReporting({
				admin_id: JSON.parse(localStorage.getItem('fg_group_info') || '{}')._id,
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
				admin_id: JSON.parse(localStorage.getItem('fg_group_info') || '{}')._id,
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

	return (
		<>
			<PageTitle breadcrumbs={[]}>Daily Reporting</PageTitle>
			<KTCard>
				<h2 className='m-6 mb-0'>Daily Reports</h2>
				<div className='row card-header border-0 pt-0 align-items-center ms-0 mx-md-6 p-0'>
					<div className='col-md-9'>
						<div className='row mt-3 justify-content-between'>
							<div className='col-md-12 mt-md-7 d-flex justify-content-between align-items-center card-toolbar'>
								<div className='col-md-4 col-lg-3 fv-row'>
									<label className='form-label fs-7 fw-bold text-gray-700 mb-1 d-block'>
										Task Rating
									</label>
									{(() => {
										const raw = Array.isArray(rattingData) ? rattingData[0]?.rating : rattingData?.rating
										const num = raw !== undefined && raw !== null && raw !== '' && !isNaN(Number(raw)) ? Number(raw) : null
										const stars = num !== null ? (num <= 5 ? Math.round(num) : Math.max(0, Math.min(5, Math.round((num / 100) * 5)))) : 0
										return (
											<div
												className='d-flex align-items-center rounded px-3 py-2 border'
												style={{ minHeight: '40px', background: '#faf8f5', borderColor: 'var(--gz-border)' }}>
												<div className='d-flex align-items-center gap-1'>
													{[1, 2, 3, 4, 5].map((s) => (
														<FontAwesomeIcon
															key={s}
															icon={faStar as any}
															className='fs-6'
															style={{ color: s <= stars ? '#f59e0b' : '#d1d5db' }}
														/>
													))}
												</div>
												<span className='ms-2 fs-7 fw-bold text-gray-800'>
													{num !== null ? `${num <= 5 ? num : Math.round(num / 20)}/5` : 'No rating'}
												</span>
											</div>
										)
									})()}
								</div>
								<div className='d-md-flex'>
									<DateFilter
										onDateRangeChange={handleDateRangeChange}
										leftValue='-270px'
									/>
									<div className='mt-md-0 mt-4 me-md-3 me-0'>
										<button
											onClick={() => setShowModal(true)}
											className='ms-md-3 mt-md-1 btn btn-primary btn-sm w-md-20 w-100'>
											<KTIcon
												iconName='plus'
												className='fs-2'
											/>
											Add Daily Report
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
							disableSortFields={['task_title', 'remarks', 'file_url', 'createdAt', 'url']}
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
												{task.remarks}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{DayJS(task.createdAt).format('DD/MM/YYYY')}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center gap-2'>
												<button
													className='btn btn-info btn-sm'
													onClick={() => handlenavigate(task._id)}>
													<i className='fas fa-eye p-0'></i>
												</button>
												<button
													className='btn btn-success btn-sm'
													onClick={(e) => {
														e.stopPropagation()
														navigate(`/employee/daily-report-update?id=${task._id}`)
													}}>
													<i className='fas fa-pencil p-0'></i>
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
						<UsersListPagination
							totalPages={Math.ceil((filteredTaskData?.length || 0) / pagination.itemsPerPage)}
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
					<Modal.Title>Add Daily Report</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{/* Form fields */}
					<Form onSubmit={handleSubmit}>
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
							<Form.Label>Remarks</Form.Label>
							<Form.Control
								as='textarea'
								rows={10} // you can adjust number of visible rows
								placeholder='Type your remarks here'
								name='remark'
								value={taskFormData.remark}
								onChange={handleInputTask}
								required
							/>
						</Form.Group>

						<Form.Group controlId='file'>
							<Form.Label>File Upload</Form.Label>
							<Form.Control
								type='file'
								name='file'
								onChange={handleInputTask}
								multiple
								ref={fileInputRef}
							/>
							<small className='text-muted'>
								Upload only <strong>images (jpg, png)</strong> or <strong>PDF files</strong>.
							</small>
							{taskFormData.files.length > 0 && (
								<div className='mt-2'>
									<p className='mb-2'>Selected Files ({taskFormData.files.length}):</p>
									<div className='d-flex flex-wrap gap-3'>
										{taskFormData.files.map((file, index) => {
											const fileName = file.name
											const isExcelFile = fileName.toLowerCase().match(/\.(xlsx|xls|csv)$/)
											const isPdfFile = fileName.toLowerCase().endsWith('.pdf')
											const isImageFile = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg)$/)
											const isWordFile = fileName.toLowerCase().match(/\.(doc|docx)$/)

											const removeBtn = (
												<button
													type='button'
													className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle'
													onClick={() => removeFile(index)}
													style={{ zIndex: 10, width: '25px', height: '25px' }}
													title='Remove file'>
													<i className='fas fa-times fs-6'></i>
												</button>
											)

											return (
												<div
													key={index}
													className='border rounded p-2'>
													{isPdfFile ? (
														<div
															className='position-relative d-flex flex-column align-items-center p-3 border rounded border-warning bg-light-warning'
															style={{ width: '150px' }}>
															{removeBtn}
															<i className='fas fa-file-pdf text-warning fs-1 mb-2'></i>
															<span className='text-warning fw-bold small text-center text-truncate w-100'>
																{fileName}
															</span>
														</div>
													) : isExcelFile ? (
														<div
															className='position-relative d-flex flex-column align-items-center p-3 border rounded border-success bg-light-success'
															style={{ width: '150px' }}>
															{removeBtn}
															<i className='fas fa-file-excel text-success fs-1 mb-2'></i>
															<span className='text-success fw-bold small text-center text-truncate w-100'>
																{fileName}
															</span>
														</div>
													) : isImageFile ? (
														<div
															className='position-relative text-center'
															style={{ width: '150px', height: '150px' }}>
															{removeBtn}
															<img
																src={URL.createObjectURL(file)}
																alt={`Selected File ${index + 1}`}
																style={{ width: '150px', height: '150px', objectFit: 'cover' }}
																className='rounded'
															/>
														</div>
													) : isWordFile ? (
														<div
															className='position-relative d-flex flex-column align-items-center p-3 border rounded border-primary bg-light-primary'
															style={{ width: '150px' }}>
															{removeBtn}
															<i className='fas fa-file-word text-primary fs-1 mb-2'></i>
															<span className='text-primary fw-bold small text-center text-truncate w-100'>
																{fileName}
															</span>
														</div>
													) : (
														<div
															className='position-relative d-flex flex-column align-items-center p-3 border rounded border-secondary bg-light'
															style={{ width: '150px' }}>
															{removeBtn}
															<i className='fas fa-file text-secondary fs-1 mb-2'></i>
															<span className='text-secondary fw-bold small text-center text-truncate w-100'>
																{fileName}
															</span>
														</div>
													)}
												</div>
											)
										})}
									</div>
								</div>
							)}
						</Form.Group>

						{/* URL Section */}
						<div className='mt-4'>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<Form.Label>URLs</Form.Label>
								<Button
									variant='success'
									size='sm'
									onClick={addNewUrl}>
									<i className='fas fa-plus p-0'></i> Add URL
								</Button>
							</div>
							{urls.map((url, index) => (
								<div
									key={index}
									className='mb-3 border rounded p-3 position-relative'>
									<div className='mb-2'>
										<Form.Label>File Name</Form.Label>
										<div className='d-flex gap-2 align-items-center'>
											<Form.Control
												type='text'
												placeholder='e.g., reference, design'
												value={url.url_type}
												onChange={(e) => handleUrlChange(index, 'url_type', e.target.value)}
											/>
											<Button
												variant='danger'
												size='sm'
												className=' m-2'
												onClick={() => removeUrl(index)}>
												<i className='fas fa-times p-0'></i>
											</Button>
										</div>
									</div>

									<div>
										<Form.Label>URL</Form.Label>
										<Form.Control
											type='url'
											placeholder='https://example.com'
											value={url.link}
											onChange={(e) => handleUrlChange(index, 'link', e.target.value)}
										/>
									</div>
								</div>
							))}
						</div>
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
						Add Daily Report
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default DailyReportList
