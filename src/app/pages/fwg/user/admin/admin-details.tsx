import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../../_metronic/helpers'
import InputField from '../../../../components/InputField'
import {
	ChangeAdminUserPassword,
	GetAdminUsers,
	SetAdminPermission,
} from '../../../../Functions/FWG'
import { PageTitle } from '../../../../../_metronic/layout/core'
import TableButton from '../../../../components/TableButton'

const AdminDetails = () => {
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
	const [permission, setPermission] = useState<any>([])
	const [showPassword, setShowPassword] = useState(false)

	const [changePassword, setChangePassword] = useState({
		newPassword: '',
		password: '',
	})

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
			const response: FWG_APIResponse = await GetAdminUsers()
			const data = response.data
			if (Array.isArray(data)) {
				const admin: FWG_APIResponse | any = data.find((admin: any) => admin._id === admin_id)
				if (admin) {
					setAdminData(admin)
					setPermission(admin.access_list)
				} else {
					toast.error('Admin not found')
				}
			} else {
				toast.error('Unexpected data format')
			}
		} catch (error) {
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

			await ChangeAdminUserPassword(payload)

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

	const handleUpdatePermissions = async () => {
		try {
			await SetAdminPermission({ access_list: permission, admin_user_id: admin_id })
			toast.success('Permissions updated successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { id, checked } = event.target
		setPermission((prevPermissions: any) => {
			if (checked) {
				return [...prevPermissions, id]
			} else {
				return prevPermissions.filter((permission: any) => permission !== id)
			}
		})
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Admin Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10 mb-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-12'>
									<div className='row'>
										<InputField
											className='col-md-4 fv-row'
											label='Full name'
											placeholder='Full name'
											type='text'
											name='name'
											htmlFor='name'
											readOnly
											value={adminData.full_name}
											disabled
										/>
										<InputField
											className='col-md-4 fv-row'
											label='Email'
											placeholder='Email'
											type='email'
											name='email'
											htmlFor='email'
											readOnly
											value={adminData.email}
											disabled
										/>
										<InputField
											className='col-md-4 fv-row'
											label='Mobile no.'
											placeholder='Mobile no.'
											type='number'
											name='mobile'
											htmlFor='mobile'
											readOnly
											value={adminData.mobile}
											disabled
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className='card py-10 mb-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-12'>
									<div className='w-100 my-5'>
										<div className='pb-5'>
											<h2 className='fw-bolder d-flex align-items-center text-dark'>
												Update Permission
											</h2>
										</div>
										<div className='fv-row'>
											<div className='row'>
												{[
													{ id: 'diet', label: 'Diet', img: 'salad.png' },
													{ id: 'diet_assign', label: 'Diet Assign', img: 'nutrition-plan.png' },
													{ id: 'exercise_plan', label: 'Exercise Plan', img: 'report.png' },
													{ id: 'exercise_assign', label: 'Exercise Assign', img: 'trainer.png' },
												].map((item) => (
													<div
														className='col-md-3'
														key={item.id}>
														<input
															type='checkbox'
															className='btn-check'
															id={item.id}
															checked={permission.includes(item.id)}
															onChange={handleCheckboxChange}
														/>
														<label
															className='btn btn-outline btn-outline-dashed btn-outline-default p-7 d-flex align-items-center mb-10'
															htmlFor={item.id}>
															<img
																src={toAbsoluteUrl(`/media/images/${item.img}`)}
																style={{ width: '64px' }}
																alt={item.label}
															/>
															<span className='d-block fw-bold mx-3 text-start'>
																<span className='text-dark fw-bolder d-block fs-4 mb-2'>
																	{item.label}
																</span>
															</span>
														</label>
													</div>
												))}
												<div className='col-12 text-end'>
													<TableButton
														action="edit"
														onClick={() => handleUpdatePermissions()}
														text="Update Permission"
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
									<h1 className='fw-bold text-dark fs-1 mb-10 '>
										Reset Password
									</h1>
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
				</div>
			</div>
		</>
	)
}

export { AdminDetails }
