/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faCrown,
	faEnvelope,
	faEye,
	faEyeSlash,
	faIdBadge,
	faKey,
	faLock,
	faPhoneAlt,
	faSave,
	faShieldAlt,
	faUser,
	faUserShield,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { getProfile, ResetPassword, UpdateAdmin } from '../../../Functions/FGGroup'
import '../../gomzi-nutrition/common-management.css'
import '../../gomzi-nutrition/products-theme.css'
import '../../gomzi-nutrition/orders-theme.css'

const AdminProfileView: React.FC = () => {
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
	const [isUpdating, setIsUpdating] = useState(false)
	const [isResetting, setIsResetting] = useState(false)

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
			console.error('Error fetching admin profile:', error)
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
			toast.error(error.message || 'Failed to update profile')
			console.error(error)
		} finally {
			setIsUpdating(false)
		}
	}

	const updateAdminPassword = async (targetId: string) => {
		try {
			if (!changePassword.newPassword || !changePassword.password) {
				toast.error('Please fill both password fields')
				return
			}

			if (changePassword.password !== changePassword.newPassword) {
				toast.error('Passwords do not match')
				return
			}

			setIsResetting(true)
			const payload = {
				id: targetId,
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

	const initials = (adminData.full_name || 'Admin')
		.split(' ')
		.map((part: string) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase()

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
			<PageTitle breadcrumbs={[]}>Admin Profile</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/admin'>Admin Users</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Admin Profile</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Administrator Profile</h1>
					<p className='gz-mgmt-subtitle'>
						Review your administrator credentials, personal contact information, and authentication security.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link to='/rag/admin' className='gz-mgmt-btn-secondary'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Admins</span>
					</Link>
				</div>
			</div>

			<div style={{ maxWidth: '980px' }}>
				{/* =========================================================================
				    PROFILE IDENTITY BANNER
				    ========================================================================= */}
				<div className='gz-mgmt-card p-6 p-md-8 mb-6' style={{ background: '#FFFFFF' }}>
					<div className='d-flex align-items-center gap-4 flex-wrap'>
						<div
							style={{
								width: '68px',
								height: '68px',
								borderRadius: '16px',
								background: '#172B4D',
								color: '#FFFFFF',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '24px',
								fontWeight: 700,
								flexShrink: 0,
								boxShadow: '0 4px 14px rgba(23, 43, 77, 0.25)',
							}}>
							{initials}
						</div>
						<div className='flex-grow-1'>
							<div className='d-flex align-items-center gap-3 flex-wrap'>
								<h2 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '22px' }}>
									{adminData.full_name || 'Administrator'}
								</h2>
								{renderRoleBadge(adminData.type)}
							</div>
							<div className='d-flex align-items-center gap-4 flex-wrap mt-2'>
								{adminData.email && (
									<span className='fs-7 text-muted d-inline-flex align-items-center gap-2'>
										<FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '12px', color: '#71809A' }} />
										<span>{adminData.email}</span>
									</span>
								)}
								{adminData.mobile && (
									<span className='fs-7 text-muted d-inline-flex align-items-center gap-2'>
										<FontAwesomeIcon icon={faPhoneAlt} style={{ fontSize: '12px', color: '#71809A' }} />
										<span>{adminData.mobile}</span>
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* =========================================================================
				    CARD 1: PERSONAL & CONTACT INFORMATION
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
									Profile & Contact Information
								</h3>
								<p className='fs-8 text-muted mb-0'>
									Manage your contact channels and profile display name
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
									label='Full Name'
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
									Account Role
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
								</select>
								<span className='fs-8 text-muted mt-1 d-block'>
									Privileges are provisioned by Master administrators.
								</span>
							</div>

							<div className='col-md-6'>
								<InputField
									placeholder='Enter Mobile'
									type='text'
									name='mobile'
									label='Mobile Number'
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
									label='Email Address'
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
									<span>Updating Profile...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faSave} />
									<span>Update Profile</span>
								</>
							)}
						</button>
					</div>
				</div>

				{/* =========================================================================
				    CARD 2: SECURITY & PASSWORD CHANGE
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
									Change Password
								</h3>
								<p className='fs-8 text-muted mb-0'>
									Update your account password with a strong combination of letters and numbers
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
									placeholder='Confirm Password'
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

export { AdminProfileView }
export default AdminProfileView
