import React, { useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import {
	GetDailyReporting,
	UpdateDailyReporting,
} from '../../../Functions/FGGroup/DailyTaskReporting'

export default function DailyReportUpdate() {
	const [dailyReport, setDailyReport] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [submitLoading, setSubmitLoading] = useState(false)
	const [taskTitle, setTaskTitle] = useState('')
	const [remarks, setRemarks] = useState('')
	const [urls, setUrls] = useState<Array<{ url_type: string; link: string }>>([])
	const [existingFiles, setExistingFiles] = useState<string[]>([])
	const [newFiles, setNewFiles] = useState<File[]>([])
	const location = useLocation()
	const navigate = useNavigate()
	const queryParams = new URLSearchParams(location.search)
	const reportId = queryParams.get('id')

	const fetchDailyReportDetails = async () => {
		try {
			if (!reportId) return
			const raw =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			const employeeData = raw ? JSON.parse(raw) : {}
			const response = await GetDailyReporting({
				admin_id: employeeData._id,
				daily_reporting_id: reportId,
			})
			if (response.data && response.data.length > 0) {
				const report = response.data[0]
				setDailyReport(report)
				setTaskTitle(report.task_title || '')
				setRemarks(report.remarks || '')
				setExistingFiles(Array.isArray(report.file_url) ? report.file_url.filter(Boolean) : [])

				let urlData = []
				if (Array.isArray(report.url)) {
					if (report.url.length > 0 && Array.isArray(report.url[0])) {
						urlData = report.url[0]
					} else {
						urlData = report.url
					}
				} else if (report.url && typeof report.url === 'object' && !Array.isArray(report.url)) {
					urlData = []
				}

				const formattedUrls = Array.isArray(urlData)
					? urlData.map((item) => ({
							url_type: item.url_type || '',
							link: item.link || '',
					  }))
					: []

				setUrls(formattedUrls)
			}
		} catch (error) {
			console.error('Error fetching daily report details:', error)
			toast.error('Error fetching report details')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchDailyReportDetails()
	}, [reportId])

	if (loading) {
		return (
			<div className='d-flex align-items-center justify-content-center py-20'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		)
	}

	if (!dailyReport) {
		return (
			<div className='card shadow-sm border-0 p-10 text-center' style={{ borderRadius: '14px' }}>
				<h4 className='text-gray-800 mb-2'>Report not found</h4>
				<button className='btn btn-sm btn-primary mx-auto mt-3' onClick={() => navigate('/employee/daily-report')}>
					Back to Daily Reports
				</button>
			</div>
		)
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

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const selectedFiles = Array.from(e.target.files)
			setNewFiles(selectedFiles)
		}
	}

	const removeExistingFile = (index: number) => {
		setExistingFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const removeNewFile = (index: number) => {
		const updatedFiles = newFiles.filter((_, i) => i !== index)
		setNewFiles(updatedFiles)

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
		if (fileInput) {
			const dt = new DataTransfer()
			updatedFiles.forEach((file) => dt.items.add(file))
			fileInput.files = dt.files
		}
	}

	const addNewUrl = () => {
		setUrls([...urls, { url_type: '', link: '' }])
	}

	const removeUrl = (index: number) => {
		setUrls((prev) => prev.filter((_, i) => i !== index))
	}

	const handleUrlChange = (index: number, field: 'url_type' | 'link', value: string) => {
		setUrls((prev) =>
			prev.map((url, i) => {
				if (i === index) {
					return { ...url, [field]: value }
				}
				return url
			})
		)
	}

	const convertToRelativeUrl = (url: string): string => {
		try {
			if (!url.startsWith('http://') && !url.startsWith('https://')) {
				return url
			}
			const urlObj = new URL(url)
			return urlObj.pathname + urlObj.search + urlObj.hash
		} catch (error) {
			return url
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!reportId) {
			toast.error('Report ID not found')
			return
		}

		if (!taskTitle.trim()) {
			toast.error('Task title is required')
			return
		}

		setSubmitLoading(true)

		try {
			let newFileUrls: string[] = []
			if (newFiles.length > 0) {
				const response: any = await FileUploadToFGGroup(newFiles)
				if (response?.data?.fileURLs) {
					newFileUrls = response.data.fileURLs
				}
			}

			const allFileUrls = [...existingFiles, ...newFileUrls]
			const raw =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			const employeeData = raw ? JSON.parse(raw) : {}

			const processedUrls = Array.isArray(urls)
				? urls.map((urlItem) => ({
						url_type: urlItem.url_type,
						link: convertToRelativeUrl(urlItem.link),
				  }))
				: []

			const payload = {
				report_id: reportId,
				task_title: taskTitle,
				remarks: remarks,
				file_url: allFileUrls,
				admin_id: employeeData._id,
				url: processedUrls,
			}

			await UpdateDailyReporting(payload)
			toast.success('Daily Report Updated Successfully')
			navigate('/employee/daily-report')
		} catch (error: any) {
			toast.error(error.message || 'Error updating report')
		} finally {
			setSubmitLoading(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Edit Daily Report</PageTitle>

			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				{/* Modern Header */}
				<div className='card-header border-0 pt-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div className='d-flex align-items-center gap-3'>
						<button
							type='button'
							className='btn btn-sm btn-light d-flex align-items-center gap-2'
							style={{ borderRadius: '8px' }}
							onClick={() => navigate('/employee/daily-report')}
							disabled={submitLoading}>
							<i className='bi bi-arrow-left fs-6'></i>
							<span>Back</span>
						</button>
						<div>
							<h2 className='fw-bolder text-gray-900 mb-0'>Edit Daily Report</h2>
							<span className='text-muted fs-7'>
								Submitted originally on {DayJS(dailyReport?.createdAt).format('DD MMMM YYYY')}
							</span>
						</div>
					</div>

					<div className='d-flex align-items-center gap-2'>
						<button
							type='button'
							className='btn btn-sm btn-light'
							style={{ borderRadius: '8px' }}
							onClick={() => navigate('/employee/daily-report')}
							disabled={submitLoading}>
							Cancel
						</button>
						<button
							type='button'
							className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
							style={{ height: '38px', borderRadius: '10px' }}
							onClick={handleSubmit}
							disabled={submitLoading}>
							{submitLoading ? (
								<>
									<span className='spinner-border spinner-border-sm' role='status'></span>
									<span>Saving...</span>
								</>
							) : (
								<>
									<i className='bi bi-check2 fs-6'></i>
									<span>Update Report</span>
								</>
							)}
						</button>
					</div>
				</div>

				<div className='card-body pt-4'>
					<Form onSubmit={handleSubmit}>
						<div className='row g-4 mb-6'>
							<div className='col-12 col-md-8'>
								<Form.Group>
									<Form.Label className='fw-bold text-gray-700 fs-7'>
										Task Deliverable Title <span className='text-danger'>*</span>
									</Form.Label>
									<Form.Control
										type='text'
										value={taskTitle}
										onChange={(e) => setTaskTitle(e.target.value)}
										placeholder='Enter task title'
										style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
										required
									/>
								</Form.Group>
							</div>

							<div className='col-12 col-md-4'>
								<Form.Group>
									<Form.Label className='fw-bold text-gray-700 fs-7'>Submission Date</Form.Label>
									<Form.Control
										type='text'
										value={DayJS(dailyReport?.createdAt).format('DD/MM/YYYY')}
										readOnly
										style={{ height: '42px', borderRadius: '8px', background: '#f8fafc', borderColor: '#ded8d2' }}
									/>
								</Form.Group>
							</div>

							<div className='col-12'>
								<Form.Group>
									<Form.Label className='fw-bold text-gray-700 fs-7'>Detailed Remarks / Progress Notes</Form.Label>
									<Form.Control
										as='textarea'
										rows={4}
										value={remarks}
										onChange={(e) => setRemarks(e.target.value)}
										placeholder='Type your remarks and deliverables summary here'
										style={{ borderRadius: '8px', borderColor: '#ded8d2' }}
									/>
								</Form.Group>
							</div>
						</div>

						{/* File Upload Section */}
						<div className='mb-6'>
							<h4 className='fw-bolder text-gray-900 mb-2'>Attach Deliverable Files</h4>
							<Form.Group className='mb-3'>
								<Form.Control
									type='file'
									onChange={handleFileChange}
									multiple
									style={{ borderRadius: '8px' }}
								/>
								<small className='text-muted d-block mt-1 fs-8'>
									Supported formats: PDF, Images (PNG, JPG), spreadsheets, documents.
								</small>

								{/* New Files */}
								{newFiles.length > 0 && (
									<div className='mt-3'>
										<h6 className='fs-8 fw-bold text-gray-700 mb-2'>New Files Staged for Upload:</h6>
										<div className='d-flex flex-wrap gap-2'>
											{newFiles.map((file, index) => (
												<div key={index} className='d-flex align-items-center bg-light border rounded px-3 py-1 gap-2'>
													<i className='bi bi-file-earmark-plus text-primary'></i>
													<span className='fs-8 fw-semibold text-gray-800' style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
														{file.name}
													</span>
													<button
														type='button'
														className='btn btn-icon btn-xs btn-light-danger p-0'
														style={{ width: '20px', height: '20px', borderRadius: '4px' }}
														onClick={() => removeNewFile(index)}>
														<i className='bi bi-x fs-7'></i>
													</button>
												</div>
											))}
										</div>
									</div>
								)}
							</Form.Group>
						</div>

						{/* Existing Files */}
						{existingFiles.length > 0 && (
							<div className='mb-6'>
								<h4 className='fw-bolder text-gray-900 mb-3'>Existing Files ({existingFiles.length})</h4>
								<div className='d-flex flex-wrap gap-3'>
									{existingFiles.map((file, index) => (
										<div key={index} className='d-flex align-items-center bg-light border rounded-3 p-3 gap-3 shadow-xs'>
											<i className='bi bi-paperclip fs-4 text-primary'></i>
											<div>
												<span
													className='fw-bold text-gray-800 fs-7 d-block text-truncate'
													style={{ maxWidth: '200px' }}
													title={file.split('/').pop()}>
													{file.split('/').pop()}
												</span>
												<div className='d-flex gap-2 mt-1'>
													<button
														type='button'
														className='btn btn-link p-0 text-primary fs-8'
														onClick={() => DownloadDocument(file)}>
														Download
													</button>
													<span className='text-muted'>•</span>
													<button
														type='button'
														className='btn btn-link p-0 text-danger fs-8'
														onClick={() => removeExistingFile(index)}>
														Remove
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* URLs Section */}
						<div className='mb-6'>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<h4 className='fw-bolder text-gray-900 mb-0'>Deliverable URLs & Links ({urls.length})</h4>
								<button
									type='button'
									className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-3'
									style={{ borderRadius: '8px' }}
									onClick={addNewUrl}>
									<i className='bi bi-plus-lg fs-7'></i>
									<span>Add URL</span>
								</button>
							</div>

							{Array.isArray(urls) && urls.length > 0 ? (
								urls.map((url, index) => (
									<div key={index} className='mb-3 border rounded-3 p-3 bg-light'>
										<div className='row g-3 align-items-end'>
											<div className='col-md-4'>
												<Form.Label className='fs-8 fw-bold text-gray-700 mb-1'>Link Type / Label</Form.Label>
												<Form.Control
													type='text'
													value={url.url_type}
													onChange={(e) => handleUrlChange(index, 'url_type', e.target.value)}
													placeholder='e.g., Figma, GitHub PR, Google Sheet'
													style={{ height: '38px', borderRadius: '8px', borderColor: '#ded8d2' }}
												/>
											</div>
											<div className='col-md-7'>
												<Form.Label className='fs-8 fw-bold text-gray-700 mb-1'>Web URL</Form.Label>
												<Form.Control
													type='url'
													value={url.link}
													onChange={(e) => handleUrlChange(index, 'link', e.target.value)}
													placeholder='https://...'
													style={{ height: '38px', borderRadius: '8px', borderColor: '#ded8d2' }}
												/>
											</div>
											<div className='col-md-1 d-flex justify-content-end'>
												<button
													type='button'
													className='btn btn-icon btn-sm btn-light-danger'
													style={{ width: '38px', height: '38px', borderRadius: '8px' }}
													onClick={() => removeUrl(index)}
													title='Delete URL'>
													<i className='bi bi-trash fs-6'></i>
												</button>
											</div>
										</div>
									</div>
								))
							) : (
								<div className='text-muted fs-8 p-3 bg-light rounded-3 text-center'>
									No external links added. Click "Add URL" to attach links to pull requests, documents, or demos.
								</div>
							)}
						</div>
					</Form>
				</div>
			</div>
		</>
	)
}
