import { useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import { CreateLeadAutomation } from '../../../Functions/FGGroup'

const FacebookAutomationCreate = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState<any>({})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setFormData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleAddButtonClick = async () => {
		try {
			setIsSubmitting(true)

			const payload: any = {
				title: formData.title,
				ads_id: formData.ads_id,
				ads_category: formData.ads_category,
			}

			await CreateLeadAutomation(payload)

			toast.success('Create Workflow Successfully')

			setFormData({
				ads_id: '',
				title: '',
				ads_category: '',
			})
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const ad_category = [
		{ value: 'fgiit', name: 'FGIIT' },
		{ value: 'fwg', name: 'FWG' },
		{ value: 'gomzi_nutrition', name: 'Gomzi Nutrition' },
		{ value: 'cryo', name: 'Cryo' },
		{ value: 'injury_rehab', name: 'Injury Rehab' },
		{ value: 'flexible_nutri_trainer', name: 'Flexible Nutri-Trainer' },
		{ value: 'online_anabolic_course', name: 'Online Anabolic Course' },
		{ value: 'anabolic_book', name: 'Anabolic Book' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Facebook Ad Automation</PageTitle>

			<div className='card mb-5 mb-xl-10'>
				<div className='card-header row border-0'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Create Automation</h3>
					</div>
				</div>
				<div
					id='kt_oder_view'
					className='collapse show'>
					<div className='card-body border-top p-9'>
						<div className='row'>
							<div className='col-md-12'>
								<InputField
									placeholder='Ad Title'
									type='text'
									className='mb-7 w-100 fv-row'
									name='title'
									label='Ad Title'
									htmlFor='franchise_name'
									value={formData.title}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-12'>
								<InputField
									placeholder='Ad ID'
									type='text'
									className='mb-7 w-100 fv-row'
									name='ads_id'
									label='Ad ID'
									htmlFor='franchise_name'
									value={formData.ads_id}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-12'>
								<SelectFieldManual
									className='fv-row'
									label='Catagories'
									name='ads_category'
									value={formData.ads_category}
									onChange={handleInputChange}
									htmlFor='ads_category'
									options={ad_category}
								/>
							</div>
							<div className='col-md-12 fv-row mb-7'>
								<div className='modal-footer justify-content-start mt-3'>
									<TableButton
										action='add'
										onClick={handleAddButtonClick}
										text={isSubmitting ? 'Please wait, creating...' : 'Create'}
										showIcon={false}
										disabled={isSubmitting}
										backgroundDark={true}
										className={`mb-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
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
export { FacebookAutomationCreate }
