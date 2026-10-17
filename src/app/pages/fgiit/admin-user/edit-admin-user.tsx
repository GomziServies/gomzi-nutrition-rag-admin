/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faCheck,
	faCrown,
	faEnvelope,
	faEye,
	faEyeSlash,
	faKey,
	faLock,
	faPhoneAlt,
	faSave,
	faShieldAlt,
	faTrashAlt,
	faUser,
	faUserShield,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import {
	GetAdminUsers,
	RemoveAdminUser,
	ResetPassword,
	UpdateAdmin,
} from '../../../Functions/FGGroup'
import '../../gomzi-nutrition/common-management.css'
import '../../gomzi-nutrition/products-theme.css'
import '../../gomzi-nutrition/orders-theme.css'

const EditAdminUser: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const admin_id: string | any = searchParams.get('admin_id')
	const navigate = useNavigate()

	const [adminData, setAdminData] = useState<any>({
		full_name: '',
		email: '',
		password: '',
		branch: '',
		type: '',
		mobile: '',
	})

	const [changePassword, setChangePassword] = useState({
		newPassword: '',
		password: '',
	})
	const [showPassword, setShowPassword] = useState(false)
	const [isUpdating, setIsUpdating] = useState(false)
	const [isResetting, setIsResetting] = useState(false)

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
			const response: FGGroupAPIResponse = await GetAdminUsers({ adminID: admin_id })
			setAdminData(response.data)
		} catch (error) {
			console.error('Error fetching admin data:', error)
		}
	}

	const handleUpdateButtonClick = async () => {
		try {
			setIsUpdating(true)
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
			toast.error(error.message || 'Failed to update admin')
			console.error(error)
		} finally {
			setIsUpdating(false)
		}
	}

	const updateAdminPassword = async (admin_id: string) => {
		try {
			if (!changePassword.newPassword || !changePassword.password) {
				toast.error('Please enter both password fields')
				return
			}

			if (changePassword.password !== changePassword.newPassword) {
				toast.error('Passwords do not match')
				return
			}

			setIsResetting(true)
			const payload = {
				id: admin_id,
				password: changePassword.password,
			}

			await ResetPassword(payload)

			toast.success('Admin Password Updated Successfully')
			setChangePassword({ newPassword: '', password: '' })
			fetchAdminData()
		} catch (error: any) {
			toast.error(error.message || 'Failed to update password')
			console.error(error)
		} finally {
			setIsResetting(false)
		}
	}

	useEffect(() => {
		fetchAdminData()
	}, [])

	const removeAdmin = async (admin_id: string) => {
		try {
			Swal.fire({
				title: 'Remove This Admin?',
				text: `Are you sure you want to permanently delete the admin account for "${adminData.full_name || 'this user'}"?`,
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DC2626',
				cancelButtonColor: '#71809A',
				confirmButtonText: 'Yes, Remove Admin',
				cancelButtonText: 'Cancel',
			}).then(async (result) => {
				if (result.isConfirmed) {
					const response: FGGroupAPIResponse = await RemoveAdminUser({ id: admin_id })
					if (response.status === 200) {
						toast.success('Admin removed successfully')
						navigate('/rag/admin')
					} else {
						toast.error('Failed to Remove Admin')
					}
				}
			})
		} catch (error: any) {
			console.error('Error Removing Admin:', error)
			toast.error(error.message || 'Failed to remove admin')
		}
	}

	const renderRoleBadge = (type: string) => {
		const upper = (type || '').toUpperCase()
		if (upper === 'MASTER') {
			return (
				<span className='gz-mgmt-pill purple'>
					<FontAwesomeIcon icon={faCrown} style={{ fontSize: '10px' }} />
					<span>MASTER</span>
				</span>
			)
		}
		if (upper === 'ADMIN') {
			return (
				<span className='gz-mgmt-pill info'>
					<FontAwesomeIcon icon={faShieldAlt} style={{ fontSize: '10px' }} />
					<span>ADMIN</span>
				</span>
			)
		}
		return (
			<span className='gz-mgmt-pill slate'>
				<span>{type || 'ADMIN'}</span>
			</span>
		)
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Edit Admin User</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/admin'>Admin Users</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>
					{adminData.full_name ? `Edit ${adminData.full_name}` : 'Edit Admin'}
				</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<div className='d-flex align-items-center gap-3 flex-wrap mb-1'>
						<h1 className='gz-mgmt-title'>
							{adminData.full_name ? `Edit ${adminData.full_name}` : 'Edit Admin User'}
						</h1>
						{adminData.type && renderRoleBadge(adminData.type)}
					</div>
					<p className='gz-mgmt-subtitle'>
						Update contact details, inspect role permissions, or reset administrative login credentials.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link to='/rag/admin' className='gz-mgmt-btn-secondary'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Admins</span>
					</Link>
					<button
						type='button'
						onClick={() => removeAdmin(admin_id)}
						className='gz-mgmt-btn-secondary'
						style={{ color: '#DC2626', borderColor: '#FECACA' }}
						title='Delete this administrator account'>
						<FontAwesomeIcon icon={faTrashAlt} />
						<span>Remove Admin</span>
					</button>
				</div>
			</div>

			<div style={{ maxWidth: '980px' }}>
				{/* =========================================================================
				    CARD 1: ADMINISTRATOR INFORMATION
				    ========================================================================= */}
				<div className='gz-mgmt-card mb-6'>
					<div
						className='px-6 py-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2'
						style={{ background: '#FFFFFF' }}>
						<div className='d-flex align-items-center gap-3'>
							<div
								style={{
									width: '36px',
									height: '36px',
									borderRadius: '10px',
									background: '#EFF6FF',
									color: '#2563EB',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '15px',
								}}>
								<FontAwesomeIcon icon={faUser} />
							</div>
							<div>
								<h3 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '16px' }}>
									Administrator Information
								</h3>
								<p className='fs-8 text-muted mb-0'>
									Update full name, phone number, and primary email address
								</p>
							</div>
						</div>
					</div>

					<div className='p-6 p-md-8'>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									placeholder='Enter Full Name'
									type='text'
									name='full_name'
									label='Full Name *'
									htmlFor='full_name'
									value={adminData.full_name}
									onChange={handleInputChange}
									labelMarginRemove
								/>
							</div>

							<div className='col-md-6'>
								<label
									htmlFor='type'
									className='fs-7 fw-bold mb-1 d-block'
									style={{ color: '#172B4D' }}>
									Role Type (Fixed)
								</label>
								<select
									disabled
									name='type'
									id='type'
									className='form-control form-select form-control-solid'
									value={adminData.type}
									onChange={handleInputChange}
									style={{
										height: '44px',
										backgroundColor: '#F5F7FB',
										borderColor: '#E4EAF2',
										color: '#556987',
										borderRadius: '10px',
										cursor: 'not-allowed',
										fontWeight: 600,
									}}>
									<option value='MASTER'>Master</option>
									<option value='ADMIN'>Admin</option>
									<option value='FRANCHISE'>Franchise</option>
									<option value='Store'>Store</option>
								</select>
								<span className='fs-8 text-muted mt-1 d-block'>
									Role assignments are restricted and cannot be altered here.
								</span>
							</div>

							<div className='col-md-6'>
								<InputField
									placeholder='Enter Mobile'
									type='text'
									name='mobile'
									label='Mobile Number *'
									htmlFor='mobile'
									value={adminData.mobile}
									onChange={handleInputChange}
									labelMarginRemove
								/>
							</div>

							<div className='col-md-6'>
								<InputField
									placeholder='Enter Email'
									type='email'
									name='email'
									label='Email Address *'
									htmlFor='email'
									value={adminData.email}
									onChange={handleInputChange}
									labelMarginRemove
								/>
							</div>
						</div>
					</div>

					<div
						className='px-6 py-4 d-flex justify-content-end'
						style={{ borderTop: '1px solid #EEF2F7', background: '#F8FAFD' }}>
						<button
							type='button'
							onClick={handleUpdateButtonClick}
							disabled={isUpdating}
							className='gz-mgmt-btn-primary'>
							{isUpdating ? (
								<>
									<span
										className='spinner-border spinner-border-sm me-2'
										role='status'
										aria-hidden='true'></span>
									<span>Updating Admin...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faSave} />
									<span>Update Admin Details</span>
								</>
							)}
						</button>
					</div>
				</div>

				{/* =========================================================================
				    CARD 2: SECURITY & PASSWORD RESET
				    ========================================================================= */}
				<div className='gz-mgmt-card'>
					<div
						className='px-6 py-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2'
						style={{ background: '#FFFFFF' }}>
						<div className='d-flex align-items-center gap-3'>
							<div
								style={{
									width: '36px',
									height: '36px',
									borderRadius: '10px',
									background: '#FEF2F2',
									color: '#DC2626',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '15px',
								}}>
								<FontAwesomeIcon icon={faLock} />
							</div>
							<div>
								<h3 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '16px' }}>
									Reset Account Password
								</h3>
								<p className='fs-8 text-muted mb-0'>
									Override the current password with new login credentials
								</p>
							</div>
						</div>
						<button
							type='button'
							onClick={() => setShowPassword(!showPassword)}
							className='gz-mgmt-btn-secondary'
							style={{ height: '36px', fontSize: '12.5px', padding: '0 12px' }}>
							<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
							<span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
						</button>
					</div>

					<div className='p-6 p-md-8'>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									placeholder='Enter New Password'
									type={showPassword ? 'text' : 'password'}
									name='newPassword'
									label='New Password'
									htmlFor='newPassword'
									value={changePassword.newPassword}
									onChange={handleInputPasswordChange}
									labelMarginRemove
								/>
							</div>

							<div className='col-md-6'>
								<InputField
									placeholder='Confirm New Password'
									type={showPassword ? 'text' : 'password'}
									name='password'
									label='Confirm Password'
									htmlFor='password'
									value={changePassword.password}
									onChange={handleInputPasswordChange}
									labelMarginRemove
								/>
							</div>
						</div>
					</div>

					<div
						className='px-6 py-4 d-flex justify-content-end'
						style={{ borderTop: '1px solid #EEF2F7', background: '#F8FAFD' }}>
						<button
							type='button'
							onClick={() => updateAdminPassword(admin_id)}
							disabled={isResetting}
							className='gz-mgmt-btn-primary'
							style={{ backgroundColor: '#1E3A5F' }}>
							{isResetting ? (
								<>
									<span
										className='spinner-border spinner-border-sm me-2'
										role='status'
										aria-hidden='true'></span>
									<span>Updating Password...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faKey} />
									<span>Reset Password</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export { EditAdminUser }
export default EditAdminUser
