import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup/AccountFunctions'
import {
	CreateFgiitFollowUpReport,
	GetFgiitFollowUpReport,
	UpdateFgiitAdmissionForm,
	UpdateFgiitCourseDetails,
	UpdateFgiitPersonalDetails,
	UpdateFgiitPitchReport,
} from '../../../Functions/FGGroup/FgiitFollowUpReport'

// Address interfaces
type Country = {
	id: number
	name: string
	iso2: string
}

type State = {
	id: number
	name: string
	country_id: number
	country_code: string
	state_code: string
}

type City = {
	id: number
	name: string
	state_id: number
	state_code: string
	country_id: number
	country_code: string
	latitude: string
	longitude: string
}

function AddFollowUpReport() {
	const location = useLocation()
	const navigate = useNavigate()
	const queryParams = new URLSearchParams(location.search)
	const adNameFromUrl = decodeURIComponent(queryParams.get('ad_name') || '')
	const leadCreatedAtFromUrl = decodeURIComponent(queryParams.get('lead_created_at') || '')
	const isPitchPending = queryParams.get('pitchPending') === 'true'
	const returnedFromUrl = queryParams.get('returnedFrom') || ''
	const platformFromUrl = decodeURIComponent(queryParams.get('platform') || '')
	const isPullMarketing = platformFromUrl.toLowerCase() === 'pull_marketing'

	const initialPersonalDetails = (location.state as any)?.personalDetails || {}

	// Helper states for the sequential saving
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [recordId, setRecordId] = useState<string | null>(null)
	const [latestCallHistoryId, setLatestCallHistoryId] = useState<string | null>(null)
	const [completedSections, setCompletedSections] = useState({
		personal: false,
		course: false,
		admission: false,
	})
	// When editing a pitch-pending call, this holds the returnedFrom value to control which accordions show
	const [editReturnedFrom, setEditReturnedFrom] = useState<string | null>(null)
	// Tracks which personal detail fields came pre-filled from DB (should be disabled)
	const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({})

	// Personal Details State
	const [personalDetails, setPersonalDetails] = useState({
		firstName: initialPersonalDetails.name || '',
		gender: initialPersonalDetails.gender || 'MALE',
		email: initialPersonalDetails.email || '',
		mobile: initialPersonalDetails.mobile || '',
		age: initialPersonalDetails.age || '',
		education: initialPersonalDetails.education || '10th',
		job:
			String(initialPersonalDetails.job) === 'true'
				? 'Yes'
				: String(initialPersonalDetails.job) === 'false'
				? 'No'
				: initialPersonalDetails.job || 'Yes',
		financialSituation: initialPersonalDetails.financialSituation || 'High',
		additional_note: initialPersonalDetails.additional_note || '',
		ad_name: adNameFromUrl,
		lead_created_at: leadCreatedAtFromUrl,
	})

	// Course Details State
	const [courseDetails, setCourseDetails] = useState({
		course: '',
		course_mode: '',
		course_duration: '',
		course_amount: '',
		final_amount: '',
		payment_method: 'Online',
		sales_script: '',
	})

	// Admission Form State
	const [admissionForm, setAdmissionForm] = useState({
		firstName: '',
		lastName: '',
		address: '',
		country: '',
		state: '',
		city: '',
		pinCode: '',
		phone: '',
		email: '',
		dateOfBirth: '',
		age: '',
		course: '',
		reference: '',
		aadhaarCardFront: null as File | null,
		aadhaarCardBack: null as File | null,
		marksheet: null as File | null,
		photo: null as File | null,
	})

	// Pitch Report State
	const [pitchReport, setPitchReport] = useState({
		telecaller_name: '',
		interest_level: 'LOW',
		follow_up_date: '',
		call_recording: null as File | null,
		objections: '',
	})

	useEffect(() => {
		const id = queryParams.get('id')
		const callHistoryIdFromUrl = queryParams.get('callHistoryId')
		if (!id) return

		setRecordId(id)

		if (isPitchPending) {
			setEditReturnedFrom(returnedFromUrl)
		}

		const fetchDraftData = async () => {
			try {
				const response = await GetFgiitFollowUpReport({ id })
				// Handle both response.data.data[] and response.data[] formats
				const rawArray: any[] = Array.isArray(response?.data?.data)
					? response.data.data
					: Array.isArray(response?.data)
					? response.data
					: []

				if (response.status === 200 && rawArray.length > 0) {
					const data = rawArray[0]

					// When pitchPending=true, find the specific call by callHistoryId
					const targetCall =
						isPitchPending && callHistoryIdFromUrl
							? data.callHistory?.find((c: any) => c._id === callHistoryIdFromUrl) ||
							  data.callHistory?.[data.callHistory.length - 1]
							: data.callHistory?.[data.callHistory.length - 1]
					const lastCall = targetCall || null

					// If pitchPending, use the callHistoryId from the URL directly
					if (isPitchPending && callHistoryIdFromUrl) {
						setLatestCallHistoryId(callHistoryIdFromUrl)
					} else {
						// If the last follow-up is already completed, we're starting a NEW follow-up.
						const isLastCompleted = lastCall?.is_completed === true
						setLatestCallHistoryId(isLastCompleted ? null : lastCall?._id || null)
					}

					const sections = { personal: false, course: false, admission: false, pitch: false }

					// Aggregated data from entire history to prevent data loss
					const callHistoryReversed = [...(data.callHistory || [])].reverse()

					// 1. Find most recent Course Details with data
					const callWithCourse = callHistoryReversed.find(
						(c: any) => c.courseDetails && (c.courseDetails.course || c.courseDetails.is_skipped)
					)
					const effectiveCourseDetails = callWithCourse?.courseDetails || {}

					// 2. Find most recent Admission Form with data
					const callWithAdmission = callHistoryReversed.find(
						(c: any) => c.admissionForm && (c.admissionForm.firstName || c.admissionForm.is_skipped)
					)
					const effectiveAdmissionForm = callWithAdmission?.admissionForm || {}

					if (data.personalDetails) {
						const pd = data.personalDetails
						const firstName = pd.firstName || pd.client_name || ''
						const gender = pd.gender || 'MALE'
						const email = pd.email || ''
						const mobile = pd.mobile || pd.phone || ''
						const age = pd.age || ''
						const education = pd.education || '10th'
						const job = pd.job === 'true' ? 'Yes' : pd.job === 'false' ? 'No' : pd.job || 'Yes'
						const financialSituation = pd.financialSituation || 'High'
						const additional_note = pd.additional_note || ''

						setPersonalDetails({
							firstName,
							gender,
							email,
							mobile,
							age,
							education,
							job,
							financialSituation,
							additional_note,
							ad_name: pd.ad_name && pd.ad_name !== 'N/A' ? pd.ad_name : adNameFromUrl,
							lead_created_at:
								pd.lead_created_at && pd.lead_created_at !== 'N/A'
									? pd.lead_created_at
									: leadCreatedAtFromUrl,
						})

						setLockedFields({
							// For PULL_MARKETING leads, name & email are NOT locked so telecaller can fill them in
							firstName: isPullMarketing ? false : !!firstName,
							email: isPullMarketing ? false : !!pd.email,
							mobile: !!mobile,
							gender: !!pd.gender,
							age: !!pd.age,
							education: !!pd.education,
							job: !!pd.job,
							financialSituation: !!pd.financialSituation,
						})

						sections.personal = data.callHistory && data.callHistory.length > 0
					}

					// Prefill Course Details from aggregated history
					if (Object.keys(effectiveCourseDetails).length > 0) {
						setCourseDetails({
							course: effectiveCourseDetails.course || '',
							course_mode: effectiveCourseDetails.course_mode || '',
							course_duration: effectiveCourseDetails.course_duration || '',
							course_amount: effectiveCourseDetails.course_amount || '',
							final_amount: effectiveCourseDetails.final_amount || '',
							payment_method: effectiveCourseDetails.payment_method || 'Online',
							sales_script: effectiveCourseDetails.sales_script || '',
						})
						sections.course = !!effectiveCourseDetails.course || !!effectiveCourseDetails.is_skipped
					}

					// Prefill Admission Form from aggregated history
					if (Object.keys(effectiveAdmissionForm).length > 0) {
						setAdmissionForm({
							firstName: effectiveAdmissionForm.firstName || '',
							lastName: effectiveAdmissionForm.lastName || '',
							address: effectiveAdmissionForm.address?.address_line_1 || '',
							country: effectiveAdmissionForm.address?.country || '',
							state: effectiveAdmissionForm.address?.state || '',
							city: effectiveAdmissionForm.address?.city || '',
							pinCode: effectiveAdmissionForm.address?.pin_code || '',
							phone: effectiveAdmissionForm.phone || '',
							email: effectiveAdmissionForm.email || '',
							dateOfBirth: effectiveAdmissionForm.dateOfBirth
								? new Date(effectiveAdmissionForm.dateOfBirth).toISOString().split('T')[0]
								: '',
							age: effectiveAdmissionForm.age || '',
							course: effectiveAdmissionForm.course || '',
							reference: effectiveAdmissionForm.reference || '',
							aadhaarCardFront: effectiveAdmissionForm.aadhaarCardFront || null,
							aadhaarCardBack: effectiveAdmissionForm.aadhaarCardBack || null,
							marksheet: effectiveAdmissionForm.marksheet || null,
							photo: effectiveAdmissionForm.photo || null,
						})
						sections.admission =
							!!effectiveAdmissionForm.firstName || !!effectiveAdmissionForm.is_skipped

						// Fetch cascaded options if we have them
						if (effectiveAdmissionForm.address?.country) {
							fetchStates(effectiveAdmissionForm.address.country)
							if (effectiveAdmissionForm.address?.state) {
								fetchCities(
									effectiveAdmissionForm.address.country,
									effectiveAdmissionForm.address.state
								)
							}
						}
					}

					let isLastCallIncomplete = false
					if (lastCall && !lastCall.is_completed) {
						const hasPitch = Boolean(lastCall.pitchReport?.telecaller_name)
						isLastCallIncomplete = !hasPitch
					}

					if (isPitchPending) {
						const rf = returnedFromUrl
						const isCourseReturn = rf === 'Course Details'
						const isAdmissionReturn = rf === 'Admission Form'

						setCompletedSections({
							personal: true,
							course: isCourseReturn, // course is done if it was the return point
							admission: isAdmissionReturn, // admission is done if it was the return point
						})

						setTimeout(() => {
							// Always collapse everything first
							;[
								'kt_oder_view_analysis',
								'kt_oder_view_course_details',
								'kt_admission_form_details',
								'kt_oder_view_pitch_report',
							].forEach((elId) => {
								const el = document.getElementById(elId)
								if (el) el.classList.remove('show')
							})
							// Open only pitch report — user only needs to fill this
							const pitchEl = document.getElementById('kt_oder_view_pitch_report')
							if (pitchEl) pitchEl.classList.add('show')
						}, 100)
					} else {
						// Normal flow: expand the first incomplete section
						setCompletedSections(sections)

						setTimeout(() => {
							const sectionsList = [
								{ isDone: sections.personal, elId: 'kt_oder_view_analysis' },
								{ isDone: sections.course, elId: 'kt_oder_view_course_details' },
								{ isDone: sections.admission, elId: 'kt_admission_form_details' },
								{ isDone: sections.pitch, elId: 'kt_oder_view_pitch_report' },
							]

							let foundActive = false
							sectionsList.forEach((sec) => {
								const el = document.getElementById(sec.elId)
								if (el) {
									if (!foundActive && !sec.isDone) {
										el.classList.add('show')
										foundActive = true
									} else {
										el.classList.remove('show')
									}
								}
							})
						}, 100)
					}
				}
			} catch (error) {
				console.error('Error fetching existing drafted follow-up report', error)
			}
		}

		fetchDraftData()
	}, [location])

	// API Handlers
	const handleCreateReport = async () => {
		if (isSubmitting) return

		// If record already exists (navigated with ?id=), update personal details then advance
		if (recordId) {
			setIsSubmitting(true)
			try {
				const submitPersonalDetails = { ...personalDetails }
				if (!submitPersonalDetails.email) {
					delete (submitPersonalDetails as any).email
				}
				delete (submitPersonalDetails as any).financialSituation

				await UpdateFgiitPersonalDetails({ id: recordId, personalDetails: submitPersonalDetails })
				toast.success('Personal details updated')
			} catch (err) {
				console.error('Failed to update personal details', err)
				toast.error('Failed to update personal details')
			} finally {
				setIsSubmitting(false)
			}
			const currentElement = document.getElementById('kt_oder_view_analysis')
			const nextElement = document.getElementById('kt_oder_view_course_details')
			if (currentElement) currentElement.classList.remove('show')
			if (nextElement) nextElement.classList.add('show')
			return
		}

		setIsSubmitting(true)

		try {
			const submitPersonalDetails = { ...personalDetails }
			if (!submitPersonalDetails.email) {
				delete (submitPersonalDetails as any).email
			}
			delete (submitPersonalDetails as any).financialSituation

			const response = await CreateFgiitFollowUpReport({ personalDetails: submitPersonalDetails })
			if (Number(response.status) === 201 || Number(response.status) === 200) {
				setRecordId(response.data._id)
				// Open next section
				const currentElement = document.getElementById('kt_oder_view_analysis')
				const nextElement = document.getElementById('kt_oder_view_course_details')
				if (currentElement) currentElement.classList.remove('show')
				if (nextElement) nextElement.classList.add('show')
				toast.success('Personal details saved')
			} else {
				toast.error(response.message || 'Failed to save personal details')
			}
		} catch (error) {
			toast.error('An error occurred while saving')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdateCourseDetails = async () => {
		if (isSubmitting || !recordId) return

		// Validation
		if (
			!courseDetails.course ||
			!courseDetails.course_duration ||
			!courseDetails.course_amount ||
			!courseDetails.final_amount
		) {
			toast.error('Please fill all required course details or skip this section')
			return
		}

		setIsSubmitting(true)

		try {
			const response = await UpdateFgiitCourseDetails({
				id: recordId,
				callHistoryId: latestCallHistoryId,
				courseDetails,
			})
			if (Number(response.status) === 200) {
				setLatestCallHistoryId(response.data.latestCallHistoryId)
				setCompletedSections((prev) => ({ ...prev, course: true }))
				// Open next section: Admission Form
				const currentElement = document.getElementById('kt_oder_view_course_details')
				const nextElement = document.getElementById('kt_admission_form_details')
				if (currentElement) currentElement.classList.remove('show')
				if (nextElement) nextElement.classList.add('show')
				toast.success('Course details updated')
			} else {
				toast.error(response.message || 'Failed to update course details')
			}
		} catch (error) {
			toast.error('An error occurred while updating course details')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSkipCourseDetails = async () => {
		if (isSubmitting || !recordId) return
		setIsSubmitting(true)

		try {
			const response = await UpdateFgiitCourseDetails({
				id: recordId,
				callHistoryId: latestCallHistoryId,
				courseDetails: { is_skipped: true },
			})
			if (Number(response.status) === 200) {
				setLatestCallHistoryId(response.data.latestCallHistoryId)
				setCompletedSections((prev) => ({ ...prev, course: true }))
				// Open next section: Admission Form
				const currentElement = document.getElementById('kt_oder_view_course_details')
				const nextElement = document.getElementById('kt_admission_form_details')
				if (currentElement) currentElement.classList.remove('show')
				if (nextElement) nextElement.classList.add('show')
				toast.success('Course details skipped')
			} else {
				toast.error(response.message || 'Failed to skip course details')
			}
		} catch (error) {
			toast.error('An error occurred while skipping course details')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSaveAdmissionForm = async () => {
		if (isSubmitting || !recordId) return

		// Validation
		if (
			!admissionForm.firstName ||
			!admissionForm.address ||
			!admissionForm.country ||
			!admissionForm.state ||
			!admissionForm.city ||
			!admissionForm.phone
		) {
			toast.error('Please fill all required admission details or skip this section')
			return
		}

		setIsSubmitting(true)

		try {
			// Upload files first if any
			const docFields = ['aadhaarCardFront', 'aadhaarCardBack', 'marksheet', 'photo']
			const docUrls: any = {
				aadhaarCardFront:
					typeof admissionForm.aadhaarCardFront === 'string' ? admissionForm.aadhaarCardFront : '',
				aadhaarCardBack:
					typeof admissionForm.aadhaarCardBack === 'string' ? admissionForm.aadhaarCardBack : '',
				marksheet: typeof admissionForm.marksheet === 'string' ? admissionForm.marksheet : '',
				photo: typeof admissionForm.photo === 'string' ? admissionForm.photo : '',
			}

			for (const field of docFields) {
				const file = (admissionForm as any)[field]
				if (file instanceof File) {
					try {
						const res: any = await FileUploadToFGGroup(file, { directory: 'contact-inquiry' })
						let uploadedUrl = res?.data?.fileURLs?.[0]
						if (uploadedUrl) {
							if (!uploadedUrl.startsWith('http')) {
								uploadedUrl = `https://files.fggroup.in/${uploadedUrl}`
							}
							docUrls[field] = uploadedUrl
						}
					} catch (err) {
						console.error(`Failed to upload ${field}`, err)
					}
				}
			}

			const {
				address,
				city,
				state,
				country,
				pinCode,
				aadhaarCardFront,
				aadhaarCardBack,
				marksheet,
				photo,
				...restData
			} = admissionForm

			const formattedAdmissionForm: any = {
				...restData,
				...docUrls,
				address: {
					address_line_1: address || '',
					city: city || '',
					state: state || '',
					country: country || '',
					pin_code: pinCode || '',
				},
			}

			if (!formattedAdmissionForm.email) {
				delete formattedAdmissionForm.email
			}

			const { follow_up_date, call_recording, ...restPitchReport } = pitchReport
			const payloadPitchReport: any = { ...restPitchReport }
			if (pitchReport.follow_up_date) {
				payloadPitchReport.pitch_follow_up_date = pitchReport.follow_up_date
			}

			const response = await UpdateFgiitAdmissionForm({
				id: recordId,
				callHistoryId: latestCallHistoryId,
				admissionForm: formattedAdmissionForm,
				pitchReport: payloadPitchReport,
			})
			if (Number(response.status) === 200) {
				setLatestCallHistoryId(response.data.latestCallHistoryId)
				setCompletedSections((prev) => ({ ...prev, admission: true }))
				// Open next section
				const currentElement = document.getElementById('kt_admission_form_details')
				const nextElement = document.getElementById('kt_oder_view_pitch_report')
				if (currentElement) currentElement.classList.remove('show')
				if (nextElement) nextElement.classList.add('show')
				toast.success('Admission form saved')
			} else {
				toast.error(response.message || 'Failed to save admission form')
			}
		} catch (error) {
			toast.error('An error occurred during admission submission')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSkipAdmissionForm = async () => {
		if (isSubmitting || !recordId) return
		setIsSubmitting(true)

		try {
			const response = await UpdateFgiitAdmissionForm({
				id: recordId,
				callHistoryId: latestCallHistoryId,
				admissionForm: { is_skipped: true },
			})
			if (Number(response.status) === 200) {
				setLatestCallHistoryId(response.data.latestCallHistoryId)
				setCompletedSections((prev) => ({ ...prev, admission: true }))
				// Open next section
				const currentElement = document.getElementById('kt_admission_form_details')
				const nextElement = document.getElementById('kt_oder_view_pitch_report')
				if (currentElement) currentElement.classList.remove('show')
				if (nextElement) nextElement.classList.add('show')
				toast.success('Admission form skipped')
			} else {
				toast.error(response.message || 'Failed to skip admission form')
			}
		} catch (error) {
			toast.error('An error occurred while skipping admission form')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSavePitchReport = async () => {
		if (isSubmitting || !recordId) return
		setIsSubmitting(true)

		try {
			const { follow_up_date, call_recording, ...restPitchReport } = pitchReport
			const payloadPitchReport: any = { ...restPitchReport }
			if (pitchReport.follow_up_date) {
				payloadPitchReport.pitch_follow_up_date = pitchReport.follow_up_date
			}

			// Upload audio recording if a new file was selected (optional)
			if (call_recording instanceof File) {
				try {
					const audioRes: any = await FileUploadToFGGroup(call_recording, {
						directory: 'call-recordings',
					})
					let audioUrl = audioRes?.data?.fileURLs?.[0]
					if (audioUrl) {
						if (!audioUrl.startsWith('http')) audioUrl = `https://files.fggroup.in/${audioUrl}`
						payloadPitchReport.call_recording = audioUrl
					}
				} catch (audioErr) {
					console.error('Failed to upload call recording', audioErr)
				}
			} else {
				payloadPitchReport.call_recording = typeof call_recording === 'string' ? call_recording : ''
			}

			const payloadToUpdate: any = {
				id: recordId,
				pitchReport: payloadPitchReport,
			}
			if (latestCallHistoryId) {
				payloadToUpdate.callHistoryId = latestCallHistoryId
			}

			const response = await UpdateFgiitPitchReport(payloadToUpdate)
			if (Number(response.status) === 200) {
				toast.success('Report completed successfully')
				const finalParams = new URLSearchParams()
				finalParams.append('id', recordId)
				if (personalDetails.ad_name && personalDetails.ad_name !== 'N/A')
					finalParams.append('ad_name', personalDetails.ad_name)
				if (personalDetails.lead_created_at && personalDetails.lead_created_at !== 'N/A')
					finalParams.append('lead_created_at', personalDetails.lead_created_at)
				const platform = queryParams.get('platform')
				if (platform && platform !== 'N/A') finalParams.append('platform', platform)

				navigate(`/fgiit-tele-sales/follow-up-report-inner-list?${finalParams.toString()}`)
			} else {
				toast.error(response.message || 'Failed to save pitch report')
			}
		} catch (error) {
			toast.error('An error occurred while saving the pitch report')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Address state variables
	const [countries, setCountries] = useState<Country[]>([])
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [loadingCountries, setLoadingCountries] = useState(false)
	const [loadingStates, setLoadingStates] = useState(false)
	const [loadingCities, setLoadingCities] = useState(false)

	const courseOptions = [
		'Anabolic Androgenic Steroids',
		'Diploma In Nutrition Course',
		'Nutri Trainer',
		'Injury Rehabilitation Masterclass',
		'Group Instructor Masterclass',
		'Advance Clinical Nutrition',
		'Functional Training Workshop',
		'Diploma In Personal Training',
		'Powerlifting Coach Workshop',
		'Gym Management Course',
		'Digital Marketing',
	]

	const renderAdditionalNoteFields = () => {
		if (!personalDetails.additional_note) return null
		return (
			<div className='col-md-12 mb-7'>
				<div className='card bg-light-primary border border-primary border-dashed rounded p-5'>
					<h5 className='text-primary fw-bold mb-3'>Lead Answers / Additional Notes</h5>
					<div className='d-flex flex-column gap-2'>
						{personalDetails.additional_note.split(' | ').map((note: string, index: number) => {
							const [key, ...values] = note.split(':')
							const val = values.join(':').trim()
							if (!key) return null
							return (
								<div
									key={index}
									className='d-flex align-items-start'>
									<span className='bullet bullet-dot bg-primary me-2 mt-2'></span>
									<div>
										<span className='fw-bold text-gray-800 me-2'>{key.trim()}:</span>
										<span className='text-gray-600'>{val || '-'}</span>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		)
	}

	// Handle input changes for personal details
	const handlePersonalDetailsChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setPersonalDetails((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	// Handle input changes for Course Details
	const handleCourseDetailsChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setCourseDetails((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	// Handle input changes for admission form
	const handleAdmissionFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target

		// Handle country change - fetch states when country changes
		if (name === 'country') {
			setAdmissionForm((prev) => ({
				...prev,
				country: value,
				state: '',
				city: '',
			}))
			fetchStates(value)
			setStates([])
			setCities([])
			return
		}

		// Handle state change - fetch cities when state changes
		if (name === 'state') {
			setAdmissionForm((prev) => ({
				...prev,
				state: value,
				city: '',
			}))
			const selectedState = states.find((state) => state.name === value)
			if (selectedState && admissionForm.country) {
				fetchCities(admissionForm.country, selectedState.name)
			}
			setCities([])
			return
		}

		setAdmissionForm((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	// Address API functions
	const fetchCountries = async () => {
		setLoadingCountries(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries')
			const data = await response.json()
			if (data && data.data) {
				const countriesData = data.data.map((country: any) => ({
					id: country.iso2,
					name: country.country,
					iso2: country.iso2,
				}))
				setCountries(countriesData)
			}
		} catch (error) {
			console.error('Error fetching countries:', error)
			toast.error('Failed to load countries')
		} finally {
			setLoadingCountries(false)
		}
	}

	const fetchStates = async (countryCode: string) => {
		if (!countryCode) {
			setStates([])
			setCities([])
			return
		}

		setLoadingStates(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ country: countryCode }),
			})
			const data = await response.json()
			if (data && data.data && data.data.states) {
				const statesData = data.data.states.map((state: any, index: number) => ({
					id: index,
					name: state.name,
					country_id: 0,
					country_code: countryCode,
					state_code: state.state_code || '',
				}))
				setStates(statesData)
			}
		} catch (error) {
			console.error('Error fetching states:', error)
			toast.error('Failed to load states')
		} finally {
			setLoadingStates(false)
		}
	}

	const fetchCities = async (countryCode: string, stateName: string) => {
		if (!countryCode || !stateName) {
			setCities([])
			return
		}

		setLoadingCities(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					country: countryCode,
					state: stateName,
				}),
			})
			const data = await response.json()
			if (data && data.data) {
				const citiesData = data.data.map((city: string, index: number) => ({
					id: index,
					name: city,
					state_id: 0,
					state_code: '',
					country_id: 0,
					country_code: countryCode,
					latitude: '',
					longitude: '',
				}))
				setCities(citiesData)
			}
		} catch (error) {
			console.error('Error fetching cities:', error)
			toast.error('Failed to load cities')
		} finally {
			setLoadingCities(false)
		}
	}

	// Load countries
	useEffect(() => {
		fetchCountries()
	}, [])

	// Handle input changes for Pitch Report
	const handlePitchReportChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setPitchReport((prev) => ({
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

	const handleRemoveAdmissionFile = (name: string) => {
		setAdmissionForm((prev) => ({
			...prev,
			[name]: null,
		}))
		// Reset input value if needed but since we hide it, it naturally resets
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

	let admissionFormLink = ''
	if (window.location.hostname === 'localhost') {
		admissionFormLink = `http://localhost:3001/fgiit/admission-form?id=${recordId}`
	} else {
		admissionFormLink = `https://fggroup.in/fgiit/admission-form?id=${recordId}`
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
			<PageTitle breadcrumbs={[]}>Follow Up Report (Add)</PageTitle>

			{/* Personal Details */}
			<div className='col-12'>
				<div className='card section-card mt-5'>
					<div
						className='section-header'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_analysis'>
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
						id='kt_oder_view_analysis'
						className='collapse show'>
						<div className='section-body'>
							<div className='field-group-title'>
								<i className='bi bi-person'></i>
								Basic Information
							</div>
							<div className='row'>
								{renderAdditionalNoteFields()}
								<InputField
									placeholder='Enter Fullname'
									type='text'
									className='col-md-6 fv-row'
									name='firstName'
									label='Fullname'
									htmlFor='fullname'
									value={personalDetails.firstName}
									onChange={handlePersonalDetailsChange}
									disabled={completedSections.personal || !!lockedFields.firstName}
								/>
								<InputField
									placeholder='Enter Email'
									type='email'
									className='col-md-6 fv-row'
									name='email'
									label='Email'
									htmlFor='email'
									value={personalDetails.email}
									onChange={handlePersonalDetailsChange}
									disabled={completedSections.personal || !!lockedFields.email}
								/>
								<InputField
									placeholder='Gender'
									type='text'
									className='col-md-6 fv-row mb-7'
									name='gender'
									label='Gender'
									htmlFor='gender'
									value={personalDetails.gender}
									onChange={handlePersonalDetailsChange}
									disabled={completedSections.personal || !!lockedFields.gender}
								/>

								<InputField
									placeholder='Enter Mobile Number'
									type='tel'
									className='col-md-6 fv-row'
									name='mobile'
									label='Mobile Number'
									htmlFor='mobile'
									value={personalDetails.mobile.toString()}
									onChange={handlePersonalDetailsChange}
									disabled={completedSections.personal || !!lockedFields.mobile}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Education'
									name='education'
									value={personalDetails.education}
									onChange={handlePersonalDetailsChange}
									htmlFor='education'
									disabled={completedSections.personal || !!lockedFields.education}
									options={[
										'10th Pass',
										'12th Pass',
										'Diploma',
										'ITI',
										'Graduate',
										'B.A',
										'B.Com',
										'B.Sc',
										'BBA',
										'BCA',
										'B.Tech',
										'BE',
										'Post Graduate',
										'M.A',
										'M.Com',
										'M.Sc',
										'MBA',
										'MCA',
										'M.Tech',
										'PhD',
										'Dropout',
										'Other',
									]}
								/>
								<SelectField
									value={personalDetails.job}
									onChange={handlePersonalDetailsChange}
									className='col-md-6 fv-row mb-7'
									label='Job'
									name='job'
									htmlFor='job'
									options={['Yes', 'No']}
									disabled={completedSections.personal || !!lockedFields.job}
								/>
							</div>

							{!completedSections.personal && (
								<div className='col-md-12 mt-2 mb-7'>
									<div className='d-flex justify-content-end'>
										<TableButton
											action='add'
											text='Next'
											showIcon={false}
											backgroundDark={true}
											onClick={handleCreateReport}
											disabled={isSubmitting}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Course Details */}
			{!(isPitchPending && returnedFromUrl === 'Admission Form') && (
				<div className='col-12'>
					<div className='card section-card'>
						<div
							className='section-header'
							role='button'
							data-bs-toggle='collapse'
							data-bs-target='#kt_oder_view_course_details'>
							<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
								<h3>
									<span
										className='header-icon'
										style={{ background: '#e8f5e9', color: '#388e3c' }}>
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
							id='kt_oder_view_course_details'
							className='collapse'>
							<div className='section-body'>
								<div className='field-group-title'>
									<i className='bi bi-book'></i>
									Academic Selection
								</div>
								<div className='row'>
									<div className='col-md-8 fv-row mb-7'>
										<SelectField
											className='col-md-12 fv-row mb-7'
											label='Course'
											name='course'
											value={courseDetails.course}
											onChange={handleCourseDetailsChange}
											htmlFor='course'
											options={courseOptions}
											disabled={completedSections.course}
										/>
									</div>
									<div className='col-md-4 fv-row mb-7'>
										<SelectField
											className='col-md-12 fv-row mb-7'
											label='Mode'
											name='course_mode'
											value={courseDetails.course_mode}
											onChange={handleCourseDetailsChange}
											htmlFor='course_mode'
											options={['Offline', 'Online', 'Flexible']}
											disabled={completedSections.course}
										/>
									</div>
									<div className='col-md-3 fv-row mb-7'>
										<InputField
											placeholder='course Duration'
											type='text'
											className='col-md-12 fv-row'
											label='Duration'
											name='course_duration'
											htmlFor='course_duration'
											value={courseDetails.course_duration}
											onChange={handleCourseDetailsChange}
											disabled={completedSections.course}
										/>
									</div>
									<div className='col-md-3 fv-row mb-7'>
										<InputField
											placeholder='Course Fees'
											type='number'
											className='col-md-12 fv-row'
											label='Course Fees'
											name='course_amount'
											htmlFor='course_amount'
											value={courseDetails.course_amount}
											onChange={handleCourseDetailsChange}
											disabled={completedSections.course}
										/>
									</div>
									<div className='col-md-3 fv-row mb-7'>
										<InputField
											placeholder='Final Pitched Fees'
											type='number'
											className='col-md-12 fv-row'
											label='Final Pitched Fees'
											name='final_amount'
											htmlFor='final_amount'
											value={courseDetails.final_amount}
											onChange={handleCourseDetailsChange}
											disabled={completedSections.course}
										/>
									</div>
									<div className='col-md-3 fv-row mb-7'>
										<SelectField
											className='col-md-12 fv-row mb-7'
											label='Interested Payment Method'
											name='payment_method'
											value={courseDetails.payment_method}
											onChange={handleCourseDetailsChange}
											htmlFor='payment_method'
											options={['Online', 'Cash', 'SaveIn']}
											disabled={completedSections.course}
										/>
									</div>

									<div className='col-md-12 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6'>Sales Script</label>
										<textarea
											className='remarks-textarea'
											rows={10}
											placeholder='Sales script for selected course'
											value={courseDetails.sales_script}
											onChange={(e) =>
												setCourseDetails({ ...courseDetails, sales_script: e.target.value })
											}
											name='sales_script'
											disabled={completedSections.course}
										/>
									</div>

									{!completedSections.course && (
										<div className='col-md-12 mt-5 mb-7'>
											<div className='d-flex justify-content-end gap-3'>
												<button
													className='btn btn-secondary fw-bolder'
													onClick={handleSkipCourseDetails}
													disabled={isSubmitting}>
													Skip
												</button>
												<TableButton
													action='add'
													text='Next'
													showIcon={false}
													backgroundDark={true}
													onClick={handleUpdateCourseDetails}
													disabled={isSubmitting}
												/>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Admission Form */}
			{!(isPitchPending && returnedFromUrl === 'Course Details') && (
				<div className='col-12 mt-8'>
					<div className='card section-card'>
						<div
							className='section-header'
							role='button'
							data-bs-toggle='collapse'
							data-bs-target='#kt_admission_form_details'>
							<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
								<h3>
									<span
										className='header-icon'
										style={{ background: '#fff8e1', color: '#ffa000' }}>
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
							id='kt_admission_form_details'
							className='collapse'>
							<div className='section-body'>
								<div className='field-group-title'>
									<i className='bi bi-info-circle'></i>
									Personal & Academic
								</div>
								<div className='row'>
									<InputField
										placeholder='First Name'
										type='text'
										className='col-md-6 fv-row mb-7'
										name='firstName'
										label='First Name'
										htmlFor='firstName'
										value={admissionForm.firstName}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<InputField
										placeholder='Last Name'
										type='text'
										className='col-md-6 fv-row mb-7'
										name='lastName'
										label='Last Name'
										htmlFor='lastName'
										value={admissionForm.lastName}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<SelectField
										className='col-md-4 fv-row mb-7'
										label='Country'
										name='country'
										htmlFor='country'
										options={countries.map((c) => c.name)}
										value={admissionForm.country}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<SelectField
										className='col-md-4 fv-row mb-7'
										label='State'
										name='state'
										htmlFor='state'
										options={states.map((s) => s.name)}
										value={admissionForm.state}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<SelectField
										className='col-md-4 fv-row mb-7'
										label='City'
										name='city'
										htmlFor='city'
										options={cities.map((ci) => ci.name)}
										value={admissionForm.city}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<InputField
										placeholder='Address'
										type='text'
										className='col-md-8 fv-row mb-7'
										name='address'
										label='Address'
										htmlFor='address'
										value={admissionForm.address}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<InputField
										placeholder='Pin Code'
										type='number'
										className='col-md-4 fv-row mb-7'
										name='pinCode'
										label='Pin Code'
										htmlFor='pinCode'
										value={admissionForm.pinCode}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<InputField
										placeholder='Phone Number'
										type='tel'
										className='col-md-6 fv-row mb-7'
										name='phone'
										label='Phone Number'
										htmlFor='phone'
										value={admissionForm.phone}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<InputField
										placeholder='Email ID'
										type='email'
										className='col-md-6 fv-row mb-7'
										name='email'
										label='Email ID'
										htmlFor='email'
										value={admissionForm.email}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<InputField
										placeholder='Date of Birth'
										type='date'
										className='col-md-6 fv-row mb-7'
										name='dateOfBirth'
										label='Date of Birth'
										htmlFor='dateOfBirth'
										value={admissionForm.dateOfBirth}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<InputField
										placeholder='Age'
										type='number'
										className='col-md-6 fv-row mb-7'
										name='age'
										label='Age'
										htmlFor='age'
										value={admissionForm.age}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<SelectField
										className='col-md-6 fv-row mb-7'
										label='Course'
										name='course'
										htmlFor='course'
										options={courseOptions}
										value={admissionForm.course}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>
									<InputField
										placeholder='Reference'
										type='text'
										className='col-md-6 fv-row mb-7'
										name='reference'
										label='Reference'
										htmlFor='reference'
										value={admissionForm.reference}
										onChange={handleAdmissionFormChange}
										disabled={completedSections.admission}
									/>

									<div className='divider-line'></div>

									<div className='field-group-title'>
										<i className='bi bi-cloud-arrow-up'></i>
										Document Uploads
									</div>

									{/* Aadhaar Card Front */}
									<div className='col-md-3 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6'>
											Aadhaar Card (Front)
										</label>
										{admissionForm.aadhaarCardFront ? (
											<div className='position-relative mt-2 w-100'>
												<div
													className='border border-secondary rounded overflow-hidden'
													style={{
														height: '180px',
														backgroundColor: '#f8f9fa',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}>
													{(() => {
														const url =
															typeof admissionForm.aadhaarCardFront === 'string'
																? admissionForm.aadhaarCardFront
																: URL.createObjectURL(admissionForm.aadhaarCardFront)
														if (url.toLowerCase().endsWith('.pdf')) {
															return (
																<div className='text-center'>
																	<i className='bi bi-file-earmark-pdf text-danger fs-1'></i>
																	<div className='fs-7 fw-bold mt-2'>PDF Selected</div>
																</div>
															)
														}
														return (
															<img
																src={url}
																alt='Aadhaar Front Preview'
																className='img-fluid'
																style={{
																	maxHeight: '100%',
																	maxWidth: '100%',
																	objectFit: 'contain',
																}}
															/>
														)
													})()}
												</div>
												{typeof admissionForm.aadhaarCardFront !== 'string' && (
													<button
														className='btn btn-icon btn-sm btn-danger position-absolute'
														onClick={() => handleRemoveAdmissionFile('aadhaarCardFront')}
														disabled={completedSections.admission}
														type='button'
														style={{
															top: '5px',
															right: '5px',
															width: '28px',
															height: '28px',
															borderRadius: '50%',
															boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
															zIndex: 10,
														}}>
														<i
															className='bi bi-x fs-5'
															style={{ lineHeight: 0 }}></i>
													</button>
												)}
											</div>
										) : (
											<input
												type='file'
												name='aadhaarCardFront'
												className='form-control form-control-solid'
												onChange={handleAdmissionFileChange}
												disabled={completedSections.admission}
												accept='image/*,application/pdf'
											/>
										)}
									</div>
									{/* Aadhaar Card Back */}
									<div className='col-md-3 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6'>
											Aadhaar Card (Back)
										</label>
										{admissionForm.aadhaarCardBack ? (
											<div className='position-relative mt-2 w-100'>
												<div
													className='border border-secondary rounded overflow-hidden'
													style={{
														height: '180px',
														backgroundColor: '#f8f9fa',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}>
													{(() => {
														const url =
															typeof admissionForm.aadhaarCardBack === 'string'
																? admissionForm.aadhaarCardBack
																: URL.createObjectURL(admissionForm.aadhaarCardBack)
														if (url.toLowerCase().endsWith('.pdf')) {
															return (
																<div className='text-center'>
																	<i className='bi bi-file-earmark-pdf text-danger fs-1'></i>
																	<div className='fs-7 fw-bold mt-2'>PDF Selected</div>
																</div>
															)
														}
														return (
															<img
																src={url}
																alt='Aadhaar Back Preview'
																className='img-fluid'
																style={{
																	maxHeight: '100%',
																	maxWidth: '100%',
																	objectFit: 'contain',
																}}
															/>
														)
													})()}
												</div>
												{typeof admissionForm.aadhaarCardBack !== 'string' && (
													<button
														className='btn btn-icon btn-sm btn-danger position-absolute'
														onClick={() => handleRemoveAdmissionFile('aadhaarCardBack')}
														disabled={completedSections.admission}
														type='button'
														style={{
															top: '5px',
															right: '5px',
															width: '28px',
															height: '28px',
															borderRadius: '50%',
															boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
															zIndex: 10,
														}}>
														<i
															className='bi bi-x fs-5'
															style={{ lineHeight: 0 }}></i>
													</button>
												)}
											</div>
										) : (
											<input
												type='file'
												name='aadhaarCardBack'
												className='form-control form-control-solid'
												onChange={handleAdmissionFileChange}
												disabled={completedSections.admission}
												accept='image/*,application/pdf'
											/>
										)}
									</div>
									<div className='col-md-3 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6'>Marksheet</label>
										{admissionForm.marksheet ? (
											<div className='position-relative mt-2 w-100'>
												<div
													className='border border-secondary rounded overflow-hidden'
													style={{
														height: '180px',
														backgroundColor: '#f8f9fa',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}>
													{(() => {
														const url =
															typeof admissionForm.marksheet === 'string'
																? admissionForm.marksheet
																: URL.createObjectURL(admissionForm.marksheet)
														if (url.toLowerCase().endsWith('.pdf')) {
															return (
																<div className='text-center'>
																	<i className='bi bi-file-earmark-pdf text-danger fs-1'></i>
																	<div className='fs-7 fw-bold mt-2'>PDF Selected</div>
																</div>
															)
														}
														return (
															<img
																src={url}
																alt='Marksheet Preview'
																className='img-fluid'
																style={{
																	maxHeight: '100%',
																	maxWidth: '100%',
																	objectFit: 'contain',
																}}
															/>
														)
													})()}
												</div>
												{typeof admissionForm.marksheet !== 'string' && (
													<button
														className='btn btn-icon btn-sm btn-danger position-absolute'
														onClick={() => handleRemoveAdmissionFile('marksheet')}
														disabled={completedSections.admission}
														type='button'
														style={{
															top: '5px',
															right: '5px',
															width: '28px',
															height: '28px',
															borderRadius: '50%',
															boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
															zIndex: 10,
														}}>
														<i
															className='bi bi-x fs-5'
															style={{ lineHeight: 0 }}></i>
													</button>
												)}
											</div>
										) : (
											<input
												type='file'
												name='marksheet'
												className='form-control form-control-solid'
												onChange={handleAdmissionFileChange}
												disabled={completedSections.admission}
												accept='image/*,application/pdf'
											/>
										)}
									</div>
									<div className='col-md-3 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6'>Passport Photo</label>
										{admissionForm.photo ? (
											<div className='position-relative mt-2 w-100'>
												<div
													className='border border-secondary rounded overflow-hidden'
													style={{
														height: '180px',
														backgroundColor: '#f8f9fa',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}>
													{(() => {
														const url =
															typeof admissionForm.photo === 'string'
																? admissionForm.photo
																: URL.createObjectURL(admissionForm.photo)
														if (url.toLowerCase().endsWith('.pdf')) {
															return (
																<div className='text-center'>
																	<i className='bi bi-file-earmark-pdf text-danger fs-1'></i>
																	<div className='fs-7 fw-bold mt-2'>PDF Selected</div>
																</div>
															)
														}
														return (
															<img
																src={url}
																alt='Photo Preview'
																className='img-fluid'
																style={{
																	maxHeight: '100%',
																	maxWidth: '100%',
																	objectFit: 'contain',
																}}
															/>
														)
													})()}
												</div>
												{typeof admissionForm.photo !== 'string' && (
													<button
														className='btn btn-icon btn-sm btn-danger position-absolute'
														onClick={() => handleRemoveAdmissionFile('photo')}
														disabled={completedSections.admission}
														type='button'
														style={{
															top: '5px',
															right: '5px',
															width: '28px',
															height: '28px',
															borderRadius: '50%',
															boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
															zIndex: 10,
														}}>
														<i
															className='bi bi-x fs-5'
															style={{ lineHeight: 0 }}></i>
													</button>
												)}
											</div>
										) : (
											<input
												type='file'
												name='photo'
												className='form-control form-control-solid'
												onChange={handleAdmissionFileChange}
												disabled={completedSections.admission}
												accept='image/*'
											/>
										)}
									</div>
									{recordId && (
										<div className='row mb-6'>
											<div className='col-md-12'>
												<div className='d-flex flex-column'>
													<label className='form-label fw-bold text-dark fs-6'>
														Admission Form Link
													</label>
													<div className='input-group position-relative d-flex align-items-center'>
														<input
															type='text'
															className='form-control form-control-solid bg-light pe-12'
															value={admissionFormLink}
															readOnly
															style={{
																borderRight: 'none',
																backgroundColor: '#f5f8fa',
																color: '#7e8299',
															}}
														/>
														<button
															type='button'
															className='btn btn-icon btn-sm position-absolute end-0 me-1'
															onClick={() => {
																navigator.clipboard.writeText(admissionFormLink)
																toast.success('Link copied to clipboard!')
															}}
															style={{
																backgroundColor: '#e8fff3',
																color: '#50cd89',
																zIndex: 5,
																height: '30px',
																width: '30px',
																borderRadius: '6px',
															}}>
															<i className='bi bi-files fs-5 text-success'></i>
														</button>
													</div>
												</div>
											</div>
										</div>
									)}
									{!completedSections.admission && (
										<div className='col-md-12 mt-5 mb-7'>
											<div className='d-flex justify-content-end gap-3'>
												<button
													className='btn btn-secondary fw-bolder'
													onClick={handleSkipAdmissionForm}
													disabled={isSubmitting}>
													Skip
												</button>
												<TableButton
													action='add'
													text='Next'
													showIcon={false}
													backgroundDark={true}
													onClick={handleSaveAdmissionForm}
													disabled={isSubmitting}
												/>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Pitch Report */}
			<div className='col-12 mt-8'>
				<div className='card section-card'>
					<div
						className='section-header'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_pitch_report'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
							<h3>
								<span
									className='header-icon'
									style={{ background: '#fce4ec', color: '#e91e63' }}>
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
						id='kt_oder_view_pitch_report'
						className='collapse'>
						<div className='section-body'>
							<div className='field-group-title'>
								<i className='bi bi-telephone-outbound'></i>
								Call Summary
							</div>
							<div className='row'>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Telecaller Name'
									name='telecaller_name'
									htmlFor='telecaller_name'
									options={['Ezaz', 'Ravi', 'Chirag Pandey', 'Gautam Sir', 'Aslam Bhai']}
									value={pitchReport.telecaller_name}
									onChange={handlePitchReportChange}
									// Always editable
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Interest Level'
									name='interest_level'
									htmlFor='interest_level'
									options={['LOW', 'MEDIUM', 'HIGH']}
									value={pitchReport.interest_level}
									onChange={handlePitchReportChange}
									// Always editable
								/>
								<InputField
									placeholder='Next Follow Up Date'
									type='date'
									className='col-md-4 fv-row'
									label='Next Follow Up Date'
									name='follow_up_date'
									htmlFor='follow_up_date'
									value={pitchReport.follow_up_date}
									onChange={handlePitchReportChange}
									// Always editable
								/>
								<div className='col-md-12 fv-row mb-7 mt-5'>
									<label className='form-label fw-bolder text-dark fs-6'>
										Call Recording
										<span className='text-muted fs-7 fw-normal ms-2'>(optional)</span>
									</label>
									{pitchReport.call_recording instanceof File ? (
										<div className='d-flex align-items-center gap-3 mt-2'>
											<i className='bi bi-file-earmark-music fs-2 text-primary'></i>
											<span className='text-gray-700 fw-semibold'>
												{(pitchReport.call_recording as File).name}
											</span>
											<button
												type='button'
												className='btn btn-sm btn-icon btn-danger'
												onClick={() =>
													setPitchReport((prev) => ({ ...prev, call_recording: null }))
												}>
												<i className='bi bi-x'></i>
											</button>
										</div>
									) : typeof pitchReport.call_recording === 'string' &&
									  pitchReport.call_recording !== '' ? (
										<div className='d-flex flex-column gap-3 mt-2'>
											<div className='d-flex align-items-center gap-3'>
												<audio
													controls
													src={pitchReport.call_recording}
													style={{ height: '40px' }}>
													Your browser does not support the audio element.
												</audio>
												<button
													type='button'
													className='btn btn-sm btn-icon btn-danger'
													onClick={() =>
														setPitchReport((prev) => ({ ...prev, call_recording: null }))
													}
													title='Remove Recording'>
													<i className='bi bi-trash'></i>
												</button>
											</div>
										</div>
									) : (
										<input
											type='file'
											accept='audio/*'
											className='form-control form-control-solid'
											onChange={(e) => {
												const file = e.target.files?.[0] || null
												setPitchReport((prev) => ({ ...prev, call_recording: file }))
											}}
										/>
									)}
								</div>
							</div>
							<div className='col-md-12 fv-row mb-7'>
								<label className='form-label fw-bolder text-dark fs-6 mb-3'>Objections</label>
								<textarea
									className='remarks-textarea'
									rows={3}
									placeholder='Enter any objections here...'
									name='objections'
									value={pitchReport.objections}
									onChange={handlePitchReportChange}
									// Always editable
								/>
							</div>
							<div className='col-md-12 mt-5 mb-7'>
								<div className='d-flex justify-content-end'>
									<TableButton
										action='add'
										text='Finish'
										showIcon={false}
										backgroundDark={true}
										onClick={handleSavePitchReport}
										disabled={isSubmitting}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default AddFollowUpReport
