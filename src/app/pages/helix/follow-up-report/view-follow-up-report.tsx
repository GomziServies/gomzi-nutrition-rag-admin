import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetGnFollowUpReport } from '../../../Functions/FGGroup/GnFollowUpReport'
import './follow-up-report.css'

interface Address {
	address_line_1: string
	city: string
	state: string
	country: string
	pin_code: string
}

interface PersonalDetails {
	client_name: string
	mobile: string
	address: Address
	additional_note: string
}

export interface ProductEntry {
	product_type: string
	product_flavour: string
	weight: string
	weight_unit: string
	quantity: string
	budget: string
}

interface ProductDetails {
	products: ProductEntry[]
	interested: boolean
	experience: string
	is_broker: boolean
	brochure_sent: boolean
	follow_up_date: string
	remarks: string
}

interface SampleSelection {
	sample_interested: boolean
	sample_interested_remarks?: string
	selected_samples: string[]
	is_skipped?: boolean
}

interface SampleUpdate {
	sample_taste_feedback: string
	sample_taste_remarks: string
	final_follow_up_date: string
	final_remarks: string
	is_skipped?: boolean
}

interface PitchReport {
	telecaller_name: string
	interest_level: 'LOW' | 'MEDIUM' | 'HIGH' | ''
	pitch_follow_up_date: string
	call_recording?: string
	objections: string
}

interface CallEntry {
	_id: string
	callDate: string
	productDetails?: ProductDetails
	sampleSelection?: SampleSelection
	sampleUpdate?: SampleUpdate
	pitchReport?: PitchReport
}

interface ReportData {
	_id: string
	personalDetails: PersonalDetails
	callHistory: CallEntry[]
	createdAt: string
}

interface ProductOption {
	value: string
	icon: string
	label: string
}

const productTypeOptions: ProductOption[] = [
	{ value: 'Peanut Butter', icon: '🥜', label: 'Peanut Butter' },
	{ value: 'Mass Gainer', icon: '💪', label: 'Mass Gainer' },
	{ value: 'Whey Protein', icon: '🥛', label: 'Whey Protein' },
	{ value: 'Pre Workout', icon: '⚡', label: 'Pre Workout' },
	{ value: 'BCAA', icon: '🧬', label: 'BCAA' },
	{ value: 'EAA', icon: '🔬', label: 'EAA' },
	{ value: 'Creatine', icon: '💊', label: 'Creatine' },
	{ value: 'Energy Drink', icon: '🥤', label: 'Energy Drink' },
]

const sampleProductOptions: ProductOption[] = [
	{ value: 'Peanut Butter Sample', icon: '🥜', label: 'Peanut Butter' },
	{ value: 'Mass Gainer Sample', icon: '💪', label: 'Mass Gainer' },
	{ value: 'Whey Protein Sample', icon: '🥛', label: 'Whey Protein' },
	{ value: 'Pre Workout Sample', icon: '⚡', label: 'Pre Workout' },
	{ value: 'BCAA Sample', icon: '🧬', label: 'BCAA' },
	{ value: 'EAA Sample', icon: '🔬', label: 'EAA' },
	{ value: 'Creatine Sample', icon: '💊', label: 'Creatine' },
	{ value: 'Energy Drink Sample', icon: '🥤', label: 'Energy Drink' },
]

