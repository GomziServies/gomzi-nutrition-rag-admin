import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'

function ViewTeleReport() {
	// Personal Details State
	const [personalDetails, setPersonalDetails] = useState({
		firstName: '',
		gender: 'MALE',
		email: '',
		mobile: '',
		age: '',
		education: '',
		financialSituation: 'high',
		job: 'true',
	})

	// Course Details State
	const [courseDetails, setCourseDetails] = useState({
		course: 'course',
		course_duration: 'duration',
		course_amount: 'amount',
		payment_method: 'paymentMethod',
		sales_script: 'ddcasx',
	})

	// Admission Form State
	const [admissionForm, setAdmissionForm] = useState({
		firstName: '',
		lastName: '',
		address: '',
		phone: '',
		email: '',
		dateOfBirth: '',
		age: '',
		course: '',
		reference: '',
		aadhaarCard: null as File | null,
		marksheet: null as File | null,
		photo: null as File | null,
	})

	// Pitch Report State
	const [pitchReport, setPitchReport] = useState({
		telecaller_name: 'telecaller_name',
		interest_level: 'LOW',
		follow_up_date: '',
		call_recording: null as File | null,
		objections: '',
	})

	// Handle input changes for personal details
	const handlePersonalDetailsChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setPersonalDetails((prev) => ({
			...prev,
			[name]: name === 'mobile' || name === 'age' ? value : value,
		}))
	}

	// Handle input changes for Course Details
	const handleCourseDetailsChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setCourseDetails((prev) => ({
			...prev,
			[name]: name === 'course_amount' ? value : value,
		}))
	}

	// Handle input changes for admission form
	const handleAdmissionFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setAdmissionForm((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	// Handle admission form file input changes
	const handleAdmissionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const target = e.target as HTMLInputElement
		const { name } = e.target
		if (target.files && target.files[0]) {
			setAdmissionForm((prev) => ({
				...prev,
				[name]: target.files![0],
			}))
		}
	}

	// Handle input changes for pitch report
	const handlePitchReportChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setPitchReport((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	// Handle file input change
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const target = e.target as HTMLInputElement
		if (target.files && target.files[0]) {
			setPitchReport((prev) => ({
				...prev,
				call_recording: target.files![0],
			}))
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Tele Report</PageTitle>
			{/* Personal Details */}
			<div className='col-12'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_analysis'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Personal Details</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_oder_view_analysis'
						className='collapse show'>
						<div className='card-body'>
							<div className='row justify-content-end'>
								<div className='col-12'>
									<div className='row'>
										<InputField
											placeholder='Enter Fullname'
											type='text'
											className='col-md-8 fv-row'
											name='firstName'
											label='Fullname'
											htmlFor='fullname'
											value={personalDetails.firstName}
											onChange={handlePersonalDetailsChange}
										/>
										<SelectField
											value={personalDetails.gender}
											onChange={handlePersonalDetailsChange}
											className='col-md-4 fv-row mb-7'
											label='Gender'
											name='gender'
											htmlFor='gender'
											options={['MALE', 'FEMALE', 'OTHER']}
										/>
										<InputField
											placeholder='Enter Email'
											type='email'
											className='col-md-4 fv-row'
											name='email'
											label='Email'
											htmlFor='email'
											value={personalDetails.email}
											onChange={handlePersonalDetailsChange}
										/>
										<InputField
											placeholder='Enter Mobile Number'
											type='number'
											className='col-md-4 fv-row'
											name='mobile'
											label='Mobile Number'
											htmlFor='mobile'
											value={personalDetails.mobile.toString()}
											onChange={handlePersonalDetailsChange}
										/>
										<InputField
											placeholder='Enter Age'
											type='number'
											className='col-md-4 fv-row'
											name='age'
											label='Age'
											htmlFor='age'
											value={personalDetails.age.toString()}
											onChange={handlePersonalDetailsChange}
										/>
										<InputField
											placeholder='Enter Education'
											type='text'
											className='col-md-4 fv-row'
											name='education'
											label='Education'
											htmlFor='education'
											value={personalDetails.education}
											onChange={handlePersonalDetailsChange}
										/>
										<SelectField
											value={personalDetails.financialSituation}
											onChange={handlePersonalDetailsChange}
											className='col-md-4 fv-row mb-7'
											label='Financial Situation'
											name='financialSituation'
											htmlFor='financialSituation'
											options={['High', 'Medium', 'Low']}
										/>
										<SelectField
											value={personalDetails.job}
											onChange={handlePersonalDetailsChange}
											className='col-md-4 fv-row mb-7'
											label='Job'
											name='job'
											htmlFor='job'
											options={['true', 'false']}
										/>
									</div>
								</div>
								<div className='col-md-12 mt-5 mb-7'>
									<div className='d-flex justify-content-end'>
										<TableButton
											action='add'
											text='Next'
											showIcon={false}
											backgroundDark={true}
											onClick={() => {
												const analysisElement = document.getElementById('kt_oder_view_analysis')
												const compositionElement = document.getElementById(
													'kt_oder_view_composition'
												)

												if (analysisElement) {
													analysisElement.classList.remove('show')
												}
												if (compositionElement) {
													compositionElement.classList.add('show')
												}
											}}
										/>
									</div>
									<div className='d-flex justify-content-end'></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Course Details */}
			<div className='card mb-5 mb-xl-10 mt-5'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_course_details'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Course Details</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_course_details'
					className='collapse'>
					<div className='card-body border-top p-9'>
						<div className='row mt-4'>
							{/* course select */}
							<div className='col-md-8 fv-row mb-7'>
								<SelectField
									className='col-md-12 fv-row mb-7'
									label='Course'
									name='course'
									value={courseDetails.course}
									onChange={handleCourseDetailsChange}
									htmlFor='course'
									options={['Course 1', 'Course 2', 'Course 3']}
								/>
							</div>
							<div className='col-md-4 fv-row mb-7'>
								<InputField
									placeholder='course Duration'
									type='text'
									className='col-md-12 fv-row'
									label='Duration'
									name='course_duration'
									htmlFor='course_duration'
									value={courseDetails.course_duration}
									onChange={handleCourseDetailsChange}
								/>
							</div>
							<div className='col-md-4 fv-row mb-7'>
								<InputField
									placeholder='Course Amount'
									type='number'
									className='col-md-12 fv-row'
									label='Amount'
									name='course_amount'
									htmlFor='course_amount'
									value={courseDetails.course_amount.toString()}
									onChange={handleCourseDetailsChange}
								/>
							</div>
							<div className='col-md-4 fv-row mb-7'>
								<InputField
									placeholder='Course Amount'
									type='number'
									className='col-md-12 fv-row'
									label='Final Amount'
									name='course_amount'
									htmlFor='course_amount'
									value={courseDetails.course_amount.toString()}
									onChange={handleCourseDetailsChange}
								/>
							</div>
							<div className='col-md-4 fv-row mb-7'>
								<SelectField
									className='col-md-12 fv-row mb-7'
									label='Payment Method'
									name='payment_method'
									value={courseDetails.payment_method}
									onChange={handleCourseDetailsChange}
									htmlFor='payment_method'
									options={['Online', 'Cash', 'SaveIn']}
								/>
							</div>

							{/* Sales script textarea */}
							<div className='col-md-12 fv-row mb-7'>
								<label className='form-label fw-bolder text-dark fs-6'>Sales Script</label>
								<textarea
									className='form-control form-control-lg form-control-solid'
									rows={10}
									placeholder='Sales script for selected course will appear here'
									value={courseDetails.sales_script}
									name='sales_script'
									onChange={(e) =>
										setCourseDetails((prev) => ({ ...prev, sales_script: e.target.value }))
									}
								/>
							</div>
							<div className='col-md-12 mt-5 mb-7'>
								<div className='d-flex justify-content-end'>
									<TableButton
										action='add'
										text='Next'
										showIcon={false}
										backgroundDark={true}
										onClick={() => {
											const analysisElement = document.getElementById('kt_oder_view_lifestyle')
											const compositionElement = document.getElementById(
												'kt_oder_view_foodlifestyle'
											)

											if (analysisElement) {
												analysisElement.classList.remove('show')
											}
											if (compositionElement) {
												compositionElement.classList.add('show')
											}
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Admission Form */}
			<div className='col-12 mt-8'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_admission_form_details'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Admission Form</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_admission_form_details'
						className='collapse'>
						<div className='card-body border-top p-9'>
							<div className='row mt-4'>
								<InputField
									placeholder='Enter First Name'
									type='text'
									className='col-md-6 fv-row mb-7'
									name='firstName'
									label='First Name'
									htmlFor='firstName'
									value={admissionForm.firstName}
									onChange={handleAdmissionFormChange}
								/>
								<InputField
									placeholder='Enter Last Name'
									type='text'
									className='col-md-6 fv-row mb-7'
									name='lastName'
									label='Last Name'
									htmlFor='lastName'
									value={admissionForm.lastName}
									onChange={handleAdmissionFormChange}
								/>
								<InputField
									placeholder='Enter Address'
									type='text'
									className='col-md-12 fv-row mb-7'
									name='address'
									label='Address'
									htmlFor='address'
									value={admissionForm.address}
									onChange={handleAdmissionFormChange}
								/>
								<InputField
									placeholder='Enter Phone Number'
									type='tel'
									className='col-md-6 fv-row mb-7'
									name='phone'
									label='Phone Number'
									htmlFor='phone'
									value={admissionForm.phone}
									onChange={handleAdmissionFormChange}
								/>
								<InputField
									placeholder='Enter Email ID'
									type='email'
									className='col-md-6 fv-row mb-7'
									name='email'
									label='Email ID'
									htmlFor='email'
									value={admissionForm.email}
									onChange={handleAdmissionFormChange}
								/>
								<InputField
									placeholder='Enter Date of Birth'
									type='date'
									className='col-md-6 fv-row mb-7'
									name='dateOfBirth'
									label='Date of Birth'
									htmlFor='dateOfBirth'
									value={admissionForm.dateOfBirth}
									onChange={handleAdmissionFormChange}
								/>
								<InputField
									placeholder='Enter Age'
									type='number'
									className='col-md-6 fv-row mb-7'
									name='age'
									label='Age'
									htmlFor='age'
									value={admissionForm.age}
									onChange={handleAdmissionFormChange}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Course'
									name='course'
									value={admissionForm.course}
									onChange={handleAdmissionFormChange}
									htmlFor='course'
									options={[
										'Computer Science',
										'Business Administration',
										'Engineering',
										'Arts',
										'Other',
									]}
								/>
								<InputField
									placeholder='Enter Reference'
									type='text'
									className='col-md-6 fv-row mb-7'
									name='reference'
									label='Reference'
									htmlFor='reference'
									value={admissionForm.reference}
									onChange={handleAdmissionFormChange}
								/>
								<InputField
									placeholder='Upload Aadhaar Card'
									type='file'
									className='col-md-4 fv-row mb-7'
									label='Aadhaar Card'
									name='aadhaarCard'
									htmlFor='aadhaarCard'
									onChange={(e) =>
										handleAdmissionFileChange(e as React.ChangeEvent<HTMLInputElement>)
									}
								/>
								<InputField
									placeholder='Upload 10th/12th Marksheet'
									type='file'
									className='col-md-4 fv-row mb-7'
									label='10th/12th Marksheet'
									name='marksheet'
									htmlFor='marksheet'
									onChange={(e) =>
										handleAdmissionFileChange(e as React.ChangeEvent<HTMLInputElement>)
									}
								/>
								<InputField
									placeholder='Upload Passport Size Photo'
									type='file'
									className='col-md-4 fv-row mb-7'
									label='Passport Size Photo'
									name='photo'
									htmlFor='photo'
									onChange={(e) =>
										handleAdmissionFileChange(e as React.ChangeEvent<HTMLInputElement>)
									}
								/>
								<div className='col-md-12 mt-5 mb-7'>
									<div className='d-flex justify-content-end'>
										<TableButton
											action='add'
											text='Submit Admission'
											showIcon={false}
											backgroundDark={true}
											onClick={() => {
												// Handle form submission
												console.log('Admission form submitted:', admissionForm)
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Pitch Report */}
			<div className='card mb-5 mb-xl-10 mt-5'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_pitch_report'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Pitch Report</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_pitch_report'
					className='collapse'>
					<div className='card-body border-top p-9'>
						<div className='row mt-4'>
							<SelectField
								className='col-md-4 fv-row mb-7'
								label='Telecaller Name'
								name='telecaller_name'
								value={pitchReport.telecaller_name}
								onChange={handlePitchReportChange}
								htmlFor='telecaller_name'
								options={['Chirag Pandey', 'Ravi Patel', 'Asalam Khan', 'Suman Gupta']}
							/>
							<SelectField
								className='col-md-4 fv-row mb-7'
								label='Interest Level'
								name='interest_level'
								value={pitchReport.interest_level}
								onChange={handlePitchReportChange}
								htmlFor='interest_level'
								options={['LOW', 'MEDIUM', 'HIGH']}
							/>
							<InputField
								placeholder='Enter Follow Up Date'
								type='date'
								className='col-md-4 fv-row'
								label='Follow Up Date'
								name='follow_up_date'
								htmlFor='follow_up_date'
								value={pitchReport.follow_up_date}
								onChange={handlePitchReportChange}
							/>
							<InputField
								placeholder='Enter Upload Call Recording'
								type='file'
								className='col-md-12 fv-row'
								label='Upload Call Recording'
								name='call_recording'
								htmlFor='call_recording'
								onChange={handleFileChange}
							/>
						</div>
						<div className='col-md-12 fv-row mb-7'>
							<label className='form-label fw-bolder text-dark fs-6 mb-3'>Objections</label>
							<textarea
								className='form-control form-control-lg form-control-solid'
								rows={3}
								placeholder='Enter objections'
								name='objections'
								value={pitchReport.objections}
								onChange={(e) =>
									setPitchReport((prev) => ({ ...prev, objections: e.target.value }))
								}
							/>
						</div>
						<div className='col-md-12 mt-5 mb-7'>
							<div className='d-flex justify-content-end'>
								<TableButton
									action='add'
									text='Save'
									showIcon={false}
									backgroundDark={true}
									onClick={() => {
										const analysisElement = document.getElementById('kt_oder_view_pitch_report')
										const compositionElement = document.getElementById('kt_oder_view_foodlifestyle')

										if (analysisElement) {
											analysisElement.classList.remove('show')
										}
										if (compositionElement) {
											compositionElement.classList.add('show')
										}
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default ViewTeleReport
