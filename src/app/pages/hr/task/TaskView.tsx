import React, { useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { DeleteTask, GetTask, UpdateTask } from '../../../Functions/FGGroup/TaskManagement'

// Update the TaskFormData interface
type TaskFormData = {
	taskName: string
	remark: string
	start_date: string
	end_date: string
	financial_worth: string
	social_worth: string
	file: File[] | null
	status?: string
	hr_status?: string
	employee_status?: string
	reject_reason?: string
	hr_reject_reason?: string
	task_done_file?: string[] // Changed to array
	file_url?: string[] // Added file_url array
	editImage: boolean
	remark_by_employee?: string
	completed_date?: string
	completed_on_date?: boolean
	financial_worth_archive: string
	social_worth_archive: string
	url?: Array<{ url_type: string; link: string }>
	extends_dates?: Array<{ date: string; reason: string; status?: string }> // Add status field
}

type TaskViewData = {
	id: string
	taskName: string
	remark: string
	start_date: string | null
	end_date: string | null
	financial_worth: string
	social_worth: string

	file: File | null
}

const formatDateForInput = (date: string | Date | null): string => {
	if (!date) return ''
	const d = new Date(date)
	return d.toISOString().split('T')[0] // Converts to "yyyy-MM-dd"
}

const TaskView = () => {
	const searchParams = new URLSearchParams(location.search)
	const taskId: any = searchParams.get('taskId')
	const adminId: any = searchParams.get('adminId')
	const locationHook = useLocation()
	const viewData = locationHook.state as TaskViewData | undefined
	const [selectedOption, setSelectedOption] = useState('fileUpload')
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [audioURL, setAudioURL] = useState<string | null>(null)
	const [audioFile, setAudioFile] = useState<File | null>(null)
	const [isRecording, setIsRecording] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)
	const [submitLoading, setSubmitLoading] = useState(false)
	const [existingFile, setExistingFile] = useState<string | null>(null)
	const [editImage, setEditImage] = useState(false)
	const [showModal, setShowModal] = useState(true)
	const [loading, setLoading] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [handleUpdateLoading, setHandleUpdateLoading] = useState(false)
	const [deleteLoading, setDeleteLoading] = useState(false)
	const [reassignLoading, setReassignLoading] = useState(false)
	const [rejectLoading, setRejectLoading] = useState(false)
	const [completeLoading, setCompleteLoading] = useState(false)
	const [extendDateLoading, setExtendDateLoading] = useState(false)
	const [extensionReason, setExtensionReason] = useState('')
	const [extendedDate, setExtendedDate] = useState('')

	const [taskFormData, setTaskFormData] = useState<TaskFormData>({
		taskName: '',
		remark: '',
		start_date: '',
		end_date: '',
		financial_worth: '',
		social_worth: '',
		file: null,
		editImage: false,
		hr_reject_reason: '',
		financial_worth_archive: '',
		social_worth_archive: '',
	})

	const [previewUrls, setPreviewUrls] = useState<string[]>([])

	const handleInputTask = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, name, value, files } = e.target

		if (id === 'fileInput' && files && files.length > 0) {
			const selectedFiles = Array.from(files).map((file) => {
				const lowerName = file.name.toLowerCase()
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
						return new File([file], file.name + '.xlsx', { type: file.type })
					}
				}
				return file
			})
			// Create preview URLs for all selected files
			const newPreviewUrls = selectedFiles.map((file) => URL.createObjectURL(file))
			setPreviewUrls(newPreviewUrls)

			setTaskFormData((prev) => ({
				...prev,
				file: selectedFiles,
				editImage: true,
			}))
		} else {
			setTaskFormData((prev) => ({
				...prev,
				[name]: value,
			}))
		}
	}

	const startRecording = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		const recorder = new MediaRecorder(stream)
		setMediaRecorder(recorder)

		const chunks: Blob[] = []

		recorder.ondataavailable = (event) => {
			chunks.push(event.data)
		}

		recorder.onstop = () => {
			const blob = new Blob(chunks, { type: 'audio/mp3' })
			const audioUrl = URL.createObjectURL(blob)
			const audioFile = new File([blob], 'recording.mp3', { type: 'audio/mp3' })

			setAudioBlob(blob)
			setAudioURL(audioUrl)
			setAudioFile(audioFile)

			setTaskFormData((prev) => ({
				...prev,
				file: audioFile ? [audioFile] : null,
			}))
		}

		recorder.start()
		setIsRecording(true)
	}

	const stopRecording = () => {
		mediaRecorder?.stop()
		setIsRecording(false)
	}

	const startAudio = () => {
		const audio = new Audio(audioURL || '')
		audio.play()
		setIsPlaying(true)
		audio.onended = () => setIsPlaying(false)
	}

	const stopAudio = () => {
		const audio = new Audio(audioURL || '')
		audio.pause()
		setIsPlaying(false)
	}

	const ShowDocument = (document: string) => {
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
			// Fetch the file to bypass cross-origin download name limitations
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
			// S3 Query Parameter trick to force filename on cross-origin download
			link.href = `https://files.fggroup.in/${fileName}?response-content-disposition=attachment;%20filename="${encodeURIComponent(
				downloadName
			)}"`
			link.setAttribute('download', downloadName)
			window.document.body.appendChild(link)
			link.click()
			window.document.body.removeChild(link)
		}
	}

	const deleteTask = async () => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: 'Do you really want to delete this task? This action cannot be undone.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#d33',
				cancelButtonColor: '#3085d6',
				confirmButtonText: 'Yes, delete it!',
				cancelButtonText: 'Cancel',
			})

			if (result.isConfirmed) {
				setDeleteLoading(true)
				await DeleteTask({ task_id: taskId })
				toast.success('Task removed successfully')
				setTaskFormData({
					taskName: '',
					remark: '',
					start_date: '',
					end_date: '',
					financial_worth: '',
					social_worth: '',
					file: null,
					editImage: false,
					financial_worth_archive: '',
					social_worth_archive: '',
				})
			}
		} catch (error) {
			console.error(error)
			toast.error('Failed to delete task')
		} finally {
			setDeleteLoading(false)
		}
	}

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault()
		setSubmitLoading(true)
		setHandleUpdateLoading(true)
		try {
			const {
				taskName,
				remark,
				start_date,
				end_date,
				file,
				financial_worth,
				social_worth,
				employee_status,
				hr_status,
			} = taskFormData

			// Validation for required fields
			if (!taskName || !start_date || !end_date) {
				toast.error('Task title, start date and end date are required fields')
				return
			}

			if (!taskId || !adminId) {
				toast.error('Missing task ID or admin ID')
				return
			}

			// Handle multiple files
			let fileUrls: string[] = []

			// First add all existing files
			if (taskFormData.file_url && Array.isArray(taskFormData.file_url)) {
				fileUrls = [...taskFormData.file_url]
			}

			// Then add newly uploaded files
			if (file && Array.isArray(file)) {
				const response: any = await FileUploadToFGGroup(file, {
					directory: 'files',
				})
				if (response.data?.fileURLs && Array.isArray(response.data.fileURLs)) {
					fileUrls = [...fileUrls, ...response.data.fileURLs]
				}
			}

			const payload = {
				task_id: taskId,
				task_title: taskName,
				remark_by_hr: remark,
				start_date,
				end_date,
				financial_worth,
				social_worth,
				file_url: fileUrls, // Send as array directly
				admin_id: adminId,
				employee_status,
				hr_status,
				status: taskFormData.status,
				financial_worth_archive: taskFormData.financial_worth_archive,
				social_worth_archive: taskFormData.social_worth_archive,
			}

			await UpdateTask(payload)
			toast.success('Task Updated Successfully')
			fetchAssignTaskData() // Refresh data after update
		} catch (error: any) {
			toast.error(error.message || 'Failed to update task')
			console.error(error)
		} finally {
			setHandleUpdateLoading(false)
			setSubmitLoading(false)
		}
	}

	// Add this new function for extending the date
	const handleExtendDate = async () => {
		try {
			setExtendDateLoading(true)

			// Validate inputs
			if (!extendedDate) {
				toast.error('Please select a new end date')
				setExtendDateLoading(false)
				return
			}

			if (!extensionReason) {
				toast.error('Please provide a reason for extending the deadline')
				setExtendDateLoading(false)
				return
			}

			// Check if new date is after current end date
			const currentEndDate = new Date(taskFormData.end_date)
			const selectedNewDate = new Date(extendedDate)

			if (selectedNewDate <= currentEndDate) {
				toast.error('New end date must be after the current end date')
				setExtendDateLoading(false)
				return
			}

			let fileUrls: string[] = []

			if (taskFormData.file_url && Array.isArray(taskFormData.file_url)) {
				fileUrls = [...taskFormData.file_url]
			}

			const existingExtensions = (taskFormData.extends_dates || []).map(
				({ date, reason, status }) => ({
					date,
					reason,
					status: status || 'pending',
				})
			)
			const newExtension = {
				date: extendedDate,
				reason: extensionReason,
				status: 'accepted',
			}
			const allExtensions = [...existingExtensions, newExtension]

			await UpdateTask({
				task_id: taskId,
				task_title: taskFormData.taskName,
				remark_by_hr: taskFormData.remark,
				start_date: taskFormData.start_date,
				end_date: taskFormData.end_date, // Keep original end date unchanged
				financial_worth: taskFormData.financial_worth,
				social_worth: taskFormData.social_worth,
				file_url: fileUrls, // Send as array, even if empty
				admin_id: adminId,
				employee_status: taskFormData.employee_status,
				hr_status: taskFormData.hr_status,
				status: taskFormData.status,
				financial_worth_archive: taskFormData.financial_worth_archive,
				social_worth_archive: taskFormData.social_worth_archive,
				extends_dates: allExtensions,
			})

			toast.success('Task extension recorded successfully')
			setTaskFormData((prev) => ({
				...prev,
				extends_dates: allExtensions,
			}))

			// Reset extension fields
			setExtensionReason('')
			setExtendedDate('')

			fetchAssignTaskData()
		} catch (error) {
			toast.error('Failed to record task extension')
			console.error(error)
		} finally {
			setExtendDateLoading(false)
		}
	}

	const fetchAssignTaskData = async () => {
		setLoading(true)
		try {
			if (!taskId) {
				console.error('Task ID not found in URL')
				toast.error('Task ID is missing from the URL')
				return
			}

			const response = await GetTask({
				task_id: taskId,
				page: 1,
				limit: 1,
				search: '',
				sort: 'createdAt',
				sortOrder: 'desc',
			})

			if (response.data && response.data.length > 0) {
				const taskData = response.data[0]
				setTaskFormData({
					taskName: taskData?.task_title || '',
					remark: taskData?.remark_by_hr || '-',
					remark_by_employee: taskData?.remark_by_employee || '',
					start_date: taskData?.start_date ? taskData.start_date.slice(0, 10) : '',
					end_date: taskData?.end_date ? taskData.end_date.slice(0, 10) : '',
					financial_worth: taskData?.financial_worth || '',
					social_worth: taskData?.social_worth || '',
					file: null,
					status: taskData?.status || 'PENDING',
					hr_status: taskData?.hr_status || 'PENDING',
					employee_status: taskData?.employee_status || 'pending',
					reject_reason: taskData?.reject_reason || '',
					hr_reject_reason: taskData?.hr_reject_reason || '',
					task_done_file: Array.isArray(taskData?.task_done_file)
						? taskData.task_done_file
						: typeof taskData?.task_done_file === 'string'
						? taskData.task_done_file.split(',').filter(Boolean)
						: [],
					file_url: Array.isArray(taskData?.file_url)
						? taskData.file_url
						: typeof taskData?.file_url === 'string'
						? taskData.file_url.split(',').filter(Boolean)
						: [],
					editImage: false,
					completed_date: taskData?.completed_date ? taskData.completed_date.slice(0, 10) : '',
					completed_on_date: taskData?.completed_on_date || false,
					financial_worth_archive: taskData?.financial_worth_archive || false,
					social_worth_archive: taskData?.social_worth_archive || false,
					url: taskData?.url || [],
					extends_dates:
						taskData?.extends_dates?.map(
							(ext: { date: string; reason: string; status?: string }) => ({
								date: ext.date,
								reason: ext.reason,
								status: ext.status,
							})
						) || [], // Filter out _id but keep status
				})

				// If file exists, set it in state
				const fileUrls = taskData?.file_url
					? Array.isArray(taskData.file_url)
						? taskData.file_url[0]?.split(',').filter(Boolean) || []
						: typeof taskData.file_url === 'string'
						? taskData.file_url.split(',').filter(Boolean)
						: []
					: []
				if (fileUrls.length > 0) {
					setExistingFile(fileUrls[0])
				}
			}
		} catch (error: any) {
			console.error('Task fetch error:', error)
			const errorMessage =
				error.response?.data?.message || error.message || 'Failed to fetch task data'
			toast.error(errorMessage)
			// Log additional error details if available
			if (error.response) {
				console.error('Response data:', error.response.data)
				console.error('Response status:', error.response.status)
			}
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchAssignTaskData()

		// Cleanup preview URLs when component unmounts
		return () => {
			previewUrls.forEach((url) => URL.revokeObjectURL(url))
		}
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Task View</PageTitle>

			<KTCard>
				<Form className='m-8'>
					{/* Task Title + Remark */}
					<div className='row mb-3'>
						<div className='col-md-12'>
							<div className='row'>
								<div className='col-md-12'>
									<Form.Group
										className='mb-3'
										controlId='taskTitle'>
										<Form.Label>Task Title</Form.Label>
										<Form.Control
											className='inputfield-bg'
											type='text'
											name='taskName'
											value={taskFormData.taskName}
											onChange={handleInputTask}
											required
										/>
									</Form.Group>
								</div>
								<div className='col-md-12'>
									<div className='row'>
										<div className='col-md-6'>
											<Form.Group className='mb-3'>
												<Form.Label>Start Date</Form.Label>
												<Form.Control
													type='date'
													value={
														taskFormData.start_date ? taskFormData.start_date.slice(0, 10) : ''
													}
													className='inputfield-bg'
													onChange={(e) =>
														setTaskFormData((prev) => ({
															...prev,
															start_date: e.target.value,
														}))
													}
												/>
											</Form.Group>
										</div>
										<div className='col-md-6'>
											<Form.Group className='mb-3'>
												<Form.Label>End Date</Form.Label>
												<Form.Control
													type='date'
													value={taskFormData.end_date ? taskFormData.end_date.slice(0, 10) : ''}
													className='inputfield-bg'
													onChange={(e) =>
														setTaskFormData((prev) => ({
															...prev,
															end_date: e.target.value,
														}))
													}
												/>
											</Form.Group>
										</div>

										<div className='col-md-6'>
											<Form.Group>
												<Form.Label>Extend To Date</Form.Label>
												<Form.Control
													type='date'
													value={extendedDate}
													onChange={(e) => setExtendedDate(e.target.value)}
												/>
											</Form.Group>
											<div className='col-md-6'>
												<Form.Group className='mb-3 mt-3'>
													<Button
														size='sm'
														onClick={handleExtendDate}
														disabled={extendDateLoading}
														className='w-100'>
														{extendDateLoading ? (
															<>
																<span
																	className='spinner-border spinner-border-sm me-1'
																	role='status'
																	aria-hidden='true'></span>
																Extending...
															</>
														) : (
															'Extend Date'
														)}
													</Button>
												</Form.Group>
											</div>
										</div>
										<div className='col-md-6'>
											<Form.Group className='mb-3'>
												<Form.Label>Extension Reason</Form.Label>
												<Form.Control
													type='text'
													name='extensionReason'
													as={'textarea'}
													rows={3}
													placeholder='Reason for extension'
													value={extensionReason}
													onChange={(e) => setExtensionReason(e.target.value)}
												/>
											</Form.Group>
										</div>
									</div>
								</div>

								<div className='col-md-6'>
									<Form.Group
										className='mb-3'
										controlId='remark'>
										<Form.Label>HR Remark</Form.Label>
										<Form.Control
											type='text'
											name='remark'
											as={'textarea'}
											rows={3}
											placeholder='No remark provided'
											value={taskFormData.remark}
											onChange={handleInputTask}
											required
										/>
									</Form.Group>
								</div>
								<div className='col-md-6'>
									<Form.Group
										className='mb-3'
										controlId='remark'>
										<Form.Label>Employee Remark</Form.Label>
										<Form.Control
											type='text'
											name='remark'
											as={'textarea'}
											rows={3}
											placeholder='No remark provided'
											value={taskFormData.remark_by_employee || '-'}
											onChange={handleInputTask}
											required
										/>
									</Form.Group>
								</div>
							</div>
						</div>

						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>HR Status</Form.Label>
								<div className='row mb-3'>
									<div className=' col-md-12'>
										<div className='d-flex align-items-center gap-2 justify-content-center'>
											<Form.Control
												type='text'
												value={taskFormData.hr_status?.toUpperCase() || 'PENDING'}
												readOnly
												className={`inputfield-bg ${
													taskFormData.hr_status === 'complete'
														? 'text-success'
														: taskFormData.hr_status === 'rejected'
														? 'text-danger'
														: 'text-warning'
												}`}
											/>

											{taskFormData.hr_reject_reason && (
												<Button
													variant='info'
													size='sm'
													onClick={() => {
														Swal.fire({
															title: 'HR Rejection Reason',
															text: taskFormData?.hr_reject_reason || 'No reason provided.',
															icon: 'info',
															confirmButtonText: 'Close',
														})
													}}>
													Reason
												</Button>
											)}
											{taskFormData.status === 'COMPLETED' &&
												taskFormData.hr_status !== 'complete' && (
													<>
														<Button
															variant='success'
															size='sm'
															className='d-flex align-items-center gap-2'
															onClick={async () => {
																setCompleteLoading(true)
																try {
																	await UpdateTask({
																		task_id: taskId,
																		admin_id: adminId,
																		hr_status: 'complete',
																		end_date: taskFormData?.end_date,
																		start_date: taskFormData?.start_date,
																		task_title: taskFormData?.taskName,
																	})
																	toast.success('Task marked as complete')
																	fetchAssignTaskData()
																} catch (error) {
																	toast.error('Failed to complete task')
																} finally {
																	setCompleteLoading(false)
																}
															}}
															disabled={completeLoading}>
															{completeLoading && (
																<span
																	className='spinner-border spinner-border-sm'
																	role='status'
																	aria-hidden='true'></span>
															)}
															{completeLoading ? 'Completing...' : 'Complete'}
														</Button>

														<Button
															variant='danger'
															size='sm'
															className='d-flex align-items-center gap-2'
															onClick={async () => {
																setRejectLoading(true)
																try {
																	const result = await Swal.fire({
																		title: 'Rejection Reason',
																		input: 'textarea',
																		inputLabel: 'Please provide reason for rejection',
																		inputPlaceholder: 'Type your reason here...',
																		inputAttributes: {
																			'aria-label': 'Type your reason here',
																		},
																		showCancelButton: true,
																		inputValidator: (value) => {
																			if (!value) {
																				return 'You need to provide a reason!'
																			}
																			return null
																		},
																	})

																	if (result.isConfirmed && result.value) {
																		await UpdateTask({
																			task_id: taskId,
																			admin_id: adminId,
																			hr_status: 'rejected',
																			status: 'PENDING',
																			employee_status: 'pending',
																			end_date: taskFormData?.end_date,
																			start_date: taskFormData?.start_date,
																			task_title: taskFormData?.taskName,
																			hr_reject_reason: result.value,
																			remark_by_hr: `Task Rejected: ${result.value}`,
																		})
																		toast.success('Task rejected')
																		fetchAssignTaskData()
																	}
																} catch (error) {
																	toast.error('Failed to reject task')
																} finally {
																	setRejectLoading(false)
																}
															}}
															disabled={rejectLoading}>
															{rejectLoading && (
																<span
																	className='spinner-border spinner-border-sm'
																	role='status'
																	aria-hidden='true'></span>
															)}
															{rejectLoading ? 'Rejecting...' : 'Reject'}
														</Button>
													</>
												)}
										</div>
										{/* <div className='col-md-12 mt-2'>
											<div className='row justify-content-between align-items-center'>
												<div className='col-md-6'>
													{taskFormData.task_done_file &&
														taskFormData.task_done_file.length > 0 && (
															<div className='mt-2'>
																<p className='mb-1'>Completed Task Files:</p>
																{taskFormData.task_done_file.map((file, index) => (
																	<div
																		key={index}
																		className='mb-2'>
																		{file.endsWith('.mp3') ? (
																			<audio
																				controls
																				src={`https://files.fggroup.in/${file}`}
																				style={{ width: '100%' }}
																			/>
																		) : file.endsWith('.pdf') ? (
																			<>
																				<div>
																					<embed
																						src={`https://files.fggroup.in/${file}`}
																						width={'200px'}
																					/>
																				</div>
																				<a
																					href={`https://files.fggroup.in/${file}`}
																					target='_blank'
																					className='mt-2 px-2 py-1 mb-2 btn btn-light-warning'>
																					View PDF
																				</a>
																			</>
																		) : (
																			<a
																				href={`https://files.fggroup.in/${file}`}
																				target='_blank'
																				className='d-block'>
																				<img
																					src={`https://files.fggroup.in/${file}`}
																					alt={`Completed task file ${index + 1}`}
																					style={{ maxWidth: '100px', height: 'auto' }}
																					className='mb-2'
																				/>
																			</a>
																		)}
																	</div>
																))}
															</div>
														)}
												</div>
												<div className='col-md-5 d-flex gap-2 '>
													{taskFormData.status === 'COMPLETED' &&
														taskFormData.hr_status !== 'complete' && (
															<>
																<Button
																	variant='success'
																	size='sm'
																	className='d-flex align-items-center gap-2'
																	onClick={async () => {
																		setCompleteLoading(true)
																		try {
																			await UpdateTask({
																				task_id: taskId,
																				admin_id: adminId,
																				hr_status: 'complete',
																				end_date: taskFormData?.end_date,
																				start_date: taskFormData?.start_date,
																				task_title: taskFormData?.taskName,
																			})
																			toast.success('Task marked as complete')
																			fetchAssignTaskData()
																		} catch (error) {
																			toast.error('Failed to complete task')
																		} finally {
																			setCompleteLoading(false)
																		}
																	}}
																	disabled={completeLoading}>
																	{completeLoading && (
																		<span
																			className='spinner-border spinner-border-sm'
																			role='status'
																			aria-hidden='true'></span>
																	)}
																	{completeLoading ? 'Completing...' : 'Complete'}
																</Button>

																<Button
																	variant='danger'
																	size='sm'
																	className='d-flex align-items-center gap-2'
																	onClick={async () => {
																		setRejectLoading(true)
																		try {
																			const result = await Swal.fire({
																				title: 'Rejection Reason',
																				input: 'textarea',
																				inputLabel: 'Please provide reason for rejection',
																				inputPlaceholder: 'Type your reason here...',
																				inputAttributes: {
																					'aria-label': 'Type your reason here',
																				},
																				showCancelButton: true,
																				inputValidator: (value) => {
																					if (!value) {
																						return 'You need to provide a reason!'
																					}
																					return null
																				},
																			})

																			if (result.isConfirmed && result.value) {
																				await UpdateTask({
																					task_id: taskId,
																					admin_id: adminId,
																					hr_status: 'rejected',
																					status: 'PENDING',
																					employee_status: 'pending',
																					end_date: taskFormData?.end_date,
																					start_date: taskFormData?.start_date,
																					task_title: taskFormData?.taskName,
																					hr_reject_reason: result.value,
																					remark_by_hr: `Task Rejected: ${result.value}`,
																				})
																				toast.success('Task rejected')
																				fetchAssignTaskData()
																			}
																		} catch (error) {
																			toast.error('Failed to reject task')
																		} finally {
																			setRejectLoading(false)
																		}
																	}}
																	disabled={rejectLoading}>
																	{rejectLoading && (
																		<span
																			className='spinner-border spinner-border-sm'
																			role='status'
																			aria-hidden='true'></span>
																	)}
																	{rejectLoading ? 'Rejecting...' : 'Reject'}
																</Button>
															</>
														)}
												</div>
											</div>
										</div> */}
									</div>
								</div>
							</Form.Group>
						</div>
						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>Employee Status</Form.Label>
								<div className='d-flex gap-2 align-items-center'>
									<Form.Control
										type='text'
										value={
											taskFormData.employee_status
												? taskFormData.employee_status.toUpperCase()
												: 'PENDING'
										}
										readOnly
										className={`inputfield-bg ${
											taskFormData.employee_status === 'rejected'
												? 'text-danger'
												: taskFormData.employee_status === 'accepted'
												? 'text-success'
												: 'text-warning'
										}`}
									/>
									{taskFormData.employee_status === 'rejected' && taskFormData.reject_reason && (
										<Button
											variant='info'
											size='sm'
											onClick={() => {
												Swal.fire({
													title: 'Rejection Reason',
													text: taskFormData.reject_reason || 'No reason provided.',
													icon: 'info',
													confirmButtonText: 'Close',
												})
											}}>
											Reason
										</Button>
									)}
								</div>
							</Form.Group>
						</div>

						<div className='col-md-6'>
							<Form.Group
								className='mb-3'
								controlId='financial_worth_archive'>
								<Form.Label>Financial Worth Archive</Form.Label>
								<Form.Control
									className={`inputfield-bg fw-bold ${
										taskFormData.financial_worth_archive == 'true' ? 'text-success' : 'text-danger'
									}`}
									type='text'
									name='financial_worth_archive'
									value={taskFormData.financial_worth_archive == 'true' ? 'YES' : 'NO'}
									readOnly
									required
								/>
							</Form.Group>
						</div>

						<div className='col-md-6'>
							<Form.Group
								className='mb-3'
								controlId='social_worth_archive'>
								<Form.Label>Social Worth Archive</Form.Label>
								<Form.Control
									className={`inputfield-bg fw-bold ${
										taskFormData.social_worth_archive == 'true' ? 'text-success' : 'text-danger'
									}`}
									type='text'
									name='social_worth_archive'
									value={taskFormData.social_worth_archive == 'true' ? 'YES' : 'NO'}
									readOnly
									required
								/>
							</Form.Group>
						</div>

						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>Financial worth</Form.Label>
								<Form.Control
									as='textarea'
									name='financial_worth'
									rows={3}
									value={taskFormData.financial_worth}
									onChange={handleInputTask}
								/>
							</Form.Group>
						</div>
						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>Social worth</Form.Label>
								<Form.Control
									as='textarea'
									name='social_worth'
									rows={3}
									value={taskFormData.social_worth}
									onChange={handleInputTask}
								/>
							</Form.Group>
						</div>

						{/* Completed Task Files */}
						{taskFormData.task_done_file &&
							Array.isArray(taskFormData.task_done_file) &&
							taskFormData.task_done_file.length > 0 && (
								<div className='row mb-4'>
									<div className='col-md-12'>
										<h4 className='mb-3'>Completed Task Files</h4>
										<div className='d-flex flex-wrap gap-3 justify-content-start'>
											{taskFormData.task_done_file
												.filter(Boolean)
												.map((file: string, index: number) => (
													<div
														key={`done-file-${index}`}
														className='file-preview'>
														{(() => {
															const lowerFile = file.toLowerCase()

															const isExcelFile =
																lowerFile.endsWith('.xlsx') ||
																lowerFile.endsWith('.xls') ||
																lowerFile.endsWith('.csv') ||
																lowerFile.includes('spreadsheetml.sheet') ||
																lowerFile.includes('ms-excel')

															if (lowerFile.endsWith('.mp3')) {
																return (
																	<audio
																		controls
																		src={`https://files.fggroup.in/${file}`}
																		style={{ width: '200px' }}
																	/>
																)
															}

															if (lowerFile.endsWith('.pdf')) {
																return (
																	<div className='d-flex flex-column align-items-center'>
																		<embed
																			src={`https://files.fggroup.in/${file}`}
																			width='200px'
																			height='150px'
																		/>

																		<a
																			href={`https://files.fggroup.in/${file}`}
																			target='_blank'
																			rel='noopener noreferrer'
																			className='mt-2 px-2 py-1 btn btn-light-warning'>
																			View PDF
																		</a>
																	</div>
																)
															}

															if (isExcelFile) {
																return (
																	<div
																		className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-success bg-light-success'
																		style={{ width: '150px' }}
																		onClick={() => DownloadDocument(file)}
																		title='Download Excel Sheet'>
																		<i
																			className='fas fa-file-excel text-success'
																			style={{ fontSize: '45px' }}
																		/>
																		<span
																			className='mt-2 fw-bold text-success text-center'
																			style={{
																				fontSize: '12px',
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

															return (
																<div className='text-center'>
																	<img
																		onClick={() => ShowDocument(file)}
																		src={`https://files.fggroup.in/${file}`}
																		alt={`Completed file ${index + 1}`}
																		style={{
																			width: '150px',
																			height: '150px',
																			objectFit: 'cover',
																		}}
																		className='mb-2 cursor-pointer'
																	/>
																</div>
															)
														})()}
													</div>
												))}
										</div>
									</div>
								</div>
							)}

						{/* Task URLs */}
						{taskFormData.url && Array.isArray(taskFormData.url) && taskFormData.url.length > 0 && (
							<div className='row mb-4'>
								<div className='col-md-12'>
									<h4 className='mb-3'>Task URLs</h4>
									<div className='list-group'>
										{taskFormData.url.map(
											(urlArray, index) =>
												Array.isArray(urlArray) &&
												urlArray.map(
													(urlItem: { url_type: string; link: string }, subIndex: number) => (
														<div
															key={`url-${index}-${subIndex}`}
															className='list-group-item'>
															<div className='d-flex justify-content-between align-items-center'>
																<div>
																	<strong className='me-2'>{urlItem.url_type}:</strong>
																	<a
																		href={urlItem.link}
																		target='_blank'
																		className='text-primary'>
																		{urlItem.link}
																	</a>
																</div>
																<Button
																	variant='light'
																	size='sm'
																	onClick={() => window.open(urlItem.link, '_blank')}>
																	<i className='fas fa-external-link-alt'></i>
																</Button>
															</div>
														</div>
													)
												)
										)}
									</div>
								</div>
							</div>
						)}

						{/* Upload Options */}
						{taskFormData.file_url && (
							<div className='row mb-4'>
								<div className='col-md-12'>
									<h4 className='mb-3'>Attachments</h4>
									<div className='d-flex flex-wrap gap-3 justify-content-start'>
										{(Array.isArray(taskFormData?.file_url)
											? taskFormData?.file_url
											: [taskFormData?.file_url]
										)
											.filter(Boolean)
											.map((file: string, index: number) => (
												<div
													key={`file-${index}`}
													className='file-preview'>
													{(() => {
														const lowerFile = file.toLowerCase()

														const isExcelFile =
															lowerFile.endsWith('.xlsx') ||
															lowerFile.endsWith('.xls') ||
															lowerFile.endsWith('.csv') ||
															lowerFile.includes('spreadsheetml.sheet') ||
															lowerFile.includes('ms-excel')

														if (lowerFile.endsWith('.mp3')) {
															return (
																<audio
																	controls
																	src={`https://files.fggroup.in/${file}`}
																	style={{ width: '200px' }}
																/>
															)
														}

														if (lowerFile.endsWith('.pdf')) {
															return (
																<div className='d-flex flex-column align-items-center'>
																	<embed
																		src={`https://files.fggroup.in/${file}`}
																		width='200px'
																		height='150px'
																	/>

																	<a
																		href={`https://files.fggroup.in/${file}`}
																		target='_blank'
																		rel='noopener noreferrer'
																		className='mt-2 px-2 py-1 btn btn-light-warning'>
																		View PDF
																	</a>
																</div>
															)
														}

														if (isExcelFile) {
															return (
																<div
																	className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-success bg-light-success'
																	style={{ width: '150px' }}
																	onClick={() => DownloadDocument(file)}
																	title='Download Excel Sheet'>
																	<i
																		className='fas fa-file-excel text-success'
																		style={{ fontSize: '45px' }}
																	/>
																	<span
																		className='mt-2 fw-bold text-success text-center'
																		style={{
																			fontSize: '12px',
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

														return (
															<div className='text-center'>
																<img
																	onClick={() => ShowDocument(file)}
																	src={`https://files.fggroup.in/${file}`}
																	alt={`File ${index + 1}`}
																	style={{
																		width: '150px',
																		height: '150px',
																		objectFit: 'cover',
																	}}
																	className='mb-2 cursor-pointer'
																/>
															</div>
														)
													})()}
												</div>
											))}
									</div>
								</div>
							</div>
						)}
					</div>

					<div className='col-12 text-end'>
						<div className='modal-footer d-flex justify-content-end'>
							<button
								type='button'
								className='btn btn-danger me-2 d-flex align-items-center gap-2'
								onClick={deleteTask}
								disabled={deleteLoading}>
								{deleteLoading && (
									<span
										className='spinner-border spinner-border-sm'
										role='status'
										aria-hidden='true'></span>
								)}
								{deleteLoading ? 'Deleting...' : 'Delete'}
							</button>
							{taskFormData.employee_status === 'rejected' && (
								<button
									type='button'
									className='btn btn-warning me-2 d-flex align-items-center gap-2'
									onClick={async () => {
										setReassignLoading(true)
										try {
											const {
												taskName,
												remark,
												start_date,
												end_date,
												file,
												financial_worth,
												social_worth,
											} = taskFormData

											let fileUrls: string[] = []

											// First add all existing files
											if (taskFormData.file_url && Array.isArray(taskFormData.file_url)) {
												fileUrls = [...taskFormData.file_url]
											}

											// Then add newly uploaded files
											if (file && Array.isArray(file)) {
												const response: any = await FileUploadToFGGroup(file, {
													directory: 'files',
												})
												if (response.data?.fileURLs && Array.isArray(response.data.fileURLs)) {
													fileUrls = [...fileUrls, ...response.data.fileURLs]
												}
											}

											await UpdateTask({
												task_id: taskId,
												task_title: taskName,
												remark_by_hr: remark,
												start_date,
												end_date,
												financial_worth,
												social_worth,
												file_url: fileUrls, // Send as array directly
												admin_id: adminId,
												employee_status: 'pending',
											})

											toast.success('Task reassigned successfully')
											fetchAssignTaskData()
										} catch (error) {
											toast.error('Failed to reassign task')
											console.error(error)
										} finally {
											setReassignLoading(false)
										}
									}}
									disabled={reassignLoading}>
									{reassignLoading && (
										<span
											className='spinner-border spinner-border-sm'
											role='status'
											aria-hidden='true'></span>
									)}
									{reassignLoading ? 'Reassigning...' : 'Reassign'}
								</button>
							)}
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center gap-2'
								onClick={handleUpdate}
								disabled={handleUpdateLoading} // disable during loading
							>
								{handleUpdateLoading && (
									<span
										className='spinner-border spinner-border-sm'
										role='status'
										aria-hidden='true'></span>
								)}
								{handleUpdateLoading ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</div>
				</Form>
			</KTCard>

			{/* Extension Requests Section */}
			{taskFormData.extends_dates && taskFormData.extends_dates.length > 0 && (
				<KTCard className='mt-5'>
					<div className='card-header'>
						<h3 className='card-title'>Extension Requests</h3>
					</div>
					<div className='card-body'>
						<div className='table-responsive'>
							<table className='table align-middle table-row-dashed fs-6 gy-5'>
								<thead>
									<tr className='fw-bold text-muted bg-light'>
										<th className='text-center'>No.</th>
										<th>Request Date</th>
										<th>Reason</th>
										<th>Status</th>
										{/* <th>Actions</th> */}
									</tr>
								</thead>
								<tbody>
									{taskFormData.extends_dates.map((extension: any, index: number) => (
										<tr key={index}>
											<td className='text-center'>{index + 1}</td>
											<td>{new Date(extension.date).toLocaleDateString()}</td>
											<td>{extension.reason}</td>
											{/* <td>
												<span
													className={`badge ${
														extension.status === 'accepted'
															? 'badge-success'
															: extension.status === 'rejected'
															? 'badge-danger'
															: 'badge-warning'
													}`}>
													{extension.status || 'pending'}
												</span>
											</td> */}
											<td>
												{(!extension.status || extension.status === 'pending') && (
													<>
														<Button
															variant='success'
															size='sm'
															className='me-2'
															onClick={async () => {
																try {
																	const updatedExtensions = taskFormData.extends_dates
																		? taskFormData.extends_dates.map((ext, i) =>
																				i === index ? { ...ext, status: 'accepted' } : ext
																		  )
																		: []

																	let payload: any = {
																		task_id: taskId,
																		admin_id: adminId,
																		task_title: taskFormData.taskName,
																		start_date: taskFormData.start_date,
																		end_date: taskFormData.end_date,
																		remark_by_hr: taskFormData.remark,
																		financial_worth: taskFormData.financial_worth,
																		social_worth: taskFormData.social_worth,
																		file_url: taskFormData.file_url,
																		employee_status: taskFormData.employee_status,
																		hr_status: taskFormData.hr_status,
																		status: taskFormData.status,
																		financial_worth_archive: taskFormData.financial_worth_archive,
																		social_worth_archive: taskFormData.social_worth_archive,
																		extends_dates: updatedExtensions,
																	}

																	// payload.end_date = extension.date

																	await UpdateTask(payload)

																	toast.success('Extension request approved')
																	setTaskFormData((prev) => ({
																		...prev,
																		extends_dates: updatedExtensions,
																	}))
																} catch (error) {
																	toast.error('Failed to approve extension request')
																	console.error(error)
																}
															}}>
															Approve
														</Button>
														<Button
															variant='danger'
															size='sm'
															onClick={async () => {
																try {
																	// Update the extension status to rejected
																	const updatedExtensions = taskFormData.extends_dates
																		? taskFormData.extends_dates.map((ext, i) =>
																				i === index ? { ...ext, status: 'rejected' } : ext
																		  )
																		: []

																	await UpdateTask({
																		task_id: taskId,
																		admin_id: adminId,
																		task_title: taskFormData.taskName,
																		start_date: taskFormData.start_date,
																		end_date: taskFormData.end_date,
																		remark_by_hr: taskFormData.remark,
																		financial_worth: taskFormData.financial_worth,
																		social_worth: taskFormData.social_worth,
																		file_url: taskFormData.file_url,
																		employee_status: taskFormData.employee_status,
																		hr_status: taskFormData.hr_status,
																		status: taskFormData.status,
																		financial_worth_archive: taskFormData.financial_worth_archive,
																		social_worth_archive: taskFormData.social_worth_archive,
																		extends_dates: updatedExtensions,
																	})

																	toast.success('Extension request rejected')
																	setTaskFormData((prev) => ({
																		...prev,
																		extends_dates: updatedExtensions,
																	}))
																} catch (error) {
																	toast.error('Failed to reject extension request')
																	console.error(error)
																}
															}}>
															Reject
														</Button>
													</>
												)}
												{/* {extension.status === 'accepted' && (
													<span className='text-success'>Approved</span>
												)}
												{extension.status === 'rejected' && (
													<span className='text-danger'>Rejected</span>
												)} */}
												<span
													className={`badge ${
														extension.status === 'accepted'
															? 'badge-success'
															: extension.status === 'rejected'
															? 'badge-danger'
															: 'badge-warning'
													}`}>
													{extension.status || 'pending'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{taskFormData.extends_dates.length === 0 && (
							<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
								<b>No extension requests found</b>
							</div>
						)}
					</div>
				</KTCard>
			)}

			{/* Extension History Section */}
			{/* {taskFormData.extends_dates && taskFormData.extends_dates.length > 0 && (
				<div
					className='accordion'
					id='kt_accordion_1'>
					<KTCard className='accordion-item mt-5'>
						<div className='card-header'>
							<h3 className='card-title'>Extension History</h3>
						</div>
						<div
							id='kt_accordion_1_body_1'
							className='accordion-collapse collapse show'>
							<div className='py-4 card-body'>
								<div className='table-responsive'>
									<table className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
										<thead className='table-hide-th'>
											<tr className='fw-bold text-muted bg-light border-bottom-0'>
												<th className='text-center ps-4 rounded-start'>No.</th>
												<th>Extended Date</th>
												<th>Reason</th>
											</tr>
										</thead>
										<tbody>
											{taskFormData.extends_dates.map((extension, index) => (
												<tr key={`${extension.date}-${index}`} className='data-row'>
													<td className='text-center'>
														<span className='text-dark fw-bold d-block mb-1 fs-6'>
															{index + 1}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold d-block mb-1 fs-6'>
															{new Date(extension.date).toLocaleDateString()}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold d-block mb-1 fs-6'>
															{extension.reason}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								{taskFormData.extends_dates.length === 0 && (
									<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
										<b>No extension records found</b>
									</div>
								)}
							</div>
						</div>
					</KTCard>
				</div>
			)} */}
		</>
	)
}

export default TaskView
