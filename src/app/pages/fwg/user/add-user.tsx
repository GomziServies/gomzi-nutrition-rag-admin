import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { CreateUser, FileUploadToFWG } from '../../../Functions/FWG'
import TableButton from '../../../components/TableButton'
import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'

const AddUser = () => {
	const intl = useIntl()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		mobile: '',
		country_code: '',
		gender: '',
		birth_date: '',
		password: '',
		co_password: '',
		profile_image: '',
		selectedFile: null as File | null,
	})
	const [showPassword, setShowPassword] = useState(false)

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setFormData((prevData) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}))
		} else {
			setFormData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handleAddButtonClick = async () => {
		if (
			!formData.password ||
			!formData.co_password ||
			!formData.firstName ||
			!formData.lastName ||
			!formData.mobile ||
			!formData.country_code ||
			!formData.email ||
			!formData.birth_date
		) {
			toast.error('All Fields Required')
			return
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

		// Validate email
		if (!emailRegex.test(formData.email)) {
			toast.error('Please enter a valid email address')
			return
		}

		if (formData.password !== formData.co_password) {
			toast.error('Password and confirm password do not match')
			return
		}

		try {
			setIsSubmitting(true)
			let imgUrl = ''

			if (formData.selectedFile) {
				const imageUrl: any = await FileUploadToFWG([formData.selectedFile], {
					directory: 'documents',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Profile image uploaded successfully')
			}

			const payload: any = {
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				password: formData.password,
				mobile: formData.mobile,
				country_code: formData.country_code,
				profile_image: imgUrl,
				gender: formData.gender,
				birth_date: formData.birth_date,
			}

			await CreateUser(payload)

			toast.success('User Created Successfully')

			setFormData({
				firstName: '',
				lastName: '',
				email: '',
				mobile: '',
				country_code: '',
				gender: '',
				birth_date: '',
				password: '',
				co_password: '',
				profile_image: '',
				selectedFile: null,
			})
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}




	const [bodyAnalysisData, setBodyAnalysisData] = useState<any>({
		firstName: '',
		lastName: '',
		email: '',
		mobile: '',
		country_code: '',
		gender: '',
		birthdate: '',
		goal_title: '',
		workout_start: '',
		workout_end: '',
		sleep_start: '',
		sleep_end: '',
		typicalDay: '',
		medical_condition: '',
		physical_activity: '',
		profile_image: '',
		target: '',
		selectedFile: null as File | null,
	})
	const [composition, setComposition] = useState<any>({
		weight1: '',
		weight45: '',
		weight90: '',
		smm1: '',
		smm45: '',
		smm90: '',
		pbf1: '',
		pbf45: '',
		pbf90: '',
		selectedFile: null as File | null,
	})
	const [blood, setBlood] = useState<any>({
		food_preference: '',
		unhealthyHabits: '',
		stressAndTension: '',
		sugarSaltIntake: '',
		anyMedicineStart: '',
		systolic: '',
		diastolic: '',
		working: '',
		sleep: '',
		selectedFile: null as File | null,
	})

	const [bodyCheckup, setBodyCheckup] = useState<any>({
		medical_condition: [
			{ Thyroid: { selected: false }, label: 'Thyroid', img: 'thyroid.png' },
			{ Pcos: { selected: false }, label: 'Pcos', img: 'pcos.png' },
			{ Diabetes: { selected: false }, label: 'Diabetes', img: 'diebetes.png' },
			{ ChestXray: { selected: false }, label: 'Chest X-ray', img: 'x-ray_3609786.png' },
			{ ECG: { selected: false }, label: 'ECG', img: 'ekg_5873285.png' },
			{ CardiacTest: { selected: false }, label: 'Cardiac Test', img: 'medical-diagnostics_9599477.png' },
			{ BloodAndSwabTests: { selected: false }, label: 'Blood and swab tests', img: 'test_4597063.png' },
			{ LiverandKidney: { selected: false }, label: 'Liver Tests', img: 'LiverandKidney.png' },
			{ BloodPressure: { selected: false }, label: 'Blood Pressure', img: 'blood_pressure.png' },
			{ BodyMassIndex: { selected: false }, label: 'Body Mass Index (BMI)', img: 'body_mass_index.png' },
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
			{ Vegetarian: { selected: false }, label: 'Vegetarian', img: 'Vegetarian.png' },
			{ NonVegetarian: { selected: false }, label: 'Non Vegetarian', img: 'free-non-veg-food.png' },
			{ Vegan: { selected: false }, label: 'Vegan', img: 'Vegan.png' },
			{ Eggiterian: { selected: false }, label: 'Eggiterian', img: 'Eggiterian.png' },
		],
		otherMedicalCondition: '',
		otherFoodAllergy: '',
		otherPreviousInjury: '',
		selectedFile: null as File | null,
	});

	const [selectedCards, setSelectedCards] = useState<any[]>([]);
	const [isOtherSelected, setIsOtherSelected] = useState(false);
	const [isOtherFoodAllergySelected, setIsOtherFoodAllergySelected] = useState(false);
	const [isOtherPreviousInjurySelected, setIsOtherPreviousInjurySelected] = useState(false);
	const [isOtherFoodPreferenceSelected, setIsOtherFoodPreferenceSelected] = useState(false);

	const handleBodyAnalysisInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setBodyAnalysisData((prevData: any) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}))
		} else {
			setBodyAnalysisData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleBodyCheckupInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target;

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0];
			setBodyCheckup((prevData: any) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
			}));
		} else {
			if (name === 'otherMedicalCondition') {
				setIsOtherSelected(value.length > 0);
			}
			if (name === 'otherFoodAllergy') {
				setIsOtherFoodAllergySelected(value.length > 0);
			}
			if (name === 'otherPreviousInjury') {
				setIsOtherPreviousInjurySelected(value.length > 0);
			}
			if (name === 'otherFoodPreference') {
				setIsOtherFoodPreferenceSelected(value.length > 0);
			}
			setBodyCheckup((prevData: any) => ({
				...prevData,
				[name]: value,
			}));
		}
	};

	const handleCompositionChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		setComposition((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}
	const handleBodyConditionChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		setComposition((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}
	const handleBloodPressureChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		setBlood((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}



	const handleCardClick = (category: any, item: any) => {
		const key = Object.keys(item)[0];
		const cardId = `${category}_${key}`;

		// Toggle selected state of the clicked card
		const updatedBodyCheckup = { ...bodyCheckup };
		const categoryItems = updatedBodyCheckup[category];

		// Check if categoryItems is defined before accessing .find()
		if (categoryItems) {
			const selectedItem = categoryItems.find((card: any) => Object.keys(card)[0] === key);

			if (selectedItem) {
				// Create a new object for immutability
				const updatedSelectedItem = { ...selectedItem };
				updatedSelectedItem[key].selected = !updatedSelectedItem[key].selected;

				// Find index of the selected item
				const index = categoryItems.findIndex((card: any) => Object.keys(card)[0] === key);

				// Update the categoryItems array immutably
				updatedBodyCheckup[category] = [
					...categoryItems.slice(0, index),
					updatedSelectedItem,
					...categoryItems.slice(index + 1),
				];

				// Update selectedCards state
				if (updatedSelectedItem[key].selected) {
					setSelectedCards([...selectedCards, cardId]);
				} else {
					setSelectedCards(selectedCards.filter((id) => id !== cardId));
				}

				// Update state with immutability
				setBodyCheckup({ ...updatedBodyCheckup });
			}
		}
	};


	const handleAddBodyAnalysisButtonClick = () => {
		if (selectedCards.length > 0) {
			const selectedCardLabels = selectedCards.map((cardId) => {
				const [category, key] = cardId.split('_');
				const selectedCard = bodyCheckup[category].find((card: any) => Object.keys(card)[0] === key);
				return selectedCard ? selectedCard.label : '';
			});

			toast.success(`Selected Cards: ${selectedCardLabels.join(', ')}`);
		} else {
			toast.error('Please select at least one card before adding.');
		}
	};


	const renderCheckboxes = (category: any, items: any) => {
		return items.map((item: any, index: any) => {
			const key = Object.keys(item)[0];
			const cardId = `${category}_${key}`;

			if (category !== 'food_preference' && index === items.length - 1) {
				const isOtherSelectedCategory =
					category === 'medical_condition' ? isOtherSelected :
						category === 'food_allergy' ? isOtherFoodAllergySelected :
							isOtherPreviousInjurySelected;
				const otherName =
					category === 'medical_condition' ? 'otherMedicalCondition' :
						category === 'food_allergy' ? 'otherFoodAllergy' :
							'otherPreviousInjury';

				return (
					<React.Fragment key={`fragment_${index}`}>
						<div className='col-md-3 my-2' onClick={() => handleCardClick(category, item)}>
							<input
								type='checkbox'
								className='btn-check'
								name={category.toLowerCase()}
								value={key.toLowerCase()}
								id={`${key.toLowerCase()}_${index}`}
								checked={selectedCards.includes(cardId)}
								onChange={() => handleCardClick(category, item)}
							/>
							<label
								className={`btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center ${selectedCards.includes(cardId) ? 'active' : ''}`}
								htmlFor={`${key.toLowerCase()}_${index}`}
							>
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

						<div className="col-md-3 my-2" key="other_input">
							<label
								className={`btn btn-outline btn-outline-dashed py-4 btn-outline-default d-flex align-items-center ${isOtherSelectedCategory ? 'border-primary' : ''}`}
								htmlFor="other"
							>
								<div className='d-block fw-bold text-start' style={{ width: '100%' }}>
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
				);
			}

			return (
				<div className='col-md-3 my-2' key={index} onClick={() => handleCardClick(category, item)}>
					<input
						type='checkbox'
						className='btn-check'
						name={category.toLowerCase()}
						value={key.toLowerCase()}
						id={`${key.toLowerCase()}_${index}`}
						checked={item[key].selected}
						onChange={() => handleCardClick(category, item)}
					/>
					<label
						className={`btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center ${item[key].selected ? 'active' : ''}`}
						htmlFor={`${key.toLowerCase()}_${index}`}
					>
						<img src={toAbsoluteUrl(`/media/body-analysis/${item.img}`)} style={{ width: '64px' }} alt={item.label} />
						<span className='d-block fw-bold mx-3 text-start'>
							<span className='text-dark fw-bolder d-block fs-4 mb-2'>{item.label}</span>
						</span>
					</label>
				</div>
			);
		});
	};

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-3 text-center'>
									<img
										alt='Photos'
										src={formData.profile_image || '/media/avatars/300-1.jpg'}
										style={{ borderRadius: '10px', width: '70%' }}
									/>
									<div>
										<button
											type='button'
											className='mt-5 px-2 py-1 mb-2 btn btn-success'
											onClick={handleFileButtonClick}>
											Upload Photo
										</button>
										<input
											type='file'
											id='fileInput'
											className='d-none'
											onChange={handleInputChange}
										/>
									</div>
									<p
										className='mt-lg-2 text-danger fs-6'
										style={{ fontWeight: '600' }}>
										Note: Photo/Image Size Limit only 1 MB
									</p>
								</div>
								<div className='col-md-9'>
									<div className='row'>
										<InputField
											placeholder='Enter First name'
											type='text'
											className='col-md-6 fv-row'
											name='firstName'
											label='First name'
											htmlFor='firstName'
											value={formData.firstName}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Enter Last name'
											type='text'
											className='col-md-6 fv-row'
											name='lastName'
											label='Last Name'
											htmlFor='Last Name'
											value={formData.lastName}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Enter Email'
											type='email'
											className='col-md-6 fv-row'
											name='email'
											label='Email'
											htmlFor='Email'
											value={formData.email}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Enter country code'
											type='text'
											className='col-md-2 fv-row'
											name='country_code'
											label='Country Code'
											htmlFor='country_code'
											value={formData.country_code}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Enter Mobile No.'
											type='number'
											className='col-md-4 fv-row'
											name='mobile'
											label='Mobile'
											htmlFor='Mobile'
											value={formData.mobile}
											onChange={handleInputChange}
										/>
										<SelectField
											className='col-md-6 fv-row mb-7'
											label='Gender'
											name='gender'
											value={formData.gender}
											onChange={handleInputChange}
											htmlFor='gender'
											options={['MALE', 'FEMALE', 'OTHER']}
										/>
										<InputField
											placeholder='Enter Date'
											type='date'
											className='col-md-6 fv-row'
											name='birth_date'
											label='Birth Date'
											htmlFor='birth_date'
											value={formData.birth_date}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Enter Password'
											type={showPassword ? 'text' : 'password'}
											className='col-md-6 fv-row'
											name='password'
											label='Password'
											htmlFor='password'
											value={formData.password}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Confirm Password'
											type={showPassword ? 'text' : 'password'}
											className='col-md-6 fv-row'
											name='co_password'
											label='Confirm Password'
											htmlFor='co_password'
											value={formData.co_password}
											onChange={handleInputChange}
										/>
										<div className='col'></div>
										<div className='col-md-3 fv-row mb-7'>
											<TableButton
												action='add'
												onClick={handleAddButtonClick}
												text={isSubmitting ? 'Please wait, Adding User...' : 'Add User'}
												showIcon={false}
												disabled={isSubmitting}
												className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<>
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
							className='collapse'>
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
												value={bodyAnalysisData.firstName}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Last name'
												type='text'
												className='col-md-6 fv-row'
												name='lastName'
												label='Last Name'
												htmlFor='lastName'
												value={bodyAnalysisData.lastName}
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
												placeholder='Enter Test Date'
												type='date'
												className='col-md-6 fv-row'
												name='testDate'
												label='Test Date'
												htmlFor='testDate'
												value={bodyAnalysisData.testDate}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Test Time'
												type='time'
												className='col-md-6 fv-row'
												name='testTime'
												label='Test Time'
												htmlFor='testTime'
												value={bodyAnalysisData.testTime}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Weight'
												type='text'
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
												name='smm'
												label='SMM (Skeletal Muscle Mass in %)'
												htmlFor='smm'
												value={bodyAnalysisData.smm}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Ideal Body Weight (in %)'
												type='number'
												className='col-md-6 fv-row'
												name='idealBodyWeight'
												label='Ideal Body Weight (in %)'
												htmlFor='idealBodyWeight'
												value={bodyAnalysisData.idealBodyWeight}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter BMI (in %)'
												type='number'
												className='col-md-6 fv-row'
												name='bmi'
												label='BMI (Body Mass Index in %)'
												htmlFor='bmi'
												value={bodyAnalysisData.bmi}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter PBF (in %)'
												type='number'
												className='col-md-6 fv-row'
												name='pbf'
												label='PBF (Percent Body Fat in %)'
												htmlFor='pbf'
												value={bodyAnalysisData.pbf}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Muscle in Arms (in %)'
												type='number'
												className='col-md-6 fv-row'
												name='muscleArms'
												label='Muscle in Arms (in %)'
												htmlFor='muscleArms'
												value={bodyAnalysisData.muscleArms}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Muscle in Trunk (in %)'
												type='number'
												className='col-md-6 fv-row'
												name='muscleTrunk'
												label='Muscle in Trunk (in %)'
												htmlFor='muscleTrunk'
												value={bodyAnalysisData.muscleTrunk}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Muscle in Legs (in %)'
												type='number'
												className='col-md-6 fv-row'
												name='muscleLegs'
												label='Muscle in Legs (in %)'
												htmlFor='muscleLegs'
												value={bodyAnalysisData.muscleLegs}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Fat in Arms (in %)'
												type='number'
												className='col-md-6 fv-row'
												name='fatArms'
												label='Fat in Arms (in %)'
												htmlFor='fatArms'
												value={bodyAnalysisData.fatArms}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Fat in Trunk (in %)'
												type='number'
												className='col-md-6 fv-row'
												name='fatTrunk'
												label='Fat in Trunk (in %)'
												htmlFor='fatTrunk'
												value={bodyAnalysisData.fatTrunk}
												onChange={handleBodyAnalysisInputChange}
											/>
											<InputField
												placeholder='Enter Fat in Legs (in %)'
												type='number'
												className='col-md-6 fv-row'
												name='fatLegs'
												label='Fat in Legs (in %)'
												htmlFor='fatLegs'
												value={bodyAnalysisData.fatLegs}
												onChange={handleBodyAnalysisInputChange}
											/>
										</div>
									</div>
									<div className='col-md-12 mt-5 mb-7'>
										<div className='d-flex justify-content-end'>
											<TableButton
												action='add'
												// onClick={handleUpdateButtonClick}
												text={'Add'}
												backgroundDark={true}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

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
																type='text'
																className='fv-row'
																name='Weight1'
																label=''
																htmlFor='Weight1'
																value={composition.Weight1}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</td>
														<td className='p-0'>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='Weight45'
																label=''
																htmlFor='Weight45'
																value={composition.Weight45}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</td>
														<td className='p-0'>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='Weight90'
																label=''
																htmlFor='Weight90'
																value={composition.Weight90}
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
																type='text'
																className='fv-row'
																name='smm1'
																label=''
																htmlFor='smm1'
																value={composition.smm1}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</td>
														<td className='p-0'>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='smm45'
																label=''
																htmlFor='smm45'
																value={composition.smm45}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</td>
														<td className='p-0'>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='smm90'
																label=''
																htmlFor='smm90'
																value={composition.smm90}
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
																type='text'
																className='fv-row'
																name='pbf1'
																label=''
																htmlFor='pbf1'
																value={composition.pbf1}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</td>
														<td className='p-0'>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='pbf45'
																label=''
																htmlFor='pbf45'
																value={composition.pbf45}
																onChange={handleCompositionChange}
																showLabel={false}
																marginRemove={true}
															/>
														</td>
														<td className='p-0'>
															<InputField
																placeholder=''
																type='text'
																className='fv-row'
																name='pbf90'
																label=''
																htmlFor='pbf90'
																value={composition.pbf90}
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
											// onClick={handleUpdateButtonClick}
											text={'Add'}
											backgroundDark={true}
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
											{[
												{ name: 'Weight', values: ['Weight1', 'Weight45', 'Weight90'] },
												{ name: 'SMM (Skeletal Muscle Mass)', values: ['smm1', 'smm45', 'smm90'] },
												{ name: 'PBF (Percent Body Fat)', values: ['pbf1', 'pbf45', 'pbf90'] },
											].map((item, index) => (
												<div
													className='col-12 mb-4'
													key={index}>
													<div
														className='card border'
														style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 12px !important' }}>
														<div
															className='card-header'
															style={{ minHeight: '0px' }}>
															<h5 className='mt-3'>{item.name}</h5>
														</div>
														<div className='card-body'>
															<div className='row'>
																{item.values.map((value, idx) => (
																	<div
																		className='col-12 mb-2'
																		key={idx}>
																		<label
																			htmlFor={value}
																			className='form-label'>{`Day ${
																			idx === 0 ? 1 : idx * 45
																		}`}</label>
																		<InputField
																			placeholder=''
																			type='text'
																			className='fv-row'
																			name={value}
																			label=''
																			htmlFor={value}
																			value={composition[value]}
																			onChange={handleCompositionChange}
																			showLabel={false}
																			marginRemove={true}
																		/>
																	</div>
																))}
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
								<div className='col-md-12 mt-5 mb-7'>
									<div className='d-flex justify-content-end'>
										<TableButton
											action='add'
											text={'Add'}
											backgroundDark={true}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

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
										<h2 className='fw-bolder d-flex align-items-center text-dark'>
											Previous Injury
										</h2>
									</div>
									<div className='row'>
										{renderCheckboxes('previous_injury', bodyCheckup.previous_injury)}
									</div>
								</div>

								<div className='w-100 my-5'>
									<div className='pb-5'>
										<h2 className='fw-bolder d-flex align-items-center text-dark'>
											Food Preference
										</h2>
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
										onClick={handleAddBodyAnalysisButtonClick}
										text='Add'
										backgroundDark={true}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

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
										className={`col-md-12 fv-row  ${blood.unhealthyHabits ? 'mb-0' : 'mb-7'}`}
										label='food preference'
										name='unhealthyHabits'
										value={blood.unhealthyHabits}
										onChange={handleBloodPressureChange}
										htmlFor='gender'
										options={['Breakfast', 'Lunch', 'Dinner']}
										marginRemove={true}
									/>
									{blood.unhealthyHabits ? (
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
									<SelectField
										className='col-md-6 fv-row mb-7'
										label='Unhealthy Habits'
										name='unhealthyHabits'
										value={blood.unhealthyHabits}
										onChange={handleBloodPressureChange}
										htmlFor='gender'
										options={['Smoke', 'Alcohol', 'Drug', 'Sugar intake']}
									/>
									<InputField
										placeholder='Enter First name'
										type='text'
										className='col-md-6 fv-row'
										label='Stress and Tension'
										name='stressAndTension'
										htmlFor='stressAndTension'
										value={blood.stressAndTension}
										onChange={handleBloodPressureChange}
									/>
									<div className='col-md-6 d-flex flex-wrap'>
										<div className='col-12 mb-md-0 mb-4'>
											<b className='d-block fw-bold'>Sugar and Salt Intake</b>
										</div>
										<div className='col-6 mb-md-10 mb-4'>
											<input
												type='checkbox'
												id='sugarIntake'
												name='sugarIntake'
												className='form-check-input'
												style={{ backgroundSize: 'auto' }}
												value={blood.sugarIntake}
												onChange={handleBloodPressureChange}
											/>
											<label
												className='mx-2'
												htmlFor='sugarIntake'>
												Sugar Intake
											</label>
										</div>
										<div className='col-6'>
											<input
												type='checkbox'
												name='saltIntake'
												id='saltIntake'
												className='form-check-input '
												style={{ backgroundSize: 'auto' }}
												value={blood.saltIntake}
												onChange={handleBloodPressureChange}
											/>
											<label
												className='mx-2'
												htmlFor='saltIntake'>
												Salt Intake
											</label>
										</div>
									</div>
									<InputField
										placeholder='Enter First name'
										type='text'
										className='col-md-6 fv-row'
										label='Running Medicine'
										name='runningMedicine'
										htmlFor='runningMedicine'
										value={blood.runningMedicine}
										onChange={handleBloodPressureChange}
									/>
									<SelectField
										className='col-md-6 fv-row mb-7'
										label='Systolic Blood Pressure'
										name='systolic'
										value={blood.systolic}
										onChange={handleBloodPressureChange}
										htmlFor='gender'
										options={['<120', '120-129', '130-139', '>140']}
									/>
									<SelectField
										className='col-md-6 fv-row mb-7'
										label='Diastolic Blood Pressure'
										name='diastolic'
										value={blood.diastolic}
										onChange={handleBloodPressureChange}
										htmlFor='gender'
										options={['<80', '80-84', '85-89', '>90']}
									/>
									<InputField
										placeholder='Enter Test Time'
										type='time'
										className='col-md-6 fv-row'
										name='working'
										label='Working Hours'
										htmlFor='testTime'
										value={bodyAnalysisData.working}
										onChange={handleBloodPressureChange}
									/>
									<InputField
										placeholder='Enter Test Time'
										type='time'
										className='col-md-6 fv-row'
										name='sleep'
										label='Sleep Hours'
										htmlFor='testTime'
										value={bodyAnalysisData.sleep}
										onChange={handleBloodPressureChange}
									/>
								</div>
								<div className='col-md-12 mt-5 mb-7'>
									<div className='d-flex justify-content-end'>
										<TableButton
											action='add'
											// onClick={handleUpdateButtonClick}
											text={'Add'}
											backgroundDark={true}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

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
															id='sugarIntake'
															name='sugarIntake'
															className='me-3 form-check-input'
															value={blood.sugarIntake}
															style={{ backgroundSize: 'auto' }}
															onChange={handleBloodPressureChange}
														/>
														80-100 mg/dl
													</td>
													<td>
														<input
															type='checkbox'
															id='sugarIntake'
															name='sugarIntake'
															className='me-3 form-check-input'
															value={blood.sugarIntake}
															style={{ backgroundSize: 'auto' }}
															onChange={handleBloodPressureChange}
														/>
														170-200 mg/dl
													</td>
													<td>
														<input
															type='checkbox'
															id='sugarIntake'
															name='sugarIntake'
															className='me-3 form-check-input'
															value={blood.sugarIntake}
															style={{ backgroundSize: 'auto' }}
															onChange={handleBloodPressureChange}
														/>
														120-140 mg/dl
													</td>
												</tr>
												<tr>
													<td>Pre Diabetic</td>
													<td>
														<input
															type='checkbox'
															id='sugarIntake'
															name='sugarIntake'
															className='me-3 form-check-input'
															value={blood.sugarIntake}
															style={{ backgroundSize: 'auto' }}
															onChange={handleBloodPressureChange}
														/>
														101-125 mg/dl
													</td>
													<td>
														<input
															type='checkbox'
															id='sugarIntake'
															name='sugarIntake'
															className='me-3 form-check-input'
															value={blood.sugarIntake}
															style={{ backgroundSize: 'auto' }}
															onChange={handleBloodPressureChange}
														/>
														190-230 mg/dl
													</td>
													<td>
														<input
															type='checkbox'
															id='sugarIntake'
															name='sugarIntake'
															className='me-3 form-check-input'
															value={blood.sugarIntake}
															style={{ backgroundSize: 'auto' }}
															onChange={handleBloodPressureChange}
														/>
														140-160 mg/dl
													</td>
												</tr>
												<tr>
													<td>Diabetic</td>
													<td>
														<input
															type='checkbox'
															id='sugarIntake'
															name='sugarIntake'
															className='me-3 form-check-input'
															value={blood.sugarIntake}
															style={{ backgroundSize: 'auto' }}
															onChange={handleBloodPressureChange}
														/>
														126+ mg/dl
													</td>
													<td>
														<input
															type='checkbox'
															id='sugarIntake'
															name='sugarIntake'
															className='me-3 form-check-input'
															value={blood.sugarIntake}
															style={{ backgroundSize: 'auto' }}
															onChange={handleBloodPressureChange}
														/>
														220-300 mg/dl
													</td>
													<td>
														<input
															type='checkbox'
															id='sugarIntake'
															name='sugarIntake'
															className='me-3 form-check-input'
															value={blood.sugarIntake}
															style={{ backgroundSize: 'auto' }}
															onChange={handleBloodPressureChange}
														/>
														200+ mg/dl
													</td>
												</tr>
											</tbody>
										</table>
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
											{[
												{ name: 'Normal', values: ['fasting', 'justAte', 'threeHoursAfter'] },
												{
													name: 'Pre Diabetic',
													values: ['fastingPre', 'justAtePre', 'threeHoursAfterPre'],
												},
												{
													name: 'Diabetic',
													values: ['fastingDiabetic', 'justAteDiabetic', 'threeHoursAfterDiabetic'],
												},
											].map((item, index) => (
												<div
													className='col-12 mb-4'
													key={index}>
													<div
														className='card border shadow-sm'
														style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 12px !important' }}>
														<div
															className='card-header bg-transparent'
															style={{ minHeight: '0px' }}>
															<h5 className='card-title mt-3'>{item.name}</h5>
														</div>
														<div className='card-body'>
															<div className='row'>
																{item.values.map((value, idx) => (
																	<div
																		className='col-12 mb-2'
																		key={idx}>
																		<label
																			htmlFor={value}
																			className='form-label d-block'>
																			{idx === 0
																				? 'Fasting'
																				: idx === 1
																				? 'Just Ate'
																				: '3 Hours After Eating'}
																			:
																		</label>
																		<div className='form-check'>
																			<input
																				type='checkbox'
																				id={value}
																				name={value}
																				className='form-check-input'
																				value={value}
																				onChange={handleBloodPressureChange}
																				style={{ backgroundSize: 'auto' }}
																			/>
																			<label
																				className='form-check-label ms-2'
																				htmlFor={value}>
																				{idx === 0
																					? '80-100 mg/dl'
																					: idx === 1
																					? '170-200 mg/dl'
																					: '120-140 mg/dl'}
																			</label>
																		</div>
																	</div>
																))}
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
								<div className='col-md-12 mt-5 mb-7'>
									<div className='d-flex justify-content-end'>
										<TableButton
											action='add'
											text={'Add'}
											backgroundDark={true}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

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
										type='checkbox'
										id='checkWork'
									/>
									<label
										className='form-check-label'
										style={{ backgroundSize: 'auto' }}
										htmlFor='checkWork'>
										Children (ages 6-15) 70-100 Beats Per Minute
									</label>
								</div>
								<div className='form-check mb-3'>
									<input
										className='form-check-input'
										type='checkbox'
										id='checkSleep'
									/>
									<label
										className='form-check-label'
										style={{ backgroundSize: 'auto' }}
										htmlFor='checkSleep'>
										Adults (Age 18 and over) 60-100 Beats Per Minute
									</label>
								</div>
								<div className='col-md-12 mt-5 mb-7'>
									<div className='d-flex justify-content-end'>
										<TableButton
											action='add'
											// onClick={handleUpdateButtonClick}
											text={'Add'}
											backgroundDark={true}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		</>
	)
}

export { AddUser }
