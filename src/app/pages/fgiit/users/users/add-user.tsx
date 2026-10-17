import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import { CreateUser } from '../../../../Functions/FGGroup'
import '../../../gomzi-nutrition/common-management.css'

const AddUserForm = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		first_name: '',
		last_name: '',
		mobile: '',
		email: '',
	})
	const navigate = useNavigate()

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleAddButtonClick = async () => {
		try {
			setIsSubmitting(true)

			const payload: any = {
				first_name: formData.first_name,
				last_name: formData.last_name,
				mobile: formData.mobile,
				email: formData.email,
			}
			await CreateUser(payload)
			toast.success('User added successfully')
			setFormData({
				first_name: '',
				last_name: '',
				mobile: '',
				email: '',
			})
			setIsSubmitting(false)

			navigate('/rag/users')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Add User</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/users'>Users</Link>
				<span className='sep'>/</span>
				<span className='current'>Add User</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Add New User</h1>
					<p className='gz-mgmt-subtitle'>Create a customer profile with personal credentials and contact information</p>
				</div>
				<Link to='/rag/users' className='gz-mgmt-btn-secondary text-decoration-none'>
					Back to Directory
				</Link>
			</div>

			<div className='gz-mgmt-form-card'>
				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>1</div>
					<div>
						<h3 className='gz-mgmt-section-title'>User Credentials & Contact</h3>
						<p className='gz-mgmt-section-subtitle'>Enter essential identification and authentication details</p>
					</div>
				</div>

				<div className='row mb-6'>
					<InputField
						className='col-md-6 fv-row mb-4'
						label='First Name'
						placeholder='Enter First Name'
						type='text'
						name='first_name'
						htmlFor='first_name'
						value={formData.first_name}
						onChange={handleInputChange}
					/>
					<InputField
						className='col-md-6 fv-row mb-4'
						label='Last Name'
						placeholder='Enter Last Name'
						type='text'
						name='last_name'
						htmlFor='last_name'
						value={formData.last_name}
						onChange={handleInputChange}
					/>
					<InputField
						className='col-md-6 fv-row mb-4'
						label='Mobile Number'
						placeholder='Enter 10-digit Mobile Number'
						type='number'
						name='mobile'
						htmlFor='mobile'
						value={formData.mobile}
						onChange={handleInputChange}
					/>
					<InputField
						className='col-md-6 fv-row mb-4'
						label='Email Address'
						placeholder='name@example.com'
						type='email'
						name='email'
						htmlFor='email'
						value={formData.email}
						onChange={handleInputChange}
					/>
				</div>

				<div className='d-flex justify-content-end align-items-center gap-3 pt-4' style={{ borderTop: '1px solid #F1F5F9' }}>
					<Link to='/rag/users' className='gz-mgmt-btn-secondary text-decoration-none'>
						Cancel
					</Link>
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
								Adding User...
							</>
						) : (
							<>
								<i className='bi bi-person-plus me-2'></i>
								Create User
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export default AddUserForm
