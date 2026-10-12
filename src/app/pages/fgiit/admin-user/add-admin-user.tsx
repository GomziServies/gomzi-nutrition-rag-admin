import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { CreateAdmin } from '../../../Functions/FGGroup'

const AddAdminUser = () => {
	const [adminData, setAdminData] = useState({
		name: '',
		email: '',
		password: '',
		branch: '',
		type: '',
		mobile: '',
	})
	const [showPassword, setShowPassword] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const navigate = useNavigate()
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setAdminData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleAddButtonClick = async () => {
		try {
			setIsSubmitting(true)

			// const { error } = adminSchema.validate(adminData, { abortEarly: false })

			// if (error) {
			// 	error.details.forEach((detail) => toast.error(detail.message))
			// 	return
			// }

			if (adminData.type == 'Franchise') {
				return Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'Please select branch',
				})
			}

			const payload = {
				full_name: adminData.name,
				mobile: adminData.mobile,
				type: adminData.type,
				email: adminData.email,
				password: adminData.password,
				franchise_id: adminData.branch,
			}
			await CreateAdmin(payload)

			toast.success('Admin Created Successfully')
			setIsSubmitting(false)

			navigate('/rag/admin')
		} catch (error) {
			toast.error('Error Creating Admin')
			setIsSubmitting(false)
			console.error(error)
		}
		setIsSubmitting(true)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Admin</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card pt-10'>
						<div className='card-body'>
							<div className='row justify-content-end'>
								<div className='col-12'>
									<div className='row'>
										<InputField
											placeholder='Enter Full Name'
											type='text'
											className='col-6 fv-row mb-7'
											name='name'
											label='Full Name'
											htmlFor='name'
											value={adminData.name}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Enter Mobile No.'
											type='text'
											className='col-6 fv-row mb-7'
											name='mobile'
											label='Mobile'
											htmlFor='mobile'
											value={adminData.mobile}
											onChange={handleInputChange}
										/>
										<SelectField
											className='col-6 fv-row mb-7'
											label='Type'
											name='type'
											value={adminData.type}
											onChange={handleInputChange}
											htmlFor='Type'
											options={['Admin']}
										/>
										<InputField
											placeholder='Enter Email'
											type='text'
											className='col-6 fv-row mb-7'
											name='email'
											label='Email'
											htmlFor='email'
											value={adminData.email}
											onChange={handleInputChange}
										/>
										<InputField
											placeholder='Enter Password'
											type={showPassword ? 'text' : 'password'}
											className='col-6 fv-row mb-7'
											name='password'
											label='Password'
											htmlFor='password'
											value={adminData.password}
											onChange={handleInputChange}
										/>
									</div>
								</div>
								<div className='col-2'>
									<TableButton
										action='add'
										onClick={handleAddButtonClick}
										text={isSubmitting ? 'Please wait, Adding admin...' : 'Add Admin'}
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

export { AddAdminUser }
