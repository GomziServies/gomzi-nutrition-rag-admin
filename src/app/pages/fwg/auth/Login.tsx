/* eslint-disable jsx-a11y/anchor-is-valid */
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import * as Yup from 'yup'
import { LoginWithEmailPasswordOTP, VerifyEmailOTP } from '../../../Functions/FGGroup'
import { useAuth } from '../../../modules/auth'

const loginSchema = Yup.object().shape({
	email: Yup.string().email('Wrong email format').min(3).max(50).required('Email is required'),
	password: Yup.string().min(3).max(50).required('Password is required'),
})

const otpSchema = Yup.object().shape({
	otp: Yup.string().min(6).max(6).required('OTP is required'),
})

const initialValues = {
	email: '',
	password: '',
	otp: '',
}

export function PortalLogin() {
	const [loading, setLoading] = useState(false)
	const { saveAuth } = useAuth()
	const [showPassword, setShowPassword] = useState(false)
	const [otpRequired, setOtpRequired] = useState(false)
	const [verificationId, setVerificationId] = useState('')
	const [resendOtpDisabled, setResendOtpDisabled] = useState(true)
	const [timer, setTimer] = useState(60)

	const togglePasswordVisibility = () => setShowPassword(!showPassword)

	const formik = useFormik({
		initialValues,
		validationSchema: otpRequired ? otpSchema : loginSchema,
		onSubmit: async (values, { setStatus, setSubmitting, setFieldValue }) => {
			setLoading(true)
			try {
				if (otpRequired) {
					const auth: any = await VerifyEmailOTP({
						otp: values.otp,
						verification_id: verificationId,
					})
					if (auth.status !== 200) throw new Error(auth.message)
					saveAuth(auth.data)
					localStorage.setItem('fwg_portal', 'fwg_portal')
				} else {
					const auth: any = await LoginWithEmailPasswordOTP(values)
					if (auth.status !== 200) throw new Error(auth.message)
					if (auth.data.otp || auth.data.verification_id) {
						setOtpRequired(true)
						setVerificationId(auth.data.verification_id)
						if (auth.data.otp) setFieldValue('otp', auth.data.otp)
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
				setTimer((prev) => {
					if (prev <= 1) {
						clearInterval(countdown)
						setResendOtpDisabled(false)
						return 0
					}
					return prev - 1
				})
			}, 1000)
		}
		return () => clearInterval(countdown)
	}, [otpRequired, resendOtpDisabled])

	return (
		<form className='form w-100' onSubmit={formik.handleSubmit} noValidate>
			<div className='text-center mb-11'>
				<h1 className='text-dark fw-bolder mb-3'>Sign In</h1>
				{process.env.REACT_APP_NODE_ENV === 'development' ? (
					<span className='badge badge-light-warning fs-8 ms-2'>Portal for Internal Use (Test Mode)</span>
				) : (
					<span className='badge badge-light-success fs-8 ms-2'>Portal for Internal Use</span>
				)}
			</div>

			{formik.status && (
				<div className='mb-lg-15 alert alert-danger'>
					<div className='alert-text font-weight-bold'>{formik.status}</div>
				</div>
			)}

			{!otpRequired ? (
				<>
					{/* Email */}
					<div className='fv-row mb-8'>
						<label className='form-label fs-6 fw-bolder text-dark'>Email</label>
						<input
							type='email'
							autoComplete='off'
							placeholder='Email'
							{...formik.getFieldProps('email')}
							className={clsx('form-control bg-transparent', {
								'is-invalid': formik.touched.email && formik.errors.email,
								'is-valid': formik.touched.email && !formik.errors.email,
							})}
						/>
						{formik.touched.email && formik.errors.email && (
							<div className='fv-plugins-message-container'>
								<span role='alert'>{formik.errors.email}</span>
							</div>
						)}
					</div>

					{/* Password */}
					<div className='fv-row mb-3'>
						<label className='form-label fw-bolder text-dark fs-6 mb-0'>Password</label>
						<div className='input-group'>
							<input
								type={showPassword ? 'text' : 'password'}
								autoComplete='off'
								placeholder='Enter password'
								{...formik.getFieldProps('password')}
								className={clsx('form-control bg-transparent', {
									'is-invalid': formik.touched.password && formik.errors.password,
									'is-valid': formik.touched.password && !formik.errors.password,
								})}
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
								<span role='alert'>{formik.errors.password}</span>
							</div>
						)}
					</div>

					{/* Login Button */}
					<div className='d-grid mb-10 mt-5'>
						<button type='submit' className='btn btn-success' disabled={formik.isSubmitting || !formik.isValid}>
							{!loading && <span className='indicator-label'>Continue</span>}
							{loading && (
								<span className='indicator-progress' style={{ display: 'block' }}>
									Please wait...
									<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
								</span>
							)}
						</button>
					</div>
				</>
			) : (
				<>
					{/* OTP Input */}
					<div className='fv-row mb-8'>
						<label className='form-label fs-6 fw-bolder text-dark'>OTP</label>
						<input
							type='text'
							autoComplete='off'
							placeholder='OTP'
							{...formik.getFieldProps('otp')}
							className={clsx('form-control bg-transparent', {
								'is-invalid': formik.touched.otp && formik.errors.otp,
								'is-valid': formik.touched.otp && !formik.errors.otp,
							})}
						/>
						{formik.touched.otp && formik.errors.otp && (
							<div className='fv-plugins-message-container'>
								<span role='alert'>{formik.errors.otp}</span>
							</div>
						)}
					</div>

					{/* Resend OTP */}
					<div className='mb-4'>
						<button
							className='text-primary border-0 bg-white'
							type='button'
							disabled={resendOtpDisabled || loading}
							onClick={async () => {
								if (!resendOtpDisabled) {
									setLoading(true)
									try {
										const auth: any = await LoginWithEmailPasswordOTP(formik.values)
										if (auth.status !== 200) throw new Error(auth.message)
										setVerificationId(auth.data.verification_id)
										if (auth.data.otp) formik.setFieldValue('otp', auth.data.otp)
										setResendOtpDisabled(true)
										setTimer(60)
									} catch (err) {
										console.error(err)
									} finally {
										setLoading(false)
									}
								}
							}}>
							Resend OTP
						</button>
						<span className='fw-bold'>{resendOtpDisabled && ` (${timer} seconds)`}</span>
					</div>

					{/* OTP Verify Button */}
					<div className='d-grid mt-5 mb-7'>
						<button
							type='submit'
							className='btn btn-success'
							disabled={formik.isSubmitting || !formik.isValid}>
							{!loading && <span className='indicator-label'>Verify OTP</span>}
							{loading && (
								<span className='indicator-progress' style={{ display: 'block' }}>
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
								type='button'
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
