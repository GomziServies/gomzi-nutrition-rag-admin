import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import { GetSubscriptionPlan } from '../../../Functions/FGGroup/SubscriptionPlan'

interface PlanData {
	name: string
	description: string
	billingFrequency: string
	billingUnit: string
	billingAmount: number
	internalNotes: { title: string; description: string }[]
	course_name: string
	gateway: string
}

const SubscriptionPlanView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const plan_id: string | null = searchParams.get('plan_id')
	const [planData, setPlanData] = useState<PlanData>({
		name: '',
		description: '',
		billingFrequency: '',
		billingUnit: '',
		billingAmount: 0,
		internalNotes: [{ title: '', description: '' }],
		course_name: '',
		gateway: '',
	})

	const handleInputChange = (e: any) => {
		const { name, value } = e.target
		setPlanData({ ...planData, [name]: value })
	}

	const fetchPlanData = async () => {
		try {
			const response: any = await GetSubscriptionPlan({ id: String(plan_id) })
			const data = response.data[0]
			const setData = {
				name: data?.name,
				gateway: data?.gateway,
				description: data?.description,
				course_name: data?.fitness_course?.course_name,
				billingFrequency: data.interval,
				billingUnit: data.period,
				billingAmount: data?.amount,
				internalNotes: Object.keys(data.notes || {}).map((key) => ({
					title: key,
					description: data.notes[key],
				})),
			}
			setPlanData(setData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchPlanData()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>View Plan Data</PageTitle>
			<>
				<div className='row'>
					<div className='col-12 mt-3'>
						<div className='card py-5'>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-6 mb-3'>	
										<InputField
											placeholder='Payment Gateway'
											type='text'
											required={true}
											className='col-12'
											name='gateway'
											label='Payment Gateway'
											htmlFor='gateway'
											value={planData.gateway}
											onChange={handleInputChange}
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
											placeholder='Course Name'
											type='text'
											required={true}
											className='col-12'
											name='course_name'
											label='Course Name'
											htmlFor='course_name'
											value={planData.course_name}
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
												name='billingFrequency'
												className='form-control'
												value={planData.billingFrequency}
												onChange={handleInputChange}
												min={0}
											/>
											<select
												name='billingUnit'
												className='form-select ms-2'
												value={planData.billingUnit}
												onChange={handleInputChange}>
												<option value='daily'>Day(s)</option>
												<option value='weekly'>Week(s)</option>
												<option value='monthly'>Month(s)</option>
												<option value='yearly'>Year(s)</option>
											</select>
										</div>
									</div>
									<div className='col-md-6 mb-3'>
										<label className='form-label fw-bold required'>Billing Amount</label>
										<div className='input-group'>
											<span className='input-group-text'>₹</span>
											<input
												type='number'
												name='billingAmount'
												className='form-control'
												value={planData.billingAmount}
												onChange={handleInputChange}
												min={0}
											/>
											<span className='input-group-text'>per unit</span>
										</div>
									</div>
									{/* Internal Notes */}
									<div className='col-12 mb-3'>
										<label className='form-label fw-bold'>Internal Notes</label>
										{planData.internalNotes.length > 0 &&
											planData.internalNotes.map((note, index) => (
												<div
													key={index}
													className='d-flex mb-2'>
													<input
														type='text'
														placeholder='Title (key)'
														className='form-control me-2'
														value={note.title}
														readOnly
													/>
													<input
														type='text'
														placeholder='Description (value)'
														className='form-control'
														value={note.description}
														onChange={(e) =>
															setPlanData((prevData) => {
																const newNotes = [...prevData.internalNotes]
																newNotes[index].description = e.target.value
																return { ...prevData, internalNotes: newNotes }
															})
														}
													/>
												</div>
											))}
									</div>
									<div className='col-md-4'>
										<TableButton
											action='view'
											text='Go Back'
											to='/fgiit/plan'
											backgroundDark={true}
											showIcon={false}
											className='m-0'
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</>
		</>
	)
}

export default SubscriptionPlanView
