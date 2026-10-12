import { useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { CreateMembershipPlan } from '../../../Functions/FWG'
import TableButton from '../../../components/TableButton'

const AddMembershipPlan: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		name: '',
		duration: '',
		duration_unit: '',
		price: '',
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}
	const handleCreatePlan = async () => {
		try {
			setIsSubmitting(true)
			const payload: any = {
				name: formData.name,
				duration: Number(formData.duration),
				duration_unit: formData.duration_unit,
				price: Number(formData.price),
			}
			await CreateMembershipPlan(payload)

			toast.success('Plan create Successfully')

			setFormData({
				name: '',
				duration: '',
				duration_unit: '',
				price: '',
			})
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Membership Plan Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<div className="row justify-content-end">
								<div className="col-12">
									<div className='row'>
										<div className='col-md-4 fv-row'>
											<InputField
												placeholder='Plan Name'
												type='text'
												className='mb-7 w-100 fv-row'
												name='name'
												label='Plan Name'
												htmlFor='name'
												value={formData.name}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4 fv-row'>
											<InputField
												placeholder='Price'
												type='number'
												className='mb-7 w-100 fv-row'
												name='price'
												label='Price'
												htmlFor='price'
												value={formData.price}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4 fv-row mt-3'>
											<label
												htmlFor='dfsf'
												className='required fw-bold fs-6 mb-2'>
												Assigned Plan
											</label>
											<select
												className='mb-7 form-control form-select form-control-solid w-100 fv-row'
												autoComplete='off'>
												<option>Select Assigned Plan</option>
											</select>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='Duration'
												type='number'
												className='mb-7 w-100 fv-row'
												name='duration'
												label='Duration'
												htmlFor='duration'
												value={formData.duration}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<SelectField
												className='mb-7 w-100 fv-row'
												label='Duration Unit'
												name='duration_unit'
												value={formData.duration_unit}
												onChange={handleInputChange}
												htmlFor='duration_unit'
												options={['DAY', 'MONTH', 'YEAR']}
											/>
										</div>
									</div>
								</div>
								<div className='col-md-2 fv-row'>
									<TableButton
										action="add"
										onClick={handleCreatePlan}
										text={isSubmitting ? 'Please wait, creating Plan...' : 'Add Plan'}
										showIcon={false}
										disabled={isSubmitting}
										className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
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

export { AddMembershipPlan }
