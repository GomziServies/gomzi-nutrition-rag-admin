import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { getProfile, ResetPassword, UpdateAdmin } from '../../../Functions/FGGroup'
import TableButton from '../../../components/TableButton'

const AdminProfileView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const admin_id: string | any = searchParams.get('admin_id')
	const [adminData, setAdminData] = useState<any>({
		full_name: '',
		email: '',
		password: '',
		branch: '',
		type: '',
		mobile: '',
	})
	const [showPassword, setShowPassword] = useState(false)

	const [changePassword, setChangePassword] = useState({
		newPassword: '',
		password: '',
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setAdminData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleInputPasswordChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setChangePassword((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const fetchAdminData = async () => {
		try {
			const response: FGGroupAPIResponse | any = await getProfile()
			setAdminData(response.data)
		} catch (error) {
			console.error(error)
		}
	}

	const handleUpdateButtonClick = async () => {
		try {
			const payload = {
				full_name: adminData.full_name,
				mobile: adminData.mobile,
				email: adminData.email,
				id: admin_id,
			}

			await UpdateAdmin(payload)

			toast.success('Admin Updated Successfully')
			fetchAdminData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const updateAdminPassword = async (admin_id: string) => {
		try {
			if (changePassword.password !== changePassword.newPassword) {
				toast.error('Passwords do not match')
				return
			}

			const payload = {
				id: admin_id,
				password: changePassword.password,
			}

			await ResetPassword(payload)

			toast.success('Admin Password Updated Successfully')
			fetchAdminData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	useEffect(() => {
		fetchAdminData()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Admin View</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card pt-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-12'>
									<div className='row'>
										<InputField
											placeholder='Enter Full Name'
											type='text'
											className='col-6 fv-row mb-7'
											name='full_name'
											label='Full Name'
											htmlFor='full_name'
											value={adminData.full_name}
											onChange={handleInputChange}
										/>
										<div className='col-md-6 fv-row mb-7'>
											<label
												htmlFor='type'
												className='required fw-bold fs-6 mb-5'>
												Type
											</label>
											<select
												disabled
												name='type'
												id='type'
												className='form-control form-select form-control-solid mb-3 mb-lg-0'
												value={adminData.type}
												onChange={handleInputChange}>
												<option value='MASTER'>Master</option>
												<option value='ADMIN'>Admin</option>
												<option value='FRANCHISE'>Franchise</option>
											</select>
										</div>
										<InputField
											placeholder='Enter Mobile'
											type='text'
											className='col-md-6 fv-row mb-7'
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
										<div className='col-md-4 fv-row mb-7'>
											<TableButton
												action="edit"
												onClick={() => handleUpdateButtonClick()}
												text="Update Admin"
												backgroundDark={true}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className='row mt-10 mb-10'>
				<div className='col-12 mt-3'>
					<div className='card pt-10'>
						<div className='card-body'>
							<h1 className='fw-bold text-dark fs-1 mb-10 '>Reset Password</h1>
							<div className='row'>
								<div className='col-12'>
									<div className='row'>
										<InputField
											placeholder='Enter New Password'
											type={showPassword ? 'text' : 'password'}
											className='col-12 fv-row mb-7'
											name='newPassword'
											label='New Password'
											htmlFor='newPassword'
											value={changePassword.newPassword}
											onChange={handleInputPasswordChange}
										/>
										<InputField
											placeholder='Enter Password'
											type={showPassword ? 'text' : 'password'}
											className='col-12 fv-row mb-7'
											name='password'
											label='Confirm Password'
											htmlFor='password'
											value={changePassword.password}
											onChange={handleInputPasswordChange}
										/>
										<div className='col-md-3 fv-row mb-7'>
											<TableButton
												action="edit"
												onClick={() => updateAdminPassword(admin_id)}
												text="Reset Password"
												showIcon={false}
												backgroundDark={true}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* <AddAuthApp /> */}
		</>
	)
}

export { AdminProfileView }
