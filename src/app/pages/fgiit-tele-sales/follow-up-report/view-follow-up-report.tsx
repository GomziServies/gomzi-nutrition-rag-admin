import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetFgiitFollowUpReport } from '../../../Functions/FGGroup/FgiitFollowUpReport'

type Address = {
	address_line_1: string
	city: string
	state: string
	country: string
	pin_code: string
}

type PersonalDetails = {
	firstName: string
	gender: string
	email: string
	mobile: string
	age: string
	education: string
	job: string
	financialSituation: string
}

type CourseDetails = {
	course: string
	course_duration: string
	course_amount: string
	final_amount: string
	payment_method: string
	sales_script: string
}

type AdmissionForm = {
	firstName: string
	lastName: string
	address: Address
	phone: string
	email: string
	dateOfBirth: string
	age: string
	course: string
	reference: string
	aadhaarCardFront?: string
	aadhaarCardBack?: string
	marksheet?: string
	photo?: string
}

type PitchReport = {
	telecaller_name: string
	interest_level: 'LOW' | 'MEDIUM' | 'HIGH' | ''
	pitch_follow_up_date: string
	objections: string
	call_recording?: string
}

type CallEntry = {
	_id: string
	callDate: string

	courseDetails?: CourseDetails
	admissionForm?: AdmissionForm
	pitchReport?: PitchReport
}

type ReportData = {
	_id: string
	personalDetails: PersonalDetails
	callHistory: CallEntry[]
	createdAt: string
}

