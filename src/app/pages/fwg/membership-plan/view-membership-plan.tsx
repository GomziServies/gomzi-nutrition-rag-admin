import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import {
	AssignMembershipPlan,
	GetAssignedMembershipPlan,
	GetFranchiseUser,
	GetMembershipPlan,
	GetPlanBundle,
	UpdateMembershipPlan,
	WithdrawAssignedMembershipPlan,
} from '../../../Functions/FWG'
import TableButton from '../../../components/TableButton'
import Swal from 'sweetalert2'

const ViewMembershipPlan: React.FC = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isSubmittingAssign, setIsSubmittingAssign] = useState(false)
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const plan_id: string | any = searchParams.get('plan_id')
	const [planBundleData, setPlanBundleData] = useState<any>([])
	const [planBundleoptionData, setPlanBundleoptionData] = useState<any>([])
	const [formData, setFormData] = useState({
		name: '',
		duration: '',
		duration_unit: '',
		price: '',
		assigned_plan_bundle: '',
	})
	const [formAssignData, setFormAssignData] = useState<any>([])
	const [formAssignAddData, setFormAssignAddData] = useState<any>({ duration_unit: '' })

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleInputAssignUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setFormAssignAddData({ ...formAssignAddData, [name]: value })
	}

	const planOptions = planBundleData.map((bundle: any) => ({
		value: bundle._id,
		name: bundle.firstName + ' ' + bundle.lastName,
	}))

	const planBundleOptions = planBundleoptionData.map((bundle: any) => ({
		value: bundle._id,
		name: bundle.plan_title,
	}))

	const fetchPlanBundleResult = async () => {
		try {
			const response: any = await GetFranchiseUser()
			const data: any = response.data
			setPlanBundleData(data)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchPlanBundle = async () => {
		try {
			const response: any = await GetPlanBundle()
			const data: any = response.data
			setPlanBundleoptionData(data)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchPlanBundleResult()
		fetchPlanBundle()
	}, [])

	const handleUpdateData = async () => {
		try {
			setIsSubmitting(true)
			const formDataWith: any = formData
			const payload: any = {
				id: formDataWith._id,
				name: formDataWith.name,
				duration: Number(formDataWith.duration),
				duration_unit: formDataWith.duration_unit,
				price: Number(formDataWith.price),
				assigned_plan_bundle: formDataWith.assigned_plan_bundle,
			}
			await UpdateMembershipPlan(payload)
			toast.success('Membership Update Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const handleAssignUpdateData = async () => {
		try {
			setIsSubmittingAssign(true)

			const payload: any = {
				plan_id: plan_id,
				franchise_id: formAssignAddData.duration_unit
			}
			await AssignMembershipPlan(payload)
			toast.success('Membership Assign Successfully')
			fetchAssignMemberShipData()
			setFormAssignAddData({ duration_unit: '' })
			setIsSubmittingAssign(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmittingAssign(false)
			console.error(error)
		}
	}

	const handleDeleteAssign = async (_id: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once deleted, you will not be able to recover!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await WithdrawAssignedMembershipPlan({ id: _id })
					toast.success('Assigned Membership Remove Successfully')
					fetchAssignMemberShipData()
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	const fetchUserData = async () => {
		try {
			const response: any = await GetMembershipPlan({ id: plan_id })
			const data = response.data
			const plan = data || ''

			setFormData({
				name: plan.name,
				duration: plan.duration,
				duration_unit: plan.duration_unit,
				price: plan.price,
				...data,
			})
		} catch (error) {
			console.error(error)
		}
	}

	const fetchAssignMemberShipData = async () => {
		try {
			const response: any = await GetAssignedMembershipPlan()
			const data = response.data

			setFormAssignData(data)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
		fetchAssignMemberShipData()
	}, [])

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Membership Plan Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card'>
						<div className='card-body'>
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
										onChange={handleInputUpdateChange}
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
										onChange={handleInputUpdateChange}
									/>
								</div>
								<div className='col-md-4 fv-row'>
									<SelectFieldManual
										className='mb-7 w-100 fv-row'
										label='Assigned Plan Bundle'
										name='assigned_plan_bundle'
										value={formData.assigned_plan_bundle}
										onChange={handleInputUpdateChange}
										htmlFor='assigned_plan_bundle'
										options={planBundleOptions}
									/>
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
										onChange={handleInputUpdateChange}
									/>
								</div>
								<div className='col-md-6 fv-row'>
									<SelectField
										className='mb-7 w-100 fv-row'
										label='Duration Unit'
										name='duration_unit'
										value={formData.duration_unit}
										onChange={handleInputUpdateChange}
										htmlFor='duration_unit'
										options={['DAY', 'MONTH', 'YEAR']}
									/>
								</div>
								<div className='col'></div>
								<div className='col-md-12 text-end fv-row'>
									<TableButton
										action="edit"
										onClick={() => handleUpdateData()}
										text={isSubmitting ? 'Please wait, Updating Plan Bundle...' : 'Update Plan Bundle'}
										showIcon={false}
										disabled={isSubmitting}
										backgroundDark={true}
										className={`mb-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
									/>
								</div>
								<div className='col'></div>
							</div>
						</div>
					</div>
				</div>
				<div className='col-12 mt-7'>
					<div className='card'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-6 fv-row'>
									<SelectFieldManual
										className='mb-7 w-100 fv-row'
										label='Assigned Plan'
										name='duration_unit'
										value={formAssignAddData.duration_unit}
										onChange={handleInputAssignUpdateChange}
										htmlFor='duration_unit'
										options={planOptions}
									/>
								</div>
								<div className='col-md-6 mt-12 fv-row'>
									<TableButton
										action="edit"
										onClick={() => handleAssignUpdateData()}
										text={isSubmittingAssign ? 'Please wait, Assign...' : 'Assign'}
										showIcon={false}
										disabled={isSubmittingAssign}
										backgroundDark={true}
										className={`mb-4 btn-block ${isSubmittingAssign ? 'disabled' : ''}`}
									/>
								</div>
							</div>
							{
								formAssignData.map((assign: any, index: any) => {
									return <div className='row'>
										<div className='col-md-6 fv-row'>
											<InputField
												placeholder='Duration'
												type='text'
												className='w-100 fv-row'
												name='duration'
												htmlFor='duration'
												value={`${assign.franchise_user.firstName} ${assign.franchise_user.lastName}`}
												onChange={handleInputUpdateChange}
												disabled
											/>
										</div>
										<div className='col-md-6 mt-8 fv-row'>
											<TableButton
												action="remove"
												backgroundDark={true}
												onClick={() => handleDeleteAssign(assign._id)}
											/>
										</div>
									</div>
								})
							}

						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { ViewMembershipPlan }
