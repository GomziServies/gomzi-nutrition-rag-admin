import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import { GetFitnessCourse, GetFitnessPlans } from '../../../Functions/FGGroup'
import { CreateSubscriptionPlan } from '../../../Functions/FGGroup/SubscriptionPlan'

interface PlanData {
	period: string
	interval: number
	notes: { [key: string]: string }
	name: string
	payment_gateway: string
	amount: number
	currency: string
	description: string
	course_id: string
}

const SubscriptionPlanAdd = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [courses, setCourses] = useState([])
	const [selectedPlanData, setSelectedPlanData] = useState('')
	const [planData, setPlanData] = useState<PlanData>({
		name: '',
		description: '',
		interval: 1,
		period: 'daily',
		amount: 0,
		notes: {},
		course_id: '',
		currency: 'INR',
		payment_gateway: '',
	})

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		if (name.startsWith('notes.')) {
			const field = name.split('.')[1]
			setPlanData((prevData: any) => ({
				...prevData,
				notes: {
					...prevData.notes,
					[field]: value,
				},
			}))
		} else if (name === 'payment_gateway') {
			if (value == 'Razorpay FGIIT (IwHEpNNtAPrDLR)') {
				setPlanData({ ...planData, payment_gateway: 'RAZORPAY_FGIIT' })
				setSelectedPlanData('Razorpay FGIIT (IwHEpNNtAPrDLR)')
			} else if (value == 'Razorpay FG Meals (OejSEaaVBvxRmf)') {
				setPlanData({ ...planData, payment_gateway: 'RAZORPAY_FGMEALS' })
				setSelectedPlanData('Razorpay FG Meals (OejSEaaVBvxRmf)')
			} else if (value == 'Razorpay Gomzi Consulting (PJ728F7GxhfZkN)') {
				setPlanData({ ...planData, payment_gateway: 'RAZORPAY GOMZI CONSULTING' })
				setSelectedPlanData('Razorpay Gomzi Consulting (PJ728F7GxhfZkN)')
			} else if (value == 'Razorpay (CiS87S7GTMLS25)') {
				setPlanData({ ...planData, payment_gateway: 'RAZORPAY' })
				setSelectedPlanData('Razorpay (CiS87S7GTMLS25)')
			}
		} else {
			setPlanData({ ...planData, [name]: value })
		}
	}
	const handleAddNote = () => {
		const key = `note${Object.keys(planData.notes).length + 1}`
		setPlanData((prevData: any) => ({
			...prevData,
			notes: {
				...prevData.notes,
				[key]: '',
			},
		}))
	}

	const handleNoteTitleChange = (oldKey: string, newKey: string) => {
		setPlanData((prevData: any) => {
			const updatedNotes = { ...prevData.notes }
			updatedNotes[newKey] = updatedNotes[oldKey]
			delete updatedNotes[oldKey]
			return { ...prevData, notes: updatedNotes }
		})
	}

	const handleAddButtonClick = async () => {
		// if (!planData.name || !planData.interval || !planData.period || !planData.amount) {
		// 	toast.error('All Fields Required')
		// 	return
		// }

		try {
			setIsSubmitting(true)

			const fitnessType: any = courses.find((data: any) => data._id === planData.course_id)

			const payload: any = {
				period: planData.period.toLowerCase(),
				interval: Number(planData.interval),
				name: planData.name,
				payment_gateway: planData.payment_gateway,
				amount: planData.amount,
				currency: planData.currency,
				description: planData.description,
				notes: planData.notes,
				...(fitnessType?.type === 'course' && { course_id: planData.course_id }),
				...(fitnessType?.type === 'plan' && { plan_id: planData.course_id }),
			}

			const response = await CreateSubscriptionPlan(payload)

			toast.success('Plan Created Successfully')
			setIsSubmitting(false)

			window.location.href = `/fgiit/plan/view?plan_id=${response.data._id}`

			// Optionally reset planData after submission
			// setPlanData({
			//     name: '',
			//     description: '',
			//     interval: 1,
			//     period: '',
			//     amount: 0,
			//     notes: {},
			//     course_id: '',
			//     currency: 'INR',
			// });
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const fetchCourse = async () => {
		try {
			const response: any = await GetFitnessCourse()
			const planResponse: any = await GetFitnessPlans()

			const filteredCourseData = response.data.map((course: any) => ({ ...course, type: 'course' }))
			const filteredPlanData = planResponse.data.map((course: any) => ({ ...course, type: 'plan' }))

			const filterData = filteredCourseData.concat(filteredPlanData)
			setCourses(filterData)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchCourse()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Create Subscription</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-6'>
									<SelectField
										className='fv-row mb-7'
										label='Payment Gateway'
										name='payment_gateway'
										value={selectedPlanData}
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
								<div className='col-md-6'>
									<SelectFieldManual
										className='fv-row mb-7'
										label='Course'
										name='course_id'
										value={planData.course_id}
										onChange={handleInputChange}
										htmlFor='course_id'
										options={courses.map((course: any) => ({
											value: course._id,
											name: course.course_name ? course.course_name : course.plan_name,
										}))}
									/>
								</div>
								<div className='col-md-6 mb-3'>
									<InputField
										placeholder='The name known to your customers'
										type='text'
										required={true}
										className='col-12'
										name='name'
										label='Plan Name'
										htmlFor='name'
										value={planData.name}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-6 mb-3'>
									<InputField
										placeholder='Optional'
										type='text'
										className='col-12'
										name='description'
										label='Plan Description'
										htmlFor='description'
										value={planData.description}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-6 mb-3'>
									<label className='form-label fw-bold required'>Billing Frequency</label>
									<div className='d-flex align-items-center'>
										<h4 className='mx-4'>Every</h4>
										<input
											type='number'
											name='interval'
											className='form-control'
											value={planData.interval}
											onChange={handleInputChange}
											min={0}
										/>
										<select
											name='period'
											className='form-select ms-2'
											value={planData.period}
											onChange={handleInputChange}>
											<option value='daily'>Day(s)</option>
											<option value='weekly'>Week(s)</option>
											<option value='monthly'>Month(s)</option>
											<option value='yearly'>Year(s)</option>
										</select>
									</div>
									<small className='text-muted'>You can set billing cycle later.</small>
								</div>
								<div className='col-md-6 mb-3'>
									<label className='form-label fw-bold required'>Billing Amount</label>
									<div className='input-group'>
										<span className='input-group-text'>₹</span>
										<input
											type='number'
											name='amount'
											className='form-control'
											value={planData.amount}
											onChange={handleInputChange}
											min={0}
										/>
										<span className='input-group-text'>per unit</span>
									</div>
									<small className='text-muted'>
										Billing amount and frequency can't be changed later.
									</small>
								</div>

								{/* Internal Notes */}
								<div className='col-12 mb-3'>
									<label className='form-label fw-bold'>Internal Notes</label>
									{Object.keys(planData.notes).map((key: any, index) => (
										<div
											key={index}
											className='d-flex mb-2'>
											<input
												type='text'
												placeholder='Title (key)'
												className='form-control me-2'
												value={key}
												onChange={(e) => handleNoteTitleChange(key, e.target.value)}
											/>
											<input
												type='text'
												placeholder='Description (value)'
												className='form-control'
												value={planData.notes[key]}
												onChange={(e) =>
													setPlanData((prevData: any) => ({
														...prevData,
														notes: {
															...prevData.notes,
															[key]: e.target.value,
														},
													}))
												}
											/>
										</div>
									))}

									<button
										type='button'
										className='btn btn-link'
										onClick={handleAddNote}>
										Add Internal Note
									</button>
								</div>

								{/* Action Buttons */}
								<div className='col-12 d-flex justify-content-start'>
									<TableButton
										action='add'
										onClick={handleAddButtonClick}
										text={isSubmitting ? 'Please wait, creating Plan...' : 'Add Plan'}
										className='btn-primary'
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default SubscriptionPlanAdd
