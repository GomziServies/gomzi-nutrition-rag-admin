import { useFormik } from 'formik'
import React, { useState } from 'react'
import * as Yup from 'yup'
import { IProfileDetails, profileDetailsInitValues as initialValues } from '../SettingsModel'

const profileDetailsSchema = Yup.object().shape({
	fName: Yup.string().required('First name is required'),
	lName: Yup.string().required('Last name is required'),
	company: Yup.string().required('Company name is required'),
	contactPhone: Yup.string().required('Contact phone is required'),
})

const ProfileDetails: React.FC = () => {
	const [data, setData] = useState<IProfileDetails>(initialValues)
	const updateData = (fieldsToUpdate: Partial<IProfileDetails>): void => {
		const updatedData = Object.assign(data, fieldsToUpdate)
		setData(updatedData)
	}

	const [loading, setLoading] = useState(false)
	const formik = useFormik<IProfileDetails>({
		initialValues,
		validationSchema: profileDetailsSchema,
		onSubmit: (values) => {
			setLoading(true)
			setTimeout(() => {
				values.communications.email = data.communications.email
				values.communications.phone = data.communications.phone
				values.allowMarketing = data.allowMarketing
				const updatedData = Object.assign(data, values)
				setData(updatedData)
				setLoading(false)
			}, 1000)
		},
	})

	return (
		<div className='card mb-5 mb-xl-10'>
			<div
				className='card-header border-0 cursor-pointer'
				role='button'
				data-bs-toggle='collapse'
				data-bs-target='#kt_account_profile_details'
				aria-expanded='true'
				aria-controls='kt_account_profile_details'>
				<div className='card-title m-0'>
					<h3 className='fw-bolder m-0'>Edit Profile</h3>
				</div>
			</div>
			<div
				id='kt_account_profile_details'
				className='collapse show'>
				<form
					onSubmit={formik.handleSubmit}
					noValidate
					className='form'>
					<div className='card-body border-top p-9'>
						<div className='row mb-6'>
							<label
								htmlFor='dfsf'
								className='col-lg-2 col-form-label required fw-bold fs-6'>
								Full Name
							</label>
							<div className='col-lg-10'>
								<input
									type='text'
									className='form-control form-control-lg form-control-solid mb-3 mb-lg-0'
									placeholder='First name'
									{...formik.getFieldProps('fName')}
								/>
								{formik.touched.fName && formik.errors.fName && (
									<div className='fv-plugins-message-container'>
										<div className='fv-help-block'>{formik.errors.fName}</div>
									</div>
								)}
							</div>
						</div>
						<div className='row mb-6'>
							<label
								htmlFor='dfsf'
								className='col-lg-2 col-form-label fw-bold fs-6'>
								<span className='required'>Mobile</span>
							</label>
							<div className='col-lg-10 fv-row'>
								<input
									type='tel'
									className='form-control form-control-lg form-control-solid'
									placeholder='Phone number'
									{...formik.getFieldProps('contactPhone')}
								/>
								{formik.touched.contactPhone && formik.errors.contactPhone && (
									<div className='fv-plugins-message-container'>
										<div className='fv-help-block'>{formik.errors.contactPhone}</div>
									</div>
								)}
							</div>
						</div>

						<div className='row mb-6'>
							<label
								htmlFor='dfsf'
								className='col-lg-2 col-form-label fw-bold fs-6'>
								<span className='required'>Email </span>
							</label>
							<div className='col-lg-10 fv-row'>
								<input
									type='text'
									className='form-control form-control-lg form-control-solid'
									placeholder='Company website'
									{...formik.getFieldProps('companySite')}
								/>
								{formik.touched.companySite && formik.errors.companySite && (
									<div className='fv-plugins-message-container'>
										<div className='fv-help-block'>{formik.errors.companySite}</div>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className='card-footer d-flex justify-content-end py-6 px-9'>
						<button
							type='submit'
							className='btn btn-primary'
							disabled={loading}>
							{!loading && 'Save Changes'}
							{loading && (
								<span
									className='indicator-progress'
									style={{ display: 'block' }}>
									Please wait...{' '}
									<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
								</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export { ProfileDetails }
