import React, { useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
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
			const employeeData = JSON.parse(localStorage.getItem('fg_group_info') || '{}')
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

				// Ensure urls is always an array
				let urlData = []
				if (Array.isArray(report.url)) {
					// Handle case where report.url is an array of arrays
					if (report.url.length > 0 && Array.isArray(report.url[0])) {
						urlData = report.url[0]
					} else {
						// Handle case where report.url is a flat array
						urlData = report.url
					}
				} else if (report.url && typeof report.url === 'object' && !Array.isArray(report.url)) {
					// Handle case where report.url is an object
					urlData = []
				}

				// Ensure urlData is an array of objects with url_type and link properties
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
		return <div>Loading...</div>
	}

	if (!dailyReport) {
		return <div>Report not found</div>
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

		// Update the file input
		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
		if (fileInput) {
			const dt = new DataTransfer()
			updatedFiles.forEach((file) => dt.items.add(file))
			fileInput.files = dt.files
		}
	}

	// Add functions for URL management
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

	// Function to convert absolute URLs to relative paths
	const convertToRelativeUrl = (url: string): string => {
		try {
			// If it's already a relative URL, return as is
			if (!url.startsWith('http://') && !url.startsWith('https://')) {
				return url
			}

			// Convert absolute URL to relative by removing domain
			const urlObj = new URL(url)
			return urlObj.pathname + urlObj.search + urlObj.hash
		} catch (error) {
			// If URL parsing fails, return the original
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
			toast.error('Please enter task title')
			return
		}

		setSubmitLoading(true)
		try {
			let newFileUrls: string[] = []
			if (newFiles.length > 0) {
				const response: any = await FileUploadToFGGroup(newFiles, {
					directory: 'files',
				})
				if (response.data?.fileURLs && Array.isArray(response.data.fileURLs)) {
					newFileUrls = response.data.fileURLs
				}
				toast.success('Files uploaded successfully')
			}

			// Combine existing files that weren't removed with new files
			const allFileUrls = [...existingFiles, ...newFileUrls]

			const employeeData = JSON.parse(localStorage.getItem('fg_group_info') || '{}')

			// Process URLs to ensure they are relative
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
			<PageTitle breadcrumbs={[]}>Daily Report Details</PageTitle>
			<KTCard>
				<div className='card-body'>
					<div className='row mb-4'>
						<div className='col-md-12'>
							<div className='row'>
								<div className='col-md-6'>
									<Form.Group className='mb-3'>
										<Form.Label>Task Title</Form.Label>
										<Form.Control
											type='text'
											value={taskTitle}
											onChange={(e) => setTaskTitle(e.target.value)}
											className='form-control'
											placeholder='Enter task title'
										/>
									</Form.Group>
								</div>
								<div className='col-md-6'>
									<Form.Group className='mb-3'>
										<Form.Label>Created Date</Form.Label>
										<Form.Control
											type='text'
											value={DayJS(dailyReport?.createdAt).format('DD/MM/YYYY')}
											className='inputfield-bg'
											readOnly
										/>
									</Form.Group>
								</div>
							</div>
						</div>

						<div className='col-md-12'>
							<Form.Group className='mb-3'>
								<Form.Label>Remarks</Form.Label>
								<Form.Control
									as='textarea'
									rows={3}
									value={remarks}
									onChange={(e) => setRemarks(e.target.value)}
									placeholder='Enter remarks'
								/>
							</Form.Group>
						</div>

						{/* File Upload Section */}
						<div className='col-md-12'>
							<div className='mb-4'>
								<h4 className='mb-3'>Upload Files</h4>
								<Form.Group>
									<Form.Control
										type='file'
										onChange={handleFileChange}
										multiple
										className='mb-2'
									/>
									<small className='text-muted d-block mb-3'>
										Upload only <strong>images (jpg, png)</strong> or <strong>PDF files</strong>
									</small>

									{/* Display new files selected for upload */}
									{newFiles.length > 0 && (
										<div className='mb-3'>
											<h6>New Files to Upload:</h6>
											<div className='d-flex flex-wrap gap-3'>
												{newFiles.map((file, index) => {
													const fileName = file.name
													const isExcelFile = fileName.toLowerCase().match(/\.(xlsx|xls|csv)$/)
													const isPdfFile = fileName.toLowerCase().endsWith('.pdf')
													const isImageFile = fileName
														.toLowerCase()
														.match(/\.(jpg|jpeg|png|gif|svg)$/)
													const isWordFile = fileName.toLowerCase().match(/\.(doc|docx)$/)

													const removeBtn = (
														<button
															type='button'
															className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle'
															onClick={() => removeNewFile(index)}
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
																		alt={`New File ${index + 1}`}
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
							</div>
						</div>

						{/* Existing Files Section */}
						{existingFiles.length > 0 && (
							<div className='col-md-12'>
								<div className='mb-4'>
									<h4 className='mb-3'>Existing Files</h4>
									<div className='d-flex flex-wrap gap-3'>
										{existingFiles.map((file, index) => {
											const isExcelFile =
												file.toLowerCase().match(/\.(xlsx|xls|csv)$/) ||
												file.toLowerCase().includes('spreadsheetml.sheet') ||
												file.toLowerCase().includes('ms-excel')
											const isPdfFile = file.toLowerCase().endsWith('.pdf')
											const isImageFile = file.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg)$/)
											const isWordFile = file.toLowerCase().match(/\.(doc|docx)$/)

											const removeBtn = (
												<button
													type='button'
													className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle'
													onClick={(e) => {
														e.stopPropagation()
														removeExistingFile(index)
													}}
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
															className='position-relative d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-warning bg-light-warning'
															style={{ width: '150px' }}
															onClick={() => DownloadDocument(file)}>
															{removeBtn}
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
													) : isExcelFile ? (
														<div
															className='position-relative d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-success bg-light-success'
															style={{ width: '150px' }}
															onClick={() => DownloadDocument(file)}>
															{removeBtn}
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
													) : isImageFile ? (
														<div
															className='position-relative text-center'
															style={{ width: '150px', height: '150px' }}>
															{removeBtn}
															<img
																src={`https://files.fggroup.in/${file}`}
																alt={`File ${index + 1}`}
																style={{ width: '150px', height: '150px', objectFit: 'cover' }}
																className='cursor-pointer rounded'
																onClick={() => ShowDocument(file)}
															/>
														</div>
													) : isWordFile ? (
														<div
															className='position-relative d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-primary bg-light-primary'
															style={{ width: '150px' }}
															onClick={() => ShowDocument(file)}>
															{removeBtn}
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
													) : (
														<div
															className='position-relative d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-secondary bg-light'
															style={{ width: '150px' }}
															onClick={() => ShowDocument(file)}>
															{removeBtn}
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
													)}
												</div>
											)
										})}
									</div>
								</div>
							</div>
						)}

						{/* URLs Section */}
						<div className='col-md-12'>
							<div className='mb-4'>
								<div className='d-flex justify-content-between align-items-center mb-3'>
									<h4 className='mb-0'>URLs</h4>
									<Button
										variant='success'
										size='sm'
										onClick={addNewUrl}>
										<i className='fas fa-plus me-2'></i>Add URL
									</Button>
								</div>
								{Array.isArray(urls) &&
									urls.map((url, index) => (
										<div
											key={index}
											className='mb-3 border rounded p-3'>
											<div className='mb-2'>
												<Form.Label>URL Type</Form.Label>
												<div className='d-flex gap-2'>
													<Form.Control
														type='text'
														value={url.url_type}
														onChange={(e) => handleUrlChange(index, 'url_type', e.target.value)}
														placeholder='e.g., Reference, Design'
													/>
													<Button
														variant='danger'
														onClick={() => removeUrl(index)}>
														<i className='fas fa-times'></i>
													</Button>
												</div>
											</div>
											<Form.Group>
												<Form.Label>URL</Form.Label>
												<Form.Control
													type='url'
													value={url.link}
													onChange={(e) => handleUrlChange(index, 'link', e.target.value)}
													placeholder='https://example.com'
												/>
											</Form.Group>
										</div>
									))}
							</div>
						</div>
					</div>

					{/* Update and Cancel Buttons */}
					<div className='row mt-4'>
						<div className='col-12 d-flex justify-content-end gap-2'>
							<Button
								variant='secondary'
								onClick={() => navigate('/employee/daily-report')}>
								Cancel
							</Button>
							<Button
								variant='primary'
								onClick={handleSubmit}
								disabled={submitLoading}>
								{submitLoading ? 'Updating...' : 'Update Report'}
							</Button>
						</div>
					</div>
				</div>
			</KTCard>
		</>
	)
}
