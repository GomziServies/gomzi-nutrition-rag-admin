import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { errorToast } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetFgiitFollowUpReport } from '../../../Functions/FGGroup/FgiitFollowUpReport'
import { getCallLogs } from '../../../Functions/FGGroup/IVR'

export function CallerDeskAdmissionView() {
	const [searchParams] = useSearchParams()
	const id = searchParams.get('id')
	const navigate = useNavigate()

	const [loading, setLoading] = useState(true)
	const [reportData, setReportData] = useState<any>(null)
	const [latestPitch, setLatestPitch] = useState<any>(null)
	const [latestAdmission, setLatestAdmission] = useState<any>(null)
	const [recordings, setRecordings] = useState<any[]>([])

	useEffect(() => {
		if (id) {
			fetchData()
		} else {
			errorToast('No Report ID provided')
			navigate(-1)
		}
	}, [id])

	const fetchData = async () => {
		setLoading(true)
		try {
			const res: any = await GetFgiitFollowUpReport({ id: id as string })
			const data = Array.isArray(res?.data?.data)
				? res.data.data
				: Array.isArray(res?.data)
				? res.data
				: []

			if (data.length > 0) {
				const report = data[0]
				setReportData(report)

				// Extract the latest pitch report and admission form from call history
				const history = report.callHistory || []

				// Find latest admission
				const admissionHistory = history.filter(
					(h: any) => h.admissionForm && h.admissionForm.firstName && !h.admissionForm.is_skipped
				)
				if (admissionHistory.length > 0) {
					setLatestAdmission(admissionHistory[admissionHistory.length - 1].admissionForm)
				}

				// Aggregate documents from entire history
				const allDocs: any = {
					photo: '',
					aadhaarCardFront: '',
					aadhaarCardBack: '',
					marksheet: '',
				}

				history.forEach((h: any) => {
					if (h.admissionForm) {
						if (!allDocs.photo) allDocs.photo = h.admissionForm.photo || ''
						if (!allDocs.aadhaarCardFront) allDocs.aadhaarCardFront = h.admissionForm.aadhaarCardFront || ''
						if (!allDocs.aadhaarCardBack) allDocs.aadhaarCardBack = h.admissionForm.aadhaarCardBack || ''
						if (!allDocs.marksheet) allDocs.marksheet = h.admissionForm.marksheet || ''
					}
				})
				setReportData((prev: any) => ({ ...prev, admission: allDocs }))

				// Find latest pitch report
				const pitchHistory = history.filter((h: any) => h.pitchReport)
				if (pitchHistory.length > 0) {
					setLatestPitch(pitchHistory[pitchHistory.length - 1].pitchReport)
				}

				// Fetch IVR recordings
				const mobileNumber = report.personalDetails?.mobile || report.callHistory?.[0]?.mobile
				if (mobileNumber) {
					try {
						const logsRes: any = await getCallLogs({ search: mobileNumber, limit: 100 })
						let logsList = Array.isArray(logsRes?.data?.data)
							? logsRes.data.data
							: Array.isArray(logsRes?.data)
							? logsRes.data
							: []
						const logsWithUrl = logsList.filter(
							(log: any) => log.recording_url || log.original_recording_url || log.file
						)
						setRecordings(logsWithUrl)
					} catch (e) {
						console.error('Failed to fetch IVR recordings', e)
					}
				}
			} else {
				errorToast('Report not found')
				navigate(-1)
			}
		} catch (err) {
			console.error(err)
			errorToast('Failed to fetch report details')
			navigate(-1)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className='d-flex justify-content-center align-items-center h-100'>
				<div
					className='spinner-border text-primary'
					role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		)
	}

	if (!reportData) return null

	return (
		<>
			<PageTitle breadcrumbs={[]}>View Admission Details</PageTitle>

			<div className='row g-5 g-xl-8'>
				{/* Admission Form */}
				<div className='col-12'>
					<KTCard className='card-flush h-md-100'>
						<div className='card-header'>
							<div className='card-title'>
								<h2>Admission Form</h2>
							</div>
						</div>
						<div className='card-body pt-1'>
							<div className='row mt-5'>
								<div className='col-lg-12 d-flex align-items-center mb-5'>
									<i className='bi bi-info-circle text-muted me-2'></i>
									<h6
										className='text-gray-500 text-uppercase mb-0 fs-7 fw-bolder'
										style={{ letterSpacing: '0.5px' }}>
										Personal & Academic
									</h6>
								</div>

								<div className='col-md-6 mb-5'>
									<label className='form-label fw-bold'>First Name</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.firstName || ''}
										disabled
									/>
								</div>
								<div className='col-md-6 mb-5'>
									<label className='form-label fw-bold'>Last Name</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.lastName || ''}
										disabled
									/>
								</div>

								<div className='col-md-4 mb-5'>
									<label className='form-label fw-bold'>Country</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.country || latestAdmission?.address?.country || ''}
										disabled
									/>
								</div>
								<div className='col-md-4 mb-5'>
									<label className='form-label fw-bold'>State</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.state || latestAdmission?.address?.state || ''}
										disabled
									/>
								</div>
								<div className='col-md-4 mb-5'>
									<label className='form-label fw-bold'>City</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.city || latestAdmission?.address?.city || ''}
										disabled
									/>
								</div>

								<div className='col-md-8 mb-5'>
									<label className='form-label fw-bold'>Address</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={
											latestAdmission?.address?.address_line_1 || latestAdmission?.address || ''
										}
										disabled
									/>
								</div>
								<div className='col-md-4 mb-5'>
									<label className='form-label fw-bold'>Pin Code</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.pinCode || latestAdmission?.address?.pin_code || ''}
										disabled
									/>
								</div>

								<div className='col-md-6 mb-5'>
									<label className='form-label fw-bold'>Phone Number</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.phone || ''}
										disabled
									/>
								</div>
								<div className='col-md-6 mb-5'>
									<label className='form-label fw-bold'>Email ID</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.email || ''}
										disabled
									/>
								</div>

								<div className='col-md-6 mb-5'>
									<label className='form-label fw-bold'>Date of Birth</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={
											latestAdmission?.dateOfBirth
												? new Date(latestAdmission.dateOfBirth).toLocaleDateString()
												: ''
										}
										disabled
									/>
								</div>
								<div className='col-md-6 mb-5'>
									<label className='form-label fw-bold'>Age</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.age || ''}
										disabled
									/>
								</div>

								<div className='col-md-6 mb-5'>
									<label className='form-label fw-bold'>Course</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.course || ''}
										disabled
									/>
								</div>
								<div className='col-md-6 mb-5'>
									<label className='form-label fw-bold'>Reference</label>
									<input
										type='text'
										className='form-control form-control-solid'
										value={latestAdmission?.reference || ''}
										disabled
									/>
								</div>
							</div>
						</div>

						{/* Documents Section */}
						<div className='card-body border-top pt-5'>
							<div className='row mt-2'>
								<div className='col-lg-12 d-flex align-items-center mb-5'>
									<i className='bi bi-file-earmark-text text-muted me-2'></i>
									<h6
										className='text-gray-500 text-uppercase mb-0 fs-7 fw-bolder'
										style={{ letterSpacing: '0.5px' }}>
										Documents
									</h6>
								</div>

								{(() => {
									const docSource = latestAdmission || reportData?.admission || reportData
									const docs = [
										{ label: 'Photo', url: docSource?.photo },
										{ label: 'Aadhaar Card Front', url: docSource?.aadhaarCardFront },
										{ label: 'Aadhaar Card Back', url: docSource?.aadhaarCardBack },
										{ label: 'Marksheet', url: docSource?.marksheet },
									].filter((doc) => doc.url)

									if (docs.length === 0) {
										return (
											<div className='col-12'>
												<div className='text-muted fs-6'>No documents have been uploaded.</div>
											</div>
										)
									}

									return docs.map((doc, idx) => (
										<div
											key={idx}
											className='col-md-3 col-6 mb-5'>
											<div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
												<div className='d-flex align-items-center'>
													<i className='bi bi-image fs-3 text-primary me-2'></i>
													<div className='fs-6 fw-bold text-gray-700'>{doc.label}</div>
												</div>
												<div className='fw-semibold text-gray-500 mt-3'>
													<a
														href={doc.url}
														target='_blank'
														rel='noreferrer'
														className='d-block border rounded bg-light text-center p-2'
														style={{ height: '100px', overflow: 'hidden' }}>
														{doc.url.toLowerCase().endsWith('.pdf') ? (
															<div className='d-flex flex-column align-items-center justify-content-center h-100'>
																<i className='bi bi-file-earmark-pdf text-danger fs-1 mb-2'></i>
																<span className='text-primary fw-bold text-hover-primary fs-8'>
																	View PDF
																</span>
															</div>
														) : (
															<img
																src={doc.url}
																alt={doc.label}
																className='img-fluid h-100'
																style={{ objectFit: 'contain' }}
															/>
														)}
													</a>
												</div>
											</div>
										</div>
									))
								})()}
							</div>
						</div>
					</KTCard>
				</div>

				{/* Call Recordings */}
				{recordings.length > 0 && (
					<div className='col-12 mt-8'>
						<style>{`
                            .recording-table thead th {
                                padding-top: 0.75rem !important;
                                padding-bottom: 0.75rem !important;
                                letter-spacing: 0.03rem;
                                font-size: 1.1rem !important;
                                font-weight: 600 !important;
                                color: #A1A5B7 !important;
                            }
                            .recording-table thead tr {
                                border-radius: 0.625rem;
                                overflow: hidden;
                            }
                            .recording-table thead th:first-child {
                                border-top-left-radius: 0.625rem;
                                border-bottom-left-radius: 0.625rem;
                            }
                            .recording-table thead th:last-child {
                                border-top-right-radius: 0.625rem;
                                border-bottom-right-radius: 0.625rem;
                            }
                            .recording-table tbody td {
                                padding-top: 1.25rem !important;
                                padding-bottom: 1.25rem !important;
                            }
                            .audio-player-custom {
                                height: 32px;
                                width: 350px;
                                border-radius: 30px;
                                background: #f1f3f9;
                            }
                        `}</style>
						<div className='card mb-8 shadow-sm border-0'>
							<div className='card-header border-0 pt-6'>
								<h3 className='card-title align-items-start flex-column'>
									<span className='card-label fw-bold text-gray-900'>Call Recordings</span>
									<span className='text-muted mt-1 fw-semibold fs-7'>Recordings for this lead</span>
								</h3>
							</div>
							<div className='card-body p-0'>
								<div className='table-responsive'>
									<table className='table table-flush align-middle table-row-bordered table-row-gray-200 gs-9 gy-6 mb-0 recording-table'>
										<thead>
											<tr className='bg-light fw-bold text-muted fs-2'>
												<th className='min-w-50px ps-9'>No.</th>
												<th className='min-w-50px'>Dir.</th>
												<th className='min-w-150px'>Date & Time</th>
												<th className='min-w-125px'>Agent Name</th>
												<th className='min-w-125px'>Status</th>
												<th className='min-w-100px'>Duration</th>
												<th className='min-w-250px text-center pe-9'>Recording Player</th>
											</tr>
										</thead>
										<tbody>
											{recordings.map((log: any, idx: number) => {
												const url = log.recording_url || log.original_recording_url || log.file
												return (
													<tr
														key={idx}
														className='hover-elevate-up'>
														<td className='ps-9'>
															<span className='fw-bold text-gray-600'>{idx + 1}</span>
														</td>
														<td>
															{log.direction === 'WEBOBD' ? (
																<span
																	className='badge badge-light-primary btn-icon btn-sm w-30px h-30px rounded-circle'
																	title='Outgoing'>
																	<i className='bi bi-telephone-outbound fs-6'></i>
																</span>
															) : (
																<span
																	className='badge badge-light-success btn-icon btn-sm w-30px h-30px rounded-circle'
																	title='Incoming'>
																	<i className='bi bi-telephone-inbound fs-6'></i>
																</span>
															)}
														</td>
														<td>
															<div className='d-flex flex-column'>
																<span className='text-gray-900 fw-bold fs-6'>
																	{log.createdAt
																		? new Date(log.createdAt).toLocaleDateString('en-IN', {
																				day: '2-digit',
																				month: 'short',
																				year: 'numeric',
																		  })
																		: ''}
																</span>
																<span className='text-muted fw-semibold fs-7 mt-1'>
																	<i className='bi bi-clock me-1'></i>
																	{log.createdAt
																		? new Date(log.createdAt).toLocaleTimeString('en-IN', {
																				hour: '2-digit',
																				minute: '2-digit',
																				hour12: true,
																		  })
																		: ''}
																</span>
															</div>
														</td>
														<td>
															<span className='text-gray-700 fw-bold fs-6'>
																{log.raw_payload?.receiver_name || '-'}
															</span>
														</td>
														<td>
															<span
																className={`badge badge-light-${
																	log.status?.toLowerCase() === 'answered' ||
																	log.status === 'ANSWER'
																		? 'success'
																		: 'danger'
																} rounded-pill px-4 py-3 fw-bold`}>
																{log.status === 'ANSWER' ? 'Answered' : log.status || '—'}
															</span>
														</td>
														<td>
															<span className='text-gray-700 fw-bold fs-6'>
																{log.raw_payload?.CallDuration
																	? `${log.raw_payload.CallDuration}s`
																	: 'N/A'}
															</span>
														</td>
														<td className='text-center pe-9'>
															{url ? (
																<div className='d-inline-block p-1 bg-light rounded-pill'>
																	<audio
																		controls
																		className='audio-player-custom'
																		onPlay={(e) => {
																			const audios = document.getElementsByTagName('audio')
																			for (let i = 0; i < audios.length; i++) {
																				if (audios[i] !== e.currentTarget) {
																					audios[i].pause()
																				}
																			}
																		}}>
																		<source src={url} />
																	</audio>
																</div>
															) : (
																<span className='text-muted'>No Recording</span>
															)}
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	)
}