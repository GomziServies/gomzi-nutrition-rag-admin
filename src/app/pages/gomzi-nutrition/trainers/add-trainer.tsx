/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { CreateTrainer } from '../../../Functions/FGGroup/Trainer'
import '../common-management.css'

const GomziNutritionAddTrainer = () => {
	const navigate = useNavigate()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [trainerData, setTrainerData] = useState({
		name: '',
		city: '',
		email: '',
		mobile: '',
		company: '',
		address: '',
		profile_image: '',
		birthdate: '',
		password: '',
		selectedFile: null as File | null,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, id } = event.target
		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setTrainerData((prevData) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
				editImage: true,
			}))
		} else {
			setTrainerData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleAddButtonClick = async () => {
		try {
			setIsSubmitting(true)

			let imgUrl = ''

			if (trainerData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([trainerData.selectedFile], {
					directory: 'trainers',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Trainer image uploaded successfully')
			}

			const payload = {
				name: trainerData.name,
				city: trainerData.city,
				email: trainerData.email,
				mobile: trainerData.mobile,
				company: trainerData.company,
				address: trainerData.address,
				birthdate: trainerData.birthdate,
				profile_image: imgUrl,
				password: trainerData.password,
			}

			await CreateTrainer(payload)

			toast.success('Trainer added successfully')
			setIsSubmitting(false)

			navigate('/rag/trainer-list')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Add Trainer</PageTitle>

			<nav className='gz-mgmt-breadcrumb'>
				<a href='/rag/dashboard'>Dashboard</a>
				<span>/</span>
				<a href='/rag/trainer-list'>Trainers</a>
				<span>/</span>
				<span>New Trainer</span>
			</nav>

			<div className='gz-mgmt-header mb-6'>
				<div>
					<h1 className='gz-mgmt-title'>Onboard New Trainer</h1>
					<p className='gz-mgmt-subtitle'>
						Register fitness coach identity, studio or gym affiliations, contact details, and account credentials
					</p>
				</div>
				<button
					type='button'
					className='gz-mgmt-btn-secondary'
					onClick={() => navigate('/rag/trainer-list')}
				>
					<i className='bi bi-arrow-left me-2'></i>
					Back to Trainers
				</button>
			</div>

			<div className='gz-mgmt-form-card mb-6'>
				{/* Section 1: Profile & Photo */}
				<div className='gz-mgmt-section-header mb-6'>
					<div className='gz-mgmt-section-badge'>1</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Trainer Profile & Photo</h3>
						<p className='gz-mgmt-section-subtitle'>Personal identification and portrait image for member display</p>
					</div>
				</div>

				<div className='row g-6 mb-8'>
					<div className='col-md-3 text-center'>
						<div className='d-flex flex-column align-items-center'>
							<img
								alt='Trainer Photo'
								src={trainerData.profile_image || '/media/avatars/300-1.jpg'}
								style={{
									width: '140px',
									height: '140px',
									objectFit: 'cover',
									borderRadius: '16px',
									border: '2px solid #E2E8F0',
									boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
								}}
							/>
							<button
								type='button'
								className='gz-mgmt-btn-secondary mt-4'
								style={{ padding: '8px 16px', fontSize: '13px' }}
								onClick={handleFileButtonClick}
							>
								<i className='bi bi-camera me-1'></i>
								Upload Photo
							</button>
							<input
								type='file'
								id='fileInput'
								accept='image/*'
								className='d-none'
								onChange={handleInputChange}
							/>
							<span className='fs-8 text-muted mt-2'>JPG or PNG up to 5MB</span>
						</div>
					</div>

					<div className='col-md-9'>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									placeholder='Full Name'
									type='text'
									className='col-12 fv-row'
									name='name'
									label='Trainer Full Name'
									htmlFor='name'
									value={trainerData.name}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='10-digit mobile number'
									type='number'
									className='col-12 fv-row'
									name='mobile'
									label='Mobile Number'
									htmlFor='mobile'
									value={trainerData.mobile}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Email Address'
									type='email'
									className='col-12 fv-row'
									name='email'
									label='Email Address'
									htmlFor='email'
									value={trainerData.email}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Date of Birth'
									type='date'
									className='col-12 fv-row'
									name='birthdate'
									label='Date of Birth'
									htmlFor='birthdate'
									value={trainerData.birthdate}
									onChange={handleInputChange}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Section 2: Gym & Location */}
				<div className='gz-mgmt-section-header mb-6'>
					<div className='gz-mgmt-section-badge'>2</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Affiliation & Studio Location</h3>
						<p className='gz-mgmt-section-subtitle'>Current workplace, associated gym or franchise branch, and address</p>
					</div>
				</div>

				<div className='row g-4 mb-8'>
					<div className='col-md-6'>
						<InputField
							placeholder='e.g. Gold Gym, AnyTime Fitness'
							type='text'
							className='col-12 fv-row'
							name='company'
							label='Company / Gym Affiliation'
							htmlFor='company'
							value={trainerData.company}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-6'>
						<InputField
							placeholder='City'
							type='text'
							className='col-12 fv-row'
							name='city'
							label='Operating City'
							htmlFor='city'
							value={trainerData.city}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-12'>
						<InputField
							placeholder='Complete studio/gym or residence address'
							type='text'
							className='col-12 fv-row'
							name='address'
							label='Full Address'
							htmlFor='address'
							value={trainerData.address}
							onChange={handleInputChange}
						/>
					</div>
				</div>

				{/* Section 3: Credentials */}
				<div className='gz-mgmt-section-header mb-6'>
					<div className='gz-mgmt-section-badge'>3</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Login Access & Security</h3>
						<p className='gz-mgmt-section-subtitle'>Set temporary credentials for trainer app or dashboard access</p>
					</div>
				</div>

				<div className='row g-4 mb-8'>
					<div className='col-md-6'>
						<div className='position-relative'>
							<InputField
								placeholder='Enter secure password'
								type={showPassword ? 'text' : 'password'}
								className='col-12 fv-row'
								name='password'
								label='Account Password'
								htmlFor='password'
								value={trainerData.password}
								onChange={handleInputChange}
							/>
							<button
								type='button'
								className='btn btn-icon position-absolute'
								style={{ top: '35px', right: '10px', height: '36px', width: '36px' }}
								onClick={() => setShowPassword(!showPassword)}
							>
								<i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
							</button>
						</div>
					</div>
				</div>

				{/* Action Bar */}
				<div className='d-flex justify-content-end align-items-center gap-3 pt-6 border-top'>
					<button
						type='button'
						className='gz-mgmt-btn-secondary'
						onClick={() => navigate('/rag/trainer-list')}
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<button
						type='button'
						className='gz-mgmt-btn-primary'
						onClick={handleAddButtonClick}
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<>
								<span className='spinner-border spinner-border-sm me-2' role='status'></span>
								Saving Trainer...
							</>
						) : (
							<>
								<i className='bi bi-check2-circle me-2'></i>
								Register Trainer
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export { GomziNutritionAddTrainer }
