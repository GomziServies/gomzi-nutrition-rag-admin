import { FC, useEffect, useState } from 'react'
import SelectField from '../../../../components/SelectField'
import SelectFieldManual from '../../../../components/SelectFieldManual'
import { GetFitnessCourse } from '../../../../Functions/FGGroup'
import { GetSubscriptionPlan } from '../../../../Functions/FGGroup/SubscriptionPlan'
import { DayJS } from '../../../../../_metronic/helpers/Utils'

interface Course {
	_id: string
	course_name: string
	amount: number
}

interface Plan {
	_id: string
	razorpay_plan_id: string
	name: string
	amount: number
	interval: string
	period: string
}

const Step1: FC<{ setFormData: (data: any) => void }> = ({ setFormData }) => {
	const [values, setValues] = useState<any>({
		course_id: '',
		plan_id: '',
		isImmediate: false,
		start_at: '',
		total_count: '',
		payment_gateway: '',
		notes: {},
	})

	const [courses, setCourses] = useState<Course[]>([])
	const [gateway, setGateway] = useState<any>()
	const [plans, setPlans] = useState<Plan[]>([])
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

	const fetchCourse = async () => {
		try {
			const response: any = await GetFitnessCourse()
			setCourses(response.data)
		} catch (error: any) {
			console.error('Error fetching courses:', error)
		}
	}

	const fetchPlans = async () => {
		try {
			const response: any = await GetSubscriptionPlan({
				gateway: gateway || null,
				course_id: values.course_id || null,
			})
			setPlans(response.data)
		} catch (error: any) {
			console.error('Error fetching plans:', error)
		}
	}

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { checked } = e.target
		setValues((prevValues: any) => ({
			...prevValues,
			isImmediate: checked,
			start_at: checked ? '' : prevValues.start_at,
		}))
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target

		if (name === 'plan_id') {
			const selected: any = plans.find((plan) => plan._id === value)
			setSelectedPlan(selected || null)
		}

		if (name === 'payment_gateway') {
			if (value == 'Razorpay FGIIT (IwHEpNNtAPrDLR)') {
				setGateway('RAZORPAY_FGIIT')
			} else if (value == 'Razorpay FG Meals (OejSEaaVBvxRmf)') {
				setGateway('RAZORPAY_FGMEALS')
			} else if (value == 'Razorpay Gomzi Consulting (PJ728F7GxhfZkN)') {
				setGateway('RAZORPAY GOMZI CONSULTING')
			} else if (value == 'Razorpay (CiS87S7GTMLS25)') {
				setGateway('RAZORPAY')
			} else {
				setGateway(value || null)
			}
		}

		setFormData((prev: any) => ({
			...prev,
			plan: {
				...prev.plan,
				[e.target.name]: e.target.value,
			},
		}))

		const newValues = {
			...values,
			[name]: value,
		}
		setValues(newValues)
	}

	const today = DayJS().format('YYYY-MM-DD')

	useEffect(() => {
		fetchCourse()
	}, [])

	useEffect(() => {
		fetchPlans()
	}, [gateway, values.course_id])

	return (
		<div className='w-100'>
			<div className='pb-5'>
				<h2 className='fw-bolder d-flex align-items-center text-dark'>Plan Details</h2>
				<div className='text-gray-400 fw-bold fs-6'>Please select your plan and start date.</div>
			</div>

			{/* Course Selection */}
			<div className='fv-row'>
				<label className='form-label fw-bold text-dark fs-6'>Select Course</label>
				<SelectFieldManual
					className='fv-row mb-3'
					label='Course'
					showLabel={false}
					name='course_id'
					value={values.course_id}
					onChange={handleInputChange}
					htmlFor='course_id'
					options={courses.map((course) => ({
						value: course._id,
						name: `${course.course_name} - ₹${course.amount}`,
					}))}
				/>
			</div>

			{/* Course Selection */}
			<div className='fv-row'>
				<label className='form-label fw-bold text-dark fs-6'>Select Payment Gateway</label>
				<SelectField
					className='fv-row mb-3'
					label='Payment Gateway'
					showLabel={false}
					name='payment_gateway'
					value={values.payment_gateway}
					onChange={handleInputChange}
					htmlFor='payment_gateway'
					options={[
						'Razorpay (CiS87S7GTMLS25)',
						'Razorpay FGIIT (IwHEpNNtAPrDLR)',
						'Razorpay FG Meals (OejSEaaVBvxRmf)',
						'Razorpay Gomzi Consulting (PJ728F7GxhfZkN)',
					]}
				/>
			</div>

			{/* Plan Selection */}
			<div className='fv-row'>
				<label className='form-label fw-bold text-dark fs-6'>Select Plan</label>
				<SelectFieldManual
					className='fv-row mb-3'
					label='Plan'
					showLabel={false}
					name='plan_id'
					value={values.plan_id}
					onChange={handleInputChange}
					htmlFor='plan_id'
					disabled={!values.payment_gateway}
					options={plans.map((plan: any) => ({
						value: plan.razorpay_plan_id,
						name: `${plan.name} - ₹${plan.amount} (${plan.interval} per ${plan.period})`,
					}))}
				/>
			</div>

			{/* Display Selected Plan Details */}
			{selectedPlan && (
				<div className='selected-plan-details bg-light p-5 rounded mb-5'>
					<h4 className='text-dark mb-3'>Selected Plan Details</h4>
					<p>
						<strong>Plan:</strong> {selectedPlan.name}
					</p>
					<p>
						<strong>Amount:</strong> ₹{selectedPlan.amount}
					</p>
					<p>
						<strong>Interval:</strong> {selectedPlan.interval}
					</p>
					<p>
						<strong>Period:</strong> {selectedPlan.period}
					</p>
				</div>
			)}

			<div className='fv-row mb-7'>
				<label className='form-label fw-bold text-dark fs-6'>Start Date</label>
				<div className='form-check form-check-inline mb-3 mx-3'>
					<input
						type='checkbox'
						name='isImmediate'
						id='immediateCheckbox'
						className='form-check-input'
						checked={values.isImmediate}
						onChange={handleCheckboxChange}
					/>
					<label
						htmlFor='immediateCheckbox'
						className='form-check-label text-gray-600'>
						Immediate, subscription starts with the first payment
					</label>
				</div>

				<div className='input-group'>
					<input
						type='date'
						name='start_at'
						className='form-control'
						min={today}
						value={values.start_at}
						onChange={handleInputChange}
						disabled={values.isImmediate}
					/>
				</div>
			</div>

			{/* Total Count */}
			<div className='fv-row mb-8'>
				<label className='form-label fw-bold text-dark fs-6'>Total Count</label>
				<input
					type='number'
					className='form-control form-control-lg form-control-solid'
					name='total_count'
					value={values.total_count}
					onChange={handleInputChange}
					min='1'
				/>
			</div>
		</div>
	)
}

export { Step1 }
