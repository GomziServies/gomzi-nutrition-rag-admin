import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import TableButton from '../../../components/TableButton'
import { CreateDietPlan, GetDietPlan, GetFoodCategory } from '../../../Functions/FWG'
import { DayJS } from '../../../../_metronic/helpers/Utils'

type Category = {
	_id: string
	category: string
}

const DietCreate: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const diet_id: string | any = searchParams.get('diet_id')
	const [categories, setCategories] = useState<Category[]>([])
	const [selectedTime, setSelectedTime] = useState('')
	const [userData, setUserData] = useState({
		user_id: '',
		user_name: '',
		assigned_on: '',
	})
	const [dietData, setDietData] = useState([
		{
			plan_name: '',
			category_id: '',
			food_type: '',
			days: '',
		},
	])

	useEffect(() => {
		fetchCategories()
		fetchTime()
	}, [])

	const fetchCategories = async () => {
		try {
			const response: any = await GetFoodCategory()
			setCategories(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchTime = async () => {
		try {
			const diet_response: any = await GetDietPlan({ id: diet_id })
			const userApprove = diet_response?.data.map((item: any) => item.diet_assigned_user).flat()
			const filteredData: any = userApprove.filter((item: any) => !item.status)

			setUserData({
				user_id: filteredData[0].user_id,
				user_name: filteredData[0]?.user_info.firstName + ' ' + filteredData[0]?.user_info.lastName,
				assigned_on: DayJS(filteredData[0].createdAt).format('DD/MM/YYYY hh:mm:ss A'),
			})
		} catch (error: any) {
			console.error(error)
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		if (name === 'food_time') {
			setSelectedTime(value)
		} else {
			setDietData((prevDietData) => prevDietData.map((data) => ({ ...data, [name]: value })))
		}
	}

	const handleCreateClick = async () => {
		try {
			const formDataWith: any = dietData
			await CreateDietPlan(formDataWith[0])
			toast.success('Diet Created Successfully')

			setDietData([
				{
					plan_name: '',
					category_id: '',
					food_type: '',
					days: '',
				},
			])

			navigate('/fwg/diet-details')
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Create Diet Plan</PageTitle>
			<div className='row mx-0 mt-5'>
				<KTCard>
					<div className='card-body mt-4 mb-4'>
						<div className='row'>
							<InputField
								placeholder='Diet Plan'
								type='text'
								className='col-md-6 fv-row mb-7'
								name='plan_name'
								label='Enter Diet Plan'
								htmlFor='plan_name'
								value={dietData[0].plan_name}
								onChange={handleInputChange}
							/>
							<SelectFieldManual
								className='col-md-6 fv-row mb-7'
								label='Category'
								name='category_id'
								value={dietData[0].category_id}
								onChange={handleInputChange}
								htmlFor='category_id'
								options={categories.map((category) => ({
									value: category._id,
									name: category.category,
								}))}
							/>
							<SelectField
								className='col-md-6 fv-row mb-7'
								label='Food Type'
								name='food_type'
								value={dietData[0].food_type}
								onChange={handleInputChange}
								htmlFor='food_type'
								options={['VEGETARIAN', 'NON-VEGETARIAN', 'VEGAN']}
							/>
							<InputField
								placeholder='Diet Plan'
								type='number'
								className='col-md-6 fv-row mb-7'
								name='days'
								label='Total Day (Duration)'
								htmlFor='days'
								value={dietData[0].days}
								onChange={handleInputChange}
							/>
						</div>
						<div className='text-end'>
							<TableButton
								action='add'
								onClick={handleCreateClick}
								text='Create'
							/>
						</div>
					</div>
				</KTCard>
			</div>
		</>
	)
}

export default DietCreate