export default function ViewFollowUpReport() {
	const location = useLocation()
	const [loading, setLoading] = useState<boolean>(true)
	const [report, setReport] = useState<ReportData | null>(null)

	const fetchData = async (id: string): Promise<void> => {
		try {
			setLoading(true)
			const response = await GetGnFollowUpReport({ id })
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
			<div className='d-flex justify-content-center align-items-center loading-container'>
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

	const product = activeCall?.productDetails || null
	const samples = activeCall?.sampleSelection || null
	const feedback = activeCall?.sampleUpdate || null
	const pitch = activeCall?.pitchReport || null

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
			<PageTitle breadcrumbs={[]}>View Follow Up Report</PageTitle>

			<div className='view-report-wrapper'>
				{/* Personal Details & Product Details */}
				<div className='col-12'>
					<div className='card section-card'>
						<div
							className='section-header'
							role='button'
							data-bs-toggle='collapse'
							data-bs-target='#vw_personal_details'>
							<h3>
								<span className='header-icon icon-blue'>
									<i className='bi bi-person-lines-fill'></i>
								</span>
								Personal Details & Product Details
							</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-4 text-muted'
							/>
						</div>

						<div
							id='vw_personal_details'
							className='collapse show'>
							<div className='section-body'>
								{personalDetails.additional_note && personalDetails.additional_note !== '-' && (
									<div className='row'>
										<div className='col-12 mb-7'>
											<div
												className='alert alert-primary d-flex align-items-center p-5 mb-0'
												style={{
													backgroundColor: '#f1faff',
													border: '1px dashed #b9dfff',
													borderRadius: '8px',
												}}>
												<i className='bi bi-info-circle-fill fs-2hx text-primary me-4'></i>
												<div className='d-flex flex-column'>
													<h4 className='mb-1 text-primary'>Lead Answers / Additional Notes</h4>
													<div
														className='d-flex flex-column gap-1 mt-2'
														style={{ fontSize: '13px', color: '#181c32' }}>
														{personalDetails.additional_note.split(' | ').map((note, idx) => (
															<div
																key={idx}
																className='d-flex align-items-start gap-2'>
																<span className='text-primary fw-bolder mt-1'>•</span>
																{note.includes(':') ? (
																	<span>
																		<strong>{note.split(':')[0]}:</strong>
																		{note.split(':').slice(1).join(':')}
																	</span>
																) : (
																	<span>{note}</span>
																)}
															</div>
														))}
													</div>
												</div>
											</div>
										</div>
									</div>
								)}
								<div className='field-group-title'>
									<i className='bi bi-person'></i>Basic Information
								</div>

								<div className='row'>
									<div className='col-md-6 fv-row mb-7'>
										<label className='form-label'>Client Name</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={personalDetails.client_name}
											disabled
										/>
									</div>
									<div className='col-md-6 fv-row mb-7'>
										<label className='form-label'>Mobile Number</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={personalDetails.mobile}
											disabled
										/>
									</div>
								</div>

								<div className='row'>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>Country</label>
										<input
											className='form-control inputfield-bg'
											value={personalDetails.address?.country || ''}
											disabled
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>State</label>
										<input
											className='form-control inputfield-bg'
											value={personalDetails.address?.state || ''}
											disabled
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>City</label>
										<input
											className='form-control inputfield-bg'
											value={personalDetails.address?.city || ''}
											disabled
										/>
									</div>
									<div className='col-md-8 fv-row mb-7'>
										<label className='form-label'>Address</label>
										<input
											className='form-control inputfield-bg'
											value={personalDetails.address?.address_line_1 || ''}
											disabled
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label'>Pin Code</label>
										<input
											className='form-control inputfield-bg'
											value={personalDetails.address?.pin_code || ''}
											disabled
										/>
									</div>
								</div>

								{product && (
									<>
										<div className='field-group-title'>
											<i className='bi bi-box-seam'></i>Product Information
										</div>

											{product.products?.map((prodItem, index) => (
												<div key={index} className='product-entry-row mb-5 p-5 border rounded w-100'>
													<div className='d-flex justify-content-between mb-3'>
														<h5 className='fw-bolder'>Product {index + 1}</h5>
													</div>
													<div className='row'>
														<div className='col-md-4 fv-row mb-4'>
															<label className='form-label fw-bolder text-dark fs-6'>Product Type</label>
															<input
																type='text'
																className='form-control inputfield-bg'
																value={prodItem.product_type}
																disabled
															/>
														</div>
														<div className='col-md-4 fv-row mb-4'>
															<label className='form-label fw-bolder text-dark fs-6'>Product Flavour</label>
															<input
																type='text'
																className='form-control inputfield-bg'
																value={prodItem.product_flavour}
																disabled
															/>
														</div>
														<div className='col-md-4 fv-row mb-4'>
															<label className='form-label fw-bolder text-dark fs-6'>Weight</label>
															<div className='d-flex gap-2'>
																<input
																	type='text'
																	className='form-control inputfield-bg'
																	value={prodItem.weight}
																	disabled
																/>
																<input
																	type='text'
																	className='form-control inputfield-bg w-100px'
																	value={prodItem.weight_unit}
																	disabled
																/>
															</div>
														</div>
														<div className='col-md-4 fv-row mb-4'>
															<label className='form-label fw-bolder text-dark fs-6'>Quantity</label>
															<input
																type='number'
																className='form-control inputfield-bg'
																value={prodItem.quantity}
																disabled
															/>
														</div>
														<div className='col-md-4 fv-row mb-4'>
															<label className='form-label fw-bolder text-dark fs-6'>Budget</label>
															<div className='budget-input-wrapper'>
																<span className='currency-symbol'>₹</span>
																<input
																	type='text'
																	className='form-control inputfield-bg'
																	value={prodItem.budget}
																	disabled
																/>
															</div>
														</div>
													</div>
												</div>
											))}



										<div className='divider-line'></div>

										<div className='field-group-title'>
											<i className='bi bi-star'></i>Interest & Experience
										</div>

										<div className='row'>
											<div className='col-md-3 fv-row mb-7'>
												<label className='form-label fw-bolder text-dark fs-6 mb-3'>
													Interested?
												</label>
												<div className='d-flex gap-3'>
													{['Yes', 'No'].map((opt) => {
														const active = (product.interested ? 'Yes' : 'No') === opt
														return (
															<div
																key={opt}
																className={`radio-card ${
																	active ? (opt === 'Yes' ? 'active-yes' : 'active-no') : ''
																}`}>
																<span className='radio-dot'></span>
																<span className='radio-label'>{opt}</span>
															</div>
														)
													})}
												</div>
											</div>

											<div className='col-md-6 fv-row mb-7'>
												<label className='form-label fw-bolder text-dark fs-6 mb-3'>
													Experience
												</label>
												<div className='d-flex gap-3'>
													{['First time buyer', 'Already buying from some where'].map((opt) => (
														<div
															key={opt}
															className={`radio-card ${
																product.experience === opt ? 'active' : ''
															}`}>
															<span className='radio-dot'></span>
															<span className='radio-label'>{opt}</span>
														</div>
													))}
												</div>
											</div>

											<div className='col-md-3 fv-row mb-7'>
												<label className='form-label fw-bolder text-dark fs-6 mb-3'>
													Brochure / Price List Sent?
												</label>
												<div className='d-flex gap-3'>
													{['Yes', 'No'].map((opt) => {
														const active = (product.brochure_sent ? 'Yes' : 'No') === opt
														return (
															<div
																key={opt}
																className={`radio-card ${
																	active ? (opt === 'Yes' ? 'active-yes' : 'active-no') : ''
																}`}>
																<span className='radio-dot'></span>
																<span className='radio-label'>{opt}</span>
															</div>
														)
													})}
												</div>
											</div>

										</div>



										<div className='divider-line'></div>

										<div className='row'>
											<div className='col-md-12 fv-row mb-7'>
												<label className='form-label fw-bolder text-dark fs-6 mb-3'>Remarks</label>
												<textarea
													className='remarks-textarea'
													rows={3}
													value={product.remarks}
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

				{/* Interested & Sample Selection */}
				{samples &&
					(samples.is_skipped ||
						samples.sample_interested !== undefined ||
						(samples.selected_samples && samples.selected_samples.length > 0)) && (
						<div className='col-12'>
							<div className='card section-card'>
								<div
									className='section-header'
									role='button'
									data-bs-toggle='collapse'
									data-bs-target='#vw_interested_sample'>
									<h3>
										<span className='header-icon icon-green'>
											<i className='bi bi-hand-thumbs-up'></i>
										</span>
										Interested & Sample Selection
										{samples.is_skipped && (
											<span className='ms-3 p-2 badge badge-light-danger fw-bold'>Skipped</span>
										)}
									</h3>
									<FontAwesomeIcon
										icon={faAngleDown}
										className='fs-4 text-muted'
									/>
								</div>

								<div
									id='vw_interested_sample'
									className='collapse show'>
									<div
										className='section-body'
										style={{
											pointerEvents: samples.is_skipped ? 'none' : 'auto',
											opacity: samples.is_skipped ? 0.6 : 1,
										}}>
										<div className='field-group-title'>
											<i className='bi bi-star'></i>Client Interest
										</div>

										<div className='row'>
											<div className='col-md-4 fv-row mb-7'>
												<label className='form-label fw-bolder text-dark fs-6 mb-3'>
													Interested?
												</label>
												<div className='d-flex gap-3'>
													{(['Yes', 'No'] as const).map((opt) => {
														const active =
															opt === 'Yes'
																? samples.sample_interested === true
																: opt === 'No'
																? samples.sample_interested === false
																: false
														return (
															<div
																key={opt}
																className={`radio-card ${
																	active ? (opt === 'Yes' ? 'active-yes' : 'active-no') : ''
																}`}>
																<span className='radio-dot'></span>
																<span className='radio-label'>{opt}</span>
															</div>
														)
													})}
												</div>
											</div>
										</div>

										{samples.sample_interested && (
											<div className='sample-section'>
												<div className='sample-title'>
													<i className='bi bi-gift-fill'></i>
													Selected Sample Products
												</div>
												<div className='d-flex gap-3 flex-wrap'>
													{sampleProductOptions.map((sample) => {
														const isSelected = samples.selected_samples.includes(sample.value)
														return (
															<div
																key={sample.value}
																className={`product-type-card ${isSelected ? 'active' : ''}`}>
																{isSelected && (
																	<span className='check-badge'>
																		<i className='bi bi-check2'></i>
																	</span>
																)}
																<span className='product-icon'>{sample.icon}</span>
																<span className='product-label'>{sample.label}</span>
															</div>
														)
													})}
												</div>
                                                <div className='row mt-5'>
                                                    <div className='col-md-12 fv-row mb-7'>
                                                        <label className='form-label fw-bolder text-dark fs-6 mb-3'>Remarks</label>
                                                        <textarea
                                                            className='remarks-textarea'
                                                            rows={3}
                                                            value={samples.sample_interested_remarks || ''}
                                                            disabled
                                                        />
                                                    </div>
                                                </div>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					)}

				{/*  Sample Update */}
				{feedback && (feedback.is_skipped || feedback.sample_taste_feedback) && (
					<div className='col-12'>
						<div className='card section-card'>
							<div
								className='section-header'
								role='button'
								data-bs-toggle='collapse'
								data-bs-target='#vw_sample_update'>
								<h3>
									<span className='header-icon icon-orange'>
										<i className='bi bi-chat-dots'></i>
									</span>
									Sample Update
									{feedback.is_skipped && (
										<span className='ms-3 p-2 badge badge-light-danger fw-bold'>Skipped</span>
									)}
								</h3>
								<FontAwesomeIcon
									icon={faAngleDown}
									className='fs-4 text-muted'
								/>
							</div>

							<div
								id='vw_sample_update'
								className='collapse show'>
								<div
									className='section-body'
									style={{
										pointerEvents: feedback.is_skipped ? 'none' : 'auto',
										opacity: feedback.is_skipped ? 0.6 : 1,
									}}>
									<div className='field-group-title'>
										<i className='bi bi-clipboard-check'></i>Sample Taste Update
									</div>

									<div className='row'>
										<div className='col-md-12 fv-row mb-7'>
											<label className='form-label fw-bolder text-dark fs-6 mb-3'>
												Sample Taste Feedback
											</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={feedback.sample_taste_feedback}
												disabled
											/>
										</div>
									</div>

									<div className='row'>
										<div className='col-md-12 fv-row mb-7'>
											<label className='form-label fw-bolder text-dark fs-6 mb-3'>
												Sample Test Remarks
											</label>
											<textarea
												className='remarks-textarea'
												rows={3}
												value={feedback.sample_taste_remarks}
												disabled
											/>
										</div>
									</div>

									<div className='divider-line'></div>

									<div className='field-group-title'>
										<i className='bi bi-chat-text'></i>Final Remarks
									</div>

									<div className='row'>
										<div className='col-md-12 fv-row mb-7'>
											<label className='form-label fw-bolder text-dark fs-6 mb-3'>
												Final Remarks
											</label>
											<textarea
												className='remarks-textarea'
												rows={4}
												value={feedback.final_remarks}
												disabled
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/*  Pitch Report */}
				{pitch && pitch.telecaller_name && (
					<div className='card section-card'>
						<div
							className='section-header'
							role='button'
							data-bs-toggle='collapse'
							data-bs-target='#vw_pitch_report'>
							<h3>
								<span className='header-icon icon-emerald'>
									<i className='bi bi-megaphone'></i>
								</span>
								Pitch Report
							</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-4 text-muted'
							/>
						</div>

						<div
							id='vw_pitch_report'
							className='collapse show'>
							<div className='section-body'>
								<div className='row'>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>
											Telecaller Name
										</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={pitch.telecaller_name}
											disabled
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>
											Interest Level
										</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={pitch.interest_level}
											disabled
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>
											Next Follow up Date
										</label>
										<input
											type='text'
											className='form-control inputfield-bg'
											value={formatDate(pitch.pitch_follow_up_date)}
											disabled
										/>
									</div>
								</div>

								<div className='col-md-12 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6 mb-3'>Objections</label>
									<textarea
										className='remarks-textarea'
										rows={3}
										value={pitch.objections}
										disabled
									/>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	)
}
