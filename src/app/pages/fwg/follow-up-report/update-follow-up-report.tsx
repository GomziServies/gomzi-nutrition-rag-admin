import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { GetFwgFollowUpReport, UpdateFwgCallEntry } from '../../../Functions/FGGroup'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'

const GOAL_ITEMS = [
	{ label: 'Fat Loss', img: 'fat_loss.png' },
	{ label: 'Muscle Gain', img: 'muscle_gain.png' },
	{ label: 'Maintain Weight', img: 'maintain_weight.png' },
	{ label: 'Improve Sleep Quality', img: 'improve_sleep_quality.png' },
	{ label: 'Adopt A Balanced Diet', img: 'adopt_a_balanced_diet.png' },
	{ label: 'Manage Stress', img: 'manage_stress.png' },
	{ label: 'Increase Flexibility', img: 'increase_flexibility.png' },
	{ label: 'Body Recomposition', img: 'body_recomposition.png' },
	{ label: 'Digestive Disorders', img: 'digestive_disorders.png' },
	{ label: 'Diabetes', img: 'diabetes.png' },
	{ label: 'HTN', img: 'htn.png' },
	{ label: 'Thyroid', img: 'thyroid.png' },
	{ label: 'PCOS', img: 'pcos.png' },
	{ label: 'Prep Coaching Segment', img: 'prep_coaching_segment.png' },
]

const MEDICAL_CONDITION_ITEMS = [
	{ label: 'Thyroid', img: 'thyroid.png' },
	{ label: 'Pcos', img: 'pcos.png' },
	{ label: 'Diabetes', img: 'diebetes.png' },
	{ label: 'Chest X-ray', img: 'x-ray_3609786.png' },
	{ label: 'ECG', img: 'ekg_5873285.png' },
	{ label: 'Cardiac Test', img: 'medical-diagnostics_9599477.png' },
	{ label: 'Blood and swab tests', img: 'test_4597063.png' },
	{ label: 'Liver Tests', img: 'LiverandKidney.png' },
	{ label: 'Blood Pressure', img: 'blood_pressure.png' },
	{ label: 'Body Mass Index (BMI)', img: 'body_mass_index.png' },
	{ label: 'Lean Body Mass', img: 'lean_body_mass.png' },
]

const FOOD_ALLERGY_ITEMS = [
	{ label: 'Milk', img: 'milk.png' },
	{ label: 'Gluten', img: 'gluten.png' },
	{ label: 'Citrus', img: 'citrus.png' },
	{ label: 'Rice', img: 'rice_129356.png' },
	{ label: 'Potato', img: 'fruit_13746880.png' },
	{ label: 'Peanut', img: 'peanut_1728767.png' },
	{ label: 'Spinach', img: 'spinach_5520618.png' },
]

const PREVIOUS_INJURY_ITEMS = [
	{ label: 'Knee Pain', img: 'knee-pain.png' },
	{ label: 'Shoulder Pain', img: 'shoulder.png' },
	{ label: 'Back Pain', img: 'back.png' },
	{ label: 'Tennis Elbow', img: 'arm_9099547.png' },
	{ label: 'Wrist Pain', img: 'hand_9961842.png' },
	{ label: 'Neck Pain', img: 'neck_9961885.png' },
	{ label: 'Calf Pain', img: 'leg_9961877.png' },
]

