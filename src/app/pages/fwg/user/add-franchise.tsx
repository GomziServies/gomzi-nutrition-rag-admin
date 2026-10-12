import { useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import toast from 'react-hot-toast'
import { CreateFranchiseUser, SetFranchiseUserAccess } from '../../../Functions/FWG'

const AddFranchise = () => {
	const [formData, setFormData] = useState<any>({
		franchiseType: '',
		firstName: '',
		lastName: '',
		email: '',
		mobile: '',
		password: '',
		con_password: '',
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setFormData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleAddButtonClick = async () => {
		if (
			!formData.franchiseType ||
			!formData.firstName ||
			!formData.lastName ||
			!formData.email ||
			!formData.mobile ||
			!formData.password ||
			!formData.con_password
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

		try {
			setIsSubmitting(true)

			const payload: any = {
				franchiseType: formData.franchiseType,
				first_name: formData.firstName,
				last_name: formData.lastName,
				email: formData.email,
				mobile: formData.mobile,
				password: formData.password,
			}

			await CreateFranchiseUser(payload)

			toast.success('User Created Successfully')

			setFormData({
				franchiseType: '',
				firstName: '',
				lastName: '',
				email: '',
				mobile: '',
				password: '',
				con_password: '',
			})
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Franchise</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10 mb-10'>
						<div className='card-body'>
							<div className='row justify-content-end'>
								<div className='col-12'>
									<div className='row'>
										<SelectField
											className='col-md-12 fv-row mb-7'
											label='Franchise Type'
											name='franchiseType'
											value={formData.franchiseType}
											onChange={handleInputChange}
											htmlFor='franchiseType'
											options={['Micro Franchise', 'Franchise']}
										/>
										<InputField
											placeholder='First Name'
											type='text'
											className='col-md-4 fv-row mb-7'
											name='firstName'
											label='First Name'
											htmlFor='firstName'
											value={formData.firstName}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Last Name'
											type='text'
											className='col-md-4 fv-row mb-7'
											name='lastName'
											label='Last Name'
											htmlFor='lastName'
											value={formData.lastName}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Email'
											type='text'
											className='col-md-4 fv-row mb-7'
											name='email'
											label='Email'
											htmlFor='email'
											value={formData.email}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Mobile no.'
											type='number'
											className='col-md-4 fv-row mb-7'
											name='mobile'
											label='Mobile no.'
											htmlFor='mobile'
											value={formData.mobile}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='password'
											type={showPassword ? 'text' : 'password'}
											className='col-md-4 fv-row mb-7'
											name='password'
											label='Password'
											htmlFor='password'
											value={formData.password}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='con_password'
											type={showPassword ? 'text' : 'password'}
											className='col-md-4 fv-row mb-7'
											name='con_password'
											label='Confirm Password'
											htmlFor='con_password'
											value={formData.con_password}
											onChange={handleInputChange}
										/>
									</div>
								</div>
								<div className='col-2'>
									<TableButton
										action="add"
										onClick={handleAddButtonClick}
										text={isSubmitting ? 'Please wait, franchise Feature...' : 'Add franchise'}
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
		</>
	)
}

export { AddFranchise }
