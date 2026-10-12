import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { MultiSelect } from 'react-multi-select-component'
import { useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { GetBodyAnalysis, UpdateBodyAnalysis } from '../../../Functions/FWG'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const EditAnalysis = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const analysis_id: any = searchParams.get('analysis_id')
	const [bodyAnalysisData, setBodyAnalysisData] = useState<any>({
		firstName: '',
		lastName: '',
		age: Number,
		gender: '',
		test_time: Date,
		weight: Number,
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
	})
	const [selected, setSelected] = useState([])
	const [blood, setBlood] = useState<any>({
		_id: '',
		food_preference: '',
		unhealthy_habits: [],
		stress_and_tension: '',
		sugar_intake: Boolean,
		salt_intake: Boolean,
		running_medicine: '',
		systolic_blood_pressure: '',
		diastolic_blood_pressure: '',
		working_hours: Number,
		sleeping_hours: Number,
	})
	const [bloodSugar, setBloodSugar] = useState<any>([
		{
			id: '',
			metric: 'Normal',
			sub_category: 'Fasting',
			value: '80-100 mg/dl',
			selected: false,
		},
		{
			id: '',
			metric: 'Normal',
			sub_category: 'Just Ate',
			value: '170-200 mg/dl',
			selected: false,
		},
		{
			id: '',
			metric: 'Normal',
			sub_category: '3 Hours After Eating',
			value: '120-140 mg/dl',
			selected: false,
		},
		{
			id: '',
			metric: 'Pre Diabetic',
			sub_category: 'Fasting',
			value: '101-125 mg/dl',
			selected: false,
		},
		{
			id: '',
			metric: 'Pre Diabetic',
			sub_category: 'Just Ate',
			value: '190-230 mg/dl',
			selected: false,
		},
		{
			id: '',
			metric: 'Pre Diabetic',
			sub_category: '3 Hours After Eating',
			value: '140-160 mg/dl',
			selected: false,
		},
		{
			id: '',
			metric: 'Diabetic',
			sub_category: 'Fasting',
			value: '126+ mg/dl',
			selected: false,
		},
		{
			id: '',
			metric: 'Diabetic',
			sub_category: 'Just Ate',
			value: '220-300 mg/dl',
			selected: false,
		},
		{
			id: '',
			metric: 'Diabetic',
			sub_category: '3 Hours After Eating',
			value: '200+ mg/dl',
			selected: false,
		},
	])
	const [loading, setLoading] = useState(false)

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

	const handleBloodPressureChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target

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
		otherMedicalCondition: '',
		otherFoodAllergy: '',
		otherPreviousInjury: '',
		selectedFile: null as File | null,
	})

	const [selectedCards, setSelectedCards] = useState<string[]>([])
	const [isOtherSelected, setIsOtherSelected] = useState(false)
	const [isOtherFoodAllergySelected, setIsOtherFoodAllergySelected] = useState(false)
	const [isOtherPreviousInjurySelected, setIsOtherPreviousInjurySelected] = useState(false)

	const updateSelectedCards = (fetchedData: any) => {
		const updatedBodyCheckup = { ...bodyCheckup }

		const checkAndUpdateCategory = (category: string, dataKey: string, otherKey: string) => {
			updatedBodyCheckup[category] = updatedBodyCheckup[category].map((item: any) => {
				const key = Object.keys(item)[0]
				return {
					...item,
					[key]: { ...item[key], selected: fetchedData[dataKey].includes(item.label) },
				}
			})

			const otherItems = fetchedData[dataKey].filter(
				(condition: any) =>
					!updatedBodyCheckup[category].some((item: any) => item.label === condition)
			)
			if (otherItems.length > 0) {
				updatedBodyCheckup[otherKey] = otherItems.join(', ')
			} else {
				updatedBodyCheckup[otherKey] = ''
			}
		}

		checkAndUpdateCategory('medical_condition', 'medical_condition', 'otherMedicalCondition')
		checkAndUpdateCategory('food_allergy', 'food_allergies', 'otherFoodAllergy')
		checkAndUpdateCategory('previous_injury', 'previous_injuries', 'otherPreviousInjury')
		checkAndUpdateCategory('food_preference', 'food_preferences', 'otherFoodPreference')

		setBodyCheckup(updatedBodyCheckup)
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

	const renderCheckboxes = (category: any, items: any) => {
		return items.map((item: any, index: any) => {
			const key = Object.keys(item)[0]
			const cardId = `${category}_${key}`
			const isSelected = bodyCheckup[category][index][key].selected

			if (category !== 'food_preference' && index === items.length - 1) {
				const isOtherSelectedCategory =
					category === 'medical_condition'
						? isOtherSelected
						: category === 'food_allergy'
						? isOtherFoodAllergySelected
						: isOtherPreviousInjurySelected
				const otherName =
					category === 'medical_condition'
						? 'otherMedicalCondition'
						: category === 'food_allergy'
						? 'otherFoodAllergy'
						: 'otherPreviousInjury'

				return (
					<React.Fragment key={`fragment_${index}`}>
						<div
							className='col-md-3 my-2'
							onClick={() => handleCardClick(category, item)}>
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
								className={`btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center ${
									isSelected ? 'active border-primary' : ''
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

						<div
							className='col-md-3 my-2'
							key='other_input'>
							<label
								className={`btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center ${
									bodyCheckup[otherName] ? 'border-primary' : ''
								}`}
								htmlFor='other'>
								<div
									className='d-block fw-bold text-start'
									style={{ width: '100%' }}>
									<InputField
										placeholder=''
										type='text'
										className=''
										name={otherName}
										label='Other'
										htmlFor='other'
										value={bodyCheckup[otherName]}
										onChange={handleBodyCheckupInputChange}
										marginRemove={true}
									/>
								</div>
							</label>
						</div>
					</React.Fragment>
				)
			}

			return (
				<div
					className='col-md-3 my-2'
					key={index}
					onClick={() => handleCardClick(category, item)}>
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
						className={`btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center ${
							isSelected ? 'active border-primary' : ''
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
		})
	}

	const [composition, setComposition] = useState<any>({
		weight1: {
			id: '',
			value: '',
		},
		weight45: {
			id: '',
			value: '',
		},
		weight90: {
			id: '',
			value: '',
		},
		smm1: {
			id: '',
			value: '',
		},
		smm45: {
			id: '',
			value: '',
		},
		smm90: {
			id: '',
			value: '',
		},
		pbf1: {
			id: '',
			value: '',
		},
		pbf45: {
			id: '',
			value: '',
		},
		pbf90: {
			id: '',
			value: '',
		},
	})

	const handleCompositionChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target

		setComposition((prevData: any) => ({
			...prevData,
			[name]: {
				...prevData[name],
				value: value,
			},
		}))
	}

	const fetchData = async () => {
		setLoading(true)
		try {
			const featureResponse = await GetBodyAnalysis({ analysis_id })

			const fetchedData = featureResponse.data[0]

			setBodyAnalysisData({
				firstName: fetchedData.first_name,
				lastName: fetchedData.last_name,
				age: fetchedData.age,
				gender: fetchedData.gender,
				test_time: DayJS(fetchedData.test_time).format('YYYY-MM-DD'),
				weight: fetchedData.weight,
				skeletal_muscle_mass: fetchedData.skeletal_muscle_mass,
				ideal_body_weight: fetchedData.ideal_body_weight,
				body_mass_index: fetchedData.body_mass_index,
				percent_body_fat: fetchedData.percent_body_fat,
				muscle_in_arms: fetchedData.muscle_in_arms,
				muscle_in_legs: fetchedData.muscle_in_legs,
				muscle_in_trunk: fetchedData.muscle_in_trunk,
				fat_in_arms: fetchedData.fat_in_arms,
				fat_in_legs: fetchedData.fat_in_legs,
				fat_in_trunk: fetchedData.fat_in_trunk,
				pulses: {
					category: fetchedData.pulses.category,
					value: fetchedData.pulses.value,
				},
			})

			setBlood({
				_id: fetchedData?.body_composition_history[0]?._id,
				food_preference: fetchedData.food_preferences[0] || '',
				stress_and_tension: fetchedData.body_composition_history[0].stress_and_tension[0] || '',
				sugar_intake: fetchedData.body_composition_history[0].sugar_intake || false,
				salt_intake: fetchedData.body_composition_history[0].salt_intake || false,
				running_medicine: fetchedData.body_composition_history[0].running_medicine[0] || '',
				systolic_blood_pressure:
					fetchedData.body_composition_history[0].systolic_blood_pressure || '',
				diastolic_blood_pressure:
					fetchedData.body_composition_history[0].diastolic_blood_pressure || '',
				working_hours: fetchedData.body_composition_history[0].working_hours || 0,
				sleeping_hours: fetchedData.body_composition_history[0].sleeping_hours || 0,
			})

			const formattedSelected = fetchedData.body_composition_history[0].unhealthy_habits.map(
				(habit: any) => ({
					value: habit,
					label: habit,
				})
			)

			setSelected(formattedSelected)

			setComposition({
				weight1: {
					id: fetchedData.body_composition_analysis[0]._id,
					value: fetchedData.body_composition_analysis[0].value || 0,
				},
				weight45: {
					id: fetchedData.body_composition_analysis[1]._id,
					value: fetchedData.body_composition_analysis[1].value || 0,
				},
				weight90: {
					id: fetchedData.body_composition_analysis[2]._id,
					value: fetchedData.body_composition_analysis[2].value || 0,
				},
				smm1: {
					id: fetchedData.body_composition_analysis[3]._id,
					value: fetchedData.body_composition_analysis[3].value || 0,
				},
				smm45: {
					id: fetchedData.body_composition_analysis[4]._id,
					value: fetchedData.body_composition_analysis[4].value || 0,
				},
				smm90: {
					id: fetchedData.body_composition_analysis[5]._id,
					value: fetchedData.body_composition_analysis[5].value || 0,
				},
				pbf1: {
					id: fetchedData.body_composition_analysis[6]._id,
					value: fetchedData.body_composition_analysis[6].value || 0,
				},
				pbf45: {
					id: fetchedData.body_composition_analysis[7]._id,
					value: fetchedData.body_composition_analysis[7].value || 0,
				},
				pbf90: {
					id: fetchedData.body_composition_analysis[8]._id,
					value: fetchedData.body_composition_analysis[8].value || 0,
				},
			})

			const updatedBloodSugar = bloodSugar.map((item: any) => ({
				...item,
				selected: fetchedData.blood_sugar_tracking.some(
					(track: any) => track.metric === item.metric && track.sub_category === item.sub_category
				),
			}))
			setBloodSugar(updatedBloodSugar)

			const fetchedMedicalConditions = fetchedData.medical_condition || []
			const fetchedFoodAllergies = fetchedData.food_allergies || []
			const fetchedPreviousInjuries = fetchedData.previous_injuries || []
			const fetchedFoodPreferences = fetchedData.food_preferences || []

			updateSelectedCards({
				medical_condition: fetchedMedicalConditions,
				food_allergies: fetchedFoodAllergies,
				previous_injuries: fetchedPreviousInjuries,
				food_preferences: fetchedFoodPreferences,
			})
		} catch (error) {
			console.error('Error fetching data:', error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [analysis_id])

	const handleEditPlan = async () => {
		try {
			const selectedBloodSugar = bloodSugar.filter((item: any) => item.selected)

			// Extract selected items from state
			const selectedMedicalConditions = bodyCheckup.medical_condition
				.filter((item: any) => item[Object.keys(item)[0]].selected)
				.map((item: any) => item.label)

			// Include other medical condition if filled
			if (bodyCheckup.otherMedicalCondition.trim() !== '') {
				selectedMedicalConditions.push(bodyCheckup.otherMedicalCondition.trim())
			}

			// Food allergies
			const selectedFoodAllergies = bodyCheckup.food_allergy
				.filter((item: any) => item[Object.keys(item)[0]].selected)
				.map((item: any) => item.label)

			// Include other food allergy if filled
			if (bodyCheckup.otherFoodAllergy.trim() !== '') {
				selectedFoodAllergies.push(bodyCheckup.otherFoodAllergy.trim())
			}

			// Previous injuries
			const selectedPreviousInjuries = bodyCheckup.previous_injury
				.filter((item: any) => item[Object.keys(item)[0]].selected)
				.map((item: any) => item.label)

			// Include other previous injury if filled
			if (bodyCheckup.otherPreviousInjury.trim() !== '') {
				selectedPreviousInjuries.push(bodyCheckup.otherPreviousInjury.trim())
			}

			// Extract selected food preferences
			const selectedFoodPreferences = bodyCheckup.food_preference
				.filter((item: any) => item[Object.keys(item)[0]].selected)
				.map((item: any) => item.label)

			const payload: any = {
				first_name: bodyAnalysisData.firstName,
				last_name: bodyAnalysisData.lastName,
				age: parseInt(bodyAnalysisData.age),
				gender: bodyAnalysisData.gender,
				test_time: bodyAnalysisData.test_time,
				weight: parseInt(bodyAnalysisData.weight),
				skeletal_muscle_mass: parseInt(bodyAnalysisData.skeletal_muscle_mass),
				ideal_body_weight: parseInt(bodyAnalysisData.ideal_body_weight),
				body_mass_index: parseInt(bodyAnalysisData.body_mass_index),
				percent_body_fat: parseInt(bodyAnalysisData.percent_body_fat),
				muscle_in_arms: parseInt(bodyAnalysisData.muscle_in_arms),
				muscle_in_legs: parseInt(bodyAnalysisData.muscle_in_legs),
				muscle_in_trunk: parseInt(bodyAnalysisData.muscle_in_trunk),
				fat_in_arms: parseInt(bodyAnalysisData.fat_in_arms),
				fat_in_legs: parseInt(bodyAnalysisData.fat_in_legs),
				fat_in_trunk: parseInt(bodyAnalysisData.fat_in_trunk),

				body_composition_analysis: [
					{
						metric: 'weight',
						sub_category: 'Day 1',
						value: composition.weight1.value,
						_id: composition.weight1.id,
					},
					{
						metric: 'weight',
						sub_category: 'Day 45',
						value: composition.weight45.value,
						_id: composition.weight45.id,
					},
					{
						metric: 'weight',
						sub_category: 'Day 90',
						value: composition.weight90.value,
						_id: composition.weight90.id,
					},
					{
						metric: 'SMM (Skeletal Muscle Mass)',
						sub_category: 'Day 1',
						value: composition.smm1.value,
						_id: composition.smm1.id,
					},
					{
						metric: 'SMM (Skeletal Muscle Mass)',
						sub_category: 'Day 45',
						value: composition.smm45.value,
						_id: composition.smm45.id,
					},
					{
						metric: 'SMM (Skeletal Muscle Mass)',
						sub_category: 'Day 90',
						value: composition.smm90.value,
						_id: composition.smm90.id,
					},
					{
						metric: 'PBF (Percent Body Fat)',
						sub_category: 'Day 1',
						value: composition.pbf1.value,
						_id: composition.pbf1.id,
					},
					{
						metric: 'PBF (Percent Body Fat)',
						sub_category: 'Day 45',
						value: composition.pbf45.value,
						_id: composition.pbf45.id,
					},
					{
						metric: 'PBF (Percent Body Fat)',
						sub_category: 'Day 90',
						value: composition.pbf90.value,
						_id: composition.pbf90.id,
					},
				],

				medical_condition: selectedMedicalConditions,
				food_allergies: selectedFoodAllergies,
				previous_injuries: selectedPreviousInjuries,
				food_preferences: selectedFoodPreferences,
				pulses: {
					category: bodyAnalysisData.pulses.category,
					value: bodyAnalysisData.pulses.value,
				},

				blood_sugar_tracking: selectedBloodSugar,

				body_composition_history: [
					{
						_id: blood._id,
						food_preferences: blood.food_preferences,
						unhealthy_habits: selected.map((data: any) => data.value),
						stress_and_tension: [blood.stress_and_tension],
						sugar_intake: blood.sugar_intake,
						salt_intake: blood.salt_intake,
						running_medicine: [blood.running_medicine],
						systolic_blood_pressure: blood.systolic_blood_pressure,
						diastolic_blood_pressure: blood.diastolic_blood_pressure,
						working_hours: blood.working_hours,
						sleeping_hours: blood.sleeping_hours,
					},
				],
			}

			await UpdateBodyAnalysis(analysis_id, payload)

			toast.success('Body Analysis Updated successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Edit Body Analysis</PageTitle>
			{/* Body Analysis */}
			<div className='col-12'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_analysis'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Body Analysis</h3>
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
											placeholder='Enter First name'
											type='text'
											className='col-md-6 fv-row'
											name='firstName'
											label='First name'
											htmlFor='firstName'
											value={bodyAnalysisData.firstName} // pending
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Last name'
											type='text'
											className='col-md-6 fv-row'
											name='lastName'
											label='Last Name'
											htmlFor='lastName'
											value={bodyAnalysisData.lastName} // pending
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Age'
											type='number'
											className='col-md-6 fv-row'
											name='age'
											label='Age'
											htmlFor='age'
											value={bodyAnalysisData.age}
											onChange={handleBodyAnalysisInputChange}
										/>
										<SelectField
											className='col-md-6 fv-row mb-7'
											label='Gender'
											name='gender'
											value={bodyAnalysisData.gender}
											onChange={handleBodyAnalysisInputChange}
											htmlFor='gender'
											options={['MALE', 'FEMALE', 'OTHER']}
										/>
										<InputField
											placeholder='Enter Test Time'
											type='date'
											className='col-md-6 fv-row'
											name='test_time'
											label='Test Time'
											htmlFor='test_time'
											value={bodyAnalysisData.test_time}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Weight'
											type='number'
											className='col-md-6 fv-row'
											name='weight'
											label='Weight'
											htmlFor='weight'
											value={bodyAnalysisData.weight}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter SMM (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='skeletal_muscle_mass'
											label='SMM (Skeletal Muscle Mass in %)'
											htmlFor='skeletal_muscle_mass'
											value={bodyAnalysisData.skeletal_muscle_mass}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Ideal Body Weight (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='ideal_body_weight'
											label='Ideal Body Weight (in %)'
											htmlFor='ideal_body_weight'
											value={bodyAnalysisData.ideal_body_weight}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter BMI (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='body_mass_index'
											label='BMI (Body Mass Index in %)'
											htmlFor='body_mass_index'
											value={bodyAnalysisData.body_mass_index}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter PBF (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='percent_body_fat'
											label='PBF (Percent Body Fat in %)'
											htmlFor='percent_body_fat'
											value={bodyAnalysisData.percent_body_fat}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Muscle in Arms (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='muscle_in_arms'
											label='Muscle in Arms (in %)'
											htmlFor='muscle_in_arms'
											value={bodyAnalysisData.muscle_in_arms}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Muscle in Trunk (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='muscle_in_trunk'
											label='Muscle in Trunk (in %)'
											htmlFor='muscle_in_trunk'
											value={bodyAnalysisData.muscle_in_trunk}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Muscle in Legs (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='muscle_in_legs'
											label='Muscle in Legs (in %)'
											htmlFor='muscle_in_legs'
											value={bodyAnalysisData.muscle_in_legs}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Fat in Arms (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='fat_in_arms'
											label='Fat in Arms (in %)'
											htmlFor='fat_in_arms'
											value={bodyAnalysisData.fat_in_arms}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Fat in Trunk (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='fat_in_trunk'
											label='Fat in Trunk (in %)'
											htmlFor='fat_in_trunk'
											value={bodyAnalysisData.fat_in_trunk}
											onChange={handleBodyAnalysisInputChange}
										/>
										<InputField
											placeholder='Enter Fat in Legs (in %)'
											type='number'
											className='col-md-6 fv-row'
											name='fat_in_legs'
											label='Fat in Legs (in %)'
											htmlFor='fat_in_legs'
											value={bodyAnalysisData.fat_in_legs}
											onChange={handleBodyAnalysisInputChange}
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
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Body Composition Analysis */}
			<div className='col-12 d-md-block d-none mt-7'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_composition'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Body Composition Analysis</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_oder_view_composition'
						className='collapse'>
						<div className='card-body'>
							<div className='row justify-content-end'>
								<div className='col-12'>
									<div className='table-responsive'>
										<table className='table table-bordered table-hover'>
											<thead>
												<tr>
													<th>Name</th>
													<th>Day 1</th>
													<th>Day 45</th>
													<th>Day 90</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td>Weight</td>
													<td className='p-0'>
														<InputField
															placeholder=''
															type='number'
															className='fv-row'
															name='weight1'
															label=''
															htmlFor='weight1'
															value={composition.weight1.value}
															onChange={handleCompositionChange}
															showLabel={false}
															marginRemove={true}
														/>
													</td>
													<td className='p-0'>
														<InputField
															placeholder=''
															type='number'
															className='fv-row'
															name='weight45'
															label=''
															htmlFor='weight45'
															value={composition.weight45.value}
															onChange={handleCompositionChange}
															showLabel={false}
															marginRemove={true}
														/>
													</td>
													<td className='p-0'>
														<InputField
															placeholder=''
															type='number'
															className='fv-row'
															name='weight90'
															label=''
															htmlFor='weight90'
															value={composition.weight90.value}
															onChange={handleCompositionChange}
															showLabel={false}
															marginRemove={true}
														/>
													</td>
												</tr>
												<tr>
													<td>SMM (Skeletal Muscle Mass)</td>
													<td className='p-0'>
														<InputField
															placeholder=''
															type='number'
															className='fv-row'
															name='smm1'
															label=''
															htmlFor='smm1'
															value={composition.smm1.value}
															onChange={handleCompositionChange}
															showLabel={false}
															marginRemove={true}
														/>
													</td>
													<td className='p-0'>
														<InputField
															placeholder=''
															type='number'
															className='fv-row'
															name='smm45'
															label=''
															htmlFor='smm45'
															value={composition.smm45.value}
															onChange={handleCompositionChange}
															showLabel={false}
															marginRemove={true}
														/>
													</td>
													<td className='p-0'>
														<InputField
															placeholder=''
															type='number'
															className='fv-row'
															name='smm90'
															label=''
															htmlFor='smm90'
															value={composition.smm90.value}
															onChange={handleCompositionChange}
															showLabel={false}
															marginRemove={true}
														/>
													</td>
												</tr>
												<tr>
													<td>PBF (Percent Body Fat)</td>
													<td className='p-0'>
														<InputField
															placeholder=''
															type='number'
															className='fv-row'
															name='pbf1'
															label=''
															htmlFor='pbf1'
															value={composition.pbf1.value}
															onChange={handleCompositionChange}
															showLabel={false}
															marginRemove={true}
														/>
													</td>
													<td className='p-0'>
														<InputField
															placeholder=''
															type='number'
															className='fv-row'
															name='pbf45'
															label=''
															htmlFor='pbf45'
															value={composition.pbf45.value}
															onChange={handleCompositionChange}
															showLabel={false}
															marginRemove={true}
														/>
													</td>
													<td className='p-0'>
														<InputField
															placeholder=''
															type='number'
															className='fv-row'
															name='pbf90'
															label=''
															htmlFor='pbf90'
															value={composition.pbf90.value}
															onChange={handleCompositionChange}
															showLabel={false}
															marginRemove={true}
														/>
													</td>
												</tr>
											</tbody>
										</table>
									</div>
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
											const analysisElement = document.getElementById('kt_oder_view_composition')
											const compositionElement = document.getElementById('kt_oder_view_food')

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
			<div className='col-12 d-md-none d-block mt-7'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_composition'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Body Composition Analysis</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_oder_view_composition'
						className='collapse'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-12'>
									<div className='row'>
										<div className='col-12 mb-4'>
											<div
												className='card border'
												style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 12px !important' }}>
												<div
													className='card-header'
													style={{ minHeight: '0px' }}>
													<h5 className='mt-3'>Weight</h5>
												</div>
												<div className='card-body'>
													<div className='row'>
														<div className='col-12 mb-2'>
															<label
																htmlFor='weight1'
																className='form-label'>
																Day 1
															</label>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='weight1'
																label=''
																htmlFor='weight1'
																value={composition.weight1.value}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='weight45'
																className='form-label'>
																Day 45
															</label>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='weight45'
																label=''
																htmlFor='weight45'
																value={composition.weight45.value}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='weight90'
																className='form-label'>
																Day 90
															</label>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='weight90'
																label=''
																htmlFor='weight90'
																value={composition.weight90.value}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className='col-12 mb-4'>
											<div
												className='card border'
												style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 12px !important' }}>
												<div
													className='card-header'
													style={{ minHeight: '0px' }}>
													<h5 className='mt-3'>SMM (Skeletal Muscle Mass)</h5>
												</div>
												<div className='card-body'>
													<div className='row'>
														<div className='col-12 mb-2'>
															<label
																htmlFor='smm1'
																className='form-label'>
																Day 1
															</label>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='smm1'
																label=''
																htmlFor='smm1'
																value={composition.smm1.value}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='smm45'
																className='form-label'>
																Day 45
															</label>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='smm45'
																label=''
																htmlFor='smm45'
																value={composition.smm45.value}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='smm90'
																className='form-label'>
																Day 90
															</label>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='smm90'
																label=''
																htmlFor='smm90'
																value={composition.smm90.value}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className='col-12 mb-4'>
											<div
												className='card border'
												style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 12px !important' }}>
												<div
													className='card-header'
													style={{ minHeight: '0px' }}>
													<h5 className='mt-3'>PBF (Percent Body Fat)</h5>
												</div>
												<div className='card-body'>
													<div className='row'>
														<div className='col-12 mb-2'>
															<label
																htmlFor='pbf1'
																className='form-label'>
																Day 1
															</label>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='pbf1'
																label=''
																htmlFor='pbf1'
																value={composition.pbf1.value}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='pbf45'
																className='form-label'>
																Day 45
															</label>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='pbf45'
																label=''
																htmlFor='pbf45'
																value={composition.pbf45.value}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='pbf90'
																className='form-label'>
																Day 90
															</label>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='pbf90'
																label=''
																htmlFor='pbf90'
																value={composition.pbf90.value}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
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
											const analysisElement = document.getElementById('kt_oder_view_composition')
											const compositionElement = document.getElementById('kt_oder_view_food')

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

			{/* Body Checkup */}
			<div className='card mb-5 mb-xl-10 mt-5'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_oder_view_food'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Body Checkup</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_oder_view_food'
					className='collapse'>
					<div className='card-body border-top p-9'>
						<div className='p-6'>
							<div className='w-100 my-5'>
								<div className='pb-5'>
									<h2 className='fw-bolder d-flex align-items-center text-dark'>
										Medical Condition
									</h2>
								</div>
								<div className='row'>
									{renderCheckboxes('medical_condition', bodyCheckup.medical_condition)}
								</div>
							</div>

							<div className='w-100 my-5'>
								<div className='pb-5'>
									<h2 className='fw-bolder d-flex align-items-center text-dark'>Food Allergy</h2>
								</div>
								<div className='row'>
									{renderCheckboxes('food_allergy', bodyCheckup.food_allergy)}
								</div>
							</div>

							<div className='w-100 my-5'>
								<div className='pb-5'>
									<h2 className='fw-bolder d-flex align-items-center text-dark'>Previous Injury</h2>
								</div>
								<div className='row'>
									{renderCheckboxes('previous_injury', bodyCheckup.previous_injury)}
								</div>
							</div>

							<div className='w-100 my-5'>
								<div className='pb-5'>
									<h2 className='fw-bolder d-flex align-items-center text-dark'>Food Preference</h2>
								</div>
								<div className='row'>
									{renderCheckboxes('food_preference', bodyCheckup.food_preference)}
								</div>
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
										const analysisElement = document.getElementById('kt_oder_view_food')
										const compositionElement = document.getElementById('kt_oder_view_foodlifestyle')
										// handleAddBodyAnalysisButtonClick
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

			{/* Body Composition History */}
			<div className='col-12'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_foodlifestyle'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Body Composition History</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_oder_view_foodlifestyle'
						className='collapse'>
						<div className='card-body'>
							<div className='row mt-4'>
								<SelectField
									className={`col-md-12 fv-row  ${blood.food_preference ? 'mb-0' : 'mb-7'}`}
									label='food preference'
									name='food_preference'
									value={blood.food_preference}
									onChange={handleBloodPressureChange}
									htmlFor='food_preference'
									options={['Breakfast', 'Lunch', 'Dinner']}
									marginRemove={true}
								/>
								{blood.food_preference != '' ? (
									<InputField
										placeholder='Enter Food'
										type='text'
										className='col-md-12 fv-row'
										label=''
										name='food_preference'
										htmlFor='food_preference'
										value={blood.food_preference}
										onChange={handleBloodPressureChange}
									/>
								) : (
									''
								)}
								{/* <SelectField
									className='col-md-6 fv-row mb-7'
									label='Unhealthy Habits'
									name='unhealthy_habits'
									value={blood.unhealthy_habits}
									onChange={handleBloodPressureChange}
									htmlFor='unhealthy_habits'
									multiSelect
									options={['Smoke', 'Alcohol', 'Drug', 'Sugar intake', 'None']}
								/> */}
								<div className='col-md-6 fv-row mb-7'>
									<label
										htmlFor='selected'
										className='required fw-bold fs-6 mb-5'>
										Unhealthy Habits
									</label>
									<MultiSelect
										className='fv-row'
										options={[
											{ value: 'Smoke', label: 'Smoke' },
											{ value: 'Alcohol', label: 'Alcohol' },
											{ value: 'Drug', label: 'Drug' },
											{ value: 'Sugar intake', label: 'Sugar intake' },
											{ value: 'None', label: 'None' },
										]}
										value={selected}
										onChange={setSelected}
										labelledBy='Select'
										hasSelectAll={false}
									/>
								</div>

								<InputField
									placeholder='Enter First name'
									type='text'
									className='fv-row col-md-6'
									label='Stress and Tension'
									name='stress_and_tension'
									htmlFor='stress_and_tension'
									value={blood.stress_and_tension}
									onChange={handleBloodPressureChange}
								/>
								<div className='col-md-6 d-flex flex-wrap'>
									<div className='col-12 mb-md-0 mb-4'>
										<b className='d-block fw-bold'>Sugar and Salt Intake</b>
									</div>
									<div className='col-6 mb-md-10 mb-4'>
										<input
											type='checkbox'
											id='sugar_intake'
											name='sugar_intake'
											className='form-check-input'
											style={{ backgroundSize: 'auto' }}
											value={blood.sugar_intake}
											checked={blood.sugar_intake}
											onChange={handleBloodPressureChange}
										/>
										<label
											className='mx-2'
											htmlFor='sugar_intake'>
											Sugar Intake
										</label>
									</div>
									<div className='col-6'>
										<input
											type='checkbox'
											name='salt_intake'
											id='salt_intake'
											className='form-check-input '
											style={{ backgroundSize: 'auto' }}
											value={blood.salt_intake}
											checked={blood.salt_intake}
											onChange={handleBloodPressureChange}
										/>
										<label
											className='mx-2'
											htmlFor='salt_intake'>
											Salt Intake
										</label>
									</div>
								</div>
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
									htmlFor='gender'
									options={['<120', '120-129', '130-139', '>140']}
								/>
								<SelectField
									className='col-md-6 fv-row mb-7'
									label='Diastolic Blood Pressure'
									name='diastolic_blood_pressure'
									value={blood.diastolic_blood_pressure}
									onChange={handleBloodPressureChange}
									htmlFor='gender'
									options={['<80', '80-84', '85-89', '>90']}
								/>
								<InputField
									placeholder='Enter Test Time'
									type='number'
									className='col-md-6 fv-row'
									name='working_hours'
									label='Working Hours'
									htmlFor='testTime'
									value={blood.working_hours}
									onChange={handleBloodPressureChange}
								/>
								<InputField
									placeholder='Enter Test Time'
									type='number'
									className='col-md-6 fv-row'
									name='sleeping_hours'
									label='Sleeping Hours'
									htmlFor='testTime'
									value={blood.sleeping_hours}
									onChange={handleBloodPressureChange}
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
											const analysisElement = document.getElementById('kt_oder_view_foodlifestyle')
											const compositionElement = document.getElementById('kt_oder_view_sugarTrack')

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

			{/* Blood Sugar Tracking */}
			<div className='col-12 d-md-block d-none'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_sugarTrack'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Blood Sugar Tracking</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_oder_view_sugarTrack'
						className='collapse'>
						<div className='card-body'>
							<div className='row'>
								<div>
									<table className='table table-bordered'>
										<thead className='thead-light'>
											<tr>
												<th scope='col'>Name</th>
												<th scope='col'>Fasting</th>
												<th scope='col'>Just Ate</th>
												<th scope='col'>3 Hours After Eating</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>Normal</td>
												<td>
													<input
														type='checkbox'
														id='normalFasting'
														name='normalFasting'
														className='me-3 form-check-input'
														checked={bloodSugar[0].selected}
														onChange={() => handleBloodSugarChange(0)}
													/>
													80-100 mg/dl
												</td>
												<td>
													<input
														type='checkbox'
														id='normalJustAte'
														name='normalJustAte'
														className='me-3 form-check-input'
														checked={bloodSugar[1].selected}
														onChange={() => handleBloodSugarChange(1)}
													/>
													170-200 mg/dl
												</td>
												<td>
													<input
														type='checkbox'
														id='normal3HoursAfterEating'
														name='normal3HoursAfterEating'
														className='me-3 form-check-input'
														checked={bloodSugar[2].selected}
														onChange={() => handleBloodSugarChange(2)}
													/>
													120-140 mg/dl
												</td>
											</tr>
											<tr>
												<td>Pre Diabetic</td>
												<td>
													<input
														type='checkbox'
														id='preDiabeticFasting'
														name='preDiabeticFasting'
														className='me-3 form-check-input'
														checked={bloodSugar[3].selected}
														onChange={() => handleBloodSugarChange(3)}
													/>
													101-125 mg/dl
												</td>
												<td>
													<input
														type='checkbox'
														id='preDiabeticJustAte'
														name='preDiabeticJustAte'
														className='me-3 form-check-input'
														checked={bloodSugar[4].selected}
														onChange={() => handleBloodSugarChange(4)}
													/>
													190-230 mg/dl
												</td>
												<td>
													<input
														type='checkbox'
														id='preDiabetic3HoursAfterEating'
														name='preDiabetic3HoursAfterEating'
														className='me-3 form-check-input'
														checked={bloodSugar[5].selected}
														onChange={() => handleBloodSugarChange(5)}
													/>
													140-160 mg/dl
												</td>
											</tr>
											<tr>
												<td>Diabetic</td>
												<td>
													<input
														type='checkbox'
														id='diabeticFasting'
														name='diabeticFasting'
														className='me-3 form-check-input'
														checked={bloodSugar[6].selected}
														onChange={() => handleBloodSugarChange(6)}
													/>
													126+ mg/dl
												</td>
												<td>
													<input
														type='checkbox'
														id='diabeticJustAte'
														name='diabeticJustAte'
														className='me-3 form-check-input'
														checked={bloodSugar[7].selected}
														onChange={() => handleBloodSugarChange(7)}
													/>
													220-300 mg/dl
												</td>
												<td>
													<input
														type='checkbox'
														id='diabetic3HoursAfterEating'
														name='diabetic3HoursAfterEating'
														className='me-3 form-check-input'
														checked={bloodSugar[8].selected}
														onChange={() => handleBloodSugarChange(8)}
													/>
													200+ mg/dl
												</td>
											</tr>
										</tbody>
									</table>
								</div>
								<div className='col-md-12 mt-5 mb-7'>
									<div className='d-flex justify-content-end'>
										<TableButton
											action='add'
											text='Next'
											showIcon={false}
											backgroundDark={true}
											onClick={() => {
												const analysisElement = document.getElementById('kt_oder_view_sugarTrack')
												const compositionElement = document.getElementById('kt_oder_view_pulses')

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
			</div>
			<div className='col-12 d-md-none d-block'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_sugarTrack'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Blood Sugar Tracking</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_oder_view_sugarTrack'
						className='collapse'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-12'>
									<div className='row'>
										<div className='col-12 mb-4'>
											<div
												className='card border shadow-sm'
												style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 12px !important' }}>
												<div
													className='card-header bg-transparent'
													style={{ minHeight: '0px' }}>
													<h5 className='card-title mt-3'>Normal</h5>
												</div>
												<div className='card-body'>
													<div className='row'>
														<div className='col-12 mb-2'>
															<label
																htmlFor='fasting'
																className='form-label d-block'>
																Fasting:
															</label>
															<div className='form-check'>
																<input
																	type='checkbox'
																	id='fasting'
																	name='fasting'
																	className='form-check-input'
																	value='fasting'
																	checked={bloodSugar[0].selected}
																	onChange={handleBloodPressureChange}
																	style={{ backgroundSize: 'auto' }}
																/>
																<label
																	className='form-check-label ms-2'
																	htmlFor='fasting'>
																	80-100 mg/dl
																</label>
															</div>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='justAte'
																className='form-label d-block'>
																Just Ate:
															</label>
															<div className='form-check'>
																<input
																	type='checkbox'
																	id='justAte'
																	name='justAte'
																	className='form-check-input'
																	value='justAte'
																	onChange={handleBloodPressureChange}
																	checked={bloodSugar[1].selected}
																	style={{ backgroundSize: 'auto' }}
																/>
																<label
																	className='form-check-label ms-2'
																	htmlFor='justAte'>
																	170-200 mg/dl
																</label>
															</div>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='threeHoursAfter'
																className='form-label d-block'>
																3 Hours After Eating:
															</label>
															<div className='form-check'>
																<input
																	type='checkbox'
																	id='threeHoursAfter'
																	name='threeHoursAfter'
																	className='form-check-input'
																	value='threeHoursAfter'
																	checked={bloodSugar[2].selected}
																	onChange={handleBloodPressureChange}
																	style={{ backgroundSize: 'auto' }}
																/>
																<label
																	className='form-check-label ms-2'
																	htmlFor='threeHoursAfter'>
																	120-140 mg/dl
																</label>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className='col-12 mb-4'>
											<div
												className='card border shadow-sm'
												style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 12px !important' }}>
												<div
													className='card-header bg-transparent'
													style={{ minHeight: '0px' }}>
													<h5 className='card-title mt-3'>Pre Diabetic</h5>
												</div>
												<div className='card-body'>
													<div className='row'>
														<div className='col-12 mb-2'>
															<label
																htmlFor='fastingPre'
																className='form-label d-block'>
																Fasting:
															</label>
															<div className='form-check'>
																<input
																	type='checkbox'
																	id='fastingPre'
																	name='fastingPre'
																	className='form-check-input'
																	value='fastingPre'
																	checked={bloodSugar[3].selected}
																	onChange={handleBloodPressureChange}
																	style={{ backgroundSize: 'auto' }}
																/>
																<label
																	className='form-check-label ms-2'
																	htmlFor='fastingPre'>
																	80-100 mg/dl
																</label>
															</div>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='justAtePre'
																className='form-label d-block'>
																Just Ate:
															</label>
															<div className='form-check'>
																<input
																	type='checkbox'
																	id='justAtePre'
																	name='justAtePre'
																	className='form-check-input'
																	value='justAtePre'
																	checked={bloodSugar[4].selected}
																	onChange={handleBloodPressureChange}
																	style={{ backgroundSize: 'auto' }}
																/>
																<label
																	className='form-check-label ms-2'
																	htmlFor='justAtePre'>
																	170-200 mg/dl
																</label>
															</div>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='threeHoursAfterPre'
																className='form-label d-block'>
																3 Hours After Eating:
															</label>
															<div className='form-check'>
																<input
																	type='checkbox'
																	id='threeHoursAfterPre'
																	name='threeHoursAfterPre'
																	className='form-check-input'
																	value='threeHoursAfterPre'
																	checked={bloodSugar[5].selected}
																	onChange={handleBloodPressureChange}
																	style={{ backgroundSize: 'auto' }}
																/>
																<label
																	className='form-check-label ms-2'
																	htmlFor='threeHoursAfterPre'>
																	120-140 mg/dl
																</label>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className='col-12 mb-4'>
											<div
												className='card border shadow-sm'
												style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 12px !important' }}>
												<div
													className='card-header bg-transparent'
													style={{ minHeight: '0px' }}>
													<h5 className='card-title mt-3'>Diabetic</h5>
												</div>
												<div className='card-body'>
													<div className='row'>
														<div className='col-12 mb-2'>
															<label
																htmlFor='fastingDiabetic'
																className='form-label d-block'>
																Fasting:
															</label>
															<div className='form-check'>
																<input
																	type='checkbox'
																	id='fastingDiabetic'
																	name='fastingDiabetic'
																	className='form-check-input'
																	value='fastingDiabetic'
																	checked={bloodSugar[6].selected}
																	onChange={handleBloodPressureChange}
																	style={{ backgroundSize: 'auto' }}
																/>
																<label
																	className='form-check-label ms-2'
																	htmlFor='fastingDiabetic'>
																	80-100 mg/dl
																</label>
															</div>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='justAteDiabetic'
																className='form-label d-block'>
																Just Ate:
															</label>
															<div className='form-check'>
																<input
																	type='checkbox'
																	id='justAteDiabetic'
																	name='justAteDiabetic'
																	className='form-check-input'
																	value='justAteDiabetic'
																	checked={bloodSugar[7].selected}
																	onChange={handleBloodPressureChange}
																	style={{ backgroundSize: 'auto' }}
																/>
																<label
																	className='form-check-label ms-2'
																	htmlFor='justAteDiabetic'>
																	170-200 mg/dl
																</label>
															</div>
														</div>
														<div className='col-12 mb-2'>
															<label
																htmlFor='threeHoursAfterDiabetic'
																className='form-label d-block'>
																3 Hours After Eating:
															</label>
															<div className='form-check'>
																<input
																	type='checkbox'
																	id='threeHoursAfterDiabetic'
																	name='threeHoursAfterDiabetic'
																	className='form-check-input'
																	value='threeHoursAfterDiabetic'
																	checked={bloodSugar ? bloodSugar[8]?.selected : ''}
																	onChange={handleBloodPressureChange}
																	style={{ backgroundSize: 'auto' }}
																/>
																<label
																	className='form-check-label ms-2'
																	htmlFor='threeHoursAfterDiabetic'>
																	120-140 mg/dl
																</label>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
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
											const analysisElement = document.getElementById('kt_oder_view_sugarTrack')
											const compositionElement = document.getElementById('kt_oder_view_pulses')

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

			{/* Pulses */}
			<div className='col-12'>
				<div className='card mb-5 mb-xl-10 mt-5'>
					<div
						className='card-header row border-0 cursor-pointer'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_oder_view_pulses'>
						<div className='card-title m-0 d-flex align-items-center justify-content-between'>
							<h3 className='fw-bolder m-0'>Pulses</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-3'
							/>
						</div>
					</div>
					<div
						id='kt_oder_view_pulses'
						className='collapse'>
						<div className='card-body'>
							<div className='form-check mb-3'>
								<input
									className='form-check-input'
									type='radio'
									name='category'
									id='pulseChildren'
									value='Children'
									checked={bodyAnalysisData.pulses.category == 'children' ? true : false}
									onChange={handleBodyAnalysisInputChange}
								/>
								<label
									className='form-check-label'
									style={{ backgroundSize: 'auto' }}
									htmlFor='pulseChildren'>
									Children (ages 6-15) 70-100 Beats Per Minute
								</label>
							</div>
							<div className='form-check mb-3'>
								<input
									className='form-check-input'
									type='radio'
									name='category'
									id='pulseAdults'
									value='Adults'
									checked={bodyAnalysisData.pulses.category == 'adults' ? true : false}
									onChange={handleBodyAnalysisInputChange}
								/>
								<label
									className='form-check-label'
									style={{ backgroundSize: 'auto' }}
									htmlFor='pulseAdults'>
									Adults (Age 18 and over) 60-100 Beats Per Minute
								</label>
							</div>
							<div className='col-md-12 mt-5 mb-7'>
								<div className='d-flex justify-content-end'>
									<TableButton
										action='edit'
										text='Update'
										onClick={handleEditPlan}
										backgroundDark={true}
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

export { EditAnalysis }
