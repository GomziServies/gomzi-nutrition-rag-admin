import React, { useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetDailyReporting } from '../../../Functions/FGGroup/DailyTaskReporting'

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

export function DailyReportView() {
	const [dailyReport, setDailyReport] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const location = useLocation()
	const navigate = useNavigate()
	const queryParams = new URLSearchParams(location.search)
	const reportId = queryParams.get('id')

	const fetchDailyReportDetails = async () => {
		try {
			if (!reportId) return
			const employeeData = getStoredEmployee()
			const response = await GetDailyReporting({
				admin_id: employeeData._id,
				daily_reporting_id: reportId,
			})
			if (response.data && response.data.length > 0) {
				setDailyReport(response.data[0])
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
			<>
				<PageTitle breadcrumbs={[]}>Daily Report Details</PageTitle>

				{/* Skeleton Header Card */}
				<div className='card shadow-sm border-0 mb-6' style={{ borderRadius: '14px', background: '#ffffff' }}>
					<div className='card-body p-5 d-flex flex-wrap align-items-center justify-content-between gap-3'>
						<div className='d-flex align-items-center gap-3'>
							<div
								className='gz-skeleton rounded-3'
								style={{ width: '46px', height: '46px' }}
							/>
							<div>
								<div className='gz-skeleton mb-2' style={{ width: '180px', height: '22px', borderRadius: '4px' }} />
								<div className='gz-skeleton' style={{ width: '280px', height: '14px', borderRadius: '4px' }} />
							</div>
						</div>

						<div className='gz-skeleton' style={{ width: '82px', height: '36px', borderRadius: '8px' }} />
					</div>
				</div>

				{/* Skeleton Main Details Card */}
				<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
					<div className='card-body p-7'>
						{/* Top Inputs: Task Title & Created Date */}
						<div className='row g-5 mb-6'>
							<div className='col-12 col-md-6'>
								<div className='gz-skeleton mb-2' style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
								<div className='gz-skeleton w-100' style={{ height: '44px', borderRadius: '8px' }} />
							</div>
							<div className='col-12 col-md-6'>
								<div className='gz-skeleton mb-2' style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
								<div className='gz-skeleton w-100' style={{ height: '44px', borderRadius: '8px' }} />
							</div>
						</div>

						{/* Remarks Textarea Box */}
						<div className='mb-6'>
							<div className='gz-skeleton mb-2' style={{ width: '70px', height: '14px', borderRadius: '4px' }} />
							<div className='gz-skeleton w-100' style={{ height: '140px', borderRadius: '8px' }} />
						</div>

						{/* Attachments Section */}
						<div className='mb-6'>
							<div className='gz-skeleton mb-3' style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
							<div className='d-flex flex-wrap gap-4'>
								<div className='gz-skeleton' style={{ width: '160px', height: '140px', borderRadius: '8px' }} />
								<div className='gz-skeleton' style={{ width: '160px', height: '140px', borderRadius: '8px' }} />
								<div className='gz-skeleton' style={{ width: '160px', height: '140px', borderRadius: '8px' }} />
							</div>
						</div>

						{/* Bottom Actions */}
						<div className='d-flex justify-content-end mt-8 pt-4 border-top border-gray-200'>
							<div className='gz-skeleton' style={{ width: '180px', height: '38px', borderRadius: '8px' }} />
						</div>
					</div>
				</div>
			</>
		)
	}

	if (!dailyReport) {
		return (
			<>
				<PageTitle breadcrumbs={[]}>Daily Report Details</PageTitle>
				<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
					<div className='card-body p-12 text-center'>
						<div
							className='rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4'
							style={{ width: '64px', height: '64px', backgroundColor: '#eff6ff' }}>
							<i className='bi bi-file-earmark-x fs-1 text-primary'></i>
						</div>
						<h4 className='fw-bold text-gray-900 mb-2'>Report Not Found</h4>
						<p className='text-muted fs-7 mb-6'>
							The requested daily activity report could not be found or may have been removed.
						</p>
						<button
							type='button'
							onClick={() => navigate('/employee/daily-report')}
							className='btn btn-primary btn-sm rounded-pill px-5 py-2.5 fw-semibold'>
							<i className='bi bi-arrow-left me-2'></i>
							Back to Daily Reports
						</button>
					</div>
				</div>
			</>
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

	const extractUrls = () => {
		const urlData = dailyReport.url

		if (!urlData) return []

		if (Array.isArray(urlData) && urlData.length > 0 && Array.isArray(urlData[0])) {
			return urlData[0]
		}

		if (Array.isArray(urlData)) {
			return urlData
		}

		if (typeof urlData === 'object' && !Array.isArray(urlData)) {
			return []
		}

		return []
	}

	const urlsToShow = extractUrls()

	return (
		<>
			<PageTitle breadcrumbs={[]}>Daily Report Details</PageTitle>

			{/* Header Card */}
			<div className='card shadow-sm border-0 mb-6' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-body p-5 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='rounded-3 d-flex align-items-center justify-content-center'
							style={{
								width: '46px',
								height: '46px',
								backgroundColor: '#eff6ff',
								color: '#2563eb',
							}}>
							<i className='bi bi-card-checklist fs-2 text-primary'></i>
						</div>
						<div>
							<h3 className='fw-bold text-gray-900 fs-3 mb-1'>Daily Report Details</h3>
							<span className='text-muted fs-7'>
								Daily task submission details and report files
							</span>
						</div>
					</div>

					<button
						type='button'
						onClick={() => navigate('/employee/daily-report')}
						className='btn btn-sm d-flex align-items-center gap-2 px-4 py-2 fw-semibold'
						style={{
							borderRadius: '8px',
							border: '1px solid #ded8d2',
							backgroundColor: '#ffffff',
							color: '#374151',
						}}>
						<i className='bi bi-arrow-left fs-6'></i>
						<span>Back</span>
					</button>
				</div>
			</div>

			{/* Main Details Card */}
			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-body p-7'>
					{/* Top Inputs: Task Title & Created Date */}
					<div className='row g-5 mb-6'>
						<div className='col-12 col-md-6'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-2'>Task Title</label>
							<input
								type='text'
								readOnly
								className='form-control'
								value={dailyReport.task_title || 'N/A'}
								style={{
									borderRadius: '8px',
									height: '44px',
									border: '1px solid #ded8d2',
									backgroundColor: '#ffffff',
									color: '#111827',
									fontWeight: 600,
								}}
							/>
						</div>
						<div className='col-12 col-md-6'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-2'>Created Date</label>
							<input
								type='text'
								readOnly
								className='form-control'
								value={dailyReport?.createdAt ? DayJS(dailyReport.createdAt).format('DD/MM/YYYY') : 'N/A'}
								style={{
									borderRadius: '8px',
									height: '44px',
									border: '1px solid #ded8d2',
									backgroundColor: '#ffffff',
									color: '#111827',
									fontWeight: 600,
								}}
							/>
						</div>
					</div>

					{/* Remarks Textarea Box */}
					<div className='mb-6'>
						<label className='form-label fw-bold text-gray-800 fs-7 mb-2'>Remarks</label>
						<textarea
							readOnly
							rows={6}
							className='form-control'
							value={dailyReport?.remarks || 'No detailed remarks provided.'}
							style={{
								borderRadius: '8px',
								border: '1px solid #ded8d2',
								backgroundColor: '#ffffff',
								color: '#374151',
								lineHeight: 1.6,
								fontSize: '14px',
								whiteSpace: 'pre-wrap',
							}}
						/>
					</div>

					{/* Attachments Section */}
					<div className='mb-6'>
						<label className='form-label fw-bold text-gray-800 fs-7 mb-3 d-block'>Attachments</label>
						{dailyReport.file_url &&
						Array.isArray(dailyReport.file_url) &&
						dailyReport.file_url.filter(Boolean).length > 0 ? (
							<div className='d-flex flex-wrap gap-4'>
								{dailyReport.file_url.filter(Boolean).map((file: string, index: number) => {
									const isExcelFile =
										file.toLowerCase().match(/\.(xlsx|xls|csv)$/) ||
										file.toLowerCase().includes('spreadsheetml.sheet') ||
										file.toLowerCase().includes('ms-excel')
									const isPdfFile = file.toLowerCase().endsWith('.pdf')
									const isImageFile = file.toLowerCase().match(/\.(jpg|jpeg|png|gif|svg)$/)
									const isWordFile = file.toLowerCase().match(/\.(doc|docx)$/)

									return (
										<div key={`file-${index}`}>
											{isImageFile ? (
												<div
													className='rounded-3 overflow-hidden border cursor-pointer position-relative'
													style={{ width: '160px', height: '140px', borderColor: '#ded8d2' }}
													onClick={() => ShowDocument(file)}>
													<img
														src={`https://files.fggroup.in/${file}`}
														alt={`Attachment ${index + 1}`}
														style={{ width: '100%', height: '100%', objectFit: 'cover' }}
													/>
												</div>
											) : isPdfFile ? (
												<div
													className='d-flex flex-column align-items-center justify-content-center cursor-pointer p-4 border rounded-3 bg-light-warning'
													style={{ width: '160px', height: '140px', borderColor: '#ded8d2' }}
													onClick={() => DownloadDocument(file)}>
													<i className='fas fa-file-pdf text-warning fs-1 mb-2'></i>
													<span
														className='text-warning fw-bold fs-8 text-center text-truncate w-100'
														title={file.split('/').pop()}>
														{file.split('/').pop()}
													</span>
												</div>
											) : isExcelFile ? (
												<div
													className='d-flex flex-column align-items-center justify-content-center cursor-pointer p-4 border rounded-3 bg-light-success'
													style={{ width: '160px', height: '140px', borderColor: '#ded8d2' }}
													onClick={() => DownloadDocument(file)}>
													<i className='fas fa-file-excel text-success fs-1 mb-2'></i>
													<span
														className='text-success fw-bold fs-8 text-center text-truncate w-100'
														title={file.split('/').pop()}>
														{file.split('/').pop()}
													</span>
												</div>
											) : isWordFile ? (
												<div
													className='d-flex flex-column align-items-center justify-content-center cursor-pointer p-4 border rounded-3 bg-light-primary'
													style={{ width: '160px', height: '140px', borderColor: '#ded8d2' }}
													onClick={() => ShowDocument(file)}>
													<i className='fas fa-file-word text-primary fs-1 mb-2'></i>
													<span
														className='text-primary fw-bold fs-8 text-center text-truncate w-100'
														title={file.split('/').pop()}>
														{file.split('/').pop()}
													</span>
												</div>
											) : (
												<div
													className='d-flex flex-column align-items-center justify-content-center cursor-pointer p-4 border rounded-3 bg-light'
													style={{ width: '160px', height: '140px', borderColor: '#ded8d2' }}
													onClick={() => ShowDocument(file)}>
													<i className='fas fa-file text-secondary fs-1 mb-2'></i>
													<span
														className='text-secondary fw-bold fs-8 text-center text-truncate w-100'
														title={file.split('/').pop()}>
														{file.split('/').pop()}
													</span>
												</div>
											)}
										</div>
									)
								})}
							</div>
						) : (
							<span className='text-muted fs-7'>No attachments submitted.</span>
						)}
					</div>

					{/* URLs Section (if any) */}
					{urlsToShow && urlsToShow.length > 0 && (
						<div className='mb-6'>
							<label className='form-label fw-bold text-gray-800 fs-7 mb-3 d-block'>
								Referenced Links &amp; URLs
							</label>
							<div className='d-flex flex-column gap-2'>
								{urlsToShow.map((urlItem: { url_type: string; link: string }, index: number) => (
									<div
										key={`url-${index}`}
										className='p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between'>
										<div className='d-flex align-items-center gap-2 text-truncate me-3'>
											<span className='badge bg-light text-dark border fs-9 fw-bold'>
												{urlItem.url_type || 'URL'}
											</span>
											<a
												href={urlItem.link}
												target='_blank'
												rel='noopener noreferrer'
												className='text-primary fw-semibold fs-7 text-truncate'>
												{urlItem.link}
											</a>
										</div>
										<button
											type='button'
											className='btn btn-icon btn-sm btn-light-primary flex-shrink-0'
											style={{ width: '32px', height: '32px', borderRadius: '8px' }}
											onClick={() => window.open(urlItem.link, '_blank')}
											title='Open Link'>
											<i className='bi bi-box-arrow-up-right'></i>
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Bottom Actions */}
					<div className='d-flex justify-content-end mt-8 pt-4 border-top border-gray-200'>
						<button
							type='button'
							onClick={() => navigate('/employee/daily-report')}
							className='btn btn-sm d-flex align-items-center gap-2 px-5 py-2.5 fw-semibold'
							style={{
								borderRadius: '8px',
								border: '1px solid #ded8d2',
								backgroundColor: '#ffffff',
								color: '#374151',
							}}>
							<i className='bi bi-arrow-left fs-6'></i>
							<span>Back to Daily Reports</span>
						</button>
					</div>
				</div>
			</div>
		</>
	)
}
