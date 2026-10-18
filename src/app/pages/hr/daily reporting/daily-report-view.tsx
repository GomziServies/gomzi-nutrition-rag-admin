import React, { useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetDailyReporting } from '../../../Functions/FGGroup/DailyTaskReporting'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'

export function DailyReportView() {
	const [dailyReport, setDailyReport] = useState<any>(null)
	const [employeeName, setEmployeeName] = useState<string>('')
	const [loading, setLoading] = useState(true)
	const location = useLocation()
	const navigate = useNavigate()
	const queryParams = new URLSearchParams(location.search)
	const reportId = queryParams.get('id')
	const employeeId = queryParams.get('employeeId')

	const fetchDailyReportDetails = async () => {
		try {
			if (!reportId) return
			// Use employeeId from URL params instead of localStorage
			const response = await GetDailyReporting({
				admin_id: employeeId || undefined,
				daily_reporting_id: reportId,
			})
			if (response.data && response.data.length > 0) {
				setDailyReport(response.data[0])
				// Fetch employee name
				await fetchEmployeeName(response.data[0].admin_id)
			}
		} catch (error) {
			console.error('Error fetching daily report details:', error)
			toast.error('Error fetching report details')
		} finally {
			setLoading(false)
		}
	}

	const fetchEmployeeName = async (adminId: string) => {
		try {
			const response = await GetEmployees({ id: adminId })
			if (response.data && response.data.length > 0) {
				setEmployeeName(response.data[0].full_name)
			}
		} catch (error) {
			console.error('Error fetching employee details:', error)
		}
	}

	useEffect(() => {
		fetchDailyReportDetails()
	}, [reportId, employeeId])

	if (loading) {
		return (
			<div className='d-flex flex-column align-items-center justify-content-center py-20'>
				<div
					className='spinner-border text-primary mb-3'
					role='status'
					style={{ width: '3rem', height: '3rem' }}>
					<span className='visually-hidden'>Loading...</span>
				</div>
				<span className='text-gray-700 fw-bold fs-6'>Loading report details...</span>
			</div>
		)
	}

	if (!dailyReport) {
		return (
			<div className='card shadow-sm border-0 p-10 text-center my-6' style={{ borderRadius: '16px' }}>
				<i className='bi bi-exclamation-triangle text-warning fs-2x mb-3'></i>
				<h4 className='fw-bold text-gray-800'>Daily Report Not Found</h4>
				<p className='text-muted fs-7'>
					The requested report could not be located or may have been removed.
				</p>
				<div>
					<button
						type='button'
						onClick={() => navigate('/hr/daily-report')}
						className='btn btn-primary btn-sm mt-2'
						style={{ borderRadius: '8px' }}>
						<i className='bi bi-arrow-left me-2'></i>
						Back to Daily Reports
					</button>
				</div>
			</div>
		)
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

	const ShowDocument = (document: string) => {
		const downloadUrl = `https://files.fggroup.in/${document}`
		window.open(downloadUrl)
	}

	// Function to safely extract URLs from different possible data structures
	const extractUrls = () => {
		const urlData = dailyReport.url

		if (!urlData) return []

		// Handle case where urlData is an array of arrays
		if (Array.isArray(urlData) && urlData.length > 0 && Array.isArray(urlData[0])) {
			return urlData[0]
		}

		// Handle case where urlData is a flat array
		if (Array.isArray(urlData)) {
			return urlData
		}

		// Handle case where urlData is an object
		if (typeof urlData === 'object' && !Array.isArray(urlData)) {
			return []
		}

		return []
	}

	const urlsToShow = extractUrls()

	return (
		<>
			<PageTitle breadcrumbs={[]}>Daily Report Details</PageTitle>

			{/* Top Header with Back Button */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex align-items-center gap-3'>
					<button
						type='button'
						onClick={() => navigate('/hr/daily-report')}
						className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-2 px-3 py-2'
						style={{ borderRadius: '8px', fontWeight: 600 }}>
						<i className='bi bi-arrow-left fs-5'></i>
						<span>Back to Daily Reports</span>
					</button>
					<div className='vr h-25px my-auto d-none d-sm-block' style={{ color: '#E4EAF2' }}></div>
					<div>
						<h2 className='fw-bold fs-2 m-0' style={{ color: '#142447' }}>
							Daily Report Details
						</h2>
						<span className='fs-7 fw-semibold' style={{ color: '#71809A' }}>
							Task breakdown, detailed employee remarks, and attached deliverables
						</span>
					</div>
				</div>

				<div className='d-flex align-items-center gap-2'>
					<span className='badge badge-light-primary fw-bold fs-7 px-3 py-2'>
						<i className='bi bi-calendar-event me-1.5 text-primary'></i>
						{DayJS(dailyReport?.createdAt).format('DD MMM YYYY')}
					</span>
				</div>
			</div>

			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-6'>
					<div className='row g-4 mb-4'>
						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-bold text-gray-800 fs-7 mb-1'>
									Employee Name
								</Form.Label>
								<Form.Control
									type='text'
									value={employeeName || 'Unknown Employee'}
									className='form-control form-control-solid'
									style={{ borderRadius: '8px', height: '42px', fontWeight: 600 }}
									readOnly
								/>
							</Form.Group>
						</div>

						<div className='col-md-6'>
							<Form.Group>
								<Form.Label className='fw-bold text-gray-800 fs-7 mb-1'>
									Submission Date & Time
								</Form.Label>
								<Form.Control
									type='text'
									value={DayJS(dailyReport?.createdAt).format('DD/MM/YYYY hh:mm A')}
									className='form-control form-control-solid'
									style={{ borderRadius: '8px', height: '42px' }}
									readOnly
								/>
							</Form.Group>
						</div>

						<div className='col-12'>
							<Form.Group>
								<Form.Label className='fw-bold text-gray-800 fs-7 mb-1'>
									Task Title
								</Form.Label>
								<Form.Control
									type='text'
									value={dailyReport.task_title || '-'}
									className='form-control form-control-solid'
									style={{ borderRadius: '8px', height: '42px', fontWeight: 600 }}
									readOnly
								/>
							</Form.Group>
						</div>

						{/* Expanded Remarks Section */}
						<div className='col-12'>
							<Form.Group>
								<div className='d-flex align-items-center justify-content-between mb-1'>
									<Form.Label className='fw-bold text-gray-800 fs-7 m-0'>
										Detailed Remarks & Activity Log
									</Form.Label>
									<span className='text-muted fs-8'>Full Unabridged Content</span>
								</div>
								<Form.Control
									as='textarea'
									rows={8}
									value={dailyReport?.remarks || 'No remarks provided'}
									style={{
										minHeight: '220px',
										borderRadius: '10px',
										background: '#F8FAFD',
										border: '1px solid #E4EAF2',
										lineHeight: '1.65',
										fontSize: '13.5px',
										color: '#142447',
										padding: '16px',
										resize: 'vertical',
									}}
									readOnly
								/>
							</Form.Group>
						</div>
					</div>

					{/* Report Attachments */}
					{dailyReport.file_url &&
						Array.isArray(dailyReport.file_url) &&
						dailyReport.file_url.filter(Boolean).length > 0 && (
							<div className='row mb-4'>
								<div className='col-md-12'>
									<h4 className='mb-3'>Attachments</h4>
									<div className='d-flex flex-wrap gap-3 justify-content-start'>
										{dailyReport.file_url.filter(Boolean).map((file: string, index: number) => {
											const isExcelFile =
												file.toLowerCase().match(/\.(xlsx|xls|csv)$/) ||
												file.toLowerCase().includes('spreadsheetml.sheet') ||
												file.toLowerCase().includes('ms-excel')
											const isPdfFile = file.toLowerCase().endsWith('.pdf')
											const isImageFile = file.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg)$/)
											const isWordFile = file.toLowerCase().match(/\.(doc|docx)$/)

											return (
												<div
													key={`file-${index}`}
													className='file-preview'>
													{isPdfFile ? (
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
													) : isExcelFile ? (
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
													) : isImageFile ? (
														<div className='text-center'>
															<img
																onClick={() => ShowDocument(file)}
																src={`https://files.fggroup.in/${file}`}
																alt={`File ${index + 1}`}
																style={{ width: '150px', height: '150px', objectFit: 'cover' }}
																className='mb-2 cursor-pointer'
															/>
														</div>
													) : isWordFile ? (
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
													) : (
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
													)}
												</div>
											)
										})}
									</div>
								</div>
							</div>
						)}

					{/* Report URLs */}
					{urlsToShow && urlsToShow.length > 0 && (
						<div className='row mb-4'>
							<div className='col-md-12'>
								<h4 className='mb-3'>Report URLs</h4>
								<div className='list-group'>
									{urlsToShow.map((urlItem: { url_type: string; link: string }, index: number) => (
										<div
											key={`url-${index}`}
											className='list-group-item'>
											<div className='d-flex justify-content-between align-items-center'>
												<div>
													<strong className='me-2'>{urlItem.url_type || 'URL'}:</strong>
													<a
														href={urlItem.link}
														target='_blank'
														rel='noopener noreferrer'
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
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	)
}
