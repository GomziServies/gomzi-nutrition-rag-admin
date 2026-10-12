import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import { useLocation, useNavigate } from 'react-router-dom'
import {
	CreateFwgFollowUpReport,
	GetFwgFollowUpReport,
	UpdateFwgCallEntry,
	AddFwgCallEntry,
} from '../../../../Functions/FGGroup'
import toast from 'react-hot-toast'
import '../../../fwg/follow-up-report/fwg-follow-up-report.css'

interface PersonalDetails {
	client_name: string
	mobile: string
	email: string
	billing_address_line_1: string
	billing_country: string
	billing_state: string
	billing_city: string
	billing_pin_code: string
	gender: string
	age: string
	height: string
	weight: string
	medical_history: string
	goal: string
}

interface EnduranceTest {
	test_name: string
	initial_score: string
	current_score: string
	remarks: string
	images: (File | string)[]
}

interface StrengthTest {
	test_name: string
	initial_score: string
	current_score: string
	remarks: string
	images: (File | string)[]
}

interface FlexibilityTest {
	test_name: string
	initial_score: string
	current_score: string
	remarks: string
	images: (File | string)[]
}

interface ProgramDetails {
	program_name: string
	trainer_name: string
	start_date: string
	end_date: string
	remarks: string
}

interface PitchReport {
	telecaller_name: string
	interest_level: string
	follow_up_date: string
	call_recording: File | null
	objections: string
}

interface SectionDisabled {
	personalDetails: boolean
	enduranceTest: boolean
	strengthTest: boolean
	flexibilityTest: boolean
	programDetails: boolean
	pitchReport: boolean
}

