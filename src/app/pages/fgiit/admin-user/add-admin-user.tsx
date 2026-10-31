/* eslint-disable */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faEye,
	faEyeSlash,
	faKey,
	faLock,
	faPlus,
	faShieldAlt,
	faUser,
	faUserShield,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { CreateAdmin } from '../../../Functions/FGGroup'
import '../../gomzi-nutrition/common-management.css'
import '../../gomzi-nutrition/products-theme.css'
import '../../gomzi-nutrition/orders-theme.css'

const AddAdminUser: React.FC = () => {
	const [adminData, setAdminData] = useState({
		name: '',
		email: '',
		password: '',
		branch: '',
		type: 'Admin',
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

			if (adminData.type === 'Franchise') {
				setIsSubmitting(false)
				return Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'Please select branch',
					confirmButtonColor: '#172B4D',
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
		} catch (error: any) {
			toast.error(error?.message || 'Error Creating Admin')
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Add Admin</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/admin'>Admin Users</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Add Admin</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Add New Administrator</h1>
					<p className='gz-mgmt-subtitle'>
						Set up login credentials, contact info, and assign system administrative roles.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link to='/rag/admin' className='gz-mgmt-btn-secondary'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Admins</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    FORM CARD
			    ========================================================================= */}
			<div className='gz-mgmt-card' style={{ maxWidth: '980px' }}>
				<form onSubmit={(e) => e.preventDefault()}>
					{/* SECTION 1: PERSONAL & CONTACT INFORMATION */}
					<div className='p-6 p-md-8 border-bottom'>
						<div className='d-flex align-items-center gap-3 mb-6'>
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
								<h3 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '16.5px' }}>
									Personal & Contact Details
								</h3>
								<p className='fs-8 text-muted mb-0'>
									Administrator profile identification and communication details
								</p>
							</div>
						</div>

						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									placeholder='e.g., Harsh Patel'
									type='text'
									name='name'
									label='Full Name *'
									htmlFor='name'
									value={adminData.name}
									onChange={handleInputChange}
									required
									labelMarginRemove
								/>
							</div>

							<div className='col-md-6'>
								<InputField
									placeholder='e.g., 9876543210'
									type='text'
									name='mobile'
									label='Mobile Number *'
									htmlFor='mobile'
									value={adminData.mobile}
									onChange={handleInputChange}
									required
									labelMarginRemove
								/>
							</div>

							<div className='col-md-12'>
								<InputField
									placeholder='e.g., admin@gomzilifesciences.in'
									type='email'
									name='email'
									label='Email Address (Username for login) *'
									htmlFor='email'
									value={adminData.email}
									onChange={handleInputChange}
									required
									labelMarginRemove
								/>
							</div>
						</div>
					</div>

					{/* SECTION 2: ROLE & SECURITY CREDENTIALS */}
					<div className='p-6 p-md-8'>
						<div className='d-flex align-items-center gap-3 mb-6'>
							<div
								style={{
									width: '36px',
									height: '36px',
									borderRadius: '10px',
									background: '#FAF5FF',
									color: '#9333EA',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '15px',
								}}>
								<FontAwesomeIcon icon={faLock} />
							</div>
							<div>
								<h3 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '16.5px' }}>
									Role & Authentication Security
								</h3>
								<p className='fs-8 text-muted mb-0'>
									Assign admin privilege level and set an initial secure password
								</p>
							</div>
						</div>

						<div className='row g-4'>
							<div className='col-md-6'>
								<SelectField
									label='Account Type / Role *'
									name='type'
									value={adminData.type || 'Admin'}
									onChange={handleInputChange}
									htmlFor='Type'
									options={[
										{ label: 'MASTER (Full System Access)', value: 'MASTER' },
										{ label: 'Admin (Platform Administrator)', value: 'Admin' },
										{ label: 'Trainer', value: 'Trainer' },
										{ label: 'Employee', value: 'Employee' },
										{ label: 'Store Manager', value: 'Store' },
										{ label: 'Franchise', value: 'Franchise' },
									]}
									marginRemove
								/>
							</div>

							<div className='col-md-6'>
								<label className='fs-7 fw-bold mb-1 d-block' style={{ color: '#172B4D' }}>
									Login Password *
								</label>
								<div className='position-relative'>
									<input
										type={showPassword ? 'text' : 'password'}
										name='password'
										id='password'
										placeholder='Enter secure initial password'
										value={adminData.password}
										onChange={handleInputChange}
										className='form-control form-control-solid'
										style={{
											height: '44px',
											backgroundColor: '#F8FAFD',
											borderColor: '#E4EAF2',
											borderRadius: '10px',
											fontSize: '13.5px',
											paddingRight: '45px',
											color: '#172B4D',
										}}
									/>
									<button
										type='button'
										onClick={() => setShowPassword(!showPassword)}
										style={{
											position: 'absolute',
											right: '12px',
											top: '50%',
											transform: 'translateY(-50%)',
											background: 'none',
											border: 'none',
											color: '#71809A',
											cursor: 'pointer',
											padding: '4px',
										}}
										title={showPassword ? 'Hide Password' : 'Show Password'}>
										<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
									</button>
								</div>
								<span className='fs-8 text-muted mt-1 d-block'>
									Minimum 6 characters. The administrator can change this later in Profile.
								</span>
							</div>
						</div>
					</div>

					{/* SECTION 3: ACTION CONTROLS */}
					<div
						className='px-6 py-4 d-flex justify-content-between align-items-center flex-wrap gap-3'
						style={{ borderTop: '1px solid #EEF2F7', background: '#F8FAFD' }}>
						<button
							type='button'
							onClick={() => navigate('/rag/admin')}
							className='gz-mgmt-btn-secondary'
							disabled={isSubmitting}>
							<FontAwesomeIcon icon={faArrowLeft} />
							<span>Cancel</span>
						</button>

						<button
							type='button'
							className='gz-mgmt-btn-primary'
							onClick={handleAddButtonClick}
							disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<span
										className='spinner-border spinner-border-sm me-2'
										role='status'
										aria-hidden='true'></span>
									<span>Adding Admin...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faPlus} />
									<span>Add Admin User</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export { AddAdminUser }
export default AddAdminUser
