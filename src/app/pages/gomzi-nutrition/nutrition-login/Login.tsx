/* eslint-disable jsx-a11y/anchor-is-valid */
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import * as Yup from 'yup'
import { LoginWithEmailPasswordOTP, VerifyEmailOTP } from '../../../Functions/FGGroup'
import { useAuth, syncAndRouteProPartnerUser } from '../../../modules/auth'

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

export function NutritionLogin() {
	const [loading, setLoading] = useState(false)
	const [resendLoading, setResendLoading] = useState(false)
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
					const auth: any = await VerifyEmailOTP({
						otp: values.otp,
						verification_id: verificationId,
					})
					if (auth.status !== 200) throw new Error(auth.message)
					saveAuth(auth.data)
					const isPartner = await syncAndRouteProPartnerUser()
					if (isPartner) {
						window.location.href = '/rag/pro-partner/coupons'
						return
					}
				} else {
					const auth: any = await LoginWithEmailPasswordOTP(values)
					if (auth.status !== 200) throw new Error(auth.message)
					if (auth.data.otp) {
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
						const isPartner = await syncAndRouteProPartnerUser()
						if (isPartner) {
							window.location.href = '/rag/pro-partner/coupons'
							return
						}
					}
				}
			} catch (error: any) {
				console.error(error)
				saveAuth(undefined)
				setStatus(error.message)
			} finally {
				setSubmitting(false)
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
				{process.env.REACT_APP_NODE_ENV === 'development' && (
					<span className='badge badge-light-warning fs-8 ms-2'>
						Portal for Internal Use (Test Mode)
					</span>
				)}
				{process.env.REACT_APP_NODE_ENV === 'production' && (
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
					<div className='fv-row mb-8'>
						<label className='form-label fs-6 fw-bolder text-dark'>Email</label>
						<input
							placeholder='Email'
							{...formik.getFieldProps('email')}
							className={clsx(
								'form-control bg-transparent',
								{ 'is-invalid': formik.touched.email && formik.errors.email },
								{ 'is-valid': formik.touched.email && !formik.errors.email }
							)}
							type='email'
							autoComplete='off'
						/>
						{formik.touched.email && formik.errors.email && (
							<div className='fv-plugins-message-container'>
								<span role='alert'>{formik.errors.email}</span>
							</div>
						)}
					</div>

					<div className='fv-row mb-3'>
						<label className='form-label fw-bolder text-dark fs-6 mb-0'>Password</label>
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
								<span role='alert'>{formik.errors.password}</span>
							</div>
						)}
					</div>

					<div className='d-grid mb-10 mt-5'>
						<button
							type='submit'
							className='btn btn-success'
							disabled={formik.isSubmitting || !formik.isValid}>
							{!loading ? (
								<span className='indicator-label'>Continue</span>
							) : (
								<span className='indicator-progress'>
									Please wait...
									<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
								</span>
							)}
						</button>
					</div>
				</>
			) : (
				<>
					<div className='fv-row mb-8'>
						<label className='form-label fs-6 fw-bolder text-dark'>OTP</label>
						<input
							placeholder='OTP'
							{...formik.getFieldProps('otp')}
							className={clsx(
								'form-control bg-transparent',
								{ 'is-invalid': formik.touched.otp && formik.errors.otp },
								{ 'is-valid': formik.touched.otp && !formik.errors.otp }
							)}
							type='text'
							autoComplete='off'
						/>
						{formik.touched.otp && formik.errors.otp && (
							<div className='fv-plugins-message-container'>
								<span role='alert'>{formik.errors.otp}</span>
							</div>
						)}
					</div>

					<button
						className='text-primary border-0 bg-white'
						disabled={resendOtpDisabled || resendLoading}
						onClick={async (e) => {
							e.preventDefault()
							if (!resendOtpDisabled) {
								setResendLoading(true)
								try {
									const auth: any = await LoginWithEmailPasswordOTP(formik.values)
									if (auth.status !== 200) throw new Error(auth.message)
									if (auth.data.otp) {
										formik.setFieldValue('otp', auth.data.otp)
										setVerificationId(auth.data.verification_id)
										setResendOtpDisabled(true)
										setTimer(60)
									} else if (auth.data.verification_id) {
										setVerificationId(auth.data.verification_id)
										setResendOtpDisabled(true)
										setTimer(60)
									} else {
										saveAuth(auth.data)
									}
								} catch (error) {
									console.error(error)
								} finally {
									setResendLoading(false)
								}
							}
						}}>
						{resendLoading ? (
							<>
								Please wait...
								<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
							</>
						) : (
							'Resend OTP'
						)}
					</button>

					<span className='fw-bold'>{resendOtpDisabled && ` (${timer} seconds)`}</span>

					<div className='d-grid mt-5 mb-7'>
						<button
							type='submit'
							className='btn btn-success'
							disabled={formik.isSubmitting || !formik.isValid || loading}>
							{!loading && <span className='indicator-label'>Verify OTP</span>}
							{loading && (
								<span className='indicator-progress' style={{ display: 'block' }}>
									Please wait...
									<span className='spinner-border spinner-border-sm align-middle ms-2'></span>
								</span>
							)}
						</button>
					</div>

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