export default function ViewFollowUpReport() {
	const location = useLocation()
	const [loading, setLoading] = useState<boolean>(true)
	const [report, setReport] = useState<ReportData | null>(null)

	const fetchData = async (id: string): Promise<void> => {
		try {
			setLoading(true)
			const response = await GetFgiitFollowUpReport({ id })
			if (response.status === 200 && response.data?.length > 0) {
				setReport(response.data[0])
			} else {
				toast.error(response.message || 'Report not found')
			}
		} catch (error) {
			toast.error('Failed to load report data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search)
		const id = queryParams.get('id')
		if (id) {
			fetchData(id)
		} else {
			setLoading(false)
			toast.error('No Report ID provided')
		}
	}, [location])

	if (loading) {
		return (
			<div
				className='d-flex justify-content-center align-items-center'
				style={{ minHeight: '300px' }}>
				<div
					className='spinner-border text-primary'
					role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		)
	}

	if (!report) {
		return <div className='p-10 text-center fw-bold fs-3 text-muted'>No Report Data Found</div>
	}

	const { personalDetails, callHistory } = report

	const queryParams = new URLSearchParams(location.search)
	const callId = queryParams.get('call_id')

	const activeCall = callId
		? callHistory.find((call) => call._id === callId) || callHistory[callHistory.length - 1]
		: callHistory[callHistory.length - 1]

	const pitch = activeCall?.pitchReport || null

	// Robust fallback for Admission Form and Course Details
	let admission = activeCall?.admissionForm || null
	let course = activeCall?.courseDetails || null

	if (!admission || !admission.firstName) {
		const historyWithAdmission = callHistory.filter(
			(c: any) => c.admissionForm && c.admissionForm.firstName
		)
		if (historyWithAdmission.length > 0) {
			admission = historyWithAdmission[historyWithAdmission.length - 1]?.admissionForm || null
		}
	}

	if (!course || !course.course) {
		const historyWithCourse = callHistory.filter(
			(c: any) => c.courseDetails && c.courseDetails.course
		)
		if (historyWithCourse.length > 0) {
			course = historyWithCourse[historyWithCourse.length - 1]?.courseDetails || null
		}
	}

	// Aggregate documents from entire history
	const documents: any = {
		aadhaarCardFront: admission?.aadhaarCardFront || '',
		aadhaarCardBack: admission?.aadhaarCardBack || '',
		marksheet: admission?.marksheet || '',
		photo: admission?.photo || '',
	}

	// Secondary scan to fill any gaps in documents from other entries
	if (
		!documents.aadhaarCardFront ||
		!documents.aadhaarCardBack ||
		!documents.marksheet ||
		!documents.photo
	) {
		callHistory.forEach((call) => {
			if (call.admissionForm) {
				if (!documents.aadhaarCardFront)
					documents.aadhaarCardFront = call.admissionForm.aadhaarCardFront || ''
				if (!documents.aadhaarCardBack)
					documents.aadhaarCardBack = call.admissionForm.aadhaarCardBack || ''
				if (!documents.marksheet) documents.marksheet = call.admissionForm.marksheet || ''
				if (!documents.photo) documents.photo = call.admissionForm.photo || ''
			}
		})
	}

	const formatDate = (date: any) => {
		if (!date) return 'N/A'
		try {
			return new Date(date).toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
			})
		} catch (e) {
			return 'N/A'
		}
	}

	return (
		<>
			<style>{`
                .section-card {
                    border: none;
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
                    overflow: hidden;
                    margin-bottom: 24px;
                }

                .section-header {
                    background: linear-gradient(135deg, #f8f9fd 0%, #ffffff 100%);
                    border-bottom: 1px solid #eef0f8;
                    padding: 18px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .section-header:hover {
                    background: linear-gradient(135deg, #f0f2fa 0%, #f8f9fd 100%);
                }

                .section-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #181c32;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .section-header .header-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }

                .section-body {
                    padding: 24px;
                }

                .field-group-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #7e8299;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    margin-bottom: 16px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #f1f3f9;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .field-group-title i {
                    font-size: 14px;
                    color: #a1a5b7;
                }

                .divider-line {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #e4e6ef, transparent);
                    margin: 20px 0;
                }

                .remarks-textarea {
                    border: 2px solid #e4e6ef;
                    border-radius: 10px;
                    padding: 14px 16px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #3f4254;
                    background: #bdbdbd12;
                    resize: vertical;
                    min-height: 90px;
                    transition: all 0.2s ease;
                    width: 100%;
                    outline: none;
                }

                .remarks-textarea::placeholder {
                    color: #b5b5c3;
                }

                .inputfield-bg {
                    background-color: #bdbdbd12 !important;
                }
            `}</style>
			<PageTitle breadcrumbs={[]}>View Follow Up Report</PageTitle>

			<div className='view-report-wrapper'>
				{/* Personal Details */}
				<div className='col-12'>
					<div className='card section-card mt-5'>
						<div
							className='section-header'
							role='button'
							data-bs-toggle='collapse'
							data-bs-target='#vw_personal_details'>
							<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
								<h3>
									<span
										className='header-icon'
										style={{ background: '#eef6ff', color: '#3699ff' }}>
										<i className='bi bi-person-lines-fill'></i>
									</span>
									Personal Details
								</h3>
								<FontAwesomeIcon
									icon={faAngleDown}
									className='fs-4 text-muted'
								/>
							</div>
						</div>

						<div
							id='vw_personal_details'
							className='collapse show'>
							<div className='section-body'>
								<div className='field-group-title'>
									<i className='bi bi-person'></i>Basic Information
								</div>

								<div className='row'>
									<div className='col-md-6 fv-row mb-7'>
										<label className='form-label'>Full Name</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={personalDetails.firstName}
											disabled
										/>
									</div>
									<div className='col-md-6 fv-row mb-7'>
										<label className='form-label'>Email</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={personalDetails.email}
											disabled
										/>
									</div>
								</div>

								<div className='row'>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>Mobile Number</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={personalDetails.mobile}
											disabled
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>Gender</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={personalDetails.gender}
											disabled
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>Age</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={personalDetails.age}
											disabled
										/>
									</div>
								</div>

								<div className='row'>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>Education</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={personalDetails.education}
											disabled
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>Job</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={
												personalDetails.job === 'true'
													? 'Yes'
													: personalDetails.job === 'false'
													? 'No'
													: personalDetails.job
											}
											disabled
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>Financial Situation</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={personalDetails.financialSituation}
											disabled
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Course Details */}
				{course && course.course && (
					<div className='col-12'>
						<div className='card section-card mt-5'>
							<div
								className='section-header'
								role='button'
								data-bs-toggle='collapse'
								data-bs-target='#vw_course_details'>
								<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
									<h3>
										<span
											className='header-icon'
											style={{ background: '#e8fff3', color: '#50cd89' }}>
											<i className='bi bi-book'></i>
										</span>
										Course Details
									</h3>
									<FontAwesomeIcon
										icon={faAngleDown}
										className='fs-4 text-muted'
									/>
								</div>
							</div>

							<div
								id='vw_course_details'
								className='collapse show'>
								<div className='section-body'>
									<div className='field-group-title'>
										<i className='bi bi-book'></i>Academic Selection
									</div>

									<div className='row'>
										<div className='col-md-8 fv-row mb-7'>
											<label className='form-label'>Course</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={course.course}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Duration</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={course.course_duration}
												disabled
											/>
										</div>
									</div>

									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Amount</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={course.course_amount}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Final Amount</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={course.final_amount}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Payment Mode</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={course.payment_method}
												disabled
											/>
										</div>
									</div>

									{course.sales_script && (
										<>
											<div className='divider-line'></div>
											<div className='row'>
												<div className='col-md-12 fv-row mb-7'>
													<label className='form-label'>Sales Script</label>
													<textarea
														className='remarks-textarea'
														rows={6}
														value={course.sales_script}
														disabled
													/>
												</div>
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Admission Form */}
				{(admission?.firstName ||
					documents.aadhaarCardFront ||
					documents.aadhaarCardBack ||
					documents.marksheet ||
					documents.photo) && (
					<div className='col-12'>
						<div className='card section-card mt-5'>
							<div
								className='section-header'
								role='button'
								data-bs-toggle='collapse'
								data-bs-target='#vw_admission_form'>
								<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
									<h3>
										<span
											className='header-icon'
											style={{ background: '#fff5f8', color: '#f1416c' }}>
											<i className='bi bi-file-earmark-text'></i>
										</span>
										Admission Form
									</h3>
									<FontAwesomeIcon
										icon={faAngleDown}
										className='fs-4 text-muted'
									/>
								</div>
							</div>

							<div
								id='vw_admission_form'
								className='collapse show'>
								<div className='section-body'>
									<div className='field-group-title'>
										<i className='bi bi-info-circle'></i>Personal & Academic
									</div>

									<div className='row'>
										<div className='col-md-6 fv-row mb-7'>
											<label className='form-label'>First Name</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={admission?.firstName || ''}
												disabled
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<label className='form-label'>Last Name</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={admission?.lastName || ''}
												disabled
											/>
										</div>
									</div>

									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Country</label>
											<input
												className='form-control inputfield-bg'
												value={admission?.address?.country || ''}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>State</label>
											<input
												className='form-control inputfield-bg'
												value={admission?.address?.state || ''}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>City</label>
											<input
												className='form-control inputfield-bg'
												value={admission?.address?.city || ''}
												disabled
											/>
										</div>
										<div className='col-md-8 fv-row mb-7'>
											<label className='form-label'>Address</label>
											<input
												className='form-control inputfield-bg'
												value={admission?.address?.address_line_1 || ''}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Pin Code</label>
											<input
												className='form-control inputfield-bg'
												value={admission?.address?.pin_code || ''}
												disabled
											/>
										</div>
									</div>

									<div className='row'>
										<div className='col-md-6 fv-row mb-7'>
											<label className='form-label'>Phone</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={admission?.phone || ''}
												disabled
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<label className='form-label'>Email</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={admission?.email || ''}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Date of Birth</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={formatDate(admission?.dateOfBirth)}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Age</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={admission?.age || ''}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Course</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={admission?.course || ''}
												disabled
											/>
										</div>
										<div className='col-md-12 fv-row mb-7'>
											<label className='form-label'>Reference</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={admission?.reference || ''}
												disabled
											/>
										</div>
									</div>

									{/* Document Uploads (View) */}
									{(documents.aadhaarCardFront ||
										documents.aadhaarCardBack ||
										documents.marksheet ||
										documents.photo) && (
										<>
											<div className='divider-line'></div>
											<div className='field-group-title'>
												<i className='bi bi-cloud-arrow-up'></i>Document Uploads
											</div>
											<div className='row'>
												{documents.aadhaarCardFront && (
													<div className='col-md-3 fv-row mb-7'>
														<label className='form-label'>Aadhaar Card (Front)</label>
														<div
															className='border border-secondary rounded overflow-hidden'
															style={{
																height: '180px',
																backgroundColor: '#f8f9fa',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}>
															<a
																href={documents.aadhaarCardFront}
																target='_blank'
																rel='noreferrer'
																className='w-100 h-100 d-flex align-items-center justify-content-center'>
																{documents.aadhaarCardFront.toLowerCase().endsWith('.pdf') ? (
																	<div className='text-center'>
																		<i className='bi bi-file-earmark-pdf text-danger fs-1'></i>
																		<div className='fs-7 fw-bold mt-2'>View PDF</div>
																	</div>
																) : (
																	<img
																		src={documents.aadhaarCardFront}
																		alt='Aadhaar Front'
																		className='img-fluid'
																		style={{
																			maxHeight: '100%',
																			maxWidth: '100%',
																			objectFit: 'contain',
																		}}
																	/>
																)}
															</a>
														</div>
													</div>
												)}
												{documents.aadhaarCardBack && (
													<div className='col-md-3 fv-row mb-7'>
														<label className='form-label'>Aadhaar Card (Back)</label>
														<div
															className='border border-secondary rounded overflow-hidden'
															style={{
																height: '180px',
																backgroundColor: '#f8f9fa',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}>
															<a
																href={documents.aadhaarCardBack}
																target='_blank'
																rel='noreferrer'
																className='w-100 h-100 d-flex align-items-center justify-content-center'>
																{documents.aadhaarCardBack.toLowerCase().endsWith('.pdf') ? (
																	<div className='text-center'>
																		<i className='bi bi-file-earmark-pdf text-danger fs-1'></i>
																		<div className='fs-7 fw-bold mt-2'>View PDF</div>
																	</div>
																) : (
																	<img
																		src={documents.aadhaarCardBack}
																		alt='Aadhaar Back'
																		className='img-fluid'
																		style={{
																			maxHeight: '100%',
																			maxWidth: '100%',
																			objectFit: 'contain',
																		}}
																	/>
																)}
															</a>
														</div>
													</div>
												)}
												{documents.marksheet && (
													<div className='col-md-3 fv-row mb-7'>
														<label className='form-label'>Marksheet</label>
														<div
															className='border border-secondary rounded overflow-hidden'
															style={{
																height: '180px',
																backgroundColor: '#f8f9fa',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}>
															<a
																href={documents.marksheet}
																target='_blank'
																rel='noreferrer'
																className='w-100 h-100 d-flex align-items-center justify-content-center'>
																{documents.marksheet.toLowerCase().endsWith('.pdf') ? (
																	<div className='text-center'>
																		<i className='bi bi-file-earmark-pdf text-danger fs-1'></i>
																		<div className='fs-7 fw-bold mt-2'>View PDF</div>
																	</div>
																) : (
																	<img
																		src={documents.marksheet}
																		alt='Marksheet'
																		className='img-fluid'
																		style={{
																			maxHeight: '100%',
																			maxWidth: '100%',
																			objectFit: 'contain',
																		}}
																	/>
																)}
															</a>
														</div>
													</div>
												)}
												{documents.photo && (
													<div className='col-md-3 fv-row mb-7'>
														<label className='form-label'>Passport Photo</label>
														<div
															className='border border-secondary rounded overflow-hidden'
															style={{
																height: '180px',
																backgroundColor: '#f8f9fa',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}>
															<a
																href={documents.photo}
																target='_blank'
																rel='noreferrer'
																className='w-100 h-100 d-flex align-items-center justify-content-center'>
																{documents.photo.toLowerCase().endsWith('.pdf') ? (
																	<div className='text-center'>
																		<i className='bi bi-file-earmark-pdf text-danger fs-1'></i>
																		<div className='fs-7 fw-bold mt-2'>View PDF</div>
																	</div>
																) : (
																	<img
																		src={documents.photo}
																		alt='Passport Photo'
																		className='img-fluid'
																		style={{
																			maxHeight: '100%',
																			maxWidth: '100%',
																			objectFit: 'contain',
																		}}
																	/>
																)}
															</a>
														</div>
													</div>
												)}
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Pitch Report */}
				{pitch && pitch.telecaller_name && (
					<div className='col-12'>
						<div className='card section-card mt-5'>
							<div
								className='section-header'
								role='button'
								data-bs-toggle='collapse'
								data-bs-target='#vw_pitch_report'>
								<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
									<h3>
										<span
											className='header-icon'
											style={{ background: '#fff8dd', color: '#ffc700' }}>
											<i className='bi bi-megaphone'></i>
										</span>
										Pitch Report
									</h3>
									<FontAwesomeIcon
										icon={faAngleDown}
										className='fs-4 text-muted'
									/>
								</div>
							</div>

							<div
								id='vw_pitch_report'
								className='collapse show'>
								<div className='section-body'>
									<div className='field-group-title'>
										<i className='bi bi-megaphone'></i>Pitch Details
									</div>

									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Telecaller Name</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={pitch.telecaller_name}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Interest Level</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={pitch.interest_level}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label'>Follow Up Date</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={formatDate(pitch.pitch_follow_up_date)}
												disabled
											/>
										</div>
									</div>

									<div className='row'>
										<div className='col-md-12 fv-row mb-7'>
											<label className='form-label'>Objections</label>
											<textarea
												className='remarks-textarea'
												rows={3}
												value={pitch.objections}
												disabled
											/>
										</div>
									</div>

									{pitch.call_recording && (
										<>
											<div className='divider-line'></div>
											<div className='field-group-title'>
												<i className='bi bi-mic'></i>Call Recording
											</div>
											<div className='row'>
												<div className='col-md-12 fv-row mb-7'>
													<audio
														controls
														src={pitch.call_recording}
														style={{ width: '100%', borderRadius: '8px' }}>
														Your browser does not support the audio element.
													</audio>
												</div>
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	)
}
