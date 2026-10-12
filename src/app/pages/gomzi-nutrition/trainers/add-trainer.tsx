/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { CreateTrainer } from '../../../Functions/FGGroup/Trainer'

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
		<>
			<PageTitle breadcrumbs={[]}>Add Trainer</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-2 text-center'>
									<img
										alt='Photos'
										src={trainerData.profile_image || '/media/avatars/300-1.jpg'}
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
								</div>
								<div className='col-md-10'>
									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Name'
												type='text'
												className='col-12 fv-row mb-7'
												name='name'
												label='Name'
												htmlFor='name'
												value={trainerData.name}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Mobile No.'
												type='number'
												className='col-12 fv-row mb-7'
												name='mobile'
												label='Mobile No.'
												htmlFor='mobile'
												value={trainerData.mobile}
												onChange={handleInputChange}
											/>
										</div>

										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Birth Date'
												type='date'
												className='col-12 fv-row mb-7'
												name='birthdate'
												label='Birth Date'
												htmlFor='birthdate'
												value={trainerData.birthdate}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='enter address'
												type='text'
												className='col-12 fv-row mb-7'
												name='address'
												label='Address'
												htmlFor='address'
												value={trainerData.address}
												onChange={handleInputChange}
											/>
										</div>

										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='City'
												type='text'
												className='col-12 fv-row mb-7'
												name='city'
												label='City'
												htmlFor='city'
												value={trainerData.city}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Email'
												type='text'
												className='col-12 fv-row mb-7'
												name='email'
												label='Email'
												htmlFor='email'
												value={trainerData.email}
												onChange={handleInputChange}
											/>
										</div>
										<div className='d-flex col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Password'
												type={showPassword ? 'text' : 'password'}
												className='col-12 fv-row mb-7'
												name='password'
												label='Password'
												htmlFor='password'
												value={trainerData.password}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Company/Gym'
												type='text'
												className='col-12 fv-row mb-7'
												name='company'
												label='Company/Gym'
												htmlFor='company'
												value={trainerData.company}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-12 fv-row mt-4 mb-2 d-flex justify-content-end'>
											<button
												type='button'
												className='btn btn-success mx-2 mb-4'
												onClick={handleAddButtonClick}
												disabled={isSubmitting}>
												{isSubmitting ? 'Submitting...' : 'Submit'}
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { GomziNutritionAddTrainer }
