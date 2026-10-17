import {
	faArrowLeft,
	faFile,
	faFileAudio,
	faFileExcel,
	faFileImage,
	faFilePdf,
	faFileWord,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { ActionTask, GetTask, UpdateTask } from '../../../Functions/FGGroup/TaskManagement'

export function TaskView() {
	const [task, setTask] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const location = useLocation()
	const queryParams = new URLSearchParams(location.search)
	const taskId = queryParams.get('id')
	const adminIdParam = queryParams.get('adminId')
	const [showActionModal, setShowActionModal] = useState(false)
	const [selectedStatus, setSelectedStatus] = useState('PENDING')
	const [remark, setRemark] = useState('')
	const [employeeStatus, setEmployeeStatus] = useState('')
	const [filesToUpload, setFilesToUpload] = useState<File[]>([])
	const [actionLoading, setActionLoading] = useState(false)
	const [urls, setUrls] = useState<Array<{ url_type: string; link: string }>>([])
	const [financialWorthArchive, setFinancialWorthArchive] = useState<string>('false')
	const [socialWorthArchive, setSocialWorthArchive] = useState<string>('false')
	const [showExtensionModal, setShowExtensionModal] = useState(false)
	const [extensionDate, setExtensionDate] = useState('')
	const [extensionReason, setExtensionReason] = useState('')

	const fetchTaskDetails = async () => {
		try {
			if (!taskId) return
			const raw =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			const employeeData = raw ? JSON.parse(raw) : {}
			const response = await GetTask({
				admin_id: adminIdParam || employeeData._id,
				task_id: taskId,
			})
			if (response.data && response.data.length > 0) {
				setTask(response.data[0])
			}
		} catch (error) {
			console.error('Error fetching task details:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchTaskDetails()
	}, [taskId])

	if (loading) {
		return (
			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-header border-0 pt-6 pb-4 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div className='d-flex align-items-center gap-3'>
						<div className='gz-skeleton rounded' style={{ width: '75px', height: '32px' }} />
						<div className='d-flex flex-column gap-1.5'>
							<div className='gz-skeleton rounded' style={{ width: '220px', height: '22px' }} />
							<div className='gz-skeleton rounded' style={{ width: '160px', height: '14px' }} />
						</div>
					</div>
					<div className='d-flex align-items-center gap-2'>
						<div className='gz-skeleton rounded' style={{ width: '90px', height: '32px' }} />
						<div className='gz-skeleton rounded' style={{ width: '70px', height: '32px' }} />
					</div>
				</div>
				<div className='card-body pt-4'>
					<div className='row mb-6'>
						<div className='col-md-6 mb-4'>
							<div className='gz-skeleton rounded mb-2' style={{ width: '90px', height: '14px' }} />
							<div className='gz-skeleton rounded w-100' style={{ height: '42px' }} />
						</div>
						<div className='col-md-6 mb-4'>
							<div className='gz-skeleton rounded mb-2' style={{ width: '120px', height: '14px' }} />
							<div className='gz-skeleton rounded w-100' style={{ height: '42px' }} />
						</div>
						<div className='col-md-6 mb-4'>
							<div className='gz-skeleton rounded mb-2' style={{ width: '100px', height: '14px' }} />
							<div className='gz-skeleton rounded w-100' style={{ height: '42px' }} />
						</div>
						<div className='col-md-6 mb-4'>
							<div className='gz-skeleton rounded mb-2' style={{ width: '110px', height: '14px' }} />
							<div className='gz-skeleton rounded w-100' style={{ height: '42px' }} />
						</div>
					</div>
					<div className='mb-6'>
						<div className='gz-skeleton rounded mb-2' style={{ width: '120px', height: '14px' }} />
						<div className='gz-skeleton rounded w-100' style={{ height: '100px' }} />
					</div>
				</div>
			</div>
		)
	}

	if (!task) {
		return <div>Task not found</div>
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

	const handleActionSubmit = async () => {
		if (!selectedStatus) {
			toast.error('Please select a status')
			return
		}

		if (!remark.trim()) {
			toast.error('Please enter a remark')
			return
		}

		if (selectedStatus === 'COMPLETED' && filesToUpload.length === 0 && !task.file_url) {
			toast.error('Please upload at least one file to complete the task')
			return
		}

		if (urls.length > 0) {
			const invalidUrls = urls.some((url) => !url.url_type || !url.link)
			if (invalidUrls) {
				toast.error('Please fill both type and link for all URLs')
				return
			}
		}

		if (!taskId) {
			toast.error('Task ID is missing')
			return
		}
		setActionLoading(true)

		try {
			let fileUrls: string[] = []
			if (filesToUpload.length > 0) {
				const response: any = await FileUploadToFGGroup(filesToUpload, {
					directory: 'files',
				})
				if (response.data?.fileURLs && Array.isArray(response.data.fileURLs)) {
					fileUrls = response.data.fileURLs
				}
				toast.success('Files uploaded successfully')
			}

			let taskDoneFiles: string[] = []
			if (fileUrls.length > 0) {
				taskDoneFiles = fileUrls
			} else if (task.task_done_file) {
				if (Array.isArray(task.task_done_file)) {
					taskDoneFiles = task.task_done_file.flatMap((fileStr: any) =>
						typeof fileStr === 'string' ? fileStr.split(',').filter(Boolean) : []
					)
				} else if (typeof task.task_done_file === 'string') {
					taskDoneFiles = task.task_done_file.split(',').filter(Boolean)
				}
			}

			await ActionTask({
				task_id: taskId,
				status: selectedStatus,
				remark_by_employee: remark,
				task_done_file: taskDoneFiles.length > 0 ? taskDoneFiles : undefined,
				url: urls.length > 0 ? urls : undefined,
				financial_worth_archive: financialWorthArchive,
				social_worth_archive: socialWorthArchive,
			})
			toast.success('Task Completed Successfully')
			fetchTaskDetails()
			setShowActionModal(false)
			setFilesToUpload([])
			setUrls([])
			setFinancialWorthArchive('false')
			setSocialWorthArchive('false')
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			setActionLoading(false)
		}
	}

	const handleAccept = () => {
		if (!taskId) {
			toast.error('Task ID is missing')
			return
		}
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
					await UpdateTask({
						task_id: taskId,
						employee_status: 'accepted',
						task_title: task.task_title,
						start_date: task.start_date,
						end_date: task.end_date,
						admin_id: task.admin_id,
					})
					setEmployeeStatus('ACCEPTED')
					toast.success('Task accepted successfully')
					fetchTaskDetails()
				} catch (error: any) {
					toast.error(error.message || 'Failed to accept task')
					console.error(error)
				}
			}
		})
	}

	const handleReject = () => {
		if (!taskId) {
			toast.error('Task ID is missing')
			return
		}
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
			if (result.isConfirmed && result.value) {
				try {
					await UpdateTask({
						task_id: taskId,
						employee_status: 'rejected',
						reject_reason: result.value,
						task_title: task.task_title,
						start_date: task.start_date,
						end_date: task.end_date,
						admin_id: task.admin_id,
					})
					setEmployeeStatus('REJECTED')
					toast.success('Task rejected successfully')
					fetchTaskDetails()
				} catch (error: any) {
					toast.error(error.message || 'Failed to reject task')
					console.error(error)
				}
			}
		})
	}

	const handleExtensionRequest = async () => {
		if (!extensionDate) {
			toast.error('Please select an extension date')
			return
		}

		if (!extensionReason.trim()) {
			toast.error('Please provide a reason for the extension')
			return
		}

		if (!taskId) {
			toast.error('Task ID is missing')
			return
		}

		try {
			const extensionData = {
				date: new Date(extensionDate).toISOString(),
				reason: extensionReason,
			}

			const existingExtensions = task.extends_dates
				? task.extends_dates.map(
						({ date, reason, status }: { date: string; reason: string; status?: string }) => ({
							date,
							reason,
							status,
						})
				  )
				: []

			await UpdateTask({
				task_id: taskId,
				extends_dates: [...existingExtensions, extensionData],
				task_title: task.task_title,
				start_date: task.start_date,
				end_date: task.end_date,
				admin_id: task.admin_id,
			})

			toast.success('Extension request submitted successfully')
			setShowExtensionModal(false)
			setExtensionDate('')
			setExtensionReason('')
			fetchTaskDetails()
		} catch (error: any) {
			toast.error(error.message || 'Failed to submit extension request')
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Task Details</PageTitle>
			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				{/* Modern Header */}
				<div className='card-header border-0 pt-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div className='d-flex align-items-center gap-3'>
						<button
							type='button'
							className='btn btn-sm btn-light d-flex align-items-center gap-2'
							style={{ borderRadius: '8px' }}
							onClick={() => window.history.back()}>
							<FontAwesomeIcon icon={faArrowLeft} className='fs-6' />
							<span>Back</span>
						</button>
						<div>
							<h2 className='fw-bolder text-gray-900 mb-0'>{task.task_title}</h2>
							<span className='text-muted fs-7'>
								Task Timeline: {DayJS(task?.start_date).format('DD/MM/YYYY')} - {DayJS(task?.end_date).format('DD/MM/YYYY')}
							</span>
						</div>
					</div>

					<div className='d-flex align-items-center gap-2'>
						{task.status === 'PENDING' && (
							<>
								{(!task.employee_status || task.employee_status === 'pending') && (
									<>
										<Button
											variant='success'
											size='sm'
											style={{ borderRadius: '8px' }}
											onClick={handleAccept}>
											Accept Task
										</Button>
										<Button
											variant='danger'
											size='sm'
											style={{ borderRadius: '8px' }}
											onClick={handleReject}>
											Reject
										</Button>
									</>
								)}
								{task.employee_status === 'accepted' && (
									<Button
										variant='primary'
										size='sm'
										style={{ borderRadius: '8px' }}
										onClick={() => setShowActionModal(true)}>
										Complete Task
									</Button>
								)}
							</>
						)}
					</div>
				</div>

				<div className='card-body pt-4'>

					<div className='row mb-4'>
						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>HR Status</Form.Label>
								<div className='d-flex gap-2 align-items-center'>
									<Form.Control
										type='text'
										value={task?.hr_status.toUpperCase()}
										readOnly
										className={`inputfield-bg ${
											task?.hr_status === 'complete'
												? 'text-success'
												: task?.hr_status === 'pending'
												? 'text-warning'
												: 'text-danger'
										}`}
									/>
									{task?.hr_status === 'rejected' && task?.hr_reject_reason && (
										<Button
											variant='info'
											size='sm'
											onClick={() => {
												Swal.fire({
													title: 'HR Rejection Reason',
													text: task?.hr_reject_reason || 'No reason provided.',
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
							<Form.Group className='mb-3'>
								<Form.Label>Employee Status</Form.Label>
								<div className='d-flex gap-2 align-items-center'>
									<Form.Control
										type='text'
										value={task?.employee_status ? task?.employee_status.toUpperCase() : 'PENDING'}
										readOnly
										className={`inputfield-bg ${
											task?.employee_status === 'rejected'
												? 'text-danger'
												: task?.employee_status === 'accepted'
												? 'text-success'
												: 'text-warning'
										}`}
									/>
									{task?.employee_status === 'rejected' && task?.reject_reason && (
										<Button
											variant='info'
											size='sm'
											onClick={() => {
												Swal.fire({
													title: 'Rejection Reason',
													text: task?.reject_reason || 'No reason provided.',
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

						<div className='col-md-12'>
							<div className='row'>
								<div className={task?.completed_date ? 'col-md-4' : 'col-md-6'}>
									<Form.Group className='mb-3'>
										<Form.Label>Start Date</Form.Label>
										<Form.Control
											type='text'
											value={DayJS(task?.start_date).format('DD/MM/YYYY')}
											className='inputfield-bg'
											readOnly
										/>
									</Form.Group>
								</div>

								<div className={task?.completed_date ? 'col-md-4' : 'col-md-6'}>
									<Form.Group className='mb-3'>
										<Form.Label>End Date</Form.Label>
										<Form.Control
											type='text'
											value={DayJS(task?.end_date).format('DD/MM/YYYY')}
											className='inputfield-bg'
											readOnly
										/>
									</Form.Group>
								</div>

								{task?.completed_date && (
									<div className='col-md-4'>
										<Form.Group className='mb-3'>
											<Form.Label>Completed Date</Form.Label>
											<Form.Control
												type='text'
												value={DayJS(task?.completed_date).format('DD/MM/YYYY')}
												className='inputfield-bg'
												readOnly
											/>
										</Form.Group>
									</div>
								)}
							</div>
						</div>
						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>Financial Worth</Form.Label>
								<Form.Control
									as='textarea'
									rows={3}
									value={task?.financial_worth || 'Not specified'}
									readOnly
								/>
							</Form.Group>
						</div>
						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>Social Worth</Form.Label>
								<Form.Control
									as='textarea'
									rows={3}
									value={task?.social_worth || 'Not specified'}
									readOnly
								/>
							</Form.Group>
						</div>
						<div className='col-md-6'>
							<Form.Group
								className='mb-3'
								controlId='financial_worth_archive'>
								<Form.Label>Financial Worth Archive</Form.Label>
								<Form.Control
									className={`inputfield-bg fw-bold ${
										task?.financial_worth_archive == 'true' ? 'text-success' : 'text-danger'
									}`}
									type='text'
									name='financial_worth_archive'
									value={task?.financial_worth_archive == 'true' ? 'YES' : 'NO'}
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
										task?.social_worth_archive == 'true' ? 'text-success' : 'text-danger'
									}`}
									type='text'
									name='social_worth_archive'
									value={task?.social_worth_archive == 'true' ? 'YES' : 'NO'}
									readOnly
									required
								/>
							</Form.Group>
						</div>
						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>HR Remark</Form.Label>
								<Form.Control
									as='textarea'
									rows={3}
									value={task?.remark_by_hr || 'No remark provided'}
									readOnly
								/>
							</Form.Group>
						</div>
						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>Employee Remark</Form.Label>
								<Form.Control
									as='textarea'
									rows={3}
									value={task?.remark_by_employee || 'No remark provided'}
									readOnly
								/>
							</Form.Group>
						</div>
					</div>

					{/* Task Attachments */}
					{task.file_url &&
						(Array.isArray(task.file_url)
							? task.file_url
							: typeof task.file_url === 'string'
							? task.file_url.split(',')
							: []
						).filter(Boolean).length > 0 && (
							<div className='row mb-4'>
								<div className='col-md-12'>
									<h4 className='mb-3'>Attachments</h4>
									<div className='d-flex flex-wrap gap-3 justify-content-start'>
										{(Array.isArray(task.file_url)
											? task.file_url
											: typeof task.file_url === 'string'
											? task.file_url.split(',')
											: []
										)
											.filter(Boolean)
											.map((file: string, index: number) => {
												const isExcelFile =
													file.toLowerCase().match(/\.(xlsx|xls|csv)$/) ||
													file.toLowerCase().includes('spreadsheetml.sheet') ||
													file.toLowerCase().includes('ms-excel')
												const isPdfFile = file.toLowerCase().endsWith('.pdf')
												const isImageFile = file.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg)$/)
												const isWordFile = file.toLowerCase().match(/\.(doc|docx)$/)
												const isAudioFile = file.toLowerCase().match(/\.(mp3|wav|ogg)$/)

												if (isExcelFile) {
													return (
														<div
															key={index}
															className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-success bg-light-success'
															style={{ width: '150px' }}
															onClick={() => DownloadDocument(file)}
															title={file.split('/').pop()}>
															<FontAwesomeIcon
																icon={faFileExcel}
																className='text-success'
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
																}}>
																{file.split('/').pop()}
															</span>
														</div>
													)
												}

												if (isPdfFile) {
													return (
														<div
															key={index}
															className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-danger bg-light-danger'
															style={{ width: '150px' }}
															onClick={() => DownloadDocument(file)}
															title={file.split('/').pop()}>
															<FontAwesomeIcon
																icon={faFilePdf}
																className='text-danger'
																style={{ fontSize: '45px' }}
															/>
															<span
																className='mt-2 fw-bold text-danger text-center text-truncate w-100'
																style={{ fontSize: '12px' }}>
																{file.split('/').pop()}
															</span>
														</div>
													)
												}

												return (
													<div
														key={index}
														className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-gray-300 bg-light'
														style={{ width: '150px' }}
														onClick={() => DownloadDocument(file)}
														title={file.split('/').pop()}>
														<FontAwesomeIcon
															icon={
																isImageFile
																	? faFileImage
																	: isWordFile
																	? faFileWord
																	: isAudioFile
																	? faFileAudio
																	: faFile
															}
															className='text-gray-600'
															style={{ fontSize: '45px' }}
														/>
														<span
															className='mt-2 fw-bold text-gray-700 text-center text-truncate w-100'
															style={{ fontSize: '12px' }}>
															{file.split('/').pop()}
														</span>
													</div>
												)
											})}
									</div>
								</div>
							</div>
						)}

					{/* Completed Task Files */}
					{(Array.isArray(task?.task_done_file)
						? task.task_done_file
						: typeof task.task_done_file === 'string'
						? task.task_done_file.split(',')
						: []
					).filter(Boolean).length > 0 && (
						<div className='row mb-4'>
							<div className='col-md-12'>
								<h4 className='mb-3'>Completed Task Files</h4>
								<div className='d-flex flex-wrap gap-3 justify-content-start'>
									{(Array.isArray(task?.task_done_file)
										? task.task_done_file
										: typeof task.task_done_file === 'string'
										? task.task_done_file.split(',')
										: []
									)
										.filter(Boolean)
										.map((file: string, index: number) => {
											const isExcelFile =
												file.toLowerCase().match(/\.(xlsx|xls|csv)$/) ||
												file.toLowerCase().includes('spreadsheetml.sheet') ||
												file.toLowerCase().includes('ms-excel')
											const isPdfFile = file.toLowerCase().endsWith('.pdf')
											const isImageFile = file.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg)$/)
											const isWordFile = file.toLowerCase().match(/\.(doc|docx)$/)
											const isAudioFile = file.toLowerCase().match(/\.(mp3|wav|ogg)$/)

											if (isExcelFile) {
												return (
													<div
														key={index}
														className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-success bg-light-success'
														style={{ width: '150px' }}
														onClick={() => DownloadDocument(file)}
														title={file.split('/').pop()}>
														<FontAwesomeIcon
															icon={faFileExcel}
															className='text-success'
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
															}}>
															{file.split('/').pop()}
														</span>
													</div>
												)
											}

											if (isPdfFile) {
												return (
													<div
														key={index}
														className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-danger bg-light-danger'
														style={{ width: '150px' }}
														onClick={() => DownloadDocument(file)}
														title={file.split('/').pop()}>
														<FontAwesomeIcon
															icon={faFilePdf}
															className='text-danger'
															style={{ fontSize: '45px' }}
														/>
														<span
															className='mt-2 fw-bold text-danger text-center text-truncate w-100'
															style={{ fontSize: '12px' }}>
															{file.split('/').pop()}
														</span>
													</div>
												)
											}

											return (
												<div
													key={index}
													className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-gray-300 bg-light'
													style={{ width: '150px' }}
													onClick={() => DownloadDocument(file)}
													title={file.split('/').pop()}>
													<FontAwesomeIcon
														icon={
															isImageFile
																? faFileImage
																: isWordFile
																? faFileWord
																: isAudioFile
																? faFileAudio
																: faFile
														}
														className='text-gray-600'
														style={{ fontSize: '45px' }}
													/>
													<span
														className='mt-2 fw-bold text-gray-700 text-center text-truncate w-100'
														style={{ fontSize: '12px' }}>
														{file.split('/').pop()}
													</span>
												</div>
											)
										})}
								</div>
							</div>
						</div>
					)}

					{/* Task URLs */}
					{task.url && Array.isArray(task.url) && task.url.length > 0 && (
						<div className='row mb-4'>
							<div className='col-md-12'>
								<h4 className='mb-3'>Task URLs</h4>
								<div className='list-group'>
									{task.url.flatMap(
										(urlArray: Array<{ url_type: string; link: string }>, index: number) =>
											Array.isArray(urlArray)
												? urlArray.map(
														(urlItem: { url_type: string; link: string }, subIndex: number) => (
															<div
																key={`url-${index}-${subIndex}`}
																className='list-group-item'>
																<div className='d-flex justify-content-between align-items-center'>
																	<div style={{ overflow: 'scroll' }}>
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
																		<i className='fas fa-external-link-alt p-0'></i>
																	</Button>
																</div>
															</div>
														)
												  )
												: []
									)}
								</div>
							</div>
						</div>
					)}

					{/* Extension Requests Section */}
					{task.extends_dates && task.extends_dates.length > 0 && (
						<div className='row mb-4'>
							<div className='col-md-12'>
								<h4 className='mb-3'>Extension Requests</h4>
								<div className='list-group'>
									{task.extends_dates.map((extension: any, index: number) => (
										<div
											key={`extension-${index}`}
											className='list-group-item'>
											<div className='d-flex justify-content-between'>
												<div>
													<strong>Requested Date:</strong>{' '}
													{DayJS(extension.date).format('DD/MM/YYYY')}
												</div>
												<div>
													<strong>Status:</strong>
													<span
														className={`ms-2 ${
															extension.status === 'accepted'
																? 'text-success'
																: extension.status === 'rejected'
																? 'text-danger'
																: 'text-warning'
														}`}>
														{extension.status?.toUpperCase()}
													</span>
												</div>
											</div>
											<div className='mt-2'>
												<strong>Reason:</strong> {extension.reason}
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					<div className='d-flex gap-2 justify-content-end'>
						{task?.status === 'PENDING' && (
							<>
								{(!task?.employee_status || task?.employee_status === 'pending') && (
									<>
										<Button
											variant='success'
											size='sm'
											onClick={handleAccept}>
											Accept
										</Button>
										<Button
											variant='danger'
											size='sm'
											onClick={handleReject}>
											Reject
										</Button>
									</>
								)}
								{task?.employee_status === 'accepted' && (
									<>
										<Button
											variant='warning'
											size='sm'
											onClick={() => setShowExtensionModal(true)}>
											Request Extension
										</Button>
										<Button
											variant='primary'
											size='sm'
											onClick={() => setShowActionModal(true)}>
											Complete Task
										</Button>
									</>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			{/* Extension Request Modal */}
			<Modal
				show={showExtensionModal}
				centered
				onHide={() => setShowExtensionModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Request Task Extension</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form.Group className='mb-3'>
						<Form.Label>Extension Date</Form.Label>
						<Form.Control
							type='date'
							value={extensionDate}
							onChange={(e) => setExtensionDate(e.target.value)}
							min={DayJS(task?.end_date).format('YYYY-MM-DD')}
						/>
					</Form.Group>
					<Form.Group className='mb-3'>
						<Form.Label>Reason for Extension</Form.Label>
						<Form.Control
							as='textarea'
							rows={3}
							placeholder='Please provide a reason for requesting an extension'
							value={extensionReason}
							onChange={(e) => setExtensionReason(e.target.value)}
						/>
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={() => setShowExtensionModal(false)}>
						Cancel
					</Button>
					<Button
						variant='primary'
						onClick={handleExtensionRequest}>
						Submit Request
					</Button>
				</Modal.Footer>
			</Modal>

			<Modal
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

					<div className='row mt-3'>
						<div className='col-md-6'>
							<Form.Group controlId='financialWorthArchive'>
								<Form.Label>Financial Worth Archive:</Form.Label>
								<Form.Select
									className='inputfield-bg'
									value={financialWorthArchive}
									onChange={(e) => setFinancialWorthArchive(e.target.value)}
									isInvalid={financialWorthArchive === ''}>
									<option value=''>Select Option</option>
									<option value='true'>Yes</option>
									<option value='false'>No</option>
								</Form.Select>
								<Form.Control.Feedback type='invalid'>
									Please select an option.
								</Form.Control.Feedback>
							</Form.Group>
						</div>

						<div className='col-md-6'>
							<Form.Group controlId='socialWorthArchive'>
								<Form.Label>Social Worth Archive:</Form.Label>
								<Form.Select
									className='inputfield-bg'
									value={socialWorthArchive}
									onChange={(e) => setSocialWorthArchive(e.target.value)}
									isInvalid={socialWorthArchive === ''}>
									<option value=''>Select Option</option>
									<option value='true'>Yes</option>
									<option value='false'>No</option>
								</Form.Select>
								<Form.Control.Feedback type='invalid'>
									Please select an option.
								</Form.Control.Feedback>
							</Form.Group>
						</div>
					</div>

					<Form.Group
						className='mt-3'
						controlId='file'>
						<Form.Label>Attachments</Form.Label>
						<Form.Control
							type='file'
							multiple
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								if (e.target.files && e.target.files.length > 0) {
									const files = Array.from(e.target.files)
									const selectedFiles = files.map((file) => {
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
									setFilesToUpload(selectedFiles)
								}
							}}
						/>
						{filesToUpload.length > 0 && (
							<div className='mt-2'>
								<p className='mb-2'>Selected Files:</p>
								<ul className='list-unstyled'>
									{filesToUpload.map((file, index) => (
										<li
											key={index}
											className='d-flex align-items-center gap-2 mb-1'>
											<span>{file.name}</span>
											<Button
												variant='danger'
												size='sm'
												className='btn-danger-light'
												onClick={() => {
													setFilesToUpload((prev) => prev.filter((_, i) => i !== index))
												}}>
												<i className='fas fa-times p-0'></i>
											</Button>
										</li>
									))}
								</ul>
							</div>
						)}
					</Form.Group>

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
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={() => setShowActionModal(false)}>
						Cancel
					</Button>
					<Button
						variant='primary'
						onClick={handleActionSubmit}
						disabled={actionLoading}
						className='d-flex align-items-center gap-2'>
						{actionLoading && (
							<span
								className='spinner-border spinner-border-sm'
								role='status'
								aria-hidden='true'></span>
						)}
						{actionLoading ? 'Processing...' : 'Confirm'}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