function UpdateFollowUpReport(): JSX.Element {
	const [personalDetails, setPersonalDetails] = useState<any>({})
	const [goals, setGoals] = useState<string[]>([])
	const [bodyCheckup, setBodyCheckup] = useState<any>({
		medical_condition: [],
		food_allergy: [],
		previous_injury: [],
	})
	const [lifestyle, setLifestyle] = useState<any>({})
	const [enduranceTest, setEnduranceTest] = useState<any>({})
	const [strengthTest, setStrengthTest] = useState<any>({})
	const [flexibilityTest, setFlexibilityTest] = useState<any>({})
	const [programDetails, setProgramDetails] = useState<any>({})
	const [pitchReport, setPitchReport] = useState<any>({
		telecaller_name: '',
		interest_level: 'LOW',
		follow_up_date: '',
		call_recording: null as File | null,
		objections: '',
	})

	const [sectionSkipped, setSectionSkipped] = useState<any>({
		goal: false,
		bodyCheckup: false,
		lifestyle: false,
		enduranceTest: false,
		programDetails: false,
	})

	const [recordId, setRecordId] = useState<string | null>(null)
	const [otherGoal, setOtherGoal] = useState<string>('')
	const [otherMedicalCondition, setOtherMedicalCondition] = useState<string>('')
	const [otherFoodAllergy, setOtherFoodAllergy] = useState<string>('')
	const [otherPreviousInjury, setOtherPreviousInjury] = useState<string>('')
	const [extraGoalOthers, setExtraGoalOthers] = useState<string[]>([])
	const [extraMedicalOthers, setExtraMedicalOthers] = useState<string[]>([])
	const [extraFoodAllergyOthers, setExtraFoodAllergyOthers] = useState<string[]>([])
	const [extraPreviousInjuryOthers, setExtraPreviousInjuryOthers] = useState<string[]>([])
	const [latestCallHistoryId, setLatestCallHistoryId] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [isCallLocked, setIsCallLocked] = useState<boolean>(false)
	const [showOnlyPitch, setShowOnlyPitch] = useState<boolean>(false)
	const [returnedFrom, setReturnedFrom] = useState<string>('')

	const navigate = useNavigate()
	const location = useLocation()

	const isPastDate = (dateString: string): boolean => {
		if (!dateString) return false
		const selectedDate = new Date(dateString)
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		return selectedDate < today
	}

	const handleLifestyleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, type } = e.target as HTMLInputElement
		const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
		setLifestyle((prev: any) => ({ ...prev, [name]: value }))
	}

	const handleEnduranceChange = (e: any) => {
		const { name, value } = e.target
		setEnduranceTest((prev: any) => ({ ...prev, [name]: value }))
	}

	const handleStrengthChange = (e: any) => {
		const { name, value } = e.target
		setStrengthTest((prev: any) => ({ ...prev, [name]: value }))
	}

	const handleProgramChange = (e: any) => {
		const { name, value } = e.target
		setProgramDetails((prev: any) => ({ ...prev, [name]: value }))
	}

	const handlePersonalDetailsChange = (e: any) => {
		const { name, value } = e.target
		setPersonalDetails((prev: any) => ({ ...prev, [name]: value }))
	}

	const toggleGoal = (label: string) => {
		setGoals((prev) => (prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]))
	}

	const toggleMedicalCondition = (label: string) => {
		setBodyCheckup((prev: any) => ({
			...prev,
			medical_condition: prev.medical_condition.includes(label)
				? prev.medical_condition.filter((c: string) => c !== label)
				: [...prev.medical_condition, label],
		}))
	}

	const toggleFoodAllergy = (label: string) => {
		setBodyCheckup((prev: any) => ({
			...prev,
			food_allergy: prev.food_allergy.includes(label)
				? prev.food_allergy.filter((f: string) => f !== label)
				: [...prev.food_allergy, label],
		}))
	}

	const togglePreviousInjury = (label: string) => {
		setBodyCheckup((prev: any) => ({
			...prev,
			previous_injury: prev.previous_injury.includes(label)
				? prev.previous_injury.filter((i: string) => i !== label)
				: [...prev.previous_injury, label],
		}))
	}

	const isMeaningfullyFilled = (obj: any) => {
		if (!obj) return false
		return Object.keys(obj).some(
			(k) =>
				!['_id', 'is_skipped', '__v', 'flexibilityTest', 'strengthTest'].includes(k) &&
				obj[k] !== '' &&
				obj[k] !== null &&
				obj[k] !== undefined
		)
	}

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search)
		if (queryParams.get('edit') !== 'true') return

		const id = queryParams.get('id')
		if (!id) return

		setRecordId(id)
		setLatestCallHistoryId(null)

		const fetchData = async (): Promise<void> => {
			try {
				const response = await GetFwgFollowUpReport({ id })
				if (response.status === 200 && response.data?.data?.length > 0) {
					const data = response.data.data[0]

					const callId = queryParams.get('call_id')
					let latestCall: any = {}

					if (callId) {
						latestCall = data.callHistory?.find((c: any) => c._id === callId) || {}
					} else {
						latestCall = data.callHistory?.[data.callHistory.length - 1] || {}
					}

					setLatestCallHistoryId(latestCall?._id || null)
					setReturnedFrom(latestCall?.returnFrom || '')

					// Personal Details
					setPersonalDetails(data.personalDetails || {})

					// Goals & Health
					const goalsData = latestCall.goals?.selected_goals || latestCall.goals || []
					setGoals(goalsData)
					setBodyCheckup(
						latestCall.bodyCheckup || {
							medical_condition: [],
							food_allergy: [],
							previous_injury: [],
						}
					)

					setSectionSkipped({
						goal: latestCall.goals?.is_skipped || false,
						bodyCheckup: latestCall.bodyCheckup?.is_skipped || false,
						lifestyle: latestCall.lifestyle?.is_skipped || false,
						enduranceTest: latestCall.enduranceTest?.is_skipped || false,
						programDetails: latestCall.programDetails?.is_skipped || false,
					})

					// Extract custom "Other" values
					const knownGoalLabels = GOAL_ITEMS.map((i) => i.label)
					const customGoals = goalsData.filter((g: string) => !knownGoalLabels.includes(g))
					setOtherGoal(customGoals[0] || '')
					setExtraGoalOthers(customGoals.slice(1))

					const knownMedicals = MEDICAL_CONDITION_ITEMS.map((i) => i.label)
					const customMedicals = (latestCall.bodyCheckup?.medical_condition || []).filter(
						(c: string) => !knownMedicals.includes(c)
					)
					setOtherMedicalCondition(customMedicals[0] || '')
					setExtraMedicalOthers(customMedicals.slice(1))

					const knownFoods = FOOD_ALLERGY_ITEMS.map((i) => i.label)
					const customFoods = (latestCall.bodyCheckup?.food_allergy || []).filter(
						(f: string) => !knownFoods.includes(f)
					)
					setOtherFoodAllergy(customFoods[0] || '')
					setExtraFoodAllergyOthers(customFoods.slice(1))

					const knownInjuries = PREVIOUS_INJURY_ITEMS.map((i) => i.label)
					const customInjuries = (latestCall.bodyCheckup?.previous_injury || []).filter(
						(i: string) => !knownInjuries.includes(i)
					)
					setOtherPreviousInjury(customInjuries[0] || '')
					setExtraPreviousInjuryOthers(customInjuries.slice(1))

					// Lifestyle
					setLifestyle(latestCall.lifestyle || {})

					// Physical Tests
					setEnduranceTest(latestCall.enduranceTest || {})
					setStrengthTest(latestCall.enduranceTest?.strengthTest || {})
					setFlexibilityTest(latestCall.enduranceTest?.flexibilityTest || {})

					// Program Details
					setProgramDetails(latestCall.programDetails || {})

					const isPitchLocked = !!(
						latestCall.pitchReport &&
						(latestCall.pitchReport.telecaller_name ||
							latestCall.pitchReport.interest_level ||
							latestCall.pitchReport.follow_up_date ||
							latestCall.pitchReport.call_recording ||
							latestCall.pitchReport.objections)
					)
					setIsCallLocked(isPitchLocked)

					// Check if this is a subsequent follow-up
					const callIndex = data.callHistory?.findIndex((c: any) => c._id === latestCall._id)
					if (callIndex > 0) {
						setShowOnlyPitch(true)
					} else if (isPitchLocked) {
						setShowOnlyPitch(true)
					}

					// Pitch Report
					setPitchReport({
						telecaller_name: latestCall.pitchReport?.telecaller_name || '',
						interest_level: latestCall.pitchReport?.interest_level || 'LOW',
						follow_up_date: latestCall.pitchReport?.follow_up_date
							? new Date(latestCall.pitchReport.follow_up_date).toISOString().split('T')[0]
							: '',
						call_recording: latestCall.pitchReport?.call_recording || '',
						objections: latestCall.pitchReport?.objections || '',
					})
				}
			} catch (error) {
				toast.error('Failed to load existing data')
			}
		}

		fetchData()

		setTimeout(() => {
			document.getElementById('kt_upd_personal')?.classList.add('show')
			document.getElementById('kt_upd_goals')?.classList.add('show')
			document.getElementById('kt_upd_bodycheckup')?.classList.add('show')
			document.getElementById('kt_upd_lifestyle')?.classList.add('show')
			document.getElementById('kt_upd_physical')?.classList.add('show')
			document.getElementById('kt_upd_program')?.classList.add('show')
			document.getElementById('kt_upd_pitch')?.classList.add('show')
		}, 300)
	}, [location])

	const handleSavePitchReport = async (): Promise<void> => {
		if (!recordId || !latestCallHistoryId) {
			toast.error('Missing required IDs')
			return
		}

		if (!pitchReport.telecaller_name) {
			toast.error('Please select a telecaller name')
			return
		}
		try {
			setIsSubmitting(true)

			// Build final goals with updated "Other" values
			const knownGoalLabels = GOAL_ITEMS.map((i) => i.label)
			const standardGoals = goals.filter((g) => knownGoalLabels.includes(g))
			const finalGoals = [
				...standardGoals,
				...(otherGoal.trim() ? [otherGoal.trim()] : []),
				...extraGoalOthers.filter((v) => v.trim()).map((v) => v.trim()),
			]

			// Build final bodyCheckup with updated "Other" values
			const knownMedicals = MEDICAL_CONDITION_ITEMS.map((i) => i.label)
			const standardMedicals = (bodyCheckup.medical_condition || []).filter((c: string) =>
				knownMedicals.includes(c)
			)
			const finalMedicals = [
				...standardMedicals,
				...(otherMedicalCondition.trim() ? [otherMedicalCondition.trim()] : []),
				...extraMedicalOthers.filter((v) => v.trim()).map((v) => v.trim()),
			]

			const knownFoods = FOOD_ALLERGY_ITEMS.map((i) => i.label)
			const standardFoods = (bodyCheckup.food_allergy || []).filter((f: string) =>
				knownFoods.includes(f)
			)
			const finalFoods = [
				...standardFoods,
				...(otherFoodAllergy.trim() ? [otherFoodAllergy.trim()] : []),
				...extraFoodAllergyOthers.filter((v) => v.trim()).map((v) => v.trim()),
			]

			const knownInjuries = PREVIOUS_INJURY_ITEMS.map((i) => i.label)
			const standardInjuries = (bodyCheckup.previous_injury || []).filter((i: string) =>
				knownInjuries.includes(i)
			)
			const finalInjuries = [
				...standardInjuries,
				...(otherPreviousInjury.trim() ? [otherPreviousInjury.trim()] : []),
				...extraPreviousInjuryOthers.filter((v) => v.trim()).map((v) => v.trim()),
			]

			const finalBodyCheckup = {
				medical_condition: finalMedicals,
				food_allergy: finalFoods,
				previous_injury: finalInjuries,
			}

			// Upload call recording if a new file was selected (optional)
			let callRecordingUrl = typeof pitchReport.call_recording === 'string' ? pitchReport.call_recording : ''
			if (pitchReport.call_recording instanceof File) {
				try {
					const audioRes: any = await FileUploadToFGGroup(pitchReport.call_recording, { directory: 'call-recordings' })
					let audioUrl = audioRes?.data?.fileURLs?.[0]
					if (audioUrl) {
						if (!audioUrl.startsWith('http')) audioUrl = `https://files.fggroup.in/${audioUrl}`
						callRecordingUrl = audioUrl
					}
				} catch (audioErr) {
					console.error('Failed to upload call recording', audioErr)
				}
			}

			const response = await UpdateFwgCallEntry(
				{
					id: recordId,
					callHistoryId: latestCallHistoryId,
				},
				{
					personalDetails: personalDetails,
					goals: {
						selected_goals: finalGoals,
						is_skipped: sectionSkipped.goal ? true : undefined,
					},
					bodyCheckup: {
						...finalBodyCheckup,
						is_skipped: sectionSkipped.bodyCheckup ? true : undefined,
					},
					lifestyle: {
						...lifestyle,
						is_skipped: sectionSkipped.lifestyle ? true : undefined,
					},
					enduranceTest: {
						...enduranceTest,
						strengthTest: strengthTest,
						flexibilityTest: flexibilityTest,
						is_skipped: sectionSkipped.enduranceTest ? true : undefined,
					},
					programDetails: {
						...programDetails,
						is_skipped: sectionSkipped.programDetails ? true : undefined,
					},
					pitchReport: {
						telecaller_name: pitchReport.telecaller_name,
						interest_level: pitchReport.interest_level,
						follow_up_date: pitchReport.follow_up_date
							? new Date(pitchReport.follow_up_date)
							: null,
						call_recording: callRecordingUrl,
						objections: pitchReport.objections,
					},
				}
			)
			if (response.status === 200) {
				toast.success('Pitch report saved successfully!')
				const queryParams = new URLSearchParams(location.search)
				const mobile = personalDetails?.mobile || queryParams.get('mobile') || ''
				const email = personalDetails?.email || queryParams.get('email') || ''
				const name = personalDetails?.full_name || queryParams.get('name') || ''
				const city = personalDetails?.city || queryParams.get('city') || ''
				const ad_name = personalDetails?.ad_name || queryParams.get('ad_name') || ''
				const lead_created_at =
					personalDetails?.lead_created_at || queryParams.get('lead_created_at') || ''
				const platform = personalDetails?.platform || queryParams.get('platform') || ''
				const additionalNote = personalDetails?.additional_note || queryParams.get('additional_note') || ''
				navigate(
					`/fwg/follow-up-report-inner-list?mobile=${encodeURIComponent(
						mobile
					)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(
						name
					)}&city=${encodeURIComponent(city)}&ad_name=${encodeURIComponent(
						ad_name
					)}&lead_created_at=${encodeURIComponent(lead_created_at)}&platform=${encodeURIComponent(
						platform
					)}&additional_note=${encodeURIComponent(additionalNote)}`
				)
			} else {
				toast.error(response.message || 'Failed to save pitch report')
			}
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
		} finally {
			setIsSubmitting(false)
		}
	}

	const renderOtherCard = (
		mainValue: string,
		onMainChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
		mainName: string,
		mainHtmlFor: string,
		isMainSelected: boolean,
		extraValues: string[],
		setExtraValues: React.Dispatch<React.SetStateAction<string[]>>
	) => {
		return (
			<>
				{/* Original "Other" card - read-only */}
				<div
					className='col-md-3 my-2'
					style={{ position: 'relative' }}>
					<label
						className={`btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center ${
							isMainSelected ? 'border-primary' : ''
						}`}
						htmlFor={mainHtmlFor}>
						<div
							className='d-block fw-bold text-start'
							style={{ width: '100%' }}>
							<InputField
								placeholder=''
								type='text'
								className=''
								name={mainName}
								label='Other'
								htmlFor={mainHtmlFor}
								value={mainValue}
								onChange={onMainChange}
								marginRemove={true}
							/>
						</div>
					</label>
				</div>
				{extraValues.map((val, idx) => (
					<div
						className='col-md-3 my-2'
						key={`extra_${mainName}_${idx}`}
						style={{ position: 'relative' }}>
						<label
							className={`btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center ${
								val.trim().length > 0 ? 'border-primary' : ''
							}`}
							htmlFor={`${mainHtmlFor}_extra_${idx}`}>
							<div
								className='d-block fw-bold text-start'
								style={{ width: '100%' }}>
								<InputField
									placeholder=''
									type='text'
									className=''
									name={`${mainName}_extra_${idx}`}
									label='Other'
									htmlFor={`${mainHtmlFor}_extra_${idx}`}
									value={val}
									onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
										const newValues = [...extraValues]
										newValues[idx] = e.target.value
										setExtraValues(newValues)
									}}
									marginRemove={true}
								/>
							</div>
						</label>
					</div>
				))}
			</>
		)
	}

	const renderReadOnlyCards = (
		items: { label: string; img: string }[],
		selectedLabels: string[],
		onToggle?: (label: string) => void
	) => {
		const knownLabels = items.map((i) => i.label)
		return (
			<>
				{items.map((item, index) => {
					const isSelected = selectedLabels.includes(item.label)
					return (
						<div
							className='col-md-3 my-2'
							key={index}
							onClick={() => onToggle?.(item.label)}
							style={{ cursor: onToggle ? 'pointer' : 'default' }}>
							<input
								type='checkbox'
								className='btn-check'
								checked={isSelected}
								onChange={() => {}}
							/>
							<label
								className={`btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center ${
									isSelected ? 'active border-primary' : ''
								}`}>
								<img
									src={toAbsoluteUrl(`/media/body-analysis/${item.img}`)}
									style={{ width: '64px' }}
									alt={item.label}
								/>
								<span className='d-block fw-bold mx-3 text-start'>
									<span className='text-dark fw-bolder d-block fs-4 mb-2'>{item.label}</span>
								</span>
							</label>
						</div>
					)
				})}
			</>
		)
	}

	const renderLV = (label: string, value: any) => (
		<div className='col-md-4 mb-5'>
			<div className='text-muted fs-8 mb-1'>{label}</div>
			<div className='fw-semibold fs-6'>
				{value !== undefined && value !== null && value !== '' ? String(value) : 'â€”'}
			</div>
		</div>
	)

	const renderAdditionalNoteFields = () => {
		const note = personalDetails.additional_note
		if (!note || note === '-' || note === 'N/A') return null
		return (
			<div className='row mb-7'>
				<div className='col-12'>
					<div className='card bg-light-primary border border-primary border-dashed rounded p-5'>
						<h5 className='text-primary fw-bold mb-3'>Lead Answers / Additional Notes</h5>
						<div className='d-flex flex-column gap-2'>
							{note.split(' | ').map((n: string, index: number) => {
								const [key, ...values] = n.split(':')
								const val = values.join(':').trim()
								if (!key) return null
								return (
									<div key={index} className='d-flex align-items-start'>
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
			</div>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Follow Up Report</PageTitle>

			{/* ===== PERSONAL DETAILS ===== */}
			<div className='card mb-5'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_upd_personal'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Personal Details</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_upd_personal'
					className='collapse'>
					<div className='card-body border-top p-9'>
						{renderAdditionalNoteFields()}
						{isCallLocked && (
							<div className='alert alert-dismissible bg-light-danger d-flex align-items-center p-5 mb-10'>
								<i className='ki-duotone ki-shield-cross fs-2hx text-danger me-4'>
									<span className='path1'></span>
									<span className='path2'></span>
								</i>
								<div className='d-flex flex-column'>
									<h4 className='mb-1 text-danger'>Finalized Call Entry</h4>
									<span>
										This specific call history record is finalized and cannot be modified (except{' '}
										<b>Personal Details</b> below). To add new follow-up information, please create
										a new call entry from the list page.
									</span>
								</div>
							</div>
						)}
						<div
							className='row mt-4'
							style={{ pointerEvents: 'none', opacity: 0.7 }}>
							<InputField
								placeholder='Full Name'
								type='text'
								className='col-md-4 fv-row'
								name='full_name'
								label='Full Name'
								htmlFor='full_name'
								value={personalDetails.full_name || ''}
								onChange={handlePersonalDetailsChange}
								disabled={true}
							/>
							<SelectField
								value={personalDetails.gender || ''}
								onChange={handlePersonalDetailsChange}
								className='col-md-4 fv-row mb-7'
								label='Gender'
								name='gender'
								htmlFor='gender'
								options={['MALE', 'FEMALE', 'OTHER']}
								disabled={true}
							/>
							<InputField
								placeholder='Email'
								type='email'
								className='col-md-4 fv-row'
								name='email'
								label='Email'
								htmlFor='email'
								value={personalDetails.email || ''}
								onChange={handlePersonalDetailsChange}
								disabled={true}
							/>
							<InputField
								placeholder='Mobile'
								type='text'
								className='col-md-4 fv-row'
								name='mobile'
								label='Mobile'
								htmlFor='mobile'
								value={personalDetails.mobile || ''}
								onChange={handlePersonalDetailsChange}
								disabled={true}
							/>
							<InputField
								placeholder='Age'
								type='number'
								className='col-md-4 fv-row'
								name='age'
								label='Age'
								htmlFor='age'
								value={personalDetails.age || ''}
								onChange={handlePersonalDetailsChange}
								disabled={true}
							/>
							<InputField
								placeholder='Height (cm)'
								type='number'
								className='col-md-4 fv-row'
								name='height'
								label='Height (cm)'
								htmlFor='height'
								value={personalDetails.height || ''}
								onChange={handlePersonalDetailsChange}
								disabled={true}
							/>
							<InputField
								placeholder='Weight (kg)'
								type='number'
								className='col-md-4 fv-row'
								name='weight'
								label='Weight (kg)'
								htmlFor='weight'
								value={personalDetails.weight || ''}
								onChange={handlePersonalDetailsChange}
								disabled={true}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* ===== GOALS & HEALTH ===== */}
			{!showOnlyPitch && (goals.length > 0 || sectionSkipped.goal) && (
				<div className='card mb-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_upd_goals'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Goals & Health</h3>
								{sectionSkipped.goal && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
								{isCallLocked && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Finalized</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_upd_goals'
						className={`collapse ${sectionSkipped.goal ? 'show' : ''}`}>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: 'none',
								opacity: 0.6,
							}}>
							{(goals.length > 0 || sectionSkipped.goal) && (
								<div className='row'>
									{renderReadOnlyCards(GOAL_ITEMS, goals, toggleGoal)}
									{renderOtherCard(
										otherGoal,
										(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
											setOtherGoal(e.target.value),
										'otherGoal',
										'otherGoal',
										otherGoal.trim().length > 0,
										extraGoalOthers,
										setExtraGoalOthers
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* ===== BODY CHECKUP ===== */}
			{!showOnlyPitch &&
				(bodyCheckup.medical_condition?.length > 0 ||
					bodyCheckup.food_allergy?.length > 0 ||
					bodyCheckup.previous_injury?.length > 0 ||
					sectionSkipped.bodyCheckup) && (
				<div className='card mb-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_upd_bodycheckup'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Body Checkup</h3>
								{sectionSkipped.bodyCheckup && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
								{isCallLocked && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Finalized</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_upd_bodycheckup'
						className={`collapse ${sectionSkipped.bodyCheckup ? 'show' : ''}`}>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: 'none',
								opacity: 0.6,
							}}>
							{(bodyCheckup.medical_condition?.length > 0 || sectionSkipped.bodyCheckup) && (
								<>
									<h4 className='fw-bolder text-dark mb-4'>Medical Condition</h4>
									<div className='row'>
										{renderReadOnlyCards(
											MEDICAL_CONDITION_ITEMS,
											bodyCheckup.medical_condition || [],
											toggleMedicalCondition
										)}
										{renderOtherCard(
											otherMedicalCondition,
											(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
												setOtherMedicalCondition(e.target.value),
											'otherMedicalCondition',
											'otherMedicalCondition',
											otherMedicalCondition.trim().length > 0,
											extraMedicalOthers,
											setExtraMedicalOthers
										)}
									</div>
								</>
							)}
							{(bodyCheckup.food_allergy?.length > 0 || sectionSkipped.bodyCheckup) && (
								<>
									<h4 className='fw-bolder text-dark mb-4 mt-6'>Food Allergy</h4>
									<div className='row'>
										{renderReadOnlyCards(
											FOOD_ALLERGY_ITEMS,
											bodyCheckup.food_allergy || [],
											toggleFoodAllergy
										)}
										{renderOtherCard(
											otherFoodAllergy,
											(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
												setOtherFoodAllergy(e.target.value),
											'otherFoodAllergy',
											'otherFoodAllergy',
											otherFoodAllergy.trim().length > 0,
											extraFoodAllergyOthers,
											setExtraFoodAllergyOthers
										)}
									</div>
								</>
							)}
							{(bodyCheckup.previous_injury?.length > 0 || sectionSkipped.bodyCheckup) && (
								<>
									<h4 className='fw-bolder text-dark mb-4 mt-6'>Previous Injury</h4>
									<div className='row'>
										{renderReadOnlyCards(
											PREVIOUS_INJURY_ITEMS,
											bodyCheckup.previous_injury || [],
											togglePreviousInjury
										)}
										{renderOtherCard(
											otherPreviousInjury,
											(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
												setOtherPreviousInjury(e.target.value),
											'otherPreviousInjury',
											'otherPreviousInjury',
											otherPreviousInjury.trim().length > 0,
											extraPreviousInjuryOthers,
											setExtraPreviousInjuryOthers
										)}
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{/* ===== LIFESTYLE ===== */}
			{!showOnlyPitch && (isMeaningfullyFilled(lifestyle) || sectionSkipped.lifestyle) && (
				<div className='card mb-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_upd_lifestyle'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Life Style</h3>
								{sectionSkipped.lifestyle && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
								{isCallLocked && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Finalized</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_upd_lifestyle'
						className={`collapse ${sectionSkipped.lifestyle ? 'show' : ''}`}>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: 'none',
								opacity: 0.6,
							}}>
							<div className='row mt-4'>
								<SelectField
									className='col-md-12 fv-row mb-7'
									label='Food Preference'
									name='food_preference'
									value={lifestyle.food_preference || ''}
									onChange={handleLifestyleChange}
									htmlFor='food_preference'
									options={['Vegetarians', 'Non-Vegetarians', 'Eggetarians', 'Vegan']}
								/>
								<div className='col-md-12 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>Unhealthy Habits</label>
									<InputField
										placeholder='Enter Unhealthy Habits'
										type='text'
										className='col-md-12 fv-row'
										name='unhealthy_habits'
										htmlFor='unhealthy_habits'
										value={lifestyle.unhealthy_habits || ''}
										onChange={handleLifestyleChange}
										marginRemove={true}
									/>
								</div>
								<InputField
									placeholder='Enter Wakeup Time'
									type='time'
									className='col-md-6 fv-row'
									label='Wakeup Time'
									name='wakeup_time'
									htmlFor='wakeup_time'
									value={lifestyle.wakeup_time || ''}
									onChange={handleLifestyleChange}
								/>
								<InputField
									placeholder='Enter Sleep Time'
									type='time'
									className='col-md-6 fv-row'
									label='Sleep Time'
									name='sleep_time'
									htmlFor='sleep_time'
									value={lifestyle.sleep_time || ''}
									onChange={handleLifestyleChange}
								/>
								<InputField
									placeholder='Enter Breakfast Time'
									type='time'
									className='col-md-4 fv-row'
									label='Breakfast Time'
									name='breakfast_time'
									htmlFor='breakfast_time'
									value={lifestyle.breakfast_time || ''}
									onChange={handleLifestyleChange}
								/>
								<InputField
									placeholder='Enter Lunch Time'
									type='time'
									className='col-md-4 fv-row'
									label='Lunch Time'
									name='lunch_time'
									htmlFor='lunch_time'
									value={lifestyle.lunch_time || ''}
									onChange={handleLifestyleChange}
								/>
								<InputField
									placeholder='Enter Dinner Time'
									type='time'
									className='col-md-4 fv-row'
									label='Dinner Time'
									name='dinner_time'
									htmlFor='dinner_time'
									value={lifestyle.dinner_time || ''}
									onChange={handleLifestyleChange}
								/>
								<div className='col-md-4 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>Irregular Meals</label>
									<div className='form-check form-switch form-check-custom form-check-solid'>
										<input
											className='form-check-input'
											type='checkbox'
											name='irregular_meals'
											checked={lifestyle.irregular_meals || false}
											onChange={handleLifestyleChange}
										/>
										<label
											className='form-check-label'
											htmlFor='irregular_meals'>
											Irregular Meals
										</label>
									</div>
								</div>
								<div className='col-md-4 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>Smoking</label>
									<div className='form-check form-switch form-check-custom form-check-solid'>
										<input
											className='form-check-input'
											type='checkbox'
											name='smoking'
											checked={lifestyle.smoking || false}
											onChange={handleLifestyleChange}
										/>
										<label
											className='form-check-label'
											htmlFor='smoking'>
											Smoking
										</label>
									</div>
								</div>
								<div className='col-md-4 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>Alcohol</label>
									<div className='form-check form-switch form-check-custom form-check-solid'>
										<input
											className='form-check-input'
											type='checkbox'
											name='alcohol'
											checked={lifestyle.alcohol || false}
											onChange={handleLifestyleChange}
										/>
										<label
											className='form-check-label'
											htmlFor='alcohol'>
											Alcohol
										</label>
									</div>
								</div>
								<InputField
									placeholder='Enter Water Intake (Litres)'
									type='number'
									className='col-md-6 fv-row'
									label='Water Intake (Litres)'
									name='water_intake_litre'
									htmlFor='water_intake_litre'
									value={lifestyle.water_intake_litre ?? ''}
									onChange={handleLifestyleChange}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Job Type'
									name='job_type'
									value={lifestyle.job_type || ''}
									onChange={handleLifestyleChange}
									htmlFor='job_type'
									options={['SEDENTARY', 'MODERATE', 'ACTIVE']}
								/>
								<InputField
									placeholder='Enter Working Hours'
									type='number'
									className='col-md-6 fv-row'
									label='Working Hours'
									name='working_hours'
									htmlFor='working_hours'
									value={lifestyle.working_hours ?? ''}
									onChange={handleLifestyleChange}
								/>
								<InputField
									placeholder='Enter Daily Steps'
									type='number'
									className='col-md-6 fv-row'
									label='Daily Steps'
									name='daily_steps'
									htmlFor='daily_steps'
									value={lifestyle.daily_steps ?? ''}
									onChange={handleLifestyleChange}
								/>
								<InputField
									placeholder='Enter Stress and Tension'
									type='text'
									className='col-md-6 fv-row'
									label='Stress and Tension'
									name='stress_and_tension'
									htmlFor='stress_and_tension'
									value={lifestyle.stress_and_tension || ''}
									onChange={handleLifestyleChange}
								/>
								<InputField
									placeholder='Enter Running Medicine'
									type='text'
									className='col-md-6 fv-row'
									label='Running Medicine'
									name='running_medicine'
									htmlFor='running_medicine'
									value={lifestyle.running_medicine || ''}
									onChange={handleLifestyleChange}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Systolic Blood Pressure'
									name='systolic_blood_pressure'
									value={lifestyle.systolic_blood_pressure || ''}
									onChange={handleLifestyleChange}
									htmlFor='systolic_blood_pressure'
									options={[
										'< 120 mmHg (Normal)',
										'120 - 129 mmHg (Elevated)',
										'130 - 139 mmHg (Hypertension Stage 1)',
										'140 - 179 mmHg (Hypertension Stage 2)',
										'≥ 180 mmHg (Hypertensive Crisis)',
									]}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Diastolic Blood Pressure'
									name='diastolic_blood_pressure'
									value={lifestyle.diastolic_blood_pressure || ''}
									onChange={handleLifestyleChange}
									htmlFor='diastolic_blood_pressure'
									options={[
										'< 80 mmHg (Normal)',
										'80 - 89 mmHg (Hypertension Stage 1)',
										'90 - 119 mmHg (Hypertension Stage 2)',
										'≥ 120 mmHg (Hypertensive Crisis)',
									]}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='FBS (Fasting Blood Sugar)'
									name='fbs'
									value={lifestyle.fbs || ''}
									onChange={handleLifestyleChange}
									htmlFor='fbs'
									options={[
										'< 70 mg/dl (Low)',
										'70 to 99 mg/dl (Normal)',
										'100 to 125 mg/dl (Pre-Diabetes)',
										'126 to 199 mg/dl (Diabetes)',
										'> 200 mg/dl (Severe High)',
									]}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Hemoglobin A1C'
									name='hemoglobin_a1c'
									value={lifestyle.hemoglobin_a1c || ''}
									onChange={handleLifestyleChange}
									htmlFor='hemoglobin_a1c'
									options={[
										'< 5.7 % (Normal)',
										'5.7 % - 6.4 % (Pre-Diabetes)',
										'6.5 % - 7.9 % (Diabetes)',
										'8.0 % - 9.9 % (Poor Control)',
										'≥ 10 % (Very Poor Control)',
									]}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='PPBS (Postprandial Blood Sugar)'
									name='ppbs'
									value={lifestyle.ppbs || ''}
									onChange={handleLifestyleChange}
									htmlFor='ppbs'
									options={[
										'< 140 mg/dl (Normal)',
										'140 - 199 mg/dl (Impaired / Pre-Diabetes)',
										'200 - 249 mg/dl (Diabetes)',
										'≥ 250 mg/dl (Very High)',
									]}
								/>
								<div className='col-md-12 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>
										Detailed Goal Description
									</label>
									<textarea
										className='form-control form-control-lg form-control-solid'
										rows={5}
										name='detailed_goal'
										value={lifestyle.detailed_goal || ''}
										onChange={(e) =>
											setLifestyle((prev: any) => ({ ...prev, detailed_goal: e.target.value }))
										}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ===== Endurance TESTS ===== */}
			{!showOnlyPitch &&
				(isMeaningfullyFilled(enduranceTest) ||
					isMeaningfullyFilled(strengthTest) ||
					isMeaningfullyFilled(flexibilityTest) ||
					sectionSkipped.enduranceTest) && (
				<div className='card mb-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_upd_physical'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Physical / Endurance Tests</h3>
								{sectionSkipped.enduranceTest && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
								{isCallLocked && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Finalized</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_upd_physical'
						className={`collapse ${sectionSkipped.enduranceTest ? 'show' : ''}`}>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: 'none',
								opacity: 0.6,
							}}>
							<div className='row mt-4'>
								{/* Endurance (Treadmill) */}
								{(enduranceTest.treadmill_minutes || sectionSkipped.enduranceTest) && (
									<>
										<div className='pb-5'>
											<h4 className='fw-bolder text-dark'>Endurance (Treadmill)</h4>
										</div>
										<InputField
											placeholder='Minutes you can run'
											type='number'
											className='col-md-4 fv-row'
											label='Treadmill Run (minutes)'
											name='treadmill_minutes'
											htmlFor='treadmill_minutes'
											value={enduranceTest.treadmill_minutes}
											onChange={handleEnduranceChange}
										/>
									</>
								)}

								{/* Strength */}
								{(Object.keys(strengthTest).some((k) => strengthTest[k] != null) ||
									sectionSkipped.enduranceTest) && (
									<>
										<div className='pb-5 pt-7'>
											<h4 className='fw-bolder text-dark'>Strength</h4>
											<span className='text-muted'>Max reps/weight performed.</span>
										</div>
										{strengthTest.squats != null && (
											<InputField
												placeholder='Reps'
												type='number'
												className='col-md-4 fv-row'
												label='Squats'
												name='squats'
												htmlFor='squats'
												value={strengthTest.squats}
												onChange={handleStrengthChange}
											/>
										)}
										{strengthTest.pushups != null && (
											<InputField
												placeholder='Reps'
												type='number'
												className='col-md-4 fv-row'
												label='Push Ups'
												name='pushups'
												htmlFor='pushups'
												value={strengthTest.pushups}
												onChange={handleStrengthChange}
											/>
										)}
										{strengthTest.pullups != null && (
											<InputField
												placeholder='Reps'
												type='number'
												className='col-md-4 fv-row'
												label='Pull Ups'
												name='pullups'
												htmlFor='pullups'
												value={strengthTest.pullups}
												onChange={handleStrengthChange}
											/>
										)}
										{strengthTest.deadlift != null && (
											<InputField
												placeholder='Kg or lbs'
												type='number'
												className='col-md-4 fv-row'
												label='Deadlift'
												name='deadlift'
												htmlFor='deadlift'
												value={strengthTest.deadlift}
												onChange={handleStrengthChange}
											/>
										)}
										{strengthTest.bench_press != null && (
											<InputField
												placeholder='Kg or lbs'
												type='number'
												className='col-md-4 fv-row'
												label='Bench Press'
												name='bench_press'
												htmlFor='bench_press'
												value={strengthTest.bench_press}
												onChange={handleStrengthChange}
											/>
										)}
										{strengthTest.shoulder_press != null && (
											<InputField
												placeholder='Kg or lbs'
												type='number'
												className='col-md-4 fv-row'
												label='Shoulder Press'
												name='shoulder_press'
												htmlFor='shoulder_press'
												value={strengthTest.shoulder_press}
												onChange={handleStrengthChange}
											/>
										)}
									</>
								)}

								{/* Flexibility Test */}
								{(Object.keys(flexibilityTest).some((k) => flexibilityTest[k]) ||
									sectionSkipped.enduranceTest) && (
									<div className='col-12'>
										<div className='pb-5 pt-7'>
											<h4 className='fw-bolder text-dark'>Flexibility Test</h4>
										</div>
										<div className='row'>
											{flexibilityTest.flexibility_photo && (
												<div className='col-md-4 fv-row mb-7'>
													<label className='form-label fw-bolder text-dark fs-6 mb-3'>
														Flexibility Photo
													</label>
													<div
														className='image-preview-box'
														style={{
															width: '100%',
															height: '220px',
															overflow: 'hidden',
															borderRadius: '8px',
															border: '1px solid #e4e6ef',
														}}>
														<img
															src={`https://files.fggroup.in/${flexibilityTest.flexibility_photo}`}
															alt='Flexibility'
															style={{ width: '100%', height: '100%', objectFit: 'cover' }}
														/>
													</div>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Before Images */}
								{(flexibilityTest.before_image_front ||
									flexibilityTest.before_image_side ||
									flexibilityTest.before_image_back ||
									sectionSkipped.enduranceTest) && (
									<div className='col-12'>
										<div className='pb-5 pt-7'>
											<h4 className='fw-bolder text-dark'>Before Images</h4>
										</div>
										<div className='row'>
											{flexibilityTest.before_image_front && (
												<div className='col-md-4 fv-row mb-7'>
													<label className='form-label fw-bolder text-dark fs-6 mb-3'>Front</label>
													<div
														className='image-preview-box'
														style={{
															width: '100%',
															height: '220px',
															overflow: 'hidden',
															borderRadius: '8px',
															border: '1px solid #e4e6ef',
														}}>
														<img
															src={`https://files.fggroup.in/${flexibilityTest.before_image_front}`}
															alt='Front'
															style={{ width: '100%', height: '100%', objectFit: 'cover' }}
														/>
													</div>
												</div>
											)}
											{flexibilityTest.before_image_side && (
												<div className='col-md-4 fv-row mb-7'>
													<label className='form-label fw-bolder text-dark fs-6 mb-3'>Side</label>
													<div
														className='image-preview-box'
														style={{
															width: '100%',
															height: '220px',
															overflow: 'hidden',
															borderRadius: '8px',
															border: '1px solid #e4e6ef',
														}}>
														<img
															src={`https://files.fggroup.in/${flexibilityTest.before_image_side}`}
															alt='Side'
															style={{ width: '100%', height: '100%', objectFit: 'cover' }}
														/>
													</div>
												</div>
											)}
											{flexibilityTest.before_image_back && (
												<div className='col-md-4 fv-row mb-7'>
													<label className='form-label fw-bolder text-dark fs-6 mb-3'>Back</label>
													<div
														className='image-preview-box'
														style={{
															width: '100%',
															height: '220px',
															overflow: 'hidden',
															borderRadius: '8px',
															border: '1px solid #e4e6ef',
														}}>
														<img
															src={`https://files.fggroup.in/${flexibilityTest.before_image_back}`}
															alt='Back'
															style={{ width: '100%', height: '100%', objectFit: 'cover' }}
														/>
													</div>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ===== PROGRAM DETAILS ===== */}
			{!showOnlyPitch &&
				(isMeaningfullyFilled(programDetails) || sectionSkipped.programDetails) && (
				<div className='card mb-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_upd_program'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Program Details</h3>
								{sectionSkipped.programDetails && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
								{isCallLocked && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Finalized</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_upd_program'
						className={`collapse ${sectionSkipped.programDetails ? 'show' : ''}`}>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: 'none',
								opacity: 0.6,
							}}>
							<div className='row mt-4'>
								{/* Program Name */}
								<div className='col-md-3 fv-row mb-7'>
									<SelectField
										className='col-md-12 fv-row mb-7'
										label='Program'
										name='program_name'
										value={programDetails.program_name}
										onChange={handleProgramChange}
										htmlFor='program'
										options={['Fat Loss', 'Muscle Gain', 'Lifestyle Transformation']}
									/>
								</div>
								{/* Duration */}
								<div className='col-md-3 fv-row mb-7'>
									<InputField
										placeholder='Program Duration'
										type='text'
										className='col-md-12 fv-row'
										label='Duration'
										name='duration'
										htmlFor='program_duration'
										value={programDetails.duration}
										onChange={handleProgramChange}
									/>
								</div>
								{/* Amount */}
								<div className='col-md-3 fv-row mb-7'>
									<InputField
										placeholder='Program Amount'
										type='number'
										className='col-md-12 fv-row'
										label='Amount'
										name='amount'
										htmlFor='program_amount'
										value={programDetails.amount}
										onChange={handleProgramChange}
									/>
								</div>
								{/* Payment Method */}
								<div className='col-md-3 fv-row mb-7'>
									<SelectField
										className='col-md-12 fv-row mb-7'
										label='Payment Method'
										name='payment_method'
										value={programDetails.payment_method}
										onChange={handleProgramChange}
										htmlFor='payment_method'
										options={['Online', 'Cash', 'SaveIn']}
									/>
								</div>

								{/* Workout Mode */}
								<div className='col-md-3 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>Workout Mode</label>
									<div className='d-flex gap-5'>
										<div className='form-check form-check-custom form-check-solid'>
											<input
												className='form-check-input'
												type='radio'
												name='workout_mode'
												value='online'
												checked={programDetails.workout_mode === 'online'}
												onChange={handleProgramChange}
											/>
											<label className='form-check-label'>Online</label>
										</div>
										<div className='form-check form-check-custom form-check-solid'>
											<input
												className='form-check-input'
												type='radio'
												name='workout_mode'
												value='offline'
												checked={programDetails.workout_mode === 'offline'}
												onChange={handleProgramChange}
											/>
											<label className='form-check-label'>Offline</label>
										</div>
									</div>
								</div>

								{/* Workout Branch */}
								<div className='col-md-3 fv-row mb-7'>
									<div
										style={{
											visibility: programDetails.workout_mode === 'offline' ? 'visible' : 'hidden',
										}}>
										<SelectField
											className='fv-row mb-7'
											label='Workout Branch'
											name='workout_branch'
											value={programDetails.workout_branch}
											onChange={handleProgramChange}
											htmlFor='workoutBranch'
											options={['Adajan', 'Katargam', 'Vesu']}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ===== PITCH REPORT (EDITABLE) ===== */}
			{returnedFrom !== 'Personal Details' && returnedFrom !== 'Body Analysis' && (
				<div className='card mb-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_upd_pitch'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Pitch Report</h3>
								{isCallLocked && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Finalized</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_upd_pitch'
						className={`collapse ${showOnlyPitch ? 'show' : ''}`}>
						<div
							className='card-body border-top p-9'>
							<div className='row mt-4'>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Telecaller Name'
									name='telecaller_name'
									value={pitchReport.telecaller_name}
									onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
										setPitchReport((p: any) => ({ ...p, telecaller_name: e.target.value }))
									}
									htmlFor='telecaller_name'
									options={['Ishita', 'Kajal (Adajan Branch)', 'Kajal (Katargam Branch)']}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Interest Level'
									name='interest_level'
									value={pitchReport.interest_level}
									onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
										setPitchReport((p: any) => ({ ...p, interest_level: e.target.value }))
									}
									htmlFor='interest_level'
									options={['LOW', 'MEDIUM', 'HIGH']}
								/>
								<InputField
									placeholder='Select Follow Up Date'
									type='date'
									className='col-md-4 fv-row'
									label='Follow Up Date'
									name='follow_up_date'
									htmlFor='follow_up_date'
									value={pitchReport.follow_up_date}
									onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
										if (isPastDate(e.target.value)) {
											toast.error('Follow-up date cannot be in the past')
											return
										}
										setPitchReport((p: any) => ({ ...p, follow_up_date: e.target.value }))
									}}
								/>
							</div>

							{/* Call Recording - optional audio upload */}
							<div className='col-md-12 fv-row mb-7'>
								<label className='form-label fw-bolder text-dark fs-6 mb-3'>
									Call Recording
									<span className='text-muted fs-7 fw-normal ms-2'>(optional)</span>
								</label>
								{pitchReport.call_recording instanceof File ? (
									<div className='d-flex align-items-center gap-3 mt-2'>
										<i className='bi bi-file-earmark-music fs-2 text-primary'></i>
										<span className='text-gray-700 fw-semibold'>{(pitchReport.call_recording as File).name}</span>
										<button
											type='button'
											className='btn btn-sm btn-icon btn-danger'
											onClick={() => setPitchReport((p: any) => ({ ...p, call_recording: null }))}
										>
											<i className='bi bi-x'></i>
										</button>
									</div>
								) : typeof pitchReport.call_recording === 'string' && pitchReport.call_recording !== '' ? (
									<div className='d-flex flex-column gap-3 mt-2'>
										<div className='d-flex align-items-center gap-3'>
											<audio controls src={pitchReport.call_recording} style={{ height: '40px' }}>
												Your browser does not support the audio element.
											</audio>
											<button
												type='button'
												className='btn btn-sm btn-icon btn-danger'
												onClick={() => setPitchReport((p: any) => ({ ...p, call_recording: null }))}
												title='Remove Recording'
											>
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
											setPitchReport((p: any) => ({ ...p, call_recording: file }))
										}}
									/>
								)}
							</div>

							<div className='col-md-12 fv-row mb-7'>
								<label className='form-label fw-bolder text-dark fs-6 mb-3'>Objections</label>
								<textarea
									className='form-control form-control-lg '
									rows={5}
									placeholder='Enter objections or client concerns...'
									name='objections'
									value={pitchReport.objections}
									onChange={(e) =>
										setPitchReport((p: any) => ({ ...p, objections: e.target.value }))
									}
								/>
							</div>

							<div className='d-flex justify-content-end'>
								<TableButton
									action='add'
									text={
										isSubmitting
											? 'Saving...'
											: 'Save Pitch Report'
									}
									showIcon={false}
									backgroundDark={true}
									onClick={async () => {
										if (recordId) await handleSavePitchReport()
										else toast.error('No record ID found')
									}}
									disabled={isSubmitting}
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default UpdateFollowUpReport
