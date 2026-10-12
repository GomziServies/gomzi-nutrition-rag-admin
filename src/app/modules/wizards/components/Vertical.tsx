import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { StepperComponent } from '../../../../_metronic/assets/ts/components'
import { KTIcon } from '../../../../_metronic/helpers'
import { createSubscription } from '../../../Functions/FGGroup/Subscription'
import { Step1 } from './steps/Step1'
import { Step2 } from './steps/Step2'
import { Step3 } from './steps/Step3'

const Vertical = () => {
	const stepperRef = useRef<HTMLDivElement | null>(null)
	const stepper = useRef<StepperComponent | null>(null)
	const [currentStepIndex, setCurrentStepIndex] = useState(1)
	const [totalStepsNumber, setTotalStepsNumber] = useState(1)
	const [loading, setLoading] = useState(false)

	const [formData, setFormData] = useState<any>({
		plan: {},
		addOns: {},
		userDetails: {},
	})

	const loadStepper = () => {
		if (stepperRef.current) {
			stepper.current = StepperComponent.createInsance(stepperRef.current as HTMLDivElement)
			if (stepper.current) {
				setTotalStepsNumber(stepper.current.totalStepsNumber)
				setCurrentStepIndex(stepper.current.currentStepIndex)
			}
		}
	}

	const prevStep = () => {
		if (stepper.current) {
			stepper.current.goPrev()
			const stepIndex = stepper.current.currentStepIndex
			setCurrentStepIndex(stepIndex)
		}
	}

	const nextStep = () => {
		if (stepper.current) {
			stepper.current.goNext()
			const stepIndex = stepper.current.currentStepIndex
			setCurrentStepIndex(stepIndex)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const removeEmptyFields = (obj: any) => {
			return Object.entries(obj).reduce((acc, [key, value]) => {
				if (value !== null && value !== undefined && value !== '') {
					acc[key] = value
				}
				return acc
			}, {} as any)
		}

		if (currentStepIndex < totalStepsNumber) {
			nextStep()
		} else {
			setLoading(true)
			let payload: any = {
				plan_id: formData?.plan?.plan_id,
				total_count: formData?.plan?.total_count,
				quantity: 1,
				start_at: formData?.plan?.start_at,
				expire_by: formData?.userDetails?.manualExpiryDate,
				customer_notify: formData?.userDetails?.notifications?.razorpay ? 1 : 0,
				user_id: formData?.userDetails?.user_id,
				notification: {
					email: formData?.userDetails?.notifications?.email,
					whatsapp: formData?.userDetails?.notifications?.whatsapp,
				},
			}

			if (formData?.addOns && (formData.addOns.name || formData.addOns.amount)) {
				payload.addons = {
					name: formData?.addOns?.name,
					currency: 'INR',
					amount: formData?.addOns?.amount,
				}
				payload.addons = removeEmptyFields(payload.addons)
			}

			payload.notification = removeEmptyFields(payload.notification)
			payload = removeEmptyFields(payload)

			try {
				const response: any = await createSubscription(payload)
				const shortUrl = response?.data?.short_url

				// Show SweetAlert on success
				Swal.fire({
					title: 'Subscription Created!',
					html: `
							<p>Short URL: <strong>${shortUrl}</strong></p>
							<button id="copy-btn" className="btn btn-primary" style="margin-left: 10px; cursor: pointer;">Copy</button>
						`,
					didOpen: () => {
						const copyButton = document.getElementById('copy-btn')
						copyButton?.addEventListener('click', () => {
							navigator.clipboard.writeText(shortUrl)
							Swal.fire('Copied!', '', 'success')
						})
					},
				})
				setFormData({})
				setCurrentStepIndex(1)
				setLoading(false)
				setTimeout(() => {
					window.location.reload()
				}, 4000)
			} catch (error: any) {
				toast.error(error.message)
				setLoading(false)
			}
		}
	}

	useEffect(() => {
		if (stepperRef.current) {
			loadStepper()
		}
	}, [stepperRef])

	return (
		<div
			ref={stepperRef}
			className='stepper stepper-pills stepper-column d-flex flex-column flex-xl-row flex-row-fluid'
			id='kt_create_account_stepper'>
			{/* Stepper Navigation */}
			<div className='card d-flex justify-content-center justify-content-xl-start flex-row-auto w-100 w-xl-300px w-xxl-400px me-9'>
				<div className='card-body px-6 px-lg-10 px-xxl-15 py-30'>
					<div className='stepper-nav py-5'>
						<div
							className={`stepper-item ${currentStepIndex === 1 ? 'current' : ''}`}
							data-kt-stepper-element='nav'>
							<div className='stepper-wrapper'>
								<div className='stepper-icon w-40px h-40px'>
									<i className='stepper-check fas fa-check'></i>
									<span className='stepper-number'>1</span>
								</div>
								<div className='stepper-label'>
									<h3 className='stepper-title'>Plan Details</h3>
								</div>
							</div>
							<div className='stepper-line h-30px'></div>
						</div>

						<div
							className={`stepper-item ${currentStepIndex === 2 ? 'current' : ''}`}
							data-kt-stepper-element='nav'>
							<div className='stepper-wrapper'>
								<div className='stepper-icon w-40px h-40px'>
									<i className='stepper-check fas fa-check'></i>
									<span className='stepper-number'>2</span>
								</div>
								<div className='stepper-label'>
									<h3 className='stepper-title'>Add Ons</h3>
								</div>
							</div>
							<div className='stepper-line h-30px'></div>
						</div>

						<div
							className={`stepper-item ${currentStepIndex === 3 ? 'current' : ''}`}
							data-kt-stepper-element='nav'>
							<div className='stepper-wrapper'>
								<div className='stepper-icon w-40px h-40px'>
									<i className='stepper-check fas fa-check'></i>
									<span className='stepper-number'>3</span>
								</div>
								<div className='stepper-label'>
									<h3 className='stepper-title'>User Details</h3>
								</div>
							</div>
							<div className='stepper-line h-30px'></div>
						</div>
					</div>
				</div>
			</div>

			{/* Stepper Content */}
			<div className='d-flex flex-row-fluid flex-center bg-body rounded'>
				{loading ? (
					<div
						style={{ height: '300px' }}
						className='d-flex justify-content-center align-items-center'>
						<div className='d-flex justify-content-center align-items-center'>
							<div
								className='spinner-border'
								role='status'>
								<span className='visually-hidden'>Loading...</span>
							</div>
						</div>
					</div>
				) : (
					<form
						onSubmit={handleSubmit}
						className='py-10 w-100 w-xl-700px px-9'
						noValidate
						id='kt_create_account_form'>
						<div
							className={currentStepIndex === 1 ? 'current' : 'pending'}
							data-kt-stepper-element='content'>
							<Step1 setFormData={setFormData} />
						</div>
						<div
							className={currentStepIndex === 2 ? 'current' : 'pending'}
							data-kt-stepper-element='content'>
							<Step2
								setFormData={setFormData}
								formData={formData}
							/>
						</div>
						<div
							className={currentStepIndex === 3 ? 'current' : 'pending'}
							data-kt-stepper-element='content'>
							<Step3 setFormData={setFormData} />
						</div>

						<div className='d-flex flex-stack pt-10'>
							<div className='mr-2'>
								<button
									onClick={prevStep}
									type='button'
									className='btn btn-lg btn-light-primary me-3'
									data-kt-stepper-action='previous'>
									<KTIcon
										iconName='arrow-left'
										className='fs-4 me-1'
									/>
									Back
								</button>
							</div>

							<div>
								<button
									type='submit'
									className='btn btn-lg btn-primary me-3'>
									<span className='indicator-label'>
										{currentStepIndex !== totalStepsNumber ? 'Continue' : 'Submit'}
										<KTIcon
											iconName='arrow-right'
											className='fs-3 ms-2 me-0'
										/>
									</span>
								</button>
							</div>
						</div>
					</form>
				)}
			</div>
		</div>
	)
}

export { Vertical }
