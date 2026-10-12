/* eslint-disable jsx-a11y/anchor-is-valid */
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import * as Yup from 'yup'
import { LoginWithEmailPasswordOTP, VerifyEmailOTP } from '../../../../Functions/FGGroup'
import { useAuth } from '../../../../modules/auth'

const loginSchema = Yup.object().shape({
	email: Yup.string()
		.email('Wrong email format')
		.min(3, 'Minimum 3 symbols')
		.max(50, 'Maximum 50 symbols')
		.required('Email is required'),
	password: Yup.string()
		.min(3, 'Minimum 3 symbols')
		.max(50, 'Maximum 50 symbols')
		.required('Password is required'),
})

const otpSchema = Yup.object().shape({
	otp: Yup.string()
		.min(6, 'Minimum 6 symbols')
		.max(6, 'Maximum 6 symbols')
		.required('OTP is required'),
})

const initialValues = {
	email: '',
	password: '',
	otp: '',
}

export function AutomationLoginComponent() {
	const [loading, setLoading] = useState(false)
	const { saveAuth } = useAuth()
	const [showPassword, setShowPassword] = useState(false)
	const [otpRequired, setOtpRequired] = useState(false)
	const [verificationId, setVerificationId] = useState('')
	const [resendOtpDisabled, setResendOtpDisabled] = useState(true)
	const [timer, setTimer] = useState(60)

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword)
	}

	const formik = useFormik({
		initialValues,
		validationSchema: otpRequired ? otpSchema : loginSchema,
		onSubmit: async (values, { setStatus, setSubmitting, setFieldValue }) => {
			setLoading(true)
			try {
				if (otpRequired) {
					// Step 2: Verify OTP
					const auth: any = await VerifyEmailOTP({
						otp: values.otp,
						verification_id: verificationId,
					})
					if (auth.status !== 200) throw new Error(auth.message)
					// Override admin type to Automation after universal token is set
					localStorage.setItem('admin', 'Automation')
					saveAuth(auth.data)
					window.location.href = '/automation/broadcast/list'
				} else {
					// Step 1: Email + Password → get verification_id
					const auth: any = await LoginWithEmailPasswordOTP(values)
					if (auth.status !== 200) throw new Error(auth.message)
					if (auth.data.otp) {
						// Dev mode: OTP auto-filled
						setOtpRequired(true)
						setFieldValue('otp', auth.data.otp)
						setVerificationId(auth.data.verification_id)
						setResendOtpDisabled(true)
						setTimer(60)
					} else if (auth.data.verification_id) {
						setOtpRequired(true)
						setVerificationId(auth.data.verification_id)
						setResendOtpDisabled(true)
						setTimer(60)
					} else {
						saveAuth(auth.data)
					}
				}
			} catch (error: any) {
				console.error(error)
				saveAuth(undefined)
				setStatus(error.message)
				setSubmitting(false)
			} finally {
				setLoading(false)
			}
		},
	})

	useEffect(() => {
		let countdown: NodeJS.Timeout
		if (otpRequired && resendOtpDisabled) {
			countdown = setInterval(() => {
				setTimer((prevTimer) => {
					if (prevTimer <= 1) {
						clearInterval(countdown)
						setResendOtpDisabled(false)
						return 0
					}
					return prevTimer - 1
				})
			}, 1000)
		}
		return () => clearInterval(countdown)
	}, [otpRequired, resendOtpDisabled])

	return (
		<form
			className='form w-100'
			onSubmit={formik.handleSubmit}
			noValidate
			id='kt_login_signin_form'>
			<div className='text-center mb-11'>
				<h1 className='text-dark fw-bolder mb-3'>Automation Sign In</h1>
				<span className='badge badge-light-primary fs-8 ms-2'>Automation System Only</span>
			</div>

			{formik.status && (
				<div className='mb-lg-15 alert alert-danger'>
					<div className='alert-text font-weight-bold'>{formik.status}</div>
				</div>
			)}

			{!otpRequired ? (
				<>
					{/* Email Field */}
					<div className='fv-row mb-8'>
						<label
							className='form-label fs-6 fw-bolder text-dark'
							htmlFor='email'>
							Email
						</label>
						<input
							placeholder='Email'
							{...formik.getFieldProps('email')}
							className={clsx(
								'form-control bg-transparent',
								{ 'is-invalid': formik.touched.email && formik.errors.email },
								{ 'is-valid': formik.touched.email && !formik.errors.email }
							)}
							type='email'
							name='email'
							autoComplete='off'
						/>
						{formik.touched.email && formik.errors.email && (
							<div className='fv-plugins-message-container'>
								<span role='alert'>{formik.errors.email}</span>
							</div>
						)}
					</div>

					{/* Password Field */}
					<div className='fv-row mb-3'>
						<label
							className='form-label fw-bolder text-dark fs-6 mb-0'
							htmlFor='password'>
							Password
						</label>
						<div className='input-group'>
							<input
								placeholder='Enter password'
								type={showPassword ? 'text' : 'password'}
								autoComplete='off'
								{...formik.getFieldProps('password')}
								className={clsx(
									'form-control bg-transparent',
									{ 'is-invalid': formik.touched.password && formik.errors.password },
									{ 'is-valid': formik.touched.password && !formik.errors.password }
								)}
							/>
							<button
								className='btn'
								style={{ border: '1px solid #92929f' }}
								type='button'
								onClick={togglePasswordVisibility}>
								<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
							</button>
						</div>
						{formik.touched.password && formik.errors.password && (
							<div className='fv-plugins-message-container'>
								<div className='fv-help-block'>
									<span role='alert'>{formik.errors.password}</span>
								</div>
							</div>
						)}
					</div>

					{/* Continue Button */}
					<div className='d-grid mb-10 mt-5'>
						<button
							type='submit'
							className='btn btn-success'
							disabled={formik.isSubmitting || !formik.isValid}>
							{!loading && <span className='indicator-label'>Continue</span>}
							{loading && (
								<span
									className='indicator-progress'
									style={{ display: 'block' }}>
									Please wait...
									<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
								</span>
							)}
						</button>
					</div>
				</>
			) : (
				<>
					{/* OTP Field */}
					<div className='fv-row mb-8'>
						<label
							className='form-label fs-6 fw-bolder text-dark'
							htmlFor='otp'>
							OTP
						</label>
						<input
							placeholder='OTP'
							{...formik.getFieldProps('otp')}
							className={clsx(
								'form-control bg-transparent',
								{ 'is-invalid': formik.touched.otp && formik.errors.otp },
								{ 'is-valid': formik.touched.otp && !formik.errors.otp }
							)}
							type='text'
							name='otp'
							autoComplete='off'
						/>
						{formik.touched.otp && formik.errors.otp && (
							<div className='fv-plugins-message-container'>
								<span role='alert'>{formik.errors.otp}</span>
							</div>
						)}
					</div>

					{/* Resend OTP */}
					<button
						className='text-primary border-0 bg-white'
						onClick={async (e) => {
							e.preventDefault()
							if (!resendOtpDisabled) {
								try {
									const auth: any = await LoginWithEmailPasswordOTP(formik.values)
									if (auth.status !== 200) throw new Error(auth.message)
									if (auth.data.otp) {
										setOtpRequired(true)
										formik.setFieldValue('otp', auth.data.otp)
										setVerificationId(auth.data.verification_id)
										setResendOtpDisabled(true)
										setTimer(60)
									} else if (auth.data.verification_id) {
										setOtpRequired(true)
										setVerificationId(auth.data.verification_id)
										setResendOtpDisabled(true)
										setTimer(60)
									} else {
										saveAuth(auth.data)
									}
								} catch (error) {
									console.error(error)
								}
							}
						}}>
						Resend OTP
					</button>

					<span className='fw-bold'>{resendOtpDisabled && ` (${timer} seconds)`}</span>

					{/* Verify OTP Button */}
					<div className='d-grid mt-5 mb-7'>
						<button
							type='submit'
							className='btn btn-success'
							disabled={formik.isSubmitting || !formik.isValid}>
							{!loading && <span className='indicator-label'>Verify OTP</span>}
							{loading && (
								<span
									className='indicator-progress'
									style={{ display: 'block' }}>
									Please wait...
									<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
								</span>
							)}
						</button>
					</div>

					{/* Back to Login */}
					<div className='text-center'>
						<h3>
							<button
								className='text-primary fw-600 border-0 bg-white'
								onClick={() => {
									setOtpRequired(false)
									setLoading(false)
								}}>
								Back to Login?
							</button>
						</h3>
					</div>
				</>
			)}
		</form>
	)
}
