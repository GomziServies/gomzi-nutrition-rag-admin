import { useEffect, useState } from 'react'
import {  useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { GetEmployeeApplication } from '../../../Functions/FGGroup'
import TableButton from '../../../components/TableButton'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const EmployeeView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employee_id: string | any = searchParams.get('employee_id')
	const [formData, setFormData] = useState({
		_id: '',
		name: '',
		email: '',
		mobile: '',
		createdAt: '',
		type: '',
		location: '',
		expected_salary: '',
		job_post: '',
		experience: '',
		gender: '',
		age: '',
		skill: '',
	})

	const fetchEmployeeData = async () => {
		try {
			const response: any = await GetEmployeeApplication({ id: employee_id })
			const data = response.data[0]
			setFormData(data)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Application View</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-12'>
									<div className='row'>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Name'
												type='text'
												className='fv-row'
												name='name'
												label='Name'
												htmlFor='name'
												value={formData.name}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Email'
												type='text'
												className='fv-row'
												name='email'
												label='Email'
												htmlFor='email'
												value={formData.email}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Phone number'
												type='text'
												className='fv-row'
												name='mobile'
												label='Phone number'
												htmlFor='mobile'
												value={formData.mobile}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Application Date'
												type='text'
												className='fv-row'
												name='createdAt'
												label='Application Date'
												htmlFor='Application Date'
												value={DayJS(formData.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Expected Salary'
												type='text'
												className='fv-row'
												name='expected_salary'
												label='Expected Salary'
												htmlFor='expected_salary'
												value={formData.expected_salary}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Location'
												type='text'
												className='fv-row'
												name='location'
												label='Location'
												htmlFor='location'
												value={formData.location}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Job Post'
												type='text'
												className='fv-row'
												name='type'
												label='Job Post'
												htmlFor='type'
												value={formData.type}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Experience'
												type='text'
												className='fv-row'
												name='experience'
												label='Experience'
												htmlFor='experience'
												value={formData.experience}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Gender'
												type='text'
												className='fv-row'
												name='gender'
												label='Gender'
												htmlFor='gender'
												value={formData.gender}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Age'
												type='text'
												className='fv-row'
												name='age'
												label='Age'
												htmlFor='age'
												value={formData.age}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Enter Skill'
												type='text'
												className='fv-row'
												name='skill'
												label='Skill'
												htmlFor='skill'
												value={formData.skill}
												onChange={handleInputChange}
												readOnly
											/>
										</div>
									</div>
								</div>
							</div>
							<div className='col-md-12 fv-row mt-5 mb-2 d-flex justify-content-end'>
								<TableButton
									action="view"
									to='/fgiit/employee-inquiry'
									text="Go Back"
									showIcon={false}
									backgroundDark={true}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export { EmployeeView }
