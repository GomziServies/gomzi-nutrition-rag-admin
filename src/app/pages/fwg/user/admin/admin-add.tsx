import { useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import { CreateAdmin } from '../../../../Functions/FWG'
import TableButton from '../../../../components/TableButton'
import { useNavigate } from 'react-router-dom'

const AddUserAdmin = () => {
	const navigate = useNavigate();
	const [adminData, setAdminData] = useState({
		name: '',
		mobile: '',
		email: '',
		password: '',
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setAdminData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleAddButtonClick = async () => {
		try {
			if (
				!adminData.name ||
				!adminData.mobile ||
				!adminData.email ||
				!adminData.password
			) {
				return Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'Please fill all the fields',
				})
			}

			setIsSubmitting(true)
			const payload = {
				full_name: adminData.name,
				mobile: adminData.mobile,
				email: adminData.email,
				password: adminData.password,
			}
			await CreateAdmin(payload)

			toast.success('Admin Created Successfully')
			setIsSubmitting(false)

			navigate('/fwg/users/admin')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
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
										action="add"
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

export { AddUserAdmin }
