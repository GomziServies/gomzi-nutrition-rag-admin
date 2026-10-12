import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { GetFwgFollowUpReport } from '../../../Functions/FGGroup'

const ViewFollowUpReport = () => {
	const location = useLocation()
	const [loading, setLoading] = useState(true)

	const [bodyAnalysisData, setBodyAnalysisData] = useState<any>({
		firstName: '',
		gender: '',
		email: '',
		mobile: '',
		age: '',
		height: '',
		weight: '',
		additional_note: '',
	})

	const [lifestyle, setLifestyle] = useState<any>({
		food_preference: '',
		wakeup_time: '',
		sleep_time: '',
		breakfast_time: '',
		lunch_time: '',
		dinner_time: '',
		irregular_meals: false,
		smoking: false,
		alcohol: false,
		water_intake_litre: '',
		job_type: '',
		working_hours: '',
		daily_steps: '',
		stress_and_tension: '',
		unhealthy_habits: '',
		running_medicine: '',
		systolic_blood_pressure: '',
		diastolic_blood_pressure: '',
		fbs: '',
		hemoglobin_a1c: '',
		ppbs: '',
	})

	const [detailedGoal, setDetailedGoal] = useState<string>('')

	const [pitchReport, setPitchReport] = useState<any>({
		telecaller_name: '',
		interest_level: '',
		objections: '',
		follow_up_date: '',
	})

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
		{ Diabetes: { selected: false }, label: 'Diabetes', img: 'diabetes.png' },
		{ HTN: { selected: false }, label: 'HTN', img: 'htn.png' },
		{ Thyroid: { selected: false }, label: 'Thyroid', img: 'thyroid.png' },
		{ PCOS: { selected: false }, label: 'PCOS', img: 'pcos.png' },
		{
			PrepCoachingSegment: { selected: false },
			label: 'Prep Coaching Segment',
			img: 'prep_coaching_segment.png',
		},
	])

	const [otherGoal, setOtherGoal] = useState<string>('')

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
	})

	const [otherMedicalCondition, setOtherMedicalCondition] = useState<string>('')
	const [otherFoodAllergy, setOtherFoodAllergy] = useState<string>('')
	const [otherPreviousInjury, setOtherPreviousInjury] = useState<string>('')

	const [enduranceTest, setEnduranceTest] = useState<any>({ treadmill_minutes: '' })
	const [strengthTest, setStrengthTest] = useState<any>({
		squats: '',
		pushups: '',
		pullups: '',
		deadlift: '',
		bench_press: '',
		shoulder_press: '',
	})
	const [flexibilityImages, setFlexibilityImages] = useState<any>({
		flexibility_photo: '',
		before_image_front: '',
		before_image_side: '',
		before_image_back: '',
	})

	const [programDetails, setProgramDetails] = useState<any>({
		program_name: '',
		duration: '',
		amount: '',
		payment_method: '',
		workout_mode: '',
		workout_branch: '',
	})

	const [sectionSkipped, setSectionSkipped] = useState<any>({
		goal: false,
		bodyCheckup: false,
		lifestyle: false,
		enduranceTest: false,
		programDetails: false,
	})

	useEffect(() => {
		const fetchReport = async () => {
			try {
				setLoading(true)
				const queryParams = new URLSearchParams(location.search)
				const id = queryParams.get('id')
				const callId = queryParams.get('call_id')
				if (!id) {
					toast.error('No Report ID provided')
					return
				}

				const res = await GetFwgFollowUpReport({ id })
				if (res.status !== 200 || !res.data?.data?.length) {
					toast.error(res.message || 'Report not found')
					return
				}

				const report = res.data.data[0]

				// Personal Details
				setBodyAnalysisData({
					firstName: report.personalDetails?.full_name || '',
					gender: report.personalDetails?.gender || '',
					email: report.personalDetails?.email || '',
					mobile: report.personalDetails?.mobile || '',
					age: report.personalDetails?.age || '',
					height: report.personalDetails?.height || '',
					weight: report.personalDetails?.weight || '',
					additional_note: report.personalDetails?.additional_note || '',
				})

				if (!report.callHistory?.length) return

				// Find specific call or use last
				const callEntry = callId
					? report.callHistory.find((c: any) => c._id === callId) ||
					  report.callHistory[report.callHistory.length - 1]
					: report.callHistory[report.callHistory.length - 1]

				// Goals
				if (callEntry.goals?.selected_goals?.length || callEntry.goals?.length) {
					const goalArray = callEntry.goals?.selected_goals || callEntry.goals || []
					const knownGoalLabels = goal.map((i: any) => i.label)
					const customGoals = goalArray.filter((g: string) => !knownGoalLabels.includes(g))
					setOtherGoal(customGoals.join(', '))

					setGoal((prev: any[]) =>
						prev.map((item: any) => {
							const key = Object.keys(item)[0]
							return {
								...item,
								[key]: { ...item[key], selected: goalArray.includes(item.label) },
							}
						})
					)
				}

				// Body Checkup
				if (callEntry.bodyCheckup) {
					const bc = callEntry.bodyCheckup

					const applySelection = (items: any[], apiList: string[]) =>
						items.map((item: any) => {
							const key = Object.keys(item)[0]
							return { ...item, [key]: { ...item[key], selected: apiList.includes(item.label) } }
						})

					setBodyCheckup((prev: any) => ({
						medical_condition: applySelection(prev.medical_condition, bc.medical_condition || []),
						food_allergy: applySelection(prev.food_allergy, bc.food_allergy || []),
						previous_injury: applySelection(prev.previous_injury, bc.previous_injury || []),
					}))

					// Other values
					const knownMedical = [
						'Thyroid',
						'Pcos',
						'Diabetes',
						'Chest X-ray',
						'ECG',
						'Cardiac Test',
						'Blood and swab tests',
						'Liver Tests',
						'Blood Pressure',
						'Body Mass Index (BMI)',
						'Lean Body Mass',
					]
					const knownFood = ['Milk', 'Gluten', 'Citrus', 'Rice', 'Potato', 'Peanut', 'Spinach']
					const knownInjury = [
						'Knee Pain',
						'Shoulder Pain',
						'Back Pain',
						'Tennis Elbow',
						'Wrist Pain',
						'Neck Pain',
						'Calf Pain',
					]

					setOtherMedicalCondition(
						(bc.medical_condition || []).filter((v: string) => !knownMedical.includes(v)).join(', ')
					)
					setOtherFoodAllergy(
						(bc.food_allergy || []).filter((v: string) => !knownFood.includes(v)).join(', ')
					)
					setOtherPreviousInjury(
						(bc.previous_injury || []).filter((v: string) => !knownInjury.includes(v)).join(', ')
					)
				}

				// Lifestyle
				if (callEntry.lifestyle) {
					const ls = callEntry.lifestyle
					setLifestyle({
						food_preference: ls.food_preference || '',
						wakeup_time: ls.wakeup_time || '',
						sleep_time: ls.sleep_time || '',
						breakfast_time: ls.breakfast_time || '',
						lunch_time: ls.lunch_time || '',
						dinner_time: ls.dinner_time || '',
						irregular_meals: ls.irregular_meals || false,
						smoking: ls.smoking || false,
						alcohol: ls.alcohol || false,
						water_intake_litre: ls.water_intake_litre || '',
						job_type: ls.job_type || '',
						working_hours: ls.working_hours || '',
						daily_steps: ls.daily_steps || '',
						stress_and_tension: ls.stress_and_tension || '',
						unhealthy_habits: ls.unhealthy_habits || '',
						running_medicine: ls.running_medicine || '',
						systolic_blood_pressure: ls.systolic_blood_pressure || '',
						diastolic_blood_pressure: ls.diastolic_blood_pressure || '',
						fbs: ls.fbs || '',
						hemoglobin_a1c: ls.hemoglobin_a1c || '',
						ppbs: ls.ppbs || '',
					})
					setDetailedGoal(ls.detailed_goal || '')
				}

				// Endurance Tests
				if (callEntry.enduranceTest) {
					const et = callEntry.enduranceTest
					setEnduranceTest({ treadmill_minutes: et.treadmill_minutes || '' })
					setStrengthTest({
						squats: et.strengthTest?.squats || '',
						pushups: et.strengthTest?.pushups || '',
						pullups: et.strengthTest?.pullups || '',
						deadlift: et.strengthTest?.deadlift || '',
						bench_press: et.strengthTest?.bench_press || '',
						shoulder_press: et.strengthTest?.shoulder_press || '',
					})
					setFlexibilityImages({
						flexibility_photo: et.flexibilityTest?.flexibility_photo || '',
						before_image_front: et.flexibilityTest?.before_image_front || '',
						before_image_side: et.flexibilityTest?.before_image_side || '',
						before_image_back: et.flexibilityTest?.before_image_back || '',
					})
				}

				// Program Details
				if (callEntry.programDetails) {
					const pd = callEntry.programDetails
					setProgramDetails({
						program_name: pd.program_name || '',
						duration: pd.duration || '',
						amount: pd.amount || '',
						payment_method: pd.payment_method || '',
						workout_mode: pd.workout_mode || '',
						workout_branch: pd.workout_branch || '',
					})
				}

				setSectionSkipped({
					goal: callEntry.goals?.is_skipped || false,
					bodyCheckup: callEntry.bodyCheckup?.is_skipped || false,
					lifestyle: callEntry.lifestyle?.is_skipped || false,
					enduranceTest: callEntry.enduranceTest?.is_skipped || false,
					programDetails: callEntry.programDetails?.is_skipped || false,
				})

				// Pitch Report
				if (callEntry.pitchReport) {
					const pr = callEntry.pitchReport
					setPitchReport({
						telecaller_name: pr.telecaller_name || '',
						interest_level: pr.interest_level || '',
						objections: pr.objections || '',
						follow_up_date: pr.follow_up_date
							? new Date(pr.follow_up_date).toISOString().split('T')[0]
							: '',
						call_recording: pr.call_recording || '',
					})
				}

				// Expand all sections
				setTimeout(() => {
					;[
						'vw_personal_details',
						'vw_goal',
						'vw_body_checkup',
						'vw_lifestyle',
						'vw_endurance_test',
						'vw_program_details',
						'vw_pitch_report',
					].forEach((sectionId) => {
						document.getElementById(sectionId)?.classList.add('show')
					})
				}, 200)
			} catch (error: any) {
				toast.error(error?.message || 'Failed to load report')
			} finally {
				setLoading(false)
			}
		}

		fetchReport()
	}, [location.search])

	const renderGoalCards = (items: any[]) =>
		items.map((item: any, index: number) => {
			const key = Object.keys(item)[0]
			const isSelected = item[key]?.selected

			return (
				<div
					className='col-md-3 my-2'
					key={index}>
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
		})

	const renderCheckboxCards = (items: any[]) =>
		items.map((item: any, index: number) => {
			const key = Object.keys(item)[0]
			const isSelected = item[key]?.selected

			return (
				<div
					className='col-md-3 my-2'
					key={index}>
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
		})

	const hasGoal =
		goal.some((item: any) => item[Object.keys(item)[0]]?.selected) ||
		!!otherGoal ||
		sectionSkipped.goal

	const hasBodyCheckup =
		bodyCheckup.medical_condition.some((i: any) => i[Object.keys(i)[0]]?.selected) ||
		bodyCheckup.food_allergy.some((i: any) => i[Object.keys(i)[0]]?.selected) ||
		bodyCheckup.previous_injury.some((i: any) => i[Object.keys(i)[0]]?.selected) ||
		!!otherMedicalCondition ||
		!!otherFoodAllergy ||
		!!otherPreviousInjury ||
		sectionSkipped.bodyCheckup

	const hasLifestyle =
		!!lifestyle.food_preference ||
		!!lifestyle.wakeup_time ||
		!!lifestyle.sleep_time ||
		!!lifestyle.breakfast_time ||
		!!lifestyle.lunch_time ||
		!!lifestyle.dinner_time ||
		lifestyle.irregular_meals ||
		lifestyle.smoking ||
		lifestyle.alcohol ||
		!!lifestyle.water_intake_litre ||
		!!lifestyle.job_type ||
		!!lifestyle.working_hours ||
		!!lifestyle.daily_steps ||
		!!lifestyle.stress_and_tension ||
		!!lifestyle.unhealthy_habits ||
		!!lifestyle.running_medicine ||
		!!lifestyle.systolic_blood_pressure ||
		!!lifestyle.diastolic_blood_pressure ||
		!!lifestyle.fbs ||
		!!lifestyle.hemoglobin_a1c ||
		!!lifestyle.ppbs ||
		!!detailedGoal ||
		sectionSkipped.lifestyle

	const hasEnduranceTest =
		!!enduranceTest.treadmill_minutes ||
		!!strengthTest.squats ||
		!!strengthTest.pushups ||
		!!strengthTest.pullups ||
		!!strengthTest.deadlift ||
		!!strengthTest.bench_press ||
		!!strengthTest.shoulder_press ||
		!!flexibilityImages.flexibility_photo ||
		!!flexibilityImages.before_image_front ||
		!!flexibilityImages.before_image_side ||
		!!flexibilityImages.before_image_back ||
		sectionSkipped.enduranceTest

	const hasProgramDetails =
		!!programDetails.program_name ||
		!!programDetails.duration ||
		!!programDetails.amount ||
		!!programDetails.payment_method ||
		!!programDetails.workout_mode ||
		sectionSkipped.programDetails

	const hasPitchReport =
		!!pitchReport.telecaller_name ||
		!!pitchReport.interest_level ||
		!!pitchReport.follow_up_date ||
		!!pitchReport.call_recording ||
		!!pitchReport.objections

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
			<PageTitle breadcrumbs={[]}>View Follow Up Report</PageTitle>

			{/* ── Personal Details ── */}
			<div className='col-12'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#vw_personal_details'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Personal Details</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='vw_personal_details'
						className='collapse show'>
						<div
							className='card-body'
							style={{ pointerEvents: 'none' }}>
							{renderAdditionalNoteFields()}
							<div className='row mb-7'>
								<div className='col-md-12'>
									<div className='row'>
										<InputField
											placeholder='Full Name'
											type='text'
											className='col-md-8 fv-row'
											name='firstName'
											label='Full Name'
											htmlFor='firstName'
											value={bodyAnalysisData.firstName}
											onChange={() => {}}
											disabled
										/>
										<SelectField
											value={bodyAnalysisData.gender}
											onChange={() => {}}
											className='col-md-4 fv-row mb-7'
											label='Gender'
											name='gender'
											htmlFor='gender'
											options={['MALE', 'FEMALE', 'OTHER']}
											disabled
										/>
										<InputField
											placeholder='Email'
											type='email'
											className='col-md-6 fv-row'
											name='email'
											label='Email'
											htmlFor='email'
											value={bodyAnalysisData.email}
											onChange={() => {}}
											disabled
										/>
										<InputField
											placeholder='Mobile Number'
											type='number'
											className='col-md-6 fv-row'
											name='mobile'
											label='Mobile Number'
											htmlFor='mobile'
											value={bodyAnalysisData.mobile}
											onChange={() => {}}
											disabled
										/>
									</div>
								</div>
							</div>
							<div className='row'>
								<div className='col-12'>
									<div className='row'>
										<InputField
											placeholder='Age'
											type='number'
											className='col-md-4 fv-row'
											name='age'
											label='Age'
											htmlFor='age'
											value={bodyAnalysisData.age}
											onChange={() => {}}
											disabled
										/>
										<InputField
											placeholder='Height'
											type='number'
											className='col-md-4 fv-row'
											name='height'
											label='Height'
											htmlFor='height'
											value={bodyAnalysisData.height}
											onChange={() => {}}
											disabled
										/>
										<InputField
											placeholder='Weight'
											type='number'
											className='col-md-4 fv-row'
											name='weight'
											label='Weight'
											htmlFor='weight'
											value={bodyAnalysisData.weight}
											onChange={() => {}}
											disabled
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{hasGoal && (
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#vw_goal'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Goal</h3>
								{sectionSkipped.goal && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='vw_goal'
						className='collapse'>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: sectionSkipped.goal ? 'none' : 'auto',
								opacity: sectionSkipped.goal ? 0.6 : 1,
							}}>
							<div className='p-6'>
								<div className='w-100 my-5'>
									<div className='row'>
										{renderGoalCards(goal)}
										{otherGoal &&
											otherGoal
												.split(',')
												.filter((v) => v.trim())
												.map((val, idx) => (
													<div
														className='col-md-3 my-2'
														key={`otherGoal_${idx}`}>
														<label
															className='btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center border-primary'
															htmlFor={`otherGoal_${idx}`}>
															<div
																className='d-block fw-bold text-start'
																style={{ width: '100%' }}>
																<InputField
																	placeholder=''
																	type='text'
																	className=''
																	name={`otherGoal_${idx}`}
																	label='Other'
																	htmlFor={`otherGoal_${idx}`}
																	value={val.trim()}
																	onChange={() => {}}
																	marginRemove={true}
																	disabled
																/>
															</div>
														</label>
													</div>
												))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{hasBodyCheckup && (
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#vw_body_checkup'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Body Checkup</h3>
								{sectionSkipped.bodyCheckup && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='vw_body_checkup'
						className='collapse'>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: sectionSkipped.bodyCheckup ? 'none' : 'auto',
								opacity: sectionSkipped.bodyCheckup ? 0.6 : 1,
							}}>
							<div className='p-6'>
								{/* Medical Condition */}
								<div className='w-100 my-5'>
									<div className='pb-5'>
										<h2 className='fw-bolder d-flex align-items-center text-dark'>
											Medical Condition
										</h2>
									</div>
									<div className='row'>
										{renderCheckboxCards(bodyCheckup.medical_condition)}
										{otherMedicalCondition &&
											otherMedicalCondition
												.split(',')
												.filter((v) => v.trim())
												.map((val, idx) => (
													<div
														className='col-md-3 my-2'
														key={`otherMedical_${idx}`}>
														<label
															className='btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center border-primary'
															htmlFor={`otherMedical_${idx}`}>
															<div
																className='d-block fw-bold text-start'
																style={{ width: '100%' }}>
																<InputField
																	placeholder=''
																	type='text'
																	className=''
																	name={`otherMedical_${idx}`}
																	label='Other'
																	htmlFor={`otherMedical_${idx}`}
																	value={val.trim()}
																	onChange={() => {}}
																	marginRemove={true}
																	disabled
																/>
															</div>
														</label>
													</div>
												))}
									</div>
								</div>

								{/* Food Allergy */}
								<div className='w-100 my-5'>
									<div className='pb-5'>
										<h2 className='fw-bolder d-flex align-items-center text-dark'>Food Allergy</h2>
									</div>
									<div className='row'>
										{renderCheckboxCards(bodyCheckup.food_allergy)}
										{otherFoodAllergy &&
											otherFoodAllergy
												.split(',')
												.filter((v) => v.trim())
												.map((val, idx) => (
													<div
														className='col-md-3 my-2'
														key={`otherFood_${idx}`}>
														<label
															className='btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center border-primary'
															htmlFor={`otherFood_${idx}`}>
															<div
																className='d-block fw-bold text-start'
																style={{ width: '100%' }}>
																<InputField
																	placeholder=''
																	type='text'
																	className=''
																	name={`otherFood_${idx}`}
																	label='Other'
																	htmlFor={`otherFood_${idx}`}
																	value={val.trim()}
																	onChange={() => {}}
																	marginRemove={true}
																	disabled
																/>
															</div>
														</label>
													</div>
												))}
									</div>
								</div>

								{/* Previous Injury */}
								<div className='w-100 my-5'>
									<div className='pb-5'>
										<h2 className='fw-bolder d-flex align-items-center text-dark'>
											Previous Injury
										</h2>
									</div>
									<div className='row'>
										{renderCheckboxCards(bodyCheckup.previous_injury)}
										{otherPreviousInjury &&
											otherPreviousInjury
												.split(',')
												.filter((v) => v.trim())
												.map((val, idx) => (
													<div
														className='col-md-3 my-2'
														key={`otherInjury_${idx}`}>
														<label
															className='btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center border-primary'
															htmlFor={`otherInjury_${idx}`}>
															<div
																className='d-block fw-bold text-start'
																style={{ width: '100%' }}>
																<InputField
																	placeholder=''
																	type='text'
																	className=''
																	name={`otherInjury_${idx}`}
																	label='Other'
																	htmlFor={`otherInjury_${idx}`}
																	value={val.trim()}
																	onChange={() => {}}
																	marginRemove={true}
																	disabled
																/>
															</div>
														</label>
													</div>
												))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{hasLifestyle && (
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#vw_lifestyle'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Life Style</h3>
								{sectionSkipped.lifestyle && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='vw_lifestyle'
						className='collapse'>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: sectionSkipped.lifestyle ? 'none' : 'auto',
								opacity: sectionSkipped.lifestyle ? 0.6 : 1,
							}}>
							<div className='row mt-4'>
								<SelectField
									className='col-md-12 fv-row mb-7'
									label='Food Preference'
									name='food_preference'
									value={lifestyle.food_preference}
									onChange={() => {}}
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
										value={lifestyle.unhealthy_habits}
										onChange={() => {}}
										marginRemove={true}
									/>
								</div>
								<InputField
									placeholder='Wakeup Time'
									type='time'
									className='col-md-6 fv-row'
									label='Wakeup Time'
									name='wakeup_time'
									htmlFor='wakeup_time'
									value={lifestyle.wakeup_time}
									onChange={() => {}}
								/>
								<InputField
									placeholder='Sleep Time'
									type='time'
									className='col-md-6 fv-row'
									label='Sleep Time'
									name='sleep_time'
									htmlFor='sleep_time'
									value={lifestyle.sleep_time}
									onChange={() => {}}
								/>
								<InputField
									placeholder='Breakfast Time'
									type='time'
									className='col-md-4 fv-row'
									label='Breakfast Time'
									name='breakfast_time'
									htmlFor='breakfast_time'
									value={lifestyle.breakfast_time}
									onChange={() => {}}
								/>
								<InputField
									placeholder='Lunch Time'
									type='time'
									className='col-md-4 fv-row'
									label='Lunch Time'
									name='lunch_time'
									htmlFor='lunch_time'
									value={lifestyle.lunch_time}
									onChange={() => {}}
								/>
								<InputField
									placeholder='Dinner Time'
									type='time'
									className='col-md-4 fv-row'
									label='Dinner Time'
									name='dinner_time'
									htmlFor='dinner_time'
									value={lifestyle.dinner_time}
									onChange={() => {}}
								/>

								<div className='col-md-4 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>Irregular Meals</label>
									<div className='form-check form-switch form-check-custom form-check-solid'>
										<input
											className='form-check-input'
											type='checkbox'
											checked={lifestyle.irregular_meals}
											readOnly
										/>
										<label className='form-check-label'>Irregular Meals</label>
									</div>
								</div>
								<div className='col-md-4 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>Smoking</label>
									<div className='form-check form-switch form-check-custom form-check-solid'>
										<input
											className='form-check-input'
											type='checkbox'
											checked={lifestyle.smoking}
											readOnly
										/>
										<label className='form-check-label'>Smoking</label>
									</div>
								</div>
								<div className='col-md-4 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>Alcohol</label>
									<div className='form-check form-switch form-check-custom form-check-solid'>
										<input
											className='form-check-input'
											type='checkbox'
											checked={lifestyle.alcohol}
											readOnly
										/>
										<label className='form-check-label'>Alcohol</label>
									</div>
								</div>

								<InputField
									placeholder='Water Intake (Litres)'
									type='number'
									className='col-md-6 fv-row'
									label='Water Intake (Litres)'
									name='water_intake_litre'
									htmlFor='water_intake_litre'
									value={lifestyle.water_intake_litre}
									onChange={() => {}}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Job Type'
									name='job_type'
									value={lifestyle.job_type}
									onChange={() => {}}
									htmlFor='job_type'
									options={['SEDENTARY', 'MODERATE', 'ACTIVE']}
								/>
								<InputField
									placeholder='Working Hours'
									type='number'
									className='col-md-6 fv-row'
									label='Working Hours'
									name='working_hours'
									htmlFor='working_hours'
									value={lifestyle.working_hours}
									onChange={() => {}}
								/>
								<InputField
									placeholder='Daily Steps'
									type='number'
									className='col-md-6 fv-row'
									label='Daily Steps'
									name='daily_steps'
									htmlFor='daily_steps'
									value={lifestyle.daily_steps}
									onChange={() => {}}
								/>
								<InputField
									placeholder='Stress and Tension'
									type='text'
									className='col-md-6 fv-row'
									label='Stress and Tension'
									name='stress_and_tension'
									htmlFor='stress_and_tension'
									value={lifestyle.stress_and_tension}
									onChange={() => {}}
								/>
								<InputField
									placeholder='Running Medicine'
									type='text'
									className='col-md-6 fv-row'
									label='Running Medicine'
									name='running_medicine'
									htmlFor='running_medicine'
									value={lifestyle.running_medicine}
									onChange={() => {}}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Systolic Blood Pressure'
									name='systolic_blood_pressure'
									value={lifestyle.systolic_blood_pressure}
									onChange={() => {}}
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
									value={lifestyle.diastolic_blood_pressure}
									onChange={() => {}}
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
									value={lifestyle.fbs}
									onChange={() => {}}
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
									value={lifestyle.hemoglobin_a1c}
									onChange={() => {}}
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
									value={lifestyle.ppbs}
									onChange={() => {}}
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
										value={detailedGoal}
										readOnly
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{hasEnduranceTest && (
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#vw_endurance_test'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Endurance Test</h3>
								{sectionSkipped.enduranceTest && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='vw_endurance_test'
						className='collapse'>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: sectionSkipped.enduranceTest ? 'none' : 'auto',
								opacity: sectionSkipped.enduranceTest ? 0.6 : 1,
							}}>
							<div className='row mt-4'>
								{/* Endurance (Treadmill) */}
								{enduranceTest.treadmill_minutes && (
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
											onChange={() => {}}
										/>
									</>
								)}

								{/* Strength */}
								{Object.keys(strengthTest).length > 0 && (
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
												onChange={() => {}}
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
												onChange={() => {}}
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
												onChange={() => {}}
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
												onChange={() => {}}
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
												onChange={() => {}}
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
												onChange={() => {}}
											/>
										)}
									</>
								)}

								{/* Flexibility Test */}
								{flexibilityImages.flexibility_photo && (
									<div className='col-12'>
										<div className='pb-5 pt-7'>
											<h4 className='fw-bolder text-dark'>Flexibility Test</h4>
										</div>
										<div className='row'>
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
														src={`https://files.fggroup.in/${flexibilityImages.flexibility_photo}`}
														alt='Flexibility'
														style={{ width: '100%', height: '100%', objectFit: 'cover' }}
													/>
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Before Images */}
								{(flexibilityImages.before_image_front ||
									flexibilityImages.before_image_side ||
									flexibilityImages.before_image_back) && (
									<div className='col-12'>
										<div className='pb-5 pt-7'>
											<h4 className='fw-bolder text-dark'>Before Images</h4>
										</div>
										<div className='row'>
											{flexibilityImages.before_image_front && (
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
															src={`https://files.fggroup.in/${flexibilityImages.before_image_front}`}
															alt='Front'
															style={{ width: '100%', height: '100%', objectFit: 'cover' }}
														/>
													</div>
												</div>
											)}
											{flexibilityImages.before_image_side && (
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
															src={`https://files.fggroup.in/${flexibilityImages.before_image_side}`}
															alt='Side'
															style={{ width: '100%', height: '100%', objectFit: 'cover' }}
														/>
													</div>
												</div>
											)}
											{flexibilityImages.before_image_back && (
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
															src={`https://files.fggroup.in/${flexibilityImages.before_image_back}`}
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

			{hasProgramDetails && (
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#vw_program_details'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center'>
								<h3 className='fw-bolder m-0'>Program Details</h3>
								{sectionSkipped.programDetails && (
									<span className='badge badge-light-danger fs-7 fw-bold ms-2'>Skipped</span>
								)}
							</div>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='vw_program_details'
						className='collapse'>
						<div
							className='card-body border-top p-9'
							style={{
								pointerEvents: sectionSkipped.programDetails ? 'none' : 'auto',
								opacity: sectionSkipped.programDetails ? 0.6 : 1,
							}}>
							<div className='row mt-4'>
								<InputField
									placeholder='Program Name'
									type='text'
									className='col-md-3 fv-row'
									label='Program'
									name='program_name'
									htmlFor='program_name'
									value={programDetails.program_name}
									onChange={() => {}}
								/>
								<InputField
									placeholder='Duration'
									type='text'
									className='col-md-3 fv-row'
									label='Duration'
									name='duration'
									htmlFor='duration'
									value={programDetails.duration}
									onChange={() => {}}
								/>
								<InputField
									placeholder='Amount'
									type='number'
									className='col-md-3 fv-row'
									label='Amount'
									name='amount'
									htmlFor='amount'
									value={programDetails.amount}
									onChange={() => {}}
								/>
								<SelectField
									className='col-md-3 fv-row mb-7'
									label='Payment Method'
									name='payment_method'
									value={programDetails.payment_method}
									onChange={() => {}}
									htmlFor='payment_method'
									options={['Online', 'Cash', 'SaveIn']}
								/>

								<div className='col-md-3 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6'>Workout Mode</label>
									<div className='d-flex gap-5'>
										{['online', 'offline'].map((mode) => (
											<div
												key={mode}
												className='form-check form-check-custom form-check-solid'>
												<input
													className='form-check-input'
													type='radio'
													checked={programDetails.workout_mode === mode}
													readOnly
												/>
												<label className='form-check-label text-capitalize'>{mode}</label>
											</div>
										))}
									</div>
								</div>

								{programDetails.workout_mode === 'offline' && (
									<InputField
										placeholder='Branch'
										type='text'
										className='col-md-3 fv-row'
										label='Workout Branch'
										name='workout_branch'
										htmlFor='workout_branch'
										value={programDetails.workout_branch}
										onChange={() => {}}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{hasPitchReport && (
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#vw_pitch_report'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Pitch Report</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='vw_pitch_report'
						className='collapse'>
						<div
							className='card-body border-top p-9'
							style={{ pointerEvents: 'none' }}>
							<div className='row mt-4'>
								<InputField
									placeholder='Telecaller Name'
									type='text'
									className='col-md-4 fv-row'
									label='Telecaller Name'
									name='telecaller_name'
									htmlFor='telecaller_name'
									value={pitchReport.telecaller_name}
									onChange={() => {}}
									disabled
								/>
								<InputField
									placeholder='Interest Level'
									type='text'
									className='col-md-4 fv-row'
									label='Interest Level'
									name='interest_level'
									htmlFor='interest_level'
									value={pitchReport.interest_level}
									onChange={() => {}}
									disabled
								/>
								<InputField
									placeholder='Follow Up Date'
									type='date'
									className='col-md-4 fv-row'
									label='Follow Up Date'
									name='follow_up_date'
									htmlFor='follow_up_date'
									value={pitchReport.follow_up_date}
									onChange={() => {}}
									disabled
								/>
							</div>

							{pitchReport.call_recording && (
								<div className='row mt-4 mb-7'>
									<div className='col-md-12 fv-row'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>Call Recording</label>
										<div className='mt-2'>
											<audio controls src={pitchReport.call_recording} style={{ width: '100%', borderRadius: '8px' }}>
												Your browser does not support the audio element.
											</audio>
										</div>
									</div>
								</div>
							)}

							<div className='col-md-12 fv-row mb-7'>
								<label className='form-label fw-bolder text-dark fs-6 mb-3'>Objections</label>
								<textarea
									className='form-control form-control-lg form-control-solid'
									rows={3}
									value={pitchReport.objections}
									readOnly
									disabled
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default ViewFollowUpReport
