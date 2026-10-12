/* eslint-disable jsx-a11y/anchor-is-valid */
import { useFormik } from 'formik'
import React, { useState } from 'react'
import * as Yup from 'yup'
import { IUpdateEmail, IUpdatePassword, updateEmail, updatePassword } from '../SettingsModel'

const emailFormValidationSchema = Yup.object().shape({
	confirmPassword: Yup.string()
		.min(3, 'Minimum 3 symbols')
		.max(50, 'Maximum 50 symbols')
		.required('Password is required'),
})

const AddAuthApp: React.FC = () => {
	const [emailUpdateData, setEmailUpdateData] = useState<IUpdateEmail>(updateEmail)
	const [passwordUpdateData, setPasswordUpdateData] = useState<IUpdatePassword>(updatePassword)

	const [showPasswordForm, setPasswordForm] = useState<boolean>(false)

	const formik1 = useFormik<IUpdateEmail>({
		initialValues: {
			...emailUpdateData,
		},
		validationSchema: emailFormValidationSchema,
		onSubmit: (values) => {
			setTimeout((values: any) => {
				setEmailUpdateData(values)
			}, 1000)
		},
	})

	const [loading2, setLoading2] = useState(false)

	const formik2 = useFormik<IUpdatePassword>({
		initialValues: {
			...passwordUpdateData,
		},
		onSubmit: (values) => {
			setLoading2(true)
			setTimeout((values: any) => {
				setPasswordUpdateData(values)
				setLoading2(false)
				setPasswordForm(false)
			}, 1000)
		},
	})

	return (
		<div className='card mb-5 mb-xl-10'>
			<div
				className='card-header border-0 cursor-pointer'
				role='button'
				data-bs-toggle='collapse'
				data-bs-target='#kt_account_signin_method'>
				<div className='card-title m-0'>
					<h3 className='fw-bolder m-0'>Multi-Factor Authentication</h3>
				</div>
			</div>

			<div
				id='kt_account_signin_method'
				className='collapse show'>
				<div className='card-body border-top p-9'>
					<div className='d-flex flex-wrap align-items-center mb-10'>
						<div
							id='kt_signin_password'
							className={' ' + (showPasswordForm && 'd-none')}>
							<div className='fs-6 fw-bolder mb-1'>Authenticator App</div>
						</div>

						<div
							id='kt_signin_password_edit'
							className={'flex-row-fluid ' + (!showPasswordForm && 'd-none')}>
							<form
								onSubmit={formik2.handleSubmit}
								id='kt_signin_change_password'
								className='form'
								noValidate>
								<div className='row mb-1'>
									<h3>Download Authenticator App</h3>
									<h4 className='mt-3'>
										Microsoft Authenticator <b>(Recommended & Secure)</b> -
										<a href='https://play.google.com/store/apps/details?id=com.azure.authenticator&amp;hl=en&amp;gl=US'>
											Play Store (Android)
										</a>
										|{' '}
										<a href='https://apps.apple.com/us/app/microsoft-authenticator/id983156458'>
											App Store (iOS)
										</a>
									</h4>

									<h4 className='mt-2'>
										Google Authenticator -{' '}
										<a href='https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&amp;hl=en_US&amp;gl=US'>
											Play Store (Android)
										</a>{' '}
										|{' '}
										<a href='https://apps.apple.com/us/app/google-authenticator/id388497605'>
											App Store (iOS)
										</a>
									</h4>
									<h3 className='mt-4'>Scan QR Code</h3>
									<div>
										<img
											src=''
											alt=''
										/>
									</div>
									<div className='fv-row mb-0'>
										<label
											htmlFor='confirmpassword'
											className='form-label fs-6 fw-bolder mb-3'>
											Secret Key (For manual method)
										</label>
										<input
											type='password'
											className='form-control form-control-lg form-control-solid '
											id='confirmpassword'
											{...formik2.getFieldProps('passwordConfirmation')}
										/>
										{formik2.touched.passwordConfirmation && formik2.errors.passwordConfirmation && (
											<div className='fv-plugins-message-container'>
												<div className='fv-help-block'>{formik2.errors.passwordConfirmation}</div>
											</div>
										)}
									</div>
									<div className='fv-row mb-0'>
										<label
											htmlFor='confirmpassword'
											className='form-label fs-6 fw-bolder mb-3'>
											Enter Code from you authenticator app
										</label>
										<input
											type='password'
											className='form-control form-control-lg form-control-solid '
											id='confirmpassword'
											{...formik2.getFieldProps('passwordConfirmation')}
										/>
										{formik2.touched.passwordConfirmation && formik2.errors.passwordConfirmation && (
											<div className='fv-plugins-message-container'>
												<div className='fv-help-block'>{formik2.errors.passwordConfirmation}</div>
											</div>
										)}
									</div>
									<div className='fv-row mb-0'>
										<label
											htmlFor='confirmpassword'
											className='form-label fs-6 fw-bolder mb-3'>
											Enter Remark (e.g. your name)
										</label>
										<input
											type='password'
											className='form-control form-control-lg form-control-solid '
											id='confirmpassword'
											{...formik2.getFieldProps('passwordConfirmation')}
										/>
										{formik2.touched.passwordConfirmation && formik2.errors.passwordConfirmation && (
											<div className='fv-plugins-message-container'>
												<div className='fv-help-block'>{formik2.errors.passwordConfirmation}</div>
											</div>
										)}
									</div>
								</div>
								<div className='d-flex mt-4'>
									<button
										id='kt_password_submit'
										type='submit'
										className='btn btn-primary me-2 px-6'>
										{!loading2 && 'Verify'}
										{loading2 && (
											<span
												className='indicator-progress'
												style={{ display: 'block' }}>
												Please wait...{' '}
												<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
											</span>
										)}
									</button>
									<button
										onClick={() => {
											setPasswordForm(false)
										}}
										id='kt_password_cancel'
										type='button'
										className='btn btn-color-gray-400 btn-active-light-primary px-6'>
										Cancel
									</button>
								</div>
							</form>
						</div>

						<div
							id='kt_signin_password_button'
							className={'ms-auto ' + (showPasswordForm && 'd-none')}>
							<button
								onClick={() => {
									setPasswordForm(true)
								}}
								className='btn btn-light btn-active-light-primary'>
								Add Authenticator
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export { AddAuthApp }