const AutomationAddFollowUpReportFwg: React.FC = () => {
    const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
        client_name: '',
        mobile: '',
        email: '',
        billing_address_line_1: '',
        billing_country: '',
        billing_state: '',
        billing_city: '',
        billing_pin_code: '',
        gender: '',
        age: '',
        height: '',
        weight: '',
        medical_history: '',
        goal: '',
    })

    const [enduranceTests, setEnduranceTests] = useState<EnduranceTest[]>([])
    const [strengthTests, setStrengthTests] = useState<StrengthTest[]>([])
    const [flexibilityTests, setFlexibilityTests] = useState<FlexibilityTest[]>([])

    const [programDetails, setProgramDetails] = useState<ProgramDetails>({
        program_name: '',
        trainer_name: '',
        start_date: '',
        end_date: '',
        remarks: '',
    })

    const [pitchReport, setPitchReport] = useState<PitchReport>({
        telecaller_name: '',
        interest_level: 'LOW',
        follow_up_date: '',
        call_recording: null,
        objections: '',
    })

    const [sectionDisabled, setSectionDisabled] = useState<SectionDisabled>({
        personalDetails: false,
        enduranceTest: false,
        strengthTest: false,
        flexibilityTest: false,
        programDetails: false,
        pitchReport: false,
    })

    const [recordId, setRecordId] = useState<string | null>(null)
    const [latestCallHistoryId, setLatestCallHistoryId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [isPitchReportPending, setIsPitchReportPending] = useState(false)

    const location = useLocation()
    const navigate = useNavigate()

	const handlePersonalDetailsChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setPersonalDetails((prev) => ({ ...prev, [name]: value }))
	}

	const handleEnduranceChange = (index: number, e: React.ChangeEvent<any>) => {
		const { name, value } = e.target
		const updated = [...enduranceTests]
		updated[index] = { ...updated[index], [name]: value }
		setEnduranceTests(updated)
	}

	const handleStrengthChange = (index: number, e: React.ChangeEvent<any>) => {
		const { name, value } = e.target
		const updated = [...strengthTests]
		updated[index] = { ...updated[index], [name]: value }
		setStrengthTests(updated)
	}

	const handleFlexibilityChange = (index: number, e: React.ChangeEvent<any>) => {
		const { name, value } = e.target
		const updated = [...flexibilityTests]
		updated[index] = { ...updated[index], [name]: value }
		setFlexibilityTests(updated)
	}

	const handleProgramDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setProgramDetails((prev) => ({ ...prev, [name]: value }))
	}

	const handlePitchReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setPitchReport((prev) => ({ ...prev, [name]: value }))
	}

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search)
		if (queryParams.get('edit') === 'true') {
			const id = queryParams.get('id')
			if (id) {
				setRecordId(id)
				setIsEditMode(true)
				fetchReportData(id)
			}
		} else {
			const mobileParam = queryParams.get('mobile')
			const nameParam = queryParams.get('name')
			const emailParam = queryParams.get('email')
			if (mobileParam || nameParam) {
				setPersonalDetails((prev) => ({
					...prev,
					client_name: nameParam || '',
					mobile: mobileParam || '',
					email: emailParam && emailParam !== 'undefined' ? emailParam : '',
				}))
			}
		}
	}, [location])

	const fetchReportData = async (id: string) => {
		try {
			const response = await GetFwgFollowUpReport({ id })
			if (response.status === 200 && response.data && response.data.length > 0) {
				const data = response.data[0]
				const latestCall = data.callHistory?.[data.callHistory.length - 1] || {}
				setPersonalDetails({
					client_name: data.personalDetails?.client_name || '',
					mobile: data.personalDetails?.mobile || '',
					email: data.personalDetails?.email || '',
					billing_address_line_1: data.personalDetails?.address?.address_line_1 || '',
					billing_country: data.personalDetails?.address?.country || '',
					billing_state: data.personalDetails?.address?.state || '',
					billing_city: data.personalDetails?.address?.city || '',
					billing_pin_code: data.personalDetails?.address?.pin_code || '',
					gender: data.personalDetails?.gender || '',
					age: data.personalDetails?.age || '',
					height: data.personalDetails?.height || '',
					weight: data.personalDetails?.weight || '',
					medical_history: data.personalDetails?.medical_history || '',
					goal: data.personalDetails?.goal || '',
				})
				setEnduranceTests(latestCall.enduranceTests || [])
				setStrengthTests(latestCall.strengthTests || [])
				setFlexibilityTests(latestCall.flexibilityTests || [])
				setProgramDetails(latestCall.programDetails || {
					program_name: '',
					trainer_name: '',
					start_date: '',
					end_date: '',
					remarks: '',
				})
				setLatestCallHistoryId(latestCall._id || null)
			}
		} catch (error) {
			toast.error('Failed to fetch data')
		}
	}

	const handleCreateReport = async () => {
		try {
			setIsSubmitting(true)
			const payload = {
				personalDetails: {
					client_name: personalDetails.client_name,
					mobile: personalDetails.mobile,
					email: personalDetails.email,
					gender: personalDetails.gender,
					age: personalDetails.age,
					height: personalDetails.height,
					weight: personalDetails.weight,
					medical_history: personalDetails.medical_history,
					goal: personalDetails.goal,
					address: {
						address_line_1: personalDetails.billing_address_line_1,
						city: personalDetails.billing_city,
						state: personalDetails.billing_state,
						country: personalDetails.billing_country,
						pin_code: personalDetails.billing_pin_code,
					},
				},
			}
			const response = await CreateFwgFollowUpReport(payload)
			if (response.status === 201 || response.status === 200) {
				toast.success('Report created successfully')
				const data = Array.isArray(response.data) ? response.data[0] : response.data
				const newId = data?._id || data?.id
				setRecordId(newId)
				// Add a call entry to get a callHistoryId
				if (newId) {
					const callEntryResp = await AddFwgCallEntry({ id: newId })
					if (callEntryResp.status === 200 || callEntryResp.status === 201) {
						const callData = Array.isArray(callEntryResp.data) ? callEntryResp.data[0] : callEntryResp.data
						const latestCall = callData?.callHistory?.[callData.callHistory.length - 1]
						if (latestCall) setLatestCallHistoryId(latestCall._id || null)
					}
				}
				setSectionDisabled((prev) => ({ ...prev, personalDetails: true }))
			} else {
				toast.error(response.message || 'Failed to create report')
			}
		} catch (error: any) {
			toast.error(error.message || 'Something went wrong')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdatePersonal = async () => {
		if (!recordId || !latestCallHistoryId) return
		try {
			setIsSubmitting(true)
			const response = await UpdateFwgCallEntry(
				{ id: recordId, callHistoryId: latestCallHistoryId },
				{
					personalDetails: {
						client_name: personalDetails.client_name,
						mobile: personalDetails.mobile,
						email: personalDetails.email,
						gender: personalDetails.gender,
						age: personalDetails.age,
						height: personalDetails.height,
						weight: personalDetails.weight,
						medical_history: personalDetails.medical_history,
						goal: personalDetails.goal,
						address: {
							address_line_1: personalDetails.billing_address_line_1,
							city: personalDetails.billing_city,
							state: personalDetails.billing_state,
							country: personalDetails.billing_country,
							pin_code: personalDetails.billing_pin_code,
						},
					},
				}
			)
			if (response.status === 200) {
				toast.success('Personal details updated')
				setSectionDisabled((prev) => ({ ...prev, personalDetails: true }))
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdateEndurance = async () => {
		if (!recordId || !latestCallHistoryId) return
		try {
			setIsSubmitting(true)
			const response = await UpdateFwgCallEntry(
				{ id: recordId, callHistoryId: latestCallHistoryId },
				{ enduranceTests }
			)
			if (response.status === 200) {
				toast.success('Endurance tests saved')
				setSectionDisabled((prev) => ({ ...prev, enduranceTest: true }))
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdateStrength = async () => {
		if (!recordId || !latestCallHistoryId) return
		try {
			setIsSubmitting(true)
			const response = await UpdateFwgCallEntry(
				{ id: recordId, callHistoryId: latestCallHistoryId },
				{ strengthTests }
			)
			if (response.status === 200) {
				toast.success('Strength tests saved')
				setSectionDisabled((prev) => ({ ...prev, strengthTest: true }))
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdateFlexibility = async () => {
		if (!recordId || !latestCallHistoryId) return
		try {
			setIsSubmitting(true)
			const response = await UpdateFwgCallEntry(
				{ id: recordId, callHistoryId: latestCallHistoryId },
				{ flexibilityTests }
			)
			if (response.status === 200) {
				toast.success('Flexibility tests saved')
				setSectionDisabled((prev) => ({ ...prev, flexibilityTest: true }))
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdateProgram = async () => {
		if (!recordId || !latestCallHistoryId) return
		try {
			setIsSubmitting(true)
			const response = await UpdateFwgCallEntry(
				{ id: recordId, callHistoryId: latestCallHistoryId },
				{ programDetails }
			)
			if (response.status === 200) {
				toast.success('Program details saved')
				setSectionDisabled((prev) => ({ ...prev, programDetails: true }))
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSavePitchReport = async () => {
		if (!recordId || !latestCallHistoryId) return
		try {
			setIsSubmitting(true)
			const response = await UpdateFwgCallEntry(
				{ id: recordId, callHistoryId: latestCallHistoryId },
				{
					pitchReport: {
						telecaller_name: pitchReport.telecaller_name,
						interest_level: pitchReport.interest_level,
						pitch_follow_up_date: pitchReport.follow_up_date,
						objections: pitchReport.objections,
					},
				}
			)
			if (response.status === 200) {
				toast.success('Pitch report saved')
				navigate('/automation/fwg/follow-up-report-list')
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Follow Up Report (FWG)</PageTitle>

			<div className='col-12'>
				{/* Personal Details */}
				<div className='card section-card'>
					<div
						className='section-header'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_personal_details'
					>
						<h3>
							<span
								className='header-icon'
								style={{ background: '#eef6ff', color: '#3699ff' }}
							>
								<i className='bi bi-person-lines-fill'></i>
							</span>
							Personal Details
						</h3>
						<FontAwesomeIcon icon={faAngleDown} className='fs-4 text-muted' />
					</div>

					<div
						id='kt_personal_details'
						className={`collapse ${sectionDisabled.personalDetails ? 'show' : ''}`}
					>
						<div className='section-body'>
							<div className='row'>
								<InputField
									placeholder='Enter Client Name'
									type='text'
									className='col-md-4 fv-row'
									name='client_name'
									label='Client Name'
									htmlFor='client_name'
									value={personalDetails.client_name}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.personalDetails}
								/>
								<InputField
									placeholder='Enter Mobile Number'
									type='number'
									className='col-md-4 fv-row'
									name='mobile'
									label='Mobile Number'
									htmlFor='mobile'
									value={personalDetails.mobile}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.personalDetails}
								/>
								<InputField
									placeholder='Enter Email Address'
									type='email'
									className='col-md-4 fv-row'
									name='email'
									label='Email Address'
									htmlFor='email'
									value={personalDetails.email}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.personalDetails}
								/>
							</div>

							<div className='row'>
								<SelectField
									label='Gender'
									name='gender'
									className='col-md-3 fv-row'
									htmlFor='gender'
									value={personalDetails.gender}
									onChange={handlePersonalDetailsChange}
									options={['Select', 'Male', 'Female', 'Other']}
									disabled={sectionDisabled.personalDetails}
								/>
								<InputField
									placeholder='Age'
									type='number'
									className='col-md-3 fv-row'
									name='age'
									label='Age'
									htmlFor='age'
									value={personalDetails.age}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.personalDetails}
								/>
								<InputField
									placeholder='Height (cm)'
									type='number'
									className='col-md-3 fv-row'
									name='height'
									label='Height'
									htmlFor='height'
									value={personalDetails.height}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.personalDetails}
								/>
								<InputField
									placeholder='Weight (kg)'
									type='number'
									className='col-md-3 fv-row'
									name='weight'
									label='Weight'
									htmlFor='weight'
									value={personalDetails.weight}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.personalDetails}
								/>
							</div>

							<div className='row'>
								<div className='col-md-6 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6 mb-3'>
										Medical History
									</label>
									<textarea
										className='form-control form-control-lg form-control-solid'
										rows={2}
										name='medical_history'
										value={personalDetails.medical_history}
										onChange={handlePersonalDetailsChange}
										disabled={sectionDisabled.personalDetails}
									/>
								</div>
								<div className='col-md-6 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6 mb-3'>
										Goal
									</label>
									<textarea
										className='form-control form-control-lg form-control-solid'
										rows={2}
										name='goal'
										value={personalDetails.goal}
										onChange={handlePersonalDetailsChange}
										disabled={sectionDisabled.personalDetails}
									/>
								</div>
							</div>

							<div className='d-flex justify-content-end mt-2'>
								{!sectionDisabled.personalDetails && (
									<TableButton
										action='add'
										text={isSubmitting ? 'Saving...' : (recordId ? 'Update' : 'Next')}
										showIcon={false}
										backgroundDark={true}
										disabled={isSubmitting}
										onClick={recordId ? handleUpdatePersonal : handleCreateReport}
									/>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Endurance Test */}
				<div className='card section-card mt-5'>
					<div
						className='section-header'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_endurance_test'
					>
						<h3>
							<span
								className='header-icon'
								style={{ background: '#f8f9fa', color: '#6c757d' }}
							>
								<i className='bi bi-speedometer2'></i>
							</span>
							Endurance Test
						</h3>
						<FontAwesomeIcon icon={faAngleDown} className='fs-4 text-muted' />
					</div>

					<div
						id='kt_endurance_test'
						className={`collapse ${sectionDisabled.enduranceTest ? 'show' : ''}`}
					>
						<div className='section-body'>
							{enduranceTests.map((test, index) => (
								<div key={index} className='border p-5 mb-5 rounded'>
									<div className='row'>
										<InputField
											placeholder='Test Name'
											type='text'
											className='col-md-4 fv-row'
											name='test_name'
											label='Test Name'
											htmlFor={`endurance_name_${index}`}
											value={test.test_name}
											onChange={(e) => handleEnduranceChange(index, e)}
											disabled={sectionDisabled.enduranceTest}
										/>
										<InputField
											placeholder='Initial Score'
											type='text'
											className='col-md-4 fv-row'
											name='initial_score'
											label='Initial Score'
											htmlFor={`endurance_initial_${index}`}
											value={test.initial_score}
											onChange={(e) => handleEnduranceChange(index, e)}
											disabled={sectionDisabled.enduranceTest}
										/>
										<InputField
											placeholder='Current Score'
											type='text'
											className='col-md-4 fv-row'
											name='current_score'
											label='Current Score'
											htmlFor={`endurance_current_${index}`}
											value={test.current_score}
											onChange={(e) => handleEnduranceChange(index, e)}
											disabled={sectionDisabled.enduranceTest}
										/>
									</div>
									<div className='row mt-3'>
										<div className='col-12'>
											<label className='form-label fw-bolder text-dark fs-6'>Remarks</label>
											<textarea
												className='form-control form-control-lg form-control-solid'
												rows={2}
												name='remarks'
												value={test.remarks}
												onChange={(e) => handleEnduranceChange(index, e)}
												disabled={sectionDisabled.enduranceTest}
											/>
										</div>
									</div>
								</div>
							))}
							<div className='d-flex justify-content-between mt-2'>
								<button
									className='btn btn-light-primary btn-sm'
									onClick={() => setEnduranceTests([...enduranceTests, { test_name: '', initial_score: '', current_score: '', remarks: '', images: [] }])}
									disabled={sectionDisabled.enduranceTest}
								>
									+ Add Test
								</button>
								{!sectionDisabled.enduranceTest && recordId && (
									<TableButton
										action='add'
										text={isSubmitting ? 'Saving...' : 'Save Tests'}
										showIcon={false}
										backgroundDark={true}
										disabled={isSubmitting}
										onClick={handleUpdateEndurance}
									/>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Strength Test */}
				<div className='card section-card mt-5'>
					<div
						className='section-header'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_strength_test'
					>
						<h3>
							<span
								className='header-icon'
								style={{ background: '#fff0f0', color: '#dc3545' }}
							>
								<i className='bi bi-lightning-fill'></i>
							</span>
							Strength Test
						</h3>
						<FontAwesomeIcon icon={faAngleDown} className='fs-4 text-muted' />
					</div>

					<div
						id='#kt_strength_test'
						className={`collapse ${sectionDisabled.strengthTest ? 'show' : ''}`}
					>
						<div className='section-body'>
							{strengthTests.map((test, index) => (
								<div key={index} className='border p-5 mb-5 rounded'>
									<div className='row'>
										<InputField
											placeholder='Test Name'
											type='text'
											className='col-md-4 fv-row'
											name='test_name'
											label='Test Name'
											htmlFor={`strength_name_${index}`}
											value={test.test_name}
											onChange={(e: any) => handleStrengthChange(index, e)}
											disabled={sectionDisabled.strengthTest}
										/>
										<InputField
											placeholder='Initial Score'
											type='text'
											className='col-md-4 fv-row'
											name='initial_score'
											label='Initial Score'
											htmlFor={`strength_initial_${index}`}
											value={test.initial_score}
											onChange={(e: any) => handleStrengthChange(index, e)}
											disabled={sectionDisabled.strengthTest}
										/>
										<InputField
											placeholder='Current Score'
											type='text'
											className='col-md-4 fv-row'
											name='current_score'
											label='Current Score'
											htmlFor={`strength_current_${index}`}
											value={test.current_score}
											onChange={(e: any) => handleStrengthChange(index, e)}
											disabled={sectionDisabled.strengthTest}
										/>
									</div>
									<div className='row mt-3'>
										<div className='col-12'>
											<label className='form-label fw-bolder text-dark fs-6'>Remarks</label>
											<textarea
												className='form-control form-control-lg form-control-solid'
												rows={2}
												name='remarks'
												value={test.remarks}
												onChange={(e: any) => handleStrengthChange(index, e)}
												disabled={sectionDisabled.strengthTest}
											/>
										</div>
									</div>
								</div>
							))}
							<div className='d-flex justify-content-between mt-2'>
								<button
									className='btn btn-light-primary btn-sm'
									onClick={() => setStrengthTests([...strengthTests, { test_name: '', initial_score: '', current_score: '', remarks: '', images: [] }])}
									disabled={sectionDisabled.strengthTest}
								>
									+ Add Test
								</button>
								{!sectionDisabled.strengthTest && recordId && (
									<TableButton
										action='add'
										text={isSubmitting ? 'Saving...' : 'Save Tests'}
										showIcon={false}
										backgroundDark={true}
										disabled={isSubmitting}
										onClick={handleUpdateStrength}
									/>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Flexibility Test */}
				<div className='card section-card mt-5'>
					<div
						className='section-header'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_flexibility_test'
					>
						<h3>
							<span
								className='header-icon'
								style={{ background: '#f0fff4', color: '#28a745' }}
							>
								<i className='bi bi-arrow-repeat'></i>
							</span>
							Flexibility Test
						</h3>
						<FontAwesomeIcon icon={faAngleDown} className='fs-4 text-muted' />
					</div>

					<div
						id='kt_flexibility_test'
						className={`collapse ${sectionDisabled.flexibilityTest ? 'show' : ''}`}
					>
						<div className='section-body'>
							{flexibilityTests.map((test, index) => (
								<div key={index} className='border p-5 mb-5 rounded'>
									<div className='row'>
										<InputField
											placeholder='Test Name'
											type='text'
											className='col-md-4 fv-row'
											name='test_name'
											label='Test Name'
											htmlFor={`flexibility_name_${index}`}
											value={test.test_name}
											onChange={(e: any) => handleFlexibilityChange(index, e)}
											disabled={sectionDisabled.flexibilityTest}
										/>
										<InputField
											placeholder='Initial Score'
											type='text'
											className='col-md-4 fv-row'
											name='initial_score'
											label='Initial Score'
											htmlFor={`flexibility_initial_${index}`}
											value={test.initial_score}
											onChange={(e: any) => handleFlexibilityChange(index, e)}
											disabled={sectionDisabled.flexibilityTest}
										/>
										<InputField
											placeholder='Current Score'
											type='text'
											className='col-md-4 fv-row'
											name='current_score'
											label='Current Score'
											htmlFor={`flexibility_current_${index}`}
											value={test.current_score}
											onChange={(e: any) => handleFlexibilityChange(index, e)}
											disabled={sectionDisabled.flexibilityTest}
										/>
									</div>
									<div className='row mt-3'>
										<div className='col-12'>
											<label className='form-label fw-bolder text-dark fs-6'>Remarks</label>
											<textarea
												className='form-control form-control-lg form-control-solid'
												rows={2}
												name='remarks'
												value={test.remarks}
												onChange={(e: any) => handleFlexibilityChange(index, e)}
												disabled={sectionDisabled.flexibilityTest}
											/>
										</div>
									</div>
								</div>
							))}
							<div className='d-flex justify-content-between mt-2'>
								<button
									className='btn btn-light-primary btn-sm'
									onClick={() => setFlexibilityTests([...flexibilityTests, { test_name: '', initial_score: '', current_score: '', remarks: '', images: [] }])}
									disabled={sectionDisabled.flexibilityTest}
								>
									+ Add Test
								</button>
								{!sectionDisabled.flexibilityTest && recordId && (
									<TableButton
										action='add'
										text={isSubmitting ? 'Saving...' : 'Save Tests'}
										showIcon={false}
										backgroundDark={true}
										disabled={isSubmitting}
										onClick={handleUpdateFlexibility}
									/>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Rest will be added... */}
			</div>
		</>
	)

}

export default AutomationAddFollowUpReportFwg
