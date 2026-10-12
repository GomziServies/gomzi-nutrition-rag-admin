import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import {
	AddFwgCallEntry,
	CreateFwgFollowUpReport,
	GetFwgFollowUpReport,
	UpdateFwgCallEntry,
} from '../../../Functions/FGGroup'
import './fwg-follow-up-report.css'

const AddFollowUpReport = () => {
	const location = useLocation()
	const navigate = useNavigate()
	// Read platform at component level for PULL_MARKETING detection
	const platformFromUrl = new URLSearchParams(location.search).get('platform') || ''
	const isPullMarketing = platformFromUrl.toLowerCase() === 'pull_marketing'
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [reportId, setReportId] = useState<string | null>(null)
	const [currentCallId, setCurrentCallId] = useState<string | null>(null)
	const [isCoreFieldDisabled, setIsCoreFieldDisabled] = useState(false)
	const [isPersonalDetailsSaved, setIsPersonalDetailsSaved] = useState(false)
	const [isCallLocked, setIsCallLocked] = useState(false)
	const [showOnlyPitch, setShowOnlyPitch] = useState(false)

	const [filledSections, setFilledSections] = useState<Record<string, boolean>>({
		goal: false,
		bodyCheckup: false,
		lifestyle: false,
		enduranceTest: false,
		programDetails: false,
	})
	const [sectionSkipped, setSectionSkipped] = useState<Record<string, boolean>>({
		goal: false,
		bodyCheckup: false,
		lifestyle: false,
		enduranceTest: false,
		programDetails: false,
	})
	const [lastSavedStep, setLastSavedStep] = useState<string>('')
	const [bodyAnalysisData, setBodyAnalysisData] = useState<any>({
		firstName: '',
		lastName: '',
		age: Number,
		gender: '',
		test_time: Date,
		weight: Number,
		profile_image: null,
		profile_image_preview: '',
		skeletal_muscle_mass: Number,
		ideal_body_weight: Number,
		body_mass_index: Number,
		percent_body_fat: Number,
		muscle_in_arms: Number,
		muscle_in_legs: Number,
		muscle_in_trunk: Number,
		fat_in_arms: Number,
		fat_in_legs: Number,
		fat_in_trunk: Number,
		pulses: {
			category: '',
			value: '',
		},
		ad_name: '',
		lead_created_at: '',
		platform: '',
		additional_note: '',
	})
	const [composition, setComposition] = useState<any>({
		weight1: Number,
		weight45: Number,
		weight90: Number,
		smm1: Number,
		smm45: Number,
		smm90: Number,
		pbf1: Number,
		pbf45: Number,
		pbf90: Number,
	})
	const [blood, setBlood] = useState<any>({
		food_preference: '',
		unhealthy_habits: '',
		stress_and_tension: '',
		sugar_intake: Boolean,
		salt_intake: Boolean,
		running_medicine: '',
		systolic_blood_pressure: '',
		diastolic_blood_pressure: '',
		fbs: '',
		hemoglobin_a1c: '',
		ppbs: '',
		working_hours: Number,
		sleeping_hours: Number,
	})
	const [bloodSugar, setBloodSugar] = useState<any>([
		{
			metric: 'Normal',
			sub_category: 'Fasting',
			value: '80-100 mg/dl',
			selected: false,
		},
		{
			metric: 'Normal',
			sub_category: 'Just Ate',
			value: '170-200 mg/dl',
			selected: false,
		},
		{
			metric: 'Normal',
			sub_category: '3 Hours After Eating',
			value: '120-140 mg/dl',
			selected: false,
		},
		{
			metric: 'Pre Diabetic',
			sub_category: 'Fasting',
			value: '101-125 mg/dl',
			selected: false,
		},
		{
			metric: 'Pre Diabetic',
			sub_category: 'Just Ate',
			value: '190-230 mg/dl',
			selected: false,
		},
		{
			metric: 'Pre Diabetic',
			sub_category: '3 Hours After Eating',
			value: '140-160 mg/dl',
			selected: false,
		},
		{
			metric: 'Diabetic',
			sub_category: 'Fasting',
			value: '126+ mg/dl',
			selected: false,
		},
		{
			metric: 'Diabetic',
			sub_category: 'Just Ate',
			value: '220-300 mg/dl',
			selected: false,
		},
		{
			metric: 'Diabetic',
			sub_category: '3 Hours After Eating',
			value: '200+ mg/dl',
			selected: false,
		},
	])

	// Intercept browser back button → go to inner list with person params
	useEffect(() => {
		const queryParams = new URLSearchParams(location.search)
		const mobile = queryParams.get('mobile') || ''
		const email = queryParams.get('email') || ''
		const name = queryParams.get('name') || ''
		const city = queryParams.get('city') || ''
		const ad_name = queryParams.get('ad_name') || ''
		const lead_created_at = queryParams.get('lead_created_at') || ''
		const platform = queryParams.get('platform') || ''

		// Push a dummy state so that when user presses back, popstate fires
		window.history.pushState({ backIntercepted: true }, '')

		const handlePopState = (e: PopStateEvent) => {
			navigate(
				`/fwg-tele-sales/follow-up-report-inner-list?mobile=${encodeURIComponent(
					mobile
				)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(
					name
				)}&city=${encodeURIComponent(city)}&ad_name=${encodeURIComponent(
					ad_name
				)}&lead_created_at=${encodeURIComponent(lead_created_at)}&platform=${encodeURIComponent(
					platform
				)}`
			)
		}

		window.addEventListener('popstate', handlePopState)
		return () => {
			window.removeEventListener('popstate', handlePopState)
		}
	}, [location.search, bodyAnalysisData])

	useEffect(() => {
		const fetchExistingReport = async () => {
			const queryParams = new URLSearchParams(location.search)
			const id = queryParams.get('id')
			if (id) {
				try {
					const res = await GetFwgFollowUpReport({ id })
					const parsedRes = res.data
					if (parsedRes?.data?.length > 0) {
						const report = parsedRes.data[0]
						setReportId(report._id)

						// Populate personal details
						setBodyAnalysisData((prev: any) => ({
							...prev,
							firstName: report.personalDetails?.full_name || '',
							gender: report.personalDetails?.gender || '',
							email: report.personalDetails?.email || '',
							mobile: report.personalDetails?.mobile || '',
							age: report.personalDetails?.age || '',
							height: report.personalDetails?.height || '',
							weight: report.personalDetails?.weight || '',
							city: report.personalDetails?.city || '',
							ad_name: report.personalDetails?.ad_name || '',
							lead_created_at: report.personalDetails?.lead_created_at || '',
							platform: report.personalDetails?.platform || '',
							additional_note: report.personalDetails?.additional_note || '',
						}))

						// Disable core fields (Full Name, Email, Mobile) since this is an existing record
						// Exception: PULL_MARKETING leads can edit name & email (only phone is their identifier)
						setIsCoreFieldDisabled(!isPullMarketing)
						if (
							report.personalDetails?.gender ||
							report.personalDetails?.age ||
							report.personalDetails?.height ||
							report.personalDetails?.weight
						) {
							setIsPersonalDetailsSaved(true)
						} else {
							setIsPersonalDetailsSaved(false)
						}

						// Get the last callHistory entry
						if (report.callHistory && report.callHistory.length > 0) {
							const lastCall = report.callHistory[report.callHistory.length - 1]
							const allCalls: any[] = report.callHistory

							// Merge goals from ALL callHistory entries
							const mergedGoals: string[] = []
							let isGoalsSkipped = false
							allCalls.forEach((c: any) => {
								if (c.goals) {
									if (c.goals.is_skipped) isGoalsSkipped = true
									if (Array.isArray(c.goals.selected_goals)) {
										c.goals.selected_goals.forEach((g: string) => {
											if (!mergedGoals.includes(g)) mergedGoals.push(g)
										})
									} else if (Array.isArray(c.goals)) {
										// Backward compatibility for old data
										c.goals.forEach((g: string) => {
											if (!mergedGoals.includes(g)) mergedGoals.push(g)
										})
									}
								}
							})

							if (isGoalsSkipped) setSectionSkipped((prev) => ({ ...prev, goal: true }))

							// Merge bodyCheckup from ALL callHistory entries
							const mergedMedical: string[] = []
							const mergedAllergy: string[] = []
							const mergedInjury: string[] = []
							allCalls.forEach((c: any) => {
								if (c.bodyCheckup) {
									; (c.bodyCheckup.medical_condition || []).forEach((v: string) => {
										if (!mergedMedical.includes(v)) mergedMedical.push(v)
									})
										; (c.bodyCheckup.food_allergy || []).forEach((v: string) => {
											if (!mergedAllergy.includes(v)) mergedAllergy.push(v)
										})
										; (c.bodyCheckup.previous_injury || []).forEach((v: string) => {
											if (!mergedInjury.includes(v)) mergedInjury.push(v)
										})
								}
							})

							// Populate Goals
							if (mergedGoals.length > 0) {
								const updatedGoals = goal.map((item: any) => {
									const key = Object.keys(item)[0]
									const isSelected = mergedGoals.includes(item.label)
									return {
										...item,
										[key]: { ...item[key], selected: isSelected },
									}
								})
								setGoal(updatedGoals)

								// Update selected cards for goals
								const goalCards = mergedGoals
									.map((g: string) => {
										const matchedGoal = goal.find((item: any) => item.label === g)
										if (matchedGoal) {
											const key = Object.keys(matchedGoal)[0]
											return `goal_${key}`
										}
										return null
									})
									.filter((card): card is string => card !== null)

								setSelectedCards((prev: string[]) => [...prev, ...goalCards])

								// Detect "Other" goal values (any values not in predefined labels)
								const knownGoalLabelsList = goal.map((item: any) => item.label)
								const otherGoalValues = mergedGoals.filter(
									(g: string) => !knownGoalLabelsList.includes(g)
								)
								if (otherGoalValues.length > 0) {
									setOtherGoal(otherGoalValues[0])
									setIsOtherGoalSelected(true)
									if (otherGoalValues.length > 1) {
										setExtraGoalOthers(otherGoalValues.slice(1))
									}
								}
							}

							// Populate Body Checkup
							const updatedBodyCheckup = { ...bodyCheckup }

							// Medical Conditions
							if (mergedMedical.length > 0) {
								updatedBodyCheckup.medical_condition = bodyCheckup.medical_condition.map(
									(item: any) => {
										const key = Object.keys(item)[0]
										const isSelected = mergedMedical.includes(item.label)
										return {
											...item,
											[key]: { ...item[key], selected: isSelected },
										}
									}
								)

								const medicalCards = mergedMedical
									.map((condition: string) => {
										const matchedCondition = bodyCheckup.medical_condition.find(
											(item: any) => item.label === condition
										)
										if (matchedCondition) {
											const key = Object.keys(matchedCondition)[0]
											return `medical_condition_${key}`
										}
										return null
									})
									.filter((card): card is string => card !== null)

								setSelectedCards((prev: string[]) => [...prev, ...medicalCards])

								const knownMedicalLabels = bodyCheckup.medical_condition.map(
									(item: any) => item.label
								)
								const otherMedicalValues = mergedMedical.filter(
									(c: string) => !knownMedicalLabels.includes(c)
								)
								if (otherMedicalValues.length > 0) {
									setOtherMedicalCondition(otherMedicalValues[0])
									setIsOtherSelected(true)
									if (otherMedicalValues.length > 1) {
										setExtraMedicalOthers(otherMedicalValues.slice(1))
									}
								}
							}

							// Food Allergies
							if (mergedAllergy.length > 0) {
								updatedBodyCheckup.food_allergy = bodyCheckup.food_allergy.map((item: any) => {
									const key = Object.keys(item)[0]
									const isSelected = mergedAllergy.includes(item.label)
									return {
										...item,
										[key]: { ...item[key], selected: isSelected },
									}
								})

								const allergyCards = mergedAllergy
									.map((allergy: string) => {
										const matchedAllergy = bodyCheckup.food_allergy.find(
											(item: any) => item.label === allergy
										)
										if (matchedAllergy) {
											const key = Object.keys(matchedAllergy)[0]
											return `food_allergy_${key}`
										}
										return null
									})
									.filter((card): card is string => card !== null)

								setSelectedCards((prev: string[]) => [...prev, ...allergyCards])

								const knownAllergyLabels = bodyCheckup.food_allergy.map((item: any) => item.label)
								const otherAllergyValues = mergedAllergy.filter(
									(a: string) => !knownAllergyLabels.includes(a)
								)
								if (otherAllergyValues.length > 0) {
									setOtherFoodAllergy(otherAllergyValues[0])
									setIsOtherFoodAllergySelected(true)
									if (otherAllergyValues.length > 1) {
										setExtraFoodAllergyOthers(otherAllergyValues.slice(1))
									}
								}
							}

							// Previous Injuries
							if (mergedInjury.length > 0) {
								updatedBodyCheckup.previous_injury = bodyCheckup.previous_injury.map(
									(item: any) => {
										const key = Object.keys(item)[0]
										const isSelected = mergedInjury.includes(item.label)
										return {
											...item,
											[key]: { ...item[key], selected: isSelected },
										}
									}
								)

								const injuryCards = mergedInjury
									.map((injury: string) => {
										const matchedInjury = bodyCheckup.previous_injury.find(
											(item: any) => item.label === injury
										)
										if (matchedInjury) {
											const key = Object.keys(matchedInjury)[0]
											return `previous_injury_${key}`
										}
										return null
									})
									.filter((card): card is string => card !== null)

								setSelectedCards((prev: string[]) => [...prev, ...injuryCards])

								const knownInjuryLabels = bodyCheckup.previous_injury.map((item: any) => item.label)
								const otherInjuryValues = mergedInjury.filter(
									(i: string) => !knownInjuryLabels.includes(i)
								)
								if (otherInjuryValues.length > 0) {
									setOtherPreviousInjury(otherInjuryValues[0])
									setIsOtherPreviousInjurySelected(true)
									if (otherInjuryValues.length > 1) {
										setExtraPreviousInjuryOthers(otherInjuryValues.slice(1))
									}
								}
							}

							setBodyCheckup(updatedBodyCheckup)

							// Populate Lifestyle — find first entry in allCalls that has lifestyle
							const lifestyleEntry = allCalls.find((c: any) => !!c.lifestyle)
							if (lifestyleEntry) {
								setLifestyle({
									wakeup_time: lifestyleEntry.lifestyle.wakeup_time || '',
									sleep_time: lifestyleEntry.lifestyle.sleep_time || '',
									breakfast_time: lifestyleEntry.lifestyle.breakfast_time || '',
									lunch_time: lifestyleEntry.lifestyle.lunch_time || '',
									dinner_time: lifestyleEntry.lifestyle.dinner_time || '',
									irregular_meals: lifestyleEntry.lifestyle.irregular_meals || false,
									smoking: lifestyleEntry.lifestyle.smoking || false,
									alcohol: lifestyleEntry.lifestyle.alcohol || false,
									water_intake_litre: lifestyleEntry.lifestyle.water_intake_litre || 0,
									job_type: lifestyleEntry.lifestyle.job_type || '',
									working_hours: lifestyleEntry.lifestyle.working_hours || 0,
									daily_steps: lifestyleEntry.lifestyle.daily_steps || 0,
								})

								setBlood((prev: any) => ({
									...prev,
									food_preference: lifestyleEntry.lifestyle.food_preference || '',
									stress_and_tension: lifestyleEntry.lifestyle.stress_and_tension || '',
									unhealthy_habits: lifestyleEntry.lifestyle.unhealthy_habits || '',
									running_medicine: lifestyleEntry.lifestyle.running_medicine || '',
									systolic_blood_pressure: lifestyleEntry.lifestyle.systolic_blood_pressure || '',
									diastolic_blood_pressure: lifestyleEntry.lifestyle.diastolic_blood_pressure || '',
									fbs: lifestyleEntry.lifestyle.fbs || '',
									hemoglobin_a1c: lifestyleEntry.lifestyle.hemoglobin_a1c || '',
									ppbs: lifestyleEntry.lifestyle.ppbs || '',
								}))

								if (lifestyleEntry.lifestyle.detailed_goal) {
									setDetailedGoal(lifestyleEntry.lifestyle.detailed_goal)
								}
							}

							// Populate Endurance Test — find first entry in allCalls that has enduranceTest
							const enduranceEntry = allCalls.find((c: any) => !!c.enduranceTest)
							if (enduranceEntry) {
								setEnduranceTest({
									treadmill_minutes:
										enduranceEntry.enduranceTest.treadmill_minutes?.toString() || '',
								})
								if (enduranceEntry.enduranceTest.strengthTest) {
									setStrengthTest({
										squats: enduranceEntry.enduranceTest.strengthTest.squats?.toString() || '',
										pushups: enduranceEntry.enduranceTest.strengthTest.pushups?.toString() || '',
										pullups: enduranceEntry.enduranceTest.strengthTest.pullups?.toString() || '',
										deadlift: enduranceEntry.enduranceTest.strengthTest.deadlift?.toString() || '',
										bench_press:
											enduranceEntry.enduranceTest.strengthTest.bench_press?.toString() || '',
										shoulder_press:
											enduranceEntry.enduranceTest.strengthTest.shoulder_press?.toString() || '',
									})
								}
								if (enduranceEntry.enduranceTest.flexibilityTest) {
									const ft = enduranceEntry.enduranceTest.flexibilityTest
									const baseUrl = 'https://files.fggroup.in/'
									setFlexibilityTest((prev: any) => ({
										...prev,
										before_preview: ft.flexibility_photo ? `${baseUrl}${ft.flexibility_photo}` : '',
										before_image_preview: ft.before_image_front
											? `${baseUrl}${ft.before_image_front}`
											: '',
										before_image_side_preview: ft.before_image_side
											? `${baseUrl}${ft.before_image_side}`
											: '',
										before_image_back_preview: ft.before_image_back
											? `${baseUrl}${ft.before_image_back}`
											: '',
									}))
								}
							}

							// Determine filled sections by scanning ALL callHistory entries
							setFilledSections({
								goal: isGoalsSkipped || mergedGoals.length > 0,
								bodyCheckup: allCalls.some(
									(c: any) =>
										c.bodyCheckup?.is_skipped ||
										(c.bodyCheckup &&
											((c.bodyCheckup.medical_condition &&
												c.bodyCheckup.medical_condition.length > 0) ||
												(c.bodyCheckup.food_allergy && c.bodyCheckup.food_allergy.length > 0) ||
												(c.bodyCheckup.previous_injury &&
													c.bodyCheckup.previous_injury.length > 0)))
								),
								lifestyle: allCalls.some((c: any) => c.lifestyle?.is_skipped || !!c.lifestyle),
								enduranceTest: allCalls.some(
									(c: any) => c.enduranceTest?.is_skipped || !!c.enduranceTest
								),
								programDetails: allCalls.some(
									(c: any) => c.programDetails?.is_skipped || !!c.programDetails
								),
							})

							setSectionSkipped({
								goal: isGoalsSkipped,
								bodyCheckup: allCalls.some((c: any) => c.bodyCheckup?.is_skipped),
								lifestyle: allCalls.some((c: any) => c.lifestyle?.is_skipped),
								enduranceTest: allCalls.some((c: any) => c.enduranceTest?.is_skipped),
								programDetails: allCalls.some((c: any) => c.programDetails?.is_skipped),
							})

							const queryCallId = queryParams.get('call_id')
							const isEditingSpecificCall = !!queryCallId

							if (isEditingSpecificCall) {
								const specificCall = allCalls.find((c: any) => c._id === queryCallId)
								if (specificCall) {
									const isPitchFilled = !!(
										specificCall.pitchReport &&
										(specificCall.pitchReport.telecaller_name ||
											specificCall.pitchReport.interest_level ||
											specificCall.pitchReport.follow_up_date ||
											specificCall.pitchReport.call_recording ||
											specificCall.pitchReport.objections)
									)
									if (isPitchFilled) {
										setIsCallLocked(true)
										setShowOnlyPitch(true)
									}
									setCurrentCallId(specificCall._id)
									setLastSavedStep(specificCall.returnFrom || '')
								}
							} else {
								// Adding a NEW call entry
								const hasAnyCompletedCall = allCalls.some(
									(c: any) => c.pitchReport && c.pitchReport.telecaller_name
								)
								if (hasAnyCompletedCall) {
									setShowOnlyPitch(true)
								}
								setCurrentCallId(null) // New call
								setLastSavedStep('')
							}

							// Populate Program Details — find first entry in allCalls that has programDetails
							const programEntry = allCalls.find((c: any) => !!c.programDetails)
							if (programEntry) {
								setSelectedProgramId(programEntry.programDetails.program_name || '')
								setProgramDuration(programEntry.programDetails.duration || '')
								setProgramAmount(
									programEntry.programDetails.amount
										? programEntry.programDetails.amount.toString()
										: ''
								)
								setPaymentMethod(programEntry.programDetails.payment_method || '')
								setWorkoutMode(programEntry.programDetails.workout_mode || '')
								setWorkoutBranch(programEntry.programDetails.workout_branch || '')
							}
						}
					}
				} catch (error) {
					console.error('Failed to fetch report for editing', error)
				}
			} else {
				// No ID provided, check for pre-filled data from redirection
				const mobile = queryParams.get('mobile')
				const email = queryParams.get('email')
				const name = queryParams.get('name')
				const city = queryParams.get('city')
				const ad_name = queryParams.get('ad_name')
				const lead_created_at = queryParams.get('lead_created_at')
				const platform = queryParams.get('platform')
				const additional_note = queryParams.get('additional_note')

				if (mobile || name || email) {
					// Disable core fields; for PULL_MARKETING, only mobile is locked (name & email editable)
					setIsCoreFieldDisabled(!isPullMarketing)
					// Clean placeholder values like '-' or 'N/A'
					const cleanName = (name && name !== '-' && name !== 'N/A') ? name : ''
					const cleanEmail = (email && email !== '-' && email !== 'N/A' && email !== 'undefined') ? email : ''
					setBodyAnalysisData((prev: any) => ({
						...prev,
						firstName: cleanName,
						email: cleanEmail,
						mobile: mobile || '',
						city: city || '',
						ad_name: ad_name || '',
						lead_created_at: lead_created_at || '',
						platform: platform || '',
						additional_note: additional_note || '',
					}))
				}
			}
		}

		fetchExistingReport()
	}, [location.search])

	const handleBodyAnalysisInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setBodyAnalysisData((prevData: any) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}))
		} else {
			setBodyAnalysisData((prevData: any) => {
				let updatedData = { ...prevData, [name]: value }
				if (name === 'category') {
					if (value === 'Children') {
						updatedData.pulses = { category: 'children', value: '70-100' }
					} else if (value === 'Adults') {
						updatedData.pulses = { category: 'adults', value: '60-100' }
					}
				}
				return updatedData
			})
		}
	}
	const handleCompositionChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		setComposition((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}
	const handleBodyConditionChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		setComposition((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}
	const handleBloodPressureChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		setBlood((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}
	const handleBloodSugarChange = (index: number) => {
		setBloodSugar((prevData: any) => {
			const updatedData = [...prevData]
			updatedData[index].selected = !updatedData[index].selected
			return updatedData
		})
	}
	const [lifestyle, setLifestyle] = useState<any>({
		wakeup_time: '',
		sleep_time: '',
		breakfast_time: '',
		lunch_time: '',
		dinner_time: '',
		irregular_meals: false,
		smoking: false,
		alcohol: false,
		water_intake_litre: Number,
		job_type: '',
		working_hours: Number,
		daily_steps: Number,
	})

	const [detailedGoal, setDetailedGoal] = useState<string>('')

	const [pitchReport, setPitchReport] = useState<any>({
		telecaller_name: '',
		call_duration_minutes: Number,
		interest_level: '',
		objections: '',
		follow_up_date: '',
		call_recording: null as File | null,
	})

	const demoPrograms = [
		{
			id: 'fat_loss_3m',
			name: 'Fat Loss',
			duration: '3 Months',
			amount: 15000,
			salesScript:
				'This 3-month fat loss program focuses on sustainable calorie deficit, structured workouts and weekly accountability to ensure visible inch loss and better energy.',
		},
		{
			id: 'muscle_gain_3m',
			name: 'Muscle Gain',
			duration: '3 Months',
			amount: 18000,
			salesScript:
				'This muscle gain program is designed to increase strength and lean mass with progressive overload training and high-protein nutrition guidance.',
		},
		{
			id: 'lifestyle_6m',
			name: 'Lifestyle Transformation',
			duration: '6 Months',
			amount: 30000,
			salesScript:
				'6-month lifestyle transformation program to build lifelong healthy habits with personalized diet, workouts and regular mindset coaching.',
		},
	]

	const [selectedProgramId, setSelectedProgramId] = useState<string>('')
	const [programDuration, setProgramDuration] = useState<string>('')
	const [programAmount, setProgramAmount] = useState<string>('')
	const [programSalesScript, setProgramSalesScript] = useState<string>('')
	const [paymentMethod, setPaymentMethod] = useState<string>('')
	const [workoutMode, setWorkoutMode] = useState<'online' | 'offline' | ''>('')
	const [workoutBranch, setWorkoutBranch] = useState<string>('')

	const handleLifestyleChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value, type } = event.target
		const checked = (event.target as HTMLInputElement).checked

		setLifestyle((prevData: any) => ({
			...prevData,
			[name]: type === 'checkbox' ? checked : value,
		}))
	}

	const handleDetailedGoalChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setDetailedGoal(event.target.value)
	}

	const handlePitchReportChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value, type } = event.target
		const checked = (event.target as HTMLInputElement).checked
		const files = (event.target as HTMLInputElement).files

		setPitchReport((prevData: any) => ({
			...prevData,
			[name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] : value,
		}))
	}
	const handleProgramChange = (event: React.ChangeEvent<any>) => {
		const { value } = event.target
		setSelectedProgramId(value)
		const selected = demoPrograms.find((p) => p.name === value || p.id === value)
		if (selected) {
			setProgramDuration(selected.duration)
			setProgramAmount(selected.amount.toString())
			setProgramSalesScript(selected.salesScript)
		} else {
			setProgramDuration('')
			setProgramAmount('')
			setProgramSalesScript('')
		}
	}

	const handlePaymentMethodChange = (event: React.ChangeEvent<any>) => {
		setPaymentMethod(event.target.value)
	}
	const handleEnduranceChange = (event: React.ChangeEvent<any>) => {
		const { name, value } = event.target
		setEnduranceTest((prev) => ({ ...prev, [name]: value }))
	}
	const handleStrengthChange = (event: React.ChangeEvent<any>) => {
		const { name, value } = event.target
		setStrengthTest((prev) => ({ ...prev, [name]: value }))
	}
	const handleFlexibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { files } = event.target
		if (files && files[0]) {
			const file = files[0]
			setFlexibilityTest((prev) => ({
				...prev,
				before_photo: file,
				before_preview: URL.createObjectURL(file),
			}))
		}
	}

	// Handler for Front Image
	const handleFlexibilityBeforeImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { files } = event.target
		if (files && files[0]) {
			const file = files[0]
			setFlexibilityTest((prev) => ({
				...prev,
				before_image_photo: file,
				before_image_preview: URL.createObjectURL(file),
			}))
		}
	}

	// Handler for Side Image
	const handleFlexibilityBeforeImageSideChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { files } = event.target
		if (files && files[0]) {
			const file = files[0]
			setFlexibilityTest((prev) => ({
				...prev,
				before_image_side_photo: file,
				before_image_side_preview: URL.createObjectURL(file),
			}))
		}
	}

	// Handler for Back Image
	const handleFlexibilityBeforeImageBackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { files } = event.target
		if (files && files[0]) {
			const file = files[0]
			setFlexibilityTest((prev) => ({
				...prev,
				before_image_back_photo: file,
				before_image_back_preview: URL.createObjectURL(file),
			}))
		}
	}

	// Remove all images
	const handleFlexibilityRemove = () => {
		setFlexibilityTest({
			before_photo: null,
			before_preview: '',
			before_image_photo: null,
			before_image_preview: '',
			before_image_side_photo: null,
			before_image_side_preview: '',
			before_image_back_photo: null,
			before_image_back_preview: '',
		})
		if (flexibilityBeforeInputRef.current) {
			flexibilityBeforeInputRef.current.value = ''
		}
		if (flexibilityBeforeImageInputRef.current) {
			flexibilityBeforeImageInputRef.current.value = ''
		}
		if (flexibilityBeforeSideInputRef.current) {
			flexibilityBeforeSideInputRef.current.value = ''
		}
		if (flexibilityBeforeBackInputRef.current) {
			flexibilityBeforeBackInputRef.current.value = ''
		}
	}

	// Individual remove functions
	const handleRemoveFrontImage = () => {
		setFlexibilityTest((prev) => ({
			...prev,
			before_image_photo: null,
			before_image_preview: '',
		}))
		if (flexibilityBeforeImageInputRef.current) {
			flexibilityBeforeImageInputRef.current.value = ''
		}
	}

	const handleRemoveSideImage = () => {
		setFlexibilityTest((prev) => ({
			...prev,
			before_image_side_photo: null,
			before_image_side_preview: '',
		}))
		if (flexibilityBeforeSideInputRef.current) {
			flexibilityBeforeSideInputRef.current.value = ''
		}
	}

	const handleRemoveBackImage = () => {
		setFlexibilityTest((prev) => ({
			...prev,
			before_image_back_photo: null,
			before_image_back_preview: '',
		}))
		if (flexibilityBeforeBackInputRef.current) {
			flexibilityBeforeBackInputRef.current.value = ''
		}
	}

	const [goal, setGoal] = useState<any>([
		{ FatLoss: { selected: false }, label: 'Fat Loss', img: 'fat_loss.png' },
		{ MuscleGain: { selected: false }, label: 'Muscle Gain', img: 'muscle_gain.png' },
		{ MaintainWeight: { selected: false }, label: 'Maintain Weight', img: 'maintain_weight.png' },
		{
			ImproveSleepQuality: { selected: false },
			label: 'Improve Sleep Quality',
			img: 'improve_sleep_quality.png',
		},
		{
			AdoptABalancedDiet: { selected: false },
			label: 'Adopt A Balanced Diet',
			img: 'adopt_a_balanced_diet.png',
		},
		{ ManageStress: { selected: false }, label: 'Manage Stress', img: 'manage_stress.png' },
		{
			IncreaseFlexibility: { selected: false },
			label: 'Increase Flexibility',
			img: 'increase_flexibility.png',
		},
		{
			BodyRecomposition: { selected: false },
			label: 'Body Recomposition',
			img: 'body_recomposition.png',
		},
		{
			DigestiveDisorders: { selected: false },
			label: 'Digestive Disorders',
			img: 'digestive_disorders.png',
		},
		{
			Diabetes: { selected: false },
			label: 'Diabetes',
			img: 'diabetes.png',
		},
		{
			HTN: { selected: false },
			label: 'HTN',
			img: 'htn.png',
		},
		{
			Thyroid: { selected: false },
			label: 'Thyroid',
			img: 'thyroid.png',
		},
		{
			PCOS: { selected: false },
			label: 'PCOS',
			img: 'pcos.png',
		},
		{
			PrepCoachingSegment: { selected: false },
			label: 'Prep Coaching Segment',
			img: 'prep_coaching_segment.png',
		},
	])

	const [bodyCheckup, setBodyCheckup] = useState<any>({
		medical_condition: [
			{ Thyroid: { selected: false }, label: 'Thyroid', img: 'thyroid.png' },
			{ Pcos: { selected: false }, label: 'Pcos', img: 'pcos.png' },
			{ Diabetes: { selected: false }, label: 'Diabetes', img: 'diebetes.png' },
			{ ChestXray: { selected: false }, label: 'Chest X-ray', img: 'x-ray_3609786.png' },
			{ ECG: { selected: false }, label: 'ECG', img: 'ekg_5873285.png' },
			{
				CardiacTest: { selected: false },
				label: 'Cardiac Test',
				img: 'medical-diagnostics_9599477.png',
			},
			{
				BloodAndSwabTests: { selected: false },
				label: 'Blood and swab tests',
				img: 'test_4597063.png',
			},
			{ LiverandKidney: { selected: false }, label: 'Liver Tests', img: 'LiverandKidney.png' },
			{ BloodPressure: { selected: false }, label: 'Blood Pressure', img: 'blood_pressure.png' },
			{
				BodyMassIndex: { selected: false },
				label: 'Body Mass Index (BMI)',
				img: 'body_mass_index.png',
			},
			{ LeanBodyMass: { selected: false }, label: 'Lean Body Mass', img: 'lean_body_mass.png' },
		],
		food_allergy: [
			{ Milk: { selected: false }, label: 'Milk', img: 'milk.png' },
			{ Gluten: { selected: false }, label: 'Gluten', img: 'gluten.png' },
			{ Citrus: { selected: false }, label: 'Citrus', img: 'citrus.png' },
			{ Rice: { selected: false }, label: 'Rice', img: 'rice_129356.png' },
			{ Potato: { selected: false }, label: 'Potato', img: 'fruit_13746880.png' },
			{ Peanut: { selected: false }, label: 'Peanut', img: 'peanut_1728767.png' },
			{ Spinach: { selected: false }, label: 'Spinach', img: 'spinach_5520618.png' },
		],
		previous_injury: [
			{ KneePain: { selected: false }, label: 'Knee Pain', img: 'knee-pain.png' },
			{ ShoulderPain: { selected: false }, label: 'Shoulder Pain', img: 'shoulder.png' },
			{ BackPain: { selected: false }, label: 'Back Pain', img: 'back.png' },
			{ TennisElbow: { selected: false }, label: 'Tennis Elbow', img: 'arm_9099547.png' },
			{ WristPain: { selected: false }, label: 'Wrist Pain', img: 'hand_9961842.png' },
			{ NeckPain: { selected: false }, label: 'Neck Pain', img: 'neck_9961885.png' },
			{ CalfPain: { selected: false }, label: 'Calf Pain', img: 'leg_9961877.png' },
		],
		food_preference: [
			{ Vegetarian: { selected: false }, label: 'VEGETARIAN', img: 'Vegetarian.png' },
			{ NonVegetarian: { selected: false }, label: 'NON-VEGETARIAN', img: 'free-non-veg-food.png' },
			{ Vegan: { selected: false }, label: 'VEGAN', img: 'Vegan.png' },
			{ Eggiterian: { selected: false }, label: 'EGGETARIAN', img: 'Eggiterian.png' },
		],
		otherGoalCondition: '',
		otherMedicalCondition: '',
		otherFoodAllergy: '',
		otherPreviousInjury: '',
		selectedFile: null as File | null,
	})

	const [selectedCards, setSelectedCards] = useState<string[]>([])
	const [isOtherSelected, setIsOtherSelected] = useState(false)
	const [isOtherFoodAllergySelected, setIsOtherFoodAllergySelected] = useState(false)
	const [isOtherPreviousInjurySelected, setIsOtherPreviousInjurySelected] = useState(false)
	const [isOtherGoalSelected, setIsOtherGoalSelected] = useState(false)

	// Separate state variables for "Other" inputs
	const [otherGoal, setOtherGoal] = useState<string>('')
	const [otherMedicalCondition, setOtherMedicalCondition] = useState<string>('')
	const [otherFoodAllergy, setOtherFoodAllergy] = useState<string>('')
	const [otherPreviousInjury, setOtherPreviousInjury] = useState<string>('')
	const [extraGoalOthers, setExtraGoalOthers] = useState<string[]>([])
	const [extraMedicalOthers, setExtraMedicalOthers] = useState<string[]>([])
	const [extraFoodAllergyOthers, setExtraFoodAllergyOthers] = useState<string[]>([])
	const [extraPreviousInjuryOthers, setExtraPreviousInjuryOthers] = useState<string[]>([])

	const [enduranceTest, setEnduranceTest] = useState<{ treadmill_minutes: string }>({
		treadmill_minutes: '',
	})
	const [strengthTest, setStrengthTest] = useState<{
		squats: string
		pushups: string
		pullups: string
		deadlift: string
		bench_press: string
		shoulder_press: string
	}>({
		squats: '',
		pushups: '',
		pullups: '',
		deadlift: '',
		bench_press: '',
		shoulder_press: '',
	})
	const [flexibilityTest, setFlexibilityTest] = useState<{
		before_photo: File | null
		before_preview: string
		before_image_photo: File | null
		before_image_preview: string
		before_image_side_photo: File | null
		before_image_side_preview: string
		before_image_back_photo: File | null
		before_image_back_preview: string
	}>({
		before_photo: null,
		before_preview: '',
		before_image_photo: null,
		before_image_preview: '',
		before_image_side_photo: null,
		before_image_side_preview: '',
		before_image_back_photo: null,
		before_image_back_preview: '',
	})
	const flexibilityBeforeInputRef = useRef<HTMLInputElement | null>(null)
	const flexibilityBeforeImageInputRef = useRef<HTMLInputElement | null>(null)
	const flexibilityBeforeSideInputRef = useRef<HTMLInputElement | null>(null)
	const flexibilityBeforeBackInputRef = useRef<HTMLInputElement | null>(null)
	const clientImageInputRef = useRef<HTMLInputElement | null>(null)

	const handleClientImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			setBodyAnalysisData((prevData: any) => ({
				...prevData,
				profile_image: file,
				profile_image_preview: URL.createObjectURL(file),
			}))
		}
	}

	const handleRemoveClientImage = () => {
		setBodyAnalysisData((prevData: any) => ({
			...prevData,
			profile_image: null,
			profile_image_preview: '',
		}))
		if (clientImageInputRef.current) {
			clientImageInputRef.current.value = ''
		}
	}

	const handleBodyCheckupInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setBodyCheckup((prevData: any) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}))
		} else {
			if (name === 'otherGoalCondition') {
				setIsOtherSelected(value.length > 0)
			}
			if (name === 'otherMedicalCondition') {
				setIsOtherSelected(value.length > 0)
			}
			if (name === 'otherFoodAllergy') {
				setIsOtherFoodAllergySelected(value.length > 0)
			}
			if (name === 'otherPreviousInjury') {
				setIsOtherPreviousInjurySelected(value.length > 0)
			}
			setBodyCheckup((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleCardClick = (category: string, item: any) => {
		const key = Object.keys(item)[0]
		const cardId = `${category}_${key}`

		// Toggle selected state of the clicked card
		const updatedBodyCheckup = { ...bodyCheckup }
		const categoryItems = updatedBodyCheckup[category]

		if (categoryItems) {
			const index = categoryItems.findIndex((card: any) => Object.keys(card)[0] === key)

			if (index !== -1) {
				categoryItems[index][key].selected = !categoryItems[index][key].selected

				setBodyCheckup({ ...updatedBodyCheckup })

				if (categoryItems[index][key].selected) {
					setSelectedCards([...selectedCards, cardId])
				} else {
					setSelectedCards(selectedCards.filter((id) => id !== cardId))
				}
			}
		} else {
			console.error(`Category ${category} not found in bodyCheckup state.`)
		}
	}

	const handleGoalCardClick = (item: any) => {
		const key = Object.keys(item)[0]
		const cardId = `goal_${key}`

		// Toggle selected state of the clicked card
		const updatedGoal = [...goal]
		const index = updatedGoal.findIndex((card: any) => Object.keys(card)[0] === key)

		if (index !== -1) {
			updatedGoal[index][key].selected = !updatedGoal[index][key].selected

			setGoal(updatedGoal)

			if (updatedGoal[index][key].selected) {
				setSelectedCards([...selectedCards, cardId])
			} else {
				setSelectedCards(selectedCards.filter((id) => id !== cardId))
			}
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
				{/* Original "Other" card with + icon */}
				<div
					className='col-md-3 my-2'
					style={{ position: 'relative' }}>
					<button
						type='button'
						title='Add another'
						onClick={(e) => {
							e.preventDefault()
							setExtraValues((prev) => [...prev, ''])
						}}
						style={{
							position: 'absolute',
							top: '8px',
							right: '18px',
							zIndex: 10,
							width: '24px',
							height: '24px',
							borderRadius: '50%',
							background: '#e1f0ff',
							border: '1px solid #b8dbff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							padding: 0,
						}}>
						<i
							className='bi bi-plus'
							style={{ fontSize: '16px', lineHeight: 1, color: '#009ef7' }}></i>
					</button>
					<label
						className={`btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center ${isMainSelected ? 'border-primary' : ''
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
				{extraValues.map((val, idx) => {
					const showPlusIcon = val.trim() !== ''
					return (
						<div
							className='col-md-3 my-2'
							key={`extra_${mainName}_${idx}`}
							style={{ position: 'relative' }}>
							{showPlusIcon ? (
								<button
									type='button'
									title='Add another'
									onClick={(e) => {
										e.preventDefault()
										setExtraValues((prev) => [...prev, ''])
									}}
									style={{
										position: 'absolute',
										top: '8px',
										right: '18px',
										zIndex: 10,
										width: '24px',
										height: '24px',
										borderRadius: '50%',
										background: '#e1f0ff',
										border: '1px solid #b8dbff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
										padding: 0,
									}}>
									<i
										className='bi bi-plus'
										style={{ fontSize: '16px', lineHeight: 1, color: '#009ef7' }}></i>
								</button>
							) : (
								<button
									type='button'
									title='Remove'
									onClick={(e) => {
										e.preventDefault()
										setExtraValues((prev) => prev.filter((_, i) => i !== idx))
									}}
									style={{
										position: 'absolute',
										top: '8px',
										right: '18px',
										zIndex: 10,
										width: '24px',
										height: '24px',
										borderRadius: '50%',
										background: '#fff5f8',
										border: '1px solid #f1416c',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
										padding: 0,
									}}>
									<i
										className='bi bi-x'
										style={{ fontSize: '16px', lineHeight: 1, color: '#f1416c' }}></i>
								</button>
							)}
							<label
								className={`btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center ${val.trim().length > 0 ? 'border-primary' : ''
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
					)
				})}
			</>
		)
	}

	const renderCheckboxes = (category: any, items: any) => {
		return (
			<>
				{items.map((item: any, index: any) => {
					const key = Object.keys(item)[0]
					const cardId = `${category}_${key}`
					const isSelected = selectedCards.includes(cardId)

					return (
						<div
							className='col-md-3 my-2'
							key={index}
							onClick={() => handleCardClick(category, item)}
							style={{ cursor: 'pointer' }}>
							<input
								type='checkbox'
								className='btn-check'
								name={category.toLowerCase()}
								value={key.toLowerCase()}
								id={`${key.toLowerCase()}_${index}`}
								checked={isSelected}
								onChange={() => handleCardClick(category, item)}
							/>
							<label
								className={`btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center ${isSelected ? 'active border-primary' : ''
									}`}
								htmlFor={`${key.toLowerCase()}_${index}`}>
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

	const renderGoalCheckboxes = (items: any) => {
		return (
			<>
				{items.map((item: any, index: any) => {
					const key = Object.keys(item)[0]
					const cardId = `goal_${key}`
					const isSelected = selectedCards.includes(cardId)

					return (
						<div
							className='col-md-3 my-2'
							key={index}
							onClick={() => handleGoalCardClick(item)}
							style={{ cursor: 'pointer' }}>
							<input
								type='checkbox'
								className='btn-check'
								name='goal'
								value={key.toLowerCase()}
								id={`${key.toLowerCase()}_${index}`}
								checked={isSelected}
								onChange={() => handleGoalCardClick(item)}
							/>
							<label
								className={`btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center ${isSelected ? 'active border-primary' : ''
									}`}
								htmlFor={`${key.toLowerCase()}_${index}`}>
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

	const saveProgress = async (step: string, isSkipped: boolean = false) => {
		try {
			setIsSubmitting(true)

			const queryParamsSave = new URLSearchParams(location.search)
			const urlId = queryParamsSave.get('id')

			const selectedMedicalConditions = bodyCheckup.medical_condition
				.filter((item: any) => item[Object.keys(item)[0]].selected)
				.map((item: any) => item.label)
			if (otherMedicalCondition.trim() !== '') {
				selectedMedicalConditions.push(otherMedicalCondition.trim())
			}
			extraMedicalOthers
				.filter((v) => v.trim() !== '')
				.forEach((v) => {
					selectedMedicalConditions.push(v.trim())
				})

			const selectedFoodAllergies = bodyCheckup.food_allergy
				.filter((item: any) => item[Object.keys(item)[0]].selected)
				.map((item: any) => item.label)
			if (otherFoodAllergy.trim() !== '') {
				selectedFoodAllergies.push(otherFoodAllergy.trim())
			}
			extraFoodAllergyOthers
				.filter((v) => v.trim() !== '')
				.forEach((v) => {
					selectedFoodAllergies.push(v.trim())
				})

			const selectedPreviousInjuries = bodyCheckup.previous_injury
				.filter((item: any) => item[Object.keys(item)[0]].selected)
				.map((item: any) => item.label)
			if (otherPreviousInjury.trim() !== '') {
				selectedPreviousInjuries.push(otherPreviousInjury.trim())
			}
			extraPreviousInjuryOthers
				.filter((v) => v.trim() !== '')
				.forEach((v) => {
					selectedPreviousInjuries.push(v.trim())
				})

			const selectedGoals = goal
				.filter((item: any) => item[Object.keys(item)[0]].selected)
				.map((item: any) => item.label)
			if (otherGoal.trim() !== '') {
				selectedGoals.push(otherGoal.trim())
			}
			extraGoalOthers
				.filter((v) => v.trim() !== '')
				.forEach((v) => {
					selectedGoals.push(v.trim())
				})

			let payload: any = {}
			let activeReportId = reportId || urlId
			let activeCallId = currentCallId

			if (!activeReportId) {
				// Create initial report with Personal Details only (no callHistory for Body Analysis)
				payload = {
					personalDetails: {
						full_name: bodyAnalysisData.firstName,
						gender: bodyAnalysisData.gender,
						email: bodyAnalysisData.email,
						mobile: bodyAnalysisData.mobile,
						age: bodyAnalysisData.age ? parseInt(bodyAnalysisData.age) : undefined,
						height: bodyAnalysisData.height ? parseInt(bodyAnalysisData.height) : undefined,
						weight: bodyAnalysisData.weight ? parseInt(bodyAnalysisData.weight) : undefined,
					},
				}

				// Always create callHistory on first save to ensure we can jump to Pitch Report
				if (true) {
					payload.callHistory = [
						{
							callDate: new Date(),
							returnFrom: step,
						},
					]
				}

				const res = await CreateFwgFollowUpReport(payload)
				if (res.data?._id) {
					activeReportId = res.data._id
					setReportId(activeReportId)
					if (res.data.callHistory?.[0]?._id) {
						activeCallId = res.data.callHistory[0]._id
						setCurrentCallId(activeCallId)
					}
				}
			} else if (!activeCallId || isCallLocked) {
				// We have an existing report but no current call entry (or the session is locked), so create it
				const res = await AddFwgCallEntry({ id: activeReportId })
				if (res.data?._id) {
					activeReportId = res.data._id
					setReportId(activeReportId)
					if (res.data.callHistory && res.data.callHistory.length > 0) {
						activeCallId = res.data.callHistory[res.data.callHistory.length - 1]._id
						setCurrentCallId(activeCallId)
						setIsCallLocked(false) // Unlocked now with the NEW call history entry
					}
				}
			}

			if (
				activeReportId &&
				activeCallId &&
				(activeReportId === urlId || step === 'Personal Details' || step !== 'Personal Details')
			) {
				const returnFromStep = step === 'Pitch Report' ? (lastSavedStep || 'Pitch Report') : step
				if (step !== 'Pitch Report') setLastSavedStep(step)
				payload = {
					returnFrom: returnFromStep,
				}

				if (step === 'Personal Details') {
					payload.personalDetails = {
						full_name: bodyAnalysisData.firstName,
						gender: bodyAnalysisData.gender,
						email: bodyAnalysisData.email,
						mobile: bodyAnalysisData.mobile,
						age: bodyAnalysisData.age ? parseInt(bodyAnalysisData.age) : undefined,
						height: bodyAnalysisData.height ? parseInt(bodyAnalysisData.height) : undefined,
						weight: bodyAnalysisData.weight ? parseInt(bodyAnalysisData.weight) : undefined,
						additional_note: bodyAnalysisData.additional_note,
					}
				} else if (step === 'Goal') {
					payload.goals = {
						selected_goals: isSkipped ? [] : selectedGoals,
						is_skipped: isSkipped ? true : undefined,
					}
				} else if (step === 'Body Checkup') {
					payload.bodyCheckup = {
						medical_condition: isSkipped ? [] : selectedMedicalConditions,
						food_allergy: isSkipped ? [] : selectedFoodAllergies,
						previous_injury: isSkipped ? [] : selectedPreviousInjuries,
						is_skipped: isSkipped ? true : undefined,
					}
				} else if (step === 'Lifestyle') {
					payload.lifestyle = {
						...lifestyle,
						food_preference: blood.food_preference,
						stress_and_tension: blood.stress_and_tension,
						unhealthy_habits: blood.unhealthy_habits,
						running_medicine: blood.running_medicine,
						systolic_blood_pressure: blood.systolic_blood_pressure,
						diastolic_blood_pressure: blood.diastolic_blood_pressure,
						fbs: blood.fbs,
						hemoglobin_a1c: blood.hemoglobin_a1c,
						ppbs: blood.ppbs,
						detailed_goal: detailedGoal,
						is_skipped: isSkipped ? true : undefined,
					}
				} else if (step === 'Endurance Test') {
					// Upload image files first, then build payload with returned URLs
					let flexibilityPhotoUrl = flexibilityTest.before_preview
					let beforeImageFrontUrl = flexibilityTest.before_image_preview
					let beforeImageSideUrl = flexibilityTest.before_image_side_preview
					let beforeImageBackUrl = flexibilityTest.before_image_back_preview

					if (!isSkipped) {
						if (flexibilityTest.before_photo) {
							const res: any = await FileUploadToFGGroup([flexibilityTest.before_photo], {
								directory: 'follow-up',
							})
							flexibilityPhotoUrl = res.data?.fileURLs?.[0] || flexibilityPhotoUrl
						}
						if (flexibilityTest.before_image_photo) {
							const res: any = await FileUploadToFGGroup([flexibilityTest.before_image_photo], {
								directory: 'follow-up',
							})
							beforeImageFrontUrl = res.data?.fileURLs?.[0] || beforeImageFrontUrl
						}
						if (flexibilityTest.before_image_side_photo) {
							const res: any = await FileUploadToFGGroup(
								[flexibilityTest.before_image_side_photo],
								{ directory: 'follow-up' }
							)
							beforeImageSideUrl = res.data?.fileURLs?.[0] || beforeImageSideUrl
						}
						if (flexibilityTest.before_image_back_photo) {
							const res: any = await FileUploadToFGGroup(
								[flexibilityTest.before_image_back_photo],
								{ directory: 'follow-up' }
							)
							beforeImageBackUrl = res.data?.fileURLs?.[0] || beforeImageBackUrl
						}
					}

					payload.enduranceTest = {
						treadmill_minutes: isSkipped
							? 0
							: enduranceTest.treadmill_minutes
								? parseInt(enduranceTest.treadmill_minutes)
								: 0,
						strengthTest: {
							squats: isSkipped ? 0 : strengthTest.squats ? parseInt(strengthTest.squats) : 0,
							pushups: isSkipped ? 0 : strengthTest.pushups ? parseInt(strengthTest.pushups) : 0,
							pullups: isSkipped ? 0 : strengthTest.pullups ? parseInt(strengthTest.pullups) : 0,
							deadlift: isSkipped ? 0 : strengthTest.deadlift ? parseInt(strengthTest.deadlift) : 0,
							bench_press: isSkipped
								? 0
								: strengthTest.bench_press
									? parseInt(strengthTest.bench_press)
									: 0,
							shoulder_press: isSkipped
								? 0
								: strengthTest.shoulder_press
									? parseInt(strengthTest.shoulder_press)
									: 0,
						},
						flexibilityTest: {
							flexibility_photo: isSkipped ? '' : flexibilityPhotoUrl,
							before_image_front: isSkipped ? '' : beforeImageFrontUrl,
							before_image_side: isSkipped ? '' : beforeImageSideUrl,
							before_image_back: isSkipped ? '' : beforeImageBackUrl,
						},
						is_skipped: isSkipped ? true : undefined,
					}
				} else if (step === 'Program Details') {
					payload.programDetails = {
						program_name: isSkipped ? '' : selectedProgramId,
						duration: isSkipped ? '' : programDuration,
						amount: isSkipped ? 0 : programAmount ? parseInt(programAmount) : 0,
						payment_method: isSkipped ? '' : paymentMethod,
						workout_mode: isSkipped ? '' : workoutMode,
						workout_branch: isSkipped ? '' : workoutBranch,
						is_skipped: isSkipped ? true : undefined,
					}
				} else if (step === 'Pitch Report') {
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

					payload.pitchReport = {
						telecaller_name: pitchReport.telecaller_name,
						interest_level: pitchReport.interest_level,
						follow_up_date: pitchReport.follow_up_date || undefined,
						call_recording: callRecordingUrl,
						objections: pitchReport.objections,
					}
				}

				await UpdateFwgCallEntry({ id: activeReportId, callHistoryId: activeCallId }, payload)

				const keyMap: Record<string, string> = {
					Goal: 'goal',
					'Body Checkup': 'bodyCheckup',
					Lifestyle: 'lifestyle',
					'Endurance Test': 'enduranceTest',
					'Program Details': 'programDetails',
					'Pitch Report': 'pitchReport',
				}
				const key = keyMap[step] || step.toLowerCase().replace(' ', '')

				setFilledSections((prev: any) => ({ ...prev, [key]: true }))
				if (isSkipped) setSectionSkipped((prev: any) => ({ ...prev, [key]: true }))
				toast.success(`${step} ${isSkipped ? 'Skipped' : 'Saved'}!`)
			}

			setIsSubmitting(false)
			return true
		} catch (error: any) {
			setIsSubmitting(false)
			toast.error(error.message)
			return false
		}
	}

	const handleSkipSection = async (step: string) => {
		const result = await saveProgress(step, true)
		if (result) {
			// Auto move to next accordion
			const accordions: Record<string, string> = {
				Goal: 'kt_oder_view_food',
				'Body Checkup': 'kt_oder_view_lifestyle',
				Lifestyle: 'kt_oder_view_endurance_test',
				'Endurance Test': 'kt_oder_view_program_details',
				'Program Details': 'kt_oder_view_pitch_report',
			}

			const nextId = accordions[step]
			if (nextId) {
				// Close current
				const currentAccordionId: Record<string, string> = {
					Goal: 'kt_oder_view_goal',
					'Body Checkup': 'kt_oder_view_food',
					Lifestyle: 'kt_oder_view_lifestyle',
					'Endurance Test': 'kt_oder_view_endurance_test',
					'Program Details': 'kt_oder_view_program_details',
				}
				const currentId = currentAccordionId[step]
				if (currentId) {
					document.getElementById(currentId)?.classList.remove('show')
				}
				// Open next
				document.getElementById(nextId)?.classList.add('show')
			}
		}
	}

	const handleCreatePlan = async () => {
		try {
			await saveProgress('Pitch Report')
		} catch (error: any) {
			toast.error(error.message)
		}
	}
	const renderAdditionalNoteFields = () => {
		const note = bodyAnalysisData.additional_note
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
			<PageTitle breadcrumbs={[]}>Follow Up Report</PageTitle>

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
						className={`collapse ${!isPersonalDetailsSaved ? 'show' : ''}`}>
						<div className='card-body'>
							{renderAdditionalNoteFields()}
							<div className='row mb-7'>
								<div className='col-md-12'>
									<div className='row'>
										<InputField
											placeholder='Enter Full Name'
											type='text'
											className='col-md-8 fv-row'
											name='firstName'
											label='Full Name'
											htmlFor='full name'
											value={bodyAnalysisData.firstName}
											onChange={handleBodyAnalysisInputChange}
											disabled={isCoreFieldDisabled}
										/>
										<SelectField
											value={bodyAnalysisData.gender}
											onChange={handleBodyAnalysisInputChange}
											className='col-md-4 fv-row mb-7'
											label='Gender'
											name='gender'
											htmlFor='gender'
											options={['MALE', 'FEMALE', 'OTHER']}
											disabled={isPersonalDetailsSaved}
										/>
										<InputField
											placeholder='Enter Email'
											type='email'
											className='col-md-6 fv-row'
											name='email'
											label='Email'
											htmlFor='email'
											value={bodyAnalysisData.email}
											onChange={handleBodyAnalysisInputChange}
											disabled={isCoreFieldDisabled}
										/>
										<InputField
											placeholder='Enter Mobile Number'
											type='text'
											className='col-md-6 fv-row'
											name='mobile'
											label='Mobile Number'
											htmlFor='mobile'
											value={bodyAnalysisData.mobile}
											onChange={handleBodyAnalysisInputChange}
											disabled={isCoreFieldDisabled}
										/>
									</div>
								</div>
							</div>
							<div className='row justify-content-end'>
								<div className='col-12'>
									<div className='row'>
										<InputField
											placeholder='Enter Age'
											type='number'
											className='col-md-4 fv-row'
											name='age'
											label='Age'
											htmlFor='age'
											value={bodyAnalysisData.age}
											onChange={handleBodyAnalysisInputChange}
											disabled={isPersonalDetailsSaved}
										/>
										<InputField
											placeholder='Enter Height'
											type='number'
											className='col-md-4 fv-row'
											name='height'
											label='Height'
											htmlFor='height'
											value={bodyAnalysisData.height}
											onChange={handleBodyAnalysisInputChange}
											disabled={isPersonalDetailsSaved}
										/>
										<InputField
											placeholder='Enter Weight'
											type='number'
											className='col-md-4 fv-row'
											name='weight'
											label='Weight'
											htmlFor='weight'
											value={bodyAnalysisData.weight}
											onChange={handleBodyAnalysisInputChange}
											disabled={isPersonalDetailsSaved}
										/>
									</div>
								</div>
								{!isPersonalDetailsSaved && (
									<div className='col-md-12 mt-5 mb-7'>
										<div className='d-flex justify-content-end'>
											<TableButton
												action='add'
												text='Next'
												showIcon={false}
												backgroundDark={true}
												onClick={async () => {
													if (!bodyAnalysisData.firstName?.trim()) {
														toast.error('Please enter Full Name')
														return
													}
													if (!bodyAnalysisData.mobile?.trim()) {
														toast.error('Please enter Mobile Number')
														return
													}
													const success = await saveProgress('Personal Details')
													if (success) {
														setIsCoreFieldDisabled(true)
														setIsPersonalDetailsSaved(true)
														const analysisElement = document.getElementById('kt_oder_view_analysis')
														const goalElement = document.getElementById('kt_oder_view_goal')
														if (analysisElement) {
															analysisElement.classList.remove('show')
														}
														if (goalElement) {
															goalElement.classList.add('show')
														}
													}
												}}
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Goal */}
			{!showOnlyPitch &&
				<div className='card mb-5 mb-xl-10 mt-5'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_goal'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
						<div className='d-flex align-items-center'>
							<h3 className='fw-bolder m-0'>Goal</h3>
							{sectionSkipped.goal && (
								<span className='ms-3 p-2 badge badge-light-danger fw-bold'>Skipped</span>
							)}
							{filledSections.goal && !sectionSkipped.goal && (
								<span className='ms-3 p-2 badge badge-light-success fw-bold'>Filled</span>
							)}
						</div>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_goal'
					className='collapse'>
					<div
						className='card-body border-top p-9'
						style={filledSections.goal ? { pointerEvents: 'none', opacity: 0.65 } : {}}>
						<div className='p-6'>
							<div className='w-100 my-5'>
								<div className='row'>
									{renderGoalCheckboxes(goal)}
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
							</div>
						</div>
						{!filledSections.goal && (
							<div className='col-md-12 mt-5 mb-7'>
								<div className='d-flex justify-content-end gap-3'>
									<button
										type='button'
										className='btn btn-secondary btn-sm mx-2 me-1 fw-bolder fs-5'
										onClick={() => handleSkipSection('Goal')}>
										Skip
									</button>
									<TableButton
										action='add'
										text='Next'
										showIcon={false}
										backgroundDark={true}
										onClick={async () => {
											const selectedGoalsCount = goal.filter(
												(item: any) => item[Object.keys(item)[0]].selected
											).length
											if (selectedGoalsCount === 0 && !otherGoal.trim()) {
												toast.error('Please select at least one goal or skip this section')
												return
											}
											const result = await saveProgress('Goal')
											if (result) {
												const goalElement = document.getElementById('kt_oder_view_goal')
												const checkupElement = document.getElementById('kt_oder_view_food')
												if (goalElement) {
													goalElement.classList.remove('show')
												}
												if (checkupElement) {
													checkupElement.classList.add('show')
												}
											}
										}}
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			}

			{/* Body Checkup */}
			{!showOnlyPitch &&
				<div className='card mb-5 mb-xl-10 mt-5'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_food'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
						<div className='d-flex align-items-center'>
							<h3 className='fw-bolder m-0'>Body Checkup</h3>
							{sectionSkipped.bodyCheckup && (
								<span className='ms-3 p-2 badge badge-light-danger fw-bold'>Skipped</span>
							)}
							{filledSections.bodyCheckup && !sectionSkipped.bodyCheckup && (
								<span className='ms-3 p-2 badge badge-light-success fw-bold'>Filled</span>
							)}
						</div>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_food'
					className='collapse'>
					<div
						className='card-body border-top p-9'
						style={filledSections.bodyCheckup ? { pointerEvents: 'none', opacity: 0.65 } : {}}>
						<div className='p-6'>
							<div className='w-100 my-5'>
								<div className='pb-5'>
									<h2 className='fw-bolder d-flex align-items-center text-dark'>
										Medical Condition
									</h2>
								</div>
								<div className='row'>
									{renderCheckboxes('medical_condition', bodyCheckup.medical_condition)}
									{renderOtherCard(
										otherMedicalCondition,
										(e) => setOtherMedicalCondition(e.target.value),
										'otherMedicalCondition',
										'otherMedicalCondition',
										otherMedicalCondition.trim().length > 0,
										extraMedicalOthers,
										setExtraMedicalOthers
									)}
								</div>
							</div>

							<div className='w-100 my-5'>
								<div className='pb-5'>
									<h2 className='fw-bolder d-flex align-items-center text-dark'>Food Allergy</h2>
								</div>
								<div className='row'>
									{renderCheckboxes('food_allergy', bodyCheckup.food_allergy)}
									{renderOtherCard(
										otherFoodAllergy,
										(e) => setOtherFoodAllergy(e.target.value),
										'otherFoodAllergy',
										'otherFoodAllergy',
										otherFoodAllergy.trim().length > 0,
										extraFoodAllergyOthers,
										setExtraFoodAllergyOthers
									)}
								</div>
							</div>

							<div className='w-100 my-5'>
								<div className='pb-5'>
									<h2 className='fw-bolder d-flex align-items-center text-dark'>Previous Injury</h2>
								</div>
								<div className='row'>
									{renderCheckboxes('previous_injury', bodyCheckup.previous_injury)}
									{renderOtherCard(
										otherPreviousInjury,
										(e) => setOtherPreviousInjury(e.target.value),
										'otherPreviousInjury',
										'otherPreviousInjury',
										otherPreviousInjury.trim().length > 0,
										extraPreviousInjuryOthers,
										setExtraPreviousInjuryOthers
									)}
								</div>
							</div>
						</div>
						{!filledSections.bodyCheckup && (
							<div className='col-md-12 mt-5 mb-7'>
								<div className='d-flex justify-content-end gap-3'>
									<button
										type='button'
										className='btn btn-secondary btn-sm mx-2 me-1 fw-bolder fs-5'
										onClick={() => handleSkipSection('Body Checkup')}>
										Skip
									</button>
									<TableButton
										action='add'
										text='Next'
										showIcon={false}
										backgroundDark={true}
										onClick={async () => {
											const result = await saveProgress('Body Checkup')
											if (result) {
												const foodElement = document.getElementById('kt_oder_view_food')
												const lifestyleElement = document.getElementById('kt_oder_view_lifestyle')

												if (foodElement) {
													foodElement.classList.remove('show')
												}
												if (lifestyleElement) {
													lifestyleElement.classList.add('show')
												}
											}
										}}
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			}

			{/* Lifestyle */}
			{!showOnlyPitch &&
				<div className='card mb-5 mb-xl-10 mt-5'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_lifestyle'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
						<div className='d-flex align-items-center'>
							<h3 className='fw-bolder m-0'>Life Style</h3>
							{sectionSkipped.lifestyle && (
								<span className='ms-3 p-2 badge badge-light-danger fw-bold'>Skipped</span>
							)}
							{filledSections.lifestyle && !sectionSkipped.lifestyle && (
								<span className='ms-3 p-2 badge badge-light-success fw-bold'>Filled</span>
							)}
						</div>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_lifestyle'
					className='collapse'>
					<div
						className='card-body border-top p-9'
						style={filledSections.lifestyle ? { pointerEvents: 'none', opacity: 0.65 } : {}}>
						<div className='row mt-4'>
							<SelectField
								className={`col-md-12 fv-row mb-7`}
								label='Food Preference'
								name='food_preference'
								value={blood.food_preference}
								onChange={handleBloodPressureChange}
								htmlFor='food_preference'
								options={['Vegetarians', 'Non-Vegetarians', 'Eggetarians', 'Vegan']}
								marginRemove={true}
							/>
							<div className='col-md-12 fv-row mb-7'>
								<label className='form-label fw-bolder text-dark fs-6'>Unhealthy Habits</label>
								<InputField
									placeholder='Enter Unhealthy Habits'
									type='text'
									className='col-md-12 fv-row'
									name='unhealthy_habits'
									htmlFor='unhealthy_habits'
									value={blood.unhealthy_habits}
									onChange={handleBloodPressureChange}
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
								value={lifestyle.wakeup_time}
								onChange={handleLifestyleChange}
							/>
							<InputField
								placeholder='Enter Sleep Time'
								type='time'
								className='col-md-6 fv-row'
								label='Sleep Time'
								name='sleep_time'
								htmlFor='sleep_time'
								value={lifestyle.sleep_time}
								onChange={handleLifestyleChange}
							/>
							<InputField
								placeholder='Enter Breakfast Time'
								type='time'
								className='col-md-4 fv-row'
								label='Breakfast Time'
								name='breakfast_time'
								htmlFor='breakfast_time'
								value={lifestyle.breakfast_time}
								onChange={handleLifestyleChange}
							/>
							<InputField
								placeholder='Enter Lunch Time'
								type='time'
								className='col-md-4 fv-row'
								label='Lunch Time'
								name='lunch_time'
								htmlFor='lunch_time'
								value={lifestyle.lunch_time}
								onChange={handleLifestyleChange}
							/>
							<InputField
								placeholder='Enter Dinner Time'
								type='time'
								className='col-md-4 fv-row'
								label='Dinner Time'
								name='dinner_time'
								htmlFor='dinner_time'
								value={lifestyle.dinner_time}
								onChange={handleLifestyleChange}
							/>
							<div className='col-md-4 fv-row mb-7'>
								<label className='form-label fw-bolder text-dark fs-6'>Irregular Meals</label>
								<div className='form-check form-switch form-check-custom form-check-solid'>
									<input
										className='form-check-input'
										type='checkbox'
										name='irregular_meals'
										checked={lifestyle.irregular_meals}
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
										checked={lifestyle.smoking}
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
										checked={lifestyle.alcohol}
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
								value={lifestyle.water_intake_litre}
								onChange={handleLifestyleChange}
							/>
							<SelectField
								className='col-md-6 fv-row mb-7'
								label='Job Type'
								name='job_type'
								value={lifestyle.job_type}
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
								value={lifestyle.working_hours}
								onChange={handleLifestyleChange}
							/>
							<InputField
								placeholder='Enter Daily Steps'
								type='number'
								className='col-md-6 fv-row'
								label='Daily Steps'
								name='daily_steps'
								htmlFor='daily_steps'
								value={lifestyle.daily_steps}
								onChange={handleLifestyleChange}
							/>
							<InputField
								placeholder='Enter First name'
								type='text'
								className='col-md-6 fv-row'
								label='Stress and Tension'
								name='stress_and_tension'
								htmlFor='stress_and_tension'
								value={blood.stress_and_tension}
								onChange={handleBloodPressureChange}
							/>
							<InputField
								placeholder='Enter First name'
								type='text'
								className='col-md-6 fv-row'
								label='Running Medicine'
								name='running_medicine'
								htmlFor='running_medicine'
								value={blood.running_medicine}
								onChange={handleBloodPressureChange}
							/>
							<SelectField
								className='col-md-6 fv-row mb-7'
								label='Systolic Blood Pressure'
								name='systolic_blood_pressure'
								value={blood.systolic_blood_pressure}
								onChange={handleBloodPressureChange}
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
								value={blood.diastolic_blood_pressure}
								onChange={handleBloodPressureChange}
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
								value={blood.fbs}
								onChange={handleBloodPressureChange}
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
								value={blood.hemoglobin_a1c}
								onChange={handleBloodPressureChange}
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
								value={blood.ppbs}
								onChange={handleBloodPressureChange}
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
									placeholder='Enter detailed goal description'
									value={detailedGoal}
									onChange={handleDetailedGoalChange}
								/>
							</div>
						</div>
						{!filledSections.lifestyle && (
							<div className='col-md-12 mt-5 mb-7'>
								<div className='d-flex justify-content-end gap-3'>
									<button
										type='button'
										className='btn btn-secondary btn-sm mx-2 me-1 fw-bolder fs-5'
										onClick={() => handleSkipSection('Lifestyle')}>
										Skip
									</button>
									<TableButton
										action='add'
										text='Next'
										showIcon={false}
										backgroundDark={true}
										onClick={async () => {
											if (!blood.food_preference) {
												toast.error('Please select Food Preference or skip this section')
												return
											}
											const result = await saveProgress('Lifestyle')
											if (result) {
												const lifestyleElement = document.getElementById('kt_oder_view_lifestyle')
												const enduranceElement = document.getElementById(
													'kt_oder_view_endurance_test'
												)

												if (lifestyleElement) {
													lifestyleElement.classList.remove('show')
												}
												if (enduranceElement) {
													enduranceElement.classList.add('show')
												}
											}
										}}
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			}

			{/* Endurance Test */}
			{!showOnlyPitch &&
				<div className='card mb-5 mb-xl-10 mt-5'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_endurance_test'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
						<div className='d-flex align-items-center'>
							<h3 className='fw-bolder m-0'>Endurance Test</h3>
							{sectionSkipped.enduranceTest && (
								<span className='ms-3 p-2 badge badge-light-danger fw-bold'>Skipped</span>
							)}
							{filledSections.enduranceTest && !sectionSkipped.enduranceTest && (
								<span className='ms-3 p-2 badge badge-light-success fw-bold'>Filled</span>
							)}
						</div>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>

				<div
					id='kt_oder_view_endurance_test'
					className='collapse'>
					<div
						className='card-body border-top p-9'
						style={filledSections.enduranceTest ? { pointerEvents: 'none', opacity: 0.65 } : {}}>
						<div className='row mt-4'>
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

							<div className='pb-5 pt-7'>
								<h4 className='fw-bolder text-dark'>Strength</h4>
								<span className='text-muted'>Add max reps/weight you can perform.</span>
							</div>
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

							<div className='col-12'>
								<div className='pb-5 pt-7'>
									<h4 className='fw-bolder text-dark'>Flexibility Test</h4>
									<span className='text-muted'>
										Upload a Flexibility photo. Example preview shown for reference.
									</span>
								</div>
								<div className='row'>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>
											Flexibility Photo
										</label>
										<div
											className='image-preview-box cursor-pointer'
											onClick={() => flexibilityBeforeInputRef.current?.click()}>
											<input
												type='file'
												className='d-none'
												accept='image/*'
												onChange={handleFlexibilityChange}
												ref={flexibilityBeforeInputRef}
											/>
											{flexibilityTest.before_preview ? (
												<>
													<img
														src={flexibilityTest.before_preview}
														alt='Before flexibility'
													/>
													<button
														type='button'
														className='remove-image-btn'
														onClick={(e) => {
															e.stopPropagation()
															handleFlexibilityRemove()
														}}>
														<i className='bi bi-x-lg'></i>
													</button>
												</>
											) : (
												<>
													<img
														src={toAbsoluteUrl('/media/stock/flexibility-test.jpg')}
														alt='Flexibility dummy'
														className='dummy-image'
													/>
													<div className='no-image-placeholder position-absolute'>
														<i className='bi bi-image'></i>
														<span className='fw-bold'>Choose File</span>
													</div>
												</>
											)}
										</div>
									</div>
								</div>
							</div>

							<div className='col-12'>
								<div className='pb-5 pt-7'>
									<h4 className='fw-bolder text-dark'>Add Before Image</h4>
									<span className='text-muted'>
										Upload Before Image photos from Front, Side, and Back angles.
									</span>
								</div>

								<div className='row'>
									{/* Front Image */}
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>Front</label>
										<div
											className='image-preview-box cursor-pointer'
											onClick={() => flexibilityBeforeImageInputRef.current?.click()}>
											<input
												type='file'
												className='d-none'
												accept='image/*'
												onChange={handleFlexibilityBeforeImageChange}
												ref={flexibilityBeforeImageInputRef}
											/>
											{flexibilityTest.before_image_preview ? (
												<>
													<img
														src={flexibilityTest.before_image_preview}
														alt='Front image'
													/>
													<button
														type='button'
														className='remove-image-btn'
														onClick={(e) => {
															e.stopPropagation()
															handleRemoveFrontImage()
														}}>
														<i className='bi bi-x-lg'></i>
													</button>
												</>
											) : (
												<>
													<img
														src='https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=400&q=80'
														alt='Front dummy'
														className='dummy-image'
													/>
													<div className='no-image-placeholder position-absolute'>
														<i className='bi bi-image'></i>
														<span className='fw-bold'>Choose File</span>
													</div>
												</>
											)}
										</div>
									</div>

									{/* Side Image */}
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>Side</label>
										<div
											className='image-preview-box cursor-pointer'
											onClick={() => flexibilityBeforeSideInputRef.current?.click()}>
											<input
												type='file'
												className='d-none'
												accept='image/*'
												onChange={handleFlexibilityBeforeImageSideChange}
												ref={flexibilityBeforeSideInputRef}
											/>
											{flexibilityTest.before_image_side_preview ? (
												<>
													<img
														src={flexibilityTest.before_image_side_preview}
														alt='Side image'
													/>
													<button
														type='button'
														className='remove-image-btn'
														onClick={(e) => {
															e.stopPropagation()
															handleRemoveSideImage()
														}}>
														<i className='bi bi-x-lg'></i>
													</button>
												</>
											) : (
												<>
													<img
														src='https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80'
														alt='Side dummy'
														className='dummy-image'
													/>
													<div className='no-image-placeholder position-absolute'>
														<i className='bi bi-image'></i>
														<span className='fw-bold'>Choose File</span>
													</div>
												</>
											)}
										</div>
									</div>

									{/* Back Image */}
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>Back</label>
										<div
											className='image-preview-box cursor-pointer'
											onClick={() => flexibilityBeforeBackInputRef.current?.click()}>
											<input
												type='file'
												className='d-none'
												accept='image/*'
												onChange={handleFlexibilityBeforeImageBackChange}
												ref={flexibilityBeforeBackInputRef}
											/>
											{flexibilityTest.before_image_back_preview ? (
												<>
													<img
														src={flexibilityTest.before_image_back_preview}
														alt='Back image'
													/>
													<button
														type='button'
														className='remove-image-btn'
														onClick={(e) => {
															e.stopPropagation()
															handleRemoveBackImage()
														}}>
														<i className='bi bi-x-lg'></i>
													</button>
												</>
											) : (
												<>
													<img
														src='https://images.unsplash.com/photo-1605296867424-35fc25c9212a?auto=format&fit=crop&w=400&q=80'
														alt='Back dummy'
														className='dummy-image'
													/>
													<div className='no-image-placeholder position-absolute'>
														<i className='bi bi-image'></i>
														<span className='fw-bold'>Choose File</span>
													</div>
												</>
											)}
										</div>
									</div>
								</div>
							</div>

							{!filledSections.enduranceTest && (
								<div className='col-md-12 mt-5 mb-7'>
									<div className='d-flex justify-content-end gap-3'>
										<button
											type='button'
											className='btn btn-secondary btn-sm mx-2 me-1 fw-bolder fs-5'
											onClick={() => handleSkipSection('Endurance Test')}>
											Skip
										</button>
										<TableButton
											action='add'
											text='Next'
											showIcon={false}
											backgroundDark={true}
											onClick={async () => {
												const result = await saveProgress('Endurance Test')
												if (result) {
													const analysisElement = document.getElementById(
														'kt_oder_view_endurance_test'
													)
													const compositionElement = document.getElementById(
														'kt_oder_view_program_details'
													)
													if (analysisElement) {
														analysisElement.classList.remove('show')
													}
													if (compositionElement) {
														compositionElement.classList.add('show')
													}
												}
											}}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			}

			{/* Program Details */}
			{!showOnlyPitch &&
				<div className='card mb-5 mb-xl-10 mt-5'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_program_details'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between w-100'>
						<div className='d-flex align-items-center'>
							<h3 className='fw-bolder m-0'>Program Details</h3>
							{sectionSkipped.programDetails && (
								<span className='ms-3 p-2 badge badge-light-danger fw-bold'>Skipped</span>
							)}
							{filledSections.programDetails && !sectionSkipped.programDetails && (
								<span className='ms-3 p-2 badge badge-light-success fw-bold'>Filled</span>
							)}
						</div>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_program_details'
					className='collapse'>
					<div
						className='card-body border-top p-9'
						style={filledSections.programDetails ? { pointerEvents: 'none', opacity: 0.65 } : {}}>
						<div className='row mt-4'>
							{/* Program select */}
							<div className='col-md-3 fv-row mb-7'>
								<SelectField
									className='col-md-12 fv-row mb-7'
									label='Program'
									name='program'
									value={selectedProgramId}
									onChange={handleProgramChange}
									htmlFor='program'
									options={demoPrograms.map((p) => p.name)}
								/>
							</div>
							<div className='col-md-3 fv-row mb-7'>
								<InputField
									placeholder='Program Duration'
									type='text'
									className='col-md-12 fv-row'
									label='Duration'
									name='program_duration'
									htmlFor='program_duration'
									value={programDuration}
									onChange={(e: React.ChangeEvent<any>) => setProgramDuration(e.target.value)}
								/>
							</div>
							<div className='col-md-3 fv-row mb-7'>
								<InputField
									placeholder='Program Amount'
									type='number'
									className='col-md-12 fv-row'
									label='Amount'
									name='program_amount'
									htmlFor='program_amount'
									value={programAmount}
									onChange={(e: React.ChangeEvent<any>) => setProgramAmount(e.target.value)}
								/>
							</div>
							<div className='col-md-3 fv-row mb-7'>
								<SelectField
									className='col-md-12 fv-row mb-7'
									label='Payment Method'
									name='payment_method'
									value={paymentMethod}
									onChange={handlePaymentMethodChange}
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
											name='workoutMode'
											value='online'
											checked={workoutMode === 'online'}
											onChange={(e) => {
												setWorkoutMode(e.target.value as any)
												setWorkoutBranch('')
											}}
										/>
										<label className='form-check-label'>Online</label>
									</div>

									<div className='form-check form-check-custom form-check-solid'>
										<input
											className='form-check-input'
											type='radio'
											name='workoutMode'
											value='offline'
											checked={workoutMode === 'offline'}
											onChange={(e) => setWorkoutMode(e.target.value as any)}
										/>
										<label className='form-check-label'>Offline</label>
									</div>
								</div>
							</div>

							{/* Workout Branch - column always reserved */}
							<div className='col-md-3 fv-row mb-7'>
								<div
									style={{
										visibility: workoutMode === 'offline' ? 'visible' : 'hidden',
										pointerEvents: workoutMode === 'offline' ? 'auto' : 'none',
									}}>
									<SelectField
										className='fv-row mb-7'
										label='Workout Branch'
										name='workoutBranch'
										value={workoutBranch}
										onChange={(e: any) => setWorkoutBranch(e.target.value)}
										htmlFor='workoutBranch'
										options={['Adajan', 'Katargam', 'Vesu']}
									/>
								</div>
							</div>
							{/* Call Script Section */}
							<div className='col-md-12 fv-row mb-7'>
								<label className='form-label fw-bolder text-dark fs-6'>Call Script</label>
								<div
									className='script-container p-5 rounded'
									style={{
										backgroundColor: '#f8f9fa',
										fontSize: '14px',
										lineHeight: '1.6',
										border: '1px solid #e4e6ef',
									}}>
									<h4 className='text-center fw-bold mb-8 text-primary'>
										LIVE CALL SCRIPT – FITNESS WITH GOMZI
									</h4>

									<div className='mb-6'>
										<h5 className='fw-bolder text-primary border-bottom pb-2'>
											<i className='bi bi-telephone-inbound me-2'></i>STEP 1: Warm Introduction
										</h5>
										<p className='mb-2'>
											<strong>You (Counselor):</strong> Hello, good evening. Main (Name) bol rahi
											hoon Fitness With Gomzi se. Aapne hamara 1-Year Transformation Program ka form
											fill kiya tha, usi regarding connect kar rahi hoon.
										</p>
										<p className='mb-2 text-muted fw-italic fst-italic'>
											(Pause - unhe comfort feel karne do.)
										</p>
										<p className='mb-2'>
											<strong>You:</strong> Main aapko program explain karne se pehle aapka goal
											properly samajhna chahti hoon.
										</p>
									</div>

									<div className='mb-6'>
										<h5 className='fw-bolder text-primary border-bottom pb-2'>
											<i className='bi bi-search me-2'></i>STEP 2: Understanding the Prospect
										</h5>
										<p className='mb-2 text-muted fw-bold'>Soft tone, conversational:</p>
										<ul className='mb-3 text-dark'>
											<li>Aapka main goal kya hai abhi?</li>
											<li>Kab se aap is cheez ko improve karna chahte hain?</li>
											<li>Pehle aapne kya try kiya tha?</li>
											<li>Aapko kya lagta hai kahan gap reh gaya?</li>
										</ul>
										<p className='mb-2 text-muted fw-italic fst-italic'>
											(Interrupt bilkul nahi karna.)
										</p>
										<p className='mb-2 fw-bold text-dark mt-3'>Phir summary:</p>
										<p className='mb-2'>
											<strong>You:</strong> So basically proper structure aur accountability
											consistent nahi thi, right?
										</p>
									</div>

									<div className='mb-6'>
										<h5 className='fw-bolder text-primary border-bottom pb-2'>
											<i className='bi bi-heart-pulse me-2'></i>STEP 3: Emotional Trigger (Balanced)
										</h5>
										<p className='mb-2'>
											<strong>You:</strong> Agar next 1 saal bhi same situation rahi, toh aapko
											personally kaisa feel hoga?
										</p>
										<p className='mb-2 text-muted fw-italic fst-italic'>
											(Pause. Let them reflect.)
										</p>
										<p className='mb-2'>
											<strong>You:</strong> 1 se 10 ke scale pe, aap kitne serious ho abhi apne
											transformation ko leke?
										</p>
									</div>

									<div className='mb-6'>
										<h5 className='fw-bolder text-primary border-bottom pb-2'>
											<i className='bi bi-info-circle me-2'></i>STEP 4: Present the Program (Premium
											& Structured)
										</h5>
										<p className='mb-2'>
											<strong>You:</strong> Fitness With Gomzi mein hum short-term challenges ya
											crash programs nahi chalate. Hum ek proper structured 1-year transformation
											system follow karte hain.
										</p>
										<p className='mb-2 text-dark fw-bold mt-3'>Explain clearly:</p>
										<ul className='mb-3 text-dark'>
											<li>Personal training</li>
											<li>Customized diet planning</li>
											<li>Monthly progress tracking</li>
											<li>Accountability system</li>
											<li>Supervised sessions</li>
											<li>Lifestyle correction</li>
										</ul>
										<p className='mb-2'>
											<strong>You:</strong> Humara focus permanent results pe hota hai, temporary
											motivation pe nahi.
										</p>
									</div>

									<div className='mb-6'>
										<h5 className='fw-bolder text-primary border-bottom pb-2'>
											<i className='bi bi-cash-stack me-2'></i>STEP 5: Investment Presentation
											(Confident, No Hesitation)
										</h5>
										<p className='mb-2'>
											<strong>You:</strong> Is complete 1-Year Transformation Program ka investment
											₹49,000 hai. Agar convenient ho toh EMI option bhi available hai ₹4,000 per
											month ka.
										</p>
										<p className='mb-2 text-muted fw-italic fst-italic'>
											(Pause. Silence. Let them respond.)
										</p>

										<p className='mb-2 fw-bold text-danger mt-4'>
											<i className='bi bi-shield-x me-2'></i>Objection Handling (Female Counselor
											Tone)
										</p>

										<div className='bg-white p-4 border rounded mb-3 shadow-sm'>
											<p className='mb-2 text-muted'>
												<strong>Objection:</strong> Discuss karke batata hoon.
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Bilkul, aise decisions discuss karne chahiye.
											</p>
											<p className='mb-2 text-muted fw-bold'>Phir politely:</p>
											<p className='mb-2'>
												<strong>You:</strong> Personally aapko lagta hai ki ye program aapko help
												karega?
											</p>
											<p className='mb-2 text-success fw-bold'>Agar YES:</p>
											<p className='mb-2'>
												<strong>You:</strong> Perfect. Toh ek kaam karte hain - pehle body
												assessment schedule kar lete hain. Jab aap assessment ke liye aayenge, aap
												apne family member ko bhi saath la sakte hain. Hum unhe complete structure
												properly explain kar denge.
											</p>
										</div>

										<div className='bg-white p-4 border rounded shadow-sm'>
											<p className='mb-2 text-muted'>
												<strong>Objection:</strong> Details bhej dijiye.
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Main details bhej deti hoon, lekin honestly jab
												cheezein sirf message tak reh jaati hain toh clarity nahi milti. Isse better
												hai aap ek body assessment visit kar lijiye. Wahan aap sab kuch practically
												samajh sakte hain.
											</p>
										</div>
									</div>

									<div className='mb-4'>
										<h5 className='fw-bolder text-success border-bottom pb-2'>
											<i className='bi bi-calendar2-check me-2'></i>STEP 6: Close with Body
											Assessment
										</h5>
										<p className='mb-2'>
											<strong>You:</strong> First step sirf body assessment thi start thay chhe. Hu
											tamne ek booking link share karu chu, jya tame tamari preferred date ane time
											select shako.
										</p>
										<p className='mb-2 text-muted fw-bold mt-3'>Clear explain karo:</p>
										<p className='mb-2'>
											<strong>You:</strong> Slot confirm karva mațe ₹99 no small booking
											confirmation fee chhe. Aa sirf serious scheduling ensure karva mațe chhe.
										</p>
										<p className='mb-2'>
											<strong>You:</strong> Booking complete thata j tamne WhatsApp ane email par
											confirmation mali jashe.
										</p>
										<p className='mb-2 text-muted fw-bold mt-3'>Final close:</p>
										<p className='mb-2'>
											<strong>You:</strong> Tame hal book karva comfortable chho? Hu tamne guide
											kari dau.
										</p>
									</div>
								</div>
							</div>
							{!filledSections.programDetails && (
								<div className='col-md-12 mt-5 mb-7'>
									<div className='d-flex justify-content-end gap-3'>
										<button
											type='button'
											className='btn btn-secondary btn-sm mx-2 me-1 fw-bolder fs-5'
											onClick={() => handleSkipSection('Program Details')}>
											Skip
										</button>
										<TableButton
											action='add'
											text='Next'
											showIcon={false}
											backgroundDark={true}
											onClick={async () => {
												const result = await saveProgress('Program Details')
												if (result) {
													const analysisElement = document.getElementById(
														'kt_oder_view_program_details'
													)
													const compositionElement = document.getElementById(
														'kt_oder_view_pitch_report'
													)
													if (analysisElement) {
														analysisElement.classList.remove('show')
													}
													if (compositionElement) {
														compositionElement.classList.add('show')
													}
												}
											}}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			}

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
					className={`collapse ${showOnlyPitch ? 'show' : ''}`}>
					<div className='card-body border-top p-9'>
						<div className='row mt-4'>
							<SelectField
								className='col-md-4 fv-row mb-7'
								label='Telecaller Name'
								name='telecaller_name'
								value={pitchReport.telecaller_name}
								onChange={handlePitchReportChange}
								htmlFor='telecaller_name'
								options={['Ishita', 'Kajal (Adajan Branch)', 'Kajal (Katargam Branch)']}
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
							<div className='col-md-12 fv-row mb-7 mt-5'>
								<label className='form-label fw-bolder text-dark fs-6'>
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
											onClick={() => setPitchReport((prev: any) => ({ ...prev, call_recording: null }))}
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
												onClick={() => setPitchReport((prev: any) => ({ ...prev, call_recording: null }))}
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
											setPitchReport((prev: any) => ({ ...prev, call_recording: file }))
										}}
									/>
								)}
							</div>
						</div>
						<div className='col-md-12 fv-row mb-7'>
							<label className='form-label fw-bolder text-dark fs-6 mb-3'>Objections</label>
							<textarea
								className='form-control form-control-lg form-control-solid'
								rows={3}
								placeholder='Enter objections'
								name='objections'
								value={pitchReport.objections}
								onChange={handlePitchReportChange}
							/>
						</div>
						<div className='col-md-12 mt-5 mb-7'>
							<div className='d-flex justify-content-end'>
								<TableButton
									action='add'
									text='Save'
									showIcon={false}
									backgroundDark={true}
									onClick={async () => {
										await handleCreatePlan()
										const queryParams = new URLSearchParams(location.search)
										const mobile = bodyAnalysisData.mobile || queryParams.get('mobile') || ''
										const email = bodyAnalysisData.email || queryParams.get('email') || ''
										const name = bodyAnalysisData.firstName || queryParams.get('name') || ''
										const city = bodyAnalysisData.city || queryParams.get('city') || ''
										const ad_name = bodyAnalysisData.ad_name || queryParams.get('ad_name') || ''
										const lead_created_at =
											bodyAnalysisData.lead_created_at || queryParams.get('lead_created_at') || ''
										const platform = bodyAnalysisData.platform || queryParams.get('platform') || ''
										navigate(
											`/fwg-tele-sales/follow-up-report-inner-list?mobile=${encodeURIComponent(
												mobile
											)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(
												name
											)}&city=${encodeURIComponent(city)}&ad_name=${encodeURIComponent(
												ad_name
											)}&lead_created_at=${encodeURIComponent(
												lead_created_at
											)}&platform=${encodeURIComponent(platform)}`
										)
									}}
									disabled={isSubmitting}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default AddFollowUpReport
